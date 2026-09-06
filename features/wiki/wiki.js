// [SECTION:WIKI]
// Was: features/shops/wiki.js, Now: features/wiki/wiki.js
// Wiki-System
// Zeilen: 1,316
// ============================================================
// STATE
// ============================================================
const WikiState = {
    categoryFilter: '',
    sortMode: 'recent',
    expandedEntries: new Set(),
    expandedCategories: new Set(), // All categories collapsed by default
    selectedEntryId: null,
    searchDropdownIndex: -1,
    linkSuggester: null,
    linkSuggesterIndex: -1,
    linkSuggesterState: null
};
// ============================================================
// CONSTANTS
// ============================================================
const WIKI_CATEGORIES = Object.freeze({
    campaign: { icon: '🎭', name: 'Kampagne' },
    quest: { icon: '📋', name: 'Quest' },
    character: { icon: '🧙', name: 'Charakter' },
    locations: { icon: '🏰', name: 'Orte' },
    factions: { icon: '👥', name: 'Fraktionen' },
    history: { icon: '📜', name: 'Geschichte' },
    conflicts: { icon: '⚔️', name: 'Konflikte' },
    world: { icon: '🌍', name: 'Weltkunde' },
    magic: { icon: '🔮', name: 'Magie' },
    rules: { icon: '📖', name: 'Hausregeln' },
    notes: { icon: '🗒️', name: 'Notiz' }
});
const WIKI_TEMPLATES = Object.freeze({
    location: {
        icon: '🏰',
        name: 'Ort / Stadt',
        category: 'locations',
        content: `<h3>Übersicht</h3>
<p>Kurze Beschreibung des Ortes...</p>

<h3>Geographie & Klima</h3>
<p>Lage, Umgebung, Wetter...</p>

<h3>Wichtige Orte</h3>
<ul>
<li><b>Marktplatz</b>: ...</li>
<li><b>Taverne</b>: ...</li>
</ul>

<h3>NPCs</h3>
<ul>
<li>[[NPC Name]] - Rolle</li>
</ul>

<h3>Geschichte</h3>
<p>Gründung, wichtige Ereignisse...</p>

<h3>Gerüchte & Hooks</h3>
<ul>
<li>Gerücht 1</li>
<li>Quest-Hook</li>
</ul>`
    },
    npc: {
        icon: '🧙',
        name: 'NPC',
        category: 'character',
        content: `<h3>Beschreibung</h3>
<p>Aussehen, Alter, Besonderheiten...</p>

<h3>Persönlichkeit</h3>
<p>Charakterzüge, Macken, Sprechweise...</p>

<h3>Motivation & Ziele</h3>
<p>Was treibt diesen NPC an?</p>

<h3>Geheimnisse</h3>
<p>Was verbirgt der NPC?</p>

<h3>Beziehungen</h3>
<ul>
<li>[[Person]] - Beziehung</li>
</ul>

<h3>Statistiken</h3>
<p>Relevante Spielwerte falls nötig...</p>`
    },
    faction: {
        icon: '👥',
        name: 'Fraktion',
        category: 'factions',
        content: `<h3>Übersicht</h3>
<p>Was ist diese Fraktion?</p>

<h3>Ziele</h3>
<ul>
<li>Hauptziel</li>
<li>Nebenziele</li>
</ul>

<h3>Struktur</h3>
<p>Hierarchie, Ränge...</p>

<h3>Wichtige Mitglieder</h3>
<ul>
<li>[[Anführer]] - Rolle</li>
</ul>

<h3>Ressourcen</h3>
<p>Geld, Truppen, Einfluss...</p>

<h3>Beziehungen</h3>
<ul>
<li>[[Andere Fraktion]] - Verbündet/Feindlich</li>
</ul>`
    },
    conflict: {
        icon: '⚔️',
        name: 'Konflikt',
        category: 'conflicts',
        content: `<h3>Übersicht</h3>
<p>Worum geht es in diesem Konflikt?</p>

<h3>Beteiligte Parteien</h3>
<ul>
<li>[[Partei A]] - Position</li>
<li>[[Partei B]] - Position</li>
</ul>

<h3>Auslöser</h3>
<p>Wie kam es zu diesem Konflikt?</p>

<h3>Aktueller Status</h3>
<p>Wie steht es gerade?</p>

<h3>Mögliche Lösungen</h3>
<ul>
<li>Option 1</li>
<li>Option 2</li>
</ul>`
    },
    session: {
        icon: '📝',
        name: 'Session Notes',
        category: 'campaign',
        content: `<h3>Session #X - [Datum]</h3>

<h3>Zusammenfassung</h3>
<p>Was ist passiert?</p>

<h3>Wichtige Events</h3>
<ul>
<li>Event 1</li>
<li>Event 2</li>
</ul>

<h3>NPCs getroffen</h3>
<ul>
<li>[[NPC]]</li>
</ul>

<h3>Orte besucht</h3>
<ul>
<li>[[Ort]]</li>
</ul>

<h3>Loot & Belohnungen</h3>
<ul>
<li>Item</li>
<li>Gold</li>
</ul>

<h3>Offene Fäden</h3>
<ul>
<li>ToDo für nächste Session</li>
</ul>`
    },
    region: {
        icon: '🗺️',
        name: 'Region',
        category: 'world',
        content: `<h3>Übersicht</h3>
<p>Allgemeine Beschreibung der Region...</p>

<h3>Geographie</h3>
<p>Landschaft, Grenzen...</p>

<h3>Klima</h3>
<p>Wetter, Jahreszeiten...</p>

<h3>Wichtige Orte</h3>
<ul>
<li>[[Stadt 1]]</li>
<li>[[Dungeon]]</li>
</ul>

<h3>Politik & Herrschaft</h3>
<p>Wer regiert hier?</p>

<h3>Gefahren</h3>
<ul>
<li>Monster</li>
<li>Banditen</li>
</ul>`
    }
});
// ============================================================
// RENDER
// ============================================================
function renderWiki() {
    renderWikiQuickAccess();
    renderWikiTree();
    renderWikiDetail();
    const D = window.D;
    const countEl = $('wiki-io-count');
    if (countEl) countEl.textContent = String(D.wiki?.length || 0);
    updateWikiParentSelect();
}
function renderWikiQuickAccess() {
    const D = window.D;
    const container = $('wiki-quick-access');
    if (!container) return;
    const recentIds = D.wikiRecentlyViewed || [];
    const favorites = (D.wiki || []).filter(e => e.pinned);
    if (!recentIds.length && !favorites.length) {
        container.innerHTML =
            '<span style="color: var(--text-dim); font-size: 11px;">Besuche Einträge um Quick Access zu füllen</span>';
        return;
    }
    let html = '';
    if (favorites.length) {
        favorites.slice(0, 5).forEach(entry => {
            const cat = WIKI_CATEGORIES[entry.category] || { icon: '📄' };
            html += `
                <div class="quick-access-item favorite" data-action="select-wiki-entry" data-id="${entry.id}" title="${esc(entry.title)}">
                    <span class="quick-access-icon">⭐</span>
                    <span class="quick-access-label">${esc(entry.title)}</span>
                </div>
            `;
        });
    }
    if (favorites.length && recentIds.length) {
        html += '<div class="quick-access-separator"></div>';
    }
    const favoriteIds = new Set(favorites.map(f => f.id));
    recentIds
        .filter(id => !favoriteIds.has(id))
        .slice(0, 5)
        .forEach(id => {
            const entry = EntityLookup.wiki(id);
            if (!entry) return;
            const cat = WIKI_CATEGORIES[entry.category] || { icon: '📄' };
            html += `
            <div class="quick-access-item recent" data-action="select-wiki-entry" data-id="${entry.id}" title="${esc(entry.title)}">
                <span class="quick-access-icon">${cat.icon}</span>
                <span class="quick-access-label">${esc(entry.title)}</span>
            </div>
        `;
        });
    container.innerHTML = html;
}
function renderWikiTree() {
    const D = window.D;
    const tree = $('wiki-tree');
    if (!tree) return;
    const searchInput = $('wiki-search');
    const search = (searchInput?.value || '').toLowerCase();
    if (!D.wiki?.length) {
        tree.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--text-dim);">
                <div style="font-size: 2em; margin-bottom: 8px;">📚</div>
                <div>Keine Einträge</div>
            </div>
        `;
        return;
    }
    const byCategory = {};
    Object.keys(WIKI_CATEGORIES).forEach(cat => {
        byCategory[cat] = [];
    });
    byCategory['other'] = [];
    let entries = [...D.wiki];
    if (search) {
        entries = entries.filter(
            e =>
                e.title.toLowerCase().includes(search) ||
                (e.content || '').toLowerCase().includes(search) ||
                (e.tags || []).some(t => t.toLowerCase().includes(search))
        );
    }
    entries.forEach(entry => {
        const cat = entry.category || 'other';
        if (byCategory[cat]) {
            byCategory[cat].push(entry);
        } else {
            byCategory['other'].push(entry);
        }
    });
    Object.keys(byCategory).forEach(cat => {
        byCategory[cat].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return a.title.localeCompare(b.title);
        });
    });
    let html = '';
    Object.entries(WIKI_CATEGORIES).forEach(([catKey, catInfo]) => {
        const catEntries = byCategory[catKey] || [];
        if (catEntries.length === 0 && !search) return;
        const isExpanded = WikiState.expandedCategories.has(catKey);
        const catEntryIds = new Set(catEntries.map(e => e.id));
        const rootEntries = catEntries.filter(
            e => !e.parentId || e.parentId === e.id || !catEntryIds.has(e.parentId)
        );
        const childrenMap = {};
        catEntries.forEach(e => {
            if (e.parentId && e.parentId !== e.id && catEntryIds.has(e.parentId)) {
                if (!childrenMap[e.parentId]) childrenMap[e.parentId] = [];
                childrenMap[e.parentId].push(e);
            }
        });
        html += `
            <div class="wiki-tree-category ${isExpanded ? 'expanded' : ''}" data-category="${catKey}">
                <div class="wiki-tree-cat-header" data-action="toggle-wiki-category" data-value="${catKey}">
                    <span class="wiki-tree-toggle">▶</span>
                    <span class="wiki-tree-cat-icon">${catInfo.icon}</span>
                    <span class="wiki-tree-cat-name">${catInfo.name}</span>
                    <span class="wiki-tree-cat-count">${catEntries.length}</span>
                </div>
                <div class="wiki-tree-items">
                    ${renderWikiTreeItems(rootEntries, childrenMap, 0)}
                </div>
            </div>
        `;
    });
    if (byCategory['other']?.length > 0) {
        const isExpanded = WikiState.expandedCategories.has('other');
        const otherRootEntries = byCategory['other'].filter(e => !e.parentId);
        const otherChildrenMap = {};
        byCategory['other'].forEach(e => {
            if (e.parentId) {
                if (!otherChildrenMap[e.parentId]) otherChildrenMap[e.parentId] = [];
                otherChildrenMap[e.parentId].push(e);
            }
        });
        html += `
            <div class="wiki-tree-category ${isExpanded ? 'expanded' : ''}" data-category="other">
                <div class="wiki-tree-cat-header" data-action="toggle-wiki-category" data-value="other">
                    <span class="wiki-tree-toggle">▶</span>
                    <span class="wiki-tree-cat-icon">📄</span>
                    <span class="wiki-tree-cat-name">Sonstiges</span>
                    <span class="wiki-tree-cat-count">${byCategory['other'].length}</span>
                </div>
                <div class="wiki-tree-items">
                    ${renderWikiTreeItems(otherRootEntries, otherChildrenMap, 0)}
                </div>
            </div>
        `;
    }
    tree.innerHTML =
        html ||
        '<div style="padding: 20px; text-align: center; color: var(--text-dim);">Keine Treffer</div>';
}
function renderWikiTreeItems(entries, childrenMap, depth) {
    return entries
        .map(entry => {
            const children = childrenMap[entry.id] || [];
            const hasChildren = children.length > 0;
            const isExpanded = WikiState.expandedEntries.has(entry.id);
            let html = `<div class="wiki-tree-item-wrapper ${hasChildren ? 'has-children' : ''} ${isExpanded ? 'expanded' : ''}">`;
            html += renderWikiTreeItem(entry, childrenMap, depth);
            if (hasChildren) {
                html += `<div class="wiki-tree-item-children">
                ${renderWikiTreeItems(children, childrenMap, depth + 1)}
            </div>`;
            }
            html += '</div>';
            return html;
        })
        .join('');
}
function renderWikiTreeItem(entry, childrenMap, depth) {
    const isSelected = WikiState.selectedEntryId === entry.id;
    const hasChildren = (childrenMap[entry.id] || []).length > 0;
    const isExpanded = WikiState.expandedEntries.has(entry.id);
    const cat = WIKI_CATEGORIES[entry.category] || { icon: '📄' };
    return `
        <div class="wiki-tree-item ${isSelected ? 'selected' : ''} ${entry.pinned ? 'pinned' : ''} ${hasChildren ? 'has-children' : ''} ${isExpanded ? 'expanded' : ''}"
             data-action="select-wiki-entry" data-id="${entry.id}"
             style="padding-left: ${4 + depth * 8}px;"
             title="${esc(entry.title)}">
            ${hasChildren ? `<span class="wiki-tree-item-toggle" data-action="toggle-wiki-stop" data-id="${entry.id}">▶</span>` : ''}
            <span style="opacity: 0.7;">${cat.icon}</span>
            <span class="wiki-tree-item-name">${esc(entry.title)}</span>
        </div>
    `;
}
function renderWikiDetail() {
    const D = window.D;
    const renderEmptyState = window.renderEmptyState;
    const detail = $('wiki-detail');
    if (!detail) return;
    if (!WikiState.selectedEntryId) {
        detail.innerHTML = `<div class="wiki-detail-empty">${renderEmptyState({
            icon: '📖',
            titleEmpty: 'Eintrag auswählen',
            descEmpty: 'Wähle links einen Eintrag aus der Baumansicht.',
            gridSpan: 'auto'
        })}</div>`;
        return;
    }
    const entry = D.wiki?.find(e => e.id === WikiState.selectedEntryId);
    if (!entry) {
        WikiState.selectedEntryId = null;
        renderWikiDetail();
        return;
    }
    const cat = WIKI_CATEGORIES[entry.category] || { icon: '📄', name: 'Sonstiges' };
    const tags = entry.tags || [];
    // SEC-01: Sanitisierung MUSS vor der Anker-Injektion laufen — sanitizeHTML()s
    // allowedAttributes kennt kein "id", addTOCAnchors() danach auf bereits
    // bereinigtem Markup würde sonst sofort wieder entfernt (10-RESEARCH.md Pitfall 1).
    // Convert Markdown syntax to HTML for display (inkl. Sanitisierung, SEC-01)
    const renderMarkdownInContent = window.renderMarkdownInContent;
    const markdownRendered = renderMarkdownInContent
        ? renderMarkdownInContent(entry.content || '')
        : entry.content || '';
    const contentWithAnchors = addTOCAnchors(markdownRendered);
    // parseWikiLinks() escapt seinen eigenen Regex-Capture (Attributwert UND
    // sichtbarer Textknoten via esc()) und ist damit selbst sicher — nicht mehr
    // von der vorgelagerten Sanitisierung abhängig. Die Aufrufreihenfolge
    // renderMarkdownInContent() -> addTOCAnchors() -> parseWikiLinks() bleibt aus
    // einem anderen Grund bestehen: addTOCAnchors() braucht das bereits
    // gerenderte Markup, um die Anker-Ids an den richtigen Überschriften zu setzen.
    const parsedContent = parseWikiLinks(contentWithAnchors);
    const backlinks = findBacklinks(entry.title);
    const outlinks = extractWikiLinks(entry.content || '');
    const breadcrumb = renderWikiBreadcrumb(entry.id);
    // renderWikiTOC() bleibt bewusst auf dem Rohinhalt (entry.content), NICHT auf
    // markdownRendered/contentWithAnchors: die Inhaltsliste erscheint erst ab drei
    // <h2>-<h4>-Tags, und solche Tags speichert der Editor bereits als HTML — für
    // solche Einträge liefern extractWikiTOC() auf dem Rohinhalt und addTOCAnchors()
    // auf dem gerenderten Inhalt dieselbe Trefferreihenfolge und damit dieselben
    // toc-N-Kennungen. Restbedingung: enthält ein Eintrag GLEICHZEITIG HTML- UND
    // Markdown-Überschriften (Rautenschreibweise), können die Indizes auseinanderlaufen
    // — bekannte, dokumentierte Einschränkung (SEC-01, 10-RESEARCH.md).
    const toc = renderWikiTOC(entry.content || '');
    const plainText = (entry.content || '').replace(/<[^>]+>/g, ' ');
    const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
    const children = D.wiki.filter(e => e.parentId === entry.id);
    detail.innerHTML = `
        ${breadcrumb}

        <div class="wiki-detail-header">
            <div class="wiki-detail-title-section">
                <div class="wiki-detail-title">${entry.pinned ? '📌 ' : ''}${esc(entry.title)}</div>
                <div class="wiki-detail-meta">
                    <span class="wiki-detail-category">${cat.icon} ${cat.name}</span>
                    <span class="wiki-stat">📝 ${wordCount} Wörter</span>
                    <span class="wiki-stat">🔗 ${outlinks.length} Links</span>
                    <span class="wiki-stat">↩️ ${backlinks.length} Backlinks</span>
                </div>
            </div>
            <div class="wiki-detail-actions">
                <button class="btn btn-sm" data-action="toggle-wiki-pin" data-id="${entry.id}" title="${entry.pinned ? 'Entpinnen' : 'Pinnen'}">${entry.pinned ? '📌' : '📍'}</button>
                <button class="btn btn-sm" data-action="edit-wiki" data-id="${entry.id}" title="Bearbeiten">✏️</button>
                <button class="btn btn-sm btn-danger" data-action="delete-wiki" data-id="${entry.id}" title="Löschen">🗑️</button>
            </div>
        </div>

        ${toc}

        <div class="wiki-detail-body">
            ${parsedContent || '<em style="color: var(--text-dim);">Kein Inhalt</em>'}
        </div>

        ${
            tags.length
                ? `
            <div class="wiki-detail-tags">
                ${tags.map(t => `<span class="wiki-tag" data-action="search-wiki-tag" data-value="${esc(t)}">${esc(t)}</span>`).join('')}
            </div>
        `
                : ''
        }

        ${
            children.length
                ? `
            <div class="wiki-detail-links">
                <div class="wiki-detail-links-section">
                    <div class="wiki-detail-links-label">📁 Untereinträge (${children.length})</div>
                    <div class="wiki-detail-links-list">
                        ${children.map(c => `<span class="wiki-link" data-action="select-wiki-entry" data-id="${c.id}">${esc(c.title)}</span>`).join('')}
                    </div>
                </div>
            </div>
        `
                : ''
        }

        ${
            outlinks.length || backlinks.length
                ? `
            <div class="wiki-detail-links">
                ${
                    outlinks.length
                        ? `
                    <div class="wiki-detail-links-section">
                        <div class="wiki-detail-links-label">→ Verlinkt zu</div>
                        <div class="wiki-detail-links-list">
                            ${outlinks
                                .map(link => {
                                    const exists = D.wiki.some(
                                        e => e.title.toLowerCase() === link.toLowerCase()
                                    );
                                    return `<span class="wiki-link ${exists ? '' : 'missing'}" data-action="wiki-link-click" data-value="${esc(link)}" data-exists="${exists}">${esc(link)}</span>`;
                                })
                                .join('')}
                        </div>
                    </div>
                `
                        : ''
                }
                ${
                    backlinks.length
                        ? `
                    <div class="wiki-detail-links-section">
                        <div class="wiki-detail-links-label">← Verlinkt von</div>
                        <div class="wiki-detail-links-list">
                            ${backlinks.map(link => `<span class="wiki-link" data-action="navigate-wiki-entry" data-value="${esc(link)}">${esc(link)}</span>`).join('')}
                        </div>
                    </div>
                `
                        : ''
                }
            </div>
        `
                : ''
        }

        <div class="wiki-detail-footer">
            <span>Erstellt: ${new Date(entry.createdAt).toLocaleDateString('de-DE')}</span>
            ${entry.updatedAt ? `<span>Bearbeitet: ${new Date(entry.updatedAt).toLocaleDateString('de-DE')}</span>` : ''}
        </div>
    `;
}
// ============================================================
// WIKI CRUD
// ============================================================
function selectWikiEntry(id) {
    WikiState.selectedEntryId = id;
    if (id) {
        addToWikiRecentlyViewed(id);
    }
    const dropdown = $('wiki-search-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    renderWiki();
}
function toggleWikiCategory(category) {
    if (WikiState.expandedCategories.has(category)) {
        WikiState.expandedCategories.delete(category);
    } else {
        WikiState.expandedCategories.add(category);
    }
    renderWikiTree();
}
function expandAllWikiCategories() {
    Object.keys(WIKI_CATEGORIES).forEach(cat => WikiState.expandedCategories.add(cat));
    WikiState.expandedCategories.add('other');
    renderWikiTree();
    showToast('Alle Kategorien ausgeklappt');
}
function collapseAllWikiCategories() {
    WikiState.expandedCategories.clear();
    renderWikiTree();
    showToast('Alle Kategorien eingeklappt');
}
function showWikiForm(parentCategory = '') {
    const showModal = window.showModal;
    cancelWikiEdit();
    const catInput = $('wiki-category');
    if (parentCategory && catInput) {
        catInput.value = parentCategory;
    }
    updateWikiParentSelect();
    const titleEl = $('wiki-form-title');
    if (titleEl) titleEl.textContent = '+ Neuer Eintrag';
    const templateContainer = $('wiki-template-selector');
    if (templateContainer) {
        templateContainer.innerHTML = renderWikiTemplateSelector();
        templateContainer.style.display = 'block';
    }
    const overlay = $('wiki-form-overlay');
    if (overlay) overlay.style.display = 'flex';
}
function hideWikiForm() {
    const overlay = $('wiki-form-overlay');
    if (overlay) overlay.style.display = 'none';
    cancelWikiEdit();
}
function updateWikiParentSelect() {
    const D = window.D;
    const select = $('wiki-parent');
    if (!select) return;
    const editIdInput = $('edit-wiki-id');
    const catInput = $('wiki-category');
    const editId = editIdInput?.value || '';
    const currentId = editId ? parseInt(editId) : null;
    const selectedCategory = catInput?.value || '';
    const previousValue = select.value;
    select.innerHTML = '<option value="">— Kein übergeordneter Eintrag —</option>';
    (D.wiki || []).forEach(entry => {
        if (entry.id === currentId) return;
        if (isDescendantOf(entry.id, currentId)) return;
        if (selectedCategory && entry.category !== selectedCategory) return;
        const cat = WIKI_CATEGORIES[entry.category] || { icon: '📄' };
        select.innerHTML += `<option value="${entry.id}">${cat.icon} ${esc(entry.title)}</option>`;
    });
    if (previousValue && select.querySelector(`option[value="${previousValue}"]`)) {
        select.value = previousValue;
    }
}
function initWikiCategoryListener() {
    const categorySelect = $('wiki-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            updateWikiParentSelect();
            const parentSelect = $('wiki-parent');
            if (parentSelect) parentSelect.value = '';
        });
    }
}
function initWikiSearchListener() {
    const searchInput = $('wiki-search');
    if (searchInput) {
        searchInput.addEventListener('keydown', handleWikiSearchKeydown);
    }
}
function isDescendantOf(entryId, potentialAncestorId) {
    const D = window.D;
    if (!potentialAncestorId) return false;
    const entry = D.wiki?.find(e => e.id === entryId);
    if (!entry || !entry.parentId) return false;
    if (entry.parentId === potentialAncestorId) return true;
    return isDescendantOf(entry.parentId, potentialAncestorId);
}
function parseWikiLinks(content) {
    const D = window.D;
    return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
        const exists = D.wiki?.some(e => e.title.toLowerCase() === linkText.toLowerCase());
        const escapedText = esc(linkText);
        return `<span class="wiki-link ${exists ? '' : 'missing'}" data-action="wiki-link-click-stop" data-value="${escapedText}" data-exists="${exists}">${escapedText}</span>`;
    });
}
function extractWikiLinks(content) {
    const matches = content.match(/\[\[([^\]]+)\]\]/g) || [];
    return [...new Set(matches.map(m => m.slice(2, -2)))];
}
function findBacklinks(title) {
    const D = window.D;
    if (!D.wiki) return [];
    return D.wiki
        .filter(e => e.content && e.content.toLowerCase().includes(`[[${title.toLowerCase()}]]`))
        .map(e => e.title);
}
function toggleWikiEntry(id) {
    if (WikiState.expandedEntries.has(id)) {
        WikiState.expandedEntries.delete(id);
    } else {
        WikiState.expandedEntries.add(id);
    }
    renderWiki();
}
function filterWiki(category) {
    WikiState.categoryFilter = category;
    document.querySelectorAll('#wiki-categories .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === category);
    });
    renderWiki();
}
function sortWiki(mode) {
    WikiState.sortMode = mode;
    ['alpha', 'recent', 'pinned'].forEach(m => {
        const btn = $(`wiki-sort-${m}`);
        if (btn) btn.classList.toggle('active', m === mode);
    });
    renderWiki();
}
function saveWikiEntry() {
    const D = window.D;
    const nextId = window.nextId;
    const titleInput = $('wiki-title');
    const title = titleInput?.value.trim() || '';
    if (!title) {
        showToast('⚠️ Titel erforderlich', 'error');
        return;
    }
    const editIdInput = $('edit-wiki-id');
    const editId = editIdInput?.value || '';
    const parentInput = $('wiki-parent');
    const parentVal = parentInput?.value || '';
    const catInput = $('wiki-category');
    const contentEl = $('wiki-content');
    const tagsInput = $('wiki-tags');
    const pinnedInput = $('wiki-pinned');
    const entry = {
        title,
        category: catInput?.value || 'locations',
        content: contentEl ? sanitizeHTML(contentEl.innerHTML) : '',
        tags:
            tagsInput?.value
                .split(',')
                .map(t => t.trim())
                .filter(t => t) || [],
        pinned: pinnedInput?.checked || false,
        parentId: parentVal ? parseInt(parentVal) : null,
        updatedAt: Date.now()
    };
    if (editId) {
        const idx = D.wiki.findIndex(e => e.id === parseInt(editId));
        if (idx > -1) {
            saveUndoState();
            D.wiki[idx] = { ...D.wiki[idx], ...entry };
            showToast('Wiki-Eintrag aktualisiert');
            WikiState.selectedEntryId = parseInt(editId);
        }
    } else {
        entry.id = nextId('wiki');
        entry.createdAt = Date.now();
        D.wiki.push(entry);
        showToast('Wiki-Eintrag erstellt');
        WikiState.selectedEntryId = entry.id;
        WikiState.expandedCategories.add(entry.category);
    }
    hideWikiForm();
    renderWiki();
    save();
}
function editWikiEntry(id) {
    const showModal = window.showModal;
    const entry = EntityLookup.wiki(id);
    if (!entry) return;
    const editIdInput = $('edit-wiki-id');
    const titleInput = $('wiki-title');
    const catInput = $('wiki-category');
    const contentEl = $('wiki-content');
    const tagsInput = $('wiki-tags');
    const pinnedInput = $('wiki-pinned');
    if (editIdInput) editIdInput.value = String(id);
    if (titleInput) titleInput.value = entry.title;
    if (catInput) catInput.value = entry.category || 'locations';
    if (contentEl) contentEl.innerHTML = sanitizeHTML(entry.content) || '';
    if (tagsInput) tagsInput.value = (entry.tags || []).join(', ');
    if (pinnedInput) pinnedInput.checked = entry.pinned || false;
    updateWikiParentSelect();
    const parentInput = $('wiki-parent');
    if (parentInput) {
        parentInput.value = entry.parentId || '';
    }
    const templateContainer = $('wiki-template-selector');
    if (templateContainer) {
        templateContainer.style.display = 'none';
    }
    const titleEl = $('wiki-form-title');
    if (titleEl) titleEl.textContent = '✏️ Eintrag bearbeiten';
    const overlay = $('wiki-form-overlay');
    if (overlay) overlay.style.display = 'flex';
    if (titleInput) titleInput.focus();
}
function cancelWikiEdit() {
    clearWikiForm();
}
function clearWikiForm() {
    clearFormFields({
        textFields: ['edit-wiki-id', 'wiki-title', 'wiki-tags', 'wiki-parent'],
        selectFields: [{ id: 'wiki-category', defaultValue: 'locations' }],
        checkboxFields: ['wiki-pinned'],
        contentEditableFields: ['wiki-content']
    });
}
function deleteWikiEntry(id) {
    const D = window.D;
    if (confirm('Wiki-Eintrag löschen?')) {
        saveUndoState();
        D.wiki.forEach(e => {
            if (e.parentId === id) e.parentId = null;
        });
        D.wiki = D.wiki.filter(e => e.id !== id);
        WikiState.expandedEntries.delete(id);
        if (WikiState.selectedEntryId === id) {
            WikiState.selectedEntryId = null;
        }
        renderWiki();
        save();
        showToast('Wiki-Eintrag gelöscht');
    }
}
function toggleWikiPin(id) {
    const entry = EntityLookup.wiki(id);
    if (!entry) return;
    entry.pinned = !entry.pinned;
    renderWiki();
    save();
    showToast(entry.pinned ? '📌 Eintrag gepinnt' : '📍 Eintrag entpinnt');
}
function navigateToWikiEntry(title) {
    const entry = EntityLookup.findByName('wiki', title, 'title');
    if (entry) {
        WikiState.expandedCategories.add(entry.category || 'other');
        selectWikiEntry(entry.id);
    }
}
function createWikiFromLink(title) {
    if (confirm(`Wiki-Eintrag "${title}" existiert noch nicht. Jetzt erstellen?`)) {
        showWikiForm();
        const titleInput = $('wiki-title');
        const contentEl = $('wiki-content');
        if (titleInput) titleInput.value = title;
        if (contentEl) contentEl.focus();
    }
}
function searchWikiTag(tag) {
    const searchInput = $('wiki-search');
    if (searchInput) searchInput.value = tag;
    renderWiki();
}
function insertWikiLink() {
    const title = prompt('Wiki-Link einfügen:', '');
    if (title) {
        if (typeof window.insertTextAtSelection === 'function') {
            window.insertTextAtSelection(`[[${title}]]`);
        }
    }
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.renderWiki = renderWiki;
window.renderWikiTree = renderWikiTree;
window.selectWikiEntry = selectWikiEntry;
window.toggleWikiCategory = toggleWikiCategory;
window.expandAllWikiCategories = expandAllWikiCategories;
window.collapseAllWikiCategories = collapseAllWikiCategories;
window.showWikiForm = showWikiForm;
window.hideWikiForm = hideWikiForm;
window.initWikiCategoryListener = initWikiCategoryListener;
window.initWikiSearchListener = initWikiSearchListener;
window.parseWikiLinks = parseWikiLinks;
window.toggleWikiEntry = toggleWikiEntry;
window.filterWiki = filterWiki;
window.sortWiki = sortWiki;
window.saveWikiEntry = saveWikiEntry;
window.editWikiEntry = editWikiEntry;
window.deleteWikiEntry = deleteWikiEntry;
window.toggleWikiPin = toggleWikiPin;
window.navigateToWikiEntry = navigateToWikiEntry;
window.createWikiFromLink = createWikiFromLink;
window.searchWikiTag = searchWikiTag;
window.insertWikiLink = insertWikiLink;
