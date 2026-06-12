---
phase: 01-stabilisierung
reviewed: 2026-06-12T07:57:42Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - .github/workflows/ci.yml
  - CLAUDE.md
  - LICENSE
  - README.md
  - build.py
  - core/config.js
  - docs/bugfixes.md
  - docs/srd-license.md
  - package.json
  - playwright.smoke.config.js
  - systems/campaign-manager/campaign-manager.js
  - systems/spellslots/import-export.js
  - systems/spellslots/persistence.js
  - systems/spellslots/quick-roll.js
  - systems/spellslots/version-migration.js
  - tests/build/test_build_deduplication.py
  - tests/e2e/smoke.spec.js
  - tests/setup.js
  - tests/unit/migration.test.js
  - tests/unit/stability.test.js
  - tools/debug.js
  - types/entities.d.ts
  - types/globals.d.ts
  - validate.py
findings:
  critical: 1
  warning: 8
  info: 6
  total: 15
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-06-12T07:57:42Z
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

Review der Phase „Stabilisierung" (Boot-Crash-Fix, Persistenz-Härtung D-01–D-08, Mindmap-Entfernung + Migration 2.6.1, Build-Härtung STAB-07, Repo-Hygiene, CI-Smoke-Test, Lizenz-Audit). Positiv: Die Persistenz-Härtung in `persistence.js` (IDB-only-Pfad mit korrekter Write-then-Remove-Reihenfolge, Begleit-Timestamp, lauter Fehler-Toast mit Auto-Export) ist sauber umgesetzt; `migration.test.js` testet mit dem vm-Ansatz erstmals echten Quellcode; der DEBUG_MODE-Flip-Guard in build.py funktioniert inkl. Abbruch-Verifikation; die SRD-Attribution ist konsistent über LICENSE/README/docs; der CI-Smoke-Test gegen das Production-Bundle schließt eine echte Lücke.

Es gibt jedoch einen kritischen Befund: Der neue D-07-Konflikt-Dialog in `quick-roll.js` ruft sich selbst endlos rekursiv auf — bei jedem echten Speicher-Konflikt wird die Rekursions-Exception vom Lade-Pfad verschluckt und die veralteten localStorage-Daten gewinnen still. Damit ist genau das Stale-Shadow-Datenverlust-Szenario, das die Phase beheben sollte, weiterhin offen. Dass dies unentdeckt blieb, liegt an einem zweiten strukturellen Problem: Die neuen Persistenz-„Regressionstests" in `stability.test.js` testen ausschließlich ihre eigenen Inline-Simulationen, nie den Produktionscode.

## Critical Issues

### CR-01: Endlosrekursion in `showStorageConflictDialog` — D-07-Konfliktpfad funktionslos, stille Bevorzugung veralteter Daten

**File:** `systems/spellslots/quick-roll.js:25-39` (Aufruf: `quick-roll.js:57-62`)
**Issue:** `showStorageConflictDialog` ist eine Top-Level-Funktionsdeklaration in einem klassischen Script (Loader- wie Bundle-Modus). Damit ist `window.showStorageConflictDialog` **die Funktion selbst** — es existiert keine andere Definition im Repo (per Grep verifiziert; die im Plan 01-02 vorgesehene UI-Dialog-Funktion wurde nie implementiert). Der Guard in Zeile 32 ist daher immer wahr, und Zeile 33 ruft die Funktion mit identischen Argumenten erneut auf:

```javascript
if (typeof window.showStorageConflictDialog === 'function') {       // immer true (Selbstreferenz!)
    window.showStorageConflictDialog(lsData, idbData, onUseLS, onUseIDB);  // Endlosrekursion
}
```

