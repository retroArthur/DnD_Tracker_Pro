# Phase 15: Befundlage & Vorlauf - Pattern Map

**Gemappt:** 2026-09-08
**Analysierte Dateien:** 8 (4 neue, 4 zu ändernde)
**Analoge gefunden:** 8 / 8

## File Classification

| Neue/geänderte Datei | Rolle | Datenfluss | Nächstliegendes Analog | Trefferqualität |
|---|---|---|---|---|
| `tools/css-usage-report.js` | utility (Node-CLI, build-time) | batch/transform (Quellbaum lesen → Report) | `tools/generate-eslint-globals.js` | exakt (gleiche Kategorie: abhängigkeitsfreies Node-Analyse-Tool über `loader.js`/Quellbaum) |
| Neuer Playwright-Spec für FIX-01/02/03 (`tests/e2e/features/design-fixes.spec.js` o. ä.) | test (E2E) | request-response (Seite laden → `getComputedStyle` lesen) | `tests/e2e/features/npc-generator.spec.js` (Grundgerüst) + `tests/e2e/features/dice.spec.js` (Domäne Würfel) | exakt für Grundgerüst, rollen-match für Domäne |
| Neue Ratschen in `tests/unit/design-consistency.test.js` (`DMS_UNSTYLED_MAX`, `prefers-reduced-motion`-Rückbau-Ratsche) | test (Unit, Jest) | transform (CSS-Quelltext → Zählung → Schwellwert-Assertion) | bestehende Ratschen `DUBLETTEN_MAX`/`IMPORTANT_MAX` (Z. 283-298) und `INLINE_MAX` (Z. 940) in derselben Datei | exakt (dieselbe Datei, dasselbe Muster) |
| `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md` | config/doc (Messprotokoll) | batch (Messbefehle → Tabellen → Interpretation) | `.planning/milestones/v1.2-phases/14-tests-gates/14-GATE-BASELINE.md` | exakt (per Decision D-26 ausdrücklich als Formvorbild benannt) |
| `assets/styles/core.css` (neuer `prefers-reduced-motion`-Block) | config (CSS) | transform | die vier zu löschenden Blöcke selbst (`command-palette.css:153`, `dmscreen.css:1408`, `migration.css:231`, `pwa.css:130`) | exakt (Zusammenführung, kein neues Muster) |
| `features/dice/dice-core.js` (FIX-03, Zeile 345) | component/controller (DOM-Update nach Würfelwurf) | event-driven | `.fdp-number.crit`/`.fail`-Pfad im selben Modul (Floating-Dice-Panel) | exakt (im selben Modul, funktionierendes Vorbild) |
| `features/party/party-render.js` `renderCompactSpellSlots()` (FIX-02) | component (HTML-Render-Funktion) | transform (Datenmodell → HTML-String) | `systems/spellslots/spellslots-ui.js` `renderSpellSlotPips()` (Initiative-Kontext, `.slot-pip`) | exakt (gleiche fachliche Aufgabe: Zauberplatz-Pips rendern, bereits handler-kompatibel) |
| `features/dmscreen/dmscreen.css`-Regeln für Terrain/Fertigkeiten/Wissensgebiete (FIX-01) | config (CSS) | transform | bestehende `.dms-*`-Widget-Regelblöcke in derselben Datei (z. B. Rettungswürfe/Attribute-Widget) | rollen-match (gleiche Datei, gleiches Namensschema `dms-`) |

## Pattern Assignments

### `tools/css-usage-report.js` (utility, batch/transform)

**Analog:** `tools/generate-eslint-globals.js` (komplett gelesen, 244 Zeilen)

**Entry-Point / CommonJS-Kopf** (Z. 1-22):
```javascript
'use strict';

/**
 * ESLint-Globals-Generator — D-08 (Plan 14-02, Tracer)
 * ...
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const LOADER_PATH = path.join(REPO_ROOT, 'loader.js');
const OUTPUT_PATH = path.join(REPO_ROOT, 'eslint.generated-globals.js');
const REGEN_COMMAND = 'npm run globals:generate';
```
→ `css-usage-report.js` übernimmt exakt dieses Kopf-Muster: `'use strict'`, nur `fs`/`path`
via `require` (kein npm-Paket), `REPO_ROOT = path.resolve(__dirname, '..')`, benannte Konstanten
für die zu lesenden Quellen (`assets/styles/`, ggf. `features/`/`systems/`/... für Klassennutzung).

