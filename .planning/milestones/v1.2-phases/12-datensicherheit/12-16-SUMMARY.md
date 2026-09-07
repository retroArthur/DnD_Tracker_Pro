---
phase: 12-datensicherheit
plan: 16
subsystem: migration
tags: [migration-wizard, full-export, dice-favorites, campaign-index, quick-reference, audio-import, sec-05, sec-06, wr-03]

# Dependency graph
requires:
  - phase: 12-datensicherheit
    provides: "12-14 (SEC-01, restrukturierter Import-try in migration-wizard.js), 12-15 (SEC-07, Groessengrenzen in audio-export.js)"
provides:
  - "SEC-05 geschlossen: importFullExport() fuehrt Wuerfel-Favoriten und Kampagnen-Index zusammen statt sie zu ersetzen — nichts Lokales verschwindet, was der Import nicht kennt"
  - "SEC-06 geschlossen: quickRefCustom zaehlt als Inhalt; die Lueckenklasse ist per Vollstaendigkeitstest ueber alle D-Schluessel des Repos geschlossen, nicht nur der eine Schluessel nachgetragen"
  - "WR-03 behoben: die Audio-Importgrenze folgt zur Aufrufzeit aus AUDIO_EXPORT_SAFE_RAW_BYTES statt einer unabhaengig gewaehlten Zahl"
affects: [12-17]

# Actuals (#2632)
actuals:
  tokens: 8700
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Zusammenfuehren statt Ersetzen bei einmaligen, unumkehrbaren Imports: der Import gewinnt bei Ueberschneidung, erhalten bleibt nur, was der Import gar nicht kennt (full-export.js Favoriten- und Index-Merge)"
    - "Ausdrueckliche, pruefbare Ausschlussliste (CAMPAIGN_CONTENT_EXCLUDED) statt reiner Kommentarprosa — ein Vollstaendigkeitstest haelt jeden verwendeten D-Schluessel gegen die Vereinigung aus Inhalts- und Ausschlussliste, ein neuer Schluessel erzwingt eine Entscheidung"
    - "Groessengrenzen ableiten statt unabhaengig kalibrieren: getAudioImportMaxBytes() berechnet die Importgrenze zur Aufrufzeit aus der Exportgrenze (Base64-Aufblaehung + JSON-Huellen-Aufschlag, gedeckelt durch die V8-Zeichengrenze)"

key-files:
  created: []
  modified:
    - systems/migration/full-export.js
    - systems/migration/migration-wizard.js
    - tests/unit/full-export.test.js
    - tests/unit/migration-wizard.test.js

key-decisions:
  - "Favoriten-Gleichheit ueber Name UND Notation (Form { name, notation }, kein id-Feld) statt der abweichenden Alt-Testvorlage { id, name, formula } — die echte Form aus features/dice/dice-favorites.js:9-14 verwendet, wie im Plan gefordert"
  - "Kampagnen-Index-Merge: importierte Eintraege zuerst, dann lokale Eintraege ohne Import-Pendant; active stammt immer aus dem Import — asymmetrisch und bewusst so (Design-Regel im Plan)"
  - "timers und campaign zusaetzlich in CAMPAIGN_CONTENT_EXCLUDED aufgenommen, obwohl der automatisierte D.-Regex-Sweep sie NICHT findet (dynamischer D[key]-Zugriff ueber requiredArrays/requiredObjects in render/helpers.js) — beim manuellen Sweep (Schritt 1) entdeckt und aus Konsistenz mit dem bereits vorhandenen Kommentarblock (Zeilen 48/61-62) in die pruefbare Liste uebernommen"
  - "getAudioImportMaxBytes() als eigenstaendige Top-Level-Funktion statt Inline-Berechnung — direkt aus dem vm-Testkontext aufrufbar, ohne einen weiteren window.*-Export zu brauchen"
  - "JSON_ENVELOPE_OVERHEAD_BYTES (10 MiB) grosszuegig bemessen: die Grenze soll nicht knapp am realen Dateiformat vorbeischrammen, bleibt aber weit unter der V8-Zeichengrenze"

patterns-established: []

requirements-completed: [SAFE-04, SAFE-01]

