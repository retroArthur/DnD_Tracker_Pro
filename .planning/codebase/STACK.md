# Technology Stack

**Analysis Date:** 2026-06-11

## Languages

**Primary:**

- JavaScript (ES2020+) - All runtime code in `core/`, `utils/`, `systems/`, `render/`, `features/`, `ui/` (92 modules, ~29k lines). **Non-ESM**: no `import`/`export`; everything lives in global scope and is loaded via `<script>` tags or concatenated by the build.
- HTML - 10 modular templates in `assets/templates/` (4,334 lines total), shell in `index.html`
- CSS - 13 modular files in `assets/styles/` (~22k lines), imported via `assets/styles.css` (@import hub)

**Secondary:**

- Python 3 - Build system (`build.py`, `build_wrapper.py`, `validate.py`, `tools/*.py`). No runtime role.
- TypeScript - **Type-checking only**, no `.ts` runtime sources. `tsc --noEmit` validates `.js` files against hand-maintained `.d.ts` declaration files (60 `.d.ts` files co-located with modules plus `types/entities.d.ts`, `types/globals.d.ts`, `types/index.d.ts`). `tsconfig.json` uses `allowJs: true`, `emitDeclarationOnly: true`, target ES2020.

## Runtime

**Environment:**

- Browser (Chromium/Chrome/Edge primary, Firefox supported). Runs fully offline; works from `file://` or any static HTTP server. No backend server exists.
- Node.js >= 18 (`package.json` engines) - dev tooling only (Jest, ESLint, Playwright). CI uses Node 20.
- Python 3.x - required to run `build.py` (CI uses `python-version: '3.x'`).

**Package Manager:**

- npm
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**

- **None.** Zero runtime dependencies - `package.json` has no `dependencies`, only `devDependencies`. The app is vanilla JS/HTML/CSS with a custom module loader (`loader.js`).

**Testing:**

- Jest 30 (`jest.config.cjs`) - unit/integration tests, `jsdom` environment, `babel-jest` + `ts-jest` transforms, setup file `tests/setup.js`
- Playwright 1.57 (`playwright.config.js`) - E2E tests against the **built bundle** (`baseURL: file:///.../dist/dnd-tracker-bundled.html`), Chromium project only, 1920x1080 viewport
- pytest-style Python tests for the build system: `tests/build/test_build_deduplication.py`

**Build/Dev:**

- `build.py` (Python) - sole build system. Concatenates 92 JS modules + 13 CSS files + 10 HTML templates into one standalone HTML file. Includes a three-pass deduplication step (`build.py:96-228`), optional minification, production debug-flag stripping (`build.py:419-423`), and post-build integrity validation that aborts on duplicate top-level declarations (`build.py:485-534`).
- `build_wrapper.py` - UTF-8 stdout wrapper for Windows (`PYTHONIOENCODING` workaround)
- `loader.js` - dev-mode module loader; sequentially injects all 92 `<script>` tags and fetches the 10 HTML templates, then calls `init()`
- ESLint 9 (flat config, `eslint.config.js`) with `typescript-eslint` and `eslint-config-prettier`; app globals (`D`, `$`, `esc`, `save`, ...) declared as ESLint globals
- Prettier 3 (`.prettierrc`: 4-space indent, single quotes, semicolons, printWidth 100, no trailing commas)
- TypeScript 5.9 (`tsc --noEmit` via `npm run typecheck`)
- Babel (`@babel/core`, `@babel/preset-env`) - Jest transform only

## Key Dependencies

**Critical (all devDependencies - nothing ships to the browser):**

- `jest` 30 + `jest-environment-jsdom` 30 - unit test runner
- `@playwright/test` 1.57 - E2E runner
- `typescript` 5.9 + `typescript-eslint` 8 - type checking of JS via `.d.ts`
- `eslint` 9 + `prettier` 3 - lint/format
- `ts-jest` / `ts-loader` - TS support in Jest (ts-loader is a webpack leftover; webpack itself was removed)

**Infrastructure (browser-native APIs, no libraries):**

- `localStorage` via `StorageAPI` wrapper (`utils/basic.js:158`)
- `IndexedDB` (`dnd-tracker-db`) via wrapper in `core/init.js:230-277`
- `BroadcastChannel` for multi-tab sync (`systems/undo.js:140`)
- Service Worker (`sw.js`) for offline caching
- `DOMParser` for HTML sanitization (`utils/basic.js:44`)
- `structuredClone` with JSON polyfill fallback

## Configuration

**Environment:**

- No environment variables, no `.env` files, no secrets. All configuration is the frozen `APP_CONFIG` object in `core/config.js` (version, storage keys, timing constants, limits, debug flags).
- `APP_CONFIG.DEBUG_MODE: true` in source; the production build rewrites it to `false` via string replacement in `build.py:421`.
- User-facing settings persist in `D.settings` (theme, lastView, markdown options).

**Build:**

- `build.py` - module order list (`build.py:249-355`, must stay in sync with `loader.js` MODULES array)
- `tsconfig.json` - path aliases `@core/*`, `@features/*`, `@ui/*`, `@utils/*`, `@systems/*`, `@render/*`, `@types/*` (mirrored in `jest.config.cjs` moduleNameMapper)
- `eslint.config.js`, `.prettierrc`, `.prettierignore`
- `jest.config.cjs`, `playwright.config.js`

## Platform Requirements

**Development:**

- Node.js >= 18, npm, Python 3.x
- Windows note: set `PYTHONIOENCODING=utf-8` before `python build.py` (or use `build_wrapper.py`)
- Dev server: `npm run dev` (Python `http.server` on :8000); dev mode loads `index.html` + `loader.js` with live modules

**Production:**

- Output: `dist/dnd-tracker-bundled.html` (dev build) / `dist/dnd-tracker-optimized.html` (production build, minified, debug off)
- Deploy target: any static file host, or distribute the single HTML file directly (works via `file://`). `dist/` is gitignored; CI uploads the production build as an artifact.
- Browser support: Chrome/Edge (Chromium) and Firefox tested; Safari may have minor CSS differences. PWA-installable (inline manifest in `index.html:12`).

---

_Stack analysis: 2026-06-11_
