// [SECTION:EVENT_DELEGATION]
// ============================================================
// EVENT DELEGATION SYSTEM - @click @change @input @action
// ============================================================
const EventDelegation = {
    _handlers: new Map(),
    
    init() {
        // Event listener in CAPTURE-Phase, um Events vor onclick-Handlern abzufangen
        // Dies ist notwendig, weil einige Elemente data-stop-propagation="true" haben
        document.addEventListener('click', (e) => this._handleClick(e), { capture: true, passive: false });
        document.addEventListener('change', (e) => this._handleChange(e), { passive: true });
        document.addEventListener('input', (e) => this._handleInput(e), { passive: true });
        log('[EventDelegation] Initialized (capture mode)');
    },
    
    // Registriere benutzerdefinierte Aktion zur Laufzeit
    registerAction(name, handler) {
        this._handlers.set(name, handler);
    },
    
    _handleClick(e) {
        // Prüfe ob ein Element mit data-stop-propagation im Pfad ist
        const stopPropEl = e.target.closest('[data-stop-propagation="true"]');
        if (stopPropEl && !e.target.closest('[data-action]')) {
            // Stoppe Propagation nur wenn nicht auf ein data-action Element geklickt wurde
            e.stopPropagation();
            return;
        }
        
        // Finde das nächste Element mit data-action
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        // Wenn das target ein data-action hat, verwende es direkt
        // Das data-stop-propagation="true" auf Parent-Containern soll die Buttons nicht blockieren
        
        const action = target.dataset.action;
        const id = target.dataset.id ? parseInt(target.dataset.id) : null;
        const type = target.dataset.type || null;
        const value = target.dataset.value || null;
        
        // Prüfe zuerst registrierte Handler
        if (this._handlers.has(action)) {
            e.preventDefault();
            this._handlers.get(action)({ id, type, value, target, event: e });
            return;
        }
        
        // Eingebaute Aktionen
        const actions = {
            // Character actions
            'edit-char': () => editChar(id),
            'delete-char': () => deleteChar(id),
            'show-char-details': () => showCharacterDetails(id),
            'scroll-to-char': () => scrollToChar(id),
            'update-char-hp': () => updateCharacterHP(id, parseInt(value)),
            
            // NPC actions
            'edit-npc': () => editNPC(id),
            'delete-npc': () => deleteNPC(id),
            'toggle-npc-card': () => toggleNPCCard(id),
            'scroll-to-npc': () => scrollToNPC(id),
            
            // Location actions
            'edit-location': () => editLocation(id),
            'delete-location': () => deleteLocation(id),
            'toggle-location': () => toggleLocation(id),
            
            // Quest actions
            'edit-quest': () => editQuest(id),
            'delete-quest': () => deleteQuest(id),
            'toggle-quest-status': () => toggleQuestStatus(id),
            
            // Encounter actions
            'edit-encounter': () => editEnc(id),
            'delete-encounter': () => deleteEnc(id),
            'load-encounter': () => addEncToInit(id),
            
            // Loot actions
            'edit-loot': () => { e.stopPropagation(); editLoot(id); },
            'delete-loot': () => { e.stopPropagation(); removeLoot(id); },
            'toggle-loot': () => toggleLootItem(id),
            
            // Spell actions
            'edit-spell': () => editSpell(id),
            'delete-spell': () => deleteSpell(id),
            'show-spell-tooltip': () => showSpellTooltip(id, e),
            
            // Initiative actions
            'remove-combatant': () => removeCombatant(id),
            'update-combatant-hp': () => updateInitiativeCombatantHP(id, parseInt(value)),
            'next-turn': () => nextTurn(),
            'prev-turn': () => prevTurn(),
            'sort-initiative': () => sortInit(),
            
            // Wiki actions
            'edit-wiki': () => editWikiEntry(id),
            'delete-wiki': () => deleteWikiEntry(id),
            'toggle-wiki': () => toggleWikiEntry(id),
            
            // Session actions
            'edit-session': () => editSession(id),
            'delete-session': () => deleteSession(id),
            'toggle-session-content': () => toggleSessionContent(id),
            'toggle-session-tag-filter': () => toggleSessionTagFilter(value),
            'remove-session-tag': () => removeSessionTag(value),
            'add-preset-tag': () => addPresetTag(value),
            'toggle-arc-group': () => toggleArcGroup(id),
            'delete-story-arc': () => deleteStoryArc(id),
            
            // Timer actions
            'toggle-timer': () => toggleTimer(id),
            'reset-timer': () => resetTimer(id),
            'delete-timer': () => deleteTimer(id),
            'focus-timer': () => focusTimer(id),
            'quick-timer': () => quickTimer(parseInt(value)),
            
            // Undo/Redo actions
            'undo': () => undo(),
            'redo': () => redo(),
            
            // Generic UI actions
            'show-modal': () => showModal(value),
            'hide-modal': () => hideModal(value),
            'show-view': () => switchView(value),
            'navigate-to-quest': () => {
                switchView('quests');
                setTimeout(() => {
                    const questCard = $(`quest-${id}`);
                    if (questCard) {
                        questCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        questCard.style.boxShadow = '0 0 0 2px var(--gold)';
                        setTimeout(() => questCard.style.boxShadow = '', 2000);
                    }
                }, 100);
            },
            'toggle-collapse': () => toggleCollapse(value),
            'toggle-layout': () => toggleLayout(),
            'show-shortcuts': () => showShortcutsOverlay(),
            'toggle-quick-notes': () => showQuickNotesModal(),
            
            // View-Mode Toggle (Grid/Liste)
            'set-view-mode': () => {
                setViewMode(type, value);
            },
            
            // Filter actions
            'set-filter': () => {
                const filterType = target.dataset.filterType;
                if (filterType === 'loot') setLootFilter(value);
                else if (filterType === 'loc') setLocFilter(value);
                else if (filterType === 'spell') setSpellFilter(value);
            },
            
            // Wiki actions (erweitert)
            'sort-wiki': () => sortWiki(value),
            'filter-wiki': () => filterWiki(value),
            
            // Theme actions
            'set-theme': () => setTheme(value),
            
            // Spell filter actions
            'spell-level-filter': () => setSpellLevelFilter(value),
            'spell-school-filter': () => setSpellSchoolFilter(value),
            
            // Map actions
            'switch-map': () => switchMap(id),
            'zoom-map': () => zoomMap(parseFloat(value)),
            'zoom-mindmap': () => zoomMindmap(parseFloat(value)),
            'set-map-tool': () => setMapTool(value),
            'toggle-map-grid': () => toggleMapGrid(),
            'toggle-map-fog': () => toggleMapFog(),
            'toggle-map-connections': () => toggleMapConnections(),
            'quick-pin': () => handleQuickPin(value),
            'focus-marker': () => focusMarker(id),
            
            // Campaign actions
            'switch-campaign': () => switchCampaign(value),
            
            // Entity navigation
            'navigate-entity': () => navigateToEntityInPlace(type, id),
            
            // Toggle actions für dynamische Elemente
            'toggle-spell-card': () => toggleSpellCard(id),
            'toggle-quest': () => toggleQuest(id),
            'toggle-location-card': () => toggleLocationCard(id),
            'toggle-encounter-card': () => toggleEncounterCard(id),
            'toggle-condition': () => toggleCondition(value),
            
            // Dice actions
            'roll-dice': () => rollDiceAnimated(value),
            'roll-advantage': () => rollAdvantage(),
            'roll-disadvantage': () => rollDisadvantage(),
            'roll-attack': () => rollAttack(),
            'roll-crit-damage': () => rollCritDamage(),
            'roll-saving-throw': () => rollSavingThrow(value),
            'roll-group-perception': () => rollGroupPerception(),
            
            // Editor actions
            'format-text': () => {
                const cmd = target.dataset.cmd || value;
                const editorId = target.dataset.editor;
                formatText(cmd, editorId);
            },
            'clear-formatting': () => clearEditorFormatting(value),
            'set-editor-font': () => {
                const editorId = target.dataset.editor;
                const font = target.dataset.value || value;
                setEditorFont(editorId, font);
            },
            'set-border-format': () => {
                const editorId = target.dataset.editor;
                const style = target.dataset.value || value;
                setBorderFormat(editorId, style);
            },
            
            // Marker actions
            'edit-marker': () => editMarker(id),
            'delete-marker': () => deleteMarker(id),
            
            // Global tag actions
            'delete-global-tag': () => deleteGlobalTag(parseInt(value)),
            
            // Favorite dice actions
            'roll-favorite': () => rollFavoriteDice(id),
            'delete-favorite': () => deleteDiceFavorite(id),
            
            // Modal actions mit type und id
            'show-tags-modal': () => showTagsModal(type, id),
            'show-entity-links-modal': () => showEntityLinksModal(type, id),
            'show-conditions-modal': () => showConditionsModal(type, id),
            'show-avatar-modal': () => showAvatarModal(type, id),
            'show-hp-calculator': () => showHpCalculator(type, id),
            
            // this-basierte Toggle-Actions (verwenden target statt this)
            'toggle-quick-ref-section': () => {
                const section = target.closest('.quick-ref-section') || target;
                if (!e.target.closest('.quick-ref-section-content')) {
                    section.classList.toggle('expanded');
                }
            },
            'toggle-quick-ref-custom': () => {
                toggleQuickRefCustomEntry(id);
            },
            'edit-quick-ref-entry': () => {
                editQuickRefEntry(id);
            },
            'delete-quick-ref-entry': () => {
                deleteQuickRefEntry(id);
            },
            'insert-entity-link-btn': () => {
                const editorId = target.dataset.editor;
                showInsertEntityLinkModal(editorId);
            },
            'toggle-damage-type': () => {
                toggleDamageType(target);
            },
            'toggle-npc-section': () => {
                const content = target.nextElementSibling;
                if (content) {
                    content.classList.toggle('collapsed');
                    // Rotiere den Arrow
                    const arrow = target.querySelector('.npc-section-arrow');
                    if (arrow) {
                        arrow.style.transform = content.classList.contains('collapsed') ? '' : 'rotate(90deg)';
                    }
                }
            },
            'toggle-npc-dialogs': () => {
                const section = target.closest('.npc-dialogs-section');
                const content = section?.querySelector('.npc-dialogs-content');
                const arrow = target.querySelector('span:first-child span:first-child') || target.querySelector('span');
                if (content) {
                    content.classList.toggle('open');
                    // Arrow rotieren
                    if (arrow && arrow.textContent === '▶') {
                        arrow.textContent = content.classList.contains('open') ? '▼' : '▶';
                    }
                }
            },
            'toggle-npc-dialog': () => {
                const dialogItem = target.closest('.npc-dialog-item');
                const body = dialogItem?.querySelector('.npc-dialog-body');
                const expand = target.querySelector('.npc-dialog-expand');
                if (body) {
                    body.classList.toggle('open');
                    if (expand) {
                        expand.classList.toggle('open');
                    }
                }
            },
            'toggle-selected': () => {
                target.classList.toggle('selected');
            },
            'toggle-checked': () => {
                target.classList.toggle('checked');
            },
            'toggle-parent-expanded': () => {
                if (target.parentElement) {
                    target.parentElement.classList.toggle('expanded');
                }
            },
            
            // Node/Mindmap actions
            'select-node-type': () => selectNodeType(value),
            'select-conn-type': () => selectConnType(value),
            
            // Character assignment actions
            'show-assign-spells': () => showAssignSpells(id),
            'show-assign-items': () => showAssignItems(id),
            'show-add-effect': () => showAddEffect(id),
            
            // Filter actions (erweitert)
            'set-loot-filter': () => setLootFilter(value || 'all'),
            'set-loc-filter': () => setLocFilter(id || value),
            'set-spell-filter': () => setSpellFilter(value),
            'set-preset-emoji': () => setPresetEmoji(value),
            
            // Template actions
            'load-monster-template': () => loadMonsterTemplate(value),
            'apply-note-template': () => applyNoteTemplate(value),
            
            // Attribute modifier actions
            'update-attr-mod': () => updateAttrMod(value, target.id),
            'update-enc-attr-mod': () => updateEncAttrMod(value, target.id),
            
            // Roll actions mit Attributen
            'roll-attr-check': () => {
                const modifier = parseInt(target.dataset.value) || 0;
                const attr = target.dataset.attr;
                rollAttrCheck(modifier, attr);
            },
            'roll-char-save': () => {
                const modifier = parseInt(target.dataset.value) || 0;
                const attr = target.dataset.attr;
                rollCharSave(modifier, attr);
            },
            'roll-skill-check': () => {
                const modifier = parseInt(target.dataset.value) || 0;
                const skill = target.dataset.skill;
                rollSkillCheck(modifier, skill);
            },
            'roll-char-initiative': () => {
                const bonus = parseInt(target.dataset.value) || 0;
                const name = target.dataset.name;
                rollCharInitiative(bonus, name);
            },
            
            // Export action
            'export-data': () => exportData(value),
            
            // Quick dialog action
            'save-quick-dialog': () => saveQuickDialog(id),
            
            // Combined actions
            'save-and-hide-quick-notes': () => {
                saveQuickNotes();
                hideQuickNotesModal();
            },
            'show-add-dialog-modal': () => {
                showAddDialogModal(id);
                closeNPCPopup();
            },
            
            // Timer preset actions
            'edit-timer-preset': () => editTimerPreset(id),
            'delete-timer-preset': () => deleteTimerPreset(id),
            
            // Link actions
            'edit-link': () => editLink(id),
            'delete-link': () => deleteLink(id),
            
            // Filter actions
            'delete-filter': () => deleteFilter(id),
            
            // Initiative actions
            'edit-init-value': () => editInitValue(id),
            
            // Tag/Entity actions
            'remove-tag': () => removeTagFromEntity(id),
            'remove-entity-link': () => removeEntityLink(id),
            
            // HP Calculator actions
            'apply-hp-change': () => applyHpChange(value),
            'set-hp-preset': () => { const el = $('hp-calc-value'); if (el) el.value = value; },
            'mod-hp': () => modHp(id, parseInt(value)),
            'roll-attack-crit': () => rollAttack(true),
            
            // Encounter Calculator actions
            'calc-remove-party-level': () => removePartyLevel(parseInt(value)),
            'calc-remove-monster': () => removeMonster(parseInt(value)),
            'calc-load-party': () => loadPartyFromCharacters(),
            'calc-clear-party': () => clearParty(),
            'calc-add-party-level': () => addPartyLevel(),
            'calc-show-encounter-import': () => showEncounterImport(),
            'calc-clear-monsters': () => clearMonsters(),
            'calc-add-monster': () => addMonster(),
            'calc-adjust-difficulty': () => quickAdjustDifficulty(value),
            'calc-save-encounter': () => saveAsEncounter(),
            'calc-import-encounter': () => importEncounterMonsters(value),
            'calc-back-to-calculator': () => renderCalculatorModal(),
            
            // Effect actions
            'add-effect-from-grid': () => addEffectFromGrid(value),
            
            // Shop actions
            'toggle-shop': () => toggleShop(id),
            'edit-shop': () => editShop(id),
            'delete-shop': () => deleteShop(id),
            
            // Quick-Ref actions
            'toggle-quick-ref': () => toggleQuickRef(),
            'add-quick-ref-entry': () => addQuickRefEntry(),
            'save-quick-ref-entry': () => saveQuickRefEntry(),
            
            // UI actions
            'show-shortcuts-overlay': () => showShortcutsOverlay(),
            'show-add-marker-modal': () => { clearMarkerForm(); showModal('map-marker-modal'); },
            'back-to-cart': () => { hideModal('checkout-modal'); showModal('cart-modal'); },
            
            // Character modal actions
            'edit-char-from-modal': () => { hideModal('char-detail-modal'); editChar(id); },
            'show-assign-spells-from-modal': () => { hideModal('char-detail-modal'); showAssignSpells(id); },
            'show-assign-items-from-modal': () => { hideModal('char-detail-modal'); showAssignItems(id); },
            
            // Debug/Test actions
            'generate-test-wiki': () => generateTestWiki(parseInt(value) || 5),
            'generate-test-mindmap': () => generateTestMindmap(parseInt(value) || 10),
            
            // Backdrop-close action (schließt nur wenn direkt auf Backdrop geklickt)
            'backdrop-close': () => {
                if (e.target === target) {
                    const fn = window[value];
                    if (typeof fn === 'function') fn();
                }
            },
            
            // Actions mit stopPropagation (für verschachtelte Elemente)
            'edit-npc-stop': () => { e.stopPropagation(); editNPC(id); },
            'delete-npc-stop': () => { e.stopPropagation(); deleteNPC(id); },
            'edit-enc-stop': () => { e.stopPropagation(); editEnc(id); },
            'delete-enc-stop': () => { e.stopPropagation(); deleteEnc(id); },
            'load-enc-stop': () => { e.stopPropagation(); addEncToInit(id); },
            'edit-wiki-stop': () => { e.stopPropagation(); editWikiEntry(id); },
            'delete-wiki-stop': () => { e.stopPropagation(); deleteWikiEntry(id); },
            'toggle-wiki-pin-stop': () => { e.stopPropagation(); toggleWikiPin(id); },
            'edit-node-stop': () => { e.stopPropagation(); editNode(id); },
            'delete-node-stop': () => { e.stopPropagation(); deleteNodeById(id); },
            'delete-favorite-stop': () => { e.stopPropagation(); deleteDiceFavorite(id); },
            'toggle-quest-tracked-stop': () => { e.stopPropagation(); toggleQuestTracked(id); },
            
            // Neue Navigation/UI Actions mit stopPropagation
            'navigate-entity-stop': () => { e.stopPropagation(); navigateToEntityInPlace(type, id); },
            'show-hp-calculator-stop': () => { e.stopPropagation(); showHpCalculator(type, id); },
            'show-tags-modal-stop': () => { e.stopPropagation(); showTagsModal(type, id); },
            'show-entity-links-modal-stop': () => { e.stopPropagation(); showEntityLinksModal(type, id); },
            'toggle-quest-status-stop': () => { e.stopPropagation(); toggleQuestStatus(id, value); },
            'toggle-npc-trigger-stop': () => { e.stopPropagation(); toggleNPCTrigger(id, parseInt(value)); },
            'toggle-npc-dialog-stop': () => { e.stopPropagation(); toggleNPCDialogUsed(id, parseInt(value)); },
            'copy-dialog-text-stop': () => { e.stopPropagation(); copyDialogText(id, parseInt(value)); },
            'show-add-dialog-modal-stop': () => { e.stopPropagation(); showAddDialogModal(id); },
            'toggle-init-slot-stop': () => { e.stopPropagation(); toggleInitSlot(id, parseInt(value.split(',')[0]), parseInt(value.split(',')[1])); },
            'restore-spell-slots-stop': () => { e.stopPropagation(); restoreAllSpellSlots(id); },
            'remove-condition-stop': () => { e.stopPropagation(); removeCondition(type, id, parseInt(value)); },
            'toggle-spell-slot-stop': () => { e.stopPropagation(); toggleSpellSlot(id, parseInt(value)); },
            'remove-field-stop': () => { e.stopPropagation(); target.closest(value).remove(); },
            
            // ============================================================
            // NEUE MIGRIERTE ACTIONS (v2.7 - onclick Migration)
            // ============================================================
            
            // Entity Navigation
            'go-to-note': () => { goToNote(value); },
            'navigate-result': () => {
                const locId = target.dataset.loc || null;
                navigateToResult(type, id, locId === '' ? null : locId);
            },
            'mobile-search-navigate': () => {
                hideModal('mobile-search-modal');
                const locId = target.dataset.loc || null;
                navigateToResult(type, id, locId === '' ? null : locId);
            },
            'tag-search-navigate': () => {
                hideModal('tag-search-modal');
                navigateToEntityInPlace(type, id);
            },
            
            // Wiki Actions
            'toggle-wiki-category': () => { toggleWikiCategory(value); },
            'select-wiki-entry': () => { selectWikiEntry(id); },
            'toggle-wiki-stop': () => { e.stopPropagation(); toggleWikiEntry(id); },
            'toggle-wiki-pin': () => { toggleWikiPin(id); },
            'search-wiki-tag': () => { searchWikiTag(value); },
            'wiki-link-click': () => {
                const exists = target.dataset.exists === 'true';
                if (exists) { navigateToWikiEntry(value); }
                else { createWikiFromLink(value); }
            },
            'wiki-link-click-stop': () => {
                e.stopPropagation();
                const exists = target.dataset.exists === 'true';
                if (exists) { navigateToWikiEntry(value); }
                else { createWikiFromLink(value); }
            },
            'navigate-wiki-entry': () => { navigateToWikiEntry(value); },
            
            // Shop/Cart Actions
            'cart-qty-decrease': () => {
                const currentQty = parseInt(target.dataset.value) || 1;
                updateCartQty(id, currentQty - 1);
            },
            'cart-qty-increase': () => {
                const currentQty = parseInt(target.dataset.value) || 1;
                updateCartQty(id, currentQty + 1);
            },
            'cart-remove': () => { removeFromCart(id); },
            'show-shop-item-modal': () => { showShopItemModal(id); },
            'toggle-shop-item': () => { toggleShopItem(id, parseInt(value)); },
            'add-to-cart-stop': () => { e.stopPropagation(); addToCart(id, parseInt(value)); },
            'edit-shop-item': () => { editShopItem(id, parseInt(value)); },
            'delete-shop-item': () => { deleteShopItem(id, parseInt(value)); },
            'add-to-cart-qty-stop': () => {
                e.stopPropagation();
                const idx = parseInt(value);
                const qtyInput = $(`si-qty-${id}-${idx}`);
                const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
                addToCart(id, idx, qty);
            },
            
            // NPC Actions
            'show-npc-popup-stop': () => { e.stopPropagation(); showNPCPopup(id, e); },
            'edit-npc-close-popup': () => { editNPC(id); closeNPCPopup(); },
            'view-npc-details': () => {
                closeNPCPopup();
                switchView('view-npcs');
                setTimeout(() => {
                    const card = document.getElementById(`npc-card-${id}`);
                    if (card) card.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            },
            
            // Loot/Spell Actions
            'edit-loot-stop': () => { e.stopPropagation(); editLoot(id); },
            'delete-loot-stop': () => { e.stopPropagation(); removeLoot(id); },
            'remove-loot-tag': () => { removeLootTag(value); },
            'edit-spell-stop': () => { e.stopPropagation(); editSpell(id); },
            'delete-spell-stop': () => { e.stopPropagation(); deleteSpell(id); },
            'remove-parent': () => { target.parentElement?.remove(); },
            
            // Combat Actions
            'remove-effect': () => { removeEffect(id, parseInt(value)); },
            
            // Dice/Timer Actions
            'set-dice-formula': () => {
                const input = $('dice-notation');
                if (input) { input.value = value; rollCustomDice(); }
            },
            'set-dice-history': () => {
                const notation = $('dice-notation');
                const multi = $('dice-multi');
                if (notation) { notation.value = value; }
                if (multi) { multi.value = 1; }
            },
            'roll-skill': () => {
                const mod = parseInt(target.dataset.mod) || 0;
                const skillName = target.dataset.name || '';
                rollSkillCheck(value, mod, skillName);
            },
            'add-preset-timer': () => {
                const duration = parseInt(target.dataset.duration) || 0;
                addPresetTimer(value, duration);
            },
            
            // Tags/Conditions Actions
            'add-existing-tag': () => {
                const color = target.dataset.color || 'blue';
                addExistingTagToEntity(value, color);
            },
            'show-entities-with-tag-stop': () => { e.stopPropagation(); showEntitiesWithTag(value); },
            
            // Relationship Actions
            'remove-relationship-stop': () => {
                e.stopPropagation();
                const sourceType = target.dataset.sourceType;
                const sourceId = parseInt(target.dataset.sourceId);
                const targetType = target.dataset.targetType;
                const targetId = parseInt(target.dataset.targetId);
                removeRelationship(sourceType, sourceId, targetType, targetId);
            },
            
            // Assign Actions
            'change-assign-qty': () => { changeAssignItemQty(id, parseInt(value) || 0); },
            
            // System/Modal Actions
            'close-modal-overlay': () => { target.closest('.modal-overlay')?.remove(); },
            'execute-import': () => { executeImport(value); },
            'reload-page': () => { location.reload(); },
            'clear-error-log': () => { ErrorHandler.clearLog(); showErrorLogModal(); },
            'restore-backup': () => { restoreBackup(id); hideModal('backups-modal'); },
            
            // File input trigger
            'trigger-click': () => {
                const el = $(value);
                if (el) el.click();
            },
            
            // Modal-Aktionen
            'show-modal': () => {
                showModal(value);
            },
            
            'hide-modal': () => {
                hideModal(value);
            },
            
            // Such-Clear-Aktion mit vordefinierten Render-Funktionen
            'clear-search': () => {
                const searchRenderMap = {
                    'party-search': renderParty,
                    'npc-search': renderNPCList,
                    'loc-search': renderLocations,
                    'mindmap-search': filterMindmapNodes,
                    'quest-search': renderQuests,
                    'encounter-search': renderEncounters,
                    'loot-search': renderLoot,
                    'shop-search': renderShops,
                    'spell-search': renderSpells,
                    'notes-search': renderSessions,
                    'wiki-search': renderWiki,
                    'link-search': renderLinks
                };
                const renderFn = searchRenderMap[value];
                if (renderFn) {
                    clearSearch(value, renderFn);
                }
            },
            
            // Export-Aktionen
            'export-json': () => {
                exportData(value);
            },
            
            'export-csv': () => {
                exportDataCSV(value);
            },
            
            // Dynamische Funktionsaufrufe (Fallback für nicht-registrierte Aktionen)
            'call': () => {
                const fn = window[value];
                if (typeof fn === 'function') {
                    fn(id);
                } else {
                    console.error('[EventDelegation] Function not found:', value);
                }
            }
        };
        
        if (actions[action]) {
            e.preventDefault();
            e.stopPropagation(); // Verhindert, dass das Event an Parent-Elemente mit data-action weitergegeben wird
            
            // Sichere Ausführung der Action
            try {
                actions[action]();
            } catch (actionError) {
                // Fehler loggen aber App nicht crashen lassen
                if (typeof ErrorHandler !== 'undefined') {
                    ErrorHandler.log('EventDelegation', actionError, `Action: ${action}`);
                } else {
                    console.error(`[EventDelegation] Fehler in Action "${action}":`, actionError);
                }
            }
        }
    },
    
    _handleChange(e) {
        const target = e.target;
        if (!target.dataset.onChange) return;
        
        const fn = window[target.dataset.onChange];
        if (typeof fn === 'function') {
            try {
                fn(target);
            } catch (changeError) {
                if (typeof ErrorHandler !== 'undefined') {
                    ErrorHandler.log('EventDelegation', changeError, `onChange: ${target.dataset.onChange}`);
                } else {
                    console.error('[EventDelegation] onChange Fehler:', changeError);
                }
            }
        }
    },
    
    _handleInput(e) {
        const target = e.target;
        if (!target.dataset.onInput) return;
        
        const fn = window[target.dataset.onInput];
        if (typeof fn === 'function') {
            try {
                fn(target);
            } catch (inputError) {
                if (typeof ErrorHandler !== 'undefined') {
                    ErrorHandler.log('EventDelegation', inputError, `onInput: ${target.dataset.onInput}`);
                } else {
                    console.error('[EventDelegation] onInput Fehler:', inputError);
                }
            }
        }
    }
};

// ============================================================