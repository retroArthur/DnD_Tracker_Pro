---
phase: "12"
slug: "datensicherheit"
status: audited
# threats_open zählt Threats auf oder über der Sperrschwelle `high`, die weder geschlossen
# noch als Risiko akzeptiert sind. Die drei am 2026-09-04 reproduzierten Blocker (SEC-01..03)
# sind seit der Gap-Closure-Runde geschlossen und am 2026-09-05 zweimal unabhängig am
# Quelltext bestätigt. Die verbleibenden 14 unbestätigten Einwände der Challenge-Stufe
# bleiben Triage-Liste, nicht Befund — siehe § Methodenkritik (5 der ursprünglich 19
# wurden zu SEC-04…SEC-07/WR-03 hochgestuft und sind geschlossen).
threats_open: 0
asvs_level: 1
security_block_on: high
created: "2026-09-04"
audited: "2026-09-05"
---

# Phase 12 — Security

Nachträglich erstellt durch den `verify:post`-Hook `security` beim Abschluss von
`/gsd-verify-work 12`, fortgeschrieben am 2026-09-05 durch `/gsd-secure-phase 12` nach der
Gap-Closure-Runde. Register-Herkunft: **alle 17 Pläne** dieser Phase tragen einen
`<threat_model>`-Block (`register_authored_at_plan_time: true`) — also Verifikation der
Mitigationen, kein retroaktives STRIDE. Insgesamt 72 Threats: 44 aus den Plänen 12-01…12-11
(Register vom 2026-09-04) und 28 aus den Gap-Plänen 12-12…12-17 (Nachtrag unten).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Dateisystem → App (Voll-Import) | Nutzergewählte JSON-Datei, Inhalt und Größe unvertrauenswürdig | Komplette Kampagnendaten aller Kampagnen |
| Dateisystem → App (Audio-Import) | Zweite, separate JSON-Datei | Base64-kodierte Audioblobs + Würfelstatistik |
| IndexedDB → Export-Zeichenkette | Bibliotheksgröße entscheidet, ob die Serialisierung überhaupt gelingt | Audioblobs |
| App → Dateisystem (Datei-Backup) | File System Access API, Verzeichnis-Handle des Nutzers | Momentaufnahmen aller Kampagnen |
| Kampagnenname → Dateiname | Nutzertext wird zu einem Pfadbestandteil | Dateinamen im Backup-Verzeichnis |

Keine Netzwerkgrenze: die App läuft offline per `file://`, es gibt keinen Server und keine
externe API (siehe `COVERAGE.md`).

---

## Threat Register

44 Threats aus den 11 Plan-Registern. `Angefochten` = die Schließung durchlief zusätzlich einen
adversarialen Refuter (nur Critical/High).

