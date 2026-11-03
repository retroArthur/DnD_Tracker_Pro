// @ts-check
import path from 'path';
import { pathToFileURL } from 'url';
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

/**
 * Lokale Bilder in der Eingabe — Bild-Dialog, Bestiar-Editor, Charakterformular (AVATAR-DATEI)
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
 *   (b) Bild-Dialog, drei Netzwerkpfade: Fehlermeldung, nichts gespeichert, keine Anforderung.
 *                                                                          gruen (Sperre steht)
 *   (c) Bestiar-Editor: lokal angenommen (Vorschau 192, gespeichert, Portrait im Detail)  rot;
 *       Netzwerkpfade abgelehnt, nichts gespeichert, keine Anforderung                   gruen
 *   (d) Charakterformular: lokale Datei -> Vorschau zeigt das Bild (192)   rot;
 *       Netzwerkpfade -> Platzhalter "?", kein Bild, keine Anforderung     gruen
 *   (e) Die Meldung des Bild-Dialogs nennt lokale Dateien (A2).            rot an dd399a32
 *   (f) Kontrolle: http(s)-Bild und data:image/ werden weiter angenommen.  gruen
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
 * senken-kanarie.spec.js): jede Anforderung, deren Ziel ein Host unter file: ist, `neben.invalid`
 * nennt oder als letztes Pfadsegment `netzbild-?.png` traegt, bricht page.route ab, BEVOR der
 * Browser sie oeffnet ('request' feuert vorher und wird gezaehlt). Entschieden wird an der URL,
 * wie Chromium sie anfordert (route.request().url()): die route-Pruefung selbst bekommt eine
 * node-URL, und node normalisiert `file://localhost/x` zu `file:///x` — Chromium behaelt den Host
 * und oeffnete ihn unter Windows als UNC `\\localhost\…`. http(s) bricht ebenfalls ab: auch die
 * Kontrolle (f) verlaesst das Geraet nicht. Dass die Beobachtung greift, ist gemessen: mit einer
 * Vorschau ohne jede Pruefung (Gegenprobe am Buendel, nicht eingecheckt) zaehlt (d) 68
 * Anforderungen an Netzwerkpfade — Chromium fordert jeden getippten Zwischenstand an — und
 * bricht jede ab; mit einer Pruefung nach A1 (Probe am Buendel) sind alle sieben Faelle gruen.
 */

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
const SPEICHER = 'dnd-tracker-v4';
const BREIT = { width: 1440, height: 900 };

/** Die Datei des Repos, 192x192 — als file:///-URL aus process.cwd(). */
const LOKALES_BILD = pathToFileURL(path.resolve(process.cwd(), 'icons', 'icon-192.png')).href;
const LOKALE_BREITE = 192;

/** Netzwerkpfade (A1): Host unter file:, protokoll-relativ, kodierter doppelter Trenner. */
const NETZWERKPFADE = [
    'file://localhost/netzbild-a.png',
    '//neben.invalid/netzbild-b.png',
    '/%5C%5Cneben.invalid/netzbild-c.png'
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

function saat() {
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
        characters: [],
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
            characters: 1,
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
 * Ob eine Anforderung einen Netzwerkpfad aus NETZWERKPFADE (oder sonst einen Host unter file:)
 * betrifft. EINE Lesart fuer den Abbruch (page.route) und die Zaehlung ('request').
 * @param {string} url
 */
function istNetzziel(url) {
    const s = String(url);
    if (/^file:\/\/[^/]/i.test(s)) return true; // file: mit Host — unter Windows UNC
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
 * Laedt breit, saet EINMAL je Tab (ein Neuladen liest, was die App gespeichert hat), bricht
 * jede Anforderung an das Netz und an einen Netzwerkpfad ab und zaehlt die Netzwerkpfade.
 * @param {import('@playwright/test').Page} page
 */
async function laden(page) {
    /** @type {string[]} */
    const netz = [];
    /** @type {string[]} */
    const seitenfehler = [];
    await page.route(/^https?:/i, r => r.abort());
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
    await page.setViewportSize(BREIT);
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
        [SPEICHER, saat()]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.waitForTimeout(300);
    return { netz, seitenfehler };
}

// ---------------------------------------------------------------------------
// Bedienung
// ---------------------------------------------------------------------------
/** Reiter per Klick (Gruppenmenue der Navigation zuerst oeffnen, wie zuReiter()). */
async function zuReiter(page, ansicht) {
    const tab = page.locator(`.nav-tab[data-view="${ansicht}"]`).first();
    if (!(await tab.isVisible())) {
        await page.locator('.nav-group', { has: tab }).locator('.nav-group-btn').click();
    }
    await tab.click();
    await expect(page.locator(`#view-${ansicht}`)).toHaveClass(/\bactive\b/);
    await page.waitForTimeout(250);
}

/** Feld anklicken, leeren (Strg+A, Entf) und Zeichen fuer Zeichen tippen. */
async function eintippen(page, selektor, text) {
    await page.locator(selektor).click();
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
test('(d) Charakterformular: die Vorschau zeigt ein lokales Bild geladen, bei einem Netzwerkpfad den Platzhalter', async ({
    page
}) => {
    test.setTimeout(60000);
    const { netz, seitenfehler } = await laden(page);
    await charakterFormularOeffnen(page);
    const vorschau = page.locator('#cf-avatar-preview');

    await eintippen(page, '#char-avatar', LOKALES_BILD);
    await weich
        .poll(() => bildBreite(vorschau.locator('img')), { timeout: 5000 })
        .toBe(LOKALE_BREITE);
    weich(await vorschau.locator('.cf-avatar-placeholder').count(), 'kein Platzhalter').toBe(0);

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
