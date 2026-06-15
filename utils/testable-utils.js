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
 * @param html - Zu bereinigendes HTML
 * @returns Bereinigtes HTML
 */
function sanitizeHTML(html) {
    if (!html) return '';
    // Schritt 1: Entferne gefährliche Patterns BEVOR Parsing
    const cleaned = String(html)
        .replace(new RegExp('<script[\\s\\S]*?</scr' + 'ipt>', 'gi'), '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
        .replace(/javascript\s*:/gi, '')
        .replace(/vbscript\s*:/gi, '')
        .replace(/data\s*:\s*text\/html/gi, '');
    // Schritt 2: Verwende DOMParser (sicherer als innerHTML)
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleaned, 'text/html');
    // Erlaubte Tags und Attribute
    const allowedTags = [
        'b',
        'i',
        'u',
        's',
        'strong',
        'em',
        'ul',
        'ol',
        'li',
        'p',
        'br',
        'div',
        'span',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'mark',
        'a',
        'font'
    ];
    const allowedAttributes = {
        style: [
            'color',
            'background-color',
            'background',
            'font-family',
            'font-size',
            'font-weight',
            'text-decoration',
            'border',
            'border-collapse',
            'padding',
            'margin',
            'width',
            'text-align',
            'vertical-align'
        ],
        class: true,
        href: true,
        title: true,
        colspan: true,
        rowspan: true,
        face: true,
        size: true
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
                if (attrName.startsWith('on')) continue;
                if (attrName === 'style' && Array.isArray(allowedAttributes.style)) {
                    const styleList = allowedAttributes.style;
                    const styles = attr.value
                        .split(';')
                        .filter(s => {
                            const prop = s.split(':')[0]?.trim().toLowerCase();
                            return styleList.includes(prop);
                        })
                        .join(';');
                    if (styles) cleanElement.setAttribute('style', styles);
                } else if (attrName === 'class' && allowedAttributes.class) {
                    cleanElement.setAttribute('class', attr.value);
                } else if (attrName === 'href' && allowedAttributes.href && tagName === 'a') {
                    const href = attr.value.trim();
                    const hrefLower = href.toLowerCase();
                    const isSafe = dangerousProtocols.every(proto => !hrefLower.startsWith(proto));
                    if (
                        isSafe &&
                        (hrefLower.startsWith('http://') ||
                            hrefLower.startsWith('https://') ||
                            href.startsWith('/') ||
                            href.startsWith('#') ||
                            href.startsWith('./'))
                    ) {
                        cleanElement.setAttribute('href', href);
                        cleanElement.setAttribute('target', '_blank');
                        cleanElement.setAttribute('rel', 'noopener noreferrer');
                    }
                } else if (attrName === 'title' && allowedAttributes.title) {
                    cleanElement.setAttribute('title', attr.value);
                } else if (
                    (attrName === 'colspan' || attrName === 'rowspan') &&
                    allowedAttributes[attrName]
                ) {
                    const val = parseInt(attr.value);
                    if (!isNaN(val) && val > 0 && val < 100) {
                        cleanElement.setAttribute(attrName, val.toString());
                    }
                } else if (
                    (attrName === 'face' || attrName === 'size') &&
                    allowedAttributes[attrName] &&
                    tagName === 'font'
                ) {
                    cleanElement.setAttribute(attrName, attr.value);
                }
            }
            for (const child of element.childNodes) {
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
/**
 * Generiert eine neue ID für einen Entity-Typ
 * @param type - Entity-Typ
 * @param dataStore - Datenspeicher mit _nextId
 * @returns Neue ID
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
 * @param fn - Funktion
 * @param delay - Verzögerung in ms
 * @returns Debounced Funktion
 */
function debounce(fn, delay = 300) {
    let timeoutId = null;
    return function debounced(...args) {
        if (timeoutId) clearTimeout(timeoutId);
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
            setTimeout(() => {
                inThrottle = false;
            }, limit);
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
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
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
    if (obj === null || typeof obj !== 'object') return obj;
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
// PHASE 6: SPIELER-VERWALTUNG — Pure Rules Helpers (CommonJS mirror)
// keep in sync with utils/game-rules.js (browser runtime version)
// ============================================================

/**
 * PHB Charakteraufstieg: Kumulativer XP-Bedarf pro Stufe (D&D 5e, PHB S.15)
 * ACHTUNG: Nicht zu verwechseln mit XP_THRESHOLDS (Encounter-Schwierigkeit)
 * @type {number[]}
 */
const XP_LEVEL_THRESHOLDS_TEST = [
    0,       // Level 1
    300,     // Level 2
    900,     // Level 3
    2700,    // Level 4
    6500,    // Level 5
    14000,   // Level 6
    23000,   // Level 7
    34000,   // Level 8
    48000,   // Level 9
    64000,   // Level 10
    85000,   // Level 11
    100000,  // Level 12
    120000,  // Level 13
    140000,  // Level 14
    165000,  // Level 15
    195000,  // Level 16
    225000,  // Level 17
    265000,  // Level 18
    305000,  // Level 19
    355000   // Level 20
];

/**
 * Minimale SKILL_INFO-Kopie für Tests (alle 18 Fertigkeiten aus core/constants.js:217)
 * keep in sync with SKILL_INFO in core/constants.js
 * @type {Object.<string, {name: string, attr: string}>}
 */
const SKILL_INFO_TEST = {
    acrobatics: { name: 'Akrobatik', attr: 'dex' },
    animalHandling: { name: 'Tierkunde', attr: 'wis' },
    arcana: { name: 'Arkane Kunde', attr: 'int' },
    athletics: { name: 'Athletik', attr: 'str' },
    deception: { name: 'Täuschung', attr: 'cha' },
    history: { name: 'Geschichte', attr: 'int' },
    insight: { name: 'Motiv erkennen', attr: 'wis' },
    intimidation: { name: 'Einschüchtern', attr: 'cha' },
    investigation: { name: 'Nachforschungen', attr: 'int' },
    medicine: { name: 'Heilkunde', attr: 'wis' },
    nature: { name: 'Naturkunde', attr: 'int' },
    perception: { name: 'Wahrnehmung', attr: 'wis' },
    performance: { name: 'Auftreten', attr: 'cha' },
    persuasion: { name: 'Überzeugen', attr: 'cha' },
    religion: { name: 'Religion', attr: 'int' },
    sleightOfHand: { name: 'Fingerfertigkeit', attr: 'dex' },
    stealth: { name: 'Heimlichkeit', attr: 'dex' },
    survival: { name: 'Überlebenskunst', attr: 'wis' }
};

/**
 * Minimale CR_TO_XP-Kopie für Tests (aus features/encounter-calculator.js:32)
 * Enthält gemischte Schlüsseltypen: Number-Keys für ganze CRs, String-Keys für Brüche
 * keep in sync with CR_TO_XP in features/encounter-calculator.js
 * @type {Object}
 */
const CR_TO_XP_TEST = {
    0: 10, '1/8': 25, '1/4': 50, '1/2': 100,
    1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800,
    6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
    11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000,
    16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000,
    21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000,
    26: 90000, 27: 105000, 28: 120000, 29: 135000, 30: 155000
};

/**
 * Berechnet den Fertigkeitsmodifikator (TestUtils-Version ohne browser globals)
 * keep in sync with calcSkillModifier in utils/game-rules.js
 *
 * @param {Object} ch - Charakter-Objekt
 * @param {string} skillKey - Skill-Key aus SKILL_INFO (z.B. 'stealth')
 * @returns {number}
 */
function calcSkillModifier(ch, skillKey) {
    const skillInfo = SKILL_INFO_TEST[skillKey];
    if (!skillInfo) return 0;
    const attrVal = ch.attributes?.[skillInfo.attr] || 10;
    const attrMod = Math.floor((attrVal - 10) / 2); // getAbilityModifier inline
    const profBonus = ch.proficiencyBonus || (Math.ceil((ch.level || 1) / 4) + 1);
    const hasExpertise = !!ch.skillExpertise?.[skillKey];
    const isProficient = !!ch.skillProficiencies?.[skillKey];
    const profFactor = hasExpertise ? 2 : (isProficient ? 1 : 0);
    return attrMod + profBonus * profFactor;
}

/**
 * Prüft ob ein Charakter den nächsten Level aufsteigen kann (TestUtils-Version)
 * keep in sync with canLevelUp in utils/game-rules.js
 *
 * @param {Object} ch - Charakter mit level und xp
 * @returns {boolean}
 */
function canLevelUp(ch) {
    const nextLevel = (ch.level || 1) + 1;
    if (nextLevel > 20) return false;
    return (ch.xp || 0) >= XP_LEVEL_THRESHOLDS_TEST[nextLevel - 1];
}

/**
 * Gibt XP für einen CR zurück (TestUtils-Version ohne browser globals)
 * Behandelt gemischte Schlüsseltypen (Number und String).
 * keep in sync with getXPForCR in utils/game-rules.js
 *
 * @param {number|string} cr
 * @returns {number}
 */
function getXPForCR(cr) {
    return CR_TO_XP_TEST[cr] ?? CR_TO_XP_TEST[String(cr)] ?? 0;
}

/**
 * Verteilt XP gleichmäßig auf aktive Charaktere (TestUtils-Version)
 * keep in sync with distributeXP in utils/game-rules.js
 *
 * @param {number} totalXP
 * @param {Array} activeChars
 * @returns {{ share: number, remainder: number }}
 */
function distributeXP(totalXP, activeChars) {
    if (!activeChars || activeChars.length === 0) {
        return { share: 0, remainder: totalXP };
    }
    const share = Math.floor(totalXP / activeChars.length);
    const remainder = totalXP - share * activeChars.length;
    activeChars.forEach(ch => {
        ch.xp = (ch.xp || 0) + share;
    });
    return { share, remainder };
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
    formatMod,
    // Phase 6: Spieler-Verwaltung pure helpers
    calcSkillModifier,
    canLevelUp,
    getXPForCR,
    distributeXP,
    // Test data accessible for test assertions
    XP_LEVEL_THRESHOLDS: XP_LEVEL_THRESHOLDS_TEST,
    SKILL_INFO: SKILL_INFO_TEST,
    CR_TO_XP: CR_TO_XP_TEST
};
