---
threats_open: 0
audit_date: 2026-07-26
audited_phases: [1, 2, 9, 10]
audit_level: L1 (ASVS Level 1, grep+source-verification depth)
milestone: v1.1 Tech-Debt & Härtung
---

# Security — D&D Kampagnen-Tracker Pro

> Konsolidierte Sicherheitsbilanz über die vier kritischen Angriffsflächen der App:
> **Import/Export**, **Storage & IndexedDB**, **Datei-Backup** und **Rich-Text & innerHTML**.
>
> Dieser Audit läuft gegen den Code-Stand **nach** allen Sicherheits-Fixes des
> Meilensteins v1.1 (Phase 10, abgeschlossen 2026-07-25; Gap-Closure-Runde Plan 10-06
> korrigiert am 2026-07-26). Vor dem Audit wurde die volle Test-Suite grün gestellt:
> **554/554 Jest-Tests**, **317 passed / 2 skipped Playwright-E2E-Tests** (die beiden
> Skips sind PWA-Tests, die HTTPS/localhost voraussetzen und unabhängig vom Ergebnis
> dieses Audits sind; die zwei zusätzlichen `passed`-Fälle gegenüber dem ursprünglichen
> Stand von 315 stammen aus Plan 10-06s Mehrfach-Vektor- und Randfall-Regressionstest).
>
> **Korrektur (Plan 10-06, 2026-07-26):** dieser Abschnitt behauptete zuvor "Status: 0
> offen" für den Tabellen-Einfügepfad, obwohl der Code-Review (`10-REVIEW.md` CR-01)
> und die Phasen-Verifikation (`10-VERIFICATION.md`, Erfolgskriterium SC3) einen
> reproduzierbaren, gleichen-Origin-Skriptausführungspfad ohne begründete
> Annahme-Disposition fanden. Der Fund ist jetzt strukturell behoben (DOM-basierter
> Allowlist-Sanitizer als letzte Stufe vor dem Einfügen) — Abschnitt 4, Befund 4 und
> akzeptiertes Restrisiko 3 unten spiegeln den bewiesenen Endstand.
>
> **`threats_open: 0`** bedeutet: jeder in den vier Angriffsflächen erfasste Threat
> ist entweder behoben (`mitigate`, verifiziert gegen den aktuellen Quelltext) oder
> mit schriftlicher Begründung als akzeptiertes Restrisiko eingestuft (`accept`).
> Kein Eintrag ist ohne Disposition.
>
> Quelle jeder Zeile dieser Bilanz: die vier Per-Phasen-Audit-Artefakte unter
> `.planning/phases/`:
> - [`01-stabilisierung/01-SECURITY.md`](.planning/phases/01-stabilisierung/01-SECURITY.md) — Import/Export, Storage & IndexedDB (retroaktives STRIDE-Register, 7 Threats)
> - [`02-technik-fundament/02-SECURITY.md`](.planning/phases/02-technik-fundament/02-SECURITY.md) — Datei-Backup (retroaktives STRIDE-Register, 5 Threats)
> - [`09-editor-regressionsnetz-execcommand-abl-sung/09-SECURITY.md`](.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-SECURITY.md) — Rich-Text & innerHTML, neue Editor-Implementierung (5 konsolidierte Threats aus ~24 Plan-Einträgen)
> - [`10-security-h-rtung/10-SECURITY.md`](.planning/phases/10-security-h-rtung/10-SECURITY.md) — die Fixes selbst (22 Threats + Lieferketten-Eintrag; plus 7 Gap-Closure-Zeilen T-10-23..T-10-29 aus Plan 10-06)

---

## 1. Import/Export

**Geprüfte Dateien und Codepfade:**
- `systems/spellslots/import-export.js` — `HTML_FIELDS_BY_TYPE` (Zeile 148, neun Entity-Typen), `sanitizeImportedItem()` (Zeile 164), beide Import-Eintrittspunkte: `showImportModal()`/`executeImport()` (typspezifisch, Zeilen 285/374) und `importDataGlobal()` (global, Zeile 499, BEIDE Zweige — „neue Kampagne" via `StorageAPI.setJSON` und „überschreiben" via `Object.assign(D, imp)`)
- `ui/editors/markdown-converter.js` — `renderMarkdownInContent()` (Zeile 258), sanitisiert seit Phase 10 identisch zu ihrem Zwilling `markdownToHtml()`
- `features/wiki/wiki.js` — `renderWikiDetail()` (Zeile 401): Sanitisierung läuft VOR der TOC-Anker-Injektion (Zeilen 427-431); Speichern-Pfad (Zeile 710), Wiedereröffnen-Pfad (Zeile 753)

