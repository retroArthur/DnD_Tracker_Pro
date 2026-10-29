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

module.exports = { datengrenzeBlock, ladeDatengrenze, ANFANG, ENDE };
