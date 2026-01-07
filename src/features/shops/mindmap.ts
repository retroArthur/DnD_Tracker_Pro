// [SECTION:MINDMAP]
// Extrahiert aus shops.js
// Mindmap/Netzwerk-Visualisierung
// Zeilen: 719

import { $, esc } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { pushUndo } from '@systems/undo';
import { showModal, hideModal } from '@systems/spellslots/navigation';

// ============================================================
// TYPES
// ============================================================

interface Point {
    x: number;
    y: number;
}

interface MindmapNode {
    id: number;
    name: string;
    type: string;
    desc?: string;
    x: number;
    y: number;
}

interface MindmapConnection {
    from: number;
    to: number;
    type: string;
    label?: string;
}

interface PendingConnection {
    from: number;
    to: number;
}

// ============================================================
// STATE
// ============================================================

let connectMode: boolean = false;
let connectFrom: number | null = null;
let mindmapZoom: number = 1;
let mindmapPan: Point = { x: 0, y: 0 };
let isPanning: boolean = false;
let panStart: Point = { x: 0, y: 0 };
let dragNode: MindmapNode | null = null;
let dragOffset: Point = { x: 0, y: 0 };
let selectedNode: number | null = null;

// ============================================================
// CONSTANTS
// ============================================================

const NODE_ICONS: Readonly<Record<string, string>> = Object.freeze({
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

const NODE_LABELS: Readonly<Record<string, string>> = Object.freeze({
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

const CONN_COLORS: Readonly<Record<string, string>> = Object.freeze({
    ally: 'var(--green)',
    enemy: 'var(--red)',
    neutral: 'var(--text-dim)',
    family: 'var(--pink)',
    business: 'var(--gold)',
    quest: 'var(--purple)',
    member: 'var(--cyan)'
});

let mindmapFilter: string = '';
let mindmapTypeFilter: string = '';

// ============================================================
// RENDER
// ============================================================

export function renderMindmap(): void {
    const D = (window as any).D;

    const container = $('mindmap-container');
    const viewport = $('mindmap-viewport');
    const svg = $('mindmap-svg') as SVGElement | null;
    if (!container || !viewport || !svg) return;

    // Apply zoom and pan
    viewport.style.transform = `translate(${mindmapPan.x}px, ${mindmapPan.y}px) scale(${mindmapZoom})`;

    // Clear old nodes (keep SVG defs)
    const defs = svg.querySelector('defs');
    svg.innerHTML = '';
    if (defs) svg.appendChild(defs);
    viewport.querySelectorAll('.mindmap-node, .mindmap-connection-label').forEach(n => n.remove());

    const mm = D.mindmap;
    if (!mm || !mm.nodes) return;

    // Draw connections with bezier curves
    mm.connections.forEach((conn: MindmapConnection, idx: number) => {
        const fromNode = mm.nodes.find((n: MindmapNode) => n.id === conn.from);
        const toNode = mm.nodes.find((n: MindmapNode) => n.id === conn.to);
        if (!fromNode || !toNode) return;

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
        path.onclick = (e: MouseEvent) => {
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
    mm.nodes.forEach((node: MindmapNode) => {
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
        div.onclick = (e: MouseEvent) => {
            if ((e.target as HTMLElement).classList.contains('mindmap-node-connector')) return;
            if ((e.target as HTMLElement).classList.contains('mindmap-node-action-btn')) return;
            if (isFilteredOut) return;
            handleNodeClick(node.id);
        };

        // Double-click to edit
        div.ondblclick = (e: MouseEvent) => {
            if ((e.target as HTMLElement).classList.contains('mindmap-node-connector')) return;
            if (isFilteredOut) return;
            e.stopPropagation();
            editNode(node.id);
        };

        // Drag handler
        div.onmousedown = (e: MouseEvent) => {
            if ((e.target as HTMLElement).classList.contains('mindmap-node-connector')) {
                startConnectFromConnector(node.id);
                return;
            }
            if ((e.target as HTMLElement).classList.contains('mindmap-node-action-btn')) return;
            startNodeDrag(e, node.id);
        };

        // Connector click handlers
        div.querySelectorAll('.mindmap-node-connector').forEach(conn => {
            conn.addEventListener('click', (e: Event) => {
                e.stopPropagation();
                startConnectFromConnector(node.id);
            });
        });

        viewport.appendChild(div);
    });

    // Update counter
    const countEl = $('network-io-count');
    if (countEl) countEl.textContent = String(mm.nodes.length);
}

function handleNodeClick(nodeId: number): void {
    if (connectMode) {
        if (connectFrom === null) {
            connectFrom = nodeId;
            renderMindmap();
        } else if (connectFrom !== nodeId) {
            showConnectionModal(connectFrom, nodeId);
        }
    } else {
        selectedNode = selectedNode === nodeId ? null : nodeId;
        renderMindmap();
    }
}

function startConnectFromConnector(nodeId: number): void {
    if (!connectMode) {
        startConnectMode();
    }
    connectFrom = nodeId;
    renderMindmap();
}

// ============================================================
// NODE CRUD
// ============================================================

export function showAddNodeModal(): void {
    const editIdInput = $('edit-node-id') as HTMLInputElement | null;
    const nameInput = $('node-name') as HTMLInputElement | null;
    const typeInput = $('node-type') as HTMLSelectElement | null;
    const descInput = $('node-desc') as HTMLTextAreaElement | null;
    const titleEl = $('node-modal-title');
    const btnEl = $('node-save-btn');

    if (editIdInput) editIdInput.value = '';
    if (nameInput) nameInput.value = '';
    if (typeInput) typeInput.value = 'npc';
    if (descInput) descInput.value = '';
    if (titleEl) titleEl.textContent = '➕ Node hinzufügen';
    if (btnEl) btnEl.textContent = 'Hinzufügen';

    document.querySelectorAll('.node-type-btn').forEach(btn => {
        btn.classList.remove('btn-success');
        if ((btn as HTMLElement).dataset.type === 'npc') btn.classList.add('btn-success');
    });

    showModal('add-node-modal');
    if (nameInput) nameInput.focus();
}

export function editNode(nodeId: number): void {
    const D = (window as any).D;
    const node = D.mindmap.nodes.find((n: MindmapNode) => n.id === nodeId);
    if (!node) return;

    const editIdInput = $('edit-node-id') as HTMLInputElement | null;
    const nameInput = $('node-name') as HTMLInputElement | null;
    const typeInput = $('node-type') as HTMLSelectElement | null;
    const descInput = $('node-desc') as HTMLTextAreaElement | null;
    const titleEl = $('node-modal-title');
    const btnEl = $('node-save-btn');

    if (editIdInput) editIdInput.value = String(nodeId);
    if (nameInput) nameInput.value = node.name || '';
    if (typeInput) typeInput.value = node.type || 'npc';
    if (descInput) descInput.value = node.desc || '';
    if (titleEl) titleEl.textContent = '✏️ Node bearbeiten';
    if (btnEl) btnEl.textContent = 'Speichern';

    document.querySelectorAll('.node-type-btn').forEach(btn => {
        btn.classList.remove('btn-success');
        if ((btn as HTMLElement).dataset.type === node.type) btn.classList.add('btn-success');
    });

    showModal('add-node-modal');
    if (nameInput) nameInput.focus();
}

export function saveNodeFromModal(): void {
    const D = (window as any).D;
    const nextId = (window as any).nextId;

    const nameInput = $('node-name') as HTMLInputElement | null;
    const typeInput = $('node-type') as HTMLSelectElement | null;
    const descInput = $('node-desc') as HTMLTextAreaElement | null;
    const editIdInput = $('edit-node-id') as HTMLInputElement | null;

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
        const node = D.mindmap.nodes.find((n: MindmapNode) => n.id === parseInt(editId));
        if (node) {
            node.name = name;
            node.type = type;
            node.desc = desc;
            showToast(`${NODE_ICONS[type]} ${name} aktualisiert`);
        }
    } else {
        // Neu hinzufügen
        const container = $('mindmap-container');
        if (!container) return;

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

export function selectNodeType(type: string): void {
    const typeInput = $('node-type') as HTMLSelectElement | null;
    if (typeInput) typeInput.value = type;

    document.querySelectorAll('.node-type-btn').forEach(btn => {
        btn.classList.toggle('btn-success', (btn as HTMLElement).dataset.type === type);
    });
}

export function deleteSelectedNode(): void {
    if (selectedNode === null) {
        showToast('Kein Node ausgewählt');
        return;
    }
    deleteNodeById(selectedNode);
}

export function editSelectedNode(): void {
    if (selectedNode === null) {
        showToast('Kein Node ausgewählt');
        return;
    }
    editNode(selectedNode);
}

export function deleteNodeById(nodeId: number): void {
    const D = (window as any).D;
    const node = D.mindmap.nodes.find((n: MindmapNode) => n.id === nodeId);
    if (!node) return;

    if (confirm(`"${node.name}" löschen?`)) {
        pushUndo('Mindmap-Node gelöscht');
        D.mindmap.nodes = D.mindmap.nodes.filter((n: MindmapNode) => n.id !== nodeId);
        D.mindmap.connections = D.mindmap.connections.filter((c: MindmapConnection) => c.from !== nodeId && c.to !== nodeId);
        if (selectedNode === nodeId) selectedNode = null;
        renderMindmap();
        save();
        showToast('🗑️ Node gelöscht');
    }
}

// ============================================================
// CONNECTION MODE
// ============================================================

export function startConnectMode(): void {
    connectMode = true;
    connectFrom = null;
    const btn = $('connect-mode-btn');
    const info = $('connection-info');
    if (btn) btn.classList.add('btn-success');
    if (info) info.style.display = 'block';
    renderMindmap();
}

export function cancelConnectMode(): void {
    connectMode = false;
    connectFrom = null;
    const btn = $('connect-mode-btn');
    const info = $('connection-info');
    if (btn) btn.classList.remove('btn-success');
    if (info) info.style.display = 'none';
    renderMindmap();
}

export function showConnectionModal(from: number, to: number): void {
    const D = (window as any).D;
    const fromNode = D.mindmap.nodes.find((n: MindmapNode) => n.id === from);
    const toNode = D.mindmap.nodes.find((n: MindmapNode) => n.id === to);

    const infoEl = $('connection-nodes-info');
    if (infoEl) {
        infoEl.innerHTML = `
            <span style="color: var(--cyan);">${NODE_ICONS[fromNode.type]} ${esc(fromNode.name)}</span>
            <span style="margin: 0 12px;">→</span>
            <span style="color: var(--gold);">${NODE_ICONS[toNode.type]} ${esc(toNode.name)}</span>
        `;
    }

    const typeInput = $('conn-type') as HTMLSelectElement | null;
    const labelInput = $('conn-label') as HTMLInputElement | null;
    if (typeInput) typeInput.value = 'neutral';
    if (labelInput) labelInput.value = '';

    document.querySelectorAll('.conn-type-btn').forEach(btn => {
        btn.classList.remove('btn-success');
        if ((btn as HTMLElement).dataset.type === 'neutral') btn.classList.add('btn-success');
    });

    // Store connection data
    (window as any)._pendingConnection = { from, to };

    showModal('connection-modal');
}

export function selectConnType(type: string): void {
    const typeInput = $('conn-type') as HTMLSelectElement | null;
    if (typeInput) typeInput.value = type;

    document.querySelectorAll('.conn-type-btn').forEach(btn => {
        btn.classList.toggle('btn-success', (btn as HTMLElement).dataset.type === type);
    });
}

export function confirmConnection(): void {
    const D = (window as any).D;
    const pending = (window as any)._pendingConnection as PendingConnection | undefined;
    if (!pending) return;

    const { from, to } = pending;
    const typeInput = $('conn-type') as HTMLSelectElement | null;
    const labelInput = $('conn-label') as HTMLInputElement | null;
    const type = typeInput?.value || 'neutral';
    const label = labelInput?.value.trim() || '';

    // Check if connection already exists
    const exists = D.mindmap.connections.some((c: MindmapConnection) =>
        (c.from === from && c.to === to) || (c.from === to && c.to === from)
    );

    if (exists) {
        showToast('Verbindung existiert bereits');
    } else {
        D.mindmap.connections.push({ from, to, type, label });
        save();
        showToast('Verbindung erstellt');
    }

    hideModal('connection-modal');
    cancelConnectMode();
    delete (window as any)._pendingConnection;
}

// ============================================================
// DRAG & DROP
// ============================================================

function startNodeDrag(e: MouseEvent, nodeId: number): void {
    const D = (window as any).D;
    if (connectMode) return;

    dragNode = D.mindmap.nodes.find((n: MindmapNode) => n.id === nodeId) || null;
    if (!dragNode) return;

    const container = $('mindmap-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    dragOffset = {
        x: (e.clientX - rect.left - mindmapPan.x) / mindmapZoom - dragNode.x,
        y: (e.clientY - rect.top - mindmapPan.y) / mindmapZoom - dragNode.y
    };

    document.addEventListener('mousemove', onNodeDrag);
    document.addEventListener('mouseup', stopNodeDrag);
    e.preventDefault();
}

function onNodeDrag(e: MouseEvent): void {
    if (!dragNode) return;

    const container = $('mindmap-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    dragNode.x = Math.max(0, (e.clientX - rect.left - mindmapPan.x) / mindmapZoom - dragOffset.x);
    dragNode.y = Math.max(0, (e.clientY - rect.top - mindmapPan.y) / mindmapZoom - dragOffset.y);

    renderMindmap();
}

function stopNodeDrag(): void {
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

export function zoomMindmap(delta: number): void {
    const newZoom = Math.max(0.3, Math.min(2, mindmapZoom + delta));
    mindmapZoom = newZoom;
    updateMindmapZoomDisplay();
    renderMindmap();
}

export function resetZoom(): void {
    mindmapZoom = 1;
    mindmapPan = { x: 0, y: 0 };
    updateMindmapZoomDisplay();
    renderMindmap();
}

function updateMindmapZoomDisplay(): void {
    const display = $('mindmap-zoom-display');
    if (display) {
        display.textContent = Math.round(mindmapZoom * 100) + '%';
    }
}

export function centerView(): void {
    const D = (window as any).D;
    if (!D.mindmap.nodes.length) {
        resetZoom();
        return;
    }

    // Calculate bounding box of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    D.mindmap.nodes.forEach((n: MindmapNode) => {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x + 120);
        maxY = Math.max(maxY, n.y + 60);
    });

    const container = $('mindmap-container');
    if (!container) return;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    mindmapPan.x = container.clientWidth / 2 - centerX * mindmapZoom;
    mindmapPan.y = container.clientHeight / 2 - centerY * mindmapZoom;

    renderMindmap();
}

// ============================================================
// AUTO LAYOUT
// ============================================================

export function autoLayoutNodes(): void {
    const D = (window as any).D;
    const nodes = D.mindmap.nodes;
    if (!nodes.length) return;

    const container = $('mindmap-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Simple circular layout for now
    const centerX = width / 2 / mindmapZoom - mindmapPan.x / mindmapZoom;
    const centerY = height / 2 / mindmapZoom - mindmapPan.y / mindmapZoom;
    const radius = Math.min(width, height) * 0.35 / mindmapZoom;

    nodes.forEach((node: MindmapNode, i: number) => {
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

export function filterMindmapNodes(): void {
    const D = (window as any).D;
    const searchInput = $('mindmap-search') as HTMLInputElement | null;
    const typeFilterInput = $('mindmap-type-filter') as HTMLSelectElement | null;

    mindmapFilter = (searchInput?.value || '').toLowerCase();
    mindmapTypeFilter = typeFilterInput?.value || '';
    renderMindmap();

    // Update counter
    const count = D.mindmap?.nodes?.length || 0;
    const countEl = $('network-io-count');
    if (countEl) countEl.textContent = String(count);
}

// ============================================================
// IMPORT
// ============================================================

export function showImportNodesModal(): void {
    showModal('import-nodes-modal');
    populateImportNodesList();
}

export function populateImportNodesList(): void {
    const D = (window as any).D;
    const sourceInput = $('import-nodes-source') as HTMLSelectElement | null;
    const listEl = $('import-nodes-list');
    if (!listEl) return;

    const source = sourceInput?.value || 'characters';

    let items: any[] = [];
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
    const existingNames = new Set((D.mindmap?.nodes || []).map((n: MindmapNode) => n.name.toLowerCase()));

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

export function importSelectedNodes(): void {
    const D = (window as any).D;
    const nextId = (window as any).nextId;
    const checkboxes = document.querySelectorAll('#import-nodes-list input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;

    if (!checkboxes.length) {
        showToast('⚠️ Keine Einträge ausgewählt', 'warning');
        return;
    }

    const container = $('mindmap-container');
    if (!container) return;

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

export function importAllNodes(): void {
    const checkboxes = document.querySelectorAll('#import-nodes-list input[type="checkbox"]:not(:disabled)') as NodeListOf<HTMLInputElement>;

    checkboxes.forEach(cb => cb.checked = true);
    importSelectedNodes();
}

// ============================================================
// EXPORT
// ============================================================

export function exportMindmapImage(): void {
    showToast('🖼️ Export als PNG (In Entwicklung)');
    // TODO: Implement html2canvas or similar
}

// ============================================================
// INITIALIZATION
// ============================================================

export function initMindmapPan(): void {
    const container = $('mindmap-container');
    if (!container) return;

    container.addEventListener('mousedown', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target === container || target.id === 'mindmap-viewport' || target.tagName === 'svg') {
            isPanning = true;
            panStart = { x: e.clientX - mindmapPan.x, y: e.clientY - mindmapPan.y };
            container.style.cursor = 'grabbing';
        }
    });

    container.addEventListener('mousemove', (e: MouseEvent) => {
        if (!isPanning) return;
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
    container.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        zoomMindmap(delta);
    }, { passive: false });
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).renderMindmap = renderMindmap;
(window as any).showAddNodeModal = showAddNodeModal;
(window as any).editNode = editNode;
(window as any).saveNodeFromModal = saveNodeFromModal;
(window as any).selectNodeType = selectNodeType;
(window as any).deleteSelectedNode = deleteSelectedNode;
(window as any).editSelectedNode = editSelectedNode;
(window as any).deleteNodeById = deleteNodeById;
(window as any).startConnectMode = startConnectMode;
(window as any).cancelConnectMode = cancelConnectMode;
(window as any).showConnectionModal = showConnectionModal;
(window as any).selectConnType = selectConnType;
(window as any).confirmConnection = confirmConnection;
(window as any).zoomMindmap = zoomMindmap;
(window as any).resetZoom = resetZoom;
(window as any).centerView = centerView;
(window as any).autoLayoutNodes = autoLayoutNodes;
(window as any).filterMindmapNodes = filterMindmapNodes;
(window as any).showImportNodesModal = showImportNodesModal;
(window as any).populateImportNodesList = populateImportNodesList;
(window as any).importSelectedNodes = importSelectedNodes;
(window as any).importAllNodes = importAllNodes;
(window as any).exportMindmapImage = exportMindmapImage;
(window as any).initMindmapPan = initMindmapPan;
