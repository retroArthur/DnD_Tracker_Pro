// [SECTION:IMPORT_EXPORT]
// Extrahiert aus spellslots.js
// Import/Export System mit Validierung
// Zeilen: 565
// Schema-Definition je Datentyp. Seit REITERIMPORT (R4) traegt sie nur noch zwei Aufgaben:
// welche Typen der Reiter-Export kennt, und die Spalten des CSV-Exports. Der JSON-Export pro
// Reiter schreibt den ganzen Eintrag, der Import reicht ihn ganz durch — die Feldliste hier
// filterte frueher beide Wege und erfand Felder, die das Datenmodell nie hatte (`class`, `ac`,
// `hpTemp`, `str`…`cha`, `avatarUrl`; siehe REITER_ALTFELDER). Ihre Vorgaben werden darum
// nirgends mehr in einen Eintrag geschrieben (frueher ioCloneDefault(), Code-Review
// 2026-09-08: nie per Referenz herausgeben).
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
/**
 * Formatkennung des Reiter-Exports (REITERIMPORT R4), Kopfschluessel `_format`. Eine Datei MIT
 * dieser Kennung traegt jeden Eintrag GANZ, so wie er in D steht. Eine Datei OHNE sie stammt
 * aus dem Export davor: der filterte jeden Eintrag auf IO_SCHEMA (Charakter 22 von 35 Feldern
 * weg) und schrieb fuer Felder, die der Eintrag nicht hatte, erfundene Vorgaben (`ac: 10`,
 * `str: 10`) — die Vorschau warnt vor einer solchen Datei (bereiteReiterImportVor()).
 */
const REITER_EXPORT_FORMAT = 'dnd-tracker/reiter-export@2';

/**
 * 📤 eines Reiters: schreibt jeden Eintrag GANZ (R4) — kein Schemafilter mehr. IO_SCHEMA
 * entscheidet nur noch, welche Typen es gibt; seine Feldliste traegt der CSV-Export.
 * @param {string} dataType
 */
