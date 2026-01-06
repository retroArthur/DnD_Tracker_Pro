// [SECTION:ROADMAP_CRUD]
// Roadmap CRUD Operations - Events & Connections
// Zeilen: ~150

// ============================================================
// EVENT CRUD
// ============================================================

function createRoadmapEvent(type = 'location') {
    pushUndo('Roadmap Event erstellt');

    const newEvent = {
        id: nextId('roadmapEvents'),
        title: 'Neues Event',
        type: type,
        description: '',
        sequence: D.roadmap.events.length + 1,
        x: 400, // Zentriert
        y: D.roadmap.events.length * 180,
        color: getEventTypeColor(type),
        linkedNPCs: [],
        linkedQuests: [],
        linkedLocations: [],
        linkedEncounters: [],
        estimatedDuration: '',
        completed: false,
        notes: ''
    };

    D.roadmap.events.push(newEvent);
    save();
    renderRoadmap();

    // Event direkt zum Bearbeiten öffnen
    setTimeout(() => {
        showEditRoadmapEventModal(newEvent.id);
    }, 100);

    showToast('Event erstellt', 'success');
    return newEvent.id;
}

function updateRoadmapEvent(id, updates) {
    pushUndo('Roadmap Event aktualisiert');

    const event = D.roadmap.events.find(e => e.id === id);
    if (!event) {
        showToast('Event nicht gefunden', 'error');
        return;
    }

    Object.assign(event, updates);
    save();
    renderRoadmap();
    showToast('Event aktualisiert', 'success');
}

function deleteRoadmapEvent(id) {
    if (!confirm('Event wirklich löschen?')) return;

    pushUndo('Roadmap Event gelöscht');

    // Event entfernen
    D.roadmap.events = D.roadmap.events.filter(e => e.id !== id);

    // Alle Verbindungen zu diesem Event entfernen
    D.roadmap.connections = D.roadmap.connections.filter(c => c.from !== id && c.to !== id);

    save();
    renderRoadmap();
    showToast('Event gelöscht', 'success');
}

function toggleRoadmapEventCompletion(id) {
    pushUndo('Event Completion geändert');

    const event = D.roadmap.events.find(e => e.id === id);
    if (!event) return;

    event.completed = !event.completed;
    save();
    renderRoadmap();
    showToast(event.completed ? 'Event abgeschlossen' : 'Event wieder geöffnet', 'success');
}

// ============================================================
// CONNECTION CRUD
// ============================================================

function createRoadmapConnection(fromId, toId, type = 'main', fromPin = 'bottom', toPin = 'top', style = '5', color = 'blue') {
    // Prüfen ob Verbindung bereits existiert
    const exists = D.roadmap.connections.some(c => c.from === fromId && c.to === toId);
    if (exists) {
        showToast('Verbindung existiert bereits', 'warning');
        return;
    }

    pushUndo('Roadmap Verbindung erstellt');

    const newConnection = {
        id: nextId('roadmapConnections'),
        from: fromId,
        to: toId,
        type: type,          // Legacy
        label: '',
        fromPin: fromPin,    // Pin-Position am Start-Event
        toPin: toPin,        // Pin-Position am Ziel-Event
        style: style,        // '5' (dotted) or '7' (double)
        color: color         // 'blue', 'purple', 'yellow', etc.
    };

    D.roadmap.connections.push(newConnection);
    save();
    renderRoadmap();
    showToast('Verbindung erstellt', 'success');
    return newConnection.id;
}

function updateRoadmapConnection(id, updates) {
    pushUndo('Roadmap Verbindung aktualisiert');

    const connection = D.roadmap.connections.find(c => c.id === id);
    if (!connection) {
        showToast('Verbindung nicht gefunden', 'error');
        return;
    }

    Object.assign(connection, updates);
    save();
    renderRoadmap();
    showToast('Verbindung aktualisiert', 'success');
}

function deleteRoadmapConnection(id) {
    pushUndo('Roadmap Verbindung gelöscht');

    D.roadmap.connections = D.roadmap.connections.filter(c => c.id !== id);
    save();
    renderRoadmap();
    showToast('Verbindung gelöscht', 'success');
}

// ============================================================
// BULK OPERATIONS
// ============================================================

