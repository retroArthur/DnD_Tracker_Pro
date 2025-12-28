// ============================================================
// DICE ACTIONS - Dice Rolling, Favorites
// ============================================================

const DiceActions = {
    // Basic dice actions
    'roll-dice': (ctx) => rollDiceAnimated(ctx.value),
    'roll-advantage': () => rollAdvantage(),
    'roll-disadvantage': () => rollDisadvantage(),
    'roll-crit-damage': () => rollCritDamage(),

    // Dice formula actions
    'set-dice-formula': (ctx) => {
        const input = $('dice-notation');
        if (input) { input.value = ctx.value; rollCustomDice(); }
    },
    'set-dice-history': (ctx) => {
        const notation = $('dice-notation');
        const multi = $('dice-multi');
        if (notation) notation.value = ctx.value;
        if (multi) multi.value = 1;
    },

    // Favorite dice actions
    'roll-favorite': (ctx) => rollFavoriteDice(ctx.id),
    'delete-favorite': (ctx) => deleteDiceFavorite(ctx.id),
    'delete-favorite-stop': (ctx) => { ctx.event.stopPropagation(); deleteDiceFavorite(ctx.id); }
};

// Register all dice actions
if (typeof EventDelegation !== 'undefined') {
    Object.entries(DiceActions).forEach(([name, handler]) => {
        EventDelegation.registerAction(name, handler);
    });
}
