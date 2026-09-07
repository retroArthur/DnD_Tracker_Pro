# Phase 12 — API Coverage Declaration

No external API integration: Die Phase fasst ausschließlich Browser-Plattform-APIs an (localStorage, IndexedDB, File System Access API) — kein fetch/XHR, kein externer Dienst, kein SDK.

---

## Begründung (für den `api-coverage`-Gate)

Der Detektor schlägt auf dem Substring „api" innerhalb der Phrase **„File System Access API"** an.
Das ist eine Browser-Plattform-Schnittstelle (`window.showDirectoryPicker()`,
`FileSystemDirectoryHandle.createWritable()`), kein externer Dienst, kein Endpunkt und kein SDK.

Belege aus dem Quellstand der Phase:

- Die von der Phase geänderten Dateien (`systems/migration/migration-wizard.js`,
  `systems/migration/audio-export.js`, `systems/migration/full-export.js`,
  `systems/file-backup/file-backup-manager.js`, `systems/undo.js`,
  `features/soundboard/soundboard-crud.js`, `features/soundboard/soundboard-idb.js`,
  `systems/spellslots/persistence.js`, `systems/avatars.js`) enthalten keinen `fetch(`-,
  `XMLHttpRequest`- oder `WebSocket`-Aufruf.
- Das Projekt läuft laut `12-CONTEXT.md` § „Übernommen aus früheren Phasen" primär unter `file://`
  per Doppelklick auf `dist/dnd-tracker-bundled.html`. Ein Netzwerkaufruf wäre dort strukturell
  nicht verlässlich und ist deshalb auch nirgends vorgesehen.
- Es gibt keine Runtime-Dependency (`12-CONTEXT.md`, D-01) — kein SDK, das eine Abdeckungsmatrix
  bräuchte.

Eine Coverage-Matrix wäre hier eine Erfindung ohne Gegenstand. Diese Erklärung tritt gemäß
Capability-Contract an ihre Stelle.

**Nutzer-Adjudikation:** Am 2026-08-26 hat der Entwickler den Treffer als Fehlalarm eingestuft und
das `verify:pre`-Gate übersteuert; festgehalten in `12-VERIFICATION.md` § `acknowledged_gaps`. Diese
Datei ist die dauerhafte Fassung derselben Feststellung, damit der Block nicht bei jedem
Versiegelungslauf erneut auftritt.
