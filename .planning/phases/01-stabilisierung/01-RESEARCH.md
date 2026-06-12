# Phase 1: Stabilisierung — Research

**Recherchiert:** 2026-06-12
**Domäne:** Vanilla-JS-App-Stabilisierung (Persistenz, Build-System, CI/CD, Doku-Audit)
**Konfidenz:** HIGH (alle Befunde direkt aus Quellcode verifiziert — keine externe API-Recherche erforderlich)

---

<user_constraints>
## User Constraints (aus CONTEXT.md)

### Locked Decisions (D-01 bis D-17)

**Persistenz-Fix >5MB (STAB-05, STAB-06):**
- **D-01:** Stale-Shadow-Bug wird per **Timestamp-Vergleich beim Laden** behoben: Beide Speicher tragen Zeitstempel, beim Laden gewinnt der neueste Stand. Begleit-Zeitstempel für LS-Seite nötig (IDB hat bereits `timestamp`).
- **D-02:** Wechsel in IDB-only-Modus: **einmaliger Event-Log-Hinweis** pro Sitzung. Per-Save-Toast konsolidiert.
- **D-03:** IDB-Schreibfehler: **deutlicher Fehler-Toast + Export-Aufforderung**.
- **D-04:** **Jest-Unit-Test** als Regressionstest: Save/Load-Roundtrip mit >5MB-Daten (gemockter Storage). Kein E2E-Test.
- **D-05:** Export-Stempel nutzt `APP_CONFIG.VERSION` statt `'2.11'`. Altdateien mit `'2.11'` als Legacy-Stempel erkannt.
- **D-06:** App-Version **2.6.1** (Patch-Bump): `APP_CONFIG.VERSION` und `package.json` synchron.
- **D-07:** Erstlade-Konflikt (LS ohne Timestamp + abweichender IDB-Stand mit Timestamp): **einmaliger Auswahl-Dialog** mit beiden Ständen. Bei identischen Inhalten kein Dialog. Danach beidseitig Timestamps — kein Wiederholen.
- **D-08:** 4-MB-Warnung: **einmal pro Sitzung** als Toast, danach nur noch Event-Log-Eintrag.

**Mindmap-Altdaten (STAB-02):**
- **D-09:** `D.mindmap` in Speicherständen: **Smart-Strip** per Migration. Leere mindmap-Keys stil entfernt, echte Inhalte → Hinweis-Dialog + Export-Angebot.
- **D-10:** Export-Format beim Smart-Strip: **eigene JSON-Datei** (`mindmap-backup-{kampagne}.json`).
- **D-11:** `tools/debug.js`: **nur reparieren** (tote Mindmap-Referenz `clearAllNodes = clearMindmap` Zeile 99). Bleibt in beiden Bundles.
- **D-12:** Veraltete Tools **löschen**: `analyze-render.py`, `migrate-event-handlers.py`, `split-shops.py`, `purge-css.py`. `validate.py` **reparieren** (script-relative Pfade).
- **D-13:** `assets/styles-purged.css` **löschen**.

**Doku- & Lizenz-Audit (STAB-10, STAB-11):**
- **D-14:** CLAUDE.md: **Faktenkorrektur** — falsche Aussagen korrigieren (Inline-Handler-Zahl, tote Dateiverweise, Campaign-Index-Key, Mindmap-Abschnitte, Roadmap, Version 2.6.1).
- **D-15:** execCommand-Konvention: **an Realität anpassen** — Ist-Zustand dokumentieren, Ablösung als Tech-Debt. Kein Code-Umbau.
- **D-16:** SRD-Zaubertexte: **Dokumentieren + Attribution** — Befund in docs/, fehlende Attribution ergänzen. Kein stilles Löschen.
- **D-17:** Lizenz `package.json`: ISC → **MIT**.

### Claude's Discretion

- **CI-Smoke-Test-Umfang (STAB-08):** Boot-Check vs. Tab-Sweep; ob CI den dist-Build selbst baut; `file://` vs. HTTP-Server.
- **build.py-Härtung (STAB-07):** Pass-3-Fix vs. Pre-Build-Check; Modullisten-Sync-Check; DEBUG_MODE-Abbruch.
- Tote Dateien (main.js, tsconfig.json.backup, MIGRATION_REPORT.md) und `python3`→`python` in npm-Scripts (STAB-09).
- Implementierungsdetails: LS-Timestamp-Mechanik (Begleit-Key vs. Wrapper), Dialog-Gestaltung, exakte Toast-Texte.

### Deferred Ideas (AUSSERHALB SCOPE)

- execCommand-Ablösung im Rich-Text-Editor (21+ Call-Sites) — eigene Phase
- CLAUDE.md-Verschlankung (historische Kapitel nach docs/ auslagern) — nicht in dieser Phase
- debug.js aus Production-Build nehmen — nicht in dieser Phase
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Beschreibung | Research-Unterstützung |
|----|-------------|------------------------|
| STAB-01 | App startet fehlerfrei per `file://`-Doppelklick — `clearMindmap`-Boot-Crash behoben | D-11: debug.js:99 reparieren; clearMindmap-Referenz entfernen |
| STAB-02 | Alle Mindmap-Feature-Reste bereinigt | D-09 bis D-13: Smart-Strip-Migration, Dateilöschungen, type-Deklarationen |
| STAB-03 | dev- und prod-Builds frisch aus aktuellem Quellcode; Browser-Konsole fehlerfrei | build.py-Härtung (STAB-07) als Voraussetzung |
| STAB-04 | `npm run check` grün (ESLint, TypeScript, Prettier) | Bestehende Lint-Konfiguration nutzbar; keine strukturellen Änderungen nötig |
| STAB-05 | Kampagnen >5MB verlieren keine Daten (Stale-Shadow-Bug behoben) | D-01, D-07: Timestamp-Mechanik; load()-Pfad in quick-roll.js:31-45 |
| STAB-06 | Exporte tragen `APP_CONFIG.VERSION` statt `'2.11'`; Re-Import führt Migrationen korrekt aus | D-05, D-06: quick-roll.js:133; compareVersions-Logik |
| STAB-07 | build.py gehärtet: Pass-3-Fix, DEBUG_MODE-Assertion, Modullisten-Sync-Check | Pre-Build-Check-Ansatz empfohlen (siehe unten) |
| STAB-08 | CI erkennt Boot-Crashes: Playwright-Smoke-Test lädt dist-Build | `file://`-Ansatz via lokalem HTTP-Server im CI (empfohlen, siehe unten) |
| STAB-09 | Tote Dateien entfernt/repariert; `python3`→`python` in npm-Scripts | Befund-Liste in CONCERNS.md; `py -3` oder `python` als Windows-kompatibler Ersatz |
| STAB-10 | Doku aktuell; Lizenz einheitlich MIT | D-14 bis D-17; package.json:46 (ISC→MIT) |
| STAB-11 | SRD-Zaubertexte geprüft und dokumentiert | D-16: Lizenz-Audit, Attribution in README/LICENSE |
</phase_requirements>

