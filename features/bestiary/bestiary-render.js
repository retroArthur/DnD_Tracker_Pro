// [SECTION:BESTIARY_RENDER]
// ============================================================
// BESTIARY RENDER — @list @detail @filter @badges @favorites
// Analog: features/npcs/npc-render.js
// ============================================================

// Module-scope state
var selectedBestiaryId = null;
var selectedBestiarySource = null;

// ============================================================
// CR SORT HELPER (Muster 4 aus PATTERNS.md)
// Bruchwerte (1/8, 1/4, 1/2) korrekt sortiert
// ============================================================
var CR_SORT_ORDER = {
    '0': 0,
    '1/8': 0.125,
    '1/4': 0.25,
    '1/2': 0.5,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    '11': 11, '12': 12, '13': 13, '14': 14, '15': 15,
    '16': 16, '17': 17, '18': 18, '19': 19, '20': 20,
    '21': 21, '22': 22, '23': 23, '24': 24, '25': 25,
    '26': 26, '27': 27, '28': 28, '29': 29, '30': 30
};

function crToSortValue(cr) {
    var key = String(cr);
    var mapped = CR_SORT_ORDER[key];
    if (mapped !== undefined) return mapped;
    var parsed = parseFloat(key);
    return isNaN(parsed) ? 0 : parsed;
}

// ============================================================
// CLICKABLE DICE (D-09, Muster aus PATTERNS.md)
// Wraps damage formulas and to-hit bonuses with data-action spans
// renderClickableDice runs BEFORE sanitizeHTML (output still sanitized)
// ============================================================
function renderClickableDice(text) {
    if (!text) return '';
    // Schadensformeln: NdN, NdN+N, NdN-N (auch mit W statt d)
    text = text.replace(/(\d+[dWw]\d+(?:[+\-]\d+)?)/g,
        '<span class="bestiary-dice" data-action="bestiary-roll-dice" data-value="$1" title="W\xfcrfeln">$1</span>');
    // Trefferwurf-Boni: isoliertes +N (nicht Teil einer Wuerfelformel, nicht direkt vor 'd'/'W')
    text = text.replace(/(?<![dWw\d])(\+\d+)(?!\s*[dWw\d])/g,
        '<span class="bestiary-dice" data-action="bestiary-roll-dice" data-value="1d20$1" title="W\xfcrfeln">$1</span>');
    return text;
}

// ============================================================
// MODIFIER HELPER
// Berechnet D&D-5e Attributs-Modifier (z.B. 10 -> +0, 14 -> +2)
// ============================================================
function abilityMod(score) {
    var mod = Math.floor((score - 10) / 2);
    return (mod >= 0 ? '+' : '') + mod;
}

// ============================================================
// FAVORITES HELPER
// Delegates to window.isBestiaryFavorite (defined in bestiary-actions.js plan 05)
// Stub returns false until plan 05 lands
// ============================================================
function isBestiaryFavLocal(monster) {
    if (typeof window.isBestiaryFavorite === 'function') {
        return window.isBestiaryFavorite(monster);
    }
    return false;
}

// ============================================================
// POPULATE FILTER DROPDOWNS
// Fills HG and Typ <select> from the combined SRD+custom list
// ============================================================
function populateBestiaryFilterDropdowns(allMonsters) {
    var crEl = window.$('bestiary-filter-cr');
    var typeEl = window.$('bestiary-filter-type');
    if (!crEl || !typeEl) return;

    // Collect unique CRs and types
    var crSet = {};
    var typeSet = {};
    allMonsters.forEach(function(m) {
        if (m.cr !== undefined && m.cr !== null) crSet[String(m.cr)] = true;
        if (m.creatureType) typeSet[m.creatureType] = true;
    });

    // Sort CRs using crToSortValue
    var crValues = Object.keys(crSet).sort(function(a, b) {
        return crToSortValue(a) - crToSortValue(b);
    });

    var currentCr = crEl.value;
    crEl.innerHTML = '<option value="">Alle</option>' +
        crValues.map(function(cr) {
            return '<option value="' + esc(cr) + '"' +
                (currentCr === cr ? ' selected' : '') +
                '>HG ' + esc(cr) + '</option>';
        }).join('');

    var typeValues = Object.keys(typeSet).sort();
    var currentType = typeEl.value;
    typeEl.innerHTML = '<option value="">Alle</option>' +
        typeValues.map(function(t) {
            return '<option value="' + esc(t) + '"' +
                (currentType === t ? ' selected' : '') +
                '>' + esc(t) + '</option>';
        }).join('');
}

