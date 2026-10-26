/**
 * E2E Tests — das Encounter-Detail am Telefon (Vollbild mit "← Liste")
 *
 * DER BEFUND. Unter 900px Fensterbreite setzt assets/styles/encounters.css
 * `.enc-detail { display: none }` (11b2465, 2026-03-27). Statblock und die
 * Knoepfe ⚔️ ✏️ 🗑️ stehen aber NUR im Detail (seit 254ff3b, 2025-12-29, als
 * die Listenknoepfe verschwanden). Gemessen bei 390x844, 360x740, 320x700 und
 * 900x800: ein Tap auf einen Eintrag wechselt nur den Goldrahmen; einen
 * gespeicherten Encounter ansehen, bearbeiten oder loeschen ging nicht, in die
 * Initiative kam er nur ueber den Rechner — mit falschen Werten.
 *
 * DIE ENTSCHEIDUNG (Nutzer, 2026-10-26): Vollbild mit Zurueck. Ein Tap auf
 * einen Eintrag oeffnet das Detail bildschirmfuellend, "← Liste" fuehrt
 * zurueck. Automatische Auswahlen (Suche, Neuzeichnen) oeffnen nichts. Ueber
 * 900px bleibt alles, wie es ist.
 */

import { test, expect } from '@playwright/test';
import { seedCleanSession } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

const ORK = {
    id: 9201,
    name: 'Probe-Ork',
    cr: '1/2',
    hp: 15,
    ac: 13,
    init: 1,
    creatureType: 'Humanoid'
};
const WOLF = {
    id: 9202,
    name: 'Probe-Wolf',
    cr: '1/4',
    hp: 11,
    ac: 12,
    init: 2,
    creatureType: 'Tier'
};

const SCHMAL = [
    { name: '390x844', viewport: { width: 390, height: 844 }, touch: true },
    { name: '360x740', viewport: { width: 360, height: 740 }, touch: true },
    { name: '320x700', viewport: { width: 320, height: 700 }, touch: true },
    { name: '900x800', viewport: { width: 900, height: 800 }, touch: false }
];

const DETAIL = '#enc-detail-panel';
const ZURUECK = `${DETAIL} [data-action="close-encounter-detail"]`;
const KAMPF = `${DETAIL} [data-action="load-encounter"]`;
const BEARBEITEN = `${DETAIL} [data-action="edit-encounter"]`;
const LOESCHEN = `${DETAIL} [data-action="delete-encounter"]`;

async function appLaden(page) {
    await seedCleanSession(page);
    await page.goto(APP_URL);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, {
        timeout: 15000
    });
    await page.evaluate(
        ([ork, wolf]) => {
            window.D.encounters.push({ ...ork }, { ...wolf });
            window.switchView('encounter');
            window.renderEncounters();
        },
        [ORK, WOLF]
    );
    await expect(page.locator(`.enc-item[data-id="${WOLF.id}"]`)).toBeVisible();
}

/** Sichtbar UND an seiner Mitte obenauf (nicht verdeckt, im Fenster). */
async function treffbar(page, sel) {
    return page.evaluate(s => {
        const el = document.querySelector(s);
        if (!el || !el.checkVisibility()) return false;
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        if (y < 0 || y > window.innerHeight || x < 0 || x > window.innerWidth) return false;
        const oben = document.elementFromPoint(x, y);
        return !!oben && (oben === el || el.contains(oben));
    }, sel);
}

async function bedienen(page, touch, sel) {
    const ziel = page.locator(sel);
    // Erst die Zusicherung, dann die Geste: rot soll "nicht sichtbar" heissen,
    // nicht "Zeitueberschreitung beim Tippen".
    await expect(ziel, `${sel} ist nicht sichtbar`).toBeVisible({ timeout: 2000 });
    if (touch) {
        // Zwei Taps binnen 300 ms: der zweite loest KEINEN click aus — die App
        // selbst verwirft ihn (systems/avatars.js, initTouchOptimizations:
        // preventDefault auf touchend an einem Knopf binnen 300 ms nach dem
        // vorigen). Gemessen: touchstart/touchend ohne click, mit 500 ms Pause
        // dagegen click. Ein Mensch tippt nicht so schnell auf einen Knopf, den
        // er eben erst zu sehen bekam.
        await page.waitForTimeout(400);
        await ziel.tap();
    } else await ziel.click();
}

