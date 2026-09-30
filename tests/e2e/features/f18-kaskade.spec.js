/* Uebersprungene Dritte der F-18-Zusammenfuehrung (UAT-Einheit U2)
   ===========================================================================
   WARUM ES DIESE PROBE BRAUCHT. Commit f514ba4 hat 131 Deklarationen nach der
   Regel verschoben "der spaetere Block bleibt, die Eigenschaften die nur der
   fruehere setzte wandern hinein" (festgehalten in
   tests/unit/design-consistency.test.js:912-915). Die Begruendung gilt nur fuer
   den Vergleich DER ZWEI KOPIEN. Stand zwischen ihnen eine DRITTE Regel
   GLEICHER Spezifitaet, die dieselbe Eigenschaft setzt, dann hatte die fruehere
   Kopie gegen sie verloren (gleiche Spezifitaet, die Dritte stand spaeter) —
   nach dem Umzug gewinnt sie. Fund F2 (Einheit U1) war der erste Fall dieser
   Klasse. `tools/check-f18-kaskade.js --verlauf` hat alle 131 durchgemessen und
   vier weitere Stellen gefunden, an denen im Browser tatsaechlich ein anderer
   Wert gilt als vor f514ba4.

   Eine hoehere oder niedrigere Spezifitaet der Dritten ist unbedenklich: sie
   gewinnt bzw. verliert vorher UND nachher. Nur bei exakt gleicher Spezifitaet
   und gleichem !important-Rang kehrt sich das Urteil um.

   DIE VIER STELLEN:

   A) `.editor-toolbar .editor-btn` (12 Deklarationen) wanderte von
      editors.css (4. @import) nach spells.css:303 (9.) — und damit HINTER die
      eigenen Varianten `.editor-toolbar .editor-btn-type` (editors.css:43) und
      `.editor-toolbar .editor-btn-text` (editors.css:49), beide (0,2,0). Die
      Basis ueberfaehrt jetzt ihre Varianten: die zwei Werkzeugleisten-Knoepfe
      mit Beschriftung ("Marker", "Bausteine") stehen auf `display: grid;
      width: 30px; padding: 0; font-size: 13px` statt `inline-flex; auto;
      0 9px; 12px`. Ein 30px-Quadrat fuer ein Wort plus Pfeil.

   B) `.btn:hover { background; color }` wanderte von core.css:462 (3.) nach
      dmscreen.css:1002 (12.) — hinter JEDE Knopfvariante: `.btn-text:hover`,
      `.btn-secondary:hover`, `.btn-warning:hover`, `.btn-icon:hover`,
      `.btn-primary:hover` (alle core.css) und `.hp-calc-btn.damage|heal|temp`
      (core.css, ohne :hover, aber gleiche Spezifitaet (0,2,0)). Jeder dieser
      Knoepfe wird beim Zeigen GOLD — der Schaden-Knopf des HP-Rechners
      verliert sein Rot, der Heilen-Knopf sein Gruen.

   C) `.form-group label { display: block }` wanderte von core.css:557 (3.)
      nach dmscreen.css:1086 (12.) — hinter `.spell-classes-grid label
      { display: inline-flex }` (spells.css:204, ebenfalls (0,1,1)). Die 13
      Klassen-Kaestchen im Zauber-Editor verlieren ihre Flex-Ausrichtung:
      Kaestchen und Beschriftung stehen nicht mehr mittig zueinander und der
      `gap: 4px` wirkt nicht.

   ROT OHNE DIE KORREKTUR (an 6f85a68 gemessen, dist frisch gebaut):
     A  display=grid  width=30px  padding=0px  fontSize=13px   (soll: flex / >30 / 0px 9px / 12px)
     B  .hp-calc-btn.damage:hover  background=rgb(212,175,55)  (soll: rgb(239,68,68))
        .hp-calc-btn.heal:hover    background=rgb(212,175,55)  (soll: rgb(74,222,128))
        .hp-calc-btn.temp:hover    background=rgb(212,175,55)  (soll: rgb(96,165,250))
        .btn-secondary:hover       background=rgb(212,175,55)  (soll: rgb(51,51,51))
        .btn-warning:hover         background=rgb(212,175,55)  (soll: rgb(251,191,36))
        .btn-primary:hover         background=rgb(212,175,55)  (soll: rgb(218,187,85))
        .btn-secondary:hover       color=rgb(17,17,17)         (soll: rgb(224,224,224))
     C  .spell-classes-grid label  display=block               (soll: flex) */