// ============================================================
// LIST ITEM RENDER (called by VirtualScroll)
// ============================================================
function renderBestiaryListItem(monster) {
    var mId = monster.source === 'custom' ? monster.id : monster._id;
    var isFav = isBestiaryFavLocal(monster);
    var isSelected = (String(mId) === String(selectedBestiaryId) &&
                      monster.source === selectedBestiarySource);
    return '<div class="bestiary-list-item' +
        (isSelected ? ' selected' : '') +
        '" data-action="bestiary-select"' +
        ' data-id="' + esc(String(mId)) + '"' +
        ' data-source="' + monster.source + '">' +
        '<span class="bestiary-badge ' + monster.source + '">' +
            (monster.source === 'srd' ? 'SRD' : 'Eigen') +
        '</span>' +
        '<span class="bestiary-name">' + esc(monster.name) + '</span>' +
        '<span class="bestiary-cr">HG ' + esc(String(monster.cr)) + '</span>' +
        '<span class="bestiary-type">' + esc(monster.creatureType || '') + '</span>' +
        '<button class="bestiary-fav' + (isFav ? ' active' : '') + '"' +
            ' data-action="bestiary-toggle-fav"' +
            ' data-id="' + esc(String(mId)) + '"' +
            ' data-source="' + monster.source + '"' +
            ' aria-label="Favorit">' +
            (isFav ? '★' : '☆') +
            '<span class="sr-only">Favorit</span>' +
        '</button>' +
    '</div>';
}

// ============================================================
// RENDER BESTIARY LIST (main render hook, called by tab-registry)
// ============================================================
function renderBestiaryList() {
    var container = window.$('bestiary-list');
    if (!container) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderBestiaryList] Container #bestiary-list fehlt — vermutlich nicht auf Bestiary-Tab');
        }
        return;
    }

    EntityLookup.enableCache();

    // Combine SRD + custom
    var srdMonsters = getSRDMonsters().map(function(m) {
        return Object.assign({}, m, { source: 'srd' });
    });
    var customMonsters = (window.D && window.D.bestiary ? window.D.bestiary : []).map(function(m) {
        return Object.assign({}, m, { source: 'custom' });
    });
    var allMonsters = srdMonsters.concat(customMonsters);

    // Populate filter dropdowns (once per render so new types appear)
    populateBestiaryFilterDropdowns(allMonsters);

    // Update count badge
    var countEl = window.$('bestiary-count');
    if (countEl) countEl.textContent = String(allMonsters.length);

    // Read filter values
    var onlyCustom = window.$('bestiary-filter-custom') ? window.$('bestiary-filter-custom').checked : false;
    var onlyFavs = window.$('bestiary-filter-favs') ? window.$('bestiary-filter-favs').checked : false;

    // Single-pass filter via applyFilters (utils/filter-engine.js)
    var filtered = applyFilters(allMonsters, {
        searchText: window.$('bestiary-search') ? window.$('bestiary-search').value : '',
        searchFields: ['name', 'creatureType'],
        filters: {
            cr: window.$('bestiary-filter-cr') ? window.$('bestiary-filter-cr').value : '',
            creatureType: window.$('bestiary-filter-type') ? window.$('bestiary-filter-type').value : ''
        },
        customFilter: function(item) {
            if (onlyCustom && item.source !== 'custom') return false;
            if (onlyFavs && !isBestiaryFavLocal(item)) return false;
            return true;
        }
    });

    // CR-sort (fractions correct via crToSortValue)
    filtered.sort(function(a, b) {
        var diff = crToSortValue(a.cr) - crToSortValue(b.cr);
        if (diff !== 0) return diff;
        return (a.name || '').localeCompare(b.name || '');
    });

    // Empty state
    if (!filtered.length) {
        container.innerHTML = '<div class="bestiary-empty-results">Keine Monster gefunden</div>';
        EntityLookup.clearCache();
        return;
    }

    // VirtualScroll.create — auto-activates above 50 items (rowHeight 52)
    VirtualScroll.create(container, filtered, renderBestiaryListItem, 52);

    EntityLookup.clearCache();
}

