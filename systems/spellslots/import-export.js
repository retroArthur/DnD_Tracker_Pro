// [SECTION:IMPORT_EXPORT]
// Extrahiert aus spellslots.js
// Import/Export System mit Validierung
// Zeilen: 565
// Code-Review 2026-09-08: Vorgabewerte NIE per Referenz herausgeben.
// field.default wurde an drei Stellen direkt zugewiesen; zwei Datensaetze
// ohne dasselbe Feld teilten sich dadurch EIN Array-Objekt, und weil
// IO_SCHEMA nicht eingefroren ist, mutierte eine Aenderung daran das
// Schema selbst.
function ioCloneDefault(wert) {
    if (Array.isArray(wert)) return wert.slice();
    if (wert && typeof wert === 'object') return Object.assign({}, wert);
    return wert;
}
// Schema-Definition: Welche Felder werden für jeden Datentyp exportiert/importiert?
const IO_SCHEMA = {
    characters: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        race: { type: 'string', required: false, default: '' },
        class: { type: 'string', required: false, default: '' },
        level: { type: 'number', required: false, default: 1 },
        playerName: { type: 'string', required: false, default: '' },
        background: { type: 'string', required: false, default: '' },
        hpCurrent: { type: 'number', required: false, default: 0 },
        hpMax: { type: 'number', required: false, default: 0 },
        hpTemp: { type: 'number', required: false, default: 0 },
        ac: { type: 'number', required: false, default: 10 },
        initiative: { type: 'number', required: false, default: 0 },
        speed: { type: 'number', required: false, default: 30 },
        passivePerception: { type: 'number', required: false, default: 10 },
        str: { type: 'number', required: false, default: 10 },
        dex: { type: 'number', required: false, default: 10 },
        con: { type: 'number', required: false, default: 10 },
        int: { type: 'number', required: false, default: 10 },
        wis: { type: 'number', required: false, default: 10 },
        cha: { type: 'number', required: false, default: 10 },
        spells: { type: 'array', required: false, default: [] },
        conditions: { type: 'array', required: false, default: [] },
        tags: { type: 'array', required: false, default: [] },
        notes: { type: 'string', required: false, default: '' },
        avatarUrl: { type: 'string', required: false, default: '' }
    },
    npcs: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        race: { type: 'string', required: false, default: '' },
        location: { type: 'string', required: false, default: '' },
        locationId: { type: 'number', required: false, default: null },
        faction: { type: 'string', required: false, default: '' },
        description: { type: 'string', required: false, default: '' },
        tags: { type: 'array', required: false, default: [] },
        relations: { type: 'array', required: false, default: [] },
        avatarUrl: { type: 'string', required: false, default: '' }
    },
    locations: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        type: { type: 'string', required: false, default: '' },
        region: { type: 'string', required: false, default: '' },
        description: { type: 'string', required: false, default: '' },
        tags: { type: 'array', required: false, default: [] },
        avatarUrl: { type: 'string', required: false, default: '' }
    },
    quests: {
        id: { type: 'number', required: true },
        title: { type: 'string', required: true },
        description: { type: 'string', required: false, default: '' },
        status: { type: 'string', required: false, default: 'active' },
        giver: { type: 'string', required: false, default: '' },
        giverId: { type: 'number', required: false, default: null },
        location: { type: 'string', required: false, default: '' },
        locationId: { type: 'number', required: false, default: null },
        reward: { type: 'string', required: false, default: '' },
        tags: { type: 'array', required: false, default: [] }
    },
    loot: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        type: { type: 'string', required: false, default: '' },
        rarity: { type: 'string', required: false, default: 'common' },
        description: { type: 'string', required: false, default: '' },
        value: { type: 'number', required: false, default: 0 },
        quantity: { type: 'number', required: false, default: 1 },
        assignedTo: { type: 'string', required: false, default: '' },
        tags: { type: 'array', required: false, default: [] }
    },
    spells: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        level: { type: 'number', required: false, default: 0 },
        school: { type: 'string', required: false, default: '' },
        castingTime: { type: 'string', required: false, default: '' },
        range: { type: 'string', required: false, default: '' },
        components: { type: 'string', required: false, default: '' },
        duration: { type: 'string', required: false, default: '' },
        description: { type: 'string', required: false, default: '' },
        spellClass: { type: 'string', required: false, default: '' },
        ritual: { type: 'boolean', required: false, default: false },
        concentration: { type: 'boolean', required: false, default: false }
    },
    sessionNotes: {
        id: { type: 'number', required: true },
        date: { type: 'string', required: true },
        content: { type: 'string', required: false, default: '' },
        sessionNumber: { type: 'number', required: false, default: 1 }
    },
    encounters: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        creatureType: { type: 'string', required: false, default: '' },
        cr: { type: 'string', required: false, default: '0' },
        ac: { type: 'number', required: false, default: 10 },
        init: { type: 'number', required: false, default: 0 },
        hp: { type: 'number', required: false, default: 1 },
        speed: { type: 'object', required: false, default: {} },
        perception: { type: 'number', required: false, default: 10 },
        languages: { type: 'array', required: false, default: [] },
        str: { type: 'number', required: false, default: 10 },
        dex: { type: 'number', required: false, default: 10 },
        con: { type: 'number', required: false, default: 10 },
        int: { type: 'number', required: false, default: 10 },
        wis: { type: 'number', required: false, default: 10 },
        cha: { type: 'number', required: false, default: 10 },
        savingThrows: { type: 'object', required: false, default: {} },
        resistances: { type: 'array', required: false, default: [] },
        immunities: { type: 'array', required: false, default: [] },
        conditionImmunities: { type: 'array', required: false, default: [] },
        traits: { type: 'string', required: false, default: '' },
        actions: { type: 'string', required: false, default: '' },
        skills: { type: 'string', required: false, default: '' },
        tags: { type: 'array', required: false, default: [] }
    },
    wiki: {
        id: { type: 'number', required: true },
        title: { type: 'string', required: true },
        category: { type: 'string', required: false, default: 'locations' },
        content: { type: 'string', required: false, default: '' },
        tags: { type: 'array', required: false, default: [] },
        pinned: { type: 'boolean', required: false, default: false },
        parentId: { type: 'number', required: false, default: null },
        createdAt: { type: 'number', required: false, default: 0 },
        updatedAt: { type: 'number', required: false, default: 0 }
    },
    links: {
        id: { type: 'number', required: true },
        title: { type: 'string', required: true },
        url: { type: 'string', required: true },
        category: { type: 'string', required: false, default: 'other' },
        description: { type: 'string', required: false, default: '' }
    },
    // F-09: die drei Listen-Ansichten des Welt-Moduls. Reise fehlt bewusst —
    // sie ist ein Rechner ohne gespeicherte Eintraege (siehe unten).
    sessionPreps: {
        id: { type: 'number', required: true },
        sessionNr: { type: 'number', required: false, default: 0 },
        datum: { type: 'string', required: false, default: '' },
        inGameDatum: { type: 'string', required: false, default: '' },
        strongStart: { type: 'string', required: false, default: '' },
        szenen: { type: 'array', required: false, default: [] },
        offeneFaeden: { type: 'array', required: false, default: [] },
        erstellt: { type: 'number', required: false, default: 0 }
    },
    factions: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        symbol: { type: 'string', required: false, default: '' },
        ruf: { type: 'number', required: false, default: 0 },
        agenda: { type: 'string', required: false, default: '' },
        beschreibung: { type: 'string', required: false, default: '' },
        sitzOrtId: { type: 'number', required: false, default: null },
        // Code-Review 2026-09-08: verbuendete/rivalen sind Freitextfelder
        // (fraktionen-crud.js:43-44), keine Listen. Mit default: [] erzeugte
        // ein Import ohne diese Felder eine leere, beschriftete Sektion —
        // ein leeres Array ist in JS truthy, die Pruefung in
        // fraktionen-render.js:269 griff also ins Leere.
        verbuendete: { type: 'string', required: false, default: '' },
        rivalen: { type: 'string', required: false, default: '' },
        rufHistorie: { type: 'array', required: false, default: [] }
    },
    calendarEvents: {
        id: { type: 'number', required: true },
        titel: { type: 'string', required: true },
        datum: { type: 'object', required: false, default: null },
        typ: { type: 'string', required: false, default: 'sonstiges' },
        beschreibung: { type: 'string', required: false, default: '' },
        quelleId: { type: 'number', required: false, default: null }
    }
};

