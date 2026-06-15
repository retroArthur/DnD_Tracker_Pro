// [SECTION:FRAKTIONEN_RENDER]
// Fraktionen & Ruf-System — Render-Modul (WELT-05)
// Wave 0: Skelett mit defensivem Container-Check
// Implementierung: Plan 05-07
// ============================================================
// Verwendete Globals: window.D, esc

/**
 * Ruf-Stufen-Definition (−50 bis +50).
 * @type {Array<{min: number, max: number, label: string, icon: string, farbe: string}>}
 */
const FRAKTIONS_RUF_STUFEN = [
    { min: -50, max: -21, label: 'Feindlich',    icon: '🔴', farbe: 'var(--red)'   },
    { min: -20, max:  -1, label: 'Misstrauisch', icon: '🟠', farbe: 'var(--yellow)'},
    { min:   0, max:   0, label: 'Neutral',       icon: '⚪', farbe: 'var(--text)'  },
    { min:   1, max:  20, label: 'Freundlich',    icon: '🟡', farbe: 'var(--gold)'  },
    { min:  21, max:  50, label: 'Verbündet',     icon: '🟢', farbe: 'var(--green)' }
];

/**
 * Gibt die Ruf-Stufe für einen Rufwert zurück.
 * @param {number} rufwert
 * @returns {{min, max, label, icon, farbe}}
 */
function rufStufe(rufwert) {
    return FRAKTIONS_RUF_STUFEN.find(function(s) {
        return rufwert >= s.min && rufwert <= s.max;
    }) || FRAKTIONS_RUF_STUFEN[2]; // Fallback: Neutral
}

/**
 * Rendert die Fraktions-Übersichtsliste.
 * Stub: Wave 0 — leere Platzhalter-Ansicht.
 */
function renderFraktionen() {
    const container = $('view-fraktionen');
    if (!container) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderFraktionen] Container #view-fraktionen fehlt — nicht auf fraktionen-Tab');
        }
        return;
    }
    // Wave 0 Platzhalter — wird in Plan 05-07 durch echtes Rendering ersetzt
    const fraktionen = (window.D && window.D.factions) ? window.D.factions : [];
    if (fraktionen.length === 0) {
        container.innerHTML = '<div class="fr-empty-state"><p>Noch keine Fraktionen angelegt. Klicke auf „+ Neue Fraktion".</p></div>';
    } else {
        container.innerHTML = '<div class="fr-list" id="fraktionen-list"></div>';
    }
}

window.FRAKTIONS_RUF_STUFEN = FRAKTIONS_RUF_STUFEN;
window.rufStufe = rufStufe;
window.renderFraktionen = renderFraktionen;
