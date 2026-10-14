// @ts-check
/**
 * Der Waechter der Tastenhilfe (Tastatur-Strang, HILF)
 * ====================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **jede Taste, die in der
 * App etwas tut, steht in der Tastenhilfe** (`#shortcuts-overlay`) — oder auf
 * einer gezaehlten Ausnahmeliste mit Grund. Und die Umkehrung: **jede Taste,
 * die die Hilfe nennt, tut auch etwas.**
 *
 * WARUM DIESE DATEI DER WERTVOLLE TEIL DES PAKETS IST UND NICHT DIE ZEILE
 * FUER E-2. Die Hilfe war beim Schreiben dieser Datei um DREIZEHN gemessen
 * belegte Tasten veraltet (`8`, `9`, `Strg+F`, `Strg+Shift+K`, `Strg+.`,
 * `Alt+8`, `Alt+Shift+0` bis `Alt+Shift+5`, `Leertaste`), dazu `Esc`, `Tab`
 * und `Shift+Tab` ohne eigene Zeile und die sechs Gruppentasten aus E-2.
 * Von den 48 gemessen belegten Tasten nannte sie 25 — in 25 Zeilen und vier
 * Abschnitten. Und sie ist nicht einmal veraltet, sondern laufend
 * veraltend: sie hat seit
 * ihrer Entstehung jede neue Taste verpasst, die kein Fall erzwungen hat. Das
 * eine Kuerzel, das sie kennt und das nicht aus ihrer Entstehungszeit stammt
 * (`H`, E-4), steht darin, weil `tastatur-kuerzel.spec.js` (i) eine Zeile
 * dafuer verlangt hat. Ein Fall je Taste ist aber keine Schranke, sondern ein
 * Zufall — er haengt daran, dass der naechste Umsetzer daran denkt. Diese
 * Datei dreht die Beweislast um: sie VERGLEICHT die gemessene Tastenmenge mit
 * der Hilfe und wird rot, wenn eine Taste dazukommt, ohne dass die Hilfe
 * mitwaechst. Wer das naechste Kuerzel baut, muss die Hilfe anfassen; er kann
 * es nicht vergessen.
 *
 * WAS DIE WAHRHEIT IST — DIE MESSUNG, NICHT DIE DOKUMENTATION. Die
 * Kuerzeltabelle in `CLAUDE.md` ist hier KEINE Quelle. Sie war beim Schreiben
 * dieser Datei an zwei Stellen nachweislich falsch (beides unten belegt:
 * `Entf`/`Backspace` ist seit je wirkungslos, weil der Zweig auf ein
 * `#view-network` zielt, das es im Buendel nicht gibt), und ein Waechter, der
 * Dokumentation gegen Dokumentation prueft, ist tautologisch. Gemessen wird
 * darum am GEBAUTEN BUENDEL mit echten Tastendruecken, und die Hilfe wird
 * ebenfalls aus dem Buendel gelesen — was der Nutzer sieht, ist das Buendel,
 * nicht die Template-Datei.
 *
 * DAS MESSVERFAHREN, uebernommen aus `tastatur-kuerzel.spec.js` (E-4) und
 * `tastatur-gruppen.spec.js` (E-2), dort je begruendet:
 *
 *   1. ECHTE TASTENDRUECKE (`page.keyboard.press`), nie `.click()` oder
 *      `.focus()` auf das Ziel.
 *   2. `defaultPrevented` wird in einem Lauscher am `window` in der
 *      BLASEN-Phase gelesen. Er liegt damit HINTER allen App-Lauschern (die
 *      haengen am `document`) und sieht ein `preventDefault()`, das dort
 *      gesetzt wurde. Ein Lauscher in der Fangphase saehe es nicht.
 *   3. Dazu eine WIRKUNGSSPUR aus zwoelf Groessen (Runde, Zug, Ansicht,
 *      offene Schale, Schnellreferenz, Tastenhilfe, Ereignislog,
 *      Kampfprotokoll, Wuerfelverlauf, Trefferpunkte aller Kaempfer,
 *      `scrollY`, Fokussignatur) — eine Taste kann wirken, ohne die Vorgabe
 *      zu unterdruecken.
 *
 * WAS "BELEGT" HEISST, und warum `scrollY` und der Fokus allein nicht
 * genuegen — die Regel ist gemessen entstanden, nicht ausgedacht. Bei
 * `BODY`-Fokus bewegen `↓`, `Ende` und `Bild↓` den `scrollY` (0 -> 40 bzw.
 * 0 -> 306) und `Tab` den Fokus, alle mit `defaultPrevented === false`. Das
 * ist die BROWSERVORGABE und keine App-Taste; waeren sie "belegt", muesste
 * die Hilfe das Seitenlaufwerk des Browsers dokumentieren. Eine Taste gilt
 * darum als belegt, wenn sie `defaultPrevented` setzt ODER eine
 * ANWENDUNGS-Groesse veraendert. `scrollY` und die Fokussignatur werden
 * mitgeschrieben (sie stehen in der Fehlermeldung und machen einen Befund
 * lesbar), zaehlen aber nicht als Belegung. Nichts geht dadurch verloren:
 * jede Taste, die den Fokus App-seitig versetzt (`/`, `Strg+K`, `Strg+F`,
 * `Strg+Shift+K`, `h`), setzt zusaetzlich `defaultPrevented`.
 *
 * VIER MESSLAGEN, weil "tut etwas" vom Zusammenhang abhaengt. Eine Messung
 * allein bei `BODY`-Fokus in einer Ansicht haette die Haelfte der Tasten
 * stillschweigend fuer frei erklaert:
 *
 *   (A) `BODY`-Fokus, Initiative-Ansicht — die reichste Lage.
 *   (B) `BODY`-Fokus, Beute-Ansicht — faengt ansichtsgebundene Tasten, die
 *       in (A) nicht vorkommen, und belegt umgekehrt, dass `h`, `n`, `p` und
 *       die Leertaste dort WIRKLICH nichts tun.
 *   (C) Fokus auf einem GRUPPENGLIED (E-2), erreicht mit echten
 *       Tabulatorspruengen — Pfeiltasten, `Pos1`, `Ende`. Zwei Durchgaenge,
 *       waagerechte und senkrechte Gruppe, weil die Achse an der Gestalt der
 *       Gruppe haengt (`ui/keyboard-group.js`, `_achse()`): auf der
 *       waagerechten Zauberplatz-Reihe sind `←/→` belegt und `↑/↓` NICHT,
 *       auf der senkrechten Beutezeilen-Liste genau umgekehrt. Ohne den
 *       zweiten Durchgang wuerde die Hilfe `↑/↓` nennen, ohne dass ein Fall
 *       das belegt.
 *   (D) Bei offener Tastenhilfe — fuer die Bedienbarkeit der Hilfe selbst.
 *
 * WARUM DIE MESSUNG ZWISCHEN ZWEI ANSCHLAEGEN ZURUECKSETZT. Der erste
 * Durchgang dieser Vermessung hat sich selbst verdorben, und der Fehler ist
 * lehrreich genug, um ihn festzuhalten: die Ziffern `1`-`9` WECHSELN DIE
 * ANSICHT. Nach dem Anschlag auf `9` stand die Messung in der Beute-Ansicht,
 * und alles Folgende (`Leertaste`, `n`, `p`, `h`) wurde dort gemessen und
 * fiel als "frei" aus — die vier ansichtsgebundenen Kuerzel der
 * Initiative-Ansicht waren damit unsichtbar. Dasselbe beim Ereignislog, das
 * `l` dauerhaft auf `persistent` stellte und danach jeden Toast mitzaehlte:
 * `o` erschien als belegt, obwohl es nur den Nachlauf des vorigen Anschlags
 * sah. `ZURUECKSETZEN` stellt darum vor JEDEM Anschlag Ansicht, Zug, Runde,
 * Trefferpunkte, Log, Wuerfelverlauf, offene Schalen, Fokus und `scrollY`
 * wieder her und wird danach ein zweites Mal gefahren, damit ein spaet
 * eintreffender Toast nicht in die naechste Messung laeuft.
 *
 * WARUM DAS ZURUECKSETZEN DEN FOKUS MIT `blur()` LOESEN DARF, obwohl E-4
 * ausdruecklich "KEIN `blur()` ALS STARTPUNKT" verlangt. Jene Regel gilt fuer
 * TABULATOR-Messungen: Chromiums "sequential focus navigation starting point"
 * ueberlebt ein `blur()`, der naechste `Tab` springt also weiter und nicht
 * von vorn. In den Lagen (A) und (B) kommt kein `Tab` vor — dort wird genau
 * EINE Taste bei `BODY`-Fokus gedrueckt. Lage (C) braucht echte
 * Tabulatorspruenge und bekommt darum je Taste einen FRISCHEN Seitenaufbau.
 *
 * DER STIL-SOLLSTAND BEWEGT SICH DURCH DIESE ARBEIT NICHT, und der Grund ist
 * ein anderer als der naheliegende. Nicht "die Hilfe ist zu und wird nicht
 * erfasst", sondern: `computed-style-diff.spec.js` erfasst ausschliesslich
 * `document.getElementById('view-' + id).querySelectorAll('*')` — die 24
 * Ansichtsbehaelter. `#shortcuts-overlay` ist ein DIREKTES KIND VON `body`
 * (gemessene Elternkette: `DIV#shortcuts-overlay` -> `BODY` -> `HTML`) und
 * liegt in keinem davon. Die Hilfe ist darum auch GEOEFFNET nicht erfassbar
 * (`o.closest('[id^="view-"]')` liefert `null` in beiden Zustaenden, beides
 * nachgemessen) — und entsprechend nennen 0 von 3.831 Blattschluesseln des
 * Sollstands das Wort "shortcut". Fall (9) haelt diese Lage fest, damit eine
 * spaetere Verschiebung der Hilfe in einen Ansichtsbehaelter nicht still
 * durchlaeuft.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breite der Vermessung. Unter 901 px greifen andere Media-Queries. */
const BREIT = { width: 1440, height: 900 };

/** Die zwei Telefonbreiten, an denen die Hilfe nachgemessen wird. */
const TELEFON = [390, 360];

/**
 * DIE KANDIDATEN DER EINZELTASTEN — 68 Stueck, dieselbe Menge wie in der
 * Vermessung zu E-4: 26 Buchstaben, 10 Ziffern, 32 Zeichen.
 */
const EINZELTASTEN = [
    ...'abcdefghijklmnopqrstuvwxyz'.split(''),
    ...'0123456789'.split(''),
    ...'`-=[]\\;\',./~!@#$%^&*()_+{}|:"<>?'.split('')
];

