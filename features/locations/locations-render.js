// [SECTION:LOCATIONS_RENDER]
// ============================================================
// LOCATIONS RENDER - @master-detail @filter @orte
// ============================================================
// State
let selectedLocationId = null;
// Location type icons
const LOC_ICONS = {
    stadt: '🏰',
    dorf: '🏘️',
    taverne: '🍺',
    wald: '🌲',
    dungeon: '🕳️',
    tempel: '⛪',
    turm: '🗼',
    hoehle: '🕯️',
    ruine: '🏚️',
    hafen: '⚓',
    markt: '🛒',
    schloss: '🏯',
    default: '📍'
};
/**
 * Ein Filter aus D.filters in der Form, in der die Ortsansicht ihn ausgibt —
 * Vertrag SENKEN R1/R2 (docs/bugfixes.md). `color` landet in Klasse und
 * Inline-Stil und ist nur eine Farbe aus TAG_COLORS (deckt die acht Optionen
 * des Filterdialogs), sonst 'blue', die erste Option des Dialogs; ein fremder
 * Wert faellt damit nicht mehr auf die tote Flaeche zurueck, die der Kommentar
 * an renderLocationItem() beschreibt. `id` bleibt eine Zahl (Vergleich mit
 * currentLocFilter), `nameHtml` ist fertig kodiert. Bewusst kein Spread des
 * Datenobjekts: jedes Feld ist einzeln geprueft.
 */
