// @ts-check
/**
 * Die Kehrschleife — Tastaturerreichbarkeit der Kampfansichten (TAST, T-C / Schritt 4)
 * ====================================================================================
 *
 * WORUEBER DIESE DATEI URTEILT. T-A hat repariert, was die ERREICHBAREN
 * Knoepfe beim Tastendruck tun; T-B hat den Mechanismus gebaut, mit dem
 * Enter und die Leertaste ein nicht-natives Bedienelement ueberhaupt
 * bedienen koennen. Beide haben KEINE einzige Stelle neu erreichbar
 * gemacht — das war Absicht und steht so in ihren Akten. Diese Datei
 * urteilt ueber den fehlenden dritten Teil: die 219 Quellstellen in 43
 * Dateien (100 `div`, 81 `span`, 38 `label`), die `data-action` tragen,
 * aber kein `tabindex` — und die darum in KEINEM Tabulatorlauf vorkommen.
 *
 * Gemessen am gebauten Buendel, gefuellte Kampagne, echte Tabulatorspruenge,
 * je Ansicht ein frischer Seitenaufbau (Ausgangslage HEAD 4830173):
 *
 *   Armaturenbrett   40 bedienbar, 12 unerreichbar — alle 12 nicht-nativ
 *   Party            44 bedienbar,  8 unerreichbar
 *   Initiative       69 bedienbar,  9 unerreichbar
 *   Wuerfel          42 bedienbar,  1 unerreichbar
 *   DM-Schirm        37 bedienbar,  1 unerreichbar
 *
 * Diese Zahlen sind bei EINEM Eintrag je Typ gemessen und die Schuld
 * skaliert mit den Daten (vermessen: 84 Stellen bei fast leerer Kampagne,
 * 462 bei zwanzig Eintraegen je Typ). Deshalb laeuft jeder Reichweitenfall
 * unten bei ZWEI Kampagnengroessen.
 *
 * WAS DEM SPIELLEITER FEHLT, in Klartext. Unerreichbar sind unter anderem:
 * die acht Sprungfelder des Armaturenbretts (`show-view`), der
 * Lebenspunkte-Rechner je Heldenkarte (`show-hp-calculator-stop`), die
 * Initiative-Wertbearbeitung (`edit-init-value`), der Charakterbogen
 * (`edit-char`), die Namensverweise der Kampfzeile
 * (`navigate-entity-stop`), die Zauberplatz- und Initiative-Punkte
 * (`toggle-spell-slot-stop`, `toggle-init-slot-stop`) — und `div.qref-fab`,
 * die Schnell-Referenz, die in ALLEN 24 Ansichten unerreichbar ist und
 * deren einziger Zugang heute das Kuerzel `/` ist.
 *
 * DER GEWAEHLTE WEG IST `tabindex="0"` + `role="button"`, NICHT `div` ->
 * `button` (Orchestrator-Entscheidung O-1, entschieden, nicht zur Wahl
 * gestellt). Der Tagwechsel aendert bei 32 von 32 Signaturen mindestens eine
 * berechnete Eigenschaft und bei 20 von 32 die Abmessungen; er haette den
 * Stil-Sollstand (`computed-style-diff.spec.js`) zweifach rot gemacht, weil
 * dessen Schluessel `tag.sortierteKlassen#index` ist. Zwei Attribute aendern
 * dagegen weder Schluessel noch Box noch eine der zwoelf gehashten
 * Eigenschaften — es gibt im ganzen CSS-Baum keine einzige Regel auf
 * `[role=…]` oder `[tabindex…]` (nachgezaehlt: 0 Treffer in
 * `assets/styles/`).
 *
 * UND SIE ENTSTEHEN ZUR LAUFZEIT, nicht im Quelltext (O-3). Eine
 * Kehrschleife mit `MutationObserver` ist EINE Stelle und deckt auch
 * kuenftigen Code; 219 Quelltext-Aenderungen in 43 Dateien waeren 149
 * globale `render*`-Funktionen, von denen sich jede an zwei Attribute
 * erinnern muesste. Preis: ein `grep tabindex` im Quellbaum zeigt sie
 * nicht. Die Faelle (f) bis (h) sind die Kehrseite dieser Entscheidung:
 * jede Renderfunktion, die `innerHTML` ersetzt, LOESCHT die Attribute
 * wieder. Eine Kehrschleife, die nach `renderAll()`, nach einem
 * Rueckgaengig und nach einem vollen Datentausch nicht erneut greift,
 * sieht aus wie "war schon immer so" und niemand findet sie wieder.
 *
 * UMFANG: ALLE ANSICHTEN (E-2, "die Reichweite der Vorbereitung").
 * Bis b8a1a5c waren es fuenf (E-1, "Kampf zuerst"), und die uebrigen 19
 * liefen als benannte Restschuld mit. Diese Restschuld ist beglichen: die
 * Ansichtenliste wird nicht mehr abgetippt, sondern aus dem gebauten
 * Buendel abgeleitet (siehe `ansichtenAusBuendel()`), und eine 25. Ansicht
 * laeuft ohne eine Zeile hier mit. Dazu kommt weiter die globale Schale
 * ausserhalb aller `.view`-Abschnitte, denn `div.qref-fab` liegt dort.
 *
 * UND SIE MISST SEIT E-2 AUCH DIE PFEILTASTEN. Die Gruppenmechanik
 * (`ui/keyboard-group.js`) gibt einer Reihe gleichartiger Stellen EINEN
 * Tabulatorhalt; die uebrigen Glieder tragen `tabindex="-1"`. Ein reiner
 * Tabulatorlauf meldete sie als unerreichbar — gemessen 40 falsche Befunde
 * in der Initiative mit verknuepften Zauberwirkern. `reichweiteMessen()`
 * faehrt darum jede Gruppe, die es betritt, mit ihrer Achsentaste ab. Die
 * Gruppe erkennt es an der ARIA-Zusage (`role="toolbar"` +
 * `aria-orientation`), NICHT an den Innereien des Moduls — sonst pruefte
 * die Datei das Modul gegen sich selbst.
 *
 * UND SIE URTEILT UEBER DEN PREIS DER NACHRUESTUNG. Wer rund 430 Elemente
 * fokussierbar macht, verkleinert damit still die Menge der Lagen, in denen
 * `document.activeElement` BODY ist — und an dieser Menge haengt der
 * gewohnte Griff des Spielleiters: Leertaste = naechster Zug. Abschnitt (m)
 * unten ist dieser Preis, mit echter Maus und echter Taste nachgemessen.
 *
 * MESSDISZIPLIN — dieselben Regeln wie in `tastatur-ausloesung.spec.js` und
 * `tastatur-verteiler.spec.js`, jede aus einer verdorbenen Messung gelernt:
 *
 *  1. NUR ECHTE TASTENDRUECKE. Fokus ausschliesslich per
 *     `page.keyboard.press('Tab')`, niemals `.focus()`. Kein
 *     `element.click()` auf ein Ziel.
 *
 *  2. KEIN KLICK UND KEIN `blur()` ALS STARTPUNKT, sondern ein frischer
 *     Seitenaufbau plus `window.switchView()`. Chromiums "sequential focus
 *     navigation starting point" ueberlebt ein `blur()`; ein Klick auf einen
 *     Navigationsknopf setzt ihn mitten ins Dokument.
 *
 *  3. DAS ZIEL WIRD UEBER OBJEKTIDENTITAET AUFGELOEST — `window.__ops` haelt
 *     die Knotenliste, der Abgleich laeuft ueber `indexOf`. NIEMALS ueber
 *     Signatur plus Text: textgleiche Zeilenknoepfe (sechsmal "➕", zwei
 *     `div.init-value` mit demselben Titel) verschmelzen sonst zu einem
 *     Eintrag und die Schuld wird zu NIEDRIG gezaehlt.
 *
 * WARUM DIE MITSCHRIFT AM `focusin` HAENGT und nicht an einer Ablesung je
 * Sprung: beides liefert dasselbe Ergebnis — gegengeprueft gegen
 * `sweep2.mjs` der Vermessung, 12/8/9/1/1 unerreichbar in den fuenf
 * Ansichten, Zahl fuer Zahl gleich —, aber die Mitschrift braucht 0,2 s
 * statt rund 10 s je Ansicht, weil zwischen zwei Tastendruecken kein
 * Rundlauf in die Seite liegt. Bei zwanzig Eintraegen je Typ ist das der
 * Unterschied zwischen einem laufenden und einem abbrechenden Fall.
 *
 * WARUM DER KLICKZAEHLER IN (i) AM DOKUMENT HAENGT: `_handleClick` ruft fuer
 * jede registrierte Aktion `e.stopPropagation()`, BEVOR es den Handler
 * aufruft. Ein Lauscher am Ziel selbst wird dadurch nie erreicht und
 * meldet konstant 0.
 */

