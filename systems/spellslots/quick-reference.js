// [SECTION:QUICK_REFERENCE]
// Extrahiert aus spellslots.js
// Schnell-Referenz Panel v2 - Redesigned
// ============================================================

// CONDITION DESCRIPTIONS (German D&D 5e)
const QREF_CONDITIONS = {
    blinded: {
        name: 'Geblendet',
        desc: 'Kann nicht sehen. Automatisch fehlgeschlagene Fähigkeitswürfe die Sicht erfordern. Angriffswürfe gegen die Kreatur haben Vorteil, ihre Angriffe haben Nachteil.',
        effect: { name: 'Geblendet', color: 'gray' }
    },
    charmed: {
        name: 'Bezaubert',
        desc: 'Kann den Bezaubernden nicht angreifen oder mit schädlichen Fähigkeiten/Effekten zielen. Der Bezaubernde hat Vorteil auf soziale Interaktionen.',
        effect: { name: 'Bezaubert', color: 'pink' }
    },
    frightened: {
        name: 'Verängstigt',
        desc: 'Hat Nachteil auf Fähigkeitswürfe und Angriffswürfe, solange die Quelle der Angst in Sichtlinie ist. Kann sich nicht willentlich zur Quelle bewegen.',
        effect: { name: 'Verängstigt', color: 'purple' }
    },
    grappled: {
        name: 'Gepackt',
        desc: 'Geschwindigkeit wird 0 und kann nicht von Boni profitieren. Endet wenn der Greifer kampfunfähig wird oder die Kreatur außer Reichweite bewegt wird.',
        effect: { name: 'Gepackt', color: 'orange' }
    },
    incapacitated: {
        name: 'Kampfunfähig',
        desc: 'Kann keine Aktionen oder Reaktionen ausführen.',
        effect: { name: 'Kampfunfähig', color: 'gray' }
    },
    invisible: {
        name: 'Unsichtbar',
        desc: 'Kann nicht ohne Magie oder speziellen Sinn gesehen werden. Angriffe gegen die Kreatur haben Nachteil, ihre Angriffe haben Vorteil.',
        effect: { name: 'Unsichtbar', color: 'cyan' }
    },
    paralyzed: {
        name: 'Gelähmt',
        desc: 'Kampfunfähig, kann sich nicht bewegen oder sprechen. Automatisch fehlgeschlagene STR/DEX-Rettungswürfe. Angriffe haben Vorteil, Treffer in 1,5m sind kritisch.',
        effect: { name: 'Gelähmt', color: 'red' }
    },
    poisoned: {
        name: 'Vergiftet',
        desc: 'Nachteil auf Angriffswürfe und Fähigkeitswürfe.',
        effect: { name: 'Vergiftet', color: 'green' }
    },
    prone: {
        name: 'Liegend',
        desc: 'Kann nur kriechen. Nachteil auf Angriffe. Angriffe in 1,5m haben Vorteil, weiter entfernt Nachteil. Aufstehen kostet halbe Bewegung.',
        effect: { name: 'Liegend', color: 'brown' }
    },
    restrained: {
        name: 'Festgesetzt',
        desc: 'Geschwindigkeit wird 0. Angriffe haben Nachteil, Angriffe gegen die Kreatur haben Vorteil. Nachteil auf DEX-Rettungswürfe.',
        effect: { name: 'Festgesetzt', color: 'orange' }
    },
    stunned: {
        name: 'Betäubt',
        desc: 'Kampfunfähig, kann sich nicht bewegen, nur stammeln. Automatisch fehlgeschlagene STR/DEX-Rettungswürfe. Angriffe haben Vorteil.',
        effect: { name: 'Betäubt', color: 'yellow' }
    },
    unconscious: {
        name: 'Bewusstlos',
        desc: 'Kampfunfähig, fällt liegend, lässt alles fallen. Automatisch fehlgeschlagene STR/DEX-Rettungswürfe. Angriffe haben Vorteil, Treffer in 1,5m sind kritisch.',
        effect: { name: 'Bewusstlos', color: 'red' }
    }
};

// SCHNELL-REFERENZ PANEL
// ============================================================
function toggleQuickRef() {
    const panel = $('quick-ref-panel');
    if (panel) {
        panel.classList.toggle('active');
        // Focus search when opening
        if (panel.classList.contains('active')) {
            setTimeout(() => $('qref-search-input')?.focus(), 100);
        }
    }
}

// Toggle collapsible section
function toggleQrefSection(el) {
    const section = el.closest('.qref-section');
    if (section) {
        section.classList.toggle('collapsed');
    }
}

// Show condition detail
function showConditionDetail(conditionKey) {
    const condition = QREF_CONDITIONS[conditionKey];
    if (!condition) return;

    const detailEl = $('qref-condition-detail');
    if (detailEl) {
        detailEl.querySelector('.qref-detail-title').textContent = condition.name;
        detailEl.querySelector('.qref-detail-desc').textContent = condition.desc;
    }

    // Mark active condition
    document.querySelectorAll('.qref-condition').forEach(el => {
        el.classList.toggle('active', el.dataset.condition === conditionKey);
    });
}

