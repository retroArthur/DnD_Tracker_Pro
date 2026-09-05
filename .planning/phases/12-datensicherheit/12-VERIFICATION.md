---
phase: 12-datensicherheit
verified: 2026-09-05T11:24:57Z
status: gaps_found
score: 8/9 must-haves verified (1 neuer, unabhängig reproduzierter BLOCKER aus 12-REVIEW.md)
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 8/8
  gaps_closed:
    - "SEC-04 (CRITICAL, SAFE-02): `_hatKampagnenInhalt()` ersetzt die reine Schlüsselzahl-Leerprüfung in allen drei Stufen von `readCampaignDataForBackup()`. Selbst gegen `systems/file-backup/file-backup-manager.js:326-420` gelesen — Funktion vorhanden und in allen drei Stufen verdrahtet."
    - "SEC-03 (high, SAFE-02): `resolveBackupTargets()` löst den Namen des aktiven Backup-Ziels jetzt aus dem Kampagnenindex auf statt ihn bedingungslos „Standard-Kampagne“ zu nennen. Selbst gegen `file-backup-manager.js:147-246` gelesen."
    - "SEC-02 (high, SAFE-05): `undo()` (Zeile ~69) und `redo()` (Zeile ~108) serialisieren `window.D` jetzt in try/catch vor jeder Stack-Mutation, mit Warn-Toast statt ungefangener `TypeError`. Selbst gegen `systems/undo.js` gelesen — beide Stellen bestätigt."
    - "SEC-01 (high, SAFE-01): Import-`try` in `_processWizardFile()`/`_processWizardAudioFile()` endet strukturell nach dem Rücksprung aus der jeweiligen Importfunktion; der Nachlauf (Audio-Lückenbenennung) liegt außerhalb mit eigenem, nur protokollierendem try/catch. Selbst gegen `systems/migration/migration-wizard.js:529-605` gelesen."
    - "SEC-07 (low, SAFE-01): `schaetzeAudioRohbytes()` + `AUDIO_IMPORT_MAX_ENTRY_BYTES`/`AUDIO_IMPORT_MAX_TOTAL_BYTES` in `audio-export.js` begrenzen Einzelgröße und Gesamtvolumen VOR dem Base64-Decode. Selbst gegen `systems/migration/audio-export.js:48-62,380-405` gelesen."
    - "SEC-05/SEC-06/WR-03 (low, SAFE-04/SAFE-01): `importFullExport()` führt Würfel-Favoriten und Kampagnenindex jetzt zusammen statt zu ersetzen; `quickRefCustom` zählt als Inhalt; `getAudioImportMaxBytes()` leitet die Importgrenze aus der Exportgrenze ab. Selbst gegen `full-export.js:163-228` und `migration-wizard.js:75-112,636-678` gelesen."
  gaps_remaining: []
  regressions: []
  new_findings:
    - "CR-01 (12-REVIEW.md, 2026-09-05, CRITICAL, NEU — nicht Gegenstand der SEC-01..07-Runde): `importFullExport()` (`systems/migration/full-export.js:142-161`) validiert `campaign.data` erst INNERHALB der Schreibschleife, nicht davor. Eine Datei mit gültigen Kampagnen gefolgt von einer mit fehlendem/falsch typisiertem `data`-Feld schreibt die vorherigen Kampagnen bereits per `StorageAPI.setJSON()` nach localStorage, bevor der `throw` greift — der Kampagnenindex-Merge (Zeilen 163ff.) und der Favoriten-Merge laufen dann NIE, weil der Fehler aus `importFullExport()` herauspropagiert. Der Wizard zeigt `Import fehlgeschlagen`, obwohl bereits Daten geschrieben wurden, die aus dem Index nicht mehr erreichbar sind — genau die Garantie, die dem Phasenziel den Namen gibt ('...verliert oder überschreibt mehr stillschweigend Daten'). Unabhängig gegen den aktuellen Quelltext gelesen und bestätigt (siehe Abschnitt 'Eigene Quelltext-Prüfung CR-01' unten); der zugehörige Testblock `Ablehnungen — es wird nichts geschrieben, bevor geworfen wird` (`tests/unit/full-export.test.js:256-306`) deckt nur die VOR der Schleife laufenden Prüfungen ab, es existiert kein Test für 'gültige Kampagne gefolgt von ungültiger'."
