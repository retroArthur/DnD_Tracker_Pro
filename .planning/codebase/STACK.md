# Technology Stack

**Analysis Date:** 2026-07-26

## Languages

**Primary:**
- JavaScript (ES2020) - Core application logic
  - 123 modules across `core/`, `utils/`, `systems/`, `features/`, `ui/`, `render/` directories
  - Non-ESM architecture: uses `<script>` tags and global scope (no `import`/`export`)
  - Module loading via `loader.js` (dev mode) or concatenated by `build.py` (production)

**Secondary:**
- HTML5 - 12 template files in `assets/templates/` (~5,100 lines)
- CSS3 - 20 modular stylesheets in `assets/styles/` (~27k lines)
  - Organized by feature: fonts, variables, core, editors, npcs, encounters, initiative, loot, spells, party, dashboard, dmscreen, dice, tools, pwa, migration, file-backup, command-palette, bestiary, welt
  - Development: imported via `@import` in `assets/styles.css`
  - Production: concatenated by `build.py`

**Build/Infrastructure:**
- Python 3 - Build system (`build.py`), font downloading (`tools/fetch-fonts.py`), validation
- TypeScript 5.9.3 - Type checking only (no compilation), 60 valid `.d.ts` declaration files

## Runtime

**Browser Environment:**
- Chrome/Chromium 90+, Firefox 88+, Edge 90+
- Offline-first: fully functional without network
- Works from `file://` protocol (single HTML file distribution)
- No server required for runtime

**Node.js (Development Only):**
- Version: 18.0.0+ (minimum requirement per `package.json`)
- CI Pipeline: Node.js 22.x (LTS maintenance until 2027-04)
- Package Manager: npm with lockfile (`package-lock.json`)

**Python (Development Only):**
- Version: 3.x (3.8+ recommended)
- CI Pipeline: `python-version: '3.x'`
- Used for: Build script, font downloading, build system tests (pytest)

**Service Worker:**
- Cache version: `dnd-tracker-v3`
- Strategy: Cache-first for all same-origin assets
- Supports: Offline mode, asset caching, fallback to bundled HTML

## Frameworks & Core Tools

**Build System:**
- `build.py` - Custom Python build script (632 lines)
  - Reads module list from `loader.js` MODULES array
  - Reads template list from `loader.js` TEMPLATES array
  - Reads CSS order from `assets/styles.css` @import hub
  - Concatenates 123 JS modules + 20 CSS files + 12 HTML templates into single HTML file
  - Two-pass deduplication system for window variable conflicts
  - Pre-build check: `check_duplicate_functions()` scans for top-level declaration collisions
  - Optional minification via `--minify` flag
  - Production mode via `--production`: disables DEBUG_MODE, minifies everything
  - Output: `dist/dnd-tracker-bundled.html` (dev) or `dist/dnd-tracker-optimized.html` (prod)

**Module Loading:**
- `loader.js` - 350 lines defining 123 modules in dependency order
- Development mode: sequentially loads modules as `<script>` tags
- Production mode: `build.py` concatenates into single file
- Strict ordering enforced to avoid undefined dependencies

**Testing Frameworks:**
- Jest 30.2.0
  - Configuration: `jest.config.cjs`
  - Environment: jsdom (browser DOM simulation)
  - Transforms: babel-jest (ES2020), ts-jest (TypeScript)
  - Tests located in `tests/unit/` and `tests/`
  - Coverage thresholds: 80% for `utils/testable-utils.js`
  
- Playwright 1.57.0
  - Configuration: `playwright.config.js`
  - Target: Chromium browser
  - Viewport: 1920x1080
  - Tests run against bundled HTML (`file://` protocol)
  - Screenshots/videos/traces on failure
  - Additional smoke test config: `playwright.smoke.config.js` (HTTP mode)

**Code Quality:**
- ESLint 9.39.2
  - Config: `eslint.config.js` (flat config format)
  - Extends: @eslint/js, typescript-eslint, eslint-config-prettier
  - Supports: Browser globals (localStorage, indexedDB, fetch, etc.), app globals (D, $, save, etc.)
  
- Prettier 3.7.4
  - Config: `.prettierrc`
  - Settings: 4-space indentation, single quotes, semicolons, 100-char line width, no trailing commas
  
- TypeScript 5.9.3
  - Config: `tsconfig.json`
  - Mode: Type checking only (`tsc --noEmit`), no code generation
  - Target: ES2020
  - Path aliases: `@core/*`, `@features/*`, `@ui/*`, `@utils/*`, `@systems/*`, `@render/*`
  - Declaration files: 60 valid `.d.ts` files

**Build Utilities:**
- `tools/fetch-fonts.py` - Downloads Google Fonts WOFF2 files at build time (D-07)
- `tools/logging_util.py` - Logging helper for build script
- `build_wrapper.py` - UTF-8 output wrapper for Windows (PYTHONIOENCODING workaround)

## Key Dependencies

**Runtime Dependencies:**
- ZERO runtime dependencies
- Application is pure vanilla JavaScript, HTML, CSS
- All functionality implemented with native browser APIs

