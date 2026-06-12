/**
 * Migration Tests - Smart-Strip-Migration 2.6.1 (STAB-02 / D-09)
 * TDD: Tests erst RED (Migration existiert noch nicht), dann GREEN nach Implementierung.
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// SETUP: migrateData und compareVersions aus version-migration.js laden
// ============================================================

// version-migration.js ist non-ESM und nutzt globale APP_CONFIG.
// setup.js hat APP_CONFIG bereits als global gesetzt (VERSION: '2.7.0-test').
// Wir laden die Datei direkt per eval(), analog zu stability.test.js.

let migrateData;
let compareVersions;

beforeAll(() => {
    // window.APP_CONFIG und window.ErrorHandler brauchen wir fuer version-migration.js
    global.window = global.window || {};
    global.window.APP_CONFIG = global.APP_CONFIG;
    global.window.ErrorHandler = { log: jest.fn() };
    // getSpellSlotsForClass wird in 2.4.0-Migration gebraucht
    global.window.getSpellSlotsForClass = jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0]);

    // Datei laden und Funktionen im globalen Scope definieren
    const filePath = path.join(__dirname, '../../systems/spellslots/version-migration.js');
    const code = fs.readFileSync(filePath, 'utf8');
    // eslint-disable-next-line no-eval
    eval(code);

    // Nach eval sind migrateData und compareVersions im globalen Scope
    migrateData = global.migrateData;
    compareVersions = global.compareVersions;
});

// ============================================================
// TESTS: Smart-Strip-Migration 2.6.1
// ============================================================

describe('Mindmap Smart-Strip Migration 2.6.1', () => {

    // Test 1: Leerer mindmap-Seed wird bei Migration still entfernt
    test('removes empty mindmap key on migration from 2.5.0', () => {
        // Vorbedingung: Gespeicherter Stand mit leerem mindmap-Seed
        const data = {
            characters: [],
            mindmap: { nodes: [], connections: [] },
            _version: '2.5.0'
        };

        const migrated = migrateData(data);

        // Erwartung: leerer Seed entfernt, kein mindmap-Key im Ergebnis
        expect(migrated.mindmap).toBeUndefined();
    });

    // Test 2: Echte Mindmap-Inhalte bleiben durch die Migration unveraendert (kein auto-strip)
    test('preserves real mindmap content (nodes present) on migration', () => {
        // Vorbedingung: Gespeicherter Stand mit echten Mindmap-Daten
        const data = {
            characters: [],
            mindmap: {
                nodes: [{ id: 1, label: 'Heldengruppe', type: 'player', x: 100, y: 100 }],
                connections: []
            },
            _version: '2.5.0'
        };

        const migrated = migrateData(data);

        // Erwartung: mindmap bleibt erhalten (Strip passiert nur im Import-Dialog)
        expect(migrated.mindmap).toBeDefined();
        expect(migrated.mindmap.nodes).toHaveLength(1);
        expect(migrated.mindmap.nodes[0].label).toBe('Heldengruppe');
    });

    // Test 3: Neues Kampagnen-Template enthaelt keinen mindmap-Key mehr
    test('new campaign template has no mindmap key in campaign-manager.js', () => {
        // Pruefe per Quellcode-Grep, dass der mindmap-Seed entfernt wurde
        const filePath = path.join(__dirname, '../../systems/campaign-manager/campaign-manager.js');
        const content = fs.readFileSync(filePath, 'utf8');

        // Der Seed-Template-Ausdruck darf nicht mehr im Quellcode vorkommen
        // Wir pruefen speziell auf das mindmap-Objekt im Seed-Kontext
        expect(content).not.toMatch(/mindmap:\s*\{\s*nodes:/);
    });
});
