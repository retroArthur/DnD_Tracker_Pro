// [SECTION:VIRTUAL_SCROLL_HELPER]
// VIRTUAL SCROLLING SYSTEM - @scroll @performance @large-lists
// ============================================================
const virtualScrollConfig = {
    enabled: true,
    itemHeight: 120, // Durchschnittliche Card-Höhe
    bufferSize: 5,   // Extra Items vor/nach sichtbarem Bereich
    threshold: 50    // Aktiviere ab 50+ Items
};

function shouldUseVirtualScroll(itemCount) {
    return virtualScrollConfig.enabled && itemCount >= virtualScrollConfig.threshold;
}

function createVirtualScrollContainer(items, renderItemFn, containerId) {
    const container = $(containerId);
    if (!container) return;
    
    const totalHeight = items.length * virtualScrollConfig.itemHeight;
    const viewportHeight = container.clientHeight || 600;
    const itemsPerView = Math.ceil(viewportHeight / virtualScrollConfig.itemHeight);
    
    let scrollTop = container.scrollTop || 0;
    let startIndex = Math.floor(scrollTop / virtualScrollConfig.itemHeight);
    startIndex = Math.max(0, startIndex - virtualScrollConfig.bufferSize);
    
    let endIndex = startIndex + itemsPerView + (virtualScrollConfig.bufferSize * 2);
    endIndex = Math.min(items.length, endIndex);
    
    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * virtualScrollConfig.itemHeight;
    
    const html = `
        <div style="height: ${totalHeight}px; position: relative;">
            <div style="transform: translateY(${offsetY}px);">
                ${visibleItems.map(renderItemFn).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Scroll-Handler für dynamisches Nachladen
    container.onscroll = debounce(() => {
        createVirtualScrollContainer(items, renderItemFn, containerId);
    }, 100);
}

// ============================================================