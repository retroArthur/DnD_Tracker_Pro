// [SECTION:VALIDATION]
// Input validation utilities for entity data integrity
// Prevents invalid foreign key references and ensures required fields

import { showToast } from './utilities';

interface ValidationConfig {
    type: 'string' | 'number' | 'entityRef';
    required?: boolean;
    maxLength?: number;
    min?: number;
    max?: number;
    entityType?: string;
}

interface ValidationSchema {
    [field: string]: ValidationConfig;
}

interface ValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Validate entity references are valid before persisting
 * @param entity - Entity to validate
 * @param schema - Validation schema with field definitions
 * @returns Validation result with errors
 */
export function validateEntityReferences(entity: any, schema: ValidationSchema): ValidationResult {
    const errors: string[] = [];

    Object.entries(schema).forEach(([field, config]) => {
        const value = entity[field];

        // Validate entity references (foreign keys)
        if (config.type === 'entityRef' && value !== null && value !== undefined && value !== 0) {
            const numId = parseInt(String(value));
            if (isNaN(numId)) {
                errors.push(`${field}: Ungültige ID-Format`);
            } else {
                const EntityLookup = (window as any).EntityLookup;
                const refEntity = EntityLookup?.get(config.entityType, numId);
                if (!refEntity) {
                    errors.push(`${field}: Referenzierter ${config.entityType} mit ID ${numId} nicht gefunden`);
                }
            }
        }

        // Validate required fields
        if (config.required) {
            if (value === null || value === undefined || value === '') {
                errors.push(`${field}: Pflichtfeld fehlt`);
            }
        }

        // Validate string length if specified
        if (config.type === 'string' && config.maxLength && typeof value === 'string') {
            if (value.length > config.maxLength) {
                errors.push(`${field}: Maximal ${config.maxLength} Zeichen erlaubt`);
            }
        }

        // Validate number ranges if specified
        if (config.type === 'number' && typeof value === 'number') {
            if (config.min !== undefined && value < config.min) {
                errors.push(`${field}: Mindestwert ist ${config.min}`);
            }
            if (config.max !== undefined && value > config.max) {
                errors.push(`${field}: Maximalwert ist ${config.max}`);
            }
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validation schemas for different entity types
 * Define required fields and entity references for each type
 */
export const VALIDATION_SCHEMAS: Record<string, ValidationSchema> = {
    quest: {
        title: { type: 'string', required: true, maxLength: 200 },
        giverId: { type: 'entityRef', entityType: 'npcs', required: false },
        locationId: { type: 'entityRef', entityType: 'locations', required: false }
    },
    npc: {
        name: { type: 'string', required: true, maxLength: 100 },
        locationId: { type: 'entityRef', entityType: 'locations', required: false }
    },
    character: {
        name: { type: 'string', required: true, maxLength: 100 },
        level: { type: 'number', required: false, min: 1, max: 20 }
    },
    location: {
        name: { type: 'string', required: true, maxLength: 100 }
    },
    encounter: {
        name: { type: 'string', required: true, maxLength: 100 },
        hp: { type: 'number', required: false, min: 0 },
        ac: { type: 'number', required: false, min: 0, max: 30 }
    }
};

/**
 * Helper function to validate and show errors
 * @param entity - Entity to validate
 * @param entityType - Type key from VALIDATION_SCHEMAS
 * @returns True if valid, false if invalid (and shows toast)
 */
export function validateAndShowErrors(entity: any, entityType: string): boolean {
    const schema = VALIDATION_SCHEMAS[entityType];
    if (!schema) {
        if ((window as any).APP_CONFIG?.DEBUG_MODE) {
            (window as any).ErrorHandler?.log('validateAndShowErrors', new Error(`Unknown entity type: ${entityType}`));
        }
        return true; // No schema = no validation, allow save
    }

    const validation = validateEntityReferences(entity, schema);
    if (!validation.valid) {
        showToast('⚠️ Validierungsfehler:\n' + validation.errors.join('\n'), 'error', 5000);
        return false;
    }

    return true;
}
