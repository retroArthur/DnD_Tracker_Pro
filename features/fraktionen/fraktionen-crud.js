// [SECTION:FRAKTIONEN_CRUD]
// Fraktionen & Ruf-System — CRUD-Modul (WELT-05)
// Implementierung: Plan 05-07
// ============================================================
// Verwendete Globals: window.D, pushUndo, nextId, esc, sanitizeHTML,
//   deleteWithConfirm, afterCrudOperation, parseEntityId,
//   rufStufe (aus fraktionen-render.js), showToast, save, hideModal

var D = window.D;
var save = window.save;

/**
 * Speichert eine Fraktion (Neu oder Update).
 * Liest Formularfelder aus #fraktionen-modal.
 */
function saveFraktion() {
    var daten = window.D;
    var idInput = document.getElementById('edit-fraktion-id');
    var id = idInput ? idInput.value : '';

    var nameEl = document.getElementById('fraktion-name');
    var symbolEl = document.getElementById('fraktion-symbol');
    var agendaEl = document.getElementById('fraktion-agenda');
    var beschreibungEl = document.getElementById('fraktion-beschreibung');
    var sitzOrtIdEl = document.getElementById('fraktion-sitz-ort');
    var rivalenEl = document.getElementById('fraktion-rivalen');
    var verbuendeteEl = document.getElementById('fraktion-verbuendete');
    var rufEl = document.getElementById('fraktion-ruf-init');

    var name = nameEl ? nameEl.value.trim() : '';
    if (!name) {
        showToast('Fraktionsname darf nicht leer sein.', 'error');
        return;
    }

    // Symbol: max 2 Zeichen (analog random-tables-Icon-Muster)
    var symbolRaw = symbolEl ? symbolEl.value : '';
    var symbol = [...(symbolRaw || '')].slice(0, 2).join('');

    var agenda = agendaEl ? sanitizeHTML(agendaEl.innerHTML || '') : '';
    var beschreibung = beschreibungEl ? sanitizeHTML(beschreibungEl.innerHTML || '') : '';
    var sitzOrtId = sitzOrtIdEl ? (parseInt(sitzOrtIdEl.value) || null) : null;
    var rivalen = rivalenEl ? esc(rivalenEl.value.trim()) : '';
    var verbuendete = verbuendeteEl ? esc(verbuendeteEl.value.trim()) : '';

    pushUndo(id ? 'Fraktion bearbeitet' : 'Fraktion erstellt');

    if (id) {
        var numId = parseEntityId(id);
        var idx = daten.factions.findIndex(function(f) { return f.id === numId; });
        if (idx > -1) {
            daten.factions[idx] = Object.assign({}, daten.factions[idx], {
                name: name,
                symbol: symbol,
                agenda: agenda,
                beschreibung: beschreibung,
                sitzOrtId: sitzOrtId,
                rivalen: rivalen,
                verbuendete: verbuendete
            });
        }
    } else {
        var rufInit = rufEl ? (parseInt(rufEl.value) || 0) : 0;
        rufInit = Math.max(-50, Math.min(50, rufInit));
        var fraktion = {
            id: nextId('factions'),
            name: name,
            symbol: symbol,
            agenda: agenda,
            beschreibung: beschreibung,
            ruf: rufInit,
            rufHistorie: [],
            mitgliederNpcIds: [],
            sitzOrtId: sitzOrtId,
            rivalen: rivalen,
            verbuendete: verbuendete,
            links: []
        };
        daten.factions.push(fraktion);
    }

    if (typeof hideModal === 'function') hideModal('fraktionen-modal');
    if (typeof window.save === 'function') window.save();
    if (typeof window.renderFraktionen === 'function') window.renderFraktionen();
    showToast(id ? 'Fraktion aktualisiert' : 'Fraktion hinzugefügt', 'success');

    // Update counter
    var counter = document.getElementById('fraktionen-count');
    if (counter) counter.textContent = daten.factions.length;
}

/**
 * Löscht eine Fraktion mit Bestätigung und Undo.
 * @param {number|string} id
 */
function deleteFraktion(id) {
    deleteWithConfirm({
        entityType: 'factions',
        id: id,
        undoLabel: 'Fraktion gelöscht',
        onSuccess: function() {
            if (typeof window.renderFraktionen === 'function') window.renderFraktionen();
            var counter = document.getElementById('fraktionen-count');
            if (counter) counter.textContent = (window.D.factions || []).length;
            showToast('Fraktion gelöscht', 'success');
        }
    });
}

/**
 * Passt den Rufwert einer Fraktion an und schreibt einen Historieneintrag.
 * pushUndo() wird VOR der Mutation aufgerufen (T-05-26: Undo-Sicherheit).
 * @param {number|string} fraktionId
 * @param {number} delta - Änderung (z.B. +10 oder -5)
 * @param {string} [grund] - Optionale Begründung
 */