import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_PFAD = `${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
const APP_URL = `file:///${APP_PFAD}`;

/** Breite der Vermessung. Unter 901 px greifen andere Media-Queries. */
const BREIT = { width: 1440, height: 900 };

/**
 * DIE ANSICHTENLISTE IST KEIN LITERAL MEHR (TASV/E-2, Auftrag 4).
 *
 * Bis zur Mobil-Runde stand sie hier als Aufzaehlung, und die ausgewiesene
 * Restschuld lautete woertlich: "Kein Waechter nimmt eine 25. Ansicht
 * automatisch in die Pruefung auf; die Reiterliste steht als Literal in der
 * Probe." Diese Zeilen schliessen sie.
 *
 * SIE WIRD AUS DEM GEBAUTEN BUENDEL GELESEN, aus BEIDEN Quellen, die eine
 * Ansicht im Dokument hat:
 *   - dem Abschnitt selbst  `id="view-X" class="view …"`
 *   - dem Navigationsreiter `data-view="X"`
 * Beide Mengen muessen deckungsgleich sein; Fall (0) unten ist die
 * Zusicherung darauf. Wer eine 25. Ansicht einbaut, bekommt sie damit ohne
 * eine Zeile hier mitgeprueft — und wer nur die Haelfte einbaut (Abschnitt
 * ohne Reiter oder umgekehrt), bekommt einen roten Fall statt einer still
 * ungeprueften Ansicht.
 *
 * WARUM AUS DEM BUENDEL UND NICHT AUS `assets/templates/*.html`: das
 * Buendel ist das, wogegen diese Datei laeuft. Eine Vorlage, die der Bau
 * nicht einsammelt, waere sonst eine Ansicht, die die Probe fordert und die
 * es im Lauf nicht gibt.
 *
 * WARUM SYNCHRON BEIM EINLESEN DER DATEI und nicht in einem `beforeAll`:
 * Playwright muss die Faelle beim Einsammeln kennen, lange bevor ein
 * Browser laeuft. Gemessen: der Lesevorgang ueber 3,8 MB kostet rund 30 ms,
 * einmal je Arbeiter.
 */
function ansichtenAusBuendel() {
    const html = readFileSync(APP_PFAD, 'utf8');
    const abschnitte = new Set();
    for (const m of html.matchAll(/id="view-([a-z0-9-]+)"\s+class="view\b/g)) {
        abschnitte.add(m[1]);
    }
    const reiter = new Set();
    const beschriftung = new Map();
    for (const m of html.matchAll(/data-view="([a-z0-9-]+)"([^>]*)>([^<]*)/g)) {
        reiter.add(m[1]);
        // Die Beschriftung des Reiters ist der Name, den der Spielleiter
        // sieht — der Fallbericht nennt damit dieselbe Ansicht wie die App.
        // Fehlt sie, bleibt die Kennung; eine 25. Ansicht laeuft so oder so.
        const text = (m[3] || '').replace(/\s+/g, ' ').trim();
        if (text && !beschriftung.has(m[1])) beschriftung.set(m[1], text);
    }
    return { abschnitte: [...abschnitte].sort(), reiter: [...reiter].sort(), beschriftung };
}

const { abschnitte: ABSCHNITTE, reiter: REITER, beschriftung: REITERTEXT } = ansichtenAusBuendel();

/**
 * Die fuenf Kampfansichten aus E-1. Sie sind KEINE Umfangsgrenze mehr —
 * der Umfang sind seit E-2 alle Ansichten —, sondern nur noch die Marke
 * dafuer, welche Ansicht bei ZWEI Kampagnengroessen geprueft wird. Die
 * Begruendung steht bei `GROESSEN`.
 */
const KAMPFANSICHTEN = new Set(['dashboard', 'initiative', 'party', 'dice', 'dmscreen']);

/** Alle Ansichten des Buendels, als Argument fuer `switchView()`. */
const ALLE_ANSICHTEN = ABSCHNITTE.map(name => ({
    name,
    id: `view-${name}`,
    titel: REITERTEXT.get(name) || name,
    kampf: KAMPFANSICHTEN.has(name)
}));

/**
 * Kampagnengroessen. Die Schuld skaliert mit den Daten (vermessen: 84
 * unerreichbare Stellen bei fast leerer Kampagne, 462 bei zwanzig
 * Eintraegen je Typ). Ein Fall, der nur bei sechs Eintraegen geprueft ist,
 * sagt nichts ueber den Spieltisch.
 *
 * ZWEI GROESSEN NUR FUER DIE FUENF KAMPFANSICHTEN, eine fuer die uebrigen
 * neunzehn — und das ist eine Laufzeit-Abwaegung, keine inhaltliche.
 * Gemessen an dieser Datei: ein voller Durchlauf bei zwanzig Eintraegen
 * kostet in der Party rund 70 s (822 echte Tastendruecke), im Schnitt rund
 * 25 s. 24 Ansichten x 2 Groessen waeren 48 Faelle und rund 20 Minuten
 * allein hier — mehr als die gesamte uebrige E2E-Suite. Zwanzig ist der
 * haertere Fall; die fuenf Kampfansichten behalten die zweite Groesse,
 * weil ihre Ratsche aus E-1 nicht geschwaecht werden darf.
 *
 * Eine 25. Ansicht laeuft damit automatisch bei zwanzig Eintraegen mit.
 * @param {{kampf: boolean}} a
 */
const groessenFuer = a => (a.kampf ? [6, 20] : [20]);

/**
 * Gefuellte Kampagne mit `n` Eintraegen je Typ. Die Kaempfer tragen ANDERE
 * Namen als die Charaktere, damit `addPartyToInit()` nichts ueberspringt
 * (dieselbe Falle wie in `tastatur-verteiler.spec.js`).
 * @param {number} n
 */
function kampagne(n) {
    const liste = (praefix, extra = {}) =>
        Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `${praefix} ${i + 1}`, ...extra }));
    return {
        _version: '99.0.0',
        settings: { theme: 'dark', lastView: 'dashboard', markdownOnboardingSeen: true },
        randomTables: [],
        timers: [],
        campaign: {},
        shops: liste('Laden'),
        factions: liste('Fraktion'),
        characters: Array.from({ length: n }, (_, i) => ({
            id: i + 1,
            name: `Charakter ${i + 1} (T-C)`,
            characterClass: 'Magier',
            level: 5,
            hpCurrent: 40,
            hpMax: 40,
            armorClass: 16,
            attributes: { str: 10, dex: 12, con: 14, int: 16, wis: 12, cha: 10 },
            // Zauberplaetze, damit die Punkte (`toggle-spell-slot-stop`) im
            // Dokument stehen — sie sind vier der acht unerreichbaren
            // Party-Stellen.
            spellSlots: { 1: { max: 4, current: 2 }, 2: { max: 3, current: 1 } }
        })),
        npcs: liste('NSC', { role: 'Merchant', race: 'Mensch' }),
        locations: liste('Ort'),
        quests: liste('Auftrag', { title: 'Auftrag', status: 'active' }),
        loot: liste('Beute', { qty: 1 }),
        spells: [],
        wiki: liste('Wiki', { title: 'Wiki', category: 'Allgemein' }),
        sessionNotes: [],
        encounters: liste('Begegnung', { monsters: [] }),
        initiative: {
            combatants: Array.from({ length: n }, (_, i) => ({
                id: i + 1,
                name: (i % 2 ? 'Held ' : 'Ork ') + (i + 1),
                initiative: 30 - i,
                initBonus: 2,
                maxHp: 30,
                currentHp: 30,
                ac: 14,
                type: i % 2 ? 'player' : 'monster',
                effects: []
            })),
            currentTurn: 0,
            round: 1
        },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 100,
        quickRefCustom: [],
        _nextId: {
            characters: n + 1,
            npcs: n + 1,
            locations: n + 1,
            quests: n + 1,
            encounters: n + 1,
            spells: 1,
            loot: n + 1,
            items: 1,
            wiki: n + 1,
            sessionNotes: 1,
            randomTables: 1
        }
    };
}

