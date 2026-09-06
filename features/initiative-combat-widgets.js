// [SECTION:INITIATIVE_COMBAT_WIDGETS]
// ============================================================
// KAMPF-WIDGETS — Effects, Death Saves, Legendary Actions/Resistance,
// Concentration, AoE Damage (aus features/initiative.js ausgelagert, MAINT-01 13-10)
// Analog: features/initiative-mob.js (Kopf-/Exportblock-Konvention)
// Konstanten: CONDITIONS, CONDITION_COLORS, INIT_CONSTANTS, UI_TIMING (core/constants.js)
// ============================================================

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
// GLOBAL EXPORTS (for backward compatibility)
// ============================================================
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
