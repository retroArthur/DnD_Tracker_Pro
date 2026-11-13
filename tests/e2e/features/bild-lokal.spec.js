// @ts-check
import fs from 'node:fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

/**
 * Lokale Bilder in der Eingabe — Bild-Dialog, Bestiar-Editor, Charakterformular (AVATAR-DATEI);
 * Block (g): die Vorschau im Charakterformular beim Laden und Leeren (AVATAR-VORSCHAU)
 * =============================================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **wer ein Bild von der eigenen Platte als
 * `file:///…` eintraegt, bekommt es gespeichert und sieht es — auf der Karte, in der Vorschau und
 * nach dem Neuladen —, und ein Netzwerkpfad wird an derselben Stelle abgelehnt, ohne dass der
 * Browser ihn je anfordert.**
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * NUTZERENTSCHEIDUNG vom 03.11. zu SENKEN Offen (15) (docs/bugfixes.md, Eintrag SENKEN):
 * "Erlauben". Der Bild-Dialog soll lokale Bilder wie `file:///C:/Bilder/held.png` annehmen;
 * Netzwerkpfade bleiben gesperrt — derselbe Pruefkern wie Anzeige und Linkliste
 * (sichereBildquelle() / istLokalerDateipfad() / istLokalerPfad() im Datengrenzen-Block von
 * utils/basic.js, zeichengleich in utils/testable-utils.js; diese Hilfen aendert der Vorgang
 * nicht).
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DER BEFUND (am Code, Stand dd399a32)
 *
 *   - systems/avatars.js validateAvatarURL() fuehrt `file:` in dangerousProtocols und laesst bei
 *     absoluten URLs nur http:/https: zu. saveAvatar() meldet "❌ Ungültige URL: Nur http(s),
 *     data:image/ oder relative Pfade erlaubt, keine Netzwerkpfade" und speichert nichts.
 *   - Dieselbe Funktion fragt der Bestiar-Editor (features/bestiary/bestiary-editor.js,
 *     validateAvatarUrlSafe() hinter "🖼️ Bild setzen"): er meldet "⚠️ Ungültige oder unsichere
 *     URL". Fall (c) faehrt dieses Modul am Buendel: openBestiaryEditor(), openBstAvatarModal(),
 *     validateAvatarUrlSafe() und refreshBstAvatarPreview() — ohne es waere keiner der beiden
 *     Faelle erklaerbar. Darum steht es nicht mehr in der Ausnahmeliste von
 *     tests/unit/module-test-coverage.test.js.
 *   - Die Vorschau IM Bild-Dialog (previewAvatar) zeigt das lokale Bild schon
 *     (sichereBildquelle) — der Dialog zeigt es also und lehnt es beim Speichern ab.
 *   - Die Karten zeigen es (SENKEN (14)), wenn es auf anderem Weg in die Daten kommt.
 *   - Die Vorschau im Charakterformular, updateAvatarPreview() (features/party/party-crud.js),
 *     zeigt nur http(s). Das Feld #char-avatar wird ohne Pruefung gespeichert: die Karte zeigt
 *     danach das lokale Bild, die Vorschau "?".
 *   - Der Bild-Dialog ist nur aus der NSC-Ansicht erreichbar (🖼️ im Detailbereich, der einzige
 *     Traeger von `show-avatar-modal`, features/npcs/npc-render.js); fuer Helden ist das Feld im
 *     Formular der Weg, Fall (d).
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DER VERTRAG (AVATAR-DATEI)
 *
 *   A1  validateAvatarURL(x) nimmt x genau dann an, wenn x leer ist ODER sichereBildquelle() den
 *       gespeicherten Wert x.trim() anzeigt (beide Aufrufer trimmen vorher) UND x kein
 *       gefaehrliches Schema hat (javascript:, vbscript:, data:text/html, auch mit
 *       Steuerzeichen). Neu erlaubt: lokale `file:///`-Pfade ohne Host. Weiter
 *       gesperrt: `file://host/…`, `file://localhost/…`, `file:////host`, `//host/…`,
 *       `/%5C%5Chost/…` usw. Gilt fuer Bild-Dialog UND Bestiar-Editor. Die Tabelle aller Werte
 *       steht in tests/unit/avatars.test.js; hier der Weg durch die Oberflaeche.
 *   A2  Die Meldung nennt lokale Dateien (sinngemaess "Nur http(s), data:image/, lokale Dateien
 *       (file:///) oder relative Pfade erlaubt, keine Netzwerkpfade").
 *   A3  Die Vorschau im Charakterformular zeigt, was die Karte zeigt: ein Bild genau dann, wenn
 *       sichereBildquelle(url) es anzeigt, sonst den Platzhalter "?"; weiter per
 *       DOM-Eigenschaft, kein innerHTML mit Nutzerwert (SENKEN R1/R5).
 *   A4  Nichts sonst aendert sich: Anzeige, Linkliste, Rich-Text-Links, Datengrenze.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DIE FAELLE
 *
 *   (a) Bild-Dialog, lokale Datei: gespeichert in D und im Speicher, NSC-Karte und Detail zeigen
 *       das Bild GELADEN (naturalWidth 192, die Datei icons/icon-192.png des Repos), keine
 *       Fehlermeldung; nach dem Neuladen dasselbe.                          rot an dd399a32
 *   (b) Bild-Dialog, fuenf Netzwerkpfade: Fehlermeldung, nichts gespeichert, keine Anforderung.
 *                                                                          gruen (Sperre steht)
 *   (c) Bestiar-Editor: lokal angenommen (Vorschau 192, gespeichert, Portrait im Detail)  rot;
 *       Netzwerkpfade abgelehnt, nichts gespeichert, keine Anforderung                   gruen
 *   (d) Charakterformular: lokale Datei -> Vorschau zeigt das Bild (192)   rot;
 *       Netzwerkpfade -> Platzhalter "?", kein Bild, keine Anforderung     gruen
 *       Nachgeschaerft (Pruefbefund nach bd06445d): auch data:image/ (1 px), ein relativer Pfad
 *       und http(s) (je 192 px) zeigen das Bild, und zwei der Netzwerkpfade beginnen mit
 *       `file:///` (`file:////host/…`, `file:///%5C%5Chost/…`). Vorher blieb (d) gruen mit
 *       einer Vorschau, die jedes `file:///` ohne Pruefung zeigte und data:image/ nicht.
 *   (e) Die Meldung des Bild-Dialogs nennt lokale Dateien (A2).            rot an dd399a32
 *   (f) Kontrolle: http(s)-Bild und data:image/ werden weiter angenommen.  gruen
 *   (g) Block AVATAR-VORSCHAU (eigener Vorgang, docs/bugfixes.md): A3 galt nur fuer das
 *       TIPPEN (Fall (d)); die Vorschau folgt dem Feld jetzt auch beim LADEN (✏️) und LEEREN
 *       (Abbrechen, Speichern, Kopfzeile, Taste n, Palette, Import). Befund, Vertrag R1-R7,
 *       Faelle (W1)-(W10) und Gegenproben stehen am Block unten; er nutzt die Hilfen dieser
 *       Datei (Saat, laden() mit dem Netz-Protokoll, istNetzziel(), eintippen(), die Bilder).
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * WIE GEMESSEN WIRD
 *
 * Bedienung nur ueber echte Klicks und Tasten (Navigation ueber die Reiter wie zuReiter() in
 * senken-kanarie.spec.js, Eingaben per Tastatur Zeichen fuer Zeichen — so feuert jede Vorschau
 * bei jedem Zeichen, wie beim Nutzer). Einzige Ausnahme: der Bestiar-Editor fragt die URL mit
 * window.prompt() ab; einen nativen Dialog beantwortet Playwright nur ueber dialog.accept(text).
 * Gelesen werden D, der Speicher (`dnd-tracker-v4`), das Ereignisprotokoll (getCombatLog()) und
 * das DOM — nichts davon treibt die App.
 *
 * Das lokale Bild ist die Datei icons/icon-192.png des Repos, per pathToFileURL() aus
 * process.cwd() gebaut (unter Linux beginnt der Pfad mit `/`; `file:///` + `/home/…` ergaebe von
 * Hand `file:////home/…`, einen Netzwerkpfad). "Angezeigt" heisst GELADEN: naturalWidth 192,
 * nicht nur "ein img steht da".
 *
 * Ein Netzwerkpfad wird nie wirklich geladen (Muster eingangSpielen()/kanarienBild() in
 * senken-kanarie.spec.js): jede Anforderung unter file:, die kein lokaler Pfad ist (Host,
 * Trenner am Pfadanfang, doppelter Trenner — auch jeder getippte Zwischenstand wie
 * `file:////n`), jede, die `neben.invalid` nennt oder als letztes Pfadsegment `netzbild-?.png`
 * traegt, bricht page.route ab, BEVOR der
 * Browser sie oeffnet ('request' feuert vorher und wird gezaehlt). Entschieden wird an der URL,
 * wie Chromium sie anfordert (route.request().url()): die route-Pruefung selbst bekommt eine
 * node-URL, und node normalisiert `file://localhost/x` zu `file:///x` — Chromium behaelt den Host
 * und oeffnete ihn unter Windows als UNC `\\localhost\…`. http(s) bricht ebenfalls ab: auch die
 * Kontrolle (f) verlaesst das Geraet nicht; das http(s)-Bild in (d) beantwortet der Test selbst
 * mit der Datei des Repos. Dass die Beobachtung greift, ist gemessen: mit einer
 * Vorschau ohne jede Pruefung (Gegenprobe am Buendel, nicht eingecheckt) zaehlt (d) 68
 * Anforderungen an Netzwerkpfade — Chromium fordert jeden getippten Zwischenstand an — und
 * bricht jede ab; mit einer Pruefung nach A1 (Probe am Buendel) sind alle sieben Faelle gruen.
 * Ebenso mit der halben Vorschau `/^(?:https?:\/\/|file:\/\/\/)/i` statt sichereBildquelle()
 * (Gegenprobe am Buendel): (d) rot an beiden `file:///`-Netzwerkformen (Bild und Anforderung)
 * und an data:image/ und dem relativen Pfad (kein Bild) — vor dem Nachschaerfen 7 von 7 gruen.
 */

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
const SPEICHER = 'dnd-tracker-v4';
const BREIT = { width: 1440, height: 900 };

/** Die Datei des Repos, 192x192 — als file:///-URL aus process.cwd(). */
const LOKALE_DATEI = path.resolve(process.cwd(), 'icons', 'icon-192.png');
const LOKALES_BILD = pathToFileURL(LOKALE_DATEI).href;
const LOKALE_BREITE = 192;
/** Dieselbe Datei als relativer Pfad, vom Buendel in dist/ aus gelesen. */
const RELATIVES_BILD = '../icons/icon-192.png';

/**
 * Netzwerkpfade (A1): Host unter file:, protokoll-relativ, kodierter doppelter Trenner — und
 * zwei, die mit `file:///` beginnen (Trenner am Pfadanfang, roh und kodiert): eine Pruefung, die
 * nur auf das Praefix `file:///` schaut, laesst sie durch.
 */
const NETZWERKPFADE = [
    'file://localhost/netzbild-a.png',
    '//neben.invalid/netzbild-b.png',
    '/%5C%5Cneben.invalid/netzbild-c.png',
    'file:////neben.invalid/netzbild-d.png',
    'file:///%5C%5Cneben.invalid/netzbild-e.png'
];

