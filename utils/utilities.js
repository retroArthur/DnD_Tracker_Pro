// [SECTION:UTILITIES]
// CORE UTILITIES - @utils @helpers @core
// ============================================================
// Polyfill for structuredClone (for older browsers)
if (typeof structuredClone === 'undefined') {
    window.structuredClone = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };
}
/**
 * DOM-Element-Cache für häufig verwendete Elemente
 * Reduziert DOM-Abfragen bei wiederholtem Zugriff
 */
const domCache = new Map();
/**
 * Gecachte DOM-Element-Abfrage
 * @param id - Element-ID
 * @returns Gecachtes Element oder null
 */
function $c(id) {
    if (!domCache.has(id)) {
        const el = $(id);
        if (el)
            domCache.set(id, el);
        return el;
    }
    return domCache.get(id) || null;
}
/**
 * Leert den DOM-Cache
 * Nützlich nach dynamischen DOM-Änderungen
 * @param id - Spezifische ID zum Entfernen, oder alle wenn nicht angegeben
 */
function clearDomCache(id) {
    if (id) {
        domCache.delete(id);
    }
    else {
        domCache.clear();
    }
}
/**
 * Debounce - Verzögert Ausführung bis keine weiteren Aufrufe mehr kommen
 * @param fn - Zu verzögernde Funktion
 * @param delay - Verzögerung in Millisekunden
 * @returns Debounced Funktion
 * @example
 * const debouncedSearch = debounce(search, 300);
 * input.addEventListener('input', debouncedSearch);
 */
