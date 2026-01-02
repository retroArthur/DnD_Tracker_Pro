// [SECTION:MAPS]
// Extrahiert aus dice.js
// Karten-Integration
// Zeilen: 575

// MAP INTEGRATION (Multi-Map Support)
// ============================================================

// Konstanten
const MAP_CONSTANTS = {
    ZOOM: { min: 0.1, max: 5, factorIn: 1.1, factorOut: 0.9 },
    GRID: { defaultSize: 50, minSize: 20, maxSize: 200, dndMeterConversion: 1.524 },
    FOG: { defaultBrushSize: 50, hideThreshold: 5 },
    TOOLTIP_OFFSET: 15,
    CONVERSIONS: { feetPerMeter: 3.28084, milesPerFeet: 5280, kmPerMeter: 1000, metersPerMile: 1609.34 },
    TRAVEL_SPEED_MH: 5000
};

const MARKER_ICONS = {
    party: '👥', poi: '📍', danger: '⚠️', quest: '📜', item: '💎',
    secret: '❓', secretdoor: '🚪', npc: '🧑', action: '⚡', encounter: '⚔️',
    entrance: '🚩', exit: '🏁', shop: '🛒', blacksmith: '⚒️', house: '🏠',
    tavern: '🍺', inn: '🛏️', dicetest: '🎲', ruins: '🏚️', magic: '✨',
    tower: '🗼', lair: '🐉', note: '📝'
};

// Utility-Funktionen
function getMapCoordinates(event, rect) {
    return {
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100
    };
}

let mapZoom = 1;
let currentMapId = null;
let markerPlacementMode = false;
let pendingMarker = null;
let draggedMarker = null;
let mapIsPanning = false;
let mapPanStart = { x: 0, y: 0 };
let mapPanOffset = { x: 0, y: 0 };

function getMaps() {
    if (!D.maps) D.maps = [];
    return D.maps;
}

function getCurrentMap() {
    return getMaps().find(m => m.id === currentMapId);
}

function addNewMap() {
    const name = prompt('Name der neuen Karte:', 'Neue Karte');
    if (!name) return;
    
    const maps = getMaps();
    const newMap = {
        id: Date.now(),
        name: name,
        image: null,
        markers: [],
        zoom: 1,
        panX: 0,
        panY: 0
    };
    maps.push(newMap);
    currentMapId = newMap.id;
    save();
    renderMapTabs();
    displayMap();
    showToast('Karte erstellt');
}

function renameCurrentMap() {
    const map = getCurrentMap();
    if (!map) return;
    
    const name = prompt('Neuer Name:', map.name);
    if (!name) return;
    
    map.name = name;
    save();
    renderMapTabs();
}

function deleteCurrentMap() {
    const map = getCurrentMap();
    if (!map) return;

    if (!confirm(`Karte "${map.name}" wirklich löschen?`)) return;

    pushUndo('Karte gelöscht');
    D.maps = getMaps().filter(m => m.id !== currentMapId);
    currentMapId = D.maps.length > 0 ? D.maps[0].id : null;
    save();
    renderMapTabs();
    displayMap();
}

function switchMap(mapId) {
    // Save current state
    const oldMap = getCurrentMap();
    if (oldMap) {
        oldMap.zoom = mapZoom;
        oldMap.panX = mapPanOffset.x;
        oldMap.panY = mapPanOffset.y;
    }
    
    currentMapId = mapId;
    const newMap = getCurrentMap();
    if (newMap) {
        mapZoom = newMap.zoom || 1;
        mapPanOffset.x = newMap.panX || 0;
        mapPanOffset.y = newMap.panY || 0;
    } else {
        mapZoom = 1;
        mapPanOffset = { x: 0, y: 0 };
    }
    
    renderMapTabs();
    displayMap();
}

function renderMapTabs() {
    const container = $('map-tabs');
    if (!container) return;
    
    const maps = getMaps();
    const toolbar = $('map-toolbar');
    
    if (maps.length === 0) {
        container.innerHTML = '<span style="color: var(--text-dim);">Keine Karten vorhanden</span>';
        if (toolbar) toolbar.style.display = 'none';
        return;
    }
    
    if (toolbar) toolbar.style.display = 'flex';
    
    container.innerHTML = maps.map(m => `
        <button class="map-tab ${m.id === currentMapId ? 'active' : ''}" data-action="switch-map" data-id="${m.id}">
            ${esc(m.name)}
        </button>
    `).join('');
}

