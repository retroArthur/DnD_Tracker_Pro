// [SECTION:REISE_CRUD]
// Reise- & Wetter-Simulator — CRUD-Modul (WELT-04)
// Implementiert: Plan 05-06
// ============================================================
// Konsumiert (KEINE Redefinition!):
//   rollWeightedEntry(table)             — features/random-tables.js
//   advanceCalendarDate(tage)            — features/timeline/timeline-crud.js
//   addCalendarEvent(datum,titel,typ,id) — features/timeline/timeline-crud.js
//   REISE_TEMPO, REISE_GELÄNDE           — features/reise/reise-default-tables.js
//   WETTER_TABELLEN, REISE_BEGEGNUNGS_TABELLEN — features/reise/reise-default-tables.js
//   HARPTOS_SEASONS                      — core/constants.js
// ============================================================
// Globals: pushUndo, nextId, esc, sanitizeHTML, parseEntityId, showToast
// No const X = window.X inside functions! (Build-Dedup-Falle)

var D = window.D;
var save = window.save;

// DoS-Cap: maximale Reisetage (konsistent mit advanceCalendarDate MAX_ADVANCE_DAYS)
var REISE_MAX_TAGE = 3600;
// DoS-Cap für Begegnungswürfel
var BEGEGNUNG_MIN_DICE = 2;
var BEGEGNUNG_MAX_DICE = 100;

// ============================================================
// jahreszeitAusDatum — Jahreszeit aus Monat ableiten
// ============================================================

/**
 * Leitet die Jahreszeit aus dem Monat (1-12, Harptos) ab.
 * Nutzt HARPTOS_SEASONS aus core/constants.js.
 * Fallback: 'fruehling' bei ungültigem Monat (T-05-22 Mitigation).
 * @param {number} monat - Harptos-Monat (1–12)
 * @returns {string} 'winter'|'fruehling'|'sommer'|'herbst'
 */
function jahreszeitAusDatum(monat) {
    var seasons = window.HARPTOS_SEASONS || window.DND_RULES && window.DND_RULES.HARPTOS_SEASONS;
    if (seasons && seasons[monat]) return seasons[monat];
    // Fallback-Mapping wenn HARPTOS_SEASONS nicht verfügbar
    var fallback = {1:'winter',2:'winter',3:'fruehling',4:'fruehling',5:'fruehling',
        6:'sommer',7:'sommer',8:'sommer',9:'herbst',10:'herbst',11:'herbst',12:'winter'};
    return fallback[monat] || 'fruehling';
}

// ============================================================
// berechneTagesmarsch — 5e-Tagesmarsch in Meilen
// ============================================================

/**
 * Berechnet den Tagesmarsch in Meilen nach 5e-Standard.
 * Reisetempo: langsam 18 / normal 24 / schnell 30 Meilen/Tag.
 * Schwieriges Gelände halbiert die Distanz (distanzFaktor 0.5).
 * @param {string} tempo - 'langsam'|'normal'|'schnell'
 * @param {string} gelände - Geländetyp-ID (z.B. 'normal', 'schwierig')
 * @returns {number} Meilen/Tag (ganzzahlig)
 */
function berechneTagesmarsch(tempo, gelände) {
    var tempoMap = window.REISE_TEMPO;
    var tempoObj = tempoMap && tempoMap[tempo];
    var basisMeilen = tempoObj ? tempoObj.meilenProTag : 24;
    var gelaendeArr = window.REISE_GELÄNDE || [];
    var gelaendeObj = gelaendeArr.find(function(g) { return g.id === gelände; });
    var faktor = gelaendeObj ? gelaendeObj.distanzFaktor : 1.0;
    return Math.floor(basisMeilen * faktor);
}

// ============================================================
// rollWetter — Wetter aus Klima × Jahreszeit würfeln
// ============================================================

/**
 * Würfelt das Wetter basierend auf Klima und Jahreszeit.
 * @param {string} klima - z.B. 'gemässigt'
 * @param {string} jahreszeit - z.B. 'winter'|'fruehling'|'sommer'|'herbst'
 * @returns {object|null} rollWeightedEntry-Ergebnis oder null
 */
