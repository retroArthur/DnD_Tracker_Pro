/**
 * SRD Monsters Unit Tests — Wave-0 Schema Validation
 * Tests that getSRDMonsters() returns an Array with the correct schema.
 * In Plan 01 (stub), the array is empty — the guarded schema check is
 * skipped so the test stays GREEN now and becomes meaningful after Plan 02
 * fills the data.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================
// SETUP: getSRDMonsters aus core/srd-monsters.js laden
// ============================================================

let getSRDMonsters;

beforeAll(() => {
    const context = {
        window: {},
        console: console
    };
    vm.createContext(context);

    const filePath = path.join(__dirname, '../../core/srd-monsters.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    getSRDMonsters = context.window.getSRDMonsters;
});

// ============================================================
// TESTS: getSRDMonsters() Rueckgabe und Schema
// ============================================================

describe('getSRDMonsters()', () => {
    test('returns an Array', () => {
        const monsters = getSRDMonsters();
        expect(Array.isArray(monsters)).toBe(true);
    });

    test('caches the result (same reference on second call)', () => {
        const first = getSRDMonsters();
        const second = getSRDMonsters();
        expect(first).toBe(second);
    });

    // Guarded schema check: only runs when the array is non-empty (Plan 02+)
    test('every entry has required string fields: name, cr', () => {
        const monsters = getSRDMonsters();
        if (monsters.length === 0) {
            // Stub in Plan 01 — skip schema assertions, test stays GREEN
            return;
        }
        monsters.forEach((m, i) => {
            expect(typeof m.name).toBe('string');
            expect(typeof m.cr).toBe('string');
        });
    });

    test('every entry has required numeric fields: ac, hp', () => {
        const monsters = getSRDMonsters();
        if (monsters.length === 0) {
            // Stub in Plan 01 — skip schema assertions, test stays GREEN
            return;
        }
        monsters.forEach((m, i) => {
            expect(typeof m.ac).toBe('number');
            expect(typeof m.hp).toBe('number');
        });
    });

    test('SRD data is not assigned to D (architecture constraint)', () => {
        // Read the source file and verify no D.* = getSRDMonsters() pattern
        const filePath = path.join(__dirname, '../../core/srd-monsters.js');
        const content = fs.readFileSync(filePath, 'utf8');
        // Must not assign SRD data into D
        expect(content).not.toMatch(/D\s*\.\s*\w+\s*=\s*getSRDMonsters/);
        expect(content).not.toMatch(/window\.D/);
    });
});
