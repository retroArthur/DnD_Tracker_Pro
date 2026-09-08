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
// Strukturbausteine, die von Formatierungs-Operationen AUSGENOMMEN bleiben:
// sie tragen ihre Optik ueber Klassen, nicht ueber Auszeichnungselemente.
// Wer sie loswerden will, entfernt den Baustein selbst (Block-Handle bzw. der
// Vorlesetext-Umschalter) — nicht "Format entfernen". Handoff Abschnitt 7.
const EDITOR_BLOCK_SELECTOR = '.editor-block, .read-aloud';

window.EDITOR_HOST_SELECTOR = EDITOR_HOST_SELECTOR;

// Sichert die aktuelle, nicht-leere Selektion fuer Bedienelemente, die den
// Fokus aus dem Editor nehmen (Selects, Aufklapp-Menues). Ohne das ist die
// Selektion beim Oeffnen eines Menues verloren und die Formatierung greift
// ins Leere. Gegenstueck: die restoreSavedRange-Zweige in setEditorFont()
// und setEditorFontSize() weiter unten.
function saveEditorSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString()) {
        editorSelectSavedRange = selection.getRangeAt(0).cloneRange();
        return true;
    }
    return false;
}
window.saveEditorSelection = saveEditorSelection;
// Code-Review 2026-09-08: Spiegel der Href-Regel aus sanitizeHTML()
// (utils/basic.js). Ohne sie schrieb die Linkfunktion jede Eingabe aus
// prompt() ungeprueft ins DOM: ein 'javascript:'-Link existierte bis zum
// naechsten Speichern, und ein voellig vernuenftiger 'mailto:'-Link
// verschwand beim Speichern KOMMENTARLOS, weil der Filter ihn verwirft.
// Diese Liste absichtlich identisch zur Sanitizer-Liste halten.
function isAllowedEditorHref(url) {
    const v = String(url || '').trim();
    if (!v) return false;
    const lower = v.toLowerCase();
    const gefaehrlich = ['javascript:', 'vbscript:', 'data:', 'file:', 'blob:'];
    if (gefaehrlich.some(proto => lower.startsWith(proto))) return false;
    return (
        lower.startsWith('http://') ||
        lower.startsWith('https://') ||
        v.startsWith('/') ||
        v.startsWith('#') ||
        v.startsWith('./')
    );
}
window.isAllowedEditorHref = isAllowedEditorHref;
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
/**
 * Harter Reset: die Flaeche behaelt nur noch ihren Text. Zerstoert auch
 * Tabellen und Bausteine und liegt deshalb seit W-17 nicht mehr auf dem
 * Papierkorb-Knopf, sondern als "Alles entkleiden" im ⋯-Menue.
 */
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
    // Code-Review 2026-09-08: ohne collapsed-Pruefung fuegt ein blosser
    // Cursorklick eine LEERE Rahmenbox ein — extractContents() liefert bei
    // kollabierter Range ein leeres Fragment — und removeAllRanges() loescht
    // danach die Auswahl, ohne eine neue Cursorposition zu setzen. Jede
    // andere Formatierfunktion dieser Datei prueft das bereits.
    if (selection && selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
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
        } else if (range.collapsed) {
            // Code-Review 2026-09-08: ohne diesen Zweig entstand bei blossem
            // Cursor ein LEERER, farbiger Vorlese-Block — und der Toast meldete
            // trotzdem Erfolg. Das Entfernen oben bleibt per Cursor moeglich.
            showToast('⚠️ Bitte zuerst Text markieren', 'error');
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
// ------------------------------------------------------------
// W-17: Formatierung entfernen, weiter gefasst als das alte
// removeFormat-Kommando.
//
// Der Unterschied zu clearInlineFormattingAtSelection(): jene Funktion
// repliziert bewusst punktgenau das Verhalten der alten Editier-Kommando-API
// (09-BASELINE.md Zeile 344) und wird von formatText(..., 'highlight', 'none')
// getragen — ein eingefrorener Test pinnt ihr Ergebnis. Sie bleibt deshalb
// unangetastet. Diese hier ist die Bedienoberflaechen-Variante: sie loest
// zusaetzlich Verknuepfungen auf und raeumt die uebrigen Inline-Stile weg.
// ------------------------------------------------------------

// Elemente, die restlos entpackt werden. <span> gehoert dazu, weil ein
// zurueckbleibendes <span> ohne Stil sonst als leeres Huellenelement im
// Markup stehen bliebe.
const EDITOR_STRIP_TAGS = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'font', 'a', 'mark', 'span'];

