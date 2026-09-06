// [SECTION:DMSCREEN_WIDGETS_BASE]
// ============================================================
// DM SCREEN - BASIS-WIDGETS
// ============================================================
// Teil der MAINT-01-Aufteilung von dmscreen-render.js (Plan 13-12, Task 2).
// Enthaelt die 8 urspruenglichen Basis-Widgets (Party, Initiative, Wuerfel,
// Zustaende-Kompakt, DC-Referenz, Zufallstabellen, Regeln, Notizen).
// dmsRollDice() und saveDMSNotes() werden von aussen aufgerufen (EVENT
// HANDLERS in dmscreen-render.js bzw. data-on-input-Mechanismus in
// ui/event-delegation.js) -- deshalb im EXPORTS-Block. Alle uebrigen
// Render-Funktionen werden ausschliesslich ueber die Widget-Registry
// (getDMScreenWidgets() in dmscreen-render.js) aufgerufen.
// ============================================================

/**
 * Compact Conditions Button für Quick Bar
 */
function renderDMSConditionsCompact() {
    return `
        <button class="dms-quick-btn" data-action="dms-show-condition" title="Zustände-Übersicht">
            <span class="dms-quick-icon">📋</span>
            <span class="dms-quick-label">Zustände</span>
        </button>
    `;
}
// ============================================================
// PARTY WIDGET
// ============================================================
function renderDMSPartyWidget() {
    const COMBAT_CONSTANTS = window.COMBAT_CONSTANTS;
    const chars = D.characters || [];
    if (chars.length === 0) {
        return '<div class="dms-widget-empty">Keine Charaktere</div>';
    }
    // Calculate party HP % (using correct property names: hpCurrent, hpMax)
    const totalHp = chars.reduce((sum, c) => sum + (c.hpCurrent || 0), 0);
    const totalMaxHp = chars.reduce((sum, c) => sum + (c.hpMax || 1), 0);
    const hpPercent = totalMaxHp > 0 ? Math.round((totalHp / totalMaxHp) * 100) : 100;
    // Find character with HIGHEST passive perception
    let highestPP = 0;
    let highestPPChar = '';
    chars.forEach(c => {
        const pp = c.passivePerception || 10;
        if (pp > highestPP) {
            highestPP = pp;
            highestPPChar = c.name || 'Unbekannt';
        }
    });
    // HP bar color
    let hpClass = 'healthy';
    if (hpPercent <= COMBAT_CONSTANTS.HP_BLOODIED_THRESHOLD) hpClass = 'bloodied';
    if (hpPercent <= COMBAT_CONSTANTS.HP_CRITICAL_THRESHOLD) hpClass = 'critical';
    return `
        <div class="dms-party-stats">
            <div class="dms-stat-row">
                <span class="dms-stat-label">Party HP</span>
                <div class="dms-hp-bar-container">
                    <div class="dms-hp-bar ${hpClass}" style="width: ${hpPercent}%"></div>
                    <span class="dms-hp-text">${hpPercent}%</span>
                </div>
            </div>
            <div class="dms-stat-row">
                <span class="dms-stat-label">Höchste Pass. Wahrn.</span>
                <span class="dms-stat-value">${highestPP} <span class="dms-stat-char">(${esc(highestPPChar)})</span></span>
            </div>
            <div class="dms-stat-row">
                <span class="dms-stat-label">Spieler</span>
                <span class="dms-stat-value">${chars.length}</span>
            </div>
        </div>
    `;
}
// ============================================================
// INITIATIVE WIDGET
// ============================================================
function renderDMSInitiativeWidget() {
    const combatants = D.initiative?.combatants || [];
    const currentTurn = D.initiative?.currentTurn || 0;
    const round = D.initiative?.round || 1;
    if (combatants.length === 0) {
        return '<div class="dms-widget-empty">Kein aktiver Kampf</div>';
    }
    return `
        <div class="dms-initiative">
            <div class="dms-init-header">Runde ${round} <span class="dms-init-count">(${combatants.length})</span></div>
            <div class="dms-init-list">
                ${combatants
                    .map((c, i) => {
                        const isCurrent = i === currentTurn;
                        const hpPercent =
                            c.maxHp > 0 ? Math.round((c.currentHp / c.maxHp) * 100) : 100;
                        let hpClass = 'healthy';
                        if (hpPercent < 50) hpClass = 'bloodied';
                        if (hpPercent < 25) hpClass = 'critical';
                        if (c.currentHp <= 0) hpClass = 'down';
                        return `
                        <div class="dms-init-entry ${isCurrent ? 'active' : ''} ${hpClass}">
                            <span class="dms-init-marker">${isCurrent ? '▶' : ''}</span>
                            <span class="dms-init-name">${esc(c.name)}</span>
                            <span class="dms-init-value">${c.initiative || 0}</span>
                        </div>
                    `;
                    })
                    .join('')}
            </div>
        </div>
    `;
}
// ============================================================
// DICE WIDGET
// ============================================================
function renderDMSDiceWidget() {
    return `
        <div class="dms-dice">
            <div class="dms-dice-buttons">
                <button class="dms-dice-btn" data-action="dms-roll" data-dice="1d4">d4</button>
                <button class="dms-dice-btn" data-action="dms-roll" data-dice="1d6">d6</button>
                <button class="dms-dice-btn" data-action="dms-roll" data-dice="1d8">d8</button>
                <button class="dms-dice-btn" data-action="dms-roll" data-dice="1d10">d10</button>
                <button class="dms-dice-btn" data-action="dms-roll" data-dice="1d12">d12</button>
                <button class="dms-dice-btn dms-dice-d20" data-action="dms-roll" data-dice="1d20">d20</button>
                <button class="dms-dice-btn" data-action="dms-roll" data-dice="1d100">d100</button>
            </div>
            <div class="dms-dice-result" id="dms-dice-result">—</div>
            <div class="dms-dice-custom">
                <input type="text" id="dms-dice-formula" placeholder="z.B. 2d6+3" class="dms-dice-input">
                <button class="btn btn-sm" data-action="dms-roll-custom">🎲</button>
            </div>
        </div>
    `;
}
/**
 * DM Screen Würfelwurf
 */
