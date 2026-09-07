// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Editor-Regressionsnetz (execCommand-Ablösung, Phase 9)
 *
 * Tracer-Test: beweist die komplette Prüfkette der Phase an EINEM Pfad —
 * echter Toolbar-Klick -> exaktes Markup -> Speichern -> Reload -> exaktes Markup.
 * Dieser Test dient als Baseline-Referenz: solange execCommand('bold') das
 * Markup erzeugt, muss dieser Test grün bleiben. Sobald die Migration auf
 * Selection/Range-APIs erfolgt (Pläne 09-06..09-09), MUSS er weiterhin
 * exakt dasselbe Markup liefern (D-02 Verhaltensgleichheit).
 */

// Empirisch am gebauten Bundle erhoben (Chromium execCommand('bold') auf
// vollständig selektiertem Text "Tracertext" in #wiki-content).
const ERWARTET_BOLD_NACH_KLICK = '<b>Tracertext</b>';
// Nach sanitizeHTML() + localStorage-Roundtrip + Reload + edit-wiki: identisch,
// da <b> in der allowedTags-Whitelist von sanitizeHTML() enthalten ist.
const ERWARTET_BOLD_NACH_RELOAD = '<b>Tracertext</b>';


/**
 * Marker bzw. Vorlese-Baustein ueber das Aufklapp-Menue setzen.
 *
 * Bis Variante 2a waren beides <select>-Elemente und wurden per
 * selectOption() bedient. Seit 2a haengen sie als verankerte Menues an ihrem
 * Button: erst den Trigger klicken, dann den Eintrag. Playwright klickt nur
 * Sichtbares — ohne den Oeffnen-Schritt laeuft der Klick in den
 * 30-Sekunden-Timeout statt in einen schnellen Fehlschlag.
 *
 * Schrift- und Groessen-Auswahl sind weiterhin Selects und bleiben bei
 * selectOption().
 */
async function pickFromEditorMenu(page, action, editorId, value, menu) {
    await page.click(`[data-tb-menu="${menu}"][data-editor="${editorId}"]`);
    await page.click(`[data-action="${action}"][data-editor="${editorId}"][data-value="${value}"]`);
}

async function pickMarker(page, editorId, value) {
    await pickFromEditorMenu(page, 'set-highlight-color', editorId, value, 'marker');
}

async function pickReadAloud(page, editorId, value) {
    await pickFromEditorMenu(page, 'set-read-aloud-style', editorId, value, 'block');
}

// NETZ-FREEZE-AUSNAHME 2026-09-07 / NF-01 (Variante 2a, Handoff-Abschnitt 1)
// -------------------------------------------------------------------------
// Die <mark>-Erwartungen unten sind NEU VERMESSEN, nicht aufgeweicht. Zwei
// bewusste Aenderungen an applyMarkerToSelection() (ui/editors/rich-text.js):
//
//   1. color: inherit -> #141414 (serialisiert als rgb(20, 20, 20)).
//      'inherit' liess die Schrift die helle Themenfarbe erben; auf einem
//      hellen Marker war der Text damit praktisch unlesbar. Der Handoff
//      nennt das ausdruecklich "den groessten Fehler im Alt-Zustand".
//   2. padding 0px 3px -> 0px 2px, einheitlich. Vorher lieferten statische
//      und schwebende Leiste unterschiedliches Markup fuer dieselbe Aktion.
//
// Die Werte wurden gegen den laufenden Browser gemessen, nicht geraten.
// Alles Uebrige am Markup ist unveraendert.

