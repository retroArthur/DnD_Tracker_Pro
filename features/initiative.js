// [SECTION:INITIATIVE]
// ============================================================
// INITIATIVE - @combat @turn @round @encounter
// Konstanten: INIT_CONSTANTS, COMBATANT_TYPES (in core/constants.js)
// ============================================================
// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function getCombatant(id) {
    const D = window.D;
    return D.initiative.combatants.find(c => c.id === id);
}
function applyDamage(combatant, damage) {
    let remaining = Math.abs(damage);
    if (combatant.tempHp && combatant.tempHp > 0) {
        const absorbed = Math.min(combatant.tempHp, remaining);
        combatant.tempHp -= absorbed;
        remaining -= absorbed;
    }
    combatant.currentHp = Math.max(0, combatant.currentHp - remaining);
}
// ============================================================
// RENDER HELPER FUNCTIONS (Refactored from renderInit)
// ============================================================
/**
 * Get combatant entity details (AC, type, ID)
 * Uses centralized getEntityForCombat() from render/helpers.js
 * @param combatant - Initiative combatant
 * @returns { ac, entityType, entityId }
 */
function getInitCombatantDetails(combatant) {
    // Use centralized lookup function
    const result = getEntityForCombat(combatant.type, combatant.name);
    // Fallback to combatant.ac if no entity found
    const ac = result.ac !== '?' ? result.ac : combatant.ac || 10;
    return {
        ac,
        entityType: result.type,
        entityId: result.id
    };
}
/**
 * Calculate combatant HP status
 * @param combatant - Initiative combatant
 * @returns { hpPercent, hpClass }
 */
function getCombatantHpStatus(combatant) {
    const hpPct = combatant.maxHp > 0 ? (combatant.currentHp / combatant.maxHp) * 100 : 100;
    const hpClass =
        hpPct <= COMBAT_CONSTANTS.HP_CRITICAL_THRESHOLD
            ? 'critical'
            : hpPct <= COMBAT_CONSTANTS.HP_BLOODIED_THRESHOLD
              ? 'bloodied'
              : 'healthy';
    return { hpPercent: hpPct, hpClass };
}
/**
 * Render combatant effects as HTML
 * @param combatant - Initiative combatant
 * @returns HTML string of effects
 */
function renderCombatantEffects(combatant) {
    if (!combatant.effects || combatant.effects.length === 0) return '';
    return combatant.effects
        .map(
            e =>
                `<span class="init-effect color-${e.color}" data-action="remove-effect" data-id="${combatant.id}" data-value="${e.id}" title="${esc(e.description || '')}&#10;Klicken zum Entfernen">${esc(e.name)} ${e.permanent ? '<span class="duration">∞</span>' : '<span class="duration">' + e.duration + 'R</span>'}</span>`
        )
        .join('');
}
/**
 * Render combatant spell slots for player characters
 * @param combatant - Initiative combatant
 * @param character - Linked character entity (optional)
 * @returns HTML string of spell slots
 */
