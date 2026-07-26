# External Integrations

**Analysis Date:** 2026-07-26

## APIs & External Services

**No Runtime External API Calls**

The application is deliberately offline-first with zero external API dependencies at runtime.

**Google Fonts (Build-Time Only):**
- Service: Google Fonts CSS2 API
- Purpose: Download WOFF2 font files during build phase
- Tool: `tools/fetch-fonts.py` (Python script)
- Implementation Details:
  - Fetches font CSS from `https://fonts.googleapis.com/css2?family=*`
  - Extracts WOFF2 URLs from CSS response
  - Downloads binary font files to `assets/fonts/`
  - Stores locally as: roboto-400.woff2, roboto-700.woff2, inter-400.woff2, inter-500.woff2, inter-600.woff2, poppins-400.woff2, poppins-500.woff2, poppins-600.woff2, source-sans-pro-400.woff2, source-sans-pro-600.woff2
- Workflow: Build-time only, fonts bundled into dist/ for offline use
- No runtime CDN dependency (D-07: offline fonts)
- Run manually: `python tools/fetch-fonts.py`

**No Other External Integrations:**
- Stripe: Not used
- Supabase: Not used
- Firebase: Not used
- AWS/Azure/GCP: Not used
- Authentication providers: Not used
- Analytics services: Not used
- Error tracking (Sentry, Rollbar): Not used
- CDN services: Not used (fonts are local)
- Map services: Not used
- Payment processors: Not used

## Data Storage

**Browser Storage (Client-Side Only):**

**localStorage:**
- Primary persistence mechanism
- Key: `dnd-tracker-v4` (APP_CONFIG.STORAGE_KEY)
- Capacity: 5-10MB (browser-dependent)
- Stores: All campaign data (characters, NPCs, locations, quests, encounters, loot, wiki, session notes, etc.)
- Wrapper: `StorageAPI` in `utils/basic.js` (error handling, JSON helpers)
- Fallback: Automatic switch to IndexedDB when data exceeds size limit
- Multi-tab sync: BroadcastChannel `dnd-tracker-sync` keeps tabs synchronized

**Additional localStorage Keys:**
- `dnd-tracker-backups` - Local backup history (auto-created backups)
- `dnd-tracker-campaigns` - Campaign index and metadata
- `dnd-tracker-theme` - User theme preference (dark/light)
- `dnd-tracker-layout` - UI layout and preferences
- `dnd-dice-favorites` - Saved dice roll templates
- `dnd-timer-presets` - Combat/session timer configurations
- Campaign-specific keys: `dnd-campaign-<timestamp>` for additional campaigns

**IndexedDB:**
- Database: `dnd-tracker-db` (version 2)
- Purpose: Large campaign storage (>5MB fallback)
- Object Stores:
  - `campaigns` - Campaign data (keyPath: `id`)
  - `backups` - Backup history (keyPath: `id`, indexes: `date`, `campaign`)
  - `images` - User-uploaded images (as Blobs, not embedded in HTML)
- Usage: Automatic fallback when localStorage exceeds ~5MB
- Implementation: `systems/spellslots/persistence.js` → `saveToIndexedDBFallback()`
- Redundant backup: Data >2MB stored in both localStorage and IndexedDB

**File Storage:**
- No cloud storage integration
- Manual user-triggered export/import:
  - JSON export/import: `systems/spellslots/import-export.js`
  - Markdown export/import: Inline in entity editors
  - Shop handout HTML export: `features/shops/shop-export.js`
- Avatar images: URL-based (http/https or base64 data: URLs, validated in `systems/avatars.js`)

## Caching Strategy

**Service Worker (sw.js):**
- Cache Name: `dnd-tracker-v3`
- Strategy: Cache-first for same-origin, network-only for external
- Core Assets (must cache successfully):
  - `./dnd-tracker-optimized.html` - Main app bundle
  - `./manifest.webmanifest` - PWA manifest
- Optional Assets (individual failure tolerance):
  - Icons: `./icons/icon-192.png`, `./icons/icon-512.png`
  - Fonts: 10 WOFF2 files in `./assets/fonts/`
- External Requests: Blocked (return error) to prevent dependency on unreliable external services
- Offline Fallback: Serves bundled HTML for failed HTML requests

**Browser Cache Behavior:**
- GET requests: Cache-first (check cache before network)
- POST/PUT/DELETE: Pass through without caching
- Stale-while-revalidate: Not used (cache-first is simpler and more reliable)

## Fonts & Typography

**Font Loading (D-07: Offline Local Fonts):**
- No Google Fonts CDN at runtime
- All fonts downloaded at build-time via `tools/fetch-fonts.py`
- Stored locally in `assets/fonts/` directory
- Bundled into `dist/` during production deployment
- CSS URL rewriting at build: `url('../fonts/` → `url('./assets/fonts/`
- Fonts cached by Service Worker as optional assets
- Fallback: System fonts if WOFF2 unavailable

**Font Families and Weights:**
- Roboto: 400 (regular), 700 (bold)
- Inter: 400 (regular), 500 (medium), 600 (semibold)
- Poppins: 400 (regular), 500 (medium), 600 (semibold)
- Source Sans 3: 400 (regular), 600 (semibold)

**Font Delivery:**
- HTML: Inline CSS with @font-face rules
- Format: WOFF2 only (modern browsers)
- Encoding: Binary files in `assets/fonts/`
- Critical: Fonts are OPTIONAL assets in SW cache; missing fonts don't break functionality

## Authentication & Identity

