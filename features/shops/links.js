// [SECTION:LINKS]
// Extrahiert aus shops.js
// Link-Verwaltung
// Zeilen: 136
// LINKS
// ============================================================
function renderLinks() {
    const D = window.D;
    const LINK_CATS = window.LINK_CATS;
    const renderEmptyState = window.renderEmptyState;
    const c = $('links-list');
    if (!c) return;
    const searchInput = $('link-search');
    const catFilterInput = $('link-filter');
    const search = (searchInput?.value || '').toLowerCase();
    const catFilter = catFilterInput?.value || '';
    // Counter aktualisieren
    setViewCount('links', D.links?.length || 0);
    let links = D.links || [];
    // Kategorie-Filter anwenden
    if (catFilter) {
        links = links.filter(l => l.category === catFilter);
    }
    // Suche anwenden
    if (search) {
        links = links.filter(
            l =>
                (l.title || '').toLowerCase().includes(search) ||
                (l.url || '').toLowerCase().includes(search) ||
                (l.description || '').toLowerCase().includes(search)
        );
    }
    if (!links.length) {
        c.innerHTML = renderEmptyState({
            icon: '🔗',
            titleEmpty: 'Keine Links',
            descEmpty: 'Speichere nützliche Links zu Regeln, Tools und Karten.',
            buttonText: '+ Link hinzufügen',
            buttonAction: 'call',
            buttonValue: 'toggleLinkForm',
            isFiltered: !!(search || catFilter)
        });
        return;
    }
    c.innerHTML = links
        .map(
            l => `<div class="link-card">
        <div class="link-icon">${LINK_CATS[l.category]?.split(' ')[0] || '🔗'}</div>
        <div class="link-info">
            <div class="link-title"><a href="${esc(l.url)}" target="_blank" style="color:inherit; text-decoration:none;">${esc(l.title)}</a></div>
            <div class="link-url">${esc(l.url)}</div>
            ${l.description ? `<div style="font-size:var(--text-sm); color:var(--text-dim); margin-top:4px;">${esc(l.description)}</div>` : ''}
        </div>
        <div class="btn-group">
            <button class="btn btn-sm" data-action="edit-link" data-id="${l.id}" title="Bearbeiten">✏️</button>
            <button class="btn btn-sm btn-danger" data-action="delete-link" data-id="${l.id}" title="Löschen">🗑️</button>
        </div>
    </div>`
        )
        .join('');
}
/**
 * Blendet die Link-Karte ein bzw. aus — der Weg BEIDER Anlege-Knoepfe
 * ("+ Link" und "+ Link hinzufügen" der leeren Liste). Ist die Karte
 * sichtbar, blendet derselbe Klick sie aus (Umschalter, wie ein
 * Klappformular: Ausblenden ist ein Abbruch und leert nie).
 *
 * Beim EINblenden wird ein Bearbeiten-Rest verworfen (ABBRUCH, Vertrag R1):
 * vorher leerte die Karte hier nie. Gemessen trug sie nach ✏️ → "+ Link"
 * (aus) → "+ Link" (ein) — ebenso nach Escape oder einem Ansichtswechsel,
 * die die Karte gar nicht schliessen — die ID und alle Werte des bearbeiteten
 * Links unter dem Kopf "Link hinzufügen"; "Speichern" UEBERSCHRIEB ihn
 * ("Link aktualisiert", in D, im Speicher und nach dem Neuladen), und nach
 * einem 🗑️ dazwischen war die Eingabe still weg. Geleert wird NUR bei
 * gesetzter #edit-link-id: ein nie gespeicherter Entwurf ueberlebt
 * Ausblenden, Escape und Ansichtswechsel weiter (R2).
 */