test.describe('Editor-Regressionsnetz — Statische Toolbar (Wiki)', () => {
    test.beforeEach(async ({ page }) => {
        const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
        await page.goto(filePath);
        await page.waitForSelector('.app-title', { timeout: 10000 });
        await page.evaluate(() => window.switchView('wiki'));
        await page.waitForSelector('#view-wiki', { state: 'visible' });
    });

    test('sollte Bold ueber die statische Wiki-Toolbar anwenden und den Speichern/Reload-Zyklus ueberstehen', async ({
        page
    }) => {
        // 1. Formular oeffnen
        await page.click('[data-action="call"][data-value="showWikiForm"]');
        await page.fill('#wiki-title', 'Tracer Fett');
        await page.selectOption('#wiki-category', 'locations');

        // 2. Text eingeben
        const editor = page.locator('#wiki-content');
        await editor.click();
        await editor.pressSequentially('Tracertext');

        // 3. Volltext selektieren
        await editor.selectText();

        // 4. Echten Toolbar-Bold-Button klicken (hart auf Sichtbarkeit pruefen)
        const boldBtn = page.locator(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="bold"]'
        );
        await expect(boldBtn).toBeVisible();
        await boldBtn.click();

        // 5. Markup-Assertion direkt nach dem Klick (exakter Vergleich, kein toContain)
        await expect(editor).toHaveJSProperty('innerHTML', ERWARTET_BOLD_NACH_KLICK);

        // 6. Persistenz-Roundtrip: Speichern, Reload, wiedereroeffnen
        await page.click('[data-action="call"][data-value="saveWikiEntry"]');
        await page.reload();
        await page.waitForSelector('.app-title', { timeout: 10000 });
        await page.evaluate(() => window.switchView('wiki'));
        await page.waitForSelector('#view-wiki', { state: 'visible' });

        // Wiki-Kategorien sind nach Reload wieder eingeklappt (WikiState ist
        // Session-only) — Kategorie "locations" muss erst geoeffnet werden.
        await page.click('[data-action="toggle-wiki-category"][data-value="locations"]');
        await page
            .locator('.wiki-tree-item[data-action="select-wiki-entry"]', {
                hasText: 'Tracer Fett'
            })
            .click();
        await page.click('[data-action="edit-wiki"]');

        // 7. Markup-Assertion nach Reload — derselbe wiedergeoeffnete Editor
        const reopenedEditor = page.locator('#wiki-content');
        await expect(reopenedEditor).toBeVisible();
        await expect(reopenedEditor).toHaveJSProperty('innerHTML', ERWARTET_BOLD_NACH_RELOAD);
    });
});

/**
 * Netz der statischen Wiki-Toolbar — alle Formatgruppen (Plan 09-02, Task 2)
 *
 * Alle Erwartungswerte unten sind EMPIRISCH am gebauten Bundle erhoben (temporäre
 * Probe-Spec, analog 09-01-Muster — Chromium 143.0.7499.4, Playwright 1.57.0),
 * nicht aus Dokumentation geraten. Sie decken sich mit den Messungen in
 * 09-BASELINE.md (Markup-Inventar der 21 execCommand-Call-Sites) und ergänzen
 * dort, wo die Baseline nur "Sondentext" statt eines eigenen Testtexts nutzte
 * oder der Pfad vor der Reparatur (09-02/Task 1) noch nicht messbar war
 * (Schriftart/-größe, Randfälle der floating Toolbar).
 */

// ---------------------------------------------------------------
// Gemeinsame Hilfsfunktionen für das Formatgruppen-Netz
// ---------------------------------------------------------------
async function gotoBundleFresh(page) {
    const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
    await page.goto(filePath);
    await page.waitForSelector('.app-title', { timeout: 10000 });
}

async function openFreshWikiForm(page, title) {
    await page.evaluate(() => window.switchView('wiki'));
    await page.waitForSelector('#view-wiki', { state: 'visible' });
    await page.click('[data-action="call"][data-value="showWikiForm"]');
    await page.fill('#wiki-title', title);
    await page.selectOption('#wiki-category', 'locations');
}

async function typeAndSelectAll(editor, text) {
    await editor.click();
    await editor.pressSequentially(text);
    await editor.selectText();
}