// ============================================================
// RENDER BESTIARY DETAIL
// Renders the full 5e parchment statblock for one monster
// id: string (SRD _id or custom numeric id)
// source: 'srd' | 'custom'
// ============================================================
function renderBestiaryDetail(id, source) {
    var panel = window.$('bestiary-detail-panel');
    if (!panel) return;

    // Look up monster
    var monster = null;
    if (source === 'srd') {
        var srd = getSRDMonsters();
        for (var i = 0; i < srd.length; i++) {
            if (String(srd[i]._id) === String(id)) { monster = srd[i]; break; }
        }
    } else {
        var custom = window.D && window.D.bestiary ? window.D.bestiary : [];
        for (var j = 0; j < custom.length; j++) {
            if (String(custom[j].id) === String(id)) { monster = custom[j]; break; }
        }
    }

    if (!monster) {
        panel.innerHTML =
            '<div class="bestiary-detail-empty">' +
                '<div class="bestiary-detail-empty-icon">🐉</div>' +
                '<div class="bestiary-detail-empty-text">Monster nicht gefunden</div>' +
            '</div>';
        return;
    }

    // Helper: safe attribute modifier display
    function attrMod(score) {
        var m = Math.floor((score - 10) / 2);
        return (m >= 0 ? '+' : '') + m;
    }

    // Helper: render traits/actions/reactions/legendaryActions.
    // Supports BOTH formats:
    //   - SRD format: array of {name, desc} objects
    //   - Custom creature format: sanitized HTML string (from contenteditable editor)
    // IMPORTANT: sanitizeHTML strips data-* attributes, so we apply
    // sanitizeHTML FIRST (cleans dangerous content), then renderClickableDice
    // (wraps dice formulas in <span data-action="bestiary-roll-dice">).
    function renderTraitList(items) {
        if (!items) return '';
        // Custom creature: stored as an HTML string
        if (typeof items === 'string') {
            if (!items.trim()) return '';
            // sanitizeHTML already applied at save time; apply renderClickableDice for dice spans
            return '<div class="bestiary-statblock-trait">' +
                renderClickableDice(sanitizeHTML(items)) +
            '</div>';
        }
        // SRD format: array of {name, desc}
        if (!items.length) return '';
        return items.map(function(item) {
            // Step 1: sanitize the raw text (removes scripts, dangerous attrs)
            var cleanDesc = sanitizeHTML(item.desc || '');
            // Step 2: wrap dice formulas with clickable spans (applied after sanitize)
            var safeDesc = renderClickableDice(cleanDesc);
            var safeName = esc(item.name || '');
            return '<div class="bestiary-statblock-trait">' +
                '<span class="bestiary-statblock-trait-name">' + safeName + '.</span> ' +
                safeDesc +
            '</div>';
        }).join('');
    }

    // Helper: render a string-array field inline
    function renderInlineList(arr) {
        if (!arr || !arr.length) return '';
        return arr.map(function(v) { return esc(v); }).join(', ');
    }

    // Speed string
    var speedParts = [];
    var spd = monster.speed || {};
    if (spd.walk) speedParts.push(esc(spd.walk));
    if (spd.fly)  speedParts.push('Fliegen ' + esc(spd.fly));
    if (spd.swim) speedParts.push('Schwimmen ' + esc(spd.swim));
    if (spd.climb) speedParts.push('Klettern ' + esc(spd.climb));
    if (spd.burrow) speedParts.push('Graben ' + esc(spd.burrow));
    var speedStr = speedParts.join(', ') || '—';

    // Saving throws
    var saves = monster.savingThrows || {};
    var saveLabels = { str: 'ST', dex: 'GE', con: 'KO', int: 'IN', wis: 'WE', cha: 'CH' };
    var saveParts = Object.keys(saves).filter(function(k) { return saves[k]; }).map(function(k) {
        return esc(saveLabels[k] || k) + ' ' + esc(String(saves[k]));
    });

    // Skills
    var skills = monster.skills || {};
    var skillParts = Object.keys(skills).map(function(k) {
        return esc(k.charAt(0).toUpperCase() + k.slice(1)) + ' ' + esc(String(skills[k]));
    });

    // XP
    var xp = monster.xp || 0;

    // Portrait (custom only)
    var portraitHtml = '';
    if (source === 'custom' && monster.avatar) {
        portraitHtml = '<img class="bestiary-detail-avatar" src="' + esc(monster.avatar) + '" alt="Portrait" onerror="this.style.display=\'none\'">';
    }

    // Action buttons
    var actionButtons =
        '<button class="btn btn-primary" data-action="bestiary-add-init"' +
            ' data-id="' + esc(String(id)) + '" data-source="' + esc(source) + '">' +
            'Zur Initiative' +
        '</button>' +
        '<button class="btn" data-action="bestiary-add-enc"' +
            ' data-id="' + esc(String(id)) + '" data-source="' + esc(source) + '">' +
            'Zu Encounter' +
        '</button>';

    if (source === 'custom') {
        actionButtons +=
            '<button class="btn" data-action="call" data-value="openBestiaryEditor"' +
                ' data-id="' + esc(String(id)) + '">Bearbeiten</button>' +
            '<button class="btn btn-danger" data-action="bestiary-delete"' +
                ' data-id="' + esc(String(id)) + '">L\xf6schen</button>';
    }

    // Legendary actions intro sentence
    var legendaryIntro = '';
    var legActionsPerRound = monster.legendaryActionsPerRound || 3;
    if (monster.legendaryActions && monster.legendaryActions.length) {
        legendaryIntro = '<p>' + esc(monster.name) +
            ' kann ' + esc(String(legActionsPerRound)) +
            ' legend\xe4re Aktionen ausf\xfchren, wobei es nur eine Aktion nach einer anderen Kreatur\'s Zug w\xe4hlen kann. Es erh\xe4lt diese Aktionen am Anfang seines n\xe4chsten Zuges zur\xfcck.</p>';
    }

    // Build statblock HTML (UI-SPEC section order 1-20)
    var statblockHtml =
        '<div class="bestiary-statblock read-aloud parchment">' +
            // 1. Monster name (red)
            '<div class="bestiary-statblock-name">' + esc(monster.name) + '</div>' +
            // 2. Size/Type/Alignment italic
            '<div class="bestiary-statblock-subline">' +
                esc((monster.size || '') + ' ' + (monster.creatureType || '') +
                    (monster.alignment ? ', ' + monster.alignment : '')) +
            '</div>' +
            // 3. HR
            '<hr>' +
            // 4. AC / HP / Speed
            '<div class="bestiary-statblock-basics">' +
                '<p><strong>R\xfcstungsklasse</strong> ' + esc(String(monster.ac || 10)) +
                    (monster.acInfo ? ' (' + esc(monster.acInfo) + ')' : '') + '</p>' +
                '<p><strong>Trefferpunkte</strong> ' + esc(String(monster.hp || 0)) +
                    (monster.hpFormula ? ' (' + esc(monster.hpFormula) + ')' : '') + '</p>' +
                '<p><strong>Bewegungsrate</strong> ' + speedStr + '</p>' +
            '</div>' +
            // 5. HR
            '<hr>' +
            // 6. Attribute 6-column grid
            '<div class="bestiary-statblock-attrs">' +
                '<div class="bestiary-attr-cell"><span class="bestiary-attr-label">STR</span><span class="bestiary-attr-value">' + esc(String(monster.str || 10)) + ' (' + attrMod(monster.str || 10) + ')</span></div>' +
                '<div class="bestiary-attr-cell"><span class="bestiary-attr-label">GE</span><span class="bestiary-attr-value">' + esc(String(monster.dex || 10)) + ' (' + attrMod(monster.dex || 10) + ')</span></div>' +
                '<div class="bestiary-attr-cell"><span class="bestiary-attr-label">KO</span><span class="bestiary-attr-value">' + esc(String(monster.con || 10)) + ' (' + attrMod(monster.con || 10) + ')</span></div>' +
                '<div class="bestiary-attr-cell"><span class="bestiary-attr-label">INT</span><span class="bestiary-attr-value">' + esc(String(monster.int || 10)) + ' (' + attrMod(monster.int || 10) + ')</span></div>' +
                '<div class="bestiary-attr-cell"><span class="bestiary-attr-label">WE</span><span class="bestiary-attr-value">' + esc(String(monster.wis || 10)) + ' (' + attrMod(monster.wis || 10) + ')</span></div>' +
                '<div class="bestiary-attr-cell"><span class="bestiary-attr-label">CH</span><span class="bestiary-attr-value">' + esc(String(monster.cha || 10)) + ' (' + attrMod(monster.cha || 10) + ')</span></div>' +
            '</div>' +
            // 7. HR
            '<hr>' +
            // 8. Saving throws (if any)
            (saveParts.length ? '<div class="bestiary-statblock-meta"><p><strong>Rettungsw\xfcrfe</strong> ' + saveParts.join(', ') + '</p></div>' : '') +
            // 9. Skills (if any)
            (skillParts.length ? '<div class="bestiary-statblock-meta"><p><strong>Fertigkeiten</strong> ' + skillParts.join(', ') + '</p></div>' : '') +
            // 10. Damage resistances (if any)
            (monster.damageResistances && monster.damageResistances.length ?
                '<div class="bestiary-statblock-meta"><p><strong>Schadenswiederst\xe4nde</strong> ' + renderInlineList(monster.damageResistances) + '</p></div>' : '') +
            // 11. Damage immunities (if any)
            (monster.damageImmunities && monster.damageImmunities.length ?
                '<div class="bestiary-statblock-meta"><p><strong>Schadensimmunit\xe4ten</strong> ' + renderInlineList(monster.damageImmunities) + '</p></div>' : '') +
            // 12. Condition immunities (if any)
            (monster.conditionImmunities && monster.conditionImmunities.length ?
                '<div class="bestiary-statblock-meta"><p><strong>Zustandsimmunit\xe4ten</strong> ' + renderInlineList(monster.conditionImmunities) + '</p></div>' : '') +
            // 13. Senses
            (monster.senses && monster.senses.length ?
                '<div class="bestiary-statblock-meta"><p><strong>Sinne</strong> ' + renderInlineList(monster.senses) + '</p></div>' : '') +
            // 14. Languages
            (monster.languages && monster.languages.length ?
                '<div class="bestiary-statblock-meta"><p><strong>Sprachen</strong> ' + renderInlineList(monster.languages) + '</p></div>' : '') +
            // 15. CR / XP
            '<div class="bestiary-statblock-meta"><p><strong>Herausforderungsgrad</strong> ' +
                esc(String(monster.cr)) + ' (' + esc(String(xp)) + ' EP)</p></div>' +
            // 16. HR (before traits/actions)
            '<hr>' +
            // 17. Traits (Eigenschaften)
            (monster.traits && monster.traits.length ?
                '<div class="bestiary-statblock-section-heading">Eigenschaften</div>' +
                renderTraitList(monster.traits) : '') +
            // 18. Actions (Aktionen)
            (monster.actions && monster.actions.length ?
                '<div class="bestiary-statblock-section-heading">Aktionen</div>' +
                renderTraitList(monster.actions) : '') +
            // 19. Reactions (Reaktionen)
            (monster.reactions && monster.reactions.length ?
                '<div class="bestiary-statblock-section-heading">Reaktionen</div>' +
                renderTraitList(monster.reactions) : '') +
            // 20. Legendary Actions
            (monster.legendaryActions && monster.legendaryActions.length ?
                '<div class="bestiary-statblock-section-heading">Legend\xe4re Aktionen</div>' +
                legendaryIntro +
                renderTraitList(monster.legendaryActions) : '') +
        '</div>';

    // Attribution footer
    var attributionHtml =
        '<div class="bestiary-attribution">Monster: SRD 5.1 DE, CC BY 4.0, Wizards of the Coast</div>';

    panel.innerHTML =
        '<div class="bestiary-detail-content">' +
            portraitHtml +
            '<div class="bestiary-detail-name">' + esc(monster.name) + '</div>' +
            '<div class="bestiary-detail-actions">' + actionButtons + '</div>' +
            statblockHtml +
            attributionHtml +
        '</div>';
}