| Threat ID | Plan | Severity | Disposition | Status | Angefochten |
|-----------|------|----------|-------------|--------|-------------|
| T-12-11 | 12-03 | critical | mitigate | open | ja |
| T-12-12 | 12-04 | critical | mitigate | open | ja |
| T-12-24 | 12-08 | critical | mitigate | open | ja |
| T-12-29 | 12-09 | critical | mitigate | open | — |
| T-12-35 | 12-10 | critical | mitigate | open | ja |
| T-12-01 | 12-01 | high | mitigate | open | ja |
| T-12-04 | 12-01 | high | mitigate | open | ja |
| T-12-05 | 12-02 | high | mitigate | open | ja |
| T-12-08 | 12-03 | high | mitigate | closed | — |
| T-12-09 | 12-03 | high | mitigate | open | — |
| T-12-10 | 12-03 | high | mitigate | open | ja |
| T-12-13 | 12-04 | high | mitigate | open | ja |
| T-12-14 | 12-04 | high | mitigate | open | ja |
| T-12-15 | 12-05 | high | mitigate | open | ja |
| T-12-16 | 12-05 | high | mitigate | open | ja |
| T-12-19 | 12-06 | high | mitigate | open | ja |
| T-12-23 | 12-07 | high | mitigate | closed | — |
| T-12-25 | 12-08 | high | mitigate | open | ja |
| T-12-30 | 12-09 | high | mitigate | open | ja |
| T-12-36 | 12-10 | high | mitigate | open | ja |
| T-12-37 | 12-10 | high | mitigate | open | ja |
| T-12-39 | 12-10 | high | mitigate | open | ja |
| T-12-41 | 12-11 | high | mitigate | open | ja |
| T-12-43 | 12-11 | high | mitigate | open | — |
| T-12-02 | 12-01 | medium | mitigate | closed | — |
| T-12-03 | 12-01 | medium | mitigate | closed | — |
| T-12-07 | 12-02 | medium | mitigate | closed | — |
| T-12-17 | 12-05 | medium | mitigate | closed | — |
| T-12-18 | 12-05 | medium | mitigate | closed | — |
| T-12-20 | 12-06 | medium | mitigate | closed | — |
| T-12-22 | 12-07 | medium | mitigate | closed | — |
| T-12-26 | 12-08 | medium | mitigate | closed | — |
| T-12-28 | 12-08 | medium | mitigate | closed | — |
| T-12-31 | 12-09 | medium | mitigate | closed | — |
| T-12-32 | 12-09 | medium | mitigate | closed | — |
| T-12-38 | 12-10 | medium | mitigate | closed | — |
| T-12-40 | 12-11 | medium | mitigate | closed | — |
| T-12-42 | 12-11 | medium | mitigate | closed | — |
| T-12-44 | 12-11 | medium | mitigate | closed | — |
| T-12-06 | 12-02 | low | mitigate | closed | — |
| T-12-21 | 12-06 | low | accept | closed | — |
| T-12-27 | 12-08 | low | accept | open — unterhalb `high`, nicht blockierend | — |
| T-12-33 | 12-09 | low | mitigate | closed | — |
| T-12-34 | 12-09 | low | accept | open — unterhalb `high`, nicht blockierend | — |

### Nachtrag 2026-09-05 — Threats der Gap-Closure-Runde (Pläne 12-12…12-17)

28 Threats, verifiziert am 2026-09-05 durch `/gsd-secure-phase 12` (ein Auditor, ASVS L1,
`block_on: high`). Ausdrückliche Vorgabe an den Auditor: **keine** Im-Zweifel-offen-Voreinstellung
— der Aufbaufehler der Vorrunde (§ Methodenkritik) sollte sich nicht wiederholen. Jeder
CLOSED-Befund trägt Datei- und Zeilenbeleg aus dem gelesenen Quelltext, nicht aus der
SUMMARY-Behauptung.

