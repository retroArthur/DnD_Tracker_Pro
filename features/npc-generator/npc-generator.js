// [SECTION:NPC_GENERATOR]
// NPC-Generator — Generator-Kernlogik + Modal + Speichern (WELT-02)
// Plan 05-04: vollständige Implementierung
// ============================================================
// Verwendete Globals: NPC_DEFAULT_TABLES (window), D (window),
//   pushUndo, nextId, esc, sanitizeHTML, showToast,
//   showModal, hideModal, renderNPCList (alle global via const/window)
// WICHTIG: kein const X = window.X innerhalb von Funktionen (CLAUDE.md Dedup-Regel)
// WICHTIG: saveNPC und rollWeightedEntry NICHT redefinieren

var D = window.D;
var save = window.save;

// ============================================================
// KERN-LOGIK: generiereNPCName + Hilfs-Zufallsfunktionen
// ============================================================

/**
 * Liefert ein zufälliges Element aus einem Array oder '' wenn leer.
 * Interne Hilfsfunktion — kein window-Export nötig.
 * @param {Array} arr
 * @returns {string}
 */
function _npcgZufallsElement(arr) {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)] || '';
}

/**
 * Generiert einen zufälligen NPC-Namen basierend auf Volk und Geschlecht.
 * Nutzt NPC_DEFAULT_TABLES.namen[volk][geschlecht].
 * Falls kein Pool vorhanden: Fallback 'Unbekannt'.
 * @param {string} volk - z.B. 'mensch', 'elf', 'zwerg'
 * @param {string} geschlecht - 'maennlich' | 'weiblich' | 'neutral'
 * @returns {string}
 */
