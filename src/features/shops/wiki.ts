// [SECTION:WIKI]
// Extrahiert aus shops.js
// Wiki-System
// Zeilen: 1,316

import { $, esc, sanitizeHTML } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { saveUndoState } from '@systems/undo';
import { EntityLookup } from '@render/helpers';

// ============================================================
// TYPES
// ============================================================

interface WikiCategory {
    icon: string;
    name: string;
}

interface WikiTemplate {
    icon: string;
    name: string;
    category: string;
    content: string;
}

interface WikiSearchResult {
    entry: any;
    titleMatch: boolean;
    contentMatch: boolean;
    tagMatch: boolean;
    preview: string;
}

interface WikiTOCItem {
    level: number;
    text: string;
    id: string;
}

interface WikiBreadcrumbItem {
    id: number;
    title: string;
    category: string;
}

interface LinkSuggesterState {
    textNode: Text;
    linkStart: number;
    cursorPos: number;
}

// ============================================================
// STATE
// ============================================================

const WikiState: {
    categoryFilter: string;
    sortMode: string;
    expandedEntries: Set<number>;
    expandedCategories: Set<string>;
    selectedEntryId: number | null;
    searchDropdownIndex: number;
    linkSuggester: { input: string; cursorPos: number } | null;
    linkSuggesterIndex: number;
    linkSuggesterState: LinkSuggesterState | null;
} = {
    categoryFilter: '',
    sortMode: 'recent',
    expandedEntries: new Set(),
    expandedCategories: new Set(['campaign', 'locations', 'factions', 'history']),
    selectedEntryId: null,
    searchDropdownIndex: -1,
    linkSuggester: null,
    linkSuggesterIndex: -1,
    linkSuggesterState: null
};

// ============================================================
// CONSTANTS
// ============================================================

