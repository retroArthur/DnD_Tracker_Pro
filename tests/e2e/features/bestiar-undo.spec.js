// @ts-check
/**
 * Der Waechter "Die offene Bestiar-Ansicht folgt D" (BESTIAR-UNDO)
 * ================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in zwei Saetzen: **nach Strg+Z oder Strg+Y
 * zeigt die OFFENE Bestiar-Ansicht den Stand von D** — ★, Zeilen, Namen,
 * Zaehler, Filteroptionen und das Detail —, auf jedem Weg (Taste, ↩️ im
 * Telefonkopf, ⋯ → ↪️, Reiterwechsel). Und **das Detail folgt D auch nach
 * Speichern und Loeschen**, ohne dass Fokus, Lage oder Rolllage des Details
 * verloren gehen, wenn sich an der gewaehlten Kreatur nichts geaendert hat.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND — GEMESSEN am Kopf 543706c6 (BESTIAR-KLICK, #27) und am main
 * 4037338d, dev und prod, Chromium, echte Klicks, Taps und Tasten; Saat:
 * Favoriten Adler und Kraken, eine eigene Kreatur "Altwesen" (id 1)
 *
 *  U1 ★ des Goblin ("gob"), Strg+Z: D.bestiaryFavorites ist wieder
 *     [adler, kraken], der Knopf bleibt aber "active", aria-pressed "true",
 *     Zeichen ★. Ein Klick darauf — der Spielleiter will den Favoriten
 *     wegnehmen — FUEGT den Goblin hinzu. Telefon (↩️, ⋯ → ↪️) und prod gleich.
 *  U3 Filter "Favoriten", ★ Adler weg, Strg+Z: D hat Adler wieder, die Liste
 *     zeigt nur den Kraken.
 *  U4 "Probewesen" (Typ "Probetyp") anlegen, waehlen, Strg+Z: die Zeile
 *     2:custom steht weiter da, der Zaehler zeigt 114 statt 113, "Probetyp"
 *     steht weiter im Typ-Filter, das Detail zeigt Probewesen samt Loeschen —
 *     und Loeschen meldet "❌ bestiary nicht gefunden" (dev: console.error).
 *  U5 Altwesen loeschen, Strg+Z: D hat es wieder, die Liste nicht (112).
 *  U6 Altwesen in "Neuwesen" umbenannt, Strg+Z: die Liste zeigt "Neuwesen".
 *  K3 Wie U4, aber Strg+Z in der Party und zurueck: die Liste stimmt (der
 *     Reiterwechsel zeichnet sie), das Detail zeigt weiter Probewesen.
 *  K6 Typ-Filter "Probetyp", Strg+Z: der Filter bleibt auf dem verschwundenen
 *     Wert, die Liste zeigt die verschwundene Kreatur.
 *  Nebenbefund ohne Undo, vorbestehend: nach "Loeschen" bleibt die geloeschte
 *  Kreatur samt Loeschen-Knopf im Detail stehen; nach "Bearbeiten →
 *  Speichern" zeigt das Detail den alten Namen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE URSACHE
 *
 * `undo()`/`redo()` ersetzen D vollstaendig und machen das ueber
 * `renderAll()` sichtbar. `renderAll()` (features/render-dashboard.js)
 * zeichnet eine feste Liste und den offenen Welt-Reiter — das Bestiar kommt
 * darin nicht vor, sein Detail nirgends. Die Liste zeichnen nur der
 * Reiterwechsel (TAB_RENDER_REGISTRY.bestiary), der ★, Speichern, Loeschen und
 * die Auswahl; also bleibt nach Strg+Z das alte Markup stehen: Klasse
 * "active" und ★, die Zeilen, #bestiary-count, die Filteroptionen.
 * aria-pressed ist nur abgeleitet (die Tastaturgruppe liest die Klasse).
 * Das Detail haengt am Modulzustand selectedBestiaryId/-Source in
 * features/bestiary/bestiary-render.js; den prueft niemand gegen D — weder
 * nach Undo noch nach Speichern oder Loeschen. Der bestehende Fall
 * 'Undo loeschen' in bestiary.spec.js schluckte das Ausbleiben per .catch.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER VERTRAG (Kritik zu BESTIAR-UNDO, R1–R7; Entscheidungen des Nutzers)
 *
 * R1  Die offene Ansicht folgt D — nach Strg+Z/Strg+Y auf jedem Weg und nach
 *     jedem anderen renderAll()/renderAfterDataReplace(): ★/☆, Klasse active
 *     und aria-pressed passen zu D.bestiaryFavorites; die Zeilenmenge stimmt,
 *     auch unter "Favoriten"; Namen im Stand von D; #bestiary-count = SRD plus
 *     eigene; die Optionen von HG und Typ entsprechen den vorhandenen
 *     Kreaturen; ein Klick auf ★ tut danach, was die Anzeige verspricht.
 * R2  Ein Weg: Liste UND Detail ueber den Registry-Eintrag 'bestiary'.
 *     renderAll() ruft renderTabContent('bestiary') nur bei aktivem
 *     #view-bestiary (Muster REITERIMPORT R8). Bei verstecktem Bestiar wird
 *     nicht gezeichnet — die Fensterhoehe beim ersten Oeffnen bleibt (W10).
 *     Kein Post-Save-Hook fuer die Liste, keine Aenderung im Undo-Modul,
 *     'npcs', 'dashboard', 'reise' bleiben draussen (REITERIMPORT Z4).
 * R3  Detail. Gibt es die gewaehlte Kreatur nicht mehr: selectedBestiaryId
 *     null, der leere Zustand "Wähle ein Monster aus der Liste" (bestehende
 *     Klasse .bestiary-detail-empty), keine Knoepfe, kein Toast "nicht
 *     gefunden", kein console.error — auch nach dem Reiterwechsel. Geaendert:
 *     im Stand von D neu gezeichnet. UNVERAENDERT: das Detail wird NICHT neu
 *     gezeichnet (Fokus, Rolllage, Oeffner eines Dialogs bleiben).
 *     Entscheidung (c): dieselbe Regel nach Speichern und Loeschen — und
 *     Strg+Z nach einem Loeschen waehlt die Kreatur nicht wieder aus.
 * R4  Der Fokus faellt nie auf BODY. Im Detail, Kreatur bleibt: danach auf
 *     dem Knopf mit derselben data-action. Im Detail, Kreatur verschwindet:
 *     #bestiary-search (Entscheidung (b), Empfehlung). Auf ★ oder Zeile, die
 *     bleibt: bleibt dort. Verschwindet die fokussierte Zeile: NICHT auf
 *     einer fremden Zeile (Entscheidung des Nutzers, schaerfer als die
 *     Kritik, die die Nachbarzeile gleichen Index zulassen wollte).
 * R5  BESTIAR-KLICK R3 gilt auch fuer Undo: unveraenderte Filtersignatur →
 *     Lage bleibt, der gewaehlte Eintrag bleibt gezeichnet, sichtbar,
 *     .selected. Verschwindet ein gewaehlter Typ-/HG-Wert: Filter "Alle",
 *     Liste oben; Strg+Y stellt ihn NICHT wieder her (Entscheidung (d)).
 * R6  Keine neuen Senken (html-senken, Inline-Stil, Klassen) — kein Fall hier.
 * R7  Doku (Katalog BESTIAR-KLICK R3 und Offen (9)) — kein Fall hier.
 *
 * NICHT ZULAESSIG, und wer es faengt (an Buendelkopien gemessen):
 *   renderBestiaryList unbedingt in renderAll (400 statt 587 px)    → (W10), Unit Z5
 *   Detail-Abgleich nur in renderAll / renderOffeneWeltAnsicht      → (W4)
 *   Detail bei jedem Neuzeichnen ohne Aenderungspruefung (BODY)     → (W6) (W7)
 *   ... auch mit Fokus/Rolllage von Hand zurueckgesetzt             → (W7)(W8)(W9)(W12a)
 *   Fokus der verschwundenen Zeile an die Nachbarzeile (Index)      → (W3)
 *   Fokus einer BLEIBENDEN Zeile nach Index, nicht nach Kreatur     → (W3b)
 *   Aenderungspruefung des Details nur ueber den Namen              → (W6b)
 *   Rolllage des Details beim Neuzeichnen zurueckgesetzt            → (W9b)
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE FAELLE (1440x900 dev und prod; Telefon 390x844 per Tap, dev und prod)
 * und ihr Stand am unveraenderten Buendel (543706c6, dev und prod gebaut)
 *
 *   (W1)  "gob", ★ Goblin, Strg+Z / Strg+Y / Strg+Z,
 *         Klick auf den ☆ — breit und Telefon                rot ×4 (★, active, aria
 *         (↩️, ⋯ → ↪️)                            R1          "true"; der Klick fuegt
 *                                                             hinzu, obwohl ★ stand)
 *   (W2)  Filter "Favoriten", ★ Adler weg, Strg+Z,
 *         Strg+Y                                  R1          rot ×2 (nur der Kraken)
 *   (W3)  Probewesen anlegen, Zeile waehlen,
 *         Strg+Z, Strg+Y                          R1 R3 R4    rot ×2 (Zeile, 114,
 *                                                             Probetyp, Detail)
 *   (W3b) Aawesen ueber Altwesen anlegen, Zeile
 *         Altwesen fokussiert, Strg+Z, Strg+Y     R4          rot ×2 (Zeile Aawesen
 *                                                             bleibt stehen)
 *   (W4)  wie (W3), Strg+Z aber in der Party       R2 R3       rot ×2 (Detail Probewesen)
 *   (W5)  Altwesen im Detail loeschen (confirm),
 *         Strg+Z, Strg+Y                          R1 R3 R4 (c) rot ×2 (Detail nach dem
 *                                                             Loeschen; Zeile, 112)
 *   (W6)  Bearbeiten → Neuwesen → Speichern,
 *         Strg+Z, Strg+Y                          R1 R3 R4 (c) rot ×2 (Detail alter Name;
 *                                                             Liste "Neuwesen")
 *   (W6b) Bearbeiten → nur TP 10 → 77 →
 *         Speichern, Strg+Z, Strg+Y               R3 (c)      rot ×2 (Detail 10 statt 77
 *                                                             nach Speichern und Strg+Y)
 *   (W7)  Goblin waehlen, ★, Tab auf "Zur
 *         Initiative", Strg+Z                     R3 R4       rot ×2 (★)
 *   (W8)  per Rad gerollt, Goblin waehlen, ★,
 *         Strg+Z, Strg+Y                          R5 + R1     rot ×2 NUR am ★ — Lage,
 *                                                             Zeile, Fokus gruen
 *   (W9)  Drache waehlen, Detail per Rad rollen,
 *         ★, Strg+Z                               R3          gruen ×2 (Rueckschritt)
 *   (W9b) Altwesen (lang) bearbeitet, Detail
 *         per Rad gerollt, Strg+Z, Strg+Y         R3 (c)      rot ×2 (Detail 10 statt 77
 *                                                             nach dem Speichern, nicht
 *                                                             neu gezeichnet)
 *   (W10) Start auf dem Dashboard, erstes Oeffnen  R2          gruen ×2 (Rueckschritt)
 *   (W11) Typ-Filter Probetyp per Tastatur,
 *         Strg+Z, Strg+Y                          R5 (d)      rot ×2 (Filter bleibt auf
 *                                                             dem verschwundenen Wert)
 *   (W12a) Telefon: ★ Altwesen, zum Detail
 *         gerollt, ↩️, ⋯ → ↪️                    R1 R3       rot ×2 (★)
 *   (W12b) Telefon: anlegen, waehlen, ↩️           R1 R3       rot ×2 (Zeile, 114, Detail)
 *   Zusammen 24 rot, 4 gruen; kein Fall an Vorbedingung oder Zeitueberschreitung.
 *   In jedem Fall: kein pageerror, kein console.error, kein Toast "nicht
 *   gefunden", als Dialog hoechstens das confirm des Loeschens (W5).
 *   Aus der Pruefung nachgetragen (Luecken, die ein Halbfix gruen liess), am
 *   Basisstand gemessen: (W3b) (W6b) (W9b) rot ×2.
 *
 * AN BUENDELKOPIEN DES DEV-BUENDELS GEMESSEN (ausserhalb des Repos):
 *   Fix-Skizze (Registry: Liste + Detail mit Aenderungspruefung, offene
 *   Ansicht in renderAll, Zeilenfokus-Regel)        14 von 14 gruen; dieselbe
 *     Skizze im Quelltext einer Kopie, dev und prod gebaut: 28 von 28
 *   Liste ueber die Registry, ohne Detail           rot (W3)(W4)(W5)(W6)(W12b)
 *   renderBestiaryList unbedingt in renderAll       rot (W10) 400 statt 587 px
 *   Detail-Abgleich nur in renderAll, ungeprueft    rot (W4), (W6)(W7) BODY, (W3)(W5)
 *   Kritik-Kandidat (Nachbarzeile gleichen Index)   rot NUR (W3) — fremde Zeile;
 *                                                   seit (W3b) auch dort rot
 *   Detail immer neu, Fokus/Rolllage von Hand       rot (W7)(W8)(W9)(W12a) — Beobachter
 * NACHGETRAGEN, an Quelltextkopien des Fix-Stands gemessen (dev gebaut):
 *   Fokusrueckgabe nur bei verschwundener Zeile     rot NUR (W3b) — 16 andere gruen
 *   Aenderungspruefung nur ueber den Namen          rot NUR (W6b) — 14 andere gruen
 *   Rolllage des Details nach dem Neuzeichnen auf 0 rot (W9b) 462 → 0
 *   ohne die Rueckgabe der Rolllage                 gruen (W9b) — Chromium haelt sie selbst
 *
 * MODULPFADE: das CRUD- und das Aktionsmodul des Bestiars stehen auf der
 * Ausnahmeliste der Modulabdeckung; ihre Pfade werden hier nicht woertlich
 * genannt (eine Nennung zaehlte als Abdeckung und machte die Ratsche rot).
 *
 * BEDIENWEG: nur echte Navigation, Klicks, Taps, Tasten und das Mausrad.
 * `evaluate` saet nur VOR dem Laden (addInitScript) und liest ab — auch die
 * erwarteten Filteroptionen und der erste Treffer werden aus dem Buendel
 * GELESEN (getSRDMonsters, D.bestiary, crToSortValue), nicht abgetippt. Vor
 * dem Laden haengt dazu ein reiner Beobachter (MutationObserver), der nur
 * ZAEHLT, wie oft das Detail neu geschrieben wird (siehe laden()).
 */
