// [SECTION:SESSION_PREP_CRUD]
// Session-Prep-Assistent — CRUD-Modul (WELT-01)
// Wave 0: Skelett ohne Implementierung
// Implementierung: Plan 05-02
// ============================================================
// Verwendete Globals: window.D, pushUndo, esc, sanitizeHTML,
//   deleteWithConfirm, afterCrudOperation, parseEntityId

/**
 * Speichert eine Session-Prep (Neu oder Update).
 * Stub: Wave 0 — Implementierung in Plan 05-02.
 */
function saveSessionPrep(data) {
    // Wave 0 Stub
    if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
        console.warn('[saveSessionPrep] Stub — Implementierung in Plan 05-02');
    }
}

/**
 * Löscht eine Session-Prep mit Bestätigung und Undo.
 * Stub: Wave 0 — Implementierung in Plan 05-02.
 */
function deleteSessionPrep(id) {
    // Wave 0 Stub
    if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
        console.warn('[deleteSessionPrep] Stub — Implementierung in Plan 05-02');
    }
}

window.saveSessionPrep = saveSessionPrep;
window.deleteSessionPrep = deleteSessionPrep;
