/**
 * D&D Tracker - Core Utilities (TypeScript)
 * @module utils/utilities
 * @version 2.7.0
 */

// ============================================================
// DOM UTILITIES
// ============================================================

/**
 * DOM-Element-Cache für häufig verwendete Elemente
 * Reduziert DOM-Abfragen bei wiederholtem Zugriff
 */
const domCache = new Map<string, HTMLElement | null>();

/**
 * Gecachte DOM-Element-Abfrage
 * @param id - Element-ID
 * @returns Gecachtes Element oder null
 */
export function $c(id: string): HTMLElement | null {
    if (!domCache.has(id)) {
        const el = document.getElementById(id);
        if (el) domCache.set(id, el);
        return el;
    }
    return domCache.get(id) ?? null;
}

/**
 * Leert den DOM-Cache
 * @param id - Spezifische ID zum Entfernen, oder alle wenn nicht angegeben
 */
export function clearDomCache(id?: string): void {
    if (id) {
        domCache.delete(id);
    } else {
        domCache.clear();
    }
}

// ============================================================
// TIMING UTILITIES
// ============================================================

/**
 * Debounce - Verzögert Ausführung bis keine weiteren Aufrufe mehr kommen
 * @param fn - Zu verzögernde Funktion
 * @param delay - Verzögerung in Millisekunden
 * @returns Debounced Funktion
 *
 * @example
 * const debouncedSearch = debounce(search, 300);
 * input.addEventListener('input', debouncedSearch);
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = 300
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function debounced(this: ThisParameterType<T>, ...args: Parameters<T>): void {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Throttle - Begrenzt Ausführung auf einmal pro Zeitintervall
 * @param fn - Zu drosselnde Funktion
 * @param limit - Mindestabstand zwischen Aufrufen in ms
 * @returns Throttled Funktion
 *
 * @example
 * const throttledScroll = throttle(onScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number = 100
): (...args: Parameters<T>) => void {
    let inThrottle = false;
    let lastArgs: Parameters<T> | null = null;
    let lastThis: ThisParameterType<T> | null = null;

    return function throttled(this: ThisParameterType<T>, ...args: Parameters<T>): void {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
                if (lastArgs) {
                    fn.apply(lastThis, lastArgs);
                    lastArgs = null;
                    lastThis = null;
                }
            }, limit);
        } else {
            lastArgs = args;
            lastThis = this;
        }
    };
}

// ============================================================
// MEMOIZATION
// ============================================================

/**
 * Memoization für teure Berechnungen mit Cache-Limit
 * @param fn - Zu cachende Funktion
 * @param maxSize - Maximale Anzahl gecachter Ergebnisse
 * @returns Memoized Funktion
 *
 * @example
 * const expensiveCalc = memoize((n) => fibonacci(n), 50);
 */
export function memoize<T extends (...args: any[]) => any>(fn: T, maxSize: number = 100): T {
    const cache = new Map<string, ReturnType<T>>();
    const keyOrder: string[] = [];

    return function memoized(this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key) as ReturnType<T>;
        }

        const result = fn.apply(this, args);
        cache.set(key, result);
        keyOrder.push(key);

        // LRU-Style Cache-Eviction
        if (keyOrder.length > maxSize) {
            const oldestKey = keyOrder.shift();
            if (oldestKey) {
                cache.delete(oldestKey);
            }
        }

        return result;
    } as T;
}

// ============================================================
// STRING UTILITIES
// ============================================================

/**
 * Escape HTML-Entities
 * @param str - Zu escapender String
 * @returns Escapeter String
 */
