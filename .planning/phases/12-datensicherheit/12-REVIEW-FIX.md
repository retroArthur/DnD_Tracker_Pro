---
phase: 12-datensicherheit
fixed_at: 2026-09-05T14:10:48Z
review_path: .planning/phases/12-datensicherheit/12-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 12: Code Review Fix Report

**Fixed at:** 2026-09-05T14:10:48Z
**Source review:** .planning/phases/12-datensicherheit/12-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope (fix_scope = critical_warning): 2 (CR-01, WR-01)
- Fixed: 2
- Skipped: 0
- Out of scope (not attempted): 1 (IN-01, Info severity)

## Fixed Issues

### CR-01: importFullExport() schreibt Kampagnen teilweise, bevor ein späterer Formfehler den gesamten Import als fehlgeschlagen meldet

**Files modified:** `systems/migration/full-export.js`, `tests/unit/full-export.test.js`
**Commit:** `905168e`
**Applied fix:** Extracted the `campaign.data` shape check (`!campaign.data || typeof campaign.data !== 'object'`) out of the write loop into its own pre-loop over all `campaignEntries`, placed directly after the existing key-whitelist pre-loop (`ALLOWED_KEY_RE`) and before the loop that calls `StorageAPI.setJSON()`. This mirrors the pre-existing pattern for the `_exportType`/`campaigns`/`campaignIndex`/`MAX_IMPORT_CAMPAIGNS`/`ALLOWED_KEY_RE` checks, which already ran fully before any write. Now a form error in ANY campaign entry (regardless of position) throws before the first `StorageAPI.setJSON()` call, so no campaign can be partially/orphan-written to localStorage while the wizard reports "Import fehlgeschlagen".

Also satisfies the two-part `12-VERIFICATION.md` gap (Truth 9, SAFE-01):
1. The pre-write validation loop itself (described above).
2. A new regression test in `tests/unit/full-export.test.js`, inside the existing `describe('Ablehnungen — es wird nichts geschrieben, bevor geworfen wird', ...)` block: `'gueltige Kampagne gefolgt von Kampagne mit ungueltigem campaign.data wird VOLLSTAENDIG abgelehnt (CR-01)'`. It builds an export with a valid `'dnd-tracker-data'` campaign followed (insertion order matters — `Object.entries()` preserves it) by an invalid `'dnd-campaign-kaputt'` entry (`data: null`), and asserts that `importFullExport()` throws AND that nothing was written to `writtenKeys` (the mocked `StorageAPI.setJSON` sink) nor `savedIndexCalls`.

**Test proven real (per instructions):** ran the new test against the UNFIXED source first — it failed (`Expected length: 0, Received length: 1, Received array: ["dnd-tracker-data"]`), proving the orphan-write bug is real and the test catches it. Then restored the fix and re-ran — all 23 tests in `full-export.test.js` pass, including the new one.

### WR-01: validateAvatarURL() lässt sich durch eingebettete Steuerzeichen umgehen

**Files modified:** `systems/avatars.js`, `tests/unit/avatars.test.js` (new file — no prior test coverage existed for `systems/avatars.js`)
**Commit:** `d2a521c`
**Applied fix:** Before the `dangerousProtocols.some(...)` comparison, added `trimmed.replace(/[\x00-\x20\x7F\s]/g, '')` (removes ASCII C0 controls U+0000–U+001F, space U+0020, DEL U+007F, and any other whitespace) to build a dedicated `strippedForProtocolCheck`/`lowerStrippedForProtocolCheck` pair used only for the dangerous-protocol prefix check — narrower than the review's own suggested `\t\n\r`-only strip, per the additional_requirement to strip everything browsers ignore when resolving a scheme, not just leading/trailing whitespace. The rest of the function (relative-path shortcut, `data:image/` allow-check, `new URL()` fallback) is untouched and still operates on the original `trimmed`/`lowerUrl`, keeping the change narrowly scoped to the flagged comparison.

Added `tests/unit/avatars.test.js` (new — none existed): loads `systems/avatars.js` in a `vm` context (Node's global `URL` passed in explicitly, since `vm.createContext()` does not inherit host globals and `validateAvatarURL()` calls `new URL()`), covering baseline accept/reject behavior plus the embedded-control-character bypass (`java\tscript:`, `jav\nascript:`, `jav\rascript:`, mixed, `vb\tscript:`, `fi\tle:`, embedded space).

**Important finding during verification (documented for future readers):** for every payload in the `dangerousProtocols` list (`javascript:`, `file:`, `vbscript:`, `data:text/html`), Node's (and every WHATWG-URL-conformant browser's) `new URL()` constructor *also* strips embedded tab/newline before parsing, so the pre-existing final `['http:','https:'].includes(parsed.protocol)` whitelist check already rejects these specific embedded-control payloads via the fallback path — **on both the fixed and unfixed source**, the end-to-end boolean return value for these exact test payloads is `false` either way (confirmed empirically). This matches the review's own text ("aktuell kein direkt auslösbarer XSS-Pfad") — the bug is a defense-in-depth/promise-consistency issue (the denylist doesn't do what it claims on its own), not a currently observable functional difference in the full function's output, given the function's structure. Because of this, a purely end-to-end boolean assertion cannot discriminate fixed vs. unfixed source. To provide the "prove it's real" regression guarantee requested, a source-text assertion test was added (pattern borrowed from this codebase's existing `full-export.test.js` "Quelltext-Beleg" convention): it asserts a `.replace()` call stripping `\x00`-range characters exists in `systems/avatars.js` **before** the `dangerousProtocols.some(` call. **Verified**: this test fails on the unfixed source (`Expected: > -1, Received: -1`) and passes with the fix applied. All 14 tests in `avatars.test.js` pass with the fix in place.

## Out of Scope

### IN-01: loader.js-Kommentar widerspricht der dokumentierten SSOT-Architektur

**File:** `loader.js:9`
**Reason:** `fix_scope` for this run is `critical_warning`, which excludes Info-severity findings. Not attempted; left for a future `fix_scope: all` run or manual fix.

## Verification

- Ran inside an isolated git worktree (`gsd-reviewfix/12-1452`), per the `setup_worktree` protocol (`workflow.use_worktrees` was not set to `false` in `.planning/config.json`, so the default worktree isolation path ran).
- `npx jest tests/unit/full-export.test.js` — 23/23 passed (fixed source).
- `npx jest tests/unit/avatars.test.js` — 14/14 passed (fixed source), new file.
- Full `npx jest` run inside the worktree showed 906 passed / 908 total, with 2 pre-existing failures in `tests/unit/stability.test.js` (regex-based source-text assertions expecting LF line endings in `systems/spellslots/persistence.js`). Investigated and confirmed this is a **worktree-checkout CRLF artifact, not caused by this fix session**: `systems/spellslots/persistence.js` was never touched by either fix, `git status --porcelain`/`git diff --stat` report it as clean/empty in the worktree (matching the documented "Known quirk" in the task environment notes), and the SAME test file passes 89/89 when run directly in the main checkout (`D:/Claude_Code/Projekte/DnD_Tracker_App_Pro`), which has LF line endings for that file. This is an artifact of `core.autocrlf=true` applying during the fresh worktree checkout and is expected to disappear once the worktree is torn down and the fix commits are fast-forwarded onto `main` (no working-tree re-checkout of unrelated files happens during that step).
- **Numbers reported above (23/23, 14/14, 906/908) were produced inside the isolated worktree.** They are not independently reproducible from the main checkout after the worktree is torn down, except for the two new/modified test files themselves, which are plain content and unaffected by the CRLF artifact.

---

_Fixed: 2026-09-05T14:10:48Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
