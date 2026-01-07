// [SECTION:ROADMAP]
// Kampagnen-Timeline und Story-Roadmap
// Zeilen: ~439

import { $ } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';

// ============================================================
// GLOBALE VARIABLEN
// ============================================================

let roadmapZoom: number = 1;
let roadmapPan: { x: number; y: number } = { x: 0, y: 0 };
let roadmapIsPanning: boolean = false;
let roadmapPanStart: { x: number; y: number } = { x: 0, y: 0 };
let roadmapDraggedEvent: any = null;
let roadmapDragOffset: { x: number; y: number } = { x: 0, y: 0 };
let roadmapConnectionMode: boolean = false;
let roadmapConnectionStart: any = null;

// ============================================================
// INITIALISIERUNG
// ============================================================

export function initRoadmap(): void {
    const D = (window as any).D;
    const log = (window as any).log;
    const initRoadmapRendering = (window as any).initRoadmapRendering;

    // Datenstruktur initialisieren falls nicht vorhanden
    if (!D.roadmap) {
        D.roadmap = {
            events: [],
            connections: [],
            _ui: {
                pan: { x: 0, y: 0 },
                zoom: 1,
                selectedEventId: null
            }
        };
    }

    // UI State wiederherstellen
    if (D.roadmap._ui) {
        roadmapPan = D.roadmap._ui.pan || { x: 0, y: 0 };
        roadmapZoom = D.roadmap._ui.zoom || 1;
    }

    // Event-Listener registrieren
    setupRoadmapEventListeners();

    // Rendering-Komponenten initialisieren
    if (typeof initRoadmapRendering === 'function') {
        initRoadmapRendering();
    }

    if (log) log('[ROADMAP] Initialisiert', D.roadmap.events.length, 'Events');
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupRoadmapEventListeners(): void {
    const D = (window as any).D;
    const deleteRoadmapEvent = (window as any).deleteRoadmapEvent;

    const container = $('roadmap-container');
    const viewport = $('roadmap-viewport');

    if (!container || !viewport) return;

    // Pan: Mousedown auf Container oder Viewport
    container.addEventListener('mousedown', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target === container || target === viewport || target.id === 'roadmap-svg') {
            // Wenn Connection Mode aktiv ist und ins Leere geklickt wird: Abbrechen
            if (roadmapConnectionMode && roadmapConnectionStart) {
                // Aktiven Pin zurücksetzen
                const activePin = document.querySelector('.roadmap-pin.active');
                if (activePin) {
                    activePin.classList.remove('active');
                }
                roadmapConnectionStart = null;
                showToast('Verbindung abgebrochen', 'info');
                return;
            }

            roadmapIsPanning = true;
            roadmapPanStart = {
                x: e.clientX - roadmapPan.x,
                y: e.clientY - roadmapPan.y
            };
            container.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });

    // Pan: Mousemove
    container.addEventListener('mousemove', (e: MouseEvent) => {
        if (roadmapIsPanning && !roadmapDraggedEvent) {
            roadmapPan.x = e.clientX - roadmapPanStart.x;
            roadmapPan.y = e.clientY - roadmapPanStart.y;
            applyRoadmapTransform();
        } else if (roadmapDraggedEvent) {
            // Event-Drag Logik
            const rect = container.getBoundingClientRect();
            const newX = (e.clientX - rect.left - roadmapPan.x) / roadmapZoom - roadmapDragOffset.x;
            const newY = (e.clientY - rect.top - roadmapPan.y) / roadmapZoom - roadmapDragOffset.y;

            roadmapDraggedEvent.x = newX;
            roadmapDraggedEvent.y = newY;

            renderRoadmap();
        }
    });

    // Pan & Drag: Mouseup
    container.addEventListener('mouseup', () => {
        roadmapIsPanning = false;
        container.style.cursor = 'default';

        if (roadmapDraggedEvent) {
            roadmapDraggedEvent = null;
            const draggingElements = document.querySelectorAll('.roadmap-event.dragging');
            draggingElements.forEach(el => el.classList.remove('dragging'));
            saveRoadmapUIState();
            save();
        }
    });

    // Zoom: Mousewheel (Zoom to Cursor)
    container.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();

        // Mausposition relativ zum Container
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Punkt im Weltkoordinatensystem unter dem Cursor (vor dem Zoom)
        const worldX = (mouseX - roadmapPan.x) / roadmapZoom;
        const worldY = (mouseY - roadmapPan.y) / roadmapZoom;

        // Neuen Zoom-Level berechnen
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.min(Math.max(roadmapZoom * delta, 0.3), 2);

        // Pan anpassen, damit der Weltpunkt an derselben Mausposition bleibt
        roadmapPan.x = mouseX - worldX * newZoom;
        roadmapPan.y = mouseY - worldY * newZoom;
        roadmapZoom = newZoom;

        applyRoadmapTransform();
        saveRoadmapUIState();
    }, { passive: false });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        // Nur wenn Roadmap-View aktiv ist
        if ($('roadmap-view')?.classList.contains('active')) {
            if (e.key === 'Delete' && D.roadmap._ui.selectedEventId) {
                deleteRoadmapEvent(D.roadmap._ui.selectedEventId);
            }
            if (e.key === 'Escape') {
                cancelConnectionMode();
            }
        }
    });
}

