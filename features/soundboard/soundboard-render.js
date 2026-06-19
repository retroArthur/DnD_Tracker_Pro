// [SECTION:SOUNDBOARD_RENDER]
// Render-Funktionen fuer Soundboard-Tab (Phase 7 — UX-01)
// Echte UI (Szenenlist, Audio-Bibliothek, Lautstaerke-Schieberegler) folgt in 07-02.

/**
 * renderSoundboard — defensive Platzhalter-Render fuer Wave-0.
 * Registriert im TAB_RENDER_REGISTRY; 07-02 fuellt echten Inhalt ein.
 */
function renderSoundboard() {
    var c = $('soundboard-container');
    if (!c) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderSoundboard] Container #soundboard-container nicht gefunden — nicht auf Soundboard-Tab?');
        }
        return;
    }
    c.innerHTML = '<p style="color: var(--text-dim); text-align: center; padding: 2rem;">🔊 Soundboard — wird in Phase 7-02 implementiert.</p>';
}

window.renderSoundboard = renderSoundboard;
