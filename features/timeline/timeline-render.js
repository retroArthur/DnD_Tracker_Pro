// [SECTION:TIMELINE_RENDER]
// Kampagnen-Timeline & Harptos-Kalender — Render-Modul (WELT-03)
// Implementiert: Plan 05-05
// ============================================================
// Globals: window.D, HARPTOS_MONTHS, esc, sanitizeHTML, sortiereTimelineEvents
// Container: #tl-kalender-header, #tl-events-list

/**
 * Rendert die Kalender-Kopfzeile mit aktuellem Harptos-Datum.
 * Zeigt: "{Tag}. {MonatsName} {Jahr} DR" und Jahreszeit-Badge.
 */
function renderKalender() {
    var container = document.getElementById('tl-kalender-header');
    if (!container) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderKalender] Container #tl-kalender-header fehlt — nicht auf kalender-Tab');
        }
        return;
    }

    var cal = (window.D && window.D.calendar)
        ? window.D.calendar
        : { day: 1, month: 1, year: 1492 };

    var months = window.HARPTOS_MONTHS || [];
    var monthNr = parseInt(cal.month, 10) || 1;
    var monthObj = months.find(function(m) { return m.nr === monthNr; });
    var monthName = monthObj ? monthObj.name : 'Monat ' + monthNr;
    var day = parseInt(cal.day, 10) || 1;
    var year = parseInt(cal.year, 10) || 1492;

    var jahreszeit = monthObj ? monthObj.jahreszeit : '';
    var jahreszeitLabel = {
        winter: '❄️ Winter',
        fruehling: '🌱 Frühling',
        sommer: '☀️ Sommer',
        herbst: '🍂 Herbst'
    }[jahreszeit] || '';

    var html = [
        '<div class="tl-kalender-datum">',
        '  <span id="kalender-monat-anzeige">',
        esc(day + '. ' + monthName + ' ' + year + ' DR'),
        '  </span>',
        jahreszeitLabel ? '<span class="tl-jahreszeit-badge">' + jahreszeitLabel + '</span>' : '',
        '</div>',
        '<div class="tl-kalender-actions">',
        '  <button class="btn btn-sm" data-action="show-timeline-modal" title="Neues Ereignis">+ Ereignis</button>',
        '</div>'
    ].join('');

    container.innerHTML = html;
}

/**
 * Rendert die Timeline-Ereignisliste chronologisch sortiert.
 * Zeigt Auto-Vorschläge aus D.sessionNotes.
 */
