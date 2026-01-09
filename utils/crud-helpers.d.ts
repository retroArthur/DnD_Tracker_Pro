type ToastType = 'success' | 'error' | 'warning' | 'info';
interface DeleteConfig {
    entityType: string;
    id: number | string;
    onSuccess?: (entity: any) => void;
    confirmMessage?: string | null;
    undoLabel?: string | null;
}
interface SaveEntityConfig {
    entityType: string;
    id: number | string;
    data: any;
    onSuccess?: (entity: any, isNew: boolean) => void;
    undoLabel?: string | null;
}
/**
 * Generic delete with confirmation and undo support
 * Reduces duplicate code across all CRUD operations
 *
 * @param config - Configuration object
 * @returns True if deleted, false if cancelled or not found
 */
declare function deleteWithConfirm(config: DeleteConfig): boolean;
/**
 * Standard CRUD sequence: render + save + toast
 * Provides consistent post-operation flow
 *
 * @param renderFn - Render function to call (null to skip)
 * @param message - Toast message to show
 * @param toastType - Toast type ('success', 'error', 'warning', 'info')
 */
declare function afterCrudOperation(renderFn?: (() => void) | null, message?: string, toastType?: ToastType): void;
/**
 * Generic entity update with validation
 * Provides consistent update flow with undo support
 *
 * @param config - Configuration object
 * @returns Saved entity or null on failure
 */
declare function saveEntityWithUndo(config: SaveEntityConfig): any | null;
//# sourceMappingURL=crud-helpers.d.ts.map