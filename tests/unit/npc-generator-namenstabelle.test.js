/**
 * Unit — Namenstabellen des NPC-Generators (Vertrag NPC-NAME, N3)
 *
 * DER BEFUND (Stand 8702f84a, gemessen als herkunft B5/B6). generiereNPCName()
 * nimmt die Eintraege einer Nutzertabelle `npc-namen-<volk>-<geschlecht>` mit
 * `e.text || e` in den Namenspool. Daraus folgte dreierlei:
 *   - ein Eintrag `{text: 7}` wurde die Zahl 7 als Name — `name: 7` in D, die
 *     Sortierung der NPC-Liste warf, nach dem Neuladen war sie leer (B5);
 *   - ein Eintrag ohne lesbaren Text (`{weight: 1}`, `{text: ''}`, `{text: 0}`)
 *     wurde als GANZES Objekt Name — Vorschau "[object Object]", in D ein
 *     Objekt (B6);
 *   - ein `null`-Eintrag warf im map(), und der catch verwarf darauf still die
 *     ganze Tabelle, auch ihre gueltigen Namen (Codelesung, hier gemessen).
 *
 * DIE REGEL (N3). Uebernommen wird nur Text — der `text` eines Eintrags oder
 * ein Eintrag, der selbst Text ist; eine Zahl wird verlustfrei Text (E2:
 * 7 -> '7'). Alles andere wird uebersprungen: Objekt ohne Text, leerer oder nur
 * aus Leerzeichen bestehender Text, `null`, ein Wahrheitswert. Bleibt nichts
 * uebrig, greift der bestehende Rueckfall des Generators ('Unbekannt').
 *
 * WIE GEMESSEN WIRD. Geladen wird das ECHTE Modul per vm.runInContext (Idiom
 * wie tests/unit/combat-log.test.js) — nicht eine Inline-Kopie wie in
 * tests/unit/npc-generator.test.js, die den Fehler nie haette sehen koennen.
 * Math.random ist ein Doppel: 1000 gleichmaessig verteilte Werte ziehen jeden
 * Platz eines Pools mit hoechstens 1000 Namen mindestens einmal, die Menge der
 * Ergebnisse IST also der Pool. Die eingebauten Namentabellen sind durch einen
 * Stub ersetzt, damit der Pool bekannt ist.
 *
 * Das Gegenstueck am gebauten Buendel mit echten Klicks bis "Als NPC
 * speichern", Liste und Neuladen: tests/e2e/features/npc-altdaten.spec.js W13.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = path.resolve(__dirname, '..', '..');
const MODUL_REL = 'features/npc-generator/npc-generator.js';
const MODUL = path.join(REPO, ...MODUL_REL.split('/'));

/** Eingebaute Namen im Stub — der Pool ohne Nutzertabelle. */
const EINGEBAUT = ['Aldric', 'Berthold'];

/** Ziehungen je Messung, siehe Kopf. */
const SCHRITTE = 1000;

/**
 * Laedt das Modul in einen frischen Kontext.
 * @param {object} optionen
 * @param {Array} [optionen.eintraege] - Eintraege der Tabelle npc-namen-mensch-maennlich
 * @param {string[]} [optionen.eingebaut] - eingebauter Pool fuer mensch/maennlich
 */
function ladeGenerator({ eintraege, eingebaut = EINGEBAUT } = {}) {
    const zufall = { wert: 0 };
    const mathDoppel = Object.create(Math);
    mathDoppel.random = () => zufall.wert;
    const context = {
        Math: mathDoppel,
        NPC_DEFAULT_TABLES: {
            namen: { mensch: { maennlich: eingebaut.slice() } },
            persoenlichkeitszuege: ['Mutig'],
            marotten: ['Summt'],
            berufe: ['Schmied'],
            aussehen: ['Narbe']
        },
        D: {
            npcs: [],
            randomTables: eintraege
                ? [{ id: 1, name: 'npc-namen-mensch-maennlich', icon: '🎲', entries: eintraege }]
                : []
        }
    };
    context.window = context;
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(MODUL, 'utf8'), context);
    return { ctx: context, zufall };
}

