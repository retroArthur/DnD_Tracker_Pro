# Phase 1: Stabilisierung — Pattern Map

**Erstellt:** 2026-06-12
**Dateien analysiert:** 12 zu erstellende/modifizierende Dateien
**Analoge gefunden:** 12 / 12

---

## Datei-Klassifizierung

| Neue/Modifizierte Datei | Rolle | Datenfluss | Nächster Analog | Match-Qualität |
|------------------------|-------|-----------|----------------|----------------|
| `systems/spellslots/persistence.js` | service | CRUD / file-I/O | `systems/spellslots/persistence.js` (self) | exact |
| `systems/spellslots/quick-roll.js` | service | CRUD / request-response | `systems/spellslots/quick-roll.js` (self) | exact |
| `systems/spellslots/version-migration.js` | service | transform | `systems/spellslots/version-migration.js` (self) | exact |
| `systems/spellslots/import-export.js` | service | file-I/O | `systems/spellslots/import-export.js` (self) | exact |
| `tools/debug.js` | utility | — | `tools/debug.js` (self) | exact |
| `build.py` | config | batch | `build.py` (self) | exact |
| `tests/unit/stability.test.js` | test | — | `tests/unit/stability.test.js` (self) | exact |
| `tests/build/test_build_deduplication.py` | test | — | `tests/build/test_build_deduplication.py` (self) | exact |
| `tests/e2e/smoke.spec.js` | test | event-driven | `tests/e2e/app.spec.js` | role-match |
| `.github/workflows/ci.yml` | config | batch | `.github/workflows/ci.yml` (self) | exact |
| `docs/srd-license.md` | config | — | kein direkter Analog | no-analog |
| `CLAUDE.md` | config | — | `CLAUDE.md` (self) | exact |

---

## Pattern-Zuweisungen

### `systems/spellslots/persistence.js` (service, CRUD/file-I/O)
**Rolle:** Save-Pfad — wird für D-01, D-02, D-03, D-08 modifiziert

**Analog:** `systems/spellslots/persistence.js` (self — Erweiterung, kein Neubau)

**Bestehende Imports/Globals-Pattern** (Zeilen 15-18):
```javascript
const STORAGE_KEY = window.STORAGE_KEY;
const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
const D = window.D;
const updateSaveIndicator = window.updateSaveIndicator;
```

**Kern-Pattern: IDB-only-Zweig** (Zeilen 33-39 — der Stale-Shadow-Bug sitzt hier):
```javascript
if (dataSizeMB > LS_LIMIT_MB) {
    await saveToIndexedDBFallback(key, dataString);
    updateSaveIndicator('saved');
    showToast('💾 Große Kampagne in IndexedDB gespeichert', 'success');
    broadcastSave();
    return;
}
```
**Zu ergänzen für D-01 (Stale-Shadow-Fix):** Nach `saveToIndexedDBFallback()`:
```javascript
// NEU D-01: LS-Schatten-Key entfernen
StorageAPI.remove(key);
StorageAPI.remove(key + '_ts');
```

**Normaler LS-Save-Pattern** (Zeilen 41-48 — Begleit-Timestamp hier einbauen):
```javascript
const saveResult = StorageAPI.set(key, dataString);
if (!saveResult.success) {
    throw new Error(saveResult.error);
}
updateSaveIndicator('saved');
broadcastSave();
```
**Zu ergänzen für D-01:** Nach `StorageAPI.set(key, dataString)`:
```javascript
// NEU D-01: Begleit-Timestamp setzen
StorageAPI.set(key + '_ts', String(Date.now()));
```

**Toast/Event-Log-Pattern für D-02 (Einmal-pro-Sitzung):**
```javascript
// Vorlage aus bestehendem Code: window._idbModeSeen als Session-Flag
if (!window._idbModeSeen) {
    window._idbModeSeen = true;
    showToast('Kampagne im IndexedDB-Modus (>5MB). Daten sicher.', 'info', 4000);
}
// Danach: kein Toast mehr, nur Event-Log-Eintrag
```

