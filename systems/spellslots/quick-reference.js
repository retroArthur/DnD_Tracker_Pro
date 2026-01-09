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
/**
 * Oeffnet oder schliesst das Quick Reference Panel
 * Fokussiert automatisch das Suchfeld beim Oeffnen
 */
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
/**
 * Klappt eine Section im Quick Reference Panel ein/aus
 * @param el - Element innerhalb der Section
 */
function toggleQrefSection(el) {
    const section = el.closest('.qref-section');
    if (section) {
        section.classList.toggle('collapsed');
    }
}
/**
 * Zeigt die Detailbeschreibung eines Zustands an
 * @param conditionKey - Schluessel des Zustands (z.B. 'blinded', 'charmed')
 */
function showConditionDetail(conditionKey) {
    const condition = QREF_CONDITIONS[conditionKey];
    if (!condition)
        return;
    const detailEl = $('qref-condition-detail');
    if (detailEl) {
        const titleEl = detailEl.querySelector('.qref-detail-title');
        const descEl = detailEl.querySelector('.qref-detail-desc');
        if (titleEl)
            titleEl.textContent = condition.name;
        if (descEl)
            descEl.textContent = condition.desc;
    }
    // Mark active condition
    document.querySelectorAll('.qref-condition').forEach(el => {
        el.classList.toggle('active', el.dataset.condition === conditionKey);
    });
}
/**
 * Wendet einen Zustand auf den aktuellen Combatant an
 * @param conditionKey - Schluessel des Zustands aus QREF_CONDITIONS
 */
function applyQrefCondition(conditionKey) {
    const condition = QREF_CONDITIONS[conditionKey];
    if (!condition)
        return;
    const D = window.D;
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
    if (!current.effects)
        current.effects = [];
    if (current.effects.find((e) => e.name === condition.effect.name)) {
        showToast(`${current.name} ist bereits ${condition.effect.name}`, 'info');
        return;
    }
    const pushUndo = window.pushUndo;
    if (pushUndo)
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
    const renderInit = window.renderInit;
    const save = window.save;
    if (renderInit)
        renderInit();
    if (save)
        save();
}
/**
 * Wuerfelt eine Formel aus der Quick Reference
 * @param diceFormula - Wuerfelformel (z.B. '3d6', '1d20')
 */
function rollQrefDice(diceFormula) {
    if (!diceFormula)
        return;
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
    if (typeof window.addToHistory === 'function') {
        window.addToHistory({
            formula: diceFormula,
            result: total,
            rolls: rolls,
            timestamp: Date.now()
        });
    }
}
/**
 * Filtert Quick Reference Sections nach Suchbegriff
 * @param query - Suchbegriff
 */
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
        const text = section.textContent?.toLowerCase() || '';
        const matches = text.includes(searchTerm);
        section.classList.toggle('search-hidden', !matches);
        section.classList.toggle('search-match', matches);
        // Expand matching sections
        if (matches) {
            section.classList.remove('collapsed');
        }
    });
}
/**
 * Initialisiert die Suche im Quick Reference Panel
 * Registriert Event-Listener fuer Input und Escape-Taste
 */
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
    if (e && e.target?.closest('.quick-ref-section-content'))
        return;
    sectionEl.classList.toggle('expanded');
}
// ============================================================
// EINHEITEN-UMRECHNER (Metrisch ↔ Imperial)
// ============================================================
// Conversion factors to meters
const METRIC_TO_M = { cm: 0.01, m: 1, km: 1000 };
// Conversion factors from meters to imperial
const M_TO_IMPERIAL = { in: 39.3701, ft: 3.28084, mi: 0.000621371 };
// Conversion factors from imperial to meters
const IMPERIAL_TO_M = { in: 0.0254, ft: 0.3048, mi: 1609.344 };
/**
 * Rundet nach D&D-Stil: 1-4 ab, 5-9 auf
 */
function dndRound(value) {
    return Math.round(value);
}
/**
 * Konvertiert von Metrisch zu Imperial
 */
function convertUnitsMetric() {
    const input = $('qref-conv-metric');
    const metricUnitEl = $('qref-conv-metric-unit');
    const imperialUnitEl = $('qref-conv-imperial-unit');
    const output = $('qref-conv-imperial');
    if (!input || !metricUnitEl || !imperialUnitEl || !output)
        return;
    const metricUnit = metricUnitEl.value;
    const imperialUnit = imperialUnitEl.value;
    const value = parseFloat(input.value);
    if (isNaN(value) || value === 0) {
        output.value = '';
        return;
    }
    // Convert to meters first, then to target imperial unit
    const meters = value * METRIC_TO_M[metricUnit];
    const result = meters * M_TO_IMPERIAL[imperialUnit];
    output.value = String(dndRound(result));
}
/**
 * Konvertiert von Imperial zu Metrisch
 */
function convertUnitsImperial() {
    const input = $('qref-conv-imperial');
    const imperialUnitEl = $('qref-conv-imperial-unit');
    const metricUnitEl = $('qref-conv-metric-unit');
    const output = $('qref-conv-metric');
    if (!input || !imperialUnitEl || !metricUnitEl || !output)
        return;
    const imperialUnit = imperialUnitEl.value;
    const metricUnit = metricUnitEl.value;
    const value = parseFloat(input.value);
    if (isNaN(value) || value === 0) {
        output.value = '';
        return;
    }
    // Convert to meters first, then to target metric unit
    const meters = value * IMPERIAL_TO_M[imperialUnit];
    const result = meters / METRIC_TO_M[metricUnit];
    output.value = String(dndRound(result));
}
// ============================================================
// SCHNELL-REFERENZ BENUTZERDEFINIERTE EINTRÄGE
// ============================================================
/**
 * Initialisiert die benutzerdefinierten Quick Reference Eintraege
 */
