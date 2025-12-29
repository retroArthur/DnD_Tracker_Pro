// ============================================================
// NPC INTERACTIONS - Toggle und Interaktions-Funktionen
// ============================================================
// Angepasst für Master-Detail Layout

function toggleNPCCard(cardOrId) {
    const id = typeof cardOrId === 'number' ? cardOrId : parseInt(cardOrId);

    // Im Master-Detail Layout: NPC auswählen
    if (typeof selectNPC === 'function') {
        selectNPC(id);
        return;
    }

    // Fallback für alte Layouts
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

    // Master-Detail Layout: Detail-Panel aktualisieren
    const detailPanel = $('npc-detail-panel');
    if (detailPanel && typeof selectedNpcId !== 'undefined' && selectedNpcId === npcId) {
        const triggerItems = detailPanel.querySelectorAll('.npc-trigger-item');
        const triggerItem = triggerItems[triggerIdx];
        if (triggerItem) {
            triggerItem.classList.toggle('triggered', triggered);
            const checkBox = triggerItem.querySelector('.npc-trigger-check');
            if (checkBox) {
                checkBox.classList.toggle('triggered', triggered);
                checkBox.innerHTML = triggered ? '✓' : '';
            }
            // Reveal-Text anzeigen/verstecken
            const revealEl = triggerItem.querySelector('.npc-trigger-reveal');
            if (revealEl) {
                if (triggered) {
                    revealEl.style.display = 'block';
                    revealEl.textContent = npc.triggers[triggerIdx].reveal || '';
                } else {
                    revealEl.style.display = 'none';
                }
            }
        }
    }

    // Locations aktualisieren (falls NPC dort angezeigt wird)
    if (typeof renderLocations === 'function') renderLocations();
    save();

    const status = triggered ? 'aktiviert' : 'deaktiviert';
    showToast(`Trigger ${status}`);
}

function toggleNPCDialogUsed(npcId, dialogIdx) {
    const npc = EntityLookup.npc(npcId);
    if (!npc || !npc.dialogs || !npc.dialogs[dialogIdx]) return;

    npc.dialogs[dialogIdx].used = !npc.dialogs[dialogIdx].used;
    const used = npc.dialogs[dialogIdx].used;

    // Master-Detail Layout: Detail-Panel aktualisieren
    const detailPanel = $('npc-detail-panel');
    if (detailPanel && typeof selectedNpcId !== 'undefined' && selectedNpcId === npcId) {
        const dialogItems = detailPanel.querySelectorAll('.npc-dialog-item');
        const dialogItem = dialogItems[dialogIdx];
        if (dialogItem) {
            dialogItem.classList.toggle('used', used);
            const marker = dialogItem.querySelector('.npc-dialog-marker');
            if (marker) marker.classList.toggle('used', used);

            // Button aktualisieren
            const btn = dialogItem.querySelector('.npc-detail-btn.small');
            if (btn) {
                btn.classList.toggle('success', !used);
                btn.innerHTML = used ? '↩️' : '✓';
                btn.title = used ? 'Als unbenutzt markieren' : 'Als verwendet markieren';
            }
        }

        // Dialog-Counter in Section-Title aktualisieren
        const usedCount = npc.dialogs.filter(d => d.used).length;
        const sectionTitles = detailPanel.querySelectorAll('.npc-section-title');
        sectionTitles.forEach(title => {
            if (title.textContent.includes('Dialoge')) {
                const btnHtml = title.querySelector('.npc-section-btn')?.outerHTML || '';
                title.innerHTML = `💬 Dialoge (${usedCount}/${npc.dialogs.length} verwendet) ${btnHtml}`;
            }
        });
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
