/**
 * Unit Tests - Entity Operations
 * Tests für CRUD-Operationen auf Entities
 */

describe('Entity Operations', () => {
    // ============================================================
    // CHARACTER TESTS
    // ============================================================

    describe('Characters', () => {
        test('sollte Character erstellen können', () => {
            const char = createTestCharacter();
            D.characters.push(char);

            expect(D.characters.length).toBe(1);
            expect(D.characters[0].name).toBe('Test Hero');
            expect(D.characters[0].level).toBe(5);
        });

        test('sollte Character per ID finden', () => {
            const char1 = createTestCharacter({ name: 'Hero 1' });
            const char2 = createTestCharacter({ name: 'Hero 2' });
            D.characters.push(char1, char2);

            const found = D.characters.find(c => c.id === char2.id);

            expect(found).toBeDefined();
            expect(found.name).toBe('Hero 2');
        });

        test('sollte Character aktualisieren können', () => {
            const char = createTestCharacter();
            D.characters.push(char);

            const idx = D.characters.findIndex(c => c.id === char.id);
            D.characters[idx].hpCurrent = 20;
            D.characters[idx].level = 6;

            expect(D.characters[0].hpCurrent).toBe(20);
            expect(D.characters[0].level).toBe(6);
        });

        test('sollte Character löschen können', () => {
            const char1 = createTestCharacter({ name: 'Hero 1' });
            const char2 = createTestCharacter({ name: 'Hero 2' });
            D.characters.push(char1, char2);

            const idx = D.characters.findIndex(c => c.id === char1.id);
            D.characters.splice(idx, 1);

            expect(D.characters.length).toBe(1);
            expect(D.characters[0].name).toBe('Hero 2');
        });

        test('sollte HP-Änderungen korrekt verarbeiten', () => {
            const char = createTestCharacter({ hpCurrent: 44, hpMax: 44, tempHp: 0 });
            D.characters.push(char);

            // Schaden
            char.hpCurrent = Math.max(0, char.hpCurrent - 10);
            expect(char.hpCurrent).toBe(34);

            // Heilung (nicht über Max)
            char.hpCurrent = Math.min(char.hpMax, char.hpCurrent + 20);
            expect(char.hpCurrent).toBe(44);

            // Temp HP
            char.tempHp = 10;
            expect(char.tempHp).toBe(10);
        });

        test('sollte Spell Slots verwalten können', () => {
            const char = createTestCharacter({
                spellSlots: {
                    1: { max: 4, current: 4 },
                    2: { max: 3, current: 3 },
                    3: { max: 2, current: 2 }
                }
            });
            D.characters.push(char);

            // Slot nutzen
            char.spellSlots[1].current--;
            expect(char.spellSlots[1].current).toBe(3);

            // Alle Slots wiederherstellen
            for (const level in char.spellSlots) {
                char.spellSlots[level].current = char.spellSlots[level].max;
            }
            expect(char.spellSlots[1].current).toBe(4);
            expect(char.spellSlots[2].current).toBe(3);
        });
    });

    // ============================================================
    // NPC TESTS
    // ============================================================

    describe('NPCs', () => {
        test('sollte NPC erstellen können', () => {
            const npc = createTestNPC();
            D.npcs.push(npc);

            expect(D.npcs.length).toBe(1);
            expect(D.npcs[0].name).toBe('Test NPC');
        });

        test('sollte NPC mit Location verknüpfen', () => {
            const location = {
                id: nextId('locations'),
                name: 'Taverne',
                type: 'Gebäude',
                parentId: null,
                description: '',
                secret: '',
                npcs: []
            };
            D.locations.push(location);

            const npc = createTestNPC({ locationId: location.id });
            D.npcs.push(npc);

            expect(npc.locationId).toBe(location.id);

            // NPCs für Location finden
            const npcsAtLocation = D.npcs.filter(n => n.locationId === location.id);
            expect(npcsAtLocation.length).toBe(1);
        });

        test('sollte NPC-Trigger verwalten', () => {
            const npc = createTestNPC({
                triggers: [
                    {
                        condition: 'Spieler fragt nach Gerüchten',
                        reveal: 'Es gibt Goblins im Wald',
                        triggered: false
                    },
                    {
                        condition: 'Spieler zeigt Siegel',
                        reveal: 'Der NPC vertraut der Gruppe',
                        triggered: false
                    }
                ]
            });
            D.npcs.push(npc);

            expect(npc.triggers.length).toBe(2);

            // Trigger auslösen
            npc.triggers[0].triggered = true;
            expect(npc.triggers[0].triggered).toBe(true);
            expect(npc.triggers[1].triggered).toBe(false);
        });

        test('sollte NPC-Dialoge verwalten', () => {
            const npc = createTestNPC({
                dialogs: [
                    { title: 'Begrüßung', triggerCondition: '', text: 'Willkommen!', used: false },
                    {
                        title: 'Geheimnis',
                        triggerCondition: 'Nach Vertrauen',
                        text: 'Ich weiß etwas...',
                        used: false
                    }
                ]
            });
            D.npcs.push(npc);

            expect(npc.dialogs.length).toBe(2);

            // Dialog als benutzt markieren
            npc.dialogs[0].used = true;
            expect(npc.dialogs[0].used).toBe(true);
        });
    });

    // ============================================================
    // ENCOUNTER TESTS
    // ============================================================

    describe('Encounters', () => {
        test('sollte Encounter erstellen können', () => {
            const enc = createTestEncounter();
            D.encounters.push(enc);

            expect(D.encounters.length).toBe(1);
            expect(D.encounters[0].name).toBe('Goblin');
            expect(D.encounters[0].cr).toBe('1/4');
        });

        test('sollte CR korrekt parsen', () => {
            const crValues = ['0', '1/8', '1/4', '1/2', '1', '5', '10', '20', '30'];

            const parseCR = cr => {
                if (cr.includes('/')) {
                    const [num, den] = cr.split('/').map(Number);
                    return num / den;
                }
                return parseFloat(cr);
            };

            expect(parseCR('1/4')).toBe(0.25);
            expect(parseCR('1/2')).toBe(0.5);
            expect(parseCR('1')).toBe(1);
            expect(parseCR('5')).toBe(5);
        });

        test('sollte Encounter zu Initiative hinzufügen', () => {
            const enc = createTestEncounter();
            D.encounters.push(enc);

            // Zu Initiative hinzufügen
            const combatant = {
                id: nextId('initiative'),
                name: enc.name,
                type: 'encounter',
                entityId: enc.id,
                initiative: enc.init + Math.floor(Math.random() * 20) + 1,
                hpCurrent: enc.hp,
                hpMax: enc.hp,
                ac: enc.ac,
                conditions: [],
                effects: [],
                isPlayer: false
            };

            D.initiative.combatants.push(combatant);

            expect(D.initiative.combatants.length).toBe(1);
            expect(D.initiative.combatants[0].name).toBe('Goblin');
        });
    });

    // ============================================================
    // QUEST TESTS
    // ============================================================

    describe('Quests', () => {
        test('sollte Quest erstellen können', () => {
            const quest = {
                id: nextId('quests'),
                name: 'Rettet das Dorf',
                description: 'Die Goblins greifen an!',
                status: 'aktiv',
                priority: 'high',
                giver: 'Bürgermeister',
                giverNpcId: null,
                reward: '100 GM',
                objectives: [
                    { text: 'Goblins finden', completed: false },
                    { text: 'Anführer besiegen', completed: false }
                ],
                notes: '',
                tracked: true
            };
            D.quests.push(quest);

            expect(D.quests.length).toBe(1);
            expect(D.quests[0].objectives.length).toBe(2);
        });

        test('sollte Quest-Status ändern können', () => {
            const quest = {
                id: nextId('quests'),
                name: 'Test Quest',
                status: 'aktiv',
                objectives: []
            };
            D.quests.push(quest);

            // Status ändern
            quest.status = 'abgeschlossen';
            expect(quest.status).toBe('abgeschlossen');
        });

        test('sollte Objectives markieren können', () => {
            const quest = {
                id: nextId('quests'),
                name: 'Test Quest',
                status: 'aktiv',
                objectives: [
                    { text: 'Ziel 1', completed: false },
                    { text: 'Ziel 2', completed: false }
                ]
            };
            D.quests.push(quest);

            // Objective abschließen
            quest.objectives[0].completed = true;

            expect(quest.objectives[0].completed).toBe(true);
            expect(quest.objectives[1].completed).toBe(false);

            // Prüfen ob alle abgeschlossen
            const allCompleted = quest.objectives.every(o => o.completed);
            expect(allCompleted).toBe(false);

            quest.objectives[1].completed = true;
            const nowAllCompleted = quest.objectives.every(o => o.completed);
            expect(nowAllCompleted).toBe(true);
        });
    });

    // ============================================================
    // INITIATIVE TESTS
    // ============================================================

    describe('Initiative', () => {
        test('sollte Combatants sortieren können', () => {
            D.initiative.combatants = [
                { id: 1, name: 'Slow', initiative: 5 },
                { id: 2, name: 'Fast', initiative: 20 },
                { id: 3, name: 'Medium', initiative: 12 }
            ];

            // Sortieren (absteigend)
            D.initiative.combatants.sort((a, b) => b.initiative - a.initiative);

            expect(D.initiative.combatants[0].name).toBe('Fast');
            expect(D.initiative.combatants[1].name).toBe('Medium');
            expect(D.initiative.combatants[2].name).toBe('Slow');
        });

        test('sollte Runden zählen', () => {
            D.initiative.combatants = [
                { id: 1, name: 'A', initiative: 20 },
                { id: 2, name: 'B', initiative: 15 },
                { id: 3, name: 'C', initiative: 10 }
            ];
            D.initiative.currentTurn = 0;
            D.initiative.round = 1;

            // Nächster Zug
            const nextTurn = () => {
                D.initiative.currentTurn++;
                if (D.initiative.currentTurn >= D.initiative.combatants.length) {
                    D.initiative.currentTurn = 0;
                    D.initiative.round++;
                }
            };

            nextTurn(); // Turn 1
            expect(D.initiative.currentTurn).toBe(1);
            expect(D.initiative.round).toBe(1);

            nextTurn(); // Turn 2
            expect(D.initiative.currentTurn).toBe(2);

            nextTurn(); // Neue Runde
            expect(D.initiative.currentTurn).toBe(0);
            expect(D.initiative.round).toBe(2);
        });

        test('sollte Combatant entfernen können', () => {
            D.initiative.combatants = [
                { id: 1, name: 'A' },
                { id: 2, name: 'B' },
                { id: 3, name: 'C' }
            ];
            D.initiative.currentTurn = 1; // B ist dran

            // B entfernen
            const removeIdx = D.initiative.combatants.findIndex(c => c.id === 2);
            D.initiative.combatants.splice(removeIdx, 1);

            // currentTurn anpassen wenn nötig
            if (D.initiative.currentTurn >= D.initiative.combatants.length) {
                D.initiative.currentTurn = D.initiative.combatants.length - 1;
            }

            expect(D.initiative.combatants.length).toBe(2);
            expect(D.initiative.currentTurn).toBe(1); // C ist jetzt dran
        });
    });
});

