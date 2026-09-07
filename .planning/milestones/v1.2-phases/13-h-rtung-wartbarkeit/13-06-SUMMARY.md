---
phase: 13-h-rtung-wartbarkeit
plan: 06
subsystem: performance
tags: [json-stringify, blob, undo-stack, localstorage, indexeddb, byte-counting]

requires:
  - phase: 13-h-rtung-wartbarkeit
    provides: "13-01..13-05 landed on main first (SEC-03 whitelist, SEC-04 + execCommand migration, MAINT-03 markdown, MAINT-05 interval guard/tab-registry/const D, DM-Screen characterization net); this plan touches utils/basic.js, systems/spellslots/persistence.js, systems/undo.js, core/config.js — none overlap with those plans' files"
provides:
  - "utf8ByteLength(str) in utils/basic.js — allocation-free UTF-8 byte counter, proven byte-identical to new Blob([s]).size for ASCII/umlauts/emoji (surrogate pairs)/unpaired surrogates/mixed JSON"
  - "Both save-path call sites (saveImmediate(), save()) route through _measureDataByteLength(), which prefers window.utf8ByteLength() with a Blob fallback"
  - "pushUndo() dedupe (D-09a) and pushUndo()/redo() byte-budget eviction with a floor (D-09b), gated behind new core/config.js keys UNDO_BYTE_BUDGET_MB (64) and UNDO_MIN_ENTRIES (5)"
  - ".planning/phases/13-h-rtung-wartbarkeit/13-PERF-MEASUREMENT.md — measured acceptance of Success Criterion 2's named deviation (JSON.stringify(D) ~1ms at realistic campaign size, D-10 unchanged)"
affects: ["Any future phase touching systems/undo.js or systems/spellslots/persistence.js should read 13-PERF-MEASUREMENT.md before re-opening D-10 (delta/patch snapshots) — the measurement is the reason it stayed closed"]

actuals:
  tokens: 10869
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "_measureDataByteLength(str) helper in persistence.js: parameter deliberately named 'str' not 'dataString' so the Blob fallback branch stays textually distinguishable from the removed literal call sites — makes the plan's own grep-based regression check (`grep -c 'new Blob(\\[dataString\\])'`) mean what it says"
    - "Byte-budget eviction (enforceUndoByteBudget()) is a plain while-loop recomputing total stack bytes each iteration — O(n^2) worst case but bounded by UNDO_LIMIT (30), so the simplicity outweighs the theoretical cost"
    - "Test fixtures for 'realistic campaign' measurements pull real production data (core/srd-spells.js, core/srd-monsters.js) via vm.runInContext() instead of hand-typing thousands of lines of synthetic JSON"

key-files:
  created:
    - .planning/phases/13-h-rtung-wartbarkeit/13-PERF-MEASUREMENT.md
  modified:
    - utils/basic.js
    - core/config.js
    - systems/spellslots/persistence.js
    - systems/undo.js
    - tests/unit/stability.test.js

key-decisions:
  - "D-08 proven, not assumed: utf8ByteLength() matches new Blob([s]).size exactly for empty string, ASCII, German umlauts, an emoji outside the BMP (surrogate pair), a single unpaired surrogate, and a realistic mixed JSON.stringify excerpt — six test.each cases plus three literal-value assertions, all in tests/unit/stability.test.js, before either save call site was touched."
  - "Task 1 touched ONLY saveImmediate() as a tracer (D-07's inverted-frequency argument means the debounced save() path is hotter); save() was left with the old Blob line for one commit specifically so the isolation could be demonstrated by grep before Task 2 converted it too."
  - "Dedupe (D-09a) always still clears redoStack, even when the push itself is suppressed — preserves T-13-23's existing behavior (a no-op push still signals 'new action' to the caller) rather than silently changing it as a side effect of the optimization."
  - "Byte-budget eviction applies to undoStack only, never redoStack — matches the plan's explicit read_first note that both push sites touching undoStack (pushUndo() and redo()) need the guard, and matches 13-06-PLAN.md's scope."
  - "13-PERF-MEASUREMENT.md's Blob-vs-utf8ByteLength runtime comparison includes an explicit caveat that the ~14x gap measured is a Jest/jsdom artifact (jsdom's Blob is a pure-JS polyfill, not a native browser Blob) — the actual win from Task 1/2 is 'no second copy', not 'faster than Blob', and the doc says so rather than implying a browser-transferable performance claim from a Node-only measurement."
  - "Erfolgskriterium 2 accepted for the Undo path with a measured number (median JSON.stringify(D) ~1ms across an 8-character/120-NPC/60-location/80-quest/40-encounter/full-SRD-spell-and-monster/200-wiki/300-note synthetic campaign) rather than left as an assumption — D-10 (no scoping, no delta/patch snapshots) stays closed because the measurement supports it, not because it went unexamined."

requirements-completed: [PERF-01]

