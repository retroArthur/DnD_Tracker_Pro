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
         * Hinweis (Endstand, Plan 10-06 — Tabellenzweig): Wird dasselbe
         * Ereignis-Attribut stattdessen INNERHALB eines <table>-Tags
         * eingefügt, griff bis Phase 10 der Tabellen-insertHTML-Zweig (Zeile
         * 958ff.) — dessen Attribut-Bereinigungs-Regex entfernte damals nur
         * eine feste Liste harmloser Attribute (class/style/width/...), NICHT
         * on*-Attribute. Ein on*-Attribut überlebte dort empirisch bis in den
         * Editor-DOM und feuerte (Bild-Fehler-Event). Der in Plan 10-04
         * ergänzte, leerraum-abhängige Ereignis-Attribut-Regex-Fix erwies
         * sich seinerseits als umgehbar (10-REVIEW.md CR-01: kein
         * trennendes Leerzeichen vor dem Attribut, dazu ein komplett
         * fehlender Tag-Allowlist- und Protokollfilter — ein eingebettetes
         * Rahmen-Element mit Inline-Dokument-Attribut führte dadurch fremden
         * Code im App-Origin aus). Seit Plan 10-06 führt der Tabellenzweig
         * sein Markup stattdessen durch den projektweiten DOM-basierten
         * Allowlist-Sanitizer (window.sanitizeHTML(), utils/basic.js) als
         * LETZTE Stufe vor dem Einfügen — siehe den Mehrfach-Vektor-Testfall
         * unten ("Sicherheits-Regression: Tabellen-Paste mit eingebettetem
         * Rahmen, Vektorgrafik und Skript-Protokoll ... (SC3, CR-01)") für
         * den maßgeblichen Beweis.
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

        /**
         * Sicherheits-Regression (Tabellenzweig, Broken-Windows-Ledger-Eintrag
         * 1, ursprünglich Phase 10 Plan 04): Spiegelt den Sicherheitstest
         * oben, aber mit einer Nutzlast MIT Tabellen-Wrapper — genau die
         * Konstellation, die laut Ledger-Eintrag 1 den Tabellenzweig von
         * handleEditorPaste() trifft. Vor dem ursprünglichen Fix überlebte
         * ein Ereignis-Attribut aus eingefügtem Tabellen-HTML unverändert bis
         * in den Editor-DOM und feuerte (empirisch bestätigt, siehe
         * .planning/WINDOWS.md Eintrag 1 und den Hinweis-Absatz oben).
         *
         * Stand nach Plan 10-06: der Tabellenzweig führt sein Markup jetzt
         * durch den projektweiten DOM-basierten Allowlist-Sanitizer
         * (window.sanitizeHTML(), utils/basic.js) als letzte Stufe vor dem
         * Einfügen. Der frühere Hinweis, dass das <img>-Element selbst als
         * inertes Markup im DOM bestehen bleibt (Plan-10-04-Minimal-Fix-Scope,
         * kein DOMParser-Umbau), ist gegenstandslos: der Allowlist-Sanitizer
         * reduziert nicht erlaubte Elemente wie <img> auf ihren Textinhalt —
         * das Bild-Element existiert nach dem Einfügen gar nicht mehr. Die
         * Assertion unten (kein Element trägt ein Attribut, dessen Name mit
         * "on" beginnt) gilt unter der neuen Kontrolle weiterhin und ist
         * dadurch strenger erfüllt, nicht schwächer — sie war zeichengleich
         * bereits vor dieser Kommentar-Korrektur vorhanden (D-04a, D-16).
         */
        test('Sicherheits-Regression: Ereignis-Attribut in eingefügtem Tabellen-Markup landet nicht ausführbar im DOM (Tabellenzweig, Broken-Windows #1)', async ({
            page
        }) => {
            // Nur echte Seitenfehler (uncaught exceptions) werden gesammelt,
            // nicht generische Konsolenmeldungen: das absichtlich kaputte
            // <img src="x"> (siehe Hinweis oben) erzeugt einen erwarteten,
            // harmlosen Ressourcen-404-Konsoleneintrag ("Failed to load
            // resource"), der kein Sicherheitssignal ist. "Seitenfehler" im
            // Sinne dieses Tests sind ausschließlich pageerror-Ereignisse.
            const errors = [];
            page.on('pageerror', e => errors.push(String(e)));

            await openFreshWikiForm(page, 'Insert Security Table');
            const editor = page.locator('#wiki-content');
            const maliciousTableHtml =
                '<table><tr><td><img src="x" onerror="window.__xssInsertTableSpec=true"></td><td>ZellText</td></tr></table>';
            await pasteInto(page, '#wiki-content', {
                html: maliciousTableHtml,
                text: 'Boesartig\tZellText'
            });
            await page.waitForTimeout(300);

            // (a) Editor-DOM direkt nach dem Einfügen: kein Element trägt ein
            // Attribut, dessen Name mit "on" beginnt; das Marker-Flag am
            // Fenster ist undefiniert; keine gesammelten Seitenfehler.
            const hasOnAttrAfterPaste = await editor.evaluate(el => {
                const nodes = el.querySelectorAll('*');
                for (const node of nodes) {
                    for (const attr of node.attributes) {
                        if (attr.name.toLowerCase().startsWith('on')) return true;
                    }
                }
                return false;
            });
            expect(hasOnAttrAfterPaste).toBe(false);
            const xssFlagAfterPaste = await page.evaluate(() => window.__xssInsertTableSpec);
            expect(xssFlagAfterPaste).toBeUndefined();
            expect(errors).toEqual([]);

            // (b) Erhaltungs-Gegenprobe: Tabelle und Zelltext kommen
            // unverändert an — der Fix entfernt ausschließlich das
            // Ereignis-Attribut, nicht die Tabelle.
            const tableCountAfterPaste = await editor.evaluate(
                el => el.querySelectorAll('table').length
            );
            expect(tableCountAfterPaste).toBeGreaterThan(0);
            await expect(editor.evaluate(el => el.textContent)).resolves.toContain('ZellText');

            // (c) Nach Speichern, Neuladen und Wiederöffnen gelten dieselben
            // Prüfungen für den geladenen Eintrag.
            const reopened = await saveAndReopenWikiEntry(page, 'Insert Security Table');
            const hasOnAttrAfterReload = await reopened.evaluate(el => {
                const nodes = el.querySelectorAll('*');
                for (const node of nodes) {
                    for (const attr of node.attributes) {
                        if (attr.name.toLowerCase().startsWith('on')) return true;
                    }
                }
                return false;
            });
            expect(hasOnAttrAfterReload).toBe(false);
            const tableCountAfterReload = await reopened.evaluate(
                el => el.querySelectorAll('table').length
            );
            expect(tableCountAfterReload).toBeGreaterThan(0);
            await expect(reopened.evaluate(el => el.textContent)).resolves.toContain('ZellText');
            const xssFlagAfterReload = await page.evaluate(() => window.__xssInsertTableSpec);
            expect(xssFlagAfterReload).toBeUndefined();
            expect(errors).toEqual([]);
        });

        /**
         * Sicherheits-Regression (SC3, CR-01, Plan 10-06): Mehrfach-Vektor-
         * Nutzlast fuer den Tabellen-Einfuegepfad. Ein reines <script>-Element
         * allein reproduziert CR-01 NICHT — Range.createContextualFragment()
         * markiert parser-erzeugte Skript-Elemente laut Spezifikation als
         * inert (09-RESEARCH.md Pattern 3+4), ein solcher Testfall liefe
         * vakuum-gruen. Der tatsaechlich funktionierende Vektor ist ein
         * eingebettetes Rahmen-Element mit Inline-Dokument-Attribut
         * (<iframe srcdoc>): dessen Inhalt wird vom Parser des eigenen,
         * aber origin-erbenden Browsing-Kontexts geparst und sofort
         * ausgefuehrt — kein Klick, kein Speichern, kein Neuladen noetig
         * (10-REVIEW.md CR-01, empirisch 3/3 gegen das Produktions-Bundle
         * reproduziert). Jede Tabellenzelle traegt genau einen unabhaengigen
         * Vektor bzw. die Erhaltungs-Gegenprobe:
         *   1: iframe srcdoc mit Skript (Marker-Flag + Titel-Ueberschreibung)
         *   2: svg mit Lade-Ereignis-Attribut (onload)
         *   3: Link mit Skript-Protokoll in Klarschrift
         *   4: Link mit entitaets-kodiertem Skript-Protokoll (Randfall Kodierung)
         *   5: Bild mit Fehler-Ereignis-Attribut OHNE trennendes Leerzeichen
         *      (der dokumentierte Umgehungsfall der Plan-10-04-Regexe)
         *   6: reiner Text als Erhaltungs-Gegenprobe
         */
        const CR01_TABELLEN_PAYLOAD =
            '<table><tr>' +
            '<td><iframe srcdoc="&lt;script&gt;window.__cr01Iframe=true;document.title=&#39;PWNED&#39;;&lt;/script&gt;"></iframe></td>' +
            '<td><svg onload="window.__cr01Svg=true"></svg></td>' +
            '<td><a href="javascript:window.__cr01Link=true">Link1</a></td>' +
            '<td><a href="&#106;avascript:window.__cr01Entity=true">Link2</a></td>' +
            '<td><img src="x"onerror="window.__cr01NoSpace=true"></td>' +
            '<td>ZellText6</td>' +
            '</tr></table>';

        test('Sicherheits-Regression: Tabellen-Paste mit eingebettetem Rahmen, Vektorgrafik und Skript-Protokoll landet weder ausführbar noch als verbotenes Element im DOM (SC3, CR-01)', async ({
            page
        }) => {
            // Nur echte Seitenfehler zaehlen als Sicherheitssignal (10-04-
            // Praezedenz, siehe Kommentar oben am 10-04-Testfall).
            const errors = [];
            page.on('pageerror', e => errors.push(String(e)));

            await openFreshWikiForm(page, 'Insert Security CR01');
            const editor = page.locator('#wiki-content');
            const titleBefore = await page.evaluate(() => document.title);

            await pasteInto(page, '#wiki-content', {
                html: CR01_TABELLEN_PAYLOAD,
                text: 'Boesartig\tZellText6'
            });
            await page.waitForTimeout(300);

            // Strukturelle Element-Zaehlung ZUERST: sofort entscheidbar, ohne
            // dass die Kernassertion von einer festen Wartezeit abhaengt
            // (Prohibition: keine Sicherheitsaussage darf an Timing haengen —
            // die Wartezeit oben dient nur dem Settle der Iframe-/SVG-Ladeereignisse,
            // nicht der Assertion selbst).
            const forbiddenCount = await editor.evaluate(
                el => el.querySelectorAll('iframe, object, embed, svg, form, script, img').length
            );
            expect(forbiddenCount).toBe(0);

            const hasOnAttr = await editor.evaluate(el => {
                const nodes = el.querySelectorAll('*');
                for (const node of nodes) {
                    for (const attr of node.attributes) {
                        if (attr.name.toLowerCase().startsWith('on')) return true;
                    }
                }
                return false;
            });
            expect(hasOnAttr).toBe(false);

            const hasDangerousAttrValue = await editor.evaluate(el => {
                const nodes = el.querySelectorAll('*');
                for (const node of nodes) {
                    for (const attr of node.attributes) {
                        const value = attr.value.toLowerCase();
                        if (value.includes('javascript:') || value.includes('data:text/html')) {
                            return true;
                        }
                    }
                }
                return false;
            });
            expect(hasDangerousAttrValue).toBe(false);

            const titleAfter = await page.evaluate(() => document.title);
            expect(titleAfter).toBe(titleBefore);

            const flags = await page.evaluate(() => ({
                iframe: window.__cr01Iframe,
                svg: window.__cr01Svg,
                link: window.__cr01Link,
                entity: window.__cr01Entity,
                noSpace: window.__cr01NoSpace
            }));
            expect(flags.iframe).toBeUndefined();
            expect(flags.svg).toBeUndefined();
            expect(flags.link).toBeUndefined();
            expect(flags.entity).toBeUndefined();
            expect(flags.noSpace).toBeUndefined();

            expect(errors).toEqual([]);

            // Erhaltungs-Gegenprobe: die Tabelle selbst und der Text der
            // sechsten (gutartigen) Zelle bleiben erhalten.
            const tableCount = await editor.evaluate(el => el.querySelectorAll('table').length);
            expect(tableCount).toBeGreaterThan(0);
            await expect(editor.evaluate(el => el.textContent)).resolves.toContain('ZellText6');
        });

        /**
         * Randfall (fail-closed, Task 1 Schritt 2d, must_haves-Truth 4): Ist
         * der Sanitizer zur Laufzeit nicht erreichbar ODER ergibt seine
         * Bereinigung des Tabellen-Abschnitts keinen Inhalt, fuegt der
         * Handler ausschliesslich den Klartext-Anteil der Zwischenablage
         * ein — es bleibt kein leeres Tabellengeruest zurueck. Beide
         * Teil-Bedingungen des "ODER" haengen im Produktionscode am selben
         * safeTable-Check; sie werden hier ueber gezieltes Stubben von
         * window.sanitizeHTML() geprueft — dasselbe dokumentierte
         * Setup-Vehikel wie D-06 (direktes Dispatch statt echter
         * Zwischenablage), das eigentliche Pruefziel bleibt der Handler.
         */
        test('Randfall: Sanitizer nicht erreichbar oder ohne Ergebnis — nur Klartext wird eingefügt, kein leeres Tabellengerüst', async ({
            page
        }) => {
            await openFreshWikiForm(page, 'Insert Security CR01 Randfall');
            const editor = page.locator('#wiki-content');

            // (a) Sanitizer nicht erreichbar — die typeof-Pruefung schlaegt fehl.
            await page.evaluate(() => {
                window.__cr01OriginalSanitize = window.sanitizeHTML;
                window.sanitizeHTML = undefined;
            });
            await pasteInto(page, '#wiki-content', {
                html: '<table><tr><td>A</td><td>B</td></tr></table>',
                text: 'A\tB'
            });
            await page.waitForTimeout(300);
            expect(await editor.evaluate(el => el.querySelectorAll('table').length)).toBe(0);
            await expect(editor.evaluate(el => el.textContent)).resolves.toContain('A\tB');

            // (b) Sanitizer erreichbar, liefert aber keinen Inhalt (nur Leerraum).
            await editor.evaluate(el => {
                el.innerHTML = '';
            });
            await page.evaluate(() => {
                window.sanitizeHTML = () => '   ';
            });
            await pasteInto(page, '#wiki-content', {
                html: '<table><tr><td>C</td><td>D</td></tr></table>',
                text: 'C\tD'
            });
            await page.waitForTimeout(300);
            expect(await editor.evaluate(el => el.querySelectorAll('table').length)).toBe(0);
            await expect(editor.evaluate(el => el.textContent)).resolves.toContain('C\tD');

            await page.evaluate(() => {
                window.sanitizeHTML = window.__cr01OriginalSanitize;
                delete window.__cr01OriginalSanitize;
            });
        });

        /**
         * Sicherheits-Regression (T-10-30, D-13, Plan 10-07): CSS-basierter
         * Ausgangs-Beacon. Eine Stil-Deklaration mit fremder
         * Ressourcen-Referenz überlebt bislang die gesamte Einfüge- und
         * Speicherkette und löst bei JEDEM Rendern eine ausgehende Anfrage
         * an die fremde Herkunft aus — Informationsabfluss (Herkunfts-IP,
         * Zeitpunkt, Browserkennung), keine Code-Ausführung. Angreifer-
         * Herkunft ist bewusst eine garantiert tote lokale Gegenstelle
         * (Port 9, "Verwerf"-Port): offline-deterministisch, keine echte
         * Fremd-Adresse wird kontaktiert. Eine Anfrage an eine tote
         * Gegenstelle erzeugt NIEMALS eine Antwort — nur ein
         * Fehlschlag-Ereignis. Ein Beobachter, der nur 'response' zählt,
         * wäre deshalb vakuum-grün; hier werden 'request' UND
         * 'requestfailed' beobachtet, damit der rote Lauf zugleich die
         * Positivkontrolle für den Beobachter selbst ist.
         *
         * Die drei Zellen variieren die NOTATIONSFORM DES STIL-ATTRIBUTS
         * selbst (doppelt/einfach/unquotiert) — nicht die Notation des
         * url()-Werts (das prüft der Unit-Vektorblock). Grund: die
         * kosmetische Attribut-Entfernungskette in handleEditorPaste()
         * greift NUR bei doppelt quotierten Attributwerten (D-01,
         * Quote-Asymmetrie, T-10-39) und entfernt style="..." bereits VOR
         * dem Sanitizer — aus einem strukturellen, nicht
         * sicherheitsrelevanten Grund. Zelle 1 (doppelt quotiert) beweist
         * deshalb nichts über die Wertprüfung; Zellen 2 und 3 (einfach
         * quotiert / unquotiert) erreichen den Sanitizer unverändert und
         * sind die eigentlichen Beweisträger für Ursache 1.
         */
        const BEACON_ORIGIN = 'http://127.0.0.1:9';
        const CSS_BEACON_TABELLEN_PAYLOAD =
            '<table><tr>' +
            `<td style="background:url('${BEACON_ORIGIN}/LEAK-DQ')">Zelle1</td>` +
            `<td style='background:url("${BEACON_ORIGIN}/LEAK-SQ")'>Zelle2</td>` +
            `<td style=background:url(${BEACON_ORIGIN}/LEAK-UQ)>Zelle3</td>` +
            '<td>ZellText4</td>' +
            '</tr></table>';

        test('Sicherheits-Regression: Stilwert mit fremder Ressourcen-Referenz erzeugt keine ausgehende Anfrage — auch nicht nach Speichern und Neuladen', async ({
            page
        }) => {
            const errors = [];
            page.on('pageerror', e => errors.push(String(e)));

            const observedRequests = [];
            const markBeaconRequest = req => {
                if (req.url().includes('127.0.0.1:9')) observedRequests.push(req.url());
            };
            page.on('request', markBeaconRequest);
            page.on('requestfailed', markBeaconRequest);

            await openFreshWikiForm(page, 'Insert Security CSS Beacon');
            const editor = page.locator('#wiki-content');

            await pasteInto(page, '#wiki-content', {
                html: CSS_BEACON_TABELLEN_PAYLOAD,
                text: 'Zelle1\tZelle2\tZelle3\tZellText4'
            });

            // Strukturell zuerst, sofort entscheidbar: kein Stil-Attribut im
            // Editor trägt den Marker, keine beobachtete Anfrage.
            const hasMarkerInStyleAfterPaste = await editor.evaluate(el => {
                const nodes = el.querySelectorAll('[style]');
                for (const node of nodes) {
                    if (node.getAttribute('style').includes('LEAK')) return true;
                }
                return false;
            });
            expect(hasMarkerInStyleAfterPaste).toBe(false);
            expect(observedRequests).toEqual([]);

            // Erhaltungs-Gegenprobe: die vierte, gutartige Zelle bleibt.
            const tableCountAfterPaste = await editor.evaluate(
                el => el.querySelectorAll('table').length
            );
            expect(tableCountAfterPaste).toBeGreaterThan(0);
            await expect(editor.evaluate(el => el.textContent)).resolves.toContain('ZellText4');

            // Nach Speichern, Neuladen und Wiederöffnen gilt dieselbe
            // Prüfung — das ist der Nachweis gegen das Wiederauslösen bei
            // jedem Rendern über den gesamten Neulade-Zyklus hinweg.
            const reopened = await saveAndReopenWikiEntry(page, 'Insert Security CSS Beacon');
            const persistedHtml = await reopened.evaluate(el => el.innerHTML);
            expect(persistedHtml).not.toContain('LEAK');
            const hasMarkerInStyleAfterReload = await reopened.evaluate(el => {
                const nodes = el.querySelectorAll('[style]');
                for (const node of nodes) {
                    if (node.getAttribute('style').includes('LEAK')) return true;
                }
                return false;
            });
            expect(hasMarkerInStyleAfterReload).toBe(false);
            expect(observedRequests).toEqual([]);
            expect(errors).toEqual([]);

            const tableCountAfterReload = await reopened.evaluate(
                el => el.querySelectorAll('table').length
            );
            expect(tableCountAfterReload).toBeGreaterThan(0);
            await expect(reopened.evaluate(el => el.textContent)).resolves.toContain('ZellText4');
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
