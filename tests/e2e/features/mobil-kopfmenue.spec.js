// @ts-check
/**
 * Der Waechter des Punkte-Menues im Mobil-Kopf (MKOPF)
 * ====================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **jede Aktion der Kopfzeile
 * ist auf dem Telefon erreichbar** — sichtbar, anklickbar, in hoechstens zwei
 * Griffen. Und die Liste der Aktionen wird NICHT abgetippt: sie kommt aus dem
 * Buendel, aus `.header-actions .header-action-btn`. Ein achter
 * Kopfzeilen-Knopf steht damit ab dem naechsten Lauf automatisch mit in der
 * Pruefung — das ist die ausgewiesene Restschuld der Mobil-Runde ("Kein
 * Waechter nimmt eine 25. Ansicht automatisch in die Pruefung auf"), hier fuer
 * die Kopfzeile geschlossen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * `[data-layout="mobile"] .header-actions { display: none }`
 * (`assets/styles/core.css`) blendet die GANZE Knopfreihe der Kopfzeile aus,
 * und das Layoutprofil folgt seit der Mobil-Runde dem Fenster
 * (`ui/layout-profiles.js`, `autoLayoutNachFenster()`). Gemessen am Buendel zu
 * 28bcab2, gefuellte Kampagne, alle sieben `.header-action-btn`, Urteil je
 * Knopf aus `checkVisibility({opacityProperty:true})` UND Rechteck UND
 * `elementFromPoint` auf der Knopfmitte:
 *
 *   Fenster     Layout    bedienbar   Befund
 *   ---------   -------   ---------   ------------------------------------
 *   1440x900    desktop     7 / 7     —
 *   1200x800    desktop     7 / 7     —
 *    900x800    desktop     4 / 7     `redo` (x=921), `show-shortcuts-overlay`
 *                                     (x=965) und `toggle-layout` (x=1009)
 *                                     liegen AUSSERHALB des 900px-Fensters
 *    680x800    mobile      0 / 7     `.header-actions` ist display:none
 *    390x844    mobile      0 / 7     dito
 *    360x740    mobile      0 / 7     dito
 *    320x700    mobile      0 / 7     dito
 *
 * WARUM "SICHTBAR" NICHT GENUEGT, und darum stehen hier drei Pruefungen statt
 * einer: die drei Knoepfe bei 900px sind nach `checkVisibility()` sichtbar und
 * haben eine Flaeche — sie liegen nur rechts des Fensterrands. `elementFromPoint`
 * auf ihrer Mitte wird dort gar nicht erst gefragt (die Mitte liegt ausserhalb
 * des Ansichtsfeldes), und ein Klick dorthin ist kein Weg. Dieselbe Falle
 * stand 2026 schon einmal in der Akte: acht CI-Faelle, `button.mobile-search-btn
 * -> nichts`, weil die Knopfmitte bei x=325 in einem 320px-Fenster lag
 * (`assets/styles/core.css`, der C1-Block an `.mobile-header`).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER MOBIL-KOPF FAENGT VIER DER SIEBEN SCHON AUF — und ohne diese Messung
 * waere der Zuschnitt falsch gewesen. `.mobile-header`
 * (`assets/templates/modals-tools.html`) fuehrt sieben sichtbare
 * Bedienelemente, und drei von ihnen tragen eine Kopfzeilen-Aktion:
 *
 *   1  call showMobileQuickNotes   "Schnellnotizen"
 *   2  undo                        "Rueckgaengig"      <- Kopfzeilen-Aktion
 *   3  toggle-combat-log           "Kampfprotokoll"    <- Kopfzeilen-Aktion
 *   4  call toggleSessionTimer     "Session Timer"
 *   5  call showMobileSearch       (Suche)
 *   6  toggle-layout                                   <- Kopfzeilen-Aktion
 *   7  show-modal theme-modal      (Theme)
 *
 * `toggle-quick-notes` ist die vierte: sie steht zwar nicht im Mobil-Kopf,
 * aber `showMobileQuickNotes` fuehrt zu derselben Schale. Offen bleiben damit
 * DREI: `redo`, `show-shortcuts-overlay` und `show-about-modal`.
 *
 * `redo` und `show-about-modal` kommen im ganzen Vorlagenbaum NUR in
 * `header.html` vor — fuer sie gibt es keinen zweiten Weg. `show-shortcuts-overlay`
 * hat einen, aber er liegt im Debug-Dialog (`assets/templates/modals-tools.html`,
 * `#debug-modal`), und der Kommentar in `header.html` nennt genau diesen Fall
 * selbst als Begruendung dafuer, warum ein Dialogweg KEIN Weg ist:
 *
 *     "Bis hierher war der Dauermodus des Ereignis-Logs nur ueber System ▾ →
 *      Debug → drei Klicks tief in einem Dialog erreichbar — deshalb hat ihn
 *      niemand gefunden."
 *
 * DARUM IST DIE SCHRANKE "ZWEI GRIFFE" UND KEINE AUSNAHMELISTE. Der Debug-Weg
 * fliegt nicht per Namensregel heraus, sondern weil er gemessen drei Griffe
 * kostet (Navigationsleiste ausfahren, Reiter "Debug", Knopf "⌨️ Shortcuts").
 * Fall (3) haelt das als eigene Zusicherung fest; waere der Debug-Dialog
 * irgendwann in zwei Griffen erreichbar, waere er ein echter Weg und diese
 * Datei saehe ihn.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS "ZWEI GRIFFE" HEISST, genau
 *
 *   EIN Griff  — ein Element mit derselben `data-action` (und, falls der
 *                Kopfzeilen-Knopf eines traegt, demselben `data-value`) ist
 *                OHNE jede Vorhandlung bedienbar.
 *   ZWEI Griffe — es gibt EIN bedienbares Element im Mobil-Kopf, nach dessen
 *                Anklicken ein solches Element bedienbar wird.
 *
 * Der Zwischenschritt wird aus `.mobile-header` genommen und nicht aus dem
 * ganzen Dokument. Das ist die Aussage, um die es geht: die Aktionen der
 * KOPFZEILE muessen vom KOPF aus erreichbar sein, nicht irgendwo tief in einer
 * Ansicht. Jeder Zwischenschritt laeuft auf einer frisch geladenen Seite —
 * sonst messen sich die Oeffner gegenseitig zu (der Mobil-Kopf traegt `undo`,
 * `toggle-combat-log` und `toggle-layout` selbst, und `toggle-layout` wechselt
 * das Layout).
 *
 * `toggle-layout` BRAUCHT KEINE AUSNAHME, obwohl es naheliegt: ein Weg, der
 * ins Desktop-Layout wechselt, waere keiner auf dem Telefon. Die Messung
 * erledigt das von selbst — nach einem Klick auf `#mobile-layout-btn` bei
 * 390px steht `data-layout="desktop"`, und alle sieben Knopfmitten liegen
 * ausserhalb des Fensters (x = 399 / 460 / 833 / 877 / 921 / 965 / 1009 bei
 * innerWidth 390). Null von sieben. Eine Regel waere hier nur eine
 * ungemessene Behauptung.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * MESSDISZIPLIN, teuer erkauft und darum ausgeschrieben
 *
 *   · BREIT LADEN, DANN VERKLEINERN. `loadApp()` wartet auf `.app-title`, und
 *     die ist im Mobil-Layout versteckt — ein Ladevorgang bei 390px laeuft in
 *     die Zeitgrenze. Jede Messung hier laedt bei 1440x900 und zieht das
 *     Fenster danach zusammen; das Layoutprofil folgt (gemessen: 680, 390, 360
 *     und 320 px ergeben alle `data-layout="mobile"`).
 *   · GEFUELLTE KAMPAGNE (`seedPopulatedSession`), nie leer.
 *   · FOKUS NUR PER `page.keyboard.press`, nie `.focus()`.
 *   · DAS GEPRUEFTE MODUL ist `ui/mobile-header-menu.js` (Aufbau der
 *     Eintraege aus der Kopfzeile, Auf/Zu, Fokusrueckgabe), dazu
 *     `ui/keyboard-group-views.js` (die Anmeldung der Gruppe),
 *     `ui/actions/ui-actions.js` (die Aktion) und
 *     `systems/spellslots/keyboard-shortcuts.js` (der Escape-Zweig).
 *   · DREI PRUEFUNGEN FUER EINE FRAGE: `checkVisibility({opacityProperty:true,
 *     visibilityProperty:true, contentVisibilityAuto:true})`, Rechteck mit
 *     Breite UND Hoehe > 0, und `elementFromPoint` auf dem Mittelpunkt — der
 *     Mittelpunkt muss dabei IM Ansichtsfeld liegen.
 */

