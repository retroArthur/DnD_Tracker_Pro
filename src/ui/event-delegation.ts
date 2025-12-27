/**
 * D&D Tracker - Event Delegation System (TypeScript)
 * Centralized event handling via data-action attributes
 * @module ui/event-delegation
 * @version 2.7.0
 */

// ============================================================
// TYPES
// ============================================================

export interface ActionContext {
    id: number | null;
    type: string | null;
    value: string | null;
    target: HTMLElement;
    event: Event;
}

export type ActionHandler = (context: ActionContext) => void;

export interface EventDelegationConfig {
    captureMode?: boolean;
    stopPropagation?: boolean;
    preventDefault?: boolean;
}

// ============================================================
// EVENT DELEGATION CLASS
// ============================================================

/**
 * Event Delegation System
 * Handles click, change, and input events via data-* attributes
 */
export class EventDelegation {
    private _handlers: Map<string, ActionHandler> = new Map();
    private _initialized: boolean = false;
    private _config: EventDelegationConfig;

    constructor(config: EventDelegationConfig = {}) {
        this._config = {
            captureMode: config.captureMode ?? true,
            stopPropagation: config.stopPropagation ?? true,
            preventDefault: config.preventDefault ?? true
        };
    }

    /**
     * Initializes the event delegation system
     */
    init(): void {
        if (this._initialized) return;

        document.addEventListener('click', e => this._handleClick(e), {
            capture: this._config.captureMode,
            passive: false
        });

        document.addEventListener('change', e => this._handleChange(e), { passive: true });

        document.addEventListener('input', e => this._handleInput(e), { passive: true });

        this._initialized = true;
    }

    /**
     * Registers an action handler
     * @param name - Action name (value of data-action)
     * @param handler - Handler function
     */
    registerAction(name: string, handler: ActionHandler): void {
        this._handlers.set(name, handler);
    }

    /**
     * Registers multiple action handlers
     * @param handlers - Object with action names as keys
     */
    registerActions(handlers: Record<string, ActionHandler>): void {
        for (const [name, handler] of Object.entries(handlers)) {
            this._handlers.set(name, handler);
        }
    }

    /**
     * Unregisters an action handler
     * @param name - Action name to remove
     */
    unregisterAction(name: string): void {
        this._handlers.delete(name);
    }

    /**
     * Checks if an action is registered
     * @param name - Action name
     */
    hasAction(name: string): boolean {
        return this._handlers.has(name);
    }

    /**
     * Gets all registered action names
     */
    getRegisteredActions(): string[] {
        return Array.from(this._handlers.keys());
    }

    /**
     * Handles click events
     */
    private _handleClick(e: Event): void {
        const mouseEvent = e as MouseEvent;
        const target = mouseEvent.target as HTMLElement;

        // Check for stop propagation marker
        const stopPropEl = target.closest('[data-stop-propagation="true"]');
        if (stopPropEl && !target.closest('[data-action]')) {
            mouseEvent.stopPropagation();
            return;
        }

        // Find the nearest element with data-action
        const actionEl = target.closest('[data-action]') as HTMLElement | null;
        if (!actionEl) return;

        const action = actionEl.dataset.action;
        if (!action) return;

        // Build context
        const context = this._buildContext(actionEl, mouseEvent);

        // Check for registered handler
        const handler = this._handlers.get(action);
        if (handler) {
            if (this._config.preventDefault) {
                mouseEvent.preventDefault();
            }
            if (this._config.stopPropagation) {
                mouseEvent.stopPropagation();
            }

            try {
                handler(context);
            } catch (error) {
                console.error(`[EventDelegation] Error in action "${action}":`, error);
            }
        }
    }

    /**
     * Handles change events
     */
    private _handleChange(e: Event): void {
        const target = e.target as HTMLElement;
        const handlerName = target.dataset.onChange;
        if (!handlerName) return;

        const handler = this._handlers.get(`change:${handlerName}`);
        if (handler) {
            try {
                handler(this._buildContext(target, e));
            } catch (error) {
                console.error(`[EventDelegation] Error in onChange "${handlerName}":`, error);
            }
        }
    }