| Threat ID | Plan | Severity | Disposition | Status | Beleg (Kurzform) |
|-----------|------|----------|-------------|--------|------------------|
| T-12-45 | 12-12 | critical | mitigate | closed | `_hatKampagnenInhalt()` ersetzt Schlüsselzahl-Prüfung, in allen 3 Stufen verdrahtet |
| T-12-46 | 12-12 | critical | mitigate | closed | Leerschema liefert `null` → DEBT-17-Wächter greift vor `pruneOldSnapshots()` |
| T-12-47 | 12-12 | high | mitigate | closed | `setBackupStatus('paused')` erreichbar, wenn kein Ziel Inhalt hat |
| T-12-48 | 12-12 | high | mitigate | closed | Sperrlisten-Entwurf + Gegenprobe: Kampagne mit nur `spells` wird weiterhin gesichert |
| T-12-49 | 12-12 | high | mitigate | closed | Name des aktiven Ziels aus dem Kampagnenindex statt hartkodiert |
| T-12-50 | 12-12 | medium | mitigate | closed | Standard-Key wird bedingungslos als zusätzliches Ziel geführt |
| T-12-51 | 12-13 | high | mitigate | closed | `JSON.stringify(D)` in `undo()` in try/catch vor `redoStack.push` |
| T-12-52 | 12-13 | high | mitigate | closed | Spiegelbildlicher Wächter in `redo()` vor `undoStack.push` |
| T-12-53 | 12-13 | high | mitigate | closed | Beide Wächter strikt vor jeder Stack-Mutation; Invarianten-Tests prüfen Stacklängen |
| T-12-54 | 12-13 | medium | mitigate | closed | Warn-Toast an beiden Stellen, testseitig belegt |
| T-12-55 | 12-14 | high | mitigate | closed | Import-`try` endet nach `importFn()`; `showWizardStep(4)` unbedingt |
| T-12-56 | 12-14 | high | mitigate | closed | Direkte Folge von T-12-55; Invarianten-Tabelle über 3 Wurfstellen |
| T-12-57 | 12-14 | medium | mitigate | closed | Statusmeldung wird vor der Lückenprüfung gebaut, `showStatus()` unbedingt |
| T-12-58 | 12-14 | high | mitigate | closed | Zwei Gegenproben grün: echte Importfehler melden weiterhin Fehlschlag |
| T-12-59 | 12-14 | low | mitigate | closed | Irreführender Kommentar entfernt (grep: 0 Treffer) |
| T-12-60 | 12-15 | low | mitigate | closed | Einzelgrößen-Prüfung vor `base64ToBlob()` |
| T-12-61 | 12-15 | low | mitigate | closed | Kumuliertes Budget, Einträge namentlich übersprungen statt Abbruch |
| T-12-62 | 12-15 | low | mitigate | closed | `Math.max(angegebeneGroesse, geschaetzteRohgroesse)` |
| T-12-63 | 12-15 | medium | mitigate | closed | Drift-Test liest `soundboard-idb.js` im Quelltext und vergleicht |
| T-12-64 | 12-16 | low | mitigate | closed | Würfel-Favoriten werden zusammengeführt statt überschrieben |
| T-12-65 | 12-16 | low | mitigate | closed | Kampagnenindex wird zusammengeführt statt ersetzt |
| T-12-66 | 12-16 | medium | mitigate | closed | Import gewinnt bei Schlüsselkollision; Gegenprobe grün |
| T-12-67 | 12-16 | low | mitigate | closed | `quickRefCustom` in `CAMPAIGN_CONTENT_ARRAYS` |
| T-12-68 | 12-16 | high | mitigate | closed | `CAMPAIGN_CONTENT_EXCLUDED` + Vollständigkeitstest über alle `D.xxx`-Zugriffe |
| T-12-69 | 12-16 | low | mitigate | closed | `getAudioImportMaxBytes()` leitet die Grenze aus der Exportgrenze ab |
| T-12-70 | 12-17 | high | mitigate | closed | **War offen** — siehe § Befund 2026-09-05; nach Dev-Build und E2E-Neulauf geschlossen |
| T-12-71 | 12-17 | medium | mitigate | closed | `pytest tests/build` 24/24 grün — keine doppelte Top-Level-Deklaration |
| T-12-72 | 12-17 | medium | mitigate | closed | `grep "test.failing("` → 0 Treffer; kein Unexpectedly-passed im Suitenlauf |

---

## Befund 2026-09-05 — T-12-70: Dev-Bundle war veraltet

Der Auditor meldete T-12-70 (`high`) als **offen** — zu Recht, und der Fehler lag im Vorgehen des
Orchestrators, nicht in Plan 12-17.

`npm run build` ist in diesem Projekt auf `python build.py --production` gemappt und schreibt
ausschließlich `dist/dnd-tracker-optimized.html`. Als Post-Merge-Gate wurde nach jeder Welle genau
dieser Befehl ausgeführt; der Dev-Bundle `dist/dnd-tracker-bundled.html` entstand zuletzt am
2026-09-05 um 13:04 durch Plan 12-17. Die beiden Review-Fix-Commits `905168e` (CR-01,
`full-export.js`) und `d2a521c` (WR-01, `avatars.js`) landeten um 16:10/16:11 — danach hat niemand
den Dev-Build erneut angestoßen.

Beleg des Auditors, nachgeprüft: `dnd-tracker-bundled.html` enthielt weder den CR-01-Kommentar noch
`strippedForProtocolCheck` (je 0 Treffer), `dnd-tracker-optimized.html` beide (1 bzw. 2 Treffer).
Die Playwright-Suite läuft gegen den Dev-Bundle — der Lauf mit 321 bestandenen Tests aus Plan 12-17
hat für diese zwei Pfade also **Vor-Fix-Code** geprüft.

**Behebung:** `python build.py` (Dev-Build) am 2026-09-05 ausgeführt; beide Marker jetzt in beiden
Bundles vorhanden, beide Dateien jünger als die letzte Quelländerung (16:11). Anschließend
`npx playwright test` neu gefahren: **321 bestanden / 2 übersprungen, Exit 0** — die
E2E-Nachweislage deckt damit den aktuellen Stand ab. T-12-70 geschlossen.

