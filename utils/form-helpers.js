// [SECTION:FORM_HELPERS]
// Generic form handling utilities to reduce code duplication
// Reduces 20-60 line clear functions to 5-15 line calls

/**
 * Clear form fields based on configuration
 * Handles text inputs, textareas, selects, checkboxes, contentEditable
 *
 * @param {Object} config - Configuration object
 * @param {string[]} config.textFields - IDs of text/number inputs to clear
 * @param {string[]} config.selectFields - IDs of select dropdowns with default values
 * @param {string[]} config.checkboxFields - IDs of checkboxes to uncheck
 * @param {string[]} config.contentEditableFields - IDs of contentEditable elements
 * @param {Object} config.defaults - Default values for fields (optional)
 * @param {Function} config.customHandlers - Additional cleanup functions (optional)
 * @returns {boolean} - True if successful
 *
 * @example
 * clearFormFields({
 *   textFields: ['char-name', 'char-player', 'char-level'],
 *   selectFields: [{ id: 'char-class', defaultValue: '' }],
 *   checkboxFields: ['char-inspiration'],
 *   contentEditableFields: ['char-notes'],
 *   defaults: { 'char-level': '1', 'char-proficiency': '+2' }
 * });
 */
function clearFormFields(config) {
    const {
        textFields = [],
        selectFields = [],
        checkboxFields = [],
        contentEditableFields = [],
        defaults = {},
        customHandlers = null
    } = config;

    try {
        // Clear text inputs
        textFields.forEach(id => {
            const el = $(id);
            if (el) {
                el.value = defaults[id] || '';
            }
        });

        // Reset select dropdowns
        selectFields.forEach(field => {
            const id = typeof field === 'string' ? field : field.id;
            const defaultValue = typeof field === 'string' ? '' : field.defaultValue || '';
            const el = $(id);
            if (el) {
                el.value = defaults[id] || defaultValue;
            }
        });

        // Uncheck checkboxes
        checkboxFields.forEach(id => {
            const el = $(id);
            if (el && el.type === 'checkbox') {
                el.checked = false;
            }
        });

        // Clear contentEditable fields
        contentEditableFields.forEach(id => {
            const el = $(id);
            if (el) {
                el.innerHTML = '';
            }
        });

        // Run custom cleanup handlers
        if (customHandlers && typeof customHandlers === 'function') {
            customHandlers();
        }

        return true;
    } catch (err) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            window.ErrorHandler?.log('clearFormFields', err);
        }
        return false;
    }
}

/**
 * Clear chip-based selection UI (resistances, immunities, languages)
 *
 * @param {string} containerSelector - CSS selector for chip container
 * @returns {boolean} - True if successful
 */
function clearChipSelection(containerSelector) {
    try {
        document.querySelectorAll(`${containerSelector} .cf-chip`).forEach(chip => {
            chip.classList.remove('selected');
            const input = chip.querySelector('input');
            if (input) input.checked = false;
        });
        return true;
    } catch (err) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            window.ErrorHandler?.log('clearChipSelection', err);
        }
        return false;
    }
}

/**
 * Clear array of spell slots (character/spellcaster form)
 *
 * @param {string} prefix - ID prefix (e.g., 'char-slot' for 'char-slot-0', 'char-slot-1', etc.)
 * @param {number} maxLevel - Maximum spell level (default 9)
 * @returns {boolean} - True if successful
 */
function clearSpellSlots(prefix = 'char-slot', maxLevel = 9) {
    try {
        for (let i = 0; i <= maxLevel; i++) {
            const el = $(`${prefix}-${i}`);
            if (el) el.value = '0';
        }
        return true;
    } catch (err) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            window.ErrorHandler?.log('clearSpellSlots', err);
        }
        return false;
    }
}

/**
 * Reset attributes to default value (typically 10)
 *
 * @param {string[]} attributes - Array of attribute abbreviations ['str', 'dex', 'con', 'int', 'wis', 'cha']
 * @param {string} prefix - ID prefix (e.g., 'char' for 'char-str', 'char-dex', etc.)
 * @param {number} defaultValue - Default attribute value (default 10)
 * @param {Function} updateModCallback - Optional callback to update modifier display
 * @returns {boolean} - True if successful
 */
function resetAttributes(
    attributes = ['str', 'dex', 'con', 'int', 'wis', 'cha'],
    prefix = 'char',
    defaultValue = 10,
    updateModCallback = null
) {
    try {
        attributes.forEach(attr => {
            const el = $(`${prefix}-${attr}`);
            if (el) {
                el.value = String(defaultValue);
                if (updateModCallback && typeof updateModCallback === 'function') {
                    updateModCallback(attr);
                }
            }
        });
        return true;
    } catch (err) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            window.ErrorHandler?.log('resetAttributes', err);
        }
        return false;
    }
}

// Export to global scope (non-ESM architecture)
window.clearFormFields = clearFormFields;
window.clearChipSelection = clearChipSelection;
window.clearSpellSlots = clearSpellSlots;
window.resetAttributes = resetAttributes;
