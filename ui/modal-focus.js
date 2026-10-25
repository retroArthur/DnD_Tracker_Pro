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
 *    SIE AUS DEM SELEKTOR ZU NEHMEN REICHTE ABER NICHT — Befund von Runde 1.
 *    Die Falle haengt am DOKUMENT in der CAPTURE-Phase und laeuft damit VOR
 *    dem Lauscher der Palette; aus dem Selektor genommen heisst nicht aus der
 *    WIRKUNG genommen. Darum zieht sich `_tab()` jetzt ausdruecklich zurueck,
 *    solange die Palette offen ist (siehe `hoehereBlendeOffen`).
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
 * DIE EINE BLENDE, DIE UEBER EINEM DIALOG LIEGT UND IHRE TASTATUR SELBST
 * FUEHRT: die Befehlspalette.
 *
 * WAS GEMESSEN WAR (Befund von Runde 1, gefuellte Kampagne, nur echte
 * Tastendruecke). Dialog offen, dann Strg+Shift+K: die Palette geht auf, der
 * Fokus landet in ihrem Eingabefeld, Tippen kommt an. Der ERSTE echte
 * Tabulatordruck zog den Fokus aber in den Dialog DARUNTER — 4 von 4 Halten
 * im Dialog, alle 4 laut `elementFromPoint` VERDECKT (z-index beider Schichten
 * 1000, die Palette steht spaeter im Dokument), und Enter darauf aenderte
 * `data-theme` dark -> sepia. Eine Einstellungsaenderung an einem
 * Bedienelement, das der Spielleiter nicht sieht.
 *
 * A/B-Gegenprobe, die die Ursache festnagelt: `window.ModalFocus._tab` zur
 * Laufzeit stillgelegt — dieselben Tabulatordruecke bleiben zuerst IN der
 * Palette und laufen ihre eigene Trefferliste ab. Die Falle war die Ursache,
 * nicht die Palette.
 *
 * WARUM DER RUECKZUG NICHT AM FOKUS HAENGT, sondern an der Blende. Ein
 * `activeElement.closest('.cp-overlay.cp-visible')` greift nur, solange der
 * Fokus noch IN der Palette liegt. Gemessen: nachdem der Tabulator die
 * Trefferliste der Palette abgelaufen ist, fuehrt er ueber `<body>` weiter
 * (so war es auch vor dieser Datei). Beim naechsten Anschlag waere
 * `activeElement` dann nicht mehr in der Palette, die Falle wuerde greifen
 * und den Fokus in den verdeckten Dialog ziehen — derselbe Fehler, nur einen
 * Anschlag spaeter. Darum entscheidet die offene Blende, nicht der Fokus.
 *
 * WARUM `.shortcuts-overlay.show` NICHT IN DIESEN SELEKTOR GEHOERT, WOHL ABER
 * IN DIE FALLE — und warum die frueher hier stehende Begruendung ("die Blende
 * hat keine eigenen Haltepunkte, es gibt nichts zu entziehen") nicht mehr
 * traegt. Jene Messung lief in EINER Lage: Tastenhilfe UEBER einem offenen
 * Dialog. Dort war sie richtig — mit UND ohne Falle landeten 4 von 4
 * Spruengen im verdeckten Dialog, der Befund war vorbestehend. Nur ist das
 * nicht die Lage, die der Spielleiter herstellt: er drueckt `?` und hat NUR
 * die Hilfe offen, und seit der Fokusuebergabe von HILF Fall (7) liegt der
 * Fokus dabei in ihr. Nachgemessen am gebauten Buendel (1440x900, echte
 * Tastendruecke): 44 von 45 Tabulatorspruengen verliessen die offene Hilfe,
 * 35 davon landeten auf einem Ziel, das die Blende verdeckt
 * (`document.elementFromPoint` ueber der Mitte liefert
 * `DIV.shortcuts-overlay`), waehrend die Hilfe sichtbar offen blieb;
 * Shift+Tab 10 von 10. Von 109 sichtbaren Haltepunkten der Seite lag genau
 * EINER in der Hilfe. Und die Hilfe DRUCKT die Zusage selbst: "Naechstes
 * Bedienelement (im Dialog bleibt er darin)". Eine falsche Hilfe ist
 * schlimmer als eine fehlende.
 *
 * SIE KOMMT DARUM IN DIE FALLE, ABER NICHT IN `oberstesModal()`. Der
 * Unterschied ist nicht Kosmetik: `oberstesModal()` beantwortet die Frage
 * "welche SCHALE ist offen" und wird ausserhalb dieser Datei als genau das
 * gelesen — der Escape-Zweig in `systems/spellslots/keyboard-shortcuts.js`
 * schliesst damit ueber `hideModal(m.id)`, und die vierte Schranke des
 * HP-Kuerzels verweigert damit einen Dialog ueber einem Dialog. Die Hilfe
 * ist keine Schale: sie hat ihr eigenes `hideShortcutsOverlay()` (es nimmt
 * das `tabindex` von der Flaeche zurueck) und wird im Escape-Zweig schon
 * eine Stufe vorher behandelt. Haengte man sie in `oberstesModal()`, erbte
 * sie stillschweigend beide fremden Bedeutungen.
 *
 * `offeneTastenhilfe()` ist darum ein eigener, danebenstehender Griff, und
 * `_tab()` fragt ihn ZUERST: liegt die Hilfe offen, gehoert der Tabulator
 * ihr — auch dann, wenn darunter noch eine Schale steht. Das ist die
 * Schichtung des Bildschirms (z-index 2000 gegen 1000) und zugleich die
 * Lage, die der HP-Befund von Runde 2 als Fehler festgehalten hat: ein
 * Dialog UNTER der Hilfe ist nichts, dessen Tabulatorreihe man noch bedienen
 * soll.
 *
 * NICHT BETROFFEN, und auch das ist gemessen: die Schnell-Referenz (`/`).
 * Ihr Panel liegt mit z-index 600 UNTER der Dialogflaeche (1000), und ohne
 * Falle sind ihre Reiter verdeckt erreichbar — dort VERBESSERT die Falle die
 * Lage.
 *
 * KOSTEN, gemessen in der Party-Ansicht bei zwanzig Eintraegen je Typ
 * (9147 Knoten), je Tabulatordruck:
 *
 *   querySelector('.cp-overlay.cp-visible')             8,05 us
 *   activeElement.closest(…)                            0,05 us
 *   lebende Sammlung + classList (diese Fassung)   unter der Messgrenze
 *
 * Dieselbe Begruendung wie bei den Schalen, und derselbe Fehler, den
 * f391b0b gerade behoben hat. Der Zweig steht ausserdem HINTER
 * `oberstesModal()`: ohne offenen Dialog kostet er gar nichts, und die
 * gemessene 1,5-us-Bilanz des Normalfalls bleibt unberuehrt.
 */
const BLENDEN_KLASSE = 'cp-overlay';
const BLENDE_OFFEN_KLASSE = 'cp-visible';
const blendenSammlung = document.getElementsByClassName(BLENDEN_KLASSE);

/**
 * Die Tastenhilfe (`?`). Begruendung, Messwerte und die Abgrenzung zu
 * `oberstesModal()` stehen im Block oben; bewacht von Fall (13) in
 * `tests/e2e/features/tastenhilfe.spec.js`.
 *
 * Als lebende Sammlung plus `classList`, aus demselben gemessenen Grund wie
 * die Schalen und die Palette daneben: der Griff laeuft bei JEDEM
 * Tabulatordruck der ganzen App. Sie enthaelt genau einen Knoten, und `show`
 * muss mitgeprueft werden — die Blende liegt dauerhaft im Dokument und ist
 * geschlossen nur ueber `opacity: 0` und `pointer-events: none` verborgen.
 */
const TASTENHILFE_KLASSE = 'shortcuts-overlay';
const tastenhilfeSammlung = document.getElementsByClassName(TASTENHILFE_KLASSE);

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
 * Die KENNUNG des Oeffners, neben seinem Knoten.
 *
 * WARUM DER KNOTEN ALLEIN NICHT REICHT — Befund von Runde 1, gemessen und
 * nicht vermutet. Der Rueckweg fiel genau dort aus, wo der Dialog etwas TUT.
 * Am Lebenspunkte-Rechner: 42 echte Tabulatorspruenge bis "➗" am Kaempfer 1,
 * Enter, "7" tippen, Tab, Enter — `currentHp` 30 -> 23, Wirkung korrekt und
 * genau einmal. Aber `applyHpChange()` ruft `renderInit()`
 * (`systems/hp-calculator.js:69-71`), die Kampfliste wird neu gezeichnet, und
 * `document.contains(oeffner)` ist schon VOR dem Escape false. Der Knopf ist
 * weg, ein GLEICHWERTIGER steht an seiner Stelle. Der Fokus landete auf
 * `<body>`, und von dort waren es 47 weitere echte Tabulatorspruenge, bis
 * wieder irgendein Rechner-Knopf erreicht war.
 *
 * Der Kontrollfall isoliert den Mechanismus: derselbe Dialog, sofort Escape,
 * ohne etwas zu tun — da kehrt der Fokus zurueck. Es ist also nicht der
 * Dialog, sondern seine Wirkung. Und es ist kein Einzelfall des
 * Lebenspunkte-Rechners: jeder Dialog, dessen Aktion eine Liste neu zeichnet,
 * zerstoert seinen eigenen Oeffner, wenn der Oeffner in dieser Liste steht.
 *
 * WAS "GLEICHWERTIG" HEISST, und warum es keine Heuristik ist. Der Verteiler
 * baut aus `data-action`, `data-id`, `data-type` und `data-value` das
 * Kontextobjekt, mit dem die Aktion laeuft (`ui/event-delegation.js:111-117`).
 * Zwei Elemente mit identischen vier Werten loesen also dieselbe Handlung mit
 * demselben Ziel aus — sie sind austauschbar, bis auf `ctx.target`. Darum ist
 * der Rueckfall eine Gleichheitspruefung auf genau diese vier Werte und keine
 * Suche nach Text, Klasse oder Position. Treffen mehrere, gewinnt der erste
 * sichtbare in Dokumentreihenfolge; sie sind nach dieser Definition
 * ohnehin austauschbar.
 *
 * Ein Oeffner OHNE `data-action` (ein Kopfzeilen-Element etwa, oder ein Aufruf
 * aus der Konsole) bekommt keine Kennung und damit keinen Rueckfall — dort
 * bleibt es beim alten Verhalten: der Fokus bleibt, wo er ist.
 * @type {WeakMap<Element, {aktion: string, id: string, typ: string, wert: string}>}
 */
const oeffnerKennung = new WeakMap();

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
     * Die offene Tastenhilfe, oder `null`. Sie ist KEINE Schale und steht
     * darum nicht in `oberstesModal()` — Begruendung und Messwerte an
     * `TASTENHILFE_KLASSE`.
     * @returns {Element|null}
     */
    offeneTastenhilfe() {
        for (let i = 0; i < tastenhilfeSammlung.length; i++) {
            const n = tastenhilfeSammlung[i];
            if (!n.classList.contains('show')) continue;
            const s = getComputedStyle(n);
            if (s.display !== 'none' && s.visibility !== 'hidden') return n;
        }
        return null;
    },

    /**
     * Liegt eine Blende ueber dem Dialog, die ihre Tastatur selbst fuehrt?
     * Dann gehoert der Tabulator ihr. Begruendung und Messung an
     * `BLENDEN_KLASSE`.
     * @returns {boolean}
     */
    hoehereBlendeOffen() {
        for (let i = 0; i < blendenSammlung.length; i++) {
            if (blendenSammlung[i].classList.contains(BLENDE_OFFEN_KLASSE)) return true;
        }
        return false;
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
            // Neben dem Knoten die Kennung, fuer den Fall, dass der Dialog
            // seinen eigenen Oeffner neu zeichnen laesst. Begruendung an
            // `oeffnerKennung`.
            const aktion = a.dataset ? a.dataset.action || '' : '';
            if (aktion) {
                oeffnerKennung.set(m, {
                    aktion,
                    id: a.dataset.id || '',
                    typ: a.dataset.type || '',
                    wert: a.dataset.value || ''
                });
            } else {
                oeffnerKennung.delete(m);
            }
        } else {
            // Kein Oeffner (Aufruf aus der Konsole, aus einem Kuerzel oder
            // beim Start). Einen alten Eintrag wegnehmen, sonst gibt der
            // Dialog den Fokus an einen Oeffner von vorletztem Mal zurueck.
            oeffnerVon.delete(m);
            oeffnerKennung.delete(m);
        }
    },

    /**
     * Der gleichwertige Oeffner zu einer Kennung, oder `null`.
     *
     * EINE ABFRAGE, UND ZWAR GENAU EINMAL JE SCHLIESSVORGANG. Hier ist ein
     * `querySelectorAll` ausdruecklich richtig — anders als in `_tab()`, das
     * bei JEDEM Tabulatordruck der ganzen App laeuft. Gemessen in der
     * Party-Ansicht bei zwanzig Eintraegen je Typ (9147 Knoten,
     * 2033 `[data-action]`-Stellen): 176 us. Einmal beim Schliessen eines
     * Dialogs, nicht je Anschlag — fuer einen Menschen unsichtbar.
     *
     * Verglichen wird in JavaScript und NICHT ueber einen zusammengebauten
     * Selektor: `data-id` und `data-value` kommen aus dem DOM, und ein
     * Anfuehrungszeichen darin waere ein Syntaxfehler im Selektor. Eine
     * Gleichheitspruefung auf `dataset` kann das nicht passieren.
     * @param {{aktion: string, id: string, typ: string, wert: string}|undefined} k
     * @returns {Element|null}
     */
    sucheGleichwertigen(k) {
        if (!k || !k.aktion) return null;
        const alle = document.querySelectorAll('[data-action]');
        for (let i = 0; i < alle.length; i++) {
            const kandidat = alle[i];
            const d = kandidat.dataset;
            if (d.action !== k.aktion) continue;
            if ((d.id || '') !== k.id) continue;
            if ((d.type || '') !== k.typ) continue;
            if ((d.value || '') !== k.wert) continue;
            if (typeof kandidat.focus !== 'function') continue;
            if (!this.sichtbar(kandidat)) continue;
            return kandidat;
        }
        return null;
    },

    /**
     * EINMAL NACHFASSEN, nachdem der Fokus gesetzt ist.
     *
     * WARUM ES DAS BRAUCHT — Befund von Runde 2, gemessen und nicht vermutet.
     * Die zwei Stufen in `kehreZurueck()` deckten nur EINE der beiden
     * Reihenfolgen ab. Die andere ist die haeufigere: der Dialog schliesst
     * SICH SELBST und zeichnet DANACH neu. `saveCustomEffect()` tut genau das
     * — `hideModal('effect-modal')`, dann `renderInit()`
     * (initiative-combat-widgets.js:97/98). Dann laeuft `kehreZurueck()` noch
     * VOR dem Neuzeichnen, Stufe 1 greift korrekt, und das DANACH laufende
     * Neuzeichnen zerstoert den gerade fokussierten Knoten. Stufe 2 kann dort
     * nichts retten: sie laeuft nur, wenn der Knoten beim Schliessen schon
     * fehlte.
     *
     * Gemessen am gebauten Buendel, gefuellte Kampagne, 1440 px, nur echte
     * Tastendruecke, beide Groessen identisch (Ausgangslage HEAD b6a7f37):
     *
     *   Initiative / Effekt-Dialog     Fokus auf BODY,  6 weitere echte Tabs
     *   Party / Zustands-Dialog        Fokus auf BODY, 13 weitere echte Tabs
     *   Kontrollarm (Escape, ohne Wirkung)   Fokus auf dem Oeffner, 0 Tabs
     *
     * Die Spur am Haken nagelt die Reihenfolge fest: "nach kehreZurueck:
     * BUTTON[show-add-effect], Fokusknoten im Dokument=true", dann "Mikrotask
     * danach: BODY, gemerkter Knoten im Dokument=false".
     *
     * BREITE: 26 Aufrufstellen im Quellbaum rufen `hideModal(...)` und
     * innerhalb von sechs Zeilen danach eine `render*()`-Funktion (eigener
     * statischer Lauf ueber features/, systems/, ui/), u. a.
     * initiative-combat-widgets.js:97/408/650, conditions.js:86,
     * rest-manager.js:258, render-loot.js:201, render-spells.js:296,
     * random-tables.js:573, shops-core.js:317/788.
     *
     * WARUM EIN MIKROTASK UND KEIN `requestAnimationFrame`. Beide wurden am
     * echten Weg gegeneinander gemessen (Effekt-Dialog, beide Groessen, nur
     * echte Tastendruecke): BEIDE greifen, beide landen auf dem
     * gleichwertigen Knopf, und in beiden greift der Zweig im Kontrollarm
     * NICHT (0 Griffe bei Escape ohne Wirkung). Der Mikrotask gewinnt aus
     * zwei Gruenden: er laeuft einen Rahmen FRUEHER — der Fokus liegt also
     * keinen Bildaufbau lang auf `<body>` — und er laeuft auch dann, wenn
     * `requestAnimationFrame` gedrosselt ist. Die naechste Stufe nach dem
     * Mikrotask waere ein eigener Task (`setTimeout`); die braeuchte es nur,
     * wenn eine Aufrufstelle das Neuzeichnen VERZOEGERT. Nachgesehen: unter
     * allen Stellen, die hinter `hideModal(...)` ein `setTimeout` oder
     * `requestAnimationFrame` stehen haben, ist genau eine
     * (`systems/undo.js:752`), und die zeichnet nicht neu, sondern wechselt
     * die Ansicht — ihr Rumpf ist ausserdem nachweislich toter Code. Also
     * gibt es dafuer keinen gemessenen Fall und folglich keinen Zweig.
     *
     * KOSTEN, am echten Weg gemessen, je Schliessvorgang GENAU EINMAL:
     *
     *   Pruefung greift NICHT (der haeufige Fall)       0,000 ms
     *   Pruefung greift (Suche + focus)        bis zu   1,8  ms
     *
     * Der haeufige Fall kostet nichts, weil die Pruefung mit zwei Vergleichen
     * abbricht: `sucheGleichwertigen()` wird erst gerufen, wenn der Fokus
     * wirklich auf `<body>` gefallen und der gesetzte Knoten wirklich weg
     * ist. Der `_tab()`-Zweig, der bei JEDEM Tabulatordruck der ganzen App
     * laeuft, ist davon vollstaendig unberuehrt — hier haengt nichts am
     * Tastendruck, sondern am Schliessen eines Dialogs.
     *
     * DIE ZWEI BEDINGUNGEN SIND BEIDE TRAGEND, und zwar als UND:
     *
     *  - `activeElement` auf `<body>`/`<html>`: damit sind die Faelle
     *    ausgenommen, in denen ein Oeffner oder eine Renderfunktion den Fokus
     *    BEWUSST selbst woanders hinsetzt. Dort wird nichts ueberschrieben.
     *  - der gesetzte Knoten ist nicht mehr im Dokument: nur das ist der
     *    gemessene Schaden. Steht er noch (und ist nur unsichtbar geworden),
     *    darf er nicht durch einen fremden sichtbaren ersetzt werden — das
     *    ist dieselbe Begruendung, aus der Stufe 2 hinter Stufe 1 steht.
     *
     * Ohne Kennung (ein Oeffner ohne `data-action`) gibt es nichts zu suchen;
     * dann wird kein Mikrotask geplant.
     * @param {Element} gesetzt Der Knoten, den `kehreZurueck()` fokussiert hat.
     * @param {{aktion: string, id: string, typ: string, wert: string}|undefined} kennung
     */
    _nachfassen(gesetzt, kennung) {
        if (!gesetzt || !kennung || !kennung.aktion) return;
        Promise.resolve().then(() => {
            const a = document.activeElement;
            if (a !== document.body && a !== document.documentElement) return;
            if (document.contains(gesetzt)) return;
            const ersatz = this.sucheGleichwertigen(kennung);
            if (ersatz) ersatz.focus();
        });
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
     * Der Rueckweg: Fokus auf den Oeffner.
     *
     * ZWEI STUFEN, und die zweite ist der Befund von Runde 1. Steht der
     * gemerkte Knoten noch im Dokument, bekommt er den Fokus. Ist er weg,
     * weil die Aktion des Dialogs seine Liste neu gezeichnet hat, wird der
     * GLEICHWERTIGE an derselben Stelle gesucht (dieselbe `data-action`,
     * `data-id`, `data-type`, `data-value`). Erst wenn auch der fehlt,
     * bleibt der Fokus, wo er ist — statt irgendwohin zu springen.
     *
     * UND DANACH EINMAL NACHFASSEN, der Befund von Runde 2. Die zwei Stufen
     * oben entscheiden nach dem Zustand ZUM ZEITPUNKT DES SCHLIESSENS — und
     * bei der haeufigeren der beiden Reihenfolgen (`hideModal()` zuerst,
     * `render*()` danach) ist der Oeffner da noch vollstaendig in Ordnung und
     * verschwindet erst danach. Begruendung, Messung und die Wahl des
     * Zeitpunkts stehen an `_nachfassen()`.
     *
     * Beide Stufen fassen nach, nicht nur die erste: es ist derselbe Aufruf,
     * die Pruefung ist in sich begrenzt (sie greift nur, wenn der von IHR
     * gesetzte Knoten verschwunden ist), und auch ein Dialog, der nach dem
     * Schliessen ZWEIMAL zeichnet, bleibt damit versorgt. Nachgefasst wird
     * genau einmal je Schliessvorgang; `_nachfassen()` plant sich nicht
     * selbst neu.
     * @param {Element} m
     */
    kehreZurueck(m) {
        if (!m) return;
        // Alle Eintraege abraeumen: so gilt "hat eine Oeffnungsnummer" genau
        // so lange, wie die Schale offen ist.
        oeffnungsNr.delete(m);
        const ziel = oeffnerVon.get(m);
        const kennung = oeffnerKennung.get(m);
        oeffnerVon.delete(m);
        oeffnerKennung.delete(m);
        // Stufe 1: der gemerkte Knoten, falls er noch steht und sichtbar ist.
        if (ziel && document.contains(ziel) && typeof ziel.focus === 'function') {
            if (!this.sichtbar(ziel)) return;
            ziel.focus();
            this._nachfassen(ziel, kennung);
            return;
        }
        // Stufe 2: der gleichwertige Knopf an derselben Stelle. OHNE Stufe 1
        // waere das falsch — ein noch stehender, nur unsichtbarer Oeffner
        // darf nicht durch einen fremden sichtbaren ersetzt werden.
        if (!ziel) return;
        const ersatz = this.sucheGleichwertigen(kennung);
        if (ersatz) {
            ersatz.focus();
            this._nachfassen(ersatz, kennung);
        }
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
        // DIE TASTENHILFE ZUERST, und zwar VOR `oberstesModal()`: liegt sie
        // offen, gehoert der Tabulator ihr, auch wenn darunter eine Schale
        // steht (z-index 2000 gegen 1000). Sie ist keine Schale und steht
        // darum nicht in `oberstesModal()` — die ganze Begruendung samt
        // Messwerten an `TASTENHILFE_KLASSE`, bewacht von Fall (13) in
        // `tests/e2e/features/tastenhilfe.spec.js`.
        const hilfe = this.offeneTastenhilfe();
        const m = hilfe || this.oberstesModal();
        if (!m) return;
        // EINE BLENDE UEBER DEM DIALOG BEHAELT DEN TABULATOR. Dieser Zweig
        // steht VOR jedem `preventDefault()` — der Anschlag geht unveraendert
        // an die Blende weiter. Begruendung, A/B-Gegenprobe und Kosten an
        // `BLENDEN_KLASSE`; bewacht von Fall (k) in
        // `tests/e2e/features/modal-fokus.spec.js`.
        if (this.hoehereBlendeOffen()) return;
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
     * @returns {{ aktiv: boolean, offen: string|null, tastenhilfe: boolean,
     *             haltepunkte: number, blende: boolean }}
     */
    statistik() {
        const hilfe = this.offeneTastenhilfe();
        const m = hilfe || this.oberstesModal();
        return {
            aktiv: !!this._eingehaengt,
            offen: m ? m.id || '(ohne id)' : null,
            // `true` heisst: die Tastenhilfe fuehrt den Tabulator, nicht
            // eine Schale. Sie steht nicht in `oberstesModal()` — darum
            // diese eigene Zeile, damit eine Messung die Lage unterscheiden
            // kann, ohne den Selektor abzutippen.
            tastenhilfe: !!hilfe,
            haltepunkte: m ? this.haltepunkte(m).length : 0,
            // `true` heisst: eine hoehere Schicht hat den Tabulator, die
            // Falle ist gerade bewusst inert.
            blende: this.hoehereBlendeOffen()
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
