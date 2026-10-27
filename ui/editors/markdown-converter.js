// [SECTION:MARKDOWN_CONVERTER]
// HTML ↔ Markdown Converter für Import/Export
// Zeilen: ~250
// ============================================================
// HTML TO MARKDOWN
// ============================================================
/**
 * Convert HTML to Markdown
 * @param {string} html - HTML string to convert
 * @returns {string} Markdown string
 */
function htmlToMarkdown(html) {
    if (!html || typeof html !== 'string') return '';

    // Create temporary container to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    return convertNodeToMarkdown(temp);
}

/**
 * Recursively convert DOM node to Markdown
 * @param {Node} node - DOM node to convert
 * @returns {string} Markdown string
 */
function convertNodeToMarkdown(node) {
    if (!node) return '';

    // Text node
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
    }

    // Element node
    if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        let markdown = '';

        switch (tag) {
            // Betonung liest die KINDER, nicht textContent: textContent
            // verschluckt <br> ("<b>eins<br>zwei</b>" wurde "**einszwei**") und
            // jede Formatierung darin (MARKDOWN, docs/bugfixes.md).
            case 'b':
            case 'strong':
                markdown = wrapMarkdownLines(convertChildrenToMarkdown(node), '**', '**');
                break;

            case 'i':
            case 'em':
                markdown = wrapMarkdownLines(convertChildrenToMarkdown(node), '*', '*');
                break;

            case 's':
            case 'strike':
            case 'del':
                markdown = wrapMarkdownLines(convertChildrenToMarkdown(node), '~~', '~~');
                break;

            case 'u':
                // Markdown kennt keine Unterstreichung. Als Inline-HTML reicht
                // markdownToHtml() sie durch, und sanitizeHTML() erlaubt <u>.
                markdown = wrapMarkdownLines(convertChildrenToMarkdown(node), '<u>', '</u>');
                break;

            case 'code':
                markdown = `\`${getTextContent(node)}\``;
                break;

            case 'h1':
                markdown = `# ${getTextContent(node)}\n\n`;
                break;
            case 'h2':
                markdown = `## ${getTextContent(node)}\n\n`;
                break;
            case 'h3':
                markdown = `### ${getTextContent(node)}\n\n`;
                break;
            case 'h4':
                markdown = `#### ${getTextContent(node)}\n\n`;
                break;
            case 'h5':
                markdown = `##### ${getTextContent(node)}\n\n`;
                break;
            case 'h6':
                markdown = `###### ${getTextContent(node)}\n\n`;
                break;

            case 'a': {
                const href = node.getAttribute('href') || '';
                const linkText = getTextContent(node);
                markdown = `[${linkText}](${href})`;
                break;
            }

            case 'ul':
            case 'ol': {
                const listItems = Array.from(node.children).filter(
                    child => child.tagName.toLowerCase() === 'li'
                );
                markdown =
                    listItems
                        .map((li, index) => {
                            const prefix = tag === 'ul' ? '-' : `${index + 1}.`;
                            return `${prefix} ${getTextContent(li)}`;
                        })
                        .join('\n') + '\n\n';
                break;
            }

            case 'blockquote': {
                const lines = getTextContent(node).split('\n');
                markdown = lines.map(line => `> ${line}`).join('\n') + '\n\n';
                break;
            }

            case 'table':
                markdown = convertTableToMarkdown(node);
                break;

            case 'br':
                markdown = '\n';
                break;

            case 'p':
            case 'div':
                // Check for read-aloud class
                if (node.classList.contains('read-aloud')) {
                    // Mehrzeilig: der Block traegt Zeilenumbrueche und Formatierung.
                    markdown = `:::read-aloud\n${convertChildrenToMarkdown(node).trim()}\n:::\n\n`;
                } else {
                    markdown = convertChildrenToMarkdown(node) + '\n\n';
                }
                break;

            default:
                // Process children for unknown tags
                markdown = convertChildrenToMarkdown(node);
                break;
        }

        return markdown;
    }

    return '';
}

/**
 * Elemente, die in Markdown auf einer eigenen Zeile beginnen muessen —
 * "Text<h2>X</h2>" ergab sonst "Text## X", also keine Ueberschrift.
 */
const MARKDOWN_EXPORT_BLOCK_TAGS = [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'blockquote',
    'table',
    'p',
    'div'
];

/**
 * Wandelt die Kinder eines Knotens. Ein Block-Element bekommt davor eine
 * Leerzeile ("\n\n" ZUSAETZLICH zu Zeilenumbruechen davor), ausser es folgt
 * auf einen Block, der seine Leerzeile schon mitbringt. markdownToHtml()
 * nimmt diese Leerzeile wieder als Blockgrenze weg — ein <br> davor bleibt.
 * @param {Node} node - DOM node
 * @returns {string} Markdown string
 */
