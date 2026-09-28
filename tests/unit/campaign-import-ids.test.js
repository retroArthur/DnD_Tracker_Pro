/**
 * Ueberschreibender Kampagnen-Import ersetzt statt mischt — R03
 * (Code-Review 2026-09-21, Einheit U6)
 *
 * Der Zweig "Aktuelle Kampagne ueberschreiben" in importDataGlobal()
 * (systems/spellslots/import-export.js) mischte die Datei per Zuweisung in das laufende D:
 *   - Schluessel, die in der Datei fehlen, behielten die Werte der alten Kampagne (Fraktionen,
 *     Schnellnotizen, Sitzungsvorbereitungen) — auch _nextId, weil jeder Export ihn entfernt.
 *   - _version wurde geloescht und migrateData() lief nie: Alt-Exporte blieben unmigriert und
 *     wurden mit aktuellem Stempel gespeichert (auch nach dem Neuladen nie mehr migriert).
 *   - Falsche Typen (npcs: 'x'), Typ-, Umzugs- und fremde Dateien gelangten ungeprueft in D.
 *   - Doppelte/fehlende IDs aus der Datei blieben stehen; Kalender-Ereignisse wurden an der
 *     Import-Grenze nicht bereinigt.
 *   - "Abbrechen" (und Escape) im einzigen Dialog war der zerstoererische Zweig.
 * Dazu: executeImport() rief das nirgends definierte window.getNextId (Zusammenfuehren) bzw.
 * liess den Zaehler veraltet (Ersetzen), und validateDataIntegrity() reparierte bestehende
 * Doppel-IDs in verschachtelten Sammlungen nie und vergab numerische Zeichenketten-IDs ('5')
 * neu, statt sie umzuwandeln (Referenzen wie giverId liefen ins Leere).
 *
 * Entscheidung D3 = A: zwei native Dialoge — "OK = Als NEUE Kampagne importieren / Abbrechen =
 * weitere Optionen", danach "Aktuelle Kampagne ... ERSETZEN? OK = Ersetzen / Abbrechen = Import
 * abbrechen". Escape ist nie zerstoererisch.
 *
 * Werkbank: EIN vm-Kontext = window je "Seite" mit den ECHTEN Quelldateien in
 * Loader-Reihenfolge (auch systems/undo.js fuer den Rueckgaengig-Rundlauf). localStorage liegt
 * auf einer geteilten Map (eine zweite Seite ueber demselben Speicher = Neustart), IndexedDB ist
 * ein spec-nahes Double, setTimeout ist gefaelscht (das entprellte save() laeuft gezielt),
 * FileReader liefert das Promise seines onload-Handlers. window.STORAGE_KEY bildet die
 * Dedup-Entfernung von `const STORAGE_KEY = window.STORAGE_KEY` im Bundle nach.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { setImmediate: naechsterTask } = require('timers');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
// Loader-Reihenfolge (loader.js MODULES)
const MODULE = [
    'core/config.js',
    'core/data.js',
    'utils/basic.js',
    'utils/idb-tx.js',
    'utils/utilities.js',
    'systems/undo.js',
    'systems/spellslots/version-migration.js',
    'systems/spellslots/persistence.js',
    'systems/spellslots/quick-roll.js',
    'systems/spellslots/import-export.js',
    'systems/campaign-manager/campaign-manager.js',
    'render/helpers.js'
];

const STANDARD_KEY = 'dnd-tracker-v4';
const INDEX_KEY = 'dnd-tracker-campaigns';

const quelle = rel => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
const QUELLTEXT = Object.fromEntries(MODULE.map(rel => [rel, quelle(rel)]));
/** JSON-Rundlauf: Objekte aus dem vm-Realm vergleichbar machen. */
const plain = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

async function ruhe(n = 30) {
    for (let i = 0; i < n; i++) await new Promise(resolve => naechsterTask(resolve));
}

// ============================================================
// Doubles
// ============================================================

/** Gefaelschter setTimeout: nichts laeuft von selbst; laufen() arbeitet alles Faellige ab. */
function erzeugeTimer() {
    let naechsteId = 1;
    const offen = new Map();
    const geplant = [];
    return {
        setTimeout(fn, ms) {
            const id = naechsteId++;
            offen.set(id, { fn, ms });
            geplant.push(ms);
            return id;
        },
        clearTimeout(id) {
            offen.delete(id);
        },
        geplant,
        async laufen() {
            for (let runde = 0; runde < 20 && offen.size > 0; runde++) {
                const liste = Array.from(offen.values());
                offen.clear();
                for (const t of liste) await t.fn();
                await ruhe();
            }
        }
    };
}

/**
 * Minimales, spec-nahes IndexedDB-Double: Requests in eigenen Tasks, Schreibvorgaenge erst
 * beim Commit, readwrite-Commits loesen 'complete' aus. Fuer diese Datei genuegt der Gutfall
 * (load() liest hier hoechstens einen fehlenden Datensatz).
 */
