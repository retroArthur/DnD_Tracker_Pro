// [SECTION:LINKS]
// Extrahiert aus shops.js
// Link-Verwaltung
// Zeilen: 136

import { $, esc, sanitizeHTML } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { pushUndo } from '@systems/undo';
import { EntityLookup } from '@render/helpers';

// LINKS
// ============================================================
export function renderLinks(): void {
    const D = (window as any).D;
    const LINK_CATS = (window as any).LINK_CATS;
    const renderEmptyState = (window as any).renderEmptyState;

    const c = $('links-list');
    if (!c) return;

    const searchInput = $('link-search') as HTMLInputElement | null;
    const catFilterInput = $('link-filter') as HTMLSelectElement | null;

    const search = (searchInput?.value || '').toLowerCase();
    const catFilter = catFilterInput?.value || '';

    // Counter aktualisieren
    const countEl = $('links-io-count');
    if (countEl) countEl.textContent = String(D.links?.length || 0);

    let links = D.links || [];

    // Kategorie-Filter anwenden
    if (catFilter) {
        links = links.filter((l: any) => l.category === catFilter);
    }

    // Suche anwenden
    if (search) {
        links = links.filter((l: any) =>
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

    c.innerHTML = links.map((l: any) => `<div class="link-card">
        <div class="link-icon">${LINK_CATS[l.category]?.split(' ')[0] || '🔗'}</div>
        <div class="link-info">
            <div class="link-title"><a href="${esc(l.url)}" target="_blank" style="color:inherit; text-decoration:none;">${esc(l.title)}</a></div>
            <div class="link-url">${esc(l.url)}</div>
            ${l.description ? `<div style="font-size:0.8em; color:var(--text-dim); margin-top:4px;">${esc(l.description)}</div>` : ''}
        </div>
        <div class="btn-group">
            <button class="btn btn-sm" data-action="edit-link" data-id="${l.id}" title="Bearbeiten">✏️</button>
            <button class="btn btn-sm btn-danger" data-action="delete-link" data-id="${l.id}" title="Löschen">🗑️</button>
        </div>
    </div>`).join('');
}

export function toggleLinkForm(): void {
    const form = $('link-form-card');
    if (form) {
        const htmlForm = form as HTMLElement;
        htmlForm.style.display = htmlForm.style.display === 'none' ? 'block' : 'none';
    }
}

export function saveLink(): void {
    const D = (window as any).D;
    const nextId = (window as any).nextId;

    const editIdInput = $('edit-link-id') as HTMLInputElement | null;
    const titleInput = $('link-title') as HTMLInputElement | null;
    const urlInput = $('link-url') as HTMLInputElement | null;
    const catInput = $('link-cat') as HTMLSelectElement | null;
    const descInput = $('link-desc') as HTMLElement | null;

    const editId = editIdInput?.value || '';
    const title = titleInput?.value.trim() || '';
    const url = urlInput?.value.trim() || '';

    if (!title || !url) {
        showToast('⚠️ Titel und URL erforderlich', 'error');
        return;
    }

    const linkData: any = {
        title,
        url,
        category: catInput?.value || 'other',
        description: descInput ? sanitizeHTML(descInput.innerHTML) : ''
    };

    pushUndo(editId ? 'Link bearbeitet' : 'Link erstellt');

    if (editId) {
        const idx = D.links.findIndex((l: any) => l.id === parseInt(editId));
        if (idx > -1) {
            D.links[idx] = { ...D.links[idx], ...linkData };
            showToast('Link aktualisiert');
        }
    } else {
        linkData.id = nextId('links');
        D.links.push(linkData);
        showToast('Link hinzugefügt');
    }

    cancelLinkEdit();
    renderLinks();
    save();
}

export function editLink(id: number | string): void {
    const link = EntityLookup.link(id);
    if (!link) return;

    const editIdInput = $('edit-link-id') as HTMLInputElement | null;
    const titleInput = $('link-title') as HTMLInputElement | null;
    const urlInput = $('link-url') as HTMLInputElement | null;
    const catInput = $('link-cat') as HTMLSelectElement | null;
    const descInput = $('link-desc') as HTMLElement | null;

    if (editIdInput) editIdInput.value = String(id);
    if (titleInput) titleInput.value = link.title || '';
    if (urlInput) urlInput.value = link.url || '';
    if (catInput) catInput.value = link.category || 'other';
    if (descInput) descInput.innerHTML = sanitizeHTML(link.description) || '';

    const form = $('link-form-card');
    if (form) (form as HTMLElement).style.display = 'block';

    if (titleInput) titleInput.focus();
}

export function cancelLinkEdit(): void {
    const editIdInput = $('edit-link-id') as HTMLInputElement | null;
    const titleInput = $('link-title') as HTMLInputElement | null;
    const urlInput = $('link-url') as HTMLInputElement | null;
    const catInput = $('link-cat') as HTMLSelectElement | null;
    const descInput = $('link-desc') as HTMLElement | null;

    if (editIdInput) editIdInput.value = '';
    if (titleInput) titleInput.value = '';
    if (urlInput) urlInput.value = '';
    if (catInput) catInput.value = 'rules';
    if (descInput) descInput.innerHTML = '';

    const form = $('link-form-card');
    if (form) (form as HTMLElement).style.display = 'none';
}

export function deleteLink(id: number | string): void {
    const D = (window as any).D;
    const link = EntityLookup.link(id);
    if (confirm(`Link "${link?.title || 'Unbekannt'}" löschen?`)) {
        pushUndo('Link gelöscht');
        const numId = typeof id === 'string' ? parseInt(id) : id;
        D.links = D.links.filter((l: any) => l.id !== numId);
        renderLinks();
        save();
    }
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).renderLinks = renderLinks;
(window as any).toggleLinkForm = toggleLinkForm;
(window as any).saveLink = saveLink;
(window as any).editLink = editLink;
(window as any).cancelLinkEdit = cancelLinkEdit;
(window as any).deleteLink = deleteLink;
