// @ts-check
/**
 * Die Untergrenze der Schrift und die Formularschrift des Browsers
 * (Design-Handoff v3, Welle 5, Schritt 8 — Befunde D-06 und O-10)
 * ===========================================================================
 *
 * WORUEBER DIESER FALL URTEILT. Zwei Zusagen der Welle 5, die BEIDE nur im
 * Browser pruefbar sind:
 *
 *   1. UNTERGRENZE 11 px (E-4). Kein Element traegt eine kleinere
 *      Schriftgroesse als 11 px — ausser einer namentlichen Liste, und jeder
 *      Eintrag dieser Liste nennt seinen gemessenen Wert und seine Zahl.
 *   2. KEINE BROWSER-VORGABE AN BEDIENELEMENTEN (O-10). Kein Knopf, kein
 *      Eingabefeld, kein Auswahlfeld und kein Textbereich steht auf
 *      Chromiums `font: -webkit-small-control` (13,3333 px).
 *
 * WARUM DIE QUELLTEXT-RATSCHEN DAS NICHT KOENNEN. W5-R-05 urteilt ueber
 * DEKLARATIONEN, nicht ueber Elemente. Eine Deklaration von `0.7em` ist
 * quelltextlich unauffaellig und wird zu 8,96 px, wenn ihr Elternteil 12,8 px
 * traegt — gemessen sitzen 225 der 948 em-Elemente auf einem Elternwert
 * ungleich 16 px. Und die Browser-Vorgabe ist das Gegenteil davon: dort gibt
 * es GAR KEINE Deklaration, die eine Quelltextsuche finden koennte. Beide
 * Befunde entstehen erst beim Setzen.
 *
 * WARUM DIE BESTEHENDE ZUSAGE "0 AUSSER .sr-only" NICHT TAUGT. Der Handoff
 * nennt `.sr-only` als die einzige Ausnahme der Untergrenze. Gemessen ist
 * diese Ausnahme LEER: alle 17 `.sr-only`-Elemente liegen bei 17,6 px. Eine
 * Ausnahme, die nichts trifft, verdeckt den echten Befund statt ihn zu
 * benennen — und der echte Befund sind die fuenf Signaturen unten.
 *
 * WARUM AUF GEFUELLTER KAMPAGNE. Von 113 nachweislich erreichbaren Elementen
 * unter 11 px ist in einer leeren Kampagne nur ein Bruchteil im Baum;
 * Kartenlisten, Attributpillen und Ladenzeilen entstehen erst mit Daten. Eine
 * leere Kampagne verbirgt gemessen 88 Prozent der Stellen.
 *
 * WARUM IN DREI ZUSTAENDEN UND BEI ZWEI BREITEN. 13 font-size-Deklarationen
 * stehen in Medienabfragen; bei 1440 px greift keine, bei 375 px gewinnen
 * drei. Und von den Elementen unter 11 px sind in der Ruhelage nur 8 von 34
 * ueberhaupt sichtbar — die Tastenhilfen und die Aufklapp-Pfeile stehen in den
 * Werkzeugleisten der beiden Langform-Editoren, die erst mit dem
 * Sitzungsformular aufgehen.
 *
 * WARUM UEBER DEN GANZEN BAUM GEMESSEN WIRD UND NICHT NUR UEBER DAS
 * SICHTBARE. `getComputedStyle` liefert die Schriftgroesse auch in einem
 * `display: none`-Teilbaum. Eine Zusage, die nur das Sichtbare prueft, laesst
 * jede Regression in zugeklappter Oberflaeche durch — und genau dort arbeitet
 * der Spielleiter am Tisch die meiste Zeit. Die Sichtbarkeit wird DAZU
 * erhoben, weil sie den Bericht lesbar macht, aber sie schraenkt das Urteil
 * nicht ein.
 */

import { test, expect } from '@playwright/test';
import { seedPopulatedSession, loadApp } from '../helpers/test-utils.js';

/** Die Untergrenze aus Paragraph 3.7 des Handoffs. */
const UNTERGRENZE = 11;

/** Chromiums `font: -webkit-small-control` in Bildpunkten. */
const BROWSER_VORGABE = 13.3333;

