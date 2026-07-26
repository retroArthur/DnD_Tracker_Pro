---
phase: 11-architektur-build-hygiene
plan: 07
subsystem: docs-planning
tags: [codebase-map, concerns-triage, requirements, build-docs, arch-04]

# Dependency graph
requires:
  - phase: 11-architektur-build-hygiene (plans 01-06)
    provides: "The concrete build/CI fixes (SSoT parsers, two-pass dedup, source pre-check, favicon/meta-tag) that Task 1 documents, and the frozen 11-CONCERNS-TRIAGE.md (46 entries, DEBT-01..DEBT-16) that Task 3 cross-checks the regenerated CONCERNS.md against"
provides:
  - "docs/build-system.md, CLAUDE.md, .planning/STATE.md, build.py docstring — corrected to describe the two-pass dedup system with a source-level pre-check, no third pass, single-source-of-truth module/template/CSS acquisition from loader.js/assets/styles.css (D-08)"
  - "All seven .planning/codebase/ files regenerated with 2026-07-26 content — ~123 modules, Bestiary/PWA/Datei-Backup/Command-Palette subsystems documented (D-14)"
  - "11-CONCERNS-TRIAGE.md extended with a 'Nach dem Map-Refresh hinzugekommen' section: 24 findings in the regenerated CONCERNS.md cross-checked against the frozen triage, 21 new findings dispositioned, DEBT-17..DEBT-29 (13 new backlog IDs) added and mirrored into REQUIREMENTS.md (D-13/D-15)"
  - "Two false test-count/CI claims found and corrected during the cross-check: TESTING.md's 'E2E is NOT run in CI' (false — e2e is a blocking CI job since Phase 8) and the stale '318 Playwright tests passing' figure (actual: 319 passed / 2 skipped, confirmed by a live run)"
