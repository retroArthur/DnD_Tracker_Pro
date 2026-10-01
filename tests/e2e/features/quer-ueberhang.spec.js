// @ts-check
/**
 * E2E — Kein seitlicher Ueberhang auf Telefonbreiten, in keiner Ansicht (Q1).
 *
 * WARUM ES DIESE PROBE BRAUCHT. Seitwaerts scrollen ist am Spieltisch keine
 * Bedienung: der Spielleiter haelt das Geraet in einer Hand und tippt mit dem
 * Daumen. Steht die Seite 416px breiter als das Fenster, liegt die Haelfte
 * jeder Karte ausserhalb — und zwar genau die rechte Haelfte, in der bei
 * dieser App die Knoepfe sitzen (Trefferpunkte, Effekte, Entfernen).
 *
 * WARUM MIT GEFUELLTER KAMPAGNE, UND WARUM DAS DER KERN DER PROBE IST.
 * Auf einer LEEREN Kampagne ist der Ueberhang in allen 24 Ansichten NULL. Jede
 * der vier Ursachen unten ist eine Rasterspalte, deren automatisches Minimum
 * der min-content-Breite ihres INHALTS folgt — ohne Inhalt gibt es nichts, dem
 * sie folgen koennte. Eine Probe mit kurzer Saat waere also gruen und zugleich
 * blind. Derselbe Fehler hat in diesem Projekt schon einmal drei Wochen
 * getragen (die Listen-Schalen: der Verlust begann ab dem 10. Eintrag, die
 * Testseeds waren kuerzer). Darum steht hier neben der Ueberhang-Zusicherung
 * eine zweite, die BELEGT, dass die Saat angekommen ist — faellt sie je
 * wieder auf Leerstand zurueck, schlaegt die Probe an statt stillzuhalten.
 *
 * VIER URSACHEN, VIER ANSICHTEN, EINS ZU EINS ZUGEORDNET. Jede Korrektur
 * einzeln eingespielt und gemessen (320x700, gefuellte Saat): sie behebt genau
 * ihre eigene Ansicht und keine andere.
 *
 *   Dashboard   `.dash { display: grid }` nannte KEINE
 *               `grid-template-columns`. Die einzige implizite Spalte ist
 *               damit `auto`, und ihr automatisches Minimum ist die
 *               min-content-Breite des Inhalts. Die loeste zu 710px auf,
 *               weil `.dash-party-grid` ein `max-width: 720px` traegt:
 *               `repeat(auto-fill, minmax(160px, 1fr))` rechnet seine
 *               Wiederholungen gegen diese DEFINITE Maximalbreite, also vier
 *               Spalten a 160px + 3x12px Abstand + 2x16px Innenabstand +
 *               2x1px Rahmen = 710. `.dash` selbst war 300px breit.
 *   Initiative  `.init-entry { grid-template-columns: ... auto auto }`. Die
 *               letzte `auto`-Spalte traegt `.init-right`, eine
 *               `flex-wrap: nowrap`-Reihe aus Trefferpunktanzeige und sechs
 *               Knoepfen: min-content 379px in einer 300px breiten Zeile.
 *   Wuerfel     `input.dice-formula` ist `flex: 1` in einer nowrap-Reihe, aber
 *               `min-width: auto` setzt bei einem Formularfeld das
 *               inhaltsbasierte Minimum (Chrome: `size`-Vorgabe, hier 215px)
 *               als harte Schranke — das Feld konnte nicht schrumpfen.
 *   Fraktionen  `.fr-layout` faellt unter 900px auf `grid-template-columns: 1fr`.
 *               `1fr` ist `minmax(auto, 1fr)`; das `auto` als Minimum ist
 *               wieder die min-content-Breite, hier 426px aus den
 *               Fraktionskarten.
 *
 * ROT OHNE DIE KORREKTUR, von DIESER Probe an HEAD f6cc6f7 gemessen (Theme
 * `dark`; dieselbe Saat in `light`, `sepia` und `contrast` ergab auf den
 * Bildpunkt dieselben Zahlen — die Ursachen sind Raster, nicht Farbe). "n" =
 * Elemente, die ganz oder teils rechts des Fensterrands lagen, also die Zahl,
 * die Zusicherung 2 beanstandet:
 *
 *   Ansicht     320x700          360x740          390x844        740x360
 *   ---------   --------------   --------------   -------------  -------
 *   Dashboard   416px (n=71)     376px (n=64)     346px (n=55)   0
 *   Initiative  244px (n=80)     204px (n=70)     174px (n=70)   0
 *   Wuerfel      72px (n=4)       32px (n=3)        2px (n=1)     0
 *   Fraktionen  116px (n=24)      76px (n=24)      46px (n=19)   0
 *   uebrige 20  0                0                0              0
 *
 * 740x360 (Telefon im Querformat) ist auch ohne Korrektur frei: 740px Breite
 * liegen ueber allen vier min-content-Schranken. Der Fall bleibt trotzdem in
 * der Probe, weil er die einzige Breite ist, bei der das Mobil-Profil gilt und
 * das Fenster dennoch breit ist — eine Korrektur, die dort etwas kaputt macht,
 * faellt nur hier auf.
 *
 * WARUM NICHT `overflow-x: hidden`. Ein verstecktes Ueberlaufen ist kein
 * behobenes: der Inhalt ist dann unerreichbar statt verschoben, und
 * `scrollWidth - clientWidth` meldete 0, obwohl die Knoepfe weiterhin
 * ausserhalb liegen. ZUSICHERUNG 2 prueft deshalb nicht die Scrollbreite,
 * sondern jedes einzelne Element: keines darf rechts des Fensterrands enden.
 * Mit `overflow: hidden` an einem Vorfahren waere Zusicherung 1 gruen und
 * Zusicherung 2 rot.
 *
 * Betroffene Quellen: `assets/styles/dashboard.css` (`.dash`),
 * `assets/styles/initiative.css` (Mobil-Zweig von `.init-entry`),
 * `assets/styles/dice.css` (`.dice-formula`), `assets/styles/core.css`
 * (Master-Detail-Familie unter 900px).
 */
