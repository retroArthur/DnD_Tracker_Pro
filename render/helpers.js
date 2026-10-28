// [SECTION:RENDER_HELPERS]
// ============================================================
// RENDER HELPER FUNCTIONS - @render @helper @component
// Wiederverwendbare Komponenten für Render-Funktionen
// ============================================================
/**
 * Error-Handler Konfiguration
 */
const ErrorHandler = {
    /** Letzte Fehler */
    _errorLog: [],
    /** Maximale Anzahl gespeicherter Fehler */
    _maxErrors: 50,
    /** Ob Fehler in der Konsole geloggt werden */
    _consoleLog: true,
    /** Ob Toast bei Fehlern angezeigt wird */
    _showToast: true,
    /** Ob ins Debug-Log geschrieben wird */
    _debugLog: true,
    /**
     * Loggt einen Fehler
     */
    log(fnName, error, context = '') {
        const err = error instanceof Error ? error : new Error(String(error));
        const entry = {
            time: new Date(),
            fn: fnName,
            error: err,
            context: context,
            message: err.message || String(error),
            stack: err.stack || ''
        };
        this._errorLog.unshift(entry);
        if (this._errorLog.length > this._maxErrors) {
            this._errorLog.pop();
        }
        if (this._consoleLog) {
            console.error(`[${fnName}]${context ? ` (${context})` : ''}:`, error); // gsd:konsolen-senke einziger sanktionierter Ausgang dieses Projekts
        }
        // Ins Debug-Log schreiben wenn verfügbar
        const debugLogAdd = window.debugLogAdd;
        if (this._debugLog && typeof debugLogAdd === 'function') {
            debugLogAdd(`⚠️ [${fnName}] ${context ? `(${context}) ` : ''}${entry.message}`);
        }
    },
    /**
     * Zeigt einen Fehler-Toast an (mit Debouncing)
     */
    _lastToastTime: 0,
    showError(message) {
        if (!this._showToast) return;
        // Debounce: Maximal ein Toast alle 2 Sekunden
        const now = Date.now();
        if (now - this._lastToastTime < 2000) return;
        this._lastToastTime = now;
        if (typeof showToast === 'function') {
            showToast(`⚠️ ${message}`, 'error');
        }
    },
    /**
     * Gibt die letzten Fehler zurück
     */
    getRecentErrors(count = 10) {
        return this._errorLog.slice(0, count);
    },
    /**
     * Leert das Error-Log
     */
    clearLog() {
        this._errorLog = [];
    }
};
/**
 * Wrapper für sichere Funktionsausführung
 */
function safeExecute(fn, fnName, options = {}) {
    const { fallback = null, showToast = false, toastMessage = null, onError = null } = options;
    try {
        return fn();
    } catch (error) {
        ErrorHandler.log(fnName, error);
        if (showToast) {
            ErrorHandler.showError(toastMessage || `Fehler in ${fnName}`);
        }
        if (onError) {
            try {
                onError(error);
            } catch (e) {
                if (window.APP_CONFIG?.DEBUG_MODE) {
                    ErrorHandler.log('safeExecute.onError', e, fnName);
                }
            }
        }
        return fallback;
    }
}
/**
 * Wrapper für sichere Render-Funktionen
 * Zeigt einen Fehler-State im Container bei Fehlern
 */
