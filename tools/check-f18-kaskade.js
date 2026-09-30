'use strict';

/**
 * check-f18-kaskade — Design-Handoff v3, UAT-Einheit U2
 *
 * WARUM ES DIESES WERKZEUG GIBT. Commit f514ba4 ("Dubletten zusammengefuehrt",
 * F-18) hat 131 Deklarationen nach einer Regel verschoben, die in
 * `tests/unit/design-consistency.test.js` so festgehalten ist: "der spaetere
 * Block bleibt — er gewann ohnehin jede widersprechende Eigenschaft —,
 * Eigenschaften die nur der fruehere setzte wandern hinein".
 *
 * Die Begruendung stimmt nur fuer den Vergleich DER ZWEI KOPIEN. Sie ist
 * falsch, sobald zwischen ihnen eine DRITTE Regel gleicher Spezifitaet stand,
 * die dieselbe Eigenschaft setzt: gegen die hatte die fruehere Kopie verloren
 * (gleiche Spezifitaet, die Dritte stand spaeter), nach dem Umzug gewinnt sie.
 * Genau das war Fund F2 der UAT — `.view.active { display: block }` wanderte von
 * core.css (3. @import) nach dmscreen.css (12.) und nahm damit vier
 * Ansichts-Schalen ihr `display: flex`; deren Listen waren ab dem 10. Eintrag
 * nicht mehr erreichbar.
 *
 * DIE ENTSCHEIDENDE FEINHEIT: eine uebersprungene Dritte mit HOEHERER
 * Spezifitaet ist unbedenklich (sie gewann vorher und gewinnt nachher), eine
 * mit NIEDRIGERER ebenfalls (sie verlor vorher und verliert nachher). Nur bei
 * EXAKT GLEICHER Spezifitaet und gleichem `!important`-Rang kehrt sich das
 * Urteil um. Der bekannte Fall `.modal-overlay { display: none }` (nach
 * dmscreen.css:729 verschoben) gegen das frueher stehende
 * `.modal-overlay.show { display: flex }` (dashboard.css) ist deshalb KEIN
 * Befund: `.show` traegt eine Klasse mehr. Eine Pruefung, die ihn meldet, ist
 * zu grob.
 *
 * ZWEI BETRIEBSARTEN:
 *
 *   node tools/check-f18-kaskade.js --verlauf [--alt <ref>] [--neu <ref>] [--alle]
 *       Verlaufsanalyse. Braucht Git-Historie. Vergleicht die Kaskade zweier
 *       Baeume und meldet jede Deklaration, deren Verhaeltnis zu einer
 *       gleich spezifischen Konkurrentin sich durch den Umzug UMGEKEHRT hat.
 *       Ohne `--alle` nur die mit `F-18: aus der Dublette uebernommen`
 *       markierten Deklarationen; mit `--alle` jede Deklaration, die in
 *       beiden Baeumen vorkommt (so werden auch spaetere Umzuege geprueft,
 *       etwa die Korrekturen dieser Einheit selbst).
 *
 *   node tools/check-f18-kaskade.js --check | --json | --write
 *       WAECHTER, ohne Git. Erhebt aus dem Arbeitsbaum das Verzeichnis aller
 *       Reihenfolge-Abhaengigkeiten gleicher Spezifitaet: Paare von
 *       Deklarationen, bei denen allein die Ladereihenfolge entscheidet,
 *       welcher Wert gilt. Genau in dieser Menge lebt die F-18-Klasse. Jede
 *       NEUE und jede UMGEDREHTE Abhaengigkeit ist eine Abweichung vom
 *       eingefrorenen Stand in `tests/fixtures/f18-kaskade-basis.json`.
 *       `--write` schreibt den Stand neu (nur nach bewusster Entscheidung),
 *       `--json` gibt ihn maschinenlesbar aus.
 *
 * Die Kaskadenreihenfolge ist die des `@import`-Hubs in `assets/styles.css`,
 * NICHT die alphabetische Dateireihenfolge.
 *
 * WER DAS WERKZEUG FAEHRT. `tests/unit/f18-kaskade.test.js` ruft
 * `abhaengigkeiten()` und `pruefe()` gegen dieselbe Sollstand-Datei auf und
 * laeuft in `npm run test` und damit in der CI mit. Die `--check`-Fassade hier
 * ist die Handfassung derselben Pruefung, keine zweite Wahrheit — und keine
 * Faehigkeit, die niemand fuehrt.
 *
 * Formvorbild: `tools/css-usage-report.js` und `tools/sync-aktenlage-anker.js`
 * (strikter Modus, nur Node-Standardmodule, benannte Konstanten fuer Pfade,
 * Kernfunktionen einzeln exportiert, Direktaufruf-Zweig am Ende).
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const REPO = path.join(__dirname, '..');
const HUB = path.join(REPO, 'assets', 'styles.css');
const CSS_DIR = path.join(REPO, 'assets', 'styles');
const BASIS = path.join(REPO, 'tests', 'fixtures', 'f18-kaskade-basis.json');
const MARKER = 'F-18: aus der Dublette uebernommen';
// Blockweite Markierung. Die drei in U2 zurueckverlegten Bloecke tragen ihre
// F-18-Herkunft nicht mehr je Deklaration — sie stehen wieder vollstaendig an
// ihrem urspruenglichen Platz. Bewacht werden muessen sie trotzdem: ihre
// STELLUNG ist die Korrektur. Dieser Kommentar irgendwo im Regelblock stellt
// jede seiner Deklarationen unter dieselbe Ratsche.
const BLOCK_MARKER = 'F-18-BEWACHT';

// Quellen fuer das Element-Inventar. Ein Selektorpaar gilt nur dann als
// kollidierend, wenn im Bestand ein Element existiert, das BEIDE treffen kann.
const MARKUP_QUELLEN = ['assets/templates', 'features', 'ui', 'systems', 'core', 'render', 'utils'];

// ----------------------------------------------------------------------
// 1. Kaskadenreihenfolge und Zerlegung
// ----------------------------------------------------------------------

/** Dateinamen in @import-Reihenfolge aus dem Hub lesen. */
function kaskadeOrdnung(hubText) {
    return [...hubText.matchAll(/@import\s+url\(\s*['"]styles\/([^'"]+)['"]\s*\)/g)].map(m => m[1]);
}

