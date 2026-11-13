// Fest eingebundene Lesesammlung, unabhängig von den Kampagnendaten.
const inspirationEntries = INSPIRATION_COLLECTIONS.flatMap(collection =>
    collection.articles.map(article => ({
        article,
        collection,
        title: normalizeInspirationText(article.title),
        // Linktexte sind lesbar und durchsuchbar, Dateinamen und URLs gehören nicht zum Text.
        text: article.searchable
            ? normalizeInspirationText(article.markdown.replace(/\]\([^\n)]*\)/g, ']'))
            : ''
    }))
);
let selectedInspiration;

function normalizeInspirationText(text) {
    return text.trim().toLocaleLowerCase('de');
}

function scoreInspiration(entry, query) {
    if (entry.title === query) return 120;
    if (entry.title.includes(query)) return 90;
    return query.length >= 3 && entry.text.includes(query) ? 25 : 0;
}

function findInspirationMatches(value) {
    const query = normalizeInspirationText(value);
    if (!query) return [];
    const matches = [];
    for (const entry of inspirationEntries) {
        if (!entry.article.searchable) continue;
        const score = scoreInspiration(entry, query);
        if (!score) continue;
        matches.push({
            type: 'inspiration',
            id: entry.article.id,
            name: entry.article.title,
            detail: entry.collection.title + ' · ' + entry.article.group,
            score
        });
    }
    return matches;
}

function renderInspirationList() {
    const list = $('inspiration-list');
    const query = normalizeInspirationText($('inspiration-search').value);
    const groupsByCollection = new Map();
    for (const entry of inspirationEntries) {
        const { article, collection } = entry;
        if (!article.listed || (query && !scoreInspiration(entry, query))) continue;
        if (!groupsByCollection.has(collection)) groupsByCollection.set(collection, new Map());
        const groups = groupsByCollection.get(collection);
        if (!groups.has(article.group)) groups.set(article.group, []);
        groups.get(article.group).push(entry);
    }

    const fragment = document.createDocumentFragment();
    for (const [collection, groups] of groupsByCollection) {
        const heading = document.createElement('h2');
        heading.className = 'inspiration-collection-title';
        heading.textContent = collection.title;
        fragment.append(heading);
        if (collection.subtitle) {
            const subtitle = document.createElement('p');
            subtitle.className = 'meta-text inspiration-collection-subtitle';
            subtitle.textContent = collection.subtitle;
            fragment.append(subtitle);
        }
        for (const [group, entries] of groups) {
            const topic = document.createElement('details');
            topic.className = 'wiki-tree-category inspiration-topic';
            topic.open =
                Boolean(query) || entries.includes(selectedInspiration) || group === 'Einstieg';
            const summary = document.createElement('summary');
            summary.className = 'wiki-tree-cat-header';
            summary.textContent = group;
            topic.append(summary);
            for (const { article } of entries) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'wiki-tree-item';
                button.dataset.action = 'open-inspiration-article';
                button.dataset.id = String(article.id);
                button.textContent = article.title;
                topic.append(button);
            }
            fragment.append(topic);
        }
    }
    if (!groupsByCollection.size) {
        const empty = document.createElement('p');
        empty.className = 'meta-text';
        empty.setAttribute('role', 'status');
        empty.textContent = 'Keine passenden Artikel gefunden.';
        fragment.append(empty);
    }
    list.replaceChildren(fragment);
    updateInspirationSelection();
}

function updateInspirationSelection() {
    const list = $('inspiration-list');
    const previous = list.querySelector('[aria-current]');
    previous?.removeAttribute('aria-current');
    previous?.classList.remove('selected');
    if (!selectedInspiration) return null;
    const current = list.querySelector(`[data-id="${selectedInspiration.article.id}"]`);
    if (current) {
        current.setAttribute('aria-current', 'page');
        current.classList.add('selected');
    }
    return current;
}

function renderInspirationArticle() {
    const title = $('inspiration-title');
    const group = $('inspiration-article-group');
    const body = $('inspiration-body');
    if (!selectedInspiration) {
        const collection = INSPIRATION_COLLECTIONS[0];
        title.textContent = collection?.title ?? 'Inspiration';
        group.textContent = collection?.subtitle ?? '';
        body.textContent = 'Wähle ein Thema in der Liste oder suche nach einem Artikel.';
        return;
    }

    const { article, collection } = selectedInspiration;
    const fragment = window.renderInspirationMarkdown(article.markdown, collection.articles);
    title.textContent = article.title;
    group.textContent = article.group;

    const jumps = $('inspiration-jumps');
    jumps.replaceChildren();
    for (const [id, label] of [
        ['inspiration-kurzantwort', 'Kurzantwort'],
        ['inspiration-spieltisch', 'Für den Spieltisch']
    ]) {
        const target = fragment.querySelector(`#${id}`);
        if (!target) continue;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm';
        button.textContent = label;
        button.addEventListener('click', () => {
            target.tabIndex = -1;
            target.focus({ preventScroll: true });
            target.scrollIntoView({ block: 'start' });
        });
        jumps.append(button);
    }
    for (const table of fragment.querySelectorAll('table')) {
        const scroll = document.createElement('div');
        scroll.className = 'inspiration-table-scroll';
        table.before(scroll);
        scroll.append(table);
    }
    body.replaceChildren(fragment);
    $('inspiration-article').scrollTop = 0;
}

function closeInspirationArticle() {
    $('view-inspiration').classList.remove('inspiration-reading');
    const current = $('inspiration-list').querySelector('[aria-current]');
    (current || $('inspiration-search')).focus();
}

function renderInspiration() {
    const list = $('inspiration-list');
    if (!list || list.hasChildNodes()) return;
    $('inspiration-search').addEventListener('input', renderInspirationList);
    $('inspiration-back').addEventListener('click', closeInspirationArticle);
    renderInspirationList();
    renderInspirationArticle();
}

function openInspirationArticle(id) {
    const next = inspirationEntries.find(({ article }) => article.id === Number(id));
    if (!next || !$('view-inspiration')?.classList.contains('active')) return;
    renderInspiration();
    selectedInspiration = next;
    const input = $('inspiration-search');
    const query = normalizeInspirationText(input.value);
    if (next.article.listed && query && !scoreInspiration(next, query)) {
        input.value = '';
        renderInspirationList();
    }
    const current = updateInspirationSelection();
    if (current) current.closest('details').open = true;
    $('view-inspiration').classList.add('inspiration-reading');
    renderInspirationArticle();
    $('inspiration-title').focus({ preventScroll: true });
}

window.renderInspiration = renderInspiration;
window.openInspirationArticle = openInspirationArticle;
window.findInspirationMatches = findInspirationMatches;
