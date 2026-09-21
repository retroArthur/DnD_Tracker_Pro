/**
 * Migration Tests - Smart-Strip-Migration 2.6.1 (STAB-02 / D-09)
 * TDD: Tests erst RED (Migration existiert noch nicht), dann GREEN nach Implementierung.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================
// SETUP: migrateData und compareVersions aus version-migration.js laden
// ============================================================

// version-migration.js ist non-ESM und nutzt globale APP_CONFIG.
// Wir fuehren den Code in einem vm-Kontext aus, der die globalen Variablen kennt.

let migrateData;
let compareVersions;

beforeAll(() => {
    // Kontext-Objekt fuer vm: enthaelt alle Globals, die version-migration.js erwartet
    const context = {
        window: {
            APP_CONFIG: global.APP_CONFIG,
            ErrorHandler: { log: jest.fn() },
            getSpellSlotsForClass: jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0])
        },
        APP_CONFIG: global.APP_CONFIG,
        console: console
    };
    vm.createContext(context);

    const filePath = path.join(__dirname, '../../systems/spellslots/version-migration.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    // Funktionen aus dem vm-Kontext extrahieren
    migrateData = context.migrateData;
    compareVersions = context.compareVersions;
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
        expect(content).not.toMatch(/mindmap:\s*\{\s*nodes:/);
    });
});

// ============================================================
// TESTS: Bestiary-Migration 3.0.0
// ============================================================

describe('Bestiary-Migration 3.0.0', () => {
    // Test 1: Migration legt leere bestiary[] und bestiaryFavorites[] an
    test('creates empty bestiary and bestiaryFavorites on legacy data without these fields', () => {
        const data = {
            characters: [],
            npcs: [],
            _version: '2.6.1'
        };

        const migrated = migrateData(data);

        expect(Array.isArray(migrated.bestiary)).toBe(true);
        expect(migrated.bestiary).toHaveLength(0);
        expect(Array.isArray(migrated.bestiaryFavorites)).toBe(true);
        expect(migrated.bestiaryFavorites).toHaveLength(0);
    });

    // Test 2: Migration ueberschreibt KEINE vorhandenen bestiary-Eintraege
    test('preserves existing bestiary entries on migration', () => {
        const existingCreature = { id: 1, name: 'Hausdrache', cr: '5', ac: 15, hp: 75 };
        const data = {
            characters: [],
            bestiary: [existingCreature],
            bestiaryFavorites: ['goblin', 'custom:1'],
            _version: '2.6.1'
        };

        const migrated = migrateData(data);

        // Vorhandene Eintraege bleiben unveraendert
        expect(migrated.bestiary).toHaveLength(1);
        expect(migrated.bestiary[0].name).toBe('Hausdrache');
        expect(migrated.bestiaryFavorites).toHaveLength(2);
        expect(migrated.bestiaryFavorites).toContain('goblin');
        expect(migrated.bestiaryFavorites).toContain('custom:1');
    });

    // Test 3: Migration-Version 3.0.0 ist im MIGRATIONS-Objekt registriert
    test('version 3.0.0 migration is registered in version-migration.js', () => {
        const filePath = path.join(__dirname, '../../systems/spellslots/version-migration.js');
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toMatch(/'3\.0\.0'/);
        expect(content).toMatch(/data\.bestiary/);
        expect(content).toMatch(/data\.bestiaryFavorites/);
    });
});

// ============================================================
// TESTS: Migration 2.3.0 nicht zerstoerend, robuste Versionsbehandlung
// (Code-Review 2026-09-21, Einheit U2 — R01-Skeptiker)
// ============================================================

describe('Migration 2.3.0 und Versionsvergleich (Code-Review 2026-09-21, U2)', () => {
    test('zweifache Migration eines versionslosen Stands behaelt Zustands-Objekte', () => {
        const conditions = [
            { type: 'poisoned', name: 'Vergiftet', addedAt: 1 },
            { type: 'custom', name: 'Verflucht', addedAt: 2 }
        ];
        const first = migrateData({
            characters: [{ id: 1, conditions: JSON.parse(JSON.stringify(conditions)) }]
        });
        // Erstsitzungs-Speicherstaende sind versionslos: zweiter load() migriert erneut
        delete first._version;
        const second = migrateData(first);
        expect(JSON.parse(JSON.stringify(second.characters[0].conditions))).toEqual(conditions);
    });

    test('numerisches _version (2.6) wirft nicht und gilt als fehlend', () => {
        let migrated;
        expect(() => {
            migrated = migrateData({ _version: 2.6, characters: [] });
        }).not.toThrow();
        expect(migrated._version).toBe(global.APP_CONFIG.VERSION);
        // behandelt wie 2.2.0: 3.0.0 hat bestiary angelegt
        expect(Array.isArray(migrated.bestiary)).toBe(true);
        expect(() => compareVersions(2.6, '2.6.1')).not.toThrow();
        expect(() => compareVersions(undefined, '2.6.1')).not.toThrow();
    });

    test('Migrationsschluessel laufen numerisch sortiert (10.0.0 nach 5.0.0)', () => {
        const order = [];
        const ctx = {
            window: {
                APP_CONFIG: global.APP_CONFIG,
                ErrorHandler: { log: jest.fn() },
                getSpellSlotsForClass: jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0])
            },
            APP_CONFIG: global.APP_CONFIG
        };
        vm.createContext(ctx);
        vm.runInContext(
            fs.readFileSync(
                path.join(__dirname, '../../systems/spellslots/version-migration.js'),
                'utf8'
            ),
            ctx
        );
        const migrations = ctx.window.MIGRATIONS;
        for (const key of Object.keys(migrations)) {
            const original = migrations[key];
            migrations[key] = data => {
                order.push(key);
                return original(data);
            };
        }
        migrations['10.0.0'] = data => {
            order.push('10.0.0');
            return data;
        };
        ctx.migrateData({ _version: '2.2.0', characters: [] });
        expect(order[order.length - 1]).toBe('10.0.0');
        expect(order.indexOf('2.3.0')).toBe(0);
    });
});
