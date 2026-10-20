// @ts-check
/**
 * Die Tastenhilfen der schwebenden Werkzeugleiste (Design-Handoff v3, Welle 5)
 * ===========================================================================
 *
 * WORUEBER DIESER FALL URTEILT, und warum er ein Browserfall sein muss. Die
 * fuenf `.kbd-hint`-Beschriftungen ("Strg+B", "Strg+I", "Strg+U", "Strg+K",
 * "Strg+⇧+T") haengen ABSOLUT unter ihren Knoepfen:
 *
 *     .floating-toolbar .kbd-hint {
 *         position: absolute; bottom: -12px; left: 50%;
 *         transform: translateX(-50%);
 *     }
 *
 * Sie nehmen im Fluss der Leiste KEINEN Platz ein. Ihre Breite ist allein die
 * Breite ihres Textes, ihr Abstand allein der Abstand ihrer Knoepfe. Waechst
 * die Schrift, waechst nur der Text — der Platz dazwischen nicht. Ob zwei
 * Hilfen einander beruehren, steht darum in KEINER Deklaration und ist mit
 * keinem Quelltextfall zu beantworten; es faellt erst beim Setzen. Die drei
 * Formatknoepfe stehen am dichtesten (Knopfabstand 2 px, `padding: 6px 10px`),
 * und genau dort entscheidet es sich.
 *
 * WARUM DAS DER NORMALFALL IST UND KEIN RANDFALL. Die Aufdeckregel haengt an
 * der LEISTE, nicht am beruehrten Knopf:
 *
 *     .floating-toolbar:hover .kbd-hint { opacity: 0.7; }
 *
 * Wer die Leiste irgendwo beruehrt, sieht ALLE FUENF gleichzeitig. Es gibt
 * keinen Zustand, in dem nur eine Hilfe steht. Der erste Fall unten misst
 * genau das und laesst es nicht als Lesart des Selektors stehen.
 *
 * WARUM OHNE ERZWUNGENE OPAZITAET GEMESSEN WIRD. `opacity` beeinflusst die
 * Auslegung nicht. Die Hilfen sind ausgelegt, sobald die Leiste `display:
 * flex` traegt — also von Anfang an. Der Messfall setzt trotzdem `.visible`
 * und hovert ECHT, aber nicht, um die Masse zu bekommen, sondern um die
 * Behauptung "gemeinsam sichtbar" zu belegen. Das `.visible` ist dabei der
 * Weg der App selbst: `handleSelectionChange()` in rich-text-toolbars.js
 * setzt genau diese Klasse und genau `left`/`top`, wenn im Editor Text
 * markiert wird.
 *
 * KURZFORM DES MODULNAMENS OBEN, mit Absicht — sie sieht wie eine Umgehung
 * aus und muss darum begruendet werden. Das Abdeckungs-Gate in
 * `tests/unit/module-test-coverage.test.js` sucht einen Modulpfad als
 * Teilzeichenkette in allen Testdateien und zaehlt JEDEN Treffer als
 * Abdeckung, auch einen im Erklaertext. Diese Datei prueft das Modul NICHT;
 * sie nennt es als Herkunft der Klasse `visible`. Mit vollem Pfad haette das
 * Gate verlangt, das Modul von seiner Ausnahmeliste zu streichen — und damit
 * eine Abdeckung behauptet, die es nicht gibt. Dasselbe Muster steht bei
 * `OHNE_MESSUNG` in tests/unit/design-consistency.test.js. Es gibt genau EINE
 * rich-text-toolbars.js im Baum.
 *
 * WARUM DIE BREITE SCHRIFT MITGEMESSEN WIRD. Die CI laeuft auf ubuntu-latest
 * und hat an der Schriftmetrik schon einmal zwoelf Faelle verloren; die
 * Nachstellung legt `Verdana` auf (Faktor 1,155). Gemessen erbt `.kbd-hint`
 * `Arial` und NICHT `--font-ui` — die Umlegung muss darum direkt an der Hilfe
 * ansetzen, sonst misst der Fall unter Linux etwas anderes als er behauptet.
 * Unter der breiten Schrift sind die Abstaende am kleinsten; sie ist der
 * strengere der beiden Durchgaenge.
 *
 * WAS DIESER FALL NICHT FESTSCHREIBT: eine Schriftgroesse. Er verlangt nur,
 * dass zwischen zwei Hilfen Platz bleibt. Eine spaetere Runde darf die
 * Hilfen groesser setzen — sie muss dann die Layoutregel mitaendern (etwa nur
 * die Hilfe des beruehrten Knopfes zeigen). Genau diese Kopplung ist der
 * Zweck: Groesse und Anordnung duerfen hier nicht getrennt entschieden
 * werden.
 *
 * GEFUELLTE KAMPAGNE wie in den uebrigen Wellenfaellen — die Leiste selbst
 * steht zwar im festen Markup, aber eine leere Kampagne hat in dieser Welle
 * schon 88 Prozent der Stellen verborgen, und ein Sonderweg waere eine
 * Ausnahme ohne Grund.
 *
 * UNTER 901 px greift `@media (max-width: 900px)` mit `display: none` auf den
 * Hilfen. Gemessen wird darum bei 1440 px, und der letzte Fall sichert zu,
 * dass die Mobilfassung sie wirklich wegnimmt — sonst liefe die Zusicherung
 * auf Telefonbreiten ins Leere, ohne dass es auffiele.
 */

import { test, expect } from '@playwright/test';
import { loadApp, seedPopulatedSession } from '../helpers/test-utils.js';

