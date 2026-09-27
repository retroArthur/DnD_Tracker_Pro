# Bug-Fix Katalog

## 2024-12-30

### Wiki: Undo fehlte bei Löschen/Bearbeiten

- **Problem:** Nach dem Löschen eines Wiki-Eintrags konnte man ihn nicht mit Undo zurückholen
- **Ursache:** `saveUndoState()` wurde nicht aufgerufen vor der Änderung
- **Fix:** `saveUndoState()` in `deleteWikiEntry()` und `saveWikiEntry()` hinzugefügt
- **Datei:** `features/shops/wiki.js`

### Wiki: Selbstbezug verhinderte Anzeige

- **Problem:** Wiki-Einträge mit `parentId === id` (Selbstbezug) wurden nicht angezeigt
- **Ursache:** Einträge mit parentId wurden nicht als Root behandelt, auch wenn der Parent sie selbst waren
- **Fix:** Selbstbezüge werden jetzt als Root-Einträge behandelt
- **Datei:** `features/shops/wiki.js` (rootEntries und childrenMap Filter)

### Quick-Reference: Fehlende CSS-Klassen

- **Problem:** Aktionen-Grid zeigte "Angriff1 Angriff" statt "Angriff 1 Angriff"
- **Ursache:** CSS-Klassen `qref-grid`, `qref-item`, `qref-label`, `qref-value` fehlten
- **Fix:** Fehlende CSS-Definitionen hinzugefügt
- **Datei:** `assets/styles.css`

### Shop: Unbegrenzte Artikel-Menge

- **Feature:** Checkbox "Unbegrenzt" bei Artikel-Menge hinzugefügt
- **Datei:** `assets/body.html`, `features/shops/shops-core.js`

### Dashboard: Party-Grid Layout

- **Problem:** Zu viele schmale Kacheln, Namen abgeschnitten
- **Fix:** Max 4 Spalten, breitere Kacheln (160px min), zentriert, Namen umbrechen
- **Datei:** `assets/styles.css` (.dash-party-grid, .dash-char-name)

### Karten: Messergebnis am Cursor

- **Feature:** Entfernungs-Info wird jetzt am Cursor angezeigt statt in der Leiste
- **Fix:** Cursor-Tooltip hinzugefügt, Kalibrieren-Cursor auf Kreuz geändert
- **Dateien:** `assets/styles.css`, `assets/body.html`, `features/dice/maps.js`

---

## 2024-12-31

### Rich-Editor: Listen-Formatierung defekt

- **Problem:** Klick auf Liste-Button (☰) machte Text kleiner statt Aufzählung zu erstellen
- **Ursache:** `document.execCommand('insertUnorderedList')` ist deprecated und funktioniert unzuverlässig
- **Fix:** Manuelle Listen-Erstellung implementiert (createElement ul/li, extractContents, insertNode)
- **Datei:** `ui/editors/rich-text.js` (applyFloatingFormat)

### Orte: Tag-Position und Lesbarkeit

- **Änderung:** Tag (z.B. "Umland", "Phandalin") nach links vor den Ortsnamen verschoben
- **Änderung:** Tag-Schriftfarbe auf schwarz geändert für bessere Lesbarkeit auf hellem Hintergrund
- **Dateien:** `features/locations/locations-render.js`, `assets/styles.css` (.loc-item-tag)

### Notizen: Story-Arc Dropdown leer

- **Problem:** Beim Bearbeiten/Erstellen von Session-Notizen war die Story-Arc Dropdown leer
- **Ursache:** `renderStoryArcSelects()` wurde nur beim Laden der Seite aufgerufen, nicht beim Öffnen des Formulars
- **Fix:** `renderStoryArcSelects()` in `editSession()` und `toggleCollapse()` für session-form hinzugefügt
- **Dateien:** `features/shops/sessions.js`, `systems/spellslots/navigation.js`

### Wiki: Eintrag mit Parent in anderer Kategorie unsichtbar

- **Problem:** Wiki-Eintrag in Kategorie "Orte" mit Parent aus Kategorie "Quest" wurde nicht angezeigt (Zähler zeigte 1, aber Eintrag war unsichtbar)
- **Ursache:** Eintrag war weder Root (hatte parentId) noch Kind (Parent nicht in gleicher Kategorie)
- **Fix:** Einträge deren Parent in einer anderen Kategorie ist werden jetzt als Root behandelt
- **Datei:** `features/shops/wiki.js` (renderWikiTree - catEntryIds Set, rootEntries Filter)

### Wiki: Parent-Dropdown zeigt alle Kategorien

- **Feature:** Parent-Dropdown zeigt jetzt nur Einträge aus der gleichen Kategorie
- **Änderung:** Bei Kategoriewechsel wird Dropdown aktualisiert und Parent-Auswahl zurückgesetzt
- **Dateien:** `features/shops/wiki.js` (updateWikiParentSelect, initWikiCategoryListener), `core/init.js`

### Rich-Editor: Formatierung entfernen ohne Highlight

- **Problem:** "Formatierung entfernen" (✕) entfernte gelbe Texthervorhebung nicht
- **Ursache:** `execCommand('removeFormat')` entfernt `<mark>` Tags nicht
- **Fix:** Manuelle Mark-Entfernung mit `selection.containsNode(mark, true)` und DOM-Manipulation
- **Datei:** `ui/editors/rich-text.js` (applyFloatingFormat - removeFormat case)

---

## Code-Audit Fixes (Projekt-Review)

### Orte: Fehlendes Undo bei saveLocation()

- **Problem:** `saveLocation()` rief `pushUndo()` nicht auf - keine Rückgängig-Funktion
- **Fix:** `pushUndo(id ? 'Ort bearbeitet' : 'Ort erstellt')` vor dem Speichern
- **Datei:** `features/locations/locations-crud.js`

### Quests: Fehlendes ID-Parsing bei deleteQuest()

- **Problem:** `deleteQuest(id)` verglich String mit Number - Löschen funktionierte nicht zuverlässig
- **Fix:** `parseEntityId(id)` hinzugefügt für konsistenten ID-Vergleich
- **Datei:** `features/quests/quests-crud.js`

### Timer: Memory Leak durch nicht aufgeräumte Intervals

- **Problem:** Session-Timer konnte Interval mehrfach erstellen ohne Cleanup
- **Fix:** Vorherigen Interval bereinigen vor neuem Start
- **Datei:** `features/dice/session-timer.js`

### Timer: Magic Number für Auto-Save-Interval

- **Problem:** Hartcodierter Wert `300` (5 Minuten) ohne Dokumentation
- **Fix:** Konstante `SESSION_AUTO_SAVE_INTERVAL = 300` eingeführt
- **Datei:** `features/dice/session-timer.js`

### Toast: Fehlende Accessibility (Screen-Reader)

- **Problem:** Toast-Nachrichten wurden von Screen-Readern nicht angekündigt
- **Fix:** ARIA-Attribute `role="alert"`, `aria-live="polite"`, `aria-atomic="true"` hinzugefügt
- **Datei:** `utils/utilities.js` (showToast)

### Event-Delegation: Unsichere dynamische Funktionsaufrufe

- **Problem:** `window[handlerName]` erlaubte Aufruf beliebiger globaler Funktionen bei XSS
- **Fix:** Whitelist `ALLOWED_CHANGE_HANDLERS` für erlaubte onChange/onInput Handler
- **Datei:** `ui/event-delegation.js`

---

## 2026-01-01

### Security: XSS-Schwachstelle in Fehleranzeige

- **Problem:** Error-Stack wurde via innerHTML mit Template-Literal angezeigt - XSS-Risiko bei manipulierten Fehlermeldungen
- **Ursache:** `${error.stack}` direkt in innerHTML-Template eingesetzt
- **Fix:** DOM-Elemente programmatisch erstellt, `textContent` statt `innerHTML` für Fehlertext
- **Datei:** `loader.js` (showLoadError Funktion)

### Security: Unsichere Backup-Wiederherstellung

- **Problem:** `D = parsed` übernahm Backup-Daten ohne Deep Clone und unvollständige Validierung
- **Ursache:** Direktes Zuweisen des geparsten Objekts, potenzielle Prototype-Pollution
- **Fix:** `sanitizeBackupData()` Funktion mit Schema-Validierung und Deep Clone (JSON.parse/stringify)
- **Datei:** `systems/backups.js` (restoreBackup, sanitizeBackupData)

### Feature: Service Worker Caching für Offline-Support

- **Problem:** Service Worker leitete alle Requests nur weiter ohne Caching - kein Offline-Support
- **Ursache:** `event.respondWith(fetch(event.request))` ohne Cache-Strategie
- **Fix:** Cache-First für lokale Ressourcen implementiert (Treffer aus dem Cache, sonst Netzwerk und cachen)
- **Korrektur (Code-Review 2026-09-21, R08):** Hier stand früher „Cache-First mit Stale-While-Revalidate“. Das stimmte nie: ein Cache-Treffer wird ohne Hintergrund-Aktualisierung ausgeliefert, neue Stände kommen nur über den Versions-Bump von build.py (neuer Cache-Name → Update-Banner). Zum Cache-Namensraum siehe den R08-Eintrag unten.
- **Datei:** `sw.js` (komplett überarbeitet)

### Consistency: Storage-Keys zentralisiert

- **Problem:** Storage-Keys waren in verschiedenen Dateien verstreut definiert
- **Fix:** `DICE_FAV_KEY`, `TIMER_PRESETS_KEY`, `SESSION_AUTO_SAVE_INTERVAL` nach `APP_CONFIG` verschoben
- **Dateien:** `core/config.js`, `features/dice/dice-favorites.js`, `features/dice/timers.js`, `features/dice/session-timer.js`

### Undo: Fehlende pushUndo() in Links-CRUD

- **Problem:** saveLink() und deleteLink() hatten keinen Undo-Support
- **Fix:** `pushUndo()` vor Datenänderungen hinzugefügt
- **Datei:** `features/shops/links.js`

### Undo: Fehlende pushUndo() in Filter-CRUD

- **Problem:** addFilter() und deleteFilter() hatten keinen Undo-Support
- **Fix:** `pushUndo()` vor Datenänderungen hinzugefügt
- **Datei:** `features/locations/locations-crud.js`

### Undo: Fehlende pushUndo() in Spell-CRUD

- **Problem:** saveSpell() und deleteSpell() hatten keinen Undo-Support
- **Fix:** `pushUndo()` vor Datenänderungen hinzugefügt
- **Datei:** `ui/editors/rich-text.js`

### Cleanup: Deprecated sanitizeHtml() Wrapper entfernt

- **Problem:** sanitizeHtml() war nur ein Wrapper für sanitizeHTML()
- **Fix:** Wrapper-Funktion entfernt (wurde nirgends verwendet)
- **Datei:** `utils/utilities.js`

