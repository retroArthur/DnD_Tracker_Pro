# Phase 12: Datensicherheit - Research

**Researched:** 2026-08-06
**Domain:** Client-side Datenpersistenz (localStorage/IndexedDB), Export/Import-Formate, Undo-System, non-ESM Browser-App
**Confidence:** HIGH (alle Kern-Fundstellen in diesem Lauf per `Read` verifiziert; die drei offenen Fragen sind empirisch bzw. am Live-Code beantwortet, keine Web-Recherche zu Fremdbibliotheken nötig — dieses Projekt hat *keine* Runtime-Dependencies für diese Phase)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: Audio geht in eine zweite Export-Datei.** Der Umzugs-Export bleibt strukturell wie heute —
ein JSON per `JSON.stringify(exportObj, null, 2)`, Anchor-Download (`systems/migration/full-export.js:84-99`).
Die IndexedDB-Inhalte kommen in eine **separate** Datei (Base64-JSON), nicht in den Hauptexport.
`FULL_EXPORT_SCHEMA` (`full-export.js:9-18`) bleibt für die localStorage-Felder zuständig; die IDB-Stores
`audioBlobs` (`features/soundboard/soundboard-idb.js`) und `diceStats` (`features/dice-stats/dice-stats-idb.js`)
bekommen einen eigenen Export-Pfad mit eigenem Schema und eigener Versionskennung. Kein ZIP (Runtime-Dependency verboten).

**D-02: Fehlendes Audio blockiert den Import nicht.** Der Hauptimport läuft auch ohne die Audio-Datei
durch. Fehlt sie oder passt sie nicht zum Hauptexport, wird das **benannt** — inklusive der Angabe,
welche Szenen betroffen sind.

**D-03: Ein Backup-Lauf sichert alle Kampagnen.** `_doBackup()` iteriert künftig über alle Kampagnen
des Index, nicht nur die aktive. Auch Tages-Snapshots und `pruneOldSnapshots()` gelten je Kampagne.
`FILE_BACKUP_MAX_SNAPSHOTS` (10) bleibt **pro Kampagne**, nicht global.

**D-04: Kampagnen-Key nur bei echter Namenskollision anhängen.** `getBackupFilenames()`
(`file-backup-manager.js:45-62`) normalisiert unterschiedliche Namen auf denselben `safeName`; rein
nicht-lateinische Namen kollabieren auf den Leerstring. Kollidiert ein `safeName` mit dem einer
anderen Kampagne, wird der Kampagnen-Key angehängt — sonst nicht. Der Leerstring-Fall bekommt
**immer** den Key (kollidiert per Definition mit jedem anderen leeren).

**D-05: Der `autosave-toggle`-Codepfad wird entfernt.** Alle drei Fundstellen
(`systems/spellslots/persistence.js:38`, `:192`, `systems/avatars.js:173`) entfernen, nicht nur eine.
Kein Ersatzmechanismus.

**D-06: Undo repariert Reihenfolge UND validiert beim Push.** `undo.js:39-41` (und `redo()` bei
`:72-74`) poppen vom Stack, bevor `safeJSONParse` geprüft wird. Künftig wird erst geparst und nur bei
Erfolg gepoppt. Zusätzlich prüft `saveUndoState()` beim Push, dass der Snapshot serialisierbar ist.

**D-07: `isFreshInstall()` berücksichtigt Override und IDB-Modus.** `migration-wizard.js:31-36` prüft
nur `APP_CONFIG.STORAGE_KEY` und ignoriert `window.STORAGE_KEY_OVERRIDE` sowie den IDB-only-
Löschpfad (denselben Codepfad, der DEBT-17 verursacht hat). Die Prüfung muss dieselben Quellen
konsultieren wie `readCampaignDataForBackup()`.

**D-08: Der Testumfang deckt den Audio-Rundlauf mit ab.** `SAFE-06` nennt drei Randfälle (>5-MB-
IDB-only-Save mit Reload, localStorage-Quota-Fallback, Export/Import-Versions-Rundlauf). Dazu kommt
ein vierter: Audio exportieren → importieren → Szene spielt den Track.

### Claude's Discretion

Keine explizit als "Claude's Discretion" markierten Bereiche in `12-CONTEXT.md` — alle acht
Entscheidungen sind fest verdrahtet. Implementierungsdetails, die CONTEXT.md offen lässt (z. B. die
genaue Fehlerbehandlung bei `pushUndo()`-Serialisierungsfehlern, das Pairing/Matching-Verfahren
zwischen Haupt- und Audio-Export-Datei, die exakte Wizard-Dropzone-UX für zwei Dateien), werden in
dieser Recherche als konkrete Empfehlungen markiert und im `## Assumptions Log` als zu bestätigende
Annahmen (A2, A3, Open Questions 1-2) aufgeführt — nicht als stillschweigend getroffene Entscheidungen.

### Deferred Ideas (OUT OF SCOPE)