/**
 * Die namentliche Ausnahmeliste der Untergrenze, Schluessel ist die
 * Elementsignatur (Tag plus SORTIERTE Klassennamen — die Reihenfolge in
 * `classList` haengt daran, in welcher Folge das JS sie gesetzt hat, und ist
 * zwischen zwei Laeufen nicht zugesichert).
 *
 * JEDER EINTRAG NENNT SEINEN GEMESSENEN WERT UND SEINE ZAHL. Eine Ausnahme
 * ohne Messwert ist eine Meinung, und eine Ausnahme ohne Anzahl waechst
 * unbemerkt: die Liste duldet nicht "diese Klasse", sondern "so viele
 * Elemente dieser Klasse mit diesem Wert".
 *
 * DIE LISTE IST LAENGER ALS DIE 25 STELLEN, DIE E-4 NENNT, und das muss
 * dastehen: E-4 fuehrt die 21 SVG-Beschriftungen und die 4 `.slot-pip`. Die
 * drei anderen Signaturen (9 Elemente) sind in den Schritten 4 und 5 gefunden
 * und dort einzeln beurteilt worden; ihre Begruendungen stehen im CSS an der
 * Deklaration und in `tools/typo-map.js`. Zusammen 34 Elemente in 5
 * Signaturen.
 */
const GEDULDET = {
    'span.slot-pip': {
        px: [8],
        n: 2,
        text: false,
        grund:
            'Zauberplatz-Punkt: ein Kreis von 18x18 px mit border-radius 50% und ' +
            'OHNE Textinhalt. Keine Schrift — wer ihn als "Schrift unter 11 px" ' +
            'zaehlt, rechnet die Zielquote falsch (E-4).'
    },
    'span.filled.slot-pip': {
        px: [8],
        n: 2,
        text: false,
        grund: 'Derselbe Punkt im gefuellten Zustand. Ebenfalls ohne Textinhalt.'
    },
    'span.kbd-hint': {
        px: [8],
        n: 5,
        text: true,
        grund:
            'DIE EINZIGE DULDUNG DER WELLE, DIE LESETEXT BETRIFFT ("Strg+B" und ' +
            'vier Geschwister). Die Hebung auf 11 px macht den Text nicht lesbarer, ' +
            'sondern unlesbar: die drei Formathilfen laufen ineinander (gemessen ' +
            '-2,80 und -3,09 px, unter der breiten Linux-Naeherung -8,20 und ' +
            '-8,68 px). Der einzige Weg, der beides loest, ist eine Layoutregel — ' +
            'nur die Hilfe des beruehrten Knopfes zeigen statt aller fuenf der ' +
            'Leiste —, und das aendert, WANN ein Hinweis erscheint. Das ist eine ' +
            'Funktionsaenderung und gehoert nicht in eine Typografie-Welle. Die ' +
            'Zahlen stehen in tests/e2e/features/tastenhilfen.spec.js.'
    },
    'span.tb-caret': {
        px: [9],
        n: 4,
        text: true,
        grund:
            'Aufklapp-Pfeil (▾, U+25BE) neben "Marker" und "Bausteine" in den zwei ' +
            'Langform-Leisten. Kein Lesetext: die Untergrenze gilt woertlich fuer ' +
            '"alles, was man liest". Entschieden GEMEINSAM mit dem Zwilling ' +
            '`.wiki-tree-item-toggle` (party.css, 8px, ▶), wie Schritt 4 es ' +
            'zugesichert hat — bewacht von W5-R-07f in ' +
            'tests/unit/design-consistency.test.js.'
    },
    'text.ds-hist-face-label': {
        px: [8],
        n: 20,
        text: true,
        grund:
            'Die Beschriftungen des d20-Histogramms (20 Wuerfelseiten bei 8, die ' +
            'Y-Achse bei 7). DIE ZAHL IST EINE BENUTZEREINHEIT, keine ' +
            'Bildpunktgroesse: das SVG traegt viewBox="0 0 440 180" und ' +
            'width: 100%. Gemessen wirken die 8 Einheiten 11,34 px bei 1440 px ' +
            'Fensterbreite und 5,44 px bei 375 px. Auf dem Schreibtisch liegt die ' +
            'Beschriftung also BEREITS auf der Untergrenze; eine Hebung auf 11 ' +
            'Einheiten machte dort 15,6 px daraus und liesse sie auf dem Telefon ' +
            'weiter darunter. Namentliche Ausnahme nach E-4; die Lesbarkeit haengt ' +
            'an der Skalierung und ist als Folgearbeit gefuehrt.'
    },
    'text.ds-hist-axis-label': {
        px: [7],
        n: 1,
        text: true,
        grund:
            'Die Y-Achse desselben Histogramms (die 0 und, bei vorhandenen Wuerfen, ' +
            'der Hoechstwert). EINE Benutzereinheit kleiner als die Seitenbeschriftung ' +
            'darueber, und das ist kein Versehen: die Achse traegt bis zu drei Stellen ' +
            'und hat 26 Einheiten Platz (PAD.left 30 minus 4 Abstand, text-anchor: ' +
            'end) — bei 8 Einheiten liefe "100" aus dem Diagramm heraus. Wirkt ' +
            'gemessen 9,93 px bei 1440 px und 4,76 px bei 375 px. DIESE SIGNATUR IST ' +
            'DAS GEMESSENE MINIMUM DER GANZEN APP — die Zusage unten beziffert sie ' +
            'mit 7 px.'
    }
};

