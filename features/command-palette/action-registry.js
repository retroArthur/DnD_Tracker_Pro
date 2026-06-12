// [SECTION:ACTION_REGISTRY]
// Aktions-Register fuer die Command Palette: Fuzzy-Suche ueber alle App-Aktionen
// Implementierung: Phase 2, Welle 2 (Plan 02-05)
// Analog: systems/spellslots/keyboard-shortcuts.js (action-dispatch Muster)

// Aktions-Register: alle Command-Palette-Aktionen
const ACTION_REGISTRY = [
    // --- Entitaeten erstellen ---
    {
        id: 'new-npc',
        label: 'Neuer NPC',
        keywords: ['npc', 'gegenspieler', 'person', 'erstellen', 'hinzufuegen'],
        action: () => { window.showModal('npc-modal'); }
    },
    {
        id: 'new-char',
        label: 'Neuer Charakter',
        keywords: ['charakter', 'char', 'spieler', 'party', 'held', 'erstellen'],
        action: () => {
            if (typeof window.toggleCollapse === 'function') window.toggleCollapse('char-form');
            if (typeof window.switchView === 'function') window.switchView('party');
        }
    },
    {
        id: 'new-quest',
        label: 'Neue Quest',
        keywords: ['quest', 'aufgabe', 'auftrag', 'mission', 'erstellen'],
        action: () => { window.showModal('quest-modal'); }
    },
    {
        id: 'new-location',
        label: 'Neuer Ort',
        keywords: ['ort', 'location', 'platz', 'region', 'erstellen'],
        action: () => { window.showModal('location-modal'); }
    },
    {
        id: 'new-encounter',
        label: 'Neuer Encounter',
        keywords: ['encounter', 'begegnung', 'kampf', 'monster', 'erstellen'],
        action: () => {
            if (typeof window.toggleCollapse === 'function') window.toggleCollapse('enc-form');
            if (typeof window.switchView === 'function') window.switchView('encounter');
        }
    },
    // --- Wuerfeln ---
    {
        id: 'roll-d20',
        label: 'Wuerfle d20',
        keywords: ['wuerfeln', 'wuerfel', 'roll', 'w20', 'd20', 'zwanzig', 'zufall'],
        action: () => { if (typeof window.quickRoll === 'function') window.quickRoll(20); }
    },
    {
        id: 'roll-d6',
        label: 'Wuerfle d6',
        keywords: ['wuerfeln', 'wuerfel', 'roll', 'w6', 'd6', 'sechs'],
        action: () => { if (typeof window.quickRoll === 'function') window.quickRoll(6); }
    },
    {
        id: 'roll-d8',
        label: 'Wuerfle d8',
        keywords: ['wuerfeln', 'wuerfel', 'roll', 'w8', 'd8', 'acht'],
        action: () => { if (typeof window.quickRoll === 'function') window.quickRoll(8); }
    },
    {
        id: 'roll-formula',
        label: 'Wuerfle 8d6',
        keywords: ['wuerfeln', 'wuerfel', 'formel', '8d6', 'feuerball', 'schaden', 'formeleingabe', 'roll'],
        action: () => {
            if (typeof window.switchView === 'function') window.switchView('dice');
        }
    },
    // --- Rueckgaengig / Speichern ---
    {
        id: 'undo',
        label: 'Rueckgaengig',
        keywords: ['undo', 'zurueck', 'rueckgaengig', 'wiederherstellen'],
        action: () => { if (typeof window.undo === 'function') window.undo(); }
    },
    {
        id: 'redo',
        label: 'Wiederholen',
        keywords: ['redo', 'wiederholen', 'erneut'],
        action: () => { if (typeof window.redo === 'function') window.redo(); }
    },
    // --- Navigation ---
    {
        id: 'nav-dashboard',
        label: 'Zum Dashboard',
        keywords: ['dashboard', 'startseite', 'uebersicht', 'navigation'],
        action: () => { if (typeof window.switchView === 'function') window.switchView('dashboard'); }
    },
    {
        id: 'nav-party',
        label: 'Zur Party',
        keywords: ['party', 'gruppe', 'charaktere', 'spieler', 'navigation'],
        action: () => { if (typeof window.switchView === 'function') window.switchView('party'); }
    },
    {
        id: 'nav-npcs',
        label: 'Zu den NPCs',
        keywords: ['npc', 'npcs', 'personen', 'navigation'],
        action: () => { if (typeof window.switchView === 'function') window.switchView('npcs'); }
    },
    {
        id: 'nav-initiative',
        label: 'Zur Initiative',
        keywords: ['initiative', 'kampf', 'runde', 'navigation', 'initiative-tracker'],
        action: () => { if (typeof window.switchView === 'function') window.switchView('initiative'); }
    },
    {
        id: 'nav-quests',
        label: 'Zu den Quests',
        keywords: ['quests', 'aufgaben', 'missionen', 'navigation'],
        action: () => { if (typeof window.switchView === 'function') window.switchView('quests'); }
    },
    {
        id: 'nav-locations',
        label: 'Zu den Orten',
        keywords: ['orte', 'locations', 'plaetze', 'navigation'],
        action: () => { if (typeof window.switchView === 'function') window.switchView('locations'); }
    },
    {
        id: 'nav-dice',
        label: 'Zum Wuerfelbereich',
        keywords: ['wuerfel', 'dice', 'navigation'],
        action: () => { if (typeof window.switchView === 'function') window.switchView('dice'); }
    },
    // --- Einstellungen / System ---
    {
        id: 'open-settings',
        label: 'Einstellungen oeffnen (Daten-Tab)',
        keywords: ['einstellungen', 'optionen', 'config', 'konfiguration', 'settings', 'daten'],
        action: () => {
            // Es gibt kein settings-modal — die Einstellungen liegen im Daten-Tab (CR-07)
            if (typeof window.switchView === 'function') window.switchView('data');
        }
    },
    {
        id: 'backup-setup',
        label: 'Datei-Backup einrichten',
        keywords: ['backup', 'sichern', 'datei', 'datei-backup', 'sicherung'],
        action: () => {
            if (typeof window.showFileBackupSetup === 'function') window.showFileBackupSetup();
        }
    },
    {
        id: 'open-about',
        label: 'Info / Impressum',
        keywords: ['info', 'impressum', 'ueber', 'version', 'about'],
        action: () => { window.showModal('about-modal'); }
    }
];

// Suche via bestehendem fuzzyMatch() aus systems/search/global-search.js
// KEIN const fuzzyMatch = window.fuzzyMatch innerhalb von Funktionen (CLAUDE.md Dedup-Regel)
function searchActions(query) {
    if (!query || query.length < 1) {
        return ACTION_REGISTRY.slice(0, 8);
    }
    return ACTION_REGISTRY
        .map(function(a) {
            var labelResult = fuzzyMatch(a.label, query);
            var labelScore = labelResult.score;
            var keywordScore = 0;
            var keywords = a.keywords || [];
            for (var i = 0; i < keywords.length; i++) {
                var kwResult = fuzzyMatch(keywords[i], query);
                if (kwResult.score > keywordScore) {
                    keywordScore = kwResult.score;
                }
            }
            return { id: a.id, label: a.label, keywords: a.keywords, action: a.action, score: Math.max(labelScore, keywordScore) };
        })
        .filter(function(a) { return a.score > 0; })
        .sort(function(a, b) { return b.score - a.score; })
        .slice(0, 10);
}

// Globale Exports fuer andere Module
window.ACTION_REGISTRY = ACTION_REGISTRY;
window.searchActions = searchActions;