/**
 * DIE KANDIDATEN MIT MODIFIKATOR — und die Begruendung, warum sie hier
 * stehen und nicht als Restschuld.
 *
 * Das Einzeltasten-Verfahren deckt `Strg+…`, `Alt+…` und `Alt+Shift+…` nicht
 * ab; die Hilfe fuehrt aber UEBERWIEGEND solche Kuerzel (9 der 25 Reihen
 * ihrer Ausgangsfassung). Ein Waechter, der nur Einzeltasten misst, haette
 * genau die Haelfte bewacht, die am wenigsten Drift zeigt, und die Luecken
 * `Strg+F`, `Strg+Shift+K`, `Alt+8` und die sechs Soundboard-Kuerzel waeren
 * ihm entgangen — also eben jene, die in HILF nachgetragen wurden. Die
 * Messung wird darum ERWEITERT statt die Luecke erklaert.
 *
 * WARUM DIE HANDVERLESENE LISTE NICHT GENUEGT HAT — Befund der Gegenpruefung.
 * Ihre erste Fassung zaehlte 46 Kandidaten und erklaerte vier
 * Modifikator-Kollisionen fuer abgeschlossen (`Strg+N`, `Strg+P`, `Alt+N`,
 * `Alt+Shift+6`). Nachgemessen am gebauten Buendel waren es siebzehn weitere,
 * und alle fehlten ausgerechnet DESHALB, weil die Liste von Hand gewaehlt
 * war: `Strg+/` und `Alt+/` (Schnellreferenz auf, Fokus ins Suchfeld),
 * `Alt+R` und `Alt+Shift+R` (wuerfeln), `Alt+P`, `Alt+Shift+P` und
 * `Strg+Shift+P` (Zug rueckwaerts), `Alt+T`/`Alt+Shift+T` (Sitzungsuhr),
 * `Alt+L`/`Alt+Shift+L` (Ereignislog), `Strg+Shift+N`/`Alt+Shift+N` (neue
 * Kampfrunde), `Alt+Shift+8` (wuerfelt W8), `Strg+Shift+?`/`Alt+Shift+?`
 * (oeffnen die Hilfe) und `Strg+Leertaste`/`Alt+Leertaste`/`Shift+Leertaste`
 * (wechseln den Zug). Jede einzelne ist dieselbe Fehlerart: ein Zweig in
 * `systems/spellslots/keyboard-shortcuts.js`, dem eine Modifikator-Schranke
 * fehlt.
 *
 * DARUM IST DIE LISTE JETZT ZUM GROSSEN TEIL GERECHNET UND NICHT GETIPPT.
 * Sie enthaelt:
 *   (a) jedes in `CLAUDE.md` gefuehrte Modifikatorkuerzel;
 *   (b) `Alt+Ziffer` und `Alt+Shift+Ziffer` LUECKENLOS ueber alle zehn
 *       Ziffern — dort springt die Belegung ziffernweise (die
 *       Soundboard-Familie prueft `e.code` 0-5, die Wuerfelfamilie `e.key`
 *       1-9), und genau in dieser Luecke sass `Alt+Shift+8`;
 *   (c) DIE VOLLE KREUZUNG der acht Einzeltasten-Kuerzel der App
 *       (`r t l k n p h /`) mit den vier Modifikatorlagen `Strg`, `Alt`,
 *       `Strg+Shift`, `Alt+Shift`. Das ist die Stelle, an der eine fehlende
 *       Schranke entsteht, und eine gerechnete Kreuzung kann sie nicht
 *       uebersehen — eine getippte Auswahl hat es siebzehnmal getan;
 *   (d) die Buchstaben, auf denen ein Browser selbst ein Kuerzel fuehrt
 *       (`a c v x o b i u g s`) — dort tut eine App-Belegung am meisten weh;
 *   (e) die Shift-Lagen der uebrigen Kuerzel und die drei Leertasten-Lagen.
 *
 * IN DEN ZWEI SHIFT-LAGEN TRAGEN DIE KANDIDATEN DIE GESCHIFTETE GESTALT, und
 * das ist keine Schoenheitsfrage. Playwright nimmt den Namen WOERTLICH:
 * nachgemessen liefert `Control+Shift+n` ein `keydown` mit `key === 'n'` UND
 * `shiftKey === true` — eine Lage, die kein Tastenbrett erzeugt (dort gibt
 * Shift+N `key === 'N'`). Der erste Durchgang dieser Kreuzung hat damit
 * gemessen, dass `Strg+Shift+P` und `Shift+N` "belegt" seien, weil die
 * Zweige fuer die KLEINEN Buchstaben ansprangen. Das waeren Befunde ueber
 * eine Tastatur, die es nicht gibt. Die Lagen heissen darum
 * `Control+Shift+R`, `Alt+Shift+?` usw. — nachgemessen `key === 'R'` bzw.
 * `key === '?'` mit `shiftKey === true`, also genau das, was ein Geraet
 * schickt.
 *
 * DIE DREI `Shift+/`-FORMEN BLEIBEN TROTZDEM DRIN, als eigene Zeilen in (e).
 * Der `?`-Zweig der App fuehrt ausdruecklich einen Rueckfall
 * (`e.shiftKey && e.key === '/'`) fuer Tastaturbilder, auf denen Shift+/
 * eben KEIN `?` liefert. Dieser Rueckfall ist Code und gehoert gemessen —
 * auf einem solchen Geraet waere `Strg+Shift+/` eine echte Kollision,
 * derselben Art wie `Alt+Shift+6`.
 *
 * Eine vollstaendige Kreuzung aus vier Lagen und allen 68 Kandidaten waere
 * 272 Anschlaege JE ANSICHT und liefe in kein Zeitbudget. Was NICHT gemessen
 * wird, steht in Fall (10) als gezaehlte Restschuld.
 */
const APP_EINZELKUERZEL = [
    { ohne: 'r', mitShift: 'R' },
    { ohne: 't', mitShift: 'T' },
    { ohne: 'l', mitShift: 'L' },
    { ohne: 'k', mitShift: 'K' },
    { ohne: 'n', mitShift: 'N' },
    { ohne: 'p', mitShift: 'P' },
    { ohne: 'h', mitShift: 'H' },
    { ohne: '/', mitShift: '?' }
];
const MODIFIKATORLAGEN = [
    { vorsatz: 'Control+', geschiftet: false },
    { vorsatz: 'Alt+', geschiftet: false },
    { vorsatz: 'Control+Shift+', geschiftet: true },
    { vorsatz: 'Alt+Shift+', geschiftet: true }
];
/** Die gerechnete Kreuzung aus (c) — 4 Lagen x 8 Kuerzel. */
const KREUZUNG = MODIFIKATORLAGEN.flatMap(lage =>
    APP_EINZELKUERZEL.map(k => lage.vorsatz + (lage.geschiftet ? k.mitShift : k.ohne))
);
const MODIFIKATORTASTEN = [
    ...new Set([
        // (a) jedes in CLAUDE.md gefuehrte Modifikatorkuerzel
        'Control+z',
        'Control+y',
        'Control+s',
        'Control+k',
        'Control+f',
        'Control+Shift+K',
        'Control+.',
        // (b) die zwei Ziffernfamilien, lueckenlos
        ...Array.from({ length: 10 }, (_, i) => `Alt+${i}`),
        ...Array.from({ length: 10 }, (_, i) => `Alt+Shift+${i}`),
        // (c) die gerechnete Kreuzung — der Kern dieser Liste
        ...KREUZUNG,
        // (d) die Buchstaben mit eigenem Browserkuerzel
        'Control+a',
        'Control+c',
        'Control+v',
        'Control+x',
        'Control+o',
        'Control+b',
        'Control+i',
        'Control+u',
        'Control+g',
        'Control+Shift+Z',
        'Control+Shift+S',
        'Control+Shift+F',
        'Alt+a',
        'Alt+s',
        // (e) die Shift-Lagen, die drei Leertasten-Lagen und die drei
        //     Rueckfall-Formen von Shift+/
        'Shift+N',
        'Shift+P',
        'Shift+K',
        'Shift+/',
        'Control+Shift+/',
        'Alt+Shift+/',
        'Control+Space',
        'Alt+Space',
        'Shift+Space'
    ])
];

/** Die benannten Tasten — keine Zeichen, darum eine eigene Reihe. */
const SONDERTASTEN = [
    'Space',
    'Escape',
    'Enter',
    'Delete',
    'Backspace',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'PageUp',
    'PageDown',
    'Tab'
];

/** Die Tasten, die auf einem Gruppenglied gemessen werden (E-2, Lage C). */
const GRUPPENTASTEN = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

/**
 * DIE ZWEI GRUPPENARTEN, an denen die Achse gemessen wird. Beide sind in
 * `ui/keyboard-group.js` bzw. `ui/keyboard-group-views.js` angemeldet.
 */
const GRUPPE_WAAGERECHT = {
    name: 'zauberplaetze',
    ansicht: 'initiative',
    glied: '.init-slot-box',
    achse: 'horizontal'
};
const GRUPPE_SENKRECHT = {
    name: 'beutezeilen',
    ansicht: 'loot',
    glied: '#loot-list [data-action="select-loot"]',
    achse: 'vertical'
};

/**
 * DIE AUSNAHMELISTE — gezaehlt, begruendet, und mit Verwesungsprobe.
 *
 * Hierhin gehoert eine gemessen belegte Taste AUSSCHLIESSLICH dann, wenn ihr
 * Eintrag in die Hilfe falsch WAERE. Alle vier Eintraege sind von derselben
 * Art: ein Zweig in `systems/spellslots/keyboard-shortcuts.js`, dem eine
 * Modifikator-Schranke fehlt, sodass das Einzeltasten-Kuerzel auch mit
 * Modifikator feuert. Das ist eine unbeabsichtigte Kollision und ein Befund
 * fuer sich — sie in die Hilfe zu schreiben hiesse, sie als Zusage
 * festzuschreiben, und der naechste, der die Schranke nachtraegt, muesste
 * die Hilfe wieder zuruecknehmen.
 *
 * Fall (4) ist die VERWESUNGSPROBE: steht eine Taste hier UND in der Hilfe,
 * wird es rot. Die Liste kann also nicht als stille Freigabe liegenbleiben,
 * und beim Nachtragen eines Eintrags in die Hilfe MUSS sie schrumpfen.
 * Fall (6) nagelt ihre Laenge fest: ein fuenfter Eintrag braucht eine
 * Aenderung an dieser Zahl und damit eine bewusste Entscheidung.
 */
const AUSNAHMEN = [
    {
        taste: 'STRG+N',
        grund:
            'Unbeabsichtigte Kollision: dem `n`-Zweig (naechster Zug) fehlt die ' +
            '`!e.ctrlKey`-Schranke, darum wechselt Strg+N den Zug statt ein Fenster zu ' +
            'oeffnen. Gemessen: zug 0 -> 1, defaultPrevented. Befund, keine Zusage — in ' +
            'die Hilfe geschrieben waere es eine.'
    },
    {
        taste: 'STRG+P',
        grund:
            'Unbeabsichtigte Kollision: dem `p`-Zweig (vorheriger Zug) fehlt die ' +
            '`!e.ctrlKey`-Schranke, darum verschluckt Strg+P in der Initiative-Ansicht ' +
            'das Drucken des Browsers. Gemessen: zug 0 -> 5, defaultPrevented.'
    },
    {
        taste: 'ALT+N',
        grund:
            'Unbeabsichtigte Kollision: dem `n`-Zweig fehlt auch die `!e.altKey`-Schranke. ' +
            'Gemessen: zug 0 -> 1, defaultPrevented.'
    },
    {
        taste: 'ALT+SHIFT+6',
        grund:
            'Unbeabsichtigte Kollision zwischen zwei Familien: Alt+Shift+0..5 sind die ' +
            'Soundboard-Plaetze (die pruefen `e.code`), Alt+Ziffer sind die Schnellwuerfel ' +
            '(die pruefen `e.key` ohne `!e.shiftKey`). Alt+Shift+6 fallen durch die erste ' +
            'in die zweite und wuerfeln W6. Ob es im echten Browser feuert, haengt am ' +
            'Tastaturbild (ob Shift+6 `e.key === "6"` liefert) — eine Zusage, die von der ' +
            'Belegung des Geraets abhaengt, gehoert nicht in eine Hilfe.'
    }
];

/**
 * DIE GEGENRICHTUNG (Fall 5): Reihen der Hilfe, deren Taste in KEINER der
 * vier Messlagen belegt sein kann — und darum nicht gegen die Messung
 * geprueft wird. Auch das ist gezaehlt und begruendet; ohne diese Liste
 * waere Fall (5) entweder rot oder muesste die Hilfe auf messbare Tasten
 * beschraenken.
 */
const NUR_HILFE = [
    {
        taste: 'ESC',
        grund:
            'Escape wirkt nur gegen etwas Offenes. Bei BODY-Fokus ohne offene Schale tut ' +
            'es gemessen nichts (defaultPrevented false, keine Wirkung) — das ist richtig ' +
            'so. Seine Wirkung belegt Lage (D) in Fall (7), nicht die Tastenmenge.'
    },
    {
        taste: 'TAB',
        grund:
            'Tabulator ist bei BODY-Fokus die Browservorgabe (gemessen: ' +
            'defaultPrevented false, nur der Fokus wandert) und wird nach der Belegungs- ' +
            'regel dieser Datei zu Recht nicht als App-Taste gezaehlt. Seine App-Wirkung ' +
            'liegt im offenen Dialog — fuer die 36 Schalen bewacht von ' +
            '`modal-fokus.spec.js`, FUER DIESE HILFE von Fall (13) in dieser Datei. Die ' +
            'frueher hier stehende Begruendung verwies allein auf jene Datei und war ' +
            'falsch: `ui/modal-focus.js` liess die Hilfe per gemessener Entscheidung aus, ' +
            'und 44 von 45 Spruengen verliessen sie, waehrend sie die Zusage druckte.'
    },
    {
        taste: 'SHIFT+TAB',
        grund:
            'Dieselbe Lage wie TAB, nur die Gegenrichtung: bei BODY-Fokus die ' +
            'Browservorgabe. Die App-Wirkung im offenen Dialog misst fuer die Hilfe ' +
            'Fall (13) dieser Datei mit — er fuehrt BEIDE Richtungen, weil eine Falle, ' +
            'die nur vorwaerts haelt, keine ist (gemessen: 10 von 10 Shift+Tab draussen). ' +
            'Fuer die 36 Schalen bleibt `modal-fokus.spec.js` zustaendig; eine eigene ' +
            'Messung dafuer waere hier eine zweite, schwaechere Kopie jener Datei.'
    }
];

/**
 * Der Lauscher, der `defaultPrevented` liest. Am `window`, in der
 * BLASEN-Phase — damit hinter allen App-Lauschern am `document`.
 */
const MITSCHRIFT = `(() => {
    window.__hilfTasten = [];
    if (!window.__hilfLauscher) {
        window.__hilfLauscher = ev => {
            window.__hilfTasten.push({ taste: ev.key, verhindert: ev.defaultPrevented });
        };
        window.addEventListener('keydown', window.__hilfLauscher, false);
    }
    return true;
})()`;

/**
 * DIE WIRKUNGSSPUR — zwoelf Groessen. Die ersten zehn sind
 * ANWENDUNGS-Groessen und belegen eine Taste; `scrollY` und `fokus` sind
 * Browservorgaben und werden nur mitgeschrieben (Begruendung im Kopf).
 */
