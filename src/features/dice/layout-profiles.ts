// [SECTION:LAYOUT_PROFILES]
// Extrahiert aus dice.js
// Layout-Profile
// Zeilen: 42

import { $ } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';

// ============================================================
// LAYOUT PROFILES (Desktop/Mobile)
// ============================================================

const D = (window as any).D;

export function setLayout(layout: string): void {
    document.documentElement.setAttribute('data-layout', layout);
    D.settings = D.settings || {};
    D.settings.layout = layout;
    save();
    updateLayoutSwitcher(layout);
    showToast(`Layout: ${layout === 'desktop' ? '🖥️ Desktop' : '📱 Mobil'}`);
}

export function loadLayout(): void {
    // Auto-detect basierend auf Bildschirmbreite, wenn keine Einstellung
    let layout = D.settings?.layout;
    if (!layout) {
        layout = window.innerWidth <= 768 ? 'mobile' : 'desktop';
    }
    document.documentElement.setAttribute('data-layout', layout);
    updateLayoutSwitcher(layout);
}

export function toggleLayout(): void {
    const current = document.documentElement.getAttribute('data-layout') || 'desktop';
    const newLayout = current === 'desktop' ? 'mobile' : 'desktop';
    setLayout(newLayout);
}

function updateLayoutSwitcher(layout: string): void {
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

(window as any).setLayout = setLayout;
(window as any).loadLayout = loadLayout;
(window as any).toggleLayout = toggleLayout;
(window as any).updateLayoutSwitcher = updateLayoutSwitcher;
