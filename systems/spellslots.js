// [SECTION:SPELLSLOTS]
// CHARAKTER ZAUBERSLOTS SYSTEM - @spells @slots @caster
// ============================================================

/**
 * Zauberslot-Tabelle für Vollzauberer (Wizard, Cleric, Druid, Bard, Sorcerer)
 * Index = Charakterstufe, Werte = [1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th]
 * @type {Object.<number, number[]>}
 */
const SPELL_SLOT_TABLE = Object.freeze({
    // [Level]: [1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th]
    1: [2,0,0,0,0,0,0,0,0],
    2: [3,0,0,0,0,0,0,0,0],
    3: [4,2,0,0,0,0,0,0,0],
    4: [4,3,0,0,0,0,0,0,0],
    5: [4,3,2,0,0,0,0,0,0],
    6: [4,3,3,0,0,0,0,0,0],
    7: [4,3,3,1,0,0,0,0,0],
    8: [4,3,3,2,0,0,0,0,0],
    9: [4,3,3,3,1,0,0,0,0],
    10: [4,3,3,3,2,0,0,0,0],
    11: [4,3,3,3,2,1,0,0,0],
    12: [4,3,3,3,2,1,0,0,0],
    13: [4,3,3,3,2,1,1,0,0],
    14: [4,3,3,3,2,1,1,0,0],
    15: [4,3,3,3,2,1,1,1,0],
    16: [4,3,3,3,2,1,1,1,0],
    17: [4,3,3,3,2,1,1,1,1],
    18: [4,3,3,3,3,1,1,1,1],
    19: [4,3,3,3,3,2,1,1,1],
    20: [4,3,3,3,3,2,2,1,1]
});

/**
 * Zauberslot-Tabelle für Halbzauberer (Paladin, Ranger)
 * Slots beginnen bei Level 2
 * @type {Object.<number, number[]>}
 */
const HALF_CASTER_TABLE = Object.freeze({
    2: [2,0,0,0,0], 3: [3,0,0,0,0], 4: [3,0,0,0,0], 5: [4,2,0,0,0],
    6: [4,2,0,0,0], 7: [4,3,0,0,0], 8: [4,3,0,0,0], 9: [4,3,2,0,0],
    10: [4,3,2,0,0], 11: [4,3,3,0,0], 12: [4,3,3,0,0], 13: [4,3,3,1,0],
    14: [4,3,3,1,0], 15: [4,3,3,2,0], 16: [4,3,3,2,0], 17: [4,3,3,3,1],
    18: [4,3,3,3,1], 19: [4,3,3,3,2], 20: [4,3,3,3,2]
});

/**
 * Zauberslot-Tabelle für Drittelzauberer (Eldritch Knight, Arcane Trickster)
 * Slots beginnen bei Level 3
 * @type {Object.<number, number[]>}
 */
const THIRD_CASTER_TABLE = Object.freeze({
    3: [2,0,0,0], 4: [3,0,0,0], 7: [4,2,0,0], 10: [4,3,0,0],
    13: [4,3,2,0], 16: [4,3,3,0], 19: [4,3,3,1]
});

/**
 * Zuordnung von Klassen zu Zauberwirker-Typen
 * @type {Object.<string, string[]>}
 */
const CASTER_CLASSES = Object.freeze({
    full: ['Magier', 'Kleriker', 'Druide', 'Barde', 'Zauberer', 'Hexenmeister', 'Wizard', 'Cleric', 'Druid', 'Sorcerer', 'Warlock'],
    half: ['Paladin', 'Waldläufer', 'Ranger'],
    third: ['Kämpfer', 'Schurke', 'Fighter', 'Rogue'] // Subklassen-abhängig
});

/**
 * Ermittelt die verfügbaren Zauberslots für eine Klasse und Stufe
 * @param {string} characterClass - Klasse des Charakters
 * @param {number} level - Charakterstufe (1-20)
 * @returns {number[]} Array mit Anzahl Slots pro Zauberstufe
 */
function getSpellSlotsForClass(characterClass, level) {
    const cls = (characterClass || '').toLowerCase();
    
    // Volle Zauberwirker
    if (CASTER_CLASSES.full.some(c => cls.includes(c.toLowerCase()))) {
        return SPELL_SLOT_TABLE[level] || [0,0,0,0,0,0,0,0,0];
    }
    
    // Halbe Zauberwirker
    if (CASTER_CLASSES.half.some(c => cls.includes(c.toLowerCase()))) {
        return HALF_CASTER_TABLE[level] || [0,0,0,0,0];
    }
    
    // Für Kämpfer/Schurke - könnte Subklasse sein
    if (CASTER_CLASSES.third.some(c => cls.includes(c.toLowerCase()))) {
        return THIRD_CASTER_TABLE[level] || [0,0,0,0];
    }
    
    // Nicht-Zauberwirker oder unbekannt - leere Slots
    return [0,0,0,0,0,0,0,0,0];
}

// ============================================================
// NOTIZEN TEMPLATES
// ============================================================
const NOTE_TEMPLATES = {
    kampf: `<h3>⚔️ Kampfbericht</h3>
<p><b>Ort:</b> </p>
<p><b>Gegner:</b> </p>
<h4>Verlauf</h4>
<ul><li></li></ul>
<h4>Beute</h4>
<ul><li></li></ul>
<h4>Notizen</h4>
<p></p>`,

    sozial: `<h3>💬 Soziale Begegnung</h3>
<p><b>NPCs:</b> </p>
<p><b>Ort:</b> </p>
<h4>Gespräch</h4>
<blockquote></blockquote>
<h4>Ergebnisse</h4>
<ul><li></li></ul>
<h4>Offene Fragen</h4>
<ul><li></li></ul>`,

    exploration: `<h3>🗺️ Exploration</h3>
<p><b>Ort:</b> </p>
<p><b>Entdeckungen:</b></p>
<h4>Beschreibung</h4>
<p></p>
<h4>Gefundene Hinweise</h4>
<ul><li></li></ul>
<h4>Nächste Schritte</h4>
<ul><li></li></ul>`,

    rast: `<h3>🏕️ Rast</h3>
<p><b>Typ:</b> Kurze Rast / Lange Rast</p>
<p><b>Ort:</b> </p>
<h4>Aktivitäten während der Rast</h4>
<ul><li></li></ul>
<h4>Heilung</h4>
<ul><li></li></ul>
<h4>Ereignisse</h4>
<p></p>`,

    einkauf: `<h3>🛒 Einkauf & Handel</h3>
<p><b>Händler:</b> </p>
<p><b>Ort:</b> </p>
<h4>Gekauft</h4>
<table style="width:100%; border-collapse: collapse;"><tr><th style="border: 1px solid var(--border); padding: 4px;">Item</th><th style="border: 1px solid var(--border); padding: 4px;">Preis</th></tr><tr><td style="border: 1px solid var(--border); padding: 4px;"></td><td style="border: 1px solid var(--border); padding: 4px;"></td></tr></table>
<h4>Verkauft</h4>
<table style="width:100%; border-collapse: collapse;"><tr><th style="border: 1px solid var(--border); padding: 4px;">Item</th><th style="border: 1px solid var(--border); padding: 4px;">Preis</th></tr><tr><td style="border: 1px solid var(--border); padding: 4px;"></td><td style="border: 1px solid var(--border); padding: 4px;"></td></tr></table>
<h4>Sonstiges</h4>
<p></p>`
};

