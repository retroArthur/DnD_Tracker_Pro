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
 * @param {{ withHelpers?: boolean }} opts - withHelpers: zusaetzlich render/helpers.js
 *   (ENTITY_SCHEMAS + validateDataIntegrity) laden
 */
function makeContext({ withHelpers = false } = {}) {
    const ctx = { setTimeout, clearTimeout };
    ctx.window = ctx;
    ctx.document = {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
    };
    ctx.ErrorHandler = { log: jest.fn() };
    ctx.debugLogAdd = jest.fn();
    vm.createContext(ctx);
    const files = withHelpers ? [...BASE_FILES, 'render/helpers.js'] : BASE_FILES;
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
