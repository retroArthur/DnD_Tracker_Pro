/**
 * Unit — applyFilters(): Suchbegriff, Felder, Filter, customFilter und der
 * ODER-Zweig `searchAlso` (Vertrag NPC-SUCHE, R2)
 *
 * DER BEFUND (gemessen am Stand b1fc7da6, PR #22 NPC-NAME, und gleich an
 * main 71dd26b6; dev- und Produktionsbuendel, 1440x900 und 390x844, echte
 * Tasten im Suchfeld). Die Suche der NPC-Ansicht findet einen NPC mit Dialogen
 * nur, wenn der Begriff in einem Feld UND in einem Dialog steht: "Anna",
 * "Zora", "Haendlerin" -> 0 Treffer, "Wirt" ohne Anna, ein reines Dialogwort
 * nie. Wer einem NPC ueber "+" einen Dialog gibt, laesst ihn damit aus der
 * Suche fallen. Die Ortssuche findet keinen Ort mehr ueber den Namen eines NPC,
 * der dort steht. Am Bedienweg gemessen: tests/e2e/features/npc-suche.spec.js.
 *
 * DIE URSACHE liegt in der Benutzung dieses Moduls, nicht in ihm selbst:
 * applyFilters() verknuepft alles mit UND, und `if (!matchesSearch) return
 * false;` wirft jeden Eintrag ohne Feldtreffer hinaus, BEVOR `customFilter`
 * laeuft. customFilter kann den Treffersatz darum nur verkleinern, nie
 * erweitern. renderNPCList() und renderLocations() benutzen ihn aber als
 * Erweiterung ("Also search in dialog texts", "Also match locations that
 * contain NPCs matching search"). Eingefuehrt in 73d3193b (13.01.2026); vorher
 * war die NPC-Suche ein einziges ODER ueber name, role, race, description und
 * den Dialogtext.
 *
 * DIE REGEL, die diese Datei prueft (R2): applyFilters bekommt den optionalen
 * Schluessel `searchAlso(item, search)`. Er ist ODER-verknuepft mit dem
 * Feldvergleich, bekommt den von applyFilters getrimmten und kleingeschriebenen
 * Begriff und wird nur bei nicht leerem Begriff gefragt. Filter und
 * customFilter bleiben UND-verknuepft; customFilter bleibt reine
 * Einschraenkung. Ohne den neuen Schluessel aendert sich nichts — Bestiarium,
 * Quests, Party und Encounter uebergeben ihn nicht.
 *
 * FESTGELEGT HIER (der Vertrag verlangt, es festzulegen und zu pruefen): bei
 * LEEREM `searchFields` entscheidet `searchAlso` allein ueber den Begriff;
 * ohne `searchAlso` wirkt der Begriff bei leerem `searchFields` wie bisher gar
 * nicht. Begruendung: ein Aufrufer, der nur einen eigenen Suchzweig hat, haette
 * sonst einen wirkungslosen Begriff, und das Verhalten ohne den Schluessel
 * bleibt unberuehrt. Heute uebergibt kein Aufrufer ein leeres `searchFields`
 * (Codelesung der sechs Aufrufer).
 *
 * WIE GEMESSEN WIRD. Geladen wird das ECHTE Modul utils/filter-engine.js per
 * vm.runInContext (Idiom wie tests/unit/npc-generator-namenstabelle.test.js),
 * keine Inline-Kopie. Rot am Stand vor dem Fix sind genau die Faelle, die einen
 * Treffer ueber `searchAlso` verlangen oder seinen Aufruf beobachten; die Faelle
 * "wie bisher" und die Faelle gegen einen falschen Fix (Aufruf bei leerem
 * Begriff, kein Treffer gegen Filter oder customFilter) sind dort gruen.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = path.resolve(__dirname, '..', '..');
const MODUL_REL = 'utils/filter-engine.js';
const MODUL = path.join(REPO, ...MODUL_REL.split('/'));

/** Laedt das Modul in einen frischen Kontext und gibt applyFilters zurueck. */
function ladeApplyFilters() {
    const context = {};
    context.window = context;
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(MODUL, 'utf8'), context, { filename: MODUL_REL });
    if (typeof context.applyFilters !== 'function') {
        throw new Error(`${MODUL_REL} definiert applyFilters nicht mehr`);
    }
    return context.applyFilters;
}

