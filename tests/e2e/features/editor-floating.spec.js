// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

/**
 * E2E Tests — Editor-Regressionsnetz (execCommand-Ablösung, Phase 9, Plan 09-03)
 *
 * Deckt die FLOATING Toolbar ab (erscheint bei Textselektion in jedem
 * contenteditable-Editor). Ergänzt die statische Wiki-Toolbar aus 09-02
 * (tests/e2e/features/editor-formatting.spec.js).
 *
 * Alle Erwartungswerte sind EMPIRISCH am gebauten Bundle erhoben (temporäre
 * Probe-Spec, analog 09-01/09-02-Muster — Chromium 143.0.7499.4, Playwright
 * 1.57.0), NACH der Baseline-Reparatur (Plan 09-02/Task 1, Commit 19a355e:
 * EDITOR_FONTS/TOOLBAR_DIMENSIONS wiederhergestellt). Die floating Toolbar
 * ist damit erstmals per Mausklick bedienbar (09-BASELINE.md, Fund 1).
 */

const TESTTEXT = 'Probetext';

// ---------------------------------------------------------------
// Gemeinsame Hilfsfunktionen
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

async function waitForFloatingVisible(page) {
    await page.waitForFunction(
        () => document.getElementById('floating-toolbar')?.classList.contains('visible')
    );
}

// Selektiert den vollen Textinhalt des ERSTEN Text-Kindknotens eines Elements
// über Zeichen-Offsets (NICHT range.selectNodeContents(element) — dessen
// commonAncestorContainer wäre sonst das Element selbst mit Kind-Index-Offsets,
// wodurch applyFloatingFormat()s `.parentElement.closest(tag)`-Toggle-Erkennung
// auf den EDITOR-Container statt auf das Format-Tag träfe und faelschlich die
// Wrap- statt der Unwrap-Verzweigung nähme — empirisch verifiziert).
async function selectExactTextNodeRange(page, selector) {
    await page.evaluate(sel => {
        const el = document.querySelector(sel);
        const textNode = el.firstChild;
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, textNode.textContent.length);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }, selector);
}

