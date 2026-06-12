# Phase 2: Technik-Fundament - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Die App ist als PWA installierbar (Manifest, Icons, Service Worker, GitHub-Pages-Hosting), ein Migrations-Assistent überträgt bestehende file://-Kampagnendaten verlustfrei in die PWA, automatische Datei-Backups schreiben nach jedem Speichern auf die Festplatte (File System Access API; Download-Fallback im file://-Modus), und eine Command Palette führt Aktionen per Fuzzy-Suche aus. Requirements TECH-01 bis TECH-04. Keine neuen Spielleiter-Features — reines Technik-Fundament.

</domain>

<decisions>
## Implementation Decisions

### PWA-Hosting & Installation (TECH-01)

- **D-01:** Die PWA wird über **GitHub Pages** ausgeliefert. Der CI-Workflow deployed bei **jedem Push auf main, aber nur bei grüner CI** (Lint/Tests/Smoke als Quality-Gate). Internet ist nur für Erstinstallation und Updates nötig — Kampagnendaten bleiben lokal im Browser.
- **D-02:** Auf Pages liegt der **Production-Build** (minifiziert, DEBUG_MODE aus) — derselbe Stand, den die CI heute als Artefakt baut.
- **D-03:** Updates kommen per **Hinweis + Klick**: Erkennt der Service Worker eine neue Version, erscheint ein dezenter Hinweis „Neue Version verfügbar — Neu laden?". Kein automatischer Versionswechsel, niemals mitten in der Session.
- **D-04:** **App-Icon wird in dieser Phase gestaltet** (Claude): d20-Motiv im App-Theme (Gold `#d4af37` auf Dunkel `#0d0d0d`), als SVG entworfen und in die nötigen PNG-Größen gerendert (192/512, maskable). Ersetzt das bisherige 🎲-Emoji-`data:`-Manifest durch ein echtes `manifest.webmanifest`.
- **D-05:** Läuft die App uninstalliert im Browser-Tab, zeigt sie einen **eigenen „App installieren"-Button** (via `beforeinstallprompt`) im Header/Menü; nach Installation verschwindet er.
- **D-06:** **PWA wird der empfohlene Hauptmodus.** `file://` bleibt funktionsfähiger Notfall-/Zweitmodus (mit Download-Fallbacks), wird aber für neue Features nicht mehr priorisiert.
- **D-07:** **Google Fonts werden gebündelt** (Roboto + Editor-Fonts wie Inter, Poppins): Schriftdateien werden Teil des Builds/SW-Caches — offline identisches Schriftbild, keine CDN-Abhängigkeit mehr.

### Datenmigration file:// → PWA (TECH-02)

