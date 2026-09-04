---
phase: 12-datensicherheit
verified: 2026-09-04T00:00:00Z
status: gaps_found
score: 6/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 6/6
  gaps_closed:
    - "G-12-3 (SAFE-04): isFreshInstall() zählte nur characters/npcs/quests als Inhalt — Plan 12-08 hat hasCampaignContent() mit 22 belegten Stellen eingeführt und strukturell gegen initializeData() abgesichert (Commits ef00f38, 07d151c, c6b4d9a)."
  gaps_remaining: []
  new_findings:
    - "CR-01 (12-REVIEW.md, unabhängig vom Verifier gegen den Quelltext bestätigt): 'Überspringen'-Button im Migrations-Wizard bleibt nach erfolgreichem Import sichtbar/klickbar und überschreibt frisch importierte Daten stillschweigend über den beforeunload-Autosave. Kein Regressionstest deckte das ab, weil es kein von dieser Phase geänderter Codepfad ist, sondern eine vom Code-Review am 2026-09-04 aufgedeckte, vorbestehende Lücke im selben Modul, das 12-02 gebaut hat."
    - "CR-02 (12-REVIEW.md, unabhängig vom Verifier gegen den Quelltext bestätigt): readCampaignDataForBackup() liefert in Stufe 3 immer window.D, unabhängig vom angefragten campaignKey — bei jeder Kampagne ohne eigene gespeicherte Daten (u. a. der nie gespeicherten 'Standard-Kampagne', die resolveBackupTargets() unbedingt einträgt) landen die Daten der aktiven Kampagne in der Backup-Datei einer anderen. Kein bestehender Test setzt ctx.D in den _doBackup()-Multi-Kampagnen-Tests, deshalb unentdeckt."
  regressions: []
gaps:
  - truth: "Nach einem abgeschlossenen Migrations-Import überschreibt kein Wizard-Bedienpfad die frisch importierten Daten stillschweigend (Phasenziel, Migration; SAFE-01)"
    status: failed
    reason: "CR-01 — der 'Überspringen'-Button (data-action=\"wizard-skip\") wird außerhalb der .migration-step-Container gerendert und bleibt auf Schritt 4 (Erfolgsbestätigung nach Import) sichtbar. Sein Handler ruft nur _closeWizard() auf, OHNE window.location.reload() — anders als wizard-close/wizard-setup-backup, die exakt deshalb reloaden (Kommentar im Quelltext verweist auf CR-04). Der unbedingte beforeunload-Handler in systems/avatars.js:170-176 schreibt danach das stale window.D zurück in denselben Storage-Key und macht den Import rückstandslos rückgängig. Zusätzlich markiert wizard-skip migration-wizard-shown als skipped, sodass der Wizard beim nächsten Start nicht automatisch wiederkehrt."
    artifacts:
      - path: "systems/migration/migration-wizard.js"
        issue: "wizard-skip-Handler (Zeile ~627-632) nimmt nach erfolgreichem Import nicht denselben reload()-Pfad wie wizard-close/wizard-setup-backup; der Skip-Button ist zudem nicht auf Schritt 4 ausgeblendet"
    missing:
      - "wizard-skip nach Schritt >= 4 denselben window.location.reload()-Pfad nehmen lassen wie wizard-close"
      - "Skip-Button per showWizardStep() ab Schritt 4 ausblenden"
      - "Regressionstest: Klick auf wizard-skip NACH erfolgreichem _processWizardFile()-Import darf window.D nicht stale lassen bzw. muss einen reload() auslösen"
  - truth: "Ein Datei-Backup schreibt niemals die Daten einer anderen (aktiven) Kampagne in die Backup-Datei einer Kampagne, deren eigene Daten fehlen (SC2/SAFE-02: 'zwei Kampagnen ... überschreiben sich nicht gegenseitig')"
    status: failed
    reason: "CR-02 — readCampaignDataForBackup()s dritte Fallback-Stufe (file-backup-manager.js:409) ignoriert campaignKey vollständig und liefert bei istBefuellt(window.D) IMMER die aktive Kampagne zurück. resolveBackupTargets() trägt unbedingt eine 'Standard-Kampagne' (APP_CONFIG.STORAGE_KEY) als Ziel ein — legt ein Nutzer sofort eine eigene benannte Kampagne an, wird diese Standard-Kampagne nie gespeichert. Bei jedem Backup-Lauf bekommt dieses leere Ziel fälschlich die Daten der aktiven Kampagne zugeschrieben; der DEBT-17-Schutz (if (!data) continue) greift nicht, weil data nicht leer, nur falsch zugeordnet ist. Betroffen ist jede Kampagne im Index, deren localStorage-/IDB-Eintrag aus irgendeinem Grund fehlt — nicht nur die Standard-Kampagne."
    artifacts:
      - path: "systems/file-backup/file-backup-manager.js"
        issue: "readCampaignDataForBackup():409 — Stufe 3 (`istBefuellt(window.D)`) prüft campaignKey nicht gegen den aktiven Key, bevor sie window.D zurückgibt"
    missing:
      - "Stufe 3 nur greifen lassen, wenn campaignKey === (window.STORAGE_KEY_OVERRIDE || APP_CONFIG.STORAGE_KEY)"
      - "Regressionstest in file-backup.test.js: ctx.D mit einer befüllten, ANDEREN Kampagne belegen und prüfen, dass eine nicht gespeicherte Nachbarkampagne weiterhin übersprungen wird (kein *.json mit Fremddaten)"
