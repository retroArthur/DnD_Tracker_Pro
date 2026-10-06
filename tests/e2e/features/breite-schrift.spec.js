// @ts-check
/**
 * E2E — Das Layout haelt, wenn die Schrift breiter laeuft (C1).
 *
 * WARUM ES DIESE PROBE BRAUCHT, und warum die vorhandenen Proben sie nicht
 * ersetzen. Am 2026-10-02 meldete der CI-Lauf 36966941474 (`ubuntu-latest`)
 * zwoelf Fehlschlaege, waehrend dieselbe Suite unter Windows gruen lief. Drei
 * der vier Befundgruppen waren Layoutfehler, und alle drei hatten dieselbe
 * Ursache: die App bestimmt ihre Schriften an GENAU ZWEI Stellen
 * (`assets/styles/variables.css`), und BEIDE Ketten haben einen Gewinner, den
 * es nur unter Windows gibt —
 *
 *     --font-ui:   'Segoe UI', system-ui, sans-serif
 *     --font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace
 *
 * Unter Windows greift bei --font-ui das erste Glied und bei --font-mono das
 * dritte (JetBrains Mono und Fira Code sind auf beiden Plattformen nicht
 * installiert, nachgemessen). Unter Linux fallen beide Erstglieder weg; es
 * greift die fontconfig-Standardschrift bzw. DejaVu Sans Mono, und die laufen
 * rund 14.5% (UI) bzw. 9.5% (Mono) breiter. Jede inhaltsbasierte Mindestbreite
 * und jede umbrechende Leiste waechst damit — und drei Stellen hatten weniger
 * Luft als diese 14.5%:
 *
 *   Party, 320x700      min-content der Charakterkarte 285.02px in einer
 *                       300px-Spalte: 14.98px Luft. Unter breiter Schrift
 *                       304.88px, also 4.88px Ueberlauf -> die Karten ragten
 *                       aus dem Fenster (CI: `party: 10px, 5 Elemente
 *                       ausserhalb`).
 *   Mobil-Kopfzeile     sieben Bedienelemente mit 339.2px Inhalt in 304px
 *                       Inhaltsbreite. Die Mitte des rechten Knopfes lag bei
 *                       x=319 in einem 320px-Fenster — 0.8px Reserve. Der 5.6px
 *                       breitere Sitzungszaehler schob sie auf x=325 (CI:
 *                       `button.mobile-search-btn -> nichts`, 8 Faelle).
 *   Truhe, 360x740      Werkzeugleiste 328 von 502px Schale, Listenspalte 162px
 *                       bei 148px verlangten: 14px Luft. Unter breiter Schrift
 *                       bricht die Leiste eine Zeile mehr um, 359px, und die
 *                       Spalte faellt auf 131px (CI: 136px).
 *
 * Die drei zustaendigen Proben (quer-ueberhang.spec.js, mobil-navigation.spec.js,
 * layoutprofil.spec.js) pruefen jeweils den ZUSTAND — ragt etwas hinaus, ist ein
 * Knopf erreichbar, passen zwei Eintraege. Unter Windows war dieser Zustand in
 * allen drei Fällen knapp in Ordnung, also waren sie gruen. Sie messen keine
 * RESERVE, und darum konnte keine von ihnen sagen, dass drei Stellen auf Kante
 * standen. Diese Probe tut genau das: sie fragt nach dem Abstand zur Kante, und
 * sie fragt ihn unter der breiteren der beiden Metriken, die auf der laufenden
 * Plattform zu haben sind.
 *
 * WIE DIE BREITE METRIK HERGESTELLT WIRD. Ein `<style>` als erstes Kopfkind legt
 * beide Tokens um:
 *
 *     :root { --font-ui: Verdana, sans-serif !important;
 *             --font-mono: "Courier New", monospace !important; }
 *
 * Verdana laeuft 1.1554x breiter als Segoe UI (gemessen am Knopftext
 * "+ Neuer Charakter", 14px: 114.75 -> 132.59px) und damit einen Prozentpunkt
 * breiter als die Linux-Schrift (am CI-Befund kalibriert: ~1.145). Courier New
 * hat 0.600em Vorschub gegen Consolas 0.550em; DejaVu Sans Mono, das Linux
 * greift, hat 0.602em. Beide Ersatzschriften sind also eine Spur breiter als das
 * Vorbild — Reserve in der richtigen Richtung.
 *
 * DAS `!important` IST KEINE RATSCHENVERLETZUNG: die Ratsche von
 * tests/unit/design-consistency.test.js zaehlt die Quelldateien unter
 * assets/styles/, nicht das Stilblatt eines Testlaufs. Und ohne `!important`
 * verliert die Regel gegen `:root` in variables.css, wenn sie VOR den App-Stilen
 * eingehaengt wird — sie muss aber vor ihnen stehen, weil die App ihre
 * Messtokens (`--mobile-header-height`, `--view-frame-height`) beim Start setzt
 * und dabei schon die endgueltige Schrift sehen soll.
 *
 * WAS DIE PROBE AUF LINUX MISST, und warum das kein Widerspruch ist. Auf einem
 * GitHub-Runner ist Verdana nicht installiert; `Verdana, sans-serif` loest dort
 * auf dieselbe Standardschrift auf wie `'Segoe UI', system-ui, sans-serif`.
 * Die Probe misst dort also die ECHTE Linux-Metrik — genau den Zustand, der die
 * zwoelf Fehlschlaege erzeugt hat. Unter Windows misst sie eine Nachstellung,
 * die eine Spur breiter ist als Linux. In beiden Fällen gilt die Aussage: "das
 * Layout haelt unter der breiteren der beiden auf dieser Plattform verfuegbaren
 * Metriken, mit beziffertem Abstand". Damit die Probe nicht stillschweigend
 * eine SCHMALERE Schrift messen kann, steht vor jeder Zusicherung eine
 * Vorbedingung, die beide Breiten vergleicht und ausgibt.
 *
 * WARUM NUR EIN THEME. Alle drei Befunde sind Geometrie. In der Mobil-Runde ist
 * fuer jeden von ihnen nachgemessen, dass die vier Themes auf den Bildpunkt
 * dieselben Zahlen liefern (die vier Faelle je CI-Fenster in Gruppe 3 sind vier
 * Durchlaeufe derselben Messung). Eine Themenschleife hier vervierfachte die
 * Laufzeit fuer identische Werte.
 *
 * NACHGETRAGEN IN RUNDE 1 (C1/R1) — Gruppe 4b, Fall (4). Die erste Fassung
 * dieser Datei bewachte die Listenspalte der Truhe bei 360x740 und verlangte
 * dazu, dass ein `max-height: 60%`-Deckel an den fuenf Leisten GESETZT ist. Die
 * Pruefrunde hat belegt, dass dieser Deckel bei 320px greift — und dort vier der
 * fuenf Leisten um 55 bis 127 Bildpunkte rollen laesst, mit 5 bis 8
 * Bedienelementen hinter einem 2px-Rollbalken. Unter der OERTLICHEN Schrift,
 * ohne jede Linux-Metrik. Keine Probe deckte das ab: dieser Fall messte nur
 * 360x740, layoutprofil.spec.js nur 360 und 390, und die engen Fenster von
 * mobil-navigation.spec.js pruefen Navigation und Ueberhang, nicht die Leiste.
 * Fall (4) schliesst die Luecke und kehrt die Forderung um: nicht "ein Deckel
 * ist gesetzt", sondern "die Leiste rollt nicht und klemmt nichts ab".
 *
 * Betroffene Quellen: `assets/styles/variables.css` (`--grid-columns` im
 * Mobil-Profil), `assets/styles/core.css` (`.char-card-name`, `.mobile-header`,
 * `.mobile-header-group`, `.mobile-timer`, `.mobile-timer-seconds`,
 * `flex-shrink` der Werkzeugleiste in den fuenf Schalen und der Rollstreifen der
 * vier Chipreihen), `assets/styles/party.css` (`.party-leveling-options`),
 * `assets/styles/editors.css` (`.section-toolbar-actions`),
 * `assets/styles/loot.css` (`.loot-view .loot-filter-chip`),
 * `systems/session-timer.js` (`schreibeMobilZeit()`).
 */
import { test, expect } from '@playwright/test';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/* Die Nachstellung. Begruendung der beiden Familien im Kopfkommentar. */
const BREITE_SCHRIFT =
    ':root { --font-ui: Verdana, sans-serif !important; ' +
    '--font-mono: "Courier New", monospace !important; }';

