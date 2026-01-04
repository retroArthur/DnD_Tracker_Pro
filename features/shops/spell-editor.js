// [SECTION:SPELL_EDITOR]
// ============================================================
// SPELL EDITOR - @zauber @editor @toolbar
// Konstanten: EDITOR_FONTS, TOOLBAR_DIMENSIONS, SPELLS_PER_PAGE (in core/constants.js)
// ============================================================

let currentSpellPage = 0;
let filteredSpellsCache = [];

// Debounced Render-Funktion für bessere Performance bei Suche
const debouncedRenderSpells = debounce(renderSpells, 200);

function renderSpells() {
    const c = $('spell-list'); 
    const fb = $('spell-filters'); 
    const lfb = $('spell-level-filters'); 
    const sfb = $('spell-school-filters');
    const countEl = $('spell-count'); 
    if (!c) return;
    
    // Typ-Filter Chips
    if (fb) {
        fb.innerHTML = ['all', 'spell', 'healing', 'damage', 'buff', 'debuff'].map(t => {
            const label = t === 'all' ? 'Alle' : t === 'spell' ? '🔵' : t === 'healing' ? '🟡' : t === 'damage' ? '🔴' : t === 'buff' ? '🟢' : '🟣';
            return `<div class="filter-chip ${currentSpellFilter === t ? 'active' : ''}" data-action="set-spell-filter" data-value="${t}" title="${t === 'all' ? 'Alle Typen' : t === 'spell' ? 'Zauber' : t === 'healing' ? 'Heilung' : t === 'damage' ? 'Schaden' : t === 'buff' ? 'Buff' : 'Debuff'}">${label}</div>`;
        }).join('');
    }
    
    // Stufen-Filter Chips
    if (lfb) {
        lfb.innerHTML = ['all', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(t => {
            const label = t === 'all' ? '∞' : t === '0' ? '🔮' : t;
            const title = t === 'all' ? 'Alle Stufen' : t === '0' ? 'Zaubertricks' : `Stufe ${t}`;
            return `<div class="filter-chip ${currentSpellLevelFilter === t ? 'active' : ''}" data-action="spell-level-filter" data-value="${t}" title="${title}">${label}</div>`;
        }).join('');
    }
    
    // Schule-Filter Chips
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
    
    const search = ($('spell-search')?.value || '').toLowerCase().trim();
    const classFilter = $('spell-class-filter')?.value || '';
    
    let spells = D.spells || [];
    const totalCount = spells.length;
    
    // Typ-Filter (aus Chips)
    if (currentSpellFilter !== 'all') {
        spells = spells.filter(s => s.type === currentSpellFilter);
    }
    
    // Stufen-Filter (aus Chips)
    if (currentSpellLevelFilter !== 'all') {
        const lvl = parseInt(currentSpellLevelFilter);
        spells = spells.filter(s => {
            if (lvl === 0) return s.type === 'cantrip' || s.level === 0;
            return s.level === lvl;
        });
    }
    
    // Schule-Filter (aus Chips)
    if (currentSpellSchoolFilter !== 'all') {
        spells = spells.filter(s => s.school === currentSpellSchoolFilter);
    }
    
    // Suche (Name, Schule, Beschreibung, Material)
    if (search) {
        spells = spells.filter(s => {
            const name = (s.name || '').toLowerCase();
            const school = (s.school || '').toLowerCase();
            const desc = (s.description || '').toLowerCase();
            const material = (s.material || '').toLowerCase();
            const note = (s.note || '').toLowerCase();
            return name.includes(search) || school.includes(search) || desc.includes(search) || material.includes(search) || note.includes(search);
        });
    }
    
    // Klassen-Filter
    if (classFilter) {
        spells = spells.filter(s => {
            const classes = s.spellClasses || (s.spellClass ? s.spellClass.split(',').map(c => c.trim()) : []);
            return classes.includes(classFilter);
        });
    }
    
    // Zähler anzeigen
    if (countEl) {
        if (spells.length === totalCount) {
            countEl.textContent = `📖 ${totalCount}`;
        } else {
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
    
    // Sortieren nach Stufe, dann Name
    spells.sort((a, b) => {
        const lvlA = a.level ?? (a.type === 'cantrip' ? 0 : 99);
        const lvlB = b.level ?? (b.type === 'cantrip' ? 0 : 99);
        if (lvlA !== lvlB) return lvlA - lvlB;
        return (a.name || '').localeCompare(b.name || '');
    });
    
    // Cache für Pagination
    filteredSpellsCache = spells;
    currentSpellPage = 0;
    
    // Bei vielen Zaubern: Lazy Loading
    if (spells.length > SPELLS_PER_PAGE) {
        const visibleSpells = spells.slice(0, SPELLS_PER_PAGE);
        c.innerHTML = renderSpellCards(visibleSpells) + renderLoadMoreButton(spells.length, SPELLS_PER_PAGE);
    } else {
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
        </div>`}).join('');
}

function renderLoadMoreButton(total, perPage) {
    const shown = Math.min((currentSpellPage + 1) * perPage, total);
    const remaining = total - shown;
    if (remaining <= 0) return '';
    return `<div class="load-more-container" style="grid-column: 1/-1; text-align: center; padding: 16px;">
        <button class="btn" data-action="call" data-value="loadMoreSpells">
            📜 ${remaining} weitere laden (${shown}/${total} angezeigt)
        </button>
    </div>`;
}

function loadMoreSpells() {
    const c = $('spell-list');
    if (!c || !filteredSpellsCache.length) return;
    
    currentSpellPage++;
    const start = 0;
    const end = (currentSpellPage + 1) * SPELLS_PER_PAGE;
    const visibleSpells = filteredSpellsCache.slice(start, end);
    
    c.innerHTML = renderSpellCards(visibleSpells) + renderLoadMoreButton(filteredSpellsCache.length, SPELLS_PER_PAGE);
}

// Expanded-Status für Zauber-Kacheln
let expandedSpells = new Set();

function toggleSpellCard(id) {
    if (expandedSpells.has(id)) {
        expandedSpells.delete(id);
    } else {
        expandedSpells.add(id);
    }
    
    // Direkt das DOM-Element togglen statt komplettes Re-Render
    const card = document.querySelector(`.spell-card[data-spell-id="${id}"]`);
    if (card) {
        card.classList.toggle('expanded', expandedSpells.has(id));
    }
}

function expandAllSpells() {
    (D.spells || []).forEach(s => expandedSpells.add(s.id));
    renderSpells();
}

function collapseAllSpells() {
    expandedSpells.clear();
    renderSpells();
}

function setSpellFilter(f) { currentSpellFilter = f; renderSpells(); }
function setSpellLevelFilter(f) { currentSpellLevelFilter = f; renderSpells(); }
function setSpellSchoolFilter(f) { currentSpellSchoolFilter = f; renderSpells(); }

function onSpellRangeChange() {
    const sel = $('spell-range-select');
    const custom = $('spell-range-custom');
    if (sel.value === 'custom') {
        custom.style.display = 'block';
        custom.focus();
    } else {
        custom.style.display = 'none';
        custom.value = '';
    }
}

function onSpellTimeChange() {
    const sel = $('spell-time-select');
    const custom = $('spell-time-custom');
    if (sel.value === 'custom') {
        custom.style.display = 'block';
        custom.focus();
    } else {
        custom.style.display = 'none';
        custom.value = '';
    }
}

function onSpellDurationChange() {
    const sel = $('spell-duration-select');
    const custom = $('spell-duration-custom');
    if (sel.value === 'custom') {
        custom.style.display = 'block';
        custom.focus();
    } else {
        custom.style.display = 'none';
        custom.value = '';
    }
}

function toggleMaterialField() {
    const mChecked = $('spell-m').checked;
    $('spell-material-group').style.display = mChecked ? 'block' : 'none';
}

function formatText(elementId, format, value) {
    const editor = $(elementId);
    if (!editor) return;
    editor.focus();
    
    if (format === 'bold') {
        document.execCommand('bold', false, null);
    } else if (format === 'italic') {
        document.execCommand('italic', false, null);
    } else if (format === 'underline') {
        document.execCommand('underline', false, null);
    } else if (format === 'strikethrough') {
        document.execCommand('strikeThrough', false, null);
    } else if (format === 'list') {
        document.execCommand('insertUnorderedList', false, null);
    } else if (format === 'heading') {
        document.execCommand('formatBlock', false, '<h4>');
    } else if (format === 'font') {
        document.execCommand('fontName', false, value);
    } else if (format === 'highlight') {
        if (value === 'none') {
            document.execCommand('removeFormat', false, null);
        } else {
            document.execCommand('backColor', false, value);
        }
    }
}

// Gespeicherte Selection für Editor-Selects
let editorSelectSavedRange = null;

function setEditorFont(elementIdOrSelect, selectEl) {
    let editorId, select;

    // Unterstuetzt sowohl direkte Argumente als auch Element (von data-on-change)
    if (elementIdOrSelect && elementIdOrSelect.tagName === 'SELECT') {
        // Element uebergeben - Editor-ID aus data-Attribut extrahieren
        select = elementIdOrSelect;
        editorId = select.dataset.editorId;
    } else {
        editorId = elementIdOrSelect;
        select = selectEl;
    }

    const editor = $(editorId);
    if (!editor) return;

    // Selection wiederherstellen
    editor.focus();
    if (editorSelectSavedRange) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(editorSelectSavedRange.cloneRange());
    }

    document.execCommand('fontName', false, EDITOR_FONTS[select.value] || EDITOR_FONTS['arial']);
}

function setEditorFontSize(elementIdOrSelect, selectEl) {
    let editorId, select;

    // Unterstuetzt sowohl direkte Argumente als auch Element (von data-on-change)
    if (elementIdOrSelect && elementIdOrSelect.tagName === 'SELECT') {
        // Element uebergeben - Editor-ID aus data-Attribut extrahieren
        select = elementIdOrSelect;
        editorId = select.dataset.editorId;
    } else {
        editorId = elementIdOrSelect;
        select = selectEl;
    }

    const editor = $(editorId);
    if (!editor) return;

    // Selection wiederherstellen
    editor.focus();
    if (editorSelectSavedRange) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(editorSelectSavedRange.cloneRange());
    }

    document.execCommand('fontSize', false, '7'); // Dummy-Größe, wird durch CSS ersetzt
    // Ersetze font-size durch die gewählte Größe
    const fontElements = editor.querySelectorAll('font[size="7"]');
    fontElements.forEach(el => {
        el.removeAttribute('size');
        el.style.fontSize = select.value;
    });
}

function clearEditorFormatting(elementId) {
    const editor = $(elementId);
    if (!editor) return;
    
    // Nur den Text behalten, alle HTML-Tags entfernen
    const plainText = editor.innerText || editor.textContent;
    editor.innerHTML = '';
    editor.textContent = plainText;
    
    // Alle Inline-Styles entfernen
    editor.style.fontFamily = '';
    editor.style.backgroundColor = '';
    editor.style.color = '';
    editor.style.fontSize = '';
    
    showToast('🧹 Formatierung entfernt');
}

function setBorderFormat(elementId) {
    const editor = $(elementId);
    if (!editor) return;
    editor.focus();

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
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

// Vorlese-Text (Read-Aloud / Boxed Text) Format
function setReadAloudFormat(elementId, style = 'parchment') {
    const editor = $(elementId);
    if (!editor) return;
    editor.focus();

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Prüfe ob bereits in read-aloud Block
        const existingBlock = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? range.commonAncestorContainer.parentElement?.closest('.read-aloud')
            : range.commonAncestorContainer.closest?.('.read-aloud');

        if (existingBlock) {
            // Entferne read-aloud Format (unwrap)
            const parent = existingBlock.parentNode;
            while (existingBlock.firstChild) {
                parent.insertBefore(existingBlock.firstChild, existingBlock);
            }
            parent.removeChild(existingBlock);
            showToast('📖 Vorlese-Text entfernt');
        } else {
            // Füge read-aloud Format hinzu
            const selectedContent = range.extractContents();
            const wrapper = document.createElement('div');
            // Basis-Klasse + Stil-Klasse (parchment braucht keine extra Klasse)
            wrapper.className = style === 'parchment' ? 'read-aloud' : `read-aloud ${style}`;
            wrapper.appendChild(selectedContent);
            range.insertNode(wrapper);
            const styleNames = { parchment: 'Pergament', crimson: 'Karmesin', violet: 'Violett', sage: 'Salbei', sky: 'Himmel', slate: 'Schiefer' };
            showToast(`📖 Vorlese-Text (${styleNames[style] || style})`);
        }
        selection.removeAllRanges();
    }
}

// Entfernt Rahmen von der aktuellen Selection
function removeSelectionBorders() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const editor = container.nodeType === Node.TEXT_NODE
        ? container.parentElement?.closest('.rich-editor, .spell-editor, .dialog-text')
        : container.closest?.('.rich-editor, .spell-editor, .dialog-text');

    if (!editor) return;

    // Finde alle span-Elemente mit border in der Selection oder um sie herum
    const borderSpans = editor.querySelectorAll('span[style*="border"], span.editor-border');
    borderSpans.forEach(span => {
        // Prüfe ob die Selection diesen Span enthält oder darin liegt
        if (range.intersectsNode(span) || span.contains(range.commonAncestorContainer)) {
            // Unwrap: Inhalt behalten, span entfernen
            const parent = span.parentNode;
            while (span.firstChild) {
                parent.insertBefore(span.firstChild, span);
            }
            parent.removeChild(span);
        }
    });
}

// Auto-Clean beim Einfügen - entfernt Formatierung von eingefügtem Text
let editorHandlersInitialized = false;
function initEditorPasteHandlers() {
    // Verhindere mehrfache Initialisierung
    if (editorHandlersInitialized) return;
    editorHandlersInitialized = true;

    const editorIds = [
        'char-notes', 'npc-desc', 'loc-desc', 'quest-desc', 'quest-epilog',
        'enc-traits', 'enc-equipment', 'enc-actions', 'enc-skills', 'loot-desc',
        'spell-desc', 'spell-note', 'session-text', 'link-desc', 'wiki-content',
        'quick-ref-entry-content'
    ];
    
    // Setze defaultParagraphSeparator für konsistentes Verhalten bei Zeilenumbrüchen
    // Verwende 'div' für bessere Kompatibilität (Chrome-Standard)
    try {
        document.execCommand('defaultParagraphSeparator', false, 'div');
    } catch (e) {
        // Fallback für ältere Browser - ignorieren
    }
    
    editorIds.forEach(id => {
        const editor = $(id);
        if (editor && editor.getAttribute('contenteditable') === 'true') {
            editor.addEventListener('paste', handleEditorPaste);
            // Keydown wird über document-level Handler abgedeckt (Zeile 457)
        }
    });
    
    // Auch für dynamisch erstellte Dialoge
    document.addEventListener('paste', function(e) {
        if (e.target.classList.contains('rich-editor') || e.target.classList.contains('dialog-text-area')) {
            handleEditorPaste(e);
        }
    }, true);
    
    // Keydown für dynamische Editoren
    document.addEventListener('keydown', function(e) {
        if (e.target.classList.contains('rich-editor') || e.target.classList.contains('dialog-text-area')) {
            handleEditorKeydown(e);
        }
    }, true);
}

// Handler für konsistente Zeilenumbrüche in contenteditable
function handleEditorKeydown(e) {
    // Strg+Shift+T: Tabelle einfügen
    if (e.key === 'T' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        floatingToolbarTarget = e.target;
        insertTable();
        return;
    }
    
    // Bei Enter ohne Shift: Simuliere Shift+Enter für einfachen Zeilenumbruch
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopImmediatePropagation();

        // Verwende insertLineBreak für konsistenten einzelnen Zeilenumbruch
        document.execCommand('insertLineBreak', false, null);
    }
}

function handleEditorPaste(e) {
    e.preventDefault();
    const clipboardData = e.clipboardData || window.clipboardData;
    
    // Prüfe auf HTML (Excel und Google Sheets kopieren HTML)
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');
    
    // Wenn HTML vorhanden ist und eine Tabelle enthält, nutze diese
    if (html && (html.includes('<table') || html.includes('<TABLE'))) {
        // Extrahiere nur die Tabelle aus dem HTML
        const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
        if (tableMatch) {
            // Bereinige die Excel/Google Sheets Tabelle
            let cleanTable = tableMatch[0]
                // Entferne Excel/Google-spezifische Attribute und Styles
                .replace(/\s+(class|style|width|height|border|cellpadding|cellspacing|align|valign|bgcolor|xmlns|x:|data-[\w-]+)="[^"]*"/gi, '')
                .replace(/<\/?colgroup[^>]*>/gi, '')
                .replace(/<\/?col[^>]*>/gi, '')
                .replace(/<\/?tbody[^>]*>/gi, '')
                .replace(/<\/?thead[^>]*>/gi, '')
                .replace(/<\/?tfoot[^>]*>/gi, '')
                .replace(/<!--[\s\S]*?-->/g, '')
                // Google Sheets spezifische Tags entfernen
                .replace(/<google-sheets-html-origin[^>]*>/gi, '')
                .replace(/<\/google-sheets-html-origin>/gi, '')
                .replace(/<meta[^>]*>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                // Bereinige leere Attribute
                .replace(/\s+>/g, '>')
                .replace(/<(\w+)\s+>/g, '<$1>')
                // Füge Standard-Styling hinzu
                .replace(/<table>/gi, '<table style="width:100%; border-collapse:collapse; margin:8px 0;">')
                .replace(/<th>/gi, '<th style="border:1px solid var(--border); padding:6px 10px; background:var(--bg-elevated); color:var(--gold);">')
                .replace(/<td>/gi, '<td style="border:1px solid var(--border); padding:6px 10px;">');
            
            document.execCommand('insertHTML', false, cleanTable);
            showToast('📊 Tabelle eingefügt');
            return;
        }
    }
    
    // Prüfe ob Text Tab-separiert ist (Excel/Google Sheets Format)
    if (text && text.includes('\t')) {
        const lines = text.trim().split('\n');
        if (lines.length > 1 || lines[0].includes('\t')) {
            // Konvertiere Tab-separierten Text in HTML-Tabelle
            let tableHtml = '<table style="width:100%; border-collapse:collapse; margin:8px 0;">';
            lines.forEach((line, rowIndex) => {
                const cells = line.split('\t');
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    // Erste Zeile als Header behandeln
                    if (rowIndex === 0) {
                        tableHtml += `<th style="border:1px solid var(--border); padding:6px 10px; background:var(--bg-elevated); color:var(--gold);">${escapeHtml(cell.trim())}</th>`;
                    } else {
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
    
    // Standard: Plain-Text einfügen
    document.execCommand('insertText', false, text);
}

// Hilfsfunktion für HTML-Escaping beim Tabellen-Paste
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Tabelle in Editor einfügen
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
            } else {
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

// ============================================================
// STICKY OFFSETS - Dynamische Header-Höhen-Berechnung
// ============================================================
function updateStickyOffsets() {
    const header = document.querySelector('.app-header');
    if (!header) return;
    
    // Im Mobile-Layout ist der Header unten
    const isMobile = document.documentElement.dataset.layout === 'mobile';
    if (isMobile) {
        document.documentElement.style.setProperty('--header-height', '0px');
    } else {
        const headerHeight = header.offsetHeight;
        document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
        
        // Update encounter-controls top position
        const encounterControls = document.querySelector('.encounter-controls');
        if (encounterControls) {
            encounterControls.style.top = headerHeight + 'px';
        }
    }
}

// ============================================================
// FLOATING MINI-EDITOR TOOLBAR
// ============================================================
let floatingToolbarTarget = null;
let floatingToolbarRange = null; // Gespeicherte Selection Range
let hideFloatingToolbarTimeout = null;
let floatingToolbarInteracting = false; // Flag: User interagiert mit Toolbar
let floatingToolbarInitialized = false; // Guard gegen mehrfache Initialisierung

function initFloatingToolbar() {
    // Verhindere mehrfache Initialisierung (Memory Leak Prevention)
    if (floatingToolbarInitialized) return;
    floatingToolbarInitialized = true;

    const toolbar = $('floating-toolbar');
    if (!toolbar) return;

    // Verhindere Verlust der Textauswahl bei Klick auf statische Editor-Toolbar-Buttons
    document.querySelectorAll('.editor-toolbar').forEach(editorToolbar => {
        editorToolbar.addEventListener('mousedown', (e) => {
            const btn = e.target.closest('.editor-btn');
            const sel = e.target.closest('.editor-select');

            // Selection speichern bei Klick auf Selects
            if (sel) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0 && selection.toString()) {
                    editorSelectSavedRange = selection.getRangeAt(0).cloneRange();
                }
            }

            // Buttons: preventDefault um Selection zu behalten
            if (btn) {
                e.preventDefault();
            }
        });
    });

    // Event-Listener für Textauswahl in Rich-Editoren
    document.addEventListener('selectionchange', debounce(handleSelectionChange, 150));
    
    // Mausup-Event für bessere Positionierung
    document.addEventListener('mouseup', (e) => {
        // Skip wenn User mit Toolbar-Selects interagiert
        if (floatingToolbarInteracting) return;
        // Kurze Verzögerung damit die Auswahl vollständig ist
        setTimeout(() => handleSelectionChange(), 10);
    });

    // Select-Elemente: Flag setzen wenn User interagiert
    toolbar.querySelectorAll('select').forEach(select => {
        select.addEventListener('focus', () => {
            floatingToolbarInteracting = true;
        });
        select.addEventListener('blur', () => {
            // Kurze Verzögerung um race conditions zu vermeiden
            setTimeout(() => {
                floatingToolbarInteracting = false;
            }, 100);
        });
        select.addEventListener('mousedown', () => {
            floatingToolbarInteracting = true;
        });
    });
    
    // Klicks auf die Toolbar-Buttons
    toolbar.addEventListener('mousedown', (e) => {
        // Select-Elemente müssen normal funktionieren
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') {
            e.stopPropagation(); // Verhindert Document-Handler
            return;
        }
        e.preventDefault(); // Verhindert Verlust der Textauswahl
        e.stopPropagation(); // Verhindert Document-Handler
    });
    
    toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-floating-action]');
        const colorSwatch = e.target.closest('.color-swatch');

        // Color swatch click
        if (colorSwatch && floatingToolbarTarget && floatingToolbarRange) {
            const color = colorSwatch.dataset.color;
            applyFloatingHighlight(color, floatingToolbarTarget, floatingToolbarRange);
            // Update active state
            toolbar.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            if (color !== 'transparent') colorSwatch.classList.add('active');
            return;
        }

        if (!btn || !floatingToolbarTarget || !floatingToolbarRange) return;

        const action = btn.dataset.floatingAction;

        // Special actions that use existing functions
        if (action === 'border') {
            setBorderFormat(floatingToolbarTarget.id);
            return;
        }

        // Formatierung mit manuellem Wrapping anwenden
        applyFloatingFormat(action, floatingToolbarTarget, floatingToolbarRange);

        // Nach Formatierung: Range aktualisieren
        const newSelection = window.getSelection();
        if (newSelection.rangeCount > 0) {
            floatingToolbarRange = newSelection.getRangeAt(0).cloneRange();
        }
    });

    // Font/Size/ReadAloud select change handlers
    toolbar.addEventListener('change', (e) => {
        const select = e.target.closest('[data-floating-action]');
        if (!select || !floatingToolbarTarget || !floatingToolbarRange) return;

        const action = select.dataset.floatingAction;
        const value = select.value;

        // Restore selection
        floatingToolbarTarget.focus();
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(floatingToolbarRange.cloneRange());

        if (action === 'font') {
            document.execCommand('fontName', false, EDITOR_FONTS[value] || EDITOR_FONTS['arial']);
        } else if (action === 'fontSize') {
            document.execCommand('fontSize', false, '7');
            const fontElements = floatingToolbarTarget.querySelectorAll('font[size="7"]');
            fontElements.forEach(el => {
                el.removeAttribute('size');
                el.style.fontSize = value;
            });
        } else if (action === 'readAloud' && value) {
            // Apply read-aloud formatting
            setReadAloudFormat(floatingToolbarTarget.id, value);
            select.selectedIndex = 0;
        }

        // Update saved range
        if (selection.rangeCount > 0) {
            floatingToolbarRange = selection.getRangeAt(0).cloneRange();
        }
    });

    // Manuelle Formatierungs-Funktion
    function applyFloatingFormat(action, editor, savedRange) {
        // Aktuelle Selection prüfen
        let selection = window.getSelection();

        // Falls keine Selection, Range aus savedRange wiederherstellen
        if (!selection.toString()) {
            editor.focus();
            selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedRange.cloneRange());
        }

        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        if (!selectedText) return;

        // Tag-Mapping
        const tagMap = {
            'bold': 'b',
            'italic': 'i',
            'underline': 'u',
            'strikethrough': 's'
        };

        if (tagMap[action]) {
            // Prüfe ob bereits formatiert (Toggle-Verhalten)
            const tag = tagMap[action];
            const parentTag = range.commonAncestorContainer.parentElement?.closest(tag);

            if (parentTag && parentTag.closest('.rich-editor, .spell-editor, .dialog-text')) {
                // Bereits formatiert → entfernen (unwrap)
                const parent = parentTag.parentNode;
                while (parentTag.firstChild) {
                    parent.insertBefore(parentTag.firstChild, parentTag);
                }
                parent.removeChild(parentTag);
            } else {
                // Noch nicht formatiert → hinzufügen (wrap)
                const wrapper = document.createElement(tag);
                try {
                    range.surroundContents(wrapper);
                } catch (e) {
                    // Falls surroundContents fehlschlägt (z.B. bei partial selection)
                    const fragment = range.extractContents();
                    wrapper.appendChild(fragment);
                    range.insertNode(wrapper);
                }
                // Selection auf neuen Inhalt setzen
                selection.removeAllRanges();
                const newRange = document.createRange();
                newRange.selectNodeContents(wrapper);
                selection.addRange(newRange);
            }
        } else if (action === 'highlight') {
            // Default highlight color (gold)
            applyFloatingHighlight('rgba(251, 191, 36, 0.4)', editor, savedRange);
        } else if (action === 'link') {
            // Link einfügen
            const url = prompt('URL eingeben:', 'https://');
            if (url && url !== 'https://') {
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                try {
                    range.surroundContents(link);
                } catch (e) {
                    const fragment = range.extractContents();
                    link.appendChild(fragment);
                    range.insertNode(link);
                }
                showToast('🔗 Link eingefügt');
            }
        } else if (action === 'list') {
            // Manuelles Listen-Handling (execCommand ist deprecated und unzuverlässig)
            const parentList = range.commonAncestorContainer.parentElement?.closest('ul, ol');

            if (parentList && parentList.closest('.rich-editor, .spell-editor, .dialog-text')) {
                // Bereits in Liste → Liste entfernen (unwrap)
                const listItems = parentList.querySelectorAll('li');
                const fragment = document.createDocumentFragment();
                listItems.forEach((li, index) => {
                    // Inhalt des li extrahieren
                    while (li.firstChild) {
                        fragment.appendChild(li.firstChild);
                    }
                    // Zeilenumbruch zwischen Items (außer beim letzten)
                    if (index < listItems.length - 1) {
                        fragment.appendChild(document.createElement('br'));
                    }
                });
                parentList.parentNode.replaceChild(fragment, parentList);
            } else {
                // Noch nicht in Liste → Liste erstellen
                const ul = document.createElement('ul');
                const li = document.createElement('li');

                // Ausgewählten Inhalt in li verschieben
                try {
                    const contents = range.extractContents();
                    li.appendChild(contents);
                } catch (e) {
                    li.textContent = selectedText;
                    range.deleteContents();
                }

                ul.appendChild(li);
                range.insertNode(ul);

                // Cursor ans Ende der Liste setzen
                selection.removeAllRanges();
                const newRange = document.createRange();
                newRange.selectNodeContents(li);
                newRange.collapse(false);
                selection.addRange(newRange);
            }
        } else if (action === 'table') {
            insertTable();
        } else if (action === 'removeFormat') {
            document.execCommand('removeFormat', false, null);
            document.execCommand('backColor', false, 'transparent');

            // <mark> Elemente (Highlights) entfernen - alle im Editor finden und prüfen
            const editorEl = editor;
            if (editorEl) {
                const marks = editorEl.querySelectorAll('mark');
                marks.forEach(mark => {
                    // Prüfen ob Mark in der Selection liegt oder Selection enthält
                    if (selection.containsNode(mark, true)) {
                        const parent = mark.parentNode;
                        while (mark.firstChild) {
                            parent.insertBefore(mark.firstChild, mark);
                        }
                        parent.removeChild(mark);
                    }
                });
            }

            removeSelectionBorders();
            showToast('🧹 Formatierung entfernt');
        }
    }
    
    // Bei Klick außerhalb verstecken
    document.addEventListener('mousedown', (e) => {
        if (!toolbar.contains(e.target) && !e.target.closest('.rich-editor, .spell-editor, .dialog-text')) {
            hideFloatingToolbar();
        }
    });
    
    // Bei Escape verstecken
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideFloatingToolbar();
        }
    });
}

function handleSelectionChange() {
    const selection = window.getSelection();
    const toolbar = $('floating-toolbar');
    if (!toolbar) return;

    // Nicht verstecken wenn User mit Toolbar interagiert (z.B. Select öffnet)
    if (floatingToolbarInteracting || toolbar.contains(document.activeElement)) {
        return;
    }

    // Prüfe ob Text ausgewählt ist
    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 1) {
        // Range NICHT löschen - User könnte noch die gespeicherte Range nutzen wollen
        hideFloatingToolbar(false);
        return;
    }

    // Prüfe ob die Auswahl in einem Rich-Editor ist
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

    // Position der Auswahl ermitteln
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    floatingToolbarRange = range.cloneRange(); // Range speichern für spätere Wiederherstellung
    const rect = range.getBoundingClientRect();
    
    // Toolbar über der Auswahl positionieren
    const { width: toolbarWidth, height: toolbarHeight, padding } = TOOLBAR_DIMENSIONS;

    let left = rect.left + (rect.width / 2) - (toolbarWidth / 2);
    let top = rect.top - toolbarHeight - padding;

    // Sicherstellen, dass die Toolbar im Viewport bleibt
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + toolbarWidth > viewportWidth - padding) left = viewportWidth - toolbarWidth - padding;
    
    // Wenn oben kein Platz, unter der Auswahl anzeigen
    if (top < padding) {
        top = rect.bottom + padding;
        toolbar.classList.add('below');
    } else {
        toolbar.classList.remove('below');
    }
    
    toolbar.style.left = left + 'px';
    toolbar.style.top = top + 'px';
    toolbar.classList.add('visible');
    
    // Timeout zum Verstecken abbrechen
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
    // Range nur löschen wenn explizit angefordert (nicht bei selectionchange)
    if (clearRange) {
        floatingToolbarRange = null;
    }
}

// Highlight mit beliebiger Farbe anwenden
function applyFloatingHighlight(color, editor, savedRange) {
    let selection = window.getSelection();

    if (!selection.toString()) {
        editor.focus();
        selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange.cloneRange());
    }

    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText) return;

    if (color === 'transparent') {
        // Remove highlight - find and unwrap mark elements
        const marks = editor.querySelectorAll('mark');
        marks.forEach(mark => {
            if (selection.containsNode(mark, true)) {
                const parent = mark.parentNode;
                while (mark.firstChild) {
                    parent.insertBefore(mark.firstChild, mark);
                }
                parent.removeChild(mark);
            }
        });
        showToast('🧹 Hervorhebung entfernt');
    } else {
        const wrapper = document.createElement('mark');
        wrapper.style.backgroundColor = color.startsWith('#') ? color + '66' : color; // Add alpha if hex
        wrapper.style.color = 'inherit';
        wrapper.style.borderRadius = '2px';
        wrapper.style.padding = '0 2px';
        try {
            range.surroundContents(wrapper);
        } catch (e) {
            const fragment = range.extractContents();
            wrapper.appendChild(fragment);
            range.insertNode(wrapper);
        }
    }
}

// ============================================================
// CONTEXT TOOLBARS - Tabellen und Links
// ============================================================
let currentContextTable = null;
let currentContextLink = null;
let contextToolbarsInitialized = false; // Guard gegen mehrfache Initialisierung

function initContextToolbars() {
    // Verhindere mehrfache Initialisierung (Memory Leak Prevention)
    if (contextToolbarsInitialized) return;
    contextToolbarsInitialized = true;

    const tableToolbar = $('table-context-toolbar');
    const linkToolbar = $('link-context-toolbar');

    if (!tableToolbar || !linkToolbar) return;

    // Table context toolbar handlers
    tableToolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-table-action]');
        if (!btn || !currentContextTable) return;

        const action = btn.dataset.tableAction;
        const table = currentContextTable;

        // Find current cell
        const selection = window.getSelection();
        const cell = selection.anchorNode?.nodeType === Node.TEXT_NODE
            ? selection.anchorNode.parentElement?.closest('td, th')
            : selection.anchorNode?.closest?.('td, th');

        const row = cell?.parentElement;
        const rowIndex = row ? Array.from(table.rows).indexOf(row) : -1;
        const cellIndex = cell ? Array.from(row.cells).indexOf(cell) : -1;

        if (action === 'addRow') {
            const newRow = table.insertRow(rowIndex + 1);
            const colCount = table.rows[0]?.cells.length || 3;
            for (let i = 0; i < colCount; i++) {
                const newCell = newRow.insertCell();
                newCell.style.cssText = 'border:1px solid var(--border); padding:6px 10px;';
            }
            showToast('📊 Zeile hinzugefügt');
        } else if (action === 'addCol') {
            Array.from(table.rows).forEach((r, idx) => {
                const newCell = idx === 0 ? document.createElement('th') : document.createElement('td');
                newCell.style.cssText = idx === 0
                    ? 'border:1px solid var(--border); padding:6px 10px; background:var(--bg-elevated); color:var(--gold);'
                    : 'border:1px solid var(--border); padding:6px 10px;';
                r.insertBefore(newCell, r.cells[cellIndex + 1] || null);
            });
            showToast('📊 Spalte hinzugefügt');
        } else if (action === 'deleteRow') {
            if (table.rows.length > 1) {
                table.deleteRow(rowIndex);
                showToast('📊 Zeile gelöscht');
            } else {
                showToast('⚠️ Letzte Zeile kann nicht gelöscht werden', 'error');
            }
        } else if (action === 'deleteCol') {
            const colCount = table.rows[0]?.cells.length || 0;
            if (colCount > 1) {
                Array.from(table.rows).forEach(r => {
                    if (r.cells[cellIndex]) r.deleteCell(cellIndex);
                });
                showToast('📊 Spalte gelöscht');
            } else {
                showToast('⚠️ Letzte Spalte kann nicht gelöscht werden', 'error');
            }
        } else if (action === 'deleteTable') {
            if (confirm('Tabelle wirklich löschen?')) {
                table.remove();
                hideContextToolbars();
                showToast('🗑️ Tabelle gelöscht');
            }
        }
    });

    // Link context toolbar handlers
    linkToolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-link-action]');
        if (!btn || !currentContextLink) return;

        const action = btn.dataset.linkAction;
        const link = currentContextLink;

        if (action === 'open') {
            window.open(link.href, '_blank', 'noopener,noreferrer');
        } else if (action === 'edit') {
            const newUrl = prompt('URL bearbeiten:', link.href);
            if (newUrl && newUrl !== link.href) {
                link.href = newUrl;
                showToast('🔗 Link aktualisiert');
            }
        } else if (action === 'remove') {
            const parent = link.parentNode;
            while (link.firstChild) {
                parent.insertBefore(link.firstChild, link);
            }
            parent.removeChild(link);
            hideContextToolbars();
            showToast('🔗 Link entfernt');
        }
    });

    // Detect table/link context on click
    document.addEventListener('click', (e) => {
        const editorSelector = '.rich-editor, .spell-editor, .dialog-text, .cf-notes-editor';
        const editor = e.target.closest(editorSelector);
        if (!editor) {
            hideContextToolbars();
            return;
        }

        // Check for table
        const table = e.target.closest('table');
        if (table && table.closest(editorSelector)) {
            currentContextTable = table;
            showTableContextToolbar(table);
        } else {
            hideTableContextToolbar();
        }

        // Check for link
        const link = e.target.closest('a');
        if (link && link.closest(editorSelector)) {
            currentContextLink = link;
            showLinkContextToolbar(link);
        } else {
            hideLinkContextToolbar();
        }
    });
}

function showTableContextToolbar(table) {
    const toolbar = $('table-context-toolbar');
    if (!toolbar) return;

    const rect = table.getBoundingClientRect();
    toolbar.style.left = rect.left + 'px';
    toolbar.style.top = (rect.top - 40) + 'px';
    toolbar.classList.add('visible');
}

function hideTableContextToolbar() {
    const toolbar = $('table-context-toolbar');
    if (toolbar) toolbar.classList.remove('visible');
    currentContextTable = null;
}

function showLinkContextToolbar(link) {
    const toolbar = $('link-context-toolbar');
    const urlSpan = $('link-context-url');
    if (!toolbar) return;

    // Show truncated URL
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
    if (toolbar) toolbar.classList.remove('visible');
    currentContextLink = null;
}

function hideContextToolbars() {
    hideTableContextToolbar();
    hideLinkContextToolbar();
}

function getSpellClassesFromCheckboxes() {
    const classes = [];
    const classIds = ['barbar', 'barde', 'druide', 'hexenmeister', 'kaempfer', 'kleriker', 'magier', 'moench', 'paladin', 'schurke', 'waldlaeufer', 'zauberer', 'artifizient'];
    classIds.forEach(id => {
        const cb = $('spell-class-' + id);
        if (cb && cb.checked) classes.push(cb.value);
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
    // Alle zurücksetzen
    Object.values(classMap).forEach(id => {
        const cb = $('spell-class-' + id);
        if (cb) cb.checked = false;
    });
    // Ausgewählte setzen
    classes.forEach(cls => {
        const id = classMap[cls];
        if (id) {
            const cb = $('spell-class-' + id);
            if (cb) cb.checked = true;
        }
    });
}

function saveSpell() {
    const id = $('edit-spell-id').value;
    
    // Reichweite ermitteln
    const rangeSelect = $('spell-range-select').value;
    const rangeCustom = $('spell-range-custom').value.trim();
    let range = '';
    if (rangeSelect === 'custom') {
        range = rangeCustom;
    } else if (rangeSelect) {
        range = rangeSelect;
    }
    
    // Zeitaufwand ermitteln
    const timeSelect = $('spell-time-select').value;
    const timeCustom = $('spell-time-custom').value.trim();
    let time = timeSelect === 'custom' ? timeCustom : timeSelect;
    
    // Dauer ermitteln
    const durationSelect = $('spell-duration-select').value;
    const durationCustom = $('spell-duration-custom').value.trim();
    let duration = durationSelect === 'custom' ? durationCustom : durationSelect;
    
    // Klassen von Checkboxen
    const classes = getSpellClassesFromCheckboxes();
    
    // Beschreibung als HTML
    const descHtml = $('spell-desc').innerHTML;
    
    const s = {
        name: $('spell-name').value.trim(), type: $('spell-type').value,
        level: parseInt($('spell-level').value) || 0, 
        spellClasses: classes,
        school: $('spell-school').value,
        time: time,
        range: range, 
        duration: duration,
        ritual: $('spell-ritual').checked, v: $('spell-v').checked, g: $('spell-g').checked, m: $('spell-m').checked,
        material: $('spell-material').value.trim(),
        description: descHtml, note: sanitizeHTML($('spell-note').innerHTML.trim())
    };
    if (!s.name) { showToast('⚠️ Name erforderlich', 'error'); return; }
    pushUndo(id ? 'Zauber bearbeitet' : 'Zauber erstellt');
    if (id) { const idx = D.spells.findIndex(x => x.id === parseEntityId(id)); if (idx > -1) D.spells[idx] = { ...D.spells[idx], ...s }; }
    else { s.id = nextId('spells'); D.spells.push(s); }
    hideModal('spell-modal'); clearSpellForm(); renderSpells(); save();
}

function editSpell(id) {
    const s = EntityLookup.spell(id); if (!s) return;
    $('edit-spell-id').value = id; 
    $('spell-name').value = s.name; 
    $('spell-type').value = s.type || 'spell';
    $('spell-level').value = s.level || 0; 
    $('spell-school').value = s.school || '';
    $('spell-ritual').checked = s.ritual; 
    $('spell-v').checked = s.v; 
    $('spell-g').checked = s.g; 
    $('spell-m').checked = s.m;
    
    // Material-Feld
    $('spell-material').value = s.material || '';
    toggleMaterialField();
    
    // Beschreibung als HTML
    $('spell-desc').innerHTML = sanitizeHTML(s.description) || '';
    $('spell-note').innerHTML = sanitizeHTML(s.note) || '';
    
    // Klassen Checkboxen
    const classes = s.spellClasses || (s.spellClass ? s.spellClass.split(',').map(c => c.trim()) : []);
    setSpellClassesCheckboxes(classes);
    
    // Zeitaufwand
    const timeSelect = $('spell-time-select');
    const timeCustom = $('spell-time-custom');
    const time = s.time || '1 Aktion';
    const timeOptions = Array.from(timeSelect.options).map(o => o.value);
    if (timeOptions.includes(time)) {
        timeSelect.value = time;
        timeCustom.style.display = 'none';
        timeCustom.value = '';
    } else if (time) {
        timeSelect.value = 'custom';
        timeCustom.style.display = 'block';
        timeCustom.value = time;
    }
    
    // Reichweite
    const rangeSelect = $('spell-range-select');
    const rangeCustom = $('spell-range-custom');
    const range = s.range || '';
    const rangeOptions = Array.from(rangeSelect.options).map(o => o.value);
    if (rangeOptions.includes(range)) {
        rangeSelect.value = range;
        rangeCustom.style.display = 'none';
        rangeCustom.value = '';
    } else if (range) {
        rangeSelect.value = 'custom';
        rangeCustom.style.display = 'block';
        rangeCustom.value = range;
    } else {
        rangeSelect.value = '';
        rangeCustom.style.display = 'none';
        rangeCustom.value = '';
    }
    
    // Dauer
    const durationSelect = $('spell-duration-select');
    const durationCustom = $('spell-duration-custom');
    const duration = s.duration || 'Unmittelbar';
    const durationOptions = Array.from(durationSelect.options).map(o => o.value);
    if (durationOptions.includes(duration)) {
        durationSelect.value = duration;
        durationCustom.style.display = 'none';
        durationCustom.value = '';
    } else if (duration) {
        durationSelect.value = 'custom';
        durationCustom.style.display = 'block';
        durationCustom.value = duration;
    }
    
    showModal('spell-modal');
}

function deleteSpell(id) {
    const spell = EntityLookup.spell(id);
    if (confirm(`Zauber "${spell?.name || 'Unbekannt'}" löschen?`)) {
        pushUndo('Zauber gelöscht');
        D.spells = D.spells.filter(s => s.id !== id);
        renderSpells();
        save();
    }
}

function clearSpellForm() {
    $('edit-spell-id').value = '';
    $('spell-name').value = '';
    $('spell-type').value = 'spell';
    $('spell-level').value = '0';
    $('spell-school').value = '';
    // Zeitaufwand
    $('spell-time-select').value = '1 Aktion';
    $('spell-time-custom').value = '';
    $('spell-time-custom').style.display = 'none';
    // Reichweite
    $('spell-range-select').value = '';
    $('spell-range-custom').value = '';
    $('spell-range-custom').style.display = 'none';
    // Dauer
    $('spell-duration-select').value = 'Unmittelbar';
    $('spell-duration-custom').value = '';
    $('spell-duration-custom').style.display = 'none';
    // Rest
    $('spell-desc').innerHTML = '';
    $('spell-note').innerHTML = '';
    $('spell-material').value = '';
    $('spell-material-group').style.display = 'none';
    $('spell-ritual').checked = false; 
    $('spell-v').checked = false; 
    $('spell-g').checked = false; 
    $('spell-m').checked = false;
    // Klassen-Checkboxen zurücksetzen
    setSpellClassesCheckboxes([]);
}

// ============================================================