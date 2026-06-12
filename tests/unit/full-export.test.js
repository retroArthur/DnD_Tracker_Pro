/**
 * Full-Export Tests — TECH-02 (Wave-0 RED-Phase)
 * Testet buildFullExport() und die Export-Schema-Regeln.
 * RED-Phase: Implementierung fehlt (Plan 02-03, Welle 2). Tests werden nach
 * Implementierung gruen (jest-Framework sammelt sie jetzt bereits ein).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================
// SETUP: full-export.js in vm-Kontext laden (non-ESM-Muster)
// ============================================================

let buildFullExport;

beforeAll(() => {
    const context = {
        window: {
            APP_CONFIG: {
                VERSION: '2.7.0',
                STORAGE_KEY: 'dnd-tracker-data',
                DEBUG_MODE: false
            },
            getCampaignIndex: jest.fn(() => ({
                campaigns: [{ key: 'dnd-tracker-data', name: 'Standard-Kampagne' }],
                active: 'dnd-tracker-data'
            })),
            showToast: jest.fn(),
            ErrorHandler: { log: jest.fn() }
        },
        APP_CONFIG: {
            VERSION: '2.7.0',
            STORAGE_KEY: 'dnd-tracker-data',
            DEBUG_MODE: false
        },
        D: {
            characters: [{ id: 1, name: 'Tester', class: 'Krieger' }],
            npcs: [{ id: 2, name: 'Gastgeber', role: 'NPC' }],
            locations: [],
            quests: [],
            encounters: [],
            loot: [],
            wiki: [],
            sessionNotes: [],
            randomTables: [],
            settings: { theme: 'dark' },
            diceFavorites: [{ id: 1, name: 'Angriff', formula: '1d20+5' }],
            dmScreenProfiles: [{ id: 'standard', name: 'Standard', widgets: [] }],
            spells: [
                { id: 100, name: 'Feuerball', source: 'srd' },
                { id: 101, name: 'Heilen', source: 'srd' }
            ]
        },
        StorageAPI: {
            getJSON: jest.fn(() => null),
            setJSON: jest.fn(() => ({ success: true })),
            has: jest.fn(() => false)
        },
        console: console
    };
    vm.createContext(context);

    const filePath = path.join(__dirname, '../../systems/migration/full-export.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    // Funktion aus dem vm-Kontext extrahieren
    buildFullExport = context.buildFullExport;
});

// ============================================================
// TESTS
// ============================================================

describe('buildFullExport — Voll-Export-Format (TECH-02)', () => {
    test('buildFullExport enthaelt alle Kampagnen + Settings + diceFavorites + dmScreenProfiles', () => {
        // RED-Phase: buildFullExport existiert noch nicht — expect schlaegt fehl und dokumentiert den Grund
        expect(typeof buildFullExport).toBe('function'); // Schlaegt fehl bis Plan 02-03 implementiert ist

        const result = buildFullExport();

        expect(result).toBeDefined();
        // Export muss Metadaten enthalten
        expect(result._exportType).toBe('full-v1');
        // Kampagnendaten muss vorhanden sein
        expect(result.campaigns).toBeDefined();
        expect(Array.isArray(result.campaigns) || typeof result.campaigns === 'object').toBe(true);
        // Settings-Daten muss enthalten sein
        expect(result.settings).toBeDefined();
        // diceFavorites muss enthalten sein
        expect(result.diceFavorites).toBeDefined();
        // dmScreenProfiles muss enthalten sein
        expect(result.dmScreenProfiles).toBeDefined();
    });

    test('Voll-Export enthaelt KEINE SRD-Spells (D.spells nicht im Output)', () => {
        // RED-Phase: buildFullExport existiert noch nicht
        expect(typeof buildFullExport).toBe('function'); // Schlaegt fehl bis Plan 02-03 implementiert ist

        const result = buildFullExport();

        // SRD-Spells duerfen niemals exportiert werden (Lizenz + Groesse)
        expect(result.spells).toBeUndefined();
        // Auch tief verschachtelt nicht
        const resultStr = JSON.stringify(result);
        expect(resultStr).not.toContain('"source":"srd"');
    });
});
