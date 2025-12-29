// D&D Tracker Module Loader
// Lädt alle Module in der richtigen Reihenfolge
// WICHTIG: Nutzt normale Skripte (nicht ES6 Module), um globale Variablen beizubehalten

// Debug-Logging (nur in Entwicklung)
const DEBUG_LOADER = false;
const logLoader = DEBUG_LOADER ? console.log.bind(console) : () => {};

const MODULES = [
    // Core (muss zuerst geladen werden)
    'core/config.js',      // APP_CONFIG muss zuerst da sein
    'core/data.js',
    'core/constants.js',
    
    // Utils
    'utils/performance.js',
    'utils/basic.js',
    'utils/utilities.js',
    
    // Systems
    'systems/undo.js',
    // Spellslots-Module (ersetzt systems/spellslots.js)
    'systems/spellslots/spell-slots-core.js',
    'systems/spellslots/notes-templates.js',
    'systems/spellslots/quick-reference.js',
    'systems/spellslots/pwa-install.js',
    'systems/spellslots/version-migration.js',
    'systems/spellslots/virtual-list.js',
    'systems/spellslots/keyboard-shortcuts.js',
    'systems/spellslots/persistence.js',
    'systems/spellslots/quick-roll.js',
    'systems/spellslots/import-export.js',
    'systems/spellslots/navigation.js',
    'systems/conditions.js',
    'systems/hp-calculator.js',
    'systems/tags.js',
    'systems/entity-links.js',
    'systems/avatars.js',
    'systems/backups.js',
    
    // Render
    'render/helpers.js',
    // Render-Feature-Module (ersetzt render/main.js)
    'features/render-dashboard.js',
    // Party-Module (ersetzt render-party.js)
    'features/party/party-render.js',
    'features/party/party-details.js',
    'features/party/party-crud.js',
    'features/render-spells.js',
    // Locations-Module (ersetzt render-locations.js)
    'features/locations/locations-render.js',
    'features/locations/locations-crud.js',
    'features/render-loot.js',
    // NPC-Module (ersetzt render-npcs.js)
    'features/npcs/npc-render.js',
    'features/npcs/npc-interactions.js',
    'features/npcs/npc-dialogs.js',
    'features/npcs/npc-crud.js',
    'features/npcs/npc-popup.js',
    // Quests-Module (ersetzt render-quests.js)
    'features/quests/quests-render.js',
    'features/quests/quests-crud.js',
    // Encounters-Module (ersetzt render-encounters.js)
    'features/encounters/encounters-render.js',
    'features/encounters/encounters-crud.js',
    
    // Features
    'features/initiative.js',
    'features/encounter-calculator.js',

    // Dice-Module (ersetzt features/dice.js)
    'features/dice/campaign-manager.js',
    'features/dice/dice-core.js',
    'features/dice/dice-favorites.js',
    'features/dice/timers.js',
    'features/dice/maps.js',
    'features/dice/theme.js',
    'features/dice/layout-profiles.js',
    'features/dice/session-timer.js',
    'features/dice/global-search.js',
    'features/dice/spellslots-ui.js',
    'features/dice/initiative-extras.js',
    'features/dice/wiki-links.js',
    'features/dice/srd-spells.js',
    'features/dice/monster-templates.js',
    'features/dice/performance-extras.js',
    'features/dice/debug.js',

    // Shops-Module (ersetzt features/shops.js)
    'features/shops/shops-prolog.js',
    'features/shops/shops-core.js',
    'features/shops/links.js',
    'features/shops/wiki.js',
    'features/shops/mindmap.js',
    'features/shops/sessions.js',
    'features/shops/spell-editor.js',
    
    // UI
    'ui/virtual-scroll-helper.js',
    'ui/lazy-loading.js',
    'ui/event-delegation.js',

    // Action-Module (müssen nach event-delegation.js geladen werden)
    'ui/actions/entity-actions.js',
    'ui/actions/combat-actions.js',
    'ui/actions/ui-actions.js',
    'ui/actions/dice-actions.js',
    'ui/actions/wiki-actions.js',
    'ui/actions/shop-actions.js',
    'ui/actions/map-actions.js',
    'ui/actions/system-actions.js',

    'ui/virtual-scroll.js',

    // Init (muss zuletzt geladen werden)
    'core/init.js'
];

