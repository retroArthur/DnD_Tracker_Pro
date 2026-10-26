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
    if (touch) await ziel.tap();
    else await ziel.click();
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
    });

    test('(6) eine automatische Auswahl (Suche) oeffnet das Detail nicht', async ({ page }) => {
        await appLaden(page);
        await page.locator('#enc-search').fill('Ork');
        await expect(page.locator(`.enc-item[data-id="${ORK.id}"]`)).toHaveClass(/\bselected\b/);
        await expect(page.locator(DETAIL)).toBeHidden();
        await expect(page.locator('#view-encounter .enc-master')).toBeVisible();
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
