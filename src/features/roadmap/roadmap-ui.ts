// [SECTION:ROADMAP_UI]
// Roadmap UI - Modals & Forms
// Zeilen: ~376

import { $, $$, esc } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { pushUndo } from '@systems/undo';
import { showModal, hideModal } from '@systems/spellslots/navigation';

// ============================================================
// EVENT EDIT MODAL
// ============================================================

export function showEditRoadmapEventModal(eventId: number): void {
    const D = (window as any).D;
    const event = D.roadmap.events.find((e: any) => e.id === eventId);
    if (!event) {
        showToast('Event nicht gefunden', 'error');
        return;
    }

    // Modal-Felder füllen
    const titleEl = $('roadmap-event-title') as HTMLInputElement | null;
    const typeEl = $('roadmap-event-type') as HTMLSelectElement | null;
    const notesEl = $('roadmap-event-notes') as HTMLTextAreaElement | null;
    const completedEl = $('roadmap-event-completed') as HTMLInputElement | null;
    const modal = $('roadmap-event-modal');

    if (titleEl) titleEl.value = event.title || '';
    if (typeEl) typeEl.value = event.type || 'location';

    // Rich-Text Editor: Use innerHTML instead of value
    const descEditor = $('roadmap-event-description');
    if (descEditor) {
        descEditor.innerHTML = event.description || '';
    }

    if (notesEl) notesEl.value = event.notes || '';
    if (completedEl) completedEl.checked = event.completed || false;

    // Event-ID speichern für Save-Handler
    if (modal) (modal as any).dataset.eventId = String(eventId);

    showModal('roadmap-event-modal');
}

