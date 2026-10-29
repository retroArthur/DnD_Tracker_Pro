// [SECTION:UTILITIES_BASIC]
// ============================================================
// BASIC UTILITIES - @util @helper @dom @escape @sanitize
// Grundlegende DOM- und String-Funktionen
// ============================================================
// DOM-Selektor mit Debug-Warnung
function $(id) {
    const el = document.getElementById(id);
    if (!el && window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler) {
        window.ErrorHandler.log('$', new Error(`Element not found: #${id}`));
    }
    return el;
}
// QuerySelectorAll-Wrapper
function $$(sel) {
    return document.querySelectorAll(sel);
}
// HTML-Entity-Escaping für XSS-Schutz
function esc(s) {
    return s
        ? String(s)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;')
        : '';
}
// HTML-Tags entfernen für Plain-Text-Anzeige
function stripHtml(s) {
    return s
        ? String(s)
              .replace(/<[^>]*>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .trim()
        : '';
}
// Search-Helper-Funktionen
function clearSearch(inputId, renderFn) {
    const input = $(inputId);
    if (input instanceof HTMLInputElement) {
        input.value = '';
        updateSearchClear(input);
        if (typeof renderFn === 'function') renderFn();
    }
}
function updateSearchClear(input) {
    const btn = input.parentElement?.querySelector('.search-clear-btn');
    if (btn) {
        btn.classList.toggle('visible', input.value.length > 0);
    }
}
// HTML-Sanitizer für Rich-Text-Content (erlaubt nur sichere Tags/Attribute)
// SICHER: Verwendet DOMParser statt innerHTML um XSS beim Parsen zu verhindern
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
        face: true, // für <font face="..."> (execCommand fontName)
        size: true // für <font size="..."> (execCommand fontSize)
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
        // Text-Nodes sind sicher
        if (node.nodeType === Node.TEXT_NODE) {
            return node.cloneNode(true);
        }
        // Element-Nodes prüfen
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            const tagName = element.tagName.toLowerCase();
            // Nicht erlaubte Tags → nur Text-Content behalten
            if (!allowedTags.includes(tagName)) {
                return document.createTextNode(element.textContent || '');
            }
            // Erlaubtes Tag → neu erstellen ohne gefährliche Attribute
            const cleanElement = document.createElement(tagName);
            // Erlaubte Attribute kopieren
            for (const attr of element.attributes) {
                const attrName = attr.name.toLowerCase();
                // Event-Handler blockieren
                if (attrName.startsWith('on')) continue;
                // Style-Attribute filtern
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
                }
                // Class-Attribute erlauben
                else if (attrName === 'class' && allowedAttributes.class) {
                    cleanElement.setAttribute('class', attr.value);
                }
                // href für Links (nur sichere Protokolle - case-insensitive)
                else if (attrName === 'href' && allowedAttributes.href && tagName === 'a') {
                    const href = attr.value.trim();
                    const hrefLower = href.toLowerCase();
                    // Prüfe gegen gefährliche Protokolle (case-insensitive)
                    const isSafe = dangerousProtocols.every(proto => !hrefLower.startsWith(proto));
                    // Erlaube nur http(s), relative URLs, und Anker
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
                }
                // title-Attribut erlauben
                else if (attrName === 'title' && allowedAttributes.title) {
                    cleanElement.setAttribute('title', attr.value);
                }
                // colspan/rowspan für Tabellen
                else if (
                    (attrName === 'colspan' || attrName === 'rowspan') &&
                    allowedAttributes[attrName]
                ) {
                    const val = parseInt(attr.value);
                    if (!isNaN(val) && val > 0 && val < 100) {
                        cleanElement.setAttribute(attrName, val.toString());
                    }
                }
                // face/size für font-Tags (execCommand fontName/fontSize)
                else if (
                    (attrName === 'face' || attrName === 'size') &&
                    allowedAttributes[attrName] &&
                    tagName === 'font'
                ) {
                    cleanElement.setAttribute(attrName, attr.value);
                }
                // Andere Attribute blockieren (src, etc.)
            }
            // Kinder rekursiv bereinigen
            for (const child of element.childNodes) {
                const cleanChild = cleanNode(child);
                if (cleanChild) cleanElement.appendChild(cleanChild);
            }
            return cleanElement;
        }
        return null;
    }
    // Alle Kinder bereinigen
    const result = document.createElement('div');
    for (const child of doc.body.childNodes) {
        const cleanChild = cleanNode(child);
        if (cleanChild) result.appendChild(cleanChild);
    }
    return result.innerHTML;
}
// UTF-8-Bytezahl ohne Zwischenobjekt (PERF-01/D-08): ein Durchlauf pro Codepoint, exakt
// gleich zu new Blob([s]).size — bewiesen gegen ASCII, Umlaute, Emoji (Surrogatpaar) und
// unpaarige Surrogate in tests/unit/stability.test.js. Bewusst KEIN TextEncoder: der legt
// intern ebenfalls eine komplette Kopie an und löst das eigentliche Problem nicht.
function utf8ByteLength(str) {
    let bytes = 0;
    for (let i = 0; i < str.length; i++) {
        const code = str.codePointAt(i);
        if (code > 0xffff) i++; // Surrogatpaar: zweiten Index überspringen
        if (code < 0x80) bytes += 1;
        else if (code < 0x800) bytes += 2;
        else if (code < 0x10000) bytes += 3;
        else bytes += 4;
    }
    return bytes;
}
window.utf8ByteLength = utf8ByteLength;
// Sichere localStorage-Wrapper-Funktionen
const StorageAPI = {
    // Sicheres Lesen aus localStorage
    get(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : fallback;
        } catch (e) {
            const error = e;
            // Speicherfehler koennten stillen Datenverlust verdecken - Ausnahme (c), kein Guard
            if (window.ErrorHandler) {
                window.ErrorHandler.log('StorageAPI.get', error, key);
            }
            // Private Browsing, SecurityError, etc.
            if (error.name === 'SecurityError') {
                window.showToast?.('⚠️ Speicher nicht verfügbar (Private Browsing?)', 'warning');
            }
            return fallback;
        }
    },
    // Sicheres Schreiben in localStorage
    set(key, value) {
        try {
            localStorage.setItem(key, value);
            return { success: true };
        } catch (e) {
            const error = e;
            if (window.ErrorHandler) {
                window.ErrorHandler.log('StorageAPI.set', error, key);
            }
            if (error.name === 'QuotaExceededError') {
                // Speicher voll
                window.showToast?.(
                    '💾 Speicher voll! Versuche Fallback zu IndexedDB...',
                    'warning'
                );
                return { success: false, error: 'QUOTA_EXCEEDED', original: error };
            } else if (error.name === 'SecurityError') {
                // Private Browsing
                window.showToast?.('⚠️ Speicher nicht verfügbar (Private Browsing?)', 'error');
                return { success: false, error: 'SECURITY_ERROR', original: error };
            } else {
                // Andere Fehler
                window.showToast?.('❌ Speichern fehlgeschlagen', 'error');
                return { success: false, error: 'UNKNOWN', original: error };
            }
        }
    },
    // Wie set() — gleiche Ergebnisform, gleiches Fehlerlog —, aber OHNE Toast
    // (Code-Review 2026-09-21, R05/R10): fuer Aufrufer, die einen Quota-Fehler selbst
    // behandeln (Backup-Liste: verdraengen und erneut versuchen). Mit set() meldete jeder
    // Versuch "Speicher voll! Versuche Fallback zu IndexedDB...".
    setQuiet(key, value) {
        try {
            localStorage.setItem(key, value);
            return { success: true };
        } catch (e) {
            const error = e;
            if (window.ErrorHandler) {
                window.ErrorHandler.log('StorageAPI.setQuiet', error, key);
            }
            if (error.name === 'QuotaExceededError') {
                return { success: false, error: 'QUOTA_EXCEEDED', original: error };
            }
            if (error.name === 'SecurityError') {
                return { success: false, error: 'SECURITY_ERROR', original: error };
            }
            return { success: false, error: 'UNKNOWN', original: error };
        }
    },
    // Sicheres Löschen aus localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return { success: true };
        } catch (e) {
            const error = e;
            if (window.ErrorHandler) {
                window.ErrorHandler.log('StorageAPI.remove', error, key);
            }
            return { success: false, error: error.message };
        }
    },
    // Prüfe ob localStorage verfügbar ist
    isAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    },
    // Hole verfügbaren Speicherplatz (Schätzung)
    getStorageInfo() {
        try {
            let totalSize = 0;
            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }
            // localStorage Limit ist typischerweise 5-10 MB
            const estimatedLimit = 5 * 1024 * 1024; // 5 MB in Bytes
            return {
                usedBytes: totalSize,
                usedMB: (totalSize / (1024 * 1024)).toFixed(2),
                estimatedLimitMB: (estimatedLimit / (1024 * 1024)).toFixed(0),
                percentUsed: ((totalSize / estimatedLimit) * 100).toFixed(1)
            };
        } catch {
            return null;
        }
    },
    // JSON-spezifische Hilfsmethoden
    getJSON(key, fallback = null) {
        const value = this.get(key, null);
        if (value === null) return fallback;
        try {
            return JSON.parse(value);
        } catch (e) {
            const error = e;
            if (window.ErrorHandler) {
                window.ErrorHandler.log('StorageAPI.getJSON', error, key);
            }
            return fallback;
        }
    },
    setJSON(key, obj) {
        try {
            const jsonString = JSON.stringify(obj);
            return this.set(key, jsonString);
        } catch (e) {
            const error = e;
            if (window.ErrorHandler) {
                window.ErrorHandler.log('StorageAPI.setJSON', error, key);
            }
            return { success: false, error: 'JSON_ERROR', original: error };
        }
    },
    // Prüfe ob ein Key existiert
    has(key) {
        try {
            return localStorage.getItem(key) !== null;
        } catch (e) {
            const error = e;
            if (window.ErrorHandler) {
                window.ErrorHandler.log('StorageAPI.has', error, key);
            }
            return false;
        }
    },
    // Lösche alle Keys (mit Bestätigung)
    clear() {
        try {
            localStorage.clear();
            return { success: true };
        } catch (e) {
            const error = e;
            if (window.ErrorHandler) {
                window.ErrorHandler.log('StorageAPI.clear', error);
            }
            return { success: false, error: error.message };
        }
    }
};
// ============================================================
// [DATENGRENZE:ANFANG] — zeichengleich in utils/basic.js und utils/testable-utils.js
// (tests/unit/sanitizer-parity.test.js vergleicht den Block; der Vertrag beider Kopien steht
// in tests/unit/datengrenze.test.js)
// ============================================================
// SICHERE WERTE AUS DATEN — Vertrag SENKEN R2/R3/R4, docs/bugfixes.md
// Keine dieser Hilfen ist ein Kodierer: Text- und Attributausgabe laeuft weiter durch esc().
// ============================================================
/**
 * R3: Link aus Daten -> derselbe Link oder ''. Erlaubt sind nur http:, https:, mailto:.
 * Geprueft wird das Schema so, wie der Browser es liest: er entfernt fuehrende Leer- und
 * Steuerzeichen (U+0000 bis U+0020), streicht Tabulator und Zeilenumbruch auch IM Text und
 * ignoriert Gross/Klein — "\tjava\nScRiPt:" ist fuer ihn javascript:. Darum eine
 * Erlaubnisliste statt einer Sperrliste, verankert am Anfang. Ein erlaubter Link kommt
 * unveraendert zurueck; im Attribut gehoert er zusaetzlich in esc() (er laesst `"` stehen).
 * @param {*} url - Wert aus Daten
 * @returns {string} der Link oder ''
 */
