---
phase: 07-komfort-analyse
reviewed: 2026-06-20T00:00:00Z
depth: deep
files_reviewed: 14
files_reviewed_list:
  - core/init.js
  - core/data.js
  - features/dice/dice-core.js
  - features/dice-stats/dice-stats-idb.js
  - features/dice-stats/dice-stats-render.js
  - features/soundboard/soundboard-idb.js
  - features/soundboard/soundboard-player.js
  - features/soundboard/soundboard-crud.js
  - features/soundboard/soundboard-render.js
  - systems/spellslots/keyboard-shortcuts.js
  - systems/spellslots/navigation.js
  - systems/tab-registry.js
  - ui/actions/system-actions.js
  - assets/templates/view-tools.html
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: resolved
resolved_in: 40a9009
resolution_note: "CR-01 (kritisch), WR-01 und WR-03 behoben in Commit 40a9009. CR-01: play-scene/delete-scene/remove-audio lesen ctx.target.dataset.id direkt (Phase-03-03-Präzedenz). WR-03: _bufferCache FIFO-Cap (10). WR-01: Leerstate-Text scope-abhängig. Build exit 0, 432 Unit-Tests grün."
---

# Phase 07: Code Review Report

> **RESOLUTION (2026-06-20, Commit 40a9009):** Das kritische CR-01 sowie WR-01 und WR-03
> wurden während des execute-phase-Laufs behoben (Build exit 0, 432/432 Unit-Tests grün).
> Die übrigen Info-Befunde bleiben als nicht-blockierende Notizen bestehen.

**Reviewed:** 2026-06-20
**Depth:** deep (cross-file call-chain Analyse)
**Files Reviewed:** 14
**Status:** resolved (CR-01/WR-01/WR-03 gefixt in 40a9009)

## Zusammenfassung

Phase 07 liefert zwei neue Features: Soundboard (UX-01) und Wuerfel-Statistiken (UX-02). Die IDB-v4-Upgrade-Logik und die Dice-Stats-Pipeline sind korrekt implementiert. XSS-Absicherung mit `esc()` ist durchgaengig vorhanden. Die Dedup-Regeln (kein `var X = window.X` fuer const-Globals) werden eingehalten.

**Kritisches Problem:** Alle drei soundboard-seitigen UI-Aktionen, die `data-id` benutzen (`play-scene`, `delete-scene`, `remove-audio`), sind effektiv tot. `EventDelegation._handleClick()` leitet `data-id`-Attribute durch `parseEntityId()`, das Nicht-Zahlen-Strings (`"scene_…"`, `"audio_…"`) in `null` wandelt. Die Handler pruefen auf Truthiness von `ctx.id` bzw. brechen bei `null` ab — d.h. Szene spielen, Szene loeschen und Audio entfernen sind im Browser nie ausfuehrbar.

---

## Critical Issues

### CR-01: `parseEntityId()` zerstoert Soundboard-String-IDs — drei Aktionen dauerhaft broken

**File:** `ui/event-delegation.js:96` / `features/soundboard/soundboard-render.js:150,153` / `ui/actions/system-actions.js:252,272,277`

**Problem:**
`EventDelegation._handleClick()` wandelt `target.dataset.id` immer per `parseEntityId()` in eine Ganzzahl um. `parseEntityId()` gibt `null` zurueck, wenn der Wert kein gueltiger Integer ist (intern: `parseInt()` → `NaN` → `null`).

Soundboard-IDs haben das Format `"scene_1234567890_56789"` und `"audio_1234567890_56789"` — beides nicht-numerische Strings. Drei Action-Handler lesen den transformierten Wert:

```javascript
// event-delegation.js:96
const id = target.dataset.id ? parseEntityId(target.dataset.id) : null;
// => parseEntityId('scene_1700000000_12345') => parseInt(...) => NaN => null
// => ctx.id === null

// system-actions.js
'remove-audio': ctx => {
    if (ctx.id && typeof window.removeAudioFile === 'function') { // ctx.id ist null → false
        window.removeAudioFile(ctx.id); // wird NIE aufgerufen
    }
},
'delete-scene': ctx => {
    if (!ctx.id) return; // ctx.id === null → immer return
    window.deleteScene(ctx.id);
},
'play-scene': ctx => {
    if (ctx.id && typeof window.playSceneById === 'function') { // false
        window.playSceneById(ctx.id); // wird NIE aufgerufen
    }
},
```

**Betroffene User-Flows:** Szene spielen, Szene loeschen, Audio-Datei entfernen — alle drei Kernfunktionen des Soundboards sind in der Laufzeitumgebung nicht bedienbar.

**Fix (Option A — empfohlen: rohe String-ID daneben mitliefern):**

In `ui/event-delegation.js` (alle drei Handler-Methoden) neben `id` einen `rawId`-Slot hinzufuegen:

```javascript
// event-delegation.js — in _handleClick, _handleChange, _handleInput
const id    = target.dataset.id ? parseEntityId(target.dataset.id) : null;
const rawId = target.dataset.id || null;          // NEU: unveraenderter String
const ctx   = { id, rawId, type, value, target, event: e };
```

Dann in `system-actions.js` `rawId` statt `id` verwenden:

```javascript
'remove-audio': ctx => {
    const blobId = ctx.rawId || ctx.id;
    if (blobId && typeof window.removeAudioFile === 'function') {
        window.removeAudioFile(String(blobId));
    }
},
'delete-scene': ctx => {
    const sceneId = ctx.rawId || ctx.id;
    if (!sceneId) return;
    if (!confirm('Szene wirklich loeschen?')) return;
    if (typeof window.deleteScene === 'function') {
        window.deleteScene(String(sceneId));
        if (typeof window.renderSceneList === 'function') window.renderSceneList();
    }
},
'play-scene': ctx => {
    const sceneId = ctx.rawId || ctx.id;
    if (sceneId && typeof window.playSceneById === 'function') {
        window.playSceneById(String(sceneId));
    }
},
```

**Fix (Option B — nur system-actions, ohne event-delegation-Aenderung):**

Die Aktionen koennen stattdessen `ctx.target.dataset.id` direkt lesen, da `ctx.target` immer den DOM-Knoten enthaelt:

```javascript
'play-scene': ctx => {
    const sceneId = ctx.target && ctx.target.dataset.id;
    if (sceneId && typeof window.playSceneById === 'function') {
        window.playSceneById(sceneId);
    }
},
```

Option B beruehrt keine gemeinsame Infrastruktur und ist daher sicherer fuer diesen Hotfix.

---

## Warnings

### WR-01: "ds-no-data"-Hinweis zeigt immer Session-Text, auch bei Scope "Gesamt"

**File:** `features/dice-stats/dice-stats-render.js:266`

**Problem:**
Der Leer-Zustandstext ist hart auf "in dieser Session" kodiert, obwohl die Funktion `_renderDiceStatsContent` fuer beide Scopes (`session` und `total`) aufgerufen wird. Wenn ein Nutzer auf "Gesamt" wechselt und noch keine Wuerfe ueber Sitzungen hinweg in IDB hat, sieht er den falschen Hinweis.

```javascript
// dice-stats-render.js:266 — immer session-spezifischer Text
var noRollsNote = records.length === 0
    ? '<p class="ds-no-data">Noch keine Wuerfelwuerfe in dieser Session. Wuerfel ein paar d20!</p>'
    : '';
```

**Fix:**
`_statsScope` ist modul-global sichtbar; `_renderDiceStatsContent` erhaelt keinen Scope-Parameter. Entweder Scope-Parameter hinzufuegen oder direkt auf `_statsScope` pruefen:

```javascript
var noRollsNote = records.length === 0
    ? '<p class="ds-no-data">'
      + (_statsScope === 'session'
          ? 'Noch keine Wuerfelwuerfe in dieser Session. Wuerfel ein paar d20!'
          : 'Noch keine Wuerfelwuerfe gespeichert.')
      + '</p>'
    : '';
```

