interface UndoState {
    action: string;
    state: string;
    timestamp: number;
}
declare const undoStack: UndoState[];
declare const redoStack: UndoState[];
declare const UNDO_LIMIT: any;
declare function pushUndo(action: string): void;
declare function saveUndoState(action?: string): void;
declare function undo(): void;
declare function redo(): void;
declare function clearUndoHistory(): void;
declare let lastSaveTime: number;
declare const saveIndicatorTimeout: ReturnType<typeof setTimeout> | null;
type SaveStatus = 'saved' | 'saving' | 'error';
declare function updateSaveIndicator(status?: SaveStatus): void;
declare let broadcastChannel: BroadcastChannel | null;
declare const tabId: string;
declare let conflictDismissed: boolean;
interface BroadcastMessage {
    type: string;
    tabId: string;
    campaign: string;
    timestamp: number;
}
declare function initConflictDetection(): void;
declare function broadcastSave(): void;
declare function showConflictBanner(): void;
declare function dismissConflict(): void;
declare function reloadData(): void;
declare function getCurrentStorageKey(): string;
declare function showShortcutsOverlay(): void;
declare function hideShortcutsOverlay(): void;
declare function renderConditionBadges(conditions?: string[], exhaustion?: number, small?: boolean): string;
interface RelationshipSource {
    type: string;
    id: number;
}
declare let currentRelationshipSource: RelationshipSource | null;
declare function showRelationshipsModal(type: string, id: number): void;
declare function saveRelationship(): void;
declare function removeRelationship(sourceType: string, sourceId: number, targetType: string, targetId: number): void;
declare function renderRelationshipBadges(relationships: any[] | undefined, sourceType: string, sourceId: number): string;
declare function parseMarkdown(text: string): string;
declare function showNotesSearch(): void;
declare function searchNotes(): void;
declare function highlightExcerpt(text: string, query: string, maxLength?: number): string;
declare function goToNote(date: string): void;
declare let encounterRound: number;
declare function nextEncounterRound(): void;
declare function resetEncounter(): void;
declare function updateEncounterDisplay(): void;
//# sourceMappingURL=undo.d.ts.map