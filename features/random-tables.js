// [SECTION:RANDOM_TABLES]
// ============================================================
// RANDOM TABLES - Custom Rollable Tables
// ============================================================

/**
 * Random Tables System
 * - Erstelle eigene Zufallstabellen
 * - Würfle auf Tabellen
 * - Speichere in D.randomTables
 */

// Initialisiere randomTables falls nicht vorhanden
function initRandomTables() {
    if (!D.randomTables) {
        D.randomTables = getDefaultRandomTables();
        save();
    }
}

function getDefaultRandomTables() {
    return [
        {
            id: 1,
            name: 'Zufällige Begegnung - Wald',
            icon: '🌲',
            entries: [
                { weight: 1, text: '1d4 Wölfe' },
                { weight: 1, text: '1 Eulenbär' },
                { weight: 2, text: 'Reisende Händler' },
                { weight: 2, text: '1d6 Banditen' },
                { weight: 1, text: '1 Troll' },
                { weight: 2, text: 'Nichts besonderes' },
                { weight: 1, text: '1 Grüner Drache (Jung)' }
            ]
        },
        {
            id: 2,
            name: 'Tavernen-Gerüchte',
            icon: '🍺',
            entries: [
                { weight: 1, text: 'Ein Drache wurde in den Bergen gesichtet' },
                { weight: 1, text: 'Die Ernte dieses Jahr wird schlecht' },
                { weight: 1, text: 'Der Lord sucht Abenteurer für eine Mission' },
                { weight: 1, text: 'Goblins überfallen die Handelsrouten' },
                { weight: 1, text: 'In den Ruinen soll ein Schatz verborgen sein' },
                { weight: 1, text: 'Der Schmied verkauft magische Waffen unter der Hand' }
            ]
        },
        {
            id: 3,
            name: 'Wetter',
            icon: '🌤️',
            entries: [
                { weight: 3, text: 'Sonnig und mild' },
                { weight: 2, text: 'Bewölkt' },
                { weight: 2, text: 'Leichter Regen' },
                { weight: 1, text: 'Starker Regen/Gewitter' },
                { weight: 1, text: 'Nebelig' },
                { weight: 1, text: 'Starker Wind' }
            ]
        }
    ];
}

let selectedTableId = null;

function renderRandomTables() {
    const container = $('random-tables-list');
    if (!container) return;

    initRandomTables();
    const tables = D.randomTables || [];

    if (!tables.length) {
        container.innerHTML = `
            <div class="rt-empty">
                <div class="rt-empty-icon">🎲</div>
                <div class="rt-empty-text">Keine Tabellen vorhanden</div>
                <button class="btn btn-primary" onclick="showTableModal()">+ Tabelle erstellen</button>
            </div>
        `;
        return;
    }

    container.innerHTML = tables.map(table => `
        <div class="rt-card ${selectedTableId === table.id ? 'selected' : ''}" data-id="${table.id}">
            <div class="rt-card-header" onclick="selectTable(${table.id})">
                <span class="rt-card-icon">${table.icon || '🎲'}</span>
                <span class="rt-card-name">${esc(table.name)}</span>
                <span class="rt-card-count">${table.entries.length} Einträge</span>
            </div>
            <div class="rt-card-actions">
                <button class="btn btn-sm btn-primary" onclick="rollOnTable(${table.id})" title="Würfeln">🎲</button>
                <button class="btn btn-sm" onclick="showTableModal(${table.id})" title="Bearbeiten">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="deleteTable(${table.id})" title="Löschen">🗑️</button>
            </div>
        </div>
    `).join('');
}

function selectTable(id) {
    selectedTableId = id;
    renderRandomTables();
    showTablePreview(id);
}

