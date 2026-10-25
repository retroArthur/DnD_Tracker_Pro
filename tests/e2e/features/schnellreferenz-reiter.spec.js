/**
 * Schnellreferenz — die Reiterzeile behaelt ihre Hoehe (UAT-Runde 7)
 *
 * DER BEFUND. "Beim Oeffnen eines der Elemente unter der Schnell-Referenz werden
 * die oberen Icons abgeschnitten." Gemessen am Buendel: klappt man Abschnitte
 * auf, schrumpft die Reiterzeile (Kampf / Regeln / Welt / Eigene) unter ihre
 * Inhaltshoehe. Bei 1280x600 genuegt schon "Aktionen" allein: 47 -> 36px, keine
 * der vier Beschriftungen mehr treffbar, und die Zeile bekommt eine eigene
 * senkrechte Rollleiste — genau das Bild aus der Meldung.
 *
 * DIE URSACHE. `.qref-tabs` traegt `overflow-x: auto` (assets/styles/dashboard.css).
 * Ist eine Achse nicht `visible`, wird die andere `auto`: die Zeile ist ein
 * Scroll-Container, und fuer ein solches Flex-Element loest `min-height: auto`
 * auf 0 auf. Die Spalte `.qref-panel` (Flex, mit `max-height`) verteilt den
 * Mangel dann anteilig auf alles, was schrumpfen darf — `.qref-content` UND die
 * Reiter. Die Rechnung stimmt aufs Zehntel: 192px Ueberhang x 46/(46+795) =
 * 10,5px, 47 - 10,5 = 36,5, gemessen 36,48 (1440x900, alle Abschnitte offen).
 *
 * DER BEZUGSWERT kommt aus 1440x900 mit allen Abschnitten ZU, gemessen BEVOR das
 * Fenster verkleinert wird. Am kleinen Fenster gemessen waere er selbst schon
 * gestaucht (320x568, alles zu: 40,89px), und der Fall liefe dort blind gruen —
 * der Einwand der Gegenpruefung, uebernommen.
 *
 * WIE GEMESSEN WIRD. Die Beschriftung ist ein Textknoten hinter dem Symbol; ihr
 * Rechteck kommt aus einem Range. "Im Bild" heisst: ihre Unterkante liegt
 * innerhalb der Klippkante der Zeile, UND elementFromPoint auf 85 % ihrer Hoehe
 * trifft den Reiter selbst. Headless-Chromium blendet Rollleisten aus; deshalb
 * steht `scrollHeight > clientHeight` fuer die Leiste aus der Meldung.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady, seedPopulatedSession } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Laeuft im Browser: Lage der Reiterzeile und ihrer vier Beschriftungen. */
function messeReiter() {
    const zeile = document.querySelector('#quick-ref-panel .qref-tabs');
    const inhalt = document.querySelector('#quick-ref-panel .qref-content');
    if (!zeile || !inhalt) return null;
    const zr = zeile.getBoundingClientRect();
    const rand = parseFloat(getComputedStyle(zeile).borderTopWidth) || 0;
    const klippUnten = zr.top + rand + zeile.clientHeight;
    const reiter = [...zeile.querySelectorAll('.qref-tab')].map(t => {
        const text = [...t.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
        if (!text) return { name: '(ohne Text)', imBild: false, getroffen: false };
        const r = document.createRange();
        r.selectNodeContents(text);
        const lr = r.getBoundingClientRect();
        const treffer = document.elementFromPoint(
            lr.left + lr.width / 2,
            lr.top + lr.height * 0.85
        );
        return {
            name: text.textContent.trim(),
            imBild: lr.bottom <= klippUnten + 0.5,
            getroffen: !!treffer && (treffer === t || t.contains(treffer))
        };
    });
    return {
        hoehe: Math.round(zr.height * 100) / 100,
        scrollH: zeile.scrollHeight,
        clientH: zeile.clientHeight,
        inhaltLaeuftUeber: inhalt.scrollHeight > inhalt.clientHeight,
        reiter
    };
}

/** Laedt breit, oeffnet die Schnellreferenz und liefert den Bezugswert. */
async function oeffnenUndBezug(page) {
    await seedPopulatedSession(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.evaluate(() => window.toggleQuickRef());
    await page.waitForTimeout(300);
    const bezug = await page.evaluate(messeReiter);
    expect(bezug, 'die Schnellreferenz hat sich nicht geoeffnet').not.toBeNull();
    // Der Bezugswert selbst muss heil sein, sonst prueft der Fall gegen einen
    // gestauchten Wert.
    expect(bezug.scrollH, 'schon zugeklappt rollt die Reiterzeile').toBeLessThanOrEqual(
        bezug.clientH
    );
    return bezug.hoehe;
}

/** Klappt Abschnitte im Kampf-Reiter auf; `nur` beschraenkt auf einen Abschnitt. */
async function aufklappen(page, nur) {
    const sel = nur
        ? `#qref-combat [data-qref-section="${nur}"].collapsed .qref-section-header`
        : '#qref-combat .qref-section.collapsed .qref-section-header';
    for (let i = 0; i < 20; i++) {
        const kopf = page.locator(sel).first();
        if ((await kopf.count()) === 0) break;
        await kopf.click();
        await page.waitForTimeout(80);
    }
}

function pruefe(m, bezug, lage) {
    expect(m, `${lage}: die Schnellreferenz ist nicht offen`).not.toBeNull();
    // Gegenprobe gegen Leerlauf: ohne Ueberlauf des Inhalts gibt es nichts,
    // was die Zeile stauchen koennte, und der Fall waere trivial gruen.
    expect(m.inhaltLaeuftUeber, `${lage}: der Inhalt laeuft nicht ueber`).toBe(true);
    expect(
        m.reiter.map(r => r.name),
        `${lage}: nicht vier Reiter`
    ).toHaveLength(4);
    expect(
        Math.abs(m.hoehe - bezug),
        `${lage}: die Reiterzeile misst ${m.hoehe}px statt ${bezug}px`
    ).toBeLessThanOrEqual(0.5);
    expect(
        m.scrollH,
        `${lage}: die Reiterzeile rollt selbst (scrollHeight ${m.scrollH} > clientHeight ${m.clientH})`
    ).toBeLessThanOrEqual(m.clientH);
    const verdeckt = m.reiter.filter(r => !r.imBild || !r.getroffen).map(r => r.name);
    expect(verdeckt, `${lage}: Beschriftungen abgeschnitten`).toEqual([]);
}

test.describe('Schnellreferenz: die Reiterzeile behaelt ihre Hoehe (UAT-Runde 7)', () => {
    test('(1) 1280x600, nur "Aktionen" offen — das Bild aus der Meldung', async ({ page }) => {
        const bezug = await oeffnenUndBezug(page);
        await page.setViewportSize({ width: 1280, height: 600 });
        await page.waitForTimeout(300);
        await aufklappen(page, 'actions');
        pruefe(await page.evaluate(messeReiter), bezug, '1280x600, Aktionen');
    });

    test('(2) 390x844, alle Kampf-Abschnitte offen — Telefon', async ({ page }) => {
        const bezug = await oeffnenUndBezug(page);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(500);
        await aufklappen(page, null);
        pruefe(await page.evaluate(messeReiter), bezug, '390x844, alle offen');
    });
});
