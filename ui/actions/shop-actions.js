// [SECTION:SHOP_ACTIONS]
// ============================================================
// SHOP ACTIONS - @shops @cart @items
// ============================================================

const ShopActions = {
    // Shop actions
    'toggle-shop': (ctx) => toggleShop(ctx.id),
    'edit-shop': (ctx) => editShop(ctx.id),
    'delete-shop': (ctx) => deleteShop(ctx.id),
    'export-shop-handout': (ctx) => showShopHandoutModal(ctx.id),
    'generate-shop-handout': (ctx) => generateShopHandout(ctx.id),
    'show-shop-item-modal': (ctx) => showShopItemModal(ctx.id),
    'toggle-shop-item': (ctx) => toggleShopItem(ctx.id, parseInt(ctx.value)),
    'edit-shop-item': (ctx) => editShopItem(ctx.id, parseInt(ctx.value)),
    'delete-shop-item': (ctx) => deleteShopItem(ctx.id, parseInt(ctx.value)),

    // Filter & Sort actions
    'filter-shop-category': (ctx) => filterShopCategory(ctx.id, ctx.value),
    'set-shop-sort': (ctx) => setShopSort(ctx.value),

    // Cart actions
    'add-to-cart-stop': (ctx) => { ctx.event.stopPropagation(); addToCart(ctx.id, parseInt(ctx.value)); },
    'add-to-cart-qty-stop': (ctx) => {
        ctx.event.stopPropagation();
        const idx = parseInt(ctx.value);
        const qtyInput = $(`si-qty-${ctx.id}-${idx}`);
        const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
        addToCart(ctx.id, idx, qty);
    },
    'cart-qty-decrease': (ctx) => {
        const currentQty = parseInt(ctx.target.dataset.value) || 1;
        updateCartQty(ctx.id, currentQty - 1);
    },
    'cart-qty-increase': (ctx) => {
        const currentQty = parseInt(ctx.target.dataset.value) || 1;
        updateCartQty(ctx.id, currentQty + 1);
    },
    'cart-remove': (ctx) => removeFromCart(ctx.id),
    'back-to-cart': () => { hideModal('checkout-modal'); showModal('cart-modal'); },

    // Migrated inline handlers
    'render-shops': () => renderShops(),
    'toggle-shop-item-unlimited': () => toggleShopItemUnlimited(),
    'update-shop-item-fields': () => updateShopItemFields()
};

// Register all shop actions
if (typeof EventDelegation !== 'undefined') {
    Object.entries(ShopActions).forEach(([name, handler]) => {
        EventDelegation.registerAction(name, handler);
    });
}
