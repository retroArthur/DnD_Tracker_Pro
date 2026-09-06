// [SECTION:TAB_REGISTRY]
// Tab Navigation Registry
// Centralized mapping of tabs to their render functions
//
// MAINT-02 (Plan 13-04): Jeder Eintrag referenziert seine Funktion nicht mehr
// als Zeichenkette (`'renderDashboard'`), sondern als verzögerte Funktions-
// referenz — ein parameterloser Pfeilausdruck, dessen Rumpf den Bezeichner
// nennt und zurückgibt (nicht aufruft): `() => renderDashboard`. Das macht
// den Bezeichner im Quelltext statisch sichtbar (Grep/ESLint/IDE-Suche
// finden ihn), löst ihn aber erst auf, wenn die Registry benutzt wird — also
// NACHDEM alle Module geladen sind. Das ist zwingend im Loader-Modus
// (index.html + loader.js): systems/tab-registry.js läuft als eigenes
// <script> VOR allen Feature-Modulen; eine direkte Referenz im Literal würde
// dort beim Laden einen ReferenceError werfen. Siehe resolveTabFn() unten.
/**
 * Tab-Render Registry - Maps tab names to their associated render functions
 */
const TAB_RENDER_REGISTRY = {
    dashboard: {
        renders: [() => renderDashboard],
        init: null,
        cleanup: null
    },
    party: {
        renders: [() => renderParty],
        init: null,
        cleanup: null
    },
    npcs: {
        renders: [() => renderNPCList],
        init: null,
        cleanup: null
    },
    locations: {
        renders: [() => renderLocations],
        init: null,
        cleanup: null
    },
    quests: {
        renders: [() => renderQuests],
        init: null,
        cleanup: null
    },
    encounter: {
        renders: [() => renderEncounters],
        init: null,
        cleanup: null
    },
    initiative: {
        renders: [() => renderInit, () => renderBattlefieldBanner, () => renderQuickActionsBar],
        init: null,
        cleanup: null
    },
    loot: {
        renders: [() => renderLoot],
        init: null,
        cleanup: null
    },
    shops: {
        renders: [() => renderShops],
        init: null,
        cleanup: null
    },
    spells: {
        renders: [() => renderSpells],
        init: null,
        cleanup: null
    },
    notes: {
        renders: [() => renderSessions],
        init: null,
        cleanup: null
    },
    wiki: {
        renders: [() => renderWiki],
        init: null,
        cleanup: null
    },
    links: {
        renders: [() => renderLinks],
        init: null,
        cleanup: null
    },
    dice: {
        renders: [() => renderRandomTables, () => renderDiceHistory, () => renderDiceFavorites],
        // MAINT-02: `initDiceTab` referenzierte nie eine existierende Funktion
        // (kein Commit in der Historie hat sie je definiert) — die
        // String-Form liess das bisher stillschweigend durchgehen, weil
        // renderTabContent() fehlende init-Funktionen nicht meldet. Auf
        // `null` korrigiert: identisches Laufzeitverhalten (init lief noch
        // nie), aber die Registry behauptet jetzt nicht mehr faelschlich,
        // es gaebe eine Initialisierung.
        init: null,
        cleanup: null
    },
    timers: {
        renders: [() => renderTimers, () => renderTimerPresets],
        init: null,
        cleanup: () => cleanupTimers // Clear interval when leaving tab
    },
    data: {
        renders: [() => renderBackupStatus], // Datei-Backup-Status (D-17) — Rest sind Formulare
        init: null,
        cleanup: null
    },
    dmscreen: {
        renders: [() => renderDMScreen],
        init: null,
        cleanup: null
    },
    bestiary: {
        renders: [() => renderBestiaryList],
        init: null,
        cleanup: () => cleanupBestiaryEditor
    },
    // Phase 5: Welt & Story
    sessionprep: {
        renders: [() => renderSessionPrepList],
        init: null,
        cleanup: null
    },
    kalender: {
        renders: [() => renderTimeline, () => renderKalender],
        init: null,
        cleanup: null
    },
    reise: {
        renders: [() => renderReise],
        init: null,
        cleanup: null
    },
    fraktionen: {
        renders: [() => renderFraktionen],
        init: null,
        cleanup: null
    },
    // Phase 7: Komfort & Analyse
    soundboard: {
        renders: [() => renderSoundboard],
        init: null,
        cleanup: null
    },
    dicestats: {
        renders: [() => renderDiceStats],
        init: null,
        cleanup: null
    }
};
/**
 * Löst eine verzögerte Registry-Referenz auf.
 * `entry` ist entweder `null` (kein Hook konfiguriert) oder ein
 * parameterloser Pfeilausdruck, dessen Rumpf einen Funktionsbezeichner nennt
 * und zurückgibt, z. B. `() => renderDashboard`. Ein Bezeichner, der (noch)
 * nicht existiert, wirft beim Auswerten einen ReferenceError — der wird hier
 * gefangen, damit ein fehlender/umbenannter Eintrag die App nicht zum
 * Absturz bringt (Laufzeitverhalten bleibt wie bei der alten String-Form:
 * stiller Ausfall dieses einen Eintrags).
 * @param {(() => Function)|null} entry
 * @returns {Function|null}
 */
