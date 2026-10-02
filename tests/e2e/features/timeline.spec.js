/**
 * E2E Tests — Kalender-/Timeline-Tab
 *
 * Aufgeteilt aus der frueheren Welt-&-Story-Sammel-Spec (Phase 14, TEST-04/DEBT-28).
 * Ursprünglich Teil der Phase-5-„Wave-0"-Sammel-Spec für Welt & Story; hier als
 * dedizierte Datei für den Timeline-Bereich (features/timeline/). Die Blockbeschriftung
 * "Kalender-Tab" ist Testtext und bleibt unverändert — Verhaltensneutralität (D-05).
 * Referenz-Tab-Name: kalender
 */

import { test, expect } from '@playwright/test';

// App-URL über file:// (Projekt-Konvention, analog bestiary.spec.js) — kein Dev-Server nötig
const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

// ============================================================
// WELT-03: Timeline & Kalender — Tab "kalender" (aktiviert Plan 05-05)
// ============================================================
test.describe('WELT-03: Kalender-Tab', () => {
    test('Tab kalender ist sichtbar und anklickbar', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('kalender'));
        await expect(page.locator('#view-kalender')).toBeVisible();
    });

    test('Kalender zeigt Harptos-Monatsnamen', async ({ page }) => {
        await page.goto(APP_URL);
        // Kalender auf Hammer setzen
        await page.evaluate(() => {
            if (window.D && window.D.calendar) {
                window.D.calendar.day = 1;
                window.D.calendar.month = 1;
                window.D.calendar.year = 1492;
            }
        });
        await page.evaluate(() => window.switchView('kalender'));
        await page.waitForTimeout(200);
        // #kalender-monat-anzeige muss Monatsnamen enthalten
        const anzeigeText = await page.locator('#kalender-monat-anzeige').innerText();
        expect(anzeigeText).toContain('Hammer');
        expect(anzeigeText).toContain('1492 DR');
    });

    test('Timeline-Eintrag kann via addCalendarEvent angelegt werden', async ({ page }) => {
        await page.goto(APP_URL);
        const evtCount = await page.evaluate(() => {
            if (!window.D || !window.D.calendar) return -1;
            // addCalendarEvent direkt aufrufen
            if (typeof window.addCalendarEvent === 'function') {
                window.addCalendarEvent(
                    { tag: 5, monat: 3, jahr: 1492 },
                    'Testevent',
                    'manuell',
                    null
                );
            }
            return window.D.calendar.events.length;
        });
        expect(evtCount).toBeGreaterThanOrEqual(1);
    });

    test('Einträge erscheinen chronologisch sortiert (sortiereTimelineEvents)', async ({ page }) => {
        await page.goto(APP_URL);
        const sorted = await page.evaluate(() => {
            if (!window.sortiereTimelineEvents) return null;
            var events = [
                { datum: { tag: 15, monat: 3, jahr: 1492 }, titel: 'C' },
                { datum: { tag: 1,  monat: 1, jahr: 1492 }, titel: 'A' },
                { datum: { tag: 5,  monat: 2, jahr: 1492 }, titel: 'B' }
            ];
            return window.sortiereTimelineEvents(events).map(function(e) { return e.titel; });
        });
        expect(sorted).toEqual(['A', 'B', 'C']);
    });
});

