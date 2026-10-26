/**
 * E2E Tests — Aktionen des Ersatz-Renderers (ui/safe-render.js)
 *
 * DER BEFUND. renderEncounterListFast() rendert pro Encounter drei Knoepfe mit
 * den Aktionsnamen `add-enc-to-init`, `edit-enc` und `delete-enc`. Keiner der
 * drei ist registriert, und EventDelegation verwirft unbekannte Aktionen
 * WORTLOS (dieselbe Klasse wie "Abbrechen" der Session-Prep-Maske,
 * session-prep.spec.js). Gemessen am Buendel: ein echter Klick auf jeden der
 * drei Knoepfe ruft nichts auf — keine Initiative, kein Formular, kein
 * Bestaetigungsdialog. Die echte Encounter-Liste
 * (features/encounters/encounters-render.js) nutzt `load-encounter`,
 * `edit-encounter` und `delete-encounter`; mit diesen Namen wirken die Knoepfe
 * wie dort.
 *
 * DER PFAD IST HEUTE TOT. Weder renderEncounterListFast noch
 * renderNPCListFast hat einen Aufrufer — seit dem ersten Commit nicht. Gemessen
 * mit vier unabhaengigen Zaehlern (CDP-Logpoints ab vor dem Laden, V8-Coverage,
 * Umwicklung nach dem Start, MutationObserver auf die nur hier erzeugten
 * Klassen) ueber alle 24 Ansichten, mit 3 bis 130 Encountern/NPCs, auf
 * 1440x900 und 390x844: null Aufrufe. Deshalb ruft dieser Test die Funktion
 * SELBST im Buendel auf. Er sichert zu, dass die Knoepfe wirken, sobald jemand
 * den Renderer benutzt — nicht, dass ein Nutzer ihn heute sieht.
 *
 * Die Knoepfe werden ueber ihre POSITION in der Karte angesprochen, nie ueber
 * den Aktionsnamen: der Test urteilt ueber die Wirkung, nicht ueber den Namen.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { seedCleanSession, waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

// Die Quelle, deren woertliche Aktionsnamen der Waechter (1) liest.
const QUELLE = 'ui/safe-render.js';

const ORK = { id: 9001, name: 'Probe-Ork', cr: '1/2', hp: 15, ac: 13, init: 1 };
const WOLF = { id: 9002, name: 'Probe-Wolf', cr: '1/4', hp: 11, ac: 12, init: 2 };

/**
 * Rendert beide Probe-Encounter mit renderEncounterListFast in einen eigenen
 * Behaelter in der Encounter-Ansicht. SafeRender zeichnet per
 * requestAnimationFrame — deshalb wird auf die Karten GEWARTET, nicht direkt
 * nach dem Aufruf gezaehlt.
 */
async function renderProbe(page) {
    await seedCleanSession(page);
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.evaluate(
        ([ork, wolf]) => {
            window.switchView('encounter');
            window.D.encounters.push({ ...ork }, { ...wolf });
            const box = document.createElement('div');
            box.id = 'ersatz-probe';
            document.querySelector('#view-encounter').prepend(box);
            renderEncounterListFast(box, [ork, wolf]);
        },
        [ORK, WOLF]
    );
    await expect(page.locator('#ersatz-probe .enc-card')).toHaveCount(2);
}

/** Der n-te Knopf (0 = Kampf, 1 = Bearbeiten, 2 = Loeschen) einer Karte. */
function knopf(page, id, n) {
    return page.locator(`#ersatz-probe .enc-card[data-id="${id}"] .enc-actions button`).nth(n);
}

test.describe('Ersatz-Renderer: jede Aktion ist registriert und wirkt', () => {
    // (1) Jedes woertliche data-action der Quelle ist im Buendel registriert —
    // auch die drei der NPC-Karte (renderNPCListFast), die hier nicht
    // gerendert werden. Gelesen wird das echte Register, nicht ui/actions/:
    // so zaehlen auch Registrierungen ausserhalb dieser Dateien.
    test('(1) jedes woertliche data-action in der Quelle ist registriert', async ({ page }) => {
        const quelltext = fs.readFileSync(path.join(process.cwd(), QUELLE), 'utf8');
        const namen = [
            ...new Set([...quelltext.matchAll(/data-action="([a-z0-9-]+)"/g)].map(m => m[1]))
        ];
        expect(
            namen.length,
            `keine woertlichen Aktionsnamen in ${QUELLE} gefunden`
        ).toBeGreaterThan(0);

        await page.goto(APP_URL);
        await waitForAppReady(page);
        const unregistriert = await page.evaluate(
            liste => liste.filter(a => !EventDelegation.hasAction(a)),
            namen
        );
        expect(unregistriert, `nicht registriert (Klick bliebe stumm), aus ${QUELLE}`).toEqual([]);
    });

    test('(2) jede gerenderte Aktion der Encounter-Karte ist registriert', async ({ page }) => {
        await renderProbe(page);
        const aktionen = await page.evaluate(() =>
            [...document.querySelectorAll('#ersatz-probe [data-action]')].map(
                el => el.dataset.action
            )
        );
        // Drei Knoepfe je Karte, zwei Karten — gegen Leerlauf.
        expect(aktionen).toHaveLength(6);
        const unregistriert = await page.evaluate(
            liste => liste.filter(a => !EventDelegation.hasAction(a)),
            aktionen
        );
        expect(unregistriert).toEqual([]);
    });

    test('(3) der Kampfknopf legt GENAU diesen Gegner in die Initiative', async ({ page }) => {
        await renderProbe(page);
        const vorher = await page.evaluate(() => window.D.initiative.combatants.map(c => c.name));

        await knopf(page, WOLF.id, 0).click();

        await expect
            .poll(() => page.evaluate(() => window.D.initiative.combatants.map(c => c.name)))
            .toEqual(expect.arrayContaining([...vorher, WOLF.name]));
        const nachher = await page.evaluate(() => window.D.initiative.combatants);
        expect(nachher).toHaveLength(vorher.length + 1);
        const neu = nachher.find(c => c.name === WOLF.name);
        expect(neu).toMatchObject({ maxHp: WOLF.hp, ac: WOLF.ac, type: 'enemy' });
    });

    test('(4) der Bearbeiten-Knopf oeffnet das Formular mit DIESEM Encounter', async ({ page }) => {
        await renderProbe(page);
        await expect(page.locator('#enc-form')).not.toHaveClass(/\bopen\b/);

        await knopf(page, WOLF.id, 1).click();

        await expect(page.locator('#enc-form')).toHaveClass(/\bopen\b/);
        await expect(page.locator('#edit-enc-id')).toHaveValue(String(WOLF.id));
        await expect(page.locator('#enc-name')).toHaveValue(WOLF.name);
        await expect(page.locator('#enc-hp')).toHaveValue(String(WOLF.hp));
    });

    test('(5) der Loeschknopf loescht nach Bestaetigung GENAU diesen Encounter, Strg+Z holt ihn zurueck', async ({
        page
    }) => {
        await renderProbe(page);
        const dialoge = [];
        page.on('dialog', d => {
            dialoge.push(d.message());
            d.accept();
        });
        const ids = () => page.evaluate(() => window.D.encounters.map(e => e.id));

        await knopf(page, ORK.id, 2).click();

        await expect.poll(ids).not.toContain(ORK.id);
        expect(dialoge).toHaveLength(1);
        expect(dialoge[0]).toContain(ORK.name);
        expect(await ids()).toContain(WOLF.id);

        await page.keyboard.press('Control+z');
        await expect.poll(ids).toContain(ORK.id);
    });
});