deferred: []
acknowledged_gaps:
  - gate: "ai-integration / api-coverage.verify-pre"
    result: "block: true — behauptete externe API-Integration ohne COVERAGE.md-Matrix"
    disposition: "Vom Nutzer als Fehlalarm eingestuft und übersteuert; Phase fortgesetzt (Vorverifikation 2026-08-26)"
    verifier_recheck: "Unverändert gültig — siehe § Acknowledged Gaps (übernommen aus der Vorverifikation, nicht erneut erhoben, da diese Runde keine neuen fetch/XHR-Stellen einführt: Plan 12-08 fasst ausschließlich migration-wizard.js und dessen Testdatei an, beide ohne Netzwerkaufruf)."
warnings:
  - "dist/dnd-tracker-optimized.html war zum Zeitpunkt der Vorverifikation veraltet (W-1, 2026-08-26). Plan 12-08, Task 3 hat beide Bundles nachweislich neu gebaut (SUMMARY: optimized-Bundle 2026-09-04 13:41:40, neuer als migration-wizard.js). Dieser Punkt ist damit für den aktuellen Quellstand behoben — vorausgesetzt, seit dem 12-08-Build wurde nichts mehr geändert. Die CR-01/CR-02-Fixes aus dieser Runde sind NICHT gebaut, weil sie noch nicht im Code stehen."
  - "Bekannter Restfehler bei LEERER Audio-Bibliothek (W-2, 2026-08-26): downloadAudioExport() zeigt weiterhin den Wartehinweis und kehrt danach still zurück. Aus der UI nicht erreichbar — weiterhin unverändert im Quelltext, nicht Gegenstand dieser Runde."
  - "WR-01 (12-REVIEW.md, nicht blockierend): Wird eine Audio-Export-Datei versehentlich in die Haupt-Dropzone gezogen, erscheint die Text-Rückmeldung im separaten Audio-Bereich statt an der Haupt-Dropzone selbst. Kein Datenverlust, nur verwirrende UI-Rückmeldung."
  - "WR-02 (12-REVIEW.md, nicht blockierend): pushUndo() leert den Redo-Stack bei einem JSON.stringify-Fehler nicht — ein nachfolgendes Redo kann theoretisch auf einem durch eine Zwischenaktion bereits veränderten Stand landen. Sehr enges Fenster (zirkuläre Referenz in D genau während einer Undo-Aktion), aber nicht abgedeckt."
human_verification:
  - test: "Echte Audio-Bibliothek knapp UNTER 300 MiB zusammenstellen (mind. 4 große Dateien, Einzeldatei-Obergrenze 100 MB), dist/dnd-tracker-bundled.html per Doppelklick öffnen, Banner-Button „Zum App-Umzug\" klicken, dann im Divergenz-Banner „Audio-Datei herunterladen (…)\" klicken"
    expected: "Wartehinweis erscheint, die Datei wird angeboten, der Tab bleibt bedienbar und stürzt nicht ab. Wird der Tab schon deutlich unter 300 MiB unruhig, ist die Warnschwelle zu hoch angesetzt und gehört gesenkt."
    why_human: "Geprüft wird Speicherdruck im Renderer-Prozess eines echten Browsers (Recherche-Annahme A1). Unter Node/jsdom nicht messbar; kein Konsolen-Trick ersetzt echte Dateien. Der Nutzer hat sich am 2026-08-19 bewusst entschieden, die Dateien nicht zusammenzutragen — unverändert offen, aus der Vorverifikation übernommen."
    status: "offen — bewusst nicht abgenommen (12-VALIDATION.md § Manual-Only Verifications, 12-07-SUMMARY.md § Offene manuelle Prüfung). Nicht Gegenstand dieser Runde, da der Status durch CR-01/CR-02 ohnehin auf gaps_found steht."
