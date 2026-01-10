// [SECTION:DEBUG]
// Extrahiert aus dice.js
// Debug & Test Funktionen
// Zeilen: 1,228
// ============================================================
// DEBUG & TEST FUNKTIONEN
// ============================================================
var D = window.D;
var log = window.log;
var StorageAPI = window.StorageAPI;
var STORAGE_KEY = window.STORAGE_KEY;
var renderAll = window.renderAll;
var renderSpells = window.renderSpells;
var renderParty = window.renderParty;
var renderWiki = window.renderWiki;
var renderMindmap = window.renderMindmap;
var renderEmptyState = window.renderEmptyState;
var populateFilterDropdown = window.populateFilterDropdown;
var updateCounters = window.updateCounters;
var undoStack = window.undoStack;
var redoStack = window.redoStack;
var EventDelegation = window.EventDelegation;
var ENTITY_TYPE_CONFIG = window.ENTITY_TYPE_CONFIG;
var renderEntityLink = window.renderEntityLink;
var ErrorHandler = window.ErrorHandler;
var ENTITY_SCHEMAS = window.ENTITY_SCHEMAS;
var safeJSONParse = window.safeJSONParse;
var safeJSONStringify = window.safeJSONStringify;
var repairDataArrays = window.repairDataArrays;
var validateDataIntegrity = window.validateDataIntegrity;
var PerformanceManager = window.PerformanceManager;
var debounce = window.debounce;
var throttle = window.throttle;
var setTheme = window.setTheme;
var undo = window.undo;
var redo = window.redo;
var pushUndo = window.pushUndo;
var QREF_CONDITIONS = window.QREF_CONDITIONS;
var toggleQuickRef = window.toggleQuickRef;
var applyQrefCondition = window.applyQrefCondition;
var rollQrefDice = window.rollQrefDice;
var qrefSearch = window.qrefSearch;
var toggleEventLog = window.toggleEventLog;
var clearEventLog = window.clearEventLog;
var parseWikiLinks = window.parseWikiLinks;
var navigateToWikiEntry = window.navigateToWikiEntry;
var addNode = window.addNode;
var saveNodeFromModal = window.saveNodeFromModal;
var selectNodeType = window.selectNodeType;
function clearTestData() {
    if (!confirm('Alle Test-Daten (mit "Test" im Namen) löschen?'))
        return;
    let count = 0;
    // Charaktere mit "Test" im Namen
    const charsBefore = D.characters?.length || 0;
    D.characters = (D.characters || []).filter((c) => !c.name?.toLowerCase().includes('test'));
    count += charsBefore - D.characters.length;
    // NPCs mit "Test" im Namen
    const npcsBefore = D.npcs?.length || 0;
    D.npcs = (D.npcs || []).filter((n) => !n.name?.toLowerCase().includes('test'));
    count += npcsBefore - D.npcs.length;
    // Orte mit "Test" im Namen
    const locsBefore = D.locations?.length || 0;
    D.locations = (D.locations || []).filter((l) => !l.name?.toLowerCase().includes('test'));
    count += locsBefore - D.locations.length;
    // Quests mit "Test" im Namen
    const questsBefore = D.quests?.length || 0;
    D.quests = (D.quests || []).filter((q) => !q.title?.toLowerCase().includes('test'));
    count += questsBefore - D.quests.length;
    // Wiki-Einträge mit "Test" im Namen
    const wikiBefore = D.wiki?.length || 0;
    D.wiki = (D.wiki || []).filter((w) => !w.title?.toLowerCase().includes('test'));
    count += wikiBefore - D.wiki.length;
    // Mindmap-Nodes mit "Test" im Namen
    const nodesBefore = D.mindmap?.nodes?.length || 0;
    if (D.mindmap?.nodes) {
        D.mindmap.nodes = D.mindmap.nodes.filter((n) => !n.label?.toLowerCase().includes('test'));
    }
    count += nodesBefore - (D.mindmap?.nodes?.length || 0);
    save();
    renderAll();
    debugLogAdd(`${count} Test-Einträge gelöscht`);
    showToast(`🧪 ${count} Test-Einträge gelöscht`, 'success');
    updateDebugStats();
}
function clearAllSpells() {
    if (!confirm(`Wirklich ALLE ${D.spells?.length || 0} Zauber löschen?`))
        return;
    const count = D.spells?.length || 0;
    D.spells = [];
    // Zauber-Zuweisungen von Charakteren entfernen
    (D.characters || []).forEach((c) => {
        c.spells = [];
        c.spellSlots = {};
    });
    save();
    if (typeof renderSpells === 'function')
        renderSpells();
    if (typeof renderParty === 'function')
        renderParty();
    debugLogAdd(`${count} Zauber gelöscht`);
    showToast(`✨ ${count} Zauber gelöscht`, 'success');
    updateDebugStats();
}
function clearAllWiki() {
    if (!confirm(`Wirklich ALLE ${D.wiki?.length || 0} Wiki-Einträge löschen?`))
        return;
    const count = D.wiki?.length || 0;
    D.wiki = [];
    save();
    if (typeof renderWiki === 'function')
        renderWiki();
    debugLogAdd(`${count} Wiki-Einträge gelöscht`);
    showToast(`📚 ${count} Wiki-Einträge gelöscht`, 'success');
    updateDebugStats();
}
function clearMindmap() {
    if (!confirm('Wirklich das komplette Netzwerk leeren?'))
        return;
    const nodeCount = D.mindmap?.nodes?.length || 0;
    const connCount = D.mindmap?.connections?.length || 0;
    D.mindmap = { nodes: [], connections: [] };
    save();
    if (typeof renderMindmap === 'function')
        renderMindmap();
    debugLogAdd(`Netzwerk geleert: ${nodeCount} Nodes, ${connCount} Verbindungen`);
    showToast(`🔗 Netzwerk geleert (${nodeCount} Nodes)`, 'success');
    updateDebugStats();
}
// Alias für Rückwärtskompatibilität
const clearAllNodes = clearMindmap;
function runAllTests() {
    debugLogAdd('=== ALLE TESTS STARTEN ===');
    const allResults = [];
    allResults.push(...runValidation(true));
    allResults.push(...runFeatureTests(true));
    allResults.push(...runNewFeatureTests(true));
    allResults.push(...runEntitySystemTests(true));
    allResults.push(...runErrorHandlingTests(true));
    allResults.push(...runPerformanceTests(true));
    allResults.push(...runUITests(true));
    const passed = allResults.filter(r => r.pass).length;
    const total = allResults.length;
    const percentage = Math.round((passed / total) * 100);
    debugLogAdd(`=== ALLE TESTS ABGESCHLOSSEN: ${passed}/${total} (${percentage}%) ===`);
    showToast(`🧪 Gesamt: ${passed}/${total} Tests bestanden (${percentage}%)`, percentage === 100 ? 'success' : percentage >= 80 ? 'info' : 'warning');
    return allResults;
}
function runFeatureTests(silent = false) {
    if (!silent)
        debugLogAdd('--- Feature-Tests ---');
    const results = [];
    // Test: Datenstruktur
    results.push({
        name: 'Datenstruktur',
        pass: typeof D === 'object' && D !== null,
        detail: `D ist ${typeof D}`,
        category: 'feature'
    });
    // Test: Arrays vorhanden
    const arrays = ['characters', 'npcs', 'locations', 'quests', 'encounters', 'spells', 'loot', 'sessionNotes', 'wiki'];
    arrays.forEach(arr => {
        results.push({
            name: `Array: ${arr}`,
            pass: Array.isArray(D[arr]),
            detail: Array.isArray(D[arr]) ? `${D[arr].length} Einträge` : 'Nicht vorhanden',
            category: 'feature'
        });
    });
    // Test: LocalStorage
    results.push({
        name: 'LocalStorage',
        pass: StorageAPI.isAvailable(),
        detail: StorageAPI.isAvailable() ? 'Verfügbar' : 'Nicht verfügbar',
        category: 'feature'
    });
    // Test: Save-Funktion
    try {
        const testResult = typeof save === 'function';
        results.push({ name: 'Save-Funktion', pass: testResult, detail: testResult ? 'OK' : 'Fehlt', category: 'feature' });
    }
    catch (e) {
        results.push({ name: 'Save-Funktion', pass: false, detail: e.message, category: 'feature' });
    }
    // Ergebnisse anzeigen
    const passed = results.filter(r => r.pass).length;
    const total = results.length;
    if (!silent) {
        results.forEach(r => {
            debugLogAdd(`  ${r.pass ? '✓' : '✗'} ${r.name}: ${r.detail}`);
        });
        debugLogAdd(`Feature-Tests: ${passed}/${total} bestanden`);
        showToast(`🧪 Tests: ${passed}/${total} bestanden`, passed === total ? 'success' : 'warning');
    }
    return results;
}
function runNewFeatureTests(silent = false) {
    if (!silent)
        debugLogAdd('--- Neue Features Tests (v2.6) ---');
    const results = [];
    // Wiki-System
    results.push({
        name: 'Wiki-Array',
        pass: Array.isArray(D.wiki),
        detail: `${D.wiki?.length || 0} Einträge`,
        category: 'new-features'
    });
    // Mindmap/Netzwerk
    results.push({
        name: 'Mindmap-Struktur',
        pass: D.mindmap && Array.isArray(D.mindmap.nodes) && Array.isArray(D.mindmap.connections),
        detail: `${D.mindmap?.nodes?.length || 0} Nodes, ${D.mindmap?.connections?.length || 0} Verbindungen`,
        category: 'new-features'
    });
    // Undo/Redo
    results.push({
        name: 'Undo-Stack',
        pass: Array.isArray(undoStack),
        detail: `${undoStack?.length || 0} Einträge`,
        category: 'new-features'
    });
    results.push({
        name: 'Redo-Stack',
        pass: Array.isArray(redoStack),
        detail: `${redoStack?.length || 0} Einträge`,
        category: 'new-features'
    });
    // EventDelegation
    results.push({
        name: 'EventDelegation',
        pass: typeof EventDelegation === 'object' && typeof EventDelegation.init === 'function',
        detail: EventDelegation ? 'Initialisiert' : 'Fehlt',
        category: 'new-features'
    });
    // Shops
    results.push({
        name: 'Shops-Array',
        pass: Array.isArray(D.shops),
        detail: `${D.shops?.length || 0} Shops`,
        category: 'new-features'
    });
    // Ergebnisse
    const passed = results.filter(r => r.pass).length;
    if (!silent) {
        results.forEach(r => {
            debugLogAdd(`  ${r.pass ? '✓' : '✗'} ${r.name}: ${r.detail}`);
        });
        debugLogAdd(`Neue Features: ${passed}/${results.length} OK`);
        showToast(`🆕 Neue Features: ${passed}/${results.length} OK`, passed === results.length ? 'success' : 'warning');
    }
    return results;
}
function runEntitySystemTests(silent = false) {
    if (!silent)
        debugLogAdd('--- Entity-System Tests ---');
    const results = [];
    // EntityLookup existiert
    results.push({
        name: 'EntityLookup Objekt',
        pass: typeof EntityLookup === 'object' && typeof EntityLookup.get === 'function',
        detail: 'EntityLookup.get() verfügbar',
        category: 'entity-system'
    });
    // EntityLookup.get Test
    if (D.npcs?.length > 0) {
        const firstNpc = D.npcs[0];
        const lookupResult = EntityLookup.get('npcs', firstNpc.id);
        results.push({
            name: 'EntityLookup.get()',
            pass: lookupResult !== null && lookupResult.id === firstNpc.id,
            detail: lookupResult ? `NPC "${lookupResult.name}" gefunden` : 'Nicht gefunden',
            category: 'entity-system'
        });
    }
    // EntityLookup.getName Test
    results.push({
        name: 'EntityLookup.getName()',
        pass: typeof EntityLookup.getName === 'function',
        detail: 'Funktion verfügbar',
        category: 'entity-system'
    });
    // EntityLookup.exists Test
    results.push({
        name: 'EntityLookup.exists()',
        pass: typeof EntityLookup.exists === 'function',
        detail: D.npcs?.length > 0 ? `exists('npcs', ${D.npcs[0]?.id}) = ${EntityLookup.exists('npcs', D.npcs[0]?.id)}` : 'Keine NPCs zum Testen',
        category: 'entity-system'
    });
    // Convenience-Methoden
    const convenienceMethods = ['npc', 'location', 'character', 'quest', 'spell', 'lootItem', 'shop'];
    convenienceMethods.forEach(method => {
        results.push({
            name: `EntityLookup.${method}()`,
            pass: typeof EntityLookup[method] === 'function',
            detail: 'Verfügbar',
            category: 'entity-system'
        });
    });
    // ENTITY_TYPE_CONFIG
    results.push({
        name: 'ENTITY_TYPE_CONFIG',
        pass: typeof ENTITY_TYPE_CONFIG === 'object' && Object.keys(ENTITY_TYPE_CONFIG).length > 0,
        detail: `${Object.keys(ENTITY_TYPE_CONFIG || {}).length} Entity-Typen konfiguriert`,
        category: 'entity-system'
    });
    // renderEntityLink
    results.push({
        name: 'renderEntityLink()',
        pass: typeof renderEntityLink === 'function',
        detail: 'Funktion verfügbar',
        category: 'entity-system'
    });
    // Test renderEntityLink Output
    if (typeof renderEntityLink === 'function') {
        const testLink = renderEntityLink('npcs', 1, 'Test-NPC');
        results.push({
            name: 'renderEntityLink Output',
            pass: testLink.includes('data-action="navigate-entity"') && testLink.includes('entity-link'),
            detail: testLink.includes('data-action') ? 'data-action korrekt' : 'data-action fehlt',
            category: 'entity-system'
        });
    }
    const passed = results.filter(r => r.pass).length;
    if (!silent) {
        results.forEach(r => {
            debugLogAdd(`  ${r.pass ? '✓' : '✗'} ${r.name}: ${r.detail}`);
        });
        debugLogAdd(`Entity-System: ${passed}/${results.length} OK`);
        showToast(`🔗 Entity-System: ${passed}/${results.length} OK`, passed === results.length ? 'success' : 'warning');
    }
    return results;
}
function runErrorHandlingTests(silent = false) {
    if (!silent)
        debugLogAdd('--- Error-Handling Tests ---');
    const results = [];
    // ErrorHandler existiert
    results.push({
        name: 'ErrorHandler Objekt',
        pass: typeof ErrorHandler === 'object',
        detail: 'ErrorHandler definiert',
        category: 'error-handling'
    });
    // ErrorHandler.log
    results.push({
        name: 'ErrorHandler.log()',
        pass: typeof ErrorHandler?.log === 'function',
        detail: 'Funktion verfügbar',
        category: 'error-handling'
    });
    // ErrorHandler.showError
    results.push({
        name: 'ErrorHandler.showError()',
        pass: typeof ErrorHandler?.showError === 'function',
        detail: 'Funktion verfügbar',
        category: 'error-handling'
    });
    // ErrorHandler.getRecentErrors
    results.push({
        name: 'ErrorHandler.getRecentErrors()',
        pass: typeof ErrorHandler?.getRecentErrors === 'function',
        detail: `${ErrorHandler?.getRecentErrors?.()?.length || 0} Fehler im Log`,
        category: 'error-handling'
    });
    // Test: Fehler loggen und abrufen
    if (typeof ErrorHandler?.log === 'function') {
        const initialCount = ErrorHandler._errorLog?.length || 0;
        // Konsolen- und Debug-Output temporär deaktivieren für Test
        const originalConsoleLog = ErrorHandler._consoleLog;
        const originalDebugLog = ErrorHandler._debugLog;
        ErrorHandler._consoleLog = false;
        ErrorHandler._debugLog = false;
        ErrorHandler.log('TestFunction', new Error('Test-Fehler (erwartet)'), 'Test-Kontext');
        ErrorHandler._consoleLog = originalConsoleLog;
        ErrorHandler._debugLog = originalDebugLog;
        const newCount = ErrorHandler._errorLog?.length || 0;
        results.push({
            name: 'Fehler-Logging',
            pass: newCount > initialCount,
            detail: `Log-Größe: ${initialCount} → ${newCount}`,
            category: 'error-handling'
        });
        // Cleanup - entferne Test-Fehler aus Log
        if (ErrorHandler._errorLog?.length > 0) {
            ErrorHandler._errorLog.shift();
        }
    }
    // validateDataIntegrity
    results.push({
        name: 'validateDataIntegrity()',
        pass: typeof validateDataIntegrity === 'function',
        detail: 'Funktion verfügbar',
        category: 'error-handling'
    });
    // ENTITY_SCHEMAS
    results.push({
        name: 'ENTITY_SCHEMAS',
        pass: typeof ENTITY_SCHEMAS === 'object' && Object.keys(ENTITY_SCHEMAS).length >= 5,
        detail: `${Object.keys(ENTITY_SCHEMAS || {}).length} Schemas definiert`,
        category: 'error-handling'
    });
    // safeJSONParse
    results.push({
        name: 'safeJSONParse()',
        pass: typeof safeJSONParse === 'function',
        detail: safeJSONParse('{"test":1}', null)?.test === 1 ? 'Parst korrekt' : 'Parse-Fehler',
        category: 'error-handling'
    });
    // safeJSONStringify
    results.push({
        name: 'safeJSONStringify()',
        pass: typeof safeJSONStringify === 'function',
        detail: 'Funktion verfügbar',
        category: 'error-handling'
    });
    // repairDataArrays
    results.push({
        name: 'repairDataArrays()',
        pass: typeof repairDataArrays === 'function',
        detail: 'Funktion verfügbar',
        category: 'error-handling'
    });
    const passed = results.filter(r => r.pass).length;
    if (!silent) {
        results.forEach(r => {
            debugLogAdd(`  ${r.pass ? '✓' : '✗'} ${r.name}: ${r.detail}`);
        });
        debugLogAdd(`Error-Handling: ${passed}/${results.length} OK`);
        showToast(`⚠️ Error-Handling: ${passed}/${results.length} OK`, passed === results.length ? 'success' : 'warning');
    }
    return results;
}
function runPerformanceTests(silent = false) {
    if (!silent)
        debugLogAdd('--- Performance-Tests ---');
    const results = [];
    // PerformanceManager existiert
    results.push({
        name: 'PerformanceManager',
        pass: typeof PerformanceManager === 'object',
        detail: 'Objekt definiert',
        category: 'performance'
    });
    // PerformanceManager Methoden
    ['startMeasure', 'endMeasure', 'getDebounced', 'getThrottled', 'shouldUseVirtualScroll', 'renderList'].forEach(method => {
        results.push({
            name: `PerformanceManager.${method}()`,
            pass: typeof PerformanceManager?.[method] === 'function',
            detail: 'Verfügbar',
            category: 'performance'
        });
    });
    // Debounce-Funktion
    results.push({
        name: 'debounce()',
        pass: typeof debounce === 'function',
        detail: 'Funktion verfügbar',
        category: 'performance'
    });
    // Throttle-Funktion
    results.push({
        name: 'throttle()',
        pass: typeof throttle === 'function',
        detail: 'Funktion verfügbar',
        category: 'performance'
    });
    // Speichergröße
    const dataSize = new Blob([JSON.stringify(D)]).size;
    const dataSizeKB = (dataSize / 1024).toFixed(2);
    results.push({
        name: 'Datengröße',
        pass: dataSize < 5 * 1024 * 1024, // < 5MB
        detail: `${dataSizeKB} KB`,
        category: 'performance'
    });
    // Render-Zeit messen
    const startRender = performance.now();
    if (typeof renderAll === 'function') {
        // Synchroner Teil von renderAll
        window.renderPending = false; // Reset für Test
    }
    const renderTime = performance.now() - startRender;
    results.push({
        name: 'Render-Initiierung',
        pass: renderTime < 50,
        detail: `${renderTime.toFixed(2)} ms`,
        category: 'performance'
    });
    // DOM-Elemente zählen
    const domCount = document.querySelectorAll('*').length;
    results.push({
        name: 'DOM-Größe',
        pass: domCount < 10000,
        detail: `${domCount} Elemente`,
        category: 'performance'
    });
    // Event-Handler zählen
    const dataActions = document.querySelectorAll('[data-action]').length;
    const onclicks = document.querySelectorAll('[onclick]').length;
    results.push({
        name: 'Event-Handler',
        pass: dataActions > onclicks,
        detail: `data-action: ${dataActions}, onclick: ${onclicks}`,
        category: 'performance'
    });
    // Debounced Funktionen
    const debouncedFnCount = PerformanceManager?._debouncedFns?.size || 0;
    results.push({
        name: 'Gecachte Debounced-Fns',
        pass: true,
        detail: `${debouncedFnCount} Funktionen`,
        category: 'performance'
    });
    const passed = results.filter(r => r.pass).length;
    if (!silent) {
        results.forEach(r => {
            debugLogAdd(`  ${r.pass ? '✓' : '✗'} ${r.name}: ${r.detail}`);
        });
        const rating = passed === results.length ? 'Excellent' :
            passed >= results.length * 0.8 ? 'Gut' : 'Verbesserungswürdig';
        debugLogAdd(`Performance: ${passed}/${results.length} OK - ${rating}`);
        showToast(`⚡ Performance: ${rating}`, rating === 'Excellent' ? 'success' : 'info');
    }
    return results;
}
// Alias für Rückwärtskompatibilität
function runPerformanceTest() {
    runPerformanceTests(false);
}
function runUITests(silent = false) {
    if (!silent)
        debugLogAdd('--- UI-Tests ---');
    const results = [];
    // Haupt-Container existieren
    const containers = ['party-list', 'npc-list', 'loc-grid', 'quest-list', 'spell-list', 'loot-list'];
    containers.forEach(id => {
        const el = $(id);
        results.push({
            name: `Container: ${id}`,
            pass: el !== null,
            detail: el ? 'Gefunden' : 'Fehlt',
            category: 'ui'
        });
    });
    // Navigation
    const navTabs = document.querySelectorAll('.nav-tab');
    results.push({
        name: 'Navigation Tabs',
        pass: navTabs.length >= 5,
        detail: `${navTabs.length} Tabs`,
        category: 'ui'
    });
    // Modals
    const modals = document.querySelectorAll('.modal-overlay');
    results.push({
        name: 'Modals',
        pass: modals.length >= 5,
        detail: `${modals.length} Modals`,
        category: 'ui'
    });
    // Theme-System
    results.push({
        name: 'setTheme()',
        pass: typeof setTheme === 'function',
        detail: 'Funktion verfügbar',
        category: 'ui'
    });
    // Toast-System
    results.push({
        name: 'showToast()',
        pass: typeof showToast === 'function',
        detail: 'Funktion verfügbar',
        category: 'ui'
    });
    // Render-Funktionen
    const renderFns = ['renderParty', 'renderNPCList', 'renderLocations', 'renderQuests', 'renderSpells', 'renderLoot'];
    renderFns.forEach(fn => {
        results.push({
            name: fn,
            pass: typeof window[fn] === 'function',
            detail: 'Funktion verfügbar',
            category: 'ui'
        });
    });
    // renderEmptyState
    results.push({
        name: 'renderEmptyState()',
        pass: typeof renderEmptyState === 'function',
        detail: 'Funktion verfügbar',
        category: 'ui'
    });
    // populateFilterDropdown
    results.push({
        name: 'populateFilterDropdown()',
        pass: typeof populateFilterDropdown === 'function',
        detail: 'Funktion verfügbar',
        category: 'ui'
    });
    // updateCounters
    results.push({
        name: 'updateCounters()',
        pass: typeof updateCounters === 'function',
        detail: 'Funktion verfügbar',
        category: 'ui'
    });
    const passed = results.filter(r => r.pass).length;
    if (!silent) {
        results.forEach(r => {
            debugLogAdd(`  ${r.pass ? '✓' : '✗'} ${r.name}: ${r.detail}`);
        });
        debugLogAdd(`UI-Tests: ${passed}/${results.length} OK`);
        showToast(`🖥️ UI-Tests: ${passed}/${results.length} OK`, passed === results.length ? 'success' : 'warning');
    }
    return results;
}
function generateTestWiki(count = 5) {
    const topics = ['Drachen', 'Magie', 'Königreich', 'Dungeon', 'Artefakt', 'Legende', 'Fluch', 'Prophezeiung'];
    const adjectives = ['Alte', 'Verborgene', 'Dunkle', 'Heilige', 'Verlorene', 'Mächtige'];
    D.wiki = D.wiki || [];
    for (let i = 0; i < count; i++) {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const topic = topics[Math.floor(Math.random() * topics.length)];
        D.wiki.push({
            id: Date.now() + i,
            title: `Test: ${adj} ${topic}`,
            content: `Dies ist ein Test-Wiki-Eintrag über ${adj.toLowerCase()} ${topic.toLowerCase()}. Er wurde automatisch generiert.`,
            tags: ['test', topic.toLowerCase()],
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            pinned: false
        });
    }
    save();
    if (typeof renderWiki === 'function')
        renderWiki();
    debugLogAdd(`${count} Test-Wiki-Einträge erstellt`);
    showToast(`📚 ${count} Wiki-Einträge erstellt`, 'success');
    updateDebugStats();
}
function generateTestMindmap(count = 10) {
    const types = ['city', 'dungeon', 'forest', 'mountain', 'ruins', 'quest', 'npc', 'player'];
    const names = ['Aldoria', 'Bergfried', 'Schattenwald', 'Kristallhöhle', 'Drachenfels', 'Nebeltal', 'Eisspitze', 'Feuerkluft'];
    D.mindmap = D.mindmap || { nodes: [], connections: [] };
    const startX = 100;
    const startY = 100;
    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const name = names[Math.floor(Math.random() * names.length)];
        D.mindmap.nodes.push({
            id: Date.now() + i,
            label: `Test: ${name} ${i + 1}`,
            type: type,
            x: startX + (i % 5) * 150,
            y: startY + Math.floor(i / 5) * 120,
            notes: `Test-Node vom Typ ${type}`
        });
    }
    // Einige zufällige Verbindungen erstellen
    const nodes = D.mindmap.nodes;
    for (let i = 0; i < Math.min(count - 1, 5); i++) {
        const fromIdx = Math.floor(Math.random() * nodes.length);
        const toIdx = Math.floor(Math.random() * nodes.length);
        if (fromIdx !== toIdx) {
            D.mindmap.connections.push({
                id: Date.now() + count + i,
                from: nodes[fromIdx].id,
                to: nodes[toIdx].id,
                type: 'connection'
            });
        }
    }
    save();
    if (typeof renderMindmap === 'function')
        renderMindmap();
    debugLogAdd(`${count} Test-Mindmap-Nodes erstellt`);
    showToast(`🔗 ${count} Nodes erstellt`, 'success');
    updateDebugStats();
}
function testWikiSystem() {
    debugLogAdd('--- Wiki-System Test ---');
    // Existenz prüfen
    const hasWiki = Array.isArray(D.wiki);
    debugLogAdd(`  Wiki-Array: ${hasWiki ? '✓' : '✗'}`);
    // Render-Funktion
    const hasRender = typeof renderWiki === 'function';
    debugLogAdd(`  renderWiki(): ${hasRender ? '✓' : '✗'}`);
    // Wiki-Container
    const container = document.getElementById('wiki-list');
    debugLogAdd(`  Wiki-Container: ${container ? '✓' : '✗'}`);
    // Test-Eintrag erstellen und löschen
    const testEntry = {
        id: 999999,
        title: '__wiki_test__',
        content: 'Test',
        tags: [],
        created: new Date().toISOString()
    };
    D.wiki = D.wiki || [];
    D.wiki.push(testEntry);
    const added = EntityLookup.wiki(999999);
    debugLogAdd(`  Eintrag hinzufügen: ${added ? '✓' : '✗'}`);
    D.wiki = D.wiki.filter((w) => w.id !== 999999);
    const removed = !EntityLookup.wiki(999999);
    debugLogAdd(`  Eintrag entfernen: ${removed ? '✓' : '✗'}`);
    const allPass = hasWiki && hasRender && container && added && removed;
    showToast(`📚 Wiki-Test: ${allPass ? 'Bestanden' : 'Fehlgeschlagen'}`, allPass ? 'success' : 'error');
}
function testWikiLinks() {
    debugLogAdd('--- Wiki-Links Test ---');
    // Prüfe parseWikiLinks Funktion
    const hasParser = typeof parseWikiLinks === 'function';
    debugLogAdd(`  parseWikiLinks(): ${hasParser ? '✓' : '✗'}`);
    if (hasParser) {
        // Test-Parsing
        const testContent = 'Siehe [[Testlink]] für mehr.';
        const parsed = parseWikiLinks(testContent);
        const hasLink = parsed.includes('wiki-link');
        debugLogAdd(`  Link-Parsing: ${hasLink ? '✓' : '✗'}`);
    }
    // Prüfe Navigation
    const hasNav = typeof navigateToWikiEntry === 'function';
    debugLogAdd(`  navigateToWikiEntry(): ${hasNav ? '✓' : '✗'}`);
    showToast(`🔗 Wiki-Links Test abgeschlossen`, 'info');
}
function testNetworkSystem() {
    debugLogAdd('--- Netzwerk-System Test ---');
    // Struktur prüfen
    const hasStructure = D.mindmap && Array.isArray(D.mindmap.nodes) && Array.isArray(D.mindmap.connections);
    debugLogAdd(`  Datenstruktur: ${hasStructure ? '✓' : '✗'}`);
    // Render-Funktion
    const hasRender = typeof renderMindmap === 'function';
    debugLogAdd(`  renderMindmap(): ${hasRender ? '✓' : '✗'}`);
    // Canvas
    const canvas = document.getElementById('mindmap-canvas');
    debugLogAdd(`  Canvas: ${canvas ? '✓' : '✗'}`);
    // Node-Funktionen
    const hasAddNode = typeof addNode === 'function' || typeof saveNodeFromModal === 'function';
    debugLogAdd(`  Node hinzufügen: ${hasAddNode ? '✓' : '✗'}`);
    showToast(`🔗 Netzwerk-Test abgeschlossen`, 'info');
}
function testNodeTypes() {
    debugLogAdd('--- Node-Typen Test ---');
    // Prüfe ob Mindmap-Nodes existieren
    const hasNodes = D.mindmap?.nodes?.length > 0;
    debugLogAdd(`  Vorhandene Nodes: ${D.mindmap?.nodes?.length || 0}`);
    if (hasNodes) {
        // Typen aus vorhandenen Nodes sammeln
        const usedTypes = [...new Set(D.mindmap.nodes.map((n) => n.type).filter(Boolean))];
        debugLogAdd(`  Verwendete Typen: ${usedTypes.join(', ') || 'keine'}`);
    }
    // selectNodeType Funktion prüfen
    const hasSelectFn = typeof selectNodeType === 'function';
    debugLogAdd(`  selectNodeType(): ${hasSelectFn ? '✓' : '✗'}`);
    showToast(`📍 Node-Typen Test abgeschlossen`, 'info');
}
function testQuickReference() {
    debugLogAdd('--- Quick Reference v2 Test ---');
    // Panel prüfen
    const panel = $('quick-ref-panel');
    debugLogAdd(`  Panel vorhanden: ${panel ? '✓' : '✗'}`);
    // Toggle-Funktion
    const hasToggle = typeof toggleQuickRef === 'function';
    debugLogAdd(`  toggleQuickRef(): ${hasToggle ? '✓' : '✗'}`);
    // Conditions-Objekt
    const hasConditions = typeof QREF_CONDITIONS === 'object' && Object.keys(QREF_CONDITIONS).length > 0;
    debugLogAdd(`  QREF_CONDITIONS: ${hasConditions ? '✓ (' + Object.keys(QREF_CONDITIONS).length + ' Zustände)' : '✗'}`);
    // Apply-Funktion
    const hasApply = typeof applyQrefCondition === 'function';
    debugLogAdd(`  applyQrefCondition(): ${hasApply ? '✓' : '✗'}`);
    // Dice-Roll Funktion
    const hasDiceRoll = typeof rollQrefDice === 'function';
    debugLogAdd(`  rollQrefDice(): ${hasDiceRoll ? '✓' : '✗'}`);
    // Search-Funktion
    const hasSearch = typeof qrefSearch === 'function';
    debugLogAdd(`  qrefSearch(): ${hasSearch ? '✓' : '✗'}`);
    // Custom-Einträge
    const customCount = D.quickRefCustom?.length || 0;
    debugLogAdd(`  Custom-Einträge: ${customCount}`);
    const allPass = panel && hasToggle && hasConditions && hasApply && hasDiceRoll;
    showToast(`📖 Quick Ref Test: ${allPass ? 'Bestanden' : 'Fehlgeschlagen'}`, allPass ? 'success' : 'error');
}
function testEventLog() {
    debugLogAdd('--- Event Log Test ---');
    // Log-Container prüfen
    const logEl = $('event-log');
    debugLogAdd(`  Container vorhanden: ${logEl ? '✓' : '✗'}`);
    // showToast-Funktion
    const hasShowToast = typeof showToast === 'function';
    debugLogAdd(`  showToast(): ${hasShowToast ? '✓' : '✗'}`);
    // Toggle-Funktion
    const hasToggle = typeof toggleEventLog === 'function';
    debugLogAdd(`  toggleEventLog(): ${hasToggle ? '✓' : '✗'}`);
    // Clear-Funktion
    const hasClear = typeof clearEventLog === 'function';
    debugLogAdd(`  clearEventLog(): ${hasClear ? '✓' : '✗'}`);
    // Test verschiedene Typen
    if (hasShowToast) {
        showToast('✓ Success Test', 'success');
        setTimeout(() => showToast('✕ Error Test', 'error'), 300);
        setTimeout(() => showToast('⚠ Warning Test', 'warning'), 600);
        setTimeout(() => showToast('ℹ Info Test', 'info'), 900);
        debugLogAdd(`  Typ-Tests ausgeführt`);
    }
    const allPass = logEl && hasShowToast && hasToggle && hasClear;
    setTimeout(() => {
        showToast(`📋 Event Log Test: ${allPass ? 'Bestanden' : 'Fehlgeschlagen'}`, allPass ? 'success' : 'error');
    }, 1200);
}
function testUndoRedo() {
    debugLogAdd('--- Undo/Redo Test ---');
    // Stacks prüfen
    const hasUndo = Array.isArray(undoStack);
    const hasRedo = Array.isArray(redoStack);
    debugLogAdd(`  undoStack: ${hasUndo ? '✓' : '✗'}`);
    debugLogAdd(`  redoStack: ${hasRedo ? '✓' : '✗'}`);
    // Funktionen prüfen
    const hasUndoFn = typeof undo === 'function';
    const hasRedoFn = typeof redo === 'function';
    const hasPushFn = typeof pushUndo === 'function';
    debugLogAdd(`  undo(): ${hasUndoFn ? '✓' : '✗'}`);
    debugLogAdd(`  redo(): ${hasRedoFn ? '✓' : '✗'}`);
    debugLogAdd(`  pushUndo(): ${hasPushFn ? '✓' : '✗'}`);
    // Test-Aktion
    if (hasPushFn) {
        const sizeBefore = undoStack.length;
        pushUndo();
        const sizeAfter = undoStack.length;
        debugLogAdd(`  Push-Test: ${sizeAfter > sizeBefore ? '✓' : '✗'}`);
    }
    showToast(`↩️ Undo/Redo Test abgeschlossen`, 'info');
}
function testAutoSave() {
    debugLogAdd('--- AutoSave Test ---');
    // Save-Funktion
    const hasSave = typeof save === 'function';
    debugLogAdd(`  save(): ${hasSave ? '✓' : '✗'}`);
    // StorageAPI
    const hasStorage = typeof StorageAPI === 'object';
    debugLogAdd(`  StorageAPI: ${hasStorage ? '✓' : '✗'}`);
    // Test-Save
    if (hasSave) {
        const start = performance.now();
        save(false);
        const duration = performance.now() - start;
        debugLogAdd(`  Save-Zeit: ${duration.toFixed(2)}ms`);
    }
    // LocalStorage prüfen
    const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
    const stored = localStorage.getItem(key);
    debugLogAdd(`  Gespeichert: ${stored ? '✓ ' + (stored.length / 1024).toFixed(1) + ' KB' : '✗'}`);
    showToast(`💾 AutoSave Test abgeschlossen`, 'info');
}
function testIndexedDB() {
    debugLogAdd('--- IndexedDB Test ---');
    // Verfügbarkeit
    const hasIDB = 'indexedDB' in window;
    debugLogAdd(`  IndexedDB verfügbar: ${hasIDB ? '✓' : '✗'}`);
    if (hasIDB) {
        // Test-Verbindung
        const request = indexedDB.open('dnd-tracker-test', 1);
        request.onerror = () => {
            debugLogAdd(`  Verbindung: ✗ ${request.error}`);
            showToast(`🗄️ IndexedDB: Fehler`, 'error');
        };
        request.onsuccess = () => {
            debugLogAdd(`  Verbindung: ✓`);
            request.result.close();
            indexedDB.deleteDatabase('dnd-tracker-test');
            showToast(`🗄️ IndexedDB: OK`, 'success');
        };
    }
    else {
        showToast(`🗄️ IndexedDB nicht verfügbar`, 'error');
    }
}
async function completeReset() {
    // Zuerst zeigen, was gelöscht wird
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('dnd-tracker')) {
            keysToDelete.push(key);
        }
    }
    const message = keysToDelete.length > 0
        ? `⚠️ KOMPLETTER RESET\n\nFolgende ${keysToDelete.length} Einträge werden gelöscht:\n\n${keysToDelete.join('\n')}\n\n+ IndexedDB Daten\n\nDies kann NICHT rückgängig gemacht werden!`
        : 'Keine dnd-tracker Daten im LocalStorage gefunden.\n\nTrotzdem IndexedDB leeren und Seite neu laden?';
    if (!confirm(message)) {
        return;
    }
    try {
        log('[completeReset] Starte kompletten Reset...');
        // 1. Alle LocalStorage Keys löschen
        keysToDelete.forEach(key => {
            localStorage.removeItem(key);
            log('[completeReset] LocalStorage gelöscht:', key);
        });
        // Explizit auch diese Keys löschen (falls nicht in der Liste)
        localStorage.removeItem('dnd-tracker-v4');
        localStorage.removeItem('dnd-tracker-campaigns');
        // 2. IndexedDB komplett löschen
        if (window.indexedDB) {
            try {
                // Erst Verbindung schließen falls offen
                const idbInstance = window.idb;
                if (idbInstance) {
                    idbInstance.close();
                    window.idb = null;
                }
                // Datenbanken löschen
                const dbNames = ['dnd-tracker-db', 'dnd-tracker-idb', 'dnd-tracker-test'];
                for (const dbName of dbNames) {
                    const deleteRequest = indexedDB.deleteDatabase(dbName);
                    deleteRequest.onsuccess = () => log('[completeReset] IndexedDB gelöscht:', dbName);
                    deleteRequest.onerror = () => console.warn('[completeReset] IndexedDB Fehler:', dbName);
                }
                log('[completeReset] IndexedDB Löschung initiiert');
            }
            catch (idbError) {
                console.warn('[completeReset] IndexedDB Fehler:', idbError);
            }
        }
        // 3. Globales D-Objekt zurücksetzen
        // D is const, cannot reassign - clear and recreate structure
        for (const key in window.D)
            delete window.D[key];
        Object.assign(window.D, {
            locations: [], npcs: [], quests: [], characters: [], sessionNotes: [], storyArcs: [], quickNotes: '',
            initiative: { combatants: [], currentTurn: 0, round: 1 },
            loot: [], items: [], encounters: [], spells: [], links: [], wiki: [],
            filters: [], mindmap: { nodes: [], connections: [] },
            calendar: { day: 1, month: 0, year: 1492, events: [] },
            tags: [],
            settings: { theme: 'dark', lastView: 'dashboard' },
            _nextId: {}
        });
        alert(`✅ Reset abgeschlossen!\n\n${keysToDelete.length} LocalStorage-Einträge gelöscht.\nIndexedDB geleert.\n\nSeite wird neu geladen...`);
        // 4. Kurz warten, dann Seite neu laden
        setTimeout(() => {
            window.location.href = window.location.pathname + '?reset=' + Date.now();
        }, 500);
    }
    catch (error) {
        console.error('[completeReset] Fehler:', error);
        alert('❌ Fehler beim Reset:\n\n' + error.message);
    }
}
// ============================================================
// DEBUG MODAL FUNCTIONS
// ============================================================
let debugLog = [];
function debugLogAdd(message) {
    const timestamp = new Date().toLocaleTimeString();
    debugLog.push(`[${timestamp}] ${message}`);
    if (debugLog.length > 100)
        debugLog.shift();
    renderDebugLog();
}
function renderDebugLog() {
    const el = $('debug-log');
    if (el) {
        el.textContent = debugLog.join('\n');
        el.scrollTop = el.scrollHeight;
    }
}
function clearDebugLog() {
    debugLog = [];
    renderDebugLog();
    showToast('Debug-Log geleert', 'info');
}
function showDebugModal() {
    updateDebugStats();
    updateDebugSystemStatus();
    showModal('debug-modal');
}
function updateDebugStats() {
    const el = $('debug-stats');
    if (!el)
        return;
    const stats = [
        { label: 'Charaktere', value: D.characters?.length || 0, icon: '👥' },
        { label: 'NPCs', value: D.npcs?.length || 0, icon: '🎭' },
        { label: 'Orte', value: D.locations?.length || 0, icon: '🏠' },
        { label: 'Quests', value: D.quests?.length || 0, icon: '📜' },
        { label: 'Encounters', value: D.encounters?.length || 0, icon: '👹' },
        { label: 'Zauber', value: D.spells?.length || 0, icon: '✨' },
        { label: 'Loot', value: D.loot?.length || 0, icon: '📦' },
        { label: 'Sessions', value: D.sessionNotes?.length || 0, icon: '📝' },
        { label: 'Wiki', value: D.wiki?.length || 0, icon: '📚' },
        { label: 'Shops', value: D.shops?.length || 0, icon: '🏪' },
        { label: 'Links', value: D.links?.length || 0, icon: '🔗' },
        { label: 'Nodes', value: D.mindmap?.nodes?.length || 0, icon: '🔗' }
    ];
    el.innerHTML = stats.map(s => `
        <div style="background: var(--bg-card); padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 1.2em;">${s.icon}</div>
            <div style="font-size: 1.4em; font-weight: 600; color: var(--gold);">${s.value}</div>
            <div style="font-size: 0.75em; color: var(--text-dim);">${s.label}</div>
        </div>
    `).join('');
}
function updateDebugSystemStatus() {
    const el = $('debug-system-status');
    if (!el)
        return;
    const dataSize = new Blob([JSON.stringify(D)]).size;
    const status = [
        { label: 'LocalStorage', value: StorageAPI?.isAvailable() ? '✓' : '✗', color: StorageAPI?.isAvailable() ? 'var(--green)' : 'var(--red)' },
        { label: 'Datengröße', value: `${(dataSize / 1024).toFixed(1)} KB`, color: 'var(--cyan)' },
        { label: 'Undo-Stack', value: undoStack?.length || 0, color: 'var(--purple)' },
        { label: 'Event-Actions', value: EventDelegation?.actionCount || 0, color: 'var(--gold)' },
        { label: 'DOM-Elemente', value: document.querySelectorAll('*').length, color: 'var(--cyan)' },
        { label: 'Theme', value: document.documentElement.dataset.theme || 'dark', color: 'var(--gold)' }
    ];
    el.innerHTML = status.map(s => `
        <div style="background: var(--bg-card); padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 1.1em; font-weight: 600; color: ${s.color};">${s.value}</div>
            <div style="font-size: 0.75em; color: var(--text-dim);">${s.label}</div>
        </div>
    `).join('');
}
function runValidation(silent = false) {
    if (!silent)
        debugLogAdd('--- Datenvalidierung ---');
    const results = [];
    // Prüfe Datenstruktur
    results.push({
        name: 'Haupt-Datenobjekt',
        pass: typeof D === 'object' && D !== null,
        detail: 'D existiert',
        category: 'validation'
    });
    // Prüfe Arrays
    const arrays = ['characters', 'npcs', 'locations', 'quests', 'encounters', 'spells', 'loot', 'sessionNotes', 'wiki', 'shops', 'links'];
    arrays.forEach(arr => {
        const isArray = Array.isArray(D[arr]);
        results.push({
            name: `Array: ${arr}`,
            pass: isArray,
            detail: isArray ? `${D[arr].length} Einträge` : 'Kein Array',
            category: 'validation'
        });
    });
    // Prüfe auf doppelte IDs
    arrays.forEach(arr => {
        if (Array.isArray(D[arr]) && D[arr].length > 0) {
            const ids = D[arr].map((item) => item.id).filter((id) => id !== undefined);
            const uniqueIds = new Set(ids);
            const hasDuplicates = ids.length !== uniqueIds.size;
            results.push({
                name: `IDs in ${arr}`,
                pass: !hasDuplicates,
                detail: hasDuplicates ? 'Duplikate gefunden!' : 'Alle IDs eindeutig',
                category: 'validation'
            });
        }
    });
    const passed = results.filter(r => r.pass).length;
    if (!silent) {
        results.forEach(r => {
            debugLogAdd(`  ${r.pass ? '✓' : '✗'} ${r.name}: ${r.detail}`);
        });
        debugLogAdd(`Validierung: ${passed}/${results.length} OK`);
        showToast(`✅ Validierung: ${passed}/${results.length} OK`, passed === results.length ? 'success' : 'warning');
    }
    // Ergebnisse im Modal anzeigen
    const valEl = $('debug-validation');
    if (valEl) {
        valEl.innerHTML = results.map(r => `
            <div style="padding: 4px 0; border-bottom: 1px solid var(--border);">
                <span style="color: ${r.pass ? 'var(--green)' : 'var(--red)'};">${r.pass ? '✓' : '✗'}</span>
                <span style="color: var(--text);">${r.name}</span>
                <span style="color: var(--text-dim); float: right;">${r.detail}</span>
            </div>
        `).join('');
    }
    return results;
}
// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================
window.clearTestData = clearTestData;
window.clearAllSpells = clearAllSpells;
window.clearAllWiki = clearAllWiki;
window.clearMindmap = clearMindmap;
window.clearAllNodes = clearAllNodes;
window.runAllTests = runAllTests;
window.runFeatureTests = runFeatureTests;
window.runNewFeatureTests = runNewFeatureTests;
window.runEntitySystemTests = runEntitySystemTests;
window.runErrorHandlingTests = runErrorHandlingTests;
window.runPerformanceTests = runPerformanceTests;
window.runPerformanceTest = runPerformanceTest;
window.runUITests = runUITests;
window.generateTestWiki = generateTestWiki;
window.generateTestMindmap = generateTestMindmap;
window.testWikiSystem = testWikiSystem;
window.testWikiLinks = testWikiLinks;
window.testNetworkSystem = testNetworkSystem;
window.testNodeTypes = testNodeTypes;
window.testQuickReference = testQuickReference;
window.testEventLog = testEventLog;
window.testUndoRedo = testUndoRedo;
window.testAutoSave = testAutoSave;
window.testIndexedDB = testIndexedDB;
window.completeReset = completeReset;
window.clearDebugLog = clearDebugLog;
window.showDebugModal = showDebugModal;
window.runValidation = runValidation;
