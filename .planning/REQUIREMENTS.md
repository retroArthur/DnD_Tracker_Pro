# Requirements: D&D Kampagnen-Tracker Pro — v1.2 Schulden-Abbau

**Defined:** 2026-08-06
**Core Value:** Die App muss am Spieltisch zuverlässig offline laufen — ein Spielleiter-Begleiter,
der nie im Weg steht und keine Daten verliert.

**Milestone-Ziel:** Die 26 in der v1.1-Triage erfassten `DEBT`-Posten abarbeiten — allen voran die
Datenverlust-Risiken in Backup, Export und Migration — damit der Backlog leer ist und v1.3 wieder
Features bringen kann.

**Herkunft:** Alle Posten stammen aus der Phase-11-Triage und tragen dort einen gegen den Live-Code
geprüften Beleg:
[`11-CONCERNS-TRIAGE.md`](milestones/v1.1-phases/11-architektur-build-hygiene/11-CONCERNS-TRIAGE.md).
Die ungekürzten Beschreibungen stehen in
[`milestones/v1.1-REQUIREMENTS.md`](milestones/v1.1-REQUIREMENTS.md).

**Nicht verhaltensneutral.** Anders als v1.1 ändert dieser Milestone spürbar, was gesichert und
wiederherstellbar ist (`SAFE-01`, `SAFE-02`, `SAFE-04`).

---

## v1.2 Requirements

### Datensicherheit — Verlust verhindern

- **SAFE-01** ✓ (`DEBT-18`, Phase 12: 12-01 + 12-02 komplett): Der Umzugs-Export `file://` → PWA
  erfasst die IndexedDB-Inhalte. Heute
  deckt `FULL_EXPORT_SCHEMA` (`systems/migration/full-export.js:9-18`) nur fünf
  localStorage-Felder ab — Soundboard-Audio (`audioBlobs`) und Würfelstatistik (`diceStats`) gehen
  beim einmaligen, angeleiteten Umzug **irreversibel** verloren, und Szenen bleiben mit toten
  `blobId`s zurück. **Höchste Priorität des Milestones.**
- **SAFE-02** ✓ (`DEBT-21`, `DEBT-22`, Phase 12: 12-03 komplett): Das Datei-Backup deckt alle
  Kampagnen ab und kann sie nicht gegenseitig überschreiben. `_doBackup()` iteriert jetzt über
  `resolveBackupTargets()` (Standard-Kampagne + Index) statt nur die aktive Kampagne zu sichern;
  `getBackupFilenames()` hängt den Kampagnen-Key nur bei einer echten `safeName`-Kollision an
  (inkl. des Leerstring-Falls bei rein nicht-lateinischen Namen), sonst bleibt der Dateiname
  unverändert.
- **SAFE-03** ✓ (`DEBT-19`, Phase 12: 12-06 komplett): Das Löschen einer Audiodatei ist rückgängig
  zu machen. `removeAudioFile()` ruft jetzt `saveUndoState()` vor jeder Mutation und löscht den Blob
  aufgeschoben (Grabstein statt Sofortlöschung); ein Undo-Hook stellt bei `Strg+Z` sowohl die
  Szenen-Referenz als auch die Datei selbst wieder her — bewiesen bis in eine echte Browser-Session
  inklusive Reload.
- **SAFE-04** ✓ (`DEBT-20`, Phase 12: 12-04 komplett): Der Umzugs-Wizard bietet sich nicht mehr Nutzern mit vollen Daten an.
  `isFreshInstall()` prüft nur `APP_CONFIG.STORAGE_KEY` und ignoriert `window.STORAGE_KEY_OVERRIDE`
  sowie den IDB-only-Löschpfad — denselben Codepfad, der `DEBT-17` verursacht hat.
- **SAFE-05** ✓ (`DEBT-05`, `DEBT-08`, Phase 12: 12-05 komplett): Die Persistenz verhält sich bei Fehlern und Sonderfällen
  vorhersagbar. `undo()`/`redo()` mutieren die Stacks **vor** der `safeJSONParse`-Prüfung (Asymmetrie
  bei Parse-Fehlern); `saveImmediate()` lässt sich über ein optionales, im UI gar nicht vorhandenes
  `autosave-toggle` deaktivieren — ohne Ausnahme für kritische Saves.