// F-09: Datentypen, deren Array NICHT direkt unter D liegt. Die
// Kalender-Ereignisse haengen unter D.calendar.events — ohne diese Karte
// scheiterte der Export an der Array-Pruefung.
const IO_DATA_PATH = {
    calendarEvents: ['calendar', 'events']
};

/** Liest das Datenarray eines Typs, auch wenn es verschachtelt liegt. */
function ioGetArray(type) {
    const D = window.D;
    const path = IO_DATA_PATH[type];
    if (!path) return D[type];
    let node = D;
    for (const key of path) {
        if (!node) return undefined;
        node = node[key];
    }
    return node;
}

/** Schreibt das Datenarray eines Typs, auch wenn es verschachtelt liegt. */
function ioSetArray(type, items) {
    const D = window.D;
    const path = IO_DATA_PATH[type];
    if (!path) {
        D[type] = items;
        return;
    }
    let node = D;
    for (let i = 0; i < path.length - 1; i++) {
        if (!node[path[i]]) node[path[i]] = {};
        node = node[path[i]];
    }
    node[path[path.length - 1]] = items;
}
// Import-Sicherheitsgrenze (SEC-01/D-02): Feldliste der HTML-tragenden Felder je
// Entity-Typ, per Render-Pfad-Audit ermittelt (10-RESEARCH.md). Rein textuelle und
// kategoriale Felder (name, title, tags, category, …) bleiben bewusst außen vor —
// der Sanitizer würde dort legitime spitze Klammern (Würfelformeln, Vergleiche)
// zerstören. KEINE weiteren Typen/Felder ohne erneuten Render-Pfad-Audit ergänzen.
const HTML_FIELDS_BY_TYPE = {
    characters: ['notes'],
    npcs: ['description'],
    locations: ['description'],
    quests: ['description'],
    encounters: ['traits', 'actions', 'skills'],
    spells: ['description'],
    sessionNotes: ['content'],
    wiki: ['content'],
    links: ['description'],
    // F-09, Render-Pfad-Audit vom 2026-09-07: in allen drei Ansichten laeuft
    // JEDES HTML-tragende Feld bereits beim Rendern durch sanitizeHTML() —
    // session-prep-render.js:103/193/366 (strongStart),
    // session-prep-render.js:24 (szene.beschreibung, verschachtelt),
    // fraktionen-render.js:169/177 (agenda, beschreibung),
    // timeline-render.js (beschreibung). Die Eintraege hier sind die zweite
    // Schicht beim Import.
    // BEWUSSTE LUECKE: sanitizeImportedItem() geht nur ueber Felder der
    // OBERSTEN Ebene. szenen[].beschreibung wird hier NICHT erfasst; dort
    // traegt allein der Render-Pfad. Wer diese Funktion auf verschachtelte
    // Strukturen erweitert, sollte 'szenen' hier ergaenzen.
    sessionPreps: ['strongStart'],
    factions: ['agenda', 'beschreibung'],
    calendarEvents: ['beschreibung']
};
// Bereinigt die HTML-tragenden Felder eines importierten Items über den
// projektweiten Sanitizer (utils/basic.js: sanitizeHTML()). Modul-intern
// (kein window-Export, CLAUDE.md „Export Audit Rule") — total definiert:
// unbekannter Typ, fehlendes/nicht-String-Feld führen zu unverändertem Item,
// nie zu einem Fehler. Meldet nichts (D-04: still säubern).
function sanitizeImportedItem(type, item) {
    const fields = HTML_FIELDS_BY_TYPE[type];
    if (!fields) return item;
    const sanitizeHTML = window.sanitizeHTML;
    if (typeof sanitizeHTML !== 'function') return item;
    const result = { ...item };
    fields.forEach(field => {
        if (typeof result[field] === 'string') {
            result[field] = sanitizeHTML(result[field]);
        }
    });
    return result;
}
// EXPORT FUNCTIONS
// ============================================================
function exportData(dataType) {
    const APP_CONFIG = window.APP_CONFIG;
    const data = ioGetArray(dataType);
    if (!data || !Array.isArray(data) || data.length === 0) {
        showToast(`Keine ${dataType} zum Exportieren vorhanden`, 'warning');
        return;
    }
    const schema = IO_SCHEMA[dataType];
    if (!schema) {
        showToast('Datentyp wird nicht unterstützt', 'error');
        return;
    }
    try {
        // Daten nach Schema filtern
        const filtered = data.map(item => {
            const obj = {};
            for (const [key, field] of Object.entries(schema)) {
                obj[key] = item[key] !== undefined ? item[key] : ioCloneDefault(field.default);
            }
            return obj;
        });
        // Kampagnennamen hinzufügen
        const getCampaignIndex = window.getCampaignIndex;
        const index = getCampaignIndex();
        let campaignName = 'Standard-Kampagne';
        if (index.active !== APP_CONFIG.STORAGE_KEY) {
            const campaign = index.campaigns.find(c => c.key === index.active);
            campaignName = campaign?.name || 'Unbenannte Kampagne';
        }
        const exportObj = {
            _exportDate: new Date().toISOString(),
            _campaignName: campaignName,
            _version: APP_CONFIG.VERSION,
            _dataType: dataType,
            data: filtered
        };
        const json = JSON.stringify(exportObj, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}-${campaignName.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`📁 ${data.length} ${dataType} exportiert`);
    } catch (err) {
        showToast('❌ Export fehlgeschlagen: ' + err.message, 'error');
        // Ausnahme (c): Export-Fehler koennten stillen Datenverlust verdecken, kein Guard
        if (window.ErrorHandler) {
            window.ErrorHandler.log('Export', err);
        }
    }
}
function exportToCSV(dataType) {
    const data = ioGetArray(dataType);
    if (!data || !Array.isArray(data) || data.length === 0) {
        showToast(`Keine ${dataType} zum Exportieren`, 'warning');
        return;
    }
    const schema = IO_SCHEMA[dataType];
    if (!schema) {
        showToast('CSV-Export für diesen Datentyp nicht verfügbar', 'error');
        return;
    }
    try {
        // Header
        const headers = Object.keys(schema);
        let csv = headers.join(',') + '\n';
        // Rows
        data.forEach(item => {
            const row = headers.map(key => {
                let val = item[key] !== undefined ? item[key] : schema[key].default;
                // Arrays/Objects zu JSON
                if (typeof val === 'object') {
                    val = JSON.stringify(val);
                }
                // Escape quotes in CSV
                val = String(val).replace(/"/g, '""');
                return `"${val}"`;
            });
            csv += row.join(',') + '\n';
        });
        // BOM für Excel UTF-8 Support
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`📊 CSV exportiert (${data.length} Einträge)`);
    } catch (err) {
        showToast('❌ CSV-Export fehlgeschlagen', 'error');
        if (window.ErrorHandler) {
            window.ErrorHandler.log('CSV Export', err);
        }
    }
}
// IMPORT FUNCTIONS — der Import pro Reiter (REITERIMPORT)
// ============================================================
// Vertrag REITERIMPORT (docs/bugfixes.md): R1 ein Dateidialog, R2 Meldung erst nach dem
// Schreiben, R10 Telefon und Fokus, dazu der Oberflaechen-Vertrag (#import-modal).
//
// DER WEG. 📥 (trigger-click) oeffnet den Dateidialog des Reiterfelds (`.io-file-input`,
// data-on-change="importData"), und importData() liest GENAU die dort gewaehlte Datei. Vorher
// baute showImportModal() ein ZWEITES, namenloses Datei-Feld und klickte es: ein Dateidialog
// braucht in Chromium transiente Nutzeraktivierung, und die ist ~5 s nach dem Klick auf 📥
// abgelaufen — wer laenger im ersten Dialog suchte, erlebte gar nichts (gemessen, Kritik K1).
// `#import-modal` gab es seit der TS-Migration (Jan. 2026) nicht mehr; nach der gruenen Meldung
// "✅ Datei validiert" wurde nie etwas importiert. Das Fenster steht jetzt statisch in
// assets/templates/modals-tools.html — Fokusfalle, Escape und Rueckkehr zum 📥 kommen damit von
// ui/modal-focus.js wie bei jeder Schale.
//
// DIE KETTE. Jede Stufe VOR dem Fenster laesst D, Speicher und Index unberuehrt; eine
// unbrauchbare Datei endet mit einer deutschen Meldung und ohne Fenster:
//   leseReiterImport()        Text -> Objekt (JSON mit Reviver)
//   pruefeReiterImport()      Form der Datei, passender Typ (Rueckfrage)
//   bereiteReiterImportVor()  Datengrenze, Feldabbildung, HTML-Bereinigung, Hinweise
//   showImportModal()         Fenster mit Vorschau; die Daten bleiben im Modulzustand
//   executeImport()           schreibt — und meldet den Erfolg ERST DANACH
// Pruefungen gehoeren in pruefeReiterImport() und laufen damit VOR der Datengrenze: die Grenze
// verwirft Text in Zahlenfeldern still ("viel" -> Feld weg), eine Ablehnung muss ihn vorher
// sehen. Was die Vorschau zusaetzlich nennen soll, haengt bereiteReiterImportVor() an
// `hinweise` an; was nur fuer einen Modus gilt, steht in importVorschauZeilen().

