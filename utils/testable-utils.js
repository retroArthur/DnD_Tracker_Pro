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
 * @param s - Zu escapender Wert
 * @returns Escapeter String
 */
function esc(s) {
    if (s === null || s === undefined)
        return '';
    if (s === 0)
        return '0';
    if (!s)
        return '';
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
 * @param html - Zu bereinigendes HTML
 * @returns Bereinigtes HTML
 */
function sanitizeHTML(html) {
    if (!html)
        return '';
    // Schritt 1: Entferne gefährliche Patterns BEVOR Parsing
    const cleaned = String(html)
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
            const element = node;
            const tagName = element.tagName.toLowerCase();
            if (!allowedTags.includes(tagName)) {
                return document.createTextNode(element.textContent || '');
            }
            const cleanElement = document.createElement(tagName);
            for (const attr of element.attributes) {
                const attrName = attr.name.toLowerCase();
                if (attrName.startsWith('on'))
                    continue;
                if (attrName === 'style' && Array.isArray(allowedAttributes.style)) {
                    const styleList = allowedAttributes.style;
                    const styles = attr.value.split(';').filter(s => {
                        const prop = s.split(':')[0]?.trim().toLowerCase();
                        return styleList.includes(prop);
                    }).join(';');
                    if (styles)
                        cleanElement.setAttribute('style', styles);
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
                        cleanElement.setAttribute(attrName, val.toString());
                    }
                }
                else if ((attrName === 'face' || attrName === 'size') && allowedAttributes[attrName] && tagName === 'font') {
                    cleanElement.setAttribute(attrName, attr.value);
                }
            }
            for (const child of element.childNodes) {
                const cleanChild = cleanNode(child);
                if (cleanChild)
                    cleanElement.appendChild(cleanChild);
            }
            return cleanElement;
        }
        return null;
    }
    const result = document.createElement('div');
    for (const child of doc.body.childNodes) {
        const cleanChild = cleanNode(child);
        if (cleanChild)
            result.appendChild(cleanChild);
    }
    return result.innerHTML;
}
/**
 * Generiert eine neue ID für einen Entity-Typ
 * @param type - Entity-Typ
 * @param dataStore - Datenspeicher mit _nextId
 * @returns Neue ID
 */
function nextId(type, dataStore) {
    if (!dataStore._nextId)
        dataStore._nextId = {};
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
 * @param score - Attributwert (1-30)
 * @returns Modifikator
 */
function getModifier(score) {
    return Math.floor((score - 10) / 2);
}
/**
 * Berechnet den Übungsbonus für eine Stufe
 * @param level - Charakterstufe (1-20)
 * @returns Übungsbonus (2-6)
 */
function getProficiencyBonus(level) {
    return Math.ceil(level / 4) + 1;
}
/**
 * Parst eine Würfelnotation (z.B. "2d6+3")
 * @param notation - Würfelnotation
 * @returns Geparstes Ergebnis oder null
 */
function parseDiceNotation(notation) {
    if (!notation)
        return null;
    const match = notation.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
    if (!match)
        return null;
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
 * @param fn - Funktion
 * @param delay - Verzögerung in ms
 * @returns Debounced Funktion
 */
function debounce(fn, delay = 300) {
    let timeoutId = null;
    return function debounced(...args) {
        if (timeoutId)
            clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}
/**
 * Throttle - Begrenzt Ausführungsrate
 * @param fn - Funktion
 * @param limit - Limit in ms
 * @returns Throttled Funktion
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
 * @param value - Zu prüfender Wert
 * @returns True wenn leer
 */
function isEmpty(value) {
    if (value == null)
        return true;
    if (typeof value === 'string')
        return value.trim() === '';
    if (Array.isArray(value))
        return value.length === 0;
    if (typeof value === 'object')
        return Object.keys(value).length === 0;
    return false;
}
/**
 * Klemmt einen Wert zwischen min und max
 * @param value - Wert
 * @param min - Minimum
 * @param max - Maximum
 * @returns Geklemmter Wert
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
/**
 * Erstellt eine tiefe Kopie eines Objekts
 * @param obj - Zu klonendes Objekt
 * @returns Tiefe Kopie
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Formatiert einen Modifikator mit Vorzeichen
 * @param mod - Modifikator
 * @returns Formatierter String
 */
function formatMod(mod) {
    return mod >= 0 ? `+${mod}` : String(mod);
}

// ============================================================
// MODULE EXPORTS (for Jest tests)
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
