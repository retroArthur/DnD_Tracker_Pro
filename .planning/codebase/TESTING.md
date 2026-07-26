# Testing Patterns

**Analysis Date:** 2026-07-26

## Test Framework

**Runner:**

- Jest 30.2.0 (unit + integration), config: `jest.config.cjs`
    - Environment: `jsdom` (`jest-environment-jsdom`)
    - `testMatch`: `**/*.test.js` / `**/*.test.ts`, roots: `tests/`
    - Transforms: `babel-jest` for JS, `ts-jest` available for TS (no TS tests currently)
    - `testTimeout: 10000`, `verbose: true`
    - Setup: `tests/setup.js` — global mocks, factories, behavioral stubs
- Playwright 1.57.0 (E2E), config: `playwright.config.js`
    - `testDir: './tests/e2e'`, chromium-only project, viewport 1920x1080
    - Runs against the BUILT bundle via `file://` baseURL: `dist/dnd-tracker-bundled.html` — run `npm run build:dev` (or `build`) before E2E
    - Timeouts: 30s/test, 5s/expect; CI: retries 2, workers 1; screenshots/video/trace retained on failure
    - Reports: `tests/e2e/reports/` (HTML), artifacts: `tests/e2e/test-results/`
- pytest (Python build-system tests): `tests/build/test_build_deduplication.py` — TDD suite for `build.py` deduplication and module conflict detection

**Assertion Library:**

- Jest built-in `expect` (unit/integration); Playwright `expect` (E2E)

**Run Commands:**

```bash
npm test                    # All Jest tests (unit + integration)
npm run test:unit           # jest tests/unit only
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npx jest tests/unit/utilities.test.js          # Single suite
npx jest -t "sollte Character erstellen"       # Single test by name

npm run test:e2e            # Playwright E2E (build dist first!)
npm run test:e2e:headed     # Visible browser
npm run test:e2e:ui         # Playwright UI mode
npm run test:e2e:report     # Show last HTML report
npx playwright test tests/e2e/features/wiki.spec.js   # Single spec

python -m pytest tests/build/ -v   # Build deduplication tests
```

**Current status:** 54 test files total. Jest: 26 files (23 unit + 3 integration), 621 tests passing. Playwright: 27 E2E .spec.js files with 318 tests passing / 2 skipped (313 static `test()` calls; parameterized tests expand at runtime) across smoke/CRUD/features/integration suites. Python build tests: 1 file (`test_build_deduplication.py`). CI (`.github/workflows/ci.yml`) runs typecheck + lint + Jest + Python build tests — E2E is NOT run in CI (separate gate before deploy). E2E test infrastructure improvements tracked in memory (`preexisting-e2e-failures.md`).

## Test File Organization

**Location:**

- Separate `tests/` tree — NOT co-located with source

**Naming:**

- Jest: `*.test.js` — e.g. `tests/unit/utilities.test.js`
- Playwright: `*.spec.js` — e.g. `tests/e2e/crud/npcs.spec.js`
- pytest: `test_*.py` — e.g. `test_build_deduplication.py`

**Structure:**

