---
phase: 10-security-h-rtung
verified: 2026-07-25T12:06:41Z
status: gaps_found
score: 3/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "SECURITY.md dokumentiert einen Audit über Import/Export, Storage/IDB, Datei-Backup und Rich-Text/innerHTML mit `threats_open: 0`"
    status: failed
    reason: >
      SECURITY.md section 4 ("Rich-Text & innerHTML") explicitly audits
      ui/editors/rich-text.js:handleEditorPaste() — naming "der in Phase 10
      ergänzten Ereignis-Attribut-Bereinigung" by name — and declares
      "Status: 0 offen". The per-phase threat register (10-SECURITY.md,
      T-10-15) marks this exact surface "closed"/"mitigate". Both claims are
      false: three independent adversarial verifiers confirmed, against the
      real production bundle (dist/dnd-tracker-bundled.html) with both a
      scripted paste harness AND a genuine OS-clipboard Ctrl+V (isTrusted=true),
      that pasting `<table><tr><td><iframe srcdoc="<script>...</script>">
      </iframe></td></tr></table>` into any rich-text field executes
      attacker-controlled JavaScript in the app's own origin immediately on
      paste — before any save-time sanitization runs. Source inspection
      (ui/editors/rich-text.js:958-995) confirms why: the table-paste branch
      applies no tag allowlist at all (iframe/object/embed/svg/form pass
      through untouched — only a fixed denylist of noise tags is stripped)
      and no URL-scheme/srcdoc filtering; the on*-attribute-stripping regex
      added by Plan 10-04 is itself bypassable because both patterns require
      a leading `\s+` before `on\w+`, so an attribute with no preceding
      whitespace survives. This is the exact surface (table branch,
      event-attribute cleaning) that T-10-15 and SECURITY.md section 4 claim
      is closed. No accept-disposition in 10-SECURITY.md covers the
      tag-allowlist/srcdoc gap: T-10-17's accepted risk is scoped only to
      "regex-based markup cleaning in general (nested quotes, entity-encoded
      attribute values)", not to entirely-unfiltered dangerous tags. The
      phase's own regression test (editor-insert.spec.js "Sicherheits-
      Regression: Ereignis-Attribut...") only asserts absence of on*
      attributes after paste — never absence of iframe/object/embed/svg tags
      or dangerous URL schemes — so this vector is invisible to the phase's
      test suite (confirmed by grep: no iframe/srcdoc test exists in that
      file). Mitigating context (does not change the verdict): this is not
      stored XSS — all 22 HTML-bearing fields still pass through
      sanitizeHTML() at the save boundary, so the malicious markup does not
      survive into D or a reload; the blast radius is confined to the
      currently-open editor tab until next save/reload. But the roadmap
      success criterion requires SECURITY.md to document the audit "ohne
      offene Findings" (without open findings), and a confirmed,
      empirically-reproducible same-origin script-execution path in exactly
      the audited component is an open finding, regardless of its bounded
      blast radius.
    artifacts:
      - path: "SECURITY.md"
        issue: "Section 4 ('Rich-Text & innerHTML') declares 'Status: 0 offen' while a confirmed script-execution vector exists in the exact surface it names as audited (handleEditorPaste table branch)."
      - path: ".planning/phases/10-security-h-rtung/10-SECURITY.md"
        issue: "T-10-15 threat register row marks the table-paste XSS 'closed'/'mitigate'; the underlying fix (event-attribute regex) is bypassable (missing-space case) and does not address the tag-allowlist/URL-scheme gap that makes the vector exploitable regardless of the event-attribute fix."
      - path: "ui/editors/rich-text.js"
        issue: "handleEditorPaste() table branch (lines 958-995) has no tag allowlist and no dangerous-URL/srcdoc filtering; on*-attribute regex at lines 966-967 requires leading whitespace and is bypassable."
      - path: "tests/e2e/features/editor-insert.spec.js"
        issue: "Regression test for the table-paste branch only checks for absence of on* attributes; does not cover disallowed tags (iframe/object/embed/svg/form) or dangerous URL schemes, so it does not catch the confirmed bypass."
    missing:
      - "Route the extracted table HTML through the real allowlist-based sanitizer (window.sanitizeHTML()) — or an equivalent tag-allowlist + protocol-filtering pass — before insertHtmlAtSelection() in the table-paste branch."
      - "Add a Playwright/unit regression case pasting a <table> containing <iframe srcdoc=...>/<svg onload=...>/<a href=\"javascript:...\"> and assert no script execution and no disallowed tag survives, mirroring the coverage import-security.spec.js already has for the import path."
      - "Correct T-10-15's disposition in 10-SECURITY.md (or add an explicit, justified accept-disposition covering the tag/URL-scheme gap) and update SECURITY.md section 4's 'Status: 0 offen' claim once the true state is settled — a document asserting zero open findings must not contain an inaccurate 'closed' status for a reproducible finding."
