---
phase: 12-datensicherheit
reviewed: 2026-09-05T00:00:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - .gitignore
  - core/init.js
  - features/soundboard/soundboard-crud.js
  - features/soundboard/soundboard-idb.js
  - loader.js
  - systems/avatars.js
  - systems/file-backup/file-backup-manager.js
  - systems/migration/audio-export.js
  - systems/migration/full-export.js
  - systems/migration/migration-wizard.js
  - systems/spellslots/persistence.js
  - systems/undo.js
  - tests/build/test_build_deduplication.py
  - tests/e2e/features/soundboard.spec.js
  - tests/unit/audio-export.test.js
  - tests/unit/audio-import-resilience.test.js
  - tests/unit/file-backup-idb.test.js
  - tests/unit/file-backup.test.js
  - tests/unit/full-export.test.js
  - tests/unit/migration-wizard.test.js
  - tests/unit/soundboard.test.js
  - tests/unit/stability.test.js
findings:
  critical: 1
  warning: 1
  info: 1
  total: 3
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-09-05
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Dies ist eine erneute Prüfung nach der zweiten Lückenschluss-Runde (Pläne 12-12 bis
12-17, SEC-01 bis SEC-07), zusätzlich zu den bereits im vorherigen `12-REVIEW.md`
verifiziert behobenen Befunden (CR-01, CR-02, WR-01, WR-02, WR-03 — letzterer, die
Inkonsistenz zwischen `AUDIO_EXPORT_SAFE_RAW_BYTES` und dem Audio-Importlimit, ist
inzwischen über `getAudioImportMaxBytes()` in `migration-wizard.js` korrekt aus der
Export-Konstante abgeleitet, siehe Kommentar "WR-03 (Phase 12, Plan 16)" dort).

Der Gesamtzustand ist weiterhin außergewöhnlich gründlich abgesichert: Datei-Backup
(`file-backup-manager.js`), Undo/Redo-Serialisierung (`undo.js`), der Migrations-Wizard
(`migration-wizard.js`, `full-export.js`, `audio-export.js`) und der Soundboard-IDB-Layer
(`soundboard-idb.js`, `soundboard-crud.js`) tragen sichtbare Spuren vieler
Gap-Closure-Runden — die meisten naheliegenden Bugs (Race Conditions beim Speichern,
Pfad-Traversal in Backup-Dateinamen, XSS in Wizard-HTML, DoS durch unbegrenzte
Import-Größen, stille Datenverluste durch verfrühtes IDB→LS-Umschalten, Größen-
Inkonsistenz Export/Import) sind bereits identifiziert und mit dediziertem
Testcode/Quelltext-Audit abgedeckt. Die Testsuiten lesen an vielen Stellen sogar den
Quelltext selbst mit, um "grüne Suite ohne Beweiskraft" zu vermeiden.

Trotzdem wurde eine neue Lücke gefunden, die genau die Garantie verletzt, die dieser
Phase ihren Namen gibt: `importFullExport()` validiert die Formkorrektheit einzelner
Kampagnen-Einträge erst INNERHALB der Schreibschleife, nicht davor — ein Import mit
einem fehlerhaften Eintrag nach bereits gültigen Einträgen hinterlässt teilweise
geschriebene, aus dem Kampagnen-Index nicht mehr erreichbare Kampagnendaten in
localStorage, obwohl der Wizard dem Nutzer "Import fehlgeschlagen" meldet. Der eigene
Testblock der Datei heißt "Ablehnungen — es wird nichts geschrieben, bevor geworfen
wird" — dieser Anspruch stimmt nachweislich nur für die VOR der Schreibschleife
laufenden Prüfungen (Typ, Kampagnenzahl, Key-Whitelist), nicht für die Prüfung von
`campaign.data` selbst.

Daneben zwei kleinere Befunde: eine theoretische (aktuell nicht ausnutzbare, da
`entity.avatar` reihum nur in `<img src>` mit `esc()` gerendert wird) Lücke im
URL-Filter von `validateAvatarURL()`, und ein veralteter Kommentar in `loader.js`, der
der in CLAUDE.md dokumentierten SSOT-Architektur (Phase 11, ARCH-01) widerspricht.

