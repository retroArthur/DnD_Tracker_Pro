// [SECTION:UNDO]
// ============================================================
// UNDO/REDO SYSTEM - @undo @redo @history
// ============================================================

import { $ } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { validateAndRepairNextId } from '@utils/utilities';

interface UndoState {
    action: string;
    state: string;
    timestamp: number;
}

const undoStack: UndoState[] = [];
const redoStack: UndoState[] = [];

// Alias für Rückwärtskompatibilität
const UNDO_LIMIT = (window as any).APP_CONFIG?.UNDO_LIMIT || 30;

export function pushUndo(action: string): void {
    undoStack.push({
        action,
        state: JSON.stringify((window as any).D),
        timestamp: Date.now()
    });
    if (undoStack.length > UNDO_LIMIT) {
        undoStack.shift();
    }
    // Redo-Stack leeren wenn neue Aktion
    redoStack.length = 0;
}

export function saveUndoState(action: string = 'Änderung'): void {
    pushUndo(action);
}

export function undo(): void {
    if (undoStack.length === 0) {
        showToast('↩️ Nichts zum Rückgängigmachen');
        return;
    }

    const D = (window as any).D;

    // Aktuellen State für Redo sichern
    redoStack.push({
        action: 'Redo',
        state: JSON.stringify(D),
        timestamp: Date.now()
    });
    if (redoStack.length > UNDO_LIMIT) {
        redoStack.shift();
    }

    const last = undoStack.pop()!;
    const safeJSONParse = (window as any).safeJSONParse;
    const parsed = safeJSONParse(last.state);
    if (parsed) {
        // Update window.D by clearing and reassigning properties (D is now const)
        for (const key in D) delete D[key];
        Object.assign(D, parsed);

        // Validate and repair _nextId after restore
        const validation = validateAndRepairNextId();
        if (!validation.valid) {
            console.warn('[undo] Repaired _nextId inconsistencies:', validation.repairs);
        }

        const renderAll = (window as any).renderAll;
        const saveImmediate = (window as any).saveImmediate;
        if (renderAll) renderAll();
        if (saveImmediate) saveImmediate();
        showToast(`↩️ Rückgängig: ${last.action}`);
    } else {
        showToast('❌ Undo fehlgeschlagen', 'error');
    }
}

export function redo(): void {
    if (redoStack.length === 0) {
        showToast('↪️ Nichts zum Wiederholen');
        return;
    }

    const D = (window as any).D;

    // Aktuellen State für Undo sichern
    undoStack.push({
        action: 'Undo',
        state: JSON.stringify(D),
        timestamp: Date.now()
    });

    const last = redoStack.pop()!;
    const safeJSONParse = (window as any).safeJSONParse;
    const parsed = safeJSONParse(last.state);
    if (parsed) {
        // Update window.D by clearing and reassigning properties (D is now const)
        for (const key in D) delete D[key];
        Object.assign(D, parsed);

        // Validate and repair _nextId after restore
        const validation = validateAndRepairNextId();
        if (!validation.valid) {
            console.warn('[redo] Repaired _nextId inconsistencies:', validation.repairs);
        }

        const renderAll = (window as any).renderAll;
        const saveImmediate = (window as any).saveImmediate;
        if (renderAll) renderAll();
        if (saveImmediate) saveImmediate();
        showToast('↪️ Wiederhergestellt');
    } else {
        showToast('❌ Redo fehlgeschlagen', 'error');
    }
}

export function clearUndoHistory(): void {
    undoStack.length = 0;
    redoStack.length = 0;
    showToast('🗑️ Undo-Historie geleert');
}

// ============================================================
// AUTO-SAVE INDIKATOR
// ============================================================
let lastSaveTime = Date.now();
let saveIndicatorTimeout: ReturnType<typeof setTimeout> | null = null;

type SaveStatus = 'saved' | 'saving' | 'error';

export function updateSaveIndicator(status: SaveStatus = 'saved'): void {
    const indicator = $('save-indicator');
    if (!indicator) return;

    indicator.className = 'save-indicator ' + status;
    const textEl = indicator.querySelector('.save-indicator-text');

    if (status === 'saving') {
        if (textEl) textEl.textContent = 'Speichert...';
    } else if (status === 'saved') {
        if (textEl) textEl.textContent = 'Gespeichert';
        lastSaveTime = Date.now();
    } else if (status === 'error') {
        if (textEl) textEl.textContent = 'Fehler!';
    }
}

// ============================================================
// KONFLIKT-ERKENNUNG
// ============================================================
let broadcastChannel: BroadcastChannel | null = null;
let tabId = Math.random().toString(36).substr(2, 9);
let conflictDismissed = false;

interface BroadcastMessage {
    type: string;
    tabId: string;
    campaign: string;
    timestamp: number;
}