**Quellbaum-Walk (Verzeichnisrekursion)** — im Generator selbst nicht gebraucht (er liest nur
`loader.js`), aber im Projekt an anderer Stelle etabliert; als Vorbild dient `sourceJs()` aus
`tests/unit/design-consistency.test.js` (Z. 281-297, siehe unten "Shared Patterns").

**Kern-Algorithmus: Textbasiertes Parsing mit Klammertiefe** (Z. 154-198, gekürzt):
```javascript
function generateGlobalsFromModules() {
    const loaderSource = fs.readFileSync(LOADER_PATH, 'utf8');
    const modules = extractModulesFromLoader(loaderSource);
    const globals = {};

    for (const relPath of modules) {
        const absPath = path.join(REPO_ROOT, relPath);
        if (!fs.existsSync(absPath)) continue;
        const content = fs.readFileSync(absPath, 'utf8');
        let depth = 0;
        let lineNumber = 0;
        for (const line of content.split('\n')) {
            lineNumber++;
            // ... Depth-Tracking, Zeile für Zeile
            for (const ch of line) {
                if (ch === '{') depth++;
                else if (ch === '}') depth--;
            }
            // ...
        }
    }
    return globals;
}
```
→ `css-usage-report.js` übernimmt dasselbe Idiom (textbasiert, kein echter Parser, Zeile-für-Zeile
mit Zustand) für: Wort-Token-Erkennung von CSS-Klassen (Stufe 1, D-21), Präfix-Erkennung nur aus
`class="…"`/`className =`/`classList.*`-Kontexten (Stufe 2), und Anker-Regel für Verbundselektoren
(Stufe 3). Kommentar-Entfernung vor dem Zählen ist Pflicht — dafür `withoutComments()` aus
`tests/unit/design-consistency.test.js` wiederverwenden (kein zweiter Regex-Comment-Stripper).

**Ausgabe-Erzeugung** (Z. 217-231):
```javascript
function renderGlobalsArtifact(globalsObject) {
    const sortedKeys = Object.keys(globalsObject).sort();
    const lines = sortedKeys.map(key => {
        const access = globalsObject[key] === 'writable' ? 'writable' : 'readonly';
        return `    ${JSON.stringify(key)}: '${access}'`;
    });
    return (
        '// AUTOMATISCH ERZEUGT — NICHT VON HAND BEARBEITEN.\n' +
        `// Regenerieren mit: ${REGEN_COMMAND}\n` +
        ...
    );
}
```
→ Für `css-usage-report.js` ist laut RESEARCH (Open Question 1) eine Konsolen-Tabellenausgabe
ausreichend (kein eingechecktes Artefakt wie bei `eslint.generated-globals.js` nötig) — aber der
`module.exports`-Vertrag (Funktionen einzeln exportiert, damit ein Jest-Test denselben Code
ausführen kann) sollte übernommen werden, falls eine spätere Ratsche (`DMS_UNSTYLED_MAX` o. ä.)
das Werkzeug direkt aufrufen will, statt eine eigene Zählung zu duplizieren.

**Direktaufruf-Zweig (CLI-Einstieg)** (Z. 234-244):
```javascript
module.exports = {
    extractModulesFromLoader,
    generateGlobalsFromModules,
    renderGlobalsArtifact,
    hasUncapturedTopLevelBinding
};

