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
 *                 Gemessen, nicht gefuehlt (Begruendung je Eintrag). DARF
 *                 EINE FUNKTION SEIN, `(glieder) => 'horizontal'|'vertical'`,
 *                 fuer Reihen, deren Gestalt an der Fensterbreite haengt —
 *                 Begruendung bei `_achse()`.
 *   beschriftung  Name der Leiste fuers Vorleseprogramm. Funktion, damit
 *                 eine Art mit zwei Bedeutungen (Erfolge/Fehlschlaege)
 *                 beide richtig benennen kann.
 *   zustand       OPTIONAL, `{ attribut, wert: (glied) => string|null }`:
 *                 das EINE ARIA-Attribut, das den Zustand des Glieds
 *                 traegt. Begruendung bei `_zustand()`.
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
     *
     * DER SCHLUESSEL HAENGT AM BEHAELTER, NICHT MEHR AM ERSTEN GLIED
     * (nachgetragen in E-2, Runde 3 — Befunde 8/9/12 der Gegenpruefung).
     * Die erste Fassung bildete ihn aus `glieder[0]`, und das war an zwei
     * Stellen falsch: in `div#bestiary-list` ist `glieder[0]` die erste
     * Zeile des GEZEICHNETEN FENSTERS, also nach jeder Rollstellung ein
     * anderes Monster — gemessen wuchs `_stand` dort von 55 auf 131
     * Eintraege in 40 Radstufen, und der Halt fand seine Gruppe nach dem
     * Rollen nicht mehr. Und nach einem Datentausch (Import,
     * Kampagnenwechsel) lautete der Schluessel von `#npc-list`
     * `nscZeilen|100|` statt `nscZeilen|1|`, weshalb `_holeFokusZurueck()`
     * keine Gruppe fand und der Fokus auf `BODY` liegen blieb. Siehe
     * `_schluessel()`.
     *
     * DER WERT IST `{ index, kennung }`, nicht mehr eine nackte Zahl: die
     * `kennung` (`data-id|data-value` des Glieds, nur wenn sie eindeutig
     * ist) findet NACH einem Neuzeichnen dasselbe Glied wieder, auch wenn
     * es seinen Platz gewechselt hat. Der Index bleibt als Rueckfall, fuer
     * Glieder ohne Datenmerkmal und fuer das virtuelle Fenster, in dem das
     * gemerkte Glied gar nicht mehr gezeichnet ist.
     */
    _stand: new Map(),

    /**
     * Die Behaelter, deren `aria-label` DIESE Datei geschrieben hat. Nur
     * die darf sie beim Aufraeumen wieder entfernen — ein Label aus dem
     * Markup (die Auftragsleiste traegt eines mit dem Auftragsnamen) bleibt
     * stehen. `WeakSet`, damit ein weggezeichneter Behaelter nichts
     * festhaelt.
     */
    _eigeneLabel: new WeakSet(),

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

        // DIE FENSTERBREITE IST EINE EINGABE DER MECHANIK, seit eine Achse
        // gemessen sein darf (`_achse()`): das Zaubergitter steht bei
        // 1440 px in drei Spalten (dx 406, dy 0) und bei 390 px in einer
        // (dx 0, dy 100). Ohne diesen Lauscher traegt es nach einer
        // Drehung des Geraets eine `aria-orientation`, die der Gestalt
        // widerspricht — bis zum naechsten Neuzeichnen. `_planen()` ist
        // rAF-entprellt; ein Zugsturm von Groessenaenderungen ergibt also
        // einen Durchlauf je Bild (gemessen 0,5-0,8 ms).
        window.addEventListener('resize', () => this._planen(), { passive: true });

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
     *          achse: 'horizontal'|'vertical'|((glieder: Element[]) => string),
     *          beschriftung?: (glieder: Element[]) => string,
     *          zustand?: {attribut: string, wert: (glied: Element) => string|null}}} art
     * @returns {boolean} Wahr, wenn die Art aufgenommen wurde
     */
    registriere(art) {
        if (!art || !art.name || !art.behaelter || !art.glied) return false;
        if (
            typeof art.achse !== 'function' &&
            art.achse !== 'horizontal' &&
            art.achse !== 'vertical'
        ) {
            return false;
        }
        if (art.zustand && (!art.zustand.attribut || typeof art.zustand.wert !== 'function')) {
            return false;
        }
        if (this._arten.some(a => a.name === art.name)) return false;
        this._arten.push(art);
        this._planen();
        return true;
    },

    /**
     * Die angemeldeten Arten, als Abschriften ohne Funktionen — fuer
     * Diagnose und fuer Messungen, die ihre Erwartung aus der ANMELDUNG
     * ableiten wollen statt aus einem abgetippten Literal.
     * @returns {{name: string, behaelter: string, glied: string}[]}
     */
    artenListe() {
        return this._arten.map(a => ({ name: a.name, behaelter: a.behaelter, glied: a.glied }));
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

            // ZWEI PHASEN, UND DIE ERSTE SAMMELT NUR. Ein Behaelter mit
            // null Gliedern darf seine Rolle nicht behalten (Befund 7 der
            // Gegenpruefung: nach einer Suche ohne Treffer meldete
            // `div#npc-list` weiter eine Werkzeugleiste
            // "Nichtspielercharaktere" mit null Bedienelementen — eine
            // Falschaussage gegenueber dem Hilfsmittel). Aufgeraeumt wird
            // aber erst, wenn KEINE Art in diesem Behaelter Glieder hat:
            // `div#bestiary-list` fuehrt ZWEI Gruppen, und waere die
            // Favoritenspalte gerade leer, naehme sie der Zeilenspalte
            // sonst in jedem Durchlauf die Rolle wieder weg.
            const geregelt = new Set();
            const leer = [];
            for (const art of this._arten) {
                for (const behaelter of document.querySelectorAll(art.behaelter)) {
                    const glieder = this._glieder(behaelter, art);
                    if (!glieder.length) {
                        leer.push(behaelter);
                        continue;
                    }
                    geregelt.add(behaelter);
                    this._regleGruppe(behaelter, art, glieder);
                    n++;
                }
            }
            for (const behaelter of leer) {
                if (!geregelt.has(behaelter)) this._raeumeGruppe(behaelter);
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
        const achse = this._achse(art, glieder);
        if (behaelter.getAttribute('aria-orientation') !== achse) {
            behaelter.setAttribute('aria-orientation', achse);
        }
        if (!behaelter.hasAttribute('aria-label')) {
            const name = art.beschriftung ? art.beschriftung(glieder) : art.name;
            if (name) {
                behaelter.setAttribute('aria-label', name);
                this._eigeneLabel.add(behaelter);
            }
        }

        const schluessel = this._schluessel(art, glieder, behaelter);
        const merk = this._stand.get(schluessel);
        let ziel = 0;
        if (merk) {
            const gemerkt = this._findeKennung(glieder, merk.kennung);
            ziel = gemerkt >= 0 ? gemerkt : Number(merk.index);
        }
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
            if (art.zustand) this._zustand(glieder[i], art.zustand);
        }
        this._stand.set(schluessel, { index: ziel, kennung: this._haltKennung(glieder, ziel) });
    },

    /**
     * Die Achse einer Gruppe — die Angabe der Art, oder, wenn sie eine
     * Funktion ist, die GEMESSENE.
     *
     * WARUM EINE MESSBARE ACHSE SEIN MUSS. Alle Reihen der Anmeldung
     * behalten ihre feste Achse; genau EINE Gestalt haengt an der
     * Fensterbreite, und zwar das Zaubergitter. Gemessen an denselben 30
     * Karten:
     *
     *     1440 px   dx 406, dy   0, 10 y-Linien   (3 Spalten)
     *      900 px   dx 406, dy   0, 15 y-Linien   (2 Spalten)
     *      390 px   dx   0, dy 100, 30 y-Linien   (1 Spalte)
     *      360 px   dx   0, dy 100, 30 y-Linien   (1 Spalte)
     *
     * Eine feste Achse waere hier auf jeder Breite zur Haelfte eine
     * Falschaussage: `horizontal` behauptet dem Vorleseprogramm auf dem
     * Telefon Marken nebeneinander, wo eine Spalte steht; `vertical`
     * behauptet am Schreibtisch eine Spalte, wo drei Karten nebeneinander
     * liegen. Die Messung sagt auf jeder Breite dasselbe wie das Auge.
     * @param {Record<string, any>} art
     * @param {Element[]} glieder
     * @returns {'horizontal'|'vertical'}
     */
    _achse(art, glieder) {
        if (typeof art.achse !== 'function') return art.achse;
        let gemessen;
        try {
            gemessen = art.achse(glieder);
        } catch {
            gemessen = null;
        }
        return gemessen === 'horizontal' ? 'horizontal' : 'vertical';
    },

    /**
     * Schreibt den EINEN Zustandsträger eines Glieds — oder entfernt ihn,
     * wenn die Art `null` liefert.
     *
     * WARUM DAS HIERHER GEHOERT UND NICHT IN DIE RENDERFUNKTIONEN. Die
     * Gegenpruefung hat es als Befund 5 gemeldet und an den eigenen
     * Party-Punkten den Gegenbeweis gleich mitgeliefert: dort traegt jedes
     * Glied ein `title` ("Grad 1 Slot (verfuegbar)"), der Zustand steht
     * also im Namen. An den Reihen, die E-2 neu bedienbar gemacht hat,
     * stand er nirgends — sechs NSC-Filtermarken klangen alle gleich,
     * obwohl eine davon filterte, und die Auskunft steckte allein in der
     * CSS-Klasse `active`. Dasselbe fuer die ausgewaehlte Listenzeile
     * (`selected`) und fuer offen/zu an Auftrags- und Ladenkoepfen.
     *
     * Die Zustandsklasse steht im Markup; wer das Attribut daneben in 14
     * Renderfunktionen von Hand nachzieht, hat 14 Stellen, an denen es
     * kuenftig vergessen wird. Hier ist es EINE Stelle, und sie laeuft in
     * demselben Durchlauf, der den Tabindex setzt — also auch nach jedem
     * `innerHTML`-Ersatz.
     *
     * WELCHES ATTRIBUT WOFUER, und warum nicht `aria-selected`:
     *   — `aria-pressed` an Filtermarken: sie sind Schalter.
     *   — `aria-current` an Listenzeilen. `aria-selected` waere das
     *     naheliegende Attribut und ist an `role="button"` NICHT erlaubt;
     *     ausserdem prueft Fall (7) in `tastatur-gruppen.spec.js`
     *     ausdruecklich, dass keine Auswahl behauptet wird.
     *   — `aria-expanded` an Aufklappkoepfen.
     * @param {Element} glied
     * @param {{attribut: string, wert: (glied: Element) => string|null}} z
     */
    _zustand(glied, z) {
        let wert;
        try {
            wert = z.wert(glied);
        } catch {
            return;
        }
        if (wert === null || wert === undefined || wert === false) {
            if (glied.hasAttribute(z.attribut)) glied.removeAttribute(z.attribut);
            return;
        }
        const soll = wert === true ? 'true' : String(wert);
        if (glied.getAttribute(z.attribut) !== soll) glied.setAttribute(z.attribut, soll);
    },

    /**
     * Nimmt Rolle, Achse und das SELBST GESETZTE Label von einem Behaelter
     * zurueck, in dem keine Art mehr ein Glied findet.
     *
     * DIE SCHRANKE `if (!glieder.length) continue` GREIFT NUR VOR DEM
     * ERSTEN FUELLEN. Gemessen (Befund 7): in einer nie gefuellten
     * Kampagne traegt `div#npc-list` keine Rolle — richtig. Wer aber erst
     * zwanzig NSC hat und dann nach "zzzzz" sucht, behaelt die Rolle und
     * die Beschriftung bei null Gliedern; harmlos fuer Maus und Tabulator
     * (es gibt keinen Halt mehr), aber eine Werkzeugleiste ohne
     * Bedienelemente ist fuers Vorleseprogramm eine Falschaussage, und sie
     * blieb bis zum naechsten Treffer stehen.
     *
     * NUR WAS WIR GESETZT HABEN: `aria-orientation` muss dastehen, sonst
     * ist die Leiste nicht unsere; das Label nur, wenn es in
     * `_eigeneLabel` steht.
     * @param {Element} behaelter
     */
    _raeumeGruppe(behaelter) {
        if (behaelter.getAttribute('role') !== 'toolbar') return;
        if (!behaelter.hasAttribute('aria-orientation')) return;
        behaelter.removeAttribute('role');
        behaelter.removeAttribute('aria-orientation');
        if (this._eigeneLabel.has(behaelter)) {
            behaelter.removeAttribute('aria-label');
            this._eigeneLabel.delete(behaelter);
        }
    },

    /**
     * Die Kennung des Glieds `i` — `data-id|data-value`, aber NUR wenn sie
     * in dieser Gruppe eindeutig ist.
     *
     * DIE EINDEUTIGKEITSPRUEFUNG IST NOETIG: vier Zauberplaetze des ersten
     * Grades tragen dieselbe `data-id` UND dieselbe `data-value` ("1").
     * Ohne sie wuerde der Halt nach jedem Neuzeichnen auf den ersten Punkt
     * des Rangs zurueckfallen statt auf den vierten. Ist die Kennung nicht
     * eindeutig, bleibt der Index das Gedaechtnis — fuer Punktreihen
     * genau richtig, weil ihre Laenge sich nicht aendert.
     * @param {Element[]} glieder
     * @param {number} i
     * @returns {string|null}
     */
    _haltKennung(glieder, i) {
        const g = glieder[i];
        if (!g) return null;
        const k = this._gliedKennung(g);
        if (!k) return null;
        let n = 0;
        for (const x of glieder) {
            if (this._gliedKennung(x) === k && ++n > 1) return null;
        }
        return k;
    },

    /**
     * `data-id|data-value` eines Glieds, oder `null`, wenn es keines von
     * beiden traegt.
     * @param {Element} g
     * @returns {string|null}
     */
    _gliedKennung(g) {
        const id = g.getAttribute('data-id') || '';
        const wert = g.getAttribute('data-value') || '';
        return id || wert ? `${id}|${wert}` : null;
    },

    /**
     * Index des Glieds mit dieser Kennung, oder -1.
     * @param {Element[]} glieder
     * @param {string|null|undefined} kennung
     * @returns {number}
     */
    _findeKennung(glieder, kennung) {
        if (!kennung) return -1;
        return glieder.findIndex(g => this._gliedKennung(g) === kennung);
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
                    //
                    // `preventScroll: true` (nachgetragen in E-2, Einheit 2).
                    // EINE FOKUSRUECKGABE IST KEINE NAVIGATION und darf die
                    // Ansicht nicht bewegen. Ohne diese Angabe rollte sie den
                    // Behaelter unter dem Fokus wieder in den sichtbaren
                    // Bereich — und machte damit genau die Bewegung
                    // zunichte, aus der das Neuzeichnen entstanden war.
                    // Gemessen im Bestiarium: Fokus auf der ersten
                    // Monsterzeile, 300 px mit dem Rad gerollt, danach
                    // `scrollTop` wieder 0 statt 300; die Liste sprang unter
                    // der Hand des Spielleiters zurueck. Der Fall war nicht
                    // zu sehen, solange es nur die Kampfgruppen gab:
                    // `renderInit()` rollt nichts, und `.init-spell-slots`
                    // liegt in keinem rollbaren Behaelter.
                    //
                    // Der Gegensatz dazu ist `_tasten()` weiter unten: dort
                    // IST die Bewegung gewollt, weil der Spielleiter selbst
                    // faehrt und das Ziel sehen will. Darum steht das
                    // `preventScroll` hier und nicht dort.
                    ziel.focus({ preventScroll: true });
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
        const achse = this._achse(art, glieder);
        const vor = achse === 'vertical' ? 'ArrowDown' : 'ArrowRight';
        const zurueck = achse === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

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
        this._stand.set(this._schluessel(art, glieder, behaelter), {
            index: ziel,
            kennung: this._haltKennung(glieder, ziel)
        });
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
     * was ein `innerHTML`-Ersatz wegnimmt.
     *
     * ERSTE STUFE: TRAGEN ALLE GLIEDER DASSELBE DATENMERKMAL, dann
     * benennt es den BEHAELTER und ist der beste Schluessel, den es gibt.
     * Das ist der Fall bei jeder Gruppe, die zu EINEM Gegenstand gehoert:
     * die sieben Zauberplaetze von Kaempfer 5 (`data-id="5"`), die drei
     * Todeswuerfe einer Vorzeichenreihe (`data-id` plus `data-type`), die
     * zwei Statusmarken von Auftrag 17, die fuenfzehn Artikel von Laden 1.
     *
     * ZWEITE STUFE: SONST DIE EIGENE KENNUNG DES BEHAELTERS. Das ist die
     * Korrektur aus Runde 3. Die erste Fassung nahm auch hier
     * `glieder[0]`, und bei Listen mit UNTERSCHIEDLICHEN `data-id` war
     * das die id der ersten ZEILE — eine Zahl, die sich bei jedem
     * Datentausch und in `div#bestiary-list` bei jeder Rollstellung
     * aendert. Gemessen: `_stand` wuchs im Bestiarium von 55 auf 131
     * Eintraege in 40 Radstufen (ein Eintrag je besuchter Fensterlage,
     * nie geraeumt), und nach dem Ersetzen von `D.npcs` fand
     * `_holeFokusZurueck()` keine Gruppe mit dem Anspruchsschluessel mehr
     * — der Fokus lag danach auf `BODY` und der Spielleiter musste sich
     * die rund 28 Anschlaege von oben neu ertabulieren. `div#npc-list`
     * und `div#bestiary-list` tragen eine id; sie wechselt nie.
     *
     * DRITTE STUFE: DER INDEX unter den Behaeltern derselben Art, fuer
     * Behaelter ohne eigene Kennung (`div.wiki-tree-items` — einer je
     * Kategorie, in der festen Reihenfolge von `WIKI_CATEGORIES`). Er ist
     * schwaecher (ein eingeschobener Behaelter verschiebt ihn), aber
     * besser als ein Schluessel, der alle Gruppen einer Art zusammenwirft.
     * @param {Record<string, any>} art
     * @param {Element[]} glieder
     * @param {Element} behaelter
     * @returns {string}
     */
    _schluessel(art, glieder, behaelter) {
        const g = glieder[0];
        const id = (g && g.getAttribute('data-id')) || '';
        const typ = (g && g.getAttribute('data-type')) || '';
        if (id || typ) {
            const gemeinsam = glieder.every(
                x =>
                    (x.getAttribute('data-id') || '') === id &&
                    (x.getAttribute('data-type') || '') === typ
            );
            if (gemeinsam) return `${art.name}|${id}|${typ}`;
        }
        const eigen = behaelter.id || behaelter.getAttribute('data-id') || '';
        if (eigen) return `${art.name}|#${eigen}`;
        const alle = Array.from(document.querySelectorAll(art.behaelter));
        return `${art.name}|@${alle.indexOf(behaelter)}`;
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
