---
phase: 12-datensicherheit
reviewed: 2026-09-04T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - .gitignore
  - core/init.js
  - features/soundboard/soundboard-crud.js
  - features/soundboard/soundboard-idb.js
  - loader.js
  - systems/avatars.js
  - systems/file-backup/file-backup-manager.js
  - systems/migration/audio-export.js
  - systems/migration/migration-wizard.js
  - systems/spellslots/persistence.js
  - systems/undo.js
  - tests/build/test_build_deduplication.py
  - tests/e2e/features/soundboard.spec.js
  - tests/unit/audio-export.test.js
  - tests/unit/file-backup.test.js
  - tests/unit/full-export.test.js
  - tests/unit/migration-wizard.test.js
  - tests/unit/soundboard.test.js
  - tests/unit/stability.test.js
findings:
  critical: 2
  warning: 2
  info: 0
  total: 4
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-09-04
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Phase 12 ("Datensicherheit") baut ein durchdachtes, ungewöhnlich gut dokumentiertes und
gut getestetes System aus Grabstein-Löschung (Soundboard-Audio), Undo-Hooks,
Mehr-Kampagnen-Datei-Backup und einem zweistufigen Migrations-Wizard (Haupt-Export +
separate Audio-Export-Datei). Der überwiegende Teil der bewussten Design-Entscheidungen
(Peek-Parse-Pop beim Undo, atomare Backup-Writes, Whitelist-Sanitizing von Dateinamen,
verankerte Snapshot-Regex gegen Präfix-Kollisionen, Größenlimits vor Base64-Encode,
blobId-Whitelist beim Audio-Import) ist korrekt umgesetzt und durch gezielte Unit-/E2E-Tests
abgesichert — die Testsuiten sind selbst überdurchschnittlich kritisch (Quelltext-Audits
gegen "grüne Suite ohne Beweiskraft", siehe T-12-22-Kommentare).

