// [SECTION:MARKDOWN_IMPORT_EXPORT]
// Markdown Import/Export für Entities
// Zeilen: ~250
// ============================================================
// EXPORT FUNCTIONS
// ============================================================
/**
 * Export entity content as Markdown file
 * @param {string} entityType - Type of entity (spells, npcs, wiki, quests, etc.)
 * @param {number|string} entityId - ID of entity to export
 */
function exportEntityAsMarkdown(entityType, entityId) {
    const htmlToMarkdown = window.htmlToMarkdown;
    const EntityLookup = window.EntityLookup;
    const downloadFile = window.downloadFile;
    const showToast = window.showToast;

    if (!htmlToMarkdown) {
        if (typeof showToast === 'function') {
            showToast('⚠️ Markdown Converter nicht geladen', 'error');
        }
        return;
    }

    // Get entity
    let entity;
    if (entityType === 'spells') {
        entity = EntityLookup.spell(entityId);
    } else if (entityType === 'npcs') {
        entity = EntityLookup.npc(entityId);
    } else if (entityType === 'wiki') {
        entity = EntityLookup.wiki(entityId);
    } else if (entityType === 'quests') {
        entity = EntityLookup.quest(entityId);
    } else if (entityType === 'sessions') {
        entity = EntityLookup.session(entityId);
    }

    if (!entity) {
        if (typeof showToast === 'function') {
            showToast('⚠️ Entity nicht gefunden', 'error');
        }
        return;
    }

    // Convert HTML to Markdown
    let markdown = '';

    // Add title
    markdown += `# ${entity.name || entity.title || 'Unbekannt'}\n\n`;

    // Add metadata based on entity type
    if (entityType === 'spells') {
        markdown += `**Typ:** ${entity.type || 'Zauber'}\n`;
        markdown += `**Stufe:** ${entity.level || 0}\n`;
        markdown += `**Schule:** ${entity.school || 'Unbekannt'}\n`;
        markdown += `**Klassen:** ${(entity.spellClasses || []).join(', ') || 'Keine'}\n\n`;
    } else if (entityType === 'npcs') {
        markdown += `**Typ:** NPC\n`;
        if (entity.race) markdown += `**Rasse:** ${entity.race}\n`;
        if (entity.role) markdown += `**Rolle:** ${entity.role}\n`;
        markdown += '\n';
    } else if (entityType === 'quests') {
        markdown += `**Status:** ${entity.status || 'Offen'}\n`;
        if (entity.giver) markdown += `**Auftraggeber:** ${entity.giver}\n`;
        if (entity.location) markdown += `**Ort:** ${entity.location}\n`;
        markdown += '\n';
    }

    // Add main content
    const contentField = entity.description || entity.content || entity.text || '';
    if (contentField) {
        markdown += htmlToMarkdown(contentField);
        markdown += '\n\n';
    }

    // Add notes if available
    if (entity.note) {
        markdown += '## Notizen\n\n';
        markdown += htmlToMarkdown(entity.note);
        markdown += '\n\n';
    }

    // Generate filename
    const name = entity.name || entity.title || 'entity';
    const sanitizedName = name.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').replace(/\s+/g, '_');
    const filename = `${sanitizedName}.md`;

    // Download file
    if (typeof downloadFile === 'function') {
        downloadFile(filename, markdown);
        if (typeof showToast === 'function') {
            showToast(`📄 ${filename} exportiert`);
        }
    }
}

// ============================================================
// IMPORT FUNCTIONS
// ============================================================
/**
 * Show import modal for entity
 * @param {string} entityType - Type of entity
 * @param {number|string} entityId - ID of entity to import into
 */
