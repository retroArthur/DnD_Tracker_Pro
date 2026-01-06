// Test Helper: Inject Roadmap CSS styles into jsdom
function injectRoadmapStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .roadmap-svg {
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 1; /* Below tiles - connections go under events */
        }

        .roadmap-events {
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 10; /* Above SVG - events on top */
        }

        .roadmap-event {
            position: absolute;
            background: rgba(30, 30, 30, 0.95);
            border: 2px solid var(--border);
            border-radius: 12px;
            padding: 16px;
            min-width: 280px;
            max-width: 320px;
            cursor: move;
            pointer-events: auto;
            z-index: 1; /* Ensure events stay above connections within their parent */
        }

        .roadmap-viewport {
            width: 100%;
            height: 100%;
            position: relative;
            transform-origin: 0 0;
            transition: transform 0.05s ease-out;
        }
    `;
    document.head.appendChild(style);
}

// Mock DOM utility function
function $(id) {
    return document.getElementById(id);
}

// Implementation: updateSVGViewBox
function updateSVGViewBox() {
    const svg = $('roadmap-svg');

    // FIXED SIZE: 2560x1440 für Container und Viewport
    const FIXED_WIDTH = 2560;
    const FIXED_HEIGHT = 1440;

    if (!svg) return;

    // CRITICAL: ViewBox origin MUSS (0,0) bleiben für overlay-sync
    // CRITICAL: width/height MÜSSEN in PIXELN sein, NICHT Prozent
    svg.setAttribute('viewBox', `0 0 ${FIXED_WIDTH} ${FIXED_HEIGHT}`);
    svg.setAttribute('width', `${FIXED_WIDTH}px`);
    svg.setAttribute('height', `${FIXED_HEIGHT}px`);

    // CRITICAL: roadmap-events Container muss IDENTISCHE Größe haben wie SVG!
    const eventsContainer = $('roadmap-events');
    if (eventsContainer) {
        eventsContainer.style.width = `${FIXED_WIDTH}px`;
        eventsContainer.style.height = `${FIXED_HEIGHT}px`;
    }
}

// Implementation: applyRoadmapTransform
function applyRoadmapTransform(pan, zoom) {
    const viewport = $('roadmap-viewport');
    if (!viewport) return;

    viewport.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
}

// Implementation: saveRoadmapUIState
function saveRoadmapUIState(D, pan, zoom, selectedEventId) {
    if (!D.roadmap) return;

    D.roadmap._ui = {
        pan: { ...pan },
        zoom: zoom,
        selectedEventId: selectedEventId || null
    };
}

module.exports = {
    injectRoadmapStyles,
    updateSVGViewBox,
    applyRoadmapTransform,
    saveRoadmapUIState,
    $
};