/**
 * Sammelt die sichtbaren Bedienelemente der AKTIVEN Ansicht (plus die
 * globale Schale ausserhalb aller `.view`) in `window.__ops` und haengt
 * EINMAL einen `focusin`-Mitschnitt an, der jeden erreichten Index in
 * `window.__erreicht` legt. Mehrfach aufrufbar: die Knotenliste und die
 * Trefferliste werden neu gesetzt, der Lauscher liest beide dynamisch —
 * genau das brauchen die Faelle (f) bis (h), die nach einem Neuzeichnen ein
 * zweites Mal sammeln.
 *
 * Herkunft: Sammlung und Sichtbarkeitsregel sind aus `sweep2.mjs` der
 * Vermessung uebernommen, damit die Zahlen hier mit den dort gemessenen
 * vergleichbar sind.
 *
 * DER DATENSCHLUESSEL (`dk`) — Messdisziplin 3 bekommt eine zweite Lesart,
 * und zwar eine gemessene. In einer virtuell gescrollten Liste ist die
 * Objektidentitaet keine brauchbare Identitaet mehr: `VirtualScroll.create()`
 * ersetzt bei jedem Scrollen `visibleContainer.innerHTML`, der gesammelte
 * Knoten ist danach ein anderer, und ein Mitschnitt, der nur ueber
 * `indexOf` abgleicht, meldet eine ERREICHTE Zeile als unerreichbar.
 * Gemessen im Bestiarium: die Zeilen 11 bis 17 des Fensters liegen unter
 * der Kante, sie zu fokussieren rollt den Behaelter, und das Rollen
 * tauscht sie aus.
 *
 * Der Schluessel haengt darum an den DATEN
 * (`data-action|data-id|data-value`), die das Neuzeichnen unveraendert
 * ueberleben. ER ZAEHLT NUR, WENN ER IN DER SAMMLUNG EINDEUTIG IST —
 * sonst schriebe er zu viel gut: vier Zauberplatz-Punkte desselben Grades
 * teilen sich `data-id` und `data-value`, und ein Treffer auf dem ersten
 * wiese die anderen drei faelschlich als erreicht aus. In der virtuellen
 * Liste ist er eindeutig (`data-id` ist die Monsterkennung) — genau dort
 * wird er gebraucht und nirgends sonst.
 */
const SAMMELN = `(() => {
    const NATIV = 'button,a[href],input:not([type="hidden"]),select,textarea,' +
        '[tabindex]:not([tabindex="-1"]),[contenteditable=""],[contenteditable="true"]';
    const sichtbar = el => {
        if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true,
            visibilityProperty: true, contentVisibilityAuto: true })) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };
    const inAktiverAnsicht = el => {
        const v = el.closest('.view');
        return v ? v.classList.contains('active') : true;
    };
    // Der Datenschluessel. Die lange Begruendung steht ueber SAMMELN —
    // sie kann hier nicht stehen, weil dieser Block ein Schablonentext ist
    // und ein Gegenhaken darin die Zeichenkette beenden wuerde.
    const dschluessel = el => (el.getAttribute('data-action') || '-') + '|' +
        (el.getAttribute('data-id') || '-') + '|' + (el.getAttribute('data-value') || '-');
    const beschreibe = el => ({
        sig: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
            ((typeof el.className === 'string' && el.className.trim())
                ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : ''),
        text: (el.getAttribute('aria-label') || el.getAttribute('title') ||
            el.textContent || el.value || '').replace(/\\s+/g, ' ').trim().slice(0, 40),
        tag: el.tagName.toLowerCase(),
        aktion: el.getAttribute('data-action') || null,
        rolle: el.getAttribute('role') || null,
        ti: el.getAttribute('tabindex') || null,
        dk: dschluessel(el),
        ansicht: el.closest('.view') ? el.closest('.view').id : 'global'
    });
    const ops = [], meta = [], gesehen = new Set();
    document.querySelectorAll(NATIV).forEach(el => {
        if (el.disabled || gesehen.has(el) || !sichtbar(el) || !inAktiverAnsicht(el)) return;
        gesehen.add(el); ops.push(el);
        const m = beschreibe(el); m.art = 'nativ'; meta.push(m);
    });
    document.querySelectorAll('[data-action]').forEach(el => {
        if (gesehen.has(el)) return;
        if (el.matches(NATIV) && !el.disabled) return;
        if (!sichtbar(el) || !inAktiverAnsicht(el)) return;
        gesehen.add(el); ops.push(el);
        const m = beschreibe(el); m.art = 'nichtNativ'; meta.push(m);
    });
    window.__ops = ops;
    window.__erreicht = new Set();
    window.__erreichtK = new Set();
    window.__begangen = new Set();
    if (!window.__reichweiteLauscher) {
        window.__reichweiteLauscher = ev => {
            const i = (window.__ops || []).indexOf(ev.target);
            if (i >= 0) window.__erreicht.add(i);
            if (ev.target && ev.target.getAttribute) {
                window.__erreichtK.add((ev.target.getAttribute('data-action') || '-') + '|' +
                    (ev.target.getAttribute('data-id') || '-') + '|' +
                    (ev.target.getAttribute('data-value') || '-'));
            }
        };
        document.addEventListener('focusin', window.__reichweiteLauscher, true);
    }
    return meta;
})()`;

/**
 * Ein Schritt der Pfeiltastenfahrt: liegt der Fokus in einer noch nicht
 * begangenen Gruppe, meldet dieser Ausdruck die Taste ihrer Achse zurueck.
 *
 * ER LIEST DIE ARIA-ZUSAGE, NICHT DIE INNEREIEN DES MODULS. Eine Gruppe ist
 * hier, was ein Vorleseprogramm als Gruppe sieht: ein Behaelter mit
 * `role="toolbar"` und `aria-orientation`. Haette die Probe stattdessen
 * `KeyboardGroup._gruppeVon()` gefragt, pruefte sie das Modul gegen sich
 * selbst — und eine Gruppe, die ihre Rolle vergisst, bliebe gruen.
 *
 * `eigene` schliesst die Glieder VERSCHACHTELTER Gruppen aus: in den
 * Auftraegen liegt die Marken-Leiste jeder Zeile INNERHALB der Zeilenliste,
 * und ohne diesen Filter zaehlte die aeussere Gruppe die 40 Marken zu ihren
 * eigenen Gliedern.
 */
const GRUPPEN_SCHRITT = `(() => {
    const el = document.activeElement;
    if (!el || !el.closest) return null;
    const leiste = el.closest('[role="toolbar"][aria-orientation]');
    if (!leiste) return null;
    const eigene = [...leiste.querySelectorAll('[tabindex]')]
        .filter(g => g.closest('[role="toolbar"][aria-orientation]') === leiste);
    if (eigene.indexOf(el) < 0 || eigene.length < 2) return null;
    window.__begangen = window.__begangen || new Set();
    const schl = (leiste.id || '') + '|' + (leiste.getAttribute('aria-label') || '') + '|' +
        [...document.querySelectorAll('[role="toolbar"][aria-orientation]')].indexOf(leiste);
    if (window.__begangen.has(schl)) return null;
    window.__begangen.add(schl);
    return {
        taste: leiste.getAttribute('aria-orientation') === 'vertical' ? 'ArrowDown' : 'ArrowRight',
        glieder: eigene.length
    };
})()`;

/**
 * Frischer Seitenaufbau, gefuellte Kampagne, Ansicht per `switchView()` —
 * OHNE Klick (Messdisziplin 2).
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 * @param {number} n Eintraege je Typ
 */
async function ansichtOeffnen(page, ansicht, n) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(seed => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(seed));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng.
        }
    }, kampagne(n));
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.waitForTimeout(400);
    await page.evaluate(v => window.switchView(v), ansicht);
    await page.waitForTimeout(600);
}