**Error-Toast-Pattern für D-03 (IDB-Schreibfehler):**
```javascript
// Vorlage: bestehender catch-Block Zeilen 63-67
catch (idbError) {
    updateSaveIndicator('error');
    showToast('❌ Speichern fehlgeschlagen! Daten exportieren empfohlen!', 'error', 8000);
}
```
**D-03 ergänzt:** Nach dem Fehler-Toast zusätzlich `exportAllDataAsFile()` anbieten (Button in Event-Log oder direkter Aufruf).

**IDB-Timestamp-Struktur** (Zeile 80 — bereits vorhanden, kein Handlungsbedarf):
```javascript
const request = store.put({ id: key, data: dataString, timestamp: Date.now() });
```

**4-MB-Warnung für D-08 (Einmal-pro-Sitzung):**
```javascript
// Bestehendes Pattern Zeilen 28-31 — ersetzen durch:
if (dataSizeMB > LS_WARNING_MB && dataSizeMB <= LS_LIMIT_MB) {
    if (!window._sizeWarningSeen) {
        window._sizeWarningSeen = true;
        showToast(`⚠️ Kampagne wird groß (${dataSizeMB.toFixed(1)}MB). Backup empfohlen!`, 'warning', 5000);
    }
    // Danach: nur noch Event-Log (showToast schreibt automatisch ins Event-Log)
}
```

---

### `systems/spellslots/quick-roll.js` (service, CRUD/request-response)
**Rolle:** Load-Pfad + Export-Stempel — wird für D-01, D-05, D-06, D-07 modifiziert

**Analog:** `systems/spellslots/quick-roll.js` (self)

**Bestehender Load-Pfad** (Zeilen 23-45 — genau hier sitzt der Stale-Shadow-Bug):
```javascript
async function load() {
    const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
    try {
        let s = StorageAPI.get(key, null);
        // Fallback zu IndexedDB wenn localStorage leer
        if (!s) {
            try {
                s = await loadFromIndexedDBFallback(key);
            } catch (e) { /* ... */ }
        }
        // ... Rest: JSON-Parse, Migration, Object.assign(D, p)
```
**Problem:** `if (!s)` — wenn LS einen alten (stale) Schatten enthält, wird IDB nie gelesen.

**D-01 Fix-Pattern für den Load-Pfad:**
```javascript
const lsData = StorageAPI.get(key, null);
const lsTs = lsData ? parseInt(StorageAPI.get(key + '_ts', '0'), 10) : 0;
let idbData = null, idbTs = 0;
try {
    const idbRecord = await loadFromIndexedDBFallbackRaw(key); // gibt {data, timestamp} zurück
    if (idbRecord) { idbData = idbRecord.data; idbTs = idbRecord.timestamp || 0; }
} catch (e) { /* kein IDB-Eintrag */ }

// D-07: Konflikt-Erkennung (nur beim Erstlade-Szenario)
if (lsData && idbData && lsTs === 0 && idbTs > 0) {
    const useIdb = await showStorageConflictDialog(lsData, idbData, idbTs);
    s = useIdb ? idbData : lsData;
} else if (lsData && (!idbData || lsTs >= idbTs)) {
    s = lsData;
} else if (idbData) {
    s = idbData;
}
```

**Export-Stempel-Fix (D-05)** — Zeile 133:
```javascript
// ALT (Bug):
exp._version = '2.11';
// NEU (D-05):
exp._version = APP_CONFIG.VERSION;  // z.B. '2.6.1'
```

**Legacy-Stempel-Erkennung beim Import (D-05)** — vor compareVersions (Zeile 63):
```javascript
// VOR der bestehenden compareVersions-Prüfung einbauen:
if (p._version === '2.11') {
    p._version = '2.0.0';  // Altformat → alle Migrationen laufen
}
if (!p._version || compareVersions(p._version, CURRENT_VERSION) < 0) {
    p = migrateData(p);
}
```

---

### `systems/spellslots/version-migration.js` (service, transform)
**Rolle:** Migrations-Andockpunkt für D-09 (Smart-Strip) und D-06 (Version 2.6.1)

**Analog:** `systems/spellslots/version-migration.js` (self)

