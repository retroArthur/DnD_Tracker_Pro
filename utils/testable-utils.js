// [SECTION:TESTABLE_UTILS]
// ============================================================
// TESTABLE UTILS - @jest @testing @exports
// ============================================================
// Duplikate aus basic.js/utilities.js für Jest-Kompatibilität
// NUR von Tests importiert, nicht vom Production Build

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
 * Entfernt gefährliche HTML-Elemente und Attribute (Production-Version)
 * @param {string} html - Zu bereinigendes HTML
 * @returns {string} Bereinigtes HTML
 */
function sanitizeHTML(html) {
    if (!html) return '';

    // Schritt 1: Entferne gefährliche Patterns BEVOR Parsing
    let cleaned = String(html)
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
        .replace(/javascript\s*:/gi, '')
        .replace(/vbscript\s*:/gi, '')
        .replace(/data\s*:\s*text\/html/gi, '');

    // Schritt 2: Verwende DOMParser (sicherer als innerHTML)
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleaned, 'text/html');

    // Erlaubte Tags und Attribute
    const allowedTags = ['b', 'i', 'u', 's', 'strong', 'em', 'ul', 'ol', 'li', 'p', 'br', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'mark', 'a', 'font'];
    const allowedAttributes = {
        'style': ['color', 'background-color', 'background', 'font-family', 'font-size', 'font-weight', 'text-decoration', 'border', 'border-collapse', 'padding', 'margin', 'width', 'text-align', 'vertical-align'],
        'class': true,
        'href': true,
        'title': true,
        'colspan': true,
        'rowspan': true,
        'face': true,
        'size': true
    };

    // Gefährliche Protokolle (case-insensitive)
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:', 'blob:'];

    // Rekursive Funktion zum Bereinigen der Nodes
    function cleanNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.cloneNode(true);
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();

            if (!allowedTags.includes(tagName)) {
                return document.createTextNode(node.textContent || '');
            }

            const cleanElement = document.createElement(tagName);

            for (const attr of node.attributes) {
                const attrName = attr.name.toLowerCase();

                if (attrName.startsWith('on')) continue;

                if (attrName === 'style' && allowedAttributes.style) {
                    const styles = attr.value.split(';').filter(s => {
                        const prop = s.split(':')[0]?.trim().toLowerCase();
                        return allowedAttributes.style.includes(prop);
                    }).join(';');
                    if (styles) cleanElement.setAttribute('style', styles);
                }
                else if (attrName === 'class' && allowedAttributes.class) {
                    cleanElement.setAttribute('class', attr.value);
                }
                else if (attrName === 'href' && allowedAttributes.href && tagName === 'a') {
                    const href = attr.value.trim();
                    const hrefLower = href.toLowerCase();
                    const isSafe = dangerousProtocols.every(proto => !hrefLower.startsWith(proto));
                    if (isSafe && (hrefLower.startsWith('http://') || hrefLower.startsWith('https://') || href.startsWith('/') || href.startsWith('#') || href.startsWith('./'))) {
                        cleanElement.setAttribute('href', href);
                        cleanElement.setAttribute('target', '_blank');
                        cleanElement.setAttribute('rel', 'noopener noreferrer');
                    }
                }
                else if (attrName === 'title' && allowedAttributes.title) {
                    cleanElement.setAttribute('title', attr.value);
                }
                else if ((attrName === 'colspan' || attrName === 'rowspan') && allowedAttributes[attrName]) {
                    const val = parseInt(attr.value);
                    if (!isNaN(val) && val > 0 && val < 100) {
                        cleanElement.setAttribute(attrName, val);
                    }
                }
                else if ((attrName === 'face' || attrName === 'size') && allowedAttributes[attrName] && tagName === 'font') {
                    cleanElement.setAttribute(attrName, attr.value);
                }
            }

            for (const child of node.childNodes) {
                const cleanChild = cleanNode(child);
                if (cleanChild) cleanElement.appendChild(cleanChild);
            }

            return cleanElement;
        }

        return null;
    }

    const result = document.createElement('div');
    for (const child of doc.body.childNodes) {
        const cleanChild = cleanNode(child);
        if (cleanChild) result.appendChild(cleanChild);
    }

    return result.innerHTML;
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
