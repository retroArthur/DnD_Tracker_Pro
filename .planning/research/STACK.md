# Stack Research

**Domain:** Offline-first D&D 5e campaign manager — brownfield feature additions to vanilla JS single-file app
**Researched:** 2026-06-11
**Confidence:** HIGH (PWA, File System Access, Web Audio, Canvas), MEDIUM (monster data sources, German NPC name data)

---

## Context: Hard Constraints

This is a brownfield project. The existing stack is fixed:

- Vanilla JS/HTML/CSS, non-ESM, global scope, no runtime deps
- `build.py` concatenates 92 modules into one standalone HTML file
- Primary usage: `file://` double-click on Windows/Chromium
- Zero npm runtime dependencies permitted

All recommendations below operate within these constraints. No framework, no bundler, no runtime library is acceptable. Every capability must be implemented in vanilla JS, inlined into the single HTML bundle.

---

## Capability 1: PWA Installation

### Verdict: Requires serving from localhost (or HTTPS) — file:// cannot install

**The file:// problem (CONFIRMED, HIGH confidence):**

PWA installation requires a secure context. Chromium treats `https://` and `http://localhost` (or `http://127.0.0.1`) as secure contexts, but `file://` is NOT treated as a secure context for PWA installation purposes, even though Chromium treats it as secure for other APIs. This means the current double-click usage cannot trigger `beforeinstallprompt`.

**Strategy — what actually changes:**

The transition is: serve the built HTML file through `npm run dev` (the existing `python -m http.server :8000`) instead of double-clicking, then install the PWA once. After installation, the PWA launches from the OS without a browser URL bar, auto-starts offline, and behaves like a native app. The user double-clicks the desktop PWA icon instead of the HTML file.

**What the build must produce alongside the HTML:**

| File | Purpose | Notes |
|------|---------|-------|
| `dist/manifest.json` | PWA manifest | Cannot be inlined as data URI — must be a separate file linked via `<link rel="manifest">` |
| `dist/icons/icon-192.png` | Required install icon | Can be generated once by `build.py` from SVG |
| `dist/icons/icon-512.png` | Required install icon | Same |
| `dist/sw.js` | Service worker | `sw.js` already exists in repo root — move/update for dist |

**Minimum manifest (Chromium requirements, HIGH confidence):**

```json
{
  "name": "D&D Kampagnen-Tracker Pro",
  "short_name": "DnD Tracker",
  "start_url": "./dnd-tracker-optimized.html",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#b8860b",
  "icons": [
    { "src": "icons/icon-192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "icons/icon-512.png", "type": "image/png", "sizes": "512x512" }
  ]
}
```

**Service Worker scope:**

The existing `sw.js` uses `self.addEventListener('install', ...)` but may need scope adjustment since all files are in `dist/`. The service worker must be at or above the scope of the start URL. Serving from `dist/` with SW at `dist/sw.js` is correct scope. The `Service-Worker-Allowed` header is not needed for same-directory placement.

**Install prompt pattern (vanilla JS, no deps):**

```javascript
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    // Show custom "App installieren" button in settings panel
    document.getElementById('btn-install-pwa').hidden = false;
});

document.getElementById('btn-install-pwa').addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    document.getElementById('btn-install-pwa').hidden = true;
});
```

**`beforeinstallprompt` browser support:** Chromium-only (Chrome, Edge, Samsung Internet). Firefox and Safari do not support it. Since the target is Chromium on Windows, this is acceptable.

**Build.py changes needed:**

`build.py` must copy `manifest.json`, `icons/`, and `sw.js` into `dist/` alongside the HTML. The HTML template must include:

```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#b8860b">
```

**What NOT to use:**

- Do NOT inline the manifest as a `<link>` data URI — browser support is inconsistent and not standardized for installation
- Do NOT depend on Service Worker alone without the manifest — both are required for installability
- Do NOT register the SW when serving from `file://` — it will silently fail; guard with `location.protocol !== 'file:'`

---

## Capability 2: File-Based Backup Sync (File System Access API)

### Verdict: Use showSaveFilePicker + showOpenFilePicker from Chromium 86+; falls back to download link on file://

**Browser support (CONFIRMED, HIGH confidence):**

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Edge 86+ (Chromium) | Full support | `showSaveFilePicker`, `showOpenFilePicker`, `showDirectoryPicker` |
| Firefox | NOT supported | Firefox ships OPFS but not the picker methods |
| Safari | NOT supported | Same gap |