**Bestehende MIGRATIONS-Objekt-Struktur** (Zeilen 9-51):
```javascript
const MIGRATIONS = {
    '2.3.0': (data) => {
        // Migration-Logik
        data.characters?.forEach((c) => { /* ... */ });
        return data;
    },
    '2.4.0': (data) => {
        // Mehrere Felder initialisieren
        if (!data.calendar) { data.calendar = { /* ... */ }; }
        return data;
    }
};
```

**Neues Migrations-Pattern für D-09 (Version 2.6.1):**
```javascript
'2.6.1': (data) => {
    // Smart-Strip: Leere D.mindmap-Keys entfernen (Normalfall)
    if (data.mindmap) {
        const hasRealContent = (
            (data.mindmap.nodes && data.mindmap.nodes.length > 0) ||
            (data.mindmap.connections && data.mindmap.connections.length > 0)
        );
        if (!hasRealContent) {
            delete data.mindmap;  // Leerer Seed → still entfernen
        }
        // Echte Inhalte: Migration gibt data UNVERÄNDERT zurück.
        // import-export.js prüft data.mindmap VOR migrateData() und löst Dialog aus.
    }
    return data;
},
```

**migrateData-Funktion** (Zeilen 53-71 — unverändert, Referenz für Planer):
```javascript
function migrateData(data) {
    const dataVersion = data._version || '2.2.0';
    let currentData = data;
    const versions = Object.keys(MIGRATIONS).sort();
    for (const version of versions) {
        if (compareVersions(dataVersion, version) < 0) {
            currentData = MIGRATIONS[version](currentData);
            currentData._version = version;
        }
    }
    currentData._version = CURRENT_VERSION;
    return currentData;
}
```

---

### `systems/spellslots/import-export.js` (service, file-I/O)
**Rolle:** Import-Pfad — Mindmap-Hinweis-Dialog (D-09/D-10), vorhandenes Import-Pattern

**Analog:** `systems/spellslots/import-export.js` (self)

**Bestehender Vollimport-Pfad** (`importDataGlobal()`, Zeilen 417-519) — Vorlage für Mindmap-Check:
```javascript
reader.onload = (e) => {
    const imp = JSON.parse(result);
    // ... Kampagnenname, Benutzer-Dialog
    delete imp._campaignName;
    delete imp._exportDate;
    delete imp._version;
    // Migration
    if (imp.characters) { imp.characters = imp.characters.map(/* ... */); }
    // ...
};
```

**D-09 Hook-Point:** VOR `delete imp._version` und VOR `migrateData()`-Aufruf:
```javascript
// NEU D-09: Mindmap-Inhalt prüfen VOR Migration
if (imp.mindmap) {
    const hasRealContent = (imp.mindmap.nodes?.length > 0 || imp.mindmap.connections?.length > 0);
    if (hasRealContent) {
        await showMindmapExportDialog(imp.mindmap, campaignName);  // D-09/D-10 Dialog
        // Nutzer hat Backup erstellt → jetzt löschen
    }
    delete imp.mindmap;  // Immer entfernen (Migration erledigt den Rest für LS-Daten)
}
```

