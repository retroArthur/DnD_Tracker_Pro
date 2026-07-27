# Codebase Concerns

**Analysis Date:** 2026-07-26

Unabhängige Neubewertung. Jede Aussage unten ist an eine Datei:Zeile oder ein wörtlich gelesenes
Code-Fragment gebunden. Nicht verifizierte Vermutungen sind ausdrücklich als **[VERMUTUNG]**
markiert. Zählungen stammen ausschließlich aus in dieser Sitzung ausgeführten Kommandos.

---

## Datenintegrität & Persistenz

### ✅ BEHOBEN — Datei-Backup schrieb eine LEERE Kampagne, sobald der IndexedDB-Modus (>5 MB) griff

> **Erledigt am 2026-07-26 (`71fb6ef`, DEBT-17).** `_doBackup()` nutzt jetzt
> `readCampaignDataForBackup()` mit der Reihenfolge localStorage → IndexedDB
> (`loadFromIndexedDBFallbackRaw`) → laufendes `D`; ein leeres Objekt gilt in keiner Stufe als
> gültige Kampagne. Liefert keine Quelle Daten, wird **gar nichts** geschrieben und der Status geht
> auf `paused` — damit kann auch ein künftiger Ausfall beider Lesepfade die guten Snapshots nicht
> mehr verdrängen. Abgesichert durch `tests/unit/file-backup-idb.test.js` (7 Tests, TDD: 5 zuvor
> rot). Die Beschreibung unten bleibt als Beleg stehen, warum der Defekt so lange unsichtbar war.

- **Was (historisch):** Im >5-MB-Pfad entfernt `saveImmediate()` den localStorage-Schatten der Kampagne und
  feuert danach die Post-Save-Hooks:
  `systems/spellslots/persistence.js:64-79` — `await saveToIndexedDBFallback(key, dataString);`
  → `StorageAPI.remove(key); StorageAPI.remove(key + '_ts');` → … → `_notifyPostSaveHooks();`.
  Der registrierte Backup-Hook (`systems/file-backup/file-backup-manager.js:355-357`,
  `registerPostSaveHook(onAfterSave)`) liest die Daten aber ausschließlich aus localStorage:
  `file-backup-manager.js:262-264` — `StorageAPI.getJSON(campaignKey, {})`.
  `StorageAPI.getJSON` liefert bei fehlendem Key den Fallback zurück (`utils/basic.js:349-352`),
  hier also `{}`.
- **Fehlerszenario:** Eine große Kampagne kippt in den IDB-Modus. Der nächste Save überschreibt
  `<kampagne>-aktuell.json` mit `{}`. Ist es der erste Save des Tages, wird zusätzlich der
  Tages-Snapshot als `{}` geschrieben (`file-backup-manager.js:103-118`) und anschließend
  `pruneOldSnapshots()` aufgerufen, das den ältesten echten Snapshot löscht
  (`file-backup-manager.js:151-173`). Über 10 Spieltage sind sämtliche Datei-Backups leer.
  `setBackupStatus('active')` (`file-backup-manager.js:274`) meldet dabei durchgehend Erfolg —
  der Nutzer bekommt keinerlei Warnung.
- **Schwere:** **Kritisch.** Stiller, kumulativer Totalverlust der einzigen Off-Browser-Sicherung,
  und zwar genau bei den größten (= wertvollsten) Kampagnen. Kein Fehlerpfad, keine Anzeige.
- **Fix-Richtung:** In `_doBackup()` denselben Lade-Weg verwenden wie der App-Start (IDB-Fallback
  berücksichtigen), oder mindestens auf leeres/`{}`-Ergebnis prüfen und dann NICHT schreiben.

### Umzugs-Export enthält keine IndexedDB-Inhalte — Audio und Würfelstatistik gehen beim Umzug verloren