for (const g of SCHMAL) {
    test.describe(`Encounter-Detail ${g.name}`, () => {
        test.use({ viewport: g.viewport, hasTouch: g.touch, isMobile: g.touch });

        test('(1) Tap auf einen Eintrag zeigt das Detail bildschirmfuellend mit allen Knoepfen', async ({
            page
        }) => {
            await appLaden(page);
            await bedienen(page, g.touch, `.enc-item[data-id="${WOLF.id}"]`);

            await expect(page.locator(DETAIL)).toBeVisible();
            await expect(page.locator(`${DETAIL} .enc-detail-name`)).toHaveText(WOLF.name);
            await expect(page.locator(`${DETAIL} .enc-stats-row`)).toBeVisible();
            // Vollbild: Liste, Werkzeugleiste und Anlegekarte treten zurueck.
            await expect(page.locator('#view-encounter .enc-master')).toBeHidden();
            await expect(page.locator('#view-encounter > .section-toolbar')).toBeHidden();
            await expect(page.locator('#view-encounter > .card')).toBeHidden();
            for (const sel of [ZURUECK, KAMPF, BEARBEITEN, LOESCHEN]) {
                expect(await treffbar(page, sel), `${sel} nicht treffbar`).toBe(true);
                // Tippflaeche wie die uebrigen Bedienelemente am Telefon.
                const box = await page.locator(sel).boundingBox();
                expect(
                    Math.min(box.width, box.height),
                    `${sel} kleiner als 43px`
                ).toBeGreaterThanOrEqual(43);
            }
        });

        test('(2) "← Liste" fuehrt zur Liste zurueck, die Auswahl und der Fokus bleiben beim Eintrag', async ({
            page
        }) => {
            await appLaden(page);
            await bedienen(page, g.touch, `.enc-item[data-id="${WOLF.id}"]`);
            await bedienen(page, g.touch, ZURUECK);

            await expect(page.locator('#view-encounter .enc-master')).toBeVisible();
            await expect(page.locator('#view-encounter > .section-toolbar')).toBeVisible();
            await expect(page.locator(DETAIL)).toBeHidden();
            await expect(page.locator(`.enc-item[data-id="${WOLF.id}"]`)).toHaveClass(
                /\bselected\b/
            );
            expect(
                await page.evaluate(() => document.activeElement?.closest('.enc-item')?.dataset.id)
            ).toBe(String(WOLF.id));
        });
    });
}

test.describe('Encounter-Detail 390x844: die Knoepfe tun, was sie sagen', () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test('(3) ⚔️ legt genau diesen Gegner in die Initiative, das Detail bleibt offen', async ({
        page
    }) => {
        await appLaden(page);
        await bedienen(page, true, `.enc-item[data-id="${WOLF.id}"]`);
        await bedienen(page, true, KAMPF);

        await expect
            .poll(() => page.evaluate(() => window.D.initiative.combatants.map(c => c.name)))
            .toContain(WOLF.name);
        const k = await page.evaluate(
            name => window.D.initiative.combatants.find(c => c.name === name),
            WOLF.name
        );
        expect(k).toMatchObject({ maxHp: WOLF.hp, ac: WOLF.ac, type: 'enemy' });
        await expect(page.locator(DETAIL)).toBeVisible();
    });

    test('(4) ✏️ verlaesst das Detail und oeffnet das Formular mit diesem Encounter', async ({
        page
    }) => {
        await appLaden(page);
        await bedienen(page, true, `.enc-item[data-id="${WOLF.id}"]`);
        await bedienen(page, true, BEARBEITEN);

        await expect(page.locator('#enc-form')).toHaveClass(/\bopen\b/);
        await expect(page.locator('#edit-enc-id')).toHaveValue(String(WOLF.id));
        await expect(page.locator('#enc-name')).toHaveValue(WOLF.name);
        expect(await treffbar(page, '#enc-name'), 'Namensfeld nicht treffbar').toBe(true);
        await expect(page.locator(DETAIL)).toBeHidden();
        // Der ✏️-Knopf ist jetzt ausgeblendet; der Fokus darf nicht mit ihm
        // verschwinden.
        expect(await page.evaluate(() => document.activeElement?.id)).toBe('enc-name');
    });

    test('(5) 🗑️ loescht nach Bestaetigung genau diesen Encounter und kehrt zur Liste zurueck', async ({
        page
    }) => {
        await appLaden(page);
        const dialoge = [];
        page.on('dialog', d => {
            dialoge.push(d.message());
            d.accept();
        });
        await bedienen(page, true, `.enc-item[data-id="${WOLF.id}"]`);
        await bedienen(page, true, LOESCHEN);

        const ids = () => page.evaluate(() => window.D.encounters.map(e => e.id));
        await expect.poll(ids).not.toContain(WOLF.id);
        expect(await ids()).toContain(ORK.id);
        expect(dialoge).toHaveLength(1);
        expect(dialoge[0]).toContain(WOLF.name);
        await expect(page.locator('#view-encounter .enc-master')).toBeVisible();
        await expect(page.locator(DETAIL)).toBeHidden();
        // Fokus auf dem nun gewaehlten Eintrag, wie closeEncounterDetail(true)
        // es verspricht — nicht auf BODY.
        await expect
            .poll(() =>
                page.evaluate(() => document.activeElement?.closest('.enc-item')?.dataset.id)
            )
            .toBe(String(ORK.id));
    });

    test('(6) eine automatische Auswahl (Suche) oeffnet das Detail nicht', async ({ page }) => {
        await appLaden(page);
        await page.locator('#enc-search').fill('Ork');
        await expect(page.locator(`.enc-item[data-id="${ORK.id}"]`)).toHaveClass(/\bselected\b/);
        await expect(page.locator(DETAIL)).toBeHidden();
        await expect(page.locator('#view-encounter .enc-master')).toBeVisible();
    });
});

