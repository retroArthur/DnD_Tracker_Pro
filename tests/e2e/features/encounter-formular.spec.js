/**
 * E2E Tests — das Encounter-Formular ist mit Maus und Finger abschliessbar
 *
 * DER BEFUND. Seit 7712470 (2026-09-30) traegt `.enc-view.active` in
 * assets/styles/encounters.css `overflow: hidden` statt `overflow-y: auto`. Fuer
 * die LISTE ist das gleichgueltig (gemessen in ansichts-schalen.spec.js), aber
 * die Encounter-Ansicht ist die einzige Master-Detail-Schale mit einem
 * EINGEBETTETEN Formular: aufgeklappt ist es 1669px hoch (1440x900) bzw. 3003px
 * (390x844), die Schale 705px bzw. 583px. Mausrad und Wischen scrollen eine
 * `overflow: hidden`-Schale nicht — "Speichern" lag bei y=1791 bzw. y=3111 und
 * war nur mit 119 bzw. 111 Tabulatordruecken erreichbar. Anlegen UND Bearbeiten
 * (✏️ oeffnet dasselbe Formular) waren damit fuer Maus und Finger tot, bei
 * jeder Fenstergroesse. Die zwei anderen eingebetteten Formulare (Gruppe,
 * Session-Notizen) scrollen, gemessen.
 *
 * Der Test fuehrt ECHTE Eingaben: Mausrad am Desktop, Touch-Wischgesten am
 * Telefon (Playwright kennt keine Wischgeste; CDP Input.dispatchTouchEvent).
 * `locator.click()` allein waere wertlos — es scrollt das Ziel selbst ins Bild,
 * auch in einer `overflow: hidden`-Schale.
 */

import { test, expect } from '@playwright/test';
import { seedCleanSession } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

const SPEICHERN = '#enc-form [data-action="call"][data-value="saveEncounter"]';

const GROESSEN = [
    { name: '1440x900', viewport: { width: 1440, height: 900 }, touch: false },
    { name: '1280x720', viewport: { width: 1280, height: 720 }, touch: false },
    { name: '390x844', viewport: { width: 390, height: 844 }, touch: true }
];

/** Liegt die Mitte von `sel` im Fenster und ist das Element dort obenauf? */
async function treffbar(page, sel) {
    return page.evaluate(s => {
        const el = document.querySelector(s);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        if (y < 0 || y > window.innerHeight || x < 0 || x > window.innerWidth) return false;
        const oben = document.elementFromPoint(x, y);
        return !!oben && (oben === el || el.contains(oben));
    }, sel);
}

/**
 * Scrollt mit ECHTEN Gesten nach unten, bis `sel` treffbar ist. Gibt die Zahl
 * der Gesten zurueck, oder -1, wenn es nach `max` Gesten nicht treffbar ist.
 */
async function scrolleBis(page, sel, touch, max) {
    const { width, height } = page.viewportSize();
    const cdp = touch ? await page.context().newCDPSession(page) : null;
    for (let i = 0; i <= max; i++) {
        if (await treffbar(page, sel)) return i;
        if (i === max) break;
        if (touch) {
            const x = Math.round(width / 2);
            const start = Math.round(height * 0.7);
            const ende = Math.round(height * 0.3);
            await cdp.send('Input.dispatchTouchEvent', {
                type: 'touchStart',
                touchPoints: [{ x, y: start }]
            });
            for (let y = start - 20; y >= ende; y -= 20) {
                await cdp.send('Input.dispatchTouchEvent', {
                    type: 'touchMove',
                    touchPoints: [{ x, y }]
                });
            }
            // Der Finger haelt an, bevor er loslaesst: dann entsteht kein
            // Schwung. Mit Schwung lief die Schale in einer langsamen
            // Auslaufphase weiter, in der der ganzzahlige Scrollstand ueber
            // 300 ms stillstand — der Tap danach hielt nur den Auslauf an
            // (gemessen: touchstart/touchend ohne click, Stand 2459 statt am
            // Ende des Wegs).
            await page.waitForTimeout(150);
            await cdp.send('Input.dispatchTouchEvent', {
                type: 'touchMove',
                touchPoints: [{ x, y: ende }]
            });
            await page.waitForTimeout(150);
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        } else {
            await page.mouse.move(Math.round(width / 2), Math.round(height * 0.6));
            await page.mouse.wheel(0, 400);
        }
        await aufRuhe(page);
    }
    return -1;
}

/**
 * Wartet, bis die Schale nicht mehr nachlaeuft. Ein Tap WAEHREND des Auslaufs
 * einer Wischgeste haelt nur das Scrollen an und loest keinen Klick aus — bei
 * echten Nutzern genauso (gemessen: pointerdown/touchstart ohne click).
 *
 * "Ruhe" heisst: 300 ms lang kein neuer Scrollstand, ueber Animationsframes
 * im Browser gemessen. Die erste Fassung verglich zwei Lesungen im Abstand
 * von 80 ms von aussen; unter Last (parallele Builds und Suiten) lagen beide
 * im selben haengenden Frame, und der Tap fiel doch in den Auslauf.
 */