function anpassenRuf(fraktionId, delta, grund) {
    var daten = window.D;
    var numId = parseEntityId(fraktionId);
    if (numId === null) {
        showToast('Ungültige Fraktions-ID', 'error');
        return;
    }
    var faction = daten.factions.find(function(f) { return f.id === numId; });
    if (!faction) {
        showToast('Fraktion nicht gefunden', 'error');
        return;
    }

    // pushUndo VOR Mutation (T-05-26: Ruf-Änderung reversibel)
    pushUndo('Ruf angepasst');

    // Clamp to [-50, +50] (T-05-24: DoS-Schutz)
    var neuerRuf = Math.max(-50, Math.min(50, faction.ruf + delta));
    faction.ruf = neuerRuf;

    // Historieneintrag schreiben
    if (!faction.rufHistorie) faction.rufHistorie = [];
    faction.rufHistorie.push({
        delta: delta,
        grund: grund ? String(grund) : '',
        zeitstempel: Date.now()
    });

    if (typeof window.save === 'function') window.save();
    if (typeof window.renderFraktionen === 'function') window.renderFraktionen();
}

/**
 * Setzt den Rufwert direkt auf einen konkreten Wert (geklemmt -50..+50).
 * @param {number|string} fraktionId
 * @param {number} neuerWert
 * @param {string} [grund]
 */
function setzeRuf(fraktionId, neuerWert, grund) {
    var daten = window.D;
    var numId = parseEntityId(fraktionId);
    if (numId === null) return;
    var faction = daten.factions.find(function(f) { return f.id === numId; });
    if (!faction) return;

    pushUndo('Ruf gesetzt');

    var geklemmterWert = Math.max(-50, Math.min(50, parseInt(neuerWert) || 0));
    var delta = geklemmterWert - faction.ruf;
    faction.ruf = geklemmterWert;

    if (!faction.rufHistorie) faction.rufHistorie = [];
    faction.rufHistorie.push({
        delta: delta,
        grund: grund ? String(grund) : 'Direktes Setzen',
        zeitstempel: Date.now()
    });

    if (typeof window.save === 'function') window.save();
    if (typeof window.renderFraktionen === 'function') window.renderFraktionen();
}

/**
 * Öffnet das Fraktions-Modal für eine neue Fraktion.
 */
function showFraktionModal(id) {
    var daten = window.D;
    var idInput = document.getElementById('edit-fraktion-id');
    var nameEl = document.getElementById('fraktion-name');
    var symbolEl = document.getElementById('fraktion-symbol');
    var agendaEl = document.getElementById('fraktion-agenda');
    var beschreibungEl = document.getElementById('fraktion-beschreibung');
    var sitzOrtEl = document.getElementById('fraktion-sitz-ort');
    var rivalenEl = document.getElementById('fraktion-rivalen');
    var verbuendeteEl = document.getElementById('fraktion-verbuendete');
    var rufInitEl = document.getElementById('fraktion-ruf-init');

    // Populate Sitz-Ort-Select with D.locations
    if (sitzOrtEl) {
        sitzOrtEl.innerHTML = '<option value="">— Kein Sitz —</option>';
        (daten.locations || []).forEach(function(loc) {
            var opt = document.createElement('option');
            opt.value = loc.id;
            opt.textContent = loc.name || 'Unbekannt';
            sitzOrtEl.appendChild(opt);
        });
    }

    if (id) {
        // Edit mode
        var numId = parseEntityId(id);
        var faction = daten.factions.find(function(f) { return f.id === numId; });
        if (!faction) return;
        if (idInput) idInput.value = String(numId);
        if (nameEl) nameEl.value = faction.name || '';
        if (symbolEl) symbolEl.value = faction.symbol || '';
        if (agendaEl) agendaEl.innerHTML = sanitizeHTML(faction.agenda || '');
        if (beschreibungEl) beschreibungEl.innerHTML = sanitizeHTML(faction.beschreibung || '');
        if (sitzOrtEl && faction.sitzOrtId) sitzOrtEl.value = String(faction.sitzOrtId);
        if (rivalenEl) rivalenEl.value = faction.rivalen || '';
        if (verbuendeteEl) verbuendeteEl.value = faction.verbuendete || '';
        // Hide ruf-init in edit mode (Ruf via +/- Buttons im Detail)
        var rufInitGroup = document.getElementById('fraktion-ruf-init-group');
        if (rufInitGroup) rufInitGroup.style.display = 'none';
    } else {
        // New mode
        if (idInput) idInput.value = '';
        if (nameEl) nameEl.value = '';
        if (symbolEl) symbolEl.value = '';
        if (agendaEl) agendaEl.innerHTML = '';
        if (beschreibungEl) beschreibungEl.innerHTML = '';
        if (sitzOrtEl) sitzOrtEl.value = '';
        if (rivalenEl) rivalenEl.value = '';
        if (verbuendeteEl) verbuendeteEl.value = '';
        if (rufInitEl) rufInitEl.value = '0';
        var rufInitGroup2 = document.getElementById('fraktion-ruf-init-group');
        if (rufInitGroup2) rufInitGroup2.style.display = '';
    }

    if (typeof showModal === 'function') showModal('fraktionen-modal');
}

window.saveFraktion = saveFraktion;
window.deleteFraktion = deleteFraktion;
window.anpassenRuf = anpassenRuf;
window.setzeRuf = setzeRuf;
window.showFraktionModal = showFraktionModal;
