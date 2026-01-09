declare function createRoadmapEvent(type?: string): number;
declare function updateRoadmapEvent(id: number, updates: any): void;
declare function deleteRoadmapEvent(id: number): void;
declare function toggleRoadmapEventCompletion(id: number): void;
declare function createRoadmapConnection(fromId: number, toId: number, type?: string, fromPin?: string, toPin?: string, style?: string, color?: string): number | undefined;
declare function updateRoadmapConnection(id: number, updates: any): void;
declare function deleteRoadmapConnection(id: number): void;
declare function clearRoadmap(): void;
declare function autoLayoutRoadmap(): void;
declare function exportRoadmap(): void;
declare function validateRoadmapImport(data: any): {
    events: any[];
    connections: any[];
};
declare function importRoadmap(file: File): void;
//# sourceMappingURL=roadmap-crud.d.ts.map