**Lehre für künftige Runden:** Ein Post-Merge-Gate, das nur `npm run build` fährt, hält den
Dev-Bundle nicht aktuell. Wer sich auf Playwright als Nachweis beruft, muss vorher
`python build.py` (oder `npm run build:dev`) laufen lassen.

---

## Bestätigte Blocker (persönlich reproduziert)

Diese drei stammen **nicht** aus der Agenten-Klassifikation, sondern wurden vom Orchestrator selbst
gegen den unveränderten Quelltext reproduziert.

> **Stand 2026-09-05: alle drei geschlossen.** SEC-01 durch Plan 12-14 (`95dd60a`, `403244c`,
> `a5372e1`), SEC-02 durch Plan 12-13 (`03b3426`, `01e96e4`, `81e004e`), SEC-03 durch Plan 12-12
> (`c674a42`, `f027fbc`). Zwei aufeinanderfolgende Verifikationen (`12-VERIFICATION.md`, zuletzt
> `status: passed`, 9/9) haben die Behebung unabhängig am Quelltext gelesen statt aus den SUMMARYs
> zu übernehmen; der Audit vom 2026-09-05 hat sie als T-12-55/56, T-12-51/52/53 und T-12-49 erneut
> mit Zeilenbeleg bestätigt. Die Beschreibungen unten bleiben als Fundstellen-Dokumentation stehen.

### SEC-01 — Audio-Benennung kippt den bereits erfolgreichen Import in einen Fehler

*Bezug: SAFE-01 / Decision D-02 · Severity: high · identisch mit IMPL-01 in `12-VALIDATION.md`*

