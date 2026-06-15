// [SECTION:REISE_RENDER]
// Reise- & Wetter-Simulator — Render-Modul (WELT-04)
// Wave 0: Skelett mit defensivem Container-Check
// Implementierung: Plan 05-06
// ============================================================
// Verwendete Globals: window.D, esc, REISE_TEMPO, REISE_GELÄNDE

/**
 * Rendert die Reise-Simulator-Ansicht.
 * Stub: Wave 0 — leere Platzhalter-Ansicht.
 */
function renderReise() {
    const container = $('view-reise');
    if (!container) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderReise] Container #view-reise fehlt — nicht auf reise-Tab');
        }
        return;
    }
    // Wave 0 Platzhalter — wird in Plan 05-06 durch echtes Rendering ersetzt
    container.innerHTML = '<div class="rs-empty-state"><p>Reise-Simulator wird in Plan 05-06 implementiert.</p></div>';
}

window.renderReise = renderReise;