affects: [gsd-ship (REQUIREMENTS.md ARCH-04 traceability, Roadmap-Kriterium 3 and 5)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Codebase-map currency check: verify each .planning/codebase/ file's stated module count, subsystem coverage, and test counts against a live command run in the same session — never carry forward a number from an older document without re-measuring it"
    - "Triage cross-check discipline: count findings in a regenerated audit document mechanically (grep -c on its own heading marker), map each to an existing disposition or flag it new, and require a live-code Beleg for every newly appended disposition — same evidence bar as the original triage (D-15)"

key-files:
  created: []
  modified:
    - docs/build-system.md
    - CLAUDE.md
    - build.py
    - .planning/STATE.md
    - .planning/codebase/ARCHITECTURE.md
    - .planning/codebase/CONCERNS.md
    - .planning/codebase/CONVENTIONS.md
    - .planning/codebase/INTEGRATIONS.md
    - .planning/codebase/STACK.md
    - .planning/codebase/STRUCTURE.md
    - .planning/codebase/TESTING.md
    - .planning/phases/11-architektur-build-hygiene/11-CONCERNS-TRIAGE.md
    - .planning/REQUIREMENTS.md

key-decisions:
  - "The 26-finding count relayed in the resume context for the regenerated CONCERNS.md was not trusted at face value — `grep -c '^### '` was run in this session and returned 24, which is the number used throughout the cross-check and this summary. The discrepancy is recorded rather than silently reconciled."
  - "Three findings in the regenerated CONCERNS.md were matched to existing (already-dispositioned) triage entries with identical code anchors and identical risk assessment — class-attribute pass-through (matches akzeptiert entry 21), pushUndo() full-state serialization (matches uebernommen entry 23/34, DEBT-06), and the dual sanitizeHTML implementation (matches erledigt entries 20/42). All three are consistent, non-contradictory reappearances; none required a disposition change."
  - "No 'erledigt'-dispositioned old entry reappeared as a genuinely open item in the new CONCERNS.md. The one item that superficially looked like a candidate — 'const D shadows the global data object' vs. the resolved build-deduplication entry (27) — was confirmed to be a distinct concern (readability/maintainability, not a build-time SyntaxError risk) and kept separate rather than forced into an existing disposition."
  - "21 of the 24 new findings concern subsystems absent from the old (2026-06-11) CONCERNS.md snapshot — file-backup, migration/full-export, soundboard, dice-stats (IndexedDB), bestiary, command-palette — confirmed by grepping the old triage document for each subsystem name and finding zero hits. This explains why the new CONCERNS.md is structurally unrelated to the old one rather than a superset."
  - "13 of the 21 new findings were dispositioned 'uebernommen' with a new DEBT-17..DEBT-29 ID (concrete code or test change needed); the remaining 8 were dispositioned 'akzeptiert' (documented low-severity tradeoff or too trivial for a standalone backlog item, matching the precedent set by low-severity entries in the original triage)."
  - "DEBT-17 (file-backup silently writes an empty campaign once the >5MB IndexedDB path engages, and prunes real snapshots away over ~10 days) is flagged as the most severe new finding — independently re-verified against live code in this session (persistence.js:64-68, file-backup-manager.js:100-173, :255-274), not just carried forward from the resume-context claim."
  - "Per D-16, no code fix was applied for any newly discovered item in this task — DEBT-17..DEBT-29 are backlog entries only, consistent with the rest of Phase 11's triage discipline."
  - "TESTING.md's claim 'E2E is NOT run in CI (separate gate before deploy)' was found to directly contradict .github/workflows/ci.yml (the `e2e` job is `needs: [lint-and-typecheck, test]`, and `build` in turn `needs: [..., e2e]` — a blocking gate since Phase 8, D-03). This was corrected in place as part of the currency check (not a CONCERNS/triage item, since it's a codebase-map accuracy defect, not a code defect)."
  - "The Playwright pass count in STACK.md and TESTING.md (318) did not match a live run in this session (319 passed / 2 skipped). Corrected both files to the measured number rather than assuming the old figure was still accurate."

patterns-established:
  - "When a resume-context or prior-session claim states a specific count (finding count, test count, CI-job behavior), re-derive it with a command in the current session before using it in a written artifact — three separate discrepancies were caught this way in this single task (finding count 26 vs 24, Playwright 318 vs 319, and the 'E2E not in CI' claim)."

requirements-completed: [ARCH-02, ARCH-04]
---

# Phase 11 Plan 07: Build-Doku nachziehen, Codebase-Map regenerieren und gegen die Triage abgleichen Summary

Phase-11-Abschluss: die Build-Dokumentation wurde punktgenau auf den Zwei-Pass-Dedup-Stand nach
Plan 11-05 nachgezogen (D-08), alle sieben `.planning/codebase/`-Dateien wurden vollständig
regeneriert (D-14), und die regenerierte `CONCERNS.md` wurde mechanisch gegen `11-CONCERNS-TRIAGE.md`
abgeglichen — 24 Befunde gezählt, 3 als konsistente Wiederkehr bereits dispositionierter Punkte
bestätigt, 21 neu, davon 13 mit neuen `DEBT-17`..`DEBT-29`-IDs in den Backlog übernommen (D-13/D-15).

## Was wurde gebaut

**Task 1 (bereits committet in `4eb2dbf`):** `docs/build-system.md`, `CLAUDE.md`, `.planning/STATE.md`
und der Modulkopf-Docstring in `build.py` beschreiben den Build jetzt so, wie er nach Phase 11
tatsächlich läuft — zwei Dedup-Pässe statt drei, doppelte Top-Level-Deklarationen werden über den
Quell-Pre-Check `check_duplicate_functions()` vor dem Bündeln abgefangen (kein Post-Bundle-Kommentar-
Trick mehr), und Module/Templates/CSS werden ausschließlich aus `loader.js`/`assets/styles.css`
zur Build-Zeit gelesen statt in zwei synchron zu haltenden Listen gepflegt.

**Task 2 (bereits committet in `81198f9`, `ddb8f6e`, `81be21b`):** Interaktiver `/gsd-map-codebase`-
Refresh durch den Entwickler. Alle sieben Dateien unter `.planning/codebase/` tragen seither den
Stand vom 2026-07-26.

**Task 3 (dieser Durchlauf, committet in `3b4bc92`):**

1. **Aktualität der sieben Dateien geprüft.** Änderungsdatum aller sieben Dateien: 2026-07-26
   (`git log -1 --format=%cs -- .planning/codebase/`). Modulzahl: `123` (nicht `92`) in
   `STACK.md`, `STRUCTURE.md`, `ARCHITECTURE.md` — kein `92 `-Treffer mehr in diesen Dateien.
   Alle sieben Dateien erwähnen "bestiary"; sechs "PWA"; sechs "Datei-Backup"/"file-backup"; fünf
   "Command-Palette" — jeweils über der geforderten Mindestschwelle.

   Zwei echte Fehler dabei gefunden und korrigiert (nicht Teil der ursprünglich erwarteten
   Korrekturliste, sondern durch den echten Testlauf in Schritt 3 aufgedeckt):
   - `TESTING.md` behauptete „CI (…) runs typecheck + lint + Jest + Python build tests — E2E is NOT
     run in CI (separate gate before deploy)". Das widerspricht `.github/workflows/ci.yml`: der
     `e2e`-Job läuft blockierend (`needs: [lint-and-typecheck, test]`), und `build` hängt wiederum von
     `e2e` ab — seit Phase 8 (D-03). Korrigiert auf eine korrekte Sechs-Jobs-Beschreibung
     (`lint-and-typecheck`, `test`, `e2e`, `build`, `smoke-test`, `deploy`).
   - `STACK.md` und `TESTING.md` nannten „318 Playwright-Tests bestehend". Ein echter Lauf in dieser
     Sitzung ergab **319 passed / 2 skipped**. Beide Dateien auf den gemessenen Wert korrigiert
     (`STACK.md:221`, `TESTING.md:45,327`); die Anzahl statischer `test()`-Aufrufe wurde ebenfalls
     nachgezählt (`311`, nicht die vormals genannten `313`).

2. **Abgleich der regenerierten `CONCERNS.md` gegen `11-CONCERNS-TRIAGE.md`.** Siehe Tabelle unten
   für die Gegenüberstellung. Ergebnis vollständig dokumentiert in
   `11-CONCERNS-TRIAGE.md` §„Nach dem Map-Refresh hinzugekommen" (24 Einzelbefunde, jeweils mit
   Live-Code-Beleg, den ich in dieser Sitzung per `sed`/`grep` gegengeprüft habe — u. a. den
   kritischsten neuen Befund, DEBT-17, direkt am Code nachvollzogen: `persistence.js:64-68` löscht
   den localStorage-Schatten nach dem IDB-Write, `file-backup-manager.js:261-264` liest aber
   weiterhin ausschließlich aus localStorage, `writeBackupForCampaign()`/`pruneOldSnapshots()`
   (`:100-173`) schreiben und prunen daraufhin über echte Snapshots hinweg).