**Erfasste Threats:** 12 (7 aus dem Phase-1-Register, 5 aus dem Phase-10-Register für dieselbe Fläche) — alle `mitigate` (behoben, verifiziert) bis auf zwei `accept`-Einträge (Rückverfolgbarkeits-Rauschen bei Sanitisierungs-Meldungen, Feldlisten-Scope). Details: [`01-SECURITY.md`](.planning/phases/01-stabilisierung/01-SECURITY.md), [`10-SECURITY.md`](.planning/phases/10-security-h-rtung/10-SECURITY.md).

**Status:** 0 offen.

---

## 2. Storage & IndexedDB

**Geprüfte Dateien und Codepfade:**
- `systems/spellslots/persistence.js` — `saveImmediate()` (Zeile 34), `LS_LIMIT_MB = 5`-Schwelle (Zeilen 49, 214), Entfernung des localStorage-Schattens nach bestätigtem IndexedDB-Write (Zeilen 63-66, 216-217)
- `systems/spellslots/quick-roll.js` — `resolveStorageConflict()` (Zeile 23): kein Selbstbezug, anders benannter optionaler Hook `window.showStorageConflictDialogUI`, deterministischer IDB-Vorrang-Fallback
- `systems/campaign-manager/campaign-manager.js` — je Kampagne ein eigener Speicherschlüssel (`'dnd-campaign-' + Date.now()`, Zeile 27)

**Erfasste Threats:** 5 (Phase-1-Register) — 3 `mitigate` (behoben), 2 `accept` (Speicherschlüssel-Kollision, Feldlisten-Scope aus Import geteilt).

**Status:** 0 offen.

---

## 3. Datei-Backup

**Geprüfte Dateien und Codepfade:**
- `systems/file-backup/file-backup-manager.js` — atomares Schreiben via `createWritable()`→`write()`→`close()` (Zeile 77), Registrierungspunkt für Nachspeicher-Rückrufe `window.registerPostSaveHook(onAfterSave)` (Zeilen 345-346), Snapshot-Begrenzung `FILE_BACKUP_MAX_SNAPSHOTS = 10` (Zeile 17)
- `systems/file-backup/file-backup-permissions.js` — `restoreBackupFolder()` (nur lesendes `queryPermission()`, Zeile 79) vs. `requestBackupFolderPermission()` (schreibendes `requestPermission()`, Zeile 105, ausschließlich aus Klick-Handlern aufgerufen)
- `systems/spellslots/persistence.js` — generischer `registerPostSaveHook()`-Mechanismus (Zeilen 14-20, 275), der den historischen `window.save`-Wrapper-Bug behebt (bare `save()`-Aufrufe umgingen jeden Wrapper strukturell, siehe CLAUDE.md)

**Erfasste Threats:** 5 (Phase-2-Register) — 4 `mitigate` (behoben), 1 `accept` (persistiertes Verzeichnis-Handle als beabsichtigtes Capability-Modell der File System Access API).

**Status:** 0 offen.

---

## 4. Rich-Text & innerHTML