import { test, expect } from '@playwright/test';
import { loadApp, seedPopulatedSession, waitForAppReady } from '../helpers/test-utils.js';

/** Die drei Telefonbreiten dieser Datei. 320 ist die kleinste Geraeteklasse,
 *  die der C1-Block in `core.css` namentlich fuehrt. */
const TELEFON = [
    { b: 390, h: 844 },
    { b: 360, h: 740 },
    { b: 320, h: 700 }
];

/** Die Schreibtischbreiten der Gegenprobe. */
const SCHREIBTISCH = [
    { b: 1440, h: 900 },
    { b: 1200, h: 800 }
];

/** Querformate — ein gedrehtes Telefon bleibt im Mobil-Profil, solange die
 *  kurze Seite <= 480 und die lange <= 1000 ist (`ui/layout-profiles.js`). */
const QUERFORMAT = [
    { b: 844, h: 390 },
    { b: 740, h: 360 },
    { b: 568, h: 320 }
];

/**
 * DIE LISTE DER AKTIONEN — aus dem Buendel, nicht abgetippt.
 *
 * `.header-action-btn` und nicht `[data-action]` in `.header-actions`: die
 * Reihe enthaelt daneben den (versteckten) PWA-Knopf (`.pwa-install-btn`), die
 * zwei Zaehlerknoepfe (`.session-timer-btn`) und zwei Anzeigen ohne Handlung.
 * `.header-action-btn` ist genau die Klasse der KNOEPFE, um die es geht —
 * dieselbe, die der Befund oben gezaehlt hat.
 * @param {import('@playwright/test').Page} page
 */
async function kopfAktionen(page) {
    return page.evaluate(() =>
        Array.from(document.querySelectorAll('.header-actions .header-action-btn')).map(b => ({
            aktion: b.getAttribute('data-action') || '',
            wert: b.getAttribute('data-value') || '',
            name: b.getAttribute('aria-label') || b.getAttribute('title') || ''
        }))
    );
}

/**
 * Das Urteil je Aktion im aktuellen Zustand des Fensters. Laeuft IM Browser.
 * @param {{aktion: string, wert: string, name: string}[]} paare
 */