function exportData(dataType) {
    const APP_CONFIG = window.APP_CONFIG;
    const data = ioGetArray(dataType);
    if (!data || !Array.isArray(data) || data.length === 0) {
        showToast(`Keine ${reiterTypName(dataType, 2)} zum Exportieren vorhanden`, 'warning');
        return;
    }
    if (!IO_SCHEMA[dataType]) {
        showToast('Datentyp wird nicht unterstützt', 'error');
        return;
    }
    try {
        // Kampagnennamen hinzufügen
        const getCampaignIndex = window.getCampaignIndex;
        const index = getCampaignIndex();
        let campaignName = 'Standard-Kampagne';
        if (index.active !== APP_CONFIG.STORAGE_KEY) {
            const campaign = index.campaigns.find(c => c.key === index.active);
            campaignName = campaign?.name || 'Unbenannte Kampagne';
        }
        const exportObj = {
            _format: REITER_EXPORT_FORMAT,
            _exportDate: new Date().toISOString(),
            _campaignName: campaignName,
            _version: APP_CONFIG.VERSION,
            _dataType: dataType,
            data
        };
        const json = JSON.stringify(exportObj, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}-${campaignName.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`📁 ${data.length} ${reiterTypName(dataType, data.length)} exportiert`);
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
// Vertrag REITERIMPORT (docs/bugfixes.md): R1 ein Dateidialog, R2 Meldung nach dem Schreiben,
// R3 Pruefung vor dem Fenster, R4 Feldtreue, R5/R6 IDs und Verweise (VERWEISE unten), R7 offene
// Formulare, R8 Ansicht/Zaehler/Undo, R9 Sicherheit, R10 Telefon und Fokus, dazu das Fenster.
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
//   pruefeReiterImport()      Form der Datei, passender Typ (Rueckfrage), jeder Eintrag (R3)
//   bereiteReiterImportVor()  IDs fuers Ersetzen (R6), Datengrenze, alte Dateien (R4),
//                             HTML-Bereinigung, Hinweise
//   showImportModal()         Fenster mit Vorschau; die Daten bleiben im Modulzustand
//   executeImport()           schreibt — und meldet den Erfolg ERST DANACH
// Pruefungen gehoeren in pruefeReiterImport() und laufen damit VOR der Datengrenze: die Grenze
// verwirft Text in Zahlenfeldern still ("viel" -> Feld weg), eine Ablehnung muss ihn vorher
// sehen. Ebenso die ID-Pruefung (die Grenze loescht eine ID "abc"). Was die Vorschau
// zusaetzlich nennen soll, haengt bereiteReiterImportVor() an `hinweise` an; was nur fuer einen
// Modus gilt, steht in importVorschauZeilen().
//
// FELDTREUE (R4). Der Export schreibt den ganzen Eintrag mit der Formatkennung
// REITER_EXPORT_FORMAT; der Import reicht ihn ganz durch — dieselbe Schutzlage wie der
// Kampagnen-Import: Datengrenze (SENKEN R4) und Bereinigung der HTML-Felder (SEC-01), alles
// Weitere kodiert die Ausgabe (SENKEN R1). Kein Feld wird umbenannt oder mit Vorgaben gefuellt.

/**
 * @typedef {Object} ReiterImportVorbereitung
 * @property {string} dataType - Typ des Reiterfelds (`data-type`)
 * @property {Object[]} items - die vorbereiteten Eintraege, so wie executeImport() sie schreibt
 * @property {string} kampagne - Kampagne laut Datei, sonst der Dateiname
 * @property {string} exportDatum - Exportdatum laut Datei (TT.MM.JJJJ) oder "unbekannt"
 * @property {{text: string, warnung?: boolean}[]} hinweise - weitere Zeilen der Vorschau
 * @property {string|null} [idFehler] - warum "Ersetzen" mit dieser Datei nicht geht (R6), sonst
 *   null; fehlt er, prueft executeImport() die IDs der Eintraege selbst
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
    const istObjekt = !!inhalt && typeof inhalt === 'object' && !Array.isArray(inhalt);
    if (istObjekt && !Array.isArray(inhalt.data)) {
        // Die beiden anderen Exportarten der App beim Namen nennen, statt nur "Format falsch"
        // zu sagen — der Kampagnenweg sagt es umgekehrt genauso ("Einzel-Export – bitte im
        // jeweiligen Reiter importieren", prepareCampaignImport())
        if (typeof inhalt._exportType === 'string') {
            throw reiterImportFehler(
                'Das ist ein Umzugs- oder Audio-Export, kein Export dieses Reiters – bitte über ' +
                    'den Umzugs-Assistenten importieren'
            );
        }
        if (istKampagnenDatei(inhalt)) {
            throw reiterImportFehler(
                'Das ist eine Kampagnen-Datei (die ganze Kampagne), kein Export dieses Reiters – ' +
                    'bitte unter „💾 Daten“ mit „📁 Datei auswählen“ importieren'
            );
        }
    }
    if (!istObjekt || !Array.isArray(inhalt.data)) {
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
    if (
        typeof dateiTyp === 'string' &&
        dateiTyp !== '' &&
        dateiTyp !== dataType &&
        !confirm(
            `Die Datei enthält ${reiterTypName(dateiTyp, 2)}, dieser Reiter importiert ` +
                `${reiterTypName(dataType, 2)}.\n\nTrotzdem importieren?`
        )
    ) {
        return false;
    }
    // Erst nach der Rueckfrage: geprueft wird gegen den Typ, in den importiert wird
    pruefeReiterEintraege(inhalt.data, dataType);
    return true;
}

/**
 * Sieht die Datei aus wie eine Kampagnen-Datei (💾 Daten → "📁 Als Datei speichern")? Dann
 * traegt sie mindestens eine Sammlung des Kampagnenformats (CAMPAIGN_IMPORT_COLLECTIONS).
 * @param {Object} inhalt
 * @returns {boolean}
 */
function istKampagnenDatei(inhalt) {
    return CAMPAIGN_IMPORT_COLLECTIONS.some(pfad => {
        let knoten = inhalt;
        for (const schritt of pfad) {
            if (!knoten || typeof knoten !== 'object') return false;
            knoten = knoten[schritt];
        }
        return Array.isArray(knoten);
    });
}

/**
 * Das Namensfeld je Typ (R3): ohne nicht-leeren Text dort legt ein Eintrag seine Liste lahm
 * (gemessen: `name: null` bzw. 42 — die NPC-Liste sortiert mit `localeCompare` und zeigte nur
 * noch "Anzeigefehler"). Session-Preps haben kein Namensfeld (sie heissen nach ihrer Nummer).
 */
const REITER_NAMENSFELD = Object.freeze({
    characters: 'name',
    npcs: 'name',
    locations: 'name',
    quests: 'title',
    encounters: 'name',
    loot: 'name',
    spells: 'name',
    wiki: 'title',
    links: 'title',
    sessionPreps: null,
    calendarEvents: 'titel',
    factions: 'name'
});

/**
 * Textfelder je Typ, die eine Datei nicht als Zahl, Liste oder Objekt bringen darf (R3,
 * "umgekehrt"): die App schreibt sie nur als Text, und ihre Anzeige ruft Textmethoden darauf.
 * Gemessen bzw. am Code: `speed` des Helden (`speedVal.split` beim Bearbeiten, quick-actions.js
 * `char.speed.split`), `school` des Zaubers (render-spells.js `s.school.substring`), `content`
 * des Wiki-Eintrags (wiki-crud.js `e.content.toLowerCase`). Dazu jedes HTML-Feld
 * (HTML_FIELDS_BY_TYPE) — die App schreibt dort immer Markup als Text. Fehlt ein Feld oder ist
 * es null, ist das kein Fehler.
 */
const REITER_TEXTFELDER = Object.freeze({
    characters: Object.freeze(['speed']),
    spells: Object.freeze(['school']),
    wiki: Object.freeze(['content'])
});

/**
 * Listen- und Objektfelder je Typ und die Form, die die App dort liest (R3). Gemessen (Pruefer,
 * Runde 1, Sonden p3/p11, und eine eigene Formprobe je Typ, Feld und Form — Liste, Detail,
 * Bearbeiten, Dashboard, Suche): EINE Quest mit `tags: "eilig"` legte den ganzen Quest-Reiter
 * lahm ("⚠️ Anzeigefehler tags.map is not a function", auch nach dem Neuladen, ohne Strg+Z);
 * Gegenstaende des Helden als Objekt, `spellClasses` als Text, ein `null` in `rewardItems` ebenso
 * ihren Reiter, die uebrigen Felder hier Detail oder ✏️. Die Formen:
 *   liste          eine Liste (ihre Eintraege liest die App, wie sie kommen)
 *   ohneNull       eine Liste ohne leeren Eintrag — Tags sind Text (Truhe, Wiki) oder
 *                  `{name, color}`, Gegenstaende eine ID oder `{id, quantity}`; ein `null` darin
 *                  wirft (`t.color`, `item.id`)
 *   objekte        eine Liste von Objekten
 *   listeOderText  eine Liste oder ein Text — Sprachen alter Daten sind Text, und
 *                  encounters-crud.js/party-crud.js lesen beides (`.split(',')`)
 * Fehlt ein Feld oder ist es null, ist das kein Fehler (die App liest `|| []`). Nur Felder mit
 * gemessenem oder am Code belegtem Wurf: jede weitere Form lehnte Dateien ab, die die App liest
 * (`attributes`, `currency`, `spellSlots` in falscher Form warfen nirgends). Die Tags aller acht
 * Typen, die showEntitiesWithTag() (systems/tags.js) durchsucht, und die Verknuepfungen jedes
 * Typs, der sie traegt (REITER_VERWEIS_LINKS: `{type, id}`), stehen einheitlich drin.
 */
const REITER_FORMFELDER = Object.freeze({
    characters: Object.freeze({
        items: 'ohneNull',
        conditions: 'objekte',
        attacks: 'objekte',
        resistances: 'liste',
        immunities: 'liste',
        languages: 'listeOderText',
        tags: 'ohneNull',
        links: 'objekte'
    }),
    npcs: Object.freeze({
        quests: 'liste',
        info: 'liste',
        relationships: 'liste',
        triggers: 'objekte',
        dialogs: 'objekte',
        relations: 'objekte',
        tags: 'ohneNull',
        links: 'objekte'
    }),
    locations: Object.freeze({ tags: 'ohneNull', links: 'objekte' }),
    quests: Object.freeze({ rewardItems: 'objekte', tags: 'ohneNull', links: 'objekte' }),
    // `monsters` einer Gruppe: importEncounterMonsters() (encounter-calculator.js) liest
    // `m.count` je Eintrag (am Code)
    encounters: Object.freeze({
        languages: 'listeOderText',
        resistances: 'liste',
        immunities: 'liste',
        conditionImmunities: 'liste',
        monsters: 'objekte',
        tags: 'ohneNull',
        links: 'objekte'
    }),
    loot: Object.freeze({ tags: 'ohneNull', links: 'objekte' }),
    spells: Object.freeze({ spellClasses: 'liste', tags: 'ohneNull', links: 'objekte' }),
    wiki: Object.freeze({ tags: 'ohneNull', links: 'objekte' }),
    links: Object.freeze({}),
    sessionPreps: Object.freeze({ szenen: 'objekte', offeneFaeden: 'objekte', links: 'objekte' }),
    calendarEvents: Object.freeze({}),
    factions: Object.freeze({ rufHistorie: 'objekte', links: 'objekte' })
});

/**
 * Was an der Form der Listen- und Objektfelder eines Eintrags nicht stimmt (REITER_FORMFELDER),
 * sonst null.
 * @param {Object} eintrag
 * @param {string} dataType
 * @returns {string|null}
 */
function reiterFormFehler(eintrag, dataType) {
    const felder = Object.prototype.hasOwnProperty.call(REITER_FORMFELDER, dataType)
        ? REITER_FORMFELDER[dataType]
        : {};
    for (const [feld, form] of Object.entries(felder)) {
        if (!Object.prototype.hasOwnProperty.call(eintrag, feld)) continue;
        const wert = eintrag[feld];
        if (wert === null || (form === 'listeOderText' && typeof wert === 'string')) continue;
        if (!Array.isArray(wert)) {
            const soll = form === 'listeOderText' ? 'eine Liste oder ein Text' : 'eine Liste';
            return `„${feld}“ muss ${soll} sein, die Datei enthält ${reiterWertText(wert)}`;
        }
        if (form === 'ohneNull') {
            const i = wert.indexOf(null);
            if (i >= 0) {
                return `„${feld}“ darf keine leeren Einträge haben, an Stelle ${i + 1} enthält die Datei nichts`;
            }
        } else if (form === 'objekte') {
            const i = wert.findIndex(el => !el || typeof el !== 'object' || Array.isArray(el));
            if (i >= 0) {
                return (
                    `„${feld}“ muss eine Liste von Objekten sein, an Stelle ${i + 1} enthält die ` +
                    `Datei ${reiterWertText(wert[i])}`
                );
            }
        }
    }
    return null;
}

/**
 * Die Zahlenfelder eines Eintrags dieses Typs, als zerlegte Pfade AB dem Eintrag — genau die
 * Pfade der Datengrenze (DATENGRENZE_PFADE), die unter der Sammlung des Typs liegen. EINE Liste
 * fuer Grenze und Pruefung: was die Grenze still verwerfen wuerde ("viel" in `hpMax`), lehnt die
 * Pruefung vorher laut ab (R3). Die eigene `id` fehlt bewusst: sie zaehlt nur beim Ersetzen,
 * Hinzufuegen vergibt neue (R6, reiterIdFehler()).
 * @param {string} dataType
 * @returns {{name: string, liste: boolean}[][]}
 */
function reiterZahlenpfade(dataType) {
    const praefix = IO_DATA_PATH[dataType] || [dataType];
    return DATENGRENZE_PFADE.filter(
        teile =>
            teile.length > praefix.length &&
            praefix.every(
                (name, i) => teile[i].name === name && teile[i].liste === (i === praefix.length - 1)
            )
    )
        .map(teile => teile.slice(praefix.length))
        .filter(rest => !(rest.length === 1 && rest[0].name === 'id'));
}

/**
 * Ein Wert fuer eine Meldung — nie als Laufzeittext ("undefined", "[object Object]").
 * @param {*} wert
 * @returns {string}
 */
function reiterWertText(wert) {
    if (wert === null || wert === undefined) return 'nichts';
    if (Array.isArray(wert)) return 'eine Liste';
    if (typeof wert === 'object') return 'ein Objekt';
    if (typeof wert === 'string') {
        return wert.trim() === ''
            ? 'einen leeren Text'
            : `den Text „${wert.length > 40 ? wert.slice(0, 40) + '…' : wert}“`;
    }
    if (typeof wert === 'number') return `die Zahl ${String(wert)}`;
    return `den Wert ${String(wert)}`;
}

/**
 * Sucht im Eintrag den ersten Wert unter dem Pfad `teile`, den die Datengrenze verwerfen
 * wuerde (datengrenzeZahlwert() liefert undefined). Geht wie datengrenzeFeld(): `*` = jeder
 * Schluessel, `liste` = jedes Element; eine Liste, deren Element kein Objekt ist, wird dort
 * nicht weiter verfolgt (characters[].items[] traegt Zahlen ODER Objekte).
 * @param {*} knoten
 * @param {{name: string, liste: boolean}[]} teile
 * @param {number} stufe
 * @param {string} weg - Anzeigepfad bis hierher
 * @returns {string|null} die Meldung oder null
 */
function reiterZahlFehler(knoten, teile, stufe, weg) {
    if (!knoten || typeof knoten !== 'object') return null;
    const teil = teile[stufe];
    const letzte = stufe === teile.length - 1;
    const namen = teil.name === '*' ? Object.keys(knoten) : [teil.name];
    for (const name of namen) {
        if (!Object.prototype.hasOwnProperty.call(knoten, name)) continue;
        const wert = knoten[name];
        const hier = weg ? `${weg}.${name}` : name;
        let fehler = null;
        if (!letzte) {
            if (!teil.liste) fehler = reiterZahlFehler(wert, teile, stufe + 1, hier);
            else if (Array.isArray(wert)) {
                for (let i = 0; i < wert.length && !fehler; i++) {
                    fehler = reiterZahlFehler(wert[i], teile, stufe + 1, `${hier}[${i + 1}]`);
                }
            }
        } else if (teil.liste) {
            if (Array.isArray(wert)) {
                const i = wert.findIndex(e => datengrenzeZahlwert(e) === undefined);
                if (i >= 0) {
                    fehler = `„${hier}“ darf nur Zahlen enthalten, an Stelle ${i + 1} steht ${reiterWertText(wert[i])}`;
                }
            } else if (wert !== null && wert !== undefined) {
                fehler = `„${hier}“ muss eine Liste von Zahlen sein, die Datei enthält ${reiterWertText(wert)}`;
            }
        } else if (datengrenzeZahlwert(wert) === undefined) {
            fehler = `„${hier}“ muss eine Zahl sein, die Datei enthält ${reiterWertText(wert)}`;
        }
        if (fehler) return fehler;
    }
    return null;
}

/**
 * Was an EINEM Eintrag nicht stimmt (R3), sonst null: das Namensfeld, die Zahlenfelder
 * (reiterZahlenpfade()), die Listen- und Objektfelder (REITER_FORMFELDER), die Textfelder
 * (REITER_TEXTFELDER, HTML_FIELDS_BY_TYPE).
 * @param {Object} eintrag
 * @param {string} dataType
 * @returns {string|null}
 */
function reiterEintragFehler(eintrag, dataType) {
    const namensfeld = REITER_NAMENSFELD[dataType];
    if (namensfeld) {
        const name = eintrag[namensfeld];
        if (typeof name !== 'string' || name.trim() === '') {
            const was = namensfeld === 'name' ? 'der Name' : 'der Titel';
            return `${was} (Feld „${namensfeld}“) fehlt, ist leer oder kein Text`;
        }
    }
    for (const teile of reiterZahlenpfade(dataType)) {
        const fehler = reiterZahlFehler(eintrag, teile, 0, '');
        if (fehler) return fehler;
    }
    const formFehler = reiterFormFehler(eintrag, dataType);
    if (formFehler) return formFehler;
    const textfelder = [
        ...(REITER_TEXTFELDER[dataType] || []),
        ...(HTML_FIELDS_BY_TYPE[dataType] || [])
    ];
    for (const feld of textfelder) {
        const wert = eintrag[feld];
        if (wert !== null && wert !== undefined && typeof wert !== 'string') {
            return `„${feld}“ muss Text sein, die Datei enthält ${reiterWertText(wert)}`;
        }
    }
    return null;
}

/**
 * Prueft jeden Eintrag der Datei (R3) und lehnt beim ersten Fehler ab — mit der Nummer des
 * Eintrags und dem Feld, deutsch. Beruehrt nichts.
 * @param {Object[]} eintraege - die Eintraege der Datei, roh (vor der Datengrenze)
 * @param {string} dataType
 */
function pruefeReiterEintraege(eintraege, dataType) {
    if (!Object.prototype.hasOwnProperty.call(REITER_NAMENSFELD, dataType)) {
        throw reiterImportFehler('Dieser Bereich lässt sich nicht importieren');
    }
    for (let i = 0; i < eintraege.length; i++) {
        const fehler = reiterEintragFehler(eintraege[i], dataType);
        if (fehler) throw reiterImportFehler(`Eintrag ${i + 1} der Datei: ${fehler}`);
    }
}

/**
 * Warum "Ersetzen" diese Eintraege nicht uebernehmen darf (R6), sonst null. Ersetzen behaelt
 * die IDs der Datei; eine ID, die keine positive ganze Zahl ist ("abc", -1, 2.5), oder dieselbe
 * ID zweimal ergab gemessen Karten, die sich nicht oeffnen bzw. nur gemeinsam loeschen liessen.
 * Eine Zahl als Text ("7") gilt — die Datengrenze macht daraus 7. Hinzufuegen vergibt ohnehin
 * neue IDs und ist davon nicht betroffen.
 * @param {Object[]} eintraege - roh (vor der Datengrenze) oder vorbereitet
 * @returns {string|null}
 */
function reiterIdFehler(eintraege) {
    const gesehen = new Map();
    for (let i = 0; i < eintraege.length; i++) {
        const roh = eintraege[i] ? eintraege[i].id : undefined;
        const id = roh === undefined ? undefined : datengrenzeZahlwert(roh);
        if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
            let welche = `die ungültige ID ${String(roh)}`;
            if (roh === undefined || roh === null || roh === '') welche = 'keine ID';
            else if (typeof roh === 'object') welche = `statt einer ID ${reiterWertText(roh)}`;
            else if (typeof roh === 'string') welche = `die ungültige ID „${roh.slice(0, 40)}“`;
            return (
                `Ersetzen nicht möglich: Eintrag ${i + 1} der Datei hat ${welche} — eine ID muss ` +
                'eine positive ganze Zahl sein. „Hinzufügen“ vergibt neue IDs.'
            );
        }
        if (gesehen.has(id)) {
            return (
                `Ersetzen nicht möglich: die ID ${id} kommt in der Datei doppelt vor (Einträge ` +
                `${gesehen.get(id) + 1} und ${i + 1}). „Hinzufügen“ vergibt neue IDs.`
            );
        }
        gesehen.set(id, i);
    }
    return null;
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
 * Felder, die NUR der alte Reiter-Export erfand (IO_SCHEMA vor REITERIMPORT, gemessen; Vertrag
 * R4): das Datenmodell kennt sie nicht — die Klasse heisst `characterClass`, die RK
 * `armorClass`, die Attribute stehen unter `attributes`, das Bild unter `avatar` —, und ihre
 * Werte in alten Dateien sind Vorgaben (`ac: 10`, `str: 10`), keine echten. Aus einer Datei OHNE
 * Formatkennung werden sie verworfen und NIE auf ein Feld des Datenmodells abgebildet.
 * Liegengelassen wirkten sie trotzdem: initiative.js liest `ch.ac || ch.armorClass`, ein
 * `ac: 10` aus der Datei ueberstimmte dort die echte RK.
 */
const REITER_ALTFELDER = Object.freeze({
    characters: Object.freeze([
        'class',
        'ac',
        'hpTemp',
        'str',
        'dex',
        'con',
        'int',
        'wis',
        'cha',
        'avatarUrl'
    ]),
    npcs: Object.freeze(['avatarUrl']),
    locations: Object.freeze(['avatarUrl'])
});

/**
 * Bereitet die gepruefte Datei fuer das Fenster vor: die ID-Pruefung fuers Ersetzen (R6, auf
 * den ROHEN Eintraegen — die Grenze loescht eine ID "abc"), dieselbe Datengrenze wie jeder
 * andere Eingang nach D (SENKEN R4), bei einer alten Datei ohne Formatkennung die Warnung und
 * das Verwerfen der erfundenen Felder (R4) und die Bereinigung der HTML-Felder (SEC-01). Sonst
 * kommt jeder Eintrag GANZ durch (R4). Beruehrt nichts Globales.
 * @param {*} inhalt - von pruefeReiterImport() angenommene Datei
 * @param {string} dataType
 * @param {string} dateiname
 * @returns {ReiterImportVorbereitung}
 */
function bereiteReiterImportVor(inhalt, dataType, dateiname) {
    if (!IO_SCHEMA[dataType]) {
        throw reiterImportFehler('Dieser Bereich lässt sich nicht importieren');
    }
    const idFehler = reiterIdFehler(inhalt.data);
    const grenze = bereinigeDatengrenze(reiterImportWurzel(dataType, inhalt.data));
    const eintraege = (IO_DATA_PATH[dataType] || [dataType]).reduce(
        (knoten, schluessel) => (knoten ? knoten[schluessel] : undefined),
        grenze
    );
    /** @type {{text: string, warnung?: boolean}[]} */
    const hinweise = [];
    const format = inhalt._format;
    const altfelder = format === undefined ? REITER_ALTFELDER[dataType] || [] : [];
    const verworfen = new Set();
    const items = (Array.isArray(eintraege) ? eintraege : []).map(item => {
        const eintrag = { ...item };
        for (const feld of altfelder) {
            if (Object.prototype.hasOwnProperty.call(eintrag, feld)) {
                delete eintrag[feld];
                verworfen.add(feld);
            }
        }
        // SEC-01/D-01: HTML-tragende Felder vor der Anzeige bereinigen (Import-Grenze)
        return sanitizeImportedItem(dataType, eintrag);
    });
    if (format === undefined) {
        hinweise.push({
            text:
                '⚠️ Ältere Exportdatei ohne Formatkennung: frühere Exporte enthielten nicht alle ' +
                'Felder eines Eintrags — was in der Datei fehlt, bleibt leer.' +
                (verworfen.size > 0
                    ? ` Nicht übernommen, weil die App sie nicht kennt: ${[...verworfen].join(', ')}.`
                    : ''),
            warnung: true
        });
    } else if (format !== REITER_EXPORT_FORMAT) {
        hinweise.push({
            text: '⚠️ Unbekannte Formatkennung — die Datei stammt vermutlich aus einer anderen App-Version.',
            warnung: true
        });
    }
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
        hinweise,
        idFehler
    };
}

// VERWEISE (R5, R6). Ein Eintrag zeigt ueber IDs auf andere Eintraege — derselben Sammlung
// (NPC-Beziehung NPC→NPC, Wiki-Eltern, Verknuepfung desselben Typs, Encounter-Gruppe →
// Vorlage) oder einer anderen (Ort, Fraktion, Zauber, Gegenstand …). Einen zentralen Katalog
// gab es nicht: utils/validation.js kennt drei Felder, normalizeEntityIds() schreibt beim
// Umnummerieren gar keine Verweise um. Gemessen schrieb der Merge darum nur `id` neu, und
// alles andere zeigte still weiter auf die Zahlen der Quelle — in einer fremden Kampagne auf
// "Eiswueste" und "Hexe Morla", in derselben auf die Originale statt auf die Kopien.
//
// REITER_VERWEISE ist DER Katalog, je Sammlung, aus dem Datenmodell und den CRUD-Modulen
// gelesen (Fundstellen an den Eintraegen). Er traegt beide Richtungen: R5 bildet mit ihm die
// Verweise der importierten Eintraege ab, R6 liest mit ihm die Verweise ANDERER Bereiche auf
// den ersetzten Typ. Darum stehen hier auch Sammlungen ohne Reiter-Import (Shops, Initiative,
// Rechner-Vorlagen, Session-Notizen, Schnellreferenz) — als Quellen fuer R6. Bewusst nicht
// darunter: `wikiRecentlyViewed` ("Zuletzt angesehen"), eine blosse Liste von Wiki-IDs zur
// Navigation ohne Eintraege mit Feldern — nach dem Ersetzen zeigt sie den Eintrag, der die ID
// jetzt traegt, eine fehlende laesst die Anzeige fallen (RUECKSPRUNG Offen (5)).
// tests/unit/reiterimport-verweise.test.js haelt ihn gegen die Verweispfade der Datengrenze und
// gegen eine Saat aller Typen; die Rechner-Vorlagen haelt dort E4, weil die Grenze ihr Feld nicht
// kennt. Ein neues Verweisfeld im Datenmodell gehoert hier hinein.

/** Ziel eines Verweises, dessen Typ die App nicht kennt (z. B. `links[].type` aus einer Datei). */
const REITER_ZIEL_UNBEKANNT = '?';

/** Typwort einer Verknuepfung (`links[].type`, `[[typ:id:name]]`) -> Sammlung. Die App schreibt
 *  die Mehrzahl (systems/entity-links.js), getEntityByTypeAndId() nimmt auch die Einzahl. */
const REITER_LINKTYPEN = Object.freeze({
    npc: 'npcs',
    npcs: 'npcs',
    character: 'characters',
    characters: 'characters',
    location: 'locations',
    locations: 'locations',
    quest: 'quests',
    quests: 'quests',
    encounter: 'encounters',
    encounters: 'encounters',
    spell: 'spells',
    spells: 'spells',
    loot: 'loot',
    item: 'loot',
    items: 'loot',
    wiki: 'wiki',
    faction: 'factions',
    factions: 'factions'
});

/** Namen der Bereiche ohne Reiter-Import (die anderen nennt REITER_TYPNAMEN). */
const REITER_WEITERE_BEREICHE = Object.freeze({
    filters: 'Filter',
    storyArcs: 'Story-Arcs',
    shops: 'Shops',
    initiative: 'Initiative',
    monsterFavorites: 'Rechner-Vorlagen',
    quickRefCustom: 'Schnellreferenz'
});

/**
 * Wo eine Sammlung liegt, die nicht direkt unter D steht: die Pfade der Reiter-Typen
 * (IO_DATA_PATH — EINE Quelle, ein neuer verschachtelter Typ ist hier sofort Quelle fuer R6)
 * und dazu die Initiative, die keinen Reiter-Import hat.
 * @type {Readonly<Record<string, string[]>>}
 */
const REITER_VERWEIS_PFADE = Object.freeze({
    ...IO_DATA_PATH,
    initiative: ['initiative', 'combatants']
});

/**
 * @param {*} typ
 * @returns {string}
 */
function reiterLinkZiel(typ) {
    return typeof typ === 'string' && Object.prototype.hasOwnProperty.call(REITER_LINKTYPEN, typ)
        ? REITER_LINKTYPEN[typ]
        : REITER_ZIEL_UNBEKANNT;
}

/**
 * Der deutsche Name eines Bereichs in der Mehrzahl — nie sein Schluessel.
 * @param {string} ziel
 * @returns {string}
 */
function reiterZielName(ziel) {
    if (Object.prototype.hasOwnProperty.call(REITER_TYPNAMEN, ziel)) return reiterTypName(ziel, 2);
    if (Object.prototype.hasOwnProperty.call(REITER_WEITERE_BEREICHE, ziel)) {
        return REITER_WEITERE_BEREICHE[ziel];
    }
    return 'unbekannter Bereich';
}

/** Verknuepfungen (systems/entity-links.js addEntityLink(): `{type, id}`, beidseitig). Jeder
 *  Typ kann sie tragen — auch als ZIEL einer Verknuepfung. */
const REITER_VERWEIS_LINKS = Object.freeze({
    feld: 'links',
    art: 'typisiert',
    typFeld: 'type',
    idFeld: 'id',
    zielVon: reiterLinkZiel,
    wort: ziel => `Verknüpfung → ${reiterZielName(ziel)}`
});

/** Das alte Beziehungsmodell (systems/undo.js saveRelationship(): `relationships[]` mit
 *  `targetType` 'character'/'npc'). Kein Knopf erreicht es mehr, alte Daten tragen es aber;
 *  Text-Eintraege (`npcs[].relationships` des Formulars ist eine Liste von Namen) sind kein
 *  Verweis. */
const REITER_VERWEIS_BEZIEHUNGEN_ALT = Object.freeze({
    feld: 'relationships',
    art: 'typisiert',
    typFeld: 'targetType',
    idFeld: 'targetId',
    zielVon: t => (t === 'npc' ? 'npcs' : t === 'character' ? 'characters' : null),
    wort: ziel => `Beziehung → ${reiterZielName(ziel)}`
});

/**
 * @typedef {Object} ReiterVerweisFeld
 * @property {string} feld - Schluessel im Eintrag
 * @property {'wert'|'liste'|'typisiert'} art - `wert`: der Wert IST die ID; `liste`: Liste von
 *   IDs oder von Objekten, deren `idFeld` die ID ist; `typisiert`: Liste von Objekten, deren
 *   `typFeld` das Ziel nennt
 * @property {string} [ziel] - Sammlung, auf die `wert` und `liste` zeigen
 * @property {string} [idFeld] - Feld der ID im Objekt (Vorgabe `id`)
 * @property {string} [typFeld]
 * @property {(typWert: *) => string|null} [zielVon] - Typwert -> Sammlung; null: kein Verweis
 *   (die Beziehung zu "Die Gruppe" traegt `targetId: 0`)
 * @property {'nullen'} [leeren] - ein geleerter Listeneintrag bleibt mit ID null stehen, statt
 *   zu verschwinden (sein uebriger Inhalt ist Arbeit des Nutzers: Text des offenen Fadens,
 *   Monster einer Gruppe)
 * @property {string|((ziel: string) => string)} wort - wie die Vorschau den Verweis nennt
 */

/**
 * DER Verweiskatalog (siehe oben).
 * @type {Readonly<Record<string, ReadonlyArray<ReiterVerweisFeld>>>}
 */
const REITER_VERWEISE = Object.freeze({
    // features/party/party-render.js: spells[] sind Zauber-IDs, items[] Gegenstaende ({id,
    // quantity}, alt: reine IDs — render-loot.js wandelt sie)
    characters: Object.freeze([
        { feld: 'spells', art: 'liste', ziel: 'spells', wort: 'Zauber' },
        { feld: 'items', art: 'liste', ziel: 'loot', wort: 'Gegenstände' },
        REITER_VERWEIS_BEZIEHUNGEN_ALT,
        REITER_VERWEIS_LINKS
    ]),
    // features/npcs/npc-crud.js saveNPC(), npc-render.js addRelation() ('npcs'/'characters';
    // 'party' ist "Die Gruppe", kein Eintrag)
    npcs: Object.freeze([
        { feld: 'locationId', art: 'wert', ziel: 'locations', wort: 'Ort' },
        { feld: 'factionId', art: 'wert', ziel: 'factions', wort: 'Fraktion' },
        { feld: 'filterId', art: 'wert', ziel: 'filters', wort: 'Filter' },
        {
            feld: 'relations',
            art: 'typisiert',
            typFeld: 'targetType',
            idFeld: 'targetId',
            zielVon: t => (t === 'npcs' || t === 'characters' ? t : null),
            wort: ziel => `Beziehung → ${reiterZielName(ziel)}`
        },
        REITER_VERWEIS_BEZIEHUNGEN_ALT,
        REITER_VERWEIS_LINKS
    ]),
    // features/locations/locations-crud.js (kein Eltern-Ort im Datenmodell)
    locations: Object.freeze([
        { feld: 'filterId', art: 'wert', ziel: 'filters', wort: 'Filter' },
        REITER_VERWEIS_LINKS
    ]),
    // features/quests/quests-crud.js saveQuest(); das "Ziel" ist ein ZIELORT
    // (populateQuestSelects(), quests-render.js renderEntityLink('locations', q.targetId))
    quests: Object.freeze([
        { feld: 'giverId', art: 'wert', ziel: 'npcs', wort: 'Auftraggeber' },
        { feld: 'locationId', art: 'wert', ziel: 'locations', wort: 'Ort' },
        { feld: 'targetId', art: 'wert', ziel: 'locations', wort: 'Zielort' },
        { feld: 'rewardItems', art: 'liste', ziel: 'loot', wort: 'Belohnungs-Gegenstand' },
        REITER_VERWEIS_LINKS
    ]),
    // features/encounter-calculator.js: eine im Rechner gespeicherte Gruppe nennt je Monster
    // die Vorlage (`monsters[].encounterId`, RECHNER) — ein Verweis INNERHALB des Typs
    encounters: Object.freeze([
        {
            feld: 'monsters',
            art: 'liste',
            ziel: 'encounters',
            idFeld: 'encounterId',
            leeren: 'nullen',
            wort: 'Vorlage eines Gruppen-Monsters'
        },
        REITER_VERWEIS_LINKS
    ]),
    loot: Object.freeze([REITER_VERWEIS_LINKS]),
    spells: Object.freeze([REITER_VERWEIS_LINKS]),
    // features/wiki/wiki-crud.js: parentId
    wiki: Object.freeze([
        { feld: 'parentId', art: 'wert', ziel: 'wiki', wort: 'Übergeordneter Eintrag' },
        REITER_VERWEIS_LINKS
    ]),
    links: Object.freeze([]),
    // features/session-prep/session-prep-crud.js: offene Faeden aus Quests und Story-Arcs
    sessionPreps: Object.freeze([
        {
            feld: 'offeneFaeden',
            art: 'typisiert',
            typFeld: 'quelleTyp',
            idFeld: 'quelleId',
            zielVon: t => (t === 'quest' ? 'quests' : t === 'storyArc' ? 'storyArcs' : null),
            leeren: 'nullen',
            wort: ziel => `Offener Faden → ${reiterZielName(ziel)}`
        },
        REITER_VERWEIS_LINKS
    ]),
    // features/timeline/timeline-render.js: ein uebernommener Vorschlag nennt seine
    // Session-Notiz (`quelleId`, typ 'session')
    calendarEvents: Object.freeze([
        { feld: 'quelleId', art: 'wert', ziel: 'sessionNotes', wort: 'Quelle' }
    ]),
    // features/fraktionen/fraktionen-crud.js saveFraktion()
    factions: Object.freeze([
        { feld: 'sitzOrtId', art: 'wert', ziel: 'locations', wort: 'Sitz' },
        { feld: 'mitgliederNpcIds', art: 'liste', ziel: 'npcs', wort: 'Mitglieder' },
        REITER_VERWEIS_LINKS
    ]),
    // Nur Quellen fuer R6 (kein Reiter-Import):
    // features/shops/shops-core.js
    shops: Object.freeze([
        { feld: 'npcId', art: 'wert', ziel: 'npcs', wort: 'Händler' },
        { feld: 'locationId', art: 'wert', ziel: 'locations', wort: 'Ort' }
    ]),
    // features/encounter-calculator.js "⚔️ Zur Initiative": der Kaempfer nennt seine Vorlage
    initiative: Object.freeze([
        { feld: 'encounterId', art: 'wert', ziel: 'encounters', wort: 'Vorlage' }
    ]),
    // features/encounter-calculator.js saveMonsterFavorite(): "⭐ Vorlage speichern" legt die
    // Monster der Rechnerliste samt Vorlage ab, "⚔️ Zur Initiative" liest ueber sie RK und TP.
    // Die Datengrenze kennt das Feld nicht (K1 sieht es nicht; E4 in
    // tests/unit/reiterimport-verweise.test.js haelt es fest).
    monsterFavorites: Object.freeze([
        {
            feld: 'monsters',
            art: 'liste',
            ziel: 'encounters',
            idFeld: 'encounterId',
            leeren: 'nullen',
            wort: 'Vorlage eines Monsters'
        }
    ]),
    // features/sessions/sessions.js
    sessionNotes: Object.freeze([
        { feld: 'arcId', art: 'wert', ziel: 'storyArcs', wort: 'Story-Arc' }
    ]),
    // systems/spellslots/quick-reference.js: nur Text-Verknuepfungen
    quickRefCustom: Object.freeze([])
});

/**
 * Text-Verknuepfungen `[[typ:id:name]]` (systems/entity-links.js, "🔗 Entity-Link"):
 * parseEntityLinks() macht sie zu Spruengen auf `typ`/`id`. Dasselbe Muster wie dort.
 */
const REITER_TEXTVERWEIS = /\[\[(\w+):(\d+):([^\]]+)\]\]/g;

