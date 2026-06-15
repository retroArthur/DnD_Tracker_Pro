// [SECTION:ENTITY_ACTIONS]
// ============================================================
// ENTITY ACTIONS - @character @npc @location @quest @encounter
// ============================================================

const EntityActions = {
    // Character actions
    'edit-char': ctx => editChar(ctx.id),
    'delete-char': ctx => deleteChar(ctx.id),
    'show-char-details': ctx => showCharacterDetails(ctx.id),
    'scroll-to-char': ctx => scrollToChar(ctx.id),
    'update-char-hp': ctx => updateCharacterHP(ctx.id, parseInt(ctx.value)),
    'edit-char-from-modal': ctx => {
        hideModal('char-detail-modal');
        editChar(ctx.id);
    },
    'show-assign-spells': ctx => showAssignSpells(ctx.id),
    'show-assign-items': ctx => showAssignItems(ctx.id),
    'show-add-effect': ctx => showAddEffect(ctx.id),
    'show-assign-spells-from-modal': ctx => {
        hideModal('char-detail-modal');
        showAssignSpells(ctx.id);
    },
    'show-assign-items-from-modal': ctx => {
        hideModal('char-detail-modal');
        showAssignItems(ctx.id);
    },
    'change-assign-qty': ctx => changeAssignItemQty(ctx.id, parseInt(ctx.value) || 0),
    'toggle-inspiration-stop': ctx => {
        ctx.event.stopPropagation();
        const ch = EntityLookup.character(ctx.id);
        if (!ch) return;
        ch.inspiration = !ch.inspiration;
        // KEIN saveUndoState() — Inspiration-Toggle ist trivial reversibel (D-02)
        window.save();
        window.renderParty();
        showToast(ch.inspiration ? '⭐ Inspiration erhalten!' : '☆ Inspiration entfernt');
    },

    // CHAR-01 / D-11: Manueller Levelaufstieg (NIEMALS Auto-Bump — DM bestätigt)
    // confirm-level-up: XP-Modus "Stufe bestätigen"-Button (wenn canLevelUp === true)
    // milestone-level-up: Milestone-Modus "+1 Level"-Button (immer verfügbar, DM-Entscheidung)
    'confirm-level-up': ctx => {
        var ch = EntityLookup.character(ctx.id);
        if (!ch) return;
        if ((ch.level || 1) >= 20) {
            showToast('Charakter ist bereits auf Max-Level 20', 'warning');
            return;
        }
        pushUndo('Stufe erhöht');
        ch.level = (ch.level || 1) + 1;
        // Proficiency-Bonus neu berechnen (mirror saveCharacter — nutzt getProfBonus aus utilities.js:412)
        ch.proficiencyBonus = getProfBonus(ch.level);
        window.save();
        if (typeof window.renderParty === 'function') window.renderParty();
        // Detail-Modal neu öffnen damit Änderungen sofort sichtbar sind
        if (typeof window.showCharacterDetails === 'function') window.showCharacterDetails(ch.id);
        showToast('⬆️ ' + esc(ch.name) + ' ist jetzt Level ' + ch.level + '!', 'success');
    },
    'milestone-level-up': ctx => {
        // Identische Logik wie confirm-level-up — Milestone-Modus-Alias
        var ch = EntityLookup.character(ctx.id);
        if (!ch) return;
        if ((ch.level || 1) >= 20) {
            showToast('Charakter ist bereits auf Max-Level 20', 'warning');
            return;
        }
        pushUndo('Stufe erhöht (Meilenstein)');
        ch.level = (ch.level || 1) + 1;
        ch.proficiencyBonus = getProfBonus(ch.level);
        window.save();
        if (typeof window.renderParty === 'function') window.renderParty();
        if (typeof window.showCharacterDetails === 'function') window.showCharacterDetails(ch.id);
        showToast('⬆️ ' + esc(ch.name) + ' ist jetzt Level ' + ch.level + '! (Meilenstein)', 'success');
    },

    // Charakter-Angriffs-Editor: add-attack / delete-attack (D-05, CHAR-03)
    // Diese Handler mutieren NUR das transiente Formular-DOM — kein D, kein save()
    'add-attack': () => {
        var container = document.getElementById('cf-attacks-container');
        if (!container) return;
        var MAX_ATK = 20; // DoS cap (T-06-09)
        if (container.querySelectorAll('.cf-attack-row').length >= MAX_ATK) {
            showToast('Maximum 20 Angriffe erreicht', 'warning');
            return;
        }
        // buildAttackRowHTML ist in party-crud.js definiert und window-exportiert
        if (typeof window.buildAttackRowHTML === 'function') {
            container.insertAdjacentHTML('beforeend', window.buildAttackRowHTML({}));
        }
    },
    'delete-attack': ctx => {
        var row = ctx.target ? ctx.target.closest('.cf-attack-row') : null;
        if (row) row.remove();
    },

    // ============================================================
    // CHAR-03 / D-04: Clickable rolls in the detail modal
    // All handlers: stopPropagation() first (-stop), then compute+display roll
    // No function-local const X = window.X — access globals directly
    // ============================================================

    // Skill check roll (roll-char-skill-stop)
    'roll-char-skill-stop': ctx => {
        ctx.event.stopPropagation();
        var ch = EntityLookup.character(ctx.id);
        if (!ch) return;
        var dataset = ctx.target ? ctx.target.dataset : {};
        var skillKey = dataset.skill || '';
        var adv = dataset.adv || '';
        var skillInfo = SKILL_INFO ? SKILL_INFO[skillKey] : null;
        if (!skillInfo) return;
        var mod = calcSkillModifier(ch, skillKey);
        var skillName = skillInfo.name;
        var label = esc(ch.name) + ': ' + skillName;
        var notation = adv === 'adv' ? '2d20kh1' : (adv === 'dis' ? '2d20kl1' : '1d20');
        var parsed = parseDiceNotation(notation);
        var roll = parsed ? parsed.total : Math.floor(Math.random() * 20) + 1;
        var total = roll + mod;
        var rolls = parsed ? parsed.rolls : [roll];
        displayDiceResult(total, label + ' (' + notation + formatModifier(mod) + ')', rolls, roll === 20, roll === 1);
        addToDiceHistory(label, total, rolls);
    },

    // Saving throw roll (roll-char-save-stop)
    'roll-char-save-stop': ctx => {
        ctx.event.stopPropagation();
        var ch = EntityLookup.character(ctx.id);
        if (!ch) return;
        var dataset = ctx.target ? ctx.target.dataset : {};
        var attr = dataset.attr || '';
        var adv = dataset.adv || '';
        var attrVal = (ch.attributes && ch.attributes[attr]) || 10;
        var attrMod = Math.floor((attrVal - 10) / 2);
        var saves = ch.saveProficiencies || {};
        var profBonus = ch.proficiencyBonus || getProficiencyBonus(ch.level || 1);
        var saveMod = attrMod + (saves[attr] ? profBonus : 0);
        var label = esc(ch.name) + ': ' + attr.toUpperCase() + ' Rettungswurf';
        var notation = adv === 'adv' ? '2d20kh1' : (adv === 'dis' ? '2d20kl1' : '1d20');
        var parsed = parseDiceNotation(notation);
        var roll = parsed ? parsed.total : Math.floor(Math.random() * 20) + 1;
        var total = roll + saveMod;
        var rolls = parsed ? parsed.rolls : [roll];
        displayDiceResult(total, label + ' (' + notation + formatModifier(saveMod) + ')', rolls, roll === 20, roll === 1);
        addToDiceHistory(label, total, rolls);
    },

    // Raw attribute check roll (roll-char-attr-stop)
    'roll-char-attr-stop': ctx => {
        ctx.event.stopPropagation();
        var ch = EntityLookup.character(ctx.id);
        if (!ch) return;
        var dataset = ctx.target ? ctx.target.dataset : {};
        var attr = dataset.attr || '';
        var adv = dataset.adv || '';
        var attrVal = (ch.attributes && ch.attributes[attr]) || 10;
        var mod = Math.floor((attrVal - 10) / 2);
        var label = esc(ch.name) + ': ' + attr.toUpperCase() + ' Attribut-Check';
        var notation = adv === 'adv' ? '2d20kh1' : (adv === 'dis' ? '2d20kl1' : '1d20');
        var parsed = parseDiceNotation(notation);
        var roll = parsed ? parsed.total : Math.floor(Math.random() * 20) + 1;
        var total = roll + mod;
        var rolls = parsed ? parsed.rolls : [roll];
        displayDiceResult(total, label + ' (' + notation + formatModifier(mod) + ')', rolls, roll === 20, roll === 1);
        addToDiceHistory(label, total, rolls);
    },

    // Attack roll from detail modal (roll-char-attack-stop)
    // data-formula contains the dice formula (e.g. "1d20+5" or "1d8+3")
    // data-label contains descriptive name for the roll (e.g. "Kurzschwert Treffer")
    'roll-char-attack-stop': ctx => {
        ctx.event.stopPropagation();
        var dataset = ctx.target ? ctx.target.dataset : {};
        var formula = dataset.formula || dataset.value || '';
        var label = dataset.label || 'Angriff';
        if (!formula) return;
        var parsed = parseDiceNotation(formula);
        if (!parsed) return;
        var total = parsed.total;
        var rolls = parsed.rolls || [];
        var isCrit = (parsed.keptRolls || rolls).some(function(r) { return r === 20; });
        var isFail = (parsed.keptRolls || rolls).some(function(r) { return r === 1; });
        displayDiceResult(total, label + ' (' + formula + ')', rolls, isCrit, isFail);
        addToDiceHistory(label, total, rolls);
    },

    // NPC actions
    'edit-npc': ctx => editNPC(ctx.id),
    'delete-npc': ctx => deleteNPC(ctx.id),
    'toggle-npc-card': ctx => toggleNPCCard(ctx.id),
    'select-npc': ctx => {
        if (typeof selectNPC === 'function') selectNPC(ctx.id);
    },
    'set-npc-filter': ctx => {
        if (typeof setNpcFilter === 'function') setNpcFilter(ctx.id || ctx.value);
    },
    'scroll-to-npc': ctx => scrollToNPC(ctx.id),
    'edit-npc-stop': ctx => {
        ctx.event.stopPropagation();
        editNPC(ctx.id);
    },
    'delete-npc-stop': ctx => {
        ctx.event.stopPropagation();
        deleteNPC(ctx.id);
    },
    'show-npc-popup': ctx => showNPCPopup(ctx.id, ctx.event),
    'show-npc-popup-stop': ctx => {
        ctx.event.stopPropagation();
        showNPCPopup(ctx.id, ctx.event);
    },
    'edit-npc-close-popup': ctx => {
        editNPC(ctx.id);
        closeNPCPopup();
    },
    'view-npc-details': ctx => {
        closeNPCPopup();
        switchView('view-npcs');
        setTimeout(() => {
            const card = document.getElementById(`npc-card-${ctx.id}`);
            if (card) card.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    },
    'toggle-npc-section': ctx => {
        const content = ctx.target.nextElementSibling;
        if (content) {
            content.classList.toggle('collapsed');
            const arrow = ctx.target.querySelector('.npc-section-arrow');
            if (arrow) {
                arrow.style.transform = content.classList.contains('collapsed')
                    ? ''
                    : 'rotate(90deg)';
            }
        }
    },
    'toggle-npc-dialogs': ctx => {
        const section = ctx.target.closest('.npc-dialogs-section');
        const content = section?.querySelector('.npc-dialogs-content');
        const arrow =
            ctx.target.querySelector('span:first-child span:first-child') ||
            ctx.target.querySelector('span');
        if (content) {
            content.classList.toggle('open');
            if (arrow && arrow.textContent === '▶') {
                arrow.textContent = content.classList.contains('open') ? '▼' : '▶';
            }
        }
    },
    'toggle-npc-dialog': ctx => {
        const dialogItem = ctx.target.closest('.npc-dialog-item');
        const body = dialogItem?.querySelector('.npc-dialog-body');
        const expand = ctx.target.querySelector('.npc-dialog-expand');
        if (body) {
            body.classList.toggle('open');
            if (expand) expand.classList.toggle('open');
        }
    },
    'toggle-npc-trigger-stop': ctx => {
        ctx.event.stopPropagation();
        toggleNPCTrigger(ctx.id, parseInt(ctx.value));
    },
    'toggle-npc-dialog-stop': ctx => {
        ctx.event.stopPropagation();
        toggleNPCDialogUsed(ctx.id, parseInt(ctx.value));
    },
    'copy-dialog-text-stop': ctx => {
        ctx.event.stopPropagation();
        copyDialogText(ctx.id, parseInt(ctx.value));
    },
    'show-add-dialog-modal': ctx => {
        showAddDialogModal(ctx.id);
        closeNPCPopup();
    },
    'show-add-dialog-modal-stop': ctx => {
        ctx.event.stopPropagation();
        showAddDialogModal(ctx.id);
    },
    'save-quick-dialog': ctx => saveQuickDialog(ctx.id),
    'show-relations-modal-stop': ctx => {
        ctx.event.stopPropagation();
        showRelationsModal(ctx.id);
    },
    'cycle-relation-status-stop': ctx => {
        ctx.event.stopPropagation();
        cycleRelationStatus(ctx.id, parseInt(ctx.value));
    },
    'remove-relation-stop': ctx => {
        ctx.event.stopPropagation();
        removeRelation(ctx.id, parseInt(ctx.value));
    },
    'add-relation': ctx => addRelation(ctx.id),
    'set-relation-status': ctx => setRelationStatus(ctx.value),
    'remove-relation-modal': ctx => removeRelation(ctx.id, parseInt(ctx.value)),

    // Location actions
    'edit-location': ctx => editLocation(ctx.id),
    'delete-location': ctx => deleteLocation(ctx.id),
    'toggle-location': ctx => toggleLocation(ctx.id),
    'toggle-location-card': ctx => selectLocation(ctx.id), // Alias für select-location
    'set-loc-filter': ctx => setLocFilter(ctx.id || ctx.value),
    'select-location': ctx => selectLocation(ctx.id),
    'delete-filter': ctx => deleteFilter(ctx.id),

    // Quest actions
    'edit-quest': ctx => editQuest(ctx.id),
    'delete-quest': ctx => deleteQuest(ctx.id),
    'toggle-quest-status': ctx => toggleQuestStatus(ctx.id),
    'toggle-quest': ctx => toggleQuest(ctx.id),
    'toggle-quest-tracked-stop': ctx => {
        ctx.event.stopPropagation();
        toggleQuestTracked(ctx.id);
    },
    'toggle-quest-status-stop': ctx => {
        ctx.event.stopPropagation();
        toggleQuestStatus(ctx.id, ctx.value);
    },
    'navigate-to-quest': ctx => {
        switchView('quests');
        setTimeout(() => {
            const questCard = $(`quest-${ctx.id}`);
            if (questCard) {
                questCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                questCard.style.boxShadow = '0 0 0 2px var(--gold)';
                setTimeout(() => (questCard.style.boxShadow = ''), 2000);
            }
        }, 100);
    },

    // Encounter actions
    'edit-encounter': ctx => editEnc(ctx.id),
    'delete-encounter': ctx => deleteEnc(ctx.id),
    'load-encounter': ctx => addEncToInit(ctx.id),
    'toggle-encounter-card': ctx => toggleEncounterCard(ctx.id),
    'edit-enc-stop': ctx => {
        ctx.event.stopPropagation();
        editEnc(ctx.id);
    },
    'delete-enc-stop': ctx => {
        ctx.event.stopPropagation();
        deleteEnc(ctx.id);
    },
    'load-enc-stop': ctx => {
        ctx.event.stopPropagation();
        addEncToInit(ctx.id);
    },
    'load-monster-template': ctx => loadMonsterTemplate(ctx.value),
    'select-encounter': ctx => {
        if (typeof selectEncounter === 'function') selectEncounter(ctx.id);
    },
    'set-enc-filter': ctx => {
        if (typeof setEncFilter === 'function') setEncFilter(ctx.value || 'all');
    },
    'show-enc-form': ctx => {
        if (typeof showEncForm === 'function') showEncForm();
    },
    'toggle-enc-lang-dropdown': ctx => {
        if (typeof toggleEncLangDropdown === 'function') toggleEncLangDropdown();
    },

    // Loot actions
    'select-loot': ctx => {
        if (typeof selectLoot === 'function') selectLoot(ctx.id);
    },
    'edit-loot': ctx => {
        ctx.event.stopPropagation();
        editLoot(ctx.id);
    },
    'delete-loot': ctx => {
        ctx.event.stopPropagation();
        removeLoot(ctx.id);
    },
    'edit-loot-stop': ctx => {
        ctx.event.stopPropagation();
        editLoot(ctx.id);
    },
    'delete-loot-stop': ctx => {
        ctx.event.stopPropagation();
        removeLoot(ctx.id);
    },
    'remove-loot-tag': ctx => removeLootTag(ctx.value),
    'set-loot-filter': ctx => setLootFilter(ctx.value || 'all'),
    'show-loot-modal': ctx => {
        if (typeof showLootModal === 'function') showLootModal(ctx.id || null);
    },

    // Spell actions
    'edit-spell': ctx => editSpell(ctx.id),
    'delete-spell': ctx => deleteSpell(ctx.id),
    'show-spell-tooltip': ctx => showSpellTooltip(ctx.id, ctx.event),
    'toggle-spell-card': ctx => toggleSpellCard(ctx.id),
    'edit-spell-stop': ctx => {
        ctx.event.stopPropagation();
        editSpell(ctx.id);
    },
    'delete-spell-stop': ctx => {
        ctx.event.stopPropagation();
        deleteSpell(ctx.id);
    },
    'set-spell-filter': ctx => setSpellFilter(ctx.value),
    'spell-level-filter': ctx => setSpellLevelFilter(ctx.value),
    'spell-school-filter': ctx => setSpellSchoolFilter(ctx.value),

    // Character form actions (migrated from inline handlers)
    'update-proficiency-bonus': () => updateProficiencyBonus(),
    'update-speed-display': () => updateSpeedDisplay(),
    'update-avatar-preview': ctx => updateAvatarPreview(ctx.target.value),
    'update-attr-mod': ctx => {
        const attr = ctx.target.dataset.value;
        updateAttrMod(attr);
        if (attr === 'dex' && typeof updateInitFromDex === 'function') updateInitFromDex();
    },
    'update-char-languages': () => updateCharLanguages(),
    'render-party': () => renderParty(),

    // Encounter form actions
    'update-enc-languages': () => updateEncLanguages(),
    'update-enc-attr-mod': ctx => updateEncAttrMod(ctx.target.dataset.value),
    'toggle-enc-save-box': ctx => toggleEncSaveBox(ctx.target.dataset.value),

    // Spell form actions
    'spell-time-change': () => onSpellTimeChange(),
    'spell-range-change': () => onSpellRangeChange(),
    'spell-duration-change': () => onSpellDurationChange(),
    'toggle-material-field': () => toggleMaterialField(),

    // Assign modal actions
    'filter-assign-spells': () => filterAssignSpells(),
    'filter-assign-items': () => filterAssignItems(),

    // Render actions
    'render-quests': () => renderQuests(),
    'render-spells': () => renderSpells(),
    'populate-import-nodes': () => populateImportNodesList(),

    // Bestiary actions (Plan 03-05)
    // Note: bestiary-select reads raw dataset.id (string SRD keys must not go through parseEntityId)
    'bestiary-select': ctx => {
        var rawId = ctx.target ? ctx.target.dataset.id : ctx.id;
        var src = ctx.target ? ctx.target.dataset.source : (ctx.source || 'srd');
        if (typeof window.selectBestiary === 'function') window.selectBestiary(rawId, src);
    },
    'bestiary-toggle-fav': ctx => {
        var rawId = ctx.target ? ctx.target.dataset.id : ctx.id;
        var src = ctx.target ? ctx.target.dataset.source : (ctx.source || 'srd');
        if (typeof window.toggleBestiaryFavorite === 'function') window.toggleBestiaryFavorite(rawId, src);
    },
    'bestiary-roll-dice': ctx => {
        var val = ctx.target ? ctx.target.dataset.value : ctx.value;
        if (typeof window.rollQrefDice === 'function') window.rollQrefDice(val);
    },
    'bestiary-add-init': ctx => {
        var rawId = ctx.target ? ctx.target.dataset.id : ctx.id;
        var src = ctx.target ? ctx.target.dataset.source : (ctx.source || 'srd');
        if (typeof window.addBestiaryToInitiative === 'function') window.addBestiaryToInitiative(rawId, src);
    },
    'bestiary-add-enc': ctx => {
        var rawId = ctx.target ? ctx.target.dataset.id : ctx.id;
        var src = ctx.target ? ctx.target.dataset.source : (ctx.source || 'srd');
        if (typeof window.addBestiaryToEncounter === 'function') window.addBestiaryToEncounter(rawId, src);
    },
    'bestiary-delete': ctx => {
        var rawId = ctx.target ? ctx.target.dataset.id : ctx.id;
        if (typeof window.deleteBestiaryEntry === 'function') window.deleteBestiaryEntry(rawId);
    },

    // Session-Prep actions (WELT-01, Plan 05-03)
    'show-session-prep-modal': ctx => {
        if (typeof window.showSessionPrepModal === 'function') window.showSessionPrepModal(null);
    },
    'save-session-prep': ctx => {
        if (typeof window.saveSessionPrep === 'function') window.saveSessionPrep();
    },
    'edit-session-prep': ctx => {
        if (typeof window.editSessionPrep === 'function') window.editSessionPrep(ctx.id);
    },
    'delete-session-prep': ctx => {
        if (typeof window.deleteSessionPrep === 'function') window.deleteSessionPrep(ctx.id);
    },
    'add-szene-card': ctx => {
        var container = document.getElementById('prep-szenen-container');
        if (!container) return;
        var idx = container.querySelectorAll('.wp-szene-item').length;
        if (typeof window.renderSzeneFormular === 'function') {
            container.insertAdjacentHTML('beforeend', window.renderSzeneFormular({ id: idx + 1, titel: '', beschreibung: '', ort: '' }, idx));
        }
    },
    'remove-szene': ctx => {
        var idx = parseInt(ctx.value);
        var container = document.getElementById('prep-szenen-container');
        if (!container) return;
        var items = container.querySelectorAll('.wp-szene-item');
        if (items[idx]) items[idx].remove();
    },
    'add-faden-manual': ctx => {
        var input = document.getElementById('prep-faeden-manuell');
        if (!input || !input.value.trim()) return;
        var container = document.getElementById('prep-faeden-container');
        if (!container) return;
        var text = input.value.trim();
        var html = [
            '<div class="wp-faden-item">',
            '  <input type="hidden" class="wp-faden-quelle-id" value="">',
            '  <input type="hidden" class="wp-faden-quelle-typ" value="manual">',
            '  <input type="text" class="wp-faden-text form-control" value="' + (typeof esc === 'function' ? esc(text) : text) + '">',
            '  <button type="button" class="btn btn-sm wp-faden-remove-btn" data-action="remove-faden" title="Entfernen">×</button>',
            '</div>'
        ].join('');
        container.insertAdjacentHTML('beforeend', html);
        input.value = '';
    },
    'remove-faden': ctx => {
        var item = ctx.target.closest('.wp-faden-item');
        if (item) item.remove();
    },
    'insert-entity-link': ctx => {
        var editorId = ctx.value || (ctx.target && ctx.target.dataset.value);
        if (editorId && typeof window.showInsertEntityLinkModal === 'function') {
            window.showInsertEntityLinkModal(editorId);
        }
    },

    // NPC-Generator-Aktionen (WELT-02)
    'show-npc-generator': () => {
        if (typeof window.showNPCGeneratorModal === 'function') window.showNPCGeneratorModal();
    },
    'reroll-npc': () => {
        if (typeof window.rerollNPC === 'function') window.rerollNPC();
    },
    'save-generated-npc': () => {
        if (typeof window.saveGeneratedNPC === 'function') window.saveGeneratedNPC();
    },

    // Timeline/Kalender-Aktionen (WELT-03)
    'show-timeline-modal': () => {
        if (typeof window.showTimelineModal === 'function') window.showTimelineModal();
    },
    'save-timeline-event': () => {
        if (typeof window.saveTimelineEvent === 'function') window.saveTimelineEvent();
    },
    'delete-timeline-event': ctx => {
        if (typeof window.deleteTimelineEvent === 'function') window.deleteTimelineEvent(ctx.id);
    },
    'close-timeline-modal': () => {
        var modal = document.getElementById('tl-event-modal');
        if (modal) modal.remove();
    },
    'confirm-auto-event': ctx => {
        // Auto-Vorschlag übernehmen: Eintrag mit aktuellem Datum anlegen
        var d = window.D;
        if (!d) return;
        var cal = d.calendar || { day: 1, month: 1, year: 1492 };
        var datum = { tag: parseInt(cal.day, 10) || 1, monat: parseInt(cal.month, 10) || 1, jahr: parseInt(cal.year, 10) || 1492 };
        var typ = ctx.value || 'session';
        var quelleId = ctx.id ? parseInt(ctx.id, 10) || null : null;
        // Titel aus Vorschlag-Karte lesen
        var card = ctx.target ? ctx.target.closest('.tl-vorschlag-card') : null;
        var titelEl = card ? card.querySelector('.tl-vorschlag-titel') : null;
        var titel = titelEl ? titelEl.textContent.trim() : ('Ereignis ' + (quelleId || ''));
        if (typeof window.addCalendarEvent === 'function') {
            window.addCalendarEvent(datum, titel, typ, quelleId);
        }
        // Vorschlag als verworfen markieren (verhindert erneute Anzeige)
        try {
            var dismissed = JSON.parse(sessionStorage.getItem('tl-dismissed-vorschlaege') || '[]');
            dismissed.push(typ + ':' + quelleId);
            sessionStorage.setItem('tl-dismissed-vorschlaege', JSON.stringify(dismissed));
        } catch(e) {}
        if (typeof window.renderTimeline === 'function') window.renderTimeline();
    },
    'dismiss-auto-event': ctx => {
        var typ = ctx.value || 'session';
        var quelleId = ctx.id || '';
        try {
            var dismissed = JSON.parse(sessionStorage.getItem('tl-dismissed-vorschlaege') || '[]');
            dismissed.push(typ + ':' + quelleId);
            sessionStorage.setItem('tl-dismissed-vorschlaege', JSON.stringify(dismissed));
        } catch(e) {}
        if (typeof window.renderTimeline === 'function') window.renderTimeline();
    },

    // Reise-Aktionen (WELT-04)
    'start-reise': () => {
        if (typeof window.startReise === 'function') window.startReise();
    },
    'abschliessen-reise': ctx => {
        var tage = parseInt(ctx.value, 10) || 1;
        if (typeof window.abschliessenReise === 'function') window.abschliessenReise(tage);
    },
    'bestaetigen-reise-timeline': ctx => {
        var tage = parseInt(ctx.value, 10) || 1;
        if (typeof window.bestaetigeReiseTimeline === 'function') window.bestaetigeReiseTimeline(tage);
    },
    'schliessen-reise-timeline-modal': () => {
        var modal = document.getElementById('rs-timeline-modal');
        if (modal) modal.remove();
    },

    // Fraktionen-Aktionen (WELT-05)
    'show-fraktion-modal': ctx => {
        if (typeof window.showFraktionModal === 'function') window.showFraktionModal(ctx.value || null);
    },
    'edit-fraktion': ctx => {
        if (typeof window.showFraktionModal === 'function') window.showFraktionModal(ctx.value || ctx.id);
    },
    'save-fraktion': () => {
        if (typeof window.saveFraktion === 'function') window.saveFraktion();
    },
    'delete-fraktion': ctx => {
        if (typeof window.deleteFraktion === 'function') window.deleteFraktion(ctx.value || ctx.id);
    },
    'select-fraktion': ctx => {
        if (typeof window.selectFraktion === 'function') window.selectFraktion(ctx.value || ctx.id);
    },
    'ruf-plus': ctx => {
        var fraktionId = ctx.value || ctx.id;
        var grundEl = document.getElementById('fr-ruf-grund-' + fraktionId);
        var grund = grundEl ? grundEl.value.trim() : '';
        if (typeof window.anpassenRuf === 'function') window.anpassenRuf(fraktionId, 10, grund);
    },
    'ruf-plus5': ctx => {
        var fraktionId = ctx.value || ctx.id;
        var grundEl = document.getElementById('fr-ruf-grund-' + fraktionId);
        var grund = grundEl ? grundEl.value.trim() : '';
        if (typeof window.anpassenRuf === 'function') window.anpassenRuf(fraktionId, 5, grund);
    },
    'ruf-minus': ctx => {
        var fraktionId = ctx.value || ctx.id;
        var grundEl = document.getElementById('fr-ruf-grund-' + fraktionId);
        var grund = grundEl ? grundEl.value.trim() : '';
        if (typeof window.anpassenRuf === 'function') window.anpassenRuf(fraktionId, -10, grund);
    },
    'ruf-minus5': ctx => {
        var fraktionId = ctx.value || ctx.id;
        var grundEl = document.getElementById('fr-ruf-grund-' + fraktionId);
        var grund = grundEl ? grundEl.value.trim() : '';
        if (typeof window.anpassenRuf === 'function') window.anpassenRuf(fraktionId, -5, grund);
    },
    'ruf-set': ctx => {
        var fraktionId = ctx.value || ctx.id;
        var setEl = document.getElementById('fr-ruf-set-' + fraktionId);
        var grundEl = document.getElementById('fr-ruf-grund-' + fraktionId);
        if (!setEl) return;
        var neuerWert = parseInt(setEl.value);
        if (isNaN(neuerWert)) return;
        var grund = grundEl ? grundEl.value.trim() : '';
        if (typeof window.setzeRuf === 'function') window.setzeRuf(fraktionId, neuerWert, grund || 'Direktes Setzen');
    }
};

// Register all entity actions
if (typeof EventDelegation !== 'undefined') {
    Object.entries(EntityActions).forEach(([name, handler]) => {
        EventDelegation.registerAction(name, handler);
    });
}
