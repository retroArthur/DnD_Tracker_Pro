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