/**
 * Sammelt, tabuliert mit ECHTEN Tastendruecken ueber zwei vollstaendige
 * Runden und meldet, welche gesammelten Bedienelemente kein einziges Mal
 * den Fokus bekamen.
 *
 * Das Budget ist `2 × bedienbar + 120`: zwei Runden, damit ein Start
 * mitten in der Reihe niemanden verschluckt, plus Luft fuer Halte, die die
 * Sammlung nicht zaehlt (Phantomhalte, Elemente anderer Ansichten).
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{ bedienbar: number, nichtNativ: number, spruenge: number,
 *   unerreichbar: Array<Record<string, any>> }>}
 */
async function reichweiteMessen(page, { pause = 0 } = {}) {
    const meta = await page.evaluate(SAMMELN);
    const budget = 2 * meta.length + 120;
    let pfeile = 0;
    for (let i = 0; i < budget; i++) {
        await page.keyboard.press('Tab');
        if (pause) await page.waitForTimeout(pause);

        // DIE PFEILTASTENFAHRT — ohne sie misst diese Datei an E-2 vorbei.
        // Seit der Gruppenmechanik verbraucht eine Reihe gleichartiger
        // Stellen EINEN Tabulatorhalt; ihre uebrigen Glieder tragen
        // `tabindex="-1"` und bekommen in einem reinen Tabulatorlauf nie
        // den Fokus. Eine Messung, die nur tabuliert, meldet sie als
        // unerreichbar, OBWOHL der Spielleiter sie mit zwei Tasten
        // erreicht — gemessen in der Initiative mit verknuepften
        // Zauberwirkern: 40 falsche Befunde (36 `toggle-init-slot-stop`,
        // 4 `toggle-death-save-stop`). Die Fahrt steht hier und nicht in
        // einem eigenen Fall, weil sie IM Lauf passieren muss: der Fokus
        // darf nur per echtem Tastendruck in die Gruppe kommen
        // (Messdisziplin 1), und das tut er genau hier.
        const schritt = await page.evaluate(GRUPPEN_SCHRITT);
        if (!schritt) continue;
        // Obergrenze statt `glieder - 1`: in einer virtuell gescrollten
        // Liste wachsen die Glieder waehrend der Fahrt nach (17 im Fenster,
        // 112 in der Liste). Die Fahrt endet, wenn sich der Fokus nicht
        // mehr bewegt — am Rand gibt es bewusst keinen Umlauf.
        let vorher = null;
        for (let k = 0; k < Math.max(schritt.glieder, 130); k++) {
            await page.keyboard.press(schritt.taste);
            pfeile++;
            if (pause) await page.waitForTimeout(pause);
            const jetzt = await page.evaluate(() => {
                const a = document.activeElement;
                return a
                    ? (a.getAttribute('data-action') || '-') +
                          '|' +
                          (a.getAttribute('data-id') || '-') +
                          '|' +
                          (a.getAttribute('data-value') || '-') +
                          '|' +
                          a.className
                    : null;
            });
            if (jetzt === vorher) break;
            vorher = jetzt;
        }
    }
    const erreicht = new Set(await page.evaluate(() => [...window.__erreicht]));
    const erreichtK = new Set(await page.evaluate(() => [...window.__erreichtK]));
    const dkZaehler = new Map();
    for (const m of meta) dkZaehler.set(m.dk, (dkZaehler.get(m.dk) || 0) + 1);
    return {
        bedienbar: meta.length,
        nichtNativ: meta.filter(m => m.art === 'nichtNativ').length,
        spruenge: budget,
        pfeile,
        unerreichbar: meta
            .map((m, i) => ({ ...m, i }))
            .filter(m => !erreicht.has(m.i) && !(dkZaehler.get(m.dk) === 1 && erreichtK.has(m.dk)))
    };
}

/**
 * Lesbare Fehlermeldung: WAS unerreichbar ist, nicht nur wie viele.
 * @param {{ bedienbar: number, nichtNativ: number, spruenge: number,
 *   unerreichbar: Array<Record<string, any>> }} m
 */
function bericht(m) {
    const zeilen = m.unerreichbar
        .slice(0, 14)
        .map(
            u =>
                `    ${u.art.padEnd(10)} ${u.tag.padEnd(6)} ${(u.aktion || '-').padEnd(26)} ` +
                `${u.sig.slice(0, 44)}  "${u.text}"  [${u.ansicht}]`
        );
    if (m.unerreichbar.length > 14) {
        zeilen.push(`    … und ${m.unerreichbar.length - 14} weitere`);
    }
    return (
        `${m.bedienbar} sichtbare Bedienelemente (davon ${m.nichtNativ} nicht-nativ), ` +
        `${m.spruenge} echte Tabulatorspruenge + ${m.pfeile} Pfeiltasten, ` +
        `${m.unerreichbar.length} unerreichbar:\n` +
        zeilen.join('\n')
    );
}

/**
 * Tabuliert mit ECHTEN Tastendruecken, bis das fokussierte Element das
 * unter `window.__ziel` abgelegte IST (Objektidentitaet, Messdisziplin 3).
 * @param {import('@playwright/test').Page} page
 * @param {string} selektor Wird EINMAL aufgeloest und als Objekt gemerkt.
 * @param {number} maxSpruenge
 * @returns {Promise<number>} Zahl der Spruenge, 0 wenn nicht erreicht
 */
async function tabBisZiel(page, selektor, maxSpruenge = 400) {
    const vorhanden = await page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (!el) return false;
        window.__ziel = el;
        return true;
    }, selektor);
    expect(vorhanden, `Ziel "${selektor}" steht nicht im Dokument`).toBe(true);

    for (let i = 1; i <= maxSpruenge; i++) {
        await page.keyboard.press('Tab');
        const treffer = await page.evaluate(
            () =>
                document.activeElement === window.__ziel && document.activeElement !== document.body
        );
        if (treffer) return i;
    }
    return 0;
}

// ============================================================
// (0) DIE ANSICHTENLISTE SELBST
// ============================================================

test.describe('Kehrschleife — die Ansichtenliste ist abgeleitet, nicht abgetippt', () => {
    test('(0) jeder .view-Abschnitt hat einen Reiter und umgekehrt', async () => {
        // Die eine Zusicherung, die eine abgeleitete Liste braucht: sie
        // darf nicht still leerlaufen. Faende der Ausdruck nichts, waeren
        // NULL Reichweitenfaelle erzeugt und die Datei trotzdem gruen.
        expect(ABSCHNITTE.length, 'Keine .view-Abschnitte im Buendel gefunden').toBeGreaterThan(20);
        const nurAbschnitt = ABSCHNITTE.filter(v => !REITER.includes(v));
        const nurReiter = REITER.filter(v => !ABSCHNITTE.includes(v));
        expect(
            { nurAbschnitt, nurReiter },
            'Abschnitt ohne Reiter oder Reiter ohne Abschnitt — eine davon waere ' +
                'eine Ansicht, die diese Datei nicht prueft'
        ).toEqual({ nurAbschnitt: [], nurReiter: [] });
    });
});

// ============================================================
// (a)-(x) REICHWEITE JE ANSICHT
// ============================================================
//
// SEIT E-2 SIND ES ALLE ANSICHTEN, NICHT MEHR FUENF. Gemessen am Stand
// b8a1a5c, gefuellte Kampagne, 20 Eintraege je Typ, 1440 px, echte
// Tabulatorspruenge — 245 unerreichbare Stellen in 12 der 19
// Vorbereitungsansichten (plus 10 im Bestiarium, die erst bei
// Menschentempo sichtbar werden; die stehen in
// `tastatur-reichweite.spec.js`):
//
//   Auftraege   108 bedienbar /  60 un.   Fraktionen   87 /  20
//   Beute        60 /  30                 Laeden      110 /  20
//   Bestiarium   63 /  17                 Daten        36 /   1
//   NSC          63 /  26                 Notizen      27 /   1
//   Zauber       58 /  26                 Wiki         30 /   1
//   Begegnungen  53 /  22
//   Orte         52 /  21
//
// Sieben Vorbereitungsansichten waren schon sauber (Wuerfelstatistik,
// Kalender, Netzwerk, Sitzungsvorbereitung, Reise, Klangbrett, Zeitgeber),
// die fuenf Kampfansichten ebenfalls.

