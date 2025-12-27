// ============================================================
// NPC INTERACTIONS - Toggle und Interaktions-Funktionen
// ============================================================
// Extrahiert aus features/render-npcs.js

function toggleNPCCard(cardOrId) {
    const id = typeof cardOrId === 'number' ? cardOrId : parseInt(cardOrId);

    // Bei Listenansicht: Expandiere inline
    if (viewModes.npcs === 'list') {
        const row = document.querySelector(`.list-view-row.npc-row[data-id="${id}"]`);
        if (row) {
            row.classList.toggle('expanded');
        }
        return;
    }

    // Grid-Ansicht: Normal togglen
    const card = $(`npc-card-${id}`);
    if (card) {
        card.classList.toggle('collapsed');
    }
}

function toggleNPCTrigger(npcId, triggerIdx) {
    const npc = EntityLookup.npc(npcId);
    if (!npc || !npc.triggers || !npc.triggers[triggerIdx]) return;

    npc.triggers[triggerIdx].triggered = !npc.triggers[triggerIdx].triggered;
    const triggered = npc.triggers[triggerIdx].triggered;

    // Nur die betroffenen DOM-Elemente aktualisieren statt alles neu zu rendern
    const npcCard = $(`npc-card-${npcId}`);
    if (npcCard) {
        const triggerItems = npcCard.querySelectorAll('.npc-trigger-item');
        const triggerItem = triggerItems[triggerIdx];
        if (triggerItem) {
            const checkBox = triggerItem.querySelector('.npc-trigger-check');
            const revealBox = triggerItem.querySelector('.npc-trigger-reveal');

            if (checkBox) {
                checkBox.classList.toggle('triggered', triggered);
                checkBox.innerHTML = triggered ? '✓' : '';
            }
            if (revealBox) {
                revealBox.classList.toggle('hidden', !triggered);
            }
        }
    }

    // Locations aktualisieren (falls NPC dort angezeigt wird)
    renderLocations();
    save();

    const status = triggered ? 'aktiviert' : 'deaktiviert';
    showToast(`Trigger ${status}`);
}

function toggleNPCDialogUsed(npcId, dialogIdx) {
    const npc = EntityLookup.npc(npcId);
    if (!npc || !npc.dialogs || !npc.dialogs[dialogIdx]) return;

    npc.dialogs[dialogIdx].used = !npc.dialogs[dialogIdx].used;
    const used = npc.dialogs[dialogIdx].used;

    // Nur die betroffenen DOM-Elemente aktualisieren
    const npcCard = $(`npc-card-${npcId}`);
    if (npcCard) {
        const dialogItems = npcCard.querySelectorAll('.npc-dialog-item');
        const dialogItem = dialogItems[dialogIdx];
        if (dialogItem) {
            const marker = dialogItem.querySelector('.npc-dialog-marker');
            const title = dialogItem.querySelector('.npc-dialog-title');
            const status = dialogItem.querySelector('.npc-dialog-status');
            const btn = dialogItem.querySelector('.npc-dialog-actions .btn');

            if (marker) marker.classList.toggle('used', used);
            if (title) title.classList.toggle('used', used);
            if (status) {
                status.className = `npc-dialog-status ${used ? 'used' : 'unused'}`;
                status.textContent = used ? '✓ Verwendet' : '○ Offen';
            }
            if (btn) {
                btn.className = `btn btn-sm ${used ? '' : 'btn-success'}`;
                btn.innerHTML = used ? '↩️ Zurücksetzen' : '✓ Als verwendet markieren';
            }
        }

        // Counter im Header aktualisieren
        const countEl = npcCard.querySelector('.npc-dialogs-count');
        if (countEl) {
            const usedCount = npc.dialogs.filter(d => d.used).length;
            countEl.textContent = `${usedCount}/${npc.dialogs.length} verwendet`;
        }
    }

    save();

    const status = used ? 'als verwendet markiert' : 'zurückgesetzt';
    showToast(`Dialog ${status}`);
}

function copyDialogText(npcId, dialogIdx) {
    const npc = EntityLookup.npc(npcId);
    if (!npc || !npc.dialogs || !npc.dialogs[dialogIdx]) return;

    const text = npc.dialogs[dialogIdx].text;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Dialog kopiert!');
    }).catch(() => {
        showToast('Kopieren fehlgeschlagen');
    });
}