warnings:
  - "12-SECURITY.md (`threats_open: 3`, Stand 2026-09-04) ist stale — SEC-01, SEC-02 und SEC-03 sind in den Plänen 12-13/12-14/12-12 geschlossen und hier unabhängig bestätigt. Der Frontmatter-Wert wurde in dieser Runde NICHT aktualisiert (außerhalb des Scopes dieses Verify-Laufs, rein dokumentarisch — der Code selbst ist korrekt)."
  - "ROADMAP.md § Phase 12 'Plans:' zeigt weiterhin '15/17 plans executed', obwohl alle 17 Pläne [x] sind und SUMMARY haben. Rein dokumentarisch, kein inhaltlicher Gap."
  - "WR-01 (12-REVIEW.md, `systems/avatars.js:6-31`, Warning): `validateAvatarURL()` blockt `javascript:`-Präfixe nur nach `trim()`, nicht nach Entfernen eingebetteter Steuerzeichen (`java\\tscript:`-Bypass). Aktuell nicht ausnutzbar (`entity.avatar` wird repoweit nur über `<img src>` mit `esc()` gerendert), liegt aber außerhalb des Anforderungsbereichs SAFE-01..06 (kein Daten-Verlust/-Überschreiben in Backup/Export/Migration) — kein Phase-12-Gap, zur Kenntnis genommen."
  - "IN-01 (12-REVIEW.md, `loader.js:9`, Info): Kommentar behauptet eine zweite, mit build.py synchron zu haltende Modulliste — widerspricht der in CLAUDE.md dokumentierten SSOT-Architektur aus Phase 11. Rein kosmetisch, kein Phase-12-Gap."
  - "REQUIREMENTS.md (Zeilen 26-52) trägt SAFE-01..06 weiterhin mit dem Stand 'Phase 12: 12-0X komplett' ohne die Gap-Closure-Pläne 12-09..12-17 zu referenzieren. Rein dokumentarisch."
gaps:
  - truth: "Kein Migrations-Bedienpfad überschreibt oder verwaist bereits geschriebene Kampagnendaten stillschweigend, wenn ein späterer Eintrag in derselben Importdatei ungültig ist"
    status: failed
    reason: "importFullExport() prüft campaign.data erst innerhalb der Schreibschleife (nach vorherigen erfolgreichen StorageAPI.setJSON()-Aufrufen in derselben Schleife), nicht davor. Ein Formfehler in einem späteren Kampagnen-Eintrag lässt frühere, bereits geschriebene Kampagnen als index-unerreichbare Datensätze zurück, während der Wizard 'Import fehlgeschlagen' meldet."
    artifacts:
      - path: "systems/migration/full-export.js"
        issue: "Zeilen 142-161: Formprüfung von campaign.data steht in derselben for-Schleife wie StorageAPI.setJSON(), nicht in einer vorgelagerten, vollständigen Prüfschleife wie bei der bereits existierenden Key-Whitelist (Zeilen 135-140)."
    missing:
      - "Eine vorgelagerte Schleife, die campaign.data für ALLE Einträge validiert, BEVOR irgendein StorageAPI.setJSON()-Aufruf stattfindet (Fix-Vorschlag bereits in 12-REVIEW.md § CR-01 enthalten)."
      - "Ein Regressionstest in tests/unit/full-export.test.js, der eine gültige Kampagne gefolgt von einer Kampagne mit ungültigem data-Feld importiert und beweist, dass NICHTS geschrieben wurde (analog zum bestehenden describe-Block 'Ablehnungen — es wird nichts geschrieben, bevor geworfen wird')."
      - "Optional (vom Review als nicht-blockierender Zusatz genannt): Dokumentation/Benennung des verbleibenden Laufzeitfalls, in dem StorageAPI.setJSON() selbst zur Laufzeit scheitert (z. B. Quota), nachdem frühere Kampagnen bereits geschrieben wurden."