function generiereNPCName(volk, geschlecht) {
    var tables = window.NPC_DEFAULT_TABLES;
    if (!tables || !tables.namen) return 'Unbekannt';
    var volkObj = tables.namen[volk];
    if (!volkObj) return 'Unbekannt';
    var pool = volkObj[geschlecht] || [];
    // Optionale D-06-Erweiterung: Nutzer-Tabellen einbeziehen
    // (additiv, kein Überschreiben — Hook bleibt crashsicher)
    try {
        var userD = window.D;
        if (userD && Array.isArray(userD.randomTables)) {
            var userKey = 'npc-namen-' + volk + '-' + geschlecht;
            var userTable = userD.randomTables.find(function(t) { return t.name === userKey; });
            if (userTable && Array.isArray(userTable.entries) && userTable.entries.length > 0) {
                pool = pool.concat(userTable.entries.map(function(e) { return e.text || e; }).filter(Boolean));
            }
        }
    } catch (_e) {
        // D.randomTables-Erweiterung ist optional — Fehler ignorieren
    }
    if (pool.length === 0) return 'Unbekannt';
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generiert einen vollständigen NPC-Vorschau-Datensatz.
 * Alle Pflichtfelder (name, zug, marotte) sind immer gesetzt.
 * @param {string} volk
 * @param {string} geschlecht
 * @returns {{ name:string, volk:string, geschlecht:string, zug:string, marotte:string, beruf:string, aussehen:string }}
 */
function generiereNPC(volk, geschlecht) {
    var tables = window.NPC_DEFAULT_TABLES;
    var safeVolk = volk || 'mensch';
    var safeGeschlecht = geschlecht || 'maennlich';

    var name = generiereNPCName(safeVolk, safeGeschlecht);
    var zug = '';
    var marotte = '';
    var beruf = '';
    var aussehen = '';

    if (tables) {
        zug      = _npcgZufallsElement(tables.persoenlichkeitszuege);
        marotte  = _npcgZufallsElement(tables.marotten);
        beruf    = _npcgZufallsElement(tables.berufe);
        aussehen = _npcgZufallsElement(tables.aussehen);
    }

    return {
        name:       name,
        volk:       safeVolk,
        geschlecht: safeGeschlecht,
        zug:        zug || 'Ruhig und beobachtend',
        marotte:    marotte || 'Trommelt mit den Fingern',
        beruf:      beruf,
        aussehen:   aussehen
    };
}

// ============================================================
// MODAL-STATE: aktuell generierter NPC (nur Vorschau, kein D.npcs-Schreibzugriff)
// ============================================================
var _npcgAktuell = null; // Vorschau-State (KEIN Eintrag in D.npcs)

// ============================================================
// MODAL: showNPCGeneratorModal
// ============================================================

/**
 * Baut das HTML der NPC-Generator-Vorschau-Karte.
 * @param {{ name, volk, geschlecht, zug, marotte, beruf, aussehen }} npcData
 * @returns {string} HTML
 */
function _npcgRenderVorschau(npcData) {
    if (!npcData) return '<p class="npcg-empty">Noch kein NPC generiert.</p>';
    var e = (typeof esc === 'function') ? esc : function(s) { return String(s || ''); };
    return [
        '<div class="npcg-preview-card">',
        '  <div class="npcg-preview-name">' + e(npcData.name) + '</div>',
        '  <div class="npcg-preview-meta">',
        '    <span class="npcg-meta-tag npcg-volk">' + e(npcData.volk) + '</span>',
        '    <span class="npcg-meta-tag npcg-geschlecht">' + e(npcData.geschlecht) + '</span>',
        npcData.beruf ? '    <span class="npcg-meta-tag npcg-beruf">' + e(npcData.beruf) + '</span>' : '',
        '  </div>',
        '  <div class="npcg-preview-section">',
        '    <span class="npcg-label">Persönlichkeit:</span>',
        '    <span class="npcg-zug">' + e(npcData.zug) + '</span>',
        '  </div>',
        '  <div class="npcg-preview-section">',
        '    <span class="npcg-label">Marotte:</span>',
        '    <span class="npcg-marotte">' + e(npcData.marotte) + '</span>',
        '  </div>',
        npcData.aussehen ? [
            '  <div class="npcg-preview-section npcg-secondary">',
            '    <span class="npcg-label">Aussehen:</span>',
            '    <span class="npcg-aussehen">' + e(npcData.aussehen) + '</span>',
            '  </div>'
        ].join('') : '',
        '</div>'
    ].join('\n');
}

/**
 * Öffnet das NPC-Generator-Modal mit Vor-Filter + Vorschau + Re-Roll + Speichern.
 * Generiert sofort einen ersten NPC.
 */
function showNPCGeneratorModal() {
    var volk = 'mensch';
    var geschlecht = 'maennlich';
    _npcgAktuell = generiereNPC(volk, geschlecht);

    var volkOptionen = [
        ['mensch', 'Mensch'],
        ['elf', 'Elf'],
        ['zwerg', 'Zwerg'],
        ['halbling', 'Halbling'],
        ['halbork', 'Halbork'],
        ['tiefling', 'Tiefling'],
        ['gnom', 'Gnom']
    ].map(function(pair) {
        return '<option value="' + pair[0] + '"' + (pair[0] === volk ? ' selected' : '') + '>' + pair[1] + '</option>';
    }).join('');

    var geschlechtOptionen = [
        ['maennlich', 'Männlich'],
        ['weiblich', 'Weiblich'],
        ['neutral', 'Neutral']
    ].map(function(pair) {
        return '<option value="' + pair[0] + '"' + (pair[0] === geschlecht ? ' selected' : '') + '>' + pair[1] + '</option>';
    }).join('');

    var modalHTML = [
        '<div id="npc-generator-modal" class="modal-overlay">',
        '  <div class="modal npcg-modal-content">',
        '    <div class="modal-header">',
        '      <h3>🎲 NPC-Generator</h3>',
        '      <button class="modal-close" data-action="close-modal-overlay">×</button>',
        '    </div>',
        '    <div class="modal-body">',
        '      <div class="npcg-filter-row">',
        '        <div class="npcg-filter-group">',
        '          <label class="npcg-filter-label">Volk</label>',
        '          <select id="npcg-volk-select" class="form-control npcg-select">',
        volkOptionen,
        '          </select>',
        '        </div>',
        '        <div class="npcg-filter-group">',
        '          <label class="npcg-filter-label">Geschlecht</label>',
        '          <select id="npcg-geschlecht-select" class="form-control npcg-select">',
        geschlechtOptionen,
        '          </select>',
        '        </div>',
        '        <button class="btn btn-secondary npcg-reroll-btn" data-action="reroll-npc">',
        '          🔄 Neu würfeln',
        '        </button>',
        '      </div>',
        '      <div id="npcg-vorschau-container" class="npcg-vorschau-container">',
        _npcgRenderVorschau(_npcgAktuell),
        '      </div>',
        '    </div>',
        '    <div class="modal-footer npcg-modal-footer">',
        '      <button class="btn btn-secondary" data-action="close-modal-overlay">Abbrechen</button>',
        '      <button class="btn btn-primary npcg-save-btn" data-action="save-generated-npc">Als NPC speichern</button>',
        '    </div>',
        '  </div>',
        '</div>'
    ].join('\n');

    // Altes Modal entfernen (falls vorhanden)
    var existing = document.getElementById('npc-generator-modal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Modal via showModal anzeigen (setzt .show → position:fixed, backdrop, opacity:1)
    if (typeof window.showModal === 'function') window.showModal('npc-generator-modal');

    // Modal overlay schließen bei Klick außerhalb (Backdrop-Klick)
    var modal = document.getElementById('npc-generator-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
                _npcgAktuell = null;
            }
        });
    }
}

