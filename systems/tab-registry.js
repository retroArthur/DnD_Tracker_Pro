// [SECTION:TAB_REGISTRY]
// Tab Navigation Registry
// Centralized mapping of tabs to their render functions
/**
 * Tab-Render Registry - Maps tab names to their associated render functions
 */
const TAB_RENDER_REGISTRY = {
    dashboard: {
        renders: ['renderDashboard'],
        init: null,
        cleanup: null
    },
    party: {
        renders: ['renderParty'],
        init: null,
        cleanup: null
    },
    npcs: {
        renders: ['renderNPCList'],
        init: null,
        cleanup: null
    },
    locations: {
        renders: ['renderLocations'],
        init: null,
        cleanup: null
    },
    quests: {
        renders: ['renderQuests'],
        init: null,
        cleanup: null
    },
    encounter: {
        renders: ['renderEncounters'],
        init: null,
        cleanup: null
    },
    initiative: {
        renders: ['renderInit', 'renderBattlefieldBanner', 'renderQuickActionsBar'],
        init: null,
        cleanup: null
    },
    loot: {
        renders: ['renderLoot'],
        init: null,
        cleanup: null
    },
    shops: {
        renders: ['renderShops'],
        init: null,
        cleanup: null
    },
    spells: {
        renders: ['renderSpells'],
        init: null,
        cleanup: null
    },
    notes: {
        renders: ['renderSessions'],
        init: null,
        cleanup: null
    },
    wiki: {
        renders: ['renderWiki'],
        init: null,
        cleanup: null
    },
    links: {
        renders: ['renderLinks'],
        init: null,
        cleanup: null
    },
    dice: {
        renders: ['renderRandomTables', 'renderDiceHistory', 'renderDiceFavorites'],
        init: 'initDiceTab', // Called once when first shown
        cleanup: null
    },
    timers: {
        renders: ['renderTimers', 'renderTimerPresets'],
        init: null,
        cleanup: 'cleanupTimers' // Clear interval when leaving tab
    },
    data: {
        renders: ['renderBackupStatus'], // Datei-Backup-Status (D-17) — Rest sind Formulare
        init: null,
        cleanup: null
    },
    dmscreen: {
        renders: ['renderDMScreen'],
        init: null,
        cleanup: null
    },
    bestiary: {
        renders: ['renderBestiaryList'],
        init: null,
        cleanup: 'cleanupBestiaryEditor'
    },
    // Phase 5: Welt & Story
    sessionprep: {
        renders: ['renderSessionPrepList'],
        init: null,
        cleanup: null
    },
    kalender: {
        renders: ['renderTimeline', 'renderKalender'],
        init: null,
        cleanup: null
    },
    reise: {
        renders: ['renderReise'],
        init: null,
        cleanup: null
    },
    fraktionen: {
        renders: ['renderFraktionen'],
        init: null,
        cleanup: null
    }
};
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
    if (tabConfig.init && typeof window[tabConfig.init] === 'function') {
        if (!tabConfig._initialized) {
            try {
                window[tabConfig.init]();
                tabConfig._initialized = true;
                if (window.APP_CONFIG?.DEBUG_MODE) {
                    console.log(`[TabRegistry] Init ${tabConfig.init}() for tab ${tabName}`);
                }
            } catch (err) {
                console.error(`[TabRegistry] Init failed for ${tabName}:`, err);
            }
        }
    }
    // Call all render functions
    tabConfig.renders.forEach(renderFn => {
        if (typeof window[renderFn] === 'function') {
            try {
                window[renderFn]();
                if (window.APP_CONFIG?.DEBUG_MODE) {
                    console.log(`[TabRegistry] Rendered ${renderFn}() for tab ${tabName}`);
                }
            } catch (err) {
                console.error(`[TabRegistry] Render ${renderFn}() failed for tab ${tabName}:`, err);
            }
        } else {
            console.warn(`[TabRegistry] Function ${renderFn} not found for tab ${tabName}`);
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
        config.renders.forEach(renderFn => {
            if (typeof window[renderFn] !== 'function') {
                console.error(
                    `[TabRegistry] Missing render function: ${renderFn} for tab ${tabName}`
                );
                errors++;
            }
        });
        // Check if init functions exist
        if (config.init && typeof window[config.init] !== 'function') {
            console.warn(`[TabRegistry] Missing init function: ${config.init} for tab ${tabName}`);
            warnings++;
        }
        // Check if cleanup functions exist
        if (config.cleanup && typeof window[config.cleanup] !== 'function') {
            console.warn(
                `[TabRegistry] Missing cleanup function: ${config.cleanup} for tab ${tabName}`
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