function uploadMapToCurrentTab(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const map = getCurrentMap();
    if (!map) {
        addNewMap();
        // Retry after map is created
        setTimeout(() => uploadMapToCurrentTab(event), 100);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        map.image = e.target.result;
        mapZoom = 1;
        mapPanOffset = { x: 0, y: 0 };
        displayMap();
        save();
        showToast('Bild hochgeladen');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function displayMap() {
    const uploadZone = $('map-upload-zone');
    const viewport = $('map-viewport');
    
    const map = getCurrentMap();
    
    if (!map || !map.image) {
        if (uploadZone) {
            uploadZone.style.display = 'flex';
            if (!map) {
                uploadZone.innerHTML = '<div style="font-size: 3em; margin-bottom: 10px;">🗺️</div><div>Klicke auf "+ Neue Karte" um eine Karte hinzuzufügen</div>';
            } else {
                uploadZone.innerHTML = '<div style="font-size: 3em; margin-bottom: 10px;">🗺️</div><div>Klicke auf "📁 Bild hochladen" um ein Bild hinzuzufügen</div>';
                uploadZone.onclick = () => $('map-upload').click();
            }
        }
        if (viewport) viewport.style.display = 'none';
        return;
    }
    
    if (uploadZone) uploadZone.style.display = 'none';
    if (viewport) viewport.style.display = 'flex';
    
    const img = $('map-image');
    if (!img) return;
    
    img.src = map.image;
    
    img.onload = function() {
        updateMapTransform();
        renderMapMarkers();
    };
    
    if (img.complete) {
        updateMapTransform();
        renderMapMarkers();
    }
}

function zoomMap(factor) {
    mapZoom *= factor;
    mapZoom = Math.max(MAP_CONSTANTS.ZOOM.min, Math.min(MAP_CONSTANTS.ZOOM.max, mapZoom));
    updateMapTransform();
    
    const map = getCurrentMap();
    if (map) {
        map.zoom = mapZoom;
        save();
    }
}

function resetMapZoom() {
    mapZoom = 1;
    mapPanOffset = { x: 0, y: 0 };
    updateMapTransform();
    
    const map = getCurrentMap();
    if (map) {
        map.zoom = 1;
        map.panX = 0;
        map.panY = 0;
        save();
    }
}

function updateMapTransform() {
    const canvas = $('map-canvas');
    if (canvas) {
        canvas.style.transform = `translate(${mapPanOffset.x}px, ${mapPanOffset.y}px) scale(${mapZoom})`;
    }
    const display = $('map-zoom-display');
    if (display) {
        display.textContent = Math.round(mapZoom * 100) + '%';
    }
    // Update CSS variable for tooltip scaling
    document.documentElement.style.setProperty('--map-zoom', mapZoom);
}

function initMapPanning() {
    const viewport = $('map-viewport');
    if (!viewport) return;
    
    viewport.addEventListener('mousedown', function(e) {
        if (e.target.closest('.map-marker')) return;
        if (markerPlacementMode) {
            handleMapClick(e);
            return;
        }
        
        mapIsPanning = true;
        mapPanStart = { x: e.clientX - mapPanOffset.x, y: e.clientY - mapPanOffset.y };
        viewport.classList.add('panning');
    });
    
    viewport.addEventListener('mousemove', function(e) {
        if (!mapIsPanning) return;
        
        mapPanOffset.x = e.clientX - mapPanStart.x;
        mapPanOffset.y = e.clientY - mapPanStart.y;
        updateMapTransform();
    });
    
    viewport.addEventListener('mouseup', function(e) {
        if (mapIsPanning) {
            mapIsPanning = false;
            viewport.classList.remove('panning');
            
            const map = getCurrentMap();
            if (map) {
                map.panX = mapPanOffset.x;
                map.panY = mapPanOffset.y;
                save();
            }
        }
    });
    
    viewport.addEventListener('mouseleave', function(e) {
        if (mapIsPanning) {
            mapIsPanning = false;
            viewport.classList.remove('panning');
        }
    });
    
    // Mouse wheel zoom
    viewport.addEventListener('wheel', function(e) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? MAP_CONSTANTS.ZOOM.factorIn : MAP_CONSTANTS.ZOOM.factorOut;
        zoomMap(factor);
    }, { passive: false });
    
    // Double-click to place quick pin
    viewport.addEventListener('dblclick', function(e) {
        if (e.target.closest('.map-marker')) return; // Marker-Doppelklick separat behandelt
        
        const map = getCurrentMap();
        if (!map || !map.image) return;
        
        const img = $('map-image');
        if (!img) return;

        const rect = img.getBoundingClientRect();
        const coords = getMapCoordinates(e, rect);

        // Quick-Pin erstellen (Default: POI)
        createQuickPinAt(coords.x, coords.y);
    });
}

function startMarkerPlacement() {
    const name = $('marker-name').value.trim();
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    
    const map = getCurrentMap();
    if (!map || !map.image) {
        alert('Bitte zuerst eine Karte mit Bild auswählen');
        return;
    }
    
    pendingMarker = {
        name,
        type: $('marker-type').value,
        shape: $('marker-shape').value,
        note: $('marker-note').value.trim()
    };
    
    markerPlacementMode = true;
    hideModal('map-marker-modal');
    showToast('Klicke auf die Karte um den Marker zu platzieren');
}

function saveMarker() {
    const editId = $('edit-marker-id').value;
    
    if (editId) {
        // Edit existing marker
        const map = getCurrentMap();
        if (!map || !map.markers) return;
        
        const marker = map.markers.find(m => m.id === parseInt(editId));
        if (!marker) return;
        
        const name = $('marker-name').value.trim();
        if (!name) {
            showToast('⚠️ Name erforderlich', 'error');
            return;
        }
        
        marker.name = name;
        marker.type = $('marker-type').value;
        marker.shape = $('marker-shape').value;
        marker.note = $('marker-note').value.trim();
        
        hideModal('map-marker-modal');
        renderMapMarkers();
        save();
        showToast('Marker aktualisiert');
    } else {
        // New marker - start placement
        startMarkerPlacement();
    }
}

function editMarker(id) {
    const map = getCurrentMap();
    if (!map || !map.markers) return;
    
    const marker = map.markers.find(m => m.id === id);
    if (!marker) return;
    
    // Fill form
    $('edit-marker-id').value = id;
    $('marker-name').value = marker.name || '';
    $('marker-type').value = marker.type || 'poi';
    $('marker-shape').value = marker.shape || 'circle';
    $('marker-note').value = marker.note || '';
    
    // Update UI for edit mode
    const modalTitle = $('marker-modal-title');
    const placementHint = $('marker-placement-hint');
    const saveBtn = $('marker-save-btn');
    const deleteBtn = $('marker-delete-btn');
    
    if (modalTitle) modalTitle.textContent = 'Marker bearbeiten';
    if (placementHint) placementHint.style.display = 'none';
    if (saveBtn) saveBtn.textContent = '💾 Speichern';
    if (deleteBtn) deleteBtn.style.display = 'inline-block';
    
    showModal('map-marker-modal');
}

function clearMarkerForm() {
    $('edit-marker-id').value = '';
    $('marker-name').value = '';
    $('marker-type').value = 'poi';
    $('marker-shape').value = 'circle';
    $('marker-note').value = '';
    
    // Update UI for add mode
    const modalTitle = $('marker-modal-title');
    const placementHint = $('marker-placement-hint');
    const saveBtn = $('marker-save-btn');
    const deleteBtn = $('marker-delete-btn');
    
    if (modalTitle) modalTitle.textContent = 'Marker hinzufügen';
    if (placementHint) placementHint.style.display = 'block';
    if (saveBtn) saveBtn.textContent = 'Auf Karte platzieren';
    if (deleteBtn) deleteBtn.style.display = 'none';
}

function deleteMarkerFromModal() {
    const editId = $('edit-marker-id').value;
    if (!editId) return;
    
    const map = getCurrentMap();
    if (!map || !map.markers) return;
    
    const marker = map.markers.find(m => m.id === parseInt(editId));
    if (!marker) return;
    
    if (confirm(`Marker "${marker.name}" löschen?`)) {
        deleteMarker(parseInt(editId));
        hideModal('map-marker-modal');
    }
}

function handleMapClick(event) {
    if (!markerPlacementMode || !pendingMarker) return;
    
    const map = getCurrentMap();
    if (!map) return;
    
    const img = $('map-image');
    const rect = img.getBoundingClientRect();
    
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    if (!map.markers) map.markers = [];
    
    map.markers.push({
        id: Date.now(),
        name: pendingMarker.name,
        type: pendingMarker.type,
        shape: pendingMarker.shape || 'circle',
        note: pendingMarker.note,
        x, y
    });
    
    markerPlacementMode = false;
    pendingMarker = null;
    
    clearMarkerForm();
    
    renderMapMarkers();
    save();
    showToast('Marker platziert');
}

function renderMapMarkers() {
    const layer = $('map-markers-layer');
    if (!layer) return;
    
    layer.innerHTML = '';
    
    const map = getCurrentMap();
    if (!map || !map.markers) return;

    map.markers.forEach(m => {
        // Layer-Sichtbarkeit prüfen
        const markerLayer = typeof getMarkerLayer === 'function' ? getMarkerLayer(m.type) : 'poi';
        if (typeof mapLayerVisibility !== 'undefined' && !mapLayerVisibility[markerLayer]) {
            return; // Nicht anzeigen
        }
        
        const marker = document.createElement('div');
        const shape = m.shape || 'circle';
        marker.className = `map-marker ${m.type} shape-${shape}`;
        marker.style.left = `${m.x}%`;
        marker.style.top = `${m.y}%`;
        marker.dataset.id = m.id;
        marker.dataset.markerId = m.id;
        
        // Timestamp formatieren
        const timestamp = m.createdAt ? new Date(m.createdAt).toLocaleDateString('de-DE', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '';
        
        // Entity-Links (falls verknüpft)
        let linksHtml = '';
        if (m.linkedLocation || m.linkedNpc || m.linkedQuest || m.linkedEncounter) {
            linksHtml = '<div class="tooltip-links">';
            if (m.linkedLocation) linksHtml += `<span class="tooltip-link" data-action="navigate-entity" data-type="location" data-id="${m.linkedLocation}">📍 Ort</span>`;
            if (m.linkedNpc) linksHtml += `<span class="tooltip-link" data-action="navigate-entity" data-type="npc" data-id="${m.linkedNpc}">🧑 NPC</span>`;
            if (m.linkedQuest) linksHtml += `<span class="tooltip-link" data-action="navigate-entity" data-type="quest" data-id="${m.linkedQuest}">📜 Quest</span>`;
            if (m.linkedEncounter) linksHtml += `<span class="tooltip-link" data-action="navigate-entity" data-type="encounter" data-id="${m.linkedEncounter}">⚔️ Encounter</span>`;
            linksHtml += '</div>';
        }
        
        marker.innerHTML = `
            <span style="font-size: 14px; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.5));">${MARKER_ICONS[m.type] || '📍'}</span>
            <span class="map-marker-tooltip">
                <div class="tooltip-title">${esc(m.name)}</div>
                ${m.note ? `<div class="tooltip-note">${esc(m.note)}</div>` : ''}
                ${linksHtml}
                ${timestamp ? `<div class="tooltip-timestamp">📅 Erstellt: ${timestamp}</div>` : ''}
            </span>
        `;
        
        // Single click - für Verbindungs-Tool oder Drag
        marker.addEventListener('mousedown', function(e) {
            if (e.button === 0) {
                // Connection-Tool?
                if (typeof currentMapTool !== 'undefined' && currentMapTool === 'connect') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleConnectionClick(m.id);
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                startMarkerDrag(m.id, e);
            }
        });
        
        // Double click to edit
        marker.addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            editMarker(m.id);
        });
        
        // Right click to delete
        marker.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (confirm(`Marker "${m.name}" löschen?`)) {
                deleteMarker(m.id);
            }
        });
        
        layer.appendChild(marker);
    });
}

