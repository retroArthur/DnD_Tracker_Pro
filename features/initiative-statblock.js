// [SECTION:INITIATIVE_STATBLOCK]
// ============================================================
// STATBLOCK-DRAWER fuer Initiative-Ansicht (INIT-01)
// Analog: showConcentrationModal() in features/initiative.js:622
// Analog: renderBestiaryDetail() in features/bestiary/bestiary-render.js:218
// Kein direkter Aufruf von renderBestiaryDetail() — tab-spezifisch (RESEARCH.md Falle 1)
//   renderBestiaryDetail() sucht #bestiary-detail-panel (Bestiary-Tab) → stilles Scheitern
// statblockRef.id ist String ('goblin') — KEIN parseEntityId() (RESEARCH.md Falle 2)
// sanitizeHTML() ZUERST, dann renderClickableDice() (RESEARCH.md Falle 3)
// ============================================================

// ============================================================
// RENDERSTATBLOCKHTML — Reiner HTML-String-Renderer (D-04)
// Analog: renderBestiaryDetail() Zeilen 349-423, aber ohne DOM-Zugriff
// Wave 1 fuellt die vollstaendige Implementierung.
// ============================================================

/**
 * Gibt einen HTML-String fuer den vollstaendigen Statblock zurueck.
 * Kein DOM-Zugriff — Caller schreibt in panel.innerHTML.
 * Wave 1 fuellt: sanitizeHTML(text) -> renderClickableDice(sanitized) Reihenfolge beibehalten.
 * @returns {string} HTML-String fuer Statblock-Inhalt
 */
function renderStatblockHTML(monster, source) {
    // Wave 1 fills implementation (vollstaendige Statblock-Sektionen 1-20)
    // WICHTIG: sanitizeHTML() ZUERST, dann renderClickableDice() — Reihenfolge bindend (RESEARCH.md Falle 3)
    return '';
}

// ============================================================
// RENDERBASICOMBATANTINFO — Basis-Infos fuer Kombattanten ohne statblockRef (D-03)
// ============================================================

/**
 * Rendert Basis-Infos (HP/AC/Name) fuer Spieler- und manuelle Kombattanten.
 * esc() fuer alle D-Werte (CLAUDE.md XSS-Regel).
 * @returns {string} HTML-String fuer Basis-Info-Panel
 */
function renderBasicCombatantInfo(cb) {
    // Wave 1 fills implementation
    // esc() fuer alle Felder die aus D kommen (CLAUDE.md XSS-Regel)
    return '';
}

// ============================================================
// SHOWINISTATBLOCKPANEL — Drawer anzeigen (D-01/D-02)
// Analog: showConcentrationModal() initiative.js:622-689
// Pattern: Dynamisch erstelltes .modal-overlay-Element (PATTERNS.md)
// ============================================================

/**
 * Oeffnet den Statblock-Drawer fuer einen Kombattanten.
 * Erstellt das Drawer-Element bei erstem Aufruf (dynamisch, wie concentration-modal).
 * Bei statblockRef: vollstaendiger Statblock via renderStatblockHTML().
 * Ohne statblockRef: Basis-Infos via renderBasicCombatantInfo() (D-03).
 */
function showInitStatblockPanel(cbId) {
    var cb = window.getCombatant ? window.getCombatant(cbId) : null;
    if (!cb) return;

    var panel = window.$ ? window.$('init-statblock-panel') : document.getElementById('init-statblock-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'init-statblock-panel';
        panel.className = 'modal-overlay init-statblock-drawer';
        panel.innerHTML = '<div class="init-statblock-content"></div>';
        // Overlay-Klick schliesst Drawer (analog concentration-modal Zeile 674)
        panel.addEventListener('click', function(e) {
            if (e.target === panel) closeInitStatblockPanel();
        });
        document.body.appendChild(panel);
    }

    var content = panel.querySelector('.init-statblock-content');
    if (content) {
        if (cb.statblockRef) {
            // statblockRef.id ist String ('goblin') — KEIN parseEntityId() verwenden! (RESEARCH.md Falle 2)
            var monster = window.getBestiaryMonster ? window.getBestiaryMonster(cb.statblockRef.id, cb.statblockRef.source) : null;
            if (monster) {
                content.innerHTML = renderStatblockHTML(monster, cb.statblockRef.source);
            } else {
                content.innerHTML = renderBasicCombatantInfo(cb);
            }
        } else {
            content.innerHTML = renderBasicCombatantInfo(cb);
        }
    }
    panel.classList.add('show');
}

// ============================================================
// CLOSEINISTATBLOCKPANEL — Drawer schliessen
// ============================================================

/**
 * Schliesst den Statblock-Drawer (entfernt .show-Klasse).
 */
function closeInitStatblockPanel() {
    var panel = window.$ ? window.$('init-statblock-panel') : document.getElementById('init-statblock-panel');
    if (panel) panel.classList.remove('show');
}

// ============================================================
// WINDOW-EXPORTS (analog initiative.js Zeilen 1370-1379)
// renderStatblockHTML wird intern genutzt (Wave 1 exportiert wenn noetig)
// ============================================================

window.showInitStatblockPanel  = showInitStatblockPanel;
window.closeInitStatblockPanel = closeInitStatblockPanel;
