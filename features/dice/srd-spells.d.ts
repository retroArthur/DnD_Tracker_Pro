interface SRDSpell {
    name: string;
    type: string;
    school: string;
    castingTime: string;
    range: string;
    duration: string;
    components: string;
    material?: string;
    classes: string[];
    description: string;
}
declare const log: any;
declare const D: any;
declare const nextId: any;
declare const renderSpells: any;
declare let _srdSpellsCache: SRDSpell[] | null;
declare function getSRDSpells(): SRDSpell[];
declare const SRD_SPELLS: {
    readonly length: number;
};
//# sourceMappingURL=srd-spells.d.ts.map