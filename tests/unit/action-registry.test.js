/**
 * Action-Registry Tests — TECH-04 (Wave-0 RED-Phase)
 * Testet searchActions() Fuzzy-Suche des Command-Palette Aktions-Registers.
 * RED-Phase: Implementierung fehlt (Plan 02-05, Welle 2). Tests werden nach
 * Implementierung gruen (jest-Framework sammelt sie jetzt bereits ein).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================
// SETUP: action-registry.js in vm-Kontext laden (non-ESM-Muster)
// ============================================================

let searchActions;
let ACTION_REGISTRY;

beforeAll(() => {
    const context = {
        window: {
            APP_CONFIG: {
                VERSION: '2.7.0',
                STORAGE_KEY: 'dnd-tracker-data',
                DEBUG_MODE: false
            },
            showModal: jest.fn(),
            hideModal: jest.fn(),
            showToast: jest.fn(),
            switchView: jest.fn(),
            rollDice: jest.fn(),
            D: {
                characters: [],
                npcs: [],
                quests: []
            }
        },
        APP_CONFIG: {
            VERSION: '2.7.0',
            STORAGE_KEY: 'dnd-tracker-data',
            DEBUG_MODE: false
        },
        D: {
            characters: [],
            npcs: [],
            quests: []
        },
        console: console
    };
    vm.createContext(context);

    const filePath = path.join(__dirname, '../../features/command-palette/action-registry.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    searchActions = context.searchActions;
    ACTION_REGISTRY = context.ACTION_REGISTRY;
});

// ============================================================
// TESTS
// ============================================================

describe('searchActions — Fuzzy-Suche Aktions-Register (TECH-04)', () => {
    test('searchActions("Neuer NPC") liefert die new-npc-Aktion als Top-Treffer', () => {
        // RED-Phase: searchActions existiert noch nicht
        expect(typeof searchActions).toBe('function'); // Schlaegt fehl bis Plan 02-05 implementiert ist

        const results = searchActions('Neuer NPC');

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);

        // Der erste Treffer sollte die NPC-Erstell-Aktion sein
        const topResult = results[0];
        expect(topResult).toBeDefined();
        // Erwartet: id oder keywords deuten auf NPC-Erstellung hin
        const matchesNpc =
            (topResult.id && topResult.id.toLowerCase().includes('npc')) ||
            (topResult.keywords && topResult.keywords.some(k => k.toLowerCase().includes('npc'))) ||
            (topResult.label && topResult.label.toLowerCase().includes('npc'));
        expect(matchesNpc).toBe(true);
    });

    test('searchActions("8d6") findet die Wuerfel-Formel-Aktion', () => {
        // RED-Phase: searchActions existiert noch nicht
        expect(typeof searchActions).toBe('function'); // Schlaegt fehl bis Plan 02-05 implementiert ist

        const results = searchActions('8d6');

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);

        // Erwartet: mindestens ein Ergebnis das Wuerfelformeln matcht
        const hasDiceResult = results.some(r =>
            (r.id && r.id.toLowerCase().includes('dice')) ||
            (r.keywords && r.keywords.some(k => /\dd\d/.test(k))) ||
            (r.label && r.label.toLowerCase().includes('wuerfel'))
        );
        expect(hasDiceResult).toBe(true);
    });

    test('ACTION_REGISTRY ist definiert und enthaelt mindestens 5 Aktionen', () => {
        // RED-Phase: ACTION_REGISTRY existiert noch nicht
        expect(typeof ACTION_REGISTRY).not.toBe('undefined'); // Schlaegt fehl bis Plan 02-05 implementiert ist

        const entries = Array.isArray(ACTION_REGISTRY)
            ? ACTION_REGISTRY
            : Object.values(ACTION_REGISTRY);
        expect(entries.length).toBeGreaterThanOrEqual(5);
    });
});