---

### WR-02: `console.error` / `console.warn` in `systems/tab-registry.js` ohne `DEBUG_MODE`-Guard

**File:** `systems/tab-registry.js:155,168,171`

**Problem:**
`renderTabContent()` ruft `console.error()` bei Init- und Render-Fehlern und `console.warn()` bei fehlenden Funktionen auf — ohne `if (APP_CONFIG.DEBUG_MODE)`. Laut CLAUDE.md-Konvention ("Pattern 1: Production Console Pollution") duerfen alle `console.*`-Aufrufe in Production-Code nur innerhalb von `DEBUG_MODE`-Bloecken erscheinen. In der Produktion werden so interne Laufzeitdetails (Funktionsnamen, Tab-Namen) in die Konsole geschrieben.

```javascript
// tab-registry.js:155 — kein DEBUG_MODE-Guard
} catch (err) {
    console.error(`[TabRegistry] Init failed for ${tabName}:`, err);
}
// tab-registry.js:168
} catch (err) {
    console.error(`[TabRegistry] Render ${renderFn}() failed for tab ${tabName}:`, err);
}
// tab-registry.js:171
console.warn(`[TabRegistry] Function ${renderFn} not found for tab ${tabName}`);
```

**Fix:**
```javascript
} catch (err) {
    if (window.APP_CONFIG?.DEBUG_MODE) {
        console.error(`[TabRegistry] Init failed for ${tabName}:`, err);
    }
}
```
Alternativ `ErrorHandler.log()` verwenden, das intern `DEBUG_MODE` prueft.

---

### WR-03: `_bufferCache` in `soundboard-player.js` hat keine Eviction-Policy — unbegrenztes Speicherwachstum

**File:** `features/soundboard/soundboard-player.js:19`

**Problem:**
Die `_bufferCache`-Map wird nie geleert. Jeder dekodierte AudioBuffer verbleibt fuer die gesamte Browser-Session im Speicher. Bei grossen Audio-Dateien (bis zu 100 MB erlaubt) und mehreren importierten Tracks kann das zu relevantem Speicherdruck fuehren. `AudioBuffer` kann deutlich groesser als der urspruengliche komprimierte Blob sein (PCM-Dekodierung; eine 100 MB MP3 → mehrere GB PCM).

```javascript
const _bufferCache = new Map(); // Zeile 19 — waechst unbegrenzt
// Zeile 71:
_bufferCache.set(blobId, audioBuffer); // kein Limit, keine Eviction
```

**Fix (einfach):** Cache-Groesse begrenzen (LRU-aehnlich):

```javascript
const BUFFER_CACHE_MAX = 10; // maximal 10 dekodierte Buffer gleichzeitig halten
// In loadTrackBuffer() nach dem Set:
if (_bufferCache.size > BUFFER_CACHE_MAX) {
    // Aeltesten Eintrag entfernen (Map-Einfuege-Reihenfolge = FIFO)
    const oldestKey = _bufferCache.keys().next().value;
    _bufferCache.delete(oldestKey);
}
```

---

### WR-04: `soundboard-render.js:50` — Magic Number statt exportierter Konstante `MAX_AUDIO_BYTES`

**File:** `features/soundboard/soundboard-render.js:50`

**Problem:**
`soundboard-idb.js` exportiert `window.MAX_AUDIO_BYTES = 20 * 1024 * 1024` (Zeile 135). Die Render-Funktion pruefte jedoch denselben Schwellenwert mit einer duplizierten numerischen Literalberechnung, statt die exportierte Konstante zu verwenden. Laut CLAUDE.md ("Magic Numbers Everywhere") muessen solche Werte als benannte Konstanten referenziert werden.

```javascript
// soundboard-render.js:50 — dupliziertes Magic-Number-Literal
const sizeClass = b.size > 20 * 1024 * 1024 ? ' sb-file-warn' : '';
```

