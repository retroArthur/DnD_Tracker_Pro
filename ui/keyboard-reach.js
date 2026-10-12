// [SECTION:KEYBOARD_REACH]
// ============================================================
// KEHRSCHLEIFE — TASTATURERREICHBARKEIT  @tabindex @role @keyboard
// ============================================================
//
// WAS HIER PASSIERT, IN EINEM SATZ: jedes sichtbare Bedienelement mit
// `data-action`, das der Browser NICHT von sich aus in die Tabulatorreihe
// nimmt, bekommt zur Laufzeit `tabindex="0"` und — ausser auf einer Marke —
// `role="button"`.
//
// WARUM ES DAS BRAUCHT. Im Quellbaum tragen 219 Stellen in 43 Dateien
// `data-action` auf einem `div`, `span` oder `label` (gezaehlt: 100 div, 81
// span, 38 label). Sie sehen aus wie Knoepfe, sie reagieren auf die Maus —
// und sie kommen in KEINEM Tabulatorlauf vor. Gemessen am gebauten Buendel,
// gefuellte Kampagne, 1440 px, echte Tabulatorspruenge, je Ansicht ein
// frischer Seitenaufbau (Ausgangslage HEAD 4830173, sechs bzw. zwanzig
// Eintraege je Typ):
//
//                   6 Eintraege/Typ        20 Eintraege/Typ
//   Armaturenbrett  44 bedienbar / 16 un.  58 / 30
//   Initiative      93 /  7               198 / 21
//   Party          127 / 56               351 / 182
//   Wuerfel         42 /  1                42 /  1
//   DM-Schirm       37 /  1                37 /  1
//
// Darunter die acht Sprungfelder des Armaturenbretts (`show-view`), der
// Lebenspunkte-Rechner je Heldenkarte (`show-hp-calculator-stop`), die
// Initiative-Wertbearbeitung (`edit-init-value`), der Charakterbogen
// (`edit-char`) und `div.qref-fab`, die Schnell-Referenz, die in ALLEN 24
// Ansichten unerreichbar ist und deren einziger Zugang heute das Kuerzel
// `/` ist. Fuer einen Spielleiter, der im Kampf die Hand nicht von der
// Tastatur nehmen will, sind das keine Randfaelle.
//
// WARUM ZWEI ATTRIBUTE UND KEIN `<button>` (Orchestrator-Entscheidung O-1,
// entschieden, nicht zur Wahl gestellt). Drei unabhaengige Messungen zeigen
// in dieselbe Richtung:
//   (a) STIL. Der Umbau `div` -> `button` aendert bei 32 von 32 Signaturen
//       mindestens eine berechnete Eigenschaft (`appearance` 32/32,
//       `textAlign` 28/32, `fontFamily` 26/32) und bei 20 von 32 die
//       Abmessungen, teils schwer (`.collapsible-header` 1378 px -> 192 px).
//       Es gibt kein globales `button { font: inherit }` im Baum.
//   (b) STRUKTUR. Fuenf Signaturen enthalten verschachtelte Bedienelemente
//       (`.char-card-header`, `.shop-header`, `.bestiary-list-item`,
//       `.fr-faction-card`, `.shortcuts-overlay`). Ein `button` im `button`
//       ist ungueltiges HTML.
//   (c) RATSCHE. Der Stil-Sollstand in
//       `tests/e2e/features/computed-style-diff.spec.js` bildet seinen
//       Schluessel als `tag.sortierteKlassen#index`. Ein Tagwechsel erzeugt
//       je Stelle ZWEI Befunde ("im Vorlauf vorhanden, jetzt nicht mehr
//       erfasst" UND "jetzt neu erfasst") plus Digest-Abweichungen ueber
//       `display` und `textAlign`. 181 Stellen waeren 362 Befunde plus eine
//       Ausnahmeliste, die die Ratsche entwertet.
// Die zwei Attribute aendern dagegen weder Schluessel noch Box noch eine der
// zwoelf gehashten Eigenschaften: es gibt im ganzen CSS-Baum KEINE Regel auf
// `[role=…]` oder `[tabindex…]` (nachgezaehlt, 0 Treffer in
// `assets/styles/`). Der Fokusring kommt aus der Weltregel
// `:focus-visible { outline: 2px solid var(--focus-ring); outline-offset:
// 2px }` in `assets/styles/core.css` — diese Datei braucht keine Zeile CSS.
//
// UND SIE ENTSTEHEN ZUR LAUFZEIT, NICHT IM QUELLTEXT (O-3). Das ist eine
// bewusste Abwaegung mit einem bekannten Preis: ein `grep tabindex` im
// Quellbaum zeigt diese 219 Stellen NICHT. Dagegen stehen 219 Aenderungen
// in 43 Dateien, von denen 126 in JS-Renderfunktionen liegen — und es gibt
// 149 globale `render*`-Funktionen, von denen sich jede kuenftige an zwei
// Attribute erinnern muesste. Eine Schleife ist eine Stelle, deckt auch
// kuenftigen Code und ruehrt kein Template an (also auch die Ratsche
// INLINE_MAX nicht). Kosten gemessen: 0,4 ms Median ueber 2273
// `[data-action]`-Knoten; `renderParty()` allein kostet 2,1 ms.
//
// UMFANG: FUENF KAMPFANSICHTEN (Nutzerentscheidung E-1, "Kampf zuerst").
// Begruendung des Nutzers: in der Vorbereitung greift man zur Maus und macht
// weiter, im Kampf stockt man vor sechs wartenden Spielern. Die uebrigen 19
// Ansichten sind ausdruecklich NICHT Teil dieses Pakets und werden als
// benannte Restschuld gefuehrt. Erweitern heisst: eine Kennung in
// `KAMPF_ANSICHTEN` aufnehmen und die Reichweitenfaelle in
// `tests/e2e/features/tastatur-erreichbarkeit.spec.js` um die Ansicht
// ergaenzen. Sonst nichts.
//
// WAS DIESE DATEI NICHT TUT: sie bringt keinen eigenen Tastenlauscher mit.
// Enter und die Leertaste bedienen das nachgeruestete Element ueber den
// `keydown`-Zweig in `ui/event-delegation.js` (T-B, O-2); die
// Einzeltasten-Kuerzel halten sich ueber die `beanspruchtLeertaste`-Schranke
// in `systems/spellslots/keyboard-shortcuts.js` (T-A) von fokussierten
// Bedienelementen fern. Beide Schichten erkennen das hier Gesetzte bereits:
// `[role="button"]` und `[tabindex]:not([tabindex="-1"])` stehen in ihren
// Selektoren. Das war Absicht und ist nachgeprueft, nicht vorausgesetzt.
//
// WAS SIE DAFUER BEISTEUERT, seit Runde 1: `nurMausfokus()` weiter unten.
// Beide Schranken fragen dort nach, bevor sie die Leertaste einem versorgten
// Element zusprechen — denn nach einem MAUSKLICK gehoert sie weiter dem Zug.
// Die lange Begruendung steht an der Funktion.

