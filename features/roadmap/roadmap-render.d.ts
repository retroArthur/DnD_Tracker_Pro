declare function renderRoadmapConnections(): void;
declare function updateSVGViewBox(): void;
declare function renderConnection(svg: Element, fromEvent: any, toEvent: any, conn: any): void;
declare function getPinCoordinates(event: any, pinPosition: string, tileWidth: number, tileHeight: number): {
    x: number;
    y: number;
};
declare function setupRoadmapSVGMarkers(): void;
declare function renderRoadmapEvents(): void;
declare function cleanupEventTiles(): void;
declare function createEventTile(event: any): HTMLDivElement;
declare function renderLinkedEntities(event: any): string;
declare function renderRoadmapToolbar(): void;
declare function renderRoadmapControls(): void;
declare function initRoadmapRendering(): void;
//# sourceMappingURL=roadmap-render.d.ts.map