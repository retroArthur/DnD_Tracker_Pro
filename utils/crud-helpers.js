// [SECTION:CRUD_HELPERS]
// Generic CRUD operation helpers to reduce code duplication
// Provides consistent UX for delete confirmations, undo support, and post-operation actions

/**
 * Generic delete with confirmation and undo support
 * Reduces duplicate code across all CRUD operations
 *
 * @param {Object} config - Configuration object
 * @param {string} config.entityType - Entity collection name ('characters', 'npcs', 'quests', etc.)
 * @param {number|string} config.id - Entity ID to delete
 * @param {Function} [config.onSuccess] - Callback after successful delete
 * @param {string} [config.confirmMessage] - Custom confirmation message
 * @param {string} [config.undoLabel] - Custom undo state label
 * @returns {boolean} True if deleted, false if cancelled or not found
 */
function deleteWithConfirm(config) {
    const {
        entityType,
        id,
        onSuccess,
        confirmMessage = null,
        undoLabel = null
    } = config;

    // Ensure ID is numeric
    const numId = parseInt(id);
    if (isNaN(numId)) {
        showToast('❌ Ungültige ID', 'error');
        return false;
    }

    // Find entity to delete
    const entity = EntityLookup.get(entityType, numId);
    if (!entity) {
        showToast(`❌ ${entityType} nicht gefunden`, 'error');
        if (APP_CONFIG.DEBUG_MODE) {
            ErrorHandler.log('deleteWithConfirm', new Error(`Entity not found: ${entityType}#${numId}`));
        }
        return false;
    }

    // Get display name
    const displayName = entity.name || entity.title || 'Unbekannt';

    // Confirm deletion
    const message = confirmMessage || `"${displayName}" wirklich löschen?`;
    if (!confirm(message)) {
        return false;
    }

    // Save undo state BEFORE deletion
    const undoMessage = undoLabel || `${entityType} gelöscht: ${displayName}`;
    saveUndoState(undoMessage);

    // Delete entity from collection
    if (!D[entityType]) {
        showToast(`❌ Unbekannter Entity-Typ: ${entityType}`, 'error');
        return false;
    }

    D[entityType] = D[entityType].filter(e => e.id !== numId);

    // Call success callback if provided
    if (onSuccess) {
        try {
            onSuccess(entity);
        } catch (err) {
            ErrorHandler.log('deleteWithConfirm', err, 'Success callback failed');
        }
    }

    // Persist changes
    save();

    return true;
}

/**
 * Standard CRUD sequence: render + save + toast
 * Provides consistent post-operation flow
 *
 * @param {Function} [renderFn] - Render function to call (null to skip)
 * @param {string} [message] - Toast message to show
 * @param {string} [toastType] - Toast type ('success', 'error', 'warning', 'info')
 */
function afterCrudOperation(renderFn, message = '✅ Gespeichert', toastType = 'success') {
    // Call render function if provided
    if (renderFn) {
        try {
            renderFn();
        } catch (err) {
            ErrorHandler.log('afterCrudOperation', err, 'Render function failed');
            showToast('⚠️ Anzeige konnte nicht aktualisiert werden', 'warning');
        }
    }

    // Persist changes
    save();

    // Show confirmation
    if (message) {
        showToast(message, toastType);
    }
}

/**
 * Generic entity update with validation
 * Provides consistent update flow with undo support
 *
 * @param {Object} config - Configuration object
 * @param {string} config.entityType - Entity collection name
 * @param {number|string} config.id - Entity ID (0 for new entity)
 * @param {Object} config.data - Entity data to save
 * @param {Function} [config.onSuccess] - Callback after successful save
 * @param {string} [config.undoLabel] - Custom undo state label
 * @returns {Object|null} Saved entity or null on failure
 */
function saveEntityWithUndo(config) {
    const {
        entityType,
        id,
        data,
        onSuccess,
        undoLabel = null
    } = config;

    const numId = parseInt(id);
    const isNew = numId === 0 || isNaN(numId);

    // Save undo state BEFORE changes
    const action = isNew ? 'erstellt' : 'bearbeitet';
    const displayName = data.name || data.title || 'Unbekannt';
    const undoMessage = undoLabel || `${entityType} ${action}: ${displayName}`;
    saveUndoState(undoMessage);

    let savedEntity = null;

    if (isNew) {
        // Create new entity
        const newId = genId(entityType);
        savedEntity = { ...data, id: newId };

        if (!D[entityType]) {
            D[entityType] = [];
        }
        D[entityType].push(savedEntity);

    } else {
        // Update existing entity
        if (!D[entityType]) {
            showToast(`❌ Unbekannter Entity-Typ: ${entityType}`, 'error');
            return null;
        }

        const index = D[entityType].findIndex(e => e.id === numId);
        if (index === -1) {
            showToast(`❌ ${entityType} nicht gefunden`, 'error');
            return null;
        }

        savedEntity = { ...data, id: numId };
        D[entityType][index] = savedEntity;
    }

    // Call success callback if provided
    if (onSuccess) {
        try {
            onSuccess(savedEntity, isNew);
        } catch (err) {
            ErrorHandler.log('saveEntityWithUndo', err, 'Success callback failed');
        }
    }

    return savedEntity;
}
