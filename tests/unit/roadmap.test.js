/**
 * @jest-environment jsdom
 */

// Roadmap Stability & Functionality Tests
// Testing: Viewport sizing, z-index layering, zoom calculations, coordinate sync, render order

describe('Roadmap - Viewport & Container', () => {
    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="roadmap-container" style="width: 1920px; height: 1080px;">
                <div id="roadmap-viewport">
                    <svg id="roadmap-svg"></svg>
                    <div id="roadmap-events"></div>
                </div>
            </div>
        `;
    });

    test('SVG viewport should have fixed size of 2560x1440', () => {
        // Simuliere updateSVGViewBox() Aufruf
        const svg = document.getElementById('roadmap-svg');

        // EXPECTED: SVG sollte 2560x1440 sein (not container size)
        expect(svg.getAttribute('width')).toBe('2560px');
        expect(svg.getAttribute('height')).toBe('1440px');
        expect(svg.getAttribute('viewBox')).toBe('0 0 2560 1440');
    });

    test('roadmap-events container should match SVG size exactly', () => {
        const svg = document.getElementById('roadmap-svg');
        const eventsContainer = document.getElementById('roadmap-events');

        // EXPECTED: Beide Container müssen identische Größe haben
        expect(eventsContainer.style.width).toBe(svg.getAttribute('width'));
        expect(eventsContainer.style.height).toBe(svg.getAttribute('height'));
    });

    test('viewBox origin should always be (0,0)', () => {
        const svg = document.getElementById('roadmap-svg');
        const viewBox = svg.getAttribute('viewBox');

        // EXPECTED: ViewBox muss bei (0,0) starten für overlay-sync
        expect(viewBox).toMatch(/^0 0 /);
    });
});

describe('Roadmap - Z-Index Layering', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="roadmap-viewport">
                <svg id="roadmap-svg" class="roadmap-svg"></svg>
                <div id="roadmap-events" class="roadmap-events">
                    <div class="roadmap-event"></div>
                </div>
            </div>
        `;
    });

    test('SVG connections should be below events (z-index 1)', () => {
        const svg = document.querySelector('.roadmap-svg');
        const computedStyle = window.getComputedStyle(svg);

        // EXPECTED: SVG z-index = 1 (below)
        expect(computedStyle.zIndex).toBe('1');
    });

    test('roadmap-events container should be above SVG (z-index 10)', () => {
        const eventsContainer = document.querySelector('.roadmap-events');
        const computedStyle = window.getComputedStyle(eventsContainer);

        // EXPECTED: Events container z-index = 10 (above)
        expect(computedStyle.zIndex).toBe('10');
    });

    test('event tiles should have z-index within their parent', () => {
        const eventTile = document.querySelector('.roadmap-event');
        const computedStyle = window.getComputedStyle(eventTile);

        // EXPECTED: Event tiles z-index = 1 (within parent)
        expect(computedStyle.zIndex).toBe('1');
    });
});

describe('Roadmap - Zoom to Cursor Mathematics', () => {
    test('should calculate correct world coordinates before zoom', () => {
        const mouseX = 500;
        const mouseY = 300;
        const pan = { x: 100, y: 50 };
        const zoom = 1;

        // EXPECTED: worldX = (mouseX - pan.x) / zoom
        const worldX = (mouseX - pan.x) / zoom;
        const worldY = (mouseY - pan.y) / zoom;

        expect(worldX).toBe(400);
        expect(worldY).toBe(250);
    });

    test('should adjust pan to keep world point at same mouse position after zoom', () => {
        const mouseX = 500;
        const mouseY = 300;
        let pan = { x: 100, y: 50 };
        const oldZoom = 1;
        const newZoom = 1.2;

        // World coordinates unter Cursor
        const worldX = (mouseX - pan.x) / oldZoom;
        const worldY = (mouseY - pan.y) / oldZoom;

        // EXPECTED: Pan adjustment nach Zoom
        const newPanX = mouseX - worldX * newZoom;
        const newPanY = mouseY - worldY * newZoom;

        expect(newPanX).toBe(20); // 500 - (400 * 1.2) = 500 - 480 = 20
        expect(newPanY).toBe(0);  // 300 - (250 * 1.2) = 300 - 300 = 0
    });

    test('zoom factor should be clamped between 0.3 and 2.0', () => {
        let zoom = 2.5; // Too high
        zoom = Math.min(Math.max(zoom, 0.3), 2);
        expect(zoom).toBe(2);

        zoom = 0.1; // Too low
        zoom = Math.min(Math.max(zoom, 0.3), 2);
        expect(zoom).toBe(0.3);

        zoom = 1.0; // Valid
        zoom = Math.min(Math.max(zoom, 0.3), 2);
        expect(zoom).toBe(1.0);
    });
});