---

## Zusammenfassung

Phase 1 ist eine reine Stabilisierungsphase ohne neue Features. Alle Befunde liegen bereits vollständig dokumentiert in `.planning/codebase/CONCERNS.md` vor — die Implementierungsarbeit ist klar umrissen. Das zentrale Risiko ist der Stale-Shadow-Bug (D-01/D-07), der einen sorgfältig gestalteten Timestamp-Begleit-Key und einen einmaligen Konflikt-Dialog erfordert.

Der Boot-Crash (STAB-01) ist die einfachste Aufgabe: eine einzelne Zeile in `tools/debug.js:99` (`const clearAllNodes = clearMindmap;`) entfernen. Die Mindmap-Bereinigung (STAB-02) erfordert eine Datenmigration mit Smart-Strip-Logik für den Import-Pfad.

Für den CI-Smoke-Test (STAB-08, Claude's Discretion) empfiehlt die Research einen lokalen Python-HTTP-Server im CI statt direktem `file://`-Zugriff, da Playwright unter `file://` localStorage-Beschränkungen und Service-Worker-Inkompatibilitäten hat — aber die App selbst per Doppelklick via `file://` weiterhin funktioniert (unterschiedliche Kontexte: CI-Test vs. Nutzer-Nutzung).

**Primäre Empfehlung:** Build.py-Pass-3-Fix priorisieren (verhindert Runtime-SyntaxErrors); Timestamp-Mechanik als Begleit-Key implementieren (geringeres Migrationsrisiko als Wrapper-Format); CI-Smoke-Test gegen HTTP-Server laufen lassen.

---

## Architectural Responsibility Map

| Capability | Primäre Schicht | Sekundäre Schicht | Begründung |
|------------|----------------|-------------------|------------|
| Persistenz-Timestamp | `systems/spellslots/persistence.js` | `systems/spellslots/quick-roll.js` (load) | Save schreibt, Load vergleicht |
| Conflict-Dialog (D-07) | `systems/spellslots/quick-roll.js` | `utils/utilities.js` (showToast) | Ladezeit-Dialog im load()-Pfad |
| Smart-Strip-Migration (D-09) | `systems/spellslots/version-migration.js` | `systems/spellslots/import-export.js` | Migrations-System ist der Andockpunkt |
| Export-Stempel-Fix (D-05) | `systems/spellslots/quick-roll.js:133` | — | Einzige Stelle mit hartkodiertem `'2.11'` |
| Boot-Crash-Fix (STAB-01) | `tools/debug.js:99` | — | Einzige defekte Zeile |
| build.py-Härtung (STAB-07) | `build.py` | `loader.js` (Sync-Prüfung) | Build-System-Code |
| CI-Smoke-Test (STAB-08) | `.github/workflows/ci.yml` | `tests/e2e/app.spec.js` (Basis) | CI-Konfiguration + neuer Smoke-Spec |
| Mindmap-Reste (STAB-02) | `systems/campaign-manager/campaign-manager.js:35` | `types/globals.d.ts`, `tests/setup.js` | Seed-Key + type-Deklarationen |
| Doku-Audit (STAB-10) | `CLAUDE.md` | `docs/bugfixes.md`, `README.md` | Manuelle Faktenkorrektur |

---

## Standard-Stack

### Core (unveränderter Einsatz)

| Bibliothek/Tool | Version | Zweck | Status |
|-----------------|---------|-------|--------|
| Jest | 30.2.0 | Unit-Tests (D-04 Regressionstest) | Bereits eingerichtet |
| Playwright | 1.57.0 | E2E / Smoke-Tests (STAB-08) | Bereits eingerichtet; gegen bundled.html |
| ESLint + Prettier | 9.39.2 / 3.7.4 | Statische Analyse (STAB-04) | Bereits eingerichtet |
| pytest | stdlib | Build-System-Tests | Bereits in `tests/build/` |
| Python (build.py) | 3.x | Build-System | `python` statt `python3` auf Windows |

[VERIFIED: package.json, playwright.config.js, ci.yml — direkt aus Quellcode]

### Keine neuen Abhängigkeiten erforderlich

Diese Phase installiert keine neuen npm- oder Python-Pakete. Alle benötigten Tools sind bereits als devDependencies vorhanden.

---

## Architecture Patterns

### System-Architekturdiagramm: Persistenz-Pfad (Stale-Shadow-Bug)

```
Nutzer-Aktion
     |
     v
saveImmediate() / save()
[systems/spellslots/persistence.js]
     |
     +-- dataSizeMB <= 5MB --> localStorage.set(key, dataString)
     |                              + localStorage.set(key + '_ts', Date.now())  [NEU: D-01]
     |                              + IDB-Mirror bei >2MB (fire-and-forget)
     |
     +-- dataSizeMB > 5MB  --> IDB-only: saveToIndexedDBFallback(key, dataString)
                                    [IDB schreibt bereits {id, data, timestamp}]
                                    + localStorage.removeItem(key)               [NEU: D-01 Fix]
                                    + Event-Log-Hinweis (einmal/Sitzung)         [D-02]

App-Start / load()
[systems/spellslots/quick-roll.js:23-45]
     |
     +-- LS vorhanden? --> LS-Timestamp lesen
     |   IDB vorhanden? --> IDB-Timestamp lesen
     |        |
     |        +-- Beide identisch oder kein Konflikt -> normaler Lade-Pfad
     |        |
     |        +-- LS kein Timestamp, IDB hat Timestamp -> Auswahl-Dialog (D-07)
     |             Nutzer wählt -> gewinnendem Stand laden
     |
     +-- LS leer, IDB vorhanden -> IDB laden (bisherige Logik, korrekt)
     |
     +-- Beide leer -> Neu-Initialisierung
```

### Empfohlene Implementierung: LS-Timestamp als Begleit-Key (D-01)

**Entscheidung (Claude's Discretion):** Begleit-Key (`{key}_ts`) statt Wrapper-Format.

**Begründung:**
- Wrapper-Format würde bestehende Rohdaten-Struktur in LS ändern → alle Lesepfade müssen angepasst werden (IDB-Sync, Backups, `StorageAPI`-Aufrufe)
- Begleit-Key ist rückwärtskompatibel: alter Code liest `key` unverändert, kennt `key_ts` nicht und ignoriert ihn
- Erstlade-Konflikt (D-07) ist der einzige Übergangsmoment: LS ohne Timestamp + IDB mit Timestamp → Dialog anzeigen; danach wird `key_ts` beim nächsten Save gesetzt → kein Dialog mehr
- `StorageAPI.set()` und `.get()` bleiben unverändert; nur `saveImmediate()` und `load()` erhalten ~15 Zeilen zusätzliche Logik

[VERIFIED: persistence.js:9-84, quick-roll.js:23-45 — direkt aus Quellcode]

### build.py Pass-3-Fix: Empfehlung Pre-Build-Check

**Entscheidung (Claude's Discretion):** Pre-Build-Duplikat-Check statt Pass-3-Body-Fix.

**Begründung:**
- Der aktuelle Pass-3-Code (`build.py:176-228`) kommentiert korrekt die `function X(`-Zeile aus, überspringt aber den Funktionskörper nicht (Schleife in Zeile 205-217 berechnet das Ende, nutzt es aber nie zum Überspringen)
- Fix-Ansatz A (Body-Fix): Pass-3 muss einen zweiten Index (`i`) tracken und `continue` für alle Körper-Zeilen ausgeben — komplex, da der äußere Loop `enumerate(lines)` ist und innere Schleifen nicht direkt überspringen können
- Fix-Ansatz B (Pre-Build-Check, empfohlen): Vor dem Bundle-Schritt alle Top-Level-Funktionsnamen aus Quelldateien extrahieren; bei Duplikat: Build abbrechen. Einfacher, deterministisch, löst das Problem an der Wurzel
- Beide Ansätze brauchen einen pytest-Test: `test_no_orphaned_return_statements` (CONCERNS.md Lücke)
- Bestehende `tests/build/test_build_deduplication.py` deckt Duplikat-Erkennung ab, nicht den Orphaned-Body-Fall

```python
# Pattern: Pre-Build-Check in build.py (vor Schritt 3 - JS kombinieren)
def check_duplicate_functions(source_dir, modules):
    """Schlägt fehl wenn doppelte Top-Level-Funktionsnamen in Quelldateien existieren."""
    func_pattern = re.compile(r'^function\s+(\w+)\s*\(', re.MULTILINE)
    seen = {}
    for module in modules:
        path = f"{source_dir}/{module}"
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

[VERIFIED: build.py:176-228, CONCERNS.md — direkt aus Quellcode]

### build.py DEBUG_MODE-Assertion

**Entscheidung (Claude's Discretion):** Post-Replace-Assertion hinzufügen.

Der aktuelle Ansatz (`build.py:421-422`) sucht nach exaktem String `"DEBUG_MODE: true,"`. Bei Prettier-Reformatierung (z.B. Leerzeichen nach Doppelpunkt entfernt) würde die Ersetzung stillschweigend fehlschlagen und Production mit `DEBUG_MODE: true` ausgeliefert.

```python
# Nach den replace()-Aufrufen in build.py:
if production:
    js_combined = js_combined.replace("DEBUG_MODE: true,", "DEBUG_MODE: false,", 1)
    js_combined = js_combined.replace("DEBUG_VALIDATE_ON_SAVE: true,", "DEBUG_VALIDATE_ON_SAVE: false,", 1)
    # NEUE Assertion:
    if "DEBUG_MODE: true" in js_combined:
        print("[ABORTED] DEBUG_MODE ist noch true im Production-Build! core/config.js prüfen.")
        sys.exit(1)
    log.success("DEBUG_MODE deaktiviert und verifiziert.")
```

[VERIFIED: build.py:418-423, CONCERNS.md — direkt aus Quellcode]

### Modullisten-Sync-Check

**Entscheidung (Claude's Discretion):** `build.py` parst `MODULES`-Array aus `loader.js` und vergleicht.

Der Sync-Check kann als Funktion in `build.py` implementiert werden, die bei Abweichung Build abbricht. Aktuell sind beide Listen in Sync (92/92 Module, CONCERNS.md verifiziert) — der Check dient der Zukunftssicherheit.

```python
def check_module_list_sync(loader_path, build_modules):
    """Vergleicht loader.js MODULES-Array mit build.py modules-Liste."""
    import re
    content = read_file(loader_path)
    # Extrahiere MODULES = [...] aus loader.js
    match = re.search(r'const MODULES\s*=\s*\[(.*?)\];', content, re.DOTALL)
    if not match:
        log.warning("Konnte MODULES-Array nicht aus loader.js parsen — Sync-Prüfung übersprungen")
        return
    loader_modules = re.findall(r"'([^']+)'", match.group(1))
    build_set = set(build_modules)
    loader_set = set(loader_modules)
    only_in_build = build_set - loader_set
    only_in_loader = loader_set - build_set
    if only_in_build or only_in_loader:
        print(f"[FEHLER] Modullisten-Abweichung!")
        for m in sorted(only_in_build): print(f"  Nur in build.py: {m}")
        for m in sorted(only_in_loader): print(f"  Nur in loader.js: {m}")
        sys.exit(1)
    log.success(f"Modullisten synchron: {len(build_set)} Module")
```

[VERIFIED: loader.js:10-124, build.py:249-355, CONCERNS.md — direkt aus Quellcode]

### CI-Smoke-Test (STAB-08): HTTP-Server statt file://

**Entscheidung (Claude's Discretion):** Playwright im CI läuft gegen **lokalen HTTP-Server** (`python -m http.server 8000` oder `npx serve dist`), nicht direkt per `file://`.

**Begründung:**

| Aspekt | file:// in CI | HTTP-Server in CI |
|--------|--------------|------------------|
| localStorage | Stark eingeschränkt in Chromium (bekanntes Playwright-Problem, CONCERNS.md Cluster 1) | Normal verfügbar |
| Service Worker | Nicht unterstützt unter file:// | Unterstützt |
| CORS | Problematisch für Template-Fetches | Kein Problem |
| Aufwand | Kein Setup | 1-2 Zeilen in ci.yml |
| Passt zum Nutzer-Use-Case? | Nutzer nutzt file://-Doppelklick, CI nutzt HTTP | Unterschied dokumentieren |

**Wichtig:** Der Nutzer-Use-Case (Erfolgskriterium 1: "Doppelklick per file://") wird durch manuelle Tests und den bestehenden `app.spec.js`-Test abgedeckt, der ebenfalls `file://` nutzt. Der CI-Smoke-Test dient der Boot-Crash-Erkennung, nicht der file://-Simulation.

```yaml
# ci.yml — neuer smoke-test Job
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

**Alternativ:** Neues `playwright.smoke.config.js` mit HTTP-Server-baseURL statt file://-baseURL, um den bestehenden `playwright.config.js` nicht zu ändern.

**Smoke-Test-Umfang (STAB-08):** Boot-Check + minimaler Tab-Sweep.

Der Boot-Crash-Check ist das Primärziel. Ein minimaler Tab-Sweep (6 Haupt-Tabs) erkennt Render-Crashs, die durch fehlende Module oder defekte Tab-Registry-Einträge entstehen. Mehr als 10 Tests würden CI-Zeit verschwenden und Fragility aus den bekannten 26 E2E-Failures importieren.

```javascript
// tests/e2e/smoke.spec.js (NEU)
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SMOKE_BASE_URL || `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

test('App bootet ohne Konsolen-Fehler', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BASE_URL);
    await page.waitForSelector('.app-title', { timeout: 15000 });
    // Init-Signal abwarten (init() Promise resolved)
    await page.waitForFunction(() => window._appInitialized === true, { timeout: 10000 }).catch(() => {});
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
});

test.describe('Tab-Sweep', () => {
    const TABS = ['dashboard', 'party', 'npcs', 'locations', 'quests', 'encounter'];
    for (const tab of TABS) {
        test(`Tab ${tab} lädt ohne Crash`, async ({ page }) => {
            const errors = [];
            page.on('pageerror', err => errors.push(err.message));
            await page.goto(BASE_URL);
            await page.waitForSelector('.app-title', { timeout: 15000 });
            await page.click(`.nav-tab[data-view="${tab}"]`);
            await page.waitForTimeout(500);
            expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
        });
    }
});
```

[VERIFIED: playwright.config.js, tests/e2e/app.spec.js, docs/e2e-failure-triage.md — direkt aus Quellcode]

### Smart-Strip-Migration Pattern (D-09)

Die Migration wird im bestehenden `version-migration.js` als neue Migration für Version `2.6.1` implementiert:

```javascript
'2.6.1': (data) => {
    // Smart-Strip: D.mindmap aus gespeicherten Daten entfernen
    if (data.mindmap) {
        const hasRealContent = (
            (data.mindmap.nodes && data.mindmap.nodes.length > 0) ||
            (data.mindmap.connections && data.mindmap.connections.length > 0)
        );
        if (!hasRealContent) {
            // Leer → stil entfernen
            delete data.mindmap;
        }
        // Echte Inhalte → Hinweis-Dialog (D-09) wird beim Import ausgelöst,
        // nicht in der Migration. Migration-Funktion gibt data unverändert zurück;
        // import-export.js prüft data.mindmap VOR dem Aufruf von migrateData().
    }
    return data;
},
```

**Wichtig:** Der Hinweis-Dialog mit Export-Angebot (D-09/D-10) muss in `import-export.js` VOR der Migration stattfinden, damit der Nutzer die Daten sichern kann. Die Migration selbst entfernt nur leere Mindmap-Keys.

[VERIFIED: systems/spellslots/version-migration.js, systems/campaign-manager/campaign-manager.js:35 — direkt aus Quellcode]

### validate.py-Reparatur (D-12)

```python
# Statt:
SOURCE_DIR = '/mnt/user-data/outputs/dnd-tracker-modular'

# Neu (analog zu tools/purge-css.py:12):
SOURCE_DIR = str(Path(__file__).parent)
```

[VERIFIED: validate.py:11, CONCERNS.md — direkt aus Quellcode]

### python3 → python in npm-Scripts (STAB-09)

Auf Windows ist `python3` typischerweise nicht verfügbar; `python` oder `py -3` hingegen schon. CI (Ubuntu) hat `python3` — daher empfiehlt sich der plattformübergreifende Ansatz über eine Wrapper-Datei oder `cross-env`. Einfachste Lösung: alle `python3`-Aufrufe in `package.json` durch `python` ersetzen und in `CLAUDE.md` dokumentieren, dass `PYTHONIOENCODING=utf-8` auf Windows empfohlen ist (bereits dokumentiert).

[VERIFIED: package.json:scripts, CONCERNS.md — direkt aus Quellcode]

---

## Don't Hand-Roll

| Problem | Nicht selbst bauen | Stattdessen nutzen | Warum |
|---------|-------------------|--------------------|-------|
| E2E-Boot-Test | Eigenes Test-Framework | Playwright (bereits installiert) | Etabliert, CI-ready |
| Timestamp-Vergleich | Eigene Clock-Abstraktion | `Date.now()` direkt | Kein Overhead nötig |
| JSON-Diff für Conflict-Dialog | Eigenes Diff-System | Größenvergleich + Datumsstempel | Nutzer braucht nur "welcher ist neuer/größer" |
| Modul-Sync-Check | Externes Tool | Python-Regex in build.py | Kein zusätzliches Tool nötig |
| SRD-Lizenz-Prüfung | Eigener Checker | Manueller Audit + Dokumentation in docs/ | Rechtsfrage erfordert menschliche Entscheidung |

---

## Häufige Pitfalls

### Pitfall 1: Stale-Shadow-Bug-Fix bricht IDB-nur-Pfad

**Was schiefläuft:** Fix löscht LS-Key beim IDB-only-Save, aber ein paralleler Tab oder ein schneller Reload liest LS noch bevor der Delete abgeschlossen ist.
**Warum es passiert:** `saveImmediate()` ist async; `localStorage.removeItem()` muss nach dem erfolgreichen IDB-Write aufgerufen werden.
**Wie vermeiden:** `removeItem()` im `then()`/`await`-Block nach `saveToIndexedDBFallback()` aufrufen, nicht davor.
**Warnsignal:** Unit-Test schlägt fehl, wenn Mock-IDB-Write erfolgreich aber LS-Key noch gesetzt ist.

[VERIFIED: persistence.js:33-40, quick-roll.js:31-45]

### Pitfall 2: D-07-Dialog erscheint bei jeder normalen App-Nutzung

**Was schiefläuft:** Nach dem ersten Durchlauf mit dem Begleit-Timestamp-Fix hat LS einen Timestamp, IDB hat einen anderen (wegen des 2MB-Mirrors). Jeder Start produziert einen Dialog.
**Warum es passiert:** IDB-Mirror (bei >2MB) schreibt asynchron nach LS-Save; IDB-Timestamp ist geringfügig neuer.
**Wie vermeiden:** Dialog nur anzeigen wenn: (a) LS-Timestamp existiert nicht (Alt-Daten) UND IDB-Timestamp existiert. Nicht wenn beide vorhanden sind und geringfügig abweichen (Mirror-Delta).
**Warnsignal:** Dialog erscheint bei jedem Reload mit einer normalen <5MB-Kampagne.

[VERIFIED: persistence.js:49-52 — IDB-Mirror-Logik identifiziert]

### Pitfall 3: Export-Version 2.11 → compareVersions-Seiteneffekte

**Was schiefläuft:** `compareVersions('2.11', '2.6.0')` wertet 11 > 6 aus (korrekt als "neuer"), sodass bisher keine Migration lief. Nach dem Fix auf `APP_CONFIG.VERSION` = `'2.6.1'` würden bestehende `'2.11'`-Exporte beim Import wieder `compareVersions('2.11', '2.6.1')` auswerten → immer noch > → keine Migration. Das ist korrekt für alte Exporte.
**Was zu prüfen ist:** Der Legacy-Stempel `'2.11'` muss als **besonderer Altformat-Stempel** behandelt werden — nicht als Versionsnummer. Empfehlung: Vor `compareVersions()` prüfen ob `p._version === '2.11'` → dann als Legacy-Import behandeln und Migrationen ab `'2.0.0'` laufen lassen.
**Warnsignal:** Unit-Test für Export/Re-Import schlägt fehl, weil `migrateData()` nicht aufgerufen wird.

[VERIFIED: quick-roll.js:63-72, 133]

### Pitfall 4: Pass-3-Fix löscht legitime gleichnamige Hilfsfunktionen

**Was schiefläuft:** Pre-Build-Check markiert Funktionen als Duplikat, die in `utils/testable-utils.js` existieren (die ~11 doppelten Funktionen, CONCERNS.md Fragile Areas).
**Warum es passiert:** `testable-utils.js` enthält Kopien von Produktions-Utilities für Jest.
**Wie vermeiden:** Pre-Build-Check muss `testable-utils.js` und die gesamte `tests/`-Verzeichnishierarchie aus der Prüfung ausschließen. Nur Module aus `build.py modules`-Liste prüfen.

[VERIFIED: CONCERNS.md Fragile Areas, TESTING.md]

### Pitfall 5: Smoke-Test schlägt in CI fehl wegen fehlender dist-Datei

**Was schiefläuft:** `smoke-test`-Job startet, aber `dist/dnd-tracker-optimized.html` existiert nicht (Build-Job gescheitert oder Artifact nicht korrekt gesetzt).
**Wie vermeiden:** `needs: [build]` in ci.yml korrekt setzen; `actions/download-artifact@v4` vor dem Server-Start ausführen; Fallback: Test auf `dnd-tracker-bundled.html` statt `-optimized.html` wenn nur dev-Build vorhanden.

[VERIFIED: ci.yml — Upload-Pfad ist `dist/dnd-tracker-optimized.html`]

### Pitfall 6: CLAUDE.md-Faktenkorrektur überschreibt historisch wertvolle Inhalte

**Was schiefläuft:** Zu aggressive Kürzung entfernt Entscheidungsdokumentationen (z.B. Refactoring-Lektionen Jan 2026), die als künftige Referenz wertvoll sind.
**Leitlinie (D-14):** Nur nachweislich falsche Aussagen korrigieren. Historische Kapitel bleiben. Roadmap-Tabelle: abgeschlossene Items als ~~Done~~ markieren. Mindmap-Abschnitte (Recent Features, Patterns): entfernen oder als "entfernt" kennzeichnen.

[VERIFIED: CLAUDE.md Zeilen 81, 129, 152, 336-344, CONCERNS.md]

---

## Code-Beispiele

### Stale-Shadow-Bug Fix (Kernteil)

```javascript
// systems/spellslots/persistence.js — saveImmediate(), IDB-only-Zweig
if (dataSizeMB > LS_LIMIT_MB) {
    await saveToIndexedDBFallback(key, dataString);
    // NEU D-01: LS-Schatten-Key entfernen (verhindert stale-shadow beim Reload)
    StorageAPI.remove(key);
    // NEU D-01: kein Timestamp-Key nötig auf LS-Seite (IDB hat timestamp)
    updateSaveIndicator('saved');
    // D-02: Einmal-Hinweis via Event-Log (nicht Toast)
    if (!window._idbModeSeen) {
        window._idbModeSeen = true;
        showToast('Kampagne im IndexedDB-Modus (>5MB). Daten sicher.', 'info', 4000);
    }
    broadcastSave();
    return;
}
// Normaler LS-Save: Timestamp setzen
StorageAPI.set(key, dataString);
StorageAPI.set(key + '_ts', String(Date.now()));  // NEU D-01
```

```javascript
// systems/spellslots/quick-roll.js — load(), Timestamp-Vergleich
const lsData = StorageAPI.get(key, null);
const lsTs = lsData ? parseInt(StorageAPI.get(key + '_ts', '0'), 10) : 0;

let idbData = null;
let idbTs = 0;
try {
    const idbRecord = await loadFromIndexedDBFallbackRaw(key);  // Gibt {data, timestamp} zurück
    if (idbRecord) {
        idbData = idbRecord.data;
        idbTs = idbRecord.timestamp || 0;
    }
} catch (e) { /* kein IDB-Eintrag */ }

// D-07: Konflikt-Erkennung
if (lsData && idbData && lsTs === 0 && idbTs > 0) {
    // Altdaten-Szenario: LS ohne Timestamp, IDB mit Timestamp
    const useIdb = await showStorageConflictDialog(lsData, idbData, idbTs);
    s = useIdb ? idbData : lsData;
} else if (lsData && (!idbData || lsTs >= idbTs)) {
    s = lsData;  // LS ist aktueller oder einzige Quelle
} else if (idbData) {
    s = idbData;  // IDB ist aktueller
}
```

[VERIFIED: persistence.js:31-45, quick-roll.js:23-45 — Basis aus Quellcode; Fix-Pattern ist Ableitung]

### Export-Stempel-Fix

```javascript
// systems/spellslots/quick-roll.js:133
// ALT:
exp._version = '2.11';
// NEU (D-05):
exp._version = APP_CONFIG.VERSION;  // z.B. '2.6.1'
```

```javascript
// Legacy-Stempel-Erkennung beim Import (quick-roll.js:63):
// VOR compareVersions prüfen:
if (p._version === '2.11') {
    // Altformat: immer migrieren ab frühester bekannter Version
    p._version = '2.0.0';
}
if (!p._version || compareVersions(p._version, CURRENT_VERSION) < 0) {
    p = migrateData(p);
}
```

[VERIFIED: quick-roll.js:63-72, 133 — direkt aus Quellcode]

---

## Nicht Hand-Rollen: Spezifisch für diese Phase

Die Phase erfordert keine algorithmisch komplexen Eigenentwicklungen. Kritische Punkte:

1. **Timestamp-Berechnung:** `Date.now()` (Millisekunden seit Epoch) reicht vollständig aus. Keine externe Zeitbibliothek.
2. **IndexedDB-Raw-Read:** `loadFromIndexedDBFallback` gibt bereits `request.result` zurück — für den Timestamp-Vergleich muss es `{data, timestamp}` statt nur `data` zurückgeben. Kleine Anpassung, kein Neubau.
3. **Conflict-Dialog:** Einfaches `<dialog>`-Modal mit zwei Buttons. Das bestehende Modal-System (`ui/actions/system-actions.js`) als Vorlage nutzen.

---

## Runtime-State-Inventar

> Diese Phase ist KEINE Rename-/Refactor-/Migration-Phase im klassischen Sinne — kein String-Replace-Sweep. Das Inventar wird auf die zwei relevanten Datenmigrations-Szenarien beschränkt.

| Kategorie | Gefundene Items | Aktion |
|-----------|-----------------|--------|
| Gespeicherte Daten (LS) | `dnd-tracker-v4`-Key: Kampagnendaten ohne `_ts`-Begleit-Key in bestehenden Installationen | Code-Edit: neuer `_ts`-Key beim nächsten Save; kein Daten-Migration-Script nötig |
| Gespeicherte Daten (IDB) | `dnd-tracker-db` / Store `campaigns`: Einträge haben bereits `{id, data, timestamp}` — kein Handlungsbedarf | Keine |
| Gespeicherte Daten (IDB, Mindmap) | Kampagnen mit echten Mindmap-Nodes (selten, da Feature vor kurzem entfernt) | Hinweis-Dialog + JSON-Export bei Import (D-09/D-10) |
| Gespeicherte Daten (LS, mindmap-Seed) | Bestehende Kampagnen tragen `mindmap: {nodes:[], connections:[]}` im gespeicherten D-Objekt | Migration 2.6.1 entfernt leere Keys; beim Reload selbst-heilend |
| Live-Service-Config | Keine externen Services konfiguriert | Keine |
| OS-registrierter State | Keine (keine Task-Scheduler, keine pm2-Prozesse) | Keine |
| Secrets/Env-Vars | Keine anwendungsrelevanten Secrets | Keine |
| Build-Artefakte | `dist/dnd-tracker-bundled.html`, `dist/dnd-tracker-optimized.html` — nach Build-Härtung neu zu bauen | Neubau nach STAB-07-Fix |

**Datenmigrations-Besonderheit:** LS-Begleit-Timestamp (`_ts`-Key) entsteht organisch beim nächsten Save — kein Einmalscript nötig. Nutzer mit bestehenden Daten erleben maximal einmalig den D-07-Konflikt-Dialog.

---

## Umgebungs-Verfügbarkeit

| Abhängigkeit | Benötigt für | Verfügbar | Version | Fallback |
|--------------|-------------|-----------|---------|---------|
| Python | build.py, validate.py | Zu prüfen | `python --version` | `py -3` auf Windows |
| Node.js | npm-Scripts, Jest, Playwright | Ja (CI: 20) | >=18.0.0 | — |
| Playwright (Chromium) | STAB-08 Smoke-Test | Ja (devDep) | 1.57.0 | — |
| Jest + jsdom | STAB-04, D-04 Unit-Tests | Ja (devDep) | 30.2.0 | — |
| pytest | Build-Dedup-Tests | Python stdlib | — | — |

**Fehlende Abhängigkeiten ohne Fallback:**
- Keine (alle Tools sind bereits installiert)

**Windows-Besonderheit:** `npm run build` ruft `python3` auf → schlägt auf Windows fehl. Fix: `python3` → `python` in package.json (STAB-09). CI (Ubuntu) hat `python3`, daher `python3` in ci.yml behalten.

[VERIFIED: package.json:scripts, ci.yml — direkt aus Quellcode]

---

## Validation Architecture

### Test-Framework

| Eigenschaft | Wert |
|-------------|------|
| Unit-Framework | Jest 30.2.0 |
| Unit-Config | `jest.config.cjs` |
| E2E-Framework | Playwright 1.57.0 |
| E2E-Config | `playwright.config.js` (bestehend) + neues `playwright.smoke.config.js` |
| Build-Tests | pytest (`tests/build/test_build_deduplication.py`) |
| Schnell-Ausführung | `npx jest tests/unit/stability.test.js --no-coverage` |
| Vollständig | `npm test && python -m pytest tests/build/ -v` |

### Phase Requirements → Test-Map

| Req ID | Verhalten | Test-Typ | Automatisiertes Kommando | Datei existiert? |
|--------|-----------|----------|------------------------|------------------|
| STAB-01 | Boot ohne SyntaxError nach debug.js-Fix | E2E Smoke | `npx playwright test tests/e2e/smoke.spec.js` | ❌ Wave 0 |
| STAB-02 | Neue Kampagne hat kein `mindmap`-Key | Unit | `npx jest tests/unit/stability.test.js -t "mindmap"` | ❌ Wave 0 (Test hinzufügen) |
| STAB-02 | Migration entfernt leere mindmap-Keys | Unit | `npx jest tests/unit/stability.test.js -t "migration"` | ❌ Wave 0 |
| STAB-03 | dist-Build läuft durch ohne Build-Fehler | Build (pytest) | `python -m pytest tests/build/ -v` | ✅ (erweitern) |
| STAB-04 | `npm run check` grün | Lint/Type | `npm run check` | ✅ |
| STAB-05 | >5MB-Roundtrip verliert keine Daten | Unit (Mock-Storage) | `npx jest tests/unit/stability.test.js -t "5MB"` | ❌ Wave 0 |
| STAB-05 | D-07-Dialog erscheint nur bei echtem Konflikt | Unit | `npx jest tests/unit/stability.test.js -t "conflict"` | ❌ Wave 0 |
| STAB-06 | Export trägt APP_CONFIG.VERSION | Unit | `npx jest tests/unit/stability.test.js -t "export version"` | ❌ Wave 0 |
| STAB-06 | Re-Import von Legacy-`'2.11'`-Datei führt Migrationen aus | Unit | `npx jest tests/unit/stability.test.js -t "legacy stamp"` | ❌ Wave 0 |
| STAB-07 | Build bricht ab bei DEBUG_MODE=true in Production | pytest | `python -m pytest tests/build/ -v -k "debug_mode"` | ❌ Wave 0 |
| STAB-07 | Build bricht ab bei doppelter Funktion in Quellen | pytest | `python -m pytest tests/build/ -v -k "duplicate"` | ❌ Wave 0 (erweitern) |
| STAB-07 | Modullisten LS/build.py sind synchron | pytest | `python -m pytest tests/build/ -v -k "sync"` | ❌ Wave 0 |
| STAB-08 | App bootet ohne Konsolenfehler (CI) | E2E Smoke | `npx playwright test tests/e2e/smoke.spec.js` | ❌ Wave 0 |
| STAB-08 | 6 Tabs laden ohne Crash | E2E Smoke | `npx playwright test tests/e2e/smoke.spec.js` | ❌ Wave 0 |
| STAB-09 | `npm run build` funktioniert auf Windows | Manuell | `npm run build:dev` lokal ausführen | — |
| STAB-10 | package.json license = MIT | Unit/Lint | `node -e "const p=require('./package.json'); if(p.license!=='MIT') throw new Error()"` | — (Einzeiler) |
| STAB-11 | SRD-Lizenzdokumentation existiert | Manuell | Sichtprüfung `docs/srd-license.md` | ❌ Wave 0 (erstellen) |

### Sampling Rate

- **Pro Task-Commit:** `npx jest tests/unit/stability.test.js --no-coverage` (betrifft Persistenz-Tasks)
- **Pro Wave-Merge:** `npm test && python -m pytest tests/build/ -v`
- **Phase Gate:** `npm test && npm run check && npx playwright test tests/e2e/smoke.spec.js` vor `/gsd-verify-work`

### Wave 0 Lücken

- [ ] `tests/e2e/smoke.spec.js` — neu erstellen, deckt STAB-01, STAB-08
- [ ] `tests/unit/stability.test.js` — erweitern um STAB-05 (>5MB-Mock), STAB-06 (Export-Version), STAB-02 (Migration), D-07 (Konflikt-Dialog-Logik)
- [ ] `tests/build/test_build_deduplication.py` — erweitern um: DEBUG_MODE-Assertion-Test, Pre-Build-Duplikat-Check-Test, Modullisten-Sync-Test
- [ ] `docs/srd-license.md` — neu erstellen (STAB-11 Dokumentations-Artefakt)

---

## Security Domain

> `security_enforcement` nicht explizit in config.json → gilt als aktiviert.

### Anwendbare ASVS-Kategorien

| ASVS-Kategorie | Betrifft diese Phase | Standard-Kontrolle |
|----------------|---------------------|-------------------|
| V2 Authentication | Nein | — |
| V3 Session Management | Nein | — |
| V4 Access Control | Nein | — |
| V5 Input Validation | Ja (Import-Pfad) | Bestehende `migrateData()` + JSON-Schema-Prüfung |
| V6 Kryptographie | Nein | — |

### Bekannte Bedrohungsmuster

| Pattern | STRIDE | Standard-Mitigation |
|---------|--------|---------------------|
| Manipulierter Kampagnen-Export (böswillig präparierte JSON-Datei) | Tampering | `sanitizeHTML()` + `esc()` bei allen Import-Feldern; bereits vorhanden |
| Mindmap-Export-Download (D-10) ohne Sanitisierung | Tampering | Mindmap-Daten sind Nutzer-eigene Inhalte; `JSON.stringify()` reicht aus |
| XSS in Konflikt-Dialog (D-07) mit Kampagnenname | Spoofing | `esc()` für alle Nutzer-Strings im Dialog |

**Hinweis:** Diese Phase führt keinen neuen Code ein, der externe Daten verarbeitet, außer dem Import-Pfad (bereits bestehend und gesichert). Das `file://`-Origin-Modell verhindert Remote-Exfiltration.

---

## Annahmen-Log

| # | Aussage | Abschnitt | Risiko bei Fehleinschätzung |
|---|---------|-----------|----------------------------|
| A1 | Playwright 1.57.0 unterstützt `file://`-baseURL für lokalen Smoke-Test-Fallback | CI-Smoke-Test | Niedrig — bestehender `app.spec.js` nutzt identisches Pattern bereits [VERIFIED: playwright.config.js:41] |
| A2 | `python -m http.server 8000` ist in Ubuntu GitHub Runner verfügbar | CI-Smoke-Test | Sehr niedrig — Teil der Python-Standardbibliothek [ASSUMED: GitHub-Runner-Konfiguration nicht explizit verifiziert] |
| A3 | Der Minimalumfang von 6 Tabs im Smoke-Test deckt den clearMindmap-Boot-Crash ab | STAB-08 | Niedrig — Crash tritt beim Init auf, nicht tab-spezifisch [VERIFIED: debug.js:99 — init()-Pfad] |
| A4 | Deutsche SRD-Zaubertexte stammen aus öffentlich verfügbaren Quellen | STAB-11 | Mittel — ohne vollständigen Lizenz-Audit nicht gesichert [ASSUMED: Nutzer-Kontext aus D-16] |

**Legende:** [VERIFIED] = aus Quellcode bestätigt; [ASSUMED] = aus Trainingswissen / Kontext abgeleitet

---

## Offene Fragen (RESOLVED)

Alle drei Fragen sind beim Planen final entschieden worden. Es bleiben keine offenen Punkte, die die Umsetzung der Plaene 01-07 blockieren.

1. **Vollständiger Lizenzsourcen-Audit (STAB-11) — ENTSCHIEDEN**
   - Was bekannt: SRD 5.1 ist CC-BY-4.0; deutsche Übersetzungen können eigene Rechte haben
   - **Entscheidung (final, gemäß D-16):** Das Audit-Vorgehen in Plan 07 IST die Entscheidung — kein separater Lizenz-Audit als Vorbedingung. Plan 07 grept die Zaubertexte nach Quellangaben, dokumentiert den Befund (Quelle, Lizenz, Risikobewertung) in docs/, ergänzt fehlende Pflicht-Attribution (z.B. CC-BY-4.0 für SRD 5.1) in README/LICENSE ohne Beschuldigung. Wird eine geschützte Drittquelle gefunden, wird das harte Risiko als eigene Folge-Entscheidung eskaliert (D-16) — in dieser Phase werden KEINE Texte still gelöscht. Damit ist die Frage für die Phasenplanung abschließend beantwortet.

2. **D-07-Dialog UX bei identischen Datenmengen — ENTSCHIEDEN**
   - Was bekannt: Dialog erscheint nur wenn LS ohne Timestamp UND IDB mit Timestamp und unterschiedlichem Inhalt
   - **Entscheidung (final):** Inhaltsvergleich per direktem String-Vergleich der serialisierten Speicherstände — `lsData !== idbData` (siehe Plan 02, Task 3a). Kein Hash, keine Byte-Längen-Heuristik nötig: Die Stände liegen ohnehin als Strings vor; ein direkter Vergleich ist exakt und günstig. Sind die Inhalte identisch (`lsData === idbData`), erscheint KEIN Dialog (D-07: "Sind die Inhalte identisch: kein Dialog") und der Load nimmt still den vorhandenen Stand. Plan 02 Task 1 testet diesen Identisch-Fall explizit (Dialog-Spy `not.toHaveBeenCalled`).

3. **Playwright-Smoke-Test in CI: `npx playwright install chromium` Cache — ENTSCHIEDEN**
   - Was bekannt: `npx playwright install` ist nötig in CI; dauert ~30 Sekunden
   - **Entscheidung (final): Kein Browser-Cache, MVP-Ansatz.** Der smoke-test-Job (Plan 06, Task 1) nutzt `cache: 'npm'` für Node-Module und führt `npx playwright install --with-deps chromium` bei jedem Lauf ohne separaten Browser-Cache aus. Die ~30 Sekunden sind für die Phase akzeptabel; ein `~/.cache/ms-playwright`-Cache-Step kann später als Optimierung nachgezogen werden (nicht Teil dieser Phase).

---

## Quellen

### Primär (HIGH-Konfidenz — direkt aus Quellcode verifiziert)

- `systems/spellslots/persistence.js` — Save-Pfad, IDB-Timestamp-Format, LS-Limit-Logik
- `systems/spellslots/quick-roll.js:23-148` — Load-Pfad, Export-Stempel, compareVersions-Aufruf
- `systems/spellslots/version-migration.js` — Migrations-System-Struktur
- `tools/debug.js:99` — Boot-Crash-Ursache (`clearAllNodes = clearMindmap`)
- `build.py:176-228, 418-423, 486-534` — Pass-3-Implementation, DEBUG_MODE-Flip, Post-Build-Validierung
- `loader.js:10-124` — Modul-Liste
- `.github/workflows/ci.yml` — CI-Struktur (kein E2E, kein Smoke-Test)
- `playwright.config.js` — file://-baseURL, Chromium-only
- `tests/e2e/app.spec.js` — Bestehender Smoke-Test-Aufbau
- `.planning/codebase/CONCERNS.md` — Vollständiges Befund-Inventar
- `.planning/codebase/TESTING.md` — Test-Infrastruktur-Stand
- `docs/e2e-failure-triage.md` — E2E-Failure-Cluster (insbes. Cluster 1: file://-localStorage)
- `core/config.js` — APP_CONFIG.VERSION, STORAGE_KEY, CAMPAIGN_INDEX_KEY
- `systems/campaign-manager/campaign-manager.js:35` — mindmap-Seed
- `package.json` — Scripts, License-Feld, devDependencies
- `validate.py:11` — kaputte Hardcoded-Pfad

### Sekundär (MEDIUM-Konfidenz — offiziell dokumentiert, nicht in dieser Session geprüft)

- Playwright-Dokumentation: `file://`-Einschränkungen für localStorage (referenziert in TESTING.md, Triage-Doc)
- GitHub Actions: `actions/upload-artifact@v4` / `download-artifact@v4` API (Standard-Pattern)

---

## Metadaten

**Konfidenz-Aufschlüsselung:**
- Standard-Stack: HIGH — alle Tools aus package.json verifiziert
- Architektur-Patterns: HIGH — direkt aus Quellcode abgeleitet (persistence.js, quick-roll.js, build.py)
- Pitfalls: HIGH — aus CONCERNS.md, TESTING.md und direkter Code-Analyse
- CI-Smoke-Test-Design: MEDIUM — file://-Einschränkungen aus Triage-Doc bekannt; HTTP-Server-Ansatz ist Standard-Pattern

**Research-Datum:** 2026-06-12
**Gültig bis:** 2026-07-12 (stabiler Stack; 30 Tage)