**JSON-Download-Pattern für D-10 (Mindmap-Export):**
```javascript
// Vorlage: exportData() Zeilen 182-189
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `mindmap-backup-${campaignName.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').replace(/\s+/g, '-')}.json`;
a.click();
URL.revokeObjectURL(url);
```

**Bestehender Modal-Dialog-Ansatz** (Zeilen 303-323 — Vorlage für D-07/D-09-Dialoge):
```javascript
const modal = $('import-modal');
if (modal) {
    const infoEl = $('import-info');
    if (infoEl) {
        infoEl.innerHTML = `
            <div style="display: grid; gap: 8px;">
                <div><strong>Kampagne:</strong> ${esc(campaignName)}</div>
                <div><strong>Export-Datum:</strong> ${exportDate}</div>
                <div><strong>Einträge:</strong> ${validatedItems.length}</div>
            </div>
        `;
    }
    showModal('import-modal');
}
```

---

### `tools/debug.js` (utility, —)
**Rolle:** Boot-Crash-Fix — Zeile 99 entfernen (D-11)

**Analog:** `tools/debug.js` (self)

**Defekte Zeile** (Zeile 99 — die einzige Änderung):
```javascript
// ENTFERNEN:
const clearAllNodes = clearMindmap;
```
**Begründung:** `clearMindmap` existiert nicht mehr (Mindmap-Feature entfernt). Die `const`-Deklaration referenziert eine nicht mehr definierte Funktion und verursacht einen Boot-Crash.

**Kontext** (Zeilen 86-100 — nur Zeile 99 wird entfernt, Rest bleibt):
```javascript
function clearAllWiki() {
    if (!confirm(`Wirklich ALLE ${D.wiki?.length || 0} Wiki-Einträge löschen?`)) return;
    const count = D.wiki?.length || 0;
    D.wiki = [];
    save();
    // ...
}
// Alias für Rückwärtskompatibilität  ← DIESE ZEILE ENTFERNEN:
const clearAllNodes = clearMindmap;
function runAllTests() {  // ... weiter
```

---

### `build.py` (config, batch)
**Rolle:** Härtung — Pre-Build-Duplikat-Check, DEBUG_MODE-Assertion, Modullisten-Sync (STAB-07)

**Analog:** `build.py` (self)

**Bestehende Pass-3-Implementierung** (Zeilen 176-228 — hat den Body-Skip-Bug):
```python
def remove_duplicate_functions(js_code):
    for line_num, line in enumerate(lines):
        match = re.match(function_pattern, stripped)
        if match:
            func_name = match.group(1)
            if func_name in seen_functions:
                filtered_lines.append(f"// [DEDUP] Removed duplicate function: {func_name}")
                # BUG: Schleife berechnet Body-Ende, überspringt ihn aber nicht
                brace_count = 0
                in_function = False
                for i in range(line_num, len(lines)):
                    # ...
                    if in_function and brace_count == 0:
                        break
                continue  # ← Überspringt nur die function-Zeile, nicht den Body!
```

**Empfohlenes Ersatz-Pattern: Pre-Build-Check** (anstelle des Body-Fix — RESEARCH.md Zeilen 178-195):
```python
def check_duplicate_functions(source_dir, modules):
    """Schlägt fehl wenn doppelte Top-Level-Funktionsnamen in Quelldateien existieren."""
    func_pattern = re.compile(r'^function\s+(\w+)\s*\(', re.MULTILINE)
    seen = {}
    for module in modules:
        path = os.path.join(source_dir, module)
        if not os.path.exists(path):
            continue
        content = read_file(path)
        for match in func_pattern.finditer(content):
            name = match.group(1)
            if name in seen:
                print(f"[FEHLER] Doppelte Funktion '{name}': {seen[name]} und {module}")
                sys.exit(1)
            seen[name] = module
```
**Aufruf-Punkt:** Vor Schritt 3 (JS kombinieren) in `build()`.

**Bestehende DEBUG_MODE-Flip-Stelle** (Zeilen 418-423):
```python
if production:
    js_combined = js_combined.replace("DEBUG_MODE: true,", "DEBUG_MODE: false,", 1)
    js_combined = js_combined.replace("DEBUG_VALIDATE_ON_SAVE: true,", "DEBUG_VALIDATE_ON_SAVE: false,", 1)
```
**Assertion einbauen** (direkt danach):
```python
    # NEU: Post-Replace-Assertion
    if "DEBUG_MODE: true" in js_combined:
        print("[ABORTED] DEBUG_MODE ist noch true im Production-Build! core/config.js prüfen.")
        sys.exit(1)
    log.success("DEBUG_MODE deaktiviert und verifiziert.")
```

**Modullisten-Sync-Check-Pattern** (RESEARCH.md Zeilen 226-246):
```python
def check_module_list_sync(loader_path, build_modules):
    content = read_file(loader_path)
    match = re.search(r'const MODULES\s*=\s*\[(.*?)\];', content, re.DOTALL)
    if not match:
        log.warning("Konnte MODULES-Array nicht aus loader.js parsen — Sync-Prüfung übersprungen")
        return
    loader_modules = re.findall(r"'([^']+)'", match.group(1))
    build_set, loader_set = set(build_modules), set(loader_modules)
    only_in_build = build_set - loader_set
    only_in_loader = loader_set - build_set
    if only_in_build or only_in_loader:
        print(f"[FEHLER] Modullisten-Abweichung!")
        for m in sorted(only_in_build): print(f"  Nur in build.py: {m}")
        for m in sorted(only_in_loader): print(f"  Nur in loader.js: {m}")
        sys.exit(1)
```

---

### `tests/unit/stability.test.js` (test, —)
**Rolle:** Erweiterung um STAB-05/06/02-Tests (D-04)

**Analog:** `tests/unit/stability.test.js` (self — Erweiterung)

**Bestehende Test-Struktur** (Zeilen 10-38):
```javascript
describe('Data Persistence', () => {
    beforeEach(() => {
        localStorage.clear();
        global.D = {
            characters: [], npcs: [], locations: [], /* ... */
            mindmap: { nodes: [], connections: [] },
            initiative: { combatants: [], currentTurn: 0, round: 1 },
            _nextId: {}
        };
    });
    // ...
});
```

**Bestehender Test-Pattern für Save/Load** (Zeilen 41-49):
```javascript
test('should save D object to localStorage', () => {
    D.characters.push({ id: 1, name: 'Test Hero', level: 5 });
    save();
    const stored = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEY));
    expect(stored.characters).toHaveLength(1);
});
```

**Neuer >5MB-Test-Pattern (D-04):**
```javascript
describe('>5MB Roundtrip', () => {
    test('should fall back to IndexedDB when data exceeds 5MB', async () => {
        // 5MB+ Daten generieren
        const bigNotes = 'X'.repeat(6 * 1024 * 1024);
        D.characters.push({ id: 1, name: 'Held', notes: bigNotes });
        // Mock localStorage Quota-Error
        const originalSet = localStorage.setItem.bind(localStorage);
        jest.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
            throw new DOMException('QuotaExceededError');
        });
        await saveImmediate();
        // IDB-Mock prüfen
        expect(window._mockIDBLastWrite).toBeDefined();
        expect(window._mockIDBLastWrite.data).toContain('Held');
    });
});
```

**Neuer Migration-Test-Pattern (STAB-02):**
```javascript
describe('Mindmap Smart-Strip Migration', () => {
    test('should remove empty mindmap key on migration', () => {
        const data = { characters: [], mindmap: { nodes: [], connections: [] }, _version: '2.5.0' };
        const migrated = migrateData(data);
        expect(migrated.mindmap).toBeUndefined();
    });
    test('should preserve real mindmap content (no auto-strip)', () => {
        const data = { mindmap: { nodes: [{ id: 1, label: 'Test' }], connections: [] }, _version: '2.5.0' };
        const migrated = migrateData(data);
        expect(migrated.mindmap).toBeDefined();
        expect(migrated.mindmap.nodes).toHaveLength(1);
    });
});
```

---

### `tests/build/test_build_deduplication.py` (test, batch)
**Rolle:** Erweiterung um STAB-07-Tests (DEBUG_MODE-Assertion, Pre-Build-Check, Modullisten-Sync)

**Analog:** `tests/build/test_build_deduplication.py` (self)

**Bestehende Klassen-Struktur** (Zeilen 22-223):
```python
class TestBuildDeduplication:
    def test_deduplicate_removes_duplicate_window_assignments(self):
        js_code = """..."""
        result = deduplicate_window_assignments(js_code)
        assert app_config_count == 1
    # ...