3. **Volle lokale Testkette gefahren** (Ergebnisse unten). Alle Schritte grün.

## Abgleich CONCERNS.md ↔ Triage — Zahlen gegenübergestellt

| Größe | Wert | Quelle |
|---|---|---|
| Diskrete Befunde in der regenerierten `CONCERNS.md` | **24** | `grep -c "^### " .planning/codebase/CONCERNS.md`, in dieser Sitzung ausgeführt |
| Im Auftragskontext kursierende Erwartung | 26 | nicht durch ein in dieser Sitzung ausgeführtes Kommando bestätigt — verworfen zugunsten des gemessenen Werts 24 |
| Alt-Triage-Zeilen (unverändert aus Plan 11-06) | 46 (+4 STATE.md-Ergänzungen S1–S4) | `11-CONCERNS-TRIAGE.md` Kopfzeile, unverändert |
| Neue Befunde, die sich mit bereits dispositionierten Alt-Einträgen decken (kein Widerspruch) | 3 | class-Attribut (= Alt-21, akzeptiert), pushUndo() (= Alt-23/34, DEBT-06), sanitizeHTML-Dopplung (= Alt-20/42, erledigt) |
| Genuinely neue Befunde | 21 | überwiegend Datei-Backup/Migration/Soundboard/Wuerfelstatistik-Subsysteme, die im alten (2026-06-11) `CONCERNS.md` nicht existierten (per Grep bestätigt: 0 Treffer für "file-backup", "soundboard", "migration-wizard", "command-palette", "dice-stats" in der alten Triage) |
| Davon `uebernommen` (neue `DEBT-`-ID) | 13 | DEBT-17 bis DEBT-29 |
| Davon `akzeptiert` (kein neuer Backlog-Posten) | 8 | dokumentiertes Niedrig-Risiko oder zu trivial |
| Widersprüchliche Wiederkehr eines `erledigt`-Postens | 0 | keiner der 22 alten `erledigt`-Einträge taucht in der neuen `CONCERNS.md` als tatsächlich offener Zustand wieder auf |
| `DEBT-`-IDs gesamt nach diesem Task | 29 (DEBT-01..DEBT-29) | `.planning/REQUIREMENTS.md` und `11-CONCERNS-TRIAGE.md`, Mengen identisch (`diff` auf beide `grep -oE "DEBT-[0-9]+"`-Listen in dieser Sitzung: leer) |

