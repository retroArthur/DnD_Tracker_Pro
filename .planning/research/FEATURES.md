# Feature Research

**Domain:** Offline solo-DM campaign manager (D&D 5e, single-page app, German UI)
**Researched:** 2026-06-11
**Confidence:** HIGH (core features), MEDIUM (edge-case scoping)

---

## Context: This Is a Brownfield Milestone

The app already ships: party management, NPCs, locations, quests, wiki, session notes, encounters + balance calculator, initiative tracker (death saves, concentration, AoE, quick actions), SRD spell DB + spell slots, loot + distribution, shops + handout export, dice roller + random tables, DM screen (21 widgets), multi-campaign, global fuzzy search, undo/redo, auto-backups, calendar, timers.

The planned features below are **grouped by the milestone buckets** from PROJECT.md. "Table Stakes" = expected by DMs who already use the app; "Differentiators" = competitive edge; "Anti-Features" = explicitly out of scope or harmful if included.

---

## Feature Landscape

### Group B — Tech Foundation

#### PWA Install (Installierbare App)

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Service Worker + manifest | Every modern installable web app has this; fixes `file://` origin-isolation issues | MEDIUM | `file://` cannot use cookies, clipboard write, or FileSystem API — HTTPS origin via PWA unlocks all of these |
| Offline-first caching (app shell) | App already works offline but PWA cache is more reliable than `file://` double-click | MEDIUM | Cache API + SW install event; existing SW (`sw.js`) already partially implements this |
| Home-screen / Start-menu install prompt | Users expect "install" button after visiting HTTPS origin; solves "where is the file?" problem | LOW | `beforeinstallprompt` event; show custom button in header |
| App icon + splash screen | Installed apps need icon; feels like a real tool, not a dev experiment | LOW | 192×192 and 512×512 PNG; maskable variant |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| File System Access API for JSON backup | After PWA install on Chromium, app can write directly to a chosen folder on disk — no download dialog every time | MEDIUM | `showSaveFilePicker` / `showOpenFilePicker`; Chromium-only but that is the target platform. Degrades gracefully to blob-download |
| Background sync for IndexedDB | Ensures pending writes flush even if user closes tab mid-session | MEDIUM | Requires HTTPS origin (PWA provides this) |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Push notifications | "Remind me to prep the session" | Requires backend; offline app has no server to push from; distracts at table | Timer + session-prep checklist covers the use case |
| Cloud sync | "Access on any device" | Requires server, auth, conflict resolution — antithetical to offline-first constraint | File backup export to Dropbox/OneDrive via OS is the user's responsibility |

---

#### Datei-Backup-Sync (File Backup to Disk)

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Manual export to JSON file (download) | Already exists as import/export; expected to work reliably | LOW | Wrap `D` object → JSON → blob download; already partially implemented |
| Auto-export to user-chosen folder (File System API) | Power users want "auto-save to Dropbox folder" without clicking every time | MEDIUM | Requires HTTPS origin (= PWA milestone must come first); `FileSystemFileHandle` stored in IndexedDB across sessions |
| Import from JSON file | Restoring a backup is table stakes | LOW | Already exists; verify it survives app restarts |
| Backup naming with timestamp + campaign name | DMs manage multiple campaigns and need to tell backups apart | LOW | `DnD-Tracker_MyCampaign_2026-06-11.json` |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Scheduled auto-backup (every N minutes to chosen folder) | Never lose a session again even if browser crashes | MEDIUM | Depends on File System API + PWA; fallback is periodic download prompt |
| Incremental backup indicator in UI | Reassurance that data is safe; reduces anxiety | LOW | Subtle last-saved timestamp in header |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Google Drive / OneDrive direct integration | "One-click cloud backup" | Requires OAuth, API keys, network — breaks offline constraint | User saves backup file to a synced folder (Dropbox, OneDrive) via OS |

---

#### Command Palette (Strg+K)

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Open with Ctrl+K (currently: global search) | VS Code, Figma, Notion, Linear all use Ctrl+K for command palette; user expects action execution, not just search | LOW | Current Ctrl+K opens global search (find entities); palette replaces/extends this |
| Fuzzy-filter commands by name | Type "würfel" → shows "D20 würfeln", "Würfel-Statistiken öffnen" | LOW | Reuse existing fuzzy-match from `global-search.js` |
| Execute actions, not just navigate | "Neue Initiative", "Kurze Rast", "Undo", "Export" — directly callable | MEDIUM | Actions map to existing `data-action` handlers; palette is a new front-end for them |
| Keyboard-only navigation (arrow keys + Enter) | Power users never want to touch the mouse | LOW | Standard pattern; implement with focus management |
| Recent commands (last 5) | Most-used commands bubble to top | LOW | Stored in sessionStorage; lost on page reload is fine |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Context-aware commands | On initiative tab: "Nächster Zug", "Schaden anwenden" appear at top | MEDIUM | Check `currentView` when populating command list |
| Navigate to any entity by name | "Gandalf" → jumps to that NPC — extends current search behavior | LOW | Pipe existing global search results into palette |
| Command shortcuts shown inline | Shows keyboard shortcut next to command if one exists | LOW | Documentation in palette drives discoverability |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Scripting / macro system | "Let me automate dice chains" | Huge scope; security concerns (eval); this is a tracker, not a scripting engine | Pre-defined quick actions + dice favorites cover 90% of cases |