function sichererLink(url) {
    if (typeof url !== 'string') return '';
    let start = 0;
    while (start < url.length && url.charCodeAt(start) <= 0x20) start++;
    const schema = url.slice(start).replace(/[\t\n\r]/g, '');
    return /^(?:https?|mailto):/i.test(schema) ? url : '';
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
/** R4: Schluessel, die aus Daten nie uebernommen werden (Zuweisung setzt sonst den Prototyp). */
const DATENGRENZE_VERBOTEN = Object.freeze(['__proto__', 'constructor', 'prototype']);
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
    'initiative.combatants[].ac',
    'initiative.combatants[].xp',
    'initiative.combatants[].effects[].id',
    'initiative.combatants[].effects[].duration',
    'initiative.combatants[].deathSaves.successes',
    'initiative.combatants[].deathSaves.failures',
    'initiative.combatants[].concentration.lastDC',
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
 * Wert eines Zahlenfelds -> Zahl, unveraendert oder `undefined` (= verwerfen). Unveraendert
 * bleiben Zahl, `null` (z. B. unbegrenzter Bestand, kein Verweis), Wahrheitswert und der
 * leere Text — keiner davon traegt Markup. Zahl als Text wird umgewandelt, nicht verworfen.
 * Alles andere (Markup, Objekt, Liste — eine Liste wird im Template zu ihrem Text) faellt weg.
 */
function datengrenzeZahlwert(wert) {
    if (wert === null || wert === '' || typeof wert === 'number' || typeof wert === 'boolean') {
        return wert;
    }
    if (typeof wert === 'string') {
        const text = wert.trim();
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
/** Entfernt __proto__/constructor/prototype als eigene Schluessel in jeder Tiefe (iterativ). */
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
        for (const schluessel of Object.keys(knoten)) offen.push(knoten[schluessel]);
    }
}
/**
 * R4: gemeinsame Datengrenze aller Wege nach D (Kampagnen-Import, Backup lokal und aus dem
 * Ordner, Migrations-Import, Start/Neuladen ueber load()). Entfernt __proto__/constructor/
 * prototype in jeder Tiefe und zwingt die Felder aus DATENGRENZE_ZAHLENFELDER auf Zahl (siehe
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
// Auch als window-Eigenschaft: fuer Aufrufer anderer Module und Werkbaenke mit eigenem
// window-Objekt. Heute ruft nur die Datengrenze von aussen (Kampagnen-Import, Backup,
// Migration, load()); sichererLink/sichereFarbe/sichereKlasse sind fuer die Ausgabestellen
// (R2/R3) bestimmt. Ohne Verwendung in dieser Datei meldete no-unused-vars jede der vier
// Deklarationen und hoebe den Lint-Pin.
window.sichererLink = sichererLink;
window.sichereFarbe = sichereFarbe;
window.sichereKlasse = sichereKlasse;
window.bereinigeDatengrenze = bereinigeDatengrenze;
