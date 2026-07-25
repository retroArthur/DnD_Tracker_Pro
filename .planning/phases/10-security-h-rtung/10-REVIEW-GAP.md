---
phase: 10-security-h-rtung
reviewed: 2026-07-25T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - ui/editors/rich-text.js
  - tests/e2e/features/editor-insert.spec.js
  - SECURITY.md
  - .planning/phases/10-security-h-rtung/10-SECURITY.md
findings:
  critical: 0
  warning: 3
  info: 1
  total: 4
status: issues_found
---

# Phase 10: Code Review Report (Gap-Closure Round)

**Reviewed:** 2026-07-25
**Depth:** standard
**Files Reviewed:** 4
**Scope:** commits `ce6751f`, `46832f3`, `fbd1433`, `2836422` (diff base `d83dfa8`)
**Status:** issues_found

## Summary

This is a narrow review of the Plan 10-06 gap-closure round only. Per the task's
`<already_established_do_not_redo>` block, the security substance of the fix (the
table-paste branch of `handleEditorPaste()` now routing through `window.sanitizeHTML()`
as the last transformation, with a genuinely fail-closed fallback) was already
verified in depth by two independent adversarial passes and is not re-litigated here.

This review instead targeted (1) code quality/convention compliance of the new
`rich-text.js` code, (2) quality of the new `editor-insert.spec.js` assertions, and
(3) accuracy of the claims added/edited in `SECURITY.md` and `10-SECURITY.md` — the
latter being the important axis, since the round's own stated root cause was a
security document asserting something the code did not do.

Result: the code change itself (`ui/editors/rich-text.js`, commit `46832f3`) is clean
— no function-scoped `const X = window.X` aliasing, no `execCommand`, no
`console.*`/debug artifacts, no dead code left over from the removed `on*` regexes,
and the corrected comment about `createContextualFragment()`/`<iframe srcdoc>` is
accurate against current behavior. `10-SECURITY.md` is internally consistent and its
dates match actual git history.

However, the root-level `SECURITY.md` — the document commit `2836422` specifically
rewrote to "reflect the bewiesenen Endstand" — contains two classes of factual drift
introduced by this very round: five stale line-number citations into
`ui/editors/rich-text.js` (the same commit correctly recomputed the sibling
`utils/basic.js` citations but did not redo this for `rich-text.js`, even though
`rich-text.js` is the file that changed), and an `audit_date`/correction date
(`2026-07-26`) that does not match any commit timestamp in the round (all five
commits are dated `2026-07-25`) and contradicts `10-SECURITY.md`'s own dating for the
same event. Neither defect misstates what the security control actually does, but
both directly undermine the document's own repeated claim of being "gegen den
dortigen Quelltext geprüft, nicht angenommen" (checked against the actual source,
not assumed) — which is precisely the failure mode this gap-closure round exists to
close. Separately, the two brand-new E2E tests introduce fixed `page.waitForTimeout()`
calls against a documented project anti-pattern.

## Warnings

### WR-01: `SECURITY.md` cites five stale line numbers into `ui/editors/rich-text.js`

**File:** `SECURITY.md:86` (Abschnitt 4, "Geprüfte Dateien und Codepfade")
**Issue:**
Five line-number citations added/kept in commit `2836422` do not resolve to the
functions/statements they name in the current source. All five are the *pre-fix*
line numbers from before `46832f3` shifted the file by +8 (first hunk, the corrected
`createContextualFragment()` comment) and +44 (second hunk, the sanitizer-routing
change) net lines — `2836422` was authored *after* `46832f3` specifically to describe
the post-fix state, but never recomputed these five numbers even though it correctly
recomputed the four sibling citations into `utils/basic.js` in the same edit (those
now correctly read `Zeile 58`/`72`/`150`/`168ff.`, verified against source):

| Citation in `SECURITY.md` | Points to | Cited line | Actual current line |
|---|---|---|---|
| `handleEditorPaste() (Zeile 952)` | `function handleEditorPaste(e) {` | 952 | 960 |
| `insertHtmlAtSelection() (Zeile 850, ...)` | `function insertHtmlAtSelection(htmlString) {` | 850 | 858 |
| `Link-Einfügen (Zeile 1240, prompt() → link.href)` | `const url = prompt('URL eingeben:', 'https://');` | 1240 | 1284 |
| `saveSpell() (Zeile 1632, ...)` | `function saveSpell() {` | 1632 | 1676 |
| `sanitizeHTML(descHtml) an Zeile 1684` | `description: sanitizeHTML(descHtml),` | 1684 | 1728 |

Verified via `grep -n` against `ui/editors/rich-text.js` at current HEAD.

**Fix:**
```diff
- `ui/editors/rich-text.js` — `handleEditorPaste()` (Zeile 952) mit dem Tabellenzweig: ...
- `insertHtmlAtSelection()` (Zeile 850, alle drei aktuellen Aufrufstellen geprüft; ...);
- ...; Link-Einfügen (Zeile 1240, `prompt()` → `link.href`); `saveSpell()` (Zeile 1632, `sanitizeHTML(descHtml)` an Zeile 1684)
+ `ui/editors/rich-text.js` — `handleEditorPaste()` (Zeile 960) mit dem Tabellenzweig: ...
+ `insertHtmlAtSelection()` (Zeile 858, alle drei aktuellen Aufrufstellen geprüft; ...);
+ ...; Link-Einfügen (Zeile 1284, `prompt()` → `link.href`); `saveSpell()` (Zeile 1676, `sanitizeHTML(descHtml)` an Zeile 1728)
```
Also double-check the cosmetic-chain range cited as "Zeilen ~968-994" (the full chain
that removes noise tags/attributes and injects default table styling now runs to
~line 1011, not 994) and re-verify after applying the fix above, since the `~`
approximation may itself now be short by the same shift.

