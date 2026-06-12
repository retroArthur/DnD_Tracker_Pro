/**
 * Action-Registry Tests — TECH-04 (Wave-0 RED-Phase, jetzt GREEN)
 * Testet searchActions() Fuzzy-Suche des Command-Palette Aktions-Registers.
 * GREEN-Phase: Implementierung aus Plan 02-05, Welle 2.
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
            quickRoll: jest.fn(),
            undo: jest.fn(),
            redo: jest.fn(),
            toggleCollapse: jest.fn(),
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

    // fuzzyMatch aus global-search.js in den Kontext laden (Abhaengigkeit von action-registry.js)
    const globalSearchPath = path.join(__dirname, '../../systems/search/global-search.js');
    const globalSearchCode = fs.readFileSync(globalSearchPath, 'utf8');
    // Nur die fuzzyMatch-Funktion extrahieren und in den Kontext einfuegen
    // (global-search.js haengt von DOM-APIs ab — wir laden nur den Anfang bis zur ersten DOM-Nutzung)
    try {
        // fuzzyMatch direkt im Kontext definieren (analog zur Browser-Umgebung)
        vm.runInContext(`
            function fuzzyMatch(text, query) {
                if (!text || !query) return { match: false, score: 0 };
                text = text.toLowerCase();
                query = query.toLowerCase();
                if (text.includes(query)) {
                    return { match: true, score: 100 - text.indexOf(query) };
                }
                var textIndex = 0;
                var queryIndex = 0;
                var score = 0;
                var consecutiveBonus = 0;
                while (textIndex < text.length && queryIndex < query.length) {
                    if (text[textIndex] === query[queryIndex]) {
                        score += 10 + consecutiveBonus;
                        consecutiveBonus += 5;
                        queryIndex++;
                    } else {
                        consecutiveBonus = 0;
                    }
                    textIndex++;
                }
                if (queryIndex === query.length) {
                    if (text.startsWith(query[0])) score += 15;
                    return { match: true, score: score };
                }
                return { match: false, score: 0 };
            }
        `, context);
    } catch (e) {
        // Ignoriere Fehler — fuzzyMatch wird direkt definiert
    }

    const filePath = path.join(__dirname, '../../features/command-palette/action-registry.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    // In der Browser-Umgebung sind window.X === X (globale Variablen).
    // Im VM-Kontext setzt window.X = ... den Wert auf context.window.X,
    // nicht auf context.X. Daher aus context.window lesen.
    searchActions = context.window.searchActions || context.searchActions;
    ACTION_REGISTRY = context.window.ACTION_REGISTRY || context.ACTION_REGISTRY;
});

// ============================================================
// TESTS
// ============================================================

describe('searchActions — Fuzzy-Suche Aktions-Register (TECH-04)', () => {
    test('searchActions("Neuer NPC") liefert die new-npc-Aktion als Top-Treffer', () => {
        expect(typeof searchActions).toBe('function');

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
        expect(typeof searchActions).toBe('function');

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
        expect(typeof ACTION_REGISTRY).not.toBe('undefined');

        const entries = Array.isArray(ACTION_REGISTRY)
            ? ACTION_REGISTRY
            : Object.values(ACTION_REGISTRY);
        expect(entries.length).toBeGreaterThanOrEqual(5);
    });
});