function erzeugeFakeIdb() {
    const tabellen = new Map();
    const tab = name => {
        if (!tabellen.has(name)) tabellen.set(name, new Map());
        return tabellen.get(name);
    };
    function transaction(storeNames, mode) {
        const tx = { mode, error: null, oncomplete: null, onabort: null, onerror: null };
        const vorgemerkt = [];
        let offen = 0;
        let beendet = false;
        const planeCommit = () => {
            naechsterTask(() => {
                if (beendet || offen > 0) return;
                beendet = true;
                for (const s of vorgemerkt) {
                    if (s.op === 'put') tab(s.store).set(s.key, s.value);
                    else tab(s.store).delete(s.key);
                }
                if (typeof tx.oncomplete === 'function') tx.oncomplete({ target: tx });
            });
        };
        const anfrage = ausfuehren => {
            const req = { result: undefined, error: null, onsuccess: null, onerror: null };
            offen++;
            naechsterTask(() => {
                req.result = ausfuehren();
                offen--;
                if (typeof req.onsuccess === 'function') req.onsuccess({ target: req });
                planeCommit();
            });
            return req;
        };
        planeCommit();
        tx.abort = () => {
            beendet = true;
        };
        tx.objectStore = name => ({
            put: wert => {
                const v = plain(wert);
                return anfrage(() => {
                    vorgemerkt.push({ store: name, op: 'put', key: v.id, value: v });
                    return v.id;
                });
            },
            delete: key =>
                anfrage(() => {
                    vorgemerkt.push({ store: name, op: 'delete', key });
                }),
            get: key => anfrage(() => plain(tab(name).get(key)))
        });
        return tx;
    }
    return {
        db: { transaction, objectStoreNames: { contains: () => true }, close() {} },
        tab
    };
}

function erzeugeLocalStorage(store) {
    return {
        getItem: k => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => {
            store.set(k, String(v));
        },
        removeItem: k => {
            store.delete(k);
        },
        clear: () => store.clear(),
        key: i => {
            const keys = Array.from(store.keys());
            return i < keys.length ? keys[i] : null;
        },
        get length() {
            return store.size;
        }
    };
}

// ============================================================
// Werkbank
// ============================================================

/** Geteilter Speicher: localStorage-Map + IndexedDB-Double (eine zweite Seite = Neustart). */
function erzeugeSpeicher(eintraege = {}) {
    return { ls: new Map(Object.entries(eintraege)), fake: erzeugeFakeIdb() };
}

function erzeugeSeite(speicher = erzeugeSpeicher()) {
    const timer = erzeugeTimer();
    const toasts = [];
    const confirms = [];
    const alerts = [];
    const antworten = [];
    const elemente = {};
    const seite = {
        speicher,
        timer,
        toasts,
        confirms,
        alerts,
        antworten,
        elemente,
        lesen: null,
        lesevorgaenge: []
    };

    const ctx = {
        console,
        Blob,
        DOMParser,
        Node,
        document,
        setTimeout: timer.setTimeout,
        clearTimeout: timer.clearTimeout,
        setInterval: () => 0,
        clearInterval: () => {},
        structuredClone: typeof structuredClone === 'function' ? structuredClone : plain
    };
    ctx.window = ctx;
    ctx.self = ctx;
    ctx.localStorage = erzeugeLocalStorage(speicher.ls);
    ctx.indexedDB = {};
    ctx.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
    ctx.debugLogAdd = jest.fn();
    ctx.log = () => {};
    vm.createContext(ctx);
    for (const rel of MODULE) vm.runInContext(QUELLTEXT[rel], ctx, { filename: rel });

    // Bundle-Dedup nachbilden: die funktionslokalen STORAGE_KEY-Aliasse lesen window.STORAGE_KEY
    ctx.STORAGE_KEY = STANDARD_KEY;
    ctx.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
    ctx.idb = speicher.fake.db;
    ctx.initIndexedDB = jest.fn(async () => {
        ctx.idb = speicher.fake.db;
        return speicher.fake.db;
    });
    ctx.$ = id => (Object.prototype.hasOwnProperty.call(elemente, id) ? elemente[id] : null);
    ctx.showToast = jest.fn((m, typ) => toasts.push({ text: String(m), typ: typ || 'success' }));
    ctx.confirm = jest.fn(m => {
        confirms.push(String(m));
        return antworten.length > 0 ? antworten.shift() : false;
    });
    ctx.alert = jest.fn(m => alerts.push(String(m)));
    ctx.location = {
        pathname: '/dnd-tracker.html',
        href: 'file:///dnd-tracker.html',
        reload: jest.fn()
    };
    ctx.renderAll = jest.fn();
    ctx.updateSaveIndicator = jest.fn();
    ctx.broadcastSave = jest.fn();
    ctx.stopAllTracks = jest.fn();
    ctx.hideModal = jest.fn();
    ctx.getSpellSlotsForClass = jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0]);
    // systems/backups.js ist nicht geladen: Sicherheitskopie als beobachtbare Attrappe
    ctx.createAutoBackup = jest.fn(() => Promise.resolve('written'));
    ctx.reportSafetyBackup = jest.fn(async status => status);
    // Echter Undo-Stapel (systems/undo.js), aber beobachtbar
    const echtesSaveUndoState = ctx.saveUndoState;
    ctx.saveUndoState = jest.fn(aktion => echtesSaveUndoState(aktion));
    ctx.FileReader = class {
        readAsText(datei) {
            seite.lesen = Promise.resolve().then(() =>
                this.onload({ target: { result: datei.__text } })
            );
            seite.lesevorgaenge.push(seite.lesen);
        }
    };
    seite.ctx = ctx;
    return seite;
}

/** Was core/init.js vor dem Rendern tut: aktive Kampagne aus dem Index, dann das echte load(). */
async function boote(seite) {
    const index = seite.ctx.getCampaignIndex();
    const aktiv = index && index.active ? index.active : STANDARD_KEY;
    if (aktiv !== STANDARD_KEY) seite.ctx.STORAGE_KEY_OVERRIDE = aktiv;
    await seite.ctx.load();
    await ruhe();
    return seite;
}

