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

        // NICHT auf eine DAUER warten, sondern auf die TATSACHE, dass der
        // Eintrag im Speicher steht.
        //
        // Vorher stand hier `waitForTimeout(700)` gegen eine
        // Schreibverzoegerung von 400ms (KPLOG_SCHREIB_VERZOEGERUNG in
        // features/combat-log/combat-log-core.js) — 300ms Luft. Auf dem
        // Linux-Laeufer von GitHub reicht das nicht verlaesslich: derselbe
        // Fall war am 20.10.2026 im einen Lauf gruen und im naechsten
        // dreimal von drei rot (`retries: 2`), beide Male mit
        // "Puffer: 0 Eintraege". Der Nachbarfall, der dasselbe mit einem
        // Neuladen prueft (U5-13), wartet 3500ms und war in beiden Laeufen
        // gruen — die Dauer entscheidet, nicht das Verhalten.
        //
        // Gewartet wird ueber ALLE Protokollschluessel, nicht ueber den aus
        // `getActiveCampaignKey()` nachgerechneten. Zwei Gruende: der
        // Schluessel wird in der App aus einer Quelle gebildet
        // (`kpLogSpeicherSchluessel()`), und eine zweite Abschrift hier waere
        // genau die Drift, vor der der Kommentar an
        // KPLOG_SCHLUESSEL_SUFFIX warnt. Und faellt der Eintrag unter einen
        // ANDEREN Schluessel als den nach dem Neustart aktiven (etwa weil die
        // Kampagne beim Schreiben noch nicht initialisiert war), dann sieht
        // man das unten an den Zahlen statt es zu raten.
        const vorReload = await page
            .waitForFunction(
                text => {
                    const suffix = window.KPLOG_SCHLUESSEL_SUFFIX || '::kampfprotokoll';
                    const treffer = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const k = localStorage.key(i);
                        if (!k || !k.endsWith(suffix)) continue;
                        if (String(localStorage.getItem(k) || '').includes(text)) treffer.push(k);
                    }
                    return treffer.length ? treffer : false;
                },
                'Vor dem Neustart: 14 Schaden',
                { timeout: 15000 }
            )
            .then(h => h.jsonValue());

        await page.reload();
        await page.waitForFunction(() => typeof window.showToast === 'function', {
            timeout: 15000
        });
        await page.waitForTimeout(600);

        const messwert = await page.evaluate(() => {
            const puffer = typeof window.getCombatLog === 'function' ? window.getCombatLog() : null;
            const suffix = window.KPLOG_SCHLUESSEL_SUFFIX || '::kampfprotokoll';
            const schluessel = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.endsWith(suffix)) schluessel.push(k);
            }
            const basis =
                (typeof window.getActiveCampaignKey === 'function'
                    ? window.getActiveCampaignKey()
                    : null) ||
                window.APP_CONFIG?.STORAGE_KEY ||
                'dnd-tracker-v4';
            return {
                imPuffer: puffer ? puffer.length : -1,
                gefunden: puffer
                    ? puffer.some(e => String(e.text).includes('Vor dem Neustart: 14 Schaden'))
                    : false,
                schluessel,
                aktiverSchluessel: basis + suffix
            };
        });

        console.log(
            `[U5-3] vor reload geschrieben unter: ${JSON.stringify(vorReload)} · ` +
                `nach reload — Puffer: ${messwert.imPuffer} Eintraege · ` +
                `Eintrag von vorher auffindbar: ${messwert.gefunden} · ` +
                `Protokollschluessel im Speicher: ${JSON.stringify(messwert.schluessel)} · ` +
                `aktiver Schluessel: ${messwert.aktiverSchluessel}`
        );

        // Der Eintrag war vor dem Neustart nachweislich geschrieben (sonst
        // haette das Warten oben zugeschlagen). Faellt die Zusicherung jetzt,
        // ist es kein Wettlauf, sondern das Laden nach dem Neustart — und die
        // Zeile darueber sagt, unter welchem Schluessel er liegt und welcher
        // gelesen wird.
        expect(
            vorReload.length,
            'der Eintrag stand vor dem Neustart unter keinem Protokollschluessel'
        ).toBeGreaterThan(0);
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
            // Mob-Kombattant von Hand setzen, dann den ECHTEN Angriffspfad rufen.
            // Die Felder sind die von createMobCombatant() (features/initiative-mob.js):
            // getMobAlive() rechnet ceil(poolHp / individualMaxHp) — ohne
            // individualMaxHp meldet der Angriff NaN Treffer und der Fall wuerde
            // zwar gruen, aber nichts Richtiges messen.
            window.D.initiative = window.D.initiative || {};
            window.D.initiative.combatants = [
                {
                    id: 9001,
                    name: 'Goblin-Rudel',
                    type: 'enemy',
                    initiative: 12,
                    currentHp: 42,
                    maxHp: 42,
                    mob: {
                        count: 6,
                        poolHp: 42,
                        maxPoolHp: 42,
                        individualMaxHp: 7,
                        attackMode: 'nfach'
                    }
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

test.describe('U5: Einstieg im Mobil-Layout', () => {
    // 420px: das Mobil-Layout ist ab ~680px aktiv. Die Taste K hilft am Touchgeraet
    // nicht — hier zaehlt nur, was ein Finger trifft.
    test.use({ viewport: { width: 420, height: 760 } });

    test('auch im Mobil-Layout gibt es einen sichtbaren Weg zum Panel', async ({ page }) => {
        await ladeApp(page);

        const messwert = await page.evaluate(() => {
            const alle = [...document.querySelectorAll('[data-action="toggle-combat-log"]')];
            const sichtbar = alle.filter(e => {
                const r = e.getBoundingClientRect();
                return r.width > 0 && r.height > 0;
            });
            return {
                layout: document.documentElement.dataset.layout || '(keins)',
                imDom: alle.length,
                sichtbareWege: sichtbar.length,
                wo: sichtbar.map(e => e.id || String(e.className).slice(0, 30))
            };
        });

        console.log(
            `[U5-11] Layout: ${messwert.layout} · Ausloeser im DOM: ${messwert.imDom} · ` +
                `davon sichtbar: ${messwert.sichtbareWege} (${messwert.wo.join(', ') || 'keiner'})`
        );

        expect(messwert.layout).toBe('mobile');
        // Der Befund, aus dem U5 entstand, lautete "es gibt nur einen versteckten
        // Mausweg". Im Mobil-Layout gab es NULL: .header-actions ist dort
        // display:none, und damit auch der Kopfknopf.
        expect(messwert.sichtbareWege).toBeGreaterThanOrEqual(1);
    });

    test('der Einstieg im Mobil-Kopf oeffnet das Panel, ohne von ihm verdeckt zu werden', async ({
        page
    }) => {
        await ladeApp(page);

        const knopf = page.locator('.mobile-header [data-action="toggle-combat-log"]');
        await expect(knopf).toBeVisible();
        await knopf.click();
        await page.waitForTimeout(350);
        await expect(page.locator('#kampflog-panel')).toBeVisible();

        const geo = await page.evaluate(() => {
            const panel = document.getElementById('kampflog-panel');
            const kopf = document.querySelector('.mobile-header');
            const p = panel.getBoundingClientRect();
            const k = kopf ? kopf.getBoundingClientRect() : null;
            return {
                panel: `${Math.round(p.width)}x${Math.round(p.height)} bei ${Math.round(p.left)}/${Math.round(p.top)}`,
                kopfUnten: k ? Math.round(k.bottom) : -1,
                panelOben: Math.round(p.top),
                ueberlappung: k ? Math.max(0, Math.round(k.bottom - p.top)) : -1,
                ueberRechtemRand: Math.max(0, Math.round(p.right - window.innerWidth))
            };
        });

        console.log(
            `[U5-12] Panel ${geo.panel} · Mobil-Kopf endet bei ${geo.kopfUnten}, Panel beginnt ` +
                `bei ${geo.panelOben} · Ueberlappung: ${geo.ueberlappung}px · ueber dem rechten ` +
                `Rand: ${geo.ueberRechtemRand}px`
        );

        expect(geo.ueberlappung).toBe(0);
        expect(geo.ueberRechtemRand).toBe(0);
    });
});

test.describe('U5: Mobil-Kopf bei 360 px', () => {
    // Das engste Fenster der Linse. Der Einstieg zum Protokoll ist das SIEBENTE
    // Bedienelement im Mobil-Kopf — hier wird geprueft, dass dafuer keines der
    // anderen sechs hinausgeschoben wird.
    test.use({ viewport: { width: 360, height: 740 } });

    test('alle sieben Bedienelemente bleiben im Kopf — keines wird hinausgeschoben', async ({
        page
    }) => {
        await ladeApp(page);

        const messwert = await page.evaluate(() => {
            const kopf = document.querySelector('.mobile-header');
            if (!kopf) return { fehlt: true };
            const kr = kopf.getBoundingClientRect();
            const teile = [...kopf.querySelectorAll('button, .mobile-timer')].map(e => {
                const r = e.getBoundingClientRect();
                return {
                    was: e.id || e.title || String(e.className).split(' ')[0],
                    rausRechts: Math.max(0, Math.round(r.right - kr.right)),
                    hoehe: Math.round(r.height)
                };
            });
            return {
                fehlt: false,
                anzahl: teile.length,
                ueberlauf: kopf.scrollWidth - kopf.clientWidth,
                hinausgeschoben: teile.filter(t => t.rausRechts > 0),
                protokollDabei: teile.some(t => t.was === 'kampflog-toggle-mobil'),
                kleinsteHoehe: Math.min(...teile.map(t => t.hoehe))
            };
        });

        console.log(
            `[U5-14] Mobil-Kopf bei 360px: ${messwert.anzahl} Bedienelemente · Überlauf ` +
                `${messwert.ueberlauf}px · hinausgeschoben: ` +
                `${JSON.stringify(messwert.hinausgeschoben)} · Protokoll-Einstieg dabei: ` +
                `${messwert.protokollDabei} · kleinste Tippfläche: ${messwert.kleinsteHoehe}px hoch`
        );

        expect(messwert.fehlt).toBe(false);
        // Der Einstieg muss hier stehen (das ist der Befund) …
        expect(messwert.protokollDabei).toBe(true);
        // … und er darf dabei nichts anderes unerreichbar machen. Ohne den
        // Innenabstands-Schritt unter 400px (assets/styles/core.css) ragte der
        // Theme-Knopf 29px aus dem Kopf.
        expect(messwert.hinausgeschoben).toEqual([]);
        expect(messwert.ueberlauf).toBe(0);
        expect(messwert.kleinsteHoehe).toBeGreaterThanOrEqual(32);
    });
});

test.describe('U5: Loeschen raeumt das Protokoll mit', () => {
    test('"Alle Daten löschen" laesst keinen Kampagneninhalt im Protokoll stehen', async ({
        page
    }) => {
        // Beide Bestaetigungen des echten Wegs annehmen (plus die Rueckfrage eines
        // etwaigen gescheiterten Sicherungsschritts).
        page.on('dialog', d => d.accept());
        await ladeApp(page);

        await page.evaluate(() => {
            window.showToast('Held 01 trifft NSC 07 für 12 Schaden', 'info', {
                kategorie: 'kampf'
            });
        });
        await page.waitForTimeout(700); // ueber der Schreibverzoegerung des Protokolls

        const vor = await page.evaluate(() => ({
            mitNamen: window.getCombatLog().filter(e => /Held 01|NSC 07/.test(e.text)).length,
            schluessel: Object.keys(localStorage).filter(k => /kampfprotokoll/.test(k)).length
        }));
        expect(vor.mitNamen).toBe(1);
        expect(vor.schluessel).toBe(1);

        // Der echte Weg: zwei Bestaetigungen, Sicherheitskopie, Entfernen, Neuladen.
        await page.evaluate(() => {
            window.clearStorage();
        });
        await page.waitForTimeout(3500); // Entfernen + 1000 ms bis location.reload()
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', {
            timeout: 20000
        });
        await page.waitForTimeout(500);

        const nach = await page.evaluate(() => {
            const log = window.getCombatLog();
            return {
                gesamt: log.length,
                mitNamen: log.filter(e => /Held 01|NSC 07/.test(e.text)).map(e => e.text),
                loeschmeldung: log.some(e => /Alle Daten gelöscht/.test(e.text))
            };
        });

        console.log(
            `[U5-13] nach dem Loeschen + Neuladen — Eintraege: ${nach.gesamt} · Loeschmeldung ` +
                `vorhanden: ${nach.loeschmeldung} · noch mit Namen: ` +
                `${JSON.stringify(nach.mitNamen)}`
        );

        // Belegt, dass der Loeschweg wirklich durchgelaufen ist (und der Fall nicht
        // nur gruen ist, weil clearStorage() abgebrochen hat).
        expect(nach.loeschmeldung).toBe(true);
        expect(nach.mitNamen).toEqual([]);
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
