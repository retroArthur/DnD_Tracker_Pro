# Phase 9: Editor-Regressionsnetz & execCommand-Ablösung - Pattern Map

**Mapped:** 2026-07-25
**Files analyzed:** 3 (1 neu, 2 zu modifizieren)
**Analogs found:** 3 / 3

## File Classification

| Neue/geänderte Datei | Rolle | Datenfluss | Nächster Analog | Match-Qualität |
|---|---|---|---|---|
| `tests/e2e/features/editor-formatting.spec.js` (NEU) | test (e2e) | request-response (UI-Interaktion → DOM-Assertion) + batch (Persistenz-Roundtrip) | `tests/e2e/features/wiki.spec.js` | exact (gleicher Editor, gleiches App-Boot-/Navigations-Muster) |
| `ui/editors/rich-text.js` (geändert: 21 execCommand-Call-Sites) | utility / DOM-manipulation (kein Controller/Service im klassischen Sinn) | transform (DOM-Selektion → DOM-Mutation, kein Server-Roundtrip) | `ui/editors/rich-text.js:817-935` (`applyFloatingFormat`/`applyFloatingHighlight`, bereits execCommand-frei, selbe Datei) | exact (Referenzimplementierung liegt in derselben Datei, keine externe Analog-Suche nötig) |
| `core/constants.js` (ggf. Wiederherstellung `EDITOR_FONTS`/`TOOLBAR_DIMENSIONS`, abhängig von Pitfall-1-Klärung) | config | — (statische Konstante) | `core/constants.js` bestehende Namespaces `DND_RULES`/`UI_CONSTANTS` | role-match |

**Hinweis zur Analog-Suche:** Diese Phase erzeugt praktisch keine neue Architektur — sie migriert eine bestehende Datei (`rich-text.js`) intern auf ein bereits in derselben Datei produktiv laufendes Muster. Die einzige wirklich "neue Datei" ist der Testspec. Eine Suche nach Controller/Service/Component-Analogs im übrigen Codebase ist für diese Phase nicht zielführend (Non-ESM, keine Schichtenarchitektur) — die relevanten Analoge sind ausschließlich (a) der bestehende Test-Spec-Stil und (b) der bestehende Selection/Range-Code in derselben Datei.

## Pattern Assignments

### `tests/e2e/features/editor-formatting.spec.js` (test, e2e)

**Analog:** `tests/e2e/features/wiki.spec.js` (App-Boot/Navigation) + `tests/e2e/helpers/test-utils.js` (Helper)

**Imports- und Boot-Pattern** (`wiki.spec.js:1-21`):
```javascript
// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Wiki System', () => {
    test.beforeEach(async ({ page }) => {
        const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
        await page.goto(filePath);
        await page.waitForSelector('.app-title', { timeout: 10000 });
        await page.evaluate(() => window.switchView('wiki'));
        await page.waitForSelector('#view-wiki', { state: 'visible' });
    });
```
Alternativ zentraler Helper (`tests/e2e/helpers/test-utils.js:11-38`, bevorzugt statt eigenem Boot-Code):
```javascript
export async function loadApp(page) { /* … navigiert zu dist/dnd-tracker-bundled.html, wartet auf .app-title */ }
export async function navigateToTab(page, tabName) { /* … klickt .nav-tab[data-view], öffnet ggf. .nav-group */ }
```
**Wichtig:** `loadApp`/`navigateToTab` nutzen intern `page.waitForTimeout(...)` (Zeilen 16, 33, 37) — das widerspricht der in D-03/CONTEXT.md fortgeltenden Regel "keine `waitForTimeout` in neuen Specs". Diese Helper dürfen als Setup-Vehikel importiert werden (Timeout steckt im Helper, nicht im neuen Testkörper), aber alle NEUEN Wait-Bedingungen im Spec selbst müssen `waitForSelector`/`waitForFunction` nutzen, nicht `waitForTimeout`.

