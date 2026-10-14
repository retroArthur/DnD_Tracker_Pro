// [SECTION:KEYBOARD_GROUP]
// ============================================================
// GRUPPENMECHANIK — EIN HALT JE GRUPPE, PFEILTASTEN DARIN
// @tabindex @role @keyboard @aria
// ============================================================
//
// WAS HIER PASSIERT, IN EINEM SATZ: eine Reihe gleichartiger Bedienstellen
// verbraucht genau EINEN Tabulatorhalt; innerhalb der Reihe fuehren die
// Pfeiltasten, Pos1 und Ende von Glied zu Glied (wandernder Tabindex).
//
// WARUM ES DAS BRAUCHT — Nutzerentscheidung E-2, wortwoertlich "ein Halt je
// Gruppe, Pfeiltasten darin". Sie war im Kampfpaket (E-1) beantwortet und
// nicht umgesetzt; zwei Stellen im Baum fuehrten sie ehrlich als Restschuld.
// Das Kampfpaket hat rund 430 Stellen fokussierbar gemacht und damit eine
// Schuld beglichen und eine neue aufgemacht. Gemessen am gebauten Buendel,
// gefuellte Kampagne, 1440 px, VERKNUEPFTE Spielerkaempfer, echte
// Tastendruecke, je Lauf ein frischer Seitenaufbau (Ausgangslage b8a1a5c):
//
//                              6 Kaempfer      20 Kaempfer
//   Zauberplatz-Punkte              42             140
//   davon mit tabindex="0"          42             140
//   Anschlaege bis `.qref-fab`     142             366
//   bei 400 ms je Anschlag        57 s           146 s
//
// 366 Anschlaege fuer die Schnell-Referenz, in der Ansicht, in der der
// Spielleiter vor sechs wartenden Spielern sitzt. Die Flut ist also keine
// Vorsorge fuer eine kuenftige Nachruestung der Vorbereitungsansichten —
// sie ist schon da, und diese Datei korrigiert E-1, nicht nur Phase 2.
//
// UND SIE IST DIE GEGENRECHNUNG ZUR HALTREDUKTION. Ein Halt je Gruppe
// heisst NICHT, dass sechs von sieben Punkten unbedienbar werden; sie
// wechseln das Zugangsmittel. Fall (10) in
// `tests/e2e/features/tastatur-gruppen.spec.js` ist die Bedingung, unter
// der die Reduktion ueberhaupt erlaubt ist: alle sieben Glieder bekommen
// mit Tabulator + Pfeilen den Fokus.
//
// WAS DIESE DATEI NICHT TUT:
//   — Sie baut KEINE Ausloesung nach. Enter und die Leertaste bleiben beim
//     `keydown`-Zweig in `ui/event-delegation.js` (T-B). Diese Datei
//     bedient ausschliesslich die Tasten in `GRUPPEN_TASTEN`, und
//     `preventDefault()` faellt nur auf diese — Oben/Unten auf einer
//     waagerechten Leiste gehoeren weiter dem Browser (Seitenlauf), und
//     ausserhalb jeder Gruppe wird keine Taste angefasst.
//   — Sie macht nichts fokussierbar, was die Kehrschleife
//     (`ui/keyboard-reach.js`) nicht schon fokussierbar gemacht haette.
//     Sie verteilt den vorhandenen Halt nur anders.
//   — Sie fuehrt KEINEN Umlauf am Rand. Begruendung bei `_naechstesGlied()`.
//
// WARUM DIE GRUPPEN DEKLARIERT SIND UND NICHT ERRATEN. Eine Heuristik
// ("gleiche `data-action`, gemeinsamer Elternknoten") haette zwei Dinge
// zusammengeworfen, die am Spieltisch nichts miteinander zu tun haben, und
// sie waere an den gemessenen Hindernissen gescheitert: der Behaelter der
// 40 Auftrags-Statusmarken hat weder Klasse noch id
// (`features/quests/quests-render.js:97` schreibt ein `div` mit reinem
// Inline-Stil), und der Behaelter der Bestiarienzeilen ist der
// klassenlose `visibleContainer`, den `ui/virtual-scroll.js:64` zur
// Laufzeit erzeugt. Eine Liste, die man lesen kann, ist einer Regel
// vorzuziehen, die man nachrechnen muss. Neue Gruppen kommen ueber
// `KeyboardGroup.registriere()` oder in `GRUPPEN_ARTEN` dazu.