function renderTimeline() {
    var container = document.getElementById('tl-events-list');
    if (!container) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderTimeline] Container #tl-events-list fehlt — nicht auf kalender-Tab');
        }
        return;
    }

    var d = window.D;
    var events = (d && d.calendar && Array.isArray(d.calendar.events))
        ? d.calendar.events
        : [];

    // Chronologisch sortieren (via geteilten Helfer)
    var sorted = (typeof sortiereTimelineEvents === 'function')
        ? sortiereTimelineEvents(events)
        : events.slice();

    // Auto-Vorschläge aus D.sessionNotes
    var vorschlaege = _sammleAutoVorschlaege(d);

    var html = [];

    // Auto-Vorschlag-Bereich
    if (vorschlaege.length > 0) {
        html.push('<div class="tl-vorschlag-bereich">');
        html.push('<div class="tl-vorschlag-header">📋 Vorgeschlagene Ereignisse</div>');
        vorschlaege.forEach(function(vs) {
            html.push(
                '<div class="tl-vorschlag-card" data-vorschlag-id="' + esc(String(vs.quelleId || '')) + '" data-vorschlag-typ="' + esc(vs.typ) + '">',
                '  <div class="tl-vorschlag-titel">' + esc(vs.titel) + '</div>',
                '  <div class="tl-vorschlag-meta">aus: ' + esc(vs.quelle) + '</div>',
                '  <div class="tl-vorschlag-actions">',
                '    <button class="btn btn-sm btn-primary" data-action="confirm-auto-event" data-id="' + esc(String(vs.quelleId || '')) + '" data-value="' + esc(vs.typ) + '">✓ Übernehmen</button>',
                '    <button class="btn btn-sm" data-action="dismiss-auto-event" data-id="' + esc(String(vs.quelleId || '')) + '" data-value="' + esc(vs.typ) + '">✕ Verwerfen</button>',
                '  </div>',
                '</div>'
            );
        });
        html.push('</div>');
    }

    // Timeline-Liste
    if (sorted.length === 0) {
        html.push('<div class="tl-empty-state"><p>Noch keine Timeline-Ereignisse.</p><p class="tl-empty-hint">Klicke auf „+ Ereignis", um das erste Ereignis hinzuzufügen.</p></div>');
    } else {
        html.push('<div class="tl-list">');
        sorted.forEach(function(ev) {
            var datum = ev.datum || {};
            var months = window.HARPTOS_MONTHS || [];
            var mObj = months.find(function(m) { return m.nr === datum.monat; });
            var mName = mObj ? mObj.name : ('M' + (datum.monat || '?'));
            var datumStr = (datum.tag || '?') + '. ' + mName + ' ' + (datum.jahr || '?') + ' DR';
            var typBadge = {
                manuell: '<span class="tl-typ-badge tl-typ-manuell">Manuell</span>',
                reise: '<span class="tl-typ-badge tl-typ-reise">Reise</span>',
                session: '<span class="tl-typ-badge tl-typ-session">Session</span>'
            }[ev.typ] || '';

            html.push(
                '<div class="tl-event-card">',
                '  <div class="tl-event-header">',
                '    <span class="tl-event-datum">' + esc(datumStr) + '</span>',
                '    ' + typBadge,
                '    <div class="tl-event-actions">',
                '      <button class="btn btn-sm btn-danger" data-action="delete-timeline-event" data-id="' + esc(String(ev.id)) + '" title="Löschen">×</button>',
                '    </div>',
                '  </div>',
                '  <div class="tl-event-titel">' + esc(ev.titel || '') + '</div>',
                ev.beschreibung ? '<div class="tl-event-beschreibung">' + esc(ev.beschreibung) + '</div>' : '',
                '</div>'
            );
        });
        html.push('</div>');
    }

    container.innerHTML = html.join('\n');

    // Zähler aktualisieren
    var countEl = document.getElementById('kalender-count');
    if (countEl) countEl.textContent = String(events.length);
}

/**
 * Sammelt Auto-Vorschläge aus D.sessionNotes.
 * Gibt nur Vorschläge zurück, die noch nicht als Timeline-Eintrag existieren.
 * @param {Object} d - Globales D-Objekt
 * @returns {Array<{titel, quelle, typ, quelleId}>}
 */
function _sammleAutoVorschlaege(d) {
    if (!d) return [];
    var vorschlaege = [];
    var dismissed = _getDismissedVorschlaege();
    var existierende = new Set();

    // Existierende Events aus D.calendar.events sammeln
    var events = (d.calendar && Array.isArray(d.calendar.events)) ? d.calendar.events : [];
    events.forEach(function(ev) {
        if (ev.quelleId && ev.typ === 'session') {
            existierende.add('session:' + ev.quelleId);
        }
    });

    // Aus D.sessionNotes: jede Session ohne Timeline-Eintrag vorschlagen
    var notes = Array.isArray(d.sessionNotes) ? d.sessionNotes : [];
    notes.forEach(function(note) {
        var key = 'session:' + note.id;
        if (existierende.has(key)) return;
        if (dismissed.has(key)) return;
        if (!note.title && !note.date) return;
        vorschlaege.push({
            titel: 'Session: ' + (note.title || note.date || 'Sitzung ' + note.id),
            quelle: 'Sitzungsnotiz',
            typ: 'session',
            quelleId: note.id
        });
    });

    return vorschlaege;
}