Trotzdem wurden zwei BLOCKER gefunden, die beide direkt gegen das Phasenziel verstoßen
("kein Pfad in Backup, Export oder Migration verliert oder überschreibt mehr
stillschweigend Daten"): ein Bedienpfad im Migrations-Wizard, der frisch importierte
Kampagnendaten durch einen stillen Autosave überschreiben lässt, und ein Fallback in
`readCampaignDataForBackup()`, der beim Mehr-Kampagnen-Backup (D-03) unter realistischen
Bedingungen die Daten der FALSCHEN Kampagne in die Backup-Datei einer ANDEREN Kampagne
schreibt. Beide Lücken sind durch keinen bestehenden Test abgedeckt.

## Critical Issues

### CR-01: "Überspringen"-Button im Migrations-Wizard überschreibt frisch importierte Daten nach erfolgreichem Import

**File:** `systems/migration/migration-wizard.js:283-286` (Button), `systems/migration/migration-wizard.js:627-632` (Handler), `systems/migration/migration-wizard.js:655-658` (`_closeWizard`)

**Issue:**
Der Footer-Button "Überspringen — ich starte neu" (`data-action="wizard-skip"`) wird
**außerhalb** der `.migration-step`-Container gerendert (Zeile 283-288) und ist damit auf
**jedem** Wizard-Schritt sichtbar und klickbar — auch auf Schritt 4, der
Erfolgsbestätigung nach einem bereits abgeschlossenen `full-v1`-Import
(`_processWizardFile()`, Zeile ~464-519). `showWizardStep()` (Zeile 152-177) toggelt nur
`.migration-step`-Elemente, den Audio-Bereich und die Fortschritts-Punkte — der Footer
bleibt unangetastet.

Die beiden Schritt-4-Buttons "App jetzt nutzen" (`wizard-close`) und "Automatische Backups
einrichten" (`wizard-setup-backup`) rufen beide bewusst `window.location.reload()` auf, mit
explizitem Kommentar:
```js
// KEIN renderAll()/save() auf dem stale In-Memory-D — save() würde
// die frisch importierte Aktiv-Kampagne mit dem leeren D überschreiben (CR-04).
window.location.reload();
```
Der `wizard-skip`-Handler (Zeile 629-632) macht genau das NICHT:
```js
} else if (action === 'wizard-skip') {
    StorageAPI.setJSON('migration-wizard-shown', { shown: true, skipped: true });
    _closeWizard();
}
```
`_closeWizard()` blendet das Modal nur aus (`modal.style.display = 'none'`) — kein Reload.
Klickt der Nutzer nach einem erfolgreichen Import auf Schritt 4 versehentlich (oder in dem
Glauben, es schließe nur den Dialog) auf "Überspringen", bleibt `window.D` auf dem
STALEN Vor-Import-Zustand (bei einer Frischinstallation: nahezu leer, da
`initMigrationWizardIfNeeded()` den Wizard nur zeigt, wenn `isFreshInstall()` true ist).

Der Import selbst hat aber bereits über `importFullExport()` die localStorage-Keys der
importierten Kampagne(n) **direkt** überschrieben. Jede nachfolgende Aktion, die
`save()`/`saveImmediate()` auslöst — oder, garantiert, das Schließen/Neuladen des Tabs —
schreibt das stale, fast leere `window.D` zurück in denselben localStorage-Key und macht
den Import damit **rückstandslos rückgängig**. `systems/avatars.js:170-176`
(`initOfflineMode()`) registriert dafür einen bedingungslosen `beforeunload`-Handler:
```js
window.addEventListener('beforeunload', () => {
    const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
    StorageAPI.setJSON(key, D); // Bereits mit try-catch geschützt
});
```
Dieser feuert bei jedem Tab-Wechsel/Schließen — der Datenverlust ist damit nicht nur
theoretisch möglich, sondern beim nächsten Tab-Close praktisch garantiert. Zusätzlich
setzt `wizard-skip` `migration-wizard-shown: {skipped:true}`, sodass der Wizard beim
nächsten Start NICHT erneut automatisch erscheint (`initMigrationWizardIfNeeded()` prüft
`StorageAPI.has('migration-wizard-shown')` zuerst) — der Nutzer bekommt keine zweite
Chance, den Import zu wiederholen, ohne selbst zu wissen, dass er über
`reopen-migration-wizard` erneut startbar ist.

Kein Test in `tests/unit/migration-wizard.test.js` deckt den Fall "Klick auf `wizard-skip`
NACH erfolgreichem Import (Schritt 4)" ab — alle bestehenden Tests für `_processWizardFile`
enden mit der Prüfung des Erfolgs-States, nie mit einem nachfolgenden `wizard-skip`-Klick.

**Fix:**
Den Skip-Button entweder ab Schritt 4 ausblenden, oder `wizard-skip` nach einem
erfolgreichen Import denselben Reload-Pfad wie `wizard-close` nehmen lassen:
```js
} else if (action === 'wizard-skip') {
    StorageAPI.setJSON('migration-wizard-shown', { shown: true, skipped: true });
    if (_wizardStep >= 4) {
        // Import bereits gelaufen — stale D darf nicht per Autosave/beforeunload
        // die frisch importierten Daten überschreiben (gleicher Grund wie wizard-close).
        window.location.reload();
        return;
    }
    _closeWizard();
}
```
Zusätzlich: den Footer per `showWizardStep()` ab Schritt 4 ausblenden (`display:none`),
damit ein Nutzer, der wirklich abbrechen will, das gar nicht erst versucht, nachdem der
Import längst gelaufen ist.

---

### CR-02: `readCampaignDataForBackup()` liefert bei fehlenden Kampagnendaten die FALSCHE (aktive) Kampagne zurück — Mehr-Kampagnen-Backup kann Kampagnen gegenseitig überschreiben

**File:** `systems/file-backup/file-backup-manager.js:382-411` (Funktion), `systems/file-backup/file-backup-manager.js:413-460` (`_doBackup()`-Aufrufschleife)

**Issue:**
`readCampaignDataForBackup(campaignKey)` liest in drei Stufen: localStorage unter
`campaignKey` → IndexedDB unter `campaignKey` → **als letzter Ausweg `window.D`**:
```js
// 3. Letzter Ausweg: der laufende Zustand im Speicher
if (typeof window !== 'undefined' && istBefuellt(window.D)) return window.D;
```
Diese dritte Stufe ignoriert `campaignKey` vollständig und gibt **immer** die aktuell im
Speicher geladene (aktive) Kampagne zurück — unabhängig davon, für welche Kampagne die
Funktion aufgerufen wurde. Das war für den ursprünglichen Anwendungsfall (Backup NUR der
aktiven Kampagne) korrekt, weil `campaignKey` dort zwangsläufig der aktive Key war.

Mit D-03 (`_doBackup()`, Zeile 413-460) ruft dieselbe Funktion die Daten für **jede**
Kampagne im Index einzeln ab, inklusive der Standard-Kampagne, die
`resolveBackupTargets()` (Zeile 128-163) **immer** als erstes Ziel einträgt — auch wenn
sie nie gespeichert wurde:
```js
targets.push({ key: storageKey, name: 'Standard-Kampagne' });
```
Ein sehr realistisches Szenario: Ein Nutzer legt beim ersten Start sofort eine benannte
Kampagne an und spielt ausschließlich darin — die literale "Standard-Kampagne"
(`APP_CONFIG.STORAGE_KEY`, z. B. `dnd-tracker-data`) wird nie gespeichert, weder in
localStorage noch in IndexedDB. Bei jedem Datei-Backup-Lauf (`onAfterSave()` →
`_doBackup()`) liefert `readCampaignDataForBackup('dnd-tracker-data')` für dieses
Ziel Stufe 1 und 2 `null`, fällt auf Stufe 3 zurück und gibt **die Daten der aktuell
aktiven, benannten Kampagne** zurück. `writeBackupForCampaign()` schreibt diese Daten
anschließend anstandslos nach `standard-kampagne-aktuell.json` — der `if (!data) continue;`
DEBT-17-Schutz (Zeile 441-447) greift NICHT, weil `data` nicht leer, sondern nur falsch
zugeordnet ist. Bei jedem weiteren Save-Zyklus passiert dasselbe erneut, inklusive der
Tages-Snapshot-Logik, die `standard-kampagne-YYYY-MM-DD.json` mit fremden Kampagnendaten
anlegt und dabei einen der zehn Snapshot-Plätze belegt. Sollte der Nutzer später
tatsächlich die echte Standard-Kampagne nutzen, wären deren "Backups" bereits mit
Fremddaten verunreinigt bzw. überschrieben — der exakte stille Datenverlust/-verfälschung,
den Phase 12 verhindern soll. Der Fehler ist nicht auf die Standard-Kampagne beschränkt:
jede Kampagne im Index, deren localStorage-/IDB-Eintrag aus irgendeinem Grund (noch) fehlt,
bekommt bei diesem Backup-Lauf fälschlich den Inhalt der aktiven Kampagne zugeschrieben.

Die bestehenden Tests in `tests/unit/file-backup.test.js`
(`describe('_doBackup() — alle Kampagnen des Index...')`) decken diesen Fall nicht auf, weil
`createDoBackupContext()` in keinem der Tests ein `window.D` setzt — `istBefuellt(window.D)`
ist dort immer `false` und Stufe 3 greift nie. Der Test "eine nicht lesbare Kampagne wird
uebersprungen" prüft dadurch nur den (korrekten) Fall "wirklich keine Daten irgendwo", nicht
den (fehlerhaften) Fall "keine Daten unter DIESEM Key, aber eine andere, befüllte Kampagne
aktiv im Speicher".

**Fix:**
Stufe 3 darf nur greifen, wenn `campaignKey` tatsächlich der aktuell aktive Key ist:
```js
async function readCampaignDataForBackup(campaignKey) {
    const istBefuellt = obj => obj && typeof obj === 'object' && Object.keys(obj).length > 0;

    if (typeof StorageAPI !== 'undefined') {
        const ausLs = StorageAPI.getJSON(campaignKey, null);
        if (istBefuellt(ausLs)) return ausLs;
    }

    const idbRead = typeof window !== 'undefined' ? window.loadFromIndexedDBFallbackRaw : null;
    if (typeof idbRead === 'function') {
        try {
            const record = await idbRead(campaignKey);
            if (record && record.data) {
                const geparst = JSON.parse(record.data);
                if (istBefuellt(geparst)) return geparst;
            }
        } catch (e) { /* ... unveraendert ... */ }
    }

    // Nur die AKTIVE Kampagne darf aus dem laufenden Speicher kommen — sonst
    // bekommt eine andere (z. B. nie gespeicherte) Kampagne fälschlich fremde Daten (CR-02).
    const activeKey = typeof window !== 'undefined'
        ? (window.STORAGE_KEY_OVERRIDE || window.APP_CONFIG?.STORAGE_KEY)
        : null;
    if (activeKey && campaignKey === activeKey &&
            typeof window !== 'undefined' && istBefuellt(window.D)) {
        return window.D;
    }

    return null;
}
```
Ergänzend einen Regressionstest in `file-backup.test.js` hinzufügen, der `ctx.D` mit einer
befüllten, ANDEREN Kampagne belegt und prüft, dass eine nicht-existente Nachbarkampagne
weiterhin übersprungen wird (kein `standard-kampagne-aktuell.json` mit Fremddaten).

## Warnings

### WR-01: Audio-Export-Datei in der Haupt-Dropzone abgelegt zeigt Rückmeldung am falschen Element

**File:** `systems/migration/migration-wizard.js:421-428` (Weiche), `systems/migration/migration-wizard.js:538-547` (`_processWizardAudioFile`)

**Issue:**
`_processWizardFile()` erkennt eine versehentlich in die Haupt-Dropzone gezogene
`audio-export-v1`-Datei und leitet korrekt an `_processWizardAudioFile(file, dropzone)`
weiter — übergibt dabei aber die **Haupt**-Dropzone (`migration-wizard-dropzone`) als
Parameter. `_processWizardAudioFile()` schreibt Erfolg/Fehler jedoch immer in
`#migration-wizard-audio-status` (per `getElementById`, unabhängig vom übergebenen
Parameter) und setzt `.file-ready`/`.dragover`-Klassen nur auf dem übergebenen (falschen)
Dropzone-Element. Ergebnis: die Haupt-Dropzone wird optisch als "fertig" markiert, während
die eigentliche Text-Rückmeldung ("Audio importiert: N Datei(en)…") im separaten,
möglicherweise nicht im Blickfeld befindlichen Audio-Bereich erscheint. Kein Datenverlust,
aber verwirrende UI-Rückmeldung nach einem an sich korrekt verarbeiteten Import.

**Fix:** Beim Weiterleiten die tatsächliche Audio-Dropzone referenzieren statt der
Haupt-Dropzone:
```js
if (parsedObj && parsedObj._exportType === 'audio-export-v1') {
    clearError();
    const audioDropzone = document.getElementById('migration-wizard-audio-dropzone') || dropzone;
    _processWizardAudioFile(file, audioDropzone);
    return;
}
```

---

### WR-02: `pushUndo()` räumt den Redo-Stack bei Serialisierungsfehler nicht — nachfolgendes Redo kann auf inkonsistentem State landen

**File:** `systems/undo.js:9-24`

**Issue:**
Der erfolgreiche Pfad von `pushUndo()` leert am Ende `redoStack.length = 0` (neue Aktion
macht alte Redo-Historie ungültig — Standard-Undo-Semantik). Schlägt
`JSON.stringify(window.D)` fehl (z. B. durch eine versehentlich zirkuläre Referenz oder
einen nicht serialisierbaren Wert, der an anderer Stelle in `D` gelandet ist), bricht die
Funktion vorzeitig ab, BEVOR der Redo-Stack geleert wird:
```js
try {
    stateJSON = JSON.stringify(window.D);
} catch (e) {
    // ... Toast ...
    return; // redoStack bleibt unveraendert!
}
```
Szenario: Nutzer macht Aktion A (Undo-Eintrag gesichert, Redo geleert), macht Undo
(A landet im Redo-Stack), macht danach Aktion B, während `D` gerade nicht serialisierbar
ist (pushUndo bricht ab, B läuft aber laut Kommentar "am Spieltisch nie blockieren" trotzdem
durch und verändert `D`). Der alte Redo-Eintrag für A bleibt bestehen. Klickt der Nutzer
jetzt "Redo", wird A auf den durch B bereits veränderten `D`-Stand angewendet — B's
Änderungen werden dabei stillschweigend überschrieben, ohne dass der Nutzer das erwartet
oder bestätigt hat.

**Fix:** Redo-Stack auch im Fehlerfall leeren, da die destruktive Aktion laut Design
trotzdem durchläuft:
```js
} catch (e) {
    if (window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler) {
        window.ErrorHandler.log('pushUndo', e, action);
    }
    showToast('⚠️ Undo-Schutz für diese Aktion nicht verfügbar', 'warning');
    redoStack.length = 0; // Aktion läuft trotzdem durch — alte Redo-Historie waere sonst inkonsistent
    return;
}
```

---

_Reviewed: 2026-09-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
