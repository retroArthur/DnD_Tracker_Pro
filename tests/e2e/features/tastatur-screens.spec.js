// @ts-check
/**
 * Ablichtung des Tastatur-Strangs (TAST, Abnahme, Punkt 7)
 * ========================================================
 *
 * WOFUER. Die fuenf Einheiten T-A bis T-E aendern ausschliesslich VERHALTEN:
 * welche Taste welches Element bedient, wohin der Fokus geht, was ein offener
 * Dialog mit dem Tabulator macht. Der versionierte Stil-Sollstand
 * (`tests/e2e/baselines/computed-style-baseline.json`) sieht davon NICHTS —
 * seine zwoelf gehashten Eigenschaften sind color, backgroundColor,
 * borderColor, borderRadius, padding, margin, fontSize, fontWeight, boxShadow,
 * opacity, display und textAlign. `tabindex` und `role` stehen in keiner
 * davon, und im Quellbaum selektiert KEINE CSS-Regel auf `[role=` oder
 * `[tabindex` (nachgezaehlt: 0 Treffer in `assets/styles/*.css`). Der Strang
 * ist damit im Sollstand unsichtbar — gewollt, aber eben auch ungezeigt.
 *
 * Die Ratschen messen, diese Bilder zeigen. `tastatur-erreichbarkeit.spec.js`
 * zaehlt unerreichbare Stellen, `tastatur-ausloesung.spec.js` zaehlt Klicks am
 * Ziel, `modal-fokus.spec.js` zaehlt Spruenge im Dialog, `tastatur-kuerzel.js`
 * prueft die dreizehn Verhaltensfaelle des Kuerzels. Keine davon beantwortet
 * die Fragen, die ein Mensch am Spieltisch stellt:
 *
 *   — Sieht man AN der Kampfzeile, welches Element gerade den Fokus hat?
 *   — Ist der Ring auf einem nachgeruesteten `div`/`span` so deutlich wie auf
 *     einem echten Knopf, oder faellt er dort optisch aus?
 *   — Erkennt man im offenen Dialog, dass der Fokus DRINNEN liegt?
 *   — Wie liest eine Punktgruppe (Zauberplaetze, Todesretter) im
 *     PFEILTASTENMODUS, wenn der Fokus auf EINEM Punkt von sieben steht und
 *     die sechs anderen keinen eigenen Tabulatorhalt mehr haben?
 *
 * DER FOKUS WIRD MIT ECHTEN TABULATORSPRUENGEN GESETZT, NIE MIT `.focus()`.
 * Dieselbe Lehre wie in `welle-6-screens.spec.js`: bei programmatischem Fokus
 * greift `:focus-visible` nicht, und ein so entstandenes Bild zeigt einen
 * Zustand, den kein Benutzer je sieht.
 *
 * SIE PRUEFT NICHTS. Keine Zusicherung ueber Bildpunkte, kein Durchfallen bei
 * einem Farbwert — sie legt Bilder ab, ueber die ein Mensch urteilt. Ein
 * gruener Lauf dieser Datei ist KEINE Abnahme. Gleiche Bauart wie die sieben
 * bestehenden Ablichtungsdateien.
 *
 * WAS SICH MIT E-2 GEAENDERT HAT — und warum hier ein ganzer Absatz davon
 * handelt: an dieser Stelle stand bis zur Umsetzung die Gegenaussage. Die
 * Punktgruppe im PFEILTASTENMODUS liess sich nicht zeigen, weil es den Modus
 * nicht gab; Nutzerentscheidung E-2 ("ein Tabulatorhalt je Gruppe, darin
 * Links/Rechts") war beantwortet und nicht gebaut, und die Bilder hiessen
 * ehrlich `-ein-halt-je-punkt`. Ein Bild eines Modus, den es nicht gibt, waere
 * eine Behauptung gewesen.
 *
 * Mit `ui/keyboard-group.js` gibt es ihn. Gemessen in der Initiative mit
 * verknuepften Spielerkaempfern:
 *
 *                              vorher              nachher
 *    6 Kaempfer    42 Punkte / 42 Halte     42 Punkte /  6 Halte
 *   20 Kaempfer   140 Punkte /140 Halte    140 Punkte / 20 Halte
 *   Todeswuerfe     6 Punkte /  6 Halte      6 Punkte /  2 Halte
 *   Anschlaege bis `.qref-fab`, 20 Kaempfer      366 -> 246
 *
 * Darum sind die zwei Punktgruppen-Faelle unten umgeschrieben: sie fahren
 * jetzt mit ECHTEN Pfeiltastendruecken IN die Gruppe hinein, bevor sie
 * ablichten. Das Bild zeigt den Fokus auf einem MITTLEREN Punkt — eine Lage,
 * die vor E-2 nur ueber einen Tabulatorhalt je Punkt erreichbar war, und die
 * damit auch optisch die Frage beantwortet, ob ein Punkt von sieben als
 * fokussiert zu erkennen ist. Die Dateinamen tragen den neuen Zustand
 * (`-pfeiltastenmodus`); die alten Bilder (`-ein-halt-je-punkt.png`) sind
 * ueberholt und werden von dieser Datei nicht mehr erzeugt.
 *
 * AUFRUF (eigener Schalter, nicht Teil der Standardlaeufe):
 *     TASTATUR_SCREENS=1 npx playwright test tests/e2e/features/tastatur-screens.spec.js
 *
 * Ohne gesetztes `TASTATUR_SCREENS=1` ueberspringt sich die Datei.
 */

