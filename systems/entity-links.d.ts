interface EntityLink {
    type: string;
    id: number;
}
type EntityType = 'npcs' | 'locations' | 'quests' | 'characters' | 'encounters' | 'spells' | 'loot' | 'wiki';
declare let insertEntityLinkTargetEditor: string | null;
declare function showEntityLinksModal(type: string, id: number): void;
declare function parseEntityLinks(content: string): string;
declare function showInsertEntityLinkModal(editorId: string): void;
declare function renderInsertLinkTargets(): void;
declare function insertEntityLinkToEditor(): void;
declare function renderLinkTargets(): void;
declare function renderCurrentLinks(): void;
declare function addEntityLink(): void;
declare function removeEntityLink(index: number): void;
declare function renderEntityLinks(links: EntityLink[]): string;
declare function navigateToEntity(type: string, id: number): void;
declare function navigateToEntityInPlace(type: string, id: number): void;
declare function showEntityPreviewModal(type: string, id: number, entity: any): void;
declare function highlightEntity(type: string, id: number): void;
//# sourceMappingURL=entity-links.d.ts.map