/**
 * Die fuenf Kampfansichten aus E-1. Ein Element wird nachgeruestet, wenn es
 * in einer davon liegt ODER ausserhalb aller `.view`-Abschnitte (die globale
 * Schale: Kopfzeile, Schnell-Referenz, Modale). Die globale Schale MUSS
 * mitlaufen, denn `div.qref-fab` liegt dort und waere sonst auch in den
 * fuenf Ansichten weiter unerreichbar.
 */
const KAMPF_ANSICHTEN = new Set([
    'view-dashboard',
    'view-initiative',
    'view-party',
    'view-dice',
    'view-dmscreen'
]);

/**
 * Rohauswahl der Kehrschleife. Das `:not([tabindex])` ist nicht Kosmetik,
 * sondern der Grund, warum die Schleife im Dauerbetrieb nichts kostet: ein
 * bereits nachgeruestetes Element traegt ein `tabindex` und faellt damit
 * schon in der Selektor-Maschine heraus, nicht erst in der Schleife. Nach
 * dem ersten Lauf liefert die Abfrage in einer unveraenderten Ansicht null
 * Knoten.
 *
 * Es ist zugleich die Zusage, NICHTS ZU UEBERSCHREIBEN: wer irgendwo
 * `tabindex="-1"` setzt, hat sich das ueberlegt (die zwei Ablagezonen des
 * Umzugs-Assistenten tragen `tabindex="0"` schon im Quelltext) — die
 * Schleife laesst beide in Ruhe.
 */
const ROHAUSWAHL = '[data-action]:not([tabindex])';

/**
 * Was der Browser SELBST in die Tabulatorreihe nimmt. Diese Elemente sind
 * bereits erreichbar (gemessen: 0 von 1314 nativen Bedienelementen sind in
 * den 24 Ansichten unerreichbar, 940 der `data-action`-Quellstellen sind
 * schon `<button>`), und `role="button"` waere auf einem `<select>` oder
 * einem `<a href>` nicht nur nutzlos, sondern falsch.
 *
 * `summary` und `details` stehen bewusst mit drin: sie sind fokussierbar,
 * tauchen aber in keiner der ueblichen Listen auf.
 */
