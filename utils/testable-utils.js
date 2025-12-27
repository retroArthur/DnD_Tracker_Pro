/**
 * Testable Utilities
 * Exportierbare Version der Utility-Funktionen für Jest Tests
 * @module utils/testable-utils
 */

// ============================================================
// HTML ESCAPING
// ============================================================

/**
 * Escaped HTML-Sonderzeichen
 * @param {*} s - Zu escapender Wert
 * @returns {string} Escapeter String
 */
function esc(s) {
    if (s === null || s === undefined) return '';
    if (s === 0) return '0';
    if (!s) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================================
// SANITIZATION
// ============================================================

/**
 * Entfernt gefährliche HTML-Elemente und Attribute
 * @param {string} html - Zu bereinigendes HTML
 * @returns {string} Bereinigtes HTML
 */
function sanitizeHTML(html) {
    if (!html) return '';

    // Entferne Script-Tags
    let clean = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    // Entferne Event-Handler
    clean = clean.replace(/\s*on\w+\s*=\s*(['"])[^'"]*\1/gi, '');
    clean = clean.replace(/\s*on\w+\s*=[^\s>]*/gi, '');

    return clean;
}

// ============================================================
// ID GENERATION
// ============================================================

/**
 * Generiert eine neue ID für einen Entity-Typ
 * @param {string} type - Entity-Typ
 * @param {Object} dataStore - Datenspeicher mit _nextId
 * @returns {number} Neue ID
 */
function nextId(type, dataStore) {
    if (!dataStore._nextId) dataStore._nextId = {};
    if (!dataStore._nextId[type]) {
        dataStore._nextId[type] = 0;
    }
    return ++dataStore._nextId[type];
}

// ============================================================
// D&D CALCULATIONS
// ============================================================

/**
 * Berechnet den Modifikator für einen Attributwert
 * @param {number} score - Attributwert (1-30)
 * @returns {number} Modifikator
 */
function getModifier(score) {
    return Math.floor((score - 10) / 2);
}

/**
 * Berechnet den Übungsbonus für eine Stufe
 * @param {number} level - Charakterstufe (1-20)
 * @returns {number} Übungsbonus (2-6)
 */
function getProficiencyBonus(level) {
    return Math.ceil(level / 4) + 1;
}

// ============================================================
// DICE PARSING
// ============================================================

/**
 * Parst eine Würfelnotation (z.B. "2d6+3")
 * @param {string} notation - Würfelnotation
 * @returns {Object|null} Geparstes Ergebnis oder null
 */
function parseDiceNotation(notation) {
    if (!notation) return null;
    const match = notation.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
    if (!match) return null;

    return {
        count: parseInt(match[1]) || 1,
        sides: parseInt(match[2]),
        modifier: parseInt(match[3]) || 0
    };
}

// ============================================================
// TIMING FUNCTIONS
// ============================================================

/**
 * Debounce - Verzögert Ausführung
 * @param {Function} fn - Funktion
 * @param {number} delay - Verzögerung in ms
 * @returns {Function} Debounced Funktion
 */
function debounce(fn, delay = 300) {
    let timeoutId = null;
    return function debounced(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Throttle - Begrenzt Ausführungsrate
 * @param {Function} fn - Funktion
 * @param {number} limit - Limit in ms
 * @returns {Function} Throttled Funktion
 */
function throttle(fn, limit = 100) {
    let inThrottle = false;
    return function throttled(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => { inThrottle = false; }, limit);
        }
    };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Prüft ob ein Wert leer ist
 * @param {*} value - Zu prüfender Wert
 * @returns {boolean}
 */
function isEmpty(value) {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Klemmt einen Wert zwischen min und max
 * @param {number} value - Wert
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number}
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Erstellt eine tiefe Kopie eines Objekts
 * @param {*} obj - Zu klonendes Objekt
 * @returns {*}
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Formatiert einen Modifikator mit Vorzeichen
 * @param {number} mod - Modifikator
 * @returns {string}
 */
function formatMod(mod) {
    return mod >= 0 ? `+${mod}` : String(mod);
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    esc,
    sanitizeHTML,
    nextId,
    getModifier,
    getProficiencyBonus,
    parseDiceNotation,
    debounce,
    throttle,
    isEmpty,
    clamp,
    deepClone,
    formatMod
};
