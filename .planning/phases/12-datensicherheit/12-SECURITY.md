---
phase: "12"
slug: "datensicherheit"
status: audited
# threats_open zählt NUR die drei persönlich reproduzierten Blocker (SEC-01..03).
# Die 19 weiteren von der Challenge-Stufe heruntergestuften Threats sind NICHT
# mitgezählt — siehe § Methodenkritik. Sie sind Triage-Liste, nicht Befund.
threats_open: 3
asvs_level: 1
security_block_on: high
created: "2026-09-04"
audited: "2026-09-04"
---

# Phase 12 — Security

Nachträglich erstellt durch den `verify:post`-Hook `security` beim Abschluss von
`/gsd-verify-work 12`. Register-Herkunft: **alle 11 Pläne** dieser Phase tragen einen
`<threat_model>`-Block (`register_authored_at_plan_time: true`) — also Verifikation der
Mitigationen, kein retroaktives STRIDE.

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

---

## Bestätigte Blocker (persönlich reproduziert)

Diese drei stammen **nicht** aus der Agenten-Klassifikation, sondern wurden vom Orchestrator selbst
gegen den unveränderten Quelltext reproduziert.

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

| Threat | Kern des Einwands | Ersteinschätzung |
|--------|-------------------|------------------|
| T-12-11 | „leer" ist als Schlüsselzahl definiert, nicht als Inhalt — eine schema-initialisierte Leerkampagne gilt als befüllt | plausibel, prüfen |
| T-12-12 | `isFreshInstall()` fragt einen Key ab, `importFullExport()` überschreibt aber zusätzlich Kampagnenindex und `DICE_FAV_KEY` | plausibel, prüfen |
| T-12-24 | Kampagne mit ausschließlich `quickRefCustom` gilt weiterhin als Frischinstallation — G-12-3 in neuer Ausprägung | plausibel, prüfen |
| T-12-01 | Importseite hat keine Größengrenze; ein Eintrag dekodiert vor der 100-MB-Sperre von `saveSoundBlob()` | plausibel, prüfen |
| T-12-05 | 300 MiB Export- vs. 350 MiB Import-Grenze inkonsistent kalibriert | **bereits bekannt als WR-03** (`12-VERIFICATION.md`) |
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

---

## Sign-Off

- [x] Alle Threats haben eine Disposition (41 mitigate, 3 accept)
- [x] Akzeptierte Risiken im Log dokumentiert
- [ ] `threats_open: 0` — **nicht erfüllt.** SEC-01, SEC-02 und SEC-03 sind reproduzierte Blocker
      auf Stufe `high`. Der Phasenabschluss bleibt bis zu ihrer Behebung gesperrt.
- [ ] Triage der 19 unbestätigten Einwände ausstehend
