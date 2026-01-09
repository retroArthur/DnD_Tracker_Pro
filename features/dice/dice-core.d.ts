interface DiceHistoryEntry {
    notation: string;
    result: string | number;
    rolls: (number | string)[];
    time: Date;
}
interface DiceRollResult {
    notation: string;
    total?: number | string;
    result?: number;
    rolls: (number | string)[];
}
interface ParseDiceNotationResult {
    total: number;
    rolls: number[];
    keptRolls: number[];
    modifier: number;
}
interface SkillDefinition {
    name: string;
    skill: string;
}
interface CharacterEntity {
    id: number;
    name: string;
    attributes?: {
        str?: number;
        dex?: number;
        con?: number;
        int?: number;
        wis?: number;
        cha?: number;
    };
    saveProficiencies?: {
        str?: boolean;
        dex?: boolean;
        con?: boolean;
        int?: boolean;
        wis?: boolean;
        cha?: boolean;
    };
    skillProficiencies?: {
        [key: string]: boolean;
    };
    proficiencyBonus?: number;
    level?: number;
    ac?: number;
    armorClass?: number;
    initiative?: number;
}
interface GroupPerceptionResult {
    name: string;
    roll: number;
    total: number;
    passive: number;
}
declare let diceHistory: DiceHistoryEntry[];
declare let diceFormulaHistory: string[];
declare let lastDiceRoll: DiceRollResult | null;
declare let selectedDamageType: string | null;
declare const SKILLS: {
    [key: string]: SkillDefinition[];
};
declare function rollMultiple(notation: string, count: number): void;
declare function rerollLast(): void;
declare function rollAdvantage(): void;
declare function rollDisadvantage(): void;
declare function rollStats(): void;
declare function rollCritDamage(): void;
declare function flipCoin(): void;
declare function rollAttack(withAdvantage?: boolean): void;
declare function rollSavingThrow(): void;
declare function rollGroupPerception(): void;
declare function createConfetti(container: Element): void;
declare function toggleDamageType(chip: HTMLElement): void;
declare function addToDiceHistory(notation: string, result: string | number, rolls: (number | string)[]): void;
declare function addToFormulaHistory(formula: string): void;
declare function renderFormulaHistory(): void;
declare function renderDiceHistory(): void;
declare function clearDiceHistory(): void;
declare function updateDiceCharSelect(): void;
declare function updateDiceCharStats(): void;
declare function renderSkillButtons(ch: CharacterEntity | undefined, attrs: {
    [key: string]: number;
}, profBonus: number): void;
declare function rollAttrCheck(attr: string): void;
declare function rollCharSave(attr: string): void;
declare function rollSkillCheck(skill: string, mod: number, skillName: string): void;
declare function rollCharInitiative(): void;
declare const floatingDiceHistory: {
    notation: string;
    result: number | string;
}[];
declare function toggleFloatingDice(): void;
declare function rollFloatingDice(sides: number): void;
declare function rollFloatingAdvantage(): void;
declare function rollFloatingDisadvantage(): void;
declare function rollFloatingCustom(): void;
declare function updateFloatingResult(result: number | string, formula: string, rolls: number[], isCrit: boolean, isFail: boolean): void;
declare function addToFloatingHistory(notation: string, result: number | string): void;
declare function renderFloatingHistory(): void;
declare function rerollFloating(notation: string): void;
//# sourceMappingURL=dice-core.d.ts.map