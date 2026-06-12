# Project Research Summary

**Project:** D&D Kampagnen-Tracker Pro — Stabilisierung & Ausbau
**Domain:** Offline-first D&D 5e campaign manager (brownfield — vanilla JS, single bundled HTML, German UI, Windows/Chromium primary)
**Researched:** 2026-06-11
**Confidence:** HIGH (stack, architecture, pitfalls); MEDIUM (monster data sizing, German SRD provenance)

---

## Executive Summary

This is a brownfield enhancement milestone for a mature, fully offline D&D 5e campaign manager. The existing stack is non-negotiable: vanilla JS, no ESM, no runtime dependencies, `build.py` concatenation of 92 modules into one standalone HTML file. The enhancement roadmap adds approximately 17 features across five categories — tech foundation (PWA, file backup, command palette), DM combat tools (bestiary, statblock popup, legendary action tracking, mob mode), DM story tools (session prep, NPC generator, timeline, travel simulator, factions), player-state tracking (XP, inspiration, extended character sheets), and UX analytics (dice statistics, soundboard). All of these must fit within the existing architecture without introducing any runtime npm dependency.

The app has one active production blocker that must be resolved before any new feature work begins: `tools/debug.js:99` references the removed Mindmap feature (`clearMindmap`), causing a `ReferenceError` at load time that prevents the app from booting at all. CI passes green because lint treats `no-undef` as a warning, typecheck has `checkJs: false`, and there is no browser smoke test in the pipeline. A second active data-loss bug exists in `persistence.js`: campaigns that grow past the 5MB localStorage limit switch to IndexedDB, but the stale localStorage snapshot is never cleared, causing load to fall back to the older snapshot on restart. Both of these must be fixed in a dedicated stabilization phase before any feature development.

The key architectural pattern for all new features is already established by `core/srd-spells.js` (lazy-cached embedded data), `systems/tab-registry.js` (declarative tab render registration), `ui/actions/` (data-action event delegation), and `systems/spellslots/version-migration.js` (backward-compatible schema extensions). Following these patterns consistently is the single most important success factor for this milestone. The riskiest decisions in the entire roadmap are (a) how to store SRD monster data without bloating the bundle or polluting the undo state, and (b) how to migrate user data from the `file://`-origin localStorage partition to the PWA's `https://localhost` partition — both require deliberate architecture choices before implementation.

---

## Key Findings

### Recommended Stack

The entire stack is fixed by existing architecture. No new runtime libraries, no npm dependencies, no framework. All capabilities are available in browser APIs already supported in Chromium 86+ and are implementable in vanilla JS.

**Core technologies:**

- Vanilla JS + HTML + CSS: sole runtime environment — no alternatives in scope
- `build.py` (Python): production bundler, three-pass deduplication, single HTML output
- IndexedDB: campaign backup storage and future reference-data cache (monster statblocks, File System handles)
- Web Audio API + HTMLAudioElement: soundboard hybrid — `createObjectURL` for file loading (works from `file://`), `GainNode` for volume control
- Canvas 2D API: dice statistics visualization (~100 lines, no chart library needed)
- Service Worker + Web App Manifest: PWA installation (localhost/HTTPS only — `beforeinstallprompt` is Chromium-only, matching target platform)
- File System Access API: native file backup (`showSaveFilePicker`/`showDirectoryPicker`, Chromium 86+, requires HTTPS/localhost, falls back to `<a download>` on `file://`)

Key capability constraints: `showSaveFilePicker`, `showDirectoryPicker`, and `beforeinstallprompt` require a real HTTP(S) origin and are blocked on `file://`. `AudioContext` must not be created at app init (autoplay policy suspends it immediately); create on first user gesture. `requestPermission()` for file handles must only be called inside a user gesture handler.

### Expected Features

**Must have (table stakes):**

