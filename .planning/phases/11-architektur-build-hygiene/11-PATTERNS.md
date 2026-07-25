# Phase 11: Architektur- & Build-Hygiene - Pattern Map

**Mapped:** 2026-07-25
**Files analyzed:** 10 (build.py, loader.js, index.html, .github/workflows/ci.yml, tests/build/test_build_deduplication.py, tests/e2e/smoke.spec.js, docs/build-system.md, CLAUDE.md, assets/styles.css [read-only source], .planning/codebase/*.md [regenerated, not authored])
**Analogs found:** 10 / 10 (all analogs are intra-file — this is a build-tooling phase, not a feature phase; every "new" file is a modification of an existing build/CI/test file, and the closest analog for each is an adjacent block within the *same* file)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `build.py` (SSoT parser, D-01/D-04) | build-tooling / config-loader | transform (parse loader.js/CSS text → Python list) | `build.py:211-232` `check_module_list_sync()` regex | exact (extend existing regex into full parser) |
| `build.py` (hard-fail on missing file, D-02) | build-tooling / validator | batch (loop over listed files) | `build.py:509-518` module-load loop + `build.py:673-679` `sys.exit(1)`-before-`write_file()` pattern | exact |
| `build.py` (`check_duplicate_functions` extension, D-06) | build-tooling / validator | batch (regex scan over source files) | `build.py:190-208` `check_duplicate_functions()` itself | exact (same function, extended pattern) |
| `build.py` (Pass 3 removal, D-05) | build-tooling / transform | transform (string pipeline) | `build.py:293-371` `deduplicate_window_assignments()` (Pass 1+2, caller of Pass 3) | exact |
| `build.py` (favicon data-URI + meta tag, D-10/D-11) | build-tooling / template-generator | transform (SVG → data-URI, string template) | `build.py:585-601` HTML head f-string template | exact |
| `index.html` (favicon link + meta tag, D-10/D-11) | config / static template | request-response (static HTML head) | `index.html:1-16` head block (paired with `build.py:585-601`, "known drift pair") | exact |
| `.github/workflows/ci.yml` (pytest step, D-03) | CI config | event-driven (job/step pipeline) | `ci.yml:22-31` `test` job (target) + `ci.yml:40-55` `e2e` job (analog for a job that already combines `setup-node` + `setup-python` + `npm ci`) | exact |
| `.github/workflows/ci.yml` (node-version + action majors, D-09) | CI config | event-driven | `ci.yml:14,16` `setup-node@v4` step in `lint-and-typecheck` (repeated 6x identically) | exact |
| `tests/build/test_build_deduplication.py` (D-07 new/rewritten tests) | test / build-gate | request-response (run build, assert exit code + file state) | `tests/build/test_build_deduplication.py:255-270` `test_duplicate_function_check_detects_duplicate` (tmp_path + `pytest.raises(SystemExit)`) | exact |
| `tests/e2e/smoke.spec.js` (D-12 response/console assertions) | test / e2e | event-driven (Playwright page listeners) | `tests/e2e/smoke.spec.js:8-15` existing `pageerror` test | exact |

## Pattern Assignments

### `build.py` — SSoT parser for `loader.js` (D-01/D-04)

**Analog:** `build.py:211-232`, `check_module_list_sync()`

**Existing regex to extend, not replace** (lines 216-221):
```python
content = read_file(loader_path)
match = re.search(r'const MODULES\s*=\s*\[(.*?)\];', content, re.DOTALL)
if not match:
    log.warning("Konnte MODULES-Array nicht aus loader.js parsen — Sync-Pruefung uebersprungen")
    return
loader_modules = re.findall(r"'([^']+)'", match.group(1))
```
This is explicitly named in RESEARCH.md as "der Ausgangspunkt für den SSoT-Parser". D-01 requires the **failure branch to change**: today a failed parse does `log.warning(...); return` (silent skip). The new SSoT parser must instead `sys.exit(1)` on failed parse — same shape as the `[FEHLER]`/`sys.exit(1)` pattern below.

**Error/abort register to copy** (lines 225-231, German `[FEHLER]` prefix, list-then-exit shape):
```python
if only_in_build or only_in_loader:
    print("[FEHLER] Modullisten-Abweichung zwischen loader.js und build.py!")
    for m in sorted(only_in_build):
        print(f"  Nur in build.py: {m}")
    for m in sorted(only_in_loader):
        print(f"  Nur in loader.js: {m}")
    sys.exit(1)
```
New SSoT-parser errors (unparseable `MODULES`/`TEMPLATES` array, unparseable `@import` list) must use the same `[FEHLER] ...` message register and `sys.exit(1)`, not `log.warning`.

**Second array in same file, function-local scope, different regex target** — `loader.js:219-231`:
```javascript
const TEMPLATES = [
    'assets/templates/header.html',
    'assets/templates/view-party.html',
    ...
    'assets/templates/modals-editors.html'
];
```
Note: `TEMPLATES` is declared **inside** `loadModules()` (function scope), not at module top level like `MODULES` (`loader.js:10`) — the parser regex needs a different anchor (`const TEMPLATES\s*=\s*\[(.*?)\];` still works textually since regex doesn't care about JS scope, but document this if using a stricter tokenizer).

**Known live drift to fix as part of this change (RESEARCH.md confirmed):** `loader.js`'s `TEMPLATES` array (11 entries) is missing `'assets/templates/view-bestiary.html'`, present in `build.py:485`'s `html_templates` (12 entries) between `'view-encounters.html'` and `'view-resources.html'`. Must be added to `loader.js:223` (after `view-encounters.html`) as an explicit correction task, not just structurally prevented going forward.

**CSS `@import` order source** (whole file) — `assets/styles.css:5-24`, one `@import url('styles/FILE.css');` per line, no comments interleaved — this is the SSoT for `build.py:450-460`'s `css_files` list. Trivial regex: `re.findall(r"@import url\('styles/([^']+)'\);", content)`.

**Parser-hook sequencing constraint:** `check_module_list_sync`/`check_duplicate_functions` currently run at `build.py:499-501`, **after** the CSS-load loop (448-479) and template-load loop (483-495). Once those loops consume the parsed lists instead of hardcoded ones, the parse step must move to **before line 448** — this is a structural reorder, not an addition.

---

### `build.py` — hard-fail on missing listed file (D-02)

**Analog:** the three existing load loops, currently `log.warning` + continue:

CSS loop (`build.py:462-468`):
```python
for css_file in css_files:
    css_path = f"{SOURCE_DIR}/assets/styles/{css_file}"
    if os.path.exists(css_path):
        css_parts.append(read_file(css_path))
        log.info(f"  {css_file}")
    else:
        log.warning(f"  {css_file} NICHT GEFUNDEN")
```

Module loop (`build.py:509-518`):
```python
for i, module in enumerate(modules, 1):
    module_path = f"{SOURCE_DIR}/{module}"
    if os.path.exists(module_path):
        module_content = read_file(module_path)
        js_combined += f"\n// ========== {module} ==========\n"
        js_combined += module_content + "\n"
        total_js_size += len(module_content)
        log.info(f"[{i}/{len(modules)}] {module}: {len(module_content):,} Zeichen")
    else:
        log.warning(f"[{i}/{len(modules)}] {module} NICHT GEFUNDEN")
```

Template loop (`build.py:491-493`) has **no** existence check at all today (`read_file(tpl_path)` would raise `FileNotFoundError` uncaught) — this is the one loop already "accidentally hard" but with a raw Python traceback instead of a controlled `[FEHLER]` + `sys.exit(1)`.

**Established abort-before-write pattern to replicate for all three** (`build.py:673-679`):
```python
if build_errors:
    print(f"\n[ERROR] {len(build_errors)} Build-Fehler gefunden:")
    for err in build_errors:
        print(f"   ❌ {err}")
    print("\n[ABORTED] Build NICHT geschrieben! Bitte Fehler beheben.")
    sys.exit(1)
```
Also see the DEBUG_MODE-flip abort at `build.py:532-536` for a single-condition variant of the same idiom (`[ABORTED] ...`; `sys.exit(1)`). All three loops' `else: log.warning(...)` branches become `print(f"[FEHLER] ... NICHT GEFUNDEN")` + `sys.exit(1)`.

---

### `build.py` — `check_duplicate_functions()` extension to const/let/class (D-06)

**Analog:** the function itself, `build.py:190-208`:
```python
def check_duplicate_functions(source_dir, modules):
    """Schlaegt fehl, wenn doppelte Top-Level-Funktionsnamen in gebuendelten Quelldateien existieren.
    ...
    """
    func_pattern = re.compile(r'^function\s+(\w+)\s*\(', re.MULTILINE)
    seen = {}
    for module in modules:
        path = os.path.join(source_dir, module)
        if not os.path.exists(path):
            continue
        content = read_file(path)
        for match in func_pattern.finditer(content):
            name = match.group(1)
            if name in seen:
                print(f"[FEHLER] Doppelte Top-Level-Funktion '{name}': {seen[name]} und {module}")
                sys.exit(1)
            seen[name] = module
```
Message format to extend: `f"[FEHLER] Doppelte Top-Level-Deklaration '{name}': {seen[name]} und {module}"` — replace "Funktion" with "Deklaration" once `const`/`let`/`class` are included, per D-06's exact wording ("Doppelte Top-Level-Deklaration X: features/a.js und ui/b.js").

**Depth-tracking alternative (RESEARCH-recommended, reuses proven technique)** — post-build validator at `build.py:657-673`:
```python
depth = 0
top_decls = {}
for i, line in enumerate(js_lines, 1):
    for ch in line:
        if ch == '{': depth += 1
        elif ch == '}': depth -= 1
    if depth == 0:
        m = re.match(r'^\s*(const|let|function)\s+(\w+)', line)
        if m:
            name = m.group(2)
            if name in top_decls:
                build_errors.append(f"FEHLER: Doppelte Deklaration '{name}' auf Zeile {top_decls[name]} und {i}")
            else:
                top_decls[name] = i
```
This brace-depth-0 technique is the "Don't Hand-Roll" recommendation from RESEARCH.md for the pre-check extension — same idiom, reused across two call sites in the same file (pre-check per-file vs. post-build across the whole bundle). Note: this backstop validator **stays unchanged** per CONTEXT.md — only the source-level pre-check (`check_duplicate_functions`) gets the `const`/`let`/`class` extension.

---

### `build.py` — Pass 3 removal (D-05)

**Analog:** the caller, `build.py:293-371` `deduplicate_window_assignments()`, specifically the Pass 2→3 handoff at lines 367-371:
```python
# PASS 3: Remove duplicate function declarations
js_after_pass2 = '\n'.join(filtered_lines)
js_final = remove_duplicate_functions(js_after_pass2)

return js_final
```
Change: delete the `remove_duplicate_functions` call and function body (`build.py:373-425`), return `'\n'.join(filtered_lines)` directly. No other caller exists (verified in RESEARCH.md: `remove_duplicate_functions` is called exactly once, from this line; no test imports it directly).

**Function to delete in full** (`build.py:373-425`) — contains the orphan-bug brace-counting loop at 402-415 that must not survive elsewhere as a copy-paste template.

---

### `build.py` + `index.html` — favicon data-URI / meta tag (D-10/D-11)

**Analog:** the "known drift pair" — both HTML heads must change together.

`build.py:585-601` (bundle head, generated f-string):
```python
html_template = f"""<!DOCTYPE html>
<html lang="de" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#0d0d0d">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="D&D Tracker">
    <meta name="description" content="D&D Kampagnen-Tracker Pro - Modulare Version (Gebündelt)">
    <title>D&D Kampagnen-Tracker Pro</title>
    ...
    <style>
{css_content}
    </style>
</head>
```
Add `<link rel="icon" href="data:image/svg+xml,{favicon_data_uri}">` and `<meta name="mobile-web-app-capable" content="yes">` here; `favicon_data_uri` computed from `icons/icon.svg` via the encoding function in RESEARCH.md's Code Examples section (strip comments, collapse whitespace, escape `"`→`'`, `%`→`%25`, `#`→`%23`, `{`→`%7B`, `}`→`%7D`, `<`→`%3C`, `>`→`%3E`, **`%` first to avoid double-encoding**).

`index.html:1-16` (dev head, static):
```html
<!DOCTYPE html>
<html lang="de" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#0d0d0d">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="D&D Tracker">
    <meta name="description" content="D&D Kampagnen-Tracker Pro - Optimierte Version">
    <title>D&D Kampagnen-Tracker Pro</title>
    <link rel="manifest" href="./manifest.webmanifest">
    <link rel="stylesheet" href="assets/styles.css">
</head>
```
Add `<link rel="icon" href="./icons/icon.svg">` and `<meta name="mobile-web-app-capable" content="yes">` here (file-link variant, not data-URI — `index.html` never runs standalone).

**D-11 empirical verification note:** per RESEARCH.md Pitfall 3, adding `mobile-web-app-capable` alongside `apple-mobile-web-app-capable` likely does NOT silence the Chromium deprecation warning — expect to need to **remove** the `apple-` line at both sites (iOS is not a target platform per PROJECT.md). Verify via the D-12 smoke assertion before deciding.

---

### `.github/workflows/ci.yml` — pytest step in `test` job (D-03)

**Analog A — target job to extend**, `ci.yml:22-31`:
```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npm test
```

**Analog B — job that already combines setup-node + setup-python**, `ci.yml:40-53` (`e2e` job):
```yaml
e2e:
  runs-on: ubuntu-latest
  needs: [lint-and-typecheck, test]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - uses: actions/setup-python@v5
      with:
        python-version: '3.x'
    - run: npm ci
    - run: python build.py
```
New `test` job step shape: add `actions/setup-python@v5` (bump per D-09 table below) + `pip install pytest` (or `-r requirements-dev.txt` if that file is introduced — RESEARCH.md leaves this open) + `pytest tests/build/`, inserted after `npm ci` / `npm test` or as parallel steps within the same job, mirroring the `e2e` job's setup-python placement (before the Python-dependent step).

---

### `.github/workflows/ci.yml` — node-version + action majors (D-09)

**Analog:** any of the six identical `setup-node@v4` blocks, e.g. `ci.yml:13-17`:
```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```
All six occurrences (`lint-and-typecheck`, `test`, `e2e`, `build`, `smoke-test`, `deploy`) need `node-version: '20'` → `'22'`. Action major bumps (verified via GitHub API 2026-07-25, re-verify at execution time per RESEARCH.md caveat):

| Action | Current | Target major |
|---|---|---|
| `actions/checkout` | `@v4` | `@v7` |
| `actions/setup-node` | `@v4` | `@v7` |
| `actions/setup-python` | `@v5` | `@v7` |
| `actions/upload-artifact` | `@v4` | `@v7` |
| `actions/download-artifact` | `@v4` | `@v8` |
| `actions/configure-pages` | `@v5` | `@v6` |
| `actions/upload-pages-artifact` | `@v4` | `@v5` |
| `actions/deploy-pages` | `@v4` | `@v5` |

RESEARCH.md flags `upload-artifact`/`checkout` majors as containing breaking changes (`persist-credentials` default change in checkout@v5, artifact-handling changes in upload-artifact v4→v7) — verify release notes per bump, don't jump blindly to `@latest`.

---

### `tests/build/test_build_deduplication.py` — D-07 test rewrite/replacement

**Analog:** `test_duplicate_function_check_detects_duplicate` (lines 255-270) — the `tmp_path` fixture idiom to extend for `const`/`let`/`class`:
```python
def test_duplicate_function_check_detects_duplicate(self, tmp_path):
    file_a = tmp_path / 'module-a.js'
    file_a.write_text('function duplicateFunction() {\n    return "a";\n}\n', encoding='utf-8')
    file_b = tmp_path / 'module-b.js'
    file_b.write_text('function duplicateFunction() {\n    return "b";\n}\n', encoding='utf-8')

    fake_modules = ['module-a.js', 'module-b.js']

    with pytest.raises(SystemExit):
        check_duplicate_functions(str(tmp_path), fake_modules)
```
New test cases per this pattern: one fixture pair with duplicate top-level `const`, one with duplicate top-level `class` (RESEARCH.md notes 4 real `class` declarations already exist in the codebase — `VirtualList`, `DOMVirtualList`, `SafeRender`, `BatchUpdater` — so this is not hypothetical coverage).

**Import block to extend** (`tests/build/test_build_deduplication.py:19`):
```python
from build import deduplicate_window_assignments, build, check_duplicate_functions, check_module_list_sync, MODULES
```
Once D-01 replaces `check_module_list_sync` with the SSoT parser, this import line changes to whatever the new parser function is named (CONTEXT.md leaves naming/whether `MODULES` stays importable to the planner's discretion).

**`test_module_lists_are_synchronized` (lines 243-253) — must be rewritten**, not just extended:
```python
def test_module_lists_are_synchronized(self):
    loader_path = Path(__file__).parent.parent.parent / 'loader.js'
    try:
        check_module_list_sync(str(loader_path), MODULES)
    except SystemExit:
        pytest.fail("Modullisten-Abweichung zwischen loader.js und build.py!")
```
New version calls the SSoT parser and asserts every parsed path exists on disk (there is no second list to diff against anymore under D-01).

**`test_no_orphaned_return_statements` (lines 272-306) — replaced by D-07's two garantees**, not deleted outright:
1. Regression: no `[DEDUP] Removed duplicate function` marker in the built bundle (grep-style check on `dist/dnd-tracker-bundled.html`, same `dist_file`/`pytest.skip`-if-absent idiom as this and every other bundle-inspecting test in this file, e.g. `test_full_build_has_no_duplicate_declarations` lines 106-121).
2. Behavioral: build a fixture with a source-level duplicate `const`, assert the build **exits non-zero** (use a subprocess call to `build.py` or call `build()` directly wrapped in `pytest.raises(SystemExit)`, matching the `tmp_path` idiom above) **and** no output file is written/changed.

**Skip-if-absent idiom used throughout the file** (repeat for any new bundle-inspecting test), e.g. `test_full_build_has_no_duplicate_declarations` lines 111-114:
```python
dist_file = Path(__file__).parent.parent.parent / 'dist' / 'dnd-tracker-bundled.html'
if not dist_file.exists():
    pytest.skip("Build file nicht gefunden, führe zuerst 'python build.py' aus")
```

---

### `tests/e2e/smoke.spec.js` — D-12 response/console assertions

**Analog:** the existing `pageerror` listener test, lines 8-15:
```javascript
test('App bootet ohne Konsolen-Fehler', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BASE_URL);
    await page.waitForSelector('.app-title', { timeout: 15000 });
    await page.waitForTimeout(1000);
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
});
```
Note the **existing favicon-error exemption** at line 14 (`e.filter(e => !e.includes('favicon'))`) — this exemption exists *because* the favicon 404 was a known, previously-accepted gap. Once D-10 closes it, this filter becomes misleading (a real favicon error would now be silently exempted) — the planner should either remove the `.filter()` or keep it but add the new explicit 404-check below, which makes the exemption redundant/vestigial and worth flagging for removal in the same change.

**BASE_URL / file:// construction to reuse unchanged**, lines 4-6:
```javascript
const BASE_URL =
    process.env.SMOKE_BASE_URL ||
    `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
```

**New assertions — exact code from RESEARCH.md's Code Examples section (already API-corrected for the `requestfailed`-vs-`response` pitfall)**:
```javascript
const KNOWN_DEPRECATION_STRINGS = [
    'apple-mobile-web-app-capable',
];

test('Keine Favicon-404 und keine Meta-Tag-Deprecation', async ({ page }) => {
    const failed404s = [];
    const consoleWarnings = [];

    // page.on('response') is correct for HTTP status — requestfailed only
    // fires on true network errors (DNS/abort), never on a 404 (a 404 is a
    // complete, "successful" response from the network's point of view).
    page.on('response', response => {
        if (response.status() === 404) failed404s.push(response.url());
    });
    page.on('console', msg => {
        const text = msg.text();
        if (KNOWN_DEPRECATION_STRINGS.some(s => text.includes(s))) {
            consoleWarnings.push(text);
        }
    });

    await page.goto(BASE_URL);
    await page.waitForSelector('.app-title', { timeout: 15000 });

    expect(failed404s).toHaveLength(0);
    expect(consoleWarnings).toHaveLength(0);
});
```
Runs against `dist/dnd-tracker-optimized.html` over HTTP in CI (per `ci.yml:85-111` `smoke-test` job, `SMOKE_BASE_URL` env var) — the favicon 404 is invisible under `file://` (WHATWG spec: implicit favicon fetch only happens "for documents obtained over HTTP or HTTPS"), so this assertion is only meaningful in the HTTP-served CI path, not a local `file://` run.

**Tab-sweep loop pattern to reuse for `page.on` wiring style** (lines 17-32) — shows the project's convention for per-test listener registration inside a `for` loop if the new assertion needs to run per-tab rather than once at boot.

---

## Shared Patterns

### German `[FEHLER]` abort register
**Source:** `build.py:226` (`print("[FEHLER] Modullisten-Abweichung...")`), `build.py:206` (`print(f"[FEHLER] Doppelte Top-Level-Funktion...")`), `build.py:534` (`print("[ABORTED] DEBUG_MODE ist noch true...")`), `build.py:679` (`print("\n[ABORTED] Build NICHT geschrieben!...")`)
**Apply to:** every new `sys.exit(1)` path introduced by D-01/D-02/D-06 — use `[FEHLER]` for detection messages, `[ABORTED]` for the final "nothing was written" confirmation, always followed immediately by `sys.exit(1)`, never `log.warning` + continue.
```python
print(f"[FEHLER] <condition>: <detail>")
sys.exit(1)
```

### Abort-before-write invariant
**Source:** `build.py:673-685` — all `sys.exit(1)` calls in `build()` occur before the `write_file(output_file, html_template)` call at line 685.
**Apply to:** any new validation added under D-01/D-02/D-06 must be positioned in the function body before line 685, never after — this is the literal mechanism behind "kein still kaputtes Bundle mehr".

### `tmp_path` + `pytest.raises(SystemExit)` test idiom
**Source:** `tests/build/test_build_deduplication.py:255-270`
**Apply to:** all new D-06/D-07 tests that need isolated fixture source files without touching the real `dist/` or source tree.

### `dist_file.exists()` → `pytest.skip(...)` guard
**Source:** `tests/build/test_build_deduplication.py:111-114`, `149-152`, `199-202`, `231-233`, `279-281` (five occurrences)
**Apply to:** any new test in this file that inspects a built bundle — keeps the suite runnable without requiring a prior local build.

### `page.on(...)` + `expect(...).toHaveLength(0)` assertion idiom
**Source:** `tests/e2e/smoke.spec.js:9-14`
**Apply to:** the new D-12 test — collect into an array via a listener registered before `page.goto`, assert empty length after `waitForSelector`.

## No Analog Found

None — every file in scope for Phase 11 is a modification of an existing build/CI/test/doc file; there are no wholly new source modules being created (confirmed against CONTEXT.md/RESEARCH.md file lists). `11-CONCERNS-TRIAGE.md` and the regenerated `.planning/codebase/*.md` files are excluded per the phase-specific note (planning artifacts with no code analog, produced by hand / by `/gsd-map-codebase`).

## Metadata

**Analog search scope:** `build.py`, `loader.js`, `assets/styles.css`, `index.html`, `.github/workflows/ci.yml`, `tests/build/test_build_deduplication.py`, `tests/e2e/smoke.spec.js`
**Files scanned:** 7 source/config files fully read (no >2000-line files in this phase; all reads were single-pass, non-overlapping)
**Pattern extraction date:** 2026-07-25
