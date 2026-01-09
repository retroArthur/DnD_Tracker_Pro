/**
 * D&D 5e Rest System
 * - Short Rest: Spend Hit Dice, regain features (depends on class)
 * - Long Rest: Full HP, half Hit Dice, all spell slots, class features
 */
declare function showRestModal(): void;
declare function selectRestType(type: string): void;
declare function renderRestDetails(type: string): string;
declare function renderRestCharacters(characters: any[], type: string): string;
declare function getHitDieType(className: string): number;
declare function adjustRestHitDice(charId: number | string, delta: number): void;
declare function applyRest(): void;
declare function quickShortRest(charId: number | string): void;
//# sourceMappingURL=rest-manager.d.ts.map