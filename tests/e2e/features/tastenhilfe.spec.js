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
 *       Tabulatorspruengen. Zwei Durchgaenge, waagerechte und senkrechte
 *       Gruppe, weil die Achse an der Gestalt der Gruppe haengt
 *       (`ui/keyboard-group.js`, `_achse()`): auf der waagerechten
 *       Zauberplatz-Reihe sind `←/→` belegt und `↑/↓` NICHT, auf der
 *       senkrechten Beutezeilen-Liste genau umgekehrt. Ohne den zweiten
 *       Durchgang wuerde die Hilfe `↑/↓` nennen, ohne dass ein Fall das
 *       belegt.
 *   (D) Bei offener Tastenhilfe — fuer die Bedienbarkeit der Hilfe selbst.
 *
 * UND WO DIE VIER LAGEN WIRKLICH LAUFEN, weil diese Aufzaehlung bis zur
 * Gegenpruefung mehr versprach als die Faelle hielten:
 *
 *   (A) (B)   Faelle (3) und (5)
 *   (C)       Fall (3) (seit der Gegenpruefung, mit den 14 BENANNTEN Tasten
 *             auf der senkrechten Gruppe), Fall (5) und Fall (11)
 *   (D)       Fall (14) — und zwar als UMKEHRUNG: dort darf keine App-Taste
 *             wirken, die Lage traegt also nichts zur Tastenmenge von (3) bei
 *
 * Was vorher fehlte und was es kostete, steht an Lage (C) in Fall (3): der
 * Fall fuhr nur (A) und (B), 42 Tasten gegen die 48 von Fall (5), und eine
 * neu in `GRUPPEN_TASTEN` aufgenommene Taste lief durch. Nachgewiesen mit
 * `'PageDown'` in jener Menge — Fall (3) blieb gruen.
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
 * nachgemessen) — und entsprechend kommt das Wort "shortcut" im ganzen
 * Sollstand NULL Mal vor.
 *
 * DIE ZAHL, DIE HIER FRUEHER STAND, TRAF UNTER KEINER LESART ETWAS, und das
 * ist nach drei Durchgaengen die vierte Fassung dieses Absatzes — die Lehre
 * liegt genau darin. Zuerst stand hier "0 von 3.831 Blattschluesseln", dann
 * eine Tabelle, die 3.831 als "Schluessel eine Ebene darunter" fuehrte, dann
 * der Verzicht auf jede Zahl. Die Abnahme hat nachgezaehlt: **3.831 ist in
 * dieser Datei keine Groesse.** Die vier Zaehlweisen, je mit ihrer Definition,
 * gemessen an `tests/e2e/baselines/computed-style-baseline.json`:
 *
 *     Ebene 1   Messlagen (standard, narrow, reducedMotion)         3
 *     Ebene 2   Ansichtsknoten (24 Ansichten je Lage)              72
 *     Ebene 3   Eintraege je Ansichtsknoten                       288
 *               (elementCount, capped, keys, digests)
 *     Ebene 4   ELEMENT-DIGESTE, also Schluessel der `digests`-
 *               Abbildungen: 1235 standard + 1145 narrow
 *               + 1235 reducedMotion                             3615
 *     Schluessel mit SKALAREM Wert (3615 Digeste
 *               + 72x elementCount/capped)                        3759
 *     Alle dict-Schluessel rekursiv (3 + 72 + 288 + 3615)         3978
 *     SKALARE BLAETTER voll rekursiv (3615 Digestwerte
 *               + 3615 Eintraege der `keys`-Listen + 144)          7374
 *
 * "Blattschluessel" heisst also 3759, "Digeste" 3615, "Blaetter" 7374 — und
 * 3.831 keines davon. Die Aussage haengt an keiner der Zahlen: das Wort
 * "shortcut" kommt in der ganzen Datei NULL Mal vor, unter jeder Zaehlweise.
 * Die Zahl steht hier trotzdem wieder, aber mit ihrer DEFINITION daneben —
 * ohne die war sie nicht einmal widerlegbar, und drei Durchgaenge haben sie
 * dreimal verschieden gelesen, bevor einer vier Zaehlweisen durchprobierte.
 *
 * Fall (9) haelt diese Lage fest, damit eine spaetere Verschiebung der Hilfe in
 * einen Ansichtsbehaelter nicht still durchlaeuft.
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
 * DIE AUSNAHMELISTE — LEER, und das ist der Punkt.
 *
 * Hierhin gehoert eine gemessen belegte Taste AUSSCHLIESSLICH dann, wenn ihr
 * Eintrag in die Hilfe falsch WAERE. Sie hatte vier Eintraege, und alle vier
 * waren von derselben Art: ein Zweig in
 * `systems/spellslots/keyboard-shortcuts.js`, dem eine Modifikator-Schranke
 * fehlte, sodass das Einzeltasten-Kuerzel auch mit Modifikator feuerte
 * (`Strg+N`, `Strg+P`, `Alt+N`, `Alt+Shift+6`). In die Hilfe geschrieben
 * waere das eine Zusage gewesen; also standen sie hier.
 *
 * WARUM SIE JETZT LEER IST UND NICHT LAENGER. Die gerechnete Kreuzung oben
 * hat sechzehn WEITERE Kollisionen derselben Art gefunden — zwanzig
 * insgesamt, von denen vier bekannt waren. Zwanzig Eintraege auf einer
 * Entschuldigungsliste sind keine Ausnahme mehr, sondern ein Zustand. Und
 * die Entschuldigung war von Anfang an die zweitbeste Loesung: `Strg+P` ist
 * das Drucken des Browsers, `Strg+Leertaste` die Eingabemethode,
 * `Shift+Leertaste` der Seitenlauf nach oben — die App nahm sie, ohne es
 * irgendwo zu sagen. Die Schranke `OHNE_MODIFIKATOR(e)` nimmt allen zwanzig
 * die Belegung; damit braucht keine eine Entschuldigung und keine eine
 * Zeile in der Hilfe.
 *
 * SIE BLEIBT TROTZDEM STEHEN, als leeres Feld mit diesem Text — wie die
 * `EXEC_COMMAND_ALLOWLIST` in `editor-floating.spec.js`, die laut CLAUDE.md
 * "bewusst leer, nicht abwesend" ist. Drei Faelle haengen daran, und jeder
 * beantwortet eine andere Frage:
 *   · Fall (3) laesst eine belegte Taste durch, die hier steht — mit leerer
 *     Liste also keine;
 *   · Fall (4) wird rot, wenn eine Taste hier UND in der Hilfe steht;
 *   · Fall (3), dritte Richtung, wird rot, wenn eine Taste hier steht und
 *     gar nicht mehr belegt ist. Genau dieser Zweig haette die vier alten
 *     Eintraege nach dieser Arbeit gemeldet, und er ist der Grund, warum sie
 *     nicht als toter Ballast liegengeblieben sind.
 * Fall (6) nagelt die Laenge auf NULL. Ein erster Eintrag braucht damit eine
 * Aenderung an jener Zahl und also eine bewusste Entscheidung — und einen
 * Grund von mehr als 80 Zeichen, der sagt, warum die Taste nicht in die
 * Hilfe gehoert.
 *
 * @type {{taste: string, grund: string}[]}
 */
const AUSNAHMEN = [];

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

/**
 * EIN ECHTES TELEFON, nicht nur ein schmales Fenster — und das ist
 * gemessen und nicht Vorsicht.
 *
 * `page.setViewportSize({ width: 390 })` macht das Fenster schmal; es macht
 * daraus kein Beruehrungsgeraet. Der Unterschied ist an der Oberflaeche
 * gleichgueltig und an genau der Stelle entscheidend, um die es in Fall (16)
 * geht. Nachgemessen am gebauten Buendel, beide Male bei 390 px und
 * `data-layout="mobile"`, derselbe ✕-Knopf:
 *
 *   nur schmal (kein hasTouch)   padding 12px 16px   ->  45,4 x 45,0 px
 *   hasTouch + isMobile          padding  6px 10px   ->  36,0 x 36,0 px
 *
 * Das 36x36 des Befundes gibt es NUR im Beruehrungsarm. Ein Fall, der das
 * Tippziel im schmalen Fenster misst, ist darum gruen, auch wenn die
 * Schranke fehlt — nachgewiesen: mit `min-width/min-height` auf 36 px
 * zurueckgedreht blieb er gruen (45,4 ist mehr als 44). Erst im
 * Beruehrungsarm wird er rot. `hasTouch`/`isMobile` sind Eigenschaften des
 * BROWSERKONTEXTS und nicht der Seite — darum ein eigener Kontext und nicht
 * `setViewportSize`.
 *
 * @param {import('@playwright/test').Browser} browser
 * @param {number} breite
 * @returns {Promise<{seite: import('@playwright/test').Page, schliessen: () => Promise<void>}>}
 */
