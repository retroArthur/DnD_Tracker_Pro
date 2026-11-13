// Die Artikel nutzen einfache Markdown-Blockstrukturen. Inline-Formatierung
// und HTML-Bereinigung kommen aus dem vorhandenen Markdown-Renderer.
function inspirationTableRow(line, tag) {
    const cells = line
        .slice(1, -1)
        .split('|')
        .map(cell => `<${tag}>${esc(cell.trim())}</${tag}>`);
    return `<tr>${cells.join('')}</tr>`;
}

function inspirationBlockMarkup(markdown) {
    const text = markdown.replace(/\r\n?/g, '\n').replace(/^\uFEFF?\s*# +[^\n]*\n?/, '');
    const lines = text.split('\n').map(line => line.trim());
    const blocks = [];
    const tableRow = /^\|.*\|$/;
    const tableSeparator = /^\|(?:\s*:?-{3,}:?\s*\|)+$/;
    const orderedItem = /^\d+\.\s+(.+)$/;
    const bulletItem = /^[-*]\s+(.+)$/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        if (tableRow.test(line)) {
            let heading = '';
            const rows = [];
            if (tableSeparator.test(lines[i + 1] || '')) {
                heading = `<thead>${inspirationTableRow(line, 'th')}</thead>`;
                i++;
            } else {
                // Das Quellenverzeichnis hat nachgetragene Zeilen ohne Tabellenkopf.
                rows.push(inspirationTableRow(line, 'td'));
            }
            while (tableRow.test(lines[i + 1] || '')) {
                i++;
                rows.push(inspirationTableRow(lines[i], 'td'));
            }
            blocks.push(`<table>${heading}<tbody>${rows.join('')}</tbody></table>`);
            continue;
        }

        const ordered = orderedItem.test(line);
        const listItem = ordered ? orderedItem : bulletItem;
        let item = line.match(listItem);
        if (item) {
            const tag = ordered ? 'ol' : 'ul';
            const items = [`<li>${esc(item[1])}</li>`];
            while ((item = (lines[i + 1] || '').match(listItem))) {
                i++;
                items.push(`<li>${esc(item[1])}</li>`);
            }
            blocks.push(`<${tag}>${items.join('')}</${tag}>`);
            continue;
        }

        // Überschriften wandelt der gemeinsame Renderer am Zeilenanfang um.
        blocks.push(/^#{1,6} /.test(line) ? esc(line) : `<p>${esc(line.replace(/^> /, ''))}</p>`);
    }
    return blocks.join('\n');
}

/**
 * Rendert einen eingebauten Artikel und bindet seine Querverweise an die Leseansicht.
 * @param {string} markdown
 * @param {{ file: string, id: number }[]} articles
 * @returns {DocumentFragment}
 */
function renderInspirationMarkdown(markdown, articles) {
    // Der gemeinsame Sanitizer akzeptiert Fragmentziele. Die eigentlichen
    // URLs setzen wir erst nach der Bereinigung aus der geprüften Zuordnung.
    const destinations = [];
    const withReferences = markdown.replace(
        /(\[[^\]\r\n]+\])\(([^)\r\n]+)\)/g,
        (_, label, href) => {
            const index = destinations.push(href.trim()) - 1;
            return `${label}(#inspiration-source-${index})`;
        }
    );
    const html = window.renderMarkdownInContent(inspirationBlockMarkup(withReferences));
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const fragment = document.createDocumentFragment();
    fragment.append(...parsed.body.childNodes);
    const idsByFile = new Map(articles.map(article => [article.file, article.id]));

    for (const link of fragment.querySelectorAll('a')) {
        const marker = link.getAttribute('href')?.match(/^#inspiration-source-(\d+)$/);
        const href = destinations[Number(marker?.[1])] || '';
        const id = idsByFile.get(href.replace(/^\.\//, ''));
        if (Number.isSafeInteger(id) && id > 0) {
            link.setAttribute('href', '#inspiration-article');
            link.removeAttribute('target');
            link.removeAttribute('rel');
            link.dataset.action = 'open-inspiration-article';
            link.dataset.id = String(id);
        } else if (/^https?:\/\//i.test(href)) {
            link.setAttribute('href', href);
        } else {
            link.replaceWith(...link.childNodes);
        }
    }

    const kurzantwort = [...fragment.querySelectorAll('p > b:first-child')].find(label =>
        /^Kurzantwort:?$/i.test(label.textContent.trim())
    );
    if (kurzantwort) kurzantwort.parentElement.id = 'inspiration-kurzantwort';

    const spieltisch = [...fragment.querySelectorAll('h2, h3')].find(
        heading => heading.textContent.trim() === 'Für den Spieltisch'
    );
    if (spieltisch) spieltisch.id = 'inspiration-spieltisch';

    return fragment;
}

window.renderInspirationMarkdown = renderInspirationMarkdown;
