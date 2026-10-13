// [SECTION:MODAL_FOCUS]
// ============================================================
// MODALFOKUS — EINSTIEG, FALLE, RUECKKEHR  @modal @focus @keyboard @aria
// ============================================================
//
// WAS HIER PASSIERT, IN EINEM SATZ: ein offener Dialog haelt die Tastatur
// fest — der Fokus landet beim Oeffnen innen, bleibt drin, solange der
// Dialog offen ist, und kehrt beim Schliessen auf die Schaltflaeche
// zurueck, die ihn geoeffnet hat.
//
// WARUM ES DAS BRAUCHT. Gemessen am gebauten Buendel, gefuellte Kampagne,
// 1440 px, echte Tabulatorspruenge, je Modal ein frischer Seitenaufbau
// (Ausgangslage HEAD 392d1d3):
//
//                                    6 Eintraege/Typ   20 Eintraege/Typ
//   Fokus landet beim Oeffnen INNEN       2 / 36            2 / 36
//   Austritte bei 45 Spruengen je Modal    1396              1610
//   davon verdeckt UND bedienbar           1333              1606
//   Rueckkehr zum Oeffner                 0 / 36            0 / 36
//   role="dialog" im DOM                  0 / 36            0 / 36
//
// Die dritte Zeile ist die, auf die es am Spieltisch ankommt. 1333 bzw.
// 1606 der erreichten Halte liegen UNTER der Dialogflaeche — sichtbar
// nicht, auslösbar ja. Der Spielleiter tabuliert aus einem offenen Dialog
// in einen Hintergrund, den er nicht sieht, und bedient dort mit der
// Leertaste etwas, das er nicht gewollt hat. Und die Zahl WAECHST mit der
// Kampagne.
//
// WARUM DIE HAKEN NICHT IN EINEM `window.showModal`-MANTEL SITZEN
// (Orchestrator-Entscheidung O-4). `showModal` und `hideModal` sind blanke
// Funktionsdeklarationen in `systems/spellslots/navigation.js`. Von den
// 60 `showModal`- und 63 `hideModal`-Aufrufstellen im Quellbaum rufen
// **52 bzw. 58 BLANK** — sie binden LEXIKALISCH an diese Deklarationen und
// gehen an jedem `window.*`-Mantel vorbei. Nur die restlichen 8 bzw. 5
// gehen ueber `window.` und wuerden einen Mantel ueberhaupt erreichen.
// Unter den blanken ist `ui/actions/ui-actions.js:8`, der Weg, den JEDER
// Klick auf `data-action="show-modal"` nimmt. Genau die Falle, die
// CLAUDE.md fuer `save()` dokumentiert ("NEVER wrap `window.save`"): der
// Mantel feuert bei normaler Arbeit nie. Darum ruft `navigation.js` die
// drei Funktionen hier DIREKT auf, und `tests/e2e/features/modal-fokus.spec.js`
// Fall (f) fuehrt den blanken Aufrufweg vor, damit ein spaeterer Umbau auf
// einen Mantel rot wird statt still zu versagen.
//
// DRITTE STELLE: DER ESCAPE-ZWEIG. `systems/spellslots/keyboard-shortcuts.js`
// ruft beim Schliessen per Escape `hideModal()` NICHT, sondern nimmt die
// Klasse `show` selbst ab bzw. entfernt den Knoten. Ein Haken allein in
// `hideModal()` wuerde also vom HAEUFIGSTEN Schliessweg umgangen. Der
// Zweig leitet jetzt ueber `hideModal()` bzw. ruft `kehreZurueck()`
// selbst.
//
// VIERTE STELLE: #quicknotes-modal. Es traegt `.modal-backdrop` statt
// `.modal-overlay` (assets/templates/modals-tools.html:194) und fiel damit
// aus dem Selektor des Escape-Zweigs — gemessen blieb es als EINZIGE von
// 36 Schalen auf Escape offen. Darum steht es hier namentlich im
// Schalen-Selektor.