/**
 * @typedef {Object} ReiterImportVorbereitung
 * @property {string} dataType - Typ des Reiterfelds (`data-type`)
 * @property {Object[]} items - die vorbereiteten Eintraege, so wie executeImport() sie schreibt
 * @property {string} kampagne - Kampagne laut Datei, sonst der Dateiname
 * @property {string} exportDatum - Exportdatum laut Datei (TT.MM.JJJJ) oder "unbekannt"
 * @property {{text: string, warnung?: boolean}[]} hinweise - weitere Zeilen der Vorschau
 */

/**
 * Deutsche Namen der Reiter-Typen, [Einzahl, Mehrzahl] (R2). Eine Meldung nennt nie den
 * internen Schluessel — "2 calendarEvents importiert" sagt einem Spielleiter nichts. Die Woerter
 * sind die der App: "Charakter aktualisiert", "Ereignis gespeichert", "Session-Prep gelöscht",
 * die Reiter "🏠 Orte" und "⚔️ Fraktionen".
 */
const REITER_TYPNAMEN = Object.freeze({
    characters: Object.freeze(['Charakter', 'Charaktere']),
    npcs: Object.freeze(['NPC', 'NPCs']),
    locations: Object.freeze(['Ort', 'Orte']),
    quests: Object.freeze(['Quest', 'Quests']),
    encounters: Object.freeze(['Encounter', 'Encounter']),
    loot: Object.freeze(['Gegenstand', 'Gegenstände']),
    spells: Object.freeze(['Zauber', 'Zauber']),
    wiki: Object.freeze(['Wiki-Eintrag', 'Wiki-Einträge']),
    links: Object.freeze(['Link', 'Links']),
    sessionPreps: Object.freeze(['Session-Prep', 'Session-Preps']),
    calendarEvents: Object.freeze(['Ereignis', 'Ereignisse']),
    factions: Object.freeze(['Fraktion', 'Fraktionen']),
    sessionNotes: Object.freeze(['Session-Notiz', 'Session-Notizen'])
});

/**
 * Der deutsche Typname im passenden Numerus. Ein unbekannter Typ heisst "Eintrag"/"Einträge"
 * und nie wie sein Schluessel — `_dataType` kommt aus der Datei, darum die Pruefung auf eigene
 * Eigenschaft (sonst lieferte "constructor" eine Funktion).
 * @param {string} typ
 * @param {number} anzahl
 * @returns {string}
 */
function reiterTypName(typ, anzahl) {
    const namen = Object.prototype.hasOwnProperty.call(REITER_TYPNAMEN, typ)
        ? REITER_TYPNAMEN[typ]
        : ['Eintrag', 'Einträge'];
    return anzahl === 1 ? namen[0] : namen[1];
}

/** Die groesste Datei, die der Reiter-Import liest (wie bisher). */
const REITER_IMPORT_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Sperre gegen parallele Laeufe: eine Auswahl wird gerade gelesen und vorbereitet. Ein
 * `<input type=file>` meldet eine Auswahl als `input` UND `change`; das Reiterfeld traegt nur
 * data-on-change (ui/event-delegation.js ruft also einmal), aber jede weitere Ausloesung,
 * solange die erste laeuft, braechte eine zweite Rueckfrage und ein zweites Fenster.
 */
let _reiterImportLaeuft = false;

/**
 * Die vorbereitete Datei, solange das Fenster steht — im Modulzustand und NICHT als Text im
 * DOM (frueher `modal.dataset.importItems`: bis zu 10 MB JSON in einem Attribut, bei jedem
 * Lesen neu geparst). Gilt fuer genau EINEN Import: executeImport() und die naechste Dateiwahl
 * setzen ihn zurueck.
 * @type {ReiterImportVorbereitung|null}
 */
let _reiterImport = null;

/**
 * Eine erwartete Ablehnung: ihre Meldung ist deutsch und geht so an den Nutzer, und sie ist
 * kein Programmfehler (kein Eintrag im Fehlerlog).
 * @param {string} text
 * @returns {Error}
 */
function reiterImportFehler(text) {
    const fehler = new Error(text);
    fehler.reiterImport = true;
    return fehler;
}

