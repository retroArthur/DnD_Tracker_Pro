---
phase: 11-architektur-build-hygiene
plan: 05
subsystem: build-tooling
tags: [build.py, index.html, playwright, favicon, pwa-meta, smoke-test]

# Dependency graph
requires:
  - phase: 11-architektur-build-hygiene (plans 01-04)
    provides: "SSoT parser chain, hardened dedup pre-check, tests/build/ as a real CI gate — all untouched by this plan, verified still green"
provides:
  - "build_favicon_data_uri(svg_path) in build.py — inlines icons/icon.svg as a data:image/svg+xml, URI into the bundle's <link rel=\"icon\"> at build time"
  - "index.html and the build.py HTML-head f-string both carry <link rel=\"icon\"> (file-link vs. data-URI, matched to each file's usage mode) and <meta name=\"mobile-web-app-capable\" content=\"yes\"> alongside the existing apple-specific tag"
  - "tests/e2e/smoke.spec.js gains a dedicated 'Keine Favicon-404 und keine Meta-Tag-Deprecation' test (page.on('response') for 404s, page.on('console') for the known deprecation string); both existing tests' vestigial favicon-exception filters removed"
  - "A materially important empirical finding (documented below) about what Playwright's page-level network/console events can and cannot observe for browser-chrome-level favicon fetches — relevant to any future work on this test"