/** Kontrolle (f): ein http(s)-Bild (die Anforderung bricht der Test ab) und ein data:image/ (1x1). */
const HTTPS_BILD = 'https://example.org/held.png';
const DATA_BILD =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/** WEICHE Zusicherungen fuer Ergebnisse: ein roter Lauf nennt JEDE gebrochene Zusage. */
const weich = expect.configure({ soft: true });

// ---------------------------------------------------------------------------
// Saat
// ---------------------------------------------------------------------------
const MIRA = {
    id: 1,
    name: 'Mira',
    role: 'Kartografin',
    race: 'Elfin',
    description: '',
    locationId: null,
    chapter: '',
    filterId: null,
    quests: [],
    info: [],
    relationships: [],
    triggers: [],
    dialogs: [],
    relations: [],
    avatar: ''
};

const SCHRAT = {
    id: 1,
    name: 'Sumpfschrat',
    source: 'custom',
    size: 'Mittelgroß',
    creatureType: 'Humanoid',
    alignment: 'neutral',
    cr: '2',
    xp: 450,
    ac: 13,
    acInfo: '',
    hp: 30,
    hpFormula: '4W8+12',
    speed: { walk: '9 m', fly: '', swim: '', climb: '', burrow: '' },
    str: 14,
    dex: 12,
    con: 16,
    int: 6,
    wis: 10,
    cha: 8,
    savingThrows: {},
    skills: {},
    damageResistances: [],
    damageImmunities: [],
    conditionImmunities: [],
    senses: [],
    languages: [],
    traits: '<p>Schleim</p>',
    actions: '<p>Biss</p>',
    reactions: '',
    legendaryActions: '',
    legendaryActionsPerRound: 0,
    avatar: ''
};

/**
 * @param {object[]} [characters] Helden fuer Block (g); (a)-(f) saeen keine.
 */
function saat(characters = []) {
    return {
        _version: '99.0.0',
        settings: {
            theme: 'dark',
            lastView: 'dashboard',
            markdownOnboardingSeen: true,
            enableMarkdownShortcuts: true
        },
        randomTables: [],
        timers: [],
        shops: [],
        campaign: {},
        characters,
        npcs: [MIRA],
        locations: [],
        quests: [],
        loot: [],
        spells: [],
        wiki: [],
        links: [],
        filters: [],
        factions: [],
        tags: [],
        sessionNotes: [],
        encounters: [],
        bestiary: [SCHRAT],
        bestiaryFavorites: [],
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        _nextId: {
            characters: Math.max(0, ...characters.map(c => /** @type {any} */ (c).id)) + 1,
            npcs: 2,
            locations: 1,
            quests: 1,
            encounters: 1,
            spells: 1,
            loot: 1,
            items: 1,
            wiki: 1,
            sessionNotes: 1,
            randomTables: 1,
            filters: 1,
            factions: 1,
            bestiary: 2
        }
    };
}

// ---------------------------------------------------------------------------
// Netz beobachten (Kanarien-Muster)
// ---------------------------------------------------------------------------
/**
 * Ob eine Anforderung einen Netzwerkpfad aus NETZWERKPFADE (oder sonst einen unter file:)
 * betrifft. EINE Lesart fuer den Abbruch (page.route) und die Zaehlung ('request'). Unter file:
 * ist nur `file:///` mit einem Pfad lokal, der nicht mit einem weiteren Trenner beginnt und
 * nirgends zwei hintereinander traegt — Trenner gelesen wie istLokalerPfad() (`\`, `%2F`, `%5C`
 * wie `/`). Alles andere hat einen Host oder bekommt einen (unter Windows UNC): `file://host/…`,
 * `file:////host/…`, `file:///%5C%5Chost/…` und jeder ihrer getippten Zwischenstaende
 * (`file:////n`), die `neben.invalid` noch nicht nennen.
 * @param {string} url
 */
function istNetzziel(url) {
    const s = String(url);
    if (/^file:/i.test(s)) {
        const rest = s.replace(/^file:/i, '').replace(/%2f|%5c|\\/gi, '/');
        if (!/^\/\/\/(?!\/)/.test(rest) || rest.slice(3).includes('//')) return true;
    }
    if (/neben\.invalid/i.test(s)) return true;
    const letzte = s.split(/[/\\]/).pop() || '';
    let datei = letzte;
    try {
        datei = decodeURIComponent(letzte);
    } catch {
        // unlesbare Kodierung: roh vergleichen
    }
    return /^netzbild-[a-z]\.png$/i.test(datei);
}

/**
 * Das http(s)-Bild beantwortet der Test mit der Datei des Repos; spaeter angemeldet als der
 * Abbruch in laden(), darum geht diese Route vor. Das Geraet verlaesst nichts.
 * @param {import('@playwright/test').Page} page
 */
async function httpsBildBeantworten(page) {
    await page.route(
        u => u.href === HTTPS_BILD,
        r => r.fulfill({ path: LOKALE_DATEI, contentType: 'image/png' })
    );
}

/**
 * Laedt breit, saet EINMAL je Tab (ein Neuladen liest, was die App gespeichert hat), bricht
 * jede Anforderung an das Netz und an einen Netzwerkpfad ab und zaehlt die Netzwerkpfade.
 * Block (g) gibt Helden, ein anderes Buendel, das http(s)-Bild schon VOR dem Laden (die Karte
 * eines Helden fordert es beim ersten Zeichnen an) und am Telefon die Groesse aus test.use()
 * mit: dort ist `.app-title` versteckt, darum wird nur auf `data-app-ready` gewartet.
 * @param {import('@playwright/test').Page} page
 * @param {{ url?: string, characters?: object[], httpsBild?: boolean, telefon?: boolean }} [opt]
 */
async function laden(page, opt = {}) {
    /** @type {string[]} */
    const netz = [];
    /** @type {string[]} */
    const seitenfehler = [];
    /** @type {string[]} */
    const konsole = [];
    await page.route(/^https?:/i, r => r.abort());
    if (opt.httpsBild) await httpsBildBeantworten(page);
    // Entschieden wird an der URL, wie Chromium sie anfordert (route.request().url()), nicht an
    // der node-URL der route-Pruefung: node macht aus `file://localhost/x` ein `file:///x`, der
    // Host waere weg. Gemessen mit einer Gegenprobe (Vorschau ohne Pruefung): Chromium fordert
    // beim Tippen JEDEN Zwischenstand an, `file://l/` bis `file://localhost/netzbild-a.png`.
    await page.route(
        url => url.protocol === 'file:',
        r => (istNetzziel(r.request().url()) ? r.abort() : r.continue())
    );
    page.on('request', req => {
        if (istNetzziel(req.url())) netz.push(req.url());
    });
    page.on('pageerror', e => seitenfehler.push(String(e).split('\n')[0].slice(0, 200)));
    page.on('console', m => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
            konsole.push('console.error: ' + m.text().split('\n')[0].slice(0, 200));
        }
    });
    if (!opt.telefon) await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (sessionStorage.getItem('bild-lokal-gesaet')) return;
                localStorage.setItem(schluessel, JSON.stringify(s));
                sessionStorage.setItem('bild-lokal-gesaet', '1');
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng
            }
        },
        [SPEICHER, saat(opt.characters)]
    );
    await page.goto(opt.url || APP_URL);
    if (opt.telefon) {
        await page.waitForFunction(
            () => document.documentElement.dataset.appReady === 'true',
            null,
            { timeout: 20000 }
        );
    } else {
        await waitForAppReady(page);
    }
    await page.waitForTimeout(300);
    return {
        netz,
        seitenfehler,
        /** pageerror, console.error und das Fehlerlog der App (EventDelegation faengt einen
         *  werfenden Handler und meldet ihn NUR per console.error und dort). */
        async alleFehler() {
            const log = await page.evaluate(() =>
                // @ts-ignore
                (window.ErrorHandler?.getRecentErrors?.(50) || []).map(
                    e => `ErrorHandler: ${e.fn} (${e.context}): ${e.message}`
                )
            );
            return [...seitenfehler, ...konsole, ...log];
        }
    };
}

// ---------------------------------------------------------------------------
// Bedienung
// ---------------------------------------------------------------------------
/** Abstand vor jedem Tipper (> 300 ms Sperre in initTouchOptimizations(), systems/avatars.js:
 *  ein Knopf-Tipper binnen 300 ms nach dem vorigen wird per preventDefault verschluckt). */
const TIPP_ABSTAND = 450;

/**
 * Mitte eines Elements und ob dort wirklich es selbst obenauf liegt (bestiar-klick.spec.js).
 * @param {import('@playwright/test').Page} page @param {string} sel
 */
function mitteFrei(page, sel) {
    return page.evaluate(s => {
        const el = document.querySelector(s);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const x = Math.round(r.left + r.width / 2);
        const y = Math.round(r.top + r.height / 2);
        const oben = document.elementFromPoint(x, y);
        return { x, y, frei: !!oben && (oben === el || el.contains(oben)) };
    }, sel);
}

/**
 * Reiter ueber die ECHTE Navigation (wie zuReiter() in senken-kanarie.spec.js und zurAnsicht()
 * in bestiar-klick.spec.js). Breit: Gruppenmenue zuerst oeffnen, Reiter klicken. Telefon
 * (Block (g)): Leiste per Tap ausfahren, Reiter antippen, Leiste wieder einfahren.
 * @param {import('@playwright/test').Page} page @param {string} ansicht
 */
async function zuReiter(page, ansicht) {
    const reiterSel = `.nav-tab[data-view="${ansicht}"]`;
    const mobil = await page.evaluate(() => document.documentElement.dataset.layout === 'mobile');
    if (mobil) {
        await page.waitForTimeout(TIPP_ABSTAND);
        const u = await mitteFrei(page, '.mobile-nav-toggle');
        expect(u && u.frei, 'Vorbedingung: der Umschalter der Leiste ist frei').toBe(true);
        await page.touchscreen.tap(/** @type {any} */ (u).x, /** @type {any} */ (u).y);
        await page.waitForTimeout(TIPP_ABSTAND);
        await page.locator(reiterSel).scrollIntoViewIfNeeded();
        let m = null;
        for (let i = 0; i < 40; i++) {
            m = await mitteFrei(page, reiterSel);
            if (m && m.frei) break;
            await page.waitForTimeout(150);
        }
        expect(m && m.frei, `Vorbedingung: der Reiter ${ansicht} ist frei`).toBe(true);
        await page.touchscreen.tap(/** @type {any} */ (m).x, /** @type {any} */ (m).y);
        await expect(page.locator(`#view-${ansicht}`)).toHaveClass(/\bactive\b/);
        await page.waitForTimeout(TIPP_ABSTAND);
        const offen = await page.evaluate(() => !!document.querySelector('.app-header.nav-open'));
        if (offen) {
            const u2 = await mitteFrei(page, '.mobile-nav-toggle');
            await page.touchscreen.tap(/** @type {any} */ (u2).x, /** @type {any} */ (u2).y);
            await page.waitForTimeout(TIPP_ABSTAND);
        }
        return;
    }
    const tab = page.locator(reiterSel).first();
    if (!(await tab.isVisible())) {
        await page.locator('.nav-group', { has: tab }).locator('.nav-group-btn').click();
    }
    await tab.click();
    await expect(page.locator(`#view-${ansicht}`)).toHaveClass(/\bactive\b/);
    await page.waitForTimeout(250);
}