// Stil-Eigenschaften, die an den verbleibenden Elementen entfernt werden.
// Deckungsgleich mit Abschnitt 7 des Handoffs.
const EDITOR_STRIP_STYLE_PROPS = [
    'color',
    'background-color',
    'background',
    'font-size',
    'font-family',
    'text-shadow'
];

/**
 * Entfernt Auszeichnung in einem Bereich der Schreibflaeche.
 *
 * @param {HTMLElement} editor  contenteditable-Host
 * @param {Range|null} range    Bereich; null bedeutet: die ganze Flaeche
 */
function stripEditorFormatting(editor, range) {
    if (!editor) return;
    // Die Liste WIRD VORHER erhoben. Sobald das Entpacken laeuft, veraendert
    // sich der Baum unter dem Range, und intersectsNode() liefert fuer bereits
    // verschobene Knoten keine verlaesslichen Antworten mehr.
    const scoped = Array.from(editor.querySelectorAll('*')).filter(el => {
        // matches(), NICHT closest(): geschuetzt ist der Baustein SELBST, nicht
        // sein Inhalt. Wer im Statblock etwas fett gemacht hat und die
        // Auszeichnung wieder loswerden will, soll das koennen — der Kasten
        // bleibt trotzdem stehen.
        if (el.matches(EDITOR_BLOCK_SELECTOR)) return false;
        if (!range) return true;
        try {
            return range.intersectsNode(el);
        } catch (_e) {
            return false;
        }
    });
    scoped.forEach(el => {
        if (!el.isConnected) return;
        if (EDITOR_STRIP_TAGS.indexOf(el.tagName.toLowerCase()) !== -1) {
            unwrapEditorElement(el);
        }
    });
    scoped.forEach(el => {
        if (!el.isConnected || !el.style) return;
        EDITOR_STRIP_STYLE_PROPS.forEach(prop => el.style.removeProperty(prop));
        if (!el.getAttribute('style')) el.removeAttribute('style');
    });
    editor.normalize();
}

/**
 * Bedienpfad des Papierkorb-Knopfes. Mit Auswahl wirkt er auf die Auswahl,
 * ohne Auswahl auf die ganze Flaeche (Handoff Abschnitt 7).
 */
function clearEditorFormattingInScope(elementId) {
    const editor = $(elementId);
    if (!editor) return;
    const selection = window.getSelection();
    let range = null;
    if (selection && selection.rangeCount && !selection.isCollapsed) {
        const candidate = selection.getRangeAt(0);
        // Nur uebernehmen, wenn die Auswahl tatsaechlich in DIESEM Editor liegt.
        if (editor.contains(candidate.commonAncestorContainer)) range = candidate;
    }
    stripEditorFormatting(editor, range);
    showToast('🧹 Formatierung entfernt');
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
// Schriftfarbe innerhalb eines Markers. Bewusst ein fester dunkler Wert und
// keine Themenvariable: der Marker-Hintergrund ist in allen vier Themes
// derselbe helle Farbton, die Schrift darauf muss also in allen vieren dunkel
// sein. 'inherit' hat genau das gebrochen.
const MARKER_TEXT_COLOR = '#141414';

// ------------------------------------------------------------
// Aktiver Formatzustand (B/I/U/S)
// ------------------------------------------------------------
// Ohne queryCommandState: die deprecated Editier-Kommando-API ist in diesem
// Projekt auf 0 und bleibt es. Stattdessen wird vom Cursor aus nach oben
// gelaufen und geprueft, welche Formatelemente zwischen Cursor und Editor
// liegen — dieselbe Technik, die applyInlineFormat() zum Togglen nutzt.
const EDITOR_FORMAT_TAGS = {
    B: 'bold',
    STRONG: 'bold',
    I: 'italic',
    EM: 'italic',
    U: 'underline',
    S: 'strikethrough',
    STRIKE: 'strikethrough'
};

function getActiveFormatsAtSelection(editor) {
    const active = new Set();
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !editor) return active;
    const range = selection.getRangeAt(0);
    let node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    // Nur innerhalb DIESES Editors laufen — sonst faerbte eine Auswahl in
    // einem anderen Editor die Leiste hier mit ein.
    if (!node || !editor.contains(node)) return active;
    while (node && node !== editor) {
        const fmt = EDITOR_FORMAT_TAGS[node.tagName];
        if (fmt) active.add(fmt);
        node = node.parentElement;
    }
    return active;
}
window.getActiveFormatsAtSelection = getActiveFormatsAtSelection;