- **D-08:** **Voll-Migration:** alle Kampagnen, Einstellungen, Würfel-Favoriten und DM-Screen-Profile werden übertragen. Dafür entsteht ein **neues Voll-Export-Format** (der bestehende Export sichert nur die aktive Kampagne); das Format dient auch dem Datei-Backup/Restore.
- **D-09:** **Geführter Wizard beim PWA-Erststart:** erkennt leeren Speicher und führt Schritt für Schritt („1. Bisherige Tracker-Datei öffnen → 2. Umzugs-Export klicken → 3. Datei hierher ziehen") mit Drag&Drop-Zone und Erfolgs-Bestätigung (Kampagnen-Anzahl, Größe). Überspringbar für Neustart ohne Altdaten; jederzeit über Einstellungen erneut aufrufbar.
- **D-10:** Die **file://-App erhält einen „Zur installierbaren App umziehen"-Flow**: erzeugt den Voll-Export und zeigt/öffnet die Pages-URL. Zusätzlich ein **einmaliger, dezenter Hinweis**, dass es die installierbare App jetzt gibt.
- **D-11:** **Divergenz-Schutz:** Nach dem Umzugs-Export merkt sich die file://-App den Zeitpunkt und zeigt bei jedem Start ein schmales Banner („Diese Daten sind am [Datum] in die App umgezogen — Änderungen hier kommen dort nicht an"). Abschaltbar („Ich weiß, nicht mehr zeigen"); Notfall-Nutzung bleibt uneingeschränkt möglich.

### Datei-Backup (TECH-03)

- **D-12:** **Datei-Layout:** Pro Kampagne eine laufend überschriebene aktuelle Datei **plus ein datierter Snapshot pro Spieltag** (z.B. `kampagne-2026-06-12.json`). Aufbewahrung: **letzte 10 Snapshots pro Kampagne**, ältere werden automatisch entfernt.
- **D-13:** **Scope: je Kampagne eine eigene Datei** (granular wiederherstellbar, kleine Schreibvorgänge) — kein Gesamt-Voll-Export bei jedem Save.
- **D-14:** **Restore über einen Backup-Browser in der App:** listet Snapshots aus dem verbundenen Ordner (Kampagne, Datum, Größe), Wiederherstellung per Klick — immer mit Bestätigungsdialog und Undo-Snapshot davor.
- **D-15:** **Einrichtung wird im Migrations-Wizard angeboten** (letzter Schritt nach erfolgreichem Import: „Automatische Datei-Backups einrichten?" → Ordner wählen, fertig). Zusätzlich jederzeit über die Einstellungen erreichbar.
- **D-16:** **Störungsfall** (Berechtigung entzogen, Ordner weg): Beim ersten fehlgeschlagenen Backup der Sitzung **einmalig** „Backup-Ordner wieder verbinden?" fragen; danach dauerhafter „Datei-Backup pausiert"-Status, weitere Fehlschläge nur ins Event-Log. Kein Toast-Gewitter — die Daten selbst sind im Browser-Speicher nicht in Gefahr.
- **D-17:** **Status-Sichtbarkeit:** Voller Status („Letztes Backup: 14:32, Ordner: …") im Backup-Bereich der Einstellungen; im Header **nur bei Problemen** ein dezenter Warnindikator.
- **D-18:** **file://-Fallback:** Sichtbarer Backup-Status mit Download-Knopf + **höchstens eine Erinnerung pro Sitzung**, wenn viel geändert, aber nichts gesichert wurde.

### Claude's Discretion

- **Command Palette (TECH-04) vollständig:** Der Bereich wurde bewusst nicht diskutiert. Vorgaben aus Roadmap/STATE.md gelten: kollisionsfreier Shortcut nach Shortcut-Audit (Kandidaten **Strg+Shift+K oder Strg+P** — Strg+K ist durch Global Search belegt, `systems/spellslots/keyboard-shortcuts.js:59`), Fuzzy-Suche über eine Aktions-Registry, Beispiel-Aktionen „Neuer NPC", „Würfle 8d6". UI-Design, Verhältnis zur bestehenden Global Search, Aktionsumfang v1 und parametrisierte Aktionen entscheidet die Planung.
- **Technische PWA-Details:** SW-Cache-Strategie für den Single-File-Build, Struktur von `manifest.webmanifest`, Update-Erkennungs-Mechanik, Pages-Verzeichnislayout.
- **Backup-Mechanik:** Debounce/Timing (Erfolgskriterium: nach jedem Speichern aktualisiert), atomare Schreibstrategie, exakte Dateinamens-Konvention, Spieltag-Snapshot-Trigger (erster Save des Kalendertages).
- **Format-Kompatibilität:** Ob Backup-Dateien zusätzlich über den normalen Import-Dialog einspielbar sind (kompatibles JSON-Format naheliegend).
- **Alle exakten deutschen UI-Texte** (Wizard, Banner, Dialoge, Status).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Ist-Stand Infrastruktur

- `.planning/codebase/STACK.md` — Build-System, Service-Worker-Stand (`sw.js` cached nur Dev-Dateien), Inline-`data:`-Manifest (`index.html:12`), CI-Überblick
- `.github/workflows/ci.yml` — bestehende CI-Pipeline, an die der Pages-Deploy (D-01) anbaut

### Leitlinien aus Phase 1

- `.planning/phases/01-stabilisierung/01-CONTEXT.md` — Spieltisch-Leitlinien (Hinweise einmal pro Sitzung, Event-Log statt Toast-Spam, laut nur bei Datenverlust-Risiko; kein stiller Datenverlust — bei Ambiguität entscheidet der Nutzer) und Persistenz-Entscheidungen (Timestamp-Konfliktauflösung), an die Migration und Backup andocken

Keine externen Specs/ADRs darüber hinaus — die Anforderungen sind vollständig in REQUIREMENTS.md (TECH-01–TECH-04) und den Entscheidungen oben erfasst.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `sw.js` — Service Worker mit Cache-First-Strategie existiert, cached aber die Dev-Struktur (`index.html`, `loader.js`); muss für den Pages-Build (Single-File + Manifest + Icons + Fonts) neu gedacht werden
- SW-Registrierung in `core/init.js:184-210` — registriert nur bei http/https mit HEAD-Probe; Andockpunkt für Update-Erkennung (D-03)
- Inline-`data:`-Manifest in `index.html:12` — wird durch echtes `manifest.webmanifest` + PNG-Icons ersetzt (D-04)
- IDB-Auto-Backups (`systems/backups.js`, 5-Min-Intervall, max. 5) — Vorbild und Koexistenz-Partner des Datei-Backups; laufen unverändert weiter
- Export/Import (`systems/spellslots/import-export.js`) + Migrations-System (`migrateData()`/`compareVersions()` in `systems/spellslots/quick-roll.js`, `version-migration.js`) — Bausteine für Voll-Export-Format und Wizard-Import (D-08/D-09)
- Multi-Kampagnen-Verwaltung (`systems/campaign-manager/campaign-manager.js`, Index `dnd-tracker-campaigns`) — Quelle für „alle Kampagnen" beim Voll-Export und beim Je-Kampagne-Backup
- Event-Log/Toast-System (`utils/utilities.js`: `showToast`, `toggleEventLog`) — Träger für Status-/Störungs-Hinweise (D-16/D-18)
- Global Search (`systems/search/global-search.js`, Fuzzy-Match) + zentrale Shortcuts (`systems/spellslots/keyboard-shortcuts.js`) — Basis für Command-Palette-Fuzzy-Suche und Shortcut-Audit
- 641 `data-action`-Attribute + `ui/actions/`-Module — natürliche Quelle für die Aktions-Registry der Command Palette

### Established Patterns

- Spieltisch-Regeln aus Phase 1: Hinweise einmal pro Sitzung bzw. Event-Log; Bestätigungs-Dialoge vor destruktiven Aktionen; `saveUndoState()` vor jeder Wiederherstellung
- `StorageAPI`-Wrapper mit `{success, error}`-Results — Fehlerbehandlungs-Muster auch für File-System-Zugriffe
- Modullisten doppelt gepflegt: Neue Module in `loader.js` UND `build.py` eintragen (Sync-Check existiert seit Phase 1)
- Non-ESM Global Scope: keine `const X = window.X`-Importe in Funktionen, keine doppelten Top-Level-Funktionsnamen (Build-Dedup-Regeln)
- Production-Build via `python build.py --production`; CI baut und prüft bereits per Playwright-Smoke-Test

### Integration Points

- CI-Workflow (`.github/workflows/ci.yml`) — Pages-Deploy-Job kommt hier dazu (D-01: nur bei grüner CI)
- `index.html` Kopf — Manifest-Link, Theme-Color, Font-Links (D-04/D-07 ändern hier)
- `core/init.js` — SW-Registrierung, Erststart-Erkennung für den Wizard (leerer Speicher), `beforeinstallprompt`-Handling
- Einstellungs-/Backup-Bereich der App — neuer Datei-Backup-Status (D-17), Wizard-Wiederaufruf (D-09), Umzugs-Flow in der file://-Variante (D-10)
- Header — Install-Button (D-05), Warnindikator bei Backup-Problemen (D-17)

</code_context>

<specifics>
## Specific Ideas

- **Spieltisch-Tauglichkeit bleibt Leitlinie** (aus Phase 1): Hinweise höchstens einmal pro Sitzung, Dauerzustände als stiller Status statt wiederholter Meldungen; laut wird die App nur bei echtem Datenverlust-Risiko.
- **Kein stiller Datenverlust, nirgends:** Migration und Restore laufen immer über Bestätigung (+ Undo-Snapshot beim Restore); Stand-Divergenz zwischen file:// und PWA wird sichtbar gemacht (D-11), niemals still zusammengeführt.
- **Ein-Origin-Prinzip:** Die github.io-PWA ist nach dem Umzug die eine Wahrheit. Es werden keine Parallel-Installationen (localhost) beworben, die getrennte Datenbestände erzeugen würden.
- Durchgängig **deutsche UI-Texte** für Wizard, Banner, Dialoge und Status-Anzeigen.

</specifics>

<deferred>
## Deferred Ideas

Keine — die Diskussion blieb im Phasen-Scope.

</deferred>

---

*Phase: 02-technik-fundament*
*Context gathered: 2026-06-12*
