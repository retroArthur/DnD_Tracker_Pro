/**
 * Utilities Bridge Module
 * Re-exports utilities from various sources for consistent imports
 * @module utils/utilities
 * @version 2.7.0
 */

// Re-export D&D calculation functions from constants
export { getModifier, getProficiencyBonus, formatModifier, getXPForCR, parseCR } from '../core/constants';

// Re-export utility functions from testable-utils
export { clamp, deepClone, isEmpty, esc, sanitizeHTML, debounce, throttle, generateUUID, sleep, formatDate, formatMod, parseDiceNotation } from './testable-utils';

// Re-export types
export type { DiceNotation, DataStore } from './testable-utils';