function urteileImFenster(paare) {
    /** @param {Element} el */
    const urteil = el => {
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return 'nullflaeche';
        if (typeof el.checkVisibility === 'function') {
            const sichtbar = el.checkVisibility({
                opacityProperty: true,
                visibilityProperty: true,
                contentVisibilityAuto: true
            });
            if (!sichtbar) return 'unsichtbar';
        }
        const cx = Math.round(r.left + r.width / 2);
        const cy = Math.round(r.top + r.height / 2);
        if (cx < 0 || cy < 0 || cx >= window.innerWidth || cy >= window.innerHeight) {
            return `ausserhalb(x=${cx},y=${cy})`;
        }
        const e = document.elementFromPoint(cx, cy);
        if (!e) return 'nichts';
        if (el === e || el.contains(e)) return 'frei';
        return 'verdeckt:' + e.tagName + '.' + String(e.className || '').split(' ')[0];
    };
    /** @type {Record<string, {bedienbar: boolean, urteile: string[]}>} */
    const out = {};
    for (const p of paare) {
        const sel = p.wert
            ? `[data-action="${p.aktion}"][data-value="${p.wert}"]`
            : `[data-action="${p.aktion}"]`;
        const els = Array.from(document.querySelectorAll(sel));
        const urteile = els.map(urteil);
        out[p.aktion + (p.wert ? ':' + p.wert : '')] = {
            bedienbar: urteile.includes('frei'),
            urteile
        };
    }
    return out;
}

/**
 * Laedt die App bei 1440x900 und zieht das Fenster danach auf (b, h).
 * @param {import('@playwright/test').Page} page
 */
async function ladenDannVerkleinern(page, b, h, schonGeladen = false) {
    await page.setViewportSize({ width: 1440, height: 900 });
    if (schonGeladen) {
        await page.reload();
        await waitForAppReady(page);
        await page.waitForTimeout(400);
    } else {
        await loadApp(page);
    }
    await page.setViewportSize({ width: b, height: h });
    await page.waitForTimeout(450);
}

/**
 * Die Wege zu jeder Kopfzeilen-Aktion bei (b, h): direkt, und je Oeffner des
 * Mobil-Kopfs auf einer frisch geladenen Seite.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{aktionen: any[], direkt: Record<string, any>,
 *                    ueberOeffner: Record<string, string[]>, oeffner: string[]}>}
 */
async function messeWege(page, b, h) {
    await ladenDannVerkleinern(page, b, h);
    const aktionen = await kopfAktionen(page);
    const direkt = await page.evaluate(urteileImFenster, aktionen);

    // Die bedienbaren Bedienelemente des Mobil-Kopfs, in DOM-Reihenfolge.
    const oeffnerSel = '.mobile-header button, .mobile-header .mobile-timer';
    const oeffner = await page.evaluate(sel => {
        return Array.from(document.querySelectorAll(sel)).map(
            e =>
                (e.getAttribute('data-action') || '?') +
                (e.getAttribute('data-value') ? '/' + e.getAttribute('data-value') : '')
        );
    }, oeffnerSel);

    /** @type {Record<string, string[]>} */
    const ueberOeffner = {};
    for (let i = 0; i < oeffner.length; i++) {
        await ladenDannVerkleinern(page, b, h, true);
        const ziel = page.locator(oeffnerSel).nth(i);
        if (!(await ziel.isVisible())) continue;
        await ziel.click({ timeout: 4000 }).catch(() => {});
        await page.waitForTimeout(400);
        const nachher = await page.evaluate(urteileImFenster, aktionen);
        for (const k of Object.keys(nachher)) {
            if (nachher[k].bedienbar && !direkt[k].bedienbar) {
                (ueberOeffner[k] = ueberOeffner[k] || []).push(oeffner[i]);
            }
        }
    }
    return { aktionen, direkt, ueberOeffner, oeffner };
}

/** Eine lesbare Zeile je Aktion fuer die Fehlermeldung. */
function bericht(wege) {
    const zeilen = [];
    for (const a of wege.aktionen) {
        const k = a.aktion + (a.wert ? ':' + a.wert : '');
        const d = wege.direkt[k];
        const z = wege.ueberOeffner[k] || [];
        zeilen.push(
            `  ${k.padEnd(26)} direkt=${d.bedienbar ? 'JA ' : 'nein'} ` +
                `zweiGriffe=${d.bedienbar ? 'entfaellt' : z.length ? z.join(',') : 'KEIN WEG'} ` +
                `urteile=[${d.urteile.join(' | ')}]`
        );
    }
    return zeilen.join('\n');
}

// ===========================================================================
// (1) DIE AUSSAGE — jede Kopfzeilen-Aktion in hoechstens zwei Griffen
// ===========================================================================
for (const { b, h } of TELEFON) {
    test(`(1) ${b}x${h}: jede Kopfzeilen-Aktion ist in hoechstens zwei Griffen erreichbar`, async ({
        page
    }) => {
        test.setTimeout(240000);
        await seedPopulatedSession(page);
        const wege = await messeWege(page, b, h);

        expect(
            wege.aktionen.length,
            'Die Kopfzeile fuehrt keine .header-action-btn'
        ).toBeGreaterThan(0);

        const ohneWeg = wege.aktionen
            .map(a => a.aktion + (a.wert ? ':' + a.wert : ''))
            .filter(k => !wege.direkt[k].bedienbar && !(wege.ueberOeffner[k] || []).length);

        expect(
            ohneWeg,
            `Bei ${b}x${h} ist/sind ${ohneWeg.length} von ${wege.aktionen.length} ` +
                `Kopfzeilen-Aktion(en) auf dem Telefon NICHT erreichbar.\n` +
                `Oeffner des Mobil-Kopfs: ${wege.oeffner.join(', ')}\n` +
                bericht(wege)
        ).toEqual([]);
    });
}

