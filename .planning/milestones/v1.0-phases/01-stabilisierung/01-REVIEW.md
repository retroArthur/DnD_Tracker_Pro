---
phase: 01-stabilisierung
reviewed: 2026-06-12T09:37:08Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - systems/spellslots/quick-roll.js
  - tests/unit/storage-conflict.test.js
  - utils/game-rules.js
  - features/quick-actions.js
  - features/dmscreen/dmscreen-render.js
  - ui/editors/markdown-converter.js
  - eslint.config.js
  - package.json
  - systems/spellslots/persistence.js
  - systems/spellslots/import-export.js
  - systems/spellslots/version-migration.js
  - systems/campaign-manager/campaign-manager.js
  - core/config.js
  - tests/unit/stability.test.js
  - tests/unit/migration.test.js
  - tests/setup.js
  - tests/e2e/smoke.spec.js
  - tests/build/test_build_deduplication.py
  - playwright.smoke.config.js
  - build.py
  - validate.py
  - tools/debug.js
  - types/entities.d.ts
  - types/globals.d.ts
  - .github/workflows/ci.yml
findings:
  critical: 1
  warning: 3
  info: 9
  total: 13
status: issues_found
---

# Phase 01: Code Review Report (2. Durchlauf — nach Gap-Closure)

**Reviewed:** 2026-06-12T09:37:08Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

Zweiter Review-Durchlauf nach den Gap-Closure-Plänen 01-08 (CR-01-Rekursion) und 01-09 (`npm run check` grün). Die beiden gemeldeten Vorbefunde sind verifiziert:

- **CR-01 (Selbstrekursion) ist sauber behoben.** `resolveStorageConflict` in `quick-roll.js` enthält keinerlei Selbstreferenz mehr. Der Identisch-Fall (`lsData === idbData`) ruft `onUseLS()` und kehrt zurück; bei Abweichung delegiert die Funktion an den **anders benannten** optionalen Hook `window.showStorageConflictDialogUI` und fällt sonst deterministisch auf `onUseIDB()` zurück. Keine Endlosrekursion, kein `RangeError`. Die neue `tests/unit/storage-conflict.test.js` lädt den **echten** Quelltext via `vm.runInContext` und prüft alle vier Pfade plus einen Quelltext-Audit (Test E). Dieser Teil von WR-06 ist damit substanziell geschlossen.
- **Prettier-Massenformatierung:** In den geprüften Dateien keine semantischen Änderungen erkennbar. Die `case`-Block-Klammerungen in `quick-actions.js`, `dmscreen-render.js` und `markdown-converter.js` sind verhaltenserhaltend — jedes `break` liegt innerhalb der zugehörigen `{ }`, kein Fall-Through wurde verändert.
- **Dupe-Key-Fix in `game-rules.js`** (`getClassHitDie`): bestätigt, keine doppelten Objekt-Schlüssel mehr.

**Zentrale Datenverlust-Frage (Background):** Der IDB-Vorrang im Stale-Shadow-Pfad ist als bewusste Abweichung von D-07 dokumentiert. Er erzeugt **keinen neuen** stillen Verlust gegenüber dem dokumentierten Tradeoff: Der Konfliktpfad greift nur, wenn LS-Daten **ohne** `_ts`-Begleitstempel vorliegen (Legacy-/Fehlerpfad). Da auf der LS-Seite kein Timestamp existiert, ist eine „neuer/älter"-Entscheidung prinzipiell nicht möglich; „IDB bevorzugen" ist deterministisch und vermeidet den von D-07 kritisierten stillen Sieg veralteter LS-Daten. Siehe IN-01 für die verbleibende Rest-Ambiguität (zur Nachverfolgung für den späteren D-07-Dialog).

Der einzige neue, gewichtige Befund liegt **außerhalb** des CR-01/Gap-Themas: ein Import-seitiger Stored-XSS-Pfad (CR-01 unten), dessen Wurzeln in zwei der geprüften Dateien liegen. Er ist **kein Regression der Stabilisierungsphase**, sondern vorbestehend, wird aber surfacing-pflichtig eingestuft, weil das Projekt selbst XSS als Hochrisiko führt und der Angriffsvektor (geteilte Kampagnen-Dateien importieren) für diese App realistisch ist.

## Critical Issues

### CR-01: Stored-XSS über Import-Pfad — Wiki-Inhalt wird ungesäubert als HTML gerendert

**File:** `ui/editors/markdown-converter.js:258-300`, `systems/spellslots/import-export.js:339-376` (+ Konsument `features/wiki/wiki.js:460`)