```
tests/
├── setup.js                      # Global Jest mocks + factories (setupFilesAfterEnv)
├── unit/                         # 23 test files: pure-function + mock-contract tests
│   ├── utilities.test.js         # esc, sanitizeHTML, nextId, clamp, formatMod, etc.
│   ├── entities.test.js          # CRUD on D via setup.js mocks
│   ├── security.test.js          # Deep XSS tests for sanitizeHTML/esc
│   ├── stability.test.js         # Persistence, corrupted JSON, recovery
│   ├── encounter-calculator.test.js
│   ├── markdown-converter.test.js
│   ├── markdown-shortcuts.test.js
│   ├── character-advancement.test.js
│   ├── action-registry.test.js
│   ├── action-registry-collisions.test.js
│   ├── dice-stats.test.js
│   ├── file-backup.test.js
│   ├── file-backup-hook.test.js
│   ├── full-export.test.js
│   ├── import-sanitization.test.js
│   ├── initiative-mob.test.js
│   ├── migration.test.js
│   ├── sanitizer-parity.test.js
│   ├── soundboard.test.js
│   ├── soundboard-loop.test.js
│   ├── srd-monsters.test.js
│   └── welt-story.test.js
├── integration/                  # 3 test files: workflow simulations over D-like data
│   ├── character-management.test.js
│   ├── combat-system.test.js     # Initiative sort, turns, HP, conditions
│   └── encounter-builder.test.js
├── e2e/                          # 27 spec files, organized by domain
│   ├── app.spec.js               # Smoke: tabs, basic visibility, console errors
│   ├── tab-navigation.spec.js    # Tab registry re-render checks
│   ├── smoke.spec.js             # Production bundle smoke test
│   ├── crud/
│   │   ├── party.spec.js         # Character CRUD + validation errors + undo
│   │   ├── npcs.spec.js          # NPC CRUD with relations, dialogs
│   │   ├── locations.spec.js     # Location CRUD
│   │   ├── quests.spec.js        # Quest CRUD
│   │   └── encounters.spec.js    # Encounter CRUD
│   ├── features/
│   │   ├── bestiary.spec.js      # Custom creature editor
│   │   ├── character-advancement.spec.js
│   │   ├── command-palette.spec.js
│   │   ├── dice.spec.js          # Dice roller, favorites, roll history
│   │   ├── dice-stats.spec.js    # Dice statistics tracking
│   │   ├── editor-formatting.spec.js      # 30+ tests for rich-text formatting
│   │   ├── editor-floating.spec.js        # Floating toolbar
│   │   ├── editor-insert.spec.js          # Table, link, list insertion
│   │   ├── editor-smoke.spec.js           # Editor smoke tests
│   │   ├── import-security.spec.js
│   │   ├── initiative.spec.js    # Combat tracker, death saves, concentration
│   │   ├── inspiration.spec.js
│   │   ├── nav-groups.spec.js    # Grouped navigation collapse/expand
│   │   ├── persistence.spec.js   # Data survive reload, IndexedDB
│   │   ├── pwa.spec.js           # Service worker, offline detection
│   │   ├── soundboard.spec.js    # Audio playback, presets, loops
│   │   ├── welt-story.spec.js    # Story/world content
│   │   └── wiki.spec.js          # Wiki categories, rich-text, search
│   ├── integration/
│   │   └── workflows.spec.js     # Cross-feature workflows
│   ├── helpers/
│   │   └── test-utils.js         # Shared E2E helpers + testData generators
│   ├── reports/                  # HTML report output (generated)
│   └── test-results/             # Failure artifacts (generated)
└── build/
    └── test_build_deduplication.py  # Pytest: dedup + conflict detection
```

## Test Structure

**Suite Organization (Jest):**

```javascript
// tests/unit/utilities.test.js — real implementations imported via CommonJS
const { esc, sanitizeHTML, nextId, getModifier } = require('../../utils/testable-utils');

describe('Utility Functions', () => {
    // ============================================================
    // ESC (HTML Escaping)                  <- section banners inside test files
    // ============================================================
    describe('esc()', () => {
        test('sollte HTML-Entities escapen', () => {
            // German test names ("sollte ...")
            expect(esc('<script>')).toBe('&lt;script&gt;');
        });
        test('sollte leere/null Werte behandeln', () => {
            expect(esc(null)).toBe('');
            expect(esc('')).toBe('');
        });
    });
});
```

**Suite Organization (Playwright):**

