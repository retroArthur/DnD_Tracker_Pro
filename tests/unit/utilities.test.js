/**
 * Unit Tests - Utilities
 * Tests für grundlegende Utility-Funktionen
 */

const {
    esc,
    sanitizeHTML,
    nextId,
    getModifier,
    getProficiencyBonus,
    parseDiceNotation,
    debounce,
    throttle,
    isEmpty,
    clamp,
    deepClone,
    formatMod
} = require('../../utils/testable-utils');

describe('Utility Functions', () => {
    // ============================================================
    // ESC (HTML Escaping)
    // ============================================================

    describe('esc()', () => {
        test('sollte HTML-Entities escapen', () => {
            expect(esc('<script>')).toBe('&lt;script&gt;');
            expect(esc('Test & "Wert"')).toBe('Test &amp; &quot;Wert&quot;');
            expect(esc("Test's")).toBe('Test&#39;s');
        });

        test('sollte leere/null Werte behandeln', () => {
            expect(esc('')).toBe('');
            expect(esc(null)).toBe('');
            expect(esc(undefined)).toBe('');
        });

        test('sollte Zahlen konvertieren', () => {
            expect(esc(123)).toBe('123');
            expect(esc(0)).toBe('0');
        });
    });

    // ============================================================
    // NEXT ID
    // ============================================================

    describe('nextId()', () => {
        test('sollte inkrementelle IDs generieren', () => {
            const dataStore = { _nextId: {} };
            const id1 = nextId('test', dataStore);
            const id2 = nextId('test', dataStore);
            const id3 = nextId('test', dataStore);

            expect(id2).toBe(id1 + 1);
            expect(id3).toBe(id2 + 1);
        });

        test('sollte separate Zähler pro Typ haben', () => {
            const dataStore = { _nextId: {} };
            const charId1 = nextId('characters', dataStore);
            const npcId1 = nextId('npcs', dataStore);
            const charId2 = nextId('characters', dataStore);

            expect(charId2).toBe(charId1 + 1);
            expect(npcId1).toBe(1);
        });

        test('sollte _nextId initialisieren wenn nicht vorhanden', () => {
            const dataStore = {};
            const id = nextId('test', dataStore);

            expect(dataStore._nextId).toBeDefined();
            expect(dataStore._nextId.test).toBe(1);
            expect(id).toBe(1);
        });
    });

    // ============================================================
    // SANITIZE HTML
    // ============================================================

    describe('sanitizeHTML()', () => {
        test('sollte Script-Tags entfernen', () => {
            const dirty = '<p>Test</p><script>alert("xss")</script>';
            const clean = sanitizeHTML(dirty);

            expect(clean).not.toContain('<script>');
            expect(clean).toContain('<p>Test</p>');
        });

        test('sollte Event-Handler entfernen', () => {
            const dirty = '<img src="x" onerror="alert(1)">';
            const clean = sanitizeHTML(dirty);

            expect(clean).not.toContain('onerror');
        });

        test('sollte leere Strings behandeln', () => {
            expect(sanitizeHTML('')).toBe('');
            expect(sanitizeHTML(null)).toBe('');
        });
    });
});

// ============================================================
// D&D BERECHNUNGEN
// ============================================================