export function initConflictDetection(): void {
    try {
        const APP_CONFIG = (window as any).APP_CONFIG;
        broadcastChannel = new BroadcastChannel(APP_CONFIG.BROADCAST_CHANNEL);

        broadcastChannel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
            if (event.data.tabId !== tabId && event.data.campaign === getCurrentStorageKey()) {
                if (event.data.type === 'save' && !conflictDismissed) {
                    showConflictBanner();
                }
            }
        };

        // Bei Speicherung anderen Tabs mitteilen
        window.addEventListener('storage', (e: StorageEvent) => {
            if (e.key === getCurrentStorageKey()) {
                if (!conflictDismissed) {
                    showConflictBanner();
                }
            }
        });
    } catch (e) {
        const log = (window as any).log;
        if (log) log('BroadcastChannel nicht unterstützt, fallback auf localStorage events');
    }
}

export function broadcastSave(): void {
    if (broadcastChannel) {
        broadcastChannel.postMessage({
            type: 'save',
            tabId: tabId,
            campaign: getCurrentStorageKey(),
            timestamp: Date.now()
        });
    }
}

export function showConflictBanner(): void {
    const banner = $('conflict-banner');
    if (banner) {
        banner.classList.add('show');
    }
}

export function dismissConflict(): void {
    const banner = $('conflict-banner');
    if (banner) {
        banner.classList.remove('show');
        conflictDismissed = true;
    }
}

export function reloadData(): void {
    const load = (window as any).load;
    const renderAll = (window as any).renderAll;
    if (load) load();
    if (renderAll) renderAll();
    dismissConflict();
    showToast('🔄 Daten neu geladen');
}

export function getCurrentStorageKey(): string {
    const STORAGE_KEY = (window as any).STORAGE_KEY;
    return (window as any).STORAGE_KEY_OVERRIDE || STORAGE_KEY;
}