/* Bezugstext fuer die Breitenprobe: ein echter Knopftext der Werkzeugleiste.
   Eine Buchstabenreihe waere kuerzer und damit unempfindlicher. */
const PROBETEXT = '+ Neuer Charakter';

/* ------------------------------------------------------------------
   DIE DREI SCHRANKEN. Jede ist eine RESERVE, nicht ein Zustand — das
   ist der Unterschied zu den drei vorhandenen Proben.
   ------------------------------------------------------------------ */

/* Gruppe 2 — Abstand zwischen der min-content-Breite der Charakterkarte und
   der Breite ihrer Rasterspalte. Vor der Korrektur: 14.98px (Segoe UI) und
   -4.88px (Verdana). Danach: 77.84 und 66.12px. 30px sind der Betrag, den die
   Linux-Metrik gegenueber Windows braucht (gemessen +12.3% auf 285px = 35px),
   abgerundet auf eine Schranke, die nicht selbst auf Kante steht. */
const MIN_KARTEN_RESERVE = 30;

/* Gruppe 3 — freie Breite in der Mobil-Kopfzeile bei 320px. Vor der Korrektur:
   -25.7px (Segoe UI/Consolas), -35.3px unter breiter Schrift. Danach: 25.4 und
   21.9px. 12px ist knapp die Haelfte des gemessenen Werts: genug, um eine
   schleichende Erosion anzuschlagen, bevor der erste Knopf wieder hinausfaellt. */
const MIN_KOPF_LUFT = 12;

/* Gruppe 3 — Boden unter der Tippflaeche der Kopfzeilen-Bedienelemente. Die
   44px der Mobil-Runde gelten AUSDRUECKLICH NICHT hier: sie sind an den Reitern
   der Navigationsleiste gesichert (`.nav-tab`, M1), und keines dieser sieben
   Elemente war je 44px gross — gemessen 36.6x43px, der Layout-Knopf 27.1x43px.
   Diese Schranke sagt nur: diese Runde macht sie nicht kleiner. Sie liegt
   bewusst unter dem Istwert, weil die Glyphen aus der Symbolschrift des
   Betriebssystems kommen (12 von 13 Symbolcodepunkten reagieren nicht auf
   --font-ui) und die unter Linux eine andere ist. */
const MIN_KOPF_FLAECHE = [24, 36];

/* Gruppe 4 — Abstand zwischen der Listenspalte und dem, was zwei Eintraege
   brauchen. Vor der Korrektur: 14px (Segoe UI), -17px unter breiter Schrift.
   Danach: 46 und 49px. 30px ist der Betrag, den die breitere Leiste gegenueber
   Windows kostete (+29px, 328 -> 357px im CI). */
const MIN_SPALTEN_RESERVE = 30;

const zz = i => String(i).padStart(2, '0');
const reihe = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));

/* Die vier Etiketten der Ortsfilter und der Kreaturtypen. Sie stehen hier als
   Konstanten, weil ihre LAENGE Teil der Probe ist: ein Filter heisst in einer
   echten Kampagne "Tempelbezirk", nicht "A". */
const FILTERNAMEN = [
    'Stadt',
    'Dungeon',
    'Wildnis',
    'Tempelbezirk',
    'Handelsposten',
    'Unterreich',
    'Ruinenfeld',
    'Hafenviertel'
];
const KREATURTYPEN = [
    'Humanoide',
    'Untote',
    'Bestien',
    'Konstrukte',
    'Aberrationen',
    'Elementare',
    'Drachen'
];

/* Saat. Was darin stehen MUSS, und warum jeweils:
     - Charaktere mit LANGEN Namen. Die Mindestbreite der Charakterkarte kam aus
       dem laengsten einzelnen WORT des Namens; eine kurze Beschriftung bringt
       den Fall der Gruppe 2 gar nicht hervor.
     - 24 Beutestuecke. Die Listenspalte der Truhe kann nur dann zu kurz fuer
       zwei Eintraege sein, wenn ueberhaupt Eintraege da sind; und 24 ist die
       Zahl, mit der layoutprofil.spec.js denselben Fall faehrt.
     - GEFUELLTE CHIPREIHEN in allen vier Schalen, die eine fuehren (Gruppe 4b,
       C1/R1). Das ist der Teil, der dieser Saat gefehlt hat und ohne den der
       Befund nicht sichtbar war: drei der vier Reihen sind datengetrieben —
       die NSCs zeigen die ersten fuenf EINTRAEGE AUS `locations` (plus ein
       "Mehr..."-Auswahlfeld ab dem sechsten), die Orte alle `filters`, die
       Begegnungen die ersten fuenf verschiedenen `creatureType`. Mit
       `locations: []` und `encounters: []` bestand jede dieser Reihen aus dem
       einen Chip "Alle" und war 29px hoch statt 98-138px. Eine leere Saat
       misst hier nicht den Alltag, sondern den Auslieferungszustand.
       Die Truhe braucht dafuer keine Daten: ihre zehn Kategoriechips sind fest.
   Die Mobil-Kopfzeile (Gruppe 3) haengt an keinen Daten.
   `_version` weit in der Zukunft ueberspringt `migrateData()`, die gefuellte
   `_nextId`-Abbildung verhindert die Fruehstart-Rennen — wie in
   `seedCleanSession()` (tests/e2e/helpers/test-utils.js).
   `settings.layout` ist AUSDRUECKLICH NICHT gesetzt: das Profil soll dem
   Fenster folgen. */
const SAAT = {
    _version: '99.0.0',
    settings: {
        theme: 'dark',
        lastView: 'dashboard',
        markdownOnboardingSeen: true,
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
        attributes: { str: 10, dex: 16, con: 14, int: 18, wis: 12, cha: 8 },
        conditions: i % 2 ? ['Vergiftet'] : [],
        spellSlots: { 1: { max: 4, used: 1 }, 2: { max: 3, used: 0 }, 3: { max: 2, used: 0 } }
    })),
    npcs: reihe(12, i => ({
        id: i,
        name: `NSC ${zz(i)}`,
        role: 'Haendler',
        locationId: ((i - 1) % FILTERNAMEN.length) + 1
    })),
    locations: reihe(8, i => ({
        id: i,
        name: `Ortschaft am Fluss ${zz(i)}`,
        type: 'Stadt',
        filterId: ((i - 1) % FILTERNAMEN.length) + 1
    })),
    filters: FILTERNAMEN.map((name, i) => ({ id: i + 1, name, color: 'gold' })),
    quests: [],
    encounters: reihe(12, i => ({
        id: i,
        name: `Begegnung ${zz(i)}`,
        creatureType: KREATURTYPEN[(i - 1) % KREATURTYPEN.length],
        monsters: []
    })),
    spells: [],
    loot: reihe(24, i => ({
        id: i,
        name: `Beute ${zz(i)}`,
        type: 'Waffe',
        category: 'weapons',
        value: 10,
        description: 'Probeeintrag'
    })),
    wiki: [],
    sessionNotes: [],
    randomTables: [],
    timers: [],
    shops: [],
    campaign: {},
    _nextId: {
        characters: 99,
        npcs: 99,
        locations: 99,
        filters: 99,
        quests: 99,
        encounters: 99,
        spells: 99,
        loot: 99,
        items: 99,
        wiki: 99,
        sessionNotes: 99,
        randomTables: 99
    }
};

/**
 * Laedt das gebaute Buendel; mit `breit = true` unter der nachgestellten
 * breiten Schriftmetrik.
 *
 * Das Stilblatt wird per `addInitScript` als ERSTES Kopfkind eingehaengt, also
 * noch vor den App-Stilen: die App setzt ihre Messtokens beim Start
 * (`setzeMobilKopfHoehe()`, `setzeRahmenHoehe()`) und muss dabei schon die
 * endgueltige Schrift sehen. Dass unsere Deklaration trotz der frueheren
 * Stellung gewinnt, leistet das `!important` — Begruendung im Kopfkommentar.
 *
 * @param {import('@playwright/test').Page} page
 * @param {boolean} breit
 */
