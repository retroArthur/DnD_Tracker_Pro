# Phase 8: Test-Fundament grün - Research

**Researched:** 2026-07-22
**Domain:** E2E/Unit test suite hardening, event-delegation bug diagnosis, CI-gate integration (Playwright + Jest, non-ESM vanilla-JS SPA)
**Confidence:** HIGH — every root-cause claim below was verified by reading the actual production source and/or by running the real build + test suite locally, not by inference from documentation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 (App-Bug-Politik):** Echte App-Bugs, die E2E-Fails verursachen, werden **in Phase 8 gefixt** — egal wie tief (z. B. Verdachtsfall: `#random-tables-list` wird bei Tab-Wechseln 9× ins DOM dupliziert, CONCERNS.md Cluster 3). Begründung: Roadmap-Wortlaut „Fail geklärt = Test-Bug behoben ODER App-Bug gefixt"; nur so sind 0 Fails erreichbar. Bugfixes gelten als verhaltensneutral im Sinne der Milestone-Leitplanke.
  - **RESEARCH UPDATE:** The "#random-tables-list duplicated 9×" theory is **empirically false** — see Common Pitfalls #6. The 9× number in the old triage doc is Playwright's retry-poll counter, not a DOM element count. Verified via a live DOM query (`document.querySelectorAll('#random-tables-list').length` = 1, always). Two *different*, real, narrower app bugs exist in that area instead (see Pitfalls #6 and #7).
