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
    // A4 (09-BASELINE.md): <strike> ist nicht in sanitizeHTML()s allowedTags
    // (nur 's' ist erlaubt) — die Auszeichnung überlebt den Roundtrip NICHT.
    // Vorbestehender Bug, eingefroren, nicht Teil dieser Migration (Phase-10-Vormerkung).
    strikethrough: { after: '<strike>Probetext</strike>', roundtrip: 'Probetext' },
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
        after: '<mark style="background-color: rgba(251, 191, 36, 0.4); color: inherit; border-radius: 2px; padding: 0px 3px;">Probetext</mark>',
        roundtrip:
            '<mark style="background-color: rgba(251, 191, 36, 0.4); color: inherit; padding: 0px 3px">Probetext</mark>'
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
        await page.selectOption(
            '[data-action="set-highlight-color"][data-editor="wiki-content"]',
            '#fbbf24'
        );
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.highlightSet.after);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Highlight entfernen (transparent)', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz Highlight Remove');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.selectOption(
            '[data-action="set-highlight-color"][data-editor="wiki-content"]',
            '#fbbf24'
        );
        await editor.click();
        await editor.selectText();
        await page.selectOption(
            '[data-action="set-highlight-color"][data-editor="wiki-content"]',
            'transparent'
        );
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.highlightRemove.after);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Vorlese-Stil (Karmesin) setzen + Toggle-Entfernen', async ({ page }) => {
        await openFreshWikiForm(page, 'Netz ReadAloud');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.selectOption(
            '[data-action="set-read-aloud-style"][data-editor="wiki-content"]',
            'crimson'
        );
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.readAloud.after);
        // Toggle: erneutes Anwenden auf denselben Block entfernt ihn wieder
        await editor.click();
        await page.selectOption(
            '[data-action="set-read-aloud-style"][data-editor="wiki-content"]',
            'crimson'
        );
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

    test('Durchgestrichen übersteht Speichern/Reload NICHT — vorbestehender Bug (A4, eingefroren)', async ({
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
        // Text selbst bleibt trotz verlorener Auszeichnung erhalten (kein Datenverlust)
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
        await page.selectOption(
            '[data-action="set-highlight-color"][data-editor="wiki-content"]',
            '#fbbf24'
        );
        const reopened = await saveAndReopenWikiEntry(page, 'RT Highlight Set');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.highlightSet.roundtrip);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Highlight entfernen übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT Highlight Remove');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.selectOption(
            '[data-action="set-highlight-color"][data-editor="wiki-content"]',
            '#fbbf24'
        );
        await editor.click();
        await editor.selectText();
        await page.selectOption(
            '[data-action="set-highlight-color"][data-editor="wiki-content"]',
            'transparent'
        );
        const reopened = await saveAndReopenWikiEntry(page, 'RT Highlight Remove');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.highlightRemove.roundtrip);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Vorlese-Stil übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT ReadAloud');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.selectOption(
            '[data-action="set-read-aloud-style"][data-editor="wiki-content"]',
            'crimson'
        );
        const reopened = await saveAndReopenWikiEntry(page, 'RT ReadAloud');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.readAloud.roundtrip);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Vorlese-Stil Toggle-Entfernen übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT ReadAloud Remove');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.selectOption(
            '[data-action="set-read-aloud-style"][data-editor="wiki-content"]',
            'crimson'
        );
        await editor.click();
        await page.selectOption(
            '[data-action="set-read-aloud-style"][data-editor="wiki-content"]',
            'crimson'
        );
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
