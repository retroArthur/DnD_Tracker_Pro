// [SECTION:WIKI_ACTIONS]
// ============================================================
// WIKI ACTIONS - @entries @categories @links
// ============================================================

const WikiActions = {
    // Basic wiki actions
    'edit-wiki': ctx => editWikiEntry(ctx.id),
    'delete-wiki': ctx => deleteWikiEntry(ctx.id),
    'toggle-wiki': ctx => toggleWikiEntry(ctx.id),
    'edit-wiki-stop': ctx => {
        ctx.event.stopPropagation();
        editWikiEntry(ctx.id);
    },
    'delete-wiki-stop': ctx => {
        ctx.event.stopPropagation();
        deleteWikiEntry(ctx.id);
    },
    'toggle-wiki-stop': ctx => {
        ctx.event.stopPropagation();
        toggleWikiEntry(ctx.id);
    },

    // Wiki navigation
    'toggle-wiki-category': ctx => toggleWikiCategory(ctx.value),
    'select-wiki-entry': ctx => selectWikiEntry(ctx.id),
    'toggle-wiki-pin': ctx => toggleWikiPin(ctx.id),
    'toggle-wiki-pin-stop': ctx => {
        ctx.event.stopPropagation();
        toggleWikiPin(ctx.id);
    },
    'search-wiki-tag': ctx => searchWikiTag(ctx.value),
    'navigate-wiki-entry': ctx => navigateToWikiEntry(ctx.value),

    // Wiki links
    'wiki-link-click': ctx => {
        const exists = ctx.target.dataset.exists === 'true';
        if (exists) navigateToWikiEntry(ctx.value);
        else createWikiFromLink(ctx.value);
    },
    'wiki-link-click-stop': ctx => {
        ctx.event.stopPropagation();
        const exists = ctx.target.dataset.exists === 'true';
        if (exists) navigateToWikiEntry(ctx.value);
        else createWikiFromLink(ctx.value);
    },

    // Wiki sorting/filtering
    'sort-wiki': ctx => sortWiki(ctx.value),
    'filter-wiki': ctx => filterWiki(ctx.value),

    // Wiki UX improvements
    'apply-wiki-template': ctx => applyWikiTemplate(ctx.target.dataset.template),
    'wiki-toc-jump': ctx => scrollToTOCHeading(ctx.target.dataset.target),
    'insert-wiki-link-suggestion': ctx => insertWikiLinkSuggestion(ctx.target.dataset.title),

    // Session/Notes actions
    'edit-session': ctx => editSession(ctx.id),
    'delete-session': ctx => deleteSession(ctx.id),
    'toggle-session-content': ctx => toggleSessionContent(ctx.id),
    'toggle-session-tag-filter': ctx => toggleSessionTagFilter(ctx.value),
    'remove-session-tag': ctx => removeSessionTag(ctx.value),
    'add-preset-tag': ctx => addPresetTag(ctx.value),
    'toggle-arc-group': ctx => toggleArcGroup(ctx.id),
    'delete-story-arc': ctx => deleteStoryArc(ctx.id),
    'apply-note-template': ctx => applyNoteTemplate(ctx.value),

    // Link management
    'edit-link': ctx => editLink(ctx.id),
    'delete-link': ctx => deleteLink(ctx.id),

    // Migrated inline handlers
    'render-sessions': () => renderSessions(),
    'wiki-search-input': ctx => {
        renderWikiSearchDropdown(ctx.target.value);
        renderWikiTree();
        if (typeof updateSearchClear === 'function') updateSearchClear(ctx.target);
    },
    'wiki-content-input': ctx => handleWikiContentInput(ctx.event),
    'render-links': () => renderLinks(),
    'render-link-targets': () => renderLinkTargets(),
    'render-insert-link-targets': () => renderInsertLinkTargets()
};

// Register all wiki actions
if (typeof EventDelegation !== 'undefined') {
    Object.entries(WikiActions).forEach(([name, handler]) => {
        EventDelegation.registerAction(name, handler);
    });
}
