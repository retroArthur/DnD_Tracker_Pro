/**
 * D&D Tracker - Global Function Declarations
 * Diese Datei deklariert alle globalen Funktionen für TypeScript-Kompatibilität
 */


// Only import types that are actually used in the declarations below
import type {
  EntityId,
  EntityType,
  Combatant,
  Tag
} from './entities';

declare global {
  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================
  
  /** Shorthand for document.getElementById */
  function $(id: string): HTMLElement | null;
  
  /** Escape HTML entities */
  function esc(str: string): string;
  
  /** Sanitize HTML content */
  function sanitizeHTML(html: string): string;
  
  /** Get next ID for entity type */
  function nextId(type: string): EntityId;
  
  /** Debounce function */
  function debounce<T extends (...args: any[]) => any>(
    fn: T, 
    delay: number
  ): (...args: Parameters<T>) => void;
  
  /** Throttle function */
  function throttle<T extends (...args: any[]) => any>(
    fn: T, 
    limit: number
  ): (...args: Parameters<T>) => void;
  
  /** Format date */
  function formatDate(date: Date | string): string;
  
  /** Parse dice notation */
  function parseDiceNotation(notation: string): { count: number; sides: number; modifier: number } | null;
  
  /** Log message (respects debug mode) */
  function log(...args: any[]): void;
  
  // ============================================================
  // STORAGE FUNCTIONS
  // ============================================================
  
  /** Save data to localStorage */
  function save(): void;
  
  /** Load data from localStorage */
  function load(): void;
  
  /** Push undo state */
  function pushUndo(description?: string): void;
  
  /** Undo last action */
  function undo(): void;
  
  /** Redo last undone action */
  function redo(): void;
  
  /** Create backup */
  function createBackup(): void;
  
  /** Restore backup */
  function restoreBackup(id: EntityId): void;
  
  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================
  
  /** Render all views */
  function renderAll(): void;
  
  /** Render dashboard */
  function renderDashboard(): void;
  
  /** Render party/characters */
  function renderParty(): void;
  
  /** Render NPCs */
  function renderNPCList(): void;
  
  /** Render locations */
  function renderLocations(): void;
  
  /** Render quests */
  function renderQuests(): void;
  
  /** Render encounters */
  function renderEncounters(): void;
  
  /** Render loot */
  function renderLoot(): void;
  
  /** Render spells */
  function renderSpells(): void;
  
  /** Render wiki */
  function renderWiki(): void;
  
  /** Render links */
  function renderLinks(): void;
  
  /** Render shops */
  function renderShops(): void;
  
  /** Render initiative tracker */
  function renderInit(): void;
  
  /** Render mindmap */
  function renderMindmap(): void;
  
  /** Render sessions */
  function renderSessions(): void;
  
  // ============================================================
  // UI FUNCTIONS
  // ============================================================
  
  /** Show modal */
  function showModal(id: string): void;
  
  /** Hide modal */
  function hideModal(id: string): void;
  
  /** Show toast notification */
  function showToast(message: string, type?: 'success' | 'error' | 'warning' | 'info'): void;
  
  /** Switch view */
  function switchView(viewId: string): void;
  
  /** Set theme */
  function setTheme(theme: string): void;
  
  /** Toggle layout */
  function toggleLayout(): void;
  
  // ============================================================
  // CHARACTER FUNCTIONS
  // ============================================================
  
  /** Edit character */
  function editChar(id: EntityId): void;
  
  /** Delete character */
  function deleteChar(id: EntityId): void;
  
  /** Save character from form */
  function saveCharacter(): void;
  
  /** Show character details */
  function showCharacterDetails(id: EntityId): void;
  
  /** Update character HP */
  function updateCharacterHP(id: EntityId, delta: number): void;
  
  /** Get proficiency bonus for level */
  function getProficiencyBonus(level: number): number;
  
  /** Get modifier from ability score */
  function getModifier(score: number): number;
  
  // ============================================================
  // NPC FUNCTIONS
  // ============================================================
  
  /** Edit NPC */
  function editNPC(id: EntityId): void;
  
  /** Delete NPC */
  function deleteNPC(id: EntityId): void;
  
  /** Save NPC from form */
  function saveNPC(): void;
  
  /** Toggle NPC card expansion */
  function toggleNPCCard(id: EntityId): void;
  
  /** Toggle NPC trigger */
  function toggleNPCTrigger(id: EntityId, triggerIndex: number): void;
  
  /** Toggle NPC dialog used state */
  function toggleNPCDialogUsed(id: EntityId, dialogIndex: number): void;
  
  // ============================================================
  // LOCATION FUNCTIONS
  // ============================================================
  
  /** Edit location */
  function editLocation(id: EntityId): void;
  
  /** Delete location */
  function deleteLocation(id: EntityId): void;
  
  /** Save location from form */
  function saveLocation(): void;
  
  /** Toggle location expansion */
  function toggleLocation(id: EntityId): void;
  
  // ============================================================
  // QUEST FUNCTIONS
  // ============================================================
  
  /** Edit quest */
  function editQuest(id: EntityId): void;
  
  /** Delete quest */
  function deleteQuest(id: EntityId): void;
  
  /** Save quest from form */
  function saveQuest(): void;
  
  /** Toggle quest status */
  function toggleQuestStatus(id: EntityId, status?: string): void;
  
  /** Toggle quest tracked state */
  function toggleQuestTracked(id: EntityId): void;
  
  // ============================================================
  // ENCOUNTER FUNCTIONS
  // ============================================================
  
  /** Edit encounter */
  function editEnc(id: EntityId): void;
  
  /** Delete encounter */
  function deleteEnc(id: EntityId): void;
  
  /** Save encounter from form */
  function saveEncounter(): void;
  
  /** Add encounter to initiative */
  function addEncToInit(id: EntityId): void;
  
  /** Load monster template */
  function loadMonsterTemplate(key: string): void;
  
  // ============================================================
  // LOOT FUNCTIONS
  // ============================================================
  
  /** Edit loot item */
  function editLoot(id: EntityId): void;
  
  /** Remove loot item */
  function removeLoot(id: EntityId): void;
  
  /** Save loot item from form */
  function saveLoot(): void;

  // ============================================================
  // SPELL FUNCTIONS
  // ============================================================
  
  /** Edit spell */
  function editSpell(id: EntityId): void;
  
  /** Delete spell */
  function deleteSpell(id: EntityId): void;
  
  /** Save spell from form */
  function saveSpell(): void;
  
  /** Load SRD spells */
  function loadSRDSpells(): void;
  
  /** Toggle spell slot */
  function toggleSpellSlot(charId: EntityId, level: number): void;
  
  /** Restore all spell slots */
  function restoreAllSpellSlots(charId: EntityId): void;
  
  // ============================================================
  // INITIATIVE FUNCTIONS
  // ============================================================
  
  /** Add combatant to initiative */
  function addToInit(combatant: Partial<Combatant>): void;
  
  /** Remove combatant from initiative */
  function removeCombatant(id: EntityId): void;
  
  /** Next turn */
  function nextTurn(): void;
  
  /** Previous turn */
  function prevTurn(): void;
  
  /** Sort initiative */
  function sortInit(): void;
  
  /** Roll all initiative */
  function rollAllInitiative(): void;
  
  /** Clear initiative */
  function clearInit(): void;
  
  // ============================================================
  // DICE FUNCTIONS
  // ============================================================
  
  /** Roll dice with animation */
  function rollDiceAnimated(sides: number): void;
  
  /** Roll dice (simple) */
  function rollDice(sides: number): number;
  
  /** Roll custom dice notation */
  function rollCustomDice(): void;
  
  /** Display dice result */
  function displayDiceResult(
    result: number, 
    notation: string, 
    rolls: number[], 
    isCrit?: boolean, 
    isFail?: boolean
  ): void;
  
  // ============================================================
  // TIMER FUNCTIONS
  // ============================================================
  
  /** Add timer */
  function addTimer(name: string, duration: number): void;
  
  /** Remove timer */
  function removeTimer(id: EntityId): void;
  
  /** Add preset timer */
  function addPresetTimer(name: string, duration: number): void;
  
  // ============================================================
  // WIKI FUNCTIONS
  // ============================================================
  
  /** Edit wiki entry */
  function editWikiEntry(id: EntityId): void;
  
  /** Delete wiki entry */
  function deleteWikiEntry(id: EntityId): void;
  
  /** Save wiki entry from form */
  function saveWikiEntry(): void;
  
  /** Toggle wiki entry expansion */
  function toggleWikiEntry(id: EntityId): void;
  
  /** Toggle wiki pin */
  function toggleWikiPin(id: EntityId): void;
  
  // ============================================================
  // SHOP FUNCTIONS
  // ============================================================
  
  /** Edit shop */
  function editShop(id: EntityId): void;
  
  /** Delete shop */
  function deleteShop(id: EntityId): void;
  
  /** Toggle shop expansion */
  function toggleShop(id: EntityId): void;
  
  /** Add item to cart */
  function addToCart(shopId: EntityId, itemIndex: number, quantity?: number): void;
  
  /** Remove from cart */
  function removeFromCart(id: EntityId): void;
  
  // ============================================================
  // MINDMAP FUNCTIONS
  // ============================================================
  
  /** Add mindmap node */
  function addNode(type: string, entityId?: EntityId): void;
  
  /** Delete mindmap node */
  function deleteNodeById(id: EntityId): void;
  
  /** Edit mindmap node */
  function editNode(id: EntityId): void;
  
  /** Connect mindmap nodes */
  function connectNodes(fromId: EntityId, toId: EntityId): void;
  
  /** Filter mindmap nodes */
  function filterMindmapNodes(query?: string): void;
  
  // ============================================================
  // SEARCH FUNCTIONS
  // ============================================================
  
  /** Perform global search */
  function performGlobalSearch(): void;
  
  /** Navigate to search result */
  function navigateToResult(type: EntityType, id: EntityId, locId?: EntityId | null): void;
  
  /** Clear search */
  function clearSearch(inputId: string, renderFn: () => void): void;
  
  // ============================================================
  // TAG FUNCTIONS
  // ============================================================
  
  /** Show tags modal */
  function showTagsModal(type: EntityType, id: EntityId): void;
  
  /** Add tag to entity */
  function addTagToEntity(type: EntityType, id: EntityId, tag: Tag): void;
  
  /** Remove tag from entity */
  function removeTagFromEntity(type: EntityType, id: EntityId, tagIndex: number): void;
  
  /** Show entities with tag */
  function showEntitiesWithTag(tagName: string): void;
  
  // ============================================================
  // CAMPAIGN FUNCTIONS
  // ============================================================
  
  /** Create campaign */
  function createCampaign(): void;
  
  /** Switch campaign */
  function switchCampaign(key: string): void;
  
  /** Get campaign index */
  function getCampaignIndex(): Record<string, { name: string; lastModified: string }>;
  
  // ============================================================
  // EXPORT/IMPORT FUNCTIONS
  // ============================================================
  
  /** Export data as JSON */
  function exportData(type?: string): void;
  
  /** Export data as CSV */
  function exportDataCSV(type: string): void;
  
  /** Import data */
  function importData(file: File): void;
  
  /** Execute import */
  function executeImport(type: string): void;
  
  // ============================================================
  // ERROR HANDLER
  // ============================================================
  
  var ErrorHandler: {
    log(source: string, error: Error | unknown, context?: string): void;
    clearLog(): void;
    getLog(): Array<{ timestamp: string; source: string; message: string; context?: string }>;
  };
  
  // ============================================================
  // EVENT DELEGATION
  // ============================================================
  
  var EventDelegation: {
    init(): void;
    registerAction(name: string, handler: (params: {
      id: EntityId | null;
      type: string | null;
      value: string | null;
      target: HTMLElement;
      event: Event;
    }) => void): void;
  };
}

export {};