/**
 * Gespeicherter, bereits gueltiger Kampagnenstand (wie ein E2E-Seed): initializeData() plus die
 * Schluessel, die erst der Start anlegt, voller Zaehlersatz, aktueller Stempel — load() muss
 * daran nichts reparieren.
 */
function gespeicherterStand(extra = {}) {
    const bau = erzeugeSeite();
    const d = bau.ctx.initializeData();
    Object.assign(d, { randomTables: [], timers: [], shops: [], campaign: {} }, plain(extra));
    d._version = bau.ctx.APP_CONFIG.VERSION;
    bau.ctx.recomputeNextIds(d);
    return plain(d);
}

function speicherMitStand(extra = {}) {
    const stand = gespeicherterStand(extra);
    return erzeugeSpeicher({
        [STANDARD_KEY]: JSON.stringify(stand),
        [STANDARD_KEY + '_ts']: String(Date.now() - 60000)
    });
}

/** Spielt eine Datei ueber den echten Eintrittspunkt (#import-file) ein. */
async function importiere(seite, payload, opt = {}) {
    // Antworten gelten nur fuer DIESEN Import (keine Reste aus einem frueheren Durchlauf)
    seite.antworten.length = 0;
    seite.antworten.push(...(opt.antworten || []));
    const dateiname = opt.dateiname || 'kampagne-2026-09-22.json';
    const eingabe = {
        files: [
            { name: dateiname, __text: opt.text !== undefined ? opt.text : JSON.stringify(payload) }
        ],
        value: 'C:\\fakepath\\' + dateiname
    };
    seite.elemente['import-file'] = eingabe;
    seite.ctx.importDataGlobal();
    await seite.lesen;
    await ruhe();
    // entprelltes save() (300 ms) gezielt ausfuehren
    await seite.timer.laufen();
    return eingabe;
}

const gespeichert = seite => JSON.parse(seite.speicher.ls.get(STANDARD_KEY));
const ids = liste => liste.map(x => x.id);

/** Erfasst die Datei, die der echte Exporter exportAllDataAsFile() schreiben wuerde. */
function exportiere(seite) {
    const ctx = seite.ctx;
    let text = null;
    const echtesBlob = ctx.Blob;
    const echtesDokument = ctx.document;
    ctx.Blob = class {
        constructor(teile) {
            text = teile.join('');
        }
    };
    ctx.URL = { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} };
    ctx.document = { createElement: () => ({ click() {}, href: '', download: '' }) };
    try {
        ctx.exportAllDataAsFile();
    } finally {
        ctx.Blob = echtesBlob;
        ctx.document = echtesDokument;
    }
    return JSON.parse(text);
}

const VERSION = erzeugeSeite().ctx.APP_CONFIG.VERSION;

// ============================================================
// C1/C2 — Review-Tests: Zaehler und Ersetzen statt Mischen
// ============================================================