const WIKI_CATEGORIES: Readonly<Record<string, WikiCategory>> = Object.freeze({
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

const WIKI_TEMPLATES: Readonly<Record<string, WikiTemplate>> = Object.freeze({
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

export function renderWiki(): void {
    renderWikiQuickAccess();
    renderWikiTree();
    renderWikiDetail();

    const D = (window as any).D;
    const countEl = $('wiki-io-count');
    if (countEl) countEl.textContent = String(D.wiki?.length || 0);

    updateWikiParentSelect();
}

export function renderWikiQuickAccess(): void {
    const D = (window as any).D;
    const container = $('wiki-quick-access');
    if (!container) return;

    const recentIds = D.wikiRecentlyViewed || [];
    const favorites = (D.wiki || []).filter((e: any) => e.pinned);

    if (!recentIds.length && !favorites.length) {
        container.innerHTML = '<span style="color: var(--text-dim); font-size: 11px;">Besuche Einträge um Quick Access zu füllen</span>';
        return;
    }

    let html = '';

    if (favorites.length) {
        favorites.slice(0, 5).forEach((entry: any) => {
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

    const favoriteIds = new Set(favorites.map((f: any) => f.id));
    recentIds.filter((id: number) => !favoriteIds.has(id)).slice(0, 5).forEach((id: number) => {
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

export function renderWikiTree(): void {
    const D = (window as any).D;
    const tree = $('wiki-tree');
    if (!tree) return;

    const searchInput = $('wiki-search') as HTMLInputElement | null;
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

    const byCategory: Record<string, any[]> = {};
    Object.keys(WIKI_CATEGORIES).forEach(cat => {
        byCategory[cat] = [];
    });
    byCategory['other'] = [];

    let entries = [...D.wiki];

    if (search) {
        entries = entries.filter((e: any) =>
            e.title.toLowerCase().includes(search) ||
            (e.content || '').toLowerCase().includes(search) ||
            (e.tags || []).some((t: string) => t.toLowerCase().includes(search))
        );
    }

    entries.forEach((entry: any) => {
        const cat = entry.category || 'other';
        if (byCategory[cat]) {
            byCategory[cat].push(entry);
        } else {
            byCategory['other'].push(entry);
        }
    });

    Object.keys(byCategory).forEach(cat => {
        byCategory[cat].sort((a: any, b: any) => {
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

        const catEntryIds = new Set(catEntries.map((e: any) => e.id));
        const rootEntries = catEntries.filter((e: any) =>
            !e.parentId ||
            e.parentId === e.id ||
            !catEntryIds.has(e.parentId)
        );
        const childrenMap: Record<number, any[]> = {};
        catEntries.forEach((e: any) => {
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
        const otherRootEntries = byCategory['other'].filter((e: any) => !e.parentId);
        const otherChildrenMap: Record<number, any[]> = {};
        byCategory['other'].forEach((e: any) => {
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

function renderWikiTreeItems(entries: any[], childrenMap: Record<number, any[]>, depth: number): string {
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

function renderWikiTreeItem(entry: any, childrenMap: Record<number, any[]>, depth: number): string {
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

export function renderWikiDetail(): void {
    const D = (window as any).D;
    const renderEmptyState = (window as any).renderEmptyState;
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

    const entry = D.wiki?.find((e: any) => e.id === WikiState.selectedEntryId);
    if (!entry) {
        WikiState.selectedEntryId = null;
        renderWikiDetail();
        return;
    }

    const cat = WIKI_CATEGORIES[entry.category] || { icon: '📄', name: 'Sonstiges' };
    const tags = entry.tags || [];
    const contentWithAnchors = addTOCAnchors(entry.content || '');
    const parsedContent = parseWikiLinks(contentWithAnchors);
    const backlinks = findBacklinks(entry.title);
    const outlinks = extractWikiLinks(entry.content || '');

    const breadcrumb = renderWikiBreadcrumb(entry.id);
    const toc = renderWikiTOC(entry.content || '');

    const plainText = (entry.content || '').replace(/<[^>]+>/g, ' ');
    const wordCount = plainText.split(/\s+/).filter((w: string) => w.length > 0).length;

    const children = D.wiki.filter((e: any) => e.parentId === entry.id);

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
                ${tags.map((t: string) => `<span class="wiki-tag" data-action="search-wiki-tag" data-value="${esc(t)}">${esc(t)}</span>`).join('')}
            </div>
        ` : ''}

        ${children.length ? `
            <div class="wiki-detail-links">
                <div class="wiki-detail-links-section">
                    <div class="wiki-detail-links-label">📁 Untereinträge (${children.length})</div>
                    <div class="wiki-detail-links-list">
                        ${children.map((c: any) => `<span class="wiki-link" data-action="select-wiki-entry" data-id="${c.id}">${esc(c.title)}</span>`).join('')}
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
                            ${outlinks.map((link: string) => {
                                const exists = D.wiki.some((e: any) => e.title.toLowerCase() === link.toLowerCase());
                                return `<span class="wiki-link ${exists ? '' : 'missing'}" data-action="wiki-link-click" data-value="${esc(link)}" data-exists="${exists}">${esc(link)}</span>`;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                ${backlinks.length ? `
                    <div class="wiki-detail-links-section">
                        <div class="wiki-detail-links-label">← Verlinkt von</div>
                        <div class="wiki-detail-links-list">
                            ${backlinks.map((link: string) => `<span class="wiki-link" data-action="navigate-wiki-entry" data-value="${esc(link)}">${esc(link)}</span>`).join('')}
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

// ============================================================
// WIKI CRUD
// ============================================================

export function selectWikiEntry(id: number): void {
    WikiState.selectedEntryId = id;
    if (id) {
        addToWikiRecentlyViewed(id);
    }
    const dropdown = $('wiki-search-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    renderWiki();
}

export function toggleWikiCategory(category: string): void {
    if (WikiState.expandedCategories.has(category)) {
        WikiState.expandedCategories.delete(category);
    } else {
        WikiState.expandedCategories.add(category);
    }
    renderWikiTree();
}

export function expandAllWikiCategories(): void {
    Object.keys(WIKI_CATEGORIES).forEach(cat => WikiState.expandedCategories.add(cat));
    WikiState.expandedCategories.add('other');
    renderWikiTree();
    showToast('Alle Kategorien ausgeklappt');
}

export function collapseAllWikiCategories(): void {
    WikiState.expandedCategories.clear();
    renderWikiTree();
    showToast('Alle Kategorien eingeklappt');
}

export function showWikiForm(parentCategory: string = ''): void {
    const showModal = (window as any).showModal;
    cancelWikiEdit();
    const catInput = $('wiki-category') as HTMLSelectElement | null;
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

export function hideWikiForm(): void {
    const overlay = $('wiki-form-overlay');
    if (overlay) overlay.style.display = 'none';
    cancelWikiEdit();
}

export function updateWikiParentSelect(): void {
    const D = (window as any).D;
    const select = $('wiki-parent') as HTMLSelectElement | null;
    if (!select) return;

    const editIdInput = $('edit-wiki-id') as HTMLInputElement | null;
    const catInput = $('wiki-category') as HTMLSelectElement | null;
    const editId = editIdInput?.value || '';
    const currentId = editId ? parseInt(editId) : null;
    const selectedCategory = catInput?.value || '';

    const previousValue = select.value;

    select.innerHTML = '<option value="">— Kein übergeordneter Eintrag —</option>';

    (D.wiki || []).forEach((entry: any) => {
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

export function initWikiCategoryListener(): void {
    const categorySelect = $('wiki-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            updateWikiParentSelect();
            const parentSelect = $('wiki-parent') as HTMLSelectElement | null;
            if (parentSelect) parentSelect.value = '';
        });
    }
}

function isDescendantOf(entryId: number, potentialAncestorId: number | null): boolean {
    const D = (window as any).D;
    if (!potentialAncestorId) return false;
    const entry = D.wiki?.find((e: any) => e.id === entryId);
    if (!entry || !entry.parentId) return false;
    if (entry.parentId === potentialAncestorId) return true;
    return isDescendantOf(entry.parentId, potentialAncestorId);
}

export function parseWikiLinks(content: string): string {
    const D = (window as any).D;
    return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
        const exists = D.wiki?.some((e: any) => e.title.toLowerCase() === linkText.toLowerCase());
        const escapedText = linkText.replace(/"/g, '&quot;');
        return `<span class="wiki-link ${exists ? '' : 'missing'}" data-action="wiki-link-click-stop" data-value="${escapedText}" data-exists="${exists}">${linkText}</span>`;
    });
}

export function extractWikiLinks(content: string): string[] {
    const matches = content.match(/\[\[([^\]]+)\]\]/g) || [];
    return [...new Set(matches.map(m => m.slice(2, -2)))];
}

export function findBacklinks(title: string): string[] {
    const D = (window as any).D;
    if (!D.wiki) return [];
    return D.wiki
        .filter((e: any) => e.content && e.content.toLowerCase().includes(`[[${title.toLowerCase()}]]`))
        .map((e: any) => e.title);
}

export function toggleWikiEntry(id: number): void {
    if (WikiState.expandedEntries.has(id)) {
        WikiState.expandedEntries.delete(id);
    } else {
        WikiState.expandedEntries.add(id);
    }
    renderWiki();
}

export function filterWiki(category: string): void {
    WikiState.categoryFilter = category;
    document.querySelectorAll('#wiki-categories .filter-btn').forEach(btn => {
        btn.classList.toggle('active', (btn as HTMLElement).dataset.cat === category);
    });
    renderWiki();
}

export function sortWiki(mode: string): void {
    WikiState.sortMode = mode;
    ['alpha', 'recent', 'pinned'].forEach(m => {
        const btn = $(`wiki-sort-${m}`);
        if (btn) btn.classList.toggle('active', m === mode);
    });
    renderWiki();
}

export function saveWikiEntry(): void {
    const D = (window as any).D;
    const nextId = (window as any).nextId;

    const titleInput = $('wiki-title') as HTMLInputElement | null;
    const title = titleInput?.value.trim() || '';
    if (!title) {
        showToast('⚠️ Titel erforderlich', 'error');
        return;
    }

    const editIdInput = $('edit-wiki-id') as HTMLInputElement | null;
    const editId = editIdInput?.value || '';
    const parentInput = $('wiki-parent') as HTMLSelectElement | null;
    const parentVal = parentInput?.value || '';
    const catInput = $('wiki-category') as HTMLSelectElement | null;
    const contentEl = $('wiki-content');
    const tagsInput = $('wiki-tags') as HTMLInputElement | null;
    const pinnedInput = $('wiki-pinned') as HTMLInputElement | null;

    const entry: any = {
        title,
        category: catInput?.value || 'locations',
        content: contentEl ? sanitizeHTML(contentEl.innerHTML) : '',
        tags: tagsInput?.value.split(',').map(t => t.trim()).filter(t => t) || [],
        pinned: pinnedInput?.checked || false,
        parentId: parentVal ? parseInt(parentVal) : null,
        updatedAt: Date.now()
    };

    if (editId) {
        const idx = D.wiki.findIndex((e: any) => e.id === parseInt(editId));
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

export function editWikiEntry(id: number): void {
    const showModal = (window as any).showModal;
    const entry = EntityLookup.wiki(id);
    if (!entry) return;

    const editIdInput = $('edit-wiki-id') as HTMLInputElement | null;
    const titleInput = $('wiki-title') as HTMLInputElement | null;
    const catInput = $('wiki-category') as HTMLSelectElement | null;
    const contentEl = $('wiki-content');
    const tagsInput = $('wiki-tags') as HTMLInputElement | null;
    const pinnedInput = $('wiki-pinned') as HTMLInputElement | null;

    if (editIdInput) editIdInput.value = String(id);
    if (titleInput) titleInput.value = entry.title;
    if (catInput) catInput.value = entry.category || 'locations';
    if (contentEl) contentEl.innerHTML = sanitizeHTML(entry.content) || '';
    if (tagsInput) tagsInput.value = (entry.tags || []).join(', ');
    if (pinnedInput) pinnedInput.checked = entry.pinned || false;

    updateWikiParentSelect();

    const parentInput = $('wiki-parent') as HTMLSelectElement | null;
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

export function cancelWikiEdit(): void {
    clearWikiForm();
}

function clearWikiForm(): void {
    const editIdInput = $('edit-wiki-id') as HTMLInputElement | null;
    const titleInput = $('wiki-title') as HTMLInputElement | null;
    const catInput = $('wiki-category') as HTMLSelectElement | null;
    const contentEl = $('wiki-content');
    const tagsInput = $('wiki-tags') as HTMLInputElement | null;
    const pinnedInput = $('wiki-pinned') as HTMLInputElement | null;
    const parentInput = $('wiki-parent') as HTMLSelectElement | null;

    if (editIdInput) editIdInput.value = '';
    if (titleInput) titleInput.value = '';
    if (catInput) catInput.value = 'locations';
    if (contentEl) contentEl.innerHTML = '';
    if (tagsInput) tagsInput.value = '';
    if (pinnedInput) pinnedInput.checked = false;
    if (parentInput) parentInput.value = '';
}

export function deleteWikiEntry(id: number): void {
    const D = (window as any).D;
    if (confirm('Wiki-Eintrag löschen?')) {
        saveUndoState();

        D.wiki.forEach((e: any) => {
            if (e.parentId === id) e.parentId = null;
        });

        D.wiki = D.wiki.filter((e: any) => e.id !== id);
        WikiState.expandedEntries.delete(id);

        if (WikiState.selectedEntryId === id) {
            WikiState.selectedEntryId = null;
        }

        renderWiki();
        save();
        showToast('Wiki-Eintrag gelöscht');
    }
}

export function toggleWikiPin(id: number): void {
    const entry = EntityLookup.wiki(id);
    if (!entry) return;
    entry.pinned = !entry.pinned;
    renderWiki();
    save();
    showToast(entry.pinned ? '📌 Eintrag gepinnt' : '📍 Eintrag entpinnt');
}

export function navigateToWikiEntry(title: string): void {
    const entry = EntityLookup.findByName('wiki', title, 'title');
    if (entry) {
        WikiState.expandedCategories.add(entry.category || 'other');
        selectWikiEntry(entry.id);
    }
}

export function createWikiFromLink(title: string): void {
    if (confirm(`Wiki-Eintrag "${title}" existiert noch nicht. Jetzt erstellen?`)) {
        showWikiForm();
        const titleInput = $('wiki-title') as HTMLInputElement | null;
        const contentEl = $('wiki-content');
        if (titleInput) titleInput.value = title;
        if (contentEl) contentEl.focus();
    }
}

export function searchWikiTag(tag: string): void {
    const searchInput = $('wiki-search') as HTMLInputElement | null;
    if (searchInput) searchInput.value = tag;
    renderWiki();
}

export function insertWikiLink(): void {
    const title = prompt('Wiki-Link einfügen:', '');
    if (title) {
        document.execCommand('insertText', false, `[[${title}]]`);
    }
}

// ============================================================
// WIKI UX IMPROVEMENTS
// ============================================================

function addToWikiRecentlyViewed(id: number): void {
    const D = (window as any).D;
    if (!id) return;
    D.wikiRecentlyViewed = D.wikiRecentlyViewed || [];
    D.wikiRecentlyViewed = D.wikiRecentlyViewed.filter((i: number) => i !== id);
    D.wikiRecentlyViewed.unshift(id);
    if (D.wikiRecentlyViewed.length > 10) {
        D.wikiRecentlyViewed = D.wikiRecentlyViewed.slice(0, 10);
    }
    save();
}

function getWikiBreadcrumb(entryId: number): WikiBreadcrumbItem[] {
    const path: WikiBreadcrumbItem[] = [];
    let currentId: number | null = entryId;
    const visited = new Set<number>();

    while (currentId) {
        if (visited.has(currentId)) break;
        visited.add(currentId);

        const entry = EntityLookup.wiki(currentId);
        if (!entry) break;

        path.unshift({ id: entry.id, title: entry.title, category: entry.category });
        currentId = entry.parentId;
    }

    return path;
}

function renderWikiBreadcrumb(entryId: number): string {
    const path = getWikiBreadcrumb(entryId);
    if (path.length <= 1) return '';

    const entry = EntityLookup.wiki(entryId);
    const cat = entry ? WIKI_CATEGORIES[entry.category] : null;

    let html = '<div class="wiki-breadcrumb">';

    if (cat) {
        html += `<span class="breadcrumb-item category">${cat.icon} ${cat.name}</span>`;
        html += '<span class="breadcrumb-separator">›</span>';
    }

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

function getSearchContextPreview(content: string, query: string, maxLength: number = 80): string {
    if (!content || !query) return '';

    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const lowerContent = plainText.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerContent.indexOf(lowerQuery);

    if (idx === -1) return '';

    const start = Math.max(0, idx - 30);
    const end = Math.min(plainText.length, idx + query.length + 50);
    let preview = plainText.slice(start, end);

    if (start > 0) preview = '...' + preview;
    if (end < plainText.length) preview = preview + '...';

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    preview = esc(preview).replace(regex, '<mark>$1</mark>');

    return preview;
}

export function renderWikiSearchDropdown(query: string): void {
    const D = (window as any).D;
    const container = $('wiki-search-dropdown');
    if (!container) return;

    if (!query || query.length < 2) {
        container.style.display = 'none';
        WikiState.searchDropdownIndex = -1;
        return;
    }

    const lowerQuery = query.toLowerCase();
    const results = (D.wiki || [])
        .map((entry: any) => {
            const titleMatch = entry.title.toLowerCase().includes(lowerQuery);
            const contentMatch = (entry.content || '').toLowerCase().includes(lowerQuery);
            const tagMatch = (entry.tags || []).some((t: string) => t.toLowerCase().includes(lowerQuery));

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
        .sort((a: WikiSearchResult, b: WikiSearchResult) => {
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

    container.innerHTML = results.map((r: WikiSearchResult, i: number) => {
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

export function handleWikiSearchKeydown(e: KeyboardEvent): void {
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
        const selected = items[WikiState.searchDropdownIndex] as HTMLElement;
        if (selected) {
            const id = parseInt(selected.dataset.id || '0');
            selectWikiEntry(id);
            dropdown.style.display = 'none';
            const searchInput = $('wiki-search') as HTMLInputElement | null;
            if (searchInput) searchInput.value = '';
            WikiState.searchDropdownIndex = -1;
        }
    } else if (e.key === 'Escape') {
        dropdown.style.display = 'none';
        WikiState.searchDropdownIndex = -1;
    }
}

function updateSearchDropdownSelection(items: NodeListOf<Element>): void {
    items.forEach((item, i) => {
        item.classList.toggle('selected', i === WikiState.searchDropdownIndex);
    });
    if (WikiState.searchDropdownIndex >= 0 && items[WikiState.searchDropdownIndex]) {
        items[WikiState.searchDropdownIndex].scrollIntoView({ block: 'nearest' });
    }
}

function extractWikiTOC(content: string): WikiTOCItem[] {
    if (!content) return [];

    const headings: WikiTOCItem[] = [];
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

function renderWikiTOC(content: string): string {
    const headings = extractWikiTOC(content);
    if (headings.length < 3) return '';

    let html = '<div class="wiki-toc">';
    html += '<div class="wiki-toc-title">📋 Inhalt</div>';

    headings.forEach(h => {
        const levelClass = `level-${h.level - 2}`;
        html += `<div class="toc-item ${levelClass}" data-action="wiki-toc-jump" data-target="${h.id}">${esc(h.text)}</div>`;
    });

    html += '</div>';
    return html;
}

function addTOCAnchors(content: string): string {
    if (!content) return content;

    let index = 0;
    return content.replace(/<h([2-4])([^>]*)>([^<]+)<\/h[2-4]>/gi, (match, level, attrs, text) => {
        return `<h${level}${attrs} id="toc-${index++}">${text}</h${level}>`;
    });
}

export function scrollToTOCHeading(targetId: string): void {
    const heading = document.getElementById(targetId);
    if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        heading.style.background = 'rgba(255, 215, 0, 0.3)';
        setTimeout(() => heading.style.background = '', 1500);
    }
}

function renderWikiTemplateSelector(): string {
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

export function applyWikiTemplate(templateKey: string): void {
    const template = WIKI_TEMPLATES[templateKey];
    if (!template) return;

    const contentEl = $('wiki-content');
    const categoryEl = $('wiki-category') as HTMLSelectElement | null;

    if (contentEl) {
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

export function showWikiLinkSuggester(input: string, cursorPos: number): void {
    const D = (window as any).D;
    const container = $('wiki-link-suggester');
    if (!container) return;

    const suggestions = (D.wiki || [])
        .filter((e: any) => {
            if (!input) return true;
            return e.title.toLowerCase().includes(input.toLowerCase());
        })
        .slice(0, 6);

    if (!suggestions.length) {
        hideWikiLinkSuggester();
        return;
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
            const text = (textNode as Text).textContent || '';
            const beforeCursor = text.slice(0, range.startOffset);
            const linkStart = beforeCursor.lastIndexOf('[[');
            if (linkStart !== -1) {
                WikiState.linkSuggesterState = {
                    textNode: textNode as Text,
                    linkStart: linkStart,
                    cursorPos: range.startOffset
                };
            }
        }
    }

    container.innerHTML = suggestions.map((entry: any, i: number) => {
        const cat = WIKI_CATEGORIES[entry.category] || { icon: '📄' };
        return `
            <div class="link-suggestion ${i === WikiState.linkSuggesterIndex ? 'selected' : ''}"
                 data-action="insert-wiki-link-suggestion" data-title="${esc(entry.title)}">
                <span class="link-suggestion-icon">${cat.icon}</span>
                <span class="link-suggestion-title">${esc(entry.title)}</span>
            </div>
        `;
    }).join('');

    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const dropdownHeight = Math.min(suggestions.length * 36, 250);
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

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

export function hideWikiLinkSuggester(): void {
    const container = $('wiki-link-suggester');
    if (container) container.style.display = 'none';
    WikiState.linkSuggester = null;
    WikiState.linkSuggesterIndex = -1;
}

export function insertWikiLinkSuggestion(title: string): void {
    const contentEl = $('wiki-content');
    if (!contentEl) return;

    if (WikiState.linkSuggesterState && WikiState.linkSuggesterState.textNode) {
        const { textNode, linkStart, cursorPos } = WikiState.linkSuggesterState;

        try {
            const text = textNode.textContent || '';
            const before = text.slice(0, linkStart);
            const after = text.slice(cursorPos);
            textNode.textContent = before + `[[${title}]]` + after;

            const newPos = linkStart + title.length + 4;
            const range = document.createRange();
            const selection = window.getSelection();
            range.setStart(textNode, Math.min(newPos, textNode.textContent.length));
            range.setEnd(textNode, Math.min(newPos, textNode.textContent.length));
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }

            contentEl.focus();
        } catch (e) {
            console.warn('Link insertion failed:', e);
        }
    }

    WikiState.linkSuggesterState = null;
    hideWikiLinkSuggester();
}

export function handleWikiContentInput(e: Event): void {
    const contentEl = $('wiki-content');
    if (!contentEl) return;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    if (textNode.nodeType !== Node.TEXT_NODE) {
        hideWikiLinkSuggester();
        return;
    }

    const text = (textNode as Text).textContent || '';
    const cursorPos = range.startOffset;
    const beforeCursor = text.slice(0, cursorPos);

    const linkStart = beforeCursor.lastIndexOf('[[');
    const linkEnd = beforeCursor.lastIndexOf(']]');

    if (linkStart !== -1 && linkStart > linkEnd) {
        const partialInput = beforeCursor.slice(linkStart + 2);
        showWikiLinkSuggester(partialInput, cursorPos);
    } else {
        hideWikiLinkSuggester();
    }
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).WIKI_CATEGORIES = WIKI_CATEGORIES;
(window as any).WIKI_TEMPLATES = WIKI_TEMPLATES;
(window as any).renderWiki = renderWiki;
(window as any).renderWikiQuickAccess = renderWikiQuickAccess;
(window as any).renderWikiTree = renderWikiTree;
(window as any).renderWikiDetail = renderWikiDetail;
(window as any).selectWikiEntry = selectWikiEntry;
(window as any).toggleWikiCategory = toggleWikiCategory;
(window as any).expandAllWikiCategories = expandAllWikiCategories;
(window as any).collapseAllWikiCategories = collapseAllWikiCategories;
(window as any).showWikiForm = showWikiForm;
(window as any).hideWikiForm = hideWikiForm;
(window as any).updateWikiParentSelect = updateWikiParentSelect;
(window as any).initWikiCategoryListener = initWikiCategoryListener;
(window as any).parseWikiLinks = parseWikiLinks;
(window as any).extractWikiLinks = extractWikiLinks;
(window as any).findBacklinks = findBacklinks;
(window as any).toggleWikiEntry = toggleWikiEntry;
(window as any).filterWiki = filterWiki;
(window as any).sortWiki = sortWiki;
(window as any).saveWikiEntry = saveWikiEntry;
(window as any).editWikiEntry = editWikiEntry;
(window as any).cancelWikiEdit = cancelWikiEdit;
(window as any).deleteWikiEntry = deleteWikiEntry;
(window as any).toggleWikiPin = toggleWikiPin;
(window as any).navigateToWikiEntry = navigateToWikiEntry;
(window as any).createWikiFromLink = createWikiFromLink;
(window as any).searchWikiTag = searchWikiTag;
(window as any).insertWikiLink = insertWikiLink;
(window as any).renderWikiSearchDropdown = renderWikiSearchDropdown;
(window as any).handleWikiSearchKeydown = handleWikiSearchKeydown;
(window as any).scrollToTOCHeading = scrollToTOCHeading;
(window as any).applyWikiTemplate = applyWikiTemplate;
(window as any).showWikiLinkSuggester = showWikiLinkSuggester;
(window as any).hideWikiLinkSuggester = hideWikiLinkSuggester;
(window as any).insertWikiLinkSuggestion = insertWikiLinkSuggestion;
(window as any).handleWikiContentInput = handleWikiContentInput;