/** Die 24 Ansichten in der Reihenfolge der Navigationsleiste. */
const ANSICHTEN = [
    'dashboard', 'party', 'npcs', 'locations', 'quests', 'encounter', 'initiative',
    'loot', 'shops', 'spells', 'notes', 'wiki', 'links', 'dice', 'timers', 'data',
    'dmscreen', 'bestiary', 'sessionprep', 'kalender', 'reise', 'fraktionen',
    'soundboard', 'dicestats'
];

/** Ansicht -> Aufklapp-Formular fuer den Zustand "offen". */
const FORMULARE = {
    party: 'char-form',
    npcs: 'npc-form',
    encounter: 'enc-form',
    notes: 'session-form',
    wiki: 'wiki-form'
};

/**
 * Erhebt den GANZEN Baum. Laeuft im Browser, darf also nichts aus dem
 * Node-Gueltigkeitsbereich benutzen.
 *
 * Bei SVG-Text wird zusaetzlich die Bildschirm-Skalierung des SVG erhoben
 * (`getScreenCTM().a`): die `font-size` eines SVG-Textes ist eine
 * BENUTZEREINHEIT, und ohne diesen Faktor ist die gemessene Zahl keine
 * Aussage ueber Lesbarkeit. Diese Unterscheidung ist der Grund, warum die
 * Histogramm-Beschriftungen geduldet werden und nicht gehoben.
 */
function erhebeImBrowser(grenzen) {
    const klein = [];
    const vorgabe = [];
    const zaehler = new Map();
    document.querySelectorAll('*').forEach(el => {
        const tag = el.tagName;
        if (['SCRIPT', 'STYLE', 'TEMPLATE', 'LINK', 'META', 'TITLE'].includes(tag)) return;
        const cs = getComputedStyle(el);
        const px = Math.round(parseFloat(cs.fontSize) * 100) / 100;
        if (!isFinite(px)) return;
        const klassen = el.classList ? Array.from(el.classList).sort().join('.') : '';
        const sig = tag.toLowerCase() + (klassen ? '.' + klassen : '');
        const i = zaehler.get(sig) || 0;
        zaehler.set(sig, i + 1);
        if (px < grenzen.untergrenze) {
            let skala = 1;
            try {
                const svg = el.ownerSVGElement;
                if (svg && svg.getScreenCTM) {
                    const m = svg.getScreenCTM();
                    if (m) skala = Math.round(m.a * 1000) / 1000;
                }
            } catch (e) {
                skala = 1;
            }
            const r = el.getBoundingClientRect();
            klein.push({
                sig,
                px,
                skala,
                wirkt: Math.round(px * skala * 100) / 100,
                sichtbar:
                    cs.display !== 'none' &&
                    cs.visibility !== 'hidden' &&
                    parseFloat(cs.opacity) > 0.01 &&
                    (r.width > 0 || r.height > 0),
                text: el.childNodes
                    ? Array.from(el.childNodes).some(
                          n => n.nodeType === 3 && n.textContent.trim()
                      )
                    : false,
                inhalt: (el.textContent || '').trim().slice(0, 20)
            });
        }
        if (
            ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(tag) &&
            Math.abs(px - grenzen.vorgabe) < 0.1
        ) {
            vorgabe.push({ sig, px, id: el.id || '' });
        }
    });
    return { klein, vorgabe, gesamt: zaehler.size };
}

