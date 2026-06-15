// [SECTION:TIMELINE_CRUD]
// Kampagnen-Timeline — CRUD-Modul (WELT-03)
// Implementiert: Plan 05-05
// ============================================================
// Geteilte Kalender-Helfer: addCalendarEvent, advanceCalendarDate
// werden auf window exportiert — Reise-Plan (05-06) konsumiert sie.
// ============================================================
// Globals (keine const X = window.X in Funktionen!):
//   var D = window.D;
//   pushUndo, nextId, esc, sanitizeHTML, parseEntityId, save, showToast

var D = window.D;
var save = window.save;

// DoS-Cap: maximale Tage für advanceCalendarDate (ca. 10 Jahre = 3600 Harptos-Tage)
var MAX_ADVANCE_DAYS = 3600;

// ============================================================
// sortiereTimelineEvents — chronologische Sortierung
// ============================================================

/**
 * Sortiert ein Array von Timeline-Ereignissen chronologisch
 * nach jahr → monat → tag (aufsteigend).
 * Gibt ein neues Array zurück (keine Mutation des Originals).
 * @param {Array} events - Array von {datum:{tag,monat,jahr}, ...}
 * @returns {Array}
 */
function sortiereTimelineEvents(events) {
    if (!Array.isArray(events)) return [];
    return events.slice().sort(function(a, b) {
        var da = (a && a.datum) ? a.datum : {};
        var db = (b && b.datum) ? b.datum : {};
        var jahrA = da.jahr || 0;
        var jahrB = db.jahr || 0;
        if (jahrA !== jahrB) return jahrA - jahrB;
        var monatA = da.monat || 0;
        var monatB = db.monat || 0;
        if (monatA !== monatB) return monatA - monatB;
        var tagA = da.tag || 0;
        var tagB = db.tag || 0;
        return tagA - tagB;
    });
}

// ============================================================
// advanceCalendarDate — Harptos-Kalender vorrücken
// ============================================================

/**
 * Rückt das In-Game-Datum um die angegebene Anzahl Tage vor.
 * 30 Tage/Monat, 12 Monate/Jahr (Harptos-Kalender).
 * DoS-Cap: 'tage' wird auf 0..MAX_ADVANCE_DAYS geklemmt.
 * Schreibt direkt in D.calendar und ruft save() — KEIN pushUndo
 * (wird von Reise-Abschluss aufgerufen, der selbst pushUndo macht).
 * @param {number} tage - Anzahl Tage vorwärts (0..MAX_ADVANCE_DAYS)
 */
function advanceCalendarDate(tage) {
    var cal = window.D && window.D.calendar;
    if (!cal) return;

    // DoS-Cap: nur positive, begrenzte Werte erlaubt
    var anzahl = parseInt(tage, 10) || 0;
    if (anzahl < 0) anzahl = 0;
    if (anzahl > MAX_ADVANCE_DAYS) anzahl = MAX_ADVANCE_DAYS;

    // Sicherstellen, dass Ausgangswerte sinnvoll sind
    var tag = Math.max(1, Math.min(30, parseInt(cal.day, 10) || 1));
    var monat = Math.max(1, Math.min(12, parseInt(cal.month, 10) || 1));
    var jahr = parseInt(cal.year, 10) || 1492;

    // Tage addieren mit 30-Tage-Monat / 12-Monate-Jahr
    tag += anzahl;
    while (tag > 30) {
        tag -= 30;
        monat++;
        if (monat > 12) {
            monat = 1;
            jahr++;
        }
    }

    cal.day = tag;
    cal.month = monat;
    cal.year = jahr;

    if (typeof save === 'function') {
        save();
    } else if (typeof window.save === 'function') {
        window.save();
    }
}

// ============================================================
// addCalendarEvent — gemeinsamer Kalender-Eintrag-Helfer
// ============================================================

/**
 * Fügt ein Ereignis zu D.calendar.events hinzu.
 * Geteilte Hilfsfunktion: Timeline (manuell) UND Reise (05-06) nutzen diese.
 * Ruft pushUndo vor der Mutation, sortiert nach dem Push chronologisch.
 * @param {{tag:number, monat:number, jahr:number}} datum - In-Game-Datum
 * @param {string} titel - Ereignis-Titel
 * @param {string} typ - 'manuell' | 'reise' | 'session'
 * @param {number|null} quelleId - ID der Quelle (sessionPrep.id, Reise.id etc.)
 */
