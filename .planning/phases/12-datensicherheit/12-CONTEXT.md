---
phase: 12
phase_name: Datensicherheit
slug: datensicherheit
created: 2026-08-06
requirements: [SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SAFE-06]
decisions_count: 8
---

# Phase 12 — Context: Datensicherheit

## Domain Boundary

Kein Pfad in Backup, Export oder Migration verliert oder überschreibt mehr stillschweigend Daten —
und die Randfälle, die solche Verluste bisher verdeckt haben, sind getestet.

**Nicht Teil dieser Phase:** neue Spielleiter-Funktionen, Performance-Arbeit (Phase 13),
Modul-Aufteilung (Phase 13), Test-Gates (Phase 14).

## Canonical Refs

- [`11-CONCERNS-TRIAGE.md`](../../milestones/v1.1-phases/11-architektur-build-hygiene/11-CONCERNS-TRIAGE.md)
  — Live-Code-Beleg je DEBT-Posten (Einträge N1–N6, N17)
- [`milestones/v1.1-REQUIREMENTS.md`](../../milestones/v1.1-REQUIREMENTS.md) — ungekürzte
  Beschreibungen von `DEBT-18/19/20/21/22/05/08/11`
- [`REQUIREMENTS.md`](../../REQUIREMENTS.md) — `SAFE-01` … `SAFE-06`
- [`11-LEARNINGS.md`](../../milestones/v1.1-phases/11-architektur-build-hygiene/11-LEARNINGS.md)
  und [`08-LEARNINGS.md`](../../milestones/v1.1-phases/08-test-fundament-gr-n/08-LEARNINGS.md)
  — wiederkehrendes Muster „ein grüner Test ist kein Beweis"
- Keine externen ADRs oder Specs — dieses Projekt führt keine.

## Übernommen aus früheren Phasen (nicht neu verhandeln)

- **`readCampaignDataForBackup()`** liest seit `DEBT-17` (v1.1, Commit `71fb6ef`) in der Reihenfolge
  localStorage → IndexedDB → laufendes `D` und schreibt **niemals** eine leere Kampagne. Liefert
  keine Quelle Daten, wird gar nichts geschrieben und der Status geht auf `paused`. Diese
  Schutzschicht bleibt.
- **`saveUndoState()` vor jeder destruktiven Operation** — Projektregel aus `CLAUDE.md`.
- **`file://` ist der primäre Nutzungsmodus**, nicht die PWA. Der Entwickler startet die App per
  Doppelklick auf `dist/dnd-tracker-bundled.html`.
- **Kein Runtime-Dependency, non-ESM.** Jede Lösung muss ohne neues Paket auskommen.
- **Der Umzug `file://` → PWA läuft genau einmal** und ist angeleitet. Was dabei verlorengeht, ist
  unwiederbringlich.

## Decisions

### D-01: Audio geht in eine zweite Export-Datei

Der Umzugs-Export bleibt strukturell wie heute — ein JSON per `JSON.stringify(exportObj, null, 2)`,
Anchor-Download (`systems/migration/full-export.js:84-99`). Die IndexedDB-Inhalte kommen in eine
**separate** Datei (Base64-JSON), nicht in den Hauptexport.

**Warum:** `JSON.stringify` über die volle Struktur inklusive Audio kann bei größerer Bibliothek am
Browser-Speicher scheitern — und dann scheitert der **gesamte** Umzug, nicht nur das Audio. Ein
ZIP-Archiv schied aus, weil es ein Runtime-Dependency erfordert hätte.

**Konsequenz für die Planung:** `FULL_EXPORT_SCHEMA` (`full-export.js:9-18`) bleibt für die
localStorage-Felder zuständig; die IDB-Stores `audioBlobs` (`features/soundboard/soundboard-idb.js`)
und `diceStats` (`features/dice-stats/dice-stats-idb.js`) bekommen einen eigenen Export-Pfad mit
eigenem Schema und eigener Versionskennung.

### D-02: Fehlendes Audio blockiert den Import nicht

Der Hauptimport läuft auch ohne die Audio-Datei durch. Fehlt sie oder passt sie nicht zum
Hauptexport, wird das **benannt** — inklusive der Angabe, welche Szenen betroffen sind.

**Warum:** Der Umzug läuft nur einmal. Wer die zweite Datei verlegt hat, käme sonst gar nicht erst
an seine Kampagnen. Ein blockierender Import wäre bei einem einmaligen, unwiederholbaren Vorgang das
größere Risiko.

### D-03: Ein Backup-Lauf sichert alle Kampagnen

`_doBackup()` ermittelt heute genau einen `campaignKey` und sichert nur die aktive Kampagne, während
der Kommentar „(D-13: je Kampagne einzeln)" das Gegenteil behauptet. Künftig iteriert ein Lauf über
alle Kampagnen des Index.

**Warum:** Erfüllt endlich, was seit Phase 2 die dokumentierte Absicht war. Der gefährliche
Standardfall — man vergisst, die anderen Kampagnen zu sichern — verschwindet strukturell. Die
zusätzliche Schreiblast ist bei der realen Kampagnenzahl unkritisch.

**Konsequenz:** Auch die Tages-Snapshots und `pruneOldSnapshots()` gelten dann je Kampagne. Der
`FILE_BACKUP_MAX_SNAPSHOTS`-Wert (10) bleibt **pro Kampagne**, nicht global — sonst würde eine
Kampagne die Snapshots der anderen verdrängen.

### D-04: Kampagnen-Key nur bei echter Namenskollision anhängen

