# Testing Patterns

**Analysis Date:** 2026-06-11

## Test Framework

**Runner:**

- Jest 30.2.0 (unit + integration), config: `jest.config.cjs`
    - Environment: `jsdom` (`jest-environment-jsdom`)
    - `testMatch`: `**/*.test.js` / `**/*.test.ts`, roots: `tests/`
    - Transforms: `babel-jest` for JS, `ts-jest` available for TS (no TS tests currently)
    - `testTimeout: 10000`, `verbose: true`
- Playwright 1.57.0 (E2E), config: `playwright.config.js`
    - `testDir: './tests/e2e'`, chromium-only project, viewport 1920x1080
    - Runs against the BUILT bundle via `file://` baseURL: `dist/dnd-tracker-bundled.html` — run `npm run build:dev` (or `build`) before E2E
    - Timeouts: 30s/test, 5s/expect; CI: retries 2, workers 1; screenshots/video/trace retained on failure
    - Reports: `tests/e2e/reports/` (HTML), artifacts: `tests/e2e/test-results/`
- pytest (Python build-system tests): `tests/build/test_build_deduplication.py` — TDD suite for `build.py` deduplication

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

**Current status:** 272 Jest tests across 10 suites, all passing. 140 Playwright tests, 114 passing — 26 known pre-existing failures triaged in `docs/e2e-failure-triage.md` (test-spec bugs: persistence specs check `localStorage` instead of IndexedDB under `file://`; stale Add-Combatant selectors in `tests/e2e/features/initiative.spec.js`). CI (`.github/workflows/ci.yml`) runs typecheck + lint, Jest, and the Python production build — E2E is NOT run in CI.

## Test File Organization

**Location:**

- Separate `tests/` tree — NOT co-located with source

**Naming:**

- Jest: `*.test.js` — e.g. `tests/unit/utilities.test.js`
- Playwright: `*.spec.js` — e.g. `tests/e2e/crud/npcs.spec.js`
- pytest: `test_*.py`

**Structure:**

```
tests/
├── setup.js                      # Global Jest mocks + factories (setupFilesAfterEach)
├── unit/                         # 7 suites: pure-function + mock-contract tests
│   ├── utilities.test.js         # esc, nextId, getModifier, dice parsing, clamp...
│   ├── entities.test.js          # CRUD on D via setup.js mocks
│   ├── security.test.js          # Deep XSS tests for sanitizeHTML/esc (63 tests)
│   ├── stability.test.js         # Persistence, corrupted JSON, error handling
│   ├── encounter-calculator.test.js
│   ├── markdown-converter.test.js
│   └── markdown-shortcuts.test.js
├── integration/                  # 3 suites: workflow simulations over D-like data
│   ├── character-management.test.js
│   ├── combat-system.test.js     # Initiative sort, turns, HP, conditions
│   └── encounter-builder.test.js
├── e2e/
│   ├── app.spec.js               # Smoke: tabs, basic visibility
│   ├── tab-navigation.spec.js    # Tab registry re-render checks
│   ├── crud/                     # party, npcs, locations, quests, encounters
│   ├── features/                 # dice, initiative, persistence, wiki
│   ├── integration/workflows.spec.js
│   ├── helpers/test-utils.js     # Shared E2E helpers + testData generators
│   ├── reports/                  # HTML report output (generated)
│   └── test-results/             # Failure artifacts (generated)
└── build/test_build_deduplication.py
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
        await loadApp(page); // goto file://dist bundle, wait for .app-title
        await navigateToTab(page, 'npcs');
    });

    test('NPC mit Minimaldaten erstellen', async ({ page }) => {
        const npcName = generateTestName('MinNPC'); // unique via Date.now()
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

- Setup: global `beforeEach(() => resetTestState())` in `tests/setup.js` resets `D`, undo/redo stacks, `localStorage`, and all jest mocks; suites add local `beforeEach` for scenario data
- Teardown: none needed (full reset per test); no `afterEach` in practice
- Assertions: state-based against the `D` data object (unit + E2E via `page.evaluate`); DOM assertions secondary
- E2E selectors target `data-action`/`data-value` attributes (event delegation system), not CSS classes
- Synchronization in E2E currently uses fixed `page.waitForTimeout(300-500)` — fragile; prefer `waitForSelector`/`waitForFunction` when writing new tests
- Test names: German throughout, descriptive sentences (`'sollte Combatants nach Initiative sortieren'`, `'NPC ohne Namen zeigt Fehlermeldung'`)

## Mocking

**Framework:** Jest built-in (`jest.fn()`), configured globally in `tests/setup.js`

**Patterns:**

```javascript
// tests/setup.js — the entire global runtime is mocked, since production
// modules attach to window and cannot be require()d individually:
global.APP_CONFIG = Object.freeze({ VERSION: '2.7.0-test', DEBUG_MODE: false, ... });
global.D = { characters: [], npcs: [], initiative: { combatants: [], currentTurn: 0, round: 1 }, ... };
global.$ = jest.fn(id => document.getElementById(id));
global.esc = jest.fn(s => { /* real escaping logic inline */ });
global.showToast = jest.fn();
global.renderParty = jest.fn();              // all render fns are jest.fn() stubs
global.debounce = jest.fn(fn => fn);         // immediate execution in tests
global.save = jest.fn(() => localStorage.setItem(APP_CONFIG.STORAGE_KEY, safeStringify(D)));
global.saveUndoState = jest.fn(() => { undoStack.push(...); });   // behavioral mock with real stack
```

- Behavioral mocks: `save`/`load`/`undo`/`redo`/`nextTurn`/`deleteChar` etc. are `jest.fn()` with simplified real logic (mock contracts mirroring production behavior)
- `localStorage` replaced by an in-memory mock object with a `store` map
- Mock names must match production functions exactly (`renderInit`, not `renderInitiative` — past bug documented in `CLAUDE.md`)

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
export const testData = { character: () => ({ name: generateTestName('Hero'), ... }), npc: ..., quest: ... };
generateTestName('NPC')   // => 'NPC_Test_1718...' — unique per run via Date.now()
```

