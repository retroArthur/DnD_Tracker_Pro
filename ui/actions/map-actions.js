// [SECTION:MAP_ACTIONS]
// ============================================================
// MAP ACTIONS - @maps @markers @mindmap @nodes
// ============================================================

const MapActions = {
    // Map actions
    'switch-map': (ctx) => switchMap(ctx.id),
    'zoom-map': (ctx) => zoomMap(parseFloat(ctx.value)),
    'set-map-tool': (ctx) => setMapTool(ctx.value),
    'toggle-map-grid': () => toggleMapGrid(),
    'toggle-map-fog': () => toggleMapFog(),
    'toggle-map-connections': () => toggleMapConnections(),
    'quick-pin': (ctx) => handleQuickPin(ctx.value),

    // Marker actions
    'edit-marker': (ctx) => editMarker(ctx.id),
    'delete-marker': (ctx) => deleteMarker(ctx.id),
    'focus-marker': (ctx) => focusMarker(ctx.id),
    'show-add-marker-modal': () => { clearMarkerForm(); showModal('map-marker-modal'); },

    // Mindmap actions
    'zoom-mindmap': (ctx) => zoomMindmap(parseFloat(ctx.value)),
    'select-node-type': (ctx) => selectNodeType(ctx.value),
    'select-conn-type': (ctx) => selectConnType(ctx.value),
    'edit-node-stop': (ctx) => { ctx.event.stopPropagation(); editNode(ctx.id); },
    'delete-node-stop': (ctx) => { ctx.event.stopPropagation(); deleteNodeById(ctx.id); },

    // Test/Debug
    'generate-test-mindmap': (ctx) => generateTestMindmap(parseInt(ctx.value) || 10)
};

// Register all map actions
if (typeof EventDelegation !== 'undefined') {
    Object.entries(MapActions).forEach(([name, handler]) => {
        EventDelegation.registerAction(name, handler);
    });
}
