// [SECTION:SHOPS_CORE]
// Extrahiert aus shops.js
// Shop-System für Händler und Inventar
// Zeilen: 859

// SHOPS - Shop-System für Händler und Inventar
// ============================================================

const SHOP_TYPES = {
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
};

const SHOP_ITEM_CATEGORIES = {
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
};

// Shop State
let expandedShops = new Set();

// D&D 5E Währungssystem
const DND_CURRENCY = {
    pp: { name: 'Platin', abbr: 'PP', icon: '💎', inCopper: 1000 },
    gp: { name: 'Gold', abbr: 'GM', icon: '🪙', inCopper: 100 },
    ep: { name: 'Elektrum', abbr: 'EM', icon: '⚪', inCopper: 50 },
    sp: { name: 'Silber', abbr: 'SM', icon: '🥈', inCopper: 10 },
    cp: { name: 'Kupfer', abbr: 'KM', icon: '🥉', inCopper: 1 }
};

// Warenkorb
let shopCart = [];

function parseCurrency(costStr) {
    if (!costStr) return 0;
    const str = costStr.toLowerCase().trim();
    let totalCopper = 0;
    
    // Regex für verschiedene Formate: "15 GM", "2GM", "1 PP 5 GM", "100 KM"
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
    
    // Falls nur eine Zahl ohne Währung, nehme Gold an
    if (totalCopper === 0) {
        const numMatch = str.match(/^(\d+(?:[.,]\d+)?)/);
        if (numMatch) {
            totalCopper = parseFloat(numMatch[1].replace(',', '.')) * 100;
        }
    }
    
    return Math.round(totalCopper);
}

function formatCurrency(copperAmount, format = 'optimal') {
    if (copperAmount === 0) return '0 KM';
    
    if (format === 'optimal') {
        // Optimale Darstellung - größte passende Einheit
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
    } else if (format === 'gold') {
        // Alles in Gold
        const gp = copperAmount / 100;
        return `${gp.toFixed(gp % 1 === 0 ? 0 : 2)} GM`;
    }
    
    return `${copperAmount} KM`;
}

function addToCart(shopId, itemIdx, qty = 1) {
    const shop = (D.shops || []).find(s => s.id === shopId);
    if (!shop || !shop.items || !shop.items[itemIdx]) return;
    
    const item = shop.items[itemIdx];
    if (item.available === false) {
        showToast('⚠️ Artikel nicht verfügbar', 'warning');
        return;
    }
    
    // Prüfe ob bereits im Warenkorb
    const existingIdx = shopCart.findIndex(c => c.shopId === shopId && c.itemIdx === itemIdx);
    
    if (existingIdx > -1) {
        // Erhöhe Menge, aber nicht über verfügbare Menge
        const maxQty = item.unlimited ? 9999 : (item.quantity || 999);
        shopCart[existingIdx].qty = Math.min(shopCart[existingIdx].qty + qty, maxQty);
    } else {
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
        } else {
            shopCart[idx].qty = Math.min(newQty, shopCart[idx].maxQty);
            renderCartModal();
        }
    }
}

/**
 * Wrapper für onChange-Handler im Cart-System
 * @param {HTMLInputElement} input - Das Input-Element
 */
