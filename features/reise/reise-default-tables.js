// [SECTION:REISE_DEFAULT_TABLES]
// Reise- & Wetter-Simulator — Default-Tabellen (WELT-04)
// ACHTUNG: Diese Datei wird in Plan 05-06 von tools/generate_reise_tables.py
// mit echten deutschen Tabellendaten (Begegnungen, Wetter etc.) befüllt.
// Nicht manuell bearbeiten — Wave 0 Platzhalter.
// ============================================================

/**
 * Geländetypen für den Reise-Simulator mit Distanzfaktoren.
 * Distanzfaktor 0.5 = schwieriges Gelände halbiert Tagesmarsch.
 * @type {Array<{id: string, label: string, distanzFaktor: number}>}
 */
const REISE_GELÄNDE = [
    { id: 'normal',    label: 'Normal',             distanzFaktor: 1.0 },
    { id: 'schwierig', label: 'Schwieriges Gelände', distanzFaktor: 0.5 },
    { id: 'gebirge',   label: 'Gebirge',             distanzFaktor: 0.5 },
    { id: 'sumpf',     label: 'Sumpf',               distanzFaktor: 0.5 },
    { id: 'meer',      label: 'Schiff',              distanzFaktor: 1.0 }
];

/**
 * Reisetempo-Definitionen (5e PHB S. 182).
 * Basiswerte in Meilen/Tag.
 * @type {Object.<string, {label: string, meilenProTag: number, effekt: string}>}
 */
const REISE_TEMPO = {
    langsam: { label: 'Langsam',  meilenProTag: 18, effekt: 'Heimlichkeit möglich' },
    normal:  { label: 'Normal',   meilenProTag: 24, effekt: '—' },
    schnell: { label: 'Schnell',  meilenProTag: 30, effekt: '−5 passive Wahrnehmung' }
};

/**
 * Begegnungstabellen nach Geländetyp.
 * Wave 0: Leere Tabellen — Plan 05-06 befüllt via generate_reise_tables.py.
 * Format kompatibel mit rollWeightedEntry(table): {diceType, entries:[{range, text}]}
 * @type {Object}
 */
const REISE_BEGEGNUNGS_TABELLEN = {
    // Wave 0: Platzhalter
    wald:    { id: 'begegnung_wald',    diceType: 8, entries: [] },
    gebirge: { id: 'begegnung_gebirge', diceType: 8, entries: [] },
    kueste:  { id: 'begegnung_kueste',  diceType: 8, entries: [] },
    strasse: { id: 'begegnung_strasse', diceType: 8, entries: [] },
    ruinen:  { id: 'begegnung_ruinen',  diceType: 8, entries: [] },
    sumpf:   { id: 'begegnung_sumpf',   diceType: 8, entries: [] }
};

/**
 * Wettertabellen nach Klima und Jahreszeit.
 * Wave 0: Leere Tabellen — Plan 05-06 befüllt via generate_reise_tables.py.
 * Format: WETTER_TABELLEN[klima][jahreszeit] = {id, diceType, entries}
 * @type {Object}
 */
const WETTER_TABELLEN = {
    // Wave 0: Platzhalter
    gemässigt: {
        winter:    { id: 'wetter_gem_winter',  diceType: 8, entries: [] },
        fruehling: { id: 'wetter_gem_frueh',   diceType: 8, entries: [] },
        sommer:    { id: 'wetter_gem_sommer',  diceType: 8, entries: [] },
        herbst:    { id: 'wetter_gem_herbst',  diceType: 8, entries: [] }
    }
};

window.REISE_GELÄNDE = REISE_GELÄNDE;
window.REISE_TEMPO = REISE_TEMPO;
window.REISE_BEGEGNUNGS_TABELLEN = REISE_BEGEGNUNGS_TABELLEN;
window.WETTER_TABELLEN = WETTER_TABELLEN;
