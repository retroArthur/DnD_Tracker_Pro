// [SECTION:ROADMAP_ACTIONS]
// Roadmap Action Handlers
// Zeilen: ~80

// ============================================================
// EVENT ACTIONS
// ============================================================

function handleCreateRoadmapEvent(e) {
    const type = e.target.dataset.type || 'location';
    createRoadmapEvent(type);
}

function handleEditRoadmapEvent(e) {
    const eventId = parseInt(e.target.dataset.id);
    if (!eventId) return;
    showEditRoadmapEventModal(eventId);
}

function handleDeleteRoadmapEvent(e) {
    const eventId = parseInt(e.target.dataset.id);
    if (!eventId) return;
    deleteRoadmapEvent(eventId);
}

function handleLinkRoadmapEntities(e) {
    const eventId = parseInt(e.target.dataset.id);
    if (!eventId) return;
    showEntityLinkerModal(eventId);
}

function handleToggleEventCompletion(e) {
    const eventId = parseInt(e.target.dataset.id);
    if (!eventId) return;
    toggleRoadmapEventCompletion(eventId);
}

// ============================================================
// VIEW ENTITY ACTIONS (from link badges)
// ============================================================

function handleViewNPC(e) {
    const npcId = parseInt(e.target.dataset.id);
    if (!npcId) return;
    switchView('npcs');
    // Optionally: scroll to NPC or open detail modal
}

function handleViewQuest(e) {
    const questId = parseInt(e.target.dataset.id);
    if (!questId) return;
    switchView('quests');
}

function handleViewLocation(e) {
    const locId = parseInt(e.target.dataset.id);
    if (!locId) return;
    switchView('locations');
}

function handleViewEncounter(e) {
    const encId = parseInt(e.target.dataset.id);
    if (!encId) return;
    switchView('encounters');
}

// ============================================================
// CONNECTION ACTIONS
// ============================================================

function handleStartConnectionMode(e) {
    startConnectionMode();
}

// ============================================================
// LAYOUT ACTIONS
// ============================================================

function handleAutoLayoutRoadmap(e) {
    autoLayoutRoadmap();
}

function handleRoadmapZoomIn(e) {
    roadmapZoomIn();
}

function handleRoadmapZoomOut(e) {
    roadmapZoomOut();
}

function handleRoadmapResetView(e) {
    roadmapResetView();
}

// ============================================================
// MODAL ACTIONS
// ============================================================

function handleSaveRoadmapEventEdit(e) {
    saveRoadmapEventEdit();
}

function handleCancelRoadmapEventEdit(e) {
    cancelRoadmapEventEdit();
}

function handleSaveEntityLinks(e) {
    saveEntityLinks();
}

function handleCancelEntityLinks(e) {
    cancelEntityLinks();
}

function handleSwitchLinkerTab(e) {
    const tabName = e.target.dataset.tab;
    if (!tabName) return;
    switchLinkerTab(tabName);
}

// ============================================================
// CONNECTION OPTIONS ACTIONS
// ============================================================

function handleSaveConnectionOptions(e) {
    saveConnectionOptions();
}

function handleCancelConnectionOptions(e) {
    cancelConnectionOptions();
}

// ============================================================
// EXPORT/IMPORT ACTIONS
// ============================================================

function handleExportRoadmap(e) {
    exportRoadmap();
}

function handleImportRoadmap(e) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (ev) => {
        const file = ev.target.files[0];
        if (file) importRoadmap(file);
    };
    input.click();
}

// ============================================================
// REGISTER ACTIONS
// ============================================================

if (typeof EventDelegation !== 'undefined') {
    EventDelegation.registerAction('createRoadmapEvent', handleCreateRoadmapEvent);
    EventDelegation.registerAction('editRoadmapEvent', handleEditRoadmapEvent);
    EventDelegation.registerAction('deleteRoadmapEvent', handleDeleteRoadmapEvent);
    EventDelegation.registerAction('linkRoadmapEntities', handleLinkRoadmapEntities);
    EventDelegation.registerAction('toggleEventCompletion', handleToggleEventCompletion);
    EventDelegation.registerAction('viewNPC', handleViewNPC);
    EventDelegation.registerAction('viewQuest', handleViewQuest);
    EventDelegation.registerAction('viewLocation', handleViewLocation);
    EventDelegation.registerAction('viewEncounter', handleViewEncounter);
    EventDelegation.registerAction('startConnectionMode', handleStartConnectionMode);
    EventDelegation.registerAction('autoLayoutRoadmap', handleAutoLayoutRoadmap);
    EventDelegation.registerAction('roadmapZoomIn', handleRoadmapZoomIn);
    EventDelegation.registerAction('roadmapZoomOut', handleRoadmapZoomOut);
    EventDelegation.registerAction('roadmapResetView', handleRoadmapResetView);
    EventDelegation.registerAction('saveRoadmapEventEdit', handleSaveRoadmapEventEdit);
    EventDelegation.registerAction('cancelRoadmapEventEdit', handleCancelRoadmapEventEdit);
    EventDelegation.registerAction('saveEntityLinks', handleSaveEntityLinks);
    EventDelegation.registerAction('cancelEntityLinks', handleCancelEntityLinks);
    EventDelegation.registerAction('switchLinkerTab', handleSwitchLinkerTab);
    EventDelegation.registerAction('saveConnectionOptions', handleSaveConnectionOptions);
    EventDelegation.registerAction('cancelConnectionOptions', handleCancelConnectionOptions);
    EventDelegation.registerAction('exportRoadmap', handleExportRoadmap);
    EventDelegation.registerAction('importRoadmap', handleImportRoadmap);
}