function updateCartQtyFromInput(input) {
    const idx = parseInt(input.dataset.id);
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
        badge.textContent = totalItems;
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
    
    if (!container) return;
    
    if (shopCart.length === 0) {
        container.innerHTML = '<div class="cart-empty">🛒 Warenkorb ist leer</div>';
        if (totalEl) totalEl.textContent = '0 KM';
        if (totalGoldEl) totalGoldEl.textContent = '(0 GM)';
        return;
    }
    
    // Gruppiere nach Shop
    const byShop = {};
    shopCart.forEach((item, idx) => {
        if (!byShop[item.shopName]) byShop[item.shopName] = [];
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
    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (totalGoldEl) totalGoldEl.textContent = `(${formatCurrency(total, 'gold')})`;
}

function checkoutCart() {
    if (shopCart.length === 0) {
        showToast('⚠️ Warenkorb ist leer', 'warning');
        return;
    }
    
    const total = getCartTotal();
    const itemCount = shopCart.reduce((sum, c) => sum + c.qty, 0);
    
    // Generiere Quittung
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
    
    $('checkout-receipt').textContent = receipt;
    $('checkout-total').textContent = formatCurrency(total);
    $('checkout-total-breakdown').innerHTML = `
        <div class="checkout-breakdown">
            ${total >= 1000 ? `<span>💎 ${Math.floor(total / 1000)} PP</span>` : ''}
            ${Math.floor((total % 1000) / 100) > 0 ? `<span>🪙 ${Math.floor((total % 1000) / 100)} GM</span>` : ''}
            ${Math.floor((total % 100) / 10) > 0 ? `<span>🥈 ${Math.floor((total % 100) / 10)} SM</span>` : ''}
            ${total % 10 > 0 ? `<span>🥉 ${total % 10} KM</span>` : ''}
        </div>
    `;
    
    hideModal('cart-modal');
    showModal('checkout-modal');
}

function confirmCheckout() {
    // Optional: Reduziere Shop-Inventar
    shopCart.forEach(c => {
        const shop = (D.shops || []).find(s => s.id === c.shopId);
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
    const receipt = $('checkout-receipt').textContent;
    navigator.clipboard.writeText(receipt).then(() => {
        showToast('📋 Quittung kopiert');
    });
}

function renderShops() {
    const container = $('shop-list');
    if (!container) return;
    
    try {
        // Ensure shops array exists
        if (!D.shops) D.shops = [];
        
        // Update counter
        updateCounters({ 'shops-io-count': D.shops.length });
        
        // Populate location filter
        populateFilterDropdown('shop-location-filter', D.locations || [], { allLabel: 'Alle Orte' });
        
        const search = ($('shop-search')?.value || '').toLowerCase();
        const typeFilter = $('shop-type-filter')?.value || '';
        const locationFilter = $('shop-location-filter')?.value ? parseInt($('shop-location-filter').value) : null;
        
        let shops = [...D.shops];
        
        // Apply filters - mit sicheren Zugriffen
        if (search) {
            shops = shops.filter(s => 
                (s.name || '').toLowerCase().includes(search) ||
                (s.description || '').toLowerCase().includes(search) ||
                (s.items || []).some(i => (i.name || '').toLowerCase().includes(search))
            );
        }
        if (typeFilter) {
            shops = shops.filter(s => s.type === typeFilter);
        }
        if (locationFilter) {
            shops = shops.filter(s => s.locationId === locationFilter);
        }
        
        // Sort by name - sicher
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
        
        container.innerHTML = shops.map(shop => {
            try {
                const type = SHOP_TYPES[shop.type] || SHOP_TYPES.unbekannt;
                const npc = EntityLookup.npc(shop.npcId);
                const location = EntityLookup.location(shop.locationId);
                const isExpanded = expandedShops.has(shop.id);
                const items = shop.items || [];
                const availableItems = items.filter(i => i.available !== false);
                
                // Group items by category
                const weaponCount = items.filter(i => i.category === 'weapon').length;
                const armorCount = items.filter(i => i.category === 'armor').length;
                const itemCount = items.filter(i => i.category === 'item').length;
                const serviceCount = items.filter(i => i.category === 'service').length;
                const miscCount = items.filter(i => i.category === 'misc').length;
                
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
                                <button class="btn btn-sm" data-action="edit-shop" data-id="${shop.id}" title="Bearbeiten">✏️</button>
                                <button class="btn btn-sm btn-danger" data-action="delete-shop" data-id="${shop.id}" title="Löschen">🗑️</button>
                            </div>
                        </div>
                        
                        <div class="shop-body" style="${isExpanded ? '' : 'display: none;'}">
                            ${shop.description ? `<div class="shop-description">${esc(shop.description)}</div>` : ''}
                            ${shop.special ? `<div class="shop-special">✨ ${esc(shop.special)}</div>` : ''}
                            ${shop.note ? `<div class="shop-note">📝 ${esc(shop.note)}</div>` : ''}
                            
                            <div class="shop-category-tabs">
                                ${weaponCount ? `<span class="shop-cat-badge weapon">⚔️ ${weaponCount}</span>` : ''}
                                ${armorCount ? `<span class="shop-cat-badge armor">🛡️ ${armorCount}</span>` : ''}
                                ${itemCount ? `<span class="shop-cat-badge item">🧪 ${itemCount}</span>` : ''}
                                ${serviceCount ? `<span class="shop-cat-badge service">🔧 ${serviceCount}</span>` : ''}
                                ${miscCount ? `<span class="shop-cat-badge misc">📦 ${miscCount}</span>` : ''}
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
            } catch (shopErr) {
                console.error('Fehler beim Rendern eines Shops:', shopErr, shop);
                return `<div class="shop-card" style="color: var(--red);">Fehler beim Laden des Shops</div>`;
            }
        }).join('');
    } catch (err) {
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
    if (!items || !Array.isArray(items)) return '<div class="shop-items-empty">Keine Artikel</div>';
    
    try {
        return `<div class="si-list">
            ${items.map((item, idx) => {
                try {
                    const cat = SHOP_ITEM_CATEGORIES[item.category] || SHOP_ITEM_CATEGORIES.misc;
                    const isAvailable = item.available !== false;
                    const isExpanded = expandedShopItems.has(`${shopId}-${idx}`);
                    const itemName = item.name || 'Unbenannt';
                    const itemCost = item.cost || '—';
                    const itemQty = item.unlimited ? '∞' : (item.quantity || 1);
                    
                    // Details je nach Kategorie
                    let detailTags = '';
                    if (item.category === 'weapon') {
                        detailTags = [
                            item.type ? `<span class="si-tag"><span class="si-tag-l">Typ:</span> <span class="si-tag-v">${esc(item.type)}</span></span>` : '',
                            item.damage ? `<span class="si-tag"><span class="si-tag-l">Schaden:</span> <span class="si-tag-v">${esc(item.damage)}</span></span>` : '',
                            item.properties ? `<span class="si-tag"><span class="si-tag-l">Eigensch.:</span> <span class="si-tag-v">${esc(item.properties)}</span></span>` : '',
                            item.mastery ? `<span class="si-tag"><span class="si-tag-l">Meisterung:</span> <span class="si-tag-v">${esc(item.mastery)}</span></span>` : '',
                            item.weight ? `<span class="si-tag"><span class="si-tag-l">Gewicht:</span> <span class="si-tag-v">${esc(item.weight)}</span></span>` : ''
                        ].filter(Boolean).join('');
                    } else if (item.category === 'armor') {
                        detailTags = [
                            item.type ? `<span class="si-tag"><span class="si-tag-l">Typ:</span> <span class="si-tag-v">${esc(item.type)}</span></span>` : '',
                            item.ac ? `<span class="si-tag"><span class="si-tag-l">RK:</span> <span class="si-tag-v">${esc(item.ac)}</span></span>` : '',
                            item.strength ? `<span class="si-tag"><span class="si-tag-l">STR:</span> <span class="si-tag-v">${esc(item.strength)}</span></span>` : '',
                            item.stealth === 'disadvantage' ? `<span class="si-tag"><span class="si-tag-l">Heiml.:</span> <span class="si-tag-v" style="color:var(--red);">Nachteil</span></span>` : '',
                            item.weight ? `<span class="si-tag"><span class="si-tag-l">Gewicht:</span> <span class="si-tag-v">${esc(item.weight)}</span></span>` : ''
                        ].filter(Boolean).join('');
                    } else {
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
                } catch (itemErr) {
                    console.error('Fehler beim Rendern eines Shop-Items:', itemErr, item);
                    return '';
                }
            }).join('')}
        </div>`;
    } catch (err) {
        console.error('renderShopItems Fehler:', err);
        return '<div class="shop-items-empty">Fehler beim Laden der Artikel</div>';
    }
}

let expandedShopItems = new Set();

function toggleShopItem(shopId, idx) {
    const key = `${shopId}-${idx}`;
    if (expandedShopItems.has(key)) {
        expandedShopItems.delete(key);
    } else {
        expandedShopItems.add(key);
    }
    
    // Direkt das DOM-Element togglen statt komplettes Re-Render
    const item = document.querySelector(`.si-item[data-shop="${shopId}"][data-idx="${idx}"]`);
    if (item) {
        item.classList.toggle('expanded', expandedShopItems.has(key));
    }
}

function toggleShop(id) {
    if (expandedShops.has(id)) {
        expandedShops.delete(id);
    } else {
        expandedShops.add(id);
    }

    const isExpanded = expandedShops.has(id);

    // Direkt das DOM-Element togglen statt komplettes Re-Render
    const shop = document.querySelector(`.shop-card[data-shop-id="${id}"]`);
    if (shop) {
        shop.classList.toggle('expanded', isExpanded);
        shop.classList.toggle('collapsed', !isExpanded);

        // Toggle shop-body visibility
        const body = shop.querySelector('.shop-body');
        if (body) {
            body.style.display = isExpanded ? '' : 'none';
        }

        // Toggle arrow
        const toggle = shop.querySelector('.shop-toggle');
        if (toggle) {
            toggle.textContent = isExpanded ? '▼' : '▶';
        }
    }
}

function expandAllShops() {
    (D.shops || []).forEach(s => expandedShops.add(s.id));
    renderShops();
    showToast('Alle Shops ausgeklappt');
}

function collapseAllShops() {
    expandedShops.clear();
    renderShops();
    showToast('Alle Shops eingeklappt');
}

function showShopModal(id = null) {
    clearShopForm();
    
    // Populate NPC and Location dropdowns
    const npcSelect = $('shop-npc');
    const locSelect = $('shop-location');
    
    npcSelect.innerHTML = '<option value="">-- Kein NPC --</option>' +
        (D.npcs || []).map(n => `<option value="${n.id}">${esc(n.name)}</option>`).join('');
    
    locSelect.innerHTML = '<option value="">-- Kein Ort --</option>' +
        (D.locations || []).map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
    
    if (id) {
        const shop = (D.shops || []).find(s => s.id === id);
        if (shop) {
            $('edit-shop-id').value = id;
            $('shop-type').value = shop.type || 'laden';
            $('shop-name').value = shop.name || '';
            $('shop-npc').value = shop.npcId || '';
            $('shop-location').value = shop.locationId || '';
            $('shop-description').value = shop.description || '';
            $('shop-special').value = shop.special || '';
            $('shop-note').value = shop.note || '';
        }
    }
    
    showModal('shop-modal');
}

function clearShopForm() {
    $('edit-shop-id').value = '';
    $('shop-type').value = 'laden';
    $('shop-name').value = '';
    $('shop-npc').value = '';
    $('shop-location').value = '';
    $('shop-description').value = '';
    $('shop-special').value = '';
    $('shop-note').value = '';
}

function saveShop() {
    const name = $('shop-name').value.trim();
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    
    if (!D.shops) D.shops = [];
    
    const editId = $('edit-shop-id').value;
    const shop = {
        type: $('shop-type').value,
        name: name,
        npcId: $('shop-npc').value ? parseInt($('shop-npc').value) : null,
        locationId: $('shop-location').value ? parseInt($('shop-location').value) : null,
        description: $('shop-description').value.trim(),
        special: $('shop-special').value.trim(),
        note: $('shop-note').value.trim()
    };
    
    if (editId) {
        const idx = D.shops.findIndex(s => s.id === parseInt(editId));
        if (idx > -1) {
            D.shops[idx] = { ...D.shops[idx], ...shop };
            showToast('Shop aktualisiert');
        }
    } else {
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
    if (confirm('Shop und alle Artikel löschen?')) {
        pushUndo('Shop gelöscht');
        D.shops = (D.shops || []).filter(s => s.id !== id);
        expandedShops.delete(id);
        renderShops();
        save();
        showToast('Shop gelöscht');
    }
}

// Shop Item Functions
function showShopItemModal(shopId, itemIdx = null) {
    clearShopItemForm();
    $('edit-shop-item-shop-id').value = shopId;
    
    if (itemIdx !== null) {
        const shop = (D.shops || []).find(s => s.id === shopId);
        if (shop && shop.items && shop.items[itemIdx]) {
            const item = shop.items[itemIdx];
            $('edit-shop-item-id').value = itemIdx;
            $('shop-item-available').checked = item.available !== false;
            $('shop-item-quantity').value = item.unlimited ? '' : (item.quantity || 1);
            if ($('shop-item-unlimited')) {
                $('shop-item-unlimited').checked = item.unlimited || false;
                toggleShopItemUnlimited();
            }
            $('shop-item-category').value = item.category || 'misc';
            $('shop-item-name').value = item.name || '';
            $('shop-item-type').value = item.type || '';
            $('shop-item-damage').value = item.damage || '';
            $('shop-item-properties').value = item.properties || '';
            $('shop-item-mastery').value = item.mastery || '';
            $('shop-item-ac').value = item.ac || '';
            $('shop-item-strength').value = item.strength || '';
            $('shop-item-stealth').value = item.stealth || '';
            $('shop-item-desc').value = item.description || '';
            $('shop-item-effect').value = item.effect || '';
            $('shop-item-weight').value = item.weight || '';
            $('shop-item-cost').value = item.cost || '';
            $('shop-item-special').value = item.special || '';
            $('shop-item-note').value = item.note || '';
        }
    }
    
    updateShopItemFields();
    showModal('shop-item-modal');
}

function clearShopItemForm() {
    $('edit-shop-item-id').value = '';
    $('shop-item-available').checked = true;
    $('shop-item-quantity').value = 1;
    if ($('shop-item-unlimited')) {
        $('shop-item-unlimited').checked = false;
        toggleShopItemUnlimited();
    }
    $('shop-item-category').value = 'weapon';
    $('shop-item-name').value = '';
    $('shop-item-type').value = '';
    $('shop-item-damage').value = '';
    $('shop-item-properties').value = '';
    $('shop-item-mastery').value = '';
    $('shop-item-ac').value = '';
    $('shop-item-strength').value = '';
    $('shop-item-stealth').value = '';
    $('shop-item-desc').value = '';
    $('shop-item-effect').value = '';
    $('shop-item-weight').value = '';
    $('shop-item-cost').value = '';
    $('shop-item-special').value = '';
    $('shop-item-note').value = '';
}

function updateShopItemFields() {
    const category = $('shop-item-category').value;
    
    // Hide all category-specific fields
    document.querySelectorAll('.shop-item-fields').forEach(el => el.style.display = 'none');
    
    // Show relevant fields
    if (category === 'weapon') {
        $('shop-item-weapon-fields').style.display = '';
    } else if (category === 'armor') {
        $('shop-item-armor-fields').style.display = '';
    } else {
        $('shop-item-general-fields').style.display = '';
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
        } else {
            quantityInput.disabled = false;
            quantityInput.style.opacity = '1';
            quantityInput.placeholder = '';
            if (!quantityInput.value) quantityInput.value = 1;
        }
    }
}

function saveShopItem() {
    const name = $('shop-item-name').value.trim();
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    
    const shopId = parseInt($('edit-shop-item-shop-id').value);
    const shop = (D.shops || []).find(s => s.id === shopId);
    if (!shop) {
        showToast('Shop nicht gefunden', 'error');
        return;
    }
    
    if (!shop.items) shop.items = [];
    
    const category = $('shop-item-category').value;
    const isUnlimited = $('shop-item-unlimited') && $('shop-item-unlimited').checked;
    const item = {
        available: $('shop-item-available').checked,
        unlimited: isUnlimited,
        quantity: isUnlimited ? null : (parseInt($('shop-item-quantity').value) || 1),
        category: category,
        name: name,
        type: $('shop-item-type').value.trim(),
        weight: $('shop-item-weight').value.trim(),
        cost: $('shop-item-cost').value.trim(),
        special: $('shop-item-special').value.trim(),
        note: $('shop-item-note').value.trim()
    };
    
    // Category-specific fields
    if (category === 'weapon') {
        item.damage = $('shop-item-damage').value.trim();
        item.properties = $('shop-item-properties').value.trim();
        item.mastery = $('shop-item-mastery').value.trim();
    } else if (category === 'armor') {
        item.ac = $('shop-item-ac').value.trim();
        item.strength = $('shop-item-strength').value.trim();
        item.stealth = $('shop-item-stealth').value;
    } else {
        item.description = $('shop-item-desc').value.trim();
        item.effect = $('shop-item-effect').value.trim();
    }
    
    const editIdx = $('edit-shop-item-id').value;
    if (editIdx !== '') {
        shop.items[parseInt(editIdx)] = item;
        showToast('Artikel aktualisiert');
    } else {
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
    if (confirm('Artikel löschen?')) {
        pushUndo('Shop-Artikel gelöscht');
        const shop = (D.shops || []).find(s => s.id === shopId);
        if (shop && shop.items) {
            shop.items.splice(idx, 1);
            renderShops();
            save();
            showToast('Artikel gelöscht');
        }
    }
}

function toggleShopItemAvailability(shopIdOrElement, idx) {
    let shopId = shopIdOrElement;
    let itemIdx = idx;

    // Unterstuetzt sowohl direkte Werte als auch Element (von data-on-change)
    if (shopIdOrElement && shopIdOrElement.tagName) {
        // Element uebergeben - Werte aus data-Attributen extrahieren
        shopId = parseInt(shopIdOrElement.dataset.shopId, 10);
        itemIdx = parseInt(shopIdOrElement.dataset.itemIdx, 10);
    }

    const shop = (D.shops || []).find(s => s.id === shopId);
    if (shop && shop.items && shop.items[itemIdx]) {
        shop.items[itemIdx].available = !shop.items[itemIdx].available;
        renderShops();
        save();
    }
}

// ============================================================