function startMarkerDrag(markerId, event) {
    const map = getCurrentMap();
    if (!map) return;

    const markerData = map.markers.find(m => m.id === markerId);
    if (!markerData) return;

    // Cleanup: Bestehende Listener entfernen (verhindert Memory Leak)
    document.removeEventListener('mousemove', handleMarkerDrag);
    document.removeEventListener('mouseup', endMarkerDrag);

    draggedMarker = {
        id: markerId,
        element: event.target.closest('.map-marker')
    };

    if (draggedMarker.element) {
        draggedMarker.element.classList.add('dragging');
    }

    document.addEventListener('mousemove', handleMarkerDrag);
    document.addEventListener('mouseup', endMarkerDrag);
}

function handleMarkerDrag(event) {
    if (!draggedMarker) return;
    
    const img = $('map-image');
    const rect = img.getBoundingClientRect();
    
    let x = ((event.clientX - rect.left) / rect.width) * 100;
    let y = ((event.clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    
    if (draggedMarker.element) {
        draggedMarker.element.style.left = `${x}%`;
        draggedMarker.element.style.top = `${y}%`;
    }
    
    draggedMarker.newX = x;
    draggedMarker.newY = y;
}

function endMarkerDrag(event) {
    if (!draggedMarker) return;
    
    if (draggedMarker.newX !== undefined) {
        const map = getCurrentMap();
        if (map) {
            const markerData = map.markers.find(m => m.id === draggedMarker.id);
            if (markerData) {
                markerData.x = draggedMarker.newX;
                markerData.y = draggedMarker.newY;
                save();
            }
        }
    }
    
    if (draggedMarker.element) {
        draggedMarker.element.classList.remove('dragging');
    }
    
    draggedMarker = null;
    
    document.removeEventListener('mousemove', handleMarkerDrag);
    document.removeEventListener('mouseup', endMarkerDrag);
}

function deleteMarker(id) {
    const map = getCurrentMap();
    if (!map) return;

    pushUndo('Marker gelöscht');
    map.markers = map.markers.filter(m => m.id !== id);
    renderMapMarkers();
    renderMapMarkersList();
    save();
}

function clearAllMarkers() {
    const map = getCurrentMap();
    if (!map) return;
    
    if (confirm('Alle Marker dieser Karte löschen?')) {
        map.markers = [];
        renderMapMarkers();
        renderMapMarkersList();
        save();
    }
}

// ============================================================
// ERWEITERTE MAP-FEATURES (Variante B + C)
// ============================================================

// Aktives Werkzeug
let currentMapTool = 'pan';
let mapLayerVisibility = {
    party: true,
    poi: true,
    danger: true,
    quest: true,
    buildings: true,
    secret: false
};
let showMapGrid = false;
let showMapFog = true;
let showMapConnections = true;

// Mess-Werkzeug State
let measureStart = null;
let measureEnd = null;
let isMeasuring = false;

// Kalibrierungs-State
let calibrationPoint1 = null;
let calibrationPoint2 = null;
let isCalibrating = false;

// Fog of War State
let fogCanvas = null;
let fogCtx = null;
let fogBrushSize = 50;

// Verbindungs-State
let connectionStart = null;

// Context Menu Position
let contextMenuPos = { x: 0, y: 0 };

// Layer-Kategorien zu Marker-Typen
const LAYER_TO_TYPES = {
    party: ['party'],
    poi: ['poi', 'entrance', 'exit', 'magic'],
    danger: ['danger', 'encounter', 'lair'],
    quest: ['quest', 'action', 'dicetest'],
    buildings: ['shop', 'blacksmith', 'house', 'tavern', 'inn', 'tower', 'ruins'],
    secret: ['secret', 'secretdoor', 'item']
};

// Werkzeug setzen
function setMapTool(tool) {
    currentMapTool = tool;
    
    // UI aktualisieren
    document.querySelectorAll('.map-tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === tool);
    });
    
    // Cursor und Info aktualisieren
    const viewport = $('map-viewport');
    const toolInfo = $('map-tool-info');
    const infoText = $('map-tool-info-text');
    
    if (viewport) {
        viewport.className = 'map-viewport';
        if (tool !== 'pan') {
            viewport.classList.add('tool-' + tool);
        }
    }
    
    // Tool-Info anzeigen
    const toolInfoTexts = {
        pan: 'Klicke und ziehe zum Verschieben',
        measure: 'Klicke auf zwei Punkte um die Entfernung zu messen',
        calibrate: 'Klicke auf zwei Punkte und gib die bekannte Entfernung ein',
        'fog-reveal': 'Klicke oder ziehe um Bereiche aufzudecken',
        'fog-hide': 'Klicke oder ziehe um Bereiche zu verdecken',
        connect: 'Klicke auf zwei Marker um sie zu verbinden'
    };
    
    if (toolInfo && infoText) {
        toolInfo.style.display = tool !== 'pan' ? 'flex' : 'none';
        infoText.textContent = toolInfoTexts[tool] || '';
    }
    
    // Reset States
    if (tool !== 'measure') {
        measureStart = null;
        measureEnd = null;
        isMeasuring = false;
        clearMeasureLine();
    }
    if (tool !== 'calibrate') {
        calibrationPoint1 = null;
        calibrationPoint2 = null;
        isCalibrating = false;
        clearMeasureLine();
    }
    if (tool !== 'connect') {
        connectionStart = null;
    }
}

// Keyboard Shortcuts für Werkzeuge
function initMapKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        // Nur wenn Map-View aktiv und kein Input fokussiert
        if (!$('view-maps')?.classList.contains('active')) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const shortcuts = {
            'v': 'pan',
            'm': 'measure',
            'k': 'calibrate',
            'f': 'fog-reveal',
            'h': 'fog-hide',
            'c': 'connect'
        };
        
        if (shortcuts[e.key.toLowerCase()]) {
            e.preventDefault();
            setMapTool(shortcuts[e.key.toLowerCase()]);
        }
        
        // P für Marker hinzufügen
        if (e.key.toLowerCase() === 'p') {
            e.preventDefault();
            if (typeof clearMarkerForm === 'function') clearMarkerForm();
            if (typeof showModal === 'function') showModal('map-marker-modal');
        }
    });
}

