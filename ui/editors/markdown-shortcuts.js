// [SECTION:MARKDOWN_SHORTCUTS]
// Markdown Live Shortcuts für Rich-Text-Editor
// Zeilen: ~200
// ============================================================
// STATE
// ============================================================
let markdownInputTimeout = null;

// ============================================================
// MARKDOWN INPUT HANDLER
// ============================================================
/**
 * Handle markdown input events with debouncing
 * Called on input event in contenteditable fields
 * @param {Event} e - Input event
 */
function handleMarkdownInput(e) {
    const D = window.D;
    const APP_CONFIG = window.APP_CONFIG;

    // Check if markdown shortcuts are enabled
    if (!D.settings?.enableMarkdownShortcuts) return;

    // Debounce input processing (similar to floating toolbar timing)
    if (markdownInputTimeout) clearTimeout(markdownInputTimeout);

    markdownInputTimeout = setTimeout(() => {
        processMarkdownShortcuts(e.target);
    }, 150);
}

/**
 * Process markdown patterns near cursor and convert to HTML
 * @param {HTMLElement} editor - Contenteditable editor element
 */
function processMarkdownShortcuts(editor) {
    const MARKDOWN_PATTERNS = window.MARKDOWN_PATTERNS;
    const sanitizeHTML = window.sanitizeHTML;

    if (!editor || !MARKDOWN_PATTERNS) return;

    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;

    const textNode = selection.anchorNode;
    const cursorOffset = selection.anchorOffset;

    // Only process text nodes
    if (textNode.nodeType !== Node.TEXT_NODE) return;

    const text = textNode.textContent || '';
    if (!text || text.length === 0) return;

    // Check for markdown patterns near cursor
    // Look at text from start to cursor position + 20 chars buffer
    const endPos = Math.min(cursorOffset + 20, text.length);
    const searchText = text.substring(0, endPos);

    // Try to match patterns
    const matches = [];

    // Bold: **text** or __text__
    const boldMatch = searchText.match(/(\*\*|__)((?:(?!\1).){1,50})\1(?=\s|$)/);
    if (boldMatch && boldMatch.index + boldMatch[0].length <= cursorOffset + 1) {
        matches.push({
            type: 'bold',
            match: boldMatch,
            startIndex: boldMatch.index,
            endIndex: boldMatch.index + boldMatch[0].length,
            content: boldMatch[2]
        });
    }

    // Italic: *text* or _text_
    const italicMatch = searchText.match(/(?<!\*|_)(\*|_)((?:(?!\1).){1,50})\1(?=\s|$)/);
    if (italicMatch && italicMatch.index + italicMatch[0].length <= cursorOffset + 1) {
        matches.push({
            type: 'italic',
            match: italicMatch,
            startIndex: italicMatch.index,
            endIndex: italicMatch.index + italicMatch[0].length,
            content: italicMatch[2]
        });
    }

    // Strikethrough: ~~text~~
    const strikeMatch = searchText.match(/(~~)((?:(?!\1).){1,50})\1(?=\s|$)/);
    if (strikeMatch && strikeMatch.index + strikeMatch[0].length <= cursorOffset + 1) {
        matches.push({
            type: 'strike',
            match: strikeMatch,
            startIndex: strikeMatch.index,
            endIndex: strikeMatch.index + strikeMatch[0].length,
            content: strikeMatch[2]
        });
    }

    // Code: `text`
    const codeMatch = searchText.match(/(`)((?:(?!\1).){1,50})\1(?=\s|$)/);
    if (codeMatch && codeMatch.index + codeMatch[0].length <= cursorOffset + 1) {
        matches.push({
            type: 'code',
            match: codeMatch,
            startIndex: codeMatch.index,
            endIndex: codeMatch.index + codeMatch[0].length,
            content: codeMatch[2]
        });
    }

    // Apply the first (closest) match
    if (matches.length > 0) {
        const match = matches[0];
        applyMarkdownFormat(editor, textNode, match);
    }
}

/**
 * Apply markdown formatting by converting markdown to HTML
 * @param {HTMLElement} editor - Editor element
 * @param {Node} textNode - Text node containing markdown
 * @param {Object} match - Match object with type, content, startIndex, endIndex
 */
function applyMarkdownFormat(editor, textNode, match) {
    const sanitizeHTML = window.sanitizeHTML;

    try {
        // Save cursor position
        const selection = window.getSelection();
        const cursorOffset = selection.anchorOffset;

        // Extract text parts
        const fullText = textNode.textContent || '';
        const beforeText = fullText.substring(0, match.startIndex);
        const afterText = fullText.substring(match.endIndex);

        // Create HTML element based on type
        let htmlElement;
        switch (match.type) {
            case 'bold':
                htmlElement = document.createElement('b');
                break;
            case 'italic':
                htmlElement = document.createElement('i');
                break;
            case 'strike':
                htmlElement = document.createElement('s');
                break;
            case 'code':
                htmlElement = document.createElement('code');
                htmlElement.style.cssText = 'background: var(--bg-elevated); padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 0.9em;';
                break;
            default:
                return;
        }

        // Set content (sanitized)
        htmlElement.textContent = match.content;

        // Create a document fragment to replace the text node
        const fragment = document.createDocumentFragment();

        // Add text before
        if (beforeText) {
            fragment.appendChild(document.createTextNode(beforeText));
        }

        // Add formatted element
        fragment.appendChild(htmlElement);

        // Add text after with cursor marker
        const afterNode = document.createTextNode(afterText);
        fragment.appendChild(afterNode);

        // Replace the text node
        const parent = textNode.parentNode;
        if (parent) {
            parent.replaceChild(fragment, textNode);

            // Restore cursor position after the formatted element
            const newCursorOffset = cursorOffset - match.endIndex + afterText.length;
            if (newCursorOffset >= 0 && afterNode) {
                const range = document.createRange();
                range.setStart(afterNode, 0);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }

        // Debug log in DEBUG_MODE
        if (window.APP_CONFIG?.DEBUG_MODE) {
            console.log('[Markdown] Applied', match.type, 'formatting:', match.content);
        }

    } catch (err) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            console.warn('[Markdown] Format failed:', err);
        }
    }
}

// ============================================================
// INITIALIZATION
// ============================================================
/**
 * Initialize markdown settings UI
 * Should be called after DOM is loaded
 */
function initMarkdownSettings() {
    const D = window.D;
    const save = window.save;
    const $ = window.$;

    // Sync checkbox with saved setting
    const checkbox = $('markdown-shortcuts-toggle');
    if (checkbox && D.settings) {
        checkbox.checked = D.settings.enableMarkdownShortcuts !== false; // Default true

        // Listen to changes
        checkbox.addEventListener('change', function() {
            if (!D.settings) D.settings = {};
            D.settings.enableMarkdownShortcuts = checkbox.checked;
            if (typeof save === 'function') {
                save();
            }

            // Show toast
            const showToast = window.showToast;
            if (typeof showToast === 'function') {
                showToast(checkbox.checked ? '✅ Markdown Shortcuts aktiviert' : '❌ Markdown Shortcuts deaktiviert');
            }
        });
    }
}

// ============================================================
// EXPORTS
// ============================================================
window.handleMarkdownInput = handleMarkdownInput;
window.processMarkdownShortcuts = processMarkdownShortcuts;
window.applyMarkdownFormat = applyMarkdownFormat;
window.initMarkdownSettings = initMarkdownSettings;