/**
 * Feld anklicken (Block (g): mit `bedien` am Telefon antippen), leeren (Strg+A, Entf) und
 * Zeichen fuer Zeichen tippen.
 * @param {import('@playwright/test').Page} page
 * @param {string} selektor
 * @param {string} text
 * @param {(z: import('@playwright/test').Locator) => Promise<void>} [bedien]
 */
async function eintippen(page, selektor, text, bedien) {
    if (bedien) await bedien(page.locator(selektor));
    else await page.locator(selektor).click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type(text);
}

/** NSC-Ansicht, Mira waehlen, 🖼️ oeffnet den Bild-Dialog. */
async function bildDialogOeffnen(page) {
    await zuReiter(page, 'npcs');
    await page.locator('#npc-list .npc-item[data-id="1"]').click();
    await page.locator('#npc-detail-panel [data-action="show-avatar-modal"]').click();
    await expect(page.locator('#avatar-modal')).toHaveClass(/\bshow\b/);
}

/** Im offenen Bild-Dialog eine URL eintippen und "Speichern" klicken. */
async function bildDialogSpeichern(page, url) {
    await eintippen(page, '#avatar-url', url);
    await page.locator('#avatar-modal [data-action="call"][data-value="saveAvatar"]').click();
    await page.waitForTimeout(400);
}

/** Bestiar: nur eigene Kreaturen, den Schrat waehlen, "Bearbeiten". */
async function bestiarEditorOeffnen(page) {
    await zuReiter(page, 'bestiary');
    const nurEigene = page.locator('#bestiary-filter-custom');
    if (!(await nurEigene.isChecked())) await nurEigene.click();
    await page.waitForTimeout(300);
    await page
        .locator('#view-bestiary [data-action="bestiary-select"]:not([data-source="srd"])')
        .filter({ visible: true })
        .first()
        .click();
    await page
        .locator(
            '#bestiary-detail-panel [data-action="call"][data-value="openBestiaryEditor"][data-id]'
        )
        .click();
    await expect(page.locator('#bestiary-editor-modal')).toHaveClass(/\bshow\b/);
    await expect(page.locator('#bst-avatar-section')).toBeVisible();
}

/** "🖼️ Bild setzen" im Bestiar-Editor; den nativen prompt() beantwortet dialog.accept(url). */
async function bestiarBildSetzen(page, url) {
    page.once('dialog', d => d.accept(url).catch(() => {}));
    await page.locator('#bst-avatar-btn').click();
    await page.waitForTimeout(400);
}

/** Charakterformular ueber seine Kopfzeile oeffnen (die Karte, die #char-form traegt). */
async function charakterFormularOeffnen(page) {
    await zuReiter(page, 'party');
    await page.locator('#view-party .card:has(> #char-form) > .collapsible-header').click();
    await expect(page.locator('#char-form')).toHaveClass(/\bopen\b/);
}

// ---------------------------------------------------------------------------
// Messen
// ---------------------------------------------------------------------------
/** naturalWidth eines geladenen Bildes, 0 solange es nicht geladen ist, -1 ohne Element. */
async function bildBreite(locator) {
    return locator
        .first()
        .evaluate(
            img => {
                const bild = /** @type {HTMLImageElement} */ (img);
                return bild.complete ? bild.naturalWidth : 0;
            },
            undefined,
            { timeout: 500 }
        )
        .catch(() => -1);
}

/** Das Ereignisprotokoll der App (Meldungen von showToast), neueste zuerst. */
async function protokoll(page) {
    return page.evaluate(() =>
        // @ts-ignore
        (typeof window.getCombatLog === 'function' ? window.getCombatLog() : []).map(e => ({
            nr: e.nr,
            typ: e.typ,
            text: e.text
        }))
    );
}

/** Hoechste Nummer im Protokoll — Meldungen danach gehoeren zur gemessenen Handlung. */
async function protokollStand(page) {
    const p = await protokoll(page);
    return p.reduce((m, e) => Math.max(m, e.nr), 0);
}

/** Fehlermeldungen seit `stand`. */
async function fehlerSeit(page, stand) {
    return (await protokoll(page)).filter(e => e.nr > stand && e.typ === 'error');
}

/** Avatar in D und im Speicher. */
async function gespeichert(page, sammlung) {
    return page.evaluate(
        ([schluessel, s]) => {
            let speicher;
            try {
                speicher = JSON.parse(localStorage.getItem(schluessel) || '{}')?.[s]?.[0]?.avatar;
            } catch {
                speicher = 'unlesbar';
            }
            // @ts-ignore
            return { d: window.D?.[s]?.[0]?.avatar ?? '', speicher: speicher ?? '' };
        },
        [SPEICHER, sammlung]
    );
}

// ===========================================================================
// (a) Bild-Dialog: lokale Datei wird gespeichert und angezeigt
// ===========================================================================
test('(a) Bild-Dialog: ein lokales Bild (file:///) wird gespeichert und auf der Karte geladen, auch nach dem Neuladen', async ({
    page
}) => {
    test.setTimeout(60000);
    const { netz, seitenfehler } = await laden(page);
    await bildDialogOeffnen(page);
    const stand = await protokollStand(page);
    await bildDialogSpeichern(page, LOKALES_BILD);

    weich(await fehlerSeit(page, stand), 'keine Fehlermeldung beim Speichern').toEqual([]);
    await weich
        .poll(() => gespeichert(page, 'npcs'), { timeout: 4000 })
        .toEqual({ d: LOKALES_BILD, speicher: LOKALES_BILD });
    // Der Dialog schliesst nach dem Speichern
    await weich(page.locator('#avatar-modal')).not.toHaveClass(/\bshow\b/);
    // Karte in der Liste und Detailbereich zeigen das Bild GELADEN
    await weich
        .poll(
            () => bildBreite(page.locator('#npc-list .npc-item[data-id="1"] .npc-item-avatar img')),
            {
                timeout: 5000
            }
        )
        .toBe(LOKALE_BREITE);
    await weich
        .poll(() => bildBreite(page.locator('#npc-detail-panel .npc-detail-avatar img')), {
            timeout: 5000
        })
        .toBe(LOKALE_BREITE);

    // Nach dem Neuladen: aus dem Speicher, nicht aus D
    await page.reload();
    await waitForAppReady(page);
    await page.waitForTimeout(300);
    await weich
        .poll(() => gespeichert(page, 'npcs'), { timeout: 4000 })
        .toEqual({ d: LOKALES_BILD, speicher: LOKALES_BILD });
    await zuReiter(page, 'npcs');
    await weich
        .poll(
            () => bildBreite(page.locator('#npc-list .npc-item[data-id="1"] .npc-item-avatar img')),
            {
                timeout: 5000
            }
        )
        .toBe(LOKALE_BREITE);
    await page.locator('#npc-list .npc-item[data-id="1"]').click();
    await weich
        .poll(() => bildBreite(page.locator('#npc-detail-panel .npc-detail-avatar img')), {
            timeout: 5000
        })
        .toBe(LOKALE_BREITE);

    expect(netz, 'keine Anforderung an einen Netzwerkpfad').toEqual([]);
    expect(seitenfehler).toEqual([]);
});

// ===========================================================================
// (b) Bild-Dialog: Netzwerkpfade werden abgelehnt
// ===========================================================================
test('(b) Bild-Dialog: Netzwerkpfade werden mit Meldung abgelehnt, nichts gespeichert, keine Anforderung', async ({
    page
}) => {
    test.setTimeout(60000);
    const { netz, seitenfehler } = await laden(page);
    await bildDialogOeffnen(page);
    for (const url of NETZWERKPFADE) {
        const stand = await protokollStand(page);
        await bildDialogSpeichern(page, url);
        const fehler = await fehlerSeit(page, stand);
        weich(fehler.length, `Fehlermeldung fuer ${url}`).toBe(1);
        weich(await gespeichert(page, 'npcs'), `nichts gespeichert fuer ${url}`).toEqual({
            d: '',
            speicher: ''
        });
        // Der Dialog bleibt offen, die Eingabe steht noch da — der Nutzer kann sie berichtigen
        await weich(page.locator('#avatar-modal')).toHaveClass(/\bshow\b/);
        // Weder Vorschau noch Karte setzen den Wert als Bildquelle
        weich(await page.locator('#avatar-preview img').count(), `Vorschau fuer ${url}`).toBe(0);
        weich(await page.locator('#npc-list img, #npc-detail-panel img').count()).toBe(0);
    }
    await page.waitForTimeout(500);
    expect(netz, 'keine Anforderung an einen Netzwerkpfad').toEqual([]);
    expect(seitenfehler).toEqual([]);
});

// ===========================================================================
// (c) Bestiar-Editor: dieselbe Pruefung
// ===========================================================================
test('(c) Bestiar-Editor: ein lokales Bild wird angenommen, gespeichert und im Detail geladen', async ({
    page
}) => {
    test.setTimeout(60000);
    const { netz, seitenfehler } = await laden(page);
    await bestiarEditorOeffnen(page);
    const stand = await protokollStand(page);
    await bestiarBildSetzen(page, LOKALES_BILD);

    weich(await fehlerSeit(page, stand), 'keine Meldung "Ungültige oder unsichere URL"').toEqual(
        []
    );
    await weich
        .poll(() => bildBreite(page.locator('#bst-avatar-preview')), { timeout: 5000 })
        .toBe(LOKALE_BREITE);
    await weich(page.locator('#bst-avatar-preview')).toBeVisible();

    await page
        .locator('#bestiary-editor-modal [data-action="call"][data-value="saveBestiary"]')
        .click();
    await expect(page.locator('#bestiary-editor-modal')).not.toHaveClass(/\bshow\b/);
    await weich
        .poll(() => gespeichert(page, 'bestiary'), { timeout: 4000 })
        .toEqual({ d: LOKALES_BILD, speicher: LOKALES_BILD });

    // Das Portrait im Detailbereich (nur eigene Kreaturen) ist das geladene Bild
    await page
        .locator('#view-bestiary [data-action="bestiary-select"]:not([data-source="srd"])')
        .filter({ visible: true })
        .first()
        .click();
    await weich
        .poll(() => bildBreite(page.locator('#bestiary-detail-panel img.bestiary-detail-avatar')), {
            timeout: 5000
        })
        .toBe(LOKALE_BREITE);

    expect(netz, 'keine Anforderung an einen Netzwerkpfad').toEqual([]);
    expect(seitenfehler).toEqual([]);
});

test('(c) Bestiar-Editor: Netzwerkpfade werden abgelehnt, nichts gespeichert, keine Anforderung', async ({
    page
}) => {
    test.setTimeout(60000);
    const { netz, seitenfehler } = await laden(page);
    await bestiarEditorOeffnen(page);
    for (const url of NETZWERKPFADE) {
        const stand = await protokollStand(page);
        await bestiarBildSetzen(page, url);
        weich((await fehlerSeit(page, stand)).length, `Fehlermeldung fuer ${url}`).toBe(1);
        await weich(page.locator('#bst-avatar-preview'), `keine Vorschau fuer ${url}`).toBeHidden();
    }
    await page
        .locator('#bestiary-editor-modal [data-action="call"][data-value="saveBestiary"]')
        .click();
    await expect(page.locator('#bestiary-editor-modal')).not.toHaveClass(/\bshow\b/);
    await page.waitForTimeout(600);
    weich(await gespeichert(page, 'bestiary'), 'nichts gespeichert').toEqual({
        d: '',
        speicher: ''
    });
    weich(await page.locator('#bestiary-detail-panel img.bestiary-detail-avatar').count()).toBe(0);
    await page.waitForTimeout(300);
    expect(netz, 'keine Anforderung an einen Netzwerkpfad').toEqual([]);
    expect(seitenfehler).toEqual([]);
});