function showTablePreview(id) {
    const preview = $('random-table-preview');
    if (!preview) return;

    const table = D.randomTables?.find(t => t.id === id);
    if (!table) {
        preview.innerHTML = '<div class="rt-preview-empty">Wähle eine Tabelle</div>';
        return;
    }

    const totalWeight = table.entries.reduce((sum, e) => sum + (e.weight || 1), 0);

    preview.innerHTML = `
        <div class="rt-preview-header">
            <span class="rt-preview-icon">${table.icon || '🎲'}</span>
            <span class="rt-preview-name">${esc(table.name)}</span>
            <button class="rt-roll-btn" onclick="rollOnTable(${table.id})">🎲 Würfeln</button>
        </div>
        <div class="rt-preview-entries">
            ${table.entries.map((entry, idx) => {
                const pct = Math.round((entry.weight || 1) / totalWeight * 100);
                return `
                    <div class="rt-entry">
                        <span class="rt-entry-num">${idx + 1}</span>
                        <span class="rt-entry-text">${esc(entry.text)}</span>
                        <span class="rt-entry-weight" title="Gewichtung: ${entry.weight || 1}">${pct}%</span>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="rt-result-area" id="rt-result-${id}"></div>
    `;
}

function rollOnTable(id) {
    const table = D.randomTables?.find(t => t.id === id);
    if (!table || !table.entries.length) {
        showToast('Tabelle ist leer', 'error');
        return;
    }

    // Gewichtetes Würfeln
    const totalWeight = table.entries.reduce((sum, e) => sum + (e.weight || 1), 0);
    let roll = Math.floor(Math.random() * totalWeight);
    let result = null;
    let resultIdx = 0;

    for (let i = 0; i < table.entries.length; i++) {
        roll -= (table.entries[i].weight || 1);
        if (roll < 0) {
            result = table.entries[i];
            resultIdx = i + 1;
            break;
        }
    }

    if (!result) {
        result = table.entries[table.entries.length - 1];
        resultIdx = table.entries.length;
    }

    // Ergebnis anzeigen
    const resultArea = $(`rt-result-${id}`);
    if (resultArea) {
        resultArea.innerHTML = `
            <div class="rt-result">
                <span class="rt-result-label">🎲 Ergebnis (${resultIdx}):</span>
                <span class="rt-result-text">${esc(result.text)}</span>
            </div>
        `;
        resultArea.style.animation = 'none';
        resultArea.offsetHeight;
        resultArea.style.animation = 'pulse 0.3s ease-out';
    }

    showToast(`${table.icon || '🎲'} ${result.text}`, 'info');
}

function showTableModal(id = null) {
    const table = id ? D.randomTables?.find(t => t.id === id) : null;

    const content = `
        <div class="rt-modal-content">
            <div class="rt-modal-header">
                <h3>${table ? '✏️ Tabelle bearbeiten' : '➕ Neue Tabelle'}</h3>
                <button class="btn btn-sm" onclick="hideModal('table-modal')">✕</button>
            </div>

            <div class="rt-form">
                <input type="hidden" id="table-edit-id" value="${table?.id || ''}">

                <div class="rt-form-row">
                    <div class="rt-field">
                        <label>Name</label>
                        <input type="text" id="table-name" value="${esc(table?.name || '')}" placeholder="Tabellenname...">
                    </div>
                    <div class="rt-field rt-field-sm">
                        <label>Icon</label>
                        <input type="text" id="table-icon" value="${table?.icon || '🎲'}" placeholder="🎲" maxlength="2">
                    </div>
                </div>

                <div class="rt-entries-section">
                    <div class="rt-entries-header">
                        <label>Einträge</label>
                        <button class="btn btn-sm" onclick="addTableEntry()">+ Eintrag</button>
                    </div>
                    <div class="rt-entries-list" id="table-entries">
                        ${(table?.entries || [{ weight: 1, text: '' }]).map((e, i) => renderTableEntryRow(i, e)).join('')}
                    </div>
                </div>
            </div>

            <div class="rt-modal-footer">
                <button class="btn" onclick="hideModal('table-modal')">Abbrechen</button>
                <button class="btn btn-primary" onclick="saveTable()">💾 Speichern</button>
            </div>
        </div>
    `;

    let modal = $('table-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'table-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal" style="max-width: 600px;">${content}</div>`;
        modal.onclick = (e) => { if (e.target === modal) hideModal('table-modal'); };
        document.body.appendChild(modal);
    } else {
        modal.querySelector('.modal').innerHTML = content;
    }

    showModal('table-modal');
    $('table-name')?.focus();
}