// ============================================================
// UAT-Gap U4 — der Ereignis-Dialog nach dem abgenommenen Hausmuster
// ============================================================
// Vorlage ist der Praezedenzfall 4cb9a5b/85d0719 (NPC-Generator) samt seinem
// Waechter tests/e2e/features/npc-generator.spec.js ("Generator oeffnet als
// zentriertes, fixiertes Modal-Overlay"). Derselbe zweiteilige Vertragsbruch
// steckte in showTimelineModal(): das aeussere Element trug `active` statt
// `show` (ein Selektor `.modal-overlay.active` hat in diesem Baum NIE
// existiert, `git log -S` ist leer), die Karte `modal-box` statt `modal`
// (0 CSS-Regeln, einziges Vorkommen im Baum). Gemessen am Buendel vom
// 2026-10-01 VOR der Korrektur: display none, opacity 0, Rechteck 0x0,
// Konsole stumm.
test.describe('UAT-Gap U4: Ereignis-Dialog', () => {
    // Beide Aufrufstellen von show-timeline-modal liegen in #view-kalender:
    // die Werkzeugleiste (assets/templates/view-welt.html) und die
    // Harptos-Datumszeile (renderKalender()).
    const AUFRUFSTELLEN = [
        [
            'Werkzeugleiste',
            '#view-kalender .section-toolbar-actions [data-action="show-timeline-modal"]'
        ],
        ['Datumszeile', '#tl-kalender-header [data-action="show-timeline-modal"]']
    ];

    for (const [name, selektor] of AUFRUFSTELLEN) {
        test(`oeffnet als zentriertes, fixiertes Modal-Overlay — Aufrufstelle ${name}`, async ({
            page
        }) => {
            await page.goto(APP_URL);
            await page.evaluate(() => window.switchView('kalender'));
            await page.waitForTimeout(250);
            await page.locator(selektor).click();

            // (1) sichtbar — vor der Korrektur rot: display none, Rechteck 0x0
            await expect(page.locator('#tl-event-modal')).toBeVisible({ timeout: 3000 });

            const mass = await page.evaluate(() => {
                const el = document.getElementById('tl-event-modal');
                const cs = getComputedStyle(el);
                const r = el.getBoundingClientRect();
                const karte = el.querySelector('.modal');
                const kr = karte ? karte.getBoundingClientRect() : null;
                return {
                    klassen: el.className,
                    display: cs.display,
                    opacity: cs.opacity,
                    position: cs.position,
                    breite: Math.round(r.width),
                    hoehe: Math.round(r.height),
                    karteVorhanden: !!karte,
                    karteBreite: kr ? Math.round(kr.width) : 0,
                    modalBoxZahl: el.querySelectorAll('.modal-box').length
                };
            });

            // (2) der Sichtschalter heisst show, nicht active
            expect(mass.klassen).toContain('modal-overlay');
            expect(mass.klassen).toContain('show');
            expect(mass.klassen).not.toContain('active');

            // (3) die berechnete Geometrie ist die eines Overlays
            expect(mass.position).toBe('fixed');
            expect(mass.display).toBe('flex');
            expect(mass.opacity).toBe('1');
            expect(mass.breite).toBeGreaterThan(0);
            expect(mass.hoehe).toBeGreaterThan(0);

            // (4) die Kartenklasse heisst modal, nicht modal-box
            expect(mass.karteVorhanden).toBe(true);
            expect(mass.karteBreite).toBeGreaterThan(0);
            expect(mass.modalBoxZahl).toBe(0);
        });
    }

    test('kein Formularfeld ragt aus der Karte, und jede Beschriftung steht UEBER ihrem Feld', async ({
        page
    }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('kalender'));
        await page.waitForTimeout(250);
        await page
            .locator('#view-kalender .section-toolbar-actions [data-action="show-timeline-modal"]')
            .click();
        await expect(page.locator('#tl-event-modal')).toBeVisible({ timeout: 3000 });

        const mass = await page.evaluate(() => {
            const karte = document.querySelector('#tl-event-modal .modal');
            if (!karte) return { karte: false, felder: [], labels: [] };
            const kr = karte.getBoundingClientRect();
            const felder = [...karte.querySelectorAll('.form-control')].map(el => ({
                id: el.id || el.className,
                ueberstand: Math.round(el.getBoundingClientRect().right - kr.right)
            }));
            const labels = [...karte.querySelectorAll('.form-label')].map(el => ({
                text: el.textContent.trim().slice(0, 20),
                display: getComputedStyle(el).display
            }));
            return { karte: true, karteBreite: Math.round(kr.width), felder, labels };
        });

        expect(mass.karte).toBe(true);
        // Vor der Korrektur ragte #tl-form-jahr 68px aus der 500px-Karte,
        // weil .form-control ueberhaupt keine CSS-Regel hatte und das
        // Zahlenfeld seine native Eigenbreite von 173px behielt.
        const ragen = mass.felder.filter(f => f.ueberstand > 0);
        expect(ragen, `Felder mit Ueberstand: ${JSON.stringify(ragen)}`).toEqual([]);
        expect(mass.felder.length).toBeGreaterThanOrEqual(6);

        // Vor der Korrektur standen alle 6 Beschriftungen auf display:inline,
        // also NEBEN dem Feld statt darueber.
        const inline = mass.labels.filter(l => l.display !== 'block');
        expect(inline, `Beschriftungen ohne display:block: ${JSON.stringify(inline)}`).toEqual([]);
        expect(mass.labels.length).toBeGreaterThanOrEqual(6);
    });

    test('der Schliessknopf ist gestaltet, kein nativer Systemknopf', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('kalender'));
        await page.waitForTimeout(250);
        await page
            .locator('#view-kalender .section-toolbar-actions [data-action="show-timeline-modal"]')
            .click();
        await expect(page.locator('#tl-event-modal')).toBeVisible({ timeout: 3000 });

        const mass = await page.evaluate(() => {
            const b = document.querySelector('#tl-event-modal .modal-close');
            if (!b) return { knopf: false };
            const cs = getComputedStyle(b);
            return {
                knopf: true,
                rahmenstil: cs.borderTopStyle,
                hintergrund: cs.backgroundColor,
                cursor: cs.cursor
            };
        });
        expect(mass.knopf).toBe(true);
        // Vor der Korrektur hatte .modal-close 0 CSS-Regeln im ganzen Baum:
        // gemessen 2px outset, rgb(107, 107, 107), cursor default — der graue
        // Systemknopf des Browsers, in sieben Modalen der Anwendung.
        expect(mass.rahmenstil).not.toBe('outset');
        expect(mass.hintergrund).toBe('rgba(0, 0, 0, 0)');
        expect(mass.cursor).toBe('pointer');
    });

    test('Escape raeumt den Dialogknoten weg, nicht nur die Klasse', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('kalender'));
        await page.waitForTimeout(250);
        await page
            .locator('#view-kalender .section-toolbar-actions [data-action="show-timeline-modal"]')
            .click();
        await expect(page.locator('#tl-event-modal')).toBeVisible({ timeout: 3000 });

        await page.keyboard.press('Escape');
        await page.waitForTimeout(250);
        // Vor der Korrektur nahm keyboard-shortcuts.js nur die Klasse `show`
        // ab; der Knoten samt seiner sechs Feld-IDs blieb liegen.
        const zahl = await page.evaluate(() => document.querySelectorAll('#tl-event-modal').length);
        expect(zahl).toBe(0);
    });

    test('Ansichtswechsel raeumt den Dialogknoten weg (Cleanup-Hook wie beim NPC-Generator)', async ({
        page
    }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('kalender'));
        await page.waitForTimeout(250);
        await page
            .locator('#view-kalender .section-toolbar-actions [data-action="show-timeline-modal"]')
            .click();
        await expect(page.locator('#tl-event-modal')).toBeVisible({ timeout: 3000 });

        await page.evaluate(() => window.switchView('dashboard'));
        await page.waitForTimeout(250);
        const zahl = await page.evaluate(() => document.querySelectorAll('#tl-event-modal').length);
        expect(zahl).toBe(0);
    });

    test('der Speicherweg legt das Ereignis an und schliesst den Dialog', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('kalender'));
        await page.waitForTimeout(250);
        await page
            .locator('#view-kalender .section-toolbar-actions [data-action="show-timeline-modal"]')
            .click();
        await expect(page.locator('#tl-event-modal')).toBeVisible({ timeout: 3000 });

        // fill() scheitert vor der Korrektur, weil das Feld in einem
        // display:none-Overlay liegt.
        await page.fill('#tl-form-titel', 'U4-Ereignis', { timeout: 4000 });
        await page.locator('#tl-event-modal [data-action="save-timeline-event"]').click();
        await page.waitForTimeout(400);

        const nach = await page.evaluate(() => ({
            titel: (window.D.calendar.events || []).map(e => e.titel),
            knoten: document.querySelectorAll('#tl-event-modal').length
        }));
        expect(nach.titel).toContain('U4-Ereignis');
        expect(nach.knoten).toBe(0);
    });
});
