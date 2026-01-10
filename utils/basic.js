// [SECTION:UTILITIES_BASIC]
// ============================================================
// BASIC UTILITIES - @util @helper @dom @escape @sanitize
// Grundlegende DOM- und String-Funktionen
// ============================================================
// DOM-Selektor mit Debug-Warnung
function $(id) {
    const el = document.getElementById(id);
    if (!el && window.APP_CONFIG?.DEBUG_MODE) {
        console.warn(`[DOM] Element not found: #${id}`, new Error().stack);
    }
    return el;
}
// QuerySelectorAll-Wrapper
function $$(sel) {
    return document.querySelectorAll(sel);
}
// HTML-Entity-Escaping für XSS-Schutz
function esc(s) {
    return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') : '';
}
// HTML-Tags entfernen für Plain-Text-Anzeige
function stripHtml(s) {
    return s ? String(s).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : '';
}
// Search-Helper-Funktionen
function clearSearch(inputId, renderFn) {
    const input = $(inputId);
    if (input instanceof HTMLInputElement) {
        input.value = '';
        updateSearchClear(input);
        if (typeof renderFn === 'function')
            renderFn();
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
        'face': true, // für <font face="..."> (execCommand fontName)
        'size': true // für <font size="..."> (execCommand fontSize)
    };
    // Gefährliche Protokolle (case-insensitive)
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:', 'blob:'];
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
                if (attrName.startsWith('on'))
                    continue;
                // Style-Attribute filtern
                if (attrName === 'style' && Array.isArray(allowedAttributes.style)) {
                    const styleList = allowedAttributes.style;
                    const styles = attr.value.split(';').filter(s => {
                        const prop = s.split(':')[0]?.trim().toLowerCase();
                        return styleList.includes(prop);
                    }).join(';');
                    if (styles)
                        cleanElement.setAttribute('style', styles);
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
                    if (isSafe && (hrefLower.startsWith('http://') || hrefLower.startsWith('https://') || href.startsWith('/') || href.startsWith('#') || href.startsWith('./'))) {
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
                else if ((attrName === 'colspan' || attrName === 'rowspan') && allowedAttributes[attrName]) {
                    const val = parseInt(attr.value);
                    if (!isNaN(val) && val > 0 && val < 100) {
                        cleanElement.setAttribute(attrName, val.toString());
                    }
                }
                // face/size für font-Tags (execCommand fontName/fontSize)
                else if ((attrName === 'face' || attrName === 'size') && allowedAttributes[attrName] && tagName === 'font') {
                    cleanElement.setAttribute(attrName, attr.value);
                }
                // Andere Attribute blockieren (src, etc.)
            }
            // Kinder rekursiv bereinigen
            for (const child of element.childNodes) {
                const cleanChild = cleanNode(child);
                if (cleanChild)
                    cleanElement.appendChild(cleanChild);
            }
            return cleanElement;
        }
        return null;
    }
    // Alle Kinder bereinigen
    const result = document.createElement('div');
    for (const child of doc.body.childNodes) {
        const cleanChild = cleanNode(child);
        if (cleanChild)
            result.appendChild(cleanChild);
    }
    return result.innerHTML;
}
// Sichere localStorage-Wrapper-Funktionen
const StorageAPI = {
    // Sicheres Lesen aus localStorage
    get(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : fallback;
        }
        catch (e) {
            const error = e;
            console.warn(`[Storage] Fehler beim Lesen von '${key}':`, error.message);
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
        }
        catch (e) {
            const error = e;
            console.error(`[Storage] Fehler beim Schreiben von '${key}':`, error.message);
            if (error.name === 'QuotaExceededError') {
                // Speicher voll
                window.showToast?.('💾 Speicher voll! Versuche Fallback zu IndexedDB...', 'warning');
                return { success: false, error: 'QUOTA_EXCEEDED', original: error };
            }
            else if (error.name === 'SecurityError') {
                // Private Browsing
                window.showToast?.('⚠️ Speicher nicht verfügbar (Private Browsing?)', 'error');
                return { success: false, error: 'SECURITY_ERROR', original: error };
            }
            else {
                // Andere Fehler
                window.showToast?.('❌ Speichern fehlgeschlagen', 'error');
                return { success: false, error: 'UNKNOWN', original: error };
            }
        }
    },
    // Sicheres Löschen aus localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return { success: true };
        }
        catch (e) {
            const error = e;
            console.warn(`[Storage] Fehler beim Löschen von '${key}':`, error.message);
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
        }
        catch {
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
        }
        catch {
            return null;
        }
    },
    // JSON-spezifische Hilfsmethoden
    getJSON(key, fallback = null) {
        const value = this.get(key, null);
        if (value === null)
            return fallback;
        try {
            return JSON.parse(value);
        }
        catch (e) {
            const error = e;
            console.warn(`[Storage] JSON Parse Fehler für '${key}':`, error.message);
            return fallback;
        }
    },
    setJSON(key, obj) {
        try {
            const jsonString = JSON.stringify(obj);
            return this.set(key, jsonString);
        }
        catch (e) {
            const error = e;
            console.error(`[Storage] JSON Stringify Fehler für '${key}':`, error.message);
            return { success: false, error: 'JSON_ERROR', original: error };
        }
    },
    // Prüfe ob ein Key existiert
    has(key) {
        try {
            return localStorage.getItem(key) !== null;
        }
        catch (e) {
            const error = e;
            console.warn(`[Storage] Fehler bei has('${key}'):`, error.message);
            return false;
        }
    },
    // Lösche alle Keys (mit Bestätigung)
    clear() {
        try {
            localStorage.clear();
            return { success: true };
        }
        catch (e) {
            const error = e;
            console.error('[Storage] Fehler beim Löschen aller Daten:', error.message);
            return { success: false, error: error.message };
        }
    }
};
// ============================================================