```

**Neuer Test-Pattern für DEBUG_MODE-Assertion:**
```python
def test_production_build_has_debug_mode_false(self):
    """Build muss DEBUG_MODE=false im Production-Build sicherstellen."""
    dist_file = Path(__file__).parent.parent.parent / 'dist' / 'dnd-tracker-optimized.html'
    if not dist_file.exists():
        pytest.skip("Production build nicht gefunden")
    with open(dist_file, 'r', encoding='utf-8') as f:
        content = f.read()
    assert 'DEBUG_MODE: true' not in content, "DEBUG_MODE ist noch true im Production-Build!"
    assert 'DEBUG_MODE: false' in content
```

**Neuer Test-Pattern für Modullisten-Sync:**
```python
def test_module_lists_are_synchronized(self):
    """loader.js und build.py müssen identische Modullisten haben."""
    from build import check_module_list_sync, modules as build_modules
    loader_path = Path(__file__).parent.parent.parent / 'loader.js'
    # Soll keinen SystemExit auslösen
    try:
        check_module_list_sync(str(loader_path), build_modules)
    except SystemExit:
        pytest.fail("Modullisten-Abweichung zwischen loader.js und build.py")
```

---

### `tests/e2e/smoke.spec.js` (test, event-driven)
**Rolle:** Neu erstellen — Boot-Check + Tab-Sweep für CI (STAB-08)

**Analog:** `tests/e2e/app.spec.js` (role-match — gleicher Test-Framework, gleiche Selektoren)

**Boot-Test-Pattern** (aus `app.spec.js` Zeilen 10-33):
```javascript
// @ts-check
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
    await page.goto(filePath);
    await page.waitForSelector('.app-title', { timeout: 10000 });
});

