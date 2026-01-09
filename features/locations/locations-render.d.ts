declare let selectedLocationId: number | null;
declare const LOC_ICONS: Record<string, string>;
declare function getLocationIcon(loc: any): string;
declare function renderLocationItem(loc: any, stripHtml: (html: string) => string): string;
declare function selectLocation(id: number | string, scroll?: boolean): void;
declare function showLocationDetail(id: number | string): void;
declare function clearLocationDetail(): void;
declare function setLocFilter(f: any): void;
declare function toggleLocation(id: number | string): void;
declare function renderFilterList(): void;
//# sourceMappingURL=locations-render.d.ts.map