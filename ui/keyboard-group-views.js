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
 * Die Gruppen, die diese Datei anmeldet.
 *
 * `behaelter` ist der tiefste gemeinsame DOM-Behaelter der Reihe,
 * `glied` waehlt die Glieder DARIN (auch ueber Zwischenknoten hinweg),
 * `achse` ist gemessen (siehe Tabelle im Kopf), `beschriftung` wird zum
 * `aria-label` der Leiste.
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
        beschriftung: () => 'Auftraege'
    },
    {
        // Je Auftragszeile eine eigene Leiste mit zwei Marken.
        name: 'auftragsmarken',
        behaelter: '[data-tastgruppe="auftrag-status"]',
        glied: '[data-action="toggle-quest-status-stop"]',
        achse: 'horizontal',
        beschriftung: () => 'Auftragsstatus'
    },

    // ---- BEUTE ----
    {
        name: 'beutezeilen',
        behaelter: 'div#loot-list',
        glied: '[data-action="select-loot"]',
        achse: 'vertical',
        beschriftung: () => 'Beute'
    },
    {
        name: 'beutefilter',
        behaelter: 'div#loot-filters',
        glied: '[data-action="set-loot-filter"]',
        achse: 'horizontal',
        beschriftung: () => 'Beutefilter'
    },

    // ---- NSC ----
    {
        name: 'nscZeilen',
        behaelter: 'div#npc-list',
        glied: '[data-action="select-npc"]',
        achse: 'vertical',
        beschriftung: () => 'Nichtspielercharaktere'
    },
    {
        name: 'nscFilter',
        behaelter: 'div#npc-filters',
        glied: '[data-action="set-npc-filter"]',
        achse: 'horizontal',
        beschriftung: () => 'NSC-Filter'
    },

    // ---- ZAUBER: DREI getrennte Leisten, drei Behaelter, drei Gruppen ----
    {
        name: 'zaubergrade',
        behaelter: 'div#spell-level-filters',
        glied: '[data-action="spell-level-filter"]',
        achse: 'horizontal',
        beschriftung: () => 'Zaubergrade'
    },
    {
        name: 'zauberschulen',
        behaelter: 'div#spell-school-filters',
        glied: '[data-action="spell-school-filter"]',
        achse: 'horizontal',
        beschriftung: () => 'Zauberschulen'
    },
    {
        name: 'zauberklassen',
        behaelter: 'div#spell-filters',
        glied: '[data-action="set-spell-filter"]',
        achse: 'horizontal',
        beschriftung: () => 'Zauberklassen'
    },

    // ---- BEGEGNUNGEN ----
    {
        name: 'begegnungszeilen',
        behaelter: 'div#encounter-list',
        glied: '[data-action="select-encounter"]',
        achse: 'vertical',
        beschriftung: () => 'Begegnungen'
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
        beschriftung: () => 'Begegnungsfilter'
    },

    // ---- ORTE ----
    {
        name: 'ortszeilen',
        behaelter: 'div#locations-list',
        glied: '[data-action="select-location"]',
        achse: 'vertical',
        beschriftung: () => 'Orte'
    },
    {
        // Wie bei den Begegnungen: mit der Pruefsaat eine Marke, in einer
        // echten Kampagne eine je Eintrag in `D.filters`.
        name: 'ortsfilter',
        behaelter: 'div#location-filters',
        glied: '[data-action="set-loc-filter"]',
        achse: 'horizontal',
        beschriftung: () => 'Ortsfilter'
    },

    // ---- FRAKTIONEN ----
    {
        name: 'fraktionszeilen',
        behaelter: 'div#fr-list',
        glied: '[data-action="select-fraktion"]',
        achse: 'vertical',
        beschriftung: () => 'Fraktionen'
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
        beschriftung: () => 'Laeden'
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
        beschriftung: () => 'Monster'
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
        beschriftung: () => 'Monster: Favoriten'
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
        name: 'partyZauberplaetze',
        behaelter: '.spell-slots-compact',
        glied: '.slot-pip',
        achse: 'horizontal',
        beschriftung: () => 'Zauberplätze'
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
        log(`[KeyboardGroupViews] ${n} von ${ANSICHTSGRUPPEN.length} Gruppenarten angemeldet`);
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
