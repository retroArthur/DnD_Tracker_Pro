// [SECTION:QUICK_ACTIONS]
// ============================================================
// QUICK ACTIONS BAR - Combat Action Shortcuts
// ============================================================

/**
 * D&D 5e Standard-Aktionen im Kampf
 * Zeigt Quick Actions für den aktiven Combatant
 */

const QUICK_ACTIONS = Object.freeze({
    dodge: {
        name: 'Ausweichen',
        icon: '🛡️',
        desc: 'Angriffe gegen dich haben Nachteil bis zu deinem nächsten Zug (wenn du dich bewegen kannst).',
        effect: { name: 'Ausweichend', color: 'blue', duration: 1 }
    },
    dash: {
        name: 'Sprinten',
        icon: '🏃',
        desc: 'Verdoppelt deine Bewegungsreichweite für diesen Zug.',
        effect: { name: 'Sprintend', color: 'green', duration: 1 }
    },
    disengage: {
        name: 'Lösen',
        icon: '↩️',
        desc: 'Bewegung provoziert keine Gelegenheitsangriffe für diesen Zug.',
        effect: { name: 'Gelöst', color: 'cyan', duration: 1 }
    },
    hide: {
        name: 'Verstecken',
        icon: '👁️‍🗨️',
        desc: 'Stealth-Wurf gegen passive Wahrnehmung. Bei Erfolg unsichtbar für Feinde.',
        effect: { name: 'Versteckt', color: 'purple', duration: 999, permanent: true }
    },
    help: {
        name: 'Helfen',
        icon: '🤝',
        desc: 'Gib einem Verbündeten Vorteil auf seinen nächsten Wurf gegen ein Ziel.',
        effect: { name: 'Helfend', color: 'cyan', duration: 1 }
    },
    ready: {
        name: 'Bereithalten',
        icon: '⏳',
        desc: 'Bereite eine Aktion vor, die bei einem Auslöser als Reaktion ausgeführt wird.',
        effect: { name: 'Bereit', color: 'yellow', duration: 1 }
    },
    search: {
        name: 'Suchen',
        icon: '🔍',
        desc: 'Wahrnehmungs- oder Nachforschungswurf um etwas zu finden.',
        effect: { name: 'Suchend', color: 'orange', duration: 1 }
    },
    useObject: {
        name: 'Objekt benutzen',
        icon: '📦',
        desc: 'Interagiere mit einem Objekt (zusätzlich zur freien Objektinteraktion).',
        effect: { name: 'Objekt genutzt', color: 'gray', duration: 1 }
    }
});

