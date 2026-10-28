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
 * Fuenf der sechs Ursachen unten sind datenabhaengig: eine Rasterspalte oder
 * eine Flex-Reihe, deren automatisches Minimum der min-content-Breite ihres
 * INHALTS folgt — ohne Inhalt gibt es nichts, dem sie folgen koennte. Auf einer
 * leeren Kampagne messen sie 0, und eine Probe mit kurzer Saat waere bei ihnen
 * gruen und zugleich blind. Derselbe Fehler hat in diesem Projekt schon einmal
 * drei Wochen getragen (die Listen-Schalen: der Verlust begann ab dem 10.
 * Eintrag, die Testseeds waren kuerzer). Darum steht hier neben der
 * Ueberhang-Zusicherung eine zweite, die BELEGT, dass die Saat angekommen ist —
 * faellt sie je wieder auf Leerstand zurueck, schlaegt die Probe an statt
 * stillzuhalten.
 *
 *   BERICHTIGUNG (Runde 1): hier stand "Auf einer LEEREN Kampagne ist der
 *   Ueberhang in allen 24 Ansichten NULL" und "Jede der vier Ursachen ist eine
 *   Rasterspalte". Beides war zu weit gefasst. Nachgemessen am gebauten Buendel
 *   mit dem CSS von f6cc6f7, Mobil-Profil, alle Falten aufgeklappt, in zwei
 *   Varianten von Leerstand (Saat mit 0 Datensaetzen je Sammlung und ein
 *   voellig frisches Browserprofil ohne jeden localStorage-Eintrag): die
 *   Wuerfel-Ansicht ragt auch bei 0 Datensaetzen 72px hinaus (320x700) bzw. 2px
 *   (390x844), die uebrigen 23 messen 0. Grund: Fall 4, `.dice-formula`, ist
 *   kein Raster, und das inhaltsbasierte Minimum eines Formularfelds haengt
 *   nicht an der Kampagne, sondern an der `size`-Vorgabe des `<input>`. Die
 *   Saat und die Zusicherungen bleiben davon unberuehrt — die anderen fuenf
 *   Faelle brauchen die Daten weiterhin, und ohne sie waere die Probe genau so
 *   blind wie beschrieben. Falsch war nur die Begruendung, und die ist die
 *   Stelle, die kuenftigen Lesern erklaert, warum die Saat bleiben muss.
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
 * ZWEI WEITERE, die erst ZUSICHERUNG 2 sichtbar gemacht hat. Beide standen
 * schon vor dieser Runde im Baum; die Seite scrollte bei ihnen NICHT, der
 * Inhalt lag aber trotzdem ausserhalb. Genau dafuer gibt es die zweite
 * Zusicherung:
 *
 *   Quests      `.quest-title-row` ist `flex: 1` in `.quest-header`
 *               (`justify-content: space-between`), hatte aber `min-width: auto`
 *               und konnte deshalb nicht unter ihre min-content-Breite von
 *               303px schrumpfen. Die Done/Loot-Marken daneben wurden
 *               hinausgedrueckt und von `.quest-item { overflow: hidden }`
 *               abgeschnitten: bei 320x700 lagen sie VOLLSTAENDIG draussen
 *               (Beginn x=328 in einem 320px breiten Fenster) und waren damit
 *               nicht antippbar. Das Dokument meldete 0 Ueberhang — der Fall,
 *               vor dem Zusicherung 2 steht.
 *   Wuerfel     `#dice-char-select` in `.dice-char-header`, dieselbe Bauart wie
 *               `.dice-formula`: `flex: 1` ohne `min-width: 0`, und das
 *               inhaltsbasierte Minimum einer Auswahlliste ist die Breite ihres
 *               laengsten Eintrags. Der "🎯 Init"-Knopf daneben rutschte
 *               hinaus. Sichtbar erst mit AUFGEKLAPPTER Falte, siehe
 *               `faltenOeffnen()` weiter unten.
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
 * Und die beiden GEKLIPPTEN, nach den vier Raster-/Flex-Korrekturen und mit
 * aufgeklappten Falten gemessen — Spalte 1 ist der Ueberhang des Dokuments,
 * Spalte 2 die Zahl der Elemente ausserhalb:
 *
 *   Ansicht     320x700          360x740          390x844        740x360
 *   ---------   --------------   --------------   -------------  -------
 *   Quests      0px (n=48)       0px (n=32)       0px (n=24)     0
 *   Wuerfel     50px (n=1)       10px (n=1)       0px (n=0)      0
 *
 * DREI ZUSTANDSFLAECHEN DER KAMPFZEILE, die bis Runde 2 keine Saat erreichte.
 * Die sechs Ursachen oben haengen an der MENGE der Daten; diese drei haengen am
 * ZUSTAND. Sie stehen ueberhaupt nur im Markup, wenn der Kampf sie verlangt:
 *
 *   Todesrettung   `.death-saves` (`display: flex`, `flex-wrap: nowrap`) steht
 *                  in `.init-info` und rendert nur fuer einen SPIELER bei 0
 *                  Trefferpunkten (`features/initiative.js:181`). Sie braucht
 *                  277px und bekommt die 128px der `minmax(0, 1fr)`-Namensspalte
 *                  — die sechs 16px-Punkte sind Tippziele und schrumpfen nicht.
 *                  Der letzte lag bei x=431..447, in JEDEM der drei Fenster
 *                  gleich, also vollstaendig ausserhalb.
 *   Konzentration  `.concentration-badge` ist `inline-flex` OHNE `max-width`,
 *                  und `.conc-spell` deckelte den Namen auf feste 120px statt
 *                  ihn schrumpfen zu lassen. Die Marke wuchs damit aus der
 *                  128px-Spalte heraus, sobald der Zaubername lang wurde.
 *                  Gemessen mit echten deutschen Konzentrationszaubern bei
 *                  320x700: "Segnen" (6) 0px · "Dunkelheit" (10) 0px ·
 *                  "Verlangsamen" (12) 1px · "Unsichtbarkeit" (14) 3px ·
 *                  "Spinnenklettern" (15) 11px · "Person bezaubern" (16) 22px ·
 *                  "Schild des Glaubens" (19) 33px. Beim letzten lag der
 *                  ✕-Knopf (Konzentration abbrechen) bei x=320..342 in einem
 *                  320px breiten Fenster, also GANZ drauszen.
 *   Konz.-Probe    `.concentration-check-banner` (ebenfalls nowrap) erscheint,
 *                  sobald der Spielleiter einem konzentrierenden Kaempfer
 *                  Schaden gibt (`concentration.pendingCheck`). Sie braucht
 *                  221px in 128px; der Knopf fuer den KON-Rettungswurf lag bei
 *                  x=336..391, der Wert `DC 22` bei x=304..326 — beide
 *                  ausserhalb.
 *
 * ROT OHNE DIESE DREI KORREKTUREN, je EINZELN gemessen (ein Kaempfer, sonst
 * leere Kampagne, Theme `dark`; die Konzentrationsmarke zusaetzlich in `light`,
 * `sepia` und `contrast` auf den Bildpunkt gleich — die Ursachen sind Raster und
 * Flex, nicht Farbe):
 *
 *   Zustand                              320x700      390x844
 *   ----------------------------------   ----------   ---------
 *   0 TP, Todesrettung 1/2               127px (10)   57px (5)
 *   Konzentration "Schild des Glaubens"   33px (2)     0px (0)
 *   offene Probe, pendingCheck 22         71px (2)     1px (0)
 *
 * Und ZUSAMMEN, wie die Saat unten sie stellt (drei der zehn Kaempfer tragen je
 * einen Zustand) — das ist der Rotwert, den DIESE Probe meldet:
 *
 *   Ansicht     320x700          360x740          390x844        740x360
 *   ---------   --------------   --------------   -------------  -------
 *   Initiative  127px (n=14)     87px (n=7)       57px (n=5)     0
 *   uebrige 23  0                0                0              0
 *
 * WARUM UMBRECHEN UND NICHT SCHRUMPFEN, bei zwei der drei: die Todeswurf-Punkte
 * und der Wuerfelknopf sind Tippflaechen und duerfen nicht unter die
 * Fingergroesse gedrueckt werden — dieselbe Begruendung wie bei `.init-right`
 * in Runde 1. Nur beim Zaubernamen ist Abkuerzen zulaessig, weil der volle Name
 * im `title` der Marke steht (`renderConcentration()` in
 * `initiative-combat-widgets.js:294`, unter `features/`).
 *
 *   OHNE VERZEICHNISPRAEFIX, UND ZWAR ABSICHTLICH. Das Abdeckungs-Gate
 *   (`tests/unit/module-test-coverage.test.js`) haelt ein Modul fuer von einem
 *   Test angefasst, sobald sein loader-relativer Pfad WOERTLICH irgendwo unter
 *   `tests/` steht — auch in einem blossen Kommentar. Diese Probe LIEST das
 *   Modul aber nicht, sie misst nur die Flaeche, die es zeichnet. Stuende der
 *   volle Pfad hier, wuerde das Modul aus der Ausnahmeliste fallen und waere
 *   damit dauerhaft und unsichtbar aus dem Gate heraus — die Liste darf nur
 *   schrumpfen, und zwar nur, wenn ein Test den Pfad in AUSFUEHRBAREM Code
 *   fuehrt (so steht es in der Ausnahmeliste selbst, Eintraege vom 2026-09-28
 *   und 2026-09-29). `features/initiative.js` oben ist unschaedlich: dieses
 *   Modul steht gar nicht auf der Liste.
 *
 * WARUM ZUSICHERUNG 4 MITWACHSEN MUSS. Dass die Probe diese drei Faelle bis
 * Runde 2 gruen durchlief, lag nicht an den Zusicherungen, sondern an der SAAT:
 * zehn Kaempfer mit `currentHp: 20`, `spell: 'Segnen'` und `pendingCheck: 0`
 * erzeugen keine der drei Flaechen, und was nicht im Markup steht, kann nicht
 * hinausragen. `initZeilen` in Zusicherung 4 deckte das nicht ab — es zaehlt
 * die ZEILEN, nicht die Zustaende darin. Zusicherung 4 zaehlt deshalb jetzt
 * auch die drei Zustandsknoten und die Laenge des Zaubernamens; mit der zahmen
 * Saat von vorher ist sie rot (`initTodeswuerfe` 0, `initKonzKnopf` 0,
 * `initKonzNameLaenge` 6 — gemessen).
 *
 * 740x360 (Telefon im Querformat) ist auch ohne Korrektur frei: 740px Breite
 * liegen ueber allen neun min-content-Schranken. Der Fall bleibt trotzdem in
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
 * `assets/styles/initiative.css` (Mobil-Zweig von `.init-entry`, `.death-saves`,
 * `.concentration-badge`/`.conc-spell`, `.concentration-check-banner`),
 * `assets/styles/dice.css` (`.dice-formula`, `.dice-char-header select`),
 * `assets/styles/core.css` (Master-Detail-Familie unter 900px,
 * `.quest-title-row`).
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

