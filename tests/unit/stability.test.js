/**
 * Stability Tests - Data Persistence, Error Handling, UI Robustness
 * TDD: These tests should FAIL initially
 */

// ============================================================
// 1. DATA PERSISTENCE TESTS
// ============================================================

describe('Data Persistence', () => {
    beforeEach(() => {
        localStorage.clear();
        // Reset D to clean state
        global.D = {
            characters: [],
            npcs: [],
            locations: [],
            quests: [],
            encounters: [],
            loot: [],
            spells: [],
            wiki: [],
            links: [],
            shops: [],
            mindmap: { nodes: [], connections: [] },
            initiative: { combatants: [], currentTurn: 0, round: 1 },
            calendar: { day: 1, month: 0, year: 1492, events: [] },
            sessionNotes: [],
            quickNotes: '',
            tags: [],
            filters: [],
            monsterFavorites: [],
            settings: { theme: 'dark', lastView: 'dashboard' },
            dmScreenLayout: null,
            dmScreenNotes: '',
            _nextId: {}
        };
    });

    describe('save() function', () => {
        test('should save D object to localStorage', () => {
            D.characters.push({ id: 1, name: 'Test Hero', level: 5 });

            save();

            const stored = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEY));
            expect(stored.characters).toHaveLength(1);
            expect(stored.characters[0].name).toBe('Test Hero');
        });

        test('should preserve all data properties after save/load cycle', () => {
            const testData = {
                characters: [{ id: 1, name: 'Hero', level: 10, hp: 50, maxHp: 50 }],
                npcs: [{ id: 2, name: 'Villain', faction: 'Evil' }],
                locations: [{ id: 3, name: 'Dungeon', type: 'underground' }],
                quests: [{ id: 4, title: 'Save the World', status: 'active' }],
                monsterFavorites: [{ id: 5, name: 'Goblin Pack', monsters: [{ cr: '1/4', count: 4 }] }]
            };

            Object.assign(D, testData);
            save();

            // Simulate page reload
            const loaded = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEY));

            expect(loaded.characters).toEqual(testData.characters);
            expect(loaded.npcs).toEqual(testData.npcs);
            expect(loaded.locations).toEqual(testData.locations);
            expect(loaded.quests).toEqual(testData.quests);
            expect(loaded.monsterFavorites).toEqual(testData.monsterFavorites);
        });

        test('should handle special characters in data', () => {
            D.characters.push({
                id: 1,
                name: 'Test <script>alert("xss")</script>',
                notes: 'Notes with "quotes" and \'apostrophes\' and emoji: 🎲'
            });

            save();

            const stored = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEY));
            expect(stored.characters[0].name).toContain('<script>');
            expect(stored.characters[0].notes).toContain('🎲');
        });

        test('should handle very large data sets without corruption', () => {
            // Create 100 characters
            for (let i = 0; i < 100; i++) {
                D.characters.push({
                    id: i,
                    name: `Character ${i}`,
                    level: Math.floor(Math.random() * 20) + 1,
                    notes: 'A'.repeat(1000) // 1KB of notes each
                });
            }

            save();

            const stored = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEY));
            expect(stored.characters).toHaveLength(100);
            expect(stored.characters[99].name).toBe('Character 99');
        });
    });

    describe('load() function', () => {
        test('should restore D object from localStorage', () => {
            const testData = {
                characters: [{ id: 1, name: 'Loaded Hero' }],
                settings: { theme: 'light' }
            };
            localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(testData));

            load();

            expect(D.characters[0].name).toBe('Loaded Hero');
            expect(D.settings.theme).toBe('light');
        });

        test('should handle corrupted JSON gracefully', () => {
            localStorage.setItem(APP_CONFIG.STORAGE_KEY, '{invalid json');

            expect(() => load()).not.toThrow();
            // Should keep default structure
            expect(Array.isArray(D.characters)).toBe(true);
        });

        test('should handle missing properties with defaults', () => {
            const partialData = { characters: [{ id: 1, name: 'Hero' }] };
            localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(partialData));

            load();

            expect(D.characters).toHaveLength(1);
            expect(Array.isArray(D.npcs)).toBe(true);
            expect(Array.isArray(D.locations)).toBe(true);
            expect(D.initiative).toBeDefined();
        });

        test('should migrate old data format to new format', () => {
            // Old format without monsterFavorites
            const oldData = {
                characters: [{ id: 1, name: 'Old Hero' }],
                settings: { theme: 'dark' }
                // Note: no monsterFavorites property
            };
            localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(oldData));

            load();

            expect(D.characters[0].name).toBe('Old Hero');
            expect(Array.isArray(D.monsterFavorites)).toBe(true);
        });
    });

    describe('saveImmediate() function', () => {
        test('should save immediately without debounce', () => {
            D.characters.push({ id: 1, name: 'Immediate Save' });

            saveImmediate();

            const stored = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEY));
            expect(stored.characters[0].name).toBe('Immediate Save');
        });
    });
});