// Quick Actions Bar in Initiative rendern
function renderQuickActionsBar() {
    const container = $('quick-actions-bar');
    if (!container) return;

    const init = D.initiative;
    if (!init.combatants.length) {
        container.style.display = 'none';
        return;
    }

    const current = init.combatants[init.currentTurn];
    if (!current || current.type === 'lair') {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = `
        <div class="qa-header">
            <span class="qa-label">⚡ Aktionen für ${esc(current.name)}:</span>
        </div>
        <div class="qa-buttons">
            ${Object.entries(QUICK_ACTIONS).map(([key, action]) => `
                <button class="qa-btn" data-action="apply-quick-action" data-id="${current.id}" data-value="${key}" title="${esc(action.desc)}">
                    <span class="qa-icon">${action.icon}</span>
                    <span class="qa-name">${action.name}</span>
                </button>
            `).join('')}
        </div>
    `;
}

function applyQuickAction(cbId, actionKey) {
    const cb = D.initiative.combatants.find(c => c.id === cbId);
    if (!cb) return;

    const action = QUICK_ACTIONS[actionKey];
    if (!action) return;

    pushUndo(`Quick Action: ${action.name}`);

    // Effekt anwenden falls vorhanden
    if (action.effect) {
        if (!cb.effects) cb.effects = [];

        // Prüfen ob Effekt bereits existiert
        const existing = cb.effects.find(e => e.name === action.effect.name);
        if (existing) {
            showToast(`${cb.name} ist bereits ${action.effect.name}`, 'info');
            return;
        }

        cb.effects.push({
            id: Date.now(),
            name: action.effect.name,
            color: action.effect.color,
            duration: action.effect.duration,
            permanent: action.effect.permanent || false,
            description: action.desc
        });

        showToast(`${action.icon} ${cb.name}: ${action.effect.name}`, 'success');
    }

    // Spezielle Aktionen ohne Effekt - nur Toast
    switch (actionKey) {
        case 'dash':
            let speed = '9m';
            if (cb.type === 'player') {
                const char = EntityLookup.findByName('characters', cb.name);
                if (char?.speed) {
                    speed = char.speed.split('|')[0];
                }
            }
            showToast(`${action.icon} ${cb.name} sprintet (2× ${speed})`, 'info');
            break;

        case 'hide':
            // Würfelt automatisch Stealth - Effekt wird oben gesetzt
            const stealthRoll = Math.floor(Math.random() * 20) + 1;
            let stealthMod = 0;
            if (cb.type === 'player') {
                const char = EntityLookup.findByName('characters', cb.name);
                if (char?.skills?.stealth) {
                    stealthMod = char.skills.stealth;
                }
            }
            const total = stealthRoll + stealthMod;
            showToast(`${action.icon} Stealth: ${stealthRoll}${stealthMod >= 0 ? '+' : ''}${stealthMod} = ${total}`, stealthRoll === 20 ? 'success' : stealthRoll === 1 ? 'error' : 'info');
            break;

        case 'help':
            showToast(`${action.icon} ${cb.name} hilft einem Verbündeten`, 'info');
            break;

        case 'search':
            const perceptionRoll = Math.floor(Math.random() * 20) + 1;
            let perceptionMod = 0;
            if (cb.type === 'player') {
                const char = EntityLookup.findByName('characters', cb.name);
                if (char?.skills?.perception) {
                    perceptionMod = char.skills.perception;
                }
            }
            const percTotal = perceptionRoll + perceptionMod;
            showToast(`${action.icon} Wahrnehmung: ${perceptionRoll}${perceptionMod >= 0 ? '+' : ''}${perceptionMod} = ${percTotal}`, perceptionRoll === 20 ? 'success' : perceptionRoll === 1 ? 'error' : 'info');
            break;

        case 'useObject':
            showToast(`${action.icon} ${cb.name} benutzt ein Objekt`, 'info');
            break;
    }

    renderInit();
    renderQuickActionsBar();
    save();
}

// Condition Quick Reference Modal
function showConditionReference() {
    const content = `
        <div class="condition-ref-content">
            <div class="condition-ref-header">
                <h3>📋 Zustände Referenz</h3>
                <button class="btn btn-sm" onclick="hideModal('condition-ref-modal')">✕</button>
            </div>
            <div class="condition-ref-search">
                <input type="text" id="condition-search" placeholder="🔍 Zustand suchen..." oninput="filterConditions()">
            </div>
            <div class="condition-ref-list" id="condition-ref-list">
                ${renderConditionList()}
            </div>
        </div>
    `;

    let modal = $('condition-ref-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'condition-ref-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal" style="max-width: 600px; max-height: 80vh;">${content}</div>`;
        modal.onclick = (e) => { if (e.target === modal) hideModal('condition-ref-modal'); };
        document.body.appendChild(modal);
    } else {
        modal.querySelector('.modal').innerHTML = content;
    }

    showModal('condition-ref-modal');
    $('condition-search')?.focus();
}

function renderConditionList(filter = '') {
    const filterLower = filter.toLowerCase();

    return Object.entries(CONDITIONS)
        .filter(([key, cond]) =>
            !filter ||
            cond.name.toLowerCase().includes(filterLower) ||
            cond.desc.toLowerCase().includes(filterLower)
        )
        .map(([key, cond]) => `
            <div class="condition-ref-item">
                <div class="condition-ref-name">
                    <span class="condition-ref-icon">${cond.icon}</span>
                    <span>${cond.name}</span>
                </div>
                <div class="condition-ref-desc">${esc(cond.desc)}</div>
            </div>
        `).join('') || '<div class="condition-ref-empty">Keine Zustände gefunden</div>';
}

function filterConditions() {
    const search = $('condition-search')?.value || '';
    const list = $('condition-ref-list');
    if (list) {
        list.innerHTML = renderConditionList(search);
    }
}
