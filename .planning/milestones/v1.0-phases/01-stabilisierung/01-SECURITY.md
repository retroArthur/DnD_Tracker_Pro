---
phase: 1
slug: stabilisierung
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-25
register_authored_at_plan_time: false
audit_mode: retroactive-STRIDE
---

# Phase 1 — Security (Import/Export, Storage & IndexedDB)

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Phase 1 (`01-stabilisierung`) did not author a formal `<threat_model>` block at planning
> time (2026-06-11/12, before threat modelling was standard practice in this project).
> This is a **retroactive** STRIDE register, built directly from the implementation files
> that make up the two attack surfaces this phase owns: **Import/Export** and
> **Storage & IndexedDB**. All threats are verified against the codebase state AFTER
> all Phase 10 fixes (2026-07-25), per D-11.

---

## Scope — Files & Code Paths Audited

**Import/Export:**
- `systems/spellslots/import-export.js` — both import entry points:
  - `showImportModal()` (line 285) / `executeImport()` (line 374) — type-specific import
  - `importDataGlobal()` (line 499) — global campaign import, both branches (new-campaign via `StorageAPI.setJSON`, overwrite via `Object.assign(D, imp)`)
  - `HTML_FIELDS_BY_TYPE` (line 148) — the audited field allowlist (9 entity types)
  - `sanitizeImportedItem()` (line 164) — the sanitization helper wired into both entry points (line 335 in `showImportModal()`, lines 569–571 loop in `importDataGlobal()`, ahead of the branch)
  - Undo/backup instrumentation in the overwrite branch: `saveUndoState()` (line 618), `createAutoBackup()` (line 620)
  - Export functions (from `## EXPORT FUNCTIONS` onward) — read-only serialization of `D`, no user-controlled HTML re-entry point
- `ui/editors/markdown-converter.js` — `renderMarkdownInContent()` (line 258), the "render-on-display" path consumed by imported/legacy content; sanitizes at the end (line 300–302) identically to its sibling `markdownToHtml()`
- `features/wiki/wiki.js` — `renderWikiDetail()` (line 401): call order is `renderMarkdownInContent(entry.content)` (line 429, sanitizes) BEFORE `addTOCAnchors()` (line 431); save path `sanitizeHTML(contentEl.innerHTML)` (line 710); reopen/edit path `sanitizeHTML(entry.content)` (line 753)

