// [SECTION:KEYBOARD_GROUP_VIEWS]
// ============================================================
// DIE GRUPPEN DER ANSICHTEN — ANMELDUNG, KEINE MECHANIK
// @tabindex @role @keyboard @aria
// ============================================================
//
// WAS HIER PASSIERT, IN EINEM SATZ: diese Datei meldet die Reihen
// gleichartiger Bedienstellen der 19 Vorbereitungsansichten (und eine
// nachgetragene der Party) bei `KeyboardGroup` an — und bringt selbst
// keine Zeile Tastaturlogik mit.
//
// WARUM SIE EINE EIGENE DATEI IST. `ui/keyboard-group.js` hat
// `registriere()` ausdruecklich als den Weg gebaut, "auf dem die
// Vorbereitungsansichten dazukommen, ohne diese Datei zu veraendern". Das
// ist hier eingehalten: die Mechanik (wandernder Tabindex, Pfeiltasten,
// Haltgedaechtnis, Fokusrueckgabe) bleibt unberuehrt, hier stehen nur
// Selektoren, Achsen und Beschriftungen.
//
// WARUM ES DAS BRAUCHT — DIE TABULATORFLUT, GEMESSEN. `ui/keyboard-reach.js`
// hat mit E-2 seine Ansichtsgrenze verloren; ohne Gruppen bekaeme damit
// jede Listenzeile und jede Filtermarke ihren eigenen Halt. Gemessen am
// gebauten Buendel, gefuellte Kampagne, 20 Eintraege je Typ, 1440 px,
// echte Tastendruecke:
//
//                      Halte vorher   ohne Gruppen   mit Gruppen
//   Auftraege                48            108            69
//   Beute                    30             60            32
//   NSC                      37             63            39
//   Zauber                   32             58            35
//   Laeden                   90            110            91
//   Fraktionen               67             87            68
//   Bestiarium (112 Zeilen)  46            253            31
//   Party (Kampfansicht)    351            351           231
//
// Die Spalte "ohne Gruppen" ist nicht hypothetisch: sie ist der Zustand,
// den die gefallene Schranke ohne diese Datei herstellen WUERDE, und fuer
// das Bestiarium ist sie nachgestellt gemessen (252 Anschlaege bis zur
// Schnell-Referenz, bei 400 ms je Anschlag 1,7 min).
//
// DIE ACHSEN SIND GEMESSEN, NICHT GEFUEHLT. Je Behaelter die Zahl der
// y-Linien und der Abstand der ersten zwei Glieder, bei 1440, 900, 680 UND
// 375 px:
//
//   #quests-list      > toggle-quest          20 Zeilen, dx 0, dy 60/60/72/101  -> senkrecht
//   [data-tastgruppe] > toggle-quest-status    1 Zeile,  dx 71, dy 0 (alle vier) -> waagerecht
//   #loot-list        > select-loot           20 Zeilen, dx 0, dy 80            -> senkrecht
//   #loot-filters     > set-loot-filter        1 Zeile,  dx 49, dy 0            -> waagerecht
//   #npc-list         > select-npc            20 Zeilen, dx 0, dy 80            -> senkrecht
//   #npc-filters      > set-npc-filter         1 Zeile,  dx 49, dy 0            -> waagerecht
//   #spell-level-filters  > spell-level-filter 1 Zeile,  dx 40, dy 0            -> waagerecht
//   #spell-school-filters > spell-school-...   1 Zeile,  dx 40, dy 0            -> waagerecht
//   #spell-filters    > set-spell-filter       1 Zeile,  dx 51, dy 0            -> waagerecht
//   #encounter-list   > select-encounter      20 Zeilen, dx 0, dy 72/72/72/68   -> senkrecht
//   #locations-list   > select-location       20 Zeilen, dx 0, dy 80            -> senkrecht
//   #fr-list          > select-fraktion       20 Zeilen, dx 0, dy 85            -> senkrecht
//   #shop-list        > toggle-shop           20 Zeilen, dx 0, dy 79/79/83/83   -> senkrecht
//   #bestiary-list    > bestiary-select       17 Zeilen, dx 0, dy 56            -> senkrecht
//   .spell-slots-compact > .slot-pip           1 Zeile,  dx 18, dy 0            -> waagerecht
//
// NACHGETRAGEN IN RUNDE 3, aus den Befunden 1 bis 3 der Gegenpruefung
// (gemessen bei 1440, 900, 390 UND 360 px):
//
//   #spell-list       > toggle-spell-card     30 Karten, 1440/900: dx 406, dy 0
//                                                        390/360:  dx 0, dy 100
//                                             -> GEMESSEN, siehe unten
//   .wiki-tree-items  > select-wiki-entry     20 Zeilen, dx 0, dy 30 (alle vier) -> senkrecht
//   .si-list          > toggle-shop-item      15 Zeilen, dx 0, dy 42/42/58/58    -> senkrecht
//   .shop-category-tabs > filter-shop-category 1 Zeile,  dx 91, dy 0 (alle vier) -> waagerecht
//
// DAS ZAUBERGITTER IST DIE EINE AUSNAHME von "die Achse steht fest": seine
// Spaltenzahl haengt an der Fensterbreite (drei Spalten bei 1440, zwei bei
// 900, eine bei 390). Es traegt darum `achse: achseNachGestalt` und misst
// die Achse bei jedem Durchlauf; Begruendung bei `_achse()` in
// `ui/keyboard-group.js`. Eine feste Achse waere hier auf jeder Breite zur
// Haelfte eine Falschaussage gegenueber dem Vorleseprogramm.
//
// DIE DREI ZUSTAENDE, DIE DIE PRUEFSAAT NICHT HERSTELLT, und darum war
// diese Flut in Runde 2 unsichtbar — keine Zauber im Bestand, keine
// aufgeklappte Wiki-Kategorie, kein Laden mit Artikeln:
//
//                                      Halte ohne Gruppe   mit Gruppe
//   Zauber, SRD geladen (75 Zauber)           65               36
//   Wiki, eine Kategorie offen                50               31
//   Laden mit 15 Artikeln, offen             158              142
//
// Der Handgriff dahinter, ganz mit echten Tasten und vom Ladenkopf an
// gezaehlt: den letzten Artikel eines Ladens loeschen kostete 69
// Anschlaege ohne die Artikelgruppe und 53 mit ihr. Vor E-2 gab es diesen
// Weg nicht — der Ladenkopf war in 120 Anschlaegen nicht erreichbar.
//
// DER ZUSTAND GEHOERT ZUR GRUPPE. Jede Art traegt ein `zustand`, das EIN
// ARIA-Attribut am Glied fuehrt: `aria-pressed` an Filtermarken,
// `aria-current` an der ausgewaehlten Listenzeile (und NUR an ihr),
// `aria-expanded` an Aufklappkoepfen. Vorher steckte diese Auskunft allein
// in der CSS-Klasse (`active`, `selected`, `expanded`) und war fuer ein
// Vorleseprogramm nicht vorhanden. Ausnahme mit Grund: die Party-Punkte
// tragen ihren Zustand schon im `title`.
//
// EINE EINSCHRAENKUNG, DIE IN DIE AKTE GEHOERT: bei 375 px brechen die
// Zauberleisten um (`spell-level-filters` 11 Marken auf 2 Zeilen,
// `spell-school-filters` 9 auf 2). Die Achse bleibt trotzdem waagerecht,
// weil die DOM-Reihenfolge der Leseordnung folgt und Links/Rechts damit
// ueber den Umbruch hinweg "naechste Marke" bedeutet. Oben/Unten bliebe in
// einer umgebrochenen Leiste ohnehin ohne eindeutige Antwort; mit
// `vertical` waere stattdessen Links/Rechts verloren, und das ist die
// Richtung, in der neun von elf Marken nebeneinander liegen.
//
// WAS AUSDRUECKLICH KEINE GRUPPE IST, und warum:
//
//  1. DIE DREI EINZELSTELLEN. `switch-campaign` (Daten),
//     `toggle-collapse` (Notizen, Begegnungen) und `toggle-wiki-category`
//     (Wiki) sind je Ansicht genau EINE sichtbare Stelle. Sie brauchen
//     einen eigenen Halt und sonst nichts; die Nachruestung gibt ihnen den.
//     Eine Gruppe aus einem Glied waere eine Rolle ohne Verhalten — und
//     `role="toolbar"` auf einem Aufklappkopf behauptet eine Leiste, die
//     ein Vorleseprogramm dann vergeblich mit Pfeiltasten absucht.
//
//  2. NATIVE BEDIENELEMENTE. Keine Gruppe fasst `<button>`, `<a href>`
//     oder `<select>` zusammen. Das ist die Linie, die Einheit 1 gezogen
//     hat (`.init-slot-box` und `.death-save-dot` sind beide `span`), und
//     sie ist die richtige: bei einem `div` GIBT die Gruppe Reichweite, wo
//     vorher keine war; bei einem `<button>` NAEHME sie welche weg. Wer
//     die Pfeiltastenregel nicht kennt, verliert damit einen Zugang, den
//     der Browser ihm seit immer gibt. Konkret betroffen und bewusst
//     gelassen: die 17 `button.bestiary-fav` (einer je Zeile), die zwei
//     Knoepfe je Fraktionskarte und die drei je Ladenkopf. Dass die
//     Favoritenknoepfe heute trotzdem unerreichbar waren, hat eine andere
//     Ursache — `ui/virtual-scroll.js`, und sie ist dort behoben.
//
//  3. DIE 40 AUFTRAGS-STATUSMARKEN ALS EINE GRUPPE. Sie sind 20 Gruppen
//     mit je zwei Marken, nicht eine mit vierzig: je Auftragszeile liegen
//     "Done" und "Loot" in einem eigenen Behaelter (dx 71, dy 0), zwischen
//     den Zeilen liegen 60 px. Eine Sammelgruppe waere eine Leiste, deren
//     Glieder in zwanzig verschiedenen Zeilen stehen.
//
// DER BEHAELTER DER AUFTRAGSMARKEN HATTE KEINEN NAMEN. Er stand als
// `<div style="display:flex; gap:6px; align-items:center;">` in
// `features/quests/quests-render.js` — weder Klasse noch id, also fuer
// keinen Selektor erreichbar. Er traegt jetzt `data-tastgruppe="auftrag-status"`.
// WARUM EIN `data-`-ATTRIBUT UND KEINE KLASSE: der Stil-Sollstand in
// `tests/e2e/features/computed-style-diff.spec.js` erfasst ausschliesslich
// Elemente mit mindestens einer Klasse und schluesselt sie als
// `tag.sortierteKlassen#index`. Eine Klasse auf einem bisher klassenlosen
// `div` erzeugt dort zwanzig NEUE Schluessel — eine Sollstandsaenderung
// fuer reine Kosmetik. Ein `data-`-Attribut aendert keinen Schluessel,
// keine Box und keine der zwoelf gehashten Eigenschaften, und es hat im
// Haus ein Vorbild: `data-tb` an jeder `.toolbar-group` steuert dort die
// Media-Query-Leiter. (`sanitizeHTML()` streicht `data-*` — das trifft
// diese Stelle nicht: die Auftragszeile wird als Ganze nicht durch den
// Reiniger geschickt, nur `q.description` darin, und `data-action` steht
// im selben Markup und ueberlebt seit immer.)
//
// DAS BESTIARIUM BRAUCHT KEINEN NEUEN NAMEN. Der Behaelter der Zeilen ist
// der `visibleContainer`, den `ui/virtual-scroll.js` zur Laufzeit erzeugt —
// klassenlos und nicht adressierbar. Als Gruppenbehaelter dient darum
// `div#bestiary-list` eine Ebene darueber: `querySelectorAll` findet die
// Zeilen durch den Zwischenknoten hindurch, und `closest()` findet von
// einer Zeile aus zurueck. Kein Eingriff in `VirtualScroll` noetig.

