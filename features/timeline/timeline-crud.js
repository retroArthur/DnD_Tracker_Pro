// [SECTION:TIMELINE_CRUD]
// Kampagnen-Timeline — CRUD-Modul (WELT-03)
// Wave 0: Skelett ohne vollständige Implementierung
// Implementierung: Plan 05-05
// ============================================================
// Verwendete Globals: window.D, pushUndo, esc, sanitizeHTML,
//   deleteWithConfirm, afterCrudOperation, parseEntityId, HARPTOS_MONTHS

/**
 * Speichert ein Timeline-Ereignis (Neu oder Update).
 * Stub: Wave 0 — Implementierung in Plan 05-05.
 */
function saveTimelineEvent(data) {
    if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
        console.warn('[saveTimelineEvent] Stub — Implementierung in Plan 05-05');
    }
}

/**
 * Löscht ein Timeline-Ereignis mit Bestätigung und Undo.
 * Stub: Wave 0 — Implementierung in Plan 05-05.
 */
function deleteTimelineEvent(id) {
    if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
        console.warn('[deleteTimelineEvent] Stub — Implementierung in Plan 05-05');
    }
}

/**
 * Rückt das In-Game-Datum um die angegebene Anzahl Tage vor.
 * Berücksichtigt Monatsübergänge im Harptos-Kalender (30 Tage/Monat, 12 Monate).
 * Stub: Wave 0 — Implementierung in Plan 05-05.
 * @param {number} tage - Anzahl Tage vorwärts
 */
function advanceCalendarDate(tage) {
    if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
        console.warn('[advanceCalendarDate] Stub — Implementierung in Plan 05-05');
    }
}

/**
 * Fügt ein Ereignis zum Kalender hinzu (gemeinsame Hilfsfunktion für Reise + Timeline).
 * Stub: Wave 0 — Implementierung in Plan 05-05.
 */
function addCalendarEvent(datum, titel, typ, quelleId) {
    if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
        console.warn('[addCalendarEvent] Stub — Implementierung in Plan 05-05');
    }
}

window.saveTimelineEvent = saveTimelineEvent;
window.deleteTimelineEvent = deleteTimelineEvent;
window.advanceCalendarDate = advanceCalendarDate;
window.addCalendarEvent = addCalendarEvent;