if (require.main === module) {
    const globals = generateGlobalsFromModules();
    const content = renderGlobalsArtifact(globals);
    fs.writeFileSync(OUTPUT_PATH, content, 'utf8');
    console.log(`${Object.keys(globals).length} Namen nach eslint.generated-globals.js geschrieben.`);
}
```
→ Identisches Muster für `css-usage-report.js`: alle Kernfunktionen benannt exportieren (Testbarkeit),
`if (require.main === module)` als CLI-Zweig, Ergebnis auf `stdout` in Tabellenform statt in eine
Datei geschrieben (kein `writeFileSync` nötig, da kein eingechecktes Artefakt verlangt ist — D-20
verlangt nur "gibt aus", nicht "schreibt Datei"). Kein Eintrag in `package.json` unter einem
`npm run …`-Skript ist durch CONTEXT.md vorgeschrieben, aber das Vorbild (`"globals:generate": "node
tools/generate-eslint-globals.js"`, `package.json:26`) legt nahe, analog `"css-usage:report": "node
tools/css-usage-report.js"` zu ergänzen, damit der Aufruf dokumentiert und wiederholbar ist.

**Fehlerbehandlung:** Der Generator wirft bei nicht erfassbaren Mustern einen `throw new Error(...)`
mit Datei:Zeile und Handlungsanweisung (Z. 113-125) statt still falsch zu zählen — dasselbe Prinzip
gilt für `css-usage-report.js`: mehrdeutige Selektoren (Verbundselektoren, Stufe 3) müssen laut,
nicht still behandelt werden.

---

### Neuer Playwright-Spec für FIX-01/02/03 (E2E, request-response)

**Analog 1 (Grundgerüst/Setup):** `tests/e2e/features/npc-generator.spec.js` (komplett gelesen)

**Imports und URL-Konstante** (Z. 1-13):
```javascript
import { test, expect } from '@playwright/test';

// App-URL über file:// (Projekt-Konvention, analog bestiary.spec.js) — kein Dev-Server nötig
const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

test.describe('WELT-02: NPC-Generator', () => {
    test('Generator-Button ist im NPC-Tab sichtbar', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('npcs'));
        await expect(page.locator('[data-action="show-npc-generator"]')).toBeVisible();
    });
```
→ Hinweis: `playwright.config.js` setzt bereits `use.baseURL` auf `dist/dnd-tracker-bundled.html`
(gebautes Bündel) — der neue Spec kann entweder `page.goto('/')` relativ zur `baseURL` nutzen oder,
wie hier gezeigt, die explizite `APP_URL`-Konstante kopieren (Projektkonvention laut Kommentar).
Beides läuft gegen das **gebaute** Bündel, wie von D-17 gefordert ("Abnahme am gebauten Bündel").

**`getComputedStyle`-Zugriff** (Z. 118-123):
```javascript
const pos = await page.evaluate(() => {
    const el = document.getElementById('npc-generator-modal');
    return el ? getComputedStyle(el).position : '';
});
expect(pos).toBe('fixed');
```
→ Direktes Vorbild für D-17: für FIX-01 auf `.dms-terrain-item`/`.dms-skill-header.str` z. B.
`getComputedStyle(el).padding`/`.backgroundColor`; für FIX-02 auf `.slot-pip` (nach dem Umbau)
`getComputedStyle(el).width` > 0; für FIX-03 auf `#dice-hero-result` nach einem Wurf `.color`
bzw. `.fontSize`.

**Analog 2 (fachliche Domäne Würfel):** `tests/e2e/features/dice.spec.js`

**Wurf-Auslösung und Ergebnis-Locator** (Z. 10-30, Muster über alle Würfel-Tests wiederholt):
```javascript
test.describe('Würfel-System', () => {
    test.describe('Standard-Würfel', () => {
        test('D20 kann geworfen werden', async ({ page }) => {
            // ... goto, switchView('dice') o. ä., Klick auf D20-Button ...
            const result = page.locator('#dice-hero-result, .dice-result');
            // ... expect auf sichtbaren Text/Zahl ...
        });
```
→ FIX-03-Test folgt demselben Locator (`#dice-hero-result`) und prüft zusätzlich nach einem
Crit-Wurf (`data-force-crit` o. ä., falls Testhook vorhanden, sonst wiederholtes Würfeln bis Crit)
`getComputedStyle('#dice-hero-result').color` gegen `var(--green)`-Auflösung — NICHT gegen
`#dice-hero` (Container), das ist genau der Bug, den FIX-03 behebt.