human_verification: []
---

# Phase 12: Datensicherheit — Verification Report (3. Re-Verifikation, nach Gap-Closure SEC-01..SEC-07)

**Phase Goal:** Kein Pfad in Backup, Export oder Migration verliert oder überschreibt mehr stillschweigend Daten, und die Randfälle, die solche Verluste bisher verdeckt haben, sind getestet.
**Verified:** 2026-09-05
**Status:** gaps_found
**Re-verification:** Ja — nach der Gap-Closure-Runde SEC-01..SEC-07 (Pläne 12-12 bis 12-17) und einem anschließenden Code-Review (`12-REVIEW.md`, Status `issues_found`, 1 Critical/CR-01, 1 Warning, 1 Info)

---

## Vorbemerkung zur Methode

Diese Runde prüft zwei Dinge unabhängig gegen den aktuellen Quelltext, nicht gegen SUMMARY-Behauptungen:

1. **Sind SEC-01 bis SEC-07 (aus der vorherigen `12-VERIFICATION.md`/`12-SECURITY.md`) tatsächlich geschlossen?** — Ja, alle sieben wurden selbst gegen den Quelltext gelesen (Zitate unten) und die zugehörige, vom Orchestrator gemeldete Jest-Zahl (893/893) wurde selbst nachvollzogen (`npx jest` lokal ausgeführt: 893 passed / 893 total, 30 Suiten, 1,66 s).
2. **Ist der von `12-REVIEW.md` unmittelbar vor dieser Verifikation gemeldete BLOCKER (CR-01, `importFullExport()`) real und ungelöst?** — Ja, siehe unten. Dieser Fund sitzt direkt auf dem wörtlichen Phasenziel ('...oder Migration ... überschreibt mehr stillschweigend Daten') und ist damit kein Randfund, sondern eine Kernverletzung der Phase-12-Garantie.

**Selbst ausgeführte Kommandos dieser Runde:**

| Kommando | Ergebnis |
|---|---|
| `npx jest` | 893 passed / 893 total, 30 Suiten, 1,66 s, exit 0 |
| `python -m pytest tests/build -q` | 24 passed, exit 0 |
| `grep -nE "TBD\|FIXME\|XXX"` über alle 6 geänderten Quelldateien + 6 Testdateien dieser Gap-Closure-Runde | 0 Treffer |
| `grep -n "test\.failing("` über alle `tests/unit/*.test.js` | 0 Treffer (beide zuvor verankerten Zeitbomben sind auf `test()` umgestellt) |
| Selbst gelesen: `systems/migration/full-export.js` (vollständig, 246 Zeilen) | CR-01 bestätigt real (siehe unten) |
| Selbst gelesen: `systems/undo.js:1-140`, `systems/file-backup/file-backup-manager.js` (Funktionssignaturen), `systems/migration/migration-wizard.js:480-610`, `systems/migration/audio-export.js:40-65,380-410` | SEC-01..07 bestätigt geschlossen |

`npm run build` und die volle Playwright-Suite wurden **nicht** erneut selbst ausgeführt (bereits vom Orchestrator unabhängig gemessen: exit 0 bzw. 321 passed/2 skipped; die beiden hier selbst nachvollzogenen Suiten — Jest und pytest — bestätigen dieselbe Größenordnung wie vom Orchestrator gemeldet, was die übernommenen Werte plausibilisiert).

---

## Eigene Quelltext-Prüfung CR-01

`systems/migration/full-export.js:142-161` (aktueller Stand, wörtlich):