/**
 * Ist `el` hier und jetzt sichtbar? Dieselbe Regel wie in
 * `KeyboardGroup._bedienbar()` und in den Pruefdateien.
 * @param {Element} el
 * @returns {boolean}
 */
function tastSichtbar(el) {
    if (typeof el.checkVisibility === 'function') {
        return el.checkVisibility({
            opacityProperty: true,
            visibilityProperty: true,
            contentVisibilityAuto: true
        });
    }
    const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    return !!r && r.width > 0 && r.height > 0;
}

/**
 * DIE ACHSE AUS DER GESTALT — fuer die eine Reihe, deren Gestalt an der
 * Fensterbreite haengt.
 *
 * Die Regel ist woertlich die der Pruefung (Fall (7) in
 * `tastatur-reichweite.spec.js`): waagerecht heisst, die ersten zwei
 * SICHTBAREN Glieder liegen auf einer y-Linie (dy 0) und nebeneinander
 * (dx != 0); alles andere ist senkrecht. Weniger als zwei sichtbare
 * Glieder haben keine Gestalt — dann `vertical`, weil ein einzelnes Glied
 * ohnehin keine Fahrt kennt und eine Spalte die haeufigere Lage ist.
 * @param {Element[]} glieder
 * @returns {'horizontal'|'vertical'}
 */