/** So tief folgt die Suche nach Text-Verknuepfungen verschachtelten Werten. */
const REITER_TEXTVERWEIS_TIEFE = 64;

/**
 * Eine ID als Zahl — positive ganze Zahl oder Zahltext ("7"), sonst null.
 * @param {*} wert
 * @returns {number|null}
 */
function reiterIdZahl(wert) {
    const zahl = typeof wert === 'string' && /^\s*\d+\s*$/.test(wert) ? Number(wert) : wert;
    return typeof zahl === 'number' && Number.isSafeInteger(zahl) && zahl > 0 ? zahl : null;
}

/**
 * @param {ReiterVerweisFeld} v
 * @param {string} ziel
 * @returns {string}
 */
function reiterVerweisWort(v, ziel) {
    return typeof v.wort === 'function' ? v.wort(ziel) : v.wort;
}

/**
 * Bildet EINEN Listeneintrag ab. Gibt den Eintrag selbst zurueck, wenn er bleibt, `undefined`,
 * wenn er entfaellt.
 * @param {*} el
 * @param {string|null} ziel - null: kein Verweis
 * @param {string} idFeld
 * @param {ReiterVerweisFeld} v
 * @param {(ziel: string, id: number|null, wort: string) => number|null} abbilden
 * @returns {*}
 */