// ============================================================
// SELECT BESTIARY ENTRY
// Sets selection state, renders detail, re-renders list for highlight
// ============================================================
function selectBestiary(id, source) {
    selectedBestiaryId = String(id);
    selectedBestiarySource = source;
    renderBestiaryDetail(id, source);
    renderBestiaryList();
}

// cleanupBestiaryEditor is implemented in bestiary-editor.js (Plan 04).
// The window export below is kept for the tab-registry hook; it will be
// overwritten by bestiary-editor.js which loads after this module.

// ============================================================
// MINIMAL ACTION HANDLERS (select + roll-dice)
// Full bestiary action suite lives in bestiary-actions.js (plan 05).
// These two are wired here so the render + E2E works before plan 05 lands.
// Rule 2 deviation: critical for correct tab operation.
// ============================================================
var BestiaryRenderActions = {
    // Row click — select a monster and show detail
    // Use raw dataset.id (NOT parseEntityId) because SRD IDs are strings like 'goblin'
    'bestiary-select': function(ctx) {
        var id = (ctx.target && ctx.target.dataset.id) || String(ctx.id || '');
        var source = (ctx.target && ctx.target.dataset.source) || 'srd';
        if (id) window.selectBestiary(id, source);
    },
    // Dice span click — roll via rollQrefDice (plan 01 wired it, plan 05 registers bestiary-roll-dice)
    // Provided here as fallback so dice clicks work before plan 05
    'bestiary-roll-dice': function(ctx) {
        var formula = ctx.value || (ctx.target && ctx.target.dataset.value);
        if (!formula) return;
        if (typeof window.rollQrefDice === 'function') {
            window.rollQrefDice(formula);
        } else if (typeof window.showToast === 'function') {
            window.showToast('W\xfcrfel: ' + formula, 'info');
        }
    },
    // Delete custom creature — wired here so SC2 E2E works before plan 05 lands.
    // plan 05 may re-register this; EventDelegation.registerAction last-write-wins is OK.
    'bestiary-delete': function(ctx) {
        var id = (ctx.target && ctx.target.dataset.id) || String(ctx.id || '');
        if (!id) return;
        if (typeof window.deleteBestiaryEntry === 'function') {
            window.deleteBestiaryEntry(id);
        }
    }
};

// Defer registration until after all modules (including EventDelegation) are loaded.
// EventDelegation is a const defined later in load order; module-level typeof check
// triggers TDZ ReferenceError in bundled mode. Use window.addEventListener instead.
window.addEventListener('DOMContentLoaded', function() {
    if (typeof EventDelegation !== 'undefined' && EventDelegation && typeof EventDelegation.registerAction === 'function') {
        Object.entries(BestiaryRenderActions).forEach(function(entry) {
            EventDelegation.registerAction(entry[0], entry[1]);
        });
    }
});

// ============================================================
// WINDOW EXPORTS
// ============================================================
window.renderBestiaryList = renderBestiaryList;
window.renderBestiaryDetail = renderBestiaryDetail;
window.renderClickableDice = renderClickableDice;
window.crToSortValue = crToSortValue;
window.selectBestiary = selectBestiary;
// cleanupBestiaryEditor: exported by bestiary-editor.js (loads after this module)
