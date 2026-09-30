/**
 * E2E — Kampfprotokoll-Panel (U5)
 *
 * DIE FRAGE, AN DER DIESES PANEL GEMESSEN WIRD, ist die des Spielleiters am
 * Tisch: *kann ich nach drei Wuerfen noch nachsehen, was der zweite ergeben
 * hat?* Jede Zusicherung hier ist eine Teilfrage davon — und jede nennt eine
 * Zahl, damit der rote Lauf beziffert ist und nicht bloss "fehlgeschlagen"
 * meldet.
 *
 * Der Befund, gegen den diese Datei geschrieben ist (Stand vor U5):
 *   - eine Meldung steht 2000 ms (core/config.js TOAST_DURATION) + 400 ms
 *     Ausblendung, danach ist sie WEG — kein Puffer haelt sie fest;
 *   - stiller Deckel bei FUENF Eintraegen (utils/utilities.js, `maxEntries`):
 *     die sechste Meldung verdraengt die erste, bevor sie verblassen konnte;
 *   - der Dauermodus (Taste L) wirkt nur nach vorne, ueberlebt keinen Neustart
 *     und sein Kasten sitzt mittig mit `pointer-events: auto` ueber dem Knopf,
 *     der die Eintraege erzeugt;
 *   - Einstieg heute: System ▾ → Debug → drei Klicks tief im Dialog.
 *
 * Konvention wie in timeline.spec.js/bestiary.spec.js: file://-URL auf das
 * gebaute Buendel, kein Dev-Server.
 */

import { test, expect } from '@playwright/test';
import { seedCleanSession } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/**
 * Laedt die App mit sauberem Sitzungsstand (kein Onboarding-/Backup-Hinweis, der
 * die gezaehlten Eintraege verfaelscht).
 * @param {import('@playwright/test').Page} page
 */
async function ladeApp(page) {
    await seedCleanSession(page);
    await page.goto(APP_URL);
    await page.waitForFunction(() => typeof window.showToast === 'function', { timeout: 15000 });
    await page.waitForTimeout(600);
    // Der Zaehlstand beginnt bei 0, egal welcher Start-Hinweis vorher gelaufen ist.
    // Bewusst NICHT per page.addInitScript(): das liefe auch beim reload wieder und
    // wuerde dem Neustart-Fall genau den Stand wegraeumen, den er pruefen soll.
    // clearCombatLog() leert Puffer UND Speicherschluessel in einem Zug.
    await page.evaluate(() => {
        if (typeof window.clearCombatLog === 'function') window.clearCombatLog();
        if (typeof window.clearEventLog === 'function') window.clearEventLog();
    });
}

