// [SECTION:SHOP_EXPORT]
// Shop Handout Export - HTML-Export mit Print CSS
// Zeilen: ~350
// ============================================================
// SHOP HANDOUT EXPORT
// ============================================================

// Import required functions from global scope
var D = window.D;
var esc = window.esc;
var showModal = window.showModal;
var hideModal = window.hideModal;
var showToast = window.showToast;
var parseCurrency = window.parseCurrency;
var formatCurrency = window.formatCurrency;

/**
 * Zeigt das Modal für Export-Optionen
 * @param {number} shopId - ID des zu exportierenden Shops
 */
function showShopHandoutModal(shopId) {
    if (!D.shops) {
        showToast('⚠️ Keine Shops vorhanden', 'warning');
        return;
    }

    const shop = D.shops.find(s => s.id === shopId);
    if (!shop) {
        showToast('⚠️ Shop nicht gefunden', 'error');
        return;
    }

    // Shop-Name im Modal anzeigen
    const shopNameEl = document.getElementById('shop-handout-shop-name');
    if (shopNameEl) {
        shopNameEl.textContent = `Shop: ${shop.name}`;
    }

    // Shop-ID im Generate-Button speichern
    const generateBtn = document.querySelector('[data-action="generate-shop-handout"]');
    if (generateBtn) {
        generateBtn.dataset.id = String(shopId);
    }

    // Modal öffnen
    showModal('shop-handout-modal');
}

/**
 * Sammelt Optionen und generiert das Handout
 * @param {number|string} shopId - ID des Shops
 */
function generateShopHandout(shopId) {
    const parsedId = typeof shopId === 'string' ? parseInt(shopId) : shopId;

    if (!D.shops) {
        showToast('⚠️ Keine Shops vorhanden', 'warning');
        return;
    }

    const shop = D.shops.find(s => s.id === parsedId);
    if (!shop) {
        showToast('⚠️ Shop nicht gefunden', 'error');
        return;
    }

    // Optionen aus Checkboxen sammeln
    const options = {
        showPrices: document.getElementById('handout-show-prices')?.checked ?? true,
        showDescriptions: document.getElementById('handout-show-descriptions')?.checked ?? true,
        showAvailability: document.getElementById('handout-show-availability')?.checked ?? false,
        groupByCategory: document.getElementById('handout-group-by-category')?.checked ?? false,
        playerMode: document.getElementById('handout-player-mode')?.checked ?? true
    };

    // HTML generieren
    const html = buildHandoutHTML(shop, options);

    // Download auslösen
    const filename = `${shop.name.replace(/[^a-z0-9]/gi, '_')}_Handout.html`;
    downloadHandoutAsHTML(filename, html);

    // Modal schließen
    hideModal('shop-handout-modal');

    showToast(`📋 ${shop.name} Handout erstellt`);
}

/**
 * Erstellt das komplette HTML-Dokument für das Handout
 * @param {Object} shop - Shop-Objekt
 * @param {Object} options - Export-Optionen
 * @returns {string} - Vollständiges HTML-Dokument
 */
function buildHandoutHTML(shop, options) {
    const type = SHOP_TYPES[shop.type] || SHOP_TYPES.unbekannt;
    const npc = shop.npcId ? EntityLookup.npc(shop.npcId) : null;
    const location = shop.locationId ? EntityLookup.location(shop.locationId) : null;

    const items = shop.items || [];
    const availableItems = items.filter(item => item.available !== false);
    const itemsToShow = options.showAvailability ? items : availableItems;

    // Header-Informationen
    const shopHeader = `
        <header>
            <h1>${type.icon} ${esc(shop.name)}</h1>
            <div class="shop-meta">
                <p class="shop-type"><strong>Typ:</strong> ${type.name}</p>
                ${npc ? `<p class="shop-owner">👤 <strong>Besitzer:</strong> ${esc(npc.name)}</p>` : ''}
                ${location ? `<p class="shop-location">📍 <strong>Ort:</strong> ${esc(location.name)}</p>` : ''}
            </div>
            ${shop.description ? `<p class="shop-description">${esc(shop.description)}</p>` : ''}
            ${shop.special && !options.playerMode ? `<p class="shop-special">✨ ${esc(shop.special)}</p>` : ''}
        </header>
    `;

    // Items gruppieren wenn gewünscht
    let itemsHTML = '';

    if (itemsToShow.length === 0) {
        itemsHTML = '<div class="empty-shop"><p>Dieser Shop hat derzeit keine verfügbaren Waren.</p></div>';
    } else if (options.groupByCategory) {
        // Nach Kategorie gruppieren
        const byCategory = {};
        itemsToShow.forEach(item => {
            const cat = item.category || 'misc';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(item);
        });

        itemsHTML = Object.entries(byCategory)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([catKey, catItems]) => {
                const catInfo = SHOP_ITEM_CATEGORIES[catKey] || SHOP_ITEM_CATEGORIES.misc;
                return `
                    <div class="category-group">
                        <h3 class="category-title">${catInfo.icon} ${catInfo.name}</h3>
                        <div class="items-list">
                            ${catItems.map(item => renderHandoutItem(item, options)).join('')}
                        </div>
                    </div>
                `;
            }).join('');
    } else {
        // Keine Gruppierung, alle Items direkt
        itemsHTML = `
            <div class="items-list">
                ${itemsToShow.map(item => renderHandoutItem(item, options)).join('')}
            </div>
        `;
    }

    // Vollständiges HTML-Dokument
    return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(shop.name)} - Handout</title>
    <sty` + `le>${getHandoutCSS()}</sty` + `le>