function resolveTabFn(entry) {
    if (typeof entry !== 'function') return null;
    try {
        const resolved = entry();
        return typeof resolved === 'function' ? resolved : null;
    } catch (err) {
        return null;
    }
}
/**
 * Extrahiert den Bezeichner aus einer verzögerten Registry-Referenz für
 * Diagnosemeldungen — z. B. `() => renderDashboard` -> `'renderDashboard'`.
 * @param {(() => Function)|null} entry
 * @returns {string}
 */
function tabFnName(entry) {
    if (typeof entry !== 'function') return '(kein Eintrag)';
    const match = entry.toString().match(/=>\s*([A-Za-z_$][\w$]*)/);
    return match ? match[1] : '(unbekannt)';
}
/**
 * Execute all render functions for a given tab
 * Provides error handling and validation
 *
 * @param tabName - The tab identifier (e.g., 'dice', 'initiative')
 */
function renderTabContent(tabName) {
    const tabConfig = TAB_RENDER_REGISTRY[tabName];
    if (!tabConfig) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            console.warn(`[TabRegistry] No config for tab: ${tabName}`);
        }
        return;
    }
    // Call init function if it exists and hasn't been called yet
    if (tabConfig.init && !tabConfig._initialized) {
        const initFn = resolveTabFn(tabConfig.init);
        if (initFn) {
            try {
                initFn();
                tabConfig._initialized = true;
                if (window.APP_CONFIG?.DEBUG_MODE) {
                    console.log(`[TabRegistry] Init ${tabFnName(tabConfig.init)}() for tab ${tabName}`);
                }
            } catch (err) {
                console.error(`[TabRegistry] Init failed for ${tabName}:`, err);
            }
        }
    }
    // Call all render functions
    tabConfig.renders.forEach(renderEntry => {
        const renderFn = resolveTabFn(renderEntry);
        if (renderFn) {
            try {
                renderFn();
                if (window.APP_CONFIG?.DEBUG_MODE) {
                    console.log(`[TabRegistry] Rendered ${tabFnName(renderEntry)}() for tab ${tabName}`);
                }
            } catch (err) {
                console.error(
                    `[TabRegistry] Render ${tabFnName(renderEntry)}() failed for tab ${tabName}:`,
                    err
                );
            }
        } else {
            console.warn(`[TabRegistry] Function ${tabFnName(renderEntry)} not found for tab ${tabName}`);
        }
    });
}
/**
 * Validate the tab registry on app startup (DEBUG mode only)
 * Checks for missing functions and invalid configurations
 */
function validateTabRegistry() {
    if (!window.APP_CONFIG?.DEBUG_MODE) return;
    console.log('[TabRegistry] Validating registry...');
    let errors = 0;
    let warnings = 0;
    Object.entries(TAB_RENDER_REGISTRY).forEach(([tabName, config]) => {
        // Check if render functions exist
        config.renders.forEach(renderEntry => {
            if (!resolveTabFn(renderEntry)) {
                console.error(
                    `[TabRegistry] Missing render function: ${tabFnName(renderEntry)} for tab ${tabName}`
                );
                errors++;
            }
        });
        // Check if init functions exist
        if (config.init && !resolveTabFn(config.init)) {
            console.warn(
                `[TabRegistry] Missing init function: ${tabFnName(config.init)} for tab ${tabName}`
            );
            warnings++;
        }
        // Check if cleanup functions exist
        if (config.cleanup && !resolveTabFn(config.cleanup)) {
            console.warn(
                `[TabRegistry] Missing cleanup function: ${tabFnName(config.cleanup)} for tab ${tabName}`
            );
            warnings++;
        }
    });
    if (errors > 0 || warnings > 0) {
        console.warn(`[TabRegistry] Validation complete: ${errors} errors, ${warnings} warnings`);
    } else {
        console.log('[TabRegistry] Validation complete: No issues found ✓');
    }
}
// ============================================================
