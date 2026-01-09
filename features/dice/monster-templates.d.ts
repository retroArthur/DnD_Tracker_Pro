interface MonsterSpeed {
    walk?: string;
    climb?: string;
    swim?: string;
    fly?: string;
    burrow?: string;
}
interface MonsterTemplate {
    name: string;
    creatureType: string;
    cr: string;
    ac: number;
    init: number;
    hp: number;
    speed: MonsterSpeed;
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
}
declare const log: any;
declare let _monsterTemplatesCache: Record<string, MonsterTemplate> | null;
declare function getMonsterTemplates(): Record<string, MonsterTemplate>;
declare const MONSTER_TEMPLATES: any;
//# sourceMappingURL=monster-templates.d.ts.map