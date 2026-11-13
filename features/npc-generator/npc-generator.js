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
 * Name aus einem Eintrag einer Namenstabelle (Vertrag NPC-NAME, N3) oder ''.
 * Uebernommen wird nur Text: der `text` eines Eintrags `{weight, text}` oder
 * ein Eintrag, der selbst Text ist; eine Zahl wird verlustfrei Text
 * (7 -> '7'). Alles andere ergibt '' und faellt aus dem Pool: ein Eintrag
 * ohne `text`, ein leerer oder nur aus Leerzeichen bestehender Text, `null`,
 * ein Objekt oder ein Wahrheitswert als `text` — ein Tabelleneintrag ist ein
 * Namensvorschlag, und ihn zu ueberspringen verliert nichts (anders als an
 * der Datengrenze, die einen GESPEICHERTEN Namen `true` als 'true' erhaelt).
 * Vorher (`e.text || e`) wurde eine Zahl unveraendert Name und ein Eintrag
 * ohne Text (auch `{text: 0}`) das ganze Objekt — `name: 7` bzw.
 * `name: {weight: 1}` in D, und die NPC-Liste brach (herkunft B5/B6). Ein
 * `null`-Eintrag warf, und der catch in generiereNPCName() verwarf die ganze
 * Tabelle samt ihren gueltigen Namen.
 * Interne Hilfsfunktion — kein window-Export nötig.
 * @param {*} eintrag
 * @returns {string}
 */
function _npcgTabellenName(eintrag) {
    var wert = (eintrag !== null && typeof eintrag === 'object') ? eintrag.text : eintrag;
    if (typeof wert === 'number') wert = String(wert);
    if (typeof wert !== 'string' || wert.trim() === '') return '';
    return wert;
}

/**
 * Generiert einen zufälligen NPC-Namen basierend auf Volk und Geschlecht.
 * Nutzt NPC_DEFAULT_TABLES.namen[volk][geschlecht], dazu die Texte einer
 * Nutzertabelle 'npc-namen-<volk>-<geschlecht>' (_npcgTabellenName).
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
                pool = pool.concat(userTable.entries.map(_npcgTabellenName).filter(Boolean));
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

// Die Voelker des Generators: Schluessel seiner Namenstabellen -> Anzeigename.
// Der Anzeigename ist zugleich der Wert der festen Option im NPC-Formular
// (#npc-race); gespeichert wird DER (saveGeneratedNPC). Vorher stand der
// Schluessel ('zwerg') im NPC, fuer den das Formular keine Option hat — ✏️ → 💾
// loeschte danach das Volk.
var NPCG_VOELKER = [
    ['mensch', 'Mensch'],
    ['elf', 'Elf'],
    ['drow', 'Drow'],
    ['zwerg', 'Zwerg'],
    ['halbling', 'Halbling'],
    ['gnom', 'Gnom'],
    ['halbelf', 'Halbelf'],
    ['halbork', 'Halbork'],
    ['tiefling', 'Tiefling'],
    ['drachenbluetiger', 'Drachenblütiger'],
    ['goblin', 'Goblin'],
    ['kobold', 'Kobold'],
    ['ork', 'Ork'],
    ['tabaxi', 'Tabaxi'],
    ['kenku', 'Kenku'],
    ['goliath', 'Goliath'],
    ['aasimar', 'Aasimar']
];

const NPCG_GESCHLECHTER = {
    maennlich: 'Männlich',
    weiblich: 'Weiblich',
    neutral: 'Neutral'
};

/**
 * Anzeigename eines Generator-Volks ('zwerg' -> 'Zwerg'). Ein unbekannter
 * Schluessel bleibt, wie er ist.
 * @param {string} volk
 * @returns {string}
 */
function _npcgVolkName(volk) {
    var paar = NPCG_VOELKER.find(function (p) {
        return p[0] === volk;
    });
    return paar ? paar[1] : volk || '';
}

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
    // SENKEN R1: esc() direkt — der fruehere Rueckfall ohne esc kodierte nichts.
    return [
        '<div class="npcg-preview-card">',
        '  <div class="npcg-preview-name">' + esc(npcData.name) + '</div>',
        '  <div class="npcg-preview-meta">',
        '    <span class="npcg-meta-tag npcg-volk">' + esc(_npcgVolkName(npcData.volk)) + '</span>',
        '    <span class="npcg-meta-tag npcg-geschlecht">' + esc(NPCG_GESCHLECHTER[npcData.geschlecht]) + '</span>',
        npcData.beruf ? '    <span class="npcg-meta-tag npcg-beruf">' + esc(npcData.beruf) + '</span>' : '',
        '  </div>',
        '  <div class="npcg-preview-section">',
        '    <span class="npcg-label">Persönlichkeit:</span>',
        '    <span class="npcg-zug">' + esc(npcData.zug) + '</span>',
        '  </div>',
        '  <div class="npcg-preview-section">',
        '    <span class="npcg-label">Marotte:</span>',
        '    <span class="npcg-marotte">' + esc(npcData.marotte) + '</span>',
        '  </div>',
        npcData.aussehen ? [
            '  <div class="npcg-preview-section npcg-secondary">',
            '    <span class="npcg-label">Aussehen:</span>',
            '    <span class="npcg-aussehen">' + esc(npcData.aussehen) + '</span>',
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

    var volkOptionen = NPCG_VOELKER.map(function(pair) {
        return '<option value="' + pair[0] + '"' + (pair[0] === volk ? ' selected' : '') + '>' + pair[1] + '</option>';
    }).join('');

    var geschlechtOptionen = Object.entries(NPCG_GESCHLECHTER).map(function(pair) {
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
        race: _npcgVolkName(npc.volk),
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

    // GENERATOR-DOPPELT: Ab dem push endet JEDER Ausgang mit verbrauchter
    // Vorschau und geschlossenem Fenster — auch wenn save() wirft. Das
    // Verbrauchen IST die Sperre gegen den zweiten Klick (wie in
    // createCampaign das Leeren der Eingabe vor dem Zeichnen), kein Zeitflag:
    // ein weiterer Klick auf dieselbe Vorschau gelangt nicht mehr bis hierher.
    try {
        if (typeof save === 'function') save();
    } finally {
        _npcgAktuell = null;
        var modal = document.getElementById('npc-generator-modal');
        if (modal) modal.remove();
    }

    if (typeof showToast === 'function') {
        showToast(npc.name + ' als NPC gespeichert', 'success');
    }

    // NPC-Liste neu rendern — ZULETZT und hier abgefangen (GENERATOR-DOPPELT):
    // der NPC ist gespeichert und bleibt es, ein Wurf rollt nichts zurueck.
    // Der Nutzer sieht ihn als Fehlermeldung, das Fehlerlog bekommt den Wurf.
    // Nicht in renderNPCList fangen: der Reiterwechsel braucht den Wurf
    // (ruecksprung-rundlauf.spec.js (12)). Nicht ueber safeRender: das wirft
    // im dev-Buendel (DEBUG_MODE) erneut, dev und prod liefen auseinander.
    try {
        if (typeof renderNPCList === 'function') renderNPCList();
    } catch (fehler) {
        if (window.ErrorHandler) {
            window.ErrorHandler.log('saveGeneratedNPC', fehler, 'renderNPCList nach dem Speichern');
        }
        if (typeof showToast === 'function') {
            showToast(
                '⚠️ NPC gespeichert – die NPC-Liste konnte nicht aktualisiert werden',
                'error'
            );
        }
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
