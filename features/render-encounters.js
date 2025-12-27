// ============================================================
// ENCOUNTERS - Render-Funktionen  
// ============================================================
// Extrahiert aus render/main.js

function renderEncounters() {
    const c = $('encounter-list'); if (!c) return;
    
    // Counter aktualisieren
    updateCounters({ 'encounter-io-count': D.encounters?.length || 0 });
    
    // Suche
    const search = ($('encounter-search')?.value || '').toLowerCase();
    let encounters = [...(D.encounters || [])];
    
    if (search) {
        encounters = encounters.filter(e => 
            e.name.toLowerCase().includes(search) ||
            (e.creatureType || '').toLowerCase().includes(search) ||
            (e.race || '').toLowerCase().includes(search)
        );
    }
    
    if (!encounters.length) { 
        c.innerHTML = renderEmptyState({
            icon: '👹',
            titleEmpty: 'Keine Encounter',
            descEmpty: 'Erstelle Monster und Gegner für deine Kämpfe.',
            buttonText: '➕ Encounter erstellen',
            buttonAction: 'toggle-collapse',
            buttonValue: 'enc-form',
            isFiltered: !!search
        });
        return; 
    }
    
    // Container-Klasse je nach View-Mode
    c.className = viewModes.encounters === 'list' ? 'list-view-container' : 'encounter-grid';
    
    // Listenansicht (kompakt)
    if (viewModes.encounters === 'list') {
        c.innerHTML = encounters.map(e => {
            // Attribute berechnen
            const attrs = ['str','dex','con','int','wis','cha'].map(a => {
                const val = e[a] || 10;
                const mod = Math.floor((val - 10) / 2);
                const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
                const name = a.toUpperCase().replace('STR','STÄ').replace('DEX','GES').replace('CON','KON').replace('WIS','WEI');
                return `<span style="display: inline-block; text-align: center; padding: 4px 8px; background: var(--bg-dark); border-radius: 4px; min-width: 50px;"><span style="color: var(--text-dim); font-size: 0.75em;">${name}</span><br><span style="color: var(--cyan);">${val}</span> <span style="font-size: 0.8em; color: ${mod >= 0 ? 'var(--green)' : 'var(--red)'};">${modStr}</span></span>`;
            }).join('');
            
            return `
                <div class="list-view-row encounter-row" data-action="toggle-encounter-card" data-id="${e.id}">
                    <div class="row-icon"><span class="row-toggle">▶</span></div>
                    <div class="row-main">
                        <div class="row-title">${esc(e.name)}</div>
                        <div class="row-subtitle">${esc(e.creatureType || e.race || 'Unbekannt')}</div>
                    </div>
                    <div class="row-cr" title="Challenge Rating">CR ${e.cr || '—'}</div>
                    <div class="row-stats">
                        <span class="stat-ac" title="Rüstungsklasse">🛡️ ${e.ac || '—'}</span>
                        <span class="stat-hp" title="Trefferpunkte">❤️ ${e.hp || '—'}</span>
                    </div>
                    <div class="row-actions" data-stop-propagation="true">
                        <button class="btn btn-sm" data-action="load-enc-stop" data-id="${e.id}" title="Zum Kampf">⚔️</button>
                        <button class="btn btn-sm" data-action="edit-enc-stop" data-id="${e.id}" title="Bearbeiten">✏️</button>
                        <button class="btn btn-sm btn-danger" data-action="delete-enc-stop" data-id="${e.id}" title="Löschen">🗑️</button>
                    </div>
                    <div class="row-details">
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                            <span>⚡ <strong>Init:</strong> ${e.init || '—'}</span>
                            <span>🏃 <strong>Speed:</strong> ${esc(e.speed || '—')}</span>
                            <span>👁️ <strong>Wahr:</strong> ${e.perception || '—'}</span>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">${attrs}</div>
                        ${e.actions ? `<div style="margin-top: 8px;"><span style="color: var(--red);">⚔️ Aktionen:</span> ${stripHtml(e.actions)}</div>` : ''}
                        ${e.traits ? `<div style="margin-top: 4px;"><span style="color: var(--purple);">⚡ Eigenschaften:</span> ${stripHtml(e.traits)}</div>` : ''}
                        ${(e.resistances?.length || e.immunities?.length) ? `<div style="margin-top: 4px;">${e.resistances?.length ? `<span style="color: var(--cyan);">🛡️ Res: ${e.resistances.join(', ')}</span>` : ''}${e.immunities?.length ? ` <span style="color: var(--gold);">⭐ Imm: ${e.immunities.join(', ')}</span>` : ''}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        return;
    }
    
    // Grid-Ansicht (volle Karten)
    c.innerHTML = encounters.map(e => {
        const isExpanded = expandedEncounterCards.has(e.id);
        const attrs = ['str','dex','con','int','wis','cha'].map(a => {
            const val = e[a] || 10;
            const mod = Math.floor((val - 10) / 2);
            const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
            return { name: a.toUpperCase().replace('STR','STÄ').replace('DEX','GES').replace('CON','KON').replace('WIS','WEI'), val, mod: modStr };
        });
        const languages = Array.isArray(e.languages) ? e.languages.join(', ') : (e.languages || '—');
        
        return `<div class="encounter-card ${isExpanded ? 'expanded' : ''}" data-enc-id="${e.id}">
            <div class="encounter-header" data-action="toggle-encounter-card" data-id="${e.id}">
                <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                    <div style="flex: 1;">
                        <div class="encounter-name">${esc(e.name)}</div>
                        <div class="encounter-race">${esc(e.creatureType || e.race || '')}${e.cr ? ` • CR ${e.cr}` : ''}</div>
                    </div>
                    <div class="encounter-compact-stats">
                        <span title="RK">🛡️${e.ac || '—'}</span>
                        <span title="HP">❤️${e.hp || '—'}</span>
                        <span title="Initiative">⚡${e.init || '—'}</span>
                    </div>
                </div>
                <span class="encounter-toggle">▶</span>
            </div>
            <div class="encounter-content">
                <div class="encounter-stats">
                    <div class="encounter-stat"><div class="encounter-stat-label">RK</div><div class="encounter-stat-value">${e.ac || '—'}</div></div>
                    <div class="encounter-stat"><div class="encounter-stat-label">HP</div><div class="encounter-stat-value">${e.hp || '—'}</div></div>
                    <div class="encounter-stat"><div class="encounter-stat-label">Init</div><div class="encounter-stat-value">${e.init || '—'}</div></div>
                    <div class="encounter-stat"><div class="encounter-stat-label">Speed</div><div class="encounter-stat-value">${esc(e.speed || '—')}</div></div>
                    <div class="encounter-stat"><div class="encounter-stat-label">Wahr.</div><div class="encounter-stat-value">${e.perception || '—'}</div></div>
                </div>
                <div style="font-size:0.75em; color:var(--text-dim); margin: 6px 0;">🗣️ ${esc(languages)}</div>
                <div class="encounter-abilities">${attrs.map(a => `<div class="ability-box"><div class="ability-name">${a.name}</div><div class="ability-value">${a.val}</div><div class="ability-mod">${a.mod}</div></div>`).join('')}</div>
                ${e.savingThrows && Object.keys(e.savingThrows).length > 0 ? `<div style="font-size:0.75em; margin-top:6px; color:var(--green);">🛡️ <span style="color:var(--text-dim);">Rettungswürfe:</span> ${Object.keys(e.savingThrows).filter(k => e.savingThrows[k]).map(attr => {
                    const val = e[attr] || 10;
                    const mod = Math.floor((val - 10) / 2);
                    const profBonus = Math.max(2, Math.floor((parseInt(e.cr) || 0) / 4) + 2);
                    const total = mod + profBonus;
                    const sign = total >= 0 ? '+' : '';
                    return `${attr.toUpperCase()} ${sign}${total}`;
                }).join(', ')}</div>` : ''}
                ${(e.resistances?.length || e.immunities?.length || e.conditionImmunities?.length) ? `<div style="font-size:0.75em; margin-top:6px;">
                    ${e.resistances?.length ? `<span style="color: var(--cyan);">🛡️ Res: ${e.resistances.join(', ')}</span>` : ''}
                    ${e.immunities?.length ? `<span style="color: var(--gold);">${e.resistances?.length ? ' | ' : ''}⭐ Imm: ${e.immunities.join(', ')}</span>` : ''}
                    ${e.conditionImmunities?.length ? `<span style="color: var(--purple);">${(e.resistances?.length || e.immunities?.length) ? ' | ' : ''}🚫 Zust: ${e.conditionImmunities.join(', ')}</span>` : ''}
                </div>` : ''}
                ${e.traits ? `<div style="font-size:0.8em; margin-top:6px;"><span style="color:var(--purple);">⚡ Eigenschaften:</span> ${e.traits}</div>` : ''}
                ${e.equipment ? `<div style="font-size:0.8em; margin-top:4px;"><span style="color:var(--text-dim);">🎒 Ausrüstung:</span> ${e.equipment}</div>` : ''}
                ${e.actions ? `<div style="font-size:0.8em; margin-top:4px;"><span style="color:var(--red);">⚔️ Aktionen:</span> ${e.actions}</div>` : ''}
                ${e.skills ? `<div style="font-size:0.8em; margin-top:4px;"><span style="color:var(--cyan);">🎯 Fertigkeiten:</span> ${e.skills}</div>` : ''}
                <div class="btn-group" style="margin-top: 8px;">
                    <button class="btn btn-sm" data-action="load-enc-stop" data-id="${e.id}">⚔️ Zum Kampf</button>
                    <button class="btn btn-sm" data-action="edit-enc-stop" data-id="${e.id}">✏️</button>
                    <button class="btn btn-sm btn-danger" data-action="delete-enc-stop" data-id="${e.id}">🗑️</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

let expandedEncounterCards = new Set();

function toggleEncounterCard(id) {
    // Bei Listenansicht: Expandiere inline
    if (viewModes.encounters === 'list') {
        const row = document.querySelector(`.list-view-row.encounter-row[data-id="${id}"]`);
        if (row) {
            row.classList.toggle('expanded');
        }
        return;
    }
    
    // Grid-Ansicht
    if (expandedEncounterCards.has(id)) {
        expandedEncounterCards.delete(id);
    } else {
        expandedEncounterCards.add(id);
    }
    
    // Direkt das DOM-Element togglen statt komplettes Re-Render
    const card = document.querySelector(`.encounter-card[data-enc-id="${id}"]`);
    if (card) {
        card.classList.toggle('expanded', expandedEncounterCards.has(id));
    }
}

function updateEncAttrMod(attr) {
    const val = parseInt($(`enc-${attr}`).value) || 10;
    const mod = Math.floor((val - 10) / 2);
    const modEl = $(`enc-${attr}-mod`);
    if (modEl) {
        modEl.textContent = mod >= 0 ? `+${mod}` : `${mod}`;
        modEl.className = 'attr-mod' + (mod > 0 ? ' positive' : mod < 0 ? ' negative' : '');
    }
}

function saveEncounter() {
    const id = $('edit-enc-id').value;
    const languageSelect = $('enc-languages');
    const selectedLanguages = Array.from(languageSelect.selectedOptions).map(o => o.value);
    
    // Saving throw proficiencies sammeln
    const savingThrows = {};
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const checkbox = $(`enc-save-${attr}`);
        if (checkbox && checkbox.checked) {
            savingThrows[attr] = true;
        }
    });
    
    // Resistenzen & Immunitäten sammeln
    const resistances = Array.from(document.querySelectorAll('#enc-resistances .char-resistance-chip.selected input')).map(i => i.value);
    const immunities = Array.from(document.querySelectorAll('#enc-immunities .char-resistance-chip.selected input')).map(i => i.value);
    const conditionImmunities = Array.from(document.querySelectorAll('#enc-condition-immunities .char-resistance-chip.selected input')).map(i => i.value);
    
    const e = {
        name: $('enc-name').value.trim(),
        creatureType: $('enc-creature-type').value,
        cr: $('enc-cr').value,
        ac: parseInt($('enc-ac').value) || 0,
        init: parseInt($('enc-init').value) || 0,
        hp: parseInt($('enc-hp').value) || 0,
        speed: $('enc-speed').value.trim(),
        perception: parseInt($('enc-perception').value) || 0,
        languages: selectedLanguages,
        str: parseInt($('enc-str').value) || 10,
        dex: parseInt($('enc-dex').value) || 10,
        con: parseInt($('enc-con').value) || 10,
        int: parseInt($('enc-int').value) || 10,
        wis: parseInt($('enc-wis').value) || 10,
        cha: parseInt($('enc-cha').value) || 10,
        savingThrows: savingThrows,
        resistances: resistances,
        immunities: immunities,
        conditionImmunities: conditionImmunities,
        traits: sanitizeHTML($('enc-traits').innerHTML),
        equipment: sanitizeHTML($('enc-equipment').innerHTML),
        actions: sanitizeHTML($('enc-actions').innerHTML),
        skills: sanitizeHTML($('enc-skills').innerHTML)
    };
    if (!e.name) { showToast('⚠️ Name erforderlich', 'error'); return; }
    if (id) { const idx = D.encounters.findIndex(x => x.id === parseInt(id)); if (idx > -1) D.encounters[idx] = { ...D.encounters[idx], ...e }; }
    else { e.id = nextId('encounters'); D.encounters.push(e); }
    cancelEncEdit(); 
    // Formular einklappen
    $('enc-form').classList.remove('open'); 
    $('enc-form-icon').textContent = '▼';
    renderEncounters(); 
    save();
}

function editEnc(id) {
    const e = EntityLookup.encounter(id); if (!e) return;
    $('edit-enc-id').value = id;
    $('enc-name').value = e.name;
    $('enc-creature-type').value = e.creatureType || '';
    $('enc-cr').value = e.cr || '';
    $('enc-ac').value = e.ac || '';
    $('enc-init').value = e.init || '';
    $('enc-hp').value = e.hp || '';
    $('enc-speed').value = e.speed || '';
    $('enc-perception').value = e.perception || '';
    
    // Handle languages (array or string for backwards compatibility)
    const languageSelect = $('enc-languages');
    Array.from(languageSelect.options).forEach(o => o.selected = false);
    if (Array.isArray(e.languages)) {
        e.languages.forEach(lang => {
            const opt = Array.from(languageSelect.options).find(o => o.value === lang);
            if (opt) opt.selected = true;
        });
    } else if (e.languages) {
        // Old format: comma-separated string
        e.languages.split(',').map(l => l.trim()).forEach(lang => {
            const opt = Array.from(languageSelect.options).find(o => o.value === lang);
            if (opt) opt.selected = true;
        });
    }
    
    // Attribute als Zahlen laden (oder alte Format-Konversion)
    ['str','dex','con','int','wis','cha'].forEach(attr => {
        const val = e[attr];
        if (typeof val === 'string' && val.includes('/')) {
            // Altes Format: "10/+0/+0" -> nur Wert extrahieren
            $(`enc-${attr}`).value = parseInt(val.split('/')[0]) || 10;
        } else {
            $(`enc-${attr}`).value = val || 10;
        }
        updateEncAttrMod(attr);
    });
    
    $('enc-traits').innerHTML = sanitizeHTML(e.traits) || '';
    $('enc-equipment').innerHTML = sanitizeHTML(e.equipment) || '';
    $('enc-actions').innerHTML = sanitizeHTML(e.actions) || '';
    $('enc-skills').innerHTML = sanitizeHTML(e.skills) || '';
    
    // Rettungswurf-Proficiency laden
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const checkbox = $(`enc-save-${attr}`);
        if (checkbox) {
            const isProf = e.savingThrows && e.savingThrows[attr] === true;
            checkbox.checked = isProf;
            // CSS-Klasse für visuelles Feedback setzen
            const box = checkbox.closest('.char-save-box');
            if (box) box.classList.toggle('proficient', isProf);
        }
    });
    
    // Resistenzen laden
    document.querySelectorAll('#enc-resistances .char-resistance-chip').forEach(chip => {
        const input = chip.querySelector('input');
        const isSelected = (e.resistances || []).includes(input.value);
        chip.classList.toggle('selected', isSelected);
        input.checked = isSelected;
    });
    
    // Immunitäten laden
    document.querySelectorAll('#enc-immunities .char-resistance-chip').forEach(chip => {
        const input = chip.querySelector('input');
        const isSelected = (e.immunities || []).includes(input.value);
        chip.classList.toggle('selected', isSelected);
        input.checked = isSelected;
    });
    
    // Zustandsimmunitäten laden
    document.querySelectorAll('#enc-condition-immunities .char-resistance-chip').forEach(chip => {
        const input = chip.querySelector('input');
        const isSelected = (e.conditionImmunities || []).includes(input.value);
        chip.classList.toggle('selected', isSelected);
        input.checked = isSelected;
    });
    
    $('enc-form').classList.add('open'); $('enc-form-icon').textContent = '▲';
}

function cancelEncEdit() {
    $('edit-enc-id').value = '';
    ['enc-name','enc-creature-type','enc-cr','enc-ac','enc-init','enc-hp','enc-speed','enc-perception'].forEach(id => $(id).value = '');
    ['str','dex','con','int','wis','cha'].forEach(attr => {
        $(`enc-${attr}`).value = 10;
        updateEncAttrMod(attr);
        // Reset saving throw checkboxes und CSS-Klasse
        const checkbox = $(`enc-save-${attr}`);
        if (checkbox) {
            checkbox.checked = false;
            const box = checkbox.closest('.char-save-box');
            if (box) box.classList.remove('proficient');
        }
    });
    Array.from($('enc-languages').options).forEach(o => o.selected = false);
    // Resistenzen & Immunitäten zurücksetzen
    document.querySelectorAll('#enc-resistances .char-resistance-chip, #enc-immunities .char-resistance-chip, #enc-condition-immunities .char-resistance-chip').forEach(chip => {
        chip.classList.remove('selected');
        const input = chip.querySelector('input');
        if (input) input.checked = false;
    });
    $('enc-traits').innerHTML = '';
    $('enc-equipment').innerHTML = '';
    $('enc-actions').innerHTML = '';
    $('enc-skills').innerHTML = '';
    // Formular einklappen
    $('enc-form').classList.remove('open'); 
    $('enc-form-icon').textContent = '▼';
}

function deleteEnc(id) { if (confirm('Löschen?')) { D.encounters = D.encounters.filter(e => e.id !== id); renderEncounters(); save(); } }

function addEncToInit(id) {
    const e = EntityLookup.encounter(id); if (!e) return;
    D.initiative.combatants.push({
        id: nextId('combatants'), name: e.name, initiative: e.init || 0,
        maxHp: e.hp || 10, currentHp: e.hp || 10, ac: e.ac || e.armorClass || 10, 
        type: 'enemy', effects: []
    });
    sortInit(); showToast('Zu Initiative hinzugefügt');
}