- **SAFE-06** ✓ (`DEBT-11`, Phase 12: 12-07 komplett): Die Persistenz-Randfälle sind getestet — >5-MB-IDB-only-Save mit Reload,
  localStorage-Quota-Fallback, Export/Import-Versions-Rundlauf. Es ist dieselbe Testlücken-Klasse,
  die `DEBT-17` verdeckt hat.

### Sicherheit

- **SEC-03** ✓ (`DEBT-23`, Phase 13: 13-01 komplett): Die generische `call`-Aktion
  (`ui/actions/ui-actions.js`) ruft `window[ctx.value]` nur noch auf, wenn `ctx.value` in der
  neuen `CALL_ACTION_WHITELIST` (130 Namen, `core/constants.js`) steht. Fehlerpfad läuft über
  `ErrorHandler.log()` hinter `DEBUG_MODE` statt roher Konsolenausgabe.
- **SEC-04** ✓ (`DEBT-14`, Phase 13: 13-02 komplett): Die Regex-Capture in `parseWikiLinks()`
  (`features/wiki/wiki.js`) ist escapt — Attributwert UND sichtbarer Textknoten laufen durch `esc()`.

### Performance & Skalierung

- **PERF-01** (`DEBT-06`, `DEBT-07`): Undo-Snapshots und Speichervorgänge serialisieren nicht mehr
  bei jeder Operation die vollständige Kampagne. Heute läuft ein voller `JSON.stringify(window.D)`
  vor **jeder** destruktiven Operation (`UNDO_LIMIT` 30) und erneut samt Blob-Messung bei **jedem**
  `save()`/`saveImmediate()`.
- **PERF-02** (`DEBT-24`): Der Würfelstatistik-Store wächst nicht unbegrenzt und wird nicht komplett
  in den Speicher geladen — Prune- bzw. Löschfunktion vorhanden, `getAllStats()` arbeitet
  abschnittsweise.

### Wartbarkeit

- **MAINT-01** (`DEBT-04`): Die vier übergroßen Module sind aufgeteilt —
  `ui/editors/rich-text.js` (1932), `features/initiative.js` (1655),
  `features/dmscreen/dmscreen-render.js` (1576) und `features/wiki/wiki.js`. Aufteilung entlang
  bestehender Verantwortlichkeiten, ohne Verhaltensänderung.
- **MAINT-02** (`DEBT-25`, `DEBT-16`, `DEBT-13`, Phase 13: 13-02 Teil 1/2): Irreführende und tote
  Codestellen sind beseitigt — `const D`-Überschattung des globalen Datenobjekts (u. a.
  `features/soundboard/soundboard-player.js:145` mit einer Zahl), der tote `mindmap`-Schreib-Seed an
  zwei Stellen (`systems/backups.js:232`, `tools/debug.js:917`) und das doppelte `data-id`-Attribut
  in `features/wiki/wiki.js:391-392` (✓ entfernt in 13-02 — die zwei restlichen Punkte sind noch offen).
- **MAINT-03** ✓ (`DEBT-12`, Phase 13: 13-03 komplett): Der nie verdrahtete `hasHtmlTags`-Wächter
  (`ui/editors/markdown-converter.js:264`) ist entfernt. Die Unterstrich-Emphase-Regeln in
  `renderMarkdownInContent()` folgen jetzt der CommonMark-Wortgrenzenregel — URLs und Bezeichner mit
  ≥2 Unterstrichen werden nicht mehr korrumpiert.
- **MAINT-04** ✓ (`DEBT-03`, Phase 13: 13-02 komplett): Die letzten drei `document.execCommand`-Aufrufe
  außerhalb des Editor-Moduls sind abgelöst (`systems/entity-links.js:87`, `features/wiki/wiki.js:831`,
  `ui/actions/system-actions.js:82`) — das Verfahren dafür liegt aus Phase 9 vor.
- **MAINT-05** (`DEBT-09`, `DEBT-10`): Fragile Stellen sind abgesichert — Tab-Registry-Renderfunktionen
  werden nicht mehr allein per String-Name referenziert (bricht heute bei Umbenennung nur mit einer
  `DEBUG_MODE`-Warnung), und das ungeschützte `setInterval` in `initPerformanceMonitoring()`
  (`systems/backups.js:325`) bekommt denselben Guard wie `startAutoBackup()`.
