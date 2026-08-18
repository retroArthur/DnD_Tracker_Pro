/**
 * Full-Export Tests — TECH-02 (Wave-0 RED-Phase)
 * Testet buildFullExport() und die Export-Schema-Regeln.
 * RED-Phase: Implementierung fehlt (Plan 02-03, Welle 2). Tests werden nach
 * Implementierung gruen (jest-Framework sammelt sie jetzt bereits ein).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================
// SETUP: full-export.js in vm-Kontext laden (non-ESM-Muster)
// ============================================================

let buildFullExport;
// Plan 12-07 / SAFE-06: die Import-Gegenseite. Bisher war nur die Bauseite
// geprueft — nicht der Pfad, auf dem beim Umzug tatsaechlich Daten ankommen.
let importFullExport;
let writtenKeys; // alles, was StorageAPI.setJSON geschrieben hat
let savedIndexCalls; // Argumente von saveCampaignIndex
let migrateCalls; // Argumente von migrateData (eines pro Kampagne)

// Realistische Kampagnendaten INKLUSIVE SRD-Spells — damit der SRD-Strip-Test
// den stripNonUserData-Codepfad tatsaechlich durchlaeuft (WR-09: vorher lieferte
// der getJSON-Mock fuer alle Keys null und der Test bestand trivial).
const CAMPAIGN_DATA = {
    characters: [{ id: 1, name: 'Tester', class: 'Krieger' }],
    npcs: [{ id: 2, name: 'Gastgeber', role: 'NPC' }],
    locations: [],
    quests: [],
    settings: { theme: 'dark' },
    spells: [
        { id: 100, name: 'Feuerball', source: 'srd' },
        { id: 101, name: 'Heilen', source: 'srd' }
    ],
    _version: '2.7.0'
};

beforeAll(() => {
    const context = {
        window: {
            APP_CONFIG: {
                VERSION: '2.7.0',
                STORAGE_KEY: 'dnd-tracker-data',
                DICE_FAV_KEY: 'dnd-dice-favorites',
                DEBUG_MODE: false
            },
            getCampaignIndex: jest.fn(() => ({
                campaigns: [{ key: 'dnd-tracker-data', name: 'Standard-Kampagne' }],
                active: 'dnd-tracker-data'
            })),
            showToast: jest.fn(),
            ErrorHandler: { log: jest.fn() }
        },
        APP_CONFIG: {
            VERSION: '2.7.0',
            STORAGE_KEY: 'dnd-tracker-data',
            DICE_FAV_KEY: 'dnd-dice-favorites',
            DEBUG_MODE: false
        },
        D: {
            characters: [{ id: 1, name: 'Tester', class: 'Krieger' }],
            npcs: [{ id: 2, name: 'Gastgeber', role: 'NPC' }],
            locations: [],
            quests: [],
            encounters: [],
            loot: [],
            wiki: [],
            sessionNotes: [],
            randomTables: [],
            settings: { theme: 'dark' },
            diceFavorites: [{ id: 1, name: 'Angriff', formula: '1d20+5' }],
            dmScreenProfiles: [{ id: 'standard', name: 'Standard', widgets: [] }],
            spells: [
                { id: 100, name: 'Feuerball', source: 'srd' },
                { id: 101, name: 'Heilen', source: 'srd' }
            ]
        },
        StorageAPI: {
            // WR-09: Mock per Key differenzieren — Kampagnen-Key liefert echte
            // Daten (mit SRD-Spells), Dice-Favoriten eigener Key, Rest Fallback
            getJSON: jest.fn((key, fallback) => {
                if (key === 'dnd-tracker-data') {
                    return JSON.parse(JSON.stringify(CAMPAIGN_DATA));
                }
                if (key === 'dnd-dice-favorites') {
                    return [{ id: 1, name: 'Angriff', formula: '1d20+5' }];
                }
                return fallback !== undefined ? fallback : null;
            }),
            // 12-07: schreibende Seite aufzeichnen — nur so laesst sich pruefen,
            // WAS beim Import ankommt (und dass bei Ablehnung nichts ankommt).
            setJSON: jest.fn((key, value) => {
                writtenKeys[key] = value;
                return { success: true };
            }),
            has: jest.fn(() => false)
        },
        // 12-07: Stubs, die importFullExport() nachschlaegt (bare oder ueber window)
        saveCampaignIndex: jest.fn(idx => {
            savedIndexCalls.push(idx);
        }),
        // Identitaets-Migration: veraendert die Nutzdaten nicht, zeichnet aber auf,
        // dass sie je Kampagne gelaufen ist.
        migrateData: jest.fn(data => {
            migrateCalls.push(data);
            return data;
        }),
        console: console
    };
    vm.createContext(context);

    const filePath = path.join(__dirname, '../../systems/migration/full-export.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    // Funktion aus dem vm-Kontext extrahieren
    buildFullExport = context.buildFullExport;
    importFullExport = context.importFullExport;
});

beforeEach(() => {
    writtenKeys = {};
    savedIndexCalls = [];
    migrateCalls = [];
});

// ============================================================
// TESTS
// ============================================================

describe('buildFullExport — Voll-Export-Format (TECH-02)', () => {
    test('buildFullExport enthaelt alle Kampagnen + Settings + diceFavorites + dmScreenProfiles', () => {
        // RED-Phase: buildFullExport existiert noch nicht — expect schlaegt fehl und dokumentiert den Grund
        expect(typeof buildFullExport).toBe('function'); // Schlaegt fehl bis Plan 02-03 implementiert ist

        const result = buildFullExport();

        expect(result).toBeDefined();
        // Export muss Metadaten enthalten
        expect(result._exportType).toBe('full-v1');
        // Kampagnendaten muss vorhanden sein
        expect(result.campaigns).toBeDefined();
        expect(Array.isArray(result.campaigns) || typeof result.campaigns === 'object').toBe(true);
        // Settings-Daten muss enthalten sein
        expect(result.settings).toBeDefined();
        // diceFavorites muss enthalten sein
        expect(result.diceFavorites).toBeDefined();
        // dmScreenProfiles muss enthalten sein
        expect(result.dmScreenProfiles).toBeDefined();
    });

    test('Voll-Export enthaelt KEINE SRD-Spells (D.spells nicht im Output)', () => {
        // RED-Phase: buildFullExport existiert noch nicht
        expect(typeof buildFullExport).toBe('function'); // Schlaegt fehl bis Plan 02-03 implementiert ist

        const result = buildFullExport();

        // WR-09: Der Export muss die Kampagne tatsaechlich eingesammelt haben —
        // sonst prueft der Strip-Test ein leeres Objekt (vakuumoes gruen)
        expect(result.campaigns['dnd-tracker-data']).toBeDefined();
        expect(result.campaigns['dnd-tracker-data'].data.characters).toHaveLength(1);

        // stripNonUserData muss das spells-Feld der Kampagnendaten entfernt haben
        expect(result.campaigns['dnd-tracker-data'].data.spells).toBeUndefined();

        // SRD-Spells duerfen niemals exportiert werden (Lizenz + Groesse)
        expect(result.spells).toBeUndefined();
        // Auch tief verschachtelt nicht
        const resultStr = JSON.stringify(result);
        expect(resultStr).not.toContain('"source":"srd"');
    });
});

// ============================================================
// Plan 12-07 / SAFE-06 — die Gegenseite: importFullExport()
// buildFullExport() war geprueft, importFullExport() nicht. Der Import ist
// aber der Pfad, auf dem beim einmaligen Umzug Daten ankommen (oder eben
// nicht) — dieselbe Luecke wie bei DEBT-17: nur eine Haelfte der Naht getestet.
// Beide Funktionen stammen aus der ECHTEN systems/migration/full-export.js
// (vm-Kontext oben) — kein Nachbau (T-12-22).
// ============================================================

describe('Export/Import-Rundlauf (SAFE-06)', () => {
    test('importFullExport(buildFullExport()) stellt Kampagnen, Index und Wuerfel-Favoriten wieder her', () => {
        const exportObj = buildFullExport();
        const result = importFullExport(exportObj);

        // Kampagnendaten kommen unveraendert an
        expect(result.campaignCount).toBe(1);
        expect(writtenKeys['dnd-tracker-data']).toEqual(
            exportObj.campaigns['dnd-tracker-data'].data
        );
        expect(writtenKeys['dnd-tracker-data'].characters).toHaveLength(1);
        expect(writtenKeys['dnd-tracker-data'].characters[0].name).toBe('Tester');
        expect(writtenKeys['dnd-tracker-data'].npcs[0].name).toBe('Gastgeber');

        // Kampagnen-Index wiederhergestellt
        expect(savedIndexCalls).toHaveLength(1);
        expect(savedIndexCalls[0]).toEqual(exportObj.campaignIndex);
        expect(savedIndexCalls[0].active).toBe('dnd-tracker-data');

        // WR-04: Wuerfel-Favoriten liegen unter einem EIGENEN Key und sind nicht
        // Teil der Kampagnendaten — ohne diesen Schritt gingen sie still verloren.
        expect(writtenKeys['dnd-dice-favorites']).toEqual([
            { id: 1, name: 'Angriff', formula: '1d20+5' }
        ]);
    });

    test('Versionsstempel: _appVersion kommt aus APP_CONFIG.VERSION, aelterer Stempel laeuft durch migrateData', () => {
        const exportObj = buildFullExport();
        expect(exportObj._appVersion).toBe('2.7.0'); // APP_CONFIG.VERSION im Kontext

        const alterExport = Object.assign({}, exportObj, { _appVersion: '2.5.0' });
        const result = importFullExport(alterExport);

        expect(result.campaignCount).toBe(1);
        // migrateData laeuft je Kampagne — genau einmal hier
        expect(migrateCalls).toHaveLength(1);
        expect(migrateCalls[0].characters[0].name).toBe('Tester');
        expect(writtenKeys['dnd-tracker-data']).toBeDefined();
    });

    test('SRD-Abgrenzung: entfernte Spells kommen beim Import nicht zurueck', () => {
        const exportObj = buildFullExport();
        // Vorbedingung: der Export hat die Spells wirklich entfernt
        expect(exportObj.campaigns['dnd-tracker-data'].data.spells).toBeUndefined();

        importFullExport(exportObj);

        // Der Strip ist keine Anzeigefrage — SRD-Daten bleiben dauerhaft draussen
        expect(writtenKeys['dnd-tracker-data'].spells).toBeUndefined();
        expect(JSON.stringify(writtenKeys)).not.toContain('"source":"srd"');
        expect(JSON.stringify(writtenKeys)).not.toContain('Feuerball');
    });

    describe('Ablehnungen — es wird nichts geschrieben, bevor geworfen wird', () => {
        // Hilfsfunktion: nur Kampagnen-Keys zaehlen (Favoriten liegen unter
        // eigenem Key und wuerden ohnehin erst nach der Schleife geschrieben)
        function geschriebeneKampagnenKeys() {
            return Object.keys(writtenKeys).filter(k => k !== 'dnd-dice-favorites');
        }

        test('falscher _exportType wird abgelehnt', () => {
            const bad = Object.assign({}, buildFullExport(), { _exportType: 'irgendwas' });
            expect(() => importFullExport(bad)).toThrow(/full-v1/);
            expect(geschriebeneKampagnenKeys()).toHaveLength(0);
            expect(savedIndexCalls).toHaveLength(0);
        });

        test('fehlende campaigns werden abgelehnt', () => {
            const bad = Object.assign({}, buildFullExport());
            delete bad.campaigns;
            expect(() => importFullExport(bad)).toThrow(/Kampagnendaten fehlen/);
            expect(geschriebeneKampagnenKeys()).toHaveLength(0);
            expect(savedIndexCalls).toHaveLength(0);
        });

        test('fehlender campaignIndex wird abgelehnt', () => {
            const bad = Object.assign({}, buildFullExport());
            delete bad.campaignIndex;
            expect(() => importFullExport(bad)).toThrow(/Kampagnen-Index fehlt/);
            expect(geschriebeneKampagnenKeys()).toHaveLength(0);
            expect(savedIndexCalls).toHaveLength(0);
        });

        test('mehr als 100 Kampagnen werden abgelehnt (WR-03: Quota/DoS)', () => {
            const bad = buildFullExport();
            bad.campaigns = {};
            for (let i = 0; i < 101; i++) {
                bad.campaigns['dnd-campaign-' + i] = {
                    meta: { key: 'dnd-campaign-' + i, name: 'K' + i },
                    data: { characters: [] }
                };
            }
            expect(() => importFullExport(bad)).toThrow(/Zu viele Kampagnen/);
            expect(geschriebeneKampagnenKeys()).toHaveLength(0);
            expect(savedIndexCalls).toHaveLength(0);
        });

        test('Key ausserhalb der erlaubten Praefixe wird abgelehnt', () => {
            const bad = buildFullExport();
            bad.campaigns = Object.assign({}, bad.campaigns, {
                'boeser-key': { meta: { key: 'boeser-key' }, data: { characters: [] } }
            });
            expect(() => importFullExport(bad)).toThrow(/Unerwarteter Kampagnen-Key/);
            // Der gueltige Key darf ebenfalls NICHT geschrieben worden sein —
            // die Whitelist-Pruefung laeuft vollstaendig vor der Schreibschleife
            expect(geschriebeneKampagnenKeys()).toHaveLength(0);
            expect(savedIndexCalls).toHaveLength(0);
        });
    });

    test('Quelltext-Beleg: Pruefungen stehen vor dem ersten Schreibzugriff (T-12-22)', () => {
        // Der vm-Kontext laedt zwar die echte Datei, aber die Reihenfolge
        // "erst pruefen, dann schreiben" soll auch dann noch belegt sein, wenn
        // jemand die Schleifen umstellt.
        const src = fs.readFileSync(
            path.join(__dirname, '../../systems/migration/full-export.js'),
            'utf8'
        );
        const idxTypeCheck = src.indexOf("_exportType !== 'full-v1'");
        const idxMaxCheck = src.indexOf('MAX_IMPORT_CAMPAIGNS');
        const idxKeyWhitelist = src.indexOf('ALLOWED_KEY_RE');
        const idxFirstWrite = src.indexOf('StorageAPI.setJSON(key, migratedData)');

        expect(idxTypeCheck).toBeGreaterThan(-1);
        expect(idxFirstWrite).toBeGreaterThan(-1);
        expect(idxTypeCheck).toBeLessThan(idxFirstWrite);
        expect(idxMaxCheck).toBeLessThan(idxFirstWrite);
        expect(idxKeyWhitelist).toBeLessThan(idxFirstWrite);

        // WR-04: die Favoriten-Wiederherstellung existiert ueberhaupt
        expect(src).toMatch(
            /StorageAPI\.setJSON\(APP_CONFIG\.DICE_FAV_KEY, parsedObj\.diceFavorites\)/
        );
    });
});
