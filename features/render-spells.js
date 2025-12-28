// ============================================================
// SPELLS - Render-Funktionen  
// ============================================================
// Extrahiert aus render/main.js

function getSpellColor(type) { return { spell: 'blue', healing: 'yellow', damage: 'red', buff: 'green', debuff: 'purple' }[type] || 'blue'; }

// Spell Tooltip Functions

function showSpellTooltip(spellId, event) {
    event.stopPropagation();
    const spell = EntityLookup.spell(spellId);
    if (!spell) return;
    
    const tooltip = $('spell-tooltip');
    
    // Fill tooltip content
    $('stt-name').textContent = spell.name || 'Unbekannt';
    $('stt-level').textContent = spell.level === 0 ? 'Zaubertrick' : `Grad ${spell.level}`;
    $('stt-school').textContent = spell.school || '—';
    $('stt-time').textContent = spell.time || '—';
    $('stt-range').textContent = spell.range || '—';
    $('stt-duration').textContent = spell.duration || '—';
    
    // Components (v, g, m are the field names)
    const comps = [];
    if (spell.v) comps.push('<span class="spell-tooltip-comp">V</span>');
    if (spell.g) comps.push('<span class="spell-tooltip-comp">G</span>');
    if (spell.m) comps.push(`<span class="spell-tooltip-comp" title="${esc(spell.material || '')}">M</span>`);
    $('stt-components').innerHTML = comps.length ? comps.join('') : '<span class="spell-tooltip-comp">—</span>';
    
    // Description
    $('stt-desc').innerHTML = sanitizeHTML(spell.description) || '<em>Keine Beschreibung</em>';
    
    // Classes (spellClasses is the field name)
    const classes = spell.spellClasses || [];
    $('stt-classes').textContent = classes.length ? `Klassen: ${classes.join(', ')}` : '';
    
    // Position tooltip near mouse
    const x = event.clientX;
    const y = event.clientY;
    
    tooltip.style.left = '0px';
    tooltip.style.top = '0px';
    tooltip.classList.add('visible');
    
    // Calculate position after showing (to get dimensions)
    const rect = tooltip.getBoundingClientRect();
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    
    let posX = x + 15;
    let posY = y + 10;
    
    // Adjust if overflowing right
    if (posX + rect.width > viewW - 10) {
        posX = x - rect.width - 15;
    }
    
    // Adjust if overflowing bottom
    if (posY + rect.height > viewH - 10) {
        posY = y - rect.height - 10;
    }
    
    // Ensure not off-screen left/top
    if (posX < 10) posX = 10;
    if (posY < 10) posY = 10;
    
    tooltip.style.left = posX + 'px';
    tooltip.style.top = posY + 'px';
}

function hideSpellTooltip() {
    $('spell-tooltip').classList.remove('visible');
}

// Close tooltip when clicking anywhere
document.addEventListener('click', function(e) {
    if (!e.target.closest('.spell-tag') && !e.target.closest('.spell-tooltip')) {
        hideSpellTooltip();
    }
});

// Handle wheel scroll - allow scrolling inside tooltip desc, close if scrolling outside
document.addEventListener('wheel', function(e) {
    const tooltip = $('spell-tooltip');
    if (!tooltip.classList.contains('visible')) return;
    
    const descBox = $('stt-desc');
    const isInsideDesc = descBox && descBox.contains(e.target);
    
    if (isInsideDesc) {
        // Allow scrolling inside description box, prevent page scroll
        const atTop = descBox.scrollTop === 0;
        const atBottom = descBox.scrollTop + descBox.clientHeight >= descBox.scrollHeight;
        
        // Only prevent default if we can scroll in the direction
        if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
            e.stopPropagation();
        } else if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
            // At scroll boundary, prevent page scroll
            e.preventDefault();
            e.stopPropagation();
        }
    } else if (tooltip.contains(e.target)) {
        // Inside tooltip but not desc - prevent page scroll
        e.preventDefault();
        e.stopPropagation();
    } else {
        // Scrolling outside tooltip - close it
        hideSpellTooltip();
    }
}, { passive: false });

// Close tooltip on ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') hideSpellTooltip();
});

function showAssignSpells(charId) { 
    $('assign-char-id').value = charId;
    $('assign-spell-search').value = '';
    $('assign-spell-class-filter').value = '';
    if ($('assign-spell-level-filter')) $('assign-spell-level-filter').value = '';
    renderAssignSpellList();
    showModal('assign-spell-modal');
}