import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { seedPopulatedSession, loadApp } from '../helpers/test-utils.js';

const AKTIV = process.env.TASTATUR_SCREENS === '1';
const ORDNER = path.join('tests', 'e2e', '__screens__', 'tastatur');

// Die fuenf Kampfansichten des Pakets "Kampf zuerst" (Nutzerentscheidung E-1).
const KAMPFANSICHTEN = ['dashboard', 'initiative', 'party', 'dice', 'dmscreen'];

/**
 * Ergaenzt den Projekt-Seed um das, was fuer die Bilder dieses Strangs
 * gebraucht wird und in `seedPopulatedSession()` fehlt: Spieler-Kaempfer mit
 * Zauberplaetzen (fuer die Punktgruppe) und einen Spieler auf 0 TP (die
 * Todesretter erscheinen nur dort). Laeuft NACH dem Projekt-Seed und
 * veraendert nur die Initiative und die Zauberplaetze der Helden.
 */
async function ergaenzeKampfSeed(page) {
    await page.addInitScript(() => {
        try {
            const roh = localStorage.getItem('dnd-tracker-v4');
            if (!roh) return;
            const d = JSON.parse(roh);
            (d.characters || []).forEach(c => {
                c.spellSlots = { 1: { max: 4, current: 3 }, 2: { max: 3, current: 2 } };
            });
            const held = (d.characters || [])[0];
            const name = held ? held.name : 'Held';
            d.initiative = d.initiative || { combatants: [], currentTurn: 0, round: 1 };
            d.initiative.combatants = [
                ...(d.initiative.combatants || []),
                {
                    id: 101,
                    name,
                    initiative: 18,
                    initBonus: 2,
                    maxHp: 40,
                    currentHp: 31,
                    ac: 14,
                    type: 'player',
                    effects: []
                },
                {
                    id: 102,
                    name: name + ' (bewusstlos)',
                    initiative: 12,
                    initBonus: 1,
                    maxHp: 34,
                    currentHp: 0,
                    ac: 13,
                    type: 'player',
                    effects: []
                }
            ];
            d.initiative.currentTurn = 0;
            d.initiative.round = 2;
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(d));
        } catch (e) {
            /* Ablichtung ohne Ergaenzung ist besser als kein Bild */
        }
    });
}

/** Echte Tabulatorspruenge, bis das Praedikat zutrifft. Nie `.focus()`. */
async function tabBis(page, pred, max = 320) {
    for (let i = 1; i <= max; i++) {
        await page.keyboard.press('Tab');
        if (await page.evaluate(pred)) return i;
    }
    return null;
}