function applyNoteTemplate(templateKey) {
    const template = NOTE_TEMPLATES[templateKey];
    if (!template) return;
    
    const editor = $('session-text');
    if (editor) {
        // Wenn bereits Text vorhanden, frage nach
        if (editor.innerHTML.trim() && !confirm('Vorhandenen Text ersetzen?')) {
            return;
        }
        editor.innerHTML = template;
        editor.focus();
    }
}

// ============================================================
// SCHNELL-REFERENZ PANEL
// ============================================================
function toggleQuickRef() {
    const panel = $('quick-ref-panel');
    if (panel) {
        panel.classList.toggle('open');
    }
}

function toggleQuickRefSection(sectionEl, evt) {
    // Verhindere dass der Click auf dem Content das Toggle auslöst
    const e = evt || window.event;
    if (e && e.target && e.target.closest('.quick-ref-section-content')) return;
    sectionEl.classList.toggle('expanded');
}

// ============================================================
// SCHNELL-REFERENZ BENUTZERDEFINIERTE EINTRÄGE
// ============================================================

function initQuickRefCustom() {
    // Initialisiere quickRefCustom Array falls nicht vorhanden
    if (!D.quickRefCustom) D.quickRefCustom = [];
    renderQuickRefCustom();
}

function renderQuickRefCustom() {
    const container = $('quick-ref-custom');
    if (!container) return;
    
    if (!D.quickRefCustom || D.quickRefCustom.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = D.quickRefCustom.map(entry => {
        const isExpanded = entry.expanded ? 'expanded' : '';
        // Parse Entity-Links im Content
        const content = parseEntityLinks(entry.content || '');
        
        return `
        <div class="quick-ref-section quick-ref-custom-entry ${isExpanded}" data-id="${entry.id}">
            <div class="quick-ref-section-title" data-action="toggle-quick-ref-custom" data-id="${entry.id}">
                <span>📌 ${esc(entry.title)}</span>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <button class="btn btn-sm" data-action="edit-quick-ref-entry" data-id="${entry.id}" data-stop-propagation="true" title="Bearbeiten">✏️</button>
                    <button class="btn btn-sm btn-danger" data-action="delete-quick-ref-entry" data-id="${entry.id}" data-stop-propagation="true" title="Löschen">🗑️</button>
                    <span class="quick-ref-toggle-arrow">▼</span>
                </div>
            </div>
            <div class="quick-ref-section-content">
                <div class="quick-ref-custom-content">${content}</div>
            </div>
        </div>`;
    }).join('');
    
    // Separator wenn es benutzerdefinierte Einträge gibt
    if (D.quickRefCustom.length > 0) {
        container.innerHTML += '<div class="quick-ref-separator"><span>📚 Standard-Referenz</span></div>';
    }
}

function addQuickRefEntry() {
    $('quick-ref-edit-id').value = '';
    $('quick-ref-entry-title').value = '';
    $('quick-ref-entry-content').innerHTML = '';
    $('quick-ref-modal-title').textContent = 'Eintrag hinzufügen';
    showModal('quick-ref-entry-modal');
    setTimeout(() => $('quick-ref-entry-title').focus(), 100);
}

function editQuickRefEntry(id) {
    const entry = D.quickRefCustom?.find(e => e.id === id);
    if (!entry) return;
    
    $('quick-ref-edit-id').value = id;
    $('quick-ref-entry-title').value = entry.title || '';
    $('quick-ref-entry-content').innerHTML = entry.content || '';
    $('quick-ref-modal-title').textContent = 'Eintrag bearbeiten';
    showModal('quick-ref-entry-modal');
}

function saveQuickRefEntry() {
    const id = $('quick-ref-edit-id').value;
    const title = $('quick-ref-entry-title').value.trim();
    const content = sanitizeHTML($('quick-ref-entry-content').innerHTML);
    
    if (!title) {
        showToast('⚠️ Titel erforderlich', 'error');
        return;
    }
    
    if (!D.quickRefCustom) D.quickRefCustom = [];
    
    if (id) {
        // Bearbeiten
        const idx = D.quickRefCustom.findIndex(e => e.id === parseInt(id));
        if (idx > -1) {
            D.quickRefCustom[idx].title = title;
            D.quickRefCustom[idx].content = content;
        }
    } else {
        // Neu
        D.quickRefCustom.push({
            id: nextId('quickRefCustom'),
            title: title,
            content: content,
            expanded: true
        });
    }
    
    hideModal('quick-ref-entry-modal');
    renderQuickRefCustom();
    save();
    showToast('📌 Eintrag gespeichert');
}

function deleteQuickRefEntry(id) {
    if (!confirm('Eintrag wirklich löschen?')) return;
    
    D.quickRefCustom = (D.quickRefCustom || []).filter(e => e.id !== id);
    renderQuickRefCustom();
    save();
    showToast('🗑️ Eintrag gelöscht');
}

function toggleQuickRefCustomEntry(id) {
    const entry = D.quickRefCustom?.find(e => e.id === id);
    if (entry) {
        entry.expanded = !entry.expanded;
        renderQuickRefCustom();
        save();
    }
}

// ============================================================
// PWA INSTALL PROMPT
// ============================================================
let deferredPrompt = null;

function initPWA() {
    // Prüfe ob bereits installiert
    if (window.matchMedia('(display-mode: standalone)').matches) {
        log('[PWA] App läuft im Standalone-Modus');
        return;
    }
    
    // beforeinstallprompt Event abfangen
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Zeige Install-Banner nach 30 Sekunden
        setTimeout(() => {
            if (deferredPrompt && !StorageAPI.has('pwa-dismissed')) {
                showPWABanner();
            }
        }, 30000);
    });
    
    // App installed Event
    window.addEventListener('appinstalled', () => {
        log('[PWA] App wurde installiert');
        deferredPrompt = null;
        hidePWABanner();
    });
}