function reiterListeneintragAbbilden(el, ziel, idFeld, v, abbilden) {
    const objekt = !!el && typeof el === 'object' && !Array.isArray(el);
    const roh = objekt ? el[idFeld] : el;
    if (ziel === null || !roh || (!objekt && typeof roh === 'object')) return el;
    const id = reiterIdZahl(roh);
    const neu = abbilden(ziel, id, reiterVerweisWort(v, ziel));
    if (neu === roh) return el;
    if (neu === null && v.leeren !== 'nullen') return undefined;
    return objekt ? { ...el, [idFeld]: neu } : neu;
}

/**
 * Ersetzt Text-Verknuepfungen in allen Texten eines Werts, in jeder Tiefe. Eine geleerte wird
 * zu ihrem Namen (der sichtbare Text bleibt, der Sprung entfaellt). Gibt den Wert selbst
 * zurueck, wenn sich nichts aendert.
 * @param {*} wert
 * @param {(ziel: string, id: number|null, wort: string) => number|null} abbilden
 * @param {number} tiefe
 * @returns {*}
 */
function reiterTextverweiseAbbilden(wert, abbilden, tiefe) {
    if (typeof wert === 'string') {
        if (!wert.includes('[[')) return wert;
        return wert.replace(REITER_TEXTVERWEIS, (ganz, typWort, idText, name) => {
            const ziel = reiterLinkZiel(typWort);
            const id = reiterIdZahl(idText);
            const neu = abbilden(ziel, id, `Text-Verknüpfung → ${reiterZielName(ziel)}`);
            if (neu === id) return ganz;
            return neu === null ? name : `[[${typWort}:${neu}:${name}]]`;
        });
    }
    if (!wert || typeof wert !== 'object' || tiefe >= REITER_TEXTVERWEIS_TIEFE) return wert;
    let kopie = wert;
    for (const schluessel of Object.keys(wert)) {
        const neu = reiterTextverweiseAbbilden(wert[schluessel], abbilden, tiefe + 1);
        if (neu === wert[schluessel]) continue;
        if (kopie === wert) kopie = Array.isArray(wert) ? wert.slice() : { ...wert };
        kopie[schluessel] = neu;
    }
    return kopie;
}