`getBackupFilenames()` (`file-backup-manager.js:45-62`) normalisiert unterschiedliche Namen auf
denselben `safeName`; rein nicht-lateinische Namen kollabieren sogar auf den Leerstring. Kollidiert
ein `safeName` mit dem einer anderen Kampagne, wird der Kampagnen-Key angehängt — sonst nicht.

**Warum:** Vorhandene Backup-Dateien laufen nahtlos weiter, kein schreibender Eingriff in den
Backup-Ordner des Nutzers, keine unterbrochene Snapshot-Historie. Der Preis: der Dateiname einer
Kampagne kann sich ändern, wenn später eine kollidierende hinzukommt.

**Konsequenz für die Planung:** Die Kollisionsprüfung braucht den vollständigen Kampagnen-Index, nicht
nur die aktive Kampagne. Der Leerstring-Fall muss **immer** den Key bekommen — ein leerer `safeName`
kollidiert per Definition mit jedem anderen leeren.

### D-05: Der `autosave-toggle`-Codepfad wird entfernt

Das Element wird an drei Stellen abgefragt (`systems/spellslots/persistence.js:38`, `:192`,
`systems/avatars.js:173`), existiert aber in **keinem** Template. `saveImmediate()` lässt sich damit
theoretisch abschalten, praktisch nie.

**Warum:** Toter Code, der eine Abschaltmöglichkeit für kritische Saves offenlässt. Entfernen macht
das Speichern unbedingt und die Absicht eindeutig — statt einen Schalter einzuführen, der eine neue
Fehlerquelle wäre.

**Konsequenz:** Alle drei Fundstellen entfernen, nicht nur die in `persistence.js`.

### D-06: Undo repariert Reihenfolge **und** validiert beim Push

`undo.js:39-41` popt vom Stack (`undoStack.pop()`), bevor `safeJSONParse` geprüft wird — bei einem
Parse-Fehler ist der Eintrag weg. Dasselbe in `redo()` (`:72-74`). Künftig wird erst geparst und nur
bei Erfolg gepoppt. Zusätzlich prüft `saveUndoState()` beim Push, dass der Snapshot serialisierbar
ist.

**Warum:** Die Reihenfolgekorrektur allein lässt zu, dass ein defekter Snapshot auf dem Stack liegt
und beim Undo scheitert. Die Validierung beim Push verhindert, dass er überhaupt dorthin gelangt.

### D-07: `isFreshInstall()` berücksichtigt Override und IDB-Modus

`systems/migration/migration-wizard.js:31-36` prüft nur `APP_CONFIG.STORAGE_KEY` und ignoriert
`window.STORAGE_KEY_OVERRIDE` sowie den IDB-only-Löschpfad — **denselben Codepfad, der `DEBT-17`
verursacht hat** (`persistence.js:64-68` löscht den localStorage-Key nach bestätigtem IDB-Write).

**Konsequenz für die Planung:** Die Prüfung muss dieselben Quellen konsultieren wie
`readCampaignDataForBackup()`. Beide Funktionen beantworten im Kern dieselbe Frage — „gibt es hier
Daten?" — und sollten sich nicht widersprechen können.

### D-08: Der Testumfang deckt den Audio-Rundlauf mit ab

`SAFE-06` nennt drei Randfälle (>5-MB-IDB-only-Save mit Reload, localStorage-Quota-Fallback,
Export/Import-Versions-Rundlauf). Dazu kommt ein vierter: **Audio exportieren → importieren → Szene
spielt den Track**.

**Warum:** Das ist exakt die Naht, an der `DEBT-18` entstanden ist. Und es ist dieselbe Fehlerklasse,
die schon `DEBT-17` verdeckt hat — zwei Subsysteme mit implizitem Vertrag, und kein Test, der die
Naht durchläuft.

## Noted for Later (nicht in dieser Phase)

- **Audio-Auswahl beim Export** (Checkbox „Audio einschließen"): verworfen zugunsten der
  Zwei-Datei-Lösung, die dasselbe Problem ohne UI-Arbeit löst. Falls sich die zweite Datei im
  Gebrauch als lästig erweist, wäre das der nächste Schritt.
- **Einheitliches Backup-Namensschema mit Key für alle Kampagnen:** verworfen (D-04), weil es die
  vorhandene Snapshot-Historie unterbräche. Bei einem künftigen Backup-Format-Wechsel neu bewerten.
- **`autosave-toggle` als echtes Feature:** verworfen (D-05). Falls du am Spieltisch bewusst ohne
  Autosave arbeiten willst, gehört das in einen Feature-Milestone.
- **Systematische Suche nach weiteren Stellen der `DEBT-17`-Bauart** (zwei Subsysteme, impliziter
  Vertrag): eigenes Vorhaben, in `REQUIREMENTS.md` §Out of Scope vermerkt.

## Offene Fragen für die Recherche

1. **Base64-Aufblähung und Praxisgrenze:** Wie groß darf die Audio-Bibliothek werden, bevor auch die
   separate Datei am `JSON.stringify`- oder Blob-Limit scheitert? Der Planer braucht eine belastbare
   Größenordnung, keine Schätzung — messbar an einer realen Datei.
2. **Kampagnen-Index als Quelle:** Liefert `getCampaignIndex()`
   (`systems/campaign-manager/campaign-manager.js:11`) unter `file://` zuverlässig alle Kampagnen,
   auch solche im IDB-Modus? D-03 hängt daran.
3. **`diceStats`-Volumen:** Der Store wächst unbegrenzt (`DEBT-24`, Phase 13). Soll der Export ihn
   vollständig mitnehmen oder greift hier bereits eine Begrenzung? Berührung mit `PERF-02` klären.