## Critical Issues

### CR-01: importFullExport() schreibt Kampagnen teilweise, bevor ein späterer Formfehler den gesamten Import als fehlgeschlagen meldet

**File:** `systems/migration/full-export.js:142-161`
**Issue:**
Die Schreibschleife prüft `campaign.data` erst, NACHDEM bereits vorherige Einträge
derselben Schleife per `StorageAPI.setJSON(key, migratedData)` geschrieben wurden:

```javascript
for (const [key, campaign] of campaignEntries) {
    if (!campaign.data || typeof campaign.data !== 'object') {
        throw new Error('Kampagne "' + key + '" hat keine gueltigen Daten');
    }
    ...
    const saveResult = StorageAPI.setJSON(key, migratedData);
    ...
}
```

`campaignEntries` ist `Object.entries(parsedObj.campaigns)` und behält damit die
Einfügereihenfolge der Datei bei. Enthält eine Export-/Umzugsdatei z. B. drei gültige
Kampagnen gefolgt von einer vierten mit fehlendem oder falsch typisiertem `data`-Feld
(kaputte Datei, abgebrochener Export, manipulierte Datei), werden die ersten drei
Kampagnen bereits vollständig nach `localStorage` geschrieben, bevor die vierte den
`throw` auslöst. Der Kampagnen-Index-Merge und die Würfel-Favoriten-Wiederherstellung
(Zeilen 163 ff.) laufen dann NIE, weil der `throw` aus `importFullExport()`
herauspropagiert.

In `migration-wizard.js` (`_processWizardFile()`) führt das dazu, dass
`showError('Import fehlgeschlagen: ...')` angezeigt wird — der Nutzer geht davon aus,
dass NICHTS passiert ist ("Import abgebrochen — es wurden keine Daten geändert", die
Formulierung des `confirm()`-Abbruchpfads wenige Zeilen darüber legt genau diese
Erwartung nahe). Tatsächlich liegen die ersten drei Kampagnen aber bereits unter ihrem
`dnd-campaign-*`/`dnd-tracker-*`-Key in `localStorage`, ohne jeden Eintrag im
Kampagnen-Index — für die App unsichtbare, verwaiste Datensätze, die bei einer künftigen
`createCampaign()` mit kollidierendem Key sogar überschrieben oder mit fremden Daten
vermischt werden könnten.

Der eigene Testblock in `tests/unit/full-export.test.js`
(`describe('Ablehnungen — es wird nichts geschrieben, bevor geworfen wird', ...)`,
Zeilen 257-312) deckt genau diesen Anspruch — aber nur für die VOR der Schreibschleife
laufenden Prüfungen (`_exportType`, `campaigns`, `campaignIndex`, `MAX_IMPORT_CAMPAIGNS`,
`ALLOWED_KEY_RE`). Es gibt keinen Test, der eine gültige Kampagne gefolgt von einer
Kampagne mit ungültigem `data`-Feld prüft — die Lücke ist damit auch nicht durch
grüne Tests kaschiert, sondern schlicht ungetestet.

**Fix:** Formprüfung von `campaign.data` für ALLE Einträge VOR der Schreibschleife
durchführen (analog zur bereits existierenden Key-Whitelist-Schleife), sodass ein
Formfehler in einem beliebigen Eintrag den Import vollständig verhindert, bevor
irgendein `StorageAPI.setJSON()`-Aufruf stattfindet:

```javascript
// Formkorrektheit ALLER Einträge prüfen, bevor irgendetwas geschrieben wird
for (const [key, campaign] of campaignEntries) {
    if (!campaign.data || typeof campaign.data !== 'object') {
        throw new Error('Kampagne "' + key + '" hat keine gueltigen Daten');
    }
}

// Jede Kampagne migrieren und speichern
for (const [key, campaign] of campaignEntries) {
    let migratedData = campaign.data;
    ...
}
```

