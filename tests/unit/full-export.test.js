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

// SEC-05 (Plan 12-16): kontrollierbarer "lokaler Bestand" fuer den Merge-Test —
// StorageAPI.getJSON('dnd-dice-favorites') liest daraus, statt eines fest
// verdrahteten Rueckgabewerts. beforeEach setzt den Default (identisch zum
// bisherigen fest verdrahteten Wert, damit bestehende Tests unveraendert gruen
// bleiben); die SEC-05-Tests ueberschreiben ihn gezielt.
let diceFavoritesBacking;
// SEC-05: Referenz auf den window.getCampaignIndex-Mock, damit die
// Index-Merge-Tests einen abweichenden LOKALEN Index simulieren koennen
// (mockReturnValueOnce), ohne den Standardwert fuer alle anderen Tests zu aendern.
let getCampaignIndexMock;

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
                    return diceFavoritesBacking;
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
    getCampaignIndexMock = context.window.getCampaignIndex;
});

beforeEach(() => {
    writtenKeys = {};
    savedIndexCalls = [];
    migrateCalls = [];
    // SEC-05: Default identisch zum vormals fest verdrahteten Rueckgabewert —
    // bestehende Tests (die diesen Wert erwarten) bleiben dadurch unveraendert gruen.
    diceFavoritesBacking = [{ id: 1, name: 'Angriff', formula: '1d20+5' }];
    getCampaignIndexMock.mockReturnValue({
        campaigns: [{ key: 'dnd-tracker-data', name: 'Standard-Kampagne' }],
        active: 'dnd-tracker-data'
    });
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

        // WR-04 / SEC-05 (Plan 12-16): die Favoriten-Wiederherstellung existiert
        // ueberhaupt — UND liest den lokalen Bestand VOR dem Ueberschreiben (SEC-05:
        // der Import fuehrt zusammen statt zu ersetzen; ohne dieses Lesen koennte
        // er das gar nicht). Ersetzt die vormals woertlich gepinnte
        // Ueberschreib-Zusicherung — WR-04 bleibt gepinnt (es wird weiterhin unter
        // DICE_FAV_KEY geschrieben), der neue Vertrag ist strenger, nicht schwaecher.
        // Suche NACH idxFirstWrite (innerhalb importFullExport): buildFullExport()
        // liest DICE_FAV_KEY ebenfalls (fuer den Export), aber das ist eine andere
        // Stelle in einer anderen Funktion — ohne diese Einschraenkung waere die
        // Zusicherung ein Blindgaenger (sie faende die Export-Lesestelle, nicht die
        // Import-Merge-Lesestelle, und wuerde auch gegen den Vor-Fix-Quelltext bestehen).
        const idxFavRead = src.indexOf('StorageAPI.getJSON(APP_CONFIG.DICE_FAV_KEY', idxFirstWrite);
        const idxFavWrite = src.indexOf('StorageAPI.setJSON(APP_CONFIG.DICE_FAV_KEY', idxFirstWrite);
        expect(idxFavRead).toBeGreaterThan(-1);
        expect(idxFavWrite).toBeGreaterThan(-1);
        expect(idxFavRead).toBeLessThan(idxFavWrite);
    });
});

