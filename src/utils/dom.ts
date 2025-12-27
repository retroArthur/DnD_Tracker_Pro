/**
 * DOM Utilities (TypeScript)
 * Grundlegende DOM-Hilfsfunktionen
 * @module utils/dom
 * @version 2.7.0
 */

// ============================================================
// TYPES
// ============================================================

export interface StorageResult {
    success: boolean;
    error?: string;
    original?: Error;
}

export interface StorageInfo {
    usedBytes: number;
    usedMB: string;
    estimatedLimitMB: string;
    percentUsed: string;
}

// ============================================================
// DOM SELECTORS
// ============================================================

/**
 * Kurzform für getElementById
 * @param id - Element-ID
 * @returns Element oder null
 */
export function $(id: string): HTMLElement | null {
    return document.getElementById(id);
}

/**
 * Kurzform für querySelectorAll
 * @param selector - CSS-Selector
 * @returns NodeList
 */
export function $$(selector: string): NodeListOf<Element> {
    return document.querySelectorAll(selector);
}

// ============================================================
// HTML ESCAPING & SANITIZATION
// ============================================================

/**
 * Escaped HTML-Sonderzeichen für sichere Ausgabe
 * @param s - Zu escapender Wert
 * @returns Escapeter String
 */
export function esc(s: unknown): string {
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

/**
 * Entfernt HTML-Tags für Plain-Text
 * @param s - HTML-String
 * @returns Plain-Text
 */
export function stripHtml(s: string | null | undefined): string {
    if (!s) return '';
    return String(s)
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}

/**
 * Sichere HTML-Sanitization
 * Erlaubt nur sichere Tags und Attribute
 * @param html - Zu bereinigendes HTML
 * @returns Bereinigtes HTML
 */
export function sanitizeHTML(html: string | null | undefined): string {
    if (!html) return '';

    const temp = document.createElement('div');
    temp.innerHTML = html;

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
        'a'
    ];

    const allowedStyleProps = [
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
    ];

    function cleanNode(node: Node): Node | null {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.cloneNode(true);
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            const tagName = el.tagName.toLowerCase();

            if (!allowedTags.includes(tagName)) {
                return document.createTextNode(el.textContent || '');
            }

            const cleanElement = document.createElement(tagName);

            for (const attr of Array.from(el.attributes)) {
                const attrName = attr.name.toLowerCase();

                // Block event handlers
                if (attrName.startsWith('on')) continue;

                if (attrName === 'style') {
                    const styles = attr.value
                        .split(';')
                        .filter(s => {
                            const prop = s.split(':')[0]?.trim().toLowerCase();
                            return allowedStyleProps.includes(prop);
                        })
                        .join(';');
                    if (styles) cleanElement.setAttribute('style', styles);
                } else if (attrName === 'class') {
                    cleanElement.setAttribute('class', attr.value);
                } else if (attrName === 'href' && tagName === 'a') {
                    const href = attr.value.trim();
                    if (!href.startsWith('javascript:') && !href.startsWith('data:')) {
                        cleanElement.setAttribute('href', href);
                        cleanElement.setAttribute('target', '_blank');
                        cleanElement.setAttribute('rel', 'noopener noreferrer');
                    }
                } else if (attrName === 'title') {
                    cleanElement.setAttribute('title', attr.value);
                } else if (attrName === 'colspan' || attrName === 'rowspan') {
                    const val = parseInt(attr.value);
                    if (!isNaN(val) && val > 0 && val < 100) {
                        cleanElement.setAttribute(attrName, String(val));
                    }
                }
            }

            for (const child of Array.from(node.childNodes)) {
                const cleanChild = cleanNode(child);
                if (cleanChild) cleanElement.appendChild(cleanChild);
            }

            return cleanElement;
        }

        return null;
    }

    const cleaned = document.createElement('div');
    for (const child of Array.from(temp.childNodes)) {
        const cleanChild = cleanNode(child);
        if (cleanChild) cleaned.appendChild(cleanChild);
    }

    return cleaned.innerHTML;
}

// ============================================================
// SEARCH HELPERS
// ============================================================