### UX: Confirm-Dialoge standardisiert

- **Problem:** Viele Delete-Dialoge zeigten nur "Löschen?" ohne Kontext
- **Fix:** Entity-Name wird jetzt in Bestätigungsdialogen angezeigt (z.B. `NPC "Gundren" löschen?`)
- **Bonus:** pushUndo() zu deleteEnc() hinzugefügt (fehlte vorher)
- **Dateien:** ui/editors/rich-text.js, encounters-crud.js, links.js, party-crud.js, locations-crud.js, quests-crud.js, npc-crud.js

### UX: Loading-Indikator während Modul-Laden

- **Problem:** User sah nur leeren `#app-root` während 60+ Module sequentiell geladen wurden
- **Ursache:** Kein visuelles Feedback während loadModules()
- **Fix:** Ladebildschirm mit Fortschrittsbalken und aktuellem Modulnamen
- **Datei:** `loader.js` (showLoadingIndicator, updateLoadingProgress)

---

## 2026-01-02

### Rest-Manager: NaN-Wert bei Trefferwürfel-Anpassung

- **Problem:** Console-Fehler "The specified value 'NaN' cannot be parsed, or is out of range" beim Klick auf +/- Buttons
- **Ursache:** `char.hitDice ?? char.level ?? 1` fängt NaN nicht ab (nur null/undefined)
- **Fix:** Defensive Prüfung mit `typeof char.hitDice === 'number' && !isNaN(char.hitDice)` und finale NaN-Guard vor Wertzuweisung
- **Datei:** `features/rest-manager.js` (adjustRestHitDice)

### Generator-Button: Leerer Tab im Dashboard

- **Problem:** Klick auf "Generator" im Dashboard zeigte leeren Tab
- **Ursache:** Button verwendete `data-action="show-view" data-value="generators"`, aber `view-generators` existierte nicht
- **Fix:** Neues `showGeneratorModal()` erstellt, Button auf `data-action="show-generator-modal"` geändert
- **Dateien:** `features/random-tables.js`, `features/dice/performance-extras.js`, `ui/actions/system-actions.js`, `assets/styles.css`

### Quick Actions: Fehlende Undo-Unterstützung

- **Problem:** Quick Actions (Ausweichen, Sprinten, etc.) konnten nicht rückgängig gemacht werden
- **Ursache:** `applyQuickAction()` rief `pushUndo()` nicht vor Datenänderung auf
- **Fix:** `pushUndo()` am Anfang von `applyQuickAction()` hinzugefügt
- **Datei:** `features/quick-actions.js`

### Random Tables: Fehlende Undo bei Tabellen-Speicherung

- **Problem:** Tabellen-Änderungen konnten nicht rückgängig gemacht werden
- **Ursache:** `saveTable()` rief `pushUndo()` nicht auf
- **Fix:** `pushUndo()` vor Datenänderung in `saveTable()` hinzugefügt
- **Datei:** `features/random-tables.js`

### Rest Manager: Fehlende CSS-Klasse

- **Problem:** `.rest-no-chars` Klasse wurde verwendet aber nicht definiert
- **Ursache:** CSS-Definition fehlte
- **Fix:** CSS-Definition für `.rest-no-chars` hinzugefügt
- **Datei:** `assets/styles.css`

### Loot Distribution: Race Condition bei Gold-Verteilung

- **Problem:** `D.partyGold` wurde nach Verteilung überschrieben statt korrekt gesetzt
- **Ursache:** Doppelte Zuweisung: erst Addition, dann sofortiges Überschreiben
- **Fix:** Redundanten Code entfernt, nur noch `D.partyGold = remainder`
- **Datei:** `features/loot-distribution.js`

### Random Tables: Duplizierter Würfel-Code

- **Problem:** `rollOnTable()` und `rollOnTableAndShow()` enthielten identische Würfel-Logik
- **Ursache:** Copy-Paste bei Feature-Implementierung
- **Fix:** Neue Hilfsfunktion `rollWeightedEntry(table)` erstellt, beide Funktionen refactored
- **Datei:** `features/random-tables.js`

### Security: XSS in Wiki-Content Preview

- **Problem:** `entity.content` wurde in Entity-Preview-Modal ohne Sanitization angezeigt
- **Ursache:** `entity.content.substring(0, 500)` direkt in innerHTML Template
- **Fix:** `sanitizeHTML()` um den Content-Substring hinzugefügt
- **Datei:** `systems/entity-links.js` (showEntityPreview)

### Security: XSS in Location Description

- **Problem:** `loc.description` wurde im Detail-Panel ohne Sanitization angezeigt
- **Ursache:** Direktes Einsetzen in innerHTML Template
- **Fix:** `sanitizeHTML(loc.description)` statt direktem Einsetzen
- **Datei:** `features/locations/locations-render.js` (renderLocationDetail)

### Event Log: Race Condition bei Entry-Cleanup

- **Problem:** `querySelectorAll()` liefert statische NodeList - `entries.length` ändert sich nicht beim Entfernen
- **Ursache:** While-Loop prüfte statische Länge, `.remove()` auf undefined nach erstem Durchlauf
- **Fix:** `Array.from()` und `.pop().remove()` für korrekte Array-Mutation
- **Datei:** `utils/utilities.js` (showToast)

### Consistency: onclick-Attribute zu data-action migriert

- **Problem:** 3 onclick-Attribute statt Event-Delegation
- **Betroffene Stellen:** Parent-Toggle, Spell-Assign Select-All/None Buttons
- **Fix:** Umgestellt auf `data-action="toggle-parent-expanded"` bzw. `data-action="call"`
- **Datei:** `assets/body.html`

### Security: XSS in Random Tables Icon-Feld

- **Problem:** `table.icon` wurde an 6 Stellen ohne Escaping in HTML eingefügt
- **Ursache:** Icon-Feld wurde als sicher angenommen (maxlength="2" im Input)
- **Angriffsvektor:** LocalStorage-Manipulation oder DevTools-Umgehung von maxlength
- **Fix:** `esc()` um alle `table.icon` und `t.icon` Referenzen hinzugefügt
- **Datei:** `features/random-tables.js` (Zeilen 133, 167, 225, 606, 663, 704)

### Security: DoS via Large Range in parseRange()

- **Problem:** Eingabe wie "1-1000000" konnte Browser einfrieren
- **Ursache:** Keine Größenbegrenzung in der For-Schleife
- **Fix:** `MAX_RANGE_SIZE = 100` Konstante, Loop-Abbruch bei Überschreitung
- **Datei:** `features/random-tables.js` (parseRange)

### Security: Negative Zahlen in parseRange()

- **Problem:** Eingabe wie "-5-5" erzeugte ungültige Werte außerhalb des Würfelbereichs
- **Ursache:** Keine Validierung auf positive Zahlen
- **Fix:** Regex `^(\d+)-(\d+)$` für Ranges, `num >= 1` Prüfung für Einzelwerte
- **Datei:** `features/random-tables.js` (parseRange)

### Security: Icon-Länge nicht validiert

- **Problem:** Trotz `maxlength="2"` im HTML konnte längerer Inhalt gespeichert werden
- **Ursache:** Keine serverseitige Validierung
- **Fix:** Icon wird auf max 2 Unicode-Zeichen gekürzt: `[...icon].slice(0, 2).join('')`
- **Datei:** `features/random-tables.js` (saveTable)

### Code Quality: Magic Number für Default Dice Type

- **Problem:** `|| 6` an 6+ Stellen im Code
- **Fix:** `DEFAULT_DICE_TYPE = 6` Konstante eingeführt, `??` statt `||` für korrektes Null-Handling
- **Datei:** `features/random-tables.js`

### Accessibility: Fehlende Focus-Styles für Dice-Buttons

- **Problem:** Keyboard-User konnten fokussierten Button nicht erkennen
- **Fix:** `:focus-visible` Regel mit Gold-Outline hinzugefügt
- **Datei:** `assets/styles.css` (.rt-dice-btn:focus-visible)

### CSS: Fehlende .rt-entries-actions Klasse

- **Problem:** Klasse im HTML verwendet aber nicht definiert
- **Fix:** CSS-Definition für Flexbox-Layout hinzugefügt
- **Datei:** `assets/styles.css`

### CSS: Unbenutzte .rt-entry-weight Input-Styles entfernt

- **Problem:** Legacy-CSS für altes Weight-Input-Feld nicht mehr verwendet
- **Fix:** CSS-Regel entfernt (neues System nutzt .rt-entry-range)
- **Datei:** `assets/styles.css`

### Feature: Editor Improvements v2.0

- **Verbesserungen:**
    1. **Focus-Based Toolbar**: Editor-Toolbars nur bei Fokus sichtbar (`:has()` + `:focus-within`)
    2. **Enhanced Floating-Toolbar**: Zwei Zeilen - Formatierung + Farb-Swatches, Font/Size-Selects
    3. **Context-Toolbars**: Separate Toolbars für Tabellen (Zeile/Spalte add/delete) und Links (öffnen/bearbeiten/entfernen)
    4. **Mobile Bottom-Toolbar**: Responsives Layout mit fixierter Bottom-Position bei < 768px
    5. **Swipe-Indicator**: Touch-Feedback für horizontales Scrollen
- **CSS:**
    - `.form-group:has(.editor-toolbar)` mit Transition für sanftes Ein-/Ausblenden
    - `.color-row` mit Flexbox und `flex-wrap: wrap` für Farb-Swatches
    - `.table-context-toolbar` und `.link-context-toolbar` für Kontext-Tools
    - `@media (max-width: 768px)` für mobile Styles
- **JS:**
    - `applyFloatingHighlight(color, editor, savedRange)` für Text-Highlighting mit Farben
    - `initContextToolbars()` für Tabellen- und Link-Kontext-Erkennung
    - Tabellen-Operationen: addRow, addCol, deleteRow, deleteCol, deleteTable
    - Link-Operationen: open, edit, remove
- **Dateien:** `assets/styles.css`, `assets/body.html`, `ui/editors/rich-text.js`, `core/init.js`

### Consistency: Editor-Toolbar onchange zu data-action migriert

- **Problem:** 28 onchange-Handler in Editor-Toolbars statt Event-Delegation
- **Betroffene Stellen:** Font-Size, Font-Family, Text-Alignment Selects in allen Editor-Toolbars
- **Fix:** Umgestellt auf `data-action="editor-fontsize"`, `data-action="editor-fontfamily"`, `data-action="editor-align"`
- **Dateien:** `assets/body.html`, `ui/actions/editor-actions.js`

---

## Muster / Lessons Learned

