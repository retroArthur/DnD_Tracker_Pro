// [SECTION:IMPORT_EXPORT]
// Extrahiert aus spellslots.js
// Import/Export System
// Zeilen: 493

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
            // Sichere JSON-Parse mit Prototype Pollution Protection
            let imported;
            try {
                imported = JSON.parse(e.target.result);
                // Prototype Pollution Protection
                if (imported && typeof imported === 'object') {
                    delete imported.__proto__;
                    delete imported.constructor;
                    delete imported.prototype;
                }
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