function filterFuerAusgabe(f) {
    if (!f) return null;
    return {
        id: Number(f.id),
        nameHtml: esc(f.name),
        color: sichereKlasse(f.color, TAG_COLORS, 'blue')
    };
}
function getLocationIcon(loc) {
    // Try to detect type from name or description
    const text = ((loc.name || '') + ' ' + (loc.description || '')).toLowerCase();
    if (text.includes('tavern') || text.includes('gasth') || text.includes('schenke'))
        return LOC_ICONS.taverne;
    if (text.includes('wald') || text.includes('forest')) return LOC_ICONS.wald;
    if (text.includes('dungeon') || text.includes('verlies')) return LOC_ICONS.dungeon;
    if (text.includes('tempel') || text.includes('kirche') || text.includes('schrein'))
        return LOC_ICONS.tempel;
    if (text.includes('turm') || text.includes('tower')) return LOC_ICONS.turm;
    if (text.includes('höhle') || text.includes('hoehle') || text.includes('cave'))
        return LOC_ICONS.hoehle;
    if (text.includes('ruine') || text.includes('ruin')) return LOC_ICONS.ruine;
    if (text.includes('hafen') || text.includes('dock') || text.includes('port'))
        return LOC_ICONS.hafen;
    if (text.includes('markt') || text.includes('market') || text.includes('basar'))
        return LOC_ICONS.markt;
    if (text.includes('schloss') || text.includes('burg') || text.includes('castle'))
        return LOC_ICONS.schloss;
    if (text.includes('dorf') || text.includes('village')) return LOC_ICONS.dorf;
    if (text.includes('stadt') || text.includes('city')) return LOC_ICONS.stadt;
    return LOC_ICONS.default;
}
function renderLocations() {
    const D = window.D;
    const currentLocFilter = window.currentLocFilter || 'all';
    const stripHtml = window.stripHtml;
    const listContainer = $('locations-list');
    const filterContainer = $('location-filters');
    if (!listContainer) return;
    // Update counter
    setViewCount('locations', D.locations?.length || 0);
    // Render filter chips
    // Schritt 13 (Design-Handoff v3, Welle 1): Der Chip im Ruhezustand liegt
    // auf --bg-elevated, beim Ueberfahren auf --bg-hover — beides neutrale
    // Theme-Flaechen. Dort gilt die Regel von Schritt 9: als TEXTfarbe
    // gehoert --<rolle>-text hin, nicht die Rolle selbst (gemessen min 4,51
    // statt 2,16-4,20). Der RAHMEN behaelt die Rolle: er darf kraeftig
    // bleiben, fuer ihn gilt 3:1, nicht 4,5:1.
    // Der aktive Chip setzt gar keinen Inline-Stil; er faerbt sich aus
    // core.css .loc-filter-chip.active (--gold / --on-gold).
    // Bewacht von R-09 in tests/unit/design-consistency.test.js.
    if (filterContainer) {
        filterContainer.innerHTML = `
            <div class="loc-filter-chip ${currentLocFilter === 'all' ? 'active' : ''}" data-action="set-loc-filter" data-value="all">Alle</div>
            ${D.filters
                .map(filterFuerAusgabe)
                .map(
                    f => `
                <div class="loc-filter-chip ${currentLocFilter === f.id ? 'active' : ''}"
                     data-action="set-loc-filter" data-id="${f.id}"
                     style="${currentLocFilter === f.id ? '' : `border-color: var(--${f.color}); color: var(--${f.color}-text)`}">
                    ${f.nameHtml}
                </div>
            `
                )
                .join('')}
        `;
    }
    // Get search and filter — der Begriff einmal beim Lesen getrimmt (Vertrag NPC-SUCHE, R6):
    // Leerzustand, NPC-Orte und applyFilters() sehen denselben Begriff.
    const searchEl = $('loc-search');
    const search = (searchEl?.value || '').trim().toLowerCase();
    // Pre-compute NPC locations that match search (if searching). Der NPC-Name total gelesen
    // (datenText(), Vertrag NPC-NAME N2): `n.name.toLowerCase()` warf je Taste, wenn ein Name
    // fehlte oder eine Zahl war, und die Suche filterte nichts mehr.
    const npcLocs = search
        ? new Set(
              D.npcs
                  .filter(n => datenText(n.name).toLowerCase().includes(search))
                  .map(n => n.locationId)
          )
        : null;
    // Apply filters (single pass). Ein Ort mit einem passenden NPC ist ein ODER-Zweig der Suche
    // (searchAlso, Vertrag NPC-SUCHE R5) — als customFilter tat er seit 73d3193b nichts. Gefragt
    // wird er nur bei nicht leerem Begriff, dann steht npcLocs; ein Eintrag, der kein Ort ist,
    // faellt wie bisher heraus.
    const locs = applyFilters(D.locations || [], {
        searchText: search,
        searchFields: ['name', 'description'],
        searchAlso: l => !!l && npcLocs.has(l.id),
        filters: {
            filterId: currentLocFilter !== 'all' ? currentLocFilter : null
        }
    });
    // Empty state
    if (!locs.length) {
        listContainer.innerHTML = `
            <div class="loc-empty-state">
                <div class="loc-empty-icon">🏠</div>
                <div class="loc-empty-title">${search || currentLocFilter !== 'all' ? 'Keine Treffer' : 'Keine Orte'}</div>
                <div class="loc-empty-desc">${search || currentLocFilter !== 'all' ? 'Versuche andere Suchbegriffe' : 'Erstelle deinen ersten Ort'}</div>
                ${
                    !search && currentLocFilter === 'all'
                        ? `
                    <button class="loc-add-btn" data-action="show-new-location-modal" style="margin-top: 12px;">
                        + Ort erstellen
                    </button>
                `
                        : ''
                }
            </div>
        `;
        clearLocationDetail();
        return;
    }
    // Render list items
    listContainer.innerHTML = locs.map(loc => renderLocationItem(loc, stripHtml)).join('');
    // Auto-select first if none selected
    if (!selectedLocationId || !locs.find(l => l.id === selectedLocationId)) {
        selectLocation(locs[0].id, false);
    } else {
        // Re-render detail for current selection
        showLocationDetail(selectedLocationId);
    }
}
function renderLocationItem(loc, stripHtml) {
    const D = window.D;
    const npcs = D.npcs.filter(n => n.locationId === loc.id);
    const filter = filterFuerAusgabe(EntityLookup.filter(loc.filterId));
    const icon = getLocationIcon(loc);
    const isSelected = loc.id === selectedLocationId;
    const descPreview = loc.description ? stripHtml(loc.description).substring(0, 60) : '';
    // NPC avatars (max 4)
    const npcAvatars = npcs
        .slice(0, 4)
        .map(
            n => `
        <div class="loc-mini-avatar" title="${esc(n.name)}">
            ${sichereBildquelle(n.avatar) ? `<img src="${esc(n.avatar)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : '👤'}
        </div>
    `
        )
        .join('');
    const moreNpcs =
        npcs.length > 4 ? `<div class="loc-mini-avatar more">+${npcs.length - 4}</div>` : '';
    // Schritt 13 (Design-Handoff v3, Welle 1), Entscheidung D-7: Der
    // Aufkleber traegt eine VOLLE Akzentflaeche, also gehoert seine Tinte
    // --on-<rolle> hierher. Bis dahin stand sie als `color: var(--bg-dark)`
    // in core.css .loc-item-tag — gegen einen Inline-Stil gewinnt das nie,
    // die Zeile war toter Code und ist entfernt. Gemessen: vorher min 2,51
    // (--cyan in Sepia), jetzt min 4,55 ueber alle acht Rollen und vier
    // Themes.
    // DER RUECKFALLWERT IST KEIN SCHMUCK. Steht in den Kampagnendaten ein
    // Farbwert ausserhalb der acht Optionen des Filterdialogs — aus einer
    // aelteren Fassung oder einem von Hand bearbeiteten Export —, dann ist
    // `var(--xyz)` ungueltig; die background-Deklaration faellt dann
    // VOLLSTAENDIG aus und der Aufkleber liegt ohne eigene Flaeche auf der
    // Karte. Die Tinte muss also auf der KARTE lesbar sein. var(--text)
    // traegt dort 8,78-21,00 in allen vier Themes; das im Rezept
    // vorgeschlagene var(--on-gold) traegt 1,08 / 18,88 / 1,08 / 1,00 und
    // waere in drei von vier Themes unsichtbar gewesen. R-09 rechnet das
    // bei jedem Lauf nach.
    return `
        <div class="loc-item ${isSelected ? 'selected' : ''}" data-action="select-location" data-id="${esc(loc.id)}">
            <div class="loc-item-icon">${icon}</div>
            <div class="loc-item-info">
                <div class="loc-item-name">
                    ${filter ? `<span class="loc-item-tag" style="background: var(--${filter.color}); color: var(--on-${filter.color}, var(--text))">${filter.nameHtml}</span>` : ''}${esc(loc.name)}
                </div>
                <div class="loc-item-meta">
                    ${descPreview ? esc(descPreview + (loc.description && stripHtml(loc.description).length > 60 ? '...' : '')) : 'Keine Beschreibung'}
                    ${npcs.length ? ` • ${Number(npcs.length)} NPC${npcs.length > 1 ? 's' : ''}` : ''}
                </div>
            </div>
            ${npcs.length ? `<div class="loc-item-npcs">${npcAvatars}${moreNpcs}</div>` : ''}
        </div>
    `;
}
function selectLocation(id, scroll = true) {
    selectedLocationId = typeof id === 'string' ? parseInt(id) : id;
    // Update selection in list
    document.querySelectorAll('.loc-item').forEach(el => {
        const element = el;
        element.classList.toggle('selected', element.dataset.id === String(selectedLocationId));
    });
    // Show detail
    showLocationDetail(selectedLocationId);
    // Scroll into view if needed
    if (scroll) {
        const item = document.querySelector(`.loc-item[data-id="${selectedLocationId}"]`);
        if (item) {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}
function showLocationDetail(id) {
    const D = window.D;
    const LINK_ICONS = window.LINK_ICONS;
    const panel = $('loc-detail-panel');
    if (!panel) return;
    const loc = EntityLookup.location(id);
    if (!loc) {
        clearLocationDetail();
        return;
    }
    const npcs = D.npcs.filter(n => n.locationId === loc.id);
    const filter = filterFuerAusgabe(EntityLookup.filter(loc.filterId));
    const icon = getLocationIcon(loc);
    const tags = loc.tags || [];
    const links = loc.links || [];
    // Build NPC list
    const npcListHtml = npcs.length
        ? npcs
              .map(
                  n => `
        <div class="loc-npc-item" data-action="show-npc-popup" data-id="${esc(n.id)}">
            <div class="loc-npc-avatar">
                ${sichereBildquelle(n.avatar) ? `<img src="${esc(n.avatar)}">` : '👤'}
            </div>
            <div class="loc-npc-name">${esc(n.name)}</div>
            <div class="loc-npc-role">${esc(n.role || n.race || '—')}</div>
        </div>
    `
              )
              .join('')
        : '<div style="color: var(--text-dim); font-size: var(--text-sm);">Keine NPCs an diesem Ort</div>';
    // Build links - EntityLookup methods are singular (location, npc, etc.)
    const lookupMap = {
        locations: 'location',
        npcs: 'npc',
        characters: 'character',
        quests: 'quest',
        encounters: 'encounter',
        spells: 'spell',
        loot: 'lootItem',
        wiki: 'wiki'
    };
    const linksHtml = links.length
        ? links
              .map(link => {
                  const lookupFn = lookupMap[link.type];
                  const target =
                      lookupFn && EntityLookup[lookupFn] ? EntityLookup[lookupFn](link.id) : null;
                  if (!target) return '';
                  // NPC-Links als Chips mit show-npc-popup für Konsistenz
                  if (link.type === 'npcs') {
                      return `<span class="loc-npc-chip" data-action="show-npc-popup" data-id="${esc(link.id)}">${sichereBildquelle(target.avatar) ? `<img src="${esc(target.avatar)}" class="loc-npc-chip-avatar">` : ''}${esc(target.name)}</span>`;
                  }
                  // Alle anderen Links normal (LINK_ICONS aus core/constants.js)
                  return `<span class="loc-link" data-action="navigate-entity" data-type="${esc(link.type)}" data-id="${esc(link.id)}">${LINK_ICONS[link.type] || '🔗'} ${esc(target.name || target.title)}</span>`;
              })
              .filter(Boolean)
              .join('')
        : '';
    // Build tags - Objekte mit {name, color} oder Text, gelesen ueber tagText() (systems/tags.js)
    const tagsHtml = tags.length
        ? tags
              .map(
                  t =>
                      `<span class="loc-tag tag-${sichereKlasse(t.color, TAG_COLORS, 'blue')}">${esc(tagText(t))}</span>`
              )
              .join('')
        : '';
    // Schritt 13 (Design-Handoff v3, Welle 1): Der Filtername in der
    // Detailkopfzeile steht in derselben Schachtel wie .loc-detail-name,
    // deren Traegerflaeche Schritt 9 als neutral GEMESSEN hat (sie steht
    // seitdem auf --gold-text). Also dieselbe Regel: --<rolle>-text statt
    // der Rolle. Gemessen min 4,98 auf --bg-dark statt 2,51-4,74.
    panel.innerHTML = `
        <div class="loc-detail-content">
            <div class="loc-detail-header">
                <div class="loc-detail-icon">${icon}</div>
                <div class="loc-detail-title">
                    <div class="loc-detail-name">${esc(loc.name)}</div>
                    <div class="loc-detail-region">
                        ${filter ? `<span style="color: var(--${filter.color}-text)">● ${filter.nameHtml}</span>` : '📍 Ort'}
                    </div>
                </div>
                <div class="loc-detail-actions">
                    <button class="loc-detail-btn" data-action="show-entity-links-modal" data-type="locations" data-id="${esc(loc.id)}" title="Verknüpfungen">🔗</button>
                    <button class="loc-detail-btn" data-action="show-tags-modal" data-type="locations" data-id="${esc(loc.id)}" title="Tags">🏷️</button>
                    <button class="loc-detail-btn" data-action="edit-location" data-id="${esc(loc.id)}" title="Bearbeiten">✏️</button>
                    <button class="loc-detail-btn danger" data-action="delete-location" data-id="${esc(loc.id)}" title="Löschen">🗑️</button>
                </div>
            </div>

            ${
                tagsHtml || linksHtml || npcs.length
                    ? `
                <div class="loc-info-bar">
                    ${tagsHtml ? `<div class="loc-tags">${tagsHtml}</div>` : ''}
                    ${linksHtml ? `<div class="loc-links">${linksHtml}</div>` : ''}
                    ${
                        npcs.length
                            ? `<div class="loc-npcs-inline">
                        <span style="color: var(--text-dim); font-size: var(--text-sm);">👥 NPCs:</span>
                        ${npcs
                            .slice(0, 5)
                            .map(
                                n =>
                                    `<span class="loc-npc-chip" data-action="show-npc-popup" data-id="${esc(n.id)}">${sichereBildquelle(n.avatar) ? `<img src="${esc(n.avatar)}" class="loc-npc-chip-avatar">` : ''}${esc(n.name)}</span>`
                            )
                            .join('')}
                        ${npcs.length > 5 ? `<span class="loc-npc-chip more">+${npcs.length - 5}</span>` : ''}
                    </div>`
                            : ''
                    }
                </div>
            `
                    : ''
            }

            <div class="loc-section">
                <div class="loc-section-title">Beschreibung</div>
                <div class="loc-desc">
                    ${loc.description ? sanitizeHTML((window.renderMarkdownInContent || (x => x))(loc.description)) : '<span style="color: var(--text-dim);">Keine Beschreibung vorhanden</span>'}
                </div>
            </div>
        </div>
    `;
}
function clearLocationDetail() {
    const panel = $('loc-detail-panel');
    if (panel) {
        panel.innerHTML = `
            <div class="loc-detail-empty">
                <div class="loc-detail-empty-icon">🏠</div>
                <div class="loc-detail-empty-text">Wähle einen Ort aus der Liste</div>
            </div>
        `;
    }
}
function setLocFilter(f) {
    window.currentLocFilter = f;
    selectedLocationId = null; // Reset selection on filter change
    renderLocations();
}
function toggleLocation(id) {
    // For search navigation: select and show the location
    const loc = EntityLookup.location(id);
    if (!loc) return;
    // Reset filter to show all
    window.currentLocFilter = 'all';
    selectedLocationId = typeof id === 'string' ? parseInt(id) : id;
    renderLocations();
    // Highlight briefly
    setTimeout(() => {
        const item = document.querySelector(`.loc-item[data-id="${selectedLocationId}"]`);
        if (item) {
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            item.style.transition = 'box-shadow 0.3s ease';
            /* W3-D-05: Farbe aus --glow-gold statt aus volldeckendem
               var(--gold). ZWEI Lagen, weil eine (50 %) gegen die vier
               neutralen Flaechen nur 2,64 / 1,52 / 2,11 / 3,44 liest
               (dark/light/sepia/contrast) — in drei von vier Themes unter den
               3:1, die R-02 fuer nicht-Text verlangt. Zwei uebereinander
               ergeben 75 % und 4,09 / 1,91 / 3,24 / 5,79. Die Marke soll in
               zwei Sekunden zeigen, wohin gesprungen wurde; Zahlen und
               Ruecknahmeweg stehen in W3-F-01 Teil D. */
            item.style.boxShadow = '0 0 20px var(--glow-gold), 0 0 8px var(--glow-gold)';
            setTimeout(() => {
                item.style.boxShadow = '';
            }, 2000);
        }
    }, 100);
}
// ============================================================
// LEGACY FUNCTIONS - Kept for backwards compatibility
// ============================================================
function renderFilterList() {
    const D = window.D;
    const c = $('filter-list');
    if (!c) return;
    c.innerHTML = D.filters
        .map(filterFuerAusgabe)
        .map(
            f =>
                `<div class="chip color-${f.color}" style="margin:3px;">${f.nameHtml} <button data-action="delete-filter" data-id="${f.id}" style="background:none;border:none;color:inherit;cursor:pointer;">✕</button></div>`
        )
        .join('');
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.renderLocations = renderLocations;
window.selectLocation = selectLocation;
window.setLocFilter = setLocFilter;
window.toggleLocation = toggleLocation;
window.renderFilterList = renderFilterList;
