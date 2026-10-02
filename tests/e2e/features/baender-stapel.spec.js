// @ts-check
/**
 * E2E — Die beiden festen Baender am Fensterkopf koennen sich nicht stapeln (M3a).
 *
 * WARUM ES DIESE PROBE BRAUCHT. In `assets/styles/migration.css` stand bis M3
 * eine Geschwisterregel mit dem Kommentar "Wenn beide Banner sichtbar sind,
 * zweiten nach unten verschieben":
 *
 *     .migration-hint-banner ~ .divergence-banner { top: 48px; }
 *
 * Sie hat nie gewirkt, und sie haette auch nicht gewirkt, wenn man sie zum
 * Treffen gebracht haette. GEMESSEN am gebauten Buendel zu b256750 (dark,
 * 1440x800 und 390x800, die CSSOM nach dem Waehler und die Baender nach ihrem
 * berechneten `top` gefragt):
 *
 *   Zustand                                        Index Div/Hinweis  Waehler  Div.top
 *   ---------------------------------------------  ------------------  -------  -------
 *   Zweig "noch nicht umgezogen" (nur Hinweis)              -1 / 0          0   (keins)
 *   Zweig "bereits umgezogen" (nur Divergenz)                0 / -1         0     0px
 *   gestapelt, Hinweis zuerst  -> dann Divergenz             0 / 1          0     0px
 *   gestapelt, Divergenz zuerst -> dann Hinweis              1 / 0          1    48px
 *
 * DREI unabhaengige Gruende, warum die Regel weg gehoert und nicht repariert:
 *
 * 1. DER ZUSTAND TRITT IM BETRIEB NICHT EIN. Der Einstieg unter `file://`
 *    verzweigt entweder/oder: liegt ein Umzugs-Datum im Speicher, kommt das
 *    Divergenz-Band und der Hinweis NICHT; liegt keins, kommt der Hinweis und
 *    das Divergenz-Band nicht. Gemessen in beiden Zweigen, Zeile 1 und 2 oben.
 *    Die einzige Stelle, an der beide Baender gleichzeitig im Dokument haengen,
 *    liegt synchron innerhalb des Umzugs-Starts (Divergenz anlegen, dann
 *    Hinweis entfernen) — zwischen diesen zwei Anweisungen rechnet der Browser
 *    kein Layout.
 *
 * 2. DIE DOKUMENTREIHENFOLGE SCHLAEGT DEN WAEHLER. Beide Baender werden mit
 *    `insertBefore(.., body.firstChild)` eingehaengt. Das spaeter eingehaengte
 *    steht damit VOR dem frueheren — in der Reihenfolge, die der Code erzeugen
 *    wuerde (Hinweis zuerst, Divergenz danach), liegt das Divergenz-Band auf
 *    Index 0 und der Hinweis auf Index 1. Der Geschwisterwaehler `~` verlangt
 *    das Gegenteil und trifft 0 Elemente (Zeile 3 oben).
 *
 * 3. DIE 48px WAEREN IN JEDER GEMESSENEN LAGE FALSCH. Das Hinweisband ist bei
 *    1440 Breite 61px hoch und bei 390 Breite 117px — nie 48. In der einzigen
 *    Reihenfolge, in der der Waehler trifft (Zeile 4), setzt er das
 *    Divergenz-Band also auf 48px und damit 13px (1440) bzw. 69px (390) IN das
 *    Hinweisband hinein. Schlimmer auf Telefonbreite: dort gewinnt die Regel
 *    gegen `[data-layout="mobile"] .divergence-banner { top: var(--mobile-header-height) }`
 *    (gleiche Spezifitaet (0,2,0), aber spaeter in der Datei) und zieht das Band
 *    aus dem Ausweichplatz zurueck UNTER die Mobil-Kopfzeile — genau der Fehler,
 *    den M2c behoben hat. Und die Gegenrechnung am Seiteninhalt stimmt im
 *    gestapelten Zustand ohnehin nicht: `body.has-migration-hint` und
 *    `body.has-divergence-banner` setzen BEIDE `padding-top` auf `body`, die
 *    spaetere gewinnt, gemessen 40px fuer 101px Band. Ein brauchbares gestapeltes
 *    Layout gibt es nicht; die eine Regel hat nie eines hergestellt.
 *
 * Die Regel ist deshalb GESTRICHEN. Diese Datei haelt beide Haelften fest: dass
 * der gestapelte Zustand unerreichbar bleibt (Faelle 1-3), und dass kein
 * Stilblatt ihn mehr zu behandeln vorgibt (Fall 4 — der rote Nachweis).
 *
 * WARUM AN DER CSSOM UND NICHT AM QUELLTEXT. Ein `grep` ueber migration.css
 * prueft eine Datei; die App laeuft gegen das gebaute Buendel, in dem alle 20
 * Stilblaetter zusammenlaufen. Gefragt wird deshalb `document.styleSheets` —
 * dieselbe Sicht, die der Browser beim Zeichnen hat.
 */
