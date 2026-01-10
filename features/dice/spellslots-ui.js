// [SECTION:SPELLSLOTS_UI]
// Extrahiert aus dice.js
// Zauberplatz-UI
// Zeilen: 106
// ============================================================
// SPELL SLOTS TRACKING
// ============================================================
var renderParty = window.renderParty;
function getSpellSlots(charId) {
    const ch = EntityLookup.character(charId);
    if (!ch)
        return null;
    // Initialisiere spellSlots wenn nicht vorhanden
    if (!ch.spellSlots) {
        ch.spellSlots = {};
        for (let i = 0; i <= 9; i++) {
            ch.spellSlots[i] = { max: 0, current: 0 };
        }
        // Nur bei Neu-Initialisierung: Automatische Berechnung basierend auf Klasse und Level
        const autoSlots = getSpellSlotsForClass(ch.characterClass, ch.level || 1);
        for (let i = 0; i < 9; i++) {
            const level = i + 1;
            if (autoSlots[i] > 0) {
                ch.spellSlots[level] = { max: autoSlots[i], current: autoSlots[i] };
            }
        }
    }
    // Stelle sicher, dass alle Slot-Levels existieren
    for (let i = 0; i <= 9; i++) {
        if (!ch.spellSlots[i]) {
            ch.spellSlots[i] = { max: 0, current: 0 };
        }
    }
    return ch.spellSlots;
}
function toggleSpellSlot(charId, level) {
    const ch = EntityLookup.character(charId);
    if (!ch || !ch.spellSlots || !ch.spellSlots[level])
        return;
    const slot = ch.spellSlots[level];
    if (slot.current > 0) {
        slot.current--;
    }
    else {
        slot.current = slot.max;
    }
    renderParty();
    save();
}
function restoreAllSpellSlots(charId) {
    const ch = EntityLookup.character(charId);
    if (!ch || !ch.spellSlots)
        return;
    for (let i = 1; i <= 9; i++) {
        if (ch.spellSlots[i]) {
            ch.spellSlots[i].current = ch.spellSlots[i].max;
        }
    }
    renderParty();
    save();
    showToast('Zauberslots wiederhergestellt');
}
function renderSpellSlotPips(charId) {
    const slots = getSpellSlots(charId);
    if (!slots)
        return '';
    let html = '';
    let hasSlots = false;
    // Slot 0 (Zaubertricks) - wird nicht verbraucht, nur als Zähler anzeigen
    const cantrips = slots[0];
    if (cantrips && cantrips.max > 0) {
        hasSlots = true;
        html += `<span style="margin-right: 10px; display: inline-flex; align-items: center;" title="Bekannte Zaubertricks">`;
        html += `<span style="font-size: 10px; color: var(--gold); margin-right: 3px;">🔮</span>`;
        html += `<span style="font-size: 11px; color: var(--purple); font-weight: 600;">${cantrips.max}</span>`;
        html += `</span>`;
    }
    for (let level = 1; level <= 9; level++) {
        const slot = slots[level];
        if (slot && slot.max > 0) {
            hasSlots = true;
            html += `<span style="margin-right: 8px; display: inline-flex; align-items: center;">`;
            html += `<span style="font-size: 10px; color: var(--text-dim); margin-right: 2px;">${level}:</span>`;
            for (let i = 0; i < slot.max; i++) {
                const filled = i < slot.current;
                html += `<span class="slot-pip ${filled ? 'filled' : ''}" data-action="toggle-spell-slot-stop" data-id="${charId}" data-value="${level}" title="Grad ${level} Slot ${filled ? '(verfügbar)' : '(verbraucht)'}"></span>`;
            }
            html += `</span>`;
        }
    }
    if (hasSlots) {
        html += `<button class="btn btn-sm" style="font-size: 10px; padding: 2px 6px; margin-left: 8px;" data-action="restore-spell-slots-stop" data-id="${charId}" title="Alle Slots wiederherstellen">🔄</button>`;
    }
    return hasSlots ? `<div class="spell-slots-compact" data-stop-propagation="true">${html}</div>` : '';
}
// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================
window.getSpellSlots = getSpellSlots;
window.toggleSpellSlot = toggleSpellSlot;
window.restoreAllSpellSlots = restoreAllSpellSlots;
window.renderSpellSlotPips = renderSpellSlotPips;
