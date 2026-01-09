declare class VirtualList<T = any> {
    private container;
    private itemHeight;
    private renderItem;
    private items;
    private scrollTop;
    private visibleCount;
    private content;
    private _scrollHandler;
    constructor(container: HTMLElement, itemHeight: number, renderItem: (item: T, index: number) => string);
    /**
     * Cleanup method to remove event listeners and prevent memory leaks
     */
    destroy(): void;
    setItems(items: T[]): void;
    onScroll(): void;
    render(): void;
}
//# sourceMappingURL=virtual-list.d.ts.map