// [SECTION:SPELL_MANAGER]
// Was Teil von ui/editors/rich-text.js (D-03: Zauberverwaltung aus dem
// Editor-Modul herausgeloest, Phase 13/MAINT-01, Plan 13-11)
// ============================================================
// STATE
// ============================================================
let currentSpellPage = 0;
let filteredSpellsCache = [];
const expandedSpells = new Set();
// ============================================================
// RENDER
// ============================================================
const debouncedRenderSpells = debounce(renderSpells, 200);
function renderSpells() {
    const D = window.D;
    const renderEmptyState = window.renderEmptyState;
    const currentSpellFilter = window.currentSpellFilter || 'all';
    const currentSpellLevelFilter = window.currentSpellLevelFilter || 'all';
    const currentSpellSchoolFilter = window.currentSpellSchoolFilter || 'all';
    const SPELLS_PER_PAGE = window.SPELLS_PER_PAGE || 30;
    const c = $('spell-list');
    const fb = $('spell-filters');
    const lfb = $('spell-level-filters');
    const sfb = $('spell-school-filters');
    const countEl = $('spell-count');
    if (!c) return;
    if (fb) {
        fb.innerHTML = ['all', 'spell', 'healing', 'damage', 'buff', 'debuff']
            .map(t => {
                const label =
                    t === 'all'
                        ? 'Alle'
                        : t === 'spell'
                          ? '🔵'
                          : t === 'healing'
                            ? '🟡'
                            : t === 'damage'
                              ? '🔴'
                              : t === 'buff'
                                ? '🟢'
                                : '🟣';
                return `<div class="filter-chip ${currentSpellFilter === t ? 'active' : ''}" data-action="set-spell-filter" data-value="${t}" title="${t === 'all' ? 'Alle Typen' : t === 'spell' ? 'Zauber' : t === 'healing' ? 'Heilung' : t === 'damage' ? 'Schaden' : t === 'buff' ? 'Buff' : 'Debuff'}">${label}</div>`;
            })
            .join('');
    }
    if (lfb) {
        lfb.innerHTML = ['all', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
            .map(t => {
                const label = t === 'all' ? '∞' : t === '0' ? '🔮' : t;
                const title =
                    t === 'all' ? 'Alle Stufen' : t === '0' ? 'Zaubertricks' : `Stufe ${t}`;
                return `<div class="filter-chip ${currentSpellLevelFilter === t ? 'active' : ''}" data-action="spell-level-filter" data-value="${t}" title="${title}">${label}</div>`;
            })
            .join('');
    }
    if (sfb) {
        const schools = [
            'all',
            'Bannzauber',
            'Beschwörung',
            'Erkenntnis',
            'Hervorrufung',
            'Illusion',
            'Nekromantie',
            'Verwandlung',
            'Verzauberung'
        ];
        const schoolEmojis = {
            all: '∞',
            Bannzauber: '🛡️',
            Beschwörung: '✨',
            Erkenntnis: '👁️',
            Hervorrufung: '💥',
            Illusion: '🎭',
            Nekromantie: '💀',
            Verwandlung: '🔄',
            Verzauberung: '💫'
        };
        sfb.innerHTML = schools
            .map(s => {
                const label = schoolEmojis[s] || s.charAt(0);
                const title = s === 'all' ? 'Alle Schulen' : s;
                return `<div class="filter-chip ${currentSpellSchoolFilter === s ? 'active' : ''}" data-action="spell-school-filter" data-value="${s}" title="${title}">${label}</div>`;
            })
            .join('');
    }
    const searchInput = $('spell-search');
    const classFilterInput = $('spell-class-filter');
    const search = (searchInput?.value || '').toLowerCase().trim();
    const classFilter = classFilterInput?.value || '';
    let spells = D.spells || [];
    const totalCount = spells.length;
    spells = spells.filter(s => {
        if (currentSpellFilter !== 'all' && s.type !== currentSpellFilter) return false;
        if (currentSpellLevelFilter !== 'all') {
            const lvl = parseInt(currentSpellLevelFilter);
            if (lvl === 0) {
                if (s.type !== 'cantrip' && s.level !== 0) return false;
            } else {
                if (s.level !== lvl) return false;
            }
        }
        if (currentSpellSchoolFilter !== 'all' && s.school !== currentSpellSchoolFilter)
            return false;
        if (search) {
            const name = (s.name || '').toLowerCase();
            const school = (s.school || '').toLowerCase();
            const desc = (s.description || '').toLowerCase();
            const material = (s.material || '').toLowerCase();
            const note = (s.note || '').toLowerCase();
            if (
                !name.includes(search) &&
                !school.includes(search) &&
                !desc.includes(search) &&
                !material.includes(search) &&
                !note.includes(search)
            )
                return false;
        }
        if (classFilter) {
            const classes = s.spellClasses || [];
            if (!classes.includes(classFilter)) return false;
        }
        return true;
    });
    if (countEl) {
        if (spells.length === totalCount) {
            countEl.textContent = `📖 ${totalCount}`;
        } else {
            countEl.textContent = `📖 ${spells.length}/${totalCount}`;
        }
    }
    const isFiltered =
        search ||
        classFilter ||
        currentSpellFilter !== 'all' ||
        currentSpellLevelFilter !== 'all' ||
        currentSpellSchoolFilter !== 'all';
    if (!spells.length) {
        c.innerHTML = renderEmptyState({
            icon: '✨',
            titleEmpty: 'Keine Zauber',
            descEmpty: 'Füge Zauber hinzu oder lade SRD-Zauber.',
            buttonText: '➕ Zauber erstellen',
            buttonAction: 'show-modal',
            buttonValue: 'spell-modal',
            isFiltered
        });
        return;
    }
    spells.sort((a, b) => {
        const lvlA = a.level ?? (a.type === 'cantrip' ? 0 : 99);
        const lvlB = b.level ?? (b.type === 'cantrip' ? 0 : 99);
        if (lvlA !== lvlB) return lvlA - lvlB;
        return (a.name || '').localeCompare(b.name || '');
    });
    filteredSpellsCache = spells;
    currentSpellPage = 0;
    if (spells.length > SPELLS_PER_PAGE) {
        const visibleSpells = spells.slice(0, SPELLS_PER_PAGE);
        c.innerHTML =
            renderSpellCards(visibleSpells) + renderLoadMoreButton(spells.length, SPELLS_PER_PAGE);
    } else {
        c.innerHTML = renderSpellCards(spells);
    }
}
function renderSpellCards(spells) {
    return spells
        .map(s => {
            const levelText =
                s.level === 0 || s.type === 'cantrip' ? 'Zaubertrick' : 'Grad ' + s.level;
            const classText = s.spellClasses?.length
                ? s.spellClasses.join(', ')
                : s.spellClass || '';
            const isExpanded = expandedSpells.has(s.id);
            return `<div class="spell-card ${s.type} ${isExpanded ? 'expanded' : ''}" data-spell-id="${s.id}">
            <div class="spell-card-header" data-action="toggle-spell-card" data-id="${s.id}">
                <div style="flex: 1;">
                    <div class="spell-header">
                        <div class="spell-name">${esc(s.name)} ${s.ritual ? '<span style="color:var(--purple);">(R)</span>' : ''}</div>
                        <div class="spell-level">${levelText}</div>
                    </div>
                    <div class="spell-info-line classes">${esc(classText)}</div>
                    <div class="spell-info-line school">✨ ${esc(s.school || 'Unbekannt')}</div>
                </div>
                <span class="spell-card-toggle">▶</span>
            </div>
            <div class="spell-card-content">
                <div class="spell-meta">
                    <div class="spell-meta-item"><span class="spell-meta-label">Zeit:</span> <span class="spell-meta-value time">${esc(s.time || '—')}</span></div>
                    <div class="spell-meta-item"><span class="spell-meta-label">Reichw.:</span> <span class="spell-meta-value range">${esc(s.range || '—')}</span></div>
                </div>
                <div class="spell-duration-line"><span style="color:var(--cyan);">Dauer:</span> ${esc(s.duration || '—')}</div>
                <div class="spell-components">
                    ${s.ritual ? '<div class="spell-comp active ritual">R</div>' : ''}
                    <div class="spell-comp ${s.v ? 'active verbal' : 'inactive'}">V</div>
                    <div class="spell-comp ${s.g ? 'active gestik' : 'inactive'}">G</div>
                    <div class="spell-comp ${s.m ? 'active material' : 'inactive'}">M</div>
                </div>
                ${s.m && s.material ? `<div class="spell-material">📦 ${esc(s.material)}</div>` : ''}
                ${s.description ? `<div class="spell-desc">${sanitizeHTML(s.description)}</div>` : ''}
                ${s.note ? `<div class="spell-note">📝 ${sanitizeHTML(s.note)}</div>` : ''}
                <div class="btn-group">
                    <button class="btn btn-sm" data-action="edit-spell-stop" data-id="${s.id}">✏️ Bearbeiten</button>
                    <button class="btn btn-sm btn-danger" data-action="delete-spell-stop" data-id="${s.id}">🗑️ Löschen</button>
                </div>
            </div>
        </div>`;
        })
        .join('');
}
function renderLoadMoreButton(total, perPage) {
    const shown = Math.min((currentSpellPage + 1) * perPage, total);
    const remaining = total - shown;
    if (remaining <= 0) return '';
    return `<div class="load-more-container" style="grid-column: 1/-1; text-align: center; padding: 16px;">
        <button class="btn" data-action="call" data-value="loadMoreSpells">
            📜 ${remaining} weitere laden (${shown}/${total} angezeigt)
        </button>
    </div>`;
}
function loadMoreSpells() {
    const SPELLS_PER_PAGE = window.SPELLS_PER_PAGE || 30;
    const c = $('spell-list');
    if (!c || !filteredSpellsCache.length) return;
    currentSpellPage++;
    const start = 0;
    const end = (currentSpellPage + 1) * SPELLS_PER_PAGE;
    const visibleSpells = filteredSpellsCache.slice(start, end);
    c.innerHTML =
        renderSpellCards(visibleSpells) +
        renderLoadMoreButton(filteredSpellsCache.length, SPELLS_PER_PAGE);
}
function toggleSpellCard(id) {
    if (expandedSpells.has(id)) {
        expandedSpells.delete(id);
    } else {
        expandedSpells.add(id);
    }
    const card = document.querySelector(`.spell-card[data-spell-id="${id}"]`);
    if (card) {
        card.classList.toggle('expanded', expandedSpells.has(id));
    }
}
function expandAllSpells() {
    const D = window.D;
    (D.spells || []).forEach(s => expandedSpells.add(s.id));
    renderSpells();
}
function collapseAllSpells() {
    expandedSpells.clear();
    renderSpells();
}
function setSpellFilter(f) {
    window.currentSpellFilter = f;
    renderSpells();
}
function setSpellLevelFilter(f) {
    window.currentSpellLevelFilter = f;
    renderSpells();
}
function setSpellSchoolFilter(f) {
    window.currentSpellSchoolFilter = f;
    renderSpells();
}
// ============================================================
// SPELL FORM
// ============================================================
function onSpellRangeChange() {
    const sel = $('spell-range-select');
    const custom = $('spell-range-custom');
    if (!sel || !custom) return;
    if (sel.value === 'custom') {
        custom.style.display = 'block';
        custom.focus();
    } else {
        custom.style.display = 'none';
        custom.value = '';
    }
}
function onSpellTimeChange() {
    const sel = $('spell-time-select');
    const custom = $('spell-time-custom');
    if (!sel || !custom) return;
    if (sel.value === 'custom') {
        custom.style.display = 'block';
        custom.focus();
    } else {
        custom.style.display = 'none';
        custom.value = '';
    }
}
function onSpellDurationChange() {
    const sel = $('spell-duration-select');
    const custom = $('spell-duration-custom');
    if (!sel || !custom) return;
    if (sel.value === 'custom') {
        custom.style.display = 'block';
        custom.focus();
    } else {
        custom.style.display = 'none';
        custom.value = '';
    }
}
function toggleMaterialField() {
    const mChecked = $('spell-m')?.checked || false;
    const group = $('spell-material-group');
    if (group) group.style.display = mChecked ? 'block' : 'none';
}
// ============================================================
// SPELL CRUD
// ============================================================
function getSpellClassesFromCheckboxes() {
    const classes = [];
    const classIds = [
        'barbar',
        'barde',
        'druide',
        'hexenmeister',
        'kaempfer',
        'kleriker',
        'magier',
        'moench',
        'paladin',
        'schurke',
        'waldlaeufer',
        'zauberer',
        'artifizient'
    ];
    classIds.forEach(id => {
        const cb = $('spell-class-' + id);
        if (cb?.checked) classes.push(cb.value);
    });
    return classes;
}
function setSpellClassesCheckboxes(classes) {
    const classMap = {
        Barbar: 'barbar',
        Barde: 'barde',
        Druide: 'druide',
        Hexenmeister: 'hexenmeister',
        Kämpfer: 'kaempfer',
        Kleriker: 'kleriker',
        Magier: 'magier',
        Mönch: 'moench',
        Paladin: 'paladin',
        Schurke: 'schurke',
        Waldläufer: 'waldlaeufer',
        Zauberer: 'zauberer',
        Artifizient: 'artifizient'
    };
    Object.values(classMap).forEach(id => {
        const cb = $('spell-class-' + id);
        if (cb) cb.checked = false;
    });
    classes.forEach(cls => {
        const id = classMap[cls];
        if (id) {
            const cb = $('spell-class-' + id);
            if (cb) cb.checked = true;
        }
    });
}
function saveSpell() {
    const D = window.D;
    const nextId = window.nextId;
    const editIdInput = $('edit-spell-id');
    const nameInput = $('spell-name');
    const typeInput = $('spell-type');
    const levelInput = $('spell-level');
    const schoolInput = $('spell-school');
    const rangeSelectInput = $('spell-range-select');
    const rangeCustomInput = $('spell-range-custom');
    const timeSelectInput = $('spell-time-select');
    const timeCustomInput = $('spell-time-custom');
    const durationSelectInput = $('spell-duration-select');
    const durationCustomInput = $('spell-duration-custom');
    const ritualInput = $('spell-ritual');
    const vInput = $('spell-v');
    const gInput = $('spell-g');
    const mInput = $('spell-m');
    const materialInput = $('spell-material');
    const descEl = $('spell-desc');
    const noteEl = $('spell-note');
    const id = editIdInput?.value || '';
    const rangeSelect = rangeSelectInput?.value || '';
    const rangeCustom = rangeCustomInput?.value.trim() || '';
    let range = '';
    if (rangeSelect === 'custom') {
        range = rangeCustom;
    } else if (rangeSelect) {
        range = rangeSelect;
    }
    const timeSelect = timeSelectInput?.value || '';
    const timeCustom = timeCustomInput?.value.trim() || '';
    const time = timeSelect === 'custom' ? timeCustom : timeSelect;
    const durationSelect = durationSelectInput?.value || '';
    const durationCustom = durationCustomInput?.value.trim() || '';
    const duration = durationSelect === 'custom' ? durationCustom : durationSelect;
    const classes = getSpellClassesFromCheckboxes();
    const descHtml = descEl ? descEl.innerHTML : '';
    const s = {
        name: nameInput?.value.trim() || '',
        type: typeInput?.value || 'spell',
        level: parseInt(levelInput?.value || '0') || 0,
        spellClasses: classes,
        school: schoolInput?.value || '',
        time: time,
        range: range,
        duration: duration,
        ritual: ritualInput?.checked || false,
        v: vInput?.checked || false,
        g: gInput?.checked || false,
        m: mInput?.checked || false,
        material: materialInput?.value.trim() || '',
        description: sanitizeHTML(descHtml),
        note: noteEl ? sanitizeHTML(noteEl.innerHTML.trim()) : ''
    };
    if (!s.name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    pushUndo(id ? 'Zauber bearbeitet' : 'Zauber erstellt');
    if (id) {
        const idx = D.spells.findIndex(x => x.id === parseEntityId(id));
        if (idx > -1) D.spells[idx] = { ...D.spells[idx], ...s };
    } else {
        s.id = nextId('spells');
        D.spells.push(s);
    }
    hideModal('spell-modal');
    clearSpellForm();
    renderSpells();
    save();
}
function editSpell(id) {
    const s = EntityLookup.spell(id);
    if (!s) return;
    const editIdInput = $('edit-spell-id');
    const nameInput = $('spell-name');
    const typeInput = $('spell-type');
    const levelInput = $('spell-level');
    const schoolInput = $('spell-school');
    const ritualInput = $('spell-ritual');
    const vInput = $('spell-v');
    const gInput = $('spell-g');
    const mInput = $('spell-m');
    const materialInput = $('spell-material');
    const descEl = $('spell-desc');
    const noteEl = $('spell-note');
    if (editIdInput) editIdInput.value = String(id);
    if (nameInput) nameInput.value = s.name;
    if (typeInput) typeInput.value = s.type || 'spell';
    if (levelInput) levelInput.value = String(s.level || 0);
    if (schoolInput) schoolInput.value = s.school || '';
    if (ritualInput) ritualInput.checked = s.ritual;
    if (vInput) vInput.checked = s.v;
    if (gInput) gInput.checked = s.g;
    if (mInput) mInput.checked = s.m;
    if (materialInput) materialInput.value = s.material || '';
    toggleMaterialField();
    if (descEl) descEl.innerHTML = sanitizeHTML(s.description) || '';
    if (noteEl) noteEl.innerHTML = sanitizeHTML(s.note) || '';
    const classes = s.spellClasses || [];
    setSpellClassesCheckboxes(classes);
    const timeSelect = $('spell-time-select');
    const timeCustom = $('spell-time-custom');
    const time = s.time || '1 Aktion';
    if (timeSelect && timeCustom) {
        const timeOptions = Array.from(timeSelect.options).map(o => o.value);
        if (timeOptions.includes(time)) {
            timeSelect.value = time;
            timeCustom.style.display = 'none';
            timeCustom.value = '';
        } else if (time) {
            timeSelect.value = 'custom';
            timeCustom.style.display = 'block';
            timeCustom.value = time;
        }
    }
    const rangeSelect = $('spell-range-select');
    const rangeCustom = $('spell-range-custom');
    const range = s.range || '';
    if (rangeSelect && rangeCustom) {
        const rangeOptions = Array.from(rangeSelect.options).map(o => o.value);
        if (rangeOptions.includes(range)) {
            rangeSelect.value = range;
            rangeCustom.style.display = 'none';
            rangeCustom.value = '';
        } else if (range) {
            rangeSelect.value = 'custom';
            rangeCustom.style.display = 'block';
            rangeCustom.value = range;
        } else {
            rangeSelect.value = '';
            rangeCustom.style.display = 'none';
            rangeCustom.value = '';
        }
    }
    const durationSelect = $('spell-duration-select');
    const durationCustom = $('spell-duration-custom');
    const duration = s.duration || 'Unmittelbar';
    if (durationSelect && durationCustom) {
        const durationOptions = Array.from(durationSelect.options).map(o => o.value);
        if (durationOptions.includes(duration)) {
            durationSelect.value = duration;
            durationCustom.style.display = 'none';
            durationCustom.value = '';
        } else if (duration) {
            durationSelect.value = 'custom';
            durationCustom.style.display = 'block';
            durationCustom.value = duration;
        }
    }

    // Show markdown export/import buttons when editing
    const markdownActions = $('spell-markdown-actions');
    if (markdownActions) {
        markdownActions.style.display = 'block';
    }

    showModal('spell-modal');
}
function deleteSpell(id) {
    const D = window.D;
    const spell = EntityLookup.spell(id);
    if (confirm(`Zauber "${spell?.name || 'Unbekannt'}" löschen?`)) {
        pushUndo('Zauber gelöscht');
        D.spells = D.spells.filter(s => s.id !== id);
        renderSpells();
        save();
    }
}
function clearSpellForm() {
    const editIdInput = $('edit-spell-id');
    const nameInput = $('spell-name');
    const typeInput = $('spell-type');
    const levelInput = $('spell-level');
    const schoolInput = $('spell-school');
    const timeSelectInput = $('spell-time-select');
    const timeCustomInput = $('spell-time-custom');
    const rangeSelectInput = $('spell-range-select');
    const rangeCustomInput = $('spell-range-custom');
    const durationSelectInput = $('spell-duration-select');
    const durationCustomInput = $('spell-duration-custom');
    const descEl = $('spell-desc');
    const noteEl = $('spell-note');
    const materialInput = $('spell-material');
    const materialGroup = $('spell-material-group');
    const ritualInput = $('spell-ritual');
    const vInput = $('spell-v');
    const gInput = $('spell-g');
    const mInput = $('spell-m');
    if (editIdInput) editIdInput.value = '';
    if (nameInput) nameInput.value = '';
    if (typeInput) typeInput.value = 'spell';
    if (levelInput) levelInput.value = '0';
    if (schoolInput) schoolInput.value = '';
    if (timeSelectInput) timeSelectInput.value = '1 Aktion';
    if (timeCustomInput) {
        timeCustomInput.value = '';
        timeCustomInput.style.display = 'none';
    }
    if (rangeSelectInput) rangeSelectInput.value = '';
    if (rangeCustomInput) {
        rangeCustomInput.value = '';
        rangeCustomInput.style.display = 'none';
    }
    if (durationSelectInput) durationSelectInput.value = 'Unmittelbar';
    if (durationCustomInput) {
        durationCustomInput.value = '';
        durationCustomInput.style.display = 'none';
    }
    if (descEl) descEl.innerHTML = '';
    if (noteEl) noteEl.innerHTML = '';
    if (materialInput) materialInput.value = '';
    if (materialGroup) materialGroup.style.display = 'none';
    if (ritualInput) ritualInput.checked = false;
    if (vInput) vInput.checked = false;
    if (gInput) gInput.checked = false;
    if (mInput) mInput.checked = false;
    setSpellClassesCheckboxes([]);

    // Hide markdown export/import buttons for new spells
    const markdownActions = $('spell-markdown-actions');
    if (markdownActions) {
        markdownActions.style.display = 'none';
    }
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.debouncedRenderSpells = debouncedRenderSpells;
window.renderSpells = renderSpells;
window.toggleSpellCard = toggleSpellCard;
window.expandAllSpells = expandAllSpells;
window.collapseAllSpells = collapseAllSpells;
window.setSpellFilter = setSpellFilter;
window.setSpellLevelFilter = setSpellLevelFilter;
window.setSpellSchoolFilter = setSpellSchoolFilter;
window.onSpellRangeChange = onSpellRangeChange;
window.onSpellTimeChange = onSpellTimeChange;
window.onSpellDurationChange = onSpellDurationChange;
window.toggleMaterialField = toggleMaterialField;
window.saveSpell = saveSpell;
window.editSpell = editSpell;
window.deleteSpell = deleteSpell;