coverage:
  - id: D1
    description: "Vorhandene Wuerfel-Favoriten ueberleben den Import; importierte kommen hinzu"
    requirement: SAFE-04
    verification:
      - kind: unit
        ref: "tests/unit/full-export.test.js#SEC-05 Test A: lokale Favoriten ueberleben, importierte kommen hinzu, lokale zuerst"
        status: pass
    human_judgment: false
  - id: D2
    description: "Wortgleiche Favoriten (Name UND Notation) entstehen nicht doppelt"
    requirement: SAFE-04
    verification:
      - kind: unit
        ref: "tests/unit/full-export.test.js#SEC-05 Test B: wortgleicher Favorit (Name UND Notation) entsteht nicht doppelt"
        status: pass
    human_judgment: false
  - id: D3
    description: "Ein lokaler Kampagnen-Index-Eintrag, den der Import nicht kennt, bleibt erhalten"
    requirement: SAFE-04
    verification:
      - kind: unit
        ref: "tests/unit/full-export.test.js#SEC-05 Test D: ein lokaler Index-Eintrag, den der Import nicht kennt, bleibt erhalten; active stammt aus dem Import"
        status: pass
    human_judgment: false
  - id: D4
    description: "Bei Ueberschneidung gewinnt der Import"
    requirement: SAFE-04
    verification:
      - kind: unit
        ref: "tests/unit/full-export.test.js#SEC-05 Test E: ueberschneidender Key -> der Import gewinnt (Name aus dem Import, nicht doppelt)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Eine Kampagne mit nur quickRefCustom gilt nicht als Frischinstallation"
    requirement: SAFE-04
    verification:
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#SEC-06 Durchstich: Kampagne mit ausschliesslich quickRefCustom -> isFreshInstall() false"
        status: pass
    human_judgment: false
  - id: D6
    description: "Jeder D-Schluessel des Repos ist als Inhalt gelistet oder begruendet ausgeschlossen"
    requirement: SAFE-04
    verification:
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#SEC-06 Vollstaendigkeit: jeder verwendete D-Schluessel ist als Inhalt gelistet oder begruendet ausgeschlossen"
        status: pass
    human_judgment: false
  - id: D7
    description: "Die Audio-Importgrenze folgt aus dem Rohbyte-Rahmen des Exports"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#WR-03 Test A: die Ableitung liefert fuer 300 MiB Rohbytes mindestens 400 MiB und bleibt unter der V8-Zeichengrenze (512 MiB)"
        status: pass
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#WR-03 Test C: eine Datei knapp ueber 400 MiB wird NICHT sofort abgelehnt — der Lesevorgang beginnt"
        status: pass
    human_judgment: false
  - id: D8
    description: "Mutationsnachweise: zurueckgedrehte Zusammenfuehrung, entfernter Listeneintrag, feste Grenze"
    requirement: SAFE-04
    verification:
      - kind: manual_procedural
        ref: "Pre-Fix-Quelltext je Task gegen die neuen Tests gelaufen — siehe Abschnitt 'Rote Vorlaeufe und Mutationsnachweise' unten"
        status: pass
    human_judgment: false

duration: ~50min
completed: 2026-09-05
status: complete
---

# Phase 12 Plan 16: SEC-05/SEC-06/WR-03 — Umzugs-Import fuehrt zusammen, Inhaltsfrage ist vollstaendig, Groessengrenzen sind kalibriert Summary

**Der einmalige Umzugs-Import ueberschreibt keine lokalen Wuerfel-Favoriten und Kampagnen-Index-Eintraege mehr, die Frischinstallations-Erkennung ist gegen alle 38 im Repo verwendeten D-Schluessel vollstaendigkeitsgeprueft, und die Audio-Importgrenze leitet sich aus der Exportgrenze ab statt unabhaengig davon zu stehen.**

## Performance

