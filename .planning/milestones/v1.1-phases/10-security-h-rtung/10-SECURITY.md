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
>
> **Gap-closure round 2 (Plan 10-07, same date):** two independent reviewers
> verifying Plan 10-06's fix confirmed, and one captured, a SECOND finding on the
> same attack surface — a CSS-based outbound beacon. The style-attribute filter in
> `sanitizeHTML()` checked only the declaration's PROPERTY name, never its VALUE;
> a `background:url(...)` declaration (property already allowlisted) survived
> unchanged into persisted data and re-fired an outbound request on every render.
> Plan 10-07 closes this at the only real security boundary (a per-declaration
> value check against an allowlist of permitted CSS function names, identical in
> both sanitizer twins) and adds T-10-30..T-10-40/AR-10-06..AR-10-12 below. It also
> corrects the four findings from `10-REVIEW-GAP.md`: five stale line-number
> citations in `SECURITY.md` section 4, a date without a matching commit, three
> unnecessary fixed waits in the Plan-10-06 E2E tests, and an incomplete
> protocol-list comment in `ui/editors/rich-text.js`.

---

## Scope — Files & Code Paths Audited

All files touched by Plans 10-01 through 10-06 (see their SUMMARY `key-files` sections,
already cross-checked against source in this audit — see Phase 1, 2, 9 audits above for
the shared files re-verified from their perspective):