```javascript
// tests/e2e/crud/npcs.spec.js
// @ts-check
import { test, expect } from '@playwright/test';
import { loadApp, navigateToTab, fillField, generateTestName } from '../helpers/test-utils.js';

test.describe('NPCs - CRUD Operationen', () => {
    test.beforeEach(async ({ page }) => {
        // D-06: seed data BEFORE loadApp() to prevent onboarding/repair-save toasts
        // that would collide with validation-error assertions
        await page.addInitScript(() => {
            try {
                localStorage.setItem(
                    'dnd-tracker-v4',
                    JSON.stringify({
                        _version: '99.0.0',
                        settings: { markdownOnboardingSeen: true },
                        randomTables: [],
                        timers: [],
                        shops: [],
                        campaign: {},
                        _nextId: { npcs: 1 }
                    })
                );
            } catch {}
        });
        await loadApp(page);
        await navigateToTab(page, 'npcs');
    });

    test('NPC mit Minimaldaten erstellen', async ({ page }) => {
        const npcName = generateTestName('MinNPC');
        await page.click('[data-action="show-modal"][data-value="npc-modal"]');
        await fillField(page, 'npc-name', npcName);
        await page.click('[data-action="call"][data-value="saveNPC"]');
        // Assert against global D, not just DOM:
        const npcData = await page.evaluate(
            name => (D.npcs ? D.npcs.find(n => n.name && n.name.includes(name)) : null),
            npcName
        );
        expect(npcData).toBeTruthy();
    });
});
```

**Patterns:**

- Setup: global `beforeEach(() => resetTestState())` in `tests/setup.js` resets `D`, undo/redo stacks, `localStorage`, and all jest mocks; E2E suites add local `beforeEach` with `addInitScript` to seed data BEFORE app init (D-06 fix for toast collision)
- Teardown: none needed (full reset per test); no `afterEach` in practice
- Assertions: state-based against the `D` data object (unit + E2E via `page.evaluate`); DOM assertions secondary
- E2E selectors target `data-action`/`data-value` attributes (event delegation system), not CSS classes
- Synchronization in E2E: fixed `page.waitForTimeout(300-500)` for most cases; prefer `waitForSelector`/`waitForFunction` when writing new tests to avoid flakiness
- Test names: German throughout, descriptive sentences (`'sollte Combatants nach Initiative sortieren'`, `'NPC ohne Namen zeigt Fehlermeldung'`)

## Mocking

**Framework:** Jest built-in (`jest.fn()`), configured globally in `tests/setup.js` (546 lines)

**Patterns:**

```javascript
// tests/setup.js — the entire global runtime is mocked, since production
// modules attach to window and cannot be require()d individually:
global.APP_CONFIG = Object.freeze({ 
    VERSION: '2.7.0-test', 
    DEBUG_MODE: false, 
    STORAGE_KEY: 'dnd-tracker-test',
    UNDO_LIMIT: 30,
    // ... 15+ config keys
});
global.D = { 
    characters: [], 
    npcs: [], 
    initiative: { combatants: [], currentTurn: 0, round: 1 }, 
    // ... 20+ entity collections
};
global.$ = jest.fn(id => document.getElementById(id));
global.esc = jest.fn(s => { /* real escaping logic inline */ });
global.showToast = jest.fn();
global.renderParty = jest.fn();              // all render fns are jest.fn() stubs
global.debounce = jest.fn(fn => fn);         // immediate execution in tests
global.save = jest.fn(() => localStorage.setItem(APP_CONFIG.STORAGE_KEY, safeStringify(D)));
global.saveUndoState = jest.fn(() => { 
    undoStack.push(JSON.parse(safeStringify(D))); 
});
global.undo = jest.fn(() => { 
    if (undoStack.length === 0) return;
    redoStack.push(JSON.parse(safeStringify(D)));
    const prev = undoStack.pop();
    Object.assign(D, prev);
});
```

- Behavioral mocks: `save`/`load`/`undo`/`redo`/`nextTurn`/`deleteChar` etc. are `jest.fn()` with simplified real logic (mock contracts mirroring production behavior)
- `localStorage` replaced by an in-memory mock object with a `store` map and all standard methods
- Mock names must match production functions exactly (`renderInit`, not `renderInitiative` — fixed bug from mid-2026)
- `CR_TO_XP` table provided for encounter calculator tests

