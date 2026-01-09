declare let selectedNpcId: number | null;
declare let currentNpcFilter: number | string;
declare let currentRelationStatus: string;
declare const NPC_ICONS: Record<string, string>;
interface RelationStatusDef {
    label: string;
    icon: string;
    color: string;
}
declare const RELATION_STATUS: Record<string, RelationStatusDef>;
/**
 * Gets the appropriate icon for an NPC based on race
 */
declare function getNPCIcon(npc: any): string;
declare function renderNPCItem(npc: any): string;
declare function selectNPC(id: number | string, scroll?: boolean): void;
/**
 * Shows the detail view of an NPC in the right panel
 */
declare function showNPCDetail(id: number | string): void;
declare function clearNPCDetail(): void;
declare function setNpcFilter(f: any): void;
declare function toggleNPC(id: number | string): void;
declare function renderNPCTags(n: any): {
    questTags: string;
    relationTags: string;
    infoTags: string;
};
declare function updateNPCStats(): void;
declare function expandAllNPCCards(): void;
declare function collapseAllNPCCards(): void;
declare function expandAllNPCDialogs(): void;
declare function collapseAllNPCDialogs(): void;
declare function renderNPCRelations(npc: any): string;
declare function showRelationsModal(npcId: number | string): void;
declare function setRelationStatus(status: string): void;
declare function addRelation(npcId: number | string): void;
declare function removeRelation(npcId: number | string, index: number | string): void;
declare function cycleRelationStatus(npcId: number | string, index: number | string): void;
//# sourceMappingURL=npc-render.d.ts.map