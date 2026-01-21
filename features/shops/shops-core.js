// [SECTION:SHOPS_CORE]
// Extrahiert aus shops.js
// Shop-System für Händler und Inventar
// Zeilen: 920
// ============================================================
// CONSTANTS
// ============================================================
const SHOP_TYPES = Object.freeze({
    schmied: { icon: '🔨', name: 'Schmied' },
    wirtshaus: { icon: '🍺', name: 'Wirtshaus' },
    herberge: { icon: '🛏️', name: 'Herberge' },
    taverne: { icon: '🍻', name: 'Taverne' },
    alchemist: { icon: '⚗️', name: 'Alchemist' },
    apotheke: { icon: '💊', name: 'Apotheke' },
    bogenmacher: { icon: '🏹', name: 'Bogenmacher' },
    schneiderei: { icon: '🧵', name: 'Schneiderei' },
    juwelier: { icon: '💎', name: 'Juwelier' },
    buchhandlung: { icon: '📚', name: 'Buchhandlung' },
    skriptorium: { icon: '✒️', name: 'Skriptorium' },
    magisch: { icon: '🔮', name: 'Magischer Laden' },
    tempel: { icon: '⛪', name: 'Tempelbedarf' },
    stall: { icon: '🐴', name: 'Stall' },
    wagnerei: { icon: '🛒', name: 'Wagnerei' },
    werft: { icon: '⚓', name: 'Schiffswerft' },
    kuriositaeten: { icon: '🎭', name: 'Kuriositätenkabinett' },
    schwarzmarkt: { icon: '🕶️', name: 'Schwarzmarkt' },
    hehler: { icon: '🗝️', name: 'Hehler' },
    zelt: { icon: '⛺', name: 'Zelt' },
    bude: { icon: '🏚️', name: 'Bude' },
    stand: { icon: '🏕️', name: 'Stand' },
    laden: { icon: '🏬', name: 'Laden' },
    wanderer: { icon: '🚶', name: 'Wanderer' },
    kampagne: { icon: '📜', name: 'Kampagne' },
    'sc-loot': { icon: '🎒', name: 'SC Loot' },
    'kampagne-loot': { icon: '🏆', name: 'Kampagne Loot' },
    'dungeon-loot': { icon: '🏛️', name: 'Dungeon Loot' },
    fundus: { icon: '📦', name: 'Fundus' },
    unbekannt: { icon: '❓', name: 'Unbekannt' }
});
const SHOP_ITEM_CATEGORIES = Object.freeze({
    weapon: { icon: '⚔️', name: 'Waffe', color: 'var(--red)' },
    armor: { icon: '🛡️', name: 'Rüstung', color: 'var(--blue)' },
    gear: { icon: '⚙️', name: 'Ausrüstung', color: '#3498db' },
    item: { icon: '🧪', name: 'Item', color: 'var(--green)' },
    potion: { icon: '🧴', name: 'Trank', color: 'var(--purple)' },
    food: { icon: '🍖', name: 'Essen', color: '#e67e22' },
    drink: { icon: '🍺', name: 'Trinken', color: '#f39c12' },
    lodging: { icon: '🛏️', name: 'Unterkunft', color: '#9b59b6' },
    transport: { icon: '🐴', name: 'Transport', color: '#1abc9c' },
    clothing: { icon: '👕', name: 'Kleidung', color: '#e91e63' },
    accessory: { icon: '🎒', name: 'Zubehör', color: '#27ae60' },
    craft: { icon: '🔨', name: 'Handwerk', color: '#d35400' },
    prop: { icon: '🎪', name: 'Requisite', color: '#8e44ad' },
    magic: { icon: '✨', name: 'Magie', color: '#9c27b0' },
    enchant: { icon: '🔮', name: 'Verzauberung', color: '#673ab7' },
    buff: { icon: '💪', name: 'Verstärkung', color: '#ff5722' },
    info: { icon: '📜', name: 'Information', color: '#795548' },
    trinket: { icon: '🎁', name: 'Kleinigkeit', color: '#607d8b' },
    service: { icon: '🔧', name: 'Dienstleistung', color: 'var(--cyan)' },
    misc: { icon: '📦', name: 'Sonstiges', color: 'var(--text-dim)' }
});
// ============================================================
// STATE
// ============================================================
const expandedShops = new Set();
const expandedShopItems = new Set();
let shopCart = [];
const activeShopFilters = {}; // { shopId: categoryFilter }
let shopSortMode = 'name'; // 'name', 'price-asc', 'price-desc'
// ============================================================
// CURRENCY HELPERS
// ============================================================
function parseCurrency(costStr) {
    if (!costStr)
        return 0;
    const str = costStr.toLowerCase().trim();
    let totalCopper = 0;
    const patterns = [
        { regex: /(\d+(?:[.,]\d+)?)\s*(?:pp|platin)/gi, multiplier: 1000 },
        { regex: /(\d+(?:[.,]\d+)?)\s*(?:gp|gm|gold)/gi, multiplier: 100 },
        { regex: /(\d+(?:[.,]\d+)?)\s*(?:ep|em|elektrum)/gi, multiplier: 50 },
        { regex: /(\d+(?:[.,]\d+)?)\s*(?:sp|sm|silber)/gi, multiplier: 10 },
        { regex: /(\d+(?:[.,]\d+)?)\s*(?:cp|km|kupfer)/gi, multiplier: 1 }
    ];
    for (const p of patterns) {
        let match;
        while ((match = p.regex.exec(str)) !== null) {
            totalCopper += parseFloat(match[1].replace(',', '.')) * p.multiplier;
        }
    }
    if (totalCopper === 0) {
        const numMatch = str.match(/^(\d+(?:[.,]\d+)?)/);
        if (numMatch) {
            totalCopper = parseFloat(numMatch[1].replace(',', '.')) * 100;
        }
    }
    return Math.round(totalCopper);
}
function formatCurrency(copperAmount, format = 'optimal') {
    if (copperAmount === 0)
        return '0 KM';
    if (format === 'optimal') {
        const parts = [];
        let remaining = copperAmount;
        if (remaining >= 1000) {
            const pp = Math.floor(remaining / 1000);
            parts.push(`${pp} PP`);
            remaining %= 1000;
        }
        if (remaining >= 100) {
            const gp = Math.floor(remaining / 100);
            parts.push(`${gp} GM`);
            remaining %= 100;
        }
        if (remaining >= 10) {
            const sp = Math.floor(remaining / 10);
            parts.push(`${sp} SM`);
            remaining %= 10;
        }
        if (remaining > 0) {
            parts.push(`${remaining} KM`);
        }
        return parts.join(' ') || '0 KM';
    }
    else if (format === 'gold') {
        const gp = copperAmount / 100;
        return `${gp.toFixed(gp % 1 === 0 ? 0 : 2)} GM`;
    }
    return `${copperAmount} KM`;
}
// ============================================================
// CART FUNCTIONS
// ============================================================
function addToCart(shopId, itemIdx, qty = 1) {
    const D = window.D;
    const shop = (D.shops || []).find((s) => s.id === shopId);
    if (!shop || !shop.items || !shop.items[itemIdx])
        return;
    const item = shop.items[itemIdx];
    if (item.available === false) {
        showToast('⚠️ Artikel nicht verfügbar', 'warning');
        return;
    }
    const existingIdx = shopCart.findIndex(c => c.shopId === shopId && c.itemIdx === itemIdx);
    if (existingIdx > -1) {
        const maxQty = item.unlimited ? 9999 : (item.quantity || 999);
        shopCart[existingIdx].qty = Math.min(shopCart[existingIdx].qty + qty, maxQty);
    }
    else {
        shopCart.push({
            shopId,
            itemIdx,
            shopName: shop.name,
            itemName: item.name,
            category: item.category,
            cost: item.cost,
            costCopper: parseCurrency(item.cost),
            qty: Math.min(qty, item.unlimited ? 9999 : (item.quantity || 999)),
            maxQty: item.unlimited ? 9999 : (item.quantity || 999)
        });
    }
    updateCartBadge();
    showToast(`🛒 ${item.name} hinzugefügt`);
}
function removeFromCart(idx) {
    shopCart.splice(idx, 1);
    updateCartBadge();
    renderCartModal();
}
function updateCartQty(idx, newQty) {
    if (shopCart[idx]) {
        if (newQty <= 0) {
            removeFromCart(idx);
        }
        else {
            shopCart[idx].qty = Math.min(newQty, shopCart[idx].maxQty);
            renderCartModal();
        }
    }
}
function updateCartQtyFromInput(input) {
    const idx = parseInt(input.dataset.id || '0');
    const newQty = parseInt(input.value) || 1;
    updateCartQty(idx, newQty);
}
function clearCart() {
    shopCart = [];
    updateCartBadge();
    renderCartModal();
    showToast('🛒 Warenkorb geleert');
}
function updateCartBadge() {
    const badge = $('cart-badge');
    const totalItems = shopCart.reduce((sum, c) => sum + c.qty, 0);
    if (badge) {
        badge.textContent = String(totalItems);
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}
function getCartTotal() {
    return shopCart.reduce((sum, c) => sum + (c.costCopper * c.qty), 0);
}
function showCartModal() {
    renderCartModal();
    showModal('cart-modal');
}
function renderCartModal() {
    const container = $('cart-items');
    const totalEl = $('cart-total');
    const totalGoldEl = $('cart-total-gold');
    if (!container)
        return;
    if (shopCart.length === 0) {
        container.innerHTML = '<div class="cart-empty">🛒 Warenkorb ist leer</div>';
        if (totalEl)
            totalEl.textContent = '0 KM';
        if (totalGoldEl)
            totalGoldEl.textContent = '(0 GM)';
        return;
    }
    const byShop = {};
    shopCart.forEach((item, idx) => {
        if (!byShop[item.shopName])
            byShop[item.shopName] = [];
        byShop[item.shopName].push({ ...item, cartIdx: idx });
    });
    container.innerHTML = Object.entries(byShop).map(([shopName, items]) => `
        <div class="cart-shop-group">
            <div class="cart-shop-name">🏪 ${esc(shopName)}</div>
            ${items.map(item => {
        const cat = SHOP_ITEM_CATEGORIES[item.category] || SHOP_ITEM_CATEGORIES.misc;
        const lineTotal = item.costCopper * item.qty;
        return `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <span class="cart-item-icon">${cat.icon}</span>
                            <span class="cart-item-name">${esc(item.itemName)}</span>
                        </div>
                        <div class="cart-item-controls">
                            <button class="btn btn-sm" data-action="cart-qty-decrease" data-id="${item.cartIdx}" data-value="${item.qty}">−</button>
                            <input type="number" class="cart-qty-input" value="${item.qty}" min="1" max="${item.maxQty}"
                                   data-onChange="updateCartQtyFromInput" data-id="${item.cartIdx}">
                            <button class="btn btn-sm" data-action="cart-qty-increase" data-id="${item.cartIdx}" data-value="${item.qty}">+</button>
                        </div>
                        <div class="cart-item-price">
                            <span class="cart-item-unit">${esc(item.cost)} × ${item.qty}</span>
                            <span class="cart-item-total">${formatCurrency(lineTotal)}</span>
                        </div>
                        <button class="btn btn-sm btn-danger" data-action="cart-remove" data-id="${item.cartIdx}">✕</button>
                    </div>
                `;
    }).join('')}
        </div>
    `).join('');
    const total = getCartTotal();
    if (totalEl)
        totalEl.textContent = formatCurrency(total);
    if (totalGoldEl)
        totalGoldEl.textContent = `(${formatCurrency(total, 'gold')})`;
}
function checkoutCart() {
    if (shopCart.length === 0) {
        showToast('⚠️ Warenkorb ist leer', 'warning');
        return;
    }
    const total = getCartTotal();
    const itemCount = shopCart.reduce((sum, c) => sum + c.qty, 0);
    const receipt = `═══════════════════════════════════════
🧾 QUITTUNG
═══════════════════════════════════════
${shopCart.map(c => {
        const lineTotal = c.costCopper * c.qty;
        return `${c.qty}× ${c.itemName}
   ${c.cost} × ${c.qty} = ${formatCurrency(lineTotal)}`;
    }).join('\n───────────────────────────────────────\n')}
═══════════════════════════════════════
GESAMT: ${formatCurrency(total)}
        ${formatCurrency(total, 'gold')}
═══════════════════════════════════════
${itemCount} Artikel | ${new Date().toLocaleDateString('de-DE')}`;
    const receiptEl = $('checkout-receipt');
    const totalCheckoutEl = $('checkout-total');
    const breakdownEl = $('checkout-total-breakdown');
    if (receiptEl)
        receiptEl.textContent = receipt;
    if (totalCheckoutEl)
        totalCheckoutEl.textContent = formatCurrency(total);
    if (breakdownEl) {
        breakdownEl.innerHTML = `
            <div class="checkout-breakdown">
                ${total >= 1000 ? `<span>💎 ${Math.floor(total / 1000)} PP</span>` : ''}
                ${Math.floor((total % 1000) / 100) > 0 ? `<span>🪙 ${Math.floor((total % 1000) / 100)} GM</span>` : ''}
                ${Math.floor((total % 100) / 10) > 0 ? `<span>🥈 ${Math.floor((total % 100) / 10)} SM</span>` : ''}
                ${total % 10 > 0 ? `<span>🥉 ${total % 10} KM</span>` : ''}
            </div>
        `;
    }
    hideModal('cart-modal');
    showModal('checkout-modal');
}
function confirmCheckout() {
    const D = window.D;
    shopCart.forEach(c => {
        const shop = (D.shops || []).find((s) => s.id === c.shopId);
        if (shop && shop.items && shop.items[c.itemIdx]) {
            const item = shop.items[c.itemIdx];
            if (!item.unlimited && item.quantity !== undefined && item.quantity !== null) {
                item.quantity = Math.max(0, item.quantity - c.qty);
                if (item.quantity === 0) {
                    item.available = false;
                }
            }
        }
    });
    clearCart();
    hideModal('checkout-modal');
    renderShops();
    save();
    showToast('✅ Kauf abgeschlossen!');
}
function copyReceipt() {
    const receiptEl = $('checkout-receipt');
    if (!receiptEl)
        return;
    const receipt = receiptEl.textContent || '';
    navigator.clipboard.writeText(receipt).then(() => {
        showToast('📋 Quittung kopiert');
    });
}
// ============================================================
// SHOP RENDER
// ============================================================
function renderShops() {
    const D = window.D;
    const renderEmptyState = window.renderEmptyState;
    const updateCounters = window.updateCounters;
    const populateFilterDropdown = window.populateFilterDropdown;
    const renderEntityLink = window.renderEntityLink;
    const container = $('shop-list');
    if (!container)
        return;
    try {
        if (!D.shops)
            D.shops = [];
        updateCounters({ 'shops-io-count': D.shops.length });
        populateFilterDropdown('shop-location-filter', D.locations || [], { allLabel: 'Alle Orte' });
        const searchInput = $('shop-search');
        const typeFilterInput = $('shop-type-filter');
        const locationFilterInput = $('shop-location-filter');
        const search = (searchInput?.value || '').toLowerCase();
        const typeFilter = typeFilterInput?.value || '';
        const locationFilter = locationFilterInput?.value ? parseInt(locationFilterInput.value) : null;
        let shops = [...D.shops];
        if (search) {
            shops = shops.filter((s) => (s.name || '').toLowerCase().includes(search) ||
                (s.description || '').toLowerCase().includes(search) ||
                (s.items || []).some((i) => (i.name || '').toLowerCase().includes(search)));
        }
        if (typeFilter) {
            shops = shops.filter((s) => s.type === typeFilter);
        }
        if (locationFilter) {
            shops = shops.filter((s) => s.locationId === locationFilter);
        }
        shops.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        if (!shops.length) {
            container.innerHTML = renderEmptyState({
                icon: '🏪',
                titleEmpty: 'Keine Shops',
                descEmpty: 'Erstelle Shops für Händler und ihre Waren.',
                buttonText: '+ Neuer Shop',
                buttonAction: 'call',
                buttonValue: 'showShopModal',
                isFiltered: D.shops.length > 0
            });
            return;
        }
        container.innerHTML = shops.map((shop) => {
            try {
                const type = SHOP_TYPES[shop.type] || SHOP_TYPES.unbekannt;
                const npc = EntityLookup.npc(shop.npcId);
                const location = EntityLookup.location(shop.locationId);
                const isExpanded = expandedShops.has(shop.id);
                const items = shop.items || [];
                const availableItems = items.filter((i) => i.available !== false);

                // Dynamically count items by category
                const categoryCounts = {};
                items.forEach((item) => {
                    const cat = item.category || 'misc';
                    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                });
                return `
                    <div class="shop-card ${isExpanded ? 'expanded' : 'collapsed'}" id="shop-card-${shop.id}" data-shop-id="${shop.id}">
                        <div class="shop-header" data-action="toggle-shop" data-id="${shop.id}">
                            <div class="shop-header-main">
                                <span class="shop-toggle">${isExpanded ? '▼' : '▶'}</span>
                                <span class="shop-icon">${type.icon}</span>
                                <div class="shop-title-block">
                                    <span class="shop-name">${esc(shop.name || 'Unbenannt')}</span>
                                    <span class="shop-type-label">${type.name}</span>
                                </div>
                            </div>
                            <div class="shop-header-meta">
                                ${npc ? renderEntityLink('npcs', npc.id, npc.name, { icon: '🎭', className: 'shop-meta-tag npc' }) : ''}
                                ${location ? renderEntityLink('locations', location.id, location.name, { icon: '📍', className: 'shop-meta-tag location' }) : ''}
                                <span class="shop-item-count">${availableItems.length}/${items.length} Artikel</span>
                            </div>
                            <div class="shop-header-actions" data-stop-propagation="true">
                                <button class="btn btn-sm" data-action="export-shop-handout" data-id="${shop.id}" title="Handout exportieren">📋</button>
                                <button class="btn btn-sm" data-action="edit-shop" data-id="${shop.id}" title="Bearbeiten">✏️</button>
                                <button class="btn btn-sm btn-danger" data-action="delete-shop" data-id="${shop.id}" title="Löschen">🗑️</button>
                            </div>
                        </div>

                        <div class="shop-body" style="${isExpanded ? '' : 'display: none;'}">
                            ${shop.description ? `<div class="shop-description">${esc(shop.description)}</div>` : ''}
                            ${shop.special ? `<div class="shop-special">✨ ${esc(shop.special)}</div>` : ''}
                            ${shop.note ? `<div class="shop-note">📝 ${esc(shop.note)}</div>` : ''}

                            <div class="shop-category-tabs">
                                <span class="shop-cat-badge all ${!activeShopFilters[shop.id] ? 'active' : ''}"
                                      data-action="filter-shop-category" data-id="${shop.id}" data-value=""
                                      title="Alle Kategorien anzeigen">
                                    📦 Alle (${items.length})
                                </span>
                                ${Object.entries(categoryCounts).map(([catKey, count]) => {
                                    const catInfo = SHOP_ITEM_CATEGORIES[catKey] || SHOP_ITEM_CATEGORIES.misc;
                                    const isActive = activeShopFilters[shop.id] === catKey;
                                    return `<span class="shop-cat-badge ${catKey} ${isActive ? 'active' : ''}"
                                                  data-action="filter-shop-category" data-id="${shop.id}" data-value="${catKey}"
                                                  title="${catInfo.name} anzeigen">
                                        ${catInfo.icon} ${count}
                                    </span>`;
                                }).join('')}
                            </div>

                            <div class="shop-sort-controls">
                                <label style="color: var(--text-dim); font-size: 0.9em; margin-right: 8px;">Sortierung:</label>
                                <button class="shop-sort-btn ${shopSortMode === 'name' ? 'active' : ''}"
                                        data-action="set-shop-sort" data-value="name" title="Nach Name sortieren">
                                    📝 Name
                                </button>
                                <button class="shop-sort-btn ${shopSortMode === 'price-asc' ? 'active' : ''}"
                                        data-action="set-shop-sort" data-value="price-asc" title="Preis aufsteigend">
                                    💰↑ Preis ↑
                                </button>
                                <button class="shop-sort-btn ${shopSortMode === 'price-desc' ? 'active' : ''}"
                                        data-action="set-shop-sort" data-value="price-desc" title="Preis absteigend">
                                    💰↓ Preis ↓
                                </button>
                            </div>

                            <div class="shop-items-container">
                                ${items.length ? renderShopItems(shop.id, items) : '<div class="shop-items-empty">Keine Artikel im Sortiment</div>'}
                            </div>

                            <div class="shop-footer">
                                <button class="btn btn-sm btn-success" data-action="show-shop-item-modal" data-id="${shop.id}">+ Artikel hinzufügen</button>
                            </div>
                        </div>
                    </div>
                `;
            }
            catch (shopErr) {
                console.error('Fehler beim Rendern eines Shops:', shopErr, shop);
                return `<div class="shop-card" style="color: var(--red);">Fehler beim Laden des Shops</div>`;
            }
        }).join('');
    }
    catch (err) {
        console.error('renderShops Fehler:', err);
        container.innerHTML = renderEmptyState({
            icon: '⚠️',
            titleEmpty: 'Fehler beim Laden',
            descEmpty: 'Die Shop-Daten konnten nicht geladen werden.',
            gridSpan: 'auto'
        });
    }
}
function renderShopItems(shopId, items) {
    if (!items || !Array.isArray(items))
        return '<div class="shop-items-empty">Keine Artikel</div>';
    try {
        // Apply category filter
        const categoryFilter = activeShopFilters[shopId];
        let filteredItems = categoryFilter
            ? items.map((item, idx) => ({ item, idx })).filter(({ item }) => item.category === categoryFilter)
            : items.map((item, idx) => ({ item, idx }));

        // Apply sorting
        filteredItems = [...filteredItems].sort((a, b) => {
            if (shopSortMode === 'name') {
                return (a.item.name || '').localeCompare(b.item.name || '');
            } else if (shopSortMode === 'price-asc' || shopSortMode === 'price-desc') {
                const priceA = parseCurrency(a.item.cost || '0');
                const priceB = parseCurrency(b.item.cost || '0');
                return shopSortMode === 'price-asc' ? priceA - priceB : priceB - priceA;
            }
            return 0;
        });

        if (filteredItems.length === 0) {
            return '<div class="shop-items-empty">Keine Artikel in dieser Kategorie</div>';
        }

        return `<div class="si-list">
            ${filteredItems.map(({ item, idx }) => {
            try {
                const cat = SHOP_ITEM_CATEGORIES[item.category] || SHOP_ITEM_CATEGORIES.misc;
                const isAvailable = item.available !== false;
                const isExpanded = expandedShopItems.has(`${shopId}-${idx}`);
                const itemName = item.name || 'Unbenannt';
                const itemCost = item.cost || '—';
                const itemQty = item.unlimited ? '∞' : (item.quantity || 1);
                let detailTags = '';
                if (item.category === 'weapon') {
                    detailTags = [
                        item.type ? `<span class="si-tag"><span class="si-tag-l">Typ:</span> <span class="si-tag-v">${esc(item.type)}</span></span>` : '',
                        item.damage ? `<span class="si-tag"><span class="si-tag-l">Schaden:</span> <span class="si-tag-v">${esc(item.damage)}</span></span>` : '',
                        item.properties ? `<span class="si-tag"><span class="si-tag-l">Eigensch.:</span> <span class="si-tag-v">${esc(item.properties)}</span></span>` : '',
                        item.mastery ? `<span class="si-tag"><span class="si-tag-l">Meisterung:</span> <span class="si-tag-v">${esc(item.mastery)}</span></span>` : '',
                        item.weight ? `<span class="si-tag"><span class="si-tag-l">Gewicht:</span> <span class="si-tag-v">${esc(item.weight)}</span></span>` : ''
                    ].filter(Boolean).join('');
                }
                else if (item.category === 'armor') {
                    detailTags = [
                        item.type ? `<span class="si-tag"><span class="si-tag-l">Typ:</span> <span class="si-tag-v">${esc(item.type)}</span></span>` : '',
                        item.ac ? `<span class="si-tag"><span class="si-tag-l">RK:</span> <span class="si-tag-v">${esc(item.ac)}</span></span>` : '',
                        item.strength ? `<span class="si-tag"><span class="si-tag-l">STR:</span> <span class="si-tag-v">${esc(item.strength)}</span></span>` : '',
                        item.stealth === 'disadvantage' ? `<span class="si-tag"><span class="si-tag-l">Heiml.:</span> <span class="si-tag-v" style="color:var(--red);">Nachteil</span></span>` : '',
                        item.weight ? `<span class="si-tag"><span class="si-tag-l">Gewicht:</span> <span class="si-tag-v">${esc(item.weight)}</span></span>` : ''
                    ].filter(Boolean).join('');
                }
                else {
                    detailTags = [
                        item.type ? `<span class="si-tag"><span class="si-tag-l">Typ:</span> <span class="si-tag-v">${esc(item.type)}</span></span>` : '',
                        item.effect ? `<span class="si-tag"><span class="si-tag-l">Wirkung:</span> <span class="si-tag-v">${esc(item.effect)}</span></span>` : '',
                        item.description ? `<span class="si-tag"><span class="si-tag-l">Beschr.:</span> <span class="si-tag-v">${esc(item.description)}</span></span>` : '',
                        item.weight ? `<span class="si-tag"><span class="si-tag-l">Gewicht:</span> <span class="si-tag-v">${esc(item.weight)}</span></span>` : ''
                    ].filter(Boolean).join('');
                }
                const specialNote = item.special ? `<span class="si-special">✨ ${esc(item.special)}</span>` : '';
                const noteText = item.note ? `<span class="si-note">📝 ${esc(item.note)}</span>` : '';
                return `<div class="si-item ${item.category || 'misc'} ${isAvailable ? '' : 'si-unavailable'} ${isExpanded ? 'expanded' : ''}" data-shop="${shopId}" data-idx="${idx}">
                        <div class="si-main" data-action="toggle-shop-item" data-id="${shopId}" data-value="${idx}">
                            <div class="si-qty">×${itemQty}</div>
                            <div class="si-cat">${cat.icon}</div>
                            <div class="si-name">${esc(itemName)}</div>
                            <div class="si-cost">
                                <span>${esc(itemCost)}</span>
                                ${isAvailable ? `<button class="si-cart-btn" data-action="add-to-cart-stop" data-id="${shopId}" data-value="${idx}" title="In den Warenkorb">🛒</button>` : ''}
                            </div>
                            <div class="si-btns" data-stop-propagation="true">
                                <button class="btn btn-sm" data-action="edit-shop-item" data-id="${shopId}" data-value="${idx}" title="Bearbeiten">✏️</button>
                                <button class="btn btn-sm btn-danger" data-action="delete-shop-item" data-id="${shopId}" data-value="${idx}" title="Löschen">✕</button>
                            </div>
                        </div>
                        <div class="si-details">
                            <div class="si-detail-row">${detailTags}</div>
                            ${specialNote || noteText ? `<div class="si-detail-row">${specialNote}${noteText}</div>` : ''}
                            <div class="si-detail-row si-detail-actions">
                                <label class="si-avail-toggle">
                                    <input type="checkbox" ${isAvailable ? 'checked' : ''} data-on-change="toggleShopItemAvailability" data-shop-id="${shopId}" data-item-idx="${idx}">
                                    <span>${isAvailable ? 'Verfügbar' : 'Nicht verfügbar'}</span>
                                </label>
                                ${isAvailable ? `
                                    <div class="si-add-cart-section">
                                        <input type="number" class="si-qty-input" id="si-qty-${shopId}-${idx}" value="1" min="1" max="${itemQty}" data-stop-propagation="true">
                                        <button class="btn btn-sm btn-success" data-action="add-to-cart-qty-stop" data-id="${shopId}" data-value="${idx}">🛒 In Warenkorb</button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>`;
            }
            catch (itemErr) {
                console.error('Fehler beim Rendern eines Shop-Items:', itemErr, item);
                return '';
            }
        }).join('')}
        </div>`;
    }
    catch (err) {
        console.error('renderShopItems Fehler:', err);
        return '<div class="shop-items-empty">Fehler beim Laden der Artikel</div>';
    }
}
function toggleShopItem(shopId, idx) {
    const key = `${shopId}-${idx}`;
    if (expandedShopItems.has(key)) {
        expandedShopItems.delete(key);
    }
    else {
        expandedShopItems.add(key);
    }
    const item = document.querySelector(`.si-item[data-shop="${shopId}"][data-idx="${idx}"]`);
    if (item) {
        item.classList.toggle('expanded', expandedShopItems.has(key));
    }
}
function toggleShop(id) {
    if (expandedShops.has(id)) {
        expandedShops.delete(id);
    }
    else {
        expandedShops.add(id);
    }
    const isExpanded = expandedShops.has(id);
    const shop = document.querySelector(`.shop-card[data-shop-id="${id}"]`);
    if (shop) {
        shop.classList.toggle('expanded', isExpanded);
        shop.classList.toggle('collapsed', !isExpanded);
        const body = shop.querySelector('.shop-body');
        if (body) {
            body.style.display = isExpanded ? '' : 'none';
        }
        const toggle = shop.querySelector('.shop-toggle');
        if (toggle) {
            toggle.textContent = isExpanded ? '▼' : '▶';
        }
    }
}
function expandAllShops() {
    const D = window.D;
    (D.shops || []).forEach((s) => expandedShops.add(s.id));
    renderShops();
    showToast('Alle Shops ausgeklappt');
}
function collapseAllShops() {
    expandedShops.clear();
    renderShops();
    showToast('Alle Shops eingeklappt');
}
// ============================================================
// SHOP CRUD
// ============================================================
function showShopModal(id = null) {
    const D = window.D;
    const nextId = window.nextId;
    clearShopForm();
    const npcSelect = $('shop-npc');
    const locSelect = $('shop-location');
    if (npcSelect) {
        npcSelect.innerHTML = '<option value="">-- Kein NPC --</option>' +
            (D.npcs || []).map((n) => `<option value="${n.id}">${esc(n.name)}</option>`).join('');
    }
    if (locSelect) {
        locSelect.innerHTML = '<option value="">-- Kein Ort --</option>' +
            (D.locations || []).map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
    }
    if (id) {
        const shop = (D.shops || []).find((s) => s.id === id);
        if (shop) {
            const editIdInput = $('edit-shop-id');
            const typeInput = $('shop-type');
            const nameInput = $('shop-name');
            const npcInput = $('shop-npc');
            const locationInput = $('shop-location');
            const descInput = $('shop-description');
            const specialInput = $('shop-special');
            const noteInput = $('shop-note');
            if (editIdInput)
                editIdInput.value = String(id);
            if (typeInput)
                typeInput.value = shop.type || 'laden';
            if (nameInput)
                nameInput.value = shop.name || '';
            if (npcInput)
                npcInput.value = shop.npcId || '';
            if (locationInput)
                locationInput.value = shop.locationId || '';
            if (descInput)
                descInput.value = shop.description || '';
            if (specialInput)
                specialInput.value = shop.special || '';
            if (noteInput)
                noteInput.value = shop.note || '';
        }
    }
    showModal('shop-modal');
}
function clearShopForm() {
    clearFormFields({
        textFields: [
            'edit-shop-id', 'shop-name', 'shop-npc', 'shop-location',
            'shop-description', 'shop-special', 'shop-note'
        ],
        selectFields: [{ id: 'shop-type', defaultValue: 'laden' }]
    });
}
function saveShop() {
    const D = window.D;
    const nextId = window.nextId;
    const nameInput = $('shop-name');
    const name = nameInput?.value.trim() || '';
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    if (!D.shops)
        D.shops = [];
    const editIdInput = $('edit-shop-id');
    const typeInput = $('shop-type');
    const npcInput = $('shop-npc');
    const locationInput = $('shop-location');
    const descInput = $('shop-description');
    const specialInput = $('shop-special');
    const noteInput = $('shop-note');
    const editId = editIdInput?.value || '';
    const shop = {
        type: typeInput?.value || 'laden',
        name: name,
        npcId: npcInput?.value ? parseInt(npcInput.value) : null,
        locationId: locationInput?.value ? parseInt(locationInput.value) : null,
        description: descInput?.value.trim() || '',
        special: specialInput?.value.trim() || '',
        note: noteInput?.value.trim() || ''
    };
    if (editId) {
        const idx = D.shops.findIndex((s) => s.id === parseInt(editId));
        if (idx > -1) {
            D.shops[idx] = { ...D.shops[idx], ...shop };
            showToast('Shop aktualisiert');
        }
    }
    else {
        shop.id = nextId('shops');
        shop.items = [];
        D.shops.push(shop);
        showToast('Shop erstellt');
    }
    hideModal('shop-modal');
    renderShops();
    save();
}
function editShop(id) {
    showShopModal(id);
}
function deleteShop(id) {
    const D = window.D;
    if (confirm('Shop und alle Artikel löschen?')) {
        pushUndo('Shop gelöscht');
        D.shops = (D.shops || []).filter((s) => s.id !== id);
        expandedShops.delete(id);
        renderShops();
        save();
        showToast('Shop gelöscht');
    }
}
// ============================================================
// SHOP ITEM CRUD
// ============================================================
function showShopItemModal(shopId, itemIdx = null) {
    const D = window.D;
    clearShopItemForm();
    const shopIdInput = $('edit-shop-item-shop-id');
    if (shopIdInput)
        shopIdInput.value = String(shopId);
    if (itemIdx !== null) {
        const shop = (D.shops || []).find((s) => s.id === shopId);
        if (shop && shop.items && shop.items[itemIdx]) {
            const item = shop.items[itemIdx];
            const editIdInput = $('edit-shop-item-id');
            const availInput = $('shop-item-available');
            const qtyInput = $('shop-item-quantity');
            const unlimitedInput = $('shop-item-unlimited');
            const catInput = $('shop-item-category');
            const nameInput = $('shop-item-name');
            const typeInput = $('shop-item-type');
            const damageInput = $('shop-item-damage');
            const propsInput = $('shop-item-properties');
            const masteryInput = $('shop-item-mastery');
            const acInput = $('shop-item-ac');
            const strInput = $('shop-item-strength');
            const stealthInput = $('shop-item-stealth');
            const descInput = $('shop-item-desc');
            const effectInput = $('shop-item-effect');
            const weightInput = $('shop-item-weight');
            const costInput = $('shop-item-cost');
            const specialInput = $('shop-item-special');
            const noteInput = $('shop-item-note');
            if (editIdInput)
                editIdInput.value = String(itemIdx);
            if (availInput)
                availInput.checked = item.available !== false;
            if (qtyInput)
                qtyInput.value = item.unlimited ? '' : (item.quantity || 1);
            if (unlimitedInput) {
                unlimitedInput.checked = item.unlimited || false;
                toggleShopItemUnlimited();
            }
            if (catInput)
                catInput.value = item.category || 'misc';
            if (nameInput)
                nameInput.value = item.name || '';
            if (typeInput)
                typeInput.value = item.type || '';
            if (damageInput)
                damageInput.value = item.damage || '';
            if (propsInput)
                propsInput.value = item.properties || '';
            if (masteryInput)
                masteryInput.value = item.mastery || '';
            if (acInput)
                acInput.value = item.ac || '';
            if (strInput)
                strInput.value = item.strength || '';
            if (stealthInput)
                stealthInput.value = item.stealth || '';
            if (descInput)
                descInput.value = item.description || '';
            if (effectInput)
                effectInput.value = item.effect || '';
            if (weightInput)
                weightInput.value = item.weight || '';
            if (costInput)
                costInput.value = item.cost || '';
            if (specialInput)
                specialInput.value = item.special || '';
            if (noteInput)
                noteInput.value = item.note || '';
        }
    }
    updateShopItemFields();
    showModal('shop-item-modal');
}
function clearShopItemForm() {
    clearFormFields({
        textFields: [
            'edit-shop-item-id', 'shop-item-name', 'shop-item-type',
            'shop-item-damage', 'shop-item-properties', 'shop-item-mastery',
            'shop-item-ac', 'shop-item-strength', 'shop-item-stealth',
            'shop-item-desc', 'shop-item-effect', 'shop-item-weight',
            'shop-item-cost', 'shop-item-special', 'shop-item-note'
        ],
        selectFields: [{ id: 'shop-item-category', defaultValue: 'weapon' }],
        defaults: {
            'shop-item-quantity': '1'
        },
        customHandlers: () => {
            // Set available checkbox to true
            const availInput = $('shop-item-available');
            if (availInput) availInput.checked = true;

            // Reset unlimited checkbox and update display
            const unlimitedInput = $('shop-item-unlimited');
            if (unlimitedInput) {
                unlimitedInput.checked = false;
                toggleShopItemUnlimited();
            }
        }
    });
}
function updateShopItemFields() {
    const catInput = $('shop-item-category');
    const category = catInput?.value || 'misc';
    document.querySelectorAll('.shop-item-fields').forEach(el => el.style.display = 'none');
    if (category === 'weapon') {
        const weaponFields = $('shop-item-weapon-fields');
        if (weaponFields)
            weaponFields.style.display = '';
    }
    else if (category === 'armor') {
        const armorFields = $('shop-item-armor-fields');
        if (armorFields)
            armorFields.style.display = '';
    }
    else {
        const generalFields = $('shop-item-general-fields');
        if (generalFields)
            generalFields.style.display = '';
    }
}
function toggleShopItemUnlimited() {
    const unlimitedCheckbox = $('shop-item-unlimited');
    const quantityInput = $('shop-item-quantity');
    if (unlimitedCheckbox && quantityInput) {
        if (unlimitedCheckbox.checked) {
            quantityInput.disabled = true;
            quantityInput.style.opacity = '0.5';
            quantityInput.value = '';
            quantityInput.placeholder = '∞';
        }
        else {
            quantityInput.disabled = false;
            quantityInput.style.opacity = '1';
            quantityInput.placeholder = '';
            if (!quantityInput.value)
                quantityInput.value = '1';
        }
    }
}
function saveShopItem() {
    const D = window.D;
    const nameInput = $('shop-item-name');
    const name = nameInput?.value.trim() || '';
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    const shopIdInput = $('edit-shop-item-shop-id');
    const shopId = parseInt(shopIdInput?.value || '0');
    const shop = (D.shops || []).find((s) => s.id === shopId);
    if (!shop) {
        showToast('Shop nicht gefunden', 'error');
        return;
    }
    if (!shop.items)
        shop.items = [];
    const catInput = $('shop-item-category');
    const unlimitedInput = $('shop-item-unlimited');
    const availInput = $('shop-item-available');
    const qtyInput = $('shop-item-quantity');
    const typeInput = $('shop-item-type');
    const weightInput = $('shop-item-weight');
    const costInput = $('shop-item-cost');
    const specialInput = $('shop-item-special');
    const noteInput = $('shop-item-note');
    const damageInput = $('shop-item-damage');
    const propsInput = $('shop-item-properties');
    const masteryInput = $('shop-item-mastery');
    const acInput = $('shop-item-ac');
    const strInput = $('shop-item-strength');
    const stealthInput = $('shop-item-stealth');
    const descInput = $('shop-item-desc');
    const effectInput = $('shop-item-effect');
    const category = catInput?.value || 'misc';
    const isUnlimited = unlimitedInput?.checked || false;
    const item = {
        available: availInput?.checked ?? true,
        unlimited: isUnlimited,
        quantity: isUnlimited ? null : (parseInt(qtyInput?.value || '1') || 1),
        category: category,
        name: name,
        type: typeInput?.value.trim() || '',
        weight: weightInput?.value.trim() || '',
        cost: costInput?.value.trim() || '',
        special: specialInput?.value.trim() || '',
        note: noteInput?.value.trim() || ''
    };
    if (category === 'weapon') {
        item.damage = damageInput?.value.trim() || '';
        item.properties = propsInput?.value.trim() || '';
        item.mastery = masteryInput?.value.trim() || '';
    }
    else if (category === 'armor') {
        item.ac = acInput?.value.trim() || '';
        item.strength = strInput?.value.trim() || '';
        item.stealth = stealthInput?.value || '';
    }
    else {
        item.description = descInput?.value.trim() || '';
        item.effect = effectInput?.value.trim() || '';
    }
    const editIdInput = $('edit-shop-item-id');
    const editIdx = editIdInput?.value || '';
    if (editIdx !== '') {
        shop.items[parseInt(editIdx)] = item;
        showToast('Artikel aktualisiert');
    }
    else {
        shop.items.push(item);
        showToast('Artikel hinzugefügt');
    }
    hideModal('shop-item-modal');
    expandedShops.add(shopId);
    renderShops();
    save();
}
function editShopItem(shopId, idx) {
    showShopItemModal(shopId, idx);
}
function deleteShopItem(shopId, idx) {
    const D = window.D;
    if (confirm('Artikel löschen?')) {
        pushUndo('Shop-Artikel gelöscht');
        const shop = (D.shops || []).find((s) => s.id === shopId);
        if (shop && shop.items) {
            shop.items.splice(idx, 1);
            renderShops();
            save();
            showToast('Artikel gelöscht');
        }
    }
}
function toggleShopItemAvailability(shopIdOrElement, idx) {
    const D = window.D;
    let shopId;
    let itemIdx;
    if (typeof shopIdOrElement === 'object' && shopIdOrElement.tagName) {
        shopId = parseInt(shopIdOrElement.dataset.shopId || '0', 10);
        itemIdx = parseInt(shopIdOrElement.dataset.itemIdx || '0', 10);
    }
    else {
        shopId = shopIdOrElement;
        itemIdx = idx ?? 0;
    }
    const shop = (D.shops || []).find((s) => s.id === shopId);
    if (shop && shop.items && shop.items[itemIdx]) {
        shop.items[itemIdx].available = !shop.items[itemIdx].available;
        renderShops();
        save();
    }
}
// ============================================================
// FILTER & SORT
// ============================================================
function filterShopCategory(shopId, category) {
    shopId = typeof shopId === 'string' ? parseInt(shopId) : shopId;
    if (!category || category === '') {
        delete activeShopFilters[shopId];
    } else {
        activeShopFilters[shopId] = category;
    }
    renderShops();
}
function setShopSort(mode) {
    shopSortMode = mode || 'name';
    renderShops();
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.SHOP_TYPES = SHOP_TYPES;
window.SHOP_ITEM_CATEGORIES = SHOP_ITEM_CATEGORIES;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQty = updateCartQty;
window.updateCartQtyFromInput = updateCartQtyFromInput;
window.clearCart = clearCart;
window.showCartModal = showCartModal;
window.checkoutCart = checkoutCart;
window.confirmCheckout = confirmCheckout;
window.copyReceipt = copyReceipt;
window.renderShops = renderShops;
window.toggleShopItem = toggleShopItem;
window.toggleShop = toggleShop;
window.expandAllShops = expandAllShops;
window.collapseAllShops = collapseAllShops;
window.showShopModal = showShopModal;
window.saveShop = saveShop;
window.editShop = editShop;
window.deleteShop = deleteShop;
window.showShopItemModal = showShopItemModal;
window.updateShopItemFields = updateShopItemFields;
window.toggleShopItemUnlimited = toggleShopItemUnlimited;
window.saveShopItem = saveShopItem;
window.editShopItem = editShopItem;
window.deleteShopItem = deleteShopItem;
window.toggleShopItemAvailability = toggleShopItemAvailability;
window.filterShopCategory = filterShopCategory;
window.setShopSort = setShopSort;