// ===========================================================================
// (d) Charakterformular: die Vorschau zeigt, was die Karte zeigt (A3)
// ===========================================================================
test('(d) Charakterformular: die Vorschau zeigt lokale Datei, data:image/, relativen Pfad und http(s) geladen, bei einem Netzwerkpfad den Platzhalter', async ({
    page
}) => {
    test.setTimeout(90000);
    const { netz, seitenfehler } = await laden(page);
    // Das http(s)-Bild beantwortet der Test mit der Datei des Repos (httpsBildBeantworten()).
    await httpsBildBeantworten(page);
    await charakterFormularOeffnen(page);
    const vorschau = page.locator('#cf-avatar-preview');

    // A3: ein Bild genau dann, wenn sichereBildquelle() es anzeigt — jede der vier Arten
    for (const [art, url, breite] of [
        ['lokale Datei', LOKALES_BILD, LOKALE_BREITE],
        ['data:image/', DATA_BILD, 1],
        ['relativer Pfad', RELATIVES_BILD, LOKALE_BREITE],
        ['http(s)', HTTPS_BILD, LOKALE_BREITE]
    ]) {
        await eintippen(page, '#char-avatar', String(url));
        await weich
            .poll(() => bildBreite(vorschau.locator('img')), {
                timeout: 5000,
                message: `Vorschau laedt das Bild (${art})`
            })
            .toBe(breite);
        weich(
            await vorschau.locator('.cf-avatar-placeholder').count(),
            `kein Platzhalter (${art})`
        ).toBe(0);
    }

    for (const url of NETZWERKPFADE) {
        await eintippen(page, '#char-avatar', url);
        await page.waitForTimeout(300);
        weich(await vorschau.locator('img').count(), `kein Bild fuer ${url}`).toBe(0);
        await weich(
            vorschau.locator('.cf-avatar-placeholder'),
            `Platzhalter fuer ${url}`
        ).toHaveText('?');
    }
    await page.waitForTimeout(500);
    expect(netz, 'keine Anforderung an einen Netzwerkpfad').toEqual([]);
    expect(seitenfehler).toEqual([]);
});

// ===========================================================================
// (e) Die Meldung nennt lokale Dateien (A2)
// ===========================================================================
test('(e) Bild-Dialog: die Meldung bei einem Netzwerkpfad nennt lokale Dateien', async ({
    page
}) => {
    test.setTimeout(60000);
    const { netz } = await laden(page);
    await bildDialogOeffnen(page);
    const stand = await protokollStand(page);
    await bildDialogSpeichern(page, NETZWERKPFADE[1]);
    const fehler = await fehlerSeit(page, stand);
    expect(fehler.length, 'genau eine Fehlermeldung').toBe(1);
    const text = fehler[0].text;
    // Sichtbar, nicht nur im Protokoll
    await expect(page.locator('#event-log .event-log-entry.error').first()).toBeVisible();
    weich(text, 'nennt lokale Dateien').toMatch(/lokale Datei/i);
    weich(text, 'nennt weiter die Sperre der Netzwerkpfade').toMatch(/keine Netzwerkpfade/i);
    weich(text, 'nennt weiter http(s)').toContain('http(s)');
    expect(netz).toEqual([]);
});

// ===========================================================================
// (f) Kontrolle: http(s) und data:image/ bleiben angenommen
// ===========================================================================
test('(f) Kontrolle: Bild-Dialog nimmt http(s) und data:image/ weiter an', async ({ page }) => {
    test.setTimeout(60000);
    const { netz, seitenfehler } = await laden(page);
    await bildDialogOeffnen(page);

    let stand = await protokollStand(page);
    await bildDialogSpeichern(page, HTTPS_BILD);
    weich(await fehlerSeit(page, stand), 'http(s): keine Fehlermeldung').toEqual([]);
    await weich
        .poll(() => gespeichert(page, 'npcs'), { timeout: 4000 })
        .toEqual({ d: HTTPS_BILD, speicher: HTTPS_BILD });
    // Die Anforderung an example.org bricht der Test ab — das Bild steht, geladen wird es nicht
    await weich(
        page.locator(`#npc-list .npc-item[data-id="1"] .npc-item-avatar img[src="${HTTPS_BILD}"]`)
    ).toBeAttached();

    await page.locator('#npc-detail-panel [data-action="show-avatar-modal"]').click();
    await expect(page.locator('#avatar-modal')).toHaveClass(/\bshow\b/);
    stand = await protokollStand(page);
    await bildDialogSpeichern(page, DATA_BILD);
    weich(await fehlerSeit(page, stand), 'data:image/: keine Fehlermeldung').toEqual([]);
    await weich
        .poll(() => gespeichert(page, 'npcs'), { timeout: 4000 })
        .toEqual({ d: DATA_BILD, speicher: DATA_BILD });
    await weich
        .poll(
            () => bildBreite(page.locator('#npc-list .npc-item[data-id="1"] .npc-item-avatar img')),
            {
                timeout: 5000
            }
        )
        .toBe(1);

    expect(netz, 'keine Anforderung an einen Netzwerkpfad').toEqual([]);
    expect(seitenfehler).toEqual([]);
});