/** Stellt die drei Zustaende her und erhebt danach EINMAL den ganzen Baum. */
async function erhebeAlleZustaende(page) {
    // Ruhelage: jede Ansicht einmal anlaufen, damit die JS-erzeugten Listen
    // ueberhaupt im Baum sind. Zwei Ansichten zeigen ihren Inhalt erst nach
    // einer Auswahl — ohne diese beiden Zeilen fehlen 113 Laden- und 62
    // Fraktionselemente, und zwar ohne dass irgendetwas fehlschlaegt.
    for (const v of ANSICHTEN) {
        await page.evaluate(x => window.switchView(x), v);
        if (v === 'shops') {
            await page.evaluate(() => {
                if (typeof window.toggleShop === 'function') window.toggleShop(1);
            });
        }
        if (v === 'fraktionen') {
            await page.evaluate(() => {
                if (typeof window.selectFraktion === 'function') window.selectFraktion(1);
            });
        }
        await page.waitForTimeout(80);
    }
    // Zustand "offen": die Aufklapp-Formulare, die Schnellreferenz und das
    // schwebende Wuerfelpaneel. Die Umschalter werden per dispatchEvent
    // bedient und nicht geklickt: bei 375 px liegt die feste Mobil-Kopfzeile
    // darueber und faengt die Zeigerereignisse ab, ein echter Klick laeuft
    // dort in den Zeitablauf. Die Ereignisweitergabe haengt an `data-action`
    // am document, ein aufsteigendes Klickereignis erreicht sie genauso — und
    // in BEIDEN Breiten auf demselben Weg.
    for (const [view, form] of Object.entries(FORMULARE)) {
        await page.evaluate(x => window.switchView(x), view);
        await page.waitForTimeout(60);
        const schalter = page
            .locator('[data-action="toggle-collapse"][data-value="' + form + '"]')
            .first();
        if ((await schalter.count()) > 0) {
            await schalter.dispatchEvent('click');
            await page.waitForTimeout(120);
        }
    }
    await page.evaluate(() => {
        if (typeof window.toggleQuickRef === 'function') window.toggleQuickRef();
        const t = document.getElementById('floating-dice-trigger');
        if (t) t.click();
    });
    // Zustand "mob": die Editor-Aufklappmenues werden per Attribut entborgen
    // statt geklickt — der Klickpfad haengt an der Fensterbreite (die
    // Media-Query-Leiter 900/680 px reicht Werkzeuge ins Ueberlaufmenue nach),
    // die Erhebung soll aber in beiden Breiten dieselben Knoten sehen.
    await page.evaluate(() => {
        document.querySelectorAll('.tb-menu').forEach(m => {
            m.hidden = false;
            m.classList.add('open');
        });
        document
            .querySelectorAll('.init-mob-dmg-inputs')
            .forEach(e => e.classList.remove('hidden'));
    });
    await page.waitForTimeout(400);
    return page.evaluate(erhebeImBrowser, {
        untergrenze: UNTERGRENZE,
        vorgabe: BROWSER_VORGABE
    });
}

/** Je Signatur: Zahl, Werte, Sichtbarkeit, Textknoten, Wirkgroesse. */
function nachSignatur(klein) {
    const m = new Map();
    klein.forEach(e => {
        if (!m.has(e.sig)) m.set(e.sig, []);
        m.get(e.sig).push(e);
    });
    return m;
}