---

# Phase 12: Datensicherheit — Verification Report (Re-Verifikation)

**Phase Goal:** Kein Pfad in Backup, Export oder Migration verliert oder überschreibt mehr stillschweigend Daten, und die Randfälle, die solche Verluste bisher verdeckt haben, sind getestet.
**Verified:** 2026-09-04
**Status:** gaps_found
**Re-verification:** Ja — nach Gap-Schließung G-12-3 (Plan 12-08) und einem zwischenzeitlichen Code-Review (12-REVIEW.md)

---

## Vorbemerkung zur Methode

Diese Runde ist eine **Re-Verifikation** der bestandenen Erstverifikation vom 2026-08-26
(`status: human_needed, 6/6`). Zwei Dinge haben sich seither ereignet:

1. **G-12-3 wurde geschlossen.** Das UAT hatte unter Test 3 entdeckt, dass `isFreshInstall()`
   nur `characters`/`npcs`/`quests` als Kampagneninhalt zählte. Plan 12-08 hat das behoben
   (`hasCampaignContent()` über 22 belegte Stellen, strukturell gegen das echte `initializeData()`
   abgesichert) — dieser Teil wird unten mit **Regressionstiefe**, nicht erneut mit voller
   Drei-Ebenen-Prüfung, verifiziert, wie es die Re-Verifikations-Optimierung vorsieht.
2. **Ein Code-Review hat zwei neue BLOCKER gefunden** (`12-REVIEW.md`, `status: issues_found`),
   beide direkt gegen den Wortlaut des Phasenziels: ein Bedienpfad im Migrations-Wizard, der
   frisch importierte Daten stillschweigend überschreibt (CR-01), und ein Fallback im
   Datei-Backup, der die Daten der falschen Kampagne in die Backup-Datei einer anderen schreibt
   (CR-02). **Beide wurden vom Verifier unabhängig gegen den aktuellen Quelltext nachgeprüft**
   (nicht nur aus dem Review übernommen) — Fundstellen, Zeilennummern und die fehlende
   Testabdeckung sind bestätigt (siehe Zitate unten und die Grep-Läufe, die dieser Prüfung
   vorausgingen).

**Testevidenz dieser Runde** (bereits vom Orchestrator ausgeführt, hier nicht erneut gelaufen):

| Suite | Ergebnis |
| ----- | -------- |
| `npx jest` | 749 passed, 29 Suiten |
| `python -m pytest tests/build -q` | 24 passed |
| `npx playwright test` | 321 passed / 2 skipped, exit 0 |
| `python build.py` / `python build.py --production` | beide `dist/`-Bundles aus dem geänderten Quellstand neu gebaut |