function clearRoadmap() {
    if (!confirm('Gesamte Roadmap löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) return;

    pushUndo('Roadmap geleert');

    D.roadmap.events = [];
    D.roadmap.connections = [];
    save();
    renderRoadmap();
    showToast('Roadmap geleert', 'success');
}

// ============================================================
// AUTO-LAYOUT ALGORITHM
// ============================================================

function autoLayoutRoadmap() {
    if (D.roadmap.events.length === 0) {
        showToast('Keine Events zum Anordnen', 'warning');
        return;
    }

    pushUndo('Auto-Layout angewendet');

    // 1. Start-Event finden (ohne eingehende Verbindungen)
    const startEvents = D.roadmap.events.filter(e =>
        !D.roadmap.connections.some(c => c.to === e.id)
    );

    if (startEvents.length === 0) {
        showToast('Kein Start-Event gefunden (Event ohne eingehende Verbindungen)', 'warning');
        return;
    }

    // 2. Adjacency Graph erstellen (für outgoing connections)
    const graph = {};
    const incomingCount = {};
    D.roadmap.events.forEach(e => {
        graph[e.id] = [];
        incomingCount[e.id] = 0;
    });
    D.roadmap.connections.forEach(c => {
        graph[c.from].push(c.to);
        incomingCount[c.to] = (incomingCount[c.to] || 0) + 1;
    });

    // 3. Layer-based Layout (wie Sugiyama)
    const layers = [];
    const visited = new Set();
    const eventToLayer = {};

    // BFS für Layer-Zuweisung
    const queue = startEvents.map(e => ({ id: e.id, layer: 0 }));

    while (queue.length > 0) {
        const { id, layer } = queue.shift();

        if (visited.has(id)) continue;
        visited.add(id);

        // Layer erstellen falls nötig
        if (!layers[layer]) layers[layer] = [];
        layers[layer].push(id);
        eventToLayer[id] = layer;

        // Children in nächsten Layer
        const children = graph[id] || [];
        children.forEach(childId => {
            if (!visited.has(childId)) {
                queue.push({ id: childId, layer: layer + 1 });
            }
        });
    }

    // 4. Horizontales Layout mit vertikaler Zentrierung pro Layer
    const HORIZONTAL_SPACING = 500;  // Mehr Abstand zwischen Layern
    const VERTICAL_SPACING = 200;    // Vertikaler Abstand zwischen Events im selben Layer

    layers.forEach((layerEvents, layerIndex) => {
        const layerHeight = (layerEvents.length - 1) * VERTICAL_SPACING;
        const startY = -layerHeight / 2;  // Zentrieren um Y=0

        layerEvents.forEach((eventId, indexInLayer) => {
            const event = D.roadmap.events.find(e => e.id === eventId);
            if (!event) return;

            event.sequence = layerIndex + 1;
            event.x = layerIndex * HORIZONTAL_SPACING;
            event.y = startY + (indexInLayer * VERTICAL_SPACING);
        });
    });

    // 5. Koordinaten normalisieren - alle Events zu positiven Koordinaten verschieben
    // CRITICAL: Dies muss hier passieren, NICHT im Rendering (vermeidet kumulative Transformation)
    const PADDING = 500;
    let minX = Math.min(...D.roadmap.events.map(e => e.x || 0));
    let minY = Math.min(...D.roadmap.events.map(e => e.y || 0));

    // Nur verschieben wenn negative Koordinaten vorhanden
    if (minX < PADDING || minY < PADDING) {
        const offsetX = Math.max(0, PADDING - minX);
        const offsetY = Math.max(0, PADDING - minY);

        D.roadmap.events.forEach(event => {
            event.x = (event.x || 0) + offsetX;
            event.y = (event.y || 0) + offsetY;
        });
    }

    // 6. View zentrieren
    roadmapPan = { x: 100, y: window.innerHeight / 2 };
    roadmapZoom = 1;

    save();
    renderRoadmap();
    showToast('Auto-Layout angewendet', 'success');
}

// ============================================================
// IMPORT / EXPORT
// ============================================================

function exportRoadmap() {
    const data = {
        version: '1.0',
        timestamp: Date.now(),
        events: D.roadmap.events,
        connections: D.roadmap.connections
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `roadmap-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showToast('Roadmap exportiert', 'success');
}

function importRoadmap(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            if (!data.events || !data.connections) {
                throw new Error('Ungültiges Roadmap-Format');
            }

            pushUndo('Roadmap importiert');

            D.roadmap.events = data.events;
            D.roadmap.connections = data.connections;

            save();
            renderRoadmap();
            showToast('Roadmap importiert', 'success');
        } catch (error) {
            console.error('[ROADMAP] Import-Fehler:', error);
            showToast('Import fehlgeschlagen: ' + error.message, 'error');
        }
    };

    reader.readAsText(file);
}

// ============================================================
// EXPORT
// ============================================================

window.createRoadmapEvent = createRoadmapEvent;
window.updateRoadmapEvent = updateRoadmapEvent;
window.deleteRoadmapEvent = deleteRoadmapEvent;
window.toggleRoadmapEventCompletion = toggleRoadmapEventCompletion;
window.createRoadmapConnection = createRoadmapConnection;
window.updateRoadmapConnection = updateRoadmapConnection;
window.deleteRoadmapConnection = deleteRoadmapConnection;
window.clearRoadmap = clearRoadmap;
window.autoLayoutRoadmap = autoLayoutRoadmap;
window.exportRoadmap = exportRoadmap;
window.importRoadmap = importRoadmap;
