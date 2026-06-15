// [SECTION:SESSION_PREP_CRUD]
// Session-Prep-Assistent — CRUD-Modul (WELT-01)
// Plan 05-03: Vollständige Implementierung
// ============================================================
// Verwendete Globals (module-level var für window-attached):
//   pushUndo          — const in systems/undo.js → direkt aufrufen
//   nextId            — const in utils/utilities.js → direkt aufrufen
//   parseEntityId     — const in utils/utilities.js → direkt aufrufen
//   esc               — const in utils/basic.js → direkt aufrufen
//   sanitizeHTML      — const in utils/basic.js → direkt aufrufen
//   deleteWithConfirm — const in utils/crud-helpers.js → direkt aufrufen
//   afterCrudOperation — const in utils/crud-helpers.js → direkt aufrufen
//   showToast         — const in utils/utilities.js → direkt aufrufen

var D = window.D;
var save = window.save;

// ============================================================
// OFFENE FÄDEN — Vorschlag aus D.quests und D.storyArcs
// ============================================================

/**
 * Sammelt offene Fäden aus D.quests (!q.completed) und D.storyArcs (status !== 'completed').
 * Lesezugriff only — schreibt NICHT in Quests oder Arcs.
 * @returns {Array<{text: string, quelleId: number|null, quelleTyp: string}>}
 */
function sammleOffeneFaeden() {
    var daten = window.D || {};
    var faeden = [];

    // Offene Quests (nicht abgeschlossen)
    var quests = daten.quests || [];
    quests.forEach(function(q) {
        if (!q.completed) {
            faeden.push({
                text: q.title || q.name || 'Unbenannte Quest',
                quelleId: q.id || null,
                quelleTyp: 'quest'
            });
        }
    });

    // Offene Story-Arcs (status !== 'completed', falls vorhanden)
    var arcs = daten.storyArcs || [];
    arcs.forEach(function(arc) {
        if (arc.status !== 'completed' && arc.status !== 'abgeschlossen') {
            faeden.push({
                text: arc.title || arc.name || 'Unbenannter Story-Arc',
                quelleId: arc.id || null,
                quelleTyp: 'storyArc'
            });
        }
    });

    return faeden;
}

// ============================================================
// SAVE — Neue Session-Prep anlegen oder bestehende aktualisieren
// ============================================================

/**
 * Liest Formularfelder der Session-Prep aus dem Modal und speichert den Eintrag.
 * Ruft pushUndo() VOR der Mutation auf (ZWINGEND).
 * Bei Neuanlage: nextId('sessionPreps'), erstellt = Date.now().
 */
