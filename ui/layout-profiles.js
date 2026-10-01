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

/** Das Profil, das zur aktuellen Fensterbreite passt. */
function layoutAusFenster() {
    return window.innerWidth <= LAYOUT_MOBIL_GRENZE ? 'mobile' : 'desktop';
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
