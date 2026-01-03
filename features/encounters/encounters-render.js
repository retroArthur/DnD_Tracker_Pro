// [SECTION:ENCOUNTERS_RENDER]
// ============================================================
// ENCOUNTERS RENDER - @master-detail @filter @monster
// ============================================================

// State
let selectedEncounterId = null;
let currentEncFilter = 'all';

// Creature type icons
const ENC_ICONS = {
    'aberration': '👁️',
    'bestie': '🐾',
    'himmlisch': '👼',
    'konstrukt': '🤖',
    'drache': '🐉',
    'dragon': '🐉',
    'elementar': '🌪️',
    'feenwesen': '🧚',
    'riese': '🗿',
    'humanoid': '👤',
    'monstrosität': '👹',
    'schleim': '🟢',
    'pflanze': '🌿',
    'untot': '💀',
    'undead': '💀',
    'default': '⚔️'
};

function getEncounterIcon(enc) {
    const type = (enc.creatureType || enc.race || '').toLowerCase();
    for (const [key, icon] of Object.entries(ENC_ICONS)) {
        if (type.includes(key)) return icon;
    }
    return ENC_ICONS.default;
}

function renderEncounters() {
    const listContainer = $('encounter-list');
    const filterContainer = $('encounter-filters');
    if (!listContainer) return;

    // Update counter
    updateCounters({ 'encounter-io-count': D.encounters?.length || 0 });

    // Render filter chips (by creature type)
    if (filterContainer) {
        const types = [...new Set((D.encounters || []).map(e => e.creatureType).filter(Boolean))];
        filterContainer.innerHTML = `
            <div class="enc-filter-chip ${currentEncFilter === 'all' ? 'active' : ''}" data-action="set-enc-filter" data-value="all">Alle</div>
            ${types.slice(0, 5).map(type => `
                <div class="enc-filter-chip ${currentEncFilter === type ? 'active' : ''}"
                     data-action="set-enc-filter" data-value="${esc(type)}">
                    ${esc(type)}
                </div>
            `).join('')}
            ${types.length > 5 ? `
                <select class="enc-filter-select" data-on-change="setEncFilter">
                    <option value="">Mehr...</option>
                    ${types.slice(5).map(type => `<option value="${esc(type)}">${esc(type)}</option>`).join('')}
                </select>
            ` : ''}
        `;
    }

    // Get search and filter
    const search = ($('enc-search')?.value || '').toLowerCase();
    let encounters = [...(D.encounters || [])];

    // Apply type filter
    if (currentEncFilter !== 'all') {
        encounters = encounters.filter(e => e.creatureType === currentEncFilter);
    }

    // Apply search
    if (search) {
        encounters = encounters.filter(e =>
            e.name.toLowerCase().includes(search) ||
            (e.creatureType || '').toLowerCase().includes(search) ||
            (e.race || '').toLowerCase().includes(search) ||
            (e.cr || '').toString().includes(search)
        );
    }

    // Sort by CR then name
    encounters.sort((a, b) => {
        const crA = parseCR(a.cr);
        const crB = parseCR(b.cr);
        if (crA !== crB) return crA - crB;
        return a.name.localeCompare(b.name);
    });

    // Empty state
    if (!encounters.length) {
        listContainer.innerHTML = `
            <div class="enc-empty-state">
                <div class="enc-empty-icon">👹</div>
                <div class="enc-empty-title">${search || currentEncFilter !== 'all' ? 'Keine Treffer' : 'Keine Encounter'}</div>
                <div class="enc-empty-desc">${search || currentEncFilter !== 'all' ? 'Versuche andere Suchbegriffe' : 'Erstelle Monster und Gegner'}</div>
                ${!search && currentEncFilter === 'all' ? `
                    <button class="enc-add-btn" data-action="show-enc-form" style="margin-top: 12px;">
                        + Encounter erstellen
                    </button>
                ` : ''}
            </div>
        `;
        clearEncounterDetail();
        return;
    }

    // Render list items
    listContainer.innerHTML = encounters.map(enc => renderEncounterItem(enc)).join('');

    // Auto-select first if none selected
    if (!selectedEncounterId || !encounters.find(e => e.id === selectedEncounterId)) {
        selectEncounter(encounters[0].id, false);
    } else {
        showEncounterDetail(selectedEncounterId);
    }
}