describe('D&D Calculations', () => {
    describe('getModifier()', () => {
        test('sollte korrekte Modifikatoren berechnen', () => {
            expect(getModifier(1)).toBe(-5);
            expect(getModifier(8)).toBe(-1);
            expect(getModifier(10)).toBe(0);
            expect(getModifier(11)).toBe(0);
            expect(getModifier(12)).toBe(1);
            expect(getModifier(14)).toBe(2);
            expect(getModifier(16)).toBe(3);
            expect(getModifier(18)).toBe(4);
            expect(getModifier(20)).toBe(5);
            expect(getModifier(30)).toBe(10);
        });
    });

    describe('getProficiencyBonus()', () => {
        test('sollte korrekten Übungsbonus pro Stufe berechnen', () => {
            // Level 1-4: +2
            expect(getProficiencyBonus(1)).toBe(2);
            expect(getProficiencyBonus(4)).toBe(2);

            // Level 5-8: +3
            expect(getProficiencyBonus(5)).toBe(3);
            expect(getProficiencyBonus(8)).toBe(3);

            // Level 9-12: +4
            expect(getProficiencyBonus(9)).toBe(4);
            expect(getProficiencyBonus(12)).toBe(4);

            // Level 13-16: +5
            expect(getProficiencyBonus(13)).toBe(5);
            expect(getProficiencyBonus(16)).toBe(5);

            // Level 17-20: +6
            expect(getProficiencyBonus(17)).toBe(6);
            expect(getProficiencyBonus(20)).toBe(6);
        });
    });

    describe('formatMod()', () => {
        test('sollte Modifikatoren mit Vorzeichen formatieren', () => {
            expect(formatMod(0)).toBe('+0');
            expect(formatMod(2)).toBe('+2');
            expect(formatMod(-1)).toBe('-1');
            expect(formatMod(5)).toBe('+5');
        });
    });
});

// ============================================================
// DICE PARSING
// ============================================================