test.describe('Kehrschleife — Reichweite aller Ansichten', () => {
    for (const ansicht of ALLE_ANSICHTEN) {
        for (const n of groessenFuer(ansicht)) {
            test(`${ansicht.titel} (${ansicht.name}): kein sichtbares Bedienelement bleibt unerreichbar — ${n} Eintraege je Typ`, async ({
                page
            }) => {
                // Bei zwanzig Eintraegen je Typ sind es mehrere hundert echte
                // Tastendruecke; die Vorgabe von 30 s ist dafuer zu knapp,
                // sobald die Maschine belastet ist.
                test.setTimeout(n >= 20 ? 180_000 : 90_000);

                await ansichtOeffnen(page, ansicht.name, n);
                const aktiv = await page.evaluate(
                    () => document.querySelector('.view.active')?.id || '?'
                );
                expect(aktiv, 'Erwartete Ansicht ist nicht aktiv').toBe(ansicht.id);

                const m = await reichweiteMessen(page);
                expect(m.bedienbar, 'Die Sammlung hat nichts gefunden').toBeGreaterThan(10);
                expect(m.unerreichbar.length, bericht(m)).toBe(0);
            });
        }
    }
});

// ============================================================
// (f)-(h) DIE KEHRSCHLEIFE MUSS ERNEUT GREIFEN
// ============================================================
//
// Jede Renderfunktion, die `innerHTML` ersetzt, loescht `tabindex` und
// `role` wieder. Es gibt 149 globale `render*`-Funktionen; ein verpasster
// Pfad sieht aus wie "war schon immer so". Diese drei Faelle sind die
// Ratsche dafuer.

test.describe('Kehrschleife — greift nach einem Neuzeichnen erneut', () => {
    test('(f) nach renderAll() ist weiter nichts unerreichbar', async ({ page }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'initiative', 6);

        const vorher = await reichweiteMessen(page);
        expect(vorher.unerreichbar.length, 'Vorlauf: ' + bericht(vorher)).toBe(0);

        await page.evaluate(() => window.renderAll());
        await page.waitForTimeout(600);

        const nachher = await reichweiteMessen(page);
        expect(nachher.bedienbar, 'Nach renderAll() ist die Ansicht leer').toBeGreaterThan(10);
        expect(nachher.unerreichbar.length, 'Nach renderAll(): ' + bericht(nachher)).toBe(0);
    });

    test('(g) nach Rueckgaengig ist weiter nichts unerreichbar', async ({ page }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'party', 6);

        // Eine echte, rueckgaengig machbare Aenderung: ein Held weniger.
        const zahlen = await page.evaluate(() => {
            window.saveUndoState('T-C Probe');
            window.D.characters.pop();
            window.renderAll();
            return { nachLoeschen: window.D.characters.length };
        });
        expect(zahlen.nachLoeschen).toBe(5);
        await page.waitForTimeout(400);

        await page.evaluate(() => window.undo());
        await page.waitForTimeout(700);
        const wiederhergestellt = await page.evaluate(() => window.D.characters.length);
        expect(wiederhergestellt, 'Rueckgaengig hat den Helden nicht zurueckgebracht').toBe(6);

        const m = await reichweiteMessen(page);
        expect(m.bedienbar, 'Nach dem Rueckgaengig ist die Ansicht leer').toBeGreaterThan(10);
        expect(m.unerreichbar.length, 'Nach undo(): ' + bericht(m)).toBe(0);
    });

    test('(h) nach einem vollen Datentausch ist weiter nichts unerreichbar', async ({ page }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'initiative', 6);

        // `applyRestoredCampaign()` ersetzt D vollstaendig und zeichnet alles
        // neu — derselbe Pfad, den eine Wiederherstellung und ein
        // Kampagnen-Import nehmen.
        await page.evaluate(async daten => {
            await window.applyRestoredCampaign(daten, 'T-C Probe');
        }, kampagne(12));
        await page.waitForTimeout(900);

        const kaempfer = await page.evaluate(() => window.D.initiative.combatants.length);
        expect(kaempfer, 'Der Datentausch hat nicht gegriffen').toBe(12);

        const m = await reichweiteMessen(page);
        expect(m.bedienbar, 'Nach dem Datentausch ist die Ansicht leer').toBeGreaterThan(10);
        expect(m.unerreichbar.length, 'Nach applyRestoredCampaign(): ' + bericht(m)).toBe(0);
    });
});

// ============================================================
// (i) NICHTS LOEST DOPPELT AUS
// ============================================================

//
// JE TASTE EIN EIGENER SEITENAUFBAU, und das ist kein Luxus:
// `toggleQuickRef()` setzt den Fokus 100 ms nach dem Oeffnen auf
// `#qref-search-input`. Ein zweiter Tastendruck im selben Lauf traefe also
// das Suchfeld und nicht mehr die Schaltflaeche — die Messung wuerde
// schweigen, statt zu urteilen.

for (const taste of [
    { key: ' ', name: 'Leertaste' },
    { key: 'Enter', name: 'Enter' }
]) {
    test.describe(`Kehrschleife — ein Tastendruck, ein Klick (${taste.name})`, () => {
        test(`(i) ${taste.name} auf dem nachgeruesteten div.qref-fab: genau 1 Klick, 0 davon echt`, async ({
            page
        }) => {
            test.setTimeout(120_000);
            await ansichtOeffnen(page, 'initiative', 6);

            const spruenge = await tabBisZiel(page, 'div.qref-fab');
            expect(
                spruenge,
                'div.qref-fab ist in 400 echten Tabulatorspruengen nicht erreichbar — ' +
                    'die Kehrschleife hat die globale Schale nicht erfasst'
            ).toBeGreaterThan(0);

            // Attribute am ERREICHTEN Objekt lesen, nicht an einem zweiten Treffer.
            const attr = await page.evaluate(() => ({
                ti: document.activeElement.getAttribute('tabindex'),
                rolle: document.activeElement.getAttribute('role'),
                tag: document.activeElement.tagName
            }));
            expect(attr.tag).toBe('DIV');
            expect(attr.ti, 'tabindex fehlt am erreichten Element').toBe('0');
            expect(attr.rolle, 'role="button" fehlt am erreichten Nicht-label').toBe('button');

            // Zaehler am Dokument in der Capture-Phase — Begruendung im Kopf.
            await page.evaluate(() => {
                window.__klicks = { echt: 0, synthetisch: 0 };
                document.addEventListener(
                    'click',
                    ev => {
                        if (ev.target !== window.__ziel) return;
                        if (ev.isTrusted) window.__klicks.echt++;
                        else window.__klicks.synthetisch++;
                    },
                    true
                );
                window.scrollTo(0, 0);
            });

            await page.keyboard.press(taste.key);
            await page.waitForTimeout(400);

            const mess = await page.evaluate(() => ({
                ...window.__klicks,
                scrollY: Math.round(window.scrollY),
                offen: !!document.querySelector('#quick-ref-panel.active, .qref-panel.active')
            }));
            expect(
                mess.echt + mess.synthetisch,
                `${taste.name}: ${mess.echt} echte + ${mess.synthetisch} synthetische Klicks — ` +
                    'erwartet genau 1 (role="button" darf den Browser NICHT zu einem eigenen ' +
                    'Klick bringen)'
            ).toBe(1);
            expect(mess.echt, 'Der Browser hat selbst einen Klick erzeugt — Doppelfeuer').toBe(0);
            expect(mess.scrollY, `${taste.name} hat die Seite weggerollt`).toBe(0);
            expect(mess.offen, 'Die Schnell-Referenz hat sich nicht geoeffnet').toBe(true);
        });
    });
}

// ============================================================
// (j) FOKUSRING OHNE EINE ZEILE NEUES CSS
// ============================================================