import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const WURZEL = process.cwd().replace(/\\/g, '/');
const DEV = `file:///${WURZEL}/dist/dnd-tracker-bundled.html`;
const PROD = `file:///${WURZEL}/dist/dnd-tracker-optimized.html`;
/** Der CI-Job `e2e` baut nur dev (`python build.py`); die prod-Faelle gibt es
 *  nur mit einem frischen `python build.py --production`. */
const PROD_DA = existsSync(join(process.cwd(), 'dist', 'dnd-tracker-optimized.html'));
const BUENDEL = /** @type {const} */ ([
    ['dev', DEV],
    ['prod', PROD]
]);

const SPEICHER = 'dnd-tracker-v4';

const BREIT = { width: 1440, height: 900 };
const TELEFON = { width: 390, height: 844 };

/** Zeit fuer Zeichnen, Tastaturgruppe (aria-pressed, rAF) und Fokusrueckgabe. */
const SETZEN_MS = 450;

/** Der leere Zustand des Details, wie die Vorlage ihn zeigt (R3, Entscheidung (b)). */
const LEER_TEXT = 'Wähle ein Monster aus der Liste';
/** SRD-Monster (112) plus die gesaete eigene Kreatur. */
const ZAEHLER_SAAT = 113;

const GOB = 'goblin:srd';
const ALT = '1:custom';
const PROBE = '2:custom';

/** WEICHE Zusicherungen fuer die Ergebnisse: ein roter Lauf nennt JEDE
 *  gebrochene Zusage, nicht nur die erste. Vorbedingungen bleiben hart. */
const weich = expect.configure({ soft: true });

/**
 * Die Saat: zwei Favoriten (Adler, Kraken), eine eigene Kreatur "Altwesen"
 * (id 1, Typ "Humanoid" — das SRD schreibt "Humanoide (…)", der Typ haengt
 * also allein an ihr und verschwindet mit ihr aus dem Typ-Filter). Der
 * Goblin ist bewusst KEIN Favorit.
 */
function saat() {
    return {
        _version: '99.0.0',
        settings: {
            theme: 'dark',
            lastView: 'dashboard',
            enableMarkdownShortcuts: true,
            markdownOnboardingSeen: true,
            levelingMode: 'xp'
        },
        randomTables: [],
        timers: [],
        shops: [],
        campaign: {},
        characters: [
            {
                id: 1,
                name: 'Anna',
                characterClass: 'Magier',
                level: 5,
                hp: 20,
                maxHp: 20,
                ac: 12
            }
        ],
        npcs: [],
        locations: [],
        quests: [],
        encounters: [],
        loot: [],
        wiki: [],
        sessionNotes: [],
        bestiary: [
            {
                id: 1,
                name: 'Altwesen',
                source: 'custom',
                cr: '1',
                creatureType: 'Humanoid',
                size: 'Mittelgroß',
                ac: 12,
                hp: 10,
                str: 10,
                dex: 10,
                con: 10,
                int: 10,
                wis: 10,
                cha: 10
            }
        ],
        bestiaryFavorites: ['adler', 'kraken'],
        _nextId: { characters: 2, bestiary: 2 }
    };
}

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst: `pageerror`,
 * `console.error` (ohne Netzrauschen der Schriften unter file://) und
 * Dialoge. Ein confirm wird angenommen — das ist der Bedienweg des Loeschens;
 * jeder andere Dialog wird abgelehnt. Beides wird notiert.
 * @param {import('@playwright/test').Page} page
 */
function fehlerFangen(page) {
    /** @type {{fehler: string[], dialoge: string[]}} */
    const f = { fehler: [], dialoge: [] };
    page.on('pageerror', e => f.fehler.push('pageerror: ' + e.message));
    page.on('console', m => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
            f.fehler.push('console.error: ' + m.text().split('\n')[0]);
        }
    });
    page.on('dialog', d => {
        f.dialoge.push(d.type() + ': ' + d.message());
        if (d.type() === 'confirm') d.accept().catch(() => {});
        else d.dismiss().catch(() => {});
    });
    return f;
}

/**
 * Saet (einmal je Tab, VOR dem Laden), laedt und wartet die fremde
 * Speicherung ab (`load()` repariert die Saat und schreibt `_version` neu).
 * @param {import('@playwright/test').Page} page @param {string} url
 * @param {ReturnType<typeof saat>} [s] eine abgewandelte Saat (Standard: saat())
 */
