// [SECTION:NAVIGATION]
// Extrahiert aus spellslots.js
// Navigation
// Zeilen: 66

import { $ } from '@utils/basic';
import { showToast } from '@utils/utilities';

// NAVIGATION
// ============================================================
export function switchView(name: string): void {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });
    $('view-' + name)?.classList.add('active');
    const activeTab = document.querySelector(`[data-view="${name}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
    }

    // LEGACY SUPPORT: Keep existing special cases for backwards compatibility
    if (name === 'notes') {
        const sessionDate = $('session-date') as HTMLInputElement;
        if (sessionDate) sessionDate.value = new Date().toISOString().split('T')[0];
    }
    if (name === 'roadmap' && typeof (window as any).onRoadmapViewShow === 'function') {
        (window as any).onRoadmapViewShow();
    }

    // NEW: Use tab registry to render content
    const renderTabContent = (window as any).renderTabContent;
    if (renderTabContent) renderTabContent(name);

    // Mobile: Navigation schließen und Label aktualisieren
    const header = document.querySelector('.app-header');
    if (header) header.classList.remove('nav-open');

    // View-Name in Toggle-Bar aktualisieren
    const toggleText = document.querySelector('.mobile-nav-toggle-text');
    if (toggleText) {
        const viewNames: Record<string, string> = {
            'dashboard': '🏠 Start',
            'party': '👥 Party',
            'npcs': '🎭 NPCs',
            'locations': '🏠 Orte',
            'roadmap': '🗺️ Roadmap',
            'quests': '📜 Quests',
            'encounter': '👹 Encounter',
            'initiative': '⚔️ Initiative',
            'loot': '📦 Truhe',
            'shops': '🏪 Shops',
            'spells': '✨ Zauber',
            'notes': '📝 Notizen',
            'wiki': '📚 Wiki',
            'links': '🔗 Links',
            'dice': '🎲 Würfel',
            'timers': '⏱️ Timer',
            'maps': '🗺️ Karten',
            'data': '💾 Daten',
            'dmscreen': '🎮 DM Screen'
        };
        toggleText.textContent = viewNames[name] || '📍 Navigation';
    }
}

export function showModal(id: string): void {
    const modal = $(id);
    if (modal) modal.classList.add('show');

    const populateSelects = (window as any).populateSelects;
    if (populateSelects) populateSelects();

    if (id === 'timer-preset-modal') {
        const renderPresetList = (window as any).renderPresetList;
        if (renderPresetList) renderPresetList();
    }
    if (id === 'quest-modal') {
        const populateQuestSelects = (window as any).populateQuestSelects;
        if (populateQuestSelects) populateQuestSelects();
    }
}

export function hideModal(id: string): void {
    const modal = $(id);
    if (modal) modal.classList.remove('show');
}

export function toggleCollapse(id: string): void {
    const el = $(id);
    const icon = $(id + '-icon');

    if (el) {
        el.classList.toggle('open');
        if (icon) icon.textContent = el.classList.contains('open') ? '▲' : '▼';

        // Story-Arc Dropdown aktualisieren wenn Session-Formular geöffnet wird
        if (id === 'session-form' && el.classList.contains('open') && typeof (window as any).renderStoryArcSelects === 'function') {
            (window as any).renderStoryArcSelects();
        }
    }
}

export function showQuickNotesModal(): void {
    const D = (window as any).D;
    const quickNotes = $('quick-notes') as HTMLTextAreaElement;
    if (quickNotes) quickNotes.value = D.quickNotes || '';

    const modal = $('quicknotes-modal') as HTMLElement;
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

export function hideQuickNotesModal(): void {
    const modal = $('quicknotes-modal') as HTMLElement;
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

export function saveQuickNotes(): void {
    const D = (window as any).D;
    const quickNotes = $('quick-notes') as HTMLTextAreaElement;
    if (quickNotes) D.quickNotes = quickNotes.value;

    const save = (window as any).save;
    if (save) save();

    showToast('📝 Notizen gespeichert');
}

export function populateSelects(): void {
    const D = (window as any).D;
    const esc = (window as any).esc;

    // Location select for NPCs
    const locSel = $('npc-location') as HTMLSelectElement;
    if (locSel) {
        locSel.innerHTML = '<option value="">-- Ort --</option>' + (D.locations || []).map((l: any) => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
    }

    // Filter selects
    const filterOpts = '<option value="">-- Kein Filter --</option>' + (D.filters || []).map((f: any) => `<option value="${f.id}">${esc(f.name)}</option>`).join('');
    ['loc-filter', 'npc-filter'].forEach(id => {
        const select = $(id) as HTMLSelectElement;
        if (select) select.innerHTML = filterOpts;
    });
}