/**
 * Zieht SCHRITTE-mal einen Namen fuer mensch/maennlich.
 * @param {{ctx: object, zufall: {wert: number}}} modul
 * @returns {Array} jedes Ergebnis, unveraendert (auch ein Nicht-Text)
 */
function ziehungen(modul) {
    const ergebnisse = [];
    for (let i = 0; i < SCHRITTE; i++) {
        modul.zufall.wert = i / SCHRITTE;
        ergebnisse.push(modul.ctx.generiereNPCName('mensch', 'maennlich'));
    }
    return ergebnisse;
}

/**
 * Der Pool als sortierte Menge. Erst die Typen: ein Nicht-Text im Pool ist
 * der Befund selbst und soll als solcher im Fehlertext stehen.
 * @param {Array} ergebnisse
 */
function poolAus(ergebnisse) {
    const fremd = ergebnisse.filter(n => typeof n !== 'string');
    expect(fremd.slice(0, 3)).toEqual([]);
    return [...new Set(ergebnisse)].sort();
}

describe('NPC-Generator: Namenstabelle (NPC-NAME N3)', () => {
    test('ohne Nutzertabelle: der Pool sind genau die eingebauten Namen (Kontrolle der Messung)', () => {
        expect(poolAus(ziehungen(ladeGenerator()))).toEqual([...EINGEBAUT].sort());
    });

    test('Zahl als Text eines Eintrags wird verlustfrei Text: {text: 7} -> "7" (B5)', () => {
        const modul = ladeGenerator({ eintraege: [{ weight: 1, text: 7 }] });
        expect(poolAus(ziehungen(modul))).toEqual(['7', ...EINGEBAUT].sort());
    });

    test('auch 0 und eine Kommazahl: `||` hielt 0 fuer "kein Text" und nahm das ganze Objekt', () => {
        const modul = ladeGenerator({
            eintraege: [
                { weight: 1, text: 0 },
                { weight: 1, text: -3.5 }
            ]
        });
        expect(poolAus(ziehungen(modul))).toEqual(['-3.5', '0', ...EINGEBAUT].sort());
    });

    test('Eintraege ohne lesbaren Text werden uebersprungen — nichts davon wird Name (B6)', () => {
        const modul = ladeGenerator({
            eintraege: [
                { weight: 1 },
                { weight: 1, text: '' },
                { weight: 1, text: '   ' },
                { weight: 1, text: null },
                { weight: 1, text: { x: 1 } },
                { weight: 1, text: ['Liste'] },
                { weight: 1, text: true },
                true,
                [],
                {}
            ]
        });
        expect(poolAus(ziehungen(modul))).toEqual([...EINGEBAUT].sort());
    });

    test('Text bleibt, wie er ist — als `text` eines Eintrags und als Eintrag selbst', () => {
        const modul = ladeGenerator({ eintraege: [{ weight: 1, text: 'Bodo' }, 'Rolf'] });
        expect(poolAus(ziehungen(modul))).toEqual(['Bodo', 'Rolf', ...EINGEBAUT].sort());
    });

    test('ein null-Eintrag verwirft die gueltigen Namen derselben Tabelle nicht mehr', () => {
        const modul = ladeGenerator({ eintraege: [null, { weight: 1, text: 'Bodo' }, undefined] });
        expect(poolAus(ziehungen(modul))).toEqual(['Bodo', ...EINGEBAUT].sort());
    });

    test('bleibt nichts uebrig, greift der bestehende Rueckfall "Unbekannt"', () => {
        const modul = ladeGenerator({
            eingebaut: [],
            eintraege: [{ weight: 1 }, { weight: 1, text: '' }, { weight: 1, text: { x: 1 } }, true]
        });
        expect(poolAus(ziehungen(modul))).toEqual(['Unbekannt']);
    });

    test('generiereNPC() traegt den Tabelleneintrag als Text in die Vorschau', () => {
        const modul = ladeGenerator({ eingebaut: [], eintraege: [{ weight: 1, text: 7 }] });
        const npc = modul.ctx.generiereNPC('mensch', 'maennlich');
        expect({ typ: typeof npc.name, name: npc.name }).toEqual({ typ: 'string', name: '7' });
    });
});