const SPUR = `(() => {
    const d = window.D || {};
    const i = d.initiative || {};
    return {
        runde: i.round ?? null,
        zug: i.currentTurn ?? null,
        ansicht: document.querySelector('.view.active')?.id || null,
        schale: Array.from(document.querySelectorAll('.modal-overlay.show, .modal.show'))
            .map(e => e.id).sort().join(','),
        schnellreferenz: (document.getElementById('quick-ref-panel')?.className || ''),
        hilfe: !!document.querySelector('#shortcuts-overlay.show'),
        log: document.querySelectorAll('#event-log .event-log-entry, #event-log .log-entry').length
            + '|' + (document.getElementById('event-log')?.className || ''),
        protokoll: (document.querySelector('#combat-log-panel, .combat-log-panel')?.className || ''),
        wuerfel: (d.diceHistory || window.diceHistory || []).length,
        trefferpunkte: (i.combatants || []).map(c => c.currentHp).join(','),
        scrollY: Math.round(window.scrollY),
        fokus: document.activeElement === document.body
            ? 'BODY'
            : (document.activeElement?.tagName || '?')
              + '#' + (document.activeElement?.id || '')
              + (document.activeElement?.getAttribute?.('data-index') !== null
                  ? '@' + document.activeElement?.getAttribute?.('data-index') : '')
    };
})()`;

/** Die zwei Groessen der Spur, die KEINE Belegung begruenden. */
const KEINE_BELEGUNG = ['scrollY', 'fokus'];

/**
 * Stellt die Ausgangslage wieder her. Begruendung im Kopf — ohne das
 * verdirbt die Messung sich selbst an den Ansichtswechseln der Ziffern.
 * @param {string} ansicht
 */
const ZURUECKSETZEN = ansicht => `(() => {
    document.querySelectorAll('.modal-overlay.show, .modal.show')
        .forEach(m => m.classList.remove('show'));
    document.getElementById('shortcuts-overlay')?.classList.remove('show');
    const q = document.getElementById('quick-ref-panel');
    if (q) q.className = 'quick-ref-panel';
    document.querySelectorAll('#command-palette, .command-palette, .cp-overlay')
        .forEach(e => e.classList.remove('show', 'open', 'cp-visible'));
    const log = document.getElementById('event-log');
    if (log) { log.className = 'event-log'; log.innerHTML = ''; }
    if (window.D?.initiative) {
        window.D.initiative.currentTurn = 0;
        window.D.initiative.round = 1;
        (window.D.initiative.combatants || []).forEach(c => { c.currentHp = c.maxHp; });
    }
    if (window.D) window.D.diceHistory = [];
    if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
    }
    window.scrollTo(0, 0);
    if (document.querySelector('.view.active')?.id !== 'view-${ansicht}') {
        window.switchView('${ansicht}');
    }
    window.__hilfTasten = [];
    return true;
})()`;

/**
 * Gefuellte Kampagne. Uebernommen aus `tastatur-gruppen.spec.js`: die
 * Spielerkaempfer sind NAMENSGLEICH mit den Helden, sonst gibt es keine
 * Zauberplatz-Punkte und damit keine waagerechte Gruppe.
 * @param {number} n
 */
function kampagne(n = 6) {
    const liste = (praefix, extra = {}) =>
        Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `${praefix} ${i + 1}`, ...extra }));
    return {
        _version: '99.0.0',
        settings: { theme: 'dark', lastView: 'dashboard', markdownOnboardingSeen: true },
        randomTables: [],
        timers: [],
        campaign: {},
        shops: liste('Laden'),
        factions: liste('Fraktion'),
        characters: Array.from({ length: n }, (_, i) => ({
            id: i + 1,
            name: `Charakter ${i + 1} (HILF)`,
            characterClass: 'Magier',
            level: 5,
            hpCurrent: 40,
            hpMax: 40,
            armorClass: 16,
            attributes: { str: 10, dex: 12, con: 14, int: 16, wis: 12, cha: 10 },
            spellSlots: { 1: { max: 4, current: 2 }, 2: { max: 3, current: 1 } }
        })),
        npcs: liste('NSC', { role: 'Merchant', race: 'Mensch' }),
        locations: liste('Ort'),
        quests: liste('Auftrag', { title: 'Auftrag', status: 'active' }),
        loot: liste('Beute', { qty: 1, value: 10 }),
        spells: [],
        wiki: liste('Wiki', { title: 'Wiki', category: 'Allgemein' }),
        sessionNotes: [],
        encounters: liste('Begegnung', { monsters: [] }),
        initiative: {
            combatants: Array.from({ length: n }, (_, i) => ({
                id: i + 1,
                name: `Charakter ${i + 1} (HILF)`,
                initiative: 30 - i,
                initBonus: 2,
                maxHp: 40,
                currentHp: 40,
                ac: 16,
                type: 'player',
                effects: []
            })),
            currentTurn: 0,
            round: 1
        },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 100,
        quickRefCustom: [],
        _nextId: {
            characters: n + 1,
            npcs: n + 1,
            locations: n + 1,
            quests: n + 1,
            encounters: n + 1,
            spells: 1,
            loot: n + 1,
            items: 1,
            wiki: n + 1,
            sessionNotes: 1,
            randomTables: 1
        }
    };
}

/**
 * Frischer Seitenaufbau, gefuellte Kampagne, Ansicht per `switchView()` —
 * OHNE Klick.
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 */
async function ansichtOeffnen(page, ansicht) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(seed => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(seed));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng.
        }
    }, kampagne(6));
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.waitForTimeout(400);
    await page.evaluate(v => window.switchView(v), ansicht);
    await page.waitForTimeout(600);
    await page.evaluate(MITSCHRIFT);
}

/** Vergleicht zwei Spuren und liefert die Namen der veraenderten Groessen. */
function spurDelta(vor, nach, ohne = []) {
    const raus = [];
    for (const k of Object.keys(vor)) {
        if (ohne.includes(k)) continue;
        if (JSON.stringify(vor[k]) !== JSON.stringify(nach[k])) {
            raus.push(`${k}: ${JSON.stringify(vor[k])} -> ${JSON.stringify(nach[k])}`);
        }
    }
    return raus;
}

/**
 * Misst eine Reihe von Tasten bei `BODY`-Fokus in einer Ansicht.
 * @param {import('@playwright/test').Page} page
 * @param {string[]} tasten
 * @param {string} ansicht
 * @returns {Promise<Record<string, {verhindert: boolean, wirkung: string[], nebenwirkung: string[], belegt: boolean}>>}
 */
async function messeTasten(page, tasten, ansicht) {
    /** @type {Record<string, any>} */
    const erg = {};
    for (const taste of tasten) {
        await page.evaluate(ZURUECKSETZEN(ansicht));
        await page.waitForTimeout(240);
        // Zweiter Durchgang: ein spaet eintreffender Toast des vorigen
        // Anschlags darf nicht in diese Messung laufen.
        await page.evaluate(ZURUECKSETZEN(ansicht));
        await page.waitForTimeout(60);

        const vor = await page.evaluate(SPUR);
        await page.keyboard.press(taste);
        await page.waitForTimeout(240);
        const nach = await page.evaluate(SPUR);
        const mitschrift = await page.evaluate(() => window.__hilfTasten.slice());

        const verhindert = mitschrift.some(m => m.verhindert);
        const wirkung = spurDelta(vor, nach, KEINE_BELEGUNG);
        const nebenwirkung = spurDelta(vor, nach).filter(x =>
            KEINE_BELEGUNG.some(k => x.startsWith(k + ':'))
        );
        erg[taste] = {
            verhindert,
            wirkung,
            nebenwirkung,
            belegt: verhindert || wirkung.length > 0
        };
    }
    return erg;
}

/**
 * Normalisiert einen Playwright-Tastennamen auf das Zeichen, das die Hilfe
 * schreibt. Eine Zuordnungstabelle und keine Heuristik — damit ein Tippfehler
 * in der Hilfe nicht durch eine schlaue Regel verziehen wird.
 * @param {string} taste
 */
function alsHilfeToken(taste) {
    const karte = {
        Space: 'LEERTASTE',
        Escape: 'ESC',
        Enter: 'ENTER',
        Delete: 'ENTF',
        Backspace: 'BACKSPACE',
        ArrowLeft: '←',
        ArrowRight: '→',
        ArrowUp: '↑',
        ArrowDown: '↓',
        Home: 'POS1',
        End: 'ENDE',
        PageUp: 'BILD↑',
        PageDown: 'BILD↓',
        Tab: 'TAB',
        // `Shift+/` und `?` sind dieselbe Taste des Geraets. Die Hilfe
        // schreibt `?`, und beides muss darauf fallen — sonst verlangt der
        // Waechter eine zweite Zeile fuer dieselbe Taste.
        'Shift+/': '?'
    };
    if (karte[taste]) return karte[taste];
    return taste
        .split('+')
        .map(t => {
            if (t === 'Control') return 'STRG';
            if (t === 'Shift') return 'SHIFT';
            if (t === 'Alt') return 'ALT';
            return karte[t] || t.toUpperCase();
        })
        .join('+');
}

/**
 * Liest die Hilfe AUS DEM GEBAUTEN BUENDEL. Der Rueckgabewert traegt
 * absichtlich auch die Rohreihen: eine Fehlermeldung, die nur "Taste fehlt"
 * sagt, ist ohne die Liste des Vorhandenen nicht zu gebrauchen.
 * @param {import('@playwright/test').Page} page
 */
async function hilfeLesen(page) {
    return page.evaluate(() => {
        const o = document.getElementById('shortcuts-overlay');
        if (!o) return { vorhanden: false, abschnitte: [], reihen: [], tokens: [] };
        const reihen = Array.from(o.querySelectorAll('.shortcut-row')).map(r => ({
            text: (r.querySelector('span')?.textContent || '').replace(/\s+/g, ' ').trim(),
            tasten: Array.from(r.querySelectorAll('.shortcut-key')).map(k =>
                (k.textContent || '').trim()
            )
        }));
        return {
            vorhanden: true,
            abschnitte: Array.from(o.querySelectorAll('.shortcuts-section')).map(s => ({
                titel: (s.querySelector('.shortcuts-section-title')?.textContent || '').trim(),
                reihen: s.querySelectorAll('.shortcut-row').length
            })),
            reihen,
            inlineStile: Array.from(o.querySelectorAll('[style]')).length,
            imAnsichtsbehaelter: !!o.closest('[id^="view-"]')
        };
    });
}

/**
 * Die Tastenmenge der Hilfe. Eine Reihe kann MEHRERE Tasten nennen
 * (`1`…`9`, `←`/`→`) — jede davon zaehlt einzeln, und eine Reihe mit
 * mehreren Marken hintereinander (`Strg` `Z`) ist EIN Kuerzel.
 *
 * Die Unterscheidung laeuft ueber die Modifikatormarken: `Strg`, `Alt` und
 * `Shift` binden sich an die naechste Nicht-Modifikatormarke; mehrere
 * Nicht-Modifikatormarken in einer Reihe sind Alternativen desselben
 * Modifikator-Vorsatzes. `Alt` `Shift` `1` `2` `3` `4` `5` ergibt damit
 * ALT+SHIFT+1 … ALT+SHIFT+5 — die Form, in der die fuenf Soundboard-Plaetze
 * in eine Reihe passen, ohne dass die Hilfe fuenf Reihen dafuer braucht.
 * @param {{tasten: string[]}[]} reihen
 */
function hilfeTokens(reihen) {
    const MODIFIKATOREN = { STRG: 1, ALT: 1, SHIFT: 1 };
    const raus = new Set();
    for (const r of reihen) {
        const marken = r.tasten.map(t => t.trim().toUpperCase()).filter(Boolean);
        const vorsatz = [];
        const ziele = [];
        for (const m of marken) {
            if (MODIFIKATOREN[m] && ziele.length === 0) vorsatz.push(m);
            else ziele.push(m);
        }
        if (ziele.length === 0) {
            // Eine Reihe aus reinen Modifikatormarken (`Tab` allein zaehlt als
            // Ziel, `Shift` allein waere sinnlos) — als Ganzes aufnehmen.
            if (vorsatz.length) raus.add(vorsatz.join('+'));
            continue;
        }
        for (const z of ziele) {
            // EINE MARKE, DIE SELBST EINE SPANNE IST (`1-5`), wird hier NICHT
            // als Taste gezaehlt — `spannenTokens()` loest sie in ihre
            // Einzeltasten auf. Ohne diese Ausnahme stuende in der Tastenmenge
            // zusaetzlich das Gebilde `ALT+SHIFT+1-5`, das keine Taste ist
            // und das Fall (5) zu Recht als Luege meldete (gemessen, erster
            // Durchgang nach dem Nachtragen der Hilfe).
            if (/^[0-9]\s*[-–…]\s*[0-9]$/.test(z)) continue;
            raus.add([...vorsatz, z].join('+'));
        }
    }
    return raus;
}

