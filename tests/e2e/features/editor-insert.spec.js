// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Editor-Regressionsnetz (execCommand-Ablösung, Phase 9, Plan 04)
 *
 * Deckt die fünf Insert-Call-Sites ab, die in Plan 09-08 migriert werden
 * (rich-text.js Zeilen 574 insertLineBreak, 615/637/642 insertHTML/insertText
 * im Paste-Handler, 674 insertHTML im insertTable()-Aufruf via Strg+Shift+T
 * bzw. Toolbar-Button). Alle Erwartungswerte unten sind EMPIRISCH am gebauten
 * Bundle erhoben (temporäre Probe-Spec, analog 09-01/09-02/09-03-Muster,
 * Chromium 143.0.7499.4, Playwright 1.57.0) und decken sich mit
 * 09-BASELINE.md (Markup-Inventar-Zeilen 574/615/637/642/674, Abschnitt A1).
 */

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

// Erwartete Werte aus 09-BASELINE.md (Zeile 574, Abschnitt A1): Enter (ohne
// Shift, von handleEditorKeydown() abgefangen) UND Shift+Enter (nativ, aber
// in Chromium 143 als weicher Zeilenumbruch spezifiziert) erzeugen identisches
// Markup. Der Setup-Call defaultParagraphSeparator (Zeile 513) hat auf keinen
// der beiden Pfade einen messbaren Effekt (A1-Schlussfolgerung).
const ENTER_ERWARTET = 'ZeileEins<br>ZeileZwei';