/* PRUEFBEFUNDE (Gegenpruefung 2026-10-26). Jeder Fall war am ersten Stand
   dieser Aenderung rot und ist unabhaengig nachgemessen worden. */
test.describe('Encounter-Detail: jeder Weg aus dem Vollbild fuehrt an den richtigen Ort', () => {
    test.describe('900x800 (Maus und Tastatur)', () => {
        test.use({ viewport: { width: 900, height: 800 } });

        test('(8) Befehlspalette "Neuer Encounter" bei offenem Detail zeigt das Formular', async ({
            page
        }) => {
            await appLaden(page);
            await page.locator(`.enc-item[data-id="${WOLF.id}"]`).click();
            await expect(page.locator(DETAIL)).toBeVisible();

            await page.keyboard.press('Control+Shift+K');
            await expect(page.locator('.cp-overlay')).toBeVisible();
            await page.locator('.cp-input').fill('Neuer Encounter');
            await page.keyboard.press('Enter');

            await expect(page.locator('#enc-form')).toHaveClass(/\bopen\b/);
            expect(await treffbar(page, '#enc-name'), 'Namensfeld unsichtbar').toBe(true);
        });

        test('(9) Rueckgaengig/Wiederholen laesst kein fremdes Vollbild stehen', async ({
            page
        }) => {
            await appLaden(page);
            page.on('dialog', d => d.accept());
            await page.locator(`.enc-item[data-id="${WOLF.id}"]`).click();
            await page.locator(LOESCHEN).click();
            await expect(page.locator('#view-encounter .enc-master')).toBeVisible();

            await page.keyboard.press('Control+z');
            await expect(page.locator(`.enc-item[data-id="${WOLF.id}"]`)).toBeVisible();
            await page.locator(`.enc-item[data-id="${WOLF.id}"]`).click();
            await expect(page.locator(`${DETAIL} .enc-detail-name`)).toHaveText(WOLF.name);

            // Wiederholen loescht den GEZEIGTEN Encounter erneut.
            await page.keyboard.press('Control+y');
            await expect
                .poll(() => page.evaluate(() => window.D.encounters.map(e => e.id)))
                .not.toContain(WOLF.id);
            await expect(page.locator('#view-encounter .enc-master')).toBeVisible();
            await expect(page.locator(DETAIL)).toBeHidden();
        });
    });

    test.describe('390x844 (Touch)', () => {
        test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

        test('(10) eine Verknuepfung auf einen anderen Encounter zeigt DIESEN im Vollbild', async ({
            page
        }) => {
            await appLaden(page);
            await bedienen(page, true, `.enc-item[data-id="${WOLF.id}"]`);
            await expect(page.locator(`${DETAIL} .enc-detail-name`)).toHaveText(WOLF.name);

            // "Zum Tab wechseln" in der Verknuepfungsvorschau ruft
            // navigateToEntity (systems/entity-links.js) — hier direkt, weil
            // der Weg dorthin (Initiative, Namenslink, Vorschau) nicht Gegenstand
            // dieses Falls ist.
            await page.evaluate(id => window.navigateToEntity('encounters', id), ORK.id);
            await expect(page.locator(`${DETAIL} .enc-detail-name`)).toHaveText(ORK.name);
            await expect(page.locator(`.enc-item[data-id="${ORK.id}"]`)).toHaveClass(
                /\bselected\b/
            );
        });

        test('(11) ein langer Statblock laesst sich bis zum Ende wischen, "← Liste" bleibt in Reichweite', async ({
            page
        }) => {
            const lang = Array.from(
                { length: 30 },
                (_, i) =>
                    `<p><strong>Angriff ${i + 1}.</strong> Nahkampf-Waffenangriff: +4 zum Treffen, Reichweite 1,5 m, ein Ziel.</p>`
            ).join('');
            await seedCleanSession(page);
            await page.goto(APP_URL);
            await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
            await page.evaluate(
                ([wolf, aktionen]) => {
                    window.D.encounters.push({ ...wolf, actions: aktionen });
                    window.switchView('encounter');
                    window.renderEncounters();
                },
                [WOLF, lang]
            );
            await bedienen(page, true, `.enc-item[data-id="${WOLF.id}"]`);

            const LETZTES = `${DETAIL} .enc-detail-content > :last-child p:last-child`;
            const cdp = await page.context().newCDPSession(page);
            let gesten = 0;
            for (; gesten < 16 && !(await treffbar(page, LETZTES)); gesten++) {
                await cdp.send('Input.dispatchTouchEvent', {
                    type: 'touchStart',
                    touchPoints: [{ x: 195, y: 650 }]
                });
                for (let y = 630; y >= 330; y -= 20) {
                    await cdp.send('Input.dispatchTouchEvent', {
                        type: 'touchMove',
                        touchPoints: [{ x: 195, y }]
                    });
                }
                // Anhalten vor dem Loslassen: kein Schwung, kein Auslauf.
                await page.waitForTimeout(150);
                await cdp.send('Input.dispatchTouchEvent', {
                    type: 'touchMove',
                    touchPoints: [{ x: 195, y: 330 }]
                });
                await page.waitForTimeout(150);
                await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
                await page.waitForTimeout(150);
            }
            expect(
                await treffbar(page, LETZTES),
                `letzte Statblockzeile nach ${gesten} Wischgesten nicht treffbar (verdeckt oder ausser Reichweite)`
            ).toBe(true);
            expect(
                await treffbar(page, ZURUECK),
                '"← Liste" ist mit dem Statblock weggerollt'
            ).toBe(true);
        });
    });
});