/**
 * Loest eine Ziffernspanne auf. Zwei Schreibweisen gelten:
 *
 *   (a) EINE Marke der Form `1-5` — so schreibt ein Mensch eine Spanne, und
 *       so steht sie bei den fuenf Soundboard-Plaetzen. Fuenf eigene Reihen
 *       waeren dort Rauschen: dieselbe Mechanik, nur die Ziffer anders.
 *   (b) ZWEI Ziffernmarken in einer Reihe, deren Text einen Bindestrich
 *       fuehrt.
 *
 * WARUM DAS KEINE NACHSICHT IST, obwohl es die Pruefung weicher aussehen
 * laesst: die Aufloesung schneidet in BEIDE Richtungen. Sie macht `1-5` zu
 * fuenf genannten Tasten — und damit haftet die Hilfe fuer alle fuenf. Wer
 * `1-9` schreibt, wo nur `1-5` wirken, bekommt in Fall (5) vier Luegen
 * gemeldet (ALT+SHIFT+6 … 9 genannt, aber nicht belegt). Eine Spanne ist
 * also teurer als eine Einzelmarke, nicht billiger.
 *
 * Eng gefasst ist sie trotzdem: Marken wie `W20` oder `Pos1` enthalten
 * Ziffern, aber keine Spannenform, und bleiben unberuehrt.
 * @param {{text: string, tasten: string[]}[]} reihen
 */
function spannenTokens(reihen) {
    const raus = new Set();
    const MOD = ['STRG', 'ALT', 'SHIFT'];
    for (const r of reihen) {
        const marken = r.tasten.map(t => t.trim());
        const vorsatz = marken.map(t => t.toUpperCase()).filter(t => MOD.includes(t));

        // (a) eine Marke, die selbst eine Spanne ist
        for (const m of marken) {
            const treffer = m.match(/^([0-9])\s*[-–…]\s*([0-9])$/);
            if (!treffer) continue;
            const [a, b] = [Number(treffer[1]), Number(treffer[2])];
            for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
                raus.add([...vorsatz, String(i)].join('+'));
            }
        }

        // (b) zwei Ziffernmarken plus ein Bindestrich im Reihentext
        const ziffern = marken.filter(t => /^[0-9]$/.test(t));
        const hatSpanne = /[-–…]/.test(marken.join(' ')) || /[-–…]/.test(r.text);
        if (ziffern.length === 2 && hatSpanne) {
            const [a, b] = ziffern.map(Number);
            for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
                raus.add([...vorsatz, String(i)].join('+'));
            }
        }
    }
    return raus;
}

/** Alle Tasten, die die Hilfe nennt — Einzelmarken plus aufgeloeste Spannen. */
function hilfeTastenmenge(reihen) {
    return new Set([...hilfeTokens(reihen), ...spannenTokens(reihen)]);
}

// ============================================================
// (1)-(2) DIE ZWEI LEERLAUFSCHRANKEN
// ============================================================
//
// WARUM SIE EIGENE FAELLE SIND UND KEINE `expect` MITTEN IM VERGLEICH. Ein
// Mengenvergleich gegen eine leere Menge ist IMMER gruen — "alle 0 Tasten
// stehen in der Hilfe" ist wahr. Genau dieser Fehler ist in der Vorarbeit
// dieses Strangs DREIMAL vorgekommen (ein Leser, der eine leere Zeilenliste
// zurueckgab; eine Messung, die nach einem Selektorwechsel keine Taste mehr
// fand; eine Hilfe, die der Leser nach einer Umbenennung nicht mehr fand).
// Die Schranken stehen darum VOR dem Vergleich und sind je einzeln zu
// mutieren.

