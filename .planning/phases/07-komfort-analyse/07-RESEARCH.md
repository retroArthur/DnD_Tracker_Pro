# Phase 7: Komfort & Analyse — Research

**Researched:** 2026-06-19
**Domain:** Web Audio API, IndexedDB Blob persistence, histogram rendering, dice statistics (Vanilla JS, offline `file://`)
**Confidence:** HIGH (architecture/IDB patterns from codebase), MEDIUM (Web Audio API file:// specifics from docs + inference), HIGH (dice hook — read source directly)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 — Audio persistence via IndexedDB Blob store**
Audio wird in einem eigenen, dedizierten IndexedDB-Blob-Store gespeichert — NIE in `D`, nie in Undo-Snapshots, nie in Exporten. Überlebt Reload und funktioniert vollständig im `file://`-Modus (kein File System Access API). The ROADMAP's older "per-session re-select" wording is superseded by this decision.

**D-01a — Audio library management + size warning**
Per-file size warning (Richtwert >20 MB) + separate "Audio-Bibliothek"-Verwaltung zum Auflisten/Entfernen hinterlegter Dateien. Exact threshold/UX at planner discretion.

**D-02 — Scene = layered looping tracks + crossfade**
Eine Szene = Mix mehrerer gleichzeitig laufender Loop-Spuren (e.g. Regen + Taverne + Feuer), each track with its own volume. Crossfade on scene switch. Loop on by default.

**D-02a — MVP fallback allowed**
Falls D-02 zu groß: eine Loop pro Szene, harter Schnitt — documented als deliberate simplification, same phase.

**D-03 — Keyboard quick-slots for scene switching**
Scene quick-slots must avoid all existing shortcuts. Researcher/Planner chooses free keys.

**D-04 — IndexedDB stats store via addToDiceHistory() hook**
All rolls captured via a central hook in `addToDiceHistory()` (dice-core.js:434) into a dedicated IndexedDB stats store (never in `D`). D-04a: keep the in-memory `diceHistory` as the live list; IndexedDB store is additive/parallel.

**D-05 — d20 histogram + expected overlay + crit/fumble rate + attribution + session filter**
d20-Histogramm (1–20) with 5%-per-side expected-distribution overlay; explicit crit(20)/fumble(1) rate; overall + optional per-character breakdown (unattributable rolls → "Allgemein"); "diese Session / gesamt" filter.

### Claude's Discretion

- Concrete keyboard quick-slot assignment (D-03)
- IndexedDB schema details for both new stores
- Crossfade duration
- Histogram render technique (Canvas/SVG/CSS bars)
- Volume control UI form

### Deferred Ideas (OUT OF SCOPE)

- Audio-Effekt-Trigger an Spielereignisse koppeln (z.B. automatischer Sound bei Crit/Kampfbeginn)
- Würfel-Statistiken exportieren/teilen (CSV/Bild/Handout)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID    | Description                                                                                              | Research Support                                                                                             |
|-------|----------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| UX-01 | Nutzer kann lokale Audio-Dateien als Soundboard nutzen (Ambience-Szenen, Schnelltasten, Lautstärkeregelung) | Web Audio API + IndexedDB Blob store pattern; KeyboardShortcuts extension; Tab-Registry entry for new tab     |
| UX-02 | Nutzer kann Würfel-Statistiken einsehen (Verteilungen, Crit-Quoten aus der Roll-Historie)                 | `addToDiceHistory()` hook at dice-core.js:434; IndexedDB stats store; SVG histogram render pattern           |
</phase_requirements>

---

## Summary

Phase 7 delivers two fully-offline table-side features. Both are largely greenfield code within the established non-ESM architecture.

**Soundboard (UX-01):** The Web Audio API is the correct foundation for layered looping tracks with independent gain control and crossfading. It works under `file://` in Chromium with one known constraint: the `AudioContext` starts in `suspended` state until a user interaction; calling `audioContext.resume()` inside any click handler fixes this transparently. Blobs retrieved from IndexedDB are converted to `ArrayBuffer` via `Blob.arrayBuffer()` (or FileReader), then decoded with `audioContext.decodeAudioData()`. The decoded `AudioBuffer` is played through `AudioBufferSourceNode` with `loop = true` for gapless looping. Per-track volume uses a dedicated `GainNode` between each source and the destination. Crossfade uses `GainNode.gain.linearRampToValueAtTime()` to fade old scene tracks down and new scene tracks up over ~2 seconds. IndexedDB Blob storage works under `file://` in Chromium — the existing codebase already uses IDB Blobs (the `images` store) and runs exclusively in `file://` mode.

**Dice Statistics (UX-02):** The hook point is `addToDiceHistory()` at `features/dice/dice-core.js:434`. Every roll in the app already passes through this single function. A two-line addition writes each roll to an IndexedDB stats store in parallel (D-04a) without touching the live in-memory `diceHistory` array. The d20 histogram is a 1–20 frequency bar chart with an expected-distribution overlay line/markers at 5%. SVG is recommended for this use case: it is accessible via the DOM, works identically in `file://`, and scales cleanly without a canvas resize handler. A 20-bar histogram + overlay SVG is trivial to produce in pure JavaScript via `document.createElementNS`.

**Primary recommendation:** Use Web Audio API with `decodeAudioData` + `AudioBufferSourceNode.loop = true` for audio; add two new IDB object stores (version bump to 4) in `core/init.js:288`; render the histogram as an inline SVG generated from a JS function; hook stats via two lines added to the existing `addToDiceHistory` function.

---

## Architectural Responsibility Map

| Capability                            | Primary Tier           | Secondary Tier         | Rationale                                                                                                   |
|---------------------------------------|------------------------|------------------------|-------------------------------------------------------------------------------------------------------------|
| Audio file import (file picker)       | Browser / Client       | —                      | `<input type="file">` + FileReader/Blob.arrayBuffer() — pure client, no server                              |
| Audio Blob persistence                | Database / Storage     | —                      | IndexedDB dedicated Blob store (D-01); not in `D` or localStorage                                          |
| Audio playback / gain / crossfade     | Browser / Client       | —                      | Web Audio API nodes run entirely in browser; no server needed                                               |
| Scene definition / management         | Browser / Client       | Database / Storage     | Scene metadata (name, track refs, volumes) stored in `D.soundboard` or a thin IDB store; not in Undo       |
| Keyboard quick-slot dispatch          | Browser / Client       | —                      | Extends existing `initKeyboardShortcuts()` in `systems/spellslots/keyboard-shortcuts.js`                    |
| Roll stats capture                    | Browser / Client       | Database / Storage     | Hook into `addToDiceHistory()` writes to IDB stats store in parallel; never in `D`                         |
| Dice statistics query + session filter| Browser / Client       | Database / Storage     | IDB cursor/index over stats store; session filter via stored session ID                                     |
| Histogram rendering                   | Browser / Client       | —                      | Inline SVG generated by a JS render function; no CDN dependency                                             |

---

## Standard Stack

### Core

| Library / API             | Version  | Purpose                                                             | Why Standard                                                                                                                 |
|---------------------------|----------|---------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Web Audio API             | Native   | Layered looping tracks, per-track gain, crossfade                   | Only browser API that supports simultaneous AudioBufferSourceNode instances with independent GainNodes and scheduled ramps    |
| IndexedDB (existing IDB)  | IDB v4   | Blob persistence for audio files + dice stats store                 | Already used in project (`core/init.js:274`); version bump from 3→4 adds two new object stores                              |
| SVG (inline, no library)  | Native   | d20 histogram with 20 bars + expected overlay                       | DOM-accessible, no dependency, zero bytes, file:// safe, resize-trivial at this scale (20 bars)                             |
| `<input type="file">`     | Native   | Audio file selection by the user                                    | The only `file://`-compatible way to get local file access (no File System Access API available under `file://`)             |

### Supporting

| Library / API             | Version  | Purpose                                          | When to Use                                             |
|---------------------------|----------|--------------------------------------------------|---------------------------------------------------------|
| `Blob.arrayBuffer()`      | Native   | Convert IDB Blob → ArrayBuffer for decodeAudioData | Preferred over FileReader; supported in Chromium 76+   |
| `URL.createObjectURL()`   | Native   | Create temporary src URL for `<audio>` preview  | Only needed if doing a quick preview before import; not for main playback path |
| `GainNode`                | Native   | Per-track volume + crossfade gain ramps          | Part of Web Audio API graph; always use                 |
| `AudioBufferSourceNode`   | Native   | Gapless looping audio source                     | Set `.loop = true`; one node per active track           |

### Alternatives Considered

| Instead of           | Could Use                   | Tradeoff                                                                                     |
|----------------------|-----------------------------|----------------------------------------------------------------------------------------------|
| SVG histogram        | Canvas `<canvas>`           | Canvas is fine for this scale but requires manual resize handling and is less accessible; SVG preferred for 20-bar static chart |
| SVG histogram        | CSS flex/div bars           | CSS bars are simplest but adding a precise expected-distribution overlay line on top of div bars requires absolute positioning hacks; SVG cleaner |
| Web Audio API        | `<audio>`/`new Audio()`     | `new Audio()` (as used in timers.js) cannot run multiple simultaneous tracks with independent volume + crossfade; Web Audio API required for D-02 |
| `Blob.arrayBuffer()` | `FileReader.readAsArrayBuffer` | FileReader is callback-based; `Blob.arrayBuffer()` is a clean Promise; both work in Chromium |

**Installation:** No npm packages needed. All APIs are native browser APIs available in Chromium.

---

## Package Legitimacy Audit

> No external packages are installed in this phase. All APIs used are native browser APIs (Web Audio API, IndexedDB, SVG DOM). No package legitimacy audit required.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
User selects audio file (file input)
        |
        v
FileReader / Blob.arrayBuffer()
        |
        v
[IDB Store: "audioBlobs"]  ←──────── IDB v4 (new store in initIndexedDB())
     |                    ──────────→ AudioLibrary UI lists/removes blobs
     |
     v  (on scene activate)
blob.arrayBuffer() → audioContext.decodeAudioData(arrayBuffer)
        |
        v
AudioBufferSourceNode (loop=true)
        |
        v
GainNode (per-track volume)  ←──── volume slider (input[type=range])
        |                           gainNode.gain.value = slider.value
        v
audioContext.destination
        |
(scene switch: linearRampToValueAtTime fade out old, fade in new)

─────────────────────────────────────────────────────────────

User rolls dice (any path)
        |
        v
addToDiceHistory(notation, result, rolls)   [dice-core.js:434]
        |          |
        |          v
        |    [in-memory diceHistory array]  ← unchanged (D-04a)
        |
        v  (new two-line tee)
statsIdbPut({ id, notation, result, rolls, sessionId, timestamp, charId? })
        |
        v
[IDB Store: "diceStats"]  ←──── IDB v4 (new store)
        |
        v  (on stats tab open)
statsIdbGetAll() → filter by session/total → compute histogram counts
        |
        v
renderDiceStatsHistogram() → inline SVG (20 bars + expected line)
renderCritFumbleRates()    → percentage text
renderCharacterBreakdown() → per-character sub-table (optional)
```

### Recommended Project Structure

```
features/soundboard/
├── soundboard-idb.js      # IDB helpers: saveSoundBlob, getSoundBlob, deleteSoundBlob, listSoundBlobs
├── soundboard-player.js   # AudioContext management, scene play/stop, crossfade, GainNode graph
├── soundboard-render.js   # renderSoundboard(), renderAudioLibrary(), renderSceneList()
├── soundboard-crud.js     # Scene CRUD (create/edit/delete scenes, track management)

features/dice-stats/
├── dice-stats-idb.js      # IDB helpers: statsIdbPut, statsIdbGetAll, statsIdbClear
├── dice-stats-render.js   # renderDiceStats(), renderD20Histogram() → SVG, renderCritRates()

systems/spellslots/keyboard-shortcuts.js   # extend initKeyboardShortcuts() for D-03 quick-slots
core/init.js                               # bump IDB_VERSION to 4, add 'audioBlobs' + 'diceStats' stores
assets/templates/view-tools.html           # add #view-soundboard and #view-dicestats <section>s
assets/styles/tools.css                    # soundboard + dice-stats CSS (extend existing tools.css)
ui/actions/system-actions.js               # register soundboard/dicestats data-action handlers
```

### Pattern 1: IndexedDB Blob Store (Audio Files)

**What:** Store raw audio `Blob` objects in a dedicated IDB store keyed by a generated ID.
**When to use:** When persisting binary data that must survive page reload under `file://` without a server.
**How:** In `core/init.js:288` (`onupgradeneeded`), add the new store alongside the existing `fileHandles` store (IDB_VERSION bump from 3 to 4):

```javascript
// Source: core/init.js:288 — onupgradeneeded pattern already used in project
// Add inside the request.onupgradeneeded handler:
if (!db.objectStoreNames.contains('audioBlobs')) {
    db.createObjectStore('audioBlobs', { keyPath: 'id' });
}
if (!db.objectStoreNames.contains('diceStats')) {
    const statsStore = db.createObjectStore('diceStats', { keyPath: 'id', autoIncrement: true });
    statsStore.createIndex('sessionId', 'sessionId', { unique: false });
    statsStore.createIndex('notation', 'notation', { unique: false });
}
// Bump: const IDB_VERSION = 4;
```

**Key rule:** `saveToIndexedDB(storeName, data)` at `core/init.js:318` is the project's generic put helper. Use it for stats records. For blobs, use a thin wrapper that calls `window.idb.transaction(['audioBlobs'], 'readwrite').objectStore('audioBlobs').put(entry)` — same pattern as `saveBackupToIndexedDB()` in `systems/backups.js:88`.

### Pattern 2: Web Audio API — Blob-to-AudioBuffer Pipeline

**What:** Retrieve Blob from IDB → decode → play with GainNode for volume and looping.
**When to use:** Every time a scene track starts playing.

```javascript
// Source: MDN Web Audio API / web.dev/articles/webaudio-intro [VERIFIED: official docs]
async function loadAndPlayTrack(audioBlob, gainNode) {
    // Convert Blob to ArrayBuffer (Chromium 76+, works under file://)
    const arrayBuffer = await audioBlob.arrayBuffer();
    // Decode compressed audio (mp3/ogg/wav) into PCM AudioBuffer
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    // Create source node — must be recreated each time (one-shot nodes)
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;  // gapless — no click/gap at loop point [VERIFIED: MDN AudioBufferSourceNode]
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
    return source; // keep reference to call source.stop() on scene switch
}
```

**AudioContext lifecycle:**
```javascript
// Create ONCE at module level (not per-play)
let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
    // Resume after user gesture — autoplay policy applies even under file://
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
}
// Call getAudioContext() inside any user-initiated action (button click, shortcut handler)
```

### Pattern 3: Crossfade Between Scenes

**What:** Linear gain ramps fade old scene out, new scene in simultaneously.
**When to use:** Scene switch triggered by quick-slot or button click (D-02).

```javascript
// Source: web.dev/articles/webaudio-intro [VERIFIED: official docs]
const CROSSFADE_DURATION = 2; // seconds — at Claude's discretion per D-02

function crossfadeToScene(oldSources, oldGains, newSources, newGains) {
    const now = audioContext.currentTime;
    // Fade out old tracks
    oldGains.forEach(gain => {
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_DURATION);
    });
    // Fade in new tracks
    newGains.forEach(gain => {
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(gain.targetVolume, now + CROSSFADE_DURATION);
    });
    // Stop old sources after crossfade completes
    oldSources.forEach(src => src.stop(now + CROSSFADE_DURATION + 0.1));
}
```

**D-02a MVP fallback pattern** (one loop per scene, hard cut):
```javascript
function hardCutToScene(oldSource, newBlob, gainNode) {
    if (oldSource) oldSource.stop();
    loadAndPlayTrack(newBlob, gainNode);
}
```

### Pattern 4: dice-stats IDB Hook in addToDiceHistory()

**What:** Tee every roll into IndexedDB stats store without changing the live list behaviour.
**Where:** `features/dice/dice-core.js:434` — the `addToDiceHistory` function.

```javascript
// BEFORE (existing, unchanged):
function addToDiceHistory(notation, result, rolls) {
    const dmgType = selectedDamageType ? ` (${selectedDamageType})` : '';
    diceHistory.unshift({ notation: notation + dmgType, result, rolls, time: new Date() });
    if (diceHistory.length > 30) diceHistory.pop();
    renderDiceHistory();
    // ADD THESE TWO LINES (D-04):
    if (typeof window.statsIdbPut === 'function') {
        window.statsIdbPut({ notation, result, rolls, timestamp: Date.now(),
            sessionId: window._currentSessionId || 'default',
            charId: null  // caller may override for attributed rolls
        });
    }
}
```

`_currentSessionId` is a lightweight module-level string set at app boot (`Date.now().toString()` is sufficient — matches "this session" filter scope). It does NOT go into `D`.

**Attribution for per-character breakdown (D-05):**
Character-attributed rolls (from `rollAttrCheck`, `rollCharSave`, `rollSkillCheck`, `rollCharInitiative` in `dice-core.js:538-630`, and from `roll-char-attack-stop` action registered in Phase 6) already include the character name in the `notation` string (e.g. `"Thorin: STR"`). The stats schema should extract `charId` at the call site — or the stats render function can parse notation strings for the "Allgemein" vs per-character split.

Simpler approach: add an optional `charId` parameter to `statsIdbPut` and set it to the character's `D.characters` ID when known, else `null`. The character-attributed roll callsites already look up `ch.id` — so passing it through costs one extra argument per roll.

### Pattern 5: SVG Histogram (d20, 1–20)

**What:** 20-bar frequency histogram with expected-distribution overlay + crit/fumble highlights.
**Why SVG:** DOM-native, no resize listener needed, inspectable in DevTools, works identically under `file://`, trivial with `document.createElementNS`.

```javascript
// Source: standard SVG DOM API [ASSUMED — no Context7 verification this session]
function renderD20Histogram(counts) {
    // counts = Array(20) where counts[i] = rolls showing face (i+1)
    const total = counts.reduce((a, b) => a + b, 0);
    const maxCount = Math.max(...counts, 1);
    const W = 400, H = 180, PADDING = { top: 10, bottom: 30, left: 30, right: 10 };
    const barW = (W - PADDING.left - PADDING.right) / 20;
    const expected = total > 0 ? total / 20 : 0;  // 5% per face

    let bars = '';
    for (let i = 0; i < 20; i++) {
        const face = i + 1;
        const barH = (counts[i] / maxCount) * (H - PADDING.top - PADDING.bottom);
        const x = PADDING.left + i * barW;
        const y = H - PADDING.bottom - barH;
        const isCrit = face === 20;
        const isFumble = face === 1;
        const fill = isCrit ? 'var(--green)' : isFumble ? 'var(--red)' : 'var(--blue)';
        bars += `<rect x="${x}" y="${y}" width="${barW - 1}" height="${barH}" fill="${fill}" opacity="0.8"/>`;
        bars += `<text x="${x + barW/2}" y="${H - PADDING.bottom + 12}" text-anchor="middle"
            font-size="8" fill="var(--text-dim)">${face}</text>`;
    }

    // Expected distribution overlay (horizontal line at expected height)
    const expectedY = H - PADDING.bottom - (expected / maxCount) * (H - PADDING.top - PADDING.bottom);
    const overlayLine = total > 0
        ? `<line x1="${PADDING.left}" y1="${expectedY}" x2="${W - PADDING.right}" y2="${expectedY}"
            stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="4,2"/>`
        : '';

    return `<svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
        role="img" aria-label="d20-Würfelverlauf">${bars}${overlayLine}</svg>`;
}
```

### Anti-Patterns to Avoid

- **Audio in `D` or localStorage:** Never. Audio Blobs are binary, large, and must not appear in Undo snapshots or JSON exports. Violates D-01.
- **`new Audio()` for layered ambience:** `timers.js` uses `new Audio(data:audio/wav;base64,...)` for a single one-shot timer beep. This cannot handle multiple simultaneous looping tracks with independent gain. Use Web Audio API nodes for UX-01.
- **`const audioContext = new AudioContext()` inside a render function:** AudioContext has a per-page limit and is expensive. Create exactly one instance at module level with lazy init.
- **Storing decoded AudioBuffer in IDB:** `AudioBuffer` objects cannot be stored in IndexedDB. Store the raw Blob; decode on every load. This is the intended pattern.
- **Calling `source.start()` twice on the same `AudioBufferSourceNode`:** Each node can only be started once. Create a new node for each play (this is standard Web Audio API design).
- **`const X = window.X` inside functions:** Violates CLAUDE.md dedup rule. Always call `window.audioContext.resume()` directly, not via a local alias.
- **Dice stats in `D` or Undo:** Must be in the dedicated IDB store. Never in `D.diceHistory` persistence path.

---

## Don't Hand-Roll

| Problem                                      | Don't Build                                        | Use Instead                                        | Why                                                                                                          |
|----------------------------------------------|----------------------------------------------------|----------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Gapless audio looping                        | Custom double-buffer splice logic                  | `AudioBufferSourceNode.loop = true`                | Native gapless loop; browser handles sample-accurate wrap-around with no gap                                 |
| Per-track volume control                     | Modifying AudioBuffer PCM values                   | `GainNode.gain.value` or `.setValueAtTime()`       | GainNodes are designed exactly for this; no data mutation needed                                             |
| Smooth volume crossfade                      | `setInterval` polling gain value                   | `GainNode.gain.linearRampToValueAtTime()`          | Scheduled in the audio thread; no main-thread jank, sample-accurate                                         |
| Blob ↔ ArrayBuffer conversion                | Manual byte-by-byte copy                           | `blob.arrayBuffer()` (Promise)                     | Native async API; one line                                                                                   |
| Compressed audio decoding (mp3/ogg/wav)      | Custom decoder                                     | `audioContext.decodeAudioData(arrayBuffer)`        | Browser handles all common formats natively; returns normalized PCM                                          |
| IDB transaction management                   | Custom retry logic                                 | Follow `saveBackupToIndexedDB()` pattern in `systems/backups.js:88` | Already handles oncomplete/onerror; proven in production |

**Key insight:** The Web Audio API's node graph eliminates almost all low-level audio work. Every audio "feature" maps to a node type that already exists.

---

## D-03 Free Keyboard Slot Analysis

**Existing shortcuts (from `systems/spellslots/keyboard-shortcuts.js` — verified by reading source):**

| Key(s)              | Action                                          |
|---------------------|-------------------------------------------------|
| `1`–`9`             | Tab switch (no modifier)                        |
| `R`                 | Quick roll d20                                  |
| `T`                 | Toggle session timer                            |
| `L`                 | Toggle event log                                |
| `N`                 | New element (context) / next turn (initiative)  |
| `P`                 | Previous turn (initiative)                      |
| `Space`             | Next turn (initiative)                          |
| `/`                 | Open Quick Reference                            |
| `?`                 | Keyboard shortcuts overlay                      |
| `Escape`            | Close overlay/modal                             |
| `Strg+Z`            | Undo                                            |
| `Strg+Y`            | Redo                                            |
| `Strg+S`            | Save                                            |
| `Strg+K/F`          | Global search                                   |
| `Strg+Shift+K`      | Command Palette                                 |
| `Strg+.`            | Command Palette (Firefox-alternative)           |
| `Shift+N`           | New round (initiative)                          |
| `Alt+1/2/4/6/8`     | Quick dice rolls (via Alt+digit)                |
| `Delete/Backspace`  | Delete node (network tab, now defunct)          |

**Free modifier+key combinations for scene quick-slots (D-03 recommendation):**

`Ctrl+Alt+1` through `Ctrl+Alt+5` are free (Alt+digits are dice rolls without Ctrl; Ctrl+Alt adds a safe layer). However, on some Windows keyboard layouts `Ctrl+Alt` is equivalent to AltGr — this may interfere with text input. 

**Safer recommendation:** `Alt+Shift+1` through `Alt+Shift+5` — five scene quick-slots.

- `Alt+Shift+1` → activate Scene 1
- `Alt+Shift+2` → activate Scene 2
- `Alt+Shift+3` → activate Scene 3
- `Alt+Shift+4` → activate Scene 4
- `Alt+Shift+5` → activate Scene 5
- `Alt+Shift+0` → stop all audio (mute/unmute toggle)

None of these overlap with any existing handler in `keyboard-shortcuts.js` (verified by reading `systems/spellslots/keyboard-shortcuts.js` lines 1–187). The planner should document the chosen binding in CLAUDE.md's keyboard shortcut table.

**Implementation location:** Add a new block in `initKeyboardShortcuts()` (or in the new soundboard module's own `initSoundboardShortcuts()` function called from `core/init.js`):

```javascript
// In initKeyboardShortcuts() or separate initSoundboardShortcuts():
if (e.altKey && e.shiftKey && e.key >= '0' && e.key <= '5') {
    e.preventDefault();
    const slot = parseInt(e.key);
    if (slot === 0) {
        if (typeof window.toggleSoundboardMute === 'function') window.toggleSoundboardMute();
    } else {
        if (typeof window.activateSoundScene === 'function') window.activateSoundScene(slot - 1);
    }
    return;
}
```

---

## Common Pitfalls

### Pitfall 1: AudioContext suspended at startup (autoplay policy)
**What goes wrong:** `audioContext.state === 'suspended'` on first use; calling `source.start()` silently fails or throws.
**Why it happens:** Chrome's autoplay policy suspends any AudioContext created before user interaction. This applies even under `file://` (confirmed by the Chrome autoplay policy documentation — the policy is page-level, not origin-level).
**How to avoid:** Always call `audioContext.resume()` at the start of any user-initiated action that triggers audio. Use a lazy `getAudioContext()` factory function. Check `audioContext.state` before starting sources.
**Warning signs:** Track appears to start (no error) but no sound. `audioContext.state` is `"suspended"` in DevTools.

### Pitfall 2: AudioBufferSourceNode one-shot semantics
**What goes wrong:** Code calls `source.start()` twice, or tries to reuse a node after `source.stop()`. Throws `InvalidStateError`.
**Why it happens:** Each `AudioBufferSourceNode` can only be played once — by design (Web Audio API spec).
**How to avoid:** Create a new `AudioBufferSourceNode` from the stored `AudioBuffer` for every play. Keep the decoded `AudioBuffer` in memory (per scene); only the source node is recreated.
**Warning signs:** `InvalidStateError: Cannot call start more than once` in console.

### Pitfall 3: IDB version conflict (existing v3 → new v4)
**What goes wrong:** Adding new IDB object stores without bumping `IDB_VERSION` causes `onupgradeneeded` to not fire; stores are missing.
**Why it happens:** `indexedDB.open(name, version)` only calls `onupgradeneeded` when version increases.
**How to avoid:** Change `const IDB_VERSION = 3` to `= 4` at `core/init.js:271`. Add both new stores (`audioBlobs`, `diceStats`) inside the existing `onupgradeneeded` guard blocks.
**Warning signs:** `DOMException: The operation failed because the requested database object could not be found.` when accessing the new stores.

### Pitfall 4: AudioBuffer cannot be serialized to IDB
**What goes wrong:** Storing an `AudioBuffer` object in IndexedDB; throws `DataCloneError`.
**Why it happens:** `AudioBuffer` is a browser-internal object not serializable by the structured clone algorithm.
**How to avoid:** Always store the raw `Blob` (or `ArrayBuffer`) from the file input in IDB. Decode to `AudioBuffer` at runtime after retrieval, and keep the decoded buffer in a module-level Map cache keyed by blob ID to avoid re-decoding on every play.
**Warning signs:** `DataCloneError` on IDB put call.

### Pitfall 5: const/let global scope dedup collision (new modules)
**What goes wrong:** A `const audioContext = new AudioContext()` at the top of `soundboard-player.js` conflicts with any other module that declares `const audioContext` — or with the build dedup system if another module uses `var audioContext = window.audioContext`.
**Why it happens:** The three-pass dedup in `build.py` only protects against certain patterns; global `const` declarations from two modules produce a SyntaxError at parse time.
**How to avoid:** Use a unique module-level variable name: `let _soundboardAudioContext = null;`. Do not export it to `window` unless other modules need it (the only caller is `soundboard-player.js` itself).

### Pitfall 6: diceHistory is `let`, exported to window as a value snapshot
**What goes wrong:** `window.diceHistory = diceHistory` at `dice-core.js:801` exports the array reference at the time of module evaluation. If `diceHistory` were reassigned (e.g. `diceHistory = []`), `window.diceHistory` would still point to the old array.
**Why it matters:** The stats IDB hook wraps the existing `addToDiceHistory` function which pushes to the existing `diceHistory` array (does not reassign). `clearDiceHistory()` does reassign (`diceHistory = []`) — so after a clear, `window.diceHistory` points to the old (now empty) array and the in-memory list is a new array. This is an existing behaviour. The stats IDB hook does NOT rely on `window.diceHistory` — it writes to IDB inside `addToDiceHistory` directly — so this pitfall does not affect Phase 7.

### Pitfall 7: File size warnings — audio Blobs can be large
**What goes wrong:** User imports a 150 MB FLAC file; IDB write saturates quota for the `file://` origin.
**Why it happens:** Under `file://`, all pages share a single origin (`null`). IDB quota for `null`/opaque origins is implementation-defined and may be lower than for named origins (Chromium documentation does not publish a specific limit for `file://`).
**How to avoid:** Enforce D-01a: check `file.size` before storing; warn the user at >20 MB per file; recommend mp3/ogg instead of lossless formats. Optionally display total stored size in the Audio Library UI.

---

## Code Examples

### Loading Audio Blob from IDB and Decoding

```javascript
// Source: MDN BaseAudioContext.decodeAudioData [CITED: developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData]
// + project pattern from systems/backups.js:88 for IDB access

async function getSoundBlob(blobId) {
    await window.initIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = window.idb.transaction(['audioBlobs'], 'readonly');
        const store = tx.objectStore('audioBlobs');
        const req = store.get(blobId);
        req.onsuccess = () => resolve(req.result?.blob || null);
        req.onerror = () => reject(req.error);
    });
}

async function loadTrackBuffer(blobId) {
    const blob = await getSoundBlob(blobId);
    if (!blob) return null;
    const arrayBuffer = await blob.arrayBuffer(); // Chromium 76+ [ASSUMED — no runtime verification]
    const ctx = getAudioContext();
    return ctx.decodeAudioData(arrayBuffer); // Promise<AudioBuffer>
}
```

### Saving Audio Blob to IDB

```javascript
// Source: project pattern from systems/backups.js:88 [VERIFIED: read source]
async function saveSoundBlob(id, file) {
    await window.initIndexedDB();
    return new Promise((resolve, reject) => {
        const entry = { id, name: file.name, size: file.size, type: file.type,
            blob: file, savedAt: Date.now() };
        const tx = window.idb.transaction(['audioBlobs'], 'readwrite');
        const store = tx.objectStore('audioBlobs');
        store.put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
```

### Writing a Roll to the Stats IDB Store

```javascript
// Source: project pattern addToDiceHistory() at dice-core.js:434 [VERIFIED: read source]
// + saveToIndexedDB() at core/init.js:318 [VERIFIED: read source]
function statsIdbPut(record) {
    // Defensive: IDB may not be ready on very first roll
    if (!window.idb) return;
    const tx = window.idb.transaction(['diceStats'], 'readwrite');
    const store = tx.objectStore('diceStats');
    store.add(record); // autoIncrement id
    // No oncomplete needed — fire-and-forget is acceptable for stats
}
window.statsIdbPut = statsIdbPut;
```

### Reading Stats for a Session Filter

```javascript
// Source: project pattern from systems/backups.js:115 (getBackups) [VERIFIED: read source]
async function getStatsForSession(sessionId) {
    await window.initIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = window.idb.transaction(['diceStats'], 'readonly');
        const store = tx.objectStore('diceStats');
        const index = store.index('sessionId');
        const req = index.getAll(sessionId);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
    });
}

async function getAllStats() {
    await window.initIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = window.idb.transaction(['diceStats'], 'readonly');
        const store = tx.objectStore('diceStats');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
    });
}
```

### Computing d20 Histogram Counts

```javascript
// Source: original derivation [ASSUMED]
function computeD20Counts(records) {
    const counts = new Array(20).fill(0);
    records.forEach(r => {
        if (!r.rolls || !Array.isArray(r.rolls)) return;
        r.rolls.forEach(face => {
            if (typeof face === 'number' && face >= 1 && face <= 20) {
                // Only count d20 rolls
                const notation = r.notation || '';
                const isD20 = notation.includes('d20') || notation.includes('D20')
                    || notation === 'Vorteil' || notation === 'Nachteil';
                if (isD20) counts[face - 1]++;
            }
        });
    });
    return counts;
}
```

---

## Runtime State Inventory

> This is a greenfield phase. No rename/refactor/migration involved. The new IDB stores are additive — no existing data is touched.

| Category        | Items Found                                                          | Action Required                                          |
|-----------------|----------------------------------------------------------------------|----------------------------------------------------------|
| Stored data     | Existing IDB stores: campaigns, backups, images, fileHandles (v3)   | IDB_VERSION bump 3→4 adds two new stores; existing stores unchanged |
| Live service config | None                                                             | None                                                     |
| OS-registered state | None                                                            | None                                                     |
| Secrets/env vars | None                                                               | None                                                     |
| Build artifacts | `dist/dnd-tracker-bundled.html` — must be rebuilt after new modules | `PYTHONIOENCODING=utf-8 python build.py` from repo root  |

---

## Environment Availability

| Dependency         | Required By                             | Available | Version   | Fallback                                        |
|--------------------|------------------------------------------|-----------|-----------|--------------------------------------------------|
| Python             | build.py                                | Expected  | 3.x       | —                                                |
| Node.js / npm      | Jest, Playwright                         | Expected  | 20.x      | —                                                |
| Chromium           | E2E tests via Playwright; target browser| ✓         | (any modern) | —                                             |
| Web Audio API      | Soundboard feature (UX-01)              | ✓         | Native in all Chromium versions | —                              |
| IndexedDB          | Audio Blob store + dice stats store     | ✓         | v2+ (project already uses IDB) | —                              |
| `Blob.arrayBuffer()` | Audio decode pipeline                 | ✓         | Chromium 76+ (June 2019+) | FileReader fallback (see below)   |

**`Blob.arrayBuffer()` fallback (if Chromium is very old):**
```javascript
function blobToArrayBuffer(blob) {
    if (blob.arrayBuffer) return blob.arrayBuffer();
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => reject(fr.error);
        fr.readAsArrayBuffer(blob);
    });
}
```

**Missing dependencies with no fallback:** None — all required APIs are native in Chromium.

---

## Validierungs-Architektur

### Test Framework

| Property          | Value                                                                   |
|-------------------|-------------------------------------------------------------------------|
| Framework (unit)  | Jest (jsdom) — `jest.config.cjs`                                        |
| Framework (E2E)   | Playwright (Chromium only) — `playwright.config.js`                     |
| Config file       | `jest.config.cjs` + `playwright.config.js`                              |
| Quick run (unit)  | `npx jest tests/unit/dice-stats.test.js -t "histogram"`                 |
| Full unit suite   | `npm run test`                                                          |
| E2E run           | `PYTHONIOENCODING=utf-8 python build.py && npx playwright test tests/e2e/features/soundboard.spec.js tests/e2e/features/dice-stats.spec.js` |
| E2E baseURL       | `file:///...path.../dist/dnd-tracker-bundled.html` (set in `playwright.config.js:38`) |

### Phase Requirements → Test Map

| Req ID | Behavior                                                        | Test Type | Automated Command                                                       | File Exists? |
|--------|-----------------------------------------------------------------|-----------|-------------------------------------------------------------------------|-------------|
| UX-01a | Audio tab is visible and has scene list UI                      | E2E smoke | `npx playwright test -g "soundboard tab renders"`                       | Wave 0      |
| UX-01b | User can import an audio file, it appears in Audio Library      | E2E       | `npx playwright test -g "import audio file"`                            | Wave 0      |
| UX-01c | Audio persists across page reload (IDB roundtrip)               | E2E       | `npx playwright test -g "audio blob persists after reload"`             | Wave 0      |
| UX-01d | Playing a scene starts audio; stop scene stops audio            | E2E (manual verify only — autoplay needs user gesture) | manual | manual |
| UX-01e | Keyboard quick-slot (e.g. Alt+Shift+1) activates Scene 1       | E2E       | `npx playwright test -g "scene quickslot keyboard"`                     | Wave 0      |
| UX-01f | Per-file size warning shown when file > 20 MB                   | unit      | `npx jest tests/unit/soundboard.test.js -t "size warning"`              | Wave 0      |
| UX-01g | D-02a MVP fallback: scene switch hard-cuts old track            | E2E       | `npx playwright test -g "scene hard cut fallback"` (if MVP chosen)      | Wave 0      |
| UX-02a | Dice Stats tab renders after rolls                              | E2E smoke | `npx playwright test -g "dice stats tab renders"`                       | Wave 0      |
| UX-02b | d20 rolls captured in IDB stats store                          | E2E       | `npx playwright test -g "rolls captured in IDB"` via page.evaluate      | Wave 0      |
| UX-02c | Histogram SVG has 20 bars                                       | unit      | `npx jest tests/unit/dice-stats.test.js -t "histogram 20 bars"`         | Wave 0      |
| UX-02d | Expected overlay at correct height (5% per face)                | unit      | `npx jest tests/unit/dice-stats.test.js -t "expected overlay"`          | Wave 0      |
| UX-02e | Crit(20) rate = actual % of 20s rolled                          | unit      | `npx jest tests/unit/dice-stats.test.js -t "crit rate"`                 | Wave 0      |
| UX-02f | Fumble(1) rate = actual % of 1s rolled                          | unit      | `npx jest tests/unit/dice-stats.test.js -t "fumble rate"`               | Wave 0      |
| UX-02g | "Diese Session" filter shows only rolls from current session    | unit      | `npx jest tests/unit/dice-stats.test.js -t "session filter"`            | Wave 0      |
| UX-02h | Per-character breakdown shows charId-attributed rolls           | unit      | `npx jest tests/unit/dice-stats.test.js -t "character breakdown"`       | Wave 0      |

**Note on UX-01d (audio playback):** Playwright cannot test actual audio output. The E2E test can verify that `audioContext.state === 'running'` via `page.evaluate()` after a user click, and that `source.start()` was called (spy pattern). Actual audio output verification is manual-only.

**Note on UX-01c (IDB persistence):** Playwright's `page.goto(url)` for a `file://` URL creates a fresh page context. Use `browserContext.newPage()` + navigate to test reload persistence — see Phase 6 persistence E2E pattern in `tests/e2e/features/persistence.spec.js`.

### Sampling Rate

- **Per task commit:** `npm run test` (unit suite, 421+ tests, <30 seconds)
- **Per wave merge:** `npm run test && npx playwright test tests/e2e/features/soundboard.spec.js tests/e2e/features/dice-stats.spec.js`
- **Phase gate:** Full unit + new E2E suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/dice-stats.test.js` — covers UX-02c, UX-02d, UX-02e, UX-02f, UX-02g, UX-02h, UX-01f
- [ ] `tests/unit/soundboard.test.js` — covers UX-01f (size warning logic, pure JS, no audio playback)
- [ ] `tests/e2e/features/soundboard.spec.js` — covers UX-01a, UX-01b, UX-01c, UX-01e
- [ ] `tests/e2e/features/dice-stats.spec.js` — covers UX-02a, UX-02b

---

## Security Domain

> `security_enforcement` is not explicitly set to false in `.planning/config.json`. Treating as enabled.

### Applicable ASVS Categories

| ASVS Category          | Applies | Standard Control                                                                          |
|------------------------|---------|-------------------------------------------------------------------------------------------|
| V2 Authentication      | no      | No auth (single-user local app)                                                           |
| V3 Session Management  | no      | No server sessions                                                                        |
| V4 Access Control      | no      | No multi-user                                                                             |
| V5 Input Validation    | yes     | File name/type validation on import; file size check (D-01a); rolls validated as numbers  |
| V6 Cryptography        | no      | No crypto needed                                                                          |

### Known Threat Patterns

| Pattern                       | STRIDE      | Standard Mitigation                                                                               |
|-------------------------------|-------------|---------------------------------------------------------------------------------------------------|
| Malicious filename in IDB     | Spoofing    | `esc(file.name)` when rendering file names in Audio Library UI                                    |
| Oversized Blob DoS            | DoS         | D-01a: check `file.size` before `saveSoundBlob()`; warn + block at >100 MB (D-01a guideline)     |
| XSS via notation string       | Tampering   | All `notation` strings rendered in histogram labels must use `esc(notation)` if rendered as HTML  |
| Crafted audio file crash      | Tampering   | `decodeAudioData` throws on unsupported/corrupt files; wrap in try/catch + user-facing toast      |

---

## State of the Art

| Old Approach                          | Current Approach                                          | When Changed | Impact                                              |
|---------------------------------------|-----------------------------------------------------------|--------------|-----------------------------------------------------|
| `new Audio()` for soundboard          | Web Audio API with AudioBufferSourceNode + GainNode       | Web Audio API is standard since 2013 | Multiple tracks + volume + crossfade possible  |
| FileReader for Blob → ArrayBuffer     | `blob.arrayBuffer()` Promise                              | Chromium 76 (2019) | Simpler code, Promise-based                   |
| `audioContext.createGain()`           | Same — still the current API                              | —            | No change                                          |
| Chart.js / D3 for histogram           | Inline SVG (no dependency)                                | N/A          | Zero bundle cost for a 20-bar static chart         |

**Deprecated/outdated:**
- `AudioContext.createScriptProcessor()`: deprecated, replaced by `AudioWorkletNode`. Not needed here (we only loop/mix, not process).
- `document.execCommand('copy')` pattern: unrelated, but noted since audio clipboard access is not in scope.

---

## Assumptions Log

| # | Claim                                                                                                              | Section                    | Risk if Wrong                                                                                 |
|---|--------------------------------------------------------------------------------------------------------------------|----------------------------|-----------------------------------------------------------------------------------------------|
| A1 | `Blob.arrayBuffer()` is available in the target Chromium version used at the game table                           | Standard Stack             | Low: FileReader fallback is trivial; include both paths defensively                           |
| A2 | The AudioContext autoplay policy applies under `file://` (Chrome docs don't explicitly say, but policy is page-level) | Common Pitfalls / Audio patterns | Low: the fix (call `audioContext.resume()` on first user click) is the correct pattern regardless |
| A3 | IndexedDB persists Blob values across `file://` page reloads in Chromium                                          | Standard Stack / Audio patterns | MEDIUM: This is the critical D-01 assumption. The existing codebase stores JSON in IDB under `file://` (confirmed working). The `images` store also stores data under `file://`. Blob storage is supported per Chromium IDB design docs. No runtime test has been run this session to confirm Blobs specifically survive reload under `file://` — E2E test UX-01c should verify this on first execution. |
| A4 | `Alt+Shift+1..5` keyboard slots are free of OS-level hotkey conflicts on Windows                                   | D-03 analysis              | LOW: Some Windows/IME combinations may intercept Alt+Shift. User should be able to configure slots (future). |
| A5 | SVG `document.createElementNS` works identically under `file://`                                                  | Histogram pattern          | Very low: SVG DOM APIs are not network-dependent.                                             |
| A6 | The session concept for D-05 ("diese Session") maps to a per-app-boot identifier (not a D&D game session from `D.sessionNotes`) | Dice stats hook  | MEDIUM: If user expects "session" to mean "D&D game session from the Sessions tab", the schema needs a different session key. The simpler boot-time ID avoids coupling to `D`. Planner should confirm. |

**If this table is empty:** All claims in this research were verified or cited. — NOT empty; see above.

---

## Open Questions (RESOLVED during planning — see 07-0x-PLAN.md)

1. **D-02a MVP decision gate** — **RESOLVED:** planner chose **D-02 (full layered crossfade)** in 07-02; D-02a hard-cut documented as considered-and-rejected fallback (user's "Regen + Taverne + Feuer" example is layered by definition; code delta over D-02a is modest).
   - What we know: D-02 (full layered crossfade) adds meaningful implementation complexity (one AudioContext with N source nodes per scene, plus crossfade scheduling). D-02a (one loop, hard cut) is simpler.
   - What's unclear: The planner needs to decide during wave planning whether to attempt full D-02 or default to D-02a with a note. The research supports both technically.
   - Recommendation: Plan for D-02 (layered tracks + crossfade) and document D-02a as an explicit risk fallback. The code difference is modest: D-02a is a subset of D-02 (just N=1 source and no ramp).

2. **"Session" definition for dice stats filter (D-05)** — **RESOLVED:** boot-time `sessionId` (`Date.now()` string in module-level `window._currentSessionId`, not in `D`), set in 07-01.
   - What we know: `diceHistory` has no session concept today. D.sessionNotes exists but is about D&D narrative sessions, not play sessions.
   - What's unclear: Does "diese Session" mean "since the app was last opened" (boot-time ID) or "since the current D&D game session started" (linked to a session in D.sessionNotes)?
   - Recommendation: Use boot-time `sessionId` (a `Date.now()` string set at app init, stored in a module-level variable — not in `D`). This is the simplest, most reliable definition and avoids coupling stats to session management. If the user wants per-game-session tracking later, that is a v2 enhancement.

3. **Audio file format support** — **RESOLVED:** `accept="audio/*"` on the file input + `decodeAudioData` try/catch → toast on unsupported format (07-03).
   - What we know: `decodeAudioData` in Chromium supports MP3, WAV, OGG/Vorbis, AAC, FLAC in most versions.
   - What's unclear: The `<input type="file">` accept filter and what to display in the UI.
   - Recommendation: `accept="audio/*"` on the file input; let the browser filter. Show a toast if `decodeAudioData` throws (unsupported format).

---

## Sources

### Primary (HIGH confidence)

- `features/dice/dice-core.js` — full read; `addToDiceHistory` at line 434, `diceHistory` at line 7, all roll callsites
- `systems/backups.js` — full read; IDB Blob patterns at `saveBackupToIndexedDB()` line 88, `getBackups()` line 115
- `systems/spellslots/keyboard-shortcuts.js` — full read; all existing shortcuts lines 1–187
- `core/init.js` — read to line 355; `IDB_VERSION = 3` at line 271, `initIndexedDB()` at line 274, `saveToIndexedDB()` at line 318, `onupgradeneeded` store creation at lines 288–314
- `systems/tab-registry.js` — full read; `TAB_RENDER_REGISTRY` pattern
- `features/timers/timers.js` — full read; only audio usage is `new Audio(data:audio/wav;base64,...)` at line 222
- `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `INTEGRATIONS.md` — full reads
- `CLAUDE.md` — full read via system context; keyboard shortcut table, build/loader rules, dedup rules

### Secondary (MEDIUM confidence)

- [MDN Web Audio API overview](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — AudioContext, AudioBufferSourceNode.loop, decodeAudioData
- [web.dev — Getting started with Web Audio API](https://web.dev/articles/webaudio-intro) — GainNode.gain.linearRampToValueAtTime, gapless looping, crossfade pattern
- [MDN AudioBufferSourceNode.loopStart](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/loopStart) — loop=true semantic
- [Chrome Developers — Autoplay policy](https://developer.chrome.com/blog/autoplay) — AudioContext suspended state
- [Chrome Developers — Web Audio Autoplay](https://developer.chrome.com/blog/web-audio-autoplay) — resume() pattern, auto-resume on source.start()
- [Chrome Developers — IndexedDB Blob support](https://developer.chrome.com/blog/blob-support-for-Indexeddb-landed-on-chrome-dev) — Blobs supported in IDB
- [MDN Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — Chromium IDB quota (60% disk; `file://` not explicitly documented)
- [Building a Custom Sound Board with Vue and IndexedDB](https://www.raymondcamden.com/2019/11/12/building-a-custom-sound-board-with-vue-and-indexeddb) — IDB Blob pattern for audio: retrieve → createObjectURL → play (or decodeAudioData path)

### Tertiary (LOW confidence — marked [ASSUMED] in Assumptions Log)

- `Blob.arrayBuffer()` Chromium 76 availability (training knowledge, not verified via caniuse this session)
- IDB Blob survival across `file://` reload — inferred from project's existing IDB usage + Chrome design docs, NOT directly tested this session

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all APIs are native browser APIs; existing project already uses IDB; dice hook is a direct code read
- Architecture: HIGH — derived from reading four source files directly; patterns follow established project conventions exactly
- Pitfalls: MEDIUM-HIGH — Pitfalls 1–4 are verified against MDN/Chrome docs; Pitfalls 5–6 are derived from reading CLAUDE.md dedup rules and dice-core.js source
- IDB Blob under file://: MEDIUM — assumption A3 needs runtime confirmation via E2E test UX-01c on first execution

**Research date:** 2026-06-19
**Valid until:** 2026-09-19 (90 days — Web Audio API and IDB APIs are stable; no fast-moving dependencies)
