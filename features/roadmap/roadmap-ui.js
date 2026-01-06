// [SECTION:ROADMAP_UI]
// Roadmap UI - Modals & Forms
// Zeilen: ~150

// ============================================================
// EVENT EDIT MODAL
// ============================================================

function showEditRoadmapEventModal(eventId) {
    const event = D.roadmap.events.find(e => e.id === eventId);
    if (!event) {
        showToast('Event nicht gefunden', 'error');
        return;
    }

    // Modal-Felder füllen
    $('roadmap-event-title').value = event.title || '';
    $('roadmap-event-type').value = event.type || 'location';
    $('roadmap-event-description').value = event.description || '';
    $('roadmap-event-duration').value = event.estimatedDuration || '';
    $('roadmap-event-notes').value = event.notes || '';
    $('roadmap-event-completed').checked = event.completed || false;

    // Event-ID speichern für Save-Handler
    $('roadmap-event-modal').dataset.eventId = eventId;

    showModal('roadmap-event-modal');
}

function saveRoadmapEventEdit() {
    const eventId = parseInt($('roadmap-event-modal').dataset.eventId);
    if (!eventId) return;

    const updates = {
        title: $('roadmap-event-title').value.trim() || 'Unbenannt',
        type: $('roadmap-event-type').value,
        description: $('roadmap-event-description').value.trim(),
        estimatedDuration: $('roadmap-event-duration').value.trim(),
        notes: $('roadmap-event-notes').value.trim(),
        completed: $('roadmap-event-completed').checked
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
    const event = D.roadmap.events.find(e => e.id === eventId);
    if (!event) {
        showToast('Event nicht gefunden', 'error');
        return;
    }

    // Event-ID speichern
    $('roadmap-linker-modal').dataset.eventId = eventId;

    // Tabs rendern
    renderLinkerTab('npcs', event);
    renderLinkerTab('quests', event);
    renderLinkerTab('locations', event);
    renderLinkerTab('encounters', event);

    // Ersten Tab aktivieren
    switchLinkerTab('npcs');

    showModal('roadmap-linker-modal');
}

function renderLinkerTab(tabName, event) {
    const content = $(`roadmap-linker-${tabName}`);
    if (!content) return;

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

    if (entities.length === 0) {
        html = `<p class="no-entities">Keine ${getEntityLabel(tabName)} vorhanden</p>`;
    } else {
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
    if (activeTab) activeTab.classList.add('active');

    const activeContent = $(`roadmap-linker-${tabName}`);
    if (activeContent) activeContent.classList.add('active');
}

function saveEntityLinks() {
    const eventId = parseInt($('roadmap-linker-modal').dataset.eventId);
    if (!eventId) return;

    const event = D.roadmap.events.find(e => e.id === eventId);
    if (!event) return;

    pushUndo('Entity-Links aktualisiert');

    // NPCs
    const npcCheckboxes = $$('#roadmap-linker-npcs input[type="checkbox"]');
    event.linkedNPCs = Array.from(npcCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value));

    // Quests
    const questCheckboxes = $$('#roadmap-linker-quests input[type="checkbox"]');
    event.linkedQuests = Array.from(questCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value));

    // Locations
    const locCheckboxes = $$('#roadmap-linker-locations input[type="checkbox"]');
    event.linkedLocations = Array.from(locCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value));

    // Encounters
    const encCheckboxes = $$('#roadmap-linker-encounters input[type="checkbox"]');
    event.linkedEncounters = Array.from(encCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value));

    save();
    renderRoadmap();
    hideModal('roadmap-linker-modal');
    showToast('Verknüpfungen gespeichert', 'success');
}

function cancelEntityLinks() {
    hideModal('roadmap-linker-modal');
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
    createRoadmapConnection(
        tempConn.fromId,
        tempConn.toId,
        'main', // Legacy type parameter
        tempConn.fromPin,
        tempConn.toPin,
        style,
        color
    );

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
// EXPORT
// ============================================================

window.showEditRoadmapEventModal = showEditRoadmapEventModal;
window.saveRoadmapEventEdit = saveRoadmapEventEdit;
window.cancelRoadmapEventEdit = cancelRoadmapEventEdit;
window.showEntityLinkerModal = showEntityLinkerModal;
window.switchLinkerTab = switchLinkerTab;
window.saveEntityLinks = saveEntityLinks;
window.cancelEntityLinks = cancelEntityLinks;
window.showEventTypeSelector = showEventTypeSelector;
window.createEventFromTypeSelector = createEventFromTypeSelector;
window.showConnectionOptionsModal = showConnectionOptionsModal;
window.saveConnectionOptions = saveConnectionOptions;
window.cancelConnectionOptions = cancelConnectionOptions;