- PWA install (manifest + SW) — foundational unlock for File System API and reliable offline caching
- File backup sync — data safety; export/import partially exists, auto-backup to disk is the upgrade
- Command palette — power-user DX, reuses existing `fuzzyMatch()` infrastructure
- Bestiary (SRD monster compendium) — DMs reference monster stats constantly; manually entering AC/HP for every encounter is a workflow blocker
- Statblock popup in initiative — mid-combat reference without leaving the combat tracker
- Legendary action + resistance counters — standard boss-fight mechanic; expected in any serious combat tracker
- Mob mode — grouping 10 identical goblins into one initiative row is a near-universal DM need
- XP / milestone tracker and Inspiration tracker

**Should have (differentiators):**

- Session prep assistant (scene cards, open threads) — Lazy DM methodology; competitors do not include this offline
- NPC generator — instant NPCs for off-script moments, uses existing random tables system
- Campaign timeline, Factions + reputation, Travel + weather simulator, Extended character sheets, Dice statistics histogram

**Defer to v2+:**

- Faction relationship matrix (visual), horizontal visual timeline scroll, per-character faction reputation, soundboard fade transitions

### Architecture Approach

All new features integrate into the established six-layer architecture: `core/` → `utils/` → `systems/` → `render/helpers.js` → `features/` → `ui/actions/`. Every new persistent collection follows the schema extension pattern: add to `initializeData()` in `core/data.js`, add a migration entry in `systems/spellslots/version-migration.js` for version `3.0.0`, use `nextId('collectionName')` for IDs. Only three features justify new navigation tabs (Bestiary, Timeline, Factions); all others extend existing panels or use modals.

**Major new components:**

1. `core/srd-monsters.js` — lazy-cached SRD monster data, parallel to `srd-spells.js`; NOT stored in `D`
2. `systems/file-backup.js` — File System Access API backup, hooks into `save()` with `_originalSave` guard pattern
3. `systems/command-palette.js` — COMMAND_REGISTRY + fuzzy overlay, keyboard-shortcuts.js delegates to `openCommandPalette()`
4. `features/bestiary/` — render + CRUD for bestiary tab
5. `features/mob-combat.js` — mob group initiative extension
6. `features/timeline/` and `features/factions/` — new tabs with CRUD
7. `features/travel-simulator.js`, `features/npc-generator.js` — modal-based tools
8. `features/dice/dice-stats.js` — histogram panel within existing Dice tab

Single migration function (`3.0.0`) in `version-migration.js` handles all persistent schema additions: `D.bestiary[]`, `D.timeline[]`, `D.factions[]`, character fields (`xp`, `milestones`, `inspiration`, `proficiencyBonus`, `skillProficiencies`, `saveProficiencies`, `attacks`). Combatant fields for legendary actions and mob mode are runtime-only (no migration needed).

### Critical Pitfalls

1. **Active production crash — Mindmap residue in `tools/debug.js:99`** — `clearMindmap` reference causes `ReferenceError` on load. Fix: grep all file types (`*.js`, `*.d.ts`, `*.css`, `*.html`, `*.json`, `*.md`, `*.py`) for removed symbols. The residue spans `debug.js`, `campaign-manager.js`, `types/globals.d.ts`, `assets/styles-purged.css`, `tests/setup.js`, and `CLAUDE.md`. Add browser smoke test to CI.

2. **Active data-loss bug — 5MB localStorage stale-shadow in `persistence.js`** — When campaign exceeds 5MB, saves switch to IDB but old localStorage snapshot is never cleared. On reload, `load()` reads the stale snapshot. Fix: write `'__IDB_ONLY__'` sentinel to localStorage when switching to IDB-only mode.

3. **PWA data migration trap** — `file://`-origin localStorage is a different storage partition than the installed PWA's origin. User installs, sees empty app, panics. Fix: one-time migration wizard on first PWA launch.

4. **File System Access API permissions expire on browser restart** — `requestPermission()` must only be called from a user gesture. Use `queryPermission()` at init, degrade gracefully with re-auth toast.

5. **Command palette keyboard shortcut collision** — `Ctrl+K` already means global search in this app and focuses the browser address bar in Chrome/Firefox. Use `Ctrl+Shift+K` or `Ctrl+P` instead (decide in Phase 2 planning after shortcut audit).