async function saveAndReopenWikiEntry(page, title) {
    await page.click('[data-action="call"][data-value="saveWikiEntry"]');
    await page.reload();
    await page.waitForSelector('.app-title', { timeout: 10000 });
    await page.evaluate(() => window.switchView('wiki'));
    await page.waitForSelector('#view-wiki', { state: 'visible' });
    const catToggle = page.locator(
        '[data-action="toggle-wiki-category"][data-value="locations"]'
    );
    const isOpen = await page.evaluate(() => {
        const list = document.querySelector('[data-wiki-category="locations"]');
        return list ? getComputedStyle(list).display !== 'none' : false;
    });
    if (!isOpen) await catToggle.first().click();
    await page
        .locator('.wiki-tree-item[data-action="select-wiki-entry"]', { hasText: title })
        .click();
    await page.click('[data-action="edit-wiki"]');
    const editor = page.locator('#wiki-content');
    await expect(editor).toBeVisible();
    return editor;
}

const TESTTEXT = 'Probetext';

// Empirisch erhobene Erwartungswerte je Formatgruppe (nach Aktion / nach Roundtrip)
const NETZ = {
    italic: { after: '<i>Probetext</i>', roundtrip: '<i>Probetext</i>' },
    underline: { after: '<u>Probetext</u>', roundtrip: '<u>Probetext</u>' },
    // A4 (09-BASELINE.md) war: <strike> fehlte in sanitizeHTML()s allowedTags (nur 's'
    // war erlaubt) — die Auszeichnung überlebte den Roundtrip NICHT. Phase 10 (D-06,
    // 10-03-PLAN.md Task 3) hat 'strike' synchron in utils/basic.js UND
    // utils/testable-utils.js ergänzt (Paritätstest als Zaun) — der Roundtrip-Wert
    // ist jetzt identisch zum Wert direkt nach der Formatierung. Netz-Freeze-Begründung
    // siehe 09-BASELINE.md Abschnitt "Netz-Freeze", Ausnahme-Änderung 8.
    strikethrough: { after: '<strike>Probetext</strike>', roundtrip: '<strike>Probetext</strike>' },
    list: { after: '<ul><li>Probetext</li></ul>', roundtrip: '<ul><li>Probetext</li></ul>' },
    font: {
        after: '<font face="Georgia, Times New Roman, serif">Probetext</font>',
        roundtrip: '<font face="Georgia, Times New Roman, serif">Probetext</font>'
    },
    // sanitizeHTML() serialisiert das style-Attribut neu (styleList.join(';') ohne
    // trailing Semikolon) — deshalb unterscheidet sich "after" (mit ';') vom Roundtrip.
    fontsize: {
        after: '<font style="font-size: 20px;">Probetext</font>',
        roundtrip: '<font style="font-size: 20px">Probetext</font>'
    },
    // border-radius ist NICHT im style-Whitelist von sanitizeHTML() (utils/basic.js) —
    // fällt beim Roundtrip weg, background-color/color/padding bleiben erhalten.
    highlightSet: {
        after: '<mark style="background-color: rgba(251, 191, 36, 0.4); color: rgb(20, 20, 20); border-radius: 2px; padding: 0px 2px;">Probetext</mark>',
        roundtrip:
            '<mark style="background-color: rgba(251, 191, 36, 0.4); color: rgb(20, 20, 20); padding: 0px 2px">Probetext</mark>'
    },
    highlightRemove: { after: 'Probetext', roundtrip: 'Probetext' },
    readAloud: {
        after: '<div class="read-aloud crimson">Probetext</div>',
        roundtrip: '<div class="read-aloud crimson">Probetext</div>'
    },
    readAloudToggleRemoved: { after: 'Probetext', roundtrip: 'Probetext' },
    // display/border-radius sind NICHT im style-Whitelist — fallen beim Roundtrip weg,
    // border/padding bleiben erhalten (utils/basic.js allowedAttributes.style).
    border: {
        after: '<span class="editor-border" style="border: 1px solid var(--gold); padding: 2px 6px; border-radius: 4px; display: inline-block;">Probetext</span>',
        roundtrip:
            '<span class="editor-border" style="border: 1px solid var(--gold); padding: 2px 6px">Probetext</span>'
    },
    // Chromiums execCommand('insertHTML')-Sanitizer normalisiert das eingefügte
    // style-Attribut (padding/color/das background-Shorthand werden zu leeren
    // background-*-Langhand-Properties expandiert) — empirisch erhoben, kein Guess.
    table: {
        after:
            'Probetext<table><tbody><tr><th style="border: 1px solid var(--border); background-image: ; background-position-x: ; background-position-y: ; background-size: ; background-repeat: ; background-attachment: ; background-origin: ; background-clip: ;">Spalte 1</th><th style="border: 1px solid var(--border); background-image: ; background-position-x: ; background-position-y: ; background-size: ; background-repeat: ; background-attachment: ; background-origin: ; background-clip: ;">Spalte 2</th><th style="border: 1px solid var(--border); background-image: ; background-position-x: ; background-position-y: ; background-size: ; background-repeat: ; background-attachment: ; background-origin: ; background-clip: ;">Spalte 3</th></tr><tr><td style="border: 1px solid var(--border);"></td><td style="border: 1px solid var(--border);"></td><td style="border: 1px solid var(--border);"></td></tr><tr><td style="border: 1px solid var(--border);"></td><td style="border: 1px solid var(--border);"></td><td style="border: 1px solid var(--border);"></td></tr></tbody></table><p></p>',
        roundtrip:
            'Probetext<table><tbody><tr><th style="border: 1px solid var(--border)">Spalte 1</th><th style="border: 1px solid var(--border)">Spalte 2</th><th style="border: 1px solid var(--border)">Spalte 3</th></tr><tr><td style="border: 1px solid var(--border)"></td><td style="border: 1px solid var(--border)"></td><td style="border: 1px solid var(--border)"></td></tr><tr><td style="border: 1px solid var(--border)"></td><td style="border: 1px solid var(--border)"></td><td style="border: 1px solid var(--border)"></td></tr></tbody></table><p></p>'
    },
    clearFormatting: { before: '<b>Probetext</b>', after: 'Probetext', roundtrip: 'Probetext' },
    // 'insert-link' liegt außerhalb der 21 zu migrierenden execCommand-Call-Sites
    // (09-RESEARCH.md Pitfall 4) — unveränderter Fremdpfad, muss vor UND nach der
    // Migration (Pläne 09-06..09-09) unverändert grün bleiben.
    link: {
        after: '<a href="https://example.com/probe">Probetext</a>',
        roundtrip:
            '<a href="https://example.com/probe" target="_blank" rel="noopener noreferrer">Probetext</a>'
    }
};