</he` + `ad>
<body>
    <div class="handout-container">
        ${shopHeader}

        <main>
            <h2>Verfügbare Waren (${itemsToShow.length} Artikel)</h2>
            ${itemsHTML}
        </main>

        <footer>
            <p>Generiert am ${new Date().toLocaleDateString('de-DE')}</p>
            <p class="print-tip">💡 <strong>Drucktipp:</strong> Verwende <kbd>Strg+P</kbd> (Windows) oder <kbd>⌘+P</kbd> (Mac) zum Drucken</p>
        </footer>
    </div>
</body>
</html>`;
}

/**
 * Rendert einen einzelnen Shop-Artikel
 * @param {Object} item - Shop-Item-Objekt
 * @param {Object} options - Export-Optionen
 * @returns {string} - HTML für Item
 */
function renderHandoutItem(item, options) {
    const cat = SHOP_ITEM_CATEGORIES[item.category] || SHOP_ITEM_CATEGORIES.misc;
    const isAvailable = item.available !== false;

    // Item-Header
    let itemHTML = `
        <div class="handout-item ${isAvailable ? '' : 'unavailable'}">
            <div class="item-header">
                <span class="item-icon">${cat.icon}</span>
                <span class="item-name">${esc(item.name || 'Unbenannt')}</span>
    `;

    if (options.showPrices && item.cost) {
        itemHTML += `<span class="item-price">${esc(item.cost)}</span>`;
    }

    itemHTML += `</div>`;

    // Details basierend auf Kategorie
    const details = [];

    if (item.category === 'weapon') {
        if (item.type) details.push(`Typ: ${esc(item.type)}`);
        if (item.damage) details.push(`Schaden: ${esc(item.damage)}`);
        if (item.properties) details.push(`Eigenschaften: ${esc(item.properties)}`);
        if (item.mastery) details.push(`Meisterung: ${esc(item.mastery)}`);
        if (item.weight) details.push(`Gewicht: ${esc(item.weight)}`);
    } else if (item.category === 'armor') {
        if (item.type) details.push(`Typ: ${esc(item.type)}`);
        if (item.ac) details.push(`RK: ${esc(item.ac)}`);
        if (item.strength) details.push(`STR: ${esc(item.strength)}`);
        if (item.stealth === 'disadvantage') details.push(`Heiml.: <span style="color: #ef4444;">Nachteil</span>`);
        if (item.weight) details.push(`Gewicht: ${esc(item.weight)}`);
    } else {
        if (item.type) details.push(`Typ: ${esc(item.type)}`);
        if (item.effect) details.push(`Wirkung: ${esc(item.effect)}`);
        if (item.weight) details.push(`Gewicht: ${esc(item.weight)}`);
    }

    if (details.length > 0) {
        itemHTML += `<div class="item-details">${details.join(' • ')}</div>`;
    }

    // Beschreibung (optional)
    if (options.showDescriptions && item.description) {
        itemHTML += `<div class="item-description">${esc(item.description)}</div>`;
    }

    // Verfügbarkeit (optional)
    if (options.showAvailability) {
        const qtyText = item.unlimited ? '∞' : (item.quantity || 1);
        const availText = isAvailable ? `Verfügbar (${qtyText}×)` : 'Nicht verfügbar';
        itemHTML += `<div class="item-availability ${isAvailable ? 'available' : 'unavailable'}">${availText}</div>`;
    }

    // Special/Note (nur im DM-Modus)
    if (!options.playerMode) {
        if (item.special) {
            itemHTML += `<div class="item-special">✨ ${esc(item.special)}</div>`;
        }
        if (item.note) {
            itemHTML += `<div class="item-note">📝 DM-Notiz: ${esc(item.note)}</div>`;
        }
    }

    itemHTML += `</div>`;
    return itemHTML;
}

/**
 * Liefert das CSS für das Handout (Screen + Print)
 * @returns {string} - CSS-Code
 */
function getHandoutCSS() {
    return `
        /* Screen Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            color: #1a1a1a;
            line-height: 1.6;
            padding: 20px;
        }

        .handout-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-radius: 8px;
        }

        header {
            border-bottom: 3px solid #d4af37;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        h1 {
            font-size: 2.5em;
            color: #1a1a1a;
            margin-bottom: 10px;
        }

        h2 {
            font-size: 1.8em;
            color: #333;
            margin: 30px 0 20px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
        }

        h3.category-title {
            font-size: 1.4em;
            color: #555;
            margin: 25px 0 15px;
            padding-left: 10px;
            border-left: 4px solid #d4af37;
        }

        .shop-meta {
            margin: 15px 0;
            color: #555;
        }

        .shop-meta p {
            margin: 5px 0;
        }

        .shop-description {
            margin-top: 15px;
            padding: 15px;
            background: #f9f9f9;
            border-left: 4px solid #d4af37;
            font-style: italic;
        }

        .shop-special {
            margin-top: 10px;
            padding: 10px;
            background: #fff8dc;
            border: 1px solid #d4af37;
            border-radius: 4px;
        }

        .category-group {
            margin-bottom: 30px;
        }

        .items-list {
            display: grid;
            gap: 15px;
        }

        .handout-item {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 6px;
            background: #fafafa;
            page-break-inside: avoid;
        }

        .handout-item.unavailable {
            opacity: 0.6;
            background: #f0f0f0;
        }

        .item-header {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .item-icon {
            font-size: 1.3em;
        }

        .item-name {
            flex: 1;
            font-size: 1.1em;
            color: #1a1a1a;
        }

        .item-price {
            color: #d4af37;
            font-size: 1.1em;
        }

        .item-details {
            color: #555;
            font-size: 0.95em;
            margin: 5px 0;
            padding-left: 35px;
        }

        .item-description {
            margin-top: 8px;
            padding: 10px;
            background: white;
            border-left: 3px solid #d4af37;
            font-size: 0.95em;
            color: #333;
        }

        .item-availability {
            margin-top: 8px;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 0.9em;
            display: inline-block;
        }

        .item-availability.available {
            background: #d4edda;
            color: #155724;
        }

        .item-availability.unavailable {
            background: #f8d7da;
            color: #721c24;
        }

        .item-special {
            margin-top: 8px;
            padding: 8px;
            background: #fff8dc;
            border-left: 3px solid #fbbf24;
            font-size: 0.9em;
        }

        .item-note {
            margin-top: 8px;
            padding: 8px;
            background: #e8f4f8;
            border-left: 3px solid #7ec4cf;
            font-size: 0.9em;
            font-style: italic;
        }

        .empty-shop {
            text-align: center;
            padding: 40px;
            color: #888;
            font-style: italic;
        }

        footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #888;
            font-size: 0.9em;
        }

        .print-tip {
            margin-top: 10px;
        }

        kbd {
            background: #333;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        }

        /* Print Styles */
        @media print {
            @page {
                margin: 2cm;
                size: A4;
            }

            body {
                background: white;
                padding: 0;
            }

            .handout-container {
                box-shadow: none;
                padding: 0;
                max-width: 100%;
            }

            header {
                border-bottom-color: #000;
            }

            h1 {
                font-size: 24pt;
            }

            h2 {
                font-size: 18pt;
                border-bottom-color: #000;
            }

            h3.category-title {
                font-size: 14pt;
                border-left-color: #000;
            }

            .handout-item {
                border-color: #000;
                background: white;
                page-break-inside: avoid;
            }

            .item-header {
                font-size: 12pt;
            }

            .item-details {
                font-size: 10pt;
            }

            .shop-description,
            .item-description,
            .item-special,
            .item-note {
                border-left-color: #000;
            }

            footer {
                border-top-color: #000;
            }

            .print-tip {
                display: none;
            }
        }
    `;
}

/**
 * Löst den Download einer HTML-Datei aus
 * @param {string} filename - Name der Datei
 * @param {string} html - HTML-Inhalt
 */
function downloadHandoutAsHTML(filename, html) {
    // Feature-Detection
    if (typeof Blob === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
        showToast('⚠️ Browser unterstützt keinen Download', 'error');
        return;
    }

    try {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    } catch (error) {
        console.error('Download-Fehler:', error);
        showToast('❌ Download fehlgeschlagen', 'error');
    }
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.showShopHandoutModal = showShopHandoutModal;
window.generateShopHandout = generateShopHandout;
