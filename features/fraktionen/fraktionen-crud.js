// [SECTION:FRAKTIONEN_CRUD]
// Fraktionen & Ruf-System — CRUD-Modul (WELT-05)
// Wave 0: Skelett ohne vollständige Implementierung
// Implementierung: Plan 05-07
// ============================================================
// Verwendete Globals: window.D, pushUndo, esc, sanitizeHTML,
//   deleteWithConfirm, afterCrudOperation, parseEntityId, rufStufe

/**
 * Speichert eine Fraktion (Neu oder Update).
 * Stub: Wave 0 — Implementierung in Plan 05-07.
 */
function saveFraktion(data) {
    if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
        console.warn('[saveFraktion] Stub — Implementierung in Plan 05-07');
    }
}

/**
 * Löscht eine Fraktion mit Bestätigung und Undo.
 * Stub: Wave 0 — Implementierung in Plan 05-07.
 */
function deleteFraktion(id) {
    if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
        console.warn('[deleteFraktion] Stub — Implementierung in Plan 05-07');
    }
}

/**
 * Passt den Rufwert einer Fraktion an und schreibt einen Historieneintrag.
 * Stub: Wave 0 — Implementierung in Plan 05-07.
 * @param {number|string} fraktionId
 * @param {number} delta - Änderung (z.B. +10 oder -5)
 * @param {string} [grund] - Optionale Begründung
 */
function anpassenRuf(fraktionId, delta, grund) {
    if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
        console.warn('[anpassenRuf] Stub — Implementierung in Plan 05-07');
    }
}

window.saveFraktion = saveFraktion;
window.deleteFraktion = deleteFraktion;
window.anpassenRuf = anpassenRuf;