**What to Mock:**

- Render functions, toast/modal UI, save/load persistence, debounce/throttle (pass-through), DOM-heavy globals

**What NOT to Mock:**

- Pure logic under test — import REAL implementations from `utils/testable-utils.js` (`esc`, `sanitizeHTML`, `nextId`, `getModifier`, `getProficiencyBonus`, `parseDiceNotation`, `clamp`, `deepClone`, `formatMod`). This file duplicates functions from `utils/basic.js`/`utils/utilities.js` with CommonJS-compatible signatures (e.g. `nextId(type, dataStore)` takes an explicit store) and is imported ONLY by tests, never by the production build
- In E2E: nothing is mocked — tests drive the real built bundle

**Architecture constraint:** Production modules are non-ESM globals, so `jest.mock()`/module mocking is not used. Unit-testable logic must either live in (or be mirrored into) `utils/testable-utils.js`, or be tested end-to-end via Playwright.

## Fixtures and Factories

**Test Data:**

```javascript
// Global factories in tests/setup.js (available in every Jest test):
const char = createTestCharacter({ name: 'Hero 1', level: 8 });   // full D&D character with overrides
const npc = createTestNPC({ role: 'Schmied' });
const goblin = createTestEncounter({ cr: '1/4' });

// Local factories in integration suites (tests/integration/combat-system.test.js):
const createCombatant = (overrides = {}) => ({
    id: nextId('combatants', dataStore), name: 'Combatant', initiative: 10,
    hpCurrent: 20, hpMax: 20, ac: 15, conditions: [], isPlayer: true, ...overrides
});

// E2E data generators (tests/e2e/helpers/test-utils.js):
export const testData = { 
    character: () => ({ name: generateTestName('Hero'), ... }), 
    npc: (...) => ({ ... }),
    quest: (...) => ({ ... })
};
generateTestName('NPC')   // => 'NPC_Test_1718...' — unique per run via Date.now()
```

**Location:**

- Jest factories: `tests/setup.js` (global `createTestCharacter`, `createTestNPC`, `createTestEncounter` with full D&D schema)
- E2E helpers + generators: `tests/e2e/helpers/test-utils.js` (356 lines of `loadApp`, `navigateToTab`, `fillField`, `selectOption`, `clickAction`, `waitForToast`, `clearAppData`, `getEntityCount`, `getEntityById`, `performUndo`/`performRedo`/`performSave`, `testData`)
- No JSON fixture files — all data built programmatically with override pattern

## Coverage

**Requirements:** Enforced ONLY for `utils/testable-utils.js`: 80% branches/functions/lines/statements (`jest.config.cjs` `coverageThreshold`). No global threshold — feature modules are effectively covered via E2E, not Jest, due to the global-scope architecture.

**View Coverage:**

```bash
npm run test:coverage      # text + text-summary + lcov + html reporters
# HTML report: coverage/ directory
```

`collectCoverageFrom` includes `core/`, `features/`, `systems/`, `ui/`, `render/` (excluding `.d.ts`), but `collectCoverage` is off by default.

## Test Types

**Unit Tests:**

- `tests/unit/` (23 test files). Two styles:
    1. Real pure functions from `utils/testable-utils.js` (utilities, security, markdown)
    2. Mock-contract tests against `tests/setup.js` behavioral mocks (entities, encounter-calculator, stability)
- `security.test.js` is the deepest suite: script injection, event-handler injection, protocol filtering, case variations, CSS injection against `sanitizeHTML()`/`esc()`
- `action-registry-collisions.test.js`: verifies no duplicate action names across all `ui/actions/` modules (caught at registration time)

**Integration Tests:**

- `tests/integration/` (3 test files): simulate multi-step workflows (combat rounds, character lifecycle, encounter building) over plain data structures + real calculation functions; no DOM
- Use local `createCombatant`, `createEncounter` factories with explicit `dataStore` parameter

**E2E Tests:**