---

### WR-02: `SECURITY.md`'s stated correction date (`2026-07-26`) does not match the actual commit history

**File:** `SECURITY.md:2` (frontmatter `audit_date`), and body text at lines 15, 22, 143
**Issue:**
`SECURITY.md`'s frontmatter sets `audit_date: 2026-07-26`, and the body repeats
`2026-07-26` three more times ("Gap-Closure-Runde Plan 10-06 korrigiert am
2026-07-26", "Korrektur (Plan 10-06, 2026-07-26)", "korrigiert am 2026-07-26"). The
actual gap-closure commits are all dated `2026-07-25`:

```
b908362 2026-07-25 16:04:51 +0200 docs(10-06): complete Gap-Closure SC3 plan
2836422 2026-07-25 16:00:57 +0200 docs(10-06): korrigiere Threat-Register und SECURITY.md ...
fbd1433 2026-07-25 15:55:34 +0200 docs(10-06): Kommentarblöcke ...
46832f3 2026-07-25 15:49:53 +0200 fix(10-06): Tabellenzweig ueber Allowlist-Sanitizer ...
ce6751f 2026-07-25 15:47:15 +0200 test(10-06): red — Mehrfach-Vektor-Regressionstest ...
```

`10-SECURITY.md` — the per-phase artifact `SECURITY.md` explicitly claims to be
"konsolidiert aus" — correctly uses `2026-07-25` throughout for this same event
("Gap-closure correction (Plan 10-06, same date)", audit-trail row "2026-07-25
(gap-closure)", sign-off "corrected 2026-07-25 (Plan 10-06 gap-closure)"). So the two
documents that are supposed to be consistent with each other disagree by one day, and
only the root `SECURITY.md` is wrong. `2026-07-26` is also one day in the future
relative to the environment's current date.

**Fix:** Change `audit_date: 2026-07-26` to `audit_date: 2026-07-25` in the
frontmatter, and replace the three `2026-07-26` occurrences in the body with
`2026-07-25` to match `10-SECURITY.md` and the git history it is meant to reflect.

---

### WR-03: New E2E tests use fixed `page.waitForTimeout()` against documented project guidance

**File:** `tests/e2e/features/editor-insert.spec.js:438, 527, 542`
**Issue:**
The two tests newly added in commit `ce6751f` — "Sicherheits-Regression:
Tabellen-Paste mit eingebettetem Rahmen, Vektorgrafik und Skript-Protokoll ... (SC3,
CR-01)" and "Randfall: Sanitizer nicht erreichbar oder ohne Ergebnis ..." — call
`await page.waitForTimeout(300);` a total of three times before asserting on DOM
state. `.planning/codebase/TESTING.md:146` documents this as a known anti-pattern for
*existing* tests ("Synchronization in E2E currently uses fixed
`page.waitForTimeout(300-500)` — fragile; prefer `waitForSelector`/`waitForFunction`
when writing new tests"), i.e. new tests are specifically asked not to add more of
this pattern.

In this specific case the wait also appears unnecessary: `handleEditorPaste()` calls
`sanitizeHTML()` and `insertHtmlAtSelection()` synchronously inside the `paste` event
handler, and `pasteInto()` dispatches the event synchronously via
`el.dispatchEvent(evt)` inside `page.evaluate`, so the DOM should already reflect the
final sanitized state the instant `page.evaluate()` resolves — there is no pending
async work to "settle." The accompanying comment justifies the wait as letting
"Iframe-/SVG-Ladeereignisse" settle, but under the fix being tested, `<iframe>` and
`<svg>` are stripped to text by `sanitizeHTML()` *before* the fragment is ever
inserted into the DOM, so no such elements exist post-insertion to fire load events
in the first place. The wait doesn't make the assertions vacuous (they're structural,
not timing-gated), but it adds ~900ms of unnecessary runtime and reintroduces the
exact flakiness risk the project's own test guidance warns against.

**Fix:** Replace the three `page.waitForTimeout(300)` calls with a structural wait,
e.g. poll on the assertion itself:
```js
await expect
    .poll(() => editor.evaluate(el =>
        el.querySelectorAll('iframe, object, embed, svg, form, script, img').length
    ))
    .toBe(0);
```
or, since the operation is synchronous, drop the wait entirely and assert
immediately after `pasteInto()` resolves.

## Info

### IN-01: New comment lists an incomplete dangerous-protocol set

**File:** `ui/editors/rich-text.js:1017-1018`
**Issue:** The comment added by `46832f3` states the sanitizer blocks "ein
gefaehrliches Protokoll (javascript:/vbscript:/data:)", naming three protocols. The
actual `dangerousProtocols` array in `utils/basic.js:129` is
`['javascript:', 'vbscript:', 'data:', 'file:', 'blob:']` — five entries. The comment
isn't wrong (it doesn't claim these are the only ones), but it's an incomplete
illustrative list right next to a claim that is otherwise very precise about the
sanitizer's guarantees, so a future reader could mistake it for the complete set.
**Fix:** Either list all five protocols or phrase it as "u.a." / "among others" to
avoid implying completeness.

---

_Reviewed: 2026-07-25_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
