// [SECTION:AVATARS]
// AVATAR / IMAGE SYSTEM - @avatar @image @portrait
// ============================================================
// URL VALIDATION
// ============================================================
function validateAvatarURL(url) {
    if (!url || url.trim() === '') return true; // Empty is valid (will be removed)
    const trimmed = url.trim();
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'file:', 'vbscript:', 'data:text/html'];
    const lowerUrl = trimmed.toLowerCase();
    if (dangerousProtocols.some(proto => lowerUrl.startsWith(proto))) {
        return false;
    }
    // Allow relative paths
    if (trimmed.startsWith('/') || trimmed.startsWith('.')) {
        return true;
    }
    // Allow data: URLs for images only (base64 encoded images)
    if (lowerUrl.startsWith('data:image/')) {
        return true;
    }
    // Validate absolute URLs
    try {
        const parsed = new URL(trimmed);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        // If it's not a valid URL and doesn't start with /, assume it's relative
        return !trimmed.includes(':'); // No protocol = relative path
    }
}
// ============================================================
// AVATAR MODAL
// ============================================================
function showAvatarModal(type, id) {
    const typeEl = $('avatar-target-type');
    const idEl = $('avatar-target-id');
    const urlEl = $('avatar-url');
    if (typeEl) typeEl.value = type;
    if (idEl) idEl.value = String(id);
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (urlEl) urlEl.value = entity?.avatar || '';
    previewAvatar();
    const showModal = window.showModal;
    if (showModal) showModal('avatar-modal');
}
function previewAvatar() {
    const urlEl = $('avatar-url');
    const preview = $('avatar-preview');
    if (!preview) return;
    const url = urlEl?.value.trim();
    if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.className = 'avatar avatar-xl';
        img.addEventListener('error', () => {
            preview.innerHTML = '';
            preview.textContent = '❌';
        });
        preview.innerHTML = '';
        preview.appendChild(img);
    } else {
        preview.innerHTML = '?';
        preview.className = 'avatar avatar-xl avatar-placeholder';
    }
}
function saveAvatar() {
    const typeEl = $('avatar-target-type');
    const idEl = $('avatar-target-id');
    const urlEl = $('avatar-url');
    const type = typeEl?.value;
    const id = parseEntityId(idEl?.value);
    const url = urlEl?.value.trim();
    // Validate URL for security
    if (!validateAvatarURL(url)) {
        showToast(
            '❌ Ungültige URL: Nur http(s), data:image/ oder relative Pfade erlaubt',
            'error'
        );
        return;
    }
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;
    entity.avatar = url;
    const hideModal = window.hideModal;
    const renderAll = window.renderAll;
    const save = window.save;
    if (hideModal) hideModal('avatar-modal');
    if (renderAll) renderAll();
    if (save) save();
    showToast('Bild gespeichert');
}
function removeAvatar() {
    const typeEl = $('avatar-target-type');
    const idEl = $('avatar-target-id');
    const type = typeEl?.value;
    const id = parseEntityId(idEl?.value);
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;
    delete entity.avatar;
    const hideModal = window.hideModal;
    const renderAll = window.renderAll;
    const save = window.save;
    if (hideModal) hideModal('avatar-modal');
    if (renderAll) renderAll();
    if (save) save();
    showToast('Bild entfernt');
}
// ============================================================
// ENTITY HELPERS
// ============================================================
function getEntityByTypeAndId(type, id) {
    const D = window.D;
    const collections = {
        character: D.characters,
        characters: D.characters,
        npc: D.npcs,
        npcs: D.npcs,
        location: D.locations,
        locations: D.locations,
        quest: D.quests,
        quests: D.quests,
        encounter: D.encounters,
        encounters: D.encounters,
        spell: D.spells,
        spells: D.spells,
        loot: D.loot,
        item: D.loot,
        items: D.loot,
        wiki: D.wiki,
        combatant: D.initiative?.combatants || []
    };
    const collection = collections[type];
    if (!collection || !Array.isArray(collection)) return null;
    return collection.find(e => e.id === id) || null;
}
function getEntityLink(type, id) {
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return null;
    const views = {
        character: 'party',
        npc: 'npcs',
        location: 'locations',
        quest: 'quests',
        encounter: 'encounter'
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
        // Toggle ist optional: existiert er und ist ungecheckt → Save überspringen.
        // Fehlt das Toggle → speichere (Default = aktiv).
        const autoSaveToggle = $('autosave-toggle');
        if (autoSaveToggle && !autoSaveToggle.checked) return;
        const STORAGE_KEY = window.STORAGE_KEY;
        const D = window.D;
        const StorageAPI = window.StorageAPI;
        const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
        StorageAPI.setJSON(key, D); // Bereits mit try-catch geschützt
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
    document.addEventListener(
        'touchend',
        function (e) {
            const now = Date.now();
            const target = e.target;
            if (now - lastTouchEnd < 300 && target.closest('button, .btn, .nav-tab')) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        },
        { passive: false }
    );
    // Improve touch scrolling in modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener(
            'touchmove',
            function (e) {
                e.stopPropagation();
            },
            { passive: true }
        );
    });
    // Add touch-friendly tap feedback
    document.addEventListener(
        'touchstart',
        function (e) {
            const target = e.target;
            const btn = target.closest('.btn, .nav-tab, .dice-btn');
            if (btn) btn.classList.add('touch-active');
        },
        { passive: true }
    );
    document.addEventListener(
        'touchend',
        function (e) {
            document.querySelectorAll('.touch-active').forEach(el => {
                el.classList.remove('touch-active');
            });
        },
        { passive: true }
    );
}
