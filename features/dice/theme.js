// [SECTION:THEME]
// Extrahiert aus dice.js
// Theme-System
// Zeilen: 21

// THEME SYSTEM
// ============================================================
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