function showPWABanner() {
    const banner = $('pwa-install-banner');
    if (banner) banner.classList.add('show');
}

function hidePWABanner() {
    const banner = $('pwa-install-banner');
    if (banner) banner.classList.remove('show');
}

function dismissPWABanner() {
    hidePWABanner();
    StorageAPI.set('pwa-dismissed', 'true');
}

async function installPWA() {
    if (!deferredPrompt) {
        showToast('Installation nicht verfügbar');
        return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        showToast('🎉 App wird installiert!');
    }
    
    deferredPrompt = null;
    hidePWABanner();
}

// ============================================================
// VERSIONIERUNG & MIGRATION
// ============================================================
// Alias für Rückwärtskompatibilität
const CURRENT_VERSION = APP_CONFIG.VERSION;

const MIGRATIONS = {
    '2.3.0': (data) => {
        // Migration von 2.2 auf 2.3
        // Conditions-Format ändern
        data.characters?.forEach(c => {
            if (c.conditions && Array.isArray(c.conditions)) {
                // Altes Format: [{type: 'poisoned', ...}] -> Neues Format: ['poisoned']
                if (c.conditions[0] && typeof c.conditions[0] === 'object') {
                    c.conditions = c.conditions.map(cond => cond.type || cond);
                }
            }
        });
        return data;
    },
    '2.4.0': (data) => {
        // Migration auf 2.4
        // Zauberslots initialisieren
        data.characters?.forEach(c => {
            if (!c.spellSlotsMax) {
                c.spellSlotsMax = getSpellSlotsForClass(c.characterClass, c.level || 1);
            }
            if (!c.spellSlotsUsed) {
                c.spellSlotsUsed = [0,0,0,0,0,0,0,0,0];
            }
        });
        
        // Kalender initialisieren
        if (!data.calendar) {
            data.calendar = {
                day: 1,
                month: 4, // Mirtul
                year: 1492,
                events: []
            };
        }
        
        // Quest timestamps
        data.quests?.forEach(q => {
            if (!q.createdAt) {
                q.createdAt = Date.now();
            }
        });
        
        return data;
    }
};

function migrateData(data) {
    const dataVersion = data._version || '2.2.0';
    let currentData = data;
    
    const versions = Object.keys(MIGRATIONS).sort();
    
    for (const version of versions) {
        if (compareVersions(dataVersion, version) < 0) {
            log(`[MIGRATION] Migriere von ${dataVersion} auf ${version}`);
            try {
                currentData = MIGRATIONS[version](currentData);
                currentData._version = version;
            } catch (e) {
                console.error(`[MIGRATION] Fehler bei Migration auf ${version}:`, e);
            }
        }
    }
    
    currentData._version = CURRENT_VERSION;
    return currentData;
}

function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
        if ((parts1[i] || 0) < (parts2[i] || 0)) return -1;
        if ((parts1[i] || 0) > (parts2[i] || 0)) return 1;
    }
    return 0;
}

// ============================================================
// PERFORMANCE - VIRTUAL LIST
// ============================================================
class VirtualList {
    constructor(container, itemHeight, renderItem) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.renderItem = renderItem;
        this.items = [];
        this.scrollTop = 0;
        this.visibleCount = 0;
        
        this.content = document.createElement('div');
        this.content.className = 'virtual-list-content';
        container.appendChild(this.content);
        
        container.addEventListener('scroll', () => this.onScroll());
    }
    
    setItems(items) {
        this.items = items;
        this.content.style.height = `${items.length * this.itemHeight}px`;
        this.visibleCount = Math.ceil(this.container.clientHeight / this.itemHeight) + 2;
        this.render();
    }
    
    onScroll() {
        this.scrollTop = this.container.scrollTop;
        this.render();
    }
    
    render() {
        const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - 1);
        const endIndex = Math.min(this.items.length, startIndex + this.visibleCount + 2);
        
        this.content.innerHTML = '';
        
        for (let i = startIndex; i < endIndex; i++) {
            const item = this.items[i];
            const el = document.createElement('div');
            el.className = 'virtual-list-item';
            el.style.top = `${i * this.itemHeight}px`;
            el.style.height = `${this.itemHeight}px`;
            el.innerHTML = this.renderItem(item, i);
            this.content.appendChild(el);
        }
    }
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', (e) => {
    // Ignoriere Shortcuts wenn in Input/Textarea
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) ||
                     document.activeElement?.isContentEditable;
    
    // Shortcuts-Overlay schließen mit Escape
    if (e.key === 'Escape') {
        const shortcutsOverlay = $('shortcuts-overlay');
        if (shortcutsOverlay?.classList.contains('show')) {
            hideShortcutsOverlay();
            return;
        }
        // Quick-Ref schließen
        const quickRef = $('quick-ref-panel');
        if (quickRef?.classList.contains('open')) {
            toggleQuickRef();
            return;
        }
    }
    
    // Strg+Z: Undo (immer aktiv)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
    }
    
    // Strg+Y oder Strg+Shift+Z: Redo (immer aktiv)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
    }
    
    // Strg+S: Speichern (immer aktiv)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveImmediate();
        showToast('💾 Gespeichert');
        return;
    }
    
    // Strg+K oder Strg+F: Globale Suche
    if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'k')) {
        e.preventDefault();
        $('global-search')?.focus();
        return;
    }
    
    // Escape: Modal schließen
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-overlay.show');
        if (openModal) {
            openModal.classList.remove('show');
            return;
        }
    }
    
    // Folgende nur wenn nicht am Tippen
    if (isTyping) return;
    
    // ?: Shortcuts-Overlay
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        showShortcutsOverlay();
        return;
    }
    
    // T: Session Timer toggle
    if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleSessionTimer();
        return;
    }
    
    // Ziffern 1-9: Tab-Wechsel
    if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tabs = ['dashboard','party','npcs','locations','quests','encounter','initiative','spells','dice'];
        const idx = parseInt(e.key) - 1;
        if (tabs[idx]) {
            e.preventDefault();
            switchView(tabs[idx]);
        }
        return;
    }
    
    // Alt+Ziffern: Schnellwürfel
    if (e.altKey && e.key >= '1' && e.key <= '9') {
        const dice = { '1': 12, '2': 20, '4': 4, '6': 6, '8': 8 };
        if (dice[e.key]) {
            e.preventDefault();
            quickRoll(dice[e.key]);
        }
        return;
    }
    
    // Space: Nächster Zug (nur im Initiative-Tab)
    if (e.key === ' ' && document.querySelector('#view-initiative.active')) {
        e.preventDefault();
        nextTurn();
        return;
    }
    
    // Delete/Backspace: Node löschen (nur im Network-Tab)
    if ((e.key === 'Delete' || e.key === 'Backspace') && document.querySelector('#view-network.active')) {
        e.preventDefault();
        deleteSelectedNode();
        return;
    }
    
    // N: Nächster Zug im Initiative
    if (e.key === 'n' && !e.shiftKey && document.querySelector('#view-initiative.active')) {
        e.preventDefault();
        nextTurn();
        return;
    }
    
    // Shift+N: Neue Runde
    if (e.key === 'N' && e.shiftKey && document.querySelector('#view-initiative.active')) {
        e.preventDefault();
        nextEncounterRound();
        return;
    }
    
    // P: Vorheriger Zug
    if (e.key === 'p' && document.querySelector('#view-initiative.active')) {
        e.preventDefault();
        prevTurn();
        return;
    }
    
    // R: Quick Roll d20
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        quickRoll(20);
        return;
    }
    
    // N: Neues Element (kontextabhängig)
    if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const activeView = document.querySelector('.view.active')?.id;
        if (activeView === 'view-party') toggleCollapse('char-form');
        else if (activeView === 'view-npcs') showModal('npc-modal');
        else if (activeView === 'view-quests') showModal('quest-modal');
        else if (activeView === 'view-encounter') toggleCollapse('enc-form');
        return;
    }
    
    // ? : Hilfe anzeigen
    if (e.key === '?') {
        e.preventDefault();
        showKeyboardHelp();
        return;
    }
});

