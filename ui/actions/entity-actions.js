// ============================================================
// ENTITY ACTIONS - Character, NPC, Location, Quest, Encounter, Loot, Spell
// ============================================================

const EntityActions = {
    // Character actions
    'edit-char': (ctx) => editChar(ctx.id),
    'delete-char': (ctx) => deleteChar(ctx.id),
    'show-char-details': (ctx) => showCharacterDetails(ctx.id),
    'scroll-to-char': (ctx) => scrollToChar(ctx.id),
    'update-char-hp': (ctx) => updateCharacterHP(ctx.id, parseInt(ctx.value)),
    'edit-char-from-modal': (ctx) => { hideModal('char-detail-modal'); editChar(ctx.id); },
    'show-assign-spells': (ctx) => showAssignSpells(ctx.id),
    'show-assign-items': (ctx) => showAssignItems(ctx.id),
    'show-add-effect': (ctx) => showAddEffect(ctx.id),
    'show-assign-spells-from-modal': (ctx) => { hideModal('char-detail-modal'); showAssignSpells(ctx.id); },
    'show-assign-items-from-modal': (ctx) => { hideModal('char-detail-modal'); showAssignItems(ctx.id); },
    'change-assign-qty': (ctx) => changeAssignItemQty(ctx.id, parseInt(ctx.value) || 0),

    // NPC actions
    'edit-npc': (ctx) => editNPC(ctx.id),
    'delete-npc': (ctx) => deleteNPC(ctx.id),
    'toggle-npc-card': (ctx) => toggleNPCCard(ctx.id),
    'select-npc': (ctx) => { if (typeof selectNPC === 'function') selectNPC(ctx.id); },
    'set-npc-filter': (ctx) => { if (typeof setNpcFilter === 'function') setNpcFilter(ctx.id || ctx.value); },
    'scroll-to-npc': (ctx) => scrollToNPC(ctx.id),
    'edit-npc-stop': (ctx) => { ctx.event.stopPropagation(); editNPC(ctx.id); },
    'delete-npc-stop': (ctx) => { ctx.event.stopPropagation(); deleteNPC(ctx.id); },
    'show-npc-popup': (ctx) => showNPCPopup(ctx.id, ctx.event),
    'show-npc-popup-stop': (ctx) => { ctx.event.stopPropagation(); showNPCPopup(ctx.id, ctx.event); },
    'edit-npc-close-popup': (ctx) => { editNPC(ctx.id); closeNPCPopup(); },
    'view-npc-details': (ctx) => {
        closeNPCPopup();
        switchView('view-npcs');
        setTimeout(() => {
            const card = document.getElementById(`npc-card-${ctx.id}`);
            if (card) card.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    },
    'toggle-npc-section': (ctx) => {
        const content = ctx.target.nextElementSibling;
        if (content) {
            content.classList.toggle('collapsed');
            const arrow = ctx.target.querySelector('.npc-section-arrow');
            if (arrow) {
                arrow.style.transform = content.classList.contains('collapsed') ? '' : 'rotate(90deg)';
            }
        }
    },
    'toggle-npc-dialogs': (ctx) => {
        const section = ctx.target.closest('.npc-dialogs-section');
        const content = section?.querySelector('.npc-dialogs-content');
        const arrow = ctx.target.querySelector('span:first-child span:first-child') || ctx.target.querySelector('span');
        if (content) {
            content.classList.toggle('open');
            if (arrow && arrow.textContent === '▶') {
                arrow.textContent = content.classList.contains('open') ? '▼' : '▶';
            }
        }
    },
    'toggle-npc-dialog': (ctx) => {
        const dialogItem = ctx.target.closest('.npc-dialog-item');
        const body = dialogItem?.querySelector('.npc-dialog-body');
        const expand = ctx.target.querySelector('.npc-dialog-expand');
        if (body) {
            body.classList.toggle('open');
            if (expand) expand.classList.toggle('open');
        }
    },
    'toggle-npc-trigger-stop': (ctx) => { ctx.event.stopPropagation(); toggleNPCTrigger(ctx.id, parseInt(ctx.value)); },
    'toggle-npc-dialog-stop': (ctx) => { ctx.event.stopPropagation(); toggleNPCDialogUsed(ctx.id, parseInt(ctx.value)); },
    'copy-dialog-text-stop': (ctx) => { ctx.event.stopPropagation(); copyDialogText(ctx.id, parseInt(ctx.value)); },
    'show-add-dialog-modal': (ctx) => { showAddDialogModal(ctx.id); closeNPCPopup(); },
    'show-add-dialog-modal-stop': (ctx) => { ctx.event.stopPropagation(); showAddDialogModal(ctx.id); },
    'save-quick-dialog': (ctx) => saveQuickDialog(ctx.id),
    'show-relations-modal-stop': (ctx) => { ctx.event.stopPropagation(); showRelationsModal(ctx.id); },
    'cycle-relation-status-stop': (ctx) => { ctx.event.stopPropagation(); cycleRelationStatus(ctx.id, parseInt(ctx.value)); },
    'remove-relation-stop': (ctx) => { ctx.event.stopPropagation(); removeRelation(ctx.id, parseInt(ctx.value)); },

    // Location actions
    'edit-location': (ctx) => editLocation(ctx.id),
    'delete-location': (ctx) => deleteLocation(ctx.id),
    'toggle-location': (ctx) => toggleLocation(ctx.id),
    'toggle-location-card': (ctx) => toggleLocationCard(ctx.id),
    'set-loc-filter': (ctx) => setLocFilter(ctx.id || ctx.value),
    'select-location': (ctx) => selectLocation(ctx.id),
    'delete-filter': (ctx) => deleteFilter(ctx.id),

    // Quest actions
    'edit-quest': (ctx) => editQuest(ctx.id),
    'delete-quest': (ctx) => deleteQuest(ctx.id),
    'toggle-quest-status': (ctx) => toggleQuestStatus(ctx.id),
    'toggle-quest': (ctx) => toggleQuest(ctx.id),
    'toggle-quest-tracked-stop': (ctx) => { ctx.event.stopPropagation(); toggleQuestTracked(ctx.id); },
    'toggle-quest-status-stop': (ctx) => { ctx.event.stopPropagation(); toggleQuestStatus(ctx.id, ctx.value); },
    'navigate-to-quest': (ctx) => {
        switchView('quests');
        setTimeout(() => {
            const questCard = $(`quest-${ctx.id}`);
            if (questCard) {
                questCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                questCard.style.boxShadow = '0 0 0 2px var(--gold)';
                setTimeout(() => questCard.style.boxShadow = '', 2000);
            }
        }, 100);
    },

    // Encounter actions
    'edit-encounter': (ctx) => editEnc(ctx.id),
    'delete-encounter': (ctx) => deleteEnc(ctx.id),
    'load-encounter': (ctx) => addEncToInit(ctx.id),
    'toggle-encounter-card': (ctx) => toggleEncounterCard(ctx.id),
    'edit-enc-stop': (ctx) => { ctx.event.stopPropagation(); editEnc(ctx.id); },
    'delete-enc-stop': (ctx) => { ctx.event.stopPropagation(); deleteEnc(ctx.id); },
    'load-enc-stop': (ctx) => { ctx.event.stopPropagation(); addEncToInit(ctx.id); },
    'load-monster-template': (ctx) => loadMonsterTemplate(ctx.value),
    'select-encounter': (ctx) => { if (typeof selectEncounter === 'function') selectEncounter(ctx.id); },
    'set-enc-filter': (ctx) => { if (typeof setEncFilter === 'function') setEncFilter(ctx.value || 'all'); },
    'show-enc-form': (ctx) => { if (typeof showEncForm === 'function') showEncForm(); },
    'toggle-enc-lang-dropdown': (ctx) => { if (typeof toggleEncLangDropdown === 'function') toggleEncLangDropdown(); },

    // Loot actions
    'select-loot': (ctx) => { if (typeof selectLoot === 'function') selectLoot(ctx.id); },
    'edit-loot': (ctx) => { ctx.event.stopPropagation(); editLoot(ctx.id); },
    'delete-loot': (ctx) => { ctx.event.stopPropagation(); removeLoot(ctx.id); },
    'edit-loot-stop': (ctx) => { ctx.event.stopPropagation(); editLoot(ctx.id); },
    'delete-loot-stop': (ctx) => { ctx.event.stopPropagation(); removeLoot(ctx.id); },
    'remove-loot-tag': (ctx) => removeLootTag(ctx.value),
    'set-loot-filter': (ctx) => setLootFilter(ctx.value || 'all'),
    'show-loot-modal': (ctx) => { if (typeof showLootModal === 'function') showLootModal(ctx.id || null); },

    // Spell actions
    'edit-spell': (ctx) => editSpell(ctx.id),
    'delete-spell': (ctx) => deleteSpell(ctx.id),
    'show-spell-tooltip': (ctx) => showSpellTooltip(ctx.id, ctx.event),
    'toggle-spell-card': (ctx) => toggleSpellCard(ctx.id),
    'edit-spell-stop': (ctx) => { ctx.event.stopPropagation(); editSpell(ctx.id); },
    'delete-spell-stop': (ctx) => { ctx.event.stopPropagation(); deleteSpell(ctx.id); },
    'set-spell-filter': (ctx) => setSpellFilter(ctx.value),
    'spell-level-filter': (ctx) => setSpellLevelFilter(ctx.value),
    'spell-school-filter': (ctx) => setSpellSchoolFilter(ctx.value)
};

// Register all entity actions
if (typeof EventDelegation !== 'undefined') {
    Object.entries(EntityActions).forEach(([name, handler]) => {
        EventDelegation.registerAction(name, handler);
    });
}
