// [SECTION:INIT]
// ============================================================
// INIT FUNKTION - @init @startup @bootstrap @load
// ============================================================
async function init() {
    // Globale Error Handler für unerwartete Fehler
    window.onerror = function(message, source, lineno, colno, error) {
        if (typeof ErrorHandler !== 'undefined') {
            ErrorHandler.log('window.onerror', error || new Error(message), `${source}:${lineno}`);
        }
        // Fehler nicht unterdrücken, damit sie in der Konsole sichtbar bleiben
        return false;
    };
    
    window.onunhandledrejection = function(event) {
        if (typeof ErrorHandler !== 'undefined') {
            ErrorHandler.log('unhandledRejection', event.reason || new Error('Promise rejected'));
        }
    };
    
    // Aktive Kampagne ermitteln
    const index = (typeof window.getCampaignIndex === 'function')
        ? window.getCampaignIndex()
        : { campaigns: [], active: window.APP_CONFIG.STORAGE_KEY };
    const activeKey = index.active || window.APP_CONFIG.STORAGE_KEY;

    // Storage-Key überschreiben falls andere Kampagne aktiv
    if (activeKey !== APP_CONFIG.STORAGE_KEY) {
        window.STORAGE_KEY_OVERRIDE = activeKey;
    }

    await load();

    // Theme initialisieren
    loadTheme();

    // Layout-Profil initialisieren
    loadLayout();

    // Offline-Modus initialisieren
    initOfflineMode();
    
    if ($('autosave-toggle')) $('autosave-toggle').checked = true;
    if ($('quick-notes')) $('quick-notes').value = D.quickNotes || '';
    
    // Navigation Drag-and-Drop initialisieren (vor Click-Listenern)
    initNavDragDrop();
    
    document.querySelectorAll('.nav-tab').forEach(tab => tab.addEventListener('click', () => switchView(tab.dataset.view)));
    
    // Defensive render calls - check if functions exist
    if (typeof renderAll === 'function') renderAll();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    if (typeof window.renderCampaignList === 'function') window.renderCampaignList();
    if (typeof window.renderTimers === 'function') window.renderTimers();
    if (typeof window.renderTimerPresets === 'function') window.renderTimerPresets();
    if (typeof window.renderDiceHistory === 'function') window.renderDiceHistory();
    if (typeof window.renderDiceFavorites === 'function') window.renderDiceFavorites();
    if (typeof window.renderRandomTables === 'function') window.renderRandomTables();
    
    // Karten initialisieren
    if (D.maps && D.maps.length > 0) {
        currentMapId = D.maps[0].id;
    }
    renderMapTabs();
    displayMap();
    initMapPanning();

    // Erweiterte Map-Features (Werkzeuge, Fog, Verbindungen)
    if (typeof initExtendedMapFeatures === 'function') initExtendedMapFeatures();

    // Drag-and-Drop für Initiative initialisieren
    initDragDrop();

    // Sortierbare Listen initialisieren
    initSortableLists();
    
    // Touch-Optimierungen für iPad/Tablet
    initTouchOptimizations();
    
    // Session Timer initialisieren
    initSessionTimer();
    
    // Konflikt-Erkennung initialisieren
    initConflictDetection();
    
    // Editor Paste-Handler für Auto-Clean initialisieren
    initEditorPasteHandlers();

    // Markdown Settings initialisieren
    if (typeof initMarkdownSettings === 'function') initMarkdownSettings();

    // Schwebende Mini-Editor-Toolbar initialisieren
    initFloatingToolbar();

    // Kontext-Toolbars für Tabellen und Links initialisieren
    if (typeof initContextToolbars === 'function') initContextToolbars();

    // Loot Tag-System initialisieren
    if (typeof initLootTagSystem === 'function') initLootTagSystem();

    // Wiki Kategorie-Listener initialisieren
    if (typeof initWikiCategoryListener === 'function') initWikiCategoryListener();
    
    // Sticky-Header-Höhe für Initiative-Controls berechnen
    updateStickyOffsets();
    window.addEventListener('resize', debounce(updateStickyOffsets, 200));
    
    // Encounter-Runde aus Daten laden
    encounterRound = D.initiative?.round || 1;
    
    // Auto-Backup starten
    startAutoBackup();
    
    // Service Worker für Offline-Sync registrieren
    registerServiceWorker();
    
    // Offline-Erkennung initialisieren
    initOfflineDetection();
    
    // PWA Installation
    initPWA();

    // Performance-Monitoring initialisieren
    initPerformanceMonitoring();
    
    // Version anzeigen
    log(`[D&D Tracker] Version ${CURRENT_VERSION}`);
}

