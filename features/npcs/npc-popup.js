// ============================================================
// NPC POPUP - Popup-Funktionen für Location-Tags
// ============================================================
// Extrahiert aus features/render-npcs.js

function showNPCPopup(npcId, event) {
    event.stopPropagation();

    const npc = EntityLookup.npc(npcId);
    if (!npc) return;

    // Entferne vorhandenes Popup
    closeNPCPopup();

    const location = EntityLookup.location(npc.locationId);
    const filter = EntityLookup.filter(npc.filterId);

    // Tags zusammenstellen
    const tags = [];
    if (npc.quests?.length) tags.push(...npc.quests.map(q => `<span class="chip color-green" style="font-size:0.75em;">📜 ${esc(q)}</span>`));
    if (npc.info?.length) tags.push(...npc.info.map(i => `<span class="chip color-purple" style="font-size:0.75em;">💡 ${esc(i)}</span>`));
    if (npc.relationships?.length) tags.push(...npc.relationships.map(r => `<span class="chip color-pink" style="font-size:0.75em;">🔗 ${esc(r)}</span>`));

    // Trigger
    const triggers = (npc.triggers || []).map(t => `
        <div style="font-size:0.8em; margin-bottom: 4px;">
            <span style="color:var(--yellow);">⚡ ${esc(t.condition)}</span>
            <div style="color:var(--text-dim); padding-left: 16px;">→ ${esc(t.reveal)}</div>
        </div>
    `).join('');

    // Dialoge (erste 2)
    const dialogs = (npc.dialogs || []).slice(0, 2).map(d => `
        <div style="font-size:0.8em; margin-bottom: 4px; padding: 6px; background: var(--bg-dark); border-radius: 4px;">
            ${d.title ? `<div style="color: var(--cyan); font-weight: 500;">${esc(d.title)}</div>` : ''}
            <div style="color:var(--text-dim); font-style: italic;">"${esc(d.text.substring(0, 100))}${d.text.length > 100 ? '...' : ''}"</div>
        </div>
    `).join('');

    const popup = document.createElement('div');
    popup.className = 'npc-popup';
    popup.id = 'npc-popup';
    popup.innerHTML = `
        <div class="npc-popup-header">
            ${npc.avatar
                ? `<img src="${esc(npc.avatar)}" class="npc-popup-avatar">`
                : `<div class="npc-popup-avatar-placeholder">🧑</div>`}
            <div class="npc-popup-title">
                <div class="npc-popup-name">${esc(npc.name)}</div>
                <div class="npc-popup-role">
                    ${npc.race ? `<span style="color: var(--purple);">${esc(npc.race)}</span>` : ''}
                    ${npc.race && npc.role ? ' • ' : ''}
                    ${npc.role || ''}
                </div>
            </div>
            <button class="npc-popup-close" data-action="call" data-value="closeNPCPopup">✕</button>
        </div>
        <div class="npc-popup-body">
            ${npc.description ? `
                <div class="npc-popup-section">
                    <div class="npc-popup-section-title">Beschreibung</div>
                    <div style="font-size: 0.85em; color: var(--text);">${npc.description}</div>
                </div>
            ` : ''}

            ${tags.length ? `
                <div class="npc-popup-section">
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">${tags.join('')}</div>
                </div>
            ` : ''}

            ${triggers ? `
                <div class="npc-popup-section">
                    <div class="npc-popup-section-title">🔔 Trigger</div>
                    ${triggers}
                </div>
            ` : ''}

            ${dialogs ? `
                <div class="npc-popup-section">
                    <div class="npc-popup-section-title">💬 Dialoge ${npc.dialogs?.length > 2 ? `(+${npc.dialogs.length - 2} mehr)` : ''}</div>
                    ${dialogs}
                </div>
            ` : ''}

            ${npc.chapter ? `<div style="font-size: 0.75em; color: var(--text-dim);">📖 ${esc(npc.chapter)}</div>` : ''}
            ${filter ? `<span class="chip color-${filter.color}" style="font-size:0.7em; margin-top: 4px;">${esc(filter.name)}</span>` : ''}
        </div>
        <div class="npc-popup-footer">
            <button class="btn btn-sm" data-action="edit-npc-close-popup" data-id="${npc.id}">✏️ Bearbeiten</button>
            <button class="btn btn-sm" data-action="show-add-dialog-modal" data-id="${npc.id}">💬 Dialog</button>
            <button class="btn btn-sm" data-action="view-npc-details" data-id="${npc.id}">🔍 Details</button>
        </div>
    `;

    document.body.appendChild(popup);

    // Position berechnen
    const rect = event.target.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();

    let left = rect.left;
    let top = rect.bottom + 8;

    // Rechts anpassen wenn nötig
    if (left + popupRect.width > window.innerWidth - 20) {
        left = window.innerWidth - popupRect.width - 20;
    }

    // Unten anpassen wenn nötig
    if (top + popupRect.height > window.innerHeight - 20) {
        top = rect.top - popupRect.height - 8;
    }

    popup.style.left = Math.max(10, left) + 'px';
    popup.style.top = Math.max(10, top) + 'px';

    // Click außerhalb schließt Popup
    setTimeout(() => {
        document.addEventListener('click', closeNPCPopupOnOutsideClick);
    }, 10);
}

function closeNPCPopup() {
    const popup = $('npc-popup');
    if (popup) popup.remove();
    document.removeEventListener('click', closeNPCPopupOnOutsideClick);
}

function closeNPCPopupOnOutsideClick(e) {
    const popup = $('npc-popup');
    if (popup && !popup.contains(e.target)) {
        closeNPCPopup();
    }
}
