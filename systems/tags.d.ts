interface Tag {
    name: string;
    color: string;
}
declare function renderTagsModal(): void;
declare function deleteGlobalTag(index: number): void;
declare function addExistingTagToEntity(name: string, color: string): void;
declare function renderTagsBar(tags: Tag[]): string;
interface TagSearchResult {
    type: string;
    id: number;
    name: string;
    icon: string;
    label: string;
}
//# sourceMappingURL=tags.d.ts.map