// ===========================================================================
// (g) AVATAR-VORSCHAU — die Vorschau im Charakterformular beim Laden und Leeren
// ===========================================================================
/**
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **solange das Charakterformular offen ist,
 * zeigt die Vorschau #cf-avatar-preview, was der Wert im Feld #char-avatar beim Speichern auf
 * der Karte ergaebe — nach jedem ✏️, nach jedem Leeren, und gleich, was vorher getippt oder
 * bearbeitet wurde.** Das ist das Bild, das 💾 schriebe; bei Altdaten (Avatar als Array oder
 * mit NBSP davor) NICHT unbedingt das, was die Karte VOR dem Speichern zeigt — Fall (W9).
 *
 * Ursprung: docs/bugfixes.md, Eintrag AVATAR-DATEI, Offen (1) ("editChar() ruft die Vorschau
 * nicht auf"). A3 galt nur fuer das TIPPEN (Fall (d) oben); dieser Block dehnt ihn auf Laden
 * und Leeren aus. Eigener Vorgang auf dem Stapelkopf (BESTIAR-KLICK), keine Nachbesserung in
 * AVATAR-DATEI (#24, gemergt). Der Block steht hier, wie der Vertrag der Kritik es verlangt
 * (Heimat von A3, dieselben Hilfen: Saat, laden() mit dem Netz-Protokoll, istNetzziel() fuer
 * alle fuenf NETZWERKPFADE, zuReiter(), eintippen(), die Bilder); zuerst stand er in einer
 * eigenen Datei mit einer verkuerzten Kopie von istNetzziel() (Pruefbefund, behoben).
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DER BEFUND (gemessen am Kopf 543706c6, Chromium, dev und prod, 1440x900 mit der Maus und
 * 390x844 per Tap, null Seitenfehler; an main 4037338d dasselbe)
 *
 * Die Vorschau zeigt immer den Wert, der seit dem Laden der Seite ZULETZT INS FELD GETIPPT
 * wurde, und ohne Tippen den Platzhalter "?" der Vorlage (assets/templates/view-party.html).
 * ✏️ (Kartenkopf, 🔍 → "✏️ Bearbeiten", Strg+K-Treffer), Abbrechen, Speichern, Kopfzeile
 * zu/auf, Taste n, die Palette und der Import ("Ersetzen") aendern sie nie:
 *   - frisch geladen, ✏️ Aria (data:image/), Cora (file:///), Dorn (relativer Pfad), Fenn
 *     (https): das Feld traegt das Bild, die Vorschau "?" — bei Bram (ohne Bild) stimmt "?"
 *     nur zufaellig;
 *   - ein getipptes Bild bleibt nach Abbrechen stehen: neben dem leeren neuen Formular, neben
 *     ✏️ Bram (ohne Bild), neben ✏️ Aria (mit eigenem Bild), nach dem Speichern eines
 *     Neulings und nach einem Import, bis wieder getippt oder neu geladen wird.
 * Gespeichert wird der FELDWERT, nicht die Vorschau — falsche Daten entstehen so nicht, wohl
 * aber eine falsche Anzeige, der man glaubt (ein Bild "nachtragen", das schon da ist, oder
 * eines zum zweiten Mal eintragen).
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DIE URSACHE
 *
 *   - updateAvatarPreview() (features/party/party-crud.js) hat genau einen Aufrufer: die
 *     data-action 'update-avatar-preview' am input-/change-Ereignis des Feldes
 *     (ui/actions/entity-actions.js). Eine Zuweisung an `.value` feuert kein Ereignis.
 *   - editChar() setzt `avatarInput.value = ch.avatar || ''` und ruft die Vorschau nicht nach —
 *     jede andere Anzeige des Formulars ruft dieselbe Funktion ausdruecklich nach
 *     (updateAttrMod, setCharLanguages, updateSpeedDisplay, updateProficiencyBonus).
 *   - cancelCharEdit() leert das Feld ueber clearFormFields() und laesst die Vorschau stehen.
 *     Ueber cancelCharEdit() laufen ALLE Leerwege: Abbrechen, Speichern (saveCharacter()),
 *     Kopfzeile aufklappen mit verworfenem Bearbeiten-Rest (ABBRUCH R1), Taste n und Palette
 *     (verwirfBearbeitenRest(), systems/spellslots/navigation.js) und Import R7
 *     (reiterBearbeitenVerwerfen(), systems/spellslots/import-export.js).
 *   - Alt: `git log -S` findet nie einen zweiten Aufrufer; AVATAR-DATEI hat nur die Pruefung IN
 *     updateAvatarPreview() geaendert (sichereBildquelle()), nicht ihre Aufrufer.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DER VERTRAG (AVATAR-VORSCHAU)
 *
 *   R1  Invariante (A3, ausgedehnt vom Tippen auf Laden und Leeren): solange das Formular offen
 *       ist, zeigt #cf-avatar-preview das Ergebnis von sichereBildquelle(#char-avatar.value
 *       .trim()) — mit Bild genau ein GELADENES <img> mit src === Feldwert.trim(), sonst der
 *       Platzhalter "?" ohne <img>. Massgeblich ist das FELD (das, was 💾 schriebe), nicht
 *       ch.avatar — auch bei Altdaten, Fall (W9).
 *   R2  Laden: editChar() fuehrt die Vorschau direkt nach der Feldzuweisung nach, mit dem
 *       Feldwert — fuer alle drei Einstiege (Kartenkopf, 🔍 → "✏️ Bearbeiten", Strg+K-Treffer)
 *       und gleich, was davor war (frisch geladen, getippt, ein anderer Held).
 *   R3  Leeren: cancelCharEdit() fuehrt die Vorschau nach dem Leeren aus dem Feld nach, und zwar
 *       NACH der Rueckkehr von clearFormFields(), vor dem Zuklappen — nicht in dessen try-Block
 *       (customHandlers): dort fiele der Aufruf still weg, sobald etwas davor wirft. Von aussen
 *       nicht zu sehen; die Waechter sind tests/unit/avatar-vorschau.test.js (U1: hinter einem
 *       werfenden Handler; U4: customHandlers wirft beim Eintritt — erst U4 faengt einen Aufruf
 *       als ERSTE Anweisung im Block, m5a).
 *   R4  Direkt aufrufen. Kein synthetisches input-/change-Ereignis und kein dispatchEvent am
 *       Feld: BESTIAR-KLICK (#27) stellt ein change mit dem Wert, den derselbe Handler schon
 *       per input bekam, nicht mehr zu (_changeBringtNichtsNeues(), ui/event-delegation.js) —
 *       Fall (W5); ein synthetisches input waere hier unsichtbar, darum U1-U4 der Unit-Datei.
 *   R5  ABBRUCH R2 bleibt: ein Anlege-Entwurf ohne ID behaelt Feld UND Vorschau ueber
 *       Kopfzeile zu/auf, Taste n und Palette — Kontrolle (W6).
 *   R6  Sonst aendert sich nichts: updateAvatarPreview() selbst (Pruefung nach A3, die Quelle
 *       als DOM-Eigenschaft, kein innerHTML mit Nutzerwert), keine neue globale Funktion, kein
 *       neuer Export (eslint.generated-globals.js und party-crud.d.ts bleiben unberuehrt),
 *       keine Anforderung an einen Netzwerkpfad.
 *   R7  Nicht in diesem Vorgang (je ein eigener, docs/bugfixes.md, AVATAR-VORSCHAU Offen):
 *       Sprachen ausserhalb der festen Liste gehen nach ✏️ + 💾 verloren (Produktfrage);
 *       editChar() laedt einen Helden mit Altdaten (`speed` als Zahl oder Array, `languages`
 *       als Zahl, `resistances` als Objekt) nur halb und schreibt beim Speichern Bild und
 *       Sprachen des vorigen Helden auf ihn (Datenverfaelschung); Uebungsbonus "+3" bei
 *       Stufe 1 beim ersten Oeffnen; das Sprachmenue bleibt beim ✏️-Wechsel offen. Deshalb
 *       saet dieser Block `speed` als TEXT — ausser in (W9), der genau solche Altdaten nimmt
 *       und NUR die Invariante R1 prueft, nicht, was editChar() ins Feld schreibt.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DIE FAELLE                                                                  am Kopf 543706c6
 *
 *   (W1) frisch geladen, ✏️ ueber den Kartenkopf nacheinander Aria, Cora, Dorn, Fenn, Eik, Bram
 *        → Bild, Bild, Bild, Bild, "?" ohne Anforderung, "?"                              rot
 *   (W2) dieselbe Erwartung ueber 🔍 → "✏️ Bearbeiten" (Cora) und ueber Strg+K (Dorn)      rot
 *   (W3) Kopfzeile auf, ein Bild tippen, Abbrechen, Kopfzeile auf → "?"; ✏️ Bram → "?";
 *        ✏️ Aria → Arias Bild (am Kopf steht ueberall das getippte)                       rot
 *   (W4) Leerwege OHNE vorheriges Tippen, gemessen beim naechsten Oeffnen: Abbrechen,
 *        Speichern + Taste n, Kopfzeile zu/auf (ABBRUCH R1), Reiter Quests + Palette
 *        "Neuer Charakter" → je "?"                                                    gruen
 *        Zufaellig gruen (es wurde nie ein Bild gezeigt) — der Fall waecht gegen den Halbfix
 *        "nur editChar()": der zeigt nach ✏️ das Bild und laesst es beim Leeren stehen.
 *   (W5) GENAU Coras Wert in einen Entwurf tippen, Abbrechen, Kopfzeile auf → "?"; dann
 *        Kopfzeile zu, ✏️ Cora → Coras Bild                   rot (der Abbrechen-Schritt)
 *        Am Kopf ist "✏️ Cora" zufaellig gruen (der zuletzt getippte Wert IST Coras). Der Fall
 *        waecht gegen den verworfenen Weg R4: ein synthetisches change am Feld wird hier, beim
 *        Wert, den 'update-avatar-preview' schon per input bekam, verschluckt.
 *   (W6) Kontrolle R5: ein Entwurf mit getipptem Bild bleibt ueber Kopfzeile zu/auf, Taste n
 *        und Palette stehen, Feld und Vorschau                                          gruen
 *   (W7) 390x844 mit hasTouch per .tap(): (W1), (W3), (W4) — dort ohne Taste n und Palette
 *        (Telefon), "Speichern" gefolgt von der Kopfzeile                     rot, rot, gruen
 *   (W8) prod-Buendel: (W1) und (W3)                                                  rot
 *   (W9) Altdaten (R1, nicht R7): ✏️ Aria, dann ✏️ Gus (`speed: 30` als Zahl) — editChar()
 *        wirft vor der Avatar-Zeile, im Feld bleibt Arias Bild —, dann ✏️ Ida (Avatar als
 *        ARRAY `[HTTPS_BILD]`, im Feld als Text) und ✏️ Kai (NBSP vor DATA_BILD, JS-trim()
 *        entfernt es). Die Vorschau folgt jeweils dem FELD, gleich was dort steht        rot
 *        Waecht gegen eine Vorschau aus ch.avatar statt aus dem Feld: am ANFANG von editChar()
 *        (m7) zeigte sie bei Gus "?" neben Arias Bild im Feld, das 💾 auf Gus schriebe; an der
 *        Stelle von R2 (m8) zeigte sie bei Ida "?" — updateAvatarPreview() nimmt nur Text —,
 *        waehrend 💾 das Bild schriebe. Die KARTE haelt der Fall nicht fest: bei Ida und Kai
 *        zeigt sie vor dem Speichern 👤 (sie prueft den rohen Wert, und sichereBildquelle()
 *        entfernt nur Zeichen <= U+0020), danach das Bild.
 *   (W10) Import R7 am Bildschirm, mit dem echten 📤-Export als Vorlage und 📥 ueber den
 *        Dateidialog: ✏️ Cora, "Hinzufuegen" — der Held bleibt in Bearbeitung (Kontrolle);
 *        ✏️ Aria, ein anderes Bild tippen, "Ersetzen" → das Formular ist zu, die Bearbeiten-ID
 *        weg, Kopfzeile auf → "?"; dann ✏️ Pia (aus der Datei) → Pias Bild                rot
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * GEGENPROBEN (am Buendel, nicht eingecheckt)
 *
 * Kopien der Quelle am Kopf mit je einer Aenderung an editChar()/cancelCharEdit(), dev und
 * prod gebaut, gefahren mit genau diesem Block (process.cwd() = der Ordner der Kopie, drei
 * Worker, Messung vom 04.11.); die Namen sind die von tests/unit/avatar-vorschau.test.js:
 *   fix  R2 + R3 wie im Vertrag                     alle 13 gruen
 *   m1   nur editChar() (Halbfix)                   7 rot: (W4) alle vier Leerwege, je der
 *                                                   Abbrechen-Schritt von (W3) und (W5), (W10)
 *                                                   nach "Ersetzen"; ebenso (W7)-(W3),
 *                                                   (W7)-(W4), (W8)-(W3)
 *   m2   nur cancelCharEdit() (Halbfix)             10 rot: (W1), (W2), (W3) "✏️ Aria", (W5)
 *                                                   "✏️ Cora", (W9) alle vier ✏️, (W10) die vier
 *                                                   ✏️-Schritte; ebenso (W7)-(W1), (W7)-(W3), (W8)
 *   m4   dispatchEvent(change) am Feld in beiden,   1 rot: genau (W5) "✏️ Cora"
 *        statt des Aufrufs (verworfen, R4)
 *   m7   updateAvatarPreview(ch.avatar) am ANFANG   1 rot: genau (W9), "✏️ Gus" und "✏️ Ida"
 *        von editChar(), plus R3
 *   m8   updateAvatarPreview(ch.avatar || '') an    1 rot: genau (W9) "✏️ Ida" — vor Ida war m8
 *        der Stelle von R2, plus R3                 von aussen nicht vom Feld zu unterscheiden
 * Von aussen NICHT zu unterscheiden, darum in tests/unit/avatar-vorschau.test.js: der Aufruf
 * IN customHandlers (m5 hinter dem Leeren der Angriffe, m5a als ERSTE Anweisung im Block; hier
 * alle 13 gruen, dort U4 rot, bei m5 auch U1) und ein synthetisches input statt des Aufrufs
 * (m6, R4; hier alle 13 gruen, dort U1-U4 rot).
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * WIE GEMESSEN WIRD
 *
 * Bedienung nur ueber die Oberflaeche: Reiter, Kartenkopf (`.char-card-meta`), 🔍 und
 * "✏️ Bearbeiten", Strg+K mit Klick auf den Treffer, die Kopfzeile, Abbrechen, Speichern, die
 * Taste n, die Palette, 📤/📥 mit dem Dateidialog und dem Import-Fenster; Eingaben Zeichen fuer
 * Zeichen (eintippen()). Am Telefon .tap() mit TIPP_ABSTAND. `evaluate` nur zum Ablesen;
 * gesaet wird vor dem Laden (laden(), einmal je Tab).
 *
 * Nach JEDEM Schritt, bei offenem Formular, die Invariante R1 als WEICHE Zusicherung: die
 * Vorschau wird aus dem Feld vorhergesagt (Tabelle BREITE: welcher Wert ein Bild welcher Breite
 * ergibt) und mit der gelesenen verglichen; "angezeigt" heisst GELADEN (naturalWidth), nicht nur
 * "ein img steht da". Dazu, wo der Schritt es festlegt, der Feldwert selbst. Am Ende: keine
 * Anforderung an einen Netzwerkpfad (laden(), istNetzziel()) und kein Fehler (pageerror,
 * console.error, Fehlerlog der App; (W9) prueft nur pageerror, siehe dort). Die Bilder sind die
 * der Faelle oben; HTTPS_BILD beantwortet laden() mit icons/icon-192.png, schon VOR dem Laden
 * (Fenns Karte fordert es beim ersten Zeichnen an).
 */

