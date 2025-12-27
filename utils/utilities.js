// [SECTION:UTILITIES]
// CORE UTILITIES - @utils @helpers @core
// ============================================================

/**
 * DOM-Element-Cache für häufig verwendete Elemente
 * Reduziert DOM-Abfragen bei wiederholtem Zugriff
 * @type {Map<string, HTMLElement|null>}
 */
const domCache = new Map();

/**
 * Gecachte DOM-Element-Abfrage
 * @param {string} id - Element-ID
 * @returns {HTMLElement|null} Gecachtes Element oder null
 */
function $c(id) {
    if (!domCache.has(id)) {
        const el = $(id);
        if (el) domCache.set(id, el);
        return el;
    }
    return domCache.get(id);
}

/**
 * Leert den DOM-Cache
 * Nützlich nach dynamischen DOM-Änderungen
 * @param {string} [id] - Spezifische ID zum Entfernen, oder alle wenn nicht angegeben
 */
function clearDomCache(id) {
    if (id) {
        domCache.delete(id);
    } else {
        domCache.clear();
    }
}

/**
 * Debounce - Verzögert Ausführung bis keine weiteren Aufrufe mehr kommen
 * @param {Function} fn - Zu verzögernde Funktion
 * @param {number} [delay=300] - Verzögerung in Millisekunden
 * @returns {Function} Debounced Funktion
 * @example
 * const debouncedSearch = debounce(search, 300);
 * input.addEventListener('input', debouncedSearch);
 */
function debounce(fn, delay = APP_CONFIG.DEBOUNCE_DELAY) {
    let timeoutId = null;
    return function debounced(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Throttle - Begrenzt Ausführung auf einmal pro Zeitintervall
 * Verbesserte Version: Speichert den letzten Aufruf und führt ihn nach dem Intervall aus
 * @param {Function} fn - Zu drosselnde Funktion
 * @param {number} [limit=100] - Mindestabstand zwischen Aufrufen in ms
 * @returns {Function} Throttled Funktion
 * @example
 * const throttledScroll = throttle(onScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
function throttle(fn, limit = APP_CONFIG.THROTTLE_DELAY) {
    let inThrottle = false;
    let lastArgs = null;
    let lastThis = null;
    
    return function throttled(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
                // Führe den letzten gepufferten Aufruf aus
                if (lastArgs) {
                    fn.apply(lastThis, lastArgs);
                    lastArgs = null;
                    lastThis = null;
                }
            }, limit);
        } else {
            // Speichere den letzten Aufruf für später
            lastArgs = args;
            lastThis = this;
        }
    };
}

/**
 * Memoization für teure Berechnungen mit Cache-Limit
 * @param {Function} fn - Zu cachende Funktion
 * @param {number} [maxSize=100] - Maximale Anzahl gecachter Ergebnisse
 * @returns {Function} Memoized Funktion
 * @example
 * const expensiveCalc = memoize((n) => fibonacci(n), 50);
 */
function memoize(fn, maxSize = 100) {
    const cache = new Map();
    
    return function memoized(...args) {
        const key = JSON.stringify(args);
        
        if (cache.has(key)) {
            return cache.get(key);
        }
        
        const result = fn.apply(this, args);
        
        // Cache-Größe begrenzen (FIFO)
        if (cache.size >= maxSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }
        
        cache.set(key, result);
        return result;
    };
}

/**
 * Teilt ein Array in Chunks auf
 * @param {Array} array - Zu teilendes Array
 * @param {number} size - Größe jedes Chunks
 * @returns {Array[]} Array von Chunks
 * @example
 * chunkArray([1,2,3,4,5], 2) // [[1,2], [3,4], [5]]
 */
function chunkArray(array, size) {
    if (!Array.isArray(array) || size < 1) return [array];
    
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * XSS-sichere HTML-Sanitization für Rich-Text-Felder
 * Entfernt gefährliche Tags und Event-Handler
 * @param {string} html - Zu bereinigendes HTML
 * @returns {string} Bereinigtes HTML
 */
function sanitizeHtml(html) {
    if (!html) return '';
    
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Entferne gefährliche Tags
    const dangerous = div.querySelectorAll(
        'script, iframe, object, embed, form, input, link, meta, style, base, svg'
    );
    dangerous.forEach(el => el.remove());
    
    // Entferne gefährliche Attribute
    div.querySelectorAll('*').forEach(el => {
        [...el.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            const value = attr.value.toLowerCase();
            
            if (name.startsWith('on') || 
                (name === 'href' && value.includes('javascript:')) ||
                (name === 'src' && value.includes('javascript:')) ||
                name === 'srcdoc' ||
                (name === 'data' && el.tagName === 'OBJECT')) {
                el.removeAttribute(attr.name);
            }
        });
    });
    
    return div.innerHTML;
}

/**
 * Error Boundary Wrapper für kritische Funktionen
 * Fängt Fehler ab und zeigt eine Toast-Benachrichtigung
 * Unterstützt sowohl synchrone als auch asynchrone Funktionen
 * @param {Function} fn - Zu wrappende Funktion
 * @param {string} [context='Operation'] - Kontext für Fehlermeldung
 * @returns {Function} Gewrappte Funktion mit Error-Handling
 * @example
 * const safeDelete = withErrorBoundary(deleteItem, 'Löschen');
 */