6. **Export version stamp bug** — Exports stamped `_version: '2.11'` instead of `APP_CONFIG.VERSION`. Because `compareVersions('2.11', '2.6.0')` treats 11 > 6, all migrations are skipped on re-import. New fields from any future migration will be absent in re-imported exports.

7. **`build.py` Pass 3 orphaned function bodies** — `remove_duplicate_functions()` comments out only the function declaration line, emitting the body as orphaned top-level statements. Results in `SyntaxError: Illegal return statement` at runtime. CI does not catch this. Fix: either make Pass 3 skip body lines, or add a pre-build check that fails when duplicate top-level function names exist in source.

---

## Cross-Research Conflict: SRD Monster Data Size and Storage Strategy

**The conflict:** Three research files produced incompatible estimates:

- **STACK.md** estimates ~150–200 KB minified/gzipped; recommends inline embedding in `core/srd-monsters.js`
- **ARCHITECTURE.md** estimates ~15–25 KB minified (using `srd-spells.js` precedent); also recommends embedding
- **PITFALLS.md** measured the raw `BTMorton/dnd-5e-srd` canonical JSON at **630,813 bytes**; recommends against inline embedding; recommends a ~50 KB name/CR/type index inline with full statblocks lazy-loaded from a companion JSON file into IndexedDB

**Why the discrepancy exists:** STACK.md and ARCHITECTURE.md reason from the minified+compressed size of pruned data (only the fields the app needs). ARCHITECTURE.md's estimate likely significantly underestimates because srd-spells.js lacks many statblock-equivalent fields. PITFALLS.md measured the full unminified raw JSON before any field pruning.

**Recommendation — deferred to Bestiary phase planning:** Conduct a 30-minute spike at the start of the Bestiary phase:

1. Download `5e-bits/5e-database` monster JSON
2. Prune to the ARCHITECTURE.md monster schema fields
3. Minify and measure actual byte count
4. Under ~200 KB pruned+minified: embed inline (lazy-cache pattern, self-contained, no fetch needed on `file://`)
5. Over ~200 KB: embed name/CR/type index only, lazy-load full statblocks from `srd-monsters.json` via `fetch()` into IndexedDB (requires PWA/localhost)

**Non-negotiable constraint regardless of approach:** SRD monster data must never be stored in `D`, never appear in undo snapshots, saves, or exports.

---

## Cross-Research Conflict: 5MB Stale-Shadow Bug Scope

FEATURES.md and ARCHITECTURE.md do not mention the `persistence.js` stale-shadow bug. PITFALLS.md identifies it as an active, currently-reproducing data-loss path. It belongs in Phase 1 (stabilization) regardless of feature lists. Its fix is a prerequisite for dice statistics (roll history appends accelerate hitting the 5MB threshold).

---

## Implications for Roadmap

Suggested phases: 7

### Phase 1: Stabilization — Fix Active Blockers

**Rationale:** The app does not boot. Two data-integrity bugs are active. CI has critical blind spots. No phase can be safely built on a broken foundation.
**Delivers:** Working app, no boot crash, no silent data loss, trustworthy CI, accurate documentation, hardened build pipeline.
**Key work:** Fix `debug.js` Mindmap crash; fix persistence stale-shadow bug; fix export version stamp; fix/replace `build.py` Pass 3; add `DEBUG_MODE: false` build assertion; add CI module-list diff check; add Playwright smoke test against `dist/`; audit and correct `CLAUDE.md`.
**Research flag:** No additional research needed — all work is surgical fixes with direct code evidence.

### Phase 2: Tech Foundation — PWA + File Backup + Command Palette

