// [SECTION:RICH_TEXT_EDITOR]
// Rich Text Editor — Selektion und Zeichenformatierung (Selection/Range-DOM,
// keine execCommand-API — Phase 9 execCommand-Ablösung). Einfügen/
// Zwischenablage/Tastatur/Tabelle: ui/editors/rich-text-insert.js.
// Floating- und Kontext-Toolbars: ui/editors/rich-text-toolbars.js.
// ============================================================
// STATE
// ============================================================
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
// EDITOR FORMATTING
// ============================================================
// Migrationsstufe 1 (Plan 09-06, Gruppe A): Selection/Range-Hilfsfunktionen
// fuer formatText(). Muster uebernommen aus applyFloatingFormat() (siehe
// initFloatingToolbar() unten), die bereits produktiv ohne die deprecated
// Editier-Kommando-API laeuft. Modul-intern, kein window-Export (CLAUDE.md
// "Export Audit Rule").
function wrapRangeWithElement(range, wrapper) {
    try {
        range.surroundContents(wrapper);
    } catch (e) {
        const fragment = range.extractContents();
        wrapper.appendChild(fragment);
        range.insertNode(wrapper);
    }
}
function unwrapEditorElement(element) {
    const parent = element.parentNode;
    if (parent) {
        while (element.firstChild) {
            parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
    }
}
// Alle contenteditable-Hosts mit eigener Editor-Toolbar. .cf-notes-editor
// (Charakter-Notizen) gehoert dazu — ohne ihn nisten Formate dort endlos
// statt zu togglen.
const EDITOR_HOST_SELECTOR = '.rich-editor, .spell-editor, .dialog-text, .cf-notes-editor';
function closestEditorAncestor(container, selector) {
    // container kann ein Text- ODER ein Element-Knoten sein (z.B. wenn die
    // Selektion per range.selectNodeContents(element) statt per
    // Zeichen-Offset auf einem Textknoten gesetzt wurde — in diesem Fall IST
    // der commonAncestorContainer bereits das Element selbst, ein zusaetzliches
    // .parentElement wuerde eine Ebene zu weit nach oben springen).
    const el = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
    return el?.closest?.(selector) || null;
}
function applyInlineFormat(editor, tagName) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText) return;
    const parentTag = closestEditorAncestor(range.commonAncestorContainer, tagName);
    if (parentTag && parentTag.closest(EDITOR_HOST_SELECTOR)) {
        unwrapEditorElement(parentTag);
    } else {
        const wrapper = document.createElement(tagName);
        wrapRangeWithElement(range, wrapper);
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(wrapper);
        selection.addRange(newRange);
    }
}
function toggleUnorderedListAtSelection(editor) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText) return;
    const parentList = closestEditorAncestor(range.commonAncestorContainer, 'ul, ol');
    if (parentList && parentList.closest(EDITOR_HOST_SELECTOR)) {
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
}
// Migrationsstufe 1 (Plan 09-06, Gruppe B): die vier UI-losen Zweige von
// formatText() (heading/font/highlight) sind ueber KEIN Template in der App
// erreichbar (09-BASELINE.md Abschnitt A2) — sie werden trotzdem
// funktionserhaltend migriert, nicht entfernt (D-06).
function clearInlineFormattingAtSelection(editor) {
    // Repliziert das vorbestehende Verhalten des alten 'removeFormat'-
    // Kommandos (empirisch verifiziert am gebauten Bundle mit b/mark/span-
    // Verschachtelung, Plan 09-07/Task 2):
    // - Standard-Auszeichnungstags (bold/italic/underline/strikethrough)
    //   werden ENTPACKT (unwrap), genau wie die alte Editier-Kommando-API es
    //   fuer diese Tags tat.
    // - Custom-Elemente (z.B. <mark>) werden NICHT entpackt — nur ihre
    //   Farb-bezogenen Style-Eigenschaften (background-color, color) werden
    //   entfernt, das Element selbst bleibt bestehen (09-BASELINE.md Zeile
    //   344, empirisch bestaetigt in editor-floating.spec.js "UI-lose Zweige").
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    ['b', 'i', 'u', 's', 'strike'].forEach(tag => {
        editor.querySelectorAll(tag).forEach(el => {
            if (selection.containsNode(el, true)) {
                unwrapEditorElement(el);
            }
        });
    });
    const styledElements = editor.querySelectorAll('[style]');
    styledElements.forEach(el => {
        if (selection.containsNode(el, true)) {
            el.style.backgroundColor = '';
            el.style.color = '';
        }
    });
}
function formatText(elementId, format, value) {
    const editor = $(elementId);
    if (!editor) return;
    editor.focus();
    if (format === 'bold') {
        applyInlineFormat(editor, 'b');
    } else if (format === 'italic') {
        applyInlineFormat(editor, 'i');
    } else if (format === 'underline') {
        applyInlineFormat(editor, 'u');
    } else if (format === 'strikethrough') {
        applyInlineFormat(editor, 'strike');
    } else if (format === 'list') {
        toggleUnorderedListAtSelection(editor);
    } else if (format === 'heading') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount && selection.toString()) {
            wrapRangeWithElement(selection.getRangeAt(0), document.createElement('h4'));
        }
    } else if (format === 'font' && value) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount && selection.toString()) {
            const fontEl = document.createElement('font');
            fontEl.setAttribute('face', value);
            wrapRangeWithElement(selection.getRangeAt(0), fontEl);
        }
    } else if (format === 'highlight') {
        if (value === 'none') {
            clearInlineFormattingAtSelection(editor);
        } else if (value) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount && selection.toString()) {
                const span = document.createElement('span');
                span.style.backgroundColor = value;
                wrapRangeWithElement(selection.getRangeAt(0), span);
            }
        }
    }
}
// Migrationsstufe 2 (Plan 09-07, Gruppe C): Schriftart/-groesse der statischen
// Toolbar werden direkt am Selektionsziel erzeugt statt ueber die deprecated
// Editier-Kommando-API + Nachbearbeitungs-Umweg (09-BASELINE.md Zeile 371/393).
// Wiederverwendet von der floating Toolbar (Plan 09-07, Gruppe D).
//
// Doppel-Dispatch-Schutz: EventDelegation._handleChange UND _handleInput
// feuern BEIDE fuer <select data-action="...">-Elemente (ui/event-delegation.js,
// ausserhalb des Scopes dieses Plans/Datei) — bei jeder Auswahl ruft die
// statische Toolbar diese Funktionen also zweimal synchron hintereinander auf.
// Die alte deprecated Editier-Kommando-API war dagegen zufaellig immun, weil
// sie auf bereits identisch formatiertem Text ein No-Op ist. Die reine
// Selection/Range-Ersetzung erzeugt ohne Schutz bei jedem Aufruf einen NEUEN
// <font>-Wrapper und verschachtelt sich bei doppeltem Dispatch — der
// `_lastFontCallKey`-Guard unten unterdrueckt den zweiten, redundanten Aufruf
// mit identischen Parametern innerhalb desselben synchronen Tasks
// (Microtask-Reset), damit das erzeugte Markup byte-gleich zur Baseline bleibt.
let _lastFontCallKey = null;
function applyFontFamilyToSelection(editor, familyValue) {
    const callKey = 'family|' + editor.id + '|' + familyValue;
    if (_lastFontCallKey === callKey) return;
    _lastFontCallKey = callKey;
    Promise.resolve().then(() => {
        if (_lastFontCallKey === callKey) _lastFontCallKey = null;
    });
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!range.toString()) return;
    // Die alte deprecated 'fontName'-Kommando-API strippt Anfuehrungszeichen
    // aus mehrteiligen Font-Stacks (empirisch verifiziert am gebauten Bundle:
    // 'Georgia, "Times New Roman", serif' -> 'Georgia, Times New Roman, serif',
    // "'Roboto', Arial, sans-serif" -> 'Roboto, Arial, sans-serif') —
    // reproduziert hier bewusst, damit das erzeugte Markup byte-gleich zur
    // Baseline bleibt.
    const faceValue = familyValue.replace(/["']/g, '');
    const existingFont = closestEditorAncestor(range.commonAncestorContainer, 'font');
    if (existingFont && existingFont.closest(EDITOR_HOST_SELECTOR)) {
        existingFont.setAttribute('face', faceValue);
        return;
    }
    const fontEl = document.createElement('font');
    fontEl.setAttribute('face', faceValue);
    wrapRangeWithElement(range, fontEl);
}
function applyFontSizeToSelection(editor, sizeValue) {
    const callKey = 'size|' + editor.id + '|' + sizeValue;
    if (_lastFontCallKey === callKey) return;
    _lastFontCallKey = callKey;
    Promise.resolve().then(() => {
        if (_lastFontCallKey === callKey) _lastFontCallKey = null;
    });
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!range.toString()) return;
    const existingFont = closestEditorAncestor(range.commonAncestorContainer, 'font');
    if (existingFont && existingFont.closest(EDITOR_HOST_SELECTOR)) {
        existingFont.style.fontSize = sizeValue;
        return;
    }
    const fontEl = document.createElement('font');
    fontEl.style.fontSize = sizeValue;
    wrapRangeWithElement(range, fontEl);
}
function setEditorFont(elementIdOrSelect, selectElOrValue) {
    // Zwei Aufrufer mit unterschiedlicher Signatur (09-BASELINE.md Fund 2):
    // - ui/actions/system-actions.js 'set-editor-font' übergibt (editorId: string, fontValue: string)
    // - ein <select>-Element als erstes Argument wird ebenfalls unterstützt (Alt-Aufrufpfad)
    let editorId;
    let fontKey;
    if (typeof elementIdOrSelect === 'object' && elementIdOrSelect && elementIdOrSelect.tagName === 'SELECT') {
        const select = elementIdOrSelect;
        editorId = select.dataset.editorId || '';
        fontKey = select.value;
    } else {
        editorId = elementIdOrSelect;
        fontKey =
            typeof selectElOrValue === 'string' ? selectElOrValue : selectElOrValue?.value;
    }
    const editor = $(editorId);
    if (!editor) return;
    editor.focus();
    if (editorSelectSavedRange) {
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(editorSelectSavedRange.cloneRange());
        }
    }
    const fonts = window.EDITOR_FONTS || {};
    applyFontFamilyToSelection(editor, fonts[fontKey] || fonts['arial']);
}
function setEditorFontSize(elementIdOrSelect, selectElOrValue) {
    // Gleiche Zwei-Aufrufer-Signatur wie setEditorFont() (09-BASELINE.md Fund 2)
    let editorId;
    let sizeValue;
    if (typeof elementIdOrSelect === 'object' && elementIdOrSelect && elementIdOrSelect.tagName === 'SELECT') {
        const select = elementIdOrSelect;
        editorId = select.dataset.editorId || '';
        sizeValue = select.value;
    } else {
        editorId = elementIdOrSelect;
        sizeValue =
            typeof selectElOrValue === 'string' ? selectElOrValue : selectElOrValue?.value;
    }
    const editor = $(editorId);
    if (!editor) return;
    editor.focus();
    if (editorSelectSavedRange) {
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(editorSelectSavedRange.cloneRange());
        }
    }
    applyFontSizeToSelection(editor, sizeValue);
}
function clearEditorFormatting(elementId) {
    const editor = $(elementId);
    if (!editor) return;
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
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.extractContents();
        const wrapper = document.createElement('span');
        wrapper.style.cssText =
            'border: 1px solid var(--gold); padding: 2px 6px; border-radius: 4px; display: inline-block;';
        wrapper.className = 'editor-border';
        wrapper.appendChild(selectedText);
        range.insertNode(wrapper);
        selection.removeAllRanges();
    }
}
function setReadAloudFormat(elementId, style = 'parchment') {
    const editor = $(elementId);
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const existingBlock =
            range.commonAncestorContainer.nodeType === Node.TEXT_NODE
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
        } else {
            const selectedContent = range.extractContents();
            const wrapper = document.createElement('div');
            wrapper.className = style === 'parchment' ? 'read-aloud' : `read-aloud ${style}`;
            wrapper.appendChild(selectedContent);
            range.insertNode(wrapper);
            const styleNames = {
                parchment: 'Pergament',
                crimson: 'Karmesin',
                violet: 'Violett',
                sage: 'Salbei',
                sky: 'Himmel',
                slate: 'Schiefer'
            };
            showToast(`📖 Vorlese-Text (${styleNames[style] || style})`);
        }
        selection.removeAllRanges();
    }
}
function removeSelectionBorders() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const editor =
        container.nodeType === Node.TEXT_NODE
            ? container.parentElement?.closest('.rich-editor, .spell-editor, .dialog-text')
            : container.closest?.('.rich-editor, .spell-editor, .dialog-text');
    if (!editor) return;
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
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.formatText = formatText;
window.setEditorFont = setEditorFont;
window.setEditorFontSize = setEditorFontSize;
window.clearEditorFormatting = clearEditorFormatting;
window.setBorderFormat = setBorderFormat;
window.setReadAloudFormat = setReadAloudFormat;