describe('R03 — Ueberschreiben ersetzt die Kampagne (Review-Tests)', () => {
    test('C1: Export ohne _nextId in eine gebootete Kampagne — gespeicherte Zaehler liegen ueber allen importierten IDs', async () => {
        // Quelle: echte nextId-Vergabe, echter Exporter (entfernt _nextId)
        const quelleSeite = erzeugeSeite();
        const q = quelleSeite.ctx;
        q.D.npcs.push({ id: q.nextId('npcs'), name: 'Import-NPC A' });
        q.D.npcs.push({ id: q.nextId('npcs'), name: 'Import-NPC B' });
        q.D.calendar.events.push({ id: q.nextId('calendarEvents'), titel: 'Fest' });
        q.D.initiative.combatants.push({ id: q.nextId('combatants'), name: 'Ork' });
        const datei = exportiere(quelleSeite);
        expect(datei._nextId).toBeUndefined();

        // Ziel: gebootete Kampagne ohne NPCs, Zaehler npcs = 1 (Vorbedingung)
        const ziel = await boote(erzeugeSeite(speicherMitStand()));
        expect(ziel.ctx.D._nextId.npcs).toBe(1);

        await importiere(ziel, datei, { antworten: [false, true] });

        expect(ziel.alerts).toEqual([]);
        const persistiert = gespeichert(ziel);
        expect(ids(persistiert.npcs)).toEqual([1, 2]);
        expect(persistiert._nextId.npcs).toBeGreaterThanOrEqual(3);
        expect(persistiert._nextId.calendarEvents).toBeGreaterThanOrEqual(2);
        expect(persistiert._nextId.combatants).toBeGreaterThanOrEqual(2);

        expect([1, 2]).not.toContain(ziel.ctx.nextId('npcs'));
        expect([1]).not.toContain(ziel.ctx.nextId('calendarEvents'));
        expect([1]).not.toContain(ziel.ctx.nextId('combatants'));
    });

    test('C2: Bereiche, die in der Datei fehlen, stehen danach auf den initializeData()-Standardwerten (D und Speicher)', async () => {
        const ziel = await boote(
            erzeugeSeite(
                speicherMitStand({
                    factions: [{ id: 1, name: 'Alte Gilde' }],
                    sessionPreps: [{ id: 1, sessionNr: 3 }],
                    quickNotes: 'alt',
                    storyArcs: [{ id: 1, name: 'Alter Bogen' }]
                })
            )
        );
        expect(ziel.ctx.D.factions[0].name).toBe('Alte Gilde');

        await importiere(
            ziel,
            { _campaignName: 'Neu', _version: VERSION, npcs: [{ id: 1, name: 'Neuer NPC' }] },
            { antworten: [false, true] }
        );

        const standard = plain(ziel.ctx.initializeData());
        const persistiert = gespeichert(ziel);
        for (const key of ['factions', 'sessionPreps', 'quickNotes', 'storyArcs']) {
            expect(plain(ziel.ctx.D[key])).toEqual(standard[key]);
            expect(persistiert[key]).toEqual(standard[key]);
        }
        expect(persistiert.npcs.map(n => n.name)).toEqual(['Neuer NPC']);
    });

    // Korrekturrunde zum Code-Review 2026-09-21 (F5, U5 minor:6): Pin fuer die
    // Sicherheitskopie des Ueberschreib-Zweigs (import-export.js:829). Der bestehende
    // Quelltext-Pin in import-sanitization.test.js prueft nur die Reihenfolge
    // "createAutoBackup( vor replaceCampaignData(" — die alte, luegende Form
    // (createAutoBackup() ohne reason plus bedingungsloses
    // '💾 Sicherheitskopie erstellt') ueberlebt ihn.
    test('C1b (Pin): der Ueberschreib-Zweig erfasst den VOR-Import-Stand als Sicherheitskopie und meldet erst deren echtes Ergebnis', async () => {
        const ziel = await boote(
            erzeugeSeite(speicherMitStand({ factions: [{ id: 1, name: 'Alte Gilde' }] }))
        );
        let erfasst = null;
        ziel.ctx.createAutoBackup = jest.fn(() => {
            erfasst = JSON.stringify(ziel.ctx.D);
            return Promise.resolve('written');
        });

        await importiere(
            ziel,
            { _campaignName: 'Neu', _version: VERSION, npcs: [{ id: 1, name: 'Neuer NPC' }] },
            { antworten: [false, true] }
        );

        expect(ziel.ctx.createAutoBackup).toHaveBeenCalledTimes(1);
        expect(ziel.ctx.createAutoBackup).toHaveBeenCalledWith({ reason: 'safety' });
        // synchron beim Aufruf erfasst, also VOR dem Ersetzen
        expect(erfasst).toContain('Alte Gilde');
        expect(ziel.ctx.reportSafetyBackup).toHaveBeenCalledTimes(1);
        expect(ziel.ctx.reportSafetyBackup.mock.calls[0][0]).toBe(
            ziel.ctx.createAutoBackup.mock.results[0].value
        );
        // keine bedingungslose Erfolgsmeldung — reportSafetyBackup meldet das Ergebnis
        expect(ziel.toasts.map(t => t.text)).not.toContain('💾 Sicherheitskopie erstellt');
    });
});

// ============================================================
// C3 — Migration wie load()
// ============================================================

describe('R03 — Alt-Exporte werden migriert (wie load())', () => {
    test.each([
        [
            "'2.3.0'",
            {
                _version: '2.3.0',
                characters: [{ id: 1, name: 'Alt', level: 3, characterClass: 'Magier' }],
                calendar: { day: 1, month: 0, year: 1492, events: [] }
            },
            false
        ],
        [
            "'2.11' mit Zustaenden als Zeichenketten",
            {
                _version: '2.11',
                characters: [{ id: 1, name: 'Vergiftet', conditions: ['poisoned'] }]
            },
            true
        ]
    ])(
        'C3: Stempel %s — migriert, aktuell gestempelt, auch nach dem Neuladen',
        async (_n, payload, mitZustand) => {
            const ziel = await boote(erzeugeSeite(speicherMitStand()));
            await importiere(ziel, payload, { antworten: [false, true] });
            expect(ziel.alerts).toEqual([]);

            const pruefe = d => {
                const held = d.characters[0];
                expect(held.xp).toBe(0);
                expect(Array.isArray(held.spellSlotsUsed)).toBe(true);
                expect(d.calendar.month).toBeGreaterThanOrEqual(1);
                expect(d._version).toBe(VERSION);
                if (mitZustand) {
                    expect(held.conditions).toHaveLength(1);
                    expect(typeof held.conditions[0]).toBe('object');
                    expect(held.conditions[0].type).toBe('poisoned');
                }
            };
            pruefe(plain(ziel.ctx.D));

            // Neustart ueber demselben Speicher: der gespeicherte Stand ist bereits migriert
            const neu = await boote(erzeugeSeite(ziel.speicher));
            pruefe(plain(neu.ctx.D));
        }
    );
});

// ============================================================
// C4 — Plausibilitaets-Gate und Atomaritaet
// ============================================================