async function appLaden(page, breit) {
    if (breit) {
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
            // es aus, greift der Leerzustand — und DEN faengt die Vorbedingung
            // jedes Falles (Kartenzahl, Eintragszahl).
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
 * Breite des Bezugstextes in der aktuellen UI-Schrift und in der
 * Windows-Erstwahl 'Segoe UI'. Belegt, dass die Nachstellung angekommen ist —
 * und auf einem Linux-Runner, dass sie dort nichts aendern KANN, weil beide
 * Ketten auf dieselbe Standardschrift fallen.
 * @param {import('@playwright/test').Page} page
 * @param {string} text
 */
function messeSchriftbreite(page, text) {
    return page.evaluate(t => {
        const messe = familie => {
            const span = document.createElement('span');
            span.style.cssText =
                'position:absolute;left:-9999px;white-space:pre;font-size:14px;font-family:' +
                familie;
            span.textContent = t;
            document.body.appendChild(span);
            const b = span.getBoundingClientRect().width;
            span.remove();
            return Math.round(b * 100) / 100;
        };
        return {
            ist: messe('var(--font-ui)'),
            segoe: messe('"Segoe UI"'),
            mono: (() => {
                const span = document.createElement('span');
                span.style.cssText =
                    'position:absolute;left:-9999px;white-space:pre;font-size:14px;' +
                    'font-weight:600;font-family:var(--font-mono)';
                span.textContent = '00:00:00';
                document.body.appendChild(span);
                const b = span.getBoundingClientRect().width;
                span.remove();
                return Math.round(b * 100) / 100;
            })(),
            familie: getComputedStyle(document.body).fontFamily
        };
    }, text);
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
    await page.waitForTimeout(320);
}

/* ====================================================================
   MESSGRIFFE
   ==================================================================== */

/**
 * Gruppe 2 — min-content-Breite der Charakterkarte gegen die Breite ihrer
 * Rasterspalte. GENAU DIESE Differenz ist in CI negativ geworden.
 *
 * `width: min-content` wird gesetzt, gemessen und zurueckgenommen; ohne diesen
 * Griff liesse sich die Mindestbreite nicht lesen, weil die Karte im Betrieb
 * immer auf ihre Spalte gestreckt ist. Die Zusicherung braucht die
 * Mindestbreite und nicht die Istbreite: die Istbreite ist erst DANN zu grosz,
 * wenn es schon zu spaet ist.
 */
function messeKartenreserve() {
    const gitter = document.querySelector('#party-list');
    const karte = document.querySelector('#view-party .char-card');
    if (!gitter || !karte) return { da: false };
    const spalten = getComputedStyle(gitter).gridTemplateColumns;
    const spalte = parseFloat(spalten) || 0;
    const vorher = /** @type {HTMLElement} */ (karte).style.width;
    /** @type {HTMLElement} */ (karte).style.width = 'min-content';
    void (/** @type {HTMLElement} */ (karte).offsetWidth);
    const minBreite = karte.getBoundingClientRect().width;
    /** @type {HTMLElement} */ (karte).style.width = vorher;
    void (/** @type {HTMLElement} */ (karte).offsetWidth);
    const de = document.documentElement;
    const kurz = e => {
        let s = e.tagName.toLowerCase();
        if (e.id) s += '#' + e.id;
        s += [...e.classList]
            .slice(0, 2)
            .map(c => '.' + c)
            .join('');
        return s;
    };
    const aktiv = document.querySelector('.view.active');
    const aussen = [];
    if (aktiv) {
        for (const e of aktiv.querySelectorAll('*')) {
            const b = e.getBoundingClientRect();
            if (b.width > 0 && b.right > window.innerWidth + 1) {
                aussen.push(`${kurz(e)} ${Math.round(b.width)}px@${Math.round(b.right)}`);
            }
        }
    }
    return {
        da: true,
        layout: de.dataset.layout || '(keins)',
        karten: document.querySelectorAll('#view-party .char-card').length,
        spaltenVorlage: spalten,
        spalte: Math.round(spalte * 100) / 100,
        minBreite: Math.round(minBreite * 100) / 100,
        reserve: Math.round((spalte - minBreite) * 100) / 100,
        ueberhangX: Math.max(0, Math.round(de.scrollWidth - de.clientWidth)),
        aussen
    };
}

/**
 * Gruppe 3 — freie Breite in der Mobil-Kopfzeile, plus Erreichbarkeit jedes
 * Bedienelements.
 *
 * Die freie Breite ist die LADENDE Zahl: seit die Leiste umbrechen darf
 * (`flex-wrap: wrap`), liegt bei zu viel Inhalt nichts mehr ausserhalb — die
 * Leiste wird stattdessen hoeher, und das kostet an anderer Stelle
 * (`--mobile-header-height` geht in `--view-frame-height` ein). Eine Probe, die
 * nur nach "liegt etwas draussen" fragt, waere ab jetzt blind fuer das
 * Platzproblem. Darum wird gemessen, was uebrig ist.
 */
function messeKopfzeile() {
    const kopf = document.querySelector('.mobile-header');
    if (!kopf) return { da: false };
    const kr = kopf.getBoundingClientRect();
    const stil = getComputedStyle(kopf);
    const bez = e => {
        if (!e) return 'nichts';
        let s = e.tagName.toLowerCase();
        if (e.id) s += '#' + e.id;
        if (e.classList.length) s += '.' + Array.from(e.classList).join('.');
        return s;
    };
    const sichtbar = e => {
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        if (parseFloat(cs.opacity) === 0) return false;
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };
    const teile = Array.from(kopf.querySelectorAll('button,[data-action]'))
        .filter(sichtbar)
        .map(e => {
            const r = e.getBoundingClientRect();
            const cx = Math.round(r.left + r.width / 2);
            const cy = Math.round(r.top + r.height / 2);
            const t = document.elementFromPoint(cx, cy);
            return {
                was: bez(e),
                breite: Math.round(r.width * 10) / 10,
                hoehe: Math.round(r.height * 10) / 10,
                frei: !!t && (t === e || e.contains(t)),
                obenauf: bez(t),
                ausserhalb: r.right > window.innerWidth + 0.5 || r.left < -0.5
            };
        });
    /* Freie Breite: Inhaltsbreite der Leiste minus Istbreite ihrer drei
       obersten Kinder minus der Spaltenabstand zwischen ihnen. `space-between`
       verteilt den Rest, die Istbreiten der Kinder sind also ihre
       Eigenbreiten, solange nichts umbricht. Bricht etwas um, liegen Kinder in
       verschiedenen Zeilen und die Summe ueberschaetzt den Bedarf nicht — sie
       ist dann sogar der richtige Wert fuer "was muesste in eine Zeile passen". */
    const gruppen = Array.from(kopf.children).filter(k => sichtbar(k));
    const luecke = parseFloat(stil.columnGap) || 0;
    const bedarf =
        gruppen.reduce((s, k) => s + k.getBoundingClientRect().width, 0) +
        luecke * Math.max(0, gruppen.length - 1);
    /* `clientWidth` ist die POLSTER-Box, nicht die Inhaltsbox: die beiden 8px
       Innenabstand muessen abgezogen werden, sonst meldet die Probe 16px mehr
       Luft, als es gibt — und die Schranke waere um genau diesen Betrag zu
       milde. */
    const innen = (parseFloat(stil.paddingLeft) || 0) + (parseFloat(stil.paddingRight) || 0);
    const inhaltsbreite = kopf.clientWidth - innen;
    /* UMBRUCH ERKENNEN, aber nicht an den Oberkanten: `align-items: center`
       setzt das kuerzere Kind (den Zaehler) auf eine andere Oberkante als die
       Knopfgruppen, drei verschiedene `top`-Werte sind also der NORMALFALL und
       kein Umbruch. Gemessen wird deshalb die senkrechte Spanne aller Kinder
       gegen das hoechste Kind: liegen alle in einer Zeile, ist die Spanne genau
       so hoch wie das hoechste von ihnen. */
    const kaesten = gruppen.map(k => k.getBoundingClientRect());
    const spanne = kaesten.length
        ? Math.max(...kaesten.map(r => r.bottom)) - Math.min(...kaesten.map(r => r.top))
        : 0;
    const hoechstes = kaesten.length ? Math.max(...kaesten.map(r => r.height)) : 0;
    return {
        da: true,
        fenster: window.innerWidth,
        kopfInhalt: Math.round(inhaltsbreite * 10) / 10,
        kopfHoehe: Math.round(kr.height),
        kopfToken: getComputedStyle(document.documentElement)
            .getPropertyValue('--mobile-header-height')
            .trim(),
        gruppen: gruppen.length,
        spanne: Math.round(spanne * 10) / 10,
        hoechstesKind: Math.round(hoechstes * 10) / 10,
        umgebrochen: spanne > hoechstes + 1,
        bedarf: Math.round(bedarf * 10) / 10,
        luft: Math.round((inhaltsbreite - bedarf) * 10) / 10,
        anzahl: teile.length,
        kleinsteBreite: teile.length ? Math.min(...teile.map(t => t.breite)) : 0,
        kleinsteHoehe: teile.length ? Math.min(...teile.map(t => t.hoehe)) : 0,
        blockiert: teile.filter(t => !t.frei).map(t => `${t.was} -> ${t.obenauf}`),
        ausserhalb: teile.filter(t => t.ausserhalb).map(t => t.was),
        zaehler: (() => {
            const d = document.getElementById('mobile-timer-display');
            if (!d) return null;
            return {
                voll: d.textContent,
                sichtbar: /** @type {HTMLElement} */ (d).innerText,
                breite: Math.round(d.getBoundingClientRect().width * 10) / 10
            };
        })()
    };
}

/**
 * Gruppe 4 — Hoehe der Listenspalte gegen die Hoehe von zwei Eintraegen, plus
 * die Hoehe der Werkzeugleiste, die ihr den Platz nimmt. Der Messgriff folgt
 * layoutprofil.spec.js (M2b), ergaenzt um die Leiste und ihren Deckel.
 */
function messeListenplatz() {
    const de = document.documentElement;
    const schale = document.querySelector('.loot-view.active');
    const spalte = document.querySelector('.loot-master');
    const liste = document.getElementById('loot-list');
    if (!schale || !spalte || !liste) return { da: false };
    const leiste = schale.querySelector('.section-toolbar');
    const erster = liste.children[0];
    const eintrag = erster ? Math.round(erster.getBoundingClientRect().height) : 0;
    return {
        da: true,
        layout: de.dataset.layout || '(keins)',
        rahmen: getComputedStyle(de).getPropertyValue('--view-frame-height').trim(),
        schaleHoehe: Math.round(schale.getBoundingClientRect().height),
        leisteHoehe: leiste ? Math.round(leiste.getBoundingClientRect().height) : 0,
        leisteDeckel: leiste ? getComputedStyle(leiste).maxHeight : '(keine Leiste)',
        leisteRollt: leiste ? leiste.scrollHeight - leiste.clientHeight : 0,
        spalteHoehe: spalte.clientHeight,
        spalteOverflow: getComputedStyle(spalte).overflowY,
        eintragHoehe: eintrag,
        anzahl: liste.children.length,
        verlangt: 2 * eintrag,
        reserve: spalte.clientHeight - 2 * eintrag
    };
}

/**
 * Gruppe 4b (C1/R1) — klemmt die Werkzeugleiste Bedienelemente ab?
 *
 * DREI ZAHLEN, und sie sagen Verschiedenes.
 *
 * `leisteRollt` (`scrollHeight - clientHeight`) ist die LADENDE. Sie ist > 0,
 * sobald der Kasten der Leiste kleiner ist als ihr Inhalt — gleich, ob ein
 * `max-height` ihn deckelt, ein `flex-shrink` ihn zusammendrueckt oder ein
 * `overflow` ihn abschneidet. Genau das war der Befund: ein `max-height: 60%`
 * an diesen fuenf Leisten griff bei 320px (Schale 330px, 60% davon 198px) und
 * legte in vier der fuenf Schalen 5 bis 8 Bedienelemente hinter einen
 * Rollbereich, den in dieser App niemand erwartet.
 *
 * `abgeklemmt` ist die ZWEITE und beantwortet die Frage, die `leisteRollt`
 * offen laesst: liegt ein Bedienelement ausserhalb eines Kastens, der NICHT
 * rollt? Dafuer laeuft die Probe von jedem Bedienelement die Vorfahrenkette
 * hinauf und vergleicht die Kaesten. Ein Element darf ausserhalb liegen — aber
 * nur, wenn der abschneidende Vorfahre auf DIESER ACHSE ausdruecklich rollt.
 * Damit ist die waagerechte Rollreihe der Filterchips erlaubt (sie ist die
 * Gestalt, die den Befund behebt) und ein `overflow: hidden` der Schale nicht.
 * Diese zweite Zahl war schon VOR der Korrektur gruen, und das ist kein
 * Versehen: der Deckel schnitt mit `overflow-y: auto` ab, also war alles
 * formal "erreichbar". Sie ist der Waechter fuer die neue Bauart — `flex-shrink:
 * 0` kann die Leiste ueber die Schale hinaus wachsen lassen, und DAS faengt
 * nur sie. Dass sie faengt, ist durch Mutation belegt: mit `max-height: 60%;
 * overflow-y: hidden` an denselben fuenf Leisten meldet sie bei 320x568 die
 * abgeschnittenen Chips der Truhe, der NSCs, der Orte und der Begegnungen.
 *
 * `gequetscht` ist die DRITTE und in Runde 2 nachgetragen. Sie beantwortet die
 * Frage, die die ersten zwei BEIDE offen lassen: ist ein Bedienelement des
 * Rollstreifens zwar im Fenster und formal erreichbar, aber so weit
 * zusammengedrueckt, dass es seine Beschriftung nicht mehr zeigt?
 * DER BEFUND, DER SIE ERZWUNGEN HAT: der Rollstreifen aus C1/R1 setzte
 * `flex-wrap: nowrap` an der ganzen Reihe, gab die Schranke `flex: 0 0 auto`
 * aber NUR den Chips. Das Geschwister `select.npc-filter-select` ("Mehr...",
 * ueber das die Orte 6..15 ueberhaupt erst erreichbar sind) behielt den
 * Voreinstellungswert `flex-shrink: 1` und saugte damit die gesamte
 * Schrumpfung der Reihe auf: gemessen 26px statt 159px (Segoe UI) bzw. 178px
 * (breite Schrift) in allen Telefonfenstern, also ein Kasten mit nur noch dem
 * Chevron und keinem Zeichen Text. Die ersten zwei Zahlen waren dabei gruen —
 * der Streifen rollte, nichts lag ausserhalb, der Seitenueberhang war 0.
 * Die Annahme, die den Fehler erzeugt hat, war "die Reihe enthaelt nur Chips";
 * diese Zahl prueft deshalb JEDES Kind des Streifens und nicht eine Liste von
 * Klassen.
 *
 * @param {{schale: string, spalte: string|null, liste: string|null}} sel
 */
function messeLeiste(sel) {
    const schale = document.querySelector(sel.schale);
    if (!schale) return { da: false, grund: `Schale ${sel.schale} fehlt` };
    const leiste = schale.querySelector(':scope > .section-toolbar');
    if (!leiste) return { da: false, grund: 'keine Werkzeugleiste in der Schale' };
    const kurz = e => {
        let s = e.tagName.toLowerCase();
        if (e.id) s += '#' + e.id;
        s += Array.from(e.classList)
            .slice(0, 2)
            .map(c => '.' + c)
            .join('');
        return s;
    };
    const rollend = w => w === 'auto' || w === 'scroll';
    const abgeklemmt = [];
    const teile = Array.from(
        leiste.querySelectorAll('button, select, input:not([type="file"]), [data-action]')
    ).filter(e => {
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    });
    for (const e of teile) {
        /* ZWEI Kaesten, einer je Achse. Trifft die Kette einen ROLLBEHAELTER,
           der auf seiner Achse abschneidet, dann ist das Element dort
           erreichbar — und von da an zaehlt fuer diese Achse nicht mehr der
           Kasten des Elements, sondern der des Rollbehaelters. Ohne diese
           Uebergabe meldete die Probe die seitwaerts weggerollten Filterchips
           als abgeklemmt von der Ansicht (`overflow: hidden`), obwohl sie im
           Streifen eine Rollachse haben. */
        let kx = e.getBoundingClientRect();
        let ky = kx;
        let p = e.parentElement;
        let befund = null;
        while (p && p !== document.documentElement && !befund) {
            const cs = getComputedStyle(p);
            const pr = p.getBoundingClientRect();
            if (cs.overflowX !== 'visible' && (kx.right > pr.right + 1 || kx.left < pr.left - 1)) {
                if (!rollend(cs.overflowX)) befund = { p, achse: 'waagerecht' };
                else kx = pr;
            }
            if (
                !befund &&
                cs.overflowY !== 'visible' &&
                (ky.bottom > pr.bottom + 1 || ky.top < pr.top - 1)
            ) {
                if (!rollend(cs.overflowY)) befund = { p, achse: 'senkrecht' };
                else ky = pr;
            }
            p = p.parentElement;
        }
        if (befund) {
            abgeklemmt.push(
                `${kurz(e)} "${(e.textContent || '').trim().slice(0, 18)}" von ` +
                    `${kurz(befund.p)} (${befund.achse})`
            );
        }
    }
    const streifen = leiste.querySelector(
        '.loot-filter-chips, .npc-filter-chips, .loc-filter-chips, .enc-filter-chips'
    );
    /* DIE DRITTE ZAHL (C1/R2) — ist ein Kind des Rollstreifens SCHMALER als
       sein Inhalt braucht? Begruendung im Kommentar an messeLeiste().
       Der Bedarf wird an einem freistehenden Klon gemessen: eine Messbuehne IM
       Streifen (damit der Klon dieselbe Schrift und dieselben Tokens erbt),
       darin der Klon mit `width:auto; flex:none`.
       `scrollWidth > clientWidth` taugt dafuer NICHT: Chromium beschneidet den
       Text eines zusammengedrueckten <select> ohne eigenen Rollbereich,
       scrollWidth bleibt gleich clientWidth, und der Mangel bliebe unsichtbar
       (nachgemessen am Buendel ohne die Korrektur: 26/26 bei 178px Bedarf). */
    const gequetscht = [];
    if (streifen) {
        const buehne = document.createElement('div');
        buehne.style.cssText =
            'position:absolute;left:-99999px;top:0;width:auto;display:block;' +
            'visibility:hidden;pointer-events:none';
        streifen.appendChild(buehne);
        for (const kind of Array.from(streifen.children)) {
            if (kind === buehne) continue;
            const ist = kind.getBoundingClientRect().width;
            const klon = /** @type {HTMLElement} */ (kind.cloneNode(true));
            klon.style.cssText +=
                ';width:auto;min-width:0;max-width:none;flex:none;position:static';
            buehne.appendChild(klon);
            const bedarf = klon.getBoundingClientRect().width;
            klon.remove();
            // 1px Toleranz gegen die Rundung des Teilbildpunkt-Rasters.
            if (bedarf - ist > 1) {
                gequetscht.push(
                    `${kurz(kind)} ist ${Math.round(ist * 10) / 10}px breit, braucht ` +
                        `${Math.round(bedarf * 10) / 10}px (flex-shrink ` +
                        `${getComputedStyle(kind).flexShrink})`
                );
            }
        }
        buehne.remove();
    }
    const spalte = sel.spalte ? document.querySelector(sel.spalte) : null;
    const liste = sel.liste ? document.getElementById(sel.liste) : null;
    const erster = liste && liste.children[0];
    const eintrag = erster ? Math.round(erster.getBoundingClientRect().height) : 0;
    return {
        da: true,
        layout: document.documentElement.dataset.layout || '(keins)',
        schaleHoehe: Math.round(schale.getBoundingClientRect().height),
        leisteHoehe: Math.round(leiste.getBoundingClientRect().height),
        leisteBedarf: leiste.scrollHeight,
        leisteRollt: Math.max(0, leiste.scrollHeight - leiste.clientHeight),
        leisteDeckel: getComputedStyle(leiste).maxHeight,
        streifenHoehe: streifen ? Math.round(streifen.getBoundingClientRect().height) : null,
        streifenKinder: streifen ? streifen.children.length : null,
        streifenRolltX: streifen ? streifen.scrollWidth - streifen.clientWidth : null,
        spalteHoehe: spalte ? spalte.clientHeight : null,
        eintragHoehe: eintrag,
        teile: teile.length,
        abgeklemmt,
        gequetscht,
        ueberhangX: Math.max(
            0,
            Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth)
        )
    };
}

/* Die fuenf Schalen mit fester Hoehe — dieselben fuenf, die der entfallene
   Deckel adressierte. Orte und Begegnungen tragen in dieser Saat keine
   Listeneintraege (ihre Listen zeigen Karten, keine Zeilen); ihre Spalte wird
   deshalb nur berichtet, nicht bewertet. */
const SCHALEN = [
    { name: 'loot', schale: '.loot-view.active', spalte: '.loot-master', liste: 'loot-list' },
    { name: 'npcs', schale: '.npc-view.active', spalte: '.npc-master', liste: 'npc-list' },
    { name: 'locations', schale: '.loc-view.active', spalte: '.loc-master', liste: 'loc-list' },
    { name: 'encounter', schale: '.enc-view.active', spalte: '.enc-master', liste: 'enc-list' },
    {
        name: 'bestiary',
        schale: '.bestiary-view.active',
        spalte: '.bestiary-master',
        liste: 'bestiary-list'
    }
];

/* ====================================================================
   DIE PROBEN
   ==================================================================== */

test.describe('C1 — das Layout haelt unter breiter Schrift', () => {
    test('(1) die Charakterkarte passt mit Abstand in ihre Rasterspalte (320x700)', async ({
        page
    }) => {
        await page.setViewportSize({ width: 320, height: 700 });
        await appLaden(page, true);

        const schrift = await messeSchriftbreite(page, PROBETEXT);
        await reiterWechseln(page, 'party');
        const m = await page.evaluate(messeKartenreserve);

        console.log(
            `[C1-Karte] Schrift ${schrift.familie} — "${PROBETEXT}" ist ${schrift.ist}px breit, ` +
                `in 'Segoe UI' ${schrift.segoe}px (Faktor ` +
                `${(schrift.ist / schrift.segoe).toFixed(4)}) · ${JSON.stringify(m)}`
        );

        /* VORBEDINGUNG A — die breite Schrift ist angekommen, oder sie KANN auf
           dieser Plattform nichts aendern, weil beide Ketten auf dieselbe
           Standardschrift fallen (so auf den Linux-Runnern). Was sie NICHT sein
           darf: schmaler als die Windows-Erstwahl — dann waere die Probe
           leichter als der Alltag. */
        expect(
            schrift.ist,
            `die Probenschrift ist SCHMALER als 'Segoe UI' (${schrift.ist} gegen ` +
                `${schrift.segoe}px) — diese Probe waere dann leichter als der Alltag`
        ).toBeGreaterThanOrEqual(schrift.segoe - 0.5);

        // VORBEDINGUNG B — ohne Karten gibt es keine Mindestbreite zu messen.
        expect(m.da, 'Party-Raster oder Charakterkarte fehlt').toBe(true);
        expect(m.layout, 'der Fall braucht das Mobil-Profil').toBe('mobile');
        expect(m.karten, 'die Saat muss Charakterkarten erzeugen').toBeGreaterThanOrEqual(5);

        // ZUSICHERUNG 1 — die RESERVE, nicht der Zustand.
        expect(
            m.reserve,
            `die Karte braucht mindestens ${m.minBreite}px, ihre Spalte ist ${m.spalte}px ` +
                `breit (Vorlage ${m.spaltenVorlage}) — ${m.reserve}px Abstand, verlangt ` +
                `${MIN_KARTEN_RESERVE}px`
        ).toBeGreaterThanOrEqual(MIN_KARTEN_RESERVE);

        /* ZUSICHERUNG 2 — und der Zustand stimmt auch: nichts liegt draussen.
           SIE IST DIE SCHWAECHERE DER ZWEI, und das ist belegt: am Buendel OHNE
           die Korrektur loeste die Rasterspalte auf 304.875px auf (also auf die
           Mindestbreite der Karte, 4.88px ueber ihrem 300px-Behaelter), und
           dennoch meldete derselbe Messgriff `ueberhangX: 0` und keine Elemente
           ausserhalb — die 4.88px verschwanden im 10px-Innenabstand der Ansicht.
           Rot war allein Zusicherung 1 (Reserve 0 gegen verlangte 30). Genau
           deshalb steht die Reserve vor dem Zustand: ein Fehler, der heute im
           Innenabstand verschwindet, ist derselbe Fehler, der auf dem naechsten
           Betriebssystem aus dem Fenster laeuft. */
        expect(m.ueberhangX, `Seitenueberhang ${m.ueberhangX}px`).toBe(0);
        expect(m.aussen, 'Elemente rechts des Fensterrands in der Party-Ansicht').toEqual([]);
    });

    for (const [breite, hoehe] of [
        [320, 568],
        [320, 740]
    ]) {
        test(`(2) die Mobil-Kopfzeile hat bei ${breite}x${hoehe} Luft und bleibt bedienbar`, async ({
            page
        }) => {
            await page.setViewportSize({ width: breite, height: hoehe });
            await appLaden(page, true);

            const schrift = await messeSchriftbreite(page, PROBETEXT);
            const m = await page.evaluate(messeKopfzeile);

            console.log(
                `[C1-Kopf] ${breite}x${hoehe} · Mono "00:00:00" ${schrift.mono}px · ` +
                    `${JSON.stringify(m)}`
            );

            // VORBEDINGUNG A — wie bei (1).
            expect(
                schrift.ist,
                `die Probenschrift ist SCHMALER als 'Segoe UI' (${schrift.ist} gegen ${schrift.segoe}px)`
            ).toBeGreaterThanOrEqual(schrift.segoe - 0.5);

            // VORBEDINGUNG B — die Leiste ist da und traegt ihre sieben Elemente.
            expect(m.da, 'die Mobil-Kopfzeile fehlt').toBe(true);
            expect(m.anzahl, `die Kopfzeile traegt ${m.anzahl} Bedienelemente statt sieben`).toBe(
                7
            );

            // ZUSICHERUNG 1 — die RESERVE. Siehe Kommentar an messeKopfzeile().
            expect(
                m.luft,
                `die sieben Bedienelemente brauchen ${m.bedarf}px von ${m.kopfInhalt}px ` +
                    `Inhaltsbreite — ${m.luft}px frei, verlangt ${MIN_KOPF_LUFT}px`
            ).toBeGreaterThanOrEqual(MIN_KOPF_LUFT);

            // ZUSICHERUNG 2 — und darum bleibt die Leiste EINZEILIG.
            expect(
                m.umgebrochen,
                `die Kopfzeile ist umgebrochen (senkrechte Spanne ${m.spanne}px bei einem ` +
                    `hoechsten Kind von ${m.hoechstesKind}px, Leiste ${m.kopfHoehe}px hoch) — ` +
                    `das geht ueber --view-frame-height von den Listen-Schalen ab`
            ).toBe(false);

            // ZUSICHERUNG 3 — kein Element liegt draussen, jedes antwortet.
            expect(m.ausserhalb, 'Bedienelemente rechts des Fensterrands').toEqual([]);
            expect(
                m.blockiert,
                `Bedienelemente, die auf ihrer Mitte nicht antworten (${m.blockiert.length} von ${m.anzahl})`
            ).toEqual([]);

            // ZUSICHERUNG 4 — die Tippflaechen sind nicht kleiner geworden.
            expect(
                [m.kleinsteBreite >= MIN_KOPF_FLAECHE[0], m.kleinsteHoehe >= MIN_KOPF_FLAECHE[1]],
                `kleinste Tippflaeche ${m.kleinsteBreite}x${m.kleinsteHoehe}px, Boden ` +
                    `${MIN_KOPF_FLAECHE.join('x')}px`
            ).toEqual([true, true]);

            /* ZUSICHERUNG 5 — der Sitzungszaehler zeigt auf Telefonbreite
               Stunden und Minuten, traegt die Sekunden aber weiter im Text.
               Beides gehoert zusammen: die Sekunden sind der Platz, der dem
               rechten Knopf fehlte, und `textContent` ist das, woran andere
               Proben den Zaehler lesen. */
            expect(m.zaehler, 'der Sitzungszaehler fehlt in der Kopfzeile').not.toBeNull();
            expect(
                m.zaehler.voll,
                `textContent des Zaehlers ist "${m.zaehler.voll}" — die Vollform muss stehen bleiben`
            ).toMatch(/^\d\d:\d\d:\d\d$/);
            expect(
                m.zaehler.sichtbar.trim(),
                `sichtbar steht "${m.zaehler.sichtbar}" — bei ${breite}px sollen es fuenf Zeichen sein`
            ).toMatch(/^\d\d:\d\d$/);
        });
    }

    test('(3) die Listenspalte der Truhe traegt zwei Eintraege mit Abstand (360x740)', async ({
        page
    }) => {
        await page.setViewportSize({ width: 360, height: 740 });
        await appLaden(page, true);

        const schrift = await messeSchriftbreite(page, PROBETEXT);
        await reiterWechseln(page, 'loot');
        const m = await page.evaluate(messeListenplatz);

        console.log(
            `[C1-Truhe] Faktor ${(schrift.ist / schrift.segoe).toFixed(4)} · ${JSON.stringify(m)}`
        );

        // VORBEDINGUNG A — wie bei (1).
        expect(
            schrift.ist,
            `die Probenschrift ist SCHMALER als 'Segoe UI' (${schrift.ist} gegen ${schrift.segoe}px)`
        ).toBeGreaterThanOrEqual(schrift.segoe - 0.5);

        // VORBEDINGUNG B — Schale, Spalte und 24 Eintraege sind da.
        expect(m.da, 'Truhen-Schale, Listenspalte oder Liste fehlt').toBe(true);
        expect(m.layout, 'der Fall braucht das Mobil-Profil').toBe('mobile');
        expect(m.anzahl, 'die Liste muss gefuellt sein').toBe(24);
        expect(m.eintragHoehe, 'ein Eintrag muss messbare Hoehe haben').toBeGreaterThan(0);
        expect(
            m.spalteOverflow,
            `.loot-master hat overflow-y: ${m.spalteOverflow} und ist damit nicht der Scrollbereich`
        ).toMatch(/auto|scroll/);

        // ZUSICHERUNG 1 — die RESERVE ueber dem, was zwei Eintraege brauchen.
        expect(
            m.reserve,
            `die Listenspalte ist ${m.spalteHoehe}px hoch, zwei Eintraege brauchen ` +
                `${m.verlangt}px — ${m.reserve}px Abstand, verlangt ${MIN_SPALTEN_RESERVE}px ` +
                `(Schale ${m.schaleHoehe}px, Leiste ${m.leisteHoehe}px, Deckel ${m.leisteDeckel}, ` +
                `Rahmen ${m.rahmen})`
        ).toBeGreaterThanOrEqual(MIN_SPALTEN_RESERVE);

        /* ZUSICHERUNG 2 — die Leiste zeigt ihren ganzen Inhalt, ohne selbst zu
           rollen. HIER STAND `expect(m.leisteDeckel).not.toBe('none')` — die
           Forderung, dass ein `max-height`-Deckel gesetzt IST. Die Forderung war
           falsch gestellt: ein Deckel macht keinen Platz, er verlegt den Mangel
           nur dorthin, wo ihn niemand sieht. Bei 320px griff er und legte
           Bedienelemente hinter einen 2px-Rollbalken (siehe (4)).
           Diese Zeile verlangt stattdessen, dass der Mangel gar nicht entsteht.
           Sie ist strenger: sie wird rot, wenn die Leiste waechst — statt das
           Wachstum stillschweigend zu verstecken. */
        expect(
            m.leisteRollt,
            `die Werkzeugleiste rollt um ${m.leisteRollt}px (Kasten ${m.leisteHoehe}px, Inhalt ` +
                `${m.leisteBedarf}px, Deckel ${m.leisteDeckel}) — ihr Inhalt ist nicht ` +
                `vollstaendig sichtbar`
        ).toBe(0);
    });

    /* ------------------------------------------------------------------
       (4) C1/R1 — der eigentliche Befund der Pruefrunde: der entfallene
       60%-Deckel griff bei 320px und klemmte Bedienelemente ab. Vier Fenster,
       fuenf Schalen, 20 Zustaende.
       WARUM DIESE VIER FENSTER: 320x568 und 320x740 sind die zwei Fenster des
       CI-Befunds; 320x700 ist das dritte, in dem der Deckel unter der
       oertlichen Schrift nachweislich griff (Truhe rollte 19px, NSCs 48px);
       360x740 ist das Fenster, in dem CI die Listenspalte gemeldet hat, und
       damit die Gegenprobe, dass die Korrektur dort nichts verschlechtert.
       390x844 fehlt bewusst: dort war in keinem Zustand etwas zu messen
       (Schale 583px, groesste Leiste 201px), und vier Fenster x fuenf Schalen
       kosten schon vier Seitenladungen.
       ------------------------------------------------------------------ */
    for (const [breite, hoehe] of [
        [320, 568],
        [320, 700],
        [320, 740],
        [360, 740]
    ]) {
        test(`(4) die fuenf Werkzeugleisten klemmen bei ${breite}x${hoehe} nichts ab`, async ({
            page
        }) => {
            await page.setViewportSize({ width: breite, height: hoehe });
            await appLaden(page, true);

            const schrift = await messeSchriftbreite(page, PROBETEXT);

            // VORBEDINGUNG A — wie bei (1).
            expect(
                schrift.ist,
                `die Probenschrift ist SCHMALER als 'Segoe UI' (${schrift.ist} gegen ${schrift.segoe}px)`
            ).toBeGreaterThanOrEqual(schrift.segoe - 0.5);

            for (const s of SCHALEN) {
                await reiterWechseln(page, s.name);
                const m = await page.evaluate(messeLeiste, s);

                console.log(`[C1-Leiste] ${breite}x${hoehe} ${s.name} · ${JSON.stringify(m)}`);

                // VORBEDINGUNG B — Schale und Leiste sind da, im Mobil-Profil.
                expect(m.da, `${s.name}: ${m.grund}`).toBe(true);
                expect(m.layout, `${s.name}: der Fall braucht das Mobil-Profil`).toBe('mobile');
                expect(
                    m.teile,
                    `${s.name}: die Leiste traegt ${m.teile} Bedienelemente — zu wenige, um etwas ` +
                        `abzuklemmen; die Saat greift nicht`
                ).toBeGreaterThanOrEqual(5);

                /* ZUSICHERUNG 1 — die Leiste rollt nicht. Das ist die Zahl, die
                   den Befund traegt: vor der Korrektur 98 (Truhe), 127 (NSCs),
                   55 (Orte) und 68 (Begegnungen) Bildpunkte bei 320x568. */
                expect(
                    m.leisteRollt,
                    `${s.name} bei ${breite}x${hoehe}: die Leiste rollt um ${m.leisteRollt}px ` +
                        `(Kasten ${m.leisteHoehe}px, Inhalt ${m.leisteBedarf}px, Deckel ` +
                        `${m.leisteDeckel}, Schale ${m.schaleHoehe}px) — Bedienelemente liegen ` +
                        `hinter einem Rollbereich, den in dieser App niemand erwartet`
                ).toBe(0);

                /* ZUSICHERUNG 2 — kein Bedienelement liegt ausserhalb eines
                   Kastens, der nicht rollt. Siehe Kommentar an messeLeiste(). */
                expect(
                    m.abgeklemmt,
                    `${s.name} bei ${breite}x${hoehe}: ${m.abgeklemmt.length} von ${m.teile} ` +
                        `Bedienelementen liegen ausserhalb eines nicht rollenden Kastens`
                ).toEqual([]);

                // ZUSICHERUNG 3 — und die Seite bekommt davon keinen Querstand.
                expect(
                    m.ueberhangX,
                    `${s.name} bei ${breite}x${hoehe}: Seitenueberhang ${m.ueberhangX}px — der ` +
                        `Rollstreifen der Chipreihe darf seine Breite nicht nach aussen tragen`
                ).toBe(0);

                /* ZUSICHERUNG 4 (C1/R2) — und kein Kind des Rollstreifens ist
                   schmaler, als sein Inhalt braucht. Erreichbar ist nicht
                   dasselbe wie lesbar: ein Streifen rollt, damit seine
                   Bedienelemente ihre Breite BEHALTEN, nicht damit eines von
                   ihnen fuer die anderen bezahlt. Siehe Kommentar an
                   messeLeiste(); die Zahl, die sie traegt, ist 26 gegen 178px
                   am Auswahlfeld "Mehr..." der NSCs. */
                expect(
                    m.gequetscht,
                    `${s.name} bei ${breite}x${hoehe}: ${m.gequetscht.length} von ` +
                        `${m.streifenKinder} Kindern des Rollstreifens sind zusammengedrueckt ` +
                        `— sie zeigen ihre Beschriftung nicht mehr`
                ).toEqual([]);
            }
        });
    }

    /* ====================================================================
       (5) C1/W5-D — DIE ZEILENBELEGUNG DER WERKZEUGLEISTE BEI 375 px.
       ====================================================================
       WARUM DIESER FALL NEBEN (4) STEHT UND IHN NICHT ERSETZT. Fall (4) fragt,
       ob die Leiste ROLLT und ob ein Bedienelement ABGEKLEMMT ist — ein Zustand,
       der erst eintritt, wenn schon etwas kaputt ist. Er fragt bei 320, 320, 320
       und 360 px. Bei 375 px fragt niemand, und genau dort ist die Leiste
       knapp: identisch zu dem Fall, den der C1-Kommentar in editors.css:752
       als Gewinn der Welle 4 verbucht ("die Leiste faellt von 328 auf 296px, und
       die 32px gehen 1:1 in die Listenspalte"), nur in der Gegenrichtung.

       DER BEFUND DER RUNDE W5-D/1, gemessen am gebauten Buendel, gefuellte
       Kampagne, 375x812, VOR gegen NACH der Schriftumstellung des Schrittes 5:

         encounter  Titelgruppe + primaere Aktion  314,64 -> 325,04 px (Luecke 8 px,
                    Zeilenbreite 329 px) => 322,64 -> 333,04 px belegt, also aus
                    EINER Zeile werden ZWEI; Leiste 158 -> 187 px (+29), und
                    `.enc-master` 305,2 -> 276,2 px (-29), weil `#view-encounter`
                    hoehenbegrenzt ist.
         kalender   316,37 -> 334,59 px belegt; Leiste 146 -> 175 px (+29).
         npcs       313,99 -> 320,44 px belegt, zusammen mit der Luecke 328,44 von
                    329 px — 0,56 px Reserve, also dicht am selben Kippen.

       Ursache war `.section-toolbar-title` im Block `@media (max-width: 600px)`
       (editors.css:745): `0.9em` -> `var(--text-md)`. Der Elternwert ist dort
       gemessen 14 px und nicht 16, die Schrift ging also 12,6 -> 14 px (+1,40),
       und die Titelgruppe wurde 10,4 px breiter.

       WARUM DIE VORHANDENEN ZUSICHERUNGEN DAS NICHT GESEHEN HABEN: waagerechter
       Ueberlauf und Seitenueberlauf blieben in allen vier Kombinationen 0 — es
       wird nichts abgeschnitten, der Umbruch ist gueltiges Flex-Verhalten. Nur
       die ZEILENBELEGUNG aendert sich, und die hat bisher nichts gemessen.

       WAS DIESER FALL ZUSICHERT: Titelgruppe und primaere Aktion teilen bei
       375 px eine Zeile, mit beziffertem Abstand zur Kante. Das ist die Reserve
       und nicht der Zustand — dieselbe Lehre wie bei (1).
       -------------------------------------------------------------------- */

    /** Die Ansichten, deren Leiste bei 375 px gemessen Titelgruppe UND primaere
     *  Aktion in einer Zeile fuehrt. `shops` und `dmscreen` fehlen bewusst: dort
     *  traegt die Aktionsgruppe gemessen 295,56 bzw. 282,73 px und liegt schon
     *  VOR jeder Schriftaenderung in einer eigenen Zeile — eine Zusicherung
     *  darauf waere von Anfang an rot. `wiki` und `party` fehlen, weil ihre
     *  Leiste keine Aktionsgruppe hat. */
    const ZEILENANSICHTEN = [
        'encounter',
        'kalender',
        'npcs',
        'locations',
        'quests',
        'loot',
        'spells',
        'bestiary'
    ];

    /** Mindestabstand der belegten Breite zur Zeilenbreite, in Bildpunkten.
     *  Gemessen nach der Korrektur betraegt der kleinste Abstand 13,37 px
     *  (npcs); VOR der Schriftumstellung waren es 7,01 px, und im Befundstand
     *  0,56 px. Die Schranke steht auf 4 px und damit UNTER dem Stand vor der
     *  Welle: sie soll das Kippen melden und nicht die Welle 5 zurueckdrehen. */
    const MIN_ZEILEN_RESERVE = 4;

    /**
     * Zeilenbelegung einer Werkzeugleiste: welche Gruppen liegen in derselben
     * Flex-Zeile, und wieviel Platz bleibt in der Zeile von Titelgruppe und
     * primaerer Aktion?
     *
     * GRUPPIERT WIRD UEBER DIE SENKRECHTE UEBERLAPPUNG und nicht ueber den
     * Oberrand: in einer Flex-Zeile sind die Gruppen unterschiedlich hoch und
     * mittig ausgerichtet, ihre Oberraender unterscheiden sich um bis zu 13 px.
     * Eine Gruppierung nach `top` meldete vier Zeilen, wo drei sind — beim
     * ersten Messversuch genau so passiert.
     */
    function messeLeistenZeile(name) {
        const r2 = n => Math.round(n * 100) / 100;
        const view = document.getElementById('view-' + name);
        if (!view) return { da: false, grund: 'Ansicht #view-' + name + ' fehlt' };
        const tb = view.querySelector('.section-toolbar');
        if (!tb) return { da: false, grund: name + ': keine .section-toolbar' };
        const tbr = tb.getBoundingClientRect();
        const cs = getComputedStyle(tb);
        const luecke = parseFloat(cs.columnGap || cs.gap || '0') || 0;
        const zeileBreite = r2(
            tbr.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
        );

        const gruppen = Array.from(tb.children)
            .filter(c => c.nodeType === 1 && c.getBoundingClientRect().height > 0)
            .map(c => {
                const r = c.getBoundingClientRect();
                return {
                    kl: c.className.split(/\s+/)[0],
                    b: r2(r.width),
                    oben: r2(r.top - tbr.top),
                    unten: r2(r.bottom - tbr.top)
                };
            });

        const zeilen = [];
        gruppen.forEach(g => {
            const z = zeilen.find(x => g.oben < x.unten - 1 && g.unten > x.oben + 1);
            if (z) {
                z.gruppen.push(g.kl);
                z.belegt = r2(z.belegt + luecke + g.b);
                z.oben = Math.min(z.oben, g.oben);
                z.unten = Math.max(z.unten, g.unten);
            } else {
                zeilen.push({ oben: g.oben, unten: g.unten, gruppen: [g.kl], belegt: g.b });
            }
        });

        const ident = gruppen.find(g => g.kl === 'section-toolbar-identity');
        const aktion = gruppen.find(g => g.kl === 'section-toolbar-actions');
        const paarZeile = zeilen.find(
            z =>
                z.gruppen.includes('section-toolbar-identity') &&
                z.gruppen.includes('section-toolbar-actions')
        );
        const titel = tb.querySelector('.section-toolbar-title');
        const master = view.querySelector(
            '.enc-master, .loc-master, .npc-master, .loot-master, .bestiary-master'
        );

        return {
            da: true,
            layout: window.innerWidth <= 768 ? 'mobile' : 'desktop',
            gruppenZahl: gruppen.length,
            zeilen: zeilen.length,
            aufbau: zeilen.map(z => z.gruppen.join('+') + '=' + z.belegt).join(' | '),
            identDa: !!ident,
            aktionDa: !!aktion,
            identB: ident ? ident.b : null,
            aktionB: aktion ? aktion.b : null,
            luecke: r2(luecke),
            zeileBreite,
            // Belegung des Paares, EINSCHLIESSLICH der Luecke zwischen beiden —
            // sie ist Teil des Platzbedarfs und der Grund, warum encounter bei
            // 325,04 px Gruppenbreite an einer 329-px-Zeile scheitert.
            paarBelegt: ident && aktion ? r2(ident.b + luecke + aktion.b) : null,
            reserve: ident && aktion ? r2(zeileBreite - (ident.b + luecke + aktion.b)) : null,
            einZeilig: !!paarZeile,
            leisteHoehe: r2(tbr.height),
            fsTitel: titel ? r2(parseFloat(getComputedStyle(titel).fontSize)) : null,
            fsTitelEltern:
                titel && titel.parentElement
                    ? r2(parseFloat(getComputedStyle(titel.parentElement).fontSize))
                    : null,
            masterHoehe: master ? r2(master.getBoundingClientRect().height) : null,
            ueberhangX: r2(view.scrollWidth - view.clientWidth),
            seiteUeberhangX: r2(
                document.documentElement.scrollWidth - document.documentElement.clientWidth
            )
        };
    }

    test('(5) Titelgruppe und primaere Aktion teilen bei 375x812 eine Zeile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await appLaden(page, true);

        const schrift = await messeSchriftbreite(page, PROBETEXT);

        // VORBEDINGUNG A — wie bei (1): die Probenschrift ist nicht schmaler
        // als die Windows-Erstwahl, sonst waere der Fall leichter als der Alltag.
        expect(
            schrift.ist,
            `die Probenschrift ist SCHMALER als 'Segoe UI' (${schrift.ist} gegen ${schrift.segoe}px)`
        ).toBeGreaterThanOrEqual(schrift.segoe - 0.5);

        /* ALLE ACHT ANSICHTEN WERDEN GEMESSEN, BEVOR GEURTEILT WIRD. Ein
           `expect` in der Schleife bricht beim ersten Fehlschlag ab und
           verschweigt die uebrigen sieben — im roten Lauf des Befundes W5-D/1
           haette das `encounter` gemeldet und `kalender` nie erreicht. Ein
           roter Lauf soll die ganze Lage nennen. */
        const messungen = [];
        for (const name of ZEILENANSICHTEN) {
            await reiterWechseln(page, name);
            const m = await page.evaluate(messeLeistenZeile, name);
            console.log(`[C1-Zeile] 375x812 ${name} · ${JSON.stringify(m)}`);
            messungen.push({ name, m });
        }

        // VORBEDINGUNG B — jede Leiste ist da, im Mobil-Profil, und fuehrt
        // beide Gruppen. Ohne sie waere der Fall durch WEGLASSEN gruen.
        expect(
            messungen.filter(({ m }) => !m.da).map(({ name, m }) => `${name}: ${m.grund}`)
        ).toEqual([]);
        expect(
            messungen.filter(({ m }) => m.layout !== 'mobile').map(({ name }) => name),
            'der Fall braucht das Mobil-Profil'
        ).toEqual([]);
        expect(
            messungen
                .filter(({ m }) => !m.identDa || !m.aktionDa)
                .map(({ name, m }) => `${name}: identity=${m.identDa} actions=${m.aktionDa}`)
        ).toEqual([]);

        /* ZUSICHERUNG 1 — DIE RESERVE. Sie steht vor dem Zustand, aus
           demselben Grund wie bei (1): 0,56 px Reserve (npcs im Befundstand)
           sind heute gruen und morgen der naechste Umbruch. */
        const zuKnapp = messungen
            .filter(({ m }) => m.reserve === null || m.reserve < MIN_ZEILEN_RESERVE)
            .map(
                ({ name, m }) =>
                    `${name}: Titelgruppe ${m.identB}px + Luecke ${m.luecke}px + Aktion ` +
                    `${m.aktionB}px = ${m.paarBelegt}px in einer ${m.zeileBreite}px breiten ` +
                    `Zeile — ${m.reserve}px Abstand, verlangt ${MIN_ZEILEN_RESERVE}px ` +
                    `(Titel ${m.fsTitel}px auf einem Elternwert von ${m.fsTitelEltern}px)`
            );
        expect(zuKnapp).toEqual([]);

        /* ZUSICHERUNG 2 — und darum liegen beide wirklich in EINER Zeile.
           Die schwaechere der zwei: sie wird erst rot, wenn der Umbruch schon
           da ist. Die Zahl, die sie traegt, ist die Leistenhoehe — 158 -> 187
           px bei encounter, und die 29 px gehen 1:1 aus der Listenspalte. */
        const umgebrochen = messungen
            .filter(({ m }) => !m.einZeilig)
            .map(
                ({ name, m }) =>
                    `${name}: Titelgruppe und primaere Aktion in verschiedenen Zeilen ` +
                    `(${m.zeilen} Zeilen: ${m.aufbau}); Leiste ${m.leisteHoehe}px, ` +
                    `Listenspalte ${m.masterHoehe}px`
            );
        expect(umgebrochen).toEqual([]);

        // ZUSICHERUNG 3 — und die Zeile traegt keinen Querstand nach aussen.
        expect(
            messungen
                .filter(({ m }) => m.ueberhangX !== 0 || m.seiteUeberhangX !== 0)
                .map(({ name, m }) => `${name}: ${m.ueberhangX}px / Seite ${m.seiteUeberhangX}px`)
        ).toEqual([]);

        // Die Zusammenfassung in EINER Zeile, damit ein CI-Protokoll die
        // knappste Stelle ohne Suche nennt.
        const knappste = messungen.reduce((a, b) => (a.m.reserve <= b.m.reserve ? a : b));
        console.log(
            `[C1-Zeile] knappste Stelle: ${knappste.name} mit ${knappste.m.reserve}px Reserve ` +
                `(Schranke ${MIN_ZEILEN_RESERVE}px)`
        );
    });
});
