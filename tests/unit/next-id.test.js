/**
 * ID-Invariante nextId() — R03 (Code-Review 2026-09-21, Einheit U2)
 *
 * nextId(type) in utils/utilities.js vertraute jedem "truthy" gespeicherten
 * Zaehler (_nextId[type]) blind und las die Sammlung ueber D[type]. Folgen:
 *   - Ein veralteter Zaehler (z. B. nach einem ueberschreibenden Import ohne
 *     _nextId) vergibt eine bereits belegte ID erneut.
 *   - Die verschachtelten Sammlungen calendarEvents (D.calendar.events) und
 *     combatants (D.initiative.combatants) existieren nicht als D[type] —
 *     beide Zaehler begannen immer bei 1 und kollidierten.
 *   - 1e300 als Zaehler lieferte zweimal dieselbe ID (1e300 + 1 === 1e300),
 *     'abc' lieferte NaN.
 *   - validateDataIntegrity()s Duplikat-Reparatur zog aus dem veralteten
 *     Zaehler und erzeugte neue Duplikate ([1,1,2] -> [1,2,2]).
 *
 * Neu: nextId() nimmt max(gueltiger Zaehler, groesste gueltige ID + 1), das
 * Register ID_COUNTER_PATHS kennt jeden je an nextId() uebergebenen Typ samt
 * Pfad, und validateAndRepairNextId(data, types) arbeitet auf dem uebergebenen
 * Objekt statt immer auf window.D.
 *
 * Harness: vm-Kontext, der zugleich `window` ist (wie ein klassisches Browser-
 * Skript), mit den ECHTEN Quelldateien.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { extractModulesFromLoader } = require('../../tools/generate-eslint-globals.js');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BASE_FILES = ['core/config.js', 'core/data.js', 'utils/basic.js', 'utils/utilities.js'];

/** JSON-Rundlauf: vm-Objekte (fremder Realm) vergleichbar machen. */
const plain = v => JSON.parse(JSON.stringify(v));

/**
 * Laedt die echten Module in einen frischen vm-Kontext.
 * @param {{ withHelpers?: boolean, withMigration?: boolean }} opts - withHelpers:
 *   zusaetzlich render/helpers.js (ENTITY_SCHEMAS + validateDataIntegrity); withMigration:
 *   zusaetzlich systems/spellslots/version-migration.js, also den ECHTEN Restore/Import-
 *   Normalisierer normalizeCampaignData() (Stubs wie in campaign-schema.test.js)
 */
function makeContext({ withHelpers = false, withMigration = false } = {}) {
    const ctx = { setTimeout, clearTimeout };
    ctx.window = ctx;
    ctx.document = {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
    };
    ctx.ErrorHandler = { log: jest.fn() };
    ctx.debugLogAdd = jest.fn();
    if (withMigration) {
        ctx.getSpellSlotsForClass = jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0]);
        ctx.CONDITIONS = { poisoned: { name: 'Vergiftet' }, prone: { name: 'Liegend' } };
    }
    vm.createContext(ctx);
    const files = withHelpers ? [...BASE_FILES, 'render/helpers.js'] : [...BASE_FILES];
    if (withMigration) files.push('systems/spellslots/version-migration.js');
    for (const rel of files) {
        vm.runInContext(fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'), ctx, { filename: rel });
    }
    // render/helpers.js exportiert ein echtes ErrorHandler-Objekt (mit Konsolen-Senke) —
    // fuer die Tests durch den stummen Stub ersetzen.
    ctx.ErrorHandler = { log: jest.fn() };
    return ctx;
}

/** Legt eine Sammlung an ihrem Registerpfad ab (top-level oder verschachtelt). */
function putCollection(data, pathSegments, value) {
    let cursor = data;
    for (let i = 0; i < pathSegments.length - 1; i++) {
        const seg = pathSegments[i];
        if (!cursor[seg] || typeof cursor[seg] !== 'object') cursor[seg] = {};
        cursor = cursor[seg];
    }
    cursor[pathSegments[pathSegments.length - 1]] = value;
}

describe('nextId() — Untergrenze aus der Sammlung (R03)', () => {
    let ctx;
    beforeEach(() => {
        ctx = makeContext();
    });

    test('N1: veralteter Zaehler wird nie blind uebernommen', () => {
        ctx.D.npcs = [{ id: 5 }];
        ctx.D._nextId = { npcs: 2 };
        expect(ctx.nextId('npcs')).toBe(6);
        expect(ctx.nextId('npcs')).toBe(7);
    });

    test('N2: verschachtelte Sammlungen calendarEvents/combatants lesen ihren echten Pfad', () => {
        ctx.D.calendar.events = [{ id: 3 }];
        ctx.D.initiative.combatants = [{ id: 4 }];
        ctx.D._nextId = {};
        expect(ctx.nextId('calendarEvents')).toBe(4);
        expect(ctx.nextId('combatants')).toBe(5);
    });

    test('N3 (Waechter): ein gueltiger Zaehler oberhalb der Untergrenze wird nie gesenkt', () => {
        ctx.D.npcs = [{ id: 5 }];
        ctx.D._nextId = { npcs: 10 };
        expect(ctx.nextId('npcs')).toBe(10);
        expect(ctx.nextId('npcs')).toBe(11);
    });

    test.each([
        ['1e300', 1e300],
        ["'abc'", 'abc'],
        ['2.5', 2.5]
    ])(
        'N4: ungueltiger Zaehler %s heilt sich selbst (zwei verschiedene sichere Ganzzahlen)',
        (_label, counter) => {
            ctx.D.npcs = [{ id: 1 }];
            ctx.D._nextId = { npcs: counter };
            const a = ctx.nextId('npcs');
            const b = ctx.nextId('npcs');
            expect(a).toBe(2);
            expect(b).toBe(3);
            expect(Number.isSafeInteger(a) && Number.isSafeInteger(b)).toBe(true);
        }
    );

    test('N5: ungueltige Live-IDs zaehlen nicht, numerische Zeichenketten schon', () => {
        ctx.D.npcs = [{ id: 1e300 }, { id: '7' }, { id: 2.5 }];
        ctx.D._nextId = {};
        expect(ctx.nextId('npcs')).toBe(8);
    });

    test('nextId ersetzt ein kaputtes _nextId (kein Objekt) durch ein frisches', () => {
        ctx.D.npcs = [{ id: 2 }];
        ctx.D._nextId = 'kaputt';
        expect(ctx.nextId('npcs')).toBe(3);
        expect(plain(ctx.D._nextId)).toEqual({ npcs: 4 });
    });
});

