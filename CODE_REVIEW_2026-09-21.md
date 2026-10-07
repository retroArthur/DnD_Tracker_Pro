# Code-Review: D&D Kampagnen-Tracker Pro

**Datum:** 21.09.2026  
**Stand:** Arbeitsverzeichnis auf Basis von Commit 255f8b8  
**Projekt:** D:/Claude_Code/Projekte/DnD_Tracker_App_Pro

## Gesamtbewertung

Das Projekt besitzt eine umfangreiche Testbasis, getrennte Funktionsbereiche sowie Schutzmechanismen wie HTML-Bereinigung, Undo, Speicher-Fallbacks und Buildvalidierung. Die größten verbleibenden Risiken liegen in der Datenhaltung: Backup-Wiederherstellung, überschreibender Import und konkurrierende Browser-Tabs können Daten verlieren oder inkonsistent machen. Diese Punkte sollten vor zusätzlichen Funktionen oder größeren Performance-Umbauten behoben werden.

Es wurden **zehn konkrete Befunde** ermittelt. Acht davon wurden durch gezielte Ausführung des echten Quellcodes mit simulierten Browser-/Speicher-APIs untersucht. Der Lintbefund stammt aus dem realen Prüflauf; der letzte Backup-Befund aus der direkten Ablaufprüfung.

## Umfang und Grenzen

- Die sechs Quellverzeichnisse core, features, systems, ui, utils und render enthalten insgesamt 136 JavaScript-Dateien.
- Vertieft geprüft: Persistenz, Kampagnenverwaltung, automatisches Backup und Restore, globaler Import, Undo und Konflikterkennung, Offline-Cache, Initialisierung, Rendering sowie Build- und Testkonfiguration.
- Sicherheitsstichprobe: Sanitizer und Importgrenzen; vorhandene Import-Sicherheitstests ausgeführt. Kein vollständiger Penetrationstest oder Abhängigkeits-/CVE-Audit.
- Keine vollständige Zeilenprüfung aller Module, keine vollständige Prüfung der D&D-Regelberechnungen und kein flächendeckender visueller oder Barrierefreiheits-Audit.
- Anwendungscode wurde nicht geändert. Die Prüfungen haben Builds in dist/ und lokale Testartefakte erzeugt. Bereits vorhandene Änderungen und Löschungen blieben unangetastet.
- Lokale Umgebung: Windows, Node.js v24.14.0, Python 3.14.7. Die CI-Konfiguration verwendet Node.js 22; lokale Ergebnisse ersetzen deshalb keinen CI-Lauf.

## Ausgeführte Prüfungen

| Prüfung                                | Ergebnis                  | Einordnung                                                                    |
| -------------------------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| npm test -- --runInBand                | **Bestanden**             | 56 Testsuiten, 1.263 Tests, 50 Snapshots                                      |
| npm run typecheck                      | **Bestanden**, Exitcode 0 | Basiskonfiguration deaktiviert checkJs                                        |
| npm run typecheck:strict               | **Bestanden**, Exitcode 0 | Acht explizite JS-Dateien plus Deklarationen; erbt weiterhin strict: false    |
| npm run lint                           | **Fehlgeschlagen**        | 5 Fehler, 371 Warnungen; zulässige Warnungszahl: 367                          |
| python build.py                        | **Bestanden**             | Development-Bundle: 3.224.325 Bytes, ca. 3,08 MiB                             |
| python build.py --production           | **Bestanden**             | Production-Bundle: 2.869.945 Bytes, ca. 2,74 MiB                              |
| Ausgewählte Playwright-Tests, Chromium | **36 bestanden**          | Appstart, Persistenz, Importsicherheit und integrierte Abläufe; 54,8 Sekunden |
| python -m pytest tests/build/ -q       | **Nicht ausführbar**      | Im verwendeten Python fehlt pytest; keine Aussage zum Bestehen dieser Suite   |
| Gezielte Fehlerreproduktionen          | **Befunde bestätigt**     | Node-VM mit echtem Quellcode und kontrollierten API-Stubs; Details unten      |

Ausgeführter Browser-Testumfang:

```text
npx --no-install playwright test tests/e2e/app.spec.js tests/e2e/features/persistence.spec.js tests/e2e/features/import-security.spec.js tests/e2e/integration/workflows.spec.js --workers=2 --reporter=line --max-failures=3
```

Die vollständige Playwright-Suite, ein HTTP/PWA-Produktions-Smoke-Test und format:check wurden nicht ausgeführt. Die isolierten Reproduktionen belegen den jeweiligen Codepfad; sie simulieren keine echten Browser-Quota- oder Betriebssystemfehler.

## Priorisierte Befunde

**P1:** Hohe Priorität wegen möglichem Datenverlust oder beschädigten Daten.  
**P2:** Mittlere Priorität wegen fehlerhaftem Verhalten, eingeschränkter Zuverlässigkeit oder blockierter Qualitätssicherung.

| ID  | Priorität | Befund                                                                     |
| --- | --------- | -------------------------------------------------------------------------- |
| R01 | P1        | Backup-Restore verwirft gültige Kampagnenfelder                            |
| R02 | P1        | Schließen eines veralteten Tabs überschreibt neuere Daten                  |
| R03 | P1        | Überschreibender Import behält alte Daten und erzeugt ID-Kollisionen       |
| R04 | P1        | IndexedDB-Save meldet Erfolg vor Transaktionsabschluss                     |
| R05 | P1        | Lokale Backups werden nicht nach Kampagne getrennt angeboten               |
| R06 | P2        | Konflikt-Nachladen rendert vor Abschluss des asynchronen Ladens            |
| R07 | P2        | Fehlgeschlagener Import verändert bereits den aktiven Kampagnenindex       |
| R08 | P2        | Service Worker löscht auch fremde Caches derselben Origin                  |
| R09 | P2        | Der vorhandene Lint-Check ist rot                                          |
| R10 | P2        | Automatische Backups fehlen für Kampagnen ohne Charaktere, NPCs und Quests |

### R01 — Backup-Restore verwirft gültige Kampagnenfelder

**Fundstellen:** [systems/backups.js:218](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/systems/backups.js:218), [systems/backups.js:157](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/systems/backups.js:157), [core/data.js:2](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/core/data.js:2).

restoreBackup() verwendet ein separat gepflegtes, veraltetes defaultD. sanitizeBackupData() übernimmt ausschließlich dessen Schlüssel. Anschließend wird das bestehende D vollständig geleert und durch das gefilterte Ergebnis ersetzt.

**Nachgewiesen:** Bei Wiederherstellung eines Backups mit gültigen Kampagnendaten verschwanden sessionNotes, quickNotes, settings, calendar, bestiary, factions, sessionPreps, soundboard und \_nextId. Weitere fehlende Felder sind beispielsweise tags, bestiaryFavorites und randomTables. Der Initialwert für Initiative verwendet außerdem entries statt combatants.

**Auswirkung:** Die Wiederherstellung selbst entfernt Inhalte, die im Backup enthalten sind. Nachfolgendes Speichern kann diesen reduzierten Stand dauerhaft übernehmen. Später ergänzte Standardwerte stellen die ursprünglichen Inhalte nicht wieder her.

**Empfehlung:** Ein gemeinsames, versioniertes Kampagnenschema für Initialisierung, Import, Migration und Restore verwenden. Das Restore-Ergebnis vollständig validieren, bevor D verändert wird; aktuelle Daten vorher sichern. Den Erfolg erst nach bestätigtem Speichern melden.

**Regressionstest:** Vollständig befüllte Kampagne sichern und wiederherstellen; alle unterstützten Felder tief vergleichen. Historische Formate über definierte Migrationen prüfen. Audio-Metadaten und separat gespeicherte Audio-Blobs ausdrücklich unterscheiden.

### R02 — Schließen eines veralteten Tabs überschreibt neuere Daten

**Fundstelle:** [systems/avatars.js:179](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/systems/avatars.js:179).

Der beforeunload-Handler schreibt D unabhängig von Änderungen oder Konflikten direkt mit StorageAPI.setJSON() nach localStorage. Er umgeht den normalen Speicherpfad einschließlich Timestamp-Behandlung und IndexedDB-Fallback.

