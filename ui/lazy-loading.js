// [SECTION:LAZY_LOADING]
// LAZY LOADING FÜR BILDER - @lazy @images @performance
// ============================================================
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;

                        if (src) {
                            img.src = src;
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                        }
                    }
                });
            },
            {
                rootMargin: '50px' // Lade Bilder 50px bevor sie sichtbar werden
            }
        );

        // Überwache alle Bilder mit data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });

        // Für dynamisch hinzugefügte Bilder
        window.lazyLoadObserver = imageObserver;
    }
}

function makeLazyLoadable(imgElement) {
    if (window.lazyLoadObserver && imgElement.dataset.src) {
        window.lazyLoadObserver.observe(imgElement);
    }
}

// ============================================================
// NAVIGATION DRAG & DROP
// ============================================================
function initNavDragDrop() {
    const container = document.getElementById('nav-tabs-container');
    if (!container) return;

    let draggedTab = null;

    container.querySelectorAll('.nav-tab[draggable="true"]').forEach(tab => {
        tab.addEventListener('dragstart', e => {
            draggedTab = tab;
            tab.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', tab.dataset.view || '');
        });

        tab.addEventListener('dragend', () => {
            tab.classList.remove('dragging');
            container.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('drag-over'));
            draggedTab = null;
            saveNavOrder();
        });

        tab.addEventListener('dragover', e => {
            e.preventDefault();
            if (tab !== draggedTab && tab.getAttribute('draggable') === 'true') {
                tab.classList.add('drag-over');
            }
        });

        tab.addEventListener('dragleave', () => {
            tab.classList.remove('drag-over');
        });

        tab.addEventListener('drop', e => {
            e.preventDefault();
            tab.classList.remove('drag-over');

            if (draggedTab && draggedTab !== tab) {
                const allTabs = [...container.querySelectorAll('.nav-tab')];
                const draggedIndex = allTabs.indexOf(draggedTab);
                const targetIndex = allTabs.indexOf(tab);

                if (draggedIndex < targetIndex) {
                    tab.after(draggedTab);
                } else {
                    tab.before(draggedTab);
                }
            }
        });
    });

    // Gespeicherte Reihenfolge wiederherstellen
    restoreNavOrder();
}

function saveNavOrder() {
    const container = document.getElementById('nav-tabs-container');
    if (!container) return;

    const order = [...container.querySelectorAll('.nav-tab[data-view]')].map(
        tab => tab.dataset.view
    );

    D.settings = D.settings || {};
    D.settings.navOrder = order;
    save();
}

function restoreNavOrder() {
    const order = D.settings?.navOrder;
    if (!order || !Array.isArray(order) || order.length === 0) return;

    const container = document.getElementById('nav-tabs-container');
    if (!container) return;

    const tabs = [...container.querySelectorAll('.nav-tab')];
    const tabMap = new Map();

    // Tabs nach data-view mappen
    tabs.forEach(tab => {
        const view = tab.dataset.view;
        if (view) tabMap.set(view, tab);
    });

    // Tabs ohne data-view (Debug, Theme) am Ende sammeln
    const fixedTabs = tabs.filter(tab => !tab.dataset.view);

    // Container leeren
    container.innerHTML = '';

    // Tabs in gespeicherter Reihenfolge einfügen
    order.forEach(view => {
        const tab = tabMap.get(view);
        if (tab) {
            container.appendChild(tab);
            tabMap.delete(view);
        }
    });

    // Restliche Tabs (neue, die nicht in der Order sind) hinzufügen
    tabMap.forEach(tab => container.appendChild(tab));

    // Fixierte Tabs am Ende
    fixedTabs.forEach(tab => container.appendChild(tab));
}

function resetNavOrder() {
    if (D.settings) {
        delete D.settings.navOrder;
        save();
    }
    location.reload();
}
