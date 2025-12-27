/**
 * Integration Tests - Character Management
 * Testet das Zusammenspiel von Character-Erstellung, Storage und Berechnungen
 */

const {
    getModifier,
    getProficiencyBonus,
    nextId,
    deepClone
} = require('../../utils/testable-utils');

describe('Character Management Integration', () => {

    let dataStore;

    // Character Factory
    const createCharacter = (overrides = {}) => ({
        id: nextId('characters', dataStore),
        name: 'Test Hero',
        playerName: 'Tester',
        characterClass: 'Kämpfer',
        subclass: '',
        race: 'Mensch',
        level: 1,
        background: 'Soldat',
        alignment: 'LG',
        attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        hpCurrent: 10,
        hpMax: 10,
        tempHp: 0,
        armorClass: 10,
        spellSlots: {},
        currency: { pm: 0, gm: 0, em: 0, sm: 0, km: 0 },
        ...overrides
    });

    beforeEach(() => {
        dataStore = {
            characters: [],
            _nextId: {}
        };
    });

    // ============================================================
    // CHARACTER CRUD OPERATIONS
    // ============================================================

    describe('Character CRUD', () => {

        test('sollte Character erstellen und speichern', () => {
            const char = createCharacter({ name: 'Aragorn', level: 10 });
            dataStore.characters.push(char);

            expect(dataStore.characters).toHaveLength(1);
            expect(dataStore.characters[0].name).toBe('Aragorn');
            expect(dataStore.characters[0].id).toBe(1);
        });

        test('sollte mehrere Characters mit eindeutigen IDs erstellen', () => {
            const char1 = createCharacter({ name: 'Legolas' });
            const char2 = createCharacter({ name: 'Gimli' });
            const char3 = createCharacter({ name: 'Gandalf' });

            dataStore.characters.push(char1, char2, char3);

            expect(dataStore.characters).toHaveLength(3);
            expect(char1.id).toBe(1);
            expect(char2.id).toBe(2);
            expect(char3.id).toBe(3);
        });

        test('sollte Character per ID finden', () => {
            dataStore.characters.push(
                createCharacter({ name: 'Frodo' }),
                createCharacter({ name: 'Sam' }),
                createCharacter({ name: 'Merry' })
            );

            const found = dataStore.characters.find(c => c.id === 2);
            expect(found.name).toBe('Sam');
        });

        test('sollte Character aktualisieren', () => {
            const char = createCharacter({ name: 'Bilbo', level: 1 });
            dataStore.characters.push(char);

            // Level Up
            const index = dataStore.characters.findIndex(c => c.id === char.id);
            dataStore.characters[index] = {
                ...dataStore.characters[index],
                level: 5,
                hpMax: 38
            };

            expect(dataStore.characters[0].level).toBe(5);
            expect(dataStore.characters[0].hpMax).toBe(38);
        });

        test('sollte Character löschen', () => {
            dataStore.characters.push(
                createCharacter({ name: 'Boromir' }),
                createCharacter({ name: 'Faramir' })
            );

            dataStore.characters = dataStore.characters.filter(c => c.name !== 'Boromir');

            expect(dataStore.characters).toHaveLength(1);
            expect(dataStore.characters[0].name).toBe('Faramir');
        });
    });

    // ============================================================
    // ATTRIBUTE CALCULATIONS
    // ============================================================

    describe('Attribute-Berechnungen', () => {

        test('sollte Modifikatoren korrekt berechnen', () => {
            const char = createCharacter({
                attributes: { str: 18, dex: 14, con: 16, int: 8, wis: 12, cha: 10 }
            });

            expect(getModifier(char.attributes.str)).toBe(4);
            expect(getModifier(char.attributes.dex)).toBe(2);
            expect(getModifier(char.attributes.con)).toBe(3);
            expect(getModifier(char.attributes.int)).toBe(-1);
            expect(getModifier(char.attributes.wis)).toBe(1);
            expect(getModifier(char.attributes.cha)).toBe(0);
        });

        test('sollte Übungsbonus nach Level berechnen', () => {
            const levels = [1, 4, 5, 8, 9, 12, 13, 16, 17, 20];
            const expected = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6];

            levels.forEach((level, i) => {
                expect(getProficiencyBonus(level)).toBe(expected[i]);
            });
        });

        test('sollte Rettungswurf-Bonus berechnen', () => {
            const char = createCharacter({
                level: 5,
                attributes: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
                saveProficiencies: { str: true, con: true, dex: false, int: false, wis: false, cha: false }
            });

            const profBonus = getProficiencyBonus(char.level);

            // Kämpfer: Stärke + Konstitution Proficiency
            const strSave = getModifier(char.attributes.str) + profBonus; // 3 + 3 = 6
            const conSave = getModifier(char.attributes.con) + profBonus; // 2 + 3 = 5
            const dexSave = getModifier(char.attributes.dex); // 2 (keine Proficiency)

            expect(strSave).toBe(6);
            expect(conSave).toBe(5);
            expect(dexSave).toBe(2);
        });
    });

    // ============================================================
    // HP MANAGEMENT
    // ============================================================

    describe('HP-Management', () => {

        test('sollte Schaden korrekt anwenden', () => {
            const char = createCharacter({ hpCurrent: 30, hpMax: 30, tempHp: 5 });

            // Schaden anwenden (erst Temp HP)
            const applyDamage = (character, damage) => {
                let remaining = damage;
                if (character.tempHp > 0) {
                    const tempAbsorbed = Math.min(character.tempHp, remaining);
                    character.tempHp -= tempAbsorbed;
                    remaining -= tempAbsorbed;
                }
                character.hpCurrent = Math.max(0, character.hpCurrent - remaining);
                return character;
            };

            applyDamage(char, 8);

            expect(char.tempHp).toBe(0);
            expect(char.hpCurrent).toBe(27);
        });

        test('sollte Heilung korrekt anwenden', () => {
            const char = createCharacter({ hpCurrent: 15, hpMax: 30 });

            const applyHealing = (character, healing) => {
                character.hpCurrent = Math.min(character.hpMax, character.hpCurrent + healing);
                return character;
            };

            applyHealing(char, 10);
            expect(char.hpCurrent).toBe(25);

            // Überheilung nicht möglich
            applyHealing(char, 20);
            expect(char.hpCurrent).toBe(30);
        });

        test('sollte temporäre HP setzen', () => {
            const char = createCharacter({ tempHp: 0 });

            const setTempHp = (character, tempHp) => {
                // Temp HP stacken nicht, nur höherer Wert zählt
                character.tempHp = Math.max(character.tempHp, tempHp);
                return character;
            };

            setTempHp(char, 10);
            expect(char.tempHp).toBe(10);

            // Niedrigere Temp HP werden ignoriert
            setTempHp(char, 5);
            expect(char.tempHp).toBe(10);

            // Höhere Temp HP überschreiben
            setTempHp(char, 15);
            expect(char.tempHp).toBe(15);
        });
    });

    // ============================================================
    // PARTY MANAGEMENT
    // ============================================================

    describe('Party-Management', () => {

        test('sollte Party-Statistiken berechnen', () => {
            dataStore.characters.push(
                createCharacter({ name: 'Fighter', level: 5, characterClass: 'Kämpfer' }),
                createCharacter({ name: 'Wizard', level: 5, characterClass: 'Magier' }),
                createCharacter({ name: 'Cleric', level: 4, characterClass: 'Kleriker' }),
                createCharacter({ name: 'Rogue', level: 6, characterClass: 'Schurke' })
            );

            const partyStats = {
                size: dataStore.characters.length,
                averageLevel: dataStore.characters.reduce((sum, c) => sum + c.level, 0) / dataStore.characters.length,
                levels: dataStore.characters.map(c => c.level),
                classes: dataStore.characters.map(c => c.characterClass)
            };

            expect(partyStats.size).toBe(4);
            expect(partyStats.averageLevel).toBe(5);
            expect(partyStats.levels).toEqual([5, 5, 4, 6]);
        });

        test('sollte Party nach Klasse filtern', () => {
            dataStore.characters.push(
                createCharacter({ characterClass: 'Kämpfer' }),
                createCharacter({ characterClass: 'Magier' }),
                createCharacter({ characterClass: 'Kämpfer' }),
                createCharacter({ characterClass: 'Kleriker' })
            );

            const fighters = dataStore.characters.filter(c => c.characterClass === 'Kämpfer');
            expect(fighters).toHaveLength(2);
        });
    });

    // ============================================================
    // DATA PERSISTENCE SIMULATION
    // ============================================================

    describe('Data Persistence', () => {

        test('sollte Daten serialisieren und deserialisieren', () => {
            dataStore.characters.push(
                createCharacter({ name: 'Persisted Hero', level: 10 })
            );

            // Simuliere localStorage
            const serialized = JSON.stringify(dataStore);
            const restored = JSON.parse(serialized);

            expect(restored.characters).toHaveLength(1);
            expect(restored.characters[0].name).toBe('Persisted Hero');
            expect(restored.characters[0].level).toBe(10);
        });

        test('sollte Deep Clone für Undo/Redo erstellen', () => {
            const char = createCharacter({ name: 'Original', level: 5 });
            dataStore.characters.push(char);

            // Erstelle Snapshot für Undo
            const snapshot = deepClone(dataStore);

            // Ändere Original
            dataStore.characters[0].level = 10;

            // Snapshot sollte unverändert sein
            expect(snapshot.characters[0].level).toBe(5);
            expect(dataStore.characters[0].level).toBe(10);
        });
    });
});
