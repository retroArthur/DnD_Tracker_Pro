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
- **Problem:** Aktionen-Grid zeigte "Angriff1 Angriff" statt "Angriff  1 Angriff"
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
- **Datei:** `features/shops/spell-editor.js` (applyFloatingFormat)

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
- **Datei:** `features/shops/spell-editor.js` (applyFloatingFormat - removeFormat case)

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
- **Fix:** Cache-First mit Stale-While-Revalidate für lokale Ressourcen implementiert
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
- **Datei:** `features/shops/spell-editor.js`

### Cleanup: Deprecated sanitizeHtml() Wrapper entfernt
- **Problem:** sanitizeHtml() war nur ein Wrapper für sanitizeHTML()
- **Fix:** Wrapper-Funktion entfernt (wurde nirgends verwendet)
- **Datei:** `utils/utilities.js`

### UX: Confirm-Dialoge standardisiert
- **Problem:** Viele Delete-Dialoge zeigten nur "Löschen?" ohne Kontext
- **Fix:** Entity-Name wird jetzt in Bestätigungsdialogen angezeigt (z.B. `NPC "Gundren" löschen?`)
- **Bonus:** pushUndo() zu deleteEnc() hinzugefügt (fehlte vorher)
- **Dateien:** spell-editor.js, encounters-crud.js, links.js, party-crud.js, locations-crud.js, quests-crud.js, npc-crud.js

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

---

## Muster / Lessons Learned

| Muster | Vermeidung |
|--------|------------|
| `saveUndoState()` fehlt bei Delete/Edit | Bei jeder Lösch-/Bearbeitungsfunktion prüfen |
| CSS-Klassen im HTML ohne Definition | HTML + CSS immer zusammen implementieren |
| Selbstbezüge in hierarchischen Daten | Filter auf `parentId !== id` prüfen |
| `document.execCommand()` deprecated | Manuelle DOM-Manipulation statt execCommand verwenden |
| Dropdowns nur bei Init gefüllt | Beim Öffnen des Formulars Selects neu populieren |
| Kategorie-übergreifende Parent-Refs | Prüfen ob Parent in gleicher Kategorie ist, sonst als Root behandeln |
| `setInterval` ohne Cleanup | Immer prüfen ob Interval existiert und clearInterval vor neuem Start |
| Magic Numbers | Konstanten mit sprechenden Namen verwenden |
| `window[...]` dynamische Aufrufe | Whitelist für erlaubte Funktionsnamen verwenden |
| Fehlende Accessibility | ARIA-Attribute für dynamische UI-Elemente (Toast, Dialoge) |
| ID-Vergleich String vs Number | Immer `parseEntityId()` verwenden |
| innerHTML mit Template-Literalen | textContent für unsicheren Content, DOM programmatisch erstellen |
| Direktes Zuweisen von parsed JSON | Deep Clone + Schema-Validierung vor Zuweisung |
| Service Worker ohne Caching | Cache-First Strategie implementieren, Stale-While-Revalidate |
| `??` Operator fängt NaN nicht | Explizite NaN-Prüfung mit `!isNaN(value)` zusätzlich verwenden |
| Button für nicht-existente View | Vor Feature-Buttons prüfen ob View/Handler existiert |

## Known Technical Debt

### spell-editor.js: 22x document.execCommand()
- **Status:** Bekanntes Tech Debt - nicht kritisch
- **Details:** Rich-Text-Editor nutzt deprecated execCommand API für bold, italic, underline, insertHTML etc.
- **Bereits gefixt:** insertUnorderedList wurde durch manuelle DOM-Manipulation ersetzt (Zeile 748+)
- **Risiko:** Gering - API ist deprecated aber funktioniert in allen aktuellen Browsern
- **Aufwand:** Hoch - Komplett-Ersatz durch Selection/Range API wäre umfangreich
- **Empfehlung:** Bei Bedarf schrittweise migrieren, nicht in einem großen Refactoring

### testable-utils.js: Duplizierte Utility-Funktionen
- **Status:** Absichtlich - KEIN Bug
- **Details:** Enthält Kopien von esc(), sanitizeHTML(), debounce(), throttle() etc.
- **Grund:** Jest Tests benötigen CommonJS exports, Haupt-App nutzt globale Browser-Funktionen
- **Empfehlung:** Bei Änderungen an Originalfunktionen auch testable-utils.js aktualisieren

### Inline Event-Handler (onchange, oninput)
- **Status:** Bekanntes Tech Debt - geringes Risiko
- **Details:** ~10 Stellen mit inline onchange/oninput statt data-on-change
- **Betroffene Dateien:** shops-core.js, npc-dialogs.js, encounters-render.js, render-spells.js, render-loot.js
- **Risiko:** Gering - Handler sind in generiertem HTML, nicht User-Input (kein XSS-Risiko)
- **Grund für Beibehaltung:** Migration erfordert Refactoring aller betroffenen Handler-Funktionen
- **Empfehlung:** Bei neuen Features data-on-change verwenden, Bestand schrittweise migrieren