function renderAssignSpellList() {
    const charId = parseInt($('assign-char-id').value);
    const ch = EntityLookup.character(charId);
    const currentSpells = ch?.spells || [];

    const searchTerm = ($('assign-spell-search').value || '').toLowerCase().trim();
    const classFilter = $('assign-spell-class-filter').value;
    const levelFilter = $('assign-spell-level-filter')?.value || '';

    // Filter spells
    let spells = D.spells.filter(s => {
        if (searchTerm) {
            const name = (s.name || '').toLowerCase();
            const school = (s.school || '').toLowerCase();
            const desc = (s.description || '').toLowerCase();
            if (!name.includes(searchTerm) && !school.includes(searchTerm) && !desc.includes(searchTerm)) return false;
        }
        if (classFilter && (!s.spellClasses || !s.spellClasses.includes(classFilter))) return false;
        if (levelFilter !== '') {
            const lvl = parseInt(levelFilter);
            const spellLevel = s.level ?? (s.type === 'cantrip' ? 0 : -1);
            if (spellLevel !== lvl) return false;
        }
        return true;
    });

    // Sort by level then name
    spells.sort((a, b) => {
        const lvlA = a.level ?? (a.type === 'cantrip' ? 0 : 99);
        const lvlB = b.level ?? (b.type === 'cantrip' ? 0 : 99);
        if (lvlA !== lvlB) return lvlA - lvlB;
        return (a.name || '').localeCompare(b.name || '');
    });

    const container = $('assign-spell-list');

    if (!spells.length) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 40px;">Keine Zauber gefunden</div>';
        $('assign-spell-count').textContent = '0';
        return;
    }

    container.innerHTML = spells.map(s => {
        const spellId = parseInt(s.id);
        const isChecked = currentSpells.some(sid => parseInt(sid) === spellId);
        const level = s.level ?? (s.type === 'cantrip' ? 0 : 0);
        const levelText = level === 0 ? '🔮' : level;
        const levelClass = level === 0 ? 'trick' : `level-${level}`;
        const school = s.school ? s.school.substring(0, 3) : '';
        return `<label class="assign-spell-item ${isChecked ? 'checked' : ''}">
            <input type="checkbox" value="${spellId}" ${isChecked ? 'checked' : ''} onchange="this.parentElement.classList.toggle('checked', this.checked); updateAssignSpellCount();">
            <div class="assign-spell-info">
                <span class="assign-spell-name">${esc(s.name)}</span>
                <span class="assign-spell-meta">${school}</span>
            </div>
            <span class="assign-spell-level ${levelClass}">${levelText}</span>
        </label>`;
    }).join('');

    updateAssignSpellCount();
}

function updateAssignSpellCount() {
    const checked = document.querySelectorAll('#assign-spell-list input[type="checkbox"]:checked').length;
    const total = document.querySelectorAll('#assign-spell-list input[type="checkbox"]').length;
    $('assign-spell-count').textContent = `${checked}/${total}`;
}

function assignSpellsSelectAll() {
    document.querySelectorAll('#assign-spell-list input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
        cb.parentElement.classList.add('checked');
    });
    updateAssignSpellCount();
}

function assignSpellsSelectNone() {
    document.querySelectorAll('#assign-spell-list input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.parentElement.classList.remove('checked');
    });
    updateAssignSpellCount();
}

function assignSpells() {
    const charId = parseInt($('assign-char-id')?.value);
    
    if (isNaN(charId)) {
        showToast('⚠️ Keine Charakter-ID', 'error');
        return;
    }
    
    const ch = EntityLookup.character(charId); 
    
    if (!ch) {
        showToast('⚠️ Charakter nicht gefunden', 'error');
        return;
    }
    
    // Sammle alle Zauber-IDs aus der aktuell sichtbaren Liste
    const checkboxes = document.querySelectorAll('#assign-spell-list input[type="checkbox"]');
    const selectedSpells = [];
    const visibleSpellIds = new Set();
    
    checkboxes.forEach(cb => {
        const spellId = parseInt(cb.value);
        if (!isNaN(spellId)) {
            visibleSpellIds.add(spellId);
            if (cb.checked) {
                selectedSpells.push(spellId);
            }
        }
    });
    
    // Prüfe, ob Filter aktiv sind
    const searchTerm = ($('assign-spell-search')?.value || '').trim();
    const classFilter = $('assign-spell-class-filter')?.value || '';
    const levelFilter = $('assign-spell-level-filter')?.value || '';
    
    let finalSpells = [...selectedSpells];
    
    // Bei aktivem Filter: behalte nicht-sichtbare bereits zugewiesene Zauber
    if (searchTerm || classFilter || levelFilter) {
        (ch.spells || []).forEach(sid => {
            const spellId = parseInt(sid);
            if (!visibleSpellIds.has(spellId)) {
                if (D.spells.some(s => s.id === spellId)) {
                    finalSpells.push(spellId);
                }
            }
        });
    }
    
    // Entferne Duplikate und speichere
    ch.spells = [...new Set(finalSpells)];
    
    save();
    hideModal('assign-spell-modal');
    renderParty();
    
    // Falls Charakter-Detail-Modal offen ist, aktualisiere es
    if ($('char-detail-modal')?.classList.contains('show')) {
        showCharacterDetails(charId);
    }
    
    showToast(`✨ ${ch.spells.length} Zauber zugewiesen`);
}

// ============================================================
// ITEM ASSIGNMENT TO CHARACTERS
// ============================================================

