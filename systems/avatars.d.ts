declare function showAvatarModal(type: string, id: number): void;
declare function previewAvatar(): void;
declare function saveAvatar(): void;
declare function removeAvatar(): void;
declare function getEntityByTypeAndId(type: string, id: number): any | null;
interface EntityLink {
    name: string;
    view: string;
    type: string;
    id: number;
}
declare function getEntityLink(type: string, id: number): EntityLink | null;
declare function initOfflineMode(): void;
declare function initTouchOptimizations(): void;
//# sourceMappingURL=avatars.d.ts.map