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
            case 'b':
            case 'strong':
                markdown = `**${getTextContent(node)}**`;
                break;

            case 'i':
            case 'em':
                markdown = `*${getTextContent(node)}*`;
                break;

            case 's':
            case 'strike':
            case 'del':
                markdown = `~~${getTextContent(node)}~~`;
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

            case 'a':
                const href = node.getAttribute('href') || '';
                const linkText = getTextContent(node);
                markdown = `[${linkText}](${href})`;
                break;

            case 'ul':
            case 'ol':
                const listItems = Array.from(node.children).filter(child => child.tagName.toLowerCase() === 'li');
                markdown = listItems.map((li, index) => {
                    const prefix = tag === 'ul' ? '-' : `${index + 1}.`;
                    return `${prefix} ${getTextContent(li)}`;
                }).join('\n') + '\n\n';
                break;

            case 'blockquote':
                const lines = getTextContent(node).split('\n');
                markdown = lines.map(line => `> ${line}`).join('\n') + '\n\n';
                break;

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
                    markdown = `:::read-aloud\n${getTextContent(node)}\n:::\n\n`;
                } else {
                    // Process children and add line breaks
                    markdown = '';
                    for (const child of node.childNodes) {
                        markdown += convertNodeToMarkdown(child);
                    }
                    markdown += '\n\n';
                }
                break;

            default:
                // Process children for unknown tags
                markdown = '';
                for (const child of node.childNodes) {
                    markdown += convertNodeToMarkdown(child);
                }
                break;
        }

        return markdown;
    }

    return '';
}

/**
 * Get text content from node without HTML
 * @param {Node} node - DOM node
 * @returns {string} Text content
 */
function getTextContent(node) {
    return (node.textContent || '').trim();
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
    html = html.replace(/__(.+?)__/g, '<b>$1</b>');

    // Italic (*text* or _text_)
    html = html.replace(/\*(.+?)\*/g, '<i>$1</i>');
    html = html.replace(/_(.+?)_/g, '<i>$1</i>');

    // Strikethrough (~~text~~)
    html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');

    // Code (`text`)
    html = html.replace(/`(.+?)`/g, '<code style="background: var(--bg-elevated); padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>');

    // Links ([text](url))
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Unordered lists (lines starting with - or *)
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Blockquotes (lines starting with >)
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

    // Line breaks (double newline = paragraph)
    html = html.replace(/\n\n/g, '<br><br>');

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
    if (!html || typeof html !== 'string') return html;

    // Check if content already contains HTML tags (already converted)
    // If it's pure markdown, convert it
    const hasHtmlTags = /<[^>]+>/.test(html);

    let result = html;

    // Convert markdown patterns to HTML
    // Bold: **text** or __text__
    result = result.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    result = result.replace(/__([^_]+)__/g, '<b>$1</b>');

    // Italic: *text* or _text_ (but not if already inside ** or __)
    result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<i>$1</i>');
    result = result.replace(/(?<!_)_([^_]+)_(?!_)/g, '<i>$1</i>');

    // Strikethrough: ~~text~~
    result = result.replace(/~~([^~]+)~~/g, '<s>$1</s>');

    // Code: `text`
    result = result.replace(/`([^`]+)`/g, '<code style="background: var(--bg-elevated); padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>');

    // Headings: ## text (only at line start)
    result = result.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    result = result.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    result = result.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    result = result.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    result = result.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    result = result.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // Links: [text](url)
    result = result.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return result;
}

// ============================================================
// EXPORTS
// ============================================================
window.htmlToMarkdown = htmlToMarkdown;
window.markdownToHtml = markdownToHtml;
window.convertNodeToMarkdown = convertNodeToMarkdown;
window.convertTableToMarkdown = convertTableToMarkdown;
window.renderMarkdownInContent = renderMarkdownInContent;
