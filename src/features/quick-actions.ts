// [SECTION:QUICK_ACTIONS]
// ============================================================
// QUICK ACTIONS BAR - Combat Action Shortcuts
// ============================================================

/**
 * D&D 5e Standard Combat Actions
 * Shows Quick Actions for the active combatant
 */

import { $, esc } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { pushUndo } from '@systems/undo';
import { EntityLookup } from '@render/helpers';
import { showModal, hideModal } from '@systems/spellslots/navigation';

interface QuickAction {
    name: string;
    icon: string;
    desc: string;
    effect?: {
        name: string;
        color: string;
        duration: number;
        permanent?: boolean;
    };
}

const QUICK_ACTIONS: Readonly<Record<string, QuickAction>> = Object.freeze({
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

// Render Quick Actions Bar in Initiative
export function renderQuickActionsBar(): void {
    const D = (window as any).D;
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

export function applyQuickAction(cbId: number | string, actionKey: string): void {
    const D = (window as any).D;
    const renderInit = (window as any).renderInit;

    const id = typeof cbId === 'string' ? parseInt(cbId) : cbId;
    const cb = D.initiative.combatants.find((c: any) => c.id === id);
    if (!cb) return;

    const action = QUICK_ACTIONS[actionKey];
    if (!action) return;

    pushUndo(`Quick Action: ${action.name}`);

    // Apply effect if present
    if (action.effect) {
        if (!cb.effects) cb.effects = [];

        // Check if effect already exists
        const existing = cb.effects.find((e: any) => e.name === action.effect!.name);
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

    // Special actions without effect - only toast
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
            // Automatically rolls Stealth - effect is set above
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
export function showConditionReference(): void {
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
        modal.onclick = (e: MouseEvent) => { if (e.target === modal) hideModal('condition-ref-modal'); };
        document.body.appendChild(modal);
    } else {
        const modalContent = modal.querySelector('.modal');
        if (modalContent) modalContent.innerHTML = content;
    }

    showModal('condition-ref-modal');
    const searchInput = $('condition-search');
    if (searchInput) (searchInput as HTMLInputElement).focus();
}

function renderConditionList(filter: string = ''): string {
    const CONDITIONS = (window as any).CONDITIONS;
    const filterLower = filter.toLowerCase();

    const items = Object.entries(CONDITIONS)
        .filter(([key, cond]: [string, any]) =>
            !filter ||
            cond.name.toLowerCase().includes(filterLower) ||
            cond.desc.toLowerCase().includes(filterLower)
        )
        .map(([key, cond]: [string, any]) => `
            <div class="condition-ref-item">
                <div class="condition-ref-name">
                    <span class="condition-ref-icon">${cond.icon}</span>
                    <span>${cond.name}</span>
                </div>
                <div class="condition-ref-desc">${esc(cond.desc)}</div>
            </div>
        `).join('');

    return items || '<div class="condition-ref-empty">Keine Zustände gefunden</div>';
}

export function filterConditions(): void {
    const searchInput = $('condition-search') as HTMLInputElement | null;
    const search = searchInput?.value || '';
    const list = $('condition-ref-list');
    if (list) {
        list.innerHTML = renderConditionList(search);
    }
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).QUICK_ACTIONS = QUICK_ACTIONS;
(window as any).renderQuickActionsBar = renderQuickActionsBar;
(window as any).applyQuickAction = applyQuickAction;
(window as any).showConditionReference = showConditionReference;
(window as any).filterConditions = filterConditions;
