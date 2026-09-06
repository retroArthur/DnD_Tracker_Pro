// [SECTION:RICH_TEXT_EDITOR]
// Rich Text Editor mit Floating Toolbar (Selection/Range-DOM, kein
// document.execCommand — Phase 9 execCommand-Ablösung)
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
function initEditorPasteHandlers() {
    if (editorHandlersInitialized) return;
    editorHandlersInitialized = true;
    const editorIds = [
        'char-notes',
        'npc-desc',
        'loc-desc',
        'quest-desc',
        'quest-epilog',
        'enc-traits',
        'enc-equipment',
        'enc-actions',
        'enc-skills',
        'loot-desc',
        'spell-desc',
        'spell-note',
        'session-text',
        'link-desc',
        'wiki-content',
        'quick-ref-entry-content'
    ];
    // Migrationsgruppe G (Plan 09-09, letzte Call-Site): Der Setup-Aufruf der
    // deprecated Editier-Kommando-API entfällt ersatzlos. Empirisch belegt
    // (09-BASELINE.md, Abschnitt A1): reguläres Enter wird von
    // handleEditorKeydown() immer abgefangen (insertLineBreakAtSelection()),
    // native Absatztrennung greift hier nie; Shift+Enter fällt zwar zur
    // nativen Browser-Behandlung durch, ist aber browserübergreifend als
    // weicher Zeilenumbruch (<br>) spezifiziert — der Browser verwendet hier
    // bereits den in A1 protokollierten Absatztrenner als Vorgabe, unabhängig
    // vom Setup-Aufruf. Der A1-Referenztest (editor-insert.spec.js) bleibt
    // unverändert und beweist das messbar.
    editorIds.forEach(id => {
        const editor = $(id);
        if (editor && editor.getAttribute('contenteditable') === 'true') {
            editor.addEventListener('paste', handleEditorPaste);
            editor.addEventListener('input', handleMarkdownInput);
        }
    });
    document.addEventListener(
        'paste',
        function (e) {
            const target = e.target;
            if (
                target.classList.contains('rich-editor') ||
                target.classList.contains('dialog-text-area')
            ) {
                handleEditorPaste(e);
            }
        },
        true
    );
    document.addEventListener(
        'input',
        function (e) {
            const target = e.target;
            if (
                target.classList.contains('rich-editor') ||
                target.classList.contains('dialog-text')
            ) {
                handleMarkdownInput(e);
            }
        },
        true
    );
    document.addEventListener(
        'keydown',
        function (e) {
            const target = e.target;
            if (
                target.classList.contains('rich-editor') ||
                target.classList.contains('dialog-text-area')
            ) {
                handleEditorKeydown(e);
            }
        },
        true
    );
}
// Migrationsstufe 3 (Plan 09-08, Gruppe E): Ersatz fuer die deprecated
// Editier-Kommando-API ('insertHTML'|'insertText') ueber eine Range-eigene
// Parse-Funktion (Range.createContextualFragment()). Korrektur (Plan 10-06,
// CR-01): die urspruengliche Behauptung, diese Parse-Funktion fuehre
// Skript-Inhalte laut Spezifikation grundsaetzlich nicht aus, war unpraezise
// und gilt NUR fuer parser-erzeugte <script>-Elemente (die sind laut Spec
// inert). Sie gilt NICHT fuer ein eingebettetes Rahmen-Element mit
// Inline-Dokument-Attribut (<iframe srcdoc>) — dessen Inhalt laeuft im
// eigenen, aber origin-erbenden Browsing-Kontext und wird beim Einfuegen
// sofort ausgefuehrt (empirisch bestaetigt, 10-REVIEW.md CR-01). Diese
// Funktion fuegt AUSSCHLIESSLICH ein, sie bereinigt nicht — die Bereinigung
// liegt vollstaendig beim Aufrufer: handleEditorPaste()s Tabellenzweig fuehrt
// sein Markup seit Plan 10-06 durch den projektweiten Allowlist-Sanitizer
// window.sanitizeHTML() (utils/basic.js) als LETZTE Stufe vor diesem Aufruf;
// die Whitelist beim Speichern bleibt zusaetzlich unveraendert nachgeschaltet.
// Modul-intern, kein window-Export (CLAUDE.md "Export Audit Rule").
//
// Stil-Nachbereinigung (D-02, byte-gleiches Markup): die alte
// 'insertHTML'-Editier-Kommando-API wendet auf eingefuegte Inline-Styles
// empirisch eine feste Bereinigung an (per Probe-Skripten gegen das gebaute
// Bundle verifiziert, Chromium 143.0.7499.4, siehe 09-08-SUMMARY.md): Die
// Layout-Eigenschaften padding/margin/width/border-collapse werden IMMER
// entfernt. Bleiben danach mehr als eine Deklaration uebrig, wird eine darin
// enthaltene 'background'-Kurzform in acht LEERE Langform-Eigenschaften
// aufgesplittet und eine enthaltene 'color'-Deklaration ersatzlos entfernt —
// ein reproduzierbarer Chromium-Effekt bei Mehrfach-Deklarationen mit
// CSS-Custom-Property-Werten, der 'border' NICHT betrifft.
// Range.createContextualFragment() durchlaeuft diese Editier-Kommando-eigene
// Bereinigung nicht (reines DOM-Parsing) — die Funktion unten repliziert sie
// bewusst, ausschliesslich fuer neu eingefuegte Elemente, damit das erzeugte
// Markup byte-gleich zur Baseline bleibt.
const STRIP_STYLE_PROPS = new Set(['padding', 'margin', 'width', 'border-collapse']);
const EMPTY_BACKGROUND_LONGHANDS = [
    'background-image',
    'background-position-x',
    'background-position-y',
    'background-size',
    'background-repeat',
    'background-attachment',
    'background-origin',
    'background-clip'
];
function sanitizeInsertedInlineStyle(el) {
    const raw = el.getAttribute('style');
    if (!raw) return;
    const declarations = raw
        .split(';')
        .map(d => d.trim())
        .filter(Boolean)
        .map(d => {
            const idx = d.indexOf(':');
            return idx === -1 ? null : [d.slice(0, idx).trim().toLowerCase(), d.slice(idx + 1).trim()];
        })
        .filter(Boolean);
    const kept = declarations.filter(([name]) => !STRIP_STYLE_PROPS.has(name));
    const stripped = kept.length !== declarations.length;
    if (kept.length === 0) {
        el.removeAttribute('style');
        return;
    }
    if (kept.length === 1 && !stripped) {
        return;
    }
    if (kept.length === 1) {
        el.setAttribute('style', `${kept[0][0]}: ${kept[0][1]};`);
        return;
    }
    const expanded = [];
    kept.forEach(([name, value]) => {
        if (name === 'background') {
            EMPTY_BACKGROUND_LONGHANDS.forEach(longhand => expanded.push(`${longhand}: ;`));
        } else if (name !== 'color') {
            expanded.push(`${name}: ${value};`);
        }
    });
    el.setAttribute('style', expanded.join(' '));
}
// Cursor-Position nach dem Einfuegen: die alte 'insertHTML'-Editier-Kommando-
// API platziert den Cursor empirisch NICHT als Geschwister-Knoten hinter dem
// zuletzt eingefuegten Top-Level-Knoten, sondern am tiefsten letzten
// Nachfahren (z.B. innerhalb der letzten Tabellenzelle, direkt hinter deren
// Textinhalt) — reproduzierbar am doppelt feuernden Paste-Listener (Fund 3,
// 09-BASELINE.md): die zweite Einfuegung landet dort verschachtelt statt als
// Geschwister-Tabelle. Der Abstieg unten repliziert das bewusst, damit das
// erzeugte Markup byte-gleich zur Baseline bleibt.
function insertHtmlAtSelection(htmlString) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const fragment = range.createContextualFragment(htmlString);
    fragment.querySelectorAll('[style]').forEach(sanitizeInsertedInlineStyle);
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);
    if (lastNode) {
        let deepest = lastNode;
        while (deepest.lastChild) {
            deepest = deepest.lastChild;
        }
        if (deepest.nodeType === Node.TEXT_NODE) {
            range.setStart(deepest, deepest.length);
        } else {
            range.setStartAfter(deepest);
        }
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
function insertTextAtSelection(text) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}
// Migrationsstufe 3 (Plan 09-08, Gruppe F): Ersatz fuer die deprecated
// 'insertLineBreak'-Editier-Kommando-API (09-RESEARCH.md Pattern 4). Fuegt
// einen <br>-Knoten an der Selektion ein, sodass unmittelbar weitergetippter
// Text hinter dem Umbruch landet — byte-gleich zur 09-BASELINE.md-Referenz
// ('ZeileEins<br>ZeileZwei', kein zusaetzlicher Knoten im Endergebnis).
//
// Platzhalter-Knoten noetig (empirisch verifiziert, siehe Task-Vorgabe):
// Chromium platziert eine Selektion, die per Range/Selection-API auf die
// Position UNMITTELBAR HINTER einem abschliessenden <br> ohne nachfolgenden
// Inhalt zeigt (egal ob per Container-Kindindex oder per leerem
// Rest-Textknoten adressiert), beim naechsten Tippen NICHT stabil dort —
// der neue Text landet stattdessen kommentarlos VOR dem <br>, der Umbruch
// selbst wandert ans Ende. Ein Textknoten mit sichtbarem (wenn auch
// unsichtbarem Zero-Width-Space-)Inhalt nach dem <br> gibt der Selektion
// einen stabilen Text-Anker, an dem Chromium die Cursor-Position korrekt
// haelt. Der Platzhalter wird beim naechsten echten Tastatur-Input (oder
// beim Verlassen des Editors, falls nie weitergetippt wird) automatisch per
// deleteData() entfernt — deleteData() an der exakten Zeichen-Position laesst
// eine Selektion, die GENAU an der Loeschgrenze steht, unangetastet (im
// Gegensatz zu einer kompletten .data-Neuzuweisung, die eine solche
// Selektion auf den Anfang zurueckwirft), sodass unmittelbar weitergetippter
// Text nicht verspringt und das Endergebnis keinen Zero-Width-Space enthaelt.
function insertLineBreakAtSelection() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const br = document.createElement('br');
    range.insertNode(br);
    const editor = br.parentNode;
    let placeholder = br.nextSibling;
    if (!placeholder || placeholder.nodeType !== Node.TEXT_NODE) {
        placeholder = document.createTextNode('');
        br.after(placeholder);
    }
    const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);
    placeholder.data = ZERO_WIDTH_SPACE;
    const newRange = document.createRange();
    newRange.setStart(placeholder, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    const cleanupPlaceholder = () => {
        if (placeholder.isConnected) {
            const zwspIndex = placeholder.data.indexOf(ZERO_WIDTH_SPACE);
            if (zwspIndex !== -1) placeholder.deleteData(zwspIndex, 1);
        }
        editor.removeEventListener('input', cleanupPlaceholder);
        editor.removeEventListener('blur', cleanupPlaceholder);
    };
    editor.addEventListener('input', cleanupPlaceholder, { once: true });
    editor.addEventListener('blur', cleanupPlaceholder, { once: true });
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
        insertLineBreakAtSelection();
    }
}
function handleEditorPaste(e) {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');
    if (html && (html.includes('<table') || html.includes('<TABLE'))) {
        const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
        if (tableMatch) {
            const cleanTable = tableMatch[0]
                // Kosmetik-Kette (D-01, Plan 10-06): entfernt und normalisiert nur
                // noch Darstellungs-Rauschen (Google-Sheets-Wrapper, Kommentare,
                // Meta-/Style-Bloecke, Layout-Attribute) und injiziert die
                // Default-Tabellenoptik. Sie ist ausdruecklich KEINE
                // Sicherheitskontrolle mehr — die fruehere, leerraum-abhaengige
                // und damit umgehbare Ereignis-Attribut-Ersetzung an dieser
                // Stelle (Plan 10-04) wurde entfernt (10-VERIFICATION.md
                // Anti-Pattern-Tabelle, 10-REVIEW.md CR-01: beide Muster
                // verlangten ein fuehrendes Leerzeichen und liessen sich durch
                // ein direkt anschliessendes Attribut umgehen). Die Sperre
                // nicht erlaubter Elemente und Ereignis-Attribute erfolgt
                // jetzt ausschliesslich DOM-basiert im Allowlist-Sanitizer
                // weiter unten und ist dort nicht an Leerraum vor dem
                // Attributnamen gebunden.
                .replace(
                    /\s+(class|style|width|height|border|cellpadding|cellspacing|align|valign|bgcolor|xmlns|x:|data-[\w-]+)="[^"]*"/gi,
                    ''
                )
                .replace(/<\/?colgroup[^>]*>/gi, '')
                .replace(/<\/?col[^>]*>/gi, '')
                .replace(/<\/?tbody[^>]*>/gi, '')
                .replace(/<\/?thead[^>]*>/gi, '')
                .replace(/<\/?tfoot[^>]*>/gi, '')
                .replace(new RegExp('<!' + '--[\\s\\S]*?-->', 'g'), '')
                .replace(/<google-sheets-html-origin[^>]*>/gi, '')
                .replace(/<\/google-sheets-html-origin>/gi, '')
                .replace(/<meta[^>]*>/gi, '')
                .replace(new RegExp('<style[^>]*>[\\s\\S]*?</sty' + 'le>', 'gi'), '')
                .replace(/\s+>/g, '>')
                .replace(/<(\w+)\s+>/g, '<$1>')
                .replace(
                    /<table>/gi,
                    '<table style="width:100%; border-collapse:collapse; margin:8px 0;">'
                )
                .replace(
                    /<th>/gi,
                    '<th style="border:1px solid var(--border); padding:6px 10px; background:var(--bg-elevated); color:var(--gold);">'
                )
                .replace(
                    /<td>/gi,
                    '<td style="border:1px solid var(--border); padding:6px 10px;">'
                );
            // Sanitisierungsstufe (D-01, Plan 10-06, CR-01): der projektweite
            // DOM-basierte Allowlist-Sanitizer laeuft NACH der obigen
            // Kosmetik-Kette, nicht davor — er ist damit die LETZTE
            // Transformation vor dem Einfuegen; nach ihm kann keine
            // Zeichenketten-Ersetzung mehr ein nicht erlaubtes Element
            // (iframe/object/embed/svg/form/img) oder ein gefaehrliches
            // Protokoll (javascript:/vbscript:/data:/file:/blob:, die
            // vollstaendige dangerousProtocols-Liste aus utils/basic.js)
            // wieder einfuehren, auch nicht entitaets-kodiert (der
            // DOM-Parser dekodiert Attributwerte vor der Protokollpruefung).
            // Die von der Kette injizierten
            // Stil-Eigenschaften (border, padding, width, margin,
            // border-collapse, background, color) ueberleben die
            // Stil-Filterung, weil sie saemtlich in sanitizeHTML()s
            // allowedAttributes.style stehen (utils/basic.js) — gegen den
            // dortigen Quelltext geprueft, nicht angenommen. Aufruf ueber die
            // Fenster-Eigenschaft, NICHT ueber eine gleichnamige lokale
            // Konstante (CLAUDE.md, Muster fuer doppelte Deklarationen).
            const sanitizerReachable = typeof window.sanitizeHTML === 'function';
            const safeTable = sanitizerReachable ? window.sanitizeHTML(cleanTable) : '';
            // Fail-closed (T-10-26): ist der Sanitizer zur Laufzeit nicht
            // erreichbar ODER ergibt seine Bereinigung keinen Inhalt (nur
            // Leerraum), wird ausschliesslich der Klartext-Anteil der
            // Zwischenablage eingefuegt — es existiert kein Pfad, auf dem
            // ungeprueftes Markup eingefuegt wird, und es bleibt kein leeres
            // Tabellengeruest zurueck.
            if (!safeTable.trim()) {
                insertTextAtSelection(text);
                return;
            }
            insertHtmlAtSelection(safeTable);
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
                    } else {
                        tableHtml += `<td style="border:1px solid var(--border); padding:6px 10px;">${escapeHtml(cell.trim())}</td>`;
                    }
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</table>';
            insertHtmlAtSelection(tableHtml);
            showToast('📊 Tabelle eingefügt (' + lines.length + ' Zeilen)');
            return;
        }
    }
    insertTextAtSelection(text);
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function insertTable(rows = 3, cols = 3) {
    const editor = floatingToolbarTarget || document.activeElement;
    if (
        !editor ||
        (!editor.classList.contains('rich-editor') &&
            !editor.classList.contains('spell-editor') &&
            !editor.classList.contains('dialog-text'))
    ) {
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
    insertHtmlAtSelection(tableHtml);
    showToast('📊 Tabelle eingefügt (3×3) - Strg+Shift+T');
    hideFloatingToolbar();
}
function updateStickyOffsets() {
    const header = document.querySelector('.app-header');
    if (!header) return;
    const isMobile = document.documentElement.dataset.layout === 'mobile';
    if (isMobile) {
        document.documentElement.style.setProperty('--header-height', '0px');
    } else {
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
    if (floatingToolbarInitialized) return;
    floatingToolbarInitialized = true;
    // EDITOR_FONTS/TOOLBAR_DIMENSIONS werden NICHT hier als lokale const gebunden:
    // Build-Dedup-Pass entfernt die zweite Deklaration desselben Bezeichners
    // (CLAUDE.md "Duplicate Declaration Debugging Pattern") — direkter window.*-Zugriff
    // an den Verwendungsstellen unten vermeidet den Bundle-Laufzeitfehler.
    const toolbar = $('floating-toolbar');
    if (!toolbar) return;
    document.querySelectorAll('.editor-toolbar').forEach(editorToolbar => {
        editorToolbar.addEventListener('mousedown', e => {
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
            !target.closest('.rich-editor, .spell-editor, .dialog-text')
        ) {
            hideFloatingToolbar();
        }
    });
    document.addEventListener('keydown', e => {
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
            if (parentTag && parentTag.closest('.rich-editor, .spell-editor, .dialog-text')) {
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
function handleSelectionChange() {
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
                  '.rich-editor, .spell-editor, .dialog-text, .cf-notes-editor'
              )
            : anchorNode.closest?.('.rich-editor, .spell-editor, .dialog-text, .cf-notes-editor');
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
    } else {
        const wrapper = document.createElement('mark');
        wrapper.style.backgroundColor = color.startsWith('#') ? color + '66' : color;
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