describe('ID_COUNTER_PATHS — Register aller nextId()-Typen (R03)', () => {
    test('N6: jeder nextId-Literaltyp im Quellbaum ist registriert; jeder Registertyp liest seinen Pfad', () => {
        const ctx = makeContext();
        expect(ctx.ID_COUNTER_PATHS).toBeDefined();
        const registry = ctx.ID_COUNTER_PATHS;
        expect(Object.isFrozen(registry)).toBe(true);
        expect(Object.keys(registry)).toHaveLength(19);
        expect(Object.keys(registry)).not.toContain('items');
        expect(plain(registry.calendarEvents)).toEqual(['calendar', 'events']);
        expect(plain(registry.combatants)).toEqual(['initiative', 'combatants']);
        for (const segs of Object.values(registry)) {
            expect(Object.isFrozen(segs)).toBe(true);
        }

        // Quellbaum-Scan: jede Datei aus loader.js MODULES
        const modules = extractModulesFromLoader(
            fs.readFileSync(path.join(REPO_ROOT, 'loader.js'), 'utf8')
        );
        expect(modules.length).toBeGreaterThan(100);
        const literalPattern = /nextId\(\s*['"]([A-Za-z]+)['"]\s*\)/g;
        const found = new Map();
        for (const rel of modules) {
            const src = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
            let m;
            while ((m = literalPattern.exec(src)) !== null) {
                if (!found.has(m[1])) found.set(m[1], rel);
            }
        }
        // Plausibilitaet des Scans: das Inventar vom 2026-09-21 umfasst 19 Typen
        expect(found.size).toBeGreaterThanOrEqual(15);
        const unregistered = [...found.entries()]
            .filter(([type]) => !Object.prototype.hasOwnProperty.call(registry, type))
            .map(([type, rel]) => `${type} (${rel})`);
        expect(unregistered).toEqual([]);

        // Jeder Registertyp: [{id:7}] an seinem Pfad, Zaehler 1 -> 8
        for (const [type, segs] of Object.entries(registry)) {
            const fresh = makeContext();
            putCollection(fresh.D, [...segs], [{ id: 7 }]);
            fresh.D._nextId = { [type]: 1 };
            expect({ type, id: fresh.nextId(type) }).toEqual({ type, id: 8 });
        }
    });
});

describe('validateAndRepairNextId(data, types) (R03)', () => {
    test('N7: repariert das uebergebene Objekt, nicht window.D; ohne Argumente nur die 11 Alt-Typen', () => {
        const ctx = makeContext();
        const dBefore = JSON.stringify(ctx.D);
        const obj = {
            factions: [{ id: 5 }],
            calendar: { events: [{ id: 9 }] },
            _nextId: { factions: 2 }
        };
        const res = ctx.validateAndRepairNextId(obj, ['factions', 'calendarEvents']);
        expect(obj._nextId.factions).toBe(6);
        expect(obj._nextId.calendarEvents).toBe(10);
        expect(res.valid).toBe(false);
        expect(JSON.stringify(ctx.D)).toBe(dBefore);

        // Mit der vollen Registerliste: jeder Registertyp mit Sammlung wird geprueft
        const obj2 = {
            sessionPreps: [{ id: 3 }],
            initiative: { combatants: [{ id: 8 }] },
            _nextId: {}
        };
        ctx.validateAndRepairNextId(obj2, Object.keys(ctx.ID_COUNTER_PATHS));
        expect(plain(obj2._nextId)).toEqual({ sessionPreps: 4, combatants: 9 });
        expect(JSON.stringify(ctx.D)).toBe(dBefore);

        // Ohne Argumente: window.D, Default-Liste unveraendert (E2E-Seeds sind darauf kalibriert)
        ctx.D.factions = [{ id: 5 }];
        ctx.D._nextId = {
            characters: 1,
            npcs: 1,
            locations: 1,
            quests: 1,
            encounters: 1,
            spells: 1,
            loot: 1,
            items: 1,
            wiki: 1,
            sessionNotes: 1,
            randomTables: 1,
            factions: 2
        };
        const res2 = ctx.validateAndRepairNextId();
        expect(res2).toEqual(expect.objectContaining({ valid: true }));
        expect(ctx.D._nextId.factions).toBe(2);
    });

    test('N7b: ohne Argumente werden exakt die 11 Alt-Typen geprueft (inkl. items)', () => {
        const ctx = makeContext();
        ctx.D.randomTables = [];
        ctx.D.items = [];
        ctx.D.shops = [];
        ctx.D._nextId = {};
        const res = ctx.validateAndRepairNextId();
        const repairedTypes = res.repairs.map(r => r.split(':')[0]).sort();
        expect(repairedTypes).toEqual(
            [
                'characters',
                'npcs',
                'locations',
                'quests',
                'encounters',
                'spells',
                'loot',
                'items',
                'wiki',
                'sessionNotes',
                'randomTables'
            ].sort()
        );
    });
});

describe('validateDataIntegrity() Duplikat-Reparatur (R03)', () => {
    test('N8: Duplikat-Reparatur mintet keine neuen Duplikate aus einem veralteten Zaehler', () => {
        const ctx = makeContext({ withHelpers: true });
        ctx.D.npcs = [
            { id: 1, name: 'A' },
            { id: 1, name: 'B' },
            { id: 2, name: 'C' }
        ];
        ctx.D._nextId = { npcs: 2 };
        ctx.validateDataIntegrity();
        const ids = ctx.D.npcs.map(n => n.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids[0]).toBe(1);
        expect(ids[2]).toBe(2);
    });
});

describe('normalizeEntityIds() / recomputeNextIds() (U2)', () => {
    test('Nicht-Objekt-Eintraege bleiben stehen, jede Aenderung wird gemeldet', () => {
        const ctx = makeContext();
        const data = {
            npcs: [{ id: 2 }, 'text', null, { id: 2 }, { id: -1 }, { id: 1e16 }],
            calendar: { events: [{ id: '3' }] }
        };
        const changes = plain(ctx.normalizeEntityIds(data));
        expect(data.npcs.map(n => (n && typeof n === 'object' ? n.id : n))).toEqual([
            2,
            'text',
            null,
            3,
            4,
            5
        ]);
        expect(data.calendar.events[0].id).toBe(3);
        expect(changes).toEqual([
            { type: 'npcs', from: 2, to: 3 },
            { type: 'npcs', from: -1, to: 4 },
            { type: 'npcs', from: 1e16, to: 5 },
            { type: 'calendarEvents', from: '3', to: 3 }
        ]);
        expect(ctx.normalizeEntityIds(data)).toHaveLength(0);
    });

    test('recomputeNextIds: gueltige Datei-Zaehler bleiben, ungueltige fallen weg, Untergrenze greift', () => {
        const ctx = makeContext();
        const data = { npcs: [{ id: 9 }], initiative: { combatants: [{ id: 4 }] } };
        const counters = ctx.recomputeNextIds(data, {
            npcs: 3,
            items: 7,
            spells: 'x',
            loot: 1e300
        });
        expect(data._nextId).toBe(counters);
        expect(counters.npcs).toBe(10);
        expect(counters.items).toBe(7);
        expect(counters.combatants).toBe(5);
        expect(counters.spells).toBe(1);
        expect(counters.loot).toBe(1);
        expect(Object.keys(counters)).toHaveLength(Object.keys(ctx.ID_COUNTER_PATHS).length + 1);
    });
});

describe('ID-Obergrenze ENTITY_ID_MAX — Saettigung (U2 minor:3/open:4/minor:9)', () => {
    /** Lesbare Zusicherung: der Wert selbst steht in der Fehlermeldung. */
    const istGueltigeId = id => ({
        id,
        gueltig: Number.isSafeInteger(id) && id > 0 && id <= 1e15
    });

    test('N9: nextId vergibt an der Obergrenze gueltige, eindeutige IDs — auch im Stapel', () => {
        const ctx = makeContext();
        // minor:9 (Mutant U03): die Obergrenze selbst ist die Bedingung, die 1e15 + 1
        // ungueltig macht. Ohne `n <= ENTITY_ID_MAX` verschiebt sich die Saettigung
        // nur auf 2^53, das Problem bleibt dasselbe.
        expect(ctx.isValidEntityId(5e15)).toBe(false);
        expect(ctx.isValidEntityId(1e15)).toBe(true);
        expect(ctx.isValidEntityId(1e15 + 1)).toBe(false);

        // Eine ID von genau 1e15 kommt aus einer fremden oder beschaedigten Datei
        // (R03-Bedrohungsmodell) — Normalisierer und validateDataIntegrity nehmen sie an.
        ctx.D.npcs = [{ id: 1e15 }, { id: 1 }, { id: 3 }];
        ctx.D._nextId = {};
        // Drei Aufrufe OHNE push dazwischen (Stapelvergabe, z. B. Import mehrerer Datensaetze)
        const stapel = [ctx.nextId('npcs'), ctx.nextId('npcs'), ctx.nextId('npcs')];
        for (const id of stapel) ctx.D.npcs.push({ id });

        expect(stapel.map(istGueltigeId)).toEqual(stapel.map(id => ({ id, gueltig: true })));
        const ids = ctx.D.npcs.map(n => n.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('N10: normalizeEntityIds vergibt an der Obergrenze keine ungueltigen IDs', () => {
        const ctx = makeContext();
        const data = { npcs: [{ id: 1e15 }, { id: 'x' }, { id: 1e15 }, { id: 1 }] };
        ctx.normalizeEntityIds(data);
        const ids = data.npcs.map(n => n.id);

        expect(ids.map(istGueltigeId)).toEqual(ids.map(id => ({ id, gueltig: true })));
        expect(new Set(ids).size).toBe(ids.length);
        // Die spaeter stehende gueltige ID 1 bleibt unangetastet ...
        expect(data.npcs[3].id).toBe(1);
        // ... die Luecken darunter werden aufgefuellt
        expect(ids).toEqual([1e15, 2, 3, 1]);
        // Zweiter Lauf ist ein Nullschritt
        expect(ctx.normalizeEntityIds(data)).toHaveLength(0);
    });

    test('N11: eine Ganzzahl UNTER der Obergrenze — Stapelvergabe bleibt eindeutig', () => {
        const ctx = makeContext();
        // Voraussetzung ist nur EINE ID von 1e15 - 1 aus einer fremden oder beschaedigten
        // Datei (dasselbe R03-Bedrohungsmodell wie bei genau 1e15). Der Zaehler 1e15 stammt
        // danach aus der App selbst (recomputeNextIds), nicht aus der Datei.
        ctx.D.npcs = [{ id: 1e15 - 1, name: 'Alt-NSC' }];
        ctx.recomputeNextIds(ctx.D);
        expect(ctx.isValidEntityId(ctx.D._nextId.npcs)).toBe(true);

        // Stapelvergabe OHNE push dazwischen — genau das Muster von
        // systems/spellslots/import-export.js (Merge-Zweig: items.map(... nextId(type)))
        const stapel = [ctx.nextId('npcs'), ctx.nextId('npcs'), ctx.nextId('npcs')];
        expect(stapel.map(istGueltigeId)).toEqual(stapel.map(id => ({ id, gueltig: true })));
        expect(new Set(stapel).size).toBe(stapel.length);

        for (const [i, id] of stapel.entries()) ctx.D.npcs.push({ id, name: `Import ${i}` });
        const ids = ctx.D.npcs.map(n => n.id);
        expect(new Set(ids).size).toBe(ids.length);
        // Die R03-Fehlerklasse selbst: ein Loeschen darf genau eine Entitaet entfernen
        const ziel = stapel[0];
        expect(ctx.D.npcs.filter(e => e.id !== ziel)).toHaveLength(ctx.D.npcs.length - 1);
    });

    test('N12: der gespeicherte Zaehler bleibt nach jedem nextId selbst eine gueltige ID', () => {
        const ctx = makeContext();
        // Unterhalb der Saettigung ist der Zaehler die Erinnerung an "diese ID ist im
        // laufenden Stapel schon vergeben" (die Sammlung weiss es erst nach dem push).
        // Wird er ungueltig, verwirft ihn der naechste Aufruf und faellt auf die
        // Untergrenze zurueck — die doppelte ID aus N11. Deshalb muenzt nextId nie
        // ENTITY_ID_MAX selbst: so ist id + 1 immer noch eine gueltige ID. In der
        // Saettigung traegt den Stapel der modulinterne Suchzeiger (siehe N13/N14), und
        // der Zaehler haelt mit ENTITY_ID_MAX das Signal "gesaettigt" — auch das eine
        // gueltige ID, also bleibt die hier gepinnte Zusicherung in beiden Faellen wahr.
        for (const max of [1e15 - 2, 1e15 - 1, 1e15]) {
            ctx.D.npcs = [{ id: max }];
            ctx.D._nextId = {};
            for (let i = 0; i < 3; i++) {
                const id = ctx.nextId('npcs');
                expect(istGueltigeId(id)).toEqual({ id, gueltig: true });
                expect(istGueltigeId(ctx.D._nextId.npcs)).toEqual({
                    id: ctx.D._nextId.npcs,
                    gueltig: true
                });
            }
        }
    });

    test('N13: Saettigungsmatrix — der Stapel bleibt fuer JEDE Naehe zur Obergrenze eindeutig', () => {
        // Korrekturrunde 2 (Code-Review 2026-09-21): die Runde-1-Fassung heilte nur den
        // gemeldeten Wert max(ID) = 1e15 - 1. Ursache war aber nicht dieser eine Wert,
        // sondern der SPEICHERORT der Erinnerung: der Saettigungszweig schrieb die niedrige
        // Luecken-ID in den persistenten Zaehler. Beim naechsten Aufruf lag dieser Wert
        // unter der Untergrenze max(ID) + 1, galt deshalb als veraltet, wurde verworfen —
        // und die Untergrenze wurde ein zweites Mal vergeben. Gemessen vor der Korrektur:
        // bei max(ID) = 1e15 - k sind ab dem (k+1)-ten Aufruf eines Stapels die IDs
        // zyklisch doppelt (k = 2: [1e15-1, 1, 1e15-1, 1, ...], 2 verschiedene von 8).
        const STAPEL = 8;
        for (let k = 0; k <= 6; k++) {
            const ctx = makeContext();
            // Eine einzige hohe ID aus einer fremden oder beschaedigten Datei genuegt
            // (R03-Bedrohungsmodell); der Zaehler kommt danach aus der App selbst.
            ctx.D.npcs = [{ id: 1e15 - k, name: 'Alt-NSC' }];
            ctx.recomputeNextIds(ctx.D);

            // Stapelvergabe OHNE push dazwischen — das Muster des Merge-Zweigs in
            // systems/spellslots/import-export.js (items.map(... nextId(type))).
            const stapel = [];
            for (let i = 0; i < STAPEL; i++) {
                stapel.push(ctx.nextId('npcs'));
                // Der gespeicherte Zaehler bleibt in jedem Schritt selbst eine gueltige ID
                // (N12), damit ihn der naechste Aufruf nicht verwerfen muss.
                expect({ k, ...istGueltigeId(ctx.D._nextId.npcs) }).toEqual({
                    k,
                    id: ctx.D._nextId.npcs,
                    gueltig: true
                });
            }
            expect({ k, ungueltig: stapel.filter(id => !istGueltigeId(id).gueltig) }).toEqual({
                k,
                ungueltig: []
            });
            expect({ k, verschieden: new Set(stapel).size }).toEqual({ k, verschieden: STAPEL });

            // Die R03-Fehlerklasse selbst: ein Loeschen darf genau eine Entitaet entfernen
            for (const [i, id] of stapel.entries()) ctx.D.npcs.push({ id, name: `Import ${i}` });
            const ids = ctx.D.npcs.map(n => n.id);
            expect({ k, eindeutig: new Set(ids).size }).toEqual({ k, eindeutig: ids.length });
            const ziel = stapel[0];
            expect({ k, rest: ctx.D.npcs.filter(e => e.id !== ziel).length }).toEqual({
                k,
                rest: ids.length - 1
            });
        }
    });

    test('N14: die Saettigungserinnerung ueberlebt einen Datei-Rundlauf ohne Kollision', () => {
        // Der Suchzeiger der Saettigung liegt bewusst nur im Speicher. Nach einem Neuladen
        // ist er weg — die bereits vergebenen IDs stehen aber in der Sammlung, also setzt
        // die Lueckensuche dort korrekt fort. Ein frischer vm-Kontext ist dieses Neuladen.
        const stapelVergeben = (ctx, anzahl, praefix) => {
            const stapel = [];
            for (let i = 0; i < anzahl; i++) stapel.push(ctx.nextId('npcs'));
            stapel.forEach((id, i) => ctx.D.npcs.push({ id, name: `${praefix}-${i}` }));
            return stapel;
        };

        const sitzung1 = makeContext();
        sitzung1.D.npcs = [{ id: 1e15 - 2, name: 'Alt-NSC' }];
        sitzung1.recomputeNextIds(sitzung1.D);
        const erst = stapelVergeben(sitzung1, 4, 'S1');

        // Speichern/Laden wie ueber localStorage: JSON-Rundlauf, danach frischer Kontext
        const datei = plain({ npcs: sitzung1.D.npcs, _nextId: sitzung1.D._nextId });
        const sitzung2 = makeContext();
        sitzung2.D.npcs = datei.npcs;
        sitzung2.D._nextId = datei._nextId;
        const zweit = stapelVergeben(sitzung2, 4, 'S2');

        const ids = sitzung2.D.npcs.map(n => n.id);
        expect(ids.map(istGueltigeId)).toEqual(ids.map(id => ({ id, gueltig: true })));
        expect({ sitzung1: erst, sitzung2: zweit, eindeutig: new Set(ids).size }).toEqual({
            sitzung1: erst,
            sitzung2: zweit,
            eindeutig: ids.length
        });
    });
});

describe('R03 — Waechter der Abschlussrunde (G2)', () => {
    /** Lesbare Zusicherung: der Wert selbst steht in der Fehlermeldung. */
    const istGueltigeId = id => ({
        id,
        gueltig: Number.isSafeInteger(id) && id > 0 && id <= 1e15
    });

    /** Vergibt `anzahl` IDs und schiebt sie in die Sammlung (wie jeder CRUD-Pfad). */
    const vergebenUndAblegen = (ctx, anzahl, praefix) => {
        const ids = [];
        for (let i = 0; i < anzahl; i++) {
            const id = ctx.nextId('npcs');
            ids.push(id);
            ctx.D.npcs.push({ id, name: `${praefix}${i}` });
        }
        return ids;
    };

    test('G2a: Datei-Zaehler 1e15 bei kleiner Sammlung — Vergabe setzt UEBER max(ID) auf', () => {
        // Ende-zu-Ende ueber den ECHTEN Restore/Import-Normalisierer. 1e15 ist eine
        // GUELTIGE ID, also behielt recomputeNextIds() den Zaehler, und nextId() las daraus
        // die Saettigung ab, obwohl oberhalb von max(ID) = 5 noch 1e15 IDs frei sind.
        // giverId: 3 ist ein Haenger auf einen frueher geloeschten NSC — genau die Sorte
        // Verweis, die ein Luecken-Modus still an eine NEUE Entitaet umbindet (Loeschen
        // raeumt Verweise nicht auf: deleteWithConfirm im NSC-CRUD filtert nur die Sammlung.
        // Der Modulpfad steht hier bewusst NICHT woertlich — das Abdeckungs-Gate in
        // tests/unit/module-test-coverage.test.js wertet jede woertliche Pfadnennung als
        // "Modul von einem Test angefasst", und dieser Test liest das Modul nicht).
        const ctx = makeContext({ withMigration: true });
        expect(typeof ctx.normalizeCampaignData).toBe('function');
        const res = ctx.normalizeCampaignData({
            npcs: [
                { id: 1, name: 'Borin' },
                { id: 2, name: 'Mira' },
                { id: 5, name: 'Zogg' }
            ],
            quests: [{ id: 1, title: 'Auftrag', giverId: 3 }],
            _nextId: { npcs: 1e15 }
        });
        expect(res.ok).toBe(true);
        ctx.D = res.data;
        expect(ctx.maxEntityId(ctx.D.npcs)).toBe(5);

        const neu = vergebenUndAblegen(ctx, 3, 'Neu');

        // 1. Die Bedeutung zuerst: der Haenger bleibt ein Haenger. Zeigt er nach der
        //    Vergabe auf eine Entitaet, hat die App eine fremde Beziehung erfunden.
        const giver = ctx.D.npcs.find(n => n.id === ctx.D.quests[0].giverId);
        expect({ giverId: ctx.D.quests[0].giverId, zeigtAuf: giver ? giver.name : null }).toEqual({
            giverId: 3,
            zeigtAuf: null
        });
        // 2. Der Mechanismus: monoton oberhalb des Maximums, nicht in den Luecken.
        expect(neu).toEqual([6, 7, 8]);
        expect(neu.map(istGueltigeId)).toEqual(neu.map(id => ({ id, gueltig: true })));
        // 3. Der Zaehler traegt danach die Vergabe und bleibt selbst gueltig.
        expect(istGueltigeId(ctx.D._nextId.npcs)).toEqual({ id: 9, gueltig: true });
        expect(ctx.D._nextId.npcs).toBeGreaterThan(ctx.maxEntityId(ctx.D.npcs));
        const ids = ctx.D.npcs.map(n => n.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('G2b: nach dem Loeschen der Obergrenzen-Entitaet ist die Vergabe wieder monoton', () => {
        // Eine fremde Datei bringt EINE Entitaet mit id 1e15 mit (R03-Bedrohungsmodell).
        // Die Saettigung ist dort echt und der Luecken-Modus richtig. Der Nutzer loescht
        // diese Entitaet danach — und zwei NSCs. Ab dem naechsten Laden ist die Sammlung
        // harmlos, also darf die Vergabe die geloeschten IDs NICHT wiederverwenden.
        const sitzung1 = makeContext();
        sitzung1.D.npcs = [
            { id: 1, name: 'Borin' },
            { id: 2, name: 'Mira' },
            { id: 3, name: 'Zogg' },
            { id: 1e15, name: 'Fremd' }
        ];
        sitzung1.D.quests = [{ id: 1, title: 'Auftrag', giverId: 2 }];
        sitzung1.recomputeNextIds(sitzung1.D);
        const inSaettigung = vergebenUndAblegen(sitzung1, 1, 'S1-');
        expect(inSaettigung[0]).toBe(4); // echte Saettigung: Luecke unterhalb der Grenze
        sitzung1.D.npcs = sitzung1.D.npcs.filter(n => ![1e15, 2, 3].includes(n.id));

        // Speichern/Laden wie ueber localStorage: JSON-Rundlauf, danach frischer Kontext
        const datei = plain({
            npcs: sitzung1.D.npcs,
            quests: sitzung1.D.quests,
            _nextId: sitzung1.D._nextId
        });
        const sitzung2 = makeContext();
        sitzung2.D.npcs = datei.npcs;
        sitzung2.D.quests = datei.quests;
        sitzung2.D._nextId = datei._nextId;
        expect(sitzung2.maxEntityId(sitzung2.D.npcs) + 1).toBe(5);

        const neu = vergebenUndAblegen(sitzung2, 2, 'S2-');

        // 1. Die Bedeutung zuerst: der Verweis auf den geloeschten NSC 2 bleibt ein Haenger.
        const giver = sitzung2.D.npcs.find(n => n.id === sitzung2.D.quests[0].giverId);
        expect({
            giverId: sitzung2.D.quests[0].giverId,
            zeigtAuf: giver ? giver.name : null
        }).toEqual({ giverId: 2, zeigtAuf: null });
        // 2. Der Mechanismus: keine geloeschte ID wird wiederverwendet.
        expect({ neu, wiederverwendet: neu.filter(id => [2, 3].includes(id)) }).toEqual({
            neu: [5, 6],
            wiederverwendet: []
        });
        expect(istGueltigeId(sitzung2.D._nextId.npcs)).toEqual({ id: 7, gueltig: true });
    });

    test('G2f: der veraltete Pin heilt im SELBEN Seitenleben — ohne Neuladen', () => {
        // Korrekturrunde 1 der Abschlussrunde: G2b pinnt den Weg ueber ein Neuladen
        // (frischer Kontext = frischer Vergabezeiger). Genau daran hing der Waechter aber:
        // er sprang nur, solange fuer den Typ in diesem Prozess noch NIE gemuenzt worden
        // war. Nach dem ersten nextId() konnte der Pin in dieser Sitzung nicht mehr heilen.
        // Der Ablauf braucht kein Neuladen, keinen Import, kein Undo: "NSC anlegen, die
        // komische importierte Entitaet loeschen, naechsten NSC anlegen". Gemessen vor der
        // Korrektur: der zweite Aufruf gab 3 zurueck — eine geloeschte ID, obwohl 501 frei
        // war — und band den Haenger quest.giverId = 3 an den NEUEN NSC um.
        const ctx = makeContext();
        ctx.D.npcs = [
            { id: 1, name: 'Borin' },
            { id: 500, name: 'Mira' },
            { id: 1e15, name: 'Fremd' }
        ];
        ctx.D.quests = [{ id: 2, title: 'Auftrag', giverId: 3 }];
        ctx.recomputeNextIds(ctx.D);

        // Erster Aufruf: die Saettigung ist hier ECHT (max(ID) = 1e15), die Luecke
        // unterhalb der Grenze ist die einzige Moeglichkeit.
        const inSaettigung = vergebenUndAblegen(ctx, 1, 'S1-');
        expect(inSaettigung).toEqual([2]);

        // Der Nutzer loescht die fremde Obergrenzen-Entitaet — im selben Seitenleben.
        ctx.D.npcs = ctx.D.npcs.filter(n => n.id !== 1e15);
        expect(ctx.maxEntityId(ctx.D.npcs) + 1).toBe(501);

        const neu = vergebenUndAblegen(ctx, 2, 'NEU');

        // 1. Die Bedeutung zuerst: der Haenger auf den laengst geloeschten NSC 3 bleibt
        //    ein Haenger. Zeigt er auf eine Entitaet, hat die App eine fremde Beziehung
        //    erfunden — still, dauerhaft, ohne Signal.
        const giver = ctx.D.npcs.find(n => n.id === ctx.D.quests[0].giverId);
        expect({ giverId: ctx.D.quests[0].giverId, zeigtAuf: giver ? giver.name : null }).toEqual({
            giverId: 3,
            zeigtAuf: null
        });
        // 2. Der Mechanismus: die Sammlung reicht nur bis 500, also setzt die monotone
        //    Vergabe darueber auf, statt Luecken (3, 4, ...) wiederzuverwenden.
        expect({ neu, unterhalbDerUntergrenze: neu.filter(id => id < 501) }).toEqual({
            neu: [501, 502],
            unterhalbDerUntergrenze: []
        });
        // 3. Der Zaehler traegt die Vergabe und bleibt selbst eine gueltige ID (N12).
        expect(istGueltigeId(ctx.D._nextId.npcs)).toEqual({ id: 503, gueltig: true });
        const ids = ctx.D.npcs.map(n => n.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('G2g: eine unvergebene Luecken-ID unterwegs wird nicht erneut vergeben', () => {
        // Die Gegenrichtung zu G2f: der Saettigungszweig gibt eine niedrige Luecken-ID
        // heraus, die noch in KEINER Sammlung steht (Stapel ohne push, Merge-Zweig des
        // Imports). Faellt die Obergrenzen-Entitaet genau dazwischen weg, sinkt die
        // Untergrenze auf genau diese unterwegs befindliche ID. Sie ein zweites Mal
        // auszugeben ist die R03-Fehlerklasse (gemessen vor dem Waechter: mint1 = 4,
        // mint2 = 4). Weil der Waechter die schon herausgegebenen IDs kennt, ueberspringt
        // er die 4 und setzt auf 5 auf — geheilt wird also, nur nicht auf einer belegten ID.
        const ctx = makeContext();
        ctx.D.npcs = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 1e15, name: 'Fremd' }];
        ctx.recomputeNextIds(ctx.D);

        const unterwegs = ctx.nextId('npcs'); // bewusst NICHT abgelegt
        expect(unterwegs).toBe(4);
        ctx.D.npcs = ctx.D.npcs.filter(n => n.id !== 1e15);
        expect(ctx.maxEntityId(ctx.D.npcs) + 1).toBe(4);

        const zweite = ctx.nextId('npcs');
        expect({ unterwegs, zweite, doppelt: unterwegs === zweite }).toEqual({
            unterwegs: 4,
            zweite: 5,
            doppelt: false
        });
        // Beide IDs landen in der Sammlung: ein Loeschen darf genau eine Entitaet treffen.
        ctx.D.npcs.push({ id: unterwegs, name: 'A' }, { id: zweite, name: 'B' });
        const ids = ctx.D.npcs.map(n => n.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ctx.D.npcs.filter(e => e.id !== unterwegs).length).toBe(ids.length - 1);
    });

    test('G2h: eine hohe NORMALE Vergabe pinnt das Seitenleben nicht (k-Nachbarschaft)', () => {
        // Korrekturrunde 2: G2f/G2d pruefen ausschliesslich max(ID) = 1e15, also den
        // SAETTIGUNGSZWEIG. Genau eine Ganzzahl darunter laeuft der NORMALPFAD — und der
        // schrieb eine prozessweite Hoechstmarke, die nie verfiel. Damit war der Waechter
        // fuer diesen Typ den Rest des Seitenlebens toter Code: eine Marke bei ~1e15 kann
        // von keiner harmlosen Untergrenze mehr uebertroffen werden. Derselbe Fehler wie in
        // Korrekturrunde 1, nur eine Ebene tiefer: ein Hoechststand ueberapproximiert die
        // Frage "ist GENAU DIESE ID schon herausgegeben?" zu "jede ID bis zur hoechsten je
        // gemuenzten koennte unterwegs sein".
        const ctx = makeContext();
        ctx.D.npcs = [
            { id: 1, name: 'Borin' },
            { id: 500, name: 'Mira' },
            { id: 1e15 - 2, name: 'Fremd' }
        ];
        ctx.D.quests = [{ id: 2, title: 'Auftrag', giverId: 3 }];
        ctx.D._nextId = {};

        // Erster Aufruf: die Untergrenze 1e15 - 1 ist selbst noch vergebbar, also laeuft
        // hier der NORMALPFAD — das ist der Unterschied zu G2f und der ganze Punkt.
        const normal = vergebenUndAblegen(ctx, 1, 'Hoch');
        expect(normal).toEqual([1e15 - 1]);

        // Der Nutzer loescht die beiden Eintraege nahe der Obergrenze — im selben
        // Seitenleben, ohne Neuladen, ohne Import, ohne Undo.
        ctx.D.npcs = ctx.D.npcs.filter(n => n.id < 1e15 - 3);
        expect(ctx.maxEntityId(ctx.D.npcs) + 1).toBe(501);

        const neu = vergebenUndAblegen(ctx, 3, 'NEU');

        // 1. Die Bedeutung zuerst: der Haenger auf den laengst geloeschten NSC 3 bleibt
        //    ein Haenger, statt auf eine NEUE Entitaet umgebunden zu werden.
        const giver = ctx.D.npcs.find(n => n.id === ctx.D.quests[0].giverId);
        expect({ giverId: ctx.D.quests[0].giverId, zeigtAuf: giver ? giver.name : null }).toEqual({
            giverId: 3,
            zeigtAuf: null
        });
        // 2. Der Mechanismus: oberhalb von max(ID) = 500 sind 1e15 IDs frei, also setzt die
        //    monotone Vergabe dort auf, statt geloeschte niedrige IDs wiederzuverwenden.
        expect({ neu, unterhalbDerUntergrenze: neu.filter(id => id < 501) }).toEqual({
            neu: [501, 502, 503],
            unterhalbDerUntergrenze: []
        });
        expect(istGueltigeId(ctx.D._nextId.npcs)).toEqual({ id: 504, gueltig: true });
        const ids = ctx.D.npcs.map(n => n.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('G2i: ein gueltiger Datei-Zaehler nahe der Obergrenze pinnt nichts', () => {
        // Der noch harmlosere Einstieg in denselben Schaden: kein 1e15 im Zaehler und keine
        // Obergrenzen-ID in der Sammlung. Ein Datei-Zaehler von 1e15 - 1 ist voellig
        // gueltig UND vergebbar, wird also im Normalpfad gemuenzt — und hinterliess damit
        // dieselbe unverfallbare Hoechstmarke.
        const ctx = makeContext();
        ctx.D.npcs = [
            { id: 1, name: 'Borin' },
            { id: 500, name: 'Mira' }
        ];
        ctx.D._nextId = { npcs: 1e15 - 1 };

        const hoch = vergebenUndAblegen(ctx, 1, 'Datei');
        expect(hoch).toEqual([1e15 - 1]);

        // Der Nutzer loescht die komisch hohe Entitaet wieder.
        ctx.D.npcs = ctx.D.npcs.filter(n => n.id !== 1e15 - 1);
        expect(ctx.maxEntityId(ctx.D.npcs) + 1).toBe(501);

        const neu = vergebenUndAblegen(ctx, 2, 'NEU');
        expect({ neu, unterhalbDerUntergrenze: neu.filter(id => id < 501) }).toEqual({
            neu: [501, 502],
            unterhalbDerUntergrenze: []
        });
        const ids = ctx.D.npcs.map(n => n.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('G2c: recomputeNextIds heilt den veralteten Pin, echte Saettigung bleibt', () => {
        const ctx = makeContext();
        // Veralteter Pin bei harmloser Sammlung -> Untergrenze. 1e15 ist gueltig, aber
        // niemals vergebbar (isMintableEntityId), traegt also keine Information.
        const veraltet = { npcs: [{ id: 1 }, { id: 2 }, { id: 5 }] };
        ctx.recomputeNextIds(veraltet, { npcs: 1e15 });
        expect(veraltet._nextId.npcs).toBe(6);
        // Ein berechtigter Zaehler oberhalb der Untergrenze bleibt unberuehrt (S10b).
        const berechtigt = { npcs: [{ id: 9 }] };
        ctx.recomputeNextIds(berechtigt, { npcs: 20, items: 3 });
        expect({ npcs: berechtigt._nextId.npcs, items: berechtigt._nextId.items }).toEqual({
            npcs: 20,
            items: 3
        });
        // Echte Saettigung: die Untergrenze selbst liegt an oder ueber der Obergrenze.
        const gesaettigt = { npcs: [{ id: 1e15 }] };
        ctx.recomputeNextIds(gesaettigt, { npcs: 1e15 });
        expect(gesaettigt._nextId.npcs).toBe(1e15 + 1);
        const fastGesaettigt = { npcs: [{ id: 1e15 - 1 }] };
        ctx.recomputeNextIds(fastGesaettigt, { npcs: 1e15 });
        expect(fastGesaettigt._nextId.npcs).toBe(1e15);
    });

    test('G2d: echte Saettigung vergibt weiter Luecken — der Waechter schaltet sie nicht ab', () => {
        // Gegenprobe zu G2a/G2b: liegt die Sammlung wirklich an der Obergrenze, ist der
        // Luecken-Modus die einzige Moeglichkeit und muss erhalten bleiben — auch im
        // Stapel ohne push dazwischen (Merge-Zweig des Imports).
        const ctx = makeContext();
        ctx.D.npcs = [{ id: 1e15 }, { id: 1 }, { id: 3 }];
        ctx.D._nextId = {};
        const stapel = [];
        for (let i = 0; i < 8; i++) {
            stapel.push(ctx.nextId('npcs'));
            expect(istGueltigeId(ctx.D._nextId.npcs)).toEqual({
                id: ctx.D._nextId.npcs,
                gueltig: true
            });
        }
        expect(stapel.map(istGueltigeId)).toEqual(stapel.map(id => ({ id, gueltig: true })));
        expect(new Set(stapel).size).toBe(stapel.length);
        expect(stapel.filter(id => [1, 3, 1e15].includes(id))).toEqual([]);
        // Luecken UNTERHALB des Maximums, nicht darueber — oberhalb gibt es keine mehr.
        expect(stapel.every(id => id < 1e15)).toBe(true);
        for (const [i, id] of stapel.entries()) ctx.D.npcs.push({ id, name: `Import${i}` });
        const ids = ctx.D.npcs.map(n => n.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('G2e: unterhalb der Saettigung bleibt die Vergabe monoton und einmalig', () => {
        const ctx = makeContext();
        ctx.D.npcs = [{ id: 1 }, { id: 2 }, { id: 3 }];
        ctx.D._nextId = {};
        // Stapel ohne push dazwischen (N13-Bindung fuer den Normalfall)
        const stapel = [ctx.nextId('npcs'), ctx.nextId('npcs'), ctx.nextId('npcs')];
        expect(stapel).toEqual([4, 5, 6]);
        stapel.forEach((id, i) => ctx.D.npcs.push({ id, name: `Import${i}` }));
        // Geloeschte IDs werden nicht wiederverwendet
        ctx.D.npcs = ctx.D.npcs.filter(n => ![2, 6].includes(n.id));
        const nachher = ctx.nextId('npcs');
        expect({ nachher, wiederverwendet: [2, 6].includes(nachher) }).toEqual({
            nachher: 7,
            wiederverwendet: false
        });
    });

    test('G2j: die Lueckensuche ueberspringt eine unterwegs befindliche ID', () => {
        // Korrekturrunde 3: der Waechter fragt MINT_ISSUED, die Lueckensuche der Saettigung
        // fragt nur die SAMMLUNG. Zwei Verbraucher derselben Frage, nur einer erinnert sich —
        // also kann eine schon herausgegebene, aber noch nicht abgelegte ID ein zweites Mal
        // herauskommen. Der Ablauf ist die uebliche Folge aus einem Merge-Import, bei dem ein
        // Datensatz liegen bleibt (ungueltiger Eintrag, abgebrochenes Speichern), und einem
        // Loeschen danach.
        const ctx = makeContext();
        // Fremde Datei mit ZWEI IDs nahe der Obergrenze (R03-Bedrohungsmodell).
        ctx.D.npcs = [
            { id: 1e15 - 1, name: 'Fremd A' },
            { id: 1e15 - 2, name: 'Fremd B' }
        ];
        ctx.recomputeNextIds(ctx.D);

        // Merge-Import von vier NSCs (Stapel ohne push): echte Saettigung, also Luecken.
        const stapel = [0, 1, 2, 3].map(() => ctx.nextId('npcs'));
        expect(stapel).toEqual([1, 2, 3, 4]);
        // Nur drei werden abgelegt — der vierte bleibt unterwegs und steht in KEINER
        // Sammlung. Genau darum kann die Sammlung allein die Frage nicht beantworten.
        for (const id of stapel.slice(0, 3)) ctx.D.npcs.push({ id, name: `Import ${id}` });
        const unterwegs = stapel[3];
        expect(ctx.D.npcs.some(n => n.id === unterwegs)).toBe(false);

        // Der DM loescht den komischen fremden NSC A. Die Untergrenze 1e15 - 1 ist danach
        // selbst wieder vergebbar, also heilt der Waechter und der NORMALPFAD laeuft.
        ctx.D.npcs = ctx.D.npcs.filter(n => n.id !== 1e15 - 1);
        const neu = vergebenUndAblegen(ctx, 2, 'Neu');

        // Die erste Vergabe nimmt zu Recht die geheilte Untergrenze. Danach liegt die
        // Sammlung wieder an der Obergrenze, also entscheidet die Lueckensuche — und die
        // darf die unterwegs befindliche 4 NICHT erneut ausgeben (gemessen davor: 4).
        expect({ neu, erneut: neu.includes(unterwegs) }).toEqual({
            neu: [1e15 - 1, 5],
            erneut: false
        });
        expect(neu.map(istGueltigeId)).toEqual(neu.map(id => ({ id, gueltig: true })));

        // Die R03-Fehlerklasse selbst: der nachgereichte Import legt seine ID ab, und ein
        // Loeschen darf danach genau EINE Entitaet treffen (davor: zwei).
        ctx.D.npcs.push({ id: unterwegs, name: 'Import nachgereicht' });
        const ids = ctx.D.npcs.map(n => n.id);
        expect({ eindeutig: new Set(ids).size, gesamt: ids.length }).toEqual({
            eindeutig: ids.length,
            gesamt: ids.length
        });
        expect(ctx.D.npcs.filter(e => e.id !== unterwegs).length).toBe(ids.length - 1);
    });

    test('G2k: ein Zeigerruecklauf holt eine unterwegs befindliche Luecken-ID nicht zurueck', () => {
        // Derselbe Befund ohne Datei-Zaehler, dafuer mit offen gelegtem Mechanismus: der
        // Suchzeiger MINT_CURSOR wird von JEDEM Muenzen fortgeschrieben, also zieht ihn eine
        // geheilte niedrige Untergrenze wieder nach unten. Ab dort laeuft die Lueckensuche
        // erneut ueber Zahlen, die dieses Seitenleben bereits herausgegeben hat.
        const ctx = makeContext();
        ctx.D.npcs = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 1e15, name: 'Fremd' }];
        ctx.D._nextId = {};

        // 1. Echte Saettigung: die erste freie Luecke ist 5 — und bleibt unterwegs.
        const unterwegs = ctx.nextId('npcs');
        expect(unterwegs).toBe(5);

        // 2. Der DM loescht die 4 und die fremde Obergrenzen-Entitaet. Die Untergrenze ist
        //    jetzt 4 und vergebbar, der Waechter heilt — und zieht den Suchzeiger auf 5.
        ctx.D.npcs = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const geheilt = ctx.nextId('npcs');
        expect(geheilt).toBe(4);

        // 3. Ein Import bringt die Obergrenzen-Entitaet zurueck: wieder Saettigung, und die
        //    Lueckensuche startet genau auf der unterwegs befindlichen 5.
        ctx.D.npcs.push({ id: 1e15, name: 'Fremd erneut' });
        const weiter = [0, 1, 2, 3].map(() => ctx.nextId('npcs'));

        const alle = [unterwegs, geheilt, ...weiter];
        expect({ alle, verschieden: new Set(alle).size }).toEqual({
            alle,
            verschieden: alle.length
        });
        expect(alle.map(istGueltigeId)).toEqual(alle.map(id => ({ id, gueltig: true })));
        // Abgelegt bleibt jede ID genau einmal in der Sammlung.
        for (const id of alle) ctx.D.npcs.push({ id, name: `E${id}` });
        const ids = ctx.D.npcs.map(n => n.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('G2l: der Normalpfad gibt keine ID erneut aus, die schon unterwegs ist', () => {
        // Die Erinnerung MINT_ISSUED fragten bisher nur der Waechter und (seit G2j) die
        // Lueckensuche. Der NORMALPFAD fragte sie nie — er verliess sich darauf, dass der
        // Zaehler die Vergabe traegt. Genau das gilt aber nicht mehr, sobald der Waechter
        // dazwischen heilt und eine niedrige ID in den Zaehler schreibt: die Erinnerung an
        // die hohe, noch unterwegs befindliche ID ist dort dann weg.
        const ctx = makeContext();
        ctx.D.npcs = [
            { id: 1, name: 'Borin' },
            { id: 500, name: 'Mira' }
        ];
        // Gueltig UND vergebbar (die Praemisse von G2i) — also laeuft der Normalpfad.
        ctx.D._nextId = { npcs: 1e15 - 1 };

        // 1. Der Datensatz bleibt liegen (ungueltiger Eintrag, abgebrochenes Speichern),
        //    die ID ist damit herausgegeben, steht aber in KEINER Sammlung.
        const unterwegs = ctx.nextId('npcs');
        expect(unterwegs).toBe(1e15 - 1);
        expect(ctx.D.npcs.some(n => n.id === unterwegs)).toBe(false);

        // 2. Der Zaehler steht jetzt auf 1e15, also heilt der Waechter beim naechsten
        //    Muenzen auf die Untergrenze — und ueberschreibt den Zaehler mit 502.
        const dazwischen = vergebenUndAblegen(ctx, 1, 'Neu');
        expect(dazwischen).toEqual([501]);

        // 3. Ein Restore bringt die Nachbarschaft der Obergrenze zurueck. Die Untergrenze
        //    ist damit wieder genau die unterwegs befindliche ID — und der Normalpfad gab
        //    sie ein zweites Mal aus (gemessen davor: 1e15 - 1 erneut).
        ctx.D.npcs.push({ id: 1e15 - 2, name: 'Restore' });
        const danach = ctx.nextId('npcs');
        expect({ danach, erneut: danach === unterwegs }).toEqual({ danach: 502, erneut: false });
        expect(istGueltigeId(danach)).toEqual({ id: danach, gueltig: true });

        // Die R03-Fehlerklasse: beide IDs abgelegt, ein Loeschen trifft genau eine Entitaet.
        ctx.D.npcs.push({ id: unterwegs, name: 'Nachgereicht' }, { id: danach, name: 'Spaet' });
        const ids = ctx.D.npcs.map(n => n.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ctx.D.npcs.filter(e => e.id !== unterwegs).length).toBe(ids.length - 1);
    });

    test('G2m: die Lueckensuche gibt nicht auf, solange unterhalb IDs frei sind', () => {
        // Kehrseite derselben Naehe zur Obergrenze: die Suche startet auf dem Zeiger und
        // stieg nur AUFWAERTS. Ist der Zeiger belegt und oberhalb nichts mehr vergebbar,
        // brach sie mit Error('Keine freie ID') ab — obwohl unterhalb praktisch alle IDs
        // frei sind. Der Abbruch ist als letzte Rettung gedacht (lieber sichtbar als eine
        // doppelte ID), nicht als Antwort auf "der Zeiger passt gerade nicht".
        const ctx = makeContext();
        ctx.D.npcs = [{ id: 1e15 - 3, name: 'Fremd' }];
        ctx.D._nextId = { npcs: 1e15 - 2 };

        // Normalpfad; danach steht der Suchzeiger auf 1e15 - 1.
        const unterwegs = ctx.nextId('npcs');
        expect(unterwegs).toBe(1e15 - 2);

        // Ein Restore belegt genau diesen Zeiger und schiebt die Sammlung an die Grenze.
        ctx.D.npcs.push({ id: 1e15 - 1, name: 'Restore' });
        expect(ctx.maxEntityId(ctx.D.npcs) + 1).toBe(1e15);

        // Jetzt entscheidet die Lueckensuche — und muss unterhalb weitersuchen.
        const weiter = ctx.nextId('npcs');
        expect({ weiter, doppelt: weiter === unterwegs }).toEqual({ weiter: 1, doppelt: false });
        expect(istGueltigeId(weiter)).toEqual({ id: 1, gueltig: true });

        // Auch danach bleibt die Vergabe eindeutig, ohne Abbruch.
        const rest = [0, 1, 2].map(() => ctx.nextId('npcs'));
        const alle = [unterwegs, weiter, ...rest];
        expect({ alle, verschieden: new Set(alle).size }).toEqual({
            alle,
            verschieden: alle.length
        });
        expect(alle.map(istGueltigeId)).toEqual(alle.map(id => ({ id, gueltig: true })));
    });
});

describe('R03 — erschoepfende Gittersimulation der Vergabe (G3)', () => {
    // Warum ein Gitter und keine weiteren Einzelfaelle: an dieser Kante (Sammlung nahe
    // ENTITY_ID_MAX, Zaehler aus einer fremden Datei, Stapel ohne zwischenzeitliches
    // Ablegen) sind vier Anlaeufe nacheinander an einem Fall haengen geblieben, den der
    // jeweils vorige Anlauf nicht kannte. Ein Fall pro Befund pinnt immer nur den Befund.
    // Deshalb faehrt dieser Block die Vergabe ueber JEDE Kombination der Achsen ab,
    // deterministisch (kein Math.random, keine Zeit), und prueft nach JEDER einzelnen
    // Vergabe dieselben Invarianten.
    const MAX = 1e15;
    const KS = [0, 1, 2, 3, 4, 5, 6];
    const ZAEHLER_ARTEN = ['fehlt', 'maxPlus1', 'max', 'grenzeMinus1', 'grenze', 'unterMax'];
    const STAPELGROESSEN = [1, 2, 3, 4];
    const ABLEGE_ARTEN = ['sofort', 'amEnde'];

    /** Zaehlerwert der Achse "gespeicherter Zaehler". */
    const zaehlerFuer = (art, maxId) =>
        ({
            fehlt: undefined,
            maxPlus1: maxId + 1,
            max: maxId,
            grenzeMinus1: MAX - 1,
            grenze: MAX,
            unterMax: 2
        })[art];

    /** Alle gueltigen IDs einer Sammlung. */
    const idsVon = coll =>
        (Array.isArray(coll) ? coll : [])
            .map(e => e.id)
            .filter(n => Number.isSafeInteger(n) && n > 0 && n <= MAX);

    /**
     * Muenzt `anzahl` IDs in EINEM Seitenleben und prueft nach jeder Vergabe.
     * `ablegen` bildet die beiden realen Aufrufformen ab: 'sofort' = jeder CRUD-Pfad
     * (push direkt nach der Vergabe), 'amEnde' = der Merge-Zweig des Imports, der erst
     * ALLE IDs muenzt und die Datensaetze danach anhaengt.
     * @param ctx - vm-Kontext mit den echten Quellen
     * @param sammlung - Zugriff auf die aktuelle Sammlung (sie wird ersetzt, nicht mutiert)
     * @param vergeben - Set der in DIESEM Seitenleben schon herausgegebenen IDs
     * @param anzahl - Stapelgroesse
     * @param ablegen - 'sofort' | 'amEnde'
     * @param verstoesse - Sammelliste der Befunde
     * @param marke - Bezeichner des Stapels in den Befunden
     * @returns Die vergebenen IDs
     */
    function muenzeStapel(ctx, sammlung, vergeben, anzahl, ablegen, verstoesse, marke) {
        const ids = [];
        const wartend = [];
        for (let i = 0; i < anzahl; i++) {
            let id;
            try {
                id = ctx.nextId('npcs');
            } catch (e) {
                // Ein Abbruch ist nur zulaessig, wenn wirklich keine ID mehr frei ist —
                // hier sind die Sammlungen winzig, also ist er immer ein Befund.
                verstoesse.push({ marke, i, art: 'abbruch', meldung: e.message });
                continue;
            }
            const inSammlung = idsVon(sammlung());
            const hoechste = Math.max(0, ...inSammlung, ...vergeben);
            // Invariante 1: die ID ist selbst gueltig UND neu vergebbar.
            if (!(Number.isSafeInteger(id) && id > 0 && id < MAX)) {
                verstoesse.push({ marke, i, art: 'nicht-vergebbar', id: String(id) });
            }
            // Invariante 2: sie steht weder in der Sammlung, noch wurde sie in diesem
            // Seitenleben schon herausgegeben (Stapel ohne push, geloeschte Entitaet,
            // Restore — in all diesen Faellen traegt die Sammlung die Wahrheit nicht).
            if (inSammlung.includes(id)) {
                verstoesse.push({ marke, i, art: 'schon-in-sammlung', id: String(id) });
            }
            if (vergeben.has(id)) {
                verstoesse.push({ marke, i, art: 'doppelt-vergeben', id: String(id) });
            }
            // Wunscheigenschaft, geprueft NUR wo erreichbar: solange oberhalb der
            // Hoechstmarke noch etwas vergebbar ist, laeuft die Vergabe monoton. Sonst
            // bindet ein liegen gebliebener Verweis (quest.giverId auf einen geloeschten
            // NSC) still an eine neue Entitaet um. In der Saettigung gibt es oberhalb
            // nichts mehr — dort ist Lueckenvergabe die bewusste Notloesung.
            if (hoechste + 1 < MAX && !(id > hoechste)) {
                verstoesse.push({
                    marke,
                    i,
                    art: 'nicht-monoton',
                    id: String(id),
                    hoechste: String(hoechste)
                });
            }
            vergeben.add(id);
            ids.push(id);
            if (ablegen === 'sofort') sammlung().push({ id, name: `E${id}` });
            else wartend.push({ id, name: `E${id}` });
        }
        if (ablegen === 'amEnde') for (const e of wartend) sammlung().push(e);
        return ids;
    }

    test('G3a: 672 Gitterpunkte — Stapel, Loeschen, Speichern, zweites Seitenleben', () => {
        const verstoesse = [];
        let punkte = 0;
        for (const k of KS) {
            for (const zaehlerArt of ZAEHLER_ARTEN) {
                for (const groesse of STAPELGROESSEN) {
                    for (const ablegen of ABLEGE_ARTEN) {
                        for (const mitLoeschen of [false, true]) {
                            punkte++;
                            const maxId = MAX - k;
                            // ---- Seitenleben 1
                            const s1 = makeContext({ withMigration: true });
                            s1.D.npcs = [
                                { id: 1, name: 'Borin' },
                                { id: maxId, name: 'Fremd' }
                            ];
                            const zaehler = zaehlerFuer(zaehlerArt, maxId);
                            s1.D._nextId = zaehler === undefined ? {} : { npcs: zaehler };
                            const vergeben1 = new Set();
                            const sammlung1 = () => s1.D.npcs;
                            const a = muenzeStapel(
                                s1,
                                sammlung1,
                                vergeben1,
                                groesse,
                                ablegen,
                                verstoesse,
                                'A'
                            );
                            if (mitLoeschen && a.length) {
                                s1.D.npcs = s1.D.npcs.filter(e => e.id !== a[0]);
                            }
                            muenzeStapel(
                                s1,
                                sammlung1,
                                vergeben1,
                                groesse,
                                ablegen,
                                verstoesse,
                                'B'
                            );
                            // Die Schadensform selbst: ein `filter(e => e.id !== id)` darf
                            // nie mehr als eine Entitaet treffen.
                            const alle = s1.D.npcs.map(e => e.id);
                            const doppelt = [
                                ...new Set(alle.filter((x, i) => alle.indexOf(x) !== i))
                            ];
                            if (doppelt.length) {
                                verstoesse.push({
                                    marke: 'datei',
                                    art: 'sammlung-doppelt',
                                    id: doppelt.map(String)
                                });
                            }
                            // ---- Speichern und Laden ueber den ECHTEN Normalisierer
                            const datei = plain({ npcs: s1.D.npcs, _nextId: s1.D._nextId });
                            const s2 = makeContext({ withMigration: true });
                            const geladen = s2.normalizeCampaignData(datei);
                            if (!geladen.ok) {
                                verstoesse.push({
                                    marke: 'laden',
                                    art: 'laden-fehlgeschlagen',
                                    meldung: geladen.error
                                });
                                continue;
                            }
                            s2.D = geladen.data;
                            // ---- Seitenleben 2: frische Prozess-Erinnerung
                            muenzeStapel(
                                s2,
                                () => s2.D.npcs,
                                new Set(),
                                groesse,
                                ablegen,
                                verstoesse,
                                'C'
                            );
                        }
                    }
                }
            }
        }
        expect(punkte).toBe(
            KS.length * ZAEHLER_ARTEN.length * STAPELGROESSEN.length * ABLEGE_ARTEN.length * 2
        );
        expect(punkte).toBe(672);
        // Die ersten Befunde ausgeschrieben: die Fehlermeldung nennt Marke, Art und Wert.
        expect(verstoesse.slice(0, 12)).toEqual([]);
        expect({ punkte, verletzt: verstoesse.length }).toEqual({ punkte: 672, verletzt: 0 });
    });

    test('G3b: 336 Gitterpunkte — Undo/Restore mitten im Seitenleben', () => {
        // Zweite Achse derselben Frage: nicht die Sammlung waechst, sondern sie SPRINGT
        // zurueck. Ein Undo setzt Sammlung UND gespeicherten Zaehler auf einen aelteren
        // Stand, die Prozess-Erinnerung ueberlebt aber. Genau hier hebt die Untergrenze
        // wieder auf eine ID, die dieses Seitenleben schon herausgegeben hat — und die
        // Sammlung kann das nicht mehr sagen.
        const verstoesse = [];
        let punkte = 0;
        for (const k of KS) {
            for (const zaehlerArt of ZAEHLER_ARTEN) {
                for (const groesse of STAPELGROESSEN) {
                    for (const ablegen of ABLEGE_ARTEN) {
                        punkte++;
                        const maxId = MAX - k;
                        const ctx = makeContext();
                        ctx.D.npcs = [
                            { id: 1, name: 'Borin' },
                            { id: maxId, name: 'Fremd' }
                        ];
                        const zaehler = zaehlerFuer(zaehlerArt, maxId);
                        ctx.D._nextId = zaehler === undefined ? {} : { npcs: zaehler };
                        const stand = plain({ npcs: ctx.D.npcs, _nextId: ctx.D._nextId });
                        const vergeben = new Set();
                        const sammlung = () => ctx.D.npcs;
                        muenzeStapel(
                            ctx,
                            sammlung,
                            vergeben,
                            groesse,
                            ablegen,
                            verstoesse,
                            'vor-undo'
                        );
                        ctx.D.npcs = plain(stand.npcs);
                        ctx.D._nextId = plain(stand._nextId);
                        muenzeStapel(
                            ctx,
                            sammlung,
                            vergeben,
                            groesse,
                            ablegen,
                            verstoesse,
                            'nach-undo'
                        );
                    }
                }
            }
        }
        expect(punkte).toBe(
            KS.length * ZAEHLER_ARTEN.length * STAPELGROESSEN.length * ABLEGE_ARTEN.length
        );
        expect(punkte).toBe(336);
        expect(verstoesse.slice(0, 12)).toEqual([]);
        expect({ punkte, verletzt: verstoesse.length }).toEqual({ punkte: 336, verletzt: 0 });
    });
});