test.describe('HILF — der Waechter der Tastenhilfe', () => {
    test('(1) der Leser der Hilfe liefert Zeilen, und zwar nicht zu wenige', async ({ page }) => {
        test.setTimeout(90_000);
        await ansichtOeffnen(page, 'initiative');

        const hilfe = await hilfeLesen(page);
        expect(hilfe.vorhanden, 'Die Hilfe `#shortcuts-overlay` steht nicht im Buendel').toBe(true);
        expect(
            hilfe.abschnitte.length,
            'Die Hilfe hat weniger als vier Abschnitte — der Leser greift ins Leere, ' +
                'oder die Hilfe ist zusammengeschrumpft'
        ).toBeGreaterThanOrEqual(4);
        expect(
            hilfe.reihen.length,
            'Die Hilfe hat weniger als 25 Zeilen. 25 war ihr gemessener Ausgangsstand ' +
                `(HEAD 52caf1d); gelesen wurden ${hilfe.reihen.length}. Entweder ist der ` +
                'Leser blind geworden (Klassenname `.shortcut-row` geaendert) oder die ' +
                'Hilfe hat Zeilen verloren'
        ).toBeGreaterThanOrEqual(25);
        expect(
            hilfe.reihen.filter(r => r.tasten.length === 0),
            'Jede Zeile der Hilfe nennt mindestens eine Taste — eine Zeile ohne ' +
                '`.shortcut-key` ist entweder kein Kuerzel oder der Leser findet die ' +
                'Marken nicht'
        ).toEqual([]);

        const tokens = hilfeTastenmenge(hilfe.reihen);
        expect(
            tokens.size,
            'Die Tastenmenge der Hilfe ist leer oder viel zu klein — ein Mengenvergleich ' +
                'dagegen waere immer gruen'
        ).toBeGreaterThanOrEqual(25);
    });

    test('(2) die Messung liefert Tasten, und zwar nicht zu wenige', async ({ page }) => {
        test.setTimeout(240_000);
        await ansichtOeffnen(page, 'initiative');

        const einzel = await messeTasten(page, EINZELTASTEN, 'initiative');
        const belegt = Object.keys(einzel).filter(k => einzel[k].belegt);

        expect(
            belegt.length,
            'Die Einzeltasten-Messung findet weniger als 18 belegte Tasten. Gemessener ' +
                'Ausgangsstand in der Initiative-Ansicht (HEAD 52caf1d): 18 von 68 ' +
                `(1-9, h, k, l, n, p, r, t, /, ?). Gefunden: ${belegt.join(' ')}. Findet ` +
                'die Messung nichts, ist jeder Vergleich dagegen wertlos'
        ).toBeGreaterThanOrEqual(18);

        // UND DIE GEGENPROBE, damit nicht einfach alles als belegt gilt: die
        // Mehrheit der 68 Kandidaten ist frei. Eine Messung, die jede Taste
        // fuer belegt haelt (etwa weil der Lauscher in der Fangphase sitzt
        // oder die Spur Rauschen mitliest), waere genauso wertlos wie eine,
        // die keine findet.
        expect(
            belegt.length,
            'Die Messung haelt mehr als 30 der 68 Kandidaten fuer belegt — das ist ' +
                'Rauschen, nicht Belegung (Ausgangsstand: 18)'
        ).toBeLessThanOrEqual(30);
    });

    // ============================================================
    // (3) DIE KERNAUSSAGE
    // ============================================================

    test('(3) jede gemessen belegte Taste steht in der Hilfe oder auf der Ausnahmeliste', async ({
        page
    }) => {
        test.setTimeout(600_000);
        await ansichtOeffnen(page, 'initiative');

        const hilfe = await hilfeLesen(page);
        const genannt = hilfeTastenmenge(hilfe.reihen);
        const ausnahmen = new Set(AUSNAHMEN.map(a => a.taste));

        /** @type {{taste: string, lage: string, befund: string}[]} */
        const belegt = [];
        const merken = (lage, erg) => {
            for (const [taste, e] of Object.entries(erg)) {
                if (!e.belegt) continue;
                belegt.push({
                    taste: alsHilfeToken(taste),
                    lage,
                    befund: `pd=${e.verhindert ? 1 : 0} ${e.wirkung.join('; ') || '(keine Spur)'}`
                });
            }
        };

        // Lage (A): Initiative-Ansicht, BODY-Fokus.
        merken('A/Initiative', await messeTasten(page, EINZELTASTEN, 'initiative'));
        merken('A/Initiative', await messeTasten(page, MODIFIKATORTASTEN, 'initiative'));
        merken('A/Initiative', await messeTasten(page, SONDERTASTEN, 'initiative'));

        // Lage (B): Beute-Ansicht, BODY-Fokus. Sie faengt, was in (A) von der
        // Initiative-Ansicht verdeckt wird, und belegt umgekehrt, dass die
        // vier ansichtsgebundenen Kuerzel dort wirklich schweigen.
        merken('B/Beute', await messeTasten(page, EINZELTASTEN, 'loot'));
        merken('B/Beute', await messeTasten(page, SONDERTASTEN, 'loot'));

        const alle = new Map();
        for (const b of belegt) {
            if (!alle.has(b.taste)) alle.set(b.taste, []);
            alle.get(b.taste).push(`${b.lage}: ${b.befund}`);
        }

        const fehlen = [...alle.keys()].filter(t => !genannt.has(t) && !ausnahmen.has(t));

        expect(
            fehlen,
            'Diese Tasten TUN etwas, stehen aber nicht in der Tastenhilfe und auch nicht ' +
                'auf der Ausnahmeliste.\n' +
                fehlen.map(t => `   ${t}  —  ${alle.get(t).join(' | ')}`).join('\n') +
                '\n\nDie Hilfe nennt heute: ' +
                [...genannt].sort().join(' ') +
                '\n\nNachtragen in `assets/templates/modals-editors.html`, Block ' +
                '`#shortcuts-overlay` — oder, wenn der Eintrag falsch waere, mit Grund ' +
                'auf `AUSNAHMEN` in dieser Datei (dann steigt die Zahl in Fall 6).'
        ).toEqual([]);

        // UND DIE DRITTE RICHTUNG, die bis zur Gegenpruefung fehlte: ein
        // Eintrag auf `AUSNAHMEN`, dessen Taste GAR NICHT MEHR BELEGT ist.
        //
        // WARUM DAS EINE EIGENE PRUEFUNG BRAUCHT. Fall (4) faengt den Eintrag,
        // der in der Hilfe nachgetragen WURDE. Er faengt NICHT den Eintrag,
        // dessen Grund jemand BEHOBEN hat: `AUSNAHMEN` entschuldigt
        // ausschliesslich fehlende Modifikator-Schranken, und wer eine
        // nachtraegt, nimmt der Kollision die Belegung — die Taste steht dann
        // weder in der Hilfe noch wirkt sie, und der Eintrag entschuldigt
        // nichts mehr. Liegengeblieben ist er dann eine stille Freigabe
        // genau derselben Art, die der `nurHilfeTot`-Zweig in Fall (4) fuer
        // die Gegenliste schon kennt: beim naechsten Mal, wenn jemand die
        // Schranke versehentlich wieder entfernt, meldet Fall (3) es NICHT.
        // Diese Pruefung steht hier und nicht in (4), weil die Messung
        // schon vorliegt — ein zweiter Lauf ueber 170 Anschlaege nur fuer
        // vier Namen waere Verschwendung.
        const ausnahmenOhneBelegung = AUSNAHMEN.map(a => a.taste).filter(t => !alle.has(t));
        expect(
            ausnahmenOhneBelegung,
            'Diese Eintraege von `AUSNAHMEN` nennen eine Taste, die in keiner der ' +
                `gemessenen Lagen etwas tut: ${ausnahmenOhneBelegung.join(' ')}. Die Liste ` +
                'entschuldigt damit nichts mehr — sie ist an dieser Stelle toter Ballast ' +
                'und wuerde einen echten Rueckfall an derselben Taste verschlucken. ' +
                'Eintrag aus `AUSNAHMEN` streichen und die Zahl in Fall (6) senken.\n' +
                'Gemessen belegt wurden: ' +
                [...alle.keys()].sort().join(' ')
        ).toEqual([]);
    });

    // ============================================================
    // (4) DIE VERWESUNGSPROBE DER AUSNAHMELISTE
    // ============================================================

    test('(4) keine Taste steht gleichzeitig auf der Ausnahmeliste und in der Hilfe', async ({
        page
    }) => {
        test.setTimeout(90_000);
        await ansichtOeffnen(page, 'initiative');

        const hilfe = await hilfeLesen(page);
        const genannt = hilfeTastenmenge(hilfe.reihen);

        const verwest = AUSNAHMEN.filter(a => genannt.has(a.taste)).map(a => a.taste);
        expect(
            verwest,
            'Diese Tasten stehen auf der Ausnahmeliste ("nicht in der Hilfe, weil …") UND ' +
                `in der Hilfe: ${verwest.join(' ')}. Die Liste ist damit an dieser Stelle ` +
                'eine stille Freigabe: sie entschuldigt etwas, das laengst nachgetragen ' +
                'ist, und verschluckt ab dem naechsten Lauf echte Befunde an derselben ' +
                'Taste. Eintrag aus `AUSNAHMEN` streichen und die Zahl in Fall (6) senken.'
        ).toEqual([]);

        // Dasselbe fuer die Gegenrichtung: ein Eintrag auf NUR_HILFE, der in
        // der Hilfe gar nicht (mehr) vorkommt, entschuldigt nichts und
        // verdeckt nur.
        const nurHilfeTot = NUR_HILFE.filter(n => !genannt.has(n.taste)).map(n => n.taste);
        expect(
            nurHilfeTot,
            `Diese Eintraege von NUR_HILFE nennt die Hilfe nicht (mehr): ${nurHilfeTot.join(' ')}. ` +
                'Die Liste nimmt Reihen der Hilfe von der Messprobe aus — fuer eine Reihe, ' +
                'die es nicht gibt, ist das toter Ballast.'
        ).toEqual([]);
    });

    // ============================================================
    // (5) DIE UMKEHRUNG — DIE HILFE LUEGT NICHT
    // ============================================================

    test('(5) jede Taste, die die Hilfe nennt, tut auch etwas', async ({ page }) => {
        test.setTimeout(600_000);
        await ansichtOeffnen(page, 'initiative');

        const hilfe = await hilfeLesen(page);
        const genannt = hilfeTastenmenge(hilfe.reihen);
        const ausgenommen = new Set(NUR_HILFE.map(n => n.taste));

        /** @type {Set<string>} */
        const belegt = new Set();
        const sammeln = erg => {
            for (const [taste, e] of Object.entries(erg)) {
                if (e.belegt) belegt.add(alsHilfeToken(taste));
            }
        };

        sammeln(await messeTasten(page, EINZELTASTEN, 'initiative'));
        sammeln(await messeTasten(page, MODIFIKATORTASTEN, 'initiative'));
        sammeln(await messeTasten(page, SONDERTASTEN, 'initiative'));
        sammeln(await messeTasten(page, EINZELTASTEN, 'loot'));

        // Lage (C): die Gruppentasten auf einem Gruppenglied, beide Achsen.
        for (const gruppe of [GRUPPE_WAAGERECHT, GRUPPE_SENKRECHT]) {
            const erg = await messeGruppentasten(page, gruppe);
            sammeln(erg);
        }

        const luegen = [...genannt].filter(t => !belegt.has(t) && !ausgenommen.has(t));
        expect(
            luegen,
            'Diese Tasten NENNT die Hilfe, aber in keiner der gemessenen Lagen tut sie ' +
                `etwas: ${luegen.join(' ')}.\n` +
                'Gemessen belegt wurden: ' +
                [...belegt].sort().join(' ') +
                '\n\nDas ist der haeufigere Verfall: ein Kuerzel wird umgebaut oder fallen ' +
                'gelassen, die Hilfe nennt es weiter, und der Nutzer probiert eine Taste, ' +
                'die nichts tut, und haelt die App fuer kaputt. (So liegt es heute bei ' +
                '`Entf`/`Backspace`, das `CLAUDE.md` fuehrt: der Zweig in ' +
                '`systems/spellslots/keyboard-shortcuts.js` prueft `#view-network.active`, ' +
                'und ein `#view-network` gibt es im Buendel nicht — die Ansicht heisst ' +
                '`view-links`. Darum steht es zu Recht NICHT in der Hilfe.)\n' +
                'Entweder die Zeile aus der Hilfe nehmen, oder — wenn die Taste nur in ' +
                'einer hier nicht gemessenen Lage wirkt — mit Grund auf `NUR_HILFE`.'
        ).toEqual([]);
    });

    // ============================================================
    // (6) DIE LISTEN SIND GEZAEHLT UND BEGRUENDET
    // ============================================================

    test('(6) die Ausnahmelisten sind festgenagelt und jeder Eintrag tragt einen Grund', () => {
        // Festgenagelt am 2026-10-14 (HILF). Eine Aenderung dieser Zahlen ist
        // eine Entscheidung und kein Nebenprodukt: nach OBEN heisst sie "eine
        // weitere Taste bleibt undokumentiert", nach UNTEN "eine Luecke ist
        // geschlossen". Beides gehoert in eine Commit-Botschaft.
        expect(AUSNAHMEN.length, 'Die Ausnahmeliste hat vier Eintraege').toBe(4);
        expect(NUR_HILFE.length, 'Die Gegenliste hat drei Eintraege').toBe(3);

        for (const eintrag of [...AUSNAHMEN, ...NUR_HILFE]) {
            expect(eintrag.taste, 'jeder Eintrag nennt eine Taste').toMatch(/\S/);
            expect(
                (eintrag.grund || '').length,
                `Der Eintrag "${eintrag.taste}" hat keinen brauchbaren Grund. Ein Wort wie ` +
                    '"spaeter" oder "bekannt" ist keiner — es muss dastehen, WARUM die ' +
                    'Taste nicht in die Hilfe gehoert, nachpruefbar.'
            ).toBeGreaterThan(80);
        }

        // Keine Taste auf beiden Listen — das waere ein Widerspruch in sich.
        const doppelt = AUSNAHMEN.map(a => a.taste).filter(t => NUR_HILFE.some(n => n.taste === t));
        expect(doppelt, 'keine Taste steht auf beiden Listen').toEqual([]);
    });

    // ============================================================
    // (7) DIE HILFE IST MIT DER TASTATUR BEDIENBAR
    // ============================================================

    test('(7) die offene Hilfe nimmt den Fokus auf und gibt ihn bei Escape zurueck', async ({
        page
    }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'initiative');

        // Geoeffnet wird mit der Taste, nicht mit einem Aufruf — der Weg des
        // Nutzers.
        await page.keyboard.press('Shift+/');
        await page.waitForTimeout(450);
        expect(
            await page.evaluate(() => !!document.querySelector('#shortcuts-overlay.show')),
            'Vorbedingung: "?" oeffnet die Hilfe'
        ).toBe(true);

        const nachOeffnen = await page.evaluate(() => ({
            drin: !!document.activeElement?.closest?.('#shortcuts-overlay'),
            el:
                (document.activeElement?.tagName || '?') +
                '.' +
                (typeof document.activeElement?.className === 'string'
                    ? document.activeElement.className.split(/\s+/)[0]
                    : '')
        }));
        expect(
            nachOeffnen.drin,
            'Beim Oeffnen muss der Fokus IN der Hilfe landen. Gemessen am Ausgangsstand ' +
                `(HEAD 52caf1d) lag er danach auf \`${nachOeffnen.el}\` — ausserhalb. ` +
                'Folge: die Hilfe scrollt auf dem Telefon (gemessen 820 px Inhalt in ' +
                '622 px Flaeche), und ohne Fokus darin bewegt keine Taste diesen Lauf — ' +
                'die untere Haelfte der Hilfe ist allein mit der Tastatur nicht zu lesen. ' +
                'Die Hilfe ist dabei genau das Werkzeug des Tastaturnutzers.'
        ).toBe(true);

        // UND DAS IST DER GRUND, WARUM DER FOKUS DORT HINGEHOERT — die
        // Behauptung "der Fokus liegt drin" ist nur so viel wert wie das, was
        // sie ermoeglicht. Die Hilfe laeuft seit dem Nachtragen auch bei
        // 1440 px ueber (gemessen 1283 px Inhalt in 638 px Flaeche), und ein
        // Laufbereich bewegt sich mit der Tastatur nur, wenn der Fokus darin
        // liegt. Gemessen vor der Behebung: KEINE Taste bewegte ihn. Danach:
        // Bild-ab 0 -> 558 px, Pfeil-ab weitere 40 px.
        const laufVor = await page.evaluate(
            () => document.querySelector('.shortcuts-modal').scrollTop
        );
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(300);
        const laufNach = await page.evaluate(
            () => document.querySelector('.shortcuts-modal').scrollTop
        );
        expect(
            await page.evaluate(() => {
                const m = document.querySelector('.shortcuts-modal');
                return m.scrollHeight > m.clientHeight + 1;
            }),
            'Vorbedingung: die Hilfe hat mehr Inhalt als Flaeche — sonst gibt es nichts zu ' +
                'laufen und dieser Teil des Falls prueft nichts'
        ).toBe(true);
        expect(
            laufNach,
            `Bild-ab muss die offene Hilfe laufen lassen (von ${laufVor} px aus). Bleibt ` +
                'sie stehen, liegt der Fokus nicht in ihrem Laufbereich, und der untere ' +
                'Teil der Hilfe ist mit der Tastatur unerreichbar.'
        ).toBeGreaterThan(laufVor);

        // Und der Rueckweg: Escape schliesst und laesst den Fokus nicht im
        // Nichts stehen.
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        expect(
            await page.evaluate(() => !!document.querySelector('#shortcuts-overlay.show')),
            'Escape schliesst die Hilfe'
        ).toBe(false);
        expect(
            await page.evaluate(() => !!document.activeElement?.closest?.('#shortcuts-overlay')),
            'nach dem Schliessen liegt der Fokus nicht mehr in der (unsichtbaren) Hilfe — ' +
                'sonst bedient der naechste Anschlag eine Flaeche mit `opacity: 0`'
        ).toBe(false);

        // Die Leertaste gehoert danach wieder dem Zug (dieselbe Zusicherung,
        // die `tastatur-kuerzel.spec.js` (j) fuer den HP-Rechner gibt): ein
        // per Taste geoeffneter Dialog darf keinen Oeffner vortaeuschen, auf
        // dem der Fokus danach haengt und die Leertaste verbraucht.
        const zugVor = await page.evaluate(() => window.D.initiative.currentTurn);
        await page.keyboard.press(' ');
        await page.waitForTimeout(350);
        expect(
            await page.evaluate(() => window.D.initiative.currentTurn),
            'nach dem Schliessen der Hilfe wechselt die Leertaste wieder den Zug'
        ).not.toBe(zugVor);
    });

    // ============================================================
    // (7b) DIE ANDERE HAELFTE DERSELBEN SACHE
    // ============================================================
    //
    // WARUM DIESER FALL HIER STEHT, OBWOHL `tastatur-ausloesung.spec.js` (g2)
    // dasselbe zusichert. Weil (g2) mich erwischt hat und ich den Grund nicht
    // ein zweites Mal selbst finden will. Die erste Fassung von Fall (7) hat
    // den Fokus in die Hilfe geholt und beim Schliessen FREIGEGEBEN — richtig
    // fuer `?`, falsch fuer die Maus: (g2) klickt den ⌨️-Knopf und sichert
    // zu, dass der geklickte Knopf den Fokus behaelt. Gemessen nach jener
    // Fassung: `BODY` statt `BUTTON`.
    //
    // (g2) liegt in einer Datei ueber die AUSLOESUNG von Kuerzeln; wer an der
    // Fokusuebergabe der Hilfe arbeitet, fasst `showShortcutsOverlay()` an
    // und fuehrt diese Datei. Die zwei Faelle bewachen dieselbe Zusicherung
    // aus zwei Richtungen, und das ist hier Absicht und nicht Versehen: Fall
    // (7) verlangt, dass der Fokus HINEIN geht, dieser hier, dass er
    // ZURUECKKOMMT. Eine Umsetzung, die nur eines von beiden kann, ist rot —
    // in genau einem der zwei Faelle.
    test('(7b) per Maus geoeffnet, gibt Escape den Fokus an den Oeffner zurueck', async ({
        page
    }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'initiative');

        await page.click('button[data-action="show-shortcuts-overlay"]');
        await page.waitForTimeout(450);
        expect(
            await page.evaluate(() => !!document.querySelector('#shortcuts-overlay.show')),
            'Vorbedingung: der Klick oeffnet die Hilfe'
        ).toBe(true);
        expect(
            await page.evaluate(() => !!document.activeElement?.closest?.('#shortcuts-overlay')),
            'auch per Maus geoeffnet liegt der Fokus in der Hilfe — sonst ist ihr ' +
                'Laufbereich wieder unerreichbar'
        ).toBe(true);

        await page.keyboard.press('Escape');
        await page.waitForTimeout(450);
        expect(
            await page.evaluate(() => ({
                tag: document.activeElement?.tagName,
                aktion: document.activeElement?.getAttribute?.('data-action')
            })),
            'Nach Escape gehoert der Fokus dem geklickten ⌨️-Knopf zurueck. Liegt er auf ' +
                'BODY, ist der Oeffner verloren — der Nutzer steht nach dem Schliessen am ' +
                'Anfang der Tabulatorreihe und muss sich seinen Platz neu erlaufen.'
        ).toEqual({ tag: 'BUTTON', aktion: 'show-shortcuts-overlay' });
    });

    // ============================================================
    // (8) DIE HILFE AUF DEM TELEFON
    // ============================================================

    test('(8) die Hilfe ist bei 390 und 360 px lesbar und laeuft nicht quer', async ({ page }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'initiative');

        // WAS HIER NICHT GEMESSEN WIRD, und warum — der erste Entwurf dieses
        // Falls hat die SPANNENBREITE der Beschriftung gemessen und verlangt,
        // dass keine unter 60 px faellt. Das war falsch: `.shortcut-row` ist
        // `justify-content: space-between`, die Beschriftung nimmt also genau
        // die Breite ihres Textes. "W20" sind gemessen 18 px, bei 1440 px wie
        // bei 360 px — eine kurze Beschriftung ist kurz und nicht gequetscht.
        // Gemessen wird darum, was auf dem Telefon wirklich kaputtgeht: der
        // UMBRUCH der Beschriftung (zwei Zeilen statt einer), das ABSCHNEIDEN
        // (`scrollWidth > clientWidth`) und der Querlauf.
        for (const breite of TELEFON) {
            await page.setViewportSize({ width: breite, height: 780 });
            await page.waitForTimeout(250);
            await page.keyboard.press('Shift+/');
            await page.waitForTimeout(400);

            const mass = await page.evaluate(() => {
                const m = document.querySelector('.shortcuts-modal');
                const g = document.querySelector('.shortcuts-grid');
                const reihen = Array.from(document.querySelectorAll('.shortcut-row'));
                if (!m || !g || reihen.length === 0) return null;
                const zeilenhoehe = parseFloat(getComputedStyle(reihen[0]).lineHeight) || 18;
                return {
                    modalBreite: Math.round(m.getBoundingClientRect().width),
                    spalten: getComputedStyle(g).gridTemplateColumns.split(' ').length,
                    spaltenRoh: getComputedStyle(g).gridTemplateColumns,
                    docQuerlauf: document.documentElement.scrollWidth > window.innerWidth + 1,
                    modalQuerlauf: m.scrollWidth > m.clientWidth + 1,
                    // Die Satzhoehe je Zeile in ZEILEN, aus der gemessenen
                    // Hoehe abzueglich des Polsters (`padding: 6px 0`).
                    dreiZeilig: reihen
                        .map(r => ({
                            z: Math.round((r.getBoundingClientRect().height - 12) / zeilenhoehe),
                            t: (r.querySelector('span')?.textContent || '').trim()
                        }))
                        .filter(x => x.z >= 3)
                        .map(x => `${x.t} (${x.z} Zeilen)`),
                    abgeschnitten: reihen
                        .filter(r => {
                            const s = r.querySelector('span');
                            return s && s.scrollWidth > s.clientWidth + 1;
                        })
                        .map(r => (r.querySelector('span')?.textContent || '').trim()),
                    reihen: reihen.length
                };
            });

            expect(mass, `bei ${breite} px ist die Hilfe nicht zu finden`).not.toBeNull();
            expect(
                mass.docQuerlauf,
                `bei ${breite} px laeuft das Dokument quer — die Hilfe sprengt die Breite`
            ).toBe(false);
            expect(
                mass.modalQuerlauf,
                `bei ${breite} px laeuft die Hilfe selbst quer; ein Querlauf in einem ` +
                    'Dialog ist auf dem Telefon praktisch unauffindbar'
            ).toBe(false);
            expect(
                mass.abgeschnitten,
                `bei ${breite} px sind Beschriftungen abgeschnitten: ` +
                    `${mass.abgeschnitten.join(' | ')}`
            ).toEqual([]);
            expect(
                mass.spalten,
                `Bei ${breite} px steht das Raster der Hilfe auf ${mass.spalten} Spalten ` +
                    `(${mass.spaltenRoh}) in einem Dialog von ${mass.modalBreite} px. ` +
                    'Gemessen am Ausgangsstand teilt `repeat(2, 1fr)` die 276 nutzbaren ' +
                    'Bildpunkte in 115 und 165 — ungleich, weil `1fr` zu ' +
                    '`minmax(auto, 1fr)` aufloest und der Mindestinhalt die breitere ' +
                    'Spalte gewinnt. Mit sechs Abschnitten wird die schmale Spalte zur ' +
                    'Schlucht. Eine Spalte unter einer Media-Query ist der Ausweg.'
            ).toBe(1);
            // ZWEI ZEILEN SIND ERLAUBT, DREI NICHT — und diese Grenze ist
            // gemessen, nicht gesetzt. In einer Spalte von 274 px bricht eine
            // erklaerende Beschriftung wie "Nächster Zug (Fokus auf keinem
            // Bedienelement)" auf zwei Zeilen um, und das ist richtig so: die
            // Erklaerung ist der Zweck der Zeile. Drei Zeilen heissen, dass
            // die Spalte den Text wortweise bricht. Gemessen nach dieser
            // Arbeit: Hoechstwert 2 Zeilen bei allen fuenf gepruefien
            // Breiten, 6 von 40 Reihen zweizeilig bei 360 px.
            expect(
                mass.dreiZeilig,
                `Bei ${breite} px braucht eine Beschriftung drei Zeilen oder mehr: ` +
                    `${mass.dreiZeilig.join(' | ')}. Entweder ist die Beschriftung zu lang ` +
                    'oder die Spalte zu schmal.'
            ).toEqual([]);

            await page.keyboard.press('Escape');
            await page.waitForTimeout(250);
        }

        // UND AM SCHREIBTISCH, zwei Spalten. Der Fall heisst "Telefon", aber
        // die Laenge der Beschriftungen entscheidet sich bei 1440 px zuerst:
        // dort sind die Spalten 267 px breit, also nur 7 px weiter als die
        // EINE Spalte bei 360 px. Eine Beschriftung, die hier dreizeilig
        // wird, ist einfach zu lang — und genau so war es im ersten Entwurf
        // dieser Arbeit (eine Zeile mit 60 Zeichen, gemessen dreizeilig).
        await page.setViewportSize(BREIT);
        await page.waitForTimeout(250);
        await page.keyboard.press('Shift+/');
        await page.waitForTimeout(400);
        const breit = await page.evaluate(() => {
            const reihen = Array.from(document.querySelectorAll('.shortcut-row'));
            const g = document.querySelector('.shortcuts-grid');
            const zh = parseFloat(getComputedStyle(reihen[0]).lineHeight) || 18;
            return {
                spalten: getComputedStyle(g).gridTemplateColumns.split(' ').length,
                spaltenRoh: getComputedStyle(g).gridTemplateColumns,
                dreiZeilig: reihen
                    .map(r => ({
                        z: Math.round((r.getBoundingClientRect().height - 12) / zh),
                        t: (r.querySelector('span')?.textContent || '').trim()
                    }))
                    .filter(x => x.z >= 3)
                    .map(x => `${x.t} (${x.z} Zeilen)`)
            };
        });
        expect(breit.spalten, 'bei 1440 px stehen zwei Spalten').toBe(2);
        expect(
            breit.spaltenRoh,
            'die zwei Spalten sind gleich breit — `minmax(0, 1fr)`, nicht `1fr`. ' +
                `Gemessen: ${breit.spaltenRoh}`
        ).toBe('267px 267px');
        expect(
            breit.dreiZeilig,
            `Bei 1440 px braucht eine Beschriftung drei Zeilen: ${breit.dreiZeilig.join(' | ')}`
        ).toEqual([]);
    });

    // ============================================================
    // (9) DIE LAGE, DIE DEN STIL-SOLLSTAND UNBERUEHRT LAESST
    // ============================================================

    test('(9) die Hilfe liegt ausserhalb aller Ansichtsbehaelter und traegt genau einen Inline-Stil', async ({
        page
    }) => {
        test.setTimeout(90_000);
        await ansichtOeffnen(page, 'initiative');

        const zu = await hilfeLesen(page);
        expect(
            zu.imAnsichtsbehaelter,
            'Die Hilfe liegt in einem `#view-*`-Behaelter. Damit erfasst sie ' +
                '`computed-style-diff.spec.js` (es sammelt ' +
                '`getElementById("view-"+id).querySelectorAll("*")`), und jede Zeile, die ' +
                'hier dazukommt, bewegt ab sofort den Stil-Sollstand. Genau diese Lage ist ' +
                'die Freigabe fuer diese Arbeit — sie darf nicht still verschwinden.'
        ).toBe(false);

        // Und GEOEFFNET genauso: die Erfassung haengt an der Elternkette,
        // nicht am Zustand. Der Gegentest steht hier, weil "die Hilfe ist zu,
        // darum wird sie nicht erfasst" die naheliegende und FALSCHE
        // Begruendung ist.
        await page.keyboard.press('Shift+/');
        await page.waitForTimeout(400);
        const offen = await hilfeLesen(page);
        expect(
            offen.imAnsichtsbehaelter,
            'auch geoeffnet liegt die Hilfe ausserhalb aller Ansichtsbehaelter'
        ).toBe(false);

        // Der Inline-Zaehler steht projektweit auf 251
        // (tests/unit/design-consistency.test.js). Die Hilfe traegt genau
        // EINEN Inline-Stil, die Fusszeile; neue Zeilen duerfen keinen
        // zweiten mitbringen.
        expect(
            offen.inlineStile,
            `Die Hilfe traegt ${offen.inlineStile} Inline-Stile. Genau einer ist erlaubt ` +
                '(die Fusszeile, vorbestehend). Der projektweite Zaehler ist auf 251 ' +
                'festgenagelt — ein zweiter hier macht ' +
                '`tests/unit/design-consistency.test.js` rot.'
        ).toBe(1);
    });

    // ============================================================
    // (10) DIE RESTSCHULD, GEZAEHLT
    // ============================================================

    test('(10) was dieser Waechter NICHT misst, steht gezaehlt in seiner Quelle', () => {
        // Diese Datei behauptet nicht, jede denkbare Tastenkombination
        // gemessen zu haben. Sie behauptet, eine BENANNTE Menge gemessen zu
        // haben — und dieser Fall haelt die Zahlen fest, damit die Behauptung
        // nachpruefbar bleibt und nicht mit der Zeit groesser erzaehlt wird.
        expect(EINZELTASTEN.length, '68 Einzelkandidaten wie in der Vermessung zu E-4').toBe(68);
        expect(new Set(EINZELTASTEN).size, 'ohne Dubletten').toBe(68);
        expect(MODIFIKATORTASTEN.length, 'die gerechnete Menge der Modifikatorkuerzel').toBe(80);
        expect(new Set(MODIFIKATORTASTEN).size, 'ohne Dubletten').toBe(80);
        expect(SONDERTASTEN.length, 'die benannten Tasten').toBe(14);
        expect(GRUPPENTASTEN.length, 'die Gruppentasten aus E-2').toBe(6);

        // UND DER GERECHNETE KERN IST VOLLSTAENDIG. Diese zwei Zusicherungen
        // sind der Unterschied zur ersten Fassung: die Kreuzung aus den acht
        // Einzeltasten-Kuerzeln und den vier Modifikatorlagen muss
        // LUECKENLOS in der Messmenge stehen. Genau dort sassen die acht
        // Kollisionen, die eine handverlesene Liste von 46 Kandidaten
        // uebersehen hat.
        expect(APP_EINZELKUERZEL.length, 'die acht Einzeltasten-Kuerzel der App').toBe(8);
        expect(MODIFIKATORLAGEN.length, 'die vier Modifikatorlagen').toBe(4);
        expect(KREUZUNG.length, 'vier Lagen mal acht Kuerzel').toBe(32);
        const kreuzungFehlt = KREUZUNG.filter(k => !MODIFIKATORTASTEN.includes(k));
        expect(
            kreuzungFehlt,
            'Diese Kombinationen der gerechneten Kreuzung fehlen in der Messmenge: ' +
                `${kreuzungFehlt.join(' ')}. Die Kreuzung ist der Kern dieser Liste — ` +
                'eine Luecke darin ist genau der Fehler, den die erste Fassung achtmal ' +
                'gemacht hat.'
        ).toEqual([]);
        for (const ziffer of '0123456789'.split('')) {
            expect(MODIFIKATORTASTEN, `Alt+${ziffer} wird gemessen`).toContain(`Alt+${ziffer}`);
            expect(MODIFIKATORTASTEN, `Alt+Shift+${ziffer} wird gemessen`).toContain(
                `Alt+Shift+${ziffer}`
            );
        }

        // NICHT GEMESSEN, und das ist die ehrliche Rechnung: die volle
        // Kreuzung aus vier Modifikatorlagen (Strg, Alt, Shift, Alt+Shift)
        // und 68 Kandidaten waere 272 Anschlaege JE ANSICHT. Gemessen werden
        // 80 — also 192 Kombinationen weniger, und das in zwei von 24
        // Ansichten. Was fehlt, sind Modifikator-Kombinationen auf
        // Buchstaben OHNE eigenes App- oder Browserkuerzel und auf
        // Satzzeichen; dazu die DREIFACHEN Lagen (`Strg+Alt+…`,
        // `Strg+Alt+Shift+…`), die in dieser Datei gar nicht vorkommen — dort
        // sitzen die drei Zweige, die nur `(e.ctrlKey || e.metaKey)` pruefen
        // (`Strg+S`, `Strg+K/F`, die Soundboard-Familie) und die eine
        // `Strg+Alt`-Lage mitnehmen wuerden. Ein Kuerzel dort waere ein
        // ungewoehnlicher Griff; die Luecke ist gezaehlt und nicht
        // verschwiegen.
        const VOLLE_KREUZUNG = 4 * 68;
        expect(VOLLE_KREUZUNG - MODIFIKATORTASTEN.length).toBe(192);
    });
});

