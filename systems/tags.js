// [SECTION:TAGS]
// ============================================================
// TAGS SYSTEM - @tag @label @category @filter
// ============================================================
function showTagsModal(type, id) {
    const typeEl = $('tags-target-type');
    const idEl = $('tags-target-id');
    const nameEl = $('new-tag-name');
    if (typeEl) typeEl.value = type;
    if (idEl) idEl.value = String(id);
    if (nameEl) nameEl.value = '';
    renderTagsModal();
    const showModal = window.showModal;
    if (showModal) showModal('tags-modal');
}
// Tagfarbe aus Daten: sie landet als Klasse `tag-…` (und als data-color, aus dem
// "add-existing-tag" die Farbe des kopierten Tags liest) und kommt deshalb nur aus
// TAG_COLORS — das sind genau die Optionen von #new-tag-color —, sonst 'blue' wie bisher
// bei fehlender Farbe (Vertrag SENKEN R2, docs/bugfixes.md). Namen laufen durch esc().
// Die Tags des Elements liest das Fenster ueber tagText() (Vertrag NPC-NAME, E4): Altdaten
// und Importe tragen dort auch Text, und `t.name` machte aus "Wichtig" eine leere Pille, die
// die Doppelpruefung nicht erkannte. Die globalen Tags (D.tags) schreibt die App nur als
// {name, color}; sie liest das Fenster weiter so.
function renderTagsModal() {
    const typeEl = $('tags-target-type');
    const idEl = $('tags-target-id');
    const type = typeEl?.value;
    const id = parseEntityId(idEl?.value);
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    const esc = window.esc;
    const D = window.D;
    // Entity's current tags
    const entityTags = entity?.tags || [];
    const entityTagsEl = $('entity-tags-list');
    if (entityTagsEl) {
        entityTagsEl.innerHTML = entityTags.length
            ? entityTags
                  .map(
                      (t, i) =>
                          `<span class="tag tag-${sichereKlasse(t.color, TAG_COLORS, 'blue')}">${esc(tagText(t))} <span style="cursor:pointer;" data-action="remove-tag" data-id="${i}">✕</span></span>`
                  )
                  .join('')
            : '<span style="color: var(--text-dim);">Keine Tags</span>';
    }
    // All available tags (from D.tags) - clickable to add
    const allTags = D.tags || [];
    const allTagsEl = $('all-tags-list');
    if (allTagsEl) {
        allTagsEl.innerHTML = allTags.length
            ? allTags
                  .map(t => {
                      const hasTag = entityTags.some(et => tagText(et) === t.name);
                      const farbe = sichereKlasse(t.color, TAG_COLORS, 'blue');
                      return `<span class="tag tag-${farbe}" style="cursor: pointer; ${hasTag ? 'opacity: 0.5;' : ''}" data-action="add-existing-tag" data-value="${esc(t.name)}" data-color="${farbe}">${esc(t.name)}</span>`;
                  })
                  .join('')
            : '<span style="color: var(--text-dim);">Keine globalen Tags</span>';
    }
    // Global tags with delete option
    const globalTagsEl = $('global-tags-list');
    if (globalTagsEl) {
        globalTagsEl.innerHTML = allTags.length
            ? allTags
                  .map(
                      (
                          t,
                          i
                      ) => `<span class="tag tag-${sichereKlasse(t.color, TAG_COLORS, 'blue')}" style="display: inline-flex; align-items: center; gap: 4px;">
            ${esc(t.name)}
            <span style="cursor:pointer; color: var(--red); font-weight: 600;" data-action="delete-global-tag" data-value="${i}" title="Tag überall löschen">✕</span>
        </span>`
                  )
                  .join('')
            : '<span style="color: var(--text-dim);">Keine globalen Tags vorhanden</span>';
    }
}
function deleteGlobalTag(index) {
    const D = window.D;
    const allTags = D.tags || [];
    if (index < 0 || index >= allTags.length) return;
    const tagToDelete = allTags[index];
    if (
        !confirm(
            `Tag "${tagToDelete.name}" wirklich löschen?\n\nDer Tag wird von allen NPCs, Orten und Quests entfernt.`
        )
    )
        return;
    // Remove from all entities — auch ein gleichnamiges Text-Tag (tagText(), E4): das
    // Fenster zeigt es als dasselbe Tag, also nimmt das Loeschen es mit.
    ['npcs', 'locations', 'quests'].forEach(type => {
        (D[type] || []).forEach(entity => {
            if (entity.tags) {
                entity.tags = entity.tags.filter(t => tagText(t) !== tagToDelete.name);
            }
        });
    });
    // Remove from global tags
    D.tags.splice(index, 1);
    renderTagsModal();
    const renderAll = window.renderAll;
    const save = window.save;
    if (renderAll) renderAll();
    if (save) save();
    showToast(`Tag "${tagToDelete.name}" gelöscht`);
}
function addTagToEntity() {
    const nameEl = $('new-tag-name');
    const colorEl = $('new-tag-color');
    const typeEl = $('tags-target-type');
    const idEl = $('tags-target-id');
    const name = nameEl?.value.trim();
    if (!name) return;
    const color = colorEl?.value;
    const type = typeEl?.value;
    const id = parseEntityId(idEl?.value);
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;
    if (!entity.tags) entity.tags = [];
    // Doppelpruefung in beiden Formen (tagText(), E4): ein Text-Tag "Wichtig" ist dasselbe Tag.
    if (entity.tags.some(t => tagText(t) === name)) {
        showToast('Tag existiert bereits');
        return;
    }
    entity.tags.push({ name, color });
    // Also add to global tags if not exists
    const D = window.D;
    if (!D.tags) D.tags = [];
    if (!D.tags.some(t => t.name === name)) {
        D.tags.push({ name, color });
    }
    if (nameEl) nameEl.value = '';
    renderTagsModal();
    const renderAll = window.renderAll;
    const save = window.save;
    if (renderAll) renderAll();
    if (save) save();
}
function addExistingTagToEntity(name, color) {
    const typeEl = $('tags-target-type');
    const idEl = $('tags-target-id');
    const type = typeEl?.value;
    const id = parseEntityId(idEl?.value);
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;
    if (!entity.tags) entity.tags = [];
    if (entity.tags.some(t => tagText(t) === name)) return;
    entity.tags.push({ name, color });
    renderTagsModal();
    const renderAll = window.renderAll;
    const save = window.save;
    if (renderAll) renderAll();
    if (save) save();
}
function removeTagFromEntity(index) {
    const typeEl = $('tags-target-type');
    const idEl = $('tags-target-id');
    const type = typeEl?.value;
    const id = parseEntityId(idEl?.value);
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (!entity || !entity.tags) return;
    entity.tags.splice(index, 1);
    renderTagsModal();
    const renderAll = window.renderAll;
    const save = window.save;
    if (renderAll) renderAll();
    if (save) save();
}
function renderTagsBar(tags) {
    if (!tags || !tags.length) return '';
    const esc = window.esc;
    return `<div class="tags-container" style="margin-top: 4px;">
        ${tags.map(t => `<span class="tag tag-${sichereKlasse(t.color, TAG_COLORS, 'blue')} clickable" data-action="show-entities-with-tag-stop" data-value="${esc(t.name)}" title="Alle mit Tag '${esc(t.name)}' anzeigen">${esc(t.name)}</span>`).join('')}
    </div>`;
}
/**
 * Der Anzeigetext eines Tags, in beiden Formen, die in D stehen (Vertrag NPC-NAME, E4): 🏷️
 * schreibt `{name, color}` (addTagToEntity()), Altdaten und Importe tragen auch Text. EIN Leser
 * fuer beide — `esc(t)` zeigte das Objekt im NPC-Detail als "[object Object]" (seit 254ff3b2),
 * `t.name || t` im Ort-Detail das Objekt, wenn sein Name fehlte. Den Namen liest datenText()
 * (utils/basic.js), dieselbe Regel wie fuer NPC-Name und -Volk: eine Zahl oder ein
 * Wahrheitswert wird Text, alles andere ''. Liest nur — die Tags selbst bleiben, wie sie sind
 * (keine Umwandlung an der Grenze: Truhe, Wiki und Notizen fuehren Text-Tags regulaer).
 */
