// [SECTION:EVENT_DELEGATION]
// ============================================================
// EVENT DELEGATION SYSTEM - @click @keydown @change @input @action
// ============================================================
// Kern-Infrastruktur für Event-Handling
// Actions werden von separaten Modulen in ui/actions/ registriert

// Whitelist für erlaubte onChange/onInput Handler (Sicherheit)
const ALLOWED_CHANGE_HANDLERS = new Set([
    'updateCartQtyFromInput',
    'setEditorFont',
    'setEditorFontSize',
    'setNpcFilter',
    'setLootFilter',
    'setEncFilter',
    'setLocFilter',
    'setSpellFilter',
    'filterAssignSpells',
    'filterAssignItems',
    // Neu hinzugefügt für Migration von inline handlers
    'toggleShopItemAvailability',
    'performMobileSearch',
    'validateAssignItemQty',
    'updateAssignSpellCount',
    'importData',
    // Phase B (Mai 2026) Migration
    'scheduleMonsterPreview',
    'filterConditions',
    'updateAoETargetDisplay',
    'updateGoldSplit',
    'saveDMSNotes',
    'updateRangeHint'
]);

// Die zwei Tasten, die ein Bedienelement ausloesen (TAST, Schritt 3). Mehr
// nicht: ein Buchstabe ist ein Kuerzel, keine Bedienung (O-7).
const AUSLOESE_TASTEN = new Set(['Enter', ' ']);

// INPUT-Arten, die Enter/Leertaste NICHT selbst brauchen — Knoepfe in
// Feldgestalt. Alle anderen (text, number, checkbox, radio, range, file,
// date, …) behalten ihre Taste; der Verteiler bedient sie ueber 'change'
// bzw. 'input'.
const KNOPFARTIGE_INPUT_TYPEN = new Set(['button', 'submit', 'reset']);