test.describe('Markup direkt nach Aktion', () => {
    test.beforeEach(async ({ page }) => {
        await gotoBundleFresh(page);
    });

    test('Kursiv über die statische Wiki-Toolbar', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz Italic');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="italic"]'
        );
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.italic.after);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Unterstrichen über die statische Wiki-Toolbar', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz Underline');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="underline"]'
        );
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.underline.after);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Durchgestrichen über die statische Wiki-Toolbar', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz Strike');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="strikethrough"]'
        );
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.strikethrough.after);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Liste über die statische Wiki-Toolbar', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz List');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="list"]'
        );
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.list.after);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Schriftart (Serif) — kein Fallback auf Arial', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz Font');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.selectOption(
            '[data-action="set-editor-font"][data-editor="wiki-content"]',
            'serif'
        );
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.font.after);
        expect(NETZ.font.after).toContain('Georgia');
        expect(NETZ.font.after).not.toContain('face="Arial');
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Schriftgröße (20px)', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz FontSize');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.selectOption(
            '[data-action="set-editor-font-size"][data-editor="wiki-content"]',
            '20px'
        );
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.fontsize.after);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Highlight setzen', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz Highlight Set');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await pickMarker(page, 'wiki-content', '#fbbf24');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.highlightSet.after);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Highlight entfernen (transparent)', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz Highlight Remove');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await pickMarker(page, 'wiki-content', '#fbbf24');
        await editor.click();
        await editor.selectText();
        await pickMarker(page, 'wiki-content', 'transparent');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.highlightRemove.after);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Vorlese-Stil (Karmesin) setzen + Toggle-Entfernen', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz ReadAloud');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await pickReadAloud(page, 'wiki-content', 'crimson');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.readAloud.after);
        // Toggle: erneutes Anwenden auf denselben Block entfernt ihn wieder
        await editor.click();
        await pickReadAloud(page, 'wiki-content', 'crimson');
        await expect(editor).toHaveJSProperty(
            'innerHTML',
            NETZ.readAloudToggleRemoved.after
        );
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Rahmen über die statische Wiki-Toolbar', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz Border');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.click('[data-action="set-border-format"][data-editor="wiki-content"]');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.border.after);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Tabelle (3×3) einfügen', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz Table');
        const editor = page.locator('#wiki-content');
        await editor.click();
        await editor.pressSequentially(TESTTEXT);
        await page.click('[data-action="insert-table"][data-editor="wiki-content"]');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.table.after);
        const thCount = await editor.locator('th').count();
        const tdCount = await editor.locator('td').count();
        expect(thCount).toBe(3);
        expect(tdCount).toBe(6);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Formatierung entfernen (nach Fett)', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz Clear');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="bold"]'
        );
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.clearFormatting.before);
        await page.click('[data-action="clear-formatting"][data-value="wiki-content"]');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.clearFormatting.after);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Link über die statische Toolbar (unveränderter Fremdpfad)', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz Link');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        page.once('dialog', dialog => dialog.accept('https://example.com/probe'));
        await page.click('[data-action="insert-link"][data-editor="wiki-content"]');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.link.after);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });
});