/**
 * Meldet das Ende einer Kette, die nicht im Fenster ankam. Eine erwartete Ablehnung nennt
 * ihren Grund; alles andere ist ein Programmfehler: eine allgemeine deutsche Meldung (kein
 * Laufzeit-Rohtext) und ein Eintrag im Fehlerlog.
 * @param {*} err
 */
function meldeReiterImportFehler(err) {
    if (err && err.reiterImport) {
        showToast('❌ ' + err.message, 'error');
        return;
    }
    showToast('❌ Import fehlgeschlagen: die Datei ließ sich nicht verarbeiten', 'error');
    if (window.ErrorHandler) window.ErrorHandler.log('Import', err, 'Reiter-Import');
}

/**
 * `change` des Reiterfelds: liest die dort gewaehlte Datei, bereitet sie vor und oeffnet das
 * Fenster (R1). Eine leere Auswahl — der Dialog wurde abgebrochen oder die Wahl geleert — ist
 * still: keine Meldung, nichts geaendert.
 * @param {HTMLInputElement} inputEl - das Reiterfeld (`.io-file-input` mit `data-type`)
 */
function importData(inputEl) {
    const datei = inputEl && inputEl.files ? inputEl.files[0] : null;
    if (!datei || _reiterImportLaeuft) return;
    _reiterImportLaeuft = true;
    _reiterImport = null;
    oeffneReiterImport(inputEl, datei);
}

/**
 * Die Kette von der Datei bis zum Fenster. Lehnt nie ab: jedes Ende wird hier gemeldet.
 * @param {HTMLInputElement} inputEl
 * @param {File} datei
 * @returns {Promise<void>}
 */
async function oeffneReiterImport(inputEl, datei) {
    const dataType = inputEl.dataset.type || '';
    try {
        if (datei.size > REITER_IMPORT_MAX_BYTES) {
            throw reiterImportFehler('Datei zu groß (max. 10 MB)');
        }
        const inhalt = leseReiterImport(await leseDateiText(datei));
        // Rueckfrage abgelehnt: still, wie ein abgebrochener Dialog
        if (!pruefeReiterImport(inhalt, dataType)) return;
        const vorbereitung = bereiteReiterImportVor(inhalt, dataType, datei.name);
        fokussiereEinfuhrKnopf(inputEl);
        showImportModal(dataType, vorbereitung);
    } catch (err) {
        meldeReiterImportFehler(err);
    } finally {
        // `value` leeren — auch nach einer Ablehnung und nach ✕ im Fenster: dieselbe Datei
        // noch einmal gewaehlt ist fuer den Browser sonst keine Aenderung, kein `change`, gar
        // keine Rueckmeldung (gemessen, Bedienweg C1). Erst hier und nicht vor dem Lesen: der
        // File-Verweis ist schon gehalten, und solange die Sperre steht, kommt keine Wahl an.
        inputEl.value = '';
        _reiterImportLaeuft = false;
    }
}

/**
 * Liest eine Datei als Text.
 * @param {File} datei
 * @returns {Promise<string>}
 */
function leseDateiText(datei) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(String(e.target?.result ?? ''));
        reader.onerror = () => reject(reiterImportFehler('Datei konnte nicht gelesen werden'));
        reader.readAsText(datei);
    });
}

/**
 * Text -> Objekt. Der Reviver verwirft `__proto__`, `constructor` und `prototype` in jeder
 * Tiefe (CAMPAIGN_FORBIDDEN_KEYS, wie der Kampagnenweg) — ein solcher Schluessel waere sonst
 * ein eigenes Feld, das jede spaetere Zuweisung oder Kopie zum Prototyp-Setzer macht.
 * @param {string} text
 * @returns {*}
 */
function leseReiterImport(text) {
    if (typeof text !== 'string' || text.trim() === '') {
        throw reiterImportFehler('Die Datei ist leer');
    }
    try {
        return JSON.parse(text, (schluessel, wert) =>
            CAMPAIGN_FORBIDDEN_KEYS.includes(schluessel) ? undefined : wert
        );
    } catch {
        throw reiterImportFehler('Die Datei ist kein gültiges JSON');
    }
}

/**
 * Ist die Datei ein Reiter-Export fuer DIESEN Reiter? Wirft bei einer unbrauchbaren Datei,
 * fragt bei einem anderen `_dataType` nach (deutsche Typnamen) und gibt zurueck, ob es
 * weitergeht. Beruehrt nichts Globales.
 * @param {*} inhalt - geparste Datei
 * @param {string} dataType - Typ des Reiterfelds
 * @returns {boolean} false: der Nutzer hat die Rueckfrage abgelehnt
 */
function pruefeReiterImport(inhalt, dataType) {
    if (
        !inhalt ||
        typeof inhalt !== 'object' ||
        Array.isArray(inhalt) ||
        !Array.isArray(inhalt.data)
    ) {
        throw reiterImportFehler('Ungültiges Format: der Datei fehlt die Liste „data“');
    }
    if (inhalt.data.length === 0) {
        throw reiterImportFehler('Die Datei enthält keine Einträge');
    }
    const keinObjekt = inhalt.data.findIndex(
        item => !item || typeof item !== 'object' || Array.isArray(item)
    );
    if (keinObjekt >= 0) {
        throw reiterImportFehler(`Eintrag ${keinObjekt + 1} der Datei ist kein Eintrag`);
    }
    const dateiTyp = inhalt._dataType;
    if (typeof dateiTyp === 'string' && dateiTyp !== '' && dateiTyp !== dataType) {
        return confirm(
            `Die Datei enthält ${reiterTypName(dateiTyp, 2)}, dieser Reiter importiert ` +
                `${reiterTypName(dataType, 2)}.\n\nTrotzdem importieren?`
        );
    }
    return true;
}

/**
 * Die Eintraege eines Typs an ihrem Platz im Kampagnenformat (IO_DATA_PATH) — die Form, auf
 * der bereinigeDatengrenze() arbeitet (`npcs[].id`, `calendar.events[].id`).
 * @param {string} type
 * @param {Object[]} items
 * @returns {Object}
 */
function reiterImportWurzel(type, items) {
    const pfad = IO_DATA_PATH[type] || [type];
    const wurzel = {};
    let knoten = wurzel;
    for (let i = 0; i < pfad.length - 1; i++) {
        knoten[pfad[i]] = {};
        knoten = knoten[pfad[i]];
    }
    knoten[pfad[pfad.length - 1]] = items;
    return wurzel;
}

/**
 * Bereitet die gepruefte Datei fuer das Fenster vor: dieselbe Datengrenze wie jeder andere
 * Eingang nach D (SENKEN R4), die Feldabbildung nach IO_SCHEMA und die Bereinigung der
 * HTML-Felder (SEC-01). Beruehrt nichts Globales.
 * @param {*} inhalt - von pruefeReiterImport() angenommene Datei
 * @param {string} dataType
 * @param {string} dateiname
 * @returns {ReiterImportVorbereitung}
 */