**KEIN Analog-Muster (Anti-Pattern, nicht kopieren):** Der bestehende „Wiki Editor Formatierung"-Block (`wiki.spec.js:299-356`) nutzt weiche Guards ohne Assertion:
```javascript
// NICHT als Vorlage verwenden — Pitfall 2 aus RESEARCH.md
if (await boldBtn.isVisible()) {
    await boldBtn.click();
}
// kein expect() danach — Test ist immer grün, beweist nichts
```
Für D-04a-taugliche Baseline-Tests stattdessen harte, deterministische Markup-Assertionen einsetzen, z. B.:
```javascript
const editor = page.locator('#wiki-content');
await editor.click();
await page.keyboard.type('Testtext');
await editor.selectText(); // oder gezielte Range-Selektion via page.evaluate als Setup-Vehikel
await page.locator('.editor-toolbar [data-editor="bold"]').click();
await expect(editor).toHaveJSProperty('innerHTML', '<b>Testtext</b>');
// Persistenz-Roundtrip (D-03):
await page.click('[data-action="call"][data-value="saveWikiEntry"]');
await page.reload();
await page.evaluate(() => window.switchView('wiki'));
// Eintrag erneut öffnen, Markup erneut prüfen
```

**Rich-Text-Helper aus `test-utils.js`** (Zeilen 290-303, als Bausteine, nicht als Ersatz für echte Toolbar-Klicks — D-06/Maskierungs-Kriterium erlaubt sie nur als Setup, nicht als Ersatz des geprüften Pfads):
```javascript
export async function getRichTextContent(page, selector) {
    return await page.locator(selector).innerHTML();
}
export async function setRichTextContent(page, selector, content) {
    await page.locator(selector).fill('');
    await page.locator(selector).pressSequentially(content);
}
```

**Toter-Code-Testpfad (heading/highlight in `formatText()`, Pitfall 3):** kein UI-Selektor verfügbar — direkter Funktionsaufruf als legitimes Setup-Vehikel (Maskierungs-Kriterium erlaubt `page.evaluate`, wenn kein UI-Pfad existiert):
```javascript
await page.evaluate(() => window.formatText('wiki-content', 'heading'));
const html = await page.locator('#wiki-content').innerHTML();
expect(html).toContain('<h4>');
```

---

### `ui/editors/rich-text.js` (utility, transform — Migrationsziel für 21 Call-Sites)

**Analog:** dieselbe Datei, bereits produktive Selection/Range-Implementierung der floating Toolbar

**Core-Pattern — Inline-Format-Toggle mit Fallback** (`rich-text.js:817-861`, `applyFloatingFormat`, als Vorlage für die Migration von `formatText()`s bold/italic/underline/strikethrough):
```javascript
const tagMap = { bold: 'b', italic: 'i', underline: 'u', strikethrough: 's' };
if (tagMap[action]) {
    const tag = tagMap[action];
    const parentTag = range.commonAncestorContainer.parentElement?.closest(tag);
    if (parentTag && parentTag.closest('.rich-editor, .spell-editor, .dialog-text')) {
        const parent = parentTag.parentNode;
        while (parentTag.firstChild) parent.insertBefore(parentTag.firstChild, parentTag);
        parent.removeChild(parentTag);
    } else {
        const wrapper = document.createElement(tag);
        try {
            range.surroundContents(wrapper);
        } catch (e) {
            const fragment = range.extractContents();
            wrapper.appendChild(fragment);
            range.insertNode(wrapper);
        }
    }
}
```
**Kritische Abweichung bei Migration von `formatText()` (statische Toolbar), nicht 1:1 aus obigem Snippet übernehmen:** `execCommand('strikeThrough')` erzeugt in Chromium `<strike>`, nicht `<s>` (Pitfall 5). Beim Migrieren der `formatText()`-strikethrough-Branch `tag = 'strike'` verwenden, NICHT `'s'` (das oben gezeigte `tagMap.strikethrough = 's'` gilt nur für die floating Toolbar und ist eine vorbestehende, nicht zu bereinigende Inkonsistenz laut D-02).