// Selektiert exakt matchText innerhalb des ersten passenden Textknotens von
// #wiki-content (Muster aus editor-formatting.spec.js, Randfälle-Block).
async function selectExactTextRange(page, matchText) {
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

// Empirisch erhobene Erwartungswerte (nach Aktion), 09-BASELINE.md-konform.
const NETZ = {
    bold: '<b>Probetext</b>',
    italic: '<i>Probetext</i>',
    underline: '<u>Probetext</u>',
    // Floating Toolbar nutzt einen eigenen tagMap-Wrap (`<s>`), NICHT
    // execCommand('strikeThrough') wie die statische Toolbar (dort `<strike>`)
    // — vorbestehende, bewusst NICHT angeglichene Abweichung (09-RESEARCH.md
    // Pitfall 5, 09-BASELINE.md Zeile 916-Nachbarschaft).
    strikethrough: '<s>Probetext</s>',
    list: '<ul><li>Probetext</li></ul>',
    border: '<span class="editor-border" style="border: 1px solid var(--gold); padding: 2px 6px; border-radius: 4px; display: inline-block;">Probetext</span>',
    // Chromiums execCommand('insertHTML')-Sanitizer normalisiert das
    // background-Shorthand zu leeren Langhand-Properties (identisch zum
    // statischen Toolbar-Befund aus 09-02). Da die floating Toolbar den
    // insertTable()-Pfad bei bestehender Textselektion aufruft, wird der
    // selektierte Testtext durch die Tabelle ERSETZT (kein Text davor).
    table:
        '<table><tbody><tr><th style="border: 1px solid var(--border); background-image: ; background-position-x: ; background-position-y: ; background-size: ; background-repeat: ; background-attachment: ; background-origin: ; background-clip: ;">Spalte 1</th><th style="border: 1px solid var(--border); background-image: ; background-position-x: ; background-position-y: ; background-size: ; background-repeat: ; background-attachment: ; background-origin: ; background-clip: ;">Spalte 2</th><th style="border: 1px solid var(--border); background-image: ; background-position-x: ; background-position-y: ; background-size: ; background-repeat: ; background-attachment: ; background-origin: ; background-clip: ;">Spalte 3</th></tr><tr><td style="border: 1px solid var(--border);"></td><td style="border: 1px solid var(--border);"></td><td style="border: 1px solid var(--border);"></td></tr><tr><td style="border: 1px solid var(--border);"></td><td style="border: 1px solid var(--border);"></td><td style="border: 1px solid var(--border);"></td></tr></tbody></table><p></p>',
    // applyFloatingFormat()s 'link'-Zweig baut das <a>-Element manuell mit
    // target="_blank" rel="noopener noreferrer" SOFORT nach dem Klick auf —
    // die statische Toolbar (execCommand('createLink')) setzt diese Attribute
    // NICHT direkt, sondern erst nach dem Speichern/Reload-Zyklus (vgl.
    // editor-formatting.spec.js NETZ.link.after ohne target/rel). Vorbestehende,
    // bewusst NICHT angeglichene Abweichung (09-RESEARCH.md Pitfall 4).
    link: '<a href="https://example.com/probe" target="_blank" rel="noopener noreferrer">Probetext</a>'
};

// ---------------------------------------------------------------
// Task 1: Sichtbarkeit + Inline-Formate, Liste, Rahmen, Tabelle, Link
// ---------------------------------------------------------------
test.describe('Editor-Regressionsnetz — Floating Toolbar (Wiki)', () => {
    test.beforeEach(async ({ page }) => {
        await gotoBundleFresh(page);
        await openFreshWikiForm(page, 'Floating Basis');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await waitForFloatingVisible(page);
    });

    test('Basis: Textselektion bringt die floating Toolbar in den sichtbaren Zustand ohne Page-Error (Baseline-Reparatur option-a umgesetzt)', async ({
        page
    }) => {
        const errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        const toolbar = page.locator('#floating-toolbar');
        await expect(toolbar).toHaveClass(/visible/);
        // Erneute Selektionsänderung provozieren, um sicherzustellen, dass der
        // Debounce-Zyklus (150ms) ohne Konsolenfehler durchläuft.
        const editor = page.locator('#wiki-content');
        await editor.selectText();
        await waitForFloatingVisible(page);
        expect(errors).toEqual([]);
    });

    test('Fett über die floating Toolbar', async ({ page }) => {
        await page.locator('#floating-toolbar [data-floating-action="bold"]').click();
        const editor = page.locator('#wiki-content');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.bold);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Kursiv über die floating Toolbar', async ({ page }) => {
        await page.locator('#floating-toolbar [data-floating-action="italic"]').click();
        const editor = page.locator('#wiki-content');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.italic);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Unterstrichen über die floating Toolbar', async ({ page }) => {
        await page.locator('#floating-toolbar [data-floating-action="underline"]').click();
        const editor = page.locator('#wiki-content');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.underline);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Durchgestrichen über die floating Toolbar (bewusst abweichendes Markup ggü. statischer Toolbar — <s> statt <strike>)', async ({
        page
    }) => {
        await page.locator('#floating-toolbar [data-floating-action="strikethrough"]').click();
        const editor = page.locator('#wiki-content');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.strikethrough);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Liste über die floating Toolbar', async ({ page }) => {
        await page.locator('#floating-toolbar [data-floating-action="list"]').click();
        const editor = page.locator('#wiki-content');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.list);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Rahmen über die floating Toolbar', async ({ page }) => {
        await page.locator('#floating-toolbar [data-floating-action="border"]').click();
        const editor = page.locator('#wiki-content');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.border);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Tabelle über die floating Toolbar (ersetzt die bestehende Selektion)', async ({
        page
    }) => {
        await page.locator('#floating-toolbar [data-floating-action="table"]').click();
        const editor = page.locator('#wiki-content');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.table);
        const thCount = await editor.locator('th').count();
        const tdCount = await editor.locator('td').count();
        expect(thCount).toBe(3);
        expect(tdCount).toBe(6);
    });

    test('Link über die floating Toolbar (bewusst abweichendes Markup ggü. statischer Toolbar — target/rel sofort gesetzt)', async ({
        page
    }) => {
        page.once('dialog', dialog => dialog.accept('https://example.com/probe'));
        await page.locator('#floating-toolbar [data-floating-action="link"]').click();
        const editor = page.locator('#wiki-content');
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.link);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });
});