// ============================================================
// SEC-05 (Plan 12-16) — der Import fuehrt Wuerfel-Favoriten und Kampagnen-Index
// ZUSAMMEN statt sie zu ersetzen. Design-Regel (<design_note> im Plan): der
// Import gewinnt, wo beide dasselbe meinen; erhalten bleibt nur, was der Import
// gar nicht kennt; wortgleiche Doppelte entstehen nicht.
// ============================================================
describe('SEC-05 — Wuerfel-Favoriten und Kampagnen-Index werden zusammengefuehrt, nicht ersetzt', () => {
    // Minimaler, aber gueltiger Import — genau eine Kampagne, damit die
    // Campaigns-/ALLOWED_KEY_RE-Pruefungen anstandslos durchlaufen und der Test
    // sich ausschliesslich auf Favoriten/Index konzentrieren kann.
    function baueImport({ diceFavorites, campaignIndex }) {
        return {
            _exportType: 'full-v1',
            campaigns: {
                'dnd-tracker-data': { meta: { key: 'dnd-tracker-data' }, data: { characters: [] } }
            },
            campaignIndex,
            diceFavorites
        };
    }

    test('SEC-05 Test A: lokale Favoriten ueberleben, importierte kommen hinzu, lokale zuerst', () => {
        diceFavoritesBacking = [
            { name: 'Initiative', notation: '1d20+3' },
            { name: 'Heiltrank', notation: '2d4+2' }
        ];
        const importObj = baueImport({
            diceFavorites: [{ name: 'Feuerball-Schaden', notation: '8d6' }],
            campaignIndex: { campaigns: [], active: 'dnd-tracker-data' }
        });

        const result = importFullExport(importObj);

        expect(writtenKeys['dnd-dice-favorites']).toEqual([
            { name: 'Initiative', notation: '1d20+3' },
            { name: 'Heiltrank', notation: '2d4+2' },
            { name: 'Feuerball-Schaden', notation: '8d6' }
        ]);
        expect(result.preservedFavoritesCount).toBe(2);
    });

    test('SEC-05 Test B: wortgleicher Favorit (Name UND Notation) entsteht nicht doppelt', () => {
        diceFavoritesBacking = [{ name: 'Initiative', notation: '1d20+3' }];
        const importObj = baueImport({
            diceFavorites: [{ name: 'Initiative', notation: '1d20+3' }],
            campaignIndex: { campaigns: [], active: 'dnd-tracker-data' }
        });

        importFullExport(importObj);

        expect(writtenKeys['dnd-dice-favorites']).toEqual([{ name: 'Initiative', notation: '1d20+3' }]);
    });

    test('SEC-05 Test C: lokal keine Favoriten -> exakt das bisherige Verhalten (WR-04 bleibt erfuellt)', () => {
        diceFavoritesBacking = [];
        const importObj = baueImport({
            diceFavorites: [{ name: 'Initiative', notation: '1d20+3' }],
            campaignIndex: { campaigns: [], active: 'dnd-tracker-data' }
        });

        importFullExport(importObj);

        expect(writtenKeys['dnd-dice-favorites']).toEqual([{ name: 'Initiative', notation: '1d20+3' }]);
    });

    test('SEC-05 Test D: ein lokaler Index-Eintrag, den der Import nicht kennt, bleibt erhalten; active stammt aus dem Import', () => {
        getCampaignIndexMock.mockReturnValueOnce({
            campaigns: [
                { key: 'dnd-tracker-data', name: 'Standard-Kampagne' },
                { key: 'dnd-campaign-999', name: 'Nur lokal vorhandene Kampagne' }
            ],
            active: 'dnd-campaign-999'
        });
        diceFavoritesBacking = [];
        const importObj = baueImport({
            diceFavorites: [],
            campaignIndex: {
                campaigns: [{ key: 'dnd-tracker-data', name: 'Standard-Kampagne (importiert)' }],
                active: 'dnd-tracker-data'
            }
        });

        const result = importFullExport(importObj);

        expect(savedIndexCalls[0].campaigns).toEqual([
            { key: 'dnd-tracker-data', name: 'Standard-Kampagne (importiert)' },
            { key: 'dnd-campaign-999', name: 'Nur lokal vorhandene Kampagne' }
        ]);
        expect(savedIndexCalls[0].active).toBe('dnd-tracker-data');
        expect(result.preservedIndexEntriesCount).toBe(1);
    });

    test('SEC-05 Test E: ueberschneidender Key -> der Import gewinnt (Name aus dem Import, nicht doppelt)', () => {
        getCampaignIndexMock.mockReturnValueOnce({
            campaigns: [{ key: 'dnd-tracker-data', name: 'Alter lokaler Name' }],
            active: 'dnd-tracker-data'
        });
        diceFavoritesBacking = [];
        const importObj = baueImport({
            diceFavorites: [],
            campaignIndex: {
                campaigns: [{ key: 'dnd-tracker-data', name: 'Neuer Name aus dem Import' }],
                active: 'dnd-tracker-data'
            }
        });

        importFullExport(importObj);

        expect(savedIndexCalls[0].campaigns).toEqual([
            { key: 'dnd-tracker-data', name: 'Neuer Name aus dem Import' }
        ]);
    });

    test('SEC-05 Test F: der Rueckgabewert nennt beide Zusammenfuehrungszahlen; campaignCount/totalBytes bleiben unveraendert', () => {
        getCampaignIndexMock.mockReturnValueOnce({
            campaigns: [
                { key: 'dnd-tracker-data', name: 'Standard-Kampagne' },
                { key: 'dnd-campaign-999', name: 'Nur lokal' }
            ],
            active: 'dnd-tracker-data'
        });
        diceFavoritesBacking = [
            { name: 'Initiative', notation: '1d20+3' },
            { name: 'Heiltrank', notation: '2d4+2' }
        ];
        const importObj = baueImport({
            diceFavorites: [{ name: 'Feuerball-Schaden', notation: '8d6' }],
            campaignIndex: {
                campaigns: [{ key: 'dnd-tracker-data', name: 'Standard-Kampagne' }],
                active: 'dnd-tracker-data'
            }
        });

        const result = importFullExport(importObj);

        expect(result.preservedFavoritesCount).toBe(2);
        expect(result.preservedIndexEntriesCount).toBe(1);
        expect(result.campaignCount).toBe(1);
        expect(typeof result.totalBytes).toBe('number');
    });
});