/**
 * Zerlegt eine CSS-Datei in einzelne Deklarationen mit @-Kontext, Selektor,
 * Zeile und laufender Kaskadennummer. Zeichenweise, damit einzeilige Regeln
 * (`.a { margin: 0; color: red; }`) genauso erfasst werden wie mehrzeilige.
 * Ein nachgestellter Kommentar auf derselben Zeile gehoert zur Deklaration
 * davor — nur so wird die F-18-Markierung ihrer Deklaration zugeordnet.
 */
function deklarationen(css, datei, dateiIndex, zaehler) {
    const out = [];
    const zeileAn = pos => css.slice(0, pos).split('\n').length;
    let i = 0;
    const stapel = [];
    while (i < css.length) {
        if (css.startsWith('/*', i)) {
            const j = css.indexOf('*/', i);
            i = j === -1 ? css.length : j + 2;
            continue;
        }
        if (css[i] === '}') {
            stapel.pop();
            i++;
            continue;
        }
        if (/\s/.test(css[i])) {
            i++;
            continue;
        }
        const m = /^[^{}]*\{/.exec(css.slice(i));
        if (!m) {
            i++;
            continue;
        }
        const kopf = m[0]
            .slice(0, -1)
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (kopf.startsWith('@')) {
            stapel.push(kopf);
            i += m[0].length;
            continue;
        }
        let tiefe = 1;
        let j = i + m[0].length;
        while (j < css.length && tiefe) {
            if (css[j] === '{') tiefe++;
            else if (css[j] === '}') tiefe--;
            j++;
        }
        const bodyStart = i + m[0].length;
        const body = css.slice(bodyStart, j - 1);
        const ctx = stapel.join(' | ') || '(top)';
        const blockBewacht = body.includes(BLOCK_MARKER);
        let k = 0;
        let puffer = '';
        let anfang = 0;
        const abgeben = () => {
            const roh = puffer;
            puffer = '';
            const dm = /^\s*([-\w]+)\s*:\s*([\s\S]+)$/.exec(roh.replace(/\/\*[\s\S]*?\*\//g, ''));
            if (!dm) return;
            const wert = dm[2].trim();
            out.push({
                datei,
                dateiIndex,
                ctx,
                selektorListe: kopf,
                zeile: zeileAn(bodyStart + anfang),
                prop: dm[1].toLowerCase(),
                wert: wert.replace(/!\s*important/i, '').trim().replace(/\s+/g, ' '),
                important: /!\s*important/i.test(wert),
                marker: blockBewacht,
                ordnung: zaehler.n++
            });
        };
        while (k < body.length) {
            if (body.startsWith('/*', k)) {
                const e = body.indexOf('*/', k);
                puffer += body.slice(k, e === -1 ? body.length : e + 2);
                k = e === -1 ? body.length : e + 2;
                continue;
            }
            if (body[k] === ';') {
                abgeben();
                k++;
                const nach = /^[ \t]*\/\*[\s\S]*?\*\//.exec(body.slice(k));
                if (nach) {
                    if (nach[0].includes(MARKER) && out.length) out[out.length - 1].marker = true;
                    k += nach[0].length;
                }
                anfang = k;
                continue;
            }
            if (puffer === '') anfang = k;
            puffer += body[k];
            k++;
        }
        abgeben();
        i = j;
    }
    return out;
}

/** Ganzen Baum in Kaskadenreihenfolge zerlegen. `lies(datei)` gibt Text oder null. */
function baum(lies, ordnung) {
    const zaehler = { n: 0 };
    const alle = [];
    ordnung.forEach((datei, idx) => {
        const txt = lies(datei);
        if (txt === null || txt === undefined) return;
        alle.push(...deklarationen(txt, datei, idx, zaehler));
    });
    return alle;
}

// ----------------------------------------------------------------------
// 2. Spezifitaet
// ----------------------------------------------------------------------

const PSEUDO_ELEMENTE = new Set([
    'before', 'after', 'first-line', 'first-letter', 'placeholder', 'selection', 'backdrop', 'marker'
]);

/** Spezifitaet eines EINZELNEN Selektors als [ids, klassen, elemente]. */
function spezifitaet(sel) {
    let s = sel.replace(/\s+/g, ' ').trim();
    let a = 0;
    let b = 0;
    let c = 0;
    s = s.replace(/:(?:not|is|has)\(([^()]*)\)/gi, (_, inner) => {
        const best = inner.split(',').map(x => spezifitaet(x.trim())).sort(vergleichSpez).pop() || [0, 0, 0];
        a += best[0];
        b += best[1];
        c += best[2];
        return ' ';
    });
    s = s.replace(/:where\([^()]*\)/gi, ' ');
    a += (s.match(/#[-\w]+/g) || []).length;
    s = s.replace(/#[-\w]+/g, ' ');
    b += (s.match(/\.[-\w]+/g) || []).length;
    s = s.replace(/\.[-\w]+/g, ' ');
    b += (s.match(/\[[^\]]*\]/g) || []).length;
    s = s.replace(/\[[^\]]*\]/g, ' ');
    c += (s.match(/::[-\w]+/g) || []).length;
    s = s.replace(/::[-\w]+/g, ' ');
    for (const p of s.match(/:[-\w]+/g) || []) {
        if (PSEUDO_ELEMENTE.has(p.slice(1))) c++;
        else b++;
    }
    s = s.replace(/:[-\w]+(\([^()]*\))?/g, ' ');
    c += (s.match(/(^|[\s>+~])[a-zA-Z][-\w]*/g) || []).length;
    return [a, b, c];
}

function vergleichSpez(x, y) {
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

// ----------------------------------------------------------------------
// 3. Kurzschreibweisen — ohne diese Karte gilt `border-color` als von
//    `border` nicht gesetzt. Genau dieser Fehler hat in f514ba4 aus einem
//    gruenen Rahmen einen goldenen gemacht (dort in der Commit-Botschaft
//    festgehalten).
// ----------------------------------------------------------------------

const KURZ = {
    margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
    padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
    inset: ['top', 'right', 'bottom', 'left'],
    border: ['border-width', 'border-style', 'border-color'],
    'border-width': ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'],
    'border-style': ['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'],
    'border-color': ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'],
    'border-top': ['border-top-width', 'border-top-style', 'border-top-color'],
    'border-right': ['border-right-width', 'border-right-style', 'border-right-color'],
    'border-bottom': ['border-bottom-width', 'border-bottom-style', 'border-bottom-color'],
    'border-left': ['border-left-width', 'border-left-style', 'border-left-color'],
    'border-radius': [
        'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'
    ],
    background: [
        'background-color', 'background-image', 'background-position', 'background-size', 'background-repeat',
        'background-attachment', 'background-clip', 'background-origin'
    ],
    font: ['font-style', 'font-variant', 'font-weight', 'font-size', 'line-height', 'font-family'],
    flex: ['flex-grow', 'flex-shrink', 'flex-basis'],
    'flex-flow': ['flex-direction', 'flex-wrap'],
    gap: ['row-gap', 'column-gap'],
    grid: [
        'grid-template-rows', 'grid-template-columns', 'grid-template-areas', 'grid-auto-rows', 'grid-auto-columns',
        'grid-auto-flow'
    ],
    'grid-template': ['grid-template-rows', 'grid-template-columns', 'grid-template-areas'],
    'grid-area': ['grid-row-start', 'grid-column-start', 'grid-row-end', 'grid-column-end'],
    'grid-row': ['grid-row-start', 'grid-row-end'],
    'grid-column': ['grid-column-start', 'grid-column-end'],
    transition: ['transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay'],
    animation: [
        'animation-name', 'animation-duration', 'animation-timing-function', 'animation-delay',
        'animation-iteration-count', 'animation-direction', 'animation-fill-mode', 'animation-play-state'
    ],
    outline: ['outline-width', 'outline-style', 'outline-color'],
    overflow: ['overflow-x', 'overflow-y'],
    'list-style': ['list-style-type', 'list-style-position', 'list-style-image'],
    'text-decoration': [
        'text-decoration-line', 'text-decoration-style', 'text-decoration-color', 'text-decoration-thickness'
    ],
    'place-items': ['align-items', 'justify-items'],
    'place-content': ['align-content', 'justify-content'],
    'place-self': ['align-self', 'justify-self']
};

function langformen(prop) {
    const out = new Set([prop]);
    const stapel = [prop];
    while (stapel.length) {
        const p = stapel.pop();
        for (const l of KURZ[p] || []) {
            if (!out.has(l)) {
                out.add(l);
                stapel.push(l);
            }
        }
    }
    return out;
}

function propsSchneiden(a, b) {
    if (a === b) return true;
    const A = langformen(a);
    for (const x of langformen(b)) if (A.has(x)) return true;
    return false;
}

// ----------------------------------------------------------------------
// 4. Element-Inventar: welche Klassen stehen im Bestand zusammen an EINEM
//    Element? Ohne das melden `.char-tag` und `.char-action-btn` eine
//    Kollision, die kein Element je traegt (4726 statt 49 Kandidaten,
//    nachgemessen).
// ----------------------------------------------------------------------

function dateienRekursiv(wurzel, endungen) {
    const out = [];
    if (!fs.existsSync(wurzel)) return out;
    for (const e of fs.readdirSync(wurzel, { withFileTypes: true })) {
        const p = path.join(wurzel, e.name);
        if (e.isDirectory()) out.push(...dateienRekursiv(p, endungen));
        else if (endungen.some(x => e.name.endsWith(x))) out.push(p);
    }
    return out;
}

function elementInventar(repo = REPO) {
    const elemente = [];
    const markupKlassen = new Set();
    const laufzeitAttr = new Set();
    const hinzu = new Set();
    const weg = new Set();
    const umgeschaltet = new Set();
    const tokens = s => s.replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).filter(t => t && /^[-\w]+$/.test(t));

    for (const q of MARKUP_QUELLEN) {
        for (const f of dateienRekursiv(path.join(repo, q), ['.html', '.js'])) {
            const txt = fs.readFileSync(f, 'utf8');
            for (const m of txt.matchAll(/<([a-zA-Z][-\w]*)((?:[^<>'"]|'[^']*'|"[^"]*")*)>/g)) {
                const attrs = m[2];
                const cm = /class\s*=\s*"([^"]*)"|class\s*=\s*'([^']*)'/.exec(attrs);
                const im = /\sid\s*=\s*"([^"]*)"|\sid\s*=\s*'([^']*)'/.exec(attrs);
                const klassen = new Set(tokens(cm ? (cm[1] ?? cm[2]) : ''));
                const id = im ? (im[1] ?? im[2]).replace(/\$\{[^}]*\}/g, '').trim() : null;
                const attribute = new Map();
                for (const a of attrs.matchAll(/([-\w:]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
                    attribute.set(a[1].toLowerCase(), (a[2] ?? a[3] ?? '').trim());
                }
                klassen.forEach(k => markupKlassen.add(k));
                elemente.push({ tag: m[1].toLowerCase(), klassen, id: id || null, attribute });
            }
            // `.className = 'a b c'` belegt eine Mitbelegung genauso wie ein
            // class-Attribut — nur ohne bekanntes Tag.
            for (const m of txt.matchAll(/\.className\s*\+?=\s*['"`]([^'"`]*)['"`]/g)) {
                const ks = tokens(m[1]);
                if (!ks.length) continue;
                ks.forEach(k => markupKlassen.add(k));
                elemente.push({ tag: null, klassen: new Set(ks), id: null, attribute: new Map() });
            }
            for (const m of txt.matchAll(/classList\s*\.\s*(add|remove|toggle|replace)\s*\(([^)]*)\)/g)) {
                const ziel = m[1] === 'toggle' ? umgeschaltet : m[1] === 'remove' ? weg : hinzu;
                for (const s of m[2].matchAll(/['"`]([^'"`]*)['"`]/g)) tokens(s[1]).forEach(t => ziel.add(t));
            }
            for (const m of txt.matchAll(/setAttribute\s*\(\s*['"`]([-\w:]+)['"`]/g)) laufzeitAttr.add(m[1].toLowerCase());
        }
    }
    // Zustandsklassen werden zur Laufzeit an- und abgeschaltet und koennen
    // daher an jedem Element auftreten (`active`, `show`, `open`, ...).
    // Strukturklassen nicht: die muessen im Bestand belegt zusammenstehen.
    const zustand = new Set([...umgeschaltet]);
    hinzu.forEach(k => {
        if (weg.has(k)) zustand.add(k);
    });
    const bekannt = new Set([...markupKlassen, ...hinzu, ...weg, ...umgeschaltet]);
    const nachKlasse = new Map();
    elemente.forEach((el, i) => {
        el.klassen.forEach(k => {
            if (!nachKlasse.has(k)) nachKlasse.set(k, []);
            nachKlasse.get(k).push(i);
        });
    });
    return { elemente, markupKlassen, laufzeitAttr, zustand, bekannt, nachKlasse };
}

// ----------------------------------------------------------------------
// 5. Ueberlappung zweier Selektoren
// ----------------------------------------------------------------------

/** Letztes Kompound eines Selektors — das Element, um das es geht. */
function subjekt(sel) {
    const teile = sel.trim().split(/\s*[>+~]\s*|\s+/).filter(Boolean);
    return teile[teile.length - 1] || sel;
}

function zerlegeKompound(kompound) {
    const negativ = [];
    let s = kompound.replace(/:not\(([^()]*)\)/gi, (_, inner) => {
        negativ.push(...inner.split(',').map(x => x.trim()));
        return ' ';
    });
    const ids = (s.match(/#[-\w]+/g) || []).map(x => x.slice(1));
    s = s.replace(/#[-\w]+/g, ' ');
    const klassen = (s.match(/\.[-\w]+/g) || []).map(x => x.slice(1));
    s = s.replace(/\.[-\w]+/g, ' ');
    const attrs = s.match(/\[[^\]]*\]/g) || [];
    s = s.replace(/\[[^\]]*\]/g, ' ');
    const pseudo = s.match(/::?[-\w]+(\([^()]*\))?/g) || [];
    s = s.replace(/::?[-\w]+(\([^()]*\))?/g, ' ');
    const tag = (s.match(/[a-zA-Z][-\w]*/) || [null])[0];
    return { tag: tag === '*' ? null : tag, ids, klassen, attrs, pseudo, negativ };
}

function istPseudoElement(p) {
    return /^::/.test(p) || PSEUDO_ELEMENTE.has(p.replace(/^:+/, '').replace(/\(.*/, ''));
}

/** Syntaktischer Ausschluss: widersprechen sich die beiden Subjekte? */
function syntaktischDisjunkt(selA, selB) {
    const A = zerlegeKompound(subjekt(selA));
    const B = zerlegeKompound(subjekt(selB));
    if (A.tag && B.tag && A.tag.toLowerCase() !== B.tag.toLowerCase()) return true;
    if (A.ids.length && B.ids.length && A.ids.slice().sort().join() !== B.ids.slice().sort().join()) return true;
    const widerspricht = (neg, Z) =>
        neg.some(n => {
            const z = zerlegeKompound(n);
            return (
                z.klassen.some(k => Z.klassen.includes(k)) ||
                z.ids.some(k => Z.ids.includes(k)) ||
                z.pseudo.some(p => Z.pseudo.includes(p)) ||
                (z.tag && Z.tag && z.tag === Z.tag)
            );
        });
    if (widerspricht(A.negativ, B) || widerspricht(B.negativ, A)) return true;
    const aPE = A.pseudo.filter(istPseudoElement).map(p => p.replace(/^:+/, '')).sort().join();
    const bPE = B.pseudo.filter(istPseudoElement).map(p => p.replace(/^:+/, '')).sort().join();
    return aPE !== bPE;
}

function kompoundPasst(z, el, inv) {
    if (z.tag && el.tag && z.tag.toLowerCase() !== el.tag.toLowerCase()) return false;
    if (z.ids.length && (!el.id || !z.ids.includes(el.id))) return false;
    for (const k of z.klassen) {
        if (el.klassen.has(k)) continue;
        if (inv.zustand.has(k)) continue;
        return false;
    }
    for (const a of z.attrs) {
        const b = attrBedingung(a);
        if (b && !attrPasst(b, el, inv)) return false;
    }
    return true;
}

function attrBedingung(roh) {
    const m = /^\[\s*([-\w:]+)\s*(?:([~^$*|]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]]*)))?\s*\]$/.exec(roh.trim());
    if (!m) return null;
    return {
        name: m[1].toLowerCase(),
        op: m[2] || null,
        wert: (m[3] ?? m[4] ?? m[5] ?? '').trim().replace(/^['"]|['"]$/g, '')
    };
}

function attrPasst(b, el, inv) {
    if (!el.attribute.has(b.name)) return inv.laufzeitAttr.has(b.name);
    if (!b.op) return true;
    const v = el.attribute.get(b.name);
    switch (b.op) {
        case '=':
            return v === b.wert;
        case '~=':
            return v.split(/\s+/).includes(b.wert);
        case '^=':
            return v.startsWith(b.wert);
        case '$=':
            return v.endsWith(b.wert);
        case '*=':
            return v.includes(b.wert);
        case '|=':
            return v === b.wert || v.startsWith(b.wert + '-');
        default:
            return true;
    }
}

/** Kann im Bestand EIN Element beide Selektoren treffen? */
function ueberlappt(selA, selB, inv) {
    if (syntaktischDisjunkt(selA, selB)) return null;
    const A = zerlegeKompound(subjekt(selA));
    const B = zerlegeKompound(subjekt(selB));
    const alle = [...new Set([...A.klassen, ...B.klassen])];
    for (const k of alle) if (!inv.bekannt.has(k)) return null;
    const pflicht = alle.filter(k => !inv.zustand.has(k));
    let kandidaten;
    if (!pflicht.length) {
        kandidaten = inv.elemente.map((_, i) => i);
    } else {
        kandidaten = (inv.nachKlasse.get(pflicht[0]) || []).slice();
        for (let i = 1; i < pflicht.length; i++) {
            const s = new Set(inv.nachKlasse.get(pflicht[i]) || []);
            kandidaten = kandidaten.filter(x => s.has(x));
            if (!kandidaten.length) return null;
        }
    }
    for (const i of kandidaten) {
        const el = inv.elemente[i];
        if (kompoundPasst(A, el, inv) && kompoundPasst(B, el, inv)) {
            const extra = [...el.attribute.entries()]
                .filter(([k]) => k.startsWith('data-') || k === 'type')
                .map(([k, v]) => ` ${k}="${v}"`)
                .join('');
            return `<${el.tag || '?'}${el.id ? ' id="' + el.id + '"' : ''} class="${[...el.klassen].join(' ')}"${extra}>`;
        }
    }
    return null;
}

// ----------------------------------------------------------------------
// 6. Verlaufsanalyse
// ----------------------------------------------------------------------

const normSel = s => s.replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim();
const schluessel = d => `${d.ctx}||${normSel(d.selektorListe)}||${d.prop}`;

function gitLies(ref, rel) {
    try {
        return cp.execSync(`git show ${ref}:${rel}`, {
            cwd: REPO,
            encoding: 'utf8',
            maxBuffer: 64 * 1024 * 1024,
            stdio: ['ignore', 'pipe', 'ignore']
        });
    } catch {
        return null;
    }
}

function baumAus(ref) {
    if (!ref) {
        const hub = fs.readFileSync(HUB, 'utf8');
        return baum(d => {
            const p = path.join(CSS_DIR, d);
            return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
        }, kaskadeOrdnung(hub));
    }
    const hub = gitLies(ref, 'assets/styles.css');
    if (hub === null) throw new Error(`Ref ${ref} hat keine assets/styles.css`);
    return baum(d => gitLies(ref, `assets/styles/${d}`), kaskadeOrdnung(hub));
}

/**
 * Jede Deklaration, deren Verhaeltnis zu einer gleich spezifischen
 * Konkurrentin sich zwischen `alt` und `neu` UMGEKEHRT hat.
 *
 * Die Umkehr ist mathematisch genau dann moeglich, wenn beide denselben
 * `!important`-Rang und dieselbe Spezifitaet haben — dann und nur dann
 * entscheidet die Reihenfolge, und nur die hat sich geaendert.
 */
function verlauf(alt, neu, inv, nurMarker = true) {
    const altNach = new Map();
    alt.forEach(d => {
        if (!altNach.has(schluessel(d))) altNach.set(schluessel(d), d);
    });
    const neuNach = new Map();
    neu.forEach(d => {
        if (!neuNach.has(schluessel(d))) neuNach.set(schluessel(d), d);
    });
    const kandidatenListe = nurMarker ? neu.filter(d => d.marker) : neu;
    // Konkurrentinnen nach Langform-Eigenschaft gruppieren (Laufzeit).
    const altNachProp = new Map();
    alt.forEach(d => {
        for (const lf of langformen(d.prop)) {
            if (!altNachProp.has(lf)) altNachProp.set(lf, []);
            altNachProp.get(lf).push(d);
        }
    });
    const befunde = [];
    const ohneAlt = [];
    for (const m of kandidatenListe) {
        const altPos = altNach.get(schluessel(m));
        if (!altPos) {
            ohneAlt.push(m);
            continue;
        }
        if (altPos.ordnung === m.ordnung && alt.length === neu.length) continue;
        const gesehen = new Set();
        const mSel = normSel(m.selektorListe).split(', ');
        const mSpez = mSel.map(spezifitaet);
        for (const lf of langformen(m.prop)) {
            for (const T of altNachProp.get(lf) || []) {
                if (T === altPos) continue;
                if (gesehen.has(T)) continue;
                gesehen.add(T);
                if (T.important !== m.important) continue;
                if (T.ctx === m.ctx && normSel(T.selektorListe) === normSel(m.selektorListe)) continue;
                const G = neuNach.get(schluessel(T));
                if (!G) continue;
                // Umkehr: im alten Baum stand T NACH der Deklaration (gewann),
                // im neuen Baum steht sie DAVOR (verliert). Oder umgekehrt.
                const altGewinntT = T.ordnung > altPos.ordnung;
                const neuGewinntT = G.ordnung > m.ordnung;
                if (altGewinntT === neuGewinntT) continue;
                const paare = [];
                for (const st of normSel(T.selektorListe).split(', ')) {
                    const sT = spezifitaet(st);
                    for (let x = 0; x < mSel.length; x++) {
                        if (vergleichSpez(sT, mSpez[x]) !== 0) continue;
                        const beleg = ueberlappt(mSel[x], st, inv);
                        if (beleg) paare.push({ sel: mSel[x], dritterSel: st, spez: sT, beleg });
                    }
                }
                if (!paare.length) continue;
                befunde.push({
                    prop: m.prop,
                    sel: normSel(m.selektorListe),
                    wert: m.wert,
                    ctx: m.ctx,
                    important: m.important,
                    altPos: `${altPos.datei}:${altPos.zeile}`,
                    neuPos: `${m.datei}:${m.zeile}`,
                    dritter: normSel(T.selektorListe),
                    dritterProp: T.prop,
                    dritterWert: T.wert,
                    dritterCtx: T.ctx,
                    dritterAlt: `${T.datei}:${T.zeile}`,
                    dritterNeu: `${G.datei}:${G.zeile}`,
                    richtung: altGewinntT ? 'Dritte verliert jetzt' : 'Dritte gewinnt jetzt',
                    werteGleich: T.wert === m.wert && T.prop === m.prop,
                    paare
                });
            }
        }
    }
    return { befunde, ohneAlt, marker: neu.filter(d => d.marker).length };
}

// ----------------------------------------------------------------------
// 7. Waechter: Verzeichnis der Reihenfolge-Abhaengigkeiten
// ----------------------------------------------------------------------

// Token- und Themenbloecke tragen ihre Reihenfolge als Aussage und sind keine
// Abhaengigkeit im hier gemeinten Sinn (vgl. den Token-Test in R-19).
const AUSGENOMMEN = /:root|\[data-theme|\[data-layout|^(?:\d+%|from|to)$/;

/**
 * Alle Paare (frueher, spaeter), bei denen allein die Ladereihenfolge
 * entscheidet: gleiche Spezifitaet, gleicher !important-Rang, sich
 * schneidende Eigenschaft, verschiedene Werte, und ein Element im Bestand,
 * das beide Selektoren tragen kann.
 *
 * Nur Deklarationen, an denen eine F-18-Markierung haengt, oeffnen ein Paar —
 * das ist die Menge, die f514ba4 angefasst hat, und die Menge, in der sich
 * die Klasse wiederholen kann. Ein Paar wird von BEIDEN Seiten gesucht: die
 * markierte Deklaration darf die fruehere oder die spaetere sein.
 */
function abhaengigkeiten(baumListe, inv) {
    const nachProp = new Map();
    baumListe.forEach(d => {
        if (AUSGENOMMEN.test(d.selektorListe)) return;
        for (const lf of langformen(d.prop)) {
            if (!nachProp.has(lf)) nachProp.set(lf, []);
            nachProp.get(lf).push(d);
        }
    });
    const paare = new Map();
    for (const m of baumListe) {
        if (!m.marker) continue;
        if (AUSGENOMMEN.test(m.selektorListe)) continue;
        const mSel = normSel(m.selektorListe).split(', ');
        const mSpez = mSel.map(spezifitaet);
        const gesehen = new Set();
        for (const lf of langformen(m.prop)) {
            for (const T of nachProp.get(lf) || []) {
                if (T === m || gesehen.has(T)) continue;
                gesehen.add(T);
                if (T.important !== m.important) continue;
                if (T.ctx === m.ctx && normSel(T.selektorListe) === normSel(m.selektorListe)) continue;
                if (T.wert === m.wert && T.prop === m.prop) continue;
                for (const st of normSel(T.selektorListe).split(', ')) {
                    const sT = spezifitaet(st);
                    for (let x = 0; x < mSel.length; x++) {
                        if (vergleichSpez(sT, mSpez[x]) !== 0) continue;
                        if (!ueberlappt(mSel[x], st, inv)) continue;
                        const frueher = T.ordnung < m.ordnung ? T : m;
                        const spaeter = T.ordnung < m.ordnung ? m : T;
                        const id = [
                            frueher.ctx === spaeter.ctx ? frueher.ctx : `${frueher.ctx} >> ${spaeter.ctx}`,
                            T.ordnung < m.ordnung ? st : mSel[x],
                            T.ordnung < m.ordnung ? mSel[x] : st,
                            frueher.prop,
                            spaeter.prop
                        ].join(' || ');
                        if (!paare.has(id)) {
                            paare.set(id, {
                                id,
                                gewinner: `${spaeter.datei} ${normSel(spaeter.selektorListe)} { ${spaeter.prop} }`,
                                verlierer: `${frueher.datei} ${normSel(frueher.selektorListe)} { ${frueher.prop} }`,
                                spezifitaet: sT.join(',')
                            });
                        }
                    }
                }
            }
        }
    }
    return [...paare.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function ladeBasis() {
    if (!fs.existsSync(BASIS)) return null;
    return JSON.parse(fs.readFileSync(BASIS, 'utf8'));
}

/** Vergleicht das erhobene Verzeichnis mit dem eingefrorenen Stand. */
function pruefe(aktuell, basis) {
    const altMap = new Map((basis?.abhaengigkeiten || []).map(x => [x.id, x]));
    const neuMap = new Map(aktuell.map(x => [x.id, x]));
    const neuePaare = aktuell.filter(x => !altMap.has(x.id));
    const entfallene = (basis?.abhaengigkeiten || []).filter(x => !neuMap.has(x.id));
    const gedreht = aktuell
        .filter(x => {
            const a = altMap.get(x.id);
            return a && (a.gewinner !== x.gewinner || a.verlierer !== x.verlierer);
        })
        .map(x => ({ ...x, vorher: altMap.get(x.id) }));
    return { neuePaare, entfallene, gedreht, ok: !neuePaare.length && !gedreht.length && !entfallene.length };
}

// ----------------------------------------------------------------------
// 8. Direktaufruf
// ----------------------------------------------------------------------

function analysiere() {
    const inv = elementInventar();
    const jetzt = baumAus(null);
    return { inv, baum: jetzt, abhaengigkeiten: abhaengigkeiten(jetzt, inv) };
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const wert = n => (args.includes(n) ? args[args.indexOf(n) + 1] : null);

    if (args.includes('--verlauf')) {
        const altRef = wert('--alt') || 'f514ba4~1';
        const neuRef = wert('--neu');
        const alle = args.includes('--alle');
        const inv = elementInventar();
        const alt = baumAus(altRef);
        const neu = baumAus(neuRef);
        const r = verlauf(alt, neu, inv, !alle);
        const echt = r.befunde.filter(b => !b.werteGleich);
        console.log(`ALT ${altRef}: ${alt.length} Deklarationen`);
        console.log(`NEU ${neuRef || 'Arbeitsbaum'}: ${neu.length} Deklarationen, ${r.marker} F-18-Markierungen`);
        console.log(`Inventar: ${inv.elemente.length} Elemente, ${inv.zustand.size} Zustandsklassen`);
        console.log(`Geprueft: ${alle ? 'ALLE Deklarationen' : 'nur markierte'}`);
        console.log(`Ohne Gegenstueck im alten Baum: ${r.ohneAlt.length}`);
        console.log(`\nUMKEHRUNGEN: ${r.befunde.length} (davon ${r.befunde.length - echt.length} mit identischem Wert = folgenlos)`);
        for (const b of echt) {
            console.log(`\n* ${b.prop}  ${b.sel} { ${b.prop}: ${b.wert} }  ctx=${b.ctx}`);
            console.log(`    ${b.altPos} -> ${b.neuPos}   [${b.richtung}]`);
            console.log(`    Dritte: ${b.dritter} { ${b.dritterProp}: ${b.dritterWert} }  ctx=${b.dritterCtx}`);
            console.log(`            alt ${b.dritterAlt} | neu ${b.dritterNeu}`);
            b.paare.forEach(p => console.log(`    Beleg [${p.spez.join(',')}]: ${p.sel} vs ${p.dritterSel} an ${p.beleg}`));
        }
        if (args.includes('--json')) {
            console.log('\n' + JSON.stringify({ alt: altRef, neu: neuRef || 'worktree', befunde: r.befunde }, null, 2));
        }
        process.exit(0);
    }

    const { abhaengigkeiten: aktuell, inv } = analysiere();

    if (args.includes('--write')) {
        fs.mkdirSync(path.dirname(BASIS), { recursive: true });
        fs.writeFileSync(
            BASIS,
            JSON.stringify(
                {
                    _hinweis:
                        'Eingefrorener Stand der Reihenfolge-Abhaengigkeiten gleicher Spezifitaet an den F-18-Verschiebungen. Erzeugt von tools/check-f18-kaskade.js --write. Jede neue, entfallene oder GEDREHTE Zeile ist eine Entscheidung und muss begruendet werden — eine Drehung ist die F-18-Fehlerklasse.',
                    erhoben: new Date().toISOString().slice(0, 10),
                    anzahl: aktuell.length,
                    abhaengigkeiten: aktuell
                },
                null,
                2
            ) + '\n'
        );
        console.log(`[check-f18-kaskade --write] ${aktuell.length} Abhaengigkeiten nach ${path.relative(REPO, BASIS)} geschrieben.`);
        process.exit(0);
    }

    if (args.includes('--json')) {
        console.log(JSON.stringify({ anzahl: aktuell.length, abhaengigkeiten: aktuell }, null, 2));
        if (!args.includes('--check')) process.exit(0);
    }

    const basis = ladeBasis();
    if (!basis) {
        console.error(`[check-f18-kaskade --check] Kein eingefrorener Stand: ${path.relative(REPO, BASIS)} fehlt.`);
        process.exit(1);
    }
    const p = pruefe(aktuell, basis);
    console.log(`[check-f18-kaskade] ${aktuell.length} Abhaengigkeiten, Sollstand ${basis.anzahl}, ${inv.elemente.length} Elemente im Inventar.`);
    if (p.ok) {
        console.log('[check-f18-kaskade --check] OK — Verzeichnis unveraendert.');
        process.exit(0);
    }
    p.gedreht.forEach(x =>
        console.error(
            `[GEAENDERT] ${x.id}\n    vorher gewann: ${x.vorher.gewinner}\n    jetzt gewinnt: ${x.gewinner}`
        )
    );
    p.neuePaare.forEach(x => console.error(`[NEU] ${x.id}\n    gewinnt: ${x.gewinner}  verliert: ${x.verlierer}`));
    p.entfallene.forEach(x => console.error(`[ENTFALLEN] ${x.id}\n    gewann: ${x.gewinner}`));
    console.error(
        `[check-f18-kaskade --check] ${p.gedreht.length} geaendert, ${p.neuePaare.length} neu, ${p.entfallene.length} entfallen.`
    );
    process.exit(1);
}

module.exports = {
    kaskadeOrdnung,
    deklarationen,
    baum,
    baumAus,
    spezifitaet,
    vergleichSpez,
    langformen,
    propsSchneiden,
    elementInventar,
    subjekt,
    zerlegeKompound,
    syntaktischDisjunkt,
    ueberlappt,
    verlauf,
    abhaengigkeiten,
    ladeBasis,
    pruefe,
    analysiere,
    BASIS,
    MARKER
};