test.describe('Kehrschleife — der Ring kommt aus der Weltregel', () => {
    test('(j) das nachgeruestete div.init-value traegt den Fokusring aus assets/styles/core.css', async ({
        page
    }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'initiative', 6);

        const spruenge = await tabBisZiel(page, 'div.init-value');
        expect(spruenge, 'div.init-value ist nicht per Tabulator erreichbar').toBeGreaterThan(0);

        const ring = await page.evaluate(() => {
            const el = document.activeElement;
            const cs = getComputedStyle(el);
            const token = getComputedStyle(document.documentElement)
                .getPropertyValue('--focus-ring')
                .trim();
            // Token in denselben rgb()-Text bringen, in dem der Browser
            // `outlineColor` meldet — ein Vergleich von "#d4af37" mit
            // "rgb(212, 175, 55)" waere immer falsch.
            const probe = document.createElement('span');
            probe.style.color = token;
            document.body.appendChild(probe);
            const tokenRgb = getComputedStyle(probe).color;
            probe.remove();
            return {
                breite: cs.outlineWidth,
                stil: cs.outlineStyle,
                farbe: cs.outlineColor,
                versatz: cs.outlineOffset,
                tokenRgb,
                trifftFocusVisible: el.matches(':focus-visible')
            };
        });

        expect(
            ring.trifftFocusVisible,
            ':focus-visible greift am nachgeruesteten Element nicht'
        ).toBe(true);
        expect(ring.stil, `outline-style war "${ring.stil}"`).toBe('solid');
        expect(ring.breite, `outline-width war "${ring.breite}"`).toBe('2px');
        expect(ring.versatz, `outline-offset war "${ring.versatz}"`).toBe('2px');
        expect(
            ring.farbe,
            `outline-color "${ring.farbe}" ist nicht das Token --focus-ring (${ring.tokenRgb})`
        ).toBe(ring.tokenRgb);
    });
});

// ============================================================
// (k) WAS DIE KEHRSCHLEIFE SETZT — UND WAS SIE STEHEN LAESST
// ============================================================

test.describe('Kehrschleife — die zwei Attribute, und die Ausnahme fuer <label>', () => {
    test('(k) ein nachtraeglich eingehaengtes Element wird erfasst: div bekommt role, label bekommt keine', async ({
        page
    }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'initiative', 6);

        // Der MutationObserver-Pfad, direkt geprueft: zwei Knoten nach dem
        // Seitenaufbau in die Kampfansicht haengen. `role="button"` auf einer
        // Marke waere falsch — es ueberschreibt den Marken-Charakter, und
        // gemessen traegt die Marke OHNE role genauso (O-6).
        await page.evaluate(() => {
            const ziel = document.getElementById('view-initiative');
            const d = document.createElement('div');
            d.id = 't-c-probe-div';
            d.setAttribute('data-action', 'toggle-quick-ref');
            d.textContent = 'Probe div';
            const l = document.createElement('label');
            l.id = 't-c-probe-label';
            l.setAttribute('data-action', 'toggle-selected');
            l.textContent = 'Probe label';
            const b = document.createElement('button');
            b.id = 't-c-probe-button';
            b.setAttribute('data-action', 'toggle-quick-ref');
            b.textContent = 'Probe button';
            ziel.appendChild(d);
            ziel.appendChild(l);
            ziel.appendChild(b);
        });
        await page.waitForTimeout(500);

        const attr = await page.evaluate(() => {
            const lies = id => {
                const el = document.getElementById(id);
                return el
                    ? { ti: el.getAttribute('tabindex'), rolle: el.getAttribute('role') }
                    : null;
            };
            return {
                div: lies('t-c-probe-div'),
                label: lies('t-c-probe-label'),
                knopf: lies('t-c-probe-button')
            };
        });

        expect(attr.div, 'Die Probe-Knoten fehlen').not.toBeNull();
        expect(attr.div.ti, 'Der nachtraeglich eingehaengte div bekam kein tabindex').toBe('0');
        expect(attr.div.rolle, 'Der nachtraeglich eingehaengte div bekam keine role').toBe(
            'button'
        );

        expect(attr.label.ti, 'Die nachtraeglich eingehaengte Marke bekam kein tabindex').toBe('0');
        expect(
            attr.label.rolle,
            'Die Marke hat eine role bekommen — role="button" ueberschreibt den Marken-Charakter'
        ).toBeNull();

        expect(
            attr.knopf.ti,
            'Ein echter <button> hat ein tabindex bekommen — die Kehrschleife greift in die ' +
                'natuerliche Tabulatorreihe ein, wo sie nichts zu tun hat'
        ).toBeNull();
        expect(attr.knopf.rolle, 'Ein echter <button> hat eine role bekommen').toBeNull();
    });
});

// ============================================================
// (l) KEIN NEUER PHANTOMHALT
// ============================================================
//
// DIESER FALL IST AUS EINEM EIGENEN FEHLER ENTSTANDEN, und darum steht er
// hier. Der erste Lauf der Kehrschleife hat `div#shortcuts-overlay`
// nachgeruestet — eine Blende (`data-action="backdrop-close"`), die
// ausserhalb aller `.view` liegt und im geschlossenen Zustand NUR ueber
// `opacity: 0` und `pointer-events: none` versteckt ist
// (`assets/styles/dmscreen.css`, kein `display: none`, kein
// `visibility: hidden`). Ein `tabindex` darauf bleibt fokussierbar.
// Gemessen mit `sweep2.mjs` der Vermessung: +1 Phantomhalt in 23 von 24
// Ansichten (Armaturenbrett 1 -> 2, Party 2 -> 3, DM-Schirm 8 -> 9) — ein
// Tabulatorsprung auf eine unsichtbare Flaeche von 1440x900 px, auf der der
// Fokusring nichts anzeigt, weil es nichts zu sehen gibt. Das ist genau die
// Sorte Verschlechterung, die eine Erreichbarkeits-Nachruestung einbringen
// kann, waehrend ihre eigene Zahl besser wird.
//
// Der Fall urteilt ueber die KLASSE, nicht ueber das eine Element: kein von
// der Kehrschleife nachgeruestetes Element darf fokussierbar sein, waehrend
// es nur ueber Opazitaet versteckt ist. Die Opazitaetskette ist aus
// `phantom3.mjs` der Vermessung uebernommen.

test.describe('Kehrschleife — kein neuer Phantomhalt', () => {
    for (const ansicht of ALLE_ANSICHTEN) {
        test(`(l) ${ansicht.titel}: kein nachgeruestetes Element ist fokussierbar und dabei unsichtbar`, async ({
            page
        }) => {
            test.setTimeout(90_000);
            await ansichtOeffnen(page, ansicht.name, 20);

            const phantome = await page.evaluate(() => {
                const treffer = [];
                document.querySelectorAll('[data-action][tabindex="0"]').forEach(el => {
                    // Nur, was die Kehrschleife gesetzt haben kann.
                    if (
                        el.matches(
                            'a[href],area[href],button,input,select,textarea,summary,details'
                        )
                    ) {
                        return;
                    }
                    let n = el;
                    let nullOpazitaetAn = null;
                    let blockiert = false;
                    while (n && n !== document.body) {
                        const cs = getComputedStyle(n);
                        if (
                            cs.display === 'none' ||
                            cs.visibility === 'hidden' ||
                            n.hasAttribute('inert') ||
                            n.hasAttribute('hidden')
                        ) {
                            // Richtig versteckt — der Browser nimmt es nicht
                            // in die Tabulatorreihe, also kein Phantomhalt.
                            blockiert = true;
                            break;
                        }
                        if (parseFloat(cs.opacity) === 0 && !nullOpazitaetAn) {
                            nullOpazitaetAn =
                                n.tagName.toLowerCase() +
                                (n.id ? '#' + n.id : '') +
                                (typeof n.className === 'string' && n.className
                                    ? '.' + n.className.trim().split(/\s+/)[0]
                                    : '');
                        }
                        n = n.parentElement;
                    }
                    if (blockiert || !nullOpazitaetAn) return;
                    treffer.push(
                        `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} ` +
                            `[${el.getAttribute('data-action')}] — opacity:0 an ${nullOpazitaetAn}`
                    );
                });
                return treffer;
            });

            expect(
                phantome,
                'Nachgeruestete Elemente, die fokussierbar und dabei unsichtbar sind:\n    ' +
                    phantome.join('\n    ')
            ).toEqual([]);
        });
    }

    test('(l) die Blende div#shortcuts-overlay bleibt ohne tabindex', async ({ page }) => {
        test.setTimeout(90_000);
        await ansichtOeffnen(page, 'initiative', 6);
        const attr = await page.evaluate(() => {
            const el = document.getElementById('shortcuts-overlay');
            return el
                ? {
                      aktion: el.getAttribute('data-action'),
                      ti: el.getAttribute('tabindex'),
                      rolle: el.getAttribute('role')
                  }
                : null;
        });
        expect(attr, 'div#shortcuts-overlay steht nicht im Dokument').not.toBeNull();
        expect(attr.aktion, 'Die Blende traegt nicht mehr backdrop-close').toBe('backdrop-close');
        expect(attr.ti, 'Die Blende hat ein tabindex bekommen — Phantomhalt').toBeNull();
        expect(attr.rolle, 'Die Blende hat eine role bekommen').toBeNull();
    });
});