function rollWetter(klima, jahreszeit) {
    var tabellen = window.WETTER_TABELLEN;
    if (!tabellen || !tabellen[klima] || !tabellen[klima][jahreszeit]) return null;
    var table = tabellen[klima][jahreszeit];
    if (typeof rollWeightedEntry === 'function') {
        return rollWeightedEntry(table);
    }
    return null;
}

// ============================================================
// rollBegegnung — Zufallsbegegnung mit konfigurierbarer Chance
// ============================================================

/**
 * Würfelt eine Zufallsbegegnung für einen Geländetyp.
 * Begegnung tritt ein wenn Wurf <= Schwellenwert.
 * DoS-Schutz: diceType auf 2..100, threshold auf 0..diceType geklemmt.
 * @param {string} gelaendeId - z.B. 'wald'
 * @param {number} diceType - Würfelseitenanzahl (2..100)
 * @param {number} threshold - Schwellenwert (Begegnung wenn Wurf <= threshold)
 * @returns {{begegnung:boolean, ergebnis:object|null, wurf:number}}
 */
function rollBegegnung(gelaendeId, diceType, threshold) {
    // DoS: diceType und threshold klemmen (T-05-19 Mitigation)
    var dt = Math.max(BEGEGNUNG_MIN_DICE, Math.min(BEGEGNUNG_MAX_DICE, parseInt(diceType, 10) || 20));
    var th = Math.max(0, Math.min(dt, parseInt(threshold, 10) || 1));
    var wurf = Math.floor(Math.random() * dt) + 1;
    var begegnung = wurf <= th;
    var ergebnis = null;
    if (begegnung) {
        var tabellen = window.REISE_BEGEGNUNGS_TABELLEN;
        var table = tabellen && tabellen[gelaendeId];
        if (table && typeof rollWeightedEntry === 'function') {
            ergebnis = rollWeightedEntry(table);
        }
    }
    return { begegnung: begegnung, ergebnis: ergebnis, wurf: wurf };
}

// ============================================================
// startReise — Reise-Konfiguration aus UI lesen und anwenden
// ============================================================

/**
 * Liest Reise-Konfiguration aus dem Formular und berechnet Tagesmärsche.
 * Rendert die Ergebnisse in den Ergebnisbereich.
 * Keine Datenmutation — nur Berechnung + Anzeige.
 */
