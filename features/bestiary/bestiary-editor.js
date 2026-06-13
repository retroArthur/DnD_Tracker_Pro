// [SECTION:BESTIARY_EDITOR]
// ============================================================
// BESTIARY EDITOR — Eigene Kreaturen anlegen und bearbeiten
// Analog: features/encounters/encounters-crud.js → editEnc()
// Feld-IDs: bst-* (verhindert Kollision mit enc-* im Encounter-Tab)
// ============================================================

// Tracks the avatar URL being set for the creature currently in the editor
var _bstEditorAvatarUrl = '';

// ============================================================
// ATTRIBUTE MODIFIER DISPLAY
// ============================================================
function updateBstAttrMod(ctx) {
    var attr = ctx.target ? ctx.target.dataset.attr : (ctx.attr || '');
    if (!attr) return;
    var inputEl = window.$('bst-' + attr);
    var modEl = window.$('bst-' + attr + '-mod');
    if (!inputEl || !modEl) return;
    var val = parseInt(inputEl.value) || 10;
    var mod = Math.floor((val - 10) / 2);
    modEl.textContent = (mod >= 0 ? '+' : '') + mod;
}

function updateAllBstAttrMods() {
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function(attr) {
        updateBstAttrMod({ attr: attr });
    });
}

// ============================================================
// AVATAR HELPERS (D-10 — custom creatures only)
// ============================================================
function openBstAvatarModal() {
    // Show inline URL input instead of the global avatar modal
    // (avatar modal requires a saved entity id; new creatures don't have one yet)
    var url = window.prompt('Portrait-URL eingeben (leer lassen zum Entfernen):', _bstEditorAvatarUrl || '');
    if (url === null) return; // cancelled
    url = url.trim();
    if (url && !validateAvatarUrlSafe(url)) {
        window.showToast('⚠️ Ungültige oder unsichere URL', 'error');
        return;
    }
    _bstEditorAvatarUrl = url;
    refreshBstAvatarPreview();
}

function validateAvatarUrlSafe(url) {
    // Delegates to avatars.js validateAvatarURL if available
    if (typeof window.validateAvatarURL === 'function') {
        return window.validateAvatarURL(url);
    }
    // Fallback minimal check
    var lower = url.toLowerCase();
    var dangerous = ['javascript:', 'vbscript:', 'data:text/html'];
    return !dangerous.some(function(p) { return lower.startsWith(p); });
}

function clearBstAvatar() {
    _bstEditorAvatarUrl = '';
    refreshBstAvatarPreview();
}

function refreshBstAvatarPreview() {
    var preview = window.$('bst-avatar-preview');
    var clearBtn = window.$('bst-avatar-clear');
    if (preview) {
        if (_bstEditorAvatarUrl) {
            preview.src = _bstEditorAvatarUrl;
            preview.style.display = '';
        } else {
            preview.src = '';
            preview.style.display = 'none';
        }
    }
    if (clearBtn) {
        clearBtn.style.display = _bstEditorAvatarUrl ? '' : 'none';
    }
}

