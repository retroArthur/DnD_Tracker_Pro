---
phase: 13-h-rtung-wartbarkeit
plan: 03
subsystem: ui
tags: [markdown, regex, commonmark, wiki, rich-text]

# Dependency graph
requires: []
provides:
  - "renderMarkdownInContent() no longer corrupts URLs/identifiers containing 2+ underscores"
  - "Dead hasHtmlTags guard removed from ui/editors/markdown-converter.js"
  - "Real-module vm-sandbox test pattern for markdown-converter.js (MAINT-03 describe block)"
affects: [wiki, npcs, locations, quests, dmscreen, editor-formatting-tests]

# Actuals (#2632)
actuals:
  tokens: 1477
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "vm-sandboxed real-module unit tests (reused tests/unit/file-backup-idb.test.js pattern) for markdown-converter.js instead of the pre-existing input-string-only placeholder assertions"

key-files:
  created: []
  modified:
    - ui/editors/markdown-converter.js
    - tests/unit/markdown-converter.test.js

key-decisions:
  - "Hardened only the underscore emphasis regexes (bold __, italic _) with (?<!\\w)/(?!\\w) word-boundary lookarounds per CommonMark's intraword-emphasis rule; the *-variants (lines 270/274 pre-change) were left byte-identical since CommonMark does not restrict them."
  - "Removed hasHtmlTags entirely rather than wiring it up (D-13): the rich-text editor stores HTML, so wiring the guard would disable markdown-on-display for nearly every stored entry — turning a display bug into a feature regression."
  - "Did not modify ui/editors/markdown-shortcuts.js even though it shares similar emphasis-pattern language — out of scope per plan instruction, documented below instead."

patterns-established:
  - "Pattern: (?<!\\w)_(...)_  (?!\\w) is the correct CommonMark word-boundary lookaround for underscore emphasis in this codebase's non-Unicode-normalized regex context; reuse this exact lookaround shape for any future underscore-based markdown rule instead of the narrower (?<!_)/(?!_) shape that only guards against adjacent underscores."

requirements-completed: [MAINT-03]

coverage:
  - id: D1
    description: "URLs and identifiers with 2+ underscores (e.g. https://example.com/foo_bar_baz, Der_Hobbit_Buch, snake_case_name) survive renderMarkdownInContent() unchanged instead of being corrupted into partial <i> tags"
    requirement: "MAINT-03"
    verification:
      - kind: unit
        ref: "tests/unit/markdown-converter.test.js#MAINT-03: Wortgrenzen-Regel für Unterstrich-Emphase (renderMarkdownInContent, echtes Modul) > URL mit zwei Unterstrichen bleibt zeichengleich erhalten (Kernfall des Bugs)"
        status: pass
      - kind: unit
        ref: "tests/unit/markdown-converter.test.js#MAINT-03 ... > Der_Hobbit_Buch bleibt zeichengleich erhalten"
        status: pass
      - kind: unit
        ref: "tests/unit/markdown-converter.test.js#MAINT-03 ... > snake_case_name bleibt zeichengleich erhalten"
        status: pass
    human_judgment: false
  - id: D2
    description: "Legitimate underscore emphasis at word boundaries (_kursiv_, __fett__) still converts to <i>/<b>, and the untouched *-variants keep working — protection against overcorrection"
    requirement: "MAINT-03"
    verification:
      - kind: unit
        ref: "tests/unit/markdown-converter.test.js#MAINT-03 ... > _kursiv_ am Satzanfang wird zu einem i-Element (Schutz gegen Überkorrektur)"
        status: pass
      - kind: unit
        ref: "tests/unit/markdown-converter.test.js#MAINT-03 ... > Ein _kursives_ Wort wird zu einem i-Element (Schutz gegen Überkorrektur)"
        status: pass
      - kind: unit
        ref: "tests/unit/markdown-converter.test.js#MAINT-03 ... > __fett__ an Wortgrenzen wird zu einem b-Element (Schutz gegen Überkorrektur)"
        status: pass
      - kind: unit
        ref: "tests/unit/markdown-converter.test.js#MAINT-03 ... > *kursiv* und **fett** bleiben unverändert im Verhalten (Sternchen-Regeln nicht angefasst)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Dead hasHtmlTags guard removed from renderMarkdownInContent(); stored HTML (tables, read-aloud blocks) still renders unchanged"
    requirement: "MAINT-03"
    verification:
      - kind: other
        ref: "grep -c 'hasHtmlTags' ui/editors/markdown-converter.js -> 0"
        status: pass
      - kind: unit
        ref: "tests/unit/markdown-converter.test.js#MAINT-03 ... > gespeichertes HTML mit Tabelle und Read-Aloud-Block wird nach Entfernen des hasHtmlTags-Wächters unverändert dargestellt"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/wiki.spec.js (13/13 passed against dev build)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-09-06
status: complete
---

# Phase 13 Plan 03: Markdown-Wortgrenzen & toter Wächter Summary