export function saveRoadmapEventEdit(): void {
    const updateRoadmapEvent = (window as any).updateRoadmapEvent;

    const modal = $('roadmap-event-modal');
    if (!modal || !(modal as any).dataset.eventId) {
        showToast('Event-ID nicht gefunden', 'error');
        return;
    }

    const eventId = parseInt((modal as any).dataset.eventId, 10);
    if (isNaN(eventId) || eventId < 0) {
        showToast('Ungültige Event-ID', 'error');
        return;
    }

    // Rich-Text Editor: Read innerHTML instead of value
    const descEditor = $('roadmap-event-description');
    const description = descEditor ? descEditor.innerHTML.trim() : '';

    const titleEl = $('roadmap-event-title') as HTMLInputElement | null;
    const typeEl = $('roadmap-event-type') as HTMLSelectElement | null;
    const notesEl = $('roadmap-event-notes') as HTMLTextAreaElement | null;
    const completedEl = $('roadmap-event-completed') as HTMLInputElement | null;

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

export function cancelRoadmapEventEdit(): void {
    hideModal('roadmap-event-modal');
}

// ============================================================
// ENTITY LINKER MODAL
// ============================================================

export function showEntityLinkerModal(eventId: number): void {
    const D = (window as any).D;
    const event = D.roadmap.events.find((e: any) => e.id === eventId);
    if (!event) {
        showToast('Event nicht gefunden', 'error');
        return;
    }

    const modal = $('roadmap-linker-modal');
    // Event-ID speichern
    if (modal) (modal as any).dataset.eventId = String(eventId);

    // Suchfeld leeren
    const searchInput = $('roadmap-linker-search-input') as HTMLInputElement | null;
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

function renderLinkerTab(tabName: string, event: any, searchTerm: string = ''): void {
    const D = (window as any).D;
    const content = $(`roadmap-linker-${tabName}`);
    if (!content) return;

    let html = '';
    let entities: any[] = [];
    let linkedIds: number[] = [];

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
        } else {
            html = `<p class="no-entities">Keine ${getEntityLabel(tabName)} vorhanden</p>`;
        }
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

export function switchLinkerTab(tabName: string): void {
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

export function saveEntityLinks(): void {
    const D = (window as any).D;
    const renderRoadmap = (window as any).renderRoadmap;

    const modal = $('roadmap-linker-modal');
    if (!modal || !(modal as any).dataset.eventId) {
        showToast('Event-ID nicht gefunden', 'error');
        return;
    }

    const eventId = parseInt((modal as any).dataset.eventId, 10);
    if (isNaN(eventId) || eventId < 0) {
        showToast('Ungültige Event-ID', 'error');
        return;
    }

    const event = D.roadmap.events.find((e: any) => e.id === eventId);
    if (!event) {
        showToast('Event nicht gefunden', 'error');
        return;
    }

    pushUndo('Entity-Links aktualisiert');

    // Helper function to safely parse entity IDs from checkboxes
    const parseEntityIds = (checkboxes: NodeListOf<Element>): number[] => {
        return Array.from(checkboxes)
            .filter((cb: any) => cb.checked)
            .map((cb: any) => {
                const id = parseInt(cb.value, 10);
                return isNaN(id) ? null : id;
            })
            .filter((id): id is number => id !== null && id >= 0);
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

export function cancelEntityLinks(): void {
    hideModal('roadmap-linker-modal');
}

function setupLinkerSearch(event: any): void {
    const searchInput = $('roadmap-linker-search-input') as any;
    if (!searchInput) return;

    // Vorherigen Listener entfernen (falls vorhanden)
    searchInput.removeEventListener('input', searchInput._linkerSearchHandler);

    // Neuen Listener mit Event-Kontext
    searchInput._linkerSearchHandler = function(this: HTMLInputElement) {
        const searchTerm = this.value.trim();

        // Aktuell aktiven Tab finden
        const activeTab = document.querySelector('.roadmap-linker-tab.active') as HTMLElement | null;
        const tabName = activeTab?.dataset.tab || 'npcs';

        // Nur den aktiven Tab neu rendern
        renderLinkerTab(tabName, event, searchTerm);
    };

    searchInput.addEventListener('input', searchInput._linkerSearchHandler);
}

function getEntityLabel(tabName: string): string {
    const labels: Record<string, string> = {
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

export function showEventTypeSelector(): void {
    showModal('roadmap-type-selector-modal');
}

export function createEventFromTypeSelector(type: string): void {
    const createRoadmapEvent = (window as any).createRoadmapEvent;
    hideModal('roadmap-type-selector-modal');
    createRoadmapEvent(type);
}

// ============================================================
// CONNECTION OPTIONS MODAL
// ============================================================

export function showConnectionOptionsModal(): void {
    // Standard-Werte setzen (Stil 5, Farbe blau)
    const styleRadios = $$('input[name="connection-style"]');
    styleRadios.forEach(radio => {
        (radio as HTMLInputElement).checked = (radio as HTMLInputElement).value === '5';
    });

    const colorRadios = $$('input[name="connection-color"]');
    colorRadios.forEach(radio => {
        (radio as HTMLInputElement).checked = (radio as HTMLInputElement).value === 'blue';
    });

    // Click-Handler für Style-Options hinzufügen (visuelles Feedback)
    const styleOptions = $$('.roadmap-style-option');
    styleOptions.forEach(option => {
        option.addEventListener('click', () => {
            styleOptions.forEach(opt => (opt as HTMLElement).style.borderColor = 'rgba(59, 130, 246, 0.3)');
            (option as HTMLElement).style.borderColor = '#60a5fa';
        });
    });

    // Click-Handler für Color-Swatches hinzufügen (visuelles Feedback)
    const colorSwatches = $$('.color-swatch');
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            colorSwatches.forEach(sw => (sw as HTMLElement).style.borderColor = 'transparent');
            (swatch as HTMLElement).style.borderColor = '#60a5fa';
        });
    });

    showModal('roadmap-connection-options-modal');
}

export function saveConnectionOptions(): void {
    const createRoadmapConnection = (window as any).createRoadmapConnection;

    if (!(window as any).roadmapTempConnection) {
        showToast('Keine Verbindungsdaten gefunden', 'error');
        return;
    }

    // Gewählte Optionen auslesen
    const styleRadio = document.querySelector('input[name="connection-style"]:checked') as HTMLInputElement | null;
    const colorRadio = document.querySelector('input[name="connection-color"]:checked') as HTMLInputElement | null;

    const style = styleRadio ? styleRadio.value : '5';
    const color = colorRadio ? colorRadio.value : 'blue';

    const tempConn = (window as any).roadmapTempConnection;

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
    delete (window as any).roadmapTempConnection;

    hideModal('roadmap-connection-options-modal');
}

export function cancelConnectionOptions(): void {
    // Temporäre Daten löschen
    delete (window as any).roadmapTempConnection;
    hideModal('roadmap-connection-options-modal');
    showToast('Verbindung abgebrochen', 'info');
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).showEditRoadmapEventModal = showEditRoadmapEventModal;
(window as any).saveRoadmapEventEdit = saveRoadmapEventEdit;
(window as any).cancelRoadmapEventEdit = cancelRoadmapEventEdit;
(window as any).showEntityLinkerModal = showEntityLinkerModal;
(window as any).switchLinkerTab = switchLinkerTab;
(window as any).saveEntityLinks = saveEntityLinks;
(window as any).cancelEntityLinks = cancelEntityLinks;
(window as any).showEventTypeSelector = showEventTypeSelector;
(window as any).createEventFromTypeSelector = createEventFromTypeSelector;
(window as any).showConnectionOptionsModal = showConnectionOptionsModal;
(window as any).saveConnectionOptions = saveConnectionOptions;
(window as any).cancelConnectionOptions = cancelConnectionOptions;