test.describe('Persistenz-Roundtrip', () => {
    test.beforeEach(async ({ page }) => {
        await gotoBundleFresh(page);
    });

    test('Kursiv übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT Italic');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="italic"]'
        );
        const reopened = await saveAndReopenWikiEntry(page, 'RT Italic');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.italic.roundtrip);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Unterstrichen übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT Underline');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="underline"]'
        );
        const reopened = await saveAndReopenWikiEntry(page, 'RT Underline');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.underline.roundtrip);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Durchgestrichen übersteht Speichern/Reload (D-06, ehemals A4-Datenintegritäts-Bug — in Phase 10 behoben)', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'RT Strike');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="strikethrough"]'
        );
        const reopened = await saveAndReopenWikiEntry(page, 'RT Strike');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.strikethrough.roundtrip);
        // Text selbst bleibt erhalten UND die Auszeichnung übersteht den Zyklus jetzt (kein Datenverlust)
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Liste übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT List');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="list"]'
        );
        const reopened = await saveAndReopenWikiEntry(page, 'RT List');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.list.roundtrip);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Schriftart (Serif) übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT Font');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.selectOption(
            '[data-action="set-editor-font"][data-editor="wiki-content"]',
            'serif'
        );
        const reopened = await saveAndReopenWikiEntry(page, 'RT Font');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.font.roundtrip);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Schriftgröße (20px) übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT FontSize');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.selectOption(
            '[data-action="set-editor-font-size"][data-editor="wiki-content"]',
            '20px'
        );
        const reopened = await saveAndReopenWikiEntry(page, 'RT FontSize');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.fontsize.roundtrip);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Highlight setzen übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT Highlight Set');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await pickMarker(page, 'wiki-content', '#fbbf24');
        const reopened = await saveAndReopenWikiEntry(page, 'RT Highlight Set');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.highlightSet.roundtrip);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Highlight entfernen übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT Highlight Remove');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await pickMarker(page, 'wiki-content', '#fbbf24');
        await editor.click();
        await editor.selectText();
        await pickMarker(page, 'wiki-content', 'transparent');
        const reopened = await saveAndReopenWikiEntry(page, 'RT Highlight Remove');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.highlightRemove.roundtrip);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Vorlese-Stil übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT ReadAloud');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await pickReadAloud(page, 'wiki-content', 'crimson');
        const reopened = await saveAndReopenWikiEntry(page, 'RT ReadAloud');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.readAloud.roundtrip);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Vorlese-Stil Toggle-Entfernen übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT ReadAloud Remove');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await pickReadAloud(page, 'wiki-content', 'crimson');
        await editor.click();
        await pickReadAloud(page, 'wiki-content', 'crimson');
        const reopened = await saveAndReopenWikiEntry(page, 'RT ReadAloud Remove');
        await expect(reopened).toHaveJSProperty(
            'innerHTML',
            NETZ.readAloudToggleRemoved.roundtrip
        );
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Rahmen übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT Border');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.click('[data-action="set-border-format"][data-editor="wiki-content"]');
        const reopened = await saveAndReopenWikiEntry(page, 'RT Border');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.border.roundtrip);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Tabelle (3×3) übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT Table');
        const editor = page.locator('#wiki-content');
        await editor.click();
        await editor.pressSequentially(TESTTEXT);
        await page.click('[data-action="insert-table"][data-editor="wiki-content"]');
        const reopened = await saveAndReopenWikiEntry(page, 'RT Table');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.table.roundtrip);
        const thCount = await reopened.locator('th').count();
        const tdCount = await reopened.locator('td').count();
        expect(thCount).toBe(3);
        expect(tdCount).toBe(6);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Formatierung entfernen übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT Clear');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="bold"]'
        );
        await page.click('[data-action="clear-formatting"][data-value="wiki-content"]');
        const reopened = await saveAndReopenWikiEntry(page, 'RT Clear');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.clearFormatting.roundtrip);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Link übersteht Speichern/Reload (unveränderter Fremdpfad)', async ({ page }) => {
        await openFreshWikiForm(page, 'RT Link');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        page.once('dialog', dialog => dialog.accept('https://example.com/probe'));
        await page.click('[data-action="insert-link"][data-editor="wiki-content"]');
        const reopened = await saveAndReopenWikiEntry(page, 'RT Link');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.link.roundtrip);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });
});