const NATIV_FOKUSSIERBAR =
    'a[href], area[href], button, input:not([type="hidden"]), select, textarea, ' +
    'summary, details, iframe, object, audio[controls], video[controls], ' +
    '[contenteditable=""], [contenteditable="true"]';

/**
 * Aktionen, die KEIN Tastaturziel sind. Bisher genau eine:
 *
 * `backdrop-close` ist die Blende hinter einem Dialog — eine Flaeche, die
 * einen Klick NEBEN den Inhalt faengt (der Haken in
 * `ui/actions/ui-actions.js` prueft `ctx.event.target === ctx.target` und
 * schliesst nur dann). "Neben etwas klicken" hat auf der Tastatur kein
 * Gegenstueck; das Gegenstueck ist Escape, und das funktioniert schon.
 *
 * Ohne diese Ausnahme ist es nicht nur nutzlos, sondern schaedlich —
 * gemessen, nicht befuerchtet: `div#shortcuts-overlay` traegt
 * `backdrop-close`, liegt ausserhalb aller `.view` und ist im geschlossenen
 * Zustand NUR ueber `opacity: 0` und `pointer-events: none` versteckt
 * (`assets/styles/dmscreen.css`, kein `display: none`, kein
 * `visibility: hidden`). Ein `tabindex` darauf bleibt darum
 * fokussierbar. Der erste Lauf dieser Datei hat genau das erzeugt: +1
 * Phantomhalt in 23 von 24 Ansichten — ein Tabulatorsprung auf eine
 * unsichtbare Flaeche von 1440x900 px, auf der der Fokusring nichts
 * anzeigt, weil es nichts zu sehen gibt. Nachgemessen mit `sweep2.mjs` der
 * Vermessung (Phantomhalte Armaturenbrett 1 -> 2, Party 2 -> 3, …) und mit
 * der Opazitaetskette aus `phantom3.mjs`: genau EIN Element der 430
 * nachgeruesteten war phantomfaehig, und es war dieses.
 *
 * Die Alternative waere ein Sichtbarkeitstest je Kandidat gewesen. Der
 * waere falsch: ein Element in einem geschlossenen Formular oder einem
 * ungeoeffneten Dialog ist zu Recht unsichtbar, bekommt hier sein
 * `tabindex` und ist beim Oeffnen sofort erreichbar — denn ein Dialog
 * oeffnet sich ueber eine KLASSE, und der Beobachter sieht nur
 * `childList`. Mit Sichtbarkeitstest blieben alle 35 Dialoge leer.
 */
const KEINE_TASTATURZIELE = new Set(['backdrop-close']);

