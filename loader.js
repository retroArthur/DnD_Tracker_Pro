// D&D Tracker Module Loader
// Lädt alle Module in der richtigen Reihenfolge
// WICHTIG: Nutzt normale Skripte (nicht ES6 Module), um globale Variablen beizubehalten

// Debug-Logging (nur in Entwicklung)
const DEBUG_LOADER = false;
const logLoader = DEBUG_LOADER ? console.log.bind(console) : () => {};

// WICHTIG: Diese Liste muss mit build.py synchron bleiben!
const MODULES = [
    // Core (muss zuerst geladen werden)
    'core/config.js',
    'core/data.js',
    'core/constants.js',
    'core/themes.js',

    // Utils
    'utils/performance.js',
    'utils/basic.js',
    'utils/utilities.js',
    'utils/crud-helpers.js',
    'utils/validation.js',
    'utils/form-helpers.js',
    'utils/filter-engine.js',
    'utils/game-rules.js',

    // Systems
    'systems/undo.js',
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
    'systems/tab-registry.js',
    'systems/session-timer.js',
    'systems/search/global-search.js',
    'systems/campaign-manager/campaign-manager.js',

    // Render
    'render/helpers.js',
    'features/render-dashboard.js',
    'features/party/party-render.js',
    'features/party/party-details.js',
    'features/party/party-crud.js',
    'features/render-spells.js',
    'features/locations/locations-render.js',
    'features/locations/locations-crud.js',
    'features/render-loot.js',
    'features/npcs/npc-render.js',
    'features/npcs/npc-interactions.js',
    'features/npcs/npc-dialogs.js',
    'features/npcs/npc-crud.js',
    'features/npcs/npc-popup.js',
    'features/quests/quests-render.js',
    'features/quests/quests-crud.js',
    'features/encounters/encounters-render.js',
    'features/encounters/encounters-crud.js',

    // Features
    'features/encounter-calculator.js',
    'features/initiative.js',
    'features/rest-manager.js',
    'features/quick-actions.js',
    'features/random-tables.js',
    'features/loot-distribution.js',
    'features/sessions/sessions.js',
    'features/wiki/wiki.js',
    'features/shops/shops-core.js',
    'features/shops/shop-export.js',
    'features/shops/links.js',

    // DM Screen
    'features/dmscreen/dmscreen-render.js',

    // Dice
    'features/dice/dice-core.js',
    'features/dice/dice-favorites.js',

    // Verschoben aus dice/ in passende Ordner
    'features/timers/timers.js',
    'systems/wiki-links.js',
    'features/encounters/monster-templates.js',
    'core/srd-spells.js',
    'systems/spellslots/spellslots-ui.js',
    'features/initiative-extras.js',
    'ui/layout-profiles.js',
    'utils/performance-extras.js',

    // UI
    'ui/dom-builder.js',
    'ui/safe-render.js',
    'ui/lazy-loading.js',
    'ui/event-delegation.js',
    'ui/editors/rich-text.js',
    'ui/editors/markdown-shortcuts.js',
    'ui/editors/markdown-converter.js',
    'systems/markdown-import-export.js',

    // Action-Module (nach event-delegation.js)
    'ui/actions/entity-actions.js',
    'ui/actions/combat-actions.js',
    'ui/actions/ui-actions.js',
    'ui/actions/dice-actions.js',
    'ui/actions/wiki-actions.js',
    'ui/actions/shop-actions.js',
    'ui/actions/system-actions.js',
    'ui/virtual-scroll.js',
    'tools/debug.js',

    // Init (muss zuletzt geladen werden)
    'core/init.js'
];

// Zeigt Loading-Indikator während des Modulladens
function showLoadingIndicator() {
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = `
        <div id="loading-screen" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #0f0f0f;
            color: #e0e0e0;
            font-family: 'Segoe UI', Arial, sans-serif;
        ">
            <div style="font-size: 3em; margin-bottom: 20px;">⚔️</div>
            <h1 style="margin: 0 0 10px 0; font-size: 1.5em; color: #fbbf24;">D&D Tracker</h1>
            <p id="loading-status" style="color: #888; margin: 0 0 20px 0;">Lade Module...</p>
            <div style="width: 250px; height: 6px; background: #2a2a2a; border-radius: 3px; overflow: hidden;">
                <div id="loading-bar" style="
                    width: 0%;
                    height: 100%;
                    background: linear-gradient(90deg, #fbbf24, #f59e0b);
                    transition: width 0.15s ease-out;
                "></div>
            </div>
            <p id="loading-count" style="color: #666; font-size: 0.85em; margin-top: 10px;">0 / ${MODULES.length}</p>
        </div>
    `;
}