function addCalendarEvent(datum, titel, typ, quelleId) {
    var d = window.D;
    if (!d) return;
    if (!d.calendar) d.calendar = { day: 1, month: 1, year: 1492, events: [] };
    if (!Array.isArray(d.calendar.events)) d.calendar.events = [];

    // Validierung: Datum-Felder klemmen
    var sicherDatum = {
        tag: Math.max(1, Math.min(30, parseInt((datum && datum.tag), 10) || 1)),
        monat: Math.max(1, Math.min(12, parseInt((datum && datum.monat), 10) || 1)),
        jahr: parseInt((datum && datum.jahr), 10) || (d.calendar.year || 1492)
    };

    pushUndo('Timeline-Eintrag');

    var event = {
        id: nextId('calendarEvents'),
        datum: sicherDatum,
        titel: sanitizeHTML(String(titel || '')),
        beschreibung: '',
        typ: (typ === 'reise' || typ === 'session') ? typ : 'manuell',
        quelleId: (typeof quelleId === 'number') ? quelleId : null
    };

    d.calendar.events.push(event);
    d.calendar.events = sortiereTimelineEvents(d.calendar.events);

    if (typeof save === 'function') {
        save();
    } else if (typeof window.save === 'function') {
        window.save();
    }
}

// ============================================================
// saveTimelineEvent — Formular lesen & addCalendarEvent aufrufen
// ============================================================

/**
 * Liest das Timeline-Eintrags-Formular und speichert via addCalendarEvent.
 * Erwartet DOM-Elemente: #tl-form-tag, #tl-form-monat, #tl-form-jahr,
 *   #tl-form-titel, #tl-form-beschreibung, #tl-form-typ
 */
function saveTimelineEvent() {
    var d = window.D;
    if (!d) return;

    var tagEl = document.getElementById('tl-form-tag');
    var monatEl = document.getElementById('tl-form-monat');
    var jahrEl = document.getElementById('tl-form-jahr');
    var titelEl = document.getElementById('tl-form-titel');
    var beschrEl = document.getElementById('tl-form-beschreibung');
    var typEl = document.getElementById('tl-form-typ');

    var titel = titelEl ? titelEl.value.trim() : '';
    if (!titel) {
        if (typeof showToast === 'function') showToast('Bitte einen Titel eingeben', 'warning');
        return;
    }

    var datum = {
        tag: parseInt(tagEl ? tagEl.value : 1, 10) || 1,
        monat: parseInt(monatEl ? monatEl.value : 1, 10) || 1,
        jahr: parseInt(jahrEl ? jahrEl.value : (d.calendar ? d.calendar.year : 1492), 10) || 1492
    };
    var typ = (typEl ? typEl.value : 'manuell') || 'manuell';
    var beschr = beschrEl ? beschrEl.value.trim() : '';

    addCalendarEvent(datum, titel, typ, null);

    // Beschreibung nachträglich setzen (addCalendarEvent setzt leere Beschreibung)
    var events = d.calendar.events;
    if (events && events.length > 0) {
        // Zuletzt gespeichertes Event finden (nach Titel + Datum)
        for (var i = events.length - 1; i >= 0; i--) {
            if (events[i].titel === sanitizeHTML(titel)) {
                events[i].beschreibung = sanitizeHTML(beschr);
                break;
            }
        }
    }

    // Modal schließen
    var modal = document.getElementById('tl-event-modal');
    if (modal) modal.remove();

    if (typeof renderTimeline === 'function') renderTimeline();
    if (typeof renderKalender === 'function') renderKalender();
    var countEl = document.getElementById('kalender-count');
    if (countEl && d.calendar && d.calendar.events) {
        countEl.textContent = String(d.calendar.events.length);
    }
    if (typeof showToast === 'function') showToast('Ereignis gespeichert', 'success');
}

// ============================================================
// deleteTimelineEvent — Ereignis löschen
// ============================================================

/**
 * Löscht ein Timeline-Ereignis mit Bestätigung und Undo.
 * @param {number|string} id - Event-ID
 */
function deleteTimelineEvent(id) {
    var d = window.D;
    if (!d || !d.calendar || !d.calendar.events) return;

    var numId = parseEntityId(id);
    if (numId === null) return;

    var event = d.calendar.events.find(function(e) { return e.id === numId; });
    if (!event) return;

    var titel = event.titel || 'Ereignis';
    if (!confirm('"' + titel + '" löschen?')) return;

    pushUndo('Timeline-Eintrag gelöscht');
    d.calendar.events = d.calendar.events.filter(function(e) { return e.id !== numId; });

    if (typeof save === 'function') {
        save();
    } else if (typeof window.save === 'function') {
        window.save();
    }

    if (typeof renderTimeline === 'function') renderTimeline();
    var countEl = document.getElementById('kalender-count');
    if (countEl) countEl.textContent = String(d.calendar.events.length);
    if (typeof showToast === 'function') showToast('Ereignis gelöscht', 'success');
}

// ============================================================
// Window-Exporte (geteilte Helfer für Plan 05-06 Reise)
// ============================================================

window.sortiereTimelineEvents = sortiereTimelineEvents;
window.advanceCalendarDate = advanceCalendarDate;
window.addCalendarEvent = addCalendarEvent;
window.saveTimelineEvent = saveTimelineEvent;
window.deleteTimelineEvent = deleteTimelineEvent;