// ============================================================
// TRANSFORM & RENDERING
// ============================================================

function applyRoadmapTransform(): void {
    const viewport = $('roadmap-viewport');
    if (!viewport) return;

    viewport.style.transform = `translate(${roadmapPan.x}px, ${roadmapPan.y}px) scale(${roadmapZoom})`;

    // Zoom-Anzeige aktualisieren
    const zoomDisplay = $('roadmap-zoom-display');
    if (zoomDisplay) {
        zoomDisplay.textContent = `${Math.round(roadmapZoom * 100)}%`;
    }
}

export function renderRoadmap(): void {
    const renderRoadmapEvents = (window as any).renderRoadmapEvents;
    const renderRoadmapConnections = (window as any).renderRoadmapConnections;
    const renderRoadmapToolbar = (window as any).renderRoadmapToolbar;

    if (!$('view-roadmap')?.classList.contains('active')) return;

    // CRITICAL: Events ZUERST rendern, damit Tiles im DOM existieren
    // bevor renderConnection() versucht offsetWidth/offsetHeight zu lesen!
    renderRoadmapEvents();
    renderRoadmapConnections();

    if (typeof renderRoadmapToolbar === 'function') {
        renderRoadmapToolbar();
    }
    applyRoadmapTransform();
}

function saveRoadmapUIState(): void {
    const D = (window as any).D;
    if (!D.roadmap) return;

    D.roadmap._ui = {
        pan: { ...roadmapPan },
        zoom: roadmapZoom,
        selectedEventId: D.roadmap._ui?.selectedEventId || null
    };
}

// ============================================================
// ZOOM CONTROLS
// ============================================================

export function roadmapZoomIn(): void {
    zoomToCenter(1.2);
}

export function roadmapZoomOut(): void {
    zoomToCenter(1 / 1.2);
}

function zoomToCenter(factor: number): void {
    const container = $('roadmap-container');
    if (!container) return;

    // Mitte des sichtbaren Bereichs
    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;

    // Punkt im Weltkoordinatensystem unter der Mitte (vor dem Zoom)
    const worldX = (centerX - roadmapPan.x) / roadmapZoom;
    const worldY = (centerY - roadmapPan.y) / roadmapZoom;

    // Neuen Zoom-Level berechnen
    const newZoom = Math.min(Math.max(roadmapZoom * factor, 0.3), 2);

    // Pan anpassen, damit der Weltpunkt in der Mitte bleibt
    roadmapPan.x = centerX - worldX * newZoom;
    roadmapPan.y = centerY - worldY * newZoom;
    roadmapZoom = newZoom;

    applyRoadmapTransform();
    saveRoadmapUIState();
}

export function roadmapResetView(): void {
    roadmapZoom = 1;
    roadmapPan = { x: 100, y: 50 };
    applyRoadmapTransform();
    saveRoadmapUIState();
    save();
}

// ============================================================
// EVENT DRAG HANDLERS
// ============================================================