// Context Menu (Quick-Pin)
function initMapContextMenu() {
    const viewport = $('map-viewport');
    const contextMenu = $('map-context-menu');
    
    if (!viewport || !contextMenu) return;
    
    viewport.addEventListener('contextmenu', e => {
        e.preventDefault();
        
        // Position berechnen (im Kartenkoordinatensystem)
        const img = $('map-image');
        if (!img) return;

        const rect = img.getBoundingClientRect();
        const coords = getMapCoordinates(e, rect);
        contextMenuPos.x = coords.x;
        contextMenuPos.y = coords.y;

        // Menü positionieren und anzeigen
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
        contextMenu.style.display = 'block';
        
        // Click outside schließt Menü
        setTimeout(() => {
            document.addEventListener('click', closeMapContextMenu, { once: true });
        }, 10);
    });
}

function closeMapContextMenu() {
    const contextMenu = $('map-context-menu');
    if (contextMenu) {
        contextMenu.style.display = 'none';
    }
}

function handleQuickPin(type) {
    closeMapContextMenu();
    
    const map = getCurrentMap();
    if (!map) return;
    
    if (!map.markers) map.markers = [];
    
    const QUICK_PIN_NAMES = {
        party: 'Party-Position',
        poi: 'Sehenswürdigkeit',
        danger: 'Gefahr',
        quest: 'Quest-Ort',
        npc: 'NPC',
        note: 'Notiz'
    };
    
    if (type === 'custom') {
        // Öffne Marker-Modal mit vorausgefüllter Position
        pendingMarker = { x: contextMenuPos.x, y: contextMenuPos.y };
        showModal('map-marker-modal');
        return;
    }
    
    // Quick-Pin direkt erstellen
    const name = prompt('Name:', QUICK_PIN_NAMES[type] || 'Marker');
    if (!name) return;
    
    const marker = {
        id: Date.now(),
        name: name,
        type: type,
        shape: 'circle',
        note: '',
        x: contextMenuPos.x,
        y: contextMenuPos.y,
        createdAt: new Date().toISOString()
    };
    
    // Bei Party-Typ: vorherige Party-Marker entfernen (nur einer gleichzeitig)
    if (type === 'party') {
        map.markers = map.markers.filter(m => m.type !== 'party');
    }
    
    map.markers.push(marker);
    renderMapMarkers();
    renderMapMarkersList();
    save();
    showToast('📍 ' + name + ' hinzugefügt');
}

// Quick-Pin per Doppelklick
function createQuickPinAt(x, y) {
    const map = getCurrentMap();
    if (!map) return;
    
    if (!map.markers) map.markers = [];
    
    const name = prompt('Marker-Name:', 'Marker');
    if (!name) return;
    
    const marker = {
        id: Date.now(),
        name: name,
        type: 'poi',
        shape: 'circle',
        note: '',
        x: x,
        y: y,
        createdAt: new Date().toISOString()
    };
    
    map.markers.push(marker);
    renderMapMarkers();
    renderMapMarkersList();
    save();
    showToast('📍 ' + name + ' hinzugefügt');
}

