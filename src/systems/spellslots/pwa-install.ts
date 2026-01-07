// [SECTION:PWA_INSTALL]
// Extrahiert aus spellslots.js
// PWA Install Prompt
// Zeilen: 65

import { $, StorageAPI } from '@utils/basic';
import { showToast } from '@utils/utilities';

// PWA INSTALL PROMPT
// ============================================================

// BeforeInstallPromptEvent is not standard, type as any
let deferredPrompt: any = null;

export function initPWA(): void {
    // Prüfe ob bereits installiert
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA] App läuft im Standalone-Modus');
        return;
    }

    // beforeinstallprompt Event abfangen
    window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        deferredPrompt = e;

        // Zeige Install-Banner nach 30 Sekunden
        setTimeout(() => {
            if (deferredPrompt && !StorageAPI.has('pwa-dismissed')) {
                showPWABanner();
            }
        }, 30000);
    });

    // App installed Event
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App wurde installiert');
        deferredPrompt = null;
        hidePWABanner();
    });
}

export function showPWABanner(): void {
    const banner = $('pwa-install-banner');
    if (banner) banner.classList.add('show');
}

export function hidePWABanner(): void {
    const banner = $('pwa-install-banner');
    if (banner) banner.classList.remove('show');
}

export function dismissPWABanner(): void {
    hidePWABanner();
    StorageAPI.set('pwa-dismissed', 'true');
}

export async function installPWA(): Promise<void> {
    if (!deferredPrompt) {
        showToast('Installation nicht verfügbar');
        return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
        showToast('🎉 App wird installiert!');
    }

    deferredPrompt = null;
    hidePWABanner();
}

// ============================================================