import { test, expect } from '@playwright/test';
import { seedCleanSession, loadApp } from '../helpers/test-utils.js';

/** Umzugs-Datum im Speicher: der Weg, auf dem der Divergenz-Zweig betreten wird. */
const DIVERGENZ_SEIT = JSON.stringify({ date: '2026-03-14T10:00:00.000Z' });

/**
 * Legt VOR dem Laden weitere localStorage-Schluessel ab. Nur so faellt die
 * Verzweigung des Einstiegs dort, wo sie im Betrieb faellt; ein nachtraeglicher
 * Aufruf der Banderzeugung wuerde den Einstieg ueberspringen.
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, string>} schluessel
 */
async function weitereSchluessel(page, schluessel) {
    await page.addInitScript(arg => {
        try {
            for (const k of Object.keys(arg)) localStorage.setItem(k, arg[k]);
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng.
        }
    }, schluessel);
}

/** Die Lage beider Baender im aktuellen Zustand. Laeuft IM Browser. */
function messeBaender() {
    const kinder = Array.from(document.body.children);
    const hinweis = document.querySelector('.migration-hint-banner');
    const divergenz = document.querySelector('.divergence-banner');
    const hoehe = el => (el ? Math.round(el.getBoundingClientRect().height) : null);
    const oben = el => (el ? getComputedStyle(el).top : null);

    // Alle Regeln des gebauten Buendels, in denen EIN EINZELNER Waehler beide
    // Bandklassen nennt — also jede Regel, die einen gestapelten Zustand zu
    // behandeln vorgibt. Die Kommaliste wird vorher aufgeteilt: eine Gruppe wie
    // `[data-layout="mobile"] .migration-hint-banner, [data-layout="mobile"]
    // .divergence-banner` (M2c, das Ausweichen unter die Mobil-Kopfzeile) nennt
    // beide Klassen, aber je Waehler nur eine — sie ist kein Stapelzustand.
    const stapelRegeln = [];
    for (const blatt of Array.from(document.styleSheets)) {
        let regeln;
        try {
            regeln = blatt.cssRules;
        } catch {
            continue; // fremdes Blatt ohne Leserecht — im Buendel gibt es keins
        }
        for (const regel of Array.from(regeln || [])) {
            const w = /** @type {CSSStyleRule} */ (regel).selectorText;
            if (!w) continue;
            w.split(',')
                .map(t => t.trim())
                .filter(t => t.includes('migration-hint-banner') && t.includes('divergence-banner'))
                .forEach(t => stapelRegeln.push(t));
        }
    }

    return {
        hinweisDa: !!hinweis,
        divergenzDa: !!divergenz,
        hinweisIndex: hinweis ? kinder.indexOf(hinweis) : -1,
        divergenzIndex: divergenz ? kinder.indexOf(divergenz) : -1,
        hinweisHoehe: hoehe(hinweis),
        divergenzHoehe: hoehe(divergenz),
        hinweisTop: oben(hinweis),
        divergenzTop: oben(divergenz),
        // Treffer des Geschwisterwaehlers am lebenden Dokument, nicht am Quelltext.
        waehlerTrifft: document.querySelectorAll('.migration-hint-banner ~ .divergence-banner')
            .length,
        stapelRegeln
    };
}