**Klick + Zustandsänderung (FIX-02-Vorbild):** `page.click(...)` gefolgt von einem zweiten
`page.evaluate`, das den persistierten Zustand liest (Musterbeispiel `import-security.spec.js`
oder `npc-generator.spec.js` Zeile ~44-52, wo `window.NPC_DEFAULT_TABLES` direkt gelesen wird) —
für FIX-02 analog `window.D.characters[...].spellSlots[...].current` nach dem Klick auf ein
`.slot-pip`-Element lesen, um "Zustand persistiert" (D-15) zu beweisen, nicht nur den Klick selbst.

---

### Neue Ratschen in `tests/unit/design-consistency.test.js`

**Analog:** dieselbe Datei — bestehende Ratschen `DUBLETTEN_MAX`/`IMPORTANT_MAX` (Kommentarblock
und Test, Z. ~270-298) und `INLINE_MAX` (Z. ~933-949), beide vollständig gelesen.

**Kommentarformat mit Zählart und Aufschlüsselung** (Z. 933-940, `F-19`):
```javascript
describe('F-19 — Inline-Stile (Ratsche)', () => {
    // Stand nach der Umstellung, am 2026-09-07 erhoben. Diese Zahl darf nur
    // SINKEN. Sie ist bewusst nicht 0:
    //   25 x display:none  — 102 JS-Stellen schalten style.display; eine
    //                        Klasse daraus zu machen hiesse, jede anzufassen
    //   36 x Farbfeld      — die Marker-Swatches der Editorleiste zeigen ihre
    //                        eigene Farbe und stehen im eingefrorenen Testnetz
    //   Rest               — Einzelfaelle; ein Stil, der genau einmal vorkommt,
    //                        ist in einer Klasse nicht besser aufgehoben
    const INLINE_MAX = 257;

    test('die Zahl der Inline-Stile im Markup steigt nicht wieder', () => {
        const n = tplFiles.reduce(
            (sum, f) => sum + (f.content.match(/style="/g) || []).length,
            0
        );
        expect(n).toBeLessThanOrEqual(INLINE_MAX);
    });
});
```
→ Exaktes Formvorbild für `DMS_UNSTYLED_MAX` (D-17) und die `prefers-reduced-motion`-Rückbau-
Ratsche (D-19): Kommentar mit Datum, Richtungssatz ("darf nur SINKEN"), Zählart benannt
(hier: Vorkommen `style="` in Template-Dateien), Aufschlüsselung der Restmenge, dann eine
`const …MAX = N` unmittelbar davor, dann ein einzelner `test(...)`-Block mit `toBeLessThanOrEqual`.

**Zählung mit `class`-Attribut-Filter (Musterbedarf für `DMS_UNSTYLED_MAX`)** — kein 1:1-Analog
in der Datei vorhanden, aber `declarationsOf()` (Z. 449-457) zeigt das Muster "Regex über
kommentarfreies CSS, Filterung auf einen Kontext":
```javascript
function declarationsOf(prop, { includeVariables = false } = {}) {
    const scope = includeVariables
        ? cssCode
        : withoutComments(
              cssFiles.filter(f => f.name !== 'variables.css').map(f => f.content).join('\n')
          );
    return [...scope.matchAll(new RegExp(`${prop}\\s*:([^;{}]*)`, 'g'))].map(m => m[1].trim());
}
```
→ `DMS_UNSTYLED_MAX` muss zusätzlich über die **Template-/JS-Dateien** (nicht CSS) laufen und
gezielt `class="..."`-Attribute parsen (D-17 warnt: ohne Filter zählt dieselbe Suche 32 statt 15,
weil `data-action`-Werte/IDs mitgezählt würden) — Vorbild für den Kontext-Filter selbst ist die in
`tools/generate-eslint-globals.js` beschriebene Präfix-Erkennung "ausschließlich aus
Klassen-Kontexten (`class="…"`, `className =`, `classList.*`)" (D-21, dort für die Löschlauf-Welle
formuliert, dasselbe Prinzip gilt hier).

