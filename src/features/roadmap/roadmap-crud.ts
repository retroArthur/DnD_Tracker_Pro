// [SECTION:ROADMAP_CRUD]
// Roadmap CRUD Operations - Events & Connections
// Zeilen: ~472

import { showToast } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { pushUndo } from '@systems/undo';

// ============================================================
// EVENT CRUD
// ============================================================

export function createRoadmapEvent(type: string = 'location'): number {
    const D = (window as any).D;
    const nextId = (window as any).nextId;
    const getEventTypeColor = (window as any).getEventTypeColor;
    const renderRoadmap = (window as any).renderRoadmap;
    const showEditRoadmapEventModal = (window as any).showEditRoadmapEventModal;

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

export function updateRoadmapEvent(id: number, updates: any): void {
    const D = (window as any).D;
    const renderRoadmap = (window as any).renderRoadmap;

    pushUndo('Roadmap Event aktualisiert');

    const event = D.roadmap.events.find((e: any) => e.id === id);
    if (!event) {
        showToast('Event nicht gefunden', 'error');
        return;
    }

    Object.assign(event, updates);
    save();
    renderRoadmap();
    showToast('Event aktualisiert', 'success');
}

export function deleteRoadmapEvent(id: number): void {
    if (!confirm('Event wirklich löschen?')) return;

    const D = (window as any).D;
    const renderRoadmap = (window as any).renderRoadmap;

    pushUndo('Roadmap Event gelöscht');

    // Event entfernen
    D.roadmap.events = D.roadmap.events.filter((e: any) => e.id !== id);

    // Alle Verbindungen zu diesem Event entfernen
    D.roadmap.connections = D.roadmap.connections.filter((c: any) => c.from !== id && c.to !== id);

    save();
    renderRoadmap();
    showToast('Event gelöscht', 'success');
}

export function toggleRoadmapEventCompletion(id: number): void {
    const D = (window as any).D;
    const renderRoadmap = (window as any).renderRoadmap;

    pushUndo('Event Completion geändert');

    const event = D.roadmap.events.find((e: any) => e.id === id);
    if (!event) return;

    event.completed = !event.completed;
    save();
    renderRoadmap();
    showToast(event.completed ? 'Event abgeschlossen' : 'Event wieder geöffnet', 'success');
}

// ============================================================
// CONNECTION CRUD
// ============================================================

export function createRoadmapConnection(
    fromId: number,
    toId: number,
    type: string = 'main',
    fromPin: string = 'bottom',
    toPin: string = 'top',
    style: string = '5',
    color: string = 'blue'
): number | undefined {
    const D = (window as any).D;
    const nextId = (window as any).nextId;
    const renderRoadmap = (window as any).renderRoadmap;

    // Prüfen ob Verbindung bereits existiert
    const exists = D.roadmap.connections.some((c: any) => c.from === fromId && c.to === toId);
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

export function updateRoadmapConnection(id: number, updates: any): void {
    const D = (window as any).D;
    const renderRoadmap = (window as any).renderRoadmap;

    pushUndo('Roadmap Verbindung aktualisiert');

    const connection = D.roadmap.connections.find((c: any) => c.id === id);
    if (!connection) {
        showToast('Verbindung nicht gefunden', 'error');
        return;
    }

    Object.assign(connection, updates);
    save();
    renderRoadmap();
    showToast('Verbindung aktualisiert', 'success');
}

export function deleteRoadmapConnection(id: number): void {
    const D = (window as any).D;
    const renderRoadmap = (window as any).renderRoadmap;

    pushUndo('Roadmap Verbindung gelöscht');

    D.roadmap.connections = D.roadmap.connections.filter((c: any) => c.id !== id);
    save();
    renderRoadmap();
    showToast('Verbindung gelöscht', 'success');
}

// ============================================================
// BULK OPERATIONS
// ============================================================

export function clearRoadmap(): void {
    if (!confirm('Gesamte Roadmap löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) return;

    const D = (window as any).D;
    const renderRoadmap = (window as any).renderRoadmap;

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

export function autoLayoutRoadmap(): void {
    const D = (window as any).D;
    const renderRoadmap = (window as any).renderRoadmap;
    const roadmapPan = (window as any).roadmapPan;
    const roadmapZoom = (window as any).roadmapZoom;

    if (D.roadmap.events.length === 0) {
        showToast('Keine Events zum Anordnen', 'warning');
        return;
    }

    pushUndo('Auto-Layout angewendet');

    // 1. Start-Event finden (ohne eingehende Verbindungen)
    const startEvents = D.roadmap.events.filter((e: any) =>
        !D.roadmap.connections.some((c: any) => c.to === e.id)
    );

    if (startEvents.length === 0) {
        showToast('Kein Start-Event gefunden (Event ohne eingehende Verbindungen)', 'warning');
        return;
    }

    // 2. Adjacency Graph erstellen (für outgoing connections)
    const graph: Record<number, number[]> = {};
    const incomingCount: Record<number, number> = {};
    D.roadmap.events.forEach((e: any) => {
        graph[e.id] = [];
        incomingCount[e.id] = 0;
    });
    D.roadmap.connections.forEach((c: any) => {
        graph[c.from].push(c.to);
        incomingCount[c.to] = (incomingCount[c.to] || 0) + 1;
    });

    // 3. Layer-based Layout (wie Sugiyama)
    const layers: number[][] = [];
    const visited = new Set<number>();
    const eventToLayer: Record<number, number> = {};

    // BFS für Layer-Zuweisung
    const queue: Array<{ id: number; layer: number }> = startEvents.map((e: any) => ({ id: e.id, layer: 0 }));

    while (queue.length > 0) {
        const { id, layer } = queue.shift()!;

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
            const event = D.roadmap.events.find((e: any) => e.id === eventId);
            if (!event) return;

            event.sequence = layerIndex + 1;
            event.x = layerIndex * HORIZONTAL_SPACING;
            event.y = startY + (indexInLayer * VERTICAL_SPACING);
        });
    });

    // 5. Koordinaten normalisieren - alle Events zu positiven Koordinaten verschieben
    // CRITICAL: Dies muss hier passieren, NICHT im Rendering (vermeidet kumulative Transformation)
    const PADDING = 500;
    const minX = Math.min(...D.roadmap.events.map((e: any) => e.x || 0));
    const minY = Math.min(...D.roadmap.events.map((e: any) => e.y || 0));

    // Nur verschieben wenn negative Koordinaten vorhanden
    if (minX < PADDING || minY < PADDING) {
        const offsetX = Math.max(0, PADDING - minX);
        const offsetY = Math.max(0, PADDING - minY);

        D.roadmap.events.forEach((event: any) => {
            event.x = (event.x || 0) + offsetX;
            event.y = (event.y || 0) + offsetY;
        });
    }

    // 6. View zentrieren
    (window as any).roadmapPan = { x: 100, y: window.innerHeight / 2 };
    (window as any).roadmapZoom = 1;

    save();
    renderRoadmap();
    showToast('Auto-Layout angewendet', 'success');
}

// ============================================================
// IMPORT / EXPORT
// ============================================================

export function exportRoadmap(): void {
    const D = (window as any).D;

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

function validateRoadmapImport(data: any): { events: any[]; connections: any[] } {
    // SECURITY: Validate import data to prevent XSS and DoS attacks

    // 1. Basic structure validation
    if (typeof data !== 'object' || data === null) {
        throw new Error('Ungültige Datenstruktur');
    }

    if (!Array.isArray(data.events) || !Array.isArray(data.connections)) {
        throw new Error('Events und Connections müssen Arrays sein');
    }

    // 2. Limit array sizes to prevent DoS
    const MAX_EVENTS = 500;
    const MAX_CONNECTIONS = 1000;

    if (data.events.length > MAX_EVENTS) {
        throw new Error(`Zu viele Events (max ${MAX_EVENTS})`);
    }

    if (data.connections.length > MAX_CONNECTIONS) {
        throw new Error(`Zu viele Connections (max ${MAX_CONNECTIONS})`);
    }

    // 3. Validate and sanitize each event
    const validatedEvents = data.events.map((event: any, index: number) => {
        if (typeof event !== 'object' || event === null) {
            throw new Error(`Event ${index} ist ungültig`);
        }

        // Required fields with type validation
        const id = parseInt(event.id, 10);
        if (isNaN(id) || id < 0) {
            throw new Error(`Event ${index} hat ungültige ID`);
        }

        const x = parseFloat(event.x);
        const y = parseFloat(event.y);
        if (isNaN(x) || isNaN(y)) {
            throw new Error(`Event ${index} hat ungültige Koordinaten`);
        }

        // Coordinate range validation (prevent off-canvas placement)
        if (x < 0 || x > 10000 || y < 0 || y > 10000) {
            throw new Error(`Event ${index} hat Koordinaten außerhalb des erlaubten Bereichs`);
        }

        const sequence = parseInt(event.sequence, 10);
        if (isNaN(sequence)) {
            throw new Error(`Event ${index} hat ungültige Sequence`);
        }

        // String fields - sanitize to prevent XSS
        const title = String(event.title || 'Unbenannt').slice(0, 200);
        const description = String(event.description || '').slice(0, 5000); // Allow more chars for HTML
        const notes = String(event.notes || '').slice(0, 2000);

        // Type validation with whitelist
        const validTypes = ['location', 'encounter', 'quest', 'npc', 'event', 'milestone'];
        const type = validTypes.includes(event.type) ? event.type : 'location';

        // Array fields - validate and sanitize IDs
        const validateIdArray = (arr: any, fieldName: string): number[] => {
            if (!Array.isArray(arr)) return [];
            return arr.map((id: any, i: number) => {
                const parsed = parseInt(id, 10);
                if (isNaN(parsed) || parsed < 0) {
                    throw new Error(`Event ${index} hat ungültige ${fieldName} ID bei Index ${i}`);
                }
                return parsed;
            }).slice(0, 100); // Max 100 links per event
        };

        return {
            id,
            title,
            type,
            description,
            sequence,
            x,
            y,
            color: event.color || '#60a5fa', // Default color
            linkedNPCs: validateIdArray(event.linkedNPCs, 'linkedNPCs'),
            linkedQuests: validateIdArray(event.linkedQuests, 'linkedQuests'),
            linkedLocations: validateIdArray(event.linkedLocations, 'linkedLocations'),
            linkedEncounters: validateIdArray(event.linkedEncounters, 'linkedEncounters'),
            completed: Boolean(event.completed),
            notes
        };
    });

    // 4. Validate and sanitize each connection
    const validatedConnections = data.connections.map((conn: any, index: number) => {
        if (typeof conn !== 'object' || conn === null) {
            throw new Error(`Connection ${index} ist ungültig`);
        }

        const id = parseInt(conn.id, 10);
        const from = parseInt(conn.from, 10);
        const to = parseInt(conn.to, 10);

        if (isNaN(id) || isNaN(from) || isNaN(to)) {
            throw new Error(`Connection ${index} hat ungültige IDs`);
        }

        if (id < 0 || from < 0 || to < 0) {
            throw new Error(`Connection ${index} hat negative IDs`);
        }

        // Validate pin positions
        const validPins = ['top', 'right', 'bottom', 'left'];
        const fromPin = validPins.includes(conn.fromPin) ? conn.fromPin : 'bottom';
        const toPin = validPins.includes(conn.toPin) ? conn.toPin : 'top';

        // Validate style and color
        const validStyles = ['1', '2', '3', '4', '5', '6', '7'];
        const style = validStyles.includes(String(conn.style)) ? String(conn.style) : '5';

        const validColors = ['blue', 'purple', 'yellow', 'green', 'red', 'cyan', 'orange', 'pink'];
        const color = validColors.includes(conn.color) ? conn.color : 'blue';

        return {
            id,
            from,
            to,
            type: conn.type || 'main',
            label: String(conn.label || '').slice(0, 100),
            fromPin,
            toPin,
            style,
            color
        };
    });

    return {
        events: validatedEvents,
        connections: validatedConnections
    };
}

export function importRoadmap(file: File): void {
    const D = (window as any).D;
    const renderRoadmap = (window as any).renderRoadmap;

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
            // Parse JSON
            const data = JSON.parse(e.target!.result as string);

            // SECURITY: Validate and sanitize all input data
            const validated = validateRoadmapImport(data);

            pushUndo('Roadmap importiert');

            // Use validated and sanitized data
            D.roadmap.events = validated.events;
            D.roadmap.connections = validated.connections;

            save();
            renderRoadmap();
            showToast(`Roadmap importiert: ${validated.events.length} Events, ${validated.connections.length} Connections`, 'success');
        } catch (error: any) {
            console.error('[ROADMAP] Import-Fehler:', error);
            showToast('Import fehlgeschlagen: ' + error.message, 'error');
        }
    };

    reader.readAsText(file);
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).createRoadmapEvent = createRoadmapEvent;
(window as any).updateRoadmapEvent = updateRoadmapEvent;
(window as any).deleteRoadmapEvent = deleteRoadmapEvent;
(window as any).toggleRoadmapEventCompletion = toggleRoadmapEventCompletion;
(window as any).createRoadmapConnection = createRoadmapConnection;
(window as any).updateRoadmapConnection = updateRoadmapConnection;
(window as any).deleteRoadmapConnection = deleteRoadmapConnection;
(window as any).clearRoadmap = clearRoadmap;
(window as any).autoLayoutRoadmap = autoLayoutRoadmap;
(window as any).exportRoadmap = exportRoadmap;
(window as any).importRoadmap = importRoadmap;
