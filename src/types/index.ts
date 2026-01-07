/**
 * D&D Tracker - Type Definitions
 * Central export point for all type definitions
 */

// Re-export all entity types
export * from './entities';

// Re-export all global function types
export * from './globals';

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Type-safe entity map
export type EntityMap = {
  characters: import('./entities').Character[];
  npcs: import('./entities').NPC[];
  locations: import('./entities').Location[];
  quests: import('./entities').Quest[];
  encounters: import('./entities').Encounter[];
  loot: import('./entities').LootItem[];
  spells: import('./entities').Spell[];
  wiki: import('./entities').WikiEntry[];
  links: import('./entities').Link[];
  shops: import('./entities').Shop[];
};