function debounce(fn, delay = window.APP_CONFIG?.DEBOUNCE_DELAY || 300) {
    let timeoutId = null;
    return function debounced(...args) {
        if (timeoutId)
            clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
/**
 * Throttle - Begrenzt Ausführung auf einmal pro Zeitintervall
 * Verbesserte Version: Speichert den letzten Aufruf und führt ihn nach dem Intervall aus
 * @param fn - Zu drosselnde Funktion
 * @param limit - Mindestabstand zwischen Aufrufen in ms
 * @returns Throttled Funktion
 * @example
 * const throttledScroll = throttle(onScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
function throttle(fn, limit = window.APP_CONFIG?.THROTTLE_DELAY || 100) {
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
        }
        else {
            // Speichere den letzten Aufruf für später
            lastArgs = args;
            lastThis = this;
        }
    };
}
/**
 * Memoization für teure Berechnungen mit Cache-Limit
 * @param fn - Zu cachende Funktion
 * @param maxSize - Maximale Anzahl gecachter Ergebnisse
 * @returns Memoized Funktion
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
            if (firstKey !== undefined) {
                cache.delete(firstKey);
            }
        }
        cache.set(key, result);
        return result;
    };
}
/**
 * Teilt ein Array in Chunks auf
 * @param array - Zu teilendes Array
 * @param size - Größe jedes Chunks
 * @returns Array von Chunks
 * @example
 * chunkArray([1,2,3,4,5], 2) // [[1,2], [3,4], [5]]
 */
function chunkArray(array, size) {
    if (!Array.isArray(array) || size < 1)
        return [array];
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
/**
 * Parst eine Entity-ID sicher zu einer Nummer
 * Zentrale Utility-Funktion für konsistente ID-Behandlung in allen Modulen
 * @param id - ID als Nummer oder String
 * @returns Numerische ID oder null wenn ungültig
 * @example
 * parseEntityId(42)      // 42
 * parseEntityId('42')    // 42
 * parseEntityId('abc')   // null
 * parseEntityId(null)    // null
 */
function parseEntityId(id) {
    if (id === null || id === undefined)
        return null;
    const numId = typeof id === 'number' ? id : parseInt(id, 10);
    return isNaN(numId) ? null : numId;
}
/**
 * Error Boundary Wrapper für kritische Funktionen
 * Fängt Fehler ab und zeigt eine Toast-Benachrichtigung
 * Unterstützt sowohl synchrone als auch asynchrone Funktionen
 * @param fn - Zu wrappende Funktion
 * @param context - Kontext für Fehlermeldung
 * @returns Gewrappte Funktion mit Error-Handling
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
                    window.ErrorHandler?.log('safeExecute', error, context);
                    showToast(`❌ Fehler: ${context}`, 'error');
                    return null;
                });
            }
            return result;
        }
        catch (error) {
            window.ErrorHandler?.log('safeExecute', error, context);
            showToast(`❌ Fehler: ${context}`, 'error');
            return null;
        }
    };
}
/**
 * Generiert eine eindeutige ID für einen Entity-Typ
 * @param type - Entity-Typ (characters, npcs, quests, etc.)
 * @returns Neue eindeutige ID
 */
function nextId(type) {
    const D = window.D;
    if (!D._nextId)
        D._nextId = {};
    if (!D._nextId[type]) {
        const items = D[type] || [];
        const maxId = items.length > 0
            ? Math.max(...items.map((i) => i.id || 0))
            : 0;
        D._nextId[type] = maxId + 1;
    }
    return D._nextId[type]++;
}
/**
 * Validates and repairs D._nextId for all entity types
 * Ensures _nextId[type] is always greater than max ID in D[type]
 * @returns Object with validation status and repairs performed
 */
function validateAndRepairNextId() {
    const D = window.D;
    if (!D._nextId)
        D._nextId = {};
    const repairs = [];
    const entityTypes = [
        'characters', 'npcs', 'locations', 'quests', 'encounters',
        'spells', 'loot', 'items', 'wiki', 'sessionNotes', 'randomTables'
    ];
    entityTypes.forEach(type => {
        if (!Array.isArray(D[type]))
            return;
        // Calculate correct next ID
        const maxId = D[type].length > 0
            ? Math.max(...D[type].map((i) => i.id || 0))
            : 0;
        const correctNextId = maxId + 1;
        // Check if current _nextId is valid
        if (!D._nextId[type] || D._nextId[type] <= maxId) {
            repairs.push(`${type}: _nextId was ${D._nextId[type] || 'undefined'}, ` +
                `corrected to ${correctNextId} (max ID in array: ${maxId})`);
            D._nextId[type] = correctNextId;
        }
    });
    if (repairs.length > 0 && window.APP_CONFIG?.DEBUG_MODE) {
        window.ErrorHandler?.log('validateAndRepairNextId', new Error('ID repairs performed'), repairs.join('; '));
    }
    return { valid: repairs.length === 0, repairs };
}
/**
 * Formatiert ein Datum für die deutsche Anzeige
 * @param date - Datum (ISO-String, Date-Objekt oder Timestamp)
 * @param options - Intl.DateTimeFormat Optionen
 * @returns Formatiertes Datum
 */
function formatDate(date, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
    try {
        return new Date(date).toLocaleDateString('de-DE', options);
    }
    catch {
        return String(date);
    }
}
/**
 * Zeigt einen Event-Log-Eintrag an (ersetzt Toast)
 * @param msg - Nachricht
 * @param type - Nachrichtentyp
 * @param duration - Anzeigedauer in ms (Standard: APP_CONFIG.TOAST_DURATION)
 */
function showToast(msg = '✓ Gespeichert', type = 'success', duration = window.APP_CONFIG?.TOAST_DURATION || 2000) {
    const log = $('event-log');
    if (!log)
        return;
    // Icons für verschiedene Typen
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    // Zeitstempel formatieren
    const now = new Date();
    const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    // Entry erstellen
    const entry = document.createElement('div');
    entry.className = `event-log-entry ${type}`;
    entry.setAttribute('role', 'alert');
    entry.setAttribute('aria-live', 'polite');
    // Use esc function (needs to be available globally or imported)
    const escMsg = window.esc ? window.esc(msg) : msg;
    entry.innerHTML = `
        <span class="event-log-icon">${icons[type] || icons.success}</span>
        <div class="event-log-content">
            <div class="event-log-message">${escMsg}</div>
            <div class="event-log-time">${timeStr}</div>
        </div>
    `;
    // Nach Header einfügen (neueste oben)
    const header = log.querySelector('.event-log-header');
    if (header && header.nextSibling) {
        log.insertBefore(entry, header.nextSibling);
    }
    else if (header) {
        log.appendChild(entry);
    }
    else {
        log.insertBefore(entry, log.firstChild);
    }
    // Im persistenten Modus: mehr Einträge behalten
    const isPersistent = log.classList.contains('persistent');
    const maxEntries = isPersistent ? 50 : 5;
    // Nur event-log-entry Elemente zählen (als Array für sichere Iteration)
    const entries = Array.from(log.querySelectorAll('.event-log-entry'));
    while (entries.length > maxEntries) {
        entries.pop()?.remove();
    }
    // Nur ausblenden wenn nicht persistent
    if (!isPersistent) {
        setTimeout(() => {
            entry.classList.add('fade-out');
            setTimeout(() => entry.remove(), 400);
        }, duration);
    }
    // Backward compatibility: Update legacy #toast element for E2E tests
    let toast = $('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:10000;padding:12px 24px;border-radius:8px;font-family:sans-serif;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    // Set background color based on type
    const bgColors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    toast.style.backgroundColor = bgColors[type] || bgColors.success;
    toast.style.color = '#ffffff';
    if (!isPersistent) {
        setTimeout(() => {
            if (toast)
                toast.style.display = 'none';
        }, duration);
    }
}
/**
 * Toggle Event-Log persistent mode
 */
function toggleEventLog() {
    const log = $('event-log');
    if (!log)
        return;
    log.classList.toggle('persistent');
}
/**
 * Clear all event log entries
 */
function clearEventLog() {
    const log = $('event-log');
    if (!log)
        return;
    const entries = log.querySelectorAll('.event-log-entry');
    entries.forEach(e => e.remove());
}
/**
 * Prüft ob ein Wert leer ist
 * @param value - Zu prüfender Wert
 * @returns True wenn null, undefined, leerer String, leeres Array oder leeres Objekt
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
 * Erstellt eine tiefe Kopie eines Objekts
 * @param obj - Zu klonendes Objekt
 * @returns Tiefe Kopie des Objekts
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    // Nutze structuredClone wenn verfügbar (moderne Browser)
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(obj);
        }
        catch {
            // Fallback für nicht-klonbare Objekte
        }
    }
    // JSON-Fallback
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Berechnet den D&D-Modifikator für einen Attributwert
 * @param score - Attributwert (1-30)
 * @returns Modifikator (z.B. 10 → 0, 14 → 2, 8 → -1)
 */
function getAttrMod(score) {
    return Math.floor((score - 10) / 2);
}
/**
 * Formatiert einen Modifikator mit Vorzeichen
 * @param mod - Modifikator
 * @returns Formatierter String (z.B. "+2", "-1", "+0")
 */
function formatMod(mod) {
    return mod >= 0 ? `+${mod}` : String(mod);
}
/**
 * Berechnet den Übungsbonus für eine Charakterstufe (D&D 5E)
 * @param level - Charakterstufe (1-20)
 * @returns Übungsbonus (2-6)
 */
function getProfBonus(level) {
    return Math.ceil(level / 4) + 1;
}
// getProficiencyBonus removed - use utils/game-rules.js instead
/**
 * Generiert eine einfache UUID v4
 * @returns UUID v4
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
 * @param ms - Wartezeit in Millisekunden
 * @returns Promise that resolves after the delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