/**
 * Re-Roll: Generiert neuen NPC basierend auf aktuellen Filter-Selects.
 * Schreibt NICHT in D.npcs (kein Auto-Speichern).
 */
function rerollNPC() {
    var volkSel = document.getElementById('npcg-volk-select');
    var geschlechtSel = document.getElementById('npcg-geschlecht-select');
    var volk = (volkSel && volkSel.value) || 'mensch';
    var geschlecht = (geschlechtSel && geschlechtSel.value) || 'maennlich';

    // Neuen NPC generieren — NUR Vorschau-State, kein D.npcs-Schreibzugriff
    _npcgAktuell = generiereNPC(volk, geschlecht);

    var container = document.getElementById('npcg-vorschau-container');
    if (container) {
        container.innerHTML = _npcgRenderVorschau(_npcgAktuell);
    }
}

/**
 * Speichert den aktuell angezeigten NPC als D.npcs-Eintrag.
 * Ruft pushUndo() vor D.npcs.push() auf; nutzt nextId('npcs').
 * Ruft NICHT saveNPC() auf (kein Formular-Füllzyklus).
 * @param {string} [description] - optionale Überschreibung der Beschreibung
 */
function saveGeneratedNPC() {
    if (!_npcgAktuell) {
        if (typeof showToast === 'function') showToast('Kein NPC generiert', 'warning');
        return;
    }
    var npc = _npcgAktuell;
    // T-05-13: Beschreibung via sanitizeHTML sichern
    var san = (typeof sanitizeHTML === 'function') ? sanitizeHTML : function(s) { return String(s || ''); };
    var beschreibung = san(
        [npc.zug, npc.marotte, npc.aussehen ? ('Aussehen: ' + npc.aussehen) : ''].filter(Boolean).join(' — ')
    );

    // Undo ZUERST (CLAUDE.md: saveUndoState vor jeder Mutation)
    if (typeof pushUndo === 'function') pushUndo('NPC generiert');

    var d = window.D;
    var id = (typeof nextId === 'function') ? nextId('npcs') : (Date.now());
    d.npcs.push({
        id: id,
        name: npc.name,
        role: npc.beruf || '',
        race: npc.volk || '',
        description: beschreibung,
        locationId: null,
        chapter: '',
        filterId: null,
        quests: [],
        info: [],
        relationships: [],
        triggers: [],
        dialogs: [],
        relations: []
    });

    if (typeof save === 'function') save();

    // NPC-Liste neu rendern
    if (typeof renderNPCList === 'function') renderNPCList();

    // Modal schließen
    var modal = document.getElementById('npc-generator-modal');
    if (modal) modal.remove();
    _npcgAktuell = null;

    if (typeof showToast === 'function') {
        showToast(npc.name + ' als NPC gespeichert', 'success');
    }
}

// ============================================================
// WINDOW-EXPORTE
// ============================================================
window.generiereNPCName = generiereNPCName;
window.generiereNPC = generiereNPC;
window.showNPCGeneratorModal = showNPCGeneratorModal;
window.rerollNPC = rerollNPC;
window.saveGeneratedNPC = saveGeneratedNPC;