describe('R03 — ungueltige Dateien werden abgelehnt, bevor irgendetwas angefasst wird', () => {
    test.each([
        ["npcs: 'x'", { npcs: 'x' }, 'Keine Kampagnendaten gefunden'],
        [
            'Einzel-Export (_dataType/data)',
            { _dataType: 'npcs', _campaignName: 'X', data: [{ id: 1, name: 'A' }] },
            'Einzel-Export – bitte im jeweiligen Reiter importieren'
        ],
        [
            'Umzugs-Export full-v1',
            { _exportType: 'full-v1', campaigns: {}, campaignIndex: {} },
            'Umzugs- oder Audio-Export – bitte über den Umzugs-Assistenten importieren'
        ],
        [
            'Audio-Export',
            { _exportType: 'audio-export-v1', audioFiles: [] },
            'Umzugs- oder Audio-Export – bitte über den Umzugs-Assistenten importieren'
        ],
        ['nur Einstellungen', { settings: { theme: 'light' } }, 'Keine Kampagnendaten gefunden'],
        ['fremdes JSON', { foo: 1 }, 'Keine Kampagnendaten gefunden'],
        [
            'randomTables als Objekt',
            { npcs: [], randomTables: {} },
            'Ungültiger Datentyp für "randomTables"'
        ],
        [
            'calendar.events kein Array',
            { npcs: [], calendar: { events: 'x' } },
            'Ungültiger Datentyp für "calendar.events"'
        ],
        ['JSON null', null, 'Ungültige Importdatei'],
        ['JSON-Array', [], 'Ungültige Importdatei']
    ])(
        'C4: %s — Hinweis, D/Speicher/Index unveraendert, kein Dialog, kein Undo, keine Kopie',
        async (_n, payload, grund) => {
            const ziel = await boote(
                erzeugeSeite(
                    speicherMitStand({ npcs: [{ id: 1, name: 'Bleibt' }], quickNotes: 'bleibt' })
                )
            );
            const dVorher = plain(ziel.ctx.D);
            const lsVorher = new Map(ziel.speicher.ls);

            const eingabe = await importiere(ziel, payload, { antworten: [false, true] });

            expect(ziel.alerts).toEqual(['Fehler: ' + grund]);
            expect(plain(ziel.ctx.D)).toEqual(dVorher);
            expect(new Map(ziel.speicher.ls)).toEqual(lsVorher);
            expect(ziel.ctx.confirm).not.toHaveBeenCalled();
            expect(ziel.ctx.saveUndoState).not.toHaveBeenCalled();
            expect(ziel.ctx.createAutoBackup).not.toHaveBeenCalled();
            expect(ziel.ctx.location.reload).not.toHaveBeenCalled();
            expect(eingabe.value).toBe('');
        }
    );

    test('C4: kein gueltiges JSON — deutscher Hinweis, nichts angefasst', async () => {
        const ziel = await boote(erzeugeSeite(speicherMitStand()));
        const dVorher = plain(ziel.ctx.D);
        await importiere(ziel, null, { text: '{kaputt', antworten: [false, true] });
        expect(ziel.alerts).toEqual(['Fehler: Datei ist kein gültiges JSON']);
        expect(plain(ziel.ctx.D)).toEqual(dVorher);
        expect(ziel.ctx.confirm).not.toHaveBeenCalled();
    });

    test("C4 (Schutz): numerisches _version (2.6) importiert ohne 'v1.split'-Fehler", async () => {
        const ziel = await boote(erzeugeSeite(speicherMitStand()));
        await importiere(
            ziel,
            { npcs: [{ id: 1, name: 'A' }], _version: 2.6 },
            { antworten: [false, true] }
        );
        expect(ziel.alerts).toEqual([]);
        expect(ziel.ctx.D.npcs.map(n => n.name)).toEqual(['A']);
        expect(ziel.ctx.D._version).toBe(VERSION);
    });
});

// ============================================================
// C5/C6 — Zaehler aus der Datei, IDs aus der Datei
// ============================================================

describe('R03 — Zaehler und IDs aus der Datei', () => {
    test('C5 (Schutz): gueltiger Datei-Zaehler {npcs: 9} ueber max(ID) 1 wird als Untergrenze geehrt', async () => {
        const ziel = await boote(erzeugeSeite(speicherMitStand()));
        await importiere(
            ziel,
            { _version: VERSION, npcs: [{ id: 1, name: 'A' }], _nextId: { npcs: 9 } },
            { antworten: [false, true] }
        );
        expect(ziel.ctx.nextId('npcs')).toBe(9);
    });

    test('C5: absurder Datei-Zaehler {npcs: 1e300} — gespeicherter Zaehler ist eine sichere Ganzzahl, neue IDs 2 und 3', async () => {
        const ziel = await boote(erzeugeSeite(speicherMitStand()));
        await importiere(
            ziel,
            { _version: VERSION, npcs: [{ id: 1, name: 'A' }], _nextId: { npcs: 1e300 } },
            { antworten: [false, true] }
        );
        const zaehler = gespeichert(ziel)._nextId.npcs;
        expect(Number.isSafeInteger(zaehler)).toBe(true);
        expect(zaehler).toBe(2);
        expect(ziel.ctx.nextId('npcs')).toBe(2);
        expect(ziel.ctx.nextId('npcs')).toBe(3);
    });

    test("C6: doppelte, fehlende und Zeichenketten-IDs werden eindeutig; die erste 4 bleibt, '7' wird 7; Warnhinweis", async () => {
        const ziel = await boote(erzeugeSeite(speicherMitStand()));
        await importiere(
            ziel,
            {
                _version: VERSION,
                npcs: [
                    { id: 4, name: 'A' },
                    { id: 4, name: 'B' },
                    { name: 'ohne id' },
                    { id: '7', name: 'C' }
                ]
            },
            { antworten: [false, true] }
        );
        const npcs = plain(ziel.ctx.D.npcs);
        const alle = ids(npcs);
        expect(alle.every(id => Number.isSafeInteger(id) && id > 0)).toBe(true);
        expect(new Set(alle).size).toBe(alle.length);
        expect(npcs[0]).toEqual({ id: 4, name: 'A' });
        expect(npcs[3]).toEqual({ id: 7, name: 'C' });
        expect(ids(gespeichert(ziel).npcs)).toEqual(alle);
        const warnung = ziel.toasts.find(
            t => t.typ === 'warning' && /IDs beim Import neu vergeben/.test(t.text)
        );
        expect(warnung).toBeDefined();
    });
});

