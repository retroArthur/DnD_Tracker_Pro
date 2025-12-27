/**
 * D&D Tracker - Type Definitions Index
 * @version 2.7.0
 */

/// <reference path="./entities.d.ts" />
/// <reference path="./globals.d.ts" />

// Re-export all types
export * from './entities';

// Export utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Export entity helpers
export type EntityMap = {
  characters: import('./entities').Character;
  npcs: import('./entities').NPC;
  locations: import('./entities').Location;
  quests: import('./entities').Quest;
  encounters: import('./entities').Encounter;
  loot: import('./entities').LootItem;
  spells: import('./entities').Spell;
  wiki: import('./entities').WikiEntry;
  links: import('./entities').Link;
  shops: import('./entities').Shop;
};

export type EntityOf<T extends keyof EntityMap> = EntityMap[T];