- **D-02 (Regressionstest-Pflicht):** Jeder App-Bug-Fix bekommt einen **eigenen gezielten Regressionstest** zusätzlich zum vormals roten E2E-Test: Unit-Test wo möglich, sonst E2E. Der bestehende Test prüft das Symptom, der neue Test die Root-Cause (CLAUDE.md-Muster „Reproduce First").
- **D-03 (CI-Gate):** Die E2E-Suite wird in dieser Phase **blockierend in ci.yml aktiviert**: eigener CI-Job mit Dev-Build (`npm run build:dev`) + `npx playwright test` (Chromium), Failure-Artefakte (Screenshots/Traces) werden hochgeladen. Success Criterion 5 wird damit bewiesen, nicht nur behauptet. Kein `continue-on-error`.
- **D-04 (Härtungs-Reichweite — suite-weit):** Assertion-Härtung **suite-weit systematisch**: Inventar aller Zähl-Assertions (`toBeGreaterThan(0)` u. ä.) in Jest + Playwright, dann härten auf exakte Werte (`toBe(N)`) überall dort, wo ein exakter Wert erwartbar ist. Nicht nur die 11 Fail-Specs.
- **D-05 (waitForTimeout — begrenzt):** Fixe Wartezeiten (`page.waitForTimeout(300–500)`) werden **nur in ohnehin angefassten Specs** durch `waitForSelector`/`waitForFunction` ersetzt (opportunistisch). Kein Flächenumbau stabiler Specs.
- **D-06 (Maskierungs-Kriterium):** `page.evaluate()` ist **verboten**, wenn es den Interaktionspfad ersetzt, den der Test eigentlich prüft (maskierend). Es ist **erlaubt** als dokumentiertes Setup-/Navigations-Vehikel, wenn der Test etwas anderes prüft. Bestands-Ausnahmen aus Phasen 4–6 werden einzeln bewertet, nicht pauschal entfernt/behalten.
- **D-07 (Dokumentation):** Je ehemaligem Fail wird in **`docs/e2e-failure-triage.md`** (bestehendes Dokument, fortschreiben) dokumentiert: Root-Cause-Klassifikation (Test-Bug vs. App-Bug), Fix-Beschreibung, Commit-Hash.

### Claude's Discretion

- Reihenfolge der Arbeit (erst Fails fixen, dann härten — oder verschränkt).
- Konkrete Playwright-Konfigurationsdetails im CI-Job (Timeout-/Retry-/Worker-Werte; Basis: bestehende CI-Werte in `playwright.config.js` — retries 2, workers 1).
- Wie das Zähl-Assertion-Inventar erhoben wird (Grep-Skript vs. manuell). **RESEARCH PROVIDES THIS INVENTORY BELOW** (see Common Pitfalls / Suite-Wide Hardening Inventory) — planner can consume directly instead of re-deriving it.
- Format der Triage-Doku-Fortschreibung (Tabelle vs. Abschnitte), solange je Fail Klassifikation + Fix + Commit enthalten sind.
- Ob der Undo-nach-Delete-Verdacht (CONCERNS.md Cluster 4) noch relevant ist. **RESEARCH ANSWERS THIS:** No longer relevant — see "Cluster 4 (Undo-nach-Delete) is resolved" below. All 5 "Löschen kann rückgängig gemacht werden" E2E tests (encounters, locations, npcs, party, quests) pass in the current baseline run. A one-line note in the triage doc suffices; no code change needed.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. Explicitly NOT chosen: flächendeckender `waitForTimeout`-Umbau stabiler Specs (per D-05 limited to touched specs only).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-01 | Die (bei Phase-Start frisch gemessenen) E2E-Fails sind auf 0 — Ursache je Fall geklärt (Test-Bug vs. App-Bug) | Exact root cause identified for all 11 stable fails + 2 additional flaky fails found during fresh baseline measurement (see Baseline Measurement and Common Pitfalls #1–#8) |
| TEST-02 | Brüchige Test-Muster gehärtet: exakte Zähl-Assertions, keine maskierenden Dispatches, `npx playwright test` läuft vollständig grün als CI-tauglicher Gate | Suite-wide inventory of `toBeGreaterThan(0)`, `page.evaluate()`, and `isVisible()`-guard patterns provided below; CI job design provided (D-03) |
</phase_requirements>

## Summary

This phase does not need new libraries or architecture — it needs precise root-cause diagnosis of a small, well-scoped set of known failures in an already-mature Jest+Playwright suite (453/453 Jest tests green; Playwright is the only red surface), plus systematic hardening of loose assertion patterns. Research for this phase therefore consisted of **running the actual suite fresh and reading the actual production source for every failure**, rather than researching an external technology. All root causes below are traced to specific line numbers and are HIGH confidence.

**Baseline measurement (done as first research step, per context's explicit instruction):** Built the dev bundle (`npm run build:dev` — succeeded, 0 warnings) and ran `npx playwright test` twice. Result: **11 stable, reproducible failures** matching the documented baseline exactly (7 tab-navigation, 2 CRUD attribute-modifier, 1 Quest-title-validation, 1 Global-Search) — **plus 2 additional flaky failures** in run 1 only (`crud/npcs.spec.js:64` and `crud/party.spec.js:129`, both "... ohne Namen zeigt Fehlermeldung") that passed cleanly in run 2. The flaky pair shares the exact same root cause as the Quest-title fail (see Pitfall #4) — fixing that root cause should also stabilize them. Jest: 453/453 passing, no action needed there beyond the D-04 assertion-hardening sweep.

Of the 11 stable fails: **2 are genuine, narrowly-scoped app bugs** (event-delegation last-write-wins collision breaking attribute-modifier display; a fixed-position onboarding banner with no layout compensation blocking a header input), **1 is a genuine but very small app gap** (`renderAll()` — used by undo/redo — omits two render functions that the tab-registry's switchView path does include), and **7 are pure test-code bugs** (stale CSS class selectors that never matched production markup, an ambiguous `document.querySelector('.dice-details')` that silently opens the wrong one of four same-classed `<details>` elements, and a data-shape mismatch where a test writes to `D.timers` — a key that does not exist in the app's data model at all). The previously-documented "DOM duplication" theory for the tab-navigation cluster (CONCERNS.md Cluster 3, restated as a suspected app bug in 08-CONTEXT.md D-01) is **empirically disproven** — see Pitfall #6.

**Primary recommendation:** Fix the 2 confirmed app bugs and the 1 confirmed render-dispatch gap first (small, mechanical diffs in `ui/actions/combat-actions.js`, `assets/styles/migration.css`, `features/render-dashboard.js`); rewrite the 7 test-bug assertions against the real DOM/API surface documented below; then do the suite-wide `toBe(N)` hardening pass (inventory provided) and wire the CI job per D-03.

## Architectural Responsibility Map

This is a single-tier client-side SPA (no backend/API tier) plus a build/CI tooling tier. Mapping capabilities relevant to this phase:

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Attribute-modifier live calculation (`update-attr-mod`) | Browser/Client (event-delegation action handlers) | — | Pure DOM read/write triggered by `input`/`change` events; no persistence involved until save |
| Tab re-render dispatch (`TAB_RENDER_REGISTRY`, `renderAll()`) | Browser/Client (render-orchestration layer) | — | Two parallel dispatch paths exist in the same tier (switchView-driven vs. undo/redo/import-driven) — see Pitfall #7 |
| Toast/notification display (`showToast`, legacy `#toast`) | Browser/Client (UI feedback layer) | — | Single shared DOM node; last writer wins, no per-severity priority queue |
| Onboarding/migration banners (`migration-hint-banner`) | Browser/Client (fixed-position overlay layer) | — | Inserted as `document.body.firstChild`, layered above the sticky header via z-index, with no corresponding layout offset |
| E2E test execution | Browser/Client (real Chromium, driven by Playwright) | Build/CI tooling | Tests run against the actual built bundle via `file://`, not a mock DOM |
| Unit test execution | Node/Build tooling (Jest + jsdom) | — | No real browser; relies on `tests/setup.js` global mocks and `utils/testable-utils.js` real-function copies |
| CI gate enforcement | Build/CI tooling (`.github/workflows/ci.yml`) | — | New job needed per D-03; existing `smoke-test` job is a different, already-green, production-build smoke check — do not conflate the two |

## Standard Stack

No new libraries are needed for this phase — it is entirely diagnostic/hardening work against the existing, already-correct stack.

### Core (existing, unchanged)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | 1.57.0 [VERIFIED: local install — `npx playwright --version`] | E2E test runner | Already the project's chosen E2E tool; config at `playwright.config.js` is sound (file:// baseURL against dev bundle, CI retries=2/workers=1) |
| `jest` | 30.2.0 (installed: 30.1.3 per `npx jest --version`) [VERIFIED: local install] | Unit test runner | Already green (453/453); no changes needed to the runner itself |
| `jest-environment-jsdom` | 30.2.0 [VERIFIED: package.json] | DOM shimming for Jest | Unchanged |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fixing the 7 test-bugs in place | Rewriting `tab-navigation.spec.js` from scratch | Rejected — the test file's *intent* (verify tab-registry re-render behavior) is correct and valuable; only the selectors/data-shapes are wrong. A full rewrite risks losing coverage of edge cases (empty-state, rapid-switch, import-triggered re-render) that currently pass. Fix the specific broken assertions, keep the rest. |
| Manual `toBeGreaterThan(0)` → `toBe(N)` sweep by hand | A codemod/AST-based batch replace | For 23 occurrences across 10 files, manual review is safer — each site needs a human judgment call on whether an exact count is actually determinable (some legitimately can't be, e.g. counting pre-seeded default data whose size may change) |

**Installation:** None required — no `npm install` needed for this phase.

## Package Legitimacy Audit

**Not applicable.** This phase installs no new external packages (npm, pip, or otherwise). All work is against the existing `devDependencies` already present in `package.json`. Skip the Package Legitimacy Gate protocol.

## Architecture Patterns

### System Architecture Diagram — Event-Delegation Action Dispatch (relevant to the confirmed app bugs)

```
User types in #char-str (number input)
        │
        ▼
document 'input' event (bubbles, captured by EventDelegation.init())
        │
        ▼
EventDelegation._handleInput(e)
        │
        ├─ target.dataset.action = "update-attr-mod"
        ├─ ctx.value = target.value || target.dataset.value   ← ⚠️ for 'input' events,
        │                                                          target.value (typed number)
        │                                                          WINS over dataset.value (attr name)
        ▼
this._handlers.get('update-attr-mod')(ctx)
        │
        ▼
   Which handler is registered here depends on ui/actions/*.js LOAD ORDER
   (loader.js: entity-actions.js loads BEFORE combat-actions.js)
        │
        ├─ entity-actions.js's EntityActions['update-attr-mod']   [loads 1st, registers 1st]
        │     ctx => updateAttrMod(ctx.target.dataset.value)      ← CORRECT: always the attr name
        │
        └─ combat-actions.js's CombatActions['update-attr-mod']   [loads 2nd, OVERWRITES the above]
              ctx => updateAttrMod(ctx.value, ctx.target.id)      ← BROKEN: passes typed number as
                                                                     attr name on 'input' events
        ▼
updateAttrMod("16")  // "16" treated as attribute name
        │
        ▼
$(`char-16`) → null → early return (guard: `if (!input || !modEl) return;`)
        │
        ▼
#char-str-mod never updates — stays "+0" forever
```

### System Architecture Diagram — Two Parallel Re-Render Dispatch Paths (relevant to Pitfall #7)

```
Path A: switchView(tabName)                     Path B: undo() / redo()
        │                                                │
        ▼                                                ▼
renderTabContent(tabName)                        (state restored from JSON snapshot)
  systems/tab-registry.js                                │
  TAB_RENDER_REGISTRY[tabName].renders.forEach(...)      ▼
  dice:  ['renderRandomTables',                   renderAll()
          'renderDiceHistory',                      features/render-dashboard.js
          'renderDiceFavorites']                    renderSafe(renderParty, ...)
  timers: ['renderTimers',                          renderSafe(renderNPCList, ...)
           'renderTimerPresets']                    renderSafe(renderLocations, ...)
        │                                            renderSafe(renderQuests, ...)
        ▼                                            renderSafe(renderEncounters, ...)
  ALL relevant render fns called                     renderSafe(renderInit, ...)
                                                       renderSafe(renderLoot, ...)
                                                       renderSafe(renderShops, ...)
                                                       renderSafe(renderSpells, ...)
                                                       renderSafe(renderSessions, ...)
                                                       renderSafe(renderLinks, ...)
                                                       renderSafe(renderWiki, ...)
                                                       renderSafe(renderFilterList, ...)
                                                       renderSafe(initQuickRefCustom, ...)
                                                             │
                                                             ▼
                                              ⚠️ renderRandomTables and renderTimers
                                                 are NOT in this list — if the dice or
                                                 timers tab is active when undo/redo/
                                                 import fires, that panel goes stale
                                                 until the user switches tabs away and back
```

### Recommended Fix Structure (no new files needed)
```
ui/actions/combat-actions.js       # remove 2 broken duplicate-key registrations (lines ~176-177)
features/render-dashboard.js       # add renderRandomTables + renderTimers to renderAll()'s dispatch list
assets/styles/migration.css        # add layout offset when .migration-hint-banner is present
tests/e2e/tab-navigation.spec.js   # fix 6 stale selectors/data-shapes (see Pitfalls #5, #6, #8)
tests/e2e/app.spec.js              # dismiss/account for migration-hint-banner before clicking #global-search
tests/e2e/crud/quests.spec.js      # fix toast-race timing (see Pitfall #4)
docs/e2e-failure-triage.md         # append per-fail classification (D-07)
.github/workflows/ci.yml           # new blocking e2e job (D-03)
```

### Pattern: EventDelegation Last-Write-Wins Collision Detection
**What:** Multiple `ui/actions/*.js` modules can register the same `data-action` key; `EventDelegation.registerAction()` silently overwrites without warning. `loader.js`'s array order determines which registration survives.
**When to use (as a verification step, not a runtime pattern):** Before trusting any `data-action` handler, grep for duplicate keys across `ui/actions/*.js`.
**Example (verification script used in this research — safe to reuse in an added test):**
```javascript
// Source: this research session — ad-hoc Node script scanning ui/actions/*.js
const fs = require('fs');
const path = require('path');
const dir = 'ui/actions';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
const seen = {};
for (const f of files) {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    const re = /^\s*'([a-zA-Z0-9_-]+)':/gm;
    let m;
    while ((m = re.exec(content))) {
        (seen[m[1]] ??= []).push(f);
    }
}
for (const [key, filesList] of Object.entries(seen)) {
    if (new Set(filesList).size > 1) console.log(key, '->', filesList.join(', '));
}
// Result on current codebase (verified 2026-07-22):
//   apply-quick-action -> combat-actions.js, system-actions.js   (harmless — both pass an
//                                                                  already-int ctx.id; parseInt
//                                                                  is idempotent. Optional cleanup only.)
//   update-attr-mod -> combat-actions.js, entity-actions.js       (BROKEN — see Pitfall #1)
//   update-enc-attr-mod -> combat-actions.js, entity-actions.js   (BROKEN — see Pitfall #2)
```
This script found **all three** duplicate-key registrations that exist in the entire `ui/actions/` directory — the scan is exhaustive, not sampled. Recommend adding a permanent version of this check as a Jest unit test (see D-02 regression-test guidance in Pitfall #1) so a future `data-action` name collision fails CI instead of silently regressing behavior again.

### Anti-Patterns to Avoid
- **Registering the same `data-action` key in two different action modules:** No compile-time or lint-time protection exists for this (ESLint doesn't know about the string-keyed dispatch table). The only defense is the grep-based check above; recommend making it a permanent Jest test, not a one-off script.
- **Reading `ctx.value` in an action handler that's meant to receive a `dataset` attribute, when the handler can be triggered by 'input'/'change' events:** `EventDelegation._handleInput`/`_handleChange` set `ctx.value = target.value || target.dataset.value` (the live input value wins), while `_handleClick` sets `ctx.value = target.dataset.value` only. A handler registered for an input's `data-action` must use `ctx.target.dataset.value` explicitly if it needs the static attribute, never `ctx.value`.
- **`document.querySelector('.someClass')` when multiple elements share that class:** Silently returns the first DOM-order match with no error. `view-tools.html` has 4 separate `<details class="dice-details">` blocks; any code (test or production) needing a *specific* one must scope the query (e.g., `document.querySelector('#random-tables-list').closest('details')`) or give the target a unique class/id.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Waiting for an async DOM state before asserting | Custom polling loops or longer `waitForTimeout` | Playwright's built-in auto-retrying `expect(locator).toBeVisible()/.toHaveCount()/.toContainText()` (already the dominant pattern in this suite) | Already used correctly almost everywhere; the 7 test-bugs are selector/data mistakes, not missing-wait mistakes — do not "fix" them by adding more waits |
| Detecting duplicate `data-action` key registrations | Manual code review before every PR | The exhaustive grep/AST scan shown above, promoted to a permanent Jest test | Manual review already missed 3 real collisions across the codebase's history; a cheap static check catches 100% of them going forward |

**Key insight:** This phase's bugs are not "missing test infrastructure" problems — the infrastructure (Playwright config, helpers, EventDelegation, TAB_RENDER_REGISTRY) is sound. They are precision problems: one wrong variable read (`ctx.value` vs `ctx.dataset.value`), one wrong CSS selector cardinality assumption (`querySelector` on a class shared by 4 elements), one incomplete dispatch list (`renderAll()` missing 2 of 14 render functions), and one missing layout offset (a fixed banner with no corresponding push-down). Fixes are small and mechanical; the value of this research is having located them precisely instead of the plan needing to re-discover them via trial and error.

## Common Pitfalls

### Pitfall 1 (CONFIRMED APP BUG): Attribute-modifier display broken by duplicate `update-attr-mod` registration
**What goes wrong:** Typing a STR/DEX/CON/INT/WIS/CHA score in the character-creation form never updates the `+N` modifier badge next to it (`#char-str-mod` etc. stay at `+0` forever).
**Why it happens:** `ui/actions/entity-actions.js:447` registers the correct handler (`ctx => updateAttrMod(ctx.target.dataset.value)`), but `ui/actions/combat-actions.js:176` registers a **different, broken** handler under the *same* `data-action` key (`ctx => updateAttrMod(ctx.value, ctx.target.id)`). Because `combat-actions.js` loads *after* `entity-actions.js` in `loader.js` (lines 154–155), its registration silently wins (`EventDelegation.registerAction` has no collision guard). Since the input fires an `input` event, `EventDelegation._handleInput` sets `ctx.value = target.value` (the number just typed, e.g. `"16"`), not the attribute name. `updateAttrMod("16")` then does `$('char-16')` → `null` → the function's own guard (`features/party/party-crud.js:14`: `if (!input || !modEl) return;`) silently no-ops.
**Fix (source-level, ~1 line):** Delete the `'update-attr-mod'` and `'update-enc-attr-mod'` entries from `CombatActions` in `combat-actions.js` (lines 176–177). `entity-actions.js`'s correct registrations then remain unchallenged. Verified: `updateAttrMod(attr)` and `updateEncAttrMod(attr)` both take exactly one parameter (`party-crud.d.ts:4`, `encounters-crud.d.ts:1`) — the `entity-actions.js` call signature already matches; `combat-actions.js`'s never did.
**Same bug, same fix, same file — Encounter form:** `ui/actions/entity-actions.js:457` (correct) vs. `ui/actions/combat-actions.js:177` (broken, identical pattern) for `update-enc-attr-mod` / `updateEncAttrMod`. This is `crud/encounters.spec.js:87`'s exact failure (`#enc-str-mod` stuck at `+0`).
**Regression test (D-02):** Add a Jest unit test asserting no duplicate `data-action` keys exist across `ui/actions/*.js` (the scan script under Architecture Patterns above is ready to adapt — it already found exactly these 2 broken collisions plus 1 harmless one with zero false positives). This is a root-cause test (catches the *class* of bug), complementing the existing (previously red) `crud/party.spec.js:109` and `crud/encounters.spec.js:87` E2E tests which catch the *symptom*.
**Warning signs:** Any new `data-action` added to more than one `ui/actions/*.js` file with different call signatures.

### Pitfall 2: Same root cause, second symptom — `crud/party.spec.js:109` (STR/DEX modifiers)
See Pitfall 1 — `crud/party.spec.js:109 "Attribut-Modifikatoren werden berechnet"` and `crud/encounters.spec.js:87` are the same bug in the same two files, fixed by the same one-line deletion.

### Pitfall 3 (CONFIRMED APP BUG): Global Search input unclickable — fixed banner with no layout offset
**What goes wrong:** `tests/e2e/app.spec.js:69 "Global Search ist fokussierbar"` times out — Playwright's click retries for 30s because `<span class="migration-hint-text">` "intercepts pointer events".
**Why it happens:** `systems/migration/migration-wizard.js:showMigrationHintBanner()` inserts `#migration-hint-banner` as `document.body.firstChild` on every fresh session (guarded only by a `sessionStorage` flag, so it reliably shows on first load in any fresh browser context — which is every Playwright test unless storage is pre-seeded). Its CSS (`assets/styles/migration.css:246-260`) is `position: fixed; top: 0; z-index: 990; min-height: 48px`. The app header (`assets/styles/core.css:298-304`) is `position: sticky; top: 0; z-index: 100` — lower z-index, same top anchor, **no compensating `padding-top`/`margin-top` is ever applied to the header or body when the banner is present**. The banner therefore visually and interactively covers the top ~48px of the viewport, including `#global-search` which lives in the header. This is a real, user-facing bug independent of tests: **any real user's first ~session, clicking anything in the top 48px of the header (search, nav-tab overflow, etc.) may be intercepted by this banner** until they scroll or dismiss it.
**Fix (CSS-level, low-risk):** When `#migration-hint-banner` is present, apply a `padding-top: 48px` (or the banner's actual measured height) to `body` or `.app-header`'s sibling content — mirroring the existing precedent one selector away: `assets/styles/migration.css:352-354` already does exactly this compensation for `.divergence-banner` (`.migration-hint-banner ~ .divergence-banner { top: 48px; }`), it just never got extended to the main app content. Alternative lower-risk fix: toggle a `body.has-migration-hint` class from `showMigrationHintBanner()`/`close-migration-hint`/`start-migration-flow` handlers and add the padding rule scoped to that class (cleaner, avoids `~` combinator selector fragility, self-documenting).
**Regression test (D-02):** New Jest or Playwright test asserting that when the banner is present, `#global-search` (or a header target of choice) is not covered — e.g., compare `getBoundingClientRect()` of the banner vs. the header's clickable region, or (simpler, E2E) actually attempt the click without a workaround and assert the search input receives focus within the default timeout.
**Test-side interim behavior:** Regardless of the app fix, the test itself should not silently `{force: true}` around the banner (that would mask a real interaction-path problem per D-06) — after the app fix lands, the natural click will simply succeed. If sequencing the app fix after the test fix, the test may need to first click `[data-action="close-migration-hint"]` as a *documented* setup step (D-06-legitimate, since the test's actual subject is the search input, not the banner).
**Warning signs:** Any future fixed-position overlay inserted at `document.body.firstChild` without a paired layout-offset mechanism.

### Pitfall 4 (Test-Bug, suite-wide risk — non-deterministic): Onboarding toast races validation-error toast
**What goes wrong:** `crud/quests.spec.js:96 "Quest ohne Titel zeigt Fehlermeldung"` expects `#toast` to contain `"Titel"` but instead sees `"📝 Neu: Markdown Shortcuts aktiviert! ..."`. This is **not always reproducible on the first attempt** — in a second full suite run, this exact test still failed, but two *different* validation-toast tests (`crud/npcs.spec.js:64`, `crud/party.spec.js:129`, both "... zeigt Fehlermeldung") failed once in run 1 and passed cleanly in run 2, confirming the same race affects any toast-content assertion that runs within roughly the first 2–7 seconds after app load.
**Why it happens:** `ui/editors/markdown-shortcuts.js:240-253` schedules a one-time onboarding toast via `setTimeout(..., 2000)` after `initMarkdownSettings()` runs during app init (`core/init.js:102`). `showToast()`'s backward-compat legacy `#toast` element (`utils/utilities.js:315-327`) is a **single shared DOM node whose `textContent` is unconditionally overwritten** by whatever `showToast()` call happens last — there is no priority queue and no "don't overwrite an error while it's still showing" guard. Playwright's `toContainText` assertion polls for up to 5000ms; if the onboarding `setTimeout` fires inside that polling window (it reliably does, since `loadApp()` + `navigateToTab()` + modal-open together already consume ~1.1s before the test even clicks Save), the onboarding toast's `info`-type message overwrites the just-shown `error`-type validation message, and since its `duration` is 8000ms it does not disappear before the assertion times out.
**Fix options (pick one, or combine):**
  1. **Test-side (minimal, no app risk):** In each affected test's `beforeEach`/setup, pre-set `D.settings.markdownOnboardingSeen = true` via `page.evaluate()` before the app's init-time check runs — i.e., seed it into `localStorage` before `page.goto()`, or call `page.addInitScript()` so the onboarding never schedules. This is a legitimate, documented setup step (not masking per D-06 — the test isn't testing the onboarding flow).
  2. **App-side (small, arguably correct UX fix, optional per D-01 discretion since this is borderline "genuinely broken" vs. "acceptable but racy"):** In `showToast()`, don't let an `info`-priority toast overwrite the legacy `#toast` element while an `error`/`warning`-type toast is still visible (e.g., track the currently-displayed type and skip lower-priority overwrites, or extend the event-log's multi-entry model to the legacy element too). This would also protect real users from an onboarding tip visually stomping a genuine validation error during their first session.
**Recommendation:** Do option 1 (test-side fix) as the primary, low-risk fix satisfying TEST-01 for the 3 currently-affected tests; consider option 2 opportunistically if D-04's assertion-hardening pass is already touching `showToast()`'s call sites, but it is not required to reach 0 fails.
**Regression test (D-02):** A dedicated test asserting the onboarding toast never fires within N seconds of a fresh `loadApp()` in test mode (asserting the seeded flag suppressed it), OR — simpler — a test that intentionally lets 3+ seconds pass and confirms a *subsequent* real validation error still displays correctly (proving the masking can't happen once seeded).
**Warning signs:** Any E2E test asserting exact toast text within the first ~10 seconds of a fresh session.

### Pitfall 5 (Test-Bug): Stale CSS class selectors that never existed in production
**What goes wrong:** 3 of the 7 tab-navigation failures use CSS classes that do not exist anywhere in the actual codebase:
  - `tests/e2e/tab-navigation.spec.js:201-204` (`initiative tab renders combat tracker`) and `:244` (`initiative tab re-renders when switching back`) assert `.init-combatant` — the real class emitted by `renderInit()` (`features/initiative.js:148,175`) is **`.init-entry`** (plus `.init-row`, `.${cb.type}`, etc.).
  - `tests/e2e/tab-navigation.spec.js:298` (`party tab re-renders when switching back`) asserts `.party-member` — the real class emitted by `renderParty()` (`features/party/party-render.js:167`) is **`.char-card`**.
**Why it happens:** This is the exact historical bug pattern CLAUDE.md already documents under "Tab Navigation Architecture" ("Test mocks referenced `renderInitiative` which didn't exist (actual: `renderInit`)") — recurring here as a *class name* mismatch instead of a function name mismatch. These selectors appear to have been written speculatively/aspirationally rather than copied from actual rendered output, and never caught because the suite was never green enough to notice new stale selectors added alongside real ones.
**Fix:** Replace `.init-combatant` → `.init-entry` and `.party-member` → `.char-card` in the 3 assertions. Verify the exact HTML shape (`draggable="true" data-id="${cb.id}"` for init-entry; `id="char-${ch.id}" data-id="${ch.id}"` for char-card) so any `.first()`/`.nth(1)` text assertions still target the right sub-element for name/HP display.
**Warning signs:** Any E2E selector using a class name — before trusting it, grep the actual render function's template string for that literal class name.

### Pitfall 6 (Test-Bug — corrects a previously-documented false theory): Ambiguous `.dice-details` selector opens the wrong collapsible panel
**What goes wrong:** `tests/e2e/tab-navigation.spec.js:91` (`dice tab renders random tables`) and `:411` (`switching to tab with no data shows empty state`) assert `#random-tables-list` `.toBeVisible()` and get `Received: hidden`.
**Why it happens — VERIFIED empirically, not just by code reading:** `assets/templates/view-tools.html` contains **4 separate `<details class="dice-details">` blocks** (lines 118, 135, 171, 216 — character-roll sections plus the random-tables section). The test's setup code does `document.querySelector('.dice-details').open = true` (lines 78, 117, 142, 400, 515) to expand the collapsible panel before asserting — but `querySelector` with a class shared by 4 elements always returns the **first DOM-order match** (the character-attribute-rolls `<details>` at line 118), never the random-tables one at line 216. The random-tables `<details>` stays closed, and a closed native `<details>` element hides its non-`<summary>` children — hence `#random-tables-list` genuinely is `hidden`, exactly as reported. This is **not** an app bug; native `<details>`/`<summary>` behaves correctly.
**Empirical proof the "9× DOM duplication" theory (CONCERNS.md Cluster 3, restated in 08-CONTEXT.md D-01) is wrong:** Ran a diagnostic script (`document.evaluate(() => document.querySelectorAll('#random-tables-list').length)`) against the live built bundle across multiple tab switches — **the count is always exactly 1**. The "9 ×" figure in Playwright's failure output (`9 × locator resolved to <div id="random-tables-list">…</div>`) is Playwright's own **retry-polling counter** (it re-resolves the locator on each polling tick while waiting up to the 5000ms expect-timeout, logging each attempt) — not evidence of 9 distinct DOM nodes. This was a misreading in the original May 2026 triage that propagated into CONCERNS.md and then into this phase's own context document as a "suspected app bug." **No app-side DOM-duplication fix is needed for this cluster.**
**Fix:** Scope the query precisely, e.g. `document.getElementById('random-tables-list').closest('details')` (or add a unique class to that specific `<details>` element in `view-tools.html`, which is the cleaner long-term fix and also removes the ambiguity for any future test/code touching this markup). Apply at all 5 call sites listed above (2 of which are in currently-failing tests; the other 3 are in currently-passing tests that only assert `.toContainText()` on `.rt-card` — which doesn't require visibility, so they pass by accident today; fixing the selector everywhere prevents this from becoming a real bug of its own if someone later changes those tests to check visibility).
**Regression consideration:** None needed beyond fixing the selector — this was never an app bug.
**Warning signs:** Any `document.querySelector()` (singular) call against a class name — grep for how many elements share that class before trusting `querySelector`'s "first match" semantics.

### Pitfall 7 (CONFIRMED APP BUG, narrow scope): `renderAll()` omits `renderRandomTables` and `renderTimers`
**What goes wrong:** `tests/e2e/tab-navigation.spec.js:552` (`undo/redo triggers re-render on active tab`) adds a 2nd random table, confirms `.rt-card` count is 2, calls `window.undo()`, and expects the count to drop back to 1 — it stays at 2.
**Why it happens:** `undo()`/`redo()` (`systems/undo.js:53,86`) both call `window.renderAll()` to refresh the UI after restoring a snapshot. `renderAll()` (`features/render-dashboard.js:48-61`) calls `renderSafe()` for exactly 14 named functions: `renderParty, renderNPCList, renderLocations, renderQuests, renderEncounters, renderInit, renderLoot, renderShops, renderSpells, renderSessions, renderLinks, renderWiki, renderFilterList, initQuickRefCustom`. **`renderRandomTables` and `renderTimers` are not in this list**, even though both exist and are registered per-tab in `systems/tab-registry.js` (`TAB_RENDER_REGISTRY.dice.renders` and `.timers.renders`). If the dice or timers tab happens to be the active tab when an undo/redo (or anything else that calls `renderAll()` instead of going through `switchView`) fires, that panel silently goes stale until the user navigates away and back.
**Fix (1-line addition each):** Add `renderSafe(renderRandomTables, 'renderRandomTables', 'random-tables-list')` and `renderSafe(renderTimers, 'renderTimers', 'timer-list')` (verify the actual timers container id before wiring the 3rd arg) to `renderAll()`'s dispatch list in `features/render-dashboard.js`. Both functions already have defensive "container missing" guards (`features/random-tables.js:154-158` for random tables) so calling them when their tab isn't active is a safe no-op.
**Regression test (D-02):** A unit test isn't practical here (render functions are DOM-dependent globals mocked in Jest, and the interesting behavior is real-DOM re-render). Use a dedicated E2E test that isolates just this behavior (undo while on the dice tab specifically produces the count drop) — the existing (previously red) `tab-navigation.spec.js:552` test already does this once the selector-ambiguity issue upstream (Pitfall #6) is not a confound; confirm this test's `.dice-details` selector usage (line 515) is also fixed per Pitfall #6, or this test will still fail for the wrong reason even after the `renderAll()` fix.
**Scope check — is `renderTimers` actually needed for TEST-01?** The `timers` tab-navigation test that's currently failing (line 353, Pitfall #8) doesn't test undo — it tests plain switch-away/switch-back, which already goes through `TAB_RENDER_REGISTRY` (not `renderAll()`). Adding `renderTimers` to `renderAll()` is a legitimate proactive parity fix (same class of gap as random-tables) but is not strictly required to turn any of the 11 currently-red tests green. Recommend doing it anyway since it's the same one-line pattern and directly prevents a symmetrical future bug report, but flag to the planner as optional-but-cheap.
**Warning signs:** Any new tab's render function added to `TAB_RENDER_REGISTRY` should be cross-checked against `renderAll()`'s list — they are two independent, manually-maintained lists of "things to re-render," and nothing keeps them in sync.

### Pitfall 8 (Test-Bug, two compounding mistakes): Timers test uses a non-existent data location and a stale selector
**What goes wrong:** `tests/e2e/tab-navigation.spec.js:353 "timers tab re-renders when switching back"` pushes a timer into `window.D.timers` then asserts `.timer-item` is visible — it fails with "element(s) not found" (not even `hidden`, i.e. it's not in the DOM at all).
**Why it happens — two separate bugs, verified independently:**
  1. **Wrong data location:** `features/timers/timers.js:8` declares `let timers = []` as a **module-local closure variable**, completely separate from the global `D` object. `core/data.js` (the app's data schema) has **no `timers` key at all** — timers are intentionally session/runtime-only state, never persisted. The test's `window.D.timers.push(...)` writes to a location `renderTimers()` (`timers.js:309`) never reads; it reads the local `timers` array instead, populated only via the real API (`createTimer()`, `addTimerWithSeconds(name, totalSeconds)`).
  2. **Wrong CSS class:** Even if the data were wired correctly, the real class name (`timers.js:320`) is **`.timer-card`**, not `.timer-item`. The real timer object shape is also `{ id, name, totalSeconds, remainingSeconds, running }` (`timers.js:175-181`), not `{ id, name, seconds, active }` as the test constructs.
**Fix:** Rewrite the test setup to call the real API via `page.evaluate(() => window.addTimerWithSeconds('Concentration', 300))` (or drive the actual `#timer-name`/`#timer-minutes`/`#timer-seconds` form + `createTimer()` click through the UI, consistent with the suite's general preference for real interaction over `page.evaluate()` shortcuts — see D-06), then assert against `.timer-card` containing the timer name.
**Regression consideration:** None needed beyond fixing the test — this is not an app bug; the app's actual timer creation flow works (per `features/timers/timers.js` and its own internal consistency), the test simply never exercised it correctly.
**Warning signs:** Any E2E test writing directly to `window.D.<key>` should be cross-checked against `core/data.js`'s actual schema — not every feature's runtime state lives on `D`.

### Cluster 4 (Undo-nach-Delete) is resolved — no code fix needed
The 08-CONTEXT.md discretion item asks whether CONCERNS.md's "Undo may not restore deleted entities" suspicion (originally from the May 2026 triage, Cluster 4) is still relevant. **Verified: no.** In the current baseline run, all 5 "Löschen kann rückgängig gemacht werden" E2E tests pass cleanly: `crud/encounters.spec.js:214`, `crud/locations.spec.js:196`, `crud/npcs.spec.js:265`, `crud/party.spec.js:248`, `crud/quests.spec.js:245`. This was very likely fixed as a side effect of one of the CRUD-hardening phases between the original triage (May 2026) and now (Phase 4's initiative-helper rewrite and/or subsequent phases). **Recommendation for D-07:** add a one-line note to `docs/e2e-failure-triage.md`'s Cluster 4 section marking it resolved-by-other-work, with today's baseline run as evidence; no dedicated fix task needed in this phase's plan.

## Suite-Wide Hardening Inventory (for D-04 / TEST-02)

Exhaustive grep counts across `tests/e2e/` (Playwright) and `tests/unit/` + `tests/integration/` (Jest), run 2026-07-22 against current `main` (commit `b23c82b`):

| Pattern | Count | Files | Notes for planner |
|---------|-------|-------|--------------------|
| `toBeGreaterThan(0)` | 23 | 10 files (`bestiary.spec.js` 8, `character-advancement.spec.js` 2, `dice-stats.spec.js` 2, `welt-story.spec.js`/`initiative.spec.js` 1 each E2E; `stability.test.js` 3, `welt-story.test.js`/`action-registry.test.js` 2 each, `encounter-builder.test.js` 1 Jest) | Primary D-04 hardening target. Each site needs a judgment call: is the count deterministic given the test's own setup data? Most CRUD-list-length assertions after a known number of creates/deletes should harden to `toBe(N)`; a few (fuzzy-search "at least N results", SRD monster count checks) may legitimately stay loose — document the reason inline if kept loose. |
| `page.evaluate(...)` | 265 | 20 E2E files | NOT all masking — per D-06, only flag ones that **replace the interaction under test**. The dominant legitimate use in this suite is state assertion (`page.evaluate(() => D.characters.find(...))`), which is the suite's own documented convention (`TESTING.md`: "Assertions primär state-basiert gegen `D`"). Only audit `page.evaluate()` calls that simulate a *user action* (clicks, form fills, keyboard) in place of real Playwright interaction APIs — cross-reference against the specific Bestandsausnahmen named in context D-06 (`page.evaluate(nextTurn)` in `initiative.spec.js`, `page.evaluate(switchView)` in `welt-story.spec.js`). |
| `isVisible())` used as a conditional test-skip guard | 87 | 12 E2E files | This is the exact pattern the 2026-06-14 initiative-suite audit found masking whole test bodies (`if (await addBtn.isVisible())`). Every occurrence should be reviewed: if the guarded code contains the test's *only* assertions, the guard is masking a real "element not found" failure as a silent pass. Flag any test where 100% of its `expect()` calls are inside such a guard. |
| `waitForTimeout(...)` | 395 | 22 E2E files | Per D-05, only replace within specs already being touched for the 11-fail fixes above: `app.spec.js`, `tab-navigation.spec.js`, `crud/quests.spec.js`, `crud/party.spec.js`, `crud/encounters.spec.js`, `crud/npcs.spec.js` (touched for Pitfall #4's toast-race fix). Do not sweep the other 16 files. |

## Code Examples

### Fix for Pitfall 1 & 2 (attribute-modifier bug)
```javascript
// Source: ui/actions/combat-actions.js — DELETE these 2 lines (they are dead-weight
// duplicates that currently break the feature; entity-actions.js already has the
// correct, single-argument registrations that will "win" once these are gone)
//
// BEFORE (combat-actions.js:176-177):
    'update-attr-mod': ctx => updateAttrMod(ctx.value, ctx.target.id),
    'update-enc-attr-mod': ctx => updateEncAttrMod(ctx.value, ctx.target.id),
//
// AFTER: (lines removed entirely — no replacement needed, entity-actions.js already
// registers the correct handlers at lines 447 and 457)
```

### Fix for Pitfall 6 (ambiguous `.dice-details` selector)
```javascript
// Source: tests/e2e/tab-navigation.spec.js — replace at all 5 call sites (lines 78, 117, 142, 400, 515)
// BEFORE:
const details = document.querySelector('.dice-details');
if (details) details.open = true;

// AFTER (scope via the element we actually care about):
const details = document.getElementById('random-tables-list')?.closest('details');
if (details) details.open = true;
```

### Fix for Pitfall 7 (`renderAll()` gap)
```javascript
// Source: features/render-dashboard.js — add alongside the existing renderSafe(...) calls (~line 58)
renderSafe(renderRandomTables, 'renderRandomTables', 'random-tables-list');
renderSafe(renderTimers, 'renderTimers'); // verify actual timer-list container id before adding 3rd arg
```

### Fix for Pitfall 8 (timers test — real API instead of fake data location)
```javascript
// Source: tests/e2e/tab-navigation.spec.js:330-339 — replace the D.timers.push setup
// BEFORE:
await page.evaluate(() => {
    if (!window.D.timers) window.D.timers = [];
    window.D.timers.push({ id: 1, name: 'Concentration', seconds: 300, active: false });
    window.save();
});
// ...
const timer = page.locator('.timer-item');
await expect(timer).toBeVisible();

// AFTER:
await page.evaluate(() => window.addTimerWithSeconds('Concentration', 300));
// ...
const timer = page.locator('.timer-card');
await expect(timer).toBeVisible();
await expect(timer).toContainText('Concentration');
```

### CI job addition for D-03
```yaml
# Source: .github/workflows/ci.yml — new job, modeled on the existing smoke-test job's
# structure but against the DEV bundle (not production) and the full e2e suite (not just smoke.spec.js)
e2e:
  runs-on: ubuntu-latest
  needs: [lint-and-typecheck, test]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - uses: actions/setup-python@v5
      with:
        python-version: '3.x'
    - run: npm ci
    - run: python build.py   # dev build (per D-03) — NOT --production
    - run: npx playwright install --with-deps chromium
    - run: npx playwright test   # uses playwright.config.js defaults: retries=2, workers=1 in CI
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: |
          tests/e2e/reports/
          tests/e2e/test-results/
        retention-days: 7
```
Note: `deploy` and other later jobs already depend on `[smoke-test]`, which itself depends on `[build]` (production build path). This new `e2e` job is independent of that chain — it should gate the same way `test`/`lint-and-typecheck` do (i.e., consider adding it to `build`'s `needs` array too if the intent is "nothing merges/deploys unless e2e is green," matching D-03's "blockierend" requirement). Confirm with the plan whether `build`/`smoke-test`/`deploy` should additionally depend on this new `e2e` job, or whether it's sufficient as a parallel required check via branch protection rules (outside this repo's `ci.yml`, GitHub Settings territory — flag as an Open Question below since it's a GitHub-project-settings action GSD can't verify from the repo alone).

## State of the Art

Not applicable in the traditional sense (no external ecosystem shift to track) — the one relevant "old vs. new" contrast is internal:

| Old Approach (documented, historical) | Current Approach (this research confirms it's already in place) | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ad-hoc `isVisible()` guards masking whole test bodies (documented 2026-06-14 initiative audit) | Real selectors + hard assertions, `isVisible()` guards used only for genuinely-optional UI (e.g., "if this field exists in this variant of the form") | 2026-06-14 (initiative suite) | This phase should apply the same discipline to the remaining 87 `isVisible())` occurrences per the Suite-Wide Hardening Inventory above — most are probably legitimate optional-field guards (established pattern per `TESTING.md`), but each needs the same audit the initiative suite got |

**Deprecated/outdated:** The "9× DOM duplication" theory for `#random-tables-list` (CONCERNS.md, `docs/e2e-failure-triage.md` Cluster 3) should be marked superseded/corrected in `docs/e2e-failure-triage.md` per D-07 — it was a misreading of Playwright's own diagnostic log format, not a real finding.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Option 1 (test-side seeding of `markdownOnboardingSeen`) is sufficient to stabilize all 3 toast-race-affected tests (Pitfall 4) without an app-side fix | Pitfall 4 | If some other unrelated timing issue also contributes intermittently, tests could still flake occasionally; mitigate by running the suite 2-3× after the fix before declaring TEST-01 done, as this research did for the baseline |
| A2 | Adding `renderRandomTables`/`renderTimers` to `renderAll()` has no negative side effects when called while a different tab is active (relies on their existing "container missing → early return" guards being complete) | Pitfall 7 | Low risk — both guards were read directly and confirmed present; if any hidden side-effect exists (e.g., a timer function that resets a running interval even without a container), it would need to be found in `features/timers/timers.js`'s cleanup logic (`cleanupTimers`) during implementation |
| A3 | The CI job's `needs`/gating relationship with the existing `build`/`smoke-test`/`deploy` chain (whether `deploy` should also transitively require `e2e` green) is a planner/human decision, not something this research can resolve unilaterally | Code Examples (CI job) | If left ungated, a red e2e run wouldn't block `deploy` even though D-03 says "blockierend" — recommend the plan explicitly decides and states this, see Open Questions |

## Open Questions

1. **Should the new `e2e` CI job block `deploy` (not just `build`), given D-03 says "blockierend"?**
   - What we know: The existing chain is `lint-and-typecheck`/`test` → `build` → `smoke-test` → `deploy` (production-build smoke test only, not the full suite).
   - What's unclear: Whether "blockierend" means "must pass before merge is allowed" (a branch-protection-rule concern, outside `ci.yml`) or "must pass before `deploy` runs" (a `needs:` array change within `ci.yml`).
   - Recommendation: Add `e2e` to `build`'s (or `smoke-test`'s) `needs:` array so a red e2e run blocks the `deploy` job transitively, matching the spirit of "blockierend" as tightly as `ci.yml` alone can express it; separately, recommend (but can't enforce from here) that the repo's branch-protection settings require the `e2e` check to pass before merge.

2. **Exact timers-tab container id for the `renderSafe(renderTimers, 'renderTimers', ???)` 3rd argument (Pitfall 7 fix).**
   - What we know: `TAB_RENDER_REGISTRY.timers.renders = ['renderTimers', 'renderTimerPresets']`; the error-fallback container id is optional (only used to show an inline error message on render failure).
   - What's unclear: The exact container id `renderTimers()` targets internally (not required reading for this research since the fix doesn't strictly need it — `renderSafe(renderTimers, 'renderTimers')` without a 3rd arg is a valid, safe call per the existing pattern used for `renderWiki`, `renderFilterList`, `initQuickRefCustom`).
   - Recommendation: Omit the 3rd argument (matches 3 other existing `renderSafe()` calls that also omit it) unless the implementer wants the nicer inline-error-message behavior, in which case grep `features/timers/timers.js`'s `$('...')` call for the top-level container id during implementation.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Jest, build tooling | ✓ | v24.14.0 [VERIFIED: local `node -v`] | — |
| Python | `build.py` (dev + prod builds) | ✓ | confirmed working (`npm run build:dev` succeeded during this research) | — |
| `npx playwright` + Chromium browser | E2E suite | ✓ | Playwright 1.57.0, Chromium already installed and runnable [VERIFIED: full suite ran locally during this research] | — |
| GitHub Actions Ubuntu runner (`ubuntu-latest`) | New CI `e2e` job (D-03) | Not verifiable locally, but `smoke-test` job already runs Playwright + `python -m http.server` successfully on the same runner type — strong precedent that `e2e` job will work identically | — | — |

**Missing dependencies with no fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.57.0 (E2E) + Jest 30.2.0/jsdom (Unit) |
| Config file | `playwright.config.js` (E2E, file:// against dev bundle), `jest.config.cjs` (Unit) |
| Quick run command | `npx playwright test tests/e2e/tab-navigation.spec.js` (single spec, ~15s) or `npx jest tests/unit/<file>.test.js` |
| Full suite command | `npm run build:dev && npx playwright test` (E2E — build is mandatory first) / `npm test` (Jest) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | All 11 currently-known E2E fails pass | e2e | `npx playwright test` (full suite, must show 0 failed) | ✅ (tests already exist; fixes are to source + test assertions, not new test files) |
| TEST-01 | Attribute-modifier fix has a dedicated regression test (D-02) | unit | New: `npx jest tests/unit/action-registry-collisions.test.js` (or similar name — file does not exist yet) | ❌ Wave 0 |
| TEST-01 | Global-Search banner-overlap fix has a dedicated regression test (D-02) | e2e or unit | New test (see Pitfall 3) | ❌ Wave 0 |
| TEST-01 | `renderAll()` render-dispatch gap has a dedicated regression test (D-02) | e2e | Existing `tab-navigation.spec.js:533` doubles as this once Pitfall #6's selector fix lands; confirm no additional test needed | ✅ (existing test suffices once upstream selector bug is fixed) |
| TEST-02 | Suite-wide `toBe(N)` hardening | unit + e2e | Manual review per Suite-Wide Hardening Inventory above; no new automated command, this is an editing task | N/A |
| TEST-02 | `npx playwright test` fully green as CI gate | e2e (CI) | New `.github/workflows/ci.yml` job (D-03), see Code Examples | ❌ Wave 0 (ci.yml job doesn't exist yet) |

### Sampling Rate
- **Per task commit:** Run the specific spec file being fixed (`npx playwright test tests/e2e/<file>.spec.js`), plus `npx jest` (fast, 2.6s, catches any accidental Jest regression from shared code paths like `updateAttrMod`).
- **Per wave merge:** `npm run build:dev && npx playwright test` (full suite) — run at least twice given the confirmed flakiness in Pitfall #4's cluster, to confirm the fix actually stabilized it and didn't just get lucky once.
- **Phase gate:** Full suite green **twice in a row** before `/gsd-verify-work`, given this phase's explicit goal is trustworthiness of the gate itself.

### Wave 0 Gaps
- [ ] `tests/unit/action-registry-collisions.test.js` (or equivalent name) — new unit test covering the duplicate-`data-action`-key detection pattern (Pitfall 1's D-02 regression test)
- [ ] New regression test for the migration-hint-banner layout-offset fix (Pitfall 3's D-02 regression test) — file/location to be decided by planner (e2e vs. a lighter DOM-geometry unit test)
- [ ] `.github/workflows/ci.yml` — new `e2e` job (D-03) does not exist yet

## Security Domain

No `security_enforcement` key is set in `.planning/config.json` (absent = enabled per policy), but this phase's changes have a narrow, low-risk security surface: fixing an event-delegation dispatch bug, a CSS layout offset, a test-data race, and adding two function calls to an existing render-dispatch list. No new user input paths, no new persistence, no new external data ingestion.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Single-user offline app, no auth system exists or is touched |
| V3 Session Management | No | Not touched |
| V4 Access Control | No | Not touched |
| V5 Input Validation | Marginal | The Quest-title validation flow (Pitfall 4) is touched, but only its *test-timing*, not its actual validation logic (`title: Pflichtfeld fehlt` — unchanged) |
| V6 Cryptography | No | Not touched |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| None newly introduced by this phase's changes | — | This phase touches event-dispatch wiring, CSS, and test code — no `innerHTML`, no new user-content interpolation, no new external I/O. The existing `esc()`/`sanitizeHTML()` mitigations (documented extensively in CONCERNS.md) are unaffected by any fix in this research. |

## Sources

### Primary (HIGH confidence — verified by running code/tests locally during this session)
- Local build: `npm run build:dev` (succeeded, 0 warnings) — 2026-07-22
- Local full E2E run ×2: `npx playwright test` — 11 stable fails + 2 additional flaky fails identified — 2026-07-22
- Local full Jest run: `npx jest --silent` — 453/453 passing — 2026-07-22
- Local diagnostic script confirming `#random-tables-list` DOM count is always 1 (disproving CONCERNS.md's duplication theory) — 2026-07-22
- Local diagnostic script confirming exhaustive duplicate `data-action` key scan across `ui/actions/*.js` — 2026-07-22
- Direct source reads: `ui/actions/entity-actions.js`, `ui/actions/combat-actions.js`, `ui/event-delegation.js`, `features/party/party-crud.js`, `features/encounters/encounters-crud.js`, `systems/migration/migration-wizard.js`, `assets/styles/migration.css`, `assets/styles/core.css`, `ui/editors/markdown-shortcuts.js`, `utils/utilities.js`, `systems/undo.js`, `features/render-dashboard.js`, `systems/tab-registry.js`, `features/timers/timers.js`, `core/data.js`, `assets/templates/view-tools.html`, `assets/templates/view-party.html`, `tests/e2e/tab-navigation.spec.js`, `tests/e2e/app.spec.js`, `tests/e2e/crud/quests.spec.js`, `tests/e2e/crud/party.spec.js`, `loader.js`, `.github/workflows/ci.yml`, `playwright.config.js`, `playwright.smoke.config.js`

### Secondary (MEDIUM confidence)
- `docs/e2e-failure-triage.md` (May 2026 triage — historically useful but confirmed stale/wrong in one specific place, see Pitfall 6)
- `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md` (2026-06-11 codebase map — mostly accurate, numbers now stale per 08-CONTEXT.md's own warning, cross-checked against fresh local runs in this research)

### Tertiary (LOW confidence)
- None — no web search was needed or used for this phase (all findings are internal-codebase-verifiable; `.planning/config.json` has all external search providers disabled, consistent with this phase not needing them)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new stack, existing tool versions verified locally
- Architecture (event-delegation collision, render-dispatch gap, banner-overlap): HIGH — traced to exact line numbers, mechanism verified by reading both the trigger code and the guard/dispatch code
- Pitfalls: HIGH — every pitfall was either reproduced via a live diagnostic script or traced to a specific confirmed source-code mismatch; none are speculative

**Research date:** 2026-07-22
**Valid until:** Short shelf-life recommended (7-14 days) — this research is tied to the exact current state of `main` (commit `b23c82b`) and the exact current 11-fail baseline; any commits to `ui/actions/`, `features/render-dashboard.js`, `tests/e2e/tab-navigation.spec.js`, or `systems/migration/migration-wizard.js` before this phase starts executing should trigger a quick re-verification of the baseline (`npx playwright test`) before trusting this document's fail list as still accurate.