async function telefonSeite(browser, breite) {
    const kontext = await browser.newContext({
        viewport: { width: breite, height: 780 },
        hasTouch: true,
        isMobile: true
    });
    const seite = await kontext.newPage();
    await seite.addInitScript(seed => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(seed));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng.
        }
    }, kampagne(6));
    await seite.goto(APP_URL);
    // NICHT `waitForAppReady()`: der Helfer wartet auf `.app-title`, und die
    // Kopfzeile des Schreibtischs steht in `data-layout="mobile"` nicht im
    // Dokument (dort ist es `.mobile-header`). Gemessen lief er darum im
    // Beruehrungsarm in seine 15-Sekunden-Grenze. Gewartet wird auf dasselbe
    // Signal, das er danach liest — die Marke, die `core/init.js` setzt.
    await seite.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, {
        timeout: 20000
    });
    await seite.waitForTimeout(400);
    await seite.evaluate(v => window.switchView(v), 'initiative');
    await seite.waitForTimeout(600);
    return { seite, schliessen: () => kontext.close() };
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
        test.setTimeout(900_000);
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

        // Lage (C): FOKUS AUF EINEM GRUPPENGLIED (E-2).
        //
        // WARUM SIE HIER FEHLTE UND WAS DAS KOSTETE — Befund der
        // Gegenpruefung. Der Kopf dieser Datei kuendigt VIER Messlagen an,
        // und `CLAUDE.md` schreibt es als Eigenschaft dieses Waechters fest.
        // Gemessen fuhr dieser Fall nur (A) und (B): 42 Tasten gegen die 48
        // von Fall (5), und die Differenz waren genau die sechs
        // Gruppentasten. Die Folge war keine Kosmetik: wer eine weitere
        // Taste in `GRUPPEN_TASTEN` (`ui/keyboard-group.js`) nachtraegt, lief
        // hier durch. NACHGEWIESEN, nicht vermutet — `'PageDown'` in jene
        // Menge eingesetzt und einen Zweig dafuer gebaut: dieser Fall blieb
        // GRUEN (3,3 min), obwohl die Hilfe `Bild↓` nicht nennt. Die
        // Rueckrichtung (5) kann das nicht melden, sie schlaegt erst an,
        // wenn die Zeile schon in der Hilfe STEHT.
        //
        // GEMESSEN WERDEN HIER DIE 14 BENANNTEN TASTEN, nicht die sechs aus
        // E-2. Die sechs waeren eine Tautologie: sie sind genau die, die
        // `GRUPPEN_TASTEN` heute enthaelt — eine siebte faende man damit nie.
        //
        // UND NUR AUF DER SENKRECHTEN GRUPPE, mit Grund: der
        // Tastaturzweig ist EINER (`ui/keyboard-group.js`, ein `keydown`, eine
        // `GRUPPEN_TASTEN`-Menge). Eine neu aufgenommene Taste ist darum auf
        // JEDER Gruppe zu sehen; die Achse entscheidet nur, welche Pfeiltaste
        // was tut. Die waagerechte Gruppe laeuft mit den sechs Pfeil-/Rand-
        // tasten mit, damit die Achsen-Aussage der Hilfe gedeckt bleibt — das
        // ist dieselbe Arbeit, die Fall (11) vertieft.
        // Preis: je Taste ein frischer Seitenaufbau samt Tabulatorweg zum
        // Glied, gemessen rund 13 s. 14 + 6 Messungen sind darum rund 4,5 min
        // obendrauf; die Zeitgrenze dieses Falls steht deshalb auf 15 min.
        merken('C/Beutezeile', await messeGruppentasten(page, GRUPPE_SENKRECHT, SONDERTASTEN));
        merken('C/Zauberplatz', await messeGruppentasten(page, GRUPPE_WAAGERECHT, GRUPPENTASTEN));

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
        expect(AUSNAHMEN.length, 'Die Ausnahmeliste ist leer — Begruendung an `AUSNAHMEN`').toBe(0);
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

        // UND DIE ZWEISPALTIGE HAELFTE — 601 bis 1440 px, und das ist eine
        // Erweiterung aus der Gegenpruefung.
        //
        // WARUM SIE NOETIG WAR. Der Fall heisst "Telefon" und fuhr 390, 360
        // und 1440 px. Der Kommentar im CSS behauptete fuer das Band darueber
        // ("gemessen stehen bei 601-900 px zwei Spalten von 267 px") etwas,
        // das kein Fall prueft — und die Zahl war falsch: gemessen sind es
        // bei 601 px 237 px, bei 650 px 259,5 px, und erst ab 700 px 267 px.
        //
        // UND DIE LUECKE HAT SOFORT ETWAS DURCHGELASSEN. Beim Umbau der Hilfe
        // zur Beschreibungsliste bekamen `<dt>` und `<dd>` ein `min-width: 0`.
        // Folge, gemessen: der Dialog lief zwischen 601 und 900 px QUER
        // (scrollWidth 552 in 539 px Flaeche bei 601 px), waehrend 360, 390
        // und 1440 px unauffaellig blieben — genau die drei Breiten, die
        // dieser Fall kannte. Der Fehler ist behoben (`assets/styles/
        // dmscreen.css`, Abschnitt "DIE TASTENHILFE ALS BESCHREIBUNGSLISTE"),
        // und das Band wird jetzt mitgefahren, damit der naechste nicht
        // wieder durchkommt.
        //
        // 601 IST DIE UNTERE KANTE DER ZWEI SPALTEN (die Media-Query greift
        // bis 600 px), 700 die Breite, ab der der Dialog seine 600 px
        // Hoechstbreite erreicht, und 1440 die Messbreite des uebrigen
        // Waechters. 650 und 800 laufen nicht mit: sie liegen zwischen zwei
        // schon gemessenen Stufen und haben gemessen dasselbe Bild.
        for (const breite of [601, 700, 1440]) {
            await page.setViewportSize({ width: breite, height: 900 });
            await page.waitForTimeout(250);
            await page.keyboard.press('Shift+/');
            await page.waitForTimeout(400);
            const breit = await page.evaluate(() => {
                const m = document.querySelector('.shortcuts-modal');
                const reihen = Array.from(document.querySelectorAll('.shortcut-row'));
                const g = document.querySelector('.shortcuts-grid');
                const zh = parseFloat(getComputedStyle(reihen[0]).lineHeight) || 18;
                return {
                    modalBreite: Math.round(m.getBoundingClientRect().width),
                    spalten: getComputedStyle(g).gridTemplateColumns.split(' ').length,
                    spaltenRoh: getComputedStyle(g).gridTemplateColumns,
                    modalQuerlauf: m.scrollWidth > m.clientWidth + 1,
                    docQuerlauf: document.documentElement.scrollWidth > window.innerWidth + 1,
                    abgeschnitten: reihen
                        .filter(r => {
                            const s = r.querySelector('span');
                            return s && s.scrollWidth > s.clientWidth + 1;
                        })
                        .map(r => (r.querySelector('span')?.textContent || '').trim()),
                    dreiZeilig: reihen
                        .map(r => ({
                            z: Math.round((r.getBoundingClientRect().height - 12) / zh),
                            t: (r.querySelector('span')?.textContent || '').trim()
                        }))
                        .filter(x => x.z >= 3)
                        .map(x => `${x.t} (${x.z} Zeilen)`)
                };
            });
            expect(breit.spalten, `bei ${breite} px stehen zwei Spalten`).toBe(2);
            expect(
                breit.modalQuerlauf,
                `Bei ${breite} px laeuft die Hilfe selbst quer (Raster ` +
                    `${breit.spaltenRoh} in ${breit.modalBreite} px Dialog). Genau das hat ` +
                    'ein `min-width: 0` auf `<dd>` verursacht, und genau das hat dieser ' +
                    'Fall uebersehen, solange er nur 390, 360 und 1440 px fuhr.'
            ).toBe(false);
            expect(
                breit.abgeschnitten,
                `Bei ${breite} px sind Beschriftungen abgeschnitten: ` +
                    `${breit.abgeschnitten.join(' | ')}`
            ).toEqual([]);
            expect(
                breit.dreiZeilig,
                `Bei ${breite} px braucht eine Beschriftung drei Zeilen: ` +
                    `${breit.dreiZeilig.join(' | ')}. Die Spalte ist dort ` +
                    `${breit.spaltenRoh} breit.`
            ).toEqual([]);

            // DIE SPALTENBREITE JE STUFE, gemessen und nicht gerundet. Die
            // 267 px gelten erst ab etwa 700 px; bei 601 px sind es 237 px.
            // Der CSS-Kommentar nannte fuer das ganze Band 267 — die Zahl
            // steht jetzt hier, wo sie nachgefahren wird.
            if (breite >= 700) {
                expect(
                    breit.spaltenRoh,
                    'ab 700 px sind die zwei Spalten gleich breit und 267 px — ' +
                        '`minmax(0, 1fr)`, nicht `1fr`. ' +
                        `Gemessen bei ${breite} px: ${breit.spaltenRoh}`
                ).toBe('267px 267px');
            } else {
                const werte = breit.spaltenRoh.split(' ').map(parseFloat);
                expect(
                    Math.round(Math.min(...werte)),
                    `Bei 601 px sind die Spalten gemessen 237 px breit, nicht 267 — die ` +
                        '267 gelten erst ab etwa 700 px. ' +
                        `Gemessen: ${breit.spaltenRoh}`
                ).toBe(237);
                expect(
                    Math.abs(werte[0] - werte[1]),
                    `und sie sind gleich breit (${breit.spaltenRoh})`
                ).toBeLessThan(1);
            }

            await page.keyboard.press('Escape');
            await page.waitForTimeout(250);
        }
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
 * @param {string[]} tasten Welche Tasten gemessen werden. Vorgabe sind die sechs
 *   aus E-2; Fall (3) reicht hier die 14 BENANNTEN Tasten herein — Begruendung
 *   dort an Lage (C).
 */