function achseNachGestalt(glieder) {
    let a = null;
    for (const g of glieder) {
        if (!tastSichtbar(g)) continue;
        if (!a) {
            a = g.getBoundingClientRect();
            continue;
        }
        const b = g.getBoundingClientRect();
        const dx = Math.round(b.left - a.left);
        const dy = Math.round(b.top - a.top);
        return dy === 0 && dx !== 0 ? 'horizontal' : 'vertical';
    }
    return 'vertical';
}

/**
 * `aria-pressed` fuer eine Filtermarke: die Marke, die gerade filtert,
 * traegt im Markup die Klasse `active`.
 */
const MARKE_GEDRUECKT = {
    attribut: 'aria-pressed',
    wert: g => (g.classList.contains('active') ? 'true' : 'false')
};

/**
 * `aria-current` fuer eine Listenzeile. KEIN `aria-selected`: das ist an
 * `role="button"` nicht erlaubt, und Fall (7) in
 * `tastatur-gruppen.spec.js` prueft ausdruecklich, dass keine Auswahl
 * behauptet wird. Eine nicht gewaehlte Zeile traegt das Attribut GAR
 * NICHT (nicht `aria-current="false"`) — so ist es gedacht.
 * @param {string} klasse Die Klasse, die die Auswahl im Markup traegt
 */
const zeileAktuell = (klasse = 'selected') => ({
    attribut: 'aria-current',
    wert: g => (g.classList.contains(klasse) ? 'true' : null)
});

/**
 * `aria-expanded` fuer einen Aufklappkopf. Die Klasse sitzt nicht am Kopf,
 * sondern an der KARTE darueber (`.quest-item.expanded`,
 * `.shop-card.expanded`, `.spell-card.expanded`, `.si-item.expanded`) —
 * darum ein `closest()`.
 * @param {string} selektor Die aufklappbare Karte
 */
const kopfAufgeklappt = selektor => ({
    attribut: 'aria-expanded',
    wert: g => {
        const karte = g.closest(selektor);
        return karte && karte.classList.contains('expanded') ? 'true' : 'false';
    }
});

