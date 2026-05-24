// [SECTION:RANDOM_TABLES]
// ============================================================
// RANDOM TABLES - Custom Rollable Tables
// ============================================================
// ============================================================
// CONSTANTS
// ============================================================
const DEFAULT_DICE_TYPE = 6;
const DICE_TYPES = Object.freeze([4, 6, 8, 10, 12, 20, 100]);
const MAX_RANGE_SIZE = 100; // DoS-Schutz: Maximale Anzahl von Werten in einem Range
// ============================================================
// STATE
// ============================================================
let selectedTableId = null;
// ============================================================
// INITIALIZATION
// ============================================================
function initRandomTables() {
    const D = window.D;
    if (!D.randomTables) {
        D.randomTables = getDefaultRandomTables();
        window.save();
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
// ============================================================
// CORE FUNCTIONS
// ============================================================
/**
 * Würfelt auf einer Tabelle und gibt das Ergebnis zurück
 * Unterstützt sowohl das neue Range-Format als auch das alte Weight-Format
 * @param table - Die Tabelle mit entries
 * @returns { entry, roll, diceType } oder null
 */
function rollWeightedEntry(table) {
    if (!table?.entries?.length)
        return null;
    // Prüfe ob neues Range-Format (hat diceType und range in entries)
    const hasRanges = table.entries.some(e => e.range);
    if (hasRanges) {
        // Neues Format: Würfle echten Würfel und matche Range
        const diceType = table.diceType ?? DEFAULT_DICE_TYPE;
        const roll = Math.floor(Math.random() * diceType) + 1;
        // Finde passenden Eintrag
        for (const entry of table.entries) {
            const ranges = parseRange(entry.range || '');
            if (ranges.includes(roll)) {
                return { entry, roll, diceType };
            }
        }
        // Fallback: Kein passender Eintrag gefunden
        return { entry: { text: `Kein Eintrag für Wurf ${roll}` }, roll, diceType };
    }
    else {
        // Legacy Format: Gewichtetes Würfeln
        const totalWeight = table.entries.reduce((sum, e) => sum + (e.weight || 1), 0);
        let roll = Math.floor(Math.random() * totalWeight);
        const rollValue = roll + 1;
        for (let i = 0; i < table.entries.length; i++) {
            roll -= (table.entries[i].weight || 1);
            if (roll < 0) {
                return { entry: table.entries[i], roll: rollValue, diceType: totalWeight };
            }
        }
        // Fallback zum letzten Eintrag
        return { entry: table.entries[table.entries.length - 1], roll: totalWeight, diceType: totalWeight };
    }
}
/**
 * Parst einen Bereichs-String und gibt ein Array von Zahlen zurück
 * @param rangeStr - z.B. "1", "1-4", "5-8"
 * @param maxValue - Maximaler erlaubter Wert (DoS-Schutz)
 * @returns Array der abgedeckten Zahlen (nur positive, <= maxValue)
 */
function parseRange(rangeStr, maxValue = MAX_RANGE_SIZE) {
    if (!rangeStr || typeof rangeStr !== 'string')
        return [];
    const result = [];
    const parts = rangeStr.split(',').map(p => p.trim());
    for (const part of parts) {
        // DoS-Schutz: Abbrechen wenn zu viele Werte
        if (result.length >= maxValue)
            break;
        // Range-Format: "1-4" (muss mit Zahl beginnen um "-5" als einzelne Zahl zu erkennen)
        const rangeMatch = part.match(/^(\d+)-(\d+)$/);
        if (rangeMatch) {
            const start = parseInt(rangeMatch[1]);
            const end = parseInt(rangeMatch[2]);
            if (!isNaN(start) && !isNaN(end) && start >= 1 && end >= 1) {
                const min = Math.min(start, end);
                const max = Math.min(Math.max(start, end), maxValue); // DoS-Schutz
                for (let i = min; i <= max && result.length < maxValue; i++) {
                    if (!result.includes(i))
                        result.push(i);
                }
            }
        }
        else {
            // Einzelne Zahl
            const num = parseInt(part);
            if (!isNaN(num) && num >= 1 && num <= maxValue && !result.includes(num)) {
                result.push(num);
            }
        }
    }
    return result.sort((a, b) => a - b);
}
// ============================================================
// RENDERING
// ============================================================
function renderRandomTables() {
    const container = $('random-tables-list');
    if (!container) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            console.warn('[renderRandomTables] Container missing - likely not on dice tab');
        }
        return;
    }
    initRandomTables();
    const D = window.D;
    const tables = D.randomTables || [];
    if (!tables.length) {
        container.innerHTML = `
            <div class="rt-empty">
                <div class="rt-empty-icon">🎲</div>
                <div class="rt-empty-text">Keine Tabellen vorhanden</div>
                <button class="btn btn-primary" data-action="show-table-modal">+ Tabelle erstellen</button>
            </div>
        `;
        return;
    }
    container.innerHTML = tables.map(table => `
        <div class="rt-card ${selectedTableId === table.id ? 'selected' : ''}" data-id="${table.id}">
            <div class="rt-card-header" data-action="select-table" data-id="${table.id}">
                <span class="rt-card-icon">${esc(table.icon || '🎲')}</span>
                <span class="rt-card-name">${esc(table.name)}</span>
                <span class="rt-card-count">${table.entries.length} Einträge</span>
            </div>
            <div class="rt-card-actions">
                <button class="btn btn-sm btn-primary" data-action="roll-on-table" data-id="${table.id}" title="Würfeln">🎲</button>
                <button class="btn btn-sm" data-action="show-table-modal" data-id="${table.id}" title="Bearbeiten">✏️</button>
                <button class="btn btn-sm btn-danger" data-action="delete-table" data-id="${table.id}" title="Löschen">🗑️</button>
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
    if (!preview)
        return;
    const D = window.D;
    const table = D.randomTables?.find((t) => t.id === id);
    if (!table) {
        preview.innerHTML = '<div class="rt-preview-empty">Wähle eine Tabelle</div>';
        return;
    }
    const hasRanges = table.entries.some(e => e.range);
    const diceType = table.diceType ?? DEFAULT_DICE_TYPE;
    preview.innerHTML = `
        <div class="rt-preview-header">
            <span class="rt-preview-icon">${esc(table.icon || '🎲')}</span>
            <span class="rt-preview-name">${esc(table.name)}</span>
            ${hasRanges ? `<span class="rt-preview-dice">1W${diceType}</span>` : ''}
            <button class="rt-roll-btn" data-action="roll-on-table" data-id="${table.id}">🎲 Würfeln</button>
        </div>
        <div class="rt-preview-entries">
            ${table.entries.map((entry, idx) => {
        if (hasRanges) {
            // Neues Range-Format
            return `
                        <div class="rt-entry">
                            <span class="rt-entry-range">${esc(entry.range || '')}</span>
                            <span class="rt-entry-text">${esc(entry.text)}</span>
                        </div>
                    `;
        }
        else {
            // Legacy Weight-Format
            const totalWeight = table.entries.reduce((sum, e) => sum + (e.weight || 1), 0);
            const pct = Math.round((entry.weight || 1) / totalWeight * 100);
            return `
                        <div class="rt-entry">
                            <span class="rt-entry-num">${idx + 1}</span>
                            <span class="rt-entry-text">${esc(entry.text)}</span>
                            <span class="rt-entry-weight" title="Gewichtung: ${entry.weight || 1}">${pct}%</span>
                        </div>
                    `;
        }
    }).join('')}
        </div>
        <div class="rt-result-area" id="rt-result-${id}"></div>
    `;
}
function rollOnTable(id) {
    const D = window.D;
    const table = D.randomTables?.find((t) => t.id === id);
    const rollResult = rollWeightedEntry(table);
    if (!rollResult) {
        showToast('Tabelle ist leer', 'error');
        return;
    }
    const { entry: result, roll, diceType } = rollResult;
    // Ergebnis anzeigen
    const resultArea = $(`rt-result-${id}`);
    if (resultArea) {
        resultArea.innerHTML = `
            <div class="rt-result">
                <span class="rt-result-label">🎲 1W${diceType} = ${roll}:</span>
                <span class="rt-result-text">${esc(result.text)}</span>
            </div>
        `;
        resultArea.style.animation = 'none';
        resultArea.offsetHeight;
        resultArea.style.animation = 'pulse 0.3s ease-out';
    }
    showToast(`${esc(table.icon || '🎲')} [${roll}] ${esc(result.text)}`, 'info');
}
// ============================================================
// TABLE MODAL
// ============================================================
function showTableModal(id = null) {
    const D = window.D;
    const table = id ? D.randomTables?.find((t) => t.id === id) : undefined;
    const diceType = table?.diceType ?? DEFAULT_DICE_TYPE;
    const content = `
        <div class="rt-modal-content">
            <div class="rt-modal-header">
                <h3>${table ? '✏️ Tabelle bearbeiten' : '➕ Neue Tabelle'}</h3>
                <button class="btn btn-sm" data-action="hide-modal" data-value="table-modal">✕</button>
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

                <div class="rt-dice-section">
                    <label>Würfeltyp</label>
                    <div class="rt-dice-selector" id="table-dice-selector">
                        ${DICE_TYPES.map(d => `
                            <button type="button" class="rt-dice-btn ${d === diceType ? 'active' : ''}"
                                    data-dice="${d}" data-action="select-dice-type" data-value="${d}">
                                1W${d}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="table-dice-type" value="${diceType}">
                </div>

                <div class="rt-entries-section">
                    <div class="rt-entries-header">
                        <label>Einträge <span class="rt-dice-label">(1W${diceType})</span></label>
                        <div class="rt-entries-actions">
                            <button class="btn btn-sm" data-action="fill-remaining-ranges" title="Leere Bereiche auffüllen">⚡ Auto</button>
                            <button class="btn btn-sm" data-action="add-table-entry">+ Eintrag</button>
                        </div>
                    </div>
                    <div class="rt-entries-list" id="table-entries">
                        ${(table?.entries || [{ range: '1', text: '' }]).map((e, i) => renderTableEntryRow(i, e)).join('')}
                    </div>
                    <div class="rt-range-hint" id="rt-range-hint"></div>
                </div>
            </div>

            <div class="rt-modal-footer">
                <button class="btn" data-action="hide-modal" data-value="table-modal">Abbrechen</button>
                <button class="btn btn-primary" data-action="save-table">💾 Speichern</button>
            </div>
        </div>
    `;
    let modal = $('table-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'table-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal" style="max-width: 650px;">${content}</div>`;
        modal.onclick = (e) => {
            if (e.target === modal)
                hideModal('table-modal');
        };
        document.body.appendChild(modal);
    }
    else {
        const modalContent = modal.querySelector('.modal');
        if (modalContent)
            modalContent.innerHTML = content;
    }
    showModal('table-modal');
    $('table-name')?.focus();
    updateRangeHint();
}
function selectDiceType(diceType) {
    const input = $('table-dice-type');
    if (input)
        input.value = String(diceType);
    // Update button states
    document.querySelectorAll('.rt-dice-btn').forEach(btn => {
        const btnDice = parseInt(btn.dataset.dice || '0');
        btn.classList.toggle('active', btnDice === diceType);
    });
    // Update label
    const label = document.querySelector('.rt-dice-label');
    if (label)
        label.textContent = `(1W${diceType})`;
    updateRangeHint();
}
function renderTableEntryRow(index, entry = { range: '', text: '' }) {
    // Support both old (weight) and new (range) format
    const rangeValue = entry.range || '';
    return `
        <div class="rt-entry-row" data-index="${index}">
            <input type="text" class="rt-entry-range" value="${esc(rangeValue)}"
                   placeholder="z.B. 1-4" title="Bereich (z.B. 1, 1-4, 5-8)"
                   data-on-input="updateRangeHint">
            <input type="text" class="rt-entry-text" value="${esc(entry.text)}" placeholder="Eintrag...">
            <button class="btn btn-sm btn-danger" data-action="remove-table-entry" data-value="${index}">✕</button>
        </div>
    `;
}
/**
 * Aktualisiert den Hinweis über abgedeckte/fehlende Bereiche
 */
function updateRangeHint() {
    const hint = $('rt-range-hint');
    if (!hint)
        return;
    const diceTypeInput = $('table-dice-type');
    const diceType = parseInt(diceTypeInput?.value || String(DEFAULT_DICE_TYPE));
    const rows = $('table-entries')?.querySelectorAll('.rt-entry-row') || [];
    // Sammle alle abgedeckten Zahlen
    const covered = new Set();
    rows.forEach(row => {
        const rangeInput = row.querySelector('.rt-entry-range');
        const rangeStr = rangeInput?.value || '';
        parseRange(rangeStr).forEach(n => {
            if (n >= 1 && n <= diceType)
                covered.add(n);
        });
    });
    // Finde fehlende Zahlen
    const missing = [];
    for (let i = 1; i <= diceType; i++) {
        if (!covered.has(i))
            missing.push(i);
    }
    // Zeige Hinweis
    if (missing.length === 0) {
        hint.innerHTML = `<span class="rt-hint-ok">✓ Alle Werte (1-${diceType}) abgedeckt</span>`;
        hint.className = 'rt-range-hint complete';
    }
    else if (missing.length === diceType) {
        hint.innerHTML = `<span class="rt-hint-info">Trage Bereiche ein (1-${diceType})</span>`;
        hint.className = 'rt-range-hint empty';
    }
    else {
        // Gruppiere aufeinanderfolgende Zahlen
        const groups = [];
        let start = missing[0], end = missing[0];
        for (let i = 1; i <= missing.length; i++) {
            if (missing[i] === end + 1) {
                end = missing[i];
            }
            else {
                groups.push(start === end ? `${start}` : `${start}-${end}`);
                start = end = missing[i];
            }
        }
        hint.innerHTML = `<span class="rt-hint-warn">⚠ Fehlend: ${groups.join(', ')}</span>`;
        hint.className = 'rt-range-hint incomplete';
    }
}
/**
 * Füllt leere Bereiche automatisch mit den nächsten verfügbaren Werten
 */
function fillRemainingRanges() {
    const diceTypeInput = $('table-dice-type');
    const diceType = parseInt(diceTypeInput?.value || String(DEFAULT_DICE_TYPE));
    const rows = Array.from($('table-entries')?.querySelectorAll('.rt-entry-row') || []);
    // Sammle bereits verwendete Zahlen
    const used = new Set();
    rows.forEach(row => {
        const rangeInput = row.querySelector('.rt-entry-range');
        const rangeStr = rangeInput?.value || '';
        parseRange(rangeStr).forEach(n => {
            if (n >= 1 && n <= diceType)
                used.add(n);
        });
    });
    // Finde fehlende Zahlen
    const available = [];
    for (let i = 1; i <= diceType; i++) {
        if (!used.has(i))
            available.push(i);
    }
    if (available.length === 0) {
        showToast('Alle Bereiche sind bereits belegt', 'info');
        return;
    }
    // Finde leere Range-Felder und fülle sie
    let filled = 0;
    for (const row of rows) {
        const rangeInput = row.querySelector('.rt-entry-range');
        if (rangeInput && !rangeInput.value.trim() && available.length > 0) {
            rangeInput.value = String(available.shift());
            filled++;
        }
    }
    // Falls noch Werte übrig: Füge neue Zeilen hinzu
    while (available.length > 0) {
        addTableEntry();
        const newRows = $('table-entries')?.querySelectorAll('.rt-entry-row');
        if (newRows) {
            const lastRow = newRows[newRows.length - 1];
            const rangeInput = lastRow?.querySelector('.rt-entry-range');
            if (rangeInput) {
                rangeInput.value = String(available.shift());
                filled++;
            }
        }
    }
    updateRangeHint();
    showToast(`${filled} Bereich(e) aufgefüllt`, 'success');
}
function addTableEntry() {
    const list = $('table-entries');
    if (!list)
        return;
    const count = list.children.length;
    const div = document.createElement('div');
    div.innerHTML = renderTableEntryRow(count);
    const firstChild = div.firstElementChild;
    if (firstChild)
        list.appendChild(firstChild);
}
function removeTableEntry(index) {
    const list = $('table-entries');
    if (!list || list.children.length <= 1) {
        showToast('Mindestens ein Eintrag erforderlich', 'warning');
        return;
    }
    const child = list.children[index];
    if (child)
        child.remove();
    // Re-Index
    Array.from(list.children).forEach((row, i) => {
        row.dataset.index = String(i);
        const btn = row.querySelector('.btn-danger');
        if (btn)
            btn.onclick = () => removeTableEntry(i);
    });
}
function saveTable() {
    const nameInput = $('table-name');
    const name = nameInput?.value?.trim();
    if (!name) {
        showToast('Name erforderlich', 'error');
        return;
    }
    // Icon validieren: Nur 1-2 Zeichen erlaubt (Emoji oder Textzeichen)
    const iconInput = $('table-icon');
    let icon = iconInput?.value?.trim() || '🎲';
    if ([...icon].length > 2) {
        icon = [...icon].slice(0, 2).join(''); // Auf 2 Zeichen kürzen
    }
    const diceTypeInput = $('table-dice-type');
    const diceType = parseInt(diceTypeInput?.value || String(DEFAULT_DICE_TYPE));
    const editIdInput = $('table-edit-id');
    const editId = editIdInput?.value;
    // Einträge sammeln (neues Range-Format)
    const entries = [];
    const rows = $('table-entries')?.querySelectorAll('.rt-entry-row');
    rows?.forEach(row => {
        const rangeInput = row.querySelector('.rt-entry-range');
        const textInput = row.querySelector('.rt-entry-text');
        const range = rangeInput?.value?.trim() || '';
        const text = textInput?.value?.trim();
        if (text && range) {
            entries.push({ range, text });
        }
    });
    if (!entries.length) {
        showToast('Mindestens ein Eintrag mit Bereich erforderlich', 'error');
        return;
    }
    // Prüfe ob alle Würfelwerte abgedeckt sind
    const covered = new Set();
    entries.forEach(e => {
        parseRange(e.range || '').forEach(n => {
            if (n >= 1 && n <= diceType)
                covered.add(n);
        });
    });
    if (covered.size < diceType) {
        const missing = [];
        for (let i = 1; i <= diceType; i++) {
            if (!covered.has(i))
                missing.push(i);
        }
        if (!confirm(`Warnung: Nicht alle Würfelwerte abgedeckt!\nFehlend: ${missing.join(', ')}\n\nTrotzdem speichern?`)) {
            return;
        }
    }
    initRandomTables();
    const D = window.D;
    window.pushUndo(editId ? 'Tabelle bearbeitet' : 'Tabelle erstellt');
    if (editId) {
        // Update
        const idx = D.randomTables.findIndex((t) => t.id === parseInt(editId));
        if (idx > -1) {
            D.randomTables[idx] = { ...D.randomTables[idx], name, icon, diceType, entries };
        }
    }
    else {
        // Neu
        D.randomTables.push({
            id: nextId('randomTables'),
            name,
            icon,
            diceType,
            entries
        });
    }
    hideModal('table-modal');
    window.save();
    renderRandomTables();
    showToast('Tabelle gespeichert', 'success');
}
function deleteTable(id) {
    if (!confirm('Tabelle wirklich löschen?'))
        return;
    const D = window.D;
    window.pushUndo('Tabelle gelöscht');
    D.randomTables = (D.randomTables || []).filter((t) => t.id !== id);
    if (selectedTableId === id) {
        selectedTableId = null;
        const preview = $('random-table-preview');
        if (preview)
            preview.innerHTML = '<div class="rt-preview-empty">Wähle eine Tabelle</div>';
    }
    window.save();
    renderRandomTables();
    showToast('Tabelle gelöscht');
}
// ============================================================
// GENERATOR MODAL (Dashboard-Button)
// ============================================================
function showGeneratorModal() {
    initRandomTables();
    const D = window.D;
    const tables = D.randomTables || [];
    const content = `
        <div class="generator-modal-content">
            <div class="generator-modal-header">
                <h3>🎭 Zufalls-Generator</h3>
                <button class="btn btn-sm" data-action="hide-modal" data-value="generator-modal">✕</button>
            </div>

            <div class="generator-toolbar">
                <button class="btn btn-primary" data-action="show-table-modal">+ Neue Tabelle</button>
            </div>

            <div class="generator-tables" id="generator-tables-list">
                ${tables.length ? tables.map(t => {
        const hasRanges = t.entries?.some(e => e.range);
        const diceType = t.diceType ?? DEFAULT_DICE_TYPE;
        return `
                    <div class="generator-table-card">
                        <div class="generator-table-info">
                            <span class="generator-table-icon">${esc(t.icon || '🎲')}</span>
                            <span class="generator-table-name">${esc(t.name)}</span>
                            ${hasRanges ? `<span class="generator-table-dice">1W${diceType}</span>` : ''}
                            <span class="generator-table-count">${t.entries.length} Einträge</span>
                        </div>
                        <div class="generator-table-actions">
                            <button class="btn btn-primary" data-action="roll-on-table-show" data-id="${t.id}">🎲 Würfeln</button>
                            <button class="btn btn-sm" data-action="show-table-modal" data-id="${t.id}">✏️</button>
                            <button class="btn btn-sm btn-danger" data-action="delete-table-refresh" data-id="${t.id}">🗑️</button>
                        </div>
                    </div>
                `;
    }).join('') : `
                    <div class="generator-empty">
                        <div class="generator-empty-icon">🎲</div>
                        <div class="generator-empty-text">Keine Tabellen vorhanden</div>
                        <p>Erstelle Zufallstabellen für Begegnungen, Wetter, Gerüchte und mehr!</p>
                    </div>
                `}
            </div>

            <div class="generator-result" id="generator-result"></div>
        </div>
    `;
    let modal = $('generator-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'generator-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal" style="max-width: 800px;">${content}</div>`;
        modal.onclick = (e) => {
            if (e.target === modal)
                hideModal('generator-modal');
        };
        document.body.appendChild(modal);
    }
    else {
        const modalContent = modal.querySelector('.modal');
        if (modalContent)
            modalContent.innerHTML = content;
    }
    showModal('generator-modal');
}
function rollOnTableAndShow(id) {
    const D = window.D;
    const table = D.randomTables?.find((t) => t.id === id);
    const rollResult = rollWeightedEntry(table);
    if (!rollResult) {
        showToast('Tabelle ist leer', 'error');
        return;
    }
    const { entry: result, roll, diceType } = rollResult;
    // Ergebnis im Modal anzeigen
    const resultArea = $('generator-result');
    if (resultArea) {
        resultArea.innerHTML = `
            <div class="generator-result-box">
                <div class="generator-result-header">
                    <span class="generator-result-icon">${esc(table.icon || '🎲')}</span>
                    <span class="generator-result-table">${esc(table.name)}</span>
                </div>
                <div class="generator-result-text">${esc(result.text)}</div>
                <div class="generator-result-roll">🎲 1W${diceType} = ${roll}</div>
            </div>
        `;
        resultArea.style.animation = 'none';
        resultArea.offsetHeight;
        resultArea.style.animation = 'pulse 0.3s ease-out';
    }
}
function deleteTableAndRefresh(id) {
    if (!confirm('Tabelle wirklich löschen?'))
        return;
    const D = window.D;
    window.pushUndo('Tabelle gelöscht');
    D.randomTables = (D.randomTables || []).filter((t) => t.id !== id);
    window.save();
    renderRandomTables();
    showGeneratorModal(); // Refresh
    showToast('Tabelle gelöscht');
}
function quickRandomRoll() {
    initRandomTables();
    const D = window.D;
    if (!D.randomTables?.length) {
        showToast('Keine Tabellen vorhanden', 'error');
        return;
    }
    // Modal mit Tabellen-Auswahl
    const content = `
        <div style="padding: 20px;">
            <h3 style="margin: 0 0 16px 0;">🎲 Schnellwurf</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${D.randomTables.map((t) => `
                    <button class="btn" data-action="quick-roll-table" data-id="${t.id}" style="justify-content: flex-start; gap: 10px;">
                        <span>${esc(t.icon || '🎲')}</span>
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
        modal.onclick = (e) => {
            if (e.target === modal)
                hideModal('quick-roll-modal');
        };
        document.body.appendChild(modal);
    }
    else {
        const modalContent = modal.querySelector('.modal');
        if (modalContent)
            modalContent.innerHTML = content;
    }
    showModal('quick-roll-modal');
}
// ============================================================
// GLOBAL EXPORTS (for backward compatibility)
// ============================================================
// Export functions to window for onclick handlers
window.renderRandomTables = renderRandomTables;
window.rollOnTable = rollOnTable;
window.showTableModal = showTableModal;
window.deleteTable = deleteTable;
window.showGeneratorModal = showGeneratorModal;
window.quickRandomRoll = quickRandomRoll;
