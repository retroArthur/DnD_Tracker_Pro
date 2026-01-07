// [SECTION:NPC_INTERACTIONS]
// ============================================================
// NPC INTERACTIONS - @toggle @select @relations
// ============================================================

import { $ } from '@utils/basic';
import { showToast, parseEntityId } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { EntityLookup } from '@render/helpers';

/**
 * Toggles NPC card or selects NPC in master-detail layout
 */
export function toggleNPCCard(cardOrId: number | string): void {
    const selectNPC = (window as any).selectNPC;
    const id = parseEntityId(cardOrId);
    if (id === null) return;

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

/**
 * Toggles an NPC trigger (activated/deactivated)
 */
export function toggleNPCTrigger(npcId: number, triggerIdx: number): void {
    const renderLocations = (window as any).renderLocations;
    const selectedNpcId = (window as any).selectedNpcId;

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
            const revealEl = triggerItem.querySelector('.npc-trigger-reveal') as HTMLElement | null;
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

/**
 * Marks an NPC dialog as used/unused
 */
export function toggleNPCDialogUsed(npcId: number, dialogIdx: number): void {
    const selectedNpcId = (window as any).selectedNpcId;

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
                btn.setAttribute('title', used ? 'Als unbenutzt markieren' : 'Als verwendet markieren');
            }
        }

        // Dialog-Counter in Section-Title aktualisieren
        const usedCount = npc.dialogs.filter((d: any) => d.used).length;
        const sectionTitles = detailPanel.querySelectorAll('.npc-section-title');
        sectionTitles.forEach((title: Element) => {
            if (title.textContent?.includes('Dialoge')) {
                const btnHtml = title.querySelector('.npc-section-btn')?.outerHTML || '';
                title.innerHTML = `💬 Dialoge (${usedCount}/${npc.dialogs.length} verwendet) ${btnHtml}`;
            }
        });
    }

    save();

    const status = used ? 'als verwendet markiert' : 'zurückgesetzt';
    showToast(`Dialog ${status}`);
}

/**
 * Copies the text of an NPC dialog to clipboard
 */
export function copyDialogText(npcId: number, dialogIdx: number): void {
    const npc = EntityLookup.npc(npcId);
    if (!npc || !npc.dialogs || !npc.dialogs[dialogIdx]) return;

    const text = npc.dialogs[dialogIdx].text;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Dialog kopiert!');
    }).catch(() => {
        showToast('Kopieren fehlgeschlagen');
    });
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).toggleNPCCard = toggleNPCCard;
(window as any).toggleNPCTrigger = toggleNPCTrigger;
(window as any).toggleNPCDialogUsed = toggleNPCDialogUsed;
(window as any).copyDialogText = copyDialogText;
