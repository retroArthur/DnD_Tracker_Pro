---
phase: "13"
slug: "h-rtung-wartbarkeit"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-06"
validated: "2026-09-07"
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Abgeleitet aus `13-RESEARCH.md` → `## Validation Architecture`.
> **Retroaktiv abgeglichen am 2026-09-07** durch `/gsd-validate-phase 13`. Die Phase war am
> 2026-09-06 abgeschlossen, der `verify:post`-Schritt hatte diese Datei aber nie angefasst —
> sie stand seither auf `status: draft` mit `TBD`-Platzhaltern, während die Arbeit längst
> erledigt war. Alle Statuswerte unten sind in dieser Sitzung frisch gemessen.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.2.0 (Unit) + Playwright 1.57.0 (E2E) |
| **Config file** | `jest.config.cjs` (testEnvironment: jsdom, setupFilesAfterEnv: `tests/setup.js`) · `playwright.config.js` (testDir: `tests/e2e`, baseURL: `dist/dnd-tracker-bundled.html`) |
| **Quick run command** | `npx jest tests/unit/<datei>.test.js` |
| **Full suite command** | `npm run test` (Jest) · `PYTHONIOENCODING=utf-8 python build.py && npx playwright test` (E2E) |
| **Estimated runtime** | ~3 s (Jest voll, gemessen 2026-09-07) · ~2 min (Playwright voll, ohne Build) |

**Bundle-Vorbedingung für E2E:** Playwright läuft gegen `dist/dnd-tracker-bundled.html`. `npm run build`
schreibt nur das Production-Bundle — vor jedem E2E-Lauf `PYTHONIOENCODING=utf-8 python build.py`
(Dev-Variante) ausführen, sonst testet die Suite einen veralteten Stand.

---

## Sampling Rate

- **After every task commit:** die in der Verifikationskarte zur Aufgabe genannte(n) Unit-Test-Datei(en)
- **After every plan wave:** `npm run test` (voller Jest-Lauf)
- **Before `/gsd-verify-work`:** `PYTHONIOENCODING=utf-8 python build.py && npx playwright test` grün,
  **plus** die MAINT-04-/MAINT-06-Grep-Checks liefern 0 Treffer außerhalb Kommentaren bzw.
  `DEBUG_MODE`-Guards
- **Max feedback latency:** 30 s (Unit-Ebene) — tatsächlich gemessen: 2,5 s für die zehn
  hier genannten Suiten zusammen

---

## Per-Task Verification Map

> Am 2026-09-07 gegen die zwölf fertigen Pläne und den Live-Baum abgeglichen.
> Die `TBD`-Platzhalter der Seed-Fassung sind durch die realen Plannummern ersetzt.