**Reproduktion:** Tab A hält einen alten Stand im Arbeitsspeicher. Tab B speichert Änderungen derselben Kampagne. Beim Schließen von A schreibt dessen Handler den alten Stand zurück. Die isolierte Ausführung bestätigte dieses Überschreiben auch ohne Änderung in A.

**Auswirkung:** Ein reines Schließen oder Neuladen eines Tabs kann Änderungen eines anderen Tabs verlieren lassen. Die vorhandene Konfliktanzeige verhindert diesen Schreibzugriff nicht.

**Empfehlung:** Änderungen und die zuletzt geladene Revision nachhalten. Ein unveränderter oder erkennbar veralteter Tab darf nicht automatisch zurückschreiben. Alle Speicherpfade zentralisieren und konkurrierende Änderungen ausdrücklich behandeln. Große Kampagnen bereits während der Nutzung verlässlich persistieren, da ein asynchroner Schreibvorgang beim Verlassen der Seite nicht als alleinige Sicherung taugt.

**Regressionstest:** Zwei Seiten im selben Browserkontext öffnen; B ändert und speichert, A wird geschlossen. Der Stand von B muss unverändert bleiben. Zusätzlich ausstehende Änderungen im IndexedDB-Modus prüfen.

### R03 — Überschreibender Import behält alte Daten und erzeugt ID-Kollisionen

**Fundstellen:** [systems/spellslots/import-export.js:733](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/systems/spellslots/import-export.js:733), [utils/utilities.js:184](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/utils/utilities.js:184).

Der Zweig „Aktuelle Kampagne überschreiben“ führt Object.assign(D, imp) aus. Im Import fehlende Eigenschaften bleiben aus der bisherigen Kampagne erhalten. Insbesondere exportiert die App Kampagnendaten ohne \_nextId; beim Import bleibt deshalb ein vorhandener Zähler der Zielkampagne bestehen.

**Nachgewiesen:** Zielzustand \_nextId.npcs = 1, Import enthält einen NPC mit id = 1. Nach vollständig durchlaufenem Import einschließlich Save lieferte nextId('npcs') ebenfalls 1. Alte Fraktionen blieben erhalten, obwohl sie in der Importdatei fehlten.

**Auswirkung:** Neue NPCs können dieselbe ID wie importierte NPCs erhalten. Referenzen, Bearbeiten und Löschen werden dadurch mehrdeutig. Daneben entsteht eine unerwartete Mischung aus alter und importierter Kampagne, insbesondere bei älteren Exportformaten.

**Empfehlung:** Import zunächst in einen frischen Standardzustand einlesen und migrieren. Vor Übernahme IDs validieren und Zähler aus den tatsächlichen Datensätzen neu bestimmen. Erst danach den bisherigen Zustand ersetzen und speichern. „Zusammenführen“ und „Ersetzen“ sollten getrennte, eindeutig bezeichnete Operationen bleiben.

**Regressionstest:** Export ohne \_nextId in eine initialisierte Kampagne importieren; anschließend einen NPC erstellen. IDs müssen eindeutig sein. Im Ersetzen-Modus dürfen alte, nicht importierte Fraktionen oder Notizen nicht erhalten bleiben.

### R04 — IndexedDB-Save meldet Erfolg vor Transaktionsabschluss

**Fundstellen:** [systems/spellslots/persistence.js:143](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/systems/spellslots/persistence.js:143), [systems/spellslots/persistence.js:68](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/systems/spellslots/persistence.js:68).

saveToIndexedDBFallback() löst sein Promise im request.onsuccess auf. Der Erfolg der einzelnen put()-Anfrage bestätigt noch nicht den erfolgreichen Abschluss der Transaktion. transaction.oncomplete und transaction.onabort werden hier nicht behandelt.

**Nachgewiesen:** Ein simulierter erfolgreicher Request löste das Promise auf, ohne dass die Transaktion abgeschlossen war. Im Pfad für Kampagnen über 5 MB wird nach genau diesem Promise bereits die localStorage-Kopie entfernt und „Gespeichert“ angezeigt.

**Auswirkung:** Bricht die Transaktion nach erfolgreichem Request ab, kann die App einen nicht gespeicherten Stand als gesichert behandeln und die vorherige lokale Kopie bereits entfernt haben. Ein tatsächlicher Quota-/Commit-Abbruch wurde im Browser nicht provoziert.

