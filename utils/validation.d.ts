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
declare function validateEntityReferences(entity: any, schema: ValidationSchema): ValidationResult;
/**
 * Validation schemas for different entity types
 * Define required fields and entity references for each type
 */
declare const VALIDATION_SCHEMAS: Record<string, ValidationSchema>;
/**
 * Helper function to validate and show errors
 * @param entity - Entity to validate
 * @param entityType - Type key from VALIDATION_SCHEMAS
 * @returns True if valid, false if invalid (and shows toast)
 */
declare function validateAndShowErrors(entity: any, entityType: string): boolean;
//# sourceMappingURL=validation.d.ts.map