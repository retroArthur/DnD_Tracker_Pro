// [SECTION:RICH_TEXT_EDITOR]
// Was: features/shops/spell-editor.js, Now: ui/editors/rich-text.js
// Rich Text Editor with Floating Toolbar
// Zeilen: 1,492
// ============================================================
// STATE
// ============================================================
let currentSpellPage = 0;
let filteredSpellsCache = [];
const expandedSpells = new Set();
let editorSelectSavedRange = null;
let floatingToolbarTarget = null;
let floatingToolbarRange = null;
let hideFloatingToolbarTimeout = null;
let floatingToolbarInteracting = false;
let floatingToolbarInitialized = false;
let currentContextTable = null;
let currentContextLink = null;
let contextToolbarsInitialized = false;
let editorHandlersInitialized = false;
// ============================================================
// RENDER
// ============================================================
const debouncedRenderSpells = debounce(renderSpells, 200);
function renderSpells() {
    const D = window.D;
    const renderEmptyState = window.renderEmptyState;
    const currentSpellFilter = window.currentSpellFilter || 'all';
    const currentSpellLevelFilter = window.currentSpellLevelFilter || 'all';
    const currentSpellSchoolFilter = window.currentSpellSchoolFilter || 'all';
    const SPELLS_PER_PAGE = window.SPELLS_PER_PAGE || 30;
    const c = $('spell-list');
    const fb = $('spell-filters');
    const lfb = $('spell-level-filters');
    const sfb = $('spell-school-filters');
    const countEl = $('spell-count');
    if (!c)
        return;
    if (fb) {
        fb.innerHTML = ['all', 'spell', 'healing', 'damage', 'buff', 'debuff'].map(t => {
            const label = t === 'all' ? 'Alle' : t === 'spell' ? '🔵' : t === 'healing' ? '🟡' : t === 'damage' ? '🔴' : t === 'buff' ? '🟢' : '🟣';
            return `<div class="filter-chip ${currentSpellFilter === t ? 'active' : ''}" data-action="set-spell-filter" data-value="${t}" title="${t === 'all' ? 'Alle Typen' : t === 'spell' ? 'Zauber' : t === 'healing' ? 'Heilung' : t === 'damage' ? 'Schaden' : t === 'buff' ? 'Buff' : 'Debuff'}">${label}</div>`;
        }).join('');
    }
    if (lfb) {
        lfb.innerHTML = ['all', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(t => {
            const label = t === 'all' ? '∞' : t === '0' ? '🔮' : t;
            const title = t === 'all' ? 'Alle Stufen' : t === '0' ? 'Zaubertricks' : `Stufe ${t}`;
            return `<div class="filter-chip ${currentSpellLevelFilter === t ? 'active' : ''}" data-action="spell-level-filter" data-value="${t}" title="${title}">${label}</div>`;
        }).join('');
    }
    if (sfb) {
        const schools = ['all', 'Bannzauber', 'Beschwörung', 'Erkenntnis', 'Hervorrufung', 'Illusion', 'Nekromantie', 'Verwandlung', 'Verzauberung'];
        const schoolEmojis = {
            'all': '∞', 'Bannzauber': '🛡️', 'Beschwörung': '✨', 'Erkenntnis': '👁️',
            'Hervorrufung': '💥', 'Illusion': '🎭', 'Nekromantie': '💀', 'Verwandlung': '🔄', 'Verzauberung': '💫'
        };
        sfb.innerHTML = schools.map(s => {
            const label = schoolEmojis[s] || s.charAt(0);
            const title = s === 'all' ? 'Alle Schulen' : s;
            return `<div class="filter-chip ${currentSpellSchoolFilter === s ? 'active' : ''}" data-action="spell-school-filter" data-value="${s}" title="${title}">${label}</div>`;
        }).join('');
    }
    const searchInput = $('spell-search');
    const classFilterInput = $('spell-class-filter');
    const search = (searchInput?.value || '').toLowerCase().trim();
    const classFilter = classFilterInput?.value || '';
    let spells = D.spells || [];
    const totalCount = spells.length;
    spells = spells.filter((s) => {
        if (currentSpellFilter !== 'all' && s.type !== currentSpellFilter)
            return false;
        if (currentSpellLevelFilter !== 'all') {
            const lvl = parseInt(currentSpellLevelFilter);
            if (lvl === 0) {
                if (s.type !== 'cantrip' && s.level !== 0)
                    return false;
            }
            else {
                if (s.level !== lvl)
                    return false;
            }
        }
        if (currentSpellSchoolFilter !== 'all' && s.school !== currentSpellSchoolFilter)
            return false;
        if (search) {
            const name = (s.name || '').toLowerCase();
            const school = (s.school || '').toLowerCase();
            const desc = (s.description || '').toLowerCase();
            const material = (s.material || '').toLowerCase();
            const note = (s.note || '').toLowerCase();
            if (!name.includes(search) && !school.includes(search) &&
                !desc.includes(search) && !material.includes(search) &&
                !note.includes(search))
                return false;
        }
        if (classFilter) {
            const classes = s.spellClasses || [];
            if (!classes.includes(classFilter))
                return false;
        }
        return true;
    });
    if (countEl) {
        if (spells.length === totalCount) {
            countEl.textContent = `📖 ${totalCount}`;
        }
        else {
            countEl.textContent = `📖 ${spells.length}/${totalCount}`;
        }
    }
    const isFiltered = search || classFilter || currentSpellFilter !== 'all' || currentSpellLevelFilter !== 'all' || currentSpellSchoolFilter !== 'all';
    if (!spells.length) {
        c.innerHTML = renderEmptyState({
            icon: '✨',
            titleEmpty: 'Keine Zauber',
            descEmpty: 'Füge Zauber hinzu oder lade SRD-Zauber.',
            buttonText: '➕ Zauber erstellen',
            buttonAction: 'show-modal',
            buttonValue: 'spell-modal',
            isFiltered
        });
        return;
    }
    spells.sort((a, b) => {
        const lvlA = a.level ?? (a.type === 'cantrip' ? 0 : 99);
        const lvlB = b.level ?? (b.type === 'cantrip' ? 0 : 99);
        if (lvlA !== lvlB)
            return lvlA - lvlB;
        return (a.name || '').localeCompare(b.name || '');
    });
    filteredSpellsCache = spells;
    currentSpellPage = 0;
    if (spells.length > SPELLS_PER_PAGE) {
        const visibleSpells = spells.slice(0, SPELLS_PER_PAGE);
        c.innerHTML = renderSpellCards(visibleSpells) + renderLoadMoreButton(spells.length, SPELLS_PER_PAGE);
    }
    else {
        c.innerHTML = renderSpellCards(spells);
    }
}
function renderSpellCards(spells) {
    return spells.map(s => {
        const levelText = s.level === 0 || s.type === 'cantrip' ? 'Zaubertrick' : 'Grad ' + s.level;
        const classText = s.spellClasses?.length ? s.spellClasses.join(', ') : (s.spellClass || '');
        const isExpanded = expandedSpells.has(s.id);
        return `<div class="spell-card ${s.type} ${isExpanded ? 'expanded' : ''}" data-spell-id="${s.id}">
            <div class="spell-card-header" data-action="toggle-spell-card" data-id="${s.id}">
                <div style="flex: 1;">
                    <div class="spell-header">
                        <div class="spell-name">${esc(s.name)} ${s.ritual ? '<span style="color:var(--purple);">(R)</span>' : ''}</div>
                        <div class="spell-level">${levelText}</div>
                    </div>
                    <div class="spell-info-line classes">${esc(classText)}</div>
                    <div class="spell-info-line school">✨ ${esc(s.school || 'Unbekannt')}</div>
                </div>
                <span class="spell-card-toggle">▶</span>
            </div>
            <div class="spell-card-content">
                <div class="spell-meta">
                    <div class="spell-meta-item"><span class="spell-meta-label">Zeit:</span> <span class="spell-meta-value time">${esc(s.time || '—')}</span></div>
                    <div class="spell-meta-item"><span class="spell-meta-label">Reichw.:</span> <span class="spell-meta-value range">${esc(s.range || '—')}</span></div>
                </div>
                <div class="spell-duration-line"><span style="color:var(--cyan);">Dauer:</span> ${esc(s.duration || '—')}</div>
                <div class="spell-components">
                    ${s.ritual ? '<div class="spell-comp active ritual">R</div>' : ''}
                    <div class="spell-comp ${s.v ? 'active verbal' : 'inactive'}">V</div>
                    <div class="spell-comp ${s.g ? 'active gestik' : 'inactive'}">G</div>
                    <div class="spell-comp ${s.m ? 'active material' : 'inactive'}">M</div>
                </div>
                ${s.m && s.material ? `<div class="spell-material">📦 ${esc(s.material)}</div>` : ''}
                ${s.description ? `<div class="spell-desc">${sanitizeHTML(s.description)}</div>` : ''}
                ${s.note ? `<div class="spell-note">📝 ${sanitizeHTML(s.note)}</div>` : ''}
                <div class="btn-group">
                    <button class="btn btn-sm" data-action="edit-spell-stop" data-id="${s.id}">✏️ Bearbeiten</button>
                    <button class="btn btn-sm btn-danger" data-action="delete-spell-stop" data-id="${s.id}">🗑️ Löschen</button>
                </div>
            </div>
        </div>`;
    }).join('');
}
function renderLoadMoreButton(total, perPage) {
    const shown = Math.min((currentSpellPage + 1) * perPage, total);
    const remaining = total - shown;
    if (remaining <= 0)
        return '';
    return `<div class="load-more-container" style="grid-column: 1/-1; text-align: center; padding: 16px;">
        <button class="btn" data-action="call" data-value="loadMoreSpells">
            📜 ${remaining} weitere laden (${shown}/${total} angezeigt)
        </button>
    </div>`;
}
function loadMoreSpells() {
    const SPELLS_PER_PAGE = window.SPELLS_PER_PAGE || 30;
    const c = $('spell-list');
    if (!c || !filteredSpellsCache.length)
        return;
    currentSpellPage++;
    const start = 0;
    const end = (currentSpellPage + 1) * SPELLS_PER_PAGE;
    const visibleSpells = filteredSpellsCache.slice(start, end);
    c.innerHTML = renderSpellCards(visibleSpells) + renderLoadMoreButton(filteredSpellsCache.length, SPELLS_PER_PAGE);
}
function toggleSpellCard(id) {
    if (expandedSpells.has(id)) {
        expandedSpells.delete(id);
    }
    else {
        expandedSpells.add(id);
    }
    const card = document.querySelector(`.spell-card[data-spell-id="${id}"]`);
    if (card) {
        card.classList.toggle('expanded', expandedSpells.has(id));
    }
}
function expandAllSpells() {
    const D = window.D;
    (D.spells || []).forEach((s) => expandedSpells.add(s.id));
    renderSpells();
}
function collapseAllSpells() {
    expandedSpells.clear();
    renderSpells();
}
function setSpellFilter(f) {
    window.currentSpellFilter = f;
    renderSpells();
}
function setSpellLevelFilter(f) {
    window.currentSpellLevelFilter = f;
    renderSpells();
}
function setSpellSchoolFilter(f) {
    window.currentSpellSchoolFilter = f;
    renderSpells();
}
// ============================================================
// SPELL FORM
// ============================================================
function onSpellRangeChange() {
    const sel = $('spell-range-select');
    const custom = $('spell-range-custom');
    if (!sel || !custom)
        return;
    if (sel.value === 'custom') {
        custom.style.display = 'block';
        custom.focus();
    }
    else {
        custom.style.display = 'none';
        custom.value = '';
    }
}
function onSpellTimeChange() {
    const sel = $('spell-time-select');
    const custom = $('spell-time-custom');
    if (!sel || !custom)
        return;
    if (sel.value === 'custom') {
        custom.style.display = 'block';
        custom.focus();
    }
    else {
        custom.style.display = 'none';
        custom.value = '';
    }
}
function onSpellDurationChange() {
    const sel = $('spell-duration-select');
    const custom = $('spell-duration-custom');
    if (!sel || !custom)
        return;
    if (sel.value === 'custom') {
        custom.style.display = 'block';
        custom.focus();
    }
    else {
        custom.style.display = 'none';
        custom.value = '';
    }
}
function toggleMaterialField() {
    const mChecked = $('spell-m')?.checked || false;
    const group = $('spell-material-group');
    if (group)
        group.style.display = mChecked ? 'block' : 'none';
}
// ============================================================
// EDITOR FORMATTING
// ============================================================
function formatText(elementId, format, value) {
    const editor = $(elementId);
    if (!editor)
        return;
    editor.focus();
    if (format === 'bold') {
        document.execCommand('bold', false, undefined);
    }
    else if (format === 'italic') {
        document.execCommand('italic', false, undefined);
    }
    else if (format === 'underline') {
        document.execCommand('underline', false, undefined);
    }
    else if (format === 'strikethrough') {
        document.execCommand('strikeThrough', false, undefined);
    }
    else if (format === 'list') {
        document.execCommand('insertUnorderedList', false, undefined);
    }
    else if (format === 'heading') {
        document.execCommand('formatBlock', false, '<h4>');
    }
    else if (format === 'font' && value) {
        document.execCommand('fontName', false, value);
    }
    else if (format === 'highlight') {
        if (value === 'none') {
            document.execCommand('removeFormat', false, undefined);
        }
        else if (value) {
            document.execCommand('backColor', false, value);
        }
    }
}
function setEditorFont(elementIdOrSelect, selectEl) {
    const EDITOR_FONTS = window.EDITOR_FONTS;
    let editorId;
    let select;
    if (typeof elementIdOrSelect === 'object' && elementIdOrSelect.tagName === 'SELECT') {
        select = elementIdOrSelect;
        editorId = select.dataset.editorId || '';
    }
    else {
        editorId = elementIdOrSelect;
        select = selectEl;
    }
    const editor = $(editorId);
    if (!editor)
        return;
    editor.focus();
    if (editorSelectSavedRange) {
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(editorSelectSavedRange.cloneRange());
        }
    }
    document.execCommand('fontName', false, EDITOR_FONTS[select.value] || EDITOR_FONTS['arial']);
}
function setEditorFontSize(elementIdOrSelect, selectEl) {
    let editorId;
    let select;
    if (typeof elementIdOrSelect === 'object' && elementIdOrSelect.tagName === 'SELECT') {
        select = elementIdOrSelect;
        editorId = select.dataset.editorId || '';
    }
    else {
        editorId = elementIdOrSelect;
        select = selectEl;
    }
    const editor = $(editorId);
    if (!editor)
        return;
    editor.focus();
    if (editorSelectSavedRange) {
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(editorSelectSavedRange.cloneRange());
        }
    }
    document.execCommand('fontSize', false, '7');
    const fontElements = editor.querySelectorAll('font[size="7"]');
    fontElements.forEach(el => {
        el.removeAttribute('size');
        el.style.fontSize = select.value;
    });
}
function clearEditorFormatting(elementId) {
    const editor = $(elementId);
    if (!editor)
        return;
    const plainText = editor.innerText || editor.textContent;
    editor.innerHTML = '';
    editor.textContent = plainText || '';
    editor.style.fontFamily = '';
    editor.style.backgroundColor = '';
    editor.style.color = '';
    editor.style.fontSize = '';
    showToast('🧹 Formatierung entfernt');
}
function setBorderFormat(elementId) {
    const editor = $(elementId);
    if (!editor)
        return;
    editor.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.extractContents();
        const wrapper = document.createElement('span');
        wrapper.style.cssText = 'border: 1px solid var(--gold); padding: 2px 6px; border-radius: 4px; display: inline-block;';
        wrapper.className = 'editor-border';
        wrapper.appendChild(selectedText);
        range.insertNode(wrapper);
        selection.removeAllRanges();
    }
}
function setReadAloudFormat(elementId, style = 'parchment') {
    const editor = $(elementId);
    if (!editor)
        return;
    editor.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const existingBlock = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? range.commonAncestorContainer.parentElement?.closest('.read-aloud')
            : range.commonAncestorContainer.closest?.('.read-aloud');
        if (existingBlock) {
            const parent = existingBlock.parentNode;
            if (parent) {
                while (existingBlock.firstChild) {
                    parent.insertBefore(existingBlock.firstChild, existingBlock);
                }
                parent.removeChild(existingBlock);
            }
            showToast('📖 Vorlese-Text entfernt');
        }
        else {
            const selectedContent = range.extractContents();
            const wrapper = document.createElement('div');
            wrapper.className = style === 'parchment' ? 'read-aloud' : `read-aloud ${style}`;
            wrapper.appendChild(selectedContent);
            range.insertNode(wrapper);
            const styleNames = { parchment: 'Pergament', crimson: 'Karmesin', violet: 'Violett', sage: 'Salbei', sky: 'Himmel', slate: 'Schiefer' };
            showToast(`📖 Vorlese-Text (${styleNames[style] || style})`);
        }
        selection.removeAllRanges();
    }
}
function removeSelectionBorders() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const editor = container.nodeType === Node.TEXT_NODE
        ? container.parentElement?.closest('.rich-editor, .spell-editor, .dialog-text')
        : container.closest?.('.rich-editor, .spell-editor, .dialog-text');
    if (!editor)
        return;
    const borderSpans = editor.querySelectorAll('span[style*="border"], span.editor-border');
    borderSpans.forEach(span => {
        if (range.intersectsNode(span) || span.contains(range.commonAncestorContainer)) {
            const parent = span.parentNode;
            if (parent) {
                while (span.firstChild) {
                    parent.insertBefore(span.firstChild, span);
                }
                parent.removeChild(span);
            }
        }
    });
}
function initEditorPasteHandlers() {
    if (editorHandlersInitialized)
        return;
    editorHandlersInitialized = true;
    const editorIds = [
        'char-notes', 'npc-desc', 'loc-desc', 'quest-desc', 'quest-epilog',
        'enc-traits', 'enc-equipment', 'enc-actions', 'enc-skills', 'loot-desc',
        'spell-desc', 'spell-note', 'session-text', 'link-desc', 'wiki-content',
        'quick-ref-entry-content'
    ];
    try {
        document.execCommand('defaultParagraphSeparator', false, 'div');
    }
    catch (e) {
        // Ignore
    }
    editorIds.forEach(id => {
        const editor = $(id);
        if (editor && editor.getAttribute('contenteditable') === 'true') {
            editor.addEventListener('paste', handleEditorPaste);
            editor.addEventListener('input', handleMarkdownInput);
        }
    });
    document.addEventListener('paste', function (e) {
        const target = e.target;
        if (target.classList.contains('rich-editor') || target.classList.contains('dialog-text-area')) {
            handleEditorPaste(e);
        }
    }, true);
    document.addEventListener('input', function (e) {
        const target = e.target;
        if (target.classList.contains('rich-editor') || target.classList.contains('dialog-text')) {
            handleMarkdownInput(e);
        }
    }, true);
    document.addEventListener('keydown', function (e) {
        const target = e.target;
        if (target.classList.contains('rich-editor') || target.classList.contains('dialog-text-area')) {
            handleEditorKeydown(e);
        }
    }, true);
}
function handleEditorKeydown(e) {
    if (e.key === 'T' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        floatingToolbarTarget = e.target;
        insertTable();
        return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        document.execCommand('insertLineBreak', false, undefined);
    }
}
function handleEditorPaste(e) {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    if (!clipboardData)
        return;
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');
    if (html && (html.includes('<table') || html.includes('<TABLE'))) {
        const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
        if (tableMatch) {
            const cleanTable = tableMatch[0]
                .replace(/\s+(class|style|width|height|border|cellpadding|cellspacing|align|valign|bgcolor|xmlns|x:|data-[\w-]+)="[^"]*"/gi, '')
                .replace(/<\/?colgroup[^>]*>/gi, '')
                .replace(/<\/?col[^>]*>/gi, '')
                .replace(/<\/?tbody[^>]*>/gi, '')
                .replace(/<\/?thead[^>]*>/gi, '')
                .replace(/<\/?tfoot[^>]*>/gi, '')
                .replace(/<!--[\s\S]*?-->/g, '')
                .replace(/<google-sheets-html-origin[^>]*>/gi, '')
                .replace(/<\/google-sheets-html-origin>/gi, '')
                .replace(/<meta[^>]*>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/\s+>/g, '>')
                .replace(/<(\w+)\s+>/g, '<$1>')
                .replace(/<table>/gi, '<table style="width:100%; border-collapse:collapse; margin:8px 0;">')
                .replace(/<th>/gi, '<th style="border:1px solid var(--border); padding:6px 10px; background:var(--bg-elevated); color:var(--gold);">')
                .replace(/<td>/gi, '<td style="border:1px solid var(--border); padding:6px 10px;">');
            document.execCommand('insertHTML', false, cleanTable);
            showToast('📊 Tabelle eingefügt');
            return;
        }
    }
    if (text && text.includes('\t')) {
        const lines = text.trim().split('\n');
        if (lines.length > 1 || lines[0].includes('\t')) {
            let tableHtml = '<table style="width:100%; border-collapse:collapse; margin:8px 0;">';
            lines.forEach((line, rowIndex) => {
                const cells = line.split('\t');
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    if (rowIndex === 0) {
                        tableHtml += `<th style="border:1px solid var(--border); padding:6px 10px; background:var(--bg-elevated); color:var(--gold);">${escapeHtml(cell.trim())}</th>`;
                    }
                    else {
                        tableHtml += `<td style="border:1px solid var(--border); padding:6px 10px;">${escapeHtml(cell.trim())}</td>`;
                    }
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</table>';
            document.execCommand('insertHTML', false, tableHtml);
            showToast('📊 Tabelle eingefügt (' + lines.length + ' Zeilen)');
            return;
        }
    }
    document.execCommand('insertText', false, text);
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function insertTable(rows = 3, cols = 3) {
    const editor = floatingToolbarTarget || document.activeElement;
    if (!editor || (!editor.classList.contains('rich-editor') && !editor.classList.contains('spell-editor') && !editor.classList.contains('dialog-text'))) {
        showToast('⚠️ Bitte erst in ein Textfeld klicken', 'error');
        return;
    }
    editor.focus();
    let tableHtml = '<table style="width:100%; border-collapse:collapse; margin:8px 0;">';
    for (let r = 0; r < rows; r++) {
        tableHtml += '<tr>';
        for (let c = 0; c < cols; c++) {
            if (r === 0) {
                tableHtml += `<th style="border:1px solid var(--border); padding:6px 10px; background:var(--bg-elevated); color:var(--gold);">Spalte ${c + 1}</th>`;
            }
            else {
                tableHtml += `<td style="border:1px solid var(--border); padding:6px 10px;"></td>`;
            }
        }
        tableHtml += '</tr>';
    }
    tableHtml += '</table><p></p>';
    document.execCommand('insertHTML', false, tableHtml);
    showToast('📊 Tabelle eingefügt (3×3) - Strg+Shift+T');
    hideFloatingToolbar();
}
function updateStickyOffsets() {
    const header = document.querySelector('.app-header');
    if (!header)
        return;
    const isMobile = document.documentElement.dataset.layout === 'mobile';
    if (isMobile) {
        document.documentElement.style.setProperty('--header-height', '0px');
    }
    else {
        const headerHeight = header.offsetHeight;
        document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
        const encounterControls = document.querySelector('.encounter-controls');
        if (encounterControls) {
            encounterControls.style.top = headerHeight + 'px';
        }
    }
}
// ============================================================
// FLOATING TOOLBAR
// ============================================================
function initFloatingToolbar() {
    if (floatingToolbarInitialized)
        return;
    floatingToolbarInitialized = true;
    const EDITOR_FONTS = window.EDITOR_FONTS;
    const TOOLBAR_DIMENSIONS = window.TOOLBAR_DIMENSIONS;
    const toolbar = $('floating-toolbar');
    if (!toolbar)
        return;
    document.querySelectorAll('.editor-toolbar').forEach(editorToolbar => {
        editorToolbar.addEventListener('mousedown', (e) => {
            const target = e.target;
            const btn = target.closest('.editor-btn');
            const sel = target.closest('.editor-select');
            if (sel) {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0 && selection.toString()) {
                    editorSelectSavedRange = selection.getRangeAt(0).cloneRange();
                }
                return;
            }
            if (btn) {
                e.preventDefault();
            }
        });
    });
    document.addEventListener('selectionchange', debounce(handleSelectionChange, 150));
    document.addEventListener('mouseup', (e) => {
        if (floatingToolbarInteracting)
            return;
        setTimeout(() => handleSelectionChange(), 10);
    });
    toolbar.querySelectorAll('select').forEach(select => {
        select.addEventListener('focus', () => {
            floatingToolbarInteracting = true;
        });
        select.addEventListener('blur', () => {
            setTimeout(() => {
                floatingToolbarInteracting = false;
            }, 100);
        });
        select.addEventListener('mousedown', () => {
            floatingToolbarInteracting = true;
        });
    });
    toolbar.addEventListener('mousedown', (e) => {
        const target = e.target;
        if (target.tagName === 'SELECT' || target.tagName === 'OPTION') {
            e.stopPropagation();
            return;
        }
        e.preventDefault();
        e.stopPropagation();
    });
    toolbar.addEventListener('click', (e) => {
        const target = e.target;
        const btn = target.closest('[data-floating-action]');
        const colorSwatch = target.closest('.color-swatch');
        if (colorSwatch && floatingToolbarTarget && floatingToolbarRange) {
            const color = colorSwatch.dataset.color || 'transparent';
            applyFloatingHighlight(color, floatingToolbarTarget, floatingToolbarRange);
            toolbar.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            if (color !== 'transparent')
                colorSwatch.classList.add('active');
            return;
        }
        if (!btn || !floatingToolbarTarget || !floatingToolbarRange)
            return;
        const action = btn.dataset.floatingAction || '';
        if (action === 'border') {
            setBorderFormat(floatingToolbarTarget.id);
            return;
        }
        applyFloatingFormat(action, floatingToolbarTarget, floatingToolbarRange);
        const newSelection = window.getSelection();
        if (newSelection && newSelection.rangeCount > 0) {
            floatingToolbarRange = newSelection.getRangeAt(0).cloneRange();
        }
    });
    toolbar.addEventListener('change', (e) => {
        const target = e.target;
        const select = target.closest('[data-floating-action]');
        if (!select || !floatingToolbarTarget || !floatingToolbarRange)
            return;
        const action = select.dataset.floatingAction || '';
        const value = select.value;
        floatingToolbarTarget.focus();
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(floatingToolbarRange.cloneRange());
            if (action === 'font') {
                document.execCommand('fontName', false, EDITOR_FONTS[value] || EDITOR_FONTS['arial']);
            }
            else if (action === 'fontSize') {
                document.execCommand('fontSize', false, '7');
                const fontElements = floatingToolbarTarget.querySelectorAll('font[size="7"]');
                fontElements.forEach(el => {
                    el.removeAttribute('size');
                    el.style.fontSize = value;
                });
            }
            else if (action === 'readAloud' && value) {
                setReadAloudFormat(floatingToolbarTarget.id, value);
                select.selectedIndex = 0;
            }
            if (selection.rangeCount > 0) {
                floatingToolbarRange = selection.getRangeAt(0).cloneRange();
            }
        }
    });
    document.addEventListener('mousedown', (e) => {
        const target = e.target;
        if (!toolbar.contains(target) && !target.closest('.rich-editor, .spell-editor, .dialog-text')) {
            hideFloatingToolbar();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideFloatingToolbar();
        }
    });
    function applyFloatingFormat(action, editor, savedRange) {
        let selection = window.getSelection();
        if (!selection || !selection.toString()) {
            editor.focus();
            selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(savedRange.cloneRange());
            }
        }
        if (!selection || !selection.rangeCount)
            return;
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        if (!selectedText)
            return;
        const tagMap = {
            'bold': 'b',
            'italic': 'i',
            'underline': 'u',
            'strikethrough': 's'
        };
        if (tagMap[action]) {
            const tag = tagMap[action];
            const parentTag = range.commonAncestorContainer.parentElement?.closest(tag);
            if (parentTag && parentTag.closest('.rich-editor, .spell-editor, .dialog-text')) {
                const parent = parentTag.parentNode;
                if (parent) {
                    while (parentTag.firstChild) {
                        parent.insertBefore(parentTag.firstChild, parentTag);
                    }
                    parent.removeChild(parentTag);
                }
            }
            else {
                const wrapper = document.createElement(tag);
                try {
                    range.surroundContents(wrapper);
                }
                catch (e) {
                    const fragment = range.extractContents();
                    wrapper.appendChild(fragment);
                    range.insertNode(wrapper);
                }
                selection.removeAllRanges();
                const newRange = document.createRange();
                newRange.selectNodeContents(wrapper);
                selection.addRange(newRange);
            }
        }
        else if (action === 'highlight') {
            applyFloatingHighlight('rgba(251, 191, 36, 0.4)', editor, savedRange);
        }
        else if (action === 'link') {
            const url = prompt('URL eingeben:', 'https://');
            if (url && url !== 'https://') {
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                try {
                    range.surroundContents(link);
                }
                catch (e) {
                    const fragment = range.extractContents();
                    link.appendChild(fragment);
                    range.insertNode(link);
                }
                showToast('🔗 Link eingefügt');
            }
        }
        else if (action === 'list') {
            const parentList = range.commonAncestorContainer.parentElement?.closest('ul, ol');
            if (parentList && parentList.closest('.rich-editor, .spell-editor, .dialog-text')) {
                const listItems = parentList.querySelectorAll('li');
                const fragment = document.createDocumentFragment();
                listItems.forEach((li, index) => {
                    while (li.firstChild) {
                        fragment.appendChild(li.firstChild);
                    }
                    if (index < listItems.length - 1) {
                        fragment.appendChild(document.createElement('br'));
                    }
                });
                parentList.parentNode?.replaceChild(fragment, parentList);
            }
            else {
                const ul = document.createElement('ul');
                const li = document.createElement('li');
                try {
                    const contents = range.extractContents();
                    li.appendChild(contents);
                }
                catch (e) {
                    li.textContent = selectedText;
                    range.deleteContents();
                }
                ul.appendChild(li);
                range.insertNode(ul);
                selection.removeAllRanges();
                const newRange = document.createRange();
                newRange.selectNodeContents(li);
                newRange.collapse(false);
                selection.addRange(newRange);
            }
        }
        else if (action === 'table') {
            insertTable();
        }
        else if (action === 'removeFormat') {
            document.execCommand('removeFormat', false, undefined);
            document.execCommand('backColor', false, 'transparent');
            const editorEl = editor;
            if (editorEl) {
                const marks = editorEl.querySelectorAll('mark');
                marks.forEach(mark => {
                    if (selection && selection.containsNode(mark, true)) {
                        const parent = mark.parentNode;
                        if (parent) {
                            while (mark.firstChild) {
                                parent.insertBefore(mark.firstChild, mark);
                            }
                            parent.removeChild(mark);
                        }
                    }
                });
            }
            removeSelectionBorders();
            showToast('🧹 Formatierung entfernt');
        }
    }
}
function handleSelectionChange() {
    const TOOLBAR_DIMENSIONS = window.TOOLBAR_DIMENSIONS;
    const selection = window.getSelection();
    const toolbar = $('floating-toolbar');
    if (!toolbar || !selection)
        return;
    if (floatingToolbarInteracting || toolbar.contains(document.activeElement)) {
        return;
    }
    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 1) {
        hideFloatingToolbar(false);
        return;
    }
    const anchorNode = selection.anchorNode;
    if (!anchorNode) {
        hideFloatingToolbar(false);
        return;
    }
    const editor = anchorNode.nodeType === Node.TEXT_NODE
        ? anchorNode.parentElement?.closest('.rich-editor, .spell-editor, .dialog-text, .cf-notes-editor')
        : anchorNode.closest?.('.rich-editor, .spell-editor, .dialog-text, .cf-notes-editor');
    if (!editor) {
        hideFloatingToolbar(false);
        return;
    }
    floatingToolbarTarget = editor;
    if (selection.rangeCount === 0)
        return;
    const range = selection.getRangeAt(0);
    floatingToolbarRange = range.cloneRange();
    const rect = range.getBoundingClientRect();
    const { width: toolbarWidth, height: toolbarHeight, padding } = TOOLBAR_DIMENSIONS;
    let left = rect.left + (rect.width / 2) - (toolbarWidth / 2);
    let top = rect.top - toolbarHeight - padding;
    const viewportWidth = window.innerWidth;
    if (left < padding)
        left = padding;
    if (left + toolbarWidth > viewportWidth - padding)
        left = viewportWidth - toolbarWidth - padding;
    if (top < padding) {
        top = rect.bottom + padding;
        toolbar.classList.add('below');
    }
    else {
        toolbar.classList.remove('below');
    }
    toolbar.style.left = left + 'px';
    toolbar.style.top = top + 'px';
    toolbar.classList.add('visible');
    if (hideFloatingToolbarTimeout) {
        clearTimeout(hideFloatingToolbarTimeout);
        hideFloatingToolbarTimeout = null;
    }
}
function hideFloatingToolbar(clearRange = true) {
    const toolbar = $('floating-toolbar');
    if (toolbar) {
        toolbar.classList.remove('visible');
    }
    floatingToolbarTarget = null;
    if (clearRange) {
        floatingToolbarRange = null;
    }
}
function applyFloatingHighlight(color, editor, savedRange) {
    let selection = window.getSelection();
    if (!selection || !selection.toString()) {
        editor.focus();
        selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(savedRange.cloneRange());
        }
    }
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText)
        return;
    if (color === 'transparent') {
        const marks = editor.querySelectorAll('mark');
        marks.forEach(mark => {
            if (selection && selection.containsNode(mark, true)) {
                const parent = mark.parentNode;
                if (parent) {
                    while (mark.firstChild) {
                        parent.insertBefore(mark.firstChild, mark);
                    }
                    parent.removeChild(mark);
                }
            }
        });
        showToast('🧹 Hervorhebung entfernt');
    }
    else {
        const wrapper = document.createElement('mark');
        wrapper.style.backgroundColor = color.startsWith('#') ? color + '66' : color;
        wrapper.style.color = 'inherit';
        wrapper.style.borderRadius = '2px';
        wrapper.style.padding = '0 2px';
        try {
            range.surroundContents(wrapper);
        }
        catch (e) {
            const fragment = range.extractContents();
            wrapper.appendChild(fragment);
            range.insertNode(wrapper);
        }
    }
}
// ============================================================
// CONTEXT TOOLBARS
// ============================================================
function initContextToolbars() {
    if (contextToolbarsInitialized)
        return;
    contextToolbarsInitialized = true;
    const tableToolbar = $('table-context-toolbar');
    const linkToolbar = $('link-context-toolbar');
    if (!tableToolbar || !linkToolbar)
        return;
    tableToolbar.addEventListener('click', (e) => {
        const target = e.target;
        const btn = target.closest('[data-table-action]');
        if (!btn || !currentContextTable)
            return;
        const action = btn.dataset.tableAction || '';
        const table = currentContextTable;
        const selection = window.getSelection();
        const cell = selection?.anchorNode?.nodeType === Node.TEXT_NODE
            ? selection.anchorNode.parentElement?.closest('td, th')
            : selection?.anchorNode?.closest?.('td, th');
        const row = cell?.parentElement;
        const rowIndex = row ? Array.from(table.rows).indexOf(row) : -1;
        const cellIndex = cell && row ? Array.from(row.cells).indexOf(cell) : -1;
        if (action === 'addRow') {
            const newRow = table.insertRow(rowIndex + 1);
            const colCount = table.rows[0]?.cells.length || 3;
            for (let i = 0; i < colCount; i++) {
                const newCell = newRow.insertCell();
                newCell.style.cssText = 'border:1px solid var(--border); padding:6px 10px;';
            }
            showToast('📊 Zeile hinzugefügt');
        }
        else if (action === 'addCol') {
            Array.from(table.rows).forEach((r, idx) => {
                const newCell = idx === 0 ? document.createElement('th') : document.createElement('td');
                newCell.style.cssText = idx === 0
                    ? 'border:1px solid var(--border); padding:6px 10px; background:var(--bg-elevated); color:var(--gold);'
                    : 'border:1px solid var(--border); padding:6px 10px;';
                r.insertBefore(newCell, r.cells[cellIndex + 1] || null);
            });
            showToast('📊 Spalte hinzugefügt');
        }
        else if (action === 'deleteRow') {
            if (table.rows.length > 1) {
                table.deleteRow(rowIndex);
                showToast('📊 Zeile gelöscht');
            }
            else {
                showToast('⚠️ Letzte Zeile kann nicht gelöscht werden', 'error');
            }
        }
        else if (action === 'deleteCol') {
            const colCount = table.rows[0]?.cells.length || 0;
            if (colCount > 1) {
                Array.from(table.rows).forEach(r => {
                    if (r.cells[cellIndex])
                        r.deleteCell(cellIndex);
                });
                showToast('📊 Spalte gelöscht');
            }
            else {
                showToast('⚠️ Letzte Spalte kann nicht gelöscht werden', 'error');
            }
        }
        else if (action === 'deleteTable') {
            if (confirm('Tabelle wirklich löschen?')) {
                table.remove();
                hideContextToolbars();
                showToast('🗑️ Tabelle gelöscht');
            }
        }
    });
    linkToolbar.addEventListener('click', (e) => {
        const target = e.target;
        const btn = target.closest('[data-link-action]');
        if (!btn || !currentContextLink)
            return;
        const action = btn.dataset.linkAction || '';
        const link = currentContextLink;
        if (action === 'open') {
            window.open(link.href, '_blank', 'noopener,noreferrer');
        }
        else if (action === 'edit') {
            const newUrl = prompt('URL bearbeiten:', link.href);
            if (newUrl && newUrl !== link.href) {
                link.href = newUrl;
                showToast('🔗 Link aktualisiert');
            }
        }
        else if (action === 'remove') {
            const parent = link.parentNode;
            if (parent) {
                while (link.firstChild) {
                    parent.insertBefore(link.firstChild, link);
                }
                parent.removeChild(link);
            }
            hideContextToolbars();
            showToast('🔗 Link entfernt');
        }
    });
    document.addEventListener('click', (e) => {
        const target = e.target;
        const editorSelector = '.rich-editor, .spell-editor, .dialog-text, .cf-notes-editor';
        const editor = target.closest(editorSelector);
        if (!editor) {
            hideContextToolbars();
            return;
        }
        const table = target.closest('table');
        if (table && table.closest(editorSelector)) {
            currentContextTable = table;
            showTableContextToolbar(table);
        }
        else {
            hideTableContextToolbar();
        }
        const link = target.closest('a');
        if (link && link.closest(editorSelector)) {
            currentContextLink = link;
            showLinkContextToolbar(link);
        }
        else {
            hideLinkContextToolbar();
        }
    });
}
function showTableContextToolbar(table) {
    const toolbar = $('table-context-toolbar');
    if (!toolbar)
        return;
    const rect = table.getBoundingClientRect();
    toolbar.style.left = rect.left + 'px';
    toolbar.style.top = (rect.top - 40) + 'px';
    toolbar.classList.add('visible');
}
function hideTableContextToolbar() {
    const toolbar = $('table-context-toolbar');
    if (toolbar)
        toolbar.classList.remove('visible');
    currentContextTable = null;
}
function showLinkContextToolbar(link) {
    const toolbar = $('link-context-toolbar');
    const urlSpan = $('link-context-url');
    if (!toolbar)
        return;
    if (urlSpan) {
        const displayUrl = link.href.length > 30 ? link.href.substring(0, 30) + '...' : link.href;
        urlSpan.textContent = '🔗 ' + displayUrl;
        urlSpan.title = link.href;
    }
    const rect = link.getBoundingClientRect();
    toolbar.style.left = rect.left + 'px';
    toolbar.style.top = (rect.bottom + 5) + 'px';
    toolbar.classList.add('visible');
}
function hideLinkContextToolbar() {
    const toolbar = $('link-context-toolbar');
    if (toolbar)
        toolbar.classList.remove('visible');
    currentContextLink = null;
}
function hideContextToolbars() {
    hideTableContextToolbar();
    hideLinkContextToolbar();
}
// ============================================================
// SPELL CRUD
// ============================================================
function getSpellClassesFromCheckboxes() {
    const classes = [];
    const classIds = ['barbar', 'barde', 'druide', 'hexenmeister', 'kaempfer', 'kleriker', 'magier', 'moench', 'paladin', 'schurke', 'waldlaeufer', 'zauberer', 'artifizient'];
    classIds.forEach(id => {
        const cb = $('spell-class-' + id);
        if (cb?.checked)
            classes.push(cb.value);
    });
    return classes;
}
function setSpellClassesCheckboxes(classes) {
    const classMap = {
        'Barbar': 'barbar', 'Barde': 'barde', 'Druide': 'druide', 'Hexenmeister': 'hexenmeister',
        'Kämpfer': 'kaempfer', 'Kleriker': 'kleriker', 'Magier': 'magier', 'Mönch': 'moench',
        'Paladin': 'paladin', 'Schurke': 'schurke', 'Waldläufer': 'waldlaeufer', 'Zauberer': 'zauberer',
        'Artifizient': 'artifizient'
    };
    Object.values(classMap).forEach(id => {
        const cb = $('spell-class-' + id);
        if (cb)
            cb.checked = false;
    });
    classes.forEach(cls => {
        const id = classMap[cls];
        if (id) {
            const cb = $('spell-class-' + id);
            if (cb)
                cb.checked = true;
        }
    });
}
function saveSpell() {
    const D = window.D;
    const nextId = window.nextId;
    const editIdInput = $('edit-spell-id');
    const nameInput = $('spell-name');
    const typeInput = $('spell-type');
    const levelInput = $('spell-level');
    const schoolInput = $('spell-school');
    const rangeSelectInput = $('spell-range-select');
    const rangeCustomInput = $('spell-range-custom');
    const timeSelectInput = $('spell-time-select');
    const timeCustomInput = $('spell-time-custom');
    const durationSelectInput = $('spell-duration-select');
    const durationCustomInput = $('spell-duration-custom');
    const ritualInput = $('spell-ritual');
    const vInput = $('spell-v');
    const gInput = $('spell-g');
    const mInput = $('spell-m');
    const materialInput = $('spell-material');
    const descEl = $('spell-desc');
    const noteEl = $('spell-note');
    const id = editIdInput?.value || '';
    const rangeSelect = rangeSelectInput?.value || '';
    const rangeCustom = rangeCustomInput?.value.trim() || '';
    let range = '';
    if (rangeSelect === 'custom') {
        range = rangeCustom;
    }
    else if (rangeSelect) {
        range = rangeSelect;
    }
    const timeSelect = timeSelectInput?.value || '';
    const timeCustom = timeCustomInput?.value.trim() || '';
    const time = timeSelect === 'custom' ? timeCustom : timeSelect;
    const durationSelect = durationSelectInput?.value || '';
    const durationCustom = durationCustomInput?.value.trim() || '';
    const duration = durationSelect === 'custom' ? durationCustom : durationSelect;
    const classes = getSpellClassesFromCheckboxes();
    const descHtml = descEl ? descEl.innerHTML : '';
    const s = {
        name: nameInput?.value.trim() || '',
        type: typeInput?.value || 'spell',
        level: parseInt(levelInput?.value || '0') || 0,
        spellClasses: classes,
        school: schoolInput?.value || '',
        time: time,
        range: range,
        duration: duration,
        ritual: ritualInput?.checked || false,
        v: vInput?.checked || false,
        g: gInput?.checked || false,
        m: mInput?.checked || false,
        material: materialInput?.value.trim() || '',
        description: descHtml,
        note: noteEl ? sanitizeHTML(noteEl.innerHTML.trim()) : ''
    };
    if (!s.name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    pushUndo(id ? 'Zauber bearbeitet' : 'Zauber erstellt');
    if (id) {
        const idx = D.spells.findIndex((x) => x.id === parseEntityId(id));
        if (idx > -1)
            D.spells[idx] = { ...D.spells[idx], ...s };
    }
    else {
        s.id = nextId('spells');
        D.spells.push(s);
    }
    hideModal('spell-modal');
    clearSpellForm();
    renderSpells();
    save();
}
function editSpell(id) {
    const s = EntityLookup.spell(id);
    if (!s)
        return;
    const editIdInput = $('edit-spell-id');
    const nameInput = $('spell-name');
    const typeInput = $('spell-type');
    const levelInput = $('spell-level');
    const schoolInput = $('spell-school');
    const ritualInput = $('spell-ritual');
    const vInput = $('spell-v');
    const gInput = $('spell-g');
    const mInput = $('spell-m');
    const materialInput = $('spell-material');
    const descEl = $('spell-desc');
    const noteEl = $('spell-note');
    if (editIdInput)
        editIdInput.value = String(id);
    if (nameInput)
        nameInput.value = s.name;
    if (typeInput)
        typeInput.value = s.type || 'spell';
    if (levelInput)
        levelInput.value = String(s.level || 0);
    if (schoolInput)
        schoolInput.value = s.school || '';
    if (ritualInput)
        ritualInput.checked = s.ritual;
    if (vInput)
        vInput.checked = s.v;
    if (gInput)
        gInput.checked = s.g;
    if (mInput)
        mInput.checked = s.m;
    if (materialInput)
        materialInput.value = s.material || '';
    toggleMaterialField();
    if (descEl)
        descEl.innerHTML = sanitizeHTML(s.description) || '';
    if (noteEl)
        noteEl.innerHTML = sanitizeHTML(s.note) || '';
    const classes = s.spellClasses || [];
    setSpellClassesCheckboxes(classes);
    const timeSelect = $('spell-time-select');
    const timeCustom = $('spell-time-custom');
    const time = s.time || '1 Aktion';
    if (timeSelect && timeCustom) {
        const timeOptions = Array.from(timeSelect.options).map(o => o.value);
        if (timeOptions.includes(time)) {
            timeSelect.value = time;
            timeCustom.style.display = 'none';
            timeCustom.value = '';
        }
        else if (time) {
            timeSelect.value = 'custom';
            timeCustom.style.display = 'block';
            timeCustom.value = time;
        }
    }
    const rangeSelect = $('spell-range-select');
    const rangeCustom = $('spell-range-custom');
    const range = s.range || '';
    if (rangeSelect && rangeCustom) {
        const rangeOptions = Array.from(rangeSelect.options).map(o => o.value);
        if (rangeOptions.includes(range)) {
            rangeSelect.value = range;
            rangeCustom.style.display = 'none';
            rangeCustom.value = '';
        }
        else if (range) {
            rangeSelect.value = 'custom';
            rangeCustom.style.display = 'block';
            rangeCustom.value = range;
        }
        else {
            rangeSelect.value = '';
            rangeCustom.style.display = 'none';
            rangeCustom.value = '';
        }
    }
    const durationSelect = $('spell-duration-select');
    const durationCustom = $('spell-duration-custom');
    const duration = s.duration || 'Unmittelbar';
    if (durationSelect && durationCustom) {
        const durationOptions = Array.from(durationSelect.options).map(o => o.value);
        if (durationOptions.includes(duration)) {
            durationSelect.value = duration;
            durationCustom.style.display = 'none';
            durationCustom.value = '';
        }
        else if (duration) {
            durationSelect.value = 'custom';
            durationCustom.style.display = 'block';
            durationCustom.value = duration;
        }
    }

    // Show markdown export/import buttons when editing
    const markdownActions = $('spell-markdown-actions');
    if (markdownActions) {
        markdownActions.style.display = 'block';
    }

    showModal('spell-modal');
}
function deleteSpell(id) {
    const D = window.D;
    const spell = EntityLookup.spell(id);
    if (confirm(`Zauber "${spell?.name || 'Unbekannt'}" löschen?`)) {
        pushUndo('Zauber gelöscht');
        D.spells = D.spells.filter((s) => s.id !== id);
        renderSpells();
        save();
    }
}
function clearSpellForm() {
    const editIdInput = $('edit-spell-id');
    const nameInput = $('spell-name');
    const typeInput = $('spell-type');
    const levelInput = $('spell-level');
    const schoolInput = $('spell-school');
    const timeSelectInput = $('spell-time-select');
    const timeCustomInput = $('spell-time-custom');
    const rangeSelectInput = $('spell-range-select');
    const rangeCustomInput = $('spell-range-custom');
    const durationSelectInput = $('spell-duration-select');
    const durationCustomInput = $('spell-duration-custom');
    const descEl = $('spell-desc');
    const noteEl = $('spell-note');
    const materialInput = $('spell-material');
    const materialGroup = $('spell-material-group');
    const ritualInput = $('spell-ritual');
    const vInput = $('spell-v');
    const gInput = $('spell-g');
    const mInput = $('spell-m');
    if (editIdInput)
        editIdInput.value = '';
    if (nameInput)
        nameInput.value = '';
    if (typeInput)
        typeInput.value = 'spell';
    if (levelInput)
        levelInput.value = '0';
    if (schoolInput)
        schoolInput.value = '';
    if (timeSelectInput)
        timeSelectInput.value = '1 Aktion';
    if (timeCustomInput) {
        timeCustomInput.value = '';
        timeCustomInput.style.display = 'none';
    }
    if (rangeSelectInput)
        rangeSelectInput.value = '';
    if (rangeCustomInput) {
        rangeCustomInput.value = '';
        rangeCustomInput.style.display = 'none';
    }
    if (durationSelectInput)
        durationSelectInput.value = 'Unmittelbar';
    if (durationCustomInput) {
        durationCustomInput.value = '';
        durationCustomInput.style.display = 'none';
    }
    if (descEl)
        descEl.innerHTML = '';
    if (noteEl)
        noteEl.innerHTML = '';
    if (materialInput)
        materialInput.value = '';
    if (materialGroup)
        materialGroup.style.display = 'none';
    if (ritualInput)
        ritualInput.checked = false;
    if (vInput)
        vInput.checked = false;
    if (gInput)
        gInput.checked = false;
    if (mInput)
        mInput.checked = false;
    setSpellClassesCheckboxes([]);

    // Hide markdown export/import buttons for new spells
    const markdownActions = $('spell-markdown-actions');
    if (markdownActions) {
        markdownActions.style.display = 'none';
    }
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.debouncedRenderSpells = debouncedRenderSpells;
window.renderSpells = renderSpells;
window.toggleSpellCard = toggleSpellCard;
window.expandAllSpells = expandAllSpells;
window.collapseAllSpells = collapseAllSpells;
window.setSpellFilter = setSpellFilter;
window.setSpellLevelFilter = setSpellLevelFilter;
window.setSpellSchoolFilter = setSpellSchoolFilter;
window.onSpellRangeChange = onSpellRangeChange;
window.onSpellTimeChange = onSpellTimeChange;
window.onSpellDurationChange = onSpellDurationChange;
window.toggleMaterialField = toggleMaterialField;
window.formatText = formatText;
window.setEditorFont = setEditorFont;
window.setEditorFontSize = setEditorFontSize;
window.clearEditorFormatting = clearEditorFormatting;
window.setBorderFormat = setBorderFormat;
window.setReadAloudFormat = setReadAloudFormat;
window.initEditorPasteHandlers = initEditorPasteHandlers;
window.insertTable = insertTable;
window.updateStickyOffsets = updateStickyOffsets;
window.initFloatingToolbar = initFloatingToolbar;
window.initContextToolbars = initContextToolbars;
window.saveSpell = saveSpell;
window.editSpell = editSpell;
window.deleteSpell = deleteSpell;
