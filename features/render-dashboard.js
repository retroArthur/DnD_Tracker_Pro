// ============================================================
// DASHBOARD - Render-Funktionen  
// ============================================================
// Extrahiert aus render/main.js

// Globale Render-State-Variable
let renderPending = false;

function renderAll() {
    // Verhindere mehrfaches Rendern im selben Frame
    if (renderPending) return;
    renderPending = true;
    
    requestAnimationFrame(() => {
        renderPending = false;
        
        // Jede Render-Funktion einzeln in try-catch mit ErrorHandler
        const renderSafe = (fn, name, containerId = null) => {
            try { 
                fn(); 
            } catch (e) { 
                ErrorHandler.log(name, e);
                // Bei kritischen Render-Funktionen: Fehler im Container anzeigen
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
        
        // IO-Counter aktualisieren
        try { updateIOCounts(); } catch (e) { ErrorHandler.log('updateIOCounts', e); }
    });
}

// ============================================================
// PARTY
// ============================================================

