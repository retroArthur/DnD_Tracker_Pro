# Umsetzung des Code-Reviews vom 21.09.2026

**Stand:** 28.09.2026, HEAD `ca85d1b` · **Ausgangsstand:** `255f8b8`
**Umfang:** 81 Commits, 87 Dateien, +19.571 / −1.107 Zeilen
**Vorlage:** `CODE_REVIEW_2026-09-21.md` (Befunde R01–R10 sowie „Weitere Verbesserungen" 1–7)

## Ergebnis in Zahlen

Alle Werte am Ende unabhängig nachgemessen, nicht aus Agentenberichten übernommen.

| Prüfung | Vorher (`255f8b8`) | Jetzt (`ca85d1b`) |
| --- | --- | --- |
| Jest | 1.263 / 1.263 (56 Suiten) | **1.694 / 1.694 (70 Suiten)** |
| Playwright | 369 Fälle (367 bestanden, 2 übersprungen) | **384 Fälle: 381 bestanden, 3 übersprungen, 0 Fehlschläge** |
| pytest `tests/build` | 24 | **30** |
| `npm run lint` | **rot:** 5 Fehler, 371 Warnungen (Grenze 367) | **Exitcode 0:** 0 Fehler, exakt 363 Warnungen = Ratsche |
| `npm run typecheck` / `:strict` | grün | grün |
| Builds (dev + `--production`) | grün | grün |

Der dritte Playwright-Skip ist der neue, nur unter HTTP lauffähige Service-Worker-Smoke-Test aus R08.

## Abnahmekriterium des Reviews

> „Die aufgeführten Reproduktionen müssen nach den Korrekturen den erwarteten sicheren Zustand bestätigen."

Erfüllt für **alle zehn Befunde**. Jede Original-Reproduktion wurde gegen den neuen Stand erneut gefahren und zeigt den sicheren Zustand; dieselben Skripte schlagen am alten Stand weiterhin an, messen also etwas.

## Die zehn Befunde

| ID | Befund | Umsetzung |
| --- | --- | --- |
| R01 | Restore verwarf gültige Felder | Gemeinsamer Normalisierer auf Basis von `initializeData()` statt eines veralteten Eigenschemas. Vorher fehlten nach einem Restore 24 Felder, jetzt 0. Undo-Punkt vor dem Ersetzen, Erfolgsmeldung erst nach bestätigtem Speichern. |
| R02 | Veralteter Tab überschrieb neuere Daten | Kein blindes Zurückschreiben beim Verlassen mehr: Revisions-Baseline, Veraltungs-Erkennung, Schreibsperre. Automatische Speichervorgänge sind in veralteten Tabs gesperrt, ausdrückliche bleiben „letzter Schreiber gewinnt" (Entscheidung D4). |
| R03 | Überschreibender Import mischte und kollidierte bei IDs | „Ersetzen" ersetzt vollständig; Zähler werden aus den Daten neu bestimmt; ID-Invariante abgesichert. Zwei aufeinanderfolgende Dialoge, Escape ist nie zerstörerisch (Entscheidung D3). |
| R04 | IndexedDB meldete Erfolg vor dem Commit | Alle schreibenden Zugriffe laufen über einen gemeinsamen Helfer und bestätigen erst bei `transaction.oncomplete`. Die lokale Kopie wird erst danach entfernt. |
| R05 | Backups nicht nach Kampagne getrennt | Beide Quellen werden nach aktivem Kampagnenschlüssel gefiltert, der Restore prüft die Zuordnung erneut, die Liste nutzt eine stabile ID statt der Listenposition. Backups ohne Zuordnung sind ausgeblendet (Entscheidung D1). |
| R06 | Konflikt-Nachladen rendert vor Abschluss | Das Nachladen wartet auf das Laden, meldet ehrlich, ersetzt statt zu mischen, lässt weitere Konflikte zu und ist ein Undo-Schritt (Entscheidung D6). |
| R07 | Fehlgeschlagener Import änderte den Index | Daten zuerst, Index danach, mit Rückabwicklung; der aktive Schlüssel wechselt erst nach vollständigem Erfolg. |
| R08 | Service Worker löschte fremde Caches | Cache-Namen tragen App- und Pfadkennung; gelöscht wird nur der eigene Namensraum. Ein Build-Wächter sichert den Versionssprung. |
| R09 | Lint-Gate rot | Grün ohne Anheben der Grenze: Das generierte Design-Handoff-Artefakt ist aus dem Lint-Umfang, kein produktives Verzeichnis. Ein Wächtertest erzwingt Warnungszahl **gleich** Ratsche. |
| R10 | Auto-Backups übersprangen Kampagnen | Gemeinsame Definition „enthält Nutzerdaten"; Sicherungskopien sind von der Rotation ausgenommen. |

## Zusätzlich gefunden — nicht Teil des Reviews

Diese Defekte fanden die Gegenprüfungen; sie sind ebenfalls behoben:

1. `MIGRATIONS['2.3.0']` zerstörte Zustands-Objekte bei **jedem** Datensatz ohne Versionsstempel, auch beim ersten Speichern einer Sitzung.
2. `deleteCampaign` löschte die aktive Kampagne statt der Kampagne des eigenen Tabs.
3. Ein überholter Wiederholungsversuch beim Speichern konnte einen neueren Stand überschreiben.
4. Ein Start mit IndexedDB-Lesefehler galt als sauberes Laden; der nächste Speichervorgang verdeckte danach die neuere, ungelesene Kopie.
5. Das Konflikt-Nachladen mischte per `Object.assign` und holte Felder zurück, die ein „Ersetzen"-Import oder ein Restore entfernt hatte.
6. Der Tabwechsel zog einen rein automatischen Speichervorgang vor und überschrieb den laufenden, ausdrücklichen eines anderen Tabs.
7. Die E2E-Suite wartete auf ein statisches Element, während die Klick-Listener erst nach dem asynchronen Laden entstehen — Ursache dreier Wackler in den Editor-Tests. `init()` setzt jetzt `data-app-ready`; alle 21 Warte-Helfer warten darauf.

## Entscheidungen des Nutzers (27.09.2026)

- **Verdrängung:** Ein neues Auto-Backup verdrängt nie das letzte Backup einer anderen Kampagne. Reihenfolge: verwaiste Einträge, eigene ältere, fremde ältere nur solange die Kampagne ein weiteres behält. Sonst schlägt das Backup ehrlich fehl.
- **Löschen bei unerreichbarer IndexedDB:** Es wird nichts stillschweigend gelöscht. Die Meldung erklärt die Lage, der Nutzer entscheidet ausdrücklich zwischen Abbrechen und nur-lokal-löschen.
- **Kampagnenwechsel im veralteten Tab:** Die ausstehende Änderung wird als geschützte Sicherungskopie geparkt, die neueren Daten bleiben unberührt, danach wird gewechselt. Scheitert die Sicherung, wird nicht gewechselt.

## Vorgehen

Vier Wellen aus insgesamt 98 Agentenläufen, jeweils testgetrieben: roter Test vor jedem Fix, zwei unabhängige Prüfer je Einheit (Datensicherheit und Testgültigkeit), begrenzte Korrekturschleifen.

- **Prüfung:** Jeder Befund wurde vor der Umsetzung reproduziert und von einem unabhängigen Skeptiker gegengeprüft.
- **Testgültigkeit:** Für jeden neuen Test wurde belegt, dass er ohne den Fix fehlschlägt — über eine Einspielung des alten Standes im Arbeitsspeicher, ohne den Arbeitsbaum anzufassen. Ausdrücklich deklarierte Kontrolltests sind davon ausgenommen und per Mutation als nicht-leer belegt.
- **Bemerkenswert:** Ein gemeldeter Restfehler an der ID-Obergrenze erwies sich in der Abschlussrunde als bereits behoben — der Prüfer hatte gegen einen drei Commits älteren Stand gemessen. Statt blind umzusetzen wurde das nachgewiesen und stattdessen ein erschöpfendes Prüfraster mit 1.008 Punkten als dauerhafter Wächter eingecheckt.

## Zwischenfall (behoben)

Ein Agent rief `npm run format -- --check <dateien>` auf. Das Skript ist `prettier --write "**/*.{js,json,md}"`; die angehängten Flags machen daraus keine Prüfung. Es schrieb 135 verfolgte Dateien um, darunter `CLAUDE.md` und den versionierten Stil-Sollstand. Die Rücknahme erfolgte über einen gesicherten Patch und wurde unabhängig nachgemessen: beide Dateien sind unverändert, kein verfolgter Quelltext ist verschmutzt, die Commits berühren nur die beabsichtigten Dateien.

**Empfehlung:** `npm run format` umbenennen oder entfernen, Prüfungen nur über `npx prettier --check <datei>`.

## Bewusst offen

**Große Empfehlungen des Reviews** („Weitere Verbesserungen", vom Review selbst als spätere, zu messende Arbeit angesetzt):

1. Datenmodell weiter zentralisieren: `load()`, `importFullExport` und Undo über denselben Anwende-Pfad; eine einzige Feldtabelle; echter Schema-Versionsstempel (`APP_CONFIG.VERSION` 2.6.1 liegt unter dem Migrationsschlüssel 5.0.0).
2. Undo-Speicherbedarf ohne wiederholte Vollscans — braucht Messungen mit großen Beispielkampagnen.
3. Rendering auf betroffene Ansichten begrenzen — braucht vorher eine Messung, welche Renderer teuer sind.
4. Typprüfung ausweiten (`checkJs` deckt 8 von 134 Dateien).
5. Bundle-Minifizierung und Wiederverwendung des geprüften Artefakts im Deploy-Job.

**Weitere dokumentierte Folgearbeit:** 49 gesichtete Restpunkte mit Beleg und Einstufung, darunter die doppelte Auslösung von Dateiauswahl-Feldern in `ui/event-delegation.js`, eine `.gitattributes` gegen die CRLF-Falle bei `git checkout`, und `npm run format:check` (an jedem Stand rot, kein Gate).

**Ebenfalls offen:** die volle Vier-Themes-Sichtung aus Plan 15-14 des Milestones v1.3. Sie ist jetzt sinnvoller als zuvor, weil Backup-, Import- und Speicher-Code sich geändert haben.

## Hinweis zum GSD-Ablauf

Diese Arbeit lief außerhalb des GSD-Phasenablaufs. `.planning/` und `CLAUDE.md` wurden bewusst nicht angefasst.
