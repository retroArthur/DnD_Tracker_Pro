// [SECTION:HP_CALC]
// HP CALCULATOR - @hp @damage @heal @health
// ============================================================
function showHpCalculator(type, id) {
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;
    
    $('hp-calc-type').value = type;
    $('hp-calc-id').value = id;
    $('hp-calc-title').textContent = `HP: ${entity.name || 'Unbekannt'}`;
    
    // Handle different HP field names (characters vs combatants)
    const currentHp = entity.hpCurrent ?? entity.currentHp ?? 0;
    const maxHp = entity.hpMax ?? entity.maxHp ?? 0;
    const tempHp = entity.tempHp || 0;
    
    $('hp-calc-current').textContent = `${currentHp} / ${maxHp}${tempHp ? ` (+${tempHp})` : ''}`;
    $('hp-calc-value').value = '';
    
    showModal('hp-calc-modal');
    $('hp-calc-value').focus();
}

function applyHpChange(action) {
    const type = $('hp-calc-type').value;
    const id = parseInt($('hp-calc-id').value);
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;
    
    const valueStr = $('hp-calc-value').value.trim();
    if (!valueStr) return;
    
    // Parse dice formula or number
    const value = parseDiceFormula(valueStr);
    if (value <= 0 && action !== 'temp') return;
    
    // Determine which HP fields to use (characters vs combatants)
    const isCombatant = type === 'combatant';
    const hpCurrentKey = isCombatant ? 'currentHp' : 'hpCurrent';
    const hpMaxKey = isCombatant ? 'maxHp' : 'hpMax';
    
    const currentHp = entity[hpCurrentKey] || 0;
    const maxHp = entity[hpMaxKey] || 0;
    
    if (action === 'damage') {
        // Apply damage (consider temp HP first)
        let remaining = value;
        if (entity.tempHp > 0) {
            const absorbed = Math.min(entity.tempHp, remaining);
            entity.tempHp -= absorbed;
            remaining -= absorbed;
        }
        entity[hpCurrentKey] = Math.max(0, currentHp - remaining);
        showToast(`💔 ${value} Schaden (${entity.name})`);
    } else if (action === 'heal') {
        entity[hpCurrentKey] = Math.min(maxHp, currentHp + value);
        showToast(`💚 ${value} geheilt (${entity.name})`);
    } else if (action === 'temp') {
        entity.tempHp = Math.max(entity.tempHp || 0, value);
        showToast(`🛡️ ${value} temp HP (${entity.name})`);
    }
    
    // Update display
    const newCurrent = entity[hpCurrentKey] || 0;
    const newMax = entity[hpMaxKey] || 0;
    $('hp-calc-current').textContent = `${newCurrent} / ${newMax}${entity.tempHp ? ` (+${entity.tempHp})` : ''}`;
    
    renderParty();
    renderInit();
    save();
}

function parseDiceFormula(formula) {
    // Handle simple numbers
    if (/^\d+$/.test(formula)) return parseInt(formula);
    
    // Handle dice formulas like 2d6+3, 1d8, 3d6-2
    const match = formula.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
    if (!match) return parseInt(formula) || 0;
    
    const count = parseInt(match[1]) || 1;
    const sides = parseInt(match[2]);
    const modifier = parseInt(match[3]) || 0;
    
    let total = modifier;
    for (let i = 0; i < count; i++) {
        total += Math.floor(Math.random() * sides) + 1;
    }
    return Math.max(0, total);
}