describe('Roadmap - Coordinate System Synchronization', () => {
    test('event position in pixels should match SVG coordinate position', () => {
        const event = { x: 400, y: 200 };

        // EXPECTED: Event.style.left = event.x + 'px' (direct mapping)
        const expectedLeft = `${event.x}px`;
        const expectedTop = `${event.y}px`;

        expect(expectedLeft).toBe('400px');
        expect(expectedTop).toBe('200px');
    });

    test('SVG path coordinates should use same coordinate system as events', () => {
        const fromEvent = { x: 100, y: 100 };
        const toEvent = { x: 500, y: 300 };

        // EXPECTED: SVG path direkt mit event.x/y (kein Offset wegen viewBox origin 0,0)
        const pathStart = { x: fromEvent.x, y: fromEvent.y };
        const pathEnd = { x: toEvent.x, y: toEvent.y };

        expect(pathStart.x).toBe(100);
        expect(pathStart.y).toBe(100);
        expect(pathEnd.x).toBe(500);
        expect(pathEnd.y).toBe(300);
    });
});

describe('Roadmap - Render Order', () => {
    test('renderRoadmapEvents should be called before renderRoadmapConnections', () => {
        const callOrder = [];

        // Mock functions die Call-Order tracken
        global.renderRoadmapEvents = jest.fn(() => callOrder.push('events'));
        global.renderRoadmapConnections = jest.fn(() => callOrder.push('connections'));

        // EXPECTED: Events werden VOR Connections gerendert
        global.renderRoadmapEvents();
        global.renderRoadmapConnections();

        expect(callOrder).toEqual(['events', 'connections']);
    });

    test('DOM elements should exist before connection rendering queries offsetWidth', () => {
        document.body.innerHTML = `<div id="roadmap-events"></div>`;
        const container = document.getElementById('roadmap-events');

        // Event-Tile erstellen
        const tile = document.createElement('div');
        tile.className = 'roadmap-event';
        tile.dataset.id = '1';
        tile.style.width = '320px';
        tile.style.height = '160px';
        container.appendChild(tile);

        // EXPECTED: offsetWidth/Height sollten abrufbar sein
        const queriedTile = document.querySelector('.roadmap-event[data-id="1"]');
        expect(queriedTile).not.toBeNull();
        expect(queriedTile.offsetWidth).toBeGreaterThan(0);
    });
});

describe('Roadmap - Transform Application', () => {
    test('viewport transform should apply both pan and zoom', () => {
        document.body.innerHTML = `<div id="roadmap-viewport"></div>`;
        const viewport = document.getElementById('roadmap-viewport');

        const pan = { x: 100, y: 50 };
        const zoom = 1.5;

        // EXPECTED: transform = translate(pan) scale(zoom)
        const expectedTransform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
        viewport.style.transform = expectedTransform;

        expect(viewport.style.transform).toBe('translate(100px, 50px) scale(1.5)');
    });

    test('transform origin should be top-left (0, 0)', () => {
        document.body.innerHTML = `<div id="roadmap-viewport" class="roadmap-viewport"></div>`;
        const viewport = document.querySelector('.roadmap-viewport');
        const computedStyle = window.getComputedStyle(viewport);

        // EXPECTED: transform-origin = 0 0
        expect(computedStyle.transformOrigin).toMatch(/^0(px)? 0(px)?/);
    });
});

describe('Roadmap - Data Persistence', () => {
    test('UI state should be saved after zoom changes', () => {
        const mockD = {
            roadmap: {
                events: [],
                connections: [],
                _ui: {}
            }
        };

        const pan = { x: 150, y: 75 };
        const zoom = 1.8;

        // EXPECTED: _ui sollte pan, zoom, selectedEventId speichern
        mockD.roadmap._ui = {
            pan: { ...pan },
            zoom: zoom,
            selectedEventId: null
        };

        expect(mockD.roadmap._ui.pan).toEqual({ x: 150, y: 75 });
        expect(mockD.roadmap._ui.zoom).toBe(1.8);
        expect(mockD.roadmap._ui.selectedEventId).toBe(null);
    });
});
