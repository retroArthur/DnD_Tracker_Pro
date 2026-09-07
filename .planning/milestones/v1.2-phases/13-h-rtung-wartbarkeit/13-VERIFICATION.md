---
phase: 13-h-rtung-wartbarkeit
verified: 2026-09-06T00:00:00Z
status: passed
score: 7/8 must-haves verified
behavior_unverified: 0
overrides_applied: 1
gaps:
  - truth: "Weder ein Undo-Snapshot noch ein Save serialisiert bei jeder Operation die vollständige Kampagne (Erfolgskriterium 2)"
    status: overridden
    reason: >
      pushUndo() (systems/undo.js) still calls JSON.stringify(window.D) — a full campaign
      serialization — on every single call, and pushUndo()/saveUndoState() is invoked before
      every destructive user operation project-wide (CLAUDE.md: "saveUndoState(); // Call
      BEFORE any destructive operation"). This was not eliminated by Plan 13-06; it was
      measured and consciously accepted as a named deviation from the literal roadmap wording
      (decision D-10, pre-declared in 13-CONTEXT.md as "⚠ Konflikt mit Erfolgskriterium 2 —
      bewusst und benannt" before execution, with an explicit acceptance condition: "if the
      measured JSON.stringify(D) duration is single-digit milliseconds against a realistic
      campaign, accept for Undo as demonstrably non-critical"). The measurement in
      13-PERF-MEASUREMENT.md (0.922 ms median against an 8-character/120-NPC/60-location/
      80-quest/40-encounter/full-SRD-spell-and-monster/200-wiki/300-note synthetic campaign)
      meets that pre-declared condition, and the document's own text states outright: "Die
      Abweichung von der ursprünglichen Formulierung des Kriteriums ist damit gemessen statt
      vermutet und bewusst benannt akzeptiert" (translation: the deviation from the criterion's
      original wording is thus measured rather than assumed, and consciously named/accepted).
      What PERF-01 actually delivered and fully closes: (a) both save call sites no longer take
      a *second* full copy via `new Blob([dataString])` for size measurement — they now use the
      allocation-free `utf8ByteLength()` (byte-identical, proven in tests/unit/stability.test.js);
      (b) the undo stack now dedupes identical snapshots and evicts oldest entries under a byte
      budget with a floor. What remains true, unchanged, and explicitly NOT eliminated: a full
      `JSON.stringify(window.D)` still runs on every single destructive operation via
      pushUndo() — this is an inherent property of "one undo step restores the full campaign"
      (D-09), not a residual bug, but it does contradict the literal text of Success Criterion 2.
      No VERIFICATION.md override has been formally accepted by a human for this exact
      deviation — the acceptance so far is the plan's own self-graded acceptance during
      execution, not a maintainer sign-off recorded in this file's frontmatter.
    artifacts:
      - path: "systems/undo.js"
        issue: "pushUndo() (lines ~28-63) computes `JSON.stringify(window.D)` unconditionally on every call, before the dedupe/byte-budget logic even runs"
      - path: ".planning/phases/13-h-rtung-wartbarkeit/13-PERF-MEASUREMENT.md"
        issue: "Documents the deviation and the measurement that was used to accept it, but this document is not itself a VERIFICATION.md override entry"
    missing:
      - "A maintainer decision: either add an `overrides:` entry to this VERIFICATION.md accepting D-10's measured deviation (suggested text below), or open a follow-up plan (e.g. in Phase 14) to scope/delta the undo snapshot if the measured number is ever judged insufficient for a much larger real campaign"
overrides:
  - truth: "Weder ein Undo-Snapshot noch ein Save serialisiert bei jeder Operation die vollstaendige Kampagne (Erfolgskriterium 2)"
    accepted_by: maintainer
    accepted_at: "2026-09-06"
    decision: >
      Freigegeben. Das Erfolgskriterium war absoluter formuliert, als die gesperrten
      Entscheidungen dieser Phase es zulassen. D-09 sichert zu, dass EIN Undo-Schritt die volle
      Kampagne wiederherstellt; D-10 verwirft Scoping einzelner Aufrufstellen und Delta-/Patch-
      Snapshots ausdruecklich, weil eine falsche Scope-Angabe beim Undo STILL Daten verloere -
      eine Fehlerklasse, die dieses Projekt bereits zweimal getroffen hat (DEBT-17, DEBT-18).
      Der Konflikt wurde VOR der Ausfuehrung benannt (13-CONTEXT.md, D-10) und mit einer
      Abnahmebedingung versehen: Messung an einer realistisch dimensionierten Kampagne im
      einstelligen Millisekundenbereich. Die Messung liegt vor (13-PERF-MEASUREMENT.md,
      0.922 ms Median) und erfuellt die Bedingung.
    what_was_delivered: >
      Save-Pfad entlastet (keine zweite Vollkopie mehr via new Blob([...]).size, ersetzt durch
      das allokationsfreie utf8ByteLength()). Undo-Stack dedupliziert identische Snapshots und
      verdraengt aelteste Eintraege unter einem Byte-Budget mit Untergrenze. Der Snapshot bleibt
      VOLLSTAENDIG - nicht mehr redundant, nicht mehr unbegrenzt wachsend, aber vollstaendig.
      Das ist eine Eigenschaft der Zusage aus D-09, kein Restfehler.
    what_would_reopen_this: >
      D-10 stuft Scoping ausdruecklich als REVERSIBEL ein - additiv nachruestbar, falls eine
      Messung es je rechtfertigt. Ausloeser: eine real gewachsene Kampagne, deren
      JSON.stringify(D)-Dauer den einstelligen Millisekundenbereich verlaesst, oder eine am
      Spieltisch spuerbare Verzoegerung bei destruktiven Operationen. Reproduzieren mit
      "GSD_WRITE_PERF_REPORT=1 npx jest tests/unit/stability.test.js"; die Anleitung zum
      Nachmessen an der eigenen Kampagne steht in 13-PERF-MEASUREMENT.md.
deferred: []
human_verification: []
---

# Phase 13: Härtung & Wartbarkeit — Verification Report

**Phase Goal:** Die verbliebenen Sicherheits- und Skalierungsrisiken sind geschlossen, und die
Codebasis trägt keine übergroßen, toten oder irreführenden Stellen mehr, die künftige Arbeit
verteuern.

**Verified:** 2026-09-06
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (8 Roadmap Success Criteria)

| # | Truth (Success Criterion, verbatim) | Status | Evidence |
|---|---|---|---|
| 1 | Die `call`-Aktion ruft nur noch Ziele aus einer Whitelist auf; die Regex-Capture in `parseWikiLinks()` ist escapt | ✓ VERIFIED | `core/constants.js:563` — `CALL_ACTION_WHITELIST = new Set([...])` with 130 entries; `ui/actions/ui-actions.js:186-207` — `call` handler checks `window.CALL_ACTION_WHITELIST?.has(ctx.value)` before any `window[ctx.value]` access; `tests/unit/event-delegation.test.js` 8/8 pass incl. a live source-tree reconciliation test. `features/wiki/wiki-crud.js:102-109` `parseWikiLinks()` — both the `data-value` attribute and the visible text node use the same `esc(linkText)` output; `tests/unit/wiki-links.test.js` 6/6 pass, including `<`/`>`/`"` injection cases. |
| 2 | Weder ein Undo-Snapshot noch ein Save serialisiert bei jeder Operation die vollständige Kampagne | ✗ FAILED (see `gaps`) | `systems/undo.js` `pushUndo()` still runs `JSON.stringify(window.D)` on every call (called before every destructive operation project-wide). Explicitly documented, measured, and named as a deviation from this exact criterion in `13-CONTEXT.md` (D-10) and `13-PERF-MEASUREMENT.md`, not silently missed. The Save side's *redundant second copy* (`new Blob(...)`) was genuinely eliminated (`utils/basic.js` `utf8ByteLength()`, `systems/spellslots/persistence.js` `_measureDataByteLength()`), and Undo now dedupes + byte-budgets — but a Save/Undo snapshot fundamentally still serializes the whole campaign on each operation, which is what the criterion's literal wording says should no longer happen. See "This looks intentional" note below. |
| 3 | Der Würfelstatistik-Store hat eine Prune-/Löschfunktion und wird nicht mehr komplett in den Speicher geladen | ✓ VERIFIED | `core/config.js:47` `DICE_STATS_MAX_RECORDS: 50000`; `features/dice-stats/dice-stats-idb.js` `enforceStatsCap()` (oldest-first cursor eviction, throttled every 50th write), `clearAllStats()` + confirm-gated `'clear-dice-stats'` action (`ui/actions/system-actions.js`), `getStatsAggregate()` (cursor-based, never materializes the full array). `getAllStats()` confirmed used ONLY by `systems/migration/audio-export.js` (one-time export path) — zero references from the live evaluation view (`grep -c 'getAllStats' features/dice-stats/dice-stats-render.js` → 0). `tests/unit/dice-stats-idb.test.js` 15/15 pass. |
| 4 | Keine der vier zuvor übergroßen Dateien überschreitet noch die Grenze, entlang derer sie aufgeteilt wurde — bei unverändertem Verhalten, belegt durch die bestehenden Suiten | ✓ VERIFIED | `wc -l` on all 14 resulting files: `wiki.js` 554, `wiki-crud.js` 673, `initiative.js` 616, `initiative-loot.js` 392, `initiative-combat-widgets.js` 670, `spell-manager.js` 607, `rich-text.js` 401, `rich-text-insert.js` 438, `rich-text-toolbars.js` 513, `dmscreen-render.js` 573, `dmscreen-config.js` 474, `dmscreen-widgets-base.js` 280, `dmscreen-widgets-combat.js` 170, `dmscreen-widgets-reference.js` 276 — every file ≤ 800 lines (the two `dmscreen-*` files are larger than the 13-12-SUMMARY's stated 564/358 because of an out-of-phase feature commit `7e4a860`, confirmed via `git show --stat`; still well under the cap). Full suites green: `npx jest` 1073/1073 (39 suites, incl. the 50/50-snapshot `dmscreen-characterization.test.js` unchanged since 13-05), `npx tsc --noEmit` clean, `python build.py` exit 0 (134 modules, no `[FEHLER]`/`[ABORTED]`), `python -m pytest tests/build -q` 24/24, `npx playwright test` 321 passed / 2 skipped (baseline exactly matched). |
| 5 | Der `hasHtmlTags`-Wächter ist verdrahtet oder entfernt; URLs mit ≥2 Unterstrichen werden nicht mehr korrumpiert | ✓ VERIFIED | `grep -c hasHtmlTags ui/editors/markdown-converter.js` → 0 (removed, not wired, per documented D-13 rationale). Underscore emphasis regexes now use `(?<!\w)__([^_]+)__(?!\w)` / `(?<!\w)_([^_]+)_(?!\w)` word-boundary lookarounds; `tests/unit/markdown-converter.test.js` MAINT-03 block 8/8 pass, including the exact regression case (`https://example.com/foo_bar_baz` byte-identical after render) and stored-HTML (table/read-aloud) non-regression. |
| 6 | `grep execCommand` liefert außerhalb von Kommentaren keinen Treffer mehr im gesamten Quellbaum | ✓ VERIFIED | `grep -rn "document\.execCommand" --include=*.js core features systems ui utils render loader.js \| wc -l` → 0. Remaining bare-word "execCommand" mentions are all comments: 3 in `utils/basic.js:125,126,235` (pre-existing, accepted per D-14) plus 1 new one in `ui/editors/rich-text.js:3` (added by the 13-11 split, also comment-only). |
| 7 | Tab-Registry und `initPerformanceMonitoring()` sind gegen Umbenennung bzw. Mehrfachstart abgesichert; tote `mindmap`-Seeds, `const D`-Überschattung und das doppelte `data-id` sind weg | ✓ VERIFIED | `systems/tab-registry.js` uses deferred function references (`() => renderX`) resolved via `resolveTabFn()` — no more `window[name]` string lookups; a renamed/removed function now fails `tests/unit/tab-registry.test.js` (38/38 pass) instead of only warning. `systems/backups.js` `initPerformanceMonitoring()` guards via a module-level `perfMonitoringInterval` handle + `clearInterval` before `setInterval`, mirroring `startAutoBackup()`; `tests/unit/backups.test.js` 6/6 pass. `mindmap` dead seeds: 0 hits in `systems/backups.js`/`tools/debug.js`. `const D` shadow in `features/soundboard/soundboard-player.js:145` renamed to `trackDuration` (confirmed, 8 read sites). Duplicate `wiki-tree-item` `data-id`: confirmed exactly one `data-id="${entry.id}"` remains (`features/wiki/wiki.js:391`). |
| 8 | Produktionspfade schreiben nichts mehr ungefiltert auf die Konsole; die Kopfkommentare im Datei-Backup beschreiben `registerPostSaveHook()` statt des verbotenen `window.save`-Musters | ✓ VERIFIED (see Warnings below) | `tests/unit/console-hygiene.test.js` 3/3 pass — derives its 134-module list live from `loader.js` MODULES and finds zero unguarded `console.{log,warn,error,info,debug,trace}` calls outside the single marked outlet (`render/helpers.js:38`, `gsd:konsolen-senke`). A broader manual grep across the full production tree found only `loader.js`'s own `console.error` calls, which are confirmed dev-bootstrap-only and never present in the built bundle (`grep -c "❌ Kritischer Fehler beim Laden" dist/dnd-tracker-bundled.html` → 0). `systems/file-backup/file-backup-manager.js` header (line 6) and `initFileBackup()` JSDoc (line ~674) now describe `registerPostSaveHook()`; `tests/unit/file-backup.test.js` 4 dedicated tests pass. See WR-01/WR-02 below for adjacent, unresolved code-review findings that don't violate this criterion's literal text but reduce diagnosability. |

**Score:** 7/8 truths verified (1 failed, 0 present-but-behavior-unverified)

### "This looks intentional" — suggested override for Truth #2

The deviation was flagged by the planner *before* execution (`13-CONTEXT.md`, D-10: "⚠ Konflikt mit
Erfolgskriterium 2 — bewusst und benannt"), with a pre-declared, measurable acceptance condition
("if `JSON.stringify(D)` against a realistic campaign is single-digit milliseconds, accept Undo as
demonstrably non-critical; otherwise re-evaluate D-10 with real numbers"). Plan 13-06 then measured
0.922 ms median against a realistic synthetic campaign (`.planning/phases/13-h-rtung-wartbarkeit/13-PERF-MEASUREMENT.md`), meeting that condition. This reads as a deliberate, well-reasoned,
pre-conditioned engineering trade-off (not an oversight), but it has not yet received an explicit
maintainer sign-off recorded as a `VERIFICATION.md` override. To accept it, add:

```yaml
overrides:
  - must_have: "Weder ein Undo-Snapshot noch ein Save serialisiert bei jeder Operation die vollständige Kampagne"
    reason: "D-10 (13-CONTEXT.md): scoping/delta-snapshots rejected as an implicit-contract risk (same class as DEBT-17/18); measured JSON.stringify(D) at 0.922ms median against a realistic campaign (13-PERF-MEASUREMENT.md) meets the pre-declared single-digit-ms acceptance threshold. The redundant second serialization (Blob-based size check) was eliminated; the remaining single serialization per undo-push is inherent to 'one undo step restores the full campaign' (D-09) and is measured as harmless at the table."
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

If instead the maintainer wants the literal criterion fully closed, the remaining work is scoping or
delta/patch-based undo snapshots — explicitly rejected by D-10 as introducing an implicit-contract
risk class the project has already been burned by twice (DEBT-17/18) — and would need its own plan,
likely in Phase 14 or later.

### Required Artifacts (representative sample, all 12 plans)

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `core/constants.js` `CALL_ACTION_WHITELIST` | Set of 130+ whitelisted call targets | ✓ VERIFIED | 130 entries confirmed via direct parse |
| `features/wiki/wiki-crud.js` `parseWikiLinks()` | Escapes both attribute and text node | ✓ VERIFIED | Single `esc(linkText)` reused for both |
| `ui/editors/markdown-converter.js` | `hasHtmlTags` removed; underscore regex hardened | ✓ VERIFIED | 0 hits; word-boundary lookarounds present |
| `systems/undo.js` | Dedupe + byte-budget eviction | ✓ VERIFIED | `enforceUndoByteBudget()`, dedupe check present |
| `utils/basic.js` `utf8ByteLength()` | Allocation-free byte counter | ✓ VERIFIED | Present, used by both save call sites |
| `features/dice-stats/dice-stats-idb.js` | Cap, delete, cursor aggregate | ✓ VERIFIED | `enforceStatsCap`, `clearAllStats`, `getStatsAggregate` all present |
| `systems/tab-registry.js` | Deferred function references | ✓ VERIFIED | `resolveTabFn()` present, no `window[name]` lookups |
| `systems/backups.js` | `initPerformanceMonitoring()` multi-start guard | ✓ VERIFIED | `perfMonitoringInterval` handle present |
| 14 MAINT-01 split files | All ≤ 800 lines, registered in `loader.js` only | ✓ VERIFIED | `wc -l` confirms; `grep -c dmscreen/wiki/initiative/rich-text build.py` → 0 |
| `tests/unit/console-hygiene.test.js` | Enforces single sanctioned console outlet | ✓ VERIFIED | 3/3 pass |
| `systems/file-backup/file-backup-manager.js` | Header describes `registerPostSaveHook()` | ✓ VERIFIED | Confirmed at lines 1-15 and ~674 |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `ui/event-delegation.js` (`data-action="call"`) | `ui/actions/ui-actions.js` `call` handler | `ctx.value` → `CALL_ACTION_WHITELIST.has()` → `window[ctx.value]` | ✓ WIRED | Confirmed in source; 8/8 unit tests pass |
| `features/wiki/wiki-crud.js` `parseWikiLinks()` | DOM (wiki link spans) | `esc(linkText)` used for both attribute and text node | ✓ WIRED | Confirmed; 6/6 unit tests pass |
| `systems/spellslots/persistence.js` save call sites | `utils/basic.js` `utf8ByteLength()` | `_measureDataByteLength()` helper, Blob fallback only if unresolved | ✓ WIRED | `grep -c 'new Blob(\[dataString\])'` → 0 |
| `features/dice-stats/dice-stats-render.js` | `features/dice-stats/dice-stats-idb.js` `getStatsAggregate()`/`getStatsCount()` | `Promise.all` in `renderDiceStats()` | ✓ WIRED | `grep -c getAllStats` in render file → 0 |
| `systems/backups.js` `initPerformanceMonitoring()` | module-level `perfMonitoringInterval` | `clearInterval` before `setInterval` | ✓ WIRED | Confirmed; test proves single interval survives 2 calls |
| `render/helpers.js` `ErrorHandler.log()` | `console.error` (sanctioned outlet) | `gsd:konsolen-senke` marker | ✓ WIRED | Confirmed unique across tree |
| Split file groups → `loader.js` MODULES | Registration only, never `build.py` | Direct grep | ✓ WIRED | All 14 files present in `loader.js`; 0 hits in `build.py` |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Full Jest suite | `npx jest` | 1073/1073 passed, 39 suites, 50/50 snapshots | ✓ PASS |
| Dev build | `PYTHONIOENCODING=utf-8 python build.py` | Exit 0, 134 modules, no `[FEHLER]`/`[ABORTED]` | ✓ PASS |
| Full E2E suite | `npx playwright test` | 321 passed / 2 skipped (baseline exactly matched) | ✓ PASS |
| Python build tests | `python -m pytest tests/build -q` | 24/24 passed | ✓ PASS |
| TypeScript check | `npx tsc --noEmit` | Clean, no output | ✓ PASS |
| `call` whitelist guard | `npx jest tests/unit/event-delegation.test.js` | 8/8 passed | ✓ PASS |
| Wiki-link escaping | `npx jest tests/unit/wiki-links.test.js` | 6/6 passed | ✓ PASS |
| Markdown word-boundary fix | `npx jest tests/unit/markdown-converter.test.js` | 36/36 passed | ✓ PASS |
| Tab-registry + interval guard | `npx jest tests/unit/tab-registry.test.js tests/unit/backups.test.js` | 44/44 passed | ✓ PASS |
| Dice-stats cap/delete/aggregate | `npx jest tests/unit/dice-stats-idb.test.js` | 15/15 passed | ✓ PASS |
| Console hygiene + file-backup comments | `npx jest tests/unit/console-hygiene.test.js tests/unit/file-backup.test.js` | 45/45 passed | ✓ PASS |
| DM-Screen characterization (unchanged across split) | `npx jest tests/unit/dmscreen-characterization.test.js` | 51/51 passed, 50/50 snapshots unchanged | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| SEC-03 | 13-01 | `call`-Whitelist | ✓ SATISFIED | See Truth 1 |
| SEC-04 | 13-02 | `parseWikiLinks()` escaping | ✓ SATISFIED | See Truth 1 |
| PERF-01 | 13-06 | Save/undo serialization relief | ⚠ PARTIALLY SATISFIED | Second-copy elimination + dedupe/byte-budget done; full-campaign undo serialization remains (see Truth 2 gap) |
| PERF-02 | 13-07 | Dice-stats cap/delete/cursor | ✓ SATISFIED | See Truth 3 |
| MAINT-01 | 13-05, 13-09, 13-10, 13-11, 13-12 | Four oversized modules split | ✓ SATISFIED | See Truth 4 |
| MAINT-02 | 13-02, 13-04 | Dead/misleading code removed | ✓ SATISFIED | See Truth 7 |
| MAINT-03 | 13-03 | `hasHtmlTags` + underscore emphasis | ✓ SATISFIED | See Truth 5 |
| MAINT-04 | 13-02 | execCommand migration | ✓ SATISFIED (with adjacent WR-01 finding) | See Truth 6 and Warnings |
| MAINT-05 | 13-04 | Tab-registry + interval guard | ✓ SATISFIED | See Truth 7 |
| MAINT-06 | 13-08 | Console hygiene + file-backup comments | ✓ SATISFIED (with adjacent WR-02 finding) | See Truth 8 and Warnings |

No orphaned requirements: `.planning/REQUIREMENTS.md`'s traceability table maps exactly these 10
IDs to Phase 13, matching the phase's declared requirement list; all 10 are marked ✓ complete in
that file (cross-checked directly, not taken on faith).

### Anti-Patterns / Code Review Findings

Carried forward from `.planning/phases/13-h-rtung-wartbarkeit/13-REVIEW.md` (status: `issues_found`,
0 critical / 2 warning / 3 info) — confirmed still present in the current code, not fixed since that
review ran:

| File | Line(s) | Finding | Severity | Impact |
|---|---|---|---|---|
| `ui/actions/system-actions.js` | 75-94 (`insert-link`) | Collapsed selection → `wrapRangeWithElement()` inserts an empty, invisible `<a>` instead of visible link text (old `execCommand('createLink')` behavior for collapsed selections is lost); no check that the live selection is inside the target editor | ⚠ WARNING | Sits beside, does not undermine, Success Criteria 1 or 6 — the `call` whitelist and the "no execCommand" grep both hold literally. This is a real, unfixed functional regression introduced by the MAINT-04 migration in a different action (`insert-link`, not `call`) |
| `ui/event-delegation.js` (`_handleClick`/`_handleChange`/`_handleInput`) + `ui/actions/ui-actions.js` `call` handler | multiple | Removed `else console.error(...)` fallback (silent if `ErrorHandler` undefined); SEC-03 whitelist-rejection/"not found" logging now gated behind `DEBUG_MODE`, so a blocked `call` target in production produces zero console output and zero log entry | ⚠ WARNING | Sits beside, does not literally violate, Success Criterion 8 (which only requires no *unfiltered* console writes — removing the fallback branch is, if anything, more compliant with "no raw console output"). It IS a genuine diagnosability/audit-trail regression for the security-hardening path this phase added, worth fixing |
| `features/dmscreen/dmscreen-render.js` + `dmscreen-config.js` | ~470/508 | `dms-toggle-widget` checkbox double-fires (click+change), nets back to original value — confirmed pre-existing (predates Phase 13, `git show cc75339`) | ℹ️ INFO | Not introduced by this phase; unrelated to any of the 8 criteria |
| `systems/backups.js` | 415 | `console.table()` in a devtools-only helper, technically outside the "single sanctioned outlet" spirit but out of the MAINT-06 grep baseline scope (`console\.(log\|error\|warn\|info\|debug)` doesn't match `table`) | ℹ️ INFO | Does not violate Criterion 8's literal text; low risk, manually-invoked only |
| `ui/actions/system-actions.js` | 37-41 | `format-text` action's local variable names (`cmd`/`editorId`) are swapped relative to content; functionally correct, confirmed pre-existing | ℹ️ INFO | Not introduced by this phase |

No `TBD`/`FIXME`/`XXX` debt markers found in any file touched by this phase (confirmed via direct
grep across all 30 phase-13-modified source files). No placeholder/stub patterns found in the four
newly-split module groups beyond legitimate HTML `placeholder` attributes and a documented cursor-
stabilization DOM technique in `rich-text-insert.js`.

### Human Verification Required

None outstanding. Both `checkpoint:human-verify` Bedienproben for this phase (13-11 rich-text editor
split, 13-12 DM-Screen split) were already performed and approved by the developer — who is also the
end user (DM at the table) — on 2026-09-06, per `13-11-SUMMARY.md` and `13-12-SUMMARY.md`. The one
DM-Screen observation raised during the Bedienprobe (config list only shows active-profile widgets)
was investigated and confirmed to be a pre-existing gap (byte-identical `renderDMSConfigList()`
against the unsplit original), not a regression — it was subsequently addressed as a deliberate,
out-of-phase feature commit (`7e4a860`), correctly excluded from this phase's behavior-neutrality
contract and from this verification's scope.

### Gaps Summary

**One gap, already well-understood and likely resolvable by a maintainer decision rather than more
engineering work:** Success Criterion 2 ("neither an undo-snapshot nor a save serializes the full
campaign on every operation") is not literally true — `pushUndo()` still runs a full
`JSON.stringify(window.D)` on every destructive operation. This was a pre-declared, conditionally-
accepted, and measured deviation (D-10 in `13-CONTEXT.md`, empirically validated in
`13-PERF-MEASUREMENT.md` at 0.922 ms median against a realistic campaign), not an oversight — but no
`VERIFICATION.md`-level override has yet been formally accepted by a human. See the suggested
override block above. Everything else this phase promised — the SEC-03 whitelist, SEC-04 escaping,
PERF-02's dice-stats cap/delete/cursor-aggregate, all four MAINT-01 module splits (all 14 result
files under 800 lines, full suites green, DM-Screen characterization snapshot unchanged), MAINT-03's
markdown fix, MAINT-04's execCommand removal, MAINT-05's tab-registry/interval hardening, and
MAINT-06's console hygiene plus file-backup comment correction — is verified present, wired, and
behaviorally confirmed by the actual test suites (not by trusting the SUMMARYs).

Two open code-review Warnings (`13-REVIEW.md`) remain unfixed and are carried forward here for
visibility, but neither undermines the literal text of any of the 8 success criteria: WR-01
(`insert-link` empty-anchor regression on collapsed selection) and WR-02 (removed console fallback +
DEBUG_MODE-gated security-rejection logging, a diagnosability regression). Both are recommended for
a follow-up fix (e.g., in Phase 14) rather than blocking this phase.

---

_Verified: 2026-09-06_
_Verifier: Claude (gsd-verifier)_