```javascript
// Jede Kampagne migrieren und speichern
for (const [key, campaign] of campaignEntries) {
    if (!campaign.data || typeof campaign.data !== 'object') {
        throw new Error('Kampagne "' + key + '" hat keine gueltigen Daten');
    }
    // T-02-08: migrateData pro Kampagne (Sanitierung + Versions-Migration)
    let migratedData = campaign.data;
    if (typeof migrateData === 'function') {
        migratedData = migrateData(campaign.data);
    } else if (typeof window.migrateData === 'function') {
        migratedData = window.migrateData(campaign.data);
    }

    // Kampagnendaten speichern — mit {success, error}-Pruefung (StorageAPI-Muster)
    const saveResult = StorageAPI.setJSON(key, migratedData);
    if (!saveResult.success) {
        throw new Error('Speichern fehlgeschlagen: ' + (saveResult.error || 'Unbekannter Fehler'));
    }
    totalBytes += JSON.stringify(migratedData).length;
}
```

Die Formprüfung von `campaign.data` (Zeile 144) steht **in derselben Schleife** wie der Schreibzugriff
(Zeile 156) — anders als die bereits existierende Key-Whitelist-Prüfung (Zeilen 135-140), die
bewusst in einer **eigenen, vorgelagerten** Schleife läuft, bevor irgendetwas geschrieben wird. Bei
drei gültigen Kampagnen gefolgt von einer vierten mit fehlendem `data`-Feld werden die ersten drei
bereits vollständig geschrieben, bevor der `throw` bei der vierten greift. Der Kampagnenindex-Merge
(Zeilen 163-199) und der Favoriten-Merge (Zeilen 201-228) laufen danach **nie**, weil der Fehler aus
`importFullExport()` herauspropagiert — in `migration-wizard.js` führt das zu `showError('Import
fehlgeschlagen: ...')`, während die ersten drei Kampagnen bereits unter ihrem Key in `localStorage`
liegen, ohne jeden Eintrag im Kampagnenindex.

Gegenprobe im Testfile bestätigt die Lücke: `tests/unit/full-export.test.js:256-306`
(`describe('Ablehnungen — es wird nichts geschrieben, bevor geworfen wird', ...)`) deckt ausschließlich
die VOR der Schreibschleife laufenden Prüfungen ab (`_exportType`, `campaigns`, `campaignIndex`,
`MAX_IMPORT_CAMPAIGNS`, `ALLOWED_KEY_RE`) — kein Testfall mit einer gültigen Kampagne gefolgt von einer
Kampagne mit ungültigem `data`-Feld existiert. Das ist keine durch grüne Tests kaschierte Lücke,
sondern eine schlicht ungetestete.