**Auth Provider:** None
- Application has no user authentication system
- Single-user, local-only design
- No login required, no user accounts
- Data tied to browser profile only
- Can be shared between users (same device, same localStorage)

**Data Isolation:**
- Per-browser isolation via localStorage keys
- Per-campaign isolation via campaign index
- No cross-device synchronization
- Campaign switching: `systems/campaign-manager/campaign-manager.js` → `switchCampaign()`
- Multiple campaigns: Each stored separately in localStorage/IndexedDB

## Monitoring & Observability

**Error Tracking:** None (no external service)
- Internal ring buffer: `ErrorHandler` in `render/helpers.js` (last 50 errors)
- Debounced error toasts on critical failures
- Global error handlers: `window.onerror` and `onunhandledrejection` in `core/init.js`

**Logging:**
- Framework: Custom `ErrorHandler.log()` wrapper
- Output: Browser console (development mode only)
- Control: `APP_CONFIG.DEBUG_MODE` flag (enabled in dev, disabled in production)
- Patterns: `ErrorHandler.log(contextName, error, additionalInfo)`
- Production behavior: All logs suppressed (no console pollution)

**Performance Monitoring:** None (no external APM service)
- Local measurement via `window.performance` API
- Debounced renders/saves to minimize CPU usage
- Timing constants in APP_CONFIG (debounce 300ms, throttle 100ms)

## Offline Capabilities

**Service Worker Offline Support:**
- Automatic detection via SW fetch event handling
- Cache-first strategy ensures assets load from cache
- Fallback: Serves bundled HTML for offline requests
- No explicit "offline mode" indicator (app works transparently offline)

**Data Persistence:**
- Data saved to localStorage immediately (synchronous)
- No sync on reconnection (changes persist locally)
- Manual export/import for cross-device sharing

**PWA Installation:**
- Web app manifest: `manifest.webmanifest`
- Installable on Android and some iOS browsers
- App icons: 192x192 and 512x512 PNG
- Display mode: `standalone` (full screen, no address bar)
- Backdrop color: Dark (#0d0d0d)
- Theme color: Gold (#d4af37)

## Import/Export & Data Exchange

**Campaign Export:**
- Formats: JSON, Markdown (optional)
- Implementation: `systems/spellslots/import-export.js`
- Scope: All entities (characters, NPCs, locations, quests, encounters, loot, wiki)
- User-triggered: Download button in UI
- File type: `.json`, `.md`, or `.html` depending on format

**Campaign Import:**
- Supported formats: JSON, CSV (per-entity), Markdown
- Implementation: `systems/spellslots/import-export.js`
- Validation: Data schema checks before import
- Error handling: User feedback for invalid/conflicting imports
- Merge options: Append or replace existing data

**Markdown Support:**
- Bidirectional: Export to markdown, import from markdown
- Patterns: Shortcut syntax in text editors (e.g., `**bold**`, `*italic*`)
- Rendering: Markdown converted to HTML on display, raw when editing

**No API Integration:**
- No REST API to import from
- No third-party data sources
- Manual user data entry or file upload only

## Webhooks & Callbacks

**Incoming Webhooks:** None (no server)

**Outgoing Webhooks:** None (no external services)

**Internal Event System:**
- Post-save hooks: `registerPostSaveHook(fn)` for live-sync
  - Debounced (150ms) to prevent excessive re-renders
  - Executes after successful persist (localStorage/IndexedDB)
  - Used for DM Screen widget updates, tab content refresh
  
- Tab registry: Auto-render on tab switch
  - Defined in `systems/tab-registry.js`
  - TAB_RENDER_REGISTRY maps tabs to render functions
  - Called automatically by `switchView()`
  
- Event delegation: `data-action` attributes
  - User interactions captured by event delegation
  - Handlers defined in `ui/actions/` modules
  - Decouples HTML from JS for testability

## Cross-Tab Synchronization

**BroadcastChannel API:**
- Channel name: `dnd-tracker-sync` (APP_CONFIG.BROADCAST_CHANNEL)
- Purpose: Keep multiple browser tabs synchronized
- Implementation: `systems/spellslots/persistence.js`
- Trigger: After every `saveImmediate()` call
- Behavior: All open tabs receive data update, re-render affected components

**Broadcast Message Format:**
```javascript
{
  type: 'dataSync',
  data: D,  // Current global data object
  source: 'tab-id'
}
```

**Conflict Resolution:**
- Last-write-wins (simple, sufficient for single-user app)
- No complex merge logic (not needed for offline-first)

## Build-Time Data Processing

**SRD Monster Data (Optional):**
- Tool: `tools/build-srd-monsters.cjs` (Node.js script)
- Source: D&D 5e SRD API (fetched at build time)
- Purpose: Generate bestiary database for embedded reference
- Format: JSON bundled into app (if used)
- Usage: Manual run, not part of default CI build

**Large Dataset Simulation:**
- Build script can inject test data for performance testing
- Used to test with 100+ characters, encounters, etc.
- Not included in production builds

## Network Behavior Summary

**Runtime: Zero External Network Calls**
- Service Worker blocks external requests
- All data local-only
- file:// protocol fully supported
- http://localhost:8000 (dev server) supported
- https://example.com/app (deployed) supported

**Build-Time Network:**
- `tools/fetch-fonts.py` → Google Fonts (only during build)
- `tools/build-srd-monsters.cjs` → D&D SRD (optional, manual)
- Both are development tools, not production dependencies

**CI/CD Network:**
- GitHub Actions runner downloads npm packages
- Downloads Playwright browser binaries
- Deploys built HTML to GitHub Pages

---

*Integration audit: 2026-07-26*