function convertChildrenToMarkdown(node) {
    const istBlock = child =>
        child.nodeType === Node.ELEMENT_NODE &&
        MARKDOWN_EXPORT_BLOCK_TAGS.includes(child.tagName.toLowerCase());
    let markdown = '';
    let vorigerBlock = true;
    for (const child of node.childNodes) {
        const teil = convertNodeToMarkdown(child);
        if (!teil) continue;
        const block = istBlock(child);
        if (block && !vorigerBlock && markdown) markdown += '\n\n';
        markdown += teil;
        vorigerBlock = block;
    }
    return markdown;
}

/**
 * Setzt Betonung JE ZEILE: markdownToHtml() erkennt "**…**" nur innerhalb
 * einer Zeile, ein "**eins\nzwei**" bliebe Text. Leerraum am Rand bleibt
 * ausserhalb der Marken, leere Zeilen bleiben leer.
 * @param {string} inhalt - schon gewandeltes Markdown
 * @param {string} auf - oeffnende Marke
 * @param {string} zu - schliessende Marke
 * @returns {string}
 */
function wrapMarkdownLines(inhalt, auf, zu) {
    return inhalt
        .split('\n')
        .map(zeile => {
            const teile = zeile.match(/^(\s*)([\s\S]*?)(\s*)$/);
            return teile && teile[2] ? `${teile[1]}${auf}${teile[2]}${zu}${teile[3]}` : zeile;
        })
        .join('\n');
}

/**
 * Text eines Elements fuer die EINZEILIGEN Markdown-Formen (Ueberschrift,
 * Link, Listenpunkt, Zelle, Code). Ein <br> darin wird zum Leerzeichen —
 * textContent verschluckt ihn und klebt "eins<br>zwei" zu "einszwei".
 * @param {Node} node - DOM node
 * @returns {string} Text content
 */
function getTextContent(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return (node.textContent || '').trim();
    const kopie = /** @type {Element} */ (node.cloneNode(true));
    kopie.querySelectorAll('br').forEach(br => br.replaceWith(' '));
    return (kopie.textContent || '').trim();
}

/**
 * Convert HTML table to Markdown table
 * @param {HTMLTableElement} table - Table element
 * @returns {string} Markdown table
 */
function convertTableToMarkdown(table) {
    const rows = Array.from(table.rows);
    if (rows.length === 0) return '';

    let markdown = '';

    // Process rows
    rows.forEach((row, rowIndex) => {
        const cells = Array.from(row.cells);
        const cellContents = cells.map(cell => getTextContent(cell).replace(/\|/g, '\\|'));
        markdown += '| ' + cellContents.join(' | ') + ' |\n';

        // Add separator after first row (header)
        if (rowIndex === 0) {
            markdown += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
        }
    });

    return markdown + '\n';
}

// ============================================================
// SHARED EMPHASIS PATTERNS (Unterstrich-Wortgrenzen)
// ============================================================
// CommonMark verlangt fuer _-Emphase Wortgrenzen (kein direkt angrenzendes \w),
// waehrend *-Emphase das ausdruecklich NICHT verlangt (intra-word erlaubt bleibt
// erlaubt, z.B. "sn*ake*case") — siehe Kommentar bei renderMarkdownInContent().
// markdownToHtml() (Import-Pfad) und renderMarkdownInContent() (Anzeige-Pfad)
// teilen sich dieselben Unterstrich-Muster als eine Quelle, damit importierter
// und angezeigter Markdown fuer denselben Text nicht mehr auseinanderlaufen
// koennen (siehe 13-UAT.md Gap "URLs mit >=2 Unterstrichen").
const MARKDOWN_EMPHASIS_BOLD_UNDERSCORE_SRC = '(?<!\\w)__([^_]+)__(?!\\w)';
const MARKDOWN_EMPHASIS_ITALIC_UNDERSCORE_SRC = '(?<!\\w)_([^_]+)_(?!\\w)';

// ============================================================
// MARKDOWN TO HTML
// ============================================================
/**
 * Convert Markdown to HTML
 * @param {string} markdown - Markdown string to convert
 * @returns {string} HTML string
 */
