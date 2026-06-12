// [SECTION:CRUD_HELPERS]
// Generic CRUD operation helpers to reduce code duplication
// Provides consistent UX for delete confirmations, undo support, and post-operation actions
/**
 * Generic delete with confirmation and undo support
 * Reduces duplicate code across all CRUD operations
 *
 * @param config - Configuration object
 * @returns True if deleted, false if cancelled or not found
 */
function deleteWithConfirm(config) {
    const { entityType, id, onSuccess, confirmMessage = null, undoLabel = null } = config;
    // Ensure ID is numeric
    const numId = parseInt(String(id));
    if (isNaN(numId)) {
        showToast('❌ Ungültige ID', 'error');
        return false;
    }
    // Find entity to delete
    const EntityLookup = window.EntityLookup;
    const entity = EntityLookup?.get(entityType, numId);
    if (!entity) {
        showToast(`❌ ${entityType} nicht gefunden`, 'error');
        if (window.APP_CONFIG?.DEBUG_MODE) {
            window.ErrorHandler?.log(
                'deleteWithConfirm',
                new Error(`Entity not found: ${entityType}#${numId}`)
            );
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
    const saveUndoState = window.saveUndoState;
    if (saveUndoState) saveUndoState(undoMessage);
    // Delete entity from collection
    const D = window.D;
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
            window.ErrorHandler?.log('deleteWithConfirm', err, 'Success callback failed');
        }
    }
    // Persist changes
    const save = window.save;
    if (save) save();
    return true;
}
/**
 * Standard CRUD sequence: render + save + toast
 * Provides consistent post-operation flow
 *
 * @param renderFn - Render function to call (null to skip)
 * @param message - Toast message to show
 * @param toastType - Toast type ('success', 'error', 'warning', 'info')
 */
function afterCrudOperation(renderFn, message = '✅ Gespeichert', toastType = 'success') {
    // Call render function if provided
    if (renderFn) {
        try {
            renderFn();
        } catch (err) {
            window.ErrorHandler?.log('afterCrudOperation', err, 'Render function failed');
            showToast('⚠️ Anzeige konnte nicht aktualisiert werden', 'warning');
        }
    }
    // Persist changes
    const save = window.save;
    if (save) save();
    // Show confirmation
    if (message) {
        showToast(message, toastType);
    }
}
/**
 * Generic entity update with validation
 * Provides consistent update flow with undo support
 *
 * @param config - Configuration object
 * @returns Saved entity or null on failure
 */
function saveEntityWithUndo(config) {
    const { entityType, id, data, onSuccess, undoLabel = null } = config;
    const numId = parseInt(String(id));
    const isNew = numId === 0 || isNaN(numId);
    // Save undo state BEFORE changes
    const action = isNew ? 'erstellt' : 'bearbeitet';
    const displayName = data.name || data.title || 'Unbekannt';
    const undoMessage = undoLabel || `${entityType} ${action}: ${displayName}`;
    const saveUndoState = window.saveUndoState;
    if (saveUndoState) saveUndoState(undoMessage);
    let savedEntity = null;
    const D = window.D;
    const genId = window.genId;
    if (isNew) {
        // Create new entity
        const newId = genId ? genId(entityType) : Date.now();
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
            window.ErrorHandler?.log('saveEntityWithUndo', err, 'Success callback failed');
        }
    }
    return savedEntity;
}
