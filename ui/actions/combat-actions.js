// [SECTION:COMBAT_ACTIONS]
// ============================================================
// COMBAT ACTIONS - @initiative @hp @effects @conditions
// ============================================================

const CombatActions = {
    // Initiative actions
    'clear-battlefield': () => clearBattlefield(),
    'remove-combatant': ctx => removeCombatant(ctx.id),
    'toggle-death-save-stop': ctx => {
        ctx.event.stopPropagation();
        toggleDeathSave(ctx.id, ctx.target.dataset.type, parseInt(ctx.target.dataset.index));
    },
    'show-concentration-modal-stop': ctx => {
        ctx.event.stopPropagation();
        showConcentrationModal(ctx.id);
    },
    'break-concentration-stop': ctx => {
        ctx.event.stopPropagation();
        breakConcentration(ctx.id);
    },
    'roll-concentration-check-stop': ctx => {
        ctx.event.stopPropagation();
        rollConcentrationCheck(ctx.id, parseInt(ctx.target.dataset.dc));
    },
    // INIT-01: Statblock-Drawer
    'show-init-statblock': ctx => showInitStatblockPanel(ctx.id),
    'close-init-statblock': () => closeInitStatblockPanel(),

    // INIT-02: Legendäre Aktionen / Widerstände Pips
    'init-use-la-stop': ctx => {
        ctx.event.stopPropagation();
        useLA(ctx.id, parseInt(ctx.target.dataset.index));
    },
    'init-use-lr-stop': ctx => {
        ctx.event.stopPropagation();
        useLR(ctx.id, parseInt(ctx.target.dataset.index));
    },
    'init-reset-lr-stop': ctx => {
        ctx.event.stopPropagation();
        resetLR(ctx.id);
    },

    // INIT-03: Mob-Modus (D-11, D-13, D-14)
    'init-mob-set-mode-stop': ctx => {
        ctx.event.stopPropagation();
        setMobAttackMode(ctx.id, ctx.target.dataset.mode);
    },
    'init-mob-attack-stop': ctx => {
        ctx.event.stopPropagation();
        rollMobAttack(ctx.id);
    },
    'init-mob-dissolve-stop': ctx => {
        ctx.event.stopPropagation();
        dissolveMob(ctx.id);
    },

    'show-aoe-damage-modal': () => showAoEDamageModal(),
    'set-concentration': ctx => setConcentration(ctx.id),
    'roll-aoe-damage': () => rollAoEDamage(),
    'aoe-select-all': () => aoeSelectAll(),
    'aoe-select-none': () => aoeSelectNone(),
    'aoe-select-enemies': () => aoeSelectEnemies(),
    'apply-aoe-damage': () => applyAoEDamage(),
    'select-rest-type': ctx => selectRestType(ctx.value),
    'apply-rest': () => applyRest(),
    'adjust-rest-hit-dice': ctx => adjustRestHitDice(ctx.id, parseInt(ctx.value, 10)),
    'apply-gold-split': () => applyGoldSplit(),
    'collect-all-gold': () => collectAllGold(),
    'update-combatant-hp': ctx => updateInitiativeCombatantHP(ctx.id, parseInt(ctx.value)),
    'next-turn': () => nextTurn(),
    'prev-turn': () => prevTurn(),
    'sort-initiative': () => sortInit(),
    'edit-init-value': ctx => editInitValue(ctx.id),
    'toggle-init-slot-stop': ctx => {
        ctx.event.stopPropagation();
        toggleInitSlot(
            ctx.id,
            parseInt(ctx.value.split(',')[0]),
            parseInt(ctx.value.split(',')[1])
        );
    },
    'restore-spell-slots-stop': ctx => {
        ctx.event.stopPropagation();
        restoreAllSpellSlots(ctx.id);
    },
    'toggle-spell-slot-stop': ctx => {
        ctx.event.stopPropagation();
        toggleSpellSlot(ctx.id, parseInt(ctx.value));
    },

    // Quick Actions
    'apply-quick-action': ctx => applyQuickAction(ctx.id, ctx.value),

    // HP Calculator actions
    'apply-hp-change': ctx => applyHpChange(ctx.value),
    'set-hp-preset': ctx => {
        const el = $('hp-calc-value');
        if (el) el.value = ctx.value;
    },
    'mod-hp': ctx => modHp(ctx.id, parseInt(ctx.value)),
    'show-hp-calculator': ctx => showHpCalculator(ctx.type, ctx.id),
    'show-hp-calculator-stop': ctx => {
        ctx.event.stopPropagation();
        showHpCalculator(ctx.type, ctx.id);
    },

    // Condition/Effect actions
    'toggle-condition': ctx => toggleCondition(ctx.value),
    'show-conditions-modal': ctx => showConditionsModal(ctx.type, ctx.id),
    'remove-condition-stop': ctx => {
        ctx.event.stopPropagation();
        removeCondition(ctx.type, ctx.id, parseInt(ctx.value));
    },
    'add-effect-from-grid': ctx => addEffectFromGrid(ctx.value),
    'remove-effect': ctx => removeEffect(ctx.id, parseInt(ctx.value)),

    // Encounter Calculator actions
    'calc-remove-party-level': ctx => removePartyLevel(parseInt(ctx.value)),
    'calc-remove-monster': ctx => removeMonster(parseInt(ctx.value)),
    'calc-load-party': () => loadPartyFromCharacters(),
    'calc-clear-party': () => clearParty(),
    'calc-add-party-level': () => addPartyLevel(),
    'calc-show-encounter-import': () => showEncounterImport(),
    'calc-clear-monsters': () => clearMonsters(),
    'calc-add-monster': () => addMonster(),
    'calc-adjust-difficulty': ctx => quickAdjustDifficulty(ctx.value),
    'calc-show-difficulty-selector': () => showDifficultySelector(),
    'calc-save-encounter': () => saveAsEncounter(),
    'calc-import-encounter': ctx => importEncounterMonsters(ctx.value),
    'calc-back-to-calculator': () => renderCalculatorModal(),
    'close-calculator-modal': () => hideCalculatorModal(),
    'calc-set-terrain': ctx => setCalculatorTerrain(ctx.value),
    'calc-toggle-lair': () => toggleCalculatorLair(),
    'calc-add-to-initiative': () => addCalculatorToInitiative(),
    'calc-apply-budget': () => applyBudgetTarget(),
    'calc-budget-slider-input': ctx => onBudgetSliderChange(ctx.value),
    'calc-toggle-favorites': () => toggleFavoritesDropdown(),
    'calc-save-favorite': () => saveMonsterFavorite(),
    'calc-load-favorite': ctx => loadMonsterFavorite(parseInt(ctx.value)),
    'calc-delete-favorite': ctx => {
        ctx.event.stopPropagation();
        deleteMonsterFavorite(parseInt(ctx.value));
    },

    // Roll actions
    'roll-attack': () => rollAttack(),
    'roll-attack-crit': () => rollAttack(true),
    'roll-saving-throw': ctx => rollSavingThrow(ctx.value),
    'roll-group-perception': () => rollGroupPerception(),
    'roll-attr-check': ctx => {
        const modifier = parseInt(ctx.target.dataset.value) || 0;
        const attr = ctx.target.dataset.attr;
        rollAttrCheck(modifier, attr);
    },
    'roll-char-save': ctx => {
        const modifier = parseInt(ctx.target.dataset.value) || 0;
        const attr = ctx.target.dataset.attr;
        rollCharSave(modifier, attr);
    },
    'roll-skill-check': ctx => {
        const modifier = parseInt(ctx.target.dataset.value) || 0;
        const skill = ctx.target.dataset.skill;
        rollSkillCheck(modifier, skill);
    },
    'roll-char-initiative': ctx => {
        const bonus = parseInt(ctx.target.dataset.value) || 0;
        const name = ctx.target.dataset.name;
        rollCharInitiative(bonus, name);
    },
    'roll-skill': ctx => {
        const mod = parseInt(ctx.target.dataset.mod) || 0;
        const skillName = ctx.target.dataset.name || '';
        rollSkillCheck(ctx.value, mod, skillName);
    },
    'update-attr-mod': ctx => updateAttrMod(ctx.value, ctx.target.id),
    'update-enc-attr-mod': ctx => updateEncAttrMod(ctx.value, ctx.target.id)
};

// Register all combat actions
if (typeof EventDelegation !== 'undefined') {
    Object.entries(CombatActions).forEach(([name, handler]) => {
        EventDelegation.registerAction(name, handler);
    });
}