import { test, expect } from '@playwright/test';

const BUNDLE = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

const SAAT = {
    _version: '99.0.0',
    settings: { theme: 'dark', lastView: 'dashboard', markdownOnboardingSeen: true },
    characters: [{ id: 1, name: 'Testheld', class: 'Magier', level: 5, hp: 30, maxHp: 30, ac: 15 }],
    npcs: [],
    locations: [],
    quests: [],
    encounters: [],
    spells: [{ id: 1, name: 'Zauber', level: 1, school: 'Feuer', spellClass: 'Magier' }],
    loot: [],
    wiki: [{ id: 1, title: 'Eintrag', content: 'Text', category: 'Allgemein' }],
    sessionNotes: [{ id: 1, title: 'Sitzung', content: 'Text', date: '2026-01-01' }],
    randomTables: [],
    timers: [],
    shops: [],
    campaign: {},
    _nextId: { characters: 99, npcs: 99, locations: 99, quests: 99, encounters: 99, spells: 99, loot: 99, items: 99, wiki: 99, sessionNotes: 99, randomTables: 99, bestiary: 99 }
};

async function appLaden(page) {
    await page.addInitScript(saat => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(saat));
        } catch {
            // file:// erlaubt localStorage nicht in jedem Build — dann greift der App-Standard.
        }
    }, SAAT);
    await page.goto(BUNDLE);
    await page.waitForSelector('.app-title', { timeout: 20000 });
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, { timeout: 20000 });
    await page.waitForTimeout(500);
    // Uebergaenge abschalten: ohne das liest die Messung Zwischenwerte einer
    // laufenden Interpolation und meldet Unterschiede, die keine sind.
    await page.addStyleTag({
        content: '*, *::before, *::after { transition: none !important; animation: none !important; }'
    });
    await page.waitForTimeout(120);
}

/**
 * Berechneten Wert eines Elements im erzwungenen Zeigezustand lesen.
 * `page.hover()` scheidet aus: die betroffenen Knoepfe liegen in geschlossenen
 * Dialogen und Bannern, sind also nicht mit der Maus erreichbar — ihre
 * Kaskade gilt trotzdem. CDP setzt den Zustand ohne Maus.
 */
async function imZeigezustand(page, selektor, eigenschaften) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: 1 });
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: selektor });
    if (!nodeId) {
        await cdp.detach();
        return { fehlt: true };
    }
    await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
    const werte = await page.evaluate(
        ({ sel, props }) => {
            const el = document.querySelector(sel);
            const s = getComputedStyle(el);
            const out = {};
            props.forEach(p => (out[p] = s.getPropertyValue(p)));
            return out;
        },
        { sel: selektor, props: eigenschaften }
    );
    await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
    await cdp.detach();
    return werte;
}