// ============================================================
// 2. ERROR HANDLING TESTS
// ============================================================

describe('Error Handling', () => {
    beforeEach(() => {
        // Reset D
        global.D = {
            characters: [],
            npcs: [],
            locations: [],
            quests: [],
            encounters: [],
            initiative: { combatants: [], currentTurn: 0, round: 1 },
            monsterFavorites: [],
            settings: {}
        };
    });

    describe('Entity operations with invalid IDs', () => {
        test('deleteCharacter should handle non-existent ID gracefully', () => {
            D.characters = [{ id: 1, name: 'Hero' }];

            expect(() => deleteCharacter(999)).not.toThrow();
            expect(D.characters).toHaveLength(1);
        });

        test('deleteNPC should handle non-existent ID gracefully', () => {
            D.npcs = [{ id: 1, name: 'NPC' }];

            expect(() => deleteNPC(999)).not.toThrow();
            expect(D.npcs).toHaveLength(1);
        });

        test('deleteLocation should handle non-existent ID gracefully', () => {
            D.locations = [{ id: 1, name: 'Location' }];

            expect(() => deleteLocation(999)).not.toThrow();
            expect(D.locations).toHaveLength(1);
        });

        test('deleteQuest should handle non-existent ID gracefully', () => {
            D.quests = [{ id: 1, title: 'Quest' }];

            expect(() => deleteQuest(999)).not.toThrow();
            expect(D.quests).toHaveLength(1);
        });
    });

    describe('Calculator with invalid inputs', () => {
        test('CR_TO_XP should handle invalid CR values', () => {
            expect(CR_TO_XP['invalid']).toBeUndefined();
            expect(CR_TO_XP[null]).toBeUndefined();
            expect(CR_TO_XP[-1]).toBeUndefined();
        });

        test('calculatePartyThresholds should handle empty party', () => {
            const result = calculatePartyThresholds();

            expect(result.totalPCs).toBe(0);
            expect(result.easy).toBe(0);
            expect(result.medium).toBe(0);
        });

        test('calculateMonsterXP should handle empty monster list', () => {
            const result = calculateMonsterXP();

            expect(result.baseXP).toBe(0);
            expect(result.finalXP).toBe(0);
        });

        test('getDifficulty should handle zero XP', () => {
            const thresholds = { easy: 100, medium: 200, hard: 300, deadly: 400 };
            const result = getDifficulty(0, thresholds);

            expect(result.level).toBe('trivial');
        });
    });

    describe('Initiative with edge cases', () => {
        test('nextTurn should handle empty combatant list', () => {
            D.initiative.combatants = [];
            D.initiative.currentTurn = 0;

            expect(() => nextTurn()).not.toThrow();
        });

        test('prevTurn should handle empty combatant list', () => {
            D.initiative.combatants = [];
            D.initiative.currentTurn = 0;

            expect(() => prevTurn()).not.toThrow();
        });

        test('removeCombatant should handle invalid ID', () => {
            D.initiative.combatants = [{ id: 1, name: 'Fighter' }];

            expect(() => removeCombatant(999)).not.toThrow();
            expect(D.initiative.combatants).toHaveLength(1);
        });
    });

    describe('Monster Favorites with edge cases', () => {
        test('loadMonsterFavorite should handle non-existent ID', () => {
            D.monsterFavorites = [{ id: 1, name: 'Goblins', monsters: [] }];

            expect(() => loadMonsterFavorite(999)).not.toThrow();
        });

        test('deleteMonsterFavorite should handle non-existent ID', () => {
            D.monsterFavorites = [{ id: 1, name: 'Goblins', monsters: [] }];

            expect(() => deleteMonsterFavorite(999)).not.toThrow();
            expect(D.monsterFavorites).toHaveLength(1);
        });

        test('saveMonsterFavorite should handle empty calculator', () => {
            // Mock prompt to return a name
            global.prompt = jest.fn(() => 'Test Favorite');

            // With empty calculatorMonsters, should show toast and return
            expect(() => saveMonsterFavorite()).not.toThrow();
        });
    });
});

// ============================================================
// 3. UI ROBUSTNESS TESTS
// ============================================================