function safeRender(fn, fnName, containerId = null, options = {}) {
    const {
        showToastOnError = false,
        toastMessage = 'Anzeige konnte nicht aktualisiert werden',
        fallbackRender = null,
        rethrowInDebug = true
    } = options;
    const APP_CONFIG = window.APP_CONFIG;
    try {
        return fn();
    } catch (error) {
        ErrorHandler.log(fnName, error, 'Render failure');
        // Show toast notification if requested
        if (showToastOnError) {
            showToast(`⚠️ ${toastMessage}`, 'error');
        }
        // Try fallback render function
        if (fallbackRender) {
            try {
                fallbackRender();
            } catch (fallbackError) {
                ErrorHandler.log(fnName, fallbackError, 'Fallback render failed');
            }
        }
        // Versuche Fehler im Container anzuzeigen
        if (containerId) {
            const container = typeof containerId === 'string' ? $(containerId) : containerId;
            if (container) {
                const err = error;
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1;">
                        <div class="empty-state-icon">⚠️</div>
                        <div class="empty-state-title">Anzeigefehler</div>
                        <div class="empty-state-desc">Die Daten konnten nicht angezeigt werden.<br><small style="color:var(--text-dim);">${esc(err.message || 'Unbekannter Fehler')}</small></div>
                        <button class="btn" data-action="reload-page">🔄 Seite neu laden</button>
                    </div>
                `;
            }
        }
        // Re-throw in development mode for debugging
        if (rethrowInDebug && APP_CONFIG?.DEBUG_MODE) {
            throw error;
        }
        return undefined;
    }
}
/**
 * Validiert und repariert Entity-Daten
 */
function validateEntity(entity, schema) {
    if (!entity || typeof entity !== 'object') {
        return { ...schema };
    }
    const result = { ...entity };
    for (const [key, defaultValue] of Object.entries(schema)) {
        if (result[key] === undefined || result[key] === null) {
            result[key] = defaultValue;
        } else if (Array.isArray(defaultValue) && !Array.isArray(result[key])) {
            // Sollte Array sein, ist aber keins
            result[key] = defaultValue;
        } else if (typeof defaultValue === 'number' && typeof result[key] !== 'number') {
            // Sollte Nummer sein
            result[key] = parseInt(result[key]) || defaultValue;
        }
    }
    return result;
}
/**
 * Entity-Schemas für Validierung
 */
const ENTITY_SCHEMAS = {
    character: {
        id: 0,
        name: 'Unbenannt',
        level: 1,
        hpMax: 10,
        hpCurrent: 10,
        ac: 10,
        spells: [],
        items: [],
        attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
    },
    npc: {
        id: 0,
        name: 'Unbenannt',
        role: '',
        description: '',
        dialogs: [],
        triggers: []
    },
    location: {
        id: 0,
        name: 'Unbenannt',
        description: ''
    },
    quest: {
        id: 0,
        title: 'Unbenannt',
        description: '',
        completed: false,
        tracked: false
    },
    spell: {
        id: 0,
        name: 'Unbenannt',
        level: 0,
        school: ''
    },
    loot: {
        id: 0,
        name: 'Unbenannt',
        quantity: 1,
        value: 0,
        category: 'misc'
    },
    shop: {
        id: 0,
        name: 'Unbenannt',
        type: 'general',
        items: []
    },
    encounter: {
        id: 0,
        name: 'Unbenannt',
        hp: 10,
        ac: 10
    }
};
/**
 * Validiert das gesamte Daten-Objekt D
 * Repariert korrupte Daten wo möglich
 */
function validateDataIntegrity() {
    const D = window.D;
    const repairs = [];
    // Stelle sicher, dass D existiert
    if (typeof D !== 'object' || D === null) {
        // Fatalfall beim Start: läuft ohne DEBUG_MODE-Guard über den einen sanktionierten Ausgang
        ErrorHandler.log('validateDataIntegrity', new Error('Kritischer Fehler: D ist nicht definiert'));
        return { valid: false, repairs: ['D war nicht definiert'] };
    }
    // Prüfe und initialisiere Arrays
    const requiredArrays = [
        'characters',
        'npcs',
        'locations',
        'quests',
        'spells',
        'loot',
        'shops',
        'encounters',
        'sessionNotes',
        'wiki',
        'links',
        'filters',
        'timers'
    ];
    for (const key of requiredArrays) {
        if (!Array.isArray(D[key])) {
            D[key] = [];
            repairs.push(`${key} war kein Array, wurde initialisiert`);
        }
    }
    // Prüfe und initialisiere Objekte
    const requiredObjects = ['settings', 'campaign'];
    for (const key of requiredObjects) {
        if (typeof D[key] !== 'object' || D[key] === null) {
            D[key] = {};
            repairs.push(`${key} war kein Objekt, wurde initialisiert`);
        }
    }
    // Bestandsschaeden reparieren (Code-Review 2026-09-21, R03): ueberschreibende Importe
    // konnten doppelte IDs in ALLEN Register-Sammlungen hinterlassen — auch verschachtelten
    // (calendar.events, initiative.combatants), die die Pruefungen unten nicht kennen; das
    // Loeschen eines Kalender-Ereignisses entfernte dann jedes mit derselben ID.
    // normalizeEntityIds() laeuft VOR der ID-Pruefung unten: rein numerische Zeichenketten-IDs
    // ('5') werden zur Zahl, statt neu vergeben zu werden (Referenzen wie giverId bleiben
    // aufloesbar). Fuer gueltige, eindeutige Zahlen-IDs aendert es nichts — die kalibrierten
    // E2E-Seeds loesen weiterhin keine Reparatur aus.
    if (typeof window.normalizeEntityIds === 'function') {
        for (const change of window.normalizeEntityIds(D)) {
            const from = change.from === undefined ? 'fehlend' : JSON.stringify(change.from);
            repairs.push(`${change.type}: ID ${from} zu ${change.to} geändert`);
        }
    }
    // Prüfe auf Entities ohne ID
    const nextId = window.nextId;
    for (const [collection, schema] of [
        ['characters', ENTITY_SCHEMAS.character],
        ['npcs', ENTITY_SCHEMAS.npc],
        ['locations', ENTITY_SCHEMAS.location],
        ['quests', ENTITY_SCHEMAS.quest],
        ['spells', ENTITY_SCHEMAS.spell],
        ['loot', ENTITY_SCHEMAS.loot],
        ['shops', ENTITY_SCHEMAS.shop],
        ['encounters', ENTITY_SCHEMAS.encounter]
    ]) {
        if (!Array.isArray(D[collection])) continue;
        D[collection] = D[collection].filter((item, idx) => {
            if (!item || typeof item !== 'object') {
                repairs.push(`${collection}[${idx}] war ungültig, wurde entfernt`);
                return false;
            }
            // ID prüfen und ggf. generieren
            if (typeof item.id !== 'number' || isNaN(item.id)) {
                item.id = nextId(collection);
                repairs.push(`${collection}: ID für "${item.name || 'Unbenannt'}" generiert`);
            }
            return true;
        });
    }
    // Prüfe auf doppelte IDs
    for (const collection of requiredArrays) {
        if (!Array.isArray(D[collection])) continue;
        const ids = new Set();
        const duplicates = [];
        D[collection].forEach((item, idx) => {
            if (item && typeof item.id === 'number') {
                if (ids.has(item.id)) {
                    duplicates.push({ idx, id: item.id });
                }
                ids.add(item.id);
            }
        });
        // Korrigiere doppelte IDs
        for (const dup of duplicates) {
            const newId = nextId(collection);
            D[collection][dup.idx].id = newId;
            repairs.push(`${collection}: Doppelte ID ${dup.id} zu ${newId} geändert`);
        }
    }
    // Validate _nextId consistency
    const validateAndRepairNextId = window.validateAndRepairNextId;
    if (validateAndRepairNextId) {
        const nextIdValidation = validateAndRepairNextId();
        if (!nextIdValidation.valid) {
            repairs.push(...nextIdValidation.repairs);
        }
    }
    if (repairs.length > 0) {
        // Selbstheilung ist Normalverhalten, kein Fehler — nur ins in-App-Debug-Log,
        // nicht ueber den console.error-Kanal des einen sanktionierten Ausgangs
        // (sonst faelschlich als Konsolenfehler sichtbar, UAT 01: Konsolen-Hygiene beim Boot).
        if (window.APP_CONFIG?.DEBUG_MODE && typeof window.debugLogAdd === 'function') {
            window.debugLogAdd(`[validateDataIntegrity] Daten-Reparaturen durchgeführt: ${repairs.join('; ')}`);
        }
    }
    return { valid: repairs.length === 0, repairs };
}
/**
 * Repariert korrupte Daten-Arrays (aufrufbar vom UI)
 * Wird verwendet wenn Render-Funktionen korrupte Daten erkennen
 */
function repairDataArrays() {
    const save = window.save;
    const renderAll = window.renderAll;
    const result = validateDataIntegrity();
    if (result.repairs.length > 0) {
        showToast(`🔧 ${result.repairs.length} Reparaturen durchgeführt`, 'success');
        save();
        renderAll();
    } else {
        showToast('✅ Keine Reparaturen nötig', 'info');
    }
    return result;
}
/**
 * Repariert spezifisch D.characters (Legacy-Funktion)
 */
function repairCharactersData() {
    const D = window.D;
    const save = window.save;
    const renderAll = window.renderAll;
    if (!Array.isArray(D.characters)) {
        D.characters = [];
        showToast('🔧 D.characters repariert', 'success');
        save();
        renderAll();
    }
}
/**
 * Sichere JSON-Parse-Funktion
 */
function safeJSONParse(jsonString, fallback = null) {
    if (!jsonString || typeof jsonString !== 'string') {
        return fallback;
    }
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        ErrorHandler.log('safeJSONParse', error, jsonString.substring(0, 100));
        return fallback;
    }
}
/**
 * Sichere JSON-Stringify-Funktion
 */
function safeJSONStringify(value, fallback = '{}') {
    try {
        return JSON.stringify(value);
    } catch (error) {
        ErrorHandler.log('safeJSONStringify', error);
        return fallback;
    }
}
/**
 * Rendert einen Empty-State für leere Listen
 */
function renderEmptyState(config) {
    const {
        icon = '📭',
        titleEmpty = 'Keine Einträge',
        titleFiltered = 'Keine Einträge gefunden',
        descEmpty = 'Erstelle einen neuen Eintrag.',
        descFiltered = 'Versuche andere Filteroptionen.',
        buttonText = null,
        buttonAction = null,
        buttonValue = null,
        isFiltered = false,
        gridSpan = '1/-1'
    } = config;
    const title = isFiltered ? titleFiltered : titleEmpty;
    const desc = isFiltered ? descFiltered : descEmpty;
    const showButton = !isFiltered && buttonText && buttonAction;
    return `
        <div class="empty-state" style="grid-column: ${gridSpan};">
            <div class="empty-state-icon">${icon}</div>
            <div class="empty-state-title">${title}</div>
            <div class="empty-state-desc">${desc}</div>
            ${
                showButton
                    ? `
                <button class="btn btn-success"
                    data-action="${buttonAction}"
                    ${buttonValue ? `data-value="${buttonValue}"` : ''}
                    style="font-size: var(--text-lg); padding: 12px 24px;">
                    ${buttonText}
                </button>
            `
                    : ''
            }
        </div>
    `;
}
/**
 * Filtert eine Liste nach dem Inhalt eines Suchfelds (F-09).
 *
 * Ein Helfer statt dreier Kopien derselben vier Zeilen. Leeres oder fehlendes
 * Suchfeld liefert die Liste unveraendert zurueck — die Ansicht funktioniert
 * also auch dann, wenn ihr Suchfeld (noch) nicht im Markup steht.
 *
 * @param {Array} items
 * @param {string} inputId ID des Suchfelds
 * @param {(item: any) => string[]} fields liefert die durchsuchbaren Texte
 * @returns {Array}
 */
function filterBySearch(items, inputId, fields) {
    const el = $(inputId);
    const q = (el?.value || '').trim().toLowerCase();
    if (!q) return items;
    // Code-Review 2026-09-08: mehrere Aufrufstellen reichen Felder herein, die
    // als sanitizeHTML(innerHTML) gespeichert sind, also rohes Markup tragen
    // (session-prep strongStart, fraktionen agenda/beschreibung). Ohne das
    // Entfernen der Tags trifft eine Suche nach "div" oder "class" das Markup,
    // und ein durch <b> geteiltes Wort wird nicht gefunden. Ersetzt wird durch
    // die LEERE Zeichenkette, nicht durch ein Leerzeichen — so bleibt ein an
    // einer Formatierungsgrenze geteiltes Wort zusammenhaengend suchbar.
    // Gleiches Muster wie die Suche in renderSessions()
    // (features/sessions/sessions.js) — ueber den Funktionsnamen benannt: die
    // Zeilennummer, die hier stand, ist schon einmal gewandert.
    return items.filter(item =>
        fields(item).some(
            v =>
                typeof v === 'string' &&
                v.replace(/<[^>]+>/g, '').toLowerCase().includes(q)
        )
    );
}

/**
 * Setzt den Zaehler einer Ansicht (F-10).
 *
 * Die Zaehler-IDs hiessen frueher teils `<view>-io-count`, teils
 * `<view>-count`, und geschrieben wurde an einem Dutzend Stellen direkt per
 * textContent. Seit 2026-09-07 gilt EIN Schema: die ID ist der data-view-Wert
 * der Navigation plus `-count`, und geschrieben wird nur noch hier.
 *
 * @param {string} view data-view-Wert aus der Navigation, z.B. 'locations'
 * @param {number} n
 */
function setViewCount(view, n) {
    const el = $(view + '-count');
    if (el) el.textContent = String(n);
}

/**
 * Aktualisiert mehrere Counter-Elemente
 */
function updateCounters(counters) {
    for (const [id, value] of Object.entries(counters)) {
        const el = $(id);
        if (el) el.textContent = String(value);
    }
}
/**
 * Befüllt ein Filter-Dropdown mit Optionen
 */
function populateFilterDropdown(selectId, items, config = {}) {
    const select = $(selectId);
    if (!select) return false;
    const {
        allLabel = 'Alle',
        valueField = 'id',
        labelField = 'name',
        labelFn = null,
        preserveValue = true
    } = config;
    const currentValue = preserveValue ? select.value : '';
    select.innerHTML =
        `<option value="">${allLabel}</option>` +
        (items || [])
            .map(item => {
                const value = item[valueField];
                const label = labelFn ? labelFn(item) : esc(item[labelField] || '');
                return `<option value="${value}">${label}</option>`;
            })
            .join('');
    if (preserveValue && currentValue) {
        select.value = currentValue;
    }
    return true;
}
/**
 * Zentrales Entity-Lookup-System: ein Ort fuer "Eintrag zu Sammlung und ID",
 * statt ueberall eigener Array.find()-Aufrufe. Ohne Zwischenspeicher — jeder
 * Leser sieht, was im Moment des Aufrufs in D steht (siehe get()). Den
 * Schalter enableCache()/clearCache() samt seinen 23 Aufrufzeilen in acht
 * Darstellungsfunktionen gibt es seit RUECKSPRUNG nicht mehr.
 */
const EntityLookup = {
    /**
     * Holt eine Entity aus der entsprechenden Collection — immer das Objekt,
     * das im Moment des Aufrufs in D steht (Vertrag RUECKSPRUNG, R1,
     * docs/bugfixes.md). Nichts wird gemerkt, weder ein Treffer noch null.
     *
     * Bis RUECKSPRUNG legte get() bei eingeschaltetem Zwischenspeicher
     * (enableCache(), inzwischen entfernt) jeden Treffer als Objektreferenz
     * ab, und kein Schreiben machte das ungueltig.
     * Die Speicherpfade von Wiki, Links, Zaubern, Sitzungsnotizen und Truhe
     * ERSETZEN den Eintrag in D (`{ ...alt, ...neu }`), und eingeschaltet
     * blieb die Ablage nach jedem Laden ohne Kampf (renderInit() kehrt bei 0
     * Kaempfern frueh zurueck), nach dem DM-Screen ohne Grid-Widget, nach
     * Langer Rast, HP-Rechner, Zustand und nach jedem Wurf in einer der acht
     * Darstellungsfunktionen. Gemessen: das zweite ✏️ nach einem 💾 lud den
     * alten Stand, das naechste 💾 schrieb ihn zurueck — in D, im Speicher
     * und nach dem Neuladen. Eine Ablage, die an der Disziplin ihrer Aufrufer
     * haengt, ist hier die falsche Abwaegung. Der Preis ist gemessen: am
     * meisten zahlt renderParty(), das je Held jeden Zauber und jeden
     * Gegenstand sucht (20 Helden mit je 30 Zaubern und 20 Gegenstaenden aus
     * 500 bzw. 400: 1000 Aufrufe). Bei realistischer Verteilung kein
     * messbarer Unterschied, auch bei 4-fach gedrosselter CPU. Im kuenstlich
     * schlechtesten Fall — alle Helden tragen die 30 letzten Zauber und die
     * 20 letzten Gegenstaende — Median 1,2 → 3,4 ms, bei 4-fach gedrosselter
     * CPU 6,9 → 15,8 ms. Wird das je eng: einen Index, der je Aufruf frisch
     * aus D entsteht, keine Ablage ueber Aufrufe hinweg (R1).
     */
    get(type, id) {
        const D = window.D;
        const numId = parseEntityId(id);
        if (numId === null) return null;
        const collection = D[type];
        if (!Array.isArray(collection)) return null;
        return collection.find(item => item.id === numId) || null;
    },
    /**
     * Holt den Namen einer Entity
     */
    getName(type, id, fallback = '—') {
        const entity = this.get(type, id);
        return entity?.name || entity?.title || fallback;
    },
    /**
     * Prüft ob eine Entity existiert
     */
    exists(type, id) {
        return this.get(type, id) !== null;
    },
    /**
     * Sucht Entity nach Name (case-insensitive)
     */
    findByName(type, name, nameField = 'name') {
        const D = window.D;
        if (!name || typeof name !== 'string') return null;
        const collection = D[type];
        if (!Array.isArray(collection)) return null;
        const lowerName = name.toLowerCase();
        return (
            collection.find(item => {
                const itemName = item[nameField];
                return itemName && itemName.toLowerCase() === lowerName;
            }) || null
        );
    },
    // Convenience-Methoden für häufige Entity-Typen
    location(id) {
        return this.get('locations', id);
    },
    npc(id) {
        return this.get('npcs', id);
    },
    character(id) {
        return this.get('characters', id);
    },
    quest(id) {
        return this.get('quests', id);
    },
    spell(id) {
        return this.get('spells', id);
    },
    lootItem(id) {
        return this.get('loot', id);
    },
    encounter(id) {
        return this.get('encounters', id);
    },
    shop(id) {
        return this.get('shops', id);
    },
    wiki(id) {
        return this.get('wiki', id);
    },
    sessionNote(id) {
        return this.get('sessionNotes', id);
    },
    filter(id) {
        return this.get('filters', id);
    },
    link(id) {
        return this.get('links', id);
    }
};
/**
 * Get comprehensive entity details for combat/display
 * Centralizes entity lookup pattern used across combat and rendering
 * encounterId (optional): Kaempfer aus dem Encounter-Rechner tragen die ID ihres
 * Encounters (RECHNER) — "Skelett #2" findet ueber den Namen nichts, die ID schon.
 */
function getEntityForCombat(entityType, entityName, encounterId) {
    let entity = null;
    let ac = '?';
    let type = null;
    let id = null;
    if (entityType === 'player') {
        entity = EntityLookup.findByName('characters', entityName);
        if (entity) {
            ac = entity.ac || entity.armorClass || 10;
            type = 'characters';
            id = entity.id;
        }
    } else if (entityType === 'enemy') {
        // Check encounters first, then NPCs. Die ID direkt in D.encounters — so
        // geschrieben, als EntityLookup noch einen Zwischenspeicher hatte, der ein
        // ersetztes Objekt festhielt; seit RUECKSPRUNG liest EntityLookup.encounter()
        // ebenso frisch, beide Wege sind gleichwertig.
        const encId = parseEntityId(encounterId);
        entity =
            (encId !== null && (window.D.encounters || []).find(e => e.id === encId)) ||
            EntityLookup.findByName('encounters', entityName);
        if (entity) {
            ac = entity.ac || entity.armorClass || 10;
            type = 'encounters';
            id = entity.id;
        } else {
            entity = EntityLookup.findByName('npcs', entityName);
            if (entity) {
                ac = entity.ac || 10;
                type = 'npcs';
                id = entity.id;
            }
        }
    } else if (entityType === 'ally') {
        entity = EntityLookup.findByName('npcs', entityName);
        if (entity) {
            ac = entity.ac || 10;
            type = 'npcs';
            id = entity.id;
        }
    }
    return {
        entity,
        ac,
        type,
        id,
        notFound: entity === null
    };
}
/**
 * Entity-Typ-Konfiguration für Links
 */
const ENTITY_TYPE_CONFIG = {
    npcs: { icon: '🎭', label: 'NPC' },
    locations: { icon: '📍', label: 'Ort' },
    characters: { icon: '👤', label: 'Charakter' },
    quests: { icon: '📜', label: 'Quest' },
    spells: { icon: '✨', label: 'Zauber' },
    loot: { icon: '📦', label: 'Gegenstand' },
    encounters: { icon: '👹', label: 'Gegner' },
    shops: { icon: '🏪', label: 'Shop' },
    wiki: { icon: '📖', label: 'Wiki' }
};
/**
 * Rendert einen klickbaren Entity-Link
 */
function renderEntityLink(type, id, label, options = {}) {
    const {
        icon = ENTITY_TYPE_CONFIG[type]?.icon || '',
        showIcon = true,
        fallbackColor = 'var(--gold)',
        className = ''
    } = options;
    const iconHtml = showIcon && icon ? `${icon} ` : '';
    const escapedLabel = esc(label || '—');
    // Kein Link wenn keine ID
    if (!id) {
        return `<span style="color: ${fallbackColor};">${iconHtml}${escapedLabel}</span>`;
    }
    // Verwende data-action System für korrekte Event-Propagation
    return `<span class="entity-link clickable ${className}"
        data-action="navigate-entity"
        data-type="${type}"
        data-id="${id}"
        title="Klicken für Details"
        style="cursor: pointer;">
        ${iconHtml}${escapedLabel}
    </span>`;
}
/**
 * Rendert mehrere Entity-Links als Badges/Tags
 */
function renderEntityLinkList(type, ids, options = {}, maxShow = 5) {
    if (!ids?.length) return '';
    const visibleIds = ids.slice(0, maxShow);
    const hiddenCount = ids.length - maxShow;
    const links = visibleIds
        .map(id => {
            const entity = EntityLookup.get(type, id);
            const name = entity?.name || entity?.title || `#${id}`;
            return renderEntityLink(type, id, name, options);
        })
        .join(' ');
    const moreIndicator =
        hiddenCount > 0
            ? `<span class="entity-link-more" style="color: var(--text-dim);">+${hiddenCount}</span>`
            : '';
    return links + moreIndicator;
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
// Export to window for backward compatibility
window.ErrorHandler = ErrorHandler;
window.safeExecute = safeExecute;
window.ENTITY_SCHEMAS = ENTITY_SCHEMAS;
window.validateDataIntegrity = validateDataIntegrity;
window.repairDataArrays = repairDataArrays;
window.repairCharactersData = repairCharactersData;
window.safeJSONParse = safeJSONParse;
window.safeJSONStringify = safeJSONStringify;
window.renderEmptyState = renderEmptyState;
window.updateCounters = updateCounters;
window.setViewCount = setViewCount;
window.filterBySearch = filterBySearch;
window.populateFilterDropdown = populateFilterDropdown;
window.EntityLookup = EntityLookup;
window.getEntityForCombat = getEntityForCombat;
window.ENTITY_TYPE_CONFIG = ENTITY_TYPE_CONFIG;
window.renderEntityLink = renderEntityLink;
