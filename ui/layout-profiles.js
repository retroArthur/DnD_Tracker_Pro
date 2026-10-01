// [SECTION:LAYOUT_PROFILES]
// Extrahiert aus dice.js
// Layout-Profile
// Zeilen: 42
// ============================================================
// LAYOUT PROFILES (Desktop/Mobile)
// ============================================================
// var D = window.D;  // [REMOVED: conflicts with function declaration]

/* Fenstergrenze, unter der das Mobil-Profil gilt. Derselbe Wert, den
   loadLayout() seit je beim Start benutzt — jetzt an EINER Stelle, weil ihn der
   Fensterbeobachter mitliest. Es ist KEINE CSS-Grenze: das Mobil-Layout haengt
   an `[data-layout="mobile"]`, nicht an einer Media Query, und die drei
   erlaubten CSS-Grenzen (600/900/1200) bleiben davon unberuehrt. */
const LAYOUT_MOBIL_GRENZE = 768;

/* Die KURZE Seite, bis zu der ein Fenster ein gedrehtes Telefon sein kann. Die
   gaengige Telefonklasse ist im Hochformat 320..448 CSS-Bildpunkte breit (320
   beim kleinsten iPhone SE, 448 beim groessten Android-Riegel); 480 laesst
   Luft nach oben und bleibt unter jeder Tablet-Hochformatbreite. */
const LAYOUT_QUER_KURZE_SEITE = 480;

/* Die LANGE Seite, bis zu der dasselbe gilt. Dieselben Geraete sind im
   Querformat 568..956 Bildpunkte breit. Diese Schranke ist der Teil, der ein
   gedrehtes Telefon von einem flachen, breiten Desktop-Fenster trennt: 1440x450
   hat dieselbe kurze Seite (450) wie ein gedrehtes Telefon, aber eine lange
   Seite weit darueber. GEMESSEN als Gegenprobe: 1440x450, 1280x400, 1024x768
   und 901x700 bleiben Desktop. */
const LAYOUT_QUER_LANGE_SEITE = 1000;

/**
 * Das Profil, das zur aktuellen Fenstergroesse passt.
 *
 * ZWEI UNABHAENGIGE BEDINGUNGEN, und beide sind noetig.
 *
 * (1) `innerWidth <= 768` — die Grenze, die loadLayout() seit je benutzt. Sie
 *     faengt jedes Telefon im Hochformat und jedes schmal gezogene Fenster.
 *
 * (2) Kurze Seite <= 480 UND lange Seite <= 1000 — das gedrehte Telefon. Allein
 *     mit (1) fiel es auf die Desktop-Seite, weil es im Querformat 740..956px
 *     BREIT ist. GEMESSEN am Buendel zu 960b32b: 390x844 -> 844x390 wechselte
 *     nach Desktop, Kopfzeile 152px an Oberkante 61px (mit dem 61px hohen
 *     Umzugs-Band also 213 von 390 Bildpunkten, 55% des Fensters), ein
 *     sichtbarer Reiter von 24, und 184px Seitenueberhang in X. 852x393 ergab
 *     176px, 932x430 ergab 96px. 740x360 blieb mobil — dieselbe Geste, zwei
 *     Ergebnisse.
 *
 * WARUM ZUSTANDSLOS UND KEINE HYSTERESE. Diese Funktion traegt BEIDE Wege:
 * loadLayout() beim Start und autoLayoutNachFenster() am Fensterbeobachter. Eine
 * Hysterese ("das Mobil-Profil erst oberhalb von 1000px verlassen") haette die
 * beiden auseinanderlaufen lassen: ein direkt im Querformat geoeffnetes Telefon
 * bekaeme Desktop, ein gedrehtes Mobil — das Ergebnis haengt dann daran, wie der
 * Spielleiter das Geraet in der Hand hielt, als er die App oeffnete. Die Regel
 * sieht deshalb nur auf die Fenstergroesse, nie auf das, was gerade gilt.
 *
 * WARUM NICHT NUR DIE HOEHE. Der naechstliegende Griff waere
 * `innerWidth <= 768 || innerHeight <= 500`. Er ist falsch: er zieht jedes
 * flache Desktop-Fenster mit. GEMESSEN, 1440x450 — ein halb zugeschobenes
 * Browserfenster auf einem breiten Schirm — faellt damit ins Mobil-Profil,
 * obwohl dort 1440px Breite fuer das volle Raster bereitstehen. Die Schranke auf
 * der langen Seite ist genau die Antwort darauf.
 */
function layoutAusFenster() {
    const breite = window.innerWidth;
    const hoehe = window.innerHeight;
    if (breite <= LAYOUT_MOBIL_GRENZE) return 'mobile';
    const kurz = Math.min(breite, hoehe);
    const lang = Math.max(breite, hoehe);
    if (kurz <= LAYOUT_QUER_KURZE_SEITE && lang <= LAYOUT_QUER_LANGE_SEITE) return 'mobile';
    return 'desktop';
}

