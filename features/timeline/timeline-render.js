// [SECTION:TIMELINE_RENDER]
// Kampagnen-Timeline & Harptos-Kalender — Render-Modul (WELT-03)
// Wave 0: Skelett mit defensiven Container-Checks
// Implementierung: Plan 05-05
// ============================================================
// Verwendete Globals: window.D, HARPTOS_MONTHS, esc

/**
 * Rendert die Timeline-Ereignisliste (chronologisch sortiert).
 * Stub: Wave 0 — leere Platzhalter-Ansicht.
 */
function renderTimeline() {
    const container = $('tl-events-list');
    if (!container) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderTimeline] Container #tl-events-list fehlt — nicht auf kalender-Tab');
        }
        return;
    }
    const events = (window.D && window.D.calendar && window.D.calendar.events) ? window.D.calendar.events : [];
    if (events.length === 0) {
        container.innerHTML = '<div class="tl-empty-state"><p>Noch keine Timeline-Ereignisse.</p></div>';
    } else {
        container.innerHTML = '<div class="tl-list"></div>';
    }
}

/**
 * Rendert die Kalender-Kopfzeile mit aktuellem Harptos-Datum.
 * Stub: Wave 0 — zeigt einfache Datumsanzeige.
 */
function renderKalender() {
    const container = $('tl-kalender-header');
    if (!container) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderKalender] Container #tl-kalender-header fehlt — nicht auf kalender-Tab');
        }
        return;
    }
    const cal = (window.D && window.D.calendar) ? window.D.calendar : { day: 1, month: 1, year: 1492 };
    const months = window.HARPTOS_MONTHS || [];
    const monthObj = months.find(function(m) { return m.nr === cal.month; });
    const monthName = monthObj ? monthObj.name : 'Monat ' + cal.month;
    container.innerHTML = '<span id="kalender-monat-anzeige">' + esc(monthName) + ' ' + esc(String(cal.year)) + ' DR</span>';
}

window.renderTimeline = renderTimeline;
window.renderKalender = renderKalender;