**`fonts.css`-Ausschluss in `declarationsOf()` (D-42, Vorarbeit)** — direkt an der oben zitierten
Funktion zu ergänzen: analog zum bestehenden `f.name !== 'variables.css'`-Filter einen zweiten
Dateinamen ausschließen, ohne die Funktionssignatur zu ändern (Rückwärtskompatibilität für alle
bestehenden 64 Aufrufer).

---

### `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md`

**Analog:** `.planning/milestones/v1.2-phases/14-tests-gates/14-GATE-BASELINE.md` (481 Zeilen,
Kopf und erster Messblock vollständig gelesen)

**Kopf-/Metadatenblock:**
```markdown
# Phase 14 Plan 01 — Gate-Baseline-Messprotokoll

**Datum:** 2026-09-07
**Node-Version:** siehe `node --version` zum Messzeitpunkt (v24.x, wie in `13-PERF-MEASUREMENT.md`)
**Voraussetzung:** Task 1 dieses Plans (D-07, ...) ist zum Messzeitpunkt bereits committet — alle
Zahlen unten sind der Stand **nach** D-07, nicht davor.

> Diese Datei ist die eingecheckte Grundlage, auf die die Ratschen der Pläne ... gepinnt werden.
> Jede Zahl unten wurde in dieser Sitzung frisch gegen den Live-Baum erhoben — keine Zahl aus
> `14-CONTEXT.md` oder `14-RESEARCH.md` wurde übernommen. Wo sie abweichen, stehen beide Werte
> nebeneinander und diese Messung ist die maßgebliche.
```
→ `15-RATCHET-BASELINE.md` übernimmt Titel-Schema (`# Phase 15 Plan NN — ...`), Datumszeile,
Voraussetzungszeile (hier: "nach dem letzten Löschcommit, vor dem `15-RATCHET-BASELINE.md`-Commit
selbst", D-26: "letzter Plan-Schritt"), und den Blockquote-Hinweis auf Nicht-Übernahme kolportierter
Zahlen (direkt einschlägig wegen D-20/A1: 438/607/~3.174 sind explizit NICHT zu übernehmen).

**Messblock-Struktur (Befehl → Tabelle → Aufschlüsselung → Interpretation):**
```markdown
## Messblock 1 — Lint-Reststand nach D-07

**Befehl:** `npx eslint . --format json` (Ausgabe in eine temporäre, nicht eingecheckte Datei
umgeleitet und ausgewertet)

| Kennzahl | Wert |
|---|---|
| Gesamtfehler | **0** |
| Gesamtwarnungen | **2196** |
...

**Interpretation:** Der rote Fehler aus Task 1 ist weg — `npx eslint .` läuft mit Exit 0. ...
```
→ `15-RATCHET-BASELINE.md` bekommt je DEAD-03-Basisgröße (tote Klassen, tote Blöcke, Zeilen,
`prefers-reduced-motion`-Vorkommen) einen eigenen `## Messblock N` mit demselben Vierklang
(Befehl/Tabelle/Aufschlüsselung/Interpretation). Der Befehl ist hier `node tools/css-usage-
report.js` statt `npx eslint`, sonst identisches Schema.

**Nachtrag-Muster (Ratsche "gepinnt", nach einem späteren Task erneut gemessen):**
```markdown
### Nachtrag (Plan 14-06, Task 3) — Ratsche gepinnt

**Datum:** 2026-09-07 (nach Task 1/2 von Plan 14-06: ...)
**Befehl:** ...
| Kennzahl | Wert |
...
`package.json`s `lint`-Skript ist auf `... 367` gepinnt. Beidseitig geprüft:
`npm run lint` → Exit 0; `npx eslint . --max-warnings 366` → Exit 1.
```
→ Direktes Vorbild für D-49 ("beidseitig bewiesen"): jede neue Ratsche in `15-RATCHET-BASELINE.md`
bekommt einen "Nachtrag"-Abschnitt mit dem roten und dem grünen Exit-Code-Beweis, nicht nur dem
finalen grünen Zustand.

---

### `features/party/party-render.js` `renderCompactSpellSlots()` (FIX-02)

**Analog:** `systems/spellslots/spellslots-ui.js` `renderSpellSlotPips()` (Z. 59-90, komplett
gelesen) — dieselbe fachliche Funktion (Zauberplatz-Pips rendern), im Initiative-Kontext bereits
korrekt und handler-kompatibel implementiert.

**Vorher (party-render.js, zu ersetzender Rumpf, Z. 316-336):**
```javascript
function renderCompactSpellSlots(ch) {
    // ...
    let html = '<div class="char-card-slots">';
    for (let level = 0; level <= 9; level++) {
        // ...
        for (let i = 0; i < max; i++) {
            const isAvailable = i < available;
            html += `<span class="char-slot-pip ${isAvailable ? 'available' : ''}"
                data-action="toggle-spell-slot-stop"
                data-char="${ch.id}"
                data-level="${level}"
                data-index="${i}"
                title="${isAvailable ? 'Verfügbar' : 'Verbraucht'}"></span>`;
        }
        html += '</div>';
    }
    html += '</div>';
    return html;
}
```

**Zielmuster (Analog, `spellslots-ui.js:78-90`):**
```javascript
for (let level = 1; level <= 9; level++) {
    const slot = slots[level];
    if (slot && slot.max > 0) {
        hasSlots = true;
        html += `<span style="margin-right: 8px; display: inline-flex; align-items: center;">`;
        html += `<span style="font-size: 10px; color: var(--text-dim); margin-right: 2px;">${level}:</span>`;
        for (let i = 0; i < slot.max; i++) {
            const filled = i < slot.current;
            html += `<span class="slot-pip ${filled ? 'filled' : ''}" data-action="toggle-spell-slot-stop" data-id="${charId}" data-value="${level}" title="Grad ${level} Slot ${filled ? '(verfügbar)' : '(verbraucht)'}"></span>`;
        }
        html += `</span>`;
    }
}
// ...
return hasSlots
    ? `<div class="spell-slots-compact" data-stop-propagation="true">${html}</div>`
    : '';
```
Kernänderung laut D-14: Attributnamen wechseln von `data-char`/`data-level`/`data-index` auf
`data-id`/`data-value` (genau die Namen, die `ui/event-delegation.js:94-97` liest), Klasse von
`char-slot-pip`/`available` auf `slot-pip`/`filled`, Container-Klasse von `char-card-slots` auf
`spell-slots-compact` (D-15: Erfolgskriterium prüft `.spell-slots-compact .slot-pip`). Funktions-
name `renderCompactSpellSlots` bleibt unverändert (D-14 — kein Effekt auf
`eslint.generated-globals.js`).

**Handler-Vertrag, den das neue Markup erfüllen muss** (`ui/event-delegation.js:94-97`,
unverändert, nur zur Verifikation gelesen):
```javascript
const action = target.dataset.action;
const id = target.dataset.id ? parseEntityId(target.dataset.id) : null;
const type = target.dataset.type || null;
const value = target.dataset.value || null;
```

**Gestylter Ziel-Selektor** (`assets/styles/dashboard.css:1310-1340`, bereits vorhanden, KEINE
neue CSS-Regel nötig):
```css
.spell-slots-compact {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
    margin-top: 4px;
}

.slot-pip {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--bg-dark);
    border: 2px solid var(--cyan);
    cursor: pointer;
    font-size: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
    transition: all 0.2s;
}

.slot-pip.filled {
    background: var(--cyan);
    color: var(--bg-dark);
}

.slot-pip:hover {
    transform: scale(1.2);
}
```

---

### `features/dice/dice-core.js` (FIX-03)

**Analog (funktionierendes Vorbild im selben Modul):** das Floating-Dice-Panel-Pendant
`.fdp-number.crit`/`.fail` (`assets/styles/dice.css:677-693`, bereits gelesen laut RESEARCH).

**Bug-Zeile (vor dem Fix, `dice-core.js:345`):**
```javascript
heroResult.className = '';                 // nimmt .dice-hero-result komplett weg
// ...
heroContainer.classList.remove('crit', 'fail');
if (/* crit */) {
    heroContainer.classList.add('crit');    // landet auf dem CONTAINER, nicht auf heroResult
    createConfetti(heroContainer);
} else if (/* fail */) {
    heroContainer.classList.add('fail');
}
```

**Ziel-Fix (D-16):** `heroResult.className = 'dice-hero-result'` statt `''`; die `crit`/`fail`-
`classList`-Aufrufe wandern von `heroContainer` auf `heroResult`; `createConfetti(heroContainer)`
bleibt unverändert auf dem Container (nicht Teil des Bugs).

**CSS, das dadurch erstmals greift (bereits vorhanden, unverändert, `assets/styles/dice.css:21-37`):**
```css
.dice-hero-result {
    font-size: 5em;
    font-weight: 700;
    color: var(--gold);
    line-height: 1;
    transition: all 0.3s;
}
.dice-hero-result.crit { color: var(--green); text-shadow: 0 0 20px rgba(74,222,128,0.5); }
.dice-hero-result.fail { color: var(--red); text-shadow: 0 0 20px rgba(239,68,68,0.5); }
```

---

### DM-Screen-Widget-CSS (FIX-01) — Terrain/Fertigkeiten/Wissensgebiete

**Analog:** bestehendes, bereits korrekt funktionierendes Widget-CSS-Muster in derselben Datei
(`assets/styles/dmscreen.css`), z. B. das Attribut-/Rettungswurf-Widget mit `var(--attr-*)`.

**Bug-Muster (Terrain, bestätigt in RESEARCH):**
```html
<!-- features/dmscreen/dmscreen-widgets-combat.js:136-147 (Renderer, UNVERÄNDERT laut D-09) -->
<div class="dms-terrain-list">
    <div class="dms-terrain-item normal">
        <span class="dms-terrain-type">Normal</span>
        <span class="dms-terrain-effect">Keine Einschränkung</span>
    </div>
</div>
```
```css
/* assets/styles/dmscreen.css:2832-2874 (bestehend, erwartet andere Klassen) */
.dms-terrain-sections { ... }
.dms-terrain-section { ... }
.dms-terrain-title { ... }
/* Keine Regel für .dms-terrain-list, .dms-terrain-item, .dms-terrain-type, .dms-terrain-effect */
```
→ Reparatur: CSS-Selektoren auf die tatsächlichen JS-Klassennamen umschreiben (D-09: CSS folgt
JS, niemals umgekehrt — das Snapshot-Netz `tests/unit/__snapshots__/dmscreen-characterization.
test.js.snap` friert das Markup ein).

**Skill-Header-Farbmechanik (D-13) — Zielmuster `color-mix` statt hartkodiertem `rgba`:**
```css
/* Ziel-Schema je Attributrolle (str/dex/int/wis/cha — NICHT con, siehe Pitfall 4) */
.dms-skill-header.str {
    background: color-mix(in srgb, var(--attr-str) 20%, transparent);
    color: var(--attr-str);
}
```
Ersetzt die fünf hartkodierten `rgba(...)`-Hintergründe und `var(--red|green|blue|purple|pink)`-
Schriftfarben in `dmscreen.css:2490-2494`. Klassenname im CSS muss auf `.dms-skill-header` lauten
(nicht `.dms-skill-group-header` — die im RESEARCH bestätigte Namensdivergenz).

## Shared Patterns

### Node-CLI-Tool ohne Abhängigkeiten (Build-Zeit-Analyse)
**Quelle:** `tools/generate-eslint-globals.js` (komplett)
**Anzuwenden auf:** `tools/css-usage-report.js`
```javascript
'use strict';
const fs = require('fs');
const path = require('path');
const REPO_ROOT = path.resolve(__dirname, '..');
// ... benannte Funktionen, alle über module.exports testbar ...
module.exports = { /* ... */ };
if (require.main === module) {
    // CLI-Ausgabe, kein Seiteneffekt außerhalb console.log (oder Datei, falls gefordert)
}
```

### Quellbaum-Verzeichnisrekursion (JS-Geltungsbereich)
**Quelle:** `tests/unit/design-consistency.test.js:281-297`, Funktion `sourceJs()`
**Anzuwenden auf:** jeden neuen Task, der GATE-04-Geltungsbereich braucht, und optional
`css-usage-report.js`, falls es auch JS/Templates nach Klassennutzung durchsuchen muss (Stufe 2/3
der Lebend-Erkennung, D-21):
```javascript
function sourceJs() {
    const out = [];
    const walk = dir => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) walk(full);
            else if (e.name.endsWith('.js')) out.push({ name: full, content: fs.readFileSync(full, 'utf8') });
        }
    };
    ['features', 'systems', 'ui', 'core', 'render', 'utils'].forEach(d => {
        const abs = path.join(REPO, d);
        if (fs.existsSync(abs)) walk(abs);
    });
    return out;
}
```
**Wichtig:** Dieser Scope schließt `tools/`, `tests/`, `assets/templates/` NICHT ein — für die
Präfix-Erkennung aus `class="..."`-Kontexten in Templates (D-21) muss zusätzlich `tplFiles`
(bereits andernorts in `design-consistency.test.js` definiert, liest `assets/templates/*.html`)
herangezogen werden.

### CSS-Kommentare vor dem Zählen entfernen
**Quelle:** `tests/unit/design-consistency.test.js:29-32`, Funktion `withoutComments()`
**Anzuwenden auf:** `tools/css-usage-report.js` (D-21 verlangt kommentarbereinigtes Zählen) und
jede neue Ratsche in `design-consistency.test.js` selbst — niemals einen zweiten
Comment-Stripper schreiben.
```javascript
function withoutComments(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
}
```

### Ratschen-Kommentarformat (Zählart, Datum, Richtungssatz)
**Quelle:** `tests/unit/design-consistency.test.js` F-19 (`INLINE_MAX`) und der `DUBLETTEN_MAX`/
`IMPORTANT_MAX`-Block
**Anzuwenden auf:** jede neue Ratsche dieser Phase (`DMS_UNSTYLED_MAX`,
`prefers-reduced-motion`-Rückbau-Ratsche)
```javascript
// Stand nach <Ereignis>, am <Datum> erhoben. Diese Zahl darf nur SINKEN.
// <Aufschlüsselung des Restbestands, mit Zählart benannt>
const X_MAX = N;

test('<Beschreibung>', () => {
    const n = /* dieselbe Zählmethode wie beim Erheben */;
    expect(n).toBeLessThanOrEqual(X_MAX);
});
```

### Playwright gegen das gebaute Bündel (`dist/`)
**Quelle:** `playwright.config.js` (`use.baseURL`) + `tests/e2e/features/npc-generator.spec.js`
(`APP_URL`-Konstante)
**Anzuwenden auf:** neuer FIX-01/02/03-Spec — läuft automatisch gegen `dist/dnd-tracker-
bundled.html`, kein Dev-Server nötig; `page.evaluate(() => window.switchView('...'))` ist der
Standardweg, um vor jedem Test in den richtigen Tab zu wechseln.

## No Analog Found

| Datei | Rolle | Datenfluss | Grund |
|---|---|---|---|
| — | — | — | Für alle acht identifizierten Dateien wurde ein tragfähiges Analog im Quellbaum gefunden. Reine Prosa-/Dokumentationsänderungen (`PROJECT.md`, `ROADMAP.md`, `Anpassungen/.../BEFUNDE-v2.md` etc.) sind kein Code und werden hier bewusst nicht als "kein Analog" geführt — sie folgen dem in D-01/D-05/D-33 bereits im CONTEXT.md festgelegten Format (v1.2-Übertragstabelle als Vorbild für D-33). |

## Metadata

**Analog-Suchbereich:** `tools/`, `tests/e2e/features/`, `tests/unit/design-consistency.test.js`,
`.planning/milestones/v1.2-phases/14-tests-gates/`, `assets/styles/dashboard.css`,
`systems/spellslots/spellslots-ui.js`, `features/party/party-render.js`,
`features/dice/dice-core.js`, `assets/styles/dice.css`, `ui/event-delegation.js`,
`playwright.config.js`
**Geprüfte Dateien:** ~15 direkt gelesen/gegrept
**Erhebungsdatum:** 2026-09-08