**Issue:**
Es existiert eine asymmetrische Sanitisierung zwischen den beiden Markdown-Konvertern:
- `markdownToHtml()` ruft am Ende `sanitizeHTML(html)` auf (Zeile 242-244). Korrekt.
- `renderMarkdownInContent()` ruft **kein** `sanitizeHTML` auf und gibt `result` roh zurück (Zeile 299). Diese Funktion ist der „Render-on-Display"-Pfad.

Der Wiki-Anzeigepfad kombiniert das mit einem ungesäuberten `innerHTML`:
`entry.content` → `renderMarkdownInContent(...)` → `parseWikiLinks(...)` → `wiki.js:460 ${parsedContent}` ins `innerHTML`. **Keine** `sanitizeHTML`-Stufe in dieser Kette.

Der reguläre In-App-Editierpfad ist geschützt, weil `saveWikiEntry()` beim Speichern `sanitizeHTML(contentEl.innerHTML)` anwendet (`wiki.js:696`) — dabei wird u.a. `javascript:` global entfernt. **Aber:** Der Import-Pfad sanitisiert importierte Inhalte nie. Weder `executeImport()` (validiert nur Schema + Defaults, `import-export.js:292-301`/`351-368`) noch `importDataGlobal()` (`Object.assign(D, imp)`, Zeile 571) säubern String-Felder. Importierter Wiki-Inhalt wird also roh gespeichert und anschließend roh gerendert.

**Exploit (ohne Klick):** Eine präparierte Kampagnen-JSON mit
`wiki[0].content = '<img src=x onerror=alert(document.cookie)>'`
wird importiert; beim Öffnen des Wiki-Eintrags führt der `onerror`-Handler sofort aus. Für eine Kampagnen-teilende DM-App ist „fremde Kampagne importieren" ein realistischer Vektor.

**Fix:** Defense-in-Depth an der Anzeige-Grenze ODER beim Import. Minimal-invasiv an der Quelle (`markdown-converter.js`):
```javascript
function renderMarkdownInContent(html) {
    if (!html || typeof html !== 'string') return html;
    let result = html;
    // ... bestehende Markdown-Konvertierungen ...

    // Defense-in-Depth: identisch zu markdownToHtml() am Ende sanitisieren
    const sanitizeHTML = window.sanitizeHTML;
    if (typeof sanitizeHTML === 'function') {
        result = sanitizeHTML(result);
    }
    return result;
}
```
Zusätzlich empfohlen: importierte String-Felder beim Import durch `sanitizeHTML()` schleusen (z.B. in `executeImport()` für HTML-tragende Felder wie `content`/`description`/`traits`/`actions`), da mehrere Render-Pfade auf saubere Speicherinhalte vertrauen.

## Warnings

### WR-01: Migrations-Reihenfolge nutzt lexikografisches `sort()` — bricht bei zweistelligen Versionsteilen

**File:** `systems/spellslots/version-migration.js:70`

**Issue:**
`const versions = Object.keys(MIGRATIONS).sort();` sortiert die Migrations-Keys **lexikografisch**, nicht semantisch. Mit den aktuellen Keys `'2.3.0' < '2.4.0' < '2.6.1'` ist die Reihenfolge zufällig korrekt. Sobald ein Key einen zweistelligen Minor/Patch erreicht (z.B. `'2.10.0'`), kippt die String-Sortierung: `'2.10.0' < '2.3.0'` (weil `'1' < '3'`), wodurch Migrationen **in falscher Reihenfolge** angewendet würden. Das ist exakt dieselbe Bug-Klasse wie der in dieser Phase behobene `2.11`-Stempel-Defekt (D-05) — hier latent.

**Fix:** Mit dem bereits vorhandenen `compareVersions` sortieren:
```javascript
const versions = Object.keys(MIGRATIONS).sort(compareVersions);
```
Hinweis: `compareVersions` selbst ist für echte Semver (≤3 Teile, mehrstellige Teile erlaubt) korrekt — der Defekt liegt allein in der String-Sortierung der Keys.

### WR-02: Irreführender Stale-Shadow-Test in `stability.test.js` — WR-06 nur teilweise geschlossen

**File:** `tests/unit/stability.test.js:657-695`

**Issue:**
Der Test „Nach IDB-Save bei >5MB muss LS-Schatten-Key entfernt werden" setzt `_ts='999'`, lässt die Entfernungs-Zeilen **auskommentiert** (Zeile 688-689) und assertiert dann `expect(localStorage.getItem(STORAGE_KEY + '_ts')).toBe('999')`. Das ist eine Tautologie (Wert nach No-Op unverändert) und **widerspricht** dem realen Verhalten von `persistence.js`, das beide Keys im IDB-only-Pfad tatsächlich entfernt (`persistence.js:41-42` und `190-191`). Ein Leser dieses Tests zieht den falschen Schluss „`_ts` bleibt stehen". Solche bestätigend-falschen Assertions erzeugen falsche Sicherheit (Test-Reliability-Problem).

