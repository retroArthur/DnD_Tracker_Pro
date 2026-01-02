// [SECTION:KEYBOARD_SHORTCUTS]
// Extrahiert aus spellslots.js
// Keyboard Shortcuts
// Zeilen: 193

// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', (e) => {
    // Ignoriere Shortcuts wenn in Input/Textarea
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) ||
                     document.activeElement?.isContentEditable;
    
    // Escape: Schließe Overlays und Modals (konsolidiert)
    if (e.key === 'Escape') {
        // 1. Shortcuts-Overlay schließen
        const shortcutsOverlay = $('shortcuts-overlay');
        if (shortcutsOverlay?.classList.contains('show')) {
            hideShortcutsOverlay();
            return;
        }
        // 2. Quick-Ref schließen
        const quickRef = $('quick-ref-panel');
        if (quickRef?.classList.contains('open')) {
            toggleQuickRef();
            return;
        }
        // 3. Offenes Modal schließen
        const openModal = document.querySelector('.modal-overlay.show');
        if (openModal) {
            openModal.classList.remove('show');
            return;
        }
    }

    // Strg+Z: Undo (immer aktiv)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
    }

    // Strg+Y oder Strg+Shift+Z: Redo (immer aktiv)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
    }

    // Strg+S: Speichern (immer aktiv)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveImmediate();
        showToast('Gespeichert');
        return;
    }

    // Strg+K oder Strg+F: Globale Suche
    if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'k')) {
        e.preventDefault();
        $('global-search')?.focus();
        return;
    }
    
    // Folgende nur wenn nicht am Tippen
    if (isTyping) return;
    
    // ?: Shortcuts-Overlay
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        showShortcutsOverlay();
        return;
    }

    // /: Quick Reference öffnen und Suche fokussieren
    if (e.key === '/') {
        e.preventDefault();
        const panel = $('quick-ref-panel');
        if (panel && !panel.classList.contains('active')) {
            toggleQuickRef();
        }
        setTimeout(() => $('qref-search-input')?.focus(), 100);
        return;
    }

    // T: Session Timer toggle
    if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleSessionTimer();
        return;
    }
    
    // Ziffern 1-9: Tab-Wechsel (entspricht der Standard-Tab-Reihenfolge)
    if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tabs = ['dashboard','party','npcs','locations','quests','encounter','initiative','shops','loot'];
        const idx = parseInt(e.key) - 1;
        if (tabs[idx]) {
            e.preventDefault();
            switchView(tabs[idx]);
        }
        return;
    }
    
    // Alt+Ziffern: Schnellwürfel
    if (e.altKey && e.key >= '1' && e.key <= '9') {
        const dice = { '1': 12, '2': 20, '4': 4, '6': 6, '8': 8 };
        if (dice[e.key]) {
            e.preventDefault();
            quickRoll(dice[e.key]);
        }
        return;
    }
    
    // Space: Nächster Zug (nur im Initiative-Tab)
    if (e.key === ' ' && document.querySelector('#view-initiative.active')) {
        e.preventDefault();
        nextTurn();
        return;
    }
    
    // Delete/Backspace: Node löschen (nur im Network-Tab)
    if ((e.key === 'Delete' || e.key === 'Backspace') && document.querySelector('#view-network.active')) {
        e.preventDefault();
        deleteSelectedNode();
        return;
    }
    
    // N: Nächster Zug im Initiative
    if (e.key === 'n' && !e.shiftKey && document.querySelector('#view-initiative.active')) {
        e.preventDefault();
        nextTurn();
        return;
    }
    
    // Shift+N: Neue Runde
    if (e.key === 'N' && e.shiftKey && document.querySelector('#view-initiative.active')) {
        e.preventDefault();
        nextEncounterRound();
        return;
    }
    
    // P: Vorheriger Zug
    if (e.key === 'p' && document.querySelector('#view-initiative.active')) {
        e.preventDefault();
        prevTurn();
        return;
    }
    
    // R: Quick Roll d20
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        quickRoll(20);
        return;
    }

    // L: Event Log toggle
    if (e.key === 'l' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleEventLog();
        return;
    }

    // N: Neues Element (kontextabhängig)
    if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const activeView = document.querySelector('.view.active')?.id;
        if (activeView === 'view-party') toggleCollapse('char-form');
        else if (activeView === 'view-npcs') showModal('npc-modal');
        else if (activeView === 'view-quests') showModal('quest-modal');
        else if (activeView === 'view-encounter') toggleCollapse('enc-form');
        return;
    }
    
    // ? : Hilfe anzeigen
    if (e.key === '?') {
        e.preventDefault();
        showKeyboardHelp();
        return;
    }
});

function showKeyboardHelp() {
    const helpHtml = `
        <div style="display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between;"><span>Speichern</span><kbd>Strg+S</kbd></div>
            <div style="display: flex; justify-content: space-between;"><span>Rückgängig</span><kbd>Strg+Z</kbd></div>
            <div style="display: flex; justify-content: space-between;"><span>Suche</span><kbd>Strg+F</kbd></div>
            <div style="display: flex; justify-content: space-between;"><span>Schließen</span><kbd>Escape</kbd></div>
            <div class="divider"></div>
            <div style="display: flex; justify-content: space-between;"><span>Tab 1-9</span><kbd>1-9</kbd></div>
            <div style="display: flex; justify-content: space-between;"><span>Neues Element</span><kbd>N</kbd></div>
            <div style="display: flex; justify-content: space-between;"><span>Nächster Zug</span><kbd>Space</kbd></div>
            <div style="display: flex; justify-content: space-between;"><span>Würfeln (d20)</span><kbd>R</kbd></div>
            <div style="display: flex; justify-content: space-between;"><span>Event Log</span><kbd>L</kbd></div>
        </div>
    `;
    
    // Einfaches Alert-Modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.innerHTML = `
        <div class="modal" style="max-width: 350px;">
            <div class="modal-header">
                <span class="modal-title">⌨️ Tastenkürzel</span>
                <button class="btn btn-sm" data-action="close-modal-overlay">✕</button>
            </div>
            ${helpHtml}
        </div>
    `;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
}

// ============================================================