function saveSessionPrep() {
    var daten = window.D;
    if (!daten) return;

    var idInput = document.getElementById('prep-edit-id');
    var id = idInput ? idInput.value.trim() : '';

    // Szenen aus der dynamischen Szenen-Liste auslesen
    var szenen = [];
    var szenenContainer = document.getElementById('prep-szenen-container');
    if (szenenContainer) {
        var szenenElems = szenenContainer.querySelectorAll('.wp-szene-item');
        szenenElems.forEach(function(elem, idx) {
            var titelEl = elem.querySelector('.wp-szene-titel');
            var beschEl = elem.querySelector('.wp-szene-beschreibung');
            var ortEl = elem.querySelector('.wp-szene-ort');
            szenen.push({
                id: idx + 1,
                titel: titelEl ? esc(titelEl.value || '') : '',
                beschreibung: beschEl ? sanitizeHTML(beschEl.innerHTML || '') : '',
                ort: ortEl ? esc(ortEl.value || '') : ''
            });
        });
    }

    // Offene Fäden: Auto-vorgeschlagene + manuell ergänzte sammeln
    var offeneFaeden = [];
    var faedenContainer = document.getElementById('prep-faeden-container');
    if (faedenContainer) {
        var faedenElems = faedenContainer.querySelectorAll('.wp-faden-item');
        faedenElems.forEach(function(elem) {
            var textEl = elem.querySelector('.wp-faden-text');
            var quelleIdEl = elem.querySelector('.wp-faden-quelle-id');
            var quelleTypEl = elem.querySelector('.wp-faden-quelle-typ');
            if (textEl && textEl.value.trim()) {
                offeneFaeden.push({
                    text: esc(textEl.value.trim()),
                    quelleId: quelleIdEl ? (parseEntityId(quelleIdEl.value) || null) : null,
                    quelleTyp: quelleTypEl ? quelleTypEl.value : 'manual'
                });
            }
        });
    }

    // Manuell ergänzter Faden aus Eingabefeld
    var manuellerFadenInput = document.getElementById('prep-faeden-manuell');
    if (manuellerFadenInput && manuellerFadenInput.value.trim()) {
        offeneFaeden.push({
            text: esc(manuellerFadenInput.value.trim()),
            quelleId: null,
            quelleTyp: 'manual'
        });
    }

    // Felder lesen und bereinigen
    var strongStartEl = document.getElementById('prep-strong-start');
    var hinweiseEl = document.getElementById('prep-hinweise');
    var npcsEl = document.getElementById('prep-npcs');
    var belohnungenEl = document.getElementById('prep-belohnungen');
    var sessionNrEl = document.getElementById('prep-session-nr');
    var datumEl = document.getElementById('prep-datum');
    var inGameDatumEl = document.getElementById('prep-ingame-datum');

    var prep = {
        strongStart: strongStartEl ? sanitizeHTML(strongStartEl.innerHTML || '') : '',
        szenen: szenen,
        geheimeHinweise: hinweiseEl ? sanitizeHTML(hinweiseEl.innerHTML || '') : '',
        wichtigeNpcs: npcsEl ? sanitizeHTML(npcsEl.innerHTML || '') : '',
        belohnungen: belohnungenEl ? esc(belohnungenEl.value || '') : '',
        sessionNr: sessionNrEl ? (parseInt(sessionNrEl.value) || 0) : 0,
        datum: datumEl ? esc(datumEl.value || '') : '',
        inGameDatum: inGameDatumEl ? esc(inGameDatumEl.value || '') : '',
        offeneFaeden: offeneFaeden,
        links: []
    };

    // pushUndo() ZWINGEND VOR der Mutation
    pushUndo(id ? 'Session-Prep bearbeitet' : 'Session-Prep gespeichert');

    if (id) {
        var numId = parseEntityId(id);
        var idx = daten.sessionPreps.findIndex(function(p) { return p.id === numId; });
        if (idx > -1) {
            prep.id = numId;
            prep.erstellt = daten.sessionPreps[idx].erstellt;
            daten.sessionPreps[idx] = Object.assign({}, daten.sessionPreps[idx], prep);
        }
    } else {
        prep.id = nextId('sessionPreps');
        prep.erstellt = Date.now();
        daten.sessionPreps.push(prep);
    }

    // Modal schließen, speichern und rendern
    if (typeof hideModal === 'function') hideModal('session-prep-modal');
    if (typeof window.save === 'function') window.save();
    if (typeof renderSessionPrepList === 'function') renderSessionPrepList();
    showToast(id ? 'Session-Prep aktualisiert' : 'Session-Prep gespeichert', 'success');
}

// ============================================================
// DELETE — Session-Prep mit Bestätigung und Undo löschen
// ============================================================

/**
 * Löscht eine Session-Prep per deleteWithConfirm.
 * @param {number|string} id - ID der zu löschenden Session-Prep
 */
function deleteSessionPrep(id) {
    deleteWithConfirm({
        entityType: 'sessionPreps',
        id: id,
        undoLabel: 'Session-Prep gelöscht',
        onSuccess: function() {
            if (typeof renderSessionPrepList === 'function') renderSessionPrepList();
            showToast('Session-Prep gelöscht', 'success');
        }
    });
}

// ============================================================
// EDIT — Session-Prep-Formular mit bestehendem Eintrag befüllen
// ============================================================

/**
 * Öffnet das Session-Prep-Modal mit einem bestehenden Eintrag.
 * @param {number|string} id - ID der zu bearbeitenden Session-Prep
 */
function editSessionPrep(id) {
    var daten = window.D;
    if (!daten) return;
    var numId = parseEntityId(id);
    if (numId === null) return;

    var prep = daten.sessionPreps.find(function(p) { return p.id === numId; });
    if (!prep) {
        showToast('Session-Prep nicht gefunden', 'error');
        return;
    }

    if (typeof showSessionPrepModal === 'function') {
        showSessionPrepModal(prep);
    }
}

// ============================================================
// EXPORTS
// ============================================================
window.saveSessionPrep = saveSessionPrep;
window.deleteSessionPrep = deleteSessionPrep;
window.editSessionPrep = editSessionPrep;
window.sammleOffeneFaeden = sammleOffeneFaeden;
