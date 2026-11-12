/**
 * Die Datengrenze aus utils/basic.js fuer Werkbaenke, die utils/basic.js nicht ganz laden
 * (Vertrag SENKEN R4, docs/bugfixes.md).
 *
 * WARUM. Kampagnen-Import, Backup (lokal und aus dem Ordner), Migrations-Import und load()
 * rufen seit SENKEN `bereinigeDatengrenze()` auf. Mehrere Werkbaenke laden die Module, die
 * diese Eingaenge enthalten, ohne utils/basic.js — sie schneiden sich daraus nur
 * StorageAPI/utf8ByteLength heraus oder setzen eigene Attrappen ein, die eine zweite
 * `const StorageAPI`-Deklaration ueberschatten wuerde. Ohne die Grenze warf load() dort
 * still (`reason: 'exception'`) und importFullExport() mit ReferenceError. Eine Attrappe
 * der Grenze waere falsch: dann pruefte die Werkbank einen anderen Eingang als die App.
 * Deshalb wird der ECHTE Block geladen — derselbe Text zwischen den Markierungen, den
 * tests/unit/sanitizer-parity.test.js mit der Paritaetskopie in utils/testable-utils.js
 * vergleicht.
 *
 * Nicht in einen Kontext laden, der utils/basic.js schon ganz geladen hat: die
 * `const DATENGRENZE_*` des Blocks waeren dann doppelt deklariert.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WURZEL = path.resolve(__dirname, '..', '..', '..');
const ANFANG = '// [DATENGRENZE:ANFANG]';
const ENDE = '// [DATENGRENZE:ENDE]';

/**
 * Text des Datengrenzen-Blocks einer Datei (mit beiden Markierungen, Zeilenenden als LF).
 * @param {string} rel - Pfad ab der Projektwurzel
 * @returns {string}
 */
function datengrenzeBlock(rel) {
    const text = fs.readFileSync(path.join(WURZEL, rel), 'utf8').replace(/\r\n/g, '\n');
    const start = text.indexOf(ANFANG);
    const ende = text.indexOf(ENDE, start);
    if (start < 0 || ende < 0 || text.indexOf(ANFANG, start + 1) >= 0) {
        throw new Error(`Datengrenzen-Block in ${rel} nicht genau einmal gefunden`);
    }
    return text.slice(start, ende + ENDE.length);
}

/**
 * Fuehrt den Block aus utils/basic.js im vm-Kontext aus: danach gibt es dort
 * bereinigeDatengrenze(), sichererLink(), sichereFarbe() und sichereKlasse().
 * @param {object} context - vm-Kontext (bereits per vm.createContext angelegt)
 */
function ladeDatengrenze(context) {
    vm.runInContext(datengrenzeBlock('utils/basic.js'), context, {
        filename: 'utils/basic.js (Datengrenze)'
    });
}

/**
 * Text der ECHTEN datenText() aus utils/basic.js (Vertrag NPC-NAME, N2). Sie steht HINTER dem
 * Datengrenzen-Block und braucht aus ihm datengrenzeText(); ladeDatengrenze() allein laedt sie
 * nicht. Eine Attrappe waere falsch: dann pruefte die Werkbank eine andere Umwandlung als die
 * App (Vertrag SPRACHEN-FREI, Unit-Teil: "das ECHTE datenText(), keine Attrappe").
 * @returns {string}
 */
function datenTextQuelle() {
    const text = fs
        .readFileSync(path.join(WURZEL, 'utils', 'basic.js'), 'utf8')
        .replace(/\r\n/g, '\n');
    const kopf = 'function datenText(wert) {';
    const start = text.indexOf(kopf);
    const ende = text.indexOf('\n}\n', start);
    if (start < 0 || ende < 0 || text.indexOf(kopf, start + 1) >= 0) {
        throw new Error('datenText() in utils/basic.js nicht genau einmal gefunden');
    }
    return text.slice(start, ende + 2);
}

/**
 * Fuehrt datenText() aus utils/basic.js im vm-Kontext aus — NACH ladeDatengrenze() (sie ruft
 * datengrenzeText() aus dem Block).
 * @param {object} context - vm-Kontext (bereits per vm.createContext angelegt)
 */
function ladeDatenText(context) {
    vm.runInContext(datenTextQuelle(), context, { filename: 'utils/basic.js (datenText)' });
}

module.exports = {
    datengrenzeBlock,
    ladeDatengrenze,
    datenTextQuelle,
    ladeDatenText,
    ANFANG,
    ENDE
};