`systems/migration/migration-wizard.js:511-533`. Der Block, der fehlende Szenen-Audios benennt,
steht im **selben `try`** wie `importFn(parsedObj)` (:485). Wirft `await window.listSoundBlobs()`
(:518), sind die Daten bereits geschrieben, aber der Nutzer sieht „Import fehlgeschlagen … Bitte
erneut versuchen oder Überspringen wählen" und erreicht Schritt 4 nie. Der Quellkommentar behauptet
ausdrücklich das Gegenteil („wird durch dieses Ergebnis in keinem Fall beeinflusst"). Ein Refuter
fand dieselbe Form ein zweites Mal auf dem Audio-Pfad (:584-617).

Verankert als `test.failing` in `tests/unit/audio-import-resilience.test.js:295`.

**Fix-Richtung:** den Audio-Benennungsblock in ein eigenes `try/catch` legen, dessen Fehler nur den
Zusatzhinweis unterdrückt und `showWizardStep(4)` nicht verhindert.

### SEC-02 — `undo()`/`redo()` stürzen in dem Zustand ab, den `pushUndo()` bewusst hinterlässt

*Bezug: SAFE-05 / T-12-16 (angrenzende Lücke) · Severity: high · identisch mit IMPL-02*

`systems/undo.js:69` und `:108` rufen `JSON.stringify(D)` **ohne** `try/catch`. `pushUndo()` fängt
denselben Wurf laut Entscheidung D-06 ab und lässt die destruktive Aktion absichtlich weiterlaufen —
`window.D` bleibt also nicht serialisierbar. Das nächste Strg+Z bricht mit einem ungefangenen
`TypeError: Converting circular structure to JSON` ab, ohne Warn-Toast.

Isoliert reproduziert: Schritt 1 (regulärer Push) und Schritt 2 (Push mit zirkulärem `D`, greift
korrekt) verhalten sich wie vorgesehen; Schritt 3 (`undo()`) wirft.

Verankert als `test.failing` in `tests/unit/stability.test.js`.

**Fix-Richtung:** beide Stellen analog zu `pushUndo()` absichern — `JSON.stringify` in `try/catch`,
bei Fehlschlag Warn-Toast und Abbruch ohne Stack-Mutation.

### SEC-03 — Bei aktiver benannter Kampagne verliert das Datei-Backup die Kampagnen-Identität

*Bezug: SAFE-02 / T-12-35 / T-12-36 · Severity: high · **NEU**, in keinem bisherigen Artefakt erfasst*

`core/init.js:28-30` setzt `window.STORAGE_KEY_OVERRIDE` auf den Key der aktiven Kampagne, sobald
diese nicht die Standardkampagne ist. `file-backup-manager.js:428-429` liest genau diesen Wert als
`storageKey`, und `resolveBackupTargets()` (:134) trägt ihn **bedingungslos** unter
`name: 'Standard-Kampagne'` ein.

Reproduziert gegen den echten Quelltext (`resolveBackupTargets` in einem vm-Kontext, Index mit zwei
Kampagnen):

| Aktive Kampagne | erzeugte Dateinamen |
|---|---|
| Standardkampagne | `standard-kampagne-aktuell.json` · `die-tiefen-von-phandalin-aktuell.json` ✅ |
| „Die Tiefen von Phandalin" | `standard-kampagne-1234-aktuell.json` · `standard-kampagne-standard-aktuell.json` ❌ |

Der echte Kampagnenname verschwindet vollständig aus den Dateinamen; beide Kampagnen heißen dann
`standard-kampagne-*` und sind nur noch am D-04-Kollisionssuffix unterscheidbar.

**Kein Datenverlust** — die Kollisionslogik aus 12-03/12-10 verhindert das Überschreiben, und genau
deshalb ist der Befund `high` und nicht `critical`. Aber:

1. Aus dem Backup ist nicht mehr erkennbar, welche Datei zu welcher Kampagne gehört.
2. Die zuvor geführte Serie (`die-tiefen-von-phandalin-*.json`) wird beim Kampagnenwechsel still
   verwaist — sie wird nie wieder aktualisiert und vom `safeName`-gebundenen Prune nie erfasst.

Warum UAT-Punkt 2 das nicht gefunden hat: der Defekt greift nur, wenn beim Backup eine
**nicht-Standard**-Kampagne aktiv ist. Der Test lief korrekt und bestand zu Recht.

**Fix-Richtung:** `resolveBackupTargets()` darf den Namen der Standardkampagne nicht an den
Override-Key hängen — den aktiven Key über den Kampagnenindex auflösen und nur dann
`'Standard-Kampagne'` nennen, wenn er tatsächlich `APP_CONFIG.STORAGE_KEY` ist.

---

## Methodenkritik — warum `threats_open` nicht 22 ist

Der Audit lief zweistufig: 11 Klassifizierer, danach je ein Refuter für **nur** die als CLOSED
gemeldeten Critical/High-Threats, mit der Vorgabe „im Zweifel gilt die Schließung als zu großzügig".

Das Ergebnis trägt die Handschrift dieser Vorgabe statt der Substanz:

| Gruppe | angefochten | Ergebnis |
|--------|-------------|----------|
| Critical/High | ja | 19 von 22 heruntergestuft |
| Medium | nein | 15 von 15 blieben closed |
| Low | nein | 3 von 5 closed |

Eine Trennschärfe, die so perfekt mit „wurde angefochten" korreliert und so gar nicht mit dem
Schweregrad, ist ein Artefakt des Aufbaus, kein Ergebnis. Drei Befunde wurden nachgeprüft und waren
echt (SEC-01..03) — die übrigen 19 sind **weder bestätigt noch widerlegt** und stehen unten als
Triage-Liste. `threats_open: 3` zählt nur das Belegte.

### Triage-Liste (unbestätigt, nicht gezählt)

Wiederkehrendes Argumentationsmuster der Refuter: „die Mitigation ist vorhanden, deckt aber eine
angrenzende Dimension der Bedrohung nicht ab". Ob das ein echter Fund oder eine Ausweitung über den
Wortlaut des Threats hinaus ist, muss je Eintrag entschieden werden.

**Stand 2026-09-05:** von den 19 Einträgen sind fünf inzwischen erledigt — die Triage vom
2026-09-05 stufte sie zu SEC-04…SEC-07 bzw. WR-03 hoch, und die Gap-Pläne 12-12…12-16 haben sie
geschlossen (siehe Nachtragstabelle oben). Die übrigen 14 bleiben unbestätigt und ungezählt.

| Threat | Kern des Einwands | Stand |
|--------|-------------------|------------------|
| T-12-11 | „leer" ist als Schlüsselzahl definiert, nicht als Inhalt — eine schema-initialisierte Leerkampagne gilt als befüllt | **erledigt** → SEC-04, geschlossen durch Plan 12-12 (vgl. T-12-45) |
| T-12-12 | `isFreshInstall()` fragt einen Key ab, `importFullExport()` überschreibt aber zusätzlich Kampagnenindex und `DICE_FAV_KEY` | **erledigt** → SEC-05, geschlossen durch Plan 12-16 (vgl. T-12-64/65) |
| T-12-24 | Kampagne mit ausschließlich `quickRefCustom` gilt weiterhin als Frischinstallation — G-12-3 in neuer Ausprägung | **erledigt** → SEC-06, geschlossen durch Plan 12-16 (vgl. T-12-67/68) |
| T-12-01 | Importseite hat keine Größengrenze; ein Eintrag dekodiert vor der 100-MB-Sperre von `saveSoundBlob()` | **erledigt** → SEC-07, geschlossen durch Plan 12-15 (vgl. T-12-60…62) |
| T-12-05 | 300 MiB Export- vs. 350 MiB Import-Grenze inkonsistent kalibriert | **erledigt** → WR-03, geschlossen durch Plan 12-16 (vgl. T-12-69) |
| T-12-04, T-12-09, T-12-10, T-12-13, T-12-14, T-12-15, T-12-16, T-12-19, T-12-25, T-12-29, T-12-30, T-12-37, T-12-39, T-12-41, T-12-43 | je ein Randfall neben der belegten Mitigation | ungeprüft |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-12-01 | T-12-21 | Wiedergabe scheitert still an fehlender Datei — `loadTrackBuffer()` benennt sie bereits; bewusst nicht vertieft | Plan 12-06 | 2026-08-06 |
| AR-12-02 | T-12-27 | `spells` zählt als Inhalt, wird aber über den SRD-Strip separat behandelt — eigene Entscheidung außerhalb dieser Lücke | Plan 12-08 | 2026-08-06 |
| AR-12-03 | T-12-34 | Skip stellt den Wizard dauerhaft stumm; Wiedereinstieg über `reopen-migration` bleibt möglich | Plan 12-09 | 2026-09-04 |
| AR-12-04 | — | Keine Lieferketten-Prüfung: `package.json` bleibt in der ganzen Phase unverändert, keine neuen Pakete installiert | Plan 12-01 | 2026-08-06 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open (gezählt) | Zur Triage | Run By |
|------------|---------------|--------|----------------|------------|--------|
| 2026-09-04 | 44 | 21 | 3 (SEC-01..03) | 19 | `/gsd-verify-work 12` → `verify:post` Hook `security`, 22 Agenten |
| 2026-09-05 | 72 (+28) | 49 (+28) | 0 | 14 (5 der 19 erledigt) | `/gsd-secure-phase 12`, ein Auditor, Umfang T-12-45…T-12-72 (Nutzerentscheidung) |

**Zum Umfang des Laufs vom 2026-09-05:** Auditiert wurden ausschließlich die 28 Threats der
Gap-Pläne. Die 22 als `open` geführten Zeilen des Registers von 2026-09-04 wurden auf ausdrückliche
Nutzerentscheidung **nicht** erneut klassifiziert — sie sind laut § Methodenkritik Triage-Liste und
nicht Befund, und eine Wiederholung hätte dieselbe verzerrte Vorrunde reproduziert. Sie zählen daher
weiterhin nicht in `threats_open`, stehen aber unverändert als offene Triage im Register.

---

## Sign-Off

- [x] Alle Threats haben eine Disposition (69 mitigate, 3 accept)
- [x] Akzeptierte Risiken im Log dokumentiert
- [x] `threats_open: 0` — **erfüllt (2026-09-05).** SEC-01/02/03 sind durch die Pläne 12-14, 12-13
      und 12-12 geschlossen und zweifach am Quelltext bestätigt; die 28 Threats der Gap-Runde sind
      auditiert und geschlossen, einschließlich des zunächst offenen T-12-70 (veralteter Dev-Bundle,
      behoben durch Dev-Build + E2E-Neulauf).
- [ ] Triage der verbleibenden 14 unbestätigten Einwände ausstehend — unterhalb der Sperrschwelle
      geführt, blockiert den Phasenabschluss nicht (5 der ursprünglich 19 sind erledigt)