// Ebenen-System
function toggleMapLayer(layer, visible) {
    mapLayerVisibility[layer] = visible;
    renderMapMarkers();
}

function getMarkerLayer(type) {
    for (const [layer, types] of Object.entries(LAYER_TO_TYPES)) {
        if (types.includes(type)) return layer;
    }
    return 'poi'; // Default
}

// Grid Toggle
function toggleMapGrid() {
    showMapGrid = !showMapGrid;
    
    const btn = document.querySelector('[data-action="toggle-map-grid"]');
    if (btn) btn.classList.toggle('active', showMapGrid);
    
    updateMapGrid();
}

function updateMapGrid() {
    let gridOverlay = $('map-grid-overlay');
    
    if (!gridOverlay) {
        // Grid-Element erstellen falls nicht vorhanden
        gridOverlay = document.createElement('div');
        gridOverlay.id = 'map-grid-overlay';
        gridOverlay.className = 'map-grid-overlay';
        const canvas = $('map-canvas');
        if (canvas) canvas.appendChild(gridOverlay);
    }
    
    if (!showMapGrid) {
        gridOverlay.style.display = 'none';
        return;
    }
    
    gridOverlay.style.display = 'block';
    
    // Grid-Größe: Bei kalibrierter Karte basierend auf Kalibrierung, sonst 50px
    const map = getCurrentMap();
    let gridSize = 50; // Default 50px
    
    if (map && map.calibration && map.calibration.pixelsPerMeter) {
        // 5 Meter Grid bei kalibrierten Karten (oder 5 Fuß)
        // Standard D&D: 1 Square = 5 feet = 1.524m
        gridSize = 1.524 * map.calibration.pixelsPerMeter;
        
        // Mindestens 20px, maximal 200px
        gridSize = Math.max(20, Math.min(200, gridSize));
    }
    
    gridOverlay.style.backgroundSize = `${gridSize}px ${gridSize}px`;
}

// Fog Toggle
function toggleMapFog() {
    showMapFog = !showMapFog;
    
    const btn = document.querySelector('[data-action="toggle-map-fog"]');
    if (btn) btn.classList.toggle('active', showMapFog);
    
    const fogLayer = $('map-fog-layer');
    if (fogLayer) {
        fogLayer.style.display = showMapFog ? 'block' : 'none';
    }
}

// Connections Toggle
function toggleMapConnections() {
    showMapConnections = !showMapConnections;
    
    const btn = document.querySelector('[data-action="toggle-map-connections"]');
    if (btn) btn.classList.toggle('active', showMapConnections);
    
    const connectionsLayer = $('map-connections-layer');
    if (connectionsLayer) {
        connectionsLayer.style.display = showMapConnections ? 'block' : 'none';
    }
}
// ============================================================
// ENTFERNUNGSMESSUNG
// ============================================================

function initMapMeasure() {
    const viewport = $('map-viewport');
    if (!viewport) return;
    
    viewport.addEventListener('click', handleMapToolClick);
}

function handleMapToolClick(e) {
    if (currentMapTool === 'pan') return;
    if (e.target.closest('.map-marker')) return;
    
    const img = $('map-image');
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const coords = getMapCoordinates(e, rect);

    if (currentMapTool === 'measure') {
        handleMeasureClick(coords.x, coords.y, rect);
    } else if (currentMapTool === 'calibrate') {
        handleCalibrationClick(coords.x, coords.y, rect);
    } else if (currentMapTool === 'fog-reveal' || currentMapTool === 'fog-hide') {
        handleFogClick(coords.x, coords.y, currentMapTool === 'fog-reveal');
    }
}

function handleMeasureClick(x, y, imgRect) {
    if (!measureStart) {
        measureStart = { x, y };
        isMeasuring = true;
        drawMeasureLine();
    } else {
        measureEnd = { x, y };
        isMeasuring = false;
        drawMeasureLine();
        showMeasureResult(imgRect);
        
        // Nach kurzer Pause zurücksetzen
        setTimeout(() => {
            measureStart = null;
            measureEnd = null;
            clearMeasureLine();
        }, 5000);
    }
}

function drawMeasureLine() {
    const svg = $('map-measure-layer');
    if (!svg) return;
    
    if (!measureStart) {
        svg.innerHTML = '';
        return;
    }
    
    const img = $('map-image');
    if (!img) return;
    
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    
    const x1 = (measureStart.x / 100) * imgWidth;
    const y1 = (measureStart.y / 100) * imgHeight;
    
    let html = `<circle class="map-measure-point" cx="${x1}" cy="${y1}" r="6"/>`;
    
    if (measureEnd) {
        const x2 = (measureEnd.x / 100) * imgWidth;
        const y2 = (measureEnd.y / 100) * imgHeight;
        
        html += `
            <line class="map-measure-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>
            <circle class="map-measure-point" cx="${x2}" cy="${y2}" r="6"/>
        `;
    }
    
    svg.innerHTML = html;
    svg.setAttribute('viewBox', `0 0 ${imgWidth} ${imgHeight}`);
}

function clearMeasureLine() {
    const svg = $('map-measure-layer');
    if (svg) svg.innerHTML = '';
    
    const resultEl = $('map-measure-result');
    if (resultEl) {
        resultEl.style.display = 'none';
        resultEl.textContent = '';
    }
    
    // Cursor-Tooltip verstecken
    const tooltip = $('map-cursor-tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
        tooltip.textContent = '';
    }
}

// Speichert letztes Messergebnis für Cursor-Tooltip
let lastMeasureText = '';