// ===========================================================================
// (2) AM SCHREIBTISCH AENDERT SICH NICHTS
// ===========================================================================
test('(2) am Schreibtisch bleiben alle Kopfzeilen-Knoepfe direkt bedienbar, ohne Punkte-Menue', async ({
    page
}) => {
    test.setTimeout(120000);
    await seedPopulatedSession(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await loadApp(page);

    for (const { b, h } of SCHREIBTISCH) {
        await page.setViewportSize({ width: b, height: h });
        await page.waitForTimeout(400);
        const aktionen = await kopfAktionen(page);
        const urteile = await page.evaluate(urteileImFenster, aktionen);
        const nicht = Object.keys(urteile).filter(k => !urteile[k].bedienbar);
        expect(
            nicht,
            `Bei ${b}x${h} (Schreibtisch) sind ${nicht.length} von ${aktionen.length} ` +
                `Kopfzeilen-Knoepfen nicht bedienbar: ${JSON.stringify(urteile)}`
        ).toEqual([]);

        // Das Punkte-Menue ist eine Sache des Mobil-Layouts. Am Schreibtisch
        // darf es weder sichtbar sein noch einen Tabulatorhalt kosten.
        const menueDa = await page.evaluate(() => {
            const kn = document.getElementById('mobile-header-menu-btn');
            if (!kn) return { da: false, flaeche: '0x0' };
            const r = kn.getBoundingClientRect();
            return { da: r.width > 0 && r.height > 0, flaeche: `${r.width}x${r.height}` };
        });
        expect(
            menueDa.da,
            `Bei ${b}x${h} ist der Punkte-Knopf sichtbar (${menueDa.flaeche}) — ` +
                `er gehoert nur ins Mobil-Layout`
        ).toBe(false);
    }
});

// ===========================================================================
// (3) ZWEI GRIFFE IST DIE SCHRANKE — der Debug-Dialog ist kein Weg
// ===========================================================================
test('(3) der Weg durch den Debug-Dialog kostet drei Griffe und zaehlt darum nicht', async ({
    page
}) => {
    test.setTimeout(120000);
    await seedPopulatedSession(page);
    await ladenDannVerkleinern(page, 390, 844);

    // Griff 1: Navigationsleiste ausfahren.
    await page.click('.mobile-nav-toggle');
    await page.waitForTimeout(350);
    let imDialog = await page.evaluate(() => {
        const el = document.querySelector('#debug-modal [data-action="show-shortcuts-overlay"]');
        if (!el) return 'fehlt';
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 ? 'flaeche' : 'nullflaeche';
    });
    // ZWEI ZULAESSIGE ANTWORTEN, und der Unterschied gehoert in die Meldung:
    // `nullflaeche` heisst "der Knopf ist da, aber der Dialog ist zu" — der
    // gemessene Zustand. `fehlt` heisst "den Knopf gibt es nicht mehr", und
    // das ist kein Fehler dieses Schrittes, sondern ein Befund, den die
    // Zusicherung weiter unten namentlich meldet. Nur `flaeche` waere hier
    // ein Fehlschlag: dann waere der Dialogweg kuerzer als gemessen.
    // (Gemessen an der Mutation "Debug-Knopf entfernt": vorher meldete dieser
    // Fall "hat der Debug-Knopf schon Flaeche" und log dabei.)
    expect(
        ['fehlt', 'nullflaeche'],
        `Nach EINEM Griff (Navigation ausfahren) antwortet der Debug-Knopf mit ` +
            `"${imDialog}" — bei "flaeche" waere der Dialogweg kuerzer als gemessen`
    ).toContain(imDialog);

    // Griff 2: Reiter "Debug". Er liegt im Mobil-Layout flach im Raster
    // (`.nav-group { display: contents }`), also ohne Gruppenmenue davor.
    const debugReiter = page.locator('[data-action="call"][data-value="showDebugModal"]').first();
    await debugReiter.scrollIntoViewIfNeeded().catch(() => {});
    await debugReiter.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(400);

    // Erst JETZT, nach zwei Griffen, hat der Knopf im Dialog Flaeche — und das
    // ist noch nicht die Handlung: der dritte Griff ist der Knopf selbst.
    imDialog = await page.evaluate(() => {
        const el = document.querySelector('#debug-modal [data-action="show-shortcuts-overlay"]');
        if (!el) return 'fehlt';
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 ? 'flaeche' : 'nullflaeche';
    });
    const hilfeOffen = await page.evaluate(
        () => !!document.getElementById('shortcuts-overlay')?.classList.contains('show')
    );
    expect(
        hilfeOffen,
        'Die Tastenhilfe stand nach zwei Griffen schon offen — dann waere der ' +
            'Dialogweg ein Zwei-Griff-Weg und die Schranke dieser Datei falsch'
    ).toBe(false);
    expect(
        imDialog,
        'Der Debug-Dialog traegt den Knopf "⌨️ Shortcuts" nicht mehr — die ' +
            'Begruendung dieser Datei (drei Griffe tief in einem Dialog) ist ' +
            'damit ueberholt und gehoert nachgezogen'
    ).toBe('flaeche');
});

// ===========================================================================
// (4) DER MOBIL-KOPF BLEIBT, WIE ER WAR — die Gegenprobe mit der Maus
// ===========================================================================
for (const { b, h } of [...TELEFON, ...QUERFORMAT]) {
    test(`(4) ${b}x${h}: die Bedienelemente des Mobil-Kopfs bleiben alle bedienbar, ohne Ueberlauf`, async ({
        page
    }) => {
        test.setTimeout(120000);
        await seedPopulatedSession(page);
        await ladenDannVerkleinern(page, b, h);

        const m = await page.evaluate(() => {
            const mk = document.querySelector('.mobile-header');
            if (!mk) return { fehlt: true };
            const r = mk.getBoundingClientRect();
            const posten = Array.from(mk.querySelectorAll('button, .mobile-timer'));
            const urteil = el => {
                const pr = el.getBoundingClientRect();
                if (pr.width <= 0 || pr.height <= 0) return 'nullflaeche';
                const cx = Math.round(pr.left + pr.width / 2);
                const cy = Math.round(pr.top + pr.height / 2);
                if (cx < 0 || cy < 0 || cx >= window.innerWidth || cy >= window.innerHeight) {
                    return `ausserhalb(x=${cx},y=${cy})`;
                }
                const e = document.elementFromPoint(cx, cy);
                if (!e) return 'nichts';
                return el === e || el.contains(e)
                    ? 'frei'
                    : 'verdeckt:' + e.tagName + '.' + String(e.className || '').split(' ')[0];
            };
            return {
                fehlt: false,
                layout: document.documentElement.dataset.layout,
                kopfBreite: Math.round(r.width),
                kopfHoehe: Math.round(r.height),
                scrollW: mk.scrollWidth,
                clientW: mk.clientWidth,
                // Eine Zeile heisst: alle unmittelbaren Kinder liegen in
                // derselben Zeile. Gemessen wird ihre MITTE, nicht ihre
                // Oberkante — der Zaehler ist 5px flacher als die Knoepfe und
                // sitzt deshalb 3px tiefer, ohne umgebrochen zu sein.
                zeilen: new Set(
                    Array.from(mk.children).map(c => {
                        const cr = c.getBoundingClientRect();
                        return Math.round(cr.top + cr.height / 2);
                    })
                ).size,
                posten: posten.map(p => ({
                    a:
                        (p.getAttribute('data-action') || '?') +
                        (p.getAttribute('data-value') ? '/' + p.getAttribute('data-value') : ''),
                    u: urteil(p),
                    hoehe: Math.round(p.getBoundingClientRect().height * 10) / 10,
                    breite: Math.round(p.getBoundingClientRect().width * 10) / 10
                }))
            };
        });

        expect(m.fehlt, '.mobile-header fehlt im Buendel').toBe(false);
        expect(m.layout, `Bei ${b}x${h} gilt nicht das Mobil-Profil`).toBe('mobile');

        const nicht = m.posten.filter(p => p.u !== 'frei');
        expect(
            nicht,
            `Bei ${b}x${h} sind ${nicht.length} von ${m.posten.length} Bedienelementen ` +
                `des Mobil-Kopfs nicht bedienbar:\n${JSON.stringify(m, null, 1)}`
        ).toEqual([]);

        // KEIN UEBERLAUF. `.mobile-header` ist `position: fixed` — was ueber
        // dem rechten Rand liegt, ist unerreichbar, denn dort scrollt nichts
        // hin.
        expect(
            m.scrollW,
            `Bei ${b}x${h} laeuft der Mobil-Kopf ueber: scrollWidth ${m.scrollW} > ` +
                `clientWidth ${m.clientW}\n${JSON.stringify(m, null, 1)}`
        ).toBe(m.clientW);

        // EINE ZEILE. Der Umbruch (`flex-wrap: wrap`) ist das Sicherheitsnetz
        // und darf nicht der Normalfall werden: die Isthoehe dieser Leiste geht
        // ueber `--mobile-header-height` in `--view-frame-height` ein und damit
        // direkt von der Hoehe aller Listen-Schalen ab.
        expect(
            m.zeilen,
            `Bei ${b}x${h} bricht der Mobil-Kopf auf ${m.zeilen} Zeilen um ` +
                `(Hoehe ${m.kopfHoehe}px)\n${JSON.stringify(m, null, 1)}`
        ).toBe(1);

        // DIE TIPPFLAECHE BLEIBT 43px HOCH. Der C1-Block in `core.css` haelt
        // das als Zusage fest ("die Hoehe der Tippflaeche (43px) bleibt
        // unberuehrt"); die Zahl steht hier, damit eine Runde sie nicht
        // stillschweigend zurueckholt.
        const flach = m.posten.filter(p => p.a !== 'call/toggleSessionTimer' && p.hoehe < 43);
        expect(
            flach,
            `Bei ${b}x${h} sind ${flach.length} Tippflaechen niedriger als 43px: ` +
                JSON.stringify(flach)
        ).toEqual([]);
    });
}

// ===========================================================================
// (5) DAS MENUE MIT DER TASTATUR
// ===========================================================================
test('(5) das Punkte-Menue oeffnet mit der Tastatur, faehrt mit Pfeiltasten und gibt den Fokus zurueck', async ({
    page
}) => {
    test.setTimeout(180000);
    await seedPopulatedSession(page);
    await ladenDannVerkleinern(page, 390, 844);

    // ECHTE TABULATORSPRUENGE bis zum Punkte-Knopf. Gemessen liegt der
    // Mobil-Kopf bei 390px auf den Halten 47..53 (gefuellte Kampagne,
    // Startansicht) — er steht in `modals-tools.html` und damit spaet in der
    // DOM-Reihenfolge, obwohl er oben am Fenster klebt. Das ist der
    // vorbestehende Zustand aller sieben Nachbarn und hier nicht der
    // Gegenstand; die Obergrenze laesst Luft fuer eine andere Startansicht.
    let halte = 0;
    let gefunden = false;
    for (; halte < 200; halte++) {
        await page.keyboard.press('Tab');
        gefunden = await page.evaluate(
            () => document.activeElement?.id === 'mobile-header-menu-btn'
        );
        if (gefunden) break;
    }
    expect(
        gefunden,
        `Der Punkte-Knopf (#mobile-header-menu-btn) war in ${halte + 1} echten ` +
            `Tabulatorspruengen nicht erreichbar`
    ).toBe(true);

    // Zu: aria-expanded="false", Menue ohne Flaeche.
    let stand = await page.evaluate(() => {
        const kn = document.getElementById('mobile-header-menu-btn');
        const menu = document.getElementById('mobile-header-menu');
        const r = menu ? menu.getBoundingClientRect() : null;
        return {
            expanded: kn ? kn.getAttribute('aria-expanded') : '(kein Knopf)',
            // KEIN `aria-haspopup`: dahinter liegt eine Gruppe mit
            // `role="toolbar"` (E-2), kein Menue. Die Begruendung steht im
            // Markup; hier wird sie BEWACHT — ein nachtraeglich
            // hinzugefuegtes `aria-haspopup` waere eine Falschaussage
            // gegenueber dem Vorleseprogramm.
            haspopup: kn ? kn.getAttribute('aria-haspopup') : '(kein Knopf)',
            controls: kn ? kn.getAttribute('aria-controls') : null,
            menuDa: !!menu,
            menuFlaeche: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '(kein Menue)'
        };
    });
    expect(stand.menuDa, 'Das Menue #mobile-header-menu fehlt').toBe(true);
    expect(stand.expanded, 'aria-expanded steht geschlossen nicht auf "false"').toBe('false');
    expect(
        stand.haspopup,
        'aria-haspopup steht am Punkte-Knopf — dahinter liegt aber eine Gruppe ' +
            'mit role="toolbar" (E-2) und kein Menue'
    ).toBeNull();
    expect(stand.controls, 'aria-controls zeigt nicht auf das Menue').toBe('mobile-header-menu');
    expect(stand.menuFlaeche, 'Das geschlossene Menue hat Flaeche').toBe('0x0');

    // Oeffnen mit Enter.
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
    const offen = await page.evaluate(() => {
        const kn = document.getElementById('mobile-header-menu-btn');
        const menu = document.getElementById('mobile-header-menu');
        const r = menu.getBoundingClientRect();
        const eintraege = Array.from(menu.querySelectorAll('button'));
        return {
            expanded: kn.getAttribute('aria-expanded'),
            flaeche: `${Math.round(r.width)}x${Math.round(r.height)}`,
            imFenster:
                r.left >= 0 &&
                r.right <= window.innerWidth &&
                r.top >= 0 &&
                r.bottom <= window.innerHeight,
            rolle: menu.getAttribute('role'),
            achse: menu.getAttribute('aria-orientation'),
            name: menu.getAttribute('aria-label'),
            anzahl: eintraege.length,
            aktionen: eintraege.map(e => e.getAttribute('data-action')),
            beschriftungen: eintraege.map(e => (e.textContent || '').replace(/\s+/g, ' ').trim()),
            // DIE HALTE, DIE DER BROWSER WIRKLICH ANFAEHRT, und nicht die mit
            // `tabindex="0"`. Der Unterschied ist der ganze Fall: ein
            // `<button>` OHNE `tabindex`-Attribut ist ein Halt, eines mit
            // `tabindex="-1"` keiner. Gezaehlt nach `tabindex === '0'` haette
            // eine fehlende Gruppe NULL gemeldet (gemessen an der Mutation
            // "Gruppenbehaelter greift ins Leere") — also dieselbe Richtung
            // wie "zu viele", nur mit einer Zahl, die nichts sagt. So gezaehlt
            // meldet sie SIEBEN, und das ist die Aussage: ohne Gruppe kostet
            // das offene Menue sieben Tabulatorhalte statt einem.
            halte: eintraege.filter(e => e.getAttribute('tabindex') !== '-1').length
        };
    });
    expect(offen.expanded, 'aria-expanded folgt dem Zustand nicht (offen)').toBe('true');
    expect(offen.flaeche, 'Das offene Menue hat keine Flaeche').not.toBe('0x0');
    expect(offen.imFenster, `Das offene Menue liegt nicht im Fenster (${offen.flaeche})`).toBe(
        true
    );

    // DIE SIEBEN EINTRAEGE, aus der Kopfzeile abgeleitet.
    const aktionen = await kopfAktionen(page);
    expect(
        offen.aktionen.slice().sort(),
        `Das Menue fuehrt ${offen.anzahl} Eintraege (${offen.aktionen.join(', ')}), die ` +
            `Kopfzeile ${aktionen.length} Aktionen (${aktionen.map(a => a.aktion).join(', ')})`
    ).toEqual(aktionen.map(a => a.aktion).sort());

    // BESCHRIFTUNGEN, NICHT NUR SYMBOLE. Ein Vorleseprogramm liest "↩️" als
    // nichts Nuetzliches; der Eintrag muss seinen Namen tragen.
    const ohneWort = offen.beschriftungen.filter(t => !/[A-Za-zÄÖÜäöüß]{3}/.test(t));
    expect(
        ohneWort,
        `${ohneWort.length} Menue-Eintraege tragen nur ein Symbol: ${JSON.stringify(offen.beschriftungen)}`
    ).toEqual([]);

    // EIN HALT JE GRUPPE (E-2). Sieben Eintraege, genau ein tabindex="0".
    expect(
        offen.halte,
        `Das Menue traegt ${offen.halte} Tabulatorhalte statt genau einem (E-2: ein ` +
            `Halt je Gruppe, Pfeiltasten darin)`
    ).toBe(1);
    expect(offen.rolle, 'Das Menue traegt keine Gruppenrolle').toBe('toolbar');
    expect(offen.achse, 'Die Achse der Gruppe ist nicht gemessen senkrecht').toBe('vertical');
    expect(offen.name, 'Das Menue hat keinen Namen fuers Vorleseprogramm').toBeTruthy();

    // PFEILTASTEN DURCH DIE SIEBEN. Tab fuehrt in das Menue, dann faehrt
    // ArrowDown durch die Eintraege.
    await page.keyboard.press('Tab');
    const ersterIndex = await page.evaluate(() => {
        const menu = document.getElementById('mobile-header-menu');
        return Array.from(menu.querySelectorAll('button')).indexOf(
            /** @type {HTMLElement} */ (document.activeElement)
        );
    });
    expect(
        ersterIndex,
        'Nach dem Oeffnen fuehrt Tab nicht in das Menue hinein'
    ).toBeGreaterThanOrEqual(0);

    const besucht = [ersterIndex];
    for (let i = 0; i < offen.anzahl - 1; i++) {
        await page.keyboard.press('ArrowDown');
        const idx = await page.evaluate(() => {
            const menu = document.getElementById('mobile-header-menu');
            return Array.from(menu.querySelectorAll('button')).indexOf(
                /** @type {HTMLElement} */ (document.activeElement)
            );
        });
        besucht.push(idx);
    }
    expect(
        new Set(besucht).size,
        `ArrowDown hat ${new Set(besucht).size} von ${offen.anzahl} Eintraegen erreicht: ` +
            JSON.stringify(besucht)
    ).toBe(offen.anzahl);

    // KEIN UMLAUF, und Pos1/Ende springen an die Enden.
    await page.keyboard.press('ArrowDown');
    let idx = await page.evaluate(() => {
        const menu = document.getElementById('mobile-header-menu');
        return Array.from(menu.querySelectorAll('button')).indexOf(
            /** @type {HTMLElement} */ (document.activeElement)
        );
    });
    expect(idx, 'ArrowDown am Ende laeuft um — E-2 sagt: kein Umlauf').toBe(offen.anzahl - 1);
    await page.keyboard.press('Home');
    idx = await page.evaluate(() => {
        const menu = document.getElementById('mobile-header-menu');
        return Array.from(menu.querySelectorAll('button')).indexOf(
            /** @type {HTMLElement} */ (document.activeElement)
        );
    });
    expect(idx, 'Pos1 springt nicht auf den ersten Eintrag').toBe(0);
    await page.keyboard.press('End');
    idx = await page.evaluate(() => {
        const menu = document.getElementById('mobile-header-menu');
        return Array.from(menu.querySelectorAll('button')).indexOf(
            /** @type {HTMLElement} */ (document.activeElement)
        );
    });
    expect(idx, 'Ende springt nicht auf den letzten Eintrag').toBe(offen.anzahl - 1);

    // ESCAPE SCHLIESST UND GIBT DEN FOKUS AN DEN PUNKTE-KNOPF ZURUECK.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    stand = await page.evaluate(() => {
        const kn = document.getElementById('mobile-header-menu-btn');
        const menu = document.getElementById('mobile-header-menu');
        const r = menu.getBoundingClientRect();
        return {
            expanded: kn.getAttribute('aria-expanded'),
            menuFlaeche: `${Math.round(r.width)}x${Math.round(r.height)}`,
            fokus: document.activeElement
                ? document.activeElement.id || document.activeElement.tagName
                : '(null)'
        };
    });
    expect(stand.menuFlaeche, 'Escape hat das Menue nicht geschlossen').toBe('0x0');
    expect(stand.expanded, 'aria-expanded folgt dem Zustand nicht (nach Escape)').toBe('false');
    expect(
        stand.fokus,
        `Escape hat den Fokus nicht an den Punkte-Knopf zurueckgegeben (${stand.fokus})`
    ).toBe('mobile-header-menu-btn');
});