function initSortableLists() {
    // Check if drag-and-drop functions are available (loaded from performance-extras.js)
    if (typeof handleDragStart !== 'function') {
        if (APP_CONFIG.DEBUG_MODE) {
            console.log('[init] Drag-and-drop functions not yet loaded, skipping sortable lists');
        }
        return;
    }

    // Party-Liste sortierbar machen
    const partyList = $('party-list');
    if (partyList) {
        partyList.dataset.sortableList = 'characters';
        partyList.addEventListener('dragstart', handleDragStart);
        partyList.addEventListener('dragend', handleDragEnd);
        partyList.addEventListener('dragover', handleDragOver);
        partyList.addEventListener('drop', handleDrop);
    }

    // Quest-Liste
    const questList = $('quest-list');
    if (questList) {
        questList.dataset.sortableList = 'quests';
        questList.addEventListener('dragstart', handleDragStart);
        questList.addEventListener('dragend', handleDragEnd);
        questList.addEventListener('dragover', handleDragOver);
        questList.addEventListener('drop', handleDrop);
    }

    // Encounter-Liste
    const encList = $('encounter-list');
    if (encList) {
        encList.dataset.sortableList = 'encounters';
        encList.addEventListener('dragstart', handleDragStart);
        encList.addEventListener('dragend', handleDragEnd);
        encList.addEventListener('dragover', handleDragOver);
        encList.addEventListener('drop', handleDrop);
    }
}

// ============================================================
// SERVICE WORKER / OFFLINE SYNC
// ============================================================
function registerServiceWorker() {
    // Service Worker funktioniert nur mit http/https, nicht mit file://
    const protocol = window.location.protocol;
    
    if (protocol === 'file:') {
        log('[SW] Lokaler Modus (file://) - Service Worker nicht verfügbar, aber App funktioniert offline via localStorage');
        return;
    }
    
    if (!('serviceWorker' in navigator)) {
        log('[SW] Service Worker nicht unterstützt');
        return;
    }
    
    // Nur bei http/https versuchen
    if (protocol !== 'http:' && protocol !== 'https:') {
        log('[SW] Unbekanntes Protokoll:', protocol);
        return;
    }
    
    // Prüfe ob eine sw.js Datei existiert (für gehostete Versionen)
    fetch('./sw.js', { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => log('[SW] Registriert:', reg.scope))
                    .catch(err => log('[SW] Registrierung fehlgeschlagen:', err.message));
            } else {
                log('[SW] Keine sw.js gefunden - Offline-Modus via localStorage aktiv');
            }
        })
        .catch(() => {
            log('[SW] Offline-Modus via localStorage aktiv');
        });
}

// Offline-Status überwachen (funktioniert auch ohne Service Worker)
function initOfflineDetection() {
    const updateOnlineStatus = () => {
        const indicator = $('offline-indicator');
        if (indicator) {
            if (navigator.onLine) {
                indicator.classList.remove('show');
            } else {
                indicator.classList.add('show');
            }
        }
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
}

// ============================================================
// INDEXEDDB WRAPPER (für größere Datenmengen)
// ============================================================
const IDB_VERSION = 2; // Version erhöht für neuen Index
let idb = null;

async function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(APP_CONFIG.IDB_NAME, IDB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            idb = request.result;
            resolve(idb);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Stores erstellen
            if (!db.objectStoreNames.contains('campaigns')) {
                db.createObjectStore('campaigns', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('backups')) {
                const backupStore = db.createObjectStore('backups', { keyPath: 'id' });
                backupStore.createIndex('date', 'date', { unique: false });
                backupStore.createIndex('campaign', 'campaignKey', { unique: false });
            } else {
                // Store existiert - prüfe ob campaign Index fehlt
                const transaction = event.target.transaction;
                const backupStore = transaction.objectStore('backups');
                if (!backupStore.indexNames.contains('campaign')) {
                    backupStore.createIndex('campaign', 'campaignKey', { unique: false });
                }
            }
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images', { keyPath: 'id' });
            }
        };
    });
}

async function saveToIndexedDB(storeName, data) {
    if (!idb) await initIndexedDB();
    
    return new Promise((resolve, reject) => {
        const transaction = idb.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// IndexedDB Backup wird jetzt von createAutoBackup() verwaltet

// ============================================================
// PREV TURN (für Keyboard Shortcut)
// ============================================================
function prevTurn() {
    if (!D.initiative.combatants.length) return;
    
    pushUndo('Vorheriger Zug');
    
    D.initiative.currentTurn--;
    if (D.initiative.currentTurn < 0) {
        D.initiative.currentTurn = D.initiative.combatants.length - 1;
        if (encounterRound > 1) {
            encounterRound--;
            D.initiative.round = encounterRound;
        }
    }
    
    save();
    renderInit();
}

// HINWEIS: init() wird von loader.js aufgerufen - KEIN automatischer Aufruf hier!