async function aufRuhe(page) {
    await page.evaluate(
        () =>
            new Promise(fertig => {
                const schale = document.getElementById('view-encounter');
                let stand = schale.scrollTop;
                let seit = performance.now();
                const spaetestens = seit + 5000;
                const pruefe = jetzt => {
                    if (schale.scrollTop !== stand) {
                        stand = schale.scrollTop;
                        seit = jetzt;
                    }
                    if (jetzt - seit >= 300 || jetzt > spaetestens) fertig();
                    else requestAnimationFrame(pruefe);
                };
                requestAnimationFrame(pruefe);
            })
    );
}

async function appLaden(page, encounters = []) {
    await seedCleanSession(page);
    await page.goto(APP_URL);
    // Nicht waitForAppReady(): es wartet auf `.app-title`, und den blendet das
    // Mobil-Layout aus.
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, {
        timeout: 15000
    });
    await page.evaluate(liste => {
        window.D.encounters.push(...liste);
        window.switchView('encounter');
    }, encounters);
    await expect(page.locator('#view-encounter')).toBeVisible();
}

async function bedienen(page, groesse, locator) {
    if (groesse.touch) await locator.tap();
    else await locator.click();
}

for (const groesse of GROESSEN) {
    test.describe(`Encounter-Formular ${groesse.name}`, () => {
        test.use({ viewport: groesse.viewport, hasTouch: groesse.touch, isMobile: groesse.touch });

        test('(1) Anlegen: Speichern ist per Geste erreichbar und legt den Encounter an', async ({
            page
        }) => {
            // Der Rotlauf fuehrt alle Gesten aus, ehe er urteilt: 20 Wischgesten
            // mit je ~20 Touch-Schritten brauchen laenger als die 30 s Vorgabe.
            test.setTimeout(90000);
            await appLaden(page);
            await bedienen(
                page,
                groesse,
                page.locator('#view-encounter .section-toolbar [data-action="show-enc-form"]')
            );
            await expect(page.locator('#enc-form')).toHaveClass(/\bopen\b/);
            await page.locator('#enc-name').fill('Formular-Probe');
            // Selbstpruefung: fill() darf die Schale nicht programmatisch
            // gescrollt haben — sonst misst der Gestenlauf nichts.
            expect(
                await page.evaluate(() => document.getElementById('view-encounter').scrollTop)
            ).toBe(0);

            const gesten = await scrolleBis(
                page,
                SPEICHERN,
                groesse.touch,
                groesse.touch ? 20 : 40
            );
            expect(
                gesten,
                `"Speichern" per ${groesse.touch ? 'Wischen' : 'Mausrad'} nicht erreichbar`
            ).toBeGreaterThanOrEqual(0);

            await bedienen(page, groesse, page.locator(SPEICHERN));
            await expect
                .poll(() => page.evaluate(() => window.D.encounters.map(e => e.name)))
                .toContain('Formular-Probe');
        });

        test('(2) offen scrollt die Schale, geschlossen nicht — die Liste behaelt ihre Bauart', async ({
            page
        }) => {
            await appLaden(page);
            const ueberlauf = () =>
                page.evaluate(
                    () => getComputedStyle(document.getElementById('view-encounter')).overflowY
                );
            expect(await ueberlauf()).toBe('hidden');

            await bedienen(
                page,
                groesse,
                page.locator('#view-encounter .collapsible-header[data-value="enc-form"]')
            );
            await expect(page.locator('#enc-form')).toHaveClass(/\bopen\b/);
            expect(await ueberlauf()).toBe('auto');

            await bedienen(
                page,
                groesse,
                page.locator('#view-encounter .collapsible-header[data-value="enc-form"]')
            );
            await expect(page.locator('#enc-form')).not.toHaveClass(/\bopen\b/);
            expect(await ueberlauf()).toBe('hidden');
        });
    });
}

test.describe('Encounter-Formular: Bearbeiten (1440x900)', () => {
    test('(3) ✏️ oeffnet das Formular, Speichern per Mausrad erreichbar, Aenderung kommt an', async ({
        page
    }) => {
        await page.setViewportSize(GROESSEN[0].viewport);
        await appLaden(page, [{ id: 9101, name: 'Probe-Oger', cr: '2', hp: 59, ac: 11, init: -1 }]);
        await page.evaluate(() => window.renderEncounters());
        await page.locator('.enc-item[data-id="9101"]').click();
        await page.locator('#enc-detail-panel [data-action="edit-encounter"]').click();
        await expect(page.locator('#edit-enc-id')).toHaveValue('9101');
        // Wert per Skript, nicht per fill(): fill() scrollte das Feld
        // programmatisch ins Bild und verfaelschte den Gestenlauf.
        await page.evaluate(() => {
            document.getElementById('enc-hp').value = '61';
        });

        const gesten = await scrolleBis(page, SPEICHERN, false, 40);
        expect(gesten, '"Speichern" per Mausrad nicht erreichbar').toBeGreaterThanOrEqual(0);
        await page.locator(SPEICHERN).click();
        await expect
            .poll(() => page.evaluate(() => window.D.encounters.find(e => e.id === 9101)?.hp))
            .toBe(61);
    });
});