async function loadModules() {
    logLoader('🚀 Lade D&D Tracker Module...');
    logLoader(`📦 ${MODULES.length} Module werden geladen...`);

    // Lade HTML Body zuerst
    try {
        const response = await fetch('assets/body.html');
        const bodyHTML = await response.text();
        document.getElementById('app-root').innerHTML = bodyHTML;
        logLoader('✓ HTML Body geladen');
    } catch (error) {
        console.error('❌ Fehler beim Laden des HTML Body:', error);
        throw error;
    }

    // Lade alle JavaScript-Module sequenziell
    let loadedCount = 0;
    for (const module of MODULES) {
        try {
            const script = document.createElement('script');
            script.src = module;
            // KEIN type="module" - nutze normale Skripte für globale Variablen

            await new Promise((resolve, reject) => {
                script.onload = () => {
                    loadedCount++;
                    logLoader(`✓ [${loadedCount}/${MODULES.length}] ${module}`);
                    resolve();
                };
                script.onerror = (error) => {
                    console.error(`❌ Fehler in ${module}:`, error);
                    reject(error);
                };
                document.head.appendChild(script);
            });

        } catch (error) {
            console.error(`❌ Kritischer Fehler beim Laden von ${module}:`, error);
            // Fortfahren trotz Fehler, um zu sehen, welche Module funktionieren
        }
    }

    logLoader(`✅ ${loadedCount}/${MODULES.length} Module erfolgreich geladen`);

    // Rufe init() auf, nachdem alle Module geladen sind
    logLoader('🚀 Starte Initialisierung...');
    if (typeof init === 'function') {
        try {
            await init();
            logLoader('✅ Initialisierung abgeschlossen');
        } catch (error) {
            console.error('❌ Fehler bei der Initialisierung:', error);
            throw error;
        }
    } else {
        console.error('❌ init() Funktion nicht gefunden!');
    }
}

// Start loading when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadModules().catch(error => {
            console.error('❌ Kritischer Fehler beim Laden der Module:', error);
            document.getElementById('app-root').innerHTML = `
                <div style="padding: 40px; text-align: center; color: #ef4444; font-family: Arial, sans-serif;">
                    <h1 style="font-size: 2em; margin-bottom: 20px;">⚠️ Fehler beim Laden</h1>
                    <p style="font-size: 1.2em; margin-bottom: 10px;">Die Anwendung konnte nicht geladen werden.</p>
                    <p style="color: #888;">Bitte überprüfen Sie die Browser-Konsole (F12) für Details.</p>
                    <details style="margin-top: 20px; text-align: left; background: #1a1a1a; padding: 20px; border-radius: 8px;">
                        <summary style="cursor: pointer; font-weight: bold;">Fehlerdetails anzeigen</summary>
                        <pre style="margin-top: 10px; color: #ff6b6b; font-family: monospace; overflow-x: auto;">${error.stack || error.message || error}</pre>
                    </details>
                </div>
            `;
        });
    });
} else {
    loadModules().catch(error => {
        console.error('❌ Kritischer Fehler beim Laden der Module:', error);
        document.getElementById('app-root').innerHTML = `
            <div style="padding: 40px; text-align: center; color: #ef4444; font-family: Arial, sans-serif;">
                <h1 style="font-size: 2em; margin-bottom: 20px;">⚠️ Fehler beim Laden</h1>
                <p style="font-size: 1.2em; margin-bottom: 10px;">Die Anwendung konnte nicht geladen werden.</p>
                <p style="color: #888;">Bitte überprüfen Sie die Browser-Konsole (F12) für Details.</p>
                <details style="margin-top: 20px; text-align: left; background: #1a1a1a; padding: 20px; border-radius: 8px;">
                    <summary style="cursor: pointer; font-weight: bold;">Fehlerdetails anzeigen</summary>
                    <pre style="margin-top: 10px; color: #ff6b6b; font-family: monospace; overflow-x: auto;">${error.stack || error.message || error}</pre>
                </details>
            </div>
        `;
    });
}