export function startEventDrag(eventId: number, e: MouseEvent): void {
    const D = (window as any).D;
    const event = D.roadmap.events.find((ev: any) => ev.id === eventId);
    if (!event) return;

    roadmapDraggedEvent = event;

    const container = $('roadmap-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();

    roadmapDragOffset = {
        x: (e.clientX - rect.left - roadmapPan.x) / roadmapZoom - event.x,
        y: (e.clientY - rect.top - roadmapPan.y) / roadmapZoom - event.y
    };

    const eventElement = document.querySelector(`.roadmap-event[data-id="${eventId}"]`);
    if (eventElement) {
        eventElement.classList.add('dragging');
    }

    e.stopPropagation();
}

// ============================================================
// CONNECTION MODE
// ============================================================

export function startConnectionMode(): void {
    roadmapConnectionMode = true;
    roadmapConnectionStart = null;
    showToast('Verbindung erstellen: Klicke auf Start-Event', 'info');

    const container = $('roadmap-container');
    if (container) {
        container.classList.add('connection-mode');
    }
}

export function cancelConnectionMode(): void {
    roadmapConnectionMode = false;
    roadmapConnectionStart = null;

    const container = $('roadmap-container');
    if (container) {
        container.classList.remove('connection-mode');
    }

    showToast('Verbindungs-Modus abgebrochen', 'info');
}

export function handleEventClickForConnection(eventId: number): void {
    const createRoadmapConnection = (window as any).createRoadmapConnection;

    if (!roadmapConnectionMode) return;

    if (!roadmapConnectionStart) {
        // Erstes Event ausgewählt
        roadmapConnectionStart = eventId;
        showToast('Start-Event ausgewählt. Klicke auf Ziel-Event', 'info');
    } else {
        // Zweites Event ausgewählt - Verbindung erstellen
        if (roadmapConnectionStart === eventId) {
            showToast('Start und Ziel können nicht identisch sein', 'warning');
            return;
        }

        createRoadmapConnection(roadmapConnectionStart, eventId, 'main');
        cancelConnectionMode();
    }
}

// Neue Pin-basierte Connection-Logik
export function handlePinClickForConnection(eventId: number, pinPosition: string): void {
    const showConnectionOptionsModal = (window as any).showConnectionOptionsModal;

    if (!roadmapConnectionMode) return;

    if (!roadmapConnectionStart) {
        // Erster Pin ausgewählt
        roadmapConnectionStart = {
            eventId: eventId,
            pin: pinPosition
        };

        // Pin visuell markieren
        const pinElement = document.querySelector(
            `.roadmap-event[data-id="${eventId}"] .roadmap-pin[data-pin="${pinPosition}"]`
        );
        if (pinElement) {
            pinElement.classList.add('active');
        }

        showToast('Start-Pin ausgewählt. Klicke auf Ziel-Pin', 'info');
    } else {
        // Zweiter Pin ausgewählt - Optionen-Modal zeigen
        if (roadmapConnectionStart.eventId === eventId) {
            showToast('Start und Ziel können nicht identisch sein', 'warning');
            return;
        }

        // Temporäre Verbindungsdaten speichern
        (window as any).roadmapTempConnection = {
            fromId: roadmapConnectionStart.eventId,
            toId: eventId,
            fromPin: roadmapConnectionStart.pin,
            toPin: pinPosition
        };

        // Aktiven Pin zurücksetzen
        const activePin = document.querySelector('.roadmap-pin.active');
        if (activePin) {
            activePin.classList.remove('active');
        }

        // Connection Mode beenden
        cancelConnectionMode();

        // Options-Modal zeigen
        showConnectionOptionsModal();
    }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getEventTypeIcon(type: string): string {
    const icons: Record<string, string> = {
        location: '📍',
        travel: '🗺️',
        encounter: '⚔️',
        combat: '🎯',
        quest: '📜',
        discovery: '💡',
        social: '💬',
        decision: '❓'
    };
    return icons[type] || '📌';
}

export function getEventTypeColor(type: string): string {
    const colors: Record<string, string> = {
        location: '#3b82f6',
        travel: '#8b5cf6',
        encounter: '#ef4444',
        combat: '#dc2626',
        quest: '#f59e0b',
        discovery: '#10b981',
        social: '#ec4899',
        decision: '#6366f1'
    };
    return colors[type] || '#6b7280';
}

export function getConnectionTypeColor(type: string): string {
    const colors: Record<string, string> = {
        main: '#60a5fa',
        branch: '#a78bfa',
        conditional: '#fbbf24',
        fallback: '#6b7280'
    };
    return colors[type] || '#60a5fa';
}

// ============================================================
// VIEW LIFECYCLE
// ============================================================

export function onRoadmapViewShow(): void {
    initRoadmap();
    renderRoadmap();
}

export function onRoadmapViewHide(): void {
    saveRoadmapUIState();
    save();
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).initRoadmap = initRoadmap;
(window as any).renderRoadmap = renderRoadmap;
(window as any).roadmapZoomIn = roadmapZoomIn;
(window as any).roadmapZoomOut = roadmapZoomOut;
(window as any).roadmapResetView = roadmapResetView;
(window as any).startEventDrag = startEventDrag;
(window as any).startConnectionMode = startConnectionMode;
(window as any).cancelConnectionMode = cancelConnectionMode;
(window as any).handleEventClickForConnection = handleEventClickForConnection;
(window as any).handlePinClickForConnection = handlePinClickForConnection;
(window as any).onRoadmapViewShow = onRoadmapViewShow;
(window as any).onRoadmapViewHide = onRoadmapViewHide;
(window as any).getEventTypeIcon = getEventTypeIcon;
(window as any).getEventTypeColor = getEventTypeColor;
(window as any).getConnectionTypeColor = getConnectionTypeColor;
(window as any).roadmapConnectionMode = roadmapConnectionMode;