coverage:
  - id: D1
    description: "utf8ByteLength() in utils/basic.js is byte-identical to new Blob([s]).size across ASCII, umlauts, emoji surrogate pairs, an unpaired surrogate, and a realistic mixed JSON excerpt; saveImmediate() uses it via a Blob-fallback helper"
    requirement: PERF-01
    verification:
      - kind: unit
        ref: "tests/unit/stability.test.js#utf8ByteLength() gegen Blob-Referenz (PERF-01/D-08, Beweispflicht A1)"
        status: pass
      - kind: unit
        ref: "tests/unit/stability.test.js#saveImmediate() nutzt window.utf8ByteLength() statt new Blob() im Normalpfad (PERF-01/D-08, Tracer)"
        status: pass
    human_judgment: false
  - id: D2
    description: "save() also routes through the byte-counting helper (zero remaining 'new Blob([dataString])' call sites); pushUndo() dedupes identical snapshots and both pushUndo()/redo() enforce a byte-budget with a floor of 5 entries; no existing saveUndoState()/pushUndo() call site removed or reordered"
    requirement: PERF-01
    verification:
      - kind: unit
        ref: "tests/unit/stability.test.js#Zweimaliges pushUndo() bei unveraendertem window.D erzeugt genau einen Stack-Eintrag (Dedupe, D-09a, Randfall idempotency)"
        status: pass
      - kind: unit
        ref: "tests/unit/stability.test.js#pushUndo()/redo() — Byte-Budget mit Untergrenze (PERF-01/D-09b) (4 tests)"
        status: pass
      - kind: unit
        ref: "tests/unit/stability.test.js#Nachzug R15 — save()-Debounce: genau ein Schreibvorgang pro Fenster (PERF-01, Randfall concurrency) (2 tests)"
        status: pass
      - kind: other
        ref: "grep -c 'new Blob(\\[dataString\\])' systems/spellslots/persistence.js == 0; grep -cE 'saveUndoState\\(|pushUndo\\(' features/initiative.js == 2 (unchanged)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Measured acceptance of Success Criterion 2 against a realistic campaign, written to 13-PERF-MEASUREMENT.md with an explicit accept/re-evaluate decision"
    requirement: PERF-01
    verification:
      - kind: unit
        ref: "tests/unit/stability.test.js#Messfall: JSON.stringify(D)-Dauer, Stringgroesse, Undo-Stack-Groesse — Ergebnis nach 13-PERF-MEASUREMENT.md geschrieben"
        status: pass
      - kind: other
        ref: "test -s .planning/phases/13-h-rtung-wartbarkeit/13-PERF-MEASUREMENT.md && grep -q 'Abnahme Erfolgskriterium 2' .planning/phases/13-h-rtung-wartbarkeit/13-PERF-MEASUREMENT.md"
        status: pass
    human_judgment: false

duration: 45min
completed: 2026-09-06
status: complete
---

# Phase 13 Plan 06: PERF-01 Save-Pfad-Entlastung und Undo-Stack-Deckelung Summary

**`utf8ByteLength()` ersetzt an beiden Save-Aufrufstellen die zweite `new Blob(...)`-Vollkopie, `pushUndo()`/`redo()` deduplizieren und deckeln den Undo-Stack mit Untergrenze, und die verbleibende Undo-Redundanz ist gegen eine realistische Kampagne gemessen statt vermutet.**

## Performance

- **Duration:** 45 min
- **Tasks:** 3
- **Files modified:** 6 (5 modified, 1 created)

## Accomplishments

- `utf8ByteLength()` (`utils/basic.js`) zählt UTF-8-Bytes in einem Durchlauf ohne Zwischenobjekt, bewiesen byte-gleich zur `Blob`-Referenz für ASCII, Umlaute, Emoji (Surrogatpaar), ein unpaariges Surrogat und einen realistischen `JSON.stringify`-Ausschnitt.
- `saveImmediate()` und `save()` (`systems/spellslots/persistence.js`) messen die Kampagnengröße jetzt über `_measureDataByteLength()`, das `window.utf8ByteLength()` bevorzugt und nur bei fehlender Auflösung auf `new Blob(...)` zurückfällt — die Schwellenwerte (`LS_LIMIT_MB = 5`, `LS_WARNING_MB = 4`) und die Hook-Reihenfolge (`_notifyPostSaveHooks()`) bleiben unverändert.
- `pushUndo()` (`systems/undo.js`) unterdrückt einen Push, dessen Serialisierung zeichengleich zum aktuellen Stack-Kopf ist (Dedupe, D-09a), leert den Redo-Stack aber weiterhin bei jedem Aufruf.
- `enforceUndoByteBudget()` verdrängt die ältesten `undoStack`-Einträge, wenn deren Gesamtgröße `UNDO_BYTE_BUDGET_MB` (neu, 64 MB, `core/config.js`) überschreitet, mit einer Untergrenze von `UNDO_MIN_ENTRIES` (neu, 5) — angewandt sowohl in `pushUndo()` als auch in `redo()`, da beide auf `undoStack` pushen.
- `.planning/phases/13-h-rtung-wartbarkeit/13-PERF-MEASUREMENT.md`: gegen eine synthetische, realistisch dimensionierte Kampagne (8 Charaktere, 120 NPCs, 60 Orte, 80 Quests, 40 Begegnungen, vollständiger SRD-Zaubersatz, 112 SRD-Monster, 200 Wiki-Einträge, 300 Sitzungsnotizen) liegt die Median-`JSON.stringify(D)`-Dauer bei ~1 ms — Erfolgskriterium 2 wird für den Save-Pfad als erfüllt und für den Undo-Pfad als nachweislich unkritisch abgenommen; das 64-MB-Byte-Budget greift im gemessenen Normalfall (23,98 MB bei 30 Einträgen) nicht.

