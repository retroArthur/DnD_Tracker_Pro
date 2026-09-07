// [SECTION:RICH_TEXT_TOOLBARS]
// Rich Text Editor — Floating- und Kontext-Toolbars. Selektion/
// Zeichenformatierung: ui/editors/rich-text.js. Einfügen/Zwischenablage/
// Tastatur/Tabelle: ui/editors/rich-text-insert.js.
// ============================================================
// FLOATING TOOLBAR
// ============================================================
function initFloatingToolbar() {
    if (floatingToolbarInitialized) return;
    floatingToolbarInitialized = true;
    // EDITOR_FONTS/TOOLBAR_DIMENSIONS werden NICHT hier als lokale const gebunden:
    // Build-Dedup-Pass entfernt die zweite Deklaration desselben Bezeichners
    // (CLAUDE.md "Duplicate Declaration Debugging Pattern") — direkter window.*-Zugriff
    // an den Verwendungsstellen unten vermeidet den Bundle-Laufzeitfehler.
    const toolbar = $('floating-toolbar');
    if (!toolbar) return;
    // Delegiert am document statt einmalig je .editor-toolbar: die beiden
    // Leisten aus features/npcs/npc-dialogs.js entstehen ERST NACH diesem
    // init und bekamen mit der frueheren querySelectorAll-Schleife nie einen
    // Handler — dort ging die Selektion bei jedem Toolbar-Klick verloren.
    // Der preventDefault() hier ist das Einzige, was die contenteditable-
    // Selektion waehrend eines Toolbar-Klicks am Leben haelt.
    document.addEventListener('mousedown', e => {
        const target = e.target;
        if (!target.closest) return;
        // Aufklapp-Menue schliessen, sobald irgendwo ausserhalb SEINES Ankers
        // gedrueckt wird. Bewusst mousedown und nicht click: EventDelegation
        // registriert in der Capture-Phase und ruft bei jedem Treffer
        // stopPropagation(), ein Bubble-click-Listener wuerde fuer Klicks auf
        // andere Toolbar-Buttons daher nie feuern — das Menue bliebe offen.
        if (!target.closest('.tb-anchor') && typeof window.closeAllEditorMenus === 'function') {
            window.closeAllEditorMenus();
        }
        if (!target.closest('.editor-toolbar')) return;
        const sel = target.closest('.editor-select');
        if (sel) {
            saveEditorSelection();
            return;
        }
        // Menue-Trigger nehmen den Fokus ebenfalls aus dem Editor, brauchen
        // also dieselbe Sicherung wie ein Select — und zusaetzlich das
        // preventDefault(), damit die Selektion sichtbar bleibt.
        if (target.closest('[data-tb-menu]')) {
            saveEditorSelection();
            e.preventDefault();
            return;
        }
        // .tb-menu-item gehoert ausdruecklich dazu: ein Menue-Eintrag ist
        // weder .editor-btn noch [data-tb-menu], wuerde also ohne diesen Zweig
        // die Selektion im Editor verlieren — und die Formatierung liefe ins
        // Leere, obwohl das Oeffnen des Menues sie noch bewahrt hatte.
        if (target.closest('.editor-btn') || target.closest('.tb-menu-item')) {
            e.preventDefault();
        }
    });
    document.addEventListener('selectionchange', debounce(handleSelectionChange, 150));
    document.addEventListener('mouseup', e => {
        if (floatingToolbarInteracting) return;
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
    toolbar.addEventListener('mousedown', e => {
        const target = e.target;
        if (target.tagName === 'SELECT' || target.tagName === 'OPTION') {
            e.stopPropagation();
            return;
        }
        e.preventDefault();
        e.stopPropagation();
    });
    toolbar.addEventListener('click', e => {
        const target = e.target;
        const btn = target.closest('[data-floating-action]');
        const colorSwatch = target.closest('.color-swatch');
        if (colorSwatch && floatingToolbarTarget && floatingToolbarRange) {
            const color = colorSwatch.dataset.color || 'transparent';
            applyFloatingHighlight(color, floatingToolbarTarget, floatingToolbarRange);
            toolbar.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            if (color !== 'transparent') colorSwatch.classList.add('active');
            return;
        }
        if (!btn || !floatingToolbarTarget || !floatingToolbarRange) return;
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
    toolbar.addEventListener('change', e => {
        const target = e.target;
        const select = target.closest('[data-floating-action]');
        if (!select || !floatingToolbarTarget || !floatingToolbarRange) return;
        const action = select.dataset.floatingAction || '';
        const value = select.value;
        floatingToolbarTarget.focus();
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(floatingToolbarRange.cloneRange());
            if (action === 'font') {
                const fonts = window.EDITOR_FONTS || {};
                applyFontFamilyToSelection(floatingToolbarTarget, fonts[value] || fonts['arial']);
            } else if (action === 'fontSize') {
                applyFontSizeToSelection(floatingToolbarTarget, value);
            } else if (action === 'readAloud' && value) {
                setReadAloudFormat(floatingToolbarTarget.id, value);
                select.selectedIndex = 0;
            }
            if (selection.rangeCount > 0) {
                floatingToolbarRange = selection.getRangeAt(0).cloneRange();
            }
        }
    });
    document.addEventListener('mousedown', e => {
        const target = e.target;
        if (
            !toolbar.contains(target) &&
            !target.closest(window.EDITOR_HOST_SELECTOR) &&
            // Ohne diese Ausnahme schliesst der erste Klick auf ein
            // Aufklapp-Menue die Blase und nullt floatingToolbarTarget —
            // die Menueaktion greift danach ins Leere.
            !target.closest('.editor-toolbar')
        ) {
            hideFloatingToolbar();
        }
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            hideFloatingToolbar();
            if (typeof window.closeAllEditorMenus === 'function') {
                window.closeAllEditorMenus();
            }
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
        if (!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        if (!selectedText) return;
        const tagMap = {
            bold: 'b',
            italic: 'i',
            underline: 'u',
            strikethrough: 's'
        };
        if (tagMap[action]) {
            const tag = tagMap[action];
            const parentTag = range.commonAncestorContainer.parentElement?.closest(tag);
            if (parentTag && parentTag.closest(window.EDITOR_HOST_SELECTOR)) {
                const parent = parentTag.parentNode;
                if (parent) {
                    while (parentTag.firstChild) {
                        parent.insertBefore(parentTag.firstChild, parentTag);
                    }
                    parent.removeChild(parentTag);
                }
            } else {
                const wrapper = document.createElement(tag);
                try {
                    range.surroundContents(wrapper);
                } catch (e) {
                    const fragment = range.extractContents();
                    wrapper.appendChild(fragment);
                    range.insertNode(wrapper);
                }
                selection.removeAllRanges();
                const newRange = document.createRange();
                newRange.selectNodeContents(wrapper);
                selection.addRange(newRange);
            }
        } else if (action === 'highlight') {
            applyFloatingHighlight('rgba(251, 191, 36, 0.4)', editor, savedRange);
        } else if (action === 'link') {
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
            const parentList = range.commonAncestorContainer.parentElement?.closest('ul, ol');
            if (parentList && parentList.closest(window.EDITOR_HOST_SELECTOR)) {
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
            } else {
                const ul = document.createElement('ul');
                const li = document.createElement('li');
                try {
                    const contents = range.extractContents();
                    li.appendChild(contents);
                } catch (e) {
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
        } else if (action === 'table') {
            insertTable();
        } else if (action === 'removeFormat') {
            clearInlineFormattingAtSelection(editor);
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
// Spiegelt den Formatzustand am Cursor in die statische Leiste des Editors.
// Bewusst getrennt von handleSelectionChange(): jene Funktion kehrt bei
// LEERER Auswahl frueh zurueck (sie steuert die schwebende Leiste), der
// Zustand muss aber gerade auch fuer einen kollabierten Cursor stimmen.
function refreshEditorFormatState() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    let node = selection.anchorNode;
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const editor = node?.closest?.(window.EDITOR_HOST_SELECTOR);
    if (!editor || !editor.id) return;
    const toolbar = document.querySelector(`[data-toolbar-for="${editor.id}"]`);
    if (!toolbar) return;
    const active = getActiveFormatsAtSelection(editor);
    toolbar.querySelectorAll('[data-action="format-text"]').forEach(btn => {
        const fmt = btn.dataset.editor;
        if (!fmt) return;
        // Nur die vier Zeichenformate faerben. Liste/Marker/Schrift haben
        // keinen sinnvollen An-/Aus-Zustand an einem kollabierten Cursor.
        if (!['bold', 'italic', 'underline', 'strikethrough'].includes(fmt)) return;
        btn.classList.toggle('format-active', active.has(fmt));
    });
}

function handleSelectionChange() {
    refreshEditorFormatState();
    // Keine funktions-lokale Bindung von TOOLBAR_DIMENSIONS hier — Build-Dedup-Pass-Konflikt
    // vermeiden (CLAUDE.md "Duplicate Declaration Debugging Pattern"), direkt an der
    // Destrukturierungsstelle unten mit Guard auf window.TOOLBAR_DIMENSIONS zugreifen.
    const selection = window.getSelection();
    const toolbar = $('floating-toolbar');
    if (!toolbar || !selection) return;
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
    const editor =
        anchorNode.nodeType === Node.TEXT_NODE
            ? anchorNode.parentElement?.closest(
                  window.EDITOR_HOST_SELECTOR
              )
            : anchorNode.closest?.(window.EDITOR_HOST_SELECTOR);
    if (!editor) {
        hideFloatingToolbar(false);
        return;
    }
    floatingToolbarTarget = editor;
    if (selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    floatingToolbarRange = range.cloneRange();
    const rect = range.getBoundingClientRect();
    const toolbarDimensions = window.TOOLBAR_DIMENSIONS;
    if (!toolbarDimensions) {
        hideFloatingToolbar(false);
        return;
    }
    const { width: toolbarWidth, height: toolbarHeight, padding } = toolbarDimensions;
    let left = rect.left + rect.width / 2 - toolbarWidth / 2;
    let top = rect.top - toolbarHeight - padding;
    const viewportWidth = window.innerWidth;
    if (left < padding) left = padding;
    if (left + toolbarWidth > viewportWidth - padding)
        left = viewportWidth - toolbarWidth - padding;
    if (top < padding) {
        top = rect.bottom + padding;
        toolbar.classList.add('below');
    } else {
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
    // Delegiert an die gemeinsame Implementierung in rich-text.js. Das
    // padding '0 2px' ist die historische Variante DIESES Wegs und wird bis
    // zur Vereinheitlichung (Stufe B) beibehalten, damit das eingefrorene
    // Netz byte-genau gruen bleibt.
    const applied = applyMarkerToSelection(editor, color, savedRange);
    if (!applied) return;
    showToast(color === 'transparent' ? '🧹 Hervorhebung entfernt' : '🖍️ Text hervorgehoben');
}
// ============================================================
// CONTEXT TOOLBARS
// ============================================================
function initContextToolbars() {
    if (contextToolbarsInitialized) return;
    contextToolbarsInitialized = true;
    const tableToolbar = $('table-context-toolbar');
    const linkToolbar = $('link-context-toolbar');
    if (!tableToolbar || !linkToolbar) return;
    tableToolbar.addEventListener('click', e => {
        const target = e.target;
        const btn = target.closest('[data-table-action]');
        if (!btn || !currentContextTable) return;
        const action = btn.dataset.tableAction || '';
        const table = currentContextTable;
        const selection = window.getSelection();
        const cell =
            selection?.anchorNode?.nodeType === Node.TEXT_NODE
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
        } else if (action === 'addCol') {
            Array.from(table.rows).forEach((r, idx) => {
                const newCell =
                    idx === 0 ? document.createElement('th') : document.createElement('td');
                newCell.style.cssText =
                    idx === 0
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
    linkToolbar.addEventListener('click', e => {
        const target = e.target;
        const btn = target.closest('[data-link-action]');
        if (!btn || !currentContextLink) return;
        const action = btn.dataset.linkAction || '';
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
    document.addEventListener('click', e => {
        const target = e.target;
        const editorSelector = window.EDITOR_HOST_SELECTOR;
        const editor = target.closest(editorSelector);
        if (!editor) {
            hideContextToolbars();
            return;
        }
        const table = target.closest('table');
        if (table && table.closest(editorSelector)) {
            currentContextTable = table;
            showTableContextToolbar(table);
        } else {
            hideTableContextToolbar();
        }
        const link = target.closest('a');
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
    toolbar.style.top = rect.top - 40 + 'px';
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
    if (urlSpan) {
        const displayUrl = link.href.length > 30 ? link.href.substring(0, 30) + '...' : link.href;
        urlSpan.textContent = '🔗 ' + displayUrl;
        urlSpan.title = link.href;
    }
    const rect = link.getBoundingClientRect();
    toolbar.style.left = rect.left + 'px';
    toolbar.style.top = rect.bottom + 5 + 'px';
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
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.initFloatingToolbar = initFloatingToolbar;
window.initContextToolbars = initContextToolbars;