function bereiteReiterImportVor(inhalt, dataType, dateiname) {
    const schema = IO_SCHEMA[dataType];
    if (!schema) {
        throw reiterImportFehler('Dieser Bereich lässt sich nicht importieren');
    }
    const grenze = bereinigeDatengrenze(reiterImportWurzel(dataType, inhalt.data));
    const eintraege = (IO_DATA_PATH[dataType] || [dataType]).reduce(
        (knoten, schluessel) => (knoten ? knoten[schluessel] : undefined),
        grenze
    );
    const items = (Array.isArray(eintraege) ? eintraege : []).map((item, idx) => {
        const validated = {};
        for (const [key, field] of Object.entries(schema)) {
            if (field.required && item[key] === undefined) {
                throw reiterImportFehler(`Eintrag ${idx + 1}: Pflichtfeld „${key}“ fehlt`);
            }
            validated[key] = item[key] !== undefined ? item[key] : ioCloneDefault(field.default);
        }
        // SEC-01/D-01: HTML-tragende Felder vor der Anzeige bereinigen (Import-Grenze)
        return sanitizeImportedItem(dataType, validated);
    });
    const kampagne =
        typeof inhalt._campaignName === 'string' && inhalt._campaignName.trim() !== ''
            ? inhalt._campaignName.trim()
            : String(dateiname || '').replace(/\.json$/i, '');
    const datum = typeof inhalt._exportDate === 'string' ? new Date(inhalt._exportDate) : null;
    return {
        dataType,
        items,
        kampagne: kampagne.slice(0, 100),
        exportDatum:
            datum && !isNaN(datum.getTime()) ? datum.toLocaleDateString('de-DE') : 'unbekannt',
        hinweise: []
    };
}

/**
 * Setzt den Fokus auf das 📥 des Reiterfelds, wenn er beim Oeffnen nirgends steht.
 * showModal() merkt sich den Oeffner, und ✕, "Abbrechen" und Escape geben ihm den Fokus
 * zurueck (R10). Nach einem Klick auf 📥 steht er in Chromium ohnehin dort; ein Browser, der
 * Knoepfe beim Klick nicht fokussiert, liesse ihn auf <body>, und das Fenster haette keinen
 * Rueckweg.
 * @param {HTMLInputElement} inputEl
 */
function fokussiereEinfuhrKnopf(inputEl) {
    const aktiv = document.activeElement;
    if (aktiv && aktiv !== document.body && aktiv !== document.documentElement) return;
    const knopf = Array.from(document.querySelectorAll('[data-action="trigger-click"]')).find(
        k => k.dataset.value === inputEl.id
    );
    if (knopf && typeof knopf.focus === 'function') knopf.focus({ preventScroll: true });
}

/**
 * Oeffnet das Fenster fuer eine vorbereitete Datei: merkt sie im Modulzustand, stellt den
 * Modus auf "Hinzufügen" (der Weg, der nichts Vorhandenes ersetzt) und zeichnet die Vorschau.
 * @param {string} dataType
 * @param {ReiterImportVorbereitung} vorbereitung
 */
function showImportModal(dataType, vorbereitung) {
    _reiterImport = { ...vorbereitung, dataType };
    const hinzufuegen = document.querySelector('input[name="import-mode"][value="merge"]');
    if (hinzufuegen) hinzufuegen.checked = true;
    renderImportVorschau();
    showModal('import-modal');
}

/** Der gewaehlte Modus: 'replace' nur, wenn "Ersetzen" ausdruecklich gewaehlt ist. */
function gewaehlterImportModus() {
    const gewaehlt = document.querySelector('input[name="import-mode"]:checked');
    return gewaehlt && gewaehlt.value === 'replace' ? 'replace' : 'merge';
}

/**
 * Die Zeilen der Vorschau fuer den gewaehlten Modus. Die Modus-Zeile steht VOR den Hinweisen,
 * damit Hinweise, die zusammengehoeren (etwa alle Verweise), einen Block bilden.
 * @param {ReiterImportVorbereitung} bereit
 * @param {'merge'|'replace'} modus
 * @returns {{text: string, warnung?: boolean}[]}
 */
function importVorschauZeilen(bereit, modus) {
    const n = bereit.items.length;
    const bestand = ioGetArray(bereit.dataType);
    const vorhanden = Array.isArray(bestand) ? bestand.length : 0;
    const modusZeile =
        modus === 'replace'
            ? {
                  text:
                      `Ersetzen: ${vorhanden} ` +
                      (vorhanden === 1
                          ? 'vorhandener Eintrag wird'
                          : 'vorhandene Einträge werden') +
                      ' durch die Datei ersetzt; vorher wird eine Sicherheitskopie angelegt',
                  warnung: true
              }
            : {
                  text:
                      `Hinzufügen: ${n} ` +
                      (n === 1 ? 'Eintrag kommt' : 'Einträge kommen') +
                      ` mit neuer ID zu den vorhandenen (${vorhanden}) dazu`
              };
    return [
        { text: `Typ: ${reiterTypName(bereit.dataType, 2)}` },
        { text: `Einträge: ${n}` },
        { text: `Kampagne: ${bereit.kampagne}` },
        { text: `Export-Datum: ${bereit.exportDatum}` },
        modusZeile,
        ...bereit.hinweise
    ];
}

/**
 * Zeichnet die Vorschau `#import-info` neu — beim Oeffnen und bei jedem Wechsel des Modus
 * (data-action="import-vorschau" an den Optionsfeldern). Als Text, nicht als Markup: Name der
 * Kampagne und Hinweise kommen aus der Datei.
 */
function renderImportVorschau() {
    const ziel = $('import-info');
    if (!ziel || !_reiterImport) return;
    ziel.textContent = '';
    for (const zeile of importVorschauZeilen(_reiterImport, gewaehlterImportModus())) {
        const div = document.createElement('div');
        div.className = zeile.warnung
            ? 'reiterimport-zeile reiterimport-warnung'
            : 'reiterimport-zeile';
        div.textContent = zeile.text;
        ziel.appendChild(div);
    }
}

/**
 * "Importieren" im Fenster: schreibt die vorbereitete Datei und meldet den Erfolg erst danach,
 * mit deutschem Typnamen im richtigen Numerus (R2).
 * @param {string} [dataType] - nur zur Gegenprobe: weicht er vom vorbereiteten Typ ab, wird
 *   nichts geschrieben
 */