test('App lädt erfolgreich', async ({ page }) => {
    await expect(page.locator('.app-title')).toContainText('D&D');
    await expect(page.locator('.nav-tabs')).toBeVisible();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
});
```

**Tab-Sweep-Pattern** (aus `app.spec.js` Zeilen 35-53):
```javascript
test('Alle Tabs sind anklickbar', async ({ page }) => {
    const tabs = [
        { view: 'dashboard' }, { view: 'party' }, { view: 'npcs' },
        { view: 'locations' }, { view: 'quests' }, { view: 'encounter' },
    ];
    for (const tab of tabs) {
        const tabButton = page.locator(`.nav-tab[data-view="${tab.view}"]`);
        await tabButton.click();
        await page.waitForTimeout(300);
        await expect(tabButton).toHaveClass(/active/);
    }
});
```

**Fehler-Filter-Pattern** (aus `app.spec.js` Zeile 32):
```javascript
// favicon-Fehler ignorieren (bekanntes Phantom-Problem):
errors.filter(e => !e.includes('favicon'))
```

**CI HTTP-Server-Pattern** (aus RESEARCH.md Zeilen 271-295):
```javascript
// Umgebungsvariable für CI:
const BASE_URL = process.env.SMOKE_BASE_URL ||
    `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
```

---

### `.github/workflows/ci.yml` (config, batch)
**Rolle:** Neuer `smoke-test`-Job — benötigt `build`-Artefakt (STAB-08)

**Analog:** `.github/workflows/ci.yml` (self — Erweiterung)

**Bestehende Job-Struktur** (Zeilen 9-52):
```yaml
jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint

  build:
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test]
    steps:
      # ...
      - uses: actions/upload-artifact@v4
        with:
          name: production-build
          path: dist/dnd-tracker-optimized.html
          retention-days: 7
```

**Neuer smoke-test-Job-Pattern** (nach `build`-Job anfügen):
```yaml
  smoke-test:
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - uses: actions/setup-python@v5
        with:
          python-version: '3.x'
      - run: npm ci
      - run: npx playwright install chromium
      - uses: actions/download-artifact@v4
        with:
          name: production-build
          path: dist/
      - name: Starte HTTP-Server
        run: python -m http.server 8000 --directory dist &
        shell: bash
      - name: Warte auf Server
        run: sleep 2
      - name: Smoke-Test
        run: npx playwright test tests/e2e/smoke.spec.js
        env:
          SMOKE_BASE_URL: http://localhost:8000/dnd-tracker-optimized.html
```

---

## Geteilte Patterns (cross-cutting)

### Toast / Event-Log
**Quelle:** `utils/utilities.js` Zeilen 258-337
**Anwenden auf:** Alle neuen Hinweise in persistence.js, import-export.js
```javascript
// Signatur:
function showToast(msg = '✓ Gespeichert', type = 'success', duration = 2000)
// Typen: 'success' | 'error' | 'warning' | 'info'
// Schreibt automatisch ins Event-Log (Zeile 259: const log = $('event-log'))
```

