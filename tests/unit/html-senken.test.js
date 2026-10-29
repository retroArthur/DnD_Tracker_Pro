/**
 * HTML-Senken — Strukturwaechter R6 (Ratsche), Vertrag SENKEN, docs/bugfixes.md
 *
 * DER BEFUND. Ueber den Kampagnen-Import (und jeden anderen Weg nach D:
 * Backup, Datei-Backup, Migration, Start aus localStorage, zweiter Tab) laufen
 * eingeschleuste Scripte, weil viele Darstellungen Werte aus D ohne esc() in
 * innerHTML oder in Attribute setzen — gemessen in 29 Text- und 49 Zahlen-/
 * Verweisfeldern, darunter Klassen-, Stil- und data-Attribute, Fallbacks aus
 * Label-Tabellen (`MAP[x] || x`) und `status.toUpperCase()`. Die Ausgabe zu
 * kodieren ist die eigentliche Absicherung (R1). DIESER Test sorgt dafuer,
 * dass keine NEUE ungeschuetzte Stelle dazukommt, waehrend die alten
 * abgebaut werden.
 *
 * WAS GEZAEHLT WIRD. Ueber jede Datei aus `loader.js MODULES` (dieselbe einzige
 * Liste, die build.py liest; extrahiert wie in module-test-coverage.test.js)
 * laeuft ein AST-Durchgang mit acorn (kommt ueber eslint -> espree, siehe
 * package-lock.json; kein neues Paket). Gezaehlt wird jede "Stelle", deren
 * Wert ungeprueft in HTML landet:
 *
 *   (a) jede Interpolation `${...}` in einem HTML-artigen Template-Literal
 *       (roher Text enthaelt `<`, `>`, `="` oder `='` — die Regel aus der
 *       Vorsichtung, die 1587 Rohfunde lieferte),
 *   (b) jeder Nicht-Literal-Teil einer `+`-Kette, in der ein HTML-artiges
 *       Literal steht (die Kette wird flach gemacht, gezaehlt wird nur an
 *       ihrer Wurzel, damit kein Teil doppelt zaehlt),
 *   (c) jeder Wert, der DIREKT einer HTML-Senke uebergeben wird:
 *       `x.innerHTML`/`x.outerHTML`/`x.srcdoc` mit `=`, `+=`, `||=`, `&&=`,
 *       `??=` (auch als `x['innerHTML']`), `insertAdjacentHTML(_, wert)`,
 *       `createContextualFragment`, `setHTMLUnsafe`, `document.write(ln)`,
 *       `setAttribute('srcdoc'|'on…', wert)`. Ohne (c) waeren
 *       `el.innerHTML = entry.content` (Schnellreferenz, Bearbeiten-Modal) und
 *       `div.innerHTML = html` (Markdown-Wandler, auf einem losgeloesten
 *       Element — eingebettete Handler laufen trotzdem) unsichtbar: dort steht
 *       kein Template.
 *
 *   AUFRUF — ein Parameter, der UNVERAENDERT in HTML landet. Ist der Wert
 *   einer Stelle genau ein Parameter einer benannten Funktion (auch
 *   `p || ''`), haengt seine Sicherheit allein am Aufrufer:
 *   `function htmlToMarkdown(html) { div.innerHTML = html; }` ist sicher,
 *   wenn jeder Aufruf geprueftes Markup uebergibt, und unsicher mit
 *   `htmlToMarkdown(npc.description)`. Gezaehlt wird dann nicht die Stelle
 *   in der Funktion (einmal, egal wie viele Aufrufer), sondern JEDER Aufruf
 *   mit ungeprueftem Wert an dieser Position — sonst waere ein NEUER roher
 *   Aufrufer unsichtbar (Mutationsprobe unten). Reicht der Aufrufer nur
 *   seinen eigenen Parameter durch, wandert die Frage eine Ebene weiter.
 *   Sind nicht alle Aufrufer zu sehen, zaehlt die Stelle wie bisher in der
 *   Funktion: wenn die Funktion als Wert weitergegeben wird (Rueckruf,
 *   Tabelle, Alias unter anderem Namen) oder ihr Name als Text im Quellbaum
 *   oder in assets/templates steht (`data-action="call"` ruft
 *   `window[ctx.value](ctx.id)`, ebenso `data-lazy-render` und die
 *   onChange-Handler). Eine Funktion ohne jeden Aufrufer zaehlt 0: toter
 *   Code gibt nichts aus — wer ihn wieder anschliesst, zaehlt beim Aufruf.
 *
 *   KONTEXT — welche Kodierung wo reicht. Ein Zustandsautomat liest den
 *   Markup-Text VOR der Stelle und bestimmt, wo sie steht:
 *     - Elementinhalt: esc(), sanitizeHTML() und escapeHtml() schuetzen.
 *     - Attributwert in "..." oder '...': nur esc() — sanitizeHTML und
 *       escapeHtml lassen `"` stehen (Regel ATTRIBUT).
 *     - Wert ohne Anfuehrungszeichen (`class=${x}`), Attributnamen-Position
 *       (`<i ${x}>`), on*-Attribut, <script>: KEIN Kodierer. esc() kodiert
 *       weder Leerzeichen noch `=`, und in on*-Attributen und <script> macht
 *       der Parser aus `&#39;` wieder `'`, bevor das Script laeuft. Sicher
 *       sind dort nur Werte ohne Datentext: Literale, Zahlen, Formpruefer,
 *       eigene HTML-Bausteine.
 *   Der Stil-Kontext (`style="..."`, <style>) ist R2, nicht R6: esc() haelt
 *   dort das Attribut zu; Farben und Klassen pruefen sichereFarbe()/
 *   sichereKlasse() — die Ratsche nimmt beide als Formpruefer an, wenn
 *   Ersatz und Erlaubnisliste aus dem Code kommen.
 *
 * WAS NICHT ZAEHLT — jede Ausnahme mit ihrem Grund. Eine Stelle zaehlt nicht,
 * wenn ihr Wert "geprueft" ist, d. h. kein ungeprueftes Datenmaterial tragen
 * kann. Geprueft sind:
 *
 *   - `esc(x)`: kodiert & < > " ' — sicher in Text UND Attribut.
 *   - `sanitizeHTML(x)` und `escapeHtml(x)` (ui/editors, textContent ->
 *     innerHTML): sicher im ELEMENTINHALT. In einem Attributwert NICHT — beide
 *     lassen `"` im Text stehen, ein `"` beendet das Attribut. Dort zaehlen
 *     sie (Regel ATTRIBUT unten).
 *   - `Number()`, `parseInt()`, `parseFloat()`, `Boolean()`, `isNaN()`,
 *     `isFinite()`, `Math.*`, `Number.*`, `Date.*`: liefern Zahl/Wahrheit.
 *   - Arithmetik (`- * / % ** | & ^ << >> >>>`), Vergleiche, `in`,
 *     `instanceof`, unaere Operatoren (`-x`, `+x`, `!x`, `typeof x`, `void`),
 *     `++/--`: das Ergebnis ist eine Zahl, ein Wahrheitswert oder eines der
 *     festen typeof-Woerter — egal, was hineingeht.
 *   - Methoden, die nur Zahl/Wahrheit liefern oder NUR an Number/Date haengen
 *     (`toFixed`, `indexOf`, `includes`, `some`, `getFullYear`,
 *     `toLocaleDateString`, ...): JSON kann keine Funktionen tragen; ein
 *     Datenwert, dem die Methode fehlt, wirft beim Aufruf und gibt nichts aus.
 *     Bewusst NICHT dabei: `toLocaleString` (haengt an Object.prototype und
 *     liefert bei einem String den String selbst) und `toString`.
 *   - Literale jeder Art (String-Literale sind Code, keine Daten) und
 *     Template-Literale, deren Interpolationen alle geprueft sind.
 *   - Ternaries: geprueft, wenn BEIDE Zweige es sind (die Bedingung wird nie
 *     ausgegeben) — "Ternaries aus Literalen" sind der haeufigste Fall.
 *     `a && b`: nur `b` zaehlt — die linke Seite kommt nur durch, wenn sie
 *     falsy ist ('', 0, NaN, false, null, undefined), und die tragen kein
 *     Markup. `a || b` und `a ?? b`: beide Seiten. Deshalb zaehlt der
 *     Label-Fallback `MAP[x] || x`.
 *   - Ein weiteres HTML-Template bzw. eine HTML-Kette als Wert: die wird
 *     selbst als eigene Stelle (a)/(b) gezaehlt; sie hier noch einmal zu
 *     zaehlen, hiesse denselben Fehler zweimal.
 *   - Bezeichner, deren JEDE Wertquelle geprueft ist: Initialisierung, jede
 *     Zuweisung (`=`, `+=`, `||=`, `??=`, `&&=`), jedes `name.x = ...`,
 *     `name.push(...)`/`unshift`/`splice`/`set`/`add`/`fill` und
 *     `Object.assign(name, ...)` im Geltungsbereich (bei Modulkonstanten:
 *     im ganzen Quellbaum). Das deckt `let html = ''; html += \`<li>...\``,
 *     `const parts = []; parts.push(...); parts.join('')` und
 *     Konstanten-Tabellen ohne Datenanteil (`RELATION_STATUS[rel.status]`).
 *     Ein Tabellenzugriff mit einem Schluessel aus Daten liefert einen
 *     Tabellenwert, `undefined` oder bei `__proto__`/`constructor` ein
 *     Objekt/eine Funktion, deren Textform kein Markup aus Daten enthaelt.
 *     `var X = window.X` (das Importmuster des Projekts) ist ein Alias auf
 *     die Moduldeklaration von X.
 *   - Funktionsparameter sind Daten — mit drei Ausnahmen: der Index-Parameter
 *     eines Iterations-Rueckrufs (`.map((x, i) => ...)`, `Array.from(_, (_, i)
 *     => ...)`) ist immer eine Zahl; der Element-Parameter ist geprueft, wenn
 *     das durchlaufene Array es ist (`['str', 'dex'].map(a => ...)`); und der
 *     Akkumulator eines `reduce`-Rueckrufs traegt nur dessen eigene
 *     Rueckgaben und den Startwert, die beide an der reduce-Stelle beurteilt
 *     werden. Dasselbe gilt fuer `for (const x of liste)`.
 *   - Aufrufe erlaubter sicherer Render-Hilfen: eine im Quellbaum
 *     deklarierte Funktion, deren JEDE Rueckgabe geprueft ist (meist ein
 *     HTML-Template, das an seiner eigenen Stelle gezaehlt wird). Die Liste
 *     wird aus dem Code ABGELEITET, nicht von Hand gefuehrt — eine Hand-Liste
 *     muesste bei jeder neuen Hilfe nachgezogen werden und luege, sobald eine
 *     gelistete Hilfe einen Rohwert zurueckgibt. Gibt eine Funktion einen
 *     Datenwert durch (`function label(c) { return c.name; }`), zaehlt jeder
 *     Aufruf in HTML.
 *   - `.map(rueckruf)`: die Elemente sind die Rueckgaben des Rueckrufs;
 *     `.join(t)`, `.filter`, `.slice`, `.sort`, String-Methoden wie `.trim`,
 *     `.toUpperCase` reichen ihr Objekt durch (Grossschreibung schuetzt
 *     NICHT — `status.toUpperCase()` zaehlt, wenn `status` Daten ist).
 *     `.replace(m, e)` ist geprueft, wenn Objekt UND Ersatz es sind.
 *   - `.length` direkt hinter einem Array-Erzeuger (`.filter(...).length`,
 *     `Object.keys(o).length`) ist immer eine Zahl. `daten.length` dagegen
 *     NICHT: ein importiertes Objekt kann eine Eigenschaft `length` mit Text
 *     tragen — dieselbe Lage wie bei verschachtelten IDs, die kein Import
 *     normalisiert (Kritik: "IDs sind KEINE Ausnahme").
 *   - Selektoren: ein Template oder eine Kette, die direkt an
 *     `querySelector(All)`, `closest` oder `matches` geht, wird nie als
 *     Markup geparst und ist keine HTML-Stelle.
 *
 *   ATTRIBUT: `sanitizeHTML(...)`/`escapeHtml(...)` in einem Attributwert
 *   (`title="${sanitizeHTML(x)}"`) zaehlt — auch ueber eine Hilfe, die nur
 *   sanitizeHTML() zurueckgibt (Regel KONTEXT).
 *   `sichererLink()` ist KEIN Kodierer: er laesst den Link unveraendert
 *   (samt `"`) durch und gehoert im Attribut zusaetzlich in esc().
 *
 * WAS DER ZAEHLER NICHT SIEHT (bewusst, eine Ratsche ist kein Beweis):
 * Mutation einer Tabelle ueber einen Alias oder einen Parameter
 * (`const t = TABELLE; t.x = daten`), CSS-Injektion ueber esc()-te Werte im
 * Stil-Kontext (R2, siehe oben), `href`/`window.open` mit einem
 * Skript-Schema (R3, getrennt geprueft in tests/unit/datengrenze.test.js),
 * einen weiteren Rohwert in einer Akkumulator-Variable, deren Senke schon
 * gezaehlt ist (`html += x` zaehlt an der Senke EINMAL), und Werte, die per
 * `textContent` oder DOM-API gesetzt werden (die sind ohnehin sicher). Werte
 * aus destrukturierten Mustern und Methoden an Objekten (`EntityLookup.x()`)
 * zaehlen immer — sie gelten als Daten.
 *
 * DIE MUTATIONSPROBE (Teil 1, letzter Fall) haengt an ein ECHTES Modul je
 * eine neue ungeschuetzte Stelle jeder Art an und verlangt in jeder Zeile
 * genau +1 und in jeder anderen Datei keine Bewegung. Faellt eine Regel weg
 * (z. B. srcdoc oder der Kontext), wird genau diese Zeile rot.
 *
 * DIE RATSCHE. `BASIS` haelt fuer jede Datei mit mindestens einer Stelle die
 * heutige Zahl (erhoben am Stand main 020e258). Rot wird der Test, wenn
 *   - eine Datei UEBER ihrer Basis liegt (eine Stelle kam dazu),
 *   - eine nicht gelistete Datei mehr als 0 hat (neue Dateien starten bei 0),
 *   - eine Datei UNTER ihrer Basis liegt: dann ist eine Stelle behoben und die
 *     Basis MUSS gesenkt werden ("Basis senken"), sonst bliebe der gewonnene
 *     Spielraum offen fuer die naechste ungeschuetzte Stelle — dasselbe
 *     Muster wie die nur schrumpfende Ausnahmeliste in
 *     module-test-coverage.test.js. Auf 0 gesunken: Eintrag streichen.
 * Die Meldungen nennen jede Stelle mit Datei:Zeile — das ist die Arbeitsliste.
 *
 * WARUM DIE SCHLUESSEL OHNE ".js" STEHEN. module-test-coverage.test.js zaehlt
 * jede woertliche Nennung eines Modulpfads unter tests/ als Abdeckung. Diese
 * Ratsche liest JEDES Modul gleich (wie console-hygiene.test.js, das auch
 * keinen Pfad nennt) und prueft kein Verhalten eines einzelnen Moduls; ein
 * woertlicher Schluessel nehme deshalb gut zwanzig Module still aus der
 * Abdeckungs-Ausnahmeliste — und wuerde sie wieder hineinwerfen, sobald ihre
 * Basis auf 0 sinkt und der Eintrag fallen muss, wohin die nur schrumpfende
 * Liste sie nicht zuruecklaesst. Der Schluessel ist der loader.js-Pfad ohne
 * Endung; der Test bildet ihn mit `schluessel()` und meldet unbekannte
 * Schluessel als verwaist.
 */

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const { extractModulesFromLoader } = require('../../tools/generate-eslint-globals.js');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOADER_PATH = path.join(REPO_ROOT, 'loader.js');