test.describe('Die zwei festen Baender am Fensterkopf stapeln sich nicht (M3a)', () => {
    test('der Einstieg unter file:// zeigt genau EIN Band — in beiden Zweigen', async ({
        page
    }) => {
        await page.setViewportSize({ width: 1440, height: 800 });

        // Zweig "noch nicht umgezogen": nur der Hinweis.
        await seedCleanSession(page);
        await loadApp(page);
        const ohneUmzug = await page.evaluate(messeBaender);
        console.log(`[M3a] Zweig ohne Umzug: ${JSON.stringify(ohneUmzug)}`);
        expect(
            { hinweis: ohneUmzug.hinweisDa, divergenz: ohneUmzug.divergenzDa },
            `ohne Umzugs-Datum muss genau das Hinweisband stehen (${JSON.stringify(ohneUmzug)})`
        ).toEqual({ hinweis: true, divergenz: false });
        expect(ohneUmzug.waehlerTrifft, 'und der Geschwisterwaehler trifft nichts').toBe(0);
    });

    test('der Zweig nach dem Umzug zeigt nur das Divergenz-Band', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 800 });
        await seedCleanSession(page);
        await weitereSchluessel(page, { 'migration-divergence-since': DIVERGENZ_SEIT });
        await loadApp(page);

        const m = await page.evaluate(messeBaender);
        console.log(`[M3a] Zweig nach Umzug: ${JSON.stringify(m)}`);
        expect(
            { hinweis: m.hinweisDa, divergenz: m.divergenzDa },
            `mit Umzugs-Datum muss genau das Divergenz-Band stehen (${JSON.stringify(m)})`
        ).toEqual({ hinweis: false, divergenz: true });
        expect(m.waehlerTrifft, 'und der Geschwisterwaehler trifft nichts').toBe(0);
    });

    test('auch erzwungen gestapelt steht das zweite Band VOR dem ersten', async ({ page }) => {
        // Der Zustand wird hier mit Gewalt hergestellt — genau so, wie der Code
        // ihn erzeugen WUERDE, wenn die Verzweigung des Einstiegs wegfiele:
        // Hinweis zuerst (aus dem Einstieg), Divergenz danach.
        await page.setViewportSize({ width: 1440, height: 800 });
        await seedCleanSession(page);
        await loadApp(page);

        const vorher = await page.evaluate(messeBaender);
        expect(vorher.hinweisDa, 'der Fall beginnt mit stehendem Hinweisband').toBe(true);

        await page.evaluate(() => {
            // @ts-ignore — global aus dem Migrations-Modul
            window.showDivergenceBanner('14.03.2026');
        });
        await page.waitForTimeout(300);

        const m = await page.evaluate(messeBaender);
        console.log(`[M3a] erzwungen gestapelt: ${JSON.stringify(m)}`);
        expect(m.hinweisDa && m.divergenzDa, 'beide Baender muessen jetzt haengen').toBe(true);

        // Grund 2: das spaeter eingehaengte Band steht VOR dem frueheren.
        expect(
            m.divergenzIndex,
            `insertBefore(.., firstChild) setzt das Divergenz-Band vor den Hinweis ` +
                `(Divergenz ${m.divergenzIndex}, Hinweis ${m.hinweisIndex})`
        ).toBeLessThan(m.hinweisIndex);

        // Deshalb trifft der Geschwisterwaehler auch im gestapelten Zustand nichts.
        expect(
            m.waehlerTrifft,
            `der Geschwisterwaehler trifft ${m.waehlerTrifft} Element(e) — die Regel kann ` +
                `den Zustand, fuer den sie geschrieben wurde, nicht erreichen`
        ).toBe(0);

        // Grund 3: die 48px der gestrichenen Regel waren falsch — gemessene Bandhoehe.
        expect(
            m.hinweisHoehe,
            `das Hinweisband ist ${m.hinweisHoehe}px hoch, nicht 48px — eine verdrahtete ` +
                `Verschiebung kann hier nicht stimmen`
        ).not.toBe(48);
    });

    test('kein Stilblatt gibt vor, einen gestapelten Zustand zu behandeln', async ({ page }) => {
        // Der rote Nachweis dieser Einheit: gegen das Buendel zu b256750 meldet
        // dieser Fall genau EINE Regel,
        // `.migration-hint-banner ~ .divergence-banner`.
        await page.setViewportSize({ width: 1440, height: 800 });
        await seedCleanSession(page);
        await loadApp(page);

        const m = await page.evaluate(messeBaender);
        console.log(`[M3a] Stapel-Regeln im Buendel: ${JSON.stringify(m.stapelRegeln)}`);
        expect(
            m.stapelRegeln,
            `${m.stapelRegeln.length} Regel(n) im gebauten Buendel behandeln einen gestapelten ` +
                `Bandzustand, den es nicht gibt: ${m.stapelRegeln.join(' | ')}`
        ).toEqual([]);
    });
});