- **Duration:** ~50 min
- **Completed:** 2026-09-05
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- **SEC-05:** `importFullExport()` (`full-export.js`) liest den lokalen Wuerfel-Favoriten-Bestand vor dem Schreiben und fuehrt ihn mit den importierten zusammen (lokal zuerst, Gleichheit ueber Name+Notation, keine Doppelten); der Kampagnen-Index wird ebenso zusammengefuehrt — importierte Eintraege gewinnen bei Ueberschneidung, lokale Eintraege ohne Import-Pendant bleiben erhalten, `active` stammt aus dem Import. Rueckgabewert um `preservedFavoritesCount`/`preservedIndexEntriesCount` erweitert.
- **SEC-06:** `CAMPAIGN_CONTENT_ARRAYS` um `quickRefCustom` erweitert; neue, nach `window` exportierte Konstante `CAMPAIGN_CONTENT_EXCLUDED` mit 18 begruendeten Ausschluessen macht die bisher nur als Kommentarprosa existierende Ausschlussregel pruefbaren Quelltext. Ein neuer Vollstaendigkeitstest scannt `core/systems/features/ui/utils/render` nach allen verwendeten `D.xxx`-Zugriffen und haelt sie gegen die Vereinigung aus Inhalts- und Ausschlussliste.
- **WR-03:** neue Funktion `getAudioImportMaxBytes()` leitet die Audio-Importgrenze zur Aufrufzeit aus `window.AUDIO_EXPORT_SAFE_RAW_BYTES` ab (Base64-Aufblaehung 4/3 + JSON-Huellen-Aufschlag, gedeckelt durch die V8-Zeichengrenze); die feste 350-MiB-Zahl ist aus dem Quelltext verschwunden.

## Task Commits

Each task was committed atomically:

1. **Task 1: SEC-05 — der Import fuehrt Wuerfel-Favoriten und Kampagnen-Index zusammen** - `ec69438` (fix)
2. **Task 2: SEC-06 — die Inhaltsfrage vollstaendig beantworten** - `1cf9584` (fix)
3. **Task 3: WR-03 — die Importgrenze folgt aus der Exportgrenze** - `67ea620` (fix)

_Note: Jede Task-Aenderung war Struktur-Fix + begleitende Tests im selben Commit (rot vor dem Fix verifiziert per Mutationsnachweis gegen den Vor-Fix-Quelltext, statt eines separaten vorab laufenden test-Commits — analog zu Plan 12-14/12-13 in dieser Welle)._

## Files Created/Modified

- `systems/migration/full-export.js` - `importFullExport()`: Wuerfel-Favoriten- und Kampagnen-Index-Merge statt Ersetzen; zwei neue Rueckgabewert-Felder
- `systems/migration/migration-wizard.js` - `CAMPAIGN_CONTENT_ARRAYS` um `quickRefCustom` erweitert; neue `CAMPAIGN_CONTENT_EXCLUDED`-Konstante + `window`-Export; neue Funktion `getAudioImportMaxBytes()`; `_processWizardAudioFile()` nutzt die abgeleitete Grenze
- `tests/unit/full-export.test.js` - Quelltext-Zusicherung ersetzt (Lesen-vor-Schreiben statt Ueberschreib-Pinning); 6 neue SEC-05-Tests; `diceFavoritesBacking`/`getCampaignIndexMock` als kontrollierbare Testinfrastruktur ergaenzt
- `tests/unit/migration-wizard.test.js` - `ERWARTETE_CONTENT_ARRAYS` 17→18 Sammlungen; neuer Vollstaendigkeitstest ueber alle D-Schluessel; SEC-06-Durchstich; 4 neue WR-03-Tests inkl. FileReader-Attrappe

## Decisions Made

- Favoriten-Gleichheit ueber `{ name, notation }` (die echte Form, kein `id`-Feld) — die im Read-First-Hinweis genannte abweichende Alt-Testvorlage `{ id, name, formula }` wurde bewusst NICHT als Beleg fuer neue Tests verwendet, bleibt aber in den bestehenden, unveraenderten Tests (WR-04-Rundlauf) erhalten, wo sie weiterhin funktioniert (Fallback auf serialisierten Vergleich bei fehlendem `notation`-Feld)
- Index-Merge-Reihenfolge: importierte Eintraege zuerst, dann erhaltene lokale — `active` immer aus dem Import (Design-Regel im Plan, bewusst asymmetrisch)
- `timers` und `campaign` zusaetzlich in `CAMPAIGN_CONTENT_EXCLUDED` aufgenommen, obwohl der automatisierte `D.`-Regex-Sweep sie NICHT findet (dynamischer `D[key]`-Zugriff ueber `requiredArrays`/`requiredObjects`-Listen in `render/helpers.js:240-268`, nicht via literalem `D.timers`/`D.campaign`) — beim manuellen Sweep (Plan-Schritt 1) entdeckt; sie standen bereits als Prosa im bestehenden Kommentarblock (Zeilen 48, 61-62 vor dieser Aenderung) und wurden aus Konsistenz in die pruefbare Liste uebernommen, auch wenn der automatisierte Test sie ohnehin nicht verlangt haette
- `getAudioImportMaxBytes()` als eigenstaendige Top-Level-Funktion (nicht inline in `_processWizardAudioFile()`) — direkt aus dem vm-Testkontext aufrufbar, ohne weiteren `window.*`-Export

