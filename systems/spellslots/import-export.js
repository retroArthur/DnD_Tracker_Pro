// [SECTION:IMPORT_EXPORT]
// Extrahiert aus spellslots.js
// Import/Export System mit Validierung
// Zeilen: 565
// Schema-Definition: Welche Felder werden für jeden Datentyp exportiert/importiert?
const IO_SCHEMA = {
    characters: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        race: { type: 'string', required: false, default: '' },
        class: { type: 'string', required: false, default: '' },
        level: { type: 'number', required: false, default: 1 },
        playerName: { type: 'string', required: false, default: '' },
        background: { type: 'string', required: false, default: '' },
        hpCurrent: { type: 'number', required: false, default: 0 },
        hpMax: { type: 'number', required: false, default: 0 },
        hpTemp: { type: 'number', required: false, default: 0 },
        ac: { type: 'number', required: false, default: 10 },
        initiative: { type: 'number', required: false, default: 0 },
        speed: { type: 'number', required: false, default: 30 },
        passivePerception: { type: 'number', required: false, default: 10 },
        str: { type: 'number', required: false, default: 10 },
        dex: { type: 'number', required: false, default: 10 },
        con: { type: 'number', required: false, default: 10 },
        int: { type: 'number', required: false, default: 10 },
        wis: { type: 'number', required: false, default: 10 },
        cha: { type: 'number', required: false, default: 10 },
        spells: { type: 'array', required: false, default: [] },
        conditions: { type: 'array', required: false, default: [] },
        tags: { type: 'array', required: false, default: [] },
        notes: { type: 'string', required: false, default: '' },
        avatarUrl: { type: 'string', required: false, default: '' }
    },
    npcs: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        race: { type: 'string', required: false, default: '' },
        location: { type: 'string', required: false, default: '' },
        locationId: { type: 'number', required: false, default: null },
        faction: { type: 'string', required: false, default: '' },
        description: { type: 'string', required: false, default: '' },
        tags: { type: 'array', required: false, default: [] },
        relations: { type: 'array', required: false, default: [] },
        avatarUrl: { type: 'string', required: false, default: '' }
    },
    locations: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        type: { type: 'string', required: false, default: '' },
        region: { type: 'string', required: false, default: '' },
        description: { type: 'string', required: false, default: '' },
        tags: { type: 'array', required: false, default: [] },
        avatarUrl: { type: 'string', required: false, default: '' }
    },
    quests: {
        id: { type: 'number', required: true },
        title: { type: 'string', required: true },
        description: { type: 'string', required: false, default: '' },
        status: { type: 'string', required: false, default: 'active' },
        giver: { type: 'string', required: false, default: '' },
        giverId: { type: 'number', required: false, default: null },
        location: { type: 'string', required: false, default: '' },
        locationId: { type: 'number', required: false, default: null },
        reward: { type: 'string', required: false, default: '' },
        tags: { type: 'array', required: false, default: [] }
    },
    loot: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        type: { type: 'string', required: false, default: '' },
        rarity: { type: 'string', required: false, default: 'common' },
        description: { type: 'string', required: false, default: '' },
        value: { type: 'number', required: false, default: 0 },
        quantity: { type: 'number', required: false, default: 1 },
        assignedTo: { type: 'string', required: false, default: '' },
        tags: { type: 'array', required: false, default: [] }
    },
    spells: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        level: { type: 'number', required: false, default: 0 },
        school: { type: 'string', required: false, default: '' },
        castingTime: { type: 'string', required: false, default: '' },
        range: { type: 'string', required: false, default: '' },
        components: { type: 'string', required: false, default: '' },
        duration: { type: 'string', required: false, default: '' },
        description: { type: 'string', required: false, default: '' },
        spellClass: { type: 'string', required: false, default: '' },
        ritual: { type: 'boolean', required: false, default: false },
        concentration: { type: 'boolean', required: false, default: false }
    },
    sessionNotes: {
        id: { type: 'number', required: true },
        date: { type: 'string', required: true },
        content: { type: 'string', required: false, default: '' },
        sessionNumber: { type: 'number', required: false, default: 1 }
    },
    encounters: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        creatureType: { type: 'string', required: false, default: '' },
        cr: { type: 'string', required: false, default: '0' },
        ac: { type: 'number', required: false, default: 10 },
        init: { type: 'number', required: false, default: 0 },
        hp: { type: 'number', required: false, default: 1 },
        speed: { type: 'object', required: false, default: {} },
        perception: { type: 'number', required: false, default: 10 },
        languages: { type: 'array', required: false, default: [] },
        str: { type: 'number', required: false, default: 10 },
        dex: { type: 'number', required: false, default: 10 },
        con: { type: 'number', required: false, default: 10 },
        int: { type: 'number', required: false, default: 10 },
        wis: { type: 'number', required: false, default: 10 },
        cha: { type: 'number', required: false, default: 10 },
        savingThrows: { type: 'object', required: false, default: {} },
        resistances: { type: 'array', required: false, default: [] },
        immunities: { type: 'array', required: false, default: [] },
        conditionImmunities: { type: 'array', required: false, default: [] },
        traits: { type: 'string', required: false, default: '' },
        actions: { type: 'string', required: false, default: '' },
        skills: { type: 'string', required: false, default: '' },
        tags: { type: 'array', required: false, default: [] }
    },
    wiki: {
        id: { type: 'number', required: true },
        title: { type: 'string', required: true },
        category: { type: 'string', required: false, default: 'locations' },
        content: { type: 'string', required: false, default: '' },
        tags: { type: 'array', required: false, default: [] },
        pinned: { type: 'boolean', required: false, default: false },
        parentId: { type: 'number', required: false, default: null },
        createdAt: { type: 'number', required: false, default: 0 },
        updatedAt: { type: 'number', required: false, default: 0 }
    },
    links: {
        id: { type: 'number', required: true },
        title: { type: 'string', required: true },
        url: { type: 'string', required: true },
        category: { type: 'string', required: false, default: 'other' },
        description: { type: 'string', required: false, default: '' }
    }
};
// EXPORT FUNCTIONS
// ============================================================
function exportData(dataType) {
    const D = window.D;
    const APP_CONFIG = window.APP_CONFIG;
    const data = D[dataType];
    if (!data || !Array.isArray(data) || data.length === 0) {
        showToast(`Keine ${dataType} zum Exportieren vorhanden`, 'warning');
        return;
    }
    const schema = IO_SCHEMA[dataType];
    if (!schema) {
        showToast('Datentyp wird nicht unterstützt', 'error');
        return;
    }
    try {
        // Daten nach Schema filtern
        const filtered = data.map(item => {
            const obj = {};
            for (const [key, field] of Object.entries(schema)) {
                obj[key] = item[key] !== undefined ? item[key] : field.default;
            }
            return obj;
        });
        // Kampagnennamen hinzufügen
        const getCampaignIndex = window.getCampaignIndex;
        const index = getCampaignIndex();
        let campaignName = 'Standard-Kampagne';
        if (index.active !== APP_CONFIG.STORAGE_KEY) {
            const campaign = index.campaigns.find(c => c.key === index.active);
            campaignName = campaign?.name || 'Unbenannte Kampagne';
        }
        const exportObj = {
            _exportDate: new Date().toISOString(),
            _campaignName: campaignName,
            _version: APP_CONFIG.VERSION,
            _dataType: dataType,
            data: filtered
        };
        const json = JSON.stringify(exportObj, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}-${campaignName.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`📁 ${data.length} ${dataType} exportiert`);
    } catch (err) {
        showToast('❌ Export fehlgeschlagen: ' + err.message, 'error');
        console.error('[Export] Error:', err);
    }
}
function exportToCSV(dataType) {
    const D = window.D;
    const data = D[dataType];
    if (!data || !Array.isArray(data) || data.length === 0) {
        showToast(`Keine ${dataType} zum Exportieren`, 'warning');
        return;
    }
    const schema = IO_SCHEMA[dataType];
    if (!schema) {
        showToast('CSV-Export für diesen Datentyp nicht verfügbar', 'error');
        return;
    }
    try {
        // Header
        const headers = Object.keys(schema);
        let csv = headers.join(',') + '\n';
        // Rows
        data.forEach(item => {
            const row = headers.map(key => {
                let val = item[key] !== undefined ? item[key] : schema[key].default;
                // Arrays/Objects zu JSON
                if (typeof val === 'object') {
                    val = JSON.stringify(val);
                }
                // Escape quotes in CSV
                val = String(val).replace(/"/g, '""');
                return `"${val}"`;
            });
            csv += row.join(',') + '\n';
        });
        // BOM für Excel UTF-8 Support
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`📊 CSV exportiert (${data.length} Einträge)`);
    } catch (err) {
        showToast('❌ CSV-Export fehlgeschlagen', 'error');
        console.error('[CSV Export] Error:', err);
    }
}
// IMPORT FUNCTIONS
// ============================================================
function importData(inputEl) {
    const dataType = inputEl.dataset.type;
    if (!dataType) {
        showToast('Datentyp nicht angegeben', 'error');
        return;
    }
    showImportModal(dataType);
}
function showImportModal(dataType) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    fileInput.addEventListener('change', e => {
        const target = e.target;
        const file = target.files?.[0];
        if (!file) return;
        // Größenlimit: 10MB
        if (file.size > 10 * 1024 * 1024) {
            showToast('❌ Datei zu groß (max 10MB)', 'error');
            document.body.removeChild(fileInput);
            return;
        }
        const reader = new FileReader();
        reader.onload = evt => {
            try {
                const result = evt.target?.result;
                const importData = JSON.parse(result);
                // Validierung: Hat das Import-Objekt die richtige Struktur?
                if (!importData.data || !Array.isArray(importData.data)) {
                    throw new Error('Ungültiges Format: "data"-Array fehlt');
                }
                // Validierung: Datentyp passt?
                if (importData._dataType && importData._dataType !== dataType) {
                    const continueImport = confirm(
                        `Import-Datentyp ist "${importData._dataType}", aber erwartet wird "${dataType}".\n\n` +
                            `Trotzdem importieren?`
                    );
                    if (!continueImport) {
                        document.body.removeChild(fileInput);
                        return;
                    }
                }
                // Schema-Validierung
                const schema = IO_SCHEMA[dataType];
                if (!schema) {
                    throw new Error(`Schema für "${dataType}" nicht gefunden`);
                }
                const validatedItems = importData.data.map((item, idx) => {
                    const validated = {};
                    for (const [key, field] of Object.entries(schema)) {
                        if (field.required && item[key] === undefined) {
                            throw new Error(`Eintrag ${idx + 1}: Pflichtfeld "${key}" fehlt`);
                        }
                        validated[key] = item[key] !== undefined ? item[key] : field.default;
                    }
                    return validated;
                });
                // Import-Modal anzeigen
                const modal = $('import-modal');
                if (modal) {
                    const campaignName = importData._campaignName || file.name.replace('.json', '');
                    const exportDate = importData._exportDate
                        ? new Date(importData._exportDate).toLocaleDateString('de-DE')
                        : 'Unbekannt';
                    modal.dataset.importItems = JSON.stringify(validatedItems);
                    modal.dataset.dataType = dataType;
                    const infoEl = $('import-info');
                    if (infoEl) {
                        infoEl.innerHTML = `
                            <div style="display: grid; gap: 8px;">
                                <div><strong>Kampagne:</strong> ${esc(campaignName)}</div>
                                <div><strong>Export-Datum:</strong> ${exportDate}</div>
                                <div><strong>Einträge:</strong> ${validatedItems.length}</div>
                                <div><strong>Typ:</strong> ${dataType}</div>
                            </div>
                        `;
                    }
                    showModal('import-modal');
                }
                showToast(`✅ Datei validiert: ${validatedItems.length} Einträge bereit`);
            } catch (err) {
                showToast('❌ Import-Fehler: ' + err.message, 'error');
                console.error('[Import] Parse error:', err);
            }
            document.body.removeChild(fileInput);
        };
        reader.onerror = () => {
            showToast('❌ Datei konnte nicht gelesen werden', 'error');
            document.body.removeChild(fileInput);
        };
        reader.readAsText(file);
    });
    fileInput.click();
}
function executeImport(dataType) {
    const modal = $('import-modal');
    const items = JSON.parse(modal.dataset.importItems || '[]');
    const type = dataType || modal.dataset.dataType || '';
    const modeInput = document.querySelector('input[name="import-mode"]:checked');
    const mode = modeInput?.value || 'merge';
    if (!type || items.length === 0) {
        showToast('Keine Daten zum Importieren', 'error');
        return;
    }
    const D = window.D;
    const renderAll = window.renderAll;
    saveUndoState(`${items.length} ${type} importiert`);
    // Sicherheitskopie bei Replace-Modus
    if (mode === 'replace') {
        try {
            createAutoBackup();
            showToast('💾 Sicherheitskopie erstellt', 'info', 1000);
        } catch (err) {
            console.warn('[Import] Backup failed:', err);
        }
        D[type] = items;
    } else {
        // Merge: Neue IDs vergeben für importierte Einträge
        const getNextId = window.getNextId;
        const merged = items.map(item => {
            return { ...item, id: getNextId(type) };
        });
        D[type] = [...(D[type] || []), ...merged];
    }
    save();
    renderAll();
    updateIOCounts();
    hideModal('import-modal');
    showToast(
        `✅ ${items.length} ${type} importiert (${mode === 'replace' ? 'ersetzt' : 'hinzugefügt'})`
    );
}
// UTILITY FUNCTIONS
// ============================================================
function updateIOCounts() {
    const D = window.D;
    // Direct id mapping — keys are the actual element ids in the templates.
    // Not all follow `${key}-io-count`: encounter is singular, shops/notes/links
    // map to differently-named data arrays.
    const counts = {
        'party-io-count': D.characters?.length || 0,
        'npcs-io-count': D.npcs?.length || 0,
        'locations-io-count': D.locations?.length || 0,
        'quests-io-count': D.quests?.length || 0,
        'loot-io-count': D.loot?.length || 0,
        'spells-io-count': D.spells?.length || 0,
        'notes-io-count': D.sessionNotes?.length || 0,
        'encounter-io-count': D.encounters?.length || 0,
        'wiki-io-count': D.wiki?.length || 0,
        'links-io-count': D.links?.length || 0,
        'shops-io-count': D.shops?.length || 0
    };
    for (const [id, count] of Object.entries(counts)) {
        const el = $(id);
        if (el) el.textContent = String(count);
    }
    // Encounter-Runde aktualisieren
    const roundEl = $('encounter-round-num');
    if (roundEl) roundEl.textContent = String(D.initiative?.round || 1);
}
// Legacy: Alte exportSpells Funktion für Kompatibilität
function exportSpells() {
    exportData('spells');
}
// STAB-02 / D-09: Hinweis-Dialog bei echten Mindmap-Inhalten vor dem Import
// Modul-intern — kein window-Export (CLAUDE.md Export-Audit)
function showMindmapExportDialog(mindmap, campaignName) {
    return new Promise(resolve => {
        const safeName = (campaignName || 'kampagne')
            .replace(/[^a-zA-Z0-9äöüÄÖÜß\s\-]/g, '')
            .replace(/\s+/g, '-');
        const nodeCount = String(mindmap.nodes ? mindmap.nodes.length : 0);
        const connCount = String(mindmap.connections ? mindmap.connections.length : 0);
        const overlay = document.createElement('div');
        overlay.className = 'modal show';
        overlay.innerHTML =
            '<div class="modal-content" style="max-width:480px">' +
            '<h3>Mindmap-Daten gefunden</h3>' +
            '<p>Diese Kampagne enthält Mindmap-Inhalte (' +
            esc(nodeCount) +
            ' Knoten, ' +
            esc(connCount) +
            ' Verbindungen). Das Mindmap-Feature wurde entfernt — die Daten werden ' +
            'beim Import verworfen. Du kannst sie vorher als Datei sichern.</p>' +
            '<div style="display:grid;gap:8px;margin:12px 0">' +
            '<button data-act="save" class="btn btn-primary">Mindmap als JSON sichern</button>' +
            '<button data-act="skip" class="btn">Fortfahren</button>' +
            '</div></div>';
        overlay.addEventListener('click', ev => {
            const act = ev.target && ev.target.dataset ? ev.target.dataset.act : null;
            if (act === 'save') {
                // D-10: eigene JSON-Backup-Datei herunterladen
                const json = JSON.stringify(
                    {
                        nodes: mindmap.nodes || [],
                        connections: mindmap.connections || []
                    },
                    null,
                    2
                );
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mindmap-backup-' + safeName + '.json';
                a.click();
                URL.revokeObjectURL(url);
                showToast('Mindmap-Backup heruntergeladen', 'success');
                return; // Dialog offen lassen, bis Nutzer "Fortfahren" waehlt
            }
            if (act === 'skip') {
                document.body.removeChild(overlay);
                resolve(true);
            }
        });
        document.body.appendChild(overlay);
    });
}
// Legacy: Globaler Import (alte Funktion umbenennen)
function importDataGlobal() {
    const fileInput = $('import-file');
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async e => {
        try {
            const result = e.target?.result;
            const imp = JSON.parse(result);
            const D = window.D;
            const getCampaignIndex = window.getCampaignIndex;
            const saveCampaignIndex = window.saveCampaignIndex;
            const renderAll = window.renderAll;
            // Kampagnennamen aus Import holen
            const campaignName =
                imp._campaignName ||
                file.name.replace('.json', '').replace(/-\d{4}-\d{2}-\d{2}$/, '');
            // Benutzer fragen: Neue Kampagne oder aktuelle überschreiben?
            const choice = confirm(
                `Import: "${campaignName}"\n\n` +
                    `OK = Als neue Kampagne importieren\n` +
                    `Abbrechen = Aktuelle Kampagne überschreiben`
            );
            // STAB-02 / D-09: Mindmap-Inhalt pruefen, bevor er beim Import verworfen wird
            if (imp.mindmap) {
                const hasRealContent =
                    (imp.mindmap.nodes && imp.mindmap.nodes.length > 0) ||
                    (imp.mindmap.connections && imp.mindmap.connections.length > 0);
                if (hasRealContent) {
                    await showMindmapExportDialog(imp.mindmap, campaignName); // bietet JSON-Backup an (D-10)
                }
                delete imp.mindmap; // danach immer entfernen (Feature ist abgeschafft)
            }
            // Meta-Felder entfernen
            delete imp._campaignName;
            delete imp._exportDate;
            delete imp._version;
            // Migration
            if (imp.characters) {
                imp.characters = imp.characters.map(c => {
                    let bg = c.background || '';
                    let wt = c.weight || 0;
                    let pn = c.playerName || '';
                    if (c.notes && !bg) {
                        const m = c.notes.match(/Herkunft\s*:\s*([^\n]+)/i);
                        if (m) bg = m[1].trim();
                    }
                    if (c.notes && !wt) {
                        const m = c.notes.match(/Gewicht\s*:\s*(\d+)/i);
                        if (m) wt = parseInt(m[1]);
                    }
                    if (c.name?.includes('(') && !pn) {
                        const m = c.name.match(/\(([^)]+)\)/);
                        if (m) pn = m[1];
                    }
                    return {
                        ...c,
                        background: bg,
                        weight: wt,
                        playerName: pn,
                        hpCurrent: c.hpCurrent || 0,
                        hpMax: c.hpMax || 0,
                        spells: c.spells || []
                    };
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
                    locations: [],
                    npcs: [],
                    quests: [],
                    characters: [],
                    sessionNotes: [],
                    quickNotes: '',
                    initiative: { combatants: [], currentTurn: 0, round: 1 },
                    loot: [],
                    items: [],
                    encounters: [],
                    spells: [],
                    links: [],
                    filters: [],
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
                // Aktuelle Kampagne überschreiben (D is const, use Object.assign)
                // Soundboard-Audio stoppen — Web Audio überlebt sonst den Daten-Reset
                if (typeof window.stopAllTracks === 'function') window.stopAllTracks();
                Object.assign(D, imp);
                if (!D._nextId) D._nextId = {};
                renderAll();
                updateIOCounts();
                const quickNotes = $('quick-notes');
                if (quickNotes) quickNotes.value = D.quickNotes || '';
                save();
                showToast('Import OK!');
            }
        } catch (e) {
            alert('Fehler: ' + e.message);
        }
        fileInput.value = '';
    };
    reader.readAsText(file);
}
function copyData() {
    try {
        const D = window.D;
        const exp = { ...D };
        delete exp._nextId;
        const json = JSON.stringify(exp, null, 2);
        if (!navigator.clipboard) {
            throw new Error('Zwischenablage nicht verfügbar (HTTPS erforderlich)');
        }
        navigator.clipboard
            .writeText(json)
            .then(() => showToast('📋 Daten kopiert'))
            .catch(err => {
                showToast(
                    '⚠️ Automatisches Kopieren fehlgeschlagen. Bitte manuell kopieren.',
                    'warning'
                );
                console.warn('[Copy] Clipboard failed:', err);
            });
    } catch (err) {
        showToast('❌ Kopieren fehlgeschlagen: ' + err.message, 'error');
        console.error('[Copy] Error:', err);
    }
}
function clearStorage() {
    // Step 1: Strong warning with detailed explanation
    const confirmed = confirm(
        '⚠️ ACHTUNG: Alle Daten löschen?\n\n' +
            'Diese Aktion löscht ALLE Kampagnendaten unwiderruflich:\n' +
            '• Charaktere, NPCs, Orte\n' +
            '• Quests, Items, Zauber\n' +
            '• Initiative, Notizen, Wiki\n\n' +
            'Möchten Sie wirklich ALLES löschen?'
    );
    if (!confirmed) return;
    // Step 2: Double confirmation for safety
    const doubleCheck = confirm(
        '🚨 LETZTE WARNUNG!\n\n' + 'Bitte bestätigen Sie erneut: Alle Daten unwiderruflich löschen?'
    );
    if (!doubleCheck) return;
    // Step 3: Create safety backup before deletion
    try {
        createAutoBackup();
        showToast('💾 Sicherheitskopie erstellt', 'info', 1500);
    } catch (err) {
        console.warn('[Clear] Backup failed:', err);
    }
    // Step 4: Execute deletion
    const STORAGE_KEY = window.STORAGE_KEY;
    const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
    const result = StorageAPI.remove(key);
    if (result.success) {
        showToast('✅ Alle Daten gelöscht', 'info');
        setTimeout(() => location.reload(), 1000);
    } else {
        showToast('❌ Fehler beim Löschen', 'error');
        console.error('Clear storage failed:', result.error);
    }
}
// ============================================================
