// [SECTION:UI_ACTIONS]
// ============================================================
// UI ACTIONS - @modals @views @toggles @navigation
// ============================================================

const UIActions = {
    // Modal actions
    'show-modal': ctx => showModal(ctx.value),
    'hide-modal': ctx => hideModal(ctx.value),
    'close-modal-overlay': ctx => ctx.target.closest('.modal-overlay')?.remove(),
    'backdrop-close': ctx => {
        if (ctx.event.target === ctx.target) {
            const fn = window[ctx.value];
            if (typeof fn === 'function') fn();
        }
    },

    // View actions
    'show-view': ctx => switchView(ctx.value),
    'toggle-collapse': ctx => toggleCollapse(ctx.value),
    'toggle-layout': () => toggleLayout(),
    'set-view-mode': ctx => setViewMode(ctx.type, ctx.value),
    'toggle-lang-dropdown': () => toggleLangDropdown(),

    // Navigation actions
    'navigate-entity': ctx => navigateToEntityInPlace(ctx.type, ctx.id),
    'navigate-entity-stop': ctx => {
        ctx.event.stopPropagation();
        navigateToEntityInPlace(ctx.type, ctx.id);
    },
    'navigate-result': ctx => {
        const locId = ctx.target.dataset.loc || null;
        navigateToResult(ctx.type, ctx.id, locId === '' ? null : locId);
    },
    'mobile-search-navigate': ctx => {
        hideModal('mobile-search-modal');
        const locId = ctx.target.dataset.loc || null;
        navigateToResult(ctx.type, ctx.id, locId === '' ? null : locId);
    },
    'tag-search-navigate': ctx => {
        hideModal('tag-search-modal');
        navigateToEntityInPlace(ctx.type, ctx.id);
    },
    'go-to-note': ctx => goToNote(ctx.value),

    // Filter actions
    'set-filter': ctx => {
        const filterType = ctx.target.dataset.filterType;
        if (filterType === 'loot') setLootFilter(ctx.value);
        else if (filterType === 'loc') setLocFilter(ctx.value);
        else if (filterType === 'spell') setSpellFilter(ctx.value);
    },
    'clear-search': ctx => {
        const searchRenderMap = {
            'party-search': renderParty,
            'npc-search': renderNPCList,
            'loc-search': renderLocations,
            'quest-search': renderQuests,
            'enc-search': renderEncounters,
            'loot-search': renderLoot,
            'shop-search': renderShops,
            'spell-search': renderSpells,
            'notes-search': renderSessions,
            'wiki-search': renderWiki,
            'link-search': renderLinks
        };
        const renderFn = searchRenderMap[ctx.value];
        if (renderFn) clearSearch(ctx.value, renderFn);
    },

    // Toggle actions
    'toggle-selected': ctx => ctx.target.classList.toggle('selected'),
    'toggle-checked': ctx => ctx.target.classList.toggle('checked'),
    'toggle-parent-expanded': ctx => {
        if (ctx.target.parentElement) ctx.target.parentElement.classList.toggle('expanded');
    },
    'toggle-damage-type': ctx => toggleDamageType(ctx.target),
    'remove-parent': ctx => ctx.target.parentElement?.remove(),
    'remove-field-stop': ctx => {
        ctx.event.stopPropagation();
        ctx.target.closest(ctx.value).remove();
    },

    // Quick Reference actions
    'toggle-quick-ref': () => toggleQuickRef(),
    'toggle-quick-ref-section': ctx => {
        const section = ctx.target.closest('.quick-ref-section') || ctx.target;
        if (!ctx.event.target.closest('.quick-ref-section-content')) {
            section.classList.toggle('expanded');
        }
    },
    'toggle-quick-ref-custom': ctx => toggleQuickRefCustomEntry(ctx.id),
    'edit-quick-ref-entry': ctx => editQuickRefEntry(ctx.id),
    'delete-quick-ref-entry': ctx => deleteQuickRefEntry(ctx.id),
    'add-quick-ref-entry': () => addQuickRefEntry(),
    'qref-tab': ctx => {
        // Switch tabs in new Quick Reference panel
        const tabId = ctx.value;
        document.querySelectorAll('.qref-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.qref-tab-content').forEach(c => c.classList.remove('active'));
        ctx.target.classList.add('active');
        const content = document.getElementById('qref-' + tabId);
        if (content) content.classList.add('active');
        // Update custom empty state visibility
        if (tabId === 'custom') {
            const hasCustom = D.quickRefCustom && D.quickRefCustom.length > 0;
            const emptyEl = document.getElementById('qref-custom-empty');
            if (emptyEl) emptyEl.style.display = hasCustom ? 'none' : 'block';
        }
    },
    'save-quick-ref-entry': () => saveQuickRefEntry(),

    // Quick Reference v2 - New Actions
    'toggle-qref-section': ctx => toggleQrefSection(ctx.target),
    'show-condition-detail': ctx => {
        const condition = ctx.target.closest('.qref-condition')?.dataset.condition;
        if (condition) showConditionDetail(condition);
    },
    'apply-qref-condition': ctx => {
        ctx.event.stopPropagation();
        applyQrefCondition(ctx.value);
    },
    'roll-qref-dice': ctx => {
        const dice = ctx.target.dataset.dice;
        if (dice) rollQrefDice(dice);
    },

    // Tags & Entity Links
    'show-tags-modal': ctx => showTagsModal(ctx.type, ctx.id),
    'show-tags-modal-stop': ctx => {
        ctx.event.stopPropagation();
        showTagsModal(ctx.type, ctx.id);
    },
    'show-entity-links-modal': ctx => showEntityLinksModal(ctx.type, ctx.id),
    'show-entity-links-modal-stop': ctx => {
        ctx.event.stopPropagation();
        showEntityLinksModal(ctx.type, ctx.id);
    },
    'remove-tag': ctx => removeTagFromEntity(ctx.id),
    'remove-entity-link': ctx => removeEntityLink(ctx.id),
    'delete-global-tag': ctx => deleteGlobalTag(parseInt(ctx.value)),
    'add-existing-tag': ctx => {
        const color = ctx.target.dataset.color || 'blue';
        addExistingTagToEntity(ctx.value, color);
    },
    'show-entities-with-tag-stop': ctx => {
        ctx.event.stopPropagation();
        showEntitiesWithTag(ctx.value);
    },
    'remove-relationship-stop': ctx => {
        ctx.event.stopPropagation();
        const sourceType = ctx.target.dataset.sourceType;
        const sourceId = parseInt(ctx.target.dataset.sourceId);
        const targetType = ctx.target.dataset.targetType;
        const targetId = parseInt(ctx.target.dataset.targetId);
        removeRelationship(sourceType, sourceId, targetType, targetId);
    },

    // Avatar
    'show-avatar-modal': ctx => showAvatarModal(ctx.type, ctx.id),

    // Theme
    'set-theme': ctx => setTheme(ctx.value),

    // Shortcuts
    'show-shortcuts': () => showShortcutsOverlay(),
    'show-shortcuts-overlay': () => showShortcutsOverlay(),

    // Quick Notes
    'toggle-quick-notes': () => showQuickNotesModal(),
    'save-and-hide-quick-notes': () => {
        saveQuickNotes();
        hideQuickNotesModal();
    },

    // Campaign
    'switch-campaign': ctx => switchCampaign(ctx.value),

    // Trigger click
    'trigger-click': ctx => {
        const el = $(ctx.value);
        if (el) el.click();
    },

    // Dynamic function call
    call: ctx => {
        const fn = window[ctx.value];
        if (typeof fn === 'function') fn(ctx.id);
        else console.error('[EventDelegation] Function not found:', ctx.value);
    },

    // Search input (generic: calls render function + updateSearchClear)
    'search-input': ctx => {
        const fnName = ctx.target.dataset.render;
        const fn = window[fnName];
        if (typeof fn === 'function') fn();
        if (typeof updateSearchClear === 'function') updateSearchClear(ctx.target);
    },

    // Event Log
    'toggle-event-log': () => toggleEventLog(),
    'clear-event-log': () => clearEventLog()
};

// Register all UI actions
if (typeof EventDelegation !== 'undefined') {
    Object.entries(UIActions).forEach(([name, handler]) => {
        EventDelegation.registerAction(name, handler);
    });
}
