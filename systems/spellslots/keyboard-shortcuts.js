// [SECTION:KEYBOARD_SHORTCUTS]
// Extrahiert aus spellslots.js
// Keyboard Shortcuts
// Zeilen: 193
// KEYBOARD SHORTCUTS
// ============================================================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        // Ignoriere Shortcuts wenn in Input/Textarea
        const activeEl = document.activeElement;
        const isTyping =
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl?.tagName) ||
            activeEl?.isContentEditable;

        // ============================================================
        // SOUNDBOARD QUICK-SLOTS (D-03) — Alt+Shift+0..5
        // MUSS vor dem isTyping-Guard stehen, damit der Shortcut auch
        // beim Tippen in Textfeldern funktioniert (Modifier-Combo).
        // e.code als primaere Pruefrung (layout-unabhaengig, A4); e.key als Fallback.
        // ============================================================
        if (e.altKey && e.shiftKey) {
            const codeMatch = e.code && e.code.match(/^Digit([0-5])$/);
            const keyMatch = !codeMatch && e.key >= '0' && e.key <= '5';
            const digit = codeMatch ? parseInt(codeMatch[1]) : (keyMatch ? parseInt(e.key) : -1);

            if (digit >= 0) {
                e.preventDefault();
                if (digit === 0) {
                    // Alt+Shift+0 — Mute toggle
                    if (typeof window.toggleSoundboardMute === 'function') {
                        window.toggleSoundboardMute();
                    }
                } else {
                    // Alt+Shift+1..5 — Quick-Slot aktivieren (D-03)
                    if (typeof window.activateSceneBySlot === 'function') {
                        window.activateSceneBySlot(digit);
                    }
                }
                return;
            }
        }

        // Escape: Schließe Overlays und Modals (konsolidiert)
        // WR-10: Direktaufrufe via window.X() — KEIN function-scoped
        // `const X = window.X` (CLAUDE.md Dedup-Regel, Incident 2026-01-10)
        if (e.key === 'Escape') {
            // 1. Shortcuts-Overlay schließen
            const shortcutsOverlay = $('shortcuts-overlay');
            if (shortcutsOverlay?.classList.contains('show')) {
                if (typeof window.hideShortcutsOverlay === 'function') window.hideShortcutsOverlay();
                return;
            }
            // 2. Quick-Ref schließen
            const quickRef = $('quick-ref-panel');
            if (quickRef?.classList.contains('open')) {
                if (typeof window.toggleQuickRef === 'function') window.toggleQuickRef();
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
            if (typeof window.undo === 'function') window.undo();
            return;
        }
        // Strg+Y oder Strg+Shift+Z: Redo (immer aktiv)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            if (typeof window.redo === 'function') window.redo();
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
        if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'k') && !e.shiftKey) {
            e.preventDefault();
            $('global-search')?.focus();
            return;
        }
        // Strg+Shift+K: Command Palette (TECH-04)
        // WR-01: In Firefox öffnet Strg+Shift+K die Web-Konsole (nicht abfangbar) —
        // Strg+Punkt ist die browserneutrale Alternative.
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
            e.preventDefault();
            if (typeof window.toggleCommandPalette === 'function') window.toggleCommandPalette();
            return;
        }
        // Strg+Punkt: Command Palette (Firefox-kompatible Alternative, WR-01)
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === '.') {
            e.preventDefault();
            if (typeof window.toggleCommandPalette === 'function') window.toggleCommandPalette();
            return;
        }
        // Folgende nur wenn nicht am Tippen
        if (isTyping) return;
        // ?: Shortcuts-Overlay
        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
            e.preventDefault();
            if (typeof window.showShortcutsOverlay === 'function') window.showShortcutsOverlay();
            return;
        }
        // /: Quick Reference öffnen und Suche fokussieren
        if (e.key === '/') {
            e.preventDefault();
            const panel = $('quick-ref-panel');
            if (panel && !panel.classList.contains('active')) {
                if (typeof window.toggleQuickRef === 'function') window.toggleQuickRef();
            }
            setTimeout(() => $('qref-search-input')?.focus(), 100);
            return;
        }
        // T: Session Timer toggle
        if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (typeof window.toggleSessionTimer === 'function') window.toggleSessionTimer();
            return;
        }
        // Ziffern 1-9: Tab-Wechsel (entspricht der Standard-Tab-Reihenfolge)
        if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const tabs = [
                'dashboard',
                'party',
                'npcs',
                'locations',
                'quests',
                'encounter',
                'initiative',
                'shops',
                'loot'
            ];
            const idx = parseInt(e.key) - 1;
            if (tabs[idx]) {
                e.preventDefault();
                switchView(tabs[idx]);
            }
            return;
        }
        // Alt+Ziffern: Schnellwürfel
        if (e.altKey && e.key >= '1' && e.key <= '9') {
            const dice = { 1: 12, 2: 20, 4: 4, 6: 6, 8: 8 };
            if (dice[e.key]) {
                e.preventDefault();
                quickRoll(dice[e.key]);
            }
            return;
        }
        // Space: Nächster Zug (nur im Initiative-Tab)
        if (e.key === ' ' && document.querySelector('#view-initiative.active')) {
            e.preventDefault();
            if (typeof window.nextTurn === 'function') window.nextTurn();
            return;
        }
        // Delete/Backspace: Node löschen (nur im Network-Tab)
        if (
            (e.key === 'Delete' || e.key === 'Backspace') &&
            document.querySelector('#view-network.active')
        ) {
            e.preventDefault();
            if (typeof window.deleteSelectedNode === 'function') window.deleteSelectedNode();
            return;
        }
        // N: Nächster Zug im Initiative
        if (e.key === 'n' && !e.shiftKey && document.querySelector('#view-initiative.active')) {
            e.preventDefault();
            if (typeof window.nextTurn === 'function') window.nextTurn();
            return;
        }
        // Shift+N: Neue Runde
        if (e.key === 'N' && e.shiftKey && document.querySelector('#view-initiative.active')) {
            e.preventDefault();
            if (typeof window.nextEncounterRound === 'function') window.nextEncounterRound();
            return;
        }
        // P: Vorheriger Zug
        if (e.key === 'p' && document.querySelector('#view-initiative.active')) {
            e.preventDefault();
            if (typeof window.prevTurn === 'function') window.prevTurn();
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
            if (typeof window.toggleEventLog === 'function') window.toggleEventLog();
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
        // IN-02: Der frühere zweite '?'-Block (showKeyboardHelp) war unerreichbar —
        // '?' wird bereits weiter oben vom Shortcuts-Overlay abgefangen. Entfernt.
    });
}
// ============================================================
