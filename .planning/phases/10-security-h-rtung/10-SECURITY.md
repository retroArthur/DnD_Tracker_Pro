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

---

## Scope — Files & Code Paths Audited

All files touched by Plans 10-01 through 10-04 (see their SUMMARY `key-files` sections,
already cross-checked against source in this audit — see Phase 1, 2, 9 audits above for
the shared files re-verified from their perspective):

- `ui/editors/markdown-converter.js` — `renderMarkdownInContent()`
- `features/wiki/wiki.js` — `renderWikiDetail()`, `saveWikiEntry()`, edit-reopen path
- `systems/spellslots/import-export.js` — `HTML_FIELDS_BY_TYPE`, `sanitizeImportedItem()`, `showImportModal()`, `executeImport()`, `importDataGlobal()`
- `utils/basic.js` / `utils/testable-utils.js` — `sanitizeHTML()` `allowedTags` (`<strike>` addition, D-06), parity enforcement
- `ui/editors/rich-text.js` — `handleEditorPaste()` table branch, `saveSpell()`
- `.planning/WINDOWS.md` — Broken-Windows-Ledger entry #1 (status transition to `fixed`)
- Test files: `tests/e2e/features/import-security.spec.js`, `tests/e2e/features/wiki.spec.js`, `tests/unit/import-sanitization.test.js`, `tests/unit/sanitizer-parity.test.js`, `tests/unit/security.test.js`, `tests/e2e/features/editor-formatting.spec.js`, `tests/e2e/features/editor-insert.spec.js`

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
| T-10-15 | Tampering / Elevation of Privilege | Table branch of `handleEditorPaste()` (Broken-Windows-Ledger #1) | high | mitigate | Event-attribute regex pair from `utils/basic.js` adopted at the head of the cleaning chain; new E2E test with table payload, red before fix (`59a7f61`) / green after (`cef33f2`). | closed |
| T-10-16 | Tampering | `saveSpell()` description field | medium | mitigate | Sanitized analogously to the adjacent notes field; the spell save path is now consistent with the wiki save path. | closed |
| T-10-17 | Tampering | Regex-based markup cleaning in general (nested quotes, entity-encoded attribute values) | medium | accept | Deliberately minimal-invasive mandate (D-05); rebuilding on a DOMParser approach would be outside this phase's scope. Documented here as the phase's own accepted residual risk (see consolidated `SECURITY.md` "Bewusst akzeptierte Risiken"). Bounded in practice: `sanitizeHTML()` remains the authoritative save-time boundary and does not share this weakness (DOMParser-based, not regex-based) — the residual risk applies only to the transient pre-save editable-DOM state. | accept |
| T-10-18 | Repudiation | Ledger entry status transition | medium | mitigate | Status changes exclusively through the `gsd-tools windows` CLI so the table and JSON block stay synchronized; header counter is automatically checked. Verified: `.planning/WINDOWS.md` `open_count: 0`, entry 1 `status: fixed`. | closed |
| T-10-19 | Repudiation | `threats_open: 0` counter in this consolidated audit | high | mitigate | The counter is derived from threat-table rows across all four per-phase `SECURITY.md` files plus this file; every surface names its concretely audited files and code paths (see each file's "Scope" section); an entry without a disposition would block phase completion (D-12) — none exists. | closed |
| T-10-20 | Information Disclosure | Publicly visible description of attack paths in `SECURITY.md` | low | accept | The described paths are fixed as of publication; the app runs server-less, single-user — no remotely exploitable advantage arises from documenting the historical exploit chain. | accept |
| T-10-21 | Tampering | Retroactive threat elicitation for Phases 1 and 2 (no plan-time register) | medium | mitigate | For these phases the register was built from the implementation files FIRST, then mitigations verified against current source (see `01-SECURITY.md`, `02-SECURITY.md`) — no rubber-stamp of an unaudited surface. | closed |
| T-10-22 | Denial of Service | A new critical/high finding surfacing at phase end | medium | mitigate | D-12 mandates fix-in-phase or an additional plan reported to the caller instead of deferral. This audit (Plan 10-05) found no new critical/high findings beyond the already-fixed T-10-01..T-10-18 set — see Sign-Off. | closed |
| T-10-SC | Tampering | npm/pip/cargo installs | low | accept | This phase installs no packages across all five plans (RESEARCH §Package Legitimacy Audit: not applicable) — no supply-chain surface. | accept |

*Status: closed · open · open — below block threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-10-01 | T-10-10 | D-04: import sanitization is silent by design — no reporting channel exists that could leak foreign-file content. | Phase 10 Plan 05 audit | 2026-07-25 |
| AR-10-02 | T-10-17 | Minimal-invasive mandate (D-05) explicitly excludes a DOMParser rewrite of the paste-time cleaner; the save-time `sanitizeHTML()` boundary (DOMParser-based) remains the authoritative defense and does not share this weakness. | Phase 10 Plan 05 audit | 2026-07-25 |
| AR-10-03 | T-10-20 | Publishing a fixed exploit chain in `SECURITY.md` creates no remote advantage for a server-less, single-user offline app. | Phase 10 Plan 05 audit | 2026-07-25 |
| AR-10-04 | T-10-SC | No package installs occurred in any of the five plans in this phase. | Phase 10 Plan 05 audit | 2026-07-25 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-25 | 22 (T-10-01..T-10-22) + T-10-SC | 18 | 0 (4 accepted, non-blocking) | Phase 10 Plan 05 (verify-mitigations, executor agent) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-25