**Secure context requirement:**

`showSaveFilePicker` requires a secure context (HTTPS or localhost). It does NOT work from `file://`. This means the File System Access API pickers are ONLY available after the PWA migration (served from localhost or installed PWA). The app must also guard invocation behind user gesture (transient activation).

**Two-tier strategy (HIGH confidence):**

```javascript
async function exportCampaignBackup() {
    const json = JSON.stringify(D, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    if ('showSaveFilePicker' in window) {
        // Tier 1: File System Access API (PWA / localhost context)
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: `dnd-backup-${new Date().toISOString().slice(0,10)}.json`,
                types: [{ description: 'JSON Backup', accept: { 'application/json': ['.json'] } }]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            showToast('Backup auf Festplatte gespeichert', 'success');
        } catch (err) {
            if (err.name !== 'AbortError') showToast('Backup-Fehler: ' + err.message, 'error');
        }
    } else {
        // Tier 2: Classic download link fallback (works from file://)
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dnd-backup-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Backup heruntergeladen (Speicherort: Downloads-Ordner)', 'info');
    }
}
```

**FileHandle persistence (advanced, optional):**

The File System Access API allows storing `FileSystemFileHandle` objects in IndexedDB so the app can silently overwrite the same file on subsequent saves without a picker dialog. This is the "auto-sync" scenario. Requires `handle.requestPermission({ mode: 'readwrite' })` on each session start.

**What NOT to use:**

- Do NOT use `showDirectoryPicker` for the initial implementation — it adds permission complexity; use file-by-file saves first
- Do NOT skip the `AbortError` catch — the user cancelling the picker throws and should be silently ignored
- Do NOT call pickers outside a user gesture handler — they throw `SecurityError`

---

## Capability 3: Command Palette (Ctrl+K)

### Verdict: Build from scratch in vanilla JS — ~80 lines. No library needed.

The app already has:
- A global fuzzy search system (`systems/search/global-search.js`) with `fuzzyMatch()`
- `data-action` event delegation pattern for all commands
- Keyboard shortcut registry (`Strg+K/F` already wired to search focus)

The command palette is a search-then-act modal on top of the existing infrastructure. No external dependency is warranted.

**Pattern (vanilla JS):**

```javascript
// Registry: actions are plain objects, not DOM nodes
const COMMAND_REGISTRY = [
    { id: 'new-character', label: 'Neuen Charakter anlegen', category: 'Partei', action: () => showNewCharacterModal() },
    { id: 'roll-d20', label: 'W20 würfeln', category: 'Würfel', action: () => rollDice('1d20') },
    { id: 'next-turn', label: 'Nächster Zug', category: 'Initiative', action: () => nextTurn() },
    // ... extend per module
];

function openCommandPalette() {
    // Render modal with <input> + filtered list
    // Use existing fuzzyMatch() for scoring
    // Arrow keys navigate, Enter executes, Escape closes
    // data-action="close-command-palette" on overlay
}
```

**Keyboard handling specifics:**

`Ctrl+K` is already reserved for global search. The command palette should REPLACE or EXTEND that handler. Use `e.ctrlKey && e.key === 'k'` and call `e.preventDefault()` to suppress browser default (link focus in Firefox).

**Fuzzy filter:** The existing `fuzzyMatch(query, text)` in `global-search.js` returns a score. Reuse it directly — no new algorithm needed.

**What NOT to use:**

- Do NOT import `ninja-keys`, `command-pal`, or any other library — they are npm packages with their own DOM lifecycles that conflict with the app's event delegation
- Do NOT rebuild fuzzy search — the app already has one

---

## Capability 4: Monster Compendium — SRD Data Sources

### Verdict: Use SRD 5.1 EN (OGL 1.0a or CC-BY 4.0) as embedded JSON; German translation available but incomplete

**License landscape (CONFIRMED, MEDIUM-HIGH confidence):**