// ============================================================
// (m) DER MAUSKLICK GIBT DIE LEERTASTE NICHT AUS DER HAND
// ============================================================

//
// WAS HIER SCHIEFGEHT, in der Sprache des Spieltischs. Der Spielleiter
// klickt mit der Maus auf den Initiative-Wert eines Kaempfers, weil sich der
// Spieler verwuerfelt hat, tippt die Korrektur, bestaetigt — und drueckt
// dann die Leertaste, um den Zug weiterzugeben. Das ist sein gewohnter
// Griff, und er funktionierte bis zur Kehrschleife.
//
// Seit der Kehrschleife funktioniert er nicht mehr: der Mausklick parkt den
// Fokus AUF dem angeklickten `div` (bis dahin nahm es keinen Fokus an, der
// Fokus blieb auf `BODY`), und die Leertaste bedient dann das Element unter
// dem Fokus statt den Zug zu wechseln. Gemessen am gebauten Buendel, echte
// Maus, echte Taste, gefuellte Kampagne, HEAD b469377:
//
//   Mausklick auf div.init-value  ->  activeElement = das div
//                                     :focus true, :focus-visible FALSE
//   danach Leertaste              ->  Zug 0 -> 0, Runde 1 -> 1
//                                     und ein ZWEITER prompt() geht auf
//                                     (Dialoge 1 -> 2, synthetischer Klick 1)
//
// Ohne die Kehrschleife laesst derselbe Mausklick den Fokus auf `BODY`, und
// die Leertaste macht Zug 0 -> 1. Der Unterschied ist die Kehrschleife.
//
// WARUM DAS NICHT DIE SCHRANKE AUS T-A IST, obwohl es so aussieht. Die
// Schranke (`beanspruchtLeertaste`) kommt in diesem Fall gar nicht zum Zug:
// der `keydown`-Zweig in `ui/event-delegation.js` faengt die Taste schon in
// der Capture-Phase ab, weil das `div` eine registrierte Aktion traegt. Die
// Regel selbst ist alt; NEU an der Kehrschleife ist, dass sie fuer rund 430
// Elemente gilt, die vorher ueberhaupt keinen Fokus annehmen konnten. Die
// Akte von T-A verspricht ausdruecklich "ohne Fokus (activeElement = BODY)
// ... die Leertaste wechselt weiter den Zug" — die Kehrschleife hat still
// die Menge der Lagen verkleinert, in denen `activeElement` BODY ist.
//
// WAS DIE KORREKTUR TUT, und wie schmal sie ist: ein von der Kehrschleife
// versorgtes Element beansprucht die LEERTASTE nur bei TASTATURFOKUS. Enter
// bleibt unberuehrt (Fall (p)), denn Enter konkurriert mit keinem Kuerzel.
// Nativen Knoepfen wird nichts weggenommen (Fall (o)): auf ihnen ist die
// Leertaste schon vor der Kehrschleife eine Bedienung gewesen, und das zu
// aendern waere eine Ruecknahme von T-A statt eine Korrektur von T-C.
//
// UND WARUM SIE NICHT `:focus-visible` FRAGT, obwohl die Pseudoklasse genau
// diese Frage beantwortet. Weil sie sie zu spaet beantwortet: Chromium setzt
// `:focus-visible`, sobald eine Taste fliegt — auch die Taste, ueber die
// gerade entschieden werden soll. Gemessen mit einem Lauscher am `window` in
// der Capture-Phase (laeuft vor JEDEM Lauscher am `document`), nach einem
// echten Mausklick auf `div.init-value`:
//
//   vor dem Tastendruck   :focus true, :focus-visible FALSE
//   IM keydown            :focus true, :focus-visible TRUE   <-- zu spaet
//   im keyup / danach     :focus true, :focus-visible TRUE
//
// Die Faelle (m), (o) und (p) lesen `:focus-visible` darum VOR dem
// Tastendruck und nur als Diagnose. Die Schranke selbst haengt an einer
// eigenen Mitschrift (`KeyboardReach._fokusMitschrift()`), die beim
// `focusin` stempelt statt beim Tastendruck zu fragen.
//
// MESSDISZIPLIN, DRITTER FALL. Hier wird mit `locator.click()` geklickt, und
// das ist kein Bruch von Regel 1 oben: `page`/`locator.click()` ist ein
// ECHTER Mausklick ueber das Fernsteuerprotokoll (`isTrusted`), kein
// `element.click()` im Dokument. Der Mausklick IST hier der Messgegenstand.
// Dieselbe Begruendung steht bei Fall (g2) in `tastatur-ausloesung.spec.js`.
//
// UND: IM `dialog`-HAKEN WIRD NICHT `page.evaluate()` GERUFEN. Solange ein
// `prompt()` offen ist, laeuft im Dokument kein JavaScript — der Aufruf
// haengt, der Dialog wird nie geschlossen, und der Fall laeuft in seinen
// Zeitablauf statt zu urteilen. Gezaehlt wird darum in Node.

/**
 * Haengt einen zaehlenden `dialog`-Haken an und gibt das Zaehlwerk zurueck.
 * @param {import('@playwright/test').Page} page
 * @returns {{ n: number }}
 */
function dialogZaehler(page) {
    const zaehlwerk = { n: 0 };
    page.on('dialog', d => {
        zaehlwerk.n++;
        d.dismiss().catch(() => {});
    });
    return zaehlwerk;
}

/**
 * @param {import('@playwright/test').Page} page
 */
function kampfZustand(page) {
    return page.evaluate(() => ({
        zug: window.D.initiative.currentTurn,
        runde: window.D.initiative.round,
        ansicht: document.querySelector('.view.active')?.id || '?',
        scrollY: Math.round(window.scrollY)
    }));
}

/**
 * ECHTER Mausklick auf das erste Vorkommen von `selektor`. Merkt das
 * getroffene Objekt vorher unter `window.__ziel` — Objektidentitaet, damit
 * der Klickzaehler unten nicht auf ein zweites, textgleiches Element zeigt
 * (Messdisziplin 3).
 * @param {import('@playwright/test').Page} page
 * @param {string} selektor
 */
async function mausKlickAuf(page, selektor) {
    const vorhanden = await page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (!el) return false;
        window.__ziel = el;
        return true;
    }, selektor);
    expect(vorhanden, `Ziel "${selektor}" steht nicht im Dokument`).toBe(true);
    await page.locator(selektor).first().click();
    await page.waitForTimeout(500);
}

/**
 * Liest, wo der Fokus steht und WIE er dort hingekommen ist.
 * @param {import('@playwright/test').Page} page
 */
function fokuslage(page) {
    return page.evaluate(() => {
        const el = document.activeElement;
        return {
            tag: el ? el.tagName : null,
            istZiel: el === window.__ziel,
            aktion: el && el.getAttribute ? el.getAttribute('data-action') : null,
            ti: el && el.getAttribute ? el.getAttribute('tabindex') : null,
            focus: !!(el && el.matches && el.matches(':focus')),
            focusVisible: !!(el && el.matches && el.matches(':focus-visible'))
        };
    });
}

/**
 * Setzt den Klickzaehler am Dokument (Capture-Phase) auf `window.__ziel` und
 * rollt die Seite auf 0 — Begruendung beider Punkte im Kopfkommentar bzw.
 * bei Fall (i).
 * @param {import('@playwright/test').Page} page
 */