affects: [11-06-architektur-build-hygiene, 11-07-architektur-build-hygiene, any-future-touch-of-tests/e2e/smoke.spec.js]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Build-time SVG-to-data-URI inlining (build_favicon_data_uri): strip HTML comments, collapse whitespace, percent-encode in the order that avoids double-encoding (% first, then # { } < >) — same idiom class as the project's existing SSoT parsers (build-time text transform of a canonical source file into an embedded, self-contained artifact)"
    - "Known-drift-pair HTML heads: build.py's f-string head and index.html's static head must change together (favicon link, meta tags) or they silently diverge — same discipline as the loader.js/build.py module-list SSoT work in 11-01/11-02"

key-files:
  created: []
  modified:
    - tests/e2e/smoke.spec.js
    - build.py
    - index.html
    - .gitignore

key-decisions:
  - "D-10 implemented as specified: data-URI in the bundle, file:// link in index.html — verified functionally correct via an out-of-band CDP Network-domain probe (see Empirical Findings), not just via the committed automated test"
  - "D-11 branch taken: apple-mobile-web-app-capable STAYS in both heads (additive-only), because the smoke test's console collection was empty both before and after adding mobile-web-app-capable — the literal 'empty collection -> tag stays' branch rule from CONTEXT.md/PLAN.md applies. This was corroborated independently via three separate CDP channels (Log.entryAdded, Audits.issueAdded, page.on('console')), not just the one committed test path — see caveat below on why 'empty' here does not necessarily mean 'the tag is harmless', only that this Chromium build never surfaced the warning to begin with"
  - "No pytest additions for build_favicon_data_uri() — the plan's file_modified list for this plan does not include tests/build/, and the function is exercised indirectly by every existing build()-level test plus the two <verify> command probes in Tasks 2/3; adding dedicated unit coverage was judged out of this plan's stated scope (kept as a possible opportunistic follow-up, not a gap that blocks Phase 11)"

patterns-established: []

requirements-completed: []

# No coverage: block — this plan closes half of ARCH-03 (the console/CI hygiene
# half is 11-04's ARCH-03 completion; ARCH-03 as a whole requirement is only
# marked complete once 11-06/11-07 close ARCH-04). Frontmatter requirements: []
# is correct per the plan's own frontmatter (requirements: [ARCH-03], but ARCH-03
# also needs 11-04's already-landed half — not re-claimed here to avoid double count).

duration: ~40min
completed: 2026-07-25
status: complete
---

# Phase 11 Plan 5: Favicon Data-URI, PWA Meta Tag, and Console-Hygiene Smoke Test Summary

**Favicon inlined as a build-time `data:image/svg+xml,` URI in the bundle (file-link in `index.html`), `mobile-web-app-capable` added additively alongside the existing apple-specific tag, and a dedicated Playwright smoke assertion added — but a significant empirical finding shows the assertion cannot actually observe the browser-chrome-level favicon fetch in this Chromium/Playwright combination, in either headless or headed mode, documented in full below.**

## Performance

- **Duration:** ~40 min (includes substantial empirical investigation via raw CDP probes, beyond the plan's own verify commands)
- **Completed:** 2026-07-25T21:50:14Z
- **Tasks:** 3
- **Files modified:** 4 (`tests/e2e/smoke.spec.js`, `build.py`, `index.html`, `.gitignore`)

## Accomplishments

- New Playwright test "Keine Favicon-404 und keine Meta-Tag-Deprecation" added to `tests/e2e/smoke.spec.js`, using the correct `page.on('response')` mechanism for HTTP 404s (not `requestfailed`, which never fires on a 404 per 11-RESEARCH.md's Pitfall 2) and `page.on('console')` for a `KNOWN_DEPRECATION_STRINGS` array containing exactly the apple-tag name. Both existing tests' vestigial `.filter(e => !e.includes('favicon'))` exemptions removed — they would have silently swallowed a real icon regression once D-10 closed the gap.
- `build_favicon_data_uri(svg_path)` added to `build.py`: reads `icons/icon.svg`, strips its explanatory HTML comment block, collapses whitespace, then percent-encodes in the order that avoids double-encoding (`%` first, then `#`/`{`/`}`/`<`/`>`). Hard-aborts with `[FEHLER]` + `sys.exit(1)` if the icon source is missing (D-02 line), matching the measured research values exactly (1079 chars after whitespace collapse, 1158-char final data URI).
- `<link rel="icon" href="data:image/svg+xml,...">` added to the `build.py` HTML-head f-string (bundle), and `<link rel="icon" href="./icons/icon.svg">` added to `index.html` at the matching position — the known drift-pair changed together.
- `<meta name="mobile-web-app-capable" content="yes">` added additively to both heads, next to the existing `apple-mobile-web-app-capable` tag (D-11 Step 1). The apple tag was kept (D-11 Step 2 branch), per the empirically observed empty console collection (see Empirical Findings).
- Full verification suite green after all three tasks: dev + production `python build.py` (both exit 0), `python -m pytest tests/build/` (23/23), `npm test` (Jest 621/621), `npx playwright test` (319 passed / 2 skipped, +1 over the prior 318-passed baseline — the new smoke test), and the smoke suite itself run three separate times against a local HTTP server on `dist/` (8/8 green each time: pre-fix baseline, post-Task-2, post-Task-3).

## Task Commits

1. **Task 1: Smoke-Assertionen fuer 404 und Deprecation ergaenzen (D-12)** - `8636155` (test)
2. **Task 2: Favicon — Data-URI im Bundle, Datei-Link im Dev-Modus (D-10)** - `9a7d8d8` (feat)
3. **Task 3: Standard-Meta-Tag ergaenzen, D-11-Zweig empirisch entscheiden** - `80ab16a` (feat)

_Note: Task 1 is `tdd="true"` (RED-only; Tasks 2/3 provide the GREEN). The RED check was run exactly as instructed (HTTP server on `dist/`, `npx playwright test --config=playwright.smoke.config.js`) and produced an unexpected result — see Empirical Findings, which explains why this is not a test defect._

## Files Created/Modified

- `tests/e2e/smoke.spec.js` — New `KNOWN_DEPRECATION_STRINGS` constant (one entry: `apple-mobile-web-app-capable`). New test registers `page.on('response')`/`page.on('console')` listeners before `page.goto`, asserts both collections are empty after `waitForSelector('.app-title')`, with the collected arrays embedded in the failure message. Both existing tests' `filter(e => !e.includes('favicon'))` exemptions removed (now plain `expect(errors).toHaveLength(0)`).
- `build.py` — `build_favicon_data_uri(svg_path)` added (module-level, directly before `check_duplicate_functions`). `build()` computes `favicon_data_uri` before HTML-template assembly and inserts `<link rel="icon" href="{favicon_data_uri}">` directly after the `<title>` line. `<meta name="mobile-web-app-capable" content="yes">` added directly after the existing apple-tag line.
- `index.html` — `<link rel="icon" href="./icons/icon.svg">` and `<meta name="mobile-web-app-capable" content="yes">` added at the matching positions (file-link/additive-tag variant, since `index.html` never runs standalone).
- `.gitignore` — `tests/e2e/test-results-smoke/` added (Playwright artifact directory created by local smoke runs during this plan's verification, analogous to the already-ignored `tests/e2e/test-results/`).

## Decisions Made

- D-10 (favicon: data-URI in bundle, file-link in `index.html`) implemented exactly as specified.
- D-11 branch: apple tag stays, `mobile-web-app-capable` added additively — literal application of the plan's own "empty collection → tag stays" rule, with the important caveat documented below that "empty" here reflects a tooling/version limitation, not proof the warning never occurs for a real user.
- No new `tests/build/` pytest coverage added for `build_favicon_data_uri()` — out of this plan's declared `files_modified` scope; the function is still exercised transitively by every build-invoking test and by the `<verify>` command probes.
- `.gitignore` extended for the smoke-test artifact directory rather than committing it, following the task_commit_protocol's untracked-file handling rule.

## Deviations from Plan

### Auto-fixed Issues

None in the Rule 1-4 sense — no bugs, missing critical functionality, blocking issues, or architectural changes were found in the plan's own instructions. Everything below is a **documented empirical finding**, explicitly anticipated and pre-authorized by the plan's own text ("Ein gruener Lauf an dieser Stelle ist ein Befund und muss erklaert werden" / "die Beobachtung, nicht die Erwartung, entscheidet"), not a deviation requiring a Rule 1-4 classification.

### Empirical Findings (required documentation, not a deviation)

**1. Task 1's new smoke test was GREEN from the very first run, against the pre-fix baseline — not RED as the plan anticipated.**

Per Task 1's acceptance criteria, this outcome must be investigated and the observed result documented literally rather than treated as a silent pass. Full investigation performed using raw CDP-level probes (`context.newCDPSession(page)`, `Network`/`Log`/`Audits` domains) in addition to the committed Playwright test, against Chromium 143.0.7499.4 (this environment's Playwright-bundled browser):

- **Favicon-404 half:** In **headless** mode (the mode both `playwright.smoke.config.js`'s defaults and CI use), Chromium **never issues the implicit `/favicon.ico` request at all** — confirmed via a raw CDP `Network.enable` probe with zero `Network.requestWillBeSent`/`responseReceived` events for any `favicon` URL, both before and after the D-10 fix. This is not a Playwright-abstraction gap; the browser genuinely does not perform this fetch in headless automation.
- In **headed** mode (a real interactive tab), the fetch **does** happen and **does** 404 before the fix — confirmed via the same raw CDP probe: `CDP-RESPONSE 404 http://localhost:8010/favicon.ico`, plus a matching `page.on('console')` error text `Failed to load resource: the server responded with a status of 404 (File not found)` and a CDP `Log.entryAdded` entry naming the exact URL. **However, Playwright's own page-level `request`/`response`/`requestfinished`/`requestfailed` events never fire for this request in headed mode either** — verified by registering all four listeners simultaneously; only the main document and `sw.js` produced events, `favicon.ico` produced none at the Playwright-API level despite being clearly visible at the raw CDP level. This is a genuine, structural gap in what Playwright's `Page` class surfaces for browser-chrome-initiated requests (they are not associated with the page's frame tree the way document-triggered resource loads are).
- **Conclusion:** the favicon-404 bug is real (reproduced and 404-confirmed via CDP in headed mode) and the fix is real (see below), but the exact detection mechanism specified by D-12/Task 1 (`page.on('response')`) — which is the *correct* Playwright API per Pitfall 2's own guidance for this class of check — cannot observe this *specific* implicit-favicon-fetch class of request, in either headless or headed Chromium. This is a deeper instance of the same "silent free pass" risk the plan itself calls out for `requestfailed` (Pitfall 2), just triggered by a different root cause (browser-chrome request invisibility to Playwright's Page abstraction, and headless Chromium suppressing the fetch outright) rather than the wrong event name.
- **Manual verification of the actual fix (outside the committed test suite):** re-ran the same raw-CDP headed probe against the post-Task-2 production build. Result: **zero** favicon-related CDP events at all — the implicit fetch no longer happens once `<link rel="icon">` is present, matching the WHATWG spec text quoted in 11-RESEARCH.md ("In the absence of a link with the icon keyword ... user agents may instead attempt to fetch ... favicon.ico"). This is genuine, if informal (non-committed), proof that D-10's fix works for a real interactive browser tab — the actual Spielleiter-facing scenario — even though the automated smoke test cannot itself observe either the presence or absence of the bug.

- **Meta-tag deprecation half:** Independently probed via three channels (`page.on('console')`, CDP `Log.entryAdded`, CDP `Audits.issueAdded` filtered for non-generic issues) against a plain navigation with `apple-mobile-web-app-capable` present and `mobile-web-app-capable` absent (pre-Task-3 state). **None of the three channels produced any signal referencing this tag.** The same three-channel probe was repeated post-Task-3 (both tags present): again, no signal on any channel. Chromium 143.0.7499.4 does not surface this particular deprecation notice for a plain page load in this test harness, regardless of which tag combination is present.

**Practical consequence for Roadmap-Kriterium 4 ("Erfolgskriterium 4 wird maschinell belegt, nicht behauptet"):** the committed test is real, correctly implemented per the plan's specification and Pitfall 2's own guidance, passes 8/8 both before and after all fixes, and would catch a real regression if a future change caused an *explicit*, page-initiated 404 (e.g., a broken `href` on the `<link rel="icon">` itself) or a console-visible deprecation string. It does **not**, however, actually falsify the specific pre-existing bugs D-10/D-11 targeted, because (a) the favicon fetch this test was meant to guard against is invisible to Playwright's Page-level events in this Chromium build, and headless mode (CI's actual execution mode) suppresses the fetch entirely regardless of instrumentation; and (b) this Chromium version does not emit the meta-tag deprecation warning under a plain navigation at all. The real-world fixes (D-10 confirmed via manual CDP probe; D-11's branch decision followed the plan's own literal rule for an empty collection) are still correct and were still applied — the machine-verification gap is a property of the test's detection mechanism versus this environment's browser behavior, not a defect in the applied fixes.

This finding is logged to `.planning/WINDOWS.md` (kind: `unrun-verify`) so it stays visible past this SUMMARY's context window, per the broken-windows ledger policy.

---

**Total deviations:** 0 Rule 1-4 auto-fixes; 1 substantial, thoroughly investigated empirical finding (documented above, pre-authorized by the plan's own acceptance-criteria wording for an unexpectedly-green RED check)
**Impact on plan:** None on the delivered code — all three tasks' literal acceptance criteria (grep checks, `--list` test count, build exit codes, data-URI percent-encoding, meta-tag counts, full-suite green) are met exactly as specified. The impact is entirely on how Roadmap-Kriterium 4's "machine-proof, not assertion" claim should be understood going forward: proven for the real-world browser behavior (via manual CDP verification, not part of the committed suite), not provably self-verifying via the committed Playwright smoke test in this environment.

## Issues Encountered

None beyond the empirical finding documented above. All build/test verification commands specified in the plan's `<verify>`/`<acceptance_criteria>` blocks ran clean on every attempt.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- ARCH-03's console/favicon half (D-10/D-11/D-12) is implemented and verified as thoroughly as this environment allows; the real-world fix is confirmed via manual CDP probing even though the committed automated test has a documented observation gap for this specific browser-chrome-level request class.
- Both HTML heads (`build.py`'s f-string template and `index.html`) remain in sync — the known drift-pair discipline from D-10/D-11 held.
- `tests/build/` remains a green CI gate (23/23) — untouched by this plan.
- Full suites remain green: Jest 621/621, Playwright 319 passed / 2 skipped (was 318/2 before this plan — the +1 is the new smoke test itself).
- Remaining Phase 11 scope (ARCH-04: codebase-map refresh and CONCERNS.md triage, D-13 through D-16) is unaffected by this plan and lives in 11-06/11-07 per the roadmap.
- Recommendation for future work touching `tests/e2e/smoke.spec.js`: if a stronger, non-vacuous favicon-404 guard is ever desired, it would need to run in **headed** mode with a raw CDP `Network` domain probe (not `page.on('response')`) — and even then, CI's headless execution would still never reproduce the underlying browser behavior this guards against, since headless Chromium does not perform the implicit favicon fetch at all. This is a structural limitation of automated headless testing for this specific class of browser-chrome behavior, not something a differently-written test could close within CI.

---

## Nachtrag 2026-07-26: das ausgelieferte Data-URI war kein dekodierbares Bild

Ein nachgelagertes Audit dieser Phase fand einen Defekt in genau dem Deliverable, das oben als erledigt protokolliert ist. Er wird hier festgehalten, damit das Protokoll nicht vollstaendiger aussieht, als es war.

**Was falsch war:** `build_favicon_data_uri()` machte ein unbedingtes `svg.replace('"', "'")`. `icons/icon.svg:59` und `:74` tragen `font-family="'Courier New', Courier, monospace"` — einfache Anfuehrungszeichen innerhalb eines doppelt gequoteten Attributs. Das Ergebnis war `font-family=''Courier New', Courier, monospace'`, also kein wohlgeformtes XML: `ET.fromstring(unquote(payload))` schlug mit `not well-formed (invalid token): line 1, column 685` fehl, waehrend `icons/icon.svg` selbst einwandfrei parst. Beide Bundles haben das ausgeliefert; im `file://`-Doppelklick-Modus zeigte der Tab das leere Default-Icon.

**Warum keine der oben protokollierten Pruefungen es sehen konnte** — das ist der eigentliche Lehrsatz, nicht der Tippfehler:
- Die CDP-Probe oben (`zero favicon-related CDP events`) ist **korrekt und bleibt gueltig**. Sie belegt aber ausschliesslich, dass die implizite `/favicon.ico`-Anfrage entfaellt — und dafuer genuegt die blosse Existenz des `<link rel="icon">`-Elements, unabhaengig davon, ob sein `href` dekodierbar ist. Die 404-Haelfte von D-10 war also echt bewiesen, die *Icon*-Haelfte gar nicht geprueft.
- Die Acceptance-Kriterien von Task 2 pruefen Praesenz von `rel="icon"`, `data:image/svg+xml,` und `%23` sowie Abwesenheit roher `<`/`>`/`#` — alle vier waren erfuellt. Ein Decode-Fehler des Favicons erzeugt keinen Page-Console-Error, faellt also auch durch `page.on('console')` nicht auf.

**Behoben in** `be026c1` (RED-Test) und `5009240` (Fix). Die Ersetzungskette ist ersatzlos durch einen einzigen `urllib.parse.quote(svg, safe=FAVICON_DATA_URI_SAFE)`-Durchgang ersetzt — damit ist auch die Reihenfolgen-Falle strukturell weg (ein `"` → `%22` an der alten Stelle waere vom nachfolgenden `%` → `%25` zu `%2522` verstuemmelt worden). Der Regressionstest parst das dekodierte Payload und schliesst Doppelkodierung per `unquote(decoded) == decoded` aus; `tests/build/` steht damit bei 24 statt 23 Tests. Verifiziert per Browser-Render (`naturalWidth: 100`, `decode()` resolved) gegen beide Bundles ueber `file://`, mit Kontrolllauf gegen den Vor-Fix-Stand (`naturalWidth: 0`, `decode()` rejected) — die Pruefung diskriminiert also.

**Weiterhin offen:** der Render-Nachweis lief als Ad-hoc-Skript, nicht als committeter Test. Dauerhaft abgesichert sind nur Wohlgeformtheit, Roh-Zeichen und Nicht-Doppelkodierung. Ein committeter Playwright-Spec, der `naturalWidth > 0` gegen das gebaute Bundle assertiert, wuerde die letzte Luecke schliessen. Das ist unabhaengig von der in `.planning/WINDOWS.md` id 3 protokollierten Playwright-Blindstelle fuer die implizite Favicon-Anfrage.

**Nicht geaendert:** `icons/icon.svg`. Die Datei ist valides XML und `font-family="'Courier New', ..."` ist idiomatisches SVG/CSS — der Defekt lag vollstaendig im Encoder. Die Quelldatei anzupassen haette einen Encoder kaschiert, der die naechste eingefuegte SVG genauso beschaedigt.

---
*Phase: 11-architektur-build-hygiene*
*Completed: 2026-07-25 (Favicon-Encoder nachgebessert 2026-07-26, siehe Nachtrag)*

## Self-Check: PASSED

All modified files verified present on disk (`tests/e2e/smoke.spec.js`, `build.py`, `index.html`, `.gitignore`); all 3 task commits (`8636155`, `9a7d8d8`, `80ab16a`) verified present in `git log`. `.planning/WINDOWS.md` entry id 3 confirmed recorded (open_count: 1).

**Einschraenkung dieses Self-Checks (2026-07-26 ergaenzt):** er prueft Dateipraesenz und Commit-Praesenz, nicht die inhaltliche Korrektheit des erzeugten Data-URIs — siehe Nachtrag oben. „PASSED" bezieht sich auf die Task-Abwicklung, nicht auf die Fehlerfreiheit des Artefakts.