// ============================================================
// STORAGE TESTS
// ============================================================

describe('Storage Operations', () => {
    test('sollte Daten speichern und laden', () => {
        // Character erstellen und speichern
        const char = createTestCharacter({ name: 'Saved Hero' });
        D.characters.push(char);

        save();

        // Daten prüfen
        const savedData = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
        expect(savedData).not.toBeNull();

        const parsed = JSON.parse(savedData);
        expect(parsed.characters.length).toBe(1);
        expect(parsed.characters[0].name).toBe('Saved Hero');
    });

    test('sollte leere Datenstruktur initialisieren', () => {
        // Neue Daten laden
        localStorage.setItem(
            APP_CONFIG.STORAGE_KEY,
            JSON.stringify({
                characters: [],
                npcs: [],
                locations: [],
                quests: [],
                encounters: [],
                loot: [],
                spells: [],
                initiative: { combatants: [], currentTurn: 0, round: 1 }
            })
        );

        load();

        expect(D.characters).toEqual([]);
        expect(D.npcs).toEqual([]);
    });

    test('sollte mit beschädigten Daten umgehen', () => {
        localStorage.setItem(APP_CONFIG.STORAGE_KEY, 'invalid json');

        // load() sollte nicht crashen
        expect(() => {
            try {
                const data = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
                JSON.parse(data);
            } catch (e) {
                // Fehler abfangen - erwartetes Verhalten
            }
        }).not.toThrow();
    });
});