/**
 * Misst die Gruppentasten auf einem Gruppenglied — Lage (C).
 *
 * JE TASTE EIN FRISCHER SEITENAUFBAU, und das ist nicht Vorsicht, sondern
 * Notwendigkeit: hier kommen echte Tabulatorspruenge vor, und Chromiums
 * "sequential focus navigation starting point" ueberlebt ein `blur()`. Ohne
 * frischen Aufbau liefe der naechste `Tab` weiter statt von vorn, und die
 * Suche nach dem Glied faende ein anderes.
 * @param {import('@playwright/test').Page} page
 * @param {{name: string, ansicht: string, glied: string, achse: string}} gruppe
 */
async function messeGruppentasten(page, gruppe) {
    /** @type {Record<string, any>} */
    const erg = {};
    const AUF_GLIED = `(() => { const el = document.activeElement;
        return !!(el && el.matches && el.matches('${gruppe.glied}')); })()`;

    for (const taste of GRUPPENTASTEN) {
        await ansichtOeffnen(page, gruppe.ansicht);
        let gefunden = false;
        for (let i = 1; i <= 320; i++) {
            await page.keyboard.press('Tab');
            if (await page.evaluate(AUF_GLIED)) {
                gefunden = true;
                break;
            }
        }
        if (!gefunden) {
            erg[taste] = {
                verhindert: false,
                wirkung: [],
                nebenwirkung: [],
                belegt: false,
                hinweis: `kein Glied der Gruppe "${gruppe.name}" erreichbar`
            };
            continue;
        }
        const vor = await page.evaluate(SPUR);
        await page.evaluate(() => {
            window.__hilfTasten = [];
        });
        await page.keyboard.press(taste);
        await page.waitForTimeout(240);
        const nach = await page.evaluate(SPUR);
        const mitschrift = await page.evaluate(() => window.__hilfTasten.slice());
        const verhindert = mitschrift.some(m => m.verhindert);
        erg[taste] = {
            verhindert,
            wirkung: spurDelta(vor, nach, KEINE_BELEGUNG),
            nebenwirkung: spurDelta(vor, nach).filter(x =>
                KEINE_BELEGUNG.some(k => x.startsWith(k + ':'))
            ),
            belegt: verhindert || spurDelta(vor, nach, KEINE_BELEGUNG).length > 0
        };
    }
    return erg;
}

