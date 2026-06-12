/**
 * D&D Tracker - Core Type Definitions
 * @version 2.7.0
 */

// ============================================================
// BASIC TYPES
// ============================================================

/** Unique identifier for entities */
export type EntityId = number;

/** Entity types in the application */
export type EntityType = 
  | 'characters' 
  | 'npcs' 
  | 'locations' 
  | 'quests' 
  | 'encounters' 
  | 'loot' 
  | 'spells' 
  | 'wiki' 
  | 'links'
  | 'shops';

/** D&D 5e ability scores */
export type AbilityScore = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

/** D&D 5e damage types */
export type DamageType = 
  | 'slashing' | 'piercing' | 'bludgeoning'
  | 'fire' | 'cold' | 'lightning' | 'thunder'
  | 'acid' | 'poison' | 'necrotic' | 'radiant'
  | 'force' | 'psychic';

/** Item rarity */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'veryRare' | 'legendary' | 'artifact';

/** Quest status */
export type QuestStatus = 'aktiv' | 'abgeschlossen' | 'fehlgeschlagen' | 'pausiert';

/** Alignment */
export type Alignment = 
  | 'LG' | 'NG' | 'CG'   // Good
  | 'LN' | 'N' | 'CN'    // Neutral
  | 'LE' | 'NE' | 'CE';  // Evil

// ============================================================
// CURRENCY
// ============================================================

export interface Currency {
  /** Platinum */
  pm: number;
  /** Gold */
  gm: number;
  /** Electrum */
  em: number;
  /** Silver */
  sm: number;
  /** Copper */
  km: number;
}

// ============================================================
// ATTRIBUTES
// ============================================================

