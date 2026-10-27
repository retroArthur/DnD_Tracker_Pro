// [SECTION:NAVIGATION]
// Extrahiert aus spellslots.js
// Navigation
// Zeilen: 66
// NAVIGATION
// ============================================================
function switchView(name) {
    // Nav-Gruppen-Dropdowns immer schließen (auch bei Action-Items wie Debug/Theme)
    document.querySelectorAll('.nav-group.open').forEach(g => {
        g.classList.remove('open');
        const b = g.querySelector('.nav-group-btn');
        if (b) b.setAttribute('aria-expanded', 'false');
    });

    // Kein gültiger View-Name (z.B. Action-Buttons ohne data-view) → nur Dropdowns schließen
    if (!name) return;

    // Cleanup: transientes NPC-Generator-Modal beim View-Wechsel entfernen
    const _npcgModal = document.getElementById('npc-generator-modal');
    if (_npcgModal) _npcgModal.remove();

    // Cleanup: JEDE per JS eingehaengte Modal-Schale beim View-Wechsel
    // entfernen (U4). Die Einzelabfrage darueber bleibt, weil der
    // NPC-Generator die Markierung `modal-transient` nicht traegt — sie ihm
    // nachzutragen waere eine Aenderung an einem Modul, das nicht zu dieser
    // Korrektur gehoert. Beides raeumt denselben Zustand auf.
    document.querySelectorAll('.modal-overlay.modal-transient').forEach(m => m.remove());

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.nav-group-btn.has-active').forEach(b => b.classList.remove('has-active'));
    $('view-' + name)?.classList.add('active');
    const activeTab = document.querySelector(`[data-view="${name}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
        // Eltern-Gruppe hervorheben (gruppierte Nav)
        const parentGroup = activeTab.closest('.nav-group');
        if (parentGroup) {
            const gb = parentGroup.querySelector('.nav-group-btn');
            if (gb) gb.classList.add('has-active');
        }
    }
    // LEGACY SUPPORT: Keep existing special cases for backwards compatibility
    // Das Datum wird nur VORGESCHLAGEN, wenn das Notizformular keins hat und
    // keine Notiz bearbeitet (ABBRUCH, Vertrag R6). Vorher setzte jeder
    // Wechsel auf "Notizen" heute ein — gemessen auch bei offenem ✏️: S1 vom
    // 2026-01-10 wurde nach Wiki → Notizen → 💾 mit dem heutigen Datum
    // gespeichert. Ein getipptes Entwurfsdatum bleibt aus demselben Grund.
    if (name === 'notes') {
        const sessionDate = $('session-date');
        if (sessionDate && !sessionDate.value && !$('edit-session-id')?.value) {
            sessionDate.value = new Date().toISOString().split('T')[0];
        }
    }
    // NEW: Use tab registry to render content
    const renderTabContent = window.renderTabContent;
    if (renderTabContent) renderTabContent(name);
    // Mobile: Navigation schließen und Label aktualisieren
    const header = document.querySelector('.app-header');
    if (header) header.classList.remove('nav-open');
    // View-Name in Toggle-Bar aktualisieren
    const toggleText = document.querySelector('.mobile-nav-toggle-text');
    if (toggleText) {
        const viewNames = {
            dashboard: '🏠 Start',
            party: '👥 Party',
            npcs: '🎭 NPCs',
            locations: '🏠 Orte',
            quests: '📜 Quests',
            encounter: '👹 Encounter',
            initiative: '⚔️ Initiative',
            loot: '📦 Truhe',
            shops: '🏪 Shops',
            spells: '✨ Zauber',
            notes: '📝 Notizen',
            wiki: '📚 Wiki',
            links: '🔗 Links',
            dice: '🎲 Würfel',
            timers: '⏱️ Timer',
            data: '💾 Daten',
            dmscreen: '🎮 DM Screen',
            soundboard: '🔊 Soundboard',
            dicestats: '📊 Statistiken'
        };
        toggleText.textContent = viewNames[name] || '📍 Navigation';
    }
}
// Die ModalFocus-Aufrufe in showModal/hideModal stehen DIREKT in der
// Deklaration und nicht in einem `window.showModal`-Mantel (O-4). Grund,
// nachgezaehlt: von den 60 showModal- und 63 hideModal-Aufrufstellen im
// Quellbaum rufen 52 bzw. 58 BLANK und binden damit LEXIKALISCH an diese
// Deklarationen — unter ihnen `ui/actions/ui-actions.js:8`, der Weg jedes
// Klicks auf `data-action="show-modal"`. Ein Mantel an `window` wuerde von
// diesen umgangen und feuerte bei normaler Arbeit nie; genau die Falle, die
// CLAUDE.md fuer `save()` dokumentiert. Begruendung und Messwerte stehen in
// `ui/modal-focus.js`.
function showModal(id) {
    const modal = $(id);
    // VOR dem Sichtbarmachen: danach kann der Fokus schon verschoben sein.
    if (modal && window.ModalFocus) window.ModalFocus.merkeOeffner(modal);
    if (modal) modal.classList.add('show');
    const populateSelects = window.populateSelects;
    if (populateSelects) populateSelects();
    if (id === 'timer-preset-modal') {
        const renderPresetList = window.renderPresetList;
        if (renderPresetList) renderPresetList();
    }
    if (id === 'quest-modal') {
        const populateQuestSelects = window.populateQuestSelects;
        if (populateQuestSelects) populateQuestSelects();
    }
    // NACH dem Befuellen: die populate-Aufrufe oben bauen Felder nach, und
    // der Einstieg soll den ersten davon greifen, nicht einen Halt, der
    // gleich wieder ersetzt wird.
    if (modal && window.ModalFocus) window.ModalFocus.einstieg(modal);
}
function hideModal(id) {
    const modal = $(id);
    if (modal) modal.classList.remove('show');
    if (modal && window.ModalFocus) window.ModalFocus.kehreZurueck(modal);
}
// Klappformulare, in denen ✏️ einen Eintrag zum Bearbeiten laedt (ABBRUCH,
// Vertrag R1). Gemessen war JEDER Anlege-Weg dieser Formulare derselbe reine
// Umschalter toggleCollapse(): nach ✏️ → Kopfzeile zu → wieder auf trug das
// Formular die Bearbeiten-ID samt allen Werten, und "Neu" → 💾 UEBERSCHRIEB
// den bearbeiteten Eintrag (Charakter und Encounter, in D, im Speicher und
// nach dem Neuladen; beim Encounter ohne Meldung und ohne Undo). Zuklappen
// eines Bearbeitens ist darum ein Abbruch: beim naechsten AUFklappen wird
// der Rest verworfen. Ein Anlege-Entwurf (keine ID) bleibt stehen (R2).
//
// `leeren` ist eine AUFGESCHOBENE Referenz wie in TAB_RENDER_REGISTRY
// (MAINT-02): der Bezeichner steht im Quelltext (Grep, ESLint, und
// tests/unit/navigation-collapse.test.js prueft, dass es ihn gibt), aufgeloest
// wird erst beim Klick — dieses Modul laeuft im Lader VOR den Feature-Modulen.
// Ein neues Klappformular mit Bearbeiten-ID gehoert hier mit hinein.
const KLAPPFORMULAR_BEARBEITEN = {
    'char-form': { bearbeitenId: 'edit-char-id', leeren: () => cancelCharEdit },
    'enc-form': { bearbeitenId: 'edit-enc-id', leeren: () => cancelEncEdit },
    // Die Notiz hat nur DIESEN Anlege-Weg (Kopf "+ Neue Session-Notiz"; keine
    // Taste n, keine Palette). Gemessen ueberschrieb ✏️ S1 → Kopf zu → auf → 💾
    // die Notiz S1 und mischte deren Zusammenfassung und Tags in die Eingabe.
    'session-form': { bearbeitenId: 'edit-session-id', leeren: () => cancelSessionEdit }
};
/**
 * Verwirft den Bearbeiten-Rest eines Klappformulars (ID gesetzt → dessen
 * Leeren-Funktion). Nur fuer toggleCollapse() beim Aufklappen.
 * @param {string} id
 */
function verwirfBearbeitenRest(id) {
    const eintrag = KLAPPFORMULAR_BEARBEITEN[id];
    if (!eintrag || !$(eintrag.bearbeitenId)?.value) return;
    let leeren = null;
    try {
        leeren = eintrag.leeren();
    } catch {
        // Modul nicht geladen (Einzeltest) — dann gibt es nichts zu leeren.
    }
    if (typeof leeren === 'function') leeren();
}
function toggleCollapse(id) {
    const el = $(id);
    const icon = $(id + '-icon');
    if (el) {
        // Die Richtung VOR dem Leeren festhalten: cancelCharEdit(),
        // cancelEncEdit() und cancelSessionEdit() klappen selbst zu. Am Ende
        // steht das Formular offen und leer, nicht wieder zu.
        const aufklappen = !el.classList.contains('open');
        if (aufklappen) verwirfBearbeitenRest(id);
        el.classList.toggle('open', aufklappen);
        if (icon) icon.textContent = el.classList.contains('open') ? '▲' : '▼';
        // Story-Arc Dropdown aktualisieren wenn Session-Formular geöffnet wird
        // (haelt die Auswahl eines Entwurfs, siehe renderStoryArcSelects())
        if (
            id === 'session-form' &&
            el.classList.contains('open') &&
            typeof window.renderStoryArcSelects === 'function'
        ) {
            window.renderStoryArcSelects();
        }
    }
}
/**
 * Klappt ein Formular zum Anlegen auf — der Weg der Taste n und der
 * Befehlspalette ("Neuer Charakter", "Neuer Encounter"). Vorher riefen beide
 * toggleCollapse() und klappten ein OFFENES Formular zu, mitten in der
 * Eingabe (gemessen an ✏️ wie am Entwurf). Ist es offen, tun sie jetzt
 * nichts (Vertrag R3, wie showNewNPCModal()); ist es zu, klappt
 * toggleCollapse() es auf und verwirft dabei einen Bearbeiten-Rest.
 * Die Kopfzeile bleibt ein Umschalter.
 * @param {string} id
 */
function showNewCollapsibleForm(id) {
    const el = $(id);
    if (!el || el.classList.contains('open')) return;
    toggleCollapse(id);
}
// #quicknotes-modal geht NICHT durch showModal/hideModal — es traegt
// `.modal-backdrop` und schaltet `style.display` selbst. Darum bekommt es
// dieselben drei Haken einzeln; sonst waere es die eine Schale ohne
// Fokusfuehrung (und war gemessen auch die eine, die auf Escape offen blieb).
function showQuickNotesModal() {
    const D = window.D;
    const quickNotes = $('quick-notes');
    if (quickNotes) quickNotes.value = D.quickNotes || '';
    const modal = $('quicknotes-modal');
    if (modal) {
        if (window.ModalFocus) window.ModalFocus.merkeOeffner(modal);
        modal.style.display = 'flex';
        modal.classList.add('show');
        if (window.ModalFocus) window.ModalFocus.einstieg(modal);
    }
}
function hideQuickNotesModal() {
    const modal = $('quicknotes-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        if (window.ModalFocus) window.ModalFocus.kehreZurueck(modal);
    }
}
function saveQuickNotes() {
    const D = window.D;
    const quickNotes = $('quick-notes');
    if (quickNotes) D.quickNotes = quickNotes.value;
    const save = window.save;
    if (save) save();
    showToast('📝 Notizen gespeichert');
}
// Baut die Auswahllisten von NPC- und Ort-Formular neu und HAELT dabei die
// Auswahl (MARKDOWN, docs/bugfixes.md). showModal() ruft das fuer JEDES Modal —
// auch fuer eines, das UEBER dem offenen Formular aufgeht. Vorher stand danach
// alles auf '': die Markdown-Import-Schale ueber dem NPC-Formular leerte Ort
// und Filter, und ✏️ an einem Ort verlor seinen Filter schon beim Oeffnen;
// "Speichern" schrieb beide Male null. Leere Werte beim Bearbeiten setzen
// editNPC()/editLocation() deshalb selbst.
function populateSelects() {
    const D = window.D;
    const esc = window.esc;
    const neuBefuellen = (select, optionen) => {
        const vorher = select.value;
        select.innerHTML = optionen;
        if (vorher && Array.from(select.options).some(o => o.value === vorher)) {
            select.value = vorher;
        }
    };
    // Location select for NPCs
    const locSel = $('npc-location');
    if (locSel) {
        neuBefuellen(
            locSel,
            '<option value="">-- Ort --</option>' +
                (D.locations || [])
                    .map(l => `<option value="${l.id}">${esc(l.name)}</option>`)
                    .join('')
        );
    }
    // Filter selects
    const filterOpts =
        '<option value="">-- Kein Filter --</option>' +
        (D.filters || []).map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('');
    ['loc-filter', 'npc-filter'].forEach(id => {
        const select = $(id);
        if (select) neuBefuellen(select, filterOpts);
    });
}