/**
 * WAS ALS DIALOG GILT. In Selektorschreibweise waere es
 * `.modal-overlay.show, #quicknotes-modal.show`:
 *
 *  - `.modal-overlay` deckt die 35 Vorlagen-Schalen UND die zur Laufzeit
 *    erzeugten ab. Auch die tragen die Klasse und werden ueber
 *    `showModal()` sichtbar gemacht, das `show` setzt (nachgelesen an
 *    `features/timeline/timeline-render.js:281`).
 *  - `#quicknotes-modal` ist der namentliche Nachtrag fuer die eine Schale
 *    mit `.modal-backdrop`.
 *  - `show` MUSS mitgeprueft werden: die Vorlagen-Schalen liegen dauerhaft
 *    im Dokument und waeren sonst alle immer "offen".
 *  - Die Befehlspalette (`.cp-overlay.cp-visible`) gehoert ABSICHTLICH NICHT
 *    dazu. Sie fuehrt ihre Tastatur selbst (`command-palette.js:41`, ein
 *    keydown am Eingabefeld) und bringt role/aria-modal/aria-label schon
 *    mit. Sie in die Falle zu nehmen waere eine Verhaltensaenderung ohne
 *    Messung und ohne Auftrag.
 *
 * GESCHRIEBEN IST ES TROTZDEM ALS LEBENDE SAMMLUNG PLUS classList, und das
 * ist gemessen und nicht gespart. Die Falle haengt an einem keydown am
 * Dokument und wird bei JEDEM Tabulatordruck der ganzen App gefragt, auch
 * wenn gar kein Dialog offen ist. In der Party-Ansicht bei zwanzig
 * Eintraegen je Typ (10 820 Knoten, 35 Schalen) kostet ein Aufruf:
 *
 *   querySelectorAll(selektor)                        169,5 us
 *   querySelector(selektor)                           179,4 us
 *   lebende Sammlung + classList (diese Fassung)         1,5 us
 *
 * Also 110-fach. Auf 2000 Tabulatordruecke gerechnet waren das 369 ms
 * gegenueber 6,8 ms ohne das Modul — fuer einen Menschen unsichtbar, aber
 * es ist Arbeit, die bei jedem Tastendruck fuer nichts geleistet wird, und
 * sie hat einen Grenzfall der E2E-Suite ueber seine Zeitgrenze geschoben.
 *
 * Die Bedeutung bleibt dieselbe: `getElementsByClassName` gibt eine von der
 * DOM-Maschine gepflegte, LEBENDE Sammlung — zur Laufzeit angehaengte
 * Schalen stehen automatisch darin —, und `show` wird je Knoten einzeln
 * geprueft. Kein Verlust an Verlaesslichkeit, nur billiger.
 * `getComputedStyle` kommt erst dazu, wenn eine Schale `show` traegt; im
 * Normalfall (nichts offen) gar nicht.
 */
const SCHALEN_KLASSE = 'modal-overlay';
const SCHALE_OHNE_KLASSE = 'quicknotes-modal';
const schalenSammlung = document.getElementsByClassName(SCHALEN_KLASSE);

/**
 * Was als Haltepunkt zaehlt. Dieselbe Liste, die auch die Vermessung und
 * die Ratsche verwenden — bewusst identisch, damit Messung und Umsetzung
 * nicht auseinanderlaufen.
 */
const FOKUSSIERBAR =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
    'textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

/**
 * Der Oeffner je Schale, als WeakMap statt als Stapel.
 *
 * WARUM KEIN STAPEL. Ein Stapel setzt voraus, dass jedes `showModal()` von
 * genau einem `hideModal()` beantwortet wird. Das gilt hier nicht: 61
 * Oeffner- und 63 Schliessstellen, dazu der Ansichtswechsel, der
 * transiente Schalen ohne `hideModal()` entfernt
 * (`navigation.js:27`). Jede unbeantwortete Haelfte verschoebe den Stapel
 * dauerhaft, und der naechste Dialog gaebe den Fokus an einen fremden
 * Oeffner zurueck — ein Fehler, der nur sporadisch auffaellt.
 *
 * Am Element haengt die Zuordnung dagegen immer richtig, auch bei
 * verschachtelten Dialogen: schliesst B, kehrt der Fokus in A zurueck,
 * weil B seinen eigenen Oeffner kennt. Eine WeakMap statt einer
 * Eigenschaft am Knoten, damit nichts am DOM haengen bleibt.
 * @type {WeakMap<Element, Element>}
 */