function startReise() {
    var d = window.D;
    var cal = d && d.calendar;

    // Formular-Werte lesen
    var tempoEl = document.getElementById('rs-tempo');
    var gelaendeEl = document.getElementById('rs-gelaende');
    var tageEl = document.getElementById('rs-tage');
    var klimaEl = document.getElementById('rs-klima');
    var diceTypeEl = document.getElementById('rs-dice-type');
    var thresholdEl = document.getElementById('rs-threshold');

    var tempo = tempoEl ? tempoEl.value : 'normal';
    var gelaende = gelaendeEl ? gelaendeEl.value : 'normal';
    var tage = parseInt(tageEl ? tageEl.value : 1, 10) || 1;
    var klima = klimaEl ? klimaEl.value : 'gemässigt';
    var diceType = parseInt(diceTypeEl ? diceTypeEl.value : 20, 10) || 20;
    var threshold = parseInt(thresholdEl ? thresholdEl.value : 1, 10) || 1;

    // DoS: Tage klemmen
    if (tage < 1) tage = 1;
    if (tage > REISE_MAX_TAGE) tage = REISE_MAX_TAGE;

    // Jahreszeit aus aktuellem Kalender-Monat
    var monat = cal ? (parseInt(cal.month, 10) || 1) : 1;
    var jahreszeit = jahreszeitAusDatum(monat);

    // Tagesmarsch berechnen
    var meilenProTag = berechneTagesmarsch(tempo, gelaende);

    // Ergebnisse für jeden Tag berechnen
    var tagesErgebnisse = [];
    for (var i = 0; i < tage; i++) {
        var wetter = rollWetter(klima, jahreszeit);
        var begegnungResult = rollBegegnung(gelaende, diceType, threshold);
        tagesErgebnisse.push({
            tag: i + 1,
            meilen: meilenProTag,
            wetter: wetter,
            begegnung: begegnungResult
        });
    }

    // Ergebnisse rendern
    var ergebnisEl = document.getElementById('rs-ergebnis');
    if (!ergebnisEl) return;

    var gesamtMeilen = meilenProTag * tage;
    var tempoMap = window.REISE_TEMPO;
    var tempoLabel = (tempoMap && tempoMap[tempo]) ? tempoMap[tempo].label : tempo;
    var gelaendeArr = window.REISE_GELÄNDE || [];
    var gelaendeObj = gelaendeArr.find(function(g) { return g.id === gelaende; });
    var gelaendeLabel = gelaendeObj ? gelaendeObj.label : gelaende;

    var html = '<div class="rs-result-card">';
    html += '<div class="rs-result-header">';
    html += '<span class="rs-tagesmarsch">' + meilenProTag + ' Meilen/Tag</span>';
    html += '<span class="rs-result-meta"> &bull; ' + esc(tempoLabel) + ' &bull; ' + esc(gelaendeLabel) + '</span>';
    html += '</div>';
    html += '<div class="rs-result-gesamt">Gesamt: <strong>' + gesamtMeilen + ' Meilen</strong> in ' + tage + ' Tag' + (tage !== 1 ? 'en' : '') + '</div>';
    html += '<div class="rs-result-jahreszeit">Jahreszeit: <em>' + esc(jahreszeit) + '</em> (Monat ' + monat + ')</div>';

    html += '<div class="rs-tages-list">';
    tagesErgebnisse.forEach(function(te) {
        html += '<div class="rs-tag-eintrag">';
        html += '<div class="rs-tag-header">Tag ' + te.tag + '</div>';

        // Wetter
        if (te.wetter && te.wetter.entry) {
            html += '<div class="rs-wetter-badge">&#9925; ' + esc(te.wetter.entry.text) + '</div>';
        } else {
            html += '<div class="rs-wetter-badge">&#9925; Kein Wetter-Eintrag (Tabelle fehlt)</div>';
        }

        // Begegnung
        if (te.begegnung.begegnung) {
            var begText = (te.begegnung.ergebnis && te.begegnung.ergebnis.entry)
                ? te.begegnung.ergebnis.entry.text
                : 'Unbekannte Begegnung';
            html += '<div class="rs-begegnung-badge rs-begegnung-aktiv">&#9876; ' + esc(begText) + '</div>';
        } else {
            html += '<div class="rs-begegnung-badge">&#9876; Keine Begegnung (Wurf ' + te.begegnung.wurf + ' &gt; ' + threshold + ')</div>';
        }

        html += '</div>';
    });
    html += '</div>';

    // Abschluss-Bereich
    html += '<div class="rs-abschluss-bereich">';
    html += '<button class="btn btn-primary" data-action="abschliessen-reise" data-value="' + tage + '">Reise abschließen (' + tage + ' Tage)</button>';
    html += '</div>';

    html += '</div>';

    ergebnisEl.innerHTML = html;

    if (typeof showToast === 'function') {
        showToast('Reise berechnet: ' + gesamtMeilen + ' Meilen in ' + tage + ' Tag' + (tage !== 1 ? 'en' : ''), 'info');
    }
}

// ============================================================
// abschliessenReise — Kalender vorrücken + optional Timeline-Eintrag
// ============================================================

/**
 * Schließt eine Reise ab:
 * 1. pushUndo('Reise abgeschlossen') — vor jeder Mutation (T-05-21 Mitigation)
 * 2. advanceCalendarDate(tage) — Kalender vorrücken
 * 3. Optional: Dialog "Timeline-Eintrag hinzufügen?"
 * @param {number|string} tage - Anzahl Reisetage
 */
function abschliessenReise(tage) {
    var d = window.D;
    if (!d) return;

    // DoS: Tage klemmen
    var anzahlTage = parseInt(tage, 10) || 1;
    if (anzahlTage < 1) anzahlTage = 1;
    if (anzahlTage > REISE_MAX_TAGE) anzahlTage = REISE_MAX_TAGE;

    // T-05-21: pushUndo VOR advanceCalendarDate
    pushUndo('Reise abgeschlossen');

    // Kalender vorrücken via geteilter Helfer (aus timeline-crud.js)
    if (typeof window.advanceCalendarDate === 'function') {
        window.advanceCalendarDate(anzahlTage);
    }

    // Kalender-Anzeige aktualisieren
    if (typeof window.renderKalender === 'function') {
        window.renderKalender();
    }

    // Ergebnisbereich: Abschluss-Feedback zeigen
    var ergebnisEl = document.getElementById('rs-ergebnis');
    if (ergebnisEl) {
        var cal = window.D && window.D.calendar;
        var calInfo = cal ? (cal.day + '. Monat ' + cal.month + ' ' + (cal.year || 1492) + ' DR') : '';
        ergebnisEl.insertAdjacentHTML('afterbegin',
            '<div class="rs-abschluss-info">'
            + '&#9989; Reise abgeschlossen! Neues Datum: <strong>' + esc(calInfo) + '</strong>'
            + '</div>'
        );
    }

    if (typeof showToast === 'function') {
        showToast('Reise abgeschlossen — Kalender um ' + anzahlTage + ' Tag' + (anzahlTage !== 1 ? 'e' : '') + ' vorgerückt', 'success');
    }

    // Optional: Timeline-Eintrag vorschlagen (D-11/D-15)
    _zeigeTimelineVorschlag(anzahlTage);
}

