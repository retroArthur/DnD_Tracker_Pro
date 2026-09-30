// [SECTION:LAYOUT_PROFILES]
// Extrahiert aus dice.js
// Layout-Profile
// Zeilen: 42
// ============================================================
// LAYOUT PROFILES (Desktop/Mobile)
// ============================================================
// var D = window.D;  // [REMOVED: conflicts with function declaration]
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
        layout = window.innerWidth <= 768 ? 'mobile' : 'desktop';
    }
    document.documentElement.setAttribute('data-layout', layout);
    updateLayoutSwitcher(layout);
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
