// [SECTION:AVATARS]
// AVATAR / IMAGE SYSTEM - @avatar @image @portrait
// ============================================================
function showAvatarModal(type, id) {
    $('avatar-target-type').value = type;
    $('avatar-target-id').value = id;
    
    const entity = getEntityByTypeAndId(type, id);
    $('avatar-url').value = entity?.avatar || '';
    previewAvatar();
    
    showModal('avatar-modal');
}

function previewAvatar() {
    const url = $('avatar-url').value.trim();
    const preview = $('avatar-preview');
    
    if (url) {
        preview.innerHTML = `<img src="${esc(url)}" class="avatar avatar-xl" onerror="this.parentElement.innerHTML='❌'">`;
    } else {
        preview.innerHTML = '?';
        preview.className = 'avatar avatar-xl avatar-placeholder';
    }
}

function saveAvatar() {
    const type = $('avatar-target-type').value;
    const id = parseInt($('avatar-target-id').value);
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;
    
    entity.avatar = $('avatar-url').value.trim();
    hideModal('avatar-modal');
    renderAll();
    save();
    showToast('Bild gespeichert');
}

function removeAvatar() {
    const type = $('avatar-target-type').value;
    const id = parseInt($('avatar-target-id').value);
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;
    
    delete entity.avatar;
    hideModal('avatar-modal');
    renderAll();
    save();
    showToast('Bild entfernt');
}

// ============================================================
// ENTITY HELPERS
// ============================================================
function getEntityByTypeAndId(type, id) {
    const collections = {
        'character': D.characters,
        'characters': D.characters,
        'npc': D.npcs,
        'npcs': D.npcs,
        'location': D.locations,
        'locations': D.locations,
        'quest': D.quests,
        'quests': D.quests,
        'encounter': D.encounters,
        'encounters': D.encounters,
        'spell': D.spells,
        'spells': D.spells,
        'loot': D.loot,
        'item': D.loot,
        'items': D.loot,
        'wiki': D.wiki,
        'combatant': D.initiative?.combatants || []
    };
    const collection = collections[type];
    if (!collection || !Array.isArray(collection)) return null;
    return collection.find(e => e.id === id) || null;
}

function getEntityLink(type, id) {
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return null;
    
    const views = {
        'character': 'party',
        'npc': 'npcs', 
        'location': 'locations',
        'quest': 'quests',
        'encounter': 'encounter'
    };
    
    return { name: entity.name || entity.title, view: views[type], type, id };
}

// ============================================================
// OFFLINE MODE
// ============================================================
function initOfflineMode() {
    // Check online status
    function updateOnlineStatus() {
        const indicator = $('offline-indicator');
        if (indicator) {
            indicator.classList.toggle('visible', !navigator.onLine);
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    
    // Service Worker: Blob-URLs funktionieren nicht in modernen Browsern
    // Stattdessen: Cache wichtige Daten im localStorage (bereits implementiert)
    // Für echten Offline-Support müsste sw.js als separate Datei gehostet werden
    
    // Fallback: Speichere kritische Daten zusätzlich
    window.addEventListener('beforeunload', () => {
        if ($('autosave-toggle')?.checked) {
            const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
            StorageAPI.setJSON(key, D);  // Bereits mit try-catch geschützt
        }
    });
}

// ============================================================
// TOUCH OPTIMIZATIONS
// ============================================================
function initTouchOptimizations() {
    // Detect touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('touch-device');
    }
    
    // Prevent double-tap zoom on buttons
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd < 300 && e.target.closest('button, .btn, .nav-tab')) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
    
    // Improve touch scrolling in modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('touchmove', function(e) {
            e.stopPropagation();
        }, { passive: true });
    });
    
    // Add touch-friendly tap feedback
    document.addEventListener('touchstart', function(e) {
        const btn = e.target.closest('.btn, .nav-tab, .dice-btn');
        if (btn) btn.classList.add('touch-active');
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        document.querySelectorAll('.touch-active').forEach(el => {
            el.classList.remove('touch-active');
        });
    }, { passive: true });
}