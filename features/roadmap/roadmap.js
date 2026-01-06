// [SECTION:ROADMAP]
// Kampagnen-Timeline und Story-Roadmap
// Zeilen: ~400

// ============================================================
// GLOBALE VARIABLEN
// ============================================================

let roadmapZoom = 1;
let roadmapPan = { x: 0, y: 0 };
let roadmapIsPanning = false;
let roadmapPanStart = { x: 0, y: 0 };
let roadmapDraggedEvent = null;
let roadmapDragOffset = { x: 0, y: 0 };
let roadmapConnectionMode = false;
let roadmapConnectionStart = null;

// ============================================================
// INITIALISIERUNG
// ============================================================

function initRoadmap() {
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

    log('[ROADMAP] Initialisiert', D.roadmap.events.length, 'Events');
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupRoadmapEventListeners() {
    const container = $('roadmap-container');
    const viewport = $('roadmap-viewport');

    if (!container || !viewport) return;

    // Pan: Mousedown auf Container oder Viewport
    container.addEventListener('mousedown', (e) => {
        if (e.target === container || e.target === viewport || e.target.id === 'roadmap-svg') {
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
    container.addEventListener('mousemove', (e) => {
        if (roadmapIsPanning && !roadmapDraggedEvent) {
            roadmapPan.x = e.clientX - roadmapPanStart.x;
            roadmapPan.y = e.clientY - roadmapPanStart.y;
            applyRoadmapTransform();
        } else if (roadmapDraggedEvent) {
            // Event-Drag Logik (siehe unten)
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
    container.addEventListener('wheel', (e) => {
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
    document.addEventListener('keydown', (e) => {
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

function applyRoadmapTransform() {
    const viewport = $('roadmap-viewport');
    if (!viewport) return;

    viewport.style.transform = `translate(${roadmapPan.x}px, ${roadmapPan.y}px) scale(${roadmapZoom})`;

    // Zoom-Anzeige aktualisieren
    const zoomDisplay = $('roadmap-zoom-display');
    if (zoomDisplay) {
        zoomDisplay.textContent = `${Math.round(roadmapZoom * 100)}%`;
    }
}

function renderRoadmap() {
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

function saveRoadmapUIState() {
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

function roadmapZoomIn() {
    zoomToCenter(1.2);
}

function roadmapZoomOut() {
    zoomToCenter(1 / 1.2);
}

function zoomToCenter(factor) {
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

function roadmapResetView() {
    roadmapZoom = 1;
    roadmapPan = { x: 100, y: 50 };
    applyRoadmapTransform();
    saveRoadmapUIState();
    save();
}

// ============================================================
// EVENT DRAG HANDLERS
// ============================================================

function startEventDrag(eventId, e) {
    const event = D.roadmap.events.find(ev => ev.id === eventId);
    if (!event) return;

    roadmapDraggedEvent = event;

    const container = $('roadmap-container');
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

function startConnectionMode() {
    roadmapConnectionMode = true;
    roadmapConnectionStart = null;
    showToast('Verbindung erstellen: Klicke auf Start-Event', 'info');

    const container = $('roadmap-container');
    if (container) {
        container.classList.add('connection-mode');
    }
}

function cancelConnectionMode() {
    roadmapConnectionMode = false;
    roadmapConnectionStart = null;

    const container = $('roadmap-container');
    if (container) {
        container.classList.remove('connection-mode');
    }

    showToast('Verbindungs-Modus abgebrochen', 'info');
}

function handleEventClickForConnection(eventId) {
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
function handlePinClickForConnection(eventId, pinPosition) {
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
        window.roadmapTempConnection = {
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

function getEventTypeIcon(type) {
    const icons = {
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

function getEventTypeColor(type) {
    const colors = {
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

function getConnectionTypeColor(type) {
    const colors = {
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

function onRoadmapViewShow() {
    initRoadmap();
    renderRoadmap();
}

function onRoadmapViewHide() {
    saveRoadmapUIState();
    save();
}

// ============================================================
// EXPORT
// ============================================================

// Funktionen für globalen Zugriff
window.initRoadmap = initRoadmap;
window.renderRoadmap = renderRoadmap;
window.roadmapZoomIn = roadmapZoomIn;
window.roadmapZoomOut = roadmapZoomOut;
window.roadmapResetView = roadmapResetView;
window.startEventDrag = startEventDrag;
window.startConnectionMode = startConnectionMode;
window.cancelConnectionMode = cancelConnectionMode;
window.handleEventClickForConnection = handleEventClickForConnection;
window.handlePinClickForConnection = handlePinClickForConnection;
window.onRoadmapViewShow = onRoadmapViewShow;
window.onRoadmapViewHide = onRoadmapViewHide;