**Warum dies ein Phase-12-Gap ist, kein Nebenbefund:** Der Phasenname und der wörtliche Ziel-Satz
lauten „Kein Pfad in Backup, Export oder **Migration** verliert oder überschreibt mehr **stillschweigend**
Daten". `importFullExport()` ist der zentrale Migrations-Importpfad (`SAFE-01`). Genau dieser Pfad
hinterlässt bei einer teilweise fehlerhaften Importdatei stillschweigend index-unerreichbare, aber
physisch vorhandene Kampagnendaten, während der Nutzer eine vollständige Fehlermeldung sieht, die
exakt das Gegenteil suggeriert (analog zur bereits in einer früheren Runde geschlossenen CR-01 zu
`wizard-skip`, nur an anderer Stelle desselben Imports).

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria + aus dem Phasenziel abgeleitete Truths)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Umzugs-Export `file://` → PWA enthält Soundboard-Audio und Würfelstatistik; nach dem Import spielen Szenen ihre Tracks, keine toten `blobId`s | ✓ VERIFIED (Regressionstiefe, `audio-export.js`/`full-export.js` Kernpfad dieser Runde nur um SEC-05/SEC-07 gehärtet, nicht funktional verändert) | Jest 893/893 grün inkl. `audio-export.test.js`, `full-export.test.js`; SEC-07-Härtung selbst gelesen (`audio-export.js:48-62,380-405`) |
| 2 | Datei-Backup umfasst alle Kampagnen; zwei Kampagnen mit demselben `safeName` überschreiben sich nicht; keine Kampagne wird fälschlich als „leer" übersprungen; keine Kampagne verliert ihre Namens-Identität im Dateinamen | ✓ VERIFIED — **SEC-04 und SEC-03 geschlossen** | Selbst gelesen: `_hatKampagnenInhalt()` (`file-backup-manager.js:326-420`) ersetzt die Schlüsselzahl-Prüfung in allen drei Stufen von `readCampaignDataForBackup()`; `resolveBackupTargets()` (Zeilen 147-246) löst den Namen des aktiven Ziels aus dem Index auf. `file-backup.test.js` enthält benannte SEC-04/SEC-03-Tests mit Mutationsnachweis laut SUMMARY, Suite läuft grün mit. |
| 3 | `Strg+Z` nach dem Löschen einer Audiodatei stellt Blob und Szenen-Referenz wieder her | ✓ VERIFIED (Regressionstiefe, unverändert seit Erstverifikation — `soundboard-crud.js`/`soundboard-idb.js` von keinem Plan dieser Runde berührt) | `soundboard.test.js` unverändert grün, kein Diff an den betroffenen Dateien |
| 4 | Umzugs-Wizard bietet sich einem Nutzer mit vorhandenen Daten nicht an — auch nicht bei gesetztem `STORAGE_KEY_OVERRIDE`, im IndexedDB-Modus, oder wenn ausschließlich `quickRefCustom` befüllt ist | ✓ VERIFIED — **SEC-06 zusätzlich geschlossen** | Selbst gelesen: `CAMPAIGN_CONTENT_ARRAYS` enthält jetzt `quickRefCustom` (`migration-wizard.js:92`), `CAMPAIGN_CONTENT_EXCLUDED` (Zeile 112ff.) macht die Ausschlussregel prüfbar. `migration-wizard.test.js` mit SEC-06-Vollständigkeitstest läuft grün mit. |
| 5 | Parse-Fehler in `undo()`/`redo()` lässt die Stacks unverändert; kritische Saves laufen unabhängig vom `autosave-toggle`; ein gescheiterter Push/Pop bei nicht-serialisierbarem `D` bricht ohne Stack-Mutation ab statt ungefangen zu werfen | ✓ VERIFIED — **SEC-02 geschlossen** | Selbst gelesen: `systems/undo.js` — `undo()` (Zeile ~69) und `redo()` (Zeile ~108) serialisieren jetzt in try/catch mit Warn-Toast, vor jeder Stack-Mutation. `stability.test.js` mit benannten SEC-02-Tests + Invariante läuft grün mit. |
| 6 | Tests decken den >5-MB-IDB-only-Save mit Reload, den localStorage-Quota-Fallback und den Export/Import-Versions-Rundlauf ab | ✓ VERIFIED (Regressionstiefe, unverändert seit Nyquist-Nachzug 2026-09-04) | `stability.test.js`/`full-export.test.js`-Kernblöcke dieser Runde nicht am Kernverhalten geändert; alle zugehörigen Tests laufen in den 893 grün mit |
| 7 *(abgeleitet, bereits in vorheriger Runde geschlossen)* | Nach einem abgeschlossenen Migrations-Import überschreibt kein Wizard-Bedienpfad (`wizard-skip`/`wizard-close`) die frisch importierten Daten stillschweigend | ✓ VERIFIED (Regressionstiefe — `_wizardStep`-Reload-Pfad von dieser Runde nicht berührt) | Kein Diff an den betroffenen Zeilen (`migration-wizard.js:641-654` laut `git diff`/Scope-Fence-Aussagen der Pläne 12-12..12-17) |
| 8 *(abgeleitet, bereits in vorheriger Runde geschlossen)* | Ein Datei-Backup schreibt niemals die Daten einer anderen (aktiven) Kampagne in die Backup-Datei einer Kampagne, deren eigene Daten fehlen | ✓ VERIFIED (Regressionstiefe, CR-02-Wächter von SEC-03 nicht zurückgenommen, nur präzisiert) | `readCampaignDataForBackup()` Stufe 3 (Zeile 554) prüft weiterhin `campaignKey === aktiverBackupKey` UND jetzt zusätzlich `_hatKampagnenInhalt(window.D)` |
| 9 *(neu abgeleitet aus dem Phasenziel, diese Runde)* | Kein Migrations-Bedienpfad überschreibt oder verwaist bereits geschriebene Kampagnendaten stillschweigend, wenn ein späterer Eintrag in derselben Importdatei ungültig ist | ✗ **FAILED — CR-01 (12-REVIEW.md)** | Selbst gelesen und bestätigt: `systems/migration/full-export.js:142-161` — siehe Abschnitt „Eigene Quelltext-Prüfung CR-01" oben. Kein Regressionstest vorhanden (`full-export.test.js:256-306` deckt nur die vorgelagerten Prüfungen ab). |