**Empfehlung:** Erst bei transaction.oncomplete erfolgreich auflösen; onabort und onerror als Fehler behandeln. Die vorherige Kopie erst nach dieser Bestätigung entfernen. Dieses Muster für schreibende IndexedDB-Hilfsfunktionen vereinheitlichen.

**Regressionstest:** Erfolgreicher put()-Request mit anschließendem Transaktionsabbruch: Promise muss ablehnen, der letzte gültige Speicherstand muss erhalten bleiben und die UI darf keinen Erfolg melden.

### R05 — Lokale Backups werden nicht nach Kampagne getrennt angeboten

**Fundstellen:** [systems/backups.js:115](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/systems/backups.js:115), [systems/backups.js:189](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/systems/backups.js:189).

IndexedDB-Backups werden nach campaignKey gefiltert. Backups aus dem gemeinsamen localStorage-Schlüssel werden dagegen ungefiltert dazugemischt; bei IndexedDB-Fehler werden sie unmittelbar zurückgegeben. restoreBackup() prüft die Kampagnenzugehörigkeit nicht erneut. Die Liste zeigt lediglich Zeit, Nummer und Größe.

**Reproduktion:** Aktive Kampagne A, lokales Backup mit campaignKey = B, IndexedDB nicht verfügbar. getBackups() lieferte das Backup von B zurück.

**Auswirkung:** Über die reguläre Wiederherstellung kann die aktive Kampagne durch Inhalte einer anderen Kampagne ersetzt werden, ohne deren abweichenden Namen in der Auswahl zu sehen.

**Empfehlung:** Beide Quellen vor Zusammenführung nach aktivem Kampagnenschlüssel filtern und beim Restore die Zuordnung nochmals prüfen. Alte Backups ohne Kampagnenschlüssel gesondert kennzeichnen und bewusst zuordnen lassen. Eine stabile Backup-ID statt einer später erneut aufgelösten Listenposition verwenden.

**Regressionstest:** Backups für A und B in beiden Speicherquellen anlegen. Für A dürfen nur A-Backups erscheinen, auch bei IndexedDB-Ausfall. Eine direkte Restore-Anfrage für B muss abgefangen werden.

### R06 — Konflikt-Nachladen rendert vor Abschluss des asynchronen Ladens

**Fundstellen:** [systems/undo.js:301](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/systems/undo.js:301), [systems/spellslots/quick-roll.js:37](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/systems/spellslots/quick-roll.js:37).

reloadData() ruft load() ohne await auf und löst sofort Rendering und Erfolgsmeldung aus. load() kann für IndexedDB-Zugriffe unterbrochen werden. Dauert das länger als der nächste Render-Frame, wird der alte Zustand angezeigt; nach Abschluss folgt hier kein erneutes Rendering.

**Nachgewiesen:** Mit kontrolliert verzögertem Lade-Promise wurde der alte Zustand gerendert. Anschließend waren die Daten geändert, aber kein weiterer Render-Aufruf erfolgt.

**Empfehlung:** reloadData() asynchron ausführen, ausstehende Saves kontrollieren und erfolgreiches Laden abwarten. Anschließend rendern und Konfliktanzeige aktualisieren. Dazu einen expliziten Ladeerfolg liefern, da load() Fehler derzeit intern abfängt. Nach einem gelösten Konflikt weitere Konflikte zulassen: dismissConflict() setzt conflictDismissed sonst für den Rest der Sitzung.

**Regressionstest:** IndexedDB-Laden länger als einen Frame verzögern. Erst der neue Stand darf gerendert und bestätigt werden. Ladefehler und einen zweiten Konflikt derselben Sitzung mitprüfen.

### R07 — Fehlgeschlagener Import verändert bereits den Kampagnenindex

**Fundstellen:** [systems/spellslots/import-export.js:680](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/systems/spellslots/import-export.js:680), [systems/campaign-manager/campaign-manager.js:33](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/systems/campaign-manager/campaign-manager.js:33).

Beim Import als neue Kampagne werden Indexeintrag und aktive Kampagne gespeichert, bevor die eigentlichen Daten erfolgreich gespeichert sind. Scheitert der folgende setJSON()-Aufruf, bleibt der Index geändert. createCampaign() verwendet ebenfalls die Reihenfolge Index vor Daten.

