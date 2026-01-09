/**
 * Update attribute modifier display in char form
 */
declare function updateAttrMod(attr: string): void;
/**
 * Update initiative from DEX modifier
 */
declare function updateInitFromDex(): void;
/**
 * Update speed display (meters to feet conversion)
 */
declare function updateSpeedDisplay(): void;
/**
 * Avatar preview - sichere Implementierung
 */
declare function updateAvatarPreview(url: string): void;
/**
 * Toggle language dropdown
 */
declare function toggleLangDropdown(): void;
/**
 * Update character languages from dropdown
 */
declare function updateCharLanguages(): void;
/**
 * Set character languages in the dropdown
 */
declare function setCharLanguages(languages: string[] | string | null): void;
/**
 * Clear character languages
 */
declare function clearCharLanguages(): void;
/**
 * Oeffnet das Bearbeitungsformular fuer einen Charakter
 */
declare function editChar(id: number | string): void;
/**
 * Cancel character edit
 */
declare function cancelCharEdit(): void;
/**
 * Update proficiency bonus display
 */
declare function updateProficiencyBonus(): void;
//# sourceMappingURL=party-crud.d.ts.map