- Playwright, `tests/e2e/` (27 spec files, 318 tests): 
    - Smoke tests (`app.spec.js`, `tab-navigation.spec.js`, `smoke.spec.js`)
    - Per-entity CRUD (`crud/*.spec.js` — create minimal/full, validation error, edit, delete, undo, search filter)
    - Feature flows (`features/*.spec.js` — dice, initiative with death saves/concentration, wiki, editors)
    - Cross-feature workflows (`integration/workflows.spec.js`)
- D-06 Pitfall 3: seed data BEFORE `loadApp()` via `addInitScript` to prevent onboarding/repair-save toasts that collide with validation-error assertions
- D-02 Pitfall 3: migration-hint banner layout offset regression test — geometric proof, not click-based
- Test infrastructure issues (NOT app bugs) tracked in memory (`preexisting-e2e-failures.md`)

**Build Tests:**

- `tests/build/test_build_deduplication.py` (pytest, class-based `TestBuildDeduplication`): verifies window-assignment dedup (Pass 2), conflict resolution, duplicate function detection (pre-build Pass via `check_duplicate_functions`), and syntactic validity of the generated bundle. TDD required for `build.py` changes: failing test commit → implementation commit.

## Common Patterns

**Async Testing:**

```javascript
// Jest suites are synchronous (state-based). E2E uses async/await throughout:
test('Daten überleben Reload', async ({ page }) => {
    await loadApp(page);
    // ... create data ...
    await page.reload();
    const count = await getEntityCount(page, 'characters');
    expect(count).toBe(1);
});
```

**Error Testing:**

```javascript
// Graceful-failure contract (no throws, no-op on bad input):
test('sollte nicht-existente ID ignorieren', () => {
    deleteChar(999);
    expect(D.characters.length).toBe(0); // no error, no change
});

// Corrupted-persistence handling (tests/unit/stability.test.js):
localStorage.setItem(APP_CONFIG.STORAGE_KEY, '{invalid json');
load(); // must keep defaults, not throw

// Validation-error UX in E2E: save without required field, then assert toast:
await page.click('[data-action="call"][data-value="saveNPC"]');
await expect(page.locator('#toast')).toBeVisible();
```

**Undo Testing (required for all data modifications):**

```javascript
// E2E: tests/e2e/helpers/test-utils.js
await performUndo(page); // Control+z, then assert entity count/state restored
```

**Editor Testing Pattern (E2E):**

Four independent suites protect the execCommand-migration from Phase 9:

- `editor-formatting.spec.js`: bold, italic, underline, strikethrough, colors, fonts, sizes, read-aloud styles
- `editor-floating.spec.js`: floating toolbar appearance, selection behavior, close-on-blur
- `editor-insert.spec.js`: table, link, list insertion; paste handling
- `editor-smoke.spec.js`: rapid focus/blur, switch between wikis, undo/redo

Together these 80+ tests catch regressions in `ui/editors/rich-text.js` (Selection/Range DOM API, no `execCommand` calls except 3 legacy sites documented in CONCERNS.md).

**Known caveats for new test work:**

- `tests/unit/markdown-converter.test.js` contains placeholder assertions (comments like `// Would call htmlToMarkdown(html)`) — they pass without exercising `ui/editors/markdown-converter.js`; real conversion tests still need to be wired up
- E2E must run against a fresh build: `npm run build:dev && npm run test:e2e`
- Under `file://`, `localStorage` is restricted — assert persistence via `D`/IndexedDB/`StorageAPI`, not raw `localStorage.getItem()`
- When adding render functions, test: initial render, re-render on tab switch, re-render after data change, rapid tab switches (see `tests/e2e/tab-navigation.spec.js`)
- Data seeding in E2E must happen in `addInitScript` BEFORE `loadApp()` to avoid toast collisions with assertion windows (D-06)
- E2E Playwright file:// tests cannot mock network — only use `page.evaluate` for in-page JS execution

---

_Testing analysis: 2026-07-26_
