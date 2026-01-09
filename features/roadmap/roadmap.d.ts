declare let roadmapZoom: number;
declare let roadmapPan: {
    x: number;
    y: number;
};
declare let roadmapIsPanning: boolean;
declare let roadmapPanStart: {
    x: number;
    y: number;
};
declare let roadmapDraggedEvent: any;
declare let roadmapDragOffset: {
    x: number;
    y: number;
};
declare let roadmapConnectionMode: boolean;
declare let roadmapConnectionStart: any;
declare function initRoadmap(): void;
declare function setupRoadmapEventListeners(): void;
declare function applyRoadmapTransform(): void;
declare function renderRoadmap(): void;
declare function saveRoadmapUIState(): void;
declare function roadmapZoomIn(): void;
declare function roadmapZoomOut(): void;
declare function zoomToCenter(factor: number): void;
declare function roadmapResetView(): void;
declare function startEventDrag(eventId: number, e: MouseEvent): void;
declare function startConnectionMode(): void;
declare function cancelConnectionMode(): void;
declare function handleEventClickForConnection(eventId: number): void;
declare function handlePinClickForConnection(eventId: number, pinPosition: string): void;
declare function getEventTypeIcon(type: string): string;
declare function getEventTypeColor(type: string): string;
declare function getConnectionTypeColor(type: string): string;
declare function onRoadmapViewShow(): void;
declare function onRoadmapViewHide(): void;
//# sourceMappingURL=roadmap.d.ts.map