test.describe('F-18: uebersprungene Dritte gleicher Spezifitaet (U2)', () => {
    test('A — die beschrifteten Werkzeugleisten-Knoepfe behalten ihre Textform', async ({ page }) => {
        await appLaden(page);
        await page.evaluate(() => window.switchView('wiki'));
        await page.waitForTimeout(350);

        const gemessen = await page.evaluate(() => {
            const btn = document.querySelector('.editor-toolbar .editor-btn.editor-btn-text');
            if (!btn) return { fehlt: true };
            const s = getComputedStyle(btn);
            return {
                display: s.display,
                width: s.width,
                padding: s.padding,
                fontSize: s.fontSize,
                columnGap: s.columnGap,
                // Die Beschriftung darf nicht ueber den Knopf hinauslaufen.
                ueberlauf: btn.scrollWidth - btn.clientWidth
            };
        });
        // eslint-disable-next-line no-console
        console.log('[U2-A] editor-btn-text: ' + JSON.stringify(gemessen));

        expect(gemessen.fehlt).toBeUndefined();
        // `inline-flex` wird als Flex-Element der Werkzeuggruppe zu `flex`
        // blockifiziert — `grid` waere die Basis, die die Variante ueberfaehrt.
        expect(gemessen.display).toBe('flex');
        expect(gemessen.padding).toBe('0px 9px');
        expect(gemessen.fontSize).toBe('12px');
        expect(gemessen.columnGap).toBe('7px');
        expect(parseFloat(gemessen.width)).toBeGreaterThan(30);
        expect(gemessen.ueberlauf).toBeLessThanOrEqual(0);
    });

    test('B — Knopfvarianten behalten beim Zeigen ihre eigene Flaeche', async ({ page }) => {
        await appLaden(page);

        const FAELLE = [
            ['#hp-calc-modal .hp-calc-btn.damage', 'background-color', 'rgb(239, 68, 68)'],
            ['#hp-calc-modal .hp-calc-btn.heal', 'background-color', 'rgb(74, 222, 128)'],
            ['#hp-calc-modal .hp-calc-btn.temp', 'background-color', 'rgb(96, 165, 250)'],
            ['.btn.btn-secondary', 'background-color', 'rgb(51, 51, 51)'],
            ['.btn.btn-warning', 'background-color', 'rgb(251, 191, 36)'],
            ['.btn.btn-primary', 'background-color', 'rgb(218, 187, 85)']
        ];
        const gemessen = {};
        for (const [sel, prop] of FAELLE) {
            const w = await imZeigezustand(page, sel, [prop]);
            gemessen[sel] = w.fehlt ? 'FEHLT' : w[prop];
        }
        const farbe = await imZeigezustand(page, '.btn.btn-secondary', ['color']);
        gemessen['.btn.btn-secondary color'] = farbe.fehlt ? 'FEHLT' : farbe.color;
        // eslint-disable-next-line no-console
        console.log('[U2-B] Zeigezustand: ' + JSON.stringify(gemessen, null, 1));

        for (const [sel, prop, soll] of FAELLE) {
            expect(gemessen[sel], `${sel} { ${prop} }`).toBe(soll);
        }
        expect(gemessen['.btn.btn-secondary color']).toBe('rgb(224, 224, 224)');
    });

    test('C — die Klassen-Kaestchen im Zauber-Editor bleiben Flex-Zeilen', async ({ page }) => {
        await appLaden(page);
        await page.evaluate(() => window.switchView('spells'));
        await page.waitForTimeout(350);

        const gemessen = await page.evaluate(() => {
            const labels = Array.from(document.querySelectorAll('.spell-classes-grid label'));
            if (!labels.length) return { fehlt: true };
            const s = getComputedStyle(labels[0]);
            return {
                anzahl: labels.length,
                display: s.display,
                alignItems: s.alignItems,
                columnGap: s.columnGap,
                imFormGroup: labels.filter(l => l.closest('.form-group')).length
            };
        });
        // eslint-disable-next-line no-console
        console.log('[U2-C] spell-classes-grid label: ' + JSON.stringify(gemessen));

        expect(gemessen.fehlt).toBeUndefined();
        expect(gemessen.anzahl).toBeGreaterThan(0);
        // `inline-flex` wird als Raster-Element zu `flex` blockifiziert.
        expect(gemessen.display).toBe('flex');
        expect(gemessen.alignItems).toBe('center');
        expect(gemessen.columnGap).toBe('4px');
    });

    test('D — der Fund F2 bleibt behoben: die vier Schalen stehen auf flex', async ({ page }) => {
        await appLaden(page);
        const gemessen = {};
        for (const [reiter, id] of [
            ['locations', 'view-locations'],
            ['npcs', 'view-npcs'],
            ['loot', 'view-loot'],
            ['encounter', 'view-encounter']
        ]) {
            await page.evaluate(n => window.switchView(n), reiter);
            await page.waitForTimeout(250);
            gemessen[id] = await page.evaluate(x => {
                const el = document.getElementById(x);
                return el ? getComputedStyle(el).display : 'FEHLT';
            }, id);
        }
        // eslint-disable-next-line no-console
        console.log('[U2-D] Schalen: ' + JSON.stringify(gemessen));
        Object.entries(gemessen).forEach(([id, d]) => expect(d, id).toBe('flex'));
    });
});
