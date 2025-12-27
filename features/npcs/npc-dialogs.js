// ============================================================
// NPC DIALOGS - Dialog-Modal-Funktionen
// ============================================================
// Extrahiert aus features/render-npcs.js

// Globale Counter-Variable für Dialog-Felder
let dialogFieldCounter = 0;

function addDialogField() {
    const container = $('npc-dialogs-container');
    const id = dialogFieldCounter++;
    const editorId = `dialog-text-${id}`;
    const div = document.createElement('div');
    div.id = `dialog-${id}`;
    div.className = 'npc-dialog-field';
    div.style.cssText = 'background: var(--bg-dark); padding: 12px; border-radius: 6px; margin-bottom: 10px; border: 1px solid var(--border);';
    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="color: var(--purple); font-weight: 600; font-size: 0.9em;">💬 Dialog ${id + 1}</span>
            <button type="button" class="btn btn-sm btn-danger" data-action="remove-field-stop" data-value=".npc-dialog-field">✕</button>
        </div>
        <div class="form-group" style="margin-bottom: 8px;">
            <label style="font-size: 0.85em;">Titel (optional)</label>
            <input type="text" class="dialog-title" placeholder="z.B. Begrüßung, Geheimnis enthüllen" style="font-size: 0.9em;">
        </div>
        <div class="form-group" style="margin-bottom: 8px;">
            <label style="font-size: 0.85em;">Trigger-Bedingung (optional)</label>
            <input type="text" class="dialog-trigger" placeholder="z.B. Nach Quest-Abschluss, Wenn vertraut" style="font-size: 0.9em;">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 0.85em;">Dialog-Text *</label>
            <div class="editor-toolbar">
                <button type="button" class="editor-btn" data-action="format-text" data-cmd="${editorId}" data-editor="bold" title="Fett"><b>B</b></button>
                <button type="button" class="editor-btn" data-action="format-text" data-cmd="${editorId}" data-editor="italic" title="Kursiv"><i>I</i></button>
                <button type="button" class="editor-btn" data-action="format-text" data-cmd="${editorId}" data-editor="underline" title="Unterstrichen"><u>U</u></button>
                <button type="button" class="editor-btn" data-action="format-text" data-cmd="${editorId}" data-editor="list" title="Liste">☰</button>
                <button type="button" class="editor-btn" data-action="set-border-format" data-editor="${editorId}" title="Rahmen">◻</button>
                <select class="editor-select" onchange="setEditorFont('${editorId}', this)" title="Schriftart"><option value="arial">Arial</option><option value="serif">Serif</option><option value="mono">Mono</option></select>
                <select class="editor-select" onchange="setEditorFontSize('${editorId}', this)" title="Größe"><option value="0.8em">Klein</option><option value="1em" selected>Normal</option><option value="1.2em">Groß</option><option value="1.5em">Sehr groß</option></select>
                <button type="button" class="editor-btn" data-action="clear-formatting" data-value="${editorId}" title="Formatierung löschen" style="color:#888;">✕</button>
            </div>
            <div id="${editorId}" class="rich-editor dialog-text" contenteditable="true" style="min-height: 80px;" data-placeholder="Was sagt der NPC?"></div>
        </div>
    `;
    container.appendChild(div);

    // Paste-Handler für dieses Feld hinzufügen
    const editor = $(editorId);
    if (editor) editor.addEventListener('paste', handleEditorPaste);
}

function showAddDialogModal(npcId) {
    const npc = EntityLookup.npc(npcId);
    if (!npc) return;

    const html = `
        <div class="modal-header">
            <span class="modal-title">💬 Dialog für ${esc(npc.name)}</span>
            <button class="btn btn-sm" data-action="hide-modal" data-value="quick-dialog-modal">✕</button>
        </div>
        <div class="form-group">
            <label>Titel (optional)</label>
            <input type="text" id="quick-dialog-title" placeholder="z.B. Begrüßung, Warnung">
        </div>
        <div class="form-group">
            <label>Trigger-Bedingung (optional)</label>
            <input type="text" id="quick-dialog-trigger" placeholder="z.B. Nach Quest X, Wenn freundlich">
        </div>
        <div class="form-group">
            <label>Dialog-Text *</label>
            <div class="editor-toolbar">
                <button type="button" class="editor-btn" data-action="format-text" data-cmd="quick-dialog-text" data-editor="bold" title="Fett"><b>B</b></button>
                <button type="button" class="editor-btn" data-action="format-text" data-cmd="quick-dialog-text" data-editor="italic" title="Kursiv"><i>I</i></button>
                <button type="button" class="editor-btn" data-action="format-text" data-cmd="quick-dialog-text" data-editor="underline" title="Unterstrichen"><u>U</u></button>
                <button type="button" class="editor-btn" data-action="format-text" data-cmd="quick-dialog-text" data-editor="list" title="Liste">☰</button>
                <button type="button" class="editor-btn" data-action="set-border-format" data-editor="quick-dialog-text" title="Rahmen">◻</button>
                <select class="editor-select" onchange="setEditorFont('quick-dialog-text', this)" title="Schriftart"><option value="arial">Arial</option><option value="serif">Serif</option><option value="mono">Mono</option></select>
                <select class="editor-select" onchange="setEditorFontSize('quick-dialog-text', this)" title="Größe"><option value="0.8em">Klein</option><option value="1em" selected>Normal</option><option value="1.2em">Groß</option><option value="1.5em">Sehr groß</option></select>
                <button type="button" class="editor-btn" data-action="clear-formatting" data-value="quick-dialog-text" title="Formatierung löschen" style="color:#888;">✕</button>
            </div>
            <div id="quick-dialog-text" class="rich-editor" contenteditable="true" style="min-height: 100px;" data-placeholder="Was sagt der NPC?"></div>
        </div>
        <button class="btn btn-success" data-action="save-quick-dialog" data-id="${npcId}">💾 Speichern</button>
    `;

    // Create modal if not exists
    let modal = $('quick-dialog-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'quick-dialog-modal';
        modal.innerHTML = '<div class="modal" style="max-width: 500px;"></div>';
        document.body.appendChild(modal);
    }

    modal.querySelector('.modal').innerHTML = html;
    showModal('quick-dialog-modal');
}

function saveQuickDialog(npcId) {
    const npc = EntityLookup.npc(npcId);
    if (!npc) return;

    const text = $('quick-dialog-text').innerHTML.trim();
    if (!text) {
        showToast('⚠️ Dialog-Text erforderlich', 'error');
        return;
    }

    if (!npc.dialogs) npc.dialogs = [];

    npc.dialogs.push({
        title: $('quick-dialog-title').value.trim(),
        triggerCondition: $('quick-dialog-trigger').value.trim(),
        text: text,
        used: false
    });

    hideModal('quick-dialog-modal');
    renderNPCList();
    save();
    showToast('Dialog hinzugefügt');
}

function resetDialogFieldCounter() {
    dialogFieldCounter = 0;
}