test.describe('Editor-Regressionsnetz — Insert-Call-Sites (Wiki)', () => {
    test.describe('Tastatur', () => {
        test.beforeEach(async ({ page }) => {
            await gotoBundleFresh(page);
        });

        test('Enter ohne Shift erzeugt insertLineBreak-Markup (Zeile 574)', async ({ page }) => {
            await openFreshWikiForm(page, 'Insert Enter');
            const editor = page.locator('#wiki-content');
            await editor.click();
            await editor.pressSequentially('ZeileEins');
            await editor.press('Enter');
            await editor.pressSequentially('ZeileZwei');
            await expect(editor).toHaveJSProperty('innerHTML', ENTER_ERWARTET);
        });

        test('Shift+Enter erzeugt dasselbe Markup wie Enter (A1-Referenz, defaultParagraphSeparator ohne messbaren Effekt)', async ({
            page
        }) => {
            await openFreshWikiForm(page, 'Insert ShiftEnter A1');
            const editor = page.locator('#wiki-content');
            await editor.click();
            await editor.pressSequentially('ZeileEins');
            await editor.press('Shift+Enter');
            await editor.pressSequentially('ZeileZwei');
            // A1-Referenz: Plan 09-09 vergleicht gegen exakt diesen Test, wenn der
            // defaultParagraphSeparator-Setup-Call (Zeile 513) ersatzlos entfernt wird.
            await expect(editor).toHaveJSProperty('innerHTML', ENTER_ERWARTET);
        });

        test('Strg+Shift+T fügt 3×3-Tabelle ein (Zeile 674, insertTable())', async ({
            page
        }) => {
            await openFreshWikiForm(page, 'Insert CtrlShiftT');
            const editor = page.locator('#wiki-content');
            await editor.click();
            await editor.pressSequentially('Tastaturtext');
            await editor.press('Control+Shift+T');
            // Dieselbe insertTable()-Funktion wie beim Toolbar-Button-Klick
            // (09-02-Netz, NETZ.table.after) — nur der Trigger unterscheidet sich.
            await expect(editor).toHaveJSProperty(
                'innerHTML',
                'Tastaturtext<table><tbody><tr><th style="border: 1px solid var(--border); background-image: ; background-position-x: ; background-position-y: ; background-size: ; background-repeat: ; background-attachment: ; background-origin: ; background-clip: ;">Spalte 1</th><th style="border: 1px solid var(--border); background-image: ; background-position-x: ; background-position-y: ; background-size: ; background-repeat: ; background-attachment: ; background-origin: ; background-clip: ;">Spalte 2</th><th style="border: 1px solid var(--border); background-image: ; background-position-x: ; background-position-y: ; background-size: ; background-repeat: ; background-attachment: ; background-origin: ; background-clip: ;">Spalte 3</th></tr><tr><td style="border: 1px solid var(--border);"></td><td style="border: 1px solid var(--border);"></td><td style="border: 1px solid var(--border);"></td></tr><tr><td style="border: 1px solid var(--border);"></td><td style="border: 1px solid var(--border);"></td><td style="border: 1px solid var(--border);"></td></tr></tbody></table><p></p>'
            );
            const thCount = await editor.locator('th').count();
            const tdCount = await editor.locator('td').count();
            expect(thCount).toBe(3);
            expect(tdCount).toBe(6);
            await expect(editor.evaluate(el => el.textContent)).resolves.toContain(
                'Tastaturtext'
            );
        });
    });

    /**
     * Block "Zwischenablage" (D-06, 08-CONTEXT.md): Eine echte Systemzwischenablage
     * ist unter file:// in Playwright nicht zuverlässig verfügbar. Das Paste-Event
     * wird deshalb über page.evaluate mit einem selbst gebauten DataTransfer direkt
     * auf dem Editor ausgelöst — ein dokumentiertes Setup-Vehikel, kein maskierender
     * Ersatz für den geprüften Pfad: geprüft wird handleEditorPaste() (der
     * Anwendungs-Event-Handler), nicht der Browser-Zwischenablage-Dialog selbst.
     * D-06 erlaubt page.evaluate/manuelles Dispatch genau dann, wenn es dokumentiertes
     * Setup ist und das eigentliche Prüfziel ein anderes bleibt — hier: der Handler.
     */
    test.describe('Zwischenablage', () => {
        test.beforeEach(async ({ page }) => {
            await gotoBundleFresh(page);
        });

        async function pasteInto(page, editorSelector, { html, text }) {
            await page.evaluate(
                ({ selector, htmlData, textData }) => {
                    const el = document.querySelector(selector);
                    el.focus();
                    const dt = new DataTransfer();
                    if (htmlData) dt.setData('text/html', htmlData);
                    if (textData) dt.setData('text/plain', textData);
                    const evt = new ClipboardEvent('paste', {
                        clipboardData: dt,
                        bubbles: true,
                        cancelable: true
                    });
                    el.dispatchEvent(evt);
                },
                { selector: editorSelector, htmlData: html, textData: text }
            );
        }

        // Baseline-Zeile 615: Tabellen-HTML wird doppelt verschachtelt eingefügt
        // (Fund 3, 09-BASELINE.md: Doppel-Registrierung des paste-Listeners auf
        // #wiki-content — vorbestehender Bug, hier bewusst als Ist-Zustand
        // festgenagelt, NICHT behoben).
        const TABELLEN_HTML =
            '<table style="width:300px" border="1"><tr><td>A</td><td>B</td></tr></table>';
        const TABELLEN_ERWARTET =
            '<table><tbody><tr><td style="border: 1px solid var(--border);">A</td><td style="border: 1px solid var(--border);">B<table><tbody><tr><td style="border: 1px solid var(--border);">A</td><td style="border: 1px solid var(--border);">B</td></tr></tbody></table></td></tr></tbody></table>';
        const TABELLEN_ROUNDTRIP =
            '<table><tbody><tr><td style="border: 1px solid var(--border)">A</td><td style="border: 1px solid var(--border)">B<table><tbody><tr><td style="border: 1px solid var(--border)">A</td><td style="border: 1px solid var(--border)">B</td></tr></tbody></table></td></tr></tbody></table>';

        test('Tabellen-HTML einfügen (Zeile 615, doppelt verschachtelt — Fund 3 eingefroren)', async ({
            page
        }) => {
            await openFreshWikiForm(page, 'Insert PasteTable');
            const editor = page.locator('#wiki-content');
            await pasteInto(page, '#wiki-content', { html: TABELLEN_HTML, text: 'A\tB' });
            await expect(editor).toHaveJSProperty('innerHTML', TABELLEN_ERWARTET);
            const tdCount = await editor.locator('td').count();
            expect(tdCount).toBe(4);
        });

        test('Tabulatorgetrennter Text wird als Tabelle eingefügt (Zeile 637, doppelt verschachtelt — Fund 3 eingefroren)', async ({
            page
        }) => {
            await openFreshWikiForm(page, 'Insert PasteTab');
            const editor = page.locator('#wiki-content');
            const text = 'Kopf1\tKopf2\nWert1\tWert2';
            await pasteInto(page, '#wiki-content', { html: '', text });
            await expect(editor).toHaveJSProperty(
                'innerHTML',
                '<table><tbody><tr><th style="border: 1px solid var(--border); background-image: ; background-position-x: ; background-position-y: ; background-size: ; background-repeat: ; background-attachment: ; background-origin: ; background-clip: ;">Kopf1</th><th style="border: 1px solid var(--border); background-image: ; background-position-x: ; background-position-y: ; background-size: ; background-repeat: ; background-attachment: ; background-origin: ; background-clip: ;">Kopf2</th></tr><tr><td style="border: 1px solid var(--border);">Wert1</td><td style="border: 1px solid var(--border);">Wert2<table><tbody><tr><th style="border: 1px solid var(--border); background-image: ; background-position-x: ; background-position-y: ; background-size: ; background-repeat: ; background-attachment: ; background-origin: ; background-clip: ;">Kopf1</th><th style="border: 1px solid var(--border); background-image: ; background-position-x: ; background-position-y: ; background-size: ; background-repeat: ; background-attachment: ; background-origin: ; background-clip: ;">Kopf2</th></tr><tr><td style="border: 1px solid var(--border);">Wert1</td><td style="border: 1px solid var(--border);">Wert2</td></tr></tbody></table></td></tr></tbody></table>'
            );
            const thCount = await editor.locator('th').count();
            const tdCount = await editor.locator('td').count();
            expect(thCount).toBe(4);
            expect(tdCount).toBe(4);
        });

        // Baseline-Zeile 642: Reiner Text ohne Tab wird doppelt eingefügt (derselbe
        // Fund-3-Root-Cause wie 615/637 — hier trifft es insertText statt insertHTML).
        const PLAIN_ERWARTET = 'Reiner Text ohne TabReiner Text ohne Tab';

        test('Reiner Text ohne Tab wird doppelt eingefügt (Zeile 642 — Fund 3 eingefroren)', async ({
            page
        }) => {
            await openFreshWikiForm(page, 'Insert PastePlain');
            const editor = page.locator('#wiki-content');
            await pasteInto(page, '#wiki-content', { html: '', text: 'Reiner Text ohne Tab' });
            await expect(editor).toHaveJSProperty('innerHTML', PLAIN_ERWARTET);
        });

        /**
         * Sicherheits-Regression (T-09-01, Vorher-Beweis für die Migration in
         * Plan 09-08): Ein Einfüge-Fragment mit einem Ereignis-Attribut (onerror
         * auf einem Bild) und einem Skript-Element wird eingefügt. Empirisch
         * bestätigt: da das HTML-Fragment KEIN <table>-Element enthält, greift
         * KEINER der beiden insertHTML-Zweige in handleEditorPaste() (Zeilen
         * 615/637 sind ausschließlich Tabellen-Pfade) — der Handler fällt auf den
         * reinen insertText()-Zweig (Zeile 642) zurück, der nur den text/plain-Anteil
         * der Zwischenablage einfügt. Das Ergebnis ist reiner (doppelter, Fund 3)
         * Text ohne jedes Markup — kein Skript-Element, kein on*-Attribut kann
         * dadurch je im Editor-DOM landen.
         *
         * Hinweis (dokumentierter Fund, NICHT Teil dieses Tests, NICHT behoben):
         * Wird dasselbe Ereignis-Attribut stattdessen INNERHALB eines <table>-Tags
         * eingefügt, greift der Tabellen-insertHTML-Zweig (Zeile 615/637) — dessen
         * Attribut-Bereinigungs-Regex entfernt nur eine feste Liste harmloser
         * Attribute (class/style/width/...), NICHT on*-Attribute. Ein
         * on*-Attribut überlebt dort empirisch bis in den Editor-DOM und feuert
         * (Bild-Fehler-Event). Dies ist ein vorbestehender, von dieser Migration
         * unabhängiger Fund (kein Produktionscode-Fix in diesem Plan — "Kein
         * Produktionscode geändert" ist Plan-Verifikationskriterium) und wird als
         * Deviation in der SUMMARY sowie im WINDOWS.md-Ledger festgehalten.
         */
        test('Sicherheits-Regression: Einfüge-Fragment mit Ereignis-Attribut und Skript-Element landet nicht ausführbar im DOM', async ({
            page
        }) => {
            const errors = [];
            page.on('pageerror', e => errors.push(String(e)));
            page.on('console', msg => {
                if (msg.type() === 'error') errors.push(msg.text());
            });

            await openFreshWikiForm(page, 'Insert Security');
            const editor = page.locator('#wiki-content');
            const maliciousHtml =
                '<img src="x" onerror="window.__xssInsertSpec=true"><script>window.__xssInsertSpecScript=true;</script>BoesartigerText';
            await pasteInto(page, '#wiki-content', {
                html: maliciousHtml,
                text: 'BoesartigerText'
            });

            // (a) Editor-DOM direkt nach dem Einfügen: kein Skript-Element, kein
            // Attribut mit on-Präfix.
            const scriptCountAfterPaste = await editor.evaluate(
                el => el.querySelectorAll('script').length
            );
            const hasOnAttrAfterPaste = await editor.evaluate(el => {
                const nodes = el.querySelectorAll('*');
                for (const node of nodes) {
                    for (const attr of node.attributes) {
                        if (attr.name.toLowerCase().startsWith('on')) return true;
                    }
                }
                return false;
            });
            expect(scriptCountAfterPaste).toBe(0);
            expect(hasOnAttrAfterPaste).toBe(false);

            // (b) Nach Speichern + Reload + Wiedereröffnen gilt dieselbe Prüfung
            // für den geladenen Eintrag.
            const reopened = await saveAndReopenWikiEntry(page, 'Insert Security');
            const scriptCountAfterReload = await reopened.evaluate(
                el => el.querySelectorAll('script').length
            );
            const hasOnAttrAfterReload = await reopened.evaluate(el => {
                const nodes = el.querySelectorAll('*');
                for (const node of nodes) {
                    for (const attr of node.attributes) {
                        if (attr.name.toLowerCase().startsWith('on')) return true;
                    }
                }
                return false;
            });
            expect(scriptCountAfterReload).toBe(0);
            expect(hasOnAttrAfterReload).toBe(false);

            // (c) Kein Hinweis auf ausgeführten Fremdcode (weder pageerror noch
            // die von den Payloads gesetzten Marker-Flags).
            expect(errors).toEqual([]);
            const xssFlags = await page.evaluate(() => ({
                xss: window.__xssInsertSpec,
                xssScript: window.__xssInsertSpecScript
            }));
            expect(xssFlags.xss).toBeUndefined();
            expect(xssFlags.xssScript).toBeUndefined();
        });
    });
});