export interface Attributes {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface SavingThrowProficiencies {
  str: boolean;
  dex: boolean;
  con: boolean;
  int: boolean;
  wis: boolean;
  cha: boolean;
}

// ============================================================
// SPELL SLOTS
// ============================================================

export interface SpellSlot {
  max: number;
  current: number;
}

export interface SpellSlots {
  [level: number]: SpellSlot;
}

// ============================================================
// CHARACTER
// ============================================================

export interface Character {
  id: EntityId;
  name: string;
  playerName: string;
  characterClass: string;
  subclass: string;
  race: string;
  level: number;
  background: string;
  alignment: Alignment | string;
  weight: number;
  height: number;
  attributes: Attributes;
  saveProficiencies: SavingThrowProficiencies;
  hpCurrent: number;
  hpMax: number;
  tempHp: number;
  armorClass: number;
  initiative: number;
  speed: string;
  proficiencyBonus: number;
  hitDice: string;
  passivePerception: number;
  inspiration: boolean;
  resistances: DamageType[];
  immunities: DamageType[];
  languages: string[];
  spellSlots: SpellSlots;
  currency: Currency;
  notes: string;
  avatar: string;
  /** Assigned spells (spell IDs) */
  assignedSpells?: EntityId[];
  /** Assigned items (loot IDs) */
  assignedItems?: EntityId[];
  /** Conditions/Effects */
  conditions?: Condition[];
  /** Tags */
  tags?: Tag[];
}

// ============================================================
// NPC
// ============================================================

export interface NPCTrigger {
  condition: string;
  reveal: string;
  triggered: boolean;
}

export interface NPCDialog {
  title: string;
  triggerCondition: string;
  text: string;
  used: boolean;
}

export interface NPC {
  id: EntityId;
  name: string;
  role: string;
  race: string;
  locationId: EntityId | null;
  chapter: string;
  filterId: EntityId | null;
  quests: string[];
  info: string[];
  relationships: string[];
  description: string;
  triggers: NPCTrigger[];
  dialogs: NPCDialog[];
  /** Tags */
  tags?: Tag[];
}

// ============================================================
// LOCATION
// ============================================================

export interface Location {
  id: EntityId;
  name: string;
  type: string;
  parentId: EntityId | null;
  description: string;
  secret: string;
  npcs: EntityId[];
  /** Tags */
  tags?: Tag[];
}

// ============================================================
// QUEST
// ============================================================

export interface QuestObjective {
  text: string;
  completed: boolean;
}

export interface Quest {
  id: EntityId;
  name: string;
  description: string;
  status: QuestStatus;
  priority: 'low' | 'normal' | 'high';
  giver: string;
  giverNpcId: EntityId | null;
  reward: string;
  objectives: QuestObjective[];
  notes: string;
  tracked: boolean;
  /** Tags */
  tags?: Tag[];
}

// ============================================================
// ENCOUNTER / CREATURE
// ============================================================

export interface Encounter {
  id: EntityId;
  name: string;
  creatureType: string;
  cr: string;
  ac: number;
  init: number;
  hp: number;
  speed: string;
  perception: number;
  str: string;
  dex: string;
  con: string;
  int: string;
  wis: string;
  cha: string;
  languages: string[];
  traits: string;
  equipment: string;
  actions: string;
  reactions?: string;
  legendaryActions?: string;
  /** Tags */
  tags?: Tag[];
}

// ============================================================
// LOOT / ITEM
// ============================================================

export interface LootItem {
  id: EntityId;
  name: string;
  type: 'weapon' | 'armor' | 'item' | 'consumable' | 'treasure' | 'misc';
  rarity: Rarity;
  quantity: number;
  value: string;
  weight: number;
  description: string;
  magical: boolean;
  attunement: boolean;
  attuned: boolean;
  notes: string;
  /** Owner character ID */
  ownerId?: EntityId | null;
  /** Tags */
  tags?: Tag[];
}

// ============================================================
// SPELL
// ============================================================

export type SpellSchool = 
  | 'Bannmagie' | 'Beschwörung' | 'Erkenntnismagie' | 'Hervorrufung'
  | 'Illusion' | 'Nekromantie' | 'Verwandlung' | 'Verzauberung';

export interface Spell {
  id: EntityId;
  name: string;
  type: string; // 'cantrip' | '1' | '2' | ... | '9'
  level: number;
  school: SpellSchool | string;
  spellClasses: string[];
  time: string;
  range: string;
  duration: string;
  ritual: boolean;
  concentration?: boolean;
  v: boolean; // Verbal
  g: boolean; // Gesture/Somatic
  m: boolean; // Material
  material: string;
  description: string;
  higherLevels?: string;
  note: string;
  /** Tags */
  tags?: Tag[];
}

// ============================================================
// WIKI
// ============================================================

export interface WikiEntry {
  id: EntityId;
  title: string;
  category: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  /** Tags */
  tags?: Tag[];
}

// ============================================================
// LINKS
// ============================================================

export interface Link {
  id: EntityId;
  name: string;
  url: string;
  category: string;
  description: string;
}

// ============================================================
// SHOPS
// ============================================================

export interface ShopItem {
  name: string;
  category: 'weapon' | 'armor' | 'item' | 'service' | 'misc';
  cost: string;
  quantity: number;
  available: boolean;
  description?: string;
  type?: string;
  damage?: string;
  ac?: string;
  properties?: string;
  weight?: string;
  special?: string;
  note?: string;
}

export interface Shop {
  id: EntityId;
  name: string;
  type: string;
  description: string;
  npcId: EntityId | null;
  locationId: EntityId | null;
  items: ShopItem[];
  note?: string;
  special?: string;
}

// ============================================================
// INITIATIVE / COMBAT
// ============================================================

export interface Combatant {
  id: EntityId;
  name: string;
  type: 'character' | 'npc' | 'encounter' | 'custom';
  entityId?: EntityId;
  initiative: number;
  hpCurrent: number;
  hpMax: number;
  ac: number;
  conditions: Condition[];
  effects: Effect[];
  isPlayer: boolean;
}

export interface Initiative {
  combatants: Combatant[];
  currentTurn: number;
  round: number;
}

// ============================================================
// CONDITIONS & EFFECTS
// ============================================================

export interface Condition {
  name: string;
  duration?: number;
  description?: string;
}

export interface Effect {
  id: EntityId;
  name: string;
  type: string;
  duration: number;
  source?: string;
}

// ============================================================
// TAGS
// ============================================================

export interface Tag {
  name: string;
  color: string;
}

// ============================================================
// CALENDAR
// ============================================================

export interface CalendarEvent {
  id: EntityId;
  day: number;
  month: number;
  year: number;
  title: string;
  description: string;
}

export interface Calendar {
  day: number;
  month: number;
  year: number;
  events: CalendarEvent[];
}

// ============================================================
// SESSION NOTES
// ============================================================

export interface SessionNote {
  id: EntityId;
  title: string;
  date: string;
  content: string;
  summary?: string;
}

// ============================================================
// SETTINGS
// ============================================================

export interface Settings {
  theme: 'dark' | 'light' | 'blood' | 'forest' | 'ocean' | 'parchment';
  lastView: string;
  layout?: 'classic' | 'compact' | 'modern';
}

// ============================================================
// FILTERS
// ============================================================

export interface Filter {
  id: EntityId;
  name: string;
  type: EntityType;
  color?: string;
}

// ============================================================
// MAIN DATA STRUCTURE
// ============================================================

export interface AppData {
  characters: Character[];
  npcs: NPC[];
  locations: Location[];
  quests: Quest[];
  encounters: Encounter[];
  loot: LootItem[];
  spells: Spell[];
  wiki: WikiEntry[];
  links: Link[];
  shops?: Shop[];
  initiative: Initiative;
  calendar: Calendar;
  sessionNotes: SessionNote[];
  quickNotes: string;
  tags: Tag[];
  filters: Filter[];
  settings: Settings;
  /** Next ID counters for each entity type */
  _nextId: Record<string, number>;
}

// ============================================================
// GLOBAL D VARIABLE TYPE
// ============================================================

declare global {
  /** Main application data store */
  var D: AppData;
  
  /** Application configuration */
  var APP_CONFIG: {
    VERSION: string;
    DEBUG_MODE: boolean;
    PERF_MODE: boolean;
    STORAGE_KEY: string;
    BACKUP_KEY: string;
    CAMPAIGN_INDEX_KEY: string;
    THEME_KEY: string;
    LAYOUT_KEY: string;
    UNDO_LIMIT: number;
    MAX_BACKUPS: number;
    MAX_BACKUP_SIZE_MB: number;
    BACKUP_INTERVAL: number;
    AUTOSAVE_DELAY: number;
    TOAST_DURATION: number;
    DEBOUNCE_DELAY: number;
    THROTTLE_DELAY: number;
    VIRTUAL_SCROLL_THRESHOLD: number;
    LAZY_LOAD_THRESHOLD: string;
    MAX_LEVEL: number;
    ATTRIBUTE_MIN: number;
    ATTRIBUTE_MAX: number;
  };
}

export {};