// ---------------------------------------------------------------
// Task 1: Toggle-Verhalten (Fett, Liste)
// ---------------------------------------------------------------
test.describe('Floating Toolbar — Toggle-Verhalten', () => {
    test.beforeEach(async ({ page }) => {
        await gotoBundleFresh(page);
    });

    test('Fett auf bereits fett gesetzten Text erneut angewandt entfernt die Auszeichnung', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Floating Toggle Bold');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await waitForFloatingVisible(page);
        await page.locator('#floating-toolbar [data-floating-action="bold"]').click();
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.bold);

        // NUR den Inhalt des <b> exakt (Zeichen-Offsets) erneut selektieren —
        // nicht den gesamten Editor (siehe selectExactTextNodeRange-Kommentar).
        await selectExactTextNodeRange(page, '#wiki-content b');
        await waitForFloatingVisible(page);
        await page.locator('#floating-toolbar [data-floating-action="bold"]').click();
        await expect(editor).toHaveJSProperty('innerHTML', TESTTEXT);
        await expect(editor.evaluate(el => el.textContent)).resolves.toBe(TESTTEXT);
    });

    test('Liste auf eine bereits als Liste formatierte Selektion erneut angewandt löst die Liste auf', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Floating Toggle List');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await waitForFloatingVisible(page);
        await page.locator('#floating-toolbar [data-floating-action="list"]').click();
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.list);

        await selectExactTextNodeRange(page, '#wiki-content li');
        await waitForFloatingVisible(page);
        await page.locator('#floating-toolbar [data-floating-action="list"]').click();
        await expect(editor).toHaveJSProperty('innerHTML', TESTTEXT);
        await expect(editor.evaluate(el => el.textContent)).resolves.toBe(TESTTEXT);
    });
});

// ---------------------------------------------------------------
// Task 1: Teilselektion über eine Elementgrenze hinweg (09-RESEARCH.md Pitfall 6)
// ---------------------------------------------------------------
test.describe('Floating Toolbar — Teilselektion', () => {
    test('Selektion beginnt mitten in einer bestehenden Auszeichnung und endet außerhalb — kein Page-Error', async ({
        page
    }) => {
        const errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        await gotoBundleFresh(page);
        await openFreshWikiForm(page, 'Floating Teilselektion');
        const editor = page.locator('#wiki-content');
        await editor.click();
        await editor.pressSequentially('WortEins WortZwei');

        // Setup: "WortEins" ueber die statische Toolbar fett setzen (identisches
        // <b>-Markup wie die floating Toolbar liefern wuerde — nur der Setup-Weg
        // unterscheidet sich, nicht das Ergebnis).
        await selectExactTextRange(page, 'WortEins');
        await page.click(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="bold"]'
        );
        await expect(editor).toHaveJSProperty('innerHTML', '<b>WortEins</b> WortZwei');

        // Teilselektion: beginnt mitten im Textknoten INNERHALB des <b> (nach
        // "Wort") und endet im NACHFOLGENDEN Textknoten außerhalb des <b>.
        await page.evaluate(() => {
            const el = document.getElementById('wiki-content');
            const b = el.querySelector('b');
            const bText = b.firstChild;
            let afterText = null;
            el.childNodes.forEach(n => {
                if (n.nodeType === Node.TEXT_NODE && n.textContent.includes('WortZwei'))
                    afterText = n;
            });
            const range = document.createRange();
            range.setStart(bText, 4);
            range.setEnd(afterText, afterText.textContent.indexOf('WortZwei') + 'WortZwei'.length);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });
        await waitForFloatingVisible(page);
        await page.locator('#floating-toolbar [data-floating-action="bold"]').click();

        // Erwartung: range.surroundContents() scheitert bei einer Teilselektion
        // (wirft, da der Range das <b> nur teilweise umschließt) — der try/catch-
        // Fallback (extractContents()+wrap) greift, das <b> wird an der Teilungs-
        // stelle gesplittet. Empirisch erhoben, kein geratener Wert.
        await expect(editor).toHaveJSProperty(
            'innerHTML',
            '<b>Wort</b><b><b>Eins</b> WortZwei</b>'
        );
        expect(errors).toEqual([]);
    });
});