**Gehärtete Unterstrich-Emphase-Regexe nach CommonMark-Wortgrenzenregel plus Entfernung des nie gelesenen `hasHtmlTags`-Wächters in `ui/editors/markdown-converter.js`.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-09-06T08:20:00+02:00 (approx.)
- **Completed:** 2026-09-06T08:32:30+02:00
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `renderMarkdownInContent()` no longer corrupts URLs or identifiers containing two or more underscores (e.g. `https://example.com/foo_bar_baz`, `Der_Hobbit_Buch`, `snake_case_name`) — the underscore bold/italic regexes now carry CommonMark-compliant `(?<!\w)`/`(?!\w)` word-boundary lookarounds instead of the previous underscore-only lookarounds.
- Legitimate underscore emphasis at word boundaries (`_kursiv_`, `__fett__`) and the untouched `*`-variants keep working exactly as before — proven by dedicated non-regression test cases.
- The dead `hasHtmlTags` guard (computed, never read) is removed entirely rather than wired up, per D-13: wiring it would have disabled markdown-on-display for nearly every stored wiki/NPC/location entry, since the rich-text editor stores HTML.
- Added a real-module vm-sandbox test block (`MAINT-03` describe, 8 test cases) to `tests/unit/markdown-converter.test.js`, reusing the existing `tests/unit/file-backup-idb.test.js` pattern of loading the actual source file via `vm.runInContext()` — the first tests in this file that exercise the real module instead of only asserting on the input string.

## Task Commits

Each task was committed atomically:

1. **Task 1: Den URL-Korruptionsfall rot stellen und mit Wortgrenzen schließen** - `e7e5389` (fix)
2. **Task 2: Toten `hasHtmlTags`-Wächter entfernen und die Nicht-Regression belegen** - `a3750fe` (refactor)

**Plan metadata:** (this commit, docs — to follow)

## Files Created/Modified
- `ui/editors/markdown-converter.js` - Hardened `__bold__`/`_italic_` regexes with word-boundary lookarounds; removed dead `hasHtmlTags` guard and its comment
- `tests/unit/markdown-converter.test.js` - Added `MAINT-03` describe block (8 tests) that loads the real module via `vm` and exercises the fix, the overcorrection guards, and the stored-HTML regression case

## Decisions Made
- Used `(?<!\w)`/`(?!\w)` rather than a narrower `(?<!_)`/`(?!_)` extension, because `\w` includes `_` itself in JS regex — this single lookaround simultaneously satisfies "not preceded/followed by another underscore" (protecting against `__bold__` conflicts, since bold is matched first) and "not preceded/followed by an alphanumeric character" (the actual CommonMark rule and the URL-corruption fix), without needing two separate conditions.
- Did not touch `ui/editors/markdown-shortcuts.js`. It contains a structurally different but conceptually related italic pattern (`(?<!\*|_)(\*|_)((?:(?!\1).){1,50})\1(?=\s|$)`, live-typing shortcut handler operating on a 20-char window near the cursor, not full-content display rendering). It already requires whitespace/end-of-string after the closing marker and a non-`*`/`_` character before the opening marker, which is a different (narrower, live-input-oriented) safeguard than the display-time CommonMark rule this plan implements. Left unchanged per plan scope; flagged here as the plan instructed, not modified.
- Did not rewrite the pre-existing placeholder assertions in the same test file (lines 1-192, which assert on input strings like `expect(html).toContain('<b>')` without calling the real functions) — the plan explicitly scoped that rewrite to a future phase 14 task, not this one.

## Deviations from Plan

None - plan executed exactly as written. Both tasks matched their `<action>` and `<verify>` blocks with no auto-fixes, blockers, or architectural questions.

## Issues Encountered

None. The pre-plan assumption that `tests/unit/markdown-shortcuts.test.js` exists (referenced in the plan's `<verify>` commands) turned out to be correct — the file exists (my initial `Glob` lookup during context-gathering returned a stale/empty result, but a direct `find` and `npx jest --listTests` confirmed it is present and included in every verify run alongside `markdown-converter.test.js`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- MAINT-03 (Erfolgskriterium 5 of Phase 13) is closed: the `hasHtmlTags` guard is gone, and the underscore-corruption bug is fixed and regression-tested.
- Full `npx jest` suite: 33 suites / 930 tests, all green (baseline was 31 suites — no regressions, count grew due to this plan's additions).
- Dev build (`PYTHONIOENCODING=utf-8 python build.py`) succeeds; `npx playwright test tests/e2e/features/wiki.spec.js` is 13/13 green against the freshly built `dist/dnd-tracker-bundled.html`.
- `npx eslint ui/editors/markdown-converter.js tests/unit/markdown-converter.test.js` reports 0 errors (6 pre-existing-pattern warnings: `require`/`__dirname` no-undef in the new vm-based test block — identical warning class already present in `tests/unit/file-backup-idb.test.js`; two `no-useless-escape` warnings on the unmodified Links-regex lines, pre-existing and out of scope).
- No blockers for subsequent phase 13 plans.

## Self-Check: PASSED

- FOUND: ui/editors/markdown-converter.js
- FOUND: tests/unit/markdown-converter.test.js
- FOUND: .planning/phases/13-h-rtung-wartbarkeit/13-03-SUMMARY.md
- FOUND: e7e5389 (Task 1 commit)
- FOUND: a3750fe (Task 2 commit)

---
*Phase: 13-h-rtung-wartbarkeit*
*Completed: 2026-09-06*