// ============================================================
// (11) DIE GRUPPENACHSEN, GEMESSEN — die Grundlage der E-2-Zeile
// ============================================================
//
// WARUM DAS EIN EIGENER FALL IST. Die Zeile, die fuer E-2 in die Hilfe
// kommt, muss sagen, WANN sie gilt. Ein Nutzer, der `←` im Nichts probiert
// und nichts geschieht, haelt die Hilfe fuer falsch. Und sie muss BEIDE
// Achsen nennen, weil die Achse an der Gestalt der Gruppe haengt und nicht
// fest ist. Dieser Fall belegt genau das: auf der waagerechten Gruppe sind
// `←/→` belegt und `↑/↓` nicht, auf der senkrechten umgekehrt — und `Pos1`
// und `Ende` auf beiden.

test.describe('HILF — die Achsen, die die E-2-Zeile behauptet', () => {
    test('(11) die Achse einer Gruppe entscheidet, welche Pfeiltasten belegt sind', async ({
        page
    }) => {
        test.setTimeout(600_000);

        const waagerecht = await messeGruppentasten(page, GRUPPE_WAAGERECHT);
        const senkrecht = await messeGruppentasten(page, GRUPPE_SENKRECHT);

        const lage = (erg, t) => (erg[t]?.belegt ? 'belegt' : 'frei');

        expect(
            {
                links: lage(waagerecht, 'ArrowLeft'),
                rechts: lage(waagerecht, 'ArrowRight'),
                pos1: lage(waagerecht, 'Home'),
                ende: lage(waagerecht, 'End')
            },
            `Auf der waagerechten Gruppe ("${GRUPPE_WAAGERECHT.name}") muessen ←/→ und ` +
                'Pos1/Ende fuehren. Tut es eine nicht, ist die E-2-Zeile der Hilfe eine ' +
                'unbelegte Behauptung.'
        ).toEqual({ links: 'belegt', rechts: 'belegt', pos1: 'belegt', ende: 'belegt' });

        expect(
            {
                oben: lage(senkrecht, 'ArrowUp'),
                unten: lage(senkrecht, 'ArrowDown'),
                pos1: lage(senkrecht, 'Home'),
                ende: lage(senkrecht, 'End')
            },
            `Auf der senkrechten Gruppe ("${GRUPPE_SENKRECHT.name}") muessen ↑/↓ und ` +
                'Pos1/Ende fuehren. Ohne diesen Durchgang wuerde die Hilfe ↑/↓ nennen, ' +
                'ohne dass ein Fall es belegt — gemessen sind ↑/↓ auf der WAAGERECHTEN ' +
                'Gruppe naemlich frei (sie gehoeren dort dem Seitenlauf des Browsers).'
        ).toEqual({ oben: 'belegt', unten: 'belegt', pos1: 'belegt', ende: 'belegt' });

        // Und die Gegenprobe, die aus der Aussage erst eine Aussage macht:
        // die Querachse ist je Gruppe FREI. Waeren alle vier Pfeiltasten auf
        // beiden Gruppen belegt, wuerde eine Hilfe, die nur eine Achse nennt,
        // nicht auffallen — und `ui/keyboard-group.js` gaebe seine Zusage
        // nicht ein, Oben/Unten auf einer waagerechten Leiste dem Browser zu
        // lassen.
        expect(
            { oben: lage(waagerecht, 'ArrowUp'), unten: lage(waagerecht, 'ArrowDown') },
            'Auf einer WAAGERECHTEN Gruppe gehoeren ↑/↓ dem Seitenlauf des Browsers — ' +
                '`ui/keyboard-group.js` sagt das ausdruecklich zu ("Oben/Unten auf einer ' +
                'waagerechten Leiste gehoeren weiter dem Browser"). Sind sie belegt, ist ' +
                'diese Zusage gebrochen.'
        ).toEqual({ oben: 'frei', unten: 'frei' });
    });
});

// ============================================================
// (12) DIE QUELLE DER HILFE IST DIE EINE STELLE
// ============================================================
//
// WARUM DIESER FALL KEIN TAUTOLOGISCHER IST. Er prueft NICHT den Selektor
// gegen seine eigene Datei. Er prueft eine andere Behauptung: dass der Block
// `#shortcuts-overlay` an genau EINER Stelle im Quellbaum steht und nicht vom
// Werkzeuggenerator `tools/sync-editor-toolbars.js` ueberschrieben wird.
// Beides ist die Voraussetzung dafuer, dass Handarbeit an der Hilfe
// ueberhaupt der richtige Weg ist — CLAUDE.md verbietet Handarbeit an den
// 22 Werkzeugleisten aus genau dem Grund, dass der naechste Lauf des
// Werkzeugs sie ueberschreibt.

test.describe('HILF — die Hilfe hat genau eine Quelle', () => {
    test('(12) der Block steht in genau einer Template-Datei und in keiner Leiste', () => {
        const tplDir = path.join(process.cwd(), 'assets/templates');
        const dateien = fs.readdirSync(tplDir).filter(f => f.endsWith('.html'));
        const treffer = dateien.filter(f =>
            fs.readFileSync(path.join(tplDir, f), 'utf8').includes('id="shortcuts-overlay"')
        );
        expect(
            treffer,
            `Der Block \`#shortcuts-overlay\` steht in ${treffer.length} Template-Dateien ` +
                `(${treffer.join(', ')}). Zwei Quellen heissen: eine Haelfte der ` +
                'Nachtraege landet in der Datei, die das Buendel nicht nimmt.'
        ).toEqual(['modals-editors.html']);

        // Und er liegt in KEINEM `editor-toolbar`-Block. Das ist die
        // nachpruefbare Form der Frage "beruehrt der Generator die Hilfe?":
        // `tools/sync-editor-toolbars.js` findet seine Bloecke ueber
        // `/<div class="editor-toolbar[^"]*"[^>]*>/` und schreibt
        // ausschliesslich dort. Was in keinem solchen Block liegt, kann er
        // nicht ueberschreiben.
        const inhalt = fs.readFileSync(path.join(tplDir, 'modals-editors.html'), 'utf8');
        const start = inhalt.indexOf('id="shortcuts-overlay"');
        const bis = inhalt.indexOf('</div>', inhalt.indexOf('shortcuts-grid'));
        const block = inhalt.slice(start, bis > start ? bis : start + 4000);
        expect(
            block.includes('editor-toolbar'),
            'Der Hilfe-Block enthaelt `editor-toolbar` — dann schreibt ' +
                '`tools/sync-editor-toolbars.js` dort hinein und Handarbeit an der Hilfe ' +
                'waere der falsche Weg (CLAUDE.md: "Leisten niemals von Hand in Templates ' +
                'editieren").'
        ).toBe(false);
    });
});

// ============================================================
// (13)-(14) DIE OFFENE HILFE IST EIN DIALOG — zwei Zusicherungen,
//           die sie bis hierher GEDRUCKT, aber nicht gehalten hat
// ============================================================
//
// WARUM DAS EINE EIGENE GRUPPE IST UND NICHT EINE ZEILE MEHR IN (7). Fall
// (7) prueft, dass der Fokus in die Hilfe GEHT und zurueckkommt. Diese zwei
// Faelle pruefen, was gilt, SOLANGE sie offen steht — und das war zweierlei,
// beides gemessen und beides falsch:
//
//   (13) IHRE EIGENE TAB-ZEILE WAR EINE FALSCHAUSSAGE. Die Hilfe druckt
//        "Naechstes Bedienelement (im Dialog bleibt er darin)". Gemessen am
//        gebauten Buendel (1440x900, echte Tastendruecke, 45 Spruenge):
//        44 von 45 verliessen die offene Hilfe, ab dem zweiten Anschlag stand
//        der Fokus auf Bedienelementen UNTER der Blende — `BODY`, dann drei
//        Knoepfe, dann `INPUT#global-search` —, alle laut
//        `document.elementFromPoint` von `DIV.shortcuts-overlay` verdeckt,
//        waehrend die Hilfe sichtbar offen blieb. Dasselbe fuer Shift+Tab
//        (5 von 5 sofort draussen). Zum Vergleich in derselben Messung:
//        `about-modal`, eine gewoehnliche Schale, hielt 20 von 20; und von
//        109 sichtbaren Haltepunkten der Seite lag genau EINER in der Hilfe.
//        URSACHE: `ui/modal-focus.js` sucht die Schale ueber
//        `.modal-overlay.show` (plus `#quicknotes-modal`). Die Hilfe traegt
//        `.shortcuts-overlay` und fiel aus beiden — `oberstesModal()` gab
//        `null` (nachgemessen: `ModalFocus.statistik().offen === null` bei
//        offener Hilfe), die Falle zog sich zurueck. Der Kommentar dort
//        begruendete das ausdruecklich ("WARUM `.shortcuts-overlay.show`
//        NICHT DAZUGEHOERT"), aber mit einer Messung aus einer ANDEREN Lage:
//        Hilfe UEBER einem offenen Dialog, wo sie damals keinen eigenen
//        Haltepunkt hatte und es nichts zu entziehen gab. Seit der
//        Fokusuebergabe von Fall (7) ist die Lage eine andere, und die
//        Begruendung traegt nicht mehr.
//        EINE FALSCHE HILFE IST SCHLIMMER ALS EINE FEHLENDE: der Nutzer liest
//        die Zusage, tabuliert zur Probe und drueckt Enter auf einem Knopf,
//        den er nicht sieht.
//
//   (14) DIE OFFENE HILFE WAR EINE LEBENDE TASTATURFLAECHE. Gemessen (je
//        Taste frischer Zustand, Hilfe mit `?` geoeffnet, Initiative-Ansicht):
//        von 34 geprueften Tasten aenderten 29 den Zustand HINTER der Blende,
//        und die Hilfe blieb in allen 34 Faellen offen. Auszug: `2` ->
//        Ansicht view-initiative -> view-party | `9` -> view-loot | `N` ->
//        Zug 0 -> 1 | `P` -> Zug 0 -> 5 | `Shift+N` -> Runde 1 -> 2 | `R`,
//        `Alt+1/2/4/6/8` -> Wuerfelverlauf 0 -> 1 | `T` -> Sitzungsuhr laeuft
//        | `L` -> Ereignislog dauerhaft | `Strg+Z/Y/S` -> je ein
//        Protokolleintrag. Und FUENF Tasten zogen den Fokus in ein
//        Eingabefeld unter der Blende: `Strg+K`, `Strg+F` ->
//        `INPUT#global-search`, `Strg+Shift+K`, `Strg+.` -> `INPUT.cp-input`,
//        `/` -> `INPUT#qref-search-input`. Danach landeten Anschlaege in
//        einem Feld, das der Nutzer nicht sehen kann.
//        Die Hilfe ist genau die Flaeche, die man aufschlaegt, wenn man nicht
//        weiss, was eine Taste tut — sie laedt zum Ausprobieren ein, und am
//        Spieltisch rueckte jede Probe Zug und Runde des laufenden Kampfes.
//
// WAS BEIDE FAELLE NICHT VERLANGEN: dass die Hilfe die BROWSERVORGABEN
// schluckt. Ihr Inhalt ist laenger als ihre Flaeche (gemessen 2081 px in
// 673 px bei 390 px Breite), und Bild-ab, Pfeile und Leertaste muessen ihn
// weiter laufen lassen. "Taub" heisst hier: kein APP-Kuerzel feuert; `Escape`
// bleibt der Ausweg. Fall (7) prueft den Lauf, Fall (14) die Stille.