import { test, expect } from '@playwright/test';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Alle 24 Reiter, in der Reihenfolge der Reiter-Registrierung. */
const ANSICHTEN = [
    'dashboard',
    'party',
    'npcs',
    'locations',
    'quests',
    'encounter',
    'initiative',
    'spells',
    'loot',
    'shops',
    'wiki',
    'notes',
    'dice',
    'dicestats',
    'timers',
    'dmscreen',
    'bestiary',
    'kalender',
    'reise',
    'fraktionen',
    'links',
    'soundboard',
    'sessionprep',
    'data'
];

/* Die Telefonfenster. 320x700 ist das engste gebraeuchliche Geraet (CLAUDE.md
   nennt 320px ausdruecklich als Mobil-Pruefbreite), 390x844 das heute
   haeufigste, 360x740 der Android-Mittelbau, 740x360 dasselbe Geraet gedreht. */
const FENSTER = [
    [320, 700],
    [360, 740],
    [390, 844],
    [740, 360]
];

/** Die beiden Desktop-Fenster der Gegenprobe. */
const DESKTOP_FENSTER = [
    [1440, 900],
    [1280, 800]
];

const zz = i => String(i).padStart(2, '0');
const reihe = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));

/* GEFUELLTE Saat — der Kern dieser Probe, siehe Kopfkommentar. Die Namen sind
   absichtlich lang: eine kurze Beschriftung bricht den Fall nicht, weil die
   min-content-Breiten der Taeter aus Knopfreihen und festen Spaltenmaszen
   kommen, aber lange Namen erzeugen zusaetzlich den naheliegenden zweiten Fall
   (nicht umbrechender Text) und halten die Probe gegen beides.
   `_version` weit in der Zukunft ueberspringt `migrateData()`, die gefuellte
   `_nextId`-Abbildung verhindert die beiden Fruehstart-Rennen — wie in
   `seedCleanSession()` (tests/e2e/helpers/test-utils.js). */
