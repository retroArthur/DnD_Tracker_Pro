// ============================================================
// COMBAT ACTIONS - Initiative, HP, Effects, Conditions
// ============================================================

const CombatActions = {
    // Initiative actions
    'clear-battlefield': () => clearBattlefield(),
    'remove-combatant': (ctx) => removeCombatant(ctx.id),
    'toggle-death-save-stop': (ctx) => {
        ctx.event.stopPropagation();
        toggleDeathSave(ctx.id, ctx.target.dataset.type, parseInt(ctx.target.dataset.index));
    },
    'show-concentration-modal-stop': (ctx) => {
        ctx.event.stopPropagation();
        showConcentrationModal(ctx.id);
    },
    'break-concentration-stop': (ctx) => {
        ctx.event.stopPropagation();
        breakConcentration(ctx.id);
    },
    'roll-concentration-check-stop': (ctx) => {
        ctx.event.stopPropagation();
        rollConcentrationCheck(ctx.id, parseInt(ctx.target.dataset.dc));
    },
    'show-aoe-damage-modal': () => showAoEDamageModal(),
    'update-combatant-hp': (ctx) => updateInitiativeCombatantHP(ctx.id, parseInt(ctx.value)),
    'next-turn': () => nextTurn(),
    'prev-turn': () => prevTurn(),
    'sort-initiative': () => sortInit(),
    'edit-init-value': (ctx) => editInitValue(ctx.id),
    'toggle-init-slot-stop': (ctx) => {
        ctx.event.stopPropagation();
        toggleInitSlot(ctx.id, parseInt(ctx.value.split(',')[0]), parseInt(ctx.value.split(',')[1]));
    },
    'restore-spell-slots-stop': (ctx) => { ctx.event.stopPropagation(); restoreAllSpellSlots(ctx.id); },
    'toggle-spell-slot-stop': (ctx) => { ctx.event.stopPropagation(); toggleSpellSlot(ctx.id, parseInt(ctx.value)); },

    // Quick Actions
    'apply-quick-action': (ctx) => applyQuickAction(ctx.id, ctx.value),
    'dismiss-action-banner': (ctx) => dismissActionBanner(ctx.id),

    // HP Calculator actions
    'apply-hp-change': (ctx) => applyHpChange(ctx.value),
    'set-hp-preset': (ctx) => { const el = $('hp-calc-value'); if (el) el.value = ctx.value; },
    'mod-hp': (ctx) => modHp(ctx.id, parseInt(ctx.value)),
    'show-hp-calculator': (ctx) => showHpCalculator(ctx.type, ctx.id),
    'show-hp-calculator-stop': (ctx) => { ctx.event.stopPropagation(); showHpCalculator(ctx.type, ctx.id); },

    // Condition/Effect actions
    'toggle-condition': (ctx) => toggleCondition(ctx.value),
    'show-conditions-modal': (ctx) => showConditionsModal(ctx.type, ctx.id),
    'remove-condition-stop': (ctx) => { ctx.event.stopPropagation(); removeCondition(ctx.type, ctx.id, parseInt(ctx.value)); },
    'add-effect-from-grid': (ctx) => addEffectFromGrid(ctx.value),
    'remove-effect': (ctx) => removeEffect(ctx.id, parseInt(ctx.value)),

    // Encounter Calculator actions
    'calc-remove-party-level': (ctx) => removePartyLevel(parseInt(ctx.value)),
    'calc-remove-monster': (ctx) => removeMonster(parseInt(ctx.value)),
    'calc-load-party': () => loadPartyFromCharacters(),
    'calc-clear-party': () => clearParty(),
    'calc-add-party-level': () => addPartyLevel(),
    'calc-show-encounter-import': () => showEncounterImport(),
    'calc-clear-monsters': () => clearMonsters(),
    'calc-add-monster': () => addMonster(),
    'calc-adjust-difficulty': (ctx) => quickAdjustDifficulty(ctx.value),
    'calc-show-difficulty-selector': () => showDifficultySelector(),
    'calc-save-encounter': () => saveAsEncounter(),
    'calc-import-encounter': (ctx) => importEncounterMonsters(ctx.value),
    'calc-back-to-calculator': () => renderCalculatorModal(),
    'close-calculator-modal': () => hideCalculatorModal(),
    'calc-set-terrain': (ctx) => setCalculatorTerrain(ctx.value),
    'calc-toggle-lair': () => toggleCalculatorLair(),
    'calc-add-to-initiative': () => addCalculatorToInitiative(),

    // Roll actions
    'roll-attack': () => rollAttack(),
    'roll-attack-crit': () => rollAttack(true),
    'roll-saving-throw': (ctx) => rollSavingThrow(ctx.value),
    'roll-group-perception': () => rollGroupPerception(),
    'roll-attr-check': (ctx) => {
        const modifier = parseInt(ctx.target.dataset.value) || 0;
        const attr = ctx.target.dataset.attr;
        rollAttrCheck(modifier, attr);
    },
    'roll-char-save': (ctx) => {
        const modifier = parseInt(ctx.target.dataset.value) || 0;
        const attr = ctx.target.dataset.attr;
        rollCharSave(modifier, attr);
    },
    'roll-skill-check': (ctx) => {
        const modifier = parseInt(ctx.target.dataset.value) || 0;
        const skill = ctx.target.dataset.skill;
        rollSkillCheck(modifier, skill);
    },
    'roll-char-initiative': (ctx) => {
        const bonus = parseInt(ctx.target.dataset.value) || 0;
        const name = ctx.target.dataset.name;
        rollCharInitiative(bonus, name);
    },
    'roll-skill': (ctx) => {
        const mod = parseInt(ctx.target.dataset.mod) || 0;
        const skillName = ctx.target.dataset.name || '';
        rollSkillCheck(ctx.value, mod, skillName);
    },
    'update-attr-mod': (ctx) => updateAttrMod(ctx.value, ctx.target.id),
    'update-enc-attr-mod': (ctx) => updateEncAttrMod(ctx.value, ctx.target.id)
};

// Register all combat actions
if (typeof EventDelegation !== 'undefined') {
    Object.entries(CombatActions).forEach(([name, handler]) => {
        EventDelegation.registerAction(name, handler);
    });
}
