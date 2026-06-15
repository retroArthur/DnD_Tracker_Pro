// [SECTION:REISE_CRUD]
// Reise- & Wetter-Simulator — CRUD-Modul (WELT-04)
// Wave 0: Skelett ohne vollständige Implementierung
// Implementierung: Plan 05-06
// ============================================================
// Verwendete Globals: window.D, pushUndo, esc, sanitizeHTML,
//   REISE_TEMPO, REISE_GELÄNDE, WETTER_TABELLEN, REISE_BEGEGNUNGS_TABELLEN,
//   HARPTOS_SEASONS, rollWeightedEntry, advanceCalendarDate, addCalendarEvent

/**
 * Berechnet den Tagesmarsch in Meilen.
 * tempo: 'langsam'|'normal'|'schnell'; gelände: 'normal'|'schwierig'|'gebirge'|...
 * @param {string} tempo
 * @param {string} gelände
 * @returns {number} Meilen/Tag
 */
function berechneTagesmarsch(tempo, gelände) {
    var tempoObj = window.REISE_TEMPO && window.REISE_TEMPO[tempo];
    var basisMeilen = tempoObj ? tempoObj.meilenProTag : 24;
    var gelaendeArr = window.REISE_GELÄNDE || [];
    var gelaendeObj = gelaendeArr.find(function(g) { return g.id === gelände; });
    var faktor = gelaendeObj ? gelaendeObj.distanzFaktor : 1.0;
    return Math.floor(basisMeilen * faktor);
}

/**
 * Würfelt das Wetter basierend auf Klima und Jahreszeit.
 * @param {string} klima - z.B. 'gemässigt'
 * @param {string} jahreszeit - z.B. 'winter'
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

/**
 * Würfelt eine Zufallsbegegnung für einen Geländetyp.
 * @param {string} gelaendeId - z.B. 'wald'
 * @param {number} wuerfelTyp - Anzahl Seiten (z.B. 20)
 * @param {number} schwellenwert - Begegnung wenn Wurf <= Schwellenwert
 * @returns {{begegnung: boolean, ergebnis: object|null, wurf: number}}
 */
function rollBegegnung(gelaendeId, wuerfelTyp, schwellenwert) {
    var wurf = Math.floor(Math.random() * (wuerfelTyp || 20)) + 1;
    var begegnung = wurf <= (schwellenwert || 1);
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

/**
 * Startet eine neue Reise.
 * Stub: Wave 0 — Implementierung in Plan 05-06.
 */
function startReise(data) {
    if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
        console.warn('[startReise] Stub — Implementierung in Plan 05-06');
    }
}

/**
 * Schließt eine Reise ab und rückt den Kalender vor.
 * Stub: Wave 0 — Implementierung in Plan 05-06.
 */
function abschliessenReise(reiseId) {
    if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
        console.warn('[abschliessenReise] Stub — Implementierung in Plan 05-06');
    }
}

window.berechneTagesmarsch = berechneTagesmarsch;
window.rollWetter = rollWetter;
window.rollBegegnung = rollBegegnung;
window.startReise = startReise;
window.abschliessenReise = abschliessenReise;