/**
 * Zeigt einen optionalen Dialog zum Erstellen eines Timeline-Eintrags.
 * @param {number} anzahlTage
 */
function _zeigeTimelineVorschlag(anzahlTage) {
    var d = window.D;
    if (!d) return;

    // Transientes Modal (analog Timeline-Modal)
    var existing = document.getElementById('rs-timeline-modal');
    if (existing) existing.remove();

    var cal = window.D && window.D.calendar;
    var datumText = cal ? (cal.day + '. Monat ' + cal.month + ' ' + (cal.year || 1492) + ' DR') : '';

    var modal = document.createElement('div');
    modal.id = 'rs-timeline-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal-content">'
        + '<div class="modal-header"><h3>Timeline-Eintrag hinzufügen?</h3></div>'
        + '<div class="modal-body">'
        + '<p>Reise von ' + esc(String(anzahlTage)) + ' Tag' + (anzahlTage !== 1 ? 'en' : '') + ' abgeschlossen.</p>'
        + '<p>Aktuelles Datum: <strong>' + esc(datumText) + '</strong></p>'
        + '<div class="tl-form-field">'
        + '<label>Titel des Timeline-Eintrags</label>'
        + '<input type="text" id="rs-tl-titel" class="form-input" value="Reise abgeschlossen" />'
        + '</div>'
        + '</div>'
        + '<div class="modal-footer">'
        + '<button class="btn btn-primary" data-action="bestaetigen-reise-timeline" data-value="' + esc(String(anzahlTage)) + '">'
        + 'Eintrag erstellen</button>'
        + '<button class="btn btn-secondary" data-action="schliessen-reise-timeline-modal">Überspringen</button>'
        + '</div>'
        + '</div>';

    document.body.appendChild(modal);
}

/**
 * Bestätigt den optionalen Timeline-Eintrag nach Reise-Abschluss.
 * Liest Titel aus #rs-tl-titel; Datum = aktuelles D.calendar.
 * @param {number|string} tage - Reisetage (für context)
 */
function bestaetigeReiseTimeline(tage) {
    var d = window.D;
    if (!d) return;

    var titelEl = document.getElementById('rs-tl-titel');
    var titel = titelEl ? titelEl.value.trim() : 'Reise abgeschlossen';
    if (!titel) titel = 'Reise abgeschlossen';

    var cal = d.calendar || { day: 1, month: 1, year: 1492 };
    var datum = {
        tag: parseInt(cal.day, 10) || 1,
        monat: parseInt(cal.month, 10) || 1,
        jahr: parseInt(cal.year, 10) || 1492
    };

    if (typeof window.addCalendarEvent === 'function') {
        window.addCalendarEvent(datum, titel, 'reise', null);
    }

    // Modal schließen
    var modal = document.getElementById('rs-timeline-modal');
    if (modal) modal.remove();

    if (typeof showToast === 'function') showToast('Timeline-Eintrag erstellt', 'success');
    if (typeof window.renderTimeline === 'function') window.renderTimeline();
}

// ============================================================
// Window-Exporte
// ============================================================

window.jahreszeitAusDatum = jahreszeitAusDatum;
window.berechneTagesmarsch = berechneTagesmarsch;
window.rollWetter = rollWetter;
window.rollBegegnung = rollBegegnung;
window.startReise = startReise;
window.abschliessenReise = abschliessenReise;
window.bestaetigeReiseTimeline = bestaetigeReiseTimeline;
