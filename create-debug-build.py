#!/usr/bin/env python3
"""
Debug-Build mit zusätzlichem Logging für Shop-Items
"""

import re

# Lade den optimierten Build
with open('/mnt/user-data/outputs/dnd-tracker-modular/dist/dnd-tracker-optimized.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Füge Logging zum toggle-shop-item Handler hinzu
old_handler = "'toggle-shop-item': () => { toggleShopItem(id, parseInt(value)); },"
new_handler = """'toggle-shop-item': () => { 
                console.log('[DEBUG] toggle-shop-item clicked', { id, value, target }); 
                toggleShopItem(id, parseInt(value)); 
            },"""

content = content.replace(old_handler, new_handler)

# Füge Logging zur toggleShopItem Funktion hinzu
old_function = """function toggleShopItem(shopId, idx) {
    const key = `${shopId}-${idx}`;
    if (expandedShopItems.has(key)) {
        expandedShopItems.delete(key);
    } else {
        expandedShopItems.add(key);
    }"""

new_function = """function toggleShopItem(shopId, idx) {
    console.log('[DEBUG] toggleShopItem called', { shopId, idx });
    const key = `${shopId}-${idx}`;
    console.log('[DEBUG] key:', key, 'has:', expandedShopItems.has(key));
    if (expandedShopItems.has(key)) {
        expandedShopItems.delete(key);
        console.log('[DEBUG] Collapsed item');
    } else {
        expandedShopItems.add(key);
        console.log('[DEBUG] Expanded item');
    }"""

content = content.replace(old_function, new_function)

# Schreibe Debug-Build
with open('/mnt/user-data/outputs/dnd-tracker-modular/dist/dnd-tracker-debug.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Debug-Build erstellt:")
print("📄 /mnt/user-data/outputs/dnd-tracker-modular/dist/dnd-tracker-debug.html")
print()
print("🔍 Öffne die Datei und:")
print("   1. Öffne Browser-Console (F12)")
print("   2. Klicke auf ein Shop-Item")
print("   3. Schaue nach [DEBUG] Meldungen")