const APP_URL_PROD = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-optimized.html`;
/** Der CI-Job `e2e` baut nur dev (`python build.py`); den prod-Fall gibt es nur mit einem
 *  frischen `python build.py --production` (Muster aus bestiar-klick.spec.js). */
const PROD_DA = fs.existsSync(path.join(process.cwd(), 'dist', 'dnd-tracker-optimized.html'));
const PROD_GRUND =
    'kein prod-Buendel — vorher `python build.py --production` (der CI-Job e2e baut nur dev)';
const TELEFON = { width: 390, height: 844 };
/** Zeit nach einer Bedienung fuer Zeichnen und verzoegerte Aufrufe (Strg+K: 100 ms). */
const SETZEN = 250;
/** So lange darf ein Bild laden, bevor ein Schritt als rot gilt. */
const WARTEN_BILD = 3000;

/**
 * R1 als Tabelle: welcher (getrimmte) Feldwert welche Vorschau ergibt — die Breite des GELADENEN
 * Bildes, oder null fuer den Platzhalter "?". Dass genau diese Werte ein Bild ergeben, ist A3
 * (sichereBildquelle(); Wertetabelle in tests/unit/avatars.test.js, Fall (d) oben).
 * @type {Map<string, number|null>}
 */
const BREITE = new Map([
    ['', null],
    [DATA_BILD, 1],
    [LOKALES_BILD, LOKALE_BREITE],
    [RELATIVES_BILD, LOKALE_BREITE],
    [HTTPS_BILD, LOKALE_BREITE],
    ...NETZWERKPFADE.map(n => /** @type {[string, null]} */ ([n, null]))
]);

/** Lesbare Namen fuer die Meldungen (die Werte selbst sind lang). */
const NAMEN = new Map([
    ['', "''"],
    [DATA_BILD, 'DATA_BILD'],
    [LOKALES_BILD, 'LOKALES_BILD'],
    [RELATIVES_BILD, 'RELATIVES_BILD'],
    [HTTPS_BILD, 'HTTPS_BILD'],
    ...NETZWERKPFADE.map((n, i) => /** @type {[string, string]} */ ([n, `NETZWERKPFADE[${i}]`]))
]);

/**
 * Ein Held — `speed` als TEXT (R7), sonst laedt editChar() nur halb.
 * @param {number} id
 * @param {string} name
 * @param {any} avatar Text; in (W9) auch Altdaten (ein Array)
 * @param {object} [extra]
 */
function held(id, name, avatar, extra = {}) {
    return {
        id,
        name,
        playerName: '',
        characterClass: 'Kämpfer',
        subclass: '',
        race: 'Mensch',
        level: 1,
        background: '',
        alignment: '',
        attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        saveProficiencies: {},
        hpCurrent: 10,
        hpMax: 10,
        tempHp: 0,
        armorClass: 12,
        initiative: 0,
        speed: '9m|30ft.',
        hitDice: '1d10',
        passivePerception: 10,
        inspiration: false,
        resistances: [],
        immunities: [],
        languages: [],
        spellSlots: {},
        currency: { pm: 0, gm: 0, em: 0, sm: 0, km: 0 },
        notes: '',
        avatar,
        conditions: [],
        spells: [],
        items: [],
        ...extra
    };
}

const ARIA = held(1, 'Aria', DATA_BILD);
const BRAM = held(2, 'Bram', '');
const CORA = held(3, 'Cora', LOKALES_BILD);
const DORN = held(4, 'Dorn', RELATIVES_BILD);
const EIK = held(5, 'Eik', NETZWERKPFADE[0]);
const FENN = held(6, 'Fenn', HTTPS_BILD);
/** Altdaten (W9): `speed` als Zahl, wie aeltere Staende ihn trugen; die Datengrenze laesst ihn. */
const GUS = held(7, 'Gus', '', { speed: 30 });
/** Altdaten (W9): der Avatar als Array — editChar() macht per `.value =` Text daraus. */
const IDA = held(8, 'Ida', [HTTPS_BILD]);
/** Altdaten (W9): ein NBSP vor dem Bild — JS-trim() entfernt es, sichereBildquelle() nicht. */
const KAI = held(9, 'Kai', '\u00a0' + DATA_BILD);
const HELDEN = [ARIA, BRAM, CORA, DORN, EIK, FENN];

/**
 * laden() fuer Block (g): Helden, das http(s)-Bild beantwortet.
 * @param {import('@playwright/test').Page} page
 * @param {{ url?: string, characters?: object[], telefon?: boolean }} [opt]
 */
function ladenMitHelden(page, opt = {}) {
    return laden(page, { characters: HELDEN, httpsBild: true, ...opt });
}

/**
 * Klick, am Telefon Tipper mit Abstand.
 * @param {import('@playwright/test').Page} page
 * @param {boolean} tap
 * @returns {(ziel: import('@playwright/test').Locator) => Promise<void>}
 */
function bedienung(page, tap) {
    return async ziel => {
        if (tap) {
            await page.waitForTimeout(TIPP_ABSTAND);
            await ziel.tap();
        } else {
            await ziel.click();
        }
        await page.waitForTimeout(SETZEN);
    };
}

/** @param {import('@playwright/test').Page} page */
function formular(page) {
    return page.locator('#char-form');
}
/** Die Kopfzeile "+ Charakter hinzufügen" ueber ihren PLATZ (charakterFormularOeffnen() oben).
 *  @param {import('@playwright/test').Page} page */
function kopfzeile(page) {
    return page.locator('#view-party .card:has(> #char-form) > .collapsible-header');
}
/** @param {import('@playwright/test').Page} page */
function abbrechenKnopf(page) {
    return formular(page).getByRole('button', { name: 'Abbrechen', exact: true });
}
/** @param {import('@playwright/test').Page} page */
function speichernKnopf(page) {
    return formular(page).getByRole('button', { name: 'Speichern', exact: true });
}
/** @param {import('@playwright/test').Page} page */
function bearbeitenId(page) {
    return page.evaluate(
        () => /** @type {HTMLInputElement|null} */ (document.getElementById('edit-char-id'))?.value
    );
}

/** Vorbedingung nach einem ✏️: Formular offen, Bearbeiten-ID gesetzt.
 *  @param {import('@playwright/test').Page} page @param {number} id */
async function geladen(page, id) {
    await expect(formular(page)).toHaveClass(/\bopen\b/);
    await expect.poll(() => bearbeitenId(page)).toBe(String(id));
}

/** ✏️ ueber den Kartenkopf (`edit-char`).
 *  @param {import('@playwright/test').Page} page
 *  @param {(z: import('@playwright/test').Locator) => Promise<void>} bedien
 *  @param {number} id */
async function bearbeitenKopf(page, bedien, id) {
    await bedien(page.locator(`#party-list .char-card-header[data-id="${id}"] .char-card-meta`));
    await geladen(page, id);
}

/** ✏️ ueber 🔍 und "✏️ Bearbeiten" im Detail-Dialog (`edit-char-from-modal`).
 *  @param {import('@playwright/test').Page} page
 *  @param {(z: import('@playwright/test').Locator) => Promise<void>} bedien
 *  @param {number} id */
async function bearbeitenDetail(page, bedien, id) {
    await bedien(page.locator(`#char-${id} [data-action="show-char-details"]`));
    await expect(page.locator('#char-detail-modal')).toHaveClass(/\bshow\b/);
    await bedien(page.locator('#char-detail-modal [data-action="edit-char-from-modal"]'));
    await expect(page.locator('#char-detail-modal')).not.toHaveClass(/\bshow\b/);
    await geladen(page, id);
}

/** ✏️ auf der Charakterkarte nach dem Sprung per Strg+K.
 *  @param {import('@playwright/test').Page} page @param {string} name @param {number} id */
async function bearbeitenSuche(page, name, id) {
    await page.keyboard.press('Control+k');
    await expect(page.locator('#global-search')).toBeFocused();
    await page.keyboard.type(name, { delay: 30 });
    const treffer = page
        .locator('#global-search-results .search-result-item[data-type="character"]')
        .filter({ hasText: name })
        .first();
    await treffer.click();
    await page.locator(`#char-${id} [data-action="edit-char"]`).click();
    await page.waitForTimeout(SETZEN);
    await geladen(page, id);
}

/** Befehlspalette → Befehl (charakter-anlegen.spec.js). Enter fuehrt den obersten Treffer aus.
 *  @param {import('@playwright/test').Page} page @param {string} text */
async function palette(page, text) {
    await page.keyboard.press('Control+Shift+K');
    await expect(page.locator('.cp-overlay')).toBeVisible();
    await expect(page.locator('.cp-input')).toBeFocused();
    await page.keyboard.type(text);
    await expect(page.locator('#cp-results-list .cp-result').first()).toContainText(text);
    await page.keyboard.press('Enter');
    await expect(page.locator('.cp-overlay')).toBeHidden();
    await page.waitForTimeout(SETZEN);
}

/** Das Avatarfeld des Formulars (eintippen() mit Klick bzw. Tipper).
 *  @param {import('@playwright/test').Page} page
 *  @param {(z: import('@playwright/test').Locator) => Promise<void>} bedien
 *  @param {string} text */
async function avatarTippen(page, bedien, text) {
    await eintippen(page, '#char-avatar', text, bedien);
    await page.waitForTimeout(SETZEN);
}

// --- Messen: die Invariante R1 ----------------------------------------------
/** @param {string} wert */
function kurz(wert) {
    if (NAMEN.has(wert)) return /** @type {string} */ (NAMEN.get(wert));
    return wert.length > 60 ? wert.slice(0, 57) + '…' : wert;
}

/** Was die Vorschau zu diesem Feldwert zeigen MUSS (R1).
 *  @param {string} feld */
function vorhersage(feld) {
    const wert = feld.trim();
    if (!BREITE.has(wert)) return `UNBEKANNTER Feldwert ${kurz(wert)} — Tabelle BREITE ergaenzen`;
    const breite = BREITE.get(wert);
    return breite === null ? 'Platzhalter "?"' : `Bild ${breite}px ${kurz(wert)}`;
}

/** Feld, Formular und Vorschau, wie sie gerade stehen — nur Ablesen.
 *  @param {import('@playwright/test').Page} page */
function ablesen(page) {
    return page.evaluate(() => {
        const feld = /** @type {HTMLInputElement} */ (document.getElementById('char-avatar'));
        const vorschau = /** @type {HTMLElement} */ (document.getElementById('cf-avatar-preview'));
        const platzhalter = vorschau.querySelector('.cf-avatar-placeholder');
        return {
            feld: feld.value,
            offen: !!document.getElementById('char-form')?.classList.contains('open'),
            bilder: [...vorschau.querySelectorAll('img')].map(b => ({
                src: b.getAttribute('src') || '',
                breite: b.complete ? b.naturalWidth : 0
            })),
            platzhalter: platzhalter ? (platzhalter.textContent || '').trim() : null
        };
    });
}

/** Was die Vorschau zeigt, in derselben Sprache wie vorhersage().
 *  @param {Awaited<ReturnType<typeof ablesen>>} z */
function beschreibe(z) {
    if (z.bilder.length === 0) {
        return z.platzhalter === '?' ? 'Platzhalter "?"' : `weder Bild noch Platzhalter`;
    }
    if (z.bilder.length === 1 && z.platzhalter === null) {
        const b = z.bilder[0];
        return b.breite > 0
            ? `Bild ${b.breite}px ${kurz(b.src)}`
            : `Bild NICHT geladen ${kurz(b.src)}`;
    }
    return `${z.bilder.length} Bilder und Platzhalter ${JSON.stringify(z.platzhalter)}`;
}

const STIMMT = 'Vorschau = Feld';

/**
 * R1 nach einem Schritt, als weiche Zusicherung: die Vorschau ist die aus dem Feld vorhergesagte
 * (bis WARTEN_BILD, solange ein Bild noch laedt). Mit `feldSoll` zusaetzlich der Feldwert, den
 * der Schritt festlegt; ohne (W9) nur die Invariante, gleich was im Feld steht.
 * @param {import('@playwright/test').Page} page
 * @param {string} schritt
 * @param {string} [feldSoll]
 */
async function pruefe(page, schritt, feldSoll) {
    await weich
        .poll(
            async () => {
                const z = await ablesen(page);
                const soll = vorhersage(z.feld);
                const ist = beschreibe(z);
                return ist === soll ? STIMMT : `Feld ${kurz(z.feld)}: soll ${soll}, ist ${ist}`;
            },
            { timeout: WARTEN_BILD, message: `${schritt}: Vorschau = Feld (R1)` }
        )
        .toBe(STIMMT);
    const z = await ablesen(page);
    weich(z.offen, `${schritt}: Formular offen`).toBe(true);
    if (feldSoll !== undefined) weich(kurz(z.feld), `${schritt}: Feld`).toBe(kurz(feldSoll));
}

/**
 * Ende jedes Falls: kein Netzwerkpfad angefordert, kein Fehler.
 * @param {import('@playwright/test').Page} page
 * @param {Awaited<ReturnType<typeof laden>>} beob
 */
