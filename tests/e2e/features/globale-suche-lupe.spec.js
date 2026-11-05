/**
 * Globale Suche — die Lupe liegt im Suchfeld, die Trefferliste haengt am Feld
 * (UAT-Runde 7)
 *
 * DER BEFUND. "In der oberen Hauptleiste ist ein Lupen-Symbol, links — wohin
 * gehoert das? Reihe es bitte richtig ein." Gemessen am Buendel bei 1925, 1440
 * und 1280px: die Lupe sitzt bei x=10 ueber der Ecke des Start-Reiters, das
 * Suchfeld rechts daneben zeigt seinen 30px-Platz fuer sie leer. Bei 1200 und
 * 900px (die Kopfzeile bricht um) liegt sie zwischen den Reihen. Und die
 * Trefferliste spannt sich nach dem Tippen ueber die VOLLE Kopfbreite statt unter
 * dem 280px-Feld zu haengen.
 *
 * DIE URSACHE. `.global-search-icon` (left:10px, top:50%) und
 * `.global-search-results` (top:100%, left/right:0) sind absolut positioniert
 * und brauchen `.global-search-container` als Bezugsrahmen. Dessen Regel
 * `position: relative` steht in assets/styles/dmscreen.css, ist aber seit der
 * CSS-Aufteilung (900271a, 2026-03-18) TOT: ihrem Banner fehlt das oeffnende
 * Kommentarzeichen, der Parser liest Bannertext und Selektor als EINEN
 * ungueltigen Selektor und verwirft die ganze Regel. Bezugsrahmen wurde die
 * sticky `.app-header`.
 *
 * Geladen wird breit und dann verkleinert, wie die uebrigen Kopfzeilen-Proben.
 * 900px ist noch Desktop-Layout; im Mobil-Layout ist `.app-header-top`
 * ausgeblendet und die Lupe gar nicht da.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady, seedPopulatedSession } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

const GROESSEN = [
    { b: 1925, h: 1000 },
    { b: 1440, h: 900 },
    { b: 1200, h: 800 },
    { b: 900, h: 800 }
];

/** Laeuft im Browser: Lage von Lupe, Feld, Behaelter und Trefferliste. */
function messeSuche() {
    const box = document.querySelector('.global-search-container');
    const lupe = document.querySelector('.global-search-icon');
    const feld = document.getElementById('global-search');
    const liste = document.getElementById('global-search-results');
    if (!box || !lupe || !feld || !liste) return null;
    const r = el => {
        const k = el.getBoundingClientRect();
        return {
            l: Math.round(k.left * 10) / 10,
            t: Math.round(k.top * 10) / 10,
            r: Math.round(k.right * 10) / 10,
            u: Math.round(k.bottom * 10) / 10,
            b: Math.round(k.width * 10) / 10
        };
    };
    const lr = r(lupe);
    const fr = r(feld);
    return {
        layout: document.documentElement.dataset.layout,
        lupe: lr,
        feld: fr,
        box: r(box),
        liste: r(liste),
        listeSichtbar:
            liste.classList.contains('visible') && liste.getBoundingClientRect().height > 0,
        lupeImFeld:
            lr.b > 0 &&
            lr.l >= fr.l - 0.5 &&
            lr.r <= fr.r + 0.5 &&
            lr.t >= fr.t - 0.5 &&
            lr.u <= fr.u + 0.5,
        bezug: lupe.offsetParent
            ? lupe.offsetParent.tagName.toLowerCase() +
              '.' +
              String(lupe.offsetParent.className || '').split(' ')[0]
            : '(keiner)',
        bezugIstBehaelter: lupe.offsetParent === box
    };
}

test.describe('Globale Suche: die Lupe gehoert ins Feld (UAT-Runde 7)', () => {
    for (const { b, h } of GROESSEN) {
        test(`${b}x${h}: Lupe im Feld, Klick darauf fokussiert, Trefferliste unter dem Feld`, async ({
            page
        }) => {
            await seedPopulatedSession(page);
            await page.setViewportSize({ width: 1440, height: 900 });
            await page.goto(APP_URL);
            await waitForAppReady(page);
            await page.setViewportSize({ width: b, height: h });
            await page.waitForTimeout(300);

            const m = await page.evaluate(messeSuche);
            expect(m, 'Suchfeld, Lupe oder Trefferliste fehlen im Buendel').not.toBeNull();
            expect(m.layout, `${b}px muessen das Desktop-Layout waehlen`).toBe('desktop');

            // (1) Die Lupe liegt im Feld, und ihr Bezugsrahmen ist der Behaelter.
            expect(
                m.lupeImFeld,
                `Lupe bei ${JSON.stringify(m.lupe)} liegt nicht im Feld ${JSON.stringify(m.feld)} ` +
                    `(Bezugsrahmen ${m.bezug})`
            ).toBe(true);
            expect(m.bezugIstBehaelter, `Bezugsrahmen der Lupe ist ${m.bezug}`).toBe(true);

            // (2) Ein Klick auf die Lupe landet im Feld, nicht auf BODY.
            await page.mouse.click(m.lupe.l + m.lupe.b / 2, (m.lupe.t + m.lupe.u) / 2);
            expect(
                await page.evaluate(() => document.activeElement && document.activeElement.id),
                'ein Klick auf die Lupe fokussiert das Suchfeld nicht'
            ).toBe('global-search');

            // (3) Die Trefferliste haengt am Feld und ist so breit wie sein Behaelter.
            await page.locator('#global-search').fill('Test');
            await page.waitForFunction(
                () =>
                    document.getElementById('global-search-results')?.classList.contains('visible'),
                null,
                { timeout: 5000 }
            );
            const n = await page.evaluate(messeSuche);
            expect(n.listeSichtbar, 'die Trefferliste erscheint nicht').toBe(true);
            expect(
                Math.abs(n.liste.l - n.box.l),
                `Trefferliste beginnt bei x=${n.liste.l}, der Behaelter bei x=${n.box.l}`
            ).toBeLessThanOrEqual(1);
            expect(
                Math.abs(n.liste.b - n.box.b),
                `Trefferliste ist ${n.liste.b}px breit, der Behaelter ${n.box.b}px`
            ).toBeLessThanOrEqual(1);
            expect(
                n.liste.t,
                `Trefferliste beginnt bei y=${n.liste.t}, das Feld endet bei y=${n.feld.u}`
            ).toBeGreaterThanOrEqual(n.feld.u - 1);
        });
    }
});
