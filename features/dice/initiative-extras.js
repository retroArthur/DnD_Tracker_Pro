// [SECTION:INITIATIVE_EXTRAS]
// Extrahiert aus dice.js
// Initiative Auto-Roll & Drag-Drop
// Zeilen: 83
// ============================================================
// INITIATIVE AUTO-ROLL & DRAG-DROP
// ============================================================
const D = window.D;
const renderInit = window.renderInit;
function rollAllInitiative() {
    if (!D.initiative || !D.initiative.combatants || D.initiative.combatants.length === 0) {
        showToast('Keine Kämpfer in der Initiative');
        return;
    }
    D.initiative.combatants.forEach((entry) => {
        const roll = Math.floor(Math.random() * 20) + 1;
        const bonus = parseInt(entry.initBonus) || 0;
        entry.initiative = roll + bonus;
        entry.lastRoll = roll;
    });
    // Auto-sort
    D.initiative.combatants.sort((a, b) => b.initiative - a.initiative);
    D.initiative.currentTurn = 0;
    renderInit();
    save();
    showToast('Initiative gewürfelt & sortiert');
}
// Drag and Drop for Initiative
let draggedInitItem = null;
function initDragDrop() {
    const list = $('init-list');
    if (!list)
        return;
    list.addEventListener('dragstart', function (e) {
        const target = e.target;
        const row = target.closest('.init-row');
        if (!row)
            return;
        draggedInitItem = row;
        row.classList.add('dragging');
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', row.dataset.id || '');
        }
    });
    list.addEventListener('dragend', function (e) {
        const target = e.target;
        const row = target.closest('.init-row');
        if (row)
            row.classList.remove('dragging');
        document.querySelectorAll('.init-row').forEach(r => r.classList.remove('drag-over'));
        draggedInitItem = null;
    });
    list.addEventListener('dragover', function (e) {
        e.preventDefault();
        const target = e.target;
        const row = target.closest('.init-row');
        if (row && row !== draggedInitItem) {
            document.querySelectorAll('.init-row').forEach(r => r.classList.remove('drag-over'));
            row.classList.add('drag-over');
        }
    });
    list.addEventListener('drop', function (e) {
        e.preventDefault();
        const target = e.target;
        const targetRow = target.closest('.init-row');
        if (!targetRow || !draggedInitItem || targetRow === draggedInitItem)
            return;
        const draggedId = parseEntityId(draggedInitItem.dataset.id);
        const targetId = parseEntityId(targetRow.dataset.id);
        const draggedIndex = D.initiative.combatants.findIndex((i) => i.id === draggedId);
        const targetIndex = D.initiative.combatants.findIndex((i) => i.id === targetId);
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
window.rollAllInitiative = rollAllInitiative;
window.initDragDrop = initDragDrop;
//# sourceMappingURL=initiative-extras.js.map