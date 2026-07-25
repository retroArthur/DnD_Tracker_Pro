---
phase: 10
slug: security-h-rtung
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-25
register_authored_at_plan_time: true
audit_mode: verify-mitigations
---

# Phase 10 — Security (Security-Härtung: the fixes themselves)

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Phase 10 (`10-security-h-rtung`) authored formal `<threat_model>` blocks in every
> plan (10-01 through 10-05, 22 threats total: T-10-01..T-10-22, plus the repeated
> supply-chain `T-10-SC`). This audit verifies mitigations against the codebase state
> AFTER all fixes (2026-07-25), per D-11 — this phase's own security work IS the
> subject of the audit, so "verify mitigations" here means confirming the fixes
> landed exactly as each plan's SUMMARY claims and the full test suite proves it.
>
> **Gap-closure correction (Plan 10-06, same date):** the 2026-07-25 audit run below
> closed T-10-15 based on the Plan-10-04 event-attribute fix alone. `10-REVIEW.md`
> CR-01 (code review) and `10-VERIFICATION.md` (SC3 gap analysis) subsequently
> confirmed the fix was incomplete — the table branch of `handleEditorPaste()` had
> no tag allowlist and no protocol filter, so a same-origin script-execution vector
> (`<iframe srcdoc>`) remained fully exploitable regardless of the event-attribute
> fix. Plan 10-06 closes this gap structurally (DOM-based allowlist sanitizer as the
> last transformation before insertion) and corrects T-10-15, T-10-17/AR-10-02, and
> adds T-10-23..T-10-29 below to reflect the now-true state.

---

## Scope — Files & Code Paths Audited

All files touched by Plans 10-01 through 10-06 (see their SUMMARY `key-files` sections,
already cross-checked against source in this audit — see Phase 1, 2, 9 audits above for
the shared files re-verified from their perspective):