/** Beschreibung des fokussierten Elements — kommt in die Begleitdatei. */
const FOKUS = () => {
    const el = document.activeElement;
    if (!el || el === document.body) return { sig: 'BODY' };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
        sig:
            el.tagName.toLowerCase() +
            (el.id ? '#' + el.id : '') +
            (typeof el.className === 'string' && el.className.trim()
                ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
                : ''),
        text: (el.getAttribute('title') || el.textContent || '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 50),
        aktion: el.getAttribute('data-action') || null,
        tabindex: el.getAttribute('tabindex'),
        role: el.getAttribute('role'),
        outline: cs.outlineWidth + ' ' + cs.outlineStyle + ' ' + cs.outlineColor,
        rect: {
            x: Math.round(r.x),
            y: Math.round(r.y),
            w: Math.round(r.width),
            h: Math.round(r.height)
        }
    };
};

/** Naheinstellung um das fokussierte Element (der Ring ist 2 px und geht im Vollbild unter). */
async function naheinstellung(page, datei, rand = 70) {
    const r = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const b = el.getBoundingClientRect();
        return { x: b.x, y: b.y, w: b.width, h: b.height };
    });
    if (!r || r.w === 0) return false;
    const vp = page.viewportSize() || { width: 1440, height: 900 };
    const clip = {
        x: Math.max(0, r.x - rand),
        y: Math.max(0, r.y - rand),
        width: Math.min(vp.width, r.w + 2 * rand),
        height: Math.min(vp.height, r.h + 2 * rand)
    };
    if (clip.width <= 0 || clip.height <= 0) return false;
    await page.screenshot({ path: path.join(ORDNER, datei), clip });
    return true;
}