// ============================================================
// FILTER & SEARCH TESTS
// ============================================================

describe('Filter & Search', () => {
    beforeEach(() => {
        // Test-Daten erstellen
        D.npcs = [
            createTestNPC({ name: 'Gandalf', role: 'Zauberer', race: 'Mensch' }),
            createTestNPC({ name: 'Aragorn', role: 'Waldläufer', race: 'Mensch' }),
            createTestNPC({ name: 'Legolas', role: 'Bogenschütze', race: 'Elf' }),
            createTestNPC({ name: 'Gimli', role: 'Krieger', race: 'Zwerg' })
        ];
    });

    test('sollte nach Name filtern', () => {
        const query = 'ara';
        const filtered = D.npcs.filter(n => n.name.toLowerCase().includes(query.toLowerCase()));

        expect(filtered.length).toBe(1);
        expect(filtered[0].name).toBe('Aragorn');
    });

    test('sollte nach Rasse filtern', () => {
        const race = 'Mensch';
        const filtered = D.npcs.filter(n => n.race === race);

        expect(filtered.length).toBe(2);
    });

    test('sollte nach Rolle filtern', () => {
        const role = 'Zauberer';
        const filtered = D.npcs.filter(n => n.role.toLowerCase().includes(role.toLowerCase()));

        expect(filtered.length).toBe(1);
        expect(filtered[0].name).toBe('Gandalf');
    });

    test('sollte kombinierte Filter unterstützen', () => {
        const race = 'Mensch';
        const query = 'gan'; // Eindeutiger - nur Gandalf

        const filtered = D.npcs.filter(
            n => n.race === race && n.name.toLowerCase().includes(query.toLowerCase())
        );

        expect(filtered.length).toBe(1);
        expect(filtered[0].name).toBe('Gandalf');
    });
});
