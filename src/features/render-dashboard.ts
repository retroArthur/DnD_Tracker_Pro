// [SECTION:RENDER_DASHBOARD]
// ============================================================
// DASHBOARD - @render @tabs @overview
// ============================================================

import { $, esc } from '@utils/basic';

// Global render state variable
let renderPending = false;

export function renderAll(): void {
    const ErrorHandler = (window as any).ErrorHandler;

    // Prevent multiple renders in the same frame
    if (renderPending) return;
    renderPending = true;

    requestAnimationFrame(() => {
        renderPending = false;

        // Each render function individually in try-catch with ErrorHandler
        const renderSafe = (fn: () => void, name: string, containerId: string | null = null): void => {
            try {
                fn();
            } catch (e: any) {
                ErrorHandler.log(name, e);
                // For critical render functions: show error in container
                if (containerId) {
                    const container = $(containerId);
                    if (container) {
                        container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
                            <div class="empty-state-icon">⚠️</div>
                            <div class="empty-state-title">Anzeigefehler</div>
                            <div class="empty-state-desc">${esc(e.message || 'Unbekannter Fehler')}</div>
                        </div>`;
                    }
                }
            }
        };

        const renderParty = (window as any).renderParty;
        const renderNPCList = (window as any).renderNPCList;
        const renderLocations = (window as any).renderLocations;
        const renderQuests = (window as any).renderQuests;
        const renderEncounters = (window as any).renderEncounters;
        const renderInit = (window as any).renderInit;
        const renderLoot = (window as any).renderLoot;
        const renderShops = (window as any).renderShops;
        const renderSpells = (window as any).renderSpells;
        const renderSessions = (window as any).renderSessions;
        const renderLinks = (window as any).renderLinks;
        const renderWiki = (window as any).renderWiki;
        const renderFilterList = (window as any).renderFilterList;
        const renderMindmap = (window as any).renderMindmap;
        const initQuickRefCustom = (window as any).initQuickRefCustom;
        const updateIOCounts = (window as any).updateIOCounts;

        renderSafe(renderParty, 'renderParty', 'party-list');
        renderSafe(renderNPCList, 'renderNPCList', 'npc-list');
        renderSafe(renderLocations, 'renderLocations', 'loc-grid');
        renderSafe(renderQuests, 'renderQuests', 'quest-list');
        renderSafe(renderEncounters, 'renderEncounters', 'encounter-list');
        renderSafe(renderInit, 'renderInit', 'init-list');
        renderSafe(renderLoot, 'renderLoot', 'loot-list');
        renderSafe(renderShops, 'renderShops', 'shops-container');
        renderSafe(renderSpells, 'renderSpells', 'spell-list');
        renderSafe(renderSessions, 'renderSessions', 'session-list');
        renderSafe(renderLinks, 'renderLinks', 'links-list');
        renderSafe(renderWiki, 'renderWiki');
        renderSafe(renderFilterList, 'renderFilterList');
        renderSafe(renderMindmap, 'renderMindmap', 'mindmap-container');
        renderSafe(initQuickRefCustom, 'initQuickRefCustom');

        // Update IO-Counter
        try { updateIOCounts(); } catch (e: any) { ErrorHandler.log('updateIOCounts', e); }
    });
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).renderAll = renderAll;
(window as any).renderPending = renderPending;
