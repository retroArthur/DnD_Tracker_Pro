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
    if (icon)
        icon.textContent = layout === 'desktop' ? '🖥️' : '📱';
    // Mobile-Header-Button
    const mobileBtn = $('mobile-layout-btn');
    if (mobileBtn)
        mobileBtn.textContent = layout === 'desktop' ? '🖥️' : '📱';
}
// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================
window.loadLayout = loadLayout;
window.toggleLayout = toggleLayout;
