interface FuzzyMatchResult {
    match: boolean;
    score: number;
}
interface SearchMatch {
    type: string;
    name: string;
    detail: string;
    id: number;
    locId?: number | string;
    score: number;
}
declare const D: any;
declare const LINK_ICONS: any;
declare const switchView: any;
declare const toggleLocation: any;
declare const editChar: any;
declare const editNPC: any;
declare const editQuest: any;
declare const editSpell: any;
declare function fuzzyMatch(text: string, query: string): FuzzyMatchResult;
declare function fuzzySearchFields(item: any, query: string, fields: string[]): number;
declare const debouncedGlobalSearch: any;
declare function getTypeIcon(type: string): string;
declare function highlightMatch(text: string, query: string): string;
//# sourceMappingURL=global-search.d.ts.map