function showMeasureResult(imgRect) {
    if (!measureStart || !measureEnd) return;
    
    const map = getCurrentMap();
    if (!map) return;
    
    // Pixel-Distanz berechnen (bei aktuellem Zoom)
    const dx = (measureEnd.x - measureStart.x) / 100 * imgRect.width;
    const dy = (measureEnd.y - measureStart.y) / 100 * imgRect.height;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);
    
    // Pixel-Distanz bei 100% Zoom (für Kalibrierung)
    const pixelDistAtZoom1 = pixelDist / mapZoom;
    
    let resultText = '';
    
    // Prüfen ob Karte kalibriert ist
    if (!map.calibration || !map.calibration.pixelsPerMeter) {
        resultText = `📏 ${Math.round(pixelDistAtZoom1)} px — nicht kalibriert`;
    } else {
        // Kalibrierte Messung
        const meters = pixelDistAtZoom1 / map.calibration.pixelsPerMeter;
        const feet = meters * 3.28084;
        
        // Formatierung Meter
        let meterText;
        if (meters < 1000) {
            meterText = Math.round(meters) + ' m';
        } else {
            meterText = (meters / 1000).toFixed(1) + ' km';
        }
        
        // Formatierung Feet
        let feetText;
        if (feet < 5280) {
            feetText = Math.round(feet) + ' ft';
        } else {
            feetText = (feet / 5280).toFixed(1) + ' mi';
        }
        
        // Reisezeit (5 km/h zu Fuß)
        const hours = meters / 5000;
        let timeText = '';
        if (hours < 0.1) {
            timeText = ''; // Zu kurz für Reisezeit
        } else if (hours < 1) {
            timeText = ` = ${Math.round(hours * 60)} Min`;
        } else if (hours < 24) {
            timeText = ` = ${hours.toFixed(1)} Std`;
        } else {
            timeText = ` = ${(hours / 8).toFixed(1)} Tage`;
        }
        
        resultText = `📏 ${meterText} / ${feetText}${timeText}`;
    }
    
    // In der Info-Leiste anzeigen (Fallback)
    const resultEl = $('map-measure-result');
    if (resultEl) {
        resultEl.style.display = 'inline';
        resultEl.textContent = resultText;
    }
    
    // Speichern für Cursor-Tooltip
    lastMeasureText = resultText;
    
    // Cursor-Tooltip initial anzeigen
    const tooltip = $('map-cursor-tooltip');
    if (tooltip) {
        tooltip.textContent = resultText;
        tooltip.classList.add('visible');
    }
}

