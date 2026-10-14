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
 * FUER E-2. Die Hilfe war beim Schreiben dieser Datei um ZEHN Kuerzel
 * veraltet, und sie ist nicht einmal veraltet, sondern laufend: sie hat seit
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
 * ihm entgangen — also eben jene, die hier nachgetragen werden. Die Messung
 * wird darum ERWEITERT statt die Luecke erklaert.
 *
 * Die Liste ist eine AUSWAHL und keine Aufzaehlung: eine vollstaendige
 * Kreuzung aus 4 Modifikatorlagen und 68 Kandidaten waere 272 Anschlaege je
 * Ansicht und liefe in kein Zeitbudget. Sie enthaelt (a) jedes in `CLAUDE.md`
 * gefuehrte Modifikatorkuerzel, (b) alle neun `Alt+Ziffer` und alle sieben
 * `Alt+Shift+Ziffer` (lueckenlos, weil dort die Belegung ziffernweise
 * springt), (c) die Buchstaben, auf denen ein Browser selbst ein Kuerzel
 * fuehrt (`a c v x p o n b i u g h l s f`) — dort tut eine App-Belegung am
 * meisten weh und faellt am ehesten unbemerkt an. Was NICHT gemessen wird,
 * steht in Fall (10) als gezaehlte Restschuld.
 */
const MODIFIKATORTASTEN = [
    'Control+z',
    'Control+y',
    'Control+s',
    'Control+k',
    'Control+f',
    'Control+Shift+K',
    'Control+.',
    'Control+a',
    'Control+c',
    'Control+v',
    'Control+x',
    'Control+p',
    'Control+o',
    'Control+n',
    'Control+b',
    'Control+i',
    'Control+u',
    'Control+g',
    'Control+h',
    'Control+l',
    'Control+Shift+Z',
    'Control+Shift+S',
    'Control+Shift+F',
    ...Array.from({ length: 9 }, (_, i) => `Alt+${i + 1}`),
    ...Array.from({ length: 7 }, (_, i) => `Alt+Shift+${i}`),
    'Alt+a',
    'Alt+s',
    'Alt+n',
    'Shift+N',
    'Shift+P',
    'Shift+K',
    'Shift+/'
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
            '— die Fokusfalle — liegt im offenen Dialog und ist in `modal-fokus.spec.js` ' +
            'bewacht, nicht hier.'
    },
    {
        taste: 'SHIFT+TAB',
        grund:
            'Dieselbe Lage wie TAB, nur die Gegenrichtung: bei BODY-Fokus die ' +
            'Browservorgabe, und die App-Wirkung liegt im offenen Dialog, wo ' +
            '`modal-fokus.spec.js` sie bewacht. Eine eigene Messung hier waere eine ' +
            'zweite, schwaechere Kopie jener Datei.'
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
        expect(MODIFIKATORTASTEN.length, 'die benannte Auswahl der Modifikatorkuerzel').toBe(46);
        expect(new Set(MODIFIKATORTASTEN).size, 'ohne Dubletten').toBe(46);
        expect(SONDERTASTEN.length, 'die benannten Tasten').toBe(14);
        expect(GRUPPENTASTEN.length, 'die Gruppentasten aus E-2').toBe(6);

        // NICHT GEMESSEN, und das ist die ehrliche Rechnung: die volle
        // Kreuzung aus vier Modifikatorlagen (Strg, Alt, Shift, Alt+Shift)
        // und 68 Kandidaten waere 272 Anschlaege JE ANSICHT. Gemessen werden
        // 46 — also 226 Kombinationen weniger, und das in zwei von 24
        // Ansichten. Die Auswahl deckt (a) alle in `CLAUDE.md` gefuehrten
        // Modifikatorkuerzel, (b) alle 16 `Alt+Ziffer` und
        // `Alt+Shift+Ziffer` lueckenlos, (c) die Buchstaben, auf denen der
        // Browser selbst ein Kuerzel fuehrt. Was fehlt, sind
        // Modifikator-Kombinationen auf Buchstaben OHNE Browserkuerzel und
        // auf Satzzeichen. Ein Kuerzel dort waere ein ungewoehnlicher Griff;
        // die Luecke ist bekannt und nicht verschwiegen.
        const VOLLE_KREUZUNG = 4 * 68;
        expect(VOLLE_KREUZUNG - MODIFIKATORTASTEN.length).toBe(226);
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