// ===========================================================================
// (6) DAS MENUE MIT DER MAUS — und `aria-expanded` FOLGT
// ===========================================================================
test('(6) der Punkte-Knopf schaltet das Menue, und aria-expanded folgt jedem Schritt', async ({
    page
}) => {
    test.setTimeout(120000);
    await seedPopulatedSession(page);
    await ladenDannVerkleinern(page, 360, 740);

    const lese = () =>
        page.evaluate(() => {
            const kn = document.getElementById('mobile-header-menu-btn');
            const menu = document.getElementById('mobile-header-menu');
            const r = menu ? menu.getBoundingClientRect() : null;
            return {
                expanded: kn ? kn.getAttribute('aria-expanded') : '(kein Knopf)',
                offen: !!r && r.width > 0 && r.height > 0
            };
        });

    expect(await lese()).toEqual({ expanded: 'false', offen: false });
    await page.click('#mobile-header-menu-btn');
    await page.waitForTimeout(250);
    expect(await lese(), 'Erster Klick oeffnet nicht, oder aria-expanded bleibt stehen').toEqual({
        expanded: 'true',
        offen: true
    });
    await page.click('#mobile-header-menu-btn');
    await page.waitForTimeout(250);
    expect(await lese(), 'Zweiter Klick schliesst nicht, oder aria-expanded bleibt stehen').toEqual(
        {
            expanded: 'false',
            offen: false
        }
    );

    // Ein Klick DANEBEN schliesst ebenfalls — und raeumt `aria-expanded` mit.
    await page.click('#mobile-header-menu-btn');
    await page.waitForTimeout(250);
    await page.mouse.click(180, 400);
    await page.waitForTimeout(250);
    expect(await lese(), 'Ein Klick daneben schliesst das Menue nicht').toEqual({
        expanded: 'false',
        offen: false
    });

    // EIN EINTRAG TUT, WAS ER VERSPRICHT, und schliesst das Menue dabei.
    await page.click('#mobile-header-menu-btn');
    await page.waitForTimeout(250);
    await page.click('#mobile-header-menu [data-action="show-shortcuts-overlay"]');
    await page.waitForTimeout(350);
    const wirkung = await page.evaluate(() => ({
        hilfe: !!document.getElementById('shortcuts-overlay')?.classList.contains('show'),
        expanded: document.getElementById('mobile-header-menu-btn').getAttribute('aria-expanded')
    }));
    expect(wirkung.hilfe, 'Der Menue-Eintrag hat die Tastenhilfe nicht geoeffnet').toBe(true);
    expect(wirkung.expanded, 'Das Menue blieb nach der Handlung offen').toBe('false');
});