/**
 * Die Gruppen, die diese Datei anmeldet.
 *
 * `behaelter` ist der tiefste gemeinsame DOM-Behaelter der Reihe,
 * `glied` waehlt die Glieder DARIN (auch ueber Zwischenknoten hinweg),
 * `achse` ist gemessen (siehe Tabelle im Kopf), `beschriftung` wird zum
 * `aria-label` der Leiste, `zustand` zum einen ARIA-Attribut, das den
 * Zustand des Glieds traegt.
 *
 * DIE GLIEDER SIND UEBER `data-action` GEWAEHLT, NICHT UEBER DIE KLASSE.
 * Beides waere moeglich; `data-action` ist das staerkere Merkmal, weil es
 * die BEDIENUNG benennt. Gemessen: `div.loot-item` und
 * `div.loot-item.selected` sind dieselbe Reihe, aber zwei Klassenlisten —
 * ein klassenbasierter Selektor haette die ausgewaehlte Zeile aus ihrer
 * eigenen Gruppe geworfen. Zwei Ausnahmen: `.slot-pip` und (im Bestiarium)
 * die Zeile, deren `data-action` eindeutig ist.
 */
const ANSICHTSGRUPPEN = [
    // ---- AUFTRAEGE ----
    {
        name: 'auftragszeilen',
        behaelter: 'div#quests-list',
        glied: '[data-action="toggle-quest"]',
        achse: 'vertical',
        beschriftung: () => 'Auftraege',
        zustand: kopfAufgeklappt('.quest-item')
    },
    {
        // Je Auftragszeile eine eigene Leiste mit zwei Marken.
        name: 'auftragsmarken',
        behaelter: '[data-tastgruppe="auftrag-status"]',
        glied: '[data-action="toggle-quest-status-stop"]',
        achse: 'horizontal',
        beschriftung: () => 'Auftragsstatus',
        zustand: {
            // Die Marke traegt im Markup `color-green`, wenn der Haken sitzt.
            attribut: 'aria-pressed',
            wert: g => (g.classList.contains('color-green') ? 'true' : 'false')
        }
    },

    // ---- BEUTE ----
    {
        name: 'beutezeilen',
        behaelter: 'div#loot-list',
        glied: '[data-action="select-loot"]',
        achse: 'vertical',
        beschriftung: () => 'Beute',
        zustand: zeileAktuell()
    },
    {
        name: 'beutefilter',
        behaelter: 'div#loot-filters',
        glied: '[data-action="set-loot-filter"]',
        achse: 'horizontal',
        beschriftung: () => 'Beutefilter',
        zustand: MARKE_GEDRUECKT
    },

    // ---- NSC ----
    {
        name: 'nscZeilen',
        behaelter: 'div#npc-list',
        glied: '[data-action="select-npc"]',
        achse: 'vertical',
        beschriftung: () => 'Nichtspielercharaktere',
        zustand: zeileAktuell()
    },
    {
        name: 'nscFilter',
        behaelter: 'div#npc-filters',
        glied: '[data-action="set-npc-filter"]',
        achse: 'horizontal',
        beschriftung: () => 'NSC-Filter',
        zustand: MARKE_GEDRUECKT
    },

    // ---- ZAUBER: DREI getrennte Leisten, drei Behaelter, drei Gruppen ----
    {
        name: 'zaubergrade',
        behaelter: 'div#spell-level-filters',
        glied: '[data-action="spell-level-filter"]',
        achse: 'horizontal',
        beschriftung: () => 'Zaubergrade',
        zustand: MARKE_GEDRUECKT
    },
    {
        name: 'zauberschulen',
        behaelter: 'div#spell-school-filters',
        glied: '[data-action="spell-school-filter"]',
        achse: 'horizontal',
        beschriftung: () => 'Zauberschulen',
        zustand: MARKE_GEDRUECKT
    },
    {
        name: 'zauberklassen',
        behaelter: 'div#spell-filters',
        glied: '[data-action="set-spell-filter"]',
        achse: 'horizontal',
        beschriftung: () => 'Zauberklassen',
        zustand: MARKE_GEDRUECKT
    },
    {
        // DIE ZAUBERKARTEN — nachgetragen in Runde 3, Befund 1 der
        // Gegenpruefung, und der Grund, warum er erst dort gefunden wurde,
        // steht in der SAAT und nicht in der Mechanik: jede Pruefsaat
        // dieses Strangs fuehrt `spells: []`, und in einer leeren
        // Zauberansicht gibt es keine Karte. Sobald der Spielleiter auf
        // "📚 SRD" drueckt, stehen 75 Zauber im Bestand und 30 Karten auf
        // Seite 1 — jede mit `tabindex="0"` und jede ein eigener Halt.
        // Gemessen am gebauten Buendel, 1440 px, gefuellte Kampagne:
        //
        //   ohne Gruppe   65 Halte, 64 Anschlaege bis zur Schnell-Referenz
        //   mit Gruppe    36 Halte, 35 Anschlaege
        //
        // und nach einem einzigen "45 weitere laden" waeren es 60
        // Kartenhalte statt einem. Bei 400 ms je Anschlag ist das der
        // Unterschied zwischen 26 s und 14 s, und er waechst mit jedem
        // eigenen Zauber.
        //
        // DIE ACHSE IST GEMESSEN UND NICHT FEST, und das ist die eine
        // Ausnahme im Haus. Das Zaubergitter ist die einzige angemeldete
        // Reihe, deren Gestalt an der Fensterbreite haengt: 1440 px drei
        // Spalten (dx 406, dy 0), 900 px zwei (dx 406, dy 0), 390 und
        // 360 px eine (dx 0, dy 100). Begruendung bei `_achse()` in
        // `ui/keyboard-group.js`.
        //
        // DER NACHLADE-KNOPF BLEIBT EIN EIGENER HALT. Er liegt im selben
        // `div#spell-list`, ist aber ein `<button>`, dessen `data-action`
        // auf `call` lautet, und damit kein Glied dieser Art — richtig so:
        // er ist keine Karte, sondern das Ende der Liste.
        // (Die Schreibweise ohne das Attribut im Klartext ist Absicht: der
        // Waechter in tests/unit/event-delegation.test.js liest ZEILENWEISE
        // und haelte eine Erwaehnung ohne data-value fuer ein vergessenes
        // Aufrufziel.)
        name: 'zauberkarten',
        behaelter: 'div#spell-list',
        glied: '[data-action="toggle-spell-card"]',
        achse: achseNachGestalt,
        beschriftung: () => 'Zauber',
        zustand: kopfAufgeklappt('.spell-card')
    },

    // ---- BEGEGNUNGEN ----
    {
        name: 'begegnungszeilen',
        behaelter: 'div#encounter-list',
        glied: '[data-action="select-encounter"]',
        achse: 'vertical',
        beschriftung: () => 'Begegnungen',
        zustand: zeileAktuell()
    },
    {
        // MIT DER PRUEFSAAT IST HIER NUR EINE MARKE SICHTBAR ("Alle"), weil
        // die Leiste je vorkommendem `creatureType` eine weitere baut und
        // die Saat keinen setzt. Die Anmeldung ist trotzdem richtig und
        // nicht nur Symmetrie: in einer echten Kampagne stehen hier bis zu
        // sechs Marken. Bei einem einzigen sichtbaren Glied kostet die
        // Gruppe nichts — `_regleGruppe()` legt den Halt auf das eine
        // bedienbare Glied, und unsichtbare Glieder waren ohnehin keine
        // Halte.
        name: 'begegnungsfilter',
        behaelter: 'div#encounter-filters',
        glied: '[data-action="set-enc-filter"]',
        achse: 'horizontal',
        beschriftung: () => 'Begegnungsfilter',
        zustand: MARKE_GEDRUECKT
    },

    // ---- ORTE ----
    {
        name: 'ortszeilen',
        behaelter: 'div#locations-list',
        glied: '[data-action="select-location"]',
        achse: 'vertical',
        beschriftung: () => 'Orte',
        zustand: zeileAktuell()
    },
    {
        // Wie bei den Begegnungen: mit der Pruefsaat eine Marke, in einer
        // echten Kampagne eine je Eintrag in `D.filters`.
        name: 'ortsfilter',
        behaelter: 'div#location-filters',
        glied: '[data-action="set-loc-filter"]',
        achse: 'horizontal',
        beschriftung: () => 'Ortsfilter',
        zustand: MARKE_GEDRUECKT
    },

    // ---- FRAKTIONEN ----
    {
        name: 'fraktionszeilen',
        behaelter: 'div#fr-list',
        glied: '[data-action="select-fraktion"]',
        achse: 'vertical',
        beschriftung: () => 'Fraktionen',
        zustand: zeileAktuell('fr-selected')
    },

    // ---- LAEDEN ----
    {
        // Jeder Kopf sitzt allein in seinem `div#shop-card-N`; die Reihe
        // entsteht erst eine Ebene hoeher am gemeinsamen Gitter. Nach einer
        // Geschwisterregel waeren es 0 Gruppen und 20 Einzelstellen — nach
        // dem tiefsten GEMEINSAMEN Behaelter eine Gruppe, und das ist die
        // Lesart, die dem Spielleiter nuetzt.
        name: 'ladenzeilen',
        behaelter: 'div#shop-list',
        glied: '[data-action="toggle-shop"]',
        achse: 'vertical',
        beschriftung: () => 'Laeden',
        zustand: kopfAufgeklappt('.shop-card')
    },
    {
        // DIE ARTIKEL EINES AUFGEKLAPPTEN LADENS — Befund 3, und der
        // einzige, bei dem ein HANDGRIFF nach E-2 LAENGER war als davor.
        // Gemessen, Laden 1 mit 15 Artikeln, letzten Artikel loeschen:
        //
        //   vor E-2   54 Anschlaege, 139 Halte in der Ansicht
        //   nach E-2  64 Anschlaege, 157 Halte   <-- die Verschlechterung
        //   mit dieser Gruppe  wieder 54/143
        //
        // Die Ursache war allein die neu bedienbare, aber nicht
        // angemeldete Zeile `toggle-shop-item` (15 Halte, senkrechte
        // Spalte in `.si-list`, dx 0, dy 42/58). Die Pruefsaat gab
        // keinem Laden Artikel — darum war in der Ansicht nichts zu sehen.
        //
        // EINE LEISTE JE LADEN, nicht eine fuer alle: `.si-list` steht
        // je Ladenkarte einmal, und zwischen zwei Laeden liegt der ganze
        // Ladenkopf. Zwanzig Laeden ergeben zwanzig Leisten — aber nur der
        // aufgeklappte ist sichtbar, und nur der kostet einen Halt.
        name: 'ladenartikel',
        behaelter: '.si-list',
        glied: '[data-action="toggle-shop-item"]',
        achse: 'vertical',
        beschriftung: () => 'Artikel',
        zustand: kopfAufgeklappt('.si-item')
    },
    {
        // DIE KATEGORIEMARKEN EINES AUFGEKLAPPTEN LADENS. Sie sind in
        // derselben Messung aufgefallen und haben dieselbe Gestalt wie die
        // sechs anderen Filterleisten des Hauses (eine Zeile, dx 91,
        // dy 0). Mit der Pruefsaat sind es drei Marken ("Alle" plus eine je
        // vorkommender Artikelkategorie); in einem echten Laden bis zu
        // acht.
        name: 'ladenkategorien',
        behaelter: '.shop-category-tabs',
        glied: '[data-action="filter-shop-category"]',
        achse: 'horizontal',
        beschriftung: () => 'Artikelkategorien',
        zustand: MARKE_GEDRUECKT
    },

    // ---- BESTIARIUM ----
    {
        // Behaelter eine Ebene ueber dem klassenlosen `visibleContainer`
        // von `VirtualScroll` — Begruendung im Kopf. Die Glieder sind nur
        // die des Fensters (gemessen 17 von 112); die Fahrt rollt die Liste
        // und bekommt die naechsten nachgeliefert, weil
        // `ui/virtual-scroll.js` den Fokus seit E-2 ueber das Neuzeichnen
        // traegt und `KeyboardGroup.aktualisieren()` den wandernden
        // Tabindex danach neu setzt.
        name: 'bestiarienzeilen',
        behaelter: 'div#bestiary-list',
        glied: '[data-action="bestiary-select"]',
        achse: 'vertical',
        beschriftung: () => 'Monster',
        zustand: zeileAktuell()
    },
    {
        // DIE EINE AUSNAHME VON PUNKT 2 OBEN ("keine Gruppe fasst native
        // Bedienelemente zusammen"), und sie ist auf Zahlen begruendet,
        // nicht auf Bequemlichkeit.
        //
        // `button.bestiary-fav` ist nativ — einer je Zeile, 112 im SRD.
        // Mit dem Zeilenhalt allein, aber ohne diese Gruppe gemessen
        // (Spur ueber echte Tastendruecke, 25 ms Pause): die
        // Schnell-Referenz kostet 141 Anschlaege, und 133 davon sind
        // `bestiary-toggle-fav`. Der Spielleiter muss durch JEDEN
        // Favoritenknopf des gesamten Monsterhandbuchs, um an der Liste
        // vorbeizukommen — bei 400 ms je Anschlag 56 s, und die Zahl
        // waechst mit jedem eigenen Monster.
        //
        // WARUM DAS DIE REGEL NICHT AUFWEICHT. Der Grund gegen das
        // Gruppieren nativer Knoepfe ist, dass es Reichweite WEGNIMMT: wer
        // die Pfeiltastenregel nicht kennt, kommt an Glied 2..n nicht mehr
        // heran. Bei zwei oder drei Knoepfen je Zeile (Fraktionen, Laeden)
        // wiegt dieser Verlust schwerer als die Ersparnis, und sie bleiben
        // darum ungruppiert. Bei 112 Knoepfen in EINER Spalte ist es
        // umgekehrt: ohne Gruppe ist die Ansicht fuer JEDEN unbenutzbar,
        // mit Gruppe ist sie fuer jeden benutzbar und `role="toolbar"`
        // sagt dem Vorleseprogramm ausdruecklich, dass hier Pfeiltasten
        // gelten. Geometrisch ist es eine echte Spalte (einer je Zeile,
        // dx 0, dy 56) und kein Werkzeugkasten gemischter Aktionen.
        //
        // DERSELBE BEHAELTER WIE DIE ZEILEN, und das ist Absicht: zwei
        // Leisten in einem Behaelter heisst EIN `role="toolbar"` mit zwei
        // wandernden Tabindex. Der Spielleiter bekommt dadurch zwei Halte
        // (einen in der Zeilenspalte, einen in der Knopfspalte) statt 113.
        // Der Preis ist, dass `aria-label` nur einmal gesetzt wird
        // ("Monster") und diese Beschriftung hier verfaellt — eine
        // Ungenauigkeit in der Ansage, keine Falschaussage. Saubere waere
        // das ARIA-Muster `grid` mit zweidimensionaler Pfeilfahrt; das ist
        // ein eigenes Vorhaben und nicht dieses.
        //
        // WAS NICHT GEHT UND DARUM NICHT VERSPROCHEN WIRD: der Knopfhalt
        // folgt NICHT der Zeile, auf der der Fokus zuletzt stand. Wer zu
        // Monster 50 faehrt und dann tabuliert, landet auf dem
        // Favoritenknopf, der zuletzt den Halt trug — nicht auf dem von
        // Monster 50. Das waere eine Kopplung zweier Gruppen und damit
        // Mechanik in `ui/keyboard-group.js`, nicht eine Anmeldung hier.
        name: 'bestiarienfavoriten',
        behaelter: 'div#bestiary-list',
        glied: '[data-action="bestiary-toggle-fav"]',
        achse: 'vertical',
        beschriftung: () => 'Monster: Favoriten',
        zustand: MARKE_GEDRUECKT
    },

    // ---- WIKI ----
    {
        // DIE EINTRAEGE EINER AUFGEKLAPPTEN KATEGORIE — Befund 2. Die
        // Kategorien sind laut CLAUDE.md standardmaessig ZU, und die
        // Pruefsaat klappte keine auf; darum war die Reihe in keiner
        // Messung zu sehen. Gemessen, eine Kategorie mit 20 Eintraegen:
        //
        //   Halte der Ansicht   zu 30   auf 50 ohne Gruppe   auf 31 mit
        //
        // Der Handgriff dahinter: wer Eintrag 3 oeffnet und ihn bearbeiten
        // will, zahlte 17 Anschlaege fuer die Eintraege 4..20, die er
        // schon hinter sich hatte (Kategoriekopf nach 27 Tab, dann 23 Tab
        // bis "Bearbeiten", davon 17 die Eintraege). Mit mehreren offenen
        // Kategorien und einem echten Wiki waechst das linear.
        //
        // EINE LEISTE JE KATEGORIE: `.wiki-tree-items` steht je
        // Kategorie einmal. Der Kategoriekopf
        // (`[data-action="toggle-wiki-category"]`) liegt DANEBEN, nicht
        // darin — er bleibt die Einzelstelle, die er war (Punkt 1 im
        // Kopf), und behaelt seinen eigenen Halt.
        //
        // DER SELEKTOR GREIFT NUR IM BAUM. `select-wiki-entry` steht im
        // Haus an fuenf Stellen (Baum, Brotkrumen, Suchtreffer,
        // Schnellzugriff, Querverweise im Text); nur die des Baums liegen
        // in `.wiki-tree-items`. Die uebrigen sind Einzelstellen in
        // ihrem jeweiligen Zusammenhang und bleiben unberuehrt.
        //
        // UNTEREINTRAEGE ZAEHLEN MIT. `querySelectorAll` findet auch die
        // Kinder in `div.wiki-tree-item-children`; ein aufgeklappter
        // Untereintrag wird damit Teil derselben Spalte, und die
        // Pfeiltastenfahrt laeuft in Leseordnung durch den ganzen Baum der
        // Kategorie. Das ist die Gestalt, die auf dem Schirm steht (dx 0,
        // dy 30, eine y-Linie je Eintrag).
        name: 'wikieintraege',
        behaelter: '.wiki-tree-items',
        glied: '[data-action="select-wiki-entry"]',
        achse: 'vertical',
        beschriftung: () => 'Wiki-Eintraege',
        zustand: zeileAktuell()
    },

    // ---- PARTY (Kampfansicht, von Einheit 1 benannt nachgetragen) ----
    {
        // NICHT TEIL DES AUFTRAGS "VORBEREITUNGSANSICHTEN", und darum hier
        // mit Begruendung: Einheit 1 hat die Party-Zauberplaetze als
        // bekannte Auslassung gemeldet ("sie zu gruppieren ist genau der
        // Schritt, der die Ratsche rot macht"). Diese Ratsche ist seit
        // 9db69e3 reparariert — sie faehrt Gruppen jetzt mit Pfeiltasten ab.
        // Die Zahlen sagen, dass die Auslassung nicht bleiben darf: 140
        // Punkte = 140 Halte bei 20 Charakteren, 351 Halte in der Ansicht,
        // und die Schnell-Referenz in 300 Spruengen NICHT erreicht. Es ist
        // dieselbe Gestalt wie `.init-slot-box` (Behaelter
        // `.spell-slots-compact`, die Rang-Wrapper sind klassenlose
        // Inline-Stil-`span`), also dieselbe Loesung.
        //
        // KEIN `zustand` — ABSICHT, und die Gegenpruefung hat den Grund
        // selbst geliefert: jeder Punkt traegt im Markup ein `title`
        // ("Grad 1 Slot (verfuegbar)"), der Zustand steht also im NAMEN und
        // nicht nur in der Klasse. Ein `aria-pressed` daneben wuerde
        // dasselbe zweimal sagen. Diese Reihe war in Befund 5 ausdruecklich
        // das Gegenbeispiel aus dem Haus.
        name: 'partyZauberplaetze',
        behaelter: '.spell-slots-compact',
        glied: '.slot-pip',
        achse: 'horizontal',
        beschriftung: () => 'Zauberplätze'
    },

    // ---- MOBIL-KOPF (MKOPF, nachgetragen) ----
    {
        // DIE EINE GRUPPE AUS `<button>`-ELEMENTEN — und damit die
        // ausdrueckliche Ausnahme zu Punkt 2 im Kopf dieser Datei ("Keine
        // Gruppe fasst `<button>`, `<a href>` oder `<select>` zusammen").
        // Die Regel dort hat einen gemessenen Grund: bei einem `<button>`
        // NAEHME die Gruppe Reichweite weg, die der Browser seit immer
        // gibt. Hier nimmt sie keine, und das ist der Unterschied:
        //
        //  (a) GESCHLOSSEN IST DAS MENUE `hidden`. Keines der sieben
        //      Glieder ist dann im Tabulatorweg — mit Gruppe wie ohne.
        //      Die Gruppe kann also nichts wegnehmen, was ohne sie da
        //      waere; die betroffenen Faelle der Regel (17 Favoritenknoepfe
        //      im Bestiarium, zwei je Fraktionskarte, drei je Ladenkopf)
        //      stehen dauerhaft offen auf dem Schirm.
        //  (b) OFFEN IST SIE DER GEWINN. Gemessen bei 390 px, gefuellte
        //      Kampagne: der Mobil-Kopf liegt auf den Tabulatorhalten
        //      47 bis 53, der Punkte-Knopf also auf 54. Ohne Gruppe kostete
        //      ein offenes Menue SIEBEN weitere Halte, mit Gruppe EINEN —
        //      und zwar genau den, auf dem die Hand gerade steht.
        //  (c) ES IST EIN AUFKLAPPFELD, und "ein Halt, Pfeiltasten darin"
        //      ist dafuer das erwartete Verhalten, nicht eine Abweichung
        //      davon.
        //
        // WARUM NICHT `role="menu"`/`menuitem`, was fuer ein Aufklappfeld
        // praeziser waere: `KeyboardGroup._regleGruppe()` setzt dem
        // Behaelter `role="toolbar"` und dem Glied `role="button"`. Das zu
        // umgehen hiesse, neben E-2 eine ZWEITE Pfeiltastenlogik zu bauen —
        // genau das, was E-2 abgeschafft hat. `toolbar` ist dabei keine
        // Falschaussage: `ui/keyboard-group.js` begruendet die Rolle
        // ausdruecklich damit, dass sie "das ARIA-Muster 'ein Halt,
        // Pfeiltasten darin'" benennt. Der Punkte-Knopf traegt deshalb
        // KEIN `aria-haspopup` (das verspraeche ein Menue), sondern
        // `aria-expanded` und `aria-controls`.
        //
        // DIE ACHSE IST GEMESSEN: sieben Eintraege, dx 0, dy 43 — die
        // Eintraege liegen als Spalte untereinander, auf jeder der drei
        // Telefonbreiten und im Querformat. Senkrecht.
        //
        // KEIN `zustand` — dieselbe Begruendung wie bei den Party-Punkten
        // darueber, nur mit einem anderen Traeger: die Abschriften bringen
        // ihr `aria-expanded` aus der Kopfzeile mit, und
        // `features/combat-log/combat-log-render.js` zieht es an JEDEM
        // Traeger nach (`[data-action="toggle-combat-log"][aria-expanded]`).
        // Ein `zustand` hier schriebe demselben Attribut einen zweiten Wert.
        name: 'kopfmenue',
        behaelter: '#mobile-header-menu',
        glied: '.mobile-header-menu-item',
        achse: 'vertical',
        beschriftung: () => 'Weitere Aktionen'
    }
];