Allgemeiner: Der Block „Persistence Regression Tests (Plan 01-02)" testet weiterhin **Inline-Replikate** (`simulateExport`, `compareVersionsLocal`, manuell nachgebaute Entscheidungsbäume) statt der echten Quellfunktionen — der ursprüngliche WR-06-Kritikpunkt. Abgefedert wird das nur durch die zusätzlichen Quelltext-Greps (z.B. dynamische Version, Legacy-Normalisierung). Nur der **neue** `storage-conflict.test.js` testet echten Quellcode via `vm`. WR-06 ist damit für den CR-01-Pfad geschlossen, für die Persistenz-Schicht jedoch weiterhin simulationsbasiert.

**Fix:** Entweder den Test gegen das echte Verhalten umkehren (`_ts` nach IDB-only-Save erwartet `null`) oder — analog zu `storage-conflict.test.js` — `persistence.js` per `vm.runInContext` laden und `saveImmediate()`/`save()` mit gemocktem `StorageAPI`/IDB real ausführen, dann den localStorage-Zustand prüfen.

### WR-03: `importDataGlobal()` überschreibt aktuelle Kampagne ohne `saveUndoState()` und ohne Backup

**File:** `systems/spellslots/import-export.js:569-578`

**Issue:**
Im Überschreib-Zweig (Nutzer wählt „Aktuelle Kampagne überschreiben") führt die Funktion `Object.assign(D, imp)` + `save()` aus, **ohne** vorher `saveUndoState()` oder `createAutoBackup()` aufzurufen. Das ist die destruktivste mögliche Edit-Operation (Komplett-Überschreibung aller Daten) und damit nicht via `Strg+Z` rückgängig zu machen. Inkonsistent zu `executeImport()`, das sowohl `saveUndoState()` (Zeile 351) als auch im Replace-Modus `createAutoBackup()` (Zeile 355) aufruft. CLAUDE.md-Regel: „Always call `saveUndoState()` before delete/edit operations."

**Fix:**
```javascript
} else {
    // Aktuelle Kampagne überschreiben
    saveUndoState('Globaler Import (überschrieben)');   // <-- ergänzen
    try { createAutoBackup(); } catch (e) { /* optionales Backup */ }
    Object.assign(D, imp);
    if (!D._nextId) D._nextId = {};
    // ...
}
```

## Info

### IN-01: IDB-Vorrang im Stale-Shadow-Pfad — Rest-Ambiguität (D-07-Folgearbeit)

**File:** `systems/spellslots/quick-roll.js:33-35`, `49-73`

**Issue:** Kein Bug, dokumentierte Abweichung. Im seltenen Fall „LS-Daten ohne `_ts` (Legacy) sind tatsächlich neuer als ein abweichender, älterer IDB-Stand" wird der neuere LS-Stand zugunsten von IDB ignoriert und beim nächsten Save überschrieben. Da auf der LS-Seite kein Timestamp existiert, ist diese Entscheidung prinzipiell nicht eindeutig lösbar; der `window.showStorageConflictDialogUI`-Hook ist genau dafür als Andockpunkt reserviert.
**Fix:** Für die spätere D-07-Phase nachhalten (Auswahl-Dialog implementieren). Aktuell bewusst akzeptierter Tradeoff.

### IN-02: Ungenutzte Variable `hasHtmlTags`

**File:** `ui/editors/markdown-converter.js:263`

**Issue:** `const hasHtmlTags = /<[^>]+>/.test(html);` wird berechnet, aber nie verwendet (Dead Code; `no-unused-vars`-Warnung).
**Fix:** Zeile entfernen — oder, falls ursprünglich beabsichtigt war, bereits-HTML-Inhalte von der Markdown-Konvertierung auszunehmen, die Bedingung tatsächlich auswerten.

### IN-03: Redundanter `pushUndo()` vor Early-Return in `applyQuickAction()`

**File:** `features/quick-actions.js:97-106`

**Issue:** `pushUndo(...)` (Zeile 97) wird vor dem Effekt-Existiert-Check ausgeführt. Wenn der Effekt bereits existiert, kehrt die Funktion bei Zeile 105 ohne Datenänderung zurück — der Undo-Stack erhält einen leeren No-Op-Eintrag (ein wirkungsloses `Strg+Z`).
**Fix:** `pushUndo(...)` erst nach dem „bereits vorhanden"-Check aufrufen (also nach Zeile 106, unmittelbar vor `cb.effects.push(...)`).

### IN-04: `types/entities.d.ts` driftet von Laufzeit-/IO-Schema-Feldnamen ab

**File:** `types/entities.d.ts:104-143, 205-219, 369-381`

**Issue:** Mehrere Interface-Felder stimmen nicht mit der tatsächlichen Laufzeit-/IO-Schema-Form überein:
- `Combatant.hpCurrent`/`hpMax` (Zeile 374-375) — Laufzeit nutzt `currentHp`/`maxHp` (`features/initiative.js`, `dmscreen-render.js:849`).
- `Quest.name`/`giverNpcId` — IO-Schema nutzt `title`/`giverId` (`import-export.js:57,61`).
- `Character.characterClass`/`armorClass` — IO-Schema nutzt `class`/`ac` (`import-export.js:11,18`).

Rein typseitig (JS-Module werden nicht gegen diese `.d.ts` geprüft), daher kein Laufzeitfehler — aber die Typdefinitionen sind irreführend und mindern ihren Nutzen.
**Fix:** Interfaces an die reale Datenform angleichen (oder umgekehrt dokumentieren, welche Form kanonisch ist).

### IN-05: `validate.py` enthält veraltete Modul-Zähl-Erwartungen und prüft falsche Eingabedatei

**File:** `validate.py:157-191`, `45-76`

**Issue:** `check_module_count()` erwartet hartkodiert `core:4, utils:3, systems:8, render:2, features:3, ui:4` und nutzt nicht-rekursives `os.listdir` — das passt nicht mehr zum tatsächlichen Projekt (z.B. `utils/` hat 9 Dateien, `features/` viele Unterordner). `check_body_html()` prüft `assets/body.html`, während der Build `assets/templates/*.html` verwendet. Das Skript meldet für ein gesundes Projekt Fehlschläge. Es ist nicht in CI eingebunden (`ci.yml` nutzt `build.py` + Jest), daher kein Pipeline-Risiko, aber irreführende lokale Ausgabe (`npm run validate`).
**Fix:** Zählerwartungen entfernen/rekursiv berechnen oder den veralteten Check streichen; `check_body_html` an die Template-Struktur anpassen.

### IN-06: Python-Build-Härtungstests nicht in CI eingebunden

**File:** `tests/build/test_build_deduplication.py`, `.github/workflows/ci.yml:22-31`

**Issue:** Die gut strukturierten `pytest`-Tests (Dedup, Production-`DEBUG_MODE`-Flip, Modul-Sync, Duplikat-Funktionen, verwaiste Returns) werden nirgends in CI ausgeführt — der `test`-Job ruft nur `npm test` (Jest) auf. Die Build-Härtung aus STAB-07 hat damit keinen automatisierten Regressionsschutz.
**Fix:** Im CI einen Schritt `pip install pytest && python -m pytest tests/build/ -v` ergänzen (nach dem Build-Job, damit `dist/`-abhängige Tests nicht skippen).

### IN-07: `completeReset()` re-seedet entfernte `mindmap`-Struktur

**File:** `tools/debug.js:917`

**Issue:** Der Reset baut `mindmap: { nodes: [], connections: [] }` wieder in `D` ein, obwohl das Mindmap-Feature laut D-09 entfernt wurde. Harmlos (die 2.6.1-Migration strippt den leeren Seed beim nächsten Load), aber inkonsistent mit der Entfernungsentscheidung.
**Fix:** `mindmap`-Zeile aus dem Reset-Template entfernen (analog zu `campaign-manager.js`, das den Seed bereits nicht mehr setzt).

### IN-08: Variablen-Shadowing in `deleteCampaign()`

**File:** `systems/campaign-manager/campaign-manager.js:69, 124`

**Issue:** `const key = ...` (Zeile 69) wird durch `for (const key in D)` (Zeile 124) verdeckt. Block-scoped und harmlos (das äußere `key` wird nach der Schleife nicht mehr gelesen), aber verwirrend.
**Fix:** Schleifenvariable umbenennen, z.B. `for (const k in D) delete D[k];`.

### IN-09: `.gitignore` deckt Smoke-Test-`outputDir` nicht ab

**File:** `playwright.smoke.config.js:26`, `.gitignore:25`

**Issue:** Die Smoke-Config schreibt nach `tests/e2e/test-results-smoke`, `.gitignore` ignoriert aber nur `tests/e2e/test-results/`. Dadurch erscheint `tests/e2e/test-results-smoke/` als untracked (entspricht dem aktuellen Git-Status `?? tests/e2e/test-results-smoke/`).
**Fix:** `.gitignore` um `tests/e2e/test-results-smoke/` ergänzen (oder die beiden `outputDir`-Pfade vereinheitlichen).

---

_Reviewed: 2026-06-12T09:37:08Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