// ============================================================
// C7/C8 — Rueckgaengig und wiederholte Importe
// ============================================================

describe('R03 — Rueckgaengig und wiederholte Importe', () => {
    test('C7 (Schutz): Import, dann echtes undo() — D entspricht exakt dem Stand vor dem Import, IDs bleiben eindeutig', async () => {
        const ziel = await boote(
            erzeugeSeite(
                speicherMitStand({
                    npcs: [
                        { id: 1, name: 'Alt 1' },
                        { id: 2, name: 'Alt 2' }
                    ],
                    factions: [{ id: 1, name: 'Alte Gilde' }]
                })
            )
        );
        const vorher = plain(ziel.ctx.D);
        await importiere(
            ziel,
            { _version: VERSION, npcs: [{ id: 1, name: 'Neu' }] },
            { antworten: [false, true] }
        );
        expect(ziel.ctx.D.npcs.map(n => n.name)).toEqual(['Neu']);

        ziel.ctx.undo();
        await ruhe();
        expect(plain(ziel.ctx.D)).toEqual(vorher);
        const neu = ziel.ctx.nextId('npcs');
        expect([1, 2]).not.toContain(neu);
    });

    test('C8 (Schutz): zwei Importe in einer Sitzung mit einem neuen NPC dazwischen — IDs durchgehend eindeutig', async () => {
        const ziel = await boote(erzeugeSeite(speicherMitStand()));
        const eindeutig = () => {
            const alle = ids(ziel.ctx.D.npcs);
            expect(new Set(alle).size).toBe(alle.length);
        };
        await importiere(
            ziel,
            {
                _version: VERSION,
                npcs: [
                    { id: 1, name: 'A' },
                    { id: 2, name: 'B' }
                ]
            },
            { antworten: [false, true] }
        );
        ziel.ctx.D.npcs.push({ id: ziel.ctx.nextId('npcs'), name: 'Dazwischen' });
        eindeutig();
        await importiere(
            ziel,
            {
                _version: VERSION,
                npcs: [
                    { id: 1, name: 'X' },
                    { id: 2, name: 'Y' },
                    { id: 3, name: 'Z' }
                ]
            },
            { antworten: [false, true] }
        );
        eindeutig();
        ziel.ctx.D.npcs.push({ id: ziel.ctx.nextId('npcs'), name: 'Danach' });
        eindeutig();
        expect(ids(ziel.ctx.D.npcs)).toEqual([1, 2, 3, 4]);
    });
});

// ============================================================
// C9/C10 — App-Einstellungen, Kalender-Bereinigung
// ============================================================

describe('R03 — Einstellungen und Import-Grenze', () => {
    test('C9 (Schutz): fehlen der Datei die Einstellungen, bleiben die aktuellen; enthaelt sie welche, gewinnen sie', async () => {
        const ziel = await boote(
            erzeugeSeite(speicherMitStand({ settings: { theme: 'light', lastView: 'wiki' } }))
        );
        await importiere(ziel, { _version: VERSION, npcs: [] }, { antworten: [false, true] });
        expect(ziel.ctx.D.settings.theme).toBe('light');

        await importiere(
            ziel,
            { _version: VERSION, npcs: [], settings: { theme: 'dark', lastView: 'npcs' } },
            { antworten: [false, true] }
        );
        expect(ziel.ctx.D.settings.theme).toBe('dark');
        expect(ziel.ctx.D.settings.lastView).toBe('npcs');
    });

    test.each([
        ['Ueberschreiben', [false, true]],
        ['Neue Kampagne', [true]]
    ])(
        'C10: Kalender-Ereignis mit Skript in beschreibung wird an der Import-Grenze bereinigt (%s)',
        async (_n, antworten) => {
            const ziel = await boote(erzeugeSeite(speicherMitStand()));
            await importiere(
                ziel,
                {
                    _version: VERSION,
                    npcs: [],
                    calendar: {
                        day: 1,
                        month: 1,
                        year: 1492,
                        events: [
                            {
                                id: 1,
                                titel: 'Fest',
                                typ: 'manuell',
                                beschreibung:
                                    '<img src=x onerror="window.__xssKalender = 1">Text<script>window.__xssKalender = 2</script>'
                            }
                        ]
                    }
                },
                { antworten }
            );
            expect(ziel.alerts).toEqual([]);
            let events;
            if (antworten[0] === true) {
                const index = JSON.parse(ziel.speicher.ls.get(INDEX_KEY));
                events = JSON.parse(ziel.speicher.ls.get(index.active)).calendar.events;
            } else {
                events = plain(ziel.ctx.D.calendar.events);
            }
            expect(events[0].beschreibung).toContain('Text');
            expect(events[0].beschreibung).not.toMatch(/onerror/i);
            expect(events[0].beschreibung).not.toMatch(/<script/i);
        }
    );
});

// ============================================================
// C11 — Dialoge (D3 = A)
// ============================================================

