/**
 * D&D 5e Standard Combat Actions
 * Shows Quick Actions for the active combatant
 */
interface QuickAction {
    name: string;
    icon: string;
    desc: string;
    effect?: {
        name: string;
        color: string;
        duration: number;
        permanent?: boolean;
    };
}
declare const QUICK_ACTIONS: Readonly<Record<string, QuickAction>>;
declare function renderQuickActionsBar(): void;
declare function applyQuickAction(cbId: number | string, actionKey: string): void;
declare function showConditionReference(): void;
declare function renderConditionList(filter?: string): string;
declare function filterConditions(): void;
//# sourceMappingURL=quick-actions.d.ts.map