function executeImport(dataType) {
    const bereit = _reiterImport;
    if (!bereit || bereit.items.length === 0 || (dataType && dataType !== bereit.dataType)) {
        showToast('Keine Daten zum Importieren', 'error');
        return;
    }
    const type = bereit.dataType;
    const items = bereit.items;
    const mode = gewaehlterImportModus();
    const name = reiterTypName(type, items.length);
    const renderAll = window.renderAll;
    saveUndoState(`${items.length} ${name} importiert`);
    // Sicherheitskopie bei Replace-Modus. createAutoBackup() erfasst D synchron beim Aufruf,
    // deshalb ohne await; die Meldung folgt dem echten Ergebnis (Code-Review 2026-09-21, R10).
    if (mode === 'replace') {
        reportSafetyBackup(createAutoBackup({ reason: 'safety' }));
        ioSetArray(type, items);
        // Zaehler ueber die groesste ersetzte ID heben (Code-Review 2026-09-21, R03)
        validateAndRepairNextId(undefined, [type]);
    } else {
        // Merge: neue IDs ueber den ID-Generator der App (nextId, auch fuer verschachtelte
        // Sammlungen wie calendarEvents) — R03: die hier frueher aufgerufene Funktion gab es nicht
        const merged = items.map(item => {
            return { ...item, id: nextId(type) };
        });
        ioSetArray(type, [...(ioGetArray(type) || []), ...merged]);
    }
    // Ein Import, ein Schreiben: ein zweites "Importieren" findet nichts mehr vor
    _reiterImport = null;
    save();
    renderAll();
    updateIOCounts();
    hideModal('import-modal');
    showToast(
        `✅ ${items.length} ${name} importiert (${mode === 'replace' ? 'ersetzt' : 'hinzugefügt'})`
    );
}
// UTILITY FUNCTIONS
// ============================================================
function updateIOCounts() {
    const D = window.D;
    // Schluessel = data-view-Wert der Navigation (F-10). Die IDs im Markup
    // heissen `<view>-count`; geschrieben wird ausschliesslich ueber
    // setViewCount().
    const counts = {
        party: D.characters?.length || 0,
        npcs: D.npcs?.length || 0,
        locations: D.locations?.length || 0,
        quests: D.quests?.length || 0,
        loot: D.loot?.length || 0,
        spells: D.spells?.length || 0,
        notes: D.sessionNotes?.length || 0,
        encounter: D.encounters?.length || 0,
        wiki: D.wiki?.length || 0,
        links: D.links?.length || 0,
        shops: D.shops?.length || 0
    };
    for (const [view, count] of Object.entries(counts)) {
        setViewCount(view, count);
    }
    // Encounter-Runde aktualisieren
    const roundEl = $('encounter-round-num');
    if (roundEl) roundEl.textContent = String(D.initiative?.round || 1);
}
// Legacy: Alte exportSpells Funktion für Kompatibilität
function exportSpells() {
    exportData('spells');
}
// STAB-02 / D-09: Hinweis-Dialog bei echten Mindmap-Inhalten vor dem Import
// Modul-intern — kein window-Export (CLAUDE.md Export-Audit)
function showMindmapExportDialog(mindmap, campaignName) {
    return new Promise(resolve => {
        const safeName = (campaignName || 'kampagne')
            .replace(/[^a-zA-Z0-9äöüÄÖÜß\s\-]/g, '')
            .replace(/\s+/g, '-');
        const nodeCount = String(mindmap.nodes ? mindmap.nodes.length : 0);
        const connCount = String(mindmap.connections ? mindmap.connections.length : 0);
        const overlay = document.createElement('div');
        overlay.className = 'modal show';
        overlay.innerHTML =
            '<div class="modal-content" style="max-width:480px">' +
            '<h3>Mindmap-Daten gefunden</h3>' +
            '<p>Diese Kampagne enthält Mindmap-Inhalte (' +
            esc(nodeCount) +
            ' Knoten, ' +
            esc(connCount) +
            ' Verbindungen). Das Mindmap-Feature wurde entfernt — die Daten werden ' +
            'beim Import verworfen. Du kannst sie vorher als Datei sichern.</p>' +
            '<div style="display:grid;gap:8px;margin:12px 0">' +
            '<button data-act="save" class="btn btn-primary">Mindmap als JSON sichern</button>' +
            '<button data-act="skip" class="btn">Fortfahren</button>' +
            '</div></div>';
        overlay.addEventListener('click', ev => {
            const act = ev.target && ev.target.dataset ? ev.target.dataset.act : null;
            if (act === 'save') {
                // D-10: eigene JSON-Backup-Datei herunterladen
                const json = JSON.stringify(
                    {
                        nodes: mindmap.nodes || [],
                        connections: mindmap.connections || []
                    },
                    null,
                    2
                );
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mindmap-backup-' + safeName + '.json';
                a.click();
                URL.revokeObjectURL(url);
                showToast('Mindmap-Backup heruntergeladen', 'success');
                return; // Dialog offen lassen, bis Nutzer "Fortfahren" waehlt
            }
            if (act === 'skip') {
                document.body.removeChild(overlay);
                resolve(true);
            }
        });
        document.body.appendChild(overlay);
    });
}
// ============================================================
// KAMPAGNEN-IMPORT (Code-Review 2026-09-21, R03/R07)
// Eine Kampagnendatei wird VOLLSTAENDIG vorbereitet (Plausibilitaet, Alt-Charaktere,
// Bereinigung, Migration, Standardwerte, eindeutige IDs, Zaehler), bevor ein Dialog
// erscheint. "Ueberschreiben" ERSETZT danach die Kampagne (replaceCampaignData) statt die
// Datei in D zu mischen; "neue Kampagne" schreibt Daten vor Index (addCampaignWithData).
// ============================================================
/**
 * Sammlungen, von denen eine Kampagnendatei mindestens EINE als Array enthalten muss.
 * Ohne diese Pruefung ersetzte eine reine Einstellungs- oder fremde JSON-Datei die ganze
 * Kampagne durch Standardwerte. Pfade wie ID_COUNTER_PATHS (utils/utilities.js) — hier als
 * eigene Liste, weil diese Datei beim Laden nicht auf utilities.js zugreifen darf.
 */
const CAMPAIGN_IMPORT_COLLECTIONS = [
    ['characters'],
    ['npcs'],
    ['locations'],
    ['quests'],
    ['encounters'],
    ['loot'],
    ['spells'],
    ['wiki'],
    ['sessionNotes'],
    ['storyArcs'],
    ['bestiary'],
    ['sessionPreps'],
    ['factions'],
    ['shops'],
    ['links'],
    ['filters'],
    ['tags'],
    ['quickRefCustom'],
    ['randomTables'],
    ['calendar', 'events'],
    ['initiative', 'combatants']
];
/**
 * App-Einstellungen, die ein ueberschreibender Import von der aktuellen Kampagne behaelt,
 * wenn die Datei sie nicht mitbringt (Exporte enthalten sie immer).
 */
const CAMPAIGN_IMPORT_APP_KEYS = [
    'settings',
    'dmScreenLayout',
    'dmScreenProfiles',
    'dmScreenActiveProfile'
];
// Alt-Charaktere: Herkunft/Gewicht aus den Notizen, Spielername aus "(Name)" — unveraendert
// aus dem frueheren Importpfad uebernommen
function migrateImportedCharacters(copy) {
    if (!Array.isArray(copy.characters)) return;
    copy.characters = copy.characters.map(c => {
        let bg = c.background || '';
        let wt = c.weight || 0;
        let pn = c.playerName || '';
        if (c.notes && !bg) {
            const m = c.notes.match(/Herkunft\s*:\s*([^\n]+)/i);
            if (m) bg = m[1].trim();
        }
        if (c.notes && !wt) {
            const m = c.notes.match(/Gewicht\s*:\s*(\d+)/i);
            if (m) wt = parseInt(m[1]);
        }
        if (c.name?.includes('(') && !pn) {
            const m = c.name.match(/\(([^)]+)\)/);
            if (m) pn = m[1];
        }
        return {
            ...c,
            background: bg,
            weight: wt,
            playerName: pn,
            hpCurrent: c.hpCurrent || 0,
            hpMax: c.hpMax || 0,
            spells: c.spells || []
        };
    });
}
/**
 * Bereitet eine Kampagnendatei fuer beide Import-Zweige vor. Beruehrt nichts Globales
 * (weder D noch Index noch Speicher) und wirft bei einer unbrauchbaren Datei einen Fehler
 * mit deutscher Begruendung.
 * @param {*} imp - geparste Datei
 * @returns {{data: object, renumbered: Array<{type, from, to}>, keepFromCurrent: string[]}}
 */