function tagText(tag) {
    return datenText(tag && typeof tag === 'object' ? tag.name : tag);
}
// Zeigt alle Entities mit einem bestimmten Tag
// Verwendet ENTITY_ICONS aus core/constants.js
function showEntitiesWithTag(tagName) {
    const D = window.D;
    const ENTITY_ICONS = window.ENTITY_ICONS;
    const results = [];
    // Durchsuche alle Entity-Typen
    const searchIn = [
        { type: 'characters', items: D.characters || [], label: 'Charakter' },
        { type: 'npcs', items: D.npcs || [], label: 'NPC' },
        { type: 'locations', items: D.locations || [], label: 'Ort' },
        { type: 'quests', items: D.quests || [], label: 'Quest' },
        { type: 'encounters', items: D.encounters || [], label: 'Begegnung' },
        { type: 'spells', items: D.spells || [], label: 'Zauber' },
        { type: 'loot', items: D.loot || [], label: 'Item' },
        { type: 'wiki', items: D.wiki || [], label: 'Wiki' }
    ];
    searchIn.forEach(({ type, items, label }) => {
        items.forEach(item => {
            if (item.tags?.some(t => t.name === tagName)) {
                results.push({
                    type,
                    id: item.id,
                    name: item.name || item.title || 'Unbenannt',
                    icon: ENTITY_ICONS[type],
                    label
                });
            }
        });
    });
    // Modal erstellen/aktualisieren
    let modal = $('tag-search-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'tag-search-modal';
        modal.innerHTML = `
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <span class="modal-title" id="tag-search-title">🏷️ Tag-Suche</span>
                    <button class="btn btn-sm" data-action="hide-modal" data-value="tag-search-modal">✕</button>
                </div>
                <div id="tag-search-results" style="max-height: 400px; overflow-y: auto;"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    const titleEl = $('tag-search-title');
    if (titleEl) titleEl.textContent = `🏷️ Tag: "${tagName}"`;
    const resultsEl = $('tag-search-results');
    const esc = window.esc;
    const renderEmptyState = window.renderEmptyState;
    if (resultsEl) {
        if (results.length === 0) {
            resultsEl.innerHTML = renderEmptyState({
                icon: '🏷️',
                titleEmpty: 'Keine Ergebnisse',
                descEmpty: `Keine Einträge mit Tag "${tagName}" gefunden.`,
                gridSpan: 'auto'
            });
        } else {
            resultsEl.innerHTML = results
                .map(
                    r => `
            <div class="search-result-item" data-action="tag-search-navigate" data-type="${esc(r.type)}" data-id="${esc(r.id)}" style="display: flex; align-items: center; gap: 10px; padding: 10px; cursor: pointer; border-bottom: 1px solid var(--border);">
                <span style="font-size: var(--text-xl);">${esc(r.icon)}</span>
                <div>
                    <div style="font-weight: 500;">${esc(r.name)}</div>
                    <div style="font-size: var(--text-sm); color: var(--text-dim);">${esc(r.label)}</div>
                </div>
            </div>
        `
                )
                .join('');
        }
    }
    const showModal = window.showModal;
    if (showModal) showModal('tag-search-modal');
}
// tagText() hat zwei Verbraucher in anderen Modulen: showNPCDetail()
// (features/npcs/npc-render.js) und showLocationDetail() (features/locations/locations-render.js).
window.tagText = tagText;
// ============================================================