/** Eine kleine NPC-Saat: Feldtreffer, Dialogtreffer, Ort. */
const NPCS = [
    { id: 1, name: 'Anna', role: 'Wirtin', ort: 1, dialog: 'willkommen im goldenen krug' },
    { id: 2, name: 'Bert', role: 'Schmied', ort: 2, dialog: '' },
    { id: 3, name: 'Zora', role: 'Haendlerin', ort: 2, dialog: 'seltene ware aus dem sueden' },
    { id: 4, name: 'Olaf', role: 'Wirt', ort: 1, dialog: 'goldene zeiten' }
];

/** Der ODER-Zweig der Saat: der Dialog enthaelt den Begriff. */
const imDialog = (n, s) => n.dialog.includes(s);

/** IDs eines Ergebnisses, sortiert. */
const ids = liste => Array.from(liste, n => n.id).sort((a, b) => a - b);

let applyFilters;
beforeAll(() => {
    applyFilters = ladeApplyFilters();
});

describe(`${MODUL_REL} — ohne searchAlso wie bisher (Feld UND filters UND customFilter)`, () => {
    test('der Begriff wird getrimmt, klein verglichen und nur in searchFields gesucht', () => {
        const cfg = t => ({ searchText: t, searchFields: ['name', 'role'] });
        expect(ids(applyFilters(NPCS, cfg('ANNA')))).toEqual([1]);
        expect(ids(applyFilters(NPCS, cfg('  wirt  ')))).toEqual([1, 4]);
        // nur im Dialog — ohne searchAlso kein Treffer
        expect(ids(applyFilters(NPCS, cfg('goldenen')))).toEqual([]);
    });

    test('leerer Begriff und ein Begriff nur aus Leerzeichen zeigen alle', () => {
        for (const t of ['', '   ']) {
            expect(ids(applyFilters(NPCS, { searchText: t, searchFields: ['name'] }))).toEqual([
                1, 2, 3, 4
            ]);
        }
    });

    test('customFilter schraenkt nur ein: er holt keinen Eintrag ohne Feldtreffer zurueck', () => {
        const ergebnis = applyFilters(NPCS, {
            searchText: 'goldenen',
            searchFields: ['name', 'role'],
            customFilter: () => true
        });
        expect(ids(ergebnis)).toEqual([]);
        const ohneBert = applyFilters(NPCS, {
            searchText: 'e',
            searchFields: ['name'],
            customFilter: n => n.id !== 2
        });
        expect(ids(ohneBert)).toEqual([]); // "e" steht in keinem Namen ausser Bert
        expect(
            ids(
                applyFilters(NPCS, {
                    searchText: 'r',
                    searchFields: ['name'],
                    customFilter: n => n.id !== 2
                })
            )
        ).toEqual([3]);
    });

    test('filters wirken UND-verknuepft zum Begriff', () => {
        const ergebnis = applyFilters(NPCS, {
            searchText: 'wirt',
            searchFields: ['role'],
            filters: { ort: 1 }
        });
        expect(ids(ergebnis)).toEqual([1, 4]);
        expect(
            ids(
                applyFilters(NPCS, {
                    searchText: 'wirt',
                    searchFields: ['role'],
                    filters: { ort: 2 }
                })
            )
        ).toEqual([]);
    });

    test('leeres searchFields ohne searchAlso: der Begriff wirkt nicht (unveraendert)', () => {
        expect(ids(applyFilters(NPCS, { searchText: 'anna', searchFields: [] }))).toEqual([
            1, 2, 3, 4
        ]);
    });

    test('ein searchAlso, das keine Funktion ist, wird uebergangen', () => {
        for (const kaputt of [null, 'goldenen', 42, {}]) {
            const ergebnis = applyFilters(NPCS, {
                searchText: 'goldenen',
                searchFields: ['name'],
                searchAlso: kaputt
            });
            expect(ids(ergebnis)).toEqual([]);
        }
    });
});