function prepareCampaignImport(imp) {
    if (imp === null || typeof imp !== 'object' || Array.isArray(imp)) {
        throw new Error('Ungültige Importdatei');
    }
    if (typeof imp._dataType === 'string' || Array.isArray(imp.data)) {
        throw new Error('Einzel-Export – bitte im jeweiligen Reiter importieren');
    }
    if (typeof imp._exportType === 'string') {
        throw new Error(
            'Umzugs- oder Audio-Export – bitte über den Umzugs-Assistenten importieren'
        );
    }
    const hasCollection = CAMPAIGN_IMPORT_COLLECTIONS.some(segments => {
        let node = imp;
        for (const segment of segments) {
            if (node === null || typeof node !== 'object') return false;
            node = node[segment];
        }
        return Array.isArray(node);
    });
    if (!hasCollection) throw new Error('Keine Kampagnendaten gefunden');
    // Flache Kopie; _version bleibt — der Normalisierer entscheidet ueber die Migration
    const copy = { ...imp };
    delete copy._campaignName;
    delete copy._exportDate;
    delete copy.mindmap;
    const keepFromCurrent = CAMPAIGN_IMPORT_APP_KEYS.filter(
        k => !Object.prototype.hasOwnProperty.call(copy, k)
    );
    migrateImportedCharacters(copy);
    // SEC-01/D-01: HTML-tragende Felder an der Import-Grenze bereinigen — fuer BEIDE Zweige
    Object.keys(HTML_FIELDS_BY_TYPE).forEach(type => {
        if (Array.isArray(copy[type])) {
            copy[type] = copy[type].map(item => sanitizeImportedItem(type, item));
        }
    });
    // Kalender-Ereignisse liegen verschachtelt (calendar.events) und liefen frueher
    // unbereinigt durch
    if (
        HTML_FIELDS_BY_TYPE.calendarEvents &&
        copy.calendar &&
        Array.isArray(copy.calendar.events)
    ) {
        copy.calendar = {
            ...copy.calendar,
            events: copy.calendar.events.map(e => sanitizeImportedItem('calendarEvents', e))
        };
    }
    const result = window.normalizeCampaignData(copy);
    if (!result.ok) throw new Error(result.error);
    return { data: result.data, renumbered: result.renumbered, keepFromCurrent };
}
// Browser feuern fuer <input type=file> beim Auswaehlen 'input' UND 'change'; beide rufen
// data-action="import-data-global" auf. Ein laufender Import ignoriert den zweiten Aufruf
// (sonst zwei Dialogfolgen und zwei Importe derselben Datei).
let _campaignImportRunning = false;
// Globaler Kampagnen-Import (#import-file)
function importDataGlobal() {
    const fileInput = $('import-file');
    const file = fileInput.files?.[0];
    if (!file || _campaignImportRunning) return;
    _campaignImportRunning = true;
    const finish = () => {
        fileInput.value = '';
        _campaignImportRunning = false;
    };
    const reader = new FileReader();
    reader.onload = async e => {
        try {
            let imp;
            try {
                imp = JSON.parse(e.target?.result);
            } catch {
                throw new Error('Datei ist kein gültiges JSON');
            }
            const D = window.D;
            const renderAll = window.renderAll;
            // Vorbereitung VOR jedem Dialog: eine unbrauchbare Datei beruehrt weder D noch
            // Index noch Speicher
            const prepared = prepareCampaignImport(imp);
            const campaignName =
                String(
                    imp._campaignName ||
                        file.name.replace('.json', '').replace(/-\d{4}-\d{2}-\d{2}$/, '')
                )
                    .trim()
                    .slice(0, 100) || 'Import';
            // D3 = A: zwei native Dialoge — Abbrechen/Escape ist nie zerstoererisch
            const choice = confirm(
                `Import: "${campaignName}"\n\n` +
                    `OK = Als NEUE Kampagne importieren\n` +
                    `Abbrechen = weitere Optionen`
            );
            if (!choice) {
                const activeKey =
                    typeof window.getActiveCampaignKey === 'function'
                        ? window.getActiveCampaignKey()
                        : null;
                const activeName =
                    activeKey && typeof window.getCampaignDisplayName === 'function'
                        ? window.getCampaignDisplayName(activeKey)
                        : 'aktuelle Kampagne';
                const replace = confirm(
                    `Aktuelle Kampagne „${activeName}“ durch den Import ERSETZEN?\n\n` +
                        `Bereiche, die in der Datei fehlen, werden auf Standardwerte zurückgesetzt ` +
                        `(Rückgängig mit Strg+Z).\n\n` +
                        `OK = Ersetzen\n` +
                        `Abbrechen = Import abbrechen`
                );
                if (!replace) return;
            }
            // STAB-02 / D-09: Mindmap-Inhalt pruefen, bevor er beim Import verworfen wird
            // (prepareCampaignImport() hat ihn aus den Importdaten bereits entfernt)
            if (imp.mindmap) {
                const hasRealContent =
                    (imp.mindmap.nodes && imp.mindmap.nodes.length > 0) ||
                    (imp.mindmap.connections && imp.mindmap.connections.length > 0);
                if (hasRealContent) {
                    await showMindmapExportDialog(imp.mindmap, campaignName); // bietet JSON-Backup an (D-10)
                }
            }
            if (choice) {
                // Als neue Kampagne importieren (R07): Daten zuerst (localStorage oder
                // IndexedDB wie save()), dann EIN Indexwrite mit Eintrag und `active`;
                // jeder Fehlschlag wird zurueckgenommen
                const result = await window.addCampaignWithData(campaignName, prepared.data, {
                    activate: true
                });
                if (!result.success) {
                    let reason;
                    if (result.stage === 'index') {
                        reason = result.key
                            ? 'Kampagnenindex konnte nicht gespeichert werden — Import zurückgenommen'
                            : `${result.error || 'Kampagnenindex nicht lesbar'} — Import abgebrochen`;
                    } else {
                        reason = `Speichern fehlgeschlagen: ${result.error}`;
                    }
                    throw new Error(reason);
                }
                showToast(`✅ Kampagne "${campaignName}" importiert`);
                location.reload();
            } else {
                // Aktuelle Kampagne überschreiben: vollstaendig ERSETZEN (R03) — Bereiche,
                // die in der Datei fehlen, stehen danach auf den Standardwerten.
                // WR-03/D-07: Undo-Punkt + Sicherungskopie VOR dem Datenwechsel.
                saveUndoState('Kampagne überschrieben (Import)');
                // Sicherheitskopie: D wird synchron beim Aufruf erfasst (vor dem Ersetzen),
                // die Meldung folgt dem echten Ergebnis (R10)
                reportSafetyBackup(createAutoBackup({ reason: 'safety' }));
                // Soundboard-Audio stoppen — Web Audio überlebt sonst den Daten-Reset
                if (typeof window.stopAllTracks === 'function') window.stopAllTracks();
                const next = prepared.data;
                prepared.keepFromCurrent.forEach(k => {
                    if (k in D) next[k] = D[k];
                });
                window.replaceCampaignData(D, next);
                // Paritaet mit load(): Laufzeit-Container (shops, timers, campaign) anlegen
                window.validateDataIntegrity();
                renderAll();
                updateIOCounts();
                const quickNotes = $('quick-notes');
                if (quickNotes) quickNotes.value = D.quickNotes || '';
                save();
                showToast('Import OK!');
                // Reine Typumwandlungen ('7' -> 7) sind keine neu vergebenen IDs
                const reassigned = prepared.renumbered.filter(
                    change =>
                        !(typeof change.from === 'string' && Number(change.from) === change.to)
                ).length;
                if (reassigned > 0) {
                    showToast(
                        `⚠️ ${reassigned} doppelte/fehlende IDs beim Import neu vergeben`,
                        'warning'
                    );
                }
            }
        } catch (err) {
            alert('Fehler: ' + err.message);
        } finally {
            finish();
        }
    };
    reader.onerror = () => {
        finish();
        showToast('❌ Datei konnte nicht gelesen werden', 'error');
    };
    try {
        reader.readAsText(file);
    } catch (readError) {
        finish();
        showToast('❌ Datei konnte nicht gelesen werden', 'error');
        if (window.ErrorHandler) window.ErrorHandler.log('importDataGlobal', readError);
    }
}
function copyData() {
    try {
        const D = window.D;
        const exp = { ...D };
        delete exp._nextId;
        const json = JSON.stringify(exp, null, 2);
        if (!navigator.clipboard) {
            throw new Error('Zwischenablage nicht verfügbar (HTTPS erforderlich)');
        }
        navigator.clipboard
            .writeText(json)
            .then(() => showToast('📋 Daten kopiert'))
            .catch(err => {
                showToast(
                    '⚠️ Automatisches Kopieren fehlgeschlagen. Bitte manuell kopieren.',
                    'warning'
                );
                if (window.ErrorHandler) {
                    window.ErrorHandler.log('Copy', err, 'Clipboard failed');
                }
            });
    } catch (err) {
        showToast('❌ Kopieren fehlgeschlagen: ' + err.message, 'error');
        if (window.ErrorHandler) {
            window.ErrorHandler.log('Copy', err);
        }
    }
}
/**
 * Leert den Puffer des Kampfprotokolls, nachdem Kampagnendaten entfernt wurden.
 *
 * UAT-Befund U5 (Pruefrunde 1): das Entfernen des Speicherschluessels allein genuegt NICHT.
 * Der Puffer liegt als Modulvariable im Speicher (features/combat-log/, bewusst nicht in `D`,
 * weil pushUndo() das ganze `D` serialisiert), und jede weitere Meldung schreibt ihn
 * vollstaendig zurueck — die Erfolgsmeldung gleich unter diesem Aufruf tut das, und zwar
 * innerhalb der 1000 ms bis zum Neuladen. Ohne dieses Leeren standen die Namen von
 * Charakteren, NSCs und Monstern nach dem Neustart wieder im Panel, direkt unter der Zeile
 * "Alle Daten geloescht".
 *
 * Nur auf den Pfaden gerufen, auf denen wirklich geloescht wurde: ein gescheiterter Loeschlauf
 * loescht nichts, also darf er auch das Protokoll nicht wegwerfen.
 */