**Rationale:** PWA is a structural prerequisite for File System Access API. These are pure infrastructure changes in `systems/` and configuration with no new tabs or data migrations.
**Delivers:** Installable app (desktop shortcut), file-based backup with auto-export, command palette.
**Research flag:** Standard patterns — STACK.md and PITFALLS.md provide complete implementation detail. Cross-origin data migration UX (file:// → PWA) needs design before implementation.

### Phase 3: Bestiary — SRD Monster Compendium

**Rationale:** Structural dependency for statblock popup, legendary auto-detection, mob mode auto-populate, XP from CR. Contains the most architecturally significant open decision (data storage).
**Delivers:** Offline searchable monster reference, custom monster CRUD, add-to-encounter/initiative.
**Research flag:** Needs data-size spike at phase start. German source completeness needs verification at implementation time.

### Phase 4: Initiative Extensions — Legendary Actions + Mob Mode + Statblock Popup

**Rationale:** All three extend the combatant data model and require Bestiary data. Changes concentrated in `features/initiative.js` and `features/initiative-extras.js`.
**Delivers:** Boss-fight legendary/resistance counters, grouped mob rows with pool HP, statblock popup on combatant click.
**Research flag:** Standard combat tracker patterns — no additional research needed.

### Phase 5: World Features — Session Prep, NPC Generator, Timeline, Travel Simulator, Factions

**Rationale:** Independent of Bestiary. Shared implementation pattern across all five (new D collection, CRUD module, migration). Best shipped together as coherent "story tools" release.
**Delivers:** Lazy-DM-method session prep, instant NPC generation with German name tables, campaign event log, travel/weather simulation, faction reputation tracking.
**Research flag:** NPC name table content (German, ~200 first names + ~100 surnames) is a content curation task, not a research task.

### Phase 6: Player Features — XP, Inspiration, Extended Character Sheets

**Rationale:** All extend `D.characters[]` under a single migration entry. Low-risk, well-scoped. No new tabs or modules.
**Research flag:** Standard D&D 5e tables — no research needed.

### Phase 7: UX Polish — Dice Statistics + Soundboard

**Rationale:** P3 priority, no blocking dependencies. Best added after core workflow is stable. Dice statistics roll history must use a dedicated IndexedDB store — never in `D`.
**Research flag:** Complete implementation patterns in STACK.md — no additional research needed.

### Research Flags Summary

Needs `/gsd-research-phase` during planning:

- **Phase 3 (Bestiary):** Data-size spike + German source completeness verification
- **Phase 2 (PWA):** Cross-origin data migration UX (file:// → PWA) needs UX design before implementation

Standard patterns (skip research-phase):

- Phase 4 (Initiative Extensions), Phase 5 (World Features), Phase 6 (Player Features), Phase 7 (Dice/Audio)

---

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                                                                       |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | All capabilities verified against MDN/Chrome docs. No dependency risk (zero runtime deps). Browser API support confirmed for Chromium 86+.                                                  |
| Features     | HIGH       | Based on competitor analysis (FeyWorks, Improved Initiative, Kanka, World Anvil), D&D community patterns, and existing codebase capabilities.                                               |
| Architecture | HIGH       | Derived directly from reading 92 source modules — not from web search. Module insertion points, data flow, and integration points are precise.                                              |
| Pitfalls     | HIGH       | Part A: direct code evidence from CONCERNS.md and codebase inspection. Part B: verified against official MDN/Chrome documentation. 5MB stale-shadow bug confirmed as actively reproducible. |

**Overall confidence: HIGH**

### Gaps to Address

- **Monster data size:** Discrepancy between 15 KB / 150 KB / 630 KB estimates is real and unresolved. 30-minute spike at Phase 3 start resolves it. Do not commit to inline vs. lazy-load before measuring.
- **German SRD spell provenance:** Existing German SRD spells in `core/srd-spells.js` have unknown source. If copied from community translation under OGL with Ulisses Spiele copyright, this is a redistribution risk. Must audit in Phase 1.
- **`nesges/SRD-5.1-DE` completeness:** German monster source available only via online API; schema validation status uncertain. Completeness must be verified at Phase 3 implementation time. English SRD data with German UI labels is an acceptable fallback.
- **Command palette shortcut final choice:** `Ctrl+Shift+K` vs. `Ctrl+P` — both avoid the collision, both have minor tradeoffs. Decide during Phase 2 planning after a shortcut audit pass.
- **Soundboard file persistence on `file://`:** Users must re-select audio files each session in `file://` mode (no File System API). Validate this UX tradeoff against target-user expectations during Phase 7 planning.

---

_Research completed: 2026-06-11_
_Synthesized from: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md_
