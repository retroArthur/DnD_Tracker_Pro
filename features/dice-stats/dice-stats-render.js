// [SECTION:DICE_STATS_RENDER]
// Render-Funktionen fuer Wuerfel-Statistiken-Tab (Phase 7 — UX-02)
// Echte UI (SVG-Histogramm, Crit/Fumble-Quote, Session-Filter, Character-Breakdown) folgt in 07-04.

/**
 * renderDiceStats — defensive Platzhalter-Render fuer Wave-0.
 * Registriert im TAB_RENDER_REGISTRY; 07-04 fuellt echten Inhalt ein.
 */
function renderDiceStats() {
    var c = $('dicestats-container');
    if (!c) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderDiceStats] Container #dicestats-container nicht gefunden — nicht auf Statistiken-Tab?');
        }
        return;
    }
    c.innerHTML = '<p style="color: var(--text-dim); text-align: center; padding: 2rem;">📊 Wuerfel-Statistiken — wird in Phase 7-04 implementiert.</p>';
}

window.renderDiceStats = renderDiceStats;