**Zielfunktion vor Migration** (`rich-text.js:324-349`, `formatText()` — hier werden die execCommand-Aufrufe ersetzt):
```javascript
function formatText(elementId, format, value) {
    const editor = $(elementId);
    if (!editor) return;
    editor.focus();
    if (format === 'bold') {
        document.execCommand('bold', false, undefined); // → Pattern 1 (tag='b')
    } else if (format === 'italic') {
        document.execCommand('italic', false, undefined); // → Pattern 1 (tag='i')
    } else if (format === 'underline') {
        document.execCommand('underline', false, undefined); // → Pattern 1 (tag='u')
    } else if (format === 'strikethrough') {
        document.execCommand('strikeThrough', false, undefined); // → Pattern 1 (tag='strike', NICHT 's')
    } else if (format === 'list') {
        document.execCommand('insertUnorderedList', false, undefined); // eigenes Muster nötig, kein direktes Analog in applyFloatingFormat
    }
    // … heading/font/highlight-Branches: teils toter Code (Pitfall 3), s. RESEARCH.md
}
```

**Font/Größe-Pattern** (`rich-text.js:350-399`, `setEditorFont`/`setEditorFontSize` — Migrationsziel, Attribut-Wrapper statt execCommand-Wert):
```javascript
// Ersatzmuster (aus RESEARCH.md Pattern 2, konsistent mit obigem Try/Catch-Stil):
const wrapper = document.createElement('font');
wrapper.setAttribute('face', value); // fontName
// bzw. wrapper.style.fontSize = select.value; // fontSize — ersetzt den size="7"-Zwischenschritt komplett
try {
    range.surroundContents(wrapper);
} catch (e) {
    const fragment = range.extractContents();
    wrapper.appendChild(fragment);
    range.insertNode(wrapper);
}
```
Bestehender `editorSelectSavedRange`-Restore-Mechanismus (Zeilen 364-370, 386-392) bleibt unverändert — nur der `execCommand(...)`-Aufruf selbst wird ersetzt.

**Fehlerbehandlung/Guard-Pattern** (durchgängig in der Datei, z. B. Zeile 325-326):
```javascript
const editor = $(elementId);
if (!editor) return;
editor.focus();
```
Dieses frühe-Return-Guard-Muster gilt für jede migrierte Funktion — kein try/catch um den ganzen Funktionskörper, nur gezielt um `range.surroundContents()` (siehe oben).

**insertHTML-Ersatz** (Paste-Handler + `insertTable()`, Zeilen 615/637/674 — RESEARCH.md Pattern 3, kein bestehendes Analog in derselben Datei, daher Research-Code direkt übernehmen):
```javascript
const range = window.getSelection().getRangeAt(0);
range.deleteContents();
const fragment = range.createContextualFragment(htmlString);
const lastNode = fragment.lastChild;
range.insertNode(fragment);
if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}
```

**insertText/insertLineBreak-Ersatz** (Zeilen 574/642 — RESEARCH.md Pattern 4):
```javascript
const range = window.getSelection().getRangeAt(0);
range.deleteContents();
const textNode = document.createTextNode(text);
range.insertNode(textNode);
range.setStartAfter(textNode);
range.collapse(true);
```

---

### `core/constants.js` (config — nur bei Bestätigung von Pitfall 1)

**Analog:** bestehende Namespace-Struktur derselben Datei (`DND_RULES`/`UI_CONSTANTS`, Zeilen 554-560)

Kein Codebeispiel nötig, solange Pitfall 1 nicht als Blocker bestätigt ist — falls doch: `EDITOR_FONTS`/`TOOLBAR_DIMENSIONS` analog zu bestehenden Konstanten-Objekten unter `UI_CONSTANTS` einhängen, gemäß demselben Namespace-Muster wie `UI_TIMING`, `MARKDOWN_PATTERNS` etc.

## Shared Patterns

