// [SECTION:UNDO]
// ============================================================
// UNDO/REDO SYSTEM - @undo @redo @history
// ============================================================
const undoStack = [];
const redoStack = [];
// Alias für Rückwärtskompatibilität
const UNDO_LIMIT = window.APP_CONFIG?.UNDO_LIMIT || 30;
function pushUndo(action) {
    undoStack.push({
        action,
        state: JSON.stringify(window.D),
        timestamp: Date.now()
    });
    if (undoStack.length > UNDO_LIMIT) {
        undoStack.shift();
    }
    // Redo-Stack leeren wenn neue Aktion
    redoStack.length = 0;
}
function saveUndoState(action = 'Änderung') {
    pushUndo(action);
}
function undo() {
    if (undoStack.length === 0) {
        showToast('↩️ Nichts zum Rückgängigmachen');
        return;
    }
    const D = window.D;
    // Aktuellen State für Redo sichern
    redoStack.push({
        action: 'Redo',
        state: JSON.stringify(D),
        timestamp: Date.now()
    });
    if (redoStack.length > UNDO_LIMIT) {
        redoStack.shift();
    }
    const last = undoStack.pop();
    const safeJSONParse = window.safeJSONParse;
    const parsed = safeJSONParse(last.state);
    if (parsed) {
        // Update window.D by clearing and reassigning properties (D is now const)
        for (const key in D)
            delete D[key];
        Object.assign(D, parsed);
        // Validate and repair _nextId after restore
        const validation = validateAndRepairNextId();
        if (!validation.valid) {
            console.warn('[undo] Repaired _nextId inconsistencies:', validation.repairs);
        }
        const renderAll = window.renderAll;
        const saveImmediate = window.saveImmediate;
        if (renderAll)
            renderAll();
        if (saveImmediate)
            saveImmediate();
        showToast(`↩️ Rückgängig: ${last.action}`);
    }
    else {
        showToast('❌ Undo fehlgeschlagen', 'error');
    }
}
function redo() {
    if (redoStack.length === 0) {
        showToast('↪️ Nichts zum Wiederholen');
        return;
    }
    const D = window.D;
    // Aktuellen State für Undo sichern
    undoStack.push({
        action: 'Undo',
        state: JSON.stringify(D),
        timestamp: Date.now()
    });
    const last = redoStack.pop();
    const safeJSONParse = window.safeJSONParse;
    const parsed = safeJSONParse(last.state);
    if (parsed) {
        // Update window.D by clearing and reassigning properties (D is now const)
        for (const key in D)
            delete D[key];
        Object.assign(D, parsed);
        // Validate and repair _nextId after restore
        const validation = validateAndRepairNextId();
        if (!validation.valid) {
            console.warn('[redo] Repaired _nextId inconsistencies:', validation.repairs);
        }
        const renderAll = window.renderAll;
        const saveImmediate = window.saveImmediate;
        if (renderAll)
            renderAll();
        if (saveImmediate)
            saveImmediate();
        showToast('↪️ Wiederhergestellt');
    }
    else {
        showToast('❌ Redo fehlgeschlagen', 'error');
    }
}
function clearUndoHistory() {
    undoStack.length = 0;
    redoStack.length = 0;
    showToast('🗑️ Undo-Historie geleert');
}
// ============================================================
// AUTO-SAVE INDIKATOR
// ============================================================
let lastSaveTime = Date.now();
const saveIndicatorTimeout = null;
function updateSaveIndicator(status = 'saved') {
    const indicator = $('save-indicator');
    if (!indicator)
        return;
    indicator.className = 'save-indicator ' + status;
    const textEl = indicator.querySelector('.save-indicator-text');
    if (status === 'saving') {
        if (textEl)
            textEl.textContent = 'Speichert...';
    }
    else if (status === 'saved') {
        if (textEl)
            textEl.textContent = 'Gespeichert';
        lastSaveTime = Date.now();
    }
    else if (status === 'error') {
        if (textEl)
            textEl.textContent = 'Fehler!';
    }
}
// ============================================================
// KONFLIKT-ERKENNUNG
// ============================================================
let broadcastChannel = null;
const tabId = Math.random().toString(36).substr(2, 9);
let conflictDismissed = false;
function initConflictDetection() {
    try {
        const APP_CONFIG = window.APP_CONFIG;
        broadcastChannel = new BroadcastChannel(APP_CONFIG.BROADCAST_CHANNEL);
        broadcastChannel.onmessage = (event) => {
            if (event.data.tabId !== tabId && event.data.campaign === getCurrentStorageKey()) {
                if (event.data.type === 'save' && !conflictDismissed) {
                    showConflictBanner();
                }
            }
        };
        // Bei Speicherung anderen Tabs mitteilen
        window.addEventListener('storage', (e) => {
            if (e.key === getCurrentStorageKey()) {
                if (!conflictDismissed) {
                    showConflictBanner();
                }
            }
        });
    }
    catch (e) {
        const log = window.log;
        if (log)
            log('BroadcastChannel nicht unterstützt, fallback auf localStorage events');
    }
}
function broadcastSave() {
    if (broadcastChannel) {
        broadcastChannel.postMessage({
            type: 'save',
            tabId: tabId,
            campaign: getCurrentStorageKey(),
            timestamp: Date.now()
        });
    }
}
function showConflictBanner() {
    const banner = $('conflict-banner');
    if (banner) {
        banner.classList.add('show');
    }
}
function dismissConflict() {
    const banner = $('conflict-banner');
    if (banner) {
        banner.classList.remove('show');
        conflictDismissed = true;
    }
}
function reloadData() {
    const load = window.load;
    const renderAll = window.renderAll;
    if (load)
        load();
    if (renderAll)
        renderAll();
    dismissConflict();
    showToast('🔄 Daten neu geladen');
}
function getCurrentStorageKey() {
    const STORAGE_KEY = window.STORAGE_KEY;
    return window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
}
// ============================================================
// TASTENKÜRZEL-OVERLAY
// ============================================================
function showShortcutsOverlay() {
    const overlay = $('shortcuts-overlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}
function hideShortcutsOverlay() {
    const overlay = $('shortcuts-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}
// ============================================================
// CONDITIONS / ZUSTÄNDE HELPER
// ============================================================
function renderConditionBadges(conditions = [], exhaustion = 0, small = false) {
    if (!conditions.length && !exhaustion)
        return '';
    const CONDITIONS = window.CONDITIONS;
    let html = '<div class="conditions-bar">';
    conditions.forEach(key => {
        const cond = CONDITIONS[key];
        if (cond) {
            html += `<span class="condition-badge ${key} active" title="${cond.name}: ${cond.desc}">${cond.icon}</span>`;
        }
    });
    if (exhaustion > 0) {
        html += `<span class="condition-badge exhaustion active" title="Erschöpfung Stufe ${exhaustion}">${CONDITIONS.exhaustion.icon}${exhaustion}</span>`;
    }
    html += '</div>';
    return html;
}
let currentRelationshipSource = null;
function showRelationshipsModal(type, id) {
    currentRelationshipSource = { type, id };
    const EntityLookup = window.EntityLookup;
    const entity = type === 'character'
        ? EntityLookup.character(id)
        : EntityLookup.npc(id);
    if (!entity)
        return;
    const sourceNameEl = $('relationship-source-name');
    if (sourceNameEl)
        sourceNameEl.textContent = `Beziehung für: ${entity.name}`;
    const D = window.D;
    const esc = window.esc;
    // Ziele populieren (alle Charaktere und NPCs außer sich selbst)
    const targets = [
        ...D.characters.filter((c) => !(type === 'character' && c.id === id)).map((c) => ({ id: c.id, name: c.name, type: 'character' })),
        ...D.npcs.filter((n) => !(type === 'npc' && n.id === id)).map((n) => ({ id: n.id, name: n.name, type: 'npc' }))
    ];
    const targetEl = $('relationship-target');
    if (targetEl) {
        targetEl.innerHTML = targets.map((t) => `<option value="${t.type}:${t.id}">${t.type === 'character' ? '👤' : '🎭'} ${esc(t.name)}</option>`).join('');
    }
    const noteEl = $('relationship-note');
    if (noteEl)
        noteEl.value = '';
    const showModal = window.showModal;
    if (showModal)
        showModal('relationships-modal');
}
function saveRelationship() {
    if (!currentRelationshipSource)
        return;
    const { type, id } = currentRelationshipSource;
    const targetVal = $('relationship-target')?.value;
    const relType = $('relationship-type')?.value;
    const note = $('relationship-note')?.value.trim();
    if (!targetVal)
        return;
    const [targetType, targetIdStr] = targetVal.split(':');
    const EntityLookup = window.EntityLookup;
    const entity = type === 'character'
        ? EntityLookup.character(id)
        : EntityLookup.npc(id);
    if (!entity)
        return;
    saveUndoState('Beziehung hinzugefügt');
    entity.relationships = entity.relationships || [];
    // Prüfe ob Beziehung bereits existiert
    const targetId = parseInt(targetIdStr);
    const existing = entity.relationships.find((r) => r.targetType === targetType && r.targetId === targetId);
    if (existing) {
        existing.type = relType;
        existing.note = note;
    }
    else {
        entity.relationships.push({
            targetType,
            targetId,
            type: relType,
            note
        });
    }
    const save = window.save;
    const renderAll = window.renderAll;
    const hideModal = window.hideModal;
    if (save)
        save();
    if (renderAll)
        renderAll();
    if (hideModal)
        hideModal('relationships-modal');
    showToast('🔗 Beziehung gespeichert');
}
function removeRelationship(sourceType, sourceId, targetType, targetId) {
    const EntityLookup = window.EntityLookup;
    const entity = sourceType === 'character'
        ? EntityLookup.character(sourceId)
        : EntityLookup.npc(sourceId);
    if (!entity || !entity.relationships)
        return;
    saveUndoState('Beziehung entfernt');
    entity.relationships = entity.relationships.filter((r) => !(r.targetType === targetType && r.targetId === targetId));
    const save = window.save;
    const renderAll = window.renderAll;
    if (save)
        save();
    if (renderAll)
        renderAll();
}
function renderRelationshipBadges(relationships = [], sourceType, sourceId) {
    if (!relationships.length)
        return '';
    const typeLabels = {
        ally: '💚 Verbündeter',
        enemy: '❤️ Feind',
        neutral: '🤍 Neutral',
        family: '💕 Familie',
        rival: '🧡 Rivale',
        mentor: '💙 Mentor',
        student: '💜 Schüler'
    };
    const EntityLookup = window.EntityLookup;
    let html = '<div class="relationships-section"><small style="color: var(--text-dim);">Beziehungen:</small><div style="margin-top: 4px;">';
    relationships.forEach(rel => {
        const target = rel.targetType === 'character'
            ? EntityLookup.character(rel.targetId)
            : EntityLookup.npc(rel.targetId);
        const targetName = target?.name || '?';
        html += `<span class="relationship-badge ${rel.type}" title="${rel.note || typeLabels[rel.type]}">${targetName} <span data-action="remove-relationship-stop" data-source-type="${sourceType}" data-source-id="${sourceId}" data-target-type="${rel.targetType}" data-target-id="${rel.targetId}" style="cursor:pointer;opacity:0.6;">✕</span></span>`;
    });
    html += '</div></div>';
    return html;
}
// ============================================================
// MARKDOWN SUPPORT
// ============================================================
function parseMarkdown(text) {
    if (!text)
        return '';
    const esc = window.esc;
    // ERST escapen, DANN Markdown parsen (XSS-Schutz)
    const escaped = esc(text);
    return escaped
        // Headers
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        // Code
        .replace(/`(.+?)`/g, '<code>$1</code>')
        // Blockquote (escaped > becomes &gt;)
        .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
        // Lists
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        // Line breaks
        .replace(/\n/g, '<br>')
        // HR
        .replace(/---/g, '<hr>');
}
// ============================================================
// NOTIZEN-SUCHE
// ============================================================
function showNotesSearch() {
    const showModal = window.showModal;
    if (showModal)
        showModal('notes-search-modal');
    setTimeout(() => $('notes-search-input')?.focus(), 100);
}
function searchNotes() {
    const query = $('notes-search-input')?.value.toLowerCase().trim();
    const results = $('notes-search-results');
    if (!results)
        return;
    if (!query || query.length < 2) {
        results.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-dim);">Mindestens 2 Zeichen eingeben.</div>';
        return;
    }
    const D = window.D;
    const matches = (D.sessionNotes || []).filter((note) => {
        const content = (note.content || note.text || '').toLowerCase().replace(/<[^>]+>/g, '');
        const name = (note.name || note.title || '').toLowerCase();
        const date = (note.date || '').toLowerCase();
        return content.includes(query) || name.includes(query) || date.includes(query);
    }).slice(0, 20);
    if (matches.length === 0) {
        results.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-dim);">Keine Treffer gefunden.</div>';
        return;
    }
    const esc = window.esc;
    results.innerHTML = matches.map((note) => {
        const content = note.content || note.text || '';
        const excerpt = highlightExcerpt(content.replace(/<[^>]+>/g, ''), query, 150);
        const name = note.name || note.title || '';
        return `
            <div class="notes-search-result" data-action="go-to-note" data-value="${note.date}">
                <div class="notes-search-date">${note.date}${name ? ' - ' + esc(name) : ''}</div>
                <div class="notes-search-excerpt">${excerpt}</div>
            </div>
        `;
    }).join('');
}
function highlightExcerpt(text, query, maxLength = 150) {
    const esc = window.esc;
    const lowerText = text.toLowerCase();
    const pos = lowerText.indexOf(query.toLowerCase());
    if (pos === -1)
        return esc(text.substring(0, maxLength)) + '...';
    const start = Math.max(0, pos - 50);
    const end = Math.min(text.length, pos + query.length + 100);
    let excerpt = text.substring(start, end);
    if (start > 0)
        excerpt = '...' + excerpt;
    if (end < text.length)
        excerpt = excerpt + '...';
    // Highlight
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return esc(excerpt).replace(regex, '<mark>$1</mark>');
}
function goToNote(date) {
    const hideModal = window.hideModal;
    const switchView = window.switchView;
    if (hideModal)
        hideModal('notes-search-modal');
    if (switchView)
        switchView('notes');
    // Scroll zur Notiz
    setTimeout(() => {
        const noteEl = document.querySelector(`[data-note-date="${date}"]`);
        if (noteEl) {
            noteEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            noteEl.style.boxShadow = '0 0 0 2px var(--gold)';
            setTimeout(() => noteEl.style.boxShadow = '', 2000);
        }
    }, 100);
}
// ============================================================
// ENCOUNTER RESET / RUNDEN-SYSTEM
// ============================================================
let encounterRound = 1;
function nextEncounterRound() {
    saveUndoState('Neue Runde');
    encounterRound++;
    const D = window.D;
    D.initiative.round = encounterRound;
    // Runden-basierte Effekte verarbeiten
    D.initiative.combatants.forEach((c) => {
        // Hier könnten automatische Effekte pro Runde verarbeitet werden
        // z.B. Vergiftungsschaden, Regeneration, etc.
    });
    const save = window.save;
    if (save)
        save();
    updateEncounterDisplay();
    showToast(`⚔️ Runde ${encounterRound}`);
}
function resetEncounter() {
    if (!confirm('Encounter zurücksetzen? Alle Zustände und die Rundenanzahl werden zurückgesetzt.'))
        return;
    saveUndoState('Encounter Reset');
    const D = window.D;
    encounterRound = 1;
    D.initiative.round = 1;
    D.initiative.currentTurn = 0;
    // Alle temporären Zustände entfernen
    D.initiative.combatants.forEach((c) => {
        c.conditions = [];
        c.exhaustion = 0;
        c.tempHp = 0;
        // HP auf Maximum setzen (optional)
        // c.hp = c.hpMax;
    });
    const save = window.save;
    const renderInit = window.renderInit;
    if (save)
        save();
    if (renderInit)
        renderInit();
    updateEncounterDisplay();
    showToast('🔄 Encounter zurückgesetzt');
}
function updateEncounterDisplay() {
    const roundEl = document.querySelector('.encounter-round-num');
    if (roundEl) {
        roundEl.textContent = String(encounterRound);
    }
}
// ============================================================