const SAAT = {
    _version: '99.0.0',
    settings: {
        theme: 'dark',
        lastView: 'dashboard',
        markdownOnboardingSeen: true,
        enableMarkdownShortcuts: true,
        enableMarkdownImportExport: true,
        levelingMode: 'xp'
    },
    characters: reihe(5, i => ({
        id: i,
        name: `Spielerfigur mit langem Namen ${zz(i)}`,
        class: 'Magier',
        race: 'Hochelf',
        level: 5 + i,
        hp: 30,
        maxHp: 44,
        currentHp: 30,
        tempHp: 0,
        ac: 14 + i,
        speed: 30,
        initiative: 2,
        passivePerception: 12 + i,
        xp: 6500,
        player: `Mitspieler ${zz(i)}`,
        notes: 'Eine Notiz mit genug Text, dass sie umbricht und Breite verlangt.',
        attributes: { str: 10, dex: 16, con: 14, int: 18, wis: 12, cha: 8 },
        conditions: i % 2 ? ['Vergiftet'] : [],
        attacks: [{ name: 'Feuerstrahl', attackBonus: 7, damage: '2d10', damageType: 'Feuer' }],
        spellSlots: { 1: { max: 4, used: 1 }, 2: { max: 3, used: 0 }, 3: { max: 2, used: 0 } }
    })),
    npcs: reihe(12, i => ({
        id: i,
        name: `Nichtspielerfigur mit langem Namen ${zz(i)}`,
        race: 'Mensch',
        role: 'Haendler der Oberstadt',
        location: `Ort mit langem Namen ${zz(i)}`,
        description: 'Beschreibung, die ueber mehrere Zeilen laeuft und Breite verlangt.',
        relations: [
            { targetId: 1, targetType: 'characters', status: 'friendly', note: 'Alter Freund' }
        ]
    })),
    locations: reihe(10, i => ({
        id: i,
        name: `Ort mit langem Namen ${zz(i)}`,
        type: 'Stadt',
        region: 'Kernland des noerdlichen Reiches',
        description: 'Beschreibung, die ueber mehrere Zeilen laeuft und Breite verlangt.'
    })),
    quests: reihe(8, i => ({
        id: i,
        title: `Ein Auftrag mit einem ziemlich langen Titel ${zz(i)}`,
        status: i % 3 === 0 ? 'completed' : 'active',
        priority: 'high',
        giver: `Nichtspielerfigur mit langem Namen ${zz(i)}`,
        reward: '500 Goldmuenzen und ein Gefallen',
        description: 'Beschreibung, die ueber mehrere Zeilen laeuft und Breite verlangt.',
        objectives: [{ text: 'Das erste Teilziel mit laengerem Text', done: false }]
    })),
    encounters: reihe(8, i => ({
        id: i,
        name: `Begegnung mit langem Namen ${zz(i)}`,
        difficulty: 'medium',
        terrain: 'normal',
        description: 'Beschreibung der Begegnung mit etwas mehr Text.',
        monsters: [
            { name: 'Gobliner Scharfschuetze', count: 4, cr: '1/4', hp: 7, ac: 15 },
            { name: 'Ork-Haeuptling der Steppe', count: 1, cr: '2', hp: 42, ac: 16 }
        ]
    })),
    spells: reihe(20, i => ({
        id: i,
        name: `Zauber mit langem Namen ${zz(i)}`,
        level: i % 10,
        school: 'Hervorrufung',
        castingTime: '1 Aktion',
        range: '36 Meter',
        components: 'V, S, M (eine Prise Schwefel)',
        duration: 'Augenblicklich',
        spellClass: 'Magier, Hexenmeister, Zauberer',
        description: 'Beschreibung des Zaubers mit genug Text fuer mehrere Zeilen.'
    })),
    loot: reihe(14, i => ({
        id: i,
        name: `Gegenstand mit langem Namen ${zz(i)}`,
        type: 'Waffe',
        rarity: 'selten',
        value: 150 * i,
        quantity: 2,
        description: 'Beschreibung des Gegenstands mit genug Text.'
    })),
    shops: reihe(4, i => ({
        id: i,
        name: `Laden mit langem Namen ${zz(i)}`,
        type: 'Gemischtwaren',
        owner: `Nichtspielerfigur mit langem Namen ${zz(i)}`,
        location: `Ort mit langem Namen ${zz(i)}`,
        items: reihe(6, j => ({
            id: j,
            shopId: i,
            name: `Ware mit langem Namen ${zz(j)}`,
            price: 25 * j,
            category: 'Ausruestung',
            stock: 3
        }))
    })),
    wiki: reihe(10, i => ({
        id: i,
        title: `Wiki-Eintrag mit langem Titel ${zz(i)}`,
        category: i % 2 ? 'Geschichte' : 'Goetter',
        content: '<p>Ein Absatz mit genug Text, dass er in einem schmalen Fenster umbricht.</p>',
        tags: ['probe', 'lang']
    })),
    sessionNotes: reihe(6, i => ({
        id: i,
        title: `Sitzungsprotokoll mit langem Titel ${zz(i)}`,
        date: `2026-0${(i % 9) + 1}-15`,
        content: '<p>Protokolltext mit genug Laenge fuer mehrere Zeilen im Telefonfenster.</p>'
    })),
    bestiary: reihe(10, i => ({
        id: i,
        name: `Eigene Kreatur mit langem Namen ${zz(i)}`,
        cr: '2',
        type: 'Bestie',
        size: 'Gross',
        ac: 14,
        hp: 45,
        speed: '12 m',
        attributes: { str: 16, dex: 12, con: 15, int: 3, wis: 12, cha: 6 },
        actions: [{ name: 'Biss', desc: 'Nahkampfangriff mit Waffe: +5, 1d10+3 Stichschaden.' }]
    })),
    bestiaryFavorites: ['custom:1', 'custom:2'],
    monsterFavorites: [],
    factions: reihe(5, i => ({
        id: i,
        name: `Fraktion mit langem Namen ${zz(i)}`,
        typ: 'Gilde',
        beschreibung: 'Beschreibung der Fraktion mit genug Text fuer mehrere Zeilen.',
        ruf: 25,
        ziele: ['Ein Ziel mit laengerem Text', 'Ein zweites Ziel'],
        mitglieder: [{ id: 1, typ: 'npcs', name: `Nichtspielerfigur mit langem Namen ${zz(i)}` }]
    })),
    storyArcs: reihe(4, i => ({
        id: i,
        title: `Erzaehlbogen mit langem Titel ${zz(i)}`,
        status: 'active',
        description: 'Beschreibung des Bogens.'
    })),
    sessionPreps: reihe(3, i => ({
        id: i,
        titel: `Sitzungsvorbereitung mit langem Titel ${zz(i)}`,
        erstellt: 1760000000000 - i * 86400000,
        szenen: [{ id: 1, titel: 'Eine Szene mit laengerem Titel', notiz: 'Notiztext' }],
        starkeAnfaenge: 'Ein starker Anfang mit genug Text.',
        geheimnisse: ['Ein Geheimnis mit laengerem Text']
    })),
    links: reihe(8, i => ({
        id: i,
        from: 1,
        to: i + 1,
        fromType: 'npcs',
        toType: 'locations',
        label: `Verbindung ${zz(i)}`
    })),
    randomTables: reihe(4, i => ({
        id: i,
        name: `Zufallstabelle mit langem Namen ${zz(i)}`,
        icon: '🎲',
        entries: reihe(6, j => ({ weight: 1, text: `Ein Ergebnis mit laengerem Text ${zz(j)}` }))
    })),
    timers: reihe(3, i => ({
        id: i,
        name: `Zeitgeber mit langem Namen ${zz(i)}`,
        rounds: 5,
        remaining: 3
    })),
    quickRefCustom: reihe(3, i => ({
        id: i,
        title: `Eigener Eintrag mit langem Titel ${zz(i)}`,
        content: '<p>Inhalt mit genug Text.</p>',
        expanded: false
    })),
    diceHistory: reihe(12, i => ({
        id: i,
        formula: '1d20+7',
        result: (i % 20) + 1,
        total: (i % 20) + 8,
        rolls: [(i % 20) + 1],
        label: `Wurf mit laengerem Etikett ${zz(i)}`,
        character: `Spielerfigur mit langem Namen ${zz((i % 5) + 1)}`,
        timestamp: 1760000000000 - i * 60000
    })),
    sessionHistory: reihe(4, i => ({ id: i, date: `2026-0${i}-01`, duration: 10800000 })),
    partyGold: 1234,
    quickNotes: 'Eine schnelle Notiz mit genug Text fuer mehrere Zeilen im Telefonfenster.',
    initiative: {
        combatants: reihe(10, i => ({
            id: i,
            name: `Kaempfer mit langem Namen ${zz(i)}`,
            initiative: 20 - i,
            currentHp: 20,
            maxHp: 30,
            ac: 15,
            type: i % 2 ? 'player' : 'enemy',
            conditions: i % 3 === 0 ? ['Betaeubt'] : [],
            concentration: { active: i === 1, spell: 'Segnen', pendingCheck: 0 },
            deathSaves: { successes: 0, failures: 0 }
        })),
        currentTurn: 0,
        round: 3
    },
    calendar: {
        day: 12,
        month: 3,
        year: 1492,
        events: reihe(8, i => ({
            id: i,
            day: i + 1,
            month: 3,
            year: 1492,
            title: `Ein Ereignis mit laengerem Titel ${zz(i)}`,
            typ: 'manuell'
        }))
    },
    tags: reihe(6, i => ({ id: i, name: `Schlagwort ${zz(i)}`, color: '#c8a44a' })),
    filters: [],
    soundboard: { scenes: [] },
    dmScreenNotes: 'Notizen des Spielleiters mit genug Text.',
    _nextId: {
        characters: 99,
        npcs: 99,
        locations: 99,
        quests: 99,
        encounters: 99,
        spells: 99,
        loot: 99,
        items: 99,
        wiki: 99,
        sessionNotes: 99,
        randomTables: 99,
        bestiary: 99,
        shops: 99,
        factions: 99,
        sessionPreps: 99,
        storyArcs: 99,
        timers: 99,
        links: 99
    }
};