### Try/Catch-Fallback für `Range.surroundContents()`
**Quelle:** `ui/editors/rich-text.js:829-836` (`applyFloatingFormat`)
**Gilt für:** Jede der Migrationsgruppen, die `<b>`/`<i>`/`<u>`/`<strike>`/`<font>`-Wrapper erzeugt (Inline-Formate, Fonts/Größen)
```javascript
try {
    range.surroundContents(wrapper);
} catch (e) {
    const fragment = range.extractContents();
    wrapper.appendChild(fragment);
    range.insertNode(wrapper);
}
```

### Editor-Guard-Pattern
**Quelle:** durchgängig in `rich-text.js`, z. B. Zeile 325-327
**Gilt für:** jede migrierte Funktion in `rich-text.js`
```javascript
const editor = $(elementId);
if (!editor) return;
editor.focus();
```

### E2E-Boot/Navigation
**Quelle:** `tests/e2e/helpers/test-utils.js:11-38` (`loadApp`, `navigateToTab`)
**Gilt für:** `editor-formatting.spec.js` gesamt (Referenz-Editor Wiki + alle Smoke-Tests für NPCs/Orte/Quests/Sessions/Quick-Ref)
```javascript
await loadApp(page);
await navigateToTab(page, 'wiki'); // bzw. 'npcs', 'locations', 'quests', 'sessions'
```

### Harte Markup-Assertion statt weicher Sichtbarkeits-Guards
**Quelle:** Anti-Pattern-Fund in `wiki.spec.js:299-356` (NICHT kopieren, siehe Pitfall 2)
**Gilt für:** alle neuen Tests in `editor-formatting.spec.js`
```javascript
// Statt: if (await btn.isVisible()) { await btn.click(); }
await expect(btn).toBeVisible();
await btn.click();
await expect(editor).toHaveJSProperty('innerHTML', '<erwartetes exaktes Markup>');
```

### Kein `waitForTimeout` in neuem Testcode
**Quelle:** Phase-8-Testregel, fortgeltend (09-CONTEXT.md §„Fortgeltende Testregeln")
**Gilt für:** `editor-formatting.spec.js` — `waitForSelector`/`waitForFunction` statt `waitForTimeout`; bestehende Helper mit internem `waitForTimeout` (`loadApp`, `navigateToTab`) dürfen als Setup-Vehikel importiert werden, aber keine neuen `waitForTimeout`-Aufrufe im Spec-Körper selbst.

## No Analog Found

| Datei/Bereich | Rolle | Datenfluss | Grund |
|---|---|---|---|
| `insertTable()`-Modal-Interaktion (Größenauswahl) | component (Modal) | request-response | Kein bestehender E2E-Test deckt das Tabellengrößen-Modal ab; `wiki.spec.js:340-355` bricht genau an dieser Stelle ab ("Oder Modal für Tabellengrößte erscheint" — unkommentiert, kein Pfad verfolgt). Planner sollte hierfür das Modal-Markup direkt aus `assets/templates/` lesen statt sich auf einen Test-Analog zu verlassen. |
| Persistenz-Roundtrip-Test-Struktur speziell für Rich-Text-Markup (Reload + Re-Open + Markup-Vergleich) | test (e2e, batch) | Kein bestehender Test im Codebase führt exakt diesen Dreischritt (formatieren → speichern → reload → Markup-Diff) für Editor-Inhalte aus; `persistence.spec.js` prüft Persistenz nur für einfache Feldwerte, nicht für HTML-Markup-Struktur. Muster muss aus RESEARCH.md Architecture Diagram (Zeilen 160-172) neu zusammengesetzt werden. |

## Metadata

**Analog-Suchbereich:** `ui/editors/`, `tests/e2e/features/`, `tests/e2e/helpers/`, `core/constants.js`
**Gescannte Dateien:** `ui/editors/rich-text.js` (Ausschnitte Z. 1-420, 817-935 laut RESEARCH.md bereits vollständig recherchiert), `tests/e2e/features/wiki.spec.js` (vollständig für Boot+Formatierungsblock), `tests/e2e/helpers/test-utils.js` (vollständig für Rich-Text-/Navigation-Helper)
**Pattern-Extraktion:** 2026-07-25
