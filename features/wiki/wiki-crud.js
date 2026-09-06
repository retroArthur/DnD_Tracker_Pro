// [SECTION:WIKI_CRUD]
// ============================================================
// WIKI UX IMPROVEMENTS
// ============================================================
function addToWikiRecentlyViewed(id) {
    const D = window.D;
    if (!id) return;
    D.wikiRecentlyViewed = D.wikiRecentlyViewed || [];
    D.wikiRecentlyViewed = D.wikiRecentlyViewed.filter(i => i !== id);
    D.wikiRecentlyViewed.unshift(id);
    if (D.wikiRecentlyViewed.length > 10) {
        D.wikiRecentlyViewed = D.wikiRecentlyViewed.slice(0, 10);
    }
    save();
}
function getWikiBreadcrumb(entryId) {
    const path = [];
    let currentId = entryId;
    const visited = new Set();
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
function renderWikiBreadcrumb(entryId) {
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
function getSearchContextPreview(content, query, maxLength = 80) {
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
function renderWikiSearchDropdown(query) {
    const D = window.D;
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
    container.innerHTML = results
        .map((r, i) => {
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
        })
        .join('');
    container.style.display = 'block';
}
function handleWikiSearchKeydown(e) {
    const dropdown = $('wiki-search-dropdown');
    if (!dropdown || dropdown.style.display === 'none') return;
    const items = dropdown.querySelectorAll('.search-result-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        WikiState.searchDropdownIndex = Math.min(
            WikiState.searchDropdownIndex + 1,
            items.length - 1
        );
        updateSearchDropdownSelection(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        WikiState.searchDropdownIndex = Math.max(WikiState.searchDropdownIndex - 1, 0);
        updateSearchDropdownSelection(items);
    } else if (e.key === 'Enter' && WikiState.searchDropdownIndex >= 0) {
        e.preventDefault();
        const selected = items[WikiState.searchDropdownIndex];
        if (selected) {
            const id = parseInt(selected.dataset.id || '0');
            selectWikiEntry(id);
            dropdown.style.display = 'none';
            const searchInput = $('wiki-search');
            if (searchInput) searchInput.value = '';
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
        heading.style.background = 'rgba(255, 215, 0, 0.3)';
        setTimeout(() => (heading.style.background = ''), 1500);
    }
}
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
function showWikiLinkSuggester(input, cursorPos) {
    const D = window.D;
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
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
            const text = textNode.textContent || '';
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
    container.innerHTML = suggestions
        .map((entry, i) => {
            const cat = WIKI_CATEGORIES[entry.category] || { icon: '📄' };
            return `
            <div class="link-suggestion ${i === WikiState.linkSuggesterIndex ? 'selected' : ''}"
                 data-action="insert-wiki-link-suggestion" data-title="${esc(entry.title)}">
                <span class="link-suggestion-icon">${cat.icon}</span>
                <span class="link-suggestion-title">${esc(entry.title)}</span>
            </div>
        `;
        })
        .join('');
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const dropdownHeight = Math.min(suggestions.length * 36, 250);
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < 150 && spaceAbove > dropdownHeight) {
            container.style.top = 'auto';
            container.style.bottom = window.innerHeight - rect.top + 5 + 'px';
        } else {
            container.style.bottom = 'auto';
            container.style.top = rect.bottom + window.scrollY + 5 + 'px';
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
}
function insertWikiLinkSuggestion(title) {
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
            if (window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler) {
                window.ErrorHandler.log('Link insertion', e);
            }
        }
    }
    WikiState.linkSuggesterState = null;
    hideWikiLinkSuggester();
}
function handleWikiContentInput(e) {
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
    const text = textNode.textContent || '';
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
window.renderWikiSearchDropdown = renderWikiSearchDropdown;
window.handleWikiSearchKeydown = handleWikiSearchKeydown;
window.scrollToTOCHeading = scrollToTOCHeading;
window.applyWikiTemplate = applyWikiTemplate;
window.insertWikiLinkSuggestion = insertWikiLinkSuggestion;
window.handleWikiContentInput = handleWikiContentInput;
