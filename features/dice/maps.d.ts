interface Coordinates {
    x: number;
    y: number;
}
interface MapMarker {
    id: number;
    name: string;
    type: string;
    shape: string;
    note: string;
    x: number;
    y: number;
    createdAt?: string;
    linkedLocation?: number;
    linkedNpc?: number;
    linkedQuest?: number;
    linkedEncounter?: number;
}
interface MapConnection {
    id: number;
    from: number;
    to: number;
    type: string;
    label: string;
}
interface CalibrationReference {
    pixels: number;
    meters: number;
    originalInput: string;
}
interface MapCalibration {
    pixelsPerMeter: number;
    reference?: CalibrationReference;
}
interface FogRevealedArea {
    x: number;
    y: number;
    radius: number;
}
interface GameMap {
    id: number;
    name: string;
    image: string | null;
    markers: MapMarker[];
    zoom?: number;
    panX?: number;
    panY?: number;
    calibration?: MapCalibration;
    fogRevealed?: FogRevealedArea[];
    connections?: MapConnection[];
}
interface PendingMarker {
    name: string;
    type: string;
    shape: string;
    note: string;
    x?: number;
    y?: number;
}
interface DraggedMarker {
    id: number;
    element: HTMLElement | null;
    newX?: number;
    newY?: number;
}
interface LayerVisibility {
    party: boolean;
    poi: boolean;
    danger: boolean;
    quest: boolean;
    buildings: boolean;
    secret: boolean;
}
interface ParsedDistance {
    meters: number;
}
declare let mapZoom: number;
declare let currentMapId: number | null;
declare let markerPlacementMode: boolean;
declare let pendingMarker: PendingMarker | null;
declare let draggedMarker: DraggedMarker | null;
declare let mapIsPanning: boolean;
declare let mapPanStart: Coordinates;
declare let mapPanOffset: Coordinates;
declare let currentMapTool: string;
declare const mapLayerVisibility: LayerVisibility;
declare let showMapGrid: boolean;
declare let showMapFog: boolean;
declare let showMapConnections: boolean;
declare let measureStart: Coordinates | null;
declare let measureEnd: Coordinates | null;
declare let __isMeasuring: boolean;
declare let calibrationPoint1: Coordinates | null;
declare let calibrationPoint2: Coordinates | null;
declare let __isCalibrating: boolean;
declare let fogCanvas: HTMLCanvasElement | null;
declare let fogCtx: CanvasRenderingContext2D | null;
declare const fogBrushSize: number;
declare let connectionStart: number | null;
declare const contextMenuPos: Coordinates;
declare let __lastMeasureText: string;
declare const LAYER_TO_TYPES: {
    [key: string]: string[];
};
declare function getMapCoordinates(event: MouseEvent, rect: DOMRect): Coordinates;
declare function getMaps(): GameMap[];
declare function getCurrentMap(): GameMap | undefined;
declare function addNewMap(): void;
declare function renameCurrentMap(): void;
declare function deleteCurrentMap(): void;
declare function switchMap(mapId: number): void;
declare function renderMapTabs(): void;
declare function uploadMapToCurrentTab(event: Event): void;
declare function displayMap(): void;
declare function zoomMap(factor: number): void;
declare function resetMapZoom(): void;
declare function updateMapTransform(): void;
declare function initMapPanning(): void;
declare function startMarkerPlacement(): void;
declare function saveMarker(): void;
declare function editMarker(id: number): void;
declare function clearMarkerForm(): void;
declare function deleteMarkerFromModal(): void;
declare function handleMapClick(event: MouseEvent): void;
declare function renderMapMarkers(): void;
declare function startMarkerDrag(markerId: number, event: MouseEvent): void;
declare function handleMarkerDrag(event: MouseEvent): void;
declare function endMarkerDrag(_event: MouseEvent): void;
declare function deleteMarker(id: number): void;
declare function clearAllMarkers(): void;
declare function setMapTool(tool: string): void;
declare function initMapKeyboardShortcuts(): void;
declare function initMapContextMenu(): void;
declare function closeMapContextMenu(): void;
declare function handleQuickPin(type: string): void;
declare function createQuickPinAt(x: number, y: number): void;
declare function toggleMapLayer(layer: string, visible: boolean): void;
declare function getMarkerLayer(type: string): string;
declare function toggleMapGrid(): void;
declare function updateMapGrid(): void;
declare function toggleMapFog(): void;
declare function toggleMapConnections(): void;
declare function initMapMeasure(): void;
declare function handleMapToolClick(e: MouseEvent): void;
declare function handleMeasureClick(x: number, y: number, imgRect: DOMRect): void;
declare function drawMeasureLine(): void;
declare function clearMeasureLine(): void;
declare function showMeasureResult(imgRect: DOMRect): void;
declare function initCursorTooltip(): void;
declare function handleCalibrationClick(x: number, y: number, imgRect: DOMRect): void;
declare function drawCalibrationLine(): void;
declare function promptCalibrationDistance(pixelDist: number): void;
declare function parseDistanceInput(input: string): ParsedDistance | null;
declare function initMapFog(): void;
declare function resizeFogCanvas(): void;
declare function loadFogFromMap(): void;
declare function handleFogClick(x: number, y: number, reveal: boolean): void;
declare function initMapConnections(): void;
declare function handleConnectionClick(markerId: number): void;
declare function createConnection(fromId: number, toId: number): void;
declare function renderMapConnections(): void;
declare function renderMapMarkersList(): void;
declare function filterMapMarkers(query: string): void;
declare function focusMarker(id: number): void;
declare function initExtendedMapFeatures(): void;
declare function _updateCalibrationStatus(): void;
//# sourceMappingURL=maps.d.ts.map