// Cursor-Tooltip bei Mausbewegung positionieren
function initCursorTooltip() {
    const viewport = $('map-viewport');
    if (!viewport) return;
    
    viewport.addEventListener('mousemove', function(e) {
        const tooltip = $('map-cursor-tooltip');
        if (!tooltip || !tooltip.classList.contains('visible')) return;
        
        // Tooltip 15px rechts und 15px unterhalb des Cursors
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
    });
    
    viewport.addEventListener('mouseleave', function() {
        const tooltip = $('map-cursor-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    });
}

// Kalibrierung
function handleCalibrationClick(x, y, imgRect) {
    if (!calibrationPoint1) {
        calibrationPoint1 = { x, y };
        isCalibrating = true;
        drawCalibrationLine();
        showToast('📍 Erster Punkt gesetzt. Klicke auf den zweiten Punkt.');
    } else {
        calibrationPoint2 = { x, y };
        isCalibrating = false;
        drawCalibrationLine();
        
        // Pixel-Distanz berechnen
        const dx = (calibrationPoint2.x - calibrationPoint1.x) / 100 * imgRect.width;
        const dy = (calibrationPoint2.y - calibrationPoint1.y) / 100 * imgRect.height;
        const pixelDist = Math.sqrt(dx * dx + dy * dy) / mapZoom;
        
        // User nach Entfernung fragen
        promptCalibrationDistance(pixelDist);
    }
}

function drawCalibrationLine() {
    const svg = $('map-measure-layer');
    if (!svg) return;
    
    if (!calibrationPoint1) {
        svg.innerHTML = '';
        return;
    }
    
    const img = $('map-image');
    if (!img) return;
    
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    
    const x1 = (calibrationPoint1.x / 100) * imgWidth;
    const y1 = (calibrationPoint1.y / 100) * imgHeight;
    
    let html = `<circle class="map-measure-point" cx="${x1}" cy="${y1}" r="6" style="fill: var(--gold);"/>`;
    
    if (calibrationPoint2) {
        const x2 = (calibrationPoint2.x / 100) * imgWidth;
        const y2 = (calibrationPoint2.y / 100) * imgHeight;
        
        html += `
            <line class="map-measure-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke: var(--gold);"/>
            <circle class="map-measure-point" cx="${x2}" cy="${y2}" r="6" style="fill: var(--gold);"/>
        `;
    }
    
    svg.innerHTML = html;
    svg.setAttribute('viewBox', `0 0 ${imgWidth} ${imgHeight}`);
}

function promptCalibrationDistance(pixelDist) {
    const map = getCurrentMap();
    if (!map) return;
    
    // Prompt für Entfernung
    const input = prompt(
        'Gib die bekannte Entfernung zwischen den zwei Punkten ein:\n' +
        '(Beispiele: "100", "50 ft", "30 m", "1 square = 5ft")\n\n' +
        'Standardeinheit ist Meter.',
        ''
    );
    
    if (!input) {
        // Abgebrochen
        calibrationPoint1 = null;
        calibrationPoint2 = null;
        clearMeasureLine();
        return;
    }
    
    // Parse Eingabe
    const parsed = parseDistanceInput(input);
    if (!parsed) {
        showToast('⚠️ Ungültige Eingabe', 'error');
        calibrationPoint1 = null;
        calibrationPoint2 = null;
        clearMeasureLine();
        return;
    }
    
    // Berechne Pixel pro Meter
    const pixelsPerMeter = pixelDist / parsed.meters;
    
    // Speichern
    if (!map.calibration) map.calibration = {};
    map.calibration.pixelsPerMeter = pixelsPerMeter;
    map.calibration.reference = {
        pixels: pixelDist,
        meters: parsed.meters,
        originalInput: input
    };
    
    save();
    
    // Reset
    calibrationPoint1 = null;
    calibrationPoint2 = null;
    clearMeasureLine();
    
    showToast(`✅ Kalibriert: ${parsed.meters.toFixed(1)} m = ${Math.round(pixelDist)} px`);
    
    // Zurück zum Mess-Tool
    setMapTool('measure');
}

function parseDistanceInput(input) {
    if (!input) return null;
    
    const str = input.toLowerCase().trim();
    
    // Versuche verschiedene Formate
    // "100" -> 100 Meter
    // "50 ft" oder "50ft" -> Feet
    // "30 m" oder "30m" -> Meter
    // "1 square = 5ft" -> 5 Feet
    
    // Square-Format: "1 square = 5ft"
    const squareMatch = str.match(/(\d+)\s*(?:square|sq|grid).*?=\s*(\d+(?:\.\d+)?)\s*(ft|feet|m|meter)?/i);
    if (squareMatch) {
        const value = parseFloat(squareMatch[2]);
        const unit = squareMatch[3] || 'ft';
        if (unit.startsWith('f')) {
            return { meters: value * 0.3048 };
        }
        return { meters: value };
    }
    
    // Standard-Format: "50 ft", "30m", "100"
    const match = str.match(/^(\d+(?:\.\d+)?)\s*(ft|feet|foot|m|meter|meters|km|mi|miles)?$/);
    if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2] || 'm';
        
        if (unit.startsWith('f')) {
            return { meters: value * 0.3048 };
        } else if (unit === 'km') {
            return { meters: value * 1000 };
        } else if (unit.startsWith('mi')) {
            return { meters: value * 1609.34 };
        }
        return { meters: value };
    }
    
    return null;
}

// ============================================================
// FOG OF WAR
// ============================================================

function initMapFog() {
    const canvas = $('map-fog-layer');
    const img = $('map-image');
    
    if (!canvas || !img) return;
    
    fogCanvas = canvas;
    fogCtx = canvas.getContext('2d');
    
    // Canvas-Größe an Bild anpassen
    img.onload = () => {
        resizeFogCanvas();
        loadFogFromMap();
    };
    
    if (img.complete) {
        resizeFogCanvas();
        loadFogFromMap();
    }
}

function resizeFogCanvas() {
    const img = $('map-image');
    if (!img || !fogCanvas) return;
    
    fogCanvas.width = img.naturalWidth || img.width;
    fogCanvas.height = img.naturalHeight || img.height;
    
    loadFogFromMap();
}

function loadFogFromMap() {
    const map = getCurrentMap();
    if (!map || !fogCtx || !fogCanvas) return;
    
    // Fog komplett verdecken
    fogCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    fogCtx.fillRect(0, 0, fogCanvas.width, fogCanvas.height);
    
    // Aufgedeckte Bereiche laden
    if (map.fogRevealed && Array.isArray(map.fogRevealed)) {
        fogCtx.globalCompositeOperation = 'destination-out';
        
        map.fogRevealed.forEach(area => {
            fogCtx.beginPath();
            fogCtx.arc(
                (area.x / 100) * fogCanvas.width,
                (area.y / 100) * fogCanvas.height,
                area.radius,
                0, Math.PI * 2
            );
            fogCtx.fill();
        });
        
        fogCtx.globalCompositeOperation = 'source-over';
    }
}

function handleFogClick(x, y, reveal) {
    const map = getCurrentMap();
    if (!map || !fogCtx || !fogCanvas) return;
    
    if (!map.fogRevealed) map.fogRevealed = [];
    
    const canvasX = (x / 100) * fogCanvas.width;
    const canvasY = (y / 100) * fogCanvas.height;
    const radius = fogBrushSize / mapZoom;
    
    if (reveal) {
        // Aufdecken
        fogCtx.globalCompositeOperation = 'destination-out';
        fogCtx.beginPath();
        fogCtx.arc(canvasX, canvasY, radius, 0, Math.PI * 2);
        fogCtx.fill();
        fogCtx.globalCompositeOperation = 'source-over';
        
        // Speichern
        map.fogRevealed.push({ x, y, radius });
    } else {
        // Verdecken
        fogCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        fogCtx.beginPath();
        fogCtx.arc(canvasX, canvasY, radius, 0, Math.PI * 2);
        fogCtx.fill();
        
        // Aus gespeicherten Bereichen entfernen (grob)
        map.fogRevealed = map.fogRevealed.filter(area => {
            const dist = Math.sqrt(Math.pow(area.x - x, 2) + Math.pow(area.y - y, 2));
            return dist > 5; // Threshold
        });
    }
    
    save();
}

// ============================================================
// VERBINDUNGEN ZWISCHEN MARKERN
// ============================================================

function initMapConnections() {
    renderMapConnections();
}

function handleConnectionClick(markerId) {
    if (currentMapTool !== 'connect') return;
    
    if (!connectionStart) {
        connectionStart = markerId;
        showToast('Klicke auf einen zweiten Marker');
    } else {
        if (connectionStart !== markerId) {
            createConnection(connectionStart, markerId);
        }
        connectionStart = null;
    }
}

function createConnection(fromId, toId) {
    const map = getCurrentMap();
    if (!map) return;
    
    if (!map.connections) map.connections = [];
    
    // Prüfen ob Verbindung schon existiert
    const exists = map.connections.some(c => 
        (c.from === fromId && c.to === toId) || 
        (c.from === toId && c.to === fromId)
    );
    
    if (exists) {
        showToast('Verbindung existiert bereits', 'error');
        return;
    }
    
    const type = prompt('Verbindungstyp:\n- road (Straße)\n- path (Pfad)\n- river (Fluss)\n- quest (Quest-Pfad)', 'road');
    if (!type) return;
    
    const label = prompt('Beschriftung (optional):', '');
    
    map.connections.push({
        id: Date.now(),
        from: fromId,
        to: toId,
        type: type,
        label: label || ''
    });
    
    renderMapConnections();
    save();
    showToast('Verbindung erstellt');
}

function renderMapConnections() {
    const svg = $('map-connections-layer');
    const map = getCurrentMap();
    
    if (!svg || !map) return;
    
    const img = $('map-image');
    if (!img) return;
    
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    
    if (!map.connections || map.connections.length === 0 || !map.markers) {
        svg.innerHTML = '';
        return;
    }
    
    let html = '';
    
    map.connections.forEach(conn => {
        const fromMarker = map.markers.find(m => m.id === conn.from);
        const toMarker = map.markers.find(m => m.id === conn.to);
        
        if (!fromMarker || !toMarker) return;
        
        const x1 = (fromMarker.x / 100) * imgWidth;
        const y1 = (fromMarker.y / 100) * imgHeight;
        const x2 = (toMarker.x / 100) * imgWidth;
        const y2 = (toMarker.y / 100) * imgHeight;
        
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        html += `<line class="map-connection-line ${conn.type || 'road'}" 
            x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
            data-connection-id="${conn.id}"/>`;
        
        if (conn.label) {
            html += `<text class="map-connection-label" x="${midX}" y="${midY - 5}">${esc(conn.label)}</text>`;
        }
    });
    
    svg.innerHTML = html;
    svg.setAttribute('viewBox', `0 0 ${imgWidth} ${imgHeight}`);
}

// ============================================================
// MARKER-LISTE UND SUCHE
// ============================================================

function renderMapMarkersList() {
    const container = $('map-markers-list');
    const countEl = $('map-marker-count');
    const map = getCurrentMap();
    
    if (!container) return;
    
    if (!map || !map.markers || map.markers.length === 0) {
        container.innerHTML = '<div style="color: var(--text-dim); font-size: 0.85em; padding: 8px;">Keine Marker auf dieser Karte</div>';
        if (countEl) countEl.textContent = '0';
        return;
    }
    
    if (countEl) countEl.textContent = map.markers.length;

    const MARKER_COLORS = {
        party: 'var(--green)', poi: 'var(--cyan)', danger: 'var(--red)',
        quest: 'var(--purple)', item: 'var(--gold)', secret: 'var(--orange)',
        npc: 'var(--pink)', shop: 'var(--green)', tavern: 'var(--yellow)'
    };
    
    container.innerHTML = map.markers.map(m => {
        const icon = MARKER_ICONS[m.type] || '📍';
        const color = MARKER_COLORS[m.type] || 'var(--gold)';
        const timestamp = m.createdAt ? new Date(m.createdAt).toLocaleDateString('de-DE') : '';
        
        return `
            <div class="map-marker-list-item" data-action="focus-marker" data-id="${m.id}">
                <div class="map-marker-list-icon" style="background: ${color};">${icon}</div>
                <div class="map-marker-list-info">
                    <div class="map-marker-list-name">${esc(m.name)}</div>
                    ${timestamp ? `<div class="map-marker-list-meta">📅 ${timestamp}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterMapMarkers(query) {
    const resultsContainer = $('map-search-results');
    const map = getCurrentMap();
    
    if (!resultsContainer || !map || !map.markers) return;
    
    if (!query.trim()) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    const q = query.toLowerCase();
    const matches = map.markers.filter(m => 
        m.name.toLowerCase().includes(q) ||
        (m.note && m.note.toLowerCase().includes(q))
    );
    
    if (matches.length === 0) {
        resultsContainer.innerHTML = '<div style="color: var(--text-dim); padding: 8px; font-size: 0.85em;">Keine Treffer</div>';
        return;
    }

    resultsContainer.innerHTML = matches.map(m => `
        <div class="map-search-result" data-action="focus-marker" data-id="${m.id}">
            <span>${MARKER_ICONS[m.type] || '📍'}</span>
            <span>${esc(m.name)}</span>
        </div>
    `).join('');
}

function focusMarker(id) {
    const map = getCurrentMap();
    if (!map || !map.markers) return;
    
    const marker = map.markers.find(m => m.id === id);
    if (!marker) return;
    
    // Zum Marker zoomen/pannen
    const img = $('map-image');
    const viewport = $('map-viewport');
    if (!img || !viewport) return;
    
    const viewportRect = viewport.getBoundingClientRect();
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    
    // Marker-Position in Pixel
    const markerX = (marker.x / 100) * imgWidth * mapZoom;
    const markerY = (marker.y / 100) * imgHeight * mapZoom;
    
    // Zentrieren
    mapPanOffset.x = (viewportRect.width / 2) - markerX;
    mapPanOffset.y = (viewportRect.height / 2) - markerY;
    
    updateMapTransform();
    
    // Marker highlighten
    const markerEl = document.querySelector(`.map-marker[data-marker-id="${id}"]`);
    if (markerEl) {
        markerEl.style.animation = 'none';
        setTimeout(() => {
            markerEl.style.animation = 'pulse 0.5s ease 3';
        }, 10);
    }
    
    // Speichern
    if (map) {
        map.panX = mapPanOffset.x;
        map.panY = mapPanOffset.y;
        save();
    }
}

// ============================================================
// INITIALISIERUNG
// ============================================================

function initExtendedMapFeatures() {
    try {
        initMapKeyboardShortcuts();
    } catch(e) { console.warn('initMapKeyboardShortcuts error:', e); }
    
    try {
        initMapContextMenu();
    } catch(e) { console.warn('initMapContextMenu error:', e); }
    
    try {
        initMapMeasure();
    } catch(e) { console.warn('initMapMeasure error:', e); }
    
    try {
        initMapFog();
    } catch(e) { console.warn('initMapFog error:', e); }
    
    try {
        initMapConnections();
    } catch(e) { console.warn('initMapConnections error:', e); }
    
    try {
        initCursorTooltip();
    } catch(e) { console.warn('initCursorTooltip error:', e); }
    
    // Initial Toolbar anzeigen
    const toolbar = $('map-toolbar');
    if (toolbar && getMaps().length > 0) {
        toolbar.style.display = 'flex';
    }
}

// Überschreibe renderMapTabs um auch Sidebar zu aktualisieren
const originalRenderMapTabs = renderMapTabs;
renderMapTabs = function() {
    try {
        originalRenderMapTabs();
    } catch(e) {
        console.warn('renderMapTabs error:', e);
    }
    
    const maps = getMaps();
    const toolbar = $('map-toolbar');
    
    if (toolbar) {
        toolbar.style.display = maps.length > 0 ? 'flex' : 'none';
    }
    
    if (typeof renderMapMarkersList === 'function') {
        try {
            renderMapMarkersList();
        } catch(e) {
            console.warn('renderMapMarkersList error:', e);
        }
    }
};

// Überschreibe displayMap um auch Fog und Connections zu laden
const originalDisplayMap = displayMap;
displayMap = function() {
    try {
        originalDisplayMap();
    } catch(e) {
        console.warn('displayMap error:', e);
    }
    
    // Nach Anzeige: Fog und Connections rendern
    setTimeout(() => {
        try {
            if (typeof resizeFogCanvas === 'function') resizeFogCanvas();
            if (typeof renderMapConnections === 'function') renderMapConnections();
            if (typeof renderMapMarkersList === 'function') renderMapMarkersList();
            if (typeof updateMapGrid === 'function') updateMapGrid();
            updateCalibrationStatus();
        } catch(e) {
            console.warn('Map post-display error:', e);
        }
    }, 100);
};

function updateCalibrationStatus() {
    const statusEl = $('map-calibration-status');
    if (!statusEl) return;
    
    const map = getCurrentMap();
    if (!map) {
        statusEl.textContent = '';
        return;
    }
    
    if (map.calibration && map.calibration.pixelsPerMeter) {
        const ref = map.calibration.reference;
        if (ref && ref.originalInput) {
            statusEl.textContent = `✓ Kalibriert (${ref.originalInput})`;
            statusEl.style.color = 'var(--green)';
        } else {
            statusEl.textContent = '✓ Kalibriert';
            statusEl.style.color = 'var(--green)';
        }
    } else {
        statusEl.textContent = '⚠ Nicht kalibriert';
        statusEl.style.color = 'var(--gold)';
    }
}