---

# Phase 10: Security-Härtung Verification Report

**Phase Goal:** Der vorbestehende Import-XSS ist geschlossen und die kritischen Angriffsflächen der App sind mit einem aktuellen Security-Audit ohne offene Findings dokumentiert.
**Verified:** 2026-07-25T12:06:41Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Der vorbestehende Import-XSS (Critical aus 01-REVIEW.md) ist behoben | ✓ VERIFIED | `renderMarkdownInContent()` (ui/editors/markdown-converter.js) now sanitizes identically to its twin `markdownToHtml()`; `renderWikiDetail()` (features/wiki/wiki.js) sanitizes before TOC-anchor injection. Confirmed via source read and via the passing `tests/e2e/features/import-security.spec.js` exploit-chain test (see #2). |
| 2 | Ein Regressionstest belegt: eine bösartige Import-Datei wird sanitisiert, kein Skript wird ausgeführt | ✓ VERIFIED | `tests/e2e/features/import-security.spec.js:90-206` ("Import-Sicherheit — Exploit-Kette Datei → Wiki-Anzeige (SEC-01)") imports a campaign file with `<img src=x onerror=...>` in a wiki entry, opens it, and asserts: no `on*` attribute survives, `scriptCount === 0`, `imgCount === 0`, `window.__xssImport10` is undefined, no page/console errors, and the harmless text content is preserved. A second test in the same file covers `<script>`, `javascript:` links, and `<svg onload>`. Both are the exact CR-01 exploit vector from 01-REVIEW.md. |
| 3 | SECURITY.md dokumentiert einen Audit über Import/Export, Storage/IDB, Datei-Backup und Rich-Text/innerHTML mit `threats_open: 0` | ✗ FAILED | SECURITY.md (root) and 10-SECURITY.md exist with the required structure and `threats_open: 0`, but the claim is factually inaccurate for the Rich-Text/innerHTML surface: a confirmed, empirically-reproduced same-origin script-execution vector exists in exactly the component SECURITY.md section 4 names as audited (`handleEditorPaste()` table branch). See Gaps below. |
| 4 | Der Audit ist via `/gsd-secure-phase` gegen die relevanten Phasen durchgeführt (inkl. der neuen Editor-Implementierung aus Phase 9) | ✓ VERIFIED (process) | `10-SECURITY.md` frontmatter shows `audit_mode: verify-mitigations`, scope section lists all Plan 10-01..10-04 touched files, and the root SECURITY.md references and consolidates per-phase registers from Phases 1, 2, 9, and 10, including phase 9's editor implementation. The audit process artifact exists and covers the right phases — its content accuracy is the issue captured in Truth #3, not its existence/process. |

**Score:** 3/4 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `ui/editors/markdown-converter.js` | `renderMarkdownInContent()` sanitizes HTML before return | ✓ VERIFIED | Matches twin `markdownToHtml()`, per REVIEW.md and 10-SECURITY.md T-10-01 |
| `features/wiki/wiki.js` | `renderWikiDetail()` sanitizes before TOC anchor injection | ✓ VERIFIED | Call order fixed per T-10-02/T-10-04 |
| `systems/spellslots/import-export.js` | `HTML_FIELDS_BY_TYPE` + `sanitizeImportedItem()` wired into both import entry points, both branches | ✓ VERIFIED (with a documented, non-blocking scope gap: `loot` field omitted per WR-01, mitigated by an independent render-time `sanitizeHTML()` call in `features/initiative.js`; not a Success-Criterion blocker) | T-10-05..T-10-09 |
| `utils/basic.js` / `utils/testable-utils.js` | `sanitizeHTML()` parity, `<strike>` addition | ✓ VERIFIED | `tests/unit/sanitizer-parity.test.js` passing |
| `ui/editors/rich-text.js` | `handleEditorPaste()` table branch hardened against injected script | ✗ STUB (incompletely hardened) | Event-attribute stripping added (Plan 10-04) but bypassable (missing-space case) and no tag-allowlist/URL-scheme filtering exists at all — `<iframe srcdoc>` executes on paste. See Gaps. |
| `tests/e2e/features/import-security.spec.js` | Regression test for import-boundary XSS | ✓ VERIFIED | Covers the exact SC1/SC2 vector |
| `tests/e2e/features/editor-insert.spec.js` | Regression test for paste-boundary XSS | ⚠️ INCOMPLETE | Only asserts absence of `on*` attributes; does not test disallowed tags or URL schemes, so does not catch the confirmed CR-01 bypass |
| `SECURITY.md` (root) | Consolidated audit, `threats_open: 0`, accurate | ✗ Content inaccurate | Section 4 "Status: 0 offen" claim contradicted by CR-01 |
| `.planning/phases/10-security-h-rtung/10-SECURITY.md` | Per-phase threat register, all threats dispositioned | ✗ Content inaccurate | T-10-15 marked "closed" incorrectly |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| Import file → `sanitizeImportedItem()` → `D.wiki`/etc. | Persisted data | `HTML_FIELDS_BY_TYPE` mapping in both `executeImport()` and `importDataGlobal()` (both branches) | WIRED | Confirmed via source and `import-security.spec.js` asserting saved-state cleanliness |
| Wiki display → `renderMarkdownInContent()` → `sanitizeHTML()` | Rendered DOM | Return-value sanitization before `innerHTML` assignment | WIRED | Confirmed |
| Rich-text paste (table branch) → cleaning chain → `insertHtmlAtSelection()` | Live editor DOM | Bespoke regex chain (not `sanitizeHTML()`) | PARTIALLY WIRED / INSUFFICIENT | The chain removes a fixed attribute/tag denylist but never routes through the real allowlist sanitizer, so it does not block `<iframe>`/`<svg>`/`<object>`/`<embed>`/`<form>` or `srcdoc`/`javascript:`/`data:` — confirmed by source read (rich-text.js:958-995) and by 3/3 independent adversarial reproductions against the production bundle |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SEC-01 | Phase 10 (Plans 10-01, 10-02) | Vorbestehender Import-XSS behoben, mit Regressionstest | ✓ SATISFIED | `import-security.spec.js` passing; source confirms fix |
| SEC-02 | Phase 10 (Plan 10-05) | Security-Audit nachgezogen: SECURITY.md mit `threats_open: 0` für die kritischen Angriffsflächen, via `/gsd-secure-phase` | ✗ BLOCKED | Audit artifact exists and covers the right scope/process, but its `threats_open: 0` claim is factually false for the Rich-Text/innerHTML surface (confirmed reproducible CR-01 finding, undisclosed/uncovered by any accept-disposition). Cannot be marked satisfied while the document it requires is materially inaccurate. |

No orphaned requirements found — REQUIREMENTS.md maps only SEC-01 and SEC-02 to Phase 10, both accounted for above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `ui/editors/rich-text.js` | 966-967 | Regex requires leading `\s+` before `on\w+=`, allowing a no-space attribute (`onerror=` directly abutting the previous attribute value) to survive | 🛑 Blocker (component of CR-01) | Confirmed bypass |
| `ui/editors/rich-text.js` | 958-995 | No tag allowlist in table-paste branch — `iframe`/`object`/`embed`/`svg`/`form` pass through | 🛑 Blocker (component of CR-01) | Confirmed same-origin script execution via `<iframe srcdoc>` |
| `ui/editors/markdown-converter.js` | 264 | Dead variable `hasHtmlTags`, computed but unused (IN-01) | ℹ️ Info | Confirmed real bug: markdown conversion runs unconditionally over already-HTML content, causing observable corruption (`Der_Hobbit_Buch` → broken link/italics) per the independent verifier's reproduction. Display-only, does not affect Success Criteria. |
| `features/wiki/wiki.js` | 390-394 | Duplicate `data-id` attribute (WR-02) | ℹ️ Info | Cosmetic, no functional consequence (parser drops the duplicate) |
| `systems/spellslots/import-export.js` | 148-158 | `HTML_FIELDS_BY_TYPE` omits `loot` (WR-01) | ℹ️ Info | Not exploitable today — an independent render-time `sanitizeHTML()` call in `features/initiative.js` covers `loot.description`; deliberately scoped per 10-02-PLAN.md, but inconsistent with the "Render-Pfad-Audit" completeness claim |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Import-boundary XSS regression exists and is well-formed | `grep -n "test\|describe" tests/e2e/features/import-security.spec.js` | Two exploit-chain tests found, both asserting `errors === []`, no `on*`/`script`/`img` survives, no window-flag set | ✓ PASS |
| Paste-boundary regression covers the confirmed CR-01 vector | `grep -n "iframe\|srcdoc\|on\\w" tests/e2e/features/editor-insert.spec.js` | No matches for iframe/srcdoc — confirms the phase's own test suite does not cover this vector | ✗ FAIL (confirms the gap, does not itself indicate a missing artifact) |
| `handleEditorPaste()` table branch source matches the reviewed/reproduced vulnerability | Direct source read, `ui/editors/rich-text.js:952-1024` | Regex chain has no tag allowlist, no URL/srcdoc filtering, and the on*-attribute regex requires leading whitespace | ✗ FAIL (confirms CR-01 as filed) |

Not independently re-run: the orchestrator's six adversarial verifiers already produced a 3/3-confirmed empirical reproduction (scripted harness AND genuine OS clipboard paste) against the actual production bundle, including `document.title` rewrite and `window.__cr01` observables. Re-running that exploit was not repeated here — source-level confirmation of the exact bypassable regex pattern (Step 7b-equivalent spot check) independently corroborates the same root cause reported by the adversarial verifiers, so the finding is treated as established rather than re-run from scratch.

### Human Verification Required

None. The core disputed finding (CR-01 / SC3) is resolvable from source and from the already-completed adversarial empirical reproduction — no additional human judgment is needed to determine that SC3, as literally worded ("ohne offene Findings"), is not currently true.

### Gaps Summary

Three of four Success Criteria hold cleanly: the original import-XSS (SC1) is genuinely fixed and regression-tested (SC2), and a real audit process was run across the right phases (SC4, process-level). The blocking gap is SC3: **SECURITY.md's central claim — `threats_open: 0`, "ohne offene Findings" — is not accurate.** The phase's own code review (10-REVIEW.md CR-01) identified a same-origin script-execution vector in `handleEditorPaste()`'s table-paste branch that survives the phase's fix (an event-attribute regex that is itself bypassable, and which never addressed the complete absence of a tag allowlist or URL/srcdoc filtering in that branch). Three independent adversarial verifiers reproduced this against the real production bundle with a genuine OS clipboard paste, confirming same-origin script execution (`document.title` rewrite, reachable `window.parent`/`localStorage`). The per-phase threat register's T-10-15 entry and the root SECURITY.md section 4 both mark this surface "closed"/"0 offen," which this verification finds to be false.

The mitigating context is real and narrows scope, not severity of the documentation gap: this is not stored XSS (the save-time `sanitizeHTML()` boundary still holds — 0/10 payloads survived into `D` in the adversarial verifier's testing), so persisted campaign data is not at risk, and the blast radius is confined to the currently-open editor tab pre-reload, requiring a social-engineering precondition (a user must paste attacker-controlled clipboard content). Given the app's stated single-user/offline threat model, this is a bounded issue — but "bounded" is not "zero," and the roadmap's own wording requires zero open findings, not zero *critical* findings.

**What closing this gap requires:** route the extracted table HTML through `window.sanitizeHTML()` (or equivalent tag-allowlist + protocol-filtering) before `insertHtmlAtSelection()` in the table-paste branch of `handleEditorPaste()`; add a regression test covering `<iframe srcdoc>`/`<svg onload>`/`javascript:` inside pasted `<table>` markup; then correct T-10-15's disposition and the SECURITY.md "0 offen" claim to reflect the true, now-closed state (or, if the team decides the residual risk is acceptable given the bounded blast radius, add an explicit, justified accept-disposition for the tag-allowlist gap — distinct from T-10-17's narrower "nested quotes" scope — rather than leaving an inaccurate "closed"/"0 offen" claim in place).

---

_Verified: 2026-07-25T12:06:41Z_
_Verifier: Claude (gsd-verifier)_