---

### Group C — DM Features

#### Monster-Kompendium / Bestiary

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Offline SRD monster list (400+ creatures) | Any DM tool needs creature reference; manually typing HP/AC/CR every session is a dealbreaker | MEDIUM | JSON source exists (github.com/tkfu/9819e4ac6d529e225e9fc58b358c3479); needs localization review (EN names are acceptable for SRD) |
| Filter by CR, type, size | Core search need: "CR 5 undead" | LOW | Reuse pattern from spell filter (single-pass multi-filter) |
| Full statblock display | AC, HP, speed, ability scores (+ modifiers), saving throws, skills, senses, resistances/immunities, actions, legendary actions | MEDIUM | Render function; statblock has well-established visual format from D&D Beyond/SRD |
| Add to encounter / initiative directly | DMs expect one-click "add this monster to combat" | LOW | Wire to existing encounter + initiative add flow |
| Custom creature creation | DMs brew their own monsters; expected in any non-trivial tracker | MEDIUM | Form with all statblock fields; saves to `D.customCreatures[]` |
| Edit custom creatures | Without edit, custom creatures are write-once trash | LOW | Reuse statblock form with pre-filled values |
| Search by name | Fastest lookup; must be instant (<100ms) | LOW | Filter on keydown; 400 monsters is trivially fast |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| CR-to-encounter balance integration | Statblock shows "add to encounter and recalc XP budget" button | LOW | Existing encounter-calculator.js handles math; just wire the button |
| Import creature from JSON/text paste | Copy from D&D Beyond or Homebrewery into a text field; parser extracts fields | HIGH | Natural language parsing is fragile; structured JSON import is realistic |
| Favorite / tag creatures | "Bosses", "Forest creatures" — personal organization | LOW | Array of tags on `D.customCreatures` entries |
| Monster usage history | "You've used Owlbear 3 times in this campaign" — fun flavor | LOW | Append encounter IDs to creature entries |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Full non-SRD monster database (all published books) | "I want every monster from every book" | Copyright; legal risk; file size | User creates custom creatures for non-SRD monsters |
| Real-time monster lookup from D&D Beyond API | "Auto-import any monster by name" | Requires network + API key + rate limiting; breaks offline constraint | JSON import covers the import workflow |
| AI-generated monsters | "Generate a CR 7 shadow demon variant" | Requires API call; out of scope for offline tool | Custom creature form + NPC generator (separate feature) |

---

#### Statblock-Popup in der Initiative

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Click combatant name → see full statblock | DMs constantly need to reference monster stats mid-combat; leaving initiative to check bestiary breaks flow | LOW | Modal overlay; data comes from bestiary if linked, or from combatant's stored snapshot |
| Show HP/AC/speed/abilities/skills in popup | Minimum viable statblock for combat reference | LOW | Subset of full bestiary statblock display |
| Show actions + descriptions | "What does Multiattack do?" must be one click away | LOW | Render `actions[]` array from statblock |
| Statblock snapshot stored with combatant | If monster is edited mid-campaign, existing encounters should not change | MEDIUM | Deep-clone statblock into `combatant.statblockSnapshot` at add-time |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Inline HP editable from popup | DM can click HP, type damage, without closing popup | LOW | Wire to existing hp-calculator.js |
| Link to bestiary entry for full editing | "Edit this creature" button in popup | LOW | Navigate to bestiary tab with creature pre-selected |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Token/mini art display in popup | "I want the monster picture" | URL-based image loading requires internet for most assets; adds complexity | Avatar system already supports URL images; user can add manually |

**Dependency:** Requires Bestiary data model to be defined first.

---