**Development Dependencies (npm):**
- `@babel/core` 7.23.0 - JavaScript transpiler
- `@babel/preset-env` 7.23.0 - ES2020 preset
- `@eslint/js` 9.39.2 - ESLint rules
- `@playwright/test` 1.57.0 - E2E test framework
- `@types/jest` 30.0.0, `@types/node` 25.0.3 - TypeScript definitions
- `eslint` 9.39.2 - Linter
- `eslint-config-prettier` 10.1.8, `eslint-plugin-prettier` 5.5.4 - Prettier integration
- `jest` 30.2.0, `jest-environment-jsdom` 30.2.0 - Unit test framework
- `prettier` 3.7.4 - Code formatter
- `ts-jest` 29.4.6 - TypeScript Jest transformer
- `ts-loader` 9.5.4 - TypeScript loader (unused, kept for compatibility)
- `typescript` 5.9.3 - Type checker
- `typescript-eslint` 8.50.1 - TypeScript ESLint plugin

**Browser APIs (No Libraries):**
- localStorage - Wrapped by `StorageAPI` in `utils/basic.js`
- IndexedDB - Wrapped in `systems/spellslots/persistence.js`
- Service Worker - Implemented in `sw.js`
- Fetch API - Used for module loading and SW network requests
- BroadcastChannel - Multi-tab synchronization
- DOMParser - HTML sanitization
- structuredClone - Deep object cloning (with JSON polyfill fallback)

## Configuration

**Core Configuration (`core/config.js`):**
- APP_CONFIG object (frozen) containing:
  - VERSION: 2.6.1
  - DEBUG_MODE: true (set to false in production build)
  - DEBUG_VALIDATE_ON_SAVE: true
  - Storage keys: STORAGE_KEY, BACKUP_KEY, CAMPAIGN_INDEX_KEY, THEME_KEY, LAYOUT_KEY
  - IndexedDB: IDB_NAME = 'dnd-tracker-db'
  - Service Worker cache: SW_CACHE_NAME = 'dnd-tracker-v2'
  - Timing: BACKUP_INTERVAL (5 min), AUTOSAVE_DELAY (1.5s), DEBOUNCE_DELAY (300ms), THROTTLE_DELAY (100ms)
  - Limits: UNDO_LIMIT (30 states), MAX_BACKUPS (5), MAX_BACKUP_SIZE_MB (2)

**Build Configuration:**
- `build.py` - Reads lists from loader.js, configures minification and production mode
- `jest.config.cjs` - Module aliases, test environment setup, coverage thresholds
- `playwright.config.js` - Timeout 30s, expect timeout 5s, parallel testing, file:// protocol
- `tsconfig.json` - ES2020 target, DOM lib, allowJs: true, declaration files
- `eslint.config.js` - Browser globals, app globals, ES2022 syntax
- `.prettierrc` - Formatting rules

**Development Configuration:**
- `.nvmrc` - Node version (if used with nvm, not committed to repo)
- No `.env` file (no environment variables needed)
- Windows note: Set `PYTHONIOENCODING=utf-8` before running `python build.py`

## Platform Requirements

**Development:**
- Node.js 22.x (LTS)
- Python 3.8+
- npm package manager
- Git (for version control)
- Bash/PowerShell (for CI/CD)

**Production Browser:**
- JavaScript enabled
- localStorage support (5-10MB per origin)
- IndexedDB support (for campaigns >5MB)
- Service Worker support (offline functionality)
- WebP or PNG image support
- CSS3 Grid and Flexbox support
- Modern ES2020 JavaScript support

**Deployment:**
- Static file hosting or file:// protocol
- Single HTML file: `dnd-tracker-optimized.html`
- Additional files for offline: `manifest.webmanifest`, `icons/`, `assets/fonts/`
- GitHub Pages (auto-deployed via CI/CD)

## Build Output

**Development Bundle:**
- File: `dist/dnd-tracker-bundled.html` (~3.05 MB)
- Format: Single HTML file with concatenated modules
- Features: Unminified, DEBUG_MODE enabled, source comments preserved
- Purpose: Local testing and debugging

**Production Bundle:**
- File: `dist/dnd-tracker-optimized.html` (~2.66 MB minified)
- Format: Single HTML file, minified CSS/JS/HTML
- Features: DEBUG_MODE disabled, optimized for deployment
- Purpose: GitHub Pages deployment and end-user distribution

**Deployment Assets:**
- `manifest.webmanifest` - PWA manifest for installability
- `icons/icon-192.png`, `icons/icon-512.png` - App icons
- `assets/fonts/*.woff2` - 10 font files (~212 KB total)
  - Roboto (400, 700)
  - Inter (400, 500, 600)
  - Poppins (400, 500, 600)
  - Source Sans 3 (400, 600)

## CI/CD Pipeline

**GitHub Actions Workflow (.github/workflows/ci.yml):**
1. **lint-and-typecheck** - Node 22, ESLint + TypeScript type check
2. **test** - Node 22 + Python 3.x, Jest unit tests + pytest build tests
3. **e2e** - Playwright tests (requires lint + test to pass)
4. **build** - Production build (requires e2e to pass)
5. **smoke-test** - Quick validation on production bundle
6. **deploy** - GitHub Pages (main branch only)

**Test Coverage:**
- Unit tests: 621 tests passing (Jest)
- E2E tests: 318 tests passing (Playwright)
- Build system: pytest for deduplication validation

---

*Stack analysis: 2026-07-26*