**Storage & IndexedDB:**
- `systems/spellslots/persistence.js` — `saveImmediate()` (line 34), `save()`/load path; `LS_LIMIT_MB = 5` threshold (lines 49, 214); stale-localStorage-shadow removal after a confirmed IndexedDB write (lines 63–66, 216–217) — the `_ts` companion key is also removed (D-01/STAB-05)
- `systems/spellslots/quick-roll.js` — `resolveStorageConflict()` (line 23): identical-data fast path, delegation to the differently-named optional hook `window.showStorageConflictDialogUI` (line 30–31), deterministic `onUseIDB()` fallback (line 34) — no self-recursion
- `systems/campaign-manager/campaign-manager.js` — `getCampaignIndex()`/`saveCampaignIndex()` (lines 10–18), `createCampaign()` (line 20): each campaign gets a distinct storage key `'dnd-campaign-' + Date.now()` (line 27) — no shared/collidable key across campaigns by default

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Imported campaign file → `D` (in-memory state) | User-supplied JSON file (own or shared) crosses into trusted application state | Arbitrary JSON, including HTML-bearing string fields (`content`, `description`, `notes`, `traits`, `actions`, `skills`) |
| `D` → rendered DOM (`innerHTML`) | Wiki/entity content is rendered via multiple paths (display, edit-reopen) | Sanitized HTML fragments |
| localStorage ↔ IndexedDB | Two persistence backends for the same logical campaign state; conflict/staleness must be resolved deterministically | Serialized campaign JSON, timestamps |
| One campaign's storage key ↔ another's | Multiple campaigns share one browser storage origin | Namespaced storage keys |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-01 | Tampering | `renderMarkdownInContent()` (display path) → `wiki.js` `innerHTML` | critical | mitigate | Originally CR-01 in `01-REVIEW.md`: `renderMarkdownInContent()` returned raw, unsanitized HTML; the Wiki display path had no `sanitizeHTML()` stage. Fixed in Phase 10 Plan 01: `renderMarkdownInContent()` sanitizes at the end (identical to `markdownToHtml()`), and `renderWikiDetail()`'s call order was flipped so sanitization runs before TOC anchor injection. Proven by `tests/e2e/features/import-security.spec.js` (malicious import file → open Wiki entry → no script execution). | closed |
| T-01-02 | Tampering | `executeImport()` / `importDataGlobal()` — raw imported data at rest | critical | mitigate | Neither import entry point sanitized HTML-bearing fields before persistence (`01-REVIEW.md` CR-01 fix recommendation). Fixed in Phase 10 Plan 02: `HTML_FIELDS_BY_TYPE` + `sanitizeImportedItem()` wired into both `showImportModal()`'s `validatedItems` mapping and `importDataGlobal()`'s pre-branch sanitization loop (covers both the new-campaign and overwrite branches). Proven by `tests/unit/import-sanitization.test.js` (24 tests, `vm.runInContext` against real source) and `tests/e2e/features/import-security.spec.js` (saved-state assertions for both `importDataGlobal()` branches). | closed |
| T-01-03 | Repudiation / Tampering | `importDataGlobal()` overwrite branch — no undo point, no backup (WR-03) | high | mitigate | `01-REVIEW.md` WR-03: `Object.assign(D, imp)` executed with no `saveUndoState()`/`createAutoBackup()` — the most destructive possible edit was not reversible via Ctrl+Z. Fixed in Phase 10 Plan 02: `saveUndoState('Kampagne überschrieben (Import)')` (line 618) + try/caught `createAutoBackup()` (line 620) added before `Object.assign`, matching `executeImport()`'s existing pattern (lines 386, 390). | closed |
| T-01-04 | Information Disclosure / Tampering | `resolveStorageConflict()` — self-recursion risk | medium | mitigate | Original CR-01 finding (first review pass, since resolved before this phase's second review): a same-named recursive dialog hook could cause a `RangeError`. Current code (`quick-roll.js:23–34`) delegates to a differently-named hook `window.showStorageConflictDialogUI` and falls back deterministically to `onUseIDB()` — no self-reference exists. Verified against current source (2026-07-25); `tests/unit/storage-conflict.test.js` loads the real source via `vm.runInContext` and exercises all four paths. | closed |
| T-01-05 | Tampering | Stale-localStorage-shadow after IDB-only save (>5MB campaigns) | medium | mitigate | Documented in `CONCERNS.md` ("Known Bugs") as a data-loss path: if the >5MB IDB-only save path never clears the old localStorage entry, `load()` reads the stale localStorage snapshot first and shadows newer IndexedDB saves forever. Verified against current source: `persistence.js` lines 63–66 (save) and 216–217 (load) both remove the localStorage key (and its `_ts` companion) once the IndexedDB write is confirmed — the shadowing window is closed. | closed |
| T-01-06 | Information Disclosure | Cross-campaign storage-key collision | low | accept | Each campaign's key is derived from `'dnd-campaign-' + Date.now()` (`campaign-manager.js:27`) — a collision requires two campaigns created in the same millisecond, which the UI's synchronous create flow cannot produce. Single-user offline app; no cross-tenant risk model applies. | accept |
| T-01-07 | Tampering | Import sanitization field-allowlist scope (`HTML_FIELDS_BY_TYPE`) | low | accept | D-02 deliberately sanitizes only the nine known HTML-bearing fields per entity type rather than recursively sanitizing every string field (to avoid mangling legitimate non-HTML text such as dice formulas containing `<`/`>`). A future entity type or field added without extending `HTML_FIELDS_BY_TYPE` would ship unsanitized — this is a documented convention (10-02-SUMMARY `patterns-established`), not a code-enforced invariant. Accepted: the allowlist is small, reviewed, and any addition to import schema is itself a code change subject to review. | accept |

*Status: closed · open · open — below block threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01-01 | T-01-06 | Millisecond-timestamp campaign keys cannot collide under the app's synchronous, single-user create flow; no cross-tenant threat model applies to a local offline app. | Phase 10 Plan 05 audit | 2026-07-25 |
| AR-01-02 | T-01-07 | Field allowlist is a reviewed, documented convention (D-02); recursive sanitization was explicitly rejected to avoid corrupting legitimate non-HTML content. New import fields are code changes subject to review. | Phase 10 Plan 05 audit | 2026-07-25 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-25 | 7 | 5 | 0 (2 accepted, non-blocking) | Phase 10 Plan 05 (retroactive-STRIDE, executor agent) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-25