function klickzaehlerSetzen(page) {
    return page.evaluate(() => {
        window.__klicks = { echt: 0, synthetisch: 0 };
        document.addEventListener(
            'click',
            ev => {
                if (ev.target !== window.__ziel) return;
                if (ev.isTrusted) window.__klicks.echt++;
                else window.__klicks.synthetisch++;
            },
            true
        );
        window.scrollTo(0, 0);
    });
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function klicks(page) {
    const k = await page.evaluate(() => window.__klicks);
    return { ...k, gesamt: k.echt + k.synthetisch };
}

/** Das Ziel aller Faelle dieses Abschnitts: die Initiative-Wertbearbeitung. */
const INIT_WERT = 'div.init-value[data-action="edit-init-value"]';

test.describe('Kehrschleife — der Mausklick gibt die Leertaste nicht aus der Hand', () => {
    // Die Initiative ist eine Kampfansicht, also beide Groessen — dieselbe
    // Abwaegung wie bei `groessenFuer()`, hier von Hand, weil der Fall nicht
    // ueber die Ansichtenliste laeuft.
    for (const n of [6, 20]) {
        test(`(m) Mausklick auf die Initiative-Wertbearbeitung, dann Leertaste: der Zug geht um genau 1 weiter — ${n} Eintraege je Typ`, async ({
            page
        }) => {
            test.setTimeout(120_000);
            const dialoge = dialogZaehler(page);
            await ansichtOeffnen(page, 'initiative', n);

            await mausKlickAuf(page, INIT_WERT);

            // Dass der Fokus ueberhaupt dort parkt, ist die halbe Diagnose —
            // und seit der Kehrschleife die Voraussetzung des Fehlers.
            const lage = await fokuslage(page);
            expect(lage.istZiel, 'Der Mausklick hat den Fokus nicht auf dem Ziel geparkt').toBe(
                true
            );
            expect(lage.ti, 'Das Ziel ist nicht von der Kehrschleife versorgt').toBe('0');
            expect(lage.focus, ':focus greift nach dem Mausklick nicht').toBe(true);
            // Diagnose, nicht Mechanismus: VOR dem Tastendruck meldet der
            // Browser hier kein `:focus-visible` — im `keydown` dann doch,
            // und genau deshalb fragt die Schranke nicht danach (s. Kopf).
            expect(
                lage.focusVisible,
                'Der Browser meldet nach einem MAUSKLICK :focus-visible'
            ).toBe(false);
            expect(dialoge.n, 'Der Mausklick hat die Wertbearbeitung nicht geoeffnet').toBe(1);

            const vorher = await kampfZustand(page);
            expect(vorher.zug).toBe(0);
            expect(vorher.runde).toBe(1);
            expect(vorher.ansicht).toBe('view-initiative');

            await klickzaehlerSetzen(page);
            await page.keyboard.press(' ');
            await page.waitForTimeout(700);

            const nachher = await kampfZustand(page);
            const k = await klicks(page);

            expect(
                nachher.zug,
                'Nach einem MAUSKLICK gehoert die Leertaste wieder dem Zug — gemessen Zug ' +
                    `${vorher.zug} -> ${nachher.zug}`
            ).toBe(1);
            expect(nachher.runde, 'und die Runde bleibt stehen').toBe(1);
            expect(
                dialoge.n,
                `Die Leertaste hat die Wertbearbeitung erneut geoeffnet (Dialoge ${dialoge.n})`
            ).toBe(1);
            expect(
                k.gesamt,
                `Die Leertaste hat das angeklickte Element erneut bedient (${k.echt} echte + ` +
                    `${k.synthetisch} synthetische Klicks)`
            ).toBe(0);
            expect(
                nachher.scrollY,
                'Die Leertaste hat die Seite weggerollt — die Vorgabe muss unterdrueckt bleiben'
            ).toBe(0);
        });
    }

    test('(n) Gegenprobe: per Tabulator erreicht, bedient die Leertaste dieselbe Stelle weiter', async ({
        page
    }) => {
        test.setTimeout(120_000);
        const dialoge = dialogZaehler(page);
        await ansichtOeffnen(page, 'initiative', 6);

        const spruenge = await tabBisZiel(page, INIT_WERT);
        expect(spruenge, `${INIT_WERT} ist nicht per Tabulator erreichbar`).toBeGreaterThan(0);

        const lage = await fokuslage(page);
        expect(lage.istZiel).toBe(true);
        expect(lage.focusVisible, 'Nach einem Tabulatorsprung muss :focus-visible greifen').toBe(
            true
        );

        const vorher = await kampfZustand(page);
        await klickzaehlerSetzen(page);
        await page.keyboard.press(' ');
        await page.waitForTimeout(700);

        const nachher = await kampfZustand(page);
        const k = await klicks(page);

        expect(
            dialoge.n,
            'Die Leertaste muss die ertabulierte Wertbearbeitung oeffnen — sonst ist die ' +
                'Korrektur zu breit und nimmt der Kehrschleife ihren Zweck'
        ).toBe(1);
        expect(k.gesamt, 'genau ein Klick').toBe(1);
        expect(k.echt, 'und zwar der synthetische aus dem keydown-Zweig').toBe(0);
        expect(nachher.zug, 'der Zug darf sich dabei NICHT bewegen').toBe(vorher.zug);
        expect(nachher.runde).toBe(vorher.runde);
        expect(nachher.scrollY, 'und die Seite rollt nicht weg').toBe(0);
    });

    test('(o) Gegenprobe: dem nativen Knopf wird nichts weggenommen', async ({ page }) => {
        test.setTimeout(120_000);
        dialogZaehler(page);
        await ansichtOeffnen(page, 'initiative', 6);

        // Auf einem echten `<button>` ist die Leertaste schon vor der
        // Kehrschleife eine Bedienung gewesen — auch nach einem Mausklick
        // (gemessen an HEAD b469377: Zug 1 -> 2, :focus-visible false). Das
        // ist T-A, nicht T-C. Die Korrektur dieses Falls darf es nicht
        // anfassen, sonst ist der Einschlag breiter als der Befund.
        await mausKlickAuf(page, 'button[data-action="call"][data-value="nextTurn"]');

        const lage = await fokuslage(page);
        expect(lage.tag, 'Der Mausklick hat den Knopf nicht fokussiert').toBe('BUTTON');
        expect(lage.istZiel).toBe(true);
        expect(
            lage.focusVisible,
            'auch hier meldet der Browser nach der Maus kein :focus-visible'
        ).toBe(false);

        const vorher = await kampfZustand(page);
        expect(vorher.zug, 'der Mausklick selbst hat den Zug weitergegeben').toBe(1);

        await klickzaehlerSetzen(page);
        await page.keyboard.press(' ');
        await page.waitForTimeout(700);

        const nachher = await kampfZustand(page);
        const k = await klicks(page);

        expect(
            nachher.zug,
            'Die Leertaste muss den nativen Knopf weiter bedienen (Zug 1 -> 2) — eine ' +
                'Aenderung hier waere eine Ruecknahme von T-A'
        ).toBe(2);
        expect(k.gesamt, 'genau ein Klick, kein Doppelfeuer').toBe(1);
        expect(k.echt, 'und zwar der synthetische aus dem keydown-Zweig').toBe(0);
    });

    test('(p) Gegenprobe: Enter bleibt unberuehrt — es konkurriert mit keinem Kuerzel', async ({
        page
    }) => {
        test.setTimeout(120_000);
        const dialoge = dialogZaehler(page);
        await ansichtOeffnen(page, 'initiative', 6);

        await mausKlickAuf(page, INIT_WERT);
        expect(dialoge.n, 'Der Mausklick hat die Wertbearbeitung nicht geoeffnet').toBe(1);

        const lage = await fokuslage(page);
        expect(lage.istZiel).toBe(true);
        expect(lage.focusVisible).toBe(false);

        await klickzaehlerSetzen(page);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(700);

        const k = await klicks(page);
        expect(
            dialoge.n,
            'Enter muss die angeklickte Stelle weiter bedienen — es gibt kein Enter-Kuerzel, ' +
                'also nichts, was ihm die Taste streitig macht'
        ).toBe(2);
        expect(k.gesamt, 'genau ein Klick').toBe(1);
        expect(k.echt, 'und zwar der synthetische aus dem keydown-Zweig').toBe(0);
    });
});