// ---------------------------------------------------------------
// Task 2: Selects (Vorlese-Stil, Schriftart, Größe), Highlight-Farbfelder,
// „Format entfernen"
// ---------------------------------------------------------------
test.describe('Selects und Farbfelder', () => {
    test.beforeEach(async ({ page }) => {
        await gotoBundleFresh(page);
    });

    test('Vorlese-Stil (Karmesin) über die floating Toolbar — Select springt danach auf den ersten Eintrag zurück', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Floating ReadAloud');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await waitForFloatingVisible(page);
        const select = page.locator('#floating-toolbar [data-floating-action="readAloud"]');
        await page.selectOption(
            '#floating-toolbar [data-floating-action="readAloud"]',
            'crimson'
        );
        await expect(editor).toHaveJSProperty(
            'innerHTML',
            '<div class="read-aloud crimson">Probetext</div>'
        );
        await expect(select.evaluate(el => el.selectedIndex)).resolves.toBe(0);
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Schriftart (Serif) über die floating Toolbar — kein Fallback auf Arial', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Floating Font');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await waitForFloatingVisible(page);
        await page.selectOption('#floating-toolbar [data-floating-action="font"]', 'serif');
        const expected = '<font face="Georgia, Times New Roman, serif">Probetext</font>';
        await expect(editor).toHaveJSProperty('innerHTML', expected);
        expect(expected).toContain('Georgia');
        expect(expected).not.toContain('face="Arial');
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Schriftgröße (1.5em) über die floating Toolbar', async ({ page }) => {
        await openFreshWikiForm(page, 'Floating FontSize');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await waitForFloatingVisible(page);
        await page.selectOption('#floating-toolbar [data-floating-action="fontSize"]', '1.5em');
        await expect(editor).toHaveJSProperty(
            'innerHTML',
            '<font style="font-size: 1.5em;">Probetext</font>'
        );
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Highlight setzen (Gold-Farbfeld) über die floating Toolbar', async ({ page }) => {
        await openFreshWikiForm(page, 'Floating Highlight Set');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await waitForFloatingVisible(page);
        await page.locator('#floating-toolbar .color-swatch[data-color="#fbbf24"]').click();
        await expect(editor).toHaveJSProperty(
            'innerHTML',
            '<mark style="background-color: rgba(251, 191, 36, 0.4); color: inherit; border-radius: 2px; padding: 0px 2px;">Probetext</mark>'
        );
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Highlight entfernen (transparentes Farbfeld) über die floating Toolbar', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Floating Highlight Remove');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await waitForFloatingVisible(page);
        await page.locator('#floating-toolbar .color-swatch[data-color="#fbbf24"]').click();
        await editor.click();
        await editor.selectText();
        await waitForFloatingVisible(page);
        await page.locator('#floating-toolbar .color-swatch[data-color="transparent"]').click();
        await expect(editor).toHaveJSProperty('innerHTML', TESTTEXT);
        await expect(editor.evaluate(el => el.textContent)).resolves.toBe(TESTTEXT);
    });

    test('Format entfernen über die floating Toolbar löst Fett + Highlight + Rahmen komplett auf, ohne Inhaltsverlust', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Floating RemoveFormat');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await waitForFloatingVisible(page);
        await page.locator('#floating-toolbar [data-floating-action="bold"]').click();
        await expect(editor).toHaveJSProperty('innerHTML', NETZ.bold);

        await editor.selectText();
        await waitForFloatingVisible(page);
        await page.locator('#floating-toolbar .color-swatch[data-color="#fbbf24"]').click();
        await expect(editor).toHaveJSProperty(
            'innerHTML',
            '<mark style="background-color: rgba(251, 191, 36, 0.4); color: inherit; border-radius: 2px; padding: 0px 2px;"><b>Probetext</b></mark>'
        );

        await editor.selectText();
        await waitForFloatingVisible(page);
        await page.locator('#floating-toolbar [data-floating-action="border"]').click();
        await expect(editor).toHaveJSProperty(
            'innerHTML',
            '<span class="editor-border" style="border: 1px solid var(--gold); padding: 2px 6px; border-radius: 4px; display: inline-block;"><mark style="background-color: rgba(251, 191, 36, 0.4); color: inherit; border-radius: 2px; padding: 0px 2px;"><b>Probetext</b></mark></span>'
        );

        await editor.selectText();
        await waitForFloatingVisible(page);
        await page.locator('#floating-toolbar [data-floating-action="removeFormat"]').click();
        await expect(editor).toHaveJSProperty('innerHTML', TESTTEXT);
        await expect(editor.evaluate(el => el.textContent)).resolves.toBe(TESTTEXT);
    });
});