describe(`${MODUL_REL} — searchAlso (Vertrag NPC-SUCHE, R2)`, () => {
    test('ODER zum Feldtreffer: ein reiner searchAlso-Treffer erscheint, ein Feldtreffer bleibt', () => {
        // "golden": Feldtreffer nirgends, Dialogtreffer bei Anna und Olaf
        expect(
            ids(
                applyFilters(NPCS, {
                    searchText: 'golden',
                    searchFields: ['name', 'role'],
                    searchAlso: imDialog
                })
            )
        ).toEqual([1, 4]);
        // "wirt": Feldtreffer bei Anna und Olaf, searchAlso nirgends — beide bleiben
        expect(
            ids(
                applyFilters(NPCS, {
                    searchText: 'wirt',
                    searchFields: ['name', 'role'],
                    searchAlso: () => false
                })
            )
        ).toEqual([1, 4]);
        // weder noch: draussen
        expect(
            ids(
                applyFilters(NPCS, {
                    searchText: 'xyz',
                    searchFields: ['name', 'role'],
                    searchAlso: imDialog
                })
            )
        ).toEqual([]);
    });

    test('searchAlso bekommt den getrimmten, kleingeschriebenen Begriff', () => {
        const gesehen = [];
        const ergebnis = applyFilters(NPCS, {
            searchText: '  SeLtEnE wArE  ',
            searchFields: ['name'],
            searchAlso: (n, s) => {
                gesehen.push(s);
                return imDialog(n, s);
            }
        });
        expect(ids(ergebnis)).toEqual([3]);
        expect(gesehen.length).toBeGreaterThan(0);
        expect([...new Set(gesehen)]).toEqual(['seltene ware']);
    });

    test('kein Aufruf bei leerem Begriff oder einem nur aus Leerzeichen — dann alle', () => {
        for (const t of ['', '   ']) {
            const aufrufe = [];
            const ergebnis = applyFilters(NPCS, {
                searchText: t,
                searchFields: ['name'],
                searchAlso: (n, s) => {
                    aufrufe.push(s);
                    return false;
                }
            });
            expect(aufrufe).toEqual([]);
            expect(ids(ergebnis)).toEqual([1, 2, 3, 4]);
        }
    });

    test('filters bleiben UND: ein searchAlso-Treffer am falschen Ort faellt heraus', () => {
        const cfg = ort => ({
            searchText: 'golden',
            searchFields: ['name', 'role'],
            filters: { ort },
            searchAlso: imDialog
        });
        expect(ids(applyFilters(NPCS, cfg(1)))).toEqual([1, 4]);
        expect(ids(applyFilters(NPCS, cfg(2)))).toEqual([]);
        // Zora: nur im Dialog, steht an Ort 2
        expect(
            ids(
                applyFilters(NPCS, {
                    searchText: 'sueden',
                    searchFields: ['name'],
                    filters: { ort: 1 },
                    searchAlso: imDialog
                })
            )
        ).toEqual([]);
    });

    test('customFilter bleibt UND: er schraenkt auch einen searchAlso-Treffer ein', () => {
        const cfg = customFilter => ({
            searchText: 'golden',
            searchFields: ['name'],
            searchAlso: imDialog,
            customFilter
        });
        expect(
            ids(
                applyFilters(
                    NPCS,
                    cfg(() => true)
                )
            )
        ).toEqual([1, 4]);
        expect(
            ids(
                applyFilters(
                    NPCS,
                    cfg(n => n.id !== 4)
                )
            )
        ).toEqual([1]);
        expect(
            ids(
                applyFilters(
                    NPCS,
                    cfg(() => false)
                )
            )
        ).toEqual([]);
    });

    test('leeres searchFields mit searchAlso: searchAlso entscheidet allein ueber den Begriff', () => {
        expect(
            ids(
                applyFilters(NPCS, { searchText: 'golden', searchFields: [], searchAlso: imDialog })
            )
        ).toEqual([1, 4]);
        expect(
            ids(applyFilters(NPCS, { searchText: 'anna', searchFields: [], searchAlso: imDialog }))
        ).toEqual([]);
    });
});
