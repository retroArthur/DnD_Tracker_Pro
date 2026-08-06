---
phase: 9
slug: editor-regressionsnetz-execcommand-abloesung
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-25
register_authored_at_plan_time: true
audit_mode: verify-mitigations
---

# Phase 9 — Security (Rich-Text / innerHTML — Editor Implementation)

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Phase 9 (`09-editor-regressionsnetz-execcommand-abloesung`) DID author formal
> `<threat_model>` blocks at planning time (nine plans, ~24 threat entries total —
> see `09-01-PLAN.md` through `09-09-PLAN.md`). This audit verifies mitigations
> against the codebase state AFTER all Phase 10 fixes (2026-07-25), per D-11, and
> consolidates the security-relevant subset of that register (process/documentation
> threats — CI runtime growth, test-context-only escalation, doc-artifact disclosure,
> supply-chain `T-09-SC`, repeated across nearly every plan with `accept` — are
> omitted here as non-production-attack-surface; the full per-plan registers remain
> in `09-01-PLAN.md` … `09-09-PLAN.md` for complete traceability).

---

## Scope — Files & Code Paths Audited

- `ui/editors/rich-text.js` — `handleEditorPaste()` (line 952): plain-text/table paste branches; table branch's regex cleaning chain (lines ~960–989, including the two event-attribute-stripping replacements added in Phase 10 Plan 04); `insertHtmlAtSelection()` (line 850, `range.createContextualFragment()` primitive — audited for all current call sites); `insertTextAtSelection()`/`insertLineBreakAtSelection()` (text-only insertion, no HTML parsing); `wrapRangeWithElement()`/`closestEditorAncestor()` (lines 329, 351 — Selection/Range formatting helpers replacing `execCommand`); `clearInlineFormattingAtSelection()` (line 420); `applyFontFamilyToSelection()`/`applyFontSizeToSelection()`; the link-insertion flow (line 1240, `prompt()` → `link.href =` on the live editable DOM); `saveSpell()` (line 1632, `sanitizeHTML(descHtml)` at line 1684, aligned with the adjacent `note` field at line 1685)
- `utils/basic.js` — `sanitizeHTML()` (line 40): the authoritative save-time sanitization boundary. `allowedTags` (line 46) deliberately excludes `img`, `script`, `iframe`, `object`, `embed`, `form`, `input`, `style`, `link`, `meta`, `base`, `svg`, `math` — any disallowed tag is replaced by its text content, never left as a live element. `href` (line 167) is allowlisted by protocol AND shape (`http://`, `https://`, `/`, `#`, `./` only) independent of the global pre-parse regex strip. Event-handler attributes (`on*`) are blocked unconditionally (line 149, `attrName.startsWith('on')`). `src` is never in `allowedAttributes` — comment at line 205 ("Andere Attribute blockieren (src, etc.)") confirms this is deliberate, not an oversight.
- `tests/e2e/features/editor-insert.spec.js` — T-09-01 security regression test (paste-time attribute stripping) and its Phase 10 Plan 04 extension (table-branch payload); part of the frozen 90-test editor regression net
- `.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md` — the double-green net-freeze protocol (D-04a) that gates every migration commit

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| OS clipboard → editable DOM (paste) | Arbitrary HTML from any source (other apps, websites, other campaigns) enters the live, editable DOM before save | Raw clipboard HTML/plain text |
| Editable DOM → persisted `D` (save) | The live editable DOM's `innerHTML` is read and sanitized before it becomes trusted application state | Sanitized HTML fragment |
| User `prompt()` input → DOM attribute | A raw string typed into a native `prompt()` dialog is assigned directly to `link.href` in the live DOM | Raw string, not yet sanitized at insertion time |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-09-01 | Tampering | `handleEditorPaste()` table branch (`rich-text.js`) | high | mitigate | Originally scoped in `09-01-PLAN.md`/`09-04-PLAN.md` as "no production code changed in Phase 9; migration must keep the pre-existing attribute-list cleaning and `sanitizeHTML()` whitelist unchanged." Migration (Plans 09-06..09-09) preserved this correctly — verified: `range.createContextualFragment()` (used by `insertHtmlAtSelection()`, replacing `execCommand('insertHTML')`) does not execute `<script>` content per spec, matching `09-08-PLAN.md`'s T-09-01 disposition. Testing during Phase 9 surfaced a PRE-EXISTING gap (not introduced by the migration): the table branch's attribute-list cleaner stripped `class`/`style`/`width`/… but not `on*` event attributes — logged as Broken-Windows-Ledger entry #1 rather than fixed in-scope (Plan 09-04's own verification criterion forbade production changes). Closed in Phase 10 Plan 04: two event-attribute-stripping regex replacements added at the head of the table branch's cleaning chain (`rich-text.js` lines ~965–966), identical to `sanitizeHTML()`'s own pair. Proven red-then-green by `tests/e2e/features/editor-insert.spec.js` (commit `59a7f61` red, `cef33f2` green). | closed |
| T-09-02 | Tampering | New formatting helpers (`wrapRangeWithElement`, `applyInlineFormat`, `applyFontFamilyToSelection`/`applyFontSizeToSelection`) | medium | mitigate | Repeated across Plans 09-06/09-07 with the same disposition: these helpers only ever set element types and style properties already on `utils/basic.js`'s whitelist (`font-family`, `font-size`, `background-color`, etc.) — no new tag, no new style property, values come from fixed template selects/constant maps, not free user text. The 90-test regression net's save/reload roundtrip assertions verify the persisted markup survives `sanitizeHTML()` unchanged after every migration group. Verified current: `applyFontFamilyToSelection`/`applyFontSizeToSelection` exist in `rich-text.js` and operate exclusively on Selection/Range objects, never on raw HTML strings. | closed |
| T-09-03 | Tampering | Link insertion (`prompt()` → `link.href =`) | medium | mitigate | `09-02-PLAN.md`'s T-09-05: the raw `prompt()` value is assigned to `link.href` in the LIVE editable DOM with no immediate sanitization (`rich-text.js:1240–1244`) — a user could transiently set `href="javascript:alert(1)"` in the editor. This is bounded by the save-time boundary: `sanitizeHTML()`'s `href` handling (`utils/basic.js:167–182`) allowlists only `http://`/`https://`/`/`/`#`/`./`-prefixed values AND independently denies the `dangerousProtocols` list — any other scheme causes the `href` attribute to be dropped entirely (default-deny, not a denylist-only check). Verified current against source; no persisted/saved anchor can carry an executable-protocol `href`. | closed |
| T-09-04 | Tampering | `<strike>` whitelist gap (data-integrity, not code-execution) | low | mitigate | `09-BASELINE.md` A4-decision froze this as a known data-integrity bug (`<strike>` markup lost on save/reload) with an explicit Phase-10 follow-up note. Closed in Phase 10 Plan 03: `<strike>` added to `allowedTags` in both `utils/basic.js` AND its test twin `utils/testable-utils.js` (D-06), guarded going forward by the new sanitizer-parity test (`tests/unit/sanitizer-parity.test.js`, 61 tests) that structurally enforces both copies stay in sync. | closed |
| T-09-05 | Denial of Service | `<img>`/disallowed-tag pass-through in the live editable DOM before save | info | accept | The paste-time table-branch cleaner intentionally does NOT strip an inert `<img>` element itself (only its `on*` attributes) — the resulting element causes at most a benign resource-404 console entry (`src="x"`, no network exfiltration target reachable offline). This transient editable-DOM state is bounded: `sanitizeHTML()` on save excludes `img` from `allowedTags` entirely (verified `utils/basic.js:46-68` — `img` is absent from the list), so no `<img>` element (with or without an event attribute) survives into persisted application state. Confirmed by `tests/e2e/features/editor-insert.spec.js`'s save/reload/reopen repetition of all assertions. | accept |

*Status: closed · open · open — below block threshold (non-blocking)*
*Severity: critical > high > medium > low > info — only open threats at or above `workflow.security_block_on` count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-09-01 | T-09-05 | Inert `<img>` elements without event attributes cause at most a benign resource-404; `sanitizeHTML()` strips `img` from persisted state entirely (not in `allowedTags`), so the transient editable-DOM state cannot reach persistence or be re-rendered anywhere. | Phase 10 Plan 05 audit | 2026-07-25 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-25 | 5 (consolidated from ~24 per-plan entries; process/CI/supply-chain entries omitted as non-production-attack-surface) | 4 | 0 (1 accepted, non-blocking) | Phase 10 Plan 05 (verify-mitigations, executor agent) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-25
