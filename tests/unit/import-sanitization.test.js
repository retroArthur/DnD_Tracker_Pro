/**
 * Import-Sanitisierung — Unit-Nachweis (Phase 10, Plan 02)
 *
 * KERNUNTERSCHIED zu einer Logik-Kopie im Test:
 * Diese Tests laden den ECHTEN Quelltext von systems/spellslots/import-export.js
 * und utils/basic.js über vm.runInContext (Präzedenzmuster: tests/unit/storage-conflict.test.js)
 * und rufen die PRODUKTIONS-Funktion sanitizeImportedItem() direkt auf — keine im Test
 * nachgebaute Sanitisierungslogik, keine Kopie von sanitizeHTML().
 *
 * RED-Zustand (vor Task 2/3 dieses Plans): HTML_FIELDS_BY_TYPE und sanitizeImportedItem()
 * existieren im Quelltext noch nicht — alle Tests unten MÜSSEN fehlschlagen.
 *
 * Schließt: SEC-01 Import-Grenze (D-01, D-02, D-07, WR-03 aus 01-REVIEW.md)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let context;
let importExportSourceCode;
let sanitizeImportedItem;
let HTML_FIELDS_BY_TYPE;
let IO_SCHEMA;

beforeAll(() => {
    // ============================================================
    // SCHRITT 1: sanitizeHTML() aus dem ECHTEN utils/basic.js laden.
    // Eigener vm-Kontext, danach Referenz in den Haupt-Kontext durchreichen —
    // der Test läuft gegen den Produktions-Sanitizer, nicht gegen einen Test-Zwilling
    // (utils/testable-utils.js wird hier bewusst NICHT verwendet).
    // ============================================================
    const basicContext = {
        window: {},
        document: global.document,
        DOMParser: global.DOMParser,
        Node: global.Node,
        console
    };
    vm.createContext(basicContext);
    const basicSource = fs.readFileSync(path.join(__dirname, '../../utils/basic.js'), 'utf8');
    vm.runInContext(basicSource, basicContext);
    const sanitizeHTML = basicContext.sanitizeHTML;

    // ============================================================
    // SCHRITT 2: systems/spellslots/import-export.js in einen eigenen Kontext laden.
    // window.sanitizeHTML wird auf die echte Funktion aus Schritt 1 gesetzt.
    // Übrige Globals, die Funktionskörper in import-export.js erwarten, werden als
    // Attrappen bereitgestellt (nur relevant, falls executeImport()/importDataGlobal()
    // tatsächlich aufgerufen werden — sanitizeImportedItem() selbst braucht nur
    // window.sanitizeHTML).
    // ============================================================
    context = {
        window: {
            sanitizeHTML,
            D: {},
            APP_CONFIG: global.APP_CONFIG,
            getNextId: jest.fn(() => 1),
            renderAll: jest.fn(),
            getCampaignIndex: jest.fn(() => ({ active: '', campaigns: [] })),
            saveCampaignIndex: jest.fn(),
            stopAllTracks: jest.fn()
        },
        document: global.document,
        DOMParser: global.DOMParser,
        Node: global.Node,
        console,
        $: jest.fn(),
        showToast: jest.fn(),
        save: jest.fn(),
        saveUndoState: jest.fn(),
        createAutoBackup: jest.fn(),
        StorageAPI: { setJSON: jest.fn(() => ({ success: true })) },
        confirm: jest.fn(() => true),
        alert: jest.fn()
    };
    vm.createContext(context);

    const filePath = path.join(__dirname, '../../systems/spellslots/import-export.js');
    importExportSourceCode = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(importExportSourceCode, context);

    // Eine Funktionsdeklaration auf oberster Ebene landet als Eigenschaft am
    // Kontextobjekt (context.sanitizeImportedItem) — solange das Symbol im Quelltext
    // existiert. Im RED-Zustand (vor Task 2) ist context.sanitizeImportedItem === undefined.
    sanitizeImportedItem = context.sanitizeImportedItem;

    // Eine `const`-Deklaration landet NICHT als Eigenschaft am Kontextobjekt (vm-Eigenheit) —
    // HTML_FIELDS_BY_TYPE muss über einen zweiten Aufruf vm.runInContext(...) aus demselben
    // Kontext ausgelesen werden, damit auf die lexikalische Umgebung zugegriffen wird.
    // Im RED-Zustand existiert der Bezeichner noch nicht → ReferenceError → undefined.
    try {
        HTML_FIELDS_BY_TYPE = vm.runInContext('HTML_FIELDS_BY_TYPE', context);
    } catch (e) {
        HTML_FIELDS_BY_TYPE = undefined;
    }
    IO_SCHEMA = vm.runInContext('IO_SCHEMA', context);
});

// ============================================================
// FELDLISTE (D-02, Render-Pfad-Audit aus 10-RESEARCH.md)
// ============================================================
describe('HTML_FIELDS_BY_TYPE — Feldliste (D-02, Render-Pfad-Audit)', () => {
    const EXPECTED = {
        characters: ['notes'],
        npcs: ['description'],
        locations: ['description'],
        quests: ['description'],
        encounters: ['traits', 'actions', 'skills'],
        spells: ['description'],
        sessionNotes: ['content'],
        wiki: ['content'],
        links: ['description']
    };

    test('enthält genau die neun erwarteten Typen mit den erwarteten Feldern', () => {
        expect(HTML_FIELDS_BY_TYPE).toBeDefined();
        expect(Object.keys(HTML_FIELDS_BY_TYPE).sort()).toEqual(Object.keys(EXPECTED).sort());
        for (const [type, fields] of Object.entries(EXPECTED)) {
            expect(HTML_FIELDS_BY_TYPE[type]).toEqual(fields);
        }
    });

    test('jedes gelistete Feld existiert im zugehörigen IO_SCHEMA-Eintrag', () => {
        expect(HTML_FIELDS_BY_TYPE).toBeDefined();
        for (const [type, fields] of Object.entries(HTML_FIELDS_BY_TYPE)) {
            expect(IO_SCHEMA[type]).toBeDefined();
            for (const field of fields) {
                expect(Object.prototype.hasOwnProperty.call(IO_SCHEMA[type], field)).toBe(true);
            }
        }
    });
});

// ============================================================
// VEKTOR-KATALOG JE ENTITY-TYP (Review-Exploit-Vektor: <img src=x onerror=...>)
// ============================================================
describe('sanitizeImportedItem() — Vektor-Katalog je Entity-Typ', () => {
    const TYPES_AND_FIELDS = {
        characters: ['notes'],
        npcs: ['description'],
        locations: ['description'],
        quests: ['description'],
        encounters: ['traits', 'actions', 'skills'],
        spells: ['description'],
        sessionNotes: ['content'],
        wiki: ['content'],
        links: ['description']
    };
    const VECTOR = '<img src=x onerror="window.__xssUnit10 = true">HarmloserText';

    Object.entries(TYPES_AND_FIELDS).forEach(([type, fields]) => {
        test(`${type}: Review-Exploit-Vektor in [${fields.join(', ')}] wird entfernt`, () => {
            expect(sanitizeImportedItem).toBeDefined();
            const item = { id: 1 };
            fields.forEach(f => {
                item[f] = VECTOR;
            });
            const result = sanitizeImportedItem(type, item);
            fields.forEach(f => {
                expect(result[f]).not.toMatch(/onerror/i);
                expect(result[f]).not.toMatch(/<img/i);
                expect(result[f]).toContain('HarmloserText');
            });
        });
    });
});

// ============================================================
// ZUSÄTZLICHE ANGRIFFSVEKTOREN (script-Element, javascript:-Adresse, SVG-Ereignis)
// ============================================================
describe('sanitizeImportedItem() — zusätzliche Angriffsvektoren', () => {
    test('<script>-Element wird entfernt', () => {
        expect(sanitizeImportedItem).toBeDefined();
        const item = { id: 1, content: '<script>window.__xssUnit10=true;</script>HarmloserText' };
        const result = sanitizeImportedItem('wiki', item);
        expect(result.content).not.toMatch(/<script/i);
        expect(result.content).toContain('HarmloserText');
    });

    test('javascript:-Adresse in einem Link wird entschärft', () => {
        expect(sanitizeImportedItem).toBeDefined();
        const item = {
            id: 1,
            content: '<a href="javascript:window.__xssUnit10=true">Klick</a>HarmloserText'
        };
        const result = sanitizeImportedItem('wiki', item);
        expect(result.content.toLowerCase()).not.toMatch(/href\s*=\s*"javascript:/);
        expect(result.content).toContain('HarmloserText');
    });

    test('SVG-Ereignis-Attribut (onload) wird entfernt', () => {
        expect(sanitizeImportedItem).toBeDefined();
        const item = { id: 1, content: '<svg onload="window.__xssUnit10 = true"></svg>HarmloserText' };
        const result = sanitizeImportedItem('wiki', item);
        expect(result.content).not.toMatch(/onload/i);
        expect(result.content).toContain('HarmloserText');
    });
});

// ============================================================
// D-02 LEITPLANKE — nicht gelistete Felder bleiben zeichenidentisch
// ============================================================
describe('D-02 Leitplanke — nicht gelistete Felder bleiben zeichenidentisch', () => {
    test('name (Würfelformel-artiger Vergleich) und title (Kleiner-als-Konstruktion) kommen unverändert zurück', () => {
        expect(sanitizeImportedItem).toBeDefined();
        const item = {
            id: 1,
            name: 'Schaden <2d6 = leicht verwundet',
            title: 'Held der Stufe <5',
            description: '<img src=x onerror="window.__xssUnit10=true">Text'
        };
        const before = { ...item };
        const result = sanitizeImportedItem('npcs', item);
        expect(result.name).toBe(before.name);
        expect(result.title).toBe(before.title);
        // Kontrast-Assertion: das gelistete Feld (description) WURDE verändert
        expect(result.description).not.toBe(before.description);
    });
});

// ============================================================
// TOTALITÄT — total definiert, kein Fehler bei unbekanntem Typ / Rand-/Fehlwerten
// ============================================================
describe('sanitizeImportedItem() — Totalität', () => {
    test('unbekannter Typ gibt das Item unverändert zurück', () => {
        expect(sanitizeImportedItem).toBeDefined();
        const item = { id: 1, foo: '<script>bad</script>' };
        const result = sanitizeImportedItem('unknownType', item);
        expect(result).toEqual(item);
    });

    test('Item ohne das gelistete Feld: kein Fehler, andere Felder unverändert', () => {
        expect(sanitizeImportedItem).toBeDefined();
        const item = { id: 1, name: 'Test' };
        expect(() => sanitizeImportedItem('npcs', item)).not.toThrow();
        const result = sanitizeImportedItem('npcs', item);
        expect(result.name).toBe('Test');
    });

    test('gelistetes Feld = null führt zu keinem Fehler', () => {
        expect(sanitizeImportedItem).toBeDefined();
        const item = { id: 1, description: null };
        expect(() => sanitizeImportedItem('npcs', item)).not.toThrow();
        const result = sanitizeImportedItem('npcs', item);
        expect(result.description).toBeNull();
    });

    test('gelistetes Feld = undefined führt zu keinem Fehler', () => {
        expect(sanitizeImportedItem).toBeDefined();
        const item = { id: 1, description: undefined };
        expect(() => sanitizeImportedItem('npcs', item)).not.toThrow();
        const result = sanitizeImportedItem('npcs', item);
        expect(result.description).toBeUndefined();
    });

    test('gelistetes Feld = leere Zeichenkette führt zu keinem Fehler', () => {
        expect(sanitizeImportedItem).toBeDefined();
        const item = { id: 1, description: '' };
        expect(() => sanitizeImportedItem('npcs', item)).not.toThrow();
        const result = sanitizeImportedItem('npcs', item);
        expect(result.description).toBe('');
    });
});

// ============================================================
// UNVERÄNDERLICHKEIT — Eingabeobjekt wird nicht mutiert
// ============================================================
describe('sanitizeImportedItem() — Unveränderlichkeit', () => {
    test('der Aufruf verändert das übergebene Objekt nicht, sondern liefert ein neues', () => {
        expect(sanitizeImportedItem).toBeDefined();
        const item = { id: 1, description: '<img src=x onerror="a=1">Text' };
        const frozenCopy = JSON.parse(JSON.stringify(item));
        const result = sanitizeImportedItem('npcs', item);
        expect(item).toEqual(frozenCopy); // Original unverändert
        expect(result).not.toBe(item); // neues Objekt
    });
});

// ============================================================
// QUELLTEXT-STRUKTURPRÜFUNG (nach Muster von Test E in storage-conflict.test.js)
// ============================================================
describe('Quelltext-Strukturprüfung — Verdrahtung an beiden Eintrittspunkten', () => {
    test('executeImport(): Aufruf von sanitizeImportedItem() steht innerhalb der validatedItems-Abbildung', () => {
        const fnStart = importExportSourceCode.indexOf('function executeImport(');
        expect(fnStart).toBeGreaterThan(-1);
        // Nächste Top-Level-Funktion im Quelltext dient als Ende-Marker.
        const fnEnd = importExportSourceCode.indexOf('function updateIOCounts(');
        expect(fnEnd).toBeGreaterThan(fnStart);
        const body = importExportSourceCode.slice(fnStart, fnEnd);
        const mapStart = body.indexOf('const validatedItems');
        expect(mapStart).toBeGreaterThan(-1);
        const sanitizeCallIdx = body.indexOf('sanitizeImportedItem(', mapStart);
        expect(sanitizeCallIdx).toBeGreaterThan(mapStart);
    });

    test('importDataGlobal(): Sanitisierungs-Schleife steht VOR der choice-Verzweigung', () => {
        const fnStart = importExportSourceCode.indexOf('function importDataGlobal(');
        expect(fnStart).toBeGreaterThan(-1);
        const fnEnd = importExportSourceCode.indexOf('function copyData(');
        expect(fnEnd).toBeGreaterThan(fnStart);
        const body = importExportSourceCode.slice(fnStart, fnEnd);
        const loopIdx = body.indexOf('HTML_FIELDS_BY_TYPE');
        const choiceIdx = body.indexOf('if (choice)');
        expect(loopIdx).toBeGreaterThan(-1);
        expect(choiceIdx).toBeGreaterThan(-1);
        expect(loopIdx).toBeLessThan(choiceIdx);
    });

    test('importDataGlobal(): Undo-Punkt und Sicherungskopie stehen im Überschreib-Zweig vor Object.assign(D, imp)', () => {
        const fnStart = importExportSourceCode.indexOf('function importDataGlobal(');
        expect(fnStart).toBeGreaterThan(-1);
        const fnEnd = importExportSourceCode.indexOf('function copyData(');
        expect(fnEnd).toBeGreaterThan(fnStart);
        const body = importExportSourceCode.slice(fnStart, fnEnd);
        // Eindeutiger Marker für den Beginn des Überschreib-Zweigs (der Kommentar ist
        // eindeutig — im Gegensatz zu "} else {", das im selben Funktionskörper auch
        // für den inneren if(saveResult.success)-Zweig vorkommt).
        const overwriteBranchIdx = body.indexOf('Aktuelle Kampagne überschreiben');
        expect(overwriteBranchIdx).toBeGreaterThan(-1);
        const assignIdx = body.indexOf('Object.assign(D, imp)', overwriteBranchIdx);
        expect(assignIdx).toBeGreaterThan(overwriteBranchIdx);
        const undoIdx = body.indexOf('saveUndoState(', overwriteBranchIdx);
        const backupIdx = body.indexOf('createAutoBackup(', overwriteBranchIdx);
        expect(undoIdx).toBeGreaterThan(overwriteBranchIdx);
        expect(undoIdx).toBeLessThan(assignIdx);
        expect(backupIdx).toBeGreaterThan(overwriteBranchIdx);
        expect(backupIdx).toBeLessThan(assignIdx);
    });
});
