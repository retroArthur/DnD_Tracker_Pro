// [SECTION:VIRTUAL_SCROLL]
// VIRTUAL SCROLLING HELPER (für große Listen) - @virtual @scroll @list
// ============================================================
const VirtualScroll = {
    create(container, items, renderItem, itemHeight = 60) {
        if (items.length < 50) {
            // Für kleine Listen normales Rendering
            container.innerHTML = items.map(renderItem).join('');
            return;
        }
        
        const totalHeight = items.length * itemHeight;
        const viewportHeight = container.clientHeight || 400;
        const bufferSize = 5;
        
        // Scroll-Container Setup
        container.style.height = viewportHeight + 'px';
        container.style.overflow = 'auto';
        container.style.position = 'relative';
        
        // Content-Wrapper
        const wrapper = document.createElement('div');
        wrapper.style.height = totalHeight + 'px';
        wrapper.style.position = 'relative';
        
        const visibleContainer = document.createElement('div');
        visibleContainer.style.position = 'absolute';
        visibleContainer.style.left = '0';
        visibleContainer.style.right = '0';
        
        wrapper.appendChild(visibleContainer);
        container.innerHTML = '';
        container.appendChild(wrapper);
        
        const render = () => {
            const scrollTop = container.scrollTop;
            const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
            const endIdx = Math.min(items.length, Math.ceil((scrollTop + viewportHeight) / itemHeight) + bufferSize);
            
            visibleContainer.style.top = (startIdx * itemHeight) + 'px';
            visibleContainer.innerHTML = items.slice(startIdx, endIdx).map(renderItem).join('');
        };
        
        render();
        container.addEventListener('scroll', throttle(render, 16), { passive: true });
    }
};

// Initialize Event Delegation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        EventDelegation.init();
        initLazyObserver();
    });
} else {
    EventDelegation.init();
    initLazyObserver();
}