function dmsRollDice(formula) {
    let result = 0;
    let rolls = [];
    // Use parseDiceNotation if available (returns object with total, rolls)
    if (typeof window.parseDiceNotation === 'function') {
        const parsed = window.parseDiceNotation(formula);
        if (parsed) {
            result = parsed.total;
            rolls = parsed.rolls;
        }
    } else {
        // Fallback: simple dice roll
        const match = formula.match(/(\d+)?d(\d+)/i);
        if (match) {
            const count = parseInt(match[1]) || 1;
            const sides = parseInt(match[2]);
            for (let i = 0; i < count; i++) {
                rolls.push(Math.floor(Math.random() * sides) + 1);
            }
            result = rolls.reduce((a, b) => a + b, 0);
        }
    }
    const resultEl = $('dms-dice-result');
    if (resultEl) {
        const rollsStr = rolls.length > 1 ? ` [${rolls.join(', ')}]` : '';
        resultEl.textContent = `${formula} = ${result}${rollsStr}`;
        resultEl.classList.add('rolled');
        setTimeout(() => resultEl.classList.remove('rolled'), 300);
    }
    // Add to dice history if available
    if (typeof window.addToDiceHistory === 'function') {
        window.addToDiceHistory(formula, result, rolls);
    }
    return result;
}
// ============================================================
// DC REFERENCE WIDGET
// ============================================================
function renderDMSDCWidget() {
    const dcs = [
        { dc: 5, desc: 'Trivial', color: 'var(--green)' },
        { dc: 10, desc: 'Leicht', color: 'var(--cyan)' },
        { dc: 15, desc: 'Mittel', color: 'var(--gold)' },
        { dc: 20, desc: 'Schwer', color: 'var(--orange)' },
        { dc: 25, desc: 'Sehr schwer', color: 'var(--red)' },
        { dc: 30, desc: 'Fast unmöglich', color: 'var(--purple)' }
    ];
    return `
        <div class="dms-dc-list">
            ${dcs
                .map(
                    d => `
                <div class="dms-dc-entry" style="border-left: 3px solid ${d.color}">
                    <span class="dms-dc-value">${d.dc}</span>
                    <span class="dms-dc-desc">${d.desc}</span>
                </div>
            `
                )
                .join('')}
        </div>
    `;
}
// ============================================================
// RANDOM TABLES WIDGET
// ============================================================
function renderDMSTablesWidget() {
    const tables = D.randomTables || [];
    if (tables.length === 0) {
        return '<div class="dms-widget-empty">Keine Tabellen</div>';
    }
    return `
        <div class="dms-tables">
            ${tables
                .slice(0, 5)
                .map(
                    t => `
                <div class="dms-table-entry">
                    <span class="dms-table-icon">${t.icon || '🎲'}</span>
                    <span class="dms-table-name">${esc(t.name)}</span>
                    <button class="btn btn-sm" data-action="dms-roll-table" data-table="${t.id}">Roll</button>
                </div>
            `
                )
                .join('')}
            <div class="dms-table-result" id="dms-table-result"></div>
        </div>
    `;
}
// ============================================================
// QUICK RULES WIDGET
// ============================================================
function renderDMSRulesWidget() {
    return `
        <div class="dms-rules">
            <div class="dms-rule-section">
                <div class="dms-rule-title">🛡️ Deckung</div>
                <div class="dms-rule-items">
                    <div class="dms-rule-item"><span>Halbe</span><span>+2 AC, +2 DEX-Rettung</span></div>
                    <div class="dms-rule-item"><span>3/4</span><span>+5 AC, +5 DEX-Rettung</span></div>
                    <div class="dms-rule-item"><span>Volle</span><span>Nicht anvisierbar</span></div>
                </div>
            </div>
            <div class="dms-rule-section">
                <div class="dms-rule-title">💡 Licht & Sicht</div>
                <div class="dms-rule-items">
                    <div class="dms-rule-item"><span>Hell</span><span>Normal sehen</span></div>
                    <div class="dms-rule-item"><span>Dämmrig</span><span>Nachteil Wahrn.</span></div>
                    <div class="dms-rule-item"><span>Dunkel</span><span>Effektiv blind</span></div>
                </div>
            </div>
            <div class="dms-rule-section">
                <div class="dms-rule-title">🏃 Bewegung</div>
                <div class="dms-rule-items">
                    <div class="dms-rule-item"><span>Schwierig</span><span>2× Bewegung</span></div>
                    <div class="dms-rule-item"><span>Springen</span><span>STR (weit) / 3+STR (hoch)</span></div>
                </div>
            </div>
        </div>
    `;
}
// ============================================================
// NOTES WIDGET
// ============================================================
function renderDMSNotesWidget() {
    const notes = D.dmScreenNotes || '';
    return `
        <div class="dms-notes">
            <textarea class="dms-notes-input" id="dms-notes-input"
                placeholder="Session-Notizen hier eingeben..."
                data-on-input="saveDMSNotes">${esc(notes)}</textarea>
        </div>
    `;
}
function saveDMSNotes() {
    const input = $('dms-notes-input');
    if (input) {
        D.dmScreenNotes = input.value;
        window.save();
    }
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.dmsRollDice = dmsRollDice;
window.saveDMSNotes = saveDMSNotes;