// ============================================================
// REGELN (benannte Mengen, an genau einer Stelle)
// ============================================================

/** Roher Template-/Literaltext, der nach HTML aussieht (Regel der Vorsichtung). */
const HTML_ZEICHEN = /[<>]|="|='/;

/** Aufrufe, deren Ergebnis ueberall sicher ist (Text UND Attribut). */
const SICHERE_FUNKTIONEN = new Set([
    'esc',
    'Number',
    'parseInt',
    'parseFloat',
    'Boolean',
    'isNaN',
    'isFinite'
]);

/** Aufrufe, deren Ergebnis nur im Elementinhalt sicher ist — `"` bleibt stehen. */
const NUR_TEXT_SICHERE_FUNKTIONEN = new Set(['sanitizeHTML', 'escapeHtml']);

/** Methoden, die nur Zahl/Wahrheit liefern oder nur an Number/Date haengen. */
const ZAHL_ODER_WAHRHEIT_METHODEN = new Set([
    'toFixed',
    'toPrecision',
    'indexOf',
    'lastIndexOf',
    'findIndex',
    'findLastIndex',
    'includes',
    'some',
    'every',
    'startsWith',
    'endsWith',
    'test',
    'getTime',
    'getFullYear',
    'getMonth',
    'getDate',
    'getDay',
    'getHours',
    'getMinutes',
    'getSeconds',
    'getMilliseconds',
    'toLocaleDateString',
    'toLocaleTimeString',
    'toISOString',
    'toDateString',
    'toTimeString',
    'localeCompare',
    'charCodeAt',
    'codePointAt',
    'hasOwnProperty',
    'has',
    'contains',
    'matches',
    'isArray',
    'isInteger'
]);

/** Methoden, deren Ergebnis aus ihrem Objekt besteht (Text- oder Array-Teile davon). */
const DURCHREICHENDE_METHODEN = new Set([
    'trim',
    'trimStart',
    'trimEnd',
    'toUpperCase',
    'toLowerCase',
    'toLocaleUpperCase',
    'toLocaleLowerCase',
    'slice',
    'substring',
    'substr',
    'charAt',
    'at',
    'normalize',
    'toString',
    'valueOf',
    'repeat',
    'split',
    'filter',
    'sort',
    'reverse',
    'flat',
    'toSorted',
    'toReversed',
    'find',
    'findLast',
    'pop',
    'shift'
]);

/** Rueckruf-Methoden, deren zweiter Rueckruf-Parameter der (numerische) Index ist. */
const ITERATIONS_METHODEN = new Set([
    'map',
    'forEach',
    'filter',
    'some',
    'every',
    'find',
    'findIndex',
    'flatMap',
    'findLast',
    'findLastIndex'
]);

/** Methoden, die immer ein echtes Array liefern (oder werfen) — `.length` dahinter ist eine Zahl. */
const ARRAY_ERZEUGER = new Set([
    'filter',
    'map',
    'slice',
    'split',
    'concat',
    'flat',
    'flatMap',
    'sort',
    'reverse',
    'keys',
    'values',
    'entries',
    'from',
    'toSorted',
    'toReversed'
]);

/** Ziel ist ein CSS-Selektor, kein Markup. */
const SELEKTOR_METHODEN = new Set(['querySelector', 'querySelectorAll', 'closest', 'matches']);

/** Direkte HTML-Senken (Regel (c)). `srcdoc` ist ein ganzes Dokument im iframe. */
const HTML_SENKEN_EIGENSCHAFTEN = new Set(['innerHTML', 'outerHTML', 'srcdoc']);
const HTML_SENKEN_METHODEN = new Set([
    'insertAdjacentHTML',
    'createContextualFragment',
    'setHTMLUnsafe',
    'write',
    'writeln'
]);
/** Zuweisungen, deren rechte Seite in der Eigenschaft landen kann (nicht `-=`, `*=` usw.). */
const WERT_ZUWEISUNGEN = new Set(['=', '+=', '||=', '&&=', '??=']);

/**
 * Formpruefer aus utils/basic.js (Vertrag R2): das Ergebnis ist ein Wert, den
 * die Pruefung durchgelassen hat (`#rgb`/`#rrggbb` bzw. ein Wert der
 * Erlaubnisliste), oder der Ersatz. Sicher, wenn die Argumente an den hier
 * genannten Stellen (Ersatz, Erlaubnisliste) es sind — die kommen aus dem Code.
 * `sichererLink` steht bewusst NICHT hier: er laesst `"` im Link stehen und
 * gehoert im Attribut zusaetzlich in esc().
 */
const FORMPRUEFER = new Map([
    ['sichereFarbe', [1]],
    ['sichereKlasse', [1, 2]]
]);

/** Mutierende Aufrufe, deren Argumente zu Wertquellen ihres Objekts werden. */
const MUTIERENDE_METHODEN = new Set(['push', 'unshift', 'splice', 'set', 'add', 'fill']);

/** Der Datenbaum selbst ist nie geprueft — egal, was eine Zuweisung an ihn sagt. */
const DATENWURZELN = new Set(['D']);