**Erklärung der Differenz 24 (neu gezählt) vs. 26 (Erwartung aus dem Auftragskontext):** die
Erwartung stammte nicht aus einem in dieser Sitzung ausgeführten Kommando und wurde deshalb nicht
übernommen. `grep -c "^### "` gegen die tatsächlich vorliegende, committete `CONCERNS.md` liefert
mechanisch nachvollziehbar 24 (6+3+4+5+3+3 über die sechs `##`-Abschnitte). Die Struktur der neuen
`CONCERNS.md` (6 thematische Abschnitte, „unabhängige Neubewertung" ohne vorherige Kenntnis der
Triage) unterscheidet sich vollständig von der alten neunteiligen Gliederung — ein direkter
Zeilen-zu-Zeilen-Vergleich war nie möglich, nur ein inhaltlicher Abgleich pro Befund, wie ihn dieser
Task durchgeführt hat.

## Testkette — tatsächliche Ergebnisse dieser Sitzung

| Schritt | Ergebnis |
|---|---|
| `PYTHONIOENCODING=utf-8 python build.py` | Exit 0, `dist/dnd-tracker-bundled.html` 2.954.983 Zeichen (2,82 MB) |
| `PYTHONIOENCODING=utf-8 python build.py --production` | Exit 0, `dist/dnd-tracker-optimized.html` 2.601.548 Zeichen (2,48 MB), `CACHE_VERSION` gebumpt auf `dnd-tracker-v2.6.1-202607261834`, DEBUG_MODE-Verifikation bestanden |
| `python -m pytest tests/build/ -v` | **24 passed** |
| `npm test` (Jest) | **621 passed**, 26 Test-Suites, 0 fehlgeschlagen |
| `npx playwright test` | **319 passed / 2 skipped** (0 fehlgeschlagen) — entspricht der erwarteten Baseline (Erwartung „318" war die veraltete Zahl, siehe Korrektur oben; kein Playwright-Fail, die vermerkte Toast-Race in `locations.spec.js`/`encounters.spec.js` (DEBT-15) trat in diesem vollständigen Lauf nicht auf) |
| Smoke-Test gegen `dist/dnd-tracker-optimized.html` über lokalen HTTP-Server (`python -m http.server`, `SMOKE_BASE_URL`) | **8 passed** (Tab-Sweep über 6 Tabs, Boot ohne Konsolenfehler, keine Favicon-404/Meta-Tag-Deprecation) |

Alle sechs Schritte grün, keine Abweichung von der erwarteten Baseline im Sinne einer echten
Regression gefunden.

## Ausstehend — bewusst NICHT ausgeführt

Das letzte Akzeptanzkriterium des Plans verlangt einen `git push` und die Prüfung des GitHub-
Actions-Tabs (sechs grüne Jobs, keine Node-Deprecation-Annotation). **Dieser Schritt wurde
absichtlich nicht ausgeführt** — Push-Entscheidungen liegen beim Nutzer. Alles andere in Task 3 ist
abgeschlossen; der Push und die anschließende CI-Prüfung sind der einzige verbleibende Schritt, um
Roadmap-Kriterium 3 vollständig nachzuweisen.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `TESTING.md` behauptete fälschlich, E2E laufe nicht in CI**
- **Found during:** Aktualitätsprüfung (Task 3, Teil 1), aufgedeckt durch Abgleich mit `.github/workflows/ci.yml`
- **Issue:** `TESTING.md:45` (Altfassung) schrieb „CI (…) runs typecheck + lint + Jest + Python build tests — E2E is NOT run in CI (separate gate before deploy)". Der `e2e`-Job ist seit Phase 8 (D-03) ein blockierendes CI-Gate (`build` hängt von `e2e` ab).
- **Fix:** Satz durch eine korrekte Beschreibung aller sechs CI-Jobs ersetzt.
- **Files modified:** `.planning/codebase/TESTING.md`
- **Commit:** `3b4bc92`

**2. [Rule 1 - Bug] Veraltete Playwright-Testzahl (318 statt 319)**
- **Found during:** Testkette-Lauf (Task 3, Teil 3)
- **Issue:** `STACK.md:221` und `TESTING.md:45,327` nannten „318 tests passing". Ein echter `npx playwright test`-Lauf in dieser Sitzung ergab 319 passed / 2 skipped.
- **Fix:** Beide Dateien auf den gemessenen Wert (319 passed / 2 skipped, 311 statische `test()`-Aufrufe) korrigiert.
- **Files modified:** `.planning/codebase/STACK.md`, `.planning/codebase/TESTING.md`
- **Commit:** `3b4bc92`

Keine weiteren Abweichungen — Task 3 wurde wie im Plan beschrieben ausgeführt.

## Known Stubs

Keine.

## Threat Flags

Keine neue Angriffsfläche eingeführt — dieser Task ändert ausschließlich Dokumentation und
Planungsartefakte (`.planning/codebase/*.md`, `11-CONCERNS-TRIAGE.md`, `REQUIREMENTS.md`).

## Self-Check

- `docs/build-system.md`, `CLAUDE.md`, `build.py`, `.planning/STATE.md` — FOUND, geändert in Task 1 (`4eb2dbf`)
- `.planning/codebase/ARCHITECTURE.md`, `CONCERNS.md`, `CONVENTIONS.md`, `INTEGRATIONS.md`, `STACK.md`, `STRUCTURE.md`, `TESTING.md` — FOUND, alle mit Änderungsdatum 2026-07-26
- `.planning/phases/11-architektur-build-hygiene/11-CONCERNS-TRIAGE.md` — FOUND, neue Sektion „Nach dem Map-Refresh hinzugekommen" vorhanden
- `.planning/REQUIREMENTS.md` — FOUND, DEBT-17..DEBT-29 vorhanden
- Commit `3b4bc92` — FOUND (`git log --oneline --all | grep 3b4bc92`)
- Commit `4eb2dbf` — FOUND
- Commit `81198f9` — FOUND
- Commit `ddb8f6e` — FOUND
- Commit `81be21b` — FOUND
- `diff` der `DEBT-`-ID-Mengen zwischen `REQUIREMENTS.md` und `11-CONCERNS-TRIAGE.md` — leer (identisch)

## Self-Check: PASSED
