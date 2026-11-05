// [SECTION:RENDER_DASHBOARD]
// ============================================================
// DASHBOARD - @render @tabs @overview
// ============================================================
// Global render state variable
let renderPending = false;
/**
 * Die Ansichten, die renderAll() nur OFFEN zeichnet, ueber ihren Eintrag in TAB_RENDER_REGISTRY:
 * die Welt-Reiter mit gespeicherten Listen (REITERIMPORT R8; Reise ist ein Rechner ohne
 * Eintraege) und das Bestiar (BESTIAR-UNDO R2). Das Bestiar NIE versteckt: sein Rollwerk misst
 * beim ersten Zeichnen die Fensterhoehe und setzte im versteckten Reiter den Rueckfall 400 px fest.
 */
const LISTEN_ANSICHTEN = Object.freeze(['sessionprep', 'kalender', 'fraktionen', 'bestiary']);
/**
 * Zeichnet die offene Listen-Ansicht ueber ihren Eintrag in TAB_RENDER_REGISTRY neu (Liste,
 * Kopf, Detail und gefilterter Zaehler) — fuer renderAll(), das sonst keine dieser Ansichten
 * kennt. Ein anderer offener Reiter: nichts.
 */
function renderOffeneListenAnsicht() {
    const aktiv = document.querySelector('.view.active');
    const ansicht = aktiv && aktiv.id ? aktiv.id.replace(/^view-/, '') : '';
    if (LISTEN_ANSICHTEN.includes(ansicht) && typeof window.renderTabContent === 'function') {
        window.renderTabContent(ansicht);
    }
}
function renderAll() {
    const ErrorHandler = window.ErrorHandler;
    // Prevent multiple renders in the same frame
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(() => {
        renderPending = false;
        // Each render function individually in try-catch with ErrorHandler
        const renderSafe = (fn, name, containerId = null) => {
            try {
                fn();
            } catch (e) {
                ErrorHandler.log(name, e);
                // For critical render functions: show error in container
                if (containerId) {
                    const container = $(containerId);
                    if (container) {
                        container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
                            <div class="empty-state-icon">⚠️</div>
                            <div class="empty-state-title">Anzeigefehler</div>
                            <div class="empty-state-desc">${esc(e.message || 'Unbekannter Fehler')}</div>
                        </div>`;
                    }
                }
            }
        };
        const renderParty = window.renderParty;
        const renderNPCList = window.renderNPCList;
        const renderLocations = window.renderLocations;
        const renderQuests = window.renderQuests;
        const renderEncounters = window.renderEncounters;
        const renderInit = window.renderInit;
        const renderLoot = window.renderLoot;
        const renderShops = window.renderShops;
        const renderSpells = window.renderSpells;
        const renderSessions = window.renderSessions;
        const renderLinks = window.renderLinks;
        const renderWiki = window.renderWiki;
        const renderFilterList = window.renderFilterList;
        const initQuickRefCustom = window.initQuickRefCustom;
        const renderRandomTables = window.renderRandomTables;
        const renderTimers = window.renderTimers;
        const updateIOCounts = window.updateIOCounts;
        renderSafe(renderParty, 'renderParty', 'party-list');
        renderSafe(renderNPCList, 'renderNPCList', 'npc-list');
        renderSafe(renderLocations, 'renderLocations', 'loc-grid');
        renderSafe(renderQuests, 'renderQuests', 'quests-list');
        renderSafe(renderEncounters, 'renderEncounters', 'encounter-list');
        renderSafe(renderInit, 'renderInit', 'init-list');
        renderSafe(renderLoot, 'renderLoot', 'loot-list');
        renderSafe(renderShops, 'renderShops', 'shops-container');
        renderSafe(renderSpells, 'renderSpells', 'spell-list');
        renderSafe(renderSessions, 'renderSessions', 'session-list');
        renderSafe(renderLinks, 'renderLinks', 'links-list');
        renderSafe(renderWiki, 'renderWiki');
        renderSafe(renderFilterList, 'renderFilterList');
        renderSafe(initQuickRefCustom, 'initQuickRefCustom');
        // Phase 8 (Pitfall 7): renderAll() ist ein zweiter, unabhaengiger Dispatch-Pfad
        // neben TAB_RENDER_REGISTRY (switchView) — undo()/redo()/import gehen NUR ueber
        // renderAll(). Ohne diese beiden Eintraege blieben die Dice-/Timer-Panels nach
        // einem Undo/Redo veraltet, waehrend ihr Tab aktiv ist.
        renderSafe(renderRandomTables, 'renderRandomTables', 'random-tables-list');
        renderSafe(renderTimers, 'renderTimers');
        // REITERIMPORT R8: dieselbe Luecke fuer die drei Welt-Reiter — nach einem Import, Strg+Z
        // oder Strg+Y zeigten Session-Prep, Kalender und Fraktionen den alten Stand, bis man den
        // Reiter wechselte (gemessen). Gezeichnet wird nur der OFFENE: die anderen zeichnet der
        // Reiterwechsel (TAB_RENDER_REGISTRY), ihre Zaehler schreibt updateIOCounts().
        // BESTIAR-UNDO R2: ebenso das offene Bestiar — nach Strg+Z blieben ★, Zeilen, Zaehler,
        // Filteroptionen und Detail auf dem alten Stand (gemessen).
        renderSafe(renderOffeneListenAnsicht, 'renderOffeneListenAnsicht');
        // Update IO-Counter
        try {
            updateIOCounts();
        } catch (e) {
            ErrorHandler.log('updateIOCounts', e);
        }
    });
}
/**
 * R06 (Code-Review 2026-09-21, U8): Nachlauf, wenn D als Ganzes ersetzt wurde (Konflikt-
 * Neuladen). renderAll() deckt weder das nur beim Start angewandte Theme/Layout noch die
 * aktive TAB_RENDER_REGISTRY-Ansicht (Dashboard, DM-Screen, Welt, ...) noch das
 * Schnellnotiz-Feld ab. Jeder Schritt ist einzeln abgesichert; kein Markup.
 */
function renderAfterDataReplace() {
    const schritt = (name, fn) => {
        try {
            fn();
        } catch (e) {
            if (window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler) {
                window.ErrorHandler.log('renderAfterDataReplace', e, name);
            }
        }
    };
    schritt('loadTheme', () => window.loadTheme?.());
    schritt('loadLayout', () => window.loadLayout?.());
    schritt('renderAll', () => renderAll());
    schritt('renderTabContent', () => {
        const aktiv = document.querySelector('.view.active');
        const ansicht = aktiv && aktiv.id ? aktiv.id.replace(/^view-/, '') : '';
        if (ansicht) window.renderTabContent?.(ansicht);
    });
    schritt('quick-notes', () => {
        const q = $('quick-notes');
        if (q) q.value = window.D.quickNotes || '';
    });
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.renderAll = renderAll;
window.renderAfterDataReplace = renderAfterDataReplace;
window.renderPending = renderPending;