function renderTableEntryRow(index, entry = { weight: 1, text: '' }) {
    return `
        <div class="rt-entry-row" data-index="${index}">
            <input type="number" class="rt-entry-weight" value="${entry.weight || 1}" min="1" max="10" title="Gewichtung">
            <input type="text" class="rt-entry-text" value="${esc(entry.text)}" placeholder="Eintrag...">
            <button class="btn btn-sm btn-danger" onclick="removeTableEntry(${index})">✕</button>
        </div>
    `;
}

function addTableEntry() {
    const list = $('table-entries');
    if (!list) return;

    const count = list.children.length;
    const div = document.createElement('div');
    div.innerHTML = renderTableEntryRow(count);
    list.appendChild(div.firstElementChild);
}

function removeTableEntry(index) {
    const list = $('table-entries');
    if (!list || list.children.length <= 1) {
        showToast('Mindestens ein Eintrag erforderlich', 'warning');
        return;
    }

    list.children[index]?.remove();

    // Re-Index
    Array.from(list.children).forEach((row, i) => {
        row.dataset.index = i;
        row.querySelector('.btn-danger').onclick = () => removeTableEntry(i);
    });
}

function saveTable() {
    const name = $('table-name')?.value?.trim();
    if (!name) {
        showToast('Name erforderlich', 'error');
        return;
    }

    const icon = $('table-icon')?.value || '🎲';
    const editId = $('table-edit-id')?.value;

    // Einträge sammeln
    const entries = [];
    const rows = $('table-entries')?.querySelectorAll('.rt-entry-row');
    rows?.forEach(row => {
        const weight = parseInt(row.querySelector('.rt-entry-weight')?.value) || 1;
        const text = row.querySelector('.rt-entry-text')?.value?.trim();
        if (text) {
            entries.push({ weight, text });
        }
    });

    if (!entries.length) {
        showToast('Mindestens ein Eintrag erforderlich', 'error');
        return;
    }

    initRandomTables();

    if (editId) {
        // Update
        const idx = D.randomTables.findIndex(t => t.id === parseInt(editId));
        if (idx > -1) {
            D.randomTables[idx] = { ...D.randomTables[idx], name, icon, entries };
        }
    } else {
        // Neu
        D.randomTables.push({
            id: Date.now(),
            name,
            icon,
            entries
        });
    }

    hideModal('table-modal');
    save();
    renderRandomTables();
    showToast('Tabelle gespeichert', 'success');
}

function deleteTable(id) {
    if (!confirm('Tabelle wirklich löschen?')) return;

    pushUndo('Tabelle gelöscht');
    D.randomTables = (D.randomTables || []).filter(t => t.id !== id);

    if (selectedTableId === id) {
        selectedTableId = null;
        const preview = $('random-table-preview');
        if (preview) preview.innerHTML = '<div class="rt-preview-empty">Wähle eine Tabelle</div>';
    }

    save();
    renderRandomTables();
    showToast('Tabelle gelöscht');
}

// Quick Roll Button für Dashboard
function quickRandomRoll() {
    initRandomTables();

    if (!D.randomTables?.length) {
        showToast('Keine Tabellen vorhanden', 'error');
        return;
    }

    // Modal mit Tabellen-Auswahl
    const content = `
        <div style="padding: 20px;">
            <h3 style="margin: 0 0 16px 0;">🎲 Schnellwurf</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${D.randomTables.map(t => `
                    <button class="btn" onclick="rollOnTable(${t.id}); hideModal('quick-roll-modal');" style="justify-content: flex-start; gap: 10px;">
                        <span>${t.icon || '🎲'}</span>
                        <span>${esc(t.name)}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    let modal = $('quick-roll-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'quick-roll-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal" style="max-width: 400px;">${content}</div>`;
        modal.onclick = (e) => { if (e.target === modal) hideModal('quick-roll-modal'); };
        document.body.appendChild(modal);
    } else {
        modal.querySelector('.modal').innerHTML = content;
    }

    showModal('quick-roll-modal');
}
