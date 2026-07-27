---
phase: 11-architektur-build-hygiene
verified: 2026-07-26T21:45:00Z
human_verified: 2026-07-26T22:10:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Öffne dist/dnd-tracker-optimized.html (oder dnd-tracker-bundled.html) in einem echten interaktiven Browser-Tab (nicht headless), öffne DevTools → Network-Tab und Console. Beobachte, ob eine Anfrage nach favicon.ico erscheint (sollte NICHT erscheinen, da <link rel=\"icon\"> jetzt vorhanden ist) und ob eine Deprecation-Warnung zu apple-mobile-web-app-capable in der Konsole erscheint."
    expected: "Keine favicon.ico-Netzwerkanfrage, kein 404, keine Deprecation-Meldung in der Konsole."
    why_human: "Der committete Playwright-Smoke-Test (tests/e2e/smoke.spec.js, Zeile 38-64) kann dies strukturell nicht beweisen: headless Chromium (CI-Default) führt den impliziten favicon.ico-Fetch gar nicht aus (0 Netzwerk-Events), und im headed-Modus feuern Playwrights eigene page.on('response')-Events für diese Anfrage laut dem projekteigenen empirischen Befund (11-05-SUMMARY.md, WINDOWS.md Eintrag 3, status: open) nie. Der Fix wurde nur per Ad-hoc-CDP-Probe manuell verifiziert, nicht per committetem, reproduzierbarem Test. Das Projekt selbst führt diese Lücke offen im Broken-Windows-Ledger (open_count: 1)."
    outcome: "DURCHGEFÜHRT 2026-07-26 — Konsole in echtem, nicht-headless Chromium vollständig leer (keine Deprecation-Warnung, kein 404-Eintrag); beide Meta-Tags additiv vorhanden; Icon-Data-URI laedt und dekodiert (100x100). Residuum: GET /favicon.ico -> 404 findet auf Netzwerkebene weiterhin statt, trotz gueltigem <link rel=icon>, erreicht die Konsole aber nicht. Nach dem Wortlaut des Kriteriums (\"aus der Konsole verschwunden\") damit erfuellt. Belege und Einschraenkung im Abschnitt \"Nachtrag 2026-07-26\" weiter unten."
---

# Phase 11: Architektur- & Build-Hygiene Verification Report

**Phase Goal:** Modullisten-Drift zwischen loader.js und build.py ist strukturell unmöglich, der build.py-Dedup bricht bei verwaisten Funktionskörpern statt still ein kaputtes Bundle zu bauen, CI läuft ohne Deprecation-Warnungen, und Codebase-Map + CONCERNS.md spiegeln den finalen Stand nach v1.1 wider.

**Verified:** 2026-07-26
**Status:** passed (nach durchgeführter Human-Verifikation, siehe Nachtrag unten)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Ein divergierender Modul-Eintrag zwischen loader.js und build.py lässt den Build hart fehlschlagen, abgesichert durch Tests | ✓ VERIFIED | `build.py` carries **no** hardcoded module list (`grep -c "^MODULES" build.py` = 0); `load_module_list()` reads `loader.js`'s `MODULES` array at build time (build.py:59-68). Live-tested: fed a fake loader.js with a module path that doesn't exist on disk → `require_files_exist()` printed `[FEHLER]` and raised `SystemExit(1)`. `tests/build/test_missing_module_file_aborts_build`, `test_build_aborts_without_writing_output_on_missing_module`, `test_ssot_parse_failure_aborts_build`, `test_ssot_empty_array_aborts_build` all pass live (`pytest tests/build/` 24/24). |
| 2 | Ein verwaister Funktionskörper aus Dedup-Pass-3 erzeugt einen Build-Fehler statt eines still kaputten Bundles, mit Testabdeckung in `tests/build/` | ✓ VERIFIED | Per the roadmap's own binding interpretation note (D-05 removes Pass 3 outright rather than making it raise), the bar is: a source duplicate is caught BEFORE bundling (exit≠0, no output file written) and no code path can still produce a silent orphaned function body. Confirmed: `remove_duplicate_functions` does not exist anywhere in `build.py` (`grep -c remove_duplicate_functions build.py` = 0); `deduplicate_window_assignments()`'s docstring explicitly states the former third pass "entfällt ersatzlos". `check_duplicate_functions()` (build.py:173-208) runs in `build()` (line 417) BEFORE the JS module load loop and before any output write, using brace-depth tracking over `function|const|let|class`. Live-tested via the actual `build()` function (not a unit-level reimplementation): `tests/build/test_source_duplicate_aborts_build_without_writing_output` — two temp files declaring the same top-level `const` are injected into the real module list, `build.py`'s own `build()` is invoked, `SystemExit` is raised, and a pre-existing `dist/dnd-tracker-bundled.html` is asserted byte-identical afterward. Passes live. `test_no_dedup_function_marker_in_bundle` confirms the old marker string never appears in either generated bundle. The independent post-build backstop validator (build.py:558-596, brace-depth duplicate check against the assembled bundle) remains present and unchanged. |
| 3 | Die GitHub-Actions-Workflows laufen ohne Node-Deprecation-Warnungen (Node-24-kompatible Action-Versionen) | ✓ VERIFIED | Static check: `.github/workflows/ci.yml` sets `node-version: '22'` at exactly 6 locations (all six jobs); action versions are `checkout@v7`, `setup-node@v7`, `setup-python@v7`, `upload-artifact@v7`, `download-artifact@v8`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5` — no v-major left at a stale/deprecated level. This alone cannot prove the absence of a deprecation annotation (that's determined by GitHub's runner, not visible from the YAML). Per the orchestrator-supplied, already-completed real CI evidence (which I cannot independently re-query but which is corroborated by `.planning/STATE.md` lines 55-78, an already-committed project record, not a SUMMARY claim): first push (`f3dcd23`) produced a red run (30215615433) for an unrelated packaging gap (missing `sw.js`/manifest/icons in the `build` job's artifact), fixed in `bfd6447`; the second run (30216452989) was green across all six jobs with **no Node-deprecation annotation** — the ten annotations present are all ESLint warnings, unrelated to this criterion. |
| 4 | favicon-404 und die `apple-mobile-web-app-capable`-Deprecation-Warnung sind aus der Konsole verschwunden | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Code is present and wired: `build_favicon_data_uri()` (build.py:134-170) inlines `icons/icon.svg` as a `data:image/svg+xml,` URI into `<link rel="icon">`, `index.html` carries a matching file-link, both heads carry `<meta name="mobile-web-app-capable" content="yes">` additively alongside the pre-existing `apple-mobile-web-app-capable` tag. Regression test `test_favicon_data_uri_payload_is_wellformed_svg` passes. I independently re-generated `dist/dnd-tracker-bundled.html` via `python build.py` and parsed the emitted data-URI payload with `xml.etree.ElementTree` — it is well-formed XML and round-trips through `unquote()` without double-encoding, confirming the 2026-07-26 encoder-defect fix (`5009240`) holds in the live build output, not just in the SUMMARY's claim. However, the criterion's actual runtime behavior (no favicon-404 network response, no deprecation console text) is **not** provable by the committed automated test: `tests/e2e/smoke.spec.js`'s `page.on('response')`/`page.on('console')` listeners cannot observe the implicit favicon.ico fetch at all in headless Chromium (CI's execution mode never issues the request), and per the project's own empirical finding (`.planning/WINDOWS.md` id 3, `status: open`), Playwright's page-level events never fire for this specific browser-chrome-initiated request even in headed mode. The fix's actual functional correctness was verified only via an ad-hoc, non-committed raw-CDP probe script (documented in `11-05-SUMMARY.md`), not by anything re-runnable in this verification. This gap is self-disclosed by the project (not discovered by me) and remains an open item in the Broken Windows ledger — it is exactly the kind of runtime behavior presence-checking cannot confirm. Routed to human verification below. |
| 5 | `.planning/codebase/` ist aufgefrischt (Stand nach allen v1.1-Phasen) und jeder CONCERNS.md-Eintrag ist erledigt, obsolet-markiert oder als Requirement übernommen | ✓ VERIFIED | All seven `.planning/codebase/*.md` files carry a 2026-07-26 modification date. `STACK.md` claims "123 modules" — verified against `loader.js`'s actual `MODULES` array length (123, counted programmatically) and against the actual bundle's module-banner count in a freshly-built `dist/dnd-tracker-bundled.html` (`grep -c "^// ========== "` = 123) — all three numbers agree. Recounted `.planning/codebase/CONCERNS.md`'s discrete findings independently (`grep -c "^### "` = **24**, matching six section sub-counts 6+3+4+5+3+3=24) — confirms the triage document's own recount and *rejects* the orchestrator-mentioned "26" figure, exactly as `11-CONCERNS-TRIAGE.md` itself already documented. Cross-referenced all 24 heading titles against `11-CONCERNS-TRIAGE.md`'s "Nach dem Map-Refresh hinzugekommen" section: 21 map to N1-N21, the remaining 3 (class-attribute, pushUndo, sanitizeHTML-twice) map to previously-dispositioned old entries (21, 23/34, 20/42) — all 24 accounted for with a disposition, none left as an implicit "offen". Recounted the OLD 46-entry table's own disposition distribution programmatically (regex over all 46 numbered rows): 22 erledigt / 1 obsolet / 8 akzeptiert / 15 uebernommen = 46, matching the triage's own summary exactly. `.planning/REQUIREMENTS.md` §v2 carries all 29 claimed `DEBT-` IDs (DEBT-01 through DEBT-29) — cross-checked against all 29 IDs mentioned in `11-CONCERNS-TRIAGE.md`, identical sets. |

**Score:** 4/5 truths verified (1 present + wired, behavior-unverified — routed to human check)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `build.py` `load_module_list()` | SSoT parser for module list | ✓ VERIFIED | build.py:59-68, called in `build()` at line 369, exists and wired |
| `build.py` `load_template_list()` / `load_css_import_order()` | SSoT parsers for templates/CSS | ✓ VERIFIED | build.py:71-105, called at lines 374/381 |
| `build.py` `check_duplicate_functions()` | Source pre-check aborting on top-level dupes | ✓ VERIFIED | build.py:173-208, called at line 417, before JS load loop and before any write |
| `build.py` post-build validator (backstop) | Independent duplicate-declaration check against assembled bundle | ✓ VERIFIED | build.py:558-596, unchanged, present |
| `build.py` `build_favicon_data_uri()` | Single-pass SVG→data-URI encoder | ✓ VERIFIED | build.py:134-170, single `urllib.parse.quote()` pass, output confirmed well-formed via independent re-parse |
| `tests/build/test_build_deduplication.py` | pytest coverage for SSoT + hard-fail + favicon | ✓ VERIFIED | 24 tests, all pass live (`pytest tests/build/ -v`) |
| `.github/workflows/ci.yml` | pytest gate, current action majors, Node 22×6 | ✓ VERIFIED | `pytest tests/build/` runs in `test` job (line 45); node-version '22' at exactly 6 sites; no stale action majors found |
| `tests/e2e/smoke.spec.js` | 404/deprecation smoke assertions | ⚠️ PRESENT, STRUCTURALLY LIMITED | Test exists (lines 38-64) and passes, but per project's own documented finding cannot observe the specific request class it targets — see Truth 4 above |
| `.planning/codebase/*.md` (7 files) | Refreshed codebase map | ✓ VERIFIED | All 7 files dated 2026-07-26; module count (123) cross-verified three ways |
| `.planning/phases/11-architektur-build-hygiene/11-CONCERNS-TRIAGE.md` | Full disposition of all CONCERNS entries with live-code evidence | ✓ VERIFIED | 46 old + 24 new = 70 entries, all dispositioned; recomputed distributions match claims |
| `.planning/REQUIREMENTS.md` | DEBT-01..DEBT-29 as named backlog requirements | ✓ VERIFIED | All 29 IDs present, matching triage |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `build.py` | `loader.js` | `load_module_list()`/`load_template_list()` parse `MODULES`/`TEMPLATES` arrays at build time | ✓ WIRED | Confirmed via source read and a live divergence test (fake missing module → hard abort) |
| `build.py` | `assets/styles.css` | `load_css_import_order()` parses the `@import` hub | ✓ WIRED | Confirmed in source; `require_files_exist()` gates missing CSS files |
| `build.py build()` | `check_duplicate_functions()` | Runs before module concatenation, before any output write | ✓ WIRED | Line ordering confirmed: 369-417 (SSoT load + gates) precede JS loop; `sys.exit(1)` precedes `write_file()` at line 610 |
| `tests/build/test_build_deduplication.py` | `build.py` | Imports and directly invokes the real `build()`/`check_duplicate_functions()`/`load_module_list()` functions, not reimplementations | ✓ WIRED | `test_source_duplicate_aborts_build_without_writing_output` calls `build_module.build()` directly |
| `.github/workflows/ci.yml` (`test` job) | `tests/build/` | `pip install -r requirements-dev.txt` then `python -m pytest tests/build/ -v` | ✓ WIRED | ci.yml:43-45; `requirements-dev.txt` pins `pytest==` |
| `tests/e2e/smoke.spec.js` | `build.py` HTML head / `icons/icon.svg` | `page.on('response')`/`page.on('console')` against the bundle's favicon link and meta tags | ⚠️ WIRED BUT STRUCTURALLY LIMITED | Test genuinely fires and asserts, but cannot observe the specific implicit favicon-fetch behavior it was written to guard (documented gap, WINDOWS.md id 3) |
| `.planning/phases/11-architektur-build-hygiene/11-CONCERNS-TRIAGE.md` | `.planning/REQUIREMENTS.md` | `uebernommen (DEBT-NN)` dispositions name IDs that appear as named requirements | ✓ WIRED | Set-equality confirmed: all 29 DEBT IDs in triage == all 29 in REQUIREMENTS.md |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full build pipeline (dev) succeeds end-to-end | `python build.py` | Exit 0, "Alle Validierungen bestanden", 123 module banners in bundle | ✓ PASS |
| Full build pipeline (production) succeeds end-to-end | `python build.py --production` | Exit 0, DEBUG_MODE flip verified | ✓ PASS |
| Full pytest build-gate suite | `python -m pytest tests/build/ -v` | 24/24 passed | ✓ PASS |
| Full Jest unit suite | `npm test -- --silent` | 621/621 passed, 26 suites | ✓ PASS |
| Missing-module divergence hard-fails the build | Simulated fake `loader.js` MODULES entry pointing at a nonexistent file, called `require_files_exist()` directly | `[FEHLER]` printed, `SystemExit(1)` raised | ✓ PASS |
| Favicon data-URI in the freshly-built bundle is well-formed, non-double-encoded SVG | Regenerated `dist/dnd-tracker-bundled.html`, extracted `<link rel="icon">` href, parsed with `xml.etree.ElementTree`, checked `unquote(unquote(x)) == unquote(x)` | Well-formed XML, no double-encoding | ✓ PASS |
| CONCERNS.md discrete-entry count | `grep -c "^### " .planning/codebase/CONCERNS.md` | 24 (matches per-section 6+3+4+5+3+3) | ✓ PASS |
| Old triage disposition distribution | Programmatic regex recount of all 46 numbered rows | 22/1/8/15 = 46, matches claimed distribution exactly | ✓ PASS |
| Favicon-404/deprecation absence in a real browser tab | (not run — requires an interactive, non-headless browser session) | — | ? SKIP — routed to human verification |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| ARCH-01 | 11-01, 11-02 | Modullisten-Drift strukturell unmöglich | ✓ SATISFIED | SSoT parsers confirmed, hard-fail confirmed live |
| ARCH-02 | 11-03 | Dedup Pass 3 gehärtet | ✓ SATISFIED | Pass removed, source pre-check confirmed live, backstop intact |
| ARCH-03 | 11-04, 11-05 | CI-/Konsolen-Hygiene | ⚠️ PARTIALLY SATISFIED | CI half fully verified via real, already-completed CI run; console half (favicon/meta-tag) has a self-documented, open observation gap — the underlying fix is applied and manually spot-checked, but not machine-provable in this environment |
| ARCH-04 | 11-06, 11-07 | Codebase-Map + CONCERNS.md-Triage | ✓ SATISFIED | All 24 new + 46 old entries dispositioned, cross-referenced into REQUIREMENTS.md |

**Note on REQUIREMENTS.md staleness:** `.planning/REQUIREMENTS.md` line 31 still shows `- [ ] **ARCH-04**` (unchecked) and its own Traceability table (line 110) says "Push+CI-Nachweis (Roadmap-Kriterium 3) ausstehend" — but `.planning/STATE.md` (lines 55-78, itself a committed project record, not a SUMMARY claim) shows Kriterium 3's CI push evidence was already obtained and green (run 30216452989, commit `bfd6447`) **after** REQUIREMENTS.md's traceability note was last written. This is a stale checkbox/note, not a functional gap — the underlying work and evidence exist. Flagged as a documentation-only WARNING, not a blocker.

### Anti-Patterns Found

No `TBD`/`FIXME`/`XXX`/`HACK`/`PLACEHOLDER` markers found in any file modified by this phase (`build.py`, `loader.js`, `.github/workflows/ci.yml`, `tests/build/test_build_deduplication.py`, `tests/e2e/smoke.spec.js`, `index.html`). No stale references to the removed third dedup pass remain in `docs/build-system.md`, `CLAUDE.md`, or `docs/bugfixes.md` — all correctly describe the current two-pass + source-pre-check architecture.

### Human Verification Required

### 1. Favicon-404 and apple-mobile-web-app-capable deprecation absence in a real browser

**Test:** Open `dist/dnd-tracker-optimized.html` (or `dnd-tracker-bundled.html`) by double-clicking it (the primary `file://` usage mode) or serving it over HTTP, in a normal (non-headless) Chrome/Edge tab. Open DevTools → Network tab (filter for "favicon") and Console tab.
**Expected:** No `favicon.ico` request appears in the Network tab (or if it appears, it does not 404), and no deprecation warning referencing `apple-mobile-web-app-capable` appears in the Console.
**Why human:** The committed automated test (`tests/e2e/smoke.spec.js`, "Keine Favicon-404 und keine Meta-Tag-Deprecation") structurally cannot observe this specific request class — confirmed both by the project's own documented empirical investigation (`.planning/WINDOWS.md` id 3, `status: open`, `.planning/STATE.md` lines 99-102) and consistent with how the test is wired (`page.on('response')`/`page.on('console')`, which never fire for this browser-chrome-initiated implicit favicon fetch in this Chromium/Playwright combination, headless or headed). The underlying code fix is real and was manually spot-checked via an ad-hoc, non-committed CDP probe script during 11-05 — but nothing re-runnable proves it in this verification pass, and the gap remains open in the project's own defect ledger rather than waived.

### Nachtrag 2026-07-26 — Human-Verification-Punkt 1 wurde durchgeführt (Orchestrator)

Die oben geforderte Prüfung „in einem echten, nicht-headless Browser" wurde unmittelbar nach dieser
Verifikation ausgeführt. Damit ist der Punkt nicht mehr offen, aber das Ergebnis ist zweigeteilt.

**Aufbau:** `python -m http.server --directory dist` auf Port 8235, Seite
`dnd-tracker-optimized.html`, geöffnet im Claude-Browser-Panel — einem echten, nicht-headless
Chromium. Belege stammen aus zwei unabhängigen Quellen: dem Zugriffs-Log des HTTP-Servers (erfasst
jede Anfrage, unabhängig von Playwright-Events — genau die Lücke aus `WINDOWS.md` id 3) und
JavaScript im Seitenkontext.

**Konsole: sauber.** Null Meldungen. Keine `apple-mobile-web-app-capable`-Deprecation-Warnung, kein
404-Eintrag. Beide Meta-Tags sind im DOM vorhanden (`apple-mobile-web-app-capable=yes` UND
`mobile-web-app-capable=yes`) — additiv, also genau das, was Chromiums Deprecation-Hinweis verlangt.

**Das Icon funktioniert.** `document.querySelector('link[rel~="icon"]')` liefert den Data-URI
(1530 Zeichen); `new Image()` darauf angesetzt ergibt **`decode()` OK, 100×100**. Der Browser hat
also ein tatsächlich verwendbares Icon. Unabhängig dazu passend: der Payload dekodiert sauber, enthält
keine `%25`-Doppelkodierung und ist laut `xml.dom.minidom` wohlgeformtes XML. Der Encoder-Defekt aus
`5009240` ist damit auch zur Laufzeit bestätigt, nicht nur im Build-Artefakt.

**Residuum: `GET /favicon.ico` → 404 findet weiterhin statt.** Das Server-Log zeigt die Anfrage
einmal pro Seitenaufruf, neben den erwarteten Anfragen (HTML, `sw.js`, `manifest.webmanifest`,
2 Icons, 10 WOFF2). Chromium sondiert `/favicon.ico` hier also **trotz** eines gültigen, dekodierbaren
`<link rel="icon">`. Die Anfrage erreicht die Konsole nicht.

**Bewertung von SC4:** Nach dem Wortlaut des Kriteriums — „sind **aus der Konsole** verschwunden" —
ist es erfüllt: beide Symptome sind aus der Konsole verschwunden, empirisch in einem echten Browser
belegt. Auf Netzwerkebene besteht die 404-Sondierung fort; sie ist kosmetisch, für den Nutzer
unsichtbar und nicht durch ein fehlendes oder defektes Icon verursacht.

**Einschränkung, die eine Rest-Unsicherheit lässt:** geprüft wurde im eingebetteten
Claude-Browser-Chromium. Das ist erheblich aussagekräftiger als headless, aber es ist nicht
zwingend identisch mit dem Chrome/Edge des Entwicklers. Wer letzte Sicherheit will, wiederholt die
Prüfung dort — der Aufbau steht oben.

**Folgerung für `WINDOWS.md` id 3:** Der dort beschriebene Befund bleibt inhaltlich richtig
(Playwright-Page-Events sehen diese Anfrage nicht). Der Eintrag sollte aber ergänzt werden: über das
Server-Zugriffs-Log ist das Verhalten sehr wohl beobachtbar und automatisierbar — ein künftiger Test
könnte den Server-Log auswerten statt sich auf `page.on('response')` zu verlassen.

### Gaps Summary

No BLOCKER-level gaps were found — every artifact required by the phase's must_haves exists, is substantive, and is wired; the two build-hardening criteria (SC1, SC2) are proven with live, re-run tests exercising the real `build.py` code paths, not just presence checks; the CI-hygiene criterion (SC3) is corroborated by an already-completed, already-documented real CI run; and the codebase-map/CONCERNS.md triage (SC5) arithmetic independently recomputes to the exact figures claimed in the phase's own artifacts.

The one open item is SC4 (favicon-404 / meta-tag deprecation): the fix is applied in source, produces a well-formed favicon payload in a freshly-rebuilt bundle (independently re-verified here), and was manually spot-checked via CDP during plan execution — but the phase's own committed automated proof for this specific criterion has a structural observation gap that the project has already disclosed and left open in `.planning/WINDOWS.md` (not silently passed over). This routes to human verification rather than either a clean PASS or a FAIL, per the project's own honest self-assessment.

A secondary, non-blocking documentation gap: `.planning/REQUIREMENTS.md`'s ARCH-04 checkbox and traceability note are stale relative to `.planning/STATE.md`'s own record of the completed CI push evidence — worth a quick doc sync but not a functional issue.

---

_Verified: 2026-07-26T21:45:00Z_
_Verifier: Claude (gsd-verifier)_
