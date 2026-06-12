# Architecture Research

**Domain:** Offline-first D&D 5e campaign manager (non-ESM modular monolith, brownfield)
**Researched:** 2026-06-11
**Confidence:** HIGH — derived directly from reading 92 source modules, not from web search

---

## Architectural Constraints (Fixed — Do Not Redesign)

This is a brownfield integration exercise. The architecture is fixed. Every design decision below
must satisfy all four constraints simultaneously:

1. **No ESM.** No `import`/`export`. All globals via lexical scope (`const`/`let`) or explicit
   `window.X = X` exports. Never `const X = window.X` inside a function body.
2. **Single concatenated file.** `build.py` concatenates 92+ modules. Duplicate top-level function
   names cause orphaned function bodies. Duplicate `var X = window.X` aliases are stripped by Pass 2.
3. **Single mutable state tree.** All persistent state lives in `window.D`. Features lazy-init their
   slice on first access (`if (!D.randomTables) D.randomTables = ...`). Schema extensions need a
   version migration entry in `systems/spellslots/version-migration.js`.
4. **Strict module load order.** `loader.js` MODULES array and `build.py` modules list must be
   identical. New modules must be inserted after their dependencies and before `core/init.js`.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DELIVERY SHELL                                                          │
│  ┌──────────────────────────┐  ┌────────────────────────────────────┐   │
│  │ dev: index.html+loader.js│  │ prod: dist/dnd-tracker-bundled.html│   │
│  │ 92 <script> tags injected│  │ single <script> block (build.py)   │   │
│  └──────────────────────────┘  └────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: core/  (loaded first, no dependencies)                         │
│  config.js  |  data.js (window.D schema)  |  constants.js               │
│  themes.js  |  srd-spells.js (lazy cache) |  init.js (loaded LAST)       │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: utils/  (infrastructure primitives)                            │
│  basic.js($,esc,StorageAPI)  |  utilities.js(nextId,parseEntityId)       │
│  crud-helpers.js  |  validation.js  |  filter-engine.js  |  game-rules.js│
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: systems/  (cross-cutting subsystems)                           │
│  undo.js  |  backups.js  |  tab-registry.js  |  entity-links.js          │
│  spellslots/ (persistence, navigation/switchView, version-migration,     │
│               keyboard-shortcuts, pwa-install, import-export, load())    │
│  search/global-search.js  |  campaign-manager/                           │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: render/helpers.js  (shared render infrastructure)              │
│  ErrorHandler  |  safeRender  |  EntityLookup (cacheable)                │
│  getEntityForCombat()  |  populateFilterDropdown()                       │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 5: features/  (domain logic + rendering, one concern per file)    │
│  party/  |  npcs/  |  locations/  |  quests/  |  encounters/             │
│  initiative.js  |  encounter-calculator.js  |  rest-manager.js           │
│  random-tables.js  |  dmscreen/  |  dice/  |  sessions/  |  wiki/        │
│  shops/  |  timers/  |  loot-distribution.js  |  render-dashboard.js     │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 6: ui/  (event wiring + editors, loaded last before init)         │
│  event-delegation.js  |  actions/*.js (7 domain handler modules)         │
│  editors/ (rich-text.js, markdown-shortcuts.js, markdown-converter.js)  │
│  virtual-scroll.js  |  dom-builder.js  |  safe-render.js                 │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│  PERSISTENT STATE  (window.D → localStorage + IndexedDB fallback)        │
│  characters[] npcs[] locations[] quests[] encounters[] initiative{}      │
│  spells[] loot[] wiki[] sessionNotes[] calendar{} randomTables[]         │
│  shops[] dmScreenLayout{} diceHistory[] partyGold _nextId{}              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries Per Planned Feature

### Feature Group A: Tech Foundation

#### A1 — PWA (manifest + service worker)

**What it is:** Make the app installable as a PWA so it runs under an `https://` or `localhost`
origin instead of `file://`, unlocking Service Worker caching, File System Access API, and
`beforeinstallprompt`.

**Boundary:**

- `sw.js` already exists. It only needs its `STATIC_ASSETS` list and `CACHE_NAME` updated to match
  the bundled output file. The current list references `./assets/body.html` (stale) and
  does not include the new manifest.
- A `manifest.json` file must be added to the project root and referenced from `index.html` and
  from the `build.py` HTML template (which generates the `<head>` of the bundled file).
- `systems/spellslots/pwa-install.js` already implements `initPWA()`, `showPWABanner()`,
  `installPWA()`. The banner HTML element `#pwa-install-banner` must exist in a template.
- No new JS module needed. Changes: `sw.js`, `manifest.json` (new file), `build.py` HTML template,
  `assets/templates/header.html` (banner element).

**D schema change:** None.

**Load order:** No new module. `initPWA()` is already called from `core/init.js:118`.

**Serves as prerequisite for:** File System Access API backup (A2), and resolves the
`file://`-origin restrictions that block Service Worker registration entirely.

#### A2 — File Backup Sync (File System Access API)

**What it is:** Let the user pick a directory once via `window.showDirectoryPicker()`, then
auto-export a JSON backup there after every save (or on a timer), in addition to the existing
IndexedDB auto-backup.

**Boundary:**

- New module: `systems/file-backup.js` in the systems layer (cross-cutting, not feature-specific).
- Exposes `initFileBackup()` called from `core/init.js` after `startAutoBackup()`.
- Hooks into the existing DM Screen live-sync pattern: wraps `window.save` once with
  `window._originalSave` guard, triggers `scheduleFileBackup()` debounced 2000ms.
- Persists the `FileSystemDirectoryHandle` to IndexedDB (via the existing IDB wrapper in
  `core/init.js`) because `FileSystemDirectoryHandle` is not JSON-serializable to localStorage.
- UI: a small "Datei-Backup" card in the `data` tab (view-tools.html or a new section in
  view-tools.html). Actions registered in `ui/actions/system-actions.js` (already handles misc
  modals/system actions).

**D schema change:** None. The IDB store key `'file-backup-handle'` lives outside `D`.

**Load order:** Insert `systems/file-backup.js` after `systems/backups.js` in both `loader.js` and
`build.py`. Must load before `core/init.js`.

**Constraint:** `window.showDirectoryPicker()` is only available in Chromium and only over
`https://` or `localhost` — NOT over `file://`. This feature therefore depends on PWA (A1) being
deployed first, or the user serving locally with `npm run dev`.

#### A3 — Command Palette

**What it is:** A `Ctrl+K` overlay that can both search entities (existing fuzzy search) AND execute
named actions (e.g., "Neue Session", "Würfle Initiative", "Öffne DM-Screen").

**Boundary:**

- New module: `systems/command-palette.js` in the systems layer.
- Builds on `systems/search/global-search.js` for entity search results. Calls
  `globalSearch(query)` and renders results in the palette overlay.
- Defines a `COMMAND_REGISTRY` object (similar to `getDMScreenWidgets()`) that maps command names
  to handler functions: `{ id, label, keywords, icon, action }`. Each `action` calls an existing
  global function.
- Keyboard shortcut registration must NOT conflict with existing `Ctrl+K`/`Ctrl+F` handling in
  `systems/spellslots/keyboard-shortcuts.js`. The current handler opens global search input. The
  command palette supersedes this — `keyboard-shortcuts.js` should delegate to
  `window.openCommandPalette()` instead of directly focusing the search input.
- HTML: a single `<div id="command-palette-overlay">` element in `modals-tools.html` (or
  `header.html`).
- CSS: new section in `assets/styles/tools.css` (already contains quick-reference styles).
- Actions: registered in `ui/actions/system-actions.js`.

**D schema change:** None (runtime-only overlay, no persistence needed).

**Load order:** Insert `systems/command-palette.js` after `systems/search/global-search.js` in both
lists. Must load before `systems/spellslots/keyboard-shortcuts.js` so shortcuts can reference it.
Actually keyboard-shortcuts.js loads after command-palette.js in the systems layer — insert
command-palette.js before keyboard-shortcuts.js.

---

### Feature Group B: Bestiary

#### B1 — Bestiary Data Module

**What it is:** ~300 SRD monsters as a lazy-cached in-memory dataset, plus a `D.bestiary[]`
collection for custom monsters.

**Boundary:**

- New module: `core/srd-monsters.js` — parallels `core/srd-spells.js` exactly. Uses the same
  lazy-cache pattern (`let _monsterCache = null; function getSRDMonsters() { if (_monsterCache)...`).
- The existing `features/encounters/monster-templates.js` has 12 templates as a hand-keyed object.
  `srd-monsters.js` subsumes this; `monster-templates.js` can be converted to a thin wrapper that
  pulls from `getSRDMonsters()` for backward compatibility.
- Monster schema (each entry):
    ```
    { id, name, cr, type, size, alignment, ac, acType, hp, hpDice,
      speed: { walk, fly, swim, climb, burrow },
      str, dex, con, int, wis, cha,
      savingThrows: [], skills: [], senses: {}, languages: [],
      immunities: [], resistances: [], vulnerabilities: [],
      traits: [], actions: [], bonusActions: [], reactions: [],
      legendaryActions: [], legendaryActionsCount: 0,
      source: 'SRD'|'custom' }
    ```
- `D.bestiary[]` stores custom monsters added by the user. SRD monsters are NOT stored in `D`
  (they are read-only embedded data, same approach as `D.spells` vs `core/srd-spells.js`).

**Bundle size impact:** The existing 500+ German SRD spells in `core/srd-spells.js` are the
reference point. That file is already in the bundle. 300 monsters with full statblocks will be
larger per-entry than spells (more fields). Estimate: 80–150 KB of raw JS text for 300 monsters.
After `build.py --production` minification this compresses well (repetitive structure). The bundled
file is currently ~1.28 MB; monsters would add ~15–25 KB minified. Acceptable. The lazy-cache
pattern means the data object is only parsed once on first access.

**D schema change:**

```javascript
// core/data.js initializeData() — add:
bestiary: [],  // custom monsters only; SRD monsters are in core/srd-monsters.js

// version-migration.js — add migration entry for new APP_CONFIG.VERSION:
'3.0.0': (data) => {
    if (!data.bestiary) data.bestiary = [];
    return data;
}
```

**Load order:** `core/srd-monsters.js` loads in the core layer, after `core/srd-spells.js`. Then
`features/bestiary/bestiary-render.js` and `features/bestiary/bestiary-crud.js` load in the
features layer.

#### B2 — Bestiary Tab

**What it is:** A new tab showing SRD monsters + custom monsters, searchable/filterable, with CRUD
for custom entries.

**Boundary:**

- `features/bestiary/bestiary-render.js` — `renderBestiary()`, filters, statblock display.
- `features/bestiary/bestiary-crud.js` — `saveBestiaryEntry()`, `deleteBestiaryEntry()` for custom
  monsters only. SRD entries are read-only.
- Tab registration in `systems/tab-registry.js`:
    ```javascript
    'bestiary': {
        renders: ['renderBestiary'],
        init: 'initBestiary',
        cleanup: null
    }
    ```
- HTML: new `<div class="view" data-view="bestiary">` in `assets/templates/view-content.html` (or
  a new `view-bestiary.html` template added to the template list in `loader.js` template fetcher
  and `build.py` template concatenation section).
- Navigation tab: add `<button class="nav-tab" data-view="bestiary">` in `assets/templates/header.html`.
- Actions: new entries in `ui/actions/entity-actions.js` (monster CRUD fits the entity domain).
- CSS: new file `assets/styles/bestiary.css` — add `@import` to `assets/styles.css` and entry to
  `build.py` css_files list.

**Communicates with:** `core/srd-monsters.js` (read), `D.bestiary` (read/write), `render/helpers.js`
(EntityLookup, safeRender), `systems/entity-links.js` (link monsters to encounters/quests).

#### B3 — Statblock Popup in Initiative

**What it is:** A popover/modal showing the full statblock of the active combatant in the initiative
tracker. Requires bestiary data to be available.

**Boundary:**

- Belongs in `features/initiative-extras.js` (already exists for initiative add-ons).
- `showStatblockPopup(combatantId)` looks up the combatant's linked entity:
    1. If `combatant.type === 'player'`: show character sheet summary.
    2. If `combatant.type === 'enemy'`: look up `D.encounters` for the encounter definition, then
       check `D.bestiary` and `getSRDMonsters()` for a matching monster by name.
    3. Falls back to showing whatever fields are stored on the encounter entry.
- HTML: reuse the existing modal infrastructure (`showModal`/`hideModal` from
  `systems/spellslots/navigation.js`); add `<div id="statblock-modal">` to `modals-entity.html`.
- No new module needed — add to `features/initiative-extras.js`.

**Depends on:** B1 (bestiary data model). Build after B1.

---

### Feature Group C: Initiative Extensions

#### C1 — Legendary Action Counters

**What it is:** Per-combatant legendary action counter in the initiative tracker (reset each round).

**Boundary:**

- Combatant model extension (runtime only, not persisted separately):
    ```javascript
    // On combatant object in D.initiative.combatants[]:
    legendaryActionsTotal: 3,   // from monster statblock or manual
    legendaryActionsUsed: 0,
    legendaryResistancesTotal: 3,
    legendaryResistancesUsed: 0
    ```
- Render: `renderCombatantLegendary(combatant)` — extract from `renderInit()` cleanup, add to
  `features/initiative.js` as a helper (follows the existing `renderCombatantEffects()` pattern).
- Reset: `resetLegendaryActions()` called in `nextRound()` function in `features/initiative.js`.
- Actions: `data-action="use-legendary-action"` / `data-action="use-legendary-resistance"` in
  `ui/actions/combat-actions.js`.
- No new module needed.

**D schema change:** Combatant fields only — no migration needed because `D.initiative` is not
persisted across sessions (it's reset when a new encounter starts). Combatants are created fresh
each initiative.

#### C2 — Mob/Mass Combat Mode

**What it is:** Group multiple identical enemies under one initiative entry with a shared HP pool
or per-member HP tracking, group saving throws, grouped damage.

**Boundary:**

- New module: `features/mob-combat.js` in the features layer.
- Extends combatant model:
    ```javascript
    // On D.initiative.combatants[]:
    isMobGroup: true,
    mobCount: 6,
    mobHpPerMember: 7,
    mobMembersAlive: 6  // decrements as members die
    ```
- `showMobGroupModal()` — UI for creating a group (count, shared initiative, per-member HP).
- `applyMobDamage(groupId, damage)` — kill members as damage accumulates.
- Integrates with AoE damage calculator in `features/initiative.js` (`showAoEDamageModal`).
- CSS: new section in `assets/styles/initiative.css`.

**D schema change:** Combatant fields only — same reasoning as C1.

**Load order:** Insert `features/mob-combat.js` after `features/initiative-extras.js`.

---

### Feature Group D: World Features

#### D1 — Campaign Timeline

**What it is:** Chronological list of events linked to `D.calendar`. Events can reference other
entities (NPCs, quests, locations).

**Boundary:**

- `D.timeline[]` is the new collection.
- Schema:
    ```javascript
    // D.timeline[]:
    { id, title, description, date: { day, month, year },
      calendarDay: 0,  // computed absolute day for sorting
      tags: [],
      linkedEntities: [] }  // same format as entity-links: [{entityType, entityId}]
    ```
- New module: `features/timeline/timeline-render.js` + `features/timeline/timeline-crud.js`.
- Reuses `systems/entity-links.js` for `linkedEntities`.
- The calendar sub-object in `D.calendar` is read-only from the timeline's perspective —
  the timeline reads `D.calendar.day/month/year` for "today" but does not mutate it.
- Tab registration: `'timeline': { renders: ['renderTimeline'], init: null, cleanup: null }`.
- HTML: new view section in `assets/templates/view-content.html`.

**D schema change:**

```javascript
// core/data.js initializeData():
timeline: [],

// version-migration.js:
'3.0.0': (data) => {
    if (!data.bestiary) data.bestiary = [];
    if (!data.timeline) data.timeline = [];
    // ... other new collections
    return data;
}
```

**Load order:** After `features/quests/` (similar CRUD pattern), before `ui/` layer.

#### D2 — Factions and Reputation System

**What it is:** Faction definitions with reputation levels per character/party, linked to NPCs and
locations.

**Boundary:**

- `D.factions[]` collection.
- Schema:
    ```javascript
    // D.factions[]:
    { id, name, description, goals, symbol, color,
      reputation: 0,  // party-level default
      characterReputations: {},  // { characterId: number }
      linkedNPCs: [],   // [{ entityType: 'npcs', entityId }]
      linkedLocations: [] }
    ```
- New modules: `features/factions/factions-render.js` + `features/factions/factions-crud.js`.
- Reuses `systems/entity-links.js` and `systems/tags.js`.
- NPC detail panel (`features/npcs/npc-render.js`) gets a "Fraktionen" section showing which
  factions this NPC belongs to, reading `D.factions`.
- Tab registration.

**D schema change:** Add `factions: []` to `initializeData()` + migration entry.

#### D3 — Travel and Weather Simulator

**What it is:** Compute daily travel (terrain, weather, random encounters) using existing
`D.randomTables` and `D.calendar`.

**Boundary:**

- New module: `features/travel-simulator.js` (single file, no split needed initially).
- Calls `rollOnTable(tableId)` (already global from `features/random-tables.js`) for encounter
  generation.
- Advances `D.calendar.day` by the number of travel days, adding calendar events for significant
  encounters.
- Configurable terrain types reuse `DND_RULES` constants or a new `TERRAIN_TYPES` constant in
  `core/constants.js`.
- UI: modal-based flow (`showTravelModal()`) rather than a dedicated tab — fits naturally in the
  dice/tools area or the DM Screen.

**D schema change:** None — results are written to `D.calendar.events[]` and `D.sessionNotes[]`.

**Load order:** After `features/random-tables.js` (depends on `rollOnTable`).

#### D4 — NPC Generator

**What it is:** Generate a random NPC (name, personality trait, flaw, appearance) on button press,
optionally using custom random tables.

**Boundary:**

- New module: `features/npc-generator.js` (single file).
- Calls `rollOnTable(tableId)` for custom table lookups.
- Falls back to embedded name/trait lists (inline data, same pattern as `monster-templates.js`).
- `generateNPC()` returns a pre-filled NPC object; opens the NPC form pre-populated.
- No new tab — adds a "Generieren" button to the NPC view header.
- Load order: after `features/random-tables.js`, before `features/npcs/npc-crud.js` (or after —
  npc-crud.js does not depend on npc-generator.js, so order between them is flexible; place after
  npcs/ for clarity).

**D schema change:** None (generates into existing `D.npcs[]` via existing `saveNpc()`).

---

### Feature Group E: Player Features

#### E1 — XP and Milestone Tracker

**What it is:** Track XP earned per session/encounter, milestone progress, next level threshold.

**Boundary:**

- Extends `D.characters[]` schema per character:
    ```javascript
    // Added fields on each character:
    xp: 0,
    xpToNextLevel: 300,  // populated by migration from XP table in DND_RULES
    milestones: []       // [{ id, description, achieved: bool, achievedAt }]
    ```
- No new tab needed — renders inside `features/party/party-details.js` (character detail panel).
- New render helper: `renderXPTracker(character)` in `features/party/party-details.js`.
- XP thresholds table: add `XP_THRESHOLDS` array to `core/constants.js` under `DND_RULES`.
- `awardEncounterXP(encounterId)` in `features/encounter-calculator.js` — already computes XP;
  add a "XP vergeben" button that distributes XP to living party members.

**D schema change:**

```javascript
// version-migration.js — add to the 3.0.0 migration:
data.characters?.forEach(c => {
    if (c.xp === undefined) c.xp = 0;
    if (!c.milestones) c.milestones = [];
});
```

**No new module** — extend `features/party/party-details.js` and `features/party/party-crud.js`.

#### E2 — Inspiration Tracker

**What it is:** Simple boolean (or count) per character showing whether they have inspiration.

**Boundary:**

- Extends `D.characters[]`: add `inspiration: false` (or `inspirationCount: 0` for variant).
- Renders as a toggle in the party roster card and in the character detail panel.
- `toggleInspiration(charId)` in `features/party/party-crud.js`.
- Action: `data-action="toggle-inspiration"` in `ui/actions/entity-actions.js`.

**D schema change:** Minimal — add migration: `if (c.inspiration === undefined) c.inspiration = false`.

**No new module.**

#### E3 — Extended Character Sheet Fields

**What it is:** Skills (proficiency-based modifiers), saving throw proficiencies, and attack
entries on the character object for quick in-play reference.

**Boundary:**

- Extends `D.characters[]`:
    ```javascript
    // Added fields:
    proficiencyBonus: 2,
    skillProficiencies: {},   // { athletics: 'proficient'|'expertise'|null }
    saveProficiencies: {},    // { str: true, dex: false, ... }
    attacks: [{ name, bonus, damageDice, damageType, notes }]
    ```
- Render: new collapsible sections in the character detail panel (`features/party/party-details.js`).
- Skill modifier computation goes into `utils/game-rules.js` (already contains HP/modifier math).
- Migration: fill default proficiency bonus from level, empty skill/save objects.

**D schema change:** character fields only, migration entry in `version-migration.js`.

**No new module.**

---

### Feature Group F: Dice Statistics

**What it is:** Histogram/distribution view of the existing `D.diceHistory` roll log — crit rate,
average per die type, streaks.

**Boundary:**

- New module: `features/dice/dice-stats.js` — `renderDiceStats()`.
- Reads `D.diceHistory` (already populated by `features/dice/dice-core.js`).
- All computation is pure JS (no charting library — render as CSS bar charts using `<div>` widths,
  same approach as HP bars throughout the app).
- Tab registration: add `'renderDiceStats'` to the `renders` array of the `'dice'` tab entry in
  `TAB_RENDER_REGISTRY`. No new tab needed — statistics panel lives inside the Dice tab.
- Load order: after `features/dice/dice-favorites.js`, before the UI layer.

**D schema change:** None. `D.diceHistory` already exists; add `D.diceStats` only if caching
computed aggregates becomes necessary (unlikely for <10k rolls).

---

## Data Flow

### Canonical CRUD Flow (All Features Follow This)

```
User action (click data-action="save-bestiary-entry")
    |
    v
EventDelegation._handleClick  (ui/event-delegation.js)
    |
    v
Handler in ui/actions/entity-actions.js
    |
    v
Feature function: saveBestiaryEntry(id)
    |
    +-- saveUndoState('Bestiary-Eintrag gespeichert')  [systems/undo.js]
    +-- validate entity against VALIDATION_SCHEMAS      [utils/validation.js]
    +-- mutate D.bestiary[]
    +-- saveImmediate()  [systems/spellslots/persistence.js]
    +-- renderBestiary()
    +-- showToast('Eintrag gespeichert', 'success')
```

### Schema Extension Flow (New Collections)

```
App startup → load() in systems/spellslots/quick-roll.js
    |
    v
Deserialize JSON from localStorage → D object
    |
    v
migrateData(D)  [systems/spellslots/version-migration.js]
    |
    +-- version '3.0.0' migration runs if D._version < '3.0.0'
    +-- adds D.bestiary = []  (if missing)
    +-- adds D.timeline = []  (if missing)
    +-- adds D.factions = []  (if missing)
    +-- adds character.xp, .milestones, .inspiration, etc.
    |
    v
Feature modules lazy-init remaining optional collections:
    features/random-tables.js:  if (!D.randomTables) D.randomTables = [...]
    features/dmscreen/*:        if (!D.dmScreenLayout) ...
    (same pattern for any optional collection)
```

### Initiative Combatant Data Flow

```
Encounter definition in D.encounters[]
    |  (addToInitiative action)
    v
D.initiative.combatants[] — combatant object:
    { id, name, type, currentHp, maxHp, ac, initiative,
      effects[], deathSaves{}, concentration{},
      legendaryActionsUsed, legendaryActionsTotal,   [NEW — C1]
      isMobGroup, mobCount, mobMembersAlive,         [NEW — C2]
      ...
    }
    |
    v
renderInit() — calls helpers per combatant:
    getInitCombatantDetails(cb)     → AC from EntityLookup/bestiary
    getCombatantHpStatus(cb)        → HP class
    renderCombatantEffects(cb)      → effect badges
    renderCombatantLegendary(cb)    → legendary counter [NEW — C1]
    renderCombatantSpellSlots(cb)   → slot pips
    showStatblockPopup(cb.id)       → opens statblock modal [NEW — B3]
```

### PWA / Service Worker Data Flow

```
User opens app in browser (http://localhost:8000 or installed PWA)
    |
    v
sw.js intercepts fetch — cache-first for bundled HTML, all templates, CSS
    |
    v
App loads from cache if offline; updates cache in background when online
    |
    v
File System Access API [A2 — only when online and permission granted]:
    save() triggers → systems/file-backup.js debounced handler
        → fileHandle.createWritable() → write JSON export
        → close writable
        (IDB stores the FileSystemDirectoryHandle for persistence)
```

---

## Dependency-Driven Build Order

This is the sequence in which features must be implemented to respect data and code dependencies.

```
PHASE 1: Stabilization (prerequisite for everything)
    Fix tools/debug.js clearMindmap reference
    Fresh builds, lint/typecheck green

PHASE 2: Tech Foundation
    A1 (PWA manifest + sw.js update)
        → enables Service Worker, PWA install
        → prerequisite for A2
    A2 (File Backup Sync)
        → depends on A1 (needs https/localhost origin for FileSystemDirectoryHandle)
        → new module: systems/file-backup.js
    A3 (Command Palette)
        → depends on: systems/search/global-search.js (already exists)
        → new module: systems/command-palette.js
        → load BEFORE systems/spellslots/keyboard-shortcuts.js

PHASE 3: Bestiary Data (prerequisite for Initiative Extensions)
    B1 (core/srd-monsters.js + D.bestiary schema + migration)
        → new core module, migration entry
        → prerequisite for B2, B3
    B2 (Bestiary Tab)
        → depends on B1
        → new features/bestiary/ modules
        → new tab HTML + CSS
    B3 (Statblock Popup in Initiative)
        → depends on B1 (monster data lookup)
        → add to features/initiative-extras.js

PHASE 4: Initiative Extensions (can run parallel to Bestiary after B1)
    C1 (Legendary Actions/Resistances)
        → no new module, extend features/initiative.js
        → can start after Phase 1
    C2 (Mob Combat Mode)
        → depends on C1 (shared initiative model)
        → new module: features/mob-combat.js

PHASE 5: World Features (independent of Bestiary, can run after Phase 1)
    D1 (Timeline)
        → new D.timeline[], migration
        → new features/timeline/ modules
    D2 (Factions)
        → new D.factions[], migration
        → new features/factions/ modules
        → NPC panel integration: after D2 module exists
    D3 (Travel Simulator)
        → depends on: features/random-tables.js (rollOnTable), D.calendar
        → new features/travel-simulator.js
    D4 (NPC Generator)
        → depends on: features/random-tables.js (rollOnTable), npc-crud.js (saveNpc)
        → new features/npc-generator.js

PHASE 6: Player Features (depends on existing party/ infrastructure)
    E1 (XP Tracker) + E2 (Inspiration) + E3 (Extended Sheet)
        → all extend D.characters[], single migration entry handles all three
        → no new modules, extend party/party-details.js and party-crud.js
        → add XP_THRESHOLDS to core/constants.js DND_RULES
        → E1 also extends features/encounter-calculator.js

PHASE 7: Dice Statistics
    F1 (Dice Stats)
        → depends on D.diceHistory (already exists)
        → new features/dice/dice-stats.js
        → no new tab or migration
```

---

## Module Insertion Points in Load Order

The following shows exactly where new modules insert into `loader.js` / `build.py`:

```
... existing ...
'core/srd-spells.js',
'core/srd-monsters.js',         [NEW B1 — core layer, after srd-spells]

... existing systems ...
'systems/backups.js',
'systems/file-backup.js',       [NEW A2 — systems layer, after backups.js]
'systems/tab-registry.js',
'systems/command-palette.js',   [NEW A3 — after global-search, before keyboard-shortcuts]
'systems/search/global-search.js',
'systems/campaign-manager/campaign-manager.js',

... existing render/features ...
'features/encounter-calculator.js',
'features/initiative.js',
'features/initiative-extras.js',  (existing)
'features/mob-combat.js',          [NEW C2 — after initiative-extras]
'features/npc-generator.js',       [NEW D4 — after random-tables and npc-crud]
'features/travel-simulator.js',    [NEW D3 — after random-tables]
'features/bestiary/bestiary-render.js',  [NEW B2]
'features/bestiary/bestiary-crud.js',    [NEW B2]
'features/timeline/timeline-render.js',  [NEW D1]
'features/timeline/timeline-crud.js',    [NEW D1]
'features/factions/factions-render.js',  [NEW D2]
'features/factions/factions-crud.js',    [NEW D2]
'features/dice/dice-favorites.js',
'features/dice/dice-stats.js',    [NEW F1 — after dice-favorites]

... existing UI/actions (unchanged) ...
```

---

## D Schema Additions Summary

All additions are backward-compatible (existing saves load fine; migration adds missing fields).
All collections use the same `nextId('bestiary')`, `nextId('timeline')` etc. via the existing
`_nextId` map in `D`.

| Collection / Field                    | Type    | Migration Version | Lazy Init?                          |
| ------------------------------------- | ------- | ----------------- | ----------------------------------- |
| `D.bestiary[]`                        | Array   | 3.0.0             | No (always present after migration) |
| `D.timeline[]`                        | Array   | 3.0.0             | No                                  |
| `D.factions[]`                        | Array   | 3.0.0             | No                                  |
| `character.xp`                        | Number  | 3.0.0             | No                                  |
| `character.xpToNextLevel`             | Number  | 3.0.0             | No                                  |
| `character.milestones[]`              | Array   | 3.0.0             | No                                  |
| `character.inspiration`               | Boolean | 3.0.0             | No                                  |
| `character.proficiencyBonus`          | Number  | 3.0.0             | No                                  |
| `character.skillProficiencies{}`      | Object  | 3.0.0             | No                                  |
| `character.saveProficiencies{}`       | Object  | 3.0.0             | No                                  |
| `character.attacks[]`                 | Array   | 3.0.0             | No                                  |
| `combatant.legendaryActionsTotal`     | Number  | runtime only      | Yes (on add-to-initiative)          |
| `combatant.legendaryActionsUsed`      | Number  | runtime only      | Yes                                 |
| `combatant.legendaryResistancesTotal` | Number  | runtime only      | Yes                                 |
| `combatant.legendaryResistancesUsed`  | Number  | runtime only      | Yes                                 |
| `combatant.isMobGroup`                | Boolean | runtime only      | Yes                                 |
| `combatant.mobCount`                  | Number  | runtime only      | Yes                                 |
| `combatant.mobMembersAlive`           | Number  | runtime only      | Yes                                 |

**Single migration function handles all persistent changes** — one entry for version `3.0.0` in
`MIGRATIONS` covers bestiary, timeline, factions, and all character field additions.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Splitting the SRD Monster Data Across Multiple Modules

**What people do:** Create separate files per monster CR-tier or type to keep module size down.

**Why it is wrong:** Each file needs its own loader.js + build.py entry. The lazy-cache pattern
already means the data is parsed only once. Multiple small files create synchronization burden
(two lists to keep in sync) without meaningful benefit.

**Do this instead:** One `core/srd-monsters.js` with all data, lazy-cached, same as `srd-spells.js`.

### Anti-Pattern 2: Giving the Command Palette Its Own Keyboard Shortcut Module

**What people do:** Add a new keyboard shortcut file for command palette shortcuts.

**Why it is wrong:** `systems/spellslots/keyboard-shortcuts.js` already owns ALL keyboard
shortcuts. Splitting shortcuts into multiple modules causes action conflicts and makes it impossible
to document all shortcuts in one place.

**Do this instead:** Add command palette shortcut registration inside `keyboard-shortcuts.js`,
calling `window.openCommandPalette()` which is exported by `systems/command-palette.js`.

### Anti-Pattern 3: Storing Bestiary Combatant State in D.bestiary

**What people do:** Add `currentHp`, `conditions[]`, and other runtime fields to the bestiary
entry and mutate it during combat.

**Why it is wrong:** Bestiary entries are definitions, not instances. Mutating them during combat
corrupts the definition for future use. This is the same mistake as mutating `D.encounters` entries
during combat (the existing code correctly creates separate combatant objects in `D.initiative`).

**Do this instead:** Copy relevant fields from the bestiary entry onto the combatant object when
adding to initiative. The combatant is the runtime instance; the bestiary entry is the template.

### Anti-Pattern 4: New Tab for Every Small Feature

**What people do:** Add a dedicated tab for XP tracking, inspiration, factions reputation display,
travel simulator, etc.

**Why it is wrong:** The navigation already has 17 tabs. Each tab requires HTML, CSS, tab registry
entry, and nav button. Small features do not justify their own tabs; they cause UI clutter and
increase the maintenance surface.

**Do this instead:** Extend existing panels (XP in party-details, inspiration as a character card
badge, travel simulator as a modal). Only Bestiary, Timeline, and Factions justify new tabs.

### Anti-Pattern 5: Bypassing the Migration System for Schema Changes

**What people do:** Add new fields to `initializeData()` in `core/data.js` and assume existing
saves will be fine because they'll be `undefined`.

**Why it is wrong:** `undefined` fields cause silent render bugs (e.g., `character.xp || 0` works
but `character.attacks.map(...)` on `undefined` throws). The migration system exists precisely to
repair existing data.

**Do this instead:** Add new fields to `initializeData()` AND add a migration entry in
`systems/spellslots/version-migration.js` that fills missing fields with defaults. Bump
`APP_CONFIG.VERSION`.

---

## Integration Points Between New and Existing Systems

| New Component                   | Existing System                            | Integration                                                       |
| ------------------------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| `core/srd-monsters.js`          | `features/encounters/monster-templates.js` | monster-templates becomes thin wrapper calling `getSRDMonsters()` |
| `features/bestiary/`            | `render/helpers.js` `EntityLookup`         | add `bestiary` type to `EntityLookup` convenience methods         |
| `features/bestiary/`            | `systems/entity-links.js`                  | monsters linkable from quests, locations, encounters              |
| `features/initiative-extras.js` | `core/srd-monsters.js`                     | statblock popup reads from `getSRDMonsters()`                     |
| `systems/command-palette.js`    | `systems/search/global-search.js`          | calls `globalSearch(query)` for entity results                    |
| `systems/command-palette.js`    | `systems/spellslots/keyboard-shortcuts.js` | keyboard-shortcuts delegates Ctrl+K to `openCommandPalette()`     |
| `systems/file-backup.js`        | `systems/spellslots/persistence.js`        | wraps `window.save` with `_originalSave` guard pattern            |
| `features/timeline/`            | `systems/entity-links.js`                  | timeline events link to entities via `linkedEntities[]`           |
| `features/factions/`            | `features/npcs/npc-render.js`              | NPC detail panel reads `D.factions` to show faction memberships   |
| `features/travel-simulator.js`  | `features/random-tables.js`                | calls `rollOnTable(tableId)` for encounter generation             |
| `features/npc-generator.js`     | `features/npcs/npc-crud.js`                | calls `saveNpc()` with generated data                             |
| `features/dice/dice-stats.js`   | `features/dice/dice-core.js`               | reads `D.diceHistory` written by dice-core                        |
| All new features                | `utils/crud-helpers.js`                    | `deleteWithConfirm`, `afterCrudOperation`, `saveEntityWithUndo`   |
| All new features                | `utils/validation.js`                      | add new entity schemas to `VALIDATION_SCHEMAS`                    |
| All schema changes              | `systems/spellslots/version-migration.js`  | single 3.0.0 migration entry                                      |

---

## Sources

- Direct codebase analysis: `loader.js`, `build.py`, `core/data.js`, `core/config.js`,
  `systems/tab-registry.js`, `systems/spellslots/version-migration.js`, `features/initiative.js`,
  `features/random-tables.js`, `features/encounters/monster-templates.js`,
  `systems/spellslots/pwa-install.js`, `core/init.js`, `sw.js`, `features/party/party-render.js`
- `.planning/codebase/ARCHITECTURE.md` (authoritative system map, 2026-06-11)
- `.planning/codebase/STRUCTURE.md` (directory layout + module insertion rules, 2026-06-11)
- `.planning/codebase/CONVENTIONS.md` (coding patterns + build constraints, 2026-06-11)
- `.planning/PROJECT.md` (planned features + constraints, 2026-06-11)

---

_Architecture research for: D&D Kampagnen-Tracker Pro — Stabilisierung und Ausbau_
_Researched: 2026-06-11_
