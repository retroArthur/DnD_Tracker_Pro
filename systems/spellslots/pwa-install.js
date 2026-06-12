// [SECTION:PWA_INSTALL]
// PWA Install Prompt + SW-Update-Hinweis (D-03, D-05)
// Plan 02-02: Header-Install-Button + showSWUpdateHint
// Zeilen: ~120
// ============================================================

let deferredPrompt = null;

function initPWA() {
    // Prüfe ob bereits installiert
    if (window.matchMedia('(display-mode: standalone)').matches) {
        log('[PWA] App läuft im Standalone-Modus');
        return;
    }
    // beforeinstallprompt Event abfangen
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        // Zeige Header-Install-Button (D-05) — nur wenn noch nicht installiert
        if (!StorageAPI.has('pwa-installed')) {
            const btn = window.$('pwa-install-btn');
            if (btn) btn.style.display = 'flex';
        }
    });
    // App installed Event
    window.addEventListener('appinstalled', () => {
        log('[PWA] App wurde installiert');
        deferredPrompt = null;
        StorageAPI.set('pwa-installed', 'true');
        // Header-Button dauerhaft ausblenden
        const btn = window.$('pwa-install-btn');
        if (btn) btn.style.display = 'none';
    });
}

async function installPWA() {
    if (!deferredPrompt) {
        showToast('Installation nicht verfügbar');
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        showToast('App wird installiert!');
    }
    deferredPrompt = null;
    const btn = window.$('pwa-install-btn');
    if (btn) btn.style.display = 'none';
}

/**
 * window.showSWUpdateHint(newSW) — Vertrag für core/init.js
 * Zeigt einmalig pro Sitzung die Update-Hinweis-Leiste (.pwa-update-banner).
 * D-03: Kein erzwungener Reload; nur auf expliziten Nutzer-Klick.
 */
function showSWUpdateHint(newSW) {
    // Einmalig pro Session (sessionStorage-Guard)
    if (sessionStorage.getItem('sw-update-shown')) return;
    sessionStorage.setItem('sw-update-shown', '1');

    // Banner erstellen (falls nicht im DOM vorhanden)
    let banner = window.$('pwa-update-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'pwa-update-banner';
        banner.className = 'pwa-update-banner';
        banner.setAttribute('role', 'status');
        banner.setAttribute('aria-live', 'polite');
        banner.innerHTML = [
            '<span class="pwa-update-text">Neue Version verfügbar</span>',
            '<div class="pwa-update-actions">',
            '  <button class="btn btn-sm pwa-update-reload" data-action="pwa-reload">Jetzt neu laden</button>',
            '  <button class="btn btn-sm pwa-update-dismiss" data-action="pwa-dismiss">Jetzt nicht</button>',
            '</div>'
        ].join('');
        document.body.appendChild(banner);
    }

    // Primär-Button: SKIP_WAITING senden + reload
    const reloadBtn = banner.querySelector('[data-action="pwa-reload"]');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
            if (newSW) {
                newSW.postMessage({ type: 'SKIP_WAITING' });
            }
            window.location.reload();
        });
    }

    // Sekundär-Button: Banner schließen
    const dismissBtn = banner.querySelector('[data-action="pwa-dismiss"]');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            banner.style.display = 'none';
        });
    }

    // Banner einblenden
    banner.style.display = 'flex';
}

// Selbst-Registrierung der data-action "install-pwa" (Welle-2-Konfliktfreiheit, D-05)
// Kein Edit von ui/actions/system-actions.js nötig
if (typeof EventDelegation !== 'undefined') {
    EventDelegation.registerAction('install-pwa', () => {
        if (typeof window.installPWA === 'function') window.installPWA();
    });
}

// Exports
window.initPWA = initPWA;
window.installPWA = installPWA;
window.showSWUpdateHint = showSWUpdateHint;
// ============================================================
