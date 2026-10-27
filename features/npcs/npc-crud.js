// [SECTION:NPC_CRUD]
// ============================================================
// NPC CRUD - @create @edit @delete @save
// ============================================================
// Schnappschuss je Trigger-/Dialogfeld: Feld-Element -> tiefe Kopie des
// Eintrags, aus dem editNPC() das Feld gebaut hat. Das Formular zeigt
// `used`, `triggered` und unbekannte Altfelder nicht; saveNPC() nimmt sie von
// HIER. Nicht aus dem Live-D: Strg+Z wirkt auch mit dem Fokus im offenen
// Formular und aendert D darunter — gemessen schrieb ein Index gegen D dann
// einem nie verwendeten Dialog `used: true` zu. Nicht nach Position: ein
// entfernter Eintrag schob den Zustand auf den Nachbarn. Felder ohne Eintrag
// (neu per "+ Dialog hinzufuegen") beginnen unverwendet.
const npcFeldUrsprung = new WeakMap();
/**
 * Saves an NPC (create or update)
 */
function saveNPC() {
    const D = window.D;
    const validateAndShowErrors = window.validateAndShowErrors;
    const renderLocations = window.renderLocations;
    const renderNPCList = window.renderNPCList;
    const idInput = $('edit-npc-id');
    let id = idInput.value;
    // Zeigt die ID auf einen NPC, den es nicht mehr gibt (geloescht, oder per
    // Strg+Z zurueckgenommen, waehrend das Formular offen war), wird als NEUER
    // NPC gespeichert — die Eingaben bleiben erhalten. Vorher fand der
    // Bearbeiten-Zweig nichts, speicherte nichts und meldete trotzdem
    // "NPC aktualisiert", mit einem leeren Undo-Eintrag. Geprueft VOR pushUndo.
    const idx = id ? D.npcs.findIndex(n => n.id === parseEntityId(id)) : -1;
    const verwaist = Boolean(id) && idx === -1;
    if (verwaist) id = '';
    // Collect triggers
    const triggers = [];
    const triggersContainer = $('npc-triggers-container');
    if (triggersContainer) {
        triggersContainer.querySelectorAll('.npc-trigger-field').forEach(div => {
            const condEl = div.querySelector('.trigger-cond');
            const revEl = div.querySelector('.trigger-reveal');
            const cond = condEl?.value?.trim() || '';
            const rev = revEl?.value?.trim() || '';
            if (!cond || !rev) return;
            const ursprung = npcFeldUrsprung.get(div) || {};
            triggers.push({
                ...ursprung,
                condition: cond,
                reveal: rev,
                triggered: ursprung.triggered === true
            });
        });
    }
    // Collect dialogs
    const dialogs = [];
    const dialogsContainer = $('npc-dialogs-container');
    if (dialogsContainer) {
        dialogsContainer.querySelectorAll('.npc-dialog-field').forEach(div => {
            const titleEl = div.querySelector('.dialog-title');
            const triggerEl = div.querySelector('.dialog-trigger');
            const textEl = div.querySelector('.dialog-text');
            const title = titleEl?.value?.trim() || '';
            const trigger = triggerEl?.value?.trim() || '';
            const text = textEl ? sanitizeHTML(textEl.innerHTML) : '';
            if (!text) return;
            const ursprung = npcFeldUrsprung.get(div) || {};
            dialogs.push({
                ...ursprung,
                title,
                triggerCondition: trigger,
                text,
                used: ursprung.used === true
            });
        });
    }
    const npc = {
        name: $('npc-name').value.trim(),
        role: $('npc-role').value.trim(),
        race: $('npc-race').value,
        locationId: parseInt($('npc-location').value) || null,
        chapter: $('npc-chapter').value.trim(),
        filterId: parseInt($('npc-filter').value) || null,
        quests: $('npc-quests')
            .value.split(',')
            .map(s => s.trim())
            .filter(Boolean),
        info: $('npc-info')
            .value.split(',')
            .map(s => s.trim())
            .filter(Boolean),
        relationships: $('npc-relations')
            .value.split(',')
            .map(s => s.trim())
            .filter(Boolean),
        description: sanitizeHTML($('npc-desc').innerHTML),
        triggers,
        dialogs,
        factionId: parseInt($('npc-faction') && $('npc-faction').value) || null
    };
    // Validate entity references and required fields
    if (!validateAndShowErrors(npc, 'npc')) return;
    pushUndo(id ? 'NPC bearbeitet' : 'NPC erstellt');
    if (id) {
        // Felder ohne Formularfeld (avatar, tags, links, relations, ...)
        // bleiben ueber den Spread stehen; dialogs und triggers kommen ganz
        // aus dem Formular — "alle Dialoge entfernen" entfernt sie also.
        D.npcs[idx] = { ...D.npcs[idx], ...npc };
    } else {
        npc.id = nextId('npcs');
        D.npcs.push(npc);
    }
    hideModal('npc-modal');
    clearNPCForm();
    renderLocations();
    renderNPCList();
    save();
    if (verwaist) {
        showToast(
            'Der bearbeitete NPC existiert nicht mehr — als neuer NPC gespeichert',
            'warning'
        );
    } else {
        showToast(id ? 'NPC aktualisiert' : 'NPC hinzugefügt');
    }
}
/**
 * Fraktion-Select befuellen (WELT-05: npc.factionId) — beim Anlegen UND beim
 * Bearbeiten. Vorher nur in editNPC(): ein frisches "+ NPC" bot allein
 * "— Keine Fraktion —" an.
 */