// Helper to parse CR values like "1/4", "1/2" etc.
function parseCR(cr) {
    if (!cr) return 0;
    if (cr === '1/8') return 0.125;
    if (cr === '1/4') return 0.25;
    if (cr === '1/2') return 0.5;
    return parseFloat(cr) || 0;
}

// Quick difficulty estimation for single encounter
function getEncounterDifficulty(cr) {
    if (!D.characters || D.characters.length === 0) return null;

    // Get party average level
    const avgLevel = Math.round(D.characters.reduce((sum, c) => sum + (c.level || 1), 0) / D.characters.length);
    const partySize = D.characters.length;

    // XP Thresholds for average level (simplified)
    const thresholds = {
        1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
        2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
        3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
        4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
        5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
        10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
        15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
        20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 }
    };

    // Get closest threshold
    const levels = Object.keys(thresholds).map(Number).sort((a, b) => a - b);
    let closestLevel = levels[0];
    for (const lvl of levels) {
        if (lvl <= avgLevel) closestLevel = lvl;
    }
    const t = thresholds[closestLevel];

    // Party thresholds
    const partyThresholds = {
        easy: t.easy * partySize,
        medium: t.medium * partySize,
        hard: t.hard * partySize,
        deadly: t.deadly * partySize
    };

    // CR to XP
    const crToXP = {
        "0": 10, "1/8": 25, "1/4": 50, "1/2": 100, "1": 200, "2": 450, "3": 700,
        "4": 1100, "5": 1800, "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900
    };
    const xp = crToXP[String(cr)] || (parseCR(cr) * 200);

    // Determine difficulty
    if (xp < partyThresholds.easy) return { level: 'trivial', label: 'Trivial' };
    if (xp < partyThresholds.medium) return { level: 'easy', label: 'Leicht' };
    if (xp < partyThresholds.hard) return { level: 'medium', label: 'Mittel' };
    if (xp < partyThresholds.deadly) return { level: 'hard', label: 'Schwer' };
    return { level: 'deadly', label: 'Tödlich' };
}

function renderEncounterItem(enc) {
    const icon = getEncounterIcon(enc);
    const isSelected = enc.id === selectedEncounterId;
    const difficulty = enc.cr ? getEncounterDifficulty(enc.cr) : null;

    return `
        <div class="enc-item ${isSelected ? 'selected' : ''}" data-action="select-encounter" data-id="${enc.id}">
            <div class="enc-item-icon">${icon}</div>
            <div class="enc-item-info">
                <div class="enc-item-name">
                    ${enc.cr ? `<span class="enc-item-cr">CR ${enc.cr}</span>` : ''}
                    ${esc(enc.name)}
                </div>
                <div class="enc-item-meta">
                    ${enc.creatureType ? esc(enc.creatureType) : 'Unbekannt'}
                </div>
            </div>
            <div class="enc-item-stats">
                <span class="enc-stat-badge" title="Rüstungsklasse">🛡️ ${enc.ac || '—'}</span>
                <span class="enc-stat-badge" title="Trefferpunkte">❤️ ${enc.hp || '—'}</span>
            </div>
            ${difficulty ? `
                <div class="enc-item-difficulty">
                    <span class="difficulty-badge ${difficulty.level}">${difficulty.label}</span>
                </div>
            ` : ''}
        </div>
    `;
}