// ------------------------------------------------------------
// Marker (Texthervorhebung) — eine Implementierung fuer alle drei Wege
// ------------------------------------------------------------
// Vorher lagen hier DREI Fassungen mit unterschiedlichem Markup nebeneinander:
// die der schwebenden Leiste (padding '0 2px'), die der statischen Leiste
// ('0 3px') und ein toter <span>-Zweig in formatText(). Auseinanderlaufendes
// Markup fuer dieselbe Nutzeraktion ist genau die Klasse Fehler, die spaeter
// als "der Marker sieht woanders anders aus" auffaellt.
//
// Stufe B (Handoff 2a, Abschnitt 1): der Marker setzt IMMER Hintergrund UND
// dunkle Schriftfarbe. Heller Text auf hellem Marker war der groesste
// Lesbarkeitsfehler des Alt-Zustands — bei 'inherit' erbte die Schrift die
// helle Themenfarbe und verschwand auf Gold/Gruen praktisch.
// Das Padding ist zugleich auf einen Wert vereinheitlicht; vorher lieferten
// statische und schwebende Leiste unterschiedliches Markup.
function applyMarkerToSelection(editor, color, savedRange) {
    let selection = window.getSelection();
    if ((!selection || !selection.toString()) && savedRange) {
        editor.focus();
        selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(savedRange.cloneRange());
        }
    }
    if (!selection || !selection.rangeCount) return false;
    const range = selection.getRangeAt(0);
    if (!range.toString()) return false;

    if (color === 'transparent') {
        // Beim Entfernen wird das <mark> aufgeloest; die dunkle Schriftfarbe
        // verschwindet damit automatisch mit — ein eigener Ruecksetzschritt
        // fuer die Farbe ist nicht noetig.
        const marks = editor.querySelectorAll('mark');
        marks.forEach(mark => {
            if (selection.containsNode(mark, true)) {
                const parent = mark.parentNode;
                if (parent) {
                    while (mark.firstChild) {
                        parent.insertBefore(mark.firstChild, mark);
                    }
                    parent.removeChild(mark);
                }
            }
        });
        return true;
    }

    const wrapper = document.createElement('mark');
    wrapper.style.backgroundColor = color.startsWith('#') ? color + '66' : color;
    wrapper.style.color = MARKER_TEXT_COLOR;
    wrapper.style.borderRadius = '2px';
    wrapper.style.padding = '0 2px';
    try {
        range.surroundContents(wrapper);
    } catch (e) {
        // surroundContents wirft, sobald die Auswahl Elementgrenzen schneidet.
        const fragment = range.extractContents();
        wrapper.appendChild(fragment);
        range.insertNode(wrapper);
    }
    return true;
}
window.applyMarkerToSelection = applyMarkerToSelection;

window.formatText = formatText;
window.setEditorFont = setEditorFont;
window.setEditorFontSize = setEditorFontSize;
window.clearEditorFormatting = clearEditorFormatting;
window.clearEditorFormattingInScope = clearEditorFormattingInScope;
window.stripEditorFormatting = stripEditorFormatting;
window.setBorderFormat = setBorderFormat;
window.setReadAloudFormat = setReadAloudFormat;
