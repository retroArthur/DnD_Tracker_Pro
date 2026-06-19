// [SECTION:DICE_CORE]
// Converted from dice-core.js to TypeScript
// Würfel-Kernfunktionen
// ============================================================
// STATE
// ============================================================
let diceHistory = [];
let diceFormulaHistory = [];
let lastDiceRoll = null;
let selectedDamageType = null;
const SKILLS = {
    str: [{ name: 'Athletik', skill: 'athletics' }],
    dex: [
        { name: 'Akrobatik', skill: 'acrobatics' },
        { name: 'Fingerfertigkeit', skill: 'sleightOfHand' },
        { name: 'Heimlichkeit', skill: 'stealth' }
    ],
    int: [
        { name: 'Arkane Kunde', skill: 'arcana' },
        { name: 'Geschichte', skill: 'history' },
        { name: 'Nachforschungen', skill: 'investigation' },
        { name: 'Naturkunde', skill: 'nature' },
        { name: 'Religion', skill: 'religion' }
    ],
    wis: [
        { name: 'Heilkunde', skill: 'medicine' },
        { name: 'Motiv erkennen', skill: 'insight' },
        { name: 'Tierumgang', skill: 'animalHandling' },
        { name: 'Überleben', skill: 'survival' },
        { name: 'Wahrnehmung', skill: 'perception' }
    ],
    cha: [
        { name: 'Auftreten', skill: 'performance' },
        { name: 'Einschüchtern', skill: 'intimidation' },
        { name: 'Täuschung', skill: 'deception' },
        { name: 'Überzeugen', skill: 'persuasion' }
    ]
};
// ============================================================
// DICE ROLLER - ENHANCED
// ============================================================
function rollDiceAnimated(sides) {
    // Animation - support both old .dice-btn and new .dice-die
    const btn =
        document.querySelector(`.dice-die.d${sides}`) ||
        document.querySelector(`.dice-btn.d${sides}`);
    if (btn) {
        btn.classList.add('rolling');
        setTimeout(() => btn.classList.remove('rolling'), window.APP_CONFIG.ANIMATION_SLOW);
    }
    const result = Math.floor(Math.random() * sides) + 1;
    const isCrit = sides === 20 && result === 20;
    const isFail = sides === 20 && result === 1;
    lastDiceRoll = { notation: `1d${sides}`, result, rolls: [result] };
    displayDiceResult(result, `1d${sides}`, [result], isCrit, isFail);
    addToDiceHistory(`1d${sides}`, result, [result]);
    addToFormulaHistory(`1d${sides}`);
}
function rollDice(sides) {
    return Math.floor(Math.random() * sides) + 1;
}
function rollCustomDice() {
    const notationEl = $('dice-notation');
    const multiEl = $('dice-multi');
    if (!notationEl) return;
    const notation = notationEl.value.trim();
    if (!notation) return;
    const multiCount = parseInt(multiEl?.value || '1') || 1;
    if (multiCount > 1) {
        // Mehrfachwurf
        rollMultiple(notation, multiCount);
    } else {
        const result = parseDiceNotation(notation);
        if (result) {
            const isCrit = notation.includes('d20') && result.rolls.includes(20);
            const isFail = notation.includes('d20') && result.rolls.includes(1);
            lastDiceRoll = { notation, total: result.total, rolls: result.rolls };
            displayDiceResult(result.total, notation, result.rolls, isCrit, isFail);
            addToDiceHistory(notation, result.total, result.rolls);
            addToFormulaHistory(notation);
        }
    }
}
// Helper to access save function
function rollMultiple(notation, count) {
    const results = [];
    const allRolls = [];
    for (let i = 0; i < count; i++) {
        const result = parseDiceNotation(notation);
        if (result) {
            results.push(result.total);
            allRolls.push(...result.rolls);
        }
    }
    const total = results.reduce((a, b) => a + b, 0);
    const display = results.join(' + ') + ` = ${total}`;
    lastDiceRoll = { notation: `${count}× ${notation}`, total, rolls: allRolls };
    displayDiceResult(display, `${count}× ${notation}`, allRolls, false, false);
    addToDiceHistory(`${count}× ${notation}`, total, allRolls);
    addToFormulaHistory(notation);
}
function rerollLast() {
    if (!lastDiceRoll) {
        showToast('Kein vorheriger Wurf');
        return;
    }
    const notation = lastDiceRoll.notation;
    if (notation.includes('×')) {
        const parts = notation.split('× ');
        rollMultiple(parts[1], parseInt(parts[0]));
    } else {
        const notationEl = $('dice-notation');
        const multiEl = $('dice-multi');
        if (notationEl) notationEl.value = notation;
        if (multiEl) multiEl.value = '1';
        rollCustomDice();
    }
}
function parseDiceNotation(notation) {
    // Parse: 2d6+3, 4d6kh3, 1d20+5, 2d20kl1
    const match = notation.toLowerCase().match(/^(\d+)?d(\d+)(k[hl](\d+))?([+-]\d+)?$/);
    if (!match) {
        alert('Ungültige Notation. Beispiele: 2d6+3, 4d6kh3');
        return null;
    }
    const count = parseInt(match[1]) || 1;
    const sides = parseInt(match[2]);
    const keep = match[3];
    const keepCount = parseInt(match[4]) || 1;
    const modifier = parseInt(match[5]) || 0;
    const rolls = [];
    for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    let keptRolls = [...rolls];
    if (keep) {
        const sorted = [...rolls].sort((a, b) => b - a);
        if (keep.includes('h')) keptRolls = sorted.slice(0, keepCount);
        else if (keep.includes('l')) keptRolls = sorted.slice(-keepCount);
    }
    const total = keptRolls.reduce((a, b) => a + b, 0) + modifier;
    return { total, rolls, keptRolls, modifier };
}
function rollAdvantage() {
    const result = parseDiceNotation('2d20kh1');
    if (!result) return;
    const isCrit = result.keptRolls[0] === 20;
    const isFail = result.keptRolls[0] === 1;
    lastDiceRoll = { notation: 'Vorteil', total: result.total, rolls: result.rolls };
    displayDiceResult(result.total, '⬆️ Vorteil (2d20kh1)', result.rolls, isCrit, isFail);
    addToDiceHistory('Vorteil', result.total, result.rolls);
}
function rollDisadvantage() {
    const result = parseDiceNotation('2d20kl1');
    if (!result) return;
    const isCrit = result.keptRolls[0] === 20;
    const isFail = result.keptRolls[0] === 1;
    lastDiceRoll = { notation: 'Nachteil', total: result.total, rolls: result.rolls };
    displayDiceResult(result.total, '⬇️ Nachteil (2d20kl1)', result.rolls, isCrit, isFail);
    addToDiceHistory('Nachteil', result.total, result.rolls);
}
function rollStats() {
    const stats = [];
    const allRolls = [];
    for (let i = 0; i < 6; i++) {
        const result = parseDiceNotation('4d6kh3');
        if (result) {
            stats.push(result.total);
            allRolls.push(...result.rolls);
        }
    }
    const display = stats.join(', ');
    const total = stats.reduce((a, b) => a + b, 0);
    lastDiceRoll = { notation: 'Stats', total: display, rolls: allRolls };
    displayDiceResult(display, '📊 Stats (4d6kh3 ×6)', allRolls, false, false);
    addToDiceHistory('Stats', `Σ${total}`, allRolls);
}
function rollCritDamage() {
    const notationEl = $('dice-notation');
    if (!notationEl) return;
    const notation = notationEl.value.trim();
    if (!notation) {
        showToast('Gib zuerst eine Schadensformel ein');
        return;
    }
    // Verdopple die Würfelanzahl
    const match = notation.toLowerCase().match(/^(\d+)?d(\d+)([+-]\d+)?$/);
    if (!match) {
        showToast('Für Krit-Schaden: einfache Formel wie 2d6+3');
        return;
    }
    const count = (parseInt(match[1]) || 1) * 2;
    const sides = parseInt(match[2]);
    const modifier = match[3] || '';
    const critNotation = `${count}d${sides}${modifier}`;
    const result = parseDiceNotation(critNotation);
    if (result) {
        lastDiceRoll = {
            notation: `💥 Krit: ${critNotation}`,
            total: result.total,
            rolls: result.rolls
        };
        displayDiceResult(
            result.total,
            `💥 Kritischer Treffer! ${notation} → ${critNotation}`,
            result.rolls,
            true,
            false
        );
        addToDiceHistory(`Krit: ${critNotation}`, result.total, result.rolls);
    }
}
function flipCoin() {
    const btn = document.querySelector('.dice-btn.coin');
    if (btn) {
        btn.classList.add('rolling');
        setTimeout(() => btn.classList.remove('rolling'), 400);
    }
    const result = Math.random() < 0.5 ? 'Kopf' : 'Zahl';
    const emoji = result === 'Kopf' ? '👑' : '🔢';
    lastDiceRoll = { notation: 'Münzwurf', total: result, rolls: [result] };
    displayDiceResult(`${emoji} ${result}`, '🪙 Münzwurf', [result], false, false);
    addToDiceHistory('Münzwurf', result, [result]);
}
function rollAttack(withAdvantage = false) {
    const targetACEl = $('target-ac');
    const attackBonusEl = $('attack-bonus');
    const targetAC = parseInt(targetACEl?.value || '15') || 15;
    const bonus = parseInt(attackBonusEl?.value || '0') || 0;
    let result;
    let notation;
    let rolls;
    if (withAdvantage) {
        const advResult = parseDiceNotation('2d20kh1');
        if (!advResult) return;
        result = advResult.keptRolls[0] + bonus;
        rolls = advResult.rolls;
        notation = `2d20kh1+${bonus}`;
    } else {
        const roll = rollDice(20);
        result = roll + bonus;
        rolls = [roll];
        notation = `1d20+${bonus}`;
    }
    const naturalRoll = Math.max(...rolls);
    const isCrit = naturalRoll === 20;
    const isFail = naturalRoll === 1;
    const isHit = isCrit || (!isFail && result >= targetAC);
    lastDiceRoll = { notation, total: result, rolls };
    let extraHtml = '';
    if (isCrit) {
        extraHtml = `<div class="dice-result-hit">🎯 KRITISCHER TREFFER!</div>`;
    } else if (isFail) {
        extraHtml = `<div class="dice-result-miss">💨 KRITISCHER FEHLSCHLAG!</div>`;
    } else if (isHit) {
        extraHtml = `<div class="dice-result-hit">✅ Treffer! (RK ${targetAC})</div>`;
    } else {
        extraHtml = `<div class="dice-result-miss">❌ Verfehlt (RK ${targetAC})</div>`;
    }
    displayDiceResult(result, `⚔️ Angriff: ${notation}`, rolls, isCrit, isFail, extraHtml);
    addToDiceHistory(`Angriff vs RK${targetAC}`, result, rolls);
}
function rollSavingThrow() {
    const dcEl = $('save-dc');
    const attrEl = $('save-attr');
    const modEl = $('save-mod');
    const dc = parseInt(dcEl?.value || '15') || 15;
    const attr = (attrEl?.value || 'CON').toUpperCase();
    const mod = parseInt(modEl?.value || '0') || 0;
    const roll = rollDice(20);
    const result = roll + mod;
    const isCrit = roll === 20;
    const isFail = roll === 1;
    const success = isCrit || (!isFail && result >= dc);
    lastDiceRoll = { notation: `${attr} Save`, total: result, rolls: [roll] };
    let extraHtml = '';
    if (isCrit) {
        extraHtml = `<div class="dice-result-hit">✨ AUTO-ERFOLG! (Nat 20)</div>`;
    } else if (isFail) {
        extraHtml = `<div class="dice-result-miss">💀 AUTO-FEHLSCHLAG! (Nat 1)</div>`;
    } else if (success) {
        extraHtml = `<div class="dice-result-hit">✅ Erfolg! (DC ${dc})</div>`;
    } else {
        extraHtml = `<div class="dice-result-miss">❌ Fehlschlag (DC ${dc})</div>`;
    }
    displayDiceResult(
        result,
        `🛡️ ${attr}-Rettungswurf: 1d20${mod >= 0 ? '+' : ''}${mod}`,
        [roll],
        isCrit,
        isFail,
        extraHtml
    );
    addToDiceHistory(`${attr} Save DC${dc}`, result, [roll]);
}
function rollGroupPerception() {
    const D = window.D;
    if (!D.characters?.length) {
        showToast('Keine Charaktere vorhanden');
        return;
    }
    const results = [];
    D.characters.forEach(ch => {
        const wis = ch.attributes?.wis || 10;
        const mod = Math.floor((wis - 10) / 2);
        const profBonus = ch.saveProficiencies?.wis ? ch.proficiencyBonus || 2 : 0;
        const roll = rollDice(20);
        const total = roll + mod + profBonus;
        results.push({ name: ch.name, roll, total, passive: 10 + mod + profBonus });
    });
    const highest = Math.max(...results.map(r => r.total));
    lastDiceRoll = {
        notation: 'Gruppen-Wahrnehmung',
        total: highest,
        rolls: results.map(r => r.roll)
    };
    const extraHtml = `<div style="text-align: left; font-size: 0.85em; margin-top: 8px;">
        ${results.map(r => `<div>${r.name}: <strong>${r.total}</strong> (🎲${r.roll}) | Passiv: ${r.passive}</div>`).join('')}
    </div>`;
    displayDiceResult(
        `Höchste: ${highest}`,
        '👁️ Gruppen-Wahrnehmung',
        results.map(r => r.roll),
        false,
        false,
        extraHtml
    );
    addToDiceHistory(
        'Gruppen-Wahr.',
        `Max: ${highest}`,
        results.map(r => r.roll)
    );
}
function displayDiceResult(result, notation, rolls, isCrit, isFail, extraHtml = '') {
    // Try new structure first, fall back to old
    const heroContainer = $('dice-hero');
    const heroResult = $('dice-hero-result');
    const heroFormula = $('dice-hero-formula');
    const heroBreakdown = $('dice-hero-breakdown');
    // Damage type suffix
    const dmgType = selectedDamageType ? ` ${selectedDamageType}` : '';
    if (heroContainer && heroResult) {
        // New compact design
        heroResult.textContent = String(result);
        heroResult.className = '';
        if (heroFormula) heroFormula.textContent = notation + dmgType;
        if (heroBreakdown) {
            const rollsStr = Array.isArray(rolls) ? rolls.join(', ') : rolls;
            heroBreakdown.textContent = `[${rollsStr}]`;
            // Add extra html if present
            if (extraHtml) {
                heroBreakdown.innerHTML += `<div style="margin-top: 6px;">${extraHtml}</div>`;
            }
        }
        // Effects
        heroContainer.classList.remove('crit', 'fail');
        if (isCrit) {
            heroContainer.classList.add('crit');
            createConfetti(heroContainer);
        } else if (isFail) {
            heroContainer.classList.add('fail');
        }
        // Animation
        heroContainer.style.transform = 'scale(1.03)';
        setTimeout(() => (heroContainer.style.transform = 'scale(1)'), 200);
    } else {
        // Fallback to old structure
        const container = $('dice-result');
        if (!container) return;
        const main = container.querySelector('.dice-result-main');
        const detail = container.querySelector('.dice-result-detail');
        const extra = $('dice-result-extra');
        if (main) {
            main.textContent = String(result);
            main.className =
                'dice-result-main' + (isCrit ? ' dice-crit' : '') + (isFail ? ' dice-fail' : '');
        }
        if (detail) {
            detail.innerHTML = `${notation}${dmgType} → [${Array.isArray(rolls) ? rolls.join(', ') : rolls}]`;
        }
        if (extra) {
            if (extraHtml) {
                extra.innerHTML = extraHtml;
                extra.style.display = 'block';
            } else {
                extra.style.display = 'none';
            }
        }
        container.classList.remove('crit-effect', 'fail-effect');
        if (isCrit) {
            container.classList.add('crit-effect');
            createConfetti(container);
        } else if (isFail) {
            container.classList.add('fail-effect');
        }
        container.style.transform = 'scale(1.05)';
        setTimeout(() => (container.style.transform = 'scale(1)'), 200);
    }
}
function createConfetti(container) {
    // Use CSS variables for theme consistency
    const style = getComputedStyle(document.documentElement);
    const colors = [
        style.getPropertyValue('--green').trim() || '#4ade80',
        style.getPropertyValue('--yellow').trim() || '#fbbf24',
        style.getPropertyValue('--blue').trim() || '#60a5fa',
        style.getPropertyValue('--pink').trim() || '#f472b6',
        style.getPropertyValue('--purple').trim() || '#c084fc'
    ];
    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '0';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.3 + 's';
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), 1500);
    }
}
function toggleDamageType(chip) {
    const wasSelected = chip.classList.contains('selected');
    // Handle both old and new class names
    document
        .querySelectorAll('.damage-type-chip, .dmg-chip')
        .forEach(c => c.classList.remove('selected'));
    if (!wasSelected) {
        chip.classList.add('selected');
        selectedDamageType = chip.dataset.type || null;
    } else {
        selectedDamageType = null;
    }
}
function addToDiceHistory(notation, result, rolls) {
    const dmgType = selectedDamageType ? ` (${selectedDamageType})` : '';
    diceHistory.unshift({ notation: notation + dmgType, result, rolls, time: new Date() });
    if (diceHistory.length > 30) diceHistory.pop();
    renderDiceHistory();
    // D-04: Tee every roll into IDB stats store (additive — in-memory diceHistory unchanged, D-04a)
    if (typeof window.statsIdbPut === 'function') {
        window.statsIdbPut({ notation, result, rolls, timestamp: Date.now(),
            sessionId: window._currentSessionId || 'default',
            charId: null });
    }
}
function addToFormulaHistory(formula) {
    if (!formula || formula.includes('×')) return;
    diceFormulaHistory = diceFormulaHistory.filter(f => f !== formula);
    diceFormulaHistory.unshift(formula);
    if (diceFormulaHistory.length > 8) diceFormulaHistory.pop();
    renderFormulaHistory();
}
function renderFormulaHistory() {
    const c = $('dice-formula-history');
    if (!c) return;
    c.innerHTML = diceFormulaHistory
        .map(
            f =>
                `<span class="dice-formula-chip" data-action="set-dice-formula" data-value="${f}">${f}</span>`
        )
        .join('');
}
function renderDiceHistory() {
    const c = $('dice-history');
    if (!c) return;
    // Reverse to show most recent first, limit to 20 items for horizontal scroll
    const recent = diceHistory.slice(0, 20);
    c.innerHTML = recent
        .map(h => {
            // Extract just the dice notation without labels
            const cleanNotation = String(h.notation)
                .split(' ')[0]
                .replace(/[⬆️⬇️📊💥🪙⚔️🛡️👁️🎯]/g, '')
                .trim();
            return `
            <div class="dice-history-item" data-action="set-dice-history" data-value="${esc(cleanNotation || h.notation)}">
                <span class="dice-history-notation">${esc(cleanNotation || h.notation)}</span>
                <span class="dice-history-result">${h.result}</span>
            </div>
        `;
        })
        .join('');
}
function clearDiceHistory() {
    diceHistory = [];
    renderDiceHistory();
    showToast('Würfelverlauf gelöscht');
}
// ============================================================
// CHARACTER-BASED DICE ROLLS
// ============================================================
function updateDiceCharSelect() {
    const select = $('dice-char-select');
    if (!select) return;
    const D = window.D;
    select.innerHTML =
        '<option value="">— Charakter —</option>' +
        (D.characters || [])
            .map(ch => `<option value="${ch.id}">${esc(ch.name)}</option>`)
            .join('');
}
function updateDiceCharStats() {
    const selectEl = $('dice-char-select');
    if (!selectEl) return;
    const charId = parseInt(selectEl.value);
    const D = window.D;
    const ch = D.characters?.find(c => c.id === charId);
    const attrs = ch?.attributes || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    const saves = ch?.saveProficiencies || {};
    const profBonus = ch?.proficiencyBonus || window.getProficiencyBonus(ch?.level || 1);
    // Update attribute mods
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const val = attrs[attr] || 10;
        const mod = Math.floor((val - 10) / 2);
        const modEl = $(`dice-${attr}-mod`);
        if (modEl) modEl.textContent = mod >= 0 ? `+${mod}` : `${mod}`;
        // Save mods
        const saveMod = mod + (saves[attr] ? profBonus : 0);
        const saveEl = $(`dice-save-${attr}`);
        if (saveEl)
            saveEl.textContent = (saveMod >= 0 ? '+' : '') + saveMod + (saves[attr] ? ' ●' : '');
    });
    // Render skill buttons
    renderSkillButtons(ch, attrs, profBonus);
}
function renderSkillButtons(ch, attrs, profBonus) {
    const grid = $('dice-skill-grid');
    if (!grid) return;
    let html = '';
    Object.entries(SKILLS).forEach(([attr, skills]) => {
        const attrVal = attrs[attr] || 10;
        const attrMod = Math.floor((attrVal - 10) / 2);
        skills.forEach(skill => {
            const isProficient = ch?.skillProficiencies?.[skill.skill];
            const mod = attrMod + (isProficient ? profBonus : 0);
            const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
            html += `<button class="dice-skill-btn" data-action="roll-skill" data-value="${skill.skill}" data-mod="${mod}" data-name="${skill.name}">
                ${skill.name}<span class="skill-mod">${modStr}${isProficient ? '●' : ''}</span>
            </button>`;
        });
    });
    grid.innerHTML = html;
}
function rollAttrCheck(attr) {
    const selectEl = $('dice-char-select');
    if (!selectEl) return;
    const charId = parseInt(selectEl.value);
    const D = window.D;
    const ch = D.characters?.find(c => c.id === charId);
    const val = ch?.attributes?.[attr] || 10;
    const mod = Math.floor((val - 10) / 2);
    const roll = rollDice(20);
    const total = roll + mod;
    const isCrit = roll === 20;
    const isFail = roll === 1;
    const charName = ch ? `${ch.name}: ` : '';
    lastDiceRoll = { notation: `${attr.toUpperCase()}-Check`, total, rolls: [roll] };
    displayDiceResult(
        total,
        `${charName}${attr.toUpperCase()}-Check (1d20${mod >= 0 ? '+' : ''}${mod})`,
        [roll],
        isCrit,
        isFail
    );
    addToDiceHistory(`${charName}${attr.toUpperCase()}`, total, [roll]);
}
function rollCharSave(attr) {
    const selectEl = $('dice-char-select');
    if (!selectEl) return;
    const charId = parseInt(selectEl.value);
    const D = window.D;
    const ch = D.characters?.find(c => c.id === charId);
    const val = ch?.attributes?.[attr] || 10;
    const mod = Math.floor((val - 10) / 2);
    const profBonus = ch?.proficiencyBonus || window.getProficiencyBonus(ch?.level || 1);
    const isProficient = ch?.saveProficiencies?.[attr];
    const totalMod = mod + (isProficient ? profBonus : 0);
    const roll = rollDice(20);
    const total = roll + totalMod;
    const isCrit = roll === 20;
    const isFail = roll === 1;
    const charName = ch ? `${ch.name}: ` : '';
    lastDiceRoll = { notation: `${attr.toUpperCase()}-Save`, total, rolls: [roll] };
    displayDiceResult(
        total,
        `${charName}${attr.toUpperCase()}-Rettungswurf (1d20${totalMod >= 0 ? '+' : ''}${totalMod})`,
        [roll],
        isCrit,
        isFail
    );
    addToDiceHistory(`${charName}${attr.toUpperCase()} Save`, total, [roll]);
}
function rollSkillCheck(skill, mod, skillName) {
    const selectEl = $('dice-char-select');
    if (!selectEl) return;
    const charId = parseInt(selectEl.value);
    const D = window.D;
    const ch = D.characters?.find(c => c.id === charId);
    const roll = rollDice(20);
    const total = roll + mod;
    const isCrit = roll === 20;
    const isFail = roll === 1;
    const charName = ch ? `${ch.name}: ` : '';
    lastDiceRoll = { notation: skillName, total, rolls: [roll] };
    displayDiceResult(
        total,
        `${charName}${skillName} (1d20${mod >= 0 ? '+' : ''}${mod})`,
        [roll],
        isCrit,
        isFail
    );
    addToDiceHistory(`${charName}${skillName}`, total, [roll]);
}
function rollCharInitiative() {
    const selectEl = $('dice-char-select');
    if (!selectEl) return;
    const charId = parseInt(selectEl.value);
    const D = window.D;
    const ch = D.characters?.find(c => c.id === charId);
    if (!ch) {
        showToast('Wähle zuerst einen Charakter');
        return;
    }
    const initBonus = ch.initiative || Math.floor(((ch.attributes?.dex || 10) - 10) / 2);
    const roll = rollDice(20);
    const total = roll + initBonus;
    lastDiceRoll = { notation: 'Initiative', total, rolls: [roll] };
    displayDiceResult(
        total,
        `🎯 ${ch.name}: Initiative (1d20${initBonus >= 0 ? '+' : ''}${initBonus})`,
        [roll],
        roll === 20,
        roll === 1
    );
    addToDiceHistory(`${ch.name} Init`, total, [roll]);
}
// ============================================================
// FLOATING DICE PANEL
// ============================================================
const floatingDiceHistory = [];
function toggleFloatingDice() {
    const panel = $('floating-dice-panel');
    if (panel) {
        panel.classList.toggle('show');
    }
}
function rollFloatingDice(sides) {
    const btn = document.querySelector(`.fdp-die.d${sides}`);
    if (btn) {
        btn.classList.add('rolling');
        setTimeout(() => btn.classList.remove('rolling'), 400);
    }
    const result = Math.floor(Math.random() * sides) + 1;
    const isCrit = sides === 20 && result === 20;
    const isFail = sides === 20 && result === 1;
    updateFloatingResult(result, `1d${sides}`, [result], isCrit, isFail);
    addToFloatingHistory(`1d${sides}`, result);
    // Also update main dice display if visible
    lastDiceRoll = { notation: `1d${sides}`, result, rolls: [result] };
    if ($('dice-hero')) {
        displayDiceResult(result, `1d${sides}`, [result], isCrit, isFail);
    }
    addToDiceHistory(`1d${sides}`, result, [result]);
}
function rollFloatingAdvantage() {
    const result = parseDiceNotation('2d20kh1');
    if (!result) return;
    const isCrit = result.keptRolls[0] === 20;
    const isFail = result.keptRolls[0] === 1;
    updateFloatingResult(result.total, '⬆️ Vorteil', result.rolls, isCrit, isFail);
    addToFloatingHistory('Vorteil', result.total);
    lastDiceRoll = { notation: 'Vorteil', total: result.total, rolls: result.rolls };
    if ($('dice-hero')) {
        displayDiceResult(result.total, '⬆️ Vorteil (2d20kh1)', result.rolls, isCrit, isFail);
    }
    addToDiceHistory('Vorteil', result.total, result.rolls);
}
function rollFloatingDisadvantage() {
    const result = parseDiceNotation('2d20kl1');
    if (!result) return;
    const isCrit = result.keptRolls[0] === 20;
    const isFail = result.keptRolls[0] === 1;
    updateFloatingResult(result.total, '⬇️ Nachteil', result.rolls, isCrit, isFail);
    addToFloatingHistory('Nachteil', result.total);
    lastDiceRoll = { notation: 'Nachteil', total: result.total, rolls: result.rolls };
    if ($('dice-hero')) {
        displayDiceResult(result.total, '⬇️ Nachteil (2d20kl1)', result.rolls, isCrit, isFail);
    }
    addToDiceHistory('Nachteil', result.total, result.rolls);
}
function rollFloatingCustom() {
    const notationEl = $('fdp-notation');
    if (!notationEl) return;
    const notation = notationEl.value.trim();
    if (!notation) return;
    const result = parseDiceNotation(notation);
    if (result) {
        const isCrit = notation.includes('d20') && result.rolls.includes(20);
        const isFail = notation.includes('d20') && result.rolls.includes(1);
        updateFloatingResult(result.total, notation, result.rolls, isCrit, isFail);
        addToFloatingHistory(notation, result.total);
        lastDiceRoll = { notation, total: result.total, rolls: result.rolls };
        if ($('dice-hero')) {
            displayDiceResult(result.total, notation, result.rolls, isCrit, isFail);
        }
        addToDiceHistory(notation, result.total, result.rolls);
        addToFormulaHistory(notation);
    }
}
function updateFloatingResult(result, formula, rolls, isCrit, isFail) {
    const resultEl = $('fdp-result');
    const formulaEl = $('fdp-formula');
    const breakdownEl = $('fdp-breakdown');
    if (resultEl) {
        resultEl.textContent = String(result);
        resultEl.className = 'fdp-number';
        if (isCrit) resultEl.classList.add('crit');
        if (isFail) resultEl.classList.add('fail');
        // Pulse animation
        resultEl.style.transform = 'scale(1.1)';
        setTimeout(() => (resultEl.style.transform = 'scale(1)'), 200);
    }
    if (formulaEl) {
        formulaEl.textContent = formula;
    }
    if (breakdownEl) {
        breakdownEl.textContent = `[${rolls.join(', ')}]`;
    }
}
function addToFloatingHistory(notation, result) {
    floatingDiceHistory.unshift({ notation, result });
    if (floatingDiceHistory.length > 5) floatingDiceHistory.pop();
    renderFloatingHistory();
}
function renderFloatingHistory() {
    const container = $('fdp-history');
    if (!container) return;
    container.innerHTML = floatingDiceHistory
        .map(
            h => `
        <div class="fdp-history-item" data-action="reroll-floating" data-value="${esc(h.notation)}">
            <span class="fdp-history-result">${h.result}</span>
            <span class="fdp-history-notation">${esc(h.notation)}</span>
        </div>
    `
        )
        .join('');
}
function rerollFloating(notation) {
    if (notation === 'Vorteil') {
        rollFloatingAdvantage();
    } else if (notation === 'Nachteil') {
        rollFloatingDisadvantage();
    } else {
        const notationEl = $('fdp-notation');
        if (notationEl) notationEl.value = notation;
        rollFloatingCustom();
    }
}
function initDiceKeyboardListeners() {
    const mainNotation = $('dice-notation');
    if (mainNotation) {
        mainNotation.addEventListener('keypress', e => {
            if (e.key === 'Enter') rollCustomDice();
        });
    }
    const floatingNotation = $('fdp-notation');
    if (floatingNotation) {
        floatingNotation.addEventListener('keypress', e => {
            if (e.key === 'Enter') rollFloatingCustom();
        });
    }
}
// ============================================================
// BACKWARD COMPATIBILITY - Export to window
// ============================================================
window.rollDiceAnimated = rollDiceAnimated;
window.initDiceKeyboardListeners = initDiceKeyboardListeners;
window.rollCustomDice = rollCustomDice;
window.rerollLast = rerollLast;
window.parseDiceNotation = parseDiceNotation;
window.rollAdvantage = rollAdvantage;
window.rollDisadvantage = rollDisadvantage;
window.rollStats = rollStats;
window.rollCritDamage = rollCritDamage;
window.flipCoin = flipCoin;
window.rollAttack = rollAttack;
window.rollSavingThrow = rollSavingThrow;
window.rollGroupPerception = rollGroupPerception;
window.toggleDamageType = toggleDamageType;
window.addToDiceHistory = addToDiceHistory;
window.renderDiceHistory = renderDiceHistory;
window.clearDiceHistory = clearDiceHistory;
window.updateDiceCharSelect = updateDiceCharSelect;
window.updateDiceCharStats = updateDiceCharStats;
window.rollAttrCheck = rollAttrCheck;
window.rollCharSave = rollCharSave;
window.rollSkillCheck = rollSkillCheck;
window.rollCharInitiative = rollCharInitiative;
window.toggleFloatingDice = toggleFloatingDice;
window.rollFloatingDice = rollFloatingDice;
window.rollFloatingAdvantage = rollFloatingAdvantage;
window.rollFloatingDisadvantage = rollFloatingDisadvantage;
window.rollFloatingCustom = rollFloatingCustom;
window.rerollFloating = rerollFloating;
// Export diceHistory array reference for E2E test access (phase 06-03)
window.diceHistory = diceHistory;