Bei jedem echten Konflikt (`lsData !== idbData`) entsteht ein `RangeError: Maximum call stack size exceeded`. Dieser wird in `load()` vom inneren `catch` (Zeile 66-71) als „IDB-Konfliktprüfung fehlgeschlagen" verschluckt → die **alten** LS-Daten werden geladen, die neueren IDB-Daten still verworfen; der „IDB bevorzugen"-Fallback (Zeile 36) läuft nie. Das Szenario ist nicht hypothetisch: `persistence.js` erzeugt den Stale-Shadow-Zustand absichtlich im LS-Quota-Fallback (Zeile 76 bzw. 208: nur `_ts` wird entfernt, `key` bleibt stehen) — genau dann ist der Dialog die einzige Schutzschicht. Kein Unit-Test ruft die echte Funktion auf (siehe WR-06), daher blieb der Fehler unbemerkt.
**Fix:** Selbst-Delegation entfernen (es gibt keinen externen UI-Dialog) oder die interne Funktion umbenennen und nur an einen **anders** benannten UI-Hook delegieren:

```javascript
// (D-07) Konflikt auflösen; UI-Dialog existiert (noch) nicht — IDB als neuere Quelle bevorzugen
function resolveStorageConflict(lsData, idbData, onUseLS, onUseIDB) {
    if (lsData === idbData) {
        if (typeof onUseLS === 'function') onUseLS();
        return;
    }
    if (typeof window.showStorageConflictDialogUI === 'function') {
        window.showStorageConflictDialogUI(lsData, idbData, onUseLS, onUseIDB); // optionaler echter Dialog
    } else {
        if (typeof onUseIDB === 'function') onUseIDB(); // Fallback: IDB bevorzugen
    }
}
// Aufruf in load() (Zeile 57) entsprechend auf resolveStorageConflict(...) umstellen.
```

Zusatzhinweis für eine spätere echte Dialog-Implementierung: `load()` wartet nicht auf den Dialog (kein `await`); ein asynchroner Nutzer-Dialog würde mit dem weiterlaufenden Load-Pfad um `s` racen. Der synchrone Fallback ist davon nicht betroffen.

## Warnings

### WR-01: `window.STORAGE_KEY` existiert nicht — Loader-Modus persistiert unter dem Key `"undefined"`

**File:** `systems/spellslots/persistence.js:15,159`; `systems/spellslots/quick-roll.js:41`; `systems/spellslots/import-export.js:621`
**Issue:** Diese Funktionen lesen `const STORAGE_KEY = window.STORAGE_KEY;`. Die einzige Definition ist aber `const STORAGE_KEY = window.APP_CONFIG.STORAGE_KEY;` in `core/data.js:1` — eine globale `const` erzeugt **keine** window-Property, und `window.STORAGE_KEY = ...` kommt im gesamten Repo nicht vor (verifiziert). Konsequenzen:
- **Bundle (dist):** funktioniert nur zufällig, weil Dedup-Pass 2 die Zeilen als „Konflikt mit realer Definition" entfernt (418 Entfernungen im aktuellen Bundle) und der Bezeichner auf die globale `const` zurückfällt.
- **Loader-Modus (index.html, von validate.py weiterhin als unterstützter Pfad geprüft):** Die Zeilen bleiben bestehen → `STORAGE_KEY === undefined` → `const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY` ist für die Standard-Kampagne `undefined` → sämtliche Persistenz (Save/Load/`_ts`/clearStorage) läuft auf den localStorage-Key `"undefined"` bzw. `"undefined_ts"`. Dev- und Bundle-Modus lesen/schreiben unterschiedliche Keys.