function showKeyboardHelp() {
    const helpHtml = `
        <div style="display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between;"><span>Speichern</span><kbd>Strg+S</kbd></div>
            <div style="display: flex; justify-content: space-between;"><span>Rückgängig</span><kbd>Strg+Z</kbd></div>
            <div style="display: flex; justify-content: space-between;"><span>Suche</span><kbd>Strg+F</kbd></div>
            <div style="display: flex; justify-content: space-between;"><span>Schließen</span><kbd>Escape</kbd></div>
            <div class="divider"></div>
            <div style="display: flex; justify-content: space-between;"><span>Tab 1-9</span><kbd>1-9</kbd></div>
            <div style="display: flex; justify-content: space-between;"><span>Neues Element</span><kbd>N</kbd></div>
            <div style="display: flex; justify-content: space-between;"><span>Nächster Zug</span><kbd>Space</kbd></div>
            <div style="display: flex; justify-content: space-between;"><span>Würfeln (d20)</span><kbd>R</kbd></div>
        </div>
    `;
    
    // Einfaches Alert-Modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.innerHTML = `
        <div class="modal" style="max-width: 350px;">
            <div class="modal-header">
                <span class="modal-title">⌨️ Tastenkürzel</span>
                <button class="btn btn-sm" data-action="close-modal-overlay">✕</button>
            </div>
            ${helpHtml}
        </div>
    `;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
}

// ============================================================
// PERSISTENCE
// ============================================================
let saveTimeout = null;

// Sofortiges Speichern (für kritische Aktionen)
async function saveImmediate() {
    if (!$('autosave-toggle')?.checked) return;
    const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
    
    updateSaveIndicator('saving');
    
    const dataString = JSON.stringify(D);
    const dataSizeMB = new Blob([dataString]).size / (1024 * 1024);
    
    // localStorage Limit: ~5-10MB je nach Browser
    const LS_LIMIT_MB = 5;
    const LS_WARNING_MB = 4;
    
    try {
        // Warnung bei Größenannäherung
        if (dataSizeMB > LS_WARNING_MB && dataSizeMB <= LS_LIMIT_MB) {
            console.warn(`[STORAGE] Datengröße nähert sich Limit: ${dataSizeMB.toFixed(2)}MB / ${LS_LIMIT_MB}MB`);
            showToast(`⚠️ Kampagne wird groß (${dataSizeMB.toFixed(1)}MB). Backup empfohlen!`, 'warning', 5000);
        }
        
        // Automatischer Fallback zu IndexedDB bei Überschreitung
        if (dataSizeMB > LS_LIMIT_MB) {
            console.warn(`[STORAGE] localStorage Limit überschritten (${dataSizeMB.toFixed(2)}MB). Fallback zu IndexedDB...`);
            await saveToIndexedDBFallback(key, dataString);
            updateSaveIndicator('saved');
            showToast('💾 Große Kampagne in IndexedDB gespeichert', 'success');
            broadcastSave();
            return;
        }
        
        // Normaler localStorage-Save
        const saveResult = StorageAPI.set(key, dataString);
        
        if (!saveResult.success) {
            // Fehler beim Speichern → werfe Error für catch-Block
            throw new Error(saveResult.error);
        }
        
        updateSaveIndicator('saved');
        broadcastSave();
        
        // Zusätzliches IndexedDB-Backup bei großen Daten (>2MB)
        if (dataSizeMB > 2) {
            saveToIndexedDBFallback(key, dataString).catch(e => 
                log('[IDB Backup] Optional backup failed:', e)
            );
        }
    } catch(e) { 
        console.error('[STORAGE] localStorage save failed:', e);
        
        // Fallback zu IndexedDB bei Fehler
        try {
            await saveToIndexedDBFallback(key, dataString);
            updateSaveIndicator('saved');
            showToast('💾 In IndexedDB gespeichert (localStorage voll)', 'warning');
            broadcastSave();
        } catch(idbError) {
            console.error('[STORAGE] IndexedDB fallback failed:', idbError);
            updateSaveIndicator('error');
            showToast('❌ Speichern fehlgeschlagen! Daten exportieren empfohlen!', 'error', 8000);
        }
    }
}

// IndexedDB Fallback für große Kampagnen
async function saveToIndexedDBFallback(key, dataString) {
    if (!idb) await initIndexedDB();
    
    return new Promise((resolve, reject) => {
        const transaction = idb.transaction(['campaigns'], 'readwrite');
        const store = transaction.objectStore('campaigns');
        const request = store.put({ id: key, data: dataString, timestamp: Date.now() });
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Load mit IndexedDB-Fallback
async function loadFromIndexedDBFallback(key) {
    if (!idb) await initIndexedDB();
    
    return new Promise((resolve, reject) => {
        const transaction = idb.transaction(['campaigns'], 'readonly');
        const store = transaction.objectStore('campaigns');
        const request = store.get(key);
        
        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result.data);
            } else {
                reject(new Error('No data found'));
            }
        };
        request.onerror = () => reject(request.error);
    });
}

// Debounced Save (für häufige Änderungen)
// Als Variable definiert, um spätere Erweiterung (Decorator-Pattern) zu ermöglichen
let save = function(showMessage = false) {
    if (!$('autosave-toggle')?.checked) return;
    
    updateSaveIndicator('saving');
    
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
        
        // Sichere JSON-Serialisierung
        let dataString;
        try {
            dataString = JSON.stringify(D);
        } catch (serializeError) {
            ErrorHandler.log('save', serializeError, 'JSON Serialisierung fehlgeschlagen');
            updateSaveIndicator('error');
            ErrorHandler.showError('Daten konnten nicht serialisiert werden');
            return;
        }
        
        const dataSizeMB = new Blob([dataString]).size / (1024 * 1024);
        const LS_LIMIT_MB = 5;
        
        try {
            // Automatischer Fallback zu IndexedDB bei Überschreitung
            if (dataSizeMB > LS_LIMIT_MB) {
                await saveToIndexedDBFallback(key, dataString);
                updateSaveIndicator('saved');
                broadcastSave();
                if (showMessage) showToast('💾 In IndexedDB gespeichert', 'success');
                return;
            }
            
            const saveResult = StorageAPI.set(key, dataString);
            if (!saveResult.success) {
                throw new Error(saveResult.error);
            }
            
            updateSaveIndicator('saved');
            broadcastSave();
            if (showMessage) showToast('💾 Gespeichert', 'success');
        } catch(e) { 
            ErrorHandler.log('save', e, 'localStorage');
            
            // Fallback zu IndexedDB
            try {
                await saveToIndexedDBFallback(key, dataString);
                updateSaveIndicator('saved');
                broadcastSave();
                showToast('💾 In IndexedDB gespeichert (localStorage voll)', 'warning');
            } catch(idbError) {
                ErrorHandler.log('save', idbError, 'IndexedDB Fallback');
                updateSaveIndicator('error');
                ErrorHandler.showError('Speichern fehlgeschlagen!');
            }
        }
    }, 300);
}

// Quick Roll für Keyboard Shortcuts
function quickRoll(sides) {
    const result = Math.floor(Math.random() * sides) + 1;
    const isCrit = sides === 20 && result === 20;
    const isFail = sides === 20 && result === 1;
    
    let msg = `🎲 d${sides}: ${result}`;
    if (isCrit) msg = '🎉 Kritisch! d20: 20';
    if (isFail) msg = '💀 Patzer! d20: 1';
    
    showToast(msg);
    
    // Zur Würfelhistorie hinzufügen
    D.diceHistory = D.diceHistory || [];
    D.diceHistory.unshift({ dice: `d${sides}`, result, timestamp: Date.now() });
    if (D.diceHistory.length > 50) D.diceHistory = D.diceHistory.slice(0, 50);
}

async function load() {
    const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
    try {
        let s = StorageAPI.get(key, null);
        
        // Fallback zu IndexedDB wenn localStorage leer
        if (!s) {
            try {
                s = await loadFromIndexedDBFallback(key);
                if (s) {
                    log('[LOAD] Daten aus IndexedDB geladen');
                    showToast('💾 Kampagne aus IndexedDB geladen', 'info', 3000);
                }
            } catch(e) {
                log('[LOAD] Keine Daten in IndexedDB:', e.message);
            }
        }
        
        if (s) {
            // Sichere JSON-Parse
            let p;
            try {
                p = JSON.parse(s);
            } catch (parseError) {
                ErrorHandler.log('load', parseError, 'JSON Parse fehlgeschlagen');
                ErrorHandler.showError('Kampagnendaten sind beschädigt');
                return;
            }
            
            // Prüfe auf valides Objekt
            if (!p || typeof p !== 'object') {
                ErrorHandler.log('load', new Error('Ungültige Datenstruktur'));
                return;
            }
            
            // Versionierung und Migration
            if (!p._version || compareVersions(p._version, CURRENT_VERSION) < 0) {
                log(`[LOAD] Migriere Daten von ${p._version || 'unbekannt'} auf ${CURRENT_VERSION}`);
                try {
                    p = migrateData(p);
                } catch (migrateError) {
                    ErrorHandler.log('load', migrateError, 'Migration fehlgeschlagen');
                    // Fahre trotzdem fort mit unmigierten Daten
                }
            }
            
            D = { ...D, ...p };
            if (!D.encounters) D.encounters = [];
            if (!D.spells) D.spells = [];
            if (!D.links) D.links = [];
            if (!D.filters) D.filters = [];
            if (!D.mindmap) D.mindmap = { nodes: [], connections: [] };
            if (!D.calendar) D.calendar = { day: 1, month: 4, year: 1492, events: [] };
            if (!D._nextId) D._nextId = {};
            
            // Setze aktuelle Version
            D._version = CURRENT_VERSION;
            
            // Validiere Datenintegrität
            const validation = validateDataIntegrity();
            if (!validation.valid) {
                console.warn('[LOAD] Datenreparaturen:', validation.repairs);
                // Speichere reparierte Daten
                setTimeout(() => save(), 1000);
            }
        }
    } catch(e) { 
        ErrorHandler.log('load', e);
        ErrorHandler.showError('Fehler beim Laden der Kampagne');
    }
}

function exportAllDataAsFile() {
    const exp = { ...D }; delete exp._nextId;
    
    // Kampagnennamen hinzufügen
    const index = getCampaignIndex();
    if (index.active === 'dnd-tracker-v4') {
        exp._campaignName = 'Standard-Kampagne';
    } else {
        const campaign = index.campaigns.find(c => c.key === index.active);
        exp._campaignName = campaign?.name || 'Unbenannte Kampagne';
    }
    exp._exportDate = new Date().toISOString();
    exp._version = '2.11';
    
    const filename = exp._campaignName.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').replace(/\s+/g, '-');
    const blob = new Blob([JSON.stringify(exp, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(a.href);
    showToast('📁 Daten exportiert');
}

// ============================================================
// IMPORT/EXPORT SYSTEM (Versioniert & Zukunftssicher)
// ============================================================
const IO_VERSION = '2.0';
const IO_SCHEMA = {
    characters: {
        required: ['name'],
        defaults: { level: 1, hpCurrent: 0, hpMax: 0, armorClass: 10, spells: [], items: [], currency: {} }
    },
    npcs: {
        required: ['name'],
        defaults: { dialogs: [], role: '', status: 'alive' }
    },
    locations: {
        required: ['name'],
        defaults: { description: '', category: '' }
    },
    quests: {
        required: ['title'],
        defaults: { description: '', status: 'active', objectives: [] }
    },
    loot: {
        required: ['name'],
        defaults: { quantity: 1, category: 'misc', rarity: 'normal', value: 0, weight: 0 }
    },
    spells: {
        required: ['name'],
        defaults: { level: 0, school: '', type: 'spell', description: '' }
    }
};

// Export für einzelne Datentypen
function exportData(dataType) {
    const data = D[dataType];
    if (!data || data.length === 0) {
        showToast('⚠️ Keine Daten zum Exportieren', 'warning');
        return;
    }
    
    const exportObj = {
        _meta: {
            version: IO_VERSION,
            type: dataType,
            exportDate: new Date().toISOString(),
            count: data.length,
            app: 'D&D Session Tracker'
        },
        data: data
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    
    const typeNames = {
        characters: 'party',
        npcs: 'npcs',
        locations: 'orte',
        quests: 'quests',
        loot: 'truhe',
        spells: 'zauber',
        wiki: 'wiki'
    };
    
    a.download = `dnd-${typeNames[dataType] || dataType}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    
    showToast(`📤 ${data.length} ${dataType} exportiert`);
}

