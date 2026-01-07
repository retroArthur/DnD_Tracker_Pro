// [SECTION:INITIATIVE_EXTRAS]
// Extrahiert aus dice.js
// Initiative Auto-Roll & Drag-Drop
// Zeilen: 83

import { $ } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { parseEntityId } from '@utils/utilities';

// ============================================================
// INITIATIVE AUTO-ROLL & DRAG-DROP
// ============================================================

const D = (window as any).D;
const renderInit = (window as any).renderInit;

export function rollAllInitiative(): void {
    if (!D.initiative || !D.initiative.combatants || D.initiative.combatants.length === 0) {
        showToast('Keine Kämpfer in der Initiative');
        return;
    }

    D.initiative.combatants.forEach((entry: any) => {
        const roll = Math.floor(Math.random() * 20) + 1;
        const bonus = parseInt(entry.initBonus) || 0;
        entry.initiative = roll + bonus;
        entry.lastRoll = roll;
    });

    // Auto-sort
    D.initiative.combatants.sort((a: any, b: any) => b.initiative - a.initiative);
    D.initiative.currentTurn = 0;

    renderInit();
    save();
    showToast('Initiative gewürfelt & sortiert');
}

// Drag and Drop for Initiative
let draggedInitItem: HTMLElement | null = null;

export function initDragDrop(): void {
    const list = $('init-list');
    if (!list) return;

    list.addEventListener('dragstart', function(e: DragEvent) {
        const target = e.target as HTMLElement;
        const row = target.closest('.init-row') as HTMLElement | null;
        if (!row) return;
        draggedInitItem = row;
        row.classList.add('dragging');
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', row.dataset.id || '');
        }
    });

    list.addEventListener('dragend', function(e: DragEvent) {
        const target = e.target as HTMLElement;
        const row = target.closest('.init-row') as HTMLElement | null;
        if (row) row.classList.remove('dragging');
        document.querySelectorAll('.init-row').forEach(r => r.classList.remove('drag-over'));
        draggedInitItem = null;
    });

    list.addEventListener('dragover', function(e: DragEvent) {
        e.preventDefault();
        const target = e.target as HTMLElement;
        const row = target.closest('.init-row') as HTMLElement | null;
        if (row && row !== draggedInitItem) {
            document.querySelectorAll('.init-row').forEach(r => r.classList.remove('drag-over'));
            row.classList.add('drag-over');
        }
    });

    list.addEventListener('drop', function(e: DragEvent) {
        e.preventDefault();
        const target = e.target as HTMLElement;
        const targetRow = target.closest('.init-row') as HTMLElement | null;
        if (!targetRow || !draggedInitItem || targetRow === draggedInitItem) return;

        const draggedId = parseEntityId(draggedInitItem.dataset.id);
        const targetId = parseEntityId(targetRow.dataset.id);

        const draggedIndex = D.initiative.combatants.findIndex((i: any) => i.id === draggedId);
        const targetIndex = D.initiative.combatants.findIndex((i: any) => i.id === targetId);

        if (draggedIndex > -1 && targetIndex > -1) {
            const [removed] = D.initiative.combatants.splice(draggedIndex, 1);
            D.initiative.combatants.splice(targetIndex, 0, removed);
            renderInit();
            save();
        }

        document.querySelectorAll('.init-row').forEach(r => r.classList.remove('drag-over'));
    });
}

// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================

(window as any).rollAllInitiative = rollAllInitiative;
(window as any).initDragDrop = initDragDrop;