describe('R03 — zwei Dialoge, Abbrechen ist nie zerstoererisch (D3)', () => {
    test('C11: Abbrechen, dann Abbrechen — nichts angefasst, kein Undo-Punkt, keine Sicherheitskopie', async () => {
        const ziel = await boote(
            erzeugeSeite(speicherMitStand({ npcs: [{ id: 1, name: 'Bleibt' }] }))
        );
        const dVorher = plain(ziel.ctx.D);
        const lsVorher = new Map(ziel.speicher.ls);

        const eingabe = await importiere(
            ziel,
            { _version: VERSION, npcs: [{ id: 1, name: 'Soll nicht ankommen' }] },
            { antworten: [false, false] }
        );

        expect(ziel.confirms).toHaveLength(2);
        expect(ziel.confirms[0]).toContain('OK = Als NEUE Kampagne importieren');
        expect(ziel.confirms[0]).toContain('Abbrechen = weitere Optionen');
        expect(ziel.confirms[1]).toContain('Standard-Kampagne');
        expect(ziel.confirms[1]).toContain('ERSETZEN');
        expect(ziel.confirms[1]).toContain('Abbrechen = Import abbrechen');
        expect(plain(ziel.ctx.D)).toEqual(dVorher);
        expect(new Map(ziel.speicher.ls)).toEqual(lsVorher);
        expect(ziel.ctx.saveUndoState).not.toHaveBeenCalled();
        expect(ziel.ctx.createAutoBackup).not.toHaveBeenCalled();
        expect(ziel.alerts).toEqual([]);
        expect(eingabe.value).toBe('');
    });
});

// ============================================================
// C12 — Bestandsschaeden beim Laden reparieren
// ============================================================

// Datenform der E2E-Seeds (tests/e2e/helpers/test-utils.js: seedCleanSession/seedPopulatedSession)
const SEED_EINSTELLUNGEN = {
    theme: 'dark',
    lastView: 'dashboard',
    enableMarkdownShortcuts: true,
    enableMarkdownImportExport: true,
    markdownOnboardingSeen: true,
    levelingMode: 'xp'
};
const SEED_ZAEHLER = {
    characters: 1,
    npcs: 1,
    locations: 1,
    quests: 1,
    encounters: 1,
    spells: 1,
    loot: 1,
    items: 1,
    wiki: 1,
    sessionNotes: 1,
    randomTables: 1
};
const SEED_CLEAN = {
    _version: '99.0.0',
    settings: SEED_EINSTELLUNGEN,
    randomTables: [],
    timers: [],
    shops: [],
    campaign: {},
    _nextId: SEED_ZAEHLER
};
const SEED_POPULATED = {
    _version: '99.0.0',
    settings: SEED_EINSTELLUNGEN,
    randomTables: [],
    timers: [],
    campaign: {},
    characters: [
        {
            id: 1,
            name: 'Testzauberin',
            characterClass: 'Magier',
            level: 5,
            hpCurrent: 30,
            hpMax: 30,
            spellSlots: { 0: { max: 2, current: 2 }, 1: { max: 4, current: 2 } }
        }
    ],
    npcs: [{ id: 1, name: 'Testhaendler', role: 'Merchant' }],
    locations: [{ id: 1, name: 'Testort' }],
    shops: [
        {
            id: 1,
            type: 'laden',
            name: 'Testladen',
            npcId: 1,
            locationId: 1,
            items: [
                { name: 'Trank', category: 'misc', cost: '10 gp', available: false, quantity: 1 },
                { name: 'Schwert', category: 'weapon', cost: '15 gp', quantity: 1 }
            ]
        }
    ],
    factions: [
        {
            id: 1,
            name: 'Testfraktion',
            ruf: 5,
            rufHistorie: [
                { delta: 10, grund: 'plus', zeitstempel: 1 },
                { delta: -5, grund: 'minus', zeitstempel: 2 }
            ],
            mitgliederNpcIds: []
        }
    ],
    initiative: {
        combatants: [
            {
                id: 1,
                name: 'Testmob',
                initiative: 15,
                maxHp: 40,
                currentHp: 40,
                statblockRef: { source: 'srd', id: 'goblin' },
                mob: {
                    count: 5,
                    poolHp: 40,
                    maxPoolHp: 40,
                    individualMaxHp: 8,
                    attackMode: 'nfach'
                }
            }
        ],
        currentTurn: 0,
        round: 1
    },
    _nextId: Object.assign({}, SEED_ZAEHLER, { characters: 2, npcs: 2, locations: 2 })
};

describe('R03 — bestehende Schaeden werden beim Laden repariert (validateDataIntegrity)', () => {
    test("C12: doppelte Kalender-/Kampf-IDs werden eindeutig, NPC-ID '5' wird zur Zahl 5, giverId 5 bleibt aufloesbar", async () => {
        const speicher = speicherMitStand();
        const stand = JSON.parse(speicher.ls.get(STANDARD_KEY));
        stand.calendar.events = [
            { id: 1, titel: 'A' },
            { id: 1, titel: 'B' }
        ];
        stand.initiative.combatants = [
            { id: 2, name: 'X' },
            { id: 2, name: 'Y' }
        ];
        stand.npcs = [{ id: '5', name: 'Wirt' }];
        stand.quests = [{ id: 1, title: 'Auftrag', giverId: 5 }];
        speicher.ls.set(STANDARD_KEY, JSON.stringify(stand));

        const seite = await boote(erzeugeSeite(speicher));
        const d = plain(seite.ctx.D);
        const ev = ids(d.calendar.events);
        const cb = ids(d.initiative.combatants);
        expect(new Set(ev).size).toBe(2);
        expect(new Set(cb).size).toBe(2);
        expect(ev[0]).toBe(1);
        expect(cb[0]).toBe(2);
        expect(d.npcs[0].id).toBe(5);
        expect(d.npcs.find(n => n.id === d.quests[0].giverId).name).toBe('Wirt');
        // Reparatur wird gespeichert (verzoegertes save() nach load())
        expect(seite.timer.geplant).toContain(1000);
    });

    test.each([
        ['seedCleanSession', SEED_CLEAN],
        ['seedPopulatedSession', SEED_POPULATED]
    ])(
        'C12 (Schutz): %s-Form loest KEINE Reparatur und damit kein Reparatur-save() aus',
        async (_n, seed) => {
            const speicher = erzeugeSpeicher({ [STANDARD_KEY]: JSON.stringify(seed) });
            const seite = await boote(erzeugeSeite(speicher));
            expect(seite.timer.geplant).not.toContain(1000);
            expect(seite.ctx.validateDataIntegrity().valid).toBe(true);
        }
    );
});