function selectEncounter(id, scroll = true) {
    selectedEncounterId = id;

    // Update selection in list
    document.querySelectorAll('.enc-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === String(id));
    });

    // Show detail
    showEncounterDetail(id);

    // Scroll into view if needed
    if (scroll) {
        const item = document.querySelector(`.enc-item[data-id="${id}"]`);
        if (item) {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

function showEncounterDetail(id) {
    const panel = $('enc-detail-panel');
    if (!panel) return;

    const enc = EntityLookup.encounter(id);
    if (!enc) {
        clearEncounterDetail();
        return;
    }

    const icon = getEncounterIcon(enc);
    const languages = Array.isArray(enc.languages) ? enc.languages.join(', ') : (enc.languages || '—');

    // Build attributes
    const attrs = ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(a => {
        const val = enc[a] || 10;
        const mod = Math.floor((val - 10) / 2);
        const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
        const name = a.toUpperCase().replace('STR', 'STÄ').replace('DEX', 'GES').replace('CON', 'KON').replace('WIS', 'WEI');
        return { name, val, mod: modStr, modNum: mod };
    });

    // Build saving throws
    const savingThrowsHtml = enc.savingThrows && Object.keys(enc.savingThrows).length > 0 ?
        Object.keys(enc.savingThrows).filter(k => enc.savingThrows[k]).map(attr => {
            const val = enc[attr] || 10;
            const mod = Math.floor((val - 10) / 2);
            const profBonus = Math.max(2, Math.floor((parseInt(enc.cr) || 0) / 4) + 2);
            const total = mod + profBonus;
            return `<span class="enc-save-tag">${attr.toUpperCase()} +${total}</span>`;
        }).join('') : '';

    // Build resistances/immunities
    const resistancesHtml = (enc.resistances || []).map(r => `<span class="enc-res-tag res">${esc(r)}</span>`).join('');
    const immunitiesHtml = (enc.immunities || []).map(i => `<span class="enc-res-tag imm">${esc(i)}</span>`).join('');
    const condImmunitiesHtml = (enc.conditionImmunities || []).map(c => `<span class="enc-res-tag cond">${esc(c)}</span>`).join('');

    panel.innerHTML = `
        <div class="enc-detail-content">
            <div class="enc-detail-header">
                <div class="enc-detail-icon">${icon}</div>
                <div class="enc-detail-title">
                    <div class="enc-detail-name">${esc(enc.name)}</div>
                    <div class="enc-detail-subtitle">
                        ${enc.creatureType ? esc(enc.creatureType) : ''}
                        ${enc.cr ? ` • CR ${enc.cr}` : ''}
                    </div>
                </div>
                <div class="enc-detail-actions">
                    <button class="enc-detail-btn success" data-action="load-encounter" data-id="${enc.id}" title="Zum Kampf hinzufügen">⚔️</button>
                    <button class="enc-detail-btn" data-action="edit-encounter" data-id="${enc.id}" title="Bearbeiten">✏️</button>
                    <button class="enc-detail-btn danger" data-action="delete-encounter" data-id="${enc.id}" title="Löschen">🗑️</button>
                </div>
            </div>

            <!-- Core Stats -->
            <div class="enc-stats-row">
                <div class="enc-core-stat">
                    <div class="enc-core-stat-label">RK</div>
                    <div class="enc-core-stat-value">${enc.ac || '—'}</div>
                </div>
                <div class="enc-core-stat">
                    <div class="enc-core-stat-label">HP</div>
                    <div class="enc-core-stat-value">${enc.hp || '—'}</div>
                </div>
                <div class="enc-core-stat">
                    <div class="enc-core-stat-label">Init</div>
                    <div class="enc-core-stat-value">${enc.init || '—'}</div>
                </div>
                <div class="enc-core-stat">
                    <div class="enc-core-stat-label">Speed</div>
                    <div class="enc-core-stat-value">${esc(enc.speed || '—')}</div>
                </div>
                <div class="enc-core-stat">
                    <div class="enc-core-stat-label">Wahr.</div>
                    <div class="enc-core-stat-value">${enc.perception || '—'}</div>
                </div>
            </div>

            <!-- Attributes -->
            <div class="enc-section">
                <div class="enc-section-title">Attribute</div>
                <div class="enc-attr-grid">
                    ${attrs.map(a => `
                        <div class="enc-attr-box">
                            <div class="enc-attr-name">${a.name}</div>
                            <div class="enc-attr-value">${a.val}</div>
                            <div class="enc-attr-mod ${a.modNum >= 0 ? 'positive' : 'negative'}">${a.mod}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${savingThrowsHtml ? `
                <div class="enc-section">
                    <div class="enc-section-title">Rettungswürfe</div>
                    <div class="enc-tags">${savingThrowsHtml}</div>
                </div>
            ` : ''}

            ${languages !== '—' ? `
                <div class="enc-section">
                    <div class="enc-section-title">Sprachen</div>
                    <div class="enc-text">${esc(languages)}</div>
                </div>
            ` : ''}

            ${resistancesHtml || immunitiesHtml || condImmunitiesHtml ? `
                <div class="enc-section">
                    <div class="enc-section-title">Resistenzen & Immunitäten</div>
                    <div class="enc-tags">
                        ${resistancesHtml}
                        ${immunitiesHtml}
                        ${condImmunitiesHtml}
                    </div>
                </div>
            ` : ''}

            ${enc.traits ? `
                <div class="enc-section">
                    <div class="enc-section-title">Eigenschaften</div>
                    <div class="enc-text">${enc.traits}</div>
                </div>
            ` : ''}

            ${enc.actions ? `
                <div class="enc-section">
                    <div class="enc-section-title">Aktionen</div>
                    <div class="enc-text">${enc.actions}</div>
                </div>
            ` : ''}

            ${enc.skills ? `
                <div class="enc-section">
                    <div class="enc-section-title">Fertigkeiten</div>
                    <div class="enc-text">${enc.skills}</div>
                </div>
            ` : ''}

            ${enc.equipment ? `
                <div class="enc-section">
                    <div class="enc-section-title">Ausrüstung</div>
                    <div class="enc-text">${enc.equipment}</div>
                </div>
            ` : ''}
        </div>
    `;
}

function clearEncounterDetail() {
    const panel = $('enc-detail-panel');
    if (panel) {
        panel.innerHTML = `
            <div class="enc-detail-empty">
                <div class="enc-detail-empty-icon">👹</div>
                <div class="enc-detail-empty-text">Wähle einen Encounter aus der Liste</div>
            </div>
        `;
    }
}

function setEncFilter(f) {
    // Unterstuetzt sowohl direkte Werte als auch Element (von data-on-change)
    if (f && f.tagName) {
        // Element uebergeben - Wert extrahieren
        f = f.value || 'all';
    }
    currentEncFilter = f;
    selectedEncounterId = null;
    renderEncounters();
}

function toggleEncounter(id) {
    // For search navigation: select and show the encounter
    const enc = EntityLookup.encounter(id);
    if (!enc) return;

    currentEncFilter = 'all';
    selectedEncounterId = id;
    renderEncounters();

    setTimeout(() => {
        const item = document.querySelector(`.enc-item[data-id="${id}"]`);
        if (item) {
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            item.style.transition = 'box-shadow 0.3s ease';
            item.style.boxShadow = '0 0 20px var(--gold)';
            setTimeout(() => {
                item.style.boxShadow = '';
            }, 2000);
        }
    }, 100);
}

// Legacy compatibility
function toggleEncounterCard(id) {
    selectEncounter(id);
}

// Show encounter form (opens collapsible or could be modal)
function showEncForm() {
    cancelEncEdit();
    $('enc-form')?.classList.add('open');
    const icon = $('enc-form-icon');
    if (icon) icon.textContent = '▲';
}