Das Muster ist vorbestehend, kollidiert aber direkt mit dem in dieser Phase eingeführten `_ts`-Mechanismus und verstößt gegen die CLAUDE.md-NEVER-Regel („kein `const X = window.X` in Funktionen"). Gleiche Stellen außerhalb des Review-Scopes: `systems/avatars.js:190`, `systems/undo.js:197`.
**Fix:** Die funktionslokalen Import-Zeilen ersatzlos streichen — die globale `const STORAGE_KEY` ist im gesamten Script-Scope sichtbar (so macht es `tools/debug.js:737` bereits korrekt):

```javascript
// statt:
const STORAGE_KEY = window.STORAGE_KEY;
const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
// einfach:
const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY; // globale const aus core/data.js
```

### WR-02: build.py Pass 3 lässt Funktionskörper verwaist und matcht verschachtelte Funktionen, die der neue Pre-Build-Check nicht abdeckt

**File:** `build.py:332-384` (Pass 3) vs. `build.py:149-167` (Pre-Build-Check)
**Issue:** Zwei Lücken in der Build-Härtung (STAB-07):
1. Bei einem Duplikat ersetzt Pass 3 nur die Deklarationszeile durch einen Kommentar; die innere Schleife (Zeile 361-373) berechnet zwar das Funktionsende, **überspringt aber keine Zeilen** — der Funktionskörper bleibt als Top-Level-Code stehen. Das ist exakt der in CLAUDE.md dokumentierte „Illegal return statement"-Incident vom 2026-01-10, dessen Mechanismus im Code unverändert ist. Ohne Pass 3 wären doppelte Funktionsdeklarationen sogar valides JS (letzte gewinnt) — Pass 3 macht aus funktionierendem Code einen SyntaxError.
2. Pass 3 matcht auf `stripped` (Zeile 345/351), erkennt also auch **eingerückte/verschachtelte** Funktionen. Der neue Pre-Build-Check `check_duplicate_functions` prüft mit `^function` + MULTILINE nur **Top-Level**-Funktionen. Zwei Module mit gleichnamigen inneren Hilfsfunktionen (z. B. `function update()` in zwei verschiedenen äußeren Funktionen) passieren den Pre-Check und werden von Pass 3 zerstört.

Aktuell feuert Pass 3 im Bundle 0-mal (verifiziert) — der Befund ist latent, untergräbt aber das STAB-07-Ziel „Build-Breaker unmöglich machen".
**Fix:** (a) Körperzeilen anhand der bereits berechneten End-Zeile tatsächlich überspringen (z. B. `skip_until = end_line` setzen und Zeilen bis dahin als Kommentar ausgeben), und (b) Pass 3 auf unindentierte Deklarationen beschränken (`re.match(function_pattern, line)` statt `stripped`), damit Pre-Check und Pass 3 denselben Geltungsbereich haben.

### WR-03: `check_module_list_sync` vergleicht nur Mengen — Reihenfolge-Abweichungen und Doppeleinträge bleiben unerkannt

**File:** `build.py:170-191`
**Issue:** Der neue Sync-Guard nutzt `set(build_modules)` vs. `set(loader_modules)`. Damit werden (a) unterschiedliche **Ladereihenfolgen** und (b) **Doppeleinträge** in einer der Listen nicht erkannt — obwohl die Ladereihenfolge laut CLAUDE.md („Build Order Matters") die kritischste Fehlerquelle ist und ein Doppeleintrag in loader.js zu doppelten Deklarationen zur Laufzeit führt. Aktuell sind beide Listen identisch inkl. Reihenfolge (92/92, verifiziert), der Guard schützt aber nicht vor dem relevantesten Drift-Fall.
**Fix:**

```python
if loader_modules != build_modules:  # Listenvergleich statt Set
    # bestehende Set-Diagnose beibehalten, zusätzlich:
    for i, (a, b) in enumerate(zip(build_modules, loader_modules)):
        if a != b:
            print(f"[FEHLER] Reihenfolge-Abweichung ab Index {i}: build.py='{a}' vs loader.js='{b}'")
            break
    sys.exit(1)
if len(loader_modules) != len(set(loader_modules)):
    print("[FEHLER] Doppeleintrag in loader.js MODULES")
    sys.exit(1)
```

### WR-04: `completeReset()` seedet weiterhin den entfernten `mindmap`-Key

**File:** `tools/debug.js:820`
**Issue:** Die Phase hat in genau dieser Datei alle Mindmap-Funktionen entfernt (clearMindmap, generateTestMindmap, testNetworkSystem, testNodeTypes), aber das Reset-Template seedet weiterhin `mindmap: { nodes: [], connections: [] }` — im Widerspruch zu STAB-02 (Mindmap-Entfernung) und zur 2.6.1-Smart-Strip-Migration, die solche leeren Seeds gerade beseitigt. Verwandter Fund außerhalb des Review-Scopes: `systems/backups.js:225` seedet ebenfalls `mindmap` (dort sogar mit `edges` statt `connections` — ein zweites Schema-Artefakt).
**Fix:** In Zeile 820 die mindmap-Property streichen: `filters: [],` — und `systems/backups.js:225` im Zuge dessen mitbereinigen.

### WR-05: Migrations-Reihenfolge lexikografisch sortiert — bricht ab Version `2.10.0`

**File:** `systems/spellslots/version-migration.js:71`
**Issue:** `const versions = Object.keys(MIGRATIONS).sort();` sortiert Strings: sobald eine Migration `'2.10.0'` existiert, gilt `'2.10.0' < '2.3.0'` und die Reihenfolge ist falsch. Das ist exakt die Bug-Klasse des in dieser Phase gefixten `2.11`-Stempels (D-05: numerischer vs. lexikografischer Versionsvergleich) — die vorhandene `compareVersions`-Funktion steht direkt darunter und wird hier nicht genutzt. Ergänzend: `migrateData` stempelt am Ende immer `CURRENT_VERSION` (Zeile 85), auch wenn ein Migrationsschritt geworfen hat (Zeile 80-83) — eine fehlgeschlagene Migration wird damit nie wiederholt (Daten bleiben dauerhaft unmigriert, aber als aktuell markiert).
**Fix:**

```javascript
const versions = Object.keys(MIGRATIONS).sort(compareVersions);
```

Für den Fehlerfall mindestens den Versionsstempel nicht setzen (oder einen `_migrationFailed`-Marker ablegen), damit der nächste Load erneut migrieren kann.

### WR-06: Persistenz-„Regressionstests" testen nur ihre eigene Inline-Simulation — eine Assertion verankert sogar den Bug-Zustand

**File:** `tests/unit/stability.test.js:638-899` (besonders 643-681)
**Issue:** Kein Test in der Gruppe „Persistence Regression Tests (Plan 01-02)" ruft die echten Funktionen aus `persistence.js`/`quick-roll.js` auf — setup.js mockt save/saveImmediate/load, und die Tests re-implementieren die „erwartete Logik" inline und assertieren gegen ihre eigene Simulation. Konkret problematisch: Der Test „Nach IDB-Save bei >5MB muss LS-Schatten-Key entfernt werden" assertiert in Zeile 680 `expect(localStorage.getItem(STORAGE_KEY + '_ts')).toBe('999')` — also das **Bestehen** des Bugs — und bleibt grün, obwohl `persistence.js` den Fix längst enthält (der Kommentar „SCHLÄGT FEHL nach dem Fix" trifft nicht zu, weil die Simulation den Fix-Code auskommentiert lässt). Eine Regression in den D-01/STAB-05/D-07-Pfaden würde von keinem dieser Tests erkannt; der Rekursionsfehler CR-01 blieb genau deshalb unentdeckt. (Test-Datei-Befund gemäß Ausnahme: betrifft die Verlässlichkeit der Test-Suite.)
**Fix:** Den vm-Ansatz aus `migration.test.js` (Quelldatei via `vm.runInContext` mit window-Mocks laden) auf `persistence.js` und `quick-roll.js` übertragen und die echten `saveImmediate`/`save`/`load`/`showStorageConflictDialog` aufrufen; die invertierte Assertion in Zeile 680 entfernen bzw. auf `toBeNull()` gegen die echte Implementierung umstellen.

### WR-07: validate.py schlägt dauerhaft fehl — Erwartungen passen nicht mehr zur Codebasis

**File:** `validate.py:161-168` (check_module_count), `validate.py:45-76` (check_body_html)
**Issue:** Lokal verifiziert: `python validate.py` endet mit 2/7 fehlgeschlagenen Checks (Exit 1). `check_module_count` erwartet hartkodiert 4/3/8/2/3/4 Module pro Ordner — real sind es 44 Module in völlig anderer Verteilung (z. B. features/: 10 statt 3, systems/: 11 statt 8). `check_body_html` schlägt fehl, weil `assets/body.html` laut CLAUDE.md nur noch eine Hinweis-Datei ist (Templates liegen in `assets/templates/`). Die Phase hat nur den SOURCE_DIR-Pfad repariert (gut), dadurch läuft das Tool jetzt — liefert aber permanente False Alarms. Ein dauerhaft rotes `npm run validate` ist als Hygiene-Gate unbrauchbar und maskiert echte Fehler.
**Fix:** Erwartungswerte aktualisieren (oder dynamisch aus build.py MODULES ableiten: `from build import MODULES` und pro Ordner zählen) und den body.html-Check an die Template-Architektur anpassen oder entfernen.

### WR-08: Mindmap-Hinweis-Dialog nutzt nicht existierende Overlay-Klassen — erscheint als Box am Seitenende statt als Modal

**File:** `systems/spellslots/import-export.js:419-420`
**Issue:** `overlay.className = 'modal show';` — das App-CSS kennt als Overlay nur `.modal-overlay` / `.modal-overlay.show` (dashboard.css:551-571, `display:none` → `display:flex`); `.modal` ist die Klasse der **inneren** Dialog-Box. Der neue Dialog erhält daher keinerlei Overlay-Positionierung: Er wird als Box im Dokumentfluss ans Ende von `<body>` gehängt (je nach Scrollposition außerhalb des Viewports), ohne Backdrop, die Seite bleibt voll bedienbar. Da `importDataGlobal()` per `await` auf den „Fortfahren"-Klick wartet (resolve nur in Zeile 451), wirkt der Import für den Nutzer wie eingefroren, wenn er die Box nicht bemerkt — es gibt keinen anderen Auflösungsweg (kein Escape, kein Backdrop-Klick).
**Fix:**

```javascript
overlay.className = 'modal-overlay show';
overlay.innerHTML =
    '<div class="modal" style="max-width:480px">' +  // statt "modal-content"
    ...
```

Optional: Backdrop-Klick/Escape als „Fortfahren" behandeln, damit der await nie unauflösbar wird.

## Info

### IN-01: `console.log` im Produktions-Migrationspfad und verbleibende `console.warn/error` in reviewten Dateien

**File:** `systems/spellslots/version-migration.js:75`; weitere: `systems/spellslots/import-export.js:194,240,327,359,589,594,618,630`, `systems/spellslots/quick-roll.js:203`, `systems/campaign-manager/campaign-manager.js:87,93,122`, `tools/debug.js:804,809,833`
**Issue:** `console.log('[MIGRATION] Migriere von ...')` läuft bei jeder Migration in Produktion; build.py entfernt console-Aufrufe nicht (minify_js löscht nur Leerzeilen). Verstößt gegen die CLAUDE.md-Konvention „Zero console.log in production builds / ErrorHandler.log + DEBUG_MODE". Die Phase hat dies in `persistence.js`/`quick-roll.js:load()` vorbildlich bereinigt — die übrigen Stellen blieben stehen.
**Fix:** `if (window.APP_CONFIG?.DEBUG_MODE) { ErrorHandler.log('migrateData', null, \`Migriere von ${dataVersion} auf ${version}\`); }` — analog für die error/warn-Stellen.

### IN-02: Ungenutzter window-Export `showStorageConflictDialogInternal`

**File:** `systems/spellslots/quick-roll.js:39`
**Issue:** `window.showStorageConflictDialogInternal` wird nirgends im Repo referenziert (verifiziert) — Verstoß gegen die CLAUDE.md-Export-Audit-Regel („nur exportieren, was andere Module/HTML nutzen"). Entfällt ohnehin mit dem CR-01-Fix.
**Fix:** Export-Zeile entfernen.

### IN-03: Toter `</script>`-Check in der Post-Build-Validierung; DEBUG_VALIDATE_ON_SAVE-Flip unverifiziert

**File:** `build.py:551-562` und `build.py:478-484`
**Issue:** Die Validierung extrahiert das JS mit `re.search(r'<script>(.*?)</script>', ...)` (non-greedy) — `group(1)` endet am **ersten** `</script>` und kann den Tag daher nie enthalten; der „KRITISCH: '</script>' im JavaScript"-Check kann nie anschlagen, ein echtes `</script>` im JS würde die Validierung stattdessen mit verkürztem `js_in_html` durchlaufen. Außerdem verifiziert der Production-Abbruch-Guard nur `DEBUG_MODE: true`, nicht den zweiten Flip `DEBUG_VALIDATE_ON_SAVE`.
**Fix:** Für den Tag-Check das letzte `</script>`-Vorkommen relativ zum erwarteten Script-Ende vergleichen (z. B. `html_template.count('</script>')` gegen die Soll-Anzahl) und die Verifikation um `DEBUG_VALIDATE_ON_SAVE: true` ergänzen.

### IN-04: npm-Scripts von `python3` auf `python` umgestellt — Portabilitätsverlust auf Linux/macOS

**File:** `package.json:8-14`
**Issue:** Auf Debian/Ubuntu/macOS ohne `python-is-python3` existiert kein `python`-Binary → `npm run build`/`dev`/`validate` brechen dort. CI ist unberührt (setup-python stellt `python` bereit, Workflow ruft es direkt auf). Für das Windows-Setup des Projekts korrekt — als bewusste Entscheidung sollte es im README vermerkt sein.
**Fix:** Entweder dokumentieren oder plattformneutral lösen (z. B. `node -e`-Wrapper bzw. README-Hinweis „Linux/macOS: python-is-python3 oder Alias erforderlich"). Positiv: `license` ISC→MIT ist nun konsistent mit LICENSE.

### IN-05: Typdefinitionen inkonsistent zur Realität

**File:** `types/globals.d.ts:427`; `types/entities.d.ts:3`
**Issue:** `getCampaignIndex(): Record<string, { name: string; lastModified: string }>` entspricht nicht der realen Struktur `{ campaigns: Array<{key, name, created}>, active: string }` (campaign-manager.js:11-13) — irreführend für künftige TS-Prüfungen. Zudem deklariert entities.d.ts `@version 2.7.0`, die App ist 2.6.1.
**Fix:** Rückgabetyp korrigieren: `function getCampaignIndex(): { campaigns: Array<{ key: string; name: string; created: string }>; active: string };` und Versionskommentar angleichen.

### IN-06: BASE_URL doppelt definiert — Playwright-`baseURL` wird ignoriert

**File:** `tests/e2e/smoke.spec.js:4-5` und `playwright.smoke.config.js:6-7`
**Issue:** Spec und Config berechnen BASE_URL identisch, aber unabhängig; `page.goto(BASE_URL)` mit absoluter URL ignoriert das `use.baseURL` der Config. Bei Änderung nur einer Stelle driften CI- und Lokal-Verhalten auseinander.
**Fix:** In der Spec `await page.goto('/')` bzw. die baseURL aus der Config verwenden und die lokale Duplikation entfernen.

---

_Reviewed: 2026-06-12T07:57:42Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