// CSV Export für Encounters und Spells
function exportDataCSV(dataType) {
    const data = D[dataType];
    if (!data || data.length === 0) {
        showToast('⚠️ Keine Daten zum Exportieren', 'warning');
        return;
    }
    
    let csvContent = '';
    let filename = '';
    
    if (dataType === 'encounters') {
        // CSV-Header für Encounters
        const headers = ['Name', 'Typ', 'CR', 'AC', 'HP', 'Initiative', 'Speed', 'STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA', 'Wahrnehmung', 'Sprachen', 'Eigenschaften', 'Aktionen', 'Ausrüstung', 'Fertigkeiten'];
        csvContent = headers.join(';') + '\n';
        
        data.forEach(e => {
            const row = [
                escapeCSV(e.name || ''),
                escapeCSV(e.creatureType || ''),
                escapeCSV(e.cr || ''),
                e.ac || 0,
                e.hp || 0,
                e.init || 0,
                escapeCSV(e.speed || ''),
                e.str || 10,
                e.dex || 10,
                e.con || 10,
                e.int || 10,
                e.wis || 10,
                e.cha || 10,
                e.perception || 0,
                escapeCSV((e.languages || []).join(', ')),
                escapeCSV(stripHTML(e.traits || '')),
                escapeCSV(stripHTML(e.actions || '')),
                escapeCSV(stripHTML(e.equipment || '')),
                escapeCSV(stripHTML(e.skills || ''))
            ];
            csvContent += row.join(';') + '\n';
        });
        
        filename = `dnd-encounters-${new Date().toISOString().split('T')[0]}.csv`;
        
    } else if (dataType === 'spells') {
        // CSV-Header für Spells
        const headers = ['Name', 'Stufe', 'Schule', 'Typ', 'Zauberzeit', 'Reichweite', 'Dauer', 'V', 'G', 'M', 'Material', 'Ritual', 'Klassen', 'Beschreibung', 'Notiz'];
        csvContent = headers.join(';') + '\n';
        
        data.forEach(s => {
            const classes = s.spellClasses?.join(', ') || s.spellClass || '';
            const row = [
                escapeCSV(s.name || ''),
                s.level || 0,
                escapeCSV(s.school || ''),
                escapeCSV(s.type || ''),
                escapeCSV(s.time || ''),
                escapeCSV(s.range || ''),
                escapeCSV(s.duration || ''),
                s.v ? 'Ja' : 'Nein',
                s.g ? 'Ja' : 'Nein',
                s.m ? 'Ja' : 'Nein',
                escapeCSV(s.material || ''),
                s.ritual ? 'Ja' : 'Nein',
                escapeCSV(classes),
                escapeCSV(stripHTML(s.description || '')),
                escapeCSV(s.note || '')
            ];
            csvContent += row.join(';') + '\n';
        });
        
        filename = `dnd-zauber-${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    // BOM für Excel UTF-8 Erkennung
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    
    showToast(`📊 ${data.length} ${dataType} als CSV exportiert`);
}

// Hilfsfunktionen für CSV-Export
function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Wenn Semikolon, Anführungszeichen oder Zeilenumbruch enthalten, in Anführungszeichen setzen
    if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function stripHTML(html) {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

// Import für einzelne Datentypen
function importData(dataType, inputEl) {
    const file = inputEl.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onerror = () => {
        ErrorHandler.log('importData', reader.error, 'FileReader Fehler');
        ErrorHandler.showError('Datei konnte nicht gelesen werden');
        inputEl.value = '';
    };
    
    reader.onload = e => {
        try {
            // Sichere JSON-Parse
            let imported;
            try {
                imported = JSON.parse(e.target.result);
            } catch (parseErr) {
                throw new Error('Ungültiges JSON-Format');
            }
            
            // Prüfe ob es ein neues Format mit _meta ist
            let items;
            let importedType = dataType;
            
            if (imported._meta && imported.data) {
                // Neues Format
                items = imported.data;
                importedType = imported._meta.type;
                
                // Warnung wenn Typ nicht übereinstimmt
                if (importedType !== dataType) {
                    if (!confirm(`⚠️ Die Datei enthält "${importedType}" Daten.\nSie versuchen aber "${dataType}" zu importieren.\n\nTrotzdem importieren?`)) {
                        inputEl.value = '';
                        return;
                    }
                }
            } else if (Array.isArray(imported)) {
                // Altes Format (direktes Array)
                items = imported;
            } else {
                throw new Error('Unbekanntes Dateiformat');
            }
            
            if (!Array.isArray(items) || items.length === 0) {
                throw new Error('Keine gültigen Daten gefunden');
            }
            
            // Schema-Validierung und Migration
            const schema = IO_SCHEMA[dataType];
            if (!schema) {
                throw new Error(`Unbekannter Datentyp: ${dataType}`);
            }
            
            const validItems = items.map((item, idx) => {
                // Überspringe ungültige Items
                if (!item || typeof item !== 'object') {
                    console.warn(`Import: Item ${idx} ist ungültig, wird übersprungen`);
                    return null;
                }
                
                // Prüfe Pflichtfelder
                for (const field of schema.required) {
                    if (!item[field]) {
                        console.warn(`Import: Item ${idx} fehlt Pflichtfeld "${field}"`);
                    }
                }
                
                // Füge Defaults hinzu
                const migratedItem = { ...schema.defaults, ...item };
                
                // Neue ID vergeben um Konflikte zu vermeiden
                migratedItem.id = nextId(dataType);
                
                return migratedItem;
            }).filter(Boolean); // Entferne null-Einträge
            
            if (validItems.length === 0) {
                throw new Error('Keine gültigen Einträge nach Validierung');
            }
            
            // Import-Modus abfragen
            showImportModal(dataType, validItems);
            
        } catch(err) {
            ErrorHandler.log('importData', err, dataType);
            showToast(`❌ Import fehlgeschlagen: ${err.message}`, 'error');
        }
        inputEl.value = '';
    };
    reader.readAsText(file);
}

// Import-Modal anzeigen
function showImportModal(dataType, items) {
    const typeLabels = {
        characters: 'Charaktere',
        npcs: 'NPCs',
        locations: 'Orte',
        quests: 'Quests',
        loot: 'Items',
        spells: 'Zauber'
    };
    
    const existingCount = D[dataType]?.length || 0;
    
    let modal = $('import-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'import-modal';
        document.body.appendChild(modal);
    }
    
    // Preview der ersten 10 Items
    const previewHtml = items.slice(0, 10).map(item => {
        const name = item.name || item.title || 'Unbenannt';
        const meta = dataType === 'characters' ? `Lv.${item.level || 1}` :
                     dataType === 'spells' ? `Grad ${item.level || 0}` :
                     dataType === 'loot' ? `×${item.quantity || 1}` : '';
        return `<div class="import-preview-item">
            <span class="import-preview-name">${esc(name)}</span>
            <span class="import-preview-meta">${meta}</span>
        </div>`;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <span class="modal-title">📥 ${typeLabels[dataType]} importieren</span>
                <button class="btn btn-sm" data-action="hide-modal" data-value="import-modal">✕</button>
            </div>
            
            <p style="margin-bottom: 12px; color: var(--text-dim);">
                <strong>${items.length}</strong> ${typeLabels[dataType]} gefunden.
                ${existingCount > 0 ? `Aktuell: <strong>${existingCount}</strong> vorhanden.` : ''}
            </p>
            
            <div class="import-preview">
                ${previewHtml}
                ${items.length > 10 ? `<div style="text-align: center; color: var(--text-dim); padding: 8px;">... und ${items.length - 10} weitere</div>` : ''}
            </div>
            
            <div class="import-options">
                <label class="import-option">
                    <input type="radio" name="import-mode" value="merge" checked>
                    <span>➕ Hinzufügen (zu bestehenden)</span>
                </label>
                <label class="import-option">
                    <input type="radio" name="import-mode" value="replace">
                    <span>🔄 Ersetzen (bestehende löschen)</span>
                </label>
            </div>
            
            <div class="btn-group" style="margin-top: 16px;">
                <button class="btn btn-success" data-action="execute-import" data-value="${dataType}">✓ Importieren</button>
                <button class="btn" data-action="hide-modal" data-value="import-modal">Abbrechen</button>
            </div>
        </div>
    `;
    
    // Items für späteren Import speichern
    modal.dataset.importItems = JSON.stringify(items);
    modal.dataset.importType = dataType;
    
    showModal('import-modal');
}

// Import ausführen
function executeImport(dataType) {
    const modal = $('import-modal');
    const items = JSON.parse(modal.dataset.importItems || '[]');
    const mode = document.querySelector('input[name="import-mode"]:checked')?.value || 'merge';
    
    saveUndoState();
    
    if (mode === 'replace') {
        D[dataType] = items;
    } else {
        D[dataType] = [...(D[dataType] || []), ...items];
    }
    
    save();
    renderAll();
    updateIOCounts();
    hideModal('import-modal');
    
    showToast(`✅ ${items.length} ${dataType} importiert (${mode === 'replace' ? 'ersetzt' : 'hinzugefügt'})`);
}

// IO-Counter aktualisieren
function updateIOCounts() {
    const counts = {
        'party': D.characters?.length || 0,
        'npcs': D.npcs?.length || 0,
        'locations': D.locations?.length || 0,
        'quests': D.quests?.length || 0,
        'loot': D.loot?.length || 0,
        'spells': D.spells?.length || 0,
        'notes': D.sessionNotes?.length || 0
    };
    
    for (const [key, count] of Object.entries(counts)) {
        const el = $(`${key}-io-count`);
        if (el) el.textContent = count;
    }
    
    // Encounter-Runde aktualisieren
    const roundEl = $('encounter-round-num');
    if (roundEl) roundEl.textContent = D.initiative?.round || 1;
}

// Legacy: Alte exportSpells Funktion für Kompatibilität
function exportSpells() {
    exportData('spells');
}

// Legacy: Globaler Import (alte Funktion umbenennen)
function importDataGlobal() {
    const file = $('import-file').files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const imp = JSON.parse(e.target.result);
            
            // Kampagnennamen aus Import holen
            const campaignName = imp._campaignName || file.name.replace('.json', '').replace(/-\d{4}-\d{2}-\d{2}$/, '');
            
            // Benutzer fragen: Neue Kampagne oder aktuelle überschreiben?
            const choice = confirm(
                `Import: "${campaignName}"\n\n` +
                `OK = Als neue Kampagne importieren\n` +
                `Abbrechen = Aktuelle Kampagne überschreiben`
            );
            
            // Meta-Felder entfernen
            delete imp._campaignName;
            delete imp._exportDate;
            delete imp._version;
            
            // Migration
            if (imp.characters) {
                imp.characters = imp.characters.map(c => {
                    let bg = c.background || '', wt = c.weight || 0, pn = c.playerName || '';
                    if (c.notes && !bg) { const m = c.notes.match(/Herkunft\s*:\s*([^\n]+)/i); if (m) bg = m[1].trim(); }
                    if (c.notes && !wt) { const m = c.notes.match(/Gewicht\s*:\s*(\d+)/i); if (m) wt = parseInt(m[1]); }
                    if (c.name?.includes('(') && !pn) { const m = c.name.match(/\(([^)]+)\)/); if (m) pn = m[1]; }
                    return { ...c, background: bg, weight: wt, playerName: pn, hpCurrent: c.hpCurrent || 0, hpMax: c.hpMax || 0, spells: c.spells || [] };
                });
            }
            
            if (choice) {
                // Als neue Kampagne importieren
                const index = getCampaignIndex();
                const key = 'dnd-campaign-' + Date.now();
                
                // Neue Kampagne in Index hinzufügen
                index.campaigns.push({ 
                    key, 
                    name: campaignName, 
                    created: new Date().toISOString() 
                });
                
                // Kampagne aktivieren
                index.active = key;
                saveCampaignIndex(index);
                
                // Daten speichern
                const newData = {
                    locations: [], npcs: [], quests: [], characters: [], sessionNotes: [], quickNotes: '',
                    initiative: { combatants: [], currentTurn: 0, round: 1 },
                    loot: [], items: [], encounters: [], spells: [], links: [],
                    filters: [], mindmap: { nodes: [], connections: [] },
                    calendar: { day: 1, month: 0, year: 1492, events: [] },
                    _nextId: {},
                    ...imp
                };
                const saveResult = StorageAPI.setJSON(key, newData);
                
                if (saveResult.success) {
                    showToast(`✅ Kampagne "${campaignName}" importiert`);
                    location.reload();
                } else {
                    throw new Error(`Speichern fehlgeschlagen: ${saveResult.error}`);
                }
            } else {
                // Aktuelle Kampagne überschreiben
                D = { ...D, ...imp };
                if (!D._nextId) D._nextId = {};
                renderAll();
                updateIOCounts();
                if ($('quick-notes')) $('quick-notes').value = D.quickNotes || '';
                save();
                showToast('Import OK!');
            }
        } catch(e) { alert('Fehler: ' + e.message); }
        $('import-file').value = '';
    };
    reader.readAsText(file);
}