// ============================================================
// C13/C14 — Typ-Import (executeImport) und Pfad-Register
// ============================================================

describe('R03 — executeImport() und Pfad-Register', () => {
    function mitImportModal(seite, typ, items, modus) {
        seite.elemente['import-modal'] = {
            dataset: { importItems: JSON.stringify(items), dataType: typ }
        };
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'import-mode';
        radio.value = modus;
        radio.checked = true;
        document.body.appendChild(radio);
        return () => radio.remove();
    }

    test("C13: Zusammenfuehren — kein 'getNextId is not a function', alle IDs eindeutig", async () => {
        const seite = await boote(
            erzeugeSeite(speicherMitStand({ npcs: [{ id: 1, name: 'Alt' }] }))
        );
        const aufraeumen = mitImportModal(
            seite,
            'npcs',
            [
                { id: 1, name: 'X' },
                { id: 2, name: 'Y' }
            ],
            'merge'
        );
        try {
            expect(() => seite.ctx.executeImport('npcs')).not.toThrow();
        } finally {
            aufraeumen();
        }
        const alle = ids(seite.ctx.D.npcs);
        expect(alle).toHaveLength(3);
        expect(new Set(alle).size).toBe(3);
        expect(alle.every(id => Number.isSafeInteger(id) && id > 0)).toBe(true);
    });

    test('C13: Ersetzen — Eintraege [5, 6] mit Zaehler 2: Zaehler wird auf 7 gehoben', async () => {
        const seite = await boote(erzeugeSeite(speicherMitStand()));
        seite.ctx.D._nextId.npcs = 2;
        const aufraeumen = mitImportModal(
            seite,
            'npcs',
            [
                { id: 5, name: 'F' },
                { id: 6, name: 'S' }
            ],
            'replace'
        );
        try {
            seite.ctx.executeImport('npcs');
        } finally {
            aufraeumen();
        }
        expect(seite.ctx.D._nextId.npcs).toBe(7);
        expect(seite.ctx.nextId('npcs')).toBe(7);
    });

    test('C14 (Schutz): jeder gemeinsame Schluessel von IO_DATA_PATH und ID_COUNTER_PATHS zeigt auf denselben Pfad', () => {
        const seite = erzeugeSeite();
        const ioPfade = plain(vm.runInContext('IO_DATA_PATH', seite.ctx));
        const idPfade = plain(seite.ctx.ID_COUNTER_PATHS);
        const gemeinsam = Object.keys(ioPfade).filter(k =>
            Object.prototype.hasOwnProperty.call(idPfade, k)
        );
        expect(gemeinsam.length).toBeGreaterThan(0);
        for (const k of gemeinsam) expect(ioPfade[k]).toEqual(idPfade[k]);
    });
});

// ============================================================
// C15 — ein Dateiwechsel, ein Import
// ============================================================

describe('R03 — ein Dateiwechsel startet genau EINEN Import', () => {
    test('C15: input UND change feuern fuer dieselbe Auswahl — importDataGlobal() laeuft nur einmal', async () => {
        // Browser feuern fuer <input type=file> beim Auswaehlen 'input' und danach 'change';
        // ui/event-delegation.js ruft data-action="import-data-global" fuer BEIDE auf.
        const ziel = await boote(erzeugeSeite(speicherMitStand()));
        ziel.antworten.push(false, true, true, true);
        const eingabe = {
            files: [
                {
                    name: 'doppelt.json',
                    __text: JSON.stringify({ _version: VERSION, npcs: [{ id: 1, name: 'A' }] })
                }
            ],
            value: 'C:\\fakepath\\doppelt.json'
        };
        ziel.elemente['import-file'] = eingabe;
        ziel.ctx.importDataGlobal(); // 'input'
        ziel.ctx.importDataGlobal(); // 'change'
        await Promise.all(ziel.lesevorgaenge);
        await ruhe();
        await ziel.timer.laufen();

        expect(ziel.lesevorgaenge).toHaveLength(1);
        expect(ziel.confirms).toHaveLength(2);
        expect(ziel.ctx.saveUndoState).toHaveBeenCalledTimes(1);
        expect(ziel.ctx.location.reload).not.toHaveBeenCalled();
        expect(ziel.ctx.D.npcs.map(n => n.name)).toEqual(['A']);
        expect(eingabe.value).toBe('');

        // danach ist ein weiterer Import wieder moeglich
        await importiere(
            ziel,
            { _version: VERSION, npcs: [{ id: 1, name: 'B' }] },
            { antworten: [false, true] }
        );
        expect(ziel.ctx.D.npcs.map(n => n.name)).toEqual(['B']);
    });
});