// ---------------------------------------------------------------
// Task 2: Persistenz-Roundtrip (floating) — mind. Fett, Schriftart,
// Schriftgröße, Highlight
// ---------------------------------------------------------------
test.describe('Persistenz-Roundtrip (floating)', () => {
    test.beforeEach(async ({ page }) => {
        await gotoBundleFresh(page);
    });

    test('Fett über die floating Toolbar übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'Floating RT Bold');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await waitForFloatingVisible(page);
        await page.locator('#floating-toolbar [data-floating-action="bold"]').click();
        const reopened = await saveAndReopenWikiEntry(page, 'Floating RT Bold');
        await expect(reopened).toHaveJSProperty('innerHTML', NETZ.bold);
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Schriftart (Serif) über die floating Toolbar übersteht Speichern/Reload', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Floating RT Font');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await waitForFloatingVisible(page);
        await page.selectOption('#floating-toolbar [data-floating-action="font"]', 'serif');
        const reopened = await saveAndReopenWikiEntry(page, 'Floating RT Font');
        await expect(reopened).toHaveJSProperty(
            'innerHTML',
            '<font face="Georgia, Times New Roman, serif">Probetext</font>'
        );
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Schriftgröße (1.5em) über die floating Toolbar übersteht Speichern/Reload', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Floating RT FontSize');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await waitForFloatingVisible(page);
        await page.selectOption('#floating-toolbar [data-floating-action="fontSize"]', '1.5em');
        const reopened = await saveAndReopenWikiEntry(page, 'Floating RT FontSize');
        // sanitizeHTML() serialisiert das style-Attribut neu (kein trailing ';'),
        // analog zum statischen-Toolbar-Befund aus 09-02.
        await expect(reopened).toHaveJSProperty(
            'innerHTML',
            '<font style="font-size: 1.5em">Probetext</font>'
        );
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('Highlight setzen über die floating Toolbar übersteht Speichern/Reload', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Floating RT Highlight');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await waitForFloatingVisible(page);
        await page.locator('#floating-toolbar .color-swatch[data-color="#fbbf24"]').click();
        const reopened = await saveAndReopenWikiEntry(page, 'Floating RT Highlight');
        // border-radius ist nicht im style-Whitelist von sanitizeHTML() (utils/basic.js)
        // — fällt beim Roundtrip weg, analog zum statischen-Toolbar-Befund aus 09-02.
        await expect(reopened).toHaveJSProperty(
            'innerHTML',
            '<mark style="background-color: rgba(251, 191, 36, 0.4); color: inherit; padding: 0px 2px">Probetext</mark>'
        );
        await expect(reopened.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });
});