### Modal-Dialog (showModal / hideModal)
**Quelle:** `systems/spellslots/navigation.js` Zeilen 58-80
**Anwenden auf:** D-07 Konflikt-Dialog, D-09 Mindmap-Dialog
```javascript
function showModal(id) {
    const modal = $(id);
    if (modal) modal.classList.add('show');
    // Optional: populateSelects() und tab-spezifische Populates
}
function hideModal(id) {
    const modal = $(id);
    if (modal) modal.classList.remove('show');
}
```

### XSS-Schutz im Dialog
**Quelle:** `systems/spellslots/import-export.js` Zeile 312
**Anwenden auf:** D-07-Konflikt-Dialog (Kampagnennamen), D-09-Mindmap-Dialog
```javascript
infoEl.innerHTML = `<div><strong>Kampagne:</strong> ${esc(campaignName)}</div>`;
// NIEMALS ohne esc() bei Nutzer-Strings in innerHTML
```

### Session-Flag-Pattern (Einmal-pro-Sitzung)
**Quelle:** Implizit aus bestehendem Code — window-Flag als Session-Marker
**Anwenden auf:** D-02, D-08
```javascript
if (!window._idbModeSeen) {
    window._idbModeSeen = true;
    showToast(/* ... */);
}
// Analog: window._sizeWarningSeen für D-08
```

### JSON-Download-Pattern
**Quelle:** `systems/spellslots/import-export.js` Zeilen 182-189 (`exportData()`)
**Anwenden auf:** D-10 Mindmap-Backup-Export
```javascript
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `${filename}.json`;
a.click();
URL.revokeObjectURL(url);
```

### Playwright-Fehler-Filter
**Quelle:** `tests/e2e/app.spec.js` Zeile 32
**Anwenden auf:** `tests/e2e/smoke.spec.js`
```javascript
const errors = [];
page.on('pageerror', err => errors.push(err.message));
// ...
expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
```

### Python-Build-Funktion-Pattern
**Quelle:** `build.py` Zeilen 176-228 (`remove_duplicate_functions`)
**Anwenden auf:** Neue `check_duplicate_functions()` und `check_module_list_sync()`
```python
def check_duplicate_functions(source_dir, modules):
    """Konvention: Gibt None zurück oder ruft sys.exit(1) bei Fehler."""
    # Pattern: regex auf re.MULTILINE, seen-Dict, sys.exit(1) bei Duplikat
```

---

## Kein Analog gefunden

| Datei | Rolle | Datenfluss | Grund |
|-------|-------|-----------|-------|
| `docs/srd-license.md` | config | — | Keine vergleichbare Lizenz-Dokumentationsdatei im Repo; Inhalt basiert auf D-16-Entscheidung (manuelle Recherche) |

Für `docs/srd-license.md`: Planer soll die Struktur aus RESEARCH.md D-16 und Standard-Attribution-Konventionen (CC-BY-4.0 SRD 5.1) ableiten. Kein Code-Pattern erforderlich.

---

## Metadaten

**Suchbereich:** `systems/spellslots/`, `tools/`, `build.py`, `tests/`, `.github/`, `utils/utilities.js`, `ui/actions/system-actions.js`
**Dateien gescannt:** 12 Quelldateien vollständig gelesen
**Extraktionsdatum:** 2026-06-12

**Wichtige Constraints (aus CLAUDE.md):**
- Kein `const X = window.X` innerhalb von Funktionen — nur `var X = window.X` auf Top-Level oder direkter `window.X()`-Aufruf
- `saveUndoState()` muss VOR jeder destruktiven Operation aufgerufen werden (hier nicht relevant, da STAB-Tasks keine CRUD-Löschungen enthalten)
- Neue Module müssen synchron in `loader.js` UND `build.py` eingetragen werden (aber: diese Phase erstellt keine neuen Module, nur Erweiterungen bestehender)
- `esc()` für alle Nutzer-Strings in `innerHTML`
- Deutsche UI-Texte für alle neuen Dialoge und Hinweise