/**
 * Laedt das gebaute Buendel mit der gefuellten Saat.
 * @param {import('@playwright/test').Page} page
 */
async function appLaden(page) {
    await page.addInitScript(s => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(s));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng. Faellt
            // es aus, greift der Leerzustand — und DEN faengt Zusicherung 3.
        }
    }, SAAT);
    await page.goto(APP_URL);
    await page.waitForSelector('.app-title', { state: 'attached', timeout: 25000 });
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, {
        timeout: 25000
    });
    await page.waitForTimeout(400);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
async function reiterWechseln(page, name) {
    await page.evaluate(n => {
        // @ts-ignore — global aus der Navigation
        if (typeof window.switchView === 'function') window.switchView(n);
    }, name);
    await page.waitForTimeout(260);
}

/**
 * Ueberhang in X und JEDES Element der aktiven Ansicht, das rechts des
 * Fensterrands endet. Laeuft IM Browser.
 */
function messeUeberhang() {
    const de = document.documentElement;
    const kurz = e => {
        let s = e.tagName.toLowerCase();
        if (e.id) s += '#' + e.id;
        s += [...e.classList]
            .slice(0, 3)
            .map(c => '.' + c)
            .join('');
        return s;
    };
    const aussen = [];
    const aktiv = document.querySelector('.view.active');
    if (aktiv) {
        for (const e of aktiv.querySelectorAll('*')) {
            const b = e.getBoundingClientRect();
            /* 1px Toleranz: Rahmen und Zwischenraeume loesen zu nicht-ganzen
               Bildpunkten auf, und ein halber Bildpunkt ist kein Ueberhang. */
            if (b.width > 0 && b.right > window.innerWidth + 1) {
                aussen.push({
                    sel: kurz(e),
                    breite: Math.round(b.width),
                    rechts: Math.round(b.right)
                });
            }
        }
    }
    aussen.sort((a, b) => b.breite - a.breite);
    return {
        ueberhangX: Math.max(0, Math.round(de.scrollWidth - de.clientWidth)),
        layout: de.dataset.layout || '(keins)',
        aussenAnzahl: aussen.length,
        aussen: aussen.slice(0, 3)
    };
}