/** Breite, auf der die Hilfen sichtbar sind (ueber dem 900-px-Umbruch). */
const BREIT = { width: 1440, height: 900 };

/** Linux-/CI-Naeherung: Verdana setzt rund 1,155-mal so breit wie Arial. */
const BREITE_SCHRIFT =
    ':root { --font-ui: Verdana !important; }' +
    'body, .floating-toolbar, .floating-toolbar * { font-family: Verdana !important; }';

/**
 * Bringt die Leiste in den Zustand, den die App selbst herstellt, wenn im
 * Editor Text markiert wird: Klasse `visible`, feste Position im Sichtfeld.
 * @param {import('@playwright/test').Page} page
 */
async function leisteZeigen(page) {
    await page.evaluate(() => {
        const tb = document.getElementById('floating-toolbar');
        if (!tb) throw new Error('#floating-toolbar nicht gefunden');
        // Derselbe Weg wie handleSelectionChange(): Klasse + left/top.
        tb.classList.add('visible');
        tb.style.left = '120px';
        tb.style.top = '300px';
    });
    await page.waitForTimeout(150);
}

/**
 * Misst die fuenf Hilfen und die Luecken zwischen ihnen.
 * Negative Luecke = Ueberlappung.
 * @param {import('@playwright/test').Page} page
 */
async function hilfenMessen(page) {
    return page.evaluate(() => {
        const r2 = n => Math.round(n * 100) / 100;
        const tb = document.getElementById('floating-toolbar');
        if (!tb) throw new Error('#floating-toolbar nicht gefunden');
        const boxen = Array.from(tb.querySelectorAll('.kbd-hint'))
            .map(h => {
                const r = h.getBoundingClientRect();
                const cs = getComputedStyle(h);
                return {
                    text: h.textContent.trim(),
                    fs: r2(parseFloat(cs.fontSize)),
                    opacity: Number(cs.opacity),
                    anzeige: cs.display,
                    x: r2(r.x),
                    right: r2(r.right),
                    w: r2(r.width)
                };
            })
            .filter(b => b.anzeige !== 'none')
            .sort((a, b) => a.x - b.x);
        const luecken = [];
        for (let i = 1; i < boxen.length; i++) {
            luecken.push({
                paar: `${boxen[i - 1].text} / ${boxen[i].text}`,
                luecke: r2(boxen[i].x - boxen[i - 1].right)
            });
        }
        return { boxen, luecken };
    });
}

test.describe('W5-C-01 — die Tastenhilfen der schwebenden Werkzeugleiste', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize(BREIT);
        await seedPopulatedSession(page);
        await loadApp(page);
    });

    test('alle fuenf Hilfen werden GEMEINSAM sichtbar — es gibt keine einzelne', async ({
        page
    }) => {
        await leisteZeigen(page);
        // ECHTES Hovern. Die Leiste traegt mit `.visible` wieder
        // `pointer-events: auto`, der Zeiger erreicht sie also.
        await page.hover('#floating-toolbar');
        await page.waitForTimeout(250);
        const { boxen } = await hilfenMessen(page);
        expect(boxen.length).toBe(5);
        // Keine einzige steht allein: EINE Beruehrung deckt alle fuenf auf.
        const verdeckt = boxen.filter(b => b.opacity <= 0).map(b => b.text);
        expect({ anzahl: boxen.length, verdeckt }).toEqual({ anzahl: 5, verdeckt: [] });
    });

    test('keine zwei Hilfen beruehren einander (Standardschrift)', async ({ page }) => {
        await leisteZeigen(page);
        const { boxen, luecken } = await hilfenMessen(page);
        const beruehrend = luecken.filter(l => l.luecke <= 0);
        // Die Zahlen gehoeren in die Ausgabe, auch im gruenen Lauf — sonst
        // belegt ein gruener Lauf nur, dass nichts gemeldet wurde.
        console.log(
            `[W5-C-01] Standardschrift ${[...new Set(boxen.map(b => b.fs))].join('/')} px — ` +
                luecken.map(l => `${l.paar}: ${l.luecke}`).join(' · ')
        );
        expect({ hilfen: boxen.length, beruehrend }).toEqual({ hilfen: 5, beruehrend: [] });
    });

    test('keine zwei Hilfen beruehren einander (breite Schrift, Linux-Naeherung)', async ({
        page
    }) => {
        await page.addStyleTag({ content: BREITE_SCHRIFT });
        await page.waitForTimeout(200);
        await leisteZeigen(page);
        const { boxen, luecken } = await hilfenMessen(page);
        const beruehrend = luecken.filter(l => l.luecke <= 0);
        console.log(
            `[W5-C-01] breite Schrift ${[...new Set(boxen.map(b => b.fs))].join('/')} px — ` +
                luecken.map(l => `${l.paar}: ${l.luecke}`).join(' · ')
        );
        expect({ hilfen: boxen.length, beruehrend }).toEqual({ hilfen: 5, beruehrend: [] });
    });

    test('unter 901 px nimmt die Mobilfassung die Hilfen weg', async ({ page }) => {
        // Ohne diese Zusicherung koennten die drei Faelle oben auf
        // Telefonbreiten etwas zusichern, das dort gar nicht gilt.
        await page.setViewportSize({ width: 375, height: 812 });
        await page.waitForTimeout(250);
        await leisteZeigen(page);
        const anzeigen = await page.evaluate(() =>
            Array.from(document.querySelectorAll('#floating-toolbar .kbd-hint')).map(
                h => getComputedStyle(h).display
            )
        );
        expect(anzeigen).toEqual(['none', 'none', 'none', 'none', 'none']);
    });
});
