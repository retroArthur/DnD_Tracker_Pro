/**
 * D&D Tracker - DOM Builder Utility (TypeScript)
 * Efficient DOM rendering with DocumentFragment
 * @module ui/dom-builder
 * @version 2.7.0
 */

import { throttle } from '../utils/performance';

// ============================================================
// TYPES
// ============================================================

export type ElementChild = Node | string | number | null | undefined | ElementChild[];

export interface ElementAttributes {
    className?: string;
    id?: string;
    style?: Partial<CSSStyleDeclaration>;
    [key: string]: unknown;
}

export interface VirtualListOptions<T> {
    itemHeight?: number;
    bufferSize?: number;
    renderItem?: (item: T) => HTMLElement | null;
}

// ============================================================
// DOM BUILDER
// ============================================================

/**
 * Creates a DOM element with attributes and children
 * @param tag - Tag name
 * @param attrs - Attributes (className, id, data-*, style, events)
 * @param children - Child elements or text
 * @returns HTMLElement
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs: ElementAttributes = {},
    ...children: ElementChild[]
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);

    // Set attributes
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className' && typeof value === 'string') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object' && value !== null) {
            Object.assign(el.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            // Event handler: onClick -> click
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, value as EventListener);
        } else if (key.startsWith('data-')) {
            el.setAttribute(key, String(value));
        } else if (value !== undefined && value !== null && value !== false) {
            el.setAttribute(key, String(value));
        }
    }

    // Add children
    appendChildren(el, children);

    return el;
}

/**
 * Appends children to an element
 */
function appendChildren(parent: Element, children: ElementChild[]): void {
    for (const child of children) {
        if (child === null || child === undefined) continue;

        if (typeof child === 'string' || typeof child === 'number') {
            parent.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Node) {
            parent.appendChild(child);
        } else if (Array.isArray(child)) {
            appendChildren(parent, child);
        }
    }
}

/**
 * Shorthand for createElement
 */
export const el = createElement;

/**
 * Creates a DocumentFragment from multiple elements
 * @param children - Child elements
 * @returns DocumentFragment
 */
export function createFragment(...children: ElementChild[]): DocumentFragment {
    const fragment = document.createDocumentFragment();

    for (const child of children) {
        if (child === null || child === undefined) continue;

        if (Array.isArray(child)) {
            for (const c of child) {
                if (c instanceof Node) fragment.appendChild(c);
            }
        } else if (child instanceof Node) {
            fragment.appendChild(child);
        }
    }

    return fragment;
}

// ============================================================
// BATCH DOM UPDATES
// ============================================================

/**
 * Executes DOM updates in batch for better performance
 * @param updateFn - Function containing DOM updates
 */
export function batchDOMUpdate(updateFn: () => void): void {
    requestAnimationFrame(() => {
        updateFn();
    });
}

/**
 * Replaces container content efficiently
 * @param container - Target container
 * @param content - New content
 */
export function replaceContent(
    container: HTMLElement,
    content: Node | Node[] | DocumentFragment
): void {
    // Clear
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // Add new content
    if (content instanceof DocumentFragment || content instanceof Node) {
        container.appendChild(content);
    } else if (Array.isArray(content)) {
        const fragment = createFragment(...content);
        container.appendChild(fragment);
    }
}

/**
 * Updates a list efficiently (diff-based)
 * @param container - Container element
 * @param items - Data array
 * @param keyAttr - Attribute for unique ID
 * @param renderItem - Function to render an item
 */
export function updateList<T extends { id: number | string }>(
    container: HTMLElement,
    items: T[],
    keyAttr: string,
    renderItem: (item: T) => HTMLElement | null
): void {
    const existingMap = new Map<string, Element>();

    // Index existing elements
    for (const child of Array.from(container.children)) {
        const key = child.getAttribute(keyAttr);
        if (key) existingMap.set(key, child);
    }

    const fragment = document.createDocumentFragment();
    const newKeys = new Set<string>();

    // Render items
    for (const item of items) {
        const key = String(item.id);
        newKeys.add(key);

        if (existingMap.has(key)) {
            // Reuse existing element
            fragment.appendChild(existingMap.get(key)!);
        } else {
            // Create new element
            const element = renderItem(item);
            if (element) {
                element.setAttribute(keyAttr, key);
                fragment.appendChild(element);
            }
        }
    }

    // Update container
    replaceContent(container, fragment);
}

// ============================================================
// VIRTUAL RENDERING
// ============================================================

/**
 * Virtual list for large datasets
 */
export class VirtualList<T> {
    private container: HTMLElement;
    private items: T[] = [];
    private itemHeight: number;
    private bufferSize: number;
    private renderItemFn: (item: T) => HTMLElement | null;

    private scrollContainer!: HTMLDivElement;
    private spacer!: HTMLDivElement;
    private content!: HTMLDivElement;