// ============================================================
// SAFE-06 — Der Versions-Rundlauf mit der ECHTEN Migration
// ------------------------------------------------------------
// Befund (Nyquist-Refutation R15): `_appVersion` wird zwar von
// buildFullExport() geschrieben (full-export.js:70), aber repo-weit NIRGENDS
// gelesen — importFullExport() verzweigt nicht darauf. Ein Test, der den
// Stempel mutiert, kann daher gar nicht rot werden. Die Kompatibilitaets-
// Entscheidung faellt in Wahrheit ueber das PRO KAMPAGNE mitgereiste
// `data._version`, das die echte migrateData() (systems/spellslots/
// version-migration.js) auswertet. Genau diese Naht wird hier gepinnt:
// beide echten Module in EINEM vm-Kontext, keine Identitaets-Stubs.
// Grenze (bewusst dokumentiert): alle realen MIGRATIONS mutieren ihr Argument
// in-place und geben dasselbe Objekt zurueck. Ein Mutant, der NUR den
// Rueckgabewert von migrateData() verwirft, ist damit verhaltensgleich und
// nicht toetbar; toetbar ist dagegen das Ueberspringen des Aufrufs selbst
// (mutationsgeprueft) sowie jede Aenderung an der Migration.
// ============================================================

describe('Versions-Rundlauf mit echter migrateData (SAFE-06)', () => {
    const ECHTE_VERSION = '9.9.9'; // bewusst != core/config.js, damit ein
    // hartkodierter Stempel im Export auffliegt
    let echtImport;
    let echtBuild;
    let echtGeschrieben;
    let echtIndexCalls;

    function altKampagne(name) {
        return {
            _version: '2.5.0', // aelter als 2.6.1/3.0.0/4.0.0/5.0.0
            characters: [{ id: 1, name: name }],
            npcs: [],
            quests: [],
            settings: {},
            spells: [{ id: 100, name: 'Feuerball', source: 'srd' }]
        };
    }

    beforeEach(() => {
        echtGeschrieben = {};
        echtIndexCalls = [];

        const appConfig = {
            VERSION: ECHTE_VERSION,
            STORAGE_KEY: 'dnd-tracker-data',
            DICE_FAV_KEY: 'dnd-dice-favorites',
            DEBUG_MODE: false
        };
        const index = {
            campaigns: [
                { key: 'dnd-tracker-data', name: 'Standard-Kampagne' },
                { key: 'dnd-campaign-2', name: 'Zweite Kampagne' }
            ],
            active: 'dnd-tracker-data'
        };
        const quellen = {
            'dnd-tracker-data': altKampagne('Erste'),
            'dnd-campaign-2': altKampagne('Zweite'),
            'dnd-dice-favorites': [{ id: 1, name: 'Angriff', formula: '1d20+5' }]
        };

        const context = {
            window: {
                APP_CONFIG: appConfig,
                getCampaignIndex: () => JSON.parse(JSON.stringify(index)),
                showToast: jest.fn(),
                ErrorHandler: { log: jest.fn() },
                D: { settings: {}, dmScreenProfiles: {} }
            },
            APP_CONFIG: appConfig,
            StorageAPI: {
                getJSON: (key, fallback) =>
                    quellen[key] !== undefined
                        ? JSON.parse(JSON.stringify(quellen[key]))
                        : fallback !== undefined
                          ? fallback
                          : null,
                setJSON: (key, value) => {
                    echtGeschrieben[key] = value;
                    return { success: true };
                },
                has: () => false
            },
            saveCampaignIndex: idx => {
                echtIndexCalls.push(idx);
            },
            console: console
        };
        vm.createContext(context);

        // ECHTE Migration zuerst — full-export.js schlaegt `migrateData` als
        // globale Funktion nach (full-export.js:149).
        vm.runInContext(
            fs.readFileSync(
                path.join(__dirname, '../../systems/spellslots/version-migration.js'),
                'utf8'
            ),
            context
        );
        vm.runInContext(
            fs.readFileSync(
                path.join(__dirname, '../../systems/migration/full-export.js'),
                'utf8'
            ),
            context
        );

        echtBuild = context.buildFullExport;
        echtImport = context.importFullExport;
    });

    test('Vorbedingung: der Kontext benutzt die ECHTE migrateData, keinen Identitaets-Stub', () => {
        const exportObj = echtBuild();
        const roh = exportObj.campaigns['dnd-tracker-data'].data;
        expect(roh._version).toBe('2.5.0');
        expect(roh.bestiary).toBeUndefined();
    });

    test('Import in neuerer Version: was gespeichert wird, ist das MIGRIERTE Ergebnis (nicht die Rohdaten)', () => {
        const exportObj = echtBuild();
        // Kopie ziehen: migrateData mutiert das Original in-place
        const rohVersion = exportObj.campaigns['dnd-tracker-data'].data._version;

        echtImport(exportObj);

        const gespeichert = echtGeschrieben['dnd-tracker-data'];
        expect(gespeichert).toBeDefined();
        // Der Rueckgabewert von migrateData MUSS der geschriebene Wert sein —
        // ein Aufruf, dessen Ergebnis verworfen wird, faellt hier auf.
        expect(gespeichert._version).toBe(ECHTE_VERSION);
        expect(rohVersion).toBe('2.5.0');
        expect(gespeichert._version).not.toBe(rohVersion);
        // Von den Migrationen 3.0.0 / 4.0.0 / 5.0.0 angelegte Container
        expect(gespeichert.bestiary).toEqual([]);
        expect(gespeichert.bestiaryFavorites).toEqual([]);
        expect(gespeichert.sessionPreps).toEqual([]);
        expect(gespeichert.factions).toEqual([]);
        expect(gespeichert.settings.levelingMode).toBe('xp');
        expect(gespeichert.characters[0].xp).toBe(0);
        // Nutzdaten bleiben erhalten
        expect(gespeichert.characters[0].name).toBe('Erste');
        // SRD bleibt auch nach der echten Migration draussen
        expect(gespeichert.spells).toBeUndefined();
    });

    test('Mehrere Kampagnen: JEDE Kampagne wird geschrieben und einzeln migriert', () => {
        const exportObj = echtBuild();
        expect(Object.keys(exportObj.campaigns)).toHaveLength(2);

        const result = echtImport(exportObj);

        expect(result.campaignCount).toBe(2);
        // campaignCount stammt aus der EINGABE — die Schreibseite separat pruefen
        const kampagnenKeys = Object.keys(echtGeschrieben)
            .filter(k => k !== 'dnd-dice-favorites')
            .sort();
        expect(kampagnenKeys).toEqual(['dnd-campaign-2', 'dnd-tracker-data']);
        expect(echtGeschrieben['dnd-campaign-2'].characters[0].name).toBe('Zweite');
        // ... und auch die nicht-aktive Kampagne ist migriert angekommen
        expect(echtGeschrieben['dnd-campaign-2']._version).toBe(ECHTE_VERSION);
        expect(echtGeschrieben['dnd-campaign-2'].bestiary).toEqual([]);
        expect(echtIndexCalls).toHaveLength(1);
    });

    test('_appVersion stammt aus APP_CONFIG.VERSION (kein hartkodierter Stempel)', () => {
        const exportObj = echtBuild();
        expect(exportObj._appVersion).toBe(ECHTE_VERSION);
        expect(exportObj._appVersion).not.toBe('2.7.0');
    });

    test('Ablehnung schreibt GAR NICHTS — auch keine Wuerfel-Favoriten (WR-04 vor der Pruefung)', () => {
        const bad = echtBuild();
        bad._exportType = 'irgendwas';
        expect(bad.diceFavorites.length).toBeGreaterThan(0);

        expect(() => echtImport(bad)).toThrow(/full-v1/);

        expect(Object.keys(echtGeschrieben)).toEqual([]);
        expect(echtIndexCalls).toHaveLength(0);
    });
});