function showMarkdownImportModal(entityType, entityId) {
    const showModal = window.showModal;
    const hideModal = window.hideModal;
    const $ = window.$;

    // Create simple modal for file upload
    const modalHtml = `
        <div class="modal" id="markdown-import-modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">📄 Markdown importieren</div>
                    <button class="modal-close" data-action="hide-modal" data-value="markdown-import-modal">×</button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--text-dim); margin-bottom: 12px;">
                        Wähle eine Markdown-Datei (.md) zum Importieren. Der Inhalt ersetzt die aktuelle Beschreibung.
                    </p>
                    <input type="file" id="markdown-import-file" accept=".md,.markdown,.txt" style="margin-bottom: 12px;">
                    <div id="markdown-import-preview" style="max-height: 300px; overflow-y: auto; display: none; padding: 8px; background: var(--bg-elevated); border-radius: 4px; margin-top: 12px;">
                        <div style="color: var(--text-dim); font-size: 0.9em; margin-bottom: 8px;">Vorschau:</div>
                        <div id="markdown-import-preview-content"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" data-action="hide-modal" data-value="markdown-import-modal">Abbrechen</button>
                    <button class="btn btn-primary" id="markdown-import-confirm" disabled>Importieren</button>
                </div>
            </div>
        </div>
    `;

    // Check if modal already exists
    let modal = $('markdown-import-modal');
    if (!modal) {
        // Add modal to body
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        document.body.appendChild(tempDiv.firstElementChild);
        modal = $('markdown-import-modal');
    }

    // Show modal
    if (typeof showModal === 'function') {
        showModal('markdown-import-modal');
    } else {
        modal.style.display = 'flex';
    }

    // Setup file input handler
    const fileInput = $('markdown-import-file');
    const confirmBtn = $('markdown-import-confirm');
    const preview = $('markdown-import-preview');
    const previewContent = $('markdown-import-preview-content');

    let markdownContent = '';

    fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            markdownContent = event.target.result;

            // Show preview
            if (preview && previewContent) {
                const markdownToHtml = window.markdownToHtml;
                if (markdownToHtml) {
                    previewContent.innerHTML = markdownToHtml(markdownContent);
                } else {
                    previewContent.textContent = markdownContent.substring(0, 500) + '...';
                }
                preview.style.display = 'block';
            }

            // Enable confirm button
            if (confirmBtn) {
                confirmBtn.disabled = false;
            }
        };
        reader.readAsText(file);
    });

    // Setup confirm handler
    if (confirmBtn) {
        confirmBtn.onclick = function () {
            if (!markdownContent) return;

            executeMarkdownImport(entityType, entityId, markdownContent);

            // Hide modal
            if (typeof hideModal === 'function') {
                hideModal('markdown-import-modal');
            } else {
                modal.style.display = 'none';
            }
        };
    }
}

/**
 * Execute markdown import for entity
 * @param {string} entityType - Type of entity
 * @param {number|string} entityId - ID of entity
 * @param {string} markdown - Markdown content
 */
function executeMarkdownImport(entityType, entityId, markdown) {
    const markdownToHtml = window.markdownToHtml;
    const D = window.D;
    const save = window.save;
    const showToast = window.showToast;
    const parseEntityId = window.parseEntityId;

    if (!markdownToHtml || !D) return;

    // Convert markdown to HTML
    const html = markdownToHtml(markdown);

    // Find and update entity
    const numId = parseEntityId(entityId);
    let entity;
    let dataArray;

    if (entityType === 'spells') {
        dataArray = D.spells;
        entity = dataArray.find(e => e.id === numId);
        if (entity) entity.description = html;
    } else if (entityType === 'npcs') {
        dataArray = D.npcs;
        entity = dataArray.find(e => e.id === numId);
        if (entity) entity.description = html;
    } else if (entityType === 'wiki') {
        dataArray = D.wiki;
        entity = dataArray.find(e => e.id === numId);
        if (entity) entity.content = html;
    } else if (entityType === 'quests') {
        dataArray = D.quests;
        entity = dataArray.find(e => e.id === numId);
        if (entity) entity.description = html;
    } else if (entityType === 'sessions') {
        dataArray = D.sessionNotes;
        entity = dataArray.find(e => e.id === numId);
        if (entity) entity.text = html;
    }

    // Save and re-render
    if (typeof save === 'function') {
        save();
    }

    if (typeof showToast === 'function') {
        showToast('✅ Markdown importiert');
    }

    // Re-render based on entity type
    if (entityType === 'spells' && typeof window.renderSpells === 'function') {
        window.renderSpells();
    } else if (entityType === 'npcs' && typeof window.renderNPCs === 'function') {
        window.renderNPCs();
    } else if (entityType === 'wiki' && typeof window.renderWikiEntries === 'function') {
        window.renderWikiEntries();
    } else if (entityType === 'quests' && typeof window.renderQuests === 'function') {
        window.renderQuests();
    } else if (entityType === 'sessions' && typeof window.renderSessionNotes === 'function') {
        window.renderSessionNotes();
    }
}

// ============================================================
// EXPORTS
// ============================================================
window.exportEntityAsMarkdown = exportEntityAsMarkdown;
window.showMarkdownImportModal = showMarkdownImportModal;