## Deviations from Plan

None — plan executed exactly as written. Die Aufnahme von `timers`/`campaign` in die Ausschlussliste (siehe Decisions oben) ist Rule-2-artig (Vervollstaendigung einer bereits im Kommentar dokumentierten, aber bisher nicht pruefbaren Aussage) und geht nicht ueber den vom Plan verlangten Sweep-Umfang hinaus — der Plan selbst verlangt ausdruecklich: "findet der Sweep weitere Schluessel, gilt fuer sie dieselbe Regel."

## Der vollstaendige Sweep (SEC-06, Plan-Schritt 1)

Methodik: `grep`-Sweep nach dem Muster `\bD\.[a-zA-Z_][a-zA-Z0-9_]*` ueber `core/`, `systems/`, `features/`, `ui/`, `utils/`, `render/` (NICHT `tests/` oder `dist/`), ergaenzt um eine manuelle Pruefung auf dynamischen `D[key]`-Zugriff (fand zwei zusaetzliche Schluessel, die der reine `D.`-Regex nicht sieht: `timers`, `campaign`, beide in `render/helpers.js` `validateDataIntegrity()` ueber die Listen `requiredArrays`/`requiredObjects`). Der automatisierte Vollstaendigkeitstest in `migration-wizard.test.js` verwendet ausschliesslich die reine `D.`-Regex-Variante (36 Treffer) — `timers`/`campaign` sind dort nicht Teil der pruefpflichtigen Menge, wurden aber trotzdem in `CAMPAIGN_CONTENT_EXCLUDED` aufgenommen (siehe Decisions).

**Gefundene 38 Schluessel, vollstaendig eingeordnet:**

| Schluessel | Einordnung |
|---|---|
| characters, npcs, quests, locations, encounters, loot, spells, wiki, sessionNotes, storyArcs, bestiary, sessionPreps, factions, shops, links, filters, tags | `CAMPAIGN_CONTENT_ARRAYS` (bestehend) |
| quickRefCustom | `CAMPAIGN_CONTENT_ARRAYS` (NEU, dieser Plan — SEC-06) |
| quickNotes, dmScreenNotes | `CAMPAIGN_CONTENT_TEXT_FIELDS` (bestehend) |
| soundboard, calendar, initiative | Kopfsegmente von `CAMPAIGN_CONTENT_PATHS` — nur ihre benannten Unterlisten (`soundboard.scenes`, `calendar.events`, `initiative.combatants`) zaehlen als Inhalt, die Objekte selbst nicht |
| settings, randomTables, dmScreenLayout, dmScreenProfiles, dmScreenActiveProfile, bestiaryFavorites, monsterFavorites, wikiRecentlyViewed, diceHistory, sessionHistory, partyGold, _nextId, _version | `CAMPAIGN_CONTENT_EXCLUDED` (bereits als Kommentarprosa dokumentiert, jetzt pruefbarer Quelltext) |
| timers, campaign | `CAMPAIGN_CONTENT_EXCLUDED` (manuell via dynamischem `D[key]`-Zugriff in `render/helpers.js` gefunden, nicht per Regex) |
| lastSessionDuration, notes, items | `CAMPAIGN_CONTENT_EXCLUDED` (NEU, dieser Plan — SEC-06: `lastSessionDuration` Nebenprodukt der Sitzungsuhr; `notes` toter Schluessel, nur `systems/backups.js:340` liest ihn defensiv; `items` Altlast aus dem Leerschema von `createCampaign()`, `systems/campaign-manager/campaign-manager.js:43`, im Code nie gelesen) |

18 Inhalt (Arrays) + 2 Inhalt (Textfelder) + 3 Pfad-Kopfsegmente + 18 Ausschluesse = 41 Eintraege fuer 38 eindeutige Schluessel (kein Widerspruch: 3 der 18 Arrays/Textfelder/Ausschluesse ueberschneiden sich nicht mit den Pfad-Kopfsegmenten — die Summe zaehlt Kategorien, nicht Schluessel; jeder der 38 Schluessel erscheint in genau einer Kategorie).

