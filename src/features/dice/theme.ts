// [SECTION:THEME]
// Extrahiert aus dice.js
// Theme-System
// Zeilen: 25

import { showToast } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { showModal, hideModal } from '@systems/spellslots/navigation';

// ============================================================
// THEME SYSTEM
// ============================================================

const D = (window as any).D;

export function showThemeModal(): void {
    showModal('theme-modal');
}

export function setTheme(theme: string): void {
    document.documentElement.setAttribute('data-theme', theme);
    D.settings = D.settings || {};
    D.settings.theme = theme;
    save();
    hideModal('theme-modal');
    showToast(`Theme: ${theme === 'dark' ? 'Dunkel' : theme === 'light' ? 'Hell' : theme === 'sepia' ? 'Pergament' : 'Hoher Kontrast'}`);
}

export function loadTheme(): void {
    const theme = D.settings?.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
}

// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================

(window as any).showThemeModal = showThemeModal;
(window as any).setTheme = setTheme;
(window as any).loadTheme = loadTheme;