/**
 * Bildet jeden Verweis eines Eintrags ab (Katalog und Text-Verknuepfungen): `abbilden(ziel,
 * id, wort)` gibt die ID zurueck, auf die er danach zeigt, oder null — dann ist er geleert
 * (Feld null, Listeneintrag entfernt bzw. mit ID null, Text-Verknuepfung nur noch Name).
 * Veraendert NIE den Eintrag selbst: geaenderte Teile werden kopiert, unveraenderte geteilt.
 * Mit einem `abbilden`, das die ID zurueckgibt, ist es ein reines Lesen (R5-Vorschau, R6).
 * Ein leerer Wert (null, 0, '') ist kein Verweis.
 * @param {string} typ - Sammlung des Eintrags (Schluessel in REITER_VERWEISE)
 * @param {*} eintrag
 * @param {(ziel: string, id: number|null, wort: string) => number|null} abbilden
 * @returns {*}
 */
function reiterVerweiseAbbilden(typ, eintrag, abbilden) {
    if (!eintrag || typeof eintrag !== 'object') return eintrag;
    let neu = eintrag;
    const setze = (feld, wert) => {
        if (neu === eintrag) neu = { ...eintrag };
        neu[feld] = wert;
    };
    const felder = Object.prototype.hasOwnProperty.call(REITER_VERWEISE, typ)
        ? REITER_VERWEISE[typ]
        : [];
    for (const v of felder) {
        if (!Object.prototype.hasOwnProperty.call(eintrag, v.feld)) continue;
        const wert = eintrag[v.feld];
        if (v.art === 'wert') {
            if (!wert || typeof wert === 'object') continue;
            const ziel = /** @type {string} */ (v.ziel);
            const ergebnis = abbilden(ziel, reiterIdZahl(wert), reiterVerweisWort(v, ziel));
            if (ergebnis !== wert) setze(v.feld, ergebnis);
            continue;
        }
        if (!Array.isArray(wert)) continue;
        let geaendert = false;
        const liste = [];
        for (const el of wert) {
            let ziel = v.ziel || null;
            let idFeld = v.idFeld || 'id';
            if (v.art === 'typisiert') {
                if (!el || typeof el !== 'object') {
                    liste.push(el);
                    continue;
                }
                ziel = v.zielVon(el[v.typFeld]);
                idFeld = /** @type {string} */ (v.idFeld);
            }
            const ergebnis = reiterListeneintragAbbilden(el, ziel, idFeld, v, abbilden);
            if (ergebnis !== el) geaendert = true;
            if (ergebnis !== undefined) liste.push(ergebnis);
        }
        if (geaendert) setze(v.feld, liste);
    }
    return reiterTextverweiseAbbilden(neu, abbilden, 0);
}