/**
 * Die Tasten, die diese Datei bedient — und NUR diese. Jede andere Taste
 * laeuft unberuehrt durch, auch auf einem Gruppenglied.
 */
const GRUPPEN_TASTEN = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

/**
 * DIE GRUPPENARTEN. Je Eintrag:
 *
 *   name          Kennung fuer Diagnose und Haltgedaechtnis.
 *   behaelter     Selektor des GEMEINSAMEN Behaelters. Er bestimmt, was
 *                 eine Gruppe ist.
 *   glied         Selektor der Glieder INNERHALB des Behaelters.
 *   achse         'horizontal' -> Links/Rechts, 'vertical' -> Oben/Unten.
 *                 Gemessen, nicht gefuehlt (Begruendung je Eintrag).
 *   beschriftung  Name der Leiste fuers Vorleseprogramm. Funktion, damit
 *                 eine Art mit zwei Bedeutungen (Erfolge/Fehlschlaege)
 *                 beide richtig benennen kann.
 *
 * WARUM `role="toolbar"` UND NICHT `listbox`/`option` — der Ausschluss ist
 * die Begruendung:
 *   — `listbox` waere eine LUEGE gegenueber dem Vorleseprogramm. Die
 *     Punkte sind unabhaengige Schalter; es gibt kein "eines von N
 *     gewaehlt". Eine `listbox` verlangt `aria-selected` je `option` bzw.
 *     `aria-activedescendant` am Behaelter — beides behauptet eine
 *     Auswahl, die es nicht gibt. Fall (7) der Pruefdatei prueft
 *     ausdruecklich, dass KEINES der beiden Attribute auftaucht.
 *   — `role="group"` waere nicht falsch, aber stumm: `group` sagt nichts
 *     ueber die Tastatur. `toolbar` IST das ARIA-Muster "ein Halt,
 *     Pfeiltasten darin" — die Rolle benennt genau das hier gebaute
 *     Verhalten, und `aria-orientation` traegt die gemessene Achse. Eine
 *     waagerechte Leiste, die auf Oben/Unten hoert, waere derselbe
 *     Widerspruch in der anderen Richtung.
 *   — Die Glieder behalten `role="button"`. Sie sind Schalter, und die
 *     Kehrschleife setzt dieselbe Rolle; hier wird sie nur nachgetragen,
 *     falls diese Datei zuerst dran war.
 */
const GRUPPEN_ARTEN = [
    {
        // ZAUBERPLAETZE EINER KAMPFZEILE — E-2s Urziel.
        //
        // DER BEHAELTER IST `.init-spell-slots`, NICHT `.init-slot-boxes`.
        // Gemessen: die sieben Punkte einer Kampfzeile (vier Plaetze Grad 1,
        // drei Grad 2) liegen auf EINER y-Linie — dx 101 px, dy 0 px, alle
        // sieben bei y=506 (x 1012/1026/1040/1054 | 1085/1099/1113). Und das
        // gilt ueber die ganze Media-Query-Leiter: bei 1440, 900, 680 UND
        // 375 px bleibt es eine Zeile (`zeilen: 1`, `dy: 0`). Die
        // Rang-Grenze ist also eine Beschriftungs-, keine Zeilengrenze; die
        // Pfeiltastenfahrt laeuft ueber sie hinweg.
        //
        // Die Alternative `.init-slot-boxes` (ein Halt je RANG) waere
        // messbar schlechter: bei 20 Zauberwirkern 40 Halte statt 20.
        name: 'zauberplaetze',
        behaelter: '.init-spell-slots',
        glied: '.init-slot-box',
        achse: 'horizontal',
        beschriftung: () => 'Zauberplätze'
    },
    {
        // TODESWUERFE — zwei Gruppen je Sterbendem, nicht eine.
        //
        // Geometrisch waeren auch die sechs Punkte EINE Zeile (dx 142,
        // dy 0, alle bei y=527). Sie sind es trotzdem nicht: Erfolge und
        // Fehlschlaege sind GEGENTEILIGE Ausgaenge mit je eigener
        // Beschriftung (✓ / ✗) in je eigenem Behaelter. Vier Plaetze Grad 1
        // und drei Grad 2 sind dagegen dasselbe Ding in zwei Staerken. Wo
        // die Geometrie beide Lesarten zulaesst, folgt die Gruppe der
        // Bedeutung.
        //
        // Je Reihe drei Punkte, dx 40 px, dy 0 px — waagerecht.
        name: 'todeswuerfe',
        behaelter: '.death-saves-dots',
        glied: '.death-save-dot',
        achse: 'horizontal',
        beschriftung: glieder =>
            glieder[0] && glieder[0].getAttribute('data-type') === 'failure'
                ? 'Todeswürfe: Fehlschläge'
                : 'Todeswürfe: Erfolge'
    }
];