function setLayout(layout) {
    document.documentElement.setAttribute('data-layout', layout);
    D.settings = D.settings || {};
    D.settings.layout = layout;
    save();
    updateLayoutSwitcher(layout);
    // Die Versatzkette der angehefteten Ebenen haengt am Layout (U3, Glied 1-3).
    // Der Mobil-Zweig von updateStickyOffsets() raeumt alle drei Glieder ab, weil
    // Kopfzeile, Runden- und Aktionsleiste dort nach eigenen Regeln anheften
    // ([data-layout="mobile"] ...). Ohne diesen Aufruf blieben sie auf dem
    // RUECKWEG nach Desktop leer, und die CSS-Rueckfallwerte (0px / 75px / 145px)
    // kamen wieder ans Licht — genau die verdrahteten Werte, deren Fehler der
    // Grund fuer die gerechnete Kette sind: das Umzugs-Hinweisband deckte die
    // Kopfzeile dann wieder um 61px zu (App-Titel und globale Suche unerreichbar)
    // und die Aktionsleiste schnitt die Runden-Leiste. Der Wechsel selbst muss
    // die Kette also neu besetzen; niemand soll erst die Initiative aufrufen
    // muessen, damit renderQuickActionsBar() den Zustand heilt.
    if (typeof window.updateStickyOffsets === 'function') {
        window.updateStickyOffsets();
    }
    showToast(`Layout: ${layout === 'desktop' ? '🖥️ Desktop' : '📱 Mobil'}`);
}
function loadLayout() {
    // Auto-detect basierend auf Bildschirmbreite, wenn keine Einstellung
    let layout = D.settings?.layout;
    if (!layout) {
        layout = layoutAusFenster();
    }
    document.documentElement.setAttribute('data-layout', layout);
    updateLayoutSwitcher(layout);
}

/**
 * Laesst das Layoutprofil dem Fenster folgen (M2a) — aber nur, solange der
 * Nutzer keines gewaehlt hat.
 *
 * WARUM. loadLayout() erkannte die Breite genau EINMAL beim Start. Ein auf
 * Telefonbreite gezogenes Desktop-Fenster behielt deshalb `data-layout="desktop"`
 * samt Desktop-Kopfzeile. GEMESSEN, 1440x800 -> 390x844, in allen vier Themes
 * auf den Bildpunkt gleich: die Kopfzeile wuchs von 102 auf 234px und blieb am
 * OBEREN Rand (Oberkante 157px), die Mobil-Kopfzeile blieb 0px, von 24 Reitern
 * war genau EINER sichtbar (die uebrigen 23 steckten in zugeklappten
 * Gruppenmenues), und der Seitenueberhang stieg von 74 auf 658px. 234 von 844
 * Bildpunkten sind 28% des Fensters. Das trifft jeden, der am Spieltisch das
 * Fenster verkleinert oder das Geraet dreht.
 *
 * WARUM DIE WAHL DES NUTZERS VORGEHT. setLayout()/toggleLayout() schreiben nach
 * `D.settings.layout`. Wer dort etwas gewaehlt hat, hat entschieden — der
 * automatische Wechsel greift deshalb nur, solange dieses Feld leer ist.
 *
 * WARUM HIER NICHT GESPEICHERT WIRD. Ein `save()` oder ein Schreiben nach
 * `D.settings.layout` waere ein Eigentor: der erste Fensterwechsel wuerde das
 * Profil fuer immer festschreiben und damit genau die Zusicherung aufheben, die
 * diese Funktion herstellt. Sie setzt ausschliesslich das Attribut und das
 * Knopfsymbol. Ein Hinweistoast entfaellt aus demselben Grund mit anderem
 * Vorzeichen: ein Fensterwechsel ist keine Anweisung des Nutzers, und M1 hat
 * gemessen, dass gerade das Ereignis-Log die Navigationsleiste zudeckt — eine
 * Meldung bei jedem Ziehen am Fensterrand waere aktiv schaedlich.
 *
 * WARUM KEIN EIGENER BEOBACHTER. core/init.js haengt bereits EINEN entprellten
 * Beobachter (200ms) am resize-Ereignis. Diese Funktion laeuft dort VOR
 * updateStickyOffsets(), weil dessen Mobil-/Desktop-Zweig an
 * `root.dataset.layout` verzweigt — in der anderen Reihenfolge wuerde die
 * Versatzkette fuer das alte Profil gemessen. Sie ruft updateStickyOffsets()
 * deshalb NICHT selbst; sonst liefe die Messung zweimal je Wechsel.
 *
 * @returns {boolean} true, wenn das Profil gewechselt wurde
 */
function autoLayoutNachFenster() {
    const daten = window.D;
    if (daten && daten.settings && daten.settings.layout) return false;
    const soll = layoutAusFenster();
    const wurzel = document.documentElement;
    if (wurzel.getAttribute('data-layout') === soll) return false;
    wurzel.setAttribute('data-layout', soll);
    updateLayoutSwitcher(soll);
    return true;
}
function toggleLayout() {
    const current = document.documentElement.getAttribute('data-layout') || 'desktop';
    const newLayout = current === 'desktop' ? 'mobile' : 'desktop';
    setLayout(newLayout);
}
function updateLayoutSwitcher(layout) {
    // Header-Button (Desktop)
    const icon = $('layout-icon');
    if (icon) icon.textContent = layout === 'desktop' ? '🖥️' : '📱';
    // Mobile-Header-Button
    const mobileBtn = $('mobile-layout-btn');
    if (mobileBtn) mobileBtn.textContent = layout === 'desktop' ? '🖥️' : '📱';
}
// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================
window.loadLayout = loadLayout;
window.toggleLayout = toggleLayout;
// Aufrufer: der eine entprellte Fensterbeobachter in core/init.js.
window.autoLayoutNachFenster = autoLayoutNachFenster;