Wenn der Schwellenwert in `soundboard-idb.js` angepasst wird, bleibt die visuelle Warnanzeige im Render falsch kalibriert.

**Fix:**
```javascript
const warnThreshold = (typeof window.MAX_AUDIO_BYTES === 'number')
    ? window.MAX_AUDIO_BYTES
    : 20 * 1024 * 1024; // Fallback
const sizeClass = b.size > warnThreshold ? ' sb-file-warn' : '';
```

---

## Info

### IN-01: Keine MIME-Type-Validierung fuer importierte Audio-Dateien

**File:** `features/soundboard/soundboard-crud.js:24` / `features/soundboard/soundboard-idb.js:44`

**Problem:**
Die Implementierung prueft ausschliesslich die Dateigroesse (`checkAudioFileSize`). Es gibt keine Pruefung, ob `file.type` tatsaechlich ein Audio-MIME-Typ ist (z.B. `audio/mpeg`, `audio/ogg`). Obwohl `<input accept="audio/*">` im Browser einen ersten Filter bietet, kann ein Nutzer die Auswahl im Dateidialog auf "Alle Dateien" umschalten und eine beliebige Binaerdatei hochladen. `decodeAudioData()` wuerde dann fehlschlagen — was durch `showToast` abgefangen wird — aber die Datei wird trotzdem per IDB persistiert (Blob liegt gespeichert, ist aber unbrauchbar).

**Empfehlung:**
```javascript
// In importAudioFile(), vor dem IDB-Write:
const ALLOWED_AUDIO_TYPES = ['audio/', 'video/ogg', 'application/ogg'];
const isAudio = file.type && ALLOWED_AUDIO_TYPES.some(t => file.type.startsWith(t));
if (!isAudio) {
    showToast('Nur Audiodateien erlaubt (MP3, OGG, WAV)', 'error');
    return;
}
```

---

### IN-02: `renameScene()` vorhanden, aber kein UI-Entry-Point und kein Action-Handler

**File:** `features/soundboard/soundboard-crud.js:145` / `ui/actions/system-actions.js` (fehlend)

**Problem:**
`window.renameScene` ist implementiert und exportiert, aber es gibt weder einen `data-action="rename-scene"`-Handler in `system-actions.js` noch ein UI-Element in `soundboard-render.js`, das das Umbenennen ausloesen koennte. Das Szenen-Header-Template (Zeile 144–159 in soundboard-render.js) zeigt keinen Rename-Button.

Praktische Folge: Szenen koennen nach dem Anlegen nicht umbenannt werden. Der Nutzer muss die Szene loeschen und neu anlegen — was jedoch durch CR-01 ebenfalls derzeit kaputt ist.

**Empfehlung:** Entweder einen Rename-Button + Action-Handler hinzufuegen oder `renameScene` als unerreichbar markieren und aus den Exports entfernen, um false Sicherheit zu vermeiden.

---

### IN-03: `_sbSessionId` Name-Praefix laesst auf Soundboard-Zugehoerigkeit schliessen, gehoert aber zu Dice-Stats

**File:** `features/dice-stats/dice-stats-idb.js:8`

**Problem:**
Die Konstante heisst `_sbSessionId` (wahrscheinlich `sb` = Session-Boot oder Soundboard-Verwirrung), exportiert aber `window._currentSessionId`. Der Praefix `_sb` suggeriert Soundboard-Kontext, ist aber der Boot-Session-Identifier fuer Dice-Stats. Bei zukuenftiger Erweiterung des Soundboards koennte dies zu Namensverwirrung fuehren.

**Empfehlung:** Umbenennen in `_diceStatsSessionId` oder `_bootSessionId`:

```javascript
// dice-stats-idb.js:8
const _bootSessionId = Date.now().toString(); // war: _sbSessionId
window._currentSessionId = _bootSessionId;
```

---

_Reviewed: 2026-06-20_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
