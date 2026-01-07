// [SECTION:AVATARS]
// AVATAR / IMAGE SYSTEM - @avatar @image @portrait
// ============================================================

import { $ } from '@utils/basic';
import { parseEntityId, showToast } from '@utils/utilities';

export function showAvatarModal(type: string, id: number): void {
    const typeEl = $('avatar-target-type') as HTMLInputElement;
    const idEl = $('avatar-target-id') as HTMLInputElement;
    const urlEl = $('avatar-url') as HTMLInputElement;

    if (typeEl) typeEl.value = type;
    if (idEl) idEl.value = String(id);

    const getEntityByTypeAndId = (window as any).getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (urlEl) urlEl.value = entity?.avatar || '';
    previewAvatar();

    const showModal = (window as any).showModal;
    if (showModal) showModal('avatar-modal');
}

export function previewAvatar(): void {
    const urlEl = $('avatar-url') as HTMLInputElement;
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

export function saveAvatar(): void {
    const typeEl = $('avatar-target-type') as HTMLInputElement;
    const idEl = $('avatar-target-id') as HTMLInputElement;
    const urlEl = $('avatar-url') as HTMLInputElement;

    const type = typeEl?.value;
    const id = parseEntityId(idEl?.value);
    const getEntityByTypeAndId = (window as any).getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;

    entity.avatar = urlEl?.value.trim();
    const hideModal = (window as any).hideModal;
    const renderAll = (window as any).renderAll;
    const save = (window as any).save;
    if (hideModal) hideModal('avatar-modal');
    if (renderAll) renderAll();
    if (save) save();
    showToast('Bild gespeichert');
}

export function removeAvatar(): void {
    const typeEl = $('avatar-target-type') as HTMLInputElement;
    const idEl = $('avatar-target-id') as HTMLInputElement;

    const type = typeEl?.value;
    const id = parseEntityId(idEl?.value);
    const getEntityByTypeAndId = (window as any).getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;

    delete entity.avatar;
    const hideModal = (window as any).hideModal;
    const renderAll = (window as any).renderAll;
    const save = (window as any).save;
    if (hideModal) hideModal('avatar-modal');
    if (renderAll) renderAll();
    if (save) save();
    showToast('Bild entfernt');
}

// ============================================================
// ENTITY HELPERS
// ============================================================
export function getEntityByTypeAndId(type: string, id: number): any | null {
    const D = (window as any).D;
    const collections: Record<string, any[]> = {
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
    return collection.find((e: any) => e.id === id) || null;
}

interface EntityLink {
    name: string;
    view: string;
    type: string;
    id: number;
}

export function getEntityLink(type: string, id: number): EntityLink | null {
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return null;

    const views: Record<string, string> = {
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
export function initOfflineMode(): void {
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
        const autoSaveToggle = $('autosave-toggle') as HTMLInputElement;
        if (autoSaveToggle?.checked) {
            const STORAGE_KEY = (window as any).STORAGE_KEY;
            const D = (window as any).D;
            const StorageAPI = (window as any).StorageAPI;
            const key = (window as any).STORAGE_KEY_OVERRIDE || STORAGE_KEY;
            StorageAPI.setJSON(key, D);  // Bereits mit try-catch geschützt
        }
    });
}

// ============================================================
// TOUCH OPTIMIZATIONS
// ============================================================
export function initTouchOptimizations(): void {
    // Detect touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('touch-device');
    }

    // Prevent double-tap zoom on buttons
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e: TouchEvent) {
        const now = Date.now();
        const target = e.target as HTMLElement;
        if (now - lastTouchEnd < 300 && target.closest('button, .btn, .nav-tab')) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // Improve touch scrolling in modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('touchmove', function(e: Event) {
            e.stopPropagation();
        }, { passive: true });
    });

    // Add touch-friendly tap feedback
    document.addEventListener('touchstart', function(e: TouchEvent) {
        const target = e.target as HTMLElement;
        const btn = target.closest('.btn, .nav-tab, .dice-btn');
        if (btn) btn.classList.add('touch-active');
    }, { passive: true });

    document.addEventListener('touchend', function(e: TouchEvent) {
        document.querySelectorAll('.touch-active').forEach(el => {
            el.classList.remove('touch-active');
        });
    }, { passive: true });
}