function withErrorBoundary(fn, context = 'Operation') {
    return function errorBoundary(...args) {
        try {
            const result = fn.apply(this, args);
            
            // Promise-Handling für async Funktionen
            if (result instanceof Promise) {
                return result.catch(error => {
                    console.error(`[Error] ${context}:`, error);
                    showToast(`❌ Fehler: ${context}`, 'error');
                    return null;
                });
            }
            
            return result;
        } catch (error) {
            console.error(`[Error] ${context}:`, error);
            showToast(`❌ Fehler: ${context}`, 'error');
            return null;
        }
    };
}

/**
 * Generiert eine eindeutige ID für einen Entity-Typ
 * @param {string} type - Entity-Typ (characters, npcs, quests, etc.)
 * @returns {number} Neue eindeutige ID
 */
function nextId(type) {
    if (!D._nextId) D._nextId = {};
    
    if (!D._nextId[type]) {
        const items = D[type] || [];
        const maxId = items.length > 0 
            ? Math.max(...items.map(i => i.id || 0)) 
            : 0;
        D._nextId[type] = maxId + 1;
    }
    
    return D._nextId[type]++;
}

/**
 * Formatiert ein Datum für die deutsche Anzeige
 * @param {string|Date|number} date - Datum (ISO-String, Date-Objekt oder Timestamp)
 * @param {Object} [options] - Intl.DateTimeFormat Optionen
 * @returns {string} Formatiertes Datum
 */
function formatDate(date, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
    try {
        return new Date(date).toLocaleDateString('de-DE', options);
    } catch {
        return String(date);
    }
}

/**
 * Zeigt eine Toast-Benachrichtigung an
 * @param {string} [msg='✓ Gespeichert'] - Nachricht
 * @param {'success'|'error'|'warning'|'info'} [type='success'] - Nachrichtentyp
 * @param {number} [duration] - Anzeigedauer in ms (Standard: APP_CONFIG.TOAST_DURATION)
 */
function showToast(msg = '✓ Gespeichert', type = 'success', duration = APP_CONFIG.TOAST_DURATION) {
    const t = $('toast');
    if (!t) return;
    
    t.textContent = msg;
    t.className = 'toast show';
    
    // Farbe basierend auf Typ
    const colors = {
        success: '',
        error: 'var(--red)',
        warning: 'var(--yellow)',
        info: 'var(--cyan)'
    };
    t.style.background = colors[type] || '';
    
    setTimeout(() => t.classList.remove('show'), duration);
}

/**
 * Prüft ob ein Wert leer ist
 * @param {*} value - Zu prüfender Wert
 * @returns {boolean} True wenn null, undefined, leerer String, leeres Array oder leeres Objekt
 * @utility Verfügbar für zukünftige Nutzung
 */
function isEmpty(value) {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Erstellt eine tiefe Kopie eines Objekts
 * @param {*} obj - Zu klonendes Objekt
 * @returns {*} Tiefe Kopie des Objekts
 * @utility Verfügbar für zukünftige Nutzung
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    
    // Nutze structuredClone wenn verfügbar (moderne Browser)
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(obj);
        } catch {
            // Fallback für nicht-klonbare Objekte
        }
    }
    
    // JSON-Fallback
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Berechnet den D&D-Modifikator für einen Attributwert
 * @param {number} score - Attributwert (1-30)
 * @returns {number} Modifikator (z.B. 10 → 0, 14 → 2, 8 → -1)
 */
function getAttrMod(score) {
    return Math.floor((score - 10) / 2);
}

/**
 * Formatiert einen Modifikator mit Vorzeichen
 * @param {number} mod - Modifikator
 * @returns {string} Formatierter String (z.B. "+2", "-1", "+0")
 * @utility Verfügbar für zukünftige Nutzung
 */
function formatMod(mod) {
    return mod >= 0 ? `+${mod}` : String(mod);
}

/**
 * Berechnet den Übungsbonus für eine Charakterstufe (D&D 5E)
 * @param {number} level - Charakterstufe (1-20)
 * @returns {number} Übungsbonus (2-6)
 * @utility Verfügbar für zukünftige Nutzung
 */
function getProfBonus(level) {
    return Math.ceil(level / 4) + 1;
}

/**
 * Generiert eine einfache UUID v4
 * @returns {string} UUID v4
 * @utility Verfügbar für zukünftige Nutzung (nextId() wird für Entity-IDs verwendet)
 */
function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback für ältere Browser
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Wartet eine bestimmte Zeit (für async/await)
 * @param {number} ms - Wartezeit in Millisekunden
 * @returns {Promise<void>}
 * @utility Verfügbar für zukünftige Nutzung
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Klemmt einen Wert zwischen min und max
 * @param {number} value - Wert
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number} Geklemmter Wert
 * @utility Verfügbar für zukünftige Nutzung
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}