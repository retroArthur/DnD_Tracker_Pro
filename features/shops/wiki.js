// [SECTION:WIKI]
// Extrahiert aus shops.js
// Wiki-System
// Zeilen: 553

// WIKI
// ============================================================
let wikiCategoryFilter = '';
let wikiSortMode = 'recent';
let expandedWikiEntries = new Set();
let expandedWikiCategories = new Set(['campaign', 'locations', 'factions', 'history']);
let selectedWikiEntryId = null;

const WIKI_CATEGORIES = {
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
};

function renderWiki() {
    renderWikiTree();
    renderWikiDetail();
    
    // Counter aktualisieren
    const countEl = $('wiki-io-count');
    if (countEl) countEl.textContent = D.wiki?.length || 0;
    
    // Parent-Dropdown im Formular aktualisieren
    updateWikiParentSelect();
}

function renderWikiTree() {
    const tree = $('wiki-tree');
    if (!tree) return;
    
    const search = ($('wiki-search')?.value || '').toLowerCase();
    
    if (!D.wiki?.length) {
        tree.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--text-dim);">
                <div style="font-size: 2em; margin-bottom: 8px;">📚</div>
                <div>Keine Einträge</div>
            </div>
        `;
        return;
    }
    
    // Einträge nach Kategorie gruppieren
    const byCategory = {};
    Object.keys(WIKI_CATEGORIES).forEach(cat => {
        byCategory[cat] = [];
    });
    byCategory['other'] = [];
    
    let entries = [...D.wiki];
    
    // Suche anwenden
    if (search) {
        entries = entries.filter(e => 
            e.title.toLowerCase().includes(search) ||
            (e.content || '').toLowerCase().includes(search) ||
            (e.tags || []).some(t => t.toLowerCase().includes(search))
        );
    }
    
    // Nach Kategorie gruppieren
    entries.forEach(entry => {
        const cat = entry.category || 'other';
        if (byCategory[cat]) {
            byCategory[cat].push(entry);
        } else {
            byCategory['other'].push(entry);
        }
    });
    
    // Alphabetisch sortieren innerhalb Kategorien
    Object.keys(byCategory).forEach(cat => {
        byCategory[cat].sort((a, b) => {
            // Gepinnte zuerst
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return a.title.localeCompare(b.title);
        });
    });
    
    // Baum-HTML generieren
    let html = '';
    Object.entries(WIKI_CATEGORIES).forEach(([catKey, catInfo]) => {
        const catEntries = byCategory[catKey] || [];
        if (catEntries.length === 0 && !search) return; // Leere Kategorien ausblenden (außer bei Suche)
        
        const isExpanded = expandedWikiCategories.has(catKey);
        
        // Hierarchie aufbauen: Root-Einträge und Kinder
        const rootEntries = catEntries.filter(e => !e.parentId);
        const childrenMap = {};
        catEntries.forEach(e => {
            if (e.parentId) {
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
    
    // "Sonstige" Kategorie falls vorhanden
    if (byCategory['other']?.length > 0) {
        const isExpanded = expandedWikiCategories.has('other');
        // Auch für "Sonstige" die Hierarchie aufbauen
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
    
    tree.innerHTML = html || '<div style="padding: 20px; text-align: center; color: var(--text-dim);">Keine Treffer</div>';
}

function renderWikiTreeItems(entries, childrenMap, depth) {
    return entries.map(entry => {
        const children = childrenMap[entry.id] || [];
        const hasChildren = children.length > 0;
        const isExpanded = expandedWikiEntries.has(entry.id);
        
        let html = `<div class="wiki-tree-item-wrapper ${hasChildren ? 'has-children' : ''} ${isExpanded ? 'expanded' : ''}">`;
        html += renderWikiTreeItem(entry, childrenMap, depth);
        
        if (hasChildren) {
            html += `<div class="wiki-tree-item-children">
                ${renderWikiTreeItems(children, childrenMap, depth + 1)}
            </div>`;
        }
        
        html += '</div>';
        return html;
    }).join('');
}

function renderWikiTreeItem(entry, childrenMap, depth) {
    const isSelected = selectedWikiEntryId === entry.id;
    const hasChildren = (childrenMap[entry.id] || []).length > 0;
    const isExpanded = expandedWikiEntries.has(entry.id);
    const cat = WIKI_CATEGORIES[entry.category] || { icon: '📄' };
    
    return `
        <div class="wiki-tree-item ${isSelected ? 'selected' : ''} ${entry.pinned ? 'pinned' : ''} ${hasChildren ? 'has-children' : ''} ${isExpanded ? 'expanded' : ''}" 
             data-action="select-wiki-entry" data-id="${entry.id}" 
             data-id="${entry.id}"
             style="padding-left: ${10 + depth * 12}px;">
            ${hasChildren ? `<span class="wiki-tree-item-toggle" data-action="toggle-wiki-stop" data-id="${entry.id}">▶</span>` : ''}
            <span style="opacity: 0.7;">${cat.icon}</span>
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(entry.title)}</span>
        </div>
    `;
}

function renderWikiDetail() {
    const detail = $('wiki-detail');
    if (!detail) return;
    
    if (!selectedWikiEntryId) {
        detail.innerHTML = `<div class="wiki-detail-empty">${renderEmptyState({
            icon: '📖',
            titleEmpty: 'Eintrag auswählen',
            descEmpty: 'Wähle links einen Eintrag aus der Baumansicht.',
            gridSpan: 'auto'
        })}</div>`;
        return;
    }
    
    const entry = D.wiki?.find(e => e.id === selectedWikiEntryId);
    if (!entry) {
        selectedWikiEntryId = null;
        renderWikiDetail();
        return;
    }
    
    const cat = WIKI_CATEGORIES[entry.category] || { icon: '📄', name: 'Sonstiges' };
    const tags = entry.tags || [];
    const parsedContent = parseWikiLinks(entry.content || '');
    const backlinks = findBacklinks(entry.title);
    const outlinks = extractWikiLinks(entry.content || '');
    
    // Parent-Info
    let parentInfo = '';
    if (entry.parentId) {
        const parent = EntityLookup.wiki(entry.parentId);
        if (parent) {
            parentInfo = `<span style="cursor: pointer;" data-action="select-wiki-entry" data-id="${parent.id}">📁 ${esc(parent.title)}</span> → `;
        }
    }
    
    // Kinder finden
    const children = D.wiki.filter(e => e.parentId === entry.id);
    
    detail.innerHTML = `
        <div class="wiki-detail-header">
            <div class="wiki-detail-title-section">
                <div class="wiki-detail-title">${entry.pinned ? '📌 ' : ''}${esc(entry.title)}</div>
                <div class="wiki-detail-meta">
                    ${parentInfo}
                    <span class="wiki-detail-category">${cat.icon} ${cat.name}</span>
                </div>
            </div>
            <div class="wiki-detail-actions">
                <button class="btn btn-sm" data-action="toggle-wiki-pin" data-id="${entry.id}" title="${entry.pinned ? 'Entpinnen' : 'Pinnen'}">${entry.pinned ? '📌' : '📍'}</button>
                <button class="btn btn-sm" data-action="edit-wiki" data-id="${entry.id}" title="Bearbeiten">✏️</button>
                <button class="btn btn-sm btn-danger" data-action="delete-wiki" data-id="${entry.id}" title="Löschen">🗑️</button>
            </div>
        </div>
        
        <div class="wiki-detail-body">
            ${parsedContent || '<em style="color: var(--text-dim);">Kein Inhalt</em>'}
        </div>
        
        ${tags.length ? `
            <div class="wiki-detail-tags">
                ${tags.map(t => `<span class="wiki-tag" data-action="search-wiki-tag" data-value="${esc(t)}">${esc(t)}</span>`).join('')}
            </div>
        ` : ''}
        
        ${children.length ? `
            <div class="wiki-detail-links">
                <div class="wiki-detail-links-section">
                    <div class="wiki-detail-links-label">📁 Untereinträge (${children.length})</div>
                    <div class="wiki-detail-links-list">
                        ${children.map(c => `<span class="wiki-link" data-action="select-wiki-entry" data-id="${c.id}">${esc(c.title)}</span>`).join('')}
                    </div>
                </div>
            </div>
        ` : ''}
        
        ${(outlinks.length || backlinks.length) ? `
            <div class="wiki-detail-links">
                ${outlinks.length ? `
                    <div class="wiki-detail-links-section">
                        <div class="wiki-detail-links-label">→ Verlinkt zu</div>
                        <div class="wiki-detail-links-list">
                            ${outlinks.map(link => {
                                const exists = D.wiki.some(e => e.title.toLowerCase() === link.toLowerCase());
                                return `<span class="wiki-link ${exists ? '' : 'missing'}" data-action="wiki-link-click" data-value="${esc(link)}" data-exists="${exists}">${esc(link)}</span>`;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                ${backlinks.length ? `
                    <div class="wiki-detail-links-section">
                        <div class="wiki-detail-links-label">← Verlinkt von</div>
                        <div class="wiki-detail-links-list">
                            ${backlinks.map(link => `<span class="wiki-link" data-action="navigate-wiki-entry" data-value="${esc(link)}">${esc(link)}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        ` : ''}
        
        <div class="wiki-detail-footer">
            <span>Erstellt: ${new Date(entry.createdAt).toLocaleDateString('de-DE')}</span>
            ${entry.updatedAt ? `<span>Bearbeitet: ${new Date(entry.updatedAt).toLocaleDateString('de-DE')}</span>` : ''}
        </div>
    `;
}

function selectWikiEntry(id) {
    selectedWikiEntryId = id;
    renderWiki();
}

function toggleWikiCategory(category) {
    if (expandedWikiCategories.has(category)) {
        expandedWikiCategories.delete(category);
    } else {
        expandedWikiCategories.add(category);
    }
    renderWikiTree();
}

function expandAllWikiCategories() {
    Object.keys(WIKI_CATEGORIES).forEach(cat => expandedWikiCategories.add(cat));
    expandedWikiCategories.add('other');
    renderWikiTree();
    showToast('Alle Kategorien ausgeklappt');
}

function collapseAllWikiCategories() {
    expandedWikiCategories.clear();
    renderWikiTree();
    showToast('Alle Kategorien eingeklappt');
}

function showWikiForm(parentCategory = '') {
    cancelWikiEdit();
    if (parentCategory) {
        $('wiki-category').value = parentCategory;
    }
    $('wiki-form-title').textContent = '+ Neuer Eintrag';
    $('wiki-form-overlay').style.display = 'flex';
}

function hideWikiForm() {
    $('wiki-form-overlay').style.display = 'none';
    cancelWikiEdit();
}

function updateWikiParentSelect() {
    const select = $('wiki-parent');
    if (!select) return;
    
    const editId = $('edit-wiki-id')?.value;
    const currentId = editId ? parseInt(editId) : null;
    
    select.innerHTML = '<option value="">— Kein übergeordneter Eintrag —</option>';
    
    (D.wiki || []).forEach(entry => {
        // Nicht sich selbst oder eigene Kinder als Parent erlauben
        if (entry.id === currentId) return;
        if (isDescendantOf(entry.id, currentId)) return;
        
        const cat = WIKI_CATEGORIES[entry.category] || { icon: '📄' };
        select.innerHTML += `<option value="${entry.id}">${cat.icon} ${esc(entry.title)}</option>`;
    });
}

function isDescendantOf(entryId, potentialAncestorId) {
    if (!potentialAncestorId) return false;
    const entry = D.wiki?.find(e => e.id === entryId);
    if (!entry || !entry.parentId) return false;
    if (entry.parentId === potentialAncestorId) return true;
    return isDescendantOf(entry.parentId, potentialAncestorId);
}

function parseWikiLinks(content) {
    // [[Link-Name]] -> klickbarer Link
    return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
        const exists = D.wiki?.some(e => e.title.toLowerCase() === linkText.toLowerCase());
        const escapedText = linkText.replace(/"/g, '&quot;');
        return `<span class="wiki-link ${exists ? '' : 'missing'}" data-action="wiki-link-click-stop" data-value="${escapedText}" data-exists="${exists}">${linkText}</span>`;
    });
}

function extractWikiLinks(content) {
    const matches = content.match(/\[\[([^\]]+)\]\]/g) || [];
    return [...new Set(matches.map(m => m.slice(2, -2)))];
}

function findBacklinks(title) {
    if (!D.wiki) return [];
    return D.wiki
        .filter(e => e.content && e.content.toLowerCase().includes(`[[${title.toLowerCase()}]]`))
        .map(e => e.title);
}

function toggleWikiEntry(id) {
    if (expandedWikiEntries.has(id)) {
        expandedWikiEntries.delete(id);
    } else {
        expandedWikiEntries.add(id);
    }
    renderWiki();
}

function filterWiki(category) {
    wikiCategoryFilter = category;
    // Filter-Buttons aktualisieren
    document.querySelectorAll('#wiki-categories .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === category);
    });
    renderWiki();
}

function sortWiki(mode) {
    wikiSortMode = mode;
    // Sort-Buttons aktualisieren
    ['alpha', 'recent', 'pinned'].forEach(m => {
        const btn = $(`wiki-sort-${m}`);
        if (btn) btn.classList.toggle('active', m === mode);
    });
    renderWiki();
}

function saveWikiEntry() {
    const title = $('wiki-title').value.trim();
    if (!title) { showToast('⚠️ Titel erforderlich', 'error'); return; }
    
    const editId = $('edit-wiki-id').value;
    const parentVal = $('wiki-parent')?.value;
    
    const entry = {
        title,
        category: $('wiki-category').value,
        content: sanitizeHTML($('wiki-content').innerHTML),
        tags: $('wiki-tags').value.split(',').map(t => t.trim()).filter(t => t),
        pinned: $('wiki-pinned').checked,
        parentId: parentVal ? parseInt(parentVal) : null,
        updatedAt: Date.now()
    };
    
    if (editId) {
        const idx = D.wiki.findIndex(e => e.id === parseInt(editId));
        if (idx > -1) {
            D.wiki[idx] = { ...D.wiki[idx], ...entry };
            showToast('Wiki-Eintrag aktualisiert');
            selectedWikiEntryId = parseInt(editId);
        }
    } else {
        entry.id = nextId('wiki');
        entry.createdAt = Date.now();
        D.wiki.push(entry);
        showToast('Wiki-Eintrag erstellt');
        selectedWikiEntryId = entry.id;
        // Kategorie ausklappen
        expandedWikiCategories.add(entry.category);
    }
    
    hideWikiForm();
    renderWiki();
    save();
}

function editWikiEntry(id) {
    const entry = EntityLookup.wiki(id);
    if (!entry) return;
    
    updateWikiParentSelect();
    
    $('edit-wiki-id').value = id;
    $('wiki-title').value = entry.title;
    $('wiki-category').value = entry.category || 'locations';
    $('wiki-content').innerHTML = entry.content || '';
    $('wiki-tags').value = (entry.tags || []).join(', ');
    $('wiki-pinned').checked = entry.pinned || false;
    
    // Parent setzen (nach updateWikiParentSelect)
    setTimeout(() => {
        if ($('wiki-parent')) {
            $('wiki-parent').value = entry.parentId || '';
        }
    }, 10);
    
    $('wiki-form-title').textContent = '✏️ Eintrag bearbeiten';
    $('wiki-form-overlay').style.display = 'flex';
    $('wiki-title').focus();
}

function cancelWikiEdit() {
    clearWikiForm();
}

function clearWikiForm() {
    $('edit-wiki-id').value = '';
    $('wiki-title').value = '';
    $('wiki-category').value = 'locations';
    $('wiki-content').innerHTML = '';
    $('wiki-tags').value = '';
    $('wiki-pinned').checked = false;
    if ($('wiki-parent')) $('wiki-parent').value = '';
}

function deleteWikiEntry(id) {
    if (confirm('Wiki-Eintrag löschen?')) {
        // Auch Kinder auf "kein Parent" setzen
        D.wiki.forEach(e => {
            if (e.parentId === id) e.parentId = null;
        });
        
        D.wiki = D.wiki.filter(e => e.id !== id);
        expandedWikiEntries.delete(id);
        
        // Falls der gelöschte Eintrag ausgewählt war
        if (selectedWikiEntryId === id) {
            selectedWikiEntryId = null;
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
        // Kategorie ausklappen
        expandedWikiCategories.add(entry.category || 'other');
        // Eintrag auswählen
        selectWikiEntry(entry.id);
    }
}

function createWikiFromLink(title) {
    if (confirm(`Wiki-Eintrag "${title}" existiert noch nicht. Jetzt erstellen?`)) {
        showWikiForm();
        $('wiki-title').value = title;
        $('wiki-content').focus();
    }
}

function searchWikiTag(tag) {
    $('wiki-search').value = tag;
    renderWiki();
}

function insertWikiLink() {
    const title = prompt('Wiki-Link einfügen:', '');
    if (title) {
        document.execCommand('insertText', false, `[[${title}]]`);
    }
}

// ============================================================