for (const lage of [
    { label: '1440 px', breite: 1440, hoehe: 900 },
    { label: '375 px', breite: 375, hoehe: 812 }
]) {
    test.describe('W5-R-09 — Untergrenze und Formularschrift bei ' + lage.label, () => {
        // Der Lauf stellt 24 Ansichten, 5 Formulare und zwei Paneele her; das
        // passt nicht in die 30 Sekunden der Projektvorgabe.
        test.setTimeout(180000);

        test('kein Element unter 11 px ausser der namentlichen Liste', async ({ page }) => {
            // Der 375er-Lauf LAEDT bei 1440 und verkleinert danach: `loadApp()`
            // wartet auf eine sichtbare `.app-title`, die im Mobil-Profil
            // verborgen ist — ein direkter Start bei 375 px laeuft in den
            // Zeitablauf. Danach bekommt der entprellte resize-Beobachter aus
            // core/init.js (200 ms) reichlich Zeit.
            await page.setViewportSize({ width: 1440, height: 900 });
            await seedPopulatedSession(page);
            await loadApp(page);
            if (lage.breite !== 1440) {
                await page.setViewportSize({ width: lage.breite, height: lage.hoehe });
                await page.waitForTimeout(700);
            }
            const r = await erhebeAlleZustaende(page);
            expect(r.gesamt).toBeGreaterThan(300);

            const gruppen = nachSignatur(r.klein);
            const bericht = [...gruppen.entries()].map(([sig, es]) => ({
                sig,
                n: es.length,
                px: [...new Set(es.map(e => e.px))].sort((a, b) => a - b),
                wirkt: [...new Set(es.map(e => e.wirkt))].sort((a, b) => a - b),
                sichtbar: es.filter(e => e.sichtbar).length,
                mitText: es.filter(e => e.text).length,
                inhalt: es[0].inhalt
            }));

            // (1) KEINE Signatur ausserhalb der Liste. Das ist die Zusage.
            const fremd = bericht.filter(b => !GEDULDET[b.sig]);
            expect({ fremd, geduldet: Object.keys(GEDULDET).length }).toEqual({
                fremd: [],
                geduldet: Object.keys(GEDULDET).length
            });

            // (2) Jede geduldete Signatur traegt GENAU die Werte, die ihre
            //     Begruendung nennt. Eine Ausnahme mit falschem Wert duldet
            //     etwas anderes, als sie sagt.
            bericht.forEach(b => {
                const g = GEDULDET[b.sig];
                expect({ sig: b.sig, px: b.px }).toEqual({ sig: b.sig, px: g.px });
                expect({ sig: b.sig, text: b.mitText > 0 }).toEqual({
                    sig: b.sig,
                    text: g.text
                });
            });

            // (3) Das gemessene Minimum wird BEZIFFERT und nicht nur
            //     verglichen: 7 px, die Y-Achse des Histogramms. Faellt es
            //     tiefer, ist eine neue Stelle entstanden; steigt es, hat
            //     jemand eine Ausnahme stillschweigend aufgeloest, und dann
            //     gehoert die Liste oben kuerzer.
            const minimum = Math.min(...r.klein.map(e => e.px));
            expect({ minimum }).toEqual({ minimum: 7 });

            // (4) Die Bedienelemente stehen NICHT mehr auf der Browser-Vorgabe.
            //     Vor Schritt 8 waren das gemessen 255 Elemente in 127
            //     Signaturen; die eine neue Regel in core.css
            //     (`button, input, select, textarea`) hat sie auf
            //     `var(--text-sm)` gelegt.
            expect({
                aufBrowserVorgabe: r.vorgabe.length,
                signaturen: [...new Set(r.vorgabe.map(v => v.sig))].sort()
            }).toEqual({ aufBrowserVorgabe: 0, signaturen: [] });
        });

        test('VERWESUNGSPROBE: jede geduldete Signatur hat ihre Elemente', async ({
            page
        }) => {
            // Die Gegenrichtung des ersten Falles. Eine Erlaubnisliste, die
            // verwest, erlaubt irgendwann etwas anderes als das, was ihr
            // Kommentar behauptet — und eine Liste, deren Eintraege kein
            // Element mehr treffen, laesst die Zusage oben trivial gruen
            // werden.
            //
            // EINE AUSNAHME IST NAMENTLICH ERWARTET: `.wiki-tree-item-toggle`
            // steht NICHT in der Liste, obwohl es mit 8 px deklariert ist —
            // es hat auf gefuellter Kampagne gemessen 0 gerenderte Elemente.
            // Genau das prueft die letzte Zeile: faellt die Zahl je von 0 auf
            // mehr, muss der Pfeil in die Liste oben, und zwar zusammen mit
            // seinem Zwilling `.tb-caret`.
            await page.setViewportSize({ width: 1440, height: 900 });
            await seedPopulatedSession(page);
            await loadApp(page);
            if (lage.breite !== 1440) {
                await page.setViewportSize({ width: lage.breite, height: lage.hoehe });
                await page.waitForTimeout(700);
            }
            const r = await erhebeAlleZustaende(page);
            const gruppen = nachSignatur(r.klein);
            const ohneElement = Object.keys(GEDULDET).filter(s => !gruppen.has(s));
            expect(ohneElement).toEqual([]);
            Object.entries(GEDULDET).forEach(([sig, g]) => {
                expect({ sig, n: (gruppen.get(sig) || []).length }).toEqual({ sig, n: g.n });
            });
            const pfeil = await page.evaluate(
                () => document.querySelectorAll('.wiki-tree-item-toggle').length
            );
            expect({ wikiTreeItemToggle: pfeil }).toEqual({ wikiTreeItemToggle: 0 });
        });
    });
}