**Nachgewiesen:** Ein simulierter Speicherfehler beim Datenwrite erzeugte eine Fehlermeldung, hinterließ aber einen neuen Indexeintrag und einen geänderten aktiven Kampagnenschlüssel.

**Auswirkung:** Beim nächsten Start kann eine leere oder nicht vollständig angelegte Kampagne aktiv werden. Der neue Importpfad verwendet zudem nur localStorage, obwohl die reguläre Persistenz IndexedDB unterstützt.

**Empfehlung:** Daten zuerst über einen gemeinsamen Speicheradapter schreiben, danach den Index aktualisieren. Fehler der Indexspeicherung ebenfalls behandeln; für mehrstufige Änderungen Rollback oder einen expliziten Importstatus vorsehen. Die bisher aktive Kampagne erst nach vollständigem Erfolg wechseln.

**Regressionstest:** Fehler beim Datenwrite und beim Indexwrite getrennt simulieren. Aktiver Schlüssel und Index müssen konsistent bleiben. Große Importe müssen denselben Fallback wie reguläre Saves verwenden.

### R08 — Service Worker löscht fremde Caches derselben Origin

**Fundstelle:** [sw.js:53](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/sw.js:53).

Im activate-Handler werden alle Cache-Namen außer CACHE_VERSION gelöscht. Cache Storage wird auf Origin-Ebene geteilt; der Service-Worker-Pfad grenzt diese Liste nicht auf das Projekt ein.

**Nachgewiesen:** Die Aktivierung löschte in der isolierten Ausführung sowohl einen alten Tracker-Cache als auch another-app-cache.

**Auswirkung:** Bei mehreren Anwendungen unter derselben Origin, etwa verschiedenen Projektpfaden einer Hosting-Domain, kann das Tracker-Update deren Offline-Caches entfernen. Bei exklusiver Origin tritt diese Nebenwirkung nicht auf.

**Empfehlung:** Cache-Namen durch App- und gegebenenfalls Pfadkennung eingrenzen. Nur alte Versionen dieses Namensraums löschen. Suchzugriffe passend dazu auf den eigenen geöffneten Cache begrenzen.

**Regressionstest:** Aktuellen Tracker-Cache, alten Tracker-Cache und fremden Cache anlegen. Nach Aktivierung darf ausschließlich der alte Tracker-Cache fehlen.

### R09 — Der vorhandene Lint-Check ist rot

**Fundstellen:** [package.json:24](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/package.json:24), [eslint.config.js:112](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/eslint.config.js:112), [support.js:1289](<D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/support.js:1289>).

Der reale Lauf meldet **5 Fehler und 371 Warnungen**. Alle fünf Fehler liegen in der versionierten Design-Handoff-Datei support.js: viermal customElements, einmal URLSearchParams als unbekannte Globals. Zusätzlich wird die Grenze von 367 Warnungen überschritten.

**Auswirkung:** Der konfigurierte Qualitätscheck scheitert im aktuellen Arbeitsstand. Die fünf Fehler belegen zunächst eine unpassende Lint-Konfiguration für dieses Browser-Artefakt, nicht automatisch fünf Laufzeitfehler der App.

**Empfehlung:** Geltungsbereiche der Lintkonfiguration ausdrücklich festlegen. Sind Design-Handoffs eigenständige Referenzartefakte, separat prüfen oder gezielt ausschließen. Sollen sie mitgeprüft werden, die korrekten Browser-Globals konfigurieren. Danach verbleibende Warnungen prüfen, statt lediglich die Grenze zu erhöhen. Bei global aufgerufenen Funktionen Warnungen über ungenutzte Definitionen einzeln bewerten.

**Regressionstest:** npm run lint muss Exitcode 0 liefern und weiterhin die produktiven Quellverzeichnisse erfassen.

### R10 — Automatische Backups überspringen gültige Kampagnen

**Fundstelle:** [systems/backups.js:21](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/systems/backups.js:21).

createAutoBackup() beendet sich sofort, wenn characters, npcs und quests leer sind. Andere echte Inhalte werden dabei nicht berücksichtigt.

