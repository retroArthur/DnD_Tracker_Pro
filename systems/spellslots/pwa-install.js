// [SECTION:PWA_INSTALL]
// Extrahiert aus spellslots.js
// PWA Install Prompt
// Zeilen: 65
// PWA INSTALL PROMPT
// ============================================================
// BeforeInstallPromptEvent is not standard, type as any
let deferredPrompt = null;
function initPWA() {
    // Prüfe ob bereits installiert
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA] App läuft im Standalone-Modus');
        return;
    }
    // beforeinstallprompt Event abfangen
    window.addEventListener('beforeinstallprompt', e => {
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
function showPWABanner() {
    const banner = $('pwa-install-banner');
    if (banner) banner.classList.add('show');
}
function hidePWABanner() {
    const banner = $('pwa-install-banner');
    if (banner) banner.classList.remove('show');
}
function dismissPWABanner() {
    hidePWABanner();
    StorageAPI.set('pwa-dismissed', 'true');
}
async function installPWA() {
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