function leereKampfprotokollNachLoeschung() {
    if (typeof window.clearCombatLog === 'function') window.clearCombatLog();
}
// async (Code-Review 2026-09-21, R10): die Sicherheitskopie ist COMMITTET, bevor irgendetwas
// entfernt wird; entfernt werden beide Kopien (IndexedDB und localStorage) — frueher holte
// load() die Kampagne aus IndexedDB zurueck. Der data-action-'call'-Dispatcher ignoriert das
// zurueckgegebene Promise; die Funktion lehnt nie ab.
async function clearStorage() {
    // Step 1: Strong warning with detailed explanation
    const confirmed = confirm(
        '⚠️ ACHTUNG: Alle Daten löschen?\n\n' +
            'Diese Aktion löscht ALLE Kampagnendaten unwiderruflich:\n' +
            '• Charaktere, NPCs, Orte\n' +
            '• Quests, Items, Zauber\n' +
            '• Initiative, Notizen, Wiki\n\n' +
            'Möchten Sie wirklich ALLES löschen?'
    );
    if (!confirmed) return;
    // Step 2: Double confirmation for safety
    const doubleCheck = confirm(
        '🚨 LETZTE WARNUNG!\n\n' + 'Bitte bestätigen Sie erneut: Alle Daten unwiderruflich löschen?'
    );
    if (!doubleCheck) return;
    // Step 3: Sicherheitskopie — bestaetigt geschrieben, BEVOR etwas entfernt wird
    const status = await createAutoBackup({ reason: 'safety' });
    if (status === 'failed') {
        if (
            !confirm(
                '⚠️ Die Sicherheitskopie konnte nicht erstellt werden.\n\nTrotzdem ALLE Daten dieser Kampagne löschen?'
            )
        ) {
            return;
        }
    } else {
        await reportSafetyBackup(status);
    }
    // Step 4 (R02): Schreibsperre ZUERST — ein ausstehender oder ueberfaelliger save(), Strg+S,
    // Strg+Z oder der Session-Timer schreiben sonst vor dem Neuladen alles zurueck
    if (typeof window.retireCampaignWrites === 'function') await window.retireCampaignWrites();
    // Step 5: Kampagnendaten entfernen — IndexedDB-Kopie (bestaetigter Commit) und localStorage
    const key =
        typeof window.getActiveCampaignKey === 'function' ? window.getActiveCampaignKey() : null;
    const result =
        typeof window.removeCampaignData === 'function'
            ? await window.removeCampaignData(key)
            : null;
    if (result && result.success) {
        leereKampfprotokollNachLoeschung();
        showToast('✅ Alle Daten gelöscht', 'info');
        setTimeout(() => location.reload(), 1000);
        return;
    }
    if (window.ErrorHandler) {
        window.ErrorHandler.log('Clear storage', result && result.error);
    }
    // Step 5b (D-B, Nutzerentscheidung 2026-09-27): IndexedDB ist gemeldet, liess sich aber
    // nicht OEFFNEN. Ob dort eine Kopie liegt, ist unbekannt — statt nur fehlzuschlagen
    // ("Es wurde nichts gelöscht") entscheidet der Nutzer. Ein abgebrochener Commit einer
    // GEOEFFNETEN Datenbank bleibt fail-closed: dort ist eine erreichbare Kopie belegt.
    if (
        result &&
        result.stage === 'indexedDB' &&
        result.reason === 'open' &&
        typeof window.confirmLocalOnlyCampaignRemoval === 'function' &&
        window.confirmLocalOnlyCampaignRemoval(key).removed
    ) {
        leereKampfprotokollNachLoeschung();
        showToast(
            '⚠️ Nur die lokalen Daten wurden gelöscht. Die IndexedDB-Kopie konnte nicht ' +
                'entfernt werden und kann beim nächsten Start wieder auftauchen.',
            'warning',
            8000
        );
        setTimeout(() => location.reload(), 1000);
        return;
    }
    if (typeof window.resumeCampaignWrites === 'function') window.resumeCampaignWrites();
    if (result && result.stage === 'indexedDB' && result.reason === 'open') {
        showToast('❌ IndexedDB nicht erreichbar — es wurde nichts gelöscht', 'error');
        return;
    }
    showToast('❌ Fehler beim Löschen', 'error');
}
// ============================================================