(Der verbleibende Fall — `StorageAPI.setJSON()` scheitert selbst zur Laufzeit, z. B.
durch Quota — lässt sich nicht vorab prüfen; zumindest sollte dieser Fall dokumentiert
oder im D-02-Stil "benannt statt geworfen" behandelt werden, damit bereits erfolgreich
geschriebene Kampagnen nicht durch den Fehler EINER weiteren Kampagne als
Gesamt-Fehlschlag gemeldet werden.)

## Warnings

### WR-01: validateAvatarURL() lässt sich durch eingebettete Steuerzeichen umgehen

**File:** `systems/avatars.js:6-31`
**Issue:**
```javascript
function validateAvatarURL(url) {
    if (!url || url.trim() === '') return true;
    const trimmed = url.trim();
    const dangerousProtocols = ['javascript:', 'file:', 'vbscript:', 'data:text/html'];
    const lowerUrl = trimmed.toLowerCase();
    if (dangerousProtocols.some(proto => lowerUrl.startsWith(proto))) {
        return false;
    }
    ...
}
```

`trim()` entfernt nur führende/nachfolgende Leerzeichen, keine eingebetteten
Steuerzeichen. Browser entfernen jedoch Tab-, Zeilenumbruch- und Carriage-Return-
Zeichen aus der GESAMTEN URL (nicht nur am Rand), bevor sie das Schema bestimmen
(WHATWG-URL-Spezifikation). Ein String wie `"java\tscript:alert(1)"` oder
`"jav\nascript:alert(1)"` besteht die `startsWith('javascript:')`-Prüfung, wird vom
Browser nach dem internen Entfernen der Steuerzeichen aber als `javascript:`-URL
interpretiert — ein klassischer, bekannter Bypass für genau diese Art von
Präfix-Filtern.

Aktuelle Ausnutzbarkeit ist gering: `entity.avatar` wird im gesamten Repo
ausschließlich als `<img src="${esc(ch.avatar)}">` gerendert (siehe
`features/party/party-render.js:110/171`, ebenso in NPC-/Bestiary-/Location-Views).
`javascript:` wird von modernen Browsern für `<img src>` nicht ausgeführt (kein
Navigations-Kontext), daher ist dies aktuell kein direkt auslösbarer XSS-Pfad. Die
Funktion behauptet aber, "dangerous protocols" zu blockieren — dieses Versprechen
stimmt nicht, sobald der Wert jemals in einem anderen Kontext verwendet wird (z. B.
Download-Link, `window.open(entity.avatar)`, CSS `background-image`).

**Fix:** Steuerzeichen vor der Protokollprüfung entfernen (analog zur
Browser-Normalisierung), bevor `startsWith()` geprüft wird:

```javascript
const stripped = trimmed.replace(/[\t\n\r]/g, '');
const lowerUrl = stripped.toLowerCase();
if (dangerousProtocols.some(proto => lowerUrl.startsWith(proto))) {
    return false;
}
```

## Info

### IN-01: loader.js-Kommentar widerspricht der dokumentierten SSOT-Architektur

**File:** `loader.js:9`
**Issue:**
```javascript
// WICHTIG: Diese Liste muss mit build.py synchron bleiben!
const MODULES = [
```

Laut CLAUDE.md (Abschnitt "Single Source of Truth for Modules/Templates/CSS",
Phase 11/ARCH-01) liest `build.py` die Modulliste ausschließlich aus `loader.js`
und führt keine eigene, separat zu pflegende Liste mehr (bestätigt durch
`tests/build/test_build_deduplication.py::test_ssot_module_list_parses_from_loader`).
Der Kommentar behauptet das Gegenteil (zwei Listen, die synchron gehalten werden
müssen) und könnte Entwickler dazu verleiten, fälschlich eine zweite Liste in
`build.py` zu suchen oder pflegen zu wollen.

**Fix:** Kommentar aktualisieren, z. B.:
```javascript
// SSOT (Phase 11, ARCH-01): build.py liest diese Liste direkt aus loader.js —
// es gibt keine zweite, separat zu pflegende Modulliste mehr.
const MODULES = [
```

---

_Reviewed: 2026-09-05_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