| Muster                                                                         | Vermeidung                                                                                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `saveUndoState()` fehlt bei Delete/Edit                                        | Bei jeder Lösch-/Bearbeitungsfunktion prüfen                                                                  |
| CSS-Klassen im HTML ohne Definition                                            | HTML + CSS immer zusammen implementieren                                                                      |
| Selbstbezüge in hierarchischen Daten                                           | Filter auf `parentId !== id` prüfen                                                                           |
| `document.execCommand()` deprecated (21 Call-Sites in ui/editors/rich-text.js) | Neue Editor-Funktionen mit Selection/Range API implementieren; vollständige Ablösung in eigener Phase geplant |
| Dropdowns nur bei Init gefüllt                                                 | Beim Öffnen des Formulars Selects neu populieren                                                              |
| Kategorie-übergreifende Parent-Refs                                            | Prüfen ob Parent in gleicher Kategorie ist, sonst als Root behandeln                                          |
| `setInterval` ohne Cleanup                                                     | Immer prüfen ob Interval existiert und clearInterval vor neuem Start                                          |
| Magic Numbers                                                                  | Konstanten mit sprechenden Namen verwenden                                                                    |
| `window[...]` dynamische Aufrufe                                               | Whitelist für erlaubte Funktionsnamen verwenden                                                               |
| Fehlende Accessibility                                                         | ARIA-Attribute für dynamische UI-Elemente (Toast, Dialoge)                                                    |
| ID-Vergleich String vs Number                                                  | Immer `parseEntityId()` verwenden                                                                             |
| innerHTML mit Template-Literalen                                               | textContent für unsicheren Content, DOM programmatisch erstellen                                              |
| Direktes Zuweisen von parsed JSON                                              | Deep Clone + Schema-Validierung vor Zuweisung                                                                 |
| Service Worker ohne Caching                                                    | Cache-First, nur im eigenen Cache-Namensraum (App + Scope, R08)                                               |
| `??` Operator fängt NaN nicht                                                  | Explizite NaN-Prüfung mit `!isNaN(value)` zusätzlich verwenden                                                |
| Button für nicht-existente View                                                | Vor Feature-Buttons prüfen ob View/Handler existiert                                                          |
| querySelectorAll in Schleifen                                                  | Statische NodeList - Array.from() nutzen bei remove()                                                         |
| Content ohne sanitizeHTML()                                                    | Immer sanitizeHTML() für User-Content wie description, content                                                |
| HTML maxlength != JS Validierung                                               | Serverseitig/JS-seitig immer auch validieren, nicht auf HTML vertrauen                                        |
| User-Input ohne Escape in Icon-Feldern                                         | Auch "sichere" Felder wie Icons mit esc() escapen                                                             |
| Unbegrenzte Schleifen bei User-Input                                           | Immer maxValue/maxIterations setzen (DoS-Schutz)                                                              |

## Code Audit Fixes (2026-01-02)

### KRITISCH: clearUndoHistory() fehlte

- **Problem:** Button "Undo-Historie leeren" im Debug-Modal existierte aber Funktion war nicht implementiert
- **Ursache:** `data-action="call" data-value="clearUndoHistory"` rief nicht-existente Funktion auf
- **Fix:** `clearUndoHistory()` Funktion in undo.js hinzugefügt
- **Datei:** `systems/undo.js`

### KRITISCH: Event Listener Memory Leak in maps.js

- **Problem:** `mousemove`/`mouseup` Listener auf `document` konnten sich bei mehrfachem Drag-Start akkumulieren
- **Ursache:** Keine Prüfung/Cleanup vor neuem addEventListener
- **Fix:** `removeEventListener` vor `addEventListener` in `startMarkerDrag()`
- **Datei:** `features/dice/maps.js`

### HOCH: Type Coercion == statt === (4 Stellen)

- **Problem:** `el.dataset.id == id` verglich String mit potentieller Number
- **Ursache:** `dataset.id` ist immer String, `id` kann Number sein
- **Fix:** `el.dataset.id === String(id)` für typsichere Vergleiche
- **Dateien:**
    - `features/initiative.js:1047`
    - `features/encounters/encounters-render.js:216`
    - `features/locations/locations-render.js:152`
    - `features/npcs/npc-render.js:164`

### HOCH: Deprecated Funktionen entfernt

- **Problem:** 3 deprecated Funktionen in locations-render.js verschwendeten Codezeilen
- **Entfernt:**
    - `toggleLocationCard(id)` - Alias für selectLocation
    - `expandAllLocations()` - Nur Toast-Stub
    - `collapseAllLocations()` - Wrapper für clearLocationDetail
- **Fix:** entity-actions.js nutzt jetzt `selectLocation` direkt
- **Dateien:** `features/locations/locations-render.js`, `ui/actions/entity-actions.js`

### HOCH: sortInit/sortInitiative konsolidiert

- **Problem:** 2 nahezu identische Sortier-Funktionen in verschiedenen Dateien
- **Zusammenführung:**
    - `sortInit()` (initiative.js) - Nun mit Validierung und Toast
    - `sortInitiative()` (initiative-extras.js) - ENTFERNT
- **Fix:** Button nutzt jetzt `data-action="sort-initiative"` statt `data-action="call"`
- **Dateien:** `features/initiative.js`, `features/dice/initiative-extras.js`, `assets/body.html`

### Floating Toolbar: Dropdown Select schließt sofort

- **Problem:** Font/Size Dropdowns schlossen sich beim Klick sofort wieder
- **Ursache:** `mouseup` Event triggerte `handleSelectionChange()` die Toolbar versteckte
- **Fix:** `floatingToolbarInteracting` Flag um Toolbar-Interaktionen zu schützen
- **Datei:** `ui/editors/rich-text.js`

### Bestiar komplett ungestylt: ganze CSS-Datei im Bundle verschluckt

