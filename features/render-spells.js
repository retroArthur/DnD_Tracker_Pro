// [SECTION:RENDER_SPELLS]
// ============================================================
// SPELLS - @zauber @tooltip @magic
// ============================================================
function getSpellColor(type) {
    const colors = {
        spell: 'blue',
        healing: 'yellow',
        damage: 'red',
        buff: 'green',
        debuff: 'purple'
    };
    return colors[type] || 'blue';
}
// Spell Tooltip Functions
function showSpellTooltip(spellId, event) {
    event.stopPropagation();
    const spell = EntityLookup.spell(spellId);
    if (!spell)
        return;
    const tooltip = $('spell-tooltip');
    if (!tooltip)
        return;
    // Fill tooltip content
    const nameEl = $('stt-name');
    const levelEl = $('stt-level');
    const schoolEl = $('stt-school');
    const timeEl = $('stt-time');
    const rangeEl = $('stt-range');
    const durationEl = $('stt-duration');
    const componentsEl = $('stt-components');
    const descEl = $('stt-desc');
    const classesEl = $('stt-classes');
    if (nameEl)
        nameEl.textContent = spell.name || 'Unbekannt';
    if (levelEl)
        levelEl.textContent = spell.level === 0 ? 'Zaubertrick' : `Grad ${spell.level}`;
    if (schoolEl)
        schoolEl.textContent = spell.school || '—';
    if (timeEl)
        timeEl.textContent = spell.time || '—';
    if (rangeEl)
        rangeEl.textContent = spell.range || '—';
    if (durationEl)
        durationEl.textContent = spell.duration || '—';
    // Components (v, g, m are the field names)
    const comps = [];
    if (spell.v)
        comps.push('<span class="spell-tooltip-comp">V</span>');
    if (spell.g)
        comps.push('<span class="spell-tooltip-comp">G</span>');
    if (spell.m)
        comps.push(`<span class="spell-tooltip-comp" title="${esc(spell.material || '')}">M</span>`);
    if (componentsEl)
        componentsEl.innerHTML = comps.length ? comps.join('') : '<span class="spell-tooltip-comp">—</span>';
    // Description
    if (descEl)
        descEl.innerHTML = sanitizeHTML(spell.description) || '<em>Keine Beschreibung</em>';
    // Classes (spellClasses is the field name)
    const classes = spell.spellClasses || [];
    if (classesEl)
        classesEl.textContent = classes.length ? `Klassen: ${classes.join(', ')}` : '';
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
    if (posX < 10)
        posX = 10;
    if (posY < 10)
        posY = 10;
    tooltip.style.left = posX + 'px';
    tooltip.style.top = posY + 'px';
}
function hideSpellTooltip() {
    const tooltip = $('spell-tooltip');
    if (tooltip)
        tooltip.classList.remove('visible');
}
// Close tooltip when clicking anywhere
document.addEventListener('click', function (e) {
    const target = e.target;
    if (!target.closest('.spell-tag') && !target.closest('.spell-tooltip')) {
        hideSpellTooltip();
    }
});
// Handle wheel scroll - allow scrolling inside tooltip desc, close if scrolling outside
document.addEventListener('wheel', function (e) {
    const tooltip = $('spell-tooltip');
    if (!tooltip || !tooltip.classList.contains('visible'))
        return;
    const descBox = $('stt-desc');
    const target = e.target;
    const isInsideDesc = descBox && descBox.contains(target);
    if (isInsideDesc && descBox) {
        // Allow scrolling inside description box, prevent page scroll
        const atTop = descBox.scrollTop === 0;
        const atBottom = descBox.scrollTop + descBox.clientHeight >= descBox.scrollHeight;
        // Only prevent default if we can scroll in the direction
        if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
            e.stopPropagation();
        }
        else if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
            // At scroll boundary, prevent page scroll
            e.preventDefault();
            e.stopPropagation();
        }
    }
    else if (tooltip.contains(target)) {
        // Inside tooltip but not desc - prevent page scroll
        e.preventDefault();
        e.stopPropagation();
    }
    else {
        // Scrolling outside tooltip - close it
        hideSpellTooltip();
    }
}, { passive: false });
// Close tooltip on ESC
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape')
        hideSpellTooltip();
});
function showAssignSpells(charId) {
    const charIdInput = $('assign-char-id');
    const searchInput = $('assign-spell-search');
    const classFilterInput = $('assign-spell-class-filter');
    const levelFilterInput = $('assign-spell-level-filter');
    if (charIdInput)
        charIdInput.value = String(charId);
    if (searchInput)
        searchInput.value = '';
    if (classFilterInput)
        classFilterInput.value = '';
    if (levelFilterInput)
        levelFilterInput.value = '';
    renderAssignSpellList();
    showModal('assign-spell-modal');
}
function renderAssignSpellList() {
    const D = window.D;
    const charIdInput = $('assign-char-id');
    const charId = parseEntityId(charIdInput?.value);
    const ch = charId !== null ? EntityLookup.character(charId) : null;
    const currentSpells = ch?.spells || [];
    const searchInput = $('assign-spell-search');
    const classFilterInput = $('assign-spell-class-filter');
    const levelFilterInput = $('assign-spell-level-filter');
    const searchTerm = (searchInput?.value || '').toLowerCase().trim();
    const classFilter = classFilterInput?.value || '';
    const levelFilter = levelFilterInput?.value || '';
    // Filter spells
    const spells = D.spells.filter((s) => {
        if (searchTerm) {
            const name = (s.name || '').toLowerCase();
            const school = (s.school || '').toLowerCase();
            const desc = (s.description || '').toLowerCase();
            if (!name.includes(searchTerm) && !school.includes(searchTerm) && !desc.includes(searchTerm))
                return false;
        }
        if (classFilter && (!s.spellClasses || !s.spellClasses.includes(classFilter)))
            return false;
        if (levelFilter !== '') {
            const lvl = parseInt(levelFilter);
            const spellLevel = s.level ?? (s.type === 'cantrip' ? 0 : -1);
            if (spellLevel !== lvl)
                return false;
        }
        return true;
    });
    // Sort by level then name
    spells.sort((a, b) => {
        const lvlA = a.level ?? (a.type === 'cantrip' ? 0 : 99);
        const lvlB = b.level ?? (b.type === 'cantrip' ? 0 : 99);
        if (lvlA !== lvlB)
            return lvlA - lvlB;
        return (a.name || '').localeCompare(b.name || '');
    });
    const container = $('assign-spell-list');
    const countEl = $('assign-spell-count');
    if (!container)
        return;
    if (!spells.length) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 40px;">Keine Zauber gefunden</div>';
        if (countEl)
            countEl.textContent = '0';
        return;
    }
    container.innerHTML = spells.map((s) => {
        const spellId = parseEntityId(s.id);
        const isChecked = currentSpells.some((sid) => parseEntityId(sid) === spellId);
        const level = s.level ?? (s.type === 'cantrip' ? 0 : 0);
        const levelText = level === 0 ? '🔮' : level;
        const levelClass = level === 0 ? 'trick' : `level-${level}`;
        const school = s.school ? s.school.substring(0, 3) : '';
        return `<label class="assign-spell-item ${isChecked ? 'checked' : ''}">
            <input type="checkbox" value="${spellId}" ${isChecked ? 'checked' : ''} data-on-change="updateAssignSpellCount">
            <div class="assign-spell-info">
                <span class="assign-spell-name">${esc(s.name)}</span>
                <span class="assign-spell-meta">${school}</span>
            </div>
            <span class="assign-spell-level ${levelClass}">${levelText}</span>
        </label>`;
    }).join('');
    updateAssignSpellCount();
}
function updateAssignSpellCount(element) {
    // Toggle 'checked' Klasse auf Parent-Label wenn Element uebergeben wurde (von data-on-change)
    if (element && element.tagName === 'INPUT' && element.type === 'checkbox') {
        const label = element.closest('label');
        if (label) {
            label.classList.toggle('checked', element.checked);
        }
    }
    const checked = document.querySelectorAll('#assign-spell-list input[type="checkbox"]:checked').length;
    const total = document.querySelectorAll('#assign-spell-list input[type="checkbox"]').length;
    const countEl = $('assign-spell-count');
    if (countEl)
        countEl.textContent = `${checked}/${total}`;
}
function assignSpellsSelectAll() {
    document.querySelectorAll('#assign-spell-list input[type="checkbox"]').forEach(cb => {
        const checkbox = cb;
        checkbox.checked = true;
        const parent = checkbox.parentElement;
        if (parent)
            parent.classList.add('checked');
    });
    updateAssignSpellCount();
}
function assignSpellsSelectNone() {
    document.querySelectorAll('#assign-spell-list input[type="checkbox"]').forEach(cb => {
        const checkbox = cb;
        checkbox.checked = false;
        const parent = checkbox.parentElement;
        if (parent)
            parent.classList.remove('checked');
    });
    updateAssignSpellCount();
}
function assignSpells() {
    const D = window.D;
    const renderParty = window.renderParty;
    const showCharacterDetails = window.showCharacterDetails;
    const charIdInput = $('assign-char-id');
    const charId = parseEntityId(charIdInput?.value);
    if (charId === null) {
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
    const searchInput = $('assign-spell-search');
    const classFilterInput = $('assign-spell-class-filter');
    const levelFilterInput = $('assign-spell-level-filter');
    const searchTerm = (searchInput?.value || '').trim();
    const classFilter = classFilterInput?.value || '';
    const levelFilter = levelFilterInput?.value || '';
    const finalSpells = [...selectedSpells];
    // Bei aktivem Filter: behalte nicht-sichtbare bereits zugewiesene Zauber
    if (searchTerm || classFilter || levelFilter) {
        (ch.spells || []).forEach((sid) => {
            const spellId = parseInt(sid);
            if (!visibleSpellIds.has(spellId)) {
                if (D.spells.some((s) => s.id === spellId)) {
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
    const charDetailModal = $('char-detail-modal');
    if (charDetailModal?.classList.contains('show')) {
        showCharacterDetails(charId);
    }
    showToast(`✨ ${ch.spells.length} Zauber zugewiesen`);
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.getSpellColor = getSpellColor;
window.showSpellTooltip = showSpellTooltip;
window.hideSpellTooltip = hideSpellTooltip;
window.showAssignSpells = showAssignSpells;
window.renderAssignSpellList = renderAssignSpellList;
window.updateAssignSpellCount = updateAssignSpellCount;
window.assignSpellsSelectAll = assignSpellsSelectAll;
window.assignSpellsSelectNone = assignSpellsSelectNone;
window.assignSpells = assignSpells;