const oeffnerVon = new WeakMap();

/**
 * Die Oeffnungsreihenfolge je Schale, und ihr Zaehler.
 *
 * WARUM ES DAS BRAUCHT — ein Befund der eigenen Messung, nicht eine
 * Vorsichtsmassnahme. Die erste Fassung bestimmte "die oberste Schale" als
 * die LETZTE in Dokumentreihenfolge. Fuer die zur Laufzeit angehaengten
 * Schalen stimmt das, fuer die 35 aus den Vorlagen NICHT: ihre Reihenfolge
 * steht in `assets/templates/`, nicht in der Reihenfolge, in der sie
 * geoeffnet werden. Gemessen: #about-modal auf, dann #theme-modal auf,
 * Escape — und geschlossen wurde #about-modal, weil es in der Vorlage
 * HINTER #theme-modal steht. Der Nutzer schliesst den Dialog, den er sieht,
 * und es verschwindet der darunter.
 *
 * Darum wird die Oeffnungsreihenfolge mitgefuehrt. Eine Schale ohne Eintrag
 * (sichtbar gemacht, ohne durch `showModal()`/`einstieg()` zu laufen) zaehlt
 * als 0 und verliert damit gegen jede verfolgte — und unter mehreren
 * Unverfolgten gewinnt weiterhin die letzte in Dokumentreihenfolge.
 * @type {WeakMap<Element, number>}
 */
const oeffnungsNr = new WeakMap();
let oeffnungsZaehler = 0;