| Source | License | Status | Usable? |
|--------|---------|--------|---------|
| SRD 5.1 (2014 rules) | OGL 1.0a AND CC-BY 4.0 (dual-licensed since Jan 2023) | ~334 monsters | YES — attribution required |
| SRD 5.2 / 2024 rules (released April 2025) | CC-BY 4.0 | Different monster set | YES — attribution required |
| 5e-bits/5e-database | OGL 1.0a (code MIT) | ~334 monsters in JSON | YES — OGL attribution |
| tkfu GitHub Gist | No explicit license | Community extract | USE WITH CAUTION — unclear license |
| nesges/SRD-5.1-DE (Codeberg) | CC-BY 4.0 | German SRD 5.1 monsters+spells via API at openrpg.de | YES — same WotC attribution |

**Recommended primary source: `5e-bits/5e-database`** (github.com/5e-bits/5e-database)

- File: `src/2014/5e-SRD-Monsters.json`
- ~334 SRD monsters
- Structured JSON with full statblocks (ability scores, actions, legendary actions, CR, speed, traits, etc.)
- Powers the public dnd5eapi.co — well-maintained
- OGL 1.0a license: must include OGL attribution text in the app (a collapsible "License" section suffices)
- Estimated raw JSON size: ~400–600 KB unminified; ~150–200 KB minified/gzipped. Acceptable for inline embedding in the HTML bundle.

**German translation source: `nesges/SRD-5.1-DE`** (codeberg.org/nesges/SRD-5.1-DE)

- All 334 SRD 5.1 monsters in German
- CC-BY 4.0 — same WotC attribution text required
- Available via API at `openrpg.de/srd/5e/de/api/` — but this is an ONLINE API, not a static download
- Strategy: Fetch all monsters at build time (`python build.py` pre-step) and bake the German JSON into the bundle. The Codeberg repo contains individual monster files that can be harvested.
- Completeness: Confirmed complete for monsters; JSON schema validation still in progress as of late 2024 — validate fields before embedding.

**Fallback for German data:**

If the German JSON is incomplete or schema-inconsistent at implementation time, use the English `5e-bits` data and present monster names/types in English. The app already mixes English and German (e.g., condition names in German, spell names from existing DB). A hybrid approach (German UI labels + English stat text) is acceptable.

**Data schema (5e-bits format):**

```json
{
  "index": "aboleth",
  "name": "Aboleth",
  "size": "Large",
  "type": "aberration",
  "alignment": "lawful evil",
  "armor_class": [{ "type": "natural armor", "value": 17 }],
  "hit_points": 135,
  "hit_dice": "18d10",
  "speed": { "walk": "10 ft.", "swim": "40 ft." },
  "strength": 21, "dexterity": 9, "constitution": 15,
  "intelligence": 18, "wisdom": 15, "charisma": 18,
  "proficiency_bonus": 4,
  "damage_resistances": [], "damage_immunities": [],
  "condition_immunities": [],
  "senses": { "darkvision": "120 ft.", "passive_perception": 20 },
  "languages": "Deep Speech, telepathy 120 ft.",
  "challenge_rating": 10,
  "xp": 5900,
  "special_abilities": [...],
  "actions": [...],
  "legendary_actions": [...]
}
```

**Embedding strategy:**

Assign the full array to a `const SRD_MONSTERS = [...]` global constant in a new module `core/srd-monsters.js`. The build concatenates it like all other modules. At ~200 KB minified this adds ~15% to a 1.3 MB bundle — acceptable.

**Required attribution text (OGL 1.0a):**

Include an `open-game-license` section in the About modal:
> "This application uses content from the System Reference Document 5.1 available at https://dnd.wizards.com/resources/systems-reference-document."
> Full OGL 1.0a text must be included or accessible. Standard practice: collapsible section in the app's About/Impressum modal.

**What NOT to use:**

- Do NOT use the tkfu GitHub Gist — no explicit license
- Do NOT call open5e.com API at runtime — app must be fully offline
- Do NOT embed 5etools data — their dataset is comprehensive but scraped from non-SRD sources; license is unclear for redistribution
- Do NOT use SRD 5.2 data unless explicitly needed — the existing spell database is built on SRD 5.1 (2014); mixing rule editions creates inconsistency

---

## Capability 5: Soundboard (Local Audio Files as Ambience)

### Verdict: Web Audio API for control + HTMLAudioElement for streaming; File picker (input[type=file] fallback) for user-supplied files; autoplay requires first user gesture

**Web Audio API vs HTMLAudioElement decision (HIGH confidence):**