/**
 * Die IDs, die in den Eintraegen GENAU EINMAL vorkommen (als Zahl). Nur auf sie kann ein
 * Verweis innerhalb der Datei eindeutig umgeschrieben werden; eine doppelte ID ist
 * mehrdeutig, und eine ungueltige hat die Datengrenze schon geloescht.
 * @param {Object[]} items
 * @returns {Set<number>}
 */
function reiterEindeutigeIds(items) {
    const anzahl = new Map();
    for (const item of items) {
        const id = reiterIdZahl(item && item.id);
        if (id !== null) anzahl.set(id, (anzahl.get(id) || 0) + 1);
    }
    return new Set([...anzahl].filter(([, n]) => n === 1).map(([id]) => id));
}

/**
 * Was "Hinzufügen" mit den Verweisen der Datei tut (R5), gezaehlt fuer die Vorschau — genau
 * die Regel von reiterHinzufuegen(): innerhalb des Typs mit eindeutigem Ziel in der Datei →
 * umgeschrieben (`intern`); innerhalb des Typs ohne solches Ziel → geleert (`haengend`, z. B.
 * eine Beziehung auf einen in der Quelle geloeschten NPC); auf einen anderen Bereich → geleert
 * (`fremd`, je Feld).
 * @param {string} typ
 * @param {Object[]} items
 * @returns {{intern: number, haengend: number, fremd: {wort: string, n: number}[]}}
 */
function reiterHinzufuegenVerweise(typ, items) {
    const eindeutig = reiterEindeutigeIds(items);
    /** @type {Map<string, number>} */
    const fremd = new Map();
    let intern = 0;
    let haengend = 0;
    for (const item of items) {
        reiterVerweiseAbbilden(typ, item, (ziel, id, wort) => {
            if (ziel !== typ) fremd.set(wort, (fremd.get(wort) || 0) + 1);
            else if (id !== null && eindeutig.has(id)) intern++;
            else haengend++;
            return id;
        });
    }
    return { intern, haengend, fremd: [...fremd].map(([wort, n]) => ({ wort, n })) };
}

/**
 * "Hinzufügen" (R5): jeder Eintrag bekommt eine neue ID (nextId(), als Stapel); ein Verweis
 * INNERHALB des Typs zeigt danach auf die neue ID seines Ziels in der Datei — hat er dort kein
 * eindeutiges Ziel, wird er geleert, statt mit seiner alten Zahl auf wen auch immer zu zeigen,
 * der in dieser Kampagne so heisst. Jeder Verweis auf einen ANDEREN Bereich wird geleert: die
 * Datei weiss nicht, welche Eintraege dort gemeint sind (Entscheidung des Nutzers, 29.10.).
 * Die Eintraege der Vorbereitung bleiben unveraendert.
 * @param {string} typ
 * @param {Object[]} items
 * @returns {Object[]}
 */
function reiterHinzufuegen(typ, items) {
    const eindeutig = reiterEindeutigeIds(items);
    const neueIds = items.map(() => nextId(typ));
    /** @type {Map<number, number>} */
    const abbildung = new Map();
    items.forEach((item, i) => {
        const id = reiterIdZahl(item && item.id);
        if (id !== null && eindeutig.has(id)) abbildung.set(id, neueIds[i]);
    });
    return items.map((item, i) => ({
        ...reiterVerweiseAbbilden(typ, item, (ziel, id) =>
            ziel === typ && id !== null && abbildung.has(id)
                ? /** @type {number} */ (abbildung.get(id))
                : null
        ),
        id: neueIds[i]
    }));
}

/**
 * Eine Sammlung aus D (auch verschachtelt, REITER_VERWEIS_PFADE).
 * @param {string} schluessel
 * @returns {*}
 */
function reiterSammlung(schluessel) {
    const pfad = REITER_VERWEIS_PFADE[schluessel] || [schluessel];
    return pfad.reduce(
        (knoten, schritt) => (knoten && typeof knoten === 'object' ? knoten[schritt] : undefined),
        window.D
    );
}

/**
 * Die Verweise ANDERER Bereiche auf den Typ, der ersetzt wird (R6): wie viele danach ins Leere
 * zeigen (ihre ID steht nicht in der Datei), je Bereich mit den Feldern, und wie viele auf einen
 * Eintrag der Datei mit derselben ID — Ersetzen behaelt die IDs der Datei, ein solcher Verweis
 * zeigt danach auf DEN Eintrag, der in der Datei so heisst. Liest D, aendert nichts.
 * @param {string} typ
 * @param {Object[]} items
 * @returns {{insLeere: number, gleicheId: number, quellen: {name: string, worte: string[], n: number}[]}}
 */