/* Die vier Themes der App, fuer ZUSICHERUNG 6 weiter unten. Die fuenf
   Zusicherungen darueber messen nur `dark` — das setzt die Saat, und
   `setTheme()` rufen sie nie. */
const THEMES = ['dark', 'light', 'sepia', 'contrast'];

/* Drei Wuerfelformeln, von kurz nach lang, fuer ZUSICHERUNG 5. Die laengste ist
   nicht erfunden: `4d6kh3` steht so im Platzhalter des Feldes
   (assets/templates/view-tools.html), und einen zweiten Wuerfelsatz plus festen
   Zuschlag anzuhaengen ist der Alltag einer Schadensformel. Die kuerzeste,
   `1d20`, ist die Untergrenze: ein Feld, in dem nicht einmal sie vollstaendig
   steht, ist kein Eingabefeld mehr. */
const FORMELN = ['1d20', '2d20+5', '4d6kh3+2d8+5'];

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
        /* DREI KAEMPFER TRAGEN EINEN ZUSTAND, DEN DIE RUHIGE ZEILE NICHT HAT.
           Siehe "DREI ZUSTANDSFLAECHEN" im Kopfkommentar: die Zustandsflaechen
           der Kampfzeile stehen nur im Markup, wenn der Kampf sie verlangt, und
           eine Saat aus zehn gleich gesunden Kaempfern erzeugt keine davon.
           Die Zuordnung haengt am Index, damit sie beim Lesen nachzaehlbar ist:
             i=1  aktive Konzentration mit einem LANGEN Zauber (19 Zeichen) —
                  auch der Kaempfer, der gerade am Zug ist (currentTurn 0)
             i=3  bei 0 Trefferpunkten mit zwei Fehlschlaegen → Todesrettung
             i=5  offene Konzentrationsprobe (pendingCheck 22) → Pruefbanner
           Alle drei Indizes sind ungerade, also `type: 'player'` — die
           Todesrettung rendert nur fuer Spieler (features/initiative.js:181). */
        combatants: reihe(10, i => ({
            id: i,
            name: `Kaempfer mit langem Namen ${zz(i)}`,
            initiative: 20 - i,
            currentHp: i === 3 ? 0 : 20,
            maxHp: 30,
            ac: 15,
            type: i % 2 ? 'player' : 'enemy',
            conditions: i % 3 === 0 ? ['Betaeubt'] : [],
            concentration: {
                active: i === 1 || i === 5,
                /* Ein ECHTER langer Konzentrationszauber, kein Platzhalter:
                   "Schild des Glaubens" ist mit 19 Zeichen der laengste der
                   gaengigen Konzentrationszauber und der Fall, der die Marke am
                   weitesten hinausschob. */
                spell: i === 1 ? 'Schild des Glaubens' : 'Segnen',
                pendingCheck: i === 5 ? 22 : 0
            },
            deathSaves: i === 3 ? { successes: 1, failures: 2 } : { successes: 0, failures: 0 }
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
    /* ACHT KLANGSZENEN, DIE ERSTEN FUENF AUF DEN SCHNELLPLAETZEN.
       Hier stand `{ scenes: [] }`. Die Soundboard-Ansicht rendert daraus ihre
       Leerflaeche — nachgemessen 22 Knoten gegen 330 mit Szenen. Die Probe lief
       damit ueber 24 Ansichten, von denen EINE leer war: fuer sie war die
       Ueberhang-Zusicherung vakant, weil es nichts gab, das hinausragen
       koennte. Genau die Blindheit, gegen die der Kopfkommentar dieser Datei
       argumentiert, eine Ebene tiefer.
       Die Ansicht ist mit Szenen gemessen SAUBER (0px Ueberhang, 0 Elemente
       ausserhalb, in allen vier Fenstern und allen vier Themes) — es wird also
       kein Fehler zugedeckt, sondern eine vakante Zusicherung besetzt.
       `slot` 1..5 belegt die Schnellplaetze (Alt+Shift+1..5), drei Spuren je
       Szene und lange Namen sind der breitere Fall. */
    soundboard: {
        scenes: reihe(8, i => ({
            id: i,
            name: `Klangszene mit einem ziemlich langen Namen ${zz(i)}`,
            slot: i <= 5 ? i : null,
            tracks: reihe(3, j => ({ blobId: `blob-${zz(i)}-${zz(j)}`, volume: 0.6 }))
        }))
    },
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

/* Die breitere der beiden Schriftmetriken, die auf der laufenden Plattform zu
   haben sind — Zusicherung 7 braucht sie. Verdana laeuft 1.1554x breiter als
   'Segoe UI' (gemessen am Knopftext "+ Neuer Charakter", 14px: 114.75 ->
   132.59px) und damit einen Prozentpunkt breiter als die Schrift der
   Linux-Runner (~1.145, am CI-Befund kalibriert). Courier New hat 0.600em
   Vorschub gegen Consolas 0.550em; DejaVu Sans Mono, das Linux greift, 0.602em.
   Auf einem Linux-Runner ist Verdana nicht installiert und die Kette faellt auf
   dieselbe Standardschrift wie die der App — dort misst die Zusicherung also die
   ECHTE Metrik des Runners. Das `!important` zaehlt nicht in die F-18-Ratsche:
   die zaehlt assets/styles/, nicht das Stilblatt eines Testlaufs. */
const BREITE_SCHRIFT =
    ':root { --font-ui: Verdana, sans-serif !important; ' +
    '--font-mono: "Courier New", monospace !important; }';

/**
 * Laedt das gebaute Buendel mit der gefuellten Saat.
 * @param {import('@playwright/test').Page} page
 * @param {{breiteSchrift?: boolean}} [opt] `breiteSchrift` haengt BREITE_SCHRIFT
 *   als erstes Kopfkind ein — vor den App-Stilen, damit die App ihre Messtokens
 *   beim Start schon gegen die endgueltige Schrift setzt.
 */
async function appLaden(page, opt = {}) {
    if (opt.breiteSchrift) {
        await page.addInitScript(quelltext => {
            const einfuegen = () => {
                if (!document.head) return false;
                const s = document.createElement('style');
                s.id = 'breite-schrift-probe';
                s.textContent = quelltext;
                document.head.insertBefore(s, document.head.firstChild);
                return true;
            };
            if (!einfuegen()) {
                const mo = new MutationObserver(() => {
                    if (einfuegen()) mo.disconnect();
                });
                mo.observe(document, { childList: true, subtree: true });
            }
        }, BREITE_SCHRIFT);
    }
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
 * Klappt JEDE `<details>`-Falte der aktiven Ansicht auf.
 *
 * WARUM DAS NOETIG IST UND KEINE UEBERGENAUIGKEIT. Chrome gibt dem Inhalt
 * einer geschlossenen `<details>` `content-visibility: hidden`: er wird
 * ausgelegt, aber nicht gezeichnet UND traegt nichts zum Scrollueberlauf des
 * Dokuments bei. Ein Ueberhang hinter einer zugeklappten Falte ist deshalb an
 * `scrollWidth - clientWidth` NICHT zu sehen — er erscheint in der Sekunde, in
 * der der Spielleiter die Falte antippt. Genau so war es bei den
 * Charakter-Wuerfen: zugeklappt meldete das Dokument 0, aufgeklappt 50px bei
 * 320x700 und 10px bei 360x740. Eine Probe, die nur den Grundzustand misst,
 * waere fuer jede gefaltete Flaeche der App blind.
 *
 * @param {import('@playwright/test').Page} page
 */
async function faltenOeffnen(page) {
    await page.evaluate(() => {
        const aktiv = document.querySelector('.view.active');
        if (!aktiv) return;
        aktiv.querySelectorAll('details').forEach(d => {
            d.open = true;
        });
    });
    await page.waitForTimeout(200);
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
    /**
     * DIE EINE AUSNAHME, und warum sie den Waechter nicht aufweicht (C1/R1).
     *
     * Zusicherung 2 sagt: "versteckter Ueberlauf ist kein behobener". Das
     * stimmt — ein `overflow: hidden` am Vorfahren macht den Seitenueberhang
     * gruen und laesst den Knopf trotzdem unerreichbar. Ein `overflow-x: auto`
     * ist aber nicht dasselbe: dort IST der Inhalt erreichbar, man rollt ihn
     * heran. Die Chipreihen der vier Listen-Schalen sind seit C1/R1 genau das —
     * ein einzeiliger Rollstreifen statt vier Umbruchzeilen (core.css), weil
     * die Umbruchzeilen der Listenspalte ihren Platz nahmen.
     *
     * Die Ausnahme ist deshalb an DREI Bedingungen gebunden:
     *   (a) ein Vorfahre rollt auf der X-Achse AUSDRUECKLICH (`auto`/`scroll`,
     *       nie `hidden`),
     *   (b) er rollt TATSAECHLICH (`scrollWidth > clientWidth`) — eine
     *       Rollachse ohne Inhalt dahinter entschuldigt nichts,
     *   (c) und sein EIGENER rechter Rand liegt im Fenster. Ragt der Behaelter
     *       selbst hinaus, ist er der Befund und keine Entschuldigung.
     * Was unter die Ausnahme fiele, wird nicht verschwiegen, sondern als
     * `imStreifen` gezaehlt und ausgegeben: eine Ausnahme, die in der Ausgabe
     * nicht auftaucht, ist eine stille Freigabe.
     */
    const rollstreifen = e => {
        let p = e.parentElement;
        while (p && p !== de) {
            const cs = getComputedStyle(p);
            if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') {
                const pb = p.getBoundingClientRect();
                if (p.scrollWidth > p.clientWidth && pb.right <= window.innerWidth + 1) return p;
            }
            p = p.parentElement;
        }
        return null;
    };
    const aussen = [];
    const imStreifen = [];
    const aktiv = document.querySelector('.view.active');
    if (aktiv) {
        for (const e of aktiv.querySelectorAll('*')) {
            const b = e.getBoundingClientRect();
            /* 1px Toleranz: Rahmen und Zwischenraeume loesen zu nicht-ganzen
               Bildpunkten auf, und ein halber Bildpunkt ist kein Ueberhang. */
            if (b.width > 0 && b.right > window.innerWidth + 1) {
                const streifen = rollstreifen(e);
                (streifen ? imStreifen : aussen).push({
                    sel: kurz(e),
                    breite: Math.round(b.width),
                    rechts: Math.round(b.right),
                    streifen: streifen ? kurz(streifen) : null
                });
            }
        }
    }
    aussen.sort((a, b) => b.breite - a.breite);
    return {
        ueberhangX: Math.max(0, Math.round(de.scrollWidth - de.clientWidth)),
        layout: de.dataset.layout || '(keins)',
        aussenAnzahl: aussen.length,
        aussen: aussen.slice(0, 3),
        imStreifenAnzahl: imStreifen.length,
        imStreifen: imStreifen.slice(0, 3)
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
        /* Faellt die Saat je auf `{ scenes: [] }` zurueck, rendert die
           Soundboard-Ansicht ihre Leerflaeche und ist aus der Ueberhang-Probe
           faktisch heraus, ohne dass eine Zusicherung das meldet. */
        szenen: ((D.soundboard || {}).scenes || []).length,
        /* Gerendert, nicht nur gespeichert: genau diese Knoten trugen die
           sechs Ursachen. Waere die Saat nicht angekommen, waeren sie leer und
           die Ueberhang-Zusicherung waere gruen, ohne etwas zu belegen. */
        dashFiguren: zahl('#view-dashboard .dash-char'),
        initZeilen: zahl('#view-initiative .init-entry'),
        frKarten: zahl('#view-fraktionen .fr-faction-card'),
        wuerfelFeld: zahl('#view-dice .dice-formula'),
        questZeilen: zahl('#view-quests .quest-title-row'),
        wuerfelWahl: zahl('#view-dice #dice-char-select'),
        /* DIE DREI ZUSTANDSFLAECHEN DER KAMPFZEILE. Sie stehen nur im Markup,
           wenn der Kampf sie verlangt — 0 Trefferpunkte, aktive Konzentration,
           offene Probe. Eine Saat aus zehn gleich gesunden Kaempfern erzeugt
           keine davon, und dann sind Zusicherung 1 und 2 fuer sie blind, weil
           es nichts zu messen gibt. `initZeilen` oben deckt das NICHT ab: es
           zaehlt die Zeilen, nicht die Zustaende darin. Faellt die Saat je auf
           zehn gesunde Kaempfer zurueck, schlaegt Zusicherung 4 an. */
        initTodeswuerfe: zahl('#view-initiative .death-saves'),
        initKonzMarke: zahl('#view-initiative .concentration-badge'),
        initKonzKnopf: zahl('#view-initiative .conc-roll-btn'),
        /* Und der Zaubername muss LANG sein: bei "Segnen" (6 Zeichen) bleibt
           die Marke innerhalb der Spalte, der Fall entsteht erst ab 12. */
        initKonzNameLaenge: Math.max(
            0,
            ...[...document.querySelectorAll('#view-initiative .conc-spell')].map(
                e => (e.textContent || '').trim().length
            )
        )
    };
}

/**
 * Lage UND Lesbarkeit des Wuerfel-Formelfelds. Laeuft IM Browser.
 *
 * `scrollWidth > clientWidth` an einem `<input>` heiszt: der eingetippte Text
 * ist breiter als die sichtbare Flaeche, das Feld scrollt intern, und man sieht
 * nur einen Ausschnitt seiner eigenen Formel. Das ist etwas anderes als
 * Ueberhang — das Feld liegt dabei vollstaendig im Fenster. Genau deshalb
 * braucht es diese Messung neben den beiden oberen: Zusicherung 1 und 2 sind
 * fuer ein 55px schmales Feld blind, weil 55px bequem ins Fenster passen.
 */
function messeFormelfeld() {
    const f = /** @type {HTMLInputElement|null} */ (
        document.querySelector('#view-dice .dice-formula')
    );
    if (!f) return null;
    const b = f.getBoundingClientRect();
    return {
        scrollW: f.scrollWidth,
        clientW: f.clientWidth,
        breite: Math.round(b.width),
        rechts: Math.round(b.right),
        fenster: window.innerWidth,
        wert: f.value
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
                await faltenOeffnen(page);
                befund[v] = await page.evaluate(messeUeberhang);
            }

            const schlecht = ANSICHTEN.filter(v => befund[v].ueberhangX > 0);
            const inStreifen = ANSICHTEN.filter(v => befund[v].imStreifenAnzahl > 0);
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
                        : '') +
                    (inStreifen.length
                        ? ' · in Rollstreifen (erlaubt): ' +
                          inStreifen
                              .map(
                                  v =>
                                      `${v} ${befund[v].imStreifenAnzahl}x in ` +
                                      `${befund[v].imStreifen[0] && befund[v].imStreifen[0].streifen}`
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
               liegen; diese Zusicherung sieht auf jedes Element einzeln.
               EINE AUSNAHME, seit C1/R1: ein Element in einem ausdruecklich
               waagerecht rollenden Behaelter zaehlt nicht als ausserhalb — es
               ist erreichbar, man rollt es heran. Die drei Bedingungen und die
               Gegenbuchung (`imStreifen`, oben mit ausgegeben) stehen an
               messeUeberhang(). */
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
        /* Die fuenf Taeter-Ansichten einmal anfahren, damit ihre Knoten
           tatsaechlich gerendert sind. */
        for (const v of ['dashboard', 'initiative', 'dice', 'fraktionen', 'quests']) {
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
                fraktionen: f.fraktionen >= 5,
                /* Die Soundboard-Ansicht war bis zu dieser Runde die eine der
                   24, die leer durch die Probe lief — siehe Kommentar an
                   `soundboard` in der Saat. */
                szenen: f.szenen >= 8
            },
            `Fuellstand ${JSON.stringify(f)} — auf leerer Kampagne ist der Ueberhang 0 und Zusicherung 1 waere blind`
        ).toEqual({
            figuren: true,
            nscs: true,
            orte: true,
            auftraege: true,
            kaempfer: true,
            fraktionen: true,
            szenen: true
        });

        // ZUSICHERUNG 4 — und sie sind gerendert, nicht nur gespeichert.
        expect(
            {
                dashFiguren: f.dashFiguren >= 5,
                initZeilen: f.initZeilen >= 10,
                frKarten: f.frKarten >= 5,
                wuerfelFeld: f.wuerfelFeld >= 1,
                questZeilen: f.questZeilen >= 8,
                wuerfelWahl: f.wuerfelWahl >= 1,
                /* Die drei Zustandsflaechen der Kampfzeile, je einmal. */
                initTodeswuerfe: f.initTodeswuerfe >= 1,
                initKonzMarke: f.initKonzMarke >= 1,
                initKonzKnopf: f.initKonzKnopf >= 1,
                initKonzNameLang: f.initKonzNameLaenge >= 12
            },
            `gerenderte Knoten ${JSON.stringify(f)} — genau diese Knoten trugen die neun Ursachen`
        ).toEqual({
            dashFiguren: true,
            initZeilen: true,
            frKarten: true,
            wuerfelFeld: true,
            questZeilen: true,
            wuerfelWahl: true,
            initTodeswuerfe: true,
            initKonzMarke: true,
            initKonzKnopf: true,
            initKonzNameLang: true
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
                await faltenOeffnen(page);
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

    /* ZUSICHERUNG 5 — DAS FORMELFELD MUSS NICHT NUR IM FENSTER LIEGEN,
       MAN MUSS AUCH LESEN KOENNEN, WAS DRINSTEHT.
       ------------------------------------------------------------------
       Die Korrektur an `.dice-formula` (`min-width: 0`) hat den Ueberhang der
       Wuerfel-Ansicht beseitigt, indem sie das Feld schrumpfen liess — und in
       der nowrap-Reihe `.dice-input-group` blieben bei 320px genau 55px uebrig
       (242px Innenraum minus Anzahl 50, "x" 11, Wurfknopf 50, Wiederholknopf 44
       und vier Abstaende a 8 = 155 + 32). In 53px Innenbreite steht nicht einmal
       `1d20` vollstaendig: gemessen 59px Textbreite. Ueberhang war damit gegen
       Lesbarkeit getauscht, und ZUSICHERUNG 1 UND 2 SIND DAGEGEN BLIND — ein
       55px schmales Feld liegt bequem im Fenster, es scrollt nur innen.
       Deshalb steht hier eine eigene Zusicherung, die nicht die Lage misst,
       sondern `scrollWidth <= clientWidth`: passt der Text ins Feld.

       ROT OHNE DIE KORREKTUR (`flex-wrap: wrap` an `.dice-input-group`,
       `flex-basis` am Feld), von DIESER Zusicherung am gebauten Buendel mit
       gefuellter Kampagne gemessen — Innenbreite des Feldes gegen die
       Textbreite der drei Formeln:

         Fenster   Feld innen   1d20   2d20+5   4d6kh3+2d8+5
         -------   ----------   ----   ------   ------------
         320x700         53px   59 ✗     77 ✗         130 ✗
         360x740         93px   93 ✓     93 ✓         130 ✗
         390x844        123px  123 ✓    123 ✓         130 ✗
         740x360        453px      ✓        ✓             ✓

       (Bei 360 und 390 meldet Chrome fuer die kurzen Formeln `scrollWidth ==
       clientWidth`, weil der Text hineinpasst; die Spalte zeigt dort also die
       Feldbreite, nicht die Textbreite. Rot sind die mit ✗.)

       Die zweite Zusicherung unten haelt die GEGENRICHTUNG fest: das Feld darf
       nicht wieder breiter werden als das Fenster. Ohne sie waere ein Rueckfall
       auf den Zustand vor Runde 1 (Feld 215px, rechte Kante bei x=331 in einem
       320px breiten Fenster, Wurf- und Wiederholknopf ganz drauszen) hier
       gruen. Beide Richtungen zusammen sind die Schranke: das Feld passt INS
       Fenster UND die Formel passt INS Feld. */
    for (const [breite, hoehe] of FENSTER) {
        test(`(4) das Wuerfel-Formelfeld bleibt lesbar bei ${breite}x${hoehe}`, async ({
            page
        }) => {
            test.setTimeout(60000);
            await page.setViewportSize({ width: breite, height: hoehe });
            await appLaden(page);
            await reiterWechseln(page, 'dice');
            await faltenOeffnen(page);

            /** @type {Record<string, any>} */
            const gemessen = {};
            for (const formel of FORMELN) {
                await page.fill('#view-dice .dice-formula', formel);
                await page.waitForTimeout(80);
                gemessen[formel] = await page.evaluate(messeFormelfeld);
            }

            const leer = FORMELN.filter(f => !gemessen[f]);
            expect(leer, `Formelfeld gefunden bei ${breite}x${hoehe}`).toEqual([]);

            console.log(
                `[Q1] Formelfeld ${breite}x${hoehe}: innen ${gemessen[FORMELN[0]].clientW}px, ` +
                    FORMELN.map(
                        f =>
                            `"${f}" ${gemessen[f].scrollW}px${gemessen[f].scrollW > gemessen[f].clientW + 1 ? ' ZU BREIT' : ''}`
                    ).join(', ')
            );

            /* Die Formel passt ins Feld. 1px Toleranz wie bei den Messungen
               oben: Rahmen und Zeichenvorschuebe loesen zu nicht-ganzen
               Bildpunkten auf. */
            const abgeschnitten = FORMELN.filter(
                f => gemessen[f].scrollW > gemessen[f].clientW + 1
            );
            expect(
                abgeschnitten.map(
                    f =>
                        `"${f}" braucht ${gemessen[f].scrollW}px, Feld hat ${gemessen[f].clientW}px`
                ),
                `Formeln, die bei ${breite}x${hoehe} nicht ins Feld passen — Ueberhang gegen Lesbarkeit getauscht ist nicht behoben`
            ).toEqual([]);

            /* Und das Feld passt ins Fenster — die Gegenrichtung. */
            const letzte = gemessen[FORMELN[FORMELN.length - 1]];
            expect(
                letzte.rechts <= letzte.fenster + 1,
                `rechte Kante des Formelfelds bei ${breite}x${hoehe}: x=${letzte.rechts} in einem ${letzte.fenster}px breiten Fenster`
            ).toBe(true);
        });
    }

    /* ZUSICHERUNG 6 — DIE VIER THEMES.
       ------------------------------------------------------------------
       WAS ZUSICHERUNG 1 UND 2 NICHT SEHEN. Die Saat setzt `settings.theme`
       auf `dark` und ruft `setTheme()` nie. Alle fuenf Zusicherungen darueber
       messen deshalb GENAU EIN Theme. Der Kopfkommentar dieser Datei behauptet
       seit Runde 1, die Zahlen seien in `light`, `sepia` und `contrast` auf den
       Bildpunkt dieselben — das war eine einmalige Messung von damals, und
       keine Zusicherung hielt sie fest. Ein Theme, das kuenftig eine
       Schriftgroesse, eine Rahmenbreite oder einen Innenabstand verschiebt,
       vergroessert die min-content-Breite der sechs Taeter und bringt den
       Ueberhang zurueck, ohne dass eine der fuenf Zusicherungen darueber
       anschlaegt.

       WARUM 320x700 UND NUR DIESE BREITE. Dort war der Ueberhang am groessten
       (Dashboard 416px von 320px Fensterbreite, also mehr als die doppelte
       Seite) und dort schlaegt eine Verbreiterung der min-content-Breite
       zuerst durch. Die drei weiteren Fenster tragen in der Theme-Achse keine
       eigene Aussage — nachgemessen, siehe Tabelle unten: die Zahlen sind je
       Fenster ueber alle vier Themes identisch. Vier Fenster x vier Themes
       waeren 16 Durchlaeufe fuer dieselbe Aussage.

       ROT OHNE DIE KORREKTUR. Die vier CSS-Dateien der Q1-Korrektur auf
       f6cc6f7 zurueckgedreht (`dashboard.css`, `core.css`, `dice.css`,
       `initiative.css`), neu gebaut, DIESE Zusicherung dagegen gemessen —
       gefuellte Saat, Falten offen, Ueberhang/Zahl der Elemente ausserhalb:

         Ansicht      dark       light      sepia      contrast
         ----------   --------   --------   --------   --------
         Dashboard    416/71     416/71     416/71     416/71
         Initiative   244/94     244/94     244/94     244/94
         Fraktionen   116/24     116/24     116/24     116/24
         Wuerfel       72/4       72/4       72/4       72/4
         Quests         0/48       0/48       0/48       0/48
         uebrige 19     0/0        0/0        0/0        0/0

       Die Gleichheit ueber die Spalten ist der Befund, nicht der Nebeneffekt:
       die Ursachen sind Raster und Flex-Minima, keine Farben. Genau DARUM
       genuegt ein Fenster — und genau darum muss die Gleichheit zugesichert
       sein statt behauptet. */
    test('(6) kein Ueberhang in allen 24 Ansichten in allen vier Themes bei 320x700', async ({
        page
    }) => {
        test.setTimeout(150000);
        await page.setViewportSize({ width: 320, height: 700 });
        await appLaden(page);

        /* VORBEDINGUNG — die Saat muss angekommen sein. Ohne sie messen die
           vier Theme-Durchlaeufe vier Mal den Leerstand, und der ist in allen
           24 Ansichten 0 (bis auf das Formelfeld, siehe Kopfkommentar). */
        for (const v of ['dashboard', 'initiative', 'dice', 'fraktionen', 'quests']) {
            await reiterWechseln(page, v);
        }
        const fuellung = await page.evaluate(messeFuellung);
        expect(
            {
                kaempfer: fuellung.kaempfer >= 10,
                fraktionen: fuellung.fraktionen >= 5,
                dashFiguren: fuellung.dashFiguren > 0,
                initZeilen: fuellung.initZeilen > 0,
                frKarten: fuellung.frKarten > 0
            },
            `Vorbedingung: Fuellstand ${JSON.stringify(fuellung)} — auf leerer ` +
                `Kampagne ist der Ueberhang 0 und diese Zusicherung waere blind`
        ).toEqual({
            kaempfer: true,
            fraktionen: true,
            dashFiguren: true,
            initZeilen: true,
            frKarten: true
        });

        /** @type {Array<string>} */
        const schlecht = [];
        for (const theme of THEMES) {
            const gesetzt = await page.evaluate(t => {
                // @ts-ignore — global aus dem Theme-Modul
                if (typeof window.setTheme === 'function') window.setTheme(t);
                return document.documentElement.getAttribute('data-theme');
            }, theme);
            /* Erst der Beweis, dass der Wechsel gegriffen hat. Ohne ihn
               messen vier Durchlaeufe vier Mal dasselbe Theme. */
            expect(gesetzt, `Theme ${theme} wurde nicht gesetzt`).toBe(theme);
            await page.waitForTimeout(250);

            let streifen = 0;
            for (const v of ANSICHTEN) {
                await reiterWechseln(page, v);
                await faltenOeffnen(page);
                const m = await page.evaluate(messeUeberhang);
                if (m.ueberhangX > 0 || m.aussenAnzahl > 0) {
                    schlecht.push(
                        `${theme}/${v}: ${m.ueberhangX}px, ${m.aussenAnzahl} Elemente ` +
                            `ausserhalb (${m.aussen.map(t => t.sel).join(' | ')})`
                    );
                }
                streifen += m.imStreifenAnzahl;
            }
            console.log(
                `[Q1] 320x700 Theme ${theme}: ` +
                    `${ANSICHTEN.length - schlecht.filter(s => s.startsWith(theme + '/')).length}` +
                    `/${ANSICHTEN.length} ohne Ueberhang und ohne Element ausserhalb` +
                    ` (${streifen} Elemente in Rollstreifen, erlaubt)`
            );
        }

        /* Beide Richtungen in einer Zusicherung: nichts scrollt seitwaerts UND
           nichts liegt rechts des Fensterrands — fuer jedes der vier Themes. */
        expect(
            schlecht,
            'Ansichten mit Ueberhang oder Elementen rechts des Fensterrands bei 320x700'
        ).toEqual([]);
    });

    /* ZUSICHERUNG 7 — DIESELBEN 24 ANSICHTEN UNTER BREITERER SCHRIFT.
       ------------------------------------------------------------------
       WAS DIE SECHS DARUEBER NICHT SEHEN. Sie messen die Schrift der laufenden
       Plattform. Unter Windows ist das 'Segoe UI' und Consolas; unter Linux
       fallen BEIDE Erstglieder der App weg (assets/styles/variables.css), und es
       greifen die fontconfig-Standardschrift bzw. DejaVu Sans Mono — rund 14.5%
       bzw. 9.5% breiter. Jede inhaltsbasierte Mindestbreite waechst damit.
       Der CI-Lauf 36966941474 hat genau daran `party: 10px, 5 Elemente
       ausserhalb` gemeldet, waehrend Zusicherung 1 und 6 unter Windows gruen
       liefen. Eine Probe, die nur eine Metrik kennt, kann diese Klasse von
       Fehlern grundsaetzlich nicht finden.

       UND SIE HAT SCHON EINEN GEFUNDEN, der nicht aus dem CI-Lauf stammt: die
       Korrektur, die `.section-toolbar-actions` im 600px-Block von `width: 100%`
       auf `width: auto` setzt (editors.css), nahm der Gruppe eine SCHRANKE mit
       — im DM-Schirm wurde sie unter Verdana 282.73px breit in einer 276px
       schmalen Zeile, 2px Seitenueberhang, lokal unsichtbar. Behoben mit
       `max-width: 100%` und `flex-wrap: wrap`; diese Zusicherung ist der
       Grund, dass es auffiel.

       EIN THEME, NICHT VIER. Zusicherung 6 sichert die Gleichheit ueber die vier
       Themes; diese hier variiert die Schrift, und beide Achsen zugleich waeren
       96 Durchlaeufe fuer eine Aussage, die in jeder Achse einzeln steht.

       GEMESSEN am Buendel dieser Runde, 320x700, gefuellte Saat, Falten offen:
       24/24 ohne Ueberhang und ohne Element ausserhalb — und vor der Korrektur
       der Charakterkarte loeste die Party-Rasterspalte dort auf 304.875px in
       einem 300px-Behaelter auf. */
    test('(7) kein Ueberhang in allen 24 Ansichten unter breiterer Schrift bei 320x700', async ({
        page
    }) => {
        test.setTimeout(90000);
        await page.setViewportSize({ width: 320, height: 700 });
        await appLaden(page, { breiteSchrift: true });

        /* VORBEDINGUNG A — die breitere Schrift ist angekommen, oder sie KANN
           auf dieser Plattform nichts aendern, weil beide Ketten auf dieselbe
           Standardschrift fallen (so auf den Linux-Runnern). Was sie NICHT sein
           darf: schmaler als die Windows-Erstwahl — dann waere diese Zusicherung
           leichter als Zusicherung 1. */
        const schrift = await page.evaluate(() => {
            const messe = familie => {
                const span = document.createElement('span');
                span.style.cssText =
                    'position:absolute;left:-9999px;white-space:pre;font-size:14px;font-family:' +
                    familie;
                span.textContent = '+ Neuer Charakter';
                document.body.appendChild(span);
                const b = span.getBoundingClientRect().width;
                span.remove();
                return Math.round(b * 100) / 100;
            };
            return { ist: messe('var(--font-ui)'), segoe: messe('"Segoe UI"') };
        });
        console.log(
            `[Q1] breite Schrift: "+ Neuer Charakter" ${schrift.ist}px, in 'Segoe UI' ` +
                `${schrift.segoe}px (Faktor ${(schrift.ist / schrift.segoe).toFixed(4)})`
        );
        expect(
            schrift.ist,
            `die Probenschrift ist SCHMALER als 'Segoe UI' (${schrift.ist} gegen ` +
                `${schrift.segoe}px) — diese Zusicherung waere dann leichter als Zusicherung 1`
        ).toBeGreaterThanOrEqual(schrift.segoe - 0.5);

        // VORBEDINGUNG B — dieselbe wie bei Zusicherung 6: die Saat muss da sein.
        for (const v of ['dashboard', 'initiative', 'dice', 'fraktionen', 'quests']) {
            await reiterWechseln(page, v);
        }
        const fuellung = await page.evaluate(messeFuellung);
        expect(
            {
                kaempfer: fuellung.kaempfer >= 10,
                fraktionen: fuellung.fraktionen >= 5,
                dashFiguren: fuellung.dashFiguren > 0
            },
            `Vorbedingung: Fuellstand ${JSON.stringify(fuellung)} — auf leerer ` +
                `Kampagne ist der Ueberhang 0 und diese Zusicherung waere blind`
        ).toEqual({ kaempfer: true, fraktionen: true, dashFiguren: true });

        /** @type {Array<string>} */
        const schlecht = [];
        /** Die Gegenbuchung zur Ausnahme — siehe messeUeberhang(). */
        /** @type {Array<string>} */
        const streifen = [];
        for (const v of ANSICHTEN) {
            await reiterWechseln(page, v);
            await faltenOeffnen(page);
            const m = await page.evaluate(messeUeberhang);
            if (m.ueberhangX > 0 || m.aussenAnzahl > 0) {
                schlecht.push(
                    `${v}: ${m.ueberhangX}px, ${m.aussenAnzahl} Elemente ausserhalb ` +
                        `(${m.aussen.map(t => `${t.sel} ${t.breite}px@${t.rechts}`).join(' | ')})`
                );
            }
            if (m.imStreifenAnzahl > 0) {
                streifen.push(
                    `${v}: ${m.imStreifenAnzahl} in ${m.imStreifen[0] && m.imStreifen[0].streifen}`
                );
            }
        }
        console.log(
            `[Q1] 320x700 breite Schrift: ${ANSICHTEN.length - schlecht.length}/` +
                `${ANSICHTEN.length} ohne Ueberhang und ohne Element ausserhalb` +
                (streifen.length ? ` — in Rollstreifen (erlaubt): ${streifen.join('; ')}` : '')
        );

        expect(
            schlecht,
            'Ansichten mit Ueberhang oder Elementen rechts des Fensterrands unter breiterer Schrift'
        ).toEqual([]);
    });
});
