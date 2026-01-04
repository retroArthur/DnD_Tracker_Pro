// [SECTION:WIKI]
// Extrahiert aus shops.js
// Wiki-System

// WIKI
// ============================================================

// Wiki-State Namespace - kapselt alle globalen Variablen
const WikiState = {
    categoryFilter: '',
    sortMode: 'recent',
    expandedEntries: new Set(),
    expandedCategories: new Set(['campaign', 'locations', 'factions', 'history']),
    selectedEntryId: null,
    searchDropdownIndex: -1,
    // Link-Suggester State
    linkSuggester: null,
    linkSuggesterIndex: -1,
    linkSuggesterState: null
};

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

// Wiki Templates
const WIKI_TEMPLATES = {
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
};

function renderWiki() {
    renderWikiQuickAccess();
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
        
        const isExpanded = WikiState.expandedCategories.has(catKey);
        
        // Hierarchie aufbauen: Root-Einträge und Kinder
        // Als Root gelten:
        // - Einträge ohne parentId
        // - Selbstbezüge (parentId === id)
        // - Einträge deren Parent in einer anderen Kategorie ist
        const catEntryIds = new Set(catEntries.map(e => e.id));
        const rootEntries = catEntries.filter(e =>
            !e.parentId ||
            e.parentId === e.id ||
            !catEntryIds.has(e.parentId) // Parent ist nicht in dieser Kategorie
        );
        const childrenMap = {};
        catEntries.forEach(e => {
            // Nur als Kind einordnen wenn Parent in gleicher Kategorie
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
    
    // "Sonstige" Kategorie falls vorhanden
    if (byCategory['other']?.length > 0) {
        const isExpanded = WikiState.expandedCategories.has('other');
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
    }).join('');
}

function renderWikiTreeItem(entry, childrenMap, depth) {
    const isSelected = WikiState.selectedEntryId === entry.id;
    const hasChildren = (childrenMap[entry.id] || []).length > 0;
    const isExpanded = WikiState.expandedEntries.has(entry.id);
    const cat = WIKI_CATEGORIES[entry.category] || { icon: '📄' };
    
    return `
        <div class="wiki-tree-item ${isSelected ? 'selected' : ''} ${entry.pinned ? 'pinned' : ''} ${hasChildren ? 'has-children' : ''} ${isExpanded ? 'expanded' : ''}"
             data-action="select-wiki-entry" data-id="${entry.id}"
             data-id="${entry.id}"
             style="padding-left: ${4 + depth * 8}px;"
             title="${esc(entry.title)}">
            ${hasChildren ? `<span class="wiki-tree-item-toggle" data-action="toggle-wiki-stop" data-id="${entry.id}">▶</span>` : ''}
            <span style="opacity: 0.7;">${cat.icon}</span>
            <span class="wiki-tree-item-name">${esc(entry.title)}</span>
        </div>
    `;
}

function renderWikiDetail() {
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
    // TOC-Anker zum Content hinzufügen
    const contentWithAnchors = addTOCAnchors(entry.content || '');
    const parsedContent = parseWikiLinks(contentWithAnchors);
    const backlinks = findBacklinks(entry.title);
    const outlinks = extractWikiLinks(entry.content || '');

    // Breadcrumb Navigation
    const breadcrumb = renderWikiBreadcrumb(entry.id);

    // Table of Contents
    const toc = renderWikiTOC(entry.content || '');

    // Stats berechnen
    const plainText = (entry.content || '').replace(/<[^>]+>/g, ' ');
    const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;

    // Kinder finden
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
    WikiState.selectedEntryId = id;
    // Track recently viewed
    if (id) {
        addToWikiRecentlyViewed(id);
    }
    // Hide search dropdown if visible
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
    cancelWikiEdit();
    if (parentCategory) {
        $('wiki-category').value = parentCategory;
    }
    // Parent-Dropdown basierend auf Kategorie aktualisieren
    updateWikiParentSelect();
    $('wiki-form-title').textContent = '+ Neuer Eintrag';

    // Template-Selector anzeigen
    const templateContainer = $('wiki-template-selector');
    if (templateContainer) {
        templateContainer.innerHTML = renderWikiTemplateSelector();
        templateContainer.style.display = 'block';
    }

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
    const selectedCategory = $('wiki-category')?.value || '';

    // Aktuellen Wert merken um ihn wiederherzustellen falls möglich
    const previousValue = select.value;

    select.innerHTML = '<option value="">— Kein übergeordneter Eintrag —</option>';

    (D.wiki || []).forEach(entry => {
        // Nicht sich selbst oder eigene Kinder als Parent erlauben
        if (entry.id === currentId) return;
        if (isDescendantOf(entry.id, currentId)) return;

        // Nur Einträge aus der gleichen Kategorie anzeigen
        if (selectedCategory && entry.category !== selectedCategory) return;

        const cat = WIKI_CATEGORIES[entry.category] || { icon: '📄' };
        select.innerHTML += `<option value="${entry.id}">${cat.icon} ${esc(entry.title)}</option>`;
    });

    // Vorherigen Wert wiederherstellen falls noch gültig
    if (previousValue && select.querySelector(`option[value="${previousValue}"]`)) {
        select.value = previousValue;
    }
}

// Event-Listener für Kategorie-Änderung im Wiki-Formular
function initWikiCategoryListener() {
    const categorySelect = $('wiki-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            // Parent-Dropdown aktualisieren wenn Kategorie geändert wird
            updateWikiParentSelect();
            // Parent-Auswahl zurücksetzen da alter Parent möglicherweise nicht mehr gültig
            const parentSelect = $('wiki-parent');
            if (parentSelect) parentSelect.value = '';
        });
    }
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
    if (WikiState.expandedEntries.has(id)) {
        WikiState.expandedEntries.delete(id);
    } else {
        WikiState.expandedEntries.add(id);
    }
    renderWiki();
}