function markdownToHtml(markdown) {
    const sanitizeHTML = window.sanitizeHTML;
    if (!markdown || typeof markdown !== 'string') return '';

    let html = markdown;

    // Read-aloud blocks (must be first to avoid interference)
    html = html.replace(/:::read-aloud\n([\s\S]*?)\n:::/g, (match, content) => {
        return `<div class="read-aloud">${content.trim()}</div>`;
    });

    // Headings (must be before other conversions)
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // Bold (**text** or __text__)
    html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    html = html.replace(new RegExp(MARKDOWN_EMPHASIS_BOLD_UNDERSCORE_SRC, 'g'), '<b>$1</b>');

    // Italic (*text* or _text_)
    html = html.replace(/\*(.+?)\*/g, '<i>$1</i>');
    html = html.replace(new RegExp(MARKDOWN_EMPHASIS_ITALIC_UNDERSCORE_SRC, 'g'), '<i>$1</i>');

    // Strikethrough (~~text~~)
    html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');

    // Code (`text`)
    html = html.replace(
        /`(.+?)`/g,
        '<code style="background: var(--bg-elevated); padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: var(--text-md);">$1</code>'
    );

    // Links ([text](url))
    html = html.replace(
        /\[([^\]]+)\]\(([^\)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Unordered lists (lines starting with - or *). Der Zeilenumbruch NACH dem
    // letzten Punkt bleibt draussen — er gehoert zur Blockgrenze darunter.
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(?:<li>.*<\/li>(?:\n(?=<li>))?)+/g, '<ul>$&</ul>');

    // Blockquotes (lines starting with >)
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

    // Zeilenumbrueche (MARKDOWN, docs/bugfixes.md). Bis zu zwei "\n" an einem
    // Block-Element sind die Blockgrenze, die htmlToMarkdown() dort schreibt,
    // und fallen weg; JEDES weitere "\n" ist ein <br> — htmlToMarkdown()
    // schreibt jedes <br> als "\n". Frueher wurde nur "\n\n" zu <br><br>, ein
    // einzelnes blieb Leerraum: "Zeile eins<br>Zeile zwei" kam nach der
    // Rundreise als EINE Zeile zurueck. <blockquote> zaehlt nicht als Block:
    // sanitizeHTML() macht Text daraus.
    const block = '(?:h[1-6]|ul|ol|li|div|p|table|thead|tbody|tr|th|td)\\b';
    html = html.replace(new RegExp(`(<\\/?${block}[^>]*>)\\n{1,2}`, 'gi'), '$1');
    html = html.replace(new RegExp(`\\n{1,2}(<\\/?${block})`, 'gi'), '$1');
    html = html.replace(/\n/g, '<br>');

    // Sanitize to prevent XSS
    if (typeof sanitizeHTML === 'function') {
        html = sanitizeHTML(html);
    }

    return html;
}

// ============================================================
// RENDER ON DISPLAY
// ============================================================
/**
 * Converts inline Markdown syntax in existing HTML content to HTML
 * Used for displaying content that was saved before Markdown support
 * @param {string} html - HTML string that may contain markdown syntax
 * @returns {string} HTML with markdown converted
 */
function renderMarkdownInContent(html) {
    const sanitizeHTML = window.sanitizeHTML;
    if (!html || typeof html !== 'string') return html;

    let result = html;

    // Convert markdown patterns to HTML
    // Bold: **text** or __text__
    result = result.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    // CommonMark-Wortgrenzen-Regel (MAINT-03): Unterstrich-Betonung darf nicht öffnen/schließen,
    // wenn unmittelbar ein alphanumerisches Zeichen angrenzt — sonst korrumpiert z.B.
    // "https://example.com/foo_bar_baz" zu "foo<i>bar</i>baz". Die *-Varianten kennen diese
    // Einschränkung laut CommonMark-Spezifikation nicht und bleiben unverändert (siehe unten).
    // Muster gemeinsam mit markdownToHtml() (Import-Pfad) aus MARKDOWN_EMPHASIS_*_SRC bezogen,
    // damit Anzeige- und Import-Pfad nicht erneut auseinanderlaufen koennen.
    result = result.replace(new RegExp(MARKDOWN_EMPHASIS_BOLD_UNDERSCORE_SRC, 'g'), '<b>$1</b>');

    // Italic: *text* or _text_ (but not if already inside ** or __)
    result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<i>$1</i>');
    result = result.replace(new RegExp(MARKDOWN_EMPHASIS_ITALIC_UNDERSCORE_SRC, 'g'), '<i>$1</i>');

    // Strikethrough: ~~text~~
    result = result.replace(/~~([^~]+)~~/g, '<s>$1</s>');

    // Code: `text`
    result = result.replace(
        /`([^`]+)`/g,
        '<code style="background: var(--bg-elevated); padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: var(--text-md);">$1</code>'
    );

    // Headings: ## text (only at line start)
    result = result.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    result = result.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    result = result.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    result = result.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    result = result.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    result = result.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // Links: [text](url)
    result = result.replace(
        /\[([^\]]+)\]\(([^\)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Defense-in-Depth: identisch zu markdownToHtml() am Ende sanitisieren (SEC-01)
    if (typeof sanitizeHTML === 'function') {
        result = sanitizeHTML(result);
    }

    return result;
}

// ============================================================
// EXPORTS
// ============================================================
window.htmlToMarkdown = htmlToMarkdown;
window.markdownToHtml = markdownToHtml;
window.renderMarkdownInContent = renderMarkdownInContent;
