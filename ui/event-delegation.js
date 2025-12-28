// [SECTION:EVENT_DELEGATION]
// ============================================================
// EVENT DELEGATION SYSTEM - @click @change @input @action
// ============================================================
// Kern-Infrastruktur für Event-Handling
// Actions werden von separaten Modulen in ui/actions/ registriert

const EventDelegation = {
    _handlers: new Map(),

    init() {
        // Event listener in CAPTURE-Phase, um Events vor onclick-Handlern abzufangen
        document.addEventListener('click', (e) => this._handleClick(e), { capture: true, passive: false });
        document.addEventListener('change', (e) => this._handleChange(e), { passive: true });
        document.addEventListener('input', (e) => this._handleInput(e), { passive: true });
        log('[EventDelegation] Initialized (capture mode)');
    },

    // Registriere benutzerdefinierte Aktion zur Laufzeit
    registerAction(name, handler) {
        this._handlers.set(name, handler);
    },

    // Registriere mehrere Actions auf einmal
    registerActions(actions) {
        Object.entries(actions).forEach(([name, handler]) => {
            this._handlers.set(name, handler);
        });
    },

    // Prüfe ob eine Action registriert ist
    hasAction(name) {
        return this._handlers.has(name);
    },

    // Anzahl der registrierten Actions
    get actionCount() {
        return this._handlers.size;
    },

    _handleClick(e) {
        // Prüfe ob ein Element mit data-stop-propagation im Pfad ist
        const stopPropEl = e.target.closest('[data-stop-propagation="true"]');
        if (stopPropEl && !e.target.closest('[data-action]')) {
            e.stopPropagation();
            return;
        }

        // Finde das nächste Element mit data-action
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const id = target.dataset.id ? parseInt(target.dataset.id) : null;
        const type = target.dataset.type || null;
        const value = target.dataset.value || null;

        // Context-Objekt für Handler
        const ctx = { id, type, value, target, event: e };

        // Prüfe registrierte Handler
        if (this._handlers.has(action)) {
            e.preventDefault();
            e.stopPropagation();

            try {
                this._handlers.get(action)(ctx);
            } catch (actionError) {
                if (typeof ErrorHandler !== 'undefined') {
                    ErrorHandler.log('EventDelegation', actionError, `Action: ${action}`);
                } else {
                    console.error(`[EventDelegation] Fehler in Action "${action}":`, actionError);
                }
            }
        }
    },

    _handleChange(e) {
        const target = e.target;
        if (!target.dataset.onChange) return;

        const fn = window[target.dataset.onChange];
        if (typeof fn === 'function') {
            try {
                fn(target);
            } catch (changeError) {
                if (typeof ErrorHandler !== 'undefined') {
                    ErrorHandler.log('EventDelegation', changeError, `onChange: ${target.dataset.onChange}`);
                } else {
                    console.error('[EventDelegation] onChange Fehler:', changeError);
                }
            }
        }
    },

    _handleInput(e) {
        const target = e.target;
        if (!target.dataset.onInput) return;

        const fn = window[target.dataset.onInput];
        if (typeof fn === 'function') {
            try {
                fn(target);
            } catch (inputError) {
                if (typeof ErrorHandler !== 'undefined') {
                    ErrorHandler.log('EventDelegation', inputError, `onInput: ${target.dataset.onInput}`);
                } else {
                    console.error('[EventDelegation] onInput Fehler:', inputError);
                }
            }
        }
    }
};

// ============================================================