- `ui/editors/markdown-converter.js` — `renderMarkdownInContent()`
- `features/wiki/wiki.js` — `renderWikiDetail()`, `saveWikiEntry()`, edit-reopen path
- `systems/spellslots/import-export.js` — `HTML_FIELDS_BY_TYPE`, `sanitizeImportedItem()`, `showImportModal()`, `executeImport()`, `importDataGlobal()`
- `utils/basic.js` / `utils/testable-utils.js` — `sanitizeHTML()` `allowedTags` (`<strike>` addition, D-06), parity enforcement (UNCHANGED by Plan 10-06 — the sanitizer twins were explicitly out of scope for the gap-closure fix)
- `ui/editors/rich-text.js` — `handleEditorPaste()` table branch, `saveSpell()`; Plan 10-06 routes the table branch through `window.sanitizeHTML()` as the last stage before `insertHtmlAtSelection()` and removes the bypassable Plan-10-04 event-attribute regex pair
- `.planning/WINDOWS.md` — Broken-Windows-Ledger entry #1 (status transition to `fixed`)
- Test files: `tests/e2e/features/import-security.spec.js`, `tests/e2e/features/wiki.spec.js`, `tests/unit/import-sanitization.test.js`, `tests/unit/sanitizer-parity.test.js`, `tests/unit/security.test.js`, `tests/e2e/features/editor-formatting.spec.js`, `tests/e2e/features/editor-insert.spec.js` (Plan 10-06: new multi-vector regression case + fail-closed edge-case test)

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Fix → verified-closed threat | Each plan's threat register entry only counts as closed once its own `<verify>` command AND the full suite pass | Test results, not user data |
| Broken-Windows-Ledger → `/gsd-ship` gate | An open ledger entry blocks shipping regardless of other phase state | Ledger status field |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-10-01 | Tampering / Elevation of Privilege | `renderMarkdownInContent()` → `wiki.js` `innerHTML` | critical | mitigate | `sanitizeHTML()` at the end of `renderMarkdownInContent()` (D-01); proven by `tests/e2e/features/import-security.spec.js` (full chain: malicious file → import → display). Verified current source (Phase 1 audit, T-01-01). | closed |
| T-10-02 | Tampering | `parseWikiLinks()` — unescaped link text | high | mitigate | Call order fixed: sanitize before `parseWikiLinks()`; code comment documents the invariant (`wiki.js:423-427`). | closed |
| T-10-03 | Repudiation | Regression test as evidence | high | mitigate | Test run red against the unpatched build first, red output recorded in `10-01-SUMMARY.md` (commit `e1f5a2b`). | closed |
| T-10-04 | Denial of Service | TOC jump-anchor loss from stripped `id` attributes | medium | mitigate | Anchor injection moved after sanitization; anchors are code-generated (`toc-N`), never user input; E2E regression in `wiki.spec.js`. | closed |
| T-10-05 | Tampering | `executeImport()` — `validatedItems` mapping | high | mitigate | `sanitizeImportedItem()` wired into the mapping (`import-export.js:335`); unit-proven across all nine entity types (`tests/unit/import-sanitization.test.js`). | closed |
| T-10-06 | Tampering | `importDataGlobal()` "new campaign" branch | high | mitigate | Sanitization loop runs BEFORE the branch (`import-export.js:569-571`); source-structure test enforces the position permanently. | closed |
| T-10-07 | Tampering | `importDataGlobal()` "overwrite" branch | high | mitigate | Same pre-branch loop; additionally E2E-proven against the SAVED state (`import-security.spec.js`). | closed |
| T-10-08 | Denial of Service / Data Loss | Overwrite import with no undo point, no backup (WR-03) | high | mitigate | `saveUndoState()` + `createAutoBackup()` before the data swap (`import-export.js:618,620`), matching `executeImport()`'s pattern. | closed |
| T-10-09 | Tampering | Over-sanitization of non-listed fields could corrupt legitimate DM data | medium | mitigate | Field list capped at the nine audited fields (`HTML_FIELDS_BY_TYPE`); unit test requires byte-identical passthrough for non-listed fields. | closed |
| T-10-10 | Information Disclosure | Reporting sanitization actions could leak foreign-file content | low | accept | D-04: no such reporting exists (silent cleanup, no toast/log/dialog). | accept |
| T-10-11 | Repudiation | Security tests ran against `utils/testable-utils.js`, not production code | high | mitigate | New `vm`-based test block loads `utils/basic.js` from real source; a definedness check prevents silent no-op pass-through. | closed |
| T-10-12 | Tampering | Drift between the two sanitizer copies | high | mitigate | Parity test over a shared vector set, green before the whitelist change, remains a structural fence after. | closed |
| T-10-13 | Tampering | Extension of the allowed-tag whitelist (`<strike>`) | medium | mitigate | Exactly one additive entry for a pure text-decoration tag with no attributes and no script capability; attribute allowlist unchanged; full vector catalog re-run after the change. | closed |
| T-10-14 | Repudiation | Adjustment of a frozen net assertion | high | mitigate | Exactly one expectation value changed, in the direction of a STRICTER expectation; written justification in the net-freeze protocol (`09-BASELINE.md`, "Ausnahme-Änderung 8"); scope of the change verifiable via `git diff`. | closed |
| T-10-15 | Tampering / Elevation of Privilege | Table branch of `handleEditorPaste()` (Broken-Windows-Ledger #1) | critical | mitigate | **Corrected 2026-07-25 (Plan 10-06) — see traceability note below.** Actual mitigation: the table branch routes its cleaned markup through the project-wide DOM-based allowlist sanitizer `window.sanitizeHTML()` (`utils/basic.js`) as the LAST transformation before `insertHtmlAtSelection()`; the two whitespace-dependent event-attribute regexes adopted in Plan 10-04 (bypassable — required a leading space, so a directly-abutting attribute survived) were removed entirely; fail-closed fallback to `insertTextAtSelection()` if the sanitizer is unreachable or its result is empty/whitespace-only. Proof: `tests/e2e/features/editor-insert.spec.js` — "Sicherheits-Regression: Tabellen-Paste mit eingebettetem Rahmen, Vektorgrafik und Skript-Protokoll landet weder ausführbar noch als verbotenes Element im DOM (SC3, CR-01)", red before fix (commit `ce6751f`) / green after (commit `46832f3`). **Traceability note:** this entry was mis-classified `closed`/`mitigate` at severity `high` in the original 2026-07-25 audit (Plan 10-05), based solely on the Plan-10-04 event-attribute fix. `10-REVIEW.md` CR-01 (code review, same date) and `10-VERIFICATION.md` (SC3 gap, same date) both subsequently confirmed the fix was incomplete: the branch had no tag allowlist and no protocol filter at all, so a same-origin script-execution vector via an embedded frame with an inline-document attribute (`<iframe srcdoc>`) remained fully exploitable regardless of the event-attribute fix, empirically reproduced 3/3 against the production bundle including a genuine OS-clipboard paste. Corrected in this gap-closure round (Plan 10-06). | closed |
| T-10-16 | Tampering | `saveSpell()` description field | medium | mitigate | Sanitized analogously to the adjacent notes field; the spell save path is now consistent with the wiki save path. | closed |
| T-10-17 | Tampering | Regex-based markup cleaning — **scope narrowed 2026-07-25 (Plan 10-06)** to the DISPLAY-only cosmetic chain that remains in the table branch of `handleEditorPaste()` (noise-tag/attribute normalization, default-style injection); does NOT cover tag-allowlisting or protocol-filtering, which the DOM-based sanitizer (T-10-15/T-10-23) now owns exclusively as the last stage before insertion | low | accept | Narrowed 2026-07-25 (Plan 10-06): the remaining regex-based cosmetic chain runs BEFORE `window.sanitizeHTML()`, so at most it can corrupt DISPLAY (lost styling, unexpected cell structure on grades like nested quotes or entity-encoded attribute values in exotic paste sources) — it cannot re-introduce a disallowed element or a dangerous protocol, because the allowlist sanitizer is the last transformation and does not share this weakness (DOMParser-based; decodes entity-encoded attribute values before its own protocol check). This entry previously read as accepting "regex-based markup cleaning in general," which could be misread as covering the tag/protocol gap — it never did (confirmed by `10-VERIFICATION.md`'s gap analysis), and that gap is now closed by T-10-23/T-10-24 below, not accepted by this entry. Acceptance rationale updated in AR-10-02 below; the sibling, more narrowly-scoped residual risk of the cosmetic chain is separately tracked as T-10-29/AR-10-05. | accept |
| T-10-18 | Repudiation | Ledger entry status transition | medium | mitigate | Status changes exclusively through the `gsd-tools windows` CLI so the table and JSON block stay synchronized; header counter is automatically checked. Verified: `.planning/WINDOWS.md` `open_count: 0`, entry 1 `status: fixed`. | closed |
| T-10-19 | Repudiation | `threats_open: 0` counter in this consolidated audit | high | mitigate | The counter is derived from threat-table rows across all four per-phase `SECURITY.md` files plus this file; every surface names its concretely audited files and code paths (see each file's "Scope" section); an entry without a disposition would block phase completion (D-12) — none exists. | closed |
| T-10-20 | Information Disclosure | Publicly visible description of attack paths in `SECURITY.md` | low | accept | The described paths are fixed as of publication; the app runs server-less, single-user — no remotely exploitable advantage arises from documenting the historical exploit chain. | accept |
| T-10-21 | Tampering | Retroactive threat elicitation for Phases 1 and 2 (no plan-time register) | medium | mitigate | For these phases the register was built from the implementation files FIRST, then mitigations verified against current source (see `01-SECURITY.md`, `02-SECURITY.md`) — no rubber-stamp of an unaudited surface. | closed |
| T-10-22 | Denial of Service | A new critical/high finding surfacing at phase end | medium | mitigate | D-12 mandates fix-in-phase or an additional plan reported to the caller instead of deferral. This audit (Plan 10-05) found no new critical/high findings beyond the already-fixed T-10-01..T-10-18 set — see Sign-Off. **Superseded in practice by T-10-15's correction (Plan 10-06):** a critical finding (CR-01) DID surface after this row was closed, via code review + verification rather than this audit itself; D-12's mandate held — it was fixed in-phase (this gap-closure plan), not deferred. | closed |
| T-10-23 | Elevation of Privilege | `handleEditorPaste()` table branch — disallowed elements (embedded frame with inline-document attribute, object, embed, vector-graphics element, form) | critical | mitigate | `window.sanitizeHTML()` as the last transformation before `insertHtmlAtSelection()`; the allowlist reduces disallowed elements to their text content. Proof: new multi-vector case in `tests/e2e/features/editor-insert.spec.js` (red before fix, commit `ce6751f`; green after, commit `46832f3`). | closed |
| T-10-24 | Tampering | Dangerous protocols in link targets/sources inside pasted tables | high | mitigate | Protocol AND well-formedness check on link targets in the sanitizer (http/https/relative/anchor only); entity-encoded variants are decoded by the DOM parser before the check runs. Proof: cells 3 and 4 of the new test payload (plain and entity-encoded `javascript:`). | closed |
| T-10-25 | Tampering | Event attribute with no separating whitespace — the documented bypass of the Plan-10-04 patterns | high | mitigate | The whitespace-dependent patterns are removed; the block is now DOM-based on the attribute-name prefix in the sanitizer and is therefore whitespace-agnostic. Proof: cell 5 of the new test payload (`onerror` directly abutting the previous attribute value). | closed |
| T-10-26 | Denial of Service | Sanitizer unreachable at runtime (load order, partial bundle) → unsanitized markup would be inserted | medium | mitigate | Fail-closed: `typeof` guard before the call; on failure, falls back to `insertTextAtSelection(text)` — no path inserts unsanitized markup. Proof: new "Randfall" test in `tests/e2e/features/editor-insert.spec.js` stubbing `window.sanitizeHTML` to `undefined` and to an empty-returning function. | closed |
| T-10-27 | Tampering | Markup regression in the frozen editor net from the new sanitization stage | medium | mitigate | Binding ordering (sanitizer runs AFTER style injection); all injected style properties are in `allowedAttributes.style`; net green before and after (81 → 83 passed, 0 failed), the byte-exact frozen table-paste expectation (`TABELLEN_ERWARTET`) unchanged. | closed |
| T-10-28 | Repudiation | Security documents claiming a state the code does not have (the root cause of this gap-closure round) | high | mitigate | Task 3 (this document + `SECURITY.md`) corrects T-10-15, narrows T-10-17/AR-10-02, adds T-10-23..T-10-29, and rewrites `SECURITY.md` section 4 / Befund 4 / accepted risk 3 — every claim names the test file that proves it. | closed |
| T-10-29 | Tampering | Remaining pre-sanitizer cosmetic chain stays regex-based (edge cases: nested quotes, exotic paste sources) | low | accept | Residual risk is DISPLAY-only (lost styling, unexpected cell structure). The chain only removes/normalizes noise; it cannot introduce a disallowed element or a dangerous protocol, because the allowlist sanitizer runs after it as the last stage. Documented as AR-10-05. | accept |
| T-10-SC | Tampering | npm/pip/cargo installs | low | accept | This phase installs no packages across all six plans (RESEARCH §Package Legitimacy Audit: not applicable) — no supply-chain surface. | accept |

*Status: closed · open · open — below block threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-10-01 | T-10-10 | D-04: import sanitization is silent by design — no reporting channel exists that could leak foreign-file content. | Phase 10 Plan 05 audit | 2026-07-25 |
| AR-10-02 | T-10-17 | **Narrowed 2026-07-25 (Plan 10-06 gap-closure).** Original wording ("minimal-invasive mandate excludes a DOMParser rewrite of the paste-time cleaner") is superseded: Plan 10-06 DID route the table branch through the DOM-based allowlist sanitizer, closing the tag-allowlist/protocol gap this entry's original wording could be misread as covering (it never actually accepted that gap — `10-VERIFICATION.md` confirmed no accept-disposition covered it). What remains genuinely accepted: the pre-sanitizer cosmetic chain (noise-tag/attribute normalization, style injection) stays regex-based and can at most corrupt display in edge cases (nested quotes, exotic paste sources) — it cannot reintroduce a disallowed element or protocol, because the allowlist sanitizer runs after it as the last stage and does not share this weakness. | Phase 10 Plan 06 gap-closure audit | 2026-07-25 |
| AR-10-03 | T-10-20 | Publishing a fixed exploit chain in `SECURITY.md` creates no remote advantage for a server-less, single-user offline app. | Phase 10 Plan 05 audit | 2026-07-25 |
| AR-10-04 | T-10-SC | No package installs occurred in any of the six plans in this phase. | Phase 10 Plan 05 audit | 2026-07-25 |
| AR-10-05 | T-10-29 | The cosmetic chain that remains before the allowlist sanitizer in `handleEditorPaste()`'s table branch stays regex-based; residual risk is bounded to display corruption (lost styling, unexpected cell structure), never to disallowed elements or dangerous protocols, because the sanitizer runs after it as the last stage before insertion. | Phase 10 Plan 06 gap-closure audit | 2026-07-25 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-25 | 22 (T-10-01..T-10-22) + T-10-SC | 18 | 0 (4 accepted, non-blocking) | Phase 10 Plan 05 (verify-mitigations, executor agent) |
| 2026-07-25 (gap-closure) | +7 (T-10-23..T-10-29), T-10-15 severity corrected `high`→`critical`, T-10-17/AR-10-02 scope narrowed | 6 new closed (T-10-23..T-10-28) | 0 (1 new accepted: T-10-29/AR-10-05, non-blocking) | Phase 10 Plan 06 (gap-closure, executor agent) — closes SC3 from `10-VERIFICATION.md` |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter
- [x] Gap-closure round (Plan 10-06): T-10-15 corrected, T-10-17/AR-10-02 narrowed, T-10-23..T-10-29/AR-10-05 added — every row above the block threshold (`critical`/`high`) is `mitigate` with a named test-file proof, per D-12

**Approval:** verified 2026-07-25; corrected 2026-07-25 (Plan 10-06 gap-closure)