async function ohneNetzUndFehler(page, beob) {
    await page.waitForTimeout(300);
    expect(beob.netz, 'keine Anforderung an einen Netzwerkpfad').toEqual([]);
    expect(await beob.alleFehler(), 'kein Fehler').toEqual([]);
}

// --- Ablaeufe, je fuer Maus und Tap -----------------------------------------
/** Reihenfolge von (W1): Bild, Bild, Bild, Bild, Netzwerkpfad, ohne Bild. */
const KARTENKOPF_REIHE = [ARIA, CORA, DORN, FENN, EIK, BRAM];

/** (W1) frisch geladen, ✏️ ueber den Kartenkopf.
 *  @param {import('@playwright/test').Page} page
 *  @param {(z: import('@playwright/test').Locator) => Promise<void>} bedien */
async function ablaufW1(page, bedien) {
    await zuReiter(page, 'party');
    for (const h of KARTENKOPF_REIHE) {
        await bearbeitenKopf(page, bedien, h.id);
        await pruefe(page, `(W1) ✏️ ${h.name} ueber den Kartenkopf`, h.avatar);
    }
}

/** (W3) ein getipptes Bild bleibt nicht ueber Abbrechen und ✏️ stehen.
 *  @param {import('@playwright/test').Page} page
 *  @param {(z: import('@playwright/test').Locator) => Promise<void>} bedien */
async function ablaufW3(page, bedien) {
    await zuReiter(page, 'party');
    await bedien(kopfzeile(page));
    await expect(formular(page)).toHaveClass(/\bopen\b/);
    await pruefe(page, '(W3) Kopfzeile auf (neu)', '');
    await avatarTippen(page, bedien, HTTPS_BILD);
    await pruefe(page, '(W3) HTTPS_BILD getippt', HTTPS_BILD);
    await bedien(abbrechenKnopf(page));
    await expect(formular(page)).not.toHaveClass(/\bopen\b/);
    await bedien(kopfzeile(page));
    await expect(formular(page)).toHaveClass(/\bopen\b/);
    await pruefe(page, '(W3) getippt → Abbrechen → Kopfzeile auf', '');
    await bearbeitenKopf(page, bedien, BRAM.id);
    await pruefe(page, '(W3) dann ✏️ Bram (ohne Bild)', '');
    await bearbeitenKopf(page, bedien, ARIA.id);
    await pruefe(page, '(W3) dann ✏️ Aria', DATA_BILD);
}

/**
 * (W4) Leerwege ohne vorheriges Tippen, gemessen beim naechsten Oeffnen. Am Telefon gibt es
 * weder Taste n noch Palette: dort oeffnet nach "Speichern" die Kopfzeile, die Palette entfaellt.
 * @param {import('@playwright/test').Page} page
 * @param {(z: import('@playwright/test').Locator) => Promise<void>} bedien
 * @param {boolean} tasten
 */
async function ablaufW4(page, bedien, tasten) {
    await zuReiter(page, 'party');
    const offen = /\bopen\b/;

    // Abbrechen
    await bearbeitenKopf(page, bedien, CORA.id);
    weich(kurz((await ablesen(page)).feld), '(W4) Feld nach ✏️ Cora').toBe('LOKALES_BILD');
    await bedien(abbrechenKnopf(page));
    await expect(formular(page)).not.toHaveClass(offen);
    await bedien(kopfzeile(page));
    await expect(formular(page)).toHaveClass(offen);
    await pruefe(page, '(W4) ✏️ Cora → Abbrechen → Kopfzeile auf', '');
    await bedien(kopfzeile(page));
    await expect(formular(page)).not.toHaveClass(offen);

    // Speichern, dann Taste n (Telefon: Kopfzeile)
    await bearbeitenKopf(page, bedien, ARIA.id);
    await bedien(speichernKnopf(page));
    await expect(formular(page)).not.toHaveClass(offen);
    if (tasten) {
        await page.keyboard.press('n');
        await page.waitForTimeout(SETZEN);
    } else {
        await bedien(kopfzeile(page));
    }
    await expect(formular(page)).toHaveClass(offen);
    await pruefe(page, `(W4) ✏️ Aria → Speichern → ${tasten ? 'Taste n' : 'Kopfzeile auf'}`, '');
    await bedien(kopfzeile(page));
    await expect(formular(page)).not.toHaveClass(offen);

    // Kopfzeile zu und auf: verwirft den Bearbeiten-Rest (ABBRUCH R1)
    await bearbeitenKopf(page, bedien, ARIA.id);
    await bedien(kopfzeile(page));
    await expect(formular(page)).not.toHaveClass(offen);
    await bedien(kopfzeile(page));
    await expect(formular(page)).toHaveClass(offen);
    await pruefe(page, '(W4) ✏️ Aria → Kopfzeile zu und auf (ABBRUCH R1)', '');

    if (!tasten) return;
    // Reiter Quests, Palette "Neuer Charakter": verwirft den Rest aus der anderen Ansicht
    await bearbeitenKopf(page, bedien, ARIA.id);
    await zuReiter(page, 'quests');
    await palette(page, 'Neuer Charakter');
    await expect(page.locator('#view-party')).toHaveClass(/\bactive\b/);
    await expect(formular(page)).toHaveClass(offen);
    await pruefe(page, '(W4) ✏️ Aria → Reiter Quests → Palette "Neuer Charakter"', '');
}

// --- (W10) Import: 📤 als Vorlage, 📥 mit dem Dateidialog -------------------
/**
 * Der echte 📤-Export der Party (wie exportieren() in reiterimport-verweise.spec.js) als Vorlage.
 * @param {import('@playwright/test').Page} page
 */
async function partyExportieren(page) {
    const knopf = page.locator('#view-party .io-btn.export[data-value="characters"]');
    const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }),
        knopf.click()
    ]);
    const json = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    expect(
        Array.isArray(json?.data) && json.data.length > 0,
        'Vorbedingung: der 📤-Export liefert Eintraege'
    ).toBe(true);
    return json;
}

/**
 * 📥 → Dateidialog → Datei → Fenster → Modus → "Importieren" (Muster aus
 * reiterimport-verweise.spec.js, fensterOeffnen()/modusWaehlen()/importieren()).
 * @param {import('@playwright/test').Page} page
 * @param {object} inhalt die Datei, wie der 📤-Export sie schreibt
 * @param {'merge'|'replace'} modus
 */
async function partyImportieren(page, inhalt, modus) {
    const knopf = page.locator('#view-party .io-btn.import[data-value="import-characters"]');
    const [waehler] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        knopf.click()
    ]);
    await waehler.setFiles({
        name: 'characters-Andere-Runde.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(inhalt, null, 2), 'utf8')
    });
    await expect(page.locator('#import-modal'), 'Vorbedingung: das Import-Fenster').toBeVisible();
    const radio = page.locator(`#import-modal input[name="import-mode"][value="${modus}"]`);
    const beschriftung = modus === 'merge' ? 'Hinzufügen' : 'Ersetzen';
    if (await radio.isVisible()) await radio.check();
    else await page.locator('#import-modal label', { hasText: beschriftung }).click();
    await expect(radio, `Vorbedingung: Modus "${beschriftung}" gewaehlt`).toBeChecked();
    await page.locator('#import-modal [data-action="execute-import"]').click();
    await expect(page.locator('#import-modal'), 'Vorbedingung: das Fenster ist zu').toBeHidden();
    await page.waitForTimeout(SETZEN);
}

/** Die IDs der Karten nach Namen — nur Ablesen.
 *  @param {import('@playwright/test').Page} page */
function kartenIds(page) {
    return page.evaluate(() =>
        Object.fromEntries(
            [...document.querySelectorAll('#party-list .char-card')].map(k => [
                (k.querySelector('.char-card-name')?.textContent || '')
                    .replace(/[⭐☆⋮]/g, '')
                    .trim(),
                Number(/** @type {HTMLElement} */ (k).dataset.id)
            ])
        )
    );
}