async function laden(page, url, s = saat()) {
    const f = fehlerFangen(page);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (sessionStorage.getItem('bestiar-undo-gesaet')) return;
                sessionStorage.setItem('bestiar-undo-gesaet', '1');
                localStorage.setItem(schluessel, JSON.stringify(s));
            } catch {
                // file://-localStorage ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, s]
    );
    // Ein reiner Beobachter, kein Eingriff: er zaehlt, wie oft das Detail seinen
    // Inhalt ersetzt bekommt (childList-Aenderung AM Panel = innerHTML). R3 sagt:
    // ist die gewaehlte Kreatur unveraendert, wird das Detail NICHT neu gezeichnet.
    // Fokus und Rolllage allein beweisen das nicht — ein Fix, der immer neu zeichnet
    // und beides von Hand zuruecksetzt, saehe dort gleich aus (an einer
    // Buendelkopie gemessen); einen offenen Dialog verloere er trotzdem.
    await page.addInitScript(() => {
        const w = /** @type {any} */ (window);
        w.__bestiarUndoDetailZeichnungen = 0;
        new MutationObserver(liste => {
            for (const m of liste) {
                const ziel = /** @type {Element} */ (m.target);
                if (m.type === 'childList' && ziel && ziel.id === 'bestiary-detail-panel') {
                    w.__bestiarUndoDetailZeichnungen++;
                }
            }
        }).observe(document, { childList: true, subtree: true });
    });
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, {
        timeout: 15000
    });
    await page
        .waitForFunction(
            schluessel => {
                try {
                    return (
                        JSON.parse(localStorage.getItem(schluessel) || '{}')._version !== '99.0.0'
                    );
                } catch {
                    return false;
                }
            },
            SPEICHER,
            { timeout: 4000 }
        )
        .catch(() => {});
    return f;
}

/** @param {import('@playwright/test').Page} page */
function istMobil(page) {
    return page.evaluate(() => document.documentElement.dataset.layout === 'mobile');
}

/**
 * Mitte eines Elements und ob dort wirklich es selbst (oder ein Kind)
 * obenauf liegt. Fuer Taps auf freie Koordinaten.
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
 * Ein echter Klick (Desktop) bzw. Tap (Telefon) auf genau ein Element.
 * @param {import('@playwright/test').Page} page @param {string} sel @param {string} was
 */
async function bediene(page, sel, was) {
    const ort = page.locator(sel);
    await expect(ort, `Vorbedingung: ${was} ist genau einmal da`).toHaveCount(1);
    if (await istMobil(page)) await ort.tap();
    else await ort.click();
    await page.waitForTimeout(SETZEN_MS);
}

/**
 * Zur Ansicht ueber die ECHTE Navigation. Desktop: Gruppe aufklappen, Reiter
 * klicken. Telefon: Leiste per Tap ausfahren, Reiter antippen, einfahren.
 * @param {import('@playwright/test').Page} page @param {string} ansicht
 */
async function zurAnsicht(page, ansicht) {
    const reiterSel = `.nav-tab[data-view="${ansicht}"]`;
    if (await istMobil(page)) {
        const u = await mitteFrei(page, '.mobile-nav-toggle');
        expect(u && u.frei, 'Vorbedingung: der Umschalter der Leiste ist frei').toBe(true);
        await page.touchscreen.tap(/** @type {any} */ (u).x, /** @type {any} */ (u).y);
        await page.waitForTimeout(450);
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
        await page.waitForTimeout(450);
        const offen = await page.evaluate(() => !!document.querySelector('.app-header.nav-open'));
        if (offen) {
            const u2 = await mitteFrei(page, '.mobile-nav-toggle');
            await page.touchscreen.tap(/** @type {any} */ (u2).x, /** @type {any} */ (u2).y);
            await page.waitForTimeout(450);
        }
        return;
    }
    const reiter = page.locator(reiterSel);
    if (!(await reiter.isVisible())) {
        await page.locator('.nav-group', { has: reiter }).locator('.nav-group-btn').click();
        await page.waitForTimeout(150);
    }
    await reiter.click();
    await expect(page.locator(`#view-${ansicht}`)).toHaveClass(/\bactive\b/);
    await page.waitForTimeout(300);
}

/**
 * Strg+Z — breit per Taste, am Telefon per Tap auf ↩️ im Kopf.
 * @param {import('@playwright/test').Page} page
 */
async function rueckgaengig(page) {
    if (await istMobil(page)) {
        // Der Knopf in der Kopfzeile selbst — das ⋯-Menue baut seine Eintraege bei jedem
        // Oeffnen aus der Desktop-Leiste und fuehrt danach ein zweites [data-action="undo"].
        await bediene(
            page,
            '.mobile-header .mobile-header-group > [data-action="undo"]',
            '↩️ im Telefonkopf'
        );
    } else {
        await page.keyboard.press('Control+z');
        await page.waitForTimeout(SETZEN_MS);
    }
}

/**
 * Strg+Y — breit per Taste, am Telefon per Tap auf ⋯ und dann ↪️.
 * @param {import('@playwright/test').Page} page
 */
async function wiederholen(page) {
    if (await istMobil(page)) {
        await bediene(page, '#mobile-header-menu-btn', '⋯ im Telefonkopf');
        await bediene(page, '#mobile-header-menu [data-action="redo"]', '↪️ im ⋯-Menue');
    } else {
        await page.keyboard.press('Control+y');
        await page.waitForTimeout(SETZEN_MS);
    }
}

/**
 * Bestiar-Suchfeld anklicken bzw. antippen und tippen (BESTIAR-KLICK R1: der
 * erste Klick danach wirkt, kein Enter noetig).
 * @param {import('@playwright/test').Page} page @param {string} begriff
 */
async function suchen(page, begriff) {
    await bediene(page, '#bestiary-search', 'das Suchfeld des Bestiars');
    await page.keyboard.type(begriff, { delay: 40 });
    await page.waitForTimeout(SETZEN_MS);
}

/**
 * Eine eigene Kreatur ueber "+ Neue Kreatur" anlegen.
 * @param {import('@playwright/test').Page} page @param {string} name @param {string} typ
 */
async function anlegen(page, name, typ) {
    await bediene(page, '.bestiary-add-btn', '+ Neue Kreatur');
    await bediene(page, '#bst-name', 'das Namensfeld');
    await page.keyboard.type(name, { delay: 20 });
    await bediene(page, '#bst-type', 'das Typfeld');
    await page.keyboard.press('Control+a');
    await page.keyboard.type(typ, { delay: 20 });
    await bediene(page, '#bestiary-editor-modal [data-value="saveBestiary"]', 'Speichern');
}

/** @param {string} schluessel z. B. 'goblin:srd' oder '2:custom' */
function zeileSel(schluessel) {
    const [id, quelle] = schluessel.split(':');
    return `#bestiary-list .bestiary-list-item[data-id="${id}"][data-source="${quelle}"]`;
}
/** @param {string} schluessel */
function sternSel(schluessel) {
    const [id, quelle] = schluessel.split(':');
    return `#bestiary-list .bestiary-fav[data-id="${id}"][data-source="${quelle}"]`;
}

/**
 * Was der Spielleiter sieht und was in D steht. Nur Ablesen. Das Soll der
 * Filteroptionen wird aus dem Buendel gelesen (SRD plus D.bestiary), nicht
 * hier abgetippt.
 * @param {import('@playwright/test').Page} page
 * @param {string[]} [sterne] Schluessel der ★-Knoepfe, die gelesen werden
 */