function reiterVerweiseNachErsetzen(typ, items) {
    const bleibt = new Set(
        items.map(item => reiterIdZahl(item && item.id)).filter(id => id !== null)
    );
    const quellen = [];
    let insLeere = 0;
    let gleicheId = 0;
    for (const quelle of Object.keys(REITER_VERWEISE)) {
        if (quelle === typ) continue;
        const sammlung = reiterSammlung(quelle);
        if (!Array.isArray(sammlung)) continue;
        /** @type {Set<string>} */
        const worte = new Set();
        let n = 0;
        for (const eintrag of sammlung) {
            reiterVerweiseAbbilden(quelle, eintrag, (ziel, id, wort) => {
                if (ziel === typ && id !== null) {
                    if (bleibt.has(id)) gleicheId++;
                    else {
                        n++;
                        worte.add(wort);
                    }
                }
                return id;
            });
        }
        if (n > 0) {
            quellen.push({ name: reiterZielName(quelle), worte: [...worte], n });
            insLeere += n;
        }
    }
    return { insLeere, gleicheId, quellen };
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
    const moduszeilen =
        modus === 'replace'
            ? ersetzenVorschauZeilen(bereit, vorhanden)
            : hinzufuegenVorschauZeilen(bereit, vorhanden);
    return [
        { text: `Typ: ${reiterTypName(bereit.dataType, 2)}` },
        { text: `Einträge: ${n}` },
        { text: `Kampagne: ${bereit.kampagne}` },
        { text: `Export-Datum: ${bereit.exportDatum}` },
        ...moduszeilen,
        ...bereit.hinweise
    ];
}

/**
 * Die Zeilen der Vorschau, die nur fuer "Hinzufügen" gelten (R5): wie viele Eintraege mit neuer
 * ID dazukommen, und VOR dem Import, was mit ihren Verweisen geschieht — dieselbe Regel wie das
 * Schreiben (reiterHinzufuegenVerweise()). Welche Verweise auf andere Bereiche geleert werden,
 * steht je Feld da; die erste Zeile dazu nennt die Summe.
 * @param {ReiterImportVorbereitung} bereit
 * @param {number} vorhanden - Zahl der Eintraege, die heute in D stehen
 * @returns {{text: string, warnung?: boolean}[]}
 */
function hinzufuegenVorschauZeilen(bereit, vorhanden) {
    const n = bereit.items.length;
    const name = reiterTypName(bereit.dataType, 2);
    const { intern, haengend, fremd } = reiterHinzufuegenVerweise(bereit.dataType, bereit.items);
    /** @type {{text: string, warnung?: boolean}[]} */
    const zeilen = [
        {
            text:
                `Hinzufügen: ${n} ` +
                (n === 1 ? 'Eintrag kommt' : 'Einträge kommen') +
                ` mit neuer ID zu den vorhandenen (${vorhanden}) dazu`
        }
    ];
    if (intern > 0) {
        zeilen.push({
            text:
                (intern === 1 ? '1 Verweis' : `${intern} Verweise`) +
                ` innerhalb der ${name} ` +
                (intern === 1 ? 'zeigt' : 'zeigen') +
                ' danach auf die mitimportierten Einträge'
        });
    }
    const summe = fremd.reduce((s, f) => s + f.n, 0);
    if (summe > 0) {
        zeilen.push({
            text:
                '⚠️ ' +
                (summe === 1
                    ? '1 Verweis auf einen anderen Bereich wird'
                    : `${summe} Verweise auf andere Bereiche werden`) +
                ' geleert — die Datei weiß nicht, welche Einträge dort gemeint sind:',
            warnung: true
        });
        for (const f of fremd) zeilen.push({ text: `– ${f.wort}: ${f.n}`, warnung: true });
    }
    if (haengend > 0) {
        zeilen.push({
            text:
                '⚠️ ' +
                (haengend === 1 ? '1 Verweis' : `${haengend} Verweise`) +
                ` innerhalb der ${name} ` +
                (haengend === 1 ? 'zeigt' : 'zeigen') +
                ' auf einen Eintrag, der nicht (eindeutig) in der Datei steht — ' +
                (haengend === 1 ? 'er wird' : 'sie werden') +
                ' geleert',
            warnung: true
        });
    }
    return zeilen;
}

/**
 * Die Zeilen der Vorschau, die nur fuer "Ersetzen" gelten (R6): wie viele vorhandene Eintraege
 * ersetzt werden und wie viele Verweise anderer Bereiche danach ins Leere zeigen
 * (reiterVerweiseNachErsetzen(), je Bereich mit den Feldern) — oder, bei ungueltigen bzw.
 * doppelten IDs in der Datei, dass Ersetzen nicht geht (executeImport() lehnt dann ab).
 * @param {ReiterImportVorbereitung} bereit
 * @param {number} vorhanden - Zahl der Eintraege, die heute in D stehen
 * @returns {{text: string, warnung?: boolean}[]}
 */
function ersetzenVorschauZeilen(bereit, vorhanden) {
    const idFehler = ersetzenIdFehler(bereit);
    if (idFehler) return [{ text: '⚠️ ' + idFehler, warnung: true }];
    /** @type {{text: string, warnung?: boolean}[]} */
    const zeilen = [
        {
            text:
                `Ersetzen: ${vorhanden} ` +
                (vorhanden === 1 ? 'vorhandener Eintrag wird' : 'vorhandene Einträge werden') +
                ' durch die Datei ersetzt; vorher wird eine Sicherheitskopie angelegt',
            warnung: true
        }
    ];
    const { insLeere, gleicheId, quellen } = reiterVerweiseNachErsetzen(
        bereit.dataType,
        bereit.items
    );
    if (insLeere > 0) {
        zeilen.push({
            text:
                '⚠️ Danach ' +
                (insLeere === 1 ? 'zeigt 1 Verweis' : `zeigen ${insLeere} Verweise`) +
                ' anderer Bereiche ins Leere (die Datei enthält ihr Ziel nicht):',
            warnung: true
        });
        for (const q of quellen) {
            zeilen.push({ text: `– ${q.name} (${q.worte.join(', ')}): ${q.n}`, warnung: true });
        }
    } else {
        zeilen.push({ text: 'Kein Verweis anderer Bereiche zeigt danach ins Leere' });
    }
    if (gleicheId > 0) {
        zeilen.push({
            text:
                (gleicheId === 1 ? '1 Verweis' : `${gleicheId} Verweise`) +
                ' anderer Bereiche ' +
                (gleicheId === 1 ? 'zeigt' : 'zeigen') +
                ' danach auf den Eintrag der Datei mit derselben ID'
        });
    }
    return zeilen;
}

/**
 * Warum "Ersetzen" mit dieser Vorbereitung nicht geht, sonst null (R6). Die Vorbereitung
 * bringt das Urteil ueber die ROHEN IDs mit; fehlt es, werden die vorbereiteten Eintraege
 * geprueft.
 * @param {ReiterImportVorbereitung} bereit
 * @returns {string|null}
 */
