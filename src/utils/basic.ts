// [SECTION:UTILITIES_BASIC]
// ============================================================
// BASIC UTILITIES - @util @helper @dom @escape @sanitize
// Grundlegende DOM- und String-Funktionen
// ============================================================

import type { AppConfig } from '@core/config';

// DOM-Selektor mit Debug-Warnung
export function $(id: string): HTMLElement | null {
    const el = document.getElementById(id);
    if (!el && (window as any).APP_CONFIG?.DEBUG_MODE) {
        console.warn(`[DOM] Element not found: #${id}`, new Error().stack);
    }
    return el;
}

// QuerySelectorAll-Wrapper
export function $$(sel: string): NodeListOf<Element> {
    return document.querySelectorAll(sel);
}

// HTML-Entity-Escaping für XSS-Schutz
export function esc(s: string | number | null | undefined): string {
    return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;') : '';
}

// HTML-Tags entfernen für Plain-Text-Anzeige
export function stripHtml(s: string | null | undefined): string {
    return s ? String(s).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : '';
}

// Search-Helper-Funktionen
export function clearSearch(inputId: string, renderFn?: () => void): void {
    const input = $(inputId);
    if (input instanceof HTMLInputElement) {
        input.value = '';
        updateSearchClear(input);
        if (typeof renderFn === 'function') renderFn();
    }
}

export function updateSearchClear(input: HTMLInputElement): void {
    const btn = input.parentElement?.querySelector('.search-clear-btn');
    if (btn) {
        btn.classList.toggle('visible', input.value.length > 0);
    }
}

// HTML-Sanitizer für Rich-Text-Content (erlaubt nur sichere Tags/Attribute)
// SICHER: Verwendet DOMParser statt innerHTML um XSS beim Parsen zu verhindern
export function sanitizeHTML(html: string): string {
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
    const allowedAttributes: Record<string, string[] | boolean> = {
        'style': ['color', 'background-color', 'background', 'font-family', 'font-size', 'font-weight', 'text-decoration', 'border', 'border-collapse', 'padding', 'margin', 'width', 'text-align', 'vertical-align'],
        'class': true,
        'href': true,
        'title': true,
        'colspan': true,
        'rowspan': true,
        'face': true,  // für <font face="..."> (execCommand fontName)
        'size': true   // für <font size="..."> (execCommand fontSize)
    };

    // Gefährliche Protokolle (case-insensitive)
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:', 'blob:'];

    // Rekursive Funktion zum Bereinigen der Nodes
    function cleanNode(node: Node): Node | null {
        // Text-Nodes sind sicher
        if (node.nodeType === Node.TEXT_NODE) {
            return node.cloneNode(true);
        }

        // Element-Nodes prüfen
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
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
                    const styleList = allowedAttributes.style as string[];
                    const styles = attr.value.split(';').filter(s => {
                        const prop = s.split(':')[0]?.trim().toLowerCase();
                        return styleList.includes(prop);
                    }).join(';');
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

// Typen für StorageAPI
interface StorageResult {
    success: boolean;
    error?: string;
    original?: Error;
}

interface StorageInfo {
    usedBytes: number;
    usedMB: string;
    estimatedLimitMB: string;
    percentUsed: string;
}

// Sichere localStorage-Wrapper-Funktionen
export const StorageAPI = {
    // Sicheres Lesen aus localStorage
    get(key: string, fallback: any = null): any {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : fallback;
        } catch (e) {
            const error = e as Error;
            console.warn(`[Storage] Fehler beim Lesen von '${key}':`, error.message);
            // Private Browsing, SecurityError, etc.
            if (error.name === 'SecurityError') {
                (window as any).showToast?.('⚠️ Speicher nicht verfügbar (Private Browsing?)', 'warning');
            }
            return fallback;
        }
    },

    // Sicheres Schreiben in localStorage
    set(key: string, value: string): StorageResult {
        try {
            localStorage.setItem(key, value);
            return { success: true };
        } catch (e) {
            const error = e as Error;
            console.error(`[Storage] Fehler beim Schreiben von '${key}':`, error.message);

            if (error.name === 'QuotaExceededError') {
                // Speicher voll
                (window as any).showToast?.('💾 Speicher voll! Versuche Fallback zu IndexedDB...', 'warning');
                return { success: false, error: 'QUOTA_EXCEEDED', original: error };
            } else if (error.name === 'SecurityError') {
                // Private Browsing
                (window as any).showToast?.('⚠️ Speicher nicht verfügbar (Private Browsing?)', 'error');
                return { success: false, error: 'SECURITY_ERROR', original: error };
            } else {
                // Andere Fehler
                (window as any).showToast?.('❌ Speichern fehlgeschlagen', 'error');
                return { success: false, error: 'UNKNOWN', original: error };
            }
        }
    },

    // Sicheres Löschen aus localStorage
    remove(key: string): StorageResult {
        try {
            localStorage.removeItem(key);
            return { success: true };
        } catch (e) {
            const error = e as Error;
            console.warn(`[Storage] Fehler beim Löschen von '${key}':`, error.message);
            return { success: false, error: error.message };
        }
    },

    // Prüfe ob localStorage verfügbar ist
    isAvailable(): boolean {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    },

    // Hole verfügbaren Speicherplatz (Schätzung)
    getStorageInfo(): StorageInfo | null {
        try {
            let totalSize = 0;
            for (let key in localStorage) {
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
        } catch (e) {
            return null;
        }
    },

    // JSON-spezifische Hilfsmethoden
    getJSON<T = any>(key: string, fallback: T | null = null): T | null {
        const value = this.get(key, null);
        if (value === null) return fallback;

        try {
            return JSON.parse(value);
        } catch (e) {
            const error = e as Error;
            console.warn(`[Storage] JSON Parse Fehler für '${key}':`, error.message);
            return fallback;
        }
    },

    setJSON(key: string, obj: any): StorageResult {
        try {
            const jsonString = JSON.stringify(obj);
            return this.set(key, jsonString);
        } catch (e) {
            const error = e as Error;
            console.error(`[Storage] JSON Stringify Fehler für '${key}':`, error.message);
            return { success: false, error: 'JSON_ERROR', original: error };
        }
    },

    // Prüfe ob ein Key existiert
    has(key: string): boolean {
        try {
            return localStorage.getItem(key) !== null;
        } catch (e) {
            const error = e as Error;
            console.warn(`[Storage] Fehler bei has('${key}'):`, error.message);
            return false;
        }
    },

    // Lösche alle Keys (mit Bestätigung)
    clear(): StorageResult {
        try {
            localStorage.clear();
            return { success: true };
        } catch (e) {
            const error = e as Error;
            console.error('[Storage] Fehler beim Löschen aller Daten:', error.message);
            return { success: false, error: error.message };
        }
    }
};

// ============================================================