**Geprüfte Dateien und Codepfade:**
- `ui/editors/rich-text.js` — `handleEditorPaste()` (Zeile 952) mit dem Tabellenzweig: die Kosmetik-Kette (Rausch-Tags, Layout-Attribute, Default-Stil-Injektion — Zeilen ~968-994, ausdrücklich KEINE Sicherheitskontrolle mehr seit Plan 10-06) mündet jetzt in `window.sanitizeHTML()` als LETZTE Transformation vor `insertHtmlAtSelection()` — **derselbe Sanitizer, der auch die Speichern-Grenze bildet** (nicht länger eine separate, schwächere Bereinigung). Fail-closed-Rückfall auf `insertTextAtSelection()`, falls der Sanitizer nicht erreichbar ist oder nur Leerraum liefert. Die in Plan 10-04 ergänzten, leerraum-abhängigen Ereignis-Attribut-Regexe wurden entfernt (waren umgehbar, siehe Befund 4). `insertHtmlAtSelection()` (Zeile 850, alle drei aktuellen Aufrufstellen geprüft; Kommentar zur Nicht-Ausführung von Skript-Inhalten korrigiert — gilt nur für parser-erzeugte `<script>`-Elemente, NICHT für `<iframe srcdoc>`); die Selection/Range-Formatierungshilfsfunktionen aus der execCommand-Ablösung (`wrapRangeWithElement`, `closestEditorAncestor`, `clearInlineFormattingAtSelection`, `applyFontFamilyToSelection`/`applyFontSizeToSelection`); Link-Einfügen (Zeile 1240, `prompt()` → `link.href`); `saveSpell()` (Zeile 1632, `sanitizeHTML(descHtml)` an Zeile 1684)
- `utils/basic.js` — `sanitizeHTML()` (Zeile 58): die maßgebliche Speichern-Grenze UND (seit Plan 10-06) die maßgebliche Grenze des Tabellen-Einfügepfads. `allowedTags` (Zeile 72) enthält bewusst KEIN `img`, `script`, `iframe`, `object`, `embed`, `form`, `input`, `style`, `link`, `meta`, `base`, `svg`, `math` — nicht erlaubte Tags werden auf ihren Textinhalt reduziert, nie als lebendes Element belassen. `href` wird protokoll- UND formgeprüft (Zeile 168ff.: nur `http://`/`https://`/`/`/`#`/`./`), entitäts-kodierte Protokollwerte eingeschlossen (der DOM-Parser dekodiert Attributwerte vor der Prüfung). Ereignis-Attribute (`on*`) werden bedingungslos blockiert (Zeile 150). `src` steht nie auf der Attribut-Erlaubnisliste.
- Beleg für den Tabellen-Einfügepfad: `tests/e2e/features/editor-insert.spec.js` — "Sicherheits-Regression: Tabellen-Paste mit eingebettetem Rahmen, Vektorgrafik und Skript-Protokoll landet weder ausführbar noch als verbotenes Element im DOM (SC3, CR-01)" (rot vor dem Fix, grün danach) sowie der begleitende Randfall-Test für den Fail-closed-Zweig.

**Erfasste Threats:** 34 (5 aus dem konsolidierten Phase-9-Register, 22 aus dem ursprünglichen Phase-10-Register, 7 aus der Gap-Closure-Runde Plan 10-06: T-10-23..T-10-29) — 26 `mitigate` (behoben), 7 `accept`, 1 `mitigate`/Prozess (Ledger-Status).

**Status:** 0 offen.

---

## In dieser Phase behobene Befunde

Alle folgenden Befunde sind mit rot-vor-dem-Fix / grün-danach-Beweisen (E2E und/oder Unit) dokumentiert; Details je Fund in den Per-Phasen-Artefakten:

1. **Import-Ausführungspfad über die Wiki-Anzeige** (CR-01 aus `01-REVIEW.md`, kritisch): `renderMarkdownInContent()` gab HTML ungesäubert zurück; der Wiki-Anzeigepfad rief kein `sanitizeHTML()` auf. Ein `<img src=x onerror=…>` im importierten Wiki-Inhalt führte beim Öffnen des Eintrags ohne Klick aus. **Fix:** `renderMarkdownInContent()` sanitisiert jetzt identisch zu ihrem Zwilling `markdownToHtml()`; `renderWikiDetail()`s Aufrufreihenfolge wurde gedreht (Sanitisierung vor Anker-Injektion). Plan 10-01.
2. **Import-Feldbereinigung an beiden Eintrittspunkten und in beiden Zweigen:** Weder `executeImport()` noch `importDataGlobal()` sanitisierten importierte HTML-tragende Felder vor der Persistenz — Rohdaten-at-Rest blieben unsauber, auch nachdem die Anzeige-Grenze geschlossen war (mehrere Render-Pfade vertrauen auf saubere Speicherinhalte). **Fix:** `HTML_FIELDS_BY_TYPE` + `sanitizeImportedItem()` an beiden Eintrittspunkten verdrahtet, für BEIDE Zweige des globalen Imports (neue Kampagne UND Überschreiben). Plan 10-02.
3. **Fehlender Rückgängig-Punkt beim überschreibenden Import (WR-03):** `importDataGlobal()`s Überschreib-Zweig führte die destruktivste mögliche Operation (Komplett-Überschreibung aller Kampagnendaten) ohne `saveUndoState()` und ohne Sicherungskopie aus — nicht per Strg+Z rückgängig zu machen. **Fix:** `saveUndoState()` + `createAutoBackup()` vor `Object.assign(D, imp)`, nach dem Muster von `executeImport()`. Plan 10-02.
4. **Einfügepfad für Tabellen-Markup (Broken-Windows-Ledger-Eintrag 1):** Der Tabellenzweig von `handleEditorPaste()` entfernte eine feste Liste von Attributen (`class`/`style`/`width`/…), aber NICHT Ereignis-Attribute (`on*`) — ein `onerror`-Attribut in eingefügtem Tabellen-HTML überlebte bis in den Editor-DOM und feuerte. **Ursprünglicher Fix (Plan 10-04, unvollständig):** dasselbe Ereignis-Attribut-Regex-Paar wie `sanitizeHTML()` an den Anfang der Bereinigungskette gesetzt, Ledger-Eintrag als geschlossen geführt (`open_count: 0`). Dieser Fix war **nicht vollständig**: beide Muster verlangten ein führendes Leerzeichen vor dem Attribut und ließen sich durch ein direkt anschließendes Attribut umgehen; darüber hinaus gab es weder eine Tag-Erlaubnisliste noch eine Protokollprüfung im Tabellenzweig. Ein eingebettetes Rahmen-Element mit Inline-Dokument-Attribut (`<iframe srcdoc>`) in eingefügtem Tabellen-Markup führte dadurch fremden Code im Origin der App aus — sofort beim Einfügen, ohne Klick, ohne Speichern, ohne Neuladen. Der Code-Review (`10-REVIEW.md` CR-01) und die Phasen-Verifikation (`10-VERIFICATION.md`, Kriterium SC3) deckten das nach dem ursprünglichen Audit auf; drei unabhängige Prüfer reproduzierten den Vektor empirisch gegen das Produktions-Bundle, unter anderem per echtem Zwischenablage-Einfügen (Strg+V). **Vollständiger Fix (Plan 10-06, Gap-Closure):** der Tabellenzweig führt sein bereinigtes Markup jetzt durch den projektweiten, DOM-basierten Allowlist-Sanitizer `window.sanitizeHTML()` (`utils/basic.js`) als LETZTE Transformation vor dem Einfügen — dieselbe Kontrolle, die bereits die Speichern-Grenze bildet. Die umgehbaren Ereignis-Attribut-Regexe wurden entfernt; ein Fail-closed-Rückfall auf reinen Klartext greift, falls der Sanitizer nicht erreichbar ist oder keinen Inhalt liefert. Beleg: neuer Mehrfach-Vektor-Regressionstest in `tests/e2e/features/editor-insert.spec.js` (rot vor dem Fix, grün danach) plus begleitender Randfall-Test.
5. **Zauber-Speicherpfad:** `saveSpell()`s Beschreibungsfeld wurde ungesäubert gespeichert, inkonsistent zum unmittelbar benachbarten Notizfeld. **Fix:** `sanitizeHTML(descHtml)` vor der Zuweisung, identisches Muster zum Notizfeld. Plan 10-04.
6. **Datenintegritätsfehler bei durchgestrichenem Text:** `<strike>` fehlte in der `sanitizeHTML`-Erlaubnisliste — Strikethrough-Formatierung ging beim Speichern-/Reload-Zyklus verloren (in Phase 9 als Datenintegritäts-Bug eingefroren, für Phase 10 vorgemerkt). **Fix:** `<strike>` synchron in `utils/basic.js` UND `utils/testable-utils.js` ergänzt, abgesichert durch einen neuen Paritätstest (61 Tests), der künftige Whitelist-Drift zwischen den beiden Sanitizer-Kopien strukturell verhindert. Plan 10-03.

