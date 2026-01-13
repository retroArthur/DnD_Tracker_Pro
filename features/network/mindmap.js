// [SECTION:MINDMAP]
// Was: features/shops/mindmap.js, Now: features/network/mindmap.js
// Mindmap/Netzwerk-Visualisierung
// Zeilen: 719
// ============================================================
// STATE
// ============================================================
let connectMode = false;
let connectFrom = null;
let mindmapZoom = 1;
let mindmapPan = { x: 0, y: 0 };
let isPanning = false;
let panStart = { x: 0, y: 0 };
let dragNode = null;
let dragOffset = { x: 0, y: 0 };
let selectedNode = null;
// ============================================================
// CONSTANTS
// ============================================================
const NODE_ICONS = Object.freeze({
    player: '👤',
    npc: '🎭',
    enemy: '👹',
    location: '🏠',
    faction: '⚔️',
    item: '📦',
    quest: '📜',
    event: '⚡',
    group: '👥',
    ruin: '🏚️',
    castle: '🏰',
    palace: '🏯',
    dungeon: '⛓️',
    fortress: '🛡️',
    catacombs: '💀',
    cave: '🕳️'
});
const NODE_LABELS = Object.freeze({
    player: 'Spieler',
    npc: 'NPC',
    enemy: 'Feind',
    location: 'Ort',
    faction: 'Fraktion',
    item: 'Item',
    quest: 'Quest',
    event: 'Event',
    group: 'Gruppe',
    ruin: 'Ruine',
    castle: 'Burg',
    palace: 'Schloss',
    dungeon: 'Dungeon',
    fortress: 'Festung',
    catacombs: 'Katakomben',
    cave: 'Höhle'
});
const CONN_COLORS = Object.freeze({
    ally: 'var(--green)',
    enemy: 'var(--red)',
    neutral: 'var(--text-dim)',
    family: 'var(--pink)',
    business: 'var(--gold)',
    quest: 'var(--purple)',
    member: 'var(--cyan)'
});
let mindmapFilter = '';
let mindmapTypeFilter = '';
// ============================================================
// RENDER
// ============================================================
function renderMindmap() {
    const D = window.D;
    const container = $('mindmap-container');
    const viewport = $('mindmap-viewport');
    const svg = $('mindmap-svg');
    if (!container || !viewport || !svg)
        return;
    // Apply zoom and pan
    viewport.style.transform = `translate(${mindmapPan.x}px, ${mindmapPan.y}px) scale(${mindmapZoom})`;
    // Clear old nodes (keep SVG defs)
    const defs = svg.querySelector('defs');
    svg.innerHTML = '';
    if (defs)
        svg.appendChild(defs);
    viewport.querySelectorAll('.mindmap-node, .mindmap-connection-label').forEach(n => n.remove());
    const mm = D.mindmap;
    if (!mm || !mm.nodes)
        return;
    // Draw connections with bezier curves
    mm.connections.forEach((conn, idx) => {
        const fromNode = mm.nodes.find((n) => n.id === conn.from);
        const toNode = mm.nodes.find((n) => n.id === conn.to);
        if (!fromNode || !toNode)
            return;
        const fromX = fromNode.x + 60;
        const fromY = fromNode.y + 30;
        const toX = toNode.x + 60;
        const toY = toNode.y + 30;
        // Calculate control points for bezier curve
        const dx = toX - fromX;
        const dy = toY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const curvature = Math.min(dist * 0.3, 80);
        // Perpendicular offset for curve
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        const connType = conn.type || 'neutral';
        const color = CONN_COLORS[connType] || CONN_COLORS.neutral;
        // Create path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const pathD = `M ${fromX} ${fromY} Q ${midX} ${midY - curvature * 0.5} ${toX} ${toY}`;
        path.setAttribute('d', pathD);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '2.5');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('marker-end', `url(#arrow-${connType})`);
        path.setAttribute('class', `connection-${connType}`);
        path.style.opacity = '0.8';
        path.style.transition = 'opacity 0.2s, stroke-width 0.2s';
        // Hover effect
        path.onmouseenter = () => { path.style.opacity = '1'; path.style.strokeWidth = '4'; };
        path.onmouseleave = () => { path.style.opacity = '0.8'; path.style.strokeWidth = '2.5'; };
        // Click to delete
        path.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Verbindung "${conn.label || 'Unbenannt'}" löschen?`)) {
                mm.connections.splice(idx, 1);
                renderMindmap();
                save();
            }
        };
        path.style.cursor = 'pointer';
        svg.appendChild(path);
        // Add label
        if (conn.label) {
            const labelDiv = document.createElement('div');
            labelDiv.className = 'mindmap-connection-label';
            labelDiv.textContent = conn.label;
            labelDiv.style.left = midX + 'px';
            labelDiv.style.top = (midY - curvature * 0.25) + 'px';
            labelDiv.style.transform = 'translate(-50%, -50%)';
            labelDiv.style.borderColor = color;
            viewport.appendChild(labelDiv);
        }
    });
    // Draw nodes
    mm.nodes.forEach((node) => {
        const div = document.createElement('div');
        const isSelected = selectedNode === node.id;
        const isConnecting = connectMode && connectFrom === node.id;
        // Check filter
        const matchesSearch = !mindmapFilter || node.name.toLowerCase().includes(mindmapFilter);
        const matchesType = !mindmapTypeFilter || node.type === mindmapTypeFilter;
        const isFilteredOut = !matchesSearch || !matchesType;
        const isHighlight = mindmapFilter && matchesSearch && !isFilteredOut;
        div.className = `mindmap-node ${node.type} ${isSelected ? 'selected' : ''} ${isConnecting ? 'connecting' : ''} ${isFilteredOut ? 'filtered-out' : ''} ${isHighlight ? 'highlight' : ''}`;
        div.style.left = node.x + 'px';
        div.style.top = node.y + 'px';
        div.dataset.id = String(node.id);
        div.innerHTML = `
            <div class="mindmap-node-icon">${NODE_ICONS[node.type] || '❓'}</div>
            <div class="mindmap-node-label">${esc(node.name)}</div>
            <div class="mindmap-node-sub">${NODE_LABELS[node.type] || node.type}</div>
            ${node.desc ? `<div style="font-size: 9px; color: var(--text-dim); margin-top: 2px;">${esc(node.desc)}</div>` : ''}
            ${isSelected ? `<div class="mindmap-node-actions">
                <button class="mindmap-node-action-btn" data-action="edit-node-stop" data-id="${node.id}" title="Bearbeiten">✏️</button>
                <button class="mindmap-node-action-btn" data-action="delete-node-stop" data-id="${node.id}" title="Löschen">🗑️</button>
            </div>` : ''}
            <div class="mindmap-node-connector top" data-dir="top"></div>
            <div class="mindmap-node-connector bottom" data-dir="bottom"></div>
            <div class="mindmap-node-connector left" data-dir="left"></div>
            <div class="mindmap-node-connector right" data-dir="right"></div>
        `;
        // Click handler
        div.onclick = (e) => {
            if (e.target.classList.contains('mindmap-node-connector'))
                return;
            if (e.target.classList.contains('mindmap-node-action-btn'))
                return;
            if (isFilteredOut)
                return;
            handleNodeClick(node.id);
        };
        // Double-click to edit
        div.ondblclick = (e) => {
            if (e.target.classList.contains('mindmap-node-connector'))
                return;
            if (isFilteredOut)
                return;
            e.stopPropagation();
            editNode(node.id);
        };
        // Drag handler
        div.onmousedown = (e) => {
            if (e.target.classList.contains('mindmap-node-connector')) {
                startConnectFromConnector(node.id);
                return;
            }
            if (e.target.classList.contains('mindmap-node-action-btn'))
                return;
            startNodeDrag(e, node.id);
        };
        // Connector click handlers
        div.querySelectorAll('.mindmap-node-connector').forEach(conn => {
            conn.addEventListener('click', (e) => {
                e.stopPropagation();
                startConnectFromConnector(node.id);
            });
        });
        viewport.appendChild(div);
    });
    // Update counter
    const countEl = $('network-io-count');
    if (countEl)
        countEl.textContent = String(mm.nodes.length);
}
function handleNodeClick(nodeId) {
    if (connectMode) {
        if (connectFrom === null) {
            connectFrom = nodeId;
            renderMindmap();
        }
        else if (connectFrom !== nodeId) {
            showConnectionModal(connectFrom, nodeId);
        }
    }
    else {
        selectedNode = selectedNode === nodeId ? null : nodeId;
        renderMindmap();
    }
}
function startConnectFromConnector(nodeId) {
    if (!connectMode) {
        startConnectMode();
    }
    connectFrom = nodeId;
    renderMindmap();
}
// ============================================================
// NODE CRUD
// ============================================================
function showAddNodeModal() {
    const editIdInput = $('edit-node-id');
    const nameInput = $('node-name');
    const typeInput = $('node-type');
    const descInput = $('node-desc');
    const titleEl = $('node-modal-title');
    const btnEl = $('node-save-btn');
    if (editIdInput)
        editIdInput.value = '';
    if (nameInput)
        nameInput.value = '';
    if (typeInput)
        typeInput.value = 'npc';
    if (descInput)
        descInput.value = '';
    if (titleEl)
        titleEl.textContent = '➕ Node hinzufügen';
    if (btnEl)
        btnEl.textContent = 'Hinzufügen';
    document.querySelectorAll('.node-type-btn').forEach(btn => {
        btn.classList.remove('btn-success');
        if (btn.dataset.type === 'npc')
            btn.classList.add('btn-success');
    });
    showModal('add-node-modal');
    if (nameInput)
        nameInput.focus();
}
function editNode(nodeId) {
    const D = window.D;
    const node = D.mindmap.nodes.find((n) => n.id === nodeId);
    if (!node)
        return;
    const editIdInput = $('edit-node-id');
    const nameInput = $('node-name');
    const typeInput = $('node-type');
    const descInput = $('node-desc');
    const titleEl = $('node-modal-title');
    const btnEl = $('node-save-btn');
    if (editIdInput)
        editIdInput.value = String(nodeId);
    if (nameInput)
        nameInput.value = node.name || '';
    if (typeInput)
        typeInput.value = node.type || 'npc';
    if (descInput)
        descInput.value = node.desc || '';
    if (titleEl)
        titleEl.textContent = '✏️ Node bearbeiten';
    if (btnEl)
        btnEl.textContent = 'Speichern';
    document.querySelectorAll('.node-type-btn').forEach(btn => {
        btn.classList.remove('btn-success');
        if (btn.dataset.type === node.type)
            btn.classList.add('btn-success');
    });
    showModal('add-node-modal');
    if (nameInput)
        nameInput.focus();
}
function saveNodeFromModal() {
    const D = window.D;
    const nextId = window.nextId;
    const nameInput = $('node-name');
    const typeInput = $('node-type');
    const descInput = $('node-desc');
    const editIdInput = $('edit-node-id');
    const name = nameInput?.value.trim() || '';
    if (!name) {
        showToast('Name erforderlich');
        return;
    }
    const type = typeInput?.value || 'npc';
    const desc = descInput?.value.trim() || '';
    const editId = editIdInput?.value || '';
    if (editId) {
        // Bearbeiten
        const node = D.mindmap.nodes.find((n) => n.id === parseInt(editId));
        if (node) {
            node.name = name;
            node.type = type;
            node.desc = desc;
            showToast(`${NODE_ICONS[type]} ${name} aktualisiert`);
        }
    }
    else {
        // Neu hinzufügen
        const container = $('mindmap-container');
        if (!container)
            return;
        const centerX = (container.clientWidth / 2 - mindmapPan.x) / mindmapZoom;
        const centerY = (container.clientHeight / 2 - mindmapPan.y) / mindmapZoom;
        D.mindmap.nodes.push({
            id: nextId('mindmapNodes'),
            name,
            type,
            desc,
            x: centerX - 60 + (Math.random() - 0.5) * 100,
            y: centerY - 30 + (Math.random() - 0.5) * 100
        });
        showToast(`${NODE_ICONS[type]} ${name} hinzugefügt`);
    }
    hideModal('add-node-modal');
    renderMindmap();
    save();
}
function selectNodeType(type) {
    const typeInput = $('node-type');
    if (typeInput)
        typeInput.value = type;
    document.querySelectorAll('.node-type-btn').forEach(btn => {
        btn.classList.toggle('btn-success', btn.dataset.type === type);
    });
}
function deleteSelectedNode() {
    if (selectedNode === null) {
        showToast('Kein Node ausgewählt');
        return;
    }
    deleteNodeById(selectedNode);
}
function editSelectedNode() {
    if (selectedNode === null) {
        showToast('Kein Node ausgewählt');
        return;
    }
    editNode(selectedNode);
}
function deleteNodeById(nodeId) {
    const D = window.D;
    const node = D.mindmap.nodes.find((n) => n.id === nodeId);
    if (!node)
        return;
    if (confirm(`"${node.name}" löschen?`)) {
        pushUndo('Mindmap-Node gelöscht');
        D.mindmap.nodes = D.mindmap.nodes.filter((n) => n.id !== nodeId);
        D.mindmap.connections = D.mindmap.connections.filter((c) => c.from !== nodeId && c.to !== nodeId);
        if (selectedNode === nodeId)
            selectedNode = null;
        renderMindmap();
        save();
        showToast('🗑️ Node gelöscht');
    }
}
// ============================================================
// CONNECTION MODE
// ============================================================
function startConnectMode() {
    connectMode = true;
    connectFrom = null;
    const btn = $('connect-mode-btn');
    const info = $('connection-info');
    if (btn)
        btn.classList.add('btn-success');
    if (info)
        info.style.display = 'block';
    renderMindmap();
}
function cancelConnectMode() {
    connectMode = false;
    connectFrom = null;
    const btn = $('connect-mode-btn');
    const info = $('connection-info');
    if (btn)
        btn.classList.remove('btn-success');
    if (info)
        info.style.display = 'none';
    renderMindmap();
}
function showConnectionModal(from, to) {
    const D = window.D;
    const fromNode = D.mindmap.nodes.find((n) => n.id === from);
    const toNode = D.mindmap.nodes.find((n) => n.id === to);
    const infoEl = $('connection-nodes-info');
    if (infoEl) {
        infoEl.innerHTML = `
            <span style="color: var(--cyan);">${NODE_ICONS[fromNode.type]} ${esc(fromNode.name)}</span>
            <span style="margin: 0 12px;">→</span>
            <span style="color: var(--gold);">${NODE_ICONS[toNode.type]} ${esc(toNode.name)}</span>
        `;
    }
    const typeInput = $('conn-type');
    const labelInput = $('conn-label');
    if (typeInput)
        typeInput.value = 'neutral';
    if (labelInput)
        labelInput.value = '';
    document.querySelectorAll('.conn-type-btn').forEach(btn => {
        btn.classList.remove('btn-success');
        if (btn.dataset.type === 'neutral')
            btn.classList.add('btn-success');
    });
    // Store connection data
    window._pendingConnection = { from, to };
    showModal('connection-modal');
}
function selectConnType(type) {
    const typeInput = $('conn-type');
    if (typeInput)
        typeInput.value = type;
    document.querySelectorAll('.conn-type-btn').forEach(btn => {
        btn.classList.toggle('btn-success', btn.dataset.type === type);
    });
}
function confirmConnection() {
    const D = window.D;
    const pending = window._pendingConnection;
    if (!pending)
        return;
    const { from, to } = pending;
    const typeInput = $('conn-type');
    const labelInput = $('conn-label');
    const type = typeInput?.value || 'neutral';
    const label = labelInput?.value.trim() || '';
    // Check if connection already exists
    const exists = D.mindmap.connections.some((c) => (c.from === from && c.to === to) || (c.from === to && c.to === from));
    if (exists) {
        showToast('Verbindung existiert bereits');
    }
    else {
        D.mindmap.connections.push({ from, to, type, label });
        save();
        showToast('Verbindung erstellt');
    }
    hideModal('connection-modal');
    cancelConnectMode();
    delete window._pendingConnection;
}
// ============================================================
// DRAG & DROP
// ============================================================
function startNodeDrag(e, nodeId) {
    const D = window.D;
    if (connectMode)
        return;
    dragNode = D.mindmap.nodes.find((n) => n.id === nodeId) || null;
    if (!dragNode)
        return;
    const container = $('mindmap-container');
    if (!container)
        return;
    const rect = container.getBoundingClientRect();
    dragOffset = {
        x: (e.clientX - rect.left - mindmapPan.x) / mindmapZoom - dragNode.x,
        y: (e.clientY - rect.top - mindmapPan.y) / mindmapZoom - dragNode.y
    };
    document.addEventListener('mousemove', onNodeDrag);
    document.addEventListener('mouseup', stopNodeDrag);
    e.preventDefault();
}
function onNodeDrag(e) {
    if (!dragNode)
        return;
    const container = $('mindmap-container');
    if (!container)
        return;
    const rect = container.getBoundingClientRect();
    dragNode.x = Math.max(0, (e.clientX - rect.left - mindmapPan.x) / mindmapZoom - dragOffset.x);
    dragNode.y = Math.max(0, (e.clientY - rect.top - mindmapPan.y) / mindmapZoom - dragOffset.y);
    renderMindmap();
}
function stopNodeDrag() {
    if (dragNode) {
        save();
    }
    dragNode = null;
    document.removeEventListener('mousemove', onNodeDrag);
    document.removeEventListener('mouseup', stopNodeDrag);
}
// ============================================================
// ZOOM & PAN
// ============================================================
function zoomMindmap(delta) {
    const newZoom = Math.max(0.3, Math.min(2, mindmapZoom + delta));
    mindmapZoom = newZoom;
    updateMindmapZoomDisplay();
    renderMindmap();
}
function resetZoom() {
    mindmapZoom = 1;
    mindmapPan = { x: 0, y: 0 };
    updateMindmapZoomDisplay();
    renderMindmap();
}
function updateMindmapZoomDisplay() {
    const display = $('mindmap-zoom-display');
    if (display) {
        display.textContent = Math.round(mindmapZoom * 100) + '%';
    }
}
function centerView() {
    const D = window.D;
    if (!D.mindmap.nodes.length) {
        resetZoom();
        return;
    }
    // Calculate bounding box of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    D.mindmap.nodes.forEach((n) => {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x + 120);
        maxY = Math.max(maxY, n.y + 60);
    });
    const container = $('mindmap-container');
    if (!container)
        return;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    mindmapPan.x = container.clientWidth / 2 - centerX * mindmapZoom;
    mindmapPan.y = container.clientHeight / 2 - centerY * mindmapZoom;
    renderMindmap();
}
// ============================================================
// AUTO LAYOUT
// ============================================================
function autoLayoutNodes() {
    const D = window.D;
    const nodes = D.mindmap.nodes;
    if (!nodes.length)
        return;
    const container = $('mindmap-container');
    if (!container)
        return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    // Simple circular layout for now
    const centerX = width / 2 / mindmapZoom - mindmapPan.x / mindmapZoom;
    const centerY = height / 2 / mindmapZoom - mindmapPan.y / mindmapZoom;
    const radius = Math.min(width, height) * 0.35 / mindmapZoom;
    nodes.forEach((node, i) => {
        const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
        node.x = centerX + Math.cos(angle) * radius - 60;
        node.y = centerY + Math.sin(angle) * radius - 30;
    });
    renderMindmap();
    save();
    showToast('Nodes automatisch angeordnet');
}
// ============================================================
// FILTER
// ============================================================
function filterMindmapNodes() {
    const D = window.D;
    const searchInput = $('mindmap-search');
    const typeFilterInput = $('mindmap-type-filter');
    mindmapFilter = (searchInput?.value || '').toLowerCase();
    mindmapTypeFilter = typeFilterInput?.value || '';
    renderMindmap();
    // Update counter
    const count = D.mindmap?.nodes?.length || 0;
    const countEl = $('network-io-count');
    if (countEl)
        countEl.textContent = String(count);
}
// ============================================================
// IMPORT
// ============================================================
function showImportNodesModal() {
    showModal('import-nodes-modal');
    populateImportNodesList();
}
function populateImportNodesList() {
    const D = window.D;
    const sourceInput = $('import-nodes-source');
    const listEl = $('import-nodes-list');
    if (!listEl)
        return;
    const source = sourceInput?.value || 'characters';
    let items = [];
    let itemType = 'npc';
    switch (source) {
        case 'characters':
            items = D.characters || [];
            itemType = 'player';
            break;
        case 'npcs':
            items = D.npcs || [];
            itemType = 'npc';
            break;
        case 'locations':
            items = D.locations || [];
            itemType = 'location';
            break;
        case 'quests':
            items = D.quests || [];
            itemType = 'quest';
            break;
        case 'encounters':
            items = D.encounters || [];
            itemType = 'enemy';
            break;
    }
    if (!items.length) {
        listEl.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 20px;">Keine Einträge vorhanden</div>';
        return;
    }
    // Check which are already imported
    const existingNames = new Set((D.mindmap?.nodes || []).map((n) => n.name.toLowerCase()));
    listEl.innerHTML = items.map(item => {
        const name = item.name || item.title || 'Unbenannt';
        const exists = existingNames.has(name.toLowerCase());
        const icon = NODE_ICONS[itemType] || '❓';
        return `
            <label style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 4px; cursor: pointer; ${exists ? 'opacity: 0.4;' : ''}"
                   class="import-node-item" ${exists ? 'title="Bereits importiert"' : ''}>
                <input type="checkbox" data-name="${esc(name)}" data-type="${itemType}" data-source="${source}" data-id="${item.id}" ${exists ? 'disabled' : ''}>
                <span>${icon}</span>
                <span style="flex: 1;">${esc(name)}</span>
                ${exists ? '<span style="font-size: 10px; color: var(--green);">✓</span>' : ''}
            </label>
        `;
    }).join('');
}
function importSelectedNodes() {
    const D = window.D;
    const nextId = window.nextId;
    const checkboxes = document.querySelectorAll('#import-nodes-list input[type="checkbox"]:checked');
    if (!checkboxes.length) {
        showToast('⚠️ Keine Einträge ausgewählt', 'warning');
        return;
    }
    const container = $('mindmap-container');
    if (!container)
        return;
    const centerX = (container.clientWidth / 2 - mindmapPan.x) / mindmapZoom;
    const centerY = (container.clientHeight / 2 - mindmapPan.y) / mindmapZoom;
    let count = 0;
    checkboxes.forEach((cb, i) => {
        const name = cb.dataset.name || '';
        const type = cb.dataset.type || 'npc';
        // Add node with slight offset
        const angle = (i / checkboxes.length) * Math.PI * 2;
        const radius = 100 + Math.random() * 50;
        D.mindmap.nodes.push({
            id: nextId('mindmapNodes'),
            name,
            type,
            desc: '',
            x: centerX + Math.cos(angle) * radius - 60,
            y: centerY + Math.sin(angle) * radius - 30
        });
        count++;
    });
    hideModal('import-nodes-modal');
    renderMindmap();
    save();
    showToast(`📥 ${count} Node(s) importiert`);
}
function importAllNodes() {
    const checkboxes = document.querySelectorAll('#import-nodes-list input[type="checkbox"]:not(:disabled)');
    checkboxes.forEach(cb => cb.checked = true);
    importSelectedNodes();
}
// ============================================================
// EXPORT
// ============================================================
function exportMindmapImage() {
    showToast('🖼️ Export als PNG (In Entwicklung)');
    // TODO: Implement html2canvas or similar
}
// ============================================================
// INITIALIZATION
// ============================================================
function initMindmapPan() {
    const container = $('mindmap-container');
    if (!container)
        return;
    container.addEventListener('mousedown', (e) => {
        const target = e.target;
        if (target === container || target.id === 'mindmap-viewport' || target.tagName === 'svg') {
            isPanning = true;
            panStart = { x: e.clientX - mindmapPan.x, y: e.clientY - mindmapPan.y };
            container.style.cursor = 'grabbing';
        }
    });
    container.addEventListener('mousemove', (e) => {
        if (!isPanning)
            return;
        mindmapPan.x = e.clientX - panStart.x;
        mindmapPan.y = e.clientY - panStart.y;
        renderMindmap();
    });
    container.addEventListener('mouseup', () => {
        isPanning = false;
        container.style.cursor = '';
    });
    container.addEventListener('mouseleave', () => {
        isPanning = false;
        container.style.cursor = '';
    });
    // Zoom with scroll wheel
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        zoomMindmap(delta);
    }, { passive: false });
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.renderMindmap = renderMindmap;
window.showAddNodeModal = showAddNodeModal;
window.editNode = editNode;
window.saveNodeFromModal = saveNodeFromModal;
window.selectNodeType = selectNodeType;
window.deleteSelectedNode = deleteSelectedNode;
window.editSelectedNode = editSelectedNode;
window.deleteNodeById = deleteNodeById;
window.startConnectMode = startConnectMode;
window.cancelConnectMode = cancelConnectMode;
window.showConnectionModal = showConnectionModal;
window.selectConnType = selectConnType;
window.confirmConnection = confirmConnection;
window.zoomMindmap = zoomMindmap;
window.resetZoom = resetZoom;
window.centerView = centerView;
window.autoLayoutNodes = autoLayoutNodes;
window.filterMindmapNodes = filterMindmapNodes;
window.showImportNodesModal = showImportNodesModal;
window.populateImportNodesList = populateImportNodesList;
window.importSelectedNodes = importSelectedNodes;
window.importAllNodes = importAllNodes;
window.exportMindmapImage = exportMindmapImage;
window.initMindmapPan = initMindmapPan;
