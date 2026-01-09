interface WikiCategory {
    icon: string;
    name: string;
}
interface WikiTemplate {
    icon: string;
    name: string;
    category: string;
    content: string;
}
interface WikiSearchResult {
    entry: any;
    titleMatch: boolean;
    contentMatch: boolean;
    tagMatch: boolean;
    preview: string;
}
interface WikiTOCItem {
    level: number;
    text: string;
    id: string;
}
interface WikiBreadcrumbItem {
    id: number;
    title: string;
    category: string;
}
interface LinkSuggesterState {
    textNode: Text;
    linkStart: number;
    cursorPos: number;
}
declare const WikiState: {
    categoryFilter: string;
    sortMode: string;
    expandedEntries: Set<number>;
    expandedCategories: Set<string>;
    selectedEntryId: number | null;
    searchDropdownIndex: number;
    linkSuggester: {
        input: string;
        cursorPos: number;
    } | null;
    linkSuggesterIndex: number;
    linkSuggesterState: LinkSuggesterState | null;
};
declare const WIKI_CATEGORIES: Readonly<Record<string, WikiCategory>>;
declare const WIKI_TEMPLATES: Readonly<Record<string, WikiTemplate>>;
declare function renderWiki(): void;
declare function renderWikiQuickAccess(): void;
declare function renderWikiTree(): void;
declare function renderWikiTreeItems(entries: any[], childrenMap: Record<number, any[]>, depth: number): string;
declare function renderWikiTreeItem(entry: any, childrenMap: Record<number, any[]>, depth: number): string;
declare function renderWikiDetail(): void;
declare function selectWikiEntry(id: number): void;
declare function toggleWikiCategory(category: string): void;
declare function expandAllWikiCategories(): void;
declare function collapseAllWikiCategories(): void;
declare function showWikiForm(parentCategory?: string): void;
declare function hideWikiForm(): void;
declare function updateWikiParentSelect(): void;
declare function initWikiCategoryListener(): void;
declare function isDescendantOf(entryId: number, potentialAncestorId: number | null): boolean;
declare function parseWikiLinks(content: string): string;
declare function extractWikiLinks(content: string): string[];
declare function findBacklinks(title: string): string[];
declare function filterWiki(category: string): void;
declare function sortWiki(mode: string): void;
declare function cancelWikiEdit(): void;
declare function clearWikiForm(): void;
declare function navigateToWikiEntry(title: string): void;
declare function createWikiFromLink(title: string): void;
declare function searchWikiTag(tag: string): void;
declare function insertWikiLink(): void;
declare function addToWikiRecentlyViewed(id: number): void;
declare function getWikiBreadcrumb(entryId: number): WikiBreadcrumbItem[];
declare function renderWikiBreadcrumb(entryId: number): string;
declare function getSearchContextPreview(content: string, query: string, maxLength?: number): string;
declare function renderWikiSearchDropdown(query: string): void;
declare function handleWikiSearchKeydown(e: KeyboardEvent): void;
declare function updateSearchDropdownSelection(items: NodeListOf<Element>): void;
declare function extractWikiTOC(content: string): WikiTOCItem[];
declare function renderWikiTOC(content: string): string;
declare function addTOCAnchors(content: string): string;
declare function scrollToTOCHeading(targetId: string): void;
declare function renderWikiTemplateSelector(): string;
declare function applyWikiTemplate(templateKey: string): void;
declare function showWikiLinkSuggester(input: string, cursorPos: number): void;
declare function hideWikiLinkSuggester(): void;
declare function insertWikiLinkSuggestion(title: string): void;
declare function handleWikiContentInput(e: Event): void;
//# sourceMappingURL=wiki.d.ts.map