/**
 * Wo im Markup steht eine Stelle? Kleiner Zustandsautomat ueber den Text VOR
 * ihr (fruehere Interpolationen als 'X'). Liefert den Zustand am Ende:
 *   'text'        Elementinhalt (`roh` = 'script'/'style', wenn darin),
 *   'tag'         Attributnamen-Position (`<div ${x}>`),
 *   'ungequotet'  Attributwert ohne Anfuehrungszeichen (`class=${x}`),
 *   'dq' / 'sq'   Attributwert in "..." bzw. '...',
 * dazu den Namen des Attributs, in dem die Stelle steht.
 */
function markupKontext(text) {
    let zustand = 'text';
    let attribut = '';
    let tag = '';
    let roh = null;
    const tagEnde = () => {
        zustand = 'text';
        roh = tag === 'script' || tag === 'style' ? tag : null;
    };
    let i = 0;
    while (i < text.length) {
        const z = text[i];
        if (zustand === 'text') {
            if (roh) {
                const ende = text.toLowerCase().indexOf('</' + roh, i);
                if (ende < 0) break;
                roh = null;
                i = ende;
                continue;
            }
            const m = z === '<' ? /^<(\/?)([a-zA-Z][\w:-]*)/.exec(text.slice(i, i + 40)) : null;
            if (m) {
                zustand = 'tag';
                tag = m[1] ? '' : m[2].toLowerCase();
                attribut = '';
                i += m[0].length;
            } else i++;
        } else if (zustand === 'tag') {
            if (z === '>') tagEnde();
            else if (!/[\s/"']/.test(z)) {
                const m = /^[^\s"'>/=]+/.exec(text.slice(i));
                attribut = m[0].toLowerCase();
                zustand = 'name';
                i += m[0].length;
                continue;
            }
            i++;
        } else if (zustand === 'name') {
            if (z === '=') {
                zustand = 'gleich';
                i++;
            } else if (/\s/.test(z)) i++;
            else zustand = 'tag';
        } else if (zustand === 'gleich') {
            if (/\s/.test(z)) i++;
            else if (z === '"' || z === "'") {
                zustand = z === '"' ? 'dq' : 'sq';
                i++;
            } else if (z === '>') {
                tagEnde();
                i++;
            } else zustand = 'ungequotet';
        } else if (zustand === 'ungequotet') {
            if (/\s/.test(z)) zustand = 'tag';
            else if (z === '>') tagEnde();
            i++;
        } else {
            if (z === (zustand === 'dq' ? '"' : "'")) zustand = 'tag';
            i++;
        }
    }
    if (zustand === 'gleich') zustand = 'ungequotet';
    if (zustand === 'name') zustand = 'tag';
    return { zustand, attribut: zustand === 'text' ? '' : attribut, roh };
}

// ============================================================
// ZAEHLER
// ============================================================

/**
 * Baut den Zaehler ueber eine Dateimenge. Die Dateien werden GEMEINSAM
 * betrachtet, weil das Buendel einen globalen Geltungsbereich hat: eine
 * Hilfe aus render/helpers.js ist in features/ dieselbe Funktion.
 *
 * @param {{rel: string, src: string}[]} dateien
 * @param {string[]} [weitereTexte] Markup ausserhalb der Module (assets/templates):
 *   ein Funktionsname darin kann ueber `window[name](...)` aufgerufen werden.
 * @returns {Map<string, {zeile: number, art: string, text: string}[]>}
 *   je Datei die gezaehlten Stellen; wirft bei einem Parsefehler mit Dateinamen.
 */
function zaehleHtmlSenken(dateien, weitereTexte = []) {
    const eltern = new WeakMap();
    const topFunktionen = new Map();
    const topBindungen = new Map();
    const quellen = new Map();
    /** Name -> jede Nennung (Bezeichner und `window.name`), fuer Regel AUFRUF. */
    const nennungen = new Map();
    /**
     * Jedes Wort in einem String-Literal, Template-Text oder Template-Markup.
     * Eine Funktion, deren Name darin steht, kann dynamisch aufgerufen werden
     * (`data-action="call"` -> `window[ctx.value](ctx.id)`, `data-lazy-render`,
     * onChange-Handler) — ihre Aufrufer sind dann nicht alle zu sehen.
     */
    const textNamen = new Set();
    const woerter = t =>
        (String(t).match(/[A-Za-z_$][\w$]*/g) || []).forEach(w => textNamen.add(w));
    weitereTexte.forEach(woerter);
    const asts = [];

    function lauf(node, besuch, vater) {
        if (!node || typeof node.type !== 'string') return;
        if (vater) eltern.set(node, vater);
        besuch(node);
        for (const k of Object.keys(node)) {
            if (k === 'loc') continue;
            const v = node[k];
            if (Array.isArray(v)) {
                for (const c of v) if (c && typeof c.type === 'string') lauf(c, besuch, node);
            } else if (v && typeof v.type === 'string') lauf(v, besuch, node);
        }
    }

    function kinder(n) {
        const erg = [];
        for (const k of Object.keys(n)) {
            if (k === 'loc') continue;
            const v = n[k];
            if (Array.isArray(v)) {
                for (const c of v) if (c && typeof c.type === 'string') erg.push(c);
            } else if (v && typeof v.type === 'string') erg.push(v);
        }
        return erg;
    }

    const istFunktion = n =>
        !!n &&
        (n.type === 'FunctionDeclaration' ||
            n.type === 'FunctionExpression' ||
            n.type === 'ArrowFunctionExpression');

    function wurzelName(n) {
        while (n && (n.type === 'MemberExpression' || n.type === 'ChainExpression')) {
            n = n.type === 'ChainExpression' ? n.expression : n.object;
        }
        return n && n.type === 'Identifier' ? n.name : null;
    }

    function namenImMuster(muster, erg = []) {
        if (!muster) return erg;
        switch (muster.type) {
            case 'Identifier':
                erg.push(muster.name);
                break;
            case 'AssignmentPattern':
                namenImMuster(muster.left, erg);
                break;
            case 'RestElement':
                namenImMuster(muster.argument, erg);
                break;
            case 'ArrayPattern':
                muster.elements.forEach(e => namenImMuster(e, erg));
                break;
            case 'ObjectPattern':
                muster.properties.forEach(p =>
                    namenImMuster(p.type === 'RestElement' ? p : p.value, erg)
                );
                break;
            default:
                break;
        }
        return erg;
    }

    function windowAlias(n) {
        return n &&
            n.type === 'MemberExpression' &&
            !n.computed &&
            n.object.type === 'Identifier' &&
            n.object.name === 'window'
            ? n.property.name
            : null;
    }

    function quelleNeu(name, node, art) {
        if (!name) return;
        if (!quellen.has(name)) quellen.set(name, []);
        quellen.get(name).push({ node, art });
    }

    // --- Einlesen: AST, Wertquellen je Name, Moduldeklarationen ---
    for (const { rel, src } of dateien) {
        let ast;
        try {
            ast = acorn.parse(src, {
                ecmaVersion: 'latest',
                sourceType: 'script',
                locations: true,
                allowReturnOutsideFunction: true,
                allowHashBang: true
            });
        } catch (fehler) {
            throw new Error(`R6: ${rel} laesst sich nicht parsen: ${fehler.message}`);
        }
        asts.push({ rel, src, ast });
        lauf(ast, node => {
            if (node.type === 'Literal' && typeof node.value === 'string') woerter(node.value);
            else if (node.type === 'TemplateElement') woerter(node.value.raw);
            const genannt = node.type === 'Identifier' ? node.name : windowAlias(node);
            if (genannt) {
                if (!nennungen.has(genannt)) nennungen.set(genannt, []);
                nennungen.get(genannt).push(node);
            }
            if (node.type === 'AssignmentExpression') {
                const links = node.left;
                if (links.type === 'Identifier') quelleNeu(links.name, node, 'zuweisung');
                else if (links.type === 'MemberExpression') {
                    const alias = windowAlias(links);
                    if (alias) quelleNeu(alias, node, 'zuweisung');
                    else quelleNeu(wurzelName(links), node, 'glied');
                } else namenImMuster(links).forEach(n => quelleNeu(n, node, 'muster'));
            } else if (
                (node.type === 'ForOfStatement' || node.type === 'ForInStatement') &&
                node.left.type !== 'VariableDeclaration'
            ) {
                // `for (x of liste)` mit einer AEUSSEREN Variable: jede Runde ist eine
                // Zuweisung an x, ohne dass ein AssignmentExpression im Baum steht.
                const ziel = node.left;
                if (ziel.type === 'MemberExpression') quelleNeu(wurzelName(ziel), node, 'muster');
                else namenImMuster(ziel).forEach(n => quelleNeu(n, node, 'muster'));
            } else if (
                node.type === 'CallExpression' &&
                node.callee.type === 'MemberExpression' &&
                !node.callee.computed
            ) {
                const m = node.callee.property.name;
                if (MUTIERENDE_METHODEN.has(m)) quelleNeu(wurzelName(node.callee.object), node, m);
                if (
                    m === 'assign' &&
                    node.callee.object.type === 'Identifier' &&
                    node.callee.object.name === 'Object' &&
                    node.arguments[0]
                ) {
                    quelleNeu(wurzelName(node.arguments[0]), node, 'assign');
                }
            }
        });
        for (const st of ast.body) {
            if (st.type === 'FunctionDeclaration' && st.id) topFunktionen.set(st.id.name, st);
            if (st.type !== 'VariableDeclaration') continue;
            for (const d of st.declarations) {
                if (d.id.type !== 'Identifier') continue;
                if (istFunktion(d.init)) topFunktionen.set(d.id.name, d.init);
                if (!topBindungen.has(d.id.name)) topBindungen.set(d.id.name, []);
                topBindungen.get(d.id.name).push(d);
            }
        }
    }

    function programmVon(n) {
        let x = n;
        while (eltern.has(x)) x = eltern.get(x);
        return x;
    }
    const enthaelt = (aussen, innen) =>
        innen.start >= aussen.start &&
        innen.end <= aussen.end &&
        programmVon(aussen) === programmVon(innen);

    // --- HTML-Stellen erkennen ---
    function htmlArtig(n) {
        if (n.type === 'Literal') return typeof n.value === 'string' && HTML_ZEICHEN.test(n.value);
        if (n.type === 'TemplateLiteral') {
            return HTML_ZEICHEN.test(n.quasis.map(q => q.value.raw).join(''));
        }
        return false;
    }
    function kette(node) {
        const teile = [];
        (function flach(n) {
            if (n.type === 'BinaryExpression' && n.operator === '+') {
                flach(n.left);
                flach(n.right);
            } else teile.push(n);
        })(node);
        return teile;
    }
    function istKettenWurzel(node) {
        if (node.type !== 'BinaryExpression' || node.operator !== '+') return false;
        const v = eltern.get(node);
        return !(v && v.type === 'BinaryExpression' && v.operator === '+');
    }
    function istSelektorArgument(node) {
        let n = node;
        let v = eltern.get(n);
        while (v && v.type === 'BinaryExpression' && v.operator === '+') {
            n = v;
            v = eltern.get(v);
        }
        return !!(
            v &&
            v.type === 'CallExpression' &&
            v.arguments.includes(n) &&
            v.callee.type === 'MemberExpression' &&
            !v.callee.computed &&
            SELEKTOR_METHODEN.has(v.callee.property.name)
        );
    }
    function istHtmlStelle(node) {
        if (node.type === 'TemplateLiteral') {
            const v = eltern.get(node);
            if (v && v.type === 'TaggedTemplateExpression') return false;
            return htmlArtig(node) && !istSelektorArgument(node);
        }
        if (istKettenWurzel(node)) return kette(node).some(htmlArtig) && !istSelektorArgument(node);
        return false;
    }

    // --- Zyklenschutz: "in Arbeit" gilt vorlaeufig als geprueft; ein Ergebnis,
    //     das auf so einer Annahme ueber einen noch offenen Vorfahren ruht, wird
    //     nicht gemerkt (sonst haenge die Zahl an der Besuchsreihenfolge). ---
    //     Gemerkt wird je MODUS (Regel KONTEXT): was im Elementinhalt geprueft
    //     ist, muss es in einem Attribut oder ohne Anfuehrungszeichen nicht sein.
    const gemerktJeModus = { text: new Map(), attribut: new Map(), streng: new Map() };
    let modus = 'text';
    const inArbeit = new Map();
    let tiefsteAnnahme = Infinity;
    function merke(schluessel, rechne) {
        const gemerkt = gemerktJeModus[modus];
        if (gemerkt.has(schluessel)) return gemerkt.get(schluessel);
        if (inArbeit.has(schluessel)) {
            tiefsteAnnahme = Math.min(tiefsteAnnahme, inArbeit.get(schluessel));
            return true;
        }
        const tiefe = inArbeit.size;
        inArbeit.set(schluessel, tiefe);
        const vorher = tiefsteAnnahme;
        tiefsteAnnahme = Infinity;
        let erg;
        try {
            erg = rechne();
        } finally {
            inArbeit.delete(schluessel);
        }
        const hier = tiefsteAnnahme;
        tiefsteAnnahme = Math.min(vorher, hier >= tiefe ? Infinity : hier);
        if (!erg || hier >= tiefe) gemerkt.set(schluessel, erg);
        return erg;
    }

    // --- Funktionen: geprueft, wenn jede Rueckgabe geprueft ist ---
    function rueckgaben(fn) {
        if (fn.type === 'ArrowFunctionExpression' && fn.expression) return [fn.body];
        const erg = [];
        (function suche(n) {
            if (istFunktion(n)) return;
            if (n.type === 'ReturnStatement') erg.push(n.argument);
            kinder(n).forEach(suche);
        })(fn.body);
        return erg;
    }
    function funktionGeprueft(fn) {
        return merke(fn, () => rueckgaben(fn).every(r => r === null || geprueft(r)));
    }
    function rueckrufGeprueft(rueckruf, objekt) {
        if (!rueckruf) return true;
        if (istFunktion(rueckruf)) return funktionGeprueft(rueckruf);
        if (rueckruf.type === 'Identifier') {
            if (SICHERE_FUNKTIONEN.has(rueckruf.name)) return sichererName(rueckruf.name);
            if (rueckruf.name === 'String') return geprueft(objekt);
            const fn = funktionVon(rueckruf);
            if (fn) return fn.every(funktionGeprueft);
        }
        return false;
    }

    // --- Bindungen ---
    function deklarationenIn(bereich, name) {
        const funde = [];
        const koerper = istFunktion(bereich) ? bereich.body : bereich;
        (function suche(n, oberste) {
            if (!oberste && istFunktion(n)) {
                if (n.type === 'FunctionDeclaration' && n.id && n.id.name === name) {
                    funde.push({ art: 'funktion', fn: n });
                }
                return;
            }
            if (n.type === 'VariableDeclarator') {
                if (n.id.type === 'Identifier') {
                    if (n.id.name === name) funde.push({ art: 'variable', d: n });
                } else if (namenImMuster(n.id).includes(name)) funde.push({ art: 'muster' });
            }
            if (n.type === 'CatchClause' && namenImMuster(n.param).includes(name)) {
                funde.push({ art: 'muster' });
            }
            if (n.type === 'ClassDeclaration' && n.id && n.id.name === name) {
                funde.push({ art: 'muster' });
            }
            kinder(n).forEach(c => suche(c, false));
        })(koerper, true);
        return funde;
    }
    function bindung(bezeichner) {
        const name = bezeichner.name;
        let v = eltern.get(bezeichner);
        while (v) {
            if (istFunktion(v)) {
                const pi = v.params.findIndex(p => namenImMuster(p).includes(name));
                if (pi >= 0) {
                    return {
                        art: 'parameter',
                        fn: v,
                        index: pi,
                        direkt: v.params[pi].type === 'Identifier'
                    };
                }
                if (v.type === 'FunctionExpression' && v.id && v.id.name === name) {
                    return { art: 'funktion', fn: v };
                }
                const funde = deklarationenIn(v, name);
                if (funde.length) return { art: 'lokal', funde, bereich: v };
            }
            if (v.type === 'Program') {
                const funde = deklarationenIn(v, name);
                if (funde.length) return { art: 'modul', funde };
            }
            v = eltern.get(v);
        }
        if (topFunktionen.has(name)) return { art: 'funktion', fn: topFunktionen.get(name) };
        if (topBindungen.has(name)) {
            return {
                art: 'modul',
                funde: topBindungen.get(name).map(d => ({ art: 'variable', d }))
            };
        }
        return null;
    }
    /** Funktionsknoten hinter einem Bezeichner (auch ueber `var f = window.f`), sonst null. */
    function funktionVon(bezeichner) {
        const b = bindung(bezeichner);
        if (!b)
            return topFunktionen.has(bezeichner.name) ? [topFunktionen.get(bezeichner.name)] : null;
        if (b.art === 'funktion') return [b.fn];
        if (b.art !== 'lokal' && b.art !== 'modul') return null;
        const fns = b.funde.map(f => {
            if (f.art === 'funktion') return f.fn;
            const init = f.d && f.d.init;
            if (istFunktion(init)) return init;
            const alias = windowAlias(init);
            return alias && topFunktionen.has(alias) ? topFunktionen.get(alias) : null;
        });
        return fns.length && fns.every(Boolean) ? fns : null;
    }
    function parameterGeprueft(b) {
        if (!b.direkt) return false;
        const aufruf = eltern.get(b.fn);
        if (
            !aufruf ||
            aufruf.type !== 'CallExpression' ||
            aufruf.callee.type !== 'MemberExpression' ||
            aufruf.callee.computed
        ) {
            return false;
        }
        const m = aufruf.callee.property.name;
        const argIndex = aufruf.arguments.indexOf(b.fn);
        const objekt = aufruf.callee.object;
        if (argIndex === 0 && ITERATIONS_METHODEN.has(m)) {
            // Parameter 1 ist der Index (Zahl); Parameter 0 ein Element des Objekts.
            if (b.index === 1) return true;
            return b.index === 0 && geprueft(objekt);
        }
        if (argIndex === 0 && (m === 'reduce' || m === 'reduceRight')) {
            // 0 = Akkumulator (eigene Rueckgaben + Startwert), 1 = Element, 2 = Index.
            if (b.index === 0 || b.index === 2) return true;
            return b.index === 1 && geprueft(objekt);
        }
        if (
            argIndex === 1 &&
            m === 'from' &&
            objekt.type === 'Identifier' &&
            objekt.name === 'Array'
        ) {
            if (b.index === 1) return true;
            return b.index === 0 && geprueft(aufruf.arguments[0]);
        }
        return false;
    }
    function quellenGeprueft(name, bereich) {
        for (const q of quellen.get(name) || []) {
            if (bereich && !enthaelt(bereich, q.node)) continue;
            const n = q.node;
            if (q.art === 'muster') return false;
            if (q.art === 'zuweisung' || q.art === 'glied') {
                if (['=', '+=', '||=', '??=', '&&='].includes(n.operator) && !geprueft(n.right)) {
                    return false;
                }
            } else if (q.art === 'assign') {
                if (!n.arguments.slice(1).every(geprueft)) return false;
            } else if (q.art === 'splice') {
                if (!n.arguments.slice(2).every(geprueft)) return false;
            } else if (q.art === 'set') {
                if (n.arguments[1] && !geprueft(n.arguments[1])) return false;
            } else if (q.art === 'fill') {
                if (n.arguments[0] && !geprueft(n.arguments[0])) return false;
            } else if (!n.arguments.every(geprueft)) return false;
        }
        return true;
    }
    function variableGeprueft(d) {
        const deklaration = eltern.get(d);
        const schleife = deklaration && eltern.get(deklaration);
        if (
            schleife &&
            (schleife.type === 'ForOfStatement' || schleife.type === 'ForInStatement') &&
            schleife.left === deklaration
        ) {
            return geprueft(schleife.right);
        }
        const alias = windowAlias(d.init);
        if (alias) return globalGeprueft(alias);
        return !d.init || geprueft(d.init);
    }
    function globalGeprueft(name) {
        if (DATENWURZELN.has(name)) return false;
        if (topFunktionen.has(name)) return true;
        if (!topBindungen.has(name)) return false;
        return merke('modul:' + name, () => {
            for (const d of topBindungen.get(name)) {
                if (windowAlias(d.init) === name) continue;
                if (!variableGeprueft(d)) return false;
            }
            return quellenGeprueft(name, null);
        });
    }
    function bezeichnerGeprueft(bezeichner) {
        const name = bezeichner.name;
        if (DATENWURZELN.has(name)) return false;
        const b = bindung(bezeichner);
        if (!b) return name === 'undefined' || name === 'NaN' || name === 'Infinity';
        if (b.art === 'parameter') return parameterGeprueft(b);
        if (b.art === 'funktion') return true;
        if (b.art === 'modul' && b.funde.every(f => f.d && windowAlias(f.d.init) === name)) {
            return globalGeprueft(name);
        }
        const erstes = b.funde[0];
        return merke(erstes.d || erstes.fn || bezeichner, () => {
            for (const f of b.funde) {
                if (f.art === 'funktion') continue;
                if (f.art === 'muster') return false;
                if (!variableGeprueft(f.d)) return false;
            }
            return quellenGeprueft(name, b.art === 'lokal' ? b.bereich : null);
        });
    }

    // --- Kern: ist dieser Wert geprueft? ---
    function geprueft(node) {
        if (!node) return true;
        switch (node.type) {
            case 'Literal':
                return true;
            case 'TemplateLiteral':
                return istHtmlStelle(node) || node.expressions.every(geprueft);
            case 'TaggedTemplateExpression':
                return false;
            case 'BinaryExpression':
                if (node.operator !== '+') return true;
                if (istKettenWurzel(node) && istHtmlStelle(node)) return true;
                return kette(node).every(geprueft);
            case 'UnaryExpression':
            case 'UpdateExpression':
                return true;
            case 'LogicalExpression':
                if (node.operator === '&&') return geprueft(node.right);
                return geprueft(node.left) && geprueft(node.right);
            case 'ConditionalExpression':
                return geprueft(node.consequent) && geprueft(node.alternate);
            case 'SequenceExpression':
                return geprueft(node.expressions[node.expressions.length - 1]);
            case 'AssignmentExpression':
                if (node.operator === '=') return geprueft(node.right);
                if (['+=', '||=', '??=', '&&='].includes(node.operator)) {
                    return geprueft(node.left) && geprueft(node.right);
                }
                return true;
            case 'ChainExpression':
                return geprueft(node.expression);
            case 'ArrayExpression':
                return node.elements.every(
                    e => !e || geprueft(e.type === 'SpreadElement' ? e.argument : e)
                );
            case 'ObjectExpression':
                return node.properties.every(p =>
                    geprueft(p.type === 'SpreadElement' ? p.argument : p.value)
                );
            case 'ArrowFunctionExpression':
            case 'FunctionExpression':
            case 'ClassExpression':
                return true;
            case 'NewExpression':
                return node.callee.type === 'Identifier' && node.callee.name === 'Date';
            case 'Identifier':
                return bezeichnerGeprueft(node);
            case 'MemberExpression': {
                const alias = windowAlias(node);
                if (alias) return globalGeprueft(alias);
                if (!node.computed && node.property.name === 'length') {
                    const o =
                        node.object.type === 'ChainExpression'
                            ? node.object.expression
                            : node.object;
                    if (
                        o.type === 'CallExpression' &&
                        o.callee.type === 'MemberExpression' &&
                        !o.callee.computed &&
                        ARRAY_ERZEUGER.has(o.callee.property.name)
                    ) {
                        return true;
                    }
                }
                return geprueft(node.object);
            }
            case 'CallExpression':
                return aufrufGeprueft(node);
            default:
                return false;
        }
    }

    function aufrufGeprueft(node) {
        const c = node.callee.type === 'ChainExpression' ? node.callee.expression : node.callee;
        const args = node.arguments;
        if (istFunktion(c)) return funktionGeprueft(c);
        if (c.type === 'Identifier') {
            if (SICHERE_FUNKTIONEN.has(c.name) || NUR_TEXT_SICHERE_FUNKTIONEN.has(c.name))
                return sichererName(c.name);
            if (FORMPRUEFER.has(c.name)) {
                return FORMPRUEFER.get(c.name).every(i => !args[i] || geprueft(args[i]));
            }
            if (c.name === 'String') return args.every(geprueft);
            const fns = funktionVon(c);
            return !!fns && fns.every(funktionGeprueft);
        }
        if (c.type !== 'MemberExpression' || c.computed) return false;
        const m = c.property.name;
        const o = c.object;
        if (o.type === 'Identifier') {
            if (o.name === 'Math' || o.name === 'Number' || o.name === 'Date') return true;
            if (o.name === 'window') {
                if (SICHERE_FUNKTIONEN.has(m) || NUR_TEXT_SICHERE_FUNKTIONEN.has(m)) {
                    return sichererName(m);
                }
                if (FORMPRUEFER.has(m)) {
                    return FORMPRUEFER.get(m).every(i => !args[i] || geprueft(args[i]));
                }
                return topFunktionen.has(m) && funktionGeprueft(topFunktionen.get(m));
            }
            if (o.name === 'Object' && ['keys', 'values', 'entries'].includes(m)) {
                return args.every(geprueft);
            }
            if (o.name === 'Object' && m === 'freeze') return geprueft(args[0]);
            if (o.name === 'Array' && m === 'isArray') return true;
            if (o.name === 'Array' && m === 'from') {
                return args[1] ? rueckrufGeprueft(args[1], args[0]) : geprueft(args[0]);
            }
        }
        if (ZAHL_ODER_WAHRHEIT_METHODEN.has(m)) return true;
        if (m === 'forEach') return true;
        if (m === 'join') return geprueft(o) && (!args[0] || geprueft(args[0]));
        if (m === 'map' || m === 'flatMap') return rueckrufGeprueft(args[0], o);
        if (m === 'reduce' || m === 'reduceRight') {
            return rueckrufGeprueft(args[0], o) && (!args[1] || geprueft(args[1]));
        }
        if (m === 'replace' || m === 'replaceAll') {
            const ersatz = args[1];
            const ersatzGeprueft =
                !ersatz || (istFunktion(ersatz) ? funktionGeprueft(ersatz) : geprueft(ersatz));
            return geprueft(o) && ersatzGeprueft;
        }
        if (m === 'padStart' || m === 'padEnd')
            return geprueft(o) && (!args[1] || geprueft(args[1]));
        if (m === 'concat') return geprueft(o) && args.every(geprueft);
        if (DURCHREICHENDE_METHODEN.has(m)) return geprueft(o);
        return false;
    }

    // --- Regel KONTEXT: welche Kodierung reicht wo? ---
    /**
     * Ob ein Kodierer als Schutz gilt, haengt davon ab, wo der Wert landet:
     *   'text'      Elementinhalt: esc(), sanitizeHTML(), escapeHtml().
     *   'attribut'  Attributwert in "..."/'...': nur esc() — sanitizeHTML und
     *               escapeHtml lassen `"` stehen.
     *   'streng'    Attributnamen-Position, Wert ohne Anfuehrungszeichen,
     *               on*-Attribut, <script>: KEIN Kodierer. esc() kodiert weder
     *               Leerzeichen noch `=`, und in einem on*-Attribut macht der
     *               Parser aus `&#39;` wieder ein `'`, bevor das Script laeuft.
     *               Sicher sind dort nur Werte ohne Datentext: Literale, Zahlen,
     *               Formpruefer, eigene HTML-Bausteine.
     */
    function sichererName(name) {
        if (modus === 'streng') return SICHERE_FUNKTIONEN.has(name) && name !== 'esc';
        if (modus === 'attribut') return SICHERE_FUNKTIONEN.has(name);
        return SICHERE_FUNKTIONEN.has(name) || NUR_TEXT_SICHERE_FUNKTIONEN.has(name);
    }
    /** geprueft() in einem bestimmten Modus (nur von oben aufrufen, nie verschachtelt). */
    function geprueftIm(n, m) {
        const vorher = modus;
        modus = m;
        try {
            return geprueft(n);
        } finally {
            modus = vorher;
        }
    }
    /** Modus fuer eine Stelle aus ihrem Markup-Kontext. */
    function modusVon(k) {
        if (k.zustand === 'text') return k.roh === 'script' ? 'streng' : 'text';
        if (k.zustand === 'tag' || k.zustand === 'ungequotet') return 'streng';
        return k.attribut.startsWith('on') ? 'streng' : 'attribut';
    }
    const STRENGE = { text: 0, attribut: 1, streng: 2 };

    // --- Regel AUFRUF: Parameter, die unveraendert in HTML landen ---
    /** Name, unter dem eine Funktion aufgerufen wird (Deklaration oder `const f = ...`). */
    function funktionsName(fn) {
        if (fn.type === 'FunctionDeclaration' && fn.id) return fn.id.name;
        const v = eltern.get(fn);
        if (v && v.type === 'VariableDeclarator' && v.init === fn && v.id.type === 'Identifier') {
            return v.id.name;
        }
        return null;
    }
    /**
     * Ist der Wert genau ein direkter Parameter einer Funktion (auch `p || ''`)?
     * Dann haengt er nur am Aufrufer. Ein Parameter, der in der Funktion neu
     * belegt wird, zaehlt nicht dazu — sein Wert stammt nicht nur vom Aufrufer.
     */
    function direkterParameter(n) {
        let x = n;
        while (x && x.type === 'LogicalExpression') {
            if (x.operator === '&&') x = x.right;
            else if (geprueft(x.right)) x = x.left;
            else return null;
        }
        if (!x || x.type !== 'Identifier') return null;
        const b = bindung(x);
        if (!b || b.art !== 'parameter' || !b.direkt || !funktionsName(b.fn)) return null;
        if ((quellen.get(x.name) || []).some(q => enthaelt(b.fn, q.node))) return null;
        return { fn: b.fn, index: b.index };
    }
    /** Rolle einer Nennung: 'aufruf', 'neutral' (Test, typeof, Export, Alias) oder 'entkommt'. */
    function rolle(r, name) {
        const v = eltern.get(r);
        if (!v) return 'entkommt';
        if (v.type === 'CallExpression' && v.callee === r) return 'aufruf';
        if (v.type === 'UnaryExpression' || v.type === 'BinaryExpression') return 'neutral';
        if ((v.type === 'IfStatement' || v.type === 'ConditionalExpression') && v.test === r) {
            return 'neutral';
        }
        if (v.type === 'LogicalExpression' && v.operator === '&&' && v.left === r) return 'neutral';
        if (v.type === 'AssignmentExpression') {
            if (v.left === r) return 'neutral';
            if (windowAlias(v.left) === name) return 'neutral';
        }
        // `var f = window.f`: die Nennungen von f unter DEMSELBEN Namen findet
        // aufrufeVon() ohnehin; ein Alias unter anderem Namen entkommt.
        if (
            v.type === 'VariableDeclarator' &&
            v.init === r &&
            windowAlias(r) === name &&
            v.id.type === 'Identifier' &&
            v.id.name === name
        ) {
            return 'neutral';
        }
        return 'entkommt';
    }
    /**
     * Alle Aufrufe einer Funktion — oder null, wenn sie irgendwo als Wert
     * weitergegeben wird (Rueckruf, Tabelle): dann sind ihre Aufrufer nicht
     * alle zu sehen, und die Stelle zaehlt wie bisher in der Funktion.
     */
    function aufrufeVon(fn) {
        const name = funktionsName(fn);
        if (textNamen.has(name)) return null;
        const aufrufe = [];
        for (const r of nennungen.get(name) || []) {
            const v = eltern.get(r);
            if (r.type === 'MemberExpression') {
                // `window.name` ohne gleichnamige Modulfunktion kann genau diese
                // (verschachtelte, zur Laufzeit exportierte) Funktion sein.
                if (!topFunktionen.has(name)) return null;
                if (topFunktionen.get(name) !== fn) continue;
            } else {
                // Keine Nennung des Werts: Deklaration, Parameter, Eigenschafts-/Schluesselname.
                if (
                    !v ||
                    (istFunktion(v) && (v.id === r || v.params.includes(r))) ||
                    (v.type === 'VariableDeclarator' && v.id === r) ||
                    (v.type === 'MemberExpression' && v.property === r && !v.computed) ||
                    ((v.type === 'Property' ||
                        v.type === 'MethodDefinition' ||
                        v.type === 'PropertyDefinition') &&
                        v.key === r &&
                        !v.computed &&
                        !v.shorthand)
                ) {
                    continue;
                }
                const fns = funktionVon(r);
                if (!fns || !fns.includes(fn)) continue;
            }
            const art = rolle(r, name);
            if (art === 'entkommt') return null;
            if (art === 'aufruf') aufrufe.push(eltern.get(r));
        }
        return aufrufe;
    }

    // --- Zaehlen ---
    const ergebnis = new Map(asts.map(({ rel }) => [rel, []]));
    const relVon = new Map(asts.map(({ rel, src, ast }) => [ast, { rel, src }]));
    function melde(n, art) {
        const { rel, src } = relVon.get(programmVon(n));
        ergebnis.get(rel).push({
            zeile: n.loc.start.line,
            art,
            text: src.slice(n.start, n.end).replace(/\s+/g, ' ').slice(0, 120)
        });
    }
    /**
     * Senken-Parameter: Funktion -> Index -> { stellen, stand }. stand 'offen'
     * (noch nicht aufgeloest), 'innen' (Aufrufer nicht alle sichtbar: die
     * Stellen zaehlen in der Funktion) oder 'aufrufer' (jeder Aufruf mit
     * ungeprueftem Wert zaehlt).
     */
    const senkenParameter = new Map();
    const offen = [];
    function vormerken(fn, index, stelle) {
        if (!senkenParameter.has(fn)) senkenParameter.set(fn, new Map());
        const jeIndex = senkenParameter.get(fn);
        if (!jeIndex.has(index)) {
            jeIndex.set(index, { stellen: [], stand: 'offen', modus: 'text' });
            offen.push([fn, index]);
        }
        const e = jeIndex.get(index);
        if (e.stand === 'offen') {
            e.stellen.push(stelle);
            if (STRENGE[stelle.modus] > STRENGE[e.modus]) e.modus = stelle.modus;
        } else if (e.stand === 'innen') melde(stelle.n, stelle.art);
    }
    /** Eine ungepruefte Stelle: zaehlen — oder, haengt sie nur am Parameter, beim Aufrufer. */
    function ungeprueft(n, art, m) {
        // Im Elementinhalt waere der Wert sicher: nur der Kontext verlangt mehr.
        if (m !== 'text' && geprueftIm(n, 'text')) return melde(n, `${art}/${m}`);
        const p = direkterParameter(n);
        if (p) vormerken(p.fn, p.index, { n, art, modus: m });
        else melde(n, art);
    }
    const pruefeStelle = (n, art, textDavor) => {
        const m = modusVon(markupKontext(textDavor));
        if (!geprueftIm(n, m)) ungeprueft(n, art, m);
    };
    /** Eigenschafts-/Methodenname, auch in der Form `el['innerHTML']`. */
    function gliedName(m) {
        if (!m.computed) return m.property.name;
        const p = m.property;
        if (p.type === 'Literal' && typeof p.value === 'string') return p.value;
        if (p.type === 'TemplateLiteral' && p.expressions.length === 0)
            return p.quasis[0].value.raw;
        return null;
    }
    for (const { ast } of asts) {
        lauf(ast, node => {
            if (node.type === 'TemplateLiteral' && istHtmlStelle(node)) {
                let davor = '';
                node.expressions.forEach((e, i) => {
                    davor += node.quasis[i].value.raw;
                    pruefeStelle(e, 'template', davor);
                    davor += 'X';
                });
            } else if (istKettenWurzel(node) && istHtmlStelle(node)) {
                let davor = '';
                for (const t of kette(node)) {
                    if (t.type === 'Literal') {
                        davor += String(t.value);
                        continue;
                    }
                    pruefeStelle(t, 'kette', davor);
                    davor +=
                        t.type === 'TemplateLiteral'
                            ? t.quasis.map(q => q.value.raw).join('X')
                            : 'X';
                }
            } else if (
                node.type === 'AssignmentExpression' &&
                node.left.type === 'MemberExpression' &&
                HTML_SENKEN_EIGENSCHAFTEN.has(gliedName(node.left)) &&
                WERT_ZUWEISUNGEN.has(node.operator)
            ) {
                if (!geprueftIm(node.right, 'text')) ungeprueft(node.right, 'senke', 'text');
            } else if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
                const m = gliedName(node.callee);
                const objekt = node.callee.object;
                if (m === 'setAttribute' && node.arguments[0]?.type === 'Literal') {
                    const name = String(node.arguments[0].value).toLowerCase();
                    const wert = node.arguments[1];
                    const m2 = name.startsWith('on') ? 'streng' : name === 'srcdoc' ? 'text' : null;
                    if (m2 && wert && !geprueftIm(wert, m2)) ungeprueft(wert, 'senke', m2);
                    return;
                }
                if (!HTML_SENKEN_METHODEN.has(m)) return;
                if (
                    (m === 'write' || m === 'writeln') &&
                    !(objekt.type === 'Identifier' && objekt.name === 'document')
                ) {
                    return;
                }
                const werte = m === 'insertAdjacentHTML' ? node.arguments.slice(1) : node.arguments;
                for (const w of werte) if (!geprueftIm(w, 'text')) ungeprueft(w, 'senke', 'text');
            }
        });
    }

    // Senken-Parameter aufloesen: statt in der Funktion zaehlt jeder Aufruf, der
    // an dieser Stelle einen ungeprueften Wert uebergibt. Reicht der Aufrufer
    // selbst nur SEINEN Parameter durch, wandert die Frage eine Ebene weiter.
    // Auch die Reihenfolge ist fest: `offen` waechst nur in Quelltextreihenfolge.
    const aufrufCache = new Map();
    while (offen.length) {
        const [fn, index] = offen.shift();
        const e = senkenParameter.get(fn).get(index);
        if (!aufrufCache.has(fn)) aufrufCache.set(fn, aufrufeVon(fn));
        const aufrufe = aufrufCache.get(fn);
        if (!aufrufe) {
            e.stand = 'innen';
            e.stellen.forEach(s => melde(s.n, s.art));
            continue;
        }
        e.stand = 'aufrufer';
        const name = funktionsName(fn);
        for (const aufruf of aufrufe) {
            const args = aufruf.arguments;
            if (args.slice(0, index + 1).some(a => a.type === 'SpreadElement')) {
                melde(aufruf, `aufruf ${name}()`);
                continue;
            }
            const arg = args[index];
            if (!arg || geprueftIm(arg, e.modus)) continue;
            ungeprueft(arg, `aufruf ${name}()`, e.modus);
        }
    }
    return ergebnis;
}

// ============================================================
// BASIS — Stand main 020e258, je Datei die heutige Zahl. Darf nur sinken.
// Gesenkt mit SENKEN Bereich A (Party, NPCs, Orte, Quests, Encounter, Initiative
// samt Loot/Kampf-Widgets/Mob, Bestiarium, Wuerfel, render/helpers, Zustaende, Tags):
// 664 -> 358 Stellen; 18 Dateien auf 0 (gestrichen), entity-actions 7 -> 1.
// Gesenkt mit SENKEN Bereich B (Truhe/Zuweisung, Zauber, Shops samt Handout und Links,
// Wiki, Notizen/Story-Arcs, Session-Prep, Fraktionen, Reise, Zufallstabellen,
// Soundboard): 358 -> 182 Stellen; 15 Dateien auf 0 (gestrichen). Je eine Stelle
// bleibt, die der Zaehler nicht als geprueft erkennen kann:
//   - features/wiki/wiki (Eintragsinhalt): renderMarkdownInContent() endet mit
//     sanitizeHTML(), addTOCAnchors() setzt nur die Kennung ein, parseWikiLinks()
//     kodiert seinen Fang mit esc() — der Zaehler sieht durch diese Kette nicht.
//   - features/session-prep/session-prep-render (renderSessionPrepDetail, ohne
//     Aufrufer): parseEntityLinks() (systems/entity-links.js) gilt dem Zaehler nicht
//     als geprueft — zu Recht, der Name einer Marke geht dort roh in title="…".
// Schluessel: loader.js-Pfad OHNE ".js" (Begruendung im Kopfkommentar).
// ============================================================
const BASIS = {
    'features/dice-stats/dice-stats-render': 4,
    'features/dmscreen/dmscreen-config': 8,
    'features/dmscreen/dmscreen-render': 6,
    'features/dmscreen/dmscreen-widgets-base': 7,
    'features/encounter-calculator': 22,
    'features/npc-generator/npc-generator': 7,
    'features/quick-actions': 6,
    'features/rest-manager': 9,
    'features/session-prep/session-prep-render': 1,
    'features/timers/timers': 8,
    'features/wiki/wiki': 1,
    'systems/backups': 2,
    'systems/campaign-manager/campaign-manager': 2,
    'systems/entity-links': 16,
    'systems/markdown-import-export': 2,
    'systems/migration/migration-wizard': 1,
    'systems/search/global-search': 4,
    'systems/spellslots/import-export': 2,
    'systems/spellslots/navigation': 2,
    'systems/spellslots/quick-reference': 6,
    'systems/spellslots/spellslots-ui': 1,
    'systems/spellslots/virtual-list': 1,
    'systems/undo': 12,
    'tools/debug': 8,
    'ui/actions/combat-actions': 1,
    'ui/actions/entity-actions': 1,
    'ui/editors/editor-toolbar-build': 14,
    'ui/editors/markdown-converter': 2,
    'ui/virtual-scroll': 2,
    'utils/performance-extras': 20,
    'utils/performance': 3,
    'utils/utilities': 1
};

/** loader.js-Pfad -> Schluessel der BASIS-Tabelle. */
function schluessel(rel) {
    return rel.replace(/\.js$/, '');
}

function formatiereFunde(rel, funde) {
    return funde.map(f => `    ${rel}:${f.zeile} [${f.art}] ${f.text}`).join('\n');
}

// ============================================================
// MESSUNG (einmal je Lauf)
// ============================================================
const loaderSource = fs.readFileSync(LOADER_PATH, 'utf8');
const module_ = extractModulesFromLoader(loaderSource);
let messungCache = null;
function messung() {
    if (messungCache) return messungCache;
    const fehlend = module_.filter(rel => !fs.existsSync(path.join(REPO_ROOT, rel)));
    if (fehlend.length) {
        throw new Error(
            `R6: Dateien aus loader.js MODULES fehlen auf der Platte:\n${fehlend.join('\n')}`
        );
    }
    messungCache = zaehleHtmlSenken(echteModule(), vorlagenTexte());
    return messungCache;
}
function echteModule() {
    return module_.map(rel => ({ rel, src: fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8') }));
}
/** Markup der Templates: Funktionsnamen darin sind dynamische Aufrufziele (Regel AUFRUF). */
function vorlagenTexte() {
    const ordner = path.join(REPO_ROOT, 'assets', 'templates');
    return fs
        .readdirSync(ordner)
        .filter(f => f.endsWith('.html'))
        .sort()
        .map(f => fs.readFileSync(path.join(ordner, f), 'utf8'));
}

/** Zaehlt einen einzelnen Quelltext (Probe) und liefert die Funde. */
function probe(src) {
    return zaehleHtmlSenken([{ rel: 'probe.js', src }]).get('probe.js');
}

// ============================================================
// TEIL 1 — der Zaehler selbst: jede Ausnahme gilt, jeder rote Fall zaehlt
// ============================================================
describe('R6 Zaehlerprobe: rote Faelle zaehlen, begruendete Ausnahmen nicht', () => {
    const ROT = [
        ['Text-Kontext ohne esc', 'function f(c) { return `<b>${c.name}</b>`; }', 1],
        [
            'Attribut-Kontext ohne esc',
            'function f(c) { return `<div class="${c.type}"></div>`; }',
            1
        ],
        [
            'Fallback aus einer Label-Tabelle',
            'const L = { a: "A" }; function f(x) { return `<i>${L[x] || x}</i>`; }',
            1
        ],
        [
            'Grossschreibung schuetzt nicht',
            'function f(s) { return `<b>${s.toUpperCase()}</b>`; }',
            1
        ],
        ['+-Kette', 'function f(c) { return "<div>" + c.name + "</div>"; }', 1],
        ['rohe Senke ohne Template', 'function f(el, e) { el.innerHTML = e.content || ""; }', 1],
        [
            'innerHTML auf losgeloestem Element (Aufrufer reicht Rohwert)',
            'function f(html) { const d = document.createElement("div"); d.innerHTML = html; }' +
                ' function g(n) { f(n.description); }',
            1
        ],
        [
            'insertAdjacentHTML',
            'function f(el, n) { el.insertAdjacentHTML("beforeend", n.html); }',
            1
        ],
        [
            'Durchreichende Hilfe',
            'function label(c) { return c.name; } function f(c) { return `<b>${label(c)}</b>`; }',
            1
        ],
        [
            'Akkumulator mit Rohwert',
            'function f(el, n) { let html = ""; html += n; el.innerHTML = html; }',
            1
        ],
        [
            'daten.length (Objekt mit length-Text)',
            'function f(r) { return `<i>${r.length}</i>`; }',
            1
        ],
        [
            'sanitizeHTML im Attributwert',
            'function f(x) { return `<p title="${sanitizeHTML(x)}">a</p>`; }',
            1
        ],
        ['ID aus Daten', 'function f(n) { return `<div data-id="${n.id}"></div>`; }', 1],
        ['Destrukturierter Wert', 'function f({ name }) { return `<b>${name}</b>`; }', 1],
        [
            'for-of ueber Daten',
            'function f(el, xs) { let h = ""; for (const x of xs) { h += x; } el.innerHTML = h; }',
            1
        ],
        [
            'Element einer Datenliste',
            'function f(xs) { return xs.map(x => `<li>${x}</li>`).join(""); }',
            1
        ],
        ['Datenbaum D', 'function f() { return `<b>${D.characters[0].name}</b>`; }', 1],
        // --- Regel AUFRUF: ein Parameter, der unveraendert in HTML landet ---
        [
            'Senken-Parameter ueber zwei Ebenen',
            'function senke(h) { document.body.innerHTML = h; } function mitte(x) { senke(x); }' +
                ' function oben(n) { mitte(n.html); }',
            1
        ],
        [
            'Senken-Parameter mit Namen im Text (dynamischer Aufruf)',
            'function senke(h) { document.body.innerHTML = h; } const ZIELE = ["senke"];',
            1
        ],
        [
            'Senken-Parameter als Rueckruf weitergegeben',
            'function senke(h) { document.body.innerHTML = h; } [1].forEach(senke);',
            1
        ],
        // --- Regel KONTEXT: wo esc() nicht reicht ---
        [
            'esc() ohne Anfuehrungszeichen',
            'function f(c) { return `<i class=${esc(c.k)}></i>`; }',
            1
        ],
        ['esc() an Attributnamen-Position', 'function f(c) { return `<i ${esc(c.k)}></i>`; }', 1],
        [
            'esc() im on*-Attribut',
            'function f(c) { return `<i onclick="go(${esc(c.k)})"></i>`; }',
            1
        ],
        [
            'esc() in <script>',
            'function f(c) { return `<script>var x = "${esc(c.k)}";</script>`; }',
            1
        ],
        [
            'sanitizeHTML ueber eine Hilfe im Attribut',
            'function s(x) { return sanitizeHTML(x); }' +
                ' function f(c) { return `<p title="${s(c.t)}">a</p>`; }',
            1
        ],
        [
            'setAttribute("on...") mit esc()',
            'function f(el, n) { el.setAttribute("onclick", esc(n.k)); }',
            1
        ],
        [
            'sichererLink() allein im Attribut (laesst " stehen)',
            'function sichererLink(url) { return /^https?:/i.test(url) ? url : ""; }' +
                ' function f(c) { return `<a href="${sichererLink(c.url)}">x</a>`; }',
            1
        ],
        [
            'Formpruefer mit Ersatz aus Daten',
            'function f(c) { return `<i style="color:${sichereFarbe(c.farbe, c.alt)}"></i>`; }',
            1
        ],
        // --- Senken-Formen ---
        [
            'innerHTML ueber berechneten Schluessel',
            'function f(el, n) { el["innerHTML"] = n.html; }',
            1
        ],
        ['innerHTML ||=', 'function f(el, n) { el.innerHTML ||= n.html; }', 1],
        ['iframe.srcdoc', 'function f(fr, n) { fr.srcdoc = n.html; }', 1],
        [
            'for-of mit aeusserer Variable',
            'function f(el, n) { let v = ""; for (v of n.liste) {} el.innerHTML = v; }',
            1
        ]
    ];
    const GRUEN = [
        ['esc()', 'function f(c) { return `<b>${esc(c.name)}</b><i title="${esc(c.t)}"></i>`; }'],
        ['window.esc()', 'function f(c) { return `<b>${window.esc(c.name)}</b>`; }'],
        [
            'sanitizeHTML() im Elementinhalt',
            'function f(c) { return `<div>${sanitizeHTML(c.html)}</div>`; }'
        ],
        [
            'Zahl aus Number/parseInt/toFixed/Math/Arithmetik',
            'function f(c) { return `<i>${Number(c.a)}${parseInt(c.b)}${c.d.toFixed(1)}${Math.max(c.e, 1)}${c.f - 1}${c.g * 2}</i>`; }'
        ],
        [
            'String-Literale und Ternary aus Literalen',
            'function f(c) { return `<i class="${c.on ? "an" : "aus"}">${"x"}</i>`; }'
        ],
        ['&& liefert links nur falsy', 'function f(c) { return `<i>${c.on && "<b>an</b>"}</i>`; }'],
        [
            'Konstanten-Tabelle ohne Datenanteil',
            'const T = { a: { icon: "x" } }; function f(k) { const t = T[k] || T.a; return `<i>${t.icon}</i>`; }'
        ],
        [
            'Render-Hilfe mit geprueftem Rueckgabewert',
            'function badge(t) { return `<span>${esc(t)}</span>`; } function f(c) { return `<div>${badge(c.name)}</div>`; }'
        ],
        [
            'Render-Hilfe ueber window-Alias',
            'function badge(t) { return `<span>${esc(t)}</span>`; } var b2 = window.badge; function f(c) { return `<div>${b2(c.n)}</div>`; }'
        ],
        [
            'map/join mit geprueftem Rueckruf',
            'function f(xs) { return `<ul>${xs.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`; }'
        ],
        [
            'Index-Parameter',
            'function f(xs) { return xs.map((x, i) => `<li data-i="${i}">${esc(x)}</li>`).join(""); }'
        ],
        [
            'Element einer Literal-Liste',
            'function f() { return ["str", "dex"].map(a => `<i>${a.toUpperCase()}</i>`).join(""); }'
        ],
        [
            'Akkumulator aus Templates',
            'function f(el, xs) { let html = ""; xs.forEach(x => { html += `<li>${esc(x)}</li>`; }); el.innerHTML = html; }'
        ],
        [
            'push/join',
            'function f(el, xs) { const p = []; p.push(`<b>${esc(xs[0])}</b>`); el.innerHTML = p.join(", "); }'
        ],
        [
            '.length hinter Array-Erzeuger',
            'function f(xs) { return `<i>${xs.filter(Boolean).length}${Object.keys(xs).length}</i>`; }'
        ],
        [
            'Selektor statt Markup',
            'function f(id) { return document.querySelector(`[data-id="${id}"]`); }'
        ],
        ['Senke mit leerem Literal', 'function f(el) { el.innerHTML = ""; }'],
        [
            'Senken-Parameter, jeder Aufrufer geprueft',
            'function senke(h) { document.body.innerHTML = h; }' +
                ' function g(n) { senke(esc(n.t)); senke(`<b>${esc(n.u)}</b>`); }'
        ],
        [
            'Literal-Ternary an Attributnamen-Position',
            'function f(c) { return `<option ${c.on ? "selected" : ""}>x</option>`; }'
        ],
        [
            'Zahl ohne Anfuehrungszeichen',
            'function f(c) { return `<td colspan=${c.n * 2}></td>`; }'
        ],
        [
            'eigener HTML-Baustein an Attributnamen-Position',
            'function f(c) { return `<a ${c.v ? `data-x="${esc(c.v)}"` : ""}>x</a>`; }'
        ],
        [
            'Formpruefer mit Ersatz und Liste aus dem Code',
            'function f(c) { return `<i style="color:${sichereFarbe(c.farbe, "var(--gold)")}"' +
                ' class="${sichereKlasse(c.s, ["a", "b"], "a")}"></i>`; }'
        ]
    ];

    test.each(ROT)('rot: %s zaehlt genau einmal', (_name, src, erwartet) => {
        const funde = probe(src);
        expect(funde.map(f => `${f.art}: ${f.text}`)).toHaveLength(erwartet);
    });

    test.each(GRUEN)('gruen: %s zaehlt nicht', (_name, src) => {
        expect(probe(src).map(f => `${f.art}: ${f.text}`)).toEqual([]);
    });

    test('dieselbe Stelle zaehlt nicht doppelt (inneres Template, aeussere Kette, Senke)', () => {
        const src =
            'function f(el, xs) {' +
            ' const rows = xs.map(x => `<tr><td>${x.name}</td></tr>`).join("");' +
            ' el.innerHTML = "<table>" + rows + "</table>"; }';
        expect(probe(src).map(f => f.text)).toEqual(['x.name']);
    });

    test('ein Parsefehler wird mit Dateinamen gemeldet, nicht still als 0 gezaehlt', () => {
        expect(() => zaehleHtmlSenken([{ rel: 'kaputt.js', src: 'function ( {' }])).toThrow(
            /kaputt\.js/
        );
    });

    /**
     * Mutationsprobe am ECHTEN Quellbaum: jede Zeile ist eine neue ungeschuetzte
     * Stelle einer anderen Art und muss in genau der Zeile genau +1 zaehlen —
     * im Zusammenspiel mit allen Modulen und Templates, nicht nur als Probe.
     */
    /** Zwei volle Zaehlungen (~1 s je Lauf lokal): Luft fuer langsame CI-Laeufer. */
    const ZAEHL_ZEIT = 30000;
    const MUTATIONEN = [
        ['Text', 'function __r6a(n) { return `<b>${n.name}</b>`; }'],
        ['ID im Attribut', 'function __r6b(n) { return `<i data-id="${n.id}"></i>`; }'],
        ['+-Kette', 'function __r6c(n) { return "<b>" + n.name + "</b>"; }'],
        [
            'Label-Fallback',
            'const __R6_L = { a: "A" }; function __r6d(n) { return `<i>${__R6_L[n.k] || n.k}</i>`; }'
        ],
        ['toUpperCase', 'function __r6e(n) { return `<b>${n.s.toUpperCase()}</b>`; }'],
        ['innerHTML roh', 'function __r6f(el, n) { el.innerHTML = n.html; }'],
        ['innerHTML berechnet', 'function __r6g(el, n) { el["innerHTML"] = n.html; }'],
        ['innerHTML ||=', 'function __r6h(el, n) { el.innerHTML ||= n.html; }'],
        ['srcdoc', 'function __r6i(fr, n) { fr.srcdoc = n.html; }'],
        [
            'insertAdjacentHTML',
            'function __r6j(el, n) { el.insertAdjacentHTML("beforeend", n.html); }'
        ],
        [
            'esc ohne Anfuehrungszeichen',
            'function __r6k(n) { return `<i class=${esc(n.k)}></i>`; }'
        ],
        ['esc als Attributname', 'function __r6l(n) { return `<i ${esc(n.k)}></i>`; }'],
        [
            'esc im on*-Attribut',
            'function __r6m(n) { return `<i onclick="go(${esc(n.k)})"></i>`; }'
        ],
        [
            'sanitizeHTML im Attribut',
            'function __r6n(n) { return `<p title="${sanitizeHTML(n.t)}">x</p>`; }'
        ],
        [
            'Rohwert an einen Senken-Parameter',
            'function __r6senke(h) { document.body.innerHTML = h; } function __r6o(n) { __r6senke(n.html); }'
        ],
        [
            'for-of mit aeusserer Variable',
            'function __r6p(el, n) { let v = ""; for (v of n.l) {} el.innerHTML = v; }'
        ],
        [
            'setAttribute("onclick")',
            'function __r6q(el, n) { el.setAttribute("onclick", esc(n.k)); }'
        ],
        ['JSON.stringify', 'function __r6r(n) { return `<i>${JSON.stringify(n)}</i>`; }']
    ];

    test(
        'die Ratsche kann rot werden: jede Mutationsart in einem echten Modul zaehlt genau +1',
        () => {
            const vorher = messung();
            const ziel = module_.find(rel => vorher.get(rel).length > 0);
            expect(ziel).toBeDefined();
            const original = fs.readFileSync(path.join(REPO_ROOT, ziel), 'utf8');
            const ersteZeile = original.split('\n').length + 1;
            const dateien = echteModule().map(d =>
                d.rel === ziel
                    ? {
                          rel: d.rel,
                          src: original + '\n' + MUTATIONEN.map(m => m[1]).join('\n') + '\n'
                      }
                    : d
            );
            const nachher = zaehleHtmlSenken(dateien, vorlagenTexte());
            const jeZeile = MUTATIONEN.map(
                (m, i) => nachher.get(ziel).filter(f => f.zeile === ersteZeile + i).length
            );
            const falsch = MUTATIONEN.map((m, i) => `${m[0]}: ${jeZeile[i]} statt 1`).filter(
                (_, i) => jeZeile[i] !== 1
            );
            expect(falsch).toEqual([]);
            // Nichts anderes hat sich bewegt — weder im Ziel noch in einer anderen Datei.
            for (const [rel, funde] of nachher) {
                const soll = vorher.get(rel).length + (rel === ziel ? MUTATIONEN.length : 0);
                expect({ rel, ist: funde.length }).toEqual({ rel, ist: soll });
            }
        },
        ZAEHL_ZEIT
    );

    test(
        'die Zahl haengt nicht an der Reihenfolge der Module',
        () => {
            const vorher = messung();
            const umgekehrt = zaehleHtmlSenken([...echteModule()].reverse(), vorlagenTexte());
            const abweichend = [...vorher]
                .filter(([rel, funde]) => umgekehrt.get(rel).length !== funde.length)
                .map(([rel, funde]) => `${rel}: ${funde.length} / ${umgekehrt.get(rel).length}`);
            expect(abweichend).toEqual([]);
        },
        ZAEHL_ZEIT
    );
});

// ============================================================
// TEIL 2 — die Ratsche ueber loader.js MODULES
// ============================================================
describe('R6 Ratsche: ungeschuetzte HTML-Stellen je Datei duerfen nur sinken', () => {
    test('loader.js MODULES liefert Module, und jedes laesst sich parsen und zaehlen', () => {
        expect(module_.length).toBeGreaterThan(100);
        const m = messung();
        expect(m.size).toBe(module_.length);
        const summe = [...m.values()].reduce((s, f) => s + f.length, 0);
        // Ein leer-gruener Waechter waere schlimmer als keiner.
        expect(summe).toBeGreaterThan(0);
    });

    test('keine Datei liegt UEBER ihrer Basis, keine ungelistete Datei hat Stellen', () => {
        const zuviel = [];
        for (const [rel, funde] of messung()) {
            const basis = BASIS[schluessel(rel)] || 0;
            if (funde.length > basis) {
                zuviel.push(
                    `  '${schluessel(rel)}': Basis ${basis}, Ist ${funde.length}\n` +
                        formatiereFunde(rel, funde)
                );
            }
        }
        if (zuviel.length) {
            throw new Error(
                `R6: ungeschuetzte HTML-Stellen kamen dazu (${zuviel.length} Datei(en)).\n` +
                    'Jeder Wert aus D gehoert in esc() (Text UND Attribut), Rich-Text in ' +
                    'sanitizeHTML() — Vertrag SENKEN, docs/bugfixes.md. Die BASIS anzuheben ' +
                    'ist kein Ausweg.\n' +
                    zuviel.join('\n')
            );
        }
        expect(zuviel).toEqual([]);
    });

    test('keine Datei liegt UNTER ihrer Basis (sonst Basis senken)', () => {
        const senken = [];
        for (const [rel, funde] of messung()) {
            const k = schluessel(rel);
            if (k in BASIS && funde.length < BASIS[k]) {
                senken.push(
                    funde.length === 0
                        ? `  '${k}': ${BASIS[k]} -> 0 (Eintrag streichen)`
                        : `  '${k}': ${BASIS[k]} -> ${funde.length}`
                );
            }
        }
        if (senken.length) {
            throw new Error(
                `R6: Basis senken — ${senken.length} Datei(en) haben weniger ungeschuetzte ` +
                    'Stellen als ihre Basis. Die Ratsche haelt nur, wenn die Basis mitsinkt:\n' +
                    senken.join('\n')
            );
        }
        expect(senken).toEqual([]);
    });

    test('jeder Basis-Eintrag gehoert zu einem Modul aus loader.js und ist groesser als 0', () => {
        const bekannt = new Set(module_.map(schluessel));
        const falsch = Object.entries(BASIS)
            .filter(([k, n]) => !bekannt.has(k) || !(Number.isInteger(n) && n > 0))
            .map(([k, n]) => `  '${k}': ${n}${bekannt.has(k) ? '' : ' (kein Modul in loader.js)'}`);
        if (falsch.length) {
            throw new Error(`R6: verwaiste oder ungueltige Basis-Eintraege:\n${falsch.join('\n')}`);
        }
        expect(falsch).toEqual([]);
    });
});