- **Was:** `FULL_EXPORT_SCHEMA` (`systems/migration/full-export.js:9-18`) kennt nur
  `campaigns`, `settings`, `diceFavorites`, `dmScreenProfiles`, `campaignIndex`.
  `buildFullExport()` (`full-export.js:39-79`) liest ausschließlich localStorage
  (`StorageAPI.getJSON`). Die Audio-Blobs des Soundboards liegen aber im IDB-Store `audioBlobs`
  (`features/soundboard/soundboard-idb.js:64-69`), die Würfelstatistik im Store `diceStats`
  (`features/dice-stats/dice-stats-idb.js:20-22`); beide Stores werden in
  `core/init.js:345-350` angelegt.
- **Fehlerszenario:** Der Nutzer macht den dokumentierten Umzug `file://` → PWA. Die
  Szenen-Definitionen reisen mit (sie liegen als `D.soundboard.scenes` in den Kampagnendaten,
  `features/soundboard/soundboard-crud.js:9`), die referenzierten Blobs nicht. Nach dem Import
  zeigt jede Szene beim Start `Audio-Datei nicht gefunden (ID: …)`
  (`features/soundboard/soundboard-player.js:99-101`). Die gesamte Würfelhistorie ist weg.
- **Schwere:** **Hoch.** Der Umzug ist ein einmaliger, angeleiteter Vorgang, nach dem der Nutzer
  die alte Umgebung typischerweise nicht wiederherstellt. Verlust ist irreversibel.
- **Fix-Richtung:** Entweder Blobs als Base64 in den Export aufnehmen (Größe beachten) oder den
  Wizard explizit warnen lassen, dass Audio manuell neu importiert werden muss.

### Löschen einer Audiodatei ist nicht rückgängig zu machen und hinterlässt nach Undo tote Referenzen

- **Was:** `removeAudioFile()` (`features/soundboard/soundboard-crud.js:69-101`) löscht zuerst
  den Blob (`await window.deleteSoundBlob(id)`), mutiert dann `D.soundboard.scenes` und ruft
  `window.save()` — **ohne** vorheriges `pushUndo`/`saveUndoState`. Verifiziert: ein Grep über
  `features/soundboard` nach `saveUndoState|deleteWithConfirm|pushUndo` liefert keinen Treffer.
  Zum Vergleich rufen die übrigen neuen Feature-CRUDs korrekt `pushUndo` (z. B.
  `features/timeline/timeline-crud.js:223`, `features/fraktionen/fraktionen-crud.js:131`,
  `features/session-prep/session-prep-crud.js:144`, `features/npc-generator/npc-generator.js:265`).
- **Fehlerszenario:** Strg+Z nach dem Löschen stellt aus dem Undo-Snapshot Szenen wieder her, die
  auf einen nicht mehr existierenden `blobId` zeigen — die Szene bleibt dauerhaft defekt. Der
  Blob selbst ist auch ohne Undo unwiederbringlich weg (kein Papierkorb).