function filterWiki(category) {
    WikiState.categoryFilter = category;
    // Filter-Buttons aktualisieren
    document.querySelectorAll('#wiki-categories .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === category);
    });
    renderWiki();
}

function sortWiki(mode) {
    WikiState.sortMode = mode;
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
            saveUndoState(); // Undo-Punkt vor Änderung
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
        // Kategorie ausklappen
        WikiState.expandedCategories.add(entry.category);
    }
    
    hideWikiForm();
    renderWiki();
    save();
}

function editWikiEntry(id) {
    const entry = EntityLookup.wiki(id);
    if (!entry) return;

    $('edit-wiki-id').value = id;
    $('wiki-title').value = entry.title;
    $('wiki-category').value = entry.category || 'locations';
    $('wiki-content').innerHTML = sanitizeHTML(entry.content) || '';
    $('wiki-tags').value = (entry.tags || []).join(', ');
    $('wiki-pinned').checked = entry.pinned || false;

    // Parent-Dropdown aktualisieren NACH Setzen der Kategorie
    updateWikiParentSelect();

    // Parent-Wert setzen
    if ($('wiki-parent')) {
        $('wiki-parent').value = entry.parentId || '';
    }

    // Template-Selector beim Bearbeiten ausblenden
    const templateContainer = $('wiki-template-selector');
    if (templateContainer) {
        templateContainer.style.display = 'none';
    }

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
        // Undo-Punkt speichern vor dem Löschen
        saveUndoState();
        
        // Auch Kinder auf "kein Parent" setzen
        D.wiki.forEach(e => {
            if (e.parentId === id) e.parentId = null;
        });
        
        D.wiki = D.wiki.filter(e => e.id !== id);
        WikiState.expandedEntries.delete(id);
        
        // Falls der gelöschte Eintrag ausgewählt war
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
        // Kategorie ausklappen
        WikiState.expandedCategories.add(entry.category || 'other');
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

// WIKI UX IMPROVEMENTS
// ============================================================

// 1. QUICK ACCESS BAR (Zuletzt besucht + Favoriten)
// ============================================================

function renderWikiQuickAccess() {
    const container = $('wiki-quick-access');
    if (!container) return;

    const recentIds = D.wikiRecentlyViewed || [];
    const favorites = (D.wiki || []).filter(e => e.pinned);

    if (!recentIds.length && !favorites.length) {
        container.innerHTML = '<span style="color: var(--text-dim); font-size: 11px;">Besuche Einträge um Quick Access zu füllen</span>';
        return;
    }

    let html = '';

    // Favoriten zuerst
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

    // Separator wenn beide vorhanden
    if (favorites.length && recentIds.length) {
        html += '<div class="quick-access-separator"></div>';
    }

    // Kürzlich besucht (keine Duplikate zu Favoriten)
    const favoriteIds = new Set(favorites.map(f => f.id));
    recentIds.filter(id => !favoriteIds.has(id)).slice(0, 5).forEach(id => {
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

function addToWikiRecentlyViewed(id) {
    if (!id) return;
    D.wikiRecentlyViewed = D.wikiRecentlyViewed || [];
    // Entfernen falls bereits vorhanden
    D.wikiRecentlyViewed = D.wikiRecentlyViewed.filter(i => i !== id);
    // Am Anfang hinzufügen
    D.wikiRecentlyViewed.unshift(id);
    // Max 10 behalten
    if (D.wikiRecentlyViewed.length > 10) {
        D.wikiRecentlyViewed = D.wikiRecentlyViewed.slice(0, 10);
    }
    save();
}

// 2. BREADCRUMB NAVIGATION
// ============================================================

function getWikiBreadcrumb(entryId) {
    const path = [];
    let currentId = entryId;
    const visited = new Set();

    while (currentId) {
        if (visited.has(currentId)) break; // Zyklus vermeiden
        visited.add(currentId);

        const entry = EntityLookup.wiki(currentId);
        if (!entry) break;

        path.unshift({ id: entry.id, title: entry.title, category: entry.category });
        currentId = entry.parentId;
    }

    return path;
}

function renderWikiBreadcrumb(entryId) {
    const path = getWikiBreadcrumb(entryId);
    if (path.length <= 1) return '';

    const entry = EntityLookup.wiki(entryId);
    const cat = entry ? WIKI_CATEGORIES[entry.category] : null;

    let html = '<div class="wiki-breadcrumb">';

    // Kategorie als erstes
    if (cat) {
        html += `<span class="breadcrumb-item category">${cat.icon} ${cat.name}</span>`;
        html += '<span class="breadcrumb-separator">›</span>';
    }

    // Pfad-Elemente
    path.forEach((item, i) => {
        const isLast = i === path.length - 1;
        if (isLast) {
            html += `<span class="breadcrumb-item current">${esc(item.title)}</span>`;
        } else {
            html += `<span class="breadcrumb-item" data-action="select-wiki-entry" data-id="${item.id}">${esc(item.title)}</span>`;
            html += '<span class="breadcrumb-separator">›</span>';
        }
    });

    html += '</div>';
    return html;
}

// 3. SUCH-VORSCHAU MIT KONTEXT
// ============================================================

function getSearchContextPreview(content, query, maxLength = 80) {
    if (!content || !query) return '';

    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const lowerContent = plainText.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerContent.indexOf(lowerQuery);

    if (idx === -1) return '';

    // Kontext um den Treffer herum
    const start = Math.max(0, idx - 30);
    const end = Math.min(plainText.length, idx + query.length + 50);
    let preview = plainText.slice(start, end);

    if (start > 0) preview = '...' + preview;
    if (end < plainText.length) preview = preview + '...';

    // Query highlighten
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    preview = esc(preview).replace(regex, '<mark>$1</mark>');

    return preview;
}

function renderWikiSearchDropdown(query) {
    const container = $('wiki-search-dropdown');
    if (!container) return;

    if (!query || query.length < 2) {
        container.style.display = 'none';
        WikiState.searchDropdownIndex = -1;
        return;
    }

    const lowerQuery = query.toLowerCase();
    const results = (D.wiki || [])
        .map(entry => {
            const titleMatch = entry.title.toLowerCase().includes(lowerQuery);
            const contentMatch = (entry.content || '').toLowerCase().includes(lowerQuery);
            const tagMatch = (entry.tags || []).some(t => t.toLowerCase().includes(lowerQuery));

            if (!titleMatch && !contentMatch && !tagMatch) return null;

            return {
                entry,
                titleMatch,
                contentMatch,
                tagMatch,
                preview: contentMatch ? getSearchContextPreview(entry.content, query) : ''
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            // Titel-Treffer zuerst
            if (a.titleMatch && !b.titleMatch) return -1;
            if (!a.titleMatch && b.titleMatch) return 1;
            return a.entry.title.localeCompare(b.entry.title);
        })
        .slice(0, 8);

    if (!results.length) {
        container.innerHTML = '<div class="search-result-empty">Keine Treffer</div>';
        container.style.display = 'block';
        return;
    }

    container.innerHTML = results.map((r, i) => {
        const cat = WIKI_CATEGORIES[r.entry.category] || { icon: '📄' };
        const highlightedTitle = esc(r.entry.title).replace(
            new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
            '<mark>$1</mark>'
        );

        return `
            <div class="search-result-item ${i === WikiState.searchDropdownIndex ? 'selected' : ''}"
                 data-action="select-wiki-entry" data-id="${r.entry.id}">
                <div class="search-result-header">
                    <span class="search-result-icon">${cat.icon}</span>
                    <span class="search-result-title">${highlightedTitle}</span>
                    ${r.tagMatch ? '<span class="search-result-badge">Tag</span>' : ''}
                </div>
                ${r.preview ? `<div class="search-result-preview">${r.preview}</div>` : ''}
            </div>
        `;
    }).join('');

    container.style.display = 'block';
}

function handleWikiSearchKeydown(e) {
    const dropdown = $('wiki-search-dropdown');
    if (!dropdown || dropdown.style.display === 'none') return;

    const items = dropdown.querySelectorAll('.search-result-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        WikiState.searchDropdownIndex = Math.min(WikiState.searchDropdownIndex + 1, items.length - 1);
        updateSearchDropdownSelection(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        WikiState.searchDropdownIndex = Math.max(WikiState.searchDropdownIndex - 1, 0);
        updateSearchDropdownSelection(items);
    } else if (e.key === 'Enter' && WikiState.searchDropdownIndex >= 0) {
        e.preventDefault();
        const selected = items[WikiState.searchDropdownIndex];
        if (selected) {
            const id = parseInt(selected.dataset.id);
            selectWikiEntry(id);
            dropdown.style.display = 'none';
            $('wiki-search').value = '';
            WikiState.searchDropdownIndex = -1;
        }
    } else if (e.key === 'Escape') {
        dropdown.style.display = 'none';
        WikiState.searchDropdownIndex = -1;
    }
}

function updateSearchDropdownSelection(items) {
    items.forEach((item, i) => {
        item.classList.toggle('selected', i === WikiState.searchDropdownIndex);
    });
    if (WikiState.searchDropdownIndex >= 0 && items[WikiState.searchDropdownIndex]) {
        items[WikiState.searchDropdownIndex].scrollIntoView({ block: 'nearest' });
    }
}

// 4. TABLE OF CONTENTS (TOC)
// ============================================================

function extractWikiTOC(content) {
    if (!content) return [];

    const headings = [];
    const regex = /<h([2-4])[^>]*>([^<]+)<\/h[2-4]>/gi;
    let match;
    let index = 0;

    while ((match = regex.exec(content)) !== null) {
        headings.push({
            level: parseInt(match[1]),
            text: match[2].trim(),
            id: `toc-${index++}`
        });
    }

    return headings;
}

function renderWikiTOC(content) {
    const headings = extractWikiTOC(content);
    if (headings.length < 3) return ''; // Nur bei genug Überschriften anzeigen

    let html = '<div class="wiki-toc">';
    html += '<div class="wiki-toc-title">📋 Inhalt</div>';

    headings.forEach(h => {
        const levelClass = `level-${h.level - 2}`; // h2=0, h3=1, h4=2
        html += `<div class="toc-item ${levelClass}" data-action="wiki-toc-jump" data-target="${h.id}">${esc(h.text)}</div>`;
    });

    html += '</div>';
    return html;
}

function addTOCAnchors(content) {
    if (!content) return content;

    let index = 0;
    return content.replace(/<h([2-4])([^>]*)>([^<]+)<\/h[2-4]>/gi, (match, level, attrs, text) => {
        return `<h${level}${attrs} id="toc-${index++}">${text}</h${level}>`;
    });
}

function scrollToTOCHeading(targetId) {
    const heading = document.getElementById(targetId);
    if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Kurz highlighten
        heading.style.background = 'rgba(255, 215, 0, 0.3)';
        setTimeout(() => heading.style.background = '', 1500);
    }
}

// 5. WIKI TEMPLATES
// ============================================================

function renderWikiTemplateSelector() {
    let html = '<div class="wiki-templates-grid">';

    Object.entries(WIKI_TEMPLATES).forEach(([key, template]) => {
        html += `
            <div class="wiki-template-card" data-action="apply-wiki-template" data-template="${key}">
                <div class="wiki-template-icon">${template.icon}</div>
                <div class="wiki-template-name">${template.name}</div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

function applyWikiTemplate(templateKey) {
    const template = WIKI_TEMPLATES[templateKey];
    if (!template) return;

    const contentEl = $('wiki-content');
    const categoryEl = $('wiki-category');

    if (contentEl) {
        // Nur anwenden wenn leer oder nach Bestätigung
        if (contentEl.innerHTML.trim() && !confirm('Vorhandenen Inhalt überschreiben?')) {
            return;
        }
        contentEl.innerHTML = sanitizeHTML(template.content);
    }

    if (categoryEl && template.category) {
        categoryEl.value = template.category;
        updateWikiParentSelect();
    }

    showToast(`📝 Template "${template.name}" angewendet`);
}

// 6. LINK AUTO-SUGGEST
// ============================================================

// Link-Suggester State ist jetzt in WikiState gekapselt

function showWikiLinkSuggester(input, cursorPos) {
    const container = $('wiki-link-suggester');
    if (!container) return;

    const suggestions = (D.wiki || [])
        .filter(e => {
            if (!input) return true;
            return e.title.toLowerCase().includes(input.toLowerCase());
        })
        .slice(0, 6);

    if (!suggestions.length) {
        hideWikiLinkSuggester();
        return;
    }

    // Selection-State speichern BEVOR wir klicken
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
            const text = textNode.textContent;
            const beforeCursor = text.slice(0, range.startOffset);
            const linkStart = beforeCursor.lastIndexOf('[[');
            if (linkStart !== -1) {
                WikiState.linkSuggesterState = {
                    textNode: textNode,
                    linkStart: linkStart,
                    cursorPos: range.startOffset
                };
            }
        }
    }

    container.innerHTML = suggestions.map((entry, i) => {
        const cat = WIKI_CATEGORIES[entry.category] || { icon: '📄' };
        return `
            <div class="link-suggestion ${i === WikiState.linkSuggesterIndex ? 'selected' : ''}"
                 data-action="insert-wiki-link-suggestion" data-title="${esc(entry.title)}">
                <span class="link-suggestion-icon">${cat.icon}</span>
                <span class="link-suggestion-title">${esc(entry.title)}</span>
            </div>
        `;
    }).join('');

    // Position near cursor - nach oben öffnen wenn unten kein Platz
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const dropdownHeight = Math.min(suggestions.length * 36, 250); // ca. 36px pro Item
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Nach oben öffnen wenn unten weniger als 150px Platz
        if (spaceBelow < 150 && spaceAbove > dropdownHeight) {
            container.style.top = 'auto';
            container.style.bottom = (window.innerHeight - rect.top + 5) + 'px';
        } else {
            container.style.bottom = 'auto';
            container.style.top = (rect.bottom + window.scrollY + 5) + 'px';
        }
        container.style.left = Math.max(10, rect.left) + 'px';
    }

    container.style.display = 'block';
    WikiState.linkSuggester = { input, cursorPos };
}

function hideWikiLinkSuggester() {
    const container = $('wiki-link-suggester');
    if (container) container.style.display = 'none';
    WikiState.linkSuggester = null;
    WikiState.linkSuggesterIndex = -1;
    // State NICHT löschen - wird noch für insertWikiLinkSuggestion gebraucht
}

function insertWikiLinkSuggestion(title) {
    const contentEl = $('wiki-content');
    if (!contentEl) return;

    // Nutze gespeicherten State (Klick hat Fokus verändert)
    if (WikiState.linkSuggesterState && WikiState.linkSuggesterState.textNode) {
        const { textNode, linkStart, cursorPos } = WikiState.linkSuggesterState;

        try {
            const text = textNode.textContent;
            const before = text.slice(0, linkStart);
            const after = text.slice(cursorPos);
            textNode.textContent = before + `[[${title}]]` + after;

            // Cursor nach dem eingefügten Link setzen
            const newPos = linkStart + title.length + 4;
            const range = document.createRange();
            const selection = window.getSelection();
            range.setStart(textNode, Math.min(newPos, textNode.textContent.length));
            range.setEnd(textNode, Math.min(newPos, textNode.textContent.length));
            selection.removeAllRanges();
            selection.addRange(range);

            // Fokus zurück auf Editor
            contentEl.focus();
        } catch (e) {
            console.warn('Link insertion failed:', e);
        }
    }

    // State löschen
    WikiState.linkSuggesterState = null;
    hideWikiLinkSuggester();
}

function handleWikiContentInput(e) {
    const contentEl = $('wiki-content');
    if (!contentEl) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    if (textNode.nodeType !== Node.TEXT_NODE) {
        hideWikiLinkSuggester();
        return;
    }

    const text = textNode.textContent;
    const cursorPos = range.startOffset;
    const beforeCursor = text.slice(0, cursorPos);

    // Prüfe ob wir in einem [[ ... sind
    const linkStart = beforeCursor.lastIndexOf('[[');
    const linkEnd = beforeCursor.lastIndexOf(']]');

    if (linkStart !== -1 && linkStart > linkEnd) {
        // Wir sind in einem offenen [[
        const partialInput = beforeCursor.slice(linkStart + 2);
        showWikiLinkSuggester(partialInput, cursorPos);
    } else {
        hideWikiLinkSuggester();
    }
}

// ============================================================