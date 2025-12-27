// [SECTION:VIRTUAL_LIST]
// Extrahiert aus spellslots.js
// Virtual List Performance
// Zeilen: 49

// PERFORMANCE - VIRTUAL LIST
// ============================================================
class VirtualList {
    constructor(container, itemHeight, renderItem) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.renderItem = renderItem;
        this.items = [];
        this.scrollTop = 0;
        this.visibleCount = 0;
        
        this.content = document.createElement('div');
        this.content.className = 'virtual-list-content';
        container.appendChild(this.content);
        
        container.addEventListener('scroll', () => this.onScroll());
    }
    
    setItems(items) {
        this.items = items;
        this.content.style.height = `${items.length * this.itemHeight}px`;
        this.visibleCount = Math.ceil(this.container.clientHeight / this.itemHeight) + 2;
        this.render();
    }
    
    onScroll() {
        this.scrollTop = this.container.scrollTop;
        this.render();
    }
    
    render() {
        const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - 1);
        const endIndex = Math.min(this.items.length, startIndex + this.visibleCount + 2);
        
        this.content.innerHTML = '';
        
        for (let i = startIndex; i < endIndex; i++) {
            const item = this.items[i];
            const el = document.createElement('div');
            el.className = 'virtual-list-item';
            el.style.top = `${i * this.itemHeight}px`;
            el.style.height = `${this.itemHeight}px`;
            el.innerHTML = this.renderItem(item, i);
            this.content.appendChild(el);
        }
    }
}

// ============================================================
