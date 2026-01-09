interface ShopType {
    icon: string;
    name: string;
}
interface ShopItemCategory {
    icon: string;
    name: string;
    color: string;
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
declare const SHOP_TYPES: Readonly<Record<string, ShopType>>;
declare const SHOP_ITEM_CATEGORIES: Readonly<Record<string, ShopItemCategory>>;
declare const expandedShops: Set<number>;
declare const expandedShopItems: Set<string>;
declare let shopCart: CartItem[];
declare function parseCurrency(costStr: string): number;
declare function formatCurrency(copperAmount: number, format?: 'optimal' | 'gold' | 'copper'): string;
declare function updateCartQty(idx: number, newQty: number): void;
declare function updateCartQtyFromInput(input: HTMLInputElement): void;
declare function clearCart(): void;
declare function updateCartBadge(): void;
declare function getCartTotal(): number;
declare function showCartModal(): void;
declare function renderCartModal(): void;
declare function checkoutCart(): void;
declare function confirmCheckout(): void;
declare function copyReceipt(): void;
declare function renderShopItems(shopId: number, items: any[]): string;
declare function toggleShopItem(shopId: number, idx: number): void;
declare function expandAllShops(): void;
declare function collapseAllShops(): void;
declare function showShopModal(id?: number | null): void;
declare function clearShopForm(): void;
declare function saveShop(): void;
declare function showShopItemModal(shopId: number, itemIdx?: number | null): void;
declare function clearShopItemForm(): void;
declare function updateShopItemFields(): void;
declare function toggleShopItemUnlimited(): void;
declare function saveShopItem(): void;
declare function editShopItem(shopId: number, idx: number): void;
declare function deleteShopItem(shopId: number, idx: number): void;
declare function toggleShopItemAvailability(shopIdOrElement: number | HTMLInputElement, idx?: number): void;
//# sourceMappingURL=shops-core.d.ts.map