// ============================================================
// TASTENKÜRZEL-OVERLAY
// ============================================================
export function showShortcutsOverlay(): void {
    const overlay = $('shortcuts-overlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}

export function hideShortcutsOverlay(): void {
    const overlay = $('shortcuts-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// ============================================================
// CONDITIONS / ZUSTÄNDE HELPER
// ============================================================
export function renderConditionBadges(conditions: string[] = [], exhaustion: number = 0, small: boolean = false): string {
    if (!conditions.length && !exhaustion) return '';

    const CONDITIONS = (window as any).CONDITIONS;
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

// ============================================================
// BEZIEHUNGS-SYSTEM
// ============================================================
interface RelationshipSource {
    type: string;
    id: number;
}

let currentRelationshipSource: RelationshipSource | null = null;

export function showRelationshipsModal(type: string, id: number): void {
    currentRelationshipSource = { type, id };

    const EntityLookup = (window as any).EntityLookup;
    const entity = type === 'character'
        ? EntityLookup.character(id)
        : EntityLookup.npc(id);

    if (!entity) return;

    const sourceNameEl = $('relationship-source-name');
    if (sourceNameEl) sourceNameEl.textContent = `Beziehung für: ${entity.name}`;

    const D = (window as any).D;
    const esc = (window as any).esc;

    // Ziele populieren (alle Charaktere und NPCs außer sich selbst)
    const targets = [
        ...D.characters.filter((c: any) => !(type === 'character' && c.id === id)).map((c: any) => ({ id: c.id, name: c.name, type: 'character' })),
        ...D.npcs.filter((n: any) => !(type === 'npc' && n.id === id)).map((n: any) => ({ id: n.id, name: n.name, type: 'npc' }))
    ];

    const targetEl = $('relationship-target');
    if (targetEl) {
        targetEl.innerHTML = targets.map((t: any) =>
            `<option value="${t.type}:${t.id}">${t.type === 'character' ? '👤' : '🎭'} ${esc(t.name)}</option>`
        ).join('');
    }

    const noteEl = $('relationship-note') as HTMLInputElement;
    if (noteEl) noteEl.value = '';

    const showModal = (window as any).showModal;
    if (showModal) showModal('relationships-modal');
}

export function saveRelationship(): void {
    if (!currentRelationshipSource) return;

    const { type, id } = currentRelationshipSource;
    const targetVal = ($('relationship-target') as HTMLSelectElement)?.value;
    const relType = ($('relationship-type') as HTMLSelectElement)?.value;
    const note = ($('relationship-note') as HTMLInputElement)?.value.trim();

    if (!targetVal) return;

    const [targetType, targetIdStr] = targetVal.split(':');

    const EntityLookup = (window as any).EntityLookup;
    const entity = type === 'character'
        ? EntityLookup.character(id)
        : EntityLookup.npc(id);

    if (!entity) return;

    saveUndoState('Beziehung hinzugefügt');

    entity.relationships = entity.relationships || [];

    // Prüfe ob Beziehung bereits existiert
    const targetId = parseInt(targetIdStr);
    const existing = entity.relationships.find((r: any) => r.targetType === targetType && r.targetId === targetId);
    if (existing) {
        existing.type = relType;
        existing.note = note;
    } else {
        entity.relationships.push({
            targetType,
            targetId,
            type: relType,
            note
        });
    }

    const save = (window as any).save;
    const renderAll = (window as any).renderAll;
    const hideModal = (window as any).hideModal;
    if (save) save();
    if (renderAll) renderAll();
    if (hideModal) hideModal('relationships-modal');
    showToast('🔗 Beziehung gespeichert');
}

export function removeRelationship(sourceType: string, sourceId: number, targetType: string, targetId: number): void {
    const EntityLookup = (window as any).EntityLookup;
    const entity = sourceType === 'character'
        ? EntityLookup.character(sourceId)
        : EntityLookup.npc(sourceId);

    if (!entity || !entity.relationships) return;

    saveUndoState('Beziehung entfernt');
    entity.relationships = entity.relationships.filter((r: any) =>
        !(r.targetType === targetType && r.targetId === targetId)
    );
    const save = (window as any).save;
    const renderAll = (window as any).renderAll;
    if (save) save();
    if (renderAll) renderAll();
}

export function renderRelationshipBadges(relationships: any[] = [], sourceType: string, sourceId: number): string {
    if (!relationships.length) return '';

    const typeLabels: Record<string, string> = {
        ally: '💚 Verbündeter',
        enemy: '❤️ Feind',
        neutral: '🤍 Neutral',
        family: '💕 Familie',
        rival: '🧡 Rivale',
        mentor: '💙 Mentor',
        student: '💜 Schüler'
    };

    const EntityLookup = (window as any).EntityLookup;
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
export function parseMarkdown(text: string): string {
    if (!text) return '';

    const esc = (window as any).esc;
    // ERST escapen, DANN Markdown parsen (XSS-Schutz)
    let escaped = esc(text);

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
export function showNotesSearch(): void {
    const showModal = (window as any).showModal;
    if (showModal) showModal('notes-search-modal');
    setTimeout(() => $('notes-search-input')?.focus(), 100);
}

export function searchNotes(): void {
    const query = ($('notes-search-input') as HTMLInputElement)?.value.toLowerCase().trim();
    const results = $('notes-search-results');

    if (!results) return;

    if (!query || query.length < 2) {
        results.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-dim);">Mindestens 2 Zeichen eingeben.</div>';
        return;
    }

    const D = (window as any).D;
    const matches = (D.sessionNotes || []).filter((note: any) => {
        const content = (note.content || note.text || '').toLowerCase().replace(/<[^>]+>/g, '');
        const name = (note.name || note.title || '').toLowerCase();
        const date = (note.date || '').toLowerCase();
        return content.includes(query) || name.includes(query) || date.includes(query);
    }).slice(0, 20);

    if (matches.length === 0) {
        results.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-dim);">Keine Treffer gefunden.</div>';
        return;
    }

    const esc = (window as any).esc;
    results.innerHTML = matches.map((note: any) => {
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

export function highlightExcerpt(text: string, query: string, maxLength: number = 150): string {
    const esc = (window as any).esc;
    const lowerText = text.toLowerCase();
    const pos = lowerText.indexOf(query.toLowerCase());

    if (pos === -1) return esc(text.substring(0, maxLength)) + '...';

    const start = Math.max(0, pos - 50);
    const end = Math.min(text.length, pos + query.length + 100);
    let excerpt = text.substring(start, end);

    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt = excerpt + '...';

    // Highlight
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return esc(excerpt).replace(regex, '<mark>$1</mark>');
}

export function goToNote(date: string): void {
    const hideModal = (window as any).hideModal;
    const switchView = (window as any).switchView;
    if (hideModal) hideModal('notes-search-modal');
    if (switchView) switchView('notes');
    // Scroll zur Notiz
    setTimeout(() => {
        const noteEl = document.querySelector(`[data-note-date="${date}"]`) as HTMLElement;
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

export function nextEncounterRound(): void {
    saveUndoState('Neue Runde');
    encounterRound++;
    const D = (window as any).D;
    D.initiative.round = encounterRound;

    // Runden-basierte Effekte verarbeiten
    D.initiative.combatants.forEach((c: any) => {
        // Hier könnten automatische Effekte pro Runde verarbeitet werden
        // z.B. Vergiftungsschaden, Regeneration, etc.
    });

    const save = (window as any).save;
    if (save) save();
    updateEncounterDisplay();
    showToast(`⚔️ Runde ${encounterRound}`);
}

export function resetEncounter(): void {
    if (!confirm('Encounter zurücksetzen? Alle Zustände und die Rundenanzahl werden zurückgesetzt.')) return;

    saveUndoState('Encounter Reset');

    const D = (window as any).D;
    encounterRound = 1;
    D.initiative.round = 1;
    D.initiative.currentTurn = 0;

    // Alle temporären Zustände entfernen
    D.initiative.combatants.forEach((c: any) => {
        c.conditions = [];
        c.exhaustion = 0;
        c.tempHp = 0;
        // HP auf Maximum setzen (optional)
        // c.hp = c.hpMax;
    });

    const save = (window as any).save;
    const renderInit = (window as any).renderInit;
    if (save) save();
    if (renderInit) renderInit();
    updateEncounterDisplay();
    showToast('🔄 Encounter zurückgesetzt');
}

export function updateEncounterDisplay(): void {
    const roundEl = document.querySelector('.encounter-round-num');
    if (roundEl) {
        roundEl.textContent = String(encounterRound);
    }
}

// ============================================================