const KeyboardReach = {
    _beobachter: null,
    _geplant: false,

    /**
     * Die Elemente, die DIESE Schleife fokussierbar gemacht hat.
     *
     * WOZU EINE LISTE, wenn man die drei Attribute auch abfragen koennte?
     * Weil `[data-action][tabindex="0"][role="button"]` nur HEUTE eindeutig
     * ist: ein Template, das die drei morgen von Hand setzt, waere nicht mehr
     * zu unterscheiden — und genau dort liegt der Unterschied, auf den sich
     * `nurMausfokus()` beruft. Die Frage ist nicht "sieht es nachgeruestet
     * aus", sondern "hat die Kehrschleife es nachgeruestet".
     *
     * EIN `WeakSet`, damit die Liste nicht waechst: jede `render*`-Funktion,
     * die `innerHTML` ersetzt, wirft ihre Knoten weg; sie fallen damit auch
     * hier heraus, und der naechste Durchlauf traegt die neuen ein. Ein
     * `Set` haette bei 149 Renderfunktionen jeden je erzeugten Knoten
     * festgehalten.
     */
    _versorgt: new WeakSet(),

    /** War die letzte Eingabe ein Zeigegeraet? Nur `_fokusMitschrift()`. */
    _zeigerAnschlag: false,

    /**
     * Das Element, dessen AKTUELLER Fokus von einem Zeigegeraet kommt —
     * oder `null`. Gesetzt beim `focusin`, nicht beim Tastendruck; die
     * Begruendung steht an `_fokusMitschrift()`.
     */
    _zeigerFokus: null,

    /** Zahl der Durchlaeufe. Nur Diagnose — kein Verhalten haengt daran. */
    _laeufe: 0,
    /** Summe der ueber alle Laeufe nachgeruesteten Elemente. */
    _nachgeruestet: 0,

    /**
     * Haengt die Kehrschleife ein. Idempotent: ein zweiter Aufruf tut
     * nichts, damit kein zweiter Beobachter und kein zweiter Haken
     * entstehen.
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

        // NUR `childList`, ausdruecklich NICHT `attributes`. Mit
        // `attributes: true` wuerde jedes `setAttribute()` dieser Schleife
        // den Beobachter erneut wecken — eine Rueckkopplung, die je Frame
        // einen Leerlauf kostet und bei einem Fehler im Filter nicht
        // terminiert. Ein `innerHTML`-Ersatz, der die Attribute loescht
        // (das ist der Pfad, der hier zaehlt), ist immer auch eine
        // `childList`-Aenderung.
        this._beobachter = new MutationObserver(() => this._planen());
        this._beobachter.observe(document.body, { childList: true, subtree: true });

        // Zwei Guertel neben dem Hosentraeger. Der Beobachter deckt beide
        // Faelle bereits ab; die Haken sind da, weil ein stiller Aussetzer
        // der Kehrschleife wie "war schon immer so" aussieht und niemand
        // ihn wiederfindet. Billig: beide planen nur einen Durchlauf ein.
        if (typeof window.registerPostSaveHook === 'function') {
            window.registerPostSaveHook(() => this._planen());
        }
        if (typeof window.registerUndoHook === 'function') {
            window.registerUndoHook(() => this._planen());
        }

        log('[KeyboardReach] Kehrschleife aktiv (5 Kampfansichten + globale Schale)');
    },

    /**
     * Schreibt mit, WIE der Fokus an seine jetzige Stelle gekommen ist —
     * mit dem Zeigegeraet oder mit der Tastatur.
     *
     * WARUM NICHT EINFACH `:focus-visible`? Weil die Pseudoklasse genau die
     * Frage beantwortet, die hier zaehlt, aber zu einem Zeitpunkt, an dem
     * niemand sie mehr lesen kann. Chromium setzt sie, sobald eine Taste
     * fliegt — auch die Taste, ueber die gerade entschieden werden soll.
     * Gemessen am gebauten Buendel, Lauscher am `window` in der
     * Capture-Phase (laeuft damit vor JEDEM Lauscher am `document`), nach
     * einem echten Mausklick auf `div.init-value`:
     *
     *   vor dem Tastendruck   :focus true, :focus-visible FALSE
     *   IM keydown            :focus true, :focus-visible TRUE   <-- zu spaet
     *   im keyup / danach     :focus true, :focus-visible TRUE
     *
     * Eine Schranke, die im `keydown` `:focus-visible` abfragt, bekommt also
     * immer "ja, Tastaturfokus" zu hoeren und greift nie. Das war der erste
     * Versuch dieser Korrektur, er lief gegen einen roten Fall, und diese
     * Messung ist der Grund, warum hier drei Lauscher stehen statt einer
     * Pseudoklasse. Wer sie wieder einkuerzt, bekommt lautlos die alte Lage.
     *
     * DIE DREI LAUSCHER, und warum der Zeitpunkt des Stempels alles ist:
     *   - `pointerdown`/`mousedown` merken nur die ABSICHT ("die letzte
     *     Eingabe war ein Zeiger"), noch kein Element — beim `pointerdown`
     *     steht das Fokusziel nicht fest (ein Klick auf ein Kind fokussiert
     *     den versorgten Vorfahren), und ein Ziehen ohne Klick muesste auch
     *     gelten.
     *   - `keydown` setzt die Absicht zurueck. Das ist unschaedlich fuer den
     *     bereits gesetzten Stempel: der aendert sich NUR beim `focusin`.
     *     Genau darin liegt der Unterschied zu `:focus-visible`.
     *   - `focusin` stempelt. Beim Mausklick liegt er vor dem `click`
     *     (mousedown -> focus -> mouseup -> click), beim Tabulator nach dem
     *     `keydown` — in beiden Faellen sieht der Stempel die Absicht, die
     *     ZU DIESEM Fokus gefuehrt hat, und nicht die Taste danach.
     *
     * Alles in der Capture-Phase und `passive`: diese Mitschrift
     * entscheidet nichts und darf nichts aufhalten.
     */
    _fokusMitschrift() {
        const zeiger = () => {
            this._zeigerAnschlag = true;
        };
        // `pointerdown` deckt Maus, Stift und Finger ab; `mousedown` ist der
        // Guertel fuer eine Umgebung ohne PointerEvent. Beide setzen
        // dasselbe Merkzeichen, doppeltes Setzen schadet nicht.
        document.addEventListener('pointerdown', zeiger, { capture: true, passive: true });
        document.addEventListener('mousedown', zeiger, { capture: true, passive: true });
        document.addEventListener(
            'keydown',
            () => {
                this._zeigerAnschlag = false;
            },
            { capture: true, passive: true }
        );
        document.addEventListener(
            'focusin',
            ev => {
                this._zeigerFokus = this._zeigerAnschlag ? ev.target : null;
            },
            { capture: true, passive: true }
        );
    },

    /**
     * Plant einen Durchlauf fuer das naechste Bild ein. Entprellt: viele
     * Mutationen eines Renderlaufs ergeben EINEN Durchlauf.
     *
     * `requestAnimationFrame` statt `setTimeout`, weil die Attribute erst
     * gebraucht werden, wenn der Nutzer tabulieren kann — und ein
     * verstecktes Dokument, in dem rAF ruht, kann keinen Fokus bekommen.
     * Beim Sichtbarwerden laeuft der geplante Durchlauf nach.
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
     * Ein Durchlauf. Setzt die zwei Attribute auf jedes noch unversorgte
     * Bedienelement im Umfang.
     * @returns {number} Zahl der in DIESEM Durchlauf nachgeruesteten Elemente
     */
    aktualisieren() {
        let n = 0;
        try {
            const knoten = document.querySelectorAll(ROHAUSWAHL);
            for (const el of knoten) {
                if (!this._imUmfang(el)) continue;

                el.setAttribute('tabindex', '0');

                // `role="button"` NUR auf Nicht-Marken. Auf einem `<label>`
                // wuerde es den Marken-Charakter ueberschreiben, und es ist
                // dort nachweislich unnoetig: gemessen an den 38
                // `label.char-resistance-chip` loest die Leertaste auf der
                // nachgeruesteten Marke OHNE `role` genau 1 synthetischen
                // Klick aus, `.selected` springt von false auf true,
                // `checked` bleibt false — identisch zum Mausklick (O-6).
                // Ein vorhandenes `role` bleibt ebenfalls stehen; wer eines
                // gesetzt hat, meinte es.
                if (el.tagName !== 'LABEL' && !el.hasAttribute('role')) {
                    el.setAttribute('role', 'button');
                }

                this._versorgt.add(el);
                n++;
            }
        } catch (e) {
            // Ein Fehler hier darf die App nicht anhalten: die Schleife
            // laeuft im Beobachter und im Post-Save-Haken, also auf Pfaden,
            // die beide weiterlaufen muessen.
            if (typeof ErrorHandler !== 'undefined') {
                ErrorHandler.log('KeyboardReach', e, 'Kehrschleife abgebrochen');
            }
        }
        this._laeufe++;
        this._nachgeruestet += n;
        return n;
    },

    /**
     * Liegt `el` im Umfang dieses Pakets?
     * @param {Element} el
     */
    _imUmfang(el) {
        // Bereits erreichbar — und `role="button"` waere auf einem
        // `<select>` falsch.
        if (el.matches(NATIV_FOKUSSIERBAR)) return false;

        // Blenden sind keine Tastaturziele — Begruendung bei der Liste.
        if (KEINE_TASTATURZIELE.has(el.getAttribute('data-action'))) return false;

        // `aria-hidden` und ein Tastaturhalt sind ein Widerspruch. Der
        // Quellbaum traegt das Attribut nur auf schmueckenden `<svg>` INNEN
        // in Knoepfen, nie auf einem Bedienelement selbst — der Zweig ist
        // Vorsorge, keine Reparatur.
        if (el.getAttribute('aria-hidden') === 'true') return false;

        const ansicht = el.closest('.view');
        // Kein `.view`-Vorfahre = globale Schale, immer im Umfang.
        return !ansicht || KAMPF_ANSICHTEN.has(ansicht.id);
    },

    /**
     * Hat DIESE Schleife `el` fokussierbar gemacht?
     * @param {Element|null} el
     * @returns {boolean}
     */
    istVersorgt(el) {
        return !!el && this._versorgt.has(el);
    },

    /**
     * DIE EINE AUSNAHME, DIE DIE KEHRSCHLEIFE SICH SELBST AUFERLEGT.
     *
     * Wahr, wenn `el` von dieser Schleife versorgt ist UND den Fokus NICHT
     * von der Tastatur hat. Die zwei Leertasten-Schranken des Strangs fragen
     * das, bevor sie die Taste dem Element zusprechen:
     * `_handleKeydown()` in `ui/event-delegation.js` und
     * `beanspruchtLeertaste` in `systems/spellslots/keyboard-shortcuts.js`.
     *
     * WARUM ES DAS BRAUCHT — der Fall, der ohne diese Zeilen auf dem Tisch
     * liegt. Der Spielleiter klickt mit der Maus auf den Initiative-Wert
     * eines Kaempfers (eine der hier nachgeruesteten Stellen, eine je
     * Kampfzeile), korrigiert ihn, und drueckt dann die Leertaste, um den Zug
     * weiterzugeben. Bis zur Kehrschleife ging das: das `div` nahm keinen
     * Fokus an, `activeElement` blieb `BODY`, die Leertaste wechselte den
     * Zug. Danach parkt der Mausklick den Fokus AUF dem `div`, und die
     * Leertaste bedient es erneut — gemessen Zug 0 -> 0 und ein zweiter
     * `prompt()`. Die Akte von T-A verspricht ausdruecklich "ohne Fokus
     * (activeElement = BODY) ... die Leertaste wechselt weiter den Zug"; die
     * Kehrschleife hat still die Menge dieser Lagen verkleinert, fuer rund
     * 430 Elemente, die vorher ueberhaupt keinen Fokus annehmen konnten.
     *
     * WIE DIE HERKUNFT DES FOKUS FESTGESTELLT WIRD: ueber die eigene
     * Mitschrift in `_fokusMitschrift()`, NICHT ueber `:focus-visible`. Die
     * Pseudoklasse beantwortet dieselbe Frage, aber zu spaet — Chromium setzt
     * sie bei der Taste, ueber die hier entschieden werden soll (gemessen,
     * Zahlen stehen dort). Das ist die eine Stelle dieser Korrektur, an der
     * das Naheliegende nicht funktioniert.
     *
     * DREI BEDINGUNGEN, und jede traegt: `istVersorgt()` grenzt auf die
     * Population dieses Pakets ein — auf einem nativen `<button>` ist die
     * Leertaste schon lange eine Bedienung, und sie ihm wegzunehmen waere
     * keine Korrektur dieses Falls, sondern eine Ruecknahme von T-A (dort
     * gemessen: Mausklick, dann Leertaste, Zug 1 -> 2; so soll es bleiben).
     * `_zeigerFokus` ist die Herkunft. Und `document.activeElement` ist die
     * Gegenwart: ohne diesen Teil waere ein versorgtes, aber gar nicht
     * fokussiertes Element ebenfalls "nicht per Tastatur fokussiert" — die
     * Ausnahme wuerde zum Flaechenbrand.
     *
     * NUR DIE LEERTASTE, nicht Enter — das entscheiden die beiden Aufrufer.
     * Enter konkurriert mit keinem Kuerzel; es gibt in der ganzen App keinen
     * Enter-Zweig im Einzeltasten-Lauscher. Wer die Ausnahme dort ausweitet,
     * nimmt der angeklickten Stelle ihre Bedienung, ohne etwas zu gewinnen.
     * Dieselbe Abwaegung wie bei O-7, eine Ebene tiefer.
     *
     * @param {Element|null} el
     * @returns {boolean}
     */
    nurMausfokus(el) {
        if (!this.istVersorgt(el)) return false;
        return el === this._zeigerFokus && el === document.activeElement;
    },

    /**
     * Diagnose fuer die Konsole und fuer Messungen.
     * @returns {{ laeufe: number, nachgeruestet: number, aktiv: boolean, offen: number }}
     */
    statistik() {
        return {
            laeufe: this._laeufe,
            nachgeruestet: this._nachgeruestet,
            aktiv: !!this._beobachter,
            offen: Array.from(document.querySelectorAll(ROHAUSWAHL)).filter(el =>
                this._imUmfang(el)
            ).length
        };
    }
};

window.KeyboardReach = KeyboardReach;

// Selbstaufruf statt eines Eintrags in `core/init.js`: die Schleife haengt
// an nichts aus dem Datenbestand und soll greifen, sobald eine Vorlage im
// Dokument steht — auch wenn eine spaetere init-Stufe scheitert.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KeyboardReach.init(), { once: true });
} else {
    KeyboardReach.init();
}
