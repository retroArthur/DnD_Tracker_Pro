// [SECTION:ROADMAP_RENDER]
// Roadmap Rendering - SVG Connections & Event Tiles
// Zeilen: ~519
// ============================================================
// SVG CONNECTIONS RENDERING
// ============================================================
function renderRoadmapConnections() {
    const svg = $('roadmap-svg');
    if (!svg)
        return;
    // SVG-Größe dynamisch an Events anpassen
    updateSVGViewBox();
    // Vorhandene Paths entfernen
    const existingPaths = svg.querySelectorAll('.roadmap-connection-path');
    existingPaths.forEach(p => p.remove());
    const D = window.D;
    if (!D.roadmap?.connections)
        return;
    D.roadmap.connections.forEach((conn) => {
        const fromEvent = D.roadmap.events.find((e) => e.id === conn.from);
        const toEvent = D.roadmap.events.find((e) => e.id === conn.to);
        if (!fromEvent || !toEvent)
            return;
        renderConnection(svg, fromEvent, toEvent, conn);
    });
}
function updateSVGViewBox() {
    const svg = $('roadmap-svg');
    // FIXED SIZE: 2560x1440 für Container und Viewport
    const FIXED_WIDTH = 2560;
    const FIXED_HEIGHT = 1440;
    if (!svg)
        return;
    // CRITICAL: ViewBox origin MUSS (0,0) bleiben für overlay-sync
    // CRITICAL: width/height MÜSSEN in PIXELN sein, NICHT Prozent (sonst responsive mismatch)
    svg.setAttribute('viewBox', `0 0 ${FIXED_WIDTH} ${FIXED_HEIGHT}`);
    svg.setAttribute('width', `${FIXED_WIDTH}px`); // WICHTIG: px-Einheit!
    svg.setAttribute('height', `${FIXED_HEIGHT}px`); // WICHTIG: px-Einheit!
    // CRITICAL: roadmap-events Container muss IDENTISCHE Größe haben wie SVG!
    const eventsContainer = $('roadmap-events');
    if (eventsContainer) {
        eventsContainer.style.width = `${FIXED_WIDTH}px`;
        eventsContainer.style.height = `${FIXED_HEIGHT}px`;
    }
    const log = window.log;
    if (log)
        log('[ROADMAP] Viewport gesetzt auf fixe Größe:', FIXED_WIDTH, 'x', FIXED_HEIGHT);
}
function renderConnection(svg, fromEvent, toEvent, conn) {
    const deleteRoadmapConnection = window.deleteRoadmapConnection;
    // Pin-Positionen berechnen
    const fromPin = conn.fromPin || 'bottom';
    const toPin = conn.toPin || 'top';
    // Tile-Elemente finden um tatsächliche Größe zu bekommen
    const fromTile = document.querySelector(`.roadmap-event[data-id="${fromEvent.id}"]`);
    const toTile = document.querySelector(`.roadmap-event[data-id="${toEvent.id}"]`);
    // CRITICAL: Verwende offsetWidth/offsetHeight - diese geben tatsächliche Größe OHNE Transform
    // (getBoundingClientRect würde transformierte Screen-Pixel geben)
    const fromWidth = fromTile ? fromTile.offsetWidth : 320;
    const fromHeight = fromTile ? fromTile.offsetHeight : 140;
    const toWidth = toTile ? toTile.offsetWidth : 320;
    const toHeight = toTile ? toTile.offsetHeight : 140;
    // Pin-Koordinaten in SVG-Space berechnen
    const fromCoords = getPinCoordinates(fromEvent, fromPin, fromWidth, fromHeight);
    const toCoords = getPinCoordinates(toEvent, toPin, toWidth, toHeight);
    const fromX = fromCoords.x;
    const fromY = fromCoords.y;
    const toX = toCoords.x;
    const toY = toCoords.y;
    // Bezier-Kurve berechnen
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Vertikaler Flow: weniger horizontale Krümmung
    const curvature = dy > 0 ? Math.min(dist * 0.2, 60) : Math.min(dist * 0.4, 100);
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    // Quadratische Bezier-Kurve
    const pathD = `M ${fromX} ${fromY} Q ${midX} ${midY - curvature * 0.3} ${toX} ${toY}`;
    const style = conn.style || '5'; // Default: Stil 5 (dotted)
    const color = conn.color || 'blue'; // Default: blau
    // Für Stil 7 (Double Line): Outer path zuerst
    if (style === '7') {
        const outerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        outerPath.setAttribute('d', pathD);
        outerPath.setAttribute('class', 'roadmap-connection-path style-7-outer');
        outerPath.setAttribute('data-color', color);
        outerPath.dataset.id = conn.id + '-outer';
        svg.appendChild(outerPath);
    }
    // Main Path erstellen
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('class', `roadmap-connection-path style-${style}`);
    path.setAttribute('data-color', color);
    path.dataset.id = conn.id;
    // Click-Handler für Löschen
    path.addEventListener('click', (e) => {
        if (e.ctrlKey) {
            e.stopPropagation();
            if (confirm('Verbindung löschen?')) {
                deleteRoadmapConnection(conn.id);
            }
        }
    });
    svg.appendChild(path);
}
// Hilfsfunktion: Pin-Koordinaten in SVG-Space berechnen
function getPinCoordinates(event, pinPosition, tileWidth, tileHeight) {
    const baseX = event.x;
    const baseY = event.y;
    switch (pinPosition) {
        case 'top':
            return { x: baseX + tileWidth / 2, y: baseY };
        case 'right':
            return { x: baseX + tileWidth, y: baseY + tileHeight / 2 };
        case 'bottom':
            return { x: baseX + tileWidth / 2, y: baseY + tileHeight };
        case 'left':
            return { x: baseX, y: baseY + tileHeight / 2 };
        default:
            return { x: baseX + tileWidth / 2, y: baseY + tileHeight / 2 };
    }
}
// ============================================================
// SVG MARKER SETUP (Pfeile)
// ============================================================
function setupRoadmapSVGMarkers() {
    const svg = $('roadmap-svg');
    if (!svg)
        return;
    // Defs-Bereich prüfen/erstellen
    let defs = svg.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
    }
    // Marker für jeden Connection-Type erstellen
    const markerTypes = [
        { type: 'main', color: '#60a5fa' },
        { type: 'branch', color: '#a78bfa' },
        { type: 'conditional', color: '#fbbf24' },
        { type: 'fallback', color: '#6b7280' }
    ];
    markerTypes.forEach(({ type, color }) => {
        // Prüfen ob Marker bereits existiert
        if (defs.querySelector(`#roadmap-arrow-${type}`))
            return;
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', `roadmap-arrow-${type}`);
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        marker.setAttribute('markerUnits', 'strokeWidth');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M0,0 L0,6 L9,3 z');
        path.setAttribute('fill', color);
        marker.appendChild(path);
        defs.appendChild(marker);
    });
}
// ============================================================
// EVENT TILES RENDERING
// ============================================================
function renderRoadmapEvents() {
    const eventsContainer = $('roadmap-events');
    if (!eventsContainer)
        return;
    // CRITICAL: Cleanup event listeners BEFORE clearing innerHTML to prevent memory leak
    cleanupEventTiles();
    eventsContainer.innerHTML = '';
    const D = window.D;
    if (!D.roadmap?.events)
        return;
    D.roadmap.events.forEach((event) => {
        const eventDiv = createEventTile(event);
        eventsContainer.appendChild(eventDiv);
    });
}
function cleanupEventTiles() {
    const eventsContainer = $('roadmap-events');
    if (!eventsContainer)
        return;
    // Find all event tiles and cleanup their document-level listeners
    const tiles = eventsContainer.querySelectorAll('.roadmap-event');
    tiles.forEach(tile => {
        const element = tile;
        if (element._cleanupHandlers) {
            element._cleanupHandlers.forEach((cleanup) => cleanup());
            element._cleanupHandlers = null;
        }
    });
}
function createEventTile(event) {
    const getEventTypeIcon = window.getEventTypeIcon;
    const startEventDrag = window.startEventDrag;
    const handlePinClickForConnection = window.handlePinClickForConnection;
    const startConnectionMode = window.startConnectionMode;
    const roadmapConnectionMode = window.roadmapConnectionMode;
    const div = document.createElement('div');
    div.className = `roadmap-event ${event.type}`;
    div.style.left = `${event.x}px`;
    div.style.top = `${event.y}px`;
    div.dataset.id = event.id;
    // Initialize cleanup handlers array for memory leak prevention
    div._cleanupHandlers = [];
    // Event-Icon ermitteln
    const icon = getEventTypeIcon(event.type);
    // Linked Entities rendern
    const linkedHTML = renderLinkedEntities(event);
    // Connection Pins
    const pinsHTML = `
        <div class="roadmap-pin pin-top main" data-pin="top" data-event-id="${event.id}"></div>
        <div class="roadmap-pin pin-right main" data-pin="right" data-event-id="${event.id}"></div>
        <div class="roadmap-pin pin-bottom main" data-pin="bottom" data-event-id="${event.id}"></div>
        <div class="roadmap-pin pin-left main" data-pin="left" data-event-id="${event.id}"></div>
    `;
    div.innerHTML = `
        ${pinsHTML}
        <div class="roadmap-event-header">
            <span class="roadmap-event-icon">${icon}</span>
            <span class="roadmap-event-sequence">#${event.sequence || '?'}</span>
            <span class="roadmap-event-title">${esc(event.title)}</span>
        </div>
        <div class="roadmap-event-body">
            ${event.description ? `<div class="roadmap-event-description">${event.description}</div>` : ''}
            ${linkedHTML}
        </div>
        <div class="roadmap-event-menu">
            ${event.notes ? `
                <div class="roadmap-info-wrapper">
                    <button class="roadmap-info-btn" data-event-id="${event.id}">ⓘ</button>
                    <div class="roadmap-info-popup" data-event-id="${event.id}">
                        <div class="roadmap-info-content">${esc(event.notes)}</div>
                    </div>
                </div>
            ` : ''}
            <button class="roadmap-menu-btn" data-event-id="${event.id}" title="Aktionen">⋮</button>
            <div class="roadmap-menu-popup" data-event-id="${event.id}">
                <button class="roadmap-menu-item" data-action="editRoadmapEvent" data-id="${event.id}">
                    <span class="menu-icon">✏️</span>
                    <span>Bearbeiten</span>
                </button>
                <button class="roadmap-menu-item" data-action="linkRoadmapEntities" data-id="${event.id}">
                    <span class="menu-icon">🔗</span>
                    <span>Verknüpfungen</span>
                </button>
                <button class="roadmap-menu-item danger" data-action="deleteRoadmapEvent" data-id="${event.id}">
                    <span class="menu-icon">🗑️</span>
                    <span>Löschen</span>
                </button>
            </div>
        </div>
        ${event.completed ? '<div class="roadmap-event-status completed">✓</div>' : ''}
    `;
    // Info-Button Handler
    const infoBtn = div.querySelector('.roadmap-info-btn');
    const infoPopup = div.querySelector('.roadmap-info-popup');
    if (infoBtn && infoPopup) {
        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Alle anderen Info-Popups schließen
            document.querySelectorAll('.roadmap-info-popup.show').forEach(popup => {
                if (popup !== infoPopup) {
                    popup.classList.remove('show');
                }
            });
            // Alle Menüs schließen
            document.querySelectorAll('.roadmap-menu-popup.show').forEach(popup => {
                popup.classList.remove('show');
            });
            // Dieses Info-Popup toggeln
            infoPopup.classList.toggle('show');
        });
        // Klick außerhalb schließt Info-Popup
        const infoClickHandler = (e) => {
            if (!div.contains(e.target)) {
                infoPopup.classList.remove('show');
            }
        };
        document.addEventListener('click', infoClickHandler);
        // Store cleanup function to prevent memory leak
        div._cleanupHandlers.push(() => {
            document.removeEventListener('click', infoClickHandler);
        });
    }
    // Menu-Button Handler
    const menuBtn = div.querySelector('.roadmap-menu-btn');
    const menuPopup = div.querySelector('.roadmap-menu-popup');
    if (menuBtn && menuPopup) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Alle anderen Menüs schließen
            document.querySelectorAll('.roadmap-menu-popup.show').forEach(popup => {
                if (popup !== menuPopup) {
                    popup.classList.remove('show');
                }
            });
            // Alle Info-Popups schließen
            document.querySelectorAll('.roadmap-info-popup.show').forEach(popup => {
                popup.classList.remove('show');
            });
            // Dieses Menü toggeln
            menuPopup.classList.toggle('show');
        });
        // Klick außerhalb schließt Menü
        const menuClickHandler = (e) => {
            if (!div.contains(e.target)) {
                menuPopup.classList.remove('show');
            }
        };
        document.addEventListener('click', menuClickHandler);
        // Store cleanup function to prevent memory leak
        div._cleanupHandlers.push(() => {
            document.removeEventListener('click', menuClickHandler);
        });
        // Menu-Item Click schließt Menü
        menuPopup.querySelectorAll('.roadmap-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                menuPopup.classList.remove('show');
            });
        });
    }
    // Drag-Handler
    div.addEventListener('mousedown', (e) => {
        const target = e.target;
        if (target === div || target.closest('.roadmap-event-header')) {
            startEventDrag(event.id, e);
        }
    });
    // Pin Click-Handler für Connection-Mode
    const pins = div.querySelectorAll('.roadmap-pin');
    pins.forEach(pin => {
        // Single Click: Nur wenn Connection-Mode aktiv
        pin.addEventListener('click', (e) => {
            if (roadmapConnectionMode) {
                e.stopPropagation();
                const pinElement = pin;
                const pinPosition = pinElement.dataset.pin;
                handlePinClickForConnection(event.id, pinPosition);
            }
        });
        // Double Click: Startet Connection-Mode automatisch
        pin.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const pinElement = pin;
            const pinPosition = pinElement.dataset.pin;
            // Connection-Mode starten falls nicht aktiv
            if (!roadmapConnectionMode) {
                startConnectionMode();
            }
            // Pin auswählen
            handlePinClickForConnection(event.id, pinPosition);
        });
    });
    return div;
}
function renderLinkedEntities(event) {
    const D = window.D;
    const links = [];
    // NPCs
    if (event.linkedNPCs?.length > 0) {
        event.linkedNPCs.forEach((npcId) => {
            const npc = D.npcs?.find((n) => n.id === npcId);
            if (npc) {
                links.push(`<span class="roadmap-link-badge npc" data-action="viewNPC" data-id="${npcId}">🧙 ${esc(npc.name)}</span>`);
            }
        });
    }
    // Quests
    if (event.linkedQuests?.length > 0) {
        event.linkedQuests.forEach((questId) => {
            const quest = D.quests?.find((q) => q.id === questId);
            if (quest) {
                links.push(`<span class="roadmap-link-badge quest" data-action="viewQuest" data-id="${questId}">📜 ${esc(quest.title)}</span>`);
            }
        });
    }
    // Locations
    if (event.linkedLocations?.length > 0) {
        event.linkedLocations.forEach((locId) => {
            const loc = D.locations?.find((l) => l.id === locId);
            if (loc) {
                links.push(`<span class="roadmap-link-badge location" data-action="viewLocation" data-id="${locId}">🏰 ${esc(loc.name)}</span>`);
            }
        });
    }
    // Encounters
    if (event.linkedEncounters?.length > 0) {
        event.linkedEncounters.forEach((encId) => {
            const enc = D.encounters?.find((e) => e.id === encId);
            if (enc) {
                links.push(`<span class="roadmap-link-badge encounter" data-action="viewEncounter" data-id="${encId}">⚔️ ${esc(enc.name)}</span>`);
            }
        });
    }
    if (links.length === 0)
        return '';
    return `<div class="roadmap-event-links">${links.join('')}</div>`;
}
// ============================================================
// TOOLBAR RENDERING
// ============================================================
function renderRoadmapToolbar() {
    const D = window.D;
    const toolbar = $('roadmap-toolbar');
    if (!toolbar)
        return;
    const eventCount = D.roadmap?.events?.length || 0;
    toolbar.innerHTML = `
        <div class="roadmap-toolbar-left">
            <span class="roadmap-title">🗺️ Kampagnen-Roadmap</span>
            <span class="roadmap-event-count">${eventCount} ${eventCount === 1 ? 'Event' : 'Events'}</span>
        </div>
        <div class="roadmap-toolbar-right">
            <button data-action="createRoadmapEvent" data-type="location" title="Ort hinzufügen">+ 📍 Ort</button>
            <button data-action="createRoadmapEvent" data-type="encounter" title="Encounter hinzufügen">+ ⚔️ Encounter</button>
            <button data-action="createRoadmapEvent" data-type="quest" title="Quest hinzufügen">+ 📜 Quest</button>
            <button data-action="startConnectionMode" title="Verbindung erstellen">🔗 Verbinden</button>
            <button data-action="autoLayoutRoadmap" title="Automatisches Layout">📐 Auto-Layout</button>
        </div>
    `;
}
// ============================================================
// CONTROLS RENDERING
// ============================================================
function renderRoadmapControls() {
    const controls = $('roadmap-controls');
    if (!controls)
        return;
    controls.innerHTML = `
        <button data-action="roadmapZoomOut" title="Herauszoomen">−</button>
        <span id="roadmap-zoom-display">100%</span>
        <button data-action="roadmapResetView" title="Ansicht zurücksetzen">Reset</button>
        <button data-action="roadmapZoomIn" title="Hineinzoomen">+</button>
    `;
}
// ============================================================
// INITIALIZATION
// ============================================================
function initRoadmapRendering() {
    setupRoadmapSVGMarkers();
    renderRoadmapToolbar();
    renderRoadmapControls();
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.renderRoadmapConnections = renderRoadmapConnections;
window.renderRoadmapEvents = renderRoadmapEvents;
window.renderRoadmapToolbar = renderRoadmapToolbar;
window.renderRoadmapControls = renderRoadmapControls;
window.setupRoadmapSVGMarkers = setupRoadmapSVGMarkers;
window.initRoadmapRendering = initRoadmapRendering;
//# sourceMappingURL=roadmap-render.js.map