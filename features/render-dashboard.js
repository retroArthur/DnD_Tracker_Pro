// [SECTION:RENDER_DASHBOARD]
// ============================================================
// DASHBOARD - @render @tabs @overview
// ============================================================
// Global render state variable
let renderPending = false;
function renderAll() {
    const ErrorHandler = window.ErrorHandler;
    // Prevent multiple renders in the same frame
    if (renderPending)
        return;
    renderPending = true;
    requestAnimationFrame(() => {
        renderPending = false;
        // Each render function individually in try-catch with ErrorHandler
        const renderSafe = (fn, name, containerId = null) => {
            try {
                fn();
            }
            catch (e) {
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
        const renderParty = window.renderParty;
        const renderNPCList = window.renderNPCList;
        const renderLocations = window.renderLocations;
        const renderQuests = window.renderQuests;
        const renderEncounters = window.renderEncounters;
        const renderInit = window.renderInit;
        const renderLoot = window.renderLoot;
        const renderShops = window.renderShops;
        const renderSpells = window.renderSpells;
        const renderSessions = window.renderSessions;
        const renderLinks = window.renderLinks;
        const renderWiki = window.renderWiki;
        const renderFilterList = window.renderFilterList;
        const initQuickRefCustom = window.initQuickRefCustom;
        const updateIOCounts = window.updateIOCounts;
        renderSafe(renderParty, 'renderParty', 'party-list');
        renderSafe(renderNPCList, 'renderNPCList', 'npc-list');
        renderSafe(renderLocations, 'renderLocations', 'loc-grid');
        renderSafe(renderQuests, 'renderQuests', 'quests-list');
        renderSafe(renderEncounters, 'renderEncounters', 'encounter-list');
        renderSafe(renderInit, 'renderInit', 'init-list');
        renderSafe(renderLoot, 'renderLoot', 'loot-list');
        renderSafe(renderShops, 'renderShops', 'shops-container');
        renderSafe(renderSpells, 'renderSpells', 'spell-list');
        renderSafe(renderSessions, 'renderSessions', 'session-list');
        renderSafe(renderLinks, 'renderLinks', 'links-list');
        renderSafe(renderWiki, 'renderWiki');
        renderSafe(renderFilterList, 'renderFilterList');
        renderSafe(initQuickRefCustom, 'initQuickRefCustom');
        // Update IO-Counter
        try {
            updateIOCounts();
        }
        catch (e) {
            ErrorHandler.log('updateIOCounts', e);
        }
    });
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.renderAll = renderAll;
window.renderPending = renderPending;