describe('UI Robustness', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        global.D = {
            characters: [],
            npcs: [],
            locations: [],
            quests: [],
            encounters: [],
            randomTables: [],
            initiative: { combatants: [], currentTurn: 0, round: 1 },
            settings: {}
        };
    });

    describe('Render functions with missing DOM elements', () => {
        test('renderParty should handle missing container', () => {
            // No #char-list in DOM
            expect(() => renderParty()).not.toThrow();
        });

        test('renderNPCList should handle missing container', () => {
            // No #npc-list in DOM
            expect(() => renderNPCList()).not.toThrow();
        });

        test('renderLocations should handle missing container', () => {
            // No #loc-list in DOM
            expect(() => renderLocations()).not.toThrow();
        });

        test('renderRandomTables should handle missing container', () => {
            // No #random-tables-list in DOM
            expect(() => renderRandomTables()).not.toThrow();
        });

        test('renderInitiative should handle missing container', () => {
            // No #initiative-list in DOM
            expect(() => renderInitiative()).not.toThrow();
        });

        test('renderDMScreen should handle missing container', () => {
            expect(() => {
                if (typeof renderDMScreen === 'function') {
                    renderDMScreen();
                }
            }).not.toThrow();
        });
    });

    describe('Input validation', () => {
        test('should handle null/undefined values in esc()', () => {
            expect(esc(null)).toBe('');
            expect(esc(undefined)).toBe('');
            expect(esc('')).toBe('');
            expect(esc(0)).toBe('0');
        });

        test('should escape XSS attempts', () => {
            const xss = '<script>alert("xss")</script>';
            const escaped = esc(xss);

            expect(escaped).not.toContain('<script>');
            expect(escaped).toContain('&lt;script&gt;');
        });

        test('should handle objects passed to esc()', () => {
            expect(() => esc({})).not.toThrow();
            expect(() => esc([])).not.toThrow();
        });
    });

    describe('Modal functions with missing elements', () => {
        test('showModal should handle non-existent modal ID', () => {
            expect(() => showModal('non-existent-modal')).not.toThrow();
        });

        test('hideModal should handle non-existent modal ID', () => {
            expect(() => hideModal('non-existent-modal')).not.toThrow();
        });

        test('showToast should work without toast container', () => {
            expect(() => showToast('Test message')).not.toThrow();
        });
    });

    describe('Calculator modal rendering', () => {
        test('renderCalculatorModal should not throw without DOM', () => {
            expect(() => {
                if (typeof renderCalculatorModal === 'function') {
                    renderCalculatorModal();
                }
            }).not.toThrow();
        });

        test('updateBudgetDisplay should handle missing elements', () => {
            expect(() => {
                if (typeof updateBudgetDisplay === 'function') {
                    updateBudgetDisplay();
                }
            }).not.toThrow();
        });

        test('updateMonsterPreview should handle missing preview div', () => {
            expect(() => {
                if (typeof updateMonsterPreview === 'function') {
                    updateMonsterPreview();
                }
            }).not.toThrow();
        });
    });

    describe('Event delegation with invalid actions', () => {
        test('EventDelegation should handle unregistered actions', () => {
            expect(() => {
                if (typeof EventDelegation !== 'undefined') {
                    // Try to trigger a non-existent action
                    const fakeEvent = { target: { dataset: { action: 'non-existent-action' } } };
                    EventDelegation.handle(fakeEvent);
                }
            }).not.toThrow();
        });
    });
});

// ============================================================
// 4. DATA INTEGRITY TESTS
// ============================================================

describe('Data Integrity', () => {
    beforeEach(() => {
        global.D = {
            characters: [],
            npcs: [],
            locations: [],
            initiative: { combatants: [], currentTurn: 0, round: 1 }
        };
    });

    describe('Undo/Redo system', () => {
        test('saveUndoState should capture current state', () => {
            D.characters.push({ id: 1, name: 'Before' });
            saveUndoState();

            D.characters[0].name = 'After';
            undo();

            expect(D.characters[0].name).toBe('Before');
        });

        test('undo should handle empty undo stack', () => {
            expect(() => undo()).not.toThrow();
        });

        test('redo should handle empty redo stack', () => {
            expect(() => redo()).not.toThrow();
        });
    });

    describe('ID generation', () => {
        test('genId should generate unique IDs', () => {
            const id1 = genId('test');
            const id2 = genId('test');
            const id3 = genId('test');

            expect(id1).not.toBe(id2);
            expect(id2).not.toBe(id3);
        });

        test('genId should handle different prefixes', () => {
            const charId = genId('char');
            const npcId = genId('npc');

            expect(charId).not.toBe(npcId);
        });
    });

    describe('Circular reference handling', () => {
        test('save should handle objects with circular references', () => {
            const char = { id: 1, name: 'Circular' };
            char.self = char; // Circular reference

            D.characters.push(char);

            // Should either handle gracefully or skip circular refs
            expect(() => save()).not.toThrow();
        });
    });
});
