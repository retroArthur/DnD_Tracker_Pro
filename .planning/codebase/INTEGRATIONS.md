# External Integrations

**Analysis Date:** 2026-06-11

## APIs & External Services

**Runtime external services: NONE.** The app is deliberately offline-first. No REST APIs, no SDKs, no analytics, no third-party JS. The only network requests at runtime are:

**Web Fonts (only external dependency):**

- Google Fonts - loaded via `<link>` tags
    - Dev shell: `index.html:13-15` (Roboto)
    - Built bundle: `build.py:449-451` (Inter, Poppins, Roboto, Source Sans Pro) - used by the rich-text editor font picker (`EDITOR_FONTS` in `core/constants.js`)
    - Auth: none. Graceful degradation: the Service Worker returns an empty 503 response for external origins when offline (`sw.js:47-57`), so missing fonts never break the app.

**Self-fetches (same-origin only):**

- `loader.js:193` - fetches the 10 HTML templates from `assets/templates/` in dev mode
- `core/init.js:191` - HEAD request to `./sw.js` to detect hosted mode before SW registration

## Data Storage

**Databases (all browser-local):**

- **localStorage** (primary persistence)
    - Wrapper: `StorageAPI` in `utils/basic.js:158` (quota/SecurityError handling, JSON helpers)
    - Keys (defined in `core/config.js`): `dnd-tracker-v4` (default campaign data), `dnd-campaign-<timestamp>` (additional campaigns), `dnd-tracker-campaigns` (campaign index), `dnd-tracker-backups`, `dnd-tracker-theme`, `dnd-tracker-layout`, `dnd-dice-favorites`, `dnd-timer-presets`
    - Active campaign key resolution: `window.STORAGE_KEY_OVERRIDE` set in `core/init.js:28-30` from the campaign index (`systems/campaign-manager/campaign-manager.js:11-16`)
- **IndexedDB** `dnd-tracker-db` (version 2)
    - Wrapper: `initIndexedDB()` / `saveToIndexedDB()` in `core/init.js:230-277`
    - Object stores: `campaigns` (keyPath `id`), `backups` (keyPath `id`, indexes `date` + `campaign`), `images`
    - Used as: automatic fallback when campaign data exceeds ~5MB localStorage limit (`systems/spellslots/persistence.js:33-40`), redundant backup target for data >2MB (`persistence.js:50-52`), primary store for auto-backups (`systems/backups.js`), and load fallback when localStorage is empty (`systems/spellslots/quick-roll.js:33-45`)

**File Storage:**

- Local filesystem only, via manual user-triggered download/upload:
    - JSON export/import of campaign data: `systems/spellslots/import-export.js`
    - Markdown import/export: `systems/markdown-import-export.js`
    - Shop handout HTML export: `features/shops/shop-export.js`
- Avatars/images are URL-based (http(s) or base64 `data:` URLs validated in `systems/avatars.js:6`); no upload service.

**Caching:**

- Service Worker cache `dnd-tracker-v2` (`sw.js:4`) - cache-first with stale-while-revalidate for same-origin assets, network-only for external origins. Caches `./`, `./index.html`, `./loader.js`, `./assets/styles.css`, `./assets/body.html` (note: `assets/body.html` is a legacy reference; templates now live in `assets/templates/`).

## Authentication & Identity

**Auth Provider:**

- None. Single-user, local-only application. No accounts, no login, no session handling.

## Monitoring & Observability

**Error Tracking:**

- No external service. Internal only:
    - `ErrorHandler` ring buffer (last 50 errors) in `render/helpers.js:9-74`, with debounced error toasts
    - Global `window.onerror` / `onunhandledrejection` hooks installed in `core/init.js:7-19`
    - Debug log panel: `tools/debug.js` (`debugLogAdd`)

**Logs:**

- `log()` in `utils/performance.js:9` - console logging gated by `APP_CONFIG.DEBUG_MODE` (stripped to no-op in production builds)

## CI/CD & Deployment

**Hosting:**

- No platform configured in-repo. Output is a standalone HTML file (`dist/dnd-tracker-optimized.html`) usable from any static host or directly via `file://`.

**CI Pipeline:**

- GitHub Actions: `.github/workflows/ci.yml`
    - Job `lint-and-typecheck`: Node 20, `npm run typecheck` + `npm run lint`
    - Job `test`: `npm test` (Jest)
    - Job `build` (needs both): Node 20 + Python 3.x, `python build.py --production`, uploads `dist/dnd-tracker-optimized.html` as artifact (7-day retention)
    - Note: Playwright E2E tests are NOT run in CI (local only via `npm run test:e2e`)

## Environment Configuration

**Required env vars:**

- None at runtime.
- Dev-only: `PYTHONIOENCODING=utf-8` recommended on Windows for `build.py` console output.
- CI-only: `process.env.CI` toggles Playwright retries/workers (`playwright.config.js:24-30`).

**Secrets location:**

- No secrets exist in this project (no API keys, no tokens, no `.env` files).

## Webhooks & Callbacks

**Incoming:**

- None (no server).

**Outgoing:**

- None.

## Browser Platform Integrations

**PWA:**

- Inline web app manifest (data: URL) in `index.html:12` and `build.py:448`
- Install prompt handling (`beforeinstallprompt`, 30s-delayed banner, dismissal stored in localStorage): `systems/spellslots/pwa-install.js`
- Offline indicator via `online`/`offline` events: `core/init.js:207-222`

**Multi-Tab Sync:**

- `BroadcastChannel('dnd-tracker-sync')` for cross-tab save conflict detection: `initConflictDetection()` / `broadcastSave()` in `systems/undo.js:137-163`, channel name from `APP_CONFIG.BROADCAST_CHANNEL`

---

_Integration audit: 2026-06-11_