| Aspect | Web Audio API | HTMLAudioElement |
|--------|--------------|-----------------|
| Volume/fade control | GainNode — precise | `.volume` property — coarse |
| Looping ambience | Manual with scheduler | `loop` attribute — simpler |
| Multiple simultaneous | Up to 1000+ | Limited (~6 per domain) |
| Local file loading | `fetch` + `decodeAudioData` (requires HTTPS or file:// with CORS workaround) | `src = URL.createObjectURL(file)` — works everywhere |
| Autoplay policy | `AudioContext.state` check + `resume()` | Same policy, simpler API |
| Streaming long tracks | Requires full decode into memory first | True streaming |

**Recommendation: Hybrid approach**

- Use `HTMLAudioElement` with `createObjectURL` for **file loading** — works from `file://` and localhost without fetch/CORS issues
- Use Web Audio API's `GainNode` for **volume control and crossfade** — connect `HTMLMediaElement` source to audio graph via `createMediaElementSource()`
- Use a single `AudioContext` created on first user click (unlock autoplay)

**Pattern:**

```javascript
let audioCtx = null;
const soundSlots = {}; // { slotId: { audio, gainNode, source } }

function ensureAudioContext() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function loadAudioFile(slotId, file) {
    const ctx = ensureAudioContext();
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.loop = true;

    const source = ctx.createMediaElementSource(audio);
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.5;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    soundSlots[slotId] = { audio, gainNode, source };
}
```

**File loading — two approaches:**

1. `<input type="file" accept="audio/*">` — works from `file://` and any origin. User selects files via OS dialog. Simple, universal.
2. `showOpenFilePicker()` (File System Access API) — only works from localhost/HTTPS (same constraints as backup). Provides `FileSystemFileHandle` that can be persisted in IndexedDB for re-loading across sessions without repicking.

**Recommendation:** Use `input[type=file]` as primary with optional `showOpenFilePicker` enhancement when running as PWA. Store the file handle (or fallback to re-picking) in IndexedDB.

**Supported formats (Chromium):**

MP3 (universally), OGG/Vorbis, WAV, FLAC, AAC. Recommend MP3 or OGG for ambience tracks (smaller file size).

**Autoplay unlock pattern:**

```javascript
// First user interaction anywhere on the page unlocks audio
document.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}, { once: true });
```

**Persistence:** File references cannot be persisted across sessions from `file://` (no File System Access API). From PWA/localhost, store `FileSystemFileHandle` objects in IndexedDB. From `file://`, require user to re-pick files each session (acceptable given single-user offline usage).

**What NOT to use:**

- Do NOT use `fetch()` for local audio file loading from `file://` — blocked by CORS even for same-origin file:// requests in Chromium
- Do NOT create `AudioContext` on page load — autoplay policy will suspend it immediately; wait for first click
- Do NOT load audio via `<audio src="path/to/file.mp3">` with relative paths — bundle is a single HTML file with no relative audio resources; only object URLs from user-picked files work

---

## Capability 6: Dice Statistics (Charts Without Dependencies)

### Verdict: Canvas 2D API — custom bar chart in ~100 lines of vanilla JS. No charting library needed.

**Why no library (HIGH confidence):**

The dice statistics feature needs: bar charts (roll distribution), possibly a line chart (roll history over sessions), and a summary table (mean, median, crit rate). These are simple, static visualizations — nothing interactive or animated. Chart.js, D3, etc. are 60–300 KB runtime dependencies that violate the zero-dep constraint.

**Canvas 2D approach:**

```javascript
function renderDiceHistogram(canvasId, rolls) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };

    // Count frequencies
    const freq = {};
    rolls.forEach(r => freq[r] = (freq[r] || 0) + 1);
    const maxVal = Math.max(...Object.values(freq));

    // Draw bars
    const keys = Object.keys(freq).sort((a, b) => a - b);
    const barW = (W - padding.left - padding.right) / keys.length;

    ctx.clearRect(0, 0, W, H);
    keys.forEach((k, i) => {
        const barH = ((freq[k] / maxVal) * (H - padding.top - padding.bottom));
        const x = padding.left + i * barW;
        const y = H - padding.bottom - barH;

        // Highlight nat 1 / nat 20
        ctx.fillStyle = k === '20' ? '#ffd700' : k === '1' ? '#ef4444' : 'var(--accent)';
        ctx.fillRect(x + 2, y, barW - 4, barH);

        // X-axis labels
        ctx.fillStyle = '#ccc';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(k, x + barW / 2, H - padding.bottom + 14);
    });
}
```

**Statistics to compute:**

All computable from the existing roll history stored in `D` (dice tab already has roll history):

- Total rolls per die type (d4/d6/d8/d10/d12/d20)
- Crit rate (% rolls of max value for d20 = nat 20)
- Fumble rate (% rolls of 1)
- Mean, median per die type
- Per-session breakdown (requires tagging rolls with session ID)

**CSS-only alternative for simple percentage bars:**

For extremely simple stats (just crit %, session count), CSS `width` percentage bars avoid Canvas entirely. Appropriate for a summary widget rather than a full histogram.

**What NOT to use:**

- Do NOT use Chart.js — 200 KB+ runtime dependency
- Do NOT use D3.js — 500 KB, requires ESM, complex API for this use case
- Do NOT use `<svg>` for a histogram — Canvas is simpler for this shape and has better performance for dynamic re-renders

---

## Capability 7: Travel/Weather Simulation and NPC Generator

### Verdict: Pure data tables embedded as JS constants — no external data source at runtime; curate tables at build time

**Architecture (HIGH confidence — this is a pure data problem, not an API problem):**

Both features are random-table lookups. The app already has `D.randomTables` and `rollOnTable()`. The implementation is: define rich default tables as constants in `core/constants.js` (or a new `core/srd-tables.js`), then run `rollOnTable()` on them.

**Travel/Weather data sources:**

The SRD 5.1 includes travel pace rules (PHB p. 181-182 equivalent), but NOT weather tables — those are in the Dungeon Master's Guide (not SRD). Options:

1. **Donjon.bin.sh weather/encounter tables:** Not redistributable as embedded data; reference-only
2. **Custom curated tables:** Write German weather tables directly into the app constants. Weather is: precipitation (clear/cloudy/rain/storm/snow), temperature (warm/mild/cold/freezing), wind (none/light/moderate/strong). ~5 entries per category is sufficient. These are generic fantasy weather concepts, not copyrighted IP.
3. **SRD encounter tables:** Not in SRD 5.1 — random encounters are DMG content. Must be custom.

**Recommendation:** Curate ~20 German weather result strings + terrain-based encounter frequency modifiers as inline constants. Use the existing `D.randomTables` system for user-customizable additions.

**NPC generator data:**

German name tables are the core challenge. Options:

| Source | German Content | License | Notes |
|--------|---------------|---------|-------|
| DMNet.de name generator | German fantasy names | Online only | Cannot embed |
| SRD 5.1 DE (nesges) | No name tables | — | Rules only |
| Custom compiled tables | Manually curated | Own work | Best option |
| D&D 5e PHB name tables | Racial name tables | NOT in SRD | Cannot redistribute |

**Recommendation:** Compile a curated set of ~200 German-sounding fantasy first names (male/female) and ~100 family names/epithets, inspired by common German fantasy naming patterns (Germanic root words, Tolkien-influenced). These are original creative work, not derivative of copyrighted sources.

For personality traits: the SRD 5.1 includes Background personality traits (e.g., Soldier, Acolyte) which ARE redistributable under CC-BY 4.0. Extract and translate these ~80 trait entries as the NPC trait pool.

**NPC personality structure:**

```javascript
const NPC_TABLES = {
    firstNamesMale: ['Aldric', 'Bernd', 'Dietmar', ...],
    firstNamesFemale: ['Aelindra', 'Brunhild', 'Dagmar', ...],
    surnames: ['von der Eiche', 'Steinbrecher', 'Kaltherz', ...],
    traits: ['Redet zu viel über seine Kindheit', 'Vertraut niemandem beim ersten Treffen', ...],
    ideals: ['Gerechtigkeit über alles', 'Familie zuerst', ...],
    flaws: ['Trinkt zu viel', 'Prahlt mit Errungenschaften', ...],
    occupations: ['Schmied', 'Tavernenwirt', 'Händler', 'Söldner', 'Bauer', ...],
    mannerisms: ['Kratzt sich oft am Kinn', 'Blickt beim Reden weg', ...]
};
```

**What NOT to use:**

- Do NOT call any API at runtime for name generation — app must be fully offline
- Do NOT use D&D Beyond's name content — not SRD, cannot redistribute
- Do NOT use AI name generators — they require internet and produce inconsistent data

---

## Browser API Support Summary

| API | Chromium | Firefox | PWA-only? |
|-----|---------|---------|-----------|
| `beforeinstallprompt` | Chrome 66+ | Not supported | Requires HTTPS/localhost |
| `showSaveFilePicker` | Chrome 86+ | Not supported | Requires HTTPS/localhost (not file://) |
| `showOpenFilePicker` | Chrome 86+ | Not supported | Requires HTTPS/localhost (not file://) |
| Web Audio API / `AudioContext` | Chrome 14+ | Supported | Works from file:// |
| `createMediaElementSource` | Chrome 14+ | Supported | Works from file:// |
| `FileReader` / `createObjectURL` | Universal | Universal | Works from file:// |
| `input[type=file]` | Universal | Universal | Works from file:// |
| Canvas 2D API | Universal | Universal | Works from file:// |
| `IndexedDB` | Universal | Universal | Works from file:// |
| `navigator.getAutoplayPolicy` | Chrome 121+ | Firefox 112+ | Works from file:// |

**Key constraint summary:** The PWA transition (localhost serving) unlocks `showSaveFilePicker` and `beforeinstallprompt`. Features that only need user-picked files via `input[type=file]` (soundboard) and Canvas (dice stats) work from `file://` today.

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Chart.js / D3.js | Runtime npm deps, 200-500 KB | Canvas 2D API (~100 lines) |
| Fuse.js / MiniSearch | Runtime dep | Existing `fuzzyMatch()` in `global-search.js` |
| Ninja-keys / command-pal | Runtime dep, DOM lifecycle conflicts | Custom `COMMAND_REGISTRY` + modal |
| howler.js / tone.js | Runtime dep | `HTMLAudioElement` + Web Audio API directly |
| open5e.com API at runtime | Requires internet | Pre-bake JSON data into bundle at build time |
| 5etools data | Scraped from non-SRD sources, unclear license for redistribution | 5e-bits/5e-database (OGL 1.0a, clear license) |
| Inline manifest as data URI | Not standardized for install | Separate `manifest.json` file in dist/ |
| `file://` + File System Access API | SecureContext required, fails silently or throws | Two-tier strategy: picker when available, `<a download>` fallback |

---

## Installation (Build Changes Only)

No new npm runtime packages. The only changes are:

```bash
# No npm install needed for runtime

# Build additions (handled by build.py):
# 1. Copy dist/manifest.json
# 2. Copy dist/icons/icon-192.png + icon-512.png
# 3. Copy dist/sw.js (update existing sw.js scope)
# 4. Add <link rel="manifest"> + <meta name="theme-color"> to HTML template
# 5. Add SRD monster JSON as a build-time data module (core/srd-monsters.js)
```

---

## Sources

- MDN: Making PWAs installable — https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable (verified: HTTPS/localhost required, file:// excluded)
- MDN: `showSaveFilePicker()` — https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker (verified: SecureContext, transient activation required, Chrome 86+)
- Chrome Developers: File System Access API — https://developer.chrome.com/docs/capabilities/web-apis/file-system-access (verified: Chrome 86+ on desktop)
- MDN: Web Audio API Best Practices — https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices (verified: autoplay policy, AudioContext resume pattern)
- MDN: Autoplay guide — https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay (verified: suspended context, user gesture requirement)
- MDN: Trigger installation from your PWA — https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt (verified: `beforeinstallprompt` Chromium-only)
- 5e-bits/5e-database — https://github.com/5e-bits/5e-database (OGL 1.0a, 334 SRD monsters, actively maintained)
- nesges/SRD-5.1-DE — https://codeberg.org/nesges/SRD-5.1-DE (CC-BY 4.0 German SRD monsters, API at openrpg.de)
- WotC SRD 5.1 CC-BY announcement: SRD 5.1 dual-licensed OGL 1.0a + CC-BY 4.0 since January 2023
- Tabyltop/CC-SRD — https://github.com/Tabyltop/CC-SRD (CC-BY attribution text confirmed; monster JSON not yet released)
- MDN Canvas API tutorial — https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial (Canvas 2D bar chart patterns)
- web.dev PWA Web App Manifest — https://web.dev/learn/pwa/web-app-manifest (manifest field requirements confirmed)

---
*Stack research for: Offline-first D&D 5e campaign manager — brownfield capability additions*
*Researched: 2026-06-11*