- **Audio-Auswahl beim Export** (Checkbox „Audio einschließen"): verworfen zugunsten der
  Zwei-Datei-Lösung.
- **Einheitliches Backup-Namensschema mit Key für alle Kampagnen:** verworfen (D-04), bei künftigem
  Backup-Format-Wechsel neu bewerten.
- **`autosave-toggle` als echtes Feature:** verworfen (D-05), gehört in einen Feature-Milestone.
- **Systematische Suche nach weiteren Stellen der DEBT-17-Bauart:** eigenes Vorhaben, in
  `REQUIREMENTS.md` §Out of Scope vermerkt.
- Neue Spielleiter-Funktionen, Performance-Arbeit (Phase 13), Modul-Aufteilung (Phase 13),
  Test-Gates (Phase 14) — alles nicht Teil dieser Phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| SAFE-01 | Umzugs-Export erfasst IndexedDB-Inhalte (`audioBlobs`, `diceStats`) über eine zweite Export-Datei | Pattern 1 ("Zweite Export-Datei für IDB-Inhalte"), Base64-Praxisgrenze-Messung, diceStats-Volumen-Analyse, Code Examples (Blob↔Base64) |
| SAFE-02 | Datei-Backup deckt alle Kampagnen ab, kann sich nicht gegenseitig überschreiben | Pattern 2 ("Multi-Kampagnen-Backup mit Kollisions-Suffix"), Kampagnen-Index-Verlässlichkeit-Abschnitt |
| SAFE-03 | Löschen einer Audiodatei ist rückgängig zu machen | Pattern 3 ("Undo vor destruktiver Audio-Mutation"), inkl. dokumentierter Grenze (IDB-Blob selbst nicht undo-fähig) |
| SAFE-04 | Umzugs-Wizard erkennt Nutzer mit vollen Daten zuverlässig (Override + IDB-Modus) | Pattern 4 ("`isFreshInstall()` mit denselben Quellen wie `readCampaignDataForBackup()`"), Pitfall 1 (Async-Kaskade) |
| SAFE-05 | Persistenz verhält sich bei Fehlern/Sonderfällen vorhersagbar (Undo-Pop-Reihenfolge, `autosave-toggle` entfernt) | Pattern 5 ("Undo/Redo — Parse vor Pop, Push-Validierung"), Pitfall 2 |
| SAFE-06 | Persistenz-Randfälle sind getestet (>5-MB-IDB-Reload, Quota-Fallback, Export/Import-Rundlauf, Audio-Rundlauf) | `## Validation Architecture` — vollständige Requirement→Test-Map inkl. Wave-0-Gaps |
</phase_requirements>

## Summary

Phase 12 behebt sechs eng zusammenhängende Datenverlust-Risiken, die alle denselben Grundfehler
teilen: ein Subsystem nimmt stillschweigend an, dass eine Datenquelle vollständig, aktuell oder
serialisierbar ist, ohne das zu prüfen. Der Umzugs-Export vergisst zwei IndexedDB-Stores komplett
(`SAFE-01`). Das Datei-Backup sichert nur eine von potenziell mehreren Kampagnen und kann Namen
kollidieren lassen (`SAFE-02`). Eine Audio-Löschung mutiert Daten ohne Undo-Schutz (`SAFE-03`). Der
Migrations-Wizard erkennt "volle" Installationen nicht zuverlässig (`SAFE-04`). Undo/Redo poppen vom
Stack, bevor sie geprüft haben, ob der Eintrag überhaupt brauchbar ist, und ein totes UI-Element kann
kritische Saves abschalten (`SAFE-05`). Und die Randfälle, die genau diese Fehlerklasse bisher
verdeckt haben, sind ungetestet (`SAFE-06`).

Alle acht Entscheidungen aus `12-CONTEXT.md` (D-01…D-08) sind bereits getroffen; diese Recherche
liefert für jede das konkrete Wie: welche Funktion geändert wird, welches bestehende Muster im
Code als Vorlage dient, und wie es getestet wird. Für die drei offenen Fragen liefert dieser Bericht
belastbare, gemessene bzw. am Code verifizierte Antworten (siehe Abschnitte "Base64-Praxisgrenze",
"Kampagnen-Index-Verlässlichkeit", "diceStats-Volumen" unten).

**Primary recommendation:** Jede der sechs Reparaturen folgt einem bereits im Code etablierten
Muster (Export-Schema-Erweiterung wie `full-export.js`, Multi-Kampagnen-Iteration wie
`buildFullExport()`, Undo-vor-Mutation wie überall sonst im Projekt, Peek-vor-Pop wie es die
CONTEXT.md-Entscheidung fordert) — es muss kein neues Architekturmuster eingeführt werden, nur
bestehende konsequent auf die noch nicht erfassten Stellen angewendet werden.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Umzugs-Export (SAFE-01) | Browser / Client (kein Server) | Storage (IndexedDB-Lesen) | Reiner Client-Code; `full-export.js` und die neue Audio-Export-Datei laufen beide im Browser, kein Backend existiert |
| Datei-Backup (SAFE-02) | Browser / Client | Storage (File System Access API) | `file-backup-manager.js` schreibt direkt ins Dateisystem über einen Browser-API-Handle, kein Server-Roundtrip |
| Audio-Löschung + Undo (SAFE-03) | Browser / Client | Storage (IndexedDB) | Undo-Stack lebt nur im Speicher (`systems/undo.js`); IDB-Löschung ist irreversibel außerhalb des Undo-Systems |
| Migrations-Erkennung (SAFE-04) | Browser / Client | Storage (localStorage + IndexedDB) | `isFreshInstall()` liest ausschließlich clientseitige Storage-APIs |
| Undo/Redo + Autosave-Schalter (SAFE-05) | Browser / Client | — | Reine In-Memory-Logik (`systems/undo.js`) plus toter DOM-Query (`persistence.js`, `avatars.js`) |
| Testabdeckung Randfälle (SAFE-06) | Test-Tier (Jest/Playwright) | Browser / Client (Testgegenstand) | Testcode läuft in Node (Jest, `vm`/`eval`-Muster) bzw. echtem Browser (Playwright) |

Es gibt in diesem Projekt keine Frontend-Server- oder API-Schicht — die gesamte App ist eine einzige
gebündelte HTML-Datei ohne Backend. Alle sechs Requirements bleiben vollständig im Client-Tier.

## Standard Stack

### Core

Kein neues Paket. Die App ist non-ESM und lädt `<script>`-Tags über `loader.js`; jede Lösung nutzt
ausschließlich bereits vorhandene Browser-APIs:

| API | Zweck | Bereits genutzt in |
|-----|-------|---------------------|
| `Blob` + `URL.createObjectURL` + Anchor-Download | Datei-Download ohne Server | `full-export.js:84-95` |
| `FileReader.readAsText` | Datei-Import (Drag&Drop/Input) | `migration-wizard.js:240-316` |
| `IndexedDB` (`window.idb`, `initIndexedDB()`) | Blob-/Statistik-Speicher | `core/init.js:301-353`, `soundboard-idb.js`, `dice-stats-idb.js` |
| `Buffer`/`btoa`/`FileReader.readAsDataURL` (Blob→Base64) | Audio-Export als JSON-kompatible Zeichenkette | neu für SAFE-01, siehe Pattern unten |
| `JSON.stringify`/`JSON.parse` | Export-/Import-Serialisierung | überall im Projekt |

### Supporting

| Mechanismus | Zweck | Wann verwenden |
|-------------|-------|-----------------|
| `registerPostSaveHook()` (`persistence.js:14-18`) | An jeden erfolgreichen Save andocken | Für SAFE-02 **nicht** neu nötig — `file-backup-manager.js` ist bereits darüber verdrahtet; nur `_doBackup()` selbst ändert sich (Multi-Kampagne) |
| `saveUndoState()` (`systems/undo.js:21-23`) | Undo-Snapshot vor destruktiver Mutation | Fehlt aktuell in `removeAudioFile()` (SAFE-03) |
| `safeJSONParse()` (`render/helpers.js:362-372`) | Fehlertolerantes Parsen | Bereits in `undo()`/`redo()` verwendet, nur falsch angeordnet (SAFE-05) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Base64-JSON für Audio-Export (D-01, gesetzt) | ZIP-Archiv (z. B. via `JSZip`) | Ausdrücklich verworfen — neues Runtime-Dependency verboten (`CLAUDE.md`, `12-CONTEXT.md` D-01) |
| Base64-JSON für Audio-Export | `File System Access API` direkter Ordner-Export (mehrere Einzeldateien) | Würde einen Ordner-Picker erfordern (User-Geste, nicht in allen Browsern) — Base64-JSON passt zum bestehenden Single-File-Download-Muster und läuft überall, wo `full-export.js` bereits läuft |
| Kampagnen-Key immer im Backup-Dateinamen (verworfen, D-04) | Kollisionsbasiertes Anhängen (gesetzt) | Immer anhängen bricht bestehende Snapshot-Historien; kollisionsbasiert erhält sie |

**Installation:** Kein `npm install` nötig — reine Browser-API-Nutzung, keine neuen `package.json`-Einträge.

**Package Legitimacy Audit:** Entfällt — diese Phase installiert keine externen Pakete
(`package.json` bleibt unverändert; Bestätigung: `npm view` wurde nicht ausgeführt, da keine neuen
Paketnamen zu prüfen sind).

## Architecture Patterns

### System Architecture Diagram

```
                         ┌─────────────────────────────┐
                         │   Nutzer-Aktion (Klick)      │
                         └──────────────┬───────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         │                              │                              │
         ▼                              ▼                              ▼
 [Umzugs-Export]                [Datei-Backup]                [Audio löschen]
 startMigrationFlow()           onAfterSave() (Hook)           removeAudioFile()
         │                              │                              │
         ▼                              ▼                              ▼
 downloadFullExport()           _doBackup(dirHandle)            saveUndoState() NEU
 downloadAudioExport() NEU      ├─ getCampaignIndex()           deleteSoundBlob(id)
         │                      ├─ FOR EACH Kampagne NEU        D.soundboard.scenes
         ▼                      │  ├─ readCampaignDataForBackup  filter(blobId≠id)
 buildFullExport()              │  ├─ getBackupFilenames         save()
 ├─ StorageAPI.getJSON je Key   │  │  (+Kollisions-Suffix NEU)
 ├─ campaigns{}, settings,      │  └─ writeBackupForCampaign
 │  diceFavorites,               │     ├─ -aktuell.json (atomar)
 │  dmScreenProfiles,            │     └─ Tages-Snapshot + prune
 │  campaignIndex                │        (JETZT je Kampagne NEU)
 │                               ▼
 ▼                       Dateisystem (File System
 buildAudioExport() NEU  Access API Handle)
 ├─ listSoundBlobs()
 ├─ getSoundBlob(id) je Eintrag
 ├─ Blob → Base64 (FileReader)
 ├─ getAllStats() (diceStats)
 └─ JSON.stringify → Blob → Anchor-Download

         │
         ▼
 [Zwei Dateien heruntergeladen: Haupt-Export + Audio-Export]
         │
         ▼
 ┌─────────────────────────────────────────────────────────┐
 │  PWA-Erststart-Wizard (migration-wizard.js)               │
 │  Dropzone erweitert: 1-2 Dateien akzeptieren NEU           │
 │  ├─ Haupt-Datei (Pflicht) → importFullExport()             │
 │  └─ Audio-Datei (optional) → importAudioExport() NEU        │
 │       fehlt/passt nicht → benannt, blockiert NICHT (D-02)   │
 └─────────────────────────────────────────────────────────┘
         │
         ▼
 isFreshInstall() NEU: prüft STORAGE_KEY_OVERRIDE + IDB-Modus
 (dieselben Quellen wie readCampaignDataForBackup(), SAFE-04)
```

### Recommended Project Structure

Keine neuen Ordner. Ein neues Modul für den Audio-Export/-Import passt konzeptionell neben
`full-export.js`:

```
systems/migration/
├── full-export.js          # unverändert im Kern (FULL_EXPORT_SCHEMA bleibt 5 Felder)
├── audio-export.js         # NEU (SAFE-01): buildAudioExport, downloadAudioExport, importAudioExport
└── migration-wizard.js     # erweitert: Dropzone akzeptiert 2. optionale Datei (D-02)
```

**Ladereihenfolge (`loader.js`):** `audio-export.js` muss nach `full-export.js` und **nach**
`features/soundboard/soundboard-idb.js` (`getSoundBlob`, `listSoundBlobs`) sowie
`features/dice-stats/dice-stats-idb.js` (`getAllStats`) geladen werden — praktisch reicht aber die
Platzierung direkt neben `migration-wizard.js` (Zeile 51-52 in `loader.js`), weil alle Aufrufe
laufzeitgebunden über `window.*`/`typeof`-Guards erfolgen (Projektkonvention, siehe
`downloadFullExport()`-Analogie), nicht modul-ladezeit-gebunden. **Empfehlung:** trotzdem hinter
`soundboard-idb.js`/`dice-stats-idb.js` (Zeile ~129) einsortieren, um jede Unklarheit zu vermeiden
und dem CLAUDE.md-Grundsatz "Insert new JS modules in dependency order" zu folgen.

### Pattern 1: Zweite Export-Datei für IDB-Inhalte (SAFE-01, D-01/D-02)

**What:** `buildFullExport()`/`downloadFullExport()` bleiben strukturell unverändert
(`FULL_EXPORT_SCHEMA` bleibt bei den 5 Feldern `campaigns`, `settings`, `diceFavorites`,
`dmScreenProfiles`, `campaignIndex` — verifiziert `full-export.js:9-18`). Eine **neue**, parallele
Funktion baut eine zweite Datei mit eigenem `_exportType`.

**When to use:** Immer wenn `startMigrationFlow()` ausgelöst wird (`migration-wizard.js:441-477`) —
nach dem bestehenden `downloadFullExport()`-Aufruf zusätzlich `downloadAudioExport()` aufrufen.

**Warum Base64 und nicht rohe Blobs im JSON:** `JSON.stringify` kann keine Binärdaten serialisieren;
Base64 ist der einzige Weg, Blob-Bytes in eine JSON-kompatible Datei zu bringen, ohne ein
Binärformat/ZIP einzuführen (von D-01 explizit ausgeschlossen).

**Example (Aufbau, analog zu `buildFullExport()`):**
```javascript
// Source: eigenes Muster, analog full-export.js:39-79 (Read verifiziert)
const AUDIO_EXPORT_SCHEMA = {
    _exportType: 'audio-export-v1',
    fields: {
        audioFiles: { type: 'array', required: true },   // [{ id, name, type, size, data(base64) }]
        diceStats: { type: 'array', required: false, default: [] }
    }
};

async function buildAudioExport() {
    const metas = await window.listSoundBlobs(); // {id,name,size,type,savedAt}[] — KEINE Bytes (soundboard-idb.js:88-112)
    const audioFiles = [];
    for (const meta of metas) {
        const blob = await window.getSoundBlob(meta.id);
        if (!blob) continue; // defensiv: Meta ohne Blob überspringen, nicht abbrechen
        const base64 = await blobToBase64(blob); // FileReader.readAsDataURL, Data-URL-Prefix abtrennen
        audioFiles.push({ id: meta.id, name: meta.name, type: meta.type, size: meta.size, data: base64 });
    }
    const diceStats = typeof window.getAllStats === 'function' ? await window.getAllStats() : [];
    return {
        _exportType: 'audio-export-v1',
        _appVersion: APP_CONFIG.VERSION,
        _exportDate: new Date().toISOString(),
        audioFiles,
        diceStats
    };
}
```

**Größenprüfung VOR dem Bauen (Degradationsstrategie, siehe "Base64-Praxisgrenze" unten):** Summe der
`meta.size`-Werte aus `listSoundBlobs()` berechnen, BEVOR ein einziger Blob geladen wird — das ist
billig (nur Metadaten). Überschreitet die Summe einen konservativen Schwellwert (empfohlen:
**300 MiB roh**, siehe Messung), NICHT versuchen, `JSON.stringify` aufzurufen (das würde bei ~384 MiB
mit `RangeError: Invalid string length` hart abstürzen und den kompletten Audio-Export unbrauchbar
machen). Stattdessen: Toast mit genauer Diagnose ("Audio-Bibliothek zu groß für Export: X MB von Y
Dateien — Export übersprungen, betroffen: [Namen]"), Haupt-Export läuft trotzdem unbeeinträchtigt
weiter (D-02-Prinzip: fehlendes Audio blockiert nicht).

**Import-Matching ohne Pairing-ID (Empfehlung, nicht in CONTEXT.md fixiert):** Statt eine
Kopplungs-ID zwischen Haupt- und Audio-Datei zu verlangen, empfiehlt diese Recherche ein einfacheres,
robusteres Verfahren: Nach dem Haupt-Import bekannte `blobId`s aus allen importierten
`scene.tracks[].blobId` sammeln; nach optionalem Audio-Import prüfen, welche dieser IDs **nicht**
unter den importierten (oder bereits vorhandenen) `audioBlobs` auftauchen; diese Differenz benannt
melden (Szenenname + fehlende Datei) statt zu blockieren. Das erfüllt D-02 wörtlich ("benannt,
inklusive der Angabe, welche Szenen betroffen sind") ohne zusätzliche Versions-/Pairing-Logik.

### Pattern 2: Multi-Kampagnen-Backup mit Kollisions-Suffix (SAFE-02, D-03/D-04)

**What:** `_doBackup()` iteriert künftig über **alle** Kampagnen aus `getCampaignIndex()` plus die
Standard-Kampagne (exaktes Muster bereits vorhanden in `buildFullExport()`,
`full-export.js:44-64`) statt nur den einen `campaignKey` aus
`window.STORAGE_KEY_OVERRIDE || APP_CONFIG.STORAGE_KEY` zu verwenden
(`file-backup-manager.js:309-311`, aktuell).

**Kollisionserkennung (D-04) — konkreter Algorithmus:**
1. Für jede Kampagne (Index + Standard) `safeName` via bestehender `getBackupFilenames()`-Logik
   berechnen (`file-backup-manager.js:45-62`, verifiziert — Whitelist `[a-z0-9-]`, Umlaute
   transliteriert, alles andere zu `-`, kollabiert nicht-lateinische Namen auf Leerstring: Zeile
   51 `.replace(/[^a-z0-9-]/gi, '-')`).
2. Eine `Map<safeName, campaignKey[]>` aufbauen.
3. Für jede Kampagne: **nur wenn** `map.get(safeName).length > 1` **oder** `safeName === ''`
   (Leerstring kollidiert per Definition immer, D-04 explizit), den `campaignKey` (bereinigt, z. B.
   `dnd-campaign-<epoch>` → nur die Ziffern, `dnd-tracker-v4` → `standard`) an den Dateinamen
   anhängen.
4. Ergebnis: Bestehende Ein-Kampagnen-Setups (der ganz überwiegende Fall) sehen **keine**
   Namensänderung — Snapshot-Historie bleibt nahtlos (Anforderung aus D-04).

```javascript
// Source: eigenes Muster, baut auf file-backup-manager.js:45-62 (Read verifiziert)
function resolveBackupTargets(campaignIndex, storageKey) {
    const all = [{ key: storageKey, name: 'Standard-Kampagne' }, ...(campaignIndex?.campaigns || [])];
    const bySafeName = new Map();
    const withSafeName = all.map(c => {
        const { safeName } = getBackupFilenames(c.key, c.name);
        if (!bySafeName.has(safeName)) bySafeName.set(safeName, []);
        bySafeName.get(safeName).push(c.key);
        return { ...c, safeName };
    });
    return withSafeName.map(c => {
        const collides = bySafeName.get(c.safeName).length > 1 || c.safeName === '';
        const suffix = collides ? '-' + sanitizeKeySuffix(c.key) : '';
        return { ...c, filenames: getBackupFilenames(c.key, c.name + suffix) };
        // ODER: getBackupFilenames() um optionalen dritten Parameter erweitern, der den
        // bereits berechneten safeName + Suffix direkt injiziert, statt den Namen zu verändern —
        // Implementierungsdetail für den Planer, beide Ansätze sind mit D-04 vereinbar.
    });
}
```

**FILE_BACKUP_MAX_SNAPSHOTS bleibt pro Kampagne (D-03):** `pruneOldSnapshots()` nimmt bereits
`safeName` als Parameter (`file-backup-manager.js:152-173`, `getSnapshotRegex()` verankert den Namen
— CR-05-Schutz gegen Präfix-Kollisionen ist bereits vorhanden und wird durch die Multi-Kampagnen-
Iteration **nicht** berührt, da jede Kampagne weiterhin ihren eigenen `pruneOldSnapshots()`-Aufruf
mit ihrem eigenen `safeName` bekommt (ein Aufruf pro Kampagne pro `writeBackupForCampaign()`).

**Fehlerbehandlung bei Multi-Kampagne:** `readCampaignDataForBackup()` liefert bereits `null` bei
fehlenden Daten (verifiziert `file-backup-manager.js:275-304`, DEBT-17-Schutz bleibt). Bei
Iteration über mehrere Kampagnen darf ein `null`-Ergebnis für Kampagne B NICHT das Backup von
Kampagne A verhindern — `_doBackup()` muss pro Kampagne einzeln try/catch-en (analog zum
bestehenden äußeren try/catch, aber jetzt innerhalb der Schleife) und nur die betroffene Kampagne
überspringen, nicht den gesamten Lauf abbrechen. Der bestehende "einmaliger Toast pro Sitzung"-Guard
(`_fileBackupPausedNotified`, D-16) bleibt für den Gesamtstatus; einzelne übersprungene Kampagnen
sollten ins Event-Log (DEBUG_MODE), nicht als Toast-Spam.

### Pattern 3: Undo vor destruktiver Audio-Mutation (SAFE-03)

**What:** `removeAudioFile()` (`soundboard-crud.js:69-103`, verifiziert — **kein**
`saveUndoState()`-Aufruf vorhanden) mutiert `D.soundboard.scenes` (Zeile 80-88) und ruft `save()`
(Zeile 92) ohne vorherigen Undo-Push. Fix: `saveUndoState('Audio entfernt')` als **erste** Zeile der
Funktion, vor `await window.deleteSoundBlob(id)`.

```javascript
// Fix-Pattern, analog zu jeder anderen destruktiven CRUD-Funktion im Projekt
// (CLAUDE.md: "ALWAYS call saveUndoState() before delete/edit operations")
async function removeAudioFile(id) {
    if (!id) return;
    if (typeof window.saveUndoState === 'function') window.saveUndoState('Audio entfernt'); // NEU

    try {
        await window.deleteSoundBlob(id);
        // ... Rest unverändert (Zeile 75-99 aus soundboard-crud.js)
```

**Wichtige Grenze, die dem Planer explizit mitgegeben werden muss:** Ein `saveUndoState()`-Push
sichert nur `window.D` (JSON-Snapshot, `undo.js:9-14`) — **nicht** den IDB-`audioBlobs`-Store. Nach
einem Undo ist die `blobId`-Referenz in `scene.tracks` wiederhergestellt, aber der Blob selbst bleibt
in IndexedDB gelöscht (IDB-Löschungen sind nicht Teil des Undo-Systems). Das ist eine echte
architektonische Grenze, kein Implementierungsfehler — die pragmatische Lösung folgt demselben
Prinzip wie D-02: Wenn eine Szene nach Undo auf eine fehlende `blobId` verweist, soll die
Wiedergabe-Logik das erkennen und (wie bei fehlendem Import-Audio) benannt anzeigen statt
stillschweigend zu scheitern — **kein** stiller Fehler, aber auch kein Blockieren. Dies dem Planer
als Folgeaufgabe für die Wiedergabe-Pfad-Prüfung (`soundboard-player.js`) mitgeben.

### Pattern 4: `isFreshInstall()` mit denselben Quellen wie `readCampaignDataForBackup()` (SAFE-04)

**What:** `isFreshInstall()` (`migration-wizard.js:31-36`, verifiziert) prüft ausschließlich
`StorageAPI.getJSON(APP_CONFIG.STORAGE_KEY, null)` — ignoriert `window.STORAGE_KEY_OVERRIDE`
(Kampagnenwechsel) und den IDB-only-Zustand (`persistence.js:64-68`/`:219-220` löscht den
localStorage-Key nach bestätigtem IDB-Write bei >5 MB).

**Fix:** `isFreshInstall()` konsultiert **dieselbe Quellenkette** wie
`readCampaignDataForBackup()` (`file-backup-manager.js:275-304`, bereits verifiziert und als
Referenzimplementierung wiederverwendbar): localStorage → IndexedDB (`loadFromIndexedDBFallbackRaw`)
→ laufendes `D`. Der Schlüssel muss `window.STORAGE_KEY_OVERRIDE || APP_CONFIG.STORAGE_KEY` sein,
nicht hartkodiert `APP_CONFIG.STORAGE_KEY`.

```javascript
// Fix-Pattern — wiederverwendet dieselbe Quellenkette wie readCampaignDataForBackup()
// (file-backup-manager.js:275-304, Read verifiziert)
async function isFreshInstall() {
    const key = window.STORAGE_KEY_OVERRIDE || APP_CONFIG.STORAGE_KEY;
    const data = typeof window.readCampaignDataForBackup === 'function'
        ? await window.readCampaignDataForBackup(key)
        : StorageAPI.getJSON(key, null); // Fallback falls Modul nicht geladen
    if (!data) return true;
    const hasContent = (data.characters?.length || 0) + (data.npcs?.length || 0) + (data.quests?.length || 0);
    return hasContent === 0;
}
```

**Wichtiger Breaking Change:** `isFreshInstall()` ist aktuell **synchron** und wird synchron
aufgerufen (`migration-wizard.js:256,533` sowie `_processWizardFile` Zeile 256). Wird sie `async`
(nötig, da `readCampaignDataForBackup()` `async` ist wegen des IDB-Lesepfads), müssen **alle**
Aufrufer auf `await`/Promise-Handling umgestellt werden. Betroffene Stellen (per Grep in dieser
Recherche identifiziert, vom Planer gegenzuprüfen): `migration-wizard.js:256` (Bestandsschutz-Check
im Datei-Import) und `migration-wizard.js:533` (`initMigrationWizardIfNeeded`). Alternative ohne
Async-Kaskade: eine synchrone Schnellprüfung (localStorage + `window.STORAGE_KEY_OVERRIDE`) plus
eine zusätzliche, separate IDB-Prüfung nur dort, wo die Fehlklassifikation real gefährlich ist
(Wizard-Anzeige-Entscheidung `initMigrationWizardIfNeeded`) — der Planer sollte beide Varianten
gegen die zwei Aufrufer abwägen, da eine App-weite Sync→Async-Umstellung Umfang und Risiko der Plans
deutlich erhöht.

### Pattern 5: Undo/Redo — Parse vor Pop, Push-Validierung (SAFE-05, D-05/D-06)

**What (Undo):** `undo.js:39-41` (verifiziert):
```
39  const last = undoStack.pop();
40  const safeJSONParse = window.safeJSONParse;
41  const parsed = safeJSONParse(last.state);
```
`redo()` hat dasselbe Muster bei `:72-74` (verifiziert):
```
72  const last = redoStack.pop();
73  const safeJSONParse = window.safeJSONParse;
74  const parsed = safeJSONParse(last.state);
```

**Fix-Pattern (peek statt pop, erst bei Erfolg tatsächlich entfernen):**
```javascript
// Fix für undo() — redo() analog mit redoStack/undoStack vertauscht
function undo() {
    if (undoStack.length === 0) { showToast('↩️ Nichts zum Rückgängigmachen'); return; }
    const D = window.D;
    const last = undoStack[undoStack.length - 1]; // PEEK, nicht pop (D-06)
    const safeJSONParse = window.safeJSONParse;
    const parsed = safeJSONParse(last.state);
    if (!parsed) {
        showToast('❌ Undo fehlgeschlagen', 'error');
        return; // Eintrag bleibt auf dem Stack — kein Datenverlust, aber ggf. "stuck"
                // (siehe Pitfall unten: bewusste Design-Entscheidung, konsistent mit D-06-Wortlaut)
    }
    undoStack.pop(); // ERST JETZT entfernen — Parse war erfolgreich
    redoStack.push({ action: 'Redo', state: JSON.stringify(D), timestamp: Date.now() });
    if (redoStack.length > UNDO_LIMIT) redoStack.shift();
    // ... Rest unverändert (Zeile 43-58: D-Reset, validateAndRepairNextId, renderAll, saveImmediate)
}
```

**What (Push-Validierung, D-06 zweiter Teil):** `pushUndo()` (`undo.js:9-20`) serialisiert
`window.D` direkt in der Objekt-Literal (`state: JSON.stringify(window.D)`, Zeile 12) — ein Wurf hier
(z. B. durch zirkuläre Referenz oder nicht-serialisierbaren Wert, der versehentlich in `D` landet)
bricht unkontrolliert in die aufrufende destruktive Operation hinein, da `saveUndoState()` immer
**vor** der eigentlichen Mutation aufgerufen wird.

```javascript
// Fix-Pattern für pushUndo() — Serialisierbarkeit VOR dem Push prüfen
function pushUndo(action) {
    let state;
    try {
        state = JSON.stringify(window.D);
    } catch (e) {
        if (window.APP_CONFIG?.DEBUG_MODE) window.ErrorHandler?.log('pushUndo', e, 'Snapshot nicht serialisierbar');
        showToast('⚠️ Undo-Snapshot fehlgeschlagen — Aktion wird ohne Rückgängig-Schutz ausgeführt', 'warning');
        return; // Kein kaputter Eintrag landet auf dem Stack; Aufrufer läuft weiter (kein Blockieren)
    }
    undoStack.push({ action, state, timestamp: Date.now() });
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    redoStack.length = 0;
}
```
Diese konkrete Fehlerbehandlung (Toast statt Abbruch der Operation) ist eine Empfehlung dieser
Recherche, **nicht** wörtlich in `12-CONTEXT.md` fixiert — sie folgt dem Projektgrundsatz
"nie blockieren, am Spieltisch" (Umzugs-Import D-02 folgt demselben Prinzip). Der Planer sollte dies
als zu bestätigende Design-Entscheidung markieren, falls er striktere Semantik will (z. B. Operation
abbrechen statt ungeschützt fortsetzen).

**What (autosave-toggle entfernen, D-05):** Exakt drei Fundstellen, alle in dieser Recherche
per `Read` verifiziert:
1. `systems/spellslots/persistence.js:38` (in `saveImmediate()`):
   `const autosaveToggle = document.getElementById('autosave-toggle'); if (autosaveToggle && !autosaveToggle.checked) return;`
2. `systems/spellslots/persistence.js:192` (in `save()`, identisches Muster mit `getElementById`)
3. `systems/avatars.js:173` (in `initOfflineMode()`'s `beforeunload`-Handler, Variable heißt dort
   `autoSaveToggle` — Großschreibung beachten beim Grep/Entfernen)

Fix: alle drei `if (autosaveToggle...) return;`-Blöcke sowie die zugehörige
`document.getElementById('autosave-toggle')`-Zeile ersatzlos entfernen. Kein Ersatzmechanismus (D-05:
"statt einen Schalter einzuführen, der eine neue Fehlerquelle wäre").

### Anti-Patterns to Avoid

- **`window.save`-Monkey-Patch:** CLAUDE.md verbietet dies explizit (bare `save()`-Aufrufe binden an
  die globale `const`-Deklaration und umgehen jeden `window.save`-Wrapper dauerhaft — UAT-Vorfall
  bereits dokumentiert). Für SAFE-01/02 nicht relevant (kein neuer Save-Hook nötig), aber falls der
  Planer versucht ist, den Audio-Export an einen Save-Hook zu koppeln: nicht tun, Audio-Export ist
  ein expliziter User-Trigger (`startMigrationFlow()`), kein Auto-Hook.
- **`isFreshInstall()` synchron lassen und IDB-Prüfung "best effort" weglassen:** Würde SAFE-04 nur
  scheinbar lösen (der `STORAGE_KEY_OVERRIDE`-Teil ist trivial synchron nachrüstbar, der IDB-Teil
  nicht) — beide Lücken sind in der Anforderung explizit benannt, keine halbe Lösung.
- **`_doBackup()` bei einem Kampagnen-Fehler den GESAMTEN Lauf abbrechen:** Ein `throw` in der
  Schleifenmitte (statt try/catch PRO Kampagne) würde SAFE-02 wieder kaputt machen — genau der Fehler,
  den DEBT-17 bereits einmal verursacht hat, nur jetzt auf Kampagnen- statt Storage-Ebene.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Blob → Base64 | Eigene Byte-zu-Zeichen-Schleife (`String.fromCharCode(...bytes)`) | `FileReader.readAsDataURL(blob)` (Data-URL-Prefix `data:...;base64,` abschneiden) ODER `Buffer`-Äquivalent ist in Browsern nicht verfügbar — `FileReader` ist der Standardweg | `String.fromCharCode.apply(null, largeByteArray)` wirft bei großen Arrays `RangeError: Maximum call stack size exceeded` (Argument-Stack-Limit, typischerweise ~65k-125k Elemente je nach Engine) — bei 20-100 MB Audiodateien garantiert ein Crash |
| ZIP/Multi-File-Bundling | Eigenes Container-Format | Zwei separate JSON-Dateien (D-01, gesetzt) | Kein Runtime-Dependency-Bedarf, passt zum bestehenden Single-File-Download-Muster |
| Base64-Größenlimit-Erkennung | Eigene Heuristik zur Laufzeit raten | Vorab-Summierung über `listSoundBlobs()`-Metadaten (billig, keine Blob-Bytes laden) gegen den in dieser Recherche gemessenen Schwellwert (~384 MiB hart, 300 MiB empfohlene Warngrenze) | `listSoundBlobs()` liefert bereits `size` pro Eintrag OHNE die Blob-Bytes zu laden (`soundboard-idb.js:88-112`) — die Summe ist quasi kostenlos zu berechnen, bevor irgendein teurer Base64-Encode beginnt |

**Key insight:** Für diese Phase gibt es keine "komplexe Bibliotheksaufgabe" zu delegieren — alle
sechs Fixes sind Anwendungen bestehender Projektmuster auf bisher nicht erfasste Stellen. Das
einzige neue technische Risiko (Base64-Größenlimit) wird durch Vorab-Prüfung, nicht durch eine
Bibliothek, entschärft.

## Runtime State Inventory

> Diese Phase ist kein Rename/Refactor — die Requirements ändern *Verhalten* (Datenverlust-Pfade),
> nicht Namen/Strukturen. Trotzdem relevant, da SAFE-02/SAFE-04 bestehende Storage-Zustände berühren:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Bestehende Datei-Backups im User-gewählten Ordner (`{safeName}-aktuell.json`, `{safeName}-YYYY-MM-DD.json`) | Keine Migration — D-04 garantiert, dass unveränderte Namen (keine Kollision) exakt gleich bleiben; nur bei echter Kollision ändert sich künftig EIN Kampagnen-Dateiname (Nutzer sieht dann zwei Dateisätze für dieselbe Kampagne, bis der alte manuell aufräumt — im Plan als bekannte Nebenwirkung dokumentieren) |
| Live service config | `window._fileBackupDirHandle` (IDB `fileHandles`-Store, `file-backup-permissions.js`) | Unverändert — Multi-Kampagnen-Iteration nutzt denselben Handle für alle Kampagnen |
| OS-registered state | Keine — reine Browser-App, kein OS-Task-Scheduler o. ä. beteiligt | — |
| Secrets/env vars | Keine | — |
| Build artifacts | Keine — `loader.js`/`build.py` betroffen nur durch neuen Modul-Eintrag (`audio-export.js`), kein stale Artefakt-Risiko | Modul in `loader.js`s `MODULES`-Array eintragen (CLAUDE.md-Pflicht) |

**Nichts gefunden in:** OS-registered state, Secrets/env vars — verifiziert durch Domänenkenntnis
(reine Client-Browser-App ohne OS-Integration, keine `.env`/Secrets-Nutzung im gesamten Projekt).

## Common Pitfalls

### Pitfall 1: `isFreshInstall()` async machen bricht synchrone Aufrufer still

**What goes wrong:** Wird `isFreshInstall()` `async`, geben bestehende synchrone `if
(!isFreshInstall())`-Checks (`migration-wizard.js:256,533`) ein `Promise`-Objekt zurück, das immer
truthy ist — die Bedingung kehrt sich faktisch um (jede Prüfung verhält sich wie "ist NICHT frisch").
**Why it happens:** JavaScript wertet `if (aPromiseObject)` immer als `true`, da ein Promise ein
truthy Objekt ist — kein Laufzeitfehler, nur falsches Verhalten.
**How to avoid:** JEDEN Aufrufer explizit auf `await`/`.then()` umstellen; die betroffene Funktion,
in der der Aufruf steht, muss ebenfalls `async` werden (Kaskade bis zum Event-Handler).
**Warning signs:** Migrations-Wizard erscheint bei jedem Start erneut (Fehlklassifikation als "nicht
frisch" wird zu "immer frisch" oder umgekehrt, je nach genauer Bug-Ausprägung) — im Test unbedingt
mit **echten** IDB-only-Daten UND mit `STORAGE_KEY_OVERRIDE` gesetzten Kampagnen prüfen, nicht nur
mit dem synchronen localStorage-Pfad.

### Pitfall 2: Undo-Fix ändert Verhalten bei bereits korrupten Alt-Snapshots

**What goes wrong:** Nach dem SAFE-05-Fix bleibt ein Eintrag, dessen `state` nicht mehr parsebar ist,
dauerhaft auf dem Stack liegen (Peek-statt-Pop) — jeder weitere `Strg+Z`-Versuch trifft erneut auf
denselben kaputten Eintrag und schlägt erneut fehl, bis `clearUndoHistory()` aufgerufen wird.
**Why it happens:** In der Praxis kann `JSON.stringify(window.D)` ein Ergebnis liefern, das später
nicht mehr `JSON.parse`-bar ist, praktisch nur bei zirkulären Referenzen (die bereits beim Push
scheitern würden, siehe D-06 Push-Validierung) oder bei absichtlich manipuliertem `undoStack`
(z. B. via DevTools) — unter normaler Nutzung sollte dieser Fall nach dem Push-Fix (Pattern 5) nie
mehr auftreten, ist aber als Verteidigungslinie gegen die zweite Fehlerquelle gedacht.
**How to avoid:** Da die Push-Validierung (D-06) bereits verhindert, dass unparsebare Einträge
überhaupt auf den Stack gelangen, ist dies ein theoretisches Restrisiko, kein praktischer Blocker —
im Test trotzdem einen künstlich korrumpierten Stack-Eintrag simulieren (z. B.
`undoStack.push({state:'{invalid'})` direkt im Test) und verifizieren, dass `undo()` einen Fehler-
Toast zeigt UND danach nicht crasht.
**Warning signs:** Wiederholtes "❌ Undo fehlgeschlagen" ohne dass sich der Stack je leert.

### Pitfall 3: Base64-Audio-Export blockiert den Haupt-Thread spürbar

**What goes wrong:** Bei größeren Bibliotheken (gemessen: ~80-170 ms `JSON.stringify` allein bei
50-100 MB roh, siehe Messung unten) plus Base64-Encoding plus `Blob`-Konstruktion kann der
Audio-Export den UI-Thread für hunderte Millisekunden bis wenige Sekunden blockieren — spürbar als
"App hängt" am Spieltisch, wo genau das nicht passieren soll.
**Why it happens:** `FileReader`, `JSON.stringify` und `Blob`-Konstruktion sind synchron bzw.
blockieren effektiv den Main-Thread für ihre Dauer bei großen Payloads (dokumentiertes
Browser-Verhalten, siehe Quellen unten).
**How to avoid:** Den Export NICHT automatisch/im Hintergrund auslösen (er ist es ohnehin nicht —
nur bei explizitem `startMigrationFlow()`-Klick), UND vor dem Start einen Toast/Ladeindikator zeigen
("Audio-Export wird erstellt — das kann bei großen Bibliotheken einen Moment dauern"), damit die
Blockierung nicht als Absturz missverstanden wird.
**Warning signs:** Keine — reines UX-Risiko, kein Datenverlust, aber im Plan als Verifikationsschritt
("Export bei > 50 MB Testbibliothek löst sichtbaren Ladeindikator aus") aufnehmen.

### Pitfall 4: Mehrfach-Download aus einem Klick (zwei Dateien, ein Handler)

**What goes wrong:** `startMigrationFlow()` löst künftig ZWEI Anchor-Downloads in derselben
Funktionsausführung aus (`downloadFullExport()` + `downloadAudioExport()`). Chrome kann bei mehreren
automatischen Downloads ohne erneute User-Geste einen "Diese Website versucht mehrere Dateien
herunterzuladen"-Blockierungsdialog zeigen (dokumentiertes Chrome-Verhalten seit mehreren Jahren).
**Why it happens:** Browser-Heuristik gegen Download-Spam, unabhängig davon ob beide Downloads aus
demselben Klick-Handler stammen.
**How to avoid:** Beide Downloads bleiben im selben synchronen Ausführungskontext des Klick-Handlers
auslösen (nicht per `setTimeout` verzögern — das würde die User-Geste-Zuordnung eher verschlechtern);
zusätzlich den Nutzer im Wizard-Text vorwarnen ("Zwei Dateien werden heruntergeladen — bitte beide
erlauben, falls der Browser nachfragt"). Kein Code-Fix möglich, nur UX-Kommunikation.
**Warning signs:** Playwright-E2E-Test für den Download-Flow muss beide `page.on('download')`-Events
abwarten, nicht nur eines — sonst flackert der Test, wenn der zweite Download durch Chrome verzögert
wird.

## Code Examples

### Blob → Base64 ohne Stack-Overflow-Risiko

```javascript
// Source: eigenes Pattern, FileReader ist die Standard-Browser-API für diesen Zweck
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result; // "data:audio/mpeg;base64,AAAA..."
            const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
            resolve(base64);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

// Rückrichtung beim Import: Base64 → Blob (für erneutes saveSoundBlob())
function base64ToBlob(base64, type) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type });
}
```

### Vorab-Größenprüfung vor teurem Base64-Encode

```javascript
// Source: eigenes Pattern — nutzt listSoundBlobs() Metadaten (soundboard-idb.js:88-112, Read verifiziert)
const AUDIO_EXPORT_SAFE_RAW_BYTES = 300 * 1024 * 1024; // 300 MiB — konservativ unter dem gemessenen ~384 MiB Hard-Limit

async function checkAudioExportFeasible() {
    const metas = await window.listSoundBlobs();
    const totalBytes = metas.reduce((sum, m) => sum + (m.size || 0), 0);
    if (totalBytes > AUDIO_EXPORT_SAFE_RAW_BYTES) {
        return { feasible: false, totalBytes, fileCount: metas.length };
    }
    return { feasible: true, totalBytes, fileCount: metas.length };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `_doBackup()` sichert 1 Kampagne, Kommentar behauptet "je Kampagne einzeln" | `_doBackup()` iteriert wirklich über alle Kampagnen | Diese Phase (SAFE-02) | Kommentar und Verhalten stimmen künftig überein — kein stiller Datenverlust mehr bei Zweit-/Dritt-Kampagnen |
| `FULL_EXPORT_SCHEMA` deckt 5 localStorage-Felder ab, IDB-Inhalte fehlen komplett | Zweite Export-Datei deckt `audioBlobs` + `diceStats` ab | Diese Phase (SAFE-01) | Umzug `file://` → PWA verliert keine Audiodateien/Würfelstatistik mehr |
| `undo()`/`redo()` poppen vor Validierung | Peek-Parse-Pop-Reihenfolge | Diese Phase (SAFE-05) | Ein korrupter Stack-Eintrag geht nicht mehr unbemerkt verloren |

**Deprecated/outdated:**
- `autosave-toggle`-Codepfad (3 Fundstellen): totes Feature-Flag ohne UI-Gegenstück, wird ersatzlos
  entfernt (D-05) — kein Nachfolgemechanismus vorgesehen.

## Base64-Praxisgrenze (Offene Frage 1 — gemessen)

**Methode:** In dieser Recherche-Sitzung wurde die tatsächliche Kette
`Buffer.alloc(N) → toString('base64') → JSON.stringify({...,data:base64})` unter Node.js (V8-Engine,
dieselbe Engine-Familie wie Chrome/Chromium — Node und Chrome teilen denselben String-Längen-
Mechanismus, siehe Quelle unten) mit realen Puffergrößen von 1 MB bis 400 MB ausgeführt und
gemessen (`node --max-old-space-size=4096 -e "..."`, dieser Sitzung).

**Ergebnisse (gemessen, `[VERIFIED: lokale Node/V8-Messung, dieser Sitzung]`):**

| Roh-Bytes | Base64-Zeichen | Inflationsfaktor | `toString('base64')` | `JSON.stringify` | Ergebnis |
|-----------|----------------|-------------------|------------------------|---------------------|----------|
| 1 MB | 1.398.104 | 1,333x | 1 ms | 0 ms | OK |
| 10 MB | 13.981.016 | 1,333x | 1 ms | 7 ms | OK |
| 50 MB | 69.905.068 | 1,333x | 9 ms | 32 ms | OK |
| 100 MB | 139.810.136 | 1,333x | 30 ms | 79 ms | OK |
| 200 MB | 279.620.268 | 1,333x | 37 ms | 131 ms | OK |
| 380 MB | 531.278.508 | 1,333x | — | — | OK (531.278.508 Zeichen) |
| 383 MB | 535.472.812 | 1,333x | — | — | OK (535.472.812 Zeichen) |
| **384 MB** | — | — | — | — | **FAILED: `RangeError: Cannot create a string longer than 0x1fffffe8 characters`** |

Die exakte Fehlermeldung `0x1fffffe8` entspricht `536.870.888` Zeichen = `2^29 - 24` — dies deckt
sich exakt mit der dokumentierten V8-String-Längengrenze
[`String: length — MDN`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length)
(„In V8 (used by Chrome and Node), the maximum length is 2^29 - 24 (~1GiB) on 64-bit builds").

**Antwort auf die offene Frage:** Die harte Grenze für die kombinierte Base64-JSON-Datei liegt bei
**~383,99 MiB (402.653.166 Byte) roher Audiodaten** — jenseits dessen wirft `JSON.stringify` beim
Bauen der EINEN zusammenhängenden Export-Zeichenkette einen `RangeError`, und der **gesamte**
Audio-Export schlägt fehl (nicht nur die überschreitende Datei) — exakt das Risiko, das D-01 durch
die Zwei-Datei-Trennung vom Haupt-Export fernhalten wollte, aber innerhalb der Audio-Datei selbst
weiterhin besteht.

**Wichtige Einschränkung dieser Messung:** Gemessen wurde unter Node.js, nicht in einem echten
Browser-Tab. Node und Chrome teilen dieselbe V8-String-Längenkonstante (`2^29-24`), daher ist die
harte Zeichen-Obergrenze mit hoher Sicherheit identisch übertragbar — das ist die technische
Kernaussage. **Nicht gemessen** wurde das Verhalten bei echtem Browser-Speicherdruck (Tab-OOM,
Multi-Prozess-Architektur, mobile Geräte mit deutlich knapperem Heap) — dort können bereits deutlich
unter 384 MiB praktische Probleme auftreten (Timing-Blockierung des UI-Threads, siehe Pitfall 3,
sowie das dokumentierte Risiko „renderer memory can grow too fast and result in an OOM on the
renderer side" bei vielen/großen Blobs
[Chromium Blob Storage Design](https://chromium.googlesource.com/chromium/src/+/HEAD/storage/browser/blob/README.md)).
Dieser Teil ist `[ASSUMED]` — nicht in einem echten Browser dieser Sitzung verifiziert.

**Empfehlung für den Planer:** `AUDIO_EXPORT_SAFE_RAW_BYTES = 300 MiB` als Warngrenze verwenden
(deutlicher Sicherheitsabstand zur 384-MiB-Hard-Grenze, um Browser-Speicherdruck-Varianz
abzufedern). Bei Überschreitung: Export sauber mit benannter Fehlermeldung abbrechen, NICHT
versuchen, teilweise zu exportieren (Teilexport würde eine neue, noch nicht spezifizierte
Datenverlust-Klasse einführen — außerhalb des Scopes dieser Phase, im "Noted for Later" vermerken).

Sources:
- [String: length - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length)
- [Chrome's Blob Storage System Design (Chromium-Quellcode-Doku)](https://chromium.googlesource.com/chromium/src/+/HEAD/storage/browser/blob/README.md)
- [How Big is TOO BIG for JSON? — Josh Zeigler](https://joshzeigler.com/technology/web-development/how-big-is-too-big-for-json)

## Kampagnen-Index-Verlässlichkeit (Offene Frage 2 — am Code verifiziert)

**Frage:** Liefert `getCampaignIndex()` unter `file://` zuverlässig alle Kampagnen, auch solche im
IDB-Modus?

**Antwort: Ja, uneingeschränkt — mit einer Begründung, die über reines Lesen des Index hinausgeht.**

`[VERIFIED: campaign-manager.js:10-19]`
```javascript
const CAMPAIGN_INDEX_KEY = APP_CONFIG.CAMPAIGN_INDEX_KEY;
function getCampaignIndex() {
    return StorageAPI.getJSON(CAMPAIGN_INDEX_KEY, {
        campaigns: [],
        active: APP_CONFIG.STORAGE_KEY
    });
}
function saveCampaignIndex(index) {
    StorageAPI.setJSON(CAMPAIGN_INDEX_KEY, index);
}
```
`[VERIFIED: core/config.js:17]` `CAMPAIGN_INDEX_KEY: 'dnd-tracker-campaigns'` — ein **eigener**,
von den Kampagnendaten-Keys (`dnd-tracker-v4`, `dnd-campaign-<epoch>`) komplett getrennter
localStorage-Key.

**Der entscheidende Punkt:** Der 5-MB-IDB-Overflow-Pfad (`persistence.js:64-68`/`:219-220`, DEBT-17)
wird ausschließlich innerhalb von `save()`/`saveImmediate()` ausgelöst, und diese Funktionen
operieren strikt auf `window.STORAGE_KEY_OVERRIDE || STORAGE_KEY` — also der **Kampagnendaten**-Key.
`saveCampaignIndex()` (oben) ruft `StorageAPI.setJSON()` **direkt** auf, komplett außerhalb von
`save()`/`saveImmediate()` — der Index durchläuft niemals die 5-MB-Prüfung und wird niemals in die
IndexedDB ausgelagert oder aus localStorage gelöscht. Der Index enthält pro Kampagne nur
`{key, name, created}` (`campaign-manager.js:30`, verifiziert) — selbst bei 50 Kampagnen liegt die
Indexgröße im Kilobyte-Bereich, weit unter jedem Quota-Risiko.

**Konsequenz für D-03:** `_doBackup()`/`buildFullExport()` können sich uneingeschränkt auf
`getCampaignIndex()` verlassen, um die vollständige Kampagnenliste zu erhalten — unabhängig davon, ob
einzelne Kampagnen selbst im IDB-Modus sind. `readCampaignDataForBackup(campaignKey)` übernimmt
danach separat die (bereits gelöste) Aufgabe, die tatsächlichen Kampagnendaten unabhängig vom
Speicherzustand zu lesen.

**Bekanntes Rand-Risiko (außerhalb des Scopes, aber für den Planer dokumentiert):** Der Index selbst
ist robust, aber die *aggregierte* localStorage-Quota über mehrere gleichzeitig <5 MB große
Kampagnen hinweg (z. B. 3× 4 MB = 12 MB > typisches ~10 MB-Origin-Quota) könnte theoretisch dazu
führen, dass eine neuere Kampagne beim Speichern scheitert, obwohl sie im Index bereits gelistet ist
— `readCampaignDataForBackup()` behandelt das bereits korrekt (liefert `null`, Kampagne wird beim
Backup übersprungen statt leer geschrieben). Kein Fix nötig für diese Phase, nur zur Kenntnis für den
Planer, falls Tests mit mehreren großen Kampagnen unerwartetes `null` liefern.

## diceStats-Volumen (Offene Frage 3 — geschätzt + Verweis auf PERF-02)

**Frage:** Soll der Audio-Export `diceStats` vollständig mitnehmen oder ist eine Begrenzung nötig?

`[VERIFIED: dice-stats-idb.js:16-26]` — jeder Datensatz hat die Form
`{ notation, result, rolls, timestamp, sessionId, charId }` (Kommentar Zeile 15). Geschätzte
JSON-Größe pro Datensatz: ~120-180 Byte (kurze Notation-Strings, wenige Zahlen, ein `sessionId`-String
aus `Date.now().toString()`, siehe `dice-stats-idb.js:8`).

**Überschlagsrechnung (`[ASSUMED]`, keine echte Nutzungsdaten verfügbar):** Selbst bei sehr intensiver
Nutzung — 50 Würfe/Sitzung × 300 Sitzungen (mehrjährige Kampagne) = 15.000 Datensätze × 150 Byte ≈
2,25 MB. Bei einer unrealistisch hohen Zahl von 100.000 Datensätzen (mehrere parallele Kampagnen über
Jahre) wären es ~15 MB roh — **ohne** Base64-Inflation (diceStats sind reine JSON-Objekte, keine
Blobs), also weit unterhalb jeder in dieser Recherche gemessenen Grenze.

**Empfehlung:** `diceStats` für diese Phase **vollständig** exportieren (kein Cap) — das
`getAllStats()`-Muster (`dice-stats-idb.js:32-47`, bereits vorhanden, lädt den gesamten Store per
`store.getAll()`) direkt wiederverwenden. Ein Cap wäre bei den oben geschätzten Größenordnungen
Über-Engineering für diese Phase und würde das eigentliche PERF-02-Problem (Store wächst unbegrenzt,
`DEBT-24`) nicht lösen, sondern nur den Export künstlich beschneiden.

**Explizite Überschneidung mit PERF-02 (Phase 13, außerhalb dieses Scopes):** PERF-02 fordert Pruning/
Nicht-komplett-in-den-Speicher-Laden für `getAllStats()` selbst — sollte PERF-02 in Phase 13 ein
Cap/Pruning einführen, exportiert diese Phase automatisch nur noch die dann vorhandenen (bereits
beschnittenen) Datensätze, ohne dass der Export-Code selbst geändert werden muss (er nimmt "alles was
`getAllStats()` liefert"). Diese Entkopplung ist beabsichtigt und sollte im Plan als Design-Hinweis
festgehalten werden, damit niemand in Phase 13 versehentlich zwei Cap-Implementierungen baut.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Die V8-String-Längengrenze (2^29-24) verhält sich in echten Chrome/Firefox-Browser-Tabs identisch zur hier unter Node gemessenen Grenze | Base64-Praxisgrenze | Falls ein Browser-Tab bereits deutlich früher (z. B. bei 150-200 MiB) an Speicherdruck statt an der String-Grenze scheitert, wäre die empfohlene 300-MiB-Warngrenze zu hoch — Verifikation im Plan über einen echten Playwright-E2E-Test mit einer künstlich großen Test-Bibliothek empfohlen |
| A2 | `removeAudioFile()`s Undo-Fix (Toast statt Blockieren bei fehlendem Blob nach Undo) ist die richtige UX-Entscheidung | Pattern 3 | Falls der Nutzer eine "echte" Wiederherstellung der Audiodatei erwartet (nicht nur der Referenz), enttäuscht diese Lösung — sollte in `discuss-phase`/beim Review explizit als Grenze kommuniziert werden |
| A3 | `pushUndo()`s Fehlerbehandlung (Toast + Operation läuft ohne Undo-Schutz weiter) statt Operation-Abbruch | Pattern 5 | Falls Datenintegrität wichtiger ist als Nie-Blockieren, müsste die destruktive Operation stattdessen abgebrochen werden — abweichend vom aktuellen "nie blockieren"-Grundsatz der Migration (D-02) |
| A4 | `isFreshInstall()`-Aufrufer-Kaskade ist mit den zwei in dieser Recherche identifizierten Stellen (`migration-wizard.js:256,533`) vollständig | Pattern 4 | Falls ein dritter Aufrufer existiert (z. B. in Tests oder einem noch nicht gegrepten Modul), bliebe er synchron und würde die Promise-Truthy-Falle (Pitfall 1) auslösen — Planer sollte vor Implementierung erneut projektweit grep'en |
| A5 | Base64-Größenschwelle von 300 MiB als Warngrenze (statt z. B. 250 oder 350 MiB) | Base64-Praxisgrenze / Code Examples | Konservativ gewählt mit Sicherheitsabstand zur gemessenen 384-MiB-Hardgrenze; falls Nutzer regelmäßig >300 MiB Audio sammeln, müsste die Grenze im Realbetrieb neu bewertet werden — unwahrscheinlich angesichts des bestehenden 100-MB-Pro-Datei-Hard-Blocks (`MAX_AUDIO_BYTES_HARD`) |

## Open Questions

1. **Soll `isFreshInstall()` async werden oder eine separate synchrone Schnellprüfung behalten?**
   - What we know: Der volle Fix (IDB-Modus berücksichtigen) erfordert zwangsläufig einen
     asynchronen Lesepfad (`loadFromIndexedDBFallbackRaw` ist `async`).
   - What's unclear: Ob beide bekannten Aufrufer (`migration-wizard.js:256,533`) sich risikofrei auf
     `async` umstellen lassen, ohne die Wizard-Anzeige-Timing-Logik (`setTimeout(showMigrationWizard,
     500)`, Zeile 535) zu brechen.
   - Recommendation: Planer soll beide Aufrufer im Detail lesen (bereits in dieser Recherche
     zitiert) und explizit entscheiden: voll async (sauberer, mehr Diff) vs. hybrid (schneller,
     aber zwei Wahrheiten im Code).

2. **Wo genau soll die Audio-Import-Größenprüfung in der Wizard-Dropzone greifen, wenn zwei Dateien
   gleichzeitig gedroppt werden?**
   - What we know: `_processWizardFile()` (`migration-wizard.js:215-316`) verarbeitet aktuell genau
     eine Datei (`e.dataTransfer.files[0]`).
   - What's unclear: Ob die Dropzone beide Dateien in einem Drop akzeptieren soll (Multi-File-Drop)
     oder ob zwei getrennte Interaktionsschritte (Haupt-Datei droppen, dann optional Audio-Datei
     droppen) klarer für den Nutzer sind.
   - Recommendation: Zweiter, expliziter (aber optionaler) Dropzone-Bereich in Schritt 3 ist UX-seitig
     eindeutiger als Multi-File-Erkennung per `_exportType`-Sniffing nach dem Parsen — sollte aber im
     `discuss-phase`/UI-Review entschieden werden, da dies eine sichtbare UI-Änderung ist.

## Environment Availability

Entfällt — diese Phase führt keine neuen externen Abhängigkeiten (Tools, Services, Pakete) ein. Alle
verwendeten APIs (`Blob`, `FileReader`, `IndexedDB`, `localStorage`) sind bereits im gesamten Projekt
im Einsatz und werden von den Zielbrowsern (Chrome/Edge/Firefox, laut `CLAUDE.md` "Known Issues")
unterstützt.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.2.0 (Unit, `jsdom`-Environment) + Playwright 1.57.0 (E2E) |
| Config file | `jest.config.cjs` (Unit), `playwright.config.*` (E2E, nicht in dieser Recherche gelesen — Standardpfad `tests/e2e/`) |
| Quick run command | `npx jest tests/unit/<datei>.test.js` |
| Full suite command | `npm run test && npm run test:e2e` |

**Etablierte Testmuster in diesem Projekt (beide bereits genutzt, wähle je nach Bedarf):**
- **`vm.createContext()`-Muster** (`tests/unit/full-export.test.js`, `tests/unit/file-backup.test.js`,
  `tests/unit/migration.test.js`): lädt eine einzelne Quelldatei isoliert in einen kontrollierten
  Kontext mit gemockten `window.*`-Globals — bevorzugt, wenn die Testdatei NUR ein Modul mit klar
  definierten Abhängigkeiten prüft.
- **`eval(fs.readFileSync(...))`-Muster** (`tests/unit/file-backup-hook.test.js`,
  `tests/unit/soundboard.test.js`): lädt die echte Quelldatei direkt in den globalen `jsdom`-Scope —
  bevorzugt, wenn mehrere Module (z. B. `persistence.js` + `soundboard-idb.js`) im selben Test
  zusammenspielen müssen.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|--------------|
| SAFE-01 | `buildAudioExport()` sammelt alle `audioBlobs` + `diceStats`, Base64-kodiert, als 2. Datei | unit | `npx jest tests/unit/audio-export.test.js` | ❌ Wave 0 (neue Datei, Muster: `full-export.test.js`) |
| SAFE-01 | Audio-Export→Import→Szene spielt Track (Rundlauf, D-08) | e2e | `npx playwright test tests/e2e/features/soundboard.spec.js` | ⚠️ Datei existiert (`tests/e2e/features/soundboard.spec.js`), Rundlauf-Testfall fehlt — erweitern |
| SAFE-01 | Fehlende/nicht-passende Audio-Datei blockiert Hauptimport nicht, benennt betroffene Szenen (D-02) | unit | `npx jest tests/unit/migration.test.js` (oder neue `migration-wizard.test.js`) | ⚠️ Erweitern |
| SAFE-02 | `_doBackup()` sichert ALLE Kampagnen aus `getCampaignIndex()`, nicht nur aktive | unit | `npx jest tests/unit/file-backup.test.js` | ⚠️ Datei existiert, Multi-Kampagnen-Testfall fehlt — `_doBackup` muss dafür exportiert werden (`window._doBackup = _doBackup;` ergänzen, aktuell nicht in den Exports Zeile 420-429) |
| SAFE-02 | Kampagnen-Key wird NUR bei echter `safeName`-Kollision angehängt, sonst unverändert | unit | `npx jest tests/unit/file-backup.test.js` | ⚠️ Erweitern (Testfälle: 2 Kampagnen "Müller"/"Muller" → beide "-<key>"; 1 Kampagne "Test" → unverändert) |
| SAFE-02 | `FILE_BACKUP_MAX_SNAPSHOTS` (10) gilt weiterhin pro Kampagne bei Multi-Kampagnen-Lauf | unit | `npx jest tests/unit/file-backup.test.js` | ⚠️ Erweitern (bestehender CR-05-Test als Vorlage, Zeile 190-214) |
| SAFE-03 | `removeAudioFile()` ruft `saveUndoState()` VOR `deleteSoundBlob()` | unit | `npx jest tests/unit/soundboard.test.js` | ⚠️ Datei existiert, Undo-Testfall fehlt |
| SAFE-04 | `isFreshInstall()` berücksichtigt `STORAGE_KEY_OVERRIDE` | unit | `npx jest tests/unit/migration.test.js` | ⚠️ Erweitern (oder neue `migration-wizard.test.js`, Vorlage: `vm`-Muster aus `migration.test.js`) |
| SAFE-04 | `isFreshInstall()` erkennt IDB-only-Kampagnen als "nicht frisch" | unit | `npx jest tests/unit/migration.test.js` | ⚠️ Erweitern (IDB-Mock analog `stability.test.js` `setupMockIDB()`-Helper, Zeile 447-481) |
| SAFE-05 | `undo()`/`redo()`: Parse-Fehler poppt NICHT vom Stack | unit | `npx jest tests/unit/stability.test.js` | ⚠️ Erweitern (Sektion "Undo/Redo system", Zeile 941-959) |
| SAFE-05 | `pushUndo()`: nicht-serialisierbarer Snapshot wird NICHT gepusht, kein Crash | unit | `npx jest tests/unit/stability.test.js` | ⚠️ Erweitern (zirkuläre Referenz in `D` simulieren) |
| SAFE-05 | Kein `autosave-toggle`-String mehr in `persistence.js`/`avatars.js` (Regressions-Grep-Test) | unit | `npx jest tests/unit/stability.test.js` | ⚠️ Neuer Grep-Test, Vorlage: `stability.test.js:559-576` (Quelltext-Regex-Assertion-Muster bereits etabliert) |
| SAFE-06 | >5-MB-IDB-only-Save + simulierter Reload liest korrekt aus IDB | unit | `npx jest tests/unit/stability.test.js` | ⚠️ Bestehende "5MB IDB-only Roundtrip"-Sektion (Zeile 654-735) deckt Save-Seite ab, **Reload-Simulation fehlt** (Load-Pfad nach Save testen) |
| SAFE-06 | localStorage-Quota-Fallback (`QuotaExceededError`) → IDB-Fallback greift | unit | `npx jest tests/unit/stability.test.js` | ❌ Neu — `StorageAPI.set` Mock mit `QuotaExceededError` werfen lassen, Fallback-Pfad in `saveImmediate()`/`save()` prüfen |
| SAFE-06 | Export/Import-Versions-Rundlauf (Export in Version X, Import in Version Y) | unit | `npx jest tests/unit/full-export.test.js` | ⚠️ Erweitern um `importFullExport()`-Gegenseite (aktuell nur `buildFullExport()` getestet) |
| SAFE-06 | Audio-Rundlauf (D-08, siehe SAFE-01-Zeile oben) | e2e | `npx playwright test tests/e2e/features/soundboard.spec.js` | ⚠️ Siehe SAFE-01 |

### Sampling Rate

- **Per task commit:** `npx jest tests/unit/<betroffene-datei>.test.js` (gezielt, < 5s)
- **Per wave merge:** `npm run test` (volle Unit-Suite) + `npx playwright test tests/e2e/features/soundboard.spec.js tests/e2e/features/persistence.spec.js` (gezielte E2E-Teilmenge)
- **Phase gate:** `npm run test && npm run test:e2e` (volle Suite grün, laut Projekt-Memory zuletzt
  621 Jest + 318/2 Playwright bestanden/übersprungen) vor `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/audio-export.test.js` — neue Datei, deckt SAFE-01 (`buildAudioExport`,
      `downloadAudioExport`, `importAudioExport`), Vorlage: `tests/unit/full-export.test.js`
- [ ] `systems/file-backup/file-backup-manager.js`: `window._doBackup = _doBackup;` zu den Exports
      hinzufügen (aktuell fehlt es in Zeile 420-429) — sonst ist SAFE-02 nicht direkt testbar ohne
      den gesamten `onAfterSave()`-Debounce-Pfad zu durchlaufen
- [ ] Kein neues Test-Framework nötig — Jest + Playwright bereits vollständig eingerichtet und laut
      Projekt-Memory grün

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | nein | Keine Auth in dieser Single-User-Offline-App |
| V3 Session Management | nein | Keine Server-Sessions |
| V4 Access Control | nein | Kein Multi-User-Zugriffsmodell |
| V5 Input Validation | **ja** | Neuer Audio-Import-Pfad verarbeitet eine untrusted JSON-Datei (Drag&Drop/Dateiauswahl) — Whitelist-Validierung nach Vorbild `full-export.js:124-140` (`MAX_IMPORT_CAMPAIGNS`, `ALLOWED_KEY_RE`) |
| V6 Cryptography | nein | Keine kryptographischen Operationen betroffen; Base64 ist Kodierung, keine Verschlüsselung — im Plan nicht als Sicherheitsmaßnahme missverstehen |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|------------------------|
| Manipulierte/überdimensionierte Audio-Export-Datei führt zu Speicher-Erschöpfung beim Import (analog zur bereits vorhandenen 20-MB-Grenze für die Hauptexport-Datei, `migration-wizard.js:235`) | Denial of Service | Dateigrößen-Check VOR `FileReader.readAsText()`/`JSON.parse()` — Grenze am gemessenen 384-MiB-Hardlimit orientieren (z. B. hart bei 350 MiB ablehnen, siehe "Base64-Praxisgrenze") |
| Manipulierte `blobId`-Werte in der importierten Audio-Datei als IDB-Key verwendet | Tampering | Whitelist-Format prüfen, analog `ALLOWED_KEY_RE` in `full-export.js:135` — `saveSoundBlob()` generiert IDs im Format `audio_<timestamp>_<random>` (`soundboard-crud.js:48`), Import sollte nur genau dieses Format akzeptieren |
| Fehlerhafte Base64-Strings (`atob()` wirft `InvalidCharacterError`) bricht kompletten Import ab | Denial of Service (lokal) | Pro-Datei-`try/catch` beim Base64-Decode (nicht den gesamten Import in einem einzigen try/catch bündeln) — konsistent mit D-02s "benannt, nicht blockierend"-Prinzip |
| `WR-03`-Mengenlimit-Muster aus `full-export.js:126-129` (`MAX_IMPORT_CAMPAIGNS = 100`) fehlt beim Audio-Import (unbegrenzte Anzahl `audioFiles`-Einträge in der Import-Datei) | Denial of Service | Analoges `MAX_IMPORT_AUDIO_FILES`-Limit einführen, z. B. 500 (deutlich über realistischer Nutzung, aber unter DoS-Schwelle) |

## Sources

### Primary (HIGH confidence — Live-Code, per `Read` in dieser Sitzung verifiziert)
- `systems/migration/full-export.js` (komplett gelesen) — Export-Schema, Download-/Import-Muster
- `systems/file-backup/file-backup-manager.js` (komplett gelesen) — Backup-Dateinamen, Snapshot-Pruning, `_doBackup()`, `readCampaignDataForBackup()`
- `systems/campaign-manager/campaign-manager.js` (komplett gelesen) — `getCampaignIndex()`, `saveCampaignIndex()`
- `systems/migration/migration-wizard.js` (komplett gelesen) — `isFreshInstall()`, Wizard-Flow, `startMigrationFlow()`
- `systems/undo.js` (komplett gelesen) — `pushUndo()`, `undo()`, `redo()`
- `systems/spellslots/persistence.js` (komplett gelesen) — `save()`, `saveImmediate()`, `autosave-toggle`-Fundstellen, `registerPostSaveHook()`
- `systems/avatars.js` (komplett gelesen) — dritte `autosave-toggle`-Fundstelle
- `features/soundboard/soundboard-idb.js`, `features/soundboard/soundboard-crud.js` (komplett gelesen) — `removeAudioFile()`, `listSoundBlobs()`, `saveSoundBlob()`
- `features/dice-stats/dice-stats-idb.js` (komplett gelesen) — `getAllStats()`, Store-Schema
- `core/init.js:295-354` — IDB-Version, Store-Definitionen (`audioBlobs`, `diceStats`, `campaigns`)
- `core/config.js` — `STORAGE_KEY`, `CAMPAIGN_INDEX_KEY`, `DICE_FAV_KEY`, `VERSION`
- `loader.js` — Modul-Ladereihenfolge
- `render/helpers.js:362-372` — `safeJSONParse()`
- `utils/basic.js:263-` — `StorageAPI`-Implementierung
- `tests/unit/full-export.test.js`, `file-backup.test.js`, `file-backup-hook.test.js`, `migration.test.js`, `stability.test.js`, `soundboard.test.js` (alle komplett oder teilweise gelesen) — etablierte Testmuster
- `jest.config.cjs`, `package.json` — Test-Infrastruktur
- Lokale Node/V8-Messung dieser Sitzung (`node --max-old-space-size=4096 -e "..."`) — Base64/JSON.stringify-Grenzwerte

### Secondary (MEDIUM confidence — WebSearch, mit offizieller Quelle verifiziert)
- [String: length — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length) — V8-String-Längengrenze 2^29-24, deckt sich exakt mit der lokalen Messung
- [Chrome's Blob Storage System Design (Chromium-Quellcode-Doku)](https://chromium.googlesource.com/chromium/src/+/HEAD/storage/browser/blob/README.md) — Renderer-OOM-Risiko bei vielen/großen Blobs

### Tertiary (LOW confidence — nicht browserverifiziert, nur Node/V8-transferiert)
- Übertragung der Node/V8-Messung auf echte Chrome/Firefox-Browser-Tabs (siehe Assumption A1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — keine neuen Bibliotheken, nur bestehende Browser-APIs, alle bereits im Projekt in Gebrauch
- Architecture: HIGH — alle sechs Fixes sind Anwendungen bereits etablierter Projektmuster (Undo-vor-Mutation, Multi-Entity-Iteration wie `buildFullExport()`, Peek-vor-Pop)
- Pitfalls: HIGH für Code-Verhalten (per `Read` verifiziert), MEDIUM für Browser-Speicherverhalten (Node-transferiert, nicht live-browser-verifiziert)

**Research date:** 2026-08-06
**Valid until:** Stabil, solange sich die Kern-Storage-Architektur nicht ändert — konservativ 60 Tage (kein schnelllebiges Ökosystem, reine Inhouse-Codebasis ohne externe Paket-Drift)