/**
 * Randfälle der statischen Wiki-Toolbar (Plan 09-02, Task 3)
 *
 * Vier Randfall-Klassen: Adjazenz, Leer/Einzelelement, Kodierung, Ordnung.
 * Alle Erwartungswerte empirisch erhoben (temporäre Probe-Spec, danach gelöscht)
 * und in 09-BASELINE.md protokolliert (Abschnitt "Randfälle … — empirisch erhoben").
 */
async function selectExactTextRange(page, matchText) {
    // Selektiert den ersten Textknoten in #wiki-content, dessen Inhalt matchText
    // exakt enthält, auf genau diesen Teilbereich — Playwrights selectText()
    // kann keine Teilselektion innerhalb eines gemischten Editor-Inhalts abbilden.
    await page.evaluate(text => {
        const el = document.getElementById('wiki-content');
        let target = null;
        el.childNodes.forEach(n => {
            if (n.nodeType === Node.TEXT_NODE && n.textContent.includes(text)) target = n;
        });
        if (!target) return;
        const idx = target.textContent.indexOf(text);
        const range = document.createRange();
        range.setStart(target, idx);
        range.setEnd(target, idx + text.length);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }, matchText);
}

async function selectElementContents(page, selector) {
    await page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (!el) return;
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }, selector);
}