describe('Dice Parsing', () => {
    describe('parseDiceNotation()', () => {
        test('sollte einfache Würfelnotation parsen', () => {
            const result = parseDiceNotation('1d20');
            expect(result).toEqual({ count: 1, sides: 20, modifier: 0 });
        });

        test('sollte Notation ohne Anzahl parsen', () => {
            const result = parseDiceNotation('d6');
            expect(result).toEqual({ count: 1, sides: 6, modifier: 0 });
        });

        test('sollte mehrere Würfel parsen', () => {
            const result = parseDiceNotation('2d6');
            expect(result).toEqual({ count: 2, sides: 6, modifier: 0 });
        });

        test('sollte positive Modifikatoren parsen', () => {
            const result = parseDiceNotation('1d20+5');
            expect(result).toEqual({ count: 1, sides: 20, modifier: 5 });
        });

        test('sollte negative Modifikatoren parsen', () => {
            const result = parseDiceNotation('2d8-2');
            expect(result).toEqual({ count: 2, sides: 8, modifier: -2 });
        });

        test('sollte komplexe Notation parsen', () => {
            const result = parseDiceNotation('4d6+3');
            expect(result).toEqual({ count: 4, sides: 6, modifier: 3 });
        });

        test('sollte ungültige Notation ablehnen', () => {
            expect(parseDiceNotation('')).toBeNull();
            expect(parseDiceNotation('abc')).toBeNull();
            expect(parseDiceNotation('d')).toBeNull();
            expect(parseDiceNotation('20')).toBeNull();
        });

        test('sollte case-insensitive sein', () => {
            const lower = parseDiceNotation('2d6');
            const upper = parseDiceNotation('2D6');
            expect(lower).toEqual(upper);
        });
    });
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

describe('Helper Functions', () => {
    describe('isEmpty()', () => {
        test('sollte leere Werte erkennen', () => {
            expect(isEmpty(null)).toBe(true);
            expect(isEmpty(undefined)).toBe(true);
            expect(isEmpty('')).toBe(true);
            expect(isEmpty('   ')).toBe(true);
            expect(isEmpty([])).toBe(true);
            expect(isEmpty({})).toBe(true);
        });

        test('sollte nicht-leere Werte erkennen', () => {
            expect(isEmpty('test')).toBe(false);
            expect(isEmpty([1])).toBe(false);
            expect(isEmpty({ a: 1 })).toBe(false);
            expect(isEmpty(0)).toBe(false);
            expect(isEmpty(false)).toBe(false);
        });
    });

    describe('clamp()', () => {
        test('sollte Werte zwischen min und max klemmen', () => {
            expect(clamp(5, 0, 10)).toBe(5);
            expect(clamp(-5, 0, 10)).toBe(0);
            expect(clamp(15, 0, 10)).toBe(10);
            expect(clamp(0, 0, 10)).toBe(0);
            expect(clamp(10, 0, 10)).toBe(10);
        });
    });

    describe('deepClone()', () => {
        test('sollte einfache Objekte klonen', () => {
            const obj = { a: 1, b: 'test' };
            const clone = deepClone(obj);

            expect(clone).toEqual(obj);
            expect(clone).not.toBe(obj);
        });

        test('sollte verschachtelte Objekte klonen', () => {
            const obj = { a: { b: { c: 1 } } };
            const clone = deepClone(obj);

            expect(clone).toEqual(obj);
            expect(clone.a).not.toBe(obj.a);
            expect(clone.a.b).not.toBe(obj.a.b);
        });

        test('sollte Arrays klonen', () => {
            const arr = [1, [2, 3], { a: 4 }];
            const clone = deepClone(arr);

            expect(clone).toEqual(arr);
            expect(clone).not.toBe(arr);
            expect(clone[1]).not.toBe(arr[1]);
        });

        test('sollte primitive Werte zurückgeben', () => {
            expect(deepClone(null)).toBe(null);
            expect(deepClone(42)).toBe(42);
            expect(deepClone('test')).toBe('test');
        });
    });
});

// ============================================================
// DEBOUNCE / THROTTLE
// ============================================================

describe('Timing Functions', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('debounce()', () => {
        test('sollte mehrere Aufrufe zusammenfassen', () => {
            const fn = jest.fn();
            const debouncedFn = debounce(fn, 100);

            // Mehrfach aufrufen
            debouncedFn();
            debouncedFn();
            debouncedFn();

            // Noch nicht aufgerufen
            expect(fn).not.toHaveBeenCalled();

            // Zeit vorlaufen lassen
            jest.advanceTimersByTime(100);

            // Nur einmal aufgerufen
            expect(fn).toHaveBeenCalledTimes(1);
        });

        test('sollte mit Argumenten funktionieren', () => {
            const fn = jest.fn();
            const debouncedFn = debounce(fn, 100);

            debouncedFn('a');
            debouncedFn('b');
            debouncedFn('c');

            jest.advanceTimersByTime(100);

            expect(fn).toHaveBeenCalledWith('c');
        });

        test('sollte Default-Delay von 300ms verwenden', () => {
            const fn = jest.fn();
            const debouncedFn = debounce(fn); // ohne delay Parameter

            debouncedFn();

            // Nach 200ms noch nicht aufgerufen
            jest.advanceTimersByTime(200);
            expect(fn).not.toHaveBeenCalled();

            // Nach weiteren 100ms (gesamt 300ms) aufgerufen
            jest.advanceTimersByTime(100);
            expect(fn).toHaveBeenCalledTimes(1);
        });
    });

    describe('throttle()', () => {
        test('sollte Aufrufe auf einmal pro Intervall begrenzen', () => {
            const fn = jest.fn();
            const throttledFn = throttle(fn, 100);

            // Mehrfach aufrufen
            throttledFn();
            throttledFn();
            throttledFn();

            expect(fn).toHaveBeenCalledTimes(1);

            // Zeit vorlaufen lassen
            jest.advanceTimersByTime(100);

            // Jetzt wieder möglich
            throttledFn();
            expect(fn).toHaveBeenCalledTimes(2);
        });

        test('sollte Default-Limit von 100ms verwenden', () => {
            const fn = jest.fn();
            const throttledFn = throttle(fn); // ohne limit Parameter

            throttledFn();
            expect(fn).toHaveBeenCalledTimes(1);

            // Innerhalb von 100ms blockiert
            jest.advanceTimersByTime(50);
            throttledFn();
            expect(fn).toHaveBeenCalledTimes(1);

            // Nach 100ms wieder möglich
            jest.advanceTimersByTime(50);
            throttledFn();
            expect(fn).toHaveBeenCalledTimes(2);
        });
    });
});
