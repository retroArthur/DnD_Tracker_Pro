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
        'strike',
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
    // Erlaubnisliste zulässiger CSS-Funktionsnamen für Stilwerte (T-10-30):
    // die Prüfung erfolgt PRO DEKLARATION gegen genau diese Liste, nicht als
    // Zeichenketten-Suche über den gesamten Rohwert — eine Verschleierung des
    // Funktionsnamens (eingeschobener Kommentar, CSS-Escape-Sequenz) zerstört
    // die Bezeichnerfolge vor der öffnenden Klammer und macht die Prüfung
    // dadurch automatisch zum Fehlschlag, statt sie zu umgehen. var(...) ist
    // zwingend enthalten: der Tabellen-Einfügepfad injiziert Deklarationen
    // mit CSS-Custom-Property-Referenzen (border/background), die diese
    // Prüfung überleben müssen.
    const allowedStyleFunctions = ['var', 'rgb', 'rgba', 'hsl', 'hsla', 'calc'];
    // Gefährliche Protokolle (case-insensitive)
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:', 'blob:'];
    // Prüft, ob ein Stilwert ausschließlich erlaubte CSS-Funktionsnamen
    // verwendet (siehe allowedStyleFunctions oben). Eine At-Regel-Einleitung
    // im Wert macht ihn unabhängig davon unsicher.
    function isSafeStyleValue(value) {
        const lower = value.toLowerCase();
        if (lower.includes('@')) return false;
        for (let i = 0; i < lower.length; i++) {
            if (lower[i] !== '(') continue;
            let j = i - 1;
            let ident = '';
            while (j >= 0 && /[a-z0-9_-]/.test(lower[j])) {
                ident = lower[j] + ident;
                j--;
            }
            if (!allowedStyleFunctions.includes(ident)) return false;
        }
        return true;
    }
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
                            const colonIdx = s.indexOf(':');
                            const prop = (colonIdx === -1 ? s : s.slice(0, colonIdx))
                                .trim()
                                .toLowerCase();
                            if (!styleList.includes(prop)) return false;
                            if (colonIdx === -1) return true;
                            const value = s.slice(colonIdx + 1).trim();
                            return isSafeStyleValue(value);
                        })
                        .join(';');
                    if (styles) cleanElement.setAttribute('style', styles);
                } else if (attrName === 'class' && allowedAttributes.class) {
                    cleanElement.setAttribute('class', attr.value);
                } else if (attrName === 'href' && allowedAttributes.href && tagName === 'a') {
                    const href = attr.value.trim();
                    const hrefLower = href.toLowerCase();
                    const isSafe = dangerousProtocols.every(proto => !hrefLower.startsWith(proto));
                    // relativ nur nach istRelativerLink() (Datengrenzen-Block): kein doppelter,
                    // auch kodierter Trenner — unter file:// ein UNC-Pfad (SENKEN R3, (16))
                    if (
                        isSafe &&
                        (hrefLower.startsWith('http://') ||
                            hrefLower.startsWith('https://') ||
                            istRelativerLink(href))
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

// [DATENGRENZE:ANFANG] — zeichengleich in utils/basic.js und utils/testable-utils.js
// (tests/unit/sanitizer-parity.test.js vergleicht den Block; der Vertrag beider Kopien steht
// in tests/unit/datengrenze.test.js)
// ============================================================
// SICHERE WERTE AUS DATEN — Vertrag SENKEN R2/R3/R4, docs/bugfixes.md
// Keine dieser Hilfen ist ein Kodierer: Text- und Attributausgabe laeuft weiter durch esc().
// ============================================================
/**
 * Leseregel des Browsers fuer einen Wert, der als URL gelesen wird — EINMAL fuer alle R3-Hilfen
 * (sichererLink, istLokalerDateipfad, sichereBildquelle, istRelativerLink); intern im Block,
 * kein Export. Der Browser entfernt fuehrende Leer- und Steuerzeichen (U+0000 bis U+0020) und
 * streicht Tabulator und Zeilenumbruch auch IM Text: "\tjava\nScRiPt:" ist fuer ihn javascript:,
 * "fi\tle:///C:/x" eine lokale Datei. Gross/Klein bleibt stehen — das pruefen die Aufrufer.
 * @param {string} url - Wert aus Daten (Text)
 * @returns {string} der Wert, wie der Browser ihn liest
 */
function wieBrowserGelesen(url) {
    let start = 0;
    while (start < url.length && url.charCodeAt(start) <= 0x20) start++;
    return url.slice(start).replace(/[\t\n\r]/g, '');
}
/**
 * R3: Link aus Daten -> derselbe Link oder ''. Erlaubt sind nur http:, https:, mailto:.
 * Geprueft wird das Schema so, wie der Browser es liest (wieBrowserGelesen()), Gross/Klein
 * egal. Darum eine Erlaubnisliste statt einer Sperrliste, verankert am Anfang. Ein erlaubter
 * Link kommt unveraendert zurueck; im Attribut gehoert er zusaetzlich in esc() (er laesst `"`
 * stehen).
 * @param {*} url - Wert aus Daten
 * @returns {string} der Link oder ''
 */
function sichererLink(url) {
    if (typeof url !== 'string') return '';
    return /^(?:https?|mailto):/i.test(wieBrowserGelesen(url)) ? url : '';
}
/**
 * R3-Pruefkern fuer Pfade — EINE Pruefung fuer den Pfad hinter `file://` (istLokalerDateipfad),
 * fuer relative Bildquellen (sichereBildquelle) und fuer relative Linkziele im Rich-Text
 * (istRelativerLink, Nachbesserung (16)); intern im Block, kein Export. Wahr ist ein Pfad mit
 * hoechstens einem Trenner am Anfang, danach etwas anderes als `?`/`#`, und nirgends zwei
 * Trenner hintereinander. Trenner werden gelesen wie vom Browser: `\` wie `/`, und `%2F`/`%5C`
 * (Gross/Klein egal) ebenfalls, weil ein Teil der Browser sie beim Oeffnen einer Datei
 * dekodiert. Ein doppelter Trenner, wo auch immer, ist unter Windows ein UNC-Pfad oder wird
 * einer: `.`/`..` (auch kodiert, `%2e%2e`) loesen sich vorher auf, `/x/..//rechner` wird
 * `//rechner`. Gemessen: Firefox setzt `/%5C%5Crechner/x.png` hinter `file://` und laedt
 * `\\rechner\x.png` (Nachbesserung (15), docs/bugfixes.md SENKEN) — und oeffnet ebenso
 * `/%5C%5Crechner/x.pdf` als Linkziel beim Klick (Nachbesserung (16)).
 * @param {string} pfad - Pfad, wie der Browser ihn liest (wieBrowserGelesen())
 * @returns {boolean} ob der Pfad keinen Netzwerkanteil hat
 */
function istLokalerPfad(pfad) {
    const getrennt = pfad.replace(/%2f|%5c|\\/gi, '/');
    return /^\/?[^/?#]/.test(getrennt) && !getrennt.includes('//');
}
/**
 * R3: lokaler Dateipfad — EINE Pruefung fuer die Linkliste (sichererListenLink) und die
 * Bildquellen (sichereBildquelle); intern im Block, kein Export. Nutzerentscheidung (29.10.):
 * der Nutzer arbeitet unter file://, verlinkt eigene PDFs und Karten und legt Portraits auf der
 * eigenen Platte ab; vor SENKEN war beides bedienbar bzw. sichtbar und soll es wieder sein.
 * Wahr ist darum genau `file:///` mit einem lokalen Pfad dahinter (istLokalerPfad()) — ein
 * Laufwerk (`file:///C:/Karten/x.pdf`) oder ein absoluter Pfad (`file:///home/x.pdf`).
 * Falsch bleibt jeder Netzwerkpfad: unter Windows ist `file://rechner/freigabe/x` ein
 * UNC-Pfad, und das System meldet sich beim fremden Rechner an (NTLM — die Anmeldung des
 * Nutzers geht an einen Rechner, den die Daten bestimmen); beim Link genuegt der Klick, beim
 * Bild schon das Anzeigen. Darum kein Host (auch nicht `localhost`: Hostnamen liest die
 * Pruefung nicht, und Chromium liest ihn als Host), kein Pfad, der mit einem Trenner beginnt
 * (`file:////rechner`, `file:///\\rechner`, `file:///%5C%5Crechner`), und kein doppelter
 * Trenner im Rest (`file:///home/../..//rechner` loest sich zu `file:////rechner` auf). Gelesen
 * wie der Browser (wieBrowserGelesen()), Gross/Klein egal. Die Faelle stehen einmal fuer beide
 * Hilfen in tests/unit/datengrenze.test.js (DATEIPFAD_LOKAL, DATEIPFAD_GESPERRT).
 * @param {*} url - Wert aus Daten
 * @returns {boolean} ob der Wert ein lokaler Dateipfad ist
 */
function istLokalerDateipfad(url) {
    if (typeof url !== 'string') return false;
    const gelesen = wieBrowserGelesen(url);
    return /^file:\/\/\//i.test(gelesen) && istLokalerPfad(gelesen.slice('file://'.length));
}
/**
 * R3 fuer die Linkliste (features/shops/links.js): was sichererLink() erlaubt, dazu lokale
 * Datei-Links nach istLokalerDateipfad() — Netzwerkpfade bleiben gesperrt (Nutzerentscheidung
 * 29.10.). Nur fuer die Linkliste — Editor-Links (Linkmenue, Markdown-Wandler) bleiben bei
 * sichererLink().
 * @param {*} url - Wert aus Daten
 * @returns {string} der Link oder ''
 */
function sichererListenLink(url) {
    return sichererLink(url) || (istLokalerDateipfad(url) ? url : '');
}
/**
 * R3 fuer Bildquellen (`<img src>`, `img.src`): Bild aus Daten -> dieselbe Quelle oder ''.
 * Ein Bild laedt die App von selbst, ohne Klick. Erlaubt sind http:, https:, data:image/,
 * lokale Dateipfade nach istLokalerDateipfad() (Nutzerentscheidung 29.10.: lokale Portraits
 * wieder sichtbar) und relative Pfade nach demselben Pruefkern istLokalerPfad() wie der Pfad
 * hinter `file://`. Verboten jedes andere Schema (javascript:, data:text/html, blob:, ein
 * Netzwerkpfad `file://host/…` …) und jeder relative Wert mit Netzwerkanteil: ein
 * protokoll-relativer Anfang (`//host/share/x.png` wird unter file:// zu
 * `file://host/share/x.png`, unter Windows ein UNC-Pfad, also eine Verbindung samt
 * Anmeldeversuch zu einem fremden Rechner) und ebenso ein doppelter Trenner aus `\`, `%2F` oder
 * `%5C` irgendwo im Wert (`/%5C%5Chost/x.png` laedt Firefox als `\\host\x.png`, Nachbesserung
 * (15)). Gelesen wie der Browser (wieBrowserGelesen()).
 * @param {*} url - Wert aus Daten
 * @returns {string} die Quelle oder ''
 */
function sichereBildquelle(url) {
    if (typeof url !== 'string') return '';
    const gelesen = wieBrowserGelesen(url);
    if (!gelesen) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(gelesen)) return istLokalerPfad(gelesen) ? url : '';
    return /^(?:https?:|data:image\/)/i.test(gelesen) || istLokalerDateipfad(url) ? url : '';
}
/**
 * R3 fuer relative Linkziele im Rich-Text — EINE Pruefung fuer sanitizeHTML() (beide Kopien),
 * isAllowedEditorHref() (Link-Eingabe und Linkmenue des Editors, ui/editors/rich-text.js) und
 * markdownLinkZiel() (Markdown-Export, ui/editors/markdown-converter.js). Erlaubt ist, was der
 * Editor selbst anlegt: ein Anker `#…` (ein Sprung im Dokument, er oeffnet nichts) und ein Pfad
 * ab `./` oder `/` ohne Netzwerkanteil nach demselben Pruefkern wie eine relative Bildquelle
 * (istLokalerPfad()) — `?` und `#` hinter dem Pfad bleiben erlaubt (`./abschnitt.html#a`,
 * `/bilder/x.png?v=1`). Gesperrt ist jeder doppelte, auch kodierte Trenner: Firefox setzt
 * `/%5C%5Crechner/x.pdf` beim Klick hinter `file://` und oeffnet `\\rechner\x.pdf` (UNC,
 * Nachbesserung (16)). Gelesen wie der Browser (wieBrowserGelesen()). Absolute Ziele (http(s),
 * mailto) prueft der Aufrufer selbst.
 * @param {*} url - Linkziel aus Daten oder aus der Eingabe
 * @returns {boolean} ob der Wert ein erlaubtes relatives Linkziel ist
 */
function istRelativerLink(url) {
    if (typeof url !== 'string') return false;
    const gelesen = wieBrowserGelesen(url);
    if (gelesen.startsWith('#')) return true;
    return /^\.?\//.test(gelesen) && istLokalerPfad(gelesen);
}
/**
 * R2: Farbwert aus Daten fuer `style`/Farbattribute: nur `#rgb` oder `#rrggbb`, sonst der
 * feste Ersatz aus dem Code (der darf auch `var(--gold)` sein).
 * @param {*} wert - Wert aus Daten
 * @param {string} ersatz - fester Ersatzwert aus dem Code
 * @returns {string}
 */
function sichereFarbe(wert, ersatz) {
    return typeof wert === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(wert) ? wert : ersatz;
}
/**
 * R2: Klassen-/Enum-Wert aus Daten: nur ein Wert aus der Erlaubnisliste (exakt, ohne
 * Objekt-Nachschlagen — `__proto__`, `constructor`, `toString` sind nie erlaubt), sonst der
 * feste Ersatz aus dem Code.
 * @param {*} wert - Wert aus Daten
 * @param {string[]} erlaubteWerte - Erlaubnisliste aus dem Code
 * @param {string} ersatz - fester Ersatzwert aus dem Code
 * @returns {string}
 */
function sichereKlasse(wert, erlaubteWerte, ersatz) {
    return typeof wert === 'string' && Array.isArray(erlaubteWerte) && erlaubteWerte.includes(wert)
        ? wert
        : ersatz;
}
/**
 * R4: Schluessel, die aus Daten nie uebernommen werden: die Prototyp-Setzer (eine Zuweisung
 * setzt sonst den Prototyp) und die Umwandler `toString`/`valueOf` — ein Objekt aus JSON mit
 * einem solchen Datenfeld (`{"toString": 1}`) laesst String(), esc() und jedes Template
 * werfen, die Ansicht zeichnet dann nicht (Gutachten, Sonde F).
 */
const DATENGRENZE_VERBOTEN = Object.freeze([
    '__proto__',
    'constructor',
    'prototype',
    'toString',
    'valueOf'
]);
/**
 * R4: Textfelder, auf denen Darstellung, Sortierung und Suche Zeichenketten-Methoden rufen
 * (`a.name.localeCompare`, `.toLowerCase()`): ein Objekt oder eine Liste dort wird '' —
 * sonst wirft die ganze Ansicht (Gutachten, Sonde F: ein NPC mit `name: {}` leerte die Liste).
 */
const DATENGRENZE_TEXTFELDER = Object.freeze(['name', 'title', 'category', 'type']);
/**
 * R4: Zahlen- und Verweisfelder des Kampagnenformats, als Pfad ab der Kampagnenwurzel:
 * `a[]` = jeder Eintrag der Liste a, `a.*` = jeder Wert des Objekts a; ein Pfad, der auf `[]`
 * endet, ist eine Liste von Zahlen. Aufgenommen ist nur, was die App selbst ausschliesslich
 * als Zahl schreibt (parseInt/parseFloat/nextId/Date.now in der Speicherfunktion) — der
 * Typzwang haengt an Sammlung UND Feld, nicht am Feldnamen. Bewusst NICHT hier, weil die App
 * dort auch Text schreibt: characters[].speed ("7.5m"), shops[].items[].weight ("1,5 kg"),
 * attacks[].attackBonus ("+5"), savingThrows-Werte, statblockRef.id ("goblin"),
 * soundboard.scenes[].id ("scene_1"), loot[].assignedTo, die Widget-IDs des DM-Screens.
 * characters[].items[] traegt Zahlen (Altformat) ODER {id, quantity}: nur die Felder der
 * Objekte sind hier, ein Eintrag, der kein Objekt ist, bleibt unberuehrt.
 */
const DATENGRENZE_ZAHLENFELDER = Object.freeze([
    'characters[].id',
    'characters[].level',
    'characters[].xp',
    'characters[].hpCurrent',
    'characters[].hpMax',
    'characters[].tempHp',
    'characters[].armorClass',
    'characters[].initiative',
    'characters[].passivePerception',
    'characters[].proficiencyBonus',
    'characters[].weight',
    'characters[].height',
    'characters[].attributes.*',
    'characters[].currency.*',
    'characters[].spellSlots.*.max',
    'characters[].spellSlots.*.current',
    'characters[].spellSlotsMax[]',
    'characters[].spellSlotsUsed[]',
    'characters[].spells[]',
    'characters[].items[].id',
    'characters[].items[].quantity',
    'characters[].links[].id',
    'npcs[].id',
    'npcs[].locationId',
    'npcs[].factionId',
    'npcs[].relations[].targetId',
    'npcs[].links[].id',
    'locations[].id',
    'locations[].links[].id',
    'quests[].id',
    'quests[].giverId',
    'quests[].locationId',
    'quests[].targetId',
    'quests[].rewardGold',
    'quests[].rewardItems[].id',
    'quests[].createdAt',
    'quests[].links[].id',
    'encounters[].id',
    'encounters[].ac',
    'encounters[].hp',
    'encounters[].init',
    'encounters[].perception',
    'encounters[].str',
    'encounters[].dex',
    'encounters[].con',
    'encounters[].int',
    'encounters[].wis',
    'encounters[].cha',
    'encounters[].links[].id',
    'factions[].id',
    'factions[].ruf',
    'factions[].sitzOrtId',
    'factions[].mitgliederNpcIds[]',
    'factions[].rufHistorie[].delta',
    'factions[].rufHistorie[].zeitstempel',
    'factions[].links[].id',
    'loot[].id',
    'loot[].quantity',
    'loot[].weight',
    'loot[].value',
    'loot[].links[].id',
    'spells[].id',
    'spells[].level',
    'spells[].links[].id',
    'sessionNotes[].id',
    'sessionNotes[].number',
    'sessionNotes[].arcId',
    'storyArcs[].id',
    'storyArcs[].order',
    'shops[].id',
    'shops[].npcId',
    'shops[].locationId',
    'shops[].items[].quantity',
    'randomTables[].id',
    'randomTables[].entries[].weight',
    'wiki[].id',
    'wiki[].parentId',
    'wiki[].createdAt',
    'wiki[].updatedAt',
    'wiki[].links[].id',
    'sessionPreps[].id',
    'sessionPreps[].sessionNr',
    'sessionPreps[].erstellt',
    'sessionPreps[].szenen[].id',
    'sessionPreps[].offeneFaeden[].quelleId',
    'sessionPreps[].links[].id',
    'bestiary[].id',
    'bestiary[].ac',
    'bestiary[].hp',
    'bestiary[].xp',
    'bestiary[].str',
    'bestiary[].dex',
    'bestiary[].con',
    'bestiary[].int',
    'bestiary[].wis',
    'bestiary[].cha',
    'bestiary[].legendaryActionsPerRound',
    'links[].id',
    'filters[].id',
    'quickRefCustom[].id',
    'monsterFavorites[].id',
    'monsterFavorites[].monsters[].count',
    'sessionHistory[].duration',
    'wikiRecentlyViewed[]',
    'partyGold',
    'calendar.day',
    'calendar.month',
    'calendar.year',
    'calendar.events[].id',
    'calendar.events[].quelleId',
    'calendar.events[].datum.tag',
    'calendar.events[].datum.monat',
    'calendar.events[].datum.jahr',
    'initiative.round',
    'initiative.currentTurn',
    'initiative.combatants[].id',
    'initiative.combatants[].initiative',
    'initiative.combatants[].initBonus',
    'initiative.combatants[].maxHp',
    'initiative.combatants[].currentHp',
    'initiative.combatants[].tempHp',
    'initiative.combatants[].ac',
    'initiative.combatants[].xp',
    'initiative.combatants[].effects[].id',
    'initiative.combatants[].effects[].duration',
    'initiative.combatants[].deathSaves.successes',
    'initiative.combatants[].deathSaves.failures',
    'initiative.combatants[].concentration.lastDC',
    'initiative.combatants[].concentration.pendingCheck',
    'initiative.combatants[].legendaryActions.max',
    'initiative.combatants[].legendaryActions.remaining',
    'initiative.combatants[].legendaryResistance.max',
    'initiative.combatants[].legendaryResistance.remaining',
    'initiative.combatants[].mob.count',
    'initiative.combatants[].mob.poolHp',
    'initiative.combatants[].mob.maxPoolHp',
    'initiative.combatants[].mob.individualMaxHp',
    'soundboard.scenes[].slot',
    'soundboard.scenes[].tracks[].volume'
]);
/** Die Pfade, einmal zerlegt: je Stufe der Name und ob sie eine Liste ist. */
const DATENGRENZE_PFADE = DATENGRENZE_ZAHLENFELDER.map(pfad =>
    pfad.split('.').map(teil => ({ name: teil.replace('[]', ''), liste: teil.endsWith('[]') }))
);
/** Zahl als Text aus einem alten Export: "12", "-2", "1.5", "1,5" (ohne Exponent, ohne Rest). */
const DATENGRENZE_ZAHLTEXT = /^[+-]?\d+(?:[.,]\d+)?$/;
/**
 * Mehrdeutig: eine bis drei Ziffern (ohne fuehrende Null), ein Trenner, genau drei Ziffern.
 * "6.500" ist deutsch 6500 und englisch 6,5; "1,500" umgekehrt. Die App schreibt solche Texte
 * nie (jede Speicherfunktion nimmt parseInt/parseFloat); sie kommen nur aus fremden oder von
 * Hand bearbeiteten Dateien. Eine Umwandlung riete und schriebe beim naechsten save() einen
 * um den Faktor 1000 falschen Wert fest — ein solcher Wert wird verworfen wie Text mit Einheit
 * ("80 kg"). Eindeutig bleiben "0.125", "1234.567", "1.5", "1,80".
 */
const DATENGRENZE_ZAHLTEXT_MEHRDEUTIG = /^[+-]?[1-9]\d{0,2}[.,]\d{3}$/;
/**
 * Wert eines Zahlenfelds -> Zahl, unveraendert oder `undefined` (= verwerfen). Unveraendert
 * bleiben Zahl, `null` (z. B. unbegrenzter Bestand, kein Verweis), Wahrheitswert und der
 * leere Text — keiner davon traegt Markup. Zahl als Text wird umgewandelt, nicht verworfen —
 * ausser in mehrdeutiger Form (DATENGRENZE_ZAHLTEXT_MEHRDEUTIG). Alles andere (Markup, Objekt,
 * Liste — eine Liste wird im Template zu ihrem Text) faellt weg.
 */
function datengrenzeZahlwert(wert) {
    if (wert === null || wert === '' || typeof wert === 'number' || typeof wert === 'boolean') {
        return wert;
    }
    if (typeof wert === 'string') {
        const text = wert.trim();
        if (DATENGRENZE_ZAHLTEXT_MEHRDEUTIG.test(text)) return undefined;
        if (DATENGRENZE_ZAHLTEXT.test(text)) return Number(text.replace(',', '.'));
    }
    return undefined;
}
/** Wendet einen zerlegten Pfad ab Stufe `stufe` auf `knoten` an (Tiefe = Pfadlaenge). */
function datengrenzeFeld(knoten, pfad, stufe) {
    if (!knoten || typeof knoten !== 'object') return;
    const teil = pfad[stufe];
    const letzte = stufe === pfad.length - 1;
    const namen = teil.name === '*' ? Object.keys(knoten) : [teil.name];
    for (const name of namen) {
        if (!Object.prototype.hasOwnProperty.call(knoten, name)) continue;
        const wert = knoten[name];
        if (!letzte) {
            if (!teil.liste) datengrenzeFeld(wert, pfad, stufe + 1);
            else if (Array.isArray(wert)) wert.forEach(e => datengrenzeFeld(e, pfad, stufe + 1));
        } else if (teil.liste) {
            // Liste von Zahlen: Positionen bleiben stehen (Zauberplaetze haengen am Index)
            if (Array.isArray(wert)) {
                for (let i = 0; i < wert.length; i++) {
                    const zahl = datengrenzeZahlwert(wert[i]);
                    if (zahl !== wert[i]) wert[i] = zahl === undefined ? null : zahl;
                }
            } else if (wert !== null && wert !== undefined) {
                knoten[name] = [];
            }
        } else {
            const zahl = datengrenzeZahlwert(wert);
            if (zahl === undefined) delete knoten[name];
            else if (zahl !== wert) knoten[name] = zahl;
        }
    }
}
/**
 * Entfernt die verbotenen Schluessel (DATENGRENZE_VERBOTEN) in jeder Tiefe und setzt ein
 * Objekt in einem Textfeld (DATENGRENZE_TEXTFELDER) auf '' (iterativ).
 */
function datengrenzeEntgiften(wurzel) {
    const offen = [wurzel];
    const gesehen = new Set();
    while (offen.length > 0) {
        const knoten = offen.pop();
        if (!knoten || typeof knoten !== 'object' || gesehen.has(knoten)) continue;
        gesehen.add(knoten);
        if (Array.isArray(knoten)) {
            for (let i = 0; i < knoten.length; i++) offen.push(knoten[i]);
            continue;
        }
        for (const schluessel of DATENGRENZE_VERBOTEN) {
            if (Object.prototype.hasOwnProperty.call(knoten, schluessel)) delete knoten[schluessel];
        }
        for (const schluessel of DATENGRENZE_TEXTFELDER) {
            const wert = knoten[schluessel];
            if (wert && typeof wert === 'object') knoten[schluessel] = '';
        }
        for (const schluessel of Object.keys(knoten)) offen.push(knoten[schluessel]);
    }
}
/**
 * R4: gemeinsame Datengrenze aller Wege nach D (Kampagnen-Import, Backup lokal und aus dem
 * Ordner, Migrations-Import, Start/Neuladen ueber load()). Entfernt __proto__/constructor/
 * prototype/toString/valueOf in jeder Tiefe, setzt ein Objekt in name/title/category/type auf
 * '' und zwingt die Felder aus DATENGRENZE_ZAHLENFELDER auf Zahl (siehe
 * datengrenzeZahlwert). KEIN Sanitizer: Texte, Wuerfelformeln mit `<`/`>`, Namen mit `&`,
 * `<`, `"`, Rich-Text bleiben byte-gleich (R5) — die Ausgabe kodiert (R1). Arbeitet auf dem
 * uebergebenen Objekt (frisch aus JSON.parse) und gibt es zurueck; zweimal angewandt aendert
 * nichts mehr. Aufrufer verwenden das Ergebnis (tests/unit/datengrenze.test.js, Verdrahtung).
 * @param {*} daten - Kampagnenobjekt aus Datei oder Speicher
 * @returns {*} dieselben, bereinigten Daten (kein Objekt: unveraendert)
 */
function bereinigeDatengrenze(daten) {
    if (!daten || typeof daten !== 'object') return daten;
    datengrenzeEntgiften(daten);
    for (const pfad of DATENGRENZE_PFADE) datengrenzeFeld(daten, pfad, 0);
    return daten;
}
// [DATENGRENZE:ENDE]

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
    // Vertrag SENKEN R2/R3/R4 (tests/unit/datengrenze.test.js)
    sichererLink,
    sichererListenLink,
    sichereBildquelle,
    istRelativerLink,
    sichereFarbe,
    sichereKlasse,
    bereinigeDatengrenze,
    // Test data accessible for test assertions
    XP_LEVEL_THRESHOLDS: XP_LEVEL_THRESHOLDS_TEST,
    SKILL_INFO: SKILL_INFO_TEST,
    CR_TO_XP: CR_TO_XP_TEST
};