async function messeGruppentasten(page, gruppe, tasten = GRUPPENTASTEN) {
    /** @type {Record<string, any>} */
    const erg = {};
    const AUF_GLIED = `(() => { const el = document.activeElement;
        return !!(el && el.matches && el.matches('${gruppe.glied}')); })()`;

    for (const taste of tasten) {
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

// ============================================================
// (15) DIE HILFE FUER DEN, DER SIE SICH VORLESEN LASSEN MUSS
// ============================================================
//
// WAS GEMESSEN WAR, am gebauten Buendel mit geoeffneter Hilfe: fuer ein
// Vorleseprogramm war die ganze Hilfe DREI Knoten. Der Zugaenglichkeitsbaum
// (`locator.ariaSnapshot()`) lautete:
//
//     - text: ⌨️ Tastenkürzel
//     - button "✕"
//     - text: "📍 Navigation Dashboard 1 Party 2 NPCs 3 Orte 4 … Drücke Esc
//              zum Schließen"
//
// Ein rund hundert Woerter langer Satz fuer die damals 41 Zeilen, ohne
// Trennung zwischen Handlung und Taste und ohne Ueberschrift, nach der man
// springen koennte. Dazu: `#shortcuts-overlay` und `.shortcuts-modal` trugen je
// `role`, `aria-label`, `aria-labelledby` und `aria-modal` auf `null`; im
// ganzen Dialog 0 Ueberschriften, 0 Rollen, 0 `aria-*`-Attribute, 0
// `<kbd>`-Elemente und 0 Listen. 95 `DIV`, 104 `SPAN`, ein `BUTTON`.
//
// WARUM DAS DIE SCHLIMMSTE STELLE DAFUER IST. Die Tastenhilfe ist das
// Werkzeug dessen, der die Maus nicht benutzt. Inhaltlich war sie nach HILF
// nahezu vollstaendig — und fuer den Vorleseprogramm-Nutzer trotzdem
// unbenutzbar: ohne `role="dialog"`/`aria-modal` kuendigt nichts an, dass
// sich ueberhaupt etwas geoeffnet hat.
//
// DIE VIER STUFEN, GEMESSEN UND NICHT GERATEN. Vier Fassungen, je am
// laufenden Buendel eingesetzt und der Zugaenglichkeitsbaum gezaehlt:
//
//     Ausgangsstand                              3 Knoten
//     + dialog/aria-modal + heading + <kbd>      15 Knoten
//     + role="group" und role="listitem"         57 Knoten
//     + <dl>/<dt>/<dd> statt der Rollen          98 Knoten
//
// Genommen ist die vierte, und der Unterschied zur dritten ist genau der
// Befund: `role="listitem"` macht aus einer Zeile EINEN Knoten
// ("Dashboard 1"), `<dt>`/`<dd>` machen daraus ZWEI ("Begriff Dashboard",
// "Definition 1"). Die Trennung zwischen Handlung und Taste ist das, was
// fehlte — eine Liste allein haette sie nicht gebracht.
//
// DAS `<span>` BLEIBT INNERHALB DES `<dt>` STEHEN, und das ist kein
// Zierrat: `hilfeLesen()` in dieser Datei und die Umbruchmessung in Fall (8)
// greifen die Beschriftung ueber `row.querySelector('span')`. Ein `<dt>`
// ohne inneres `<span>` haette beide blind gemacht — und ein blinder Leser
// macht jeden Mengenvergleich dieser Datei gruen (die Falle, gegen die
// Faelle 1 und 2 stehen).
//
// `aria-hidden` ODER `inert` AUF DEM HINTERGRUND STEHT HIER NICHT, und das
// ist eine Entscheidung mit Messung: der Hintergrund ist seit Fall (13) fuer
// den Tabulator unerreichbar, und `aria-modal="true"` sagt dem
// Vorleseprogramm dasselbe. Ein `inert` auf dem App-Behaelter waere eine
// zweite, breitere Zusicherung, die jede Ansicht beruehrt — ungemessen und
// ohne Auftrag.

test.describe('HILF — die Hilfe fuer ein Vorleseprogramm', () => {
    test('(15) die offene Hilfe ist ein Dialog mit Ueberschriften und Tastenpaaren', async ({
        page
    }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'initiative');
        await page.keyboard.press('Shift+/');
        await page.waitForTimeout(450);
        expect(
            await page.evaluate(() => !!document.querySelector('#shortcuts-overlay.show')),
            'Vorbedingung: "?" oeffnet die Hilfe'
        ).toBe(true);

        const baum = await page.evaluate(() => {
            const o = document.getElementById('shortcuts-overlay');
            const m = o.querySelector('.shortcuts-modal');
            const reihen = Array.from(o.querySelectorAll('.shortcut-row'));
            const titelId = m.getAttribute('aria-labelledby');
            return {
                rolle: m.getAttribute('role'),
                modal: m.getAttribute('aria-modal'),
                labelledby: titelId,
                // Die Beschriftung MUSS auf einen Knoten zeigen, der Text
                // traegt — ein `aria-labelledby` ins Leere ist schlimmer als
                // keines: das Vorleseprogramm nennt den Dialog dann gar nicht.
                labelText: titelId
                    ? (document.getElementById(titelId)?.textContent || '').trim()
                    : null,
                ueberschriften: Array.from(
                    o.querySelectorAll('[role="heading"], h1, h2, h3, h4, h5, h6')
                ).map(e => (e.textContent || '').trim()),
                abschnitte: o.querySelectorAll('.shortcuts-section').length,
                kbd: o.querySelectorAll('kbd').length,
                marken: o.querySelectorAll('.shortcut-key').length,
                markenNichtKbd: Array.from(o.querySelectorAll('.shortcut-key')).filter(
                    k => k.tagName !== 'KBD'
                ).length,
                reihen: reihen.length,
                // Jede Zeile ein Begriff-/Definitionspaar.
                ohneBegriff: reihen.filter(r => !r.querySelector('dt')).length,
                ohneDefinition: reihen.filter(r => !r.querySelector('dd')).length,
                // Und das `<span>`, von dem die Leser dieser Datei leben.
                ohneSpanImBegriff: reihen.filter(r => !r.querySelector('dt span')).length,
                // Ein `<dt>` darf nur in einer Beschreibungsliste stehen.
                ausserhalbDerListe: reihen.filter(r => !r.closest('dl')).length
            };
        });

        expect(baum.rolle, 'Die Hilfeflaeche traegt `role="dialog"`').toBe('dialog');
        expect(baum.modal, 'und `aria-modal="true"`').toBe('true');
        expect(
            baum.labelText,
            'Der Dialog traegt eine Beschriftung ueber `aria-labelledby`, und der ' +
                `verwiesene Knoten hat Text. Gemessen: "${baum.labelText}".`
        ).toMatch(/\S/);

        // JE ABSCHNITT EINE UEBERSCHRIFT, PLUS EINE FUER DIE FLAECHE SELBST.
        // Die `+ 1` ist seit ABN da und keine Nachsicht: der Titel
        // (`#shortcuts-overlay-titel`) war ein blosses `<span>`, die sechs
        // Abschnitte beginnen bei `aria-level` 3 — es gab sechs Ueberschriften
        // einer Stufe und keine darueber, und ein Ueberschriftensprung landete
        // mitten in der Liste. Er traegt jetzt `role="heading" aria-level="2"`.
        // Die Zahl bleibt EXAKT: eine siebte Abschnittsueberschrift ohne
        // Abschnitt faellt hier genauso auf wie ein Abschnitt ohne
        // Ueberschrift. Fall (22) prueft dazu die EBENEN.
        expect(
            baum.ueberschriften.length,
            'Jeder Abschnitt der Hilfe ist eine Ueberschrift, nach der ein ' +
                `Vorleseprogramm springen kann, und der Titel der Flaeche ist selbst ` +
                `eine. Gemessen: ${baum.ueberschriften.length} Ueberschriften bei ` +
                `${baum.abschnitte} Abschnitten, erwartet ${baum.abschnitte + 1} ` +
                `(${baum.ueberschriften.join(' | ')}).`
        ).toBe(baum.abschnitte + 1);
        expect(baum.abschnitte, 'die Hilfe hat sechs Abschnitte').toBeGreaterThanOrEqual(6);

        expect(
            baum.markenNichtKbd,
            `${baum.markenNichtKbd} von ${baum.marken} Tastenmarken sind kein \`<kbd>\`. ` +
                'Eine Taste ist semantisch eine Taste; am Ausgangsstand waren es 0 von 47.'
        ).toBe(0);
        expect(baum.kbd, 'und es gibt ueberhaupt Tastenmarken').toBeGreaterThanOrEqual(40);

        expect(
            baum.ohneBegriff,
            `${baum.ohneBegriff} von ${baum.reihen} Zeilen haben kein \`<dt>\`. Ohne ` +
                'Begriff-/Definitionspaar liest das Vorleseprogramm Handlung und Taste als ' +
                'einen Satz — am Ausgangsstand war die ganze Hilfe EIN Textknoten.'
        ).toBe(0);
        expect(
            baum.ohneDefinition,
            `${baum.ohneDefinition} von ${baum.reihen} Zeilen haben kein \`<dd>\`.`
        ).toBe(0);
        expect(
            baum.ausserhalbDerListe,
            `${baum.ausserhalbDerListe} von ${baum.reihen} Zeilen liegen in keiner ` +
                '`<dl>`. Ein `<dt>` ausserhalb einer Beschreibungsliste ist ungueltiges ' +
                'HTML, und der Zugaenglichkeitsbaum fuehrt es dann nicht als Paar.'
        ).toBe(0);
        expect(
            baum.ohneSpanImBegriff,
            `${baum.ohneSpanImBegriff} von ${baum.reihen} Zeilen haben kein \`<span>\` im ` +
                '`<dt>`. `hilfeLesen()` und Fall (8) greifen die Beschriftung ueber ' +
                '`row.querySelector("span")` — ohne das sind beide blind, und ein blinder ' +
                'Leser macht jeden Mengenvergleich dieser Datei gruen.'
        ).toBe(0);

        // UND DIE EIGENTLICHE AUSSAGE, am Zugaenglichkeitsbaum selbst und
        // nicht an den Attributen: er muss die Paare FUEHREN. Die Attribute
        // oben sind der Weg, dieser Vergleich ist das Ziel — und er ist der
        // Grund, warum die Attributpruefungen nicht genuegen: `<dt>` in einem
        // Behaelter mit `display: none` traegt alle Attribute und erscheint
        // trotzdem in keinem Baum.
        const schnappschuss = await page.locator('#shortcuts-overlay').ariaSnapshot();
        const zeilen = schnappschuss.split('\n');
        expect(
            zeilen.length,
            'Der Zugaenglichkeitsbaum der Hilfe hatte am Ausgangsstand DREI Knoten fuer ' +
                `die damals 41 Zeilen. Gemessen sind es jetzt ${zeilen.length}. Unter ` +
                '80 bedeutet, ' +
                'dass die Paare nicht ankommen.\n\n' +
                zeilen.slice(0, 12).join('\n')
        ).toBeGreaterThanOrEqual(80);
        expect(
            zeilen.filter(z => /^\s*- dialog /.test(z)).length,
            'Der Baum fuehrt die Hilfe als `dialog` — das ist die Ankuendigung, dass sich ' +
                'ueberhaupt etwas geoeffnet hat.\n' +
                zeilen.slice(0, 6).join('\n')
        ).toBe(1);
        expect(
            zeilen.filter(z => /^\s*- heading /.test(z)).length,
            `Der Baum fuehrt ${zeilen.filter(z => /^\s*- heading /.test(z)).length} ` +
                'Ueberschriften; sechs Abschnitte brauchen sechs.'
        ).toBeGreaterThanOrEqual(6);
        expect(
            zeilen.filter(z => /^\s*- term:/.test(z)).length,
            'Der Baum fuehrt jede Zeile als Begriff. Gemessen: ' +
                `${zeilen.filter(z => /^\s*- term:/.test(z)).length} von ${baum.reihen}.`
        ).toBe(baum.reihen);
        expect(
            zeilen.filter(z => /^\s*- definition:/.test(z)).length,
            'und jede Taste als Definition dazu. Gemessen: ' +
                `${zeilen.filter(z => /^\s*- definition:/.test(z)).length} von ${baum.reihen}.`
        ).toBe(baum.reihen);
    });
});

// ============================================================
// (16)-(17) DER AUSWEG, UND WAS SICH DARUEBERLEGT
// ============================================================
//
// WAS GEMESSEN WAR, mit `hasTouch`/`isMobile` am gebauten Buendel:
//
//   390x844  Flaeche 673 px, Inhalt 2119 px — 32 % sichtbar, 12 Reihen
//   360x740  Flaeche 590 px, Inhalt 2167 px — 27 % sichtbar, 10 Reihen
//   1440x900 Flaeche 718 px, Inhalt 1331 px — 54 % sichtbar, 23 Reihen
//
// (Die Prozentsaetze und die Reihenzahlen stammen von damals, als die Hilfe
// 41 Reihen trug; heute sind es 43. Die tragende Groesse ist das Verhaeltnis
// von Flaeche zu Inhalt, und das misst der Fall selbst.)
//
// Die Fusszeile lautete "Drücke Esc zum Schließen" und stand 2161 px (390 px
// Breite) bzw. 2199 px (360 px) unter dem Anfang — beim Oeffnen also nicht
// sichtbar. Ein Telefon hat ausserdem keine Escape-Taste. Der tatsaechliche
// Ausweg (Tipp neben das Fenster, oder der ✕-Knopf) stand nirgends, und der
// Knopf war 36x36 px gross — unter dem 44-px-Mindestziel, das dieses Projekt
// an den Reitern der Navigationsleiste gesichert hat (`core.css`, M1).
//
// WARUM DAS NICHT "NUR" KOSMETIK IST. Vier der sechs Abschnitte — Wuerfel,
// Initiative, Tabulator & Gruppen, Soundboard — liegen auf dem Telefon
// ausserhalb der Flaeche. Die Hilfe ist von 25 auf 43 Zeilen gewachsen, die
// Flaeche nicht. Wer sie aufschlaegt, sieht die Navigation und ein Stueck
// "Aktionen" und hat keinen Hinweis, dass es weitergeht — und keinen, wie er
// wieder herauskommt.
//
// (17) IST DIE ZWEITE HAELFTE DESSELBEN BILDSCHIRMS. Das Ereignislog liegt
// mit `--z-toast` (4000) ueber der Hilfe (`--z-floating`, 2000), und das ist
// eine ausdrueckliche Entscheidung dieses Projekts ("Meldungen liegen ueber
// allem, auch ueber der Werkzeug-Blase", `party.css`). Gemessen verdeckte
// EIN Hinweis bei 390 px drei der zwoelf sichtbaren Zeilen (Rueckgaengig,
// Wiederholen, Wiederholen (gleichwertig)) — knapp ein Viertel dessen, was
// von der Hilfe ueberhaupt zu sehen ist.
//
// DIE URSPRUENGLICHE HAELFTE DES BEFUNDES IST SCHON WEG, und zwar durch Fall
// (14): die Probe einer Hilfezeile erzeugt keinen Hinweis mehr, weil die
// offene Hilfe die App taub macht. Nachgemessen nach jener Arbeit: `r`
// gedrueckt, Ereignislog nicht sichtbar, 0 verdeckte Zeilen. Geblieben ist
// die Meldung, die VON WOANDERS kommt — der Begruessungshinweis, ein
// Sicherungslauf —, und die deckt weiter.
//
// DIE RICHTUNG DER REPARATUR IST DARUM NICHT "die Hilfe nach oben". Die
// Ebenenleiter in `variables.css` ist gezaehlt und begruendet, und
// `--z-toast` steht dort mit Absicht an der Spitze. Statt dessen tritt das
// Log beiseite, solange die Hilfe offen ist. DAS KOSTET ETWAS, und das soll
// hier stehen: ein Hinweis, der waehrend der offenen Hilfe ablaeuft, ist
// danach weg. Dafuer gibt es die dauerhafte Betriebsart des Logs (`L`), und
// die steht in der Hilfe. Ein Hinweis ueber einer modalen Hilfe ist ohnehin
// nichts, worauf der Nutzer gerade handeln kann.

test.describe('HILF — der Ausweg aus der Hilfe', () => {
    /**
     * Was an der Fusszeile, am Tippziel und an der Sichtbarkeit zu messen
     * ist — eine Funktion, damit Telefon- und Schreibtischarm dasselbe
     * messen und nicht auseinanderlaufen.
     * @param {import('@playwright/test').Page} seite
     */
    const ausweg = seite =>
        seite.evaluate(() => {
            const m = document.querySelector('.shortcuts-modal');
            const r = m.getBoundingClientRect();
            const fuss = m.querySelector('.shortcuts-footer');
            const sch = document.querySelector('.shortcuts-title .btn');
            const sr = sch?.getBoundingClientRect();
            const reihen = Array.from(document.querySelectorAll('.shortcut-row'));
            const sicht = el => {
                const q = el.getBoundingClientRect();
                return q.top >= r.top - 1 && q.bottom <= r.bottom + 1;
            };
            return {
                fussGefunden: !!fuss,
                fussText: (fuss?.textContent || '').replace(/\s+/g, ' ').trim(),
                fussSichtbar: fuss ? sicht(fuss) : null,
                fussKlebt: fuss ? getComputedStyle(fuss).position : null,
                schliesserBreite: sr ? Math.round(sr.width) : null,
                schliesserHoehe: sr ? Math.round(sr.height) : null,
                zeilen: reihen.length,
                sichtbar: reihen.filter(sicht).length,
                innen: m.clientHeight,
                inhalt: m.scrollHeight
            };
        });

    /**
     * Die Zusicherungen zu einer Messung. `schranke` ist das Mindestmass des
     * Tippziels: 44 px auf dem Telefon (die Schranke, die dieses Projekt an
     * den Reitern der Navigationsleiste gesichert hat, core.css M1), 32 px am
     * Schreibtisch (die 24-px-Schranke von WCAG 2.5.8 mit Rand).
     * @param {Record<string, any>} mass
     * @param {string} lage
     * @param {number} schranke
     */
    const pruefeAusweg = (mass, lage, schranke) => {
        expect(
            mass.fussGefunden,
            `${lage}: die Fusszeile der Hilfe traegt keine Klasse \`.shortcuts-footer\` — ` +
                'ohne sie kann sie nicht kleben und dieser Fall misst nichts'
        ).toBe(true);
        expect(
            mass.fussKlebt,
            `${lage}: die Fusszeile ist nicht \`position: sticky\` (gemessen: ` +
                `${mass.fussKlebt})`
        ).toBe('sticky');
        expect(
            mass.fussSichtbar,
            `${lage}: die Fusszeile ist beim Oeffnen nicht sichtbar. Von ${mass.zeilen} ` +
                `Zeilen sind ${mass.sichtbar} zu sehen (${mass.innen} px Flaeche, ` +
                `${mass.inhalt} px Inhalt) — der Hinweis, wie man wieder herauskommt, ` +
                'stand gemessen 2161 px tiefer. Auf einem Telefon ist das unauffindbar.'
        ).toBe(true);

        // DER TEXT MUSS DREI WEGE NENNEN UND DEN LAUF, und keiner der Wege
        // darf eine Taste sein, die das Geraet nicht hat. "Drücke Esc" allein
        // war auf dem Telefon eine Anweisung ins Leere.
        expect(
            mass.fussText,
            `${lage}: die Fusszeile lautet "${mass.fussText}". Sie muss sagen, dass die ` +
                `Liste weitergeht — gemessen sind hier ${mass.sichtbar} von ${mass.zeilen} ` +
                'Zeilen zu sehen, und nichts sagte es.'
        ).toMatch(/[Rr]oll|[Ss]croll|weiter/);
        expect(mass.fussText, `${lage}: die Fusszeile nennt Escape nicht`).toMatch(/Esc/);
        expect(
            mass.fussText,
            `${lage}: die Fusszeile "${mass.fussText}" nennt keinen Weg ohne Tastatur. Ein ` +
                'Telefon hat keine Escape-Taste; der ✕-Knopf und ein Tipp neben das ' +
                'Fenster sind die Wege, die dort wirklich gehen.'
        ).toMatch(/✕/);
        expect(
            mass.fussText,
            `${lage}: die Fusszeile nennt den Tipp neben das Fenster nicht`
        ).toMatch(/[Tt]ipp|[Tt]ippe|neben/);

        expect(
            Math.min(mass.schliesserBreite, mass.schliesserHoehe),
            `${lage}: der ✕-Knopf ist ${mass.schliesserBreite}x${mass.schliesserHoehe} px. ` +
                `Mindestens ${schranke} px — gemessen am Ausgangsstand 36x36 im ` +
                'Beruehrungsarm und 27x23 am Schreibtisch. Er ist auf dem Telefon der ' +
                'einzige sichtbare Ausweg.'
        ).toBeGreaterThanOrEqual(schranke);
    };

    test('(16) die Fusszeile steht sichtbar, nennt den Ausweg, und das Ziel ist gross genug', async ({
        page,
        browser
    }) => {
        test.setTimeout(240_000);

        // (a) DIE ZWEI TELEFONBREITEN, im Beruehrungsarm. Begruendung an
        //     `telefonSeite()`: das 36x36 des Befundes gibt es nur dort.
        for (const breite of TELEFON) {
            const { seite, schliessen } = await telefonSeite(browser, breite);
            try {
                await seite.evaluate(() => window.showShortcutsOverlay());
                await seite.waitForTimeout(450);
                expect(
                    await seite.evaluate(() => !!document.querySelector('#shortcuts-overlay.show')),
                    `Vorbedingung bei ${breite} px: die Hilfe ist offen`
                ).toBe(true);
                pruefeAusweg(await ausweg(seite), `${breite} px (Beruehrung)`, 44);

                // UND DIE ZWEI WEGE, DIE DIE FUSSZEILE VERSPRICHT, TUN ES
                // AUCH. Ohne das waere der Text nur eine zweite Behauptung —
                // genau die Art, gegen die diese Datei angetreten ist. Hier,
                // im Beruehrungsarm, weil es die Wege DES TELEFONS sind.
                await seite.tap('.shortcuts-title .btn');
                await seite.waitForTimeout(400);
                expect(
                    await seite.evaluate(() => !!document.querySelector('#shortcuts-overlay.show')),
                    `bei ${breite} px schliesst ein Tipp auf den ✕-Knopf die Hilfe`
                ).toBe(false);

                await seite.evaluate(() => window.showShortcutsOverlay());
                await seite.waitForTimeout(400);
                // Ein Tipp NEBEN die Flaeche: links oben in der Blende.
                await seite.touchscreen.tap(8, 8);
                await seite.waitForTimeout(400);
                expect(
                    await seite.evaluate(() => !!document.querySelector('#shortcuts-overlay.show')),
                    `bei ${breite} px schliesst ein Tipp neben das Fenster die Hilfe`
                ).toBe(false);
            } finally {
                await schliessen();
            }
        }

        // (b) UND AM SCHREIBTISCH. Dort ist das Tippziel nicht die Frage, die
        //     Sichtbarkeit der Fusszeile aber doch: gemessen sind auch bei
        //     1440 px nur 23 der damals 41 Zeilen zu sehen (718 px Flaeche,
        //     Inhalt), und die Fusszeile stand 1379 px tief.
        await ansichtOeffnen(page, 'initiative');
        await page.keyboard.press('Shift+/');
        await page.waitForTimeout(450);
        pruefeAusweg(await ausweg(page), '1440 px (Schreibtisch)', 32);
    });

    test('(17) nichts legt sich ueber die offene Hilfe', async ({ page, browser }) => {
        test.setTimeout(240_000);

        /**
         * Misst, was das Ereignislog von der offenen Hilfe verdeckt — und
         * zuerst die Gegenprobe, dass es ohne offene Hilfe ueberhaupt
         * sichtbar ist.
         * @param {import('@playwright/test').Page} seite
         * @param {string} lage
         */
        const pruefeUeberdeckung = async (seite, lage) => {
            await seite.evaluate(() => {
                document.getElementById('shortcuts-overlay')?.classList.remove('show');
                document.body.classList.remove('tastenhilfe-offen');
                const l = document.getElementById('event-log');
                if (l) {
                    l.className = 'event-log';
                    l.innerHTML = '';
                }
            });
            await seite.waitForTimeout(200);
            await seite.evaluate(() => window.showToast('Automatisch gespeichert', 'success'));
            await seite.waitForTimeout(400);
            expect(
                await seite.evaluate(() => {
                    const l = document.getElementById('event-log');
                    if (!l) return false;
                    const r = l.getBoundingClientRect();
                    return getComputedStyle(l).display !== 'none' && r.width > 0 && r.height > 0;
                }),
                `Gegenprobe ${lage}: ohne offene Hilfe muss das Ereignislog sichtbar sein. ` +
                    'Ist es das nicht, misst dieser Fall nichts — und die App haette ihre ' +
                    'Meldungen verloren.'
            ).toBe(true);

            // UND JETZT MIT OFFENER HILFE, mit einer Meldung, die von WOANDERS
            // kommt: die Probe einer Hilfezeile erzeugt seit Fall (14) keine
            // mehr.
            await seite.evaluate(() => window.showShortcutsOverlay());
            await seite.waitForTimeout(400);
            await seite.evaluate(() => window.showToast('Automatisch gespeichert', 'success'));
            await seite.waitForTimeout(450);

            const mass = await seite.evaluate(() => {
                const m = document.querySelector('.shortcuts-modal');
                const r = m.getBoundingClientRect();
                const log = document.getElementById('event-log');
                const lr = log?.getBoundingClientRect();
                const logSichtbar =
                    !!log &&
                    getComputedStyle(log).display !== 'none' &&
                    !!lr &&
                    lr.width > 0 &&
                    lr.height > 0;
                const reihen = Array.from(document.querySelectorAll('.shortcut-row'));
                const sicht = el => {
                    const q = el.getBoundingClientRect();
                    return q.top >= r.top - 1 && q.bottom <= r.bottom + 1;
                };
                const schnitt = q =>
                    logSichtbar &&
                    !(
                        q.right < lr.left ||
                        q.left > lr.right ||
                        q.bottom < lr.top ||
                        q.top > lr.bottom
                    );
                const sichtbare = reihen.filter(sicht);
                const f = m.querySelector('.shortcuts-footer');
                return {
                    logZ: log ? getComputedStyle(log).zIndex : null,
                    hilfeZ: getComputedStyle(document.getElementById('shortcuts-overlay')).zIndex,
                    sichtbar: sichtbare.length,
                    verdeckt: sichtbare
                        .filter(x => schnitt(x.getBoundingClientRect()))
                        .map(x => (x.querySelector('span')?.textContent || '').trim()),
                    fussVerdeckt: f ? schnitt(f.getBoundingClientRect()) : null
                };
            });

            expect(
                mass.verdeckt,
                `${lage}: das Ereignislog verdeckt ${mass.verdeckt.length} der ` +
                    `${mass.sichtbar} sichtbaren Hilfezeilen: ${mass.verdeckt.join(' | ')}. ` +
                    `Es liegt mit z-index ${mass.logZ} ueber der Hilfe (${mass.hilfeZ}), ` +
                    'und das ist in `variables.css` eine ausdrueckliche Entscheidung — die ' +
                    'Ebenenleiter ist nicht der Ort der Reparatur. Das Log tritt beiseite, ' +
                    'solange die Hilfe offen ist.'
            ).toEqual([]);
            expect(
                mass.fussVerdeckt,
                `${lage}: das Ereignislog verdeckt die Fusszeile — den einzigen Ausweg, ` +
                    'der auf dem Telefon sichtbar ist.'
            ).toBe(false);
        };

        for (const breite of TELEFON) {
            const { seite, schliessen } = await telefonSeite(browser, breite);
            try {
                await pruefeUeberdeckung(seite, `${breite} px (Beruehrung)`);
            } finally {
                await schliessen();
            }
        }

        await ansichtOeffnen(page, 'initiative');
        await pruefeUeberdeckung(page, '1440 px (Schreibtisch)');
    });
});

// ============================================================
// (18) DIE HILFE SAGT AUCH, WANN UND WO EINE TASTE GILT
// ============================================================
//
// WAS DIESER FALL VON (3) UND (5) UNTERSCHEIDET. Jene zwei pruefen die
// MENGE: jede belegte Taste steht drin, jede genannte tut etwas. Beide
// waren gruen, waehrend vier Zeilen der Hilfe trotzdem in die Irre
// fuehrten — weil eine Zeile mehr ist als ein Tastenname. Sie ist eine
// Zusage darueber, WANN die Taste gilt, und genau die fehlte bzw. war
// falsch:
//
//   (a) `N` STAND NUR UNTER "Initiative". Gemessen tut `n` bei BODY-Fokus
//       in FUENF Ansichten etwas, und in vier davon etwas ANDERES als den
//       Zugwechsel: npcs -> `npc-modal` auf, quests -> `quest-modal` auf,
//       party -> `char-form` aufgeklappt, encounter -> `enc-form`
//       aufgeklappt, initiative -> Zug 0 -> 1. Der Spielleiter in der
//       NSC-Ansicht liest "Naechster Zug", drueckt `n` und bekommt ein
//       Anlegen-Fenster. Die Kuerzeltabelle in `CLAUDE.md` fuehrt die
//       Doppelbedeutung seit je; die Hilfe, aus der sie nachgezogen wurde,
//       nicht.
//
//   (b) "Befehlspalette (in Firefox)" LAS SICH ALS EINSCHRAENKUNG. Gemessen
//       in Chromium: `Strg+.` oeffnet die Palette und zieht den Fokus in
//       ihr Eingabefeld (`defaultPrevented`, `INPUT.cp-input`). Der
//       Quellkommentar daneben nennt das Kuerzel ausdruecklich
//       "browserneutral" — die Klammer machte daraus "gilt hier nicht",
//       und ein Nutzer in Chrome oder Edge ueberspringt das kuerzere,
//       zuverlaessigere Kuerzel.
//
//   (c) DIE ZWEI SOUNDBOARD-ZEILEN VERSPRACHEN SECHS TASTEN, die ohne
//       eingerichtete Szene wortlos nichts tun. Gemessen in einer frischen
//       Kampagne: `Alt+Shift+0`, `Alt+Shift+1` und `Alt+Shift+5` aendern
//       keine der dreizehn beobachteten Groessen, die Konsole bleibt leer,
//       und die Taste wird dennoch verbraucht (`defaultPrevented`).
//       `features/soundboard/soundboard-crud.js` sagt es selbst: `if
//       (!scene) { return; }` mit dem Kommentar "still ignorieren". Der
//       Nutzer probiert, nichts geschieht, und er sucht den Fehler bei
//       sich. Die Vorbedingung stand nirgends.
//
//   (d) DIE DREI E-2-ZEILEN SAGTEN NICHT, WANN SIE GELTEN. Gemessen in der
//       Beute-Ansicht bei BODY-Fokus: Pfeil ab, Pfeil rechts, Pos1, Ende
//       und Bild ab bewegen NICHTS — kein Rollen, kein Fokus, kein
//       `defaultPrevented` (der Koerper dieser App laeuft nie, gemessen
//       `scrollHeight === innerHeight`). Auf einem Gruppenglied tun
//       dieselben Tasten genau das, was die Zeilen sagen (Fall 11 belegt
//       es). Das Verhalten ist richtig; falsch war, was die Hilfe
//       verschwieg: dass der Fokus ERST auf einem Glied liegen muss, und
//       wie man dorthin kommt.
//
// WARUM DIESER FALL KEINE WORTKLAUBEREI IST. Jede Zusicherung unten haengt
// an einer MESSUNG im selben Lauf, nicht an einem Wunsch: erst wird
// gemessen, dass `n` in mehreren Ansichten etwas tut, DANN wird die zweite
// Zeile verlangt. Verschwindet die Doppelbedeutung aus dem Quelltext, faellt
// die Messung weg und mit ihr die Forderung — die Hilfe darf dann
// schrumpfen. Ein Fall, der nur Woerter gegen Woerter haelt, waere
// tautologisch; dieser haelt Woerter gegen gemessenes Verhalten.

test.describe('HILF — die Hilfe sagt, wann eine Taste gilt', () => {
    test('(18) jede Zeile nennt ihre Vorbedingung, und jede Vorbedingung ist gemessen', async ({
        page
    }) => {
        test.setTimeout(300_000);
        await ansichtOeffnen(page, 'initiative');

        const hilfe = await hilfeLesen(page);
        /** Die Zeilen, die eine bestimmte Taste nennen. */
        const zeilenMit = token =>
            hilfe.reihen.filter(r => hilfeTastenmenge([r]).has(token)).map(r => r.text);

        // ----------------------------------------------------------
        // (a) `N` IST ZWEIDEUTIG — erst messen, dann fordern.
        // ----------------------------------------------------------
        /** @type {Record<string, string>} */
        const wirkungVonN = {};
        for (const ansicht of ['initiative', 'npcs', 'quests', 'party', 'encounter', 'loot']) {
            await ansichtOeffnen(page, ansicht);
            const lage = () =>
                page.evaluate(() => ({
                    schalen: Array.from(
                        document.querySelectorAll('.modal-overlay.show, .modal.show')
                    )
                        .map(e => e.id)
                        .sort()
                        .join(','),
                    // `.collapsible-content.open` UND NICHT `.collapsible.open`.
                    // Die Klasse `collapsible` gibt es im ganzen Baum nicht
                    // (nachgezaehlt: `class="collapsible"` 0x in
                    // assets/templates/, 0x im Buendel); `toggleCollapse(id)`
                    // in systems/spellslots/navigation.js schaltet `open` an
                    // `$(id)` — und das ist `#char-form` bzw. `#enc-form`, die
                    // `.collapsible-content` tragen. Das `data-action` sitzt am
                    // GESCHWISTER `.collapsible-header`; genau diese Trennung
                    // hat die Vorrunde schon einmal gekostet. Die Sonde hat
                    // damit zwei der fuenf zugesagten Ansichten nicht gemessen.
                    aufgeklappt: Array.from(document.querySelectorAll('.collapsible-content.open'))
                        .map(e => e.id)
                        .sort()
                        .join(','),
                    zug: window.D?.initiative?.currentTurn ?? null
                }));
            const vor = await lage();
            await page.keyboard.press('n');
            await page.waitForTimeout(400);
            const nach = await lage();
            const d = [];
            if (vor.schalen !== nach.schalen) d.push(`Schale ${vor.schalen} -> ${nach.schalen}`);
            if (vor.aufgeklappt !== nach.aufgeklappt)
                d.push(`aufgeklappt ${vor.aufgeklappt} -> ${nach.aufgeklappt}`);
            if (vor.zug !== nach.zug) d.push(`Zug ${vor.zug} -> ${nach.zug}`);
            wirkungVonN[ansicht] = d.join('; ') || '(keine)';
        }
        const ansichtenMitN = Object.entries(wirkungVonN).filter(([, w]) => w !== '(keine)');
        const ansichtenOhneZug = ansichtenMitN.filter(([, w]) => !/^Zug /.test(w));
        // DIE FUENF ANSICHTEN WERDEN BENANNT UND NICHT GEZAEHLT, und das ist
        // teuer erkauft. Hier stand `toBeGreaterThan(1)`, und die Sonde
        // darueber suchte `.collapsible.open` — eine Klasse, die es im
        // Buendel NULL Mal gibt (`toggleCollapse()` schaltet `open` an
        // `#char-form`/`#enc-form`, und die tragen `.collapsible-content`;
        // `data-action` sitzt am GESCHWISTER `.collapsible-header`). Party
        // und Begegnung fielen damit als "(keine)" aus, der Fall sah drei
        // Ansichten statt fuenf — und blieb gruen, weil 3 > 1 ist. Die
        // Zusage in `CLAUDE.md` ("`n` wirkt in fuenf Ansichten") war in
        // genau diesem Umfang unbelegt. Eine Untergrenze deckt eine blinde
        // Sonde; eine benannte Menge nicht.
        expect(
            ansichtenMitN.map(([a]) => a).sort(),
            'Vorbedingung: `n` muss in genau diesen fuenf Ansichten etwas tun, sonst ist ' +
                'die Forderung unten unbegruendet — und die Zusage in `CLAUDE.md` ' +
                'ebenfalls. Gemessen: ' +
                Object.entries(wirkungVonN)
                    .map(([a, w]) => `${a}: ${w}`)
                    .join(' | ')
        ).toEqual(['encounter', 'initiative', 'npcs', 'party', 'quests']);
        expect(
            ansichtenOhneZug.map(([a]) => a).sort(),
            '`n` muss in VIER Ansichten etwas ANDERES tun als den Zugwechsel: zwei ' +
                'Anlegen-Fenster (NSC, Auftrag) und zwei aufklappende Formulare (Party, ' +
                'Begegnung). Gemessen: ' +
                `${ansichtenOhneZug.map(([a, w]) => `${a}: ${w}`).join(' | ')}`
        ).toEqual(['encounter', 'npcs', 'party', 'quests']);

        const nZeilen = zeilenMit('N');
        expect(
            nZeilen.length,
            `Die Hilfe fuehrt ${nZeilen.length} Zeile(n) fuer \`N\` (${nZeilen.join(' | ')}), ` +
                `aber \`n\` tut gemessen in ${ansichtenMitN.length} Ansichten etwas, und in ` +
                `${ansichtenOhneZug.length} davon etwas anderes als den Zugwechsel: ` +
                `${ansichtenOhneZug.map(([a, w]) => `${a}: ${w}`).join(' | ')}. Eine ` +
                'einzige Zeile unter "Initiative" schickt den Spielleiter in der ' +
                'NSC-Ansicht ins Leere: er liest "Naechster Zug" und bekommt ein ' +
                'Anlegen-Fenster. `CLAUDE.md` fuehrt die Doppelbedeutung seit je.'
        ).toBeGreaterThanOrEqual(2);
        expect(
            nZeilen.join(' ').toLowerCase(),
            `Die zweite \`N\`-Zeile muss die andere Bedeutung benennen. Gemessen: ` +
                `${nZeilen.join(' | ')}`
        ).toMatch(/neu/);

        // ----------------------------------------------------------
        // (b) `Strg+.` GILT UEBERALL — gemessen in Chromium.
        // ----------------------------------------------------------
        await ansichtOeffnen(page, 'initiative');
        const vorPalette = await page.evaluate(
            () => !!document.querySelector('.cp-overlay.cp-visible')
        );
        await page.keyboard.press('Control+.');
        await page.waitForTimeout(400);
        expect(
            await page.evaluate(() => ({
                palette: !!document.querySelector('.cp-overlay.cp-visible'),
                fokus: document.activeElement?.className || ''
            })),
            'Vorbedingung: `Strg+.` oeffnet die Befehlspalette IN DIESEM BROWSER ' +
                `(Chromium). Vorher offen: ${vorPalette}. Tut es das nicht, ist die ` +
                'Forderung unten unbegruendet und die Klammer "(in Firefox)" waere richtig.'
        ).toEqual({ palette: true, fokus: 'cp-input' });

        const punktZeilen = zeilenMit('STRG+.');
        expect(punktZeilen.length, 'Die Hilfe fuehrt genau eine Zeile fuer `Strg+.`').toBe(1);
        expect(
            punktZeilen[0],
            `Die Zeile fuer \`Strg+.\` lautet "${punktZeilen[0]}". Sie darf das Kuerzel ` +
                'nicht auf Firefox EINSCHRAENKEN: gemessen oeffnet es die Palette auch in ' +
                'Chromium, und der Quellkommentar daneben nennt es ausdruecklich ' +
                '"browserneutral". Ein Nutzer in Chrome oder Edge liest die Klammer als ' +
                '"gilt hier nicht" und ueberspringt das kuerzere Kuerzel. Verboten ist ' +
                'die EINSCHRAENKENDE Klammer, nicht jede Nennung von Firefox: dass dort ' +
                'Strg+Shift+K von der Web-Konsole belegt ist, darf die Zeile sagen — nur ' +
                'nicht so, dass sie wie eine Bedingung klingt.'
        ).not.toMatch(/\(\s*(nur\s+)?(in|unter)\s+Firefox\s*\)/i);
        expect(
            punktZeilen[0].toLowerCase(),
            `Die Zeile fuer \`Strg+.\` ("${punktZeilen[0]}") muss sagen, dass sie neben ` +
                'Strg+Shift+K gleichwertig gilt — sonst liest sie sich wie ein zweites, ' +
                'anderes Kuerzel.'
        ).toMatch(/gleichwertig|überall|ueberall/);

        // ----------------------------------------------------------
        // (c) DIE SOUNDBOARD-TASTEN BRAUCHEN EINE EINGERICHTETE SZENE.
        // ----------------------------------------------------------
        const ohneSzene = {};
        for (const taste of ['Alt+Shift+0', 'Alt+Shift+1', 'Alt+Shift+5']) {
            await page.evaluate(ZURUECKSETZEN('initiative'));
            await page.waitForTimeout(220);
            await page.evaluate(() => {
                if (window.D) window.D.soundboard = { scenes: [] };
            });
            const vor = await page.evaluate(SPUR);
            await page.keyboard.press(taste);
            await page.waitForTimeout(300);
            const nach = await page.evaluate(SPUR);
            ohneSzene[taste] = spurDelta(vor, nach, KEINE_BELEGUNG);
        }
        expect(
            ohneSzene,
            'Vorbedingung: ohne eingerichtete Szene tun die Soundboard-Kuerzel gemessen ' +
                'NICHTS. Tun sie doch etwas, ist die Forderung unten unbegruendet.'
        ).toEqual({ 'Alt+Shift+0': [], 'Alt+Shift+1': [], 'Alt+Shift+5': [] });

        const soundZeilen = hilfe.reihen
            .filter(
                r =>
                    hilfeTastenmenge([r]).has('ALT+SHIFT+1') ||
                    hilfeTastenmenge([r]).has('ALT+SHIFT+0')
            )
            .map(r => r.text);
        expect(
            soundZeilen.length,
            'Die Hilfe fuehrt die zwei Soundboard-Zeilen'
        ).toBeGreaterThanOrEqual(2);

        // DIE VORBEDINGUNG DARF AM ABSCHNITT STEHEN und nicht je Zeile, und
        // das ist gemessen entschieden: eine Abschnittsueberschrift ist keine
        // `.shortcut-row` und hat darum kein Umbruchbudget. In die zwei Zeilen
        // geschrieben wurde "Eingerichtete Szene, Platz 1-5" bei 601 px
        // DREIZEILIG (ihre Marke `Alt Shift 1-5` nimmt drei Felder), und Fall
        // (8) verbietet drei Zeilen zu Recht. Die Vorbedingung gilt ohnehin
        // fuer alle sechs Tasten des Abschnitts.
        const soundTitel = hilfe.abschnitte.find(s => /Soundboard/.test(s.titel))?.titel || '';
        expect(
            (soundTitel + ' ' + soundZeilen.join(' ')).toLowerCase(),
            `Die Soundboard-Zeilen lauten "${soundZeilen.join(' | ')}". Sie muessen die ` +
                'Vorbedingung nennen — eine EINGERICHTETE Szene. Gemessen schlucken die ' +
                'sechs Tasten in einer frischen Kampagne ihren Anschlag und geben keine ' +
                'Rueckmeldung: kein Hinweis, kein Toast, keine Konsolenmeldung ' +
                '(`soundboard-crud.js`: `if (!scene) { return; }`, Kommentar "still ' +
                `ignorieren"). Sechs der ${hilfe.reihen.length} Hilfezeilen gehoeren damit ` +
                'Tasten, bei denen ' +
                'der Nutzer den Fehler bei sich sucht.'
        ).toMatch(/eingerichtet|angelegt|belegt|hinterlegt/);

        // ----------------------------------------------------------
        // (d) DIE GRUPPENTASTEN GELTEN NUR AUF EINEM GLIED.
        // ----------------------------------------------------------
        await ansichtOeffnen(page, 'loot');
        const ohneGlied = {};
        for (const taste of ['ArrowDown', 'ArrowRight', 'Home', 'End']) {
            await page.evaluate(ZURUECKSETZEN('loot'));
            await page.waitForTimeout(220);
            const vor = await page.evaluate(SPUR);
            await page.keyboard.press(taste);
            await page.waitForTimeout(280);
            const nach = await page.evaluate(SPUR);
            ohneGlied[taste] = spurDelta(vor, nach, KEINE_BELEGUNG);
        }
        expect(
            ohneGlied,
            'Vorbedingung: bei BODY-Fokus tun die Gruppentasten gemessen NICHTS — kein ' +
                'Rollen, kein Fokus, keine App-Groesse (der Koerper dieser App laeuft nie, ' +
                '`scrollHeight === innerHeight`). Genau deshalb MUSS die Hilfe sagen, dass ' +
                'der Fokus erst auf einem Glied liegen muss.'
        ).toEqual({ ArrowDown: [], ArrowRight: [], Home: [], End: [] });

        const gruppenAbschnitt = hilfe.abschnitte.find(s => /Gruppen/.test(s.titel));
        expect(
            gruppenAbschnitt,
            'die Hilfe hat einen Abschnitt fuer Tabulator & Gruppen'
        ).toBeTruthy();
        const gruppenZeilen = hilfe.reihen
            .filter(r =>
                ['←', '→', '↑', '↓', 'POS1', 'ENDE'].some(t => hilfeTastenmenge([r]).has(t))
            )
            .map(r => r.text);
        expect(gruppenZeilen.length, 'die Hilfe fuehrt die drei E-2-Zeilen').toBeGreaterThanOrEqual(
            3
        );
        expect(
            gruppenZeilen.join(' ').toLowerCase(),
            `Die Zeilen fuer Pfeile/Pos1/Ende lauten "${gruppenZeilen.join(' | ')}". Keine ` +
                'nennt die Vorbedingung: der Fokus muss ERST auf einem Glied der Reihe ' +
                'liegen. Gemessen bewegen dieselben Tasten bei BODY-Fokus nichts — wer sie ' +
                'nach Browsergewohnheit fuer den Seitenlauf haelt, bekommt gar nichts, und ' +
                'die 2715 px lange Beuteliste ist mit der Tastatur erst erreichbar, ' +
                'nachdem man blind in die Gruppe hineintabuliert hat.'
        ).toMatch(/fokus|liegt auf|steht auf/);
        // UND DIE HILFE MUSS SAGEN, WIE MAN AUF EIN GLIED KOMMT. Ohne das
        // ist die Vorbedingung genannt und unerfuellbar. Gesucht wird in den
        // Beschriftungen der TAB-Zeilen, nicht im ganzen Text: der blosse
        // Tastenname `Tab` steht in der MARKE, und eine Suche darueber waere
        // schon durch die vorhandene Zeile "Naechstes Bedienelement"
        // befriedigt — die sagt ueber Reihen nichts.
        const tabZeilen = hilfe.reihen
            .filter(r => hilfeTastenmenge([r]).has('TAB'))
            .map(r => r.text);
        expect(
            tabZeilen.join(' ').toLowerCase(),
            `Die TAB-Zeilen der Hilfe lauten "${tabZeilen.join(' | ')}". Keine sagt, dass ` +
                'der Tabulator der Weg auf eine solche Reihe ist — damit nennen die drei ' +
                'E-2-Zeilen eine Vorbedingung, die der Nutzer nicht herstellen kann. ' +
                'Gemessen ist der Tabulator der einzige Weg: in der Beute-Ansicht liegt ' +
                'das erste Glied rund 40 Halte vom Seitenanfang entfernt, und bei ' +
                'BODY-Fokus tut keine der vier Tasten etwas.'
        ).toMatch(/reihe|gruppe|glied/);
    });
});

// ============================================================
// (19) DIE HILFE NENNT DIE ANSICHTEN SO, WIE DIE APP SIE NENNT
// ============================================================
//
// WARUM DAS EIN EIGENER FALL IST UND NICHT EINE SPITZFINDIGKEIT. Die neun
// Navigationszeilen sind die einzigen der 43, die auf etwas ZEIGEN, das der
// Nutzer gleichzeitig vor sich hat: einen Reiter. Stimmt der Name nicht,
// sucht er nach einem Reiter, den es nicht gibt — und das ist genau der
// Fehler, den eine Hilfe nicht machen darf, weil sie die Instanz ist, die
// man befragt, wenn man etwas NICHT findet.
//
// Gemessen am gebauten Buendel: drei der neun Zeilen trugen einen Namen,
// den die App nirgends fuehrt.
//
//     Taste   Ansicht      Reiter der App     Zeile der Hilfe
//     1       dashboard    "🏠 Start"         "Dashboard"
//     8       shops        "🏪 Shops"         "Läden"
//     9       loot         "📦 Truhe"         "Beute"
//
// DIE ZUORDNUNG WIRD GEMESSEN, NICHT GELESEN: der Fall drueckt jede Ziffer
// und schaut, welche Ansicht danach aktiv ist. Eine Liste im Fall waere eine
// zweite Kopie der Liste im Quelltext und wuerde mit ihr auseinanderlaufen —
// dieselbe Krankheit, die dieser Strang zu heilen versucht.

test.describe('HILF — die Hilfe nennt die Ansichten der App', () => {
    test('(19) jede Navigationszeile traegt den Namen ihres Reiters', async ({ page }) => {
        test.setTimeout(240_000);
        await ansichtOeffnen(page, 'dashboard');

        const hilfe = await hilfeLesen(page);
        const navAbschnitt = hilfe.abschnitte.find(s => /Navigation/.test(s.titel));
        expect(navAbschnitt, 'Vorbedingung: die Hilfe hat einen Navigationsabschnitt').toBeTruthy();

        /** Die Reiterbeschriftungen der App, aus dem Buendel. */
        const reiter = await page.evaluate(() => {
            /** @type {Record<string,string>} */
            const r = {};
            document.querySelectorAll('.nav-tab[data-view]').forEach(b => {
                r[b.dataset.view] = (b.textContent || '').replace(/\s+/g, ' ').trim();
            });
            return r;
        });
        // BASE-01/empty: ohne gelesene Reiter misst der Fall nichts.
        expect(
            Object.keys(reiter).length,
            'Vorbedingung: die Reiter sind im Buendel lesbar'
        ).toBeGreaterThanOrEqual(20);

        // DIE MESSUNG: welche Ansicht macht welche Ziffer auf.
        /** @type {Record<string,string>} */
        const zielAnsicht = {};
        for (let d = 1; d <= 9; d++) {
            await page.evaluate(ZURUECKSETZEN('dashboard'));
            await page.waitForTimeout(160);
            await page.keyboard.press(String(d));
            await page.waitForTimeout(320);
            zielAnsicht[String(d)] = await page.evaluate(() =>
                (document.querySelector('.view.active')?.id || '').replace(/^view-/, '')
            );
        }
        expect(
            Object.values(zielAnsicht).filter(Boolean).length,
            'Vorbedingung: alle neun Ziffern wechseln die Ansicht. Gemessen: ' +
                JSON.stringify(zielAnsicht)
        ).toBe(9);

        // Und jetzt der Vergleich Zeile gegen Reiter.
        const falsch = [];
        for (let d = 1; d <= 9; d++) {
            const taste = String(d);
            const ansicht = zielAnsicht[taste];
            const zeile = hilfe.reihen.find(
                r => r.tasten.length === 1 && r.tasten[0] === taste && r.text
            );
            if (!zeile) {
                falsch.push(`${taste}: keine Zeile`);
                continue;
            }
            const reiterText = reiter[ansicht] || '';
            // Der Vergleich laeuft auf dem BLOSSEN WORT: der Reiter traegt ein
            // Symbol davor ("🏠 Start"), die Zeile nicht. Verlangt ist, dass
            // die Beschriftung der Zeile im Reitertext VORKOMMT — nicht, dass
            // sie ihm gleicht. Eine Zeile darf praeziser sein ("Start
            // (Armaturenbrett)"), sie darf nur nicht etwas ANDERES nennen.
            const nackt = s => s.replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase();
            if (!nackt(reiterText).includes(nackt(zeile.text))) {
                falsch.push(
                    `${taste} -> ${ansicht}: Reiter "${reiterText}", Hilfe "${zeile.text}"`
                );
            }
        }
        expect(
            falsch,
            'Diese Navigationszeilen nennen einen Namen, den die App nicht fuehrt. Links ' +
                'steht, was der Nutzer in der Reiterleiste sieht, rechts, was die Hilfe ' +
                'ihm sagt. Der Nutzer sucht dann nach einem Reiter, den es nicht gibt — ' +
                'und die Hilfe ist genau die Instanz, die er befragt, WEIL er etwas nicht ' +
                'findet.\n  ' +
                falsch.join('\n  ')
        ).toEqual([]);
    });
});

// ============================================================
// (20) DIE POS1/ENDE-ZEILE NENNT IHRE VORBEDINGUNG SELBST
// ============================================================
//
// WAS (18)(d) OFFEN GELASSEN HAT. Jener Fall prueft den VERBUND der drei
// E-2-Zeilen: irgendeine davon muss den Fokus nennen. Zwei tun es ("Fokus in
// einer Reihe (z. B. Zauberplätze)"), die dritte nicht — und die dritte ist
// die, die am meisten verspricht: "Erster bzw. letzter Punkt der Reihe",
// `Pos1` `Ende`. Ein Nutzer liest eine Zeile, nicht einen Verbund.
//
// UND IN DER KAMPFANSICHT IST SIE TEUER, gemessen am gebauten Buendel,
// 1440x900, gefuellte Kampagne mit sechs Kaempfern, BODY-Fokus:
//
//     Pos1        nichts            defaultPrevented false
//     Ende        scrollY 0 -> 306  defaultPrevented false
//     ↓           scrollY 0 -> 40   defaultPrevented false
//     ← → ↑       nichts            defaultPrevented false
//
// (Die 306 px sind an einer frisch geladenen Seite gemessen. Der Fall unten
// setzt vor jedem Anschlag mit `ZURUECKSETZEN` zurueck und meldet dort 736 px
// — mehr, nicht weniger. Die Aussage haengt nicht an der Zahl, sondern am
// Vorzeichen, und der Fall prueft `> 0` und nennt den Istwert.)
//
// Die Kampfansicht LAEUFT (scrollHeight 1206 bei innerHeight 900) — der Satz
// "der Koerper dieser App laeuft nie" aus (18)(d) gilt fuer die
// Beute-Ansicht und nicht hier. Wer in der Kampfansicht `Ende` drueckt, weil
// die Hilfe "letzter Punkt der Reihe" sagt, rollt das Dokument und verliert
// die Kampfzeile, auf die er schaut.
//
// KEINE KAMPFZEILE IST EINE REIHE. Gemessen traegt die Kampfansicht sechs
// `.init-row`, und keine davon ist Glied einer Gruppe; Gruppen gibt es dort
// nur INNERHALB der Zeile (sechs `.init-spell-slots` mit 42 Punkten, dazu
// `.death-saves-dots` bei einem Sterbenden). Mit Fokus auf einem dieser
// Punkte tut `Ende` genau das, was die Zeile sagt (gemessen: Glied 0 -> 6,
// defaultPrevented true) — nur liegt dieser Punkt 40 Tabulatorhalte vom
// Seitenanfang entfernt, und davon steht in der Zeile nichts.

test.describe('HILF — die Gruppenzeilen gelten auch einzeln', () => {
    test('(20) Pos1/Ende nennt den Fokus, und die Kampfansicht belegt warum', async ({ page }) => {
        test.setTimeout(240_000);
        await ansichtOeffnen(page, 'initiative');

        // ---- Vorbedingung A: die Kampfansicht laeuft, und `Ende` rollt sie.
        const rollLage = await page.evaluate(() => ({
            scrollHeight: document.documentElement.scrollHeight,
            innerHeight: window.innerHeight,
            kampfzeilen: document.querySelectorAll('.init-row').length,
            zeilenInGruppe: Array.from(document.querySelectorAll('.init-row')).filter(
                r => r.getAttribute('tabindex') !== null || r.closest('[role="toolbar"]')
            ).length,
            gruppenInZeile: document.querySelectorAll('.init-row .init-spell-slots').length
        }));
        expect(
            rollLage.kampfzeilen,
            'Vorbedingung: die Kampfansicht fuehrt Kampfzeilen. Gemessen: ' +
                JSON.stringify(rollLage)
        ).toBeGreaterThanOrEqual(6);
        expect(
            rollLage.zeilenInGruppe,
            'Vorbedingung des Befundes: KEINE Kampfzeile ist Glied einer Gruppe — nur ' +
                `Punkte INNERHALB der Zeile sind es (${rollLage.gruppenInZeile} Reihen). ` +
                'Wird eine Kampfzeile selbst zur Gruppe, ist der Befund hinfaellig und ' +
                'dieser Fall gehoert neu geschrieben.'
        ).toBe(0);
        expect(
            rollLage.scrollHeight,
            'Vorbedingung des Befundes: die Kampfansicht ist LAENGER als das Fenster. ' +
                `Gemessen ${rollLage.scrollHeight} px Inhalt in ${rollLage.innerHeight} px ` +
                'Fenster. Nur darum kann `Ende` dort das Dokument rollen.'
        ).toBeGreaterThan(rollLage.innerHeight);

        /** @type {Record<string, {dp: boolean, scrollY: number}>} */
        const bodyLage = {};
        for (const taste of ['Home', 'End', 'ArrowDown']) {
            await page.evaluate(ZURUECKSETZEN('initiative'));
            await page.waitForTimeout(200);
            await page.evaluate(() => {
                window.__abnDp = null;
                window.addEventListener(
                    'keydown',
                    e => {
                        window.__abnDp = e.defaultPrevented;
                    },
                    { once: true }
                );
            });
            await page.keyboard.press(taste);
            await page.waitForTimeout(260);
            bodyLage[taste] = await page.evaluate(() => ({
                dp: window.__abnDp,
                scrollY: Math.round(window.scrollY)
            }));
        }
        expect(
            bodyLage.End.scrollY,
            'Vorbedingung des Befundes: `Ende` rollt in der Kampfansicht bei BODY-Fokus ' +
                `das Dokument. Gemessen: ${JSON.stringify(bodyLage)}. Rollt es nicht, ` +
                'kostet die unvollstaendige Zeile nichts und dieser Fall ist unbegruendet.'
        ).toBeGreaterThan(0);
        expect(
            bodyLage.End.dp,
            'und zwar als BROWSERVORGABE, nicht als App-Wirkung (defaultPrevented false)'
        ).toBe(false);

        // ---- Die Forderung: die Zeile selbst nennt den Fokus.
        const hilfe = await hilfeLesen(page);
        const posEndeZeilen = hilfe.reihen.filter(r => {
            const t = hilfeTastenmenge([r]);
            return t.has('POS1') || t.has('ENDE');
        });
        expect(
            posEndeZeilen.length,
            'Vorbedingung: die Hilfe fuehrt eine Zeile fuer Pos1/Ende'
        ).toBeGreaterThanOrEqual(1);
        const ohneVorbedingung = posEndeZeilen
            .filter(r => !/fokus|liegt auf|steht auf|darin|angew/i.test(r.text))
            .map(r => r.text);
        expect(
            ohneVorbedingung,
            'Diese Zeile(n) fuer Pos1/Ende nennen ihre Vorbedingung nicht: ' +
                `"${ohneVorbedingung.join('" | "')}". (18)(d) prueft nur den VERBUND der ` +
                'drei E-2-Zeilen — ein Nutzer liest aber eine Zeile. Gemessen in der ' +
                'Kampfansicht bei BODY-Fokus: `Ende` rollt das Dokument um ' +
                `${bodyLage.End.scrollY} px (Inhalt ${rollLage.scrollHeight} px in ` +
                `${rollLage.innerHeight} px), und keine der ${rollLage.kampfzeilen} ` +
                'Kampfzeilen ist Glied einer Gruppe. Die Zeile verspricht damit in der ' +
                'reichsten Ansicht der App etwas, das dort nur nach 40 Tabulatorhalten ' +
                'auf einen Zauberplatz gilt.'
        ).toEqual([]);
    });
});

// ============================================================
// (21) DIE LEERTASTEN-ZEILE NENNT ETWAS NACHPRUEFBARES
// ============================================================
//
// DIE GEMESSENE WAHRHEITSTAFEL, gebautes Buendel, Kampfansicht, sechs
// Kaempfer, je frischer Seitenaufbau, echte Anschlaege und echte Mausklicks:
//
//   Fokuslage                          nativ versorgt nurMaus Ring  Leertaste
//   1 BODY (kein Fokus)                  -      -       -    false Zug weiter
//   2 Tab auf `<button>`                 ja    nein    nein  true  bedient den Knopf
//   3 Mausklick auf `<button>`           ja    nein    nein  FALSE bedient den Knopf
//   4 Mausklick auf `div.init-value`     nein   ja      JA   false ZUG WEITER
//   5 Tab auf `div.init-value`           nein   ja     nein  true  bedient das Element
//
// WAS DIE TAFEL UEBER DIE ZEILE "Nächster Zug (Fokus auf keinem
// Bedienelement)" SAGT: Lage 4 widerlegt sie. Dort liegt der Fokus auf einem
// Bedienelement (`div.init-value`, `tabindex="0"`, `data-action`) — und die
// Leertaste wechselt trotzdem den Zug. Die Zeile nennt damit eine Bedingung,
// die in einer von fuenf gemessenen Lagen falsch ist.
//
// UND WARUM DER FOKUSRING KEIN AUSWEG IST. Die naheliegende Reparatur
// ("sichtbar angewaehlt") faellt an Lage 3: ein mit der MAUS geklickter
// `<button>` traegt keinen `:focus-visible`-Ring und bedient sich trotzdem.
// Der wirkliche Unterschied zwischen 4 und 5 ist der WEG des Fokus (Maus
// gegen Tastatur, `KeyboardReach.nurMausfokus()`), und den kann ein Nutzer an
// der Oberflaeche nicht ablesen — es gibt kein Merkmal, das ihn zeigt.
//
// DIE FOLGERUNG, und sie ist die eigentliche Aussage dieses Falls: eine
// Zeile darf nicht auf einem Zustand fussen, den der Nutzer nicht sehen
// kann. Sie darf auf dem fussen, was er GETAN hat — geklickt oder
// tabuliert —, denn das weiss er immer. Verlangt ist darum eine Bedingung,
// die eine HANDLUNG nennt, und verboten ist die Behauptung ueber den Ort des
// Fokus, die Lage 4 widerlegt.

test.describe('HILF — die Leertaste sagt etwas Nachpruefbares', () => {
    test('(21) die Bedingung der Leertaste nennt eine Handlung, keinen Fokusort', async ({
        page
    }) => {
        test.setTimeout(300_000);

        /**
         * Eine Fokuslage herstellen und die Leertaste druecken.
         * @param {() => Promise<string>} herstellen
         */
        const messen = async herstellen => {
            await ansichtOeffnen(page, 'initiative');
            await page.evaluate(() => {
                if (window.D?.initiative) window.D.initiative.currentTurn = 0;
                if (typeof window.renderInit === 'function') window.renderInit();
            });
            await page.waitForTimeout(260);
            const notiz = await herstellen();
            const vor = await page.evaluate(() => {
                window.__abnDp = null;
                window.addEventListener(
                    'keydown',
                    e => {
                        window.__abnDp = e.defaultPrevented;
                    },
                    { once: true }
                );
                const a = document.activeElement;
                return {
                    tag: a?.tagName || 'null',
                    bedienelement: !!a?.matches?.(
                        'a[href],button,input:not([type=hidden]),select,textarea,summary,' +
                            'details,[tabindex]:not([tabindex="-1"])'
                    ),
                    nurMaus: !!window.KeyboardReach?.nurMausfokus?.(a),
                    ring: (() => {
                        try {
                            return a && a !== document.body ? a.matches(':focus-visible') : false;
                        } catch {
                            return false;
                        }
                    })(),
                    zug: window.D?.initiative?.currentTurn ?? null
                };
            });
            await page.keyboard.press(' ');
            await page.waitForTimeout(380);
            const nach = await page.evaluate(() => window.D?.initiative?.currentTurn ?? null);
            return { ...vor, notiz, zugNachher: nach, zugGewechselt: nach !== vor.zug };
        };

        /** @type {Record<string, any>} */
        const lagen = {};
        lagen['1 BODY'] = await messen(async () => {
            await page.evaluate(() => document.activeElement?.blur?.());
            return 'kein Fokus';
        });
        lagen['4 Mausklick auf nachgeruestetes'] = await messen(async () => {
            const h = await page.evaluate(() => {
                const n = Array.from(
                    document.querySelectorAll('#view-initiative [data-action][tabindex="0"]')
                ).filter(
                    e =>
                        !e.matches(
                            'a[href],button,input:not([type=hidden]),select,textarea,summary,details'
                        ) && e.getBoundingClientRect().width > 4
                );
                const b = n[0];
                if (!b) return null;
                const r = b.getBoundingClientRect();
                return {
                    x: r.x + r.width / 2,
                    y: r.y + r.height / 2,
                    t: b.tagName + '.' + String(b.className).slice(0, 24)
                };
            });
            if (!h) return '(kein nachgeruestetes Element)';
            await page.mouse.click(h.x, h.y);
            await page.waitForTimeout(280);
            await page.evaluate(() => {
                if (window.D?.initiative) window.D.initiative.currentTurn = 0;
            });
            return h.t;
        });
        lagen['3 Mausklick auf nativen Knopf'] = await messen(async () => {
            const h = await page.evaluate(() => {
                const b = document.querySelector(
                    '#view-initiative button[data-action="sort-initiative"]'
                );
                if (!b) return null;
                const r = b.getBoundingClientRect();
                return {
                    x: r.x + r.width / 2,
                    y: r.y + r.height / 2,
                    t: (b.textContent || '').trim()
                };
            });
            if (!h) return '(kein Knopf)';
            await page.mouse.click(h.x, h.y);
            await page.waitForTimeout(280);
            return h.t;
        });

        const tafel = Object.entries(lagen)
            .map(
                ([k, v]) =>
                    `${k}: fokus=${v.tag} (${v.notiz}) bedienelement=${v.bedienelement} ` +
                    `nurMaus=${v.nurMaus} ring=${v.ring} Zug ${v.zug}->${v.zugNachher}`
            )
            .join('\n  ');

        // ---- Vorbedingung: die Tafel muss den Widerspruch wirklich zeigen.
        expect(
            lagen['1 BODY'].zugGewechselt,
            `Vorbedingung: ohne Fokus wechselt die Leertaste den Zug.\n  ${tafel}`
        ).toBe(true);
        expect(
            {
                bedienelement: lagen['4 Mausklick auf nachgeruestetes'].bedienelement,
                zugGewechselt: lagen['4 Mausklick auf nachgeruestetes'].zugGewechselt
            },
            'DER BEFUND: nach einem Mausklick auf ein nachgeruestetes Bedienelement liegt ' +
                'der Fokus auf einem Bedienelement UND die Leertaste wechselt den Zug. ' +
                'Trifft das nicht zu, ist die Zeile "Fokus auf keinem Bedienelement" ' +
                `richtig und dieser Fall unbegruendet.\n  ${tafel}`
        ).toEqual({ bedienelement: true, zugGewechselt: true });
        expect(
            {
                ring: lagen['3 Mausklick auf nativen Knopf'].ring,
                zugGewechselt: lagen['3 Mausklick auf nativen Knopf'].zugGewechselt
            },
            'UND DER AUSWEG IST VERBAUT: ein mit der Maus geklickter `<button>` traegt ' +
                'keinen Fokusring und bedient sich trotzdem. Eine Zeile, die auf den ' +
                `sichtbaren Ring abhebt, waere hier falsch.\n  ${tafel}`
        ).toEqual({ ring: false, zugGewechselt: false });

        // ---- Die Forderung an die Zeile.
        const hilfe = await hilfeLesen(page);
        const leerZeilen = hilfe.reihen
            .filter(r => hilfeTastenmenge([r]).has('LEERTASTE'))
            .map(r => r.text);
        expect(leerZeilen.length, 'Vorbedingung: die Hilfe fuehrt eine Leertasten-Zeile').toBe(1);
        expect(
            leerZeilen[0],
            `Die Leertasten-Zeile lautet "${leerZeilen[0]}". Sie darf nicht behaupten, der ` +
                'Fokus liege auf KEINEM Bedienelement — Lage 4 der Tafel widerlegt es: ' +
                `dort liegt er auf einem, und der Zug wechselt trotzdem.\n  ${tafel}`
        ).not.toMatch(/(kein|ohne)[a-zäöüß ]*bedienelement/i);
        expect(
            leerZeilen[0].toLowerCase(),
            `Die Leertasten-Zeile lautet "${leerZeilen[0]}". Ihre Bedingung muss eine ` +
                'HANDLUNG des Nutzers nennen (angeklickt, angewaehlt, mit Tab gesprungen) ' +
                'und nicht einen Zustand, den er nicht sehen kann. Der wirkliche ' +
                'Unterschied zwischen Lage 4 und Lage 5 ist der WEG des Fokus — Maus gegen ' +
                `Tastatur —, und dafuer gibt es an der Oberflaeche kein Merkmal.\n  ${tafel}`
        ).toMatch(/angeklickt|angewählt|angewaehlt|geklickt|tabuliert/);
    });
});

// ============================================================
// (22) DIE OFFENE HILFE HAT NAMEN — AUSWEG, TITEL, TASTENKAPPEN
// ============================================================
//
// DREI BEFUNDE AN EINER FLAECHE, die Fall (15) nicht gesehen hat, weil er
// Rollen und Paare zaehlt und keine NAMEN:
//
//   (a) DER ✕-KNOPF HAT KEINEN NAMEN. Gemessen ist er das EINZIGE
//       fokussierbare Element im Dialog (1 von 1) — der erste Tabulatorhalt
//       der offenen Hilfe heisst fuer ein Vorleseprogramm "✕", also je nach
//       Programm "Multiplikationszeichen" oder gar nichts. Der eine Ausweg,
//       den die Tastatur hat, ist damit unbenannt.
//
//   (b) DER TITEL IST KEINE UEBERSCHRIFT. `#shortcuts-overlay-titel` ist ein
//       `<span>` ohne `role`; die sechs Abschnitte beginnen bei `aria-level`
//       3. Der Baum hat damit sechs Ueberschriften der Ebene 3 und keine
//       darueber — wer per Ueberschriftensprung navigiert, landet mitten im
//       Inhalt und erfaehrt nie, wie die Flaeche heisst.
//
//   (c) SIEBEN TASTENKAPPEN HABEN KEINE TEXTFASSUNG: `←`, `→`, `↑`, `↓`,
//       `/`, `?` und `.`. Gemessen liest der Zugaenglichkeitsbaum die Zeile
//       als `definition: ← →` — ein Vorleseprogramm sagt dazu "Pfeil nach
//       links" nicht.
//
// UND WARUM DIE NAHELIEGENDE REPARATUR VON (c) NICHTS TUT. Vier Fassungen am
// laufenden Buendel eingesetzt und den Baum gelesen, BEVOR eine gewaehlt
// wurde:
//
//     Ausgangsstand                       definition: ← →
//     `aria-label` am `<kbd>`             definition: ← →        <-- WIRKUNGSLOS
//     `.sr-only`-Span dazu                definition: ← → Pfeil nach links, …
//     `aria-hidden` + `.sr-only`-Span     definition: Pfeil nach links, …
//     `role="img"` + `aria-label`         img "Pfeil nach links": ←
//
// `<kbd>` ist `role="generic"`, und auf einer generischen Rolle ist Benennung
// verboten — Chromium verwirft das `aria-label` lautlos. Das ist die Art
// Reparatur, die richtig aussieht und nichts bewirkt; der Fall misst darum am
// BAUM und nicht am Attribut.

test.describe('HILF — die offene Hilfe hat Namen', () => {
    test('(22) Ausweg, Titel und Tastenkappen sind benannt', async ({ page }) => {
        test.setTimeout(180_000);
        await ansichtOeffnen(page, 'initiative');
        await page.keyboard.press('Shift+/');
        await page.waitForTimeout(450);
        expect(
            await page.evaluate(() => !!document.querySelector('#shortcuts-overlay.show')),
            'Vorbedingung: "?" oeffnet die Hilfe'
        ).toBe(true);

        const lage = await page.evaluate(() => {
            const o = document.getElementById('shortcuts-overlay');
            const halte = Array.from(
                o.querySelectorAll(
                    'a[href],button,input:not([type=hidden]),select,textarea,' +
                        '[tabindex]:not([tabindex="-1"])'
                )
            );
            const kappen = Array.from(o.querySelectorAll('kbd.shortcut-key'));
            return {
                halte: halte.length,
                halteTexte: halte.map(h => (h.textContent || '').trim()),
                titel: (() => {
                    const t = document.getElementById('shortcuts-overlay-titel');
                    return t ? { tag: t.tagName, role: t.getAttribute('role') } : null;
                })(),
                abschnitte: o.querySelectorAll('.shortcuts-section').length,
                // Eine Kappe ohne Buchstaben und Ziffer ist eine SYMBOLKAPPE.
                symbolkappen: kappen
                    .map(k => (k.textContent || '').trim())
                    .filter(t => t && !/[\p{L}\p{N}]/u.test(t))
            };
        });
        expect(
            lage.halte,
            `Vorbedingung: die Hilfe hat Haltepunkte. Gemessen ${lage.halte} ` +
                `(${lage.halteTexte.join(' | ')}).`
        ).toBeGreaterThanOrEqual(1);
        expect(
            lage.symbolkappen.length,
            'Vorbedingung: die Hilfe fuehrt Symbolkappen. Gemessen: ' +
                JSON.stringify(lage.symbolkappen)
        ).toBeGreaterThanOrEqual(4);

        const schnappschuss = await page.locator('#shortcuts-overlay').ariaSnapshot();
        const zeilen = schnappschuss.split('\n');

        // ---- (a) der Ausweg hat einen Namen.
        const knopfZeilen = zeilen.filter(z => /^\s*- button/.test(z));
        expect(
            knopfZeilen.length,
            `Vorbedingung: der Baum fuehrt den ✕-Knopf. Gemessen: ${knopfZeilen.join(' | ')}`
        ).toBeGreaterThanOrEqual(1);
        const namenlos = knopfZeilen.filter(z => !/"[^"]*[\p{L}][^"]*"/u.test(z));
        expect(
            namenlos,
            `Der Ausweg der Hilfe traegt keinen Namen aus Worten: ${namenlos.join(' | ')}. ` +
                `Er ist gemessen der EINZIGE Haltepunkt im Dialog (${lage.halte} von ` +
                `${lage.halte}), also der erste und letzte, auf dem die Tastatur landet. ` +
                'Ein Vorleseprogramm sagt dort "✕" — je nach Programm ' +
                '"Multiplikationszeichen" oder nichts.'
        ).toEqual([]);

        // ---- (b) der Titel ist eine Ueberschrift ueber den Abschnitten.
        const ueberschriften = zeilen.filter(z => /^\s*- heading/.test(z));
        expect(
            ueberschriften.length,
            `Der Baum fuehrt ${ueberschriften.length} Ueberschriften bei ` +
                `${lage.abschnitte} Abschnitten. Der Titel der Flaeche muss selbst eine ` +
                'sein, sonst gibt es keine Ebene ueber dem Inhalt und ein ' +
                'Ueberschriftensprung landet mitten in der Liste. Gemessen war der Titel ' +
                `ein ${lage.titel?.tag} ohne role (${JSON.stringify(lage.titel)}).\n` +
                ueberschriften.join('\n')
        ).toBe(lage.abschnitte + 1);
        const ebenen = ueberschriften
            .map(z => {
                const m = z.match(/\[level=(\d+)\]/);
                return m ? Number(m[1]) : null;
            })
            .filter(e => e !== null);
        expect(
            ebenen.length,
            `Vorbedingung: der Baum nennt die Ebenen. Gemessen: ${ueberschriften.join(' | ')}`
        ).toBeGreaterThanOrEqual(1);
        expect(
            Math.min(...ebenen),
            `Die Ueberschriftenebenen der Hilfe sind ${JSON.stringify(ebenen)}. Die ` +
                'oberste muss UEBER der Ebene der Abschnitte liegen — sonst stehen Titel ' +
                'und Abschnitt auf derselben Stufe und die Flaeche hat keinen Kopf.'
        ).toBeLessThan(3);

        // ---- (c) jede Zeile mit einer Symbolkappe hat eine Textfassung.
        //
        // GEMESSEN WIRD DIE ZEILE, NICHT DAS ZEICHEN, und der Umweg hat einen
        // Grund: die wirksame Fassung traegt `aria-hidden` auf der Kappe, das
        // Zeichen VERSCHWINDET damit aus dem Baum. Ein Fall, der "die
        // Baumzeilen mit diesem Zeichen muessen Buchstaben tragen" prueft,
        // waere dann rot, obwohl die Reparatur greift (nachgewiesen: mit
        // aria-hidden findet er null Zeilen, und `[].some()` ist falsch). Die
        // Frage lautet richtig: traegt die DEFINITION der Zeile, in der die
        // Kappe sitzt, einen Namen aus Worten? Darum wird je betroffene Zeile
        // ein eigener Schnappschuss gelesen.
        const kappenZeilen = await page.evaluate(() =>
            Array.from(document.querySelectorAll('#shortcuts-overlay .shortcut-row'))
                .map((r, i) => ({
                    i,
                    zeichen: Array.from(r.querySelectorAll('kbd.shortcut-key'))
                        .map(k => (k.textContent || '').trim())
                        .filter(t => t && !/[\p{L}\p{N}]/u.test(t)),
                    text: (r.querySelector('dt span')?.textContent || '').trim()
                }))
                .filter(z => z.zeichen.length > 0)
        );
        expect(
            kappenZeilen.length,
            `Vorbedingung: es gibt Zeilen mit Symbolkappen. Gemessen: ${kappenZeilen.length}`
        ).toBeGreaterThanOrEqual(3);

        const reihen = page.locator('#shortcuts-overlay .shortcut-row');
        const ohneWort = [];
        for (const z of kappenZeilen) {
            const schnapp = await reihen.nth(z.i).ariaSnapshot();
            const definition = schnapp
                .split('\n')
                .filter(l => /- definition:/.test(l))
                .join(' ');
            if (!/[\p{L}]{3,}/u.test(definition.replace(/- definition:/g, ''))) {
                ohneWort.push(`"${z.text}" (${z.zeichen.join(' ')}) -> ${definition.trim()}`);
            }
        }
        expect(
            ohneWort,
            'Diese Zeilen nennen ihre Taste im Zugaenglichkeitsbaum nur als Zeichen und ' +
                `nicht als Wort:\n  ${ohneWort.join('\n  ')}\nEin Vorleseprogramm liest ` +
                '"←" nicht als "Pfeil nach links". VORSICHT BEI DER REPARATUR: ein ' +
                '`aria-label` am `<kbd>` ist WIRKUNGSLOS (gemessen — `<kbd>` ist ' +
                '`role="generic"`, dort ist Benennung verboten). Es braucht eine ' +
                'Textfassung im Baum, z. B. `aria-hidden` auf der Kappe plus einen ' +
                '`.sr-only`-Span daneben.'
        ).toEqual([]);
    });
});

// ============================================================
// (23) "DIESE HILFE" IST KEIN UMSCHALTER
// ============================================================
//
// GEMESSEN: `?` bei OFFENER Hilfe laesst sie offen
// (`class="shortcuts-overlay show"`, sichtbar) — die Schranke aus Befund 2
// macht die App fuer App-Kuerzel taub, und `?` ist eines davon. Die Zeile
// "Diese Hilfe — ?" liest sich daneben wie ein Umschalter, und das ist
// dieselbe Fehlerart wie die drei Zeilen aus (18): sie verspricht etwas, das
// die Taste nicht tut. Wer die Hilfe mit `?` wieder zumachen will, drueckt
// sie zweimal und haelt dann die Tastatur fuer kaputt — der Ausweg steht in
// der Fusszeile, aber niemand liest eine Fusszeile, wenn die Zeile selbst
// eine Antwort zu geben scheint.

test.describe('HILF — die Hilfezeile verspricht keinen Umschalter', () => {
    test('(23) die `?`-Zeile sagt, dass die Taste oeffnet', async ({ page }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'initiative');
        await page.keyboard.press('Shift+/');
        await page.waitForTimeout(420);
        const offen = await page.evaluate(
            () => !!document.querySelector('#shortcuts-overlay.show')
        );
        expect(offen, 'Vorbedingung: "?" oeffnet die Hilfe').toBe(true);

        await page.keyboard.press('Shift+/');
        await page.waitForTimeout(420);
        const nochOffen = await page.evaluate(() => ({
            klassen: document.getElementById('shortcuts-overlay')?.className || '',
            sichtbar: !!document
                .getElementById('shortcuts-overlay')
                ?.checkVisibility({ opacityProperty: true })
        }));
        expect(
            nochOffen,
            'Vorbedingung des Befundes: `?` schliesst die Hilfe NICHT. Schliesst es sie ' +
                'doch, ist die Zeile als Umschalter richtig und dieser Fall unbegruendet.'
        ).toEqual({ klassen: 'shortcuts-overlay show', sichtbar: true });

        const hilfe = await hilfeLesen(page);
        const fragezeichen = hilfe.reihen
            .filter(r => hilfeTastenmenge([r]).has('?'))
            .map(r => r.text);
        expect(fragezeichen.length, 'Vorbedingung: die Hilfe fuehrt eine `?`-Zeile').toBe(1);
        expect(
            fragezeichen[0].toLowerCase(),
            `Die \`?\`-Zeile lautet "${fragezeichen[0]}". Sie muss sagen, dass die Taste ` +
                'OEFFNET — gemessen schliesst `?` die offene Hilfe nicht ' +
                `(${JSON.stringify(nochOffen)}). Ohne das Wort liest sich die Zeile wie ` +
                'ein Umschalter, und wer die Hilfe mit `?` wieder zumachen will, drueckt ' +
                'zweimal und haelt die Tastatur fuer kaputt.'
        ).toMatch(/öffn|oeffn|aufruf|anzeig/);
    });
});