test.describe('Randfälle', () => {
    test.beforeEach(async ({ page }) => {
        await gotoBundleFresh(page);
    });

    test('Adjazenz: zwei unmittelbar benachbarte Wortbereiche nacheinander fett formatiert bleiben getrennte Tags + Toggle entfernt nur die erneut angewandte Selektion', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Randfall Adjazenz');
        const editor = page.locator('#wiki-content');
        await editor.click();
        await editor.pressSequentially('WortEins WortZwei');

        await selectExactTextRange(page, 'WortEins');
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="bold"]'
        );
        await expect(editor).toHaveJSProperty('innerHTML', '<b>WortEins</b> WortZwei');

        await selectExactTextRange(page, 'WortZwei');
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="bold"]'
        );
        // Baseline (09-BASELINE.md, Randfälle): kein Zusammenführen zweier
        // benachbarter gleicher Formate — zwei getrennte <b>-Tags bleiben bestehen.
        await expect(editor).toHaveJSProperty(
            'innerHTML',
            '<b>WortEins</b> <b>WortZwei</b>'
        );

        // Toggle-Fall: erneutes Anwenden auf eine bereits formatierte Selektion
        await selectElementContents(page, '#wiki-content b');
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="bold"]'
        );
        await expect(editor).toHaveJSProperty('innerHTML', 'WortEins <b>WortZwei</b>');
    });

    test('Leer/Einzelelement: leerer Editor, kollabierter Cursor und Ein-Zeichen-Selektion erzeugen keinen Page-/Konsolenfehler', async ({
        page
    }) => {
        const errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        // (a) Leerer Editor
        await openFreshWikiForm(page, 'Randfall Leer A');
        let editor = page.locator('#wiki-content');
        await editor.click();
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="bold"]'
        );
        await expect(editor).toHaveJSProperty('innerHTML', '');
        await page.click('[data-action="call"][data-value="hideWikiForm"]');

        // (b) Kollabierter Cursor (kein Selektion) auf gefülltem Editor
        await openFreshWikiForm(page, 'Randfall Leer B');
        editor = page.locator('#wiki-content');
        await editor.click();
        await editor.pressSequentially('Cursortext');
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="bold"]'
        );
        await expect(editor).toHaveJSProperty('innerHTML', 'Cursortext');
        await page.click('[data-action="call"][data-value="hideWikiForm"]');

        // (c) Ein-Zeichen-Selektion
        await openFreshWikiForm(page, 'Randfall Leer C');
        editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, 'X');
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="bold"]'
        );
        await expect(editor).toHaveJSProperty('innerHTML', '<b>X</b>');
        await page.click('[data-action="call"][data-value="hideWikiForm"]');

        expect(errors).toEqual([]);
    });

    test('Kodierung: Umlaute/Emoji überstehen Fett + Schriftgröße + Speichern/Reload zeichengleich', async ({
        page
    }) => {
        const KODIERUNGSTEXT = 'Größenwahn ⚔️ Straße';
        await openFreshWikiForm(page, 'Randfall Kodierung');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, KODIERUNGSTEXT);
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="bold"]'
        );
        await expect(editor).toHaveJSProperty(
            'innerHTML',
            `<b>${KODIERUNGSTEXT}</b>`
        );
        await page.selectOption(
            '[data-action="set-editor-font-size"][data-editor="wiki-content"]',
            '20px'
        );
        await expect(editor).toHaveJSProperty(
            'innerHTML',
            `<b><font style="font-size: 20px;">${KODIERUNGSTEXT}</font></b>`
        );

        const reopened = await saveAndReopenWikiEntry(page, 'Randfall Kodierung');
        await expect(reopened).toHaveJSProperty(
            'innerHTML',
            `<b><font style="font-size: 20px">${KODIERUNGSTEXT}</font></b>`
        );
        await expect(reopened.evaluate(el => el.textContent)).resolves.toBe(KODIERUNGSTEXT);
    });

    test('Ordnung: dieselbe Aktion zweimal auf frische, gleichartige Editorinhalte liefert byte-gleiches innerHTML', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Randfall Ordnung A');
        let editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, 'Ordnungstext');
        await page.selectOption(
            '[data-action="set-editor-font-size"][data-editor="wiki-content"]',
            '18px'
        );
        const lauf1 = await editor.evaluate(el => el.innerHTML);
        await page.click('[data-action="call"][data-value="hideWikiForm"]');

        await openFreshWikiForm(page, 'Randfall Ordnung B');
        editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, 'Ordnungstext');
        await page.selectOption(
            '[data-action="set-editor-font-size"][data-editor="wiki-content"]',
            '18px'
        );
        const lauf2 = await editor.evaluate(el => el.innerHTML);

        expect(lauf1).toBe(lauf2);
        expect(lauf1).toBe('<font style="font-size: 18px;">Ordnungstext</font>');
    });
});

