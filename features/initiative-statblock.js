// [SECTION:INITIATIVE_STATBLOCK]
// ============================================================
// STATBLOCK-DRAWER fuer Initiative-Ansicht (INIT-01)
// Analog: showConcentrationModal() in features/initiative.js:622
// Analog: renderBestiaryDetail() in features/bestiary/bestiary-render.js:218
// Kein direkter Aufruf von renderBestiaryDetail() — tab-spezifisch (RESEARCH.md Falle 1)
//   renderBestiaryDetail() sucht #bestiary-detail-panel (Bestiary-Tab) -> stilles Scheitern
// statblockRef.id ist String ('goblin') — KEIN parseEntityId() (RESEARCH.md Falle 2)
// sanitizeHTML() ZUERST, dann renderClickableDice() — in renderStatblockHTML() (RESEARCH.md Falle 3)
// renderStatblockHTML() ist jetzt in bestiary-render.js (DRY, shared source of truth)
// ============================================================

// ============================================================
// RENDERBASICOMBATANTINFO — Basis-Infos fuer Kombattanten ohne statblockRef (D-03)
// esc() fuer alle D-Werte (CLAUDE.md XSS-Regel)
// ============================================================

/**
 * Rendert Basis-Infos (HP/AC/Name/Effekte) fuer Spieler- und manuelle Kombattanten.
 * Wird angezeigt wenn kein statblockRef vorhanden oder das Monster nicht gefunden wird.
 * @param {object} cb - Kombattant-Objekt aus D.initiative.combatants
 * @returns {string} HTML-String fuer Basis-Info-Panel
 */
function renderBasicCombatantInfo(cb) {
    var effectsHtml = '';
    if (typeof window.renderCombatantEffects === 'function') {
        effectsHtml = window.renderCombatantEffects(cb) || '';
    }
    return '<div class="init-statblock-basic">' +
        '<div class="init-statblock-name">' + esc(cb.name) + ' — Basisinfos</div>' +
        '<div class="init-statblock-basic-body">' +
            '<p><strong>TP:</strong> ' + esc(String(cb.currentHp || 0)) + '/' + esc(String(cb.maxHp || 0)) + '</p>' +
            '<p><strong>RK:</strong> ' + esc(String(cb.ac || 10)) + '</p>' +
            (effectsHtml ? '<div class="init-statblock-effects"><strong>Effekte:</strong> ' + effectsHtml + '</div>' : '') +
        '</div>' +
        '<div class="init-statblock-empty">' +
            (effectsHtml ? '' : 'Keine weiteren Daten verf\xfcgbar.') +
        '</div>' +
    '</div>';
}

// ============================================================
// SHOWINISTATBLOCKPANEL — Drawer anzeigen (D-01/D-02)
// Analog: showConcentrationModal() initiative.js:622-689
// Pattern: Dynamisch erstelltes .modal-overlay-Element (PATTERNS.md)
// ============================================================

/**
 * Oeffnet den Statblock-Drawer fuer einen Kombattanten.
 * Erstellt das Drawer-Element bei erstem Aufruf (dynamisch, wie concentration-modal).
 * Bei statblockRef: vollstaendiger Statblock via window.renderStatblockHTML() (DRY aus bestiary-render.js).
 * Ohne statblockRef oder bei Fehler: Basis-Infos via renderBasicCombatantInfo() (D-03).
 * @param {number|string} cbId - ID des Kombattanten
 */
function showInitStatblockPanel(cbId) {
    var cb = window.getCombatant ? window.getCombatant(cbId) : null;
    if (!cb) return;

    var panel = window.$ ? window.$('init-statblock-panel') : document.getElementById('init-statblock-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'init-statblock-panel';
        panel.className = 'modal-overlay init-statblock-drawer';
        // Schliessen-Button (data-action greift ueber Event-Delegation) + Inhalt.
        // Der Button ist Panel-Kind (nicht in .init-statblock-content), damit er
        // beim Neu-Setzen von content.innerHTML erhalten bleibt.
        panel.innerHTML =
            '<button class="init-statblock-close" data-action="close-init-statblock" title="Schlie\xdfen" aria-label="Schlie\xdfen">✕</button>' +
            '<div class="init-statblock-content"></div>';
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
            // getBestiaryMonster(id, source) aus bestiary-actions.js vergleicht mit String-Gleichheit
            var monster = window.getBestiaryMonster
                ? window.getBestiaryMonster(cb.statblockRef.id, cb.statblockRef.source)
                : null;
            if (monster && typeof window.renderStatblockHTML === 'function') {
                content.innerHTML = window.renderStatblockHTML(monster, cb.statblockRef.source);
            } else {
                // Monster nicht gefunden: Fallback auf Basisinfos (UI-SPEC Fehlerfall)
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
// renderStatblockHTML: in bestiary-render.js exportiert (window.renderStatblockHTML)
// ============================================================

window.showInitStatblockPanel  = showInitStatblockPanel;
window.closeInitStatblockPanel = closeInitStatblockPanel;
window.renderBasicCombatantInfo = renderBasicCombatantInfo;
