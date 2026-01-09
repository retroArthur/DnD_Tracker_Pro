interface SpellSlot {
    max: number;
    current: number;
}
type SpellSlots = Record<number, SpellSlot>;
declare const renderParty: any;
declare function getSpellSlots(charId: number | string): SpellSlots | null;
declare function renderSpellSlotPips(charId: number | string): string;
//# sourceMappingURL=spellslots-ui.d.ts.map