/** Belegt, dass die gefuellte Saat tatsaechlich angekommen UND gerendert ist. */
function messeFuellung() {
    // @ts-ignore — globaler Datenkern
    const D = window.D || {};
    const zahl = sel => document.querySelectorAll(sel).length;
    return {
        figuren: (D.characters || []).length,
        nscs: (D.npcs || []).length,
        orte: (D.locations || []).length,
        auftraege: (D.quests || []).length,
        kaempfer: ((D.initiative || {}).combatants || []).length,
        fraktionen: (D.factions || []).length,
        /* Gerendert, nicht nur gespeichert: genau diese vier Knoten trugen die
           vier Ursachen. Waere die Saat nicht angekommen, waeren sie leer und
           die Ueberhang-Zusicherung waere gruen, ohne etwas zu belegen. */
        dashFiguren: zahl('#view-dashboard .dash-char'),
        initZeilen: zahl('#view-initiative .init-entry'),
        frKarten: zahl('#view-fraktionen .fr-faction-card'),
        wuerfelFeld: zahl('#view-dice .dice-formula')
    };
}

test.describe('Seitlicher Ueberhang auf Telefonbreiten (Q1)', () => {
    for (const [breite, hoehe] of FENSTER) {
        test(`(1) kein Ueberhang in allen 24 Ansichten bei ${breite}x${hoehe}`, async ({
            page
        }) => {
            test.setTimeout(90000);
            await page.setViewportSize({ width: breite, height: hoehe });
            await appLaden(page);

            /** @type {Record<string, any>} */
            const befund = {};
            for (const v of ANSICHTEN) {
                await reiterWechseln(page, v);
                befund[v] = await page.evaluate(messeUeberhang);
            }

            const schlecht = ANSICHTEN.filter(v => befund[v].ueberhangX > 0);
            console.log(
                `[Q1] ${breite}x${hoehe} (Layout ${befund.dashboard.layout}): ` +
                    `${ANSICHTEN.length - schlecht.length}/${ANSICHTEN.length} ohne Ueberhang` +
                    (schlecht.length
                        ? ' — ' +
                          schlecht
                              .map(
                                  v =>
                                      `${v} ${befund[v].ueberhangX}px (n=${befund[v].aussenAnzahl}, ` +
                                      befund[v].aussen
                                          .map(t => `${t.sel} ${t.breite}px`)
                                          .join(' | ') +
                                      ')'
                              )
                              .join('; ')
                        : '')
            );

            /* Alle vier Fenster liegen im Mobil-Profil — 740x360 ueber die
               Querformat-Regel. Steht hier `desktop`, misst die Probe etwas
               anderes als sie behauptet. */
            expect(befund.dashboard.layout, 'Layoutprofil').toBe('mobile');

            // ZUSICHERUNG 1 — nichts scrollt seitwaerts.
            expect(
                schlecht.map(v => `${v}=${befund[v].ueberhangX}px`),
                `Ansichten mit seitlichem Ueberhang bei ${breite}x${hoehe}`
            ).toEqual([]);

            /* ZUSICHERUNG 2 — und zwar, weil es passt, nicht weil es versteckt
               ist. Ein `overflow-x: hidden` an einem Vorfahren macht
               Zusicherung 1 gruen und laesst die Knoepfe trotzdem ausserhalb
               liegen; diese Zusicherung sieht auf jedes Element einzeln. */
            const verdeckt = ANSICHTEN.filter(v => befund[v].aussenAnzahl > 0);
            expect(
                verdeckt.map(v => `${v}=${befund[v].aussenAnzahl} Elemente`),
                `Elemente rechts des Fensterrands bei ${breite}x${hoehe} — versteckter Ueberlauf ist kein behobener`
            ).toEqual([]);
        });
    }

    test('(2) die Saat ist gefuellt — ohne Daten ist der Fall gar nicht da', async ({ page }) => {
        test.setTimeout(60000);
        await page.setViewportSize({ width: 320, height: 700 });
        await appLaden(page);
        /* Die vier Taeter-Ansichten einmal anfahren, damit ihre Knoten
           tatsaechlich gerendert sind. */
        for (const v of ['dashboard', 'initiative', 'dice', 'fraktionen']) {
            await reiterWechseln(page, v);
        }
        const f = await page.evaluate(messeFuellung);
        console.log(`[Q1] Fuellstand: ${JSON.stringify(f)}`);

        // ZUSICHERUNG 3 — die Daten sind da.
        expect(
            {
                figuren: f.figuren >= 5,
                nscs: f.nscs >= 12,
                orte: f.orte >= 10,
                auftraege: f.auftraege >= 8,
                kaempfer: f.kaempfer >= 10,
                fraktionen: f.fraktionen >= 5
            },
            `Fuellstand ${JSON.stringify(f)} — auf leerer Kampagne ist der Ueberhang 0 und Zusicherung 1 waere blind`
        ).toEqual({
            figuren: true,
            nscs: true,
            orte: true,
            auftraege: true,
            kaempfer: true,
            fraktionen: true
        });

        // ZUSICHERUNG 4 — und sie sind gerendert, nicht nur gespeichert.
        expect(
            {
                dashFiguren: f.dashFiguren >= 5,
                initZeilen: f.initZeilen >= 10,
                frKarten: f.frKarten >= 5,
                wuerfelFeld: f.wuerfelFeld >= 1
            },
            `gerenderte Knoten ${JSON.stringify(f)} — genau diese vier trugen die vier Ursachen`
        ).toEqual({
            dashFiguren: true,
            initZeilen: true,
            frKarten: true,
            wuerfelFeld: true
        });
    });

    for (const [breite, hoehe] of DESKTOP_FENSTER) {
        test(`(3) Desktop bleibt unberuehrt bei ${breite}x${hoehe}`, async ({ page }) => {
            test.setTimeout(90000);
            await page.setViewportSize({ width: breite, height: hoehe });
            await appLaden(page);

            /** @type {Record<string, any>} */
            const befund = {};
            for (const v of ANSICHTEN) {
                await reiterWechseln(page, v);
                befund[v] = await page.evaluate(messeUeberhang);
            }
            const schlecht = ANSICHTEN.filter(v => befund[v].ueberhangX > 0);
            console.log(
                `[Q1] Desktop ${breite}x${hoehe} (Layout ${befund.dashboard.layout}): ` +
                    `${ANSICHTEN.length - schlecht.length}/${ANSICHTEN.length} ohne Ueberhang`
            );

            expect(befund.dashboard.layout, 'Layoutprofil').toBe('desktop');
            expect(
                schlecht.map(v => `${v}=${befund[v].ueberhangX}px`),
                `Ansichten mit seitlichem Ueberhang bei ${breite}x${hoehe}`
            ).toEqual([]);

            /* Die Korrektur der Master-Detail-Familie fasst nur den Zweig unter
               900px an. Hier steht die Gegenprobe, dass die ZWEI Spalten auf dem
               Desktop erhalten bleiben — ein `minmax(0, 1fr)` zu viel haette die
               Detail-Spalte verschluckt. */
            const spalten = await page.evaluate(() => {
                const w = {};
                for (const sel of ['.loc-layout', '.npc-layout', '.loot-layout', '.fr-layout']) {
                    const e = document.querySelector(sel);
                    w[sel] = e ? getComputedStyle(e).gridTemplateColumns.split(/\s+/).length : null;
                }
                return w;
            });
            console.log(`[Q1] Desktop-Spalten ${breite}x${hoehe}: ${JSON.stringify(spalten)}`);
            expect(spalten, `Spaltenzahl der Master-Detail-Schalen bei ${breite}x${hoehe}`).toEqual(
                {
                    '.loc-layout': 2,
                    '.npc-layout': 2,
                    '.loot-layout': 2,
                    '.fr-layout': 2
                }
            );
        });
    }
});