/**
 * Leert ein Suchfeld und aktualisiert den Clear-Button
 * @param inputId - Input-Element-ID
 * @param renderFn - Render-Funktion zum Aktualisieren
 */
export function clearSearch(inputId: string, renderFn?: () => void): void {
    const input = $(inputId) as HTMLInputElement | null;
    if (input) {
        input.value = '';
        updateSearchClear(input);
        if (typeof renderFn === 'function') renderFn();
    }
}

/**
 * Aktualisiert die Sichtbarkeit des Such-Clear-Buttons
 * @param input - Input-Element
 */
export function updateSearchClear(input: HTMLInputElement): void {
    const btn = input.parentElement?.querySelector('.search-clear-btn');
    if (btn) {
        btn.classList.toggle('visible', input.value.length > 0);
    }
}

// ============================================================
// STORAGE API
// ============================================================

/**
 * Sichere localStorage-Wrapper
 */
export const StorageAPI = {
    /**
     * Liest einen Wert aus localStorage
     */
    get(key: string, fallback: string | null = null): string | null {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : fallback;
        } catch (e) {
            console.warn(`[Storage] Fehler beim Lesen von '${key}':`, (e as Error).message);
            return fallback;
        }
    },

    /**
     * Schreibt einen Wert in localStorage
     */
    set(key: string, value: string): StorageResult {
        try {
            localStorage.setItem(key, value);
            return { success: true };
        } catch (e) {
            const error = e as Error;
            console.error(`[Storage] Fehler beim Schreiben von '${key}':`, error.message);

            if (error.name === 'QuotaExceededError') {
                return { success: false, error: 'QUOTA_EXCEEDED', original: error };
            } else if (error.name === 'SecurityError') {
                return { success: false, error: 'SECURITY_ERROR', original: error };
            }
            return { success: false, error: 'UNKNOWN', original: error };
        }
    },

    /**
     * Löscht einen Wert aus localStorage
     */
    remove(key: string): StorageResult {
        try {
            localStorage.removeItem(key);
            return { success: true };
        } catch (e) {
            console.warn(`[Storage] Fehler beim Löschen von '${key}':`, (e as Error).message);
            return { success: false, error: (e as Error).message };
        }
    },

    /**
     * Prüft ob localStorage verfügbar ist
     */
    isAvailable(): boolean {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Gibt Speicherplatz-Informationen zurück
     */
    getStorageInfo(): StorageInfo | null {
        try {
            let totalSize = 0;
            for (const key in localStorage) {
                if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }
            const estimatedLimit = 5 * 1024 * 1024;
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

    /**
     * Liest JSON aus localStorage
     */
    getJSON<T>(key: string, fallback: T | null = null): T | null {
        const value = this.get(key, null);
        if (value === null) return fallback;

        try {
            return JSON.parse(value) as T;
        } catch (e) {
            console.warn(`[Storage] JSON Parse Fehler für '${key}':`, (e as Error).message);
            return fallback;
        }
    },

    /**
     * Schreibt JSON in localStorage
     */
    setJSON(key: string, obj: unknown): StorageResult {
        try {
            const jsonString = JSON.stringify(obj);
            return this.set(key, jsonString);
        } catch (e) {
            console.error(`[Storage] JSON Stringify Fehler für '${key}':`, (e as Error).message);
            return { success: false, error: 'JSON_ERROR', original: e as Error };
        }
    },

    /**
     * Prüft ob ein Key existiert
     */
    has(key: string): boolean {
        try {
            return localStorage.getItem(key) !== null;
        } catch {
            return false;
        }
    },

    /**
     * Löscht alle Daten
     */
    clear(): StorageResult {
        try {
            localStorage.clear();
            return { success: true };
        } catch (e) {
            console.error('[Storage] Fehler beim Löschen aller Daten:', (e as Error).message);
            return { success: false, error: (e as Error).message };
        }
    }
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
    $,
    $$,
    esc,
    stripHtml,
    sanitizeHTML,
    clearSearch,
    updateSearchClear,
    StorageAPI
};