- `ui/editors/markdown-converter.js` — `renderMarkdownInContent()`
- `features/wiki/wiki.js` — `renderWikiDetail()`, `saveWikiEntry()`, edit-reopen path
- `systems/spellslots/import-export.js` — `HTML_FIELDS_BY_TYPE`, `sanitizeImportedItem()`, `showImportModal()`, `executeImport()`, `importDataGlobal()`
- `utils/basic.js` / `utils/testable-utils.js` — `sanitizeHTML()` `allowedTags` (`<strike>` addition, D-06); style-attribute filter (UNCHANGED by Plan 10-06 — explicitly out of scope for that gap-closure fix; Plan 10-07 explicitly LIFTS this prohibition and adds a per-declaration value check, `allowedStyleFunctions`/`isSafeStyleValue()`, identically in both twins, parity-enforced)
- `ui/editors/rich-text.js` — `handleEditorPaste()` table branch, `saveSpell()`; Plan 10-06 routes the table branch through `window.sanitizeHTML()` as the last stage before `insertHtmlAtSelection()` and removes the bypassable Plan-10-04 event-attribute regex pair; Plan 10-07 corrects the protocol-list comment (IN-01)
- `.planning/WINDOWS.md` — Broken-Windows-Ledger entry #1 (status transition to `fixed`)
- Test files: `tests/e2e/features/import-security.spec.js`, `tests/e2e/features/wiki.spec.js`, `tests/unit/import-sanitization.test.js`, `tests/unit/sanitizer-parity.test.js`, `tests/unit/security.test.js`, `tests/e2e/features/editor-formatting.spec.js`, `tests/e2e/features/editor-insert.spec.js` (Plan 10-06: new multi-vector regression case + fail-closed edge-case test; Plan 10-07: CSS-beacon regression case, allowlist guard test, three fixed waits removed)

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
| T-10-30 | Information Disclosure | Style-attribute filter in `sanitizeHTML()` (`utils/basic.js` and `utils/testable-utils.js`) — declaration VALUE was never checked, background properties were already on the allowlist | high | mitigate | Per-declaration value check against an allowlist of permitted CSS function names (`allowedStyleFunctions` / `isSafeStyleValue()`), identical in both twins, bound together by the parity test. Proof: new vector block in `tests/unit/security.test.js` (`vm` against real source) and new E2E case with network observer in `tests/e2e/features/editor-insert.spec.js` — red before the fix (captured outbound request as positive control, commit `65dab7a`), green after (commit `ab5cabc`). | closed |
| T-10-31 | Tampering | Drift between the two sanitizer twins from a one-sided change | high | mitigate | The new attack and preservation vectors landed in the shared `VECTOR_SET` of `tests/unit/sanitizer-parity.test.js`; a one-sided change makes parity red. | closed |
| T-10-32 | Denial of Service | Over-aggressive value check could discard legitimate markup (custom-property references injected by the paste path, color functions from third-party sources) | medium | mitigate | Allowlist instead of denylist, with the needed function names explicitly included; preservation counter-proofs in the unit test; the frozen byte-exact `TABELLEN_ERWARTET` expectation is the sharpest proof and is unchanged; legitimate-usage question (Step 0b) answered by an executed repo-wide search instead of assumed. | closed |
| T-10-33 | Spoofing | Class allowlist accepts arbitrary class names; the stylesheet bundle contains 34 rules with fixed positioning (`grep -rn "position:\s*fixed" assets/styles/*.css assets/styles.css \| wc -l`), letting pasted content adopt an overlaying presentation against the app's own controls (UI-redress spoofing) | medium | accept | Single-user application with no server; the only person generating rich text is the DM for their own campaign (D-08). No script execution possible, presentation-takeover only. Documented as a register row plus a refinement of the existing accepted-risk point in `SECURITY.md`. | accept |
| T-10-34 | Spoofing | Link-target well-formedness check permits the protocol-relative form; such targets get `target="_blank"` + `rel="noopener noreferrer"` | low | accept | Navigation only follows a visible user click, no automatic request, no execution; back-reference lock is set. Single-user model, DM-owned content. | accept |
| T-10-35 | Denial of Service | Unbounded recursion depth of the cleanup function — extreme nesting causes a stack overflow in the paste handler | low | accept | Behavior is fail-closed: nothing is inserted, existing state stays unchanged; the visible consequence is a no-op paste. A depth limit would carry its own regression risk in the frozen net without a security gain. | accept |
| T-10-36 | Tampering | The entire guarantee rests on ONE control with no independent second layer — the save boundary calls the same sanitizer | medium | accept | Defense-in-depth would be an architectural rebuild outside this round. Drift visibility is established by the behavior-based allowlist guard test added in Task 2: a later loosening of the list turns the test red instead of silently opening the guarantee. The guard is a fence, not a second layer — hence the row stays `accept`. | accept |
| T-10-37 | Tampering | Evidence comes exclusively from the browser engine used in the test configuration; serialization/parsing differences in other engines are unverified | low | accept | Project test matrix and usage model (single user, predominantly one engine); the sanitizer operates on standardized DOM interfaces, the control is not engine-specific. | accept |
| T-10-38 | Tampering | Pre-existing double paste listener (Finding 3, `09-BASELINE.md`): double insertion and double cleanup | low | accept | Double cleanup is idempotent; the frozen expectation value reflects the behavior. Independent TODO tracked outside this phase. | accept |
| T-10-39 | Tampering | Quote-asymmetry of the cosmetic attribute-removal chain in `handleEditorPaste()` — only double-quoted values are matched | low | accept | The chain runs BEFORE the security boundary and is not a security control; single-quoted and unquoted style attributes reach the sanitizer intact and are fully checked there, now including values (Plan 10-07). Remaining consequence is display inconsistency only. | accept |
| T-10-40 | Repudiation | Security documents claimed `threats_open: 0` while known residual risks stood without disposition; additionally stale line-number citations and a date without a matching commit | high | mitigate | Task 3 (this document + `SECURITY.md`) adds T-10-30..T-10-39 with Accepted-Risks-Log entries, recomputes every cited line number against the source after this round, and binds every date to a `git log` date; every claim names the proving test file or commit (D-12). | closed |
| T-10-SC | Tampering | npm/pip/cargo installs | low | accept | This phase installs no packages across all seven plans (RESEARCH §Package Legitimacy Audit: not applicable) — no supply-chain surface. | accept |

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
| AR-10-04 | T-10-SC | No package installs occurred in any of the seven plans in this phase. | Phase 10 Plan 05 audit (updated Plan 07: plan count corrected 6→7) | 2026-07-25 |
| AR-10-05 | T-10-29 | The cosmetic chain that remains before the allowlist sanitizer in `handleEditorPaste()`'s table branch stays regex-based; residual risk is bounded to display corruption (lost styling, unexpected cell structure), never to disallowed elements or dangerous protocols, because the sanitizer runs after it as the last stage before insertion. | Phase 10 Plan 06 gap-closure audit | 2026-07-25 |
| AR-10-06 | T-10-33 | Class allowlist accepts arbitrary class names; the stylesheet bundle contains 34 rules with fixed positioning (counted via `grep -rn "position:\s*fixed" assets/styles/*.css assets/styles.css \| wc -l`), letting pasted content adopt an overlaying presentation against the app's own controls. Single-user application, no server (D-08) — the only person generating rich text is the DM for their own campaign; no script execution possible, presentation-takeover only. | Phase 10 Plan 07 gap-closure audit (round 2) | 2026-07-25 |
| AR-10-07 | T-10-34 | Link-target well-formedness check permits the protocol-relative form; such targets get `target="_blank"` + `rel="noopener noreferrer"`. Navigation only follows a visible user click, no automatic request, no execution. Single-user model, DM-owned content. | Phase 10 Plan 07 gap-closure audit (round 2) | 2026-07-25 |
| AR-10-08 | T-10-35 | Unbounded recursion depth of `cleanNode()` — extreme nesting causes a stack overflow in the paste handler. Behavior is fail-closed: nothing is inserted, existing state stays unchanged. A depth limit would carry its own regression risk in the frozen editor net without a security gain. | Phase 10 Plan 07 gap-closure audit (round 2) | 2026-07-25 |
| AR-10-09 | T-10-36 | The entire value-check guarantee rests on one control (`sanitizeHTML()`) with no independent second layer — the save boundary calls the same sanitizer. Defense-in-depth would be an architectural rebuild outside this round; the behavior-based allowlist guard test added in Task 2 makes a later loosening visible (red), but is a fence, not a second layer. | Phase 10 Plan 07 gap-closure audit (round 2) | 2026-07-25 |
| AR-10-10 | T-10-37 | All proof comes from the browser engine used in the test configuration (Chromium); serialization/parsing differences in other engines are unverified. Project test matrix and usage model (single user, predominantly one engine); the sanitizer operates on standardized DOM interfaces, not engine-specific. | Phase 10 Plan 07 gap-closure audit (round 2) | 2026-07-25 |
| AR-10-11 | T-10-38 | Pre-existing double paste listener (Finding 3, `09-BASELINE.md`) — double insertion and double cleanup. Double cleanup is idempotent, the frozen expectation value reflects the behavior. Independent TODO tracked outside this phase. | Phase 10 Plan 07 gap-closure audit (round 2) | 2026-07-25 |
| AR-10-12 | T-10-39 | Quote-asymmetry of the cosmetic attribute-removal chain in `handleEditorPaste()` — only double-quoted style-attribute values are matched. The chain runs BEFORE the security boundary and is not a security control; single-quoted and unquoted style attributes reach the sanitizer intact and are fully checked there, now including values (Plan 10-07). Remaining consequence is display inconsistency only. | Phase 10 Plan 07 gap-closure audit (round 2) | 2026-07-25 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-25 | 22 (T-10-01..T-10-22) + T-10-SC | 18 | 0 (4 accepted, non-blocking) | Phase 10 Plan 05 (verify-mitigations, executor agent) |
| 2026-07-25 (gap-closure) | +7 (T-10-23..T-10-29), T-10-15 severity corrected `high`→`critical`, T-10-17/AR-10-02 scope narrowed | 6 new closed (T-10-23..T-10-28) | 0 (1 new accepted: T-10-29/AR-10-05, non-blocking) | Phase 10 Plan 06 (gap-closure, executor agent) — closes SC3 from `10-VERIFICATION.md` |
| 2026-07-25 (gap-closure round 2) | +11 (T-10-30..T-10-40), AR-10-04 plan count corrected 6→7 | 4 new closed (T-10-30, T-10-31, T-10-32, T-10-40) | 0 (7 new accepted: T-10-33..T-10-39/AR-10-06..AR-10-12, non-blocking) | Phase 10 Plan 07 (gap-closure round 2, executor agent) — closes the CSS-beacon finding (independently confirmed by two reviewers during Plan 10-06 verification) plus WR-01/WR-02/WR-03/IN-01 from `10-REVIEW-GAP.md` |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter
- [x] Gap-closure round (Plan 10-06): T-10-15 corrected, T-10-17/AR-10-02 narrowed, T-10-23..T-10-29/AR-10-05 added — every row above the block threshold (`critical`/`high`) is `mitigate` with a named test-file proof, per D-12
- [x] Gap-closure round 2 (Plan 10-07): T-10-30..T-10-40/AR-10-06..AR-10-12 added — the CSS-based outbound-beacon finding is `mitigate` with commit + test-file proof; every one of the six residual risks flagged during Plan 10-06 verification (class/style allowlist breadth, protocol-relative link targets, unbounded recursion depth, single-control dependency, Chromium-only coverage, double-paste listener) plus the pre-existing quote-asymmetry finding carries an `accept` row with a written rationale — `threats_open: 0` is true again because no known point on this attack surface lacks a disposition (D-12)

**Approval:** verified 2026-07-25; corrected 2026-07-25 (Plan 10-06 gap-closure); corrected 2026-07-25 (Plan 10-07 gap-closure round 2)