**Auslöser:** Eine Kampagne enthält ausschließlich Wiki-Einträge, Orte, Session-Notizen oder vorbereitete Szenen. Trotz vorhandener Arbeit werden keine automatischen Backups erstellt. Der Effekt folgt unmittelbar aus der frühen Rückgabe; dafür wurde kein zusätzlicher Browser-Test ausgeführt.

**Empfehlung:** Eine gemeinsame Definition für „enthält Nutzerdaten“ verwenden oder anhand einer Änderungsrevision sichern. Dieselbe Definition sollte Initialisierung, Migration und Backups abdecken.

**Regressionstest:** Je eine Kampagne nur mit Wiki, Orten, Session-Notizen beziehungsweise Session-Vorbereitung muss ein Backup erzeugen. Eine unveränderte leere Kampagne darf weiterhin übersprungen werden.

## Weitere Verbesserungen und Optimierungen

Diese Punkte sind Entwicklungsempfehlungen. Es wurden keine belastbaren Vorher-/Nachher-Zeitmessungen durchgeführt; Performancegewinne sind deshalb als zu prüfende Hypothesen zu verstehen.

### 1. Datenmodell und Speicherlogik vereinheitlichen

Die schwersten Befunde entstehen durch unabhängig gepflegte Zustands- und Speicherpfade. Empfohlen sind eine zentrale Erzeugung des Standardzustands, ein versionierter Parser/Migrator und ein Speicheradapter mit einheitlichen Ergebnissen für Erfolg und Fehler. Normales Speichern, Import und Restore sollten diese Funktionen gemeinsam nutzen.

Das lässt sich schrittweise in der bestehenden Architektur umsetzen. Ein Frameworkwechsel ist dafür nicht erforderlich. Zuerst Restore-Schema und Import-ID-Behandlung korrigieren, danach die übrigen Aufrufer zusammenführen.

### 2. Undo-Speicherbedarf ohne wiederholte Vollscans berechnen

[systems/undo.js:20](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/systems/undo.js:20) berechnet in enforceUndoByteBudget() für jeden Prüfdurchlauf die Byteanzahl aller Snapshots neu. Bei mehreren Verdrängungen werden große JSON-Strings wiederholt durchlaufen.

Die Byteanzahl beim Erstellen eines Snapshots einmal erfassen und die Gesamtsumme bei Push, Pop und Clear fortschreiben. Danach mit großen Kampagnen die Dauer von saveUndoState() und den Speicherverbrauch messen. Die bestehende Mindestzahl von Undo-Einträgen bedeutet außerdem, dass das Bytebudget kein hartes Gesamtlimit ist; diese Abwägung bewusst dokumentieren.

### 3. Rendering auf betroffene Ansichten begrenzen

[features/render-dashboard.js:7](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/features/render-dashboard.js:7) fasst Aufrufe bereits pro Animation-Frame zusammen, ruft darin aber zahlreiche Renderer auf. Das reduziert doppelte Aufrufe, nicht automatisch die Arbeit pro Renderdurchgang.

Für häufige lokale Änderungen die betroffenen Bereiche markieren und vorrangig die sichtbare Ansicht sowie notwendige Zähler aktualisieren. Verknüpfte Anzeigen, Undo/Redo und Tabwechsel müssen konsistent bleiben. Vorher mit großen Datenbeständen messen, welche Renderer tatsächlich teuer sind; keine pauschale Virtualisierung aller Listen einführen.

### 4. Aussagekraft der Typechecks ausbauen

[tsconfig.json:11](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/tsconfig.json:11) deaktiviert JavaScript-Typprüfung standardmäßig. [tsconfig.strict.json:40](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/tsconfig.strict.json:40) aktiviert checkJs für acht JS-Dateien, übernimmt jedoch strict: false.

Grüne Checks belegen deshalb keine strenge Typprüfung des gesamten Anwendungscodes. Zuerst Persistenz, Backup, Import und deren Rückgabewerte mit JSDoc und passenden globalen Deklarationen erfassen. Den geprüften Umfang schrittweise vergrößern und die Bezeichnung des Checks präzisieren oder tatsächlich strengere Optionen aktivieren.

### 5. Tests auf Dateninvarianten und Fehlerpfade ausrichten