function zustand(page, sterne = []) {
    return page.evaluate(schluessel => {
        const w = /** @type {any} */ (window);
        const c = /** @type {HTMLElement} */ (document.getElementById('bestiary-list'));
        const panel = /** @type {HTMLElement} */ (document.getElementById('bestiary-detail-panel'));
        const key = z => z.dataset.id + ':' + z.dataset.source;
        const zeilen = Array.from(c.querySelectorAll('.bestiary-list-item')).sort(
            (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top
        );
        const oben = c.getBoundingClientRect().top + c.clientTop;
        const unten = oben + c.clientHeight;
        /** @type {Record<string, any>} */
        const knoepfe = {};
        for (const k of schluessel) {
            const [id, quelle] = k.split(':');
            const b = c.querySelector(`.bestiary-fav[data-id="${id}"][data-source="${quelle}"]`);
            knoepfe[k] = b
                ? {
                      aktiv: b.classList.contains('active'),
                      aria: b.getAttribute('aria-pressed'),
                      zeichen: (b.firstChild && b.firstChild.nodeType === 3
                          ? b.firstChild.nodeValue || ''
                          : ''
                      ).trim()
                  }
                : null;
        }
        /** @type {Record<string, any>} */
        const zeileInfo = {};
        for (const z of zeilen) {
            const r = z.getBoundingClientRect();
            zeileInfo[key(z)] = {
                name: ((z.querySelector('.bestiary-name') || {}).textContent || '').trim(),
                markiert: z.classList.contains('selected'),
                sichtbar: r.top >= oben - 0.5 && r.bottom <= unten + 0.5
            };
        }
        const erste = zeilen.find(z => z.getBoundingClientRect().bottom > oben + 1);
        // Filteroptionen: Ist und Soll (SRD plus eigene, aus dem Buendel gelesen)
        const optionen = id =>
            Array.from(/** @type {HTMLSelectElement} */ (document.getElementById(id)).options)
                .map(o => o.value)
                .filter(v => v !== '')
                .sort();
        const alle = getSRDMonsters().concat(w.D.bestiary || []);
        const sollHg = Array.from(
            new Set(alle.filter(m => m.cr !== undefined && m.cr !== null).map(m => String(m.cr)))
        ).sort();
        const sollTyp = Array.from(new Set(alle.map(m => m.creatureType).filter(Boolean))).sort();
        // Detail
        const name = panel.querySelector('.bestiary-detail-name');
        const leer = panel.querySelector('.bestiary-detail-empty .bestiary-detail-empty-text');
        let detail = '?';
        if (name) detail = (name.textContent || '').trim();
        else if (leer) detail = 'LEER: ' + (leer.textContent || '').trim();
        // Ein Statblock-Feld, das NICHT der Name ist: die Trefferpunkte im Detail
        const tpZeile = Array.from(panel.querySelectorAll('.bestiary-statblock-basics p'))
            .map(p => (p.textContent || '').replace(/\s+/g, ' ').trim())
            .find(t => t.startsWith('Trefferpunkte'));
        // Fokus
        const a = /** @type {HTMLElement|null} */ (document.activeElement);
        const fz = a && a.closest ? a.closest('#bestiary-list .bestiary-list-item') : null;
        const ansicht = document.getElementById('view-bestiary');
        const layout = document.querySelector('#view-bestiary .bestiary-layout');
        return {
            D_fav: (w.D.bestiaryFavorites || []).slice(),
            D_namen: (w.D.bestiary || []).map(m => m.id + ':' + m.name),
            D_tp: (w.D.bestiary || []).map(m => m.id + ':' + m.hp),
            knoepfe,
            zeilen: zeilen.map(key),
            zeileInfo,
            ersteSichtbare: erste ? key(erste) : null,
            scrollTop: Math.round(c.scrollTop),
            zaehler: ((document.getElementById('bestiary-count') || {}).textContent || '').trim(),
            hg: { ist: optionen('bestiary-filter-cr'), soll: sollHg },
            typ: { ist: optionen('bestiary-filter-type'), soll: sollTyp },
            typWert: /** @type {HTMLSelectElement} */ (
                document.getElementById('bestiary-filter-type')
            ).value,
            gewaehlt: typeof selectedBestiaryId === 'undefined' ? 'fehlt' : selectedBestiaryId,
            detail,
            detailTP: tpZeile || null,
            detailKnoepfe: Array.from(panel.querySelectorAll('button[data-action]')).map(
                b => /** @type {HTMLElement} */ (b).dataset.action
            ),
            detailRollen: Math.round(panel.scrollTop),
            detailZeichnungen: w.__bestiarUndoDetailZeichnungen,
            layoutRollen: layout ? Math.round(layout.scrollTop) : null,
            fokus: {
                body: !a || a === document.body || a === document.documentElement,
                beschreibung: a
                    ? a.tagName +
                      (a.id ? '#' + a.id : '') +
                      (a.dataset && a.dataset.action
                          ? '[' + a.dataset.action + (a.dataset.id ? ':' + a.dataset.id : '') + ']'
                          : '')
                    : 'nichts',
                aktion: a && a.dataset ? a.dataset.action || null : null,
                wert: a && a.dataset ? a.dataset.value || null : null,
                id: a ? a.id || null : null,
                zeile: fz ? key(fz) : null,
                imDetail: !!a && panel.contains(a),
                inAnsicht: !!a && !!ansicht && ansicht.contains(a)
            }
        };
    }, sterne);
}

/**
 * Der erste Treffer der UNGEFILTERTEN Liste, wie renderBestiaryList sortiert
 * (HG, dann Name) — aus dem Buendel gelesen.
 * @param {import('@playwright/test').Page} page
 */
function ersterTrefferUngefiltert(page) {
    return page.evaluate(() => {
        const w = /** @type {any} */ (window);
        const alle = getSRDMonsters()
            .map(m => Object.assign({}, m, { source: 'srd' }))
            .concat((w.D.bestiary || []).map(m => Object.assign({}, m, { source: 'custom' })));
        alle.sort(
            (a, b) =>
                crToSortValue(a.cr) - crToSortValue(b.cr) ||
                (a.name || '').localeCompare(b.name || '')
        );
        const m = alle[0];
        return (m.source === 'custom' ? m.id : m._id) + ':' + m.source;
    });
}

/**
 * Der Rahmen jedes Falls: kein pageerror, kein console.error, keine Meldung
 * "nicht gefunden" (aus dem Ereignisprotokoll gelesen, getCombatLog), und als
 * Dialog hoechstens die erwarteten confirm des Loeschens.
 * @param {import('@playwright/test').Page} page
 * @param {{fehler: string[], dialoge: string[]}} f
 * @param {RegExp[]} [erwarteteDialoge]
 */
async function rahmen(page, f, erwarteteDialoge = []) {
    const meldungen = await page.evaluate(() =>
        (typeof window.getCombatLog === 'function' ? window.getCombatLog() : []).map(
            /** @param {any} e */ e => String(e.text)
        )
    );
    weich(
        meldungen.filter(t => /nicht gefunden/i.test(t)),
        'keine Meldung "nicht gefunden"'
    ).toEqual([]);
    weich(f.fehler, 'kein pageerror, kein console.error').toEqual([]);
    weich(f.dialoge.length, `Dialoge: ${JSON.stringify(f.dialoge)}`).toBe(erwarteteDialoge.length);
    erwarteteDialoge.forEach((muster, i) =>
        weich(f.dialoge[i] || '', `Dialog ${i + 1}`).toMatch(muster)
    );
}

/**
 * ★ eines Eintrags passt zu D (R1): Zeichen, Klasse active, aria-pressed.
 * @param {Awaited<ReturnType<typeof zustand>>} z @param {string} k @param {string} wann
 */
function sternPasst(z, k, wann) {
    const schluessel = k.endsWith(':custom') ? 'custom:' + k.split(':')[0] : k.split(':')[0];
    const fav = z.D_fav.includes(schluessel);
    const kn = z.knoepfe[k];
    weich(kn, `${wann}: der ★ von ${k} ist gezeichnet`).not.toBeNull();
    if (!kn) return;
    weich(kn.zeichen, `${wann}: Zeichen von ${k} passt zu D (Favorit: ${fav})`).toBe(
        fav ? '★' : '☆'
    );
    weich(kn.aktiv, `${wann}: Klasse active von ${k} passt zu D`).toBe(fav);
    weich(kn.aria, `${wann}: aria-pressed von ${k} passt zu D`).toBe(String(fav));
}

/**
 * Das Detail steht leer (R3): Text, keine Knoepfe, Auswahl zurueckgesetzt.
 * @param {Awaited<ReturnType<typeof zustand>>} z @param {string} wann
 */
function detailLeer(z, wann) {
    weich(z.detail, `${wann}: das Detail zeigt den leeren Zustand`).toBe('LEER: ' + LEER_TEXT);
    weich(z.detailKnoepfe, `${wann}: keine Knoepfe fuer eine nicht vorhandene Kreatur`).toEqual([]);
    weich(z.gewaehlt, `${wann}: die Auswahl ist zurueckgesetzt`).toBeNull();
}

/**
 * Unveraenderte Kreatur → das Detail wird NICHT neu gezeichnet (R3), gelesen am
 * Beobachter aus laden(). Dazu der Name: dieselbe Kreatur steht noch da.
 * @param {Awaited<ReturnType<typeof zustand>>} vor @param {Awaited<ReturnType<typeof zustand>>} nach
 * @param {string} wann
 */
function detailUnberuehrt(vor, nach, wann) {
    weich(
        nach.detailZeichnungen - vor.detailZeichnungen,
        `${wann}: das Detail der unveraenderten Kreatur wird nicht neu gezeichnet`
    ).toBe(0);
    weich(nach.detail, `${wann}: das Detail zeigt weiter dieselbe Kreatur`).toBe(vor.detail);
}

/**
 * Filteroptionen = vorhandene Kreaturen, Zaehler = SRD plus eigene (R1).
 * @param {Awaited<ReturnType<typeof zustand>>} z @param {number} zaehler @param {string} wann
 */
function kopfPasst(z, zaehler, wann) {
    weich(z.zaehler, `${wann}: #bestiary-count = SRD plus eigene`).toBe(String(zaehler));
    weich(z.typ.ist, `${wann}: die Typ-Optionen entsprechen den vorhandenen Kreaturen`).toEqual(
        z.typ.soll
    );
    weich(z.hg.ist, `${wann}: die HG-Optionen entsprechen den vorhandenen Kreaturen`).toEqual(
        z.hg.soll
    );
}

// ───────────────────────────────────────────────────────────────────────────
// (W1) ★ — breit (dev, prod) und Telefon (dev, prod)
// ───────────────────────────────────────────────────────────────────────────

for (const [geraet, groesse] of /** @type {const} */ ([
    ['breit', BREIT],
    ['Telefon', TELEFON]
])) {
    test.describe(`(W1) ★ nach Strg+Z/Strg+Y — ${geraet}`, () => {
        test.use(
            geraet === 'Telefon'
                ? { viewport: groesse, isMobile: true, hasTouch: true }
                : { viewport: groesse }
        );
        for (const [buendel, url] of BUENDEL) {
            test(`(W1) "gob", ★ Goblin, Strg+Z, Strg+Y, Strg+Z, Klick auf den ☆ — ${geraet}, ${buendel}`, async ({
                page
            }) => {
                test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
                const f = await laden(page, url);
                expect(await istMobil(page), 'Vorbedingung: Layout passt zum Geraet').toBe(
                    geraet === 'Telefon'
                );
                await zurAnsicht(page, 'bestiary');
                await suchen(page, 'gob');
                await bediene(page, sternSel(GOB), '★ Goblin');
                const z1 = await zustand(page, [GOB]);
                expect(z1.D_fav, 'Vorbedingung: der Goblin ist Favorit').toContain('goblin');
                sternPasst(z1, GOB, 'nach ★');

                await rueckgaengig(page);
                const z2 = await zustand(page, [GOB]);
                expect(z2.D_fav, 'Vorbedingung: Strg+Z nimmt den Favoriten in D zurueck').toEqual([
                    'adler',
                    'kraken'
                ]);
                sternPasst(z2, GOB, 'nach Strg+Z');

                await wiederholen(page);
                const z3 = await zustand(page, [GOB]);
                expect(z3.D_fav, 'Vorbedingung: Strg+Y stellt ihn in D wieder her').toContain(
                    'goblin'
                );
                sternPasst(z3, GOB, 'nach Strg+Y');

                await rueckgaengig(page);
                const z4 = await zustand(page, [GOB]);
                sternPasst(z4, GOB, 'nach dem zweiten Strg+Z');

                // Der Klick tut, was die Anzeige verspricht: ☆ verspricht "hinzufuegen".
                const versprochen = z4.knoepfe[GOB] ? z4.knoepfe[GOB].zeichen : '?';
                await bediene(page, sternSel(GOB), 'der ★ des Goblin nach Strg+Z');
                const z5 = await zustand(page, [GOB]);
                weich(
                    z5.D_fav.includes('goblin'),
                    `der Klick tut, was die Anzeige versprach (${versprochen})`
                ).toBe(versprochen === '☆');
                weich(z5.D_fav, 'nach dem Klick ist der Goblin Favorit').toContain('goblin');
                sternPasst(z5, GOB, 'nach dem Klick');
                await rahmen(page, f);
            });
        }
    });
}

// ───────────────────────────────────────────────────────────────────────────
// Breit: (W2) bis (W11)
// ───────────────────────────────────────────────────────────────────────────

test.describe('BESTIAR-UNDO breit 1440x900', () => {
    test.use({ viewport: BREIT });

    for (const [buendel, url] of BUENDEL) {
        test(`(W2) Filter "Favoriten", ★ Adler weg, Strg+Z, Strg+Y — ${buendel}`, async ({
            page
        }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const f = await laden(page, url);
            await zurAnsicht(page, 'bestiary');
            await bediene(page, '#bestiary-filter-favs', 'das Kaestchen "Favoriten"');
            const z0 = await zustand(page);
            expect(z0.zeilen.slice().sort(), 'Vorbedingung: Adler und Kraken').toEqual([
                'adler:srd',
                'kraken:srd'
            ]);
            await bediene(page, sternSel('adler:srd'), '★ Adler');
            const z1 = await zustand(page);
            expect(z1.zeilen, 'Vorbedingung: der Adler faellt aus dem Filter').toEqual([
                'kraken:srd'
            ]);

            await rueckgaengig(page);
            const z2 = await zustand(page, ['adler:srd', 'kraken:srd']);
            expect(z2.D_fav, 'Vorbedingung: Strg+Z holt den Adler in D zurueck').toEqual([
                'adler',
                'kraken'
            ]);
            weich(
                z2.zeilen.slice().sort(),
                'nach Strg+Z zeigt der Favoritenfilter Adler und Kraken'
            ).toEqual(['adler:srd', 'kraken:srd']);
            sternPasst(z2, 'adler:srd', 'nach Strg+Z');

            await wiederholen(page);
            const z3 = await zustand(page, ['kraken:srd']);
            weich(z3.zeilen, 'nach Strg+Y nur der Kraken').toEqual(['kraken:srd']);
            sternPasst(z3, 'kraken:srd', 'nach Strg+Y');
            await rahmen(page, f);
        });

        test(`(W3) Probewesen anlegen, waehlen, Strg+Z, Strg+Y — ${buendel}`, async ({ page }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const f = await laden(page, url);
            await zurAnsicht(page, 'bestiary');
            await suchen(page, 'wesen');
            await anlegen(page, 'Probewesen', 'Probetyp');
            await bediene(page, zeileSel(PROBE) + ' .bestiary-name', 'die Zeile Probewesen');
            const z0 = await zustand(page);
            expect(z0.D_namen, 'Vorbedingung: Probewesen ist angelegt').toEqual([
                '1:Altwesen',
                '2:Probewesen'
            ]);
            expect(z0.gewaehlt, 'Vorbedingung: Probewesen ist gewaehlt').toBe('2');
            expect(z0.detail, 'Vorbedingung: das Detail zeigt es').toBe('Probewesen');
            expect(z0.fokus.zeile, 'Vorbedingung: der Fokus liegt in seiner Zeile').toBe(PROBE);
            kopfPasst(z0, ZAEHLER_SAAT + 1, 'nach dem Anlegen');

            await rueckgaengig(page);
            const z1 = await zustand(page);
            expect(z1.D_namen, 'Vorbedingung: Strg+Z nimmt das Anlegen in D zurueck').toEqual([
                '1:Altwesen'
            ]);
            weich(z1.zeilen, 'nach Strg+Z ist die Zeile Probewesen weg').not.toContain(PROBE);
            weich(z1.zeilen, 'Altwesen steht weiter da').toContain(ALT);
            kopfPasst(z1, ZAEHLER_SAAT, 'nach Strg+Z');
            weich(z1.typ.ist, 'nach Strg+Z kein "Probetyp" im Typ-Filter').not.toContain(
                'Probetyp'
            );
            detailLeer(z1, 'nach Strg+Z');
            weich(z1.fokus.body, `nach Strg+Z nicht auf BODY (${z1.fokus.beschreibung})`).toBe(
                false
            );
            // R4, Entscheidung des Nutzers: die fokussierte Zeile ist weg — der Fokus
            // darf auf keiner FREMDEN Zeile landen (die Nachbarzeile gleichen Index ist
            // ein fremdes Monster, dasselbe Bild wie BESTIAR-KLICK B). Wohin genau, legt
            // dieser Fall nicht fest; er bleibt in der Bestiar-Ansicht.
            weich(
                [null, PROBE],
                `nach Strg+Z nicht auf einer fremden Zeile (${z1.fokus.beschreibung})`
            ).toContain(z1.fokus.zeile);
            weich(z1.fokus.inAnsicht, 'der Fokus bleibt in der Bestiar-Ansicht').toBe(true);

            await wiederholen(page);
            const z2 = await zustand(page);
            weich(z2.zeilen, 'nach Strg+Y ist die Zeile zurueck').toContain(PROBE);
            kopfPasst(z2, ZAEHLER_SAAT + 1, 'nach Strg+Y');
            weich(z2.typ.ist, 'nach Strg+Y steht "Probetyp" wieder im Typ-Filter').toContain(
                'Probetyp'
            );
            weich(z2.fokus.body, `nach Strg+Y nicht auf BODY (${z2.fokus.beschreibung})`).toBe(
                false
            );
            weich(
                [null, PROBE],
                `nach Strg+Y nicht auf einer fremden Zeile (${z2.fokus.beschreibung})`
            ).toContain(z2.fokus.zeile);
            await rahmen(page, f);
        });

        // R4 "Auf ★ oder einer Zeile, die BLEIBT: er bleibt dort" — auch wenn eine Zeile
        // DARUEBER wegfaellt. (W3) prueft nur die verschwundene Zeile, (W1)/(W8) nur einen
        // unveraenderten Index. Die Tastaturgruppe allein haelt den Index und gaebe den Fokus
        // der Zeile, die jetzt an dieser Stelle steht — einem fremden Monster. An Quelltextkopien
        // gemessen (dev): gibt renderBestiaryAnsicht() den Fokus nur zurueck, wenn die Zeile
        // verschwand, bleiben alle 16 anderen Faelle gruen und dieser wird rot (nach Strg+Z
        // auf gruene-vettel statt auf Altwesen); ebenso die Rueckgabe per Index.
        test(`(W3b) Aawesen ueber Altwesen anlegen, Zeile Altwesen fokussiert, Strg+Z, Strg+Y: der Fokus bleibt bei Altwesen — ${buendel}`, async ({
            page
        }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const f = await laden(page, url);
            await zurAnsicht(page, 'bestiary');
            await suchen(page, 'wesen');
            await anlegen(page, 'Aawesen', 'Probetyp');
            await bediene(page, zeileSel(ALT) + ' .bestiary-name', 'die Zeile Altwesen');
            const z0 = await zustand(page);
            expect(z0.D_namen, 'Vorbedingung: Aawesen ist angelegt').toEqual([
                '1:Altwesen',
                '2:Aawesen'
            ]);
            expect(
                z0.fokus.zeile === ALT && z0.fokus.aktion === 'bestiary-select',
                `Vorbedingung: der Fokus liegt auf der Zeile Altwesen (${z0.fokus.beschreibung})`
            ).toBe(true);
            const stelle = z0.zeilen.indexOf(ALT);
            const ueber = z0.zeilen.indexOf(PROBE);
            expect(ueber, 'Vorbedingung: Aawesen ist gelistet').toBeGreaterThanOrEqual(0);
            expect(ueber, 'Vorbedingung: Aawesen steht UEBER Altwesen').toBeLessThan(stelle);
            const nachbar = z0.zeilen[stelle + 1];
            expect(nachbar, 'Vorbedingung: unter Altwesen steht eine weitere Zeile').toBeTruthy();

            await rueckgaengig(page);
            const z1 = await zustand(page);
            expect(z1.D_namen, 'Vorbedingung: Strg+Z nimmt Aawesen in D zurueck').toEqual([
                '1:Altwesen'
            ]);
            weich(z1.zeilen, 'nach Strg+Z ist die Zeile Aawesen weg').not.toContain(PROBE);
            weich(
                z1.fokus.zeile,
                `nach Strg+Z bleibt der Fokus bei Altwesen, nicht bei ${nachbar} (${z1.fokus.beschreibung})`
            ).toBe(ALT);
            weich(z1.fokus.aktion, 'auf der Zeile selbst').toBe('bestiary-select');
            detailUnberuehrt(z0, z1, 'nach Strg+Z');

            await wiederholen(page);
            const z2 = await zustand(page);
            weich(z2.zeilen, 'nach Strg+Y ist die Zeile Aawesen zurueck').toContain(PROBE);
            weich(
                z2.fokus.zeile,
                `nach Strg+Y bleibt der Fokus bei Altwesen (${z2.fokus.beschreibung})`
            ).toBe(ALT);
            weich(z2.fokus.aktion, 'auf der Zeile selbst').toBe('bestiary-select');
            detailUnberuehrt(z1, z2, 'nach Strg+Y');
            await rahmen(page, f);
        });

        test(`(W4) wie (W3), Strg+Z aber in der Party, zurueck zum Bestiar — ${buendel}`, async ({
            page
        }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const f = await laden(page, url);
            await zurAnsicht(page, 'bestiary');
            await suchen(page, 'wesen');
            await anlegen(page, 'Probewesen', 'Probetyp');
            await bediene(page, zeileSel(PROBE) + ' .bestiary-name', 'die Zeile Probewesen');
            const z0 = await zustand(page);
            expect(z0.detail, 'Vorbedingung: das Detail zeigt Probewesen').toBe('Probewesen');

            await zurAnsicht(page, 'party');
            await rueckgaengig(page);
            await zurAnsicht(page, 'bestiary');
            const z1 = await zustand(page);
            expect(z1.D_namen, 'Vorbedingung: Strg+Z nahm das Anlegen in D zurueck').toEqual([
                '1:Altwesen'
            ]);
            weich(z1.zeilen, 'zurueck im Bestiar: die Zeile Probewesen ist weg').not.toContain(
                PROBE
            );
            kopfPasst(z1, ZAEHLER_SAAT, 'zurueck im Bestiar');
            detailLeer(z1, 'zurueck im Bestiar');
            await rahmen(page, f);
        });

        test(`(W5) Altwesen im Detail loeschen, Strg+Z, Strg+Y — ${buendel}`, async ({ page }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const f = await laden(page, url);
            await zurAnsicht(page, 'bestiary');
            await suchen(page, 'wesen');
            await bediene(page, zeileSel(ALT) + ' .bestiary-name', 'die Zeile Altwesen');
            const z0 = await zustand(page);
            expect(z0.detail, 'Vorbedingung: das Detail zeigt Altwesen').toBe('Altwesen');

            await bediene(
                page,
                '#bestiary-detail-panel [data-action="bestiary-delete"]',
                'Loeschen im Detail'
            );
            const z1 = await zustand(page);
            expect(z1.D_namen, 'Vorbedingung: Altwesen ist geloescht').toEqual([]);
            weich(z1.zeilen, 'nach dem Loeschen ist die Zeile weg').not.toContain(ALT);
            kopfPasst(z1, ZAEHLER_SAAT - 1, 'nach dem Loeschen');
            detailLeer(z1, 'nach dem Loeschen (Entscheidung (c))');
            weich(
                z1.fokus.id,
                `nach dem Loeschen geht der Fokus ins Suchfeld (${z1.fokus.beschreibung})`
            ).toBe('bestiary-search');

            await rueckgaengig(page);
            const z2 = await zustand(page);
            expect(z2.D_namen, 'Vorbedingung: Strg+Z holt Altwesen in D zurueck').toEqual([
                '1:Altwesen'
            ]);
            weich(z2.zeilen, 'nach Strg+Z ist die Zeile Altwesen zurueck').toContain(ALT);
            kopfPasst(z2, ZAEHLER_SAAT, 'nach Strg+Z');
            detailLeer(z2, 'nach Strg+Z (waehlt nicht wieder aus)');
            weich(z2.fokus.body, `nach Strg+Z nicht auf BODY (${z2.fokus.beschreibung})`).toBe(
                false
            );

            await wiederholen(page);
            const z3 = await zustand(page);
            weich(z3.zeilen, 'nach Strg+Y ist die Zeile wieder weg').not.toContain(ALT);
            kopfPasst(z3, ZAEHLER_SAAT - 1, 'nach Strg+Y');
            detailLeer(z3, 'nach Strg+Y');
            await rahmen(page, f, [/^confirm: .*Altwesen/]);
        });

        test(`(W6) Bearbeiten → Neuwesen → Speichern, Strg+Z, Strg+Y — ${buendel}`, async ({
            page
        }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const f = await laden(page, url);
            await zurAnsicht(page, 'bestiary');
            await suchen(page, 'wesen');
            await bediene(page, zeileSel(ALT) + ' .bestiary-name', 'die Zeile Altwesen');
            await bediene(
                page,
                '#bestiary-detail-panel [data-action="call"][data-value="openBestiaryEditor"]',
                'Bearbeiten'
            );
            await bediene(page, '#bst-name', 'das Namensfeld');
            await page.keyboard.press('Control+a');
            await page.keyboard.type('Neuwesen', { delay: 20 });
            await bediene(page, '#bestiary-editor-modal [data-value="saveBestiary"]', 'Speichern');

            /** @param {Awaited<ReturnType<typeof zustand>>} z @param {string} soll @param {string} wann */
            const pruefe = (z, soll, wann) => {
                weich(
                    z.zeileInfo[ALT] ? z.zeileInfo[ALT].name : null,
                    `${wann}: der Listenname`
                ).toBe(soll);
                weich(z.detail, `${wann}: der Name im Detail`).toBe(soll);
                weich(
                    z.fokus.imDetail &&
                        z.fokus.aktion === 'call' &&
                        z.fokus.wert === 'openBestiaryEditor',
                    `${wann}: der Fokus liegt auf "Bearbeiten" (${z.fokus.beschreibung})`
                ).toBe(true);
            };
            const z1 = await zustand(page);
            expect(z1.D_namen, 'Vorbedingung: gespeichert').toEqual(['1:Neuwesen']);
            pruefe(z1, 'Neuwesen', 'nach dem Speichern (Entscheidung (c))');

            await rueckgaengig(page);
            const z2 = await zustand(page);
            expect(z2.D_namen, 'Vorbedingung: Strg+Z nimmt den Namen in D zurueck').toEqual([
                '1:Altwesen'
            ]);
            pruefe(z2, 'Altwesen', 'nach Strg+Z');

            await wiederholen(page);
            const z3 = await zustand(page);
            pruefe(z3, 'Neuwesen', 'nach Strg+Y');
            await rahmen(page, f);
        });

        // R3 "geaendert → im Stand von D neu gezeichnet" gilt fuer JEDES Feld, nicht nur den
        // Namen. (W6) aendert nur den Namen; eine Aenderungspruefung, die nur den Namen
        // vergleicht, liess alle 14 Faelle davor gruen und zeigte nach dem Speichern und nach
        // Strg+Y die alten Trefferpunkte (an einer Quelltextkopie gemessen, dev: nur dieser Fall rot).
        test(`(W6b) Bearbeiten → nur TP 10 → 77 → Speichern, Strg+Z, Strg+Y — ${buendel}`, async ({
            page
        }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const f = await laden(page, url);
            await zurAnsicht(page, 'bestiary');
            await suchen(page, 'wesen');
            await bediene(page, zeileSel(ALT) + ' .bestiary-name', 'die Zeile Altwesen');
            const z0 = await zustand(page);
            expect(z0.detailTP, 'Vorbedingung: das Detail zeigt 10 TP').toBe('Trefferpunkte 10');
            await bediene(
                page,
                '#bestiary-detail-panel [data-action="call"][data-value="openBestiaryEditor"]',
                'Bearbeiten'
            );
            await bediene(page, '#bst-hp', 'das TP-Feld');
            await page.keyboard.press('Control+a');
            await page.keyboard.type('77', { delay: 20 });
            await bediene(page, '#bestiary-editor-modal [data-value="saveBestiary"]', 'Speichern');

            /** @param {Awaited<ReturnType<typeof zustand>>} z @param {number} soll @param {string} wann */
            const pruefe = (z, soll, wann) => {
                weich(z.detailTP, `${wann}: das Detail zeigt die TP aus D`).toBe(
                    `Trefferpunkte ${soll}`
                );
                weich(z.detail, `${wann}: der Name im Detail bleibt`).toBe('Altwesen');
                weich(
                    z.fokus.imDetail &&
                        z.fokus.aktion === 'call' &&
                        z.fokus.wert === 'openBestiaryEditor',
                    `${wann}: der Fokus liegt auf "Bearbeiten" (${z.fokus.beschreibung})`
                ).toBe(true);
            };
            const z1 = await zustand(page);
            expect(z1.D_tp, 'Vorbedingung: gespeichert, nur die TP geaendert').toEqual(['1:77']);
            expect(z1.D_namen, 'Vorbedingung: der Name ist unveraendert').toEqual(['1:Altwesen']);
            pruefe(z1, 77, 'nach dem Speichern (Entscheidung (c))');

            await rueckgaengig(page);
            const z2 = await zustand(page);
            expect(z2.D_tp, 'Vorbedingung: Strg+Z nimmt die TP in D zurueck').toEqual(['1:10']);
            pruefe(z2, 10, 'nach Strg+Z');

            await wiederholen(page);
            const z3 = await zustand(page);
            expect(z3.D_tp, 'Vorbedingung: Strg+Y stellt sie in D wieder her').toEqual(['1:77']);
            pruefe(z3, 77, 'nach Strg+Y');
            await rahmen(page, f);
        });

        test(`(W7) Goblin waehlen, ★, Tab auf "Zur Initiative", Strg+Z — ${buendel}`, async ({
            page
        }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const f = await laden(page, url);
            await zurAnsicht(page, 'bestiary');
            await suchen(page, 'gob');
            await bediene(page, zeileSel(GOB) + ' .bestiary-name', 'die Zeile Goblin');
            await bediene(page, sternSel(GOB), '★ Goblin');
            // Fokus per Tastatur ins Detail: Klick auf den Namen (kein Bedienelement), Tab.
            await bediene(page, '#bestiary-detail-panel .bestiary-detail-name', 'der Detailname');
            await page.keyboard.press('Tab');
            await page.waitForTimeout(SETZEN_MS);
            const z0 = await zustand(page, [GOB]);
            expect(
                z0.fokus.imDetail && z0.fokus.aktion === 'bestiary-add-init',
                `Vorbedingung: der Fokus liegt auf "Zur Initiative" (${z0.fokus.beschreibung})`
            ).toBe(true);
            expect(z0.D_fav, 'Vorbedingung: der Goblin ist Favorit').toContain('goblin');

            await rueckgaengig(page);
            const z1 = await zustand(page, [GOB]);
            expect(z1.D_fav, 'Vorbedingung: Strg+Z nimmt den Favoriten zurueck').toEqual([
                'adler',
                'kraken'
            ]);
            weich(
                z1.fokus.imDetail && z1.fokus.aktion === 'bestiary-add-init',
                `nach Strg+Z liegt der Fokus weiter auf "Zur Initiative" (${z1.fokus.beschreibung})`
            ).toBe(true);
            weich(z1.detail, 'das Detail zeigt weiter den Goblin').toBe('Goblin');
            detailUnberuehrt(z0, z1, 'nach Strg+Z');
            sternPasst(z1, GOB, 'nach Strg+Z');
            await rahmen(page, f);
        });

        test(`(W8) gerollt, Goblin waehlen, ★, Strg+Z, Strg+Y: die Lage bleibt — ${buendel}`, async ({
            page
        }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const f = await laden(page, url);
            await zurAnsicht(page, 'bestiary');
            const kasten = /** @type {{x: number, y: number, width: number, height: number}} */ (
                await page.locator('#bestiary-list').boundingBox()
            );
            await page.mouse.move(kasten.x + kasten.width / 2, kasten.y + kasten.height / 2);
            // Per Rad, bis der Goblin mit Abstand zu beiden Raendern im Bild steht.
            for (let i = 0; i < 60; i++) {
                const gb = (await page.locator(zeileSel(GOB)).count())
                    ? await page.locator(zeileSel(GOB)).boundingBox()
                    : null;
                if (
                    gb &&
                    gb.y > kasten.y + 60 &&
                    gb.y + gb.height < kasten.y + kasten.height - 60
                ) {
                    break;
                }
                await page.mouse.wheel(0, 60);
                await page.waitForTimeout(100);
            }
            await page.waitForTimeout(300);
            await bediene(page, zeileSel(GOB) + ' .bestiary-name', 'die Zeile Goblin');
            await bediene(page, sternSel(GOB), '★ Goblin');
            const z0 = await zustand(page, [GOB]);
            expect(z0.scrollTop, 'Vorbedingung: die Liste ist gerollt').toBeGreaterThan(0);
            expect(z0.zeileInfo[GOB], 'Vorbedingung: der Goblin ist gezeichnet').toBeTruthy();
            expect(z0.zeileInfo[GOB].sichtbar, 'Vorbedingung: und sichtbar').toBe(true);
            expect(z0.gewaehlt, 'Vorbedingung: und gewaehlt').toBe('goblin');
            expect(z0.fokus.aktion, 'Vorbedingung: der Fokus liegt auf dem ★').toBe(
                'bestiary-toggle-fav'
            );

            let vor = z0;
            for (const [schritt, tun] of /** @type {const} */ ([
                ['Strg+Z', rueckgaengig],
                ['Strg+Y', wiederholen]
            ])) {
                await tun(page);
                const z = await zustand(page, [GOB]);
                detailUnberuehrt(vor, z, schritt);
                vor = z;
                weich(z.scrollTop, `${schritt}: scrollTop bleibt (BESTIAR-KLICK R3)`).toBe(
                    z0.scrollTop
                );
                const g = z.zeileInfo[GOB];
                weich(!!g, `${schritt}: der Goblin bleibt gezeichnet`).toBe(true);
                weich(!!g && g.sichtbar, `${schritt}: und voll sichtbar`).toBe(true);
                weich(!!g && g.markiert, `${schritt}: und .selected`).toBe(true);
                weich(z.gewaehlt, `${schritt}: gewaehlt bleibt der Goblin`).toBe('goblin');
                weich(
                    z.fokus.zeile === GOB && z.fokus.aktion === 'bestiary-toggle-fav',
                    `${schritt}: der Fokus bleibt auf dem ★ des Goblin (${z.fokus.beschreibung})`
                ).toBe(true);
                sternPasst(z, GOB, schritt);
            }
            await rahmen(page, f);
        });

        test(`(W9) Drache waehlen, Detail per Rad gerollt, ★, Strg+Z: das Detail bleibt — ${buendel}`, async ({
            page
        }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const f = await laden(page, url);
            await zurAnsicht(page, 'bestiary');
            await suchen(page, 'drache');
            const z0 = await zustand(page);
            const erster = /** @type {string} */ (z0.zeilen[0]);
            expect(erster, 'Vorbedingung: ein Drache ist ein Treffer').toBeTruthy();
            await bediene(page, zeileSel(erster) + ' .bestiary-name', `die Zeile ${erster}`);
            const name = (await zustand(page)).detail;
            const kasten = /** @type {{x: number, y: number, width: number, height: number}} */ (
                await page.locator('#bestiary-detail-panel').boundingBox()
            );
            await page.mouse.move(kasten.x + kasten.width / 2, kasten.y + kasten.height / 2);
            for (let i = 0; i < 6; i++) {
                await page.mouse.wheel(0, 150);
                await page.waitForTimeout(80);
            }
            await page.waitForTimeout(300);
            await bediene(page, sternSel(erster), `★ ${erster}`);
            const z1 = await zustand(page, [erster]);
            expect(z1.detailRollen, 'Vorbedingung: das Detail ist gerollt').toBeGreaterThan(0);

            await rueckgaengig(page);
            const z2 = await zustand(page, [erster]);
            weich(z2.detailRollen, 'nach Strg+Z bleibt die Rolllage des Details').toBe(
                z1.detailRollen
            );
            weich(z2.detail, 'das Detail zeigt dieselbe Kreatur').toBe(name);
            detailUnberuehrt(z1, z2, 'nach Strg+Z');
            weich(
                z2.fokus.zeile === erster && z2.fokus.aktion === 'bestiary-toggle-fav',
                `der Fokus bleibt auf dem ★ (${z2.fokus.beschreibung})`
            ).toBe(true);
            await rahmen(page, f);
        });

        // (W9) haelt die Rolllage der UNVERAENDERTEN Kreatur (kein Neuzeichnen). Hier die
        // GEAENDERTE: das Detail wird neu geschrieben, und die Rolllage bleibt — ueber den
        // Vertrag hinaus (R3 sagt dazu nichts), aber gebaut und im Katalog als Fix-Eigenschaft
        // genannt. An Quelltextkopien gemessen (dev): ohne die Rueckgabe der Rolllage in
        // renderBestiaryAnsicht() GRUEN — Chromium haelt scrollTop beim Austausch gleich hohen
        // Inhalts selbst; mit "scrollTop = 0" statt der Rueckgabe ROT (462 → 0). Der Fall haelt
        // also das Verhalten, nicht die eine Zeile. Altwesen bekommt dafuer in der Saat dreissig
        // Zeilen Aktionen — sonst rollt sein Detail bei 1440x900 nicht.
        test(`(W9b) Altwesen bearbeitet, Detail per Rad gerollt, Strg+Z, Strg+Y: neu gezeichnet, die Rolllage bleibt — ${buendel}`, async ({
            page
        }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const s = saat();
            s.bestiary = [
                Object.assign({}, s.bestiary[0], {
                    actions: Array.from(
                        { length: 30 },
                        (_, i) =>
                            `<p>Probeaktion ${i + 1}: eine Zeile, die das Detail verlaengert.</p>`
                    ).join('')
                })
            ];
            const f = await laden(page, url, s);
            await zurAnsicht(page, 'bestiary');
            await suchen(page, 'wesen');
            await bediene(page, zeileSel(ALT) + ' .bestiary-name', 'die Zeile Altwesen');
            await bediene(
                page,
                '#bestiary-detail-panel [data-action="call"][data-value="openBestiaryEditor"]',
                'Bearbeiten'
            );
            await bediene(page, '#bst-hp', 'das TP-Feld');
            await page.keyboard.press('Control+a');
            await page.keyboard.type('77', { delay: 20 });
            await bediene(page, '#bestiary-editor-modal [data-value="saveBestiary"]', 'Speichern');
            const kasten = /** @type {{x: number, y: number, width: number, height: number}} */ (
                await page.locator('#bestiary-detail-panel').boundingBox()
            );
            await page.mouse.move(kasten.x + kasten.width / 2, kasten.y + kasten.height / 2);
            for (let i = 0; i < 4; i++) {
                await page.mouse.wheel(0, 150);
                await page.waitForTimeout(80);
            }
            await page.waitForTimeout(300);
            const z0 = await zustand(page);
            expect(z0.D_tp, 'Vorbedingung: gespeichert').toEqual(['1:77']);
            expect(z0.detailRollen, 'Vorbedingung: das Detail ist gerollt').toBeGreaterThan(0);
            weich(z0.detailTP, 'nach dem Speichern zeigt das Detail 77 (Entscheidung (c))').toBe(
                'Trefferpunkte 77'
            );

            let vor = z0;
            for (const [schritt, tun, tp] of /** @type {const} */ ([
                ['Strg+Z', rueckgaengig, 10],
                ['Strg+Y', wiederholen, 77]
            ])) {
                await tun(page);
                const z = await zustand(page);
                expect(z.D_tp, `Vorbedingung: ${schritt} setzt die TP in D auf ${tp}`).toEqual([
                    '1:' + tp
                ]);
                weich(z.detailTP, `${schritt}: das Detail zeigt die TP aus D`).toBe(
                    `Trefferpunkte ${tp}`
                );
                weich(
                    z.detailZeichnungen - vor.detailZeichnungen,
                    `${schritt}: die geaenderte Kreatur wird neu gezeichnet`
                ).toBeGreaterThan(0);
                weich(z.detailRollen, `${schritt}: die Rolllage des Details bleibt`).toBe(
                    z0.detailRollen
                );
                weich(
                    z.fokus.imDetail &&
                        z.fokus.aktion === 'call' &&
                        z.fokus.wert === 'openBestiaryEditor',
                    `${schritt}: der Fokus bleibt auf "Bearbeiten" (${z.fokus.beschreibung})`
                ).toBe(true);
                vor = z;
            }
            await rahmen(page, f);
        });

        test(`(W10) Start auf dem Dashboard, erstes Oeffnen: die Liste fuellt ihre Spalte — ${buendel}`, async ({
            page
        }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const f = await laden(page, url);
            await expect(
                page.locator('#view-dashboard'),
                'Vorbedingung: Start auf dem Dashboard'
            ).toHaveClass(/\bactive\b/);
            await zurAnsicht(page, 'bestiary');
            // Die Liste ist das einzige Kind von .bestiary-master; ihre Hoehe ist
            // die Innenhoehe der Spalte, wenn das Rollwerk sie beim ersten SICHTBAREN
            // Zeichnen misst (1440x900: 587 px, 17 Zeilen). Zeichnet renderAll() sie
            // schon beim Start im versteckten Reiter, setzt das Rollwerk den
            // Rueckfall 400 px fest (gemessen: 400 px, 13 Zeilen).
            const m = await page.evaluate(() => {
                const c = /** @type {HTMLElement} */ (document.getElementById('bestiary-list'));
                const spalte = /** @type {HTMLElement} */ (c.parentElement);
                const cs = getComputedStyle(spalte);
                return {
                    spalte: spalte.className,
                    liste: Math.round(c.getBoundingClientRect().height),
                    innen: Math.round(
                        spalte.clientHeight -
                            (parseFloat(cs.paddingTop) || 0) -
                            (parseFloat(cs.paddingBottom) || 0)
                    ),
                    zeilen: c.querySelectorAll('.bestiary-list-item').length
                };
            });
            expect(m.spalte, 'Vorbedingung: die Liste sitzt in der Master-Spalte').toContain(
                'bestiary-master'
            );
            weich(
                m.liste,
                `die Liste fuellt beim ersten Oeffnen ihre Spalte (${m.zeilen} Zeilen gezeichnet)`
            ).toBe(m.innen);
            weich(m.liste, 'nicht der Rueckfall des Rollwerks').not.toBe(400);
            await rahmen(page, f);
        });

        test(`(W11) Typ-Filter "Probetyp", Strg+Z, Strg+Y: der Filter steht auf "Alle" — ${buendel}`, async ({
            page
        }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const f = await laden(page, url);
            await zurAnsicht(page, 'bestiary');
            await anlegen(page, 'Probewesen', 'Probetyp');
            await bediene(page, '#bestiary-filter-type', 'der Typ-Filter');
            await page.keyboard.type('Probetyp', { delay: 30 });
            await page.keyboard.press('Enter');
            await page.waitForTimeout(SETZEN_MS);
            const z0 = await zustand(page);
            expect(z0.typWert, 'Vorbedingung: Typ-Filter "Probetyp"').toBe('Probetyp');
            expect(z0.zeilen, 'Vorbedingung: nur Probewesen').toEqual([PROBE]);
            // Den Fokus aus dem select nehmen: Klick auf die Ueberschrift (kein Bedienelement).
            await bediene(page, '#view-bestiary .section-toolbar-title', 'die Ueberschrift');

            await rueckgaengig(page);
            const z1 = await zustand(page);
            expect(z1.D_namen, 'Vorbedingung: Strg+Z nimmt das Anlegen zurueck').toEqual([
                '1:Altwesen'
            ]);
            weich(z1.typWert, 'nach Strg+Z steht der Typ-Filter auf "Alle"').toBe('');
            weich(z1.typ.ist, 'kein "Probetyp" mehr unter den Optionen').not.toContain('Probetyp');
            weich(z1.zeilen, 'die verschwundene Kreatur ist nicht mehr gelistet').not.toContain(
                PROBE
            );
            weich(z1.scrollTop, 'die Liste steht oben (geaenderte Filtersignatur)').toBe(0);
            weich(z1.ersteSichtbare, 'die erste sichtbare Zeile ist der erste Treffer').toBe(
                await ersterTrefferUngefiltert(page)
            );

            await wiederholen(page);
            const z2 = await zustand(page);
            weich(z2.typ.ist, 'nach Strg+Y ist die Option "Probetyp" zurueck').toContain(
                'Probetyp'
            );
            weich(
                z2.typWert,
                'nach Strg+Y bleibt der Filter auf "Alle" (Entscheidung (d), nicht wiederhergestellt)'
            ).toBe('');
            await rahmen(page, f);
        });
    }
});

// ───────────────────────────────────────────────────────────────────────────
// (W12) Telefon 390x844 — ↩️ im Kopf, ⋯ → ↪️
// ───────────────────────────────────────────────────────────────────────────

test.describe('BESTIAR-UNDO Telefon 390x844', () => {
    test.use({ viewport: TELEFON, isMobile: true, hasTouch: true });

    for (const [buendel, url] of BUENDEL) {
        test(`(W12a) ★ Altwesen, zum Detail gerollt, ↩️, ⋯ → ↪️ — ${buendel}`, async ({ page }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const f = await laden(page, url);
            expect(await istMobil(page), 'Vorbedingung: Mobil-Layout').toBe(true);
            await zurAnsicht(page, 'bestiary');
            await suchen(page, 'wesen');
            await bediene(page, zeileSel(ALT) + ' .bestiary-name', 'die Zeile Altwesen');
            await bediene(page, sternSel(ALT), '★ Altwesen');
            const kasten = /** @type {{x: number, y: number, width: number, height: number}} */ (
                await page.locator('#view-bestiary .bestiary-layout').boundingBox()
            );
            await page.mouse.move(kasten.x + kasten.width / 2, kasten.y + kasten.height / 2);
            for (let i = 0; i < 4; i++) {
                await page.mouse.wheel(0, 150);
                await page.waitForTimeout(80);
            }
            await page.waitForTimeout(300);
            const z0 = await zustand(page, [ALT]);
            expect(z0.D_fav, 'Vorbedingung: Altwesen ist Favorit').toContain('custom:1');
            expect(z0.layoutRollen, 'Vorbedingung: zum Detail gerollt').toBeGreaterThan(0);
            expect(z0.detail, 'Vorbedingung: das Detail zeigt Altwesen').toBe('Altwesen');

            await rueckgaengig(page);
            const z1 = await zustand(page, [ALT]);
            expect(z1.D_fav, 'Vorbedingung: ↩️ nimmt den Favoriten zurueck').toEqual([
                'adler',
                'kraken'
            ]);
            sternPasst(z1, ALT, 'nach ↩️');
            weich(z1.detail, 'nach ↩️ bleibt das Detail').toBe('Altwesen');
            detailUnberuehrt(z0, z1, 'nach ↩️');
            weich(z1.layoutRollen, 'nach ↩️ bleibt die Rolllage').toBe(z0.layoutRollen);

            await wiederholen(page);
            const z2 = await zustand(page, [ALT]);
            sternPasst(z2, ALT, 'nach ⋯ → ↪️');
            weich(z2.detail, 'nach ↪️ bleibt das Detail').toBe('Altwesen');
            detailUnberuehrt(z1, z2, 'nach ⋯ → ↪️');
            weich(z2.layoutRollen, 'nach ↪️ bleibt die Rolllage').toBe(z0.layoutRollen);
            await rahmen(page, f);
        });

        test(`(W12b) anlegen, waehlen, ↩️: Zeile weg, Zaehler, Detail leer — ${buendel}`, async ({
            page
        }) => {
            test.skip(buendel === 'prod' && !PROD_DA, 'kein prod-Buendel gebaut');
            const f = await laden(page, url);
            expect(await istMobil(page), 'Vorbedingung: Mobil-Layout').toBe(true);
            await zurAnsicht(page, 'bestiary');
            await suchen(page, 'wesen');
            await anlegen(page, 'Probewesen', 'Probetyp');
            await bediene(page, zeileSel(PROBE) + ' .bestiary-name', 'die Zeile Probewesen');
            const z0 = await zustand(page);
            expect(z0.detail, 'Vorbedingung: das Detail zeigt Probewesen').toBe('Probewesen');

            await rueckgaengig(page);
            const z1 = await zustand(page);
            expect(z1.D_namen, 'Vorbedingung: ↩️ nimmt das Anlegen zurueck').toEqual([
                '1:Altwesen'
            ]);
            weich(z1.zeilen, 'nach ↩️ ist die Zeile Probewesen weg').not.toContain(PROBE);
            kopfPasst(z1, ZAEHLER_SAAT, 'nach ↩️');
            detailLeer(z1, 'nach ↩️');
            weich(z1.fokus.body, `nach ↩️ nicht auf BODY (${z1.fokus.beschreibung})`).toBe(false);
            await rahmen(page, f);
        });
    }
});