Diese Zahlen bestätigen, dass Plan 12-08 keine Regression eingeführt hat. Sie sagen **nichts**
über CR-01/CR-02 aus, weil kein bestehender Test diese Pfade abdeckt — das ist Teil des Befunds.

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Umzugs-Export `file://` → PWA enthält Soundboard-Audio und Würfelstatistik; nach dem Import spielen Szenen ihre Tracks, keine toten `blobId`s | ✓ VERIFIED (Regressionstiefe — unverändert seit Erstverifikation, siehe dortige Belege) | Kein von 12-08 geänderter Codepfad; `audio-export.js`/`soundboard.spec.js` unangetastet. Inhaltlich weiterhin gültig laut Erstverifikation. |
| 2 | Datei-Backup umfasst alle Kampagnen; zwei Kampagnen mit demselben `safeName` überschreiben sich nicht (Kollisions-Suffix-Logik) | ✓ VERIFIED (Regressionstiefe, Kollisions-Fall unverändert) | `resolveBackupTargets()`/`_sanitizeKeySuffix()` unverändert seit Erstverifikation. **Aber:** ein benachbarter, nicht in SC2s wörtlichem Kollisions-Szenario erfasster Fehlerpfad in derselben Funktionsfamilie ist neu bestätigt — siehe Truth 8 unten. |
| 3 | `Strg+Z` nach dem Löschen einer Audiodatei stellt Blob UND Szenen-Referenz wieder her | ✓ VERIFIED (Regressionstiefe) | `soundboard-crud.js`/`soundboard-idb.js` nicht von 12-08 berührt; E2E-Rundlauf aus Erstverifikation unverändert gültig. |
| 4 | Umzugs-Wizard bietet sich einem Nutzer mit vorhandenen Daten nicht an — auch nicht bei `STORAGE_KEY_OVERRIDE` oder im IndexedDB-Modus | ✓ VERIFIED (voll neu geprüft, G-12-3 geschlossen) | Quelltext bestätigt: `migration-wizard.js:64-145` definiert `CAMPAIGN_CONTENT_ARRAYS` (17), `CAMPAIGN_CONTENT_TEXT_FIELDS` (2), `CAMPAIGN_CONTENT_PATHS` (3) und `hasCampaignContent()`; `isFreshInstall()` delegiert bei `:145` mit `return !hasCampaignContent(data);`. Vier neue `window.*`-Exports ab `:944`. `tests/unit/migration-wizard.test.js` von 11 auf 41 Tests gewachsen (Grep bestätigt `hasCampaignContent`/`CAMPAIGN_CONTENT_ARRAYS` an den erwarteten Stellen). Strukturprüfung hängt laut SUMMARY am echten `initializeData()` aus `core/data.js` via eigenem `vm.createContext()`. Mutationsnachweis dokumentiert (6/14 Tests fallen bei hartkodiertem `return false` um). Keine `TBD`/`FIXME`/`XXX`-Marke in den geänderten Dateien. |
| 5 | Parse-Fehler in `undo()`/`redo()` lässt die Stacks unverändert; kritische Saves laufen unabhängig vom `autosave-toggle` | ✓ VERIFIED (Regressionstiefe) | `systems/undo.js` von 12-08 nicht berührt; Erstverifikations-Befund unverändert gültig. Ein neuer, nicht-blockierender Rand (WR-02, Redo-Stack bei Serialisierungsfehler) ist unten als Warnung dokumentiert, ändert aber nichts am Kern der Truth. |
| 6 | Tests decken den >5-MB-IDB-only-Save mit Reload, den localStorage-Quota-Fallback und den Export/Import-Versions-Rundlauf ab | ✓ VERIFIED (Regressionstiefe) | `stability.test.js`/`full-export.test.js` von 12-08 nicht berührt; 749 statt 719 bestandene Tests (30 neue aus 12-08), keine Regression. |
| 7 *(aus dem Phasenziel abgeleitet, nicht wörtlich in SC1-6, aber unmittelbar Wortlaut des Goal-Satzes: „...oder Migration ... überschreibt mehr stillschweigend Daten")* | Nach einem abgeschlossenen Migrations-Import überschreibt kein Wizard-Bedienpfad die frisch importierten Daten stillschweigend | ✗ FAILED | CR-01, unabhängig bestätigt: `migration-wizard.js:283-288` rendert `data-action="wizard-skip"` außerhalb aller `.migration-step`-Container; `showWizardStep()` (`:152-177`) blendet den Footer nie aus. Handler (`:~627-632`, zitiert unten) ruft nur `_closeWizard()`, kein `reload()` — im Gegensatz zu `wizard-close`/`wizard-setup-backup`, die laut eigenem Quelltextkommentar exakt deshalb reloaden ("KEIN renderAll()/save() auf dem stale In-Memory-D"). `avatars.js:170-176`s unbedingter `beforeunload`-Handler schreibt danach `window.D` zurück in den Storage-Key des Imports. |
| 8 *(aus dem Phasenziel abgeleitet, unmittelbarer Wortlaut: „...oder Backup ... überschreibt mehr stillschweigend Daten", direkt im Umfeld von SC2/SAFE-02)* | Ein Datei-Backup schreibt niemals die Daten einer anderen (aktiven) Kampagne in die Backup-Datei einer Kampagne, deren eigene Daten fehlen | ✗ FAILED | CR-02, unabhängig bestätigt: `file-backup-manager.js:407-408` — Zeile `if (typeof window !== 'undefined' && istBefuellt(window.D)) return window.D;` prüft `campaignKey` an keiner Stelle. `resolveBackupTargets()` trägt bei `:~163` unbedingt `{ key: storageKey, name: 'Standard-Kampagne' }` ein. Kein Test in `file-backup.test.js` setzt `ctx.D`, daher greift Stufe 3 in keinem bestehenden Test — der Fehlerpfad ist ungetestet. |

**Score:** 6/8 truths verified (0 present-but-behavior-unverified; 2 FAILED — CR-01, CR-02)

---

### Zitierte Quelltext-Belege (vom Verifier selbst gelesen, nicht aus dem Review übernommen)

**CR-01 — `systems/migration/migration-wizard.js`, Handler:**
```js
} else if (action === 'wizard-skip') {
    // shown-Flag setzen, Wizard schliessen
    StorageAPI.setJSON('migration-wizard-shown', { shown: true, skipped: true });
    _closeWizard();
} else if (action === 'wizard-close') {
    StorageAPI.setJSON('migration-wizard-shown', { shown: true, completed: true });
    // App neu laden, damit die importierten Daten geladen werden.
    // KEIN renderAll()/save() auf dem stale In-Memory-D — save() würde
    // die frisch importierte Aktiv-Kampagne mit dem leeren D überschreiben (CR-04).
    window.location.reload();
```
`_closeWizard()` selbst: `modal.style.display = 'none';` — kein Reload, kein Save-Schutz.

**CR-02 — `systems/file-backup/file-backup-manager.js`, `readCampaignDataForBackup()`:**
```js
// 3. Letzter Ausweg: der laufende Zustand im Speicher
if (typeof window !== 'undefined' && istBefuellt(window.D)) return window.D;
```
Kein Vergleich von `campaignKey` gegen den aktiven Key an dieser Stelle — bestätigt per direkter
Lektüre der Funktion (Zeilen 382-411).

Beide Commits, die diese Zeilen zuletzt geändert haben, liegen vor `354cd98` (dem Review-Commit);
`git log` zeigt keinen nachfolgenden Fix-Commit — die Lücken stehen unverändert im Arbeitsbaum.

---

## Required Artifacts (Delta zur Erstverifikation)

Nur die von Plan 12-08 geänderten bzw. für die neuen Gaps relevanten Artefakte werden hier erneut
geprüft. Für alle anderen gilt die Erstverifikations-Tabelle unverändert (keine dieser Dateien
wurde seither angefasst, außer den beiden unten aufgeführten mit BLOCKER-Befund).

| Artifact | Expected | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `systems/migration/migration-wizard.js` — `hasCampaignContent()` + 3 Inhaltslisten | Inhaltsdefinition über 22 Stellen, in `isFreshInstall()` verdrahtet | ✓ 945+ Z. | ✓ 3 Konstanten + 1 Funktion, kein Wurf bei Fremdtyp | ✓ `isFreshInstall():145`, 4 `window.*`-Exports | ✓ VERIFIED |
| `tests/unit/migration-wizard.test.js` | Zauber-Fall, Gegenprobe, Sammlungsnachweis, Strukturprüfung | ✓ 41 Tests (vorher 11) | ✓ Grep bestätigt `hasCampaignContent`/`CAMPAIGN_CONTENT_ARRAYS` in Testdatei | ✓ läuft in Suite (749 gesamt) | ✓ VERIFIED |
| `systems/migration/migration-wizard.js` — `wizard-skip`-Handler | Darf importierte Daten nach Schritt 4 nicht stale überschreiben | ✓ existiert | ✗ **fehlender Reload-Zweig** | — | ✗ **STUB-artige Lücke — CR-01** |
| `systems/file-backup/file-backup-manager.js` — `readCampaignDataForBackup()` Stufe 3 | Darf nur die tatsächlich angefragte Kampagne liefern | ✓ existiert | ✗ **campaignKey-Prüfung fehlt in Stufe 3** | ✓ wird aufgerufen, liefert aber falsche Daten | ✗ **HOLLOW — CR-02** |

---

## Requirements Coverage

| Requirement | Source Plan | Beschreibung | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| SAFE-01 | 12-01, 12-02 | Umzugs-Export enthält Audio + Würfelstatistik | ✗ **BLOCKED** | Export-Inhalt selbst korrekt (Truth 1 unverändert VERIFIED), aber CR-01 zeigt einen Migrations-Bedienpfad, der das Import-Ergebnis wieder zerstört — das Requirement lautet nicht nur "Export enthält Daten", sondern ist Teil des Phasenziels "Migration überschreibt nichts stillschweigend". Truth 7. |
| SAFE-02 | 12-01, 12-03 | Datei-Backup deckt alle Kampagnen kollisionsfrei ab | ✗ **BLOCKED** | Kollisions-Suffix-Logik selbst korrekt (Truth 2 unverändert VERIFIED für den wörtlichen SC2-Fall), aber CR-02 zeigt einen Fallback, der Kampagnendaten OHNE echte Namenskollision falsch zuordnet — dieselbe Fehlerklasse ("überschreiben sich nicht gegenseitig"), anderer Auslöser. Truth 8. |
| SAFE-03 | 12-06 | Audio-Löschen rückgängig (Blob + Referenz) | ✓ SATISFIED | Unverändert seit Erstverifikation |
| SAFE-04 | 12-04, **12-08** | Wizard bietet sich Nutzern mit Daten nicht an | ✓ SATISFIED | G-12-3 geschlossen; 22 statt 3 Sammlungen, strukturell gegen `initializeData()` abgesichert |
| SAFE-05 | 12-05 | Persistenz bei Fehlern/Sonderfällen vorhersagbar | ✓ SATISFIED | Unverändert seit Erstverifikation (WR-02 ist eine Randlücke, kein Blocker) |
| SAFE-06 | 12-01, 12-07 | Persistenz-Randfälle getestet | ✓ SATISFIED | Unverändert seit Erstverifikation |

**Orphaned requirements:** keine. `.planning/REQUIREMENTS.md:129-134` mappt genau SAFE-01…SAFE-06 auf
Phase 12; alle sechs sind hier bewertet (vier bestanden, zwei blockiert). Das Dokument selbst
trägt bei SAFE-01/SAFE-02 noch ein „✓" aus der Zeit vor diesem Code-Review — dieser Bericht
widerspricht dem ausdrücklich und begründet warum.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | `TBD`/`FIXME`/`XXX` in den von 12-08 geänderten Dateien | — | **0 Treffer** — keine unaufgelöste Schuldenmarke |
| `systems/migration/migration-wizard.js` | 283-288, ~627-632 | Fehlender Reload-Zweig im `wizard-skip`-Handler nach Import | 🛑 Blocker | CR-01 — siehe Gaps |
| `systems/file-backup/file-backup-manager.js` | 407-411 | Fallback ignoriert Funktionsparameter (`campaignKey`) | 🛑 Blocker | CR-02 — siehe Gaps |
| `systems/migration/migration-wizard.js` | 421-428, 538-547 | Falsches DOM-Element bekommt visuelles Feedback bei Audio-Datei in Haupt-Dropzone | ⚠️ Warning | WR-01 — kein Datenverlust, nur UI-Verwirrung |
| `systems/undo.js` | 9-24 | Redo-Stack wird bei Serialisierungsfehler nicht geleert | ⚠️ Warning | WR-02 — sehr enges Fenster, kein akuter Datenverlust |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Volle Jest-Suite (Orchestrator-Lauf, nicht erneut ausgeführt) | `npx jest` | 749 passed / 29 Suiten / 0 skipped | ✓ PASS (bestätigt) |
| Build-Tests (Orchestrator-Lauf) | `python -m pytest tests/build -q` | 24 passed | ✓ PASS (bestätigt) |
| Volle E2E-Suite (Orchestrator-Lauf) | `npx playwright test` | 321 passed / 2 skipped, exit 0 | ✓ PASS (bestätigt) |
| Beide dist-Bundles neu gebaut (Orchestrator-Lauf) | `python build.py` / `--production` | beide aus geändertem Quellstand | ✓ PASS (bestätigt) |
| G-12-3-Verdrahtung im Quelltext | `grep -n "hasCampaignContent\|CAMPAIGN_CONTENT_ARRAYS" migration-wizard.js` | 8 Treffer an den erwarteten Stellen (Definition, Nutzung, Export) | ✓ PASS (selbst ausgeführt) |
| CR-01 im Quelltext | `sed -n '620,660p' migration-wizard.js` | `wizard-skip` ruft nur `_closeWizard()`, kein `reload()` | ✓ Befund bestätigt (selbst gelesen) |
| CR-02 im Quelltext | `sed -n '375,415p' file-backup-manager.js` | Stufe 3 prüft `campaignKey` nicht | ✓ Befund bestätigt (selbst gelesen) |
| Kein Fix-Commit nach dem Review | `git log --oneline -15` | letzter Commit ist `354cd98` (das Review selbst), kein nachfolgender `fix(12-...)` | ✓ Bestätigt: Lücken stehen unverändert im Arbeitsbaum |
| Debt-Marker in geänderten Dateien | `grep -nE "TBD\|FIXME\|XXX"` über migration-wizard.js, file-backup-manager.js, undo.js, migration-wizard.test.js | 0 Treffer | ✓ PASS |

Kein Full-Suite-Rerun durch den Verifier — die vier Basislinien wurden bereits vom Orchestrator
unabhängig gemessen und hier als Faktum übernommen (Aufgabenstellung). Die neuen Gaps CR-01/CR-02
sind Quelltext-Befunde, keine Verhaltens-Tests, weil genau das der Kern des Befunds ist: es gibt
für sie **keinen** Test, der sie ausführen könnte.

---

## Gaps Summary

**Zwei BLOCKER, beide unabhängig vom Verifier gegen den aktuellen Quelltext bestätigt, keiner
durch Plan 12-08 verursacht oder behoben:**

1. **CR-01 (SAFE-01/Migration):** Der „Überspringen"-Button im Migrations-Wizard bleibt nach
   erfolgreichem Import sichtbar und überschreibt beim nächsten Tab-Wechsel/-Schließen die frisch
   importierten Daten stillschweigend mit dem stale In-Memory-Zustand — über den unbedingten
   `beforeunload`-Autosave in `systems/avatars.js`. Kein Test deckt diesen Pfad ab.
2. **CR-02 (SAFE-02/Backup):** `readCampaignDataForBackup()`s dritter Fallback ignoriert den
   angefragten `campaignKey` und liefert immer die aktive Kampagne — bei jeder im Index
   eingetragenen, aber (noch) nicht gespeicherten Kampagne (z. B. der „Standard-Kampagne", wenn
   der Nutzer sofort eine eigene anlegt) landen deren Daten fälschlich in der Backup-Datei der
   falschen Kampagne. Kein bestehender Test setzt `ctx.D` in den Multi-Kampagnen-Backup-Tests,
   daher unentdeckt.

Beide Befunde verstoßen **wörtlich** gegen den Phasenziel-Satz: „Kein Pfad in Backup, Export oder
Migration verliert oder überschreibt mehr stillschweigend Daten." Genau ein solcher Pfad existiert
in Migration (CR-01) und genau einer in Backup (CR-02). Das schließt sechs von sechs erfüllten
ROADMAP-Erfolgskriterien (im wörtlichen, engen Sinn) nicht aus — SC1 und SC2 sind in ihrer
konkreten Formulierung weiterhin erfüllt —, aber das übergeordnete Phasenziel ist es nicht.

**G-12-3 ist sauber geschlossen.** Plan 12-08 hat die Inhaltsdefinition der Frischinstallations-
Erkennung von 3 auf 22 belegte Stellen erweitert, strukturell gegen das echte `initializeData()`
abgesichert (nicht gegen eine abgetippte Kopie) und mit einem protokollierten Mutationsnachweis
belegt. 30 neue Tests, keine Regression in den übrigen 719 (jetzt 749 gesamt). Dieser Teil der
Phase ist beweisbar fertig.

**Status ist `gaps_found`, nicht `human_needed`**, weil Regel 1 der Entscheidungsreihenfolge
(FAILED truths) Vorrang vor Regel 2 (offene menschliche Prüfpunkte) hat. Der offene menschliche
Prüfpunkt aus der Erstverifikation (Tab-Gesundheit unterhalb 300 MiB, Recherche-Annahme A1) bleibt
unverändert offen und ist im Frontmatter unter `human_verification` festgehalten — er wird durch
diesen Bericht nicht als erledigt reklamiert und bleibt nach Behebung von CR-01/CR-02 erneut
fällig.

**Für einen nächsten Durchlauf:** beide Fixes sind lokal, klein und mit vorgeschlagenem Patch im
`12-REVIEW.md` dokumentiert (Zeilen 121-135 bzw. 191-225 dort). Ein Gap-Closure-Plan analog zu
12-08 (TDD: roter Test zuerst, dann Fix, dann Mutationsnachweis) ist der nächste Schritt, bevor die
Phase erneut auf Verifikation gestellt wird.

---

_Verified: 2026-09-04_
_Verifier: Claude (gsd-verifier)_