Die Testbasis ist groß, wichtige Garantien bleiben aber ungesichert. [tests/e2e/features/persistence.spec.js:34](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/tests/e2e/features/persistence.spec.js:34) prüft beim automatischen Speichern lediglich, ob irgendein localStorage-Eintrag mehr als 100 Zeichen enthält. Das beweist nicht, dass der gerade erstellte Charakter korrekt gespeichert wurde. Der separate Reload-Test prüft bereits mehr und sollte als Muster dienen.

Wichtige Ergänzungen:

- Vollständiger Backup-Roundtrip über alle unterstützten Datenfelder.
- Import mit anschließender Neuanlage, Bearbeitung und Löschung von Entitäten.
- Zwei Tabs mit konkurrierenden Änderungen und Schließen des älteren Tabs.
- IndexedDB-Commit-Abbruch, localStorage-Quota-Fehler und fehlerhafter Kampagnenindex.
- Getrennte Backup-Listen für mehrere Kampagnen und alleinstehende Wiki-Kampagnen.
- Prüfung des konkreten Kampagnenschlüssels und konkreter Daten statt beliebiger Storage-Inhalte.

Die Coverage-Schranke in [jest.config.cjs](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/jest.config.cjs) gilt nur für utils/testable-utils.js. Für über VM geladene Module zählt deshalb die Qualität der Verhaltensassertionen besonders. Aus 1.263 grünen Tests allein lässt sich kein flächendeckender Abdeckungsgrad ableiten.

### 6. Buildgröße und Auslieferung nachvollziehbar optimieren

Das Production-Bundle hat rund 2,74 MiB. [build.py:222](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/build.py:222) entfernt bei JavaScript bewusst nur Leerzeilen. Parsergestützte Minifizierung könnte die Größe reduzieren; eine konkrete Einsparung wurde nicht gemessen.

Vor einer Umstellung globale Namen und über HTML referenzierte Funktionen absichern. Development- und Production-Build mit denselben wesentlichen Verhaltenstests prüfen. Die Single-File-Nutzung sollte erhalten bleiben, sofern sie weiterhin Produktziel ist.

Außerdem baut der Deploy-Job in [.github/workflows/ci.yml](D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/.github/workflows/ci.yml) das zuvor gebaute und getestete Artefakt erneut. Da der Build einen Zeitstempel in die Service-Worker-Cacheversion schreibt, ist das veröffentlichte Artefakt nicht zwingend bytegleich mit dem getesteten. Besser das erfolgreich geprüfte Artefakt direkt weiterreichen und durch einen Hash identifizieren.

### 7. Entwicklungsunterlagen verkürzen und aktualisieren

Die Projektunterlagen enthalten viele historische Fehleranalysen und teilweise überholte Dateizuordnungen. Aktuelle Architekturverträge, Befehle und Invarianten sollten in einer kurzen Einstiegdokumentation stehen; abgeschlossene Analysen können in thematische Dokumente wandern. Insbesondere Datenstruktur und Regeln für Speichern/Restore sollten an einer Stelle verbindlich beschrieben werden.

## Empfohlene Umsetzungsreihenfolge

1. **Datenintegrität:** R01, R02 und R03 beheben; jeweils zuerst einen reproduzierenden Regressionstest ergänzen.
2. **Verlässliches Speichern und Wiederherstellen:** R04 und R05, danach R06, R07 und R10 bearbeiten.
3. **Betrieb und Qualitätsprüfung:** R08 und R09 korrigieren; fehlende Python-Testumgebung einrichten und Buildtests ausführen.
4. **Gezielte Weiterentwicklung:** Datenmodell zentralisieren, Typprüfung ausweiten und Testassertionen schärfen.
5. **Gemessene Performancearbeit:** Undo-Budget, Rendering und Bundlegröße anhand definierter großer Beispielkampagnen optimieren.

**Abnahmekriterien:** Die aufgeführten Reproduktionen müssen nach den Korrekturen den erwarteten sicheren Zustand bestätigen. Unit-, relevante Browser- und Buildtests sowie Lint müssen bestehen. Für Performanceänderungen zusätzlich Messergebnisse und unverändertes Verhalten von Import, Restore, Undo/Redo und Offline-Nutzung dokumentieren.
