// [SECTION:ROADMAP_UI]
// Roadmap UI - Modals & Forms
// Zeilen: ~376
// ============================================================
// EVENT EDIT MODAL
// ============================================================
function showEditRoadmapEventModal(eventId) {
    const D = window.D;
    const event = D.roadmap.events.find((e) => e.id === eventId);
    if (!event) {
        showToast('Event nicht gefunden', 'error');
        return;
    }
    // Modal-Felder füllen
    const titleEl = $('roadmap-event-title');
    const typeEl = $('roadmap-event-type');
    const notesEl = $('roadmap-event-notes');
    const completedEl = $('roadmap-event-completed');
    const modal = $('roadmap-event-modal');
    if (titleEl)
        titleEl.value = event.title || '';
    if (typeEl)
        typeEl.value = event.type || 'location';
    // Rich-Text Editor: Use innerHTML instead of value
    const descEditor = $('roadmap-event-description');
    if (descEditor) {
        descEditor.innerHTML = event.description || '';
    }
    if (notesEl)
        notesEl.value = event.notes || '';
    if (completedEl)
        completedEl.checked = event.completed || false;
    // Event-ID speichern für Save-Handler
    if (modal)
        modal.dataset.eventId = String(eventId);
    showModal('roadmap-event-modal');
}
function saveRoadmapEventEdit() {
    const updateRoadmapEvent = window.updateRoadmapEvent;
    const modal = $('roadmap-event-modal');
    if (!modal || !modal.dataset.eventId) {
        showToast('Event-ID nicht gefunden', 'error');
        return;
    }
    const eventId = parseInt(modal.dataset.eventId, 10);
    if (isNaN(eventId) || eventId < 0) {
        showToast('Ungültige Event-ID', 'error');
        return;
    }
    // Rich-Text Editor: Read innerHTML instead of value
    const descEditor = $('roadmap-event-description');
    const description = descEditor ? descEditor.innerHTML.trim() : '';
    const titleEl = $('roadmap-event-title');
    const typeEl = $('roadmap-event-type');
    const notesEl = $('roadmap-event-notes');
    const completedEl = $('roadmap-event-completed');
    const updates = {
        title: titleEl?.value.trim() || 'Unbenannt',
        type: typeEl?.value || 'location',
        description: description,
        notes: notesEl?.value.trim() || '',
        completed: completedEl?.checked || false
    };
    updateRoadmapEvent(eventId, updates);
    hideModal('roadmap-event-modal');
}
function cancelRoadmapEventEdit() {
    hideModal('roadmap-event-modal');
}
// ============================================================
// ENTITY LINKER MODAL
// ============================================================
function showEntityLinkerModal(eventId) {
    const D = window.D;
    const event = D.roadmap.events.find((e) => e.id === eventId);
    if (!event) {
        showToast('Event nicht gefunden', 'error');
        return;
    }
    const modal = $('roadmap-linker-modal');
    // Event-ID speichern
    if (modal)
        modal.dataset.eventId = String(eventId);
    // Suchfeld leeren
    const searchInput = $('roadmap-linker-search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    // Tabs rendern
    renderLinkerTab('npcs', event);
    renderLinkerTab('quests', event);
    renderLinkerTab('locations', event);
    renderLinkerTab('encounters', event);
    // Ersten Tab aktivieren
    switchLinkerTab('npcs');
    // Suchfeld-Listener registrieren
    setupLinkerSearch(event);
    showModal('roadmap-linker-modal');
}
function renderLinkerTab(tabName, event, searchTerm = '') {
    const D = window.D;
    const content = $(`roadmap-linker-${tabName}`);
    if (!content)
        return;
    let html = '';
    let entities = [];
    let linkedIds = [];
    switch (tabName) {
        case 'npcs':
            entities = D.npcs || [];
            linkedIds = event.linkedNPCs || [];
            break;
        case 'quests':
            entities = D.quests || [];
            linkedIds = event.linkedQuests || [];
            break;
        case 'locations':
            entities = D.locations || [];
            linkedIds = event.linkedLocations || [];
            break;
        case 'encounters':
            entities = D.encounters || [];
            linkedIds = event.linkedEncounters || [];
            break;
    }
    // Filter nach Suchbegriff
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        entities = entities.filter(entity => {
            const name = (entity.name || entity.title || '').toLowerCase();
            return name.includes(term);
        });
    }
    if (entities.length === 0) {
        if (searchTerm) {
            html = `<p class="no-entities">Keine Ergebnisse für "${esc(searchTerm)}"</p>`;
        }
        else {
            html = `<p class="no-entities">Keine ${getEntityLabel(tabName)} vorhanden</p>`;
        }
    }
    else {
        html = '<div class="entity-checkboxes">';
        entities.forEach(entity => {
            const id = entity.id;
            const name = entity.name || entity.title || 'Unbenannt';
            const checked = linkedIds.includes(id) ? 'checked' : '';
            html += `
                <label class="entity-checkbox-item">
                    <input type="checkbox" value="${id}" ${checked}>
                    <span>${esc(name)}</span>
                </label>
            `;
        });
        html += '</div>';
    }
    content.innerHTML = html;
}
function switchLinkerTab(tabName) {
    // Alle Tabs deaktivieren
    const tabs = $$('.roadmap-linker-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    // Alle Tab-Contents verstecken
    const contents = $$('.roadmap-linker-content');
    contents.forEach(content => content.classList.remove('active'));
    // Gewählten Tab aktivieren
    const activeTab = document.querySelector(`.roadmap-linker-tab[data-tab="${tabName}"]`);
    if (activeTab)
        activeTab.classList.add('active');
    const activeContent = $(`roadmap-linker-${tabName}`);
    if (activeContent)
        activeContent.classList.add('active');
}
function saveEntityLinks() {
    const D = window.D;
    const renderRoadmap = window.renderRoadmap;
    const modal = $('roadmap-linker-modal');
    if (!modal || !modal.dataset.eventId) {
        showToast('Event-ID nicht gefunden', 'error');
        return;
    }
    const eventId = parseInt(modal.dataset.eventId, 10);
    if (isNaN(eventId) || eventId < 0) {
        showToast('Ungültige Event-ID', 'error');
        return;
    }
    const event = D.roadmap.events.find((e) => e.id === eventId);
    if (!event) {
        showToast('Event nicht gefunden', 'error');
        return;
    }
    pushUndo('Entity-Links aktualisiert');
    // Helper function to safely parse entity IDs from checkboxes
    const parseEntityIds = (checkboxes) => {
        return Array.from(checkboxes)
            .filter((cb) => cb.checked)
            .map((cb) => {
            const id = parseInt(cb.value, 10);
            return isNaN(id) ? null : id;
        })
            .filter((id) => id !== null && id >= 0);
    };
    // NPCs
    const npcCheckboxes = $$('#roadmap-linker-npcs input[type="checkbox"]');
    event.linkedNPCs = parseEntityIds(npcCheckboxes);
    // Quests
    const questCheckboxes = $$('#roadmap-linker-quests input[type="checkbox"]');
    event.linkedQuests = parseEntityIds(questCheckboxes);
    // Locations
    const locCheckboxes = $$('#roadmap-linker-locations input[type="checkbox"]');
    event.linkedLocations = parseEntityIds(locCheckboxes);
    // Encounters
    const encCheckboxes = $$('#roadmap-linker-encounters input[type="checkbox"]');
    event.linkedEncounters = parseEntityIds(encCheckboxes);
    save();
    renderRoadmap();
    hideModal('roadmap-linker-modal');
    showToast('Verknüpfungen gespeichert', 'success');
}
function cancelEntityLinks() {
    hideModal('roadmap-linker-modal');
}
function setupLinkerSearch(event) {
    const searchInput = $('roadmap-linker-search-input');
    if (!searchInput)
        return;
    // Vorherigen Listener entfernen (falls vorhanden)
    searchInput.removeEventListener('input', searchInput._linkerSearchHandler);
    // Neuen Listener mit Event-Kontext
    searchInput._linkerSearchHandler = function () {
        const searchTerm = this.value.trim();
        // Aktuell aktiven Tab finden
        const activeTab = document.querySelector('.roadmap-linker-tab.active');
        const tabName = activeTab?.dataset.tab || 'npcs';
        // Nur den aktiven Tab neu rendern
        renderLinkerTab(tabName, event, searchTerm);
    };
    searchInput.addEventListener('input', searchInput._linkerSearchHandler);
}
function getEntityLabel(tabName) {
    const labels = {
        npcs: 'NPCs',
        quests: 'Quests',
        locations: 'Orte',
        encounters: 'Encounters'
    };
    return labels[tabName] || tabName;
}
// ============================================================
// TYPE SELECTOR MODAL
// ============================================================
function showEventTypeSelector() {
    showModal('roadmap-type-selector-modal');
}
function createEventFromTypeSelector(type) {
    const createRoadmapEvent = window.createRoadmapEvent;
    hideModal('roadmap-type-selector-modal');
    createRoadmapEvent(type);
}
// ============================================================
// CONNECTION OPTIONS MODAL
// ============================================================
function showConnectionOptionsModal() {
    // Standard-Werte setzen (Stil 5, Farbe blau)
    const styleRadios = $$('input[name="connection-style"]');
    styleRadios.forEach(radio => {
        radio.checked = radio.value === '5';
    });
    const colorRadios = $$('input[name="connection-color"]');
    colorRadios.forEach(radio => {
        radio.checked = radio.value === 'blue';
    });
    // Click-Handler für Style-Options hinzufügen (visuelles Feedback)
    const styleOptions = $$('.roadmap-style-option');
    styleOptions.forEach(option => {
        option.addEventListener('click', () => {
            styleOptions.forEach(opt => opt.style.borderColor = 'rgba(59, 130, 246, 0.3)');
            option.style.borderColor = '#60a5fa';
        });
    });
    // Click-Handler für Color-Swatches hinzufügen (visuelles Feedback)
    const colorSwatches = $$('.color-swatch');
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            colorSwatches.forEach(sw => sw.style.borderColor = 'transparent');
            swatch.style.borderColor = '#60a5fa';
        });
    });
    showModal('roadmap-connection-options-modal');
}
function saveConnectionOptions() {
    const createRoadmapConnection = window.createRoadmapConnection;
    if (!window.roadmapTempConnection) {
        showToast('Keine Verbindungsdaten gefunden', 'error');
        return;
    }
    // Gewählte Optionen auslesen
    const styleRadio = document.querySelector('input[name="connection-style"]:checked');
    const colorRadio = document.querySelector('input[name="connection-color"]:checked');
    const style = styleRadio ? styleRadio.value : '5';
    const color = colorRadio ? colorRadio.value : 'blue';
    const tempConn = window.roadmapTempConnection;
    // Verbindung erstellen mit Optionen
    createRoadmapConnection(tempConn.fromId, tempConn.toId, 'main', // Legacy type parameter
    tempConn.fromPin, tempConn.toPin, style, color);
    // Temporäre Daten löschen
    delete window.roadmapTempConnection;
    hideModal('roadmap-connection-options-modal');
}
function cancelConnectionOptions() {
    // Temporäre Daten löschen
    delete window.roadmapTempConnection;
    hideModal('roadmap-connection-options-modal');
    showToast('Verbindung abgebrochen', 'info');
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.showEditRoadmapEventModal = showEditRoadmapEventModal;
window.saveRoadmapEventEdit = saveRoadmapEventEdit;
window.cancelRoadmapEventEdit = cancelRoadmapEventEdit;
window.showEntityLinkerModal = showEntityLinkerModal;
window.switchLinkerTab = switchLinkerTab;
window.saveEntityLinks = saveEntityLinks;
window.cancelEntityLinks = cancelEntityLinks;
window.showConnectionOptionsModal = showConnectionOptionsModal;
window.saveConnectionOptions = saveConnectionOptions;
window.cancelConnectionOptions = cancelConnectionOptions;