**Location:**

- Jest factories: `tests/setup.js` (global `createTestCharacter`, `createTestNPC`, `createTestEncounter`)
- E2E helpers + generators: `tests/e2e/helpers/test-utils.js` (`loadApp`, `navigateToTab`, `fillField`, `selectOption`, `clickAction`, `waitForToast`, `clearAppData`, `getEntityCount`, `getEntityById`, `performUndo`/`performRedo`/`performSave`, `testData`)
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

- `tests/unit/` (7 suites). Two styles:
    1. Real pure functions from `utils/testable-utils.js` (utilities, security, markdown-shortcuts)
    2. Mock-contract tests against `tests/setup.js` behavioral mocks (entities, encounter-calculator, stability)
- `security.test.js` is the deepest suite (63 tests): script injection, event-handler injection, protocol filtering, case variations against `sanitizeHTML`/`esc`

**Integration Tests:**

- `tests/integration/` (3 suites): simulate multi-step workflows (combat rounds, character lifecycle, encounter building) over plain data structures + real calculation functions; no DOM

**E2E Tests:**

- Playwright, `tests/e2e/` (140 tests): smoke (`app.spec.js`), per-entity CRUD (`crud/*.spec.js` — create minimal/full, validation error, edit, delete, undo, search filter), feature flows (`features/*.spec.js`), cross-feature workflows (`integration/workflows.spec.js`), tab-registry re-render checks (`tab-navigation.spec.js`)
- 26 known failures are triaged as test-infrastructure issues (NOT app bugs) in `docs/e2e-failure-triage.md` — check there before "fixing" the app

**Build Tests:**

- `tests/build/test_build_deduplication.py` (pytest, class-based `TestBuildDeduplication`): verifies window-assignment dedup, conflict resolution, syntactic validity of the generated bundle. TDD required for `build.py` changes (failing test commit → implementation commit)

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

**Known caveats for new test work:**

- `tests/unit/markdown-converter.test.js` contains placeholder assertions that only check the input string (comments like `// Would call htmlToMarkdown(html)`) — they pass without exercising `ui/editors/markdown-converter.js`; real conversion tests still need to be wired up
- E2E must run against a fresh build: `npm run build:dev && npm run test:e2e`
- Under `file://`, `localStorage` is restricted — assert persistence via `D`/IndexedDB/`StorageAPI`, not raw `localStorage`
- When adding render functions, test: initial render, re-render on tab switch, re-render after data change, rapid tab switches (see `tests/e2e/tab-navigation.spec.js`)

---

_Testing analysis: 2026-06-11_