// NEU mit Variante 2a (W-15) — NICHT Teil des eingefrorenen Phase-9-Netzes.
// Der Zustand wird ueber getActiveFormatsAtSelection() ermittelt, nicht ueber
// die deprecated queryCommandState-API; dieser Block ist der Beleg dafuer,
// dass die Ermittlung an einem KOLLABIERTEN Cursor greift — genau der Fall,
// bei dem handleSelectionChange() frueh zurueckkehrt.
test.describe('Aktiver Formatzustand in der Leiste (2a)', () => {
    test.beforeEach(async ({ page }) => {
        await gotoBundleFresh(page);
    });

    test('Cursor in fettem Text markiert den B-Knopf, ausserhalb nicht', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz Formatzustand');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.click('[data-action="format-text"][data-cmd="wiki-content"][data-editor="bold"]');

        const boldBtn = page.locator(
            '[data-toolbar-for="wiki-content"] [data-action="format-text"][data-editor="bold"]'
        );
        // Cursor in den fetten Text setzen (kollabierte Auswahl)
        await editor.evaluate(el => {
            const target = el.querySelector('b');
            const range = document.createRange();
            range.setStart(target.firstChild, 2);
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            document.dispatchEvent(new Event('selectionchange'));
        });
        await expect(boldBtn).toHaveClass(/format-active/, { timeout: 3000 });

        // Cursor hinter das fette Element -> Zustand muss wieder abfallen
        await editor.evaluate(el => {
            const range = document.createRange();
            range.setStart(el, el.childNodes.length);
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            document.dispatchEvent(new Event('selectionchange'));
        });
        await expect(boldBtn).not.toHaveClass(/format-active/, { timeout: 3000 });
    });
});

// NEU mit Variante 2a (W-11) — NICHT Teil des eingefrorenen Phase-9-Netzes.
//
// Warum es diesen Test gibt, obwohl er trivial aussieht: der Handoff verlangt
// in Abschnitt 1 eine Normalisierungsschleife, die bei jedem input-Ereignis
// ueber die Schreibflaeche laeuft und die dunkle Schriftfarbe in Markern
// wiederherstellt. Diese Schleife ist hier BEWUSST NICHT gebaut worden.
//
// Der Grund ist eine Eigenschaft unserer Umsetzung, nicht Nachlaessigkeit: der
// Prototyp des Handoffs setzt den Marker per execCommand('hiliteColor'), was
// getrennte Hintergrund-Elemente erzeugt, die beim Weitertippen die
// Schriftfarbe verlieren. applyMarkerToSelection() erzeugt stattdessen EIN
// <mark>, das Hintergrund und Schriftfarbe gemeinsam traegt — der Browser
// fuehrt dieses Element beim Tippen unveraendert fort.
//
// Dieser Test haelt genau diese Voraussetzung fest. Faellt er, ist die
// Begruendung fuer das Weglassen der Normalisierung hinfaellig und die
// Schleife muss nachgeruestet werden.
test.describe('Marker-Haltbarkeit beim Weitertippen (2a, W-11-Begruendung)', () => {
    test.beforeEach(async ({ page }) => {
        await gotoBundleFresh(page);
    });

    test('Tippen innerhalb eines Markers erhaelt die dunkle Schriftfarbe', async ({ page }) => {
        const result = await page.evaluate(() => {
            const ed = document.createElement('div');
            ed.className = 'rich-editor';
            ed.contentEditable = 'true';
            document.body.appendChild(ed);
            ed.innerHTML = '<p>Wache Passiv 13</p>';
            const textNode = ed.querySelector('p').firstChild;
            const range = document.createRange();
            range.setStart(textNode, 0);
            range.setEnd(textNode, 5);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            window.applyMarkerToSelection(ed, '#fbbf24', null);
            // Weitertippen im Marker
            ed.querySelector('mark').firstChild.appendData('XYZ');
            const inside = ed.innerHTML;
            // Weitertippen hinter dem Marker
            ed.querySelector('p').appendChild(document.createTextNode(' danach'));
            return { inside, outside: ed.innerHTML };
        });

        expect(result.inside).toContain('color: rgb(20, 20, 20)');
        expect(result.inside).toContain('>WacheXYZ<');
        // Der Text hinter dem Marker darf NICHT mit hineingezogen werden
        expect(result.outside).toContain('</mark> Passiv 13 danach');
    });
});