export function escapeHtml(str: string | null | undefined): string {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Strip HTML-Tags für Plain-Text
 * @param str - HTML-String
 * @returns Plain-Text ohne Tags
 */
export function stripHtml(str: string | null | undefined): string {
    if (!str) return '';
    return String(str)
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}

/**
 * Truncate string with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 * @param str - Input string
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================
// NUMBER UTILITIES
// ============================================================

/**
 * Clamp number between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Generate random integer between min and max (inclusive)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Format number with thousands separator
 * @param num - Number to format
 * @param separator - Separator character (default: '.')
 * @returns Formatted string
 */
export function formatNumber(num: number, separator: string = '.'): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

// ============================================================
// DATE UTILITIES
// ============================================================

/**
 * Format date in German format
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Format date and time
 * @param date - Date to format
 * @returns Formatted datetime string
 */
export function formatDateTime(date: Date | string | number): string {
    const d = new Date(date);
    const dateStr = formatDate(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Get relative time string
 * @param date - Date to compare
 * @returns Relative time string (e.g., "vor 5 Minuten")
 */
export function getRelativeTime(date: Date | string | number): string {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diff = now - then;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'gerade eben';
    if (minutes < 60) return `vor ${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
    if (hours < 24) return `vor ${hours} Stunde${hours !== 1 ? 'n' : ''}`;
    if (days < 7) return `vor ${days} Tag${days !== 1 ? 'en' : ''}`;

    return formatDate(date);
}

// ============================================================
// ARRAY UTILITIES
// ============================================================

/**
 * Shuffle array (Fisher-Yates)
 * @param array - Array to shuffle
 * @returns New shuffled array
 */
export function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Group array by key
 * @param array - Array to group
 * @param keyFn - Function to extract key
 * @returns Grouped object
 */
export function groupBy<T, K extends string | number>(
    array: T[],
    keyFn: (item: T) => K
): Record<K, T[]> {
    return array.reduce(
        (result, item) => {
            const key = keyFn(item);
            if (!result[key]) {
                result[key] = [];
            }
            result[key].push(item);
            return result;
        },
        {} as Record<K, T[]>
    );
}

/**
 * Unique array values
 * @param array - Array with potential duplicates
 * @returns Array with unique values
 */
export function unique<T>(array: T[]): T[] {
    return [...new Set(array)];
}

/**
 * Sort array by property
 * @param array - Array to sort
 * @param key - Property key to sort by
 * @param descending - Sort descending
 * @returns Sorted array
 */
export function sortBy<T>(array: T[], key: keyof T, descending: boolean = false): T[] {
    return [...array].sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        if (valA < valB) return descending ? 1 : -1;
        if (valA > valB) return descending ? -1 : 1;
        return 0;
    });
}

// ============================================================
// OBJECT UTILITIES
// ============================================================

/**
 * Deep clone object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime()) as unknown as T;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item)) as unknown as T;
    }

    const cloned = {} as T;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

/**
 * Deep merge objects
 * @param target - Target object
 * @param sources - Source objects
 * @returns Merged object
 */
export function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
    if (!sources.length) return target;

    const source = sources.shift();
    if (!source) return target;

    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const targetValue = target[key];
            const sourceValue = source[key];

            if (
                sourceValue &&
                typeof sourceValue === 'object' &&
                !Array.isArray(sourceValue) &&
                targetValue &&
                typeof targetValue === 'object' &&
                !Array.isArray(targetValue)
            ) {
                target[key] = deepMerge(targetValue, sourceValue);
            } else {
                (target as Record<string, any>)[key] = sourceValue;
            }
        }
    }

    return deepMerge(target, ...sources);
}

/**
 * Pick specific keys from object
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns New object with only specified keys
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
}

/**
 * Omit specific keys from object
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns New object without specified keys
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result as Omit<T, K>;
}

// ============================================================
// ASYNC UTILITIES
// ============================================================

/**
 * Sleep/delay for specified milliseconds
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in ms
 * @returns Result of function
 */
export async function retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                await sleep(delay);
            }
        }
    }

    throw lastError;
}

// ============================================================
// D&D SPECIFIC UTILITIES
// ============================================================

/**
 * Calculate modifier from ability score
 * @param score - Ability score (1-30)
 * @returns Modifier value
 */
export function getModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}

/**
 * Get proficiency bonus for level
 * @param level - Character level (1-20)
 * @returns Proficiency bonus
 */
export function getProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
}

/**
 * Format modifier with sign
 * @param modifier - Modifier value
 * @returns Formatted string (e.g., "+2" or "-1")
 */
export function formatModifier(modifier: number): string {
    return modifier >= 0 ? `+${modifier}` : String(modifier);
}

/**
 * Parse dice notation (e.g., "2d6+3")
 * @param notation - Dice notation string
 * @returns Parsed components or null if invalid
 */
export function parseDiceNotation(notation: string): {
    count: number;
    sides: number;
    modifier: number;
} | null {
    const match = notation.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
    if (!match) return null;

    return {
        count: parseInt(match[1]) || 1,
        sides: parseInt(match[2]),
        modifier: parseInt(match[3]) || 0
    };
}

/**
 * Roll dice
 * @param sides - Number of sides
 * @returns Random result (1 to sides)
 */
export function rollDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll multiple dice
 * @param count - Number of dice
 * @param sides - Sides per die
 * @returns Array of results
 */
export function rollDice(count: number, sides: number): number[] {
    return Array.from({ length: count }, () => rollDie(sides));
}

// ============================================================
// EXPORT DEFAULT (for CommonJS compatibility)
// ============================================================

export default {
    // DOM
    $c,
    clearDomCache,

    // Timing
    debounce,
    throttle,
    memoize,

    // String
    escapeHtml,
    stripHtml,
    truncate,
    capitalize,

    // Number
    clamp,
    randomInt,
    formatNumber,

    // Date
    formatDate,
    formatDateTime,
    getRelativeTime,

    // Array
    shuffle,
    groupBy,
    unique,
    sortBy,

    // Object
    deepClone,
    deepMerge,
    pick,
    omit,

    // Async
    sleep,
    retry,

    // D&D
    getModifier,
    getProficiencyBonus,
    formatModifier,
    parseDiceNotation,
    rollDie,
    rollDice
};