#### Legendäre Aktionen & Resistenzen Tracker

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Legendary action counter (0/3 remaining) | Standard D&D 5e mechanic; clicking dots like death saves is the established UI pattern (FeyWorks, Simbul's Creature Aide) | LOW | 3 clickable orbs per legendary-creature combatant; auto-reset on creature's turn start |
| Legendary resistance counter (0/3 remaining) | DMs forget how many resistances a boss has used; must be visible without consulting statblock | LOW | Same orb pattern; reset on long rest / end of encounter |
| Auto-detect legendary creatures from statblock | If statblock has `legendaryActions > 0`, show the UI automatically | LOW | Check field on `combatant.statblockSnapshot` |
| Manual toggle (for custom/non-statblock creatures) | DM may add a custom boss without a full statblock | LOW | Toggle in combatant settings |
| Visual indicator in initiative list | Legendary orbs visible at-a-glance without opening popup | LOW | Inline in combatant row, like existing condition badges |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Lair action reminder at Initiative 20 | Auto-shows "Lair action available" banner when round reaches init 20 | LOW | Already partially exists in encounter-calculator.js's battlefield banner; extend to legendary creatures |
| Per-action tracking (which actions spent) | "Used Tail Swipe, Wing Attack remaining" | MEDIUM | Store action names from statblock; click to mark spent |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Auto-resolve legendary actions (roll attacks) | "Just auto-play the boss turn" | Removes DM agency; tactics are the DM's creative space | One-click rolls for individual attacks is sufficient |

**Dependency:** Strongly enhanced by Statblock popup (populates action names); works without it using generic orbs.

---

#### Mob- / Massenkampf-Modus

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Group multiple identical enemies under one initiative row | 10 goblins as "Goblins ×10" instead of 10 separate rows | LOW | `combatant.count` field; existing row can show count badge |
| Group HP pool OR per-individual tracking | DMs need choice: pool (fast) vs. individual (precise) | MEDIUM | Toggle on group: `hpMode: "pool" | "individual"` |
| Mob damage table (DMG p.250) | How many of a mob hit? The standard DMG table saves time | LOW | Pre-computed lookup: (AC - attackBonus) → fraction of mob that hits; render as reference in initiative toolbar |
| Remove individuals as they die | When one goblin drops, count decrements; if individual mode, cross it out | LOW | Decrement `count` on death; individual mode tracks per-index HP |
| Group saves / group concentration | Roll once for the group vs. rolling 10 times | LOW | "Group save" button → single roll applied to all |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Mob damage calculator inline | "8 goblins attack, AC 15, +4 bonus → 3 hit" computed on-screen | LOW | Implement Sly Flourish mob calculator (slyflourish.com/mob_calculator.html) as widget or inline tool |
| Split mob into subgroups | "Goblins ×10" → "Goblins A ×5, Goblins B ×5" (different positions) | MEDIUM | Rare use case; defer to v2 |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Full mass combat system (armies, units) | "Run a war" | Completely different game system; scope explosion | The mob mode covers 5e DM needs; armies are a different module |
| Automatic mob AI (behavior trees) | "Boss controls its minions automatically" | Removes DM creativity; enormous scope | DM decides mob tactics; tool tracks state only |

**Dependency:** Independent feature; enhanced by Bestiary (can auto-populate group stats from creature).

---

#### Soundboard (Lokale Audio-Dateien)

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Load local audio files (MP3, OGG, WAV) | `file://` or PWA context can read local files via `<input type="file">`; DMs bring their own music | LOW | File input → ArrayBuffer → Web Audio API or `<audio>` element |
| Play / pause / stop per track | Basic transport controls | LOW | Standard `<audio>` API |
| Volume control per track | Different tracks (music vs. ambience vs. SFX) need independent volumes | LOW | `<audio>.volume` property |
| Looping for ambient tracks | Dungeon atmosphere should loop seamlessly | LOW | `<audio>.loop = true`; use Web Audio API for gapless loop |
| Sound categories (Musik / Ambience / SFX) | DMs organize sounds by type | LOW | Tag/category field on each sound entry |
| Keyboard shortcuts for quick trigger | DM should not mouse-hunt for the tavern loop during play | LOW | User-assignable hotkeys (F1–F12 or number pad) |
| Persist loaded sound list across sessions | Re-loading 20 files every session is painful | MEDIUM | File handles cannot persist (security); store file names + let user re-authorize via File API picker on reload. IndexedDB can store ArrayBuffers but size limits apply |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Simultaneous multi-layer playback (music + ambience + SFX) | Standard DM soundboard pattern (AmbientDM, Syrinscape) | LOW | 3 independent `<audio>` elements; independent volume |
| Fade-in / fade-out transitions | Prevents jarring cuts during tense scenes | MEDIUM | Web Audio API `GainNode` ramp; not achievable with basic `<audio>` |
| One-shot SFX board (stingers, crits, spell sounds) | Separate from looping ambient; fire once on button press | LOW | Separate section in UI; no loop mode |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Streaming from Spotify / YouTube | "Use my playlist" | Requires OAuth, breaks offline constraint, licensing issues | User downloads and loads local files |
| Built-in sound library | "Ship 50MB of dungeon sounds with the app" | Bloats single-file build; legal/licensing complexity | DMs use Freesound, Pixabay Audio, or YouTube → download → load |
| AI-generated ambient sound | "Generate a forest soundscape on demand" | Requires API; offline-incompatible | Out of scope for offline tool |

**Dependency:** PWA milestone recommended first (File System API enables better file persistence); works without it via `<input type="file">` re-authorization pattern.

---

#### Session-Prep-Assistent

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Scene cards (Szenenkarten) | Standard prep workflow: 3–5 scenes per session as bullet-pointed cards (SlyFlourish, Lazy DM method) | LOW | Card per scene: title, goal, key NPCs, key location, notes |
| Per-session checklist | DMs forget to prep things; a reusable checklist catches gaps | LOW | Configurable checklist items (not hardcoded) |
| Open threads list | Track unresolved player hooks and dangling plot threads | LOW | Simple tagged list: thread text + status (open/resolved/parked) |
| Link scenes to existing entities | Scene card references NPCs, locations, encounters from existing data | MEDIUM | `entityRef` links to `D.npcs`, `D.locations`, `D.encounters` |
| Session-to-session continuity view | "What happened last session?" summary before writing this session's prep | LOW | Show last session note's summary inline |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Prep completeness indicator | "3/5 scenes filled, 2 open threads unresolved" — visual readiness score | LOW | Computed from card fill state |
| Export session prep as print/handout | DM wants a physical crib sheet | LOW | Already have shop-export.js pattern; adapt for session prep |
| Templates (combat-heavy, social, exploration) | Pre-fill scene structure based on session type | LOW | 3 default templates; user can customize |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Full adventure module builder | "Write a complete published adventure" | WorldAnvil scope; far beyond session prep | Wiki + session notes + prep assistant together cover campaign writing |
| AI session summary generation | "Summarize what happened automatically" | Requires API; offline-incompatible | Session timer auto-records duration; DM writes summary manually |
| Player-visible prep board | "Share my scene cards with players" | Player views are explicitly out of scope | Session notes export (existing feature) covers player handouts |

**Dependency:** Linked entities depend on existing NPC/location/encounter data models (already exist). Open threads enhance existing quest tracking.

---

#### Kampagnen-Timeline

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Chronological event list | Core of any timeline: events in order with in-game date | LOW | `D.timeline = [{ id, date, title, description, entityRefs[] }]` |
| Link events to calendar | "Battle of Weeping Hill happened on 14 Frostmonth, Year 3" | LOW | Store date as calendar reference; display using existing calendar system |
| Link events to entities (NPCs, locations, quests) | "This event involves Gandalf at Helm's Deep" | LOW | `entityRef` array; same pattern as session-prep |
| Chronological sort + in-game date display | Timeline must be browsable in story order, not entry order | LOW | Sort by `date` field; use calendar's date format |
| "Past / Present / Future" tagging | DMs plan upcoming events; future events are prep, not history | LOW | `status: "past" | "present" | "future"` field |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Era/arc grouping | Kanka-style: group events into story arcs ("The Dusk War", "Year of the Serpent") | LOW | `arc` tag on events; group by arc in display |
| Visual timeline scroll (horizontal lane) | World Anvil-style visual; shows parallel events in different locations at same time | HIGH | Canvas or CSS scroll; significant rendering work; defer |
| Auto-populate from session notes | "Add session 7 as a timeline event" button in session notes | LOW | Bridge: take session note date + summary → create timeline entry |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Multi-lane parallel timeline (full World Anvil) | "Show what faction A and faction B were doing simultaneously" | High complexity render; overkill for solo DM at table | Era grouping + entity links achieve similar mental model |
| Public-facing timeline embed | "Show my players the world history" | Player views out of scope | Export as wiki entry |

**Dependency:** Calendar must be working (already exists). Enhanced by factions feature.

---

#### NPC-Generator

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| One-click generation (Name, Persönlichkeit, Marotte) | DMs need instant NPCs when players go off-script; waiting is not an option | LOW | Compose from existing random tables or built-in tables |
| German-localized name tables | App is German UI; "Wilhelm Braunstein" feels right, "Gary" does not | LOW | Maintain separate German name tables (first + last, by culture/race) |
| Personality trait + flaw + ideal + bond (D&D 5e PHB format) | Standard 5e NPC personality framework; DMs expect this | LOW | Random pick from curated tables matching PHB background system |
| Quirk / mannerism | Makes NPCs memorable immediately; most-requested feature per community posts | LOW | Short phrase table: "Hört ständig mit dem Kopf zur Seite zu", "Zieht an einem Ohr beim Denken" |
| Save generated NPC directly to NPC list | Otherwise generation is pointless | LOW | "In NPC-Liste speichern" button; pre-fills NPC form |
| Re-roll individual fields | "Keep the name, re-roll the quirk" | LOW | Per-field re-roll button |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Uses custom Random Tables | If user has created random tables for names/traits, generator can pull from them | LOW | Check `D.randomTables` for tagged tables (tag: "npc-names", "npc-traits") |
| Role/occupation-aware generation | "Generate a guard" vs. "Generate a noble" — personality set matches role | LOW | Role dropdown → filter applicable trait tables |
| Appearance generation (physical description) | "Broad-shouldered, grey-bearded, scar over left eye" | LOW | Simple random sentence compose from appearance tables |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| AI-written NPC backstory paragraphs | "Generate a full character history" | Requires API; offline-incompatible | Bullet-point hooks (motivation, secret, goal) are more useful at table than prose |
| Voice synthesis for NPC dialogue | "Make it speak in character" | Requires Web Speech API or TTS service; accessibility nightmare; huge scope | DM improvises voice; tool gives personality hooks |
| Faction-aware generation | "Generate a faction member with appropriate personality" | Depends on factions feature; defer | Link NPC to faction manually after generation |

**Dependency:** Enhanced by Random Tables (existing). Enhanced by Factions feature (defer linkage).

---

#### Reise- & Wetter-Simulator

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Terrain selection + daily travel distance | 5e DMG travel: slow/normal/fast pace × terrain modifier → km/day | LOW | Lookup table: terrain type × pace → distance; DMs reference this constantly |
| Random encounter check (per 6-hour watch) | Standard hex-crawl workflow; DMs roll to check if encounter occurs | LOW | 4 watches/day; configurable encounter chance per terrain |
| Random encounter table lookup | "Forest, night → roll on forest night table" | LOW | Integrates with existing Random Tables feature; wire terrain tag to table selection |
| Weather generation (per terrain/season) | DMs want atmospheric weather without inventing it | LOW | donjon.bin.sh pattern: terrain + season → weather; implement as local lookup table |
| Foraging + navigation DCs by terrain | 5e DMG table; DMs check this mid-travel | LOW | Static reference table per terrain; show inline |
| Ration consumption tracker | Track how many days of rations the party has | LOW | `D.partyRations` counter; decrement per travel day |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Hex-crawl day journal | Auto-record each day's travel: terrain, weather, distance covered, encounters rolled | MEDIUM | Append to session notes or separate travel log |
| Exhaustion tracker from travel conditions | Hot weather + fast pace → Constitution save prompts | LOW | Pop-up reminder with DC based on conditions; DM decides whether to call for the roll |
| Link to campaign calendar | "Travel Day 1" = in-game date; calendar advances as days pass | MEDIUM | Wire to existing calendar system; user confirms date advancement |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Hex map renderer | "Draw my travel map visually" | Mindmap/Network was removed; map rendering is huge scope | Locations (existing) + text-based travel log |
| Full survival simulation (temperature, water, shelter) | "Simulate realistic wilderness" | Scope explosion; breaks flow at table; most DMs abstract this | Weather generation + ration tracker cover the key DM prompts |
| Pre-populated encounter tables for every terrain | "Built-in forest encounters, arctic encounters, etc." | Legal (SRD encounter tables are sparse), maintenance burden | Default "use your random tables" + user populates terrain-tagged tables |

**Dependency:** Random Tables (existing) wired for terrain encounter lookups. Calendar (existing) for day tracking. Enhanced by Session Prep assistant.

---

#### Fraktionen & Ruf-System

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Faction list with name, description, goals | Basic faction tracking; DMs manage 3–8 factions in a typical campaign | LOW | `D.factions = [{ id, name, description, goals, icon }]` |
| Reputation score per faction (-3 to +3 or 0–100) | Standard pattern across all trackers; visual meter | LOW | Integer value + color-coded bar (hostile/neutral/friendly/ally) |
| Reputation change log | DMs forget what changed reputation; log entries like "Saved the mayor → +1 with Merchants Guild" | LOW | `faction.log = [{ date, delta, reason }]` |
| Link NPCs to factions | "Elara is a member of the Thieves' Guild" | LOW | `npc.factionId` reference; show faction badge on NPC card |
| Party-wide vs. per-character reputation | Simple solo-DM use: one reputation score for the whole party | LOW | Start party-wide; per-character is a differentiator |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Faction relationship matrix | Show how factions relate to each other (ally/rival/neutral) | MEDIUM | `faction.relations = [{ targetId, status }]`; render as simple table |
| Faction goals tracker | "The Merchants Guild wants to control the harbor" — checkable goals | LOW | `faction.goals = [{ text, achieved }]` |
| Per-character reputation (different standings) | Rogue has good standing with Thieves Guild, Paladin does not | MEDIUM | `D.characters[].factionStandings = { factionId: score }` |
| Reputation-triggered narrative prompts | "Reputation with City Watch drops to -2 → guards are now hostile" | LOW | Threshold alerts: show banner when reputation crosses defined levels |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Faction AI / political simulation | "Factions pursue goals autonomously between sessions" | Enormous scope; deterministic simulation of political dynamics | DM updates faction goals manually; tool tracks state |
| Faction combat resolution | "Factions go to war; simulate the battle" | Separate mass combat system territory | Mob combat mode + DM narration |

**Dependency:** NPCs (existing). Enhanced by Timeline (faction events). Enhanced by Campaign Timeline.

---

### Group D — Player-Facing Tracking (DM-managed)

#### XP- / Milestone-Tracker

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| XP tracking per character | Award XP from encounters, roleplaying, milestones; cumulative total | LOW | `character.xp` field; already has `character.level` |
| XP thresholds per level (standard 5e table) | "Need 6,500 XP for level 5" must be built in | LOW | Hardcoded 20-row table; never changes in 5e 2014 |
| Level-up prompt when threshold crossed | "Korrigan hat Level 5 erreicht!" notification | LOW | Check after XP award; show toast/modal |
| Milestone toggle (disable XP, use narrative leveling) | Many DMs use milestones over XP; the toggle is expected | LOW | `D.settings.progressionMode: "xp" | "milestone"` |
| Manual level-up button (milestone mode) | In milestone mode, DM clicks "Level up" for the whole party | LOW | Increment `character.level` for selected characters |
| Party XP split from encounters | "Encounter gave 1,200 XP → 300 each for 4 characters" | LOW | Wire to existing encounter XP calculator |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| XP history log | "5th session: 800 XP from cave trolls" — reviewable history | LOW | Append to `character.xpLog = [{ date, amount, source }]` |
| Session XP summary | End-of-session recap: total XP awarded, current standings | LOW | Computed from `xpLog` entries since last session |
| Proficiency bonus display | Auto-computed from level; shown on character card | LOW | `Math.ceil(character.level / 4) + 1`; static formula |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Automated encounter XP calculation with all monster variants | "Calculate XP for this specific encounter automatically" | Bestiary integration makes this possible but adds coupling | Encounter calculator (existing) already handles this; just pipe the result |
| Multiclass XP tracking | "Paladin 3 / Sorcerer 2 advancement" | Multiclass uses same total XP threshold; only level split matters | Store total level; player manages class split |

**Dependency:** Encounter calculator (existing) for XP award. Bestiary (for monster CR → XP lookup).

---

#### Inspiration-Tracker

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Inspiration toggle per character (have / don't have) | 5e inspiration is binary: you have it or you don't | LOW | Boolean `character.hasInspiration`; single click to toggle |
| Visual indicator on character card | DMs forget who has inspiration; must be visible at-a-glance | LOW | Star or badge on existing party card |
| Quick award from initiative view | Most inspirations are awarded during combat | LOW | Button on combatant row or quick-action in initiative |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Inspiration reason log | "Awarded for great roleplay in the tavern scene" | LOW | Optional freetext when awarding; stored in `character.inspirationLog` |
| Multiple inspiration points (house rule) | Some DMs use pools of 2–3 | LOW | `character.inspiration` as integer; max configurable in settings |
| Inspiration economy summary | "Awarded 4 this session, used 2" — session recap | LOW | Session log annotation |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Player self-service inspiration award | "Let players award each other inspiration" | Player accounts/views are explicitly out of scope | DM manages all awards; fastest at-table workflow anyway |

**Dependency:** None. Independent; trivially small. Can be added to existing character card in party feature.

---

#### Erweiterte Charakterbögen (Extended Character Sheets)

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Skill list with modifiers (all 18 skills) | DMs constantly ask "what's your Perception?" — DM needs quick reference | LOW | Compute from `character.ability scores + proficiency bonus + skill proficiencies`; display read-only |
| Saving throw modifiers (all 6) | "Constitution save — what's your modifier?" | LOW | Same pattern; proficiency from class |
| Attack entries (weapon + spell attacks) | "Roll to hit with Longsword" — DM needs to verify player math or roll for them | LOW | `character.attacks = [{ name, attackBonus, damageDice, damageBonus }]` |
| Passive Perception (already in party overview) | Already shown in Party Overview widget; needs to be on character sheet too | LOW | `10 + WIS modifier + proficiency if proficient` |
| Class + subclass display | DM needs to know what abilities the character has available | LOW | `character.class`, `character.subclass` fields (may already exist) |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Quick DC check button | "Korrigan makes a Stealth check" → rolls `1d20 + character.stealth modifier` | LOW | Wire to dice roller; one button per skill |
| Proficiency checkboxes editable | DM can grant/change proficiencies without full edit modal | LOW | In-place toggle on skill row |
| Equipment / armor source display | "AC 16 (Chain Mail + Shield)" — DM needs to understand AC breakdown | LOW | `character.armorSource` freetext or structured field |
| Feature / trait list | "Rage", "Bardic Inspiration", "Sneak Attack" — class features as reference | MEDIUM | `character.features = [{ name, description }]`; high data entry burden; make optional |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Full digital character sheet (replaces paper) | "I want to manage my whole character here" | Full character management (spell slots, equipment weight, carrying capacity, hit dice, detailed class features) is D&D Beyond's core product | The DM tool focuses on what the DM needs to know, not player self-management; existing party cards + rest manager cover DM needs |
| Automatic ability score calculation from race/class | "Generate a level 3 fighter" | Character creation wizard scope; DM enters numbers, not generates characters | Character creation is player's job; DM just tracks what matters in play |
| Spell list management per character | "Manage all known spells" | Spell system is complex; D&D Beyond does this better | Spell slots (existing) track resource; character can note spells in description field |

**Dependency:** Existing party character model (`D.characters`). Proficiency bonus from level (XP/Milestone tracker adds this explicitly). Quick DC check wires to existing dice roller.

---

### Group E — Tech UX

#### Würfel-Statistiken (Dice Statistics)

**Table Stakes**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Roll history per session (already partially exists) | Existing dice panel shows last 5 rolls; statistics require a longer history | LOW | Extend existing `D.diceHistory[]` to persist per-session |
| Total rolls count | "I rolled 87 times this session" — baseline stat | LOW | `diceHistory.length` |
| Crit / crit-fail count (natural 20 / natural 1 on d20) | Most-requested dice stat; "is the dice cursed?" | LOW | Filter `diceHistory` for d20 results = 20 or 1 |
| Average roll per die type | "My d20 average is 9.3 (slightly below expected 10.5)" | LOW | Group by die type, compute mean |

**Differentiators**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Bar chart / histogram visualization | Visual distribution: is the d20 actually flat? | MEDIUM | SVG bar chart; no external charting library needed for simple histogram; 20 bars for d20 is manageable |
| Per-session vs. campaign-wide stats | "This session vs. all time" toggle | LOW | Filter `diceHistory` by session date |
| "Luckiest roll" highlight | "Natural 20 on the dragon's death save" with timestamp | LOW | Max roll from history with context |
| Expected vs. actual comparison | Show flat distribution line against actual rolls | MEDIUM | Requires enough rolls (100+) to be meaningful; show disclaimer for small samples |

**Anti-Features**

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Physical dice tracker (scan dice with camera) | "Track my real dice" | Camera API + computer vision; enormous scope; offline-incompatible | Not in scope; this tracks digital rolls only |
| Statistical significance testing | "Prove my dice are unfair" | Requires 1,000+ rolls for meaningful chi-square test; misleading for typical session sizes | Show sample size warning; let user interpret |
| Animated 3D dice visualization | "Show me a spinning die" | Pure eye candy; adds render complexity | Existing flat dice panel UI is fast and functional |

**Dependency:** Existing dice roller + `D.diceHistory`. No other dependencies.

---

## Feature Dependencies

```
PWA Install
    └──enables──> File System API (required for auto-backup to disk)
    └──enables──> Background Sync
    └──enables──> Full Offline Reliability

Bestiary (Monster Compendium)
    └──enables──> Statblock Popup in Initiative
    └──enables──> Legendary Actions Auto-detection
    └──enables──> Mob Mode auto-populate from creature
    └──enables──> XP award from encounter (CR → XP lookup)

Random Tables (existing)
    └──used-by──> NPC Generator (name/trait tables)
    └──used-by──> Travel Simulator (terrain encounter tables)

Calendar (existing)
    └──used-by──> Campaign Timeline (event dates)
    └──used-by──> Travel Simulator (day advancement)

Factions
    └──enhances──> NPC Generator (faction membership)
    └──enhances──> Campaign Timeline (faction events)
    └──enhances──> Reputation visible on NPC cards

Session Notes (existing)
    └──enhances──> Session Prep Assistant (last session summary)
    └──enhances──> Campaign Timeline (auto-populate events)

Encounters / Encounter Calculator (existing)
    └──enhances──> XP Tracker (award XP from encounter result)
    └──enhances──> Mob Mode (encounter calculator balance)

Party Characters (existing)
    └──extended-by──> XP/Milestone Tracker (xp field)
    └──extended-by──> Inspiration Tracker (inspiration field)
    └──extended-by──> Extended Character Sheets (skills/saves/attacks)

Dice Roller (existing)
    └──extended-by──> Dice Statistics (longer history, visualization)
    └──used-by──> Extended Character Sheets (quick DC check button)
```

### Dependency Notes

- **Statblock Popup requires Bestiary:** The popup needs a statblock data model to display; without Bestiary, it can only show the fields already stored on the combatant (HP, AC, name).
- **File Backup Sync benefits from PWA:** Auto-export to a fixed disk path requires File System Access API, which requires HTTPS origin. Without PWA, only manual download export is possible.
- **Travel Simulator builds on Random Tables:** Terrain-based encounter rolls must map to user-created or default Random Tables. The feature works best when DMs have pre-made terrain encounter tables.
- **NPC Generator + Random Tables:** Generator is functional with built-in tables but is significantly more powerful when user's custom tables (tagged `npc-names`, `npc-traits`) are available.
- **Command Palette depends on nothing:** It is a UI layer over existing actions; can be built at any time.

---

## MVP Definition (for This Milestone)

This is a brownfield milestone, not a greenfield launch. "MVP" here means: minimum for each feature to feel complete, not minimum to ship.

### Phase B — Tech Foundation (Ship Together)

- [ ] PWA manifest + service worker — required for file backup to be fully functional
- [ ] File backup sync (download + File System API with Chromium fallback)
- [ ] Command palette — highest DX value, lowest implementation cost

### Phase C — Combat First (Highest Table Impact)

- [ ] Bestiary (SRD JSON data + filter/search + display)
- [ ] Statblock popup in initiative (depends on Bestiary data model)
- [ ] Legendary actions + resistances tracker (small effort, high payoff during boss fights)
- [ ] Mob mode (group initiative rows — common session need)

### Phase C — Story Tools (After Combat)

- [ ] Session prep assistant (scene cards + open threads)
- [ ] NPC generator (instant NPCs for off-script moments)
- [ ] Campaign timeline (passive record-keeping)
- [ ] Travel + weather simulator
- [ ] Factions + reputation

### Phase D — Player Tracking (Small Surface, High Frequency)

- [ ] Inspiration tracker (trivially small; wire to party cards)
- [ ] XP / milestone tracker (extends existing character model)
- [ ] Extended character sheets (skills / saves / attacks for quick DC checks)

### Phase E — Analytics / UX Polish

- [ ] Dice statistics (nice-to-have; extends existing dice history)
- [ ] Soundboard (independent; medium complexity; not session-critical)

### Defer to v2+

- [ ] Faction relationship matrix (visual) — table-display is sufficient for v1
- [ ] Visual timeline horizontal scroll — list view is sufficient for v1
- [ ] Per-character faction reputation — party-wide is sufficient for v1
- [ ] Fade-in/fade-out audio transitions — basic play/pause is sufficient for v1

---

## Feature Prioritization Matrix

| Feature | User Value at Table | Implementation Cost | Priority |
|---------|--------------------|--------------------|----------|
| PWA Install | HIGH (solves file:// limits) | MEDIUM | P1 |
| File Backup Sync | HIGH (data safety) | LOW-MEDIUM | P1 |
| Command Palette | MEDIUM (power-user DX) | LOW | P1 |
| Bestiary | HIGH (constant lookup) | MEDIUM | P1 |
| Statblock Popup | HIGH (mid-combat reference) | LOW (depends on Bestiary) | P1 |
| Legendary Actions Tracker | HIGH (boss fights) | LOW | P1 |
| Mob Mode | MEDIUM (common encounter type) | MEDIUM | P1 |
| Session Prep Assistant | HIGH (pre-session workflow) | LOW | P2 |
| NPC Generator | HIGH (off-script improvisation) | LOW | P2 |
| XP / Milestone Tracker | MEDIUM (end of session) | LOW | P2 |
| Inspiration Tracker | MEDIUM (frequent award) | LOW | P2 |
| Extended Character Sheets | MEDIUM (quick DC reference) | LOW | P2 |
| Campaign Timeline | MEDIUM (passive record) | LOW | P2 |
| Travel & Weather Simulator | MEDIUM (exploration sessions) | LOW-MEDIUM | P2 |
| Factions & Reputation | MEDIUM (political campaigns) | LOW | P2 |
| Dice Statistics | LOW (curiosity) | MEDIUM | P3 |
| Soundboard | LOW-MEDIUM (atmosphere) | MEDIUM | P3 |

**Priority key:**
- P1: Must have in next milestone for core DM workflow
- P2: Should have; adds significant value without high risk
- P3: Nice to have; defer until P1 + P2 are stable

---

## Competitor Feature Analysis

| Feature | Improved Initiative | FeyWorks Combat Tracker | Kanka / World Anvil | Our Approach |
|---------|--------------------|--------------------|--------------------|----|
| Bestiary / statblock | SRD statblocks, no offline | SRD + homebrew, online | Not combat-focused | Bundled SRD JSON, fully offline |
| Legendary actions | Basic (manual) | LA orbs with auto-reset | N/A | Orbs + auto-reset on turn start |
| Mob mode | Group initiative | Not documented | N/A | Group rows + pool HP + mob damage table |
| Timeline | Not included | Not included | Full timeline tool (online, server) | Local list + calendar link, offline |
| Factions | Not included | Not included | Full faction system (online) | Lightweight reputation tracker, offline |
| Session prep | Not included | Not included | Scene/article system (heavy) | Scene cards + checklists (lightweight) |
| NPC generator | Not included | Not included | Third-party tools linked | Built-in table-based generator |
| Audio | Not included | Not included | Not included | Local file soundboard (no streaming) |
| PWA | Web app only | Web app only | Web app only | Installable PWA, truly offline |
| Command palette | Not included | Not included | Not included | Ctrl+K action palette |

---

## Sources

- [FeyWorks Ultimate Combat Tracker](https://www.feyworks.co.uk/pages/ultimate-d-d-5e-combat-tracker) — legendary action orbs, mob tracking patterns
- [Simbul's Creature Aide (Foundry VTT)](https://github.com/vtt-lair/simbuls-creature-aide) — legendary action auto-reset workflow
- [Improved Initiative / dm.tools/tracker](https://dm.tools/tracker) — initiative + statblock patterns
- [Kanka Features](https://kanka.io/features) — timeline, faction, relationship system design
- [World Anvil Timelines](https://www.worldanvil.com/features/timelines) — timeline era/lane design
- [SlyFlourish Mob Calculator](https://slyflourish.com/mob_calculator.html) — mob damage table pattern
- [SlyFlourish Session Prep Template](https://slyflourish.com/rotldm_template.html) — scene card / open threads workflow
- [D&D 5e SRD Monster JSON](https://gist.github.com/tkfu/9819e4ac6d529e225e9fc58b358c3479) — bestiary data source
- [Kassoon Wilderness Travel](https://www.kassoon.com/dnd/wilderness-travel/) — travel terrain table patterns
- [donjon Random Weather](https://donjon.bin.sh/d20/weather/) — weather generation patterns
- [Chrome File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access) — file backup implementation
- [MDN Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) — PWA service worker patterns
- [Tabletop Arc NPC Generators](https://tabletoparc.com/resources/npc-generators-for-dnd) — NPC generator expected features
- [AmbientDM Soundboard](https://apps.apple.com/us/app/ambientdm-soundboard-for-dms/id6760943611) — offline soundboard expected features
- [Command Palette UX Patterns](https://uxpatterns.dev/patterns/advanced/command-palette) — palette design standards
- [D&D Beyond XP vs Milestone](https://dndcommunity.com/xp-vs-milestone-progression/) — progression system patterns
- [The DM Lair Faction System](https://thedmlair.com/blogs/news/new-d-d-pf2e-reputation-and-faction-favor-system) — reputation score design

---

*Feature research for: D&D Kampagnen-Tracker Pro — offline solo-DM campaign manager*
*Researched: 2026-06-11*