test.describe('Encounter-Detail 901x800: knapp ueber der Grenze bleibt alles nebeneinander', () => {
    test.use({ viewport: { width: 901, height: 800 } });

    test('(12) ein Klick oeffnet kein Vollbild — JS-Grenze und CSS-Grenze stimmen ueberein', async ({
        page
    }) => {
        await appLaden(page);
        await page.locator(`.enc-item[data-id="${WOLF.id}"]`).click();
        await expect(page.locator(`${DETAIL} .enc-detail-name`)).toHaveText(WOLF.name);
        await expect(page.locator('#view-encounter .enc-master')).toBeVisible();
        await expect(page.locator(ZURUECK)).toBeHidden();
        expect(await page.locator('#view-encounter').getAttribute('class')).not.toMatch(
            /detail-open/
        );
    });
});

test.describe('Encounter-Detail 1440x900: der Desktop bleibt, wie er ist', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('(7) Liste und Detail nebeneinander, kein "← Liste"', async ({ page }) => {
        await appLaden(page);
        await page.locator(`.enc-item[data-id="${WOLF.id}"]`).click();
        await expect(page.locator(`${DETAIL} .enc-detail-name`)).toHaveText(WOLF.name);
        await expect(page.locator('#view-encounter .enc-master')).toBeVisible();
        await expect(page.locator('#view-encounter > .section-toolbar')).toBeVisible();
        await expect(page.locator(ZURUECK)).toBeHidden();
        for (const sel of [KAMPF, BEARBEITEN, LOESCHEN]) {
            expect(await treffbar(page, sel), `${sel} nicht treffbar`).toBe(true);
        }
    });
});