test.describe('(g) AVATAR-VORSCHAU — die Vorschau folgt dem Feld beim Laden und Leeren', () => {
    // =======================================================================
    // (W1) (W2) (W3) (W4) (W5) (W6) (W9) (W10) — 1440x900, Maus und Tastatur, dev
    // =======================================================================
    test.describe('1440x900, Maus und Tastatur', () => {
        test.use({ viewport: BREIT });

        test('(g) (W1) frisch geladen: ✏️ ueber den Kartenkopf zeigt das Bild des Helden, ohne Bild und beim Netzwerkpfad "?" — dev', async ({
            page
        }) => {
            test.setTimeout(90000);
            const beob = await ladenMitHelden(page);
            await ablaufW1(page, bedienung(page, false));
            await ohneNetzUndFehler(page, beob);
        });

        test('(g) (W2) frisch geladen: ✏️ ueber 🔍 → "✏️ Bearbeiten" (Cora) und ueber Strg+K (Dorn) zeigt das Bild des Helden', async ({
            page
        }) => {
            test.setTimeout(60000);
            const beob = await ladenMitHelden(page);
            const bedien = bedienung(page, false);
            await zuReiter(page, 'party');
            await bearbeitenDetail(page, bedien, CORA.id);
            await pruefe(page, '(W2) 🔍 → "✏️ Bearbeiten" Cora', LOKALES_BILD);
            await bearbeitenSuche(page, 'Dorn', DORN.id);
            await pruefe(page, '(W2) Strg+K → Treffer Dorn', RELATIVES_BILD);
            await ohneNetzUndFehler(page, beob);
        });

        test('(g) (W3) ein getipptes Bild verschwindet mit Abbrechen und steht nicht neben ✏️ Bram oder ✏️ Aria — dev', async ({
            page
        }) => {
            test.setTimeout(60000);
            const beob = await ladenMitHelden(page);
            await ablaufW3(page, bedienung(page, false));
            await ohneNetzUndFehler(page, beob);
        });

        test('(g) (W4) Leerwege ohne Tippen — Abbrechen, Speichern + Taste n, Kopfzeile zu/auf, Palette — hinterlassen "?" (gegen den Halbfix "nur editChar")', async ({
            page
        }) => {
            test.setTimeout(90000);
            const beob = await ladenMitHelden(page);
            await ablaufW4(page, bedienung(page, false), true);
            await ohneNetzUndFehler(page, beob);
        });

        test('(g) (W5) GENAU Coras Wert getippt, Abbrechen → "?", dann ✏️ Cora → Coras Bild (gegen ein synthetisches change, R4)', async ({
            page
        }) => {
            test.setTimeout(60000);
            const beob = await ladenMitHelden(page);
            const bedien = bedienung(page, false);
            await zuReiter(page, 'party');
            await bedien(kopfzeile(page));
            await expect(formular(page)).toHaveClass(/\bopen\b/);
            await avatarTippen(page, bedien, LOKALES_BILD);
            await pruefe(page, '(W5) Coras Wert in den Entwurf getippt', LOKALES_BILD);
            await bedien(abbrechenKnopf(page));
            await expect(formular(page)).not.toHaveClass(/\bopen\b/);
            await bedien(kopfzeile(page));
            await expect(formular(page)).toHaveClass(/\bopen\b/);
            await pruefe(page, '(W5) → Abbrechen → Kopfzeile auf', '');
            await bedien(kopfzeile(page));
            await expect(formular(page)).not.toHaveClass(/\bopen\b/);
            await bearbeitenKopf(page, bedien, CORA.id);
            await pruefe(page, '(W5) → ✏️ Cora', LOKALES_BILD);
            await ohneNetzUndFehler(page, beob);
        });

        test('(g) (W6) Kontrolle R5: ein Entwurf mit getipptem Bild behaelt Feld und Vorschau ueber Kopfzeile zu/auf, Taste n und Palette', async ({
            page
        }) => {
            test.setTimeout(60000);
            const beob = await ladenMitHelden(page);
            const bedien = bedienung(page, false);
            await zuReiter(page, 'party');
            await bedien(kopfzeile(page));
            await expect(formular(page)).toHaveClass(/\bopen\b/);
            await avatarTippen(page, bedien, HTTPS_BILD);
            await pruefe(page, '(W6) Entwurf: HTTPS_BILD getippt', HTTPS_BILD);
            await bedien(kopfzeile(page));
            await expect(formular(page)).not.toHaveClass(/\bopen\b/);
            await bedien(kopfzeile(page));
            await expect(formular(page)).toHaveClass(/\bopen\b/);
            await pruefe(page, '(W6) Entwurf → Kopfzeile zu und auf', HTTPS_BILD);
            // Der Fokus liegt nach dem Klick auf die Kopfzeile in keinem Feld: n erreicht die Seite
            await page.keyboard.press('n');
            await page.waitForTimeout(SETZEN);
            await pruefe(page, '(W6) Entwurf → Taste n', HTTPS_BILD);
            await zuReiter(page, 'quests');
            await palette(page, 'Neuer Charakter');
            await expect(page.locator('#view-party')).toHaveClass(/\bactive\b/);
            await pruefe(
                page,
                '(W6) Entwurf → Reiter Quests → Palette "Neuer Charakter"',
                HTTPS_BILD
            );
            await ohneNetzUndFehler(page, beob);
        });

        // (W9) Altdaten — prueft NUR R1 (Vorschau = Feld), nicht, was editChar() ins Feld
        // schreibt: das ist R7 (eigener Vorgang). Darum auch nur pageerror: editChar() wirft
        // heute bei `speed` als Zahl (`speedVal.split is not a function`), EventDelegation
        // faengt das und meldet es per console.error und im Fehlerlog der App — das haelt
        // dieser Fall nicht fest, weder als Soll noch als Verbot. Ebenso wenig die Karte: bei
        // Ida und Kai zeigt sie vor dem Speichern 👤, die Vorschau das Bild aus dem Feld.
        test('(g) (W9) Altdaten: nach ✏️ Aria, ✏️ Gus (`speed` als Zahl), ✏️ Ida (Avatar als Array) und ✏️ Kai (NBSP davor) folgt die Vorschau dem Feld', async ({
            page
        }) => {
            test.setTimeout(60000);
            const beob = await ladenMitHelden(page, { characters: [ARIA, BRAM, GUS, IDA, KAI] });
            const bedien = bedienung(page, false);
            expect(
                await page.evaluate(() => {
                    /** @param {number} id */
                    // @ts-ignore
                    const finde = id => (window.D?.characters || []).find(c => c && c.id === id);
                    return {
                        gus: typeof finde(7)?.speed,
                        ida: Array.isArray(finde(8)?.avatar),
                        kai: String(finde(9)?.avatar).startsWith('\u00a0')
                    };
                }),
                'Vorbedingung: die Altdaten ueberstehen das Laden (sonst ist es keine Altdaten-Probe)'
            ).toEqual({ gus: 'number', ida: true, kai: true });
            await zuReiter(page, 'party');
            await bearbeitenKopf(page, bedien, ARIA.id);
            await pruefe(page, '(W9) ✏️ Aria', DATA_BILD);
            await bearbeitenKopf(page, bedien, GUS.id);
            await pruefe(
                page,
                '(W9) dann ✏️ Gus (`speed` als Zahl): Vorschau = Feld, gleich was im Feld steht'
            );
            await bearbeitenKopf(page, bedien, IDA.id);
            await pruefe(page, '(W9) dann ✏️ Ida (Avatar als Array): Vorschau = Feld');
            await bearbeitenKopf(page, bedien, KAI.id);
            await pruefe(page, '(W9) dann ✏️ Kai (NBSP davor): Vorschau = Feld, getrimmt');
            await page.waitForTimeout(300);
            expect(beob.netz, 'keine Anforderung an einen Netzwerkpfad').toEqual([]);
            expect(beob.seitenfehler, 'kein Seitenfehler').toEqual([]);
        });

        test('(g) (W10) Import R7: "Ersetzen" bei offenem ✏️ mit getipptem Bild leert Feld UND Vorschau, ✏️ eines importierten Helden zeigt sein Bild; "Hinzufuegen" laesst beides stehen', async ({
            page
        }) => {
            test.setTimeout(90000);
            const beob = await ladenMitHelden(page);
            const bedien = bedienung(page, false);
            await zuReiter(page, 'party');
            const vorlage = await partyExportieren(page);
            /** @param {number} id */
            const quelle = id =>
                vorlage.data.find(/** @param {any} c */ c => c && Number(c.id) === id) ||
                vorlage.data[0];
            const datei = {
                ...vorlage,
                data: [
                    { ...quelle(ARIA.id), name: 'Pia', avatar: HTTPS_BILD },
                    { ...quelle(BRAM.id), name: 'Quirin', avatar: '' }
                ]
            };

            // Hinzufuegen bei offenem ✏️ Cora: Coras ID bleibt Cora, R7 verwirft nichts (Kontrolle)
            await bearbeitenKopf(page, bedien, CORA.id);
            await pruefe(page, '(W10) ✏️ Cora', LOKALES_BILD);
            await partyImportieren(page, datei, 'merge');
            await expect(formular(page), 'Vorbedingung: nach "Hinzufuegen" offen').toHaveClass(
                /\bopen\b/
            );
            await expect.poll(() => bearbeitenId(page)).toBe(String(CORA.id));
            await pruefe(page, '(W10) ✏️ Cora → Import "Hinzufuegen"', LOKALES_BILD);

            // Ersetzen bei offenem ✏️ Aria mit getipptem, nie gespeichertem Bild: R7 verwirft
            // das Bearbeiten ueber cancelCharEdit()
            await bearbeitenKopf(page, bedien, ARIA.id);
            await pruefe(page, '(W10) ✏️ Aria', DATA_BILD);
            await avatarTippen(page, bedien, RELATIVES_BILD);
            await pruefe(page, '(W10) ✏️ Aria, RELATIVES_BILD getippt', RELATIVES_BILD);
            await partyImportieren(page, datei, 'replace');
            await expect(formular(page), 'Vorbedingung: "Ersetzen" klappt zu').not.toHaveClass(
                /\bopen\b/
            );
            weich(await bearbeitenId(page), '(W10) Bearbeiten-ID verworfen (R7)').toBe('');
            await bedien(kopfzeile(page));
            await expect(formular(page)).toHaveClass(/\bopen\b/);
            await pruefe(page, '(W10) ✏️ Aria, getippt → Import "Ersetzen" → Kopfzeile auf', '');
            await bedien(kopfzeile(page));
            await expect(formular(page)).not.toHaveClass(/\bopen\b/);

            const ids = await kartenIds(page);
            expect(Object.keys(ids).sort(), 'Vorbedingung: ersetzt durch Pia und Quirin').toEqual([
                'Pia',
                'Quirin'
            ]);
            await bearbeitenKopf(page, bedien, ids.Pia);
            await pruefe(page, '(W10) dann ✏️ Pia (importiert)', HTTPS_BILD);
            await ohneNetzUndFehler(page, beob);
        });
    });

    // =======================================================================
    // (W7) 390x844 per Tap
    // =======================================================================
    test.describe('(W7) Telefon 390x844, per Tap', () => {
        test.use({ viewport: TELEFON, hasTouch: true, isMobile: true });

        /**
         * Vorbedingung Mobil-Layout; danach den Umzugshinweis per Tap wegnehmen. Unter
         * file:// erscheint er einmal je Sitzung als feste Leiste oben (`showMigrationHintBanner()`,
         * systems/migration/migration-wizard.js). Ungescrollt schiebt `body.has-migration-hint` den
         * Inhalt darunter, gescrollt liegt die Leiste UEBER ihm — und `locator.tap()` prueft nicht,
         * ob das Ziel verdeckt ist, es tippt auf die Mitte. Gemessen im CI-Lauf zu 7d0c6760
         * (Linux): (W3) scrollte Arias Kartenkopf genau unter die Unterkante der Leiste, der Tipp
         * traf sie, und Bram blieb in Bearbeitung („2“ statt „1“, in allen drei Versuchen); unter
         * Windows lagen die Karten mit anderen Schrifthoehen woanders. Die Leiste gehoert nicht zu
         * diesem Block; ein Mensch tippt sie weg, wie eingaberahmen, fokusring und welle-5 es tun.
         * @param {import('@playwright/test').Page} page
         */
        async function mobil(page) {
            await expect(page.locator('html'), 'Vorbedingung: Mobil-Layout').toHaveAttribute(
                'data-layout',
                'mobile'
            );
            const hinweis = page.locator('#migration-hint-banner');
            if (await hinweis.isVisible()) {
                await hinweis.locator('[data-action="close-migration-hint"]').tap();
                await expect(hinweis).toBeHidden();
            }
        }

        test('(g) (W7) = (W1) per Tap: ✏️ ueber den Kartenkopf zeigt das Bild des Helden', async ({
            page
        }) => {
            test.setTimeout(120000);
            const beob = await ladenMitHelden(page, { telefon: true });
            await mobil(page);
            await ablaufW1(page, bedienung(page, true));
            await ohneNetzUndFehler(page, beob);
        });

        test('(g) (W7) = (W3) per Tap: ein getipptes Bild verschwindet mit Abbrechen', async ({
            page
        }) => {
            test.setTimeout(120000);
            const beob = await ladenMitHelden(page, { telefon: true });
            await mobil(page);
            await ablaufW3(page, bedienung(page, true));
            await ohneNetzUndFehler(page, beob);
        });

        test('(g) (W7) = (W4) per Tap: Abbrechen, Speichern + Kopfzeile, Kopfzeile zu/auf hinterlassen "?"', async ({
            page
        }) => {
            test.setTimeout(120000);
            const beob = await ladenMitHelden(page, { telefon: true });
            await mobil(page);
            await ablaufW4(page, bedienung(page, true), false);
            await ohneNetzUndFehler(page, beob);
        });
    });

    // =======================================================================
    // (W8) prod-Buendel
    // =======================================================================
    test.describe('(W8) prod-Buendel, 1440x900', () => {
        test.use({ viewport: BREIT });

        test('(g) (W8) = (W1) am prod-Buendel', async ({ page }) => {
            test.skip(!PROD_DA, PROD_GRUND);
            test.setTimeout(90000);
            const beob = await ladenMitHelden(page, { url: APP_URL_PROD });
            await ablaufW1(page, bedienung(page, false));
            await ohneNetzUndFehler(page, beob);
        });

        test('(g) (W8) = (W3) am prod-Buendel', async ({ page }) => {
            test.skip(!PROD_DA, PROD_GRUND);
            test.setTimeout(60000);
            const beob = await ladenMitHelden(page, { url: APP_URL_PROD });
            await ablaufW3(page, bedienung(page, false));
            await ohneNetzUndFehler(page, beob);
        });
    });
});