## Rote Vorlaeufe und Mutationsnachweise

**Task 1 (SEC-05):** Baseline vor der Aenderung: 16 Tests in `full-export.test.js`. Nach Fix + 6 neuen Tests: 22/22 gruen. Mutationsnachweis — Pre-Fix-Quelltext (`git show HEAD~1:...` vor dieser Aenderung) gegen die neue Testdatei gelaufen: 3 Tests fielen um (Test A: lokale Favoriten ueberleben; Test D: lokaler Index-Eintrag bleibt erhalten; Test F: Rueckgabewert nennt Zusammenfuehrungszahlen; die Quelltext-Zusicherung fiel ebenfalls um, nachdem sie so praezisiert wurde, dass sie nicht laenger zufaellig durch die unabhaengige `buildFullExport()`-Lesestelle "bestand"). Danach wiederhergestellt, erneut 22/22 gruen.

**Task 2 (SEC-06):** Baseline vor der Aenderung: 92 Tests. Nach Fix + 5 neuen/gewachsenen Tests: 97/97 gruen. Mutationsnachweis — `quickRefCustom` testweise wieder aus `CAMPAIGN_CONTENT_ARRAYS` entfernt: 5 Tests fielen um (die drei vom Plan geforderten Netze — Vollstaendigkeitstest, Erwartungstabellentest, Durchstich — plus zwei zusaetzliche, automatisch aus `ERWARTETE_CONTENT_ARRAYS` gespeiste `test.each`-Faelle). Danach wiederhergestellt, erneut 97/97 gruen.

**Task 3 (WR-03):** Nach Fix + 4 neuen Tests: 101/101 gruen (insgesamt in `migration-wizard.test.js`). Mutationsnachweis — der Aufruf `getAudioImportMaxBytes()` in `_processWizardAudioFile()` testweise durch die alte feste Zahl (`350 * 1024 * 1024`) ersetzt: WR-03 Test C ("eine Datei knapp ueber 400 MiB wird NICHT sofort abgelehnt") fiel um (405-MiB-Datei wurde unter der alten 350-MiB-Grenze faelschlich abgelehnt), die uebrigen drei WR-03-Tests blieben gruen (sie pruefen `getAudioImportMaxBytes()` direkt, nicht den Aufrufer). Danach wiederhergestellt, erneut 101/101 gruen.

**Gesamtsuite (`npx jest tests/unit`):** vor diesem Plan (Commit `80ef71c`) 831/831 gruen; nach diesem Plan 846/846 gruen (+15, exakt die Summe der drei Task-Deltas: +6, +5, +4).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SEC-05, SEC-06 und WR-03 vollstaendig geschlossen; Welle 10 (dieser Plan) ist damit abgeschlossen
- Welle 11 (Plan 12-17) ist entsperrt: Gesamtlauf aller fuenf Fix-Plaene dieser Runde (12-12 bis 12-16), Build-Tests, Playwright, und `dist/`-Neubau beider Bundles
- Scope-Grenzen eingehalten: `audio-export.js`, `systems/undo.js`, `systems/file-backup/file-backup-manager.js` unveraendert (verifiziert via `git diff --exit-code` — Exit-Code 0, keine Inhaltsaenderung); `ALLOWED_KEY_RE`, `MAX_IMPORT_CAMPAIGNS`, `stripNonUserData()`, `migrateData()` unangetastet; kein `dist/`-Neubau (bleibt Plan 12-17 vorbehalten)
- Bekannte, vorbestehende CRLF-Stat-Cache-Anomalie (`.claude/launch.json` sowie transiente Meldungen fuer `audio-export.js`/`file-backup-manager.js`) besteht unveraendert fort, unabhaengig von diesem Plan verifiziert

## Self-Check: PASSED

- FOUND: systems/migration/full-export.js
- FOUND: systems/migration/migration-wizard.js
- FOUND: tests/unit/full-export.test.js
- FOUND: tests/unit/migration-wizard.test.js
- Commits found in git log: ec69438, 1cf9584, 67ea620

---
*Phase: 12-datensicherheit*
*Completed: 2026-09-05*