// ============================================================
// OPEN BESTIARY EDITOR
// id (optional): numeric id of custom creature to edit.
// No id (or falsy): create-mode — clears all fields.
// ============================================================
function openBestiaryEditor(ctx) {
    // The 'call' action in ui-actions.js dispatches: window[value](ctx.id)
    // where ctx.id = parseEntityId(target.dataset.id) — a number or null.
    // Also supports direct calls: openBestiaryEditor(id) or openBestiaryEditor().
    var id = null;
    if (ctx !== undefined && ctx !== null && ctx !== '' && ctx !== 0) {
        if (typeof ctx === 'number') {
            id = ctx; // numeric id from 'call' action dispatch
        } else if (typeof ctx === 'string' && ctx.trim() !== '') {
            id = ctx;
        }
        // null/0/undefined → create mode
    }

    var idInput = window.$('bst-edit-id');
    var titleEl = window.$('bestiary-editor-title');
    var avatarSection = window.$('bst-avatar-section');

    // Reset avatar state
    _bstEditorAvatarUrl = '';

    if (id) {
        // ---- EDIT MODE ----
        var numId = parseEntityId(id);
        var creature = null;
        var bestiary = window.D && window.D.bestiary ? window.D.bestiary : [];
        for (var i = 0; i < bestiary.length; i++) {
            if (bestiary[i].id === numId) { creature = bestiary[i]; break; }
        }
        if (!creature) {
            if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
                console.warn('[openBestiaryEditor] Kreatur nicht gefunden id=' + id);
            }
            return;
        }

        if (idInput) idInput.value = String(id);
        if (titleEl) titleEl.textContent = 'Kreatur bearbeiten';

        // Basic fields
        var nameEl = window.$('bst-name');
        if (nameEl) nameEl.value = creature.name || '';
        setBstSelectValue('bst-size', creature.size || 'Mittelgroß');
        var typeEl = window.$('bst-type');
        if (typeEl) typeEl.value = creature.creatureType || '';
        var alignEl = window.$('bst-alignment');
        if (alignEl) alignEl.value = creature.alignment || '';
        var crEl = window.$('bst-cr');
        if (crEl) crEl.value = String(creature.cr || '1');
        var xpEl = window.$('bst-xp');
        if (xpEl) xpEl.value = String(creature.xp || 0);

        // Combat values
        var acEl = window.$('bst-ac');
        if (acEl) acEl.value = String(creature.ac || 10);
        var acInfoEl = window.$('bst-ac-info');
        if (acInfoEl) acInfoEl.value = creature.acInfo || '';
        var hpEl = window.$('bst-hp');
        if (hpEl) hpEl.value = String(creature.hp || 0);
        var hpFrmEl = window.$('bst-hp-formula');
        if (hpFrmEl) hpFrmEl.value = creature.hpFormula || '';

        // Speed
        var spd = creature.speed || {};
        setBstInput('bst-speed-walk',   spd.walk || '');
        setBstInput('bst-speed-fly',    spd.fly  || '');
        setBstInput('bst-speed-swim',   spd.swim || '');
        setBstInput('bst-speed-climb',  spd.climb || '');
        setBstInput('bst-speed-burrow', spd.burrow || '');

        // Attributes
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function(attr) {
            var el = window.$('bst-' + attr);
            if (el) el.value = String(creature[attr] || 10);
        });
        updateAllBstAttrMods();

        // Saving throws
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function(attr) {
            var cb = window.$('bst-save-' + attr);
            var val = window.$('bst-save-val-' + attr);
            var saveData = creature.savingThrows ? creature.savingThrows[attr] : undefined;
            var isActive = saveData === true || (typeof saveData === 'string' && saveData.length > 0);
            if (cb) cb.checked = isActive;
            if (val) val.value = typeof saveData === 'string' ? saveData : '';
        });

        // Senses & Languages (stored as arrays)
        setBstInput('bst-senses',    Array.isArray(creature.senses)    ? creature.senses.join(', ')    : (creature.senses || ''));
        setBstInput('bst-languages', Array.isArray(creature.languages) ? creature.languages.join(', ') : (creature.languages || ''));

        // Rich-text fields (stored as sanitized HTML strings for custom creatures)
        setBstRichEditor('bst-traits',    creature.traits || '');
        setBstRichEditor('bst-actions',   creature.actions || '');
        setBstRichEditor('bst-reactions', creature.reactions || '');
        setBstRichEditor('bst-legendary', creature.legendaryActions || '');

        var legCountEl = window.$('bst-legendary-count');
        if (legCountEl) legCountEl.value = String(creature.legendaryActionsPerRound || 3);

        // Avatar
        _bstEditorAvatarUrl = creature.avatar || '';
        if (avatarSection) avatarSection.style.display = '';
        refreshBstAvatarPreview();

    } else {
        // ---- CREATE MODE ----
        if (idInput) idInput.value = '';
        if (titleEl) titleEl.textContent = 'Neue Kreatur';

        // Clear all fields
        setBstInput('bst-name', '');
        setBstSelectValue('bst-size', 'Mittelgroß');
        setBstInput('bst-type', 'Humanoid');
        setBstInput('bst-alignment', '');
        setBstInput('bst-cr', '1');
        setBstInput('bst-xp', '0');
        setBstInput('bst-ac', '10');
        setBstInput('bst-ac-info', '');
        setBstInput('bst-hp', '10');
        setBstInput('bst-hp-formula', '');
        setBstInput('bst-speed-walk', '');
        setBstInput('bst-speed-fly', '');
        setBstInput('bst-speed-swim', '');
        setBstInput('bst-speed-climb', '');
        setBstInput('bst-speed-burrow', '');

        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function(attr) {
            var el = window.$('bst-' + attr);
            if (el) el.value = '10';
            var cb = window.$('bst-save-' + attr);
            if (cb) cb.checked = false;
            var sv = window.$('bst-save-val-' + attr);
            if (sv) sv.value = '';
        });
        updateAllBstAttrMods();

        setBstInput('bst-senses', '');
        setBstInput('bst-languages', '');
        setBstRichEditor('bst-traits', '');
        setBstRichEditor('bst-actions', '');
        setBstRichEditor('bst-reactions', '');
        setBstRichEditor('bst-legendary', '');
        setBstInput('bst-legendary-count', '3');

        // Avatar: hide section for new creature (no id yet to bind avatar to)
        if (avatarSection) avatarSection.style.display = 'none';
        refreshBstAvatarPreview();
    }

    // Hide any previous validation errors
    hideBstValidationError();

    if (typeof window.showModal === 'function') {
        window.showModal('bestiary-editor-modal');
    }
}