const ModalFocus = {
    /**
     * Sichtbar im Sinne der Tabulatorreihe: Flaeche vorhanden und nicht
     * per `display`/`visibility` weggeschaltet.
     *
     * `opacity` wird ABSICHTLICH NICHT geprueft. Ein Element mit
     * `opacity: 0` bleibt in der Tabulatorreihe des Browsers (belegt in
     * `tests/e2e/features/fokusring.spec.js`: 334 von 1054 Halten haengen
     * unter so einem Vorfahren). Wer es hier herausfiltert, macht es
     * unerreichbar, ohne dass der Browser mitspielt — die Falle unten
     * uebernimmt den Tabulator vollstaendig und wuerde das Element dann
     * ueberspringen statt es durchzulassen.
     * @param {Element} el
     */
    sichtbar(el) {
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return false;
        const s = getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden';
    },

    /**
     * Die oberste offene Schale, oder `null`. "Oberste" = die ZULETZT
     * GEOEFFNETE, nicht die letzte in Dokumentreihenfolge — siehe die
     * Begruendung an `oeffnungsNr`.
     * @returns {Element|null}
     */
    oberstesModal() {
        const offen = [];
        for (let i = 0; i < schalenSammlung.length; i++) {
            const n = schalenSammlung[i];
            if (!n.classList.contains('show')) continue;
            const s = getComputedStyle(n);
            if (s.display !== 'none' && s.visibility !== 'hidden') offen.push(n);
        }
        // Die eine Schale mit `.modal-backdrop` statt `.modal-overlay`. Sie
        // steht nicht in der Sammlung und wird namentlich nachgeholt.
        const q = document.getElementById(SCHALE_OHNE_KLASSE);
        if (q && q.classList.contains('show') && !q.classList.contains(SCHALEN_KLASSE)) {
            const s = getComputedStyle(q);
            if (s.display !== 'none' && s.visibility !== 'hidden') offen.push(q);
        }
        if (!offen.length) return null;
        let beste = offen[0];
        let besteNr = oeffnungsNr.get(beste) || 0;
        for (let i = 1; i < offen.length; i++) {
            const nr = oeffnungsNr.get(offen[i]) || 0;
            // `>=` statt `>`: bei Gleichstand (beide unverfolgt) gewinnt die
            // spaetere in Dokumentreihenfolge, wie vorher.
            if (nr >= besteNr) {
                beste = offen[i];
                besteNr = nr;
            }
        }
        return beste;
    },

    /**
     * Die sichtbaren Haltepunkte innerhalb von `m`, in Dokumentreihenfolge.
     * @param {Element} m
     * @returns {Element[]}
     */
    haltepunkte(m) {
        return Array.from(m.querySelectorAll(FOKUSSIERBAR)).filter(el => this.sichtbar(el));
    },

    /**
     * Haelt fest, wer den Dialog geoeffnet hat. MUSS aufgerufen werden,
     * BEVOR der Dialog sichtbar wird — danach kann der Fokus schon
     * verschoben sein.
     * @param {Element} m
     */
    merkeOeffner(m) {
        if (!m) return;
        const a = document.activeElement;
        if (a && a !== document.body && a !== document.documentElement) {
            oeffnerVon.set(m, a);
        } else {
            // Kein Oeffner (Aufruf aus der Konsole, aus einem Kuerzel oder
            // beim Start). Einen alten Eintrag wegnehmen, sonst gibt der
            // Dialog den Fokus an einen Oeffner von vorletztem Mal zurueck.
            oeffnerVon.delete(m);
        }
    },

    /**
     * Beschriftet die Schale fuer Vorlesesoftware (O-8). Vorbild im Haus:
     * `features/command-palette/command-palette.js:20-22`.
     *
     * Jedes `setAttribute` steht hinter einem Vergleich. Das ist nicht
     * Kosmetik: `ui/keyboard-reach.js` beobachtet das Dokument, und auch
     * wenn es ausdruecklich NUR `childList` hoert (nicht `attributes`),
     * soll hier bei jedem Oeffnen nicht ohne Not am DOM geschrieben
     * werden.
     * @param {Element} m
     */
    beschrifte(m) {
        if (!m) return;
        if (m.getAttribute('role') !== 'dialog') m.setAttribute('role', 'dialog');
        if (m.getAttribute('aria-modal') !== 'true') m.setAttribute('aria-modal', 'true');
        if (m.getAttribute('aria-labelledby') || m.getAttribute('aria-label')) return;
        const titel = m.querySelector(
            '.modal-title, .modal-header h1, .modal-header h2, .modal-header h3'
        );
        if (titel) {
            if (!titel.id) titel.id = (m.id || 'modal') + '-titel';
            m.setAttribute('aria-labelledby', titel.id);
        } else {
            // Keine Ueberschrift in der Schale. Ein generischer Name ist
            // besser als keiner: ohne Namen meldet eine Vorlesesoftware
            // nur "Dialog" ohne jeden Hinweis, worum es geht.
            m.setAttribute('aria-label', 'Dialog');
        }
    },

    /**
     * Der Einstieg: Fokus in den Dialog, falls er nicht schon drin liegt.
     *
     * DIE BEDINGUNG IST TRAGEND. Mehrere Oeffner setzen den Fokus selbst
     * (`showHpCalculator` landet im ersten Feld, `showNotesSearch` im
     * Suchfeld) und rufen `showModal()` davor. Ohne die Pruefung wuerde
     * hier der erste Haltepunkt gegriffen — beim Lebenspunkte-Rechner der
     * Schliessknopf, der VOR dem Feld steht — und die bestehende, bessere
     * Fuehrung waere zerstoert.
     * @param {Element} m
     */
    einstieg(m) {
        if (!m) return;
        // Die Oeffnungsreihenfolge festhalten, BEVOR irgendetwas anderes
        // passiert: daran erkennt `oberstesModal()` den vorderen Dialog.
        oeffnungsNr.set(m, ++oeffnungsZaehler);
        this.beschrifte(m);
        if (m.contains(document.activeElement)) return;
        const h = this.haltepunkte(m);
        if (h.length) h[0].focus();
    },

    /**
     * Der Rueckweg: Fokus auf den Oeffner, falls er noch im Dokument
     * steht. Wird der Oeffner zwischenzeitlich neu gezeichnet (eine
     * Listenzeile etwa), ist der Knoten weg — dann bleibt der Fokus, wo er
     * ist, statt irgendwohin zu springen.
     * @param {Element} m
     */
    kehreZurueck(m) {
        if (!m) return;
        // Beide Eintraege abraeumen: so gilt "hat eine Oeffnungsnummer" genau
        // so lange, wie die Schale offen ist.
        oeffnungsNr.delete(m);
        const ziel = oeffnerVon.get(m);
        oeffnerVon.delete(m);
        if (!ziel || !document.contains(ziel) || typeof ziel.focus !== 'function') return;
        if (!this.sichtbar(ziel)) return;
        ziel.focus();
    },

    /**
     * Die Fokusfalle. EIN keydown am Dokument in der Capture-Phase.
     *
     * SIE UEBERNIMMT DEN TABULATOR VOLLSTAENDIG, statt nur die beiden
     * Raender abzufangen. Der Unterschied ist nicht akademisch: die
     * Reihenfolge des Browsers und die Liste aus `haltepunkte()` muessen
     * dafuer uebereinstimmen, dass eine Randerkennung ("ist der Fokus auf
     * dem letzten Halt?") greift. Sie tun das nicht zuverlaessig — ein
     * fokussierbarer Knoten, den der Sichtbarkeitstest herausnimmt, steht
     * beim Browser trotzdem in der Reihe und laege dann HINTER dem
     * vermeintlich letzten Halt. Die Randerkennung haette dort nicht
     * ausgeloest und der Fokus waere in den Hintergrund entkommen. Mit
     * vollstaendiger Uebernahme kann das nicht passieren: der naechste
     * Halt wird gerechnet, nicht erraten.
     *
     * `preventDefault()` ist deshalb an JEDEM Zweig gesetzt, nicht nur an
     * den Raendern.
     * @param {KeyboardEvent} e
     */
    _tab(e) {
        if (e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) return;
        const m = this.oberstesModal();
        if (!m) return;
        const h = this.haltepunkte(m);
        if (!h.length) {
            // Ein Dialog ohne Haltepunkt. Der Tabulator darf ihn nicht
            // verlassen, hat aber auch kein Ziel — die Taste verfaellt.
            // Escape bleibt der Ausweg.
            e.preventDefault();
            return;
        }
        const a = document.activeElement;
        e.preventDefault();
        if (!m.contains(a)) {
            (e.shiftKey ? h[h.length - 1] : h[0]).focus();
            return;
        }
        const i = h.indexOf(/** @type {Element} */ (a));
        if (i < 0) {
            // Fokus liegt im Dialog, aber auf einem Knoten, den der
            // Sichtbarkeitstest nicht fuehrt. Von vorn anfangen.
            h[0].focus();
            return;
        }
        const weiter = e.shiftKey
            ? i === 0
                ? h[h.length - 1]
                : h[i - 1]
            : i === h.length - 1
              ? h[0]
              : h[i + 1];
        weiter.focus();
    },

    /**
     * Haengt die Falle ein. Einmal; ein zweiter Aufruf tut nichts.
     */
    init() {
        if (this._eingehaengt) return;
        this._eingehaengt = true;
        document.addEventListener('keydown', e => this._tab(e), true);
    },

    /**
     * Diagnose fuer die Konsole und fuer Messungen.
     * @returns {{ aktiv: boolean, offen: string|null, haltepunkte: number }}
     */
    statistik() {
        const m = this.oberstesModal();
        return {
            aktiv: !!this._eingehaengt,
            offen: m ? m.id || '(ohne id)' : null,
            haltepunkte: m ? this.haltepunkte(m).length : 0
        };
    }
};

window.ModalFocus = ModalFocus;

// Selbstaufruf statt eines Eintrags in `core/init.js`: die Falle haengt an
// nichts aus dem Datenbestand und soll greifen, sobald ein Dialog offen
// sein kann — auch wenn eine spaetere init-Stufe scheitert. Dasselbe
// Muster wie `ui/keyboard-reach.js`.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ModalFocus.init(), { once: true });
} else {
    ModalFocus.init();
}