**Score:** 8/9 truths verified (0 present-but-behavior-unverified, 1 FAILED)

---

## Required Artifacts (Delta zur vorherigen Verifikation — Pläne 12-12 bis 12-17)

| Artifact | Expected | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `systems/file-backup/file-backup-manager.js` — `_hatKampagnenInhalt()` | Inhaltsbasierte Leerprüfung statt Schlüsselzahl, in allen 3 Stufen von `readCampaignDataForBackup()` | ✓ | ✓ Funktion vorhanden (Zeile 326) | ✓ In allen 3 Stufen verdrahtet (Zeilen 528, 538, 554) | ✓ VERIFIED |
| `systems/file-backup/file-backup-manager.js` — `resolveBackupTargets()` | Namensauflösung des aktiven Ziels aus dem Index | ✓ | ✓ | ✓ | ✓ VERIFIED |
| `systems/undo.js` — `undo()`/`redo()` | Geschützte Serialisierung vor Stack-Mutation | ✓ | ✓ try/catch mit Warn-Toast an beiden Stellen | ✓ | ✓ VERIFIED |
| `systems/migration/migration-wizard.js` — `_processWizardFile()`/`_processWizardAudioFile()` | Import-try endet nach Rücksprung aus Importfunktion | ✓ | ✓ (Zeilen 537-543, 605-606) | ✓ | ✓ VERIFIED |
| `systems/migration/audio-export.js` — `schaetzeAudioRohbytes()`/Größengrenzen | Einzel- und Gesamtgrenze vor `base64ToBlob()` | ✓ | ✓ (Zeilen 48-62, 380-405) | ✓ | ✓ VERIFIED |
| `systems/migration/full-export.js` — Favoriten-/Index-Merge | Zusammenführen statt Ersetzen | ✓ | ✓ (Zeilen 163-228) | ✓ | ✓ VERIFIED |
| `systems/migration/full-export.js` — `importFullExport()` Schreibschleife | Formprüfung ALLER Einträge VOR jedem Schreibzugriff | ✓ existiert | ✗ **Prüfung steht in derselben Schleife wie der Schreibzugriff, nicht davor** | — | ✗ **STUB-artiger Lückenschluss — CR-01** |
| `dist/dnd-tracker-bundled.html` + `dist/dnd-tracker-optimized.html` | Beide jünger als alle fünf geänderten Quelldateien dieser Runde | ✓ (laut 12-17-SUMMARY, `dist/` gitignored, nicht selbst nachprüfbar ohne eigenen Build) | — | — | Übernommen als Orchestrator-Faktum (12-17-SUMMARY Zeitstempel-Tabelle) |

---

## Requirements Coverage