// ---------------------------------------------------------------
// Task 3: UI-lose Zweige von formatText (kein Toolbar-Pfad vorhanden)
//
// Der Grep aus 09-BASELINE.md/A2 belegt: KEIN Template in der gesamten App
// löst data-editor="heading"|"font"|"highlight" aus (09-RESEARCH.md Pitfall 3).
// Diese vier Call-Sites (Zeilen 339/341/344/346 in ui/editors/rich-text.js)
// werden in Plan 09-06 migriert und brauchen dennoch einen Vorher-Beweis —
// deshalb hier per direktem window.formatText()-Aufruf statt UI-Klick
// ---------------------------------------------------------------
test.describe('UI-lose Zweige (kein Toolbar-Pfad vorhanden)', () => {
    test.beforeEach(async ({ page }) => {
        await gotoBundleFresh(page);
    });

    test('heading: window.formatText direkt aufgerufen (kein Template referenziert data-editor="heading")', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Floating UILos Heading');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        const html = await page.evaluate(() => {
            window.formatText('wiki-content', 'heading');
            return document.getElementById('wiki-content').innerHTML;
        });
        expect(html).toBe('<h4>Probetext</h4>');
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('font: window.formatText direkt aufgerufen (kein Template referenziert data-editor="font")', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Floating UILos Font');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        const html = await page.evaluate(() => {
            window.formatText('wiki-content', 'font', 'Arial');
            return document.getElementById('wiki-content').innerHTML;
        });
        expect(html).toBe('<font face="Arial">Probetext</font>');
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('highlight (Farbwert): window.formatText direkt aufgerufen (kein Template referenziert data-editor="highlight")', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Floating UILos Highlight Farbe');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        const html = await page.evaluate(() => {
            window.formatText('wiki-content', 'highlight', '#fbbf24');
            return document.getElementById('wiki-content').innerHTML;
        });
        expect(html).toBe('<span style="background-color: rgb(251, 191, 36);">Probetext</span>');
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });

    test('highlight (Wert "none"): window.formatText direkt aufgerufen nach vorherigem mark-basiertem set-highlight-color (09-BASELINE.md Zeile 344)', async ({
        page
    }) => {
        await openFreshWikiForm(page, 'Floating UILos Highlight None');
        const editor = page.locator('#wiki-content');
        await typeAndSelectAll(editor, TESTTEXT);
        await page.selectOption(
            '[data-action="set-highlight-color"][data-editor="wiki-content"]',
            '#fbbf24'
        );
        await expect(editor).toHaveJSProperty(
            'innerHTML',
            '<mark style="background-color: rgba(251, 191, 36, 0.4); color: inherit; border-radius: 2px; padding: 0px 3px;">Probetext</mark>'
        );
        await editor.click();
        await editor.selectText();
        const html = await page.evaluate(() => {
            window.formatText('wiki-content', 'highlight', 'none');
            return document.getElementById('wiki-content').innerHTML;
        });
        // removeFormat() entfernt nur die background-color-Style-Eigenschaft —
        // das <mark>-Element selbst bleibt (execCommand entpackt keine
        // Custom-Elemente). 09-BASELINE.md Zeile 344 empirisch bestätigt.
        expect(html).toBe('<mark style="border-radius: 2px; padding: 0px 3px;">Probetext</mark>');
        await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
    });
});

// ---------------------------------------------------------------
// Task 3: Zählnachweis — Anker für die execCommand-Ablösung (Plan 09-09)
//
// Netz-Freeze-Ausnahme (09-BASELINE.md, "Verfahren bei rotem Netz-Test"):
// Dieser Zaehlwert ist der EINZIGE im gesamten Netz, der waehrend der
// Migration angepasst werden darf, weil er selbst den Fortschritt misst
// (kein Verhalten des Editors). Plan 09-06/Gruppe A hat 5 Call-Sites in
// formatText() migriert (bold/italic/underline/strikethrough/list) — der
// Zwischenstand nach diesem Schritt ist 16 (21 - 5), dokumentiert in
// 09-BASELINE.md Abschnitt "Netz-Freeze". Der Endwert 0 wird in Plan 09-09
// gesetzt, sobald alle 21 Call-Sites migriert sind.
// ---------------------------------------------------------------
test.describe('Inventar-Zählnachweis (bewusst änderbar während der Migration)', () => {
    test('ZÄHLNACHWEIS: ui/editors/rich-text.js enthält 16 execCommand-Vorkommen (Zwischenstand nach Plan 09-06/Gruppe A; Referenz: 09-BASELINE.md, endgültig 0 in Plan 09-09)', async () => {
        const content = fs.readFileSync('ui/editors/rich-text.js', 'utf8');
        const matches = content.match(/execCommand/g) || [];
        expect(matches.length).toBe(16);
    });
});