function copyData() { const exp = { ...D }; delete exp._nextId; navigator.clipboard.writeText(JSON.stringify(exp, null, 2)).then(() => showToast('Kopiert!')); }

function clearStorage() { 
    if (confirm('Alles löschen?')) { 
        const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
        const result = StorageAPI.remove(key);
        
        if (result.success) {
            location.reload();
        } else {
            showToast('❌ Fehler beim Löschen', 'error');
            console.error('Clear storage failed:', result.error);
        }
    } 
}
function toggleAutosave() { if ($('autosave-toggle').checked) save(); }

// ============================================================
// NAVIGATION
// ============================================================
function switchView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    $('view-' + name)?.classList.add('active');
    document.querySelector(`[data-view="${name}"]`)?.classList.add('active');
    if (name === 'notes') $('session-date').value = new Date().toISOString().split('T')[0];
    if (name === 'network') renderMindmap();
    
    // Mobile: Navigation schließen und Label aktualisieren
    const header = document.querySelector('.app-header');
    if (header) header.classList.remove('nav-open');
    
    // View-Name in Toggle-Bar aktualisieren
    const toggleText = document.querySelector('.mobile-nav-toggle-text');
    if (toggleText) {
        const viewNames = {
            'dashboard': '🏠 Start',
            'party': '👥 Party',
            'npcs': '🎭 NPCs',
            'locations': '🏠 Orte',
            'network': '🔗 Netzwerk',
            'quests': '📜 Quests',
            'encounter': '👹 Encounter',
            'initiative': '⚔️ Initiative',
            'loot': '📦 Truhe',
            'shops': '🏪 Shops',
            'spells': '✨ Zauber',
            'notes': '📝 Notizen',
            'wiki': '📚 Wiki',
            'links': '🔗 Links',
            'dice': '🎲 Würfel',
            'timers': '⏱️ Timer',
            'maps': '🗺️ Karten',
            'data': '💾 Daten'
        };
        toggleText.textContent = viewNames[name] || '📍 Navigation';
    }
}