const KeyboardGroupViews = {
    /** Zahl der angemeldeten Arten. Nur Diagnose. */
    _angemeldet: 0,

    /**
     * Meldet alle Arten an. Idempotent: `KeyboardGroup.registriere()` weist
     * einen schon bekannten Namen ab, ein zweiter Aufruf aendert also
     * nichts.
     * @returns {number} Zahl der NEU angemeldeten Arten
     */
    init() {
        if (!window.KeyboardGroup || typeof window.KeyboardGroup.registriere !== 'function') {
            // Kommt im Buendel nicht vor (`ui/keyboard-group.js` steht in
            // `loader.js` davor), aber in Tests und in Teilladungen schon.
            // Still bleiben ist hier richtig: ohne die Mechanik gibt es
            // keine Gruppen, und die Nachruestung allein funktioniert
            // weiter — nur mit mehr Halten.
            return 0;
        }
        let n = 0;
        for (const art of ANSICHTSGRUPPEN) {
            if (window.KeyboardGroup.registriere(art)) n++;
        }
        this._angemeldet = n;
        log(`[KeyboardGroupViews] ${n} von ${ANSICHTSGRUPPEN.length} Ansichtsgruppen angemeldet`);
        return n;
    },

    /**
     * Diagnose fuer die Konsole und fuer Messungen.
     * @returns {{ arten: number, angemeldet: number, namen: string[] }}
     */
    statistik() {
        return {
            arten: ANSICHTSGRUPPEN.length,
            angemeldet: this._angemeldet,
            namen: ANSICHTSGRUPPEN.map(a => a.name)
        };
    }
};

window.ANSICHTSGRUPPEN = ANSICHTSGRUPPEN;
window.KeyboardGroupViews = KeyboardGroupViews;

// Selbstaufruf, dasselbe Muster wie `ui/keyboard-reach.js`,
// `ui/keyboard-group.js` und `ui/modal-focus.js`: die Anmeldung haengt an
// nichts aus dem Datenbestand und soll greifen, auch wenn eine spaetere
// init-Stufe scheitert.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KeyboardGroupViews.init(), { once: true });
} else {
    KeyboardGroupViews.init();
}