// ============================================================
// DOM HELPERS
// ============================================================
function setBstInput(id, value) {
    var el = window.$(id);
    if (el) el.value = String(value);
}

function setBstSelectValue(id, value) {
    var el = window.$(id);
    if (!el) return;
    for (var i = 0; i < el.options.length; i++) {
        if (el.options[i].value === value) {
            el.selectedIndex = i;
            return;
        }
    }
}

function setBstRichEditor(id, html) {
    var el = window.$(id);
    // For custom creatures: traits/actions/reactions/legendary are stored as HTML strings.
    // For SRD compatibility in edit (future): we only edit custom creatures, so always strings here.
    if (el) el.innerHTML = typeof html === 'string' ? html : '';
}

// ============================================================
// VALIDATION ERROR DISPLAY
// ============================================================
function showBstValidationError(msg) {
    var errEl = window.$('bst-name-error');
    if (errEl) {
        errEl.textContent = msg || '⚠️ Name erforderlich — bitte einen Namen eingeben';
        errEl.style.display = '';
    }
}

function hideBstValidationError() {
    var errEl = window.$('bst-name-error');
    if (errEl) errEl.style.display = 'none';
}

// ============================================================
// CLEANUP (called by tab-registry on tab leave)
// Closes the editor modal if open
// ============================================================
function cleanupBestiaryEditor() {
    if (typeof window.hideModal === 'function') {
        window.hideModal('bestiary-editor-modal');
    }
}

// NOTE: 'call' action is registered globally by ui-actions.js (calls window[ctx.value](ctx.id)).
// openBestiaryEditor, saveBestiary, deleteBestiaryEntry are exported to window below,
// so the 'call' dispatcher finds them automatically — no additional registration needed.

// ============================================================
// WINDOW EXPORTS
// ============================================================
window.openBestiaryEditor = openBestiaryEditor;
window.updateBstAttrMod = updateBstAttrMod;
window.openBstAvatarModal = openBstAvatarModal;
window.clearBstAvatar = clearBstAvatar;
window.cleanupBestiaryEditor = cleanupBestiaryEditor;
window.showBstValidationError = showBstValidationError;
window.hideBstValidationError = hideBstValidationError;

// Expose internal helpers for bestiary-crud.js
window._getBstEditorAvatarUrl = function() { return _bstEditorAvatarUrl; };
window._setBstEditorAvatarUrl = function(url) { _bstEditorAvatarUrl = url; };