/**
 * Liest verworfene Vorschläge aus sessionStorage (kein D-Schreibzugriff).
 * @returns {Set<string>}
 */
function _getDismissedVorschlaege() {
    try {
        var raw = sessionStorage.getItem('tl-dismissed-vorschlaege');
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
        return new Set();
    }
}

/**
 * Zeigt das Modal zum Anlegen eines neuen Timeline-Eintrags.
 * Erstellt das Modal dynamisch (transient, kein festes HTML-Skelett).
 */
function showTimelineModal() {
    var existingModal = document.getElementById('tl-event-modal');
    if (existingModal) existingModal.remove();

    var d = window.D;
    var cal = (d && d.calendar) ? d.calendar : { day: 1, month: 1, year: 1492 };
    var months = window.HARPTOS_MONTHS || [];

    // Monat-Select Optionen
    var monatOptions = months.map(function(m) {
        var selected = m.nr === cal.month ? ' selected' : '';
        return '<option value="' + m.nr + '"' + selected + '>' + esc(m.nr + '. ' + m.name) + '</option>';
    }).join('');

    var modalHtml = [
        '<div class="modal-overlay active" id="tl-event-modal">',
        '  <div class="modal-box">',
        '    <div class="modal-header">',
        '      <h3>📅 Neues Ereignis</h3>',
        '      <button class="modal-close" data-action="close-timeline-modal">×</button>',
        '    </div>',
        '    <div class="modal-body">',
        '      <div class="tl-form-row">',
        '        <div class="tl-form-col tl-form-col-sm">',
        '          <label class="form-label">Tag</label>',
        '          <input type="number" id="tl-form-tag" class="form-control" min="1" max="30" value="' + esc(String(cal.day || 1)) + '">',
        '        </div>',
        '        <div class="tl-form-col">',
        '          <label class="form-label">Monat</label>',
        '          <select id="tl-form-monat" class="form-control">',
        monatOptions,
        '          </select>',
        '        </div>',
        '        <div class="tl-form-col tl-form-col-sm">',
        '          <label class="form-label">Jahr</label>',
        '          <input type="number" id="tl-form-jahr" class="form-control" value="' + esc(String(cal.year || 1492)) + '">',
        '        </div>',
        '      </div>',
        '      <div class="tl-form-field">',
        '        <label class="form-label">Titel *</label>',
        '        <input type="text" id="tl-form-titel" class="form-control" placeholder="Ereignis-Titel..." maxlength="200">',
        '      </div>',
        '      <div class="tl-form-field">',
        '        <label class="form-label">Beschreibung</label>',
        '        <textarea id="tl-form-beschreibung" class="form-control" rows="3" placeholder="Optionale Beschreibung..."></textarea>',
        '      </div>',
        '      <div class="tl-form-field">',
        '        <label class="form-label">Typ</label>',
        '        <select id="tl-form-typ" class="form-control">',
        '          <option value="manuell">Manuell</option>',
        '          <option value="session">Session</option>',
        '          <option value="reise">Reise</option>',
        '        </select>',
        '      </div>',
        '    </div>',
        '    <div class="modal-footer">',
        '      <button class="btn btn-primary" data-action="save-timeline-event">Speichern</button>',
        '      <button class="btn" data-action="close-timeline-modal">Abbrechen</button>',
        '    </div>',
        '  </div>',
        '</div>'
    ].join('\n');

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Autofokus Titel
    setTimeout(function() {
        var titelEl = document.getElementById('tl-form-titel');
        if (titelEl) titelEl.focus();
    }, 50);
}

window.renderKalender = renderKalender;
window.renderTimeline = renderTimeline;
window.showTimelineModal = showTimelineModal;
window._sammleAutoVorschlaege = _sammleAutoVorschlaege;