function showModal(id) { 
    $(id).classList.add('show'); 
    populateSelects(); 
    if (id === 'timer-preset-modal') renderPresetList();
    if (id === 'quest-modal') populateQuestSelects();
}
function hideModal(id) { $(id).classList.remove('show'); }
function toggleCollapse(id) { const el = $(id), icon = $(id + '-icon'); el.classList.toggle('open'); if (icon) icon.textContent = el.classList.contains('open') ? '▲' : '▼'; }
function showQuickNotesModal() { 
    $('quick-notes').value = D.quickNotes || '';
    const modal = $('quicknotes-modal');
    modal.style.display = 'flex';
    modal.classList.add('show');
}
function hideQuickNotesModal() { 
    const modal = $('quicknotes-modal');
    modal.style.display = 'none';
    modal.classList.remove('show');
}
function saveQuickNotes() { D.quickNotes = $('quick-notes').value; save(); showToast('📝 Notizen gespeichert'); }

function populateSelects() {
    // Location select for NPCs
    const locSel = $('npc-location');
    if (locSel) locSel.innerHTML = '<option value="">-- Ort --</option>' + D.locations.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
    // Filter selects
    const filterOpts = '<option value="">-- Kein Filter --</option>' + D.filters.map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('');
    ['loc-filter', 'npc-filter'].forEach(id => { if ($(id)) $(id).innerHTML = filterOpts; });
}