    /**
     * Handles input events
     */
    private _handleInput(e: Event): void {
        const target = e.target as HTMLElement;
        const handlerName = target.dataset.onInput;
        if (!handlerName) return;

        const handler = this._handlers.get(`input:${handlerName}`);
        if (handler) {
            try {
                handler(this._buildContext(target, e));
            } catch (error) {
                console.error(`[EventDelegation] Error in onInput "${handlerName}":`, error);
            }
        }
    }

    /**
     * Builds action context from element and event
     */
    private _buildContext(target: HTMLElement, event: Event): ActionContext {
        return {
            id: target.dataset.id ? parseInt(target.dataset.id, 10) : null,
            type: target.dataset.type ?? null,
            value: target.dataset.value ?? null,
            target,
            event
        };
    }
}

// ============================================================
// ACTION HELPERS
// ============================================================

/**
 * Creates a data-action attribute object for use with DOM builders
 */
export function createAction(
    action: string,
    options?: {
        id?: number | string;
        type?: string;
        value?: string;
    }
): Record<string, string> {
    const attrs: Record<string, string> = {
        'data-action': action
    };

    if (options?.id !== undefined) {
        attrs['data-id'] = String(options.id);
    }
    if (options?.type !== undefined) {
        attrs['data-type'] = options.type;
    }
    if (options?.value !== undefined) {
        attrs['data-value'] = options.value;
    }

    return attrs;
}

/**
 * Creates a stop-propagation wrapper for nested clickable elements
 */
export function createStopPropagation(): Record<string, string> {
    return { 'data-stop-propagation': 'true' };
}

// ============================================================
// COMMON ACTION PATTERNS
// ============================================================

/**
 * Creates action handlers for CRUD operations on an entity type
 * @param entityType - Type of entity (e.g., 'character', 'npc')
 * @param callbacks - CRUD callback functions
 */
export function createCRUDActions(
    entityType: string,
    callbacks: {
        edit?: (id: number) => void;
        delete?: (id: number) => void;
        toggle?: (id: number) => void;
        show?: (id: number) => void;
    }
): Record<string, ActionHandler> {
    const actions: Record<string, ActionHandler> = {};

    if (callbacks.edit) {
        actions[`edit-${entityType}`] = ({ id }) => {
            if (id !== null) callbacks.edit!(id);
        };
    }

    if (callbacks.delete) {
        actions[`delete-${entityType}`] = ({ id }) => {
            if (id !== null) callbacks.delete!(id);
        };
    }

    if (callbacks.toggle) {
        actions[`toggle-${entityType}`] = ({ id }) => {
            if (id !== null) callbacks.toggle!(id);
        };
    }

    if (callbacks.show) {
        actions[`show-${entityType}`] = ({ id }) => {
            if (id !== null) callbacks.show!(id);
        };
    }

    return actions;
}

/**
 * Creates modal action handlers
 */
export function createModalActions(callbacks: {
    show: (modalId: string) => void;
    hide: (modalId: string) => void;
}): Record<string, ActionHandler> {
    return {
        'show-modal': ({ value }) => {
            if (value) callbacks.show(value);
        },
        'hide-modal': ({ value }) => {
            if (value) callbacks.hide(value);
        }
    };
}

/**
 * Creates navigation action handlers
 */
export function createNavigationActions(callbacks: {
    switchView: (view: string) => void;
    navigateToEntity?: (type: string, id: number) => void;
}): Record<string, ActionHandler> {
    const actions: Record<string, ActionHandler> = {
        'show-view': ({ value }) => {
            if (value) callbacks.switchView(value);
        }
    };

    if (callbacks.navigateToEntity) {
        actions['navigate-entity'] = ({ type, id }) => {
            if (type && id !== null) {
                callbacks.navigateToEntity!(type, id);
            }
        };
    }

    return actions;
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

/**
 * Default EventDelegation instance
 */
export const eventDelegation = new EventDelegation();

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
    EventDelegation,
    eventDelegation,
    createAction,
    createStopPropagation,
    createCRUDActions,
    createModalActions,
    createNavigationActions
};