| Plan | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|------|-------------|------------|-----------------|-----------|-------------------|--------|
| 13-01 | SEC-03 | T-13-01 | `call`-Aktion ruft ausschließlich Whitelist-Ziele auf; unbekanntes Ziel wird verworfen und protokolliert | unit | `npx jest tests/unit/event-delegation.test.js` | ✅ grün |
| 13-01 | SEC-03 | T-13-01 | Alle legitimen statischen `data-action="call"`-Ziele funktionieren unverändert | e2e | `npx playwright test tests/e2e/integration/workflows.spec.js` | ✅ grün (in der vollen Suite) |
| 13-02 | SEC-04 | T-13-02 | `parseWikiLinks()` escapt die Regex-Capture; `<`/`>`/`"`/`'` in `linkText` erzeugen kein Markup | unit | `npx jest tests/unit/wiki-links.test.js` | ✅ grün |
| 13-06 | PERF-01 | — | Save-Pfad ohne Blob-Allokation pro Operation, Schwellenwerte unverändert | unit | `npx jest tests/unit/stability.test.js -t "saveImmediate"` | ✅ grün |
| 13-06 | PERF-01 | — | Undo dedupliziert identische Snapshots und verdrängt bei Byte-Budget-Überschreitung den ältesten Eintrag | unit | `npx jest tests/unit/stability.test.js -t "Undo"` | ✅ grün (Fälle nachgezogen) |
| 13-07 | PERF-02 | — | `diceStats`-Store hat harte Obergrenze und Löschfunktion; Aggregation läuft über Cursor statt Vollladung | unit | `npx jest tests/unit/dice-stats-idb.test.js` | ✅ grün |
| 13-11 | MAINT-01 | — | `rich-text.js`-Split verhaltensneutral — eingefrorenes 79-Test-Netz aus Phase 9 bleibt grün | e2e | `npx playwright test tests/e2e/features/editor-{formatting,floating,insert,smoke}.spec.js` | ✅ grün (in der vollen Suite) |
| 13-12 | MAINT-01 | — | `dmscreen-render.js`: Charakterisierungs-Snapshot existiert und war grün **vor** der ersten Codeverschiebung (D-04) | unit | `npx jest tests/unit/dmscreen-characterization.test.js` | ✅ grün (50 Snapshots) |
| 13-09..13-12 | MAINT-01 | — | Alle vier Splits verhaltensneutral gegen die volle Suite | e2e | `PYTHONIOENCODING=utf-8 python build.py && npx playwright test` | ✅ 321 bestanden / 2 übersprungen |
| 13-02, 13-04 | MAINT-02 | — | Tab-Registry ist gegen Funktions-Umbenennung abgesichert (Registry-Einträge zeigen auf existierende Funktionen) | unit | `npx jest tests/unit/tab-registry.test.js` | ✅ grün |
| 13-03 | MAINT-03 | — | URLs mit ≥2 Unterstrichen (`foo_bar_baz`) bleiben unkorrumpiert; `hasHtmlTags`-Entscheidung bricht Tabellen-/Read-Aloud-Erkennung nicht | unit | `npx jest tests/unit/markdown-converter.test.js` | ✅ grün |
| 13-02 | MAINT-04 | — | 0 `execCommand`-Treffer außerhalb Kommentaren im gesamten Quellbaum | smoke (grep) | `grep -rn "execCommand" --include=*.js .` (ohne `dist/`, `node_modules`, `coverage/`) | ✅ **0 echte Aufrufe** |
| 13-04 | MAINT-05 | — | `initPerformanceMonitoring()` startet bei erneutem Aufruf kein zweites Interval (Guard-Parität zu `startAutoBackup()`) | unit | `npx jest tests/unit/backups.test.js` | ✅ grün |
| 13-04 | MAINT-05 | — | Tote `mindmap`-Seeds, `const D`-Überschattung (`soundboard-player.js`) und doppeltes `data-id` sind entfernt | unit | `npx jest tests/unit/soundboard.test.js` | ✅ grün |
| 13-08 | MAINT-06 | — | Keine ungeguardeten `console.*`-Aufrufe in Produktionspfaden (Baseline: 89 Treffer) | smoke (grep) | `grep -rnE "console\.(log\|error\|warn\|info\|debug)" --include=*.js .` (ohne `tests/`, `dist/`, `node_modules`, `coverage/`, `tools/`) | ✅ 24 Treffer, **alle sanktioniert** (s. u.) |
| 13-08 | MAINT-06 | — | Kopfkommentare im Datei-Backup beschreiben `registerPostSaveHook()` statt `window.save` | unit | `npx jest tests/unit/file-backup.test.js` | ✅ grün |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Sammellauf der zehn genannten Unit-Suiten am 2026-09-07:** 10 Suiten / **343 Tests grün**, 2,5 s.

### MAINT-04 — Beleg

Die drei bei Phasenbeginn noch offenen Aufrufstellen (`DEBT-03`) sind **alle entfernt**:

| Datei | `execCommand`-Treffer |
|-------|----------------------|
| `systems/entity-links.js` | 0 |
| `features/wiki/wiki.js` | 0 |
| `ui/actions/system-actions.js` | 0 |

Verbleibende Treffer im Quellbaum sind ausschließlich (a) zwei erklärende Zeilenkommentare in
`utils/basic.js:125-126` (`für <font face="..."> (execCommand fontName)`) und (b) der
Regressionswächter `tests/e2e/features/editor-floating.spec.js:639`, der selbst nach
`execCommand` sucht. **Kein echter Aufruf mehr.**

> ⚠ **`CLAUDE.md` ist an dieser Stelle veraltet.** Der Abschnitt „Conventions →
> execCommand-Ablösung" behauptet weiterhin: „Außerhalb des Editor-Moduls bestehen noch drei
> bewusst nicht migrierte Aufrufe: `systems/entity-links.js:108`, `features/wiki/wiki.js:819`,
> `ui/actions/system-actions.js:79`". Phase 13 hat genau diese drei entfernt (MAINT-04 /
> `DEBT-03`). Der Satz gehört gestrichen — hier nur festgehalten, nicht selbst geändert, weil
> `CLAUDE.md` dem Nutzer gehört.

### MAINT-06 — Beleg

24 verbleibende `console.*`-Treffer in Produktionspfaden, jeder einer der vier zugelassenen
Klassen:

