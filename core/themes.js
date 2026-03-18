// [SECTION:THEMES]
// Was: features/dice/theme.js, Now: core/themes.js
// Theme-System für Dark/Light/Sepia/High-Contrast
// Zeilen: 25
// ============================================================
// THEME SYSTEM
// ============================================================
// var D = window.D;  // [REMOVED: conflicts with function declaration]
function showThemeModal() {
    showModal('theme-modal');
}
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    D.settings = D.settings || {};
    D.settings.theme = theme;
    save();
    hideModal('theme-modal');
    showToast(`Theme: ${theme === 'dark' ? 'Dunkel' : theme === 'light' ? 'Hell' : theme === 'sepia' ? 'Pergament' : 'Hoher Kontrast'}`);
}
function loadTheme() {
    const theme = D.settings?.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.showThemeModal = showThemeModal;
window.setTheme = setTheme;
window.loadTheme = loadTheme;