test.describe('U5: Kampfprotokoll — nichts geht verloren', () => {
    test('acht schnelle Meldungen stehen alle acht im Protokoll', async ({ page }) => {
        await ladeApp(page);

        const messwert = await page.evaluate(() => {
            for (let i = 1; i <= 8; i++) window.showToast('Mob-Angriff ' + i, 'info');
            return {
                apiVorhanden: typeof window.getCombatLog === 'function',
                imPuffer:
                    typeof window.getCombatLog === 'function' ? window.getCombatLog().length : -1,
                imAltenLog: document.querySelectorAll('#event-log .event-log-entry').length
            };
        });

        console.log(
            `[U5-1] API getCombatLog vorhanden: ${messwert.apiVorhanden} · im Puffer: ` +
                `${messwert.imPuffer} von 8 · im alten Ereignis-Log: ${messwert.imAltenLog} von 8`
        );

        expect(messwert.apiVorhanden).toBe(true);
        expect(messwert.imPuffer).toBe(8);
    });

    test('nach drei Wuerfen ist der zweite noch nachlesbar — auch nach dem Verblassen', async ({
        page
    }) => {
        await ladeApp(page);

        await page.evaluate(() => {
            window.showToast('d20: 7 (erster Wurf)', 'info');
            window.showToast('d20: 18 (zweiter Wurf)', 'info');
            window.showToast('d20: 3 (dritter Wurf)', 'info');
        });
        // Laenger als TOAST_DURATION (2000) + Ausblendung (400): die fluechtige
        // Anzeige ist jetzt garantiert leer.
        await page.waitForTimeout(3000);

        const messwert = await page.evaluate(() => {
            const puffer = typeof window.getCombatLog === 'function' ? window.getCombatLog() : null;
            return {
                imAltenLog: document.querySelectorAll('#event-log .event-log-entry').length,
                imPuffer: puffer ? puffer.length : -1,
                zweiterGefunden: puffer
                    ? puffer.some(e => String(e.text).includes('18 (zweiter Wurf)'))
                    : false
            };
        });

        console.log(
            `[U5-2] nach 3000 ms — altes Ereignis-Log: ${messwert.imAltenLog} Eintraege · ` +
                `Puffer: ${messwert.imPuffer} · zweiter Wurf auffindbar: ${messwert.zweiterGefunden}`
        );

        expect(messwert.imPuffer).toBe(3);
        expect(messwert.zweiterGefunden).toBe(true);
    });

    test('das Protokoll ueberlebt einen Neustart der App', async ({ page }) => {
        await ladeApp(page);

        await page.evaluate(() => {
            window.showToast('Vor dem Neustart: 14 Schaden', 'info');
        });
        await page.waitForTimeout(700); // Schreibverzoegerung der Persistenz

        await page.reload();
        await page.waitForFunction(() => typeof window.showToast === 'function', {
            timeout: 15000
        });
        await page.waitForTimeout(600);

        const messwert = await page.evaluate(() => {
            const puffer = typeof window.getCombatLog === 'function' ? window.getCombatLog() : null;
            return {
                imPuffer: puffer ? puffer.length : -1,
                gefunden: puffer
                    ? puffer.some(e => String(e.text).includes('Vor dem Neustart: 14 Schaden'))
                    : false
            };
        });

        console.log(
            `[U5-3] nach reload — Puffer: ${messwert.imPuffer} Eintraege · ` +
                `Eintrag von vorher auffindbar: ${messwert.gefunden}`
        );

        expect(messwert.gefunden).toBe(true);
    });

    test('der Deckel verdraengt das Aelteste, nicht das Neueste', async ({ page }) => {
        await ladeApp(page);

        const messwert = await page.evaluate(() => {
            const deckel = window.KPLOG_DECKEL || 0;
            for (let i = 1; i <= deckel + 5; i++) window.showToast('Eintrag ' + i, 'info');
            const puffer = window.getCombatLog();
            return {
                deckel,
                laenge: puffer.length,
                neuester: puffer.length ? String(puffer[0].text) : '',
                aeltesterNochDa: puffer.some(e => String(e.text) === 'Eintrag 1')
            };
        });

        console.log(
            `[U5-4] Deckel: ${messwert.deckel} · Laenge nach ${messwert.deckel + 5} Meldungen: ` +
                `${messwert.laenge} · neuester: "${messwert.neuester}" · Eintrag 1 noch da: ` +
                `${messwert.aeltesterNochDa}`
        );

        expect(messwert.deckel).toBeGreaterThanOrEqual(50);
        expect(messwert.laenge).toBe(messwert.deckel);
        expect(messwert.neuester).toContain('Eintrag ' + (messwert.deckel + 5));
        expect(messwert.aeltesterNochDa).toBe(false);
    });
});

test.describe('U5: Kampfprotokoll — Einstieg und Panel', () => {
    test('ein sichtbarer Einstieg oeffnet das Panel — ohne den Debug-Dialog', async ({ page }) => {
        await ladeApp(page);

        const knopf = page.locator('#kampflog-toggle');
        const anzahl = await knopf.count();
        console.log(`[U5-5] Kopfknopf #kampflog-toggle im DOM: ${anzahl}`);
        await expect(knopf).toBeVisible();

        await knopf.click();
        await page.waitForTimeout(250);
        await expect(page.locator('#kampflog-panel')).toBeVisible();
    });

    test('das offene Panel blockiert die Seite nicht (nicht modal)', async ({ page }) => {
        await ladeApp(page);
        await page.evaluate(() => window.toggleCombatLog());
        await page.waitForTimeout(250);

        const messwert = await page.evaluate(() => {
            const panel = document.getElementById('kampflog-panel');
            const r = panel ? panel.getBoundingClientRect() : null;
            // Ein Punkt links der Panelkante muss zur Seite gehoeren, nicht zu einer Blende.
            const x = Math.max(8, Math.round((r ? r.left : window.innerWidth) / 2));
            const y = Math.round(window.innerHeight / 2);
            const el = document.elementFromPoint(x, y);
            const blende = el ? el.closest('.modal-overlay, .sb-overlay, .overlay') : null;
            return {
                panelBreite: r ? Math.round(r.width) : -1,
                punkt: `${x}/${y}`,
                getroffen: el ? el.tagName + (el.id ? '#' + el.id : '') : 'nichts',
                blende: blende ? blende.className : null
            };
        });

        console.log(
            `[U5-6] Panelbreite ${messwert.panelBreite}px · Punkt ${messwert.punkt} traf ` +
                `${messwert.getroffen} · Blende: ${messwert.blende || 'keine'}`
        );

        expect(messwert.blende).toBeNull();
    });

    test('der Kuerzelhinweis steht am Panel selbst', async ({ page }) => {
        await ladeApp(page);
        await page.evaluate(() => window.toggleCombatLog());
        await page.waitForTimeout(250);

        const hinweis = page.locator('#kampflog-panel .kplog-kbd-hint');
        await expect(hinweis).toBeVisible();
        const text = await hinweis.innerText();
        console.log(`[U5-7] Kuerzelhinweis am Panel: "${text.trim()}"`);
        expect(text.trim().toUpperCase()).toContain('K');
    });

    test('Taste K oeffnet und schliesst das Panel', async ({ page }) => {
        await ladeApp(page);
        await page.locator('body').click({ position: { x: 5, y: 400 } });
        await page.keyboard.press('k');
        await page.waitForTimeout(250);
        await expect(page.locator('#kampflog-panel')).toBeVisible();
        await page.keyboard.press('k');
        await page.waitForTimeout(250);
        await expect(page.locator('#kampflog-panel')).not.toBeVisible();
    });
});

