// [SECTION:BESTIARY_RENDER]
// ============================================================
// BESTIARY RENDER — @list @detail @filter @badges @favorites
// Stub: Render-Inhalt wird durch Plan 03 gefuellt.
// ============================================================

function renderBestiaryList() {
    const container = window.$('bestiary-list');
    if (!container) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            console.warn('[renderBestiaryList] Container #bestiary-list fehlt — vermutlich nicht auf Bestiary-Tab');
        }
        return;
    }
    // Stub: Inhalt wird durch Plan 03 gefuellt.
    // Im leeren Zustand zeigt das Template den leeren Zustand bereits korrekt an.
}

function cleanupBestiaryEditor() {
    // Stub: Schliesst offenen Editor beim Tab-Verlassen (gefuellt durch Plan 04).
}

window.renderBestiaryList = renderBestiaryList;
window.cleanupBestiaryEditor = cleanupBestiaryEditor;
