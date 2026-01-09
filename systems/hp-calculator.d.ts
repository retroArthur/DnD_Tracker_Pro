declare function showHpCalculator(type: string, id: number): void;
type HpAction = 'damage' | 'heal' | 'temp';
declare function applyHpChange(action: HpAction): void;
declare function parseDiceFormula(formula: string): number;
//# sourceMappingURL=hp-calculator.d.ts.map