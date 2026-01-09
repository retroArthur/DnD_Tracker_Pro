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
declare let connectMode: boolean;
declare let connectFrom: number | null;
declare let mindmapZoom: number;
declare let mindmapPan: Point;
declare let isPanning: boolean;
declare let panStart: Point;
declare let dragNode: MindmapNode | null;
declare let dragOffset: Point;
declare let selectedNode: number | null;
declare const NODE_ICONS: Readonly<Record<string, string>>;
declare const NODE_LABELS: Readonly<Record<string, string>>;
declare const CONN_COLORS: Readonly<Record<string, string>>;
declare let mindmapFilter: string;
declare let mindmapTypeFilter: string;
declare function renderMindmap(): void;
declare function handleNodeClick(nodeId: number): void;
declare function startConnectFromConnector(nodeId: number): void;
declare function showAddNodeModal(): void;
declare function saveNodeFromModal(): void;
declare function selectNodeType(type: string): void;
declare function deleteSelectedNode(): void;
declare function editSelectedNode(): void;
declare function startConnectMode(): void;
declare function cancelConnectMode(): void;
declare function showConnectionModal(from: number, to: number): void;
declare function selectConnType(type: string): void;
declare function confirmConnection(): void;
declare function startNodeDrag(e: MouseEvent, nodeId: number): void;
declare function onNodeDrag(e: MouseEvent): void;
declare function stopNodeDrag(): void;
declare function zoomMindmap(delta: number): void;
declare function resetZoom(): void;
declare function updateMindmapZoomDisplay(): void;
declare function centerView(): void;
declare function autoLayoutNodes(): void;
declare function showImportNodesModal(): void;
declare function populateImportNodesList(): void;
declare function importSelectedNodes(): void;
declare function importAllNodes(): void;
declare function exportMindmapImage(): void;
declare function initMindmapPan(): void;
//# sourceMappingURL=mindmap.d.ts.map