function updateLoadingProgress(loaded, total, currentModule) {
    const bar = document.getElementById('loading-bar');
    const count = document.getElementById('loading-count');
    const status = document.getElementById('loading-status');
    if (bar) bar.style.width = `${(loaded / total) * 100}%`;
    if (count) count.textContent = `${loaded} / ${total}`;
    if (status && currentModule) {
        // Zeige nur Modulname ohne Pfad
        const shortName = currentModule.split('/').pop().replace('.js', '');
        status.textContent = `Lade ${shortName}...`;
    }
}

async function loadModules() {
    logLoader('🚀 Lade D&D Tracker Module...');
    logLoader(`📦 ${MODULES.length} Module werden geladen...`);

    // Zeige Loading-Screen sofort
    showLoadingIndicator();

    // Lade HTML Templates parallel (ersetzt monolithische body.html)
    const TEMPLATES = [
        'assets/templates/header.html',
        'assets/templates/view-party.html',
        'assets/templates/view-content.html',
        'assets/templates/view-encounters.html',
        'assets/templates/view-resources.html',
        'assets/templates/view-tools.html',
        'assets/templates/modals-entity.html',
        'assets/templates/modals-shops.html',
        'assets/templates/modals-tools.html',
        'assets/templates/modals-editors.html',
    ];

    let bodyHTML = '';
    try {
        const parts = await Promise.all(
            TEMPLATES.map(t => fetch(t).then(r => r.text()))
        );
        bodyHTML = parts.join('\n');
        logLoader(`✓ ${TEMPLATES.length} HTML Templates geladen`);
    } catch (error) {
        console.error('❌ Fehler beim Laden der HTML Templates:', error);
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
                    updateLoadingProgress(loadedCount, MODULES.length, module);
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

    // Jetzt erst HTML Body einfügen (ersetzt Loading-Screen)
    document.getElementById('app-root').innerHTML = bodyHTML;

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

// XSS-sichere Fehleranzeige
function showLoadError(error) {
    const appRoot = document.getElementById('app-root');

    // Erstelle DOM-Elemente programmatisch statt innerHTML mit Template-Literal
    const container = document.createElement('div');
    container.style.cssText = 'padding: 40px; text-align: center; color: #ef4444; font-family: Arial, sans-serif;';

    const h1 = document.createElement('h1');
    h1.style.cssText = 'font-size: 2em; margin-bottom: 20px;';
    h1.textContent = '⚠️ Fehler beim Laden';

    const p1 = document.createElement('p');
    p1.style.cssText = 'font-size: 1.2em; margin-bottom: 10px;';
    p1.textContent = 'Die Anwendung konnte nicht geladen werden.';

    const p2 = document.createElement('p');
    p2.style.color = '#888';
    p2.textContent = 'Bitte überprüfen Sie die Browser-Konsole (F12) für Details.';

    const details = document.createElement('details');
    details.style.cssText = 'margin-top: 20px; text-align: left; background: #1a1a1a; padding: 20px; border-radius: 8px;';

    const summary = document.createElement('summary');
    summary.style.cssText = 'cursor: pointer; font-weight: bold;';
    summary.textContent = 'Fehlerdetails anzeigen';

    const pre = document.createElement('pre');
    pre.style.cssText = 'margin-top: 10px; color: #ff6b6b; font-family: monospace; overflow-x: auto;';
    // SICHER: textContent statt innerHTML - verhindert XSS
    pre.textContent = error.stack || error.message || String(error);

    details.appendChild(summary);
    details.appendChild(pre);
    container.appendChild(h1);
    container.appendChild(p1);
    container.appendChild(p2);
    container.appendChild(details);

    appRoot.innerHTML = '';
    appRoot.appendChild(container);
}

// Start loading when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadModules().catch(error => {
            console.error('❌ Kritischer Fehler beim Laden der Module:', error);
            showLoadError(error);
        });
    });
} else {
    loadModules().catch(error => {
        console.error('❌ Kritischer Fehler beim Laden der Module:', error);
        showLoadError(error);
    });
}