    private scrollTop: number = 0;
    private visibleStart: number = 0;
    private visibleEnd: number = 0;

    constructor(container: HTMLElement, options: VirtualListOptions<T> = {}) {
        this.container = container;
        this.itemHeight = options.itemHeight ?? 80;
        this.bufferSize = options.bufferSize ?? 5;
        this.renderItemFn = options.renderItem ?? (() => null);

        this._setupScroll();
    }

    private _setupScroll(): void {
        // Scroll container
        this.scrollContainer = createElement('div', {
            className: 'virtual-scroll-container',
            style: { overflow: 'auto', height: '100%' }
        });

        // Spacer for correct scrolling
        this.spacer = createElement('div', {
            className: 'virtual-scroll-spacer'
        });

        // Content container
        this.content = createElement('div', {
            className: 'virtual-scroll-content'
        });

        this.scrollContainer.appendChild(this.spacer);
        this.scrollContainer.appendChild(this.content);
        this.container.appendChild(this.scrollContainer);

        // Scroll handler
        const throttledScroll = throttle(() => this._onScroll(), 16);
        this.scrollContainer.addEventListener('scroll', throttledScroll);
    }

    private _onScroll(): void {
        this.scrollTop = this.scrollContainer.scrollTop;
        this._updateVisibleItems();
    }

    private _updateVisibleItems(): void {
        const containerHeight = this.scrollContainer.clientHeight;
        const totalHeight = this.items.length * this.itemHeight;

        // Set spacer height
        this.spacer.style.height = `${totalHeight}px`;

        // Calculate visible range
        const start = Math.floor(this.scrollTop / this.itemHeight);
        const visibleCount = Math.ceil(containerHeight / this.itemHeight);

        this.visibleStart = Math.max(0, start - this.bufferSize);
        this.visibleEnd = Math.min(this.items.length, start + visibleCount + this.bufferSize);

        // Position content
        this.content.style.transform = `translateY(${this.visibleStart * this.itemHeight}px)`;

        // Render visible items
        this._renderVisibleItems();
    }

    private _renderVisibleItems(): void {
        const visibleItems = this.items.slice(this.visibleStart, this.visibleEnd);
        const elements = visibleItems
            .map(item => this.renderItemFn(item))
            .filter((el): el is HTMLElement => el !== null);
        const fragment = createFragment(...elements);
        replaceContent(this.content, fragment);
    }

    setItems(items: T[]): void {
        this.items = items;
        this._updateVisibleItems();
    }

    refresh(): void {
        this._updateVisibleItems();
    }

    getItems(): T[] {
        return this.items;
    }

    getVisibleRange(): { start: number; end: number } {
        return { start: this.visibleStart, end: this.visibleEnd };
    }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Creates an empty state element
 * @param options - Empty state options
 * @returns HTMLElement
 */
export function createEmptyState(options: {
    icon?: string;
    title?: string;
    description?: string;
    buttonText?: string;
    buttonAction?: string;
    buttonValue?: string;
}): HTMLElement {
    const container = createElement('div', { className: 'empty-state' });

    if (options.icon) {
        container.appendChild(
            createElement('div', { className: 'empty-state-icon' }, options.icon)
        );
    }

    if (options.title) {
        container.appendChild(
            createElement('h3', { className: 'empty-state-title' }, options.title)
        );
    }

    if (options.description) {
        container.appendChild(
            createElement('p', { className: 'empty-state-desc' }, options.description)
        );
    }

    if (options.buttonText) {
        container.appendChild(
            createElement(
                'button',
                {
                    className: 'btn btn-primary',
                    'data-action': options.buttonAction ?? 'show-modal',
                    'data-value': options.buttonValue ?? ''
                },
                options.buttonText
            )
        );
    }

    return container;
}

/**
 * Creates a loading spinner element
 * @param size - Size in pixels (default: 24)
 * @returns HTMLElement
 */
export function createSpinner(size: number = 24): HTMLElement {
    return createElement('div', {
        className: 'spinner',
        style: {
            width: `${size}px`,
            height: `${size}px`
        }
    });
}

/**
 * Creates an icon button
 * @param icon - Icon character or emoji
 * @param action - data-action value
 * @param id - data-id value
 * @param title - Button title
 * @param danger - Whether to use danger styling
 * @returns HTMLButtonElement
 */
export function createIconButton(
    icon: string,
    action: string,
    id?: number | string,
    title?: string,
    danger: boolean = false
): HTMLButtonElement {
    const attrs: ElementAttributes = {
        className: `btn-icon${danger ? ' btn-danger' : ''}`,
        'data-action': action,
        title: title ?? ''
    };

    if (id !== undefined) {
        attrs['data-id'] = String(id);
    }

    return createElement('button', attrs, icon);
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
    createElement,
    el,
    createFragment,
    batchDOMUpdate,
    replaceContent,
    updateList,
    VirtualList,
    createEmptyState,
    createSpinner,
    createIconButton
};