| Requirement | Source Plan | Beschreibung | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| SAFE-01 | 12-01, 12-02, 12-09, 12-14, 12-15, 12-16 | Umzugs-Export enthält Audio + Würfelstatistik; kein Bedienpfad überschreibt den Import stillschweigend | ⚠️ **TEILWEISE — CR-01 offen** | Truth 1/7 VERIFIED; SEC-01/SEC-07 VERIFIED; **Truth 9 (CR-01, `importFullExport()`-Schreibschleife) FAILED** — derselbe Requirement-Bereich, andere Fundstelle als das bereits geschlossene SEC-01. |
| SAFE-02 | 12-01, 12-03, 12-10, 12-12 | Datei-Backup deckt alle Kampagnen kollisionsfrei ab, ohne Fremdzuordnung, ohne fälschliches Leer-Überschreiben | ✓ SATISFIED | Truth 2/8 VERIFIED; SEC-04/SEC-03 zusätzlich geschlossen. |
| SAFE-03 | 12-06 | Audio-Löschen rückgängig (Blob + Referenz) | ✓ SATISFIED | Unverändert seit Erstverifikation, von dieser Runde nicht berührt. |
| SAFE-04 | 12-04, 12-08, 12-16 | Wizard bietet sich Nutzern mit Daten nicht an | ✓ SATISFIED | Truth 4 VERIFIED; SEC-06 zusätzlich geschlossen. |
| SAFE-05 | 12-05, 12-11, 12-13 | Persistenz bei Fehlern/Sonderfällen vorhersagbar | ✓ SATISFIED | Truth 5 VERIFIED; SEC-02 zusätzlich geschlossen. |
| SAFE-06 | 12-01, 12-07 | Persistenz-Randfälle getestet | ✓ SATISFIED | Unverändert seit Erstverifikation. |

**Orphaned requirements:** keine. `.planning/REQUIREMENTS.md:26-52` mappt genau SAFE-01…SAFE-06 auf
Phase 12; alle sechs sind hier bewertet. Die Traceability-Notiz je Requirement referenziert die
Gap-Closure-Pläne 12-09..12-17 noch nicht (siehe `warnings`), rein dokumentarisch.

**Warum SAFE-01 nicht vollständig `SATISFIED` ist:** SAFE-01 deckt laut REQUIREMENTS.md ausdrücklich
den gesamten Migrations-Importpfad ab ("kein Bedienpfad überschreibt den Import stillschweigend" ist
die wörtliche Phasenziel-Formulierung, auf SAFE-01 gemappt). CR-01 sitzt in genau diesem Pfad
(`importFullExport()`), ist unabhängig reproduziert und nicht Teil der SEC-01..07-Fix-Runde.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `systems/migration/full-export.js` | 142-161 | Formprüfung innerhalb statt vor der Schreibschleife (CR-01) | 🛑 Blocker | Siehe oben — Kern-Gap dieser Runde. |
| — | — | `TBD`/`FIXME`/`XXX` in allen 6 geänderten Produktionsdateien + 6 Testdateien der Gap-Closure-Runde | — | **0 Treffer** (selbst per `grep -nE` bestätigt) |
| — | — | `test.failing(` (echte Aufrufe) über alle `tests/unit/*.test.js` | — | **0 Treffer** — beide zuvor verankerten Zeitbomben (IMPL-01/SEC-01, IMPL-02/SEC-02) sind entschärft und auf `test()` umgestellt, wie von 12-VALIDATION.md gefordert |
| `systems/avatars.js:6-31` | — | WR-01 (12-REVIEW.md): `validateAvatarURL()` blockt `javascript:` nur nach `trim()`, nicht nach Entfernen eingebetteter Steuerzeichen | ⚠️ Warning (außerhalb Phase-12-Scope) | Aktuell nicht ausnutzbar (`esc()` + `<img src>`), kein Backup/Export/Migration-Datenverlust — kein Phase-12-Gap |
| `loader.js:9` | — | IN-01 (12-REVIEW.md): Kommentar widerspricht der SSOT-Architektur (Phase 11) | ℹ️ Info | Rein kosmetisch |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Volle Jest-Suite | `npx jest` (selbst ausgeführt) | 893 passed / 893 total, 30 Suiten, exit 0 | ✓ PASS (selbst nachvollzogen, deckt sich mit Orchestrator-Angabe) |
| Build-Tests | `python -m pytest tests/build -q` (selbst ausgeführt) | 24 passed, exit 0 | ✓ PASS (selbst nachvollzogen) |
| Debt-Marker in allen 6 Produktions- + 6 Testdateien dieser Runde | `grep -nE "TBD\|FIXME\|XXX"` (selbst ausgeführt) | 0 Treffer | ✓ PASS |
| `test.failing(`-Zeitbomben entschärft | `grep -rn "test\.failing("` (selbst ausgeführt) | 0 Treffer in allen `tests/unit/*.test.js` | ✓ PASS |
| SEC-01..07 Quelltext-Belege | Direktes Lesen der 5 geänderten Produktionsdateien | Alle 7 Befunde strukturell im aktuellen Quelltext bestätigt | ✓ PASS |
| CR-01 Quelltext-Beleg | Direktes Lesen von `full-export.js` (vollständig) | Formprüfung bestätigt innerhalb der Schreibschleife, kein vorgelagerter Check | ✗ **FAIL — bestätigter Gap** |
| Volle Playwright-Suite (Orchestrator-Lauf, zweimal bestätigt laut 12-17-SUMMARY) | `npx playwright test` | 321 passed / 2 skipped, exit 0 | ✓ PASS (als Faktum übernommen, nicht selbst erneut ausgeführt) |
| `npm run build` (Orchestrator-Lauf) | `python build.py --production` | exit 0, alle Validierungen bestanden | ✓ PASS (als Faktum übernommen) |

