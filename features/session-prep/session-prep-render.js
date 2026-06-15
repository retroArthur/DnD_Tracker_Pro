// [SECTION:SESSION_PREP_RENDER]
// Session-Prep-Assistent — Render-Modul (WELT-01)
// Wave 0: Skelett mit defensivem Container-Check
// Implementierung: Plan 05-02
// ============================================================

/**
 * Rendert die Session-Prep-Liste im View-Container.
 * Stub: Wave 0 — gibt leere Platzhalter-Ansicht aus.
 */
function renderSessionPrepList() {
    const container = $('view-sessionprep');
    if (!container) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderSessionPrepList] Container #view-sessionprep fehlt — nicht auf sessionprep-Tab');
        }
        return;
    }
    // Wave 0 Platzhalter — wird in Plan 05-02 durch echtes Rendering ersetzt
    const preps = (window.D && window.D.sessionPreps) ? window.D.sessionPreps : [];
    if (preps.length === 0) {
        container.innerHTML = '<div class="wp-empty-state"><p>Noch keine Session-Vorbereitung angelegt. Klicke auf „+ Neue Session-Prep".</p></div>';
    } else {
        container.innerHTML = '<div class="wp-list" id="session-prep-list"></div>';
    }
}

window.renderSessionPrepList = renderSessionPrepList;