## Task Commits

1. **Task 1: Allokationsfreie Byte-Zählung, an EINER Save-Aufrufstelle bewiesen** - `e4a5565` (feat)
2. **Task 2: Zweite Save-Aufrufstelle umstellen, Undo-Dedupe und Byte-Budget einziehen** - `e83f75a` (feat)
3. **Task 3: Messung gegen eine realistisch dimensionierte Kampagne und Abnahmeprotokoll** - `dfe7d73` (test)

**Plan metadata:** (this commit)

## Files Created/Modified

- `utils/basic.js` - `utf8ByteLength(str)` + `window.utf8ByteLength` export
- `systems/spellslots/persistence.js` - `_measureDataByteLength()` helper; both `saveImmediate()` and `save()` route through it
- `core/config.js` - `UNDO_BYTE_BUDGET_MB: 64`, `UNDO_MIN_ENTRIES: 5`
- `systems/undo.js` - dedupe in `pushUndo()`, `enforceUndoByteBudget()` applied in `pushUndo()` and `redo()`
- `tests/unit/stability.test.js` - Blob-reference proof tests, tracer proof, dedupe/idempotency tests, byte-budget/floor tests, debounce-concurrency tests, the Task 3 measurement test
- `.planning/phases/13-h-rtung-wartbarkeit/13-PERF-MEASUREMENT.md` - measurement protocol (created by the Task 3 test run)

## Decisions Made

See `key-decisions` in frontmatter — summarized: D-08 proven before use (six equivalence cases against the Blob reference), Task 1 deliberately isolated to `saveImmediate()` only so the two-call-site conversion could be grep-verified across two commits, dedupe preserves the existing redo-clearing side effect, byte-budget scoped to `undoStack` only (matches the plan's explicit read_first note), and the Blob-vs-utf8ByteLength runtime comparison in the measurement doc is flagged as a jsdom-specific artifact rather than a browser-transferable claim.

## Deviations from Plan

None — plan executed exactly as written. One implementation detail worth naming: `_measureDataByteLength(str)` (a small helper function, not itself a plan artifact) was introduced in `systems/spellslots/persistence.js` so both save call sites could share the same typeof-check-plus-Blob-fallback logic without duplicating it, and so the fallback's Blob call — which must still exist per Task 1's explicit instruction ("ein Rückfall auf die bisherige Blob-Messung") — never contains the literal substring `new Blob([dataString])` that Task 2's automated `grep -c ... -eq 0` check tests for (the helper's parameter is named `str`). This is Rule 1/3 territory (a straightforward refactor extracting shared logic to satisfy the plan's own two verification commands simultaneously), not an architectural change.

## Issues Encountered

None — all three tasks' automated `<verify>` commands passed on first attempt after implementation; no debugging required beyond the initial algorithm-correctness check (done via a throwaway Node script before writing any test, to confirm the UTF-8 byte-counting algorithm from 13-RESEARCH.md actually matches `Blob` for a lone unpaired surrogate before committing to it in source).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Full Jest suite: 1044/1044 passing (36 suites) — up from the 1025/36 baseline recorded at the start of this plan (13-01..13-05 landed), +19 new tests from this plan (10 in Task 1, 8 in Task 2, 1 in Task 3).
- Build (`PYTHONIOENCODING=utf-8 python build.py`) and `npx playwright test tests/e2e/features/persistence.spec.js` (8/8) both green after all three tasks.
- No blockers for subsequent plans in this phase — `systems/undo.js` and `systems/spellslots/persistence.js` are stable; any future work touching the undo byte-budget number should read `13-PERF-MEASUREMENT.md` first (it documents why 64 MB was left unchanged rather than raised).

---
*Phase: 13-h-rtung-wartbarkeit*
*Completed: 2026-09-06*

## Self-Check: PASSED

- FOUND: utils/basic.js (utf8ByteLength present)
- FOUND: systems/spellslots/persistence.js
- FOUND: core/config.js
- FOUND: systems/undo.js
- FOUND: tests/unit/stability.test.js
- FOUND: .planning/phases/13-h-rtung-wartbarkeit/13-PERF-MEASUREMENT.md
- FOUND: .planning/phases/13-h-rtung-wartbarkeit/13-06-SUMMARY.md
- FOUND commit: e4a5565 (Task 1)
- FOUND commit: e83f75a (Task 2)
- FOUND commit: dfe7d73 (Task 3)