function ersetzenIdFehler(bereit) {
    return bereit.idFehler !== undefined ? bereit.idFehler : reiterIdFehler(bereit.items);
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
 * Die Bearbeiten-Formulare je Typ (R7): das Feld, das die Bearbeiten-ID traegt, die Funktion,
 * die das Formular leert (und ein Klappformular bzw. die Link-Karte zuklappt) — eine
 * AUFGESCHOBENE Referenz wie in KLAPPFORMULAR_BEARBEITEN (systems/spellslots/navigation.js):
 * der Bezeichner steht im Quelltext, aufgeloest wird erst beim Import — und das Fenster des
 * Formulars, falls es eines hat. Gemessen (Kritik K3): ✏️ Thorin → Ersetzen (id 1 ist jetzt
 * "Mira") → "Speichern" schrieb Thorin ueber Mira, "Charakter aktualisiert"; der Schutz fuer
 * verwaiste IDs greift nicht, die ID gehoert jetzt einem ANDEREN Eintrag. Ebenso Encounter,
 * Quest (✏️ → ✕ laesst die ID liegen) und die Link-Karte.
 * Session-Prep und Fraktion bauen ihr Fenster beim Oeffnen neu bzw. setzen jedes Feld — dort
 * genuegt es, die liegengebliebene ID zu loeschen. Kalender-Ereignisse haben kein Bearbeiten.
 */
const REITER_BEARBEITEN = Object.freeze({
    characters: [{ id: 'edit-char-id', leeren: () => cancelCharEdit }],
    npcs: [{ id: 'edit-npc-id', leeren: () => clearNPCForm, fenster: 'npc-modal' }],
    locations: [{ id: 'edit-loc-id', leeren: () => clearLocationForm, fenster: 'location-modal' }],
    quests: [{ id: 'edit-quest-id', leeren: () => clearQuestForm, fenster: 'quest-modal' }],
    encounters: [{ id: 'edit-enc-id', leeren: () => cancelEncEdit }],
    loot: [{ id: 'edit-loot-id', leeren: () => clearLootForm, fenster: 'loot-modal' }],
    spells: [{ id: 'edit-spell-id', leeren: () => clearSpellForm, fenster: 'spell-modal' }],
    wiki: [{ id: 'edit-wiki-id', leeren: () => hideWikiForm }],
    links: [{ id: 'edit-link-id', leeren: () => cancelLinkEdit }],
    sessionPreps: [{ id: 'prep-edit-id', leeren: null, fenster: 'session-prep-modal' }],
    calendarEvents: [],
    factions: [{ id: 'edit-fraktion-id', leeren: null, fenster: 'fraktionen-modal' }]
});

/**
 * R7: verwirft ein Bearbeiten des Typs — offen oder liegengeblieben —, dessen ID nach dem
 * Import einem importierten Eintrag gehoert. Nach dem ERSETZEN ist das jedes (`neueIds` fehlt):
 * jede ID kann jetzt einem anderen Eintrag gehoeren. Nach dem HINZUFUEGEN nur eines, dessen ID
 * unter den neu vergebenen steht (`neueIds`): jeder vorhandene Eintrag bleibt unter seiner ID,
 * ein Bearbeiten daran ueberschreibt beim Speichern keinen importierten Eintrag, und Leeren
 * wuerde nur Eingaben wegwerfen. Getroffen werden kann dort nur die liegengebliebene ID eines
 * geloeschten Eintrags (deleteChar() leert das Party-Klappformular nicht), die nextId() wieder
 * vergibt: ohne Zaehler fuer den Typ (core/data.js legt `_nextId` leer an) ist max(ID) + 1 die
 * ID eines geloeschten hoechsten Eintrags. Darum wird die ID selbst verglichen, statt sich auf
 * eine Annahme ueber nextId() zu verlassen.
 * Nur ein Formular MIT Bearbeiten-ID: ein Anlege-Entwurf ist Arbeit des Nutzers und legt beim
 * Speichern ohnehin einen neuen Eintrag an (ABBRUCH R2). Die ID wird in jedem Fall geloescht,
 * auch wenn die Leeren-Funktion fehlt (Einzeltest) oder scheitert: ohne ID legt "Speichern" neu
 * an, statt zu ueberschreiben.
 * @param {string} typ
 * @param {Set<number>} [neueIds] - nur beim Hinzufuegen: die IDs der importierten Eintraege
 */
function reiterBearbeitenVerwerfen(typ, neueIds) {
    const formulare = Object.prototype.hasOwnProperty.call(REITER_BEARBEITEN, typ)
        ? REITER_BEARBEITEN[typ]
        : [];
    for (const formular of formulare) {
        // getElementById statt $(): ein Formular, das noch nie offen war (Session-Prep baut
        // seins erst beim Oeffnen), ist kein Fehler
        const feld = /** @type {HTMLInputElement|null} */ (document.getElementById(formular.id));
        if (!feld || !feld.value) continue;
        if (neueIds) {
            const id = reiterIdZahl(feld.value);
            if (id === null || !neueIds.has(id)) continue;
        }
        let leeren = null;
        try {
            leeren = formular.leeren ? formular.leeren() : null;
        } catch {
            // Modul nicht geladen (Einzeltest) — die ID wird unten trotzdem geloescht.
        }
        try {
            if (typeof leeren === 'function') leeren();
        } catch (err) {
            if (window.ErrorHandler) window.ErrorHandler.log('Import', err, 'Formular leeren');
        }
        feld.value = '';
        const fenster = formular.fenster ? document.getElementById(formular.fenster) : null;
        if (fenster && fenster.classList.contains('show')) hideModal(formular.fenster);
    }
}

/**
 * R7 auch nach Strg+Z und Strg+Y (Undo-Hook, systems/undo.js registerUndoHook()). Rueckgaengig
 * und Wiederholen eines Imports tauschen genau wie der Import selbst, welcher Eintrag hinter
 * einer ID steht. Gemessen (Pruefer, Runde 1, Stand a3822abf): Ersetzen (id 1 ist jetzt "Mira")
 * → Strg+Z → ✏️ Thorin → Strg+Y → "Speichern" schrieb Thorin ueber Mira, "Charakter
 * aktualisiert"; spiegelbildlich ✏️ Mira → Strg+Z → "Speichern" Mira ueber den
 * urspruenglichen Thorin; ueber ↩️/↪️ und beim Encounter genauso. Darum dieselbe Regel wie beim
 * Import, in beide Richtungen: Ersetzen → jedes Bearbeiten des Typs, Hinzufuegen → nur eines,
 * dessen ID ein importierter Eintrag traegt (vorher und nachher gehoert sie sonst niemandem).
 * Welche Aktion ein Schritt betrifft, sagt die Kennung, die executeImport() dem Undo-Punkt
 * mitgibt — das Label ("2 Charaktere importiert") ist dafuer nicht eindeutig.
 * @param {{action?: string, direction?: string, kennungen?: unknown[]}} [info]
 */
function reiterImportNachUndo(info) {
    const kennungen = info && Array.isArray(info.kennungen) ? info.kennungen : [];
    for (const kennung of kennungen) {
        const imp = kennung && typeof kennung === 'object' ? kennung.reiterImport : null;
        if (!imp || typeof imp.typ !== 'string') continue;
        reiterBearbeitenVerwerfen(
            imp.typ,
            imp.modus === 'replace' ? undefined : new Set(imp.neueIds || [])
        );
    }
}
// Anmeldung wie features/soundboard/soundboard-crud.js: systems/undo.js laedt vorher (loader.js)
if (typeof window.registerUndoHook === 'function') {
    window.registerUndoHook(reiterImportNachUndo);
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
    // R6: Ersetzen uebernimmt die IDs der Datei — nur gueltige und eindeutige. Das Fenster
    // bleibt offen: "Hinzufügen" vergibt neue IDs und geht weiter.
    const idFehler = mode === 'replace' ? ersetzenIdFehler(bereit) : null;
    if (idFehler) {
        showToast('❌ ' + idFehler, 'error');
        return;
    }
    const name = reiterTypName(type, items.length);
    const renderAll = window.renderAll;
    // Die Kennung sagt reiterImportNachUndo(), welchen Typ ein Strg+Z/Strg+Y dieses Imports
    // betrifft (R7) — beim Hinzufuegen dazu die neuen IDs, die erst unten feststehen: nextId()
    // laeuft NACH dem Undo-Punkt, damit Strg+Z auch den Zaehler zuruecknimmt.
    /** @type {{reiterImport: {typ: string, modus: string, neueIds?: number[]}}} */
    const kennung = { reiterImport: { typ: type, modus: mode } };
    saveUndoState(`${items.length} ${name} importiert`, kennung);
    /** @type {Set<number>|undefined} */
    let neueIds;
    // Sicherheitskopie bei Replace-Modus. createAutoBackup() erfasst D synchron beim Aufruf,
    // deshalb ohne await; die Meldung folgt dem echten Ergebnis (Code-Review 2026-09-21, R10).
    if (mode === 'replace') {
        reportSafetyBackup(createAutoBackup({ reason: 'safety' }));
        ioSetArray(type, items);
        // Zaehler ueber die groesste ersetzte ID heben (Code-Review 2026-09-21, R03)
        validateAndRepairNextId(undefined, [type]);
    } else {
        // Merge (R5): neue IDs ueber den ID-Generator der App (nextId, auch fuer verschachtelte
        // Sammlungen wie calendarEvents — R03: die hier frueher aufgerufene Funktion gab es
        // nicht); Verweise innerhalb des Typs auf die neuen IDs, alle anderen geleert
        const neu = reiterHinzufuegen(type, items);
        neueIds = new Set(neu.map(item => item.id));
        kennung.reiterImport.neueIds = [...neueIds];
        ioSetArray(type, [...(ioGetArray(type) || []), ...neu]);
    }
    // Ein Import, ein Schreiben: ein zweites "Importieren" findet nichts mehr vor
    _reiterImport = null;
    // R7: kein spaeteres Speichern ueberschreibt einen importierten Eintrag — nach dem Ersetzen
    // kann jede Bearbeiten-ID einem ANDEREN Eintrag gehoeren, nach dem Hinzufuegen nur eine neu
    // vergebene
    reiterBearbeitenVerwerfen(type, neueIds);
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
    // Die drei Welt-Reiter (REITERIMPORT R8): ohne sie blieben ihre Zaehler nach einem Import,
    // Strg+Z oder Strg+Y stehen, bis man den Reiter wechselte (gemessen). Bei aktiver Suche
    // zeigt ihr Zaehler das GEFILTERTE Ergebnis (F-09) — das schreibt dann ihre Liste selbst
    // (renderAll() zeichnet den offenen Welt-Reiter neu), hier also nur ohne Suche.
    const welt = [
        ['sessionprep', D.sessionPreps, 'sessionprep-search'],
        ['kalender', D.calendar?.events, 'kalender-search'],
        ['fraktionen', D.factions, 'fraktionen-search']
    ];
    for (const [view, liste, suchfeld] of welt) {
        const suche = /** @type {HTMLInputElement|null} */ (document.getElementById(suchfeld));
        if (suche && String(suche.value || '').trim() !== '') continue;
        setViewCount(view, Array.isArray(liste) ? liste.length : 0);
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