function fillNPCFactionSelect() {
    const factionSelect = $('npc-faction');
    if (!factionSelect) return;
    factionSelect.innerHTML = '<option value="">— Keine Fraktion —</option>';
    (window.D?.factions || []).forEach(f => {
        const opt = document.createElement('option');
        opt.value = String(f.id);
        opt.textContent = (f.symbol ? f.symbol + ' ' : '') + (f.name || 'Unbekannt');
        factionSelect.appendChild(opt);
    });
}
/**
 * Setzt das Volk im Formular. Ein Wert ohne exakt passende Option wird ohne
 * Ruecksicht auf Gross-/Kleinschreibung auf die feste Option abgebildet
 * ('mensch' -> 'Mensch', so schrieb der NPC-Generator frueher); passt auch so
 * keine (Import, z. B. 'Zentaur'), traegt eine markierte Zusatzoption den
 * Wert, die clearNPCForm() wieder entfernt. Vorher lief `select.value = x`
 * still ins Leere, und Speichern loeschte das Volk. Gelesen wird ohne
 * umgebende Leerzeichen: ' Mensch ' (Import) bekam sonst eine ZWEITE, gleich
 * aussehende Option neben 'Mensch'.
 */
function setNPCRaceValue(race) {
    const sel = $('npc-race');
    if (!sel) return;
    sel.querySelectorAll('option[data-npc-fremd]').forEach(o => o.remove());
    const wert = String(race || '').trim();
    const optionen = Array.from(sel.options);
    const passend =
        optionen.find(o => o.value === wert) ||
        optionen.find(o => o.value.toLowerCase() === wert.toLowerCase());
    if (passend) {
        sel.value = passend.value;
        return;
    }
    const fremd = document.createElement('option');
    fremd.value = wert;
    fremd.textContent = wert;
    fremd.dataset.npcFremd = '';
    sel.appendChild(fremd);
    sel.value = wert;
}
/**
 * Oeffnet das NPC-Formular zum Anlegen — der Weg aller vier Anlegen-Knoepfe
 * ("+ NPC", leere Liste, Taste n, Befehlspalette). Vorher oeffneten sie per
 * showModal('npc-modal') das Formular mit dem, was ein abgebrochenes
 * Bearbeiten darin liess, samt #edit-npc-id: das naechste "Anlegen"
 * ueberschrieb den zuletzt bearbeiteten NPC. Geleert wird NUR bei solchen
 * Resten; ein echter Anlegen-Entwurf ueberlebt ein versehentliches Escape
 * weiter, und mit ihm seine gewaehlte Fraktion.
 *
 * Ist das Formular OFFEN, ist #edit-npc-id kein Rest, sondern die laufende
 * Bearbeitung — dann tut der Weg nichts. Gemessen ohne diese Schranke: ✕ an
 * einem Dialog oder ein Klick auf eine Ueberschrift laesst den Fokus auf
 * BODY, die Taste n erreicht diesen Weg, und die Bearbeitung war ohne
 * Rueckfrage weg; die Befehlspalette ebenso. Vor diesem Weg baute
 * showModal() → populateSelects() Ort und Filter des offenen Formulars neu
 * und setzte beide still auf leer. Wie die Taste h (oeffneHpRechnerAmZug())
 * ueber einem offenen Dialog: still nichts.
 */
function showNewNPCModal() {
    if ($('npc-modal')?.classList.contains('show')) return;
    if ($('edit-npc-id')?.value) clearNPCForm();
    const fSel = $('npc-faction');
    const fraktion = fSel ? fSel.value : '';
    fillNPCFactionSelect();
    if (fSel && Array.from(fSel.options).some(o => o.value === fraktion)) fSel.value = fraktion;
    showModal('npc-modal');
}
/**
 * Opens the edit modal for an NPC
 */