function toggleLinkForm() {
    const form = $('link-form-card');
    if (!form) return;
    const einblenden = form.style.display === 'none';
    // cancelLinkEdit() blendet selbst aus — darum VOR dem Setzen unten.
    if (einblenden && $('edit-link-id')?.value) cancelLinkEdit();
    form.style.display = einblenden ? 'block' : 'none';
}
function saveLink() {
    const D = window.D;
    const nextId = window.nextId;
    const editIdInput = $('edit-link-id');
    const titleInput = $('link-title');
    const urlInput = $('link-url');
    const catInput = $('link-cat');
    const descInput = $('link-desc');
    let editId = editIdInput?.value || '';
    const title = titleInput?.value.trim() || '';
    const url = urlInput?.value.trim() || '';
    if (!title || !url) {
        showToast('⚠️ Titel und URL erforderlich', 'error');
        return;
    }
    // Zeigt die ID auf einen Link, den es nicht mehr gibt (geloescht, oder per
    // Strg+Z zurueckgenommen, waehrend die Karte offen war — die Karte deckt
    // die Liste nicht ab, 🗑️ bleibt erreichbar), wird als NEUER Link
    // gespeichert — die Eingaben bleiben erhalten. Vorher fand der
    // Bearbeiten-Zweig nichts (kein Else-Zweig), schloss die Karte und
    // speicherte trotzdem: gemessen war die Eingabe still weg, ohne jede
    // Meldung, mit einem leeren Undo-Eintrag "Link bearbeitet". Geprueft VOR
    // pushUndo, wie in saveNPC(). Gesucht wird direkt in D.links, weil der
    // Index gebraucht wird; der fruehere Grund (der Zwischenspeicher von
    // EntityLookup hielt Geloeschtes fest) entfiel mit RUECKSPRUNG.
    const idx = editId ? D.links.findIndex(l => l.id === parseEntityId(editId)) : -1;
    const verwaist = Boolean(editId) && idx === -1;
    if (verwaist) editId = '';
    const linkData = {
        title,
        url,
        category: catInput?.value || 'other',
        description: descInput ? sanitizeHTML(descInput.innerHTML) : ''
    };
    pushUndo(editId ? 'Link bearbeitet' : 'Link erstellt');
    if (editId) {
        D.links[idx] = { ...D.links[idx], ...linkData };
        showToast('Link aktualisiert');
    } else {
        linkData.id = nextId('links');
        D.links.push(linkData);
        if (verwaist) {
            showToast(
                'Der bearbeitete Link existiert nicht mehr — als neuer Link gespeichert',
                'warning'
            );
        } else {
            showToast('Link hinzugefügt');
        }
    }
    cancelLinkEdit();
    renderLinks();
    save();
}
function editLink(id) {
    const link = EntityLookup.link(id);
    if (!link) return;
    const editIdInput = $('edit-link-id');
    const titleInput = $('link-title');
    const urlInput = $('link-url');
    const catInput = $('link-cat');
    const descInput = $('link-desc');
    if (editIdInput) editIdInput.value = String(id);
    if (titleInput) titleInput.value = link.title || '';
    if (urlInput) urlInput.value = link.url || '';
    if (catInput) catInput.value = link.category || 'other';
    if (descInput) descInput.innerHTML = sanitizeHTML(link.description) || '';
    const form = $('link-form-card');
    if (form) form.style.display = 'block';
    if (titleInput) titleInput.focus();
}
function cancelLinkEdit() {
    const editIdInput = $('edit-link-id');
    const titleInput = $('link-title');
    const urlInput = $('link-url');
    const catInput = $('link-cat');
    const descInput = $('link-desc');
    if (editIdInput) editIdInput.value = '';
    if (titleInput) titleInput.value = '';
    if (urlInput) urlInput.value = '';
    if (catInput) catInput.value = 'rules';
    if (descInput) descInput.innerHTML = '';
    const form = $('link-form-card');
    if (form) form.style.display = 'none';
}
function deleteLink(id) {
    const D = window.D;
    const link = EntityLookup.link(id);
    if (confirm(`Link "${link?.title || 'Unbekannt'}" löschen?`)) {
        pushUndo('Link gelöscht');
        const numId = typeof id === 'string' ? parseInt(id) : id;
        D.links = D.links.filter(l => l.id !== numId);
        renderLinks();
        save();
    }
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.renderLinks = renderLinks;
window.toggleLinkForm = toggleLinkForm;
window.saveLink = saveLink;
window.editLink = editLink;
window.cancelLinkEdit = cancelLinkEdit;
window.deleteLink = deleteLink;