- **MAINT-06** (`DEBT-27`, `DEBT-26`): Die Konsole bleibt in Produktionspfaden still, und die
  Kopfkommentare beschreiben den Code, der dasteht. Heute widersprechen `console.*`-Aufrufe außerhalb
  von `DEBUG_MODE`-Guards der CLAUDE.md-Zusicherung „Zero console.log in production", und
  `file-backup-manager.js:6,387` behauptet weiterhin das explizit verbotene
  `window.save`-Monkey-Patch-Muster, obwohl der Code korrekt `registerPostSaveHook()` nutzt.

### Tests & Gates

- **TEST-03** (`DEBT-15`): Die latente Toast-Race in `tests/e2e/crud/locations.spec.js` und
  `encounters.spec.js` ist geschlossen — der Seed-Nachzug aus Plan 08-02 fehlt dort als einziges.
- **TEST-04** (`DEBT-28`): Timeline, Reise, Fraktionen, Session-Prep und NPC-Generator haben
  dedizierte Testdateien. Heute teilen sich fünf Feature-Bereiche mit zusammen ~3200 Zeilen eine
  gemeinsame Sammel-Spec.
- **TEST-05** (`DEBT-01`): Die Lint-/Typecheck-/Coverage-Gates sind geschärft. **Bewusst als
  letztes** — schärfere Gates auf einer Codebasis, die gerade durch `MAINT-01` in vier Modulen
  aufgeteilt wird, würden gegen sich selbst arbeiten.

---

## Out of Scope

| Thema | Grund |
| --- | --- |
| Neue Spielleiter-Features | v1.2 ist ein Schulden-Milestone; Features erst wieder ab v1.3 |
| Soundboard Per-Track-Play (Layering) | Aus v1.0 zurückgestellt, Design liegt bereit — gehört zu einem Feature-Milestone |
| `DEBT-02` | Beim Aufsetzen als bereits erledigt erkannt: Plan 11-07 hat `CLAUDE.md` und `docs/bugfixes.md` mit abgeräumt (0 Treffer für das Drei-Pass-Dedup) |
| Vollaudit weiterer Fehlerklassen | Die Suche nach einer zweiten Stelle der `DEBT-17`-Bauart lief im v1.1-Integration-Check gezielt, nicht erschöpfend — eine systematische Nachsuche wäre ein eigenes Vorhaben |

---

## Traceability

| Requirement | DEBT-Posten | Phase |
| --- | --- | --- |
| SAFE-01 | DEBT-18 | Phase 12 — Complete (12-01, 12-02) |
| SAFE-02 | DEBT-21, DEBT-22 | Phase 12 — Complete (12-03) |
| SAFE-03 | DEBT-19 | Phase 12 — Complete (12-06) |
| SAFE-04 | DEBT-20 | Phase 12 — Complete (12-04) |
| SAFE-05 | DEBT-05, DEBT-08 | Phase 12 — Complete (12-05) |
| SAFE-06 | DEBT-11 | Phase 12 — Complete (12-07) |
| SEC-03 | DEBT-23 | Phase 13 — Complete (13-01) |
| SEC-04 | DEBT-14 | Phase 13 — Complete (13-02) |
| PERF-01 | DEBT-06, DEBT-07 | Pending |
| PERF-02 | DEBT-24 | Pending |
| MAINT-01 | DEBT-04 | Pending |
| MAINT-02 | DEBT-25, DEBT-16, DEBT-13 | Pending (Teil 1/2 in 13-02: data-id entfernt) |
| MAINT-03 | DEBT-12 | Phase 13 — Complete (13-03) |
| MAINT-04 | DEBT-03 | Phase 13 — Complete (13-02) |
| MAINT-05 | DEBT-09, DEBT-10 | Pending |
| MAINT-06 | DEBT-27, DEBT-26 | Pending |
| TEST-03 | DEBT-15 | Pending |
| TEST-04 | DEBT-28 | Pending |
| TEST-05 | DEBT-01 | Pending |

**19 Requirements decken alle 26 `DEBT`-Posten ab.** Die Bündelung fasst Posten zusammen, die
dieselbe Datei oder dieselbe Fehlerklasse betreffen — sie in einem Zug anzufassen ist billiger als
in zweien.