// ===========================================================================
// (7) DAS OFFENE MENUE IM QUERFORMAT — sieben Eintraege a 43px in 320px Hoehe
// ===========================================================================
//
// WARUM ES DIESEN FALL BRAUCHT, und warum Fall (5) ihn nicht sieht: der faehrt
// 390x844, und dort passen die sieben Eintraege (gemessen 196x311) bequem
// unter die 64px hohe Leiste. Im QUERFORMAT eines Telefons (568x320, 740x360,
// 844x390) ist darunter weniger Platz als das Menue hoch ist — und `.mobile-header`
// ist `position: fixed`, was ueber dem unteren Rand liegt, ist dort
// unerreichbar. Dagegen steht `max-height: calc(100vh - 78px)` plus
// `overflow-y: auto` am Menue (core.css). Dieser Fall misst, dass die Deckelung
// wirklich greift UND dass jeder Eintrag per echtem Mausrad erreichbar wird.
//
// PER MAUSRAD UND NICHT PER `scrollTop`: ein gesetztes `scrollTop` bewegt auch
// einen Bereich, den der Nutzer nicht scrollen kann, und meldet Erreichbarkeit,
// wo keine ist. Vorbild: `mobil-navigation.spec.js`, `ansichts-schalen.spec.js`.
for (const { b, h } of QUERFORMAT) {
    test(`(7) ${b}x${h}: das offene Menue bleibt im Fenster, und jeder Eintrag wird erreichbar`, async ({
        page
    }) => {
        test.setTimeout(120000);
        await seedPopulatedSession(page);
        await ladenDannVerkleinern(page, b, h);
        await page.click('#mobile-header-menu-btn');
        await page.waitForTimeout(300);

        const lage = await page.evaluate(() => {
            const menu = document.getElementById('mobile-header-menu');
            const r = menu.getBoundingClientRect();
            return {
                kasten: `${Math.round(r.width)}x${Math.round(r.height)} bei ${Math.round(r.left)},${Math.round(r.top)}`,
                unten: Math.round(r.bottom),
                fensterHoehe: window.innerHeight,
                imFenster: r.bottom <= window.innerHeight + 0.5 && r.top >= -0.5,
                links: Math.round(r.left),
                rechts: Math.round(r.right),
                waagerechtImFenster: r.left >= -0.5 && r.right <= window.innerWidth + 0.5,
                scrollH: menu.scrollHeight,
                clientH: menu.clientHeight,
                gedeckelt: menu.scrollHeight > menu.clientHeight,
                anzahl: menu.querySelectorAll('button').length
            };
        });

        expect(
            lage.imFenster,
            `Das offene Menue ragt aus dem Fenster: ${lage.kasten}, Unterkante ${lage.unten} ` +
                `bei einer Fensterhoehe von ${lage.fensterHoehe}`
        ).toBe(true);
        expect(
            lage.waagerechtImFenster,
            `Das offene Menue ragt seitlich aus dem Fenster (${lage.links}..${lage.rechts} ` +
                `in ${b}px)`
        ).toBe(true);

        // JEDER EINTRAG WIRD ERREICHBAR, notfalls nach echtem Radscrollen im
        // Menue. Gemessen wird der Mittelpunkt per `elementFromPoint` — ein
        // Eintrag unter der Deckelung ist "sichtbar" und trotzdem kein Weg.
        const erreicht = new Set();
        for (let runde = 0; runde < 12; runde++) {
            const frei = await page.evaluate(() => {
                const menu = document.getElementById('mobile-header-menu');
                const out = [];
                Array.from(menu.querySelectorAll('button')).forEach((el, i) => {
                    const r = el.getBoundingClientRect();
                    if (r.width <= 0 || r.height <= 0) return;
                    const cx = Math.round(r.left + r.width / 2);
                    const cy = Math.round(r.top + r.height / 2);
                    if (cx < 0 || cy < 0 || cx >= window.innerWidth || cy >= window.innerHeight) {
                        return;
                    }
                    const e = document.elementFromPoint(cx, cy);
                    if (e && (el === e || el.contains(e))) out.push(i);
                });
                return out;
            });
            frei.forEach(i => erreicht.add(i));
            if (erreicht.size >= lage.anzahl) break;
            const mitte = await page.evaluate(() => {
                const r = document.getElementById('mobile-header-menu').getBoundingClientRect();
                return [
                    Math.round(r.left + r.width / 2),
                    Math.round(Math.min(r.bottom, window.innerHeight) - r.height / 4)
                ];
            });
            await page.mouse.move(mitte[0], mitte[1]);
            await page.mouse.wheel(0, 60);
            await page.waitForTimeout(120);
        }

        expect(
            [...erreicht].sort((x, y) => x - y).length,
            `Bei ${b}x${h} wurden ${erreicht.size} von ${lage.anzahl} Menue-Eintraegen ` +
                `erreichbar (Menue ${lage.kasten}, scrollHeight ${lage.scrollH} in ` +
                `clientHeight ${lage.clientH}, gedeckelt=${lage.gedeckelt})`
        ).toBe(lage.anzahl);
    });
}