---

## Bewusst akzeptierte Risiken

**1. Keine Content-Security-Policy (CSP).**
Weder `index.html` noch der `build.py`-HTML-Template emittieren einen CSP-Meta-Tag. **Begründung:** Die App läuft als Einzelnutzer-Anwendung ohne Server (offline, `file://` oder lokale PWA) — es gibt keinen Angreifer, der aus der Ferne eine fremde Origin injizieren könnte. Die Single-File-Architektur (alles inline in einer HTML-Datei) würde eine CSP architekturbedingt ohnehin auf `'unsafe-inline'` für Skripte zwingen, was den Großteil des theoretischen Nutzens einer CSP aufhebt. Eine wirksame CSP müsste zusätzlich sowohl unter `file://` als auch in der installierten PWA/Service-Worker-Variante getestet werden — Aufwand ohne nennenswerte Restrisiko-Senkung angesichts des Nutzungsmodells (siehe Abschnitt „Bedrohungsmodell" unten).

**2. Breite der Klassen- und Stil-Erlaubnis im Sanitizer.**
`sanitizeHTML()` (`utils/basic.js:59-69`) erlaubt beliebige `class`-Attribute auf sanitisiertem Rich-Text-Content sowie eine Reihe von Layout-relevanten `style`-Eigenschaften (`width`, `margin`, `padding`, u.a.). Nutzer-Content könnte damit theoretisch App-eigene CSS-Klassen (z. B. Modal-/Overlay-Klassen) für UI-Redressing übernehmen oder das Layout brechen. **Begründung:** Einzelnutzer-Anwendung — der einzige, der Rich-Text-Inhalte erzeugt, ist der Spielleiter selbst, für seine eigene Kampagne. Es gibt kein Multi-Tenant-Szenario, in dem ein böswilliger Mitspieler Inhalte einschleusen könnte, die der DM ungeprüft übernimmt. Tags bleiben allowlisted, Ereignis-Handler und gefährliche Protokolle bleiben entfernt — keine Skript-Ausführung ist möglich, nur Layout-Beeinträchtigung im schlimmsten Fall.

**3. Verbleibende Sprödigkeit der regexbasierten Kosmetik-Kette vor dem Sanitizer (T-10-29, korrigiert 2026-07-26, Plan 10-06).**
Diese Begründung beschrieb bis zur Gap-Closure-Runde eine bewusst beibehaltene regexbasierte SICHERHEITSKONTROLLE im Einfüge-Handler — das war der Fund, den Plan 10-06 behebt (siehe Befund 4 oben). Der Tabellenzweig von `handleEditorPaste()` (`ui/editors/rich-text.js`) durchläuft eine Kette regulärer Ausdrücke weiterhin, aber ausschließlich zur DARSTELLUNGS-Kosmetik (Rausch-Tags entfernen, Default-Tabellenoptik injizieren) — NICHT mehr zur Sicherheitsentscheidung. Diese trifft seit Plan 10-06 ausschließlich der nachgelagerte, DOM-basierte Allowlist-Sanitizer `window.sanitizeHTML()`, der als letzte Stufe vor dem Einfügen läuft. **Verbleibendes, echtes Restrisiko:** die Kosmetik-Kette kann in Grenzfällen (verschachtelte Anführungszeichen, exotische Paste-Quellen) die DARSTELLUNG eingefügter Tabellen beeinträchtigen — verlorene Auszeichnung, unerwartete Zellstruktur. **Begründung, warum das akzeptabel bleibt:** die Kette kann kein verbotenes Element (`iframe`/`object`/`embed`/`svg`/`form`/`img`) und kein gefährliches Protokoll mehr einführen, weil der Allowlist-Sanitizer nach ihr läuft und diese Schwäche nicht teilt (DOMParser-basiert, entitäts-kodierte Attributwerte werden vor der Protokollprüfung dekodiert). Ein Umbau der Kosmetik-Kette selbst auf einen DOMParser-Ansatz würde keinen Sicherheitsgewinn mehr bringen (die Sicherheitsentscheidung liegt bereits beim Sanitizer) und nur das Risiko einer Verhaltensänderung im eingefrorenen Editor-Netz tragen — deshalb bewusst nicht angegangen. Dokumentiert als T-10-29/AR-10-05 in `10-SECURITY.md`.

### Dokumentierte Folgen (kein Stub, kein offener Fehler)

- **Wegfall der Hintergrund-Auszeichnung für Backtick-Code-Abschnitte in der Wiki-Ansicht:** Vor Plan 10-01 stellte NUR die Wiki-Ansicht Backtick-Text (`` `text` ``) mit einem eigenen `<code>`-Hintergrund dar, weil `wiki.js` als einziger Renderer den `renderMarkdownInContent()`-Rückgabewert bisher nicht sanitisiert hatte. Alle anderen Entity-Ansichten verloren diese Auszeichnung bereits vorher (`code` steht nicht in `sanitizeHTML()`s `allowedTags`). Nach dem Fix verhält sich die Wiki-Ansicht konsistent zu allen anderen Renderern — der Text bleibt vollständig erhalten, nur die Hintergrund-Auszeichnung entfällt. Automatisiert nachgewiesen durch `tests/e2e/features/wiki.spec.js#Textererhalt`.
- **Mögliche Index-Abweichung der Inhaltsverzeichnis-Sprungmarken bei gemischten Überschriftenformaten:** `renderWikiTOC(entry.content)` bleibt bewusst auf dem Rohinhalt statt auf dem sanitisierten/verankerten Markup — `extractWikiTOC()` und `addTOCAnchors()` liefern bei reinem HTML-Überschriften-Content dieselbe Trefferreihenfolge; bei gemischtem HTML+Markdown-Überschriften-Content in einem einzelnen Wiki-Eintrag könnte die Reihenfolge abweichen. Restbedingung dokumentiert in `10-01-SUMMARY.md`.

---

## Bedrohungsmodell des Nutzungsmodells

Die App ist eine **Einzelnutzer-Anwendung ohne Server**: sie läuft vollständig offline im Browser (oder als installierte PWA), persistiert ausschließlich lokal in `localStorage`/IndexedDB, und kennt keine Anmeldung, keine Benutzerkonten und keine Netzwerk-Kommunikation außer optionalem Laden von Google Fonts. Kampagnendaten liegen **unverschlüsselt lokal** auf dem Gerät des Spielleiters. Diese Rahmenbedingungen ordnen die oben akzeptierten Risiken ein:

- Es gibt keinen entfernten Angreifer im klassischen Web-Sinn — der einzige realistische Vektor für schädlichen Content ist eine geteilte Kampagnen-Exportdatei, die ein Nutzer selbst importiert (genau der Vektor, den Phase 10 mit den Import-/Anzeige-Grenzen geschlossen hat).
- Ohne Server-Backend gibt es keine Session, keine Authentifizierung und keine mehrstufige Rechtevergabe, die zu schützen wäre.
- Datenverlust (nicht Datenexfiltration) ist das dominante Risiko dieser App — entsprechend liegt der Schwerpunkt der Sicherheitsarbeit auf Undo-Punkten, Sicherungskopien und deterministischer Konfliktauflösung zwischen Speicher-Backends, nicht auf klassischer Netzwerk-Härtung.

---

## Meldeweg

Sicherheitsrelevante Funde bitte über ein GitHub-Issue im Repository melden (Label `security`, falls verfügbar) oder direkt an den Projektbetreuer. Da die App keine Nutzerdaten auf einem Server verarbeitet, gibt es kein zentrales Incident-Response-Verfahren — jeder Fund betrifft potenziell lokal gespeicherte Kampagnendaten einzelner Nutzer und wird als regulärer Bugfix (Priorität nach Schweregrad) behandelt.

---

*Konsolidiert aus den vier Per-Phasen-Audit-Artefakten am 2026-07-25; Abschnitt 4, Befund 4 und akzeptiertes Restrisiko 3 korrigiert am 2026-07-26 (Plan 10-06 Gap-Closure, schließt SC3 aus `10-VERIFICATION.md`). Nächster Audit fällig bei substanzieller Änderung einer der vier Angriffsflächen oder auf Anfrage.*