- **Problem:** Die Bestiar-Liste lief als unstilisierter Text zusammen, der Favoriten-Stern war ein nackter OS-Button. Ebenfalls betroffen (nur weniger sichtbar): PWA-Button, Command-Palette, Migration- und File-Backup-UI — alle ungestylt.
- **Ursache:** Die Regel `.dmscreen-grid` war durch einen Fehl-Edit zerrissen — die öffnende `{` lag als loses Fragment am Ende von `tools.css` (unschließend), der Body + `}` verwaist in `dmscreen.css`. Beim Konkatenieren der CSS-Dateien in `build.py` verschluckte diese offene Klammer ALLE nachfolgend gebündelten CSS-Dateien (pwa, migration, file-backup, command-palette, bestiary) — deren Regeln fehlten komplett in der CSSOM, obwohl der Text im Bundle stand.
- **Fix:** Regel wieder zusammengeführt (Öffnung zurück in `dmscreen.css`, Fragment aus `tools.css` entfernt). Anschließend den fehl-platzierten DM-Screen-Block ganz nach `dmscreen.css` verschoben (Feature-Organisation).
- **Lektion:** Symptom „ganze CSS-Sektion fehlt im Browser, Text steht aber im Bundle" → unbalancierte Klammer in einer FRÜHEREN konkatenierten Datei prüfen (verschluckt alles bis Dateiende, da keine schließende `}` mehr folgt). Diagnose mit einem **kommentar-/string-bewussten** Klammer-Balance-Check pro Datei — roher `grep -o "{"`-Zähler ist unzuverlässig (zählt `{`/`}` in Kommentaren und `content:`-Strings mit). Per-Datei-Delta muss 0 sein.
- **Dateien:** `assets/styles/tools.css`, `assets/styles/dmscreen.css`

### Bestiar-Liste zeigte nur 1 Zeile (VirtualScroll-Viewport auf 48px)

- **Problem:** Nach dem CSS-Fix zeigte die Bestiar-Liste nur ~1 Monster in einem winzigen 48px-Scrollfenster.
- **Ursache:** `VirtualScroll.create()` las `container.clientHeight` des noch leeren `#bestiary-list`. Dessen Höhe war zu dem Zeitpunkt nur `padding-bottom: 48px` → Viewport wurde auf 48px eingefroren.
- **Fix:** VirtualScroll leitet die Viewport-Höhe aus dem Content-Bereich des Eltern-Scroll-Containers ab, wenn die eigene `clientHeight` kleiner als 2 Zeilen ist; zusätzlich `box-sizing: border-box` am Container (gegen Überlauf durch padding). `VirtualScroll` wird ausschließlich vom Bestiar genutzt → kein Risiko für andere Tabs.
- **Datei:** `ui/virtual-scroll.js`

---

## Code-Review 2026-09-21

### Restore/Import nie gegen lokale Schlüssellisten filtern (R01/R03/R07, Grundlage U2)

- **Problem:** Der Restore (`systems/backups.js`) filterte Backups gegen ein veraltetes, lokal gepflegtes `defaultD` und verlor dabei gültige Felder (sessionNotes, settings, calendar, bestiary, factions, soundboard, `_nextId` …). Der überschreibende Import (`Object.assign(D, imp)`) behielt dagegen alte, nicht importierte Felder und den alten Zähler.
- **Ursache:** Es gab keinen gemeinsamen Weg von Rohdaten zu einer vollständigen Kampagne. Jede Stelle pflegte eigene Schlüssellisten und eigene Standardwerte.
- **Fix (Grundlage; die Aufrufer folgen in U3/U4/U6):** `normalizeCampaignData(raw)` in `systems/spellslots/version-migration.js` ist rein, liest und schreibt also weder `window.D` noch den Speicher. Es klont die Rohdaten (der Reviver entfernt `__proto__`/`constructor`/`prototype` in jeder Tiefe) und prüft die Container-Typen. Danach migriert es mit derselben Bedingung wie `load()`, führt einstufig mit `initializeData()` zusammen, repariert die IDs mit `normalizeEntityIds()` und bestimmt die Zähler mit `recomputeNextIds()` neu. `replaceCampaignData(target, next)` in `core/data.js` ist das eine Idiom, um `D` in place zu ersetzen. `getActiveCampaignKey()` ist der eine Resolver für den aktiven Kampagnenschlüssel.
- **Regel:** Restore und Import nie gegen lokale Schlüssellisten filtern. Stattdessen `normalizeCampaignData()` + `initializeData()` + `replaceCampaignData()` verwenden. Schlüssel, die `initializeData()` nicht kennt (`randomTables`, `shops`, `dmScreenLayout`), bleiben abwesend, wenn sie fehlen, denn `features/random-tables.js` seedet seine Standardtabellen nur bei `!D.randomTables`.
- **Dateien:** `systems/spellslots/version-migration.js`, `core/data.js`, `utils/utilities.js`
- **Tests:** `tests/unit/campaign-schema.test.js`

### nextId: gespeichertem Zähler blind vertraut (R03)

- **Problem:** Nach einem Import ohne `_nextId` vergab `nextId('npcs')` eine bereits belegte ID erneut. `calendarEvents` und `combatants` begannen immer bei 1 und kollidierten, weil die Sammlungen verschachtelt sind und `D[type]` nicht existiert. Ein Zähler `1e300` lieferte zweimal dieselbe ID, `'abc'` lieferte `NaN`. Die Duplikat-Reparatur in `validateDataIntegrity()` zog aus dem veralteten Zähler und machte aus `[1,1,2]` ein `[1,2,2]`.
- **Ursache:** `nextId()` übernahm jeden "truthy" Zähler ungeprüft und las die Sammlung nur über `D[type]`.
- **Fix:** `nextId()` nimmt max(gültiger Zähler, größte gültige ID + 1) und ist damit monoton: gelöschte IDs werden nicht wiederverwendet. `ID_COUNTER_PATHS` in `utils/utilities.js` registriert alle 19 Typen samt Pfad. Eine gültige ID ist eine sichere Ganzzahl in 1..`ENTITY_ID_MAX` (1e15), numerische Zeichenketten zählen. `validateAndRepairNextId(data, types)` arbeitet auf dem übergebenen Objekt; ohne Argumente prüft es unverändert die 11 Alt-Typen, weil die E2E-Seeds in `tests/e2e/helpers/test-utils.js` darauf kalibriert sind.
- **Regel:** `nextId` nie einem gespeicherten Zähler blind vertrauen. Jeder neue `nextId`-Aufruf mit Typ-Literal braucht einen Eintrag in `ID_COUNTER_PATHS`; Test N6 in `tests/unit/next-id.test.js` scannt dafür den Quellbaum.
- **Datei:** `utils/utilities.js`
- **Tests:** `tests/unit/next-id.test.js`

### Migration 2.3.0 war zerstörerisch (R01)

- **Problem:** `MIGRATIONS['2.3.0']` wandelte die **aktuellen** Zustands-Objekte `{type, name, addedAt}` in Zeichenketten um. Eigene Zustandsnamen gingen verloren, und die Chips waren nicht mehr darstellbar, weil `renderConditionsBar` `c.type` und `c.name` liest.
- **Ursache:** Die Migration läuft auf jedem versionslosen Stand. `initializeData()` setzt kein `_version`, also ist jede Speicherung und jedes Backup der Erstsitzung versionslos, und der nächste `load()` beschädigte die Zustände.
- **Fix:** Objekte mit String-`type` bleiben unverändert. Alt-Zeichenketten werden zu `{type, name: CONDITIONS[type]?.name || type}`, alles andere wird verworfen. Außerdem wirft `compareVersions()` bei einem numerischen `_version` nicht mehr (`String(v || '0')`), und `migrateData()` sortiert die Migrationsschlüssel numerisch statt lexikalisch.
- **Regel:** Jede Migration muss auf bereits aktuellem Format verlustfrei und idempotent sein. Versionslose Daten sind **nicht** automatisch Altdaten.
- **Datei:** `systems/spellslots/version-migration.js`
- **Tests:** `tests/unit/campaign-schema.test.js` (S2–S5), `tests/unit/migration.test.js`

### IndexedDB-Save meldete Erfolg vor dem Transaktions-Commit (R04, U3)

- **Problem:** `saveToIndexedDBFallback()` löste bei `request.onsuccess` auf. Brach der Commit danach ab (Quota, E/A-Fehler), hatte `saveImmediate()`/`save()` im >5-MB-Zweig die localStorage-Kopie samt `_ts` schon entfernt und „Gespeichert“ gemeldet — der nächste Start lud eine **leere** Kampagne. Im Quota-Rückfall wurde `_ts` entfernt und „In IndexedDB gespeichert“ gezeigt, der Neustart lud den alten Stand. `saveBackupToIndexedDB()`, fünf Soundboard-Helfer und `saveHandleToIDB()` hörten nur auf `oncomplete`/`onerror` und hingen bei einem Abbruch ewig (der localStorage-Rückfall von `createAutoBackup()` war unerreichbar, `listSoundBlobs()` hing). `clearAllStats()` meldete `true` vor dem Commit. `deleteCampaign()` löschte localStorage vor dem IDB-Delete, meldete und navigierte vor dem Commit und traf `index.active` statt der Kampagne des Tabs.
- **Ursache:** Keine gemeinsame Commit-Bestätigung. Ein erfolgreicher Request heißt nur „eingereiht“; ein Commit-Fehler feuert **nur** `abort` (kein `error`, weil kein Request mehr offen ist). Zusätzlich prüfte das Entfernen der LS-Kopie nach einem `await` nicht, ob inzwischen ein neuerer Save localStorage geschrieben hatte (Überhol-Rennen), und ein später Retry eines älteren Stands konnte nach dem Fix einen neueren IDB-Stand überschreiben.
- **Fix:** Neues Modul `utils/idb-tx.js` (direkt nach `utils/basic.js` im Loader): `idbTransactionDone(tx)` (complete löst auf, abort/error lehnen ab) und `idbWriteTx(stores, work, {durability})` als einzige Tür für schreibende Transaktionen. `persistence.js`: `_persistGeneration`/`_lsWriteGeneration` (LS-Kopie erst nach dem Commit und nur ohne neueren LS-Write entfernen), überholte Retries verworfen, Ergebnisvertrag `{success, backend}` / `{success:false, error}` / `{success:false, superseded:true}`, Notfall-Export einmal pro Fehlerserie, `removeCampaignData(key)` (IDB-Delete mit Commit **vor** localStorage, wirft nie). `durability: 'strict'` ist Standard von `saveToIndexedDBFallback()`; nur die optionale Zusatzkopie (2–5 MB) verzichtet darauf. `deleteCampaign()`: Schlüssel über `getActiveCampaignKey()`, Index zuerst (Abbruch bei gescheitertem Index-Write), dann `removeCampaignData()`, Reset über `replaceCampaignData(D, initializeData())`, Meldung und Navigation erst danach. Toter `saveToIndexedDB()` in `core/init.js` entfernt.
- **Regel:** Schreibende IDB-Transaktion nur über `idbWriteTx()` bestätigen; `request.onsuccess` ist keine Bestätigung; Commit-Fehler kommen nur als `abort`; LS-Kopie erst nach Commit und nur ohne neueren LS-Write entfernen; überholte Retries verwerfen. Zwischen `++_persistGeneration` und dem localStorage-Write nie ein `await`. Einzige Ausnahme vom Wächter: `statsIdbPut()` (fire-and-forget).
- **Dateien:** `utils/idb-tx.js`, `systems/spellslots/persistence.js`, `systems/backups.js`, `features/soundboard/soundboard-idb.js`, `systems/file-backup/file-backup-permissions.js`, `features/dice-stats/dice-stats-idb.js`, `systems/campaign-manager/campaign-manager.js`, `core/init.js`
- **Tests:** `tests/unit/idb-transaction-commit.test.js` (C1, P1–P8b, A1, E1, Geschwister, Kampagnen-Löschung, Wächter G1), `tests/e2e/features/persistence.spec.js` („IndexedDB-Commit-Abbruch (R04)“)

### Backup-Restore verlor Kampagnenfelder, Backup-Liste mischte Kampagnen (R01/R05, U4)

- **Problem (R01):** `restoreBackup()` filterte jedes Auto-Backup gegen ein veraltetes, lokal gepflegtes `defaultD` (15 Schlüssel, über `sanitizeBackupData()`) und leerte `D` vorher komplett. `sessionNotes`, `quickNotes`, `settings`, `calendar`, `tags`, `bestiary`, `factions`, `sessionPreps`, `soundboard`, `randomTables`, `dmScreen*`, `partyGold`, `_nextId`, `_version` … verschwanden; die Initiative kam als `{entries, round}` zurück. Es lief keine Migration, es gab keinen Undo-Punkt, und der Erfolg wurde gemeldet, ohne auf `saveImmediate()` zu warten. `restoreFromFileBackup()` hatte eigene Lücken: ein `__proto__`-Schlüssel tauschte per `Object.assign` den Prototyp von `D`, `migrateData()` legte vor dem Auffüllen `settings = {levelingMode}` an (Standard-`settings` fielen weg), ein `'2.11'`-Stempel übersprang Migrationen, und der Undo-Punkt stand vor der Prüfung.
- **Problem (R05):** `getBackups()` mischte die gemeinsame localStorage-Liste aller Kampagnen ungefiltert dazu und gab sie bei einem IndexedDB-Fehler roh zurück; entdoppelt wurde vor dem Filtern (ein fremdes Backup mit gleichem Zeitstempel verdeckte ein eigenes), begrenzt nach dem Zusammenführen (fremde Backups verdrängten eigene). `restoreBackup()` bekam eine **Listenposition**, löste sie gegen eine frisch berechnete Liste auf (driftet, sobald ein neues Auto-Backup dazukommt) und prüfte die Kampagne nie; das Modal nannte keine Kampagne. So konnte die aktive Kampagne durch eine fremde ersetzt werden.
- **Ursache:** Eigene Schlüssellisten statt des gemeinsamen Normalisierers; Kampagnenfilter nur auf einer der beiden Quellen; eine flüchtige Position als ID.
- **Fix:** Beide Restore-Pfade laufen über `normalizeCampaignData()` (U2) und den gemeinsamen Schluss `applyRestoredCampaign(data, source)` in `systems/backups.js`: Undo-Punkt „Backup wiederhergestellt“ → Audio stoppen → `replaceCampaignData(D, …)` → `validateDataIntegrity()` → `reviveReferencedSoundBlobs()` → rendern (Fehler nur loggen) → `await saveImmediate()`; „✅ Backup wiederhergestellt“ nur bei `{success: true}`. Bis zur fertigen Normalisierung bleiben `D`, Undo-Stapel und Speicher unberührt. `sanitizeBackupData()` und `defaultD` sind entfernt. Leseseite: `isValidBackupRecord()` (Zeitstempel = sichere positive Ganzzahl, `data`/`campaignKey` Strings) und `isBackupOfCampaign()` filtern **beide** Quellen vor dem Zusammenführen, `sortAndLimitBackups()` entdoppelt und begrenzt erst danach; ohne aktiven Schlüssel liefert `getBackups()` `[]` (`index.getAll(undefined)` wäre **alles**). Alt-Backups ohne `campaignKey` werden nicht angeboten (Entscheidung D1). `data-id` im Modal ist der Zeitstempel; `findBackupForRestore()` löst ihn auf und prüft die Kampagne erneut; das Modal und die Rückfrage nennen die Kampagne (`getCampaignDisplayName()` in `campaign-manager.js`). Kein Sicherungs-Backup vor dem Restore: dessen Rotation würde genau die noch nicht probierten Backups verdrängen — Strg+Z ist das Netz.
- **Audio:** `removeAudioFile()` setzt nur einen Grabstein, und `_cleanupStaleTombstones()` löscht Grabsteine früherer Sitzungen beim nächsten Start endgültig. Ohne `reviveReferencedSoundBlobs()` spielte eine wiederhergestellte Szene jetzt und verlor ihr Audio still in der nächsten Sitzung; fehlende Dateien meldet jetzt ein Warnhinweis.
- **Regel:** Restore nie gegen lokale Schlüssellisten filtern; erst vollständig normalisieren, dann Undo-Punkt, dann ersetzen; Erfolg erst nach bestätigtem Speichern melden; Fehler nach dem Ersetzen (Rendern) sind kein „Backup fehlerhaft“. Backups immer über die aktive Kampagne filtern — in **jeder** Quelle, vor dem Zusammenführen — und nie über eine Listenposition adressieren.
- **Dateien:** `systems/backups.js`, `systems/file-backup/file-backup-ui.js`, `systems/campaign-manager/campaign-manager.js`, `types/globals.d.ts`, `systems/backups.d.ts`
- **Tests:** `tests/unit/backup-restore-roundtrip.test.js` (R1–R9), `tests/unit/backups-campaign-scope.test.js` (B1–B12), `tests/unit/file-backup-restore.test.js`, `tests/unit/backups.test.js`, `tests/e2e/features/backup-restore.spec.js`

### Auto-Backup übersprang gültige Kampagnen, Sicherheitskopie war eine Behauptung (R10/R05-Schreibseite, U5)

- **Problem (R10):** `createAutoBackup()` brach ab, sobald `characters`, `npcs` und `quests` leer waren. 20 der 23 Inhaltskategorien (Wiki, Orte, Session-Notizen, Session-Vorbereitung, Bestiarium, Soundboard-Szenen, Kalender-Ereignisse …) bekamen nie ein Backup. „Alle Daten löschen“ meldete bei einer reinen Wiki-Kampagne „💾 Sicherheitskopie erstellt“, schrieb keine, entfernte nur den localStorage-Schlüssel (im IndexedDB-Modus holte `load()` die Kampagne zurück) und startete einen Backup-Write erst nach dem Entfernen und dem geplanten Reload. Die beiden Import-Pfade meldeten die Sicherheitskopie ebenfalls unbedingt; ihr `try/catch` war tot, weil eine `async`-Funktion nie synchron wirft. Leerlauf-Ticks schrieben identische Kopien, und weil die Sitzungsuhr `D.lastSessionDuration` im selben 5-Minuten-Takt ändert, rotierte die Sicherheitskopie vor einem überschreibenden Import nach 25 Minuten heraus.
- **Problem (R05, Schreibseite):** Die localStorage-Rückfallliste deckelte **alle** Kampagnen gemeinsam auf `MAX_BACKUPS` — eine Kampagne verdrängte die Backups einer anderen. Der Quota-Zweig rief `remove()` auf den ganzen Listenschlüssel auf und löschte damit die Backups aller Kampagnen; scheiterte der Neuversuch auch, blieb gar nichts.
- **Ursache:** Eine dritte, private Kopie der Regel „was zählt als Inhalt“ statt der gemeinsamen, SEC-06-geprüften `hasCampaignContent()`; kein Rückgabewert, also keine ehrliche Meldung; keine Änderungsprüfung; eine globale statt kampagnenweise Deckelung.
- **Fix:** `createAutoBackup(options)` liefert `'written' | 'unchanged' | 'skipped-empty' | 'failed'`. Ohne gültigen Schlüssel (`getActiveCampaignKey()`) wird nichts geschrieben oder aufgeräumt. Die Inhaltsregel ist `window.hasCampaignContent` (zur Aufrufzeit gebunden, fehlt sie: sichern). Alles bis einschließlich `JSON.stringify(D)` läuft synchron beim Aufruf — darauf verlassen sich die Sicherheitskopie-Aufrufer. `saveBackupToIndexedDB()` vergleicht nur mit der **neuesten** Zeile (nach einem Undo auf einen älteren Stand wird dieser erneut geschrieben) und schützt beim Rotieren die neueste Sicherheitskopie (`kind: 'safety'`, Zeilen ohne `kind` zählen als `'auto'`). localStorage-Rückfall `writeLocalBackup()`: höchstens `MAX_LS_BACKUPS_PER_CAMPAIGN` (2) Einträge der schreibenden Kampagne, Budget `LS_BACKUP_BUDGET_CHARS` für die ganze Liste, Verdrängen nur bei Budgetüberschreitung oder Quota-Fehler in der Reihenfolge Waisen → fremde ältere → eigene ältere → fremde neueste; das neue Backup weicht nie; scheitert alles, bleibt die gespeicherte Liste byte-identisch. Geschrieben wird über `StorageAPI.setQuiet()` (wie `set()`, ohne „Speicher voll!“-Toast je Versuch). `reportSafetyBackup()` meldet das echte Ergebnis („erstellt“, „vorhanden“, Warnung, bei leerer Kampagne nichts). `clearStorage()` ist `async`: erst die committete Sicherheitskopie (scheitert sie, fragt ein zusätzlicher Dialog nach), dann `removeCampaignData()` für **beide** Kopien, Reload erst danach. Entscheidung D2 = A: `deleteCampaign()` entfernt nach dem erfolgreichen Entfernen der Daten per `purgeCampaignBackups(key)` auch die Auto-Backups dieser Kampagne, der Bestätigungstext sagt es.
- **Regel:** Für „enthält Nutzerdaten“ gibt es genau eine Definition: `hasCampaignContent()`. Wer dort einen Schlüssel ausschließt, nimmt ihn auch aus der Auto-Backup-Abdeckung. Eine Sicherheitskopie wird nur gemeldet, wenn sie geschrieben ist, und vor einer destruktiven Aktion abgewartet, wenn danach etwas entfernt wird. Eine gemeinsame Backup-Liste nie als Ganzes löschen, nie unter einem ungültigen Schlüssel schreiben oder aufräumen (`index.getAll(undefined)` trifft alle Kampagnen).
- **Bekannte Grenzen:** Kampagnen, deren einzige Arbeit in eigenen Zufallstabellen oder DM-Screen-Profilen steckt, bekommen weiterhin kein Auto-Backup (diese Schlüssel sind bewusst ausgeschlossen). Alt-Einträge der localStorage-Liste ohne `campaignKey` (nach D1 weder angezeigt noch wiederherstellbar) fallen beim nächsten Rückfall-Write weg.
- **Dateien:** `systems/backups.js`, `utils/basic.js`, `systems/spellslots/import-export.js`, `systems/campaign-manager/campaign-manager.js`, `systems/migration/migration-wizard.js` (nur Kommentare), `systems/backups.d.ts`, `utils/basic.d.ts`, `types/globals.d.ts`
- **Tests:** `tests/unit/backups-autobackup.test.js` (T1–T18), `tests/unit/idb-transaction-commit.test.js` (Geschwister backups.js angepasst)

### Überschreibender Import mischte statt zu ersetzen, Kampagnenanlage war nicht atomar (R03/R07, U6)

- **Problem (R03):** Der Zweig „Aktuelle Kampagne überschreiben“ in `importDataGlobal()` mischte die Datei per `Object.assign` in `D`. Was in der Datei fehlte (Fraktionen, Schnellnotizen, Sitzungsvorbereitungen, Story-Bögen …), blieb aus der alten Kampagne stehen — auch `_nextId`, weil jeder Export ihn entfernt; der gespeicherte Zähler lag danach unter den importierten IDs. `_version` wurde gelöscht und `migrateData()` lief nie: Alt-Exporte blieben unmigriert und wurden mit aktuellem Stempel gespeichert (auch nach dem Neuladen nie mehr migriert). Falsche Typen (`npcs: 'x'`), Typ-Exporte (`_dataType`), Umzugs-/Audio-Exporte (`_exportType`) und fremdes JSON gelangten ungeprüft in `D`. Doppelte oder fehlende IDs aus der Datei blieben stehen, `calendar.events[].beschreibung` wurde an der Import-Grenze nicht bereinigt, und „Abbrechen“ (auch Escape) war der zerstörerische Zweig. `executeImport()` rief ein nirgends definiertes `window.getNextId` (Zusammenführen warf) bzw. ließ den Zähler veraltet (Ersetzen). `validateDataIntegrity()` reparierte Doppel-IDs nur in 13 Top-Level-Sammlungen (nicht in `calendar.events`/`initiative.combatants`, wo `timeline-crud.js` beim Löschen jedes Ereignis mit derselben ID entfernt) und vergab numerische Zeichenketten-IDs (`'5'`) neu, statt sie umzuwandeln — `quest.giverId: 5` lief ins Leere.
- **Problem (R07):** „Als neue Kampagne importieren“ und `createCampaign()` schrieben den Kampagnenindex (der Import stellte dabei `active` um) **vor** den Daten, nur über localStorage und ohne Rückbau. Scheiterte der Datenwrite, verwies der Index auf eine Kampagne ohne Daten und der nächste Start öffnete sie leer; scheiterte der Indexwrite, blieben verwaiste Daten, dazu eine Erfolgsmeldung und ein Neuladen. Große Importe hatten keinen IndexedDB-Rückfall (über 5 MB landeten sogar in localStorage). `switchCampaign()` lud trotz gescheitertem Indexwrite neu. `createCampaign()` und der Import schrieben handkopierte Default-Zustände (Phantom `items`, acht fehlende Schlüssel). `importFullExport()` schrieb Kampagnendaten ohne `_ts` — `load()` hielt sie für einen veralteten Schatten und nahm eine ältere IndexedDB-Kopie.
- **Zusätzlich gefunden:** Ein `<input type=file>` feuert beim Auswählen `input` **und** `change`; `ui/event-delegation.js` ruft `data-action="import-data-global"` für beide auf. Jede Dateiauswahl startete den Import zweimal (zwei Dialogfolgen, zwei Importe derselben Datei).
- **Ursache:** Kein gemeinsamer Weg „prüfen → bereinigen → migrieren → Standardwerte → IDs/Zähler → erst dann ersetzen“; mehrstufige Speicheränderungen in falscher Reihenfolge ohne Ergebnisprüfung; ein eigener, zweiter Schreibpfad neben `save()`.
- **Fix (R03):** `prepareCampaignImport(imp)` in `systems/spellslots/import-export.js` läuft **vor jedem Dialog** und berührt nichts Globales: Plausibilität (kein Objekt → „Ungültige Importdatei“; `_dataType`/`data`-Array → „Einzel-Export – bitte im jeweiligen Reiter importieren“; jedes `_exportType` → „Umzugs- oder Audio-Export – bitte über den Umzugs-Assistenten importieren“; keine bekannte Sammlung als Array → „Keine Kampagnendaten gefunden“), Alt-Charaktere (`migrateImportedCharacters()`), Bereinigung aller HTML-Felder **einschließlich** `calendar.events`, dann `normalizeCampaignData()` (U2: Typprüfung, Migration wie `load()`, `initializeData()`-Grundgerüst, eindeutige IDs, Zähler). Unlesbares JSON meldet „Datei ist kein gültiges JSON“. Entscheidung D3 = A: zwei native Dialoge — „OK = Als NEUE Kampagne importieren / Abbrechen = weitere Optionen“, danach „Aktuelle Kampagne „…“ durch den Import ERSETZEN? … OK = Ersetzen / Abbrechen = Import abbrechen“; Abbrechen/Escape verändert nie etwas. Überschreiben: Undo-Punkt → Sicherheitskopie → Audio stoppen → `replaceCampaignData(D, prepared.data)` (App-Einstellungen `settings`/`dmScreen*` bleiben, wenn die Datei sie nicht mitbringt) → `validateDataIntegrity()` → rendern → `save()`; neu vergebene IDs meldet ein Warnhinweis. `executeImport()`: Zusammenführen über `nextId(type)`, Ersetzen hebt den Zähler per `validateAndRepairNextId(undefined, [type])`. `validateDataIntegrity()` ruft vor der ID-Prüfung `normalizeEntityIds(D)` auf (eine Reparaturzeile je Änderung); für gültige, eindeutige Zahlen-IDs ändert das nichts — die E2E-Seeds lösen weiterhin keinen Reparatur-`save()` aus. Ein laufender Import ignoriert den zweiten Aufruf derselben Dateiauswahl.
- **Fix (R07):** `writeCampaignData(key, data)` in `persistence.js` schreibt nach den Regeln von `save()` (über 5 MB nur IndexedDB; sonst localStorage + `_ts`; localStorage-Fehler → IndexedDB-Rückfall), ohne UI-Nebenwirkungen, wirft nie; der IndexedDB-Erfolg ist belastbar, weil er erst nach dem Commit meldet (U3). `campaign-manager.js`: `readCampaignIndexStrict()` ersetzt einen unlesbaren Index nie durch einen Standardindex; `newCampaignKey()` wählt einen Schlüssel, der weder im Index noch in localStorage belegt ist (ein Rückbau löscht nie fremde Daten); `addCampaignWithData(name, data, {activate})` schreibt Daten zuerst, liest den Index danach frisch und schreibt ihn **einmal** (Eintrag, bei `activate` auch `active`); jeder Fehlschlag nimmt die Daten zurück. `createCampaign()` ist `async`, baut auf `initializeData()` auf, deckelt den Namen auf 100 Zeichen und ignoriert Doppelklicks während einer laufenden Anlage; `switchCampaign()` lädt nur nach gespeichertem Index neu. `importFullExport()` schreibt je Kampagne den `_ts`-Begleiter.
- **Regel:** Import heißt: zuerst vollständig vorbereiten (prüfen, bereinigen, normalisieren), erst dann fragen, und „Abbrechen“ ist nie zerstörerisch. Ersetzen heißt `replaceCampaignData()`, nie Mischen per `Object.assign`. Mehrstufige Kampagnenanlage: Daten vor Index, Index genau einmal, jeder Fehlschlag mit Rückbau; einen unlesbaren Index nie überschreiben. Wer Kampagnendaten in localStorage schreibt, schreibt `_ts` mit.
- **Bekannte Grenzen:** Neu vergebene IDs aus der Datei lassen Referenzen darauf (z. B. `giverId`) auf die alte ID zeigen — der Warnhinweis nennt die Anzahl. Zwischen dem frischen Lesen und dem Schreiben des Index bleibt ein kurzes Fenster für einen parallelen Tab (localStorage kennt kein Compare-and-Swap). `switchCampaign()` und `deleteCampaign()` lesen den Index weiterhin nachsichtig.
- **Dateien:** `systems/spellslots/import-export.js`, `systems/campaign-manager/campaign-manager.js`, `systems/spellslots/persistence.js`, `render/helpers.js`, `systems/migration/full-export.js`, `types/globals.d.ts`
- **Tests:** `tests/unit/campaign-import-ids.test.js` (C1–C15), `tests/unit/campaign-index-atomicity.test.js` (T1–T14), `tests/unit/import-sanitization.test.js` (Strukturanker neu), `tests/unit/full-export.test.js` (Mock `set`), `tests/e2e/features/import-security.spec.js`

### Schliessen oder Neuladen eines veralteten Tabs überschrieb neuere Daten (R02, U7)

- **Problem:** `systems/avatars.js` schrieb bei **jedem** `beforeunload` `JSON(window.D)` in den aktiven Kampagnenschlüssel — ohne Änderungs-, Revisions- oder Konfliktprüfung, ohne `_ts`, am IndexedDB-Modus vorbei. Ein unveränderter Tab A machte beim Schließen die gerade in Tab B gespeicherte Arbeit zunichte; B's „Neu laden“ lud danach den alten Stand. `location.reload()` und Navigation feuern `beforeunload` ebenfalls: „Alle Daten löschen“, der Umzugs-Import und das Löschen einer Kampagne wurden beim anschließenden Neuladen durch den alten In-Memory-Stand rückgängig gemacht (die gelöschte Kampagne entstand als Waise neu). Im IndexedDB-Modus (> 5 MB) scheiterte der Write mit „Speicher voll!“ im sterbenden Tab (ausstehende Änderungen verloren) oder hinterließ bei Umlauten einen > 5 MB großen localStorage-Schatten ohne `_ts`. Der Handler war zugleich der einzige Flush des 300-ms-Debounce. Automatische Saves (Session-Timer, Reparatur nach `load()`, `initRandomTables()`, Markdown-Onboarding) schrieben aus einem veralteten Tab zurück, und nach einem gescheiterten `load()` überschrieben `initRandomTables()` und das Markdown-Onboarding (`initMarkdownSettings()`: Flag setzen plus `save()` 2 s nach dem Start, bei jedem Start mit unladbarer Kampagne) die beschädigten, aber rettbaren Rohdaten mit `initializeData()`. Im Loader-Modus lösten die funktionslokalen `const STORAGE_KEY = window.STORAGE_KEY;` auf den Schlüssel `"undefined"` auf (nur das Bündel funktionierte, weil build.py diese Zeilen entfernt).
- **Ursache:** Die Persistenz wusste nicht, was der Tab zuletzt gelesen oder geschrieben hatte, und es gab einen zweiten, blinden Schreibpfad neben `save()`. Die Konfliktanzeige war nur ein Banner. Die Umzugs-/Lösch-Abläufe verließen sich darauf, dass ein Reload nicht schreibt.
- **Fix:** `systems/spellslots/persistence.js` führt eine **Baseline** (`setPersistBaseline()` in `load()`, `_onPersistSuccess()` an jedem Erfolgspunkt von `save()`/`saveImmediate()`): Schlüssel, localStorage-Wert danach, `_rev`-Marker (bei jedem Save neu, leise über `StorageAPI.setQuiet()`), Snapshot von `D`. `isCampaignStorageStale(key)` ist wahr ohne passende Baseline, nach einem gemeldeten fremden Save (`markExternalCampaignWrite()` aus `systems/undo.js`: BroadcastChannel **und** storage-Ereignisse auf den Schlüssel, `<key>_rev` oder `clear()` — auch ohne BroadcastChannel, auch im IndexedDB-Modus; andere Kampagnen werden ignoriert), bei anderem `_rev` oder anderem Inhalt (fängt Schreiber ohne `_rev`). `persistOnUnload()` (über `initUnloadPersistence()` in `core/init.js` direkt nach `load()`) schreibt nie blind: gesperrt oder ohne Baseline → nichts; unverändert → nichts; veraltet → nie schreiben; > 5 MB → IndexedDB-Save anstoßen; sonst synchron nach localStorage mit `_ts` und `_rev`. Die native Rückfrage (Entscheidung D5 = A) kommt nur für einen ausdrücklich angestoßenen Save (ausstehend, laufend, gescheitert) in einem veralteten Tab oder im IndexedDB-Modus — harmlose Nebenänderungen (Würfelhistorie, Lazy-Inits) verfallen in einem veralteten Tab still. Ein ausstehender Timer wird erst verworfen, wenn wirklich geschrieben wird („Bleiben“ lässt ihn laufen). `pagehide` und `visibilitychange` (hidden) ziehen einen ausstehenden Save vor (`flushPendingSave()`, nicht in einem veralteten Tab), damit große Kampagnen schon während der Nutzung sicher sind. Automatische Saves laufen über `saveAutomatic()` (nur nicht gesperrt und nicht veraltet; D4 = A: ausdrückliche Saves bleiben last-writer-wins, das Banner ist die Warnung). `retireCampaignWrites()` ist eine **harte** Schreibsperre für `save()`, `saveImmediate()` (`{success:false, error:'retired'}`), den Debounce-Körper `_persistNow()`, `saveAutomatic()` und das Verlassen; sie verwirft einen ausstehenden Save synchron und wartet laufende IndexedDB-Writes ab (höchstens 5 s). `clearStorage()` und `deleteCampaign()` sperren **vor** dem Entfernen (Abbruchpfade: `resumeCampaignWrites()`), der Umzugs-Assistent direkt nach `importFullExport()`. `switchCampaign()` schreibt einen ausstehenden Save fest und wartet den Commit ab (`flushPendingSaveAndSettle()`), `resetNavOrder()` wartet `saveImmediate()` ab. Der Schlüssel kommt überall aus `getActiveCampaignKey()`; ohne Schlüssel speichert nichts (`'no-campaign-key'`).
- **Regel:** Nie unbedingt beim Verlassen schreiben. `location.reload()` und jede Navigation feuern `beforeunload` — ein Reload schützt nichts. Automatisch nur über `saveAutomatic()`, nie aus einem veralteten Tab — jeder Save, um den niemand gebeten hat (Timer, Init, Onboarding, Reparatur), denn ein blankes `save()` prüft die Baseline nicht und schreibt auch nach einem gescheiterten `load()`. Vor jeder destruktiven oder umziehenden Speicheränderung zuerst `retireCampaignWrites()`, dann entfernen/ersetzen. Kampagnenschlüssel nur über `getActiveCampaignKey()`.
- **Bekannte Grenzen:** Scheitert der `_rev`-Write, weil localStorage voll ist, erkennt ein Tab im IndexedDB-Modus fremde Saves nur noch über BroadcastChannel (festgehalten in U9d). Die Baseline hält bis zu zwei kampagnengroße Zeichenketten im Speicher. Browser zeigen die Rückfrage nur nach einer Nutzeraktivierung; E2E-Tests, die einen Tab veraltet und geändert neu laden, brauchen einen Dialog-Handler. Im Loader-Modus liegt die Standard-Kampagne jetzt unter `dnd-tracker-v4` statt unter `"undefined"` (Dev-Daten unter dem alten Schlüssel sind nicht mehr sichtbar); das Bündel ist unverändert.
- **Dateien:** `systems/spellslots/persistence.js`, `systems/spellslots/quick-roll.js`, `systems/avatars.js`, `systems/undo.js`, `core/init.js`, `core/data.js` (nur Kommentar), `systems/spellslots/import-export.js`, `systems/campaign-manager/campaign-manager.js`, `systems/migration/migration-wizard.js`, `systems/session-timer.js`, `features/random-tables.js`, `ui/editors/markdown-shortcuts.js`, `ui/lazy-loading.js`, `types/globals.d.ts`
- **Tests:** `tests/unit/unload-persistence.test.js` (U1–U22, K1–K3, S1–S4; dazu U4b–U4d: Sicherheitsnetz eines Tabs, der schon selbst gespeichert hat, auch im IndexedDB-Modus; U9b–U9e: Veraltung im IndexedDB-Modus, wo die Inhaltspruefung blind ist — `_rev` allein, BroadcastChannel allein bei vollem localStorage, storage-Ereignis ohne BroadcastChannel; U16/U16b: Markdown-Onboarding) mit der Mehr-Tab-Werkbank `tests/unit/helpers/multi-tab-harness.js` (IndexedDB-Double jetzt in `tests/unit/helpers/fake-idb.js`), `tests/unit/migration-wizard.test.js` (Schreibsperre nach dem Import), `tests/e2e/features/multi-tab-persistence.spec.js`

### Konflikt-Neuladen renderte vor dem Laden, meldete Fehlschläge als Erfolg (R06, U8)

- **Problem:** `reloadData()` („🔄 Neu laden“ im Konflikt-Banner) rief das asynchrone `load()` **ohne `await`** auf. Im IndexedDB-Modus (localStorage-Schlüssel nach einem > 5-MB-Save entfernt) und im Stale-Shadow-Modus (localStorage-Wert ohne `_ts`) hält `load()` an einem IndexedDB-`await`; `renderAll()` malte im nächsten Frame den **alten** Stand, Banner und „🔄 Daten neu geladen“ kamen vor dem Lesen, danach renderte nichts mehr (aktive Ansicht und `#quick-notes` ohnehin nie). Im normalen localStorage-Modus läuft `load()` ohne `await` durch — deshalb fiel es nie auf. `load()` schluckte jeden Fehler (IndexedDB-Fehler, beschädigtes JSON, nichts gespeichert) und löste `undefined` auf, `reloadData()` bestätigte immer. Es nutzte `dismissConflict()` („Ignorieren“), das jeden späteren Konflikt der Sitzung stummschaltete. Ein vor dem Klick gestellter `save()` feuerte im Ladefenster und schrieb den verdrängten Stand über die Daten des anderen Tabs (samt Broadcast). Strg+Z stellte danach die alte Linie unter dem Namen der letzten lokalen Aktion wieder her und speicherte sie. Ein Doppelklick lud zweimal.
- **Ursache:** Ein asynchroner Ladevorgang wurde wie ein synchroner behandelt, ohne Ergebnisvertrag; das Neuladen war nur „Banner weg + Toast“, ohne Kontrolle über ausstehende Saves, Undo-Linie und Zustand außerhalb von `renderAll()`.
- **Fix:** `load(options)` (`systems/spellslots/quick-roll.js`) liefert ein **LoadResult** `{ok, applied, source, reason?, degraded?, warning?, error?}` auf jedem Pfad (`no-key`, `not-found`, `idb-error`, `parse`, `invalid`, `abandoned`, `exception`); `core/init.js` ignoriert es. `strictIdb` (Neuladen): ein gescheitertes IndexedDB-Rohlesen im Stale-Shadow-Zweig ist ein Fehlschlag **vor** dem Übernehmen — beim Start geht es wie bisher mit dem Schatten weiter (`degraded: true`). Ein echter IndexedDB-Lesefehler bei leerem localStorage (nicht `NOT_FOUND` — `loadFromIndexedDBFallback()` markiert „nichts gespeichert“ jetzt mit `code = 'NOT_FOUND'`) meldet „⚠️ Kampagne konnte nicht aus IndexedDB gelesen werden“ und setzt **keine** Baseline, damit automatische Saves die ungelesene Kampagne nicht überschreiben (R02). `shouldApply()` wird unmittelbar vor dem Übernehmen gefragt. Wirft die Nachbearbeitung (Integrität, Vorberechnung) nach dem Übernehmen, ist das `ok` mit `warning` — der Stand IST übernommen. `persistence.js`: `runWithSavesSuspended(fn)` stellt entprellte Saves zurück (der Timer plant sich neu ein, `flushPendingSave()` zieht nicht vor), `cancelPendingSave()` verwirft einen ausstehenden. `features/render-dashboard.js`: `renderAfterDataReplace()` — Theme/Layout neu anwenden, `renderAll()`, die aktive `TAB_RENDER_REGISTRY`-Ansicht, `#quick-notes`; jeder Schritt einzeln abgesichert, kein Markup. `systems/undo.js`: `reloadData()` teilt einen laufenden Lauf (Doppelklick), lehnt nie ab (der `call`-Dispatcher ignoriert Promises) und lädt mit `load({strictIdb: true, shouldApply})` unter zurückgestellten Saves, begrenzt durch einen 10-s-Wächter (`initIndexedDB` kennt kein `onblocked`; danach endet die Sperre, ein spätes Lesen wird verworfen). Nach dem Übernehmen: ausstehenden Save verwerfen, Undo-Schritt „Neu laden (anderer Tab)“ (Entscheidung D6 = A, Strg+Z stellt den Stand vor dem Neuladen wieder her), `encounterRound` nachziehen, vollständig neu zeichnen; hat dieser Tab im Ladefenster doch gespeichert (`saveImmediate`, z. B. per Strg+Z), wird der geladene Stand neu festgeschrieben — außer ein fremder Save kam inzwischen an. Erfolg: Erkennung wieder scharf (`conflictDismissed = false`), Banner schließen über `hideConflictBanner()` (ohne Stummschalten) — außer ein fremder Save derselben Kampagne kam während des Ladens an (`_conflictSignalSeq`); dann bleiben Banner und Veraltung (automatische Saves gesperrt). Fehlschlag: ehrliche Fehlermeldung, Banner bleibt, der zurückgestellte lokale Save wird danach geschrieben. „✕ Ignorieren“ schaltet weiterhin für die Sitzung stumm.
- **Regel:** Ein asynchrones Laden erst abwarten, dann rendern und bestätigen; nie „Erfolg“ melden, ohne ein Ergebnis zu prüfen. Wer `D` als Ganzes ersetzt, zeichnet über `renderAfterDataReplace()` neu (nicht nur `renderAll()`), stellt entprellte Saves währenddessen zurück und setzt einen Undo-Punkt. Ein gelöster Konflikt macht die Erkennung wieder scharf — nur „Ignorieren“ schaltet stumm.
- **Bekannte Grenzen:** `load()` mischt weiterhin per `Object.assign` in `D` (Schlüssel, die nur im verdrängten Stand existieren, bleiben) — gehört zum gemeinsamen Übernahmepfad aus R01/R03. `saveImmediate()` ist nicht zurückgestellt (das Neu-Festschreiben schließt die Lücke, im seltenen Fall mit einem zusätzlichen Write). Änderungen im Ladefenster gehen bei Erfolg bewusst verloren (Strg+Z holt sie zurück). Das Neuladen kann bei „nichts gespeichert“ oder Lesefehler zweimal melden (IndexedDB-Warnung und Fehlschlag). Die aktive Liste wird zweimal gezeichnet (synchron und im rAF) — vernachlässigbar.
- **Dateien:** `systems/undo.js`, `systems/spellslots/quick-roll.js`, `systems/spellslots/persistence.js`, `features/render-dashboard.js`, `types/globals.d.ts`
- **Tests:** `tests/unit/conflict-reload.test.js` (T1–T9h; Mehr-Tab-Werkbank mit echtem `renderAll()` und rAF-Warteschlange; das IndexedDB-Double in `tests/unit/helpers/fake-idb.js` kann Lese-Requests jetzt zurückhalten oder scheitern lassen — der Schnappschuss bei der Erstellung ist in der Korrekturrunde F1 durch die echte Transaktionsreihenfolge ersetzt, siehe unten), `tests/e2e/features/conflict-reload.spec.js`

### Service Worker: Cache-Namensraum pro App+Scope (R08, U9)

- **Problem:** `sw.js` behandelte die Cache Storage wie sein Eigentum. Sie ist aber pro **Origin** geteilt: die App läuft als GitHub-Pages-Projektseite auf `<user>.github.io` (neben allen anderen Pages-Projekten desselben Nutzers), der CI-Smoke-Job und `npm run serve` unter `localhost:8000`. `activate` löschte **jeden** Cache, dessen Name nicht `CACHE_VERSION` war — fremde Apps und andere Tracker-Pfade derselben Origin verloren ihren Offline-Cache. `fetch` und der Offline-Fallback suchten mit `caches.match()` **ohne** `cacheName` in allen Caches der Origin: fremde Antworten (etwa ein fremdes `manifest.webmanifest` oder eine fremde HTML-Seite) konnten ausgeliefert werden, im Warte-Fenster eines Updates auch die der neuen Version (gegen D-03). Fehlte die HTML-Seite offline in jedem Cache, löste der Fallback `undefined` auf — `respondWith(undefined)` scheitert mit einem TypeError. Ein abgelehntes `caches.delete()` übersprang `clients.claim()`, der Update-Banner-Ablauf (`controllerchange`) wartete dann auf seinen 3-s-Notnagel. `build.py` ersetzte das **erste** `'dnd-tracker-v3'` in `sw.js` und tat still nichts, wenn es fehlte — ein Production-Build ohne Bump ließe den Cache-First-SW nach dem Deploy die alte App ausliefern. `sw.js` stand seit dem Initial-Commit ohne Begründung in den globalen ESLint-Ausschlüssen.
- **Ursache:** Der Cache-Name war nur eine Versionskennung, ohne App- oder Pfadkennung; deshalb war die Bereinigung als „alles außer meinem aktuellen Namen“ geschrieben und die Suche origin-weit.
- **Fix:** Eigener Namensraum `CACHE_NAME = dnd-tracker:<encodeURIComponent(Scope-Pfad)>:<CACHE_VERSION>` (Scope aus `self.registration.scope`, sonst aus dem Skriptpfad; `encodeURIComponent` maskiert `/` und `:`). Zeile 4 (`const CACHE_VERSION = 'dnd-tracker-v3';`) bleibt unverändert und das **einzige** Vorkommen des Platzhalters. `install` schreibt in `CACHE_NAME` (CR-09 unverändert: ein Kern-Asset-404 lässt die Installation scheitern, optionale Assets nicht; weiterhin kein `skipWaiting`). `activate` löscht nur `isObsoleteOwnCache()`: ältere Caches des eigenen Namensraums und den **eigenen** Alt-Cache von vor R08 (`/^dnd-tracker-v\d/`), erkannt über **genau** die eigene HTML-URL dieses Scopes per `caches.match(url, {cacheName})` — kein URL-Präfix (bei Scope `/` wäre jede URL der Origin ein Treffer, verschachtelte Installationen ebenso) und kein `caches.open()` als Probe (legt fehlende Caches an). `.catch(() => {})` vor `clients.claim()`. `fetch` sucht und schreibt nur im eigenen, geöffneten Cache (`cache.put` unter `event.waitUntil`); offline kommt die HTML-Seite aus dem eigenen Cache, sonst `Response.error()`; Nicht-HTML weiterhin 503. `build.py`: `bump_sw_cache_version()` verlangt genau ein Vorkommen von `SW_CACHE_VERSION_PLACEHOLDER` und bricht sonst mit `[ABORTED]` und `sys.exit(1)` ab, bevor `dist/sw.js` oder das Bundle geschrieben wird. `eslint.config.js`: `sw.js` ist gelintet (0 Befunde); ein eigener Block (`sourceType: 'script'`) schaltet Fenster-Globals sowie generierte und von Hand gepflegte App-Globals (`APP_GLOBALS`) ab und erlaubt `self`, `caches`, `clients`.
- **Migration:** Beim ersten Deploy installiert der neue SW in den Namensraum-Cache und löscht bei der Aktivierung nur den eigenen Alt-Cache (`dnd-tracker-v2.6.1-<zeit>` mit `<scope>dnd-tracker-optimized.html`). Alt-Caches anderer Pfade und fremde Caches bleiben.
- **Regel:** Nie `caches.match()` ohne `cacheName` — gesucht wird im eigenen, per `caches.open(CACHE_NAME)` geöffneten Cache. Nie nach „Name ≠ aktuell“ löschen, nur im eigenen Namensraum. Das Platzhalter-Literal nie ein zweites Mal in `sw.js` schreiben (auch nicht in Kommentaren). Ein künftiger zweiter Cache (z. B. Laufzeit-Cache) muss dieselbe Versionsendung tragen oder in `isObsoleteOwnCache()` berücksichtigt werden, sonst löscht ihn jede Aktivierung.
- **Bekannte Grenzen:** Der Fix schützt **andere** Apps vor uns, nicht uns vor Apps, die selbst noch „alles außer meinem“ löschen: die können unseren Cache weiterhin entfernen. Dann legt der SW ihn beim nächsten Abruf leer neu an und füllt ihn aus dem Netz; offline liefert der HTML-Fallback `Response.error()` (Browser-Offline-Seite). Zwei Tracker-Installationen auf einer Origin bleiben trotzdem unsicher: sie teilen localStorage `dnd-tracker-v4` und die IndexedDB `dnd-tracker-db` — R08 betrifft nur die Caches. `dist/sw.js` entsteht nur im Production-Build; ein Dev-Build lässt eine veraltete Kopie stehen.
- **Dateien:** `sw.js`, `build.py`, `eslint.config.js`
- **Tests:** `tests/unit/service-worker-cache.test.js` (S1–S11 und Quelltext-Wächter; echter `sw.js` per vm mit spezifikationsnaher, von mehreren SW-Instanzen geteilter Fake-Cache-Storage: `match` mit `cacheName` sucht nur dort und legt nie an, Aufrufe ohne `cacheName` werden gezählt), `tests/build/test_build_deduplication.py` (`TestServiceWorkerCacheBump`, inkl. Abbruch eines Production-Builds ohne Platzhalter), `tests/unit/lint-gate.test.js` (sw.js gelintet, 0 Befunde), `tests/e2e/smoke.spec.js` (echter gebauter SW über http; unter `file://` übersprungen, läuft im CI-Smoke-Job)

## Korrekturrunde zum Code-Review 2026-09-21

### IndexedDB-Double plante Transaktionen falsch und verdeckte damit echte Rennen (F1, Testinfrastruktur)

- **Problem:** `tests/unit/helpers/fake-idb.js` — die gemeinsame Werkbank von `conflict-reload`, `unload-persistence` und `idb-transaction-commit` — verkettete **nur** readwrite-Transaktionen (`rwKette`). Eine readonly-Transaktion startete sofort bei der Erstellung, ohne auf frühere, noch offene readwrite-Transaktionen zu warten, und ein gehaltener Lese-Request (Politik `halten()`) nahm seinen Schnappschuss bei der **Erstellung**. Folge: ein Schreibvorgang, der während eines gehaltenen Lesens erstellt wurde, schrieb sofort fest — im Browser unmöglich. Genau dieses Muster ist das R06-Rennen (eigener `saveImmediate()` im Ladefenster des Konflikt-Neuladens): das Double zeigte es als in Ordnung, obwohl IndexedDB danach den verdrängten Stand trug und `D` den geladenen. Umgekehrt las eine readonly-Transaktion, die nach einem noch offenen readwrite erstellt wurde, den Stand **vor** dessen Commit.
- **Ursache:** Die Serialisierung war als „readwrite nicht parallel zueinander“ gedacht, nicht als die Planungsregel von IndexedDB. Der Schnappschuss war der Behelf, mit dem die fehlende Wartebeziehung für gehaltene Lesevorgänge kaschiert wurde.
- **Fix:** Eine Liste **aller** Transaktionen in Erstellungsreihenfolge (`alleTx`, je Eintrag `{ id, mode, erledigt, fertig }`). Bei der Erstellung werden die Blocker nach IndexedDB 3.0 (§transaction scheduling) bestimmt: readwrite wartet auf alle früher erstellten, noch nicht beendeten Transaktionen, readonly nur auf die früher erstellten readwrite; readonly untereinander laufen nebenläufig. Gestartet wird über `Promise.all(blocker.map(b => b.fertig)).then(() => naechsterTask(starten))`. `fertig` löst dort auf, wo vorher nur die readwrite-Kette freigegeben wurde — jetzt für **jeden** Modus und auf beiden Wegen, `commit()` und `abbrechen()`, damit eine abgebrochene Transaktion ihre Nachfolger nicht dauerhaft blockiert. Der Erstellungs-Schnappschuss in `neuerRequest()` ist entfallen: später erstellte Schreibvorgänge warten ohnehin hinter dem gehaltenen Lesen. Die `halten()`-Schnittstelle ist unverändert. Zwei Protokolleinträge (`tx.wait#…`, `tx.finished#…`) machen die Wartebeziehungen sichtbar; alle vorhandenen Protokoll-Prüfungen filtern per Regex und sind davon nicht betroffen.
- **Regel:** Ein Double, auf dem Rennen bewiesen werden, muss die Reihenfolge-Regel des Originals nachbilden, nicht nur seine Ergebnisse. Ein Schnappschuss, der eine fehlende Wartebeziehung ersetzt, macht das Double in genau dem Fall blind, für den es gebaut wurde. Bei jeder Erweiterung des Doubles gilt: jede Transaktion gibt ihre Nachfolger frei, auch eine abgebrochene — sonst hängt die Werkbank statt zu scheitern.
- **Bekannte Grenzen:** Das Double behandelt **jedes** Transaktionspaar als überlappend; der Store-Bereich wird ignoriert. Das ist strenger als die Spezifikation (die nur überlappende Bereiche serialisiert), aber nie falsch-freigebend — kein Test sieht damit eine Parallelität, die es im Browser nicht gibt. Eine Transaktion, die nie beendet wird (dauerhaft gehaltenes Lesen), lässt alle ihre Nachfolger warten; das entspricht IndexedDB und wird in den Tests bewusst genutzt. Diese Korrektur ist reine Testinfrastruktur — sie deckt das R06-Rennen erst auf; behoben wird es in F3.
- **Dateien:** `tests/unit/helpers/fake-idb.js` (nur Testinfrastruktur, kein Produktionscode)
- **Tests:** `tests/unit/fake-idb-scheduling.test.js` (S1–S6: Write hinter gehaltenem Lesen, readonly nach offenem readwrite, nebenläufige Lesevorgänge, serielle readwrite-Reihenfolge, Freigabe nach Abbruch des Lesens und des Writes); `tests/unit/conflict-reload.test.js`, `tests/unit/unload-persistence.test.js`, `tests/unit/idb-transaction-commit.test.js` unverändert grün (117/117)

---

## Known Technical Debt

### ui/editors/rich-text.js: document.execCommand() (21 Call-Sites)

- **Status:** Bekanntes Tech Debt - nicht kritisch
- **Details:** Rich-Text-Editor nutzt deprecated execCommand API für bold, italic, underline, insertHTML etc. an 21 Stellen in `ui/editors/rich-text.js`.
- **Bereits gefixt:** insertUnorderedList wurde durch manuelle DOM-Manipulation ersetzt
- **Risiko:** Gering - API ist deprecated aber funktioniert in allen aktuellen Browsern
- **Aufwand:** Hoch - Komplett-Ersatz durch Selection/Range API wäre umfangreich
- **Empfehlung:** Ablösung in eigener Phase; bei neuen Editor-Funktionen Selection/Range API bevorzugen

### testable-utils.js: Duplizierte Utility-Funktionen

- **Status:** Absichtlich - KEIN Bug
- **Details:** Enthält Kopien von esc(), sanitizeHTML(), debounce(), throttle() etc.
- **Grund:** Jest Tests benötigen CommonJS exports, Haupt-App nutzt globale Browser-Funktionen
- **Empfehlung:** Bei Änderungen an Originalfunktionen auch testable-utils.js aktualisieren

### Inline Event-Handler (onchange, oninput)

- **Status:** Abgeschlossen (Phase 1, Juni 2026) - Migration vollständig
- **Details:** Inline Handler vollständig auf data-action-Delegation migriert; 641 data-action-Attribute, 0 inline Handler verbleibend
- **Betroffene Dateien:** shops-core.js, npc-dialogs.js, encounters-render.js, render-spells.js, render-loot.js — alle migriert
- **Risiko:** Keines mehr