const KeyboardGroup = {
    /** Die aktiven Gruppenarten. Veraenderbar ueber `registriere()`. */
    _arten: GRUPPEN_ARTEN.slice(),

    _beobachter: null,
    _geplant: false,

    /**
     * DAS HALTGEDAECHTNIS: Gruppenschluessel -> Index des Glieds, das den
     * Halt traegt.
     *
     * WOZU EIN GEDAECHTNIS? Weil der Auftrag lautet, dass "das zuletzt
     * besuchte Glied den Halt behaelt, damit `Tab` wieder dort einsteigt,
     * wo man war" — und weil jede Renderfunktion, die `innerHTML` ersetzt,
     * die Glieder gegen FRISCHE Knoten austauscht. Ohne Gedaechtnis faellt
     * der Spielleiter nach jeder einzelnen Bedienung an den Anfang der
     * Reihe zurueck: `toggleInitSlot()` (features/initiative.js:227) ruft
     * `renderInit()`, und damit ist die ganze Kampfliste neu.
     *
     * EIN `Map` MIT ZEICHENKETTEN, KEIN `WeakMap` AUF KNOTEN: der Knoten
     * ist genau das, was verloren geht. Der Schluessel haengt darum an den
     * DATEN (`data-id`, `data-type`), nicht am Knoten — siehe
     * `_schluessel()`.
     */
    _stand: new Map(),

    /**
     * Der ANSPRUCH AUF RUECKKEHR: `{ knoten, schluessel, index }` des
     * Glieds, das zuletzt den Fokus hatte — oder `null`.
     *
     * WARUM DIESER ANSPRUCH SEIN MUSS. Gemessen im ausgelieferten Zustand:
     * nach der Leertaste auf einem Punkt ist der fokussierte Knoten NICHT
     * mehr im Baum (`document.contains(...) === false`) und
     * `document.activeElement` ist `BODY`. Ohne Rueckgabe des Fokus bricht
     * die Pfeiltastenfahrt bei der ERSTEN Bedienung ab — die Gruppe waere
     * eine Mechanik fuer genau einen Anschlag.
     *
     * WARUM DIE UNTERSCHEIDUNG SO SCHWIERIG IST, und wie sie trotzdem
     * geht. "Der Knoten wurde unter dem Fokus weggezeichnet" und "der
     * Spielleiter hat auf eine leere Flaeche geklickt" sehen im
     * Ereignisstrom IDENTISCH aus. Gemessen, drei Laeufe, Lauscher in der
     * Capture-Phase:
     *
     *   Leertaste -> Neuzeichnen   blur, focusout | relatedTarget null | isConnected TRUE
     *   renderInit() ohne Taste    blur, focusout | relatedTarget null | isConnected TRUE
     *   Klick auf leere Flaeche    blur, focusout | relatedTarget null | isConnected TRUE
     *
     * Zum Zeitpunkt des `focusout` ist der Knoten in ALLEN drei Faellen
     * noch verbunden; das Ereignis taugt also nicht zur Unterscheidung.
     * EINEN MIKROTASK SPAETER taugt es: das Ersetzen per `innerHTML`
     * laeuft synchron in derselben Aufgabe, der Knoten ist dann
     * abgetrennt — beim Klick auf die leere Flaeche bleibt er fuer immer
     * verbunden. Genau diese Pruefung steht in `_fokusMitschrift()`, und
     * sie ist der Grund, warum der Anspruch dort verfaellt statt im
     * `focusout` selbst.
     */
    _rueckkehr: null,

    /** Zahl der Durchlaeufe. Nur Diagnose — kein Verhalten haengt daran. */
    _laeufe: 0,
    /** Zahl der im letzten Durchlauf geregelten Gruppen. */
    _gruppen: 0,

    /**
     * Haengt die Mechanik ein. Idempotent: ein zweiter Aufruf tut nichts,
     * damit kein zweiter Beobachter und kein zweiter Lauscher entsteht.
     */
    init() {
        if (this._beobachter) return;
        if (!document.body) {
            // Kommt im Buendel nicht vor (das Skript steht am Ende des
            // Koerpers), aber in loader-Reihenfolgen und Tests schon.
            document.addEventListener('DOMContentLoaded', () => this.init(), { once: true });
            return;
        }

        this.aktualisieren();
        this._fokusMitschrift();

        // Capture und ausdruecklich NICHT passive — `_tasten()` ruft
        // `preventDefault()`. Capture, damit die Entscheidung VOR dem
        // globalen Einzeltasten-Lauscher fallen kann; der hat heute keinen
        // Pfeiltasten-Zweig (nachgezaehlt: Pfeiltasten sind im Quellbaum
        // nur in zwei eigenen Aufklappmenues belegt,
        // `features/command-palette/command-palette.js:137,141` und
        // `features/wiki/wiki-crud.js:422,429`), aber die Reihenfolge soll
        // nicht von dieser Lage abhaengen.
        document.addEventListener('keydown', e => this._tasten(e), { capture: true });

        // NUR `childList`, ausdruecklich NICHT `attributes` — dieselbe
        // Begruendung wie in `ui/keyboard-reach.js`: mit `attributes: true`
        // weckt jedes `setAttribute()` dieses Durchlaufs den Beobachter
        // erneut. Ein `innerHTML`-Ersatz, der die Attribute loescht (der
        // Pfad, der hier zaehlt), ist immer auch eine `childList`-Aenderung.
        this._beobachter = new MutationObserver(() => this._planen());
        this._beobachter.observe(document.body, { childList: true, subtree: true });

        if (typeof window.registerPostSaveHook === 'function') {
            window.registerPostSaveHook(() => this._planen());
        }
        if (typeof window.registerUndoHook === 'function') {
            window.registerUndoHook(() => this._planen());
        }

        log(`[KeyboardGroup] Gruppenmechanik aktiv (${this._arten.length} Gruppenarten)`);
    },

    /**
     * Nimmt eine weitere Gruppenart auf — der Weg, auf dem die
     * Vorbereitungsansichten dazukommen, ohne diese Datei zu veraendern.
     * @param {{name: string, behaelter: string, glied: string,
     *          achse: 'horizontal'|'vertical',
     *          beschriftung?: (glieder: Element[]) => string}} art
     * @returns {boolean} Wahr, wenn die Art aufgenommen wurde
     */
    registriere(art) {
        if (!art || !art.name || !art.behaelter || !art.glied) return false;
        if (art.achse !== 'horizontal' && art.achse !== 'vertical') return false;
        if (this._arten.some(a => a.name === art.name)) return false;
        this._arten.push(art);
        this._planen();
        return true;
    },

    /**
     * Schreibt mit, welches Glied den Fokus hat — und laesst den Anspruch
     * auf Rueckkehr verfallen, sobald klar ist, dass der Spielleiter selbst
     * gegangen ist.
     *
     * DIE PRUEFUNG IM MIKROTASK ist die eine Stelle, an der das
     * Naheliegende nicht funktioniert; die Messung dazu steht bei
     * `_rueckkehr`. Kurz: im `focusout` ist der Knoten in allen Faellen
     * noch verbunden, einen Mikrotask spaeter nur noch im Fall "der Nutzer
     * ist gegangen". Alles in der Capture-Phase und `passive`: diese
     * Mitschrift entscheidet nichts und darf nichts aufhalten.
     */
    _fokusMitschrift() {
        document.addEventListener(
            'focusin',
            ev => {
                const treffer = this._gruppeVon(/** @type {Element} */ (ev.target));
                if (!treffer) {
                    // Der Fokus hat die Gruppen verlassen — ab hier gibt es
                    // nichts zurueckzuholen.
                    this._rueckkehr = null;
                    return;
                }
                // Der Fokus fuehrt den Halt. Auch dann, wenn er per Maus
                // hierher kam: `Tab` soll danach dort weitergehen, wo die
                // Hand zuletzt war.
                this._setzeHalt(treffer.behaelter, treffer.art, treffer.glieder, treffer.index);
                this._rueckkehr = {
                    knoten: ev.target,
                    schluessel: this._schluessel(treffer.art, treffer.glieder, treffer.behaelter),
                    index: treffer.index
                };
            },
            { capture: true, passive: true }
        );

        document.addEventListener(
            'focusout',
            ev => {
                const anspruch = this._rueckkehr;
                if (!anspruch || anspruch.knoten !== ev.target) return;
                const knoten = anspruch.knoten;
                Promise.resolve().then(() => {
                    // Noch verbunden = der Spielleiter ist gegangen (Klick
                    // auf eine leere Flaeche). Abgetrennt = unter dem Fokus
                    // weggezeichnet; dann bleibt der Anspruch, und
                    // `aktualisieren()` holt den Fokus zurueck.
                    if (knoten.isConnected && this._rueckkehr === anspruch) {
                        this._rueckkehr = null;
                    }
                });
            },
            { capture: true, passive: true }
        );
    },

    /**
     * Plant einen Durchlauf fuer das naechste Bild ein. Entprellt: viele
     * Mutationen eines Renderlaufs ergeben EINEN Durchlauf. `rAF` statt
     * `setTimeout` aus demselben Grund wie in der Kehrschleife — ein
     * verstecktes Dokument, in dem rAF ruht, kann keinen Fokus bekommen.
     */
    _planen() {
        if (this._geplant) return;
        this._geplant = true;
        const lauf = () => {
            this._geplant = false;
            this.aktualisieren();
        };
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(lauf);
        else setTimeout(lauf, 16);
    },

    /**
     * Ein Durchlauf: jede Gruppe im Dokument bekommt genau einen Halt, die
     * Rolle und ihre Beschriftung; danach wird ein offener Anspruch auf
     * Rueckkehr eingeloest.
     * @returns {number} Zahl der geregelten Gruppen
     */
    aktualisieren() {
        let n = 0;
        try {
            // ERST DIE KEHRSCHLEIFE, DANN WIR — und zwar ausdruecklich von
            // hier aus angestossen, nicht ueber die Reihenfolge der
            // rAF-Rueckrufe gehofft. Grund: `ROHAUSWAHL` dort ist
            // `[data-action]:not([tabindex])`. Wer zuerst ein `tabindex`
            // setzt, nimmt der Kehrschleife das Element dauerhaft aus der
            // Auswahl — und damit aus ihrem `_versorgt`-Verzeichnis, an dem
            // `nurMausfokus()` haengt. Ohne diesen Aufruf verliert ein
            // angeklicktes Gruppenglied die Zusage "nach einem Mausklick
            // gehoert die Leertaste weiter dem Zug" (T-C, Runde 1). Der
            // Aufruf ist idempotent und kostet in einer unveraenderten
            // Ansicht nichts: die Auswahl liefert dann null Knoten.
            if (window.KeyboardReach && typeof window.KeyboardReach.aktualisieren === 'function') {
                window.KeyboardReach.aktualisieren();
            }

            for (const art of this._arten) {
                for (const behaelter of document.querySelectorAll(art.behaelter)) {
                    const glieder = this._glieder(behaelter, art);
                    if (!glieder.length) continue;
                    this._regleGruppe(behaelter, art, glieder);
                    n++;
                }
            }

            this._holeFokusZurueck();
        } catch (e) {
            // Ein Fehler hier darf die App nicht anhalten: der Durchlauf
            // laeuft im Beobachter und im Post-Save-Haken, also auf Pfaden,
            // die beide weiterlaufen muessen.
            if (typeof ErrorHandler !== 'undefined') {
                ErrorHandler.log('KeyboardGroup', e, 'Gruppendurchlauf abgebrochen');
            }
        }
        this._laeufe++;
        this._gruppen = n;
        return n;
    },

    /**
     * Setzt Rolle, Beschriftung und den EINEN Halt einer Gruppe.
     * @param {Element} behaelter
     * @param {Record<string, any>} art
     * @param {Element[]} glieder
     */
    _regleGruppe(behaelter, art, glieder) {
        if (behaelter.getAttribute('role') !== 'toolbar') {
            behaelter.setAttribute('role', 'toolbar');
        }
        if (behaelter.getAttribute('aria-orientation') !== art.achse) {
            behaelter.setAttribute('aria-orientation', art.achse);
        }
        if (!behaelter.hasAttribute('aria-label')) {
            const name = art.beschriftung ? art.beschriftung(glieder) : art.name;
            if (name) behaelter.setAttribute('aria-label', name);
        }

        const schluessel = this._schluessel(art, glieder, behaelter);
        let ziel = this._stand.has(schluessel) ? Number(this._stand.get(schluessel)) : 0;
        if (!(ziel >= 0) || ziel >= glieder.length) ziel = 0;

        // DER HALT SOLL AUF EINEM BEDIENBAREN GLIED LIEGEN — sonst
        // tabuliert der Spielleiter auf etwas Unsichtbares. Die Pruefung
        // kostet EINEN Aufruf je Gruppe im Normalfall: erst wird der
        // Behaelter gefragt (liegt er in einer ausgeblendeten Ansicht, ist
        // keines seiner Glieder bedienbar und die Suche unterbleibt), dann
        // nur das Zielglied. Die Schleife ueber alle Glieder laeuft nur,
        // wenn gerade das Zielglied ausgefallen ist — der Fall, den die
        // Filterleisten der Vorbereitungsansichten mitbringen, in denen
        // teils nur EINE Marke sichtbar ist.
        if (this._bedienbar(behaelter) && !this._bedienbar(glieder[ziel])) {
            const ersatz = glieder.findIndex(g => this._bedienbar(g));
            if (ersatz >= 0) ziel = ersatz;
        }

        for (let i = 0; i < glieder.length; i++) {
            const soll = i === ziel ? '0' : '-1';
            if (glieder[i].getAttribute('tabindex') !== soll) {
                glieder[i].setAttribute('tabindex', soll);
            }
            // Nachtrag, falls diese Datei vor der Kehrschleife dran war
            // oder die Gruppe ausserhalb ihres Umfangs liegt. Marken
            // bleiben Marken — dieselbe Ausnahme wie dort (O-6).
            if (glieder[i].tagName !== 'LABEL' && !glieder[i].hasAttribute('role')) {
                glieder[i].setAttribute('role', 'button');
            }
        }
        this._stand.set(schluessel, ziel);
    },

    /**
     * Holt den Fokus in die Gruppe zurueck, aus der er durch ein
     * Neuzeichnen gefallen ist.
     *
     * DREI BEDINGUNGEN, UND JEDE TRAEGT:
     *  — ein offener Anspruch, dessen Knoten NICHT mehr im Dokument ist:
     *    nur das ist der gemessene Schaden. Steht der Knoten noch, ist
     *    nichts verloren gegangen.
     *  — `activeElement` auf `<body>`/`<html>`: damit sind die Faelle
     *    ausgenommen, in denen eine Renderfunktion oder ein Dialog den
     *    Fokus BEWUSST selbst woanders hinsetzt. Dort wird nichts
     *    ueberschrieben. Dieselbe Schranke wie in
     *    `ModalFocus._nachfassen()`.
     *  — die Gruppe ist BEDIENBAR: nach einem Ansichtswechsel liegt die
     *    alte Gruppe in einer ausgeblendeten Ansicht. Ohne diese Bedingung
     *    zoege ein Wechsel von der Initiative zum Armaturenbrett den Fokus
     *    in eine unsichtbare Punktreihe zurueck.
     */
    _holeFokusZurueck() {
        const anspruch = this._rueckkehr;
        if (!anspruch || !anspruch.knoten) return;
        if (anspruch.knoten.isConnected) return;
        const a = document.activeElement;
        if (a !== document.body && a !== document.documentElement) return;

        for (const art of this._arten) {
            for (const behaelter of document.querySelectorAll(art.behaelter)) {
                const glieder = this._glieder(behaelter, art);
                if (!glieder.length) continue;
                if (this._schluessel(art, glieder, behaelter) !== anspruch.schluessel) continue;
                if (!this._bedienbar(behaelter)) return;
                const i = Math.min(anspruch.index, glieder.length - 1);
                const ziel = glieder[i];
                if (ziel && this._bedienbar(ziel)) {
                    // Der `focusin`-Lauscher setzt danach Halt und Anspruch
                    // auf den frischen Knoten; hier wird nichts von Hand
                    // nachgezogen.
                    ziel.focus();
                }
                return;
            }
        }
    },

    /**
     * Der Tastenlauscher. Bedient ausschliesslich die Tasten der eigenen
     * Achse plus Pos1/Ende, und nur auf einem Gruppenglied.
     * @param {KeyboardEvent} e
     */
    _tasten(e) {
        if (!GRUPPEN_TASTEN.has(e.key)) return;
        // Jede Zusatztaste bleibt beim Browser. Strg+Pos1 ist "an den
        // Anfang des Dokuments", Alt+Links ist "zurueck" — das sind keine
        // Bedienungen der Leiste.
        if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

        const quelle = /** @type {Element} */ (e.target);
        if (!quelle || typeof quelle.closest !== 'function') return;

        const treffer = this._gruppeVon(quelle);
        if (!treffer) return;
        const { art, behaelter, glieder, index } = treffer;

        // Die Achse entscheidet, WELCHE Pfeiltasten uns gehoeren. Die
        // beiden quer dazu laufen unberuehrt durch — auf einer
        // waagerechten Leiste ist Oben/Unten der Seitenlauf des Browsers,
        // und den wegzunehmen waere ein Verlust ohne Gewinn.
        const vor = art.achse === 'vertical' ? 'ArrowDown' : 'ArrowRight';
        const zurueck = art.achse === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

        let ziel;
        if (e.key === vor) ziel = this._naechstesGlied(glieder, index, 1);
        else if (e.key === zurueck) ziel = this._naechstesGlied(glieder, index, -1);
        else if (e.key === 'Home') ziel = this._naechstesGlied(glieder, -1, 1);
        else if (e.key === 'End') ziel = this._naechstesGlied(glieder, glieder.length, -1);
        else return; // Pfeiltaste quer zur Achse: nicht unsere.

        // `preventDefault()` auch am Rand, wo sich nichts bewegt: die Taste
        // IST bedient worden, die Antwort lautet nur "hier ist Schluss".
        // Ohne das wuerde am letzten Glied einer Leiste die Seite seitwaerts
        // rollen — eine Bewegung, die der Spielleiter als Fehler liest.
        //
        // UND AUSDRUECKLICH KEIN `stopPropagation()`. Der Verteiler in
        // `ui/event-delegation.js` tut das bei Enter und der Leertaste aus
        // einem gemessenen Grund: beide treffen dort auf den globalen
        // Einzeltasten-Lauscher. Fuer die Tasten HIER gibt es diesen Grund
        // nicht — nachgezaehlt in
        // `systems/spellslots/keyboard-shortcuts.js`: dort steht kein
        // einziger Zweig auf einer Pfeiltaste, auf `Home` oder auf `End`
        // (die Einzeltasten sind `Escape ? / t n N p h r l k` plus die
        // Strg-Kuerzel, dazu `Delete`/`Backspace` in der Netzansicht).
        // `preventDefault()` sagt vollstaendig, was gesagt werden muss:
        // die Vorgabe des Browsers ist erledigt. Die Weiterleitung zu
        // kappen waere eine zweite, staerkere Behauptung ohne Anlass — und
        // sie wuerde jeden kuenftigen, berechtigten Lauscher blind machen.
        e.preventDefault();
        if (ziel < 0) return;

        this._setzeHalt(behaelter, art, glieder, ziel);
        glieder[ziel].focus();
    },

    /**
     * Das naechste bedienbare Glied in Richtung `richtung` — oder -1.
     *
     * KEIN UMLAUF AM RAND, und das ist eine Entscheidung, nicht eine
     * Auslassung: ein stiller Umlauf macht die Frage "bin ich am Ende der
     * Reihe?" unbeantwortbar. Wer am letzten Zauberplatz noch einmal nach
     * rechts drueckt, soll merken, dass dort Schluss ist — nicht
     * unbemerkt beim ersten Platz wieder anfangen und den naechsten
     * Anschlag auf den falschen Punkt setzen. Pos1 und Ende sind der
     * schnelle Weg an die Raender.
     *
     * UNBEDIENBARE GLIEDER WERDEN UEBERSPRUNGEN, nicht gezaehlt. Das ist
     * fuer die beiden Punktreihen folgenlos (alle Glieder sind immer da),
     * aber nicht fuer die Filterleisten der Vorbereitungsansichten:
     * gemessen traegt die Begegnungs-Leiste 20 Zeilen und nur EINE
     * sichtbare Marke. Eine Fahrt, die auf einer unsichtbaren Marke
     * haengen bliebe, waere eine Sackgasse ohne Fokusring.
     * @param {Element[]} glieder
     * @param {number} von Startindex (darf ausserhalb liegen)
     * @param {1|-1} richtung
     * @returns {number}
     */
    _naechstesGlied(glieder, von, richtung) {
        for (let i = von + richtung; i >= 0 && i < glieder.length; i += richtung) {
            if (this._bedienbar(glieder[i])) return i;
        }
        return -1;
    },

    /**
     * Verschiebt den Halt innerhalb einer Gruppe auf `ziel`.
     * @param {Element} behaelter
     * @param {Record<string, any>} art
     * @param {Element[]} glieder
     * @param {number} ziel
     */
    _setzeHalt(behaelter, art, glieder, ziel) {
        for (let i = 0; i < glieder.length; i++) {
            const soll = i === ziel ? '0' : '-1';
            if (glieder[i].getAttribute('tabindex') !== soll) {
                glieder[i].setAttribute('tabindex', soll);
            }
        }
        this._stand.set(this._schluessel(art, glieder, behaelter), ziel);
    },

    /**
     * Zu welcher Gruppe gehoert `el`? `null`, wenn zu keiner.
     * @param {Element|null} el
     * @returns {{art: Record<string, any>, behaelter: Element,
     *            glieder: Element[], index: number}|null}
     */
    _gruppeVon(el) {
        if (!el || typeof el.matches !== 'function') return null;
        for (const art of this._arten) {
            if (!el.matches(art.glied)) continue;
            const behaelter = el.closest(art.behaelter);
            if (!behaelter) continue;
            const glieder = this._glieder(behaelter, art);
            const index = glieder.indexOf(el);
            if (index < 0) continue;
            return { art, behaelter, glieder, index };
        }
        return null;
    },

    /**
     * Die Glieder einer Gruppe, in DOM-Reihenfolge.
     * @param {Element} behaelter
     * @param {Record<string, any>} art
     * @returns {Element[]}
     */
    _glieder(behaelter, art) {
        return Array.from(behaelter.querySelectorAll(art.glied));
    },

    /**
     * Der Schluessel einer Gruppe fuer das Haltgedaechtnis.
     *
     * ER HAENGT AN DEN DATEN, NICHT AM KNOTEN — der Knoten ist genau das,
     * was ein `innerHTML`-Ersatz wegnimmt. `data-id` (Charakter bzw.
     * Kaempfer) und `data-type` (Erfolg/Fehlschlag) stehen an jedem Glied
     * und ueberleben das Neuzeichnen unveraendert.
     *
     * Der Rueckfall auf den Index unter den Behaeltern derselben Art ist
     * fuer Gruppen gedacht, deren Glieder kein Datenmerkmal tragen. Er ist
     * schwaecher (eine eingeschobene Zeile verschiebt ihn), aber besser als
     * ein Schluessel, der alle Gruppen einer Art zusammenwirft.
     * @param {Record<string, any>} art
     * @param {Element[]} glieder
     * @param {Element} behaelter
     * @returns {string}
     */
    _schluessel(art, glieder, behaelter) {
        const g = glieder[0];
        const id = (g && g.getAttribute('data-id')) || '';
        const typ = (g && g.getAttribute('data-type')) || '';
        if (id || typ) return `${art.name}|${id}|${typ}`;
        const alle = Array.from(document.querySelectorAll(art.behaelter));
        return `${art.name}|#${alle.indexOf(behaelter)}`;
    },

    /**
     * Kann `el` den Fokus hier und jetzt sinnvoll annehmen?
     *
     * `checkVisibility` deckt `display`, `visibility`, `opacity` und
     * `content-visibility` in einem Aufruf ab; der Rueckfall auf das
     * Rechteck ist fuer Umgebungen ohne die Methode (jsdom).
     * @param {Element} el
     * @returns {boolean}
     */
    _bedienbar(el) {
        if (!el) return false;
        if (el.hasAttribute('disabled')) return false;
        if (el.getAttribute('aria-hidden') === 'true') return false;
        if (typeof el.checkVisibility === 'function') {
            return el.checkVisibility({
                opacityProperty: true,
                visibilityProperty: true,
                contentVisibilityAuto: true
            });
        }
        const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
        return !!r && r.width > 0 && r.height > 0;
    },

    /**
     * Diagnose fuer die Konsole und fuer Messungen.
     * @returns {{ aktiv: boolean, arten: number, laeufe: number,
     *             gruppen: number, gemerkt: number, offen: number }}
     */
    statistik() {
        let offen = 0;
        for (const art of this._arten) {
            for (const behaelter of document.querySelectorAll(art.behaelter)) {
                const glieder = this._glieder(behaelter, art);
                if (!glieder.length) continue;
                const halte = glieder.filter(g => g.getAttribute('tabindex') === '0').length;
                if (halte !== 1) offen++;
            }
        }
        return {
            aktiv: !!this._beobachter,
            arten: this._arten.length,
            laeufe: this._laeufe,
            gruppen: this._gruppen,
            gemerkt: this._stand.size,
            // `offen` ist die Zahl der Gruppen, die NICHT genau einen Halt
            // tragen. Im geregelten Zustand ist sie 0.
            offen
        };
    }
};

window.KeyboardGroup = KeyboardGroup;

// Selbstaufruf statt eines Eintrags in `core/init.js`: die Mechanik haengt
// an nichts aus dem Datenbestand und soll greifen, sobald eine Vorlage im
// Dokument steht — auch wenn eine spaetere init-Stufe scheitert. Dasselbe
// Muster wie `ui/keyboard-reach.js` und `ui/modal-focus.js`.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KeyboardGroup.init(), { once: true });
} else {
    KeyboardGroup.init();
}
