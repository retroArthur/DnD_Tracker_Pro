// [SECTION:SHOPS_CORE]
// Extrahiert aus shops.js
// Shop-System für Händler und Inventar
// Zeilen: 920

import { $, esc } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { pushUndo } from '@systems/undo';
import { showModal, hideModal } from '@systems/spellslots/navigation';
import { EntityLookup } from '@render/helpers';

// ============================================================
// TYPES
// ============================================================

interface ShopType {
    icon: string;
    name: string;
}

interface ShopItemCategory {
    icon: string;
    name: string;
    color: string;
}

interface Currency {
    name: string;
    abbr: string;
    icon: string;
    inCopper: number;
}

interface CartItem {
    shopId: number;
    itemIdx: number;
    shopName: string;
    itemName: string;
    category: string;
    cost: string;
    costCopper: number;
    qty: number;
    maxQty: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const SHOP_TYPES: Readonly<Record<string, ShopType>> = Object.freeze({
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

const SHOP_ITEM_CATEGORIES: Readonly<Record<string, ShopItemCategory>> = Object.freeze({
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

const DND_CURRENCY: Readonly<Record<string, Currency>> = Object.freeze({
    pp: { name: 'Platin', abbr: 'PP', icon: '💎', inCopper: 1000 },
    gp: { name: 'Gold', abbr: 'GM', icon: '🪙', inCopper: 100 },
    ep: { name: 'Elektrum', abbr: 'EM', icon: '⚪', inCopper: 50 },
    sp: { name: 'Silber', abbr: 'SM', icon: '🥈', inCopper: 10 },
    cp: { name: 'Kupfer', abbr: 'KM', icon: '🥉', inCopper: 1 }
});

// ============================================================
// STATE
// ============================================================

let expandedShops: Set<number> = new Set();
let expandedShopItems: Set<string> = new Set();
let shopCart: CartItem[] = [];

// ============================================================
// CURRENCY HELPERS
// ============================================================

function parseCurrency(costStr: string): number {
    if (!costStr) return 0;
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

function formatCurrency(copperAmount: number, format: 'optimal' | 'gold' | 'copper' = 'optimal'): string {
    if (copperAmount === 0) return '0 KM';

    if (format === 'optimal') {
        const parts: string[] = [];
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
        const gp = copperAmount / 100;
        return `${gp.toFixed(gp % 1 === 0 ? 0 : 2)} GM`;
    }

    return `${copperAmount} KM`;
}

// ============================================================
// CART FUNCTIONS
// ============================================================

export function addToCart(shopId: number, itemIdx: number, qty: number = 1): void {
    const D = (window as any).D;
    const shop = (D.shops || []).find((s: any) => s.id === shopId);
    if (!shop || !shop.items || !shop.items[itemIdx]) return;

    const item = shop.items[itemIdx];
    if (item.available === false) {
        showToast('⚠️ Artikel nicht verfügbar', 'warning');
        return;
    }

    const existingIdx = shopCart.findIndex(c => c.shopId === shopId && c.itemIdx === itemIdx);

    if (existingIdx > -1) {
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

export function removeFromCart(idx: number): void {
    shopCart.splice(idx, 1);
    updateCartBadge();
    renderCartModal();
}

export function updateCartQty(idx: number, newQty: number): void {
    if (shopCart[idx]) {
        if (newQty <= 0) {
            removeFromCart(idx);
        } else {
            shopCart[idx].qty = Math.min(newQty, shopCart[idx].maxQty);
            renderCartModal();
        }
    }
}

export function updateCartQtyFromInput(input: HTMLInputElement): void {
    const idx = parseInt(input.dataset.id || '0');
    const newQty = parseInt(input.value) || 1;
    updateCartQty(idx, newQty);
}

export function clearCart(): void {
    shopCart = [];
    updateCartBadge();
    renderCartModal();
    showToast('🛒 Warenkorb geleert');
}

function updateCartBadge(): void {
    const badge = $('cart-badge');
    const totalItems = shopCart.reduce((sum, c) => sum + c.qty, 0);
    if (badge) {
        badge.textContent = String(totalItems);
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function getCartTotal(): number {
    return shopCart.reduce((sum, c) => sum + (c.costCopper * c.qty), 0);
}

export function showCartModal(): void {
    renderCartModal();
    showModal('cart-modal');
}

function renderCartModal(): void {
    const D = (window as any).D;
    const renderEmptyState = (window as any).renderEmptyState;
    const updateCounters = (window as any).updateCounters;
    const populateFilterDropdown = (window as any).populateFilterDropdown;
    const renderEntityLink = (window as any).renderEntityLink;

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

    const byShop: Record<string, Array<CartItem & { cartIdx: number }>> = {};
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

export function checkoutCart(): void {
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

    if (receiptEl) receiptEl.textContent = receipt;
    if (totalCheckoutEl) totalCheckoutEl.textContent = formatCurrency(total);
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

export function confirmCheckout(): void {
    const D = (window as any).D;

    shopCart.forEach(c => {
        const shop = (D.shops || []).find((s: any) => s.id === c.shopId);
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

export function copyReceipt(): void {
    const receiptEl = $('checkout-receipt');
    if (!receiptEl) return;
    const receipt = receiptEl.textContent || '';
    navigator.clipboard.writeText(receipt).then(() => {
        showToast('📋 Quittung kopiert');
    });
}

// ============================================================
// SHOP RENDER
// ============================================================

export function renderShops(): void {
    const D = (window as any).D;
    const renderEmptyState = (window as any).renderEmptyState;
    const updateCounters = (window as any).updateCounters;
    const populateFilterDropdown = (window as any).populateFilterDropdown;
    const renderEntityLink = (window as any).renderEntityLink;

    const container = $('shop-list');
    if (!container) return;

    try {
        if (!D.shops) D.shops = [];

        updateCounters({ 'shops-io-count': D.shops.length });
        populateFilterDropdown('shop-location-filter', D.locations || [], { allLabel: 'Alle Orte' });

        const searchInput = $('shop-search') as HTMLInputElement | null;
        const typeFilterInput = $('shop-type-filter') as HTMLSelectElement | null;
        const locationFilterInput = $('shop-location-filter') as HTMLSelectElement | null;

        const search = (searchInput?.value || '').toLowerCase();
        const typeFilter = typeFilterInput?.value || '';
        const locationFilter = locationFilterInput?.value ? parseInt(locationFilterInput.value) : null;

        let shops = [...D.shops];

        if (search) {
            shops = shops.filter((s: any) =>
                (s.name || '').toLowerCase().includes(search) ||
                (s.description || '').toLowerCase().includes(search) ||
                (s.items || []).some((i: any) => (i.name || '').toLowerCase().includes(search))
            );
        }
        if (typeFilter) {
            shops = shops.filter((s: any) => s.type === typeFilter);
        }
        if (locationFilter) {
            shops = shops.filter((s: any) => s.locationId === locationFilter);
        }

        shops.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

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

        container.innerHTML = shops.map((shop: any) => {
            try {
                const type = SHOP_TYPES[shop.type] || SHOP_TYPES.unbekannt;
                const npc = EntityLookup.npc(shop.npcId);
                const location = EntityLookup.location(shop.locationId);
                const isExpanded = expandedShops.has(shop.id);
                const items = shop.items || [];
                const availableItems = items.filter((i: any) => i.available !== false);

                const weaponCount = items.filter((i: any) => i.category === 'weapon').length;
                const armorCount = items.filter((i: any) => i.category === 'armor').length;
                const itemCount = items.filter((i: any) => i.category === 'item').length;
                const serviceCount = items.filter((i: any) => i.category === 'service').length;
                const miscCount = items.filter((i: any) => i.category === 'misc').length;

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

function renderShopItems(shopId: number, items: any[]): string {
    if (!items || !Array.isArray(items)) return '<div class="shop-items-empty">Keine Artikel</div>';

    try {
        return `<div class="si-list">
            ${items.map((item: any, idx: number) => {
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

export function toggleShopItem(shopId: number, idx: number): void {
    const key = `${shopId}-${idx}`;
    if (expandedShopItems.has(key)) {
        expandedShopItems.delete(key);
    } else {
        expandedShopItems.add(key);
    }

    const item = document.querySelector(`.si-item[data-shop="${shopId}"][data-idx="${idx}"]`);
    if (item) {
        item.classList.toggle('expanded', expandedShopItems.has(key));
    }
}

export function toggleShop(id: number): void {
    if (expandedShops.has(id)) {
        expandedShops.delete(id);
    } else {
        expandedShops.add(id);
    }

    const isExpanded = expandedShops.has(id);
    const shop = document.querySelector(`.shop-card[data-shop-id="${id}"]`);
    if (shop) {
        shop.classList.toggle('expanded', isExpanded);
        shop.classList.toggle('collapsed', !isExpanded);

        const body = shop.querySelector('.shop-body') as HTMLElement | null;
        if (body) {
            body.style.display = isExpanded ? '' : 'none';
        }

        const toggle = shop.querySelector('.shop-toggle');
        if (toggle) {
            toggle.textContent = isExpanded ? '▼' : '▶';
        }
    }
}

export function expandAllShops(): void {
    const D = (window as any).D;
    (D.shops || []).forEach((s: any) => expandedShops.add(s.id));
    renderShops();
    showToast('Alle Shops ausgeklappt');
}

export function collapseAllShops(): void {
    expandedShops.clear();
    renderShops();
    showToast('Alle Shops eingeklappt');
}

// ============================================================
// SHOP CRUD
// ============================================================

export function showShopModal(id: number | null = null): void {
    const D = (window as any).D;
    const nextId = (window as any).nextId;

    clearShopForm();

    const npcSelect = $('shop-npc') as HTMLSelectElement | null;
    const locSelect = $('shop-location') as HTMLSelectElement | null;

    if (npcSelect) {
        npcSelect.innerHTML = '<option value="">-- Kein NPC --</option>' +
            (D.npcs || []).map((n: any) => `<option value="${n.id}">${esc(n.name)}</option>`).join('');
    }

    if (locSelect) {
        locSelect.innerHTML = '<option value="">-- Kein Ort --</option>' +
            (D.locations || []).map((l: any) => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
    }

    if (id) {
        const shop = (D.shops || []).find((s: any) => s.id === id);
        if (shop) {
            const editIdInput = $('edit-shop-id') as HTMLInputElement | null;
            const typeInput = $('shop-type') as HTMLSelectElement | null;
            const nameInput = $('shop-name') as HTMLInputElement | null;
            const npcInput = $('shop-npc') as HTMLSelectElement | null;
            const locationInput = $('shop-location') as HTMLSelectElement | null;
            const descInput = $('shop-description') as HTMLTextAreaElement | null;
            const specialInput = $('shop-special') as HTMLTextAreaElement | null;
            const noteInput = $('shop-note') as HTMLTextAreaElement | null;

            if (editIdInput) editIdInput.value = String(id);
            if (typeInput) typeInput.value = shop.type || 'laden';
            if (nameInput) nameInput.value = shop.name || '';
            if (npcInput) npcInput.value = shop.npcId || '';
            if (locationInput) locationInput.value = shop.locationId || '';
            if (descInput) descInput.value = shop.description || '';
            if (specialInput) specialInput.value = shop.special || '';
            if (noteInput) noteInput.value = shop.note || '';
        }
    }

    showModal('shop-modal');
}

function clearShopForm(): void {
    const editIdInput = $('edit-shop-id') as HTMLInputElement | null;
    const typeInput = $('shop-type') as HTMLSelectElement | null;
    const nameInput = $('shop-name') as HTMLInputElement | null;
    const npcInput = $('shop-npc') as HTMLSelectElement | null;
    const locationInput = $('shop-location') as HTMLSelectElement | null;
    const descInput = $('shop-description') as HTMLTextAreaElement | null;
    const specialInput = $('shop-special') as HTMLTextAreaElement | null;
    const noteInput = $('shop-note') as HTMLTextAreaElement | null;

    if (editIdInput) editIdInput.value = '';
    if (typeInput) typeInput.value = 'laden';
    if (nameInput) nameInput.value = '';
    if (npcInput) npcInput.value = '';
    if (locationInput) locationInput.value = '';
    if (descInput) descInput.value = '';
    if (specialInput) specialInput.value = '';
    if (noteInput) noteInput.value = '';
}

export function saveShop(): void {
    const D = (window as any).D;
    const nextId = (window as any).nextId;

    const nameInput = $('shop-name') as HTMLInputElement | null;
    const name = nameInput?.value.trim() || '';
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }

    if (!D.shops) D.shops = [];

    const editIdInput = $('edit-shop-id') as HTMLInputElement | null;
    const typeInput = $('shop-type') as HTMLSelectElement | null;
    const npcInput = $('shop-npc') as HTMLSelectElement | null;
    const locationInput = $('shop-location') as HTMLSelectElement | null;
    const descInput = $('shop-description') as HTMLTextAreaElement | null;
    const specialInput = $('shop-special') as HTMLTextAreaElement | null;
    const noteInput = $('shop-note') as HTMLTextAreaElement | null;

    const editId = editIdInput?.value || '';
    const shop: any = {
        type: typeInput?.value || 'laden',
        name: name,
        npcId: npcInput?.value ? parseInt(npcInput.value) : null,
        locationId: locationInput?.value ? parseInt(locationInput.value) : null,
        description: descInput?.value.trim() || '',
        special: specialInput?.value.trim() || '',
        note: noteInput?.value.trim() || ''
    };

    if (editId) {
        const idx = D.shops.findIndex((s: any) => s.id === parseInt(editId));
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

export function editShop(id: number): void {
    showShopModal(id);
}

export function deleteShop(id: number): void {
    const D = (window as any).D;
    if (confirm('Shop und alle Artikel löschen?')) {
        pushUndo('Shop gelöscht');
        D.shops = (D.shops || []).filter((s: any) => s.id !== id);
        expandedShops.delete(id);
        renderShops();
        save();
        showToast('Shop gelöscht');
    }
}

// ============================================================
// SHOP ITEM CRUD
// ============================================================

export function showShopItemModal(shopId: number, itemIdx: number | null = null): void {
    const D = (window as any).D;
    clearShopItemForm();

    const shopIdInput = $('edit-shop-item-shop-id') as HTMLInputElement | null;
    if (shopIdInput) shopIdInput.value = String(shopId);

    if (itemIdx !== null) {
        const shop = (D.shops || []).find((s: any) => s.id === shopId);
        if (shop && shop.items && shop.items[itemIdx]) {
            const item = shop.items[itemIdx];
            const editIdInput = $('edit-shop-item-id') as HTMLInputElement | null;
            const availInput = $('shop-item-available') as HTMLInputElement | null;
            const qtyInput = $('shop-item-quantity') as HTMLInputElement | null;
            const unlimitedInput = $('shop-item-unlimited') as HTMLInputElement | null;
            const catInput = $('shop-item-category') as HTMLSelectElement | null;
            const nameInput = $('shop-item-name') as HTMLInputElement | null;
            const typeInput = $('shop-item-type') as HTMLInputElement | null;
            const damageInput = $('shop-item-damage') as HTMLInputElement | null;
            const propsInput = $('shop-item-properties') as HTMLInputElement | null;
            const masteryInput = $('shop-item-mastery') as HTMLInputElement | null;
            const acInput = $('shop-item-ac') as HTMLInputElement | null;
            const strInput = $('shop-item-strength') as HTMLInputElement | null;
            const stealthInput = $('shop-item-stealth') as HTMLSelectElement | null;
            const descInput = $('shop-item-desc') as HTMLTextAreaElement | null;
            const effectInput = $('shop-item-effect') as HTMLInputElement | null;
            const weightInput = $('shop-item-weight') as HTMLInputElement | null;
            const costInput = $('shop-item-cost') as HTMLInputElement | null;
            const specialInput = $('shop-item-special') as HTMLTextAreaElement | null;
            const noteInput = $('shop-item-note') as HTMLTextAreaElement | null;

            if (editIdInput) editIdInput.value = String(itemIdx);
            if (availInput) availInput.checked = item.available !== false;
            if (qtyInput) qtyInput.value = item.unlimited ? '' : (item.quantity || 1);
            if (unlimitedInput) {
                unlimitedInput.checked = item.unlimited || false;
                toggleShopItemUnlimited();
            }
            if (catInput) catInput.value = item.category || 'misc';
            if (nameInput) nameInput.value = item.name || '';
            if (typeInput) typeInput.value = item.type || '';
            if (damageInput) damageInput.value = item.damage || '';
            if (propsInput) propsInput.value = item.properties || '';
            if (masteryInput) masteryInput.value = item.mastery || '';
            if (acInput) acInput.value = item.ac || '';
            if (strInput) strInput.value = item.strength || '';
            if (stealthInput) stealthInput.value = item.stealth || '';
            if (descInput) descInput.value = item.description || '';
            if (effectInput) effectInput.value = item.effect || '';
            if (weightInput) weightInput.value = item.weight || '';
            if (costInput) costInput.value = item.cost || '';
            if (specialInput) specialInput.value = item.special || '';
            if (noteInput) noteInput.value = item.note || '';
        }
    }

    updateShopItemFields();
    showModal('shop-item-modal');
}

function clearShopItemForm(): void {
    const editIdInput = $('edit-shop-item-id') as HTMLInputElement | null;
    const availInput = $('shop-item-available') as HTMLInputElement | null;
    const qtyInput = $('shop-item-quantity') as HTMLInputElement | null;
    const unlimitedInput = $('shop-item-unlimited') as HTMLInputElement | null;
    const catInput = $('shop-item-category') as HTMLSelectElement | null;
    const nameInput = $('shop-item-name') as HTMLInputElement | null;
    const typeInput = $('shop-item-type') as HTMLInputElement | null;
    const damageInput = $('shop-item-damage') as HTMLInputElement | null;
    const propsInput = $('shop-item-properties') as HTMLInputElement | null;
    const masteryInput = $('shop-item-mastery') as HTMLInputElement | null;
    const acInput = $('shop-item-ac') as HTMLInputElement | null;
    const strInput = $('shop-item-strength') as HTMLInputElement | null;
    const stealthInput = $('shop-item-stealth') as HTMLSelectElement | null;
    const descInput = $('shop-item-desc') as HTMLTextAreaElement | null;
    const effectInput = $('shop-item-effect') as HTMLInputElement | null;
    const weightInput = $('shop-item-weight') as HTMLInputElement | null;
    const costInput = $('shop-item-cost') as HTMLInputElement | null;
    const specialInput = $('shop-item-special') as HTMLTextAreaElement | null;
    const noteInput = $('shop-item-note') as HTMLTextAreaElement | null;

    if (editIdInput) editIdInput.value = '';
    if (availInput) availInput.checked = true;
    if (qtyInput) qtyInput.value = '1';
    if (unlimitedInput) {
        unlimitedInput.checked = false;
        toggleShopItemUnlimited();
    }
    if (catInput) catInput.value = 'weapon';
    if (nameInput) nameInput.value = '';
    if (typeInput) typeInput.value = '';
    if (damageInput) damageInput.value = '';
    if (propsInput) propsInput.value = '';
    if (masteryInput) masteryInput.value = '';
    if (acInput) acInput.value = '';
    if (strInput) strInput.value = '';
    if (stealthInput) stealthInput.value = '';
    if (descInput) descInput.value = '';
    if (effectInput) effectInput.value = '';
    if (weightInput) weightInput.value = '';
    if (costInput) costInput.value = '';
    if (specialInput) specialInput.value = '';
    if (noteInput) noteInput.value = '';
}

export function updateShopItemFields(): void {
    const catInput = $('shop-item-category') as HTMLSelectElement | null;
    const category = catInput?.value || 'misc';

    document.querySelectorAll('.shop-item-fields').forEach(el => (el as HTMLElement).style.display = 'none');

    if (category === 'weapon') {
        const weaponFields = $('shop-item-weapon-fields');
        if (weaponFields) weaponFields.style.display = '';
    } else if (category === 'armor') {
        const armorFields = $('shop-item-armor-fields');
        if (armorFields) armorFields.style.display = '';
    } else {
        const generalFields = $('shop-item-general-fields');
        if (generalFields) generalFields.style.display = '';
    }
}

export function toggleShopItemUnlimited(): void {
    const unlimitedCheckbox = $('shop-item-unlimited') as HTMLInputElement | null;
    const quantityInput = $('shop-item-quantity') as HTMLInputElement | null;

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
            if (!quantityInput.value) quantityInput.value = '1';
        }
    }
}

export function saveShopItem(): void {
    const D = (window as any).D;

    const nameInput = $('shop-item-name') as HTMLInputElement | null;
    const name = nameInput?.value.trim() || '';
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }

    const shopIdInput = $('edit-shop-item-shop-id') as HTMLInputElement | null;
    const shopId = parseInt(shopIdInput?.value || '0');
    const shop = (D.shops || []).find((s: any) => s.id === shopId);
    if (!shop) {
        showToast('Shop nicht gefunden', 'error');
        return;
    }

    if (!shop.items) shop.items = [];

    const catInput = $('shop-item-category') as HTMLSelectElement | null;
    const unlimitedInput = $('shop-item-unlimited') as HTMLInputElement | null;
    const availInput = $('shop-item-available') as HTMLInputElement | null;
    const qtyInput = $('shop-item-quantity') as HTMLInputElement | null;
    const typeInput = $('shop-item-type') as HTMLInputElement | null;
    const weightInput = $('shop-item-weight') as HTMLInputElement | null;
    const costInput = $('shop-item-cost') as HTMLInputElement | null;
    const specialInput = $('shop-item-special') as HTMLTextAreaElement | null;
    const noteInput = $('shop-item-note') as HTMLTextAreaElement | null;
    const damageInput = $('shop-item-damage') as HTMLInputElement | null;
    const propsInput = $('shop-item-properties') as HTMLInputElement | null;
    const masteryInput = $('shop-item-mastery') as HTMLInputElement | null;
    const acInput = $('shop-item-ac') as HTMLInputElement | null;
    const strInput = $('shop-item-strength') as HTMLInputElement | null;
    const stealthInput = $('shop-item-stealth') as HTMLSelectElement | null;
    const descInput = $('shop-item-desc') as HTMLTextAreaElement | null;
    const effectInput = $('shop-item-effect') as HTMLInputElement | null;

    const category = catInput?.value || 'misc';
    const isUnlimited = unlimitedInput?.checked || false;
    const item: any = {
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
    } else if (category === 'armor') {
        item.ac = acInput?.value.trim() || '';
        item.strength = strInput?.value.trim() || '';
        item.stealth = stealthInput?.value || '';
    } else {
        item.description = descInput?.value.trim() || '';
        item.effect = effectInput?.value.trim() || '';
    }

    const editIdInput = $('edit-shop-item-id') as HTMLInputElement | null;
    const editIdx = editIdInput?.value || '';
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

export function editShopItem(shopId: number, idx: number): void {
    showShopItemModal(shopId, idx);
}

export function deleteShopItem(shopId: number, idx: number): void {
    const D = (window as any).D;
    if (confirm('Artikel löschen?')) {
        pushUndo('Shop-Artikel gelöscht');
        const shop = (D.shops || []).find((s: any) => s.id === shopId);
        if (shop && shop.items) {
            shop.items.splice(idx, 1);
            renderShops();
            save();
            showToast('Artikel gelöscht');
        }
    }
}

export function toggleShopItemAvailability(shopIdOrElement: number | HTMLInputElement, idx?: number): void {
    const D = (window as any).D;
    let shopId: number;
    let itemIdx: number;

    if (typeof shopIdOrElement === 'object' && shopIdOrElement.tagName) {
        shopId = parseInt(shopIdOrElement.dataset.shopId || '0', 10);
        itemIdx = parseInt(shopIdOrElement.dataset.itemIdx || '0', 10);
    } else {
        shopId = shopIdOrElement as number;
        itemIdx = idx ?? 0;
    }

    const shop = (D.shops || []).find((s: any) => s.id === shopId);
    if (shop && shop.items && shop.items[itemIdx]) {
        shop.items[itemIdx].available = !shop.items[itemIdx].available;
        renderShops();
        save();
    }
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).SHOP_TYPES = SHOP_TYPES;
(window as any).SHOP_ITEM_CATEGORIES = SHOP_ITEM_CATEGORIES;
(window as any).addToCart = addToCart;
(window as any).removeFromCart = removeFromCart;
(window as any).updateCartQty = updateCartQty;
(window as any).updateCartQtyFromInput = updateCartQtyFromInput;
(window as any).clearCart = clearCart;
(window as any).showCartModal = showCartModal;
(window as any).checkoutCart = checkoutCart;
(window as any).confirmCheckout = confirmCheckout;
(window as any).copyReceipt = copyReceipt;
(window as any).renderShops = renderShops;
(window as any).toggleShopItem = toggleShopItem;
(window as any).toggleShop = toggleShop;
(window as any).expandAllShops = expandAllShops;
(window as any).collapseAllShops = collapseAllShops;
(window as any).showShopModal = showShopModal;
(window as any).saveShop = saveShop;
(window as any).editShop = editShop;
(window as any).deleteShop = deleteShop;
(window as any).showShopItemModal = showShopItemModal;
(window as any).updateShopItemFields = updateShopItemFields;
(window as any).toggleShopItemUnlimited = toggleShopItemUnlimited;
(window as any).saveShopItem = saveShopItem;
(window as any).editShopItem = editShopItem;
(window as any).deleteShopItem = deleteShopItem;
(window as any).toggleShopItemAvailability = toggleShopItemAvailability;