- **Schwere:** **Mittel.** Betrifft nur das Soundboard, ist aber ein Bruch der projektweit
  zugesicherten Undo-Garantie (CLAUDE.md „Always call `saveUndoState()`").

### `isFreshInstall()` sieht nur einen einzigen localStorage-Key

- **Was:** `systems/migration/migration-wizard.js:31-36` prüft ausschließlich
  `StorageAPI.getJSON(APP_CONFIG.STORAGE_KEY, null)` — weder `window.STORAGE_KEY_OVERRIDE`
  (die aktive benannte Kampagne, vgl. `systems/spellslots/persistence.js:39`) noch den
  IDB-only-Pfad, in dem dieser Key bewusst gelöscht wird (`persistence.js:66-67`).
- **Fehlerszenario:** Ein PWA-Nutzer, dessen Daten in einer benannten Kampagne
  (`dnd-campaign-*`) liegen oder dessen Kampagne >5 MB groß ist, bekommt beim Start den
  Erststart-Umzugs-Wizard angeboten (`migration-wizard.js:534-536`), obwohl volle Daten
  vorhanden sind. Ein dort ausgeführter Import überschreibt Kampagnen-Keys per
  `StorageAPI.setJSON` (`full-export.js:156`).
- **Schwere:** **Mittel.** Der Wizard allein löscht nichts; der Schaden entsteht erst, wenn der
  irregeführte Nutzer eine alte Exportdatei importiert. Aber genau dazu lädt der Dialog ein.

### Datei-Backup sichert immer nur die AKTIVE Kampagne — der Kommentar behauptet das Gegenteil

- **Was:** `_doBackup()` ermittelt genau einen `campaignKey`
  (`file-backup-manager.js:255-258`) und schreibt genau eine Kampagne
  (`file-backup-manager.js:266`). Der danebenstehende Kommentar lautet
  `// Kampagnendaten aus StorageAPI laden (D-13: je Kampagne einzeln)`
  (`file-backup-manager.js:261`).
- **Fehlerszenario:** Nutzer mit mehreren Kampagnen glaubt, alle seien gesichert. Die
  `-aktuell.json` der nicht-aktiven Kampagnen altert beliebig; wechselt der Nutzer die Kampagne
  selten, ist deren Backup Monate alt.
- **Schwere:** **Mittel.** Kein Datenverlust im Ist-Zustand, aber ein falsches Sicherheitsversprechen.

### Backup-Dateinamen können zwischen Kampagnen kollidieren

- **Was:** `getBackupFilenames()` (`file-backup-manager.js:46-64`) reduziert den Kampagnennamen
  über `.replace(/[^a-z0-9-]/gi, '-')` + Kollaps von Bindestrichen + Trimmen auf `safeName`.
- **Fehlerszenario:** „Feywild!" und „Feywild?" ergeben beide `feywild`, ihre `-aktuell.json`
  und Tages-Snapshots überschreiben sich gegenseitig. Ein rein nicht-lateinischer Name (z. B.
  kyrillisch) kollabiert auf den Leerstring → Datei heißt `-aktuell.json`; jede weitere solche
  Kampagne teilt sich diese Datei.
- **Schwere:** **Mittel.** Braucht einen speziellen Namen, führt dann aber zu stillem
  Überschreiben inklusive falschem Pruning (der Snapshot-Regex `getSnapshotRegex`,
  `file-backup-manager.js:143-146`, matcht dann Snapshots beider Kampagnen).

---

## Sicherheit

### Generische `call`-Aktion ruft eine beliebige globale Funktion aus einem DOM-Attribut auf

- **Was:** `ui/actions/ui-actions.js:186-190`:
  ```js
  call: ctx => {
      const fn = window[ctx.value];
      if (typeof fn === 'function') fn(ctx.id);
      else console.error('[EventDelegation] Function not found:', ctx.value);
  },
  ```
  Keine Whitelist. Genutzt u. a. in `features/bestiary/bestiary-render.js:427`,
  `features/npcs/npc-popup.js:77`, `ui/editors/rich-text.js:228`.
- **Bewertung:** Der naheliegende Eskalationspfad (importiertes/eingefügtes Rich-Text-HTML mit
  `data-action="call"`) ist **derzeit blockiert**: `sanitizeHTML()` baut jedes erlaubte Element
  neu auf und kopiert nur explizit gelistete Attribute (`utils/basic.js:176-186` ff.);
  `data-*` steht nicht in `allowedAttributes` (`utils/basic.js:105-118`), wird also verworfen.
- **Fehlerszenario:** Sobald irgendein Renderpfad Nutzerinhalt ohne `sanitizeHTML` als HTML
  ausgibt, wird aus einer XSS-artigen Lücke sofort ein Ein-Klick-Aufruf beliebiger App-Funktionen
  (z. B. Lösch-/Import-Funktionen). Die Verteidigung hängt an einer einzigen Attribut-Whitelist.
- **Schwere:** **Mittel** (latent, defense-in-depth). Eine Whitelist erlaubter `call`-Ziele wäre
  billig und würde die Kopplung auflösen.

### `class`-Attribut wird ungefiltert durchgereicht

- **Was:** `utils/basic.js:198-200` — `else if (attrName === 'class' && allowedAttributes.class)
  { cleanElement.setAttribute('class', attr.value); }`, `allowedAttributes.class: true`
  (`utils/basic.js:113`).
- **Fehlerszenario:** Gespeicherter Nutzerinhalt kann jede App-CSS-Klasse annehmen, z. B.
  `modal-overlay` oder `sb-scene-card` — reines UI-Spoofing/Overlay im eigenen Dokument,
  kein Code-Ausführungspfad.
- **Schwere:** **Niedrig.** Offline-Single-User-App; ein bewusster Tradeoff ist plausibel (der
  Editor braucht Klassen wie `read-aloud`). Erwähnt für Vollständigkeit.

### Avatar-URLs werden nur HTML-escaped, nicht protokollgeprüft

- **Was:** `features/bestiary/bestiary-render.js:412` —
  `'<img class="bestiary-detail-avatar" src="' + esc(monster.avatar) + '" …>'`.
  `esc()` (`utils/basic.js:19-28`) maskiert nur `& < > " '`, prüft kein Schema.
- **Fehlerszenario:** Attributausbruch ist ausgeschlossen (Quotes maskiert), und `javascript:`
  in `img src` ist in aktuellen Browsern wirkungslos. Verbleibt: eine externe `http(s)`-URL
  erzeugt einen ungewollten Netzwerk-Request in einer als offline beworbenen App.
- **Schwere:** **Niedrig.** Datenschutz-/Offline-Bruch, keine Codeausführung.

---

## Performance & Skalierung

### `pushUndo()` serialisiert bei JEDER Mutation den kompletten Zustand

- **Was:** `systems/undo.js:9-20` — `state: JSON.stringify(window.D)`, Stack bis
  `UNDO_LIMIT` (`systems/undo.js:7`, Wert `30` aus `core/config.js:28`).
- **Fehlerszenario:** `D` enthält u. a. `bestiary`, `wiki`, `npcs`, `locations`, Session-Notizen.
  Bei einer Kampagne nahe der 5-MB-Grenze (die Warnschwelle liegt laut
  `systems/spellslots/persistence.js:49-50` bei 4 MB) kostet jede einzelne Änderung eine
  Voll-Serialisierung, und der Undo-Stack hält bis zu 30 vollständige Kopien im RAM.
  Zusätzlich serialisiert jeder `save()` denselben Zustand erneut (`persistence.js:44`).
- **Schwere:** **Mittel.** Trifft genau die Vielspieler-Kampagne; äußert sich als zunehmend
  träge UI ohne erkennbare Ursache.

### `JSON.stringify`-Undo verliert Typen

- **Was:** derselbe Anker, `systems/undo.js:12`. CLAUDE.md schreibt für Deep-Clones
  `structuredClone()` vor; das Undo-System nutzt weiterhin JSON.
- **Fehlerszenario:** Alle `Date`-Instanzen in `D` würden nach einem Undo zu Strings.
  **[VERMUTUNG]** — ich habe kein konkretes `Date`-Feld innerhalb von `D` verifiziert
  (die Würfelhistorie mit `time: new Date()` liegt außerhalb von `D`,
  `features/dice/dice-core.js:436`). Der Typverlust ist strukturell vorhanden, der konkrete
  Schaden unbestätigt.
- **Schwere:** **Niedrig** bis unbekannt, bis ein betroffenes Feld nachgewiesen ist.

### Würfelstatistik wächst unbegrenzt und wird komplett in den Speicher geladen

- **Was:** Jeder Wurf schreibt einen Datensatz: `features/dice/dice-core.js:440-444` →
  `statsIdbPut(...)` (`features/dice-stats/dice-stats-idb.js:16-26`, `store.add`, autoIncrement).
  Ein Grep über `features/dice-stats/` nach `clear()`/`deleteRecord`/`diceStats` zeigt **keine**
  Lösch- oder Prune-Funktion. `getAllStats()` (`dice-stats-idb.js:32-47`) lädt per `store.getAll()`
  alle Datensätze auf einmal.
- **Fehlerszenario:** Nach längerem Spielbetrieb (jede AoE-Runde erzeugt Würfe) enthält der Store
  sehr viele Einträge; das Öffnen des Statistik-Tabs zieht sie alle in den JS-Heap.
  Im Gegensatz zur In-Memory-Historie, die bei 30 gedeckelt ist (`dice-core.js:437`), gibt es
  hier keinerlei Grenze und keine Nutzeraktion zum Leeren.
- **Schwere:** **Mittel.** Kein Datenverlust, aber monoton wachsende Ladezeit und Speicherbedarf.

### Alte Szenen-GainNodes werden beim Szenenwechsel nicht getrennt

- **Was:** `activateSoundScene()` blendet alte Tracks aus (`soundboard-player.js:206-216`) und
  ersetzt `_activeScene` (`:257`). Die pro Track erzeugten `trackGain`-Knoten
  (`:236-239`, `trackGain.connect(ctx2.destination)`) werden nie `disconnect()`-et; nur die
  Iterations-Quellen räumen sich in `src.onended` auf (`:168-172`).
- **Fehlerszenario:** Jeder Szenenwechsel lässt einen stummgeregelten GainNode dauerhaft am
  Ziel hängen. Über eine lange Sitzung mit vielen Wechseln wächst der Audiograph monoton.
- **Schwere:** **Niedrig.** GainNodes sind billig; erst bei sehr vielen Wechseln messbar.

---

## Fragile Bereiche & Wartungsrisiko

### `const D` überschattet das globale Datenobjekt an mehreren Stellen

- **Was:** verifizierte Vorkommen: `systems/migration/full-export.js:66` (`const D = window.D;`
  in `buildFullExport`), `utils/crud-helpers.js:44` und `:107`, `utils/utilities.js:185` und
  `:200`, `systems/avatars.js:116` und `:176`, `systems/backups.js:17`,
  `systems/spellslots/persistence.js:41`. Zusätzlich überschattet
  `features/soundboard/soundboard-player.js:145` (`const D = track.duration;`) `D` mit einer
  **Zahl**.
- **Fehlerszenario:** Wer in `scheduleIteration()` künftig auf Kampagnendaten zugreifen will,
  liest stillschweigend eine Sekundenzahl. Allgemeiner: jede dieser Funktionen bricht die
  projektweite Annahme „`D` ist das Datenobjekt", was Refactorings und Codelesen unzuverlässig macht.
- **Schwere:** **Mittel** (Wartbarkeit). Ein SyntaxError im Bundle entsteht dadurch nicht —
  funktionsskopierte `const` sind blockskopiert; die in CLAUDE.md dokumentierte Begründung
  („Will conflict when concatenated") trifft für diese Fälle nicht zu. Das eigentliche Problem
  ist Shadowing/Lesbarkeit, nicht der Build.

### `sanitizeHTML` existiert zweimal — bewusst, aber wartungsintensiv

- **Was:** `utils/basic.js:58` und `utils/testable-utils.js:34`. Ein Zeilenbereichs-Diff der
  beiden Implementierungen zeigt aktuell **nur** Kommentar- und Formatierungsunterschiede,
  keine funktionale Abweichung. `utils/testable-utils.js` ist als einzige JS-Datei unter
  `core/ utils/ systems/ features/ ui/ render/` **nicht** in `loader.js` registriert
  (verifiziert per Schleife über alle gefundenen `.js`-Dateien), und `build.py:177` dokumentiert
  diese Ausnahme ausdrücklich.
- **Bewertung:** Ein **dokumentierter Tradeoff**, zusätzlich abgesichert durch
  `tests/unit/sanitizer-parity.test.js`. Kein Defekt — aber die Sicherheitslogik der App hängt
  daran, dass dieser Paritätstest gepflegt bleibt.
- **Schwere:** **Niedrig**, mit der Auflage, den Paritätstest nie zu deaktivieren.

### Command-Palette-Register ist eine handgepflegte Parallelwelt zur Event-Delegation

- **Was:** `features/command-palette/action-registry.js` enthält 22 Einträge (gezählt über
  `grep -c "^\s*id: '"`), die App-Funktionen über `window.<name>`-Aufrufe erreichen, z. B.
  `action-registry.js:14`, `:19`, `:57`. Die reguläre UI läuft dagegen über `data-action`-Attribute
  und die Handler in `ui/actions/`.
- **Fehlerszenario:** Wird eine Funktion umbenannt oder eine Modal-ID geändert, schlägt der
  Palette-Eintrag still fehl (die `typeof … === 'function'`-Guards schlucken alles), während die
  normale UI weiterfunktioniert. Der Nutzer erlebt eine Palette-Aktion, die einfach nichts tut.
- **Schwere:** **Niedrig–Mittel.** Es existieren `tests/unit/action-registry.test.js` und
  `tests/unit/action-registry-collisions.test.js`; ob sie die Existenz der Zielfunktionen prüfen,
  habe ich nicht verifiziert **[VERMUTUNG]**.

### Veralteter Header-Kommentar im Datei-Backup beschreibt ein explizit verbotenes Muster

- **Was:** `systems/file-backup/file-backup-manager.js:5-6` behauptet
  „`initFileBackup()`: Haengt sich per Live-Sync-Muster in `window.save()` ein". Der Code tut
  das Gegenteil und begründet es auch
  (`file-backup-manager.js:348-357`: „KEIN window.save-Monkey-Patch (UAT 02) …
  `registerPostSaveHook(onAfterSave)`"). Auch `:213` trägt noch die Überschrift
  „After-Save-Hook" und `:340` „Live-Sync-Hook (CLAUDE.md-Muster)".
- **Fehlerszenario:** Ein späterer Entwickler kopiert das im Kommentar beschriebene Muster in ein
  neues Modul und baut damit exakt den Fehler nach, der laut CLAUDE.md dazu führte, dass
  Datei-Backups nie geschrieben wurden.
- **Schwere:** **Niedrig** (Dokumentation), aber die Fehlerklasse ist teuer und in diesem Projekt
  bereits einmal produktiv aufgetreten.

### `console.*` außerhalb von DEBUG_MODE-Guards

- **Was:** verifizierte Stellen ohne `DEBUG_MODE`-Bedingung in derselben Zeile:
  `core/init.js:163`, `utils/basic.js:10`, `:271`, `:286`, `:312`, `:356`, `:366`, `:376`, `:387`,
  `utils/utilities.js:233`, `systems/backups.js:415-416`,
  `systems/campaign-manager/campaign-manager.js:106`, `:114`, `:152`,
  `systems/spellslots/import-export.js:227`, `:272`, `:362`, `:393`, `:623`, `:660`, `:664`,
  `ui/actions/ui-actions.js:189`. (`utils/performance.js:10-11` bindet `console.warn/error`
  bewusst als Modul-Alias.)
- **Bewertung:** CLAUDE.md behauptet „Zero console.log in production builds ✅". Für den
  Quellstand trifft das nicht zu; ob `build.py --production` sie entfernt, habe ich nicht
  geprüft **[VERMUTUNG]**.
- **Schwere:** **Niedrig.** Kosmetik plus eine falsche Zusicherung in der Projektdoku.

---

## Test-Lücken

### Keine dedizierten Tests für Timeline / Reise / Fraktionen / Session-Prep / NPC-Generator

- **Was:** Verifiziert über `grep -rl <begriff> tests/unit tests/e2e -i`: für `timeline`, `reise`,
  `fraktion`, `session-prep` und `npc-generator` gibt es jeweils **genau zwei** Treffer, und in
  beiden Fällen dieselben Sammel-Dateien: `tests/unit/welt-story.test.js` und
  `tests/e2e/features/welt-story.spec.js`. Zeilenumfang dieser fünf Bereiche laut `wc -l` dieser
  Sitzung: `features/timeline/` 519, `features/reise/` 638, `features/fraktionen/` 555,
  `features/session-prep/` 623, `features/npc-generator/` 877.
- **Fehlerszenario:** Regressionen in der Kalender-Fortschreibung
  (`features/timeline/timeline-crud.js:58` `advanceCalendarDate`) oder der Ruf-Berechnung
  (`features/fraktionen/fraktionen-crud.js:117` `anpassenRuf`) fallen durch, weil eine
  Sammel-Spec für fünf Features nur Grundpfade abdecken kann.
- **Schwere:** **Mittel.** Genau diese Module mutieren `D` direkt und persistieren sofort.

### Keine Testdatei adressiert das Zusammenspiel Persistenz-IDB-Modus ↔ Datei-Backup

- **Was:** `tests/unit/file-backup-hook.test.js` und `tests/unit/file-backup.test.js` existieren,
  ebenso `tests/unit/storage-conflict.test.js`. Der oben beschriebene Kritikalfehler
  (>5-MB-Pfad ⇒ leeres Backup) ist trotzdem im Code vorhanden — die Interaktion beider Systeme
  ist folglich nicht abgedeckt.
- **Schwere:** **Hoch**, weil sie den schwersten Befund dieses Dokuments durchgelassen hat.

### `charId` der Würfelstatistik ist tot

- **Was:** `features/dice/dice-core.js:443` schreibt konstant `charId: null`. Ein Grep nach
  `charId` in `features/dice-stats/dice-stats-render.js` liefert **keinen** Treffer.
- **Fehlerszenario:** Kein Laufzeitfehler; das Feld belegt Platz in jedem IDB-Datensatz und
  suggeriert eine nicht existierende Auswertung pro Charakter.
- **Schwere:** **Niedrig.**

---

## Build & Architektur

### Session-ID der Würfelstatistik ist nicht kollisionssicher

- **Was:** `features/dice-stats/dice-stats-idb.js:8` — `const _sbSessionId = Date.now().toString();`
- **Fehlerszenario:** Zwei in derselben Millisekunde gestartete Tabs (oder ein Zurückspringen der
  Systemuhr) teilen sich eine Session-ID; der Session-Filter
  (`getStatsForSession`, `dice-stats-idb.js:54-70`) mischt dann die Würfe.
- **Schwere:** **Niedrig.** Unwahrscheinlich, Auswirkung kosmetisch.

### Service Worker cacht nur das Produktions-Artefakt

- **Was:** `sw.js:9-12` listet als Pflicht-Asset ausschließlich `./dnd-tracker-optimized.html`;
  der Offline-Fallback greift auf dieselbe Datei (`sw.js:99-101`). Der Entwicklungs-Build heißt
  `dnd-tracker-bundled.html` (im `dist/`-Verzeichnis dieser Sitzung vorhanden, 3.050.267 Bytes
  gegenüber 2.662.752 Bytes für die optimierte Variante).
- **Fehlerszenario:** Wer den Dev-Build über HTTP ausliefert und den SW aktiv hat, erhält offline
  die *Produktions*-Version statt der gerade getesteten. Bewusster Tradeoff für die
  Single-File-Auslieferung, aber eine Debugging-Falle.
- **Schwere:** **Niedrig.**

### Testartefakte im `dist/`-Verzeichnis

- **Was:** `dist/_smoke_fraktionen.png`, `_smoke_kalender.png`, `_smoke_reise.png`,
  `_smoke_sessionprep.png` (Zeitstempel 15. Juni) liegen neben den Build-Artefakten.
- **Schwere:** **Niedrig.** Aufräumarbeit; `git log -- dist` liefert keine Commits, das
  Verzeichnis ist offenbar ignoriert.

---

*Concerns audit: 2026-07-26*