const EventDelegation = {
    _handlers: new Map(),

    init() {
        // Event listener in CAPTURE-Phase, um Events vor onclick-Handlern abzufangen
        document.addEventListener('click', e => this._handleClick(e), {
            capture: true,
            passive: false
        });
        // Ebenfalls CAPTURE und ausdruecklich NICHT passive — _handleKeydown
        // ruft preventDefault(). Die Begruendung beider Eigenschaften steht
        // dort.
        document.addEventListener('keydown', e => this._handleKeydown(e), {
            capture: true,
            passive: false
        });
        document.addEventListener('change', e => this._handleChange(e), { passive: true });
        document.addEventListener('input', e => this._handleInput(e), { passive: true });
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

        // Form-Elemente: Natives Verhalten erlauben, Actions werden via 'change'/'input' Event behandelt
        // SELECT/OPTION → Dropdown öffnen, INPUT file → Dateidialog, checkbox/radio → Toggle
        if (
            target.tagName === 'SELECT' ||
            e.target.tagName === 'OPTION' ||
            (target.tagName === 'INPUT' &&
                (target.type === 'file' || target.type === 'checkbox' || target.type === 'radio'))
        ) {
            return;
        }

        const action = target.dataset.action;
        const id = target.dataset.id ? parseEntityId(target.dataset.id) : null;
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
                    // Letzter Ausweg falls ErrorHandler fehlt (z.B. Ladereihenfolge-Bruch) —
                    // ohne diesen Zweig verschwindet der Fehler spurlos (WR-02a, 13-REVIEW.md).
                    console.error(`[EventDelegation] Fehler in Action "${action}":`, actionError); // gsd:konsolen-senke-fallback
                }
            }
        }
    },

    /**
     * Enter und Leertaste auf einem [data-action]-Element (TAST, Schritt 3,
     * Orchestrator-Entscheidung O-2).
     *
     * WARUM ES DIESEN ZWEIG BRAUCHT. Solange jedes bediente Element ein
     * echter `<button>` ist, fehlt er niemandem: der Browser macht aus
     * Enter und Leertaste selbst ein `click`, und _handleClick faengt es.
     * Fuer die ~219 Quellstellen, die `div`, `span` oder `label` sind, gilt
     * das NICHT. Gemessen am gebauten Buendel, gefuellte Kampagne, echte
     * Tabulatorspruenge: auf einem `div[tabindex="0"][data-action]` erzeugt
     * die Leertaste 0 Klicks, die Aktion laeuft nicht — und `scrollY`
     * springt von 0 auf 143 (sechs Eintraege je Typ) bzw. 564 (zwanzig).
     * Der Knopf tut nichts, und das Dokument laeuft weg.
     *
     * WIE ER ES TUT: er loest sein Ziel ueber dasselbe
     * `closest('[data-action]')` auf wie der Klick-Zweig und schickt dann
     * einen SYNTHETISCHEN Klick auf das fokussierte Element. Danach
     * erledigt _handleClick alles Weitere — die Formular-Ausnahmen,
     * `data-stop-propagation`, den Kontext, die Fehlerabschirmung. Ein
     * zweiter Aufrufweg in den Handler haette einen zweiten Regelsatz
     * bedeutet, der mit dem ersten synchron zu halten waere.
     *
     * DER KLICK GEHT AUF `quelle`, NICHT AUF `ziel` — nachgemessen, nicht
     * Geschmack. `backdrop-close` (ui/actions/ui-actions.js) prueft
     * `ctx.event.target === ctx.target` und schliesst nur, wenn der Klick
     * die Schale selbst getroffen hat. Ein Klick auf das aufgeloeste Ziel
     * wuerde diese Pruefung immer erfuellen: ein Tastendruck auf einem
     * Element INNERHALB der Schale wuerde den Dialog schliessen. Ein Klick
     * auf das fokussierte Element verhaelt sich dagegen genau wie ein
     * Mausklick darauf.
     *
     * DIE ZWEI TRAGENDEN ZEILEN sind `preventDefault()` und
     * `stopPropagation()`. Beide sind gemessen, nicht angenommen:
     *   - OHNE preventDefault meldet ein echter `<button>` ZWEI Klicks
     *     (einer isTrusted vom Browser, einer synthetisch von hier) und die
     *     Leertaste rollt ein `div` um 143–787 px weg. MIT: genau einer,
     *     scrollY bleibt 0 — bei Enter UND bei der Leertaste.
     *   - stopPropagation() in der Capture-Phase auf `document` entzieht
     *     die Taste dem globalen Einzeltasten-Lauscher
     *     (systems/spellslots/keyboard-shortcuts.js), der auf demselben
     *     Knoten in der BUBBLE-Phase sitzt: die Bubble-Runde ueber
     *     `document` ist eine eigene Zustellung und prueft die Flagge.
     *     Das ueberschneidet sich mit der `beanspruchtLeertaste`-Schranke
     *     aus Schritt 2 und ersetzt sie NICHT — jene greift auch dort, wo
     *     dieser Zweig nicht greift (Element ohne `data-action`, Aktion
     *     nicht registriert).
     * Wer eine der beiden Zeilen beim Aufraeumen fuer redundant haelt,
     * bricht jeden `<button>` der App bzw. gibt die gekaperte Leertaste
     * zurueck.
     *
     * WAS ER NICHT ANFASST, und warum das die riskantere Haelfte ist. Im
     * Dokument sitzen Tippflaechen MIT eigener Aktion oder IN einem Element
     * mit Aktion (am gebauten Buendel gezaehlt): der Wiki-Editor als
     * `div[contenteditable][data-action]`, `textarea#quick-notes`
     * INNERHALB von `div[data-action="backdrop-close"]`, 38
     * `input[type=checkbox]` in `label[data-action="toggle-selected"]`, 15
     * Suchfelder und ~45 Auswahllisten mit eigener Aktion. Ein Zweig, der
     * die Leertaste dort abfaengt, macht den Wiki-Editor unbenutzbar und
     * schliesst die Schnellnotizen beim Tippen. Die Schranke sitzt deshalb
     * an der QUELLE des Ereignisses, nicht am aufgeloesten Ziel — sonst
     * greift sie beim Textfeld in einer Schale mit Aktion nicht.
     *
     * KEINE ABSENDE-FALLE: der Quellbaum enthaelt 0 `<form>`-Elemente
     * (nachgezaehlt in Quelltext und gebautem Dokument). Enter kann hier
     * also kein Formular abschicken.
     */
    _handleKeydown(e) {
        if (!AUSLOESE_TASTEN.has(e.key)) return;

        // Jede Zusatztaste bleibt beim Browser. Strg+Enter, Alt+Leertaste
        // (Fenstermenue) und Shift+Enter sind keine Bedienung des
        // fokussierten Elements; ohne Eingriff bleibt das native Verhalten.
        if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

        const quelle = e.target;
        // `closest`/`click` fehlen z.B. auf document und auf SVG-Knoten.
        if (!quelle || typeof quelle.closest !== 'function' || typeof quelle.click !== 'function') {
            return;
        }

        // Tippflaechen behalten ihre Taste — gemessen an der QUELLE.
        if (this._tasteGehoertDerQuelle(quelle, e.key)) return;

        const ziel = quelle.closest('[data-action]');
        if (!ziel) return;

        // Nur bei einer REGISTRIERTEN Aktion eingreifen — dieselbe Schranke
        // wie im Klick-Zweig, der auch erst dann preventDefault() ruft.
        // Ohne sie wuerde die Taste an Elementen mit unbekannter Aktion
        // geschluckt, ohne dass etwas passiert.
        if (!this._handlers.has(ziel.dataset.action)) return;

        e.preventDefault();
        e.stopPropagation();

        // Gehaltene Taste: die Vorgabe bleibt unterdrueckt (kein Seitenlauf),
        // aber es loest nur der erste Anschlag aus. Ein nativer `<button>`
        // feuert beim Halten ebenfalls nicht fortlaufend.
        if (e.repeat) return;

        quelle.click();
    },

    /**
     * Braucht `el` die Taste `key` selbst? Dann laesst _handleKeydown sie
     * unberuehrt durch.
     * @param {HTMLElement} el Die QUELLE des Tastenereignisses
     * @param {string} key
     */
    _tasteGehoertDerQuelle(el, key) {
        if (el.isContentEditable) return true;

        const tag = el.tagName;
        // TEXTAREA: Enter macht einen Absatz, die Leertaste ein Leerzeichen.
        // SELECT: die Leertaste oeffnet die Liste, Enter bestaetigt.
        if (tag === 'TEXTAREA' || tag === 'SELECT') return true;

        if (tag === 'INPUT') return !KNOPFARTIGE_INPUT_TYPEN.has((el.type || '').toLowerCase());

        // Enter auf einem Verweis ist dessen eigene Handlung; daraus erzeugt
        // der Browser selbst ein `click`, das der Klick-Zweig ohnehin
        // bekommt. Die Leertaste rollt dort nur die Seite — die darf der
        // Zweig uebernehmen.
        if (tag === 'A' && key === 'Enter' && el.hasAttribute('href')) return true;

        return false;
    },

    _handleChange(e) {
        const target = e.target;

        // Prüfe zuerst auf data-action (neue konsistente Methode)
        const action = target.dataset.action;
        if (action && this._handlers.has(action)) {
            const id = target.dataset.id ? parseEntityId(target.dataset.id) : null;
            const type = target.dataset.type || null;
            const value = target.value || target.dataset.value || null;
            const ctx = { id, type, value, target, event: e };

            try {
                this._handlers.get(action)(ctx);
            } catch (actionError) {
                if (typeof ErrorHandler !== 'undefined') {
                    ErrorHandler.log('EventDelegation', actionError, `Action (change): ${action}`);
                } else {
                    // Letzter Ausweg falls ErrorHandler fehlt — siehe _handleClick (WR-02a).
                    console.error(`[EventDelegation] Fehler in Action "${action}":`, actionError); // gsd:konsolen-senke-fallback
                }
            }
            return;
        }

        // Fallback: Legacy data-on-change Handler
        const handlerName = target.dataset.onChange;
        if (!handlerName) return;

        // Whitelist-Validierung für Sicherheit
        if (!ALLOWED_CHANGE_HANDLERS.has(handlerName)) {
            // Unconditional (nicht mehr DEBUG_MODE-gated): ein geblockter, nicht
            // gelisteter Handler ist sicherheitsrelevant und muss auch im
            // Produktions-Build sichtbar sein — ErrorHandler.log() routet ohnehin
            // unconditional in die Konsole (siehe render/helpers.js), der zusätzliche
            // DEBUG_MODE-Guard war redundant und strenger zugleich (WR-02b, 13-REVIEW.md).
            if (typeof ErrorHandler !== 'undefined') {
                ErrorHandler.log(
                    'EventDelegation',
                    new Error(`Blocked unauthorized onChange handler: ${handlerName}`)
                );
            } else {
                console.error(`[EventDelegation] Blocked unauthorized onChange handler: ${handlerName}`); // gsd:konsolen-senke-fallback
            }
            return;
        }

        const fn = window[handlerName];
        if (typeof fn === 'function') {
            try {
                fn(target);
            } catch (changeError) {
                if (typeof ErrorHandler !== 'undefined') {
                    ErrorHandler.log('EventDelegation', changeError, `onChange: ${handlerName}`);
                } else {
                    console.error('[EventDelegation] onChange Fehler:', changeError); // gsd:konsolen-senke-fallback
                }
            }
        }
    },

    _handleInput(e) {
        const target = e.target;

        // Prüfe zuerst auf data-action (neue konsistente Methode)
        const action = target.dataset.action;
        if (action && this._handlers.has(action)) {
            const id = target.dataset.id ? parseEntityId(target.dataset.id) : null;
            const type = target.dataset.type || null;
            const value = target.value || target.dataset.value || null;
            const ctx = { id, type, value, target, event: e };

            try {
                this._handlers.get(action)(ctx);
            } catch (actionError) {
                if (typeof ErrorHandler !== 'undefined') {
                    ErrorHandler.log('EventDelegation', actionError, `Action (input): ${action}`);
                } else {
                    // Letzter Ausweg falls ErrorHandler fehlt — siehe _handleClick (WR-02a).
                    console.error(`[EventDelegation] Fehler in Action "${action}":`, actionError); // gsd:konsolen-senke-fallback
                }
            }
            return;
        }

        // Fallback: Legacy data-on-input Handler
        const handlerName = target.dataset.onInput;
        if (!handlerName) return;

        // Whitelist-Validierung für Sicherheit
        if (!ALLOWED_CHANGE_HANDLERS.has(handlerName)) {
            // Unconditional — siehe onChange-Zweig oben (WR-02b, 13-REVIEW.md).
            if (typeof ErrorHandler !== 'undefined') {
                ErrorHandler.log(
                    'EventDelegation',
                    new Error(`Blocked unauthorized onInput handler: ${handlerName}`)
                );
            } else {
                console.error(`[EventDelegation] Blocked unauthorized onInput handler: ${handlerName}`); // gsd:konsolen-senke-fallback
            }
            return;
        }

        const fn = window[handlerName];
        if (typeof fn === 'function') {
            try {
                fn(target);
            } catch (inputError) {
                if (typeof ErrorHandler !== 'undefined') {
                    ErrorHandler.log('EventDelegation', inputError, `onInput: ${handlerName}`);
                } else {
                    console.error('[EventDelegation] onInput Fehler:', inputError); // gsd:konsolen-senke-fallback
                }
            }
        }
    }
};

// ============================================================
