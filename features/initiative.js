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
        if (window.APP_CONFIG?.DEBUG_MODE) {
            console.warn('[renderInit] Container missing - likely not on initiative tab');
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
// EFFECTS
// ============================================================
function showAddEffect(id) {
    const effectIdInput = $('effect-combatant-id');
    const effectNameInput = $('effect-name');
    const effectDurationInput = $('effect-duration');
    const effectColorInput = $('effect-color');
    if (effectIdInput) effectIdInput.value = String(id);
    if (effectNameInput) effectNameInput.value = '';
    if (effectDurationInput) effectDurationInput.value = '1';
    if (effectColorInput) effectColorInput.value = 'red';
    renderEffectConditionsGrid();
    showModal('effect-modal');
}
function renderEffectConditionsGrid() {
    const container = $('effect-conditions-grid');
    if (!container) return;
    const effectIdInput = $('effect-combatant-id');
    const cbId = parseEntityId(effectIdInput.value);
    if (cbId === null) return;
    const cb = getCombatant(cbId);
    const currentEffects = cb?.effects || [];
    container.innerHTML = Object.entries(CONDITIONS)
        .map(([key, cond]) => {
            const hasEffect = currentEffects.some(
                e => e.name.toLowerCase() === cond.name.toLowerCase()
            );
            return `<button class="btn ${hasEffect ? 'btn-success' : ''}" data-action="add-effect-from-grid" data-value="${key}" style="justify-content: flex-start; gap: 8px; padding: 8px 10px; font-size: 0.9em;">
            <span>${cond.icon}</span>
            <span style="flex: 1; text-align: left;">${cond.name}</span>
            ${hasEffect ? '✓' : ''}
        </button>`;
        })
        .join('');
}
function addEffectFromGrid(conditionKey) {
    const effectIdInput = $('effect-combatant-id');
    const cbId = parseEntityId(effectIdInput.value);
    if (cbId === null) return;
    const cb = getCombatant(cbId);
    if (!cb) return;
    if (!cb.effects) cb.effects = [];
    const cond = CONDITIONS[conditionKey];
    if (!cond) return;
    // Toggle: Wenn bereits vorhanden, entfernen
    const existingIdx = cb.effects.findIndex(e => e.name.toLowerCase() === cond.name.toLowerCase());
    if (existingIdx > -1) {
        cb.effects.splice(existingIdx, 1);
    } else {
        cb.effects.push({
            id: Date.now(),
            name: cond.name,
            duration: INIT_CONSTANTS.PERMANENT_DURATION,
            permanent: true,
            color: CONDITION_COLORS[conditionKey] || 'yellow',
            description: cond.desc
        });
    }
    renderEffectConditionsGrid();
    renderInit();
    window.save();
}
function saveCustomEffect() {
    const effectIdInput = $('effect-combatant-id');
    const effectNameInput = $('effect-name');
    const effectColorInput = $('effect-color');
    const effectDurationInput = $('effect-duration');
    const cbId = parseEntityId(effectIdInput.value);
    if (cbId === null) return;
    const cb = getCombatant(cbId);
    if (!cb) return;
    if (!cb.effects) cb.effects = [];
    const name = effectNameInput.value.trim();
    if (!name) {
        showToast('Bitte einen Namen eingeben');
        return;
    }
    const color = effectColorInput.value;
    const duration = parseInt(effectDurationInput.value) || 0;
    cb.effects.push({
        id: Date.now(),
        name,
        duration: duration || INIT_CONSTANTS.PERMANENT_DURATION,
        permanent: duration === 0,
        color,
        description: ''
    });
    hideModal('effect-modal');
    renderInit();
    window.save();
    showToast(`Effekt "${name}" hinzugefügt`);
}
function removeEffect(cbId, effId) {
    const cb = getCombatant(cbId);
    if (!cb) return;
    cb.effects = (cb.effects || []).filter(e => e.id !== effId);
    renderInit();
    window.save();
}
// ============================================================
// DEATH SAVES TRACKER
// ============================================================
function renderDeathSaves(cb) {
    if (!cb.deathSaves) {
        cb.deathSaves = { successes: 0, failures: 0 };
    }
    const ds = cb.deathSaves;
    // Auf Endzustände prüfen
    let statusHtml = '';
    if (ds.failures >= INIT_CONSTANTS.DEATH_SAVE_THRESHOLD) {
        statusHtml = '<span class="death-saves-status dead">💀 Tot</span>';
    } else if (ds.successes >= INIT_CONSTANTS.DEATH_SAVE_THRESHOLD) {
        statusHtml = '<span class="death-saves-status stable">✓ Stabil</span>';
    }
    return `
        <div class="death-saves">
            <span class="death-saves-label">☠️ Todeswürfe</span>
            <div class="death-saves-group">
                <span class="death-saves-group-label">✓</span>
                <div class="death-saves-dots">
                    ${[0, 1, 2]
                        .map(
                            i => `
                        <span class="death-save-dot success ${i < ds.successes ? 'active' : ''}"
                            data-action="toggle-death-save-stop"
                            data-id="${cb.id}"
                            data-type="success"
                            data-index="${i}"
                            title="Erfolg ${i + 1}"></span>
                    `
                        )
                        .join('')}
                </div>
            </div>
            <div class="death-saves-group">
                <span class="death-saves-group-label">✗</span>
                <div class="death-saves-dots">
                    ${[0, 1, 2]
                        .map(
                            i => `
                        <span class="death-save-dot failure ${i < ds.failures ? 'active' : ''}"
                            data-action="toggle-death-save-stop"
                            data-id="${cb.id}"
                            data-type="failure"
                            data-index="${i}"
                            title="Fehlschlag ${i + 1}"></span>
                    `
                        )
                        .join('')}
                </div>
            </div>
            ${statusHtml}
        </div>
    `;
}
function toggleDeathSave(cbId, type, index) {
    const cb = getCombatant(cbId);
    if (!cb) return;
    if (!cb.deathSaves) {
        cb.deathSaves = { successes: 0, failures: 0 };
    }
    const ds = cb.deathSaves;
    const field = type === 'success' ? 'successes' : 'failures';
    // Toggle-Logik: Bei Klick auf aktiven Punkt auf oder nach aktuellem Zähler, verringern
    // If clicking on inactive dot, set to that level
    if (index < ds[field]) {
        // Clicked on active dot - reduce to this level
        ds[field] = index;
    } else {
        // Clicked on inactive dot - increase to include this dot
        ds[field] = index + 1;
    }
    // Auf Tod prüfen (3 Fehlschläge)
    if (ds.failures >= INIT_CONSTANTS.DEATH_SAVE_THRESHOLD) {
        showToast('💀 Charakter ist gestorben!', 'error');
    }
    // Auf Stabilisierung prüfen (3 Erfolge)
    if (ds.successes >= INIT_CONSTANTS.DEATH_SAVE_THRESHOLD && cb.currentHp <= 0) {
        cb.currentHp = 1;
        ds.successes = 0;
        ds.failures = 0;
        showToast('✓ Charakter ist stabilisiert!', 'success');
    }
    renderInit();
    window.save();
}
function resetDeathSaves(cb) {
    if (cb.deathSaves) {
        cb.deathSaves = { successes: 0, failures: 0 };
    }
}
// ============================================================
// LEGENDAERE AKTIONEN + WIDERSAENDE PIPS (INIT-02)
// Analog: renderDeathSaves() / toggleDeathSave() (D-08)
// ============================================================
function renderLegendaryActionPips(cb) {
    var la = cb.legendaryActions;
    if (!la || la.max <= 0) return '';
    var dots = [];
    for (var i = 0; i < la.max; i++) {
        var active = i < la.remaining ? 'active' : '';
        var titleText = i < la.remaining
            ? 'Legendäre Aktion ' + (i + 1) + ' verwenden'
            : 'Legendäre Aktion ' + (i + 1) + ' (verbraucht)';
        dots.push(
            '<span class="la-dot ' + active + '"' +
            ' data-action="init-use-la-stop"' +
            ' data-id="' + cb.id + '"' +
            ' data-index="' + i + '"' +
            ' title="' + titleText + '"></span>'
        );
    }
    return '<div class="la-pips" title="Setzt sich bei Initiative 20 zurück">' +
        '<span class="la-label">⭐ LA</span>' +
        '<div class="la-dots">' + dots.join('') + '</div>' +
        '</div>';
}
function renderLegendaryResistancePips(cb) {
    var lr = cb.legendaryResistance;
    if (!lr || lr.max <= 0) return '';
    var dots = [];
    for (var i = 0; i < lr.max; i++) {
        var active = i < lr.remaining ? 'active' : '';
        var titleText = i < lr.remaining
            ? 'Legendären Widerstand ' + (i + 1) + ' einsetzen'
            : 'Legendärer Widerstand ' + (i + 1) + ' (verbraucht)';
        dots.push(
            '<span class="lr-dot ' + active + '"' +
            ' data-action="init-use-lr-stop"' +
            ' data-id="' + cb.id + '"' +
            ' data-index="' + i + '"' +
            ' title="' + titleText + '"></span>'
        );
    }
    return '<div class="lr-pips" title="Pro Tag — kein automatischer Reset">' +
        '<span class="lr-label">🛡 LW</span>' +
        '<div class="lr-dots">' + dots.join('') + '</div>' +
        '<button class="lr-reset-btn btn-icon"' +
        ' data-action="init-reset-lr-stop"' +
        ' data-id="' + cb.id + '"' +
        ' title="Legendären Widerstand zurücksetzen (Lange Rast)">↺</button>' +
        '</div>';
}
function useLA(cbId, index) {
    var cb = getCombatant(cbId);
    if (!cb || !cb.legendaryActions) return;
    var la = cb.legendaryActions;
    // Toggle-Logik exakt wie toggleDeathSave() (D-08)
    if (index < la.remaining) {
        la.remaining = index;
    } else {
        la.remaining = index + 1;
    }
    renderInit();
    window.save();
}
function useLR(cbId, index) {
    var cb = getCombatant(cbId);
    if (!cb || !cb.legendaryResistance) return;
    var lr = cb.legendaryResistance;
    // Toggle-Logik exakt wie toggleDeathSave() (D-08)
    if (index < lr.remaining) {
        lr.remaining = index;
    } else {
        lr.remaining = index + 1;
    }
    renderInit();
    window.save();
}
function resetLR(cbId) {
    var cb = getCombatant(cbId);
    if (!cb || !cb.legendaryResistance) return;
    cb.legendaryResistance.remaining = cb.legendaryResistance.max;
    renderInit();
    window.save();
}
// ============================================================
// CONCENTRATION TRACKER
// ============================================================
function renderConcentration(cb) {
    const conc = cb.concentration;
    // Aktive Konzentration anzeigen
    if (conc?.active && conc.spell) {
        return `
            <div class="concentration-badge" title="Konzentration: ${esc(conc.spell)}">
                <span class="conc-icon">🔮</span>
                <span class="conc-spell">${esc(conc.spell)}</span>
                <span class="conc-break" data-action="break-concentration-stop" data-id="${cb.id}" title="Konzentration brechen">✕</span>
            </div>
        `;
    }
    // Hinzufügen-Button für Spieler/Verbündete anzeigen (nur wenn keine Konzentration aktiv)
    if (cb.type === 'player' || cb.type === 'ally') {
        return `
            <button class="concentration-add-btn" data-action="show-concentration-modal-stop" data-id="${cb.id}">
                🔮 Konzentration
            </button>
        `;
    }
    return '';
}
function renderConcentrationCheck(cb, damage) {
    if (!cb.concentration?.active) return '';
    const dc = Math.max(10, Math.floor(damage / 2));
    cb.concentration.lastDC = dc;
    return `
        <div class="concentration-check-banner">
            <span>⚠️ Konzentrations-Check für <strong>${esc(cb.concentration.spell)}</strong></span>
            <span class="conc-dc">DC ${dc}</span>
            <button class="conc-roll-btn" data-action="roll-concentration-check-stop" data-id="${cb.id}" data-dc="${dc}">
                🎲 CON-Save
            </button>
        </div>
    `;
}
function showConcentrationModal(cbId) {
    const cb = getCombatant(cbId);
    if (!cb) return;
    // Zauber vom verknüpften Charakter holen falls verfügbar
    let spellOptions = '';
    if (cb.type === 'player') {
        const char = EntityLookup.findByName('characters', cb.name);
        if (char && char.spells?.length) {
            const concentrationSpells = char.spells
                .map(sid => EntityLookup.spell(sid))
                .filter(s => s && s.concentration);
            if (concentrationSpells.length) {
                spellOptions = concentrationSpells
                    .map(s => `<option value="${esc(s.name)}">${esc(s.name)}</option>`)
                    .join('');
            }
        }
    }
    const content = `
        <div style="padding: 20px;">
            <h3 style="margin: 0 0 16px 0; color: var(--purple);">🔮 Konzentration setzen</h3>
            <p style="margin: 0 0 12px 0; color: var(--text-dim);">Für: <strong>${esc(cb.name)}</strong></p>
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-size: 0.9em; color: var(--text-dim);">Zauber:</label>
                ${
                    spellOptions
                        ? `
                    <select id="conc-spell-select" style="width: 100%; padding: 10px; background: var(--bg-dark); border: 1px solid var(--border); color: var(--text); border-radius: 6px; margin-bottom: 8px;">
                        <option value="">— Wählen oder eingeben —</option>
                        ${spellOptions}
                    </select>
                `
                        : ''
                }
                <input type="text" id="conc-spell-input" placeholder="Zauber-Name eingeben..."
                    style="width: 100%; padding: 10px; background: var(--bg-dark); border: 1px solid var(--border); color: var(--text); border-radius: 6px; box-sizing: border-box;">
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn" data-action="hide-modal" data-value="concentration-modal">Abbrechen</button>
                <button class="btn btn-primary" data-action="set-concentration" data-id="${cbId}">✓ Setzen</button>
            </div>
        </div>
    `;
    // Modal erstellen oder wiederverwenden
    let modal = $('concentration-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'concentration-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal" style="max-width: 400px;">${content}</div>`;
        modal.onclick = e => {
            if (e.target === modal) hideModal('concentration-modal');
        };
        document.body.appendChild(modal);
    } else {
        const modalContent = modal.querySelector('.modal');
        if (modalContent) modalContent.innerHTML = content;
    }
    showModal('concentration-modal');
    // Sync select to input
    const select = $('conc-spell-select');
    const input = $('conc-spell-input');
    if (select && input) {
        select.onchange = () => {
            input.value = select.value;
        };
    }
    if (input) input.focus();
}
function setConcentration(cbId) {
    const cb = getCombatant(cbId);
    if (!cb) return;
    const input = $('conc-spell-input');
    const spell = input?.value?.trim();
    if (!spell) {
        showToast('Bitte Zauber-Name eingeben', 'error');
        return;
    }
    cb.concentration = {
        active: true,
        spell: spell,
        lastDC: 10
    };
    hideModal('concentration-modal');
    renderInit();
    window.save();
    showToast(`🔮 Konzentration: ${spell}`);
}
function breakConcentration(cbId) {
    const cb = getCombatant(cbId);
    if (!cb || !cb.concentration?.active) return;
    const spell = cb.concentration.spell;
    cb.concentration = { active: false, spell: '', lastDC: 10 };
    renderInit();
    window.save();
    showToast(`❌ Konzentration gebrochen: ${spell}`, 'warning');
}
function rollConcentrationCheck(cbId, dc) {
    const cb = getCombatant(cbId);
    if (!cb || !cb.concentration?.active) return;
    // KON-Modifikator vom verknüpften Charakter holen
    let conMod = 0;
    if (cb.type === 'player') {
        const char = EntityLookup.findByName('characters', cb.name);
        if (char?.attributes?.con) {
            conMod = Math.floor((char.attributes.con - 10) / 2);
        }
    }
    // Roll d20 + CON
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + conMod;
    const success = total >= dc;
    // Format result
    const modStr = conMod >= 0 ? `+${conMod}` : String(conMod);
    const resultText = success
        ? `✓ Konzentration gehalten! (${roll}${modStr} = ${total} vs DC ${dc})`
        : `✕ Konzentration verloren! (${roll}${modStr} = ${total} vs DC ${dc})`;
    if (success) {
        showToast(resultText, 'success');
    } else {
        breakConcentration(cbId);
        showToast(resultText, 'error');
    }
    // Ausstehende Prüfung löschen
    if (cb.concentration) {
        delete cb.concentration.pendingCheck;
    }
    renderInit();
    window.save();
}
// ============================================================
// AOE DAMAGE CALCULATOR
// ============================================================
let aoeCurrentDamage = 0;
function showAoEDamageModal() {
    const D = window.D;
    const combatants = D.initiative.combatants.filter(c => c.type !== 'lair' && c.currentHp > 0);
    if (!combatants.length) {
        showToast('Keine Kämpfer in der Initiative', 'error');
        return;
    }
    aoeCurrentDamage = 0;
    const content = `
        <div class="aoe-modal-content">
            <div class="aoe-modal-header">
                <h3>💥 AoE Schaden</h3>
                <button class="btn btn-sm" data-action="hide-modal" data-value="aoe-damage-modal">✕</button>
            </div>

            <div class="aoe-damage-input">
                <input type="text" id="aoe-damage-formula" placeholder="z.B. 8d6 oder 28" value="8d6">
                <button class="aoe-roll-btn" data-action="roll-aoe-damage">
                    🎲 Würfeln
                </button>
                <div class="aoe-damage-result" id="aoe-damage-result">—</div>
            </div>

            <div class="aoe-targets-header">
                <span>Ziele auswählen:</span>
                <div class="aoe-quick-select">
                    <button class="aoe-quick-btn" data-action="aoe-select-all">Alle</button>
                    <button class="aoe-quick-btn" data-action="aoe-select-none">Keine</button>
                    <button class="aoe-quick-btn" data-action="aoe-select-enemies">Gegner</button>
                </div>
            </div>

            <div class="aoe-targets-list" id="aoe-targets-list">
                ${combatants
                    .map(cb => {
                        const typeIcon =
                            cb.type === 'player' ? '👤' : cb.type === 'ally' ? '🤝' : '👹';
                        return `
                        <label class="aoe-target" data-id="${cb.id}">
                            <input type="checkbox" class="aoe-target-checkbox" id="aoe-cb-${cb.id}" data-id="${cb.id}" data-on-change="updateAoETargetDisplay">
                            <span class="aoe-target-hp">${cb.currentHp}/${cb.maxHp} HP</span>
                            <span class="aoe-target-name">${typeIcon} ${esc(cb.name)}</span>
                            <span class="aoe-target-save">
                                <input type="checkbox" id="aoe-save-${cb.id}" data-id="${cb.id}" data-on-change="updateAoETargetDisplay">
                                Save ½
                            </span>
                            <span class="aoe-target-damage" id="aoe-dmg-${cb.id}">—</span>
                        </label>
                    `;
                    })
                    .join('')}
            </div>

            <div class="aoe-modal-footer">
                <button class="btn" data-action="hide-modal" data-value="aoe-damage-modal">Abbrechen</button>
                <button class="aoe-apply-btn" id="aoe-apply-btn" data-action="apply-aoe-damage" disabled>
                    💥 Schaden anwenden
                </button>
            </div>
        </div>
    `;
    // Modal erstellen oder wiederverwenden
    let modal = $('aoe-damage-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'aoe-damage-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal aoe-modal">${content}</div>`;
        modal.onclick = e => {
            if (e.target === modal) hideModal('aoe-damage-modal');
        };
        document.body.appendChild(modal);
    } else {
        const modalContent = modal.querySelector('.modal');
        if (modalContent) modalContent.innerHTML = content;
    }
    showModal('aoe-damage-modal');
    $('aoe-damage-formula')?.focus();
}
function rollAoEDamage() {
    const formulaInput = $('aoe-damage-formula');
    const formula = formulaInput?.value?.trim();
    if (!formula) {
        showToast('Bitte Schadenswürfel eingeben', 'error');
        return;
    }
    // Parse and roll dice formula
    let total = 0;
    const diceMatch = formula.match(/(\d+)d(\d+)/i);
    if (diceMatch) {
        const count = parseInt(diceMatch[1]);
        const sides = parseInt(diceMatch[2]);
        for (let i = 0; i < count; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        // Add any flat modifier
        const rest = formula.replace(diceMatch[0], '').trim();
        const modMatch = rest.match(/([+-])\s*(\d+)/);
        if (modMatch) {
            const mod = parseInt(modMatch[2]);
            total += modMatch[1] === '+' ? mod : -mod;
        }
    } else {
        // Try parsing as a number
        total = parseInt(formula);
        if (isNaN(total)) {
            showToast('Ungültige Formel', 'error');
            return;
        }
    }
    aoeCurrentDamage = Math.max(0, total);
    const resultEl = $('aoe-damage-result');
    if (resultEl) {
        resultEl.textContent = String(aoeCurrentDamage);
        resultEl.style.animation = 'none';
        resultEl.offsetHeight; // Trigger reflow
        resultEl.style.animation = 'pulse 0.3s ease-out';
    }
    updateAoETargetDisplay();
    const applyBtn = $('aoe-apply-btn');
    if (applyBtn) applyBtn.disabled = false;
}
function updateAoETargetDisplay() {
    document.querySelectorAll('.aoe-target').forEach(el => {
        const id = el.dataset.id;
        const isSelected = document.getElementById(`aoe-cb-${id}`)?.checked;
        const hasSave = document.getElementById(`aoe-save-${id}`)?.checked;
        const dmgEl = document.getElementById(`aoe-dmg-${id}`);
        el.classList.toggle('selected', !!isSelected);
        if (dmgEl) {
            if (!isSelected || aoeCurrentDamage <= 0) {
                dmgEl.textContent = '—';
                dmgEl.className = 'aoe-target-damage';
            } else {
                const damage = hasSave ? Math.floor(aoeCurrentDamage / 2) : aoeCurrentDamage;
                dmgEl.textContent = `-${damage}`;
                dmgEl.className = `aoe-target-damage ${hasSave ? 'half' : 'full'}`;
            }
        }
    });
}
// Create debounced version for better performance with rapid selection changes
const debouncedUpdateAoE = debounce(updateAoETargetDisplay, UI_TIMING.AOE_UPDATE_DEBOUNCE);
function aoeSelectAll() {
    document.querySelectorAll('.aoe-target-checkbox').forEach(cb => (cb.checked = true));
    debouncedUpdateAoE();
}
function aoeSelectNone() {
    document.querySelectorAll('.aoe-target-checkbox').forEach(cb => (cb.checked = false));
    debouncedUpdateAoE();
}
function aoeSelectEnemies() {
    const D = window.D;
    const enemies = D.initiative.combatants.filter(c => c.type === 'enemy' || c.type === 'monster');
    const enemyIds = enemies.map(e => e.id);
    document.querySelectorAll('.aoe-target-checkbox').forEach(cb => {
        const cbId = parseInt(cb.dataset.id || '0');
        cb.checked = enemyIds.includes(cbId);
    });
    debouncedUpdateAoE();
}
function applyAoEDamage() {
    if (aoeCurrentDamage <= 0) {
        showToast('Erst Schaden würfeln', 'error');
        return;
    }
    const selectedTargets = [];
    document.querySelectorAll('.aoe-target-checkbox:checked').forEach(cb => {
        const id = parseInt(cb.dataset.id || '0');
        const hasSave = document.getElementById(`aoe-save-${id}`)?.checked || false;
        selectedTargets.push({ id, hasSave });
    });
    if (!selectedTargets.length) {
        showToast('Keine Ziele ausgewählt', 'error');
        return;
    }
    // Apply damage to each target
    let hitCount = 0;
    selectedTargets.forEach(({ id, hasSave }) => {
        const cb = getCombatant(id);
        if (!cb) return;
        const damage = hasSave ? Math.floor(aoeCurrentDamage / 2) : aoeCurrentDamage;
        const wasAtZero = cb.currentHp <= 0;
        // Apply damage (temp HP first)
        applyDamage(cb, damage);
        // Trigger concentration check if applicable
        if (cb.concentration?.active && damage > 0) {
            cb.concentration.pendingCheck = damage;
        }
        hitCount++;
    });
    hideModal('aoe-damage-modal');
    renderInit();
    window.save();
    showToast(`💥 AoE: ${aoeCurrentDamage} Schaden auf ${hitCount} Ziele`);
}
// ============================================================
// LOOT SYSTEM (Master-Detail Layout)
// ============================================================
let selectedLootId = null;
let currentLootFilter = 'all';
// Alias für Kompatibilität
function renderLoot() {
    renderLootList();
}
function renderLootList() {
    const listContainer = $('loot-list');
    const filterContainer = $('loot-filters');
    if (!listContainer) return;
    const D = window.D;
    // Update counter
    window.updateCounters({ 'loot-io-count': D.loot?.length || 0 });
    // Render filter chips (by category)
    if (filterContainer) {
        filterContainer.innerHTML = `
            <div class="loot-filter-chip ${currentLootFilter === 'all' ? 'active' : ''}" data-action="set-loot-filter" data-value="all">Alle</div>
            ${Object.entries(CATS)
                .map(
                    ([k, v]) => `
                <div class="loot-filter-chip ${currentLootFilter === k ? 'active' : ''}"
                     data-action="set-loot-filter" data-value="${k}">
                    ${v}
                </div>
            `
                )
                .join('')}
        `;
    }
    // Get search and filter
    const searchInput = $('loot-search');
    const search = (searchInput?.value || '').toLowerCase();
    let items = [...(D.loot || [])];
    // Apply category filter
    if (currentLootFilter !== 'all') {
        items = items.filter(i => i.category === currentLootFilter);
    }
    // Apply search
    if (search) {
        items = items.filter(
            i =>
                (i.name || '').toLowerCase().includes(search) ||
                (i.description || '').toLowerCase().includes(search) ||
                (i.special || '').toLowerCase().includes(search) ||
                (i.property || '').toLowerCase().includes(search) ||
                (i.tags || []).some(t => t.toLowerCase().includes(search))
        );
    }
    // Sort by name
    items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    // Empty state
    if (!items.length) {
        listContainer.innerHTML = `
            <div class="loot-detail-empty" style="padding: 40px;">
                <div class="loot-detail-empty-icon">📦</div>
                <div class="loot-detail-empty-text">${search || currentLootFilter !== 'all' ? 'Keine Treffer' : 'Truhe ist leer'}</div>
                ${
                    !search && currentLootFilter === 'all'
                        ? `
                    <button class="loot-add-btn" data-action="show-modal" data-value="loot-modal" style="margin-top: 12px;">
                        + Item hinzufügen
                    </button>
                `
                        : ''
                }
            </div>
        `;
        clearLootDetail();
        return;
    }
    // Render list items
    listContainer.innerHTML = items.map(item => renderLootItem(item)).join('');
    // Auto-select first if none selected
    if (!selectedLootId || !items.find(i => i.id === selectedLootId)) {
        selectLoot(items[0].id, false);
    } else {
        showLootDetail(selectedLootId);
    }
}
function renderLootItem(item) {
    const catIcon = CATS[item.category]?.split(' ')[0] || '📦';
    const isSelected = item.id === selectedLootId;
    const rarity = item.rarity || 'normal';
    const rarityColor = RARITY_COLORS[rarity] || RARITY_COLORS.normal;
    const depleted = item.quantity <= 0;
    return `
        <div class="loot-item ${isSelected ? 'selected' : ''} ${depleted ? 'depleted' : ''}" data-action="select-loot" data-id="${item.id}">
            <div class="loot-item-icon">${catIcon}</div>
            <div class="loot-item-info">
                <div class="loot-item-name" style="color: ${rarityColor};">
                    ${esc(item.name)}
                    ${rarity !== 'normal' ? `<span class="loot-item-tag" style="background: ${rarityColor}; color: var(--bg-dark);">${RARITY_LABELS[rarity]}</span>` : ''}
                </div>
                <div class="loot-item-meta">
                    ×${item.quantity} • ${((item.value || 0) * item.quantity).toFixed(0)} GM
                </div>
            </div>
            <div class="loot-item-badges">
                ${(item.tags || []).includes('attunement') ? '<span class="loot-badge" title="Einstimmung">🔮</span>' : ''}
            </div>
        </div>
    `;
}
function selectLoot(id, scroll = true) {
    selectedLootId = id;
    // Update selection in list
    document.querySelectorAll('.loot-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === String(id));
    });
    // Show detail
    showLootDetail(id);
    // Scroll into view if needed
    if (scroll) {
        const el = document.querySelector(`.loot-item[data-id="${id}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}
function showLootDetail(id) {
    const panel = $('loot-detail-panel');
    if (!panel) return;
    const item = EntityLookup.lootItem(id);
    if (!item) {
        clearLootDetail();
        return;
    }
    const catIcon = CATS[item.category]?.split(' ')[0] || '📦';
    const rarity = item.rarity || 'normal';
    const rarityColor = RARITY_COLORS[rarity] || RARITY_COLORS.normal;
    const totalValue = (item.value || 0) * Math.max(0, item.quantity);
    panel.innerHTML = `
        <div class="loot-detail-content">
            <div class="loot-detail-header">
                <div class="loot-detail-icon">${catIcon}</div>
                <div class="loot-detail-title">
                    <div class="loot-detail-name" style="color: ${rarityColor};">${esc(item.name)}</div>
                    <div class="loot-detail-subtitle">${CATS[item.category] || 'Sonstiges'} • ${RARITY_LABELS[rarity]}</div>
                </div>
                <div class="loot-detail-actions">
                    <button class="loot-detail-btn" data-action="edit-loot" data-id="${id}" title="Bearbeiten">✏️</button>
                    <button class="loot-detail-btn danger" data-action="delete-loot" data-id="${id}" title="Löschen">🗑️</button>
                </div>
            </div>

            ${
                (item.tags || []).length > 0
                    ? `
                <div class="loot-tags-section">
                    <div class="loot-tags">
                        ${(item.tags || []).map(t => `<span class="loot-tag">${LOOT_TAG_LABELS[t] || t}</span>`).join('')}
                    </div>
                </div>
            `
                    : ''
            }

            <div class="loot-section">
                <div class="loot-stats">
                    <div class="loot-stat">
                        <div class="loot-stat-label">Menge</div>
                        <div class="loot-stat-value">${item.quantity}</div>
                    </div>
                    <div class="loot-stat">
                        <div class="loot-stat-label">Wert</div>
                        <div class="loot-stat-value" style="color: var(--gold);">${totalValue.toFixed(0)} GM</div>
                    </div>
                    <div class="loot-stat">
                        <div class="loot-stat-label">Gewicht</div>
                        <div class="loot-stat-value">${item.weight ? item.weight + ' kg' : '—'}</div>
                    </div>
                </div>
            </div>

            ${
                item.origin
                    ? `
                <div class="loot-section">
                    <div class="loot-section-title">Herkunft</div>
                    <div>${ORIGIN_LABELS[item.origin] || item.origin}</div>
                </div>
            `
                    : ''
            }

            ${
                item.special
                    ? `
                <div class="loot-section">
                    <div class="loot-section-title">Besonderheit</div>
                    <div>${esc(item.special)}</div>
                </div>
            `
                    : ''
            }

            ${
                item.property
                    ? `
                <div class="loot-section">
                    <div class="loot-section-title">Eigenschaft</div>
                    <div>${esc(item.property)}</div>
                </div>
            `
                    : ''
            }

            ${
                item.description
                    ? `
                <div class="loot-section">
                    <div class="loot-section-title">Beschreibung</div>
                    <div class="loot-desc">${sanitizeHTML(item.description)}</div>
                </div>
            `
                    : ''
            }
        </div>
    `;
}
function clearLootDetail() {
    const panel = $('loot-detail-panel');
    if (panel) {
        panel.innerHTML = `
            <div class="loot-detail-empty">
                <div class="loot-detail-empty-icon">📦</div>
                <div class="loot-detail-empty-text">Wähle ein Item aus der Liste</div>
            </div>
        `;
    }
}
function setLootFilter(f) {
    currentLootFilter = f;
    renderLootList();
}
function showLootModal(id = null) {
    window.clearLootForm();
    const modal = $('loot-modal');
    const title = modal?.querySelector('.modal-title');
    if (id) {
        const item = EntityLookup.lootItem(id);
        if (!item) return;
        if (title) title.textContent = 'Item bearbeiten';
        const editIdInput = $('edit-loot-id');
        if (editIdInput) editIdInput.value = String(id);
        const nameInput = $('loot-name');
        const catInput = $('loot-cat');
        const rarityInput = $('loot-rarity');
        const qtyInput = $('loot-qty');
        const wtInput = $('loot-wt');
        const valInput = $('loot-val');
        const descDiv = $('loot-desc');
        if (nameInput) nameInput.value = item.name || '';
        if (catInput) catInput.value = item.category || 'misc';
        if (rarityInput) rarityInput.value = item.rarity || 'normal';
        if (qtyInput) qtyInput.value = String(item.quantity || 1);
        if (wtInput) wtInput.value = String(item.weight || '');
        if (valInput) valInput.value = String(item.value || '');
        if (descDiv) descDiv.innerHTML = sanitizeHTML(item.description || '');
        const originInput = $('loot-origin');
        const specialInput = $('loot-special');
        const propertyInput = $('loot-property');
        if (originInput) originInput.value = item.origin || '';
        if (specialInput) specialInput.value = item.special || '';
        if (propertyInput) propertyInput.value = item.property || '';
        // Tags laden
        document.querySelectorAll('#loot-tag-grid .loot-tag-chip input').forEach(cb => {
            cb.checked = (item.tags || []).includes(cb.value);
        });
        window.updateLootSelectedTags();
        const saveBtn = $('loot-save-btn');
        if (saveBtn) saveBtn.textContent = '💾 Speichern';
    } else {
        if (title) title.textContent = 'Item hinzufügen';
        const saveBtn = $('loot-save-btn');
        if (saveBtn) saveBtn.textContent = '+ Hinzufügen';
    }
    showModal('loot-modal');
    $('loot-name')?.focus();
}
function saveLoot() {
    const nameInput = $('loot-name');
    const name = nameInput.value.trim();
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    const editIdInput = $('edit-loot-id');
    const editId = editIdInput.value;
    // Tags aus den Checkboxen sammeln
    const tags = [];
    document.querySelectorAll('#loot-tag-grid .loot-tag-chip input:checked').forEach(cb => {
        tags.push(cb.value);
    });
    const catInput = $('loot-cat');
    const rarityInput = $('loot-rarity');
    const qtyInput = $('loot-qty');
    const wtInput = $('loot-wt');
    const valInput = $('loot-val');
    const descDiv = $('loot-desc');
    const originInput = $('loot-origin');
    const specialInput = $('loot-special');
    const propertyInput = $('loot-property');
    const item = {
        name,
        category: catInput.value,
        rarity: rarityInput.value,
        quantity: parseInt(qtyInput.value) || 1,
        weight: parseFloat(wtInput.value) || 0,
        value: parseFloat(valInput.value) || 0,
        description: sanitizeHTML(descDiv?.innerHTML || ''),
        origin: originInput?.value || '',
        special: specialInput?.value?.trim() || '',
        property: propertyInput?.value?.trim() || '',
        tags: tags,
        attunement: tags.includes('attunement')
    };
    const D = window.D;
    if (editId) {
        // Update existing item
        const idx = D.loot.findIndex(i => i.id === parseInt(editId));
        if (idx > -1) {
            D.loot[idx] = { ...D.loot[idx], ...item };
            showToast('Item aktualisiert');
            // Detail-Panel aktualisieren falls selbes Item
            if (selectedLootId === parseInt(editId)) {
                showLootDetail(parseInt(editId));
            }
        }
    } else {
        // Add new item (or merge with existing)
        const newItem = { ...item, id: nextId('loot') };
        const existing = D.loot.find(
            i =>
                i.name.toLowerCase() === name.toLowerCase() &&
                i.category === newItem.category &&
                i.rarity === newItem.rarity
        );
        if (existing) {
            existing.quantity += newItem.quantity;
            showToast('Menge erhöht');
        } else {
            D.loot.push(newItem);
            showToast('Item hinzugefügt');
            // Neues Item selektieren
            selectedLootId = newItem.id;
        }
    }
    hideModal('loot-modal');
    window.clearLootForm();
    renderLootList();
    if (selectedLootId) showLootDetail(selectedLootId);
    window.save();
}
function editLoot(id) {
    showLootModal(id);
}
function removeLoot(id) {
    if (confirm('Item entfernen?')) {
        window.pushUndo('Beute entfernt');
        const D = window.D;
        D.loot = D.loot.filter(i => i.id !== id);
        // Selektion zurücksetzen falls gelöschtes Item selektiert war
        if (selectedLootId === id) {
            selectedLootId = null;
            clearLootDetail();
        }
        renderLootList();
        window.save();
        showToast('Item entfernt');
    }
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
window.showAddEffect = showAddEffect;
window.addEffectFromGrid = addEffectFromGrid;
window.saveCustomEffect = saveCustomEffect;
window.removeEffect = removeEffect;
window.toggleDeathSave = toggleDeathSave;
window.useLA = useLA;
window.useLR = useLR;
window.resetLR = resetLR;
window.showConcentrationModal = showConcentrationModal;
window.breakConcentration = breakConcentration;
window.rollConcentrationCheck = rollConcentrationCheck;
window.showAoEDamageModal = showAoEDamageModal;
window.renderLoot = renderLoot;
window.renderLootList = renderLootList;
window.selectLoot = selectLoot;
window.setLootFilter = setLootFilter;
window.showLootModal = showLootModal;
window.saveLoot = saveLoot;
window.editLoot = editLoot;
window.removeLoot = removeLoot;
window.clearBattlefield = clearBattlefield;