| Klasse | Ort |
|--------|-----|
| Der eine sanktionierte Ausgang | `render/helpers.js` — markiert `// gsd:konsolen-senke einziger sanktionierter Ausgang dieses Projekts` |
| Markierte Fallback-Senken | `ui/event-delegation.js`, `ui/actions/ui-actions.js` — je `// gsd:konsolen-senke-fallback` |
| Bootstrap vor dem ErrorHandler | `loader.js` (der Modullader selbst — läuft, bevor `ErrorHandler` existiert) |
| `DEBUG_MODE`-geguarded | `utils/performance.js` (`DEBUG_MODE ? …bind(console, '[DnD]') : () => {}`) |

**Keine ungeguardete Ausgabe.** Baseline 89 → 24 sanktionierte.

---

## Wave 0 Requirements

- [x] `tests/unit/event-delegation.test.js` (neu) — SEC-03: Whitelist blockiert unbekannte Ziele, legitime Ziele passieren
- [x] `tests/unit/wiki-links.test.js` (neu) — SEC-04: `parseWikiLinks()`-Escaping, insbesondere `linkText` mit `<`/`>`/`"`/`'`
- [x] `tests/unit/stability.test.js` (Ergänzung) — PERF-01: Undo-Dedupe und Byte-Budget-Verdrängung
- [x] `tests/unit/dice-stats-idb.test.js` (neu, `createMockIDB`-Muster) — PERF-02: Cap, Löschfunktion, Aggregat-Cursor-Pfad
- [x] `tests/unit/dmscreen-characterization.test.js` (neu) — MAINT-01/D-04: Snapshot gegen die öffentliche API, hat den Split unverändert überstanden (50 Snapshots grün)
- [x] `tests/unit/markdown-converter.test.js` (Ergänzung) — MAINT-03: `foo_bar_baz`-URL bleibt unkorrumpiert
- [x] `tests/unit/backups.test.js` — MAINT-05: Guard-Parität zwischen `startAutoBackup()` und `initPerformanceMonitoring()`

Alle sieben vorhanden und grün.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Stand 2026-09-07 |
|----------|-------------|------------|------------------|
| Editor-Formatierung fühlt sich nach dem `rich-text.js`-Split unverändert an (Auswahl, Floating-Toolbar, Read-Aloud-Stile) | MAINT-01 | Subjektive Interaktionsqualität; das 79-Test-Netz deckt die Funktionalität, nicht das Bediengefühl | **OFFEN.** Die Phasen-UAT (`13-UAT.md`, 6/6 bestanden) prüfte Initiative-Split, Wiki-Split, Whitelist-Stichprobe, Unterstrich-URLs, Würfelstatistik-Löschen und Undo/stille Konsole — **nicht** das Editor-Bediengefühl unter diesem Namen. Funktional ist der Split durch das 79-Test-Netz (Teil der 321 grünen E2E) abgedeckt; die subjektive Abnahme steht aus. Ein während UAT-Test 4 gefundener Editor-Fehler (doppeltes Einfügen) wurde geschlossen (`e6cd20d`, `7dab71a`). |
| DM-Screen-Widget-Layout (Masonry) nach dem `dmscreen-render.js`-Split | MAINT-01 | CSS-Masonry-Umbruch ist visuell, nicht per Assertion greifbar | **OFFEN.** Die Widget-Registry ist durch `dmscreen-characterization.test.js` (50 Snapshots) gegen Verlust abgesichert; der visuelle Spaltenumbruch bei 320 px / 768 px / Vollbreite wurde nicht abgenommen. |

Beide Punkte sind **legitim manual-only** und blockieren die Nyquist-Konformität nicht (die
Konformitätskriterien unten betreffen die automatisierte Abdeckung). Sie sind hier bewusst als
offen geführt statt stillschweigend abgehakt.

---

## Validation Audit 2026-09-07

| Metric | Count |
|--------|-------|
| Verifikationszeilen geprüft | 16 |
| ✅ grün | 16 |
| ❌ rot | 0 |
| Wave-0-Posten geliefert | 7/7 |
| Lücken gefunden | 0 |
| Offene Manual-Only-Abnahmen | 2 |

**Methode:** Existenzprüfung aller genannten Testdateien, ein Sammellauf der zehn Unit-Suiten
(343 Tests), die volle Playwright-Suite (321 bestanden / 2 übersprungen), sowie die beiden
Grep-Smoke-Checks für MAINT-04 und MAINT-06 einzeln nachgefahren. Keine Zahl aus den
SUMMARY-Dateien übernommen.

**Ergebnis:** Diese Phase war nie unvollständig validiert — sie war nur nie *abgeglichen*.
Die Arbeit stand seit dem 2026-09-06, die Datei stand auf `draft`. Kein einziger Gap.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s (gemessen: 2,5 s für zehn Suiten)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated (COMPLIANT) — 2026-09-07
**Offen, nicht blockierend:** zwei subjektive Bedienabnahmen (siehe Manual-Only)
