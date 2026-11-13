/**
 * Full-Export Tests — TECH-02 (Wave-0 RED-Phase)
 * Testet buildFullExport() und die Export-Schema-Regeln.
 * RED-Phase: Implementierung fehlt (Plan 02-03, Welle 2). Tests werden nach
 * Implementierung gruen (jest-Framework sammelt sie jetzt bereits ein).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
// importFullExport() ruft seit SENKEN die Datengrenze auf (Vertrag SENKEN R4) — der echte
// Block aus utils/basic.js, keine Attrappe
const { ladeDatengrenze } = require('./helpers/datengrenze-block.js');

// ============================================================
// SETUP: full-export.js in vm-Kontext laden (non-ESM-Muster)
// ============================================================

let buildFullExport;
// Plan 12-07 / SAFE-06: die Import-Gegenseite. Bisher war nur die Bauseite
// geprueft — nicht der Pfad, auf dem beim Umzug tatsaechlich Daten ankommen.
let importFullExport;
let writtenKeys; // Kampagnen- und Favoritenwrites
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

// Gespeicherte Zauber einschliesslich SRD und selbst angelegter Zauber.
const CAMPAIGN_DATA = {
    characters: [{ id: 1, name: 'Tester', class: 'Krieger' }],
    npcs: [{ id: 2, name: 'Gastgeber', role: 'NPC' }],
    locations: [],
    quests: [],
    settings: { theme: 'dark' },
    spells: [
        { id: 100, name: 'Feuerball', source: 'srd' },
        { id: 101, name: 'Heilen', source: 'srd' },
        { id: 102, name: 'Eigener Zauber' }
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
            loadFromIndexedDBFallbackRaw: jest.fn(async () => null),
            withCampaignIndexLock: work =>
                work(() => {}, rollback => rollback(() => {}), async operation =>
                    operation({ add: () => 1, getAll: () => ({ result: [] }), delete: () => {} })
                ),
            writeCampaignData: jest.fn(async (key, json) => {
                writtenKeys[key] = JSON.parse(json);
                return { success: true };
            }),
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
            getJSON: jest.fn((key, fallback) => {
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
            get: jest.fn((key, fallback) => {
                if (key === 'dnd-tracker-data') return JSON.stringify(CAMPAIGN_DATA);
                if (key === 'dnd-tracker-data_ts') return '1';
                return fallback;
            }),
            has: jest.fn(() => false)
        },
        // 12-07: Stubs, die importFullExport() nachschlaegt (bare oder ueber window)
        // F5: der Rueckgabewert wird jetzt geprueft — ein erfolgreicher Indexwrite
        // liefert {success: true}.
        saveCampaignIndex: jest.fn(idx => {
            savedIndexCalls.push(idx);
            return { success: true };
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
    ladeDatengrenze(context);

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
    test('buildFullExport enthaelt alle Kampagnen + Settings + diceFavorites + dmScreenProfiles', async () => {
        // RED-Phase: buildFullExport existiert noch nicht — expect schlaegt fehl und dokumentiert den Grund
        expect(typeof buildFullExport).toBe('function'); // Schlaegt fehl bis Plan 02-03 implementiert ist

        const result = await buildFullExport();

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

    test('Voll-Export erhaelt alle gespeicherten Zauber im Kampagnendatensatz', async () => {
        const result = await buildFullExport();
        const data = result.campaigns['dnd-tracker-data'].data;

        expect(data.characters).toHaveLength(1);
        expect(data.spells).toEqual(CAMPAIGN_DATA.spells);
        expect(result.spells).toBeUndefined();
    });

    test('fehlende benannte Kampagne wird nicht stillschweigend ausgelassen', async () => {
        getCampaignIndexMock.mockReturnValueOnce({
            campaigns: [{ key: 'dnd-campaign-1700000000000', name: 'Nicht lesbar' }],
            active: 'dnd-tracker-data'
        });

        await expect(buildFullExport()).rejects.toThrow(/Nicht lesbar|dnd-campaign-1700000000000/);
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
    test('importFullExport(buildFullExport()) stellt Kampagnen, Index und Wuerfel-Favoriten wieder her', async () => {
        const exportObj = await buildFullExport();
        const result = await importFullExport(exportObj);

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

    test('Versionsstempel: _appVersion kommt aus APP_CONFIG.VERSION, aelterer Stempel laeuft durch migrateData', async () => {
        const exportObj = await buildFullExport();
        expect(exportObj._appVersion).toBe('2.7.0'); // APP_CONFIG.VERSION im Kontext

        const alterExport = Object.assign({}, exportObj, { _appVersion: '2.5.0' });
        const result = await importFullExport(alterExport);

        expect(result.campaignCount).toBe(1);
        // migrateData laeuft je Kampagne — genau einmal hier
        expect(migrateCalls).toHaveLength(1);
        expect(migrateCalls[0].characters[0].name).toBe('Tester');
        expect(writtenKeys['dnd-tracker-data']).toBeDefined();
    });

    test('der Rundlauf erhaelt SRD- und selbst angelegte Zauber', async () => {
        const exportObj = await buildFullExport();
        await importFullExport(exportObj);

        expect(writtenKeys['dnd-tracker-data'].spells).toEqual(CAMPAIGN_DATA.spells);
    });

    describe('Ablehnungen — es wird nichts geschrieben, bevor geworfen wird', () => {
        // Hilfsfunktion: nur Kampagnen-Keys zaehlen (Favoriten liegen unter
        // eigenem Key und wuerden ohnehin erst nach der Schleife geschrieben)
        function geschriebeneKampagnenKeys() {
            return Object.keys(writtenKeys).filter(k => k !== 'dnd-dice-favorites');
        }

        test('falscher _exportType wird abgelehnt', async () => {
            const bad = Object.assign({}, await buildFullExport(), { _exportType: 'irgendwas' });
            await expect(importFullExport(bad)).rejects.toThrow(/full-v1/);
            expect(geschriebeneKampagnenKeys()).toHaveLength(0);
            expect(savedIndexCalls).toHaveLength(0);
        });

        test('fehlende campaigns werden abgelehnt', async () => {
            const bad = Object.assign({}, await buildFullExport());
            delete bad.campaigns;
            await expect(importFullExport(bad)).rejects.toThrow(/Kampagnendaten fehlen/);
            expect(geschriebeneKampagnenKeys()).toHaveLength(0);
            expect(savedIndexCalls).toHaveLength(0);
        });

        test('fehlender campaignIndex wird abgelehnt', async () => {
            const bad = Object.assign({}, await buildFullExport());
            delete bad.campaignIndex;
            await expect(importFullExport(bad)).rejects.toThrow(/Kampagnen-Index fehlt/);
            expect(geschriebeneKampagnenKeys()).toHaveLength(0);
            expect(savedIndexCalls).toHaveLength(0);
        });

        test('mehr als 100 Kampagnen werden abgelehnt (WR-03: Quota/DoS)', async () => {
            const bad = await buildFullExport();
            bad.campaigns = {};
            for (let i = 0; i < 101; i++) {
                bad.campaigns['dnd-campaign-' + i] = {
                    meta: { key: 'dnd-campaign-' + i, name: 'K' + i },
                    data: { characters: [] }
                };
            }
            await expect(importFullExport(bad)).rejects.toThrow(/Zu viele Kampagnen/);
            expect(geschriebeneKampagnenKeys()).toHaveLength(0);
            expect(savedIndexCalls).toHaveLength(0);
        });

        test('Key ausserhalb der erlaubten Praefixe wird abgelehnt', async () => {
            const bad = await buildFullExport();
            bad.campaigns = Object.assign({}, bad.campaigns, {
                'boeser-key': { meta: { key: 'boeser-key' }, data: { characters: [] } }
            });
            await expect(importFullExport(bad)).rejects.toThrow(/Unerwarteter Kampagnen-Key/);
            // Der gueltige Key darf ebenfalls NICHT geschrieben worden sein —
            // die Whitelist-Pruefung laeuft vollstaendig vor der Schreibschleife
            expect(geschriebeneKampagnenKeys()).toHaveLength(0);
            expect(savedIndexCalls).toHaveLength(0);
        });

        test('gueltige Kampagne gefolgt von Kampagne mit ungueltigem campaign.data wird VOLLSTAENDIG abgelehnt (CR-01)', async () => {
            const bad = await buildFullExport();
            // Insertions-Reihenfolge ist entscheidend: die gueltige Kampagne
            // ('dnd-tracker-data') steht ZUERST in campaigns, die kaputte DANACH —
            // das reproduziert exakt das CR-01-Szenario (Umzugsdatei mit gueltigen
            // Eintraegen gefolgt von einem fehlerhaften). Object.entries() erhaelt
            // die Einfuegereihenfolge der Datei.
            bad.campaigns = Object.assign({}, bad.campaigns, {
                // Ein Schluessel im Format der App (newCampaignKey): die Ablehnung soll an
                // den DATEN liegen, nicht an der Schluesselregel (SENKEN)
                'dnd-campaign-1700000000000': {
                    meta: { key: 'dnd-campaign-1700000000000', name: 'Kaputt' },
                    data: null
                }
            });
            await expect(importFullExport(bad)).rejects.toThrow(/hat keine gueltigen Daten/);
            // CR-01: Die VOR der kaputten Kampagne stehende, fuer sich genommen
            // gueltige Kampagne ('dnd-tracker-data') darf NICHT geschrieben worden
            // sein — sonst blieben verwaiste, aus dem Kampagnen-Index nicht mehr
            // erreichbare Daten in localStorage zurueck, obwohl der Wizard
            // "Import fehlgeschlagen" meldet (siehe describe-Block-Titel).
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
        const idxKeyWhitelist = src.indexOf('if (!istKampagnenKey(key))');
        const idxFirstWrite = src.indexOf('await window.writeCampaignData(');

        expect(idxKeyWhitelist).toBeGreaterThan(-1);

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
// ============================================================
// SENKEN (Gutachten, Sonde G): die Schluesselregel laesst nur die Formate zu, die die App
// selbst schreibt. Die fruehere Regel /^(dnd-tracker(-|$)|dnd-campaign-)/ liess JEDEN
// App-Schluessel durch: eine Kampagne 'dnd-tracker-backups' ueberschrieb ohne Fehler den
// localStorage-Rueckfall der Backups, und der Index uebernahm ihn als Kampagne.
// ============================================================
describe('SENKEN — Kampagnen- und Index-Schluessel nur im Format der App', () => {
    const FREMDE_APP_SCHLUESSEL = [
        'dnd-tracker-backups',
        'dnd-tracker-campaigns',
        'dnd-tracker-theme',
        'dnd-tracker-layout',
        'dnd-tracker-sync',
        'dnd-tracker-db',
        'dnd-tracker-v4_ts',
        'dnd-tracker-data_ts',
        'dnd-campaign-1700000000000_ts',
        'dnd-campaign-x',
        'dnd-campaign-',
        'dnd-tracker-v4x'
    ];
    const SCHLUESSEL_DER_APP = [
        'dnd-tracker-data', // APP_CONFIG.STORAGE_KEY dieser Werkbank
        'dnd-tracker-v4',
        'dnd-tracker',
        'dnd-campaign-1700000000000',
        'dnd-campaign-1700000000000-2'
    ];
    const mitKampagne = async key => {
        const datei = await buildFullExport();
        datei.campaigns = Object.assign({}, datei.campaigns, {
            [key]: { meta: { key, name: 'X' }, data: { npcs: [{ id: 9, name: 'Ueberschrieben' }] } }
        });
        return datei;
    };

    test.each(FREMDE_APP_SCHLUESSEL)('Kampagne unter %s wird abgelehnt, nichts geschrieben', async key => {
        await expect(importFullExport(await mitKampagne(key))).rejects.toThrow(/Unerwarteter Kampagnen-Key/);
        expect(Object.keys(writtenKeys).filter(k => k !== 'dnd-dice-favorites')).toEqual([]);
        expect(savedIndexCalls).toHaveLength(0);
    });

    test.each(SCHLUESSEL_DER_APP)('Kampagne unter %s wird geschrieben', async key => {
        await importFullExport(await mitKampagne(key));
        expect(writtenKeys[key]).toBeDefined();
    });

    test('ein Indexeintrag mit fremdem App-Schluessel faellt weg, ein gueltiger bleibt', async () => {
        const datei = await mitKampagne('dnd-campaign-1700000000000');
        datei.campaignIndex = {
            campaigns: [
                { key: 'dnd-tracker-backups', name: 'Backups als Kampagne' },
                { key: 'dnd-tracker-campaigns', name: 'Index als Kampagne' },
                { key: 'dnd-tracker-data', name: 'Standard-Kampagne' },
                { key: 'dnd-campaign-1700000000000', name: 'Benannt' }
            ],
            active: 'dnd-tracker-backups'
        };
        await importFullExport(datei);
        const index = savedIndexCalls[savedIndexCalls.length - 1];
        expect(index.campaigns.map(c => c.key)).toEqual(['dnd-tracker-data', 'dnd-campaign-1700000000000']);
        // `active` ausserhalb des Formats wird die Standard-Kampagne
        expect(index.active).toBe('dnd-tracker-data');
    });
});

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

    test('SEC-05 Test A: lokale Favoriten ueberleben, importierte kommen hinzu, lokale zuerst', async () => {
        diceFavoritesBacking = [
            { name: 'Initiative', notation: '1d20+3' },
            { name: 'Heiltrank', notation: '2d4+2' }
        ];
        const importObj = baueImport({
            diceFavorites: [{ name: 'Feuerball-Schaden', notation: '8d6' }],
            campaignIndex: { campaigns: [], active: 'dnd-tracker-data' }
        });

        const result = await importFullExport(importObj);

        expect(writtenKeys['dnd-dice-favorites']).toEqual([
            { name: 'Initiative', notation: '1d20+3' },
            { name: 'Heiltrank', notation: '2d4+2' },
            { name: 'Feuerball-Schaden', notation: '8d6' }
        ]);
        expect(result.preservedFavoritesCount).toBe(2);
    });

    test('SEC-05 Test B: wortgleicher Favorit (Name UND Notation) entsteht nicht doppelt', async () => {
        diceFavoritesBacking = [{ name: 'Initiative', notation: '1d20+3' }];
        const importObj = baueImport({
            diceFavorites: [{ name: 'Initiative', notation: '1d20+3' }],
            campaignIndex: { campaigns: [], active: 'dnd-tracker-data' }
        });

        await importFullExport(importObj);

        expect(writtenKeys['dnd-dice-favorites']).toEqual([{ name: 'Initiative', notation: '1d20+3' }]);
    });

    test('SEC-05 Test C: lokal keine Favoriten -> exakt das bisherige Verhalten (WR-04 bleibt erfuellt)', async () => {
        diceFavoritesBacking = [];
        const importObj = baueImport({
            diceFavorites: [{ name: 'Initiative', notation: '1d20+3' }],
            campaignIndex: { campaigns: [], active: 'dnd-tracker-data' }
        });

        await importFullExport(importObj);

        expect(writtenKeys['dnd-dice-favorites']).toEqual([{ name: 'Initiative', notation: '1d20+3' }]);
    });

    test('SEC-05 Test D: ein lokaler Index-Eintrag, den der Import nicht kennt, bleibt erhalten; active stammt aus dem Import', async () => {
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

        const result = await importFullExport(importObj);

        expect(savedIndexCalls[0].campaigns).toEqual([
            { key: 'dnd-tracker-data', name: 'Standard-Kampagne (importiert)' },
            { key: 'dnd-campaign-999', name: 'Nur lokal vorhandene Kampagne' }
        ]);
        expect(savedIndexCalls[0].active).toBe('dnd-tracker-data');
        expect(result.preservedIndexEntriesCount).toBe(1);
    });

    test('SEC-05 Test E: ueberschneidender Key -> der Import gewinnt (Name aus dem Import, nicht doppelt)', async () => {
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

        await importFullExport(importObj);

        expect(savedIndexCalls[0].campaigns).toEqual([
            { key: 'dnd-tracker-data', name: 'Neuer Name aus dem Import' }
        ]);
    });

    test('SEC-05 Test F: der Rueckgabewert nennt beide Zusammenfuehrungszahlen; campaignCount/totalBytes bleiben unveraendert', async () => {
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

        const result = await importFullExport(importObj);

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
                loadFromIndexedDBFallbackRaw: async () => null,
                withCampaignIndexLock: work =>
                    work(() => {}, rollback => rollback(() => {}), async operation =>
                        operation({ add: () => 1, getAll: () => ({ result: [] }), delete: () => {} })
                    ),
                writeCampaignData: async (key, json) => {
                    echtGeschrieben[key] = JSON.parse(json);
                    return { success: true };
                },
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
                get: (key, fallback) => {
                    if (key.endsWith('_ts') && quellen[key.slice(0, -3)] !== undefined) return '1';
                    return quellen[key] !== undefined ? JSON.stringify(quellen[key]) : fallback;
                },
                has: () => false
            },
            // F5: der Rueckgabewert wird jetzt geprueft
            saveCampaignIndex: idx => {
                echtIndexCalls.push(idx);
                return { success: true };
            },
            console: console
        };
        vm.createContext(context);
        ladeDatengrenze(context);

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

    test('Vorbedingung: der Kontext benutzt die ECHTE migrateData, keinen Identitaets-Stub', async () => {
        const exportObj = await echtBuild();
        const roh = exportObj.campaigns['dnd-tracker-data'].data;
        expect(roh._version).toBe('2.5.0');
        expect(roh.bestiary).toBeUndefined();
    });

    test('Import in neuerer Version: was gespeichert wird, ist das MIGRIERTE Ergebnis (nicht die Rohdaten)', async () => {
        const exportObj = await echtBuild();
        // Kopie ziehen: migrateData mutiert das Original in-place
        const rohVersion = exportObj.campaigns['dnd-tracker-data'].data._version;

        await echtImport(exportObj);

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
        expect(gespeichert.spells).toEqual(altKampagne('Erste').spells);
    });

    test('Mehrere Kampagnen: JEDE Kampagne wird geschrieben und einzeln migriert', async () => {
        const exportObj = await echtBuild();
        expect(Object.keys(exportObj.campaigns)).toHaveLength(2);

        const result = await echtImport(exportObj);

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

    test('_appVersion stammt aus APP_CONFIG.VERSION (kein hartkodierter Stempel)', async () => {
        const exportObj = await echtBuild();
        expect(exportObj._appVersion).toBe(ECHTE_VERSION);
        expect(exportObj._appVersion).not.toBe('2.7.0');
    });

    test('Ablehnung schreibt GAR NICHTS — auch keine Wuerfel-Favoriten (WR-04 vor der Pruefung)', async () => {
        const bad = await echtBuild();
        bad._exportType = 'irgendwas';
        expect(bad.diceFavorites.length).toBeGreaterThan(0);

        await expect(echtImport(bad)).rejects.toThrow(/full-v1/);

        expect(Object.keys(echtGeschrieben)).toEqual([]);
        expect(echtIndexCalls).toHaveLength(0);
    });
});