---

## Gaps Summary

**Ein Gap blockiert den Phasenabschluss:** CR-01 aus `12-REVIEW.md` (`systems/migration/full-export.js:142-161`)
ist unabhängig gegen den aktuellen Quelltext reproduziert. `importFullExport()` prüft die Formkorrektheit
von `campaign.data` erst innerhalb der Schreibschleife statt davor — bei einer Importdatei mit gültigen
Kampagnen gefolgt von einer ungültigen werden die vorherigen Kampagnen bereits nach `localStorage`
geschrieben, bevor der Fehler geworfen wird, während der Kampagnenindex-Merge und der Favoriten-Merge
nie laufen. Der Nutzer sieht „Import fehlgeschlagen" über einem tatsächlich teilweise erfolgreichen,
index-unerreichbaren Schreibvorgang. Das ist exakt die Klasse von stillschweigendem Datenverlust/
-verwaisung, die dem Phasenziel den Namen gibt — kein Rand- oder Kosmetikbefund.

**Alle sieben SEC-01..SEC-07-Befunde aus der vorherigen Runde sind geschlossen** — unabhängig gegen
den aktuellen Quelltext gelesen (nicht nur aus SUMMARY übernommen), mit übereinstimmender Jest-Zahl
(893/893, selbst nachvollzogen) und 0 verbleibenden `test.failing(`-Zeitbomben. `12-SECURITY.md`
(`threats_open: 3`) ist entsprechend stale und sollte bei Gelegenheit nachgezogen werden — kein
inhaltlicher Gap, da der Code selbst korrekt ist.

**Kein offener menschlicher Prüfpunkt.** Der einzige verbliebene manuelle Prüfpunkt aus früheren Runden
(Audio-Bibliothek knapp unter 300 MiB im echten Browser) wurde am 2026-09-04 als UAT-Punkt 28 vom
Nutzer abgenommen (siehe ROADMAP.md Zeile 164) und ist damit erledigt, nicht mehr offen.

**Für die Nacharbeit (nicht Teil des CR-01-Blockers, aber vorgemerkt):**
1. `12-SECURITY.md` `threats_open: 3` → `0` nachziehen, sobald diese Verifikation eingearbeitet ist.
2. `REQUIREMENTS.md` bei SAFE-01/02/04/05 um die Gap-Closure-Pläne 12-09..12-17 ergänzen.
3. ROADMAP.md „Plans: 15/17" → „17/17" nachziehen.
4. WR-01 (`validateAvatarURL()` Steuerzeichen-Bypass) und IN-01 (`loader.js`-Kommentar) bei Gelegenheit beheben — beide nicht blockierend für Phase 12.

---

_Verified: 2026-09-05_
_Verifier: Claude (gsd-verifier)_