function renderCombatantSpellSlots(combatant, character) {
    // Default placeholder
    let spellSlotsHtml = '<div class="init-spell-slots-placeholder"></div>';
    if (combatant.type === 'player' && character && character.spellSlots) {
        const slots = [];
        for (let lvl = 1; lvl <= 9; lvl++) {
            const slot = character.spellSlots[lvl];
            if (slot && slot.max > 0) {
                const used = slot.max - (slot.current || 0);
                slots.push(`<div class="init-slot-level" title="Grad ${lvl}">
                    <span class="init-slot-label">${lvl}</span>
                    <div class="init-slot-boxes">${Array(slot.max)
                        .fill(0)
                        .map(
                            (_, idx) =>
                                `<span class="init-slot-box ${idx < slot.current ? 'available' : ''}" data-action="toggle-init-slot-stop" data-id="${character.id}" data-value="${lvl},${idx}"></span>`
                        )
                        .join('')}</div>
                </div>`);
            }
        }
        if (slots.length > 0) {
            spellSlotsHtml = `<div class="init-spell-slots">${slots.join('')}</div>`;
        }
    }
    return spellSlotsHtml;
}
function renderInit() {
    const c = $('init-list');
    if (!c) {
        if (window.APP_CONFIG?.DEBUG_MODE && typeof window.debugLogAdd === 'function') {
            window.debugLogAdd('[renderInit] Container missing - likely not on initiative tab');
        }
        return;
    }
    // Enable EntityLookup cache for performance during render cycle
    EntityLookup.enableCache();
    const D = window.D;
    const init = D.initiative;
    // Encounter-Rundenzahl aktualisieren
    const ern = $('encounter-round-num');
    if (ern) ern.textContent = String(init.round);
    // Schlachtfeld-Bedingungen Banner rendern
    renderBattlefieldBanner();
    if (!init.combatants.length) {
        c.innerHTML =
            '<div style="text-align:center; color:var(--text-dim); padding:30px;">Keine Kämpfer</div>';
        return;
    }
    c.innerHTML = init.combatants
        .map((cb, i) => {
            const active = i === init.currentTurn;
            const dead = cb.currentHp <= 0;
            // Use extracted helper functions
            const { hpPercent: hpPct, hpClass } = getCombatantHpStatus(cb);
            const { ac, entityType, entityId } = getInitCombatantDetails(cb);
            const effects = renderCombatantEffects(cb);
            const rollInfo = cb.lastRoll
                ? `<span style="font-size: 10px; color: var(--text-dim);" title="Letzter Wurf: ${cb.lastRoll}">(${cb.lastRoll})</span>`
                : '';
            // Name clickable if entity found
            const nameClickHandler =
                entityType && entityId
                    ? `data-action="navigate-entity-stop" data-type="${entityType}" data-id="${entityId}" title="Klicken für Details"`
                    : '';
            // Spell slots for players - get character reference
            const character =
                cb.type === 'player' ? EntityLookup.findByName('characters', cb.name) : null;
            const spellSlotsHtml = renderCombatantSpellSlots(cb, character);
            // Special handling for lair action entry
            if (cb.type === 'lair') {
                return `<div class="init-entry init-row lair ${active ? 'active' : ''}" draggable="true" data-id="${cb.id}">
                <span class="drag-handle" title="Ziehen zum Umsortieren">⠿</span>
                <div class="init-value" title="Initiative 20 (fest)">20</div>
                <div class="init-ac" style="visibility: hidden;">-</div>
                <div class="init-info" style="flex: 1;">
                    <div class="init-name">${esc(cb.name)}</div>
                    <div class="init-type" style="color: var(--red);">Lair Action</div>
                </div>
                <div class="init-right">
                    <span style="color: var(--text-dim); font-size: 0.8rem; margin-right: 8px;">Am Rundenende</span>
                    <button class="btn btn-sm btn-danger" data-action="remove-combatant" data-id="${cb.id}">❌</button>
                </div>
            </div>`;
            }
            // INIT-03: Mob-Modus — eine Zeile fuer N Kreaturen (D-11)
            // Concentration + Quick Actions sind fuer Mob-Zeilen versteckt (UI-SPEC Feature Hiding)
            if (cb.mob) {
                return typeof window.renderMobRow === 'function' ? window.renderMobRow(cb, i, init) : '';
            }
            // Typ-Label ermitteln
            const typeLabels = {
                enemy: 'Gegner',
                player: 'Spieler',
                ally: 'Verbündeter',
                monster: 'Monster'
            };
            const typeLabel = typeLabels[cb.type] || cb.type;
            return `<div class="init-entry init-row ${cb.type} ${active ? 'active' : ''} ${dead ? 'dead' : ''}" draggable="true" data-id="${cb.id}">
            <span class="drag-handle" title="Ziehen zum Umsortieren">⠿</span>
            <div class="init-value" data-action="edit-init-value" data-id="${cb.id}" title="Klicken zum Bearbeiten">${cb.initiative} ${rollInfo}</div>
            <div class="init-ac" title="Rüstungsklasse"><span class="init-ac-icon">🛡️</span>${ac}</div>
            <div class="init-info">
                <div class="init-name" ${nameClickHandler}>${esc(cb.name)}</div>
                <div class="init-type">${typeLabel}${cb.cr ? ` • CR ${cb.cr}` : ''}</div>
                ${effects ? `<div class="init-effects">${effects}</div>` : ''}
                ${dead && cb.type === 'player' ? renderDeathSaves(cb) : ''}
                ${!dead && !cb.mob ? renderConcentration(cb) : ''}
                ${!cb.mob && cb.concentration?.pendingCheck ? renderConcentrationCheck(cb, cb.concentration.pendingCheck) : ''}
                ${cb.legendaryActions && cb.legendaryActions.max > 0 ? renderLegendaryActionPips(cb) : ''}
                ${cb.legendaryResistance && cb.legendaryResistance.max > 0 ? renderLegendaryResistancePips(cb) : ''}
            </div>
            ${spellSlotsHtml}
            <div class="init-right">
                <div class="init-hp">
                    <span class="init-hp-value ${hpClass}">${cb.currentHp}/${cb.maxHp}${cb.tempHp ? ` <span style="color:var(--cyan);">(+${cb.tempHp})</span>` : ''}</span>
                    <div class="init-hp-btns">
                        <button class="btn btn-sm btn-success" data-action="mod-hp" data-id="${cb.id}" data-value="1">➕</button>
                        <button class="btn btn-sm btn-danger" data-action="mod-hp" data-id="${cb.id}" data-value="-1">➖</button>
                        <button class="btn btn-sm" data-action="show-hp-calculator" data-type="combatant" data-id="${cb.id}" title="HP ändern">➗</button>
                    </div>
                </div>
                <button class="btn btn-sm" data-action="show-add-effect" data-id="${cb.id}">🔮</button>
                <button class="btn btn-sm btn-danger" data-action="remove-combatant" data-id="${cb.id}">❌</button>
                <button class="btn-icon init-statblock-btn" data-action="show-init-statblock" data-id="${cb.id}" title="${cb.statblockRef ? 'Statblock anzeigen' : 'Basisinfos anzeigen'}">📖</button>
            </div>
        </div>`;
        })
        .join('');
    // Schnellaktionen-Leiste rendern
    // Feature-Hiding: fuer Mob-Kombattanten keine Quick Actions (UI-SPEC INIT-03 Feature Hiding)
    const activeCb = init.combatants[init.currentTurn];
    if (typeof window.renderQuickActionsBar === 'function' && activeCb && !activeCb.mob) {
        window.renderQuickActionsBar();
    }
    // Clear EntityLookup cache after render to prevent stale data
    EntityLookup.clearCache();
}
function toggleInitSlot(charId, level, index) {
    const char = EntityLookup.character(charId);
    if (!char || !char.spellSlots || !char.spellSlots[level]) return;
    const slot = char.spellSlots[level];
    // Toggle: wenn angeklickte Box verfügbar ist, verbrauchen; sonst wiederherstellen
    if (index < slot.current) {
        // Box ist verfügbar -> verbrauchen (current verringern)
        slot.current = index;
    } else {
        // Box ist verbraucht -> wiederherstellen (current erhöhen)
        slot.current = index + 1;
    }
    renderInit();
    window.save();
}
function endCombat() {
    const D = window.D;
    if (!D.initiative.combatants.length) {
        showToast('Kein aktiver Kampf');
        return;
    }
    if (confirm('Kampf beenden und alle Teilnehmer entfernen?')) {
        // Sync HP from combatants back to party characters
        D.initiative.combatants.forEach(cb => {
            if (cb.type === 'player') {
                const char = D.characters.find(c => c.name === cb.name);
                if (char) {
                    char.hpCurrent = cb.currentHp;
                }
            }
        });
        D.initiative = { combatants: [], currentTurn: 0, round: 1 };
        renderInit();
        window.renderParty();
        window.save();
        showToast('⏹️ Kampf beendet - HP synchronisiert');
    }
}
// ============================================================
// XP-VERTEILUNG (CHAR-01 / D-09 / D-10)
// Separate from endCombat — DM triggers manually after fight
// Wave-1 helpers (global lexical): getXPForCR, distributeXP, canLevelUp
// ============================================================
function finishCombatXp() {
    var D = window.D;
    if (!D.initiative.combatants.length) {
        showToast('Kein aktiver Kampf', 'warning');
        return;
    }
    showXpDistributionModal();
}
function showXpDistributionModal() {
    var D = window.D;
    // Auto-sum XP from enemy/monster combatants via CR_TO_XP (getXPForCR handles missing/unknown CR → 0)
    var autoSum = 0;
    D.initiative.combatants.forEach(function(cb) {
        if (cb.type === 'enemy' || cb.type === 'monster') {
            autoSum += getXPForCR(cb.cr);
        }
    });
    // Fill autosum and total input
    var autoSumEl = document.getElementById('xp-dist-autosum');
    var totalInput = document.getElementById('xp-distribution-total');
    if (autoSumEl) autoSumEl.textContent = autoSum + ' XP';
    if (totalInput) totalInput.value = String(autoSum);
    // Render all characters as checkbox rows into #xp-dist-char-list
    var charList = document.getElementById('xp-dist-char-list');
    if (charList) {
        var rowsHtml = '';
        D.characters.forEach(function(ch) {
            var hpCur = ch.hpCurrent || 0;
            var hpMax = ch.hpMax || 0;
            var hpBadge = hpCur <= 0
                ? '<span class="xp-dist-char-hp xp-dist-char-hp--down">\u{1F480} 0 HP</span>'
                : '<span class="xp-dist-char-hp">❤️ ' + hpCur + '/' + hpMax + '</span>';
            rowsHtml += '<label class="xp-dist-char-row">'
                + '<input type="checkbox" class="xp-dist-char-cb" data-id="' + ch.id + '" value="' + ch.id + '" checked>'
                + '<span class="xp-dist-char-name">' + esc(ch.name) + '</span>'
                + '<span class="xp-dist-char-xp">' + (ch.xp || 0) + ' XP</span>'
                + hpBadge
                + '</label>';
        });
        charList.innerHTML = rowsHtml;
        // Scoped change listener (flag prevents multiple bindings)
        if (!charList._xpDistCbListener) {
            charList._xpDistCbListener = true;
            charList.addEventListener('change', function() {
                updateXpDistPreview();
            });
        }
    }
    // Update preview when total changes
    if (totalInput && !totalInput._xpDistListener) {
        totalInput._xpDistListener = true;
        totalInput.addEventListener('input', function() {
            updateXpDistPreview();
        });
    }
    // Initial preview
    updateXpDistPreview();
    showModal('xp-distribution-modal');
}
function xpDistSelectAll() {
    document.querySelectorAll('#xp-dist-char-list .xp-dist-char-cb').forEach(function(cb) {
        cb.checked = true;
    });
    updateXpDistPreview();
}
function xpDistSelectNone() {
    document.querySelectorAll('#xp-dist-char-list .xp-dist-char-cb').forEach(function(cb) {
        cb.checked = false;
    });
    updateXpDistPreview();
}
window.xpDistSelectAll = xpDistSelectAll;
window.xpDistSelectNone = xpDistSelectNone;
function updateXpDistPreview() {
    var D = window.D;
    var totalInput = document.getElementById('xp-distribution-total');
    var previewEl = document.getElementById('xp-dist-preview');
    var livingCountEl = document.getElementById('xp-dist-living-count');
    if (!totalInput || !previewEl) return;
    var total = Math.max(0, parseInt(totalInput.value, 10) || 0);
    var selectedCount = document.querySelectorAll('#xp-dist-char-list .xp-dist-char-cb:checked').length;
    var totalCount = D.characters.length;
    if (livingCountEl) {
        livingCountEl.textContent = selectedCount + ' von ' + totalCount + ' ausgewählt';
    }
    if (selectedCount === 0) {
        previewEl.innerHTML = '<div class="xp-dist-preview-line xp-dist-preview-hint">Keine Spieler ausgewählt</div>';
    } else if (total > 0) {
        var share = Math.floor(total / selectedCount);
        var remainder = total % selectedCount;
        previewEl.innerHTML = '<div class="xp-dist-preview-line">Je Charakter: <strong>+' + share + ' XP</strong>' + (remainder > 0 ? ' (Rest: ' + remainder + ' XP)' : '') + '</div>';
    } else {
        previewEl.innerHTML = '';
    }
}
function applyXpDistribution() {
    var D = window.D;
    var totalInput = document.getElementById('xp-distribution-total');
    // T-06-11: Coerce total via parseInt with non-negative floor; ignore NaN
    var totalXP = Math.max(0, parseInt(totalInput ? totalInput.value : '0', 10) || 0);
    // Collect checked character ids from #xp-dist-char-list (T-06-09-02: parseEntityId for safe resolution)
    var checkedBoxes = Array.from(document.querySelectorAll('#xp-dist-char-list .xp-dist-char-cb:checked'));
    var selectedChars = checkedBoxes.reduce(function(acc, cb) {
        var id = parseEntityId(cb.dataset.id);
        if (id !== null) {
            var ch = D.characters.find(function(c) { return c.id === id; });
            if (ch) acc.push(ch);
        }
        return acc;
    }, []);
    // T-06-09-03: Guard 0-selected — warn toast, NO pushUndo, NO mutation
    if (!selectedChars.length) {
        showToast('Keine Spieler ausgewählt — XP nicht verteilt', 'warning');
        return;
    }
    // T-06-14: pushUndo BEFORE mutation so XP distribution is undoable
    pushUndo('XP verteilt');
    // distributeXP mutates each selectedChar.xp (Wave-1 helper — alive/dead does NOT gate selection)
    var result = distributeXP(totalXP, selectedChars);
    var share = result.share;
    var remainder = result.remainder;
    // Collect level-up hints (D-11: NEVER auto-bump level; hint only)
    var levelUpHints = [];
    selectedChars.forEach(function(ch) {
        if (canLevelUp(ch)) {
            levelUpHints.push(esc(ch.name) + ' kann aufsteigen!');
        }
    });
    window.save();
    if (typeof window.renderParty === 'function') window.renderParty();
    hideModal('xp-distribution-modal');
    // German toast with summary
    var msg = '+' + share + ' XP je Charakter';
    if (remainder > 0) msg += ' (Rest: ' + remainder + ' XP)';
    showToast(msg, 'success');
    // Show individual level-up hints after brief delay
    levelUpHints.forEach(function(hint, i) {
        setTimeout(function() { showToast('⬆️ ' + hint, 'info'); }, 500 + i * 400);
    });
}
window.finishCombatXp = finishCombatXp;
window.showXpDistributionModal = showXpDistributionModal;
window.applyXpDistribution = applyXpDistribution;
// ============================================================
// END XP-VERTEILUNG
// ============================================================
function editInitValue(id) {
    const cb = getCombatant(id);
    if (!cb) return;
    const val = prompt('Initiative-Wert:', String(cb.initiative));
    if (val !== null && !isNaN(parseInt(val))) {
        cb.initiative = parseInt(val);
        renderInit();
        window.save();
    }
}
function addCombatant() {
    const nameInput = $('init-name');
    const initInput = $('init-value');
    const hpInput = $('init-hp');
    const acInput = $('init-ac');
    const typeInput = $('init-type');
    const name = nameInput.value.trim();
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    const initBonus = parseInt(initInput.value) || 0;
    const ac = parseInt(acInput.value) || 10;
    const hp = parseInt(hpInput.value) || 1;
    const D = window.D;
    D.initiative.combatants.push({
        id: nextId('combatants'),
        name,
        initiative: initBonus,
        initBonus: initBonus,
        maxHp: hp,
        currentHp: hp,
        ac: ac,
        type: typeInput.value,
        effects: []
    });
    nameInput.value = '';
    initInput.value = '';
    hpInput.value = '';
    acInput.value = '';
    sortInit();
}
function addPartyToInit() {
    const D = window.D;
    D.characters.forEach(ch => {
        if (D.initiative.combatants.some(c => c.name === ch.name)) return;
        // Initiative-Bonus aus GES-Modifikator berechnen falls verfügbar
        const initBonus = 0; // Party characters might not have DEX stored separately
        D.initiative.combatants.push({
            id: nextId('combatants'),
            name: ch.name,
            initiative: 0,
            initBonus: initBonus,
            maxHp: ch.hpMax || 10,
            currentHp: ch.hpCurrent || ch.hpMax || 10,
            ac: ch.ac || ch.armorClass || 10,
            type: 'player',
            effects: []
        });
    });
    showToast('Party zur Initiative hinzugefügt - klicke "🎲 Alle würfeln"');
    renderInit();
    window.save();
}
function removeCombatant(id) {
    const D = window.D;
    const idx = D.initiative.combatants.findIndex(c => c.id === id);
    if (idx > -1) {
        D.initiative.combatants.splice(idx, 1);
        if (D.initiative.currentTurn >= D.initiative.combatants.length)
            D.initiative.currentTurn = 0;
        renderInit();
        window.save();
    }
}
function modHp(id, amt) {
    const c = getCombatant(id);
    if (!c) return;
    const wasAtZero = c.currentHp <= 0;
    if (amt < 0) {
        // Schaden: zuerst temp HP abziehen
        let remaining = Math.abs(amt);
        const actualDamage = remaining; // Save for concentration check
        if (c.tempHp && c.tempHp > 0) {
            const absorbed = Math.min(c.tempHp, remaining);
            c.tempHp -= absorbed;
            remaining -= absorbed;
        }
        c.currentHp = Math.max(0, c.currentHp - remaining);
        // Konzentrationsprüfung auslösen wenn konzentriert und Schaden erlitten
        if (c.concentration?.active && actualDamage > 0) {
            c.concentration.pendingCheck = actualDamage;
        }
    } else {
        // Heilung
        c.currentHp = Math.min(c.maxHp, c.currentHp + amt);
        // Todeswürfe zurücksetzen wenn über 0 HP geheilt
        if (wasAtZero && c.currentHp > 0) {
            resetDeathSaves(c);
        }
    }
    renderInit();
    window.save();
}
// Wrapper-Funktion für EventDelegation: Character HP updaten
function updateCharacterHP(id, amount) {
    const ch = EntityLookup.character(id);
    if (!ch) return;
    if (amount < 0) {
        ch.currentHp = Math.max(0, (ch.currentHp || ch.hp) + amount);
    } else {
        ch.currentHp = Math.min(ch.hp, (ch.currentHp || ch.hp) + amount);
    }
    window.renderParty();
    window.save();
}
// Wrapper-Funktion für EventDelegation: Initiative Combatant HP updaten
function updateInitiativeCombatantHP(id, amount) {
    modHp(id, amount);
}
function sortInit() {
    const D = window.D;
    if (!D.initiative?.combatants?.length) return;
    D.initiative.combatants.sort((a, b) => b.initiative - a.initiative);
    D.initiative.currentTurn = 0;
    renderInit();
    window.save();
    showToast('⬇️ Initiative sortiert');
}
function nextTurn() {
    const D = window.D;
    const init = D.initiative;
    if (!init.combatants.length) return;
    // Decrease effect durations (not for permanent effects)
    const current = init.combatants[init.currentTurn];
    if (current?.effects) {
        current.effects = current.effects
            .map(e => (e.permanent ? e : { ...e, duration: e.duration - 1 }))
            .filter(e => e.permanent || e.duration > 0);
    }
    init.currentTurn++;
    if (init.currentTurn >= init.combatants.length) {
        init.currentTurn = 0;
        init.round++;
        // D-10: LA-Reset bei Rundenübergang (jede Runde)
        // D-07: LR KEIN Auto-Reset — LR sind /Tag, nur LA!
        init.combatants.forEach(function(c) {
            if (c.legendaryActions && c.legendaryActions.max > 0) {
                c.legendaryActions.remaining = c.legendaryActions.max;
            }
        });
    }
    renderInit();
    window.save();
}
// ============================================================
// BATTLEFIELD CONDITIONS
// ============================================================
function renderBattlefieldBanner() {
    const banner = $('battlefield-banner');
    if (!banner) return;
    const D = window.D;
    const bf = D.initiative?.battlefield;
    // Hide banner if no battlefield conditions
    if (!bf || (bf.terrain === 'normal' && !bf.hasLair)) {
        banner.style.display = 'none';
        return;
    }
    banner.style.display = 'flex';
    const tags = [];
    // Terrain tag
    if (bf.terrain && bf.terrain !== 'normal') {
        tags.push(
            `<span class="bf-tag terrain">${bf.terrainIcon} ${bf.terrainLabel} (×${bf.terrainMod})</span>`
        );
    }
    // Lair tag
    if (bf.hasLair) {
        tags.push(`<span class="bf-tag lair">🏰 Lair Actions</span>`);
    }
    banner.innerHTML = `
        <span class="bf-label">⚔️ Battlefield:</span>
        <div class="bf-conditions">${tags.join('')}</div>
        <span class="bf-xp">${bf.difficulty} • ${bf.finalXP?.toLocaleString() || '?'} XP</span>
        <button class="bf-clear" data-action="clear-battlefield" title="Battlefield zurücksetzen">✕</button>
    `;
}
function clearBattlefield() {
    const D = window.D;
    if (D.initiative) {
        delete D.initiative.battlefield;
        window.save();
        renderInit();
        showToast('Battlefield-Bedingungen entfernt');
    }
}
// ============================================================
// GLOBAL EXPORTS (for backward compatibility)
// ============================================================
// Export functions to window for onclick handlers
window.renderInit = renderInit;
window.toggleInitSlot = toggleInitSlot;
window.endCombat = endCombat;
window.editInitValue = editInitValue;
window.addCombatant = addCombatant;
window.addPartyToInit = addPartyToInit;
window.removeCombatant = removeCombatant;
window.modHp = modHp;
window.updateCharacterHP = updateCharacterHP;
window.updateInitiativeCombatantHP = updateInitiativeCombatantHP;
window.sortInit = sortInit;
window.nextTurn = nextTurn;
window.clearBattlefield = clearBattlefield;