test.describe('Persistenz-Roundtrip (Insert-Call-Sites)', () => {
    test.beforeEach(async ({ page }) => {
        await gotoBundleFresh(page);
    });

    async function pasteInto(page, editorSelector, { html, text }) {
        await page.evaluate(
            ({ selector, htmlData, textData }) => {
                const el = document.querySelector(selector);
                el.focus();
                const dt = new DataTransfer();
                if (htmlData) dt.setData('text/html', htmlData);
                if (textData) dt.setData('text/plain', textData);
                const evt = new ClipboardEvent('paste', {
                    clipboardData: dt,
                    bubbles: true,
                    cancelable: true
                });
                el.dispatchEvent(evt);
            },
            { selector: editorSelector, htmlData: html, textData: text }
        );
    }

    test('Reiner Text (Paste) übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT Insert Plain');
        await pasteInto(page, '#wiki-content', { html: '', text: 'Reiner Text ohne Tab' });
        const reopened = await saveAndReopenWikiEntry(page, 'RT Insert Plain');
        await expect(reopened).toHaveJSProperty(
            'innerHTML',
            'Reiner Text ohne TabReiner Text ohne Tab'
        );
    });

    test('Tabellen-HTML (Paste) übersteht Speichern/Reload', async ({ page }) => {
        await openFreshWikiForm(page, 'RT Insert Table');
        const tableHtml =
            '<table style="width:300px" border="1"><tr><td>A</td><td>B</td></tr></table>';
        await pasteInto(page, '#wiki-content', { html: tableHtml, text: 'A\tB' });
        const reopened = await saveAndReopenWikiEntry(page, 'RT Insert Table');
        await expect(reopened).toHaveJSProperty(
            'innerHTML',
            '<table><tbody><tr><td style="border: 1px solid var(--border)">A</td><td style="border: 1px solid var(--border)">B<table><tbody><tr><td style="border: 1px solid var(--border)">A</td><td style="border: 1px solid var(--border)">B</td></tr></tbody></table></td></tr></tbody></table>'
        );
        const tdCount = await reopened.locator('td').count();
        expect(tdCount).toBe(4);
    });
});