function initQuickRefCustom() {
    const D = window.D;
    // Initialisiere quickRefCustom Array falls nicht vorhanden
    if (!D.quickRefCustom)
        D.quickRefCustom = [];
    renderQuickRefCustom();
    initQrefSearch();
}
/**
 * Rendert die benutzerdefinierten Quick Reference Eintraege
 */
function renderQuickRefCustom() {
    const D = window.D;
    const esc = window.esc;
    const parseEntityLinks = window.parseEntityLinks;
    const container = $('quick-ref-custom');
    if (!container)
        return;
    // Update empty state visibility
    const emptyEl = $('qref-custom-empty');
    if (emptyEl) {
        emptyEl.style.display = (D.quickRefCustom && D.quickRefCustom.length > 0) ? 'none' : 'block';
    }
    if (!D.quickRefCustom || D.quickRefCustom.length === 0) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = D.quickRefCustom.map((entry) => {
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
/**
 * Oeffnet das Modal zum Hinzufuegen eines neuen Quick Reference Eintrags
 */
function addQuickRefEntry() {
    const editId = $('quick-ref-edit-id');
    const title = $('quick-ref-entry-title');
    const content = $('quick-ref-entry-content');
    const modalTitle = $('quick-ref-modal-title');
    if (editId)
        editId.value = '';
    if (title)
        title.value = '';
    if (content)
        content.innerHTML = '';
    if (modalTitle)
        modalTitle.textContent = 'Eintrag hinzufügen';
    const showModal = window.showModal;
    if (showModal)
        showModal('quick-ref-entry-modal');
    setTimeout(() => title?.focus(), 100);
}
/**
 * Oeffnet das Modal zum Bearbeiten eines Quick Reference Eintrags
 * @param id - Eintrag-ID
 */
function editQuickRefEntry(id) {
    const D = window.D;
    const entry = D.quickRefCustom?.find((e) => e.id === id);
    if (!entry)
        return;
    const editId = $('quick-ref-edit-id');
    const title = $('quick-ref-entry-title');
    const content = $('quick-ref-entry-content');
    const modalTitle = $('quick-ref-modal-title');
    if (editId)
        editId.value = String(id);
    if (title)
        title.value = entry.title || '';
    if (content)
        content.innerHTML = entry.content || '';
    if (modalTitle)
        modalTitle.textContent = 'Eintrag bearbeiten';
    const showModal = window.showModal;
    if (showModal)
        showModal('quick-ref-entry-modal');
}
/**
 * Speichert einen Quick Reference Eintrag (neu oder bearbeitet)
 */
function saveQuickRefEntry() {
    const D = window.D;
    const nextId = window.nextId;
    const hideModal = window.hideModal;
    const save = window.save;
    const editIdEl = $('quick-ref-edit-id');
    const titleEl = $('quick-ref-entry-title');
    const contentEl = $('quick-ref-entry-content');
    if (!editIdEl || !titleEl || !contentEl)
        return;
    const id = editIdEl.value;
    const title = titleEl.value.trim();
    const content = sanitizeHTML(contentEl.innerHTML);
    if (!title) {
        showToast('⚠️ Titel erforderlich', 'error');
        return;
    }
    if (!D.quickRefCustom)
        D.quickRefCustom = [];
    if (id) {
        // Bearbeiten
        const idx = D.quickRefCustom.findIndex((e) => e.id === parseEntityId(id));
        if (idx > -1) {
            D.quickRefCustom[idx].title = title;
            D.quickRefCustom[idx].content = content;
        }
    }
    else {
        // Neu
        D.quickRefCustom.push({
            id: nextId('quickRefCustom'),
            title: title,
            content: content,
            expanded: true
        });
    }
    if (hideModal)
        hideModal('quick-ref-entry-modal');
    renderQuickRefCustom();
    if (save)
        save();
    showToast('📌 Eintrag gespeichert');
}
/**
 * Loescht einen Quick Reference Eintrag nach Bestaetigung
 * @param id - Eintrag-ID
 */
function deleteQuickRefEntry(id) {
    if (!confirm('Eintrag wirklich löschen?'))
        return;
    const D = window.D;
    const pushUndo = window.pushUndo;
    const save = window.save;
    if (pushUndo)
        pushUndo('Schnellreferenz gelöscht');
    D.quickRefCustom = (D.quickRefCustom || []).filter((e) => e.id !== id);
    renderQuickRefCustom();
    if (save)
        save();
    showToast('🗑️ Eintrag gelöscht');
}
/**
 * Klappt einen benutzerdefinierten Eintrag ein/aus
 * @param id - Eintrag-ID
 */
function toggleQuickRefCustomEntry(id) {
    const D = window.D;
    const save = window.save;
    const entry = D.quickRefCustom?.find((e) => e.id === id);
    if (entry) {
        entry.expanded = !entry.expanded;
        renderQuickRefCustom();
        if (save)
            save();
    }
}
// ============================================================
//# sourceMappingURL=quick-reference.js.map