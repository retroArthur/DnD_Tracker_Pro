// [SECTION:FILTER_ENGINE]
// Generic filtering and search utilities
// Reduces 30-50 line filter functions to 10-15 lines
// Combines multiple filter passes into single pass for performance

/**
 * Apply multiple filters to an array in a single pass
 * Supports: search text, dropdown filters, checkbox filters, custom predicates
 *
 * @param {Array} items - Array of items to filter
 * @param {Object} config - Filter configuration
 * @param {string} config.searchText - Text to search for (case-insensitive)
 * @param {string[]} config.searchFields - Fields to search in
 * @param {Object} config.filters - Object with filter name -> value mappings
 * @param {Function} config.customFilter - Additional filter function (optional)
 * @returns {Array} - Filtered array
 *
 * @example
 * const filtered = applyFilters(D.spells, {
 *   searchText: searchInput.value,
 *   searchFields: ['name', 'desc'],
 *   filters: {
 *     class: classSelect.value,      // 'Wizard'
 *     level: levelSelect.value,       // '3'
 *     school: schoolSelect.value      // 'evocation'
 *   }
 * });
 */
function applyFilters(items, config) {
    const {
        searchText = '',
        searchFields = [],
        filters = {},
        customFilter = null
    } = config;

    const search = searchText.trim().toLowerCase();

    return items.filter(item => {
        // Search text filter (if provided)
        if (search && searchFields.length > 0) {
            const matchesSearch = searchFields.some(field => {
                const value = getNestedValue(item, field);
                return value && String(value).toLowerCase().includes(search);
            });
            if (!matchesSearch) return false;
        }

        // Dropdown/select filters
        for (const [filterKey, filterValue] of Object.entries(filters)) {
            if (!filterValue || filterValue === 'all' || filterValue === '') continue;

            const itemValue = getNestedValue(item, filterKey);

            // Handle array fields (e.g., spellClasses: ['Wizard', 'Sorcerer'])
            if (Array.isArray(itemValue)) {
                if (!itemValue.includes(filterValue)) return false;
            }
            // Handle exact match
            else if (String(itemValue) !== String(filterValue)) {
                return false;
            }
        }

        // Custom filter function (advanced use cases)
        if (customFilter && typeof customFilter === 'function') {
            if (!customFilter(item)) return false;
        }

        return true;
    });
}

/**
 * Get nested object value by path (supports 'object.nested.field')
 * @private
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Get current filter state from DOM elements
 * Extracts values from inputs, selects, and checkboxes
 *
 * @param {Object} config - Configuration object
 * @param {string} config.searchInputId - ID of search input
 * @param {Object} config.filterIds - Object mapping filter names to element IDs
 * @returns {Object} - Filter state object
 *
 * @example
 * const state = getFilterState({
 *   searchInputId: 'spell-search',
 *   filterIds: {
 *     class: 'spell-class-filter',
 *     level: 'spell-level-filter',
 *     school: 'spell-school-filter',
 *     ritual: 'spell-ritual-checkbox'
 *   }
 * });
 * // Returns: { search: 'fireball', class: 'Wizard', level: '3', school: 'evocation', ritual: true }
 */
function getFilterState(config) {
    const { searchInputId, filterIds = {} } = config;
    const state = {};

    // Get search text
    if (searchInputId) {
        const searchEl = $(searchInputId);
        state.search = searchEl ? searchEl.value.trim() : '';
    }

    // Get filter values
    for (const [key, elementId] of Object.entries(filterIds)) {
        const el = $(elementId);
        if (!el) continue;

        if (el.type === 'checkbox') {
            state[key] = el.checked;
        } else {
            state[key] = el.value;
        }
    }

    return state;
}

/**
 * Sort array by field (with optional direction)
 *
 * @param {Array} items - Array to sort
 * @param {string} field - Field to sort by
 * @param {string} direction - 'asc' or 'desc' (default: 'asc')
 * @returns {Array} - Sorted array (creates new array)
 */
function sortByField(items, field, direction = 'asc') {
    const sorted = [...items].sort((a, b) => {
        const aVal = getNestedValue(a, field);
        const bVal = getNestedValue(b, field);

        if (aVal === bVal) return 0;

        if (typeof aVal === 'string') {
            return direction === 'asc'
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        }

        return direction === 'asc'
            ? (aVal < bVal ? -1 : 1)
            : (aVal > bVal ? -1 : 1);
    });

    return sorted;
}

// Export to global scope (non-ESM architecture)
window.applyFilters = applyFilters;