// Apply condition to current combatant
function applyQrefCondition(conditionKey) {
    const condition = QREF_CONDITIONS[conditionKey];
    if (!condition) return;

    const init = D.initiative;
    if (!init.combatants.length) {
        showToast('Kein Kampf aktiv', 'warning');
        return;
    }

    const current = init.combatants[init.currentTurn];
    if (!current) {
        showToast('Kein aktiver Combatant', 'warning');
        return;
    }

    // Check if already has this condition
    if (!current.effects) current.effects = [];
    if (current.effects.find(e => e.name === condition.effect.name)) {
        showToast(`${current.name} ist bereits ${condition.effect.name}`, 'info');
        return;
    }

    pushUndo(`Zustand: ${condition.name}`);

    current.effects.push({
        id: Date.now(),
        name: condition.effect.name,
        color: condition.effect.color,
        duration: 999,
        permanent: true,
        description: condition.desc
    });

    showToast(`${current.name}: ${condition.effect.name}`, 'success');
    renderInit();
    save();
}

// Roll dice from quick reference
function rollQrefDice(diceFormula) {
    if (!diceFormula) return;

    // Parse dice formula (e.g., "3d6", "1d6", "20d6")
    const match = diceFormula.match(/(\d+)d(\d+)/i);
    if (!match) {
        showToast('Ungültige Würfelformel', 'error');
        return;
    }

    const numDice = parseInt(match[1]);
    const dieType = parseInt(match[2]);

    let total = 0;
    const rolls = [];
    for (let i = 0; i < numDice; i++) {
        const roll = Math.floor(Math.random() * dieType) + 1;
        rolls.push(roll);
        total += roll;
    }

    // Show result
    const rollStr = rolls.length <= 10 ? ` (${rolls.join('+')})` : '';
    showToast(`🎲 ${diceFormula} = ${total}${rollStr}`, 'info');

    // Add to dice history if available
    if (typeof addToHistory === 'function') {
        addToHistory({
            formula: diceFormula,
            result: total,
            rolls: rolls,
            timestamp: Date.now()
        });
    }
}

// Search functionality
function qrefSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    const sections = document.querySelectorAll('.qref-section');
    const tabContents = document.querySelectorAll('.qref-tab-content');

    if (!searchTerm) {
        // Reset: show all sections, restore collapsed state
        sections.forEach(s => {
            s.classList.remove('search-hidden', 'search-match');
        });
        return;
    }

    // Show all tabs for search
    tabContents.forEach(tc => tc.classList.add('active'));

    sections.forEach(section => {
        const text = section.textContent.toLowerCase();
        const matches = text.includes(searchTerm);

        section.classList.toggle('search-hidden', !matches);
        section.classList.toggle('search-match', matches);

        // Expand matching sections
        if (matches) {
            section.classList.remove('collapsed');
        }
    });
}

// Initialize search input
function initQrefSearch() {
    const input = $('qref-search-input');
    if (input) {
        input.addEventListener('input', debounce((e) => {
            qrefSearch(e.target.value);
        }, 200));

        // Clear search on Escape
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                input.value = '';
                qrefSearch('');
                input.blur();
            }
        });
    }
}

// Legacy toggle function for backwards compatibility
function toggleQuickRefSection(sectionEl, evt) {
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
    initQrefSearch();
}

function renderQuickRefCustom() {
    const container = $('quick-ref-custom');
    if (!container) return;

    // Update empty state visibility
    const emptyEl = $('qref-custom-empty');
    if (emptyEl) {
        emptyEl.style.display = (D.quickRefCustom && D.quickRefCustom.length > 0) ? 'none' : 'block';
    }

    if (!D.quickRefCustom || D.quickRefCustom.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = D.quickRefCustom.map(entry => {
        const isExpanded = entry.expanded ? 'expanded' : '';
        // Parse Entity-Links im Content
        const content = parseEntityLinks(entry.content || '');

        return `
        <div class="qref-custom-entry ${isExpanded}" data-id="${entry.id}">
            <div class="quick-ref-section-title" data-action="toggle-quick-ref-custom" data-id="${entry.id}">
                <span>📌 ${esc(entry.title)}</span>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <button class="qref-btn" data-action="edit-quick-ref-entry" data-id="${entry.id}" data-stop-propagation="true" title="Bearbeiten">✏️</button>
                    <button class="qref-btn" style="border-color: var(--red);" data-action="delete-quick-ref-entry" data-id="${entry.id}" data-stop-propagation="true" title="Löschen">🗑️</button>
                    <span class="quick-ref-toggle-arrow">▼</span>
                </div>
            </div>
            <div class="quick-ref-section-content">
                <div class="quick-ref-custom-content">${content}</div>
            </div>
        </div>`;
    }).join('');
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
        const idx = D.quickRefCustom.findIndex(e => e.id === parseEntityId(id));
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

    pushUndo('Schnellreferenz gelöscht');
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