test.describe('TAST — Ablichtung: Fokus in den Kampfansichten, im Dialog, auf der Punktgruppe', () => {
    test.describe.configure({ mode: 'serial' });
    const begleit = [];

    test.beforeEach(async () => {
        test.skip(
            !AKTIV,
            'Ablichtung nur auf Anforderung: TASTATUR_SCREENS=1 setzen (nicht Teil der Standardlaeufe).'
        );
        fs.mkdirSync(ORDNER, { recursive: true });
    });

    test.afterAll(async () => {
        if (!AKTIV || !begleit.length) return;
        fs.writeFileSync(
            path.join(ORDNER, 'begleitdatei.json'),
            JSON.stringify({ erzeugt: new Date().toISOString(), bilder: begleit }, null, 1)
        );
    });

    // ---- (1) Die fuenf Kampfansichten, je mit einem ERTABULIERTEN Element ----
    for (const ansicht of KAMPFANSICHTEN) {
        test(`Kampfansicht ${ansicht} mit ertabuliertem Element`, async ({ page }) => {
            await seedPopulatedSession(page);
            await ergaenzeKampfSeed(page);
            await page.setViewportSize({ width: 1440, height: 900 });
            await loadApp(page);
            await page.evaluate(v => window.switchView && window.switchView(v), ansicht);
            await page.waitForTimeout(1200);

            // Bevorzugt ein von der Kehrschleife (T-C) nachgeruestetes Element —
            // genau dort ist offen, ob der Ring so deutlich liest wie am Knopf.
            let halt = await tabBis(
                page,
                `(() => { const el = document.activeElement;
                  return !!(el && el !== document.body && el.matches &&
                    el.matches('[data-action][tabindex="0"]') && el.tagName !== 'BUTTON'); })()`,
                320
            );
            let art = 'nachgeruestet';
            if (!halt) {
                // Keine nachgeruestete Stelle in dieser Ansicht: dann ein Knopf,
                // damit das Bild nicht ausfaellt. Die Begleitdatei sagt, was es ist.
                await page.evaluate(() => window.scrollTo(0, 0));
                await page.keyboard.press('Tab');
                halt = 1;
                art = 'nativer Knopf (keine nachgeruestete Stelle ertabuliert)';
            }
            const f = await page.evaluate(FOKUS);
            await page.screenshot({
                path: path.join(ORDNER, `kampfansicht-${ansicht}.png`),
                fullPage: false
            });
            const nah = await naheinstellung(page, `kampfansicht-${ansicht}-nah.png`);
            begleit.push({
                bild: `kampfansicht-${ansicht}.png`,
                ansicht,
                halt,
                art,
                fokus: f,
                naheinstellung: nah
            });
        });
    }

    // ---- (2) Ein offener Dialog, Fokus DRINNEN (T-D) ----
    test('offener Dialog mit Fokus darin (Lebenspunkte-Rechner per H)', async ({ page }) => {
        await seedPopulatedSession(page);
        await ergaenzeKampfSeed(page);
        await page.setViewportSize({ width: 1440, height: 900 });
        await loadApp(page);
        await page.evaluate(() => window.switchView && window.switchView('initiative'));
        await page.waitForTimeout(1200);

        // Das Kuerzel aus E-4 — echter Tastendruck, kein Klick.
        await page.keyboard.press('h');
        await page.waitForTimeout(700);
        const beimOeffnen = await page.evaluate(FOKUS);
        await page.screenshot({ path: path.join(ORDNER, 'dialog-fokus-beim-oeffnen.png') });
        begleit.push({
            bild: 'dialog-fokus-beim-oeffnen.png',
            fokus: beimOeffnen,
            schale: await page.evaluate(() =>
                Array.from(document.querySelectorAll('.modal-overlay.show,.modal-overlay.active'))
                    .map(m => m.id)
                    .join(',')
            )
        });

        // Nach mehreren echten Spruengen muss der Fokus noch INNEN liegen (Fokusfalle).
        const stationen = [];
        for (let i = 0; i < 12; i++) {
            await page.keyboard.press('Tab');
            stationen.push(
                await page.evaluate(() => {
                    const el = document.activeElement;
                    const schale = document.querySelector(
                        '.modal-overlay.show,.modal-overlay.active'
                    );
                    return {
                        sig:
                            el && el !== document.body
                                ? el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
                                : 'BODY',
                        innen: !!(schale && el && schale.contains(el))
                    };
                })
            );
        }
        const f = await page.evaluate(FOKUS);
        await page.screenshot({ path: path.join(ORDNER, 'dialog-fokus-nach-12-spruengen.png') });
        await naheinstellung(page, 'dialog-fokus-nah.png');
        begleit.push({
            bild: 'dialog-fokus-nach-12-spruengen.png',
            fokus: f,
            spruengeInnen: stationen.filter(s => s.innen).length,
            spruengeGesamt: stationen.length,
            stationen
        });
    });

    // ---- (3) Die Punktgruppen im PFEILTASTENMODUS (E-2 umgesetzt) ----
    //
    // Der Ablauf ist der des Spielleiters und nicht der kuerzeste: EIN
    // Tabulatorsprung in die Gruppe, dann mit echten Pfeiltastendruecken
    // nach innen. Das Bild zeigt den Fokus auf einem MITTLEREN Punkt — die
    // Lage, die vor E-2 nur ueber einen eigenen Halt je Punkt erreichbar war.
    // `stationen` in der Begleitdatei macht die Fahrt nachlesbar; ohne sie
    // waere am Bild nicht zu sehen, WIE der Fokus dorthin kam.

    /**
     * Fuehrt die Pfeiltastenfahrt in einer Gruppe aus und sammelt, was
     * fuer das Urteil am Bild gebraucht wird.
     * @param {import('@playwright/test').Page} page
     * @param {string} behaelterSel
     * @param {string} gliedSel
     * @param {number} schritte
     */
    async function fahreInGruppe(page, behaelterSel, gliedSel, schritte) {
        const stationen = [];
        for (let i = 0; i < schritte; i++) {
            await page.keyboard.press('ArrowRight');
            stationen.push(await page.evaluate(FOKUS));
        }
        const gruppe = await page.evaluate(
            ([bSel, gSel]) => {
                const b = document.activeElement?.closest(bSel);
                const alle = Array.from(document.querySelectorAll(gSel));
                const halte = alle.filter(x => x.getAttribute('tabindex') === '0');
                return {
                    punkteInGruppe: b ? b.querySelectorAll(gSel).length : null,
                    punkteInAnsicht: alle.length,
                    halteInAnsicht: halte.length,
                    gruppenInAnsicht: document.querySelectorAll(bSel).length,
                    einHaltJeGruppe:
                        Array.from(document.querySelectorAll(bSel)).every(
                            x =>
                                Array.from(x.querySelectorAll(gSel)).filter(
                                    y => y.getAttribute('tabindex') === '0'
                                ).length === 1
                        ) && alle.length > 0,
                    rolleBehaelter: b ? b.getAttribute('role') : null,
                    ausrichtung: b ? b.getAttribute('aria-orientation') : null,
                    beschriftung: b ? b.getAttribute('aria-label') : null
                };
            },
            [behaelterSel, gliedSel]
        );
        return { stationen, gruppe };
    }

    test('Punktgruppe Zauberplaetze — Pfeiltastenmodus (E-2)', async ({ page }) => {
        await seedPopulatedSession(page);
        await ergaenzeKampfSeed(page);
        await page.setViewportSize({ width: 1440, height: 900 });
        await loadApp(page);
        await page.evaluate(() => window.switchView && window.switchView('initiative'));
        await page.waitForTimeout(1200);

        const halt = await tabBis(
            page,
            `(() => { const el = document.activeElement;
            return !!(el && el.matches && el.matches('.init-slot-box')); })()`,
            320
        );
        if (halt) {
            // Drei Schritte nach rechts: der vierte Platz von sieben.
            const { stationen, gruppe } = await fahreInGruppe(
                page,
                '.init-spell-slots',
                '.init-slot-box',
                3
            );
            const f = await page.evaluate(FOKUS);
            await page.screenshot({
                path: path.join(ORDNER, 'punktgruppe-zauberplaetze-pfeiltastenmodus.png')
            });
            await naheinstellung(page, 'punktgruppe-zauberplaetze-nah.png', 40);
            begleit.push({
                bild: 'punktgruppe-zauberplaetze-pfeiltastenmodus.png',
                halt,
                pfeilschritte: stationen.length,
                stationen,
                fokus: f,
                gruppe,
                hinweis:
                    'E-2 umgesetzt: EIN Tabulatorhalt je Gruppe, darin Links/Rechts, ' +
                    'Pos1/Ende an die Raender, kein Umlauf. Das Bild zeigt den Fokus ' +
                    'auf dem vierten von sieben Punkten, erreicht mit einem ' +
                    'Tabulatorsprung und drei Pfeiltastendruecken.'
            });
        } else {
            begleit.push({
                bild: 'punktgruppe-zauberplaetze-pfeiltastenmodus.png',
                halt: null,
                hinweis: 'kein .init-slot-box ertabuliert'
            });
        }
    });

    test('Punktgruppe Todesretter — Pfeiltastenmodus (E-2)', async ({ page }) => {
        await seedPopulatedSession(page);
        await ergaenzeKampfSeed(page);
        await page.setViewportSize({ width: 1440, height: 900 });
        await loadApp(page);
        await page.evaluate(() => window.switchView && window.switchView('initiative'));
        await page.waitForTimeout(1200);

        const halt = await tabBis(
            page,
            `(() => { const el = document.activeElement;
            return !!(el && el.matches && el.matches('.death-save-dot')); })()`,
            320
        );
        if (halt) {
            // Die Vorzeichen-Reihe hat drei Punkte; EIN Schritt setzt den
            // Fokus auf den mittleren. Zwei waeren der Rand, und dort ist
            // nicht zu sehen, dass es weitergeht.
            const { stationen, gruppe } = await fahreInGruppe(
                page,
                '.death-saves-dots',
                '.death-save-dot',
                1
            );
            const f = await page.evaluate(FOKUS);
            await page.screenshot({
                path: path.join(ORDNER, 'punktgruppe-todesretter-pfeiltastenmodus.png')
            });
            await naheinstellung(page, 'punktgruppe-todesretter-nah.png', 40);
            begleit.push({
                bild: 'punktgruppe-todesretter-pfeiltastenmodus.png',
                halt,
                pfeilschritte: stationen.length,
                stationen,
                fokus: f,
                gruppe,
                hinweis:
                    'E-2 umgesetzt: je Vorzeichen-Reihe EIN Halt. Erfolge und ' +
                    'Fehlschlaege sind ZWEI Gruppen — Rechts tritt nicht in die ' +
                    'Gegenseite ueber.'
            });
        } else {
            begleit.push({
                bild: 'punktgruppe-todesretter-pfeiltastenmodus.png',
                halt: null,
                hinweis: 'kein .death-save-dot ertabuliert'
            });
        }
    });
});