function editNPC(id) {
    const populateSelects = window.populateSelects;
    const addTriggerField = window.addTriggerField;
    const addDialogField = window.addDialogField;
    const resetDialogFieldCounter = window.resetDialogFieldCounter;
    const log = window.log;
    const numId = parseEntityId(id);
    if (numId === null) {
        log('editNPC: Ungueltige ID:', id);
        return;
    }
    const n = EntityLookup.npc(numId);
    if (!n) {
        log('editNPC: NPC nicht gefunden mit ID:', numId);
        showToast('NPC nicht gefunden', 'error');
        return;
    }
    // Zuerst Selects füllen
    populateSelects();
    fillNPCFactionSelect();
    const titel = document.querySelector('#npc-modal .modal-title');
    if (titel) titel.textContent = 'NPC bearbeiten';
    // Dann Werte setzen
    $('edit-npc-id').value = String(numId);
    $('npc-name').value = n.name || '';
    $('npc-role').value = n.role || '';
    setNPCRaceValue(n.race);
    $('npc-chapter').value = n.chapter || '';
    $('npc-quests').value = (n.quests || []).join(', ');
    $('npc-info').value = (n.info || []).join(', ');
    $('npc-relations').value = (n.relationships || []).join(', ');
    $('npc-desc').innerHTML = sanitizeHTML(n.description) || '';
    // Location, Filter und Fraktion nach kleiner Verzögerung setzen (damit Optionen geladen sind)
    // Leere Werte AUSDRUECKLICH setzen: populateSelects() haelt seit MARKDOWN
    // die Auswahl, sonst bliebe die des zuletzt bearbeiteten NPC stehen.
    setTimeout(() => {
        $('npc-location').value = n.locationId ? String(n.locationId) : '';
        $('npc-filter').value = n.filterId ? String(n.filterId) : '';
        // factionId (WELT-05): defensiv — Select existiert nur wenn Fraktionen-Feature geladen
        if (n.factionId) {
            const fSel = $('npc-faction');
            if (fSel) fSel.value = String(n.factionId);
        }
    }, 10);
    // Load triggers
    const triggersContainer = $('npc-triggers-container');
    if (triggersContainer) {
        triggersContainer.innerHTML = '';
        (n.triggers || []).forEach(t => {
            addTriggerField();
            const divs = triggersContainer.querySelectorAll('.npc-trigger-field');
            const last = divs[divs.length - 1];
            if (last) {
                if (t && typeof t === 'object') npcFeldUrsprung.set(last, structuredClone(t));
                const condEl = last.querySelector('.trigger-cond');
                const revEl = last.querySelector('.trigger-reveal');
                if (condEl) condEl.value = t.condition || '';
                if (revEl) revEl.value = t.reveal || '';
            }
        });
    }
    // Load dialogs
    const dialogsContainer = $('npc-dialogs-container');
    if (dialogsContainer) {
        dialogsContainer.innerHTML = '';
        resetDialogFieldCounter();
        (n.dialogs || []).forEach(d => {
            addDialogField();
            const divs = dialogsContainer.querySelectorAll('.npc-dialog-field');
            const last = divs[divs.length - 1];
            if (last) {
                if (d && typeof d === 'object') npcFeldUrsprung.set(last, structuredClone(d));
                const titleEl = last.querySelector('.dialog-title');
                const triggerEl = last.querySelector('.dialog-trigger');
                const textEl = last.querySelector('.dialog-text');
                if (titleEl) titleEl.value = d.title || '';
                if (triggerEl) triggerEl.value = d.triggerCondition || '';
                if (textEl) textEl.innerHTML = sanitizeHTML(d.text) || '';
            }
        });
    }

    // Show markdown export/import buttons when editing
    const markdownActions = $('npc-markdown-actions');
    if (markdownActions) {
        markdownActions.style.display = 'block';
    }

    showModal('npc-modal');
}
/**
 * Deletes an NPC after confirmation
 */
function deleteNPC(id) {
    const renderLocations = window.renderLocations;
    const renderNPCList = window.renderNPCList;
    deleteWithConfirm({
        entityType: 'npcs',
        id: id,
        confirmMessage: null, // Use default message
        undoLabel: 'NPC gelöscht',
        onSuccess: () => {
            renderLocations(); // NPCs can be linked to locations
            renderNPCList();
            showToast('✅ NPC gelöscht', 'success');
        }
    });
}
/**
 * Clears the NPC form
 */
function clearNPCForm() {
    const resetDialogFieldCounter = window.resetDialogFieldCounter;

    clearFormFields({
        textFields: [
            'edit-npc-id',
            'npc-name',
            'npc-role',
            'npc-race',
            'npc-location',
            'npc-chapter',
            'npc-filter',
            'npc-faction',
            'npc-quests',
            'npc-info',
            'npc-relations'
        ],
        contentEditableFields: ['npc-desc'],
        customHandlers: () => {
            // Clear dynamic containers
            const triggersContainer = $('npc-triggers-container');
            if (triggersContainer) triggersContainer.innerHTML = '';

            const dialogsContainer = $('npc-dialogs-container');
            if (dialogsContainer) dialogsContainer.innerHTML = '';

            resetDialogFieldCounter();

            setNPCRaceValue('');
            const titel = document.querySelector('#npc-modal .modal-title');
            if (titel) titel.textContent = 'NPC hinzufügen';

            // Hide markdown export/import buttons for new NPCs
            const markdownActions = $('npc-markdown-actions');
            if (markdownActions) {
                markdownActions.style.display = 'none';
            }
        }
    });
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.saveNPC = saveNPC;
window.editNPC = editNPC;
window.deleteNPC = deleteNPC;
// Verbraucher: features/command-palette/action-registry.js ("Neuer NPC").
window.showNewNPCModal = showNewNPCModal;