test.describe('U5: Kampfprotokoll — Kategorien', () => {
    test('der Reiter Kampf zeigt nur Kampfmeldungen, Alles zeigt beide', async ({ page }) => {
        await ladeApp(page);

        const messwert = await page.evaluate(() => {
            window.showToast('Truhe gespeichert', 'success');
            window.showToast('Goblin: 7 Schaden', 'info', { kategorie: 'kampf' });
            window.showToast('Ork: 12 Schaden', 'info', { kategorie: 'kampf' });
            return {
                alles: window.getCombatLog().length,
                kampf: window.getCombatLog('kampf').length
            };
        });

        console.log(`[U5-8] Puffer: alles=${messwert.alles} · kampf=${messwert.kampf}`);
        expect(messwert.alles).toBe(3);
        expect(messwert.kampf).toBe(2);

        await page.evaluate(() => window.toggleCombatLog());
        await page.waitForTimeout(250);

        const gezeigtAlles = await page.locator('#kampflog-panel .kplog-entry').count();
        await page.locator('#kampflog-panel .kplog-tab[data-value="kampf"]').click();
        await page.waitForTimeout(200);
        const gezeigtKampf = await page.locator('#kampflog-panel .kplog-entry').count();

        console.log(`[U5-8] Panel: Reiter Alles=${gezeigtAlles} · Reiter Kampf=${gezeigtKampf}`);
        expect(gezeigtAlles).toBe(3);
        expect(gezeigtKampf).toBe(2);
    });

    test('ein echter Mob-Angriff landet unter Kampf', async ({ page }) => {
        await ladeApp(page);

        const messwert = await page.evaluate(() => {
            // Mob-Kombattant von Hand setzen, dann den echten Angriffspfad rufen.
            window.D.initiative = window.D.initiative || {};
            window.D.initiative.combatants = [
                {
                    id: 9001,
                    name: 'Goblin-Rudel',
                    type: 'enemy',
                    initiative: 12,
                    currentHp: 42,
                    maxHp: 42,
                    mob: { count: 6, defeated: 0, poolHp: 42, mode: 'n-fach' }
                }
            ];
            window.D.initiative.currentTurn = 0;
            window.D.initiative.round = 1;
            if (typeof window.clearCombatLog === 'function') window.clearCombatLog();
            if (typeof window.rollMobAttack === 'function') window.rollMobAttack(9001);
            const kampf = window.getCombatLog('kampf');
            return {
                kampfAnzahl: kampf.length,
                erster: kampf.length ? String(kampf[0].text).slice(0, 80) : ''
            };
        });

        console.log(
            `[U5-9] Mob-Angriff — Kampfeintraege: ${messwert.kampfAnzahl} · "${messwert.erster}"`
        );
        expect(messwert.kampfAnzahl).toBeGreaterThanOrEqual(1);
        expect(messwert.erster).toContain('Goblin-Rudel');
    });
});

test.describe('U5: Doppelblase abgeschaltet', () => {
    test('nach einer Meldung existiert kein #toast-Knoten mehr', async ({ page }) => {
        await ladeApp(page);

        const messwert = await page.evaluate(() => {
            window.showToast('Irgendeine Meldung', 'error');
            const t = document.getElementById('toast');
            return {
                toastVorhanden: !!t,
                toastKlasse: t ? t.className : null,
                toastStil: t ? t.getAttribute('style') : null
            };
        });

        console.log(
            `[U5-10] #toast vorhanden: ${messwert.toastVorhanden} · Klasse: ` +
                `${messwert.toastKlasse} · Inline-Stil: ${messwert.toastStil ? 'ja' : 'nein'}`
        );
        expect(messwert.toastVorhanden).toBe(false);
    });
});
