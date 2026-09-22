/**
 * D&D Tracker - Global Function Declarations
 * Diese Datei deklariert alle globalen Funktionen für TypeScript-Kompatibilität
 */

import type { 
  EntityId, 
  EntityType, 
  Character, 
  NPC, 
  Location, 
  Quest, 
  Encounter, 
  LootItem, 
  Spell,
  WikiEntry,
  Shop,
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
  
  /** Auto-Backup der aktiven Kampagne wiederherstellen (ID = Zeitstempel, Code-Review 2026-09-21, U4) */
  function restoreBackup(backupId: number): Promise<void>;

  // ============================================================
  // AUTO-BACKUP-LISTE & WIEDERHERSTELLUNG (Code-Review 2026-09-21, U4/R01/R05)
  // ============================================================

  /** Auto-Backup-Datensatz (localStorage-Liste oder IndexedDB-Store 'backups') */
  interface AutoBackupRecord {
    timestamp: number;
    campaignKey: string;
    data: string;
    id?: string;
    /** 'safety' = Sicherheitskopie vor destruktiver Aktion (U5); fehlt bei Alt-Zeilen = 'auto' */
    kind?: 'auto' | 'safety';
  }

  /** Gehoert das Backup zur Kampagne key (nicht-leerer, exakt gleicher campaignKey)? */
  function isBackupOfCampaign(b: unknown, key: string): boolean;

  /** Formpruefung: sichere positive Ganzzahl als timestamp, String-data, String-campaignKey */
  function isValidBackupRecord(b: unknown): b is AutoBackupRecord;

  /** Formgepruefte localStorage-Backup-Liste (alle Kampagnen) */
  function readLocalBackups(): AutoBackupRecord[];

  /** IndexedDB-Backups einer Kampagne (lehnt bei Fehlern ab) */
  function readIndexedDbBackups(key: string): Promise<AutoBackupRecord[]>;

  /** Entdoppeln nach Zeitstempel, neueste zuerst, auf MAX_BACKUPS begrenzen */
  function sortAndLimitBackups(list: AutoBackupRecord[]): AutoBackupRecord[];

  /** Backups der aktiven Kampagne aus beiden Quellen ([] ohne aktiven Schluessel) */
  function getBackups(): Promise<AutoBackupRecord[]>;

  /** Backup-ID (Zeitstempel) gegen eine Liste aufloesen — rein */
  function findBackupForRestore(
    backups: AutoBackupRecord[],
    backupId: number | string,
    key: string
  ): { status: 'ok' | 'missing' | 'foreign'; backup: AutoBackupRecord | null };

  /** Referenzierte Soundboard-Blobs wiederbeleben; liefert die Anzahl fehlender Dateien */
  function reviveReferencedSoundBlobs(data: Record<string, any>): Promise<number>;

  /** Gemeinsamer Restore-Schluss (Undo, ersetzen, speichern); true nach bestaetigtem Save */
  function applyRestoredCampaign(data: Record<string, any>, source: string): Promise<boolean>;

  /** Backup-Modal der aktiven Kampagne anzeigen */
  function showBackupsModal(): Promise<void>;

  /** Anzeigename einer Kampagne ('Standard-Kampagne', Indexname oder der Schluessel) */
  function getCampaignDisplayName(key: string): string;

  // ============================================================
  // AUTO-BACKUP-SCHREIBSEITE (Code-Review 2026-09-21, U5/R10/R05)
  // ============================================================

  /** Ergebnis von createAutoBackup() */
  type AutoBackupStatus = 'written' | 'unchanged' | 'skipped-empty' | 'failed';

  /**
   * Auto-Backup der aktiven Kampagne (gemeinsame Inhaltsregel hasCampaignContent()).
   * Erfasst D SYNCHRON beim Aufruf; reason 'safety' schuetzt die Kopie vor der Rotation.
   */
  function createAutoBackup(options?: { reason?: 'safety' | 'auto' }): Promise<AutoBackupStatus>;

  /** IndexedDB-Backup nach bestaetigtem Commit; vergleicht nur mit der neuesten Zeile */
  function saveBackupToIndexedDB(backup: AutoBackupRecord): Promise<'written' | 'unchanged'>;

  /** Meldet das echte Ergebnis einer Sicherheitskopie per Toast; wirft nie */
  function reportSafetyBackup(
    statusOrPromise: AutoBackupStatus | Promise<AutoBackupStatus>
  ): Promise<AutoBackupStatus>;

  /** Entfernt alle Auto-Backups einer Kampagne aus beiden Quellen (D2 = A); wirft nie */
  function purgeCampaignBackups(key: string): Promise<{ success: boolean; error?: unknown }>;

  // ============================================================
  // KAMPAGNEN-IMPORT & ATOMARE KAMPAGNENANLAGE (Code-Review 2026-09-21, U6/R03/R07)
  // ============================================================

  /** Eintrag im Kampagnenindex */
  interface CampaignIndexEntry {
    key: string;
    name: string;
    created?: string;
  }

  /** Kampagnenindex (localStorage, APP_CONFIG.CAMPAIGN_INDEX_KEY) */
  interface CampaignIndex {
    campaigns: CampaignIndexEntry[];
    active: string;
  }

  /** Ergebnis von writeCampaignData() — wirft nie */
  interface WriteCampaignDataResult {
    success: boolean;
    backend: 'localStorage' | 'indexedDB' | null;
    error: string | null;
  }

  /** Ergebnis von addCampaignWithData() — wirft nie */
  type AddCampaignResult =
    | { success: true; key: string; backend: 'localStorage' | 'indexedDB' }
    | { success: false; stage: 'index' | 'data' | 'unexpected'; key?: string; error: unknown };

  /** Vorbereitete Kampagnendatei (beide Import-Zweige) */
  interface PreparedCampaignImport {
    data: Record<string, any>;
    renumbered: EntityIdChange[];
    keepFromCurrent: string[];
  }

  /** Kampagnendaten nach den Regeln von save() schreiben, ohne UI-Nebenwirkungen */
  function writeCampaignData(key: string, data: object | string): Promise<WriteCampaignDataResult>;

  /** Kampagnenindex streng lesen: ein unlesbarer Index wird nie ueberschrieben */
  function readCampaignIndexStrict():
    | { ok: true; index: CampaignIndex }
    | { ok: false; error: string };

  /** Kampagne atomar anlegen: Daten vor EINEM Indexwrite, Rueckbau bei jedem Fehlschlag */
  function addCampaignWithData(
    name: string,
    data: object | string,
    options?: { activate?: boolean }
  ): Promise<AddCampaignResult>;

  /** Kampagnendatei pruefen, bereinigen und normalisieren — wirft mit deutscher Begruendung */
  function prepareCampaignImport(imp: unknown): PreparedCampaignImport;

  /** Alt-Charakterfelder einer Importkopie ergaenzen (in place) */
  function migrateImportedCharacters(copy: Record<string, any>): void;

  /** Kampagnen-Import ueber #import-file (zwei Dialoge, D3 = A) */
  function importDataGlobal(): void;

  // ============================================================
  // KAMPAGNEN-DATEN & ID-INVARIANTE (Code-Review 2026-09-21, U2)
  // ============================================================

  /** Ergebnis von normalizeEntityIds(): eine Aenderung je neu vergebener ID */
  interface EntityIdChange {
    type: string;
    from: unknown;
    to: number;
  }

  /** Ergebnis von normalizeCampaignData() */
  type CampaignNormalizeResult =
    | { ok: true; data: Record<string, any>; repairs: string[]; renumbered: EntityIdChange[] }
    | { ok: false; error: string };

  /** Einfaches Datenobjekt (kein Array, kein null), realm-unabhaengig */
  function isPlainDataObject(v: unknown): v is Record<string, any>;

  /** ID-Sammlung eines nextId()-Typs (verschachtelte Pfade laut ID_COUNTER_PATHS) */
  function getIdCollection(data: Record<string, any>, type: string): any[] | undefined;

  /** Gueltige Entitaets-ID: sichere positive Ganzzahl bis ENTITY_ID_MAX */
  function isValidEntityId(n: unknown): boolean;

  /** Groesste gueltige ID einer Sammlung (0, wenn keine) */
  function maxEntityId(items: unknown): number;

  /** Macht alle Register-IDs eindeutig und gueltig (in place) */
  function normalizeEntityIds(data: Record<string, any>): EntityIdChange[];

  /** Bestimmt data._nextId aus Datei-Zaehlern und tatsaechlichen IDs neu */
  function recomputeNextIds(
    data: Record<string, any>,
    fileCounters?: Record<string, unknown>
  ): Record<string, number>;

  /** Prueft/repariert _nextId (Standard: window.D und die 11 Alt-Typen) */
  function validateAndRepairNextId(
    data?: Record<string, any>,
    types?: readonly string[]
  ): { valid: boolean; repairs: string[] };

  /** Aktiver Kampagnen-Speicherschluessel dieses Tabs (oder null) */
  function getActiveCampaignKey(): string | null;

  /** Ersetzt den Inhalt von target in place durch next */
  function replaceCampaignData<T extends Record<string, any>>(target: T, next: Record<string, any>): T;

  /** Reiner Kampagnen-Normalisierer (parsen, pruefen, migrieren, Defaults, IDs) */
  function normalizeCampaignData(raw: unknown): CampaignNormalizeResult;

  /** Alt-Versionsstempel wie load() normalisieren ('2.11' -> '2.0.0', Nicht-String entfernt) */
  function normalizeLegacyVersionStamp<T extends Record<string, any>>(data: T): T;

  // ============================================================
  // INDEXEDDB-SCHREIBBESTAETIGUNG & SAVE-ERGEBNIS (Code-Review 2026-09-21, U3/R04)
  // ============================================================

  /** Ergebnis von saveImmediate() — Erfolg erst nach bestaetigtem Write */
  type SaveImmediateResult =
    | { success: true; backend: 'localStorage' | 'indexedDB' }
    | { success: false; error: string; superseded?: true };

  /** Ergebnis von removeCampaignData() — wirft nie */
  type RemoveCampaignDataResult =
    | { success: true }
    | { success: false; stage: 'key' | 'indexedDB' | 'localStorage'; error: unknown };

  /** Loest mit 'complete' auf; 'abort'/'error' lehnen ab (setzt tx.oncomplete/onabort/onerror) */
  function idbTransactionDone(tx: IDBTransaction): Promise<void>;

  /** Einzige Tuer fuer schreibende IDB-Transaktionen: work(tx) synchron, Ergebnis erst nach Commit */
  function idbWriteTx<T>(
    storeNames: string | string[],
    work: (tx: IDBTransaction) => T,
    options?: { durability?: 'strict' | 'relaxed' | 'default' }
  ): Promise<T>;

  /** Sofort speichern; Ergebnis erst nach bestaetigtem Write */
  function saveImmediate(): Promise<SaveImmediateResult>;

  /** Alle Kopien einer Kampagne entfernen: IndexedDB (Commit) vor localStorage */
  function removeCampaignData(key: string): Promise<RemoveCampaignDataResult>;

  // ============================================================
  // PERSIST-BASELINE & SCHREIBSTEUERUNG (Code-Review 2026-09-21, U7/R02)
  // ============================================================

  /** Baseline nach load(): localStorage-Rohwert (vor IDB-Ersetzung) und Snapshot von D */
  function setPersistBaseline(key: string, stored: string | null, snapshot: string): void;

  /** Snapshot an D angleichen — nur ohne ausstehenden oder laufenden Save */
  function refreshPersistSnapshot(): void;

  /** Ein anderer Tab hat diese Kampagne gespeichert (Konflikt-Erkennung) */
  function markExternalCampaignWrite(key: string | null | undefined): void;

  /** true: keine Baseline, fremder Save gemeldet, anderer _rev oder anderer Inhalt */
  function isCampaignStorageStale(key: string | null): boolean;

  /** Anzahl bestaetigter Saves dieses Tabs */
  function getPersistSuccessCount(): number;

  /** Harte Schreibsperre; loest nach laufenden IndexedDB-Writes auf (hoechstens 5 s) */
  function retireCampaignWrites(): Promise<void>;

  /** Sperre aufheben (Abbruchpfade); holt einen verworfenen save() nach */
  function resumeCampaignWrites(): void;

  /** Automatischer Save nur in einem nicht gesperrten, nicht veralteten Tab (true = angestossen) */
  function saveAutomatic(): boolean;

  /** Ausstehenden entprellten Save sofort ausfuehren (nicht in einem veralteten Tab) */
  function flushPendingSave(): void;

  /** flushPendingSave() plus Warten auf den IndexedDB-Commit (vor internen Reloads) */
  function flushPendingSaveAndSettle(): Promise<void>;

  /** beforeunload: schreibt nie blind, fordert die Rueckfrage nur fuer ausdrueckliche Saves an */
  function persistOnUnload(event: BeforeUnloadEvent): void;

  /** Einmalig: beforeunload, pagehide und visibilitychange(hidden) registrieren */
  function initUnloadPersistence(): void;

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
  
  /** Create campaign (async seit U6/R07: Daten vor Index; lehnt nie ab) */
  function createCampaign(): Promise<void>;

  /** Switch campaign (async seit U7/R02: ausstehenden Save erst festschreiben; laedt nur nach gespeichertem Indexwrite neu) */
  function switchCampaign(key: string): Promise<void>;

  /** Get campaign index (nachsichtig: unlesbar -> Standardindex; siehe readCampaignIndexStrict) */
  function getCampaignIndex(): CampaignIndex;

  /** Kampagnenindex speichern; liefert das StorageAPI-Ergebnis */
  function saveCampaignIndex(index: CampaignIndex): { success: boolean; error?: string };
  
  // ============================================================
  // EXPORT/IMPORT FUNCTIONS
  // ============================================================
  
  /** Export data as JSON */
  function exportData(type?: string): void;
  
  /** Export data as CSV */
  function exportToCSV(dataType: string): void;
  
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