test.describe('HILF — die offene Hilfe ist ein Dialog', () => {
    test('(13) der Tabulator bleibt in der offenen Hilfe', async ({ page }) => {
        test.setTimeout(180_000);
        await ansichtOeffnen(page, 'initiative');

        // DIE KONTROLLMESSUNG ZUERST, und sie ist nicht Zierde: ohne sie
        // wuerde dieser Fall auch dann gruen, wenn die Fokusfalle UEBERALL
        // kaputt waere — "0 von 0 Spruengen verliessen den Dialog" ist wahr.
        // Eine gewoehnliche Schale muss im selben Lauf halten.
        await page.evaluate(() => {
            document.activeElement?.blur?.();
            window.showModal('about-modal');
        });
        await page.waitForTimeout(400);
        let drin = 0;
        for (let i = 0; i < 20; i++) {
            await page.keyboard.press('Tab');
            if (
                await page.evaluate(() =>
                    document.getElementById('about-modal').contains(document.activeElement)
                )
            ) {
                drin++;
            }
        }
        expect(
            drin,
            'Vorbedingung: eine gewoehnliche Schale (`about-modal`) haelt den Tabulator. ' +
                `Gemessen ${drin} von 20 Spruengen darin. Haelt sie nicht, ist die ` +
                'Fokusfalle selbst kaputt und dieser Fall misst nichts — dann zuerst ' +
                '`tests/e2e/features/modal-fokus.spec.js` lesen.'
        ).toBe(20);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(350);

        // UND JETZT DIE HILFE, mit der Taste geoeffnet — der Weg des Nutzers.
        await page.evaluate(() => {
            document.activeElement?.blur?.();
        });
        await page.keyboard.press('Shift+/');
        await page.waitForTimeout(450);
        expect(
            await page.evaluate(() => !!document.querySelector('#shortcuts-overlay.show')),
            'Vorbedingung: "?" oeffnet die Hilfe'
        ).toBe(true);

        // Die Zeile, fuer die dieser Fall haftet — aus dem Buendel gelesen,
        // nicht abgetippt. Fehlt sie, ist die Zusage weg, und der Fall soll
        // es sagen statt stillschweigend etwas anderes zu pruefen.
        const tabZeile = await page.evaluate(() => {
            const r = Array.from(document.querySelectorAll('#shortcuts-overlay .shortcut-row'));
            const t = r.find(x =>
                Array.from(x.querySelectorAll('.shortcut-key')).some(
                    k => (k.textContent || '').trim().toUpperCase() === 'TAB'
                )
            );
            return t
                ? (t.querySelector('span')?.textContent || '').replace(/\s+/g, ' ').trim()
                : null;
        });
        expect(
            tabZeile,
            'Die Hilfe muss eine Zeile fuer `Tab` fuehren — dieser Fall haftet fuer die ' +
                'Zusage, die darin steht.'
        ).not.toBeNull();
        expect(
            tabZeile,
            `Die Tab-Zeile der Hilfe lautet "${tabZeile}". Sie sagt zu, dass der Fokus im ` +
                'Dialog BLEIBT — und genau das prueft dieser Fall. Wird die Zusage ' +
                'zurueckgenommen, muss auch dieser Fall weichen; stillschweigend ' +
                'umformulieren darf sie niemand.'
        ).toMatch(/[Dd]ialog/);

        /** @type {{nr: number, drin: boolean, el: string, ueber: string|null}[]} */
        const spruenge = [];
        for (let i = 1; i <= 45; i++) {
            await page.keyboard.press('Tab');
            spruenge.push(
                await page.evaluate(nr => {
                    const a = document.activeElement;
                    const o = document.getElementById('shortcuts-overlay');
                    const r = a?.getBoundingClientRect?.();
                    let ueber = null;
                    if (r && r.width > 0 && r.height > 0) {
                        const t = document.elementFromPoint(
                            r.left + r.width / 2,
                            r.top + r.height / 2
                        );
                        ueber = t
                            ? t.tagName +
                              '.' +
                              (typeof t.className === 'string' ? t.className.split(/\s+/)[0] : '')
                            : null;
                    }
                    return {
                        nr,
                        drin: !!o?.contains(a),
                        el:
                            (a?.tagName || '?') +
                            (a?.id ? '#' + a.id : '') +
                            '.' +
                            (typeof a?.className === 'string' ? a.className.split(/\s+/)[0] : ''),
                        ueber
                    };
                }, i)
            );
        }
        const raus = spruenge.filter(s => !s.drin);
        const verdeckt = raus.filter(s => s.ueber && /shortcuts-/.test(s.ueber));
        expect(
            raus.map(s => `#${s.nr} ${s.el}${s.ueber ? ' (verdeckt von ' + s.ueber + ')' : ''}`),
            `${raus.length} von 45 Tabulatorspruengen verlassen die OFFENE Hilfe, ` +
                `${verdeckt.length} davon landen auf einem Ziel, das die Blende verdeckt. ` +
                'Die Hilfe druckt dabei selbst die Zusage ' +
                `"${tabZeile}". Der Nutzer liest sie, tabuliert zur Probe und bedient ab ` +
                'dem zweiten Anschlag etwas, das er nicht sieht — Enter dort oeffnet ' +
                'einen Dialog UNTER der Blende (z-index 1000 gegen 2000), der zwei Escape ' +
                'kostet.\nAbhilfe: die Falle in `ui/modal-focus.js` muss die Hilfe ' +
                'mitfuehren. Sie traegt `.shortcuts-overlay`, nicht `.modal-overlay`, und ' +
                'fiel darum aus `oberstesModal()`.'
        ).toEqual([]);
        expect(
            await page.evaluate(() => !!document.querySelector('#shortcuts-overlay.show')),
            'Vorbedingung dieses Falls: die Hilfe stand die ganze Messung ueber offen. ' +
                'Hat ein Tabulatordruck sie geschlossen, misst der Fall etwas anderes.'
        ).toBe(true);

        // UND DIE GEGENRICHTUNG. Shift+Tab lief am Ausgangsstand sofort
        // hinaus (5 von 5) — eine Falle, die nur eine Richtung haelt, ist
        // keine.
        const srausZiele = [];
        for (let i = 1; i <= 10; i++) {
            await page.keyboard.press('Shift+Tab');
            const z = await page.evaluate(() => ({
                drin: !!document
                    .getElementById('shortcuts-overlay')
                    ?.contains(document.activeElement),
                el:
                    (document.activeElement?.tagName || '?') +
                    (document.activeElement?.id ? '#' + document.activeElement.id : '')
            }));
            if (!z.drin) srausZiele.push(`#${i} ${z.el}`);
        }
        expect(
            srausZiele,
            `Shift+Tab verlaesst die offene Hilfe (${srausZiele.length} von 10). Eine ` +
                'Fokusfalle, die nur vorwaerts haelt, laesst den Nutzer rueckwaerts ' +
                'hinaus — und die Hilfe nennt Shift+Tab in einer eigenen Zeile.'
        ).toEqual([]);
    });

    test('(14) bei offener Hilfe feuert kein App-Kuerzel', async ({ page }) => {
        test.setTimeout(900_000);
        await ansichtOeffnen(page, 'initiative');

        // DIE MENGE: alles, was die Hilfe selbst als Kuerzel nennt, plus die
        // Modifikatorkuerzel, die am Ausgangsstand gemessen durchgeschlagen
        // haben. `Escape` steht NICHT darin — es ist der Ausweg und muss
        // wirken; die Gegenprobe am Ende haelt das fest.
        const PROBEN = [
            ...'123456789'.split(''),
            'r',
            't',
            'l',
            'k',
            'n',
            'p',
            'h',
            '/',
            '?',
            'Shift+N',
            'Control+z',
            'Control+y',
            'Control+s',
            'Control+k',
            'Control+f',
            'Control+Shift+K',
            'Control+.',
            'Control+/',
            'Alt+1',
            'Alt+2',
            'Alt+4',
            'Alt+6',
            'Alt+8',
            'Alt+r',
            'Alt+p',
            'Alt+l',
            'Alt+t',
            'Alt+Shift+0',
            'Alt+Shift+1',
            'Alt+Shift+6',
            'Alt+Shift+8',
            'Space',
            'Enter',
            'Delete',
            'Backspace'
        ];

        /** @type {string[]} */
        const durchgeschlagen = [];
        /** @type {string[]} */
        const fokusDiebe = [];
        /** @type {string[]} */
        const zugeschlagen = [];

        for (const taste of PROBEN) {
            await page.evaluate(ZURUECKSETZEN('initiative'));
            await page.waitForTimeout(220);
            await page.evaluate(ZURUECKSETZEN('initiative'));
            await page.waitForTimeout(60);
            // Mit der Taste oeffnen, nicht per Aufruf — der Weg des Nutzers.
            await page.keyboard.press('Shift+/');
            await page.waitForTimeout(380);
            expect(
                await page.evaluate(() => !!document.querySelector('#shortcuts-overlay.show')),
                `Vorbedingung: "?" oeffnet die Hilfe vor der Probe "${taste}"`
            ).toBe(true);
            const vor = await page.evaluate(SPUR);
            await page.keyboard.press(taste);
            await page.waitForTimeout(280);
            const nach = await page.evaluate(SPUR);
            const fokus = await page.evaluate(() => ({
                drin: !!document.activeElement?.closest?.('#shortcuts-overlay'),
                el:
                    (document.activeElement?.tagName || '?') +
                    (document.activeElement?.id ? '#' + document.activeElement.id : '') +
                    '.' +
                    (typeof document.activeElement?.className === 'string'
                        ? document.activeElement.className.split(/\s+/)[0]
                        : '')
            }));
            // `hilfe` gehoert nicht in die Wirkungsspur dieses Falls: dass
            // die Hilfe offen BLEIBT, ist Vorbedingung und wird eigens
            // gemeldet.
            const wirkung = spurDelta(vor, nach, [...KEINE_BELEGUNG, 'hilfe']);
            if (wirkung.length) {
                durchgeschlagen.push(`${alsHilfeToken(taste)} -> ${wirkung.join('; ')}`);
            }
            if (!fokus.drin) fokusDiebe.push(`${alsHilfeToken(taste)} -> ${fokus.el}`);
            if (!nach.hilfe) zugeschlagen.push(alsHilfeToken(taste));
            // Aufraeumen, damit der naechste Durchgang frisch oeffnet.
            await page.evaluate(() =>
                document.getElementById('shortcuts-overlay')?.classList.remove('show')
            );
        }

        expect(
            durchgeschlagen,
            'Diese Tasten aendern den Zustand der App, WAEHREND die Tastenhilfe offen ' +
                `vor ihm steht (${durchgeschlagen.length} von ${PROBEN.length}):\n` +
                durchgeschlagen.map(x => '   ' + x).join('\n') +
                '\n\nDie Hilfe ist die Flaeche, die man aufschlaegt, wenn man NICHT weiss, ' +
                'was eine Taste tut — sie laedt zum Ausprobieren ein. Am Spieltisch ' +
                'ruecken `N`/`P`/`Shift+N` dabei Zug und Runde des laufenden Kampfes, und ' +
                'der Spielleiter sieht es nicht: die Blende deckt mit 85 % Schwarz. ' +
                'Abhilfe: solange die Hilfe offen ist, ist die App fuer App-Kuerzel taub ' +
                '(`systems/spellslots/keyboard-shortcuts.js`). Browservorgaben — Bild-ab, ' +
                'Pfeile, Leertaste fuer den Lauf der Hilfe — bleiben unberuehrt; die ' +
                'messen wir hier nicht.'
        ).toEqual([]);

        expect(
            fokusDiebe,
            'Diese Tasten ziehen den Fokus AUS der offenen Hilfe HERAUS ' +
                `(${fokusDiebe.length} von ${PROBEN.length}):\n` +
                fokusDiebe.map(x => '   ' + x).join('\n') +
                '\n\nDer naechste Anschlag landet dann in einem Feld, das die Blende ' +
                'verdeckt, und der Nutzer erfaehrt es erst beim Schliessen — gemessen am ' +
                'Ausgangsstand blieb ein getipptes Wort im globalen Suchfeld stehen, ' +
                'eingegeben in ein unsichtbares Feld.'
        ).toEqual([]);

        expect(
            zugeschlagen,
            `Diese Tasten schliessen die Hilfe (${zugeschlagen.join(' ')}). Der Ausweg ist ` +
                '`Escape` und der ✕-Knopf; eine Taste, die sie nebenbei zuschlaegt, ist ' +
                'eine Ueberraschung.'
        ).toEqual([]);

        // UND DIE GEGENPROBE, die aus der Stille erst eine Aussage macht:
        // `Escape` muss wirken. Ohne sie wuerde dieser Fall auch dann gruen,
        // wenn die Hilfe JEDE Taste schluckt — einschliesslich ihres eigenen
        // Auswegs.
        await page.evaluate(ZURUECKSETZEN('initiative'));
        await page.waitForTimeout(250);
        await page.keyboard.press('Shift+/');
        await page.waitForTimeout(400);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        expect(
            await page.evaluate(() => !!document.querySelector('#shortcuts-overlay.show')),
            'Gegenprobe: `Escape` muss die Hilfe weiter schliessen. Eine Hilfe, die auch ' +
                'ihren eigenen Ausweg schluckt, ist eine Falle.'
        ).toBe(false);
    });
});
