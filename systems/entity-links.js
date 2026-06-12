// [SECTION:ENTITY_LINKS]
// ENTITY LINKS SYSTEM - @link @relationship @navigate
// ============================================================
// Module-level variable for tracking target editor
let insertEntityLinkTargetEditor = null;
function showEntityLinksModal(type, id) {
    const typeEl = $('link-source-type');
    const idEl = $('link-source-id');
    if (typeEl) typeEl.value = type;
    if (idEl) idEl.value = String(id);
    renderLinkTargets();
    renderCurrentLinks();
    const showModal = window.showModal;
    if (showModal) showModal('entity-links-modal');
}
// Parse Entity-Links in Text: [[type:id:name]] -> klickbare Links
// Verwendet zentrale LINK_ICONS Konstante aus core/constants.js
function parseEntityLinks(content) {
    if (!content) return '';
    const LINK_ICONS = window.LINK_ICONS;
    // Pattern: [[type:id:name]]
    return content.replace(/\[\[(\w+):(\d+):([^\]]+)\]\]/g, (match, type, id, name) => {
        const icon = LINK_ICONS[type] || '🔗';
        const viewType = type.endsWith('s') ? type : type + 's'; // npcs, locations etc.
        return `<span class="entity-link" data-action="navigate-entity" data-type="${viewType}" data-id="${id}" title="${type}: ${name}">${icon} ${name}</span>`;
    });
}
// Zeige Modal zum Einfügen eines Entity-Links in einen Editor
function showInsertEntityLinkModal(editorId) {
    insertEntityLinkTargetEditor = editorId;
    const typeEl = $('insert-link-target-type');
    if (typeEl) typeEl.value = 'npcs';
    renderInsertLinkTargets();
    const showModal = window.showModal;
    if (showModal) showModal('insert-entity-link-modal');
}
function renderInsertLinkTargets() {
    const targetTypeEl = $('insert-link-target-type');
    const select = $('insert-link-target-id');
    if (!targetTypeEl || !select) return;
    const targetType = targetTypeEl.value;
    const D = window.D;
    const esc = window.esc;
    let items = [];
    if (targetType === 'npcs') items = D.npcs || [];
    else if (targetType === 'locations') items = D.locations || [];
    else if (targetType === 'quests') items = D.quests || [];
    else if (targetType === 'characters') items = D.characters || [];
    else if (targetType === 'encounters') items = D.encounters || [];
    else if (targetType === 'spells') items = D.spells || [];
    else if (targetType === 'loot') items = D.loot || [];
    else if (targetType === 'wiki') items = D.wiki || [];
    select.innerHTML =
        items
            .map(i => {
                const displayName = i.name || i.title || 'Unbenannt';
                return `<option value="${i.id}">${esc(displayName)}</option>`;
            })
            .join('') || '<option value="">Keine verfügbar</option>';
}
function insertEntityLinkToEditor() {
    const targetTypeEl = $('insert-link-target-type');
    const targetIdEl = $('insert-link-target-id');
    const targetType = targetTypeEl?.value;
    const targetId = parseEntityId(targetIdEl?.value);
    if (!targetId || !insertEntityLinkTargetEditor) {
        showToast('⚠️ Bitte Entity auswählen', 'error');
        return;
    }
    const D = window.D;
    let items = [];
    if (targetType === 'npcs') items = D.npcs || [];
    else if (targetType === 'locations') items = D.locations || [];
    else if (targetType === 'quests') items = D.quests || [];
    else if (targetType === 'characters') items = D.characters || [];
    else if (targetType === 'encounters') items = D.encounters || [];
    else if (targetType === 'spells') items = D.spells || [];
    else if (targetType === 'loot') items = D.loot || [];
    else if (targetType === 'wiki') items = D.wiki || [];
    const entity = items.find(i => i.id === targetId);
    if (!entity) return;
    const name = entity.name || entity.title || 'Unbenannt';
    const linkCode = `[[${targetType}:${targetId}:${name}]]`;
    const editor = $(insertEntityLinkTargetEditor);
    if (editor) {
        editor.focus();
        document.execCommand('insertText', false, linkCode);
    }
    const hideModal = window.hideModal;
    if (hideModal) hideModal('insert-entity-link-modal');
    showToast(`🔗 ${name} verknüpft`);
}
function renderLinkTargets() {
    const targetTypeEl = $('link-target-type');
    const select = $('link-target-id');
    const sourceTypeEl = $('link-source-type');
    const sourceIdEl = $('link-source-id');
    if (!targetTypeEl || !select || !sourceTypeEl || !sourceIdEl) return;
    const targetType = targetTypeEl.value;
    const sourceType = sourceTypeEl.value;
    const sourceId = parseEntityId(sourceIdEl.value);
    const D = window.D;
    const esc = window.esc;
    let items = [];
    if (targetType === 'npcs') items = D.npcs || [];
    else if (targetType === 'locations') items = D.locations || [];
    else if (targetType === 'quests') items = D.quests || [];
    else if (targetType === 'characters') items = D.characters || [];
    else if (targetType === 'encounters') items = D.encounters || [];
    else if (targetType === 'spells') items = D.spells || [];
    else if (targetType === 'loot') items = D.loot || [];
    else if (targetType === 'wiki') items = D.wiki || [];
    // Filter out self if same type
    if (targetType === sourceType) {
        items = items.filter(i => i.id !== sourceId);
    }
    // Quests verwenden 'title' statt 'name'
    select.innerHTML =
        items
            .map(i => {
                const displayName = i.name || i.title || 'Unbenannt';
                return `<option value="${i.id}">${esc(displayName)}</option>`;
            })
            .join('') || '<option value="">Keine verfügbar</option>';
}
function renderCurrentLinks() {
    const typeEl = $('link-source-type');
    const idEl = $('link-source-id');
    const container = $('entity-current-links');
    if (!typeEl || !idEl || !container) return;
    const type = typeEl.value;
    const id = parseEntityId(idEl.value);
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (!entity || !entity.links || !entity.links.length) {
        container.innerHTML =
            '<div style="color: var(--text-dim); text-align: center; padding: 12px;">Keine Verknüpfungen</div>';
        return;
    }
    const LINK_ICONS = window.LINK_ICONS;
    const esc = window.esc;
    // LINK_ICONS aus core/constants.js
    container.innerHTML = `
        <label style="font-size: 0.85em; color: var(--text-dim);">Aktuelle Verknüpfungen</label>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
            ${entity.links
                .map((link, i) => {
                    const target = getEntityByTypeAndId(link.type, link.id);
                    const icon = LINK_ICONS[link.type] || '🔗';
                    const targetName = target?.name || target?.title || 'Unbekannt';
                    return `<span class="tag tag-cyan clickable" style="display: flex; align-items: center; gap: 4px; cursor: pointer;" data-action="navigate-entity-stop" data-type="${link.type}" data-id="${link.id}">
                    ${icon} ${esc(targetName)}
                    <button data-action="remove-entity-link" data-id="${i}" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0 2px;" data-stop-propagation="true">✕</button>
                </span>`;
                })
                .join('')}
        </div>
    `;
}
function addEntityLink() {
    const sourceTypeEl = $('link-source-type');
    const sourceIdEl = $('link-source-id');
    const targetTypeEl = $('link-target-type');
    const targetIdEl = $('link-target-id');
    if (!sourceTypeEl || !sourceIdEl || !targetTypeEl || !targetIdEl) return;
    const sourceType = sourceTypeEl.value;
    const sourceId = parseEntityId(sourceIdEl.value);
    const targetType = targetTypeEl.value;
    const targetId = parseEntityId(targetIdEl.value);
    if (!targetId) return;
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const source = getEntityByTypeAndId(sourceType, sourceId);
    const target = getEntityByTypeAndId(targetType, targetId);
    if (!source || !target) return;
    // Initialize links arrays
    if (!source.links) source.links = [];
    if (!target.links) target.links = [];
    // Check if link already exists
    if (source.links.some(l => l.type === targetType && l.id === targetId)) {
        showToast('Verknüpfung existiert bereits');
        return;
    }
    // Add bidirectional links
    source.links.push({ type: targetType, id: targetId });
    target.links.push({ type: sourceType, id: sourceId });
    renderCurrentLinks();
    const renderAll = window.renderAll;
    const save = window.save;
    if (renderAll) renderAll();
    if (save) save();
    showToast(`Verknüpft mit ${target.name || target.title}`);
}
function removeEntityLink(index) {
    const sourceTypeEl = $('link-source-type');
    const sourceIdEl = $('link-source-id');
    if (!sourceTypeEl || !sourceIdEl) return;
    const sourceType = sourceTypeEl.value;
    const sourceId = parseEntityId(sourceIdEl.value);
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const source = getEntityByTypeAndId(sourceType, sourceId);
    if (!source || !source.links || !source.links[index]) return;
    const saveUndoState = window.saveUndoState;
    if (saveUndoState) saveUndoState('Verknüpfung entfernen');
    const link = source.links[index];
    const target = getEntityByTypeAndId(link.type, link.id);
    // Remove link from source
    source.links.splice(index, 1);
    // Remove reverse link from target
    if (target && target.links) {
        const reverseIdx = target.links.findIndex(l => l.type === sourceType && l.id === sourceId);
        if (reverseIdx > -1) target.links.splice(reverseIdx, 1);
    }
    renderCurrentLinks();
    const renderAll = window.renderAll;
    const save = window.save;
    if (renderAll) renderAll();
    if (save) save();
}
function renderEntityLinks(links) {
    if (!links || !links.length) return '';
    const LINK_ICONS = window.LINK_ICONS;
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const esc = window.esc;
    // LINK_ICONS aus core/constants.js
    return `<div class="entity-links-bar" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
        ${links
            .slice(0, 5)
            .map(link => {
                const target = getEntityByTypeAndId(link.type, link.id);
                const icon = LINK_ICONS[link.type] || '🔗';
                const targetName = target?.name || target?.title || '?';
                return `<span class="link-chip clickable" data-action="navigate-entity-stop" data-type="${link.type}" data-id="${link.id}" title="Klicken für Vorschau">${icon} ${esc(targetName)}</span>`;
            })
            .join('')}
        ${links.length > 5 ? `<span class="link-chip" style="background: var(--bg-dark);">+${links.length - 5}</span>` : ''}
    </div>`;
}
function navigateToEntity(type, id) {
    const viewMap = {
        npcs: 'npcs',
        locations: 'locations',
        quests: 'quests',
        characters: 'party',
        encounters: 'encounter',
        spells: 'spells',
        loot: 'loot',
        wiki: 'wiki'
    };
    const view = viewMap[type] || type;
    const switchView = window.switchView;
    if (switchView) switchView(view);
    // Highlight the entity briefly after switching view
    setTimeout(() => {
        highlightEntity(type, id);
    }, 150);
}
// Navigation ohne Tab-Wechsel - zeigt die Entity-Kachel als Overlay/Modal
function navigateToEntityInPlace(type, id) {
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) {
        showToast('Entity nicht gefunden', 'error');
        return;
    }
    // Erstelle ein Modal mit der Entity-Info
    showEntityPreviewModal(type, id, entity);
}
// Zeigt ein Vorschau-Modal für eine Entity
// Verwendet LINK_ICONS und ENTITY_TYPE_NAMES aus core/constants.js
function showEntityPreviewModal(type, id, entity) {
    const sanitizeHTML = window.sanitizeHTML;
    const esc = window.esc;
    const EntityLookup = window.EntityLookup;
    let content = '';
    if (type === 'quests') {
        const statusColors = {
            offen: 'var(--yellow)',
            aktiv: 'var(--green)',
            abgeschlossen: 'var(--cyan)',
            fehlgeschlagen: 'var(--red)'
        };
        const status = entity.status || 'offen';
        content = `
            <div style="margin-bottom: 12px;">
                <span style="background: ${statusColors[status]}; color: var(--bg-dark); padding: 2px 8px; border-radius: 10px; font-size: 0.8em; font-weight: 600;">${status.toUpperCase()}</span>
            </div>
            ${entity.description ? `<div style="color: var(--text); margin-bottom: 10px;">${sanitizeHTML(entity.description)}</div>` : ''}
            ${entity.reward ? `<div style="color: var(--gold); font-size: 0.9em;">💰 ${esc(entity.reward)}</div>` : ''}
        `;
    } else if (type === 'npcs') {
        const location = EntityLookup.location(entity.locationId);
        content = `
            ${entity.role ? `<div style="color: var(--text-dim); margin-bottom: 8px;">${esc(entity.role)}</div>` : ''}
            ${entity.description ? `<div style="color: var(--text); margin-bottom: 10px;">${sanitizeHTML(entity.description)}</div>` : ''}
            ${location ? `<div style="font-size: 0.85em; color: var(--cyan);">📍 ${esc(location.name)}</div>` : ''}
        `;
    } else if (type === 'locations') {
        content = entity.description
            ? `<div style="color: var(--text);">${sanitizeHTML(entity.description)}</div>`
            : '';
    } else if (type === 'characters') {
        content = `
            ${entity.race ? `<div style="color: var(--purple);">${esc(entity.race)} ${entity.class ? esc(entity.class) : ''}</div>` : ''}
            ${entity.level ? `<div style="color: var(--gold);">Level ${entity.level}</div>` : ''}
        `;
    } else if (type === 'encounters') {
        content = `
            ${entity.type ? `<div style="color: var(--red);">${esc(entity.type)}</div>` : ''}
            ${entity.cr ? `<div style="color: var(--yellow);">CR ${entity.cr}</div>` : ''}
        `;
    } else if (type === 'spells') {
        const levelText = entity.level === 0 ? 'Zaubertrick' : `Grad ${entity.level}`;
        content = `
            <div style="margin-bottom: 8px;">
                <span style="background: var(--blue); color: var(--bg-dark); padding: 2px 8px; border-radius: 10px; font-size: 0.8em;">${levelText}</span>
                ${entity.school ? `<span style="background: var(--purple); color: var(--bg-dark); padding: 2px 8px; border-radius: 10px; font-size: 0.8em; margin-left: 4px;">${esc(entity.school)}</span>` : ''}
            </div>
            ${entity.castingTime ? `<div style="font-size: 0.85em;"><span style="color: var(--text-dim);">Zeitaufwand:</span> ${esc(entity.castingTime)}</div>` : ''}
            ${entity.range ? `<div style="font-size: 0.85em;"><span style="color: var(--text-dim);">Reichweite:</span> ${esc(entity.range)}</div>` : ''}
            ${entity.duration ? `<div style="font-size: 0.85em;"><span style="color: var(--text-dim);">Dauer:</span> ${esc(entity.duration)}</div>` : ''}
            ${entity.description ? `<div style="color: var(--text); margin-top: 10px; font-size: 0.9em;">${sanitizeHTML(entity.description.substring(0, 200))}${entity.description.length > 200 ? '...' : ''}</div>` : ''}
        `;
    } else if (type === 'loot') {
        const rarityColors = {
            common: 'var(--text)',
            uncommon: 'var(--green)',
            rare: 'var(--blue)',
            'very-rare': 'var(--purple)',
            legendary: 'var(--gold)',
            artifact: 'var(--red)'
        };
        const rarityColor = rarityColors[entity.rarity] || 'var(--text)';
        content = `
            ${entity.rarity ? `<div style="color: ${rarityColor}; font-weight: 600; margin-bottom: 8px;">${esc(entity.rarity.charAt(0).toUpperCase() + entity.rarity.slice(1))}</div>` : ''}
            ${entity.value ? `<div style="color: var(--gold); font-size: 0.9em;">💰 ${esc(entity.value)}</div>` : ''}
            ${entity.weight ? `<div style="font-size: 0.85em; color: var(--text-dim);">⚖️ ${esc(entity.weight)}</div>` : ''}
            ${entity.description ? `<div style="color: var(--text); margin-top: 10px;">${sanitizeHTML(entity.description)}</div>` : ''}
        `;
    } else if (type === 'wiki') {
        const parent = entity.parentId ? EntityLookup.wiki(entity.parentId) : null;
        content = `
            ${parent ? `<div style="font-size: 0.85em; color: var(--cyan); margin-bottom: 8px;">📁 ${esc(parent.name)}</div>` : ''}
            ${entity.content ? `<div style="color: var(--text); max-height: 300px; overflow-y: auto;">${sanitizeHTML(entity.content.substring(0, 500))}${entity.content.length > 500 ? '...' : ''}</div>` : '<div style="color: var(--text-dim);">Kein Inhalt</div>'}
        `;
    }
    // Erstelle ein temporäres Modal
    const modalId = 'entity-preview-modal';
    let modal = $(modalId);
    const LINK_ICONS = window.LINK_ICONS;
    const ENTITY_TYPE_NAMES = window.ENTITY_TYPE_NAMES;
    const hideModal = window.hideModal;
    const showModal = window.showModal;
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <span id="entity-preview-title"></span>
                    <button class="btn btn-sm" data-action="hide-modal" data-value="${modalId}">✕</button>
                </div>
                <div id="entity-preview-content" style="padding: 16px;"></div>
                <div class="modal-footer" style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn" data-action="hide-modal" data-value="${modalId}">Schließen</button>
                    <button class="btn btn-success" id="entity-preview-goto">Zum Tab wechseln</button>
                </div>
            </div>
        `;
        // Klick auf Overlay schließt Modal
        modal.addEventListener('click', e => {
            if (e.target === modal && hideModal) hideModal(modalId);
        });
        document.body.appendChild(modal);
    }
    const titleEl = $('entity-preview-title');
    const contentEl = $('entity-preview-content');
    const gotoBtn = $('entity-preview-goto');
    if (titleEl) {
        titleEl.innerHTML = `${LINK_ICONS[type] || '🔗'} ${esc(entity.name || entity.title)} <span style="color: var(--text-dim); font-size: 0.8em;">(${ENTITY_TYPE_NAMES[type] || type})</span>`;
    }
    if (contentEl) {
        contentEl.innerHTML =
            content || '<div style="color: var(--text-dim);">Keine Details verfügbar.</div>';
    }
    if (gotoBtn) {
        gotoBtn.onclick = () => {
            if (hideModal) hideModal(modalId);
            navigateToEntity(type, id);
        };
    }
    if (showModal) showModal(modalId);
}
// Highlightet eine Entity-Kachel nach Navigation
function highlightEntity(type, id) {
    const cardIdMap = {
        npcs: `npc-card-${id}`,
        locations: `loc-card-${id}`,
        quests: `quest-card-${id}`,
        characters: `char-card-${id}`,
        encounters: `enc-card-${id}`,
        spells: `spell-card-${id}`,
        loot: `loot-item-${id}`
    };
    const cardId = cardIdMap[type];
    const card = cardId ? $(cardId) : null;
    if (card) {
        // Scroll into view
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Expand if collapsed
        if (card.classList.contains('collapsed')) {
            card.classList.remove('collapsed');
        }
        // Highlight effect
        card.style.transition = 'box-shadow 0.3s ease, transform 0.3s ease';
        card.style.boxShadow = '0 0 20px var(--gold)';
        card.style.transform = 'scale(1.02)';
        setTimeout(() => {
            card.style.boxShadow = '';
            card.style.transform = '';
        }, 2000);
        const getEntityByTypeAndId = window.getEntityByTypeAndId;
        const entity = getEntityByTypeAndId(type, id);
        if (entity) {
            showToast(`📍 ${entity.name || entity.title}`);
        }
    }
}
// ============================================================
