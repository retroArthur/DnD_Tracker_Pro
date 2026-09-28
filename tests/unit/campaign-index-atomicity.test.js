/**
 * Atomare Kampagnenanlage: Daten vor Index, Rueckbau, IndexedDB-Rueckfall — R07
 * (Code-Review 2026-09-21, Einheit U6)
 *
 * "Als neue Kampagne importieren" (importDataGlobal, systems/spellslots/import-export.js) und
 * createCampaign() (systems/campaign-manager/campaign-manager.js) schrieben den Kampagnenindex
 * (der Import stellte dabei auch `active` um) VOR den Kampagnendaten, nur ueber localStorage und
 * ohne Rueckbau:
 *   - Scheiterte der Datenwrite, blieb ein Indexeintrag ohne Daten stehen, und der naechste Start
 *     oeffnete eine leere Kampagne.
 *   - Scheiterte der Indexwrite, blieben verwaiste Daten, dazu Erfolgsmeldung und Neuladen.
 *   - Grosse Importe hatten keinen IndexedDB-Rueckfall (>5 MB landeten sogar in localStorage).
 * switchCampaign() lud trotz gescheitertem Indexwrite neu. createCampaign() schrieb eine
 * veraltete Default-Kopie (Phantom 'items', 8 fehlende Schluessel). importFullExport() schrieb
 * Kampagnendaten ohne _ts — load() hielt sie fuer einen veralteten Schatten und nahm eine alte
 * IndexedDB-Kopie.
 *
 * INVARIANTE: der Index verweist nie auf eine Kampagne, deren Daten nicht gespeichert sind, und
 * `active` aendert sich nur im letzten, einzigen Indexwrite.
 *
 * Werkbank: vm-Kontext = window mit den ECHTEN Quelldateien in Loader-Reihenfolge; localStorage
 * auf einer geteilten Map mit Wurf-Politik und Schreibprotokoll; spec-nahes IndexedDB-Double mit
 * zwei Fehlerarten (Request-Fehler; Request-Erfolg und danach Abbruch beim Commit — der R04-Fall);
 * gefaelschter setTimeout; FileReader liefert das Promise seines onload-Handlers.
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
    'systems/spellslots/version-migration.js',
    'systems/spellslots/persistence.js',
    'systems/spellslots/quick-roll.js',
    'systems/spellslots/import-export.js',
    'systems/campaign-manager/campaign-manager.js',
    'systems/migration/full-export.js',
    'render/helpers.js'
];

const STANDARD_KEY = 'dnd-tracker-v4';
const INDEX_KEY = 'dnd-tracker-campaigns';
const ALT_KEY = 'dnd-campaign-111';
const MB = 1024 * 1024;

const quelle = rel => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
const QUELLTEXT = Object.fromEntries(MODULE.map(rel => [rel, quelle(rel)]));
const plain = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

async function ruhe(n = 40) {
    for (let i = 0; i < n; i++) await new Promise(resolve => naechsterTask(resolve));
}

function quotaFehler() {
    const e = new Error('The quota has been exceeded.');
    e.name = 'QuotaExceededError';
    return e;
}

// ============================================================
// Doubles
// ============================================================

function erzeugeTimer() {
    let naechsteId = 1;
    const offen = new Map();
    return {
        setTimeout(fn, ms) {
            const id = naechsteId++;
            offen.set(id, { fn, ms });
            return id;
        },
        clearTimeout(id) {
            offen.delete(id);
        },
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
 * Spec-nahes IndexedDB-Double (Muster: tests/unit/backups-autobackup.test.js):
 * - Requests feuern in eigenen Tasks; Schreibvorgaenge werden erst beim Commit uebernommen.
 * - politik.requestFehler(stores): put/delete scheitern (req.onerror, danach tx.onerror und
 *   Abbruch — nichts wird uebernommen).
 * - politik.commitAbbruch(stores): alle Requests gelingen, der Commit scheitert und feuert
 *   AUSSCHLIESSLICH 'abort' (QuotaExceededError beim Commit, der R04-Fall).
 */
function erzeugeFakeIdb(politik) {
    const tabellen = new Map();
    const tab = name => {
        if (!tabellen.has(name)) tabellen.set(name, new Map());
        return tabellen.get(name);
    };
    function transaction(storeNames, mode) {
        const namen = [].concat(storeNames);
        const tx = { mode, error: null, oncomplete: null, onabort: null, onerror: null };
        const vorgemerkt = [];
        let offen = 0;
        let beendet = false;
        const beende = () => {
            naechsterTask(() => {
                if (beendet || offen > 0) return;
                beendet = true;
                if (mode === 'readwrite' && politik.commitAbbruch && politik.commitAbbruch(namen)) {
                    tx.error = quotaFehler();
                    if (typeof tx.onabort === 'function') tx.onabort({ target: tx });
                    return;
                }
                for (const s of vorgemerkt) {
                    if (s.op === 'put') tab(s.store).set(s.key, s.value);
                    else tab(s.store).delete(s.key);
                }
                if (typeof tx.oncomplete === 'function') tx.oncomplete({ target: tx });
            });
        };
        const anfrage = (ausfuehren, schreibend) => {
            const req = { result: undefined, error: null, onsuccess: null, onerror: null };
            offen++;
            naechsterTask(() => {
                offen--;
                if (schreibend && politik.requestFehler && politik.requestFehler(namen)) {
                    beendet = true;
                    req.error = new Error('IndexedDB-Schreibfehler (Test)');
                    tx.error = req.error;
                    if (typeof req.onerror === 'function') req.onerror({ target: req });
                    if (typeof tx.onerror === 'function') tx.onerror({ target: req });
                    if (typeof tx.onabort === 'function') tx.onabort({ target: tx });
                    return;
                }
                req.result = ausfuehren();
                if (typeof req.onsuccess === 'function') req.onsuccess({ target: req });
                beende();
            });
            return req;
        };
        beende();
        tx.abort = () => {
            beendet = true;
        };
        tx.objectStore = name => ({
            put: wert => {
                const v = plain(wert);
                return anfrage(() => {
                    vorgemerkt.push({ store: name, op: 'put', key: v.id, value: v });
                    return v.id;
                }, true);
            },
            delete: key =>
                anfrage(() => {
                    vorgemerkt.push({ store: name, op: 'delete', key });
                }, true),
            get: key => anfrage(() => plain(tab(name).get(key)), false)
        });
        return tx;
    }
    return {
        db: { transaction, objectStoreNames: { contains: () => true }, close() {} },
        tab,
        schluessel: name => Array.from(tab(name).keys())
    };
}

function erzeugeLocalStorage(store, log, politik) {
    return {
        getItem: k => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => {
            const s = String(v);
            if (politik.lsWirft && politik.lsWirft(k, s)) {
                log.push('ls.quota:' + k);
                throw quotaFehler();
            }
            store.set(k, s);
            log.push('ls.set:' + k);
        },
        removeItem: k => {
            store.delete(k);
            log.push('ls.remove:' + k);
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

/**
 * Bereits gueltiger Stand der Kampagne "Alt" (dnd-campaign-111): initializeData() plus das, was
 * der Start anlegt, voller Zaehlersatz, aktueller Stempel.
 */
function standAlt(ctx) {
    const d = ctx.initializeData();
    Object.assign(d, { randomTables: [], timers: [], shops: [], campaign: {} });
    d.npcs = [{ id: 1, name: 'Alter NPC' }];
    d._version = ctx.APP_CONFIG.VERSION;
    ctx.recomputeNextIds(d);
    return plain(d);
}

function erzeugeSpeicher() {
    const politik = { lsWirft: null, requestFehler: null, commitAbbruch: null };
    return { ls: new Map(), log: [], politik, fake: erzeugeFakeIdb(politik) };
}

function erzeugeSeite(speicher) {
    const timer = erzeugeTimer();
    const toasts = [];
    const confirms = [];
    const alerts = [];
    const antworten = [];
    const elemente = {};
    const seite = { speicher, timer, toasts, confirms, alerts, antworten, elemente, lesen: null };
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
    ctx.localStorage = erzeugeLocalStorage(speicher.ls, speicher.log, speicher.politik);
    ctx.indexedDB = {};
    ctx.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
    ctx.debugLogAdd = jest.fn();
    ctx.log = () => {};
    vm.createContext(ctx);
    for (const rel of MODULE) vm.runInContext(QUELLTEXT[rel], ctx, { filename: rel });

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
    ctx.renderCampaignList = jest.fn();
    ctx.updateSaveIndicator = jest.fn();
    ctx.broadcastSave = jest.fn();
    ctx.stopAllTracks = jest.fn();
    ctx.getSpellSlotsForClass = jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0]);
    ctx.saveUndoState = jest.fn();
    ctx.createAutoBackup = jest.fn(() => Promise.resolve('written'));
    ctx.reportSafetyBackup = jest.fn(async status => status);
    ctx.FileReader = class {
        readAsText(datei) {
            seite.lesen = Promise.resolve().then(() =>
                this.onload({ target: { result: datei.__text } })
            );
        }
    };
    seite.ctx = ctx;
    return seite;
}

/** Was core/init.js tut: aktive Kampagne aus dem Index -> STORAGE_KEY_OVERRIDE, dann load(). */
async function boote(seite) {
    const index = seite.ctx.getCampaignIndex();
    const aktiv = index && index.active ? index.active : STANDARD_KEY;
    if (aktiv !== STANDARD_KEY) seite.ctx.STORAGE_KEY_OVERRIDE = aktiv;
    await seite.ctx.load();
    await ruhe();
    return seite;
}

/**
 * Laufende Sitzung in der Kampagne "Alt": Index {Alt aktiv}, Daten + _ts gespeichert, gebootet.
 * Das Schreibprotokoll beginnt danach leer.
 */
async function sitzungAlt(opt = {}) {
    const speicher = erzeugeSpeicher();
    const bau = erzeugeSeite(speicher);
    speicher.ls.set(
        INDEX_KEY,
        opt.indexRoh !== undefined
            ? opt.indexRoh
            : JSON.stringify({
                  campaigns: [{ key: ALT_KEY, name: 'Alt', created: '2026-09-01T00:00:00.000Z' }],
                  active: ALT_KEY
              })
    );
    speicher.ls.set(ALT_KEY, JSON.stringify(standAlt(bau.ctx)));
    speicher.ls.set(ALT_KEY + '_ts', String(Date.now() - 60000));
    const seite = erzeugeSeite(speicher);
    if (opt.indexRoh !== undefined) seite.ctx.STORAGE_KEY_OVERRIDE = ALT_KEY;
    await boote(seite);
    speicher.log.length = 0;
    return seite;
}

async function importiere(seite, payload, antworten) {
    // Antworten gelten nur fuer DIESEN Import (keine Reste aus einem frueheren Durchlauf)
    seite.antworten.length = 0;
    seite.antworten.push(...antworten);
    const eingabe = {
        files: [{ name: 'neu-2026-09-22.json', __text: JSON.stringify(payload) }],
        value: 'C:\\fakepath\\neu-2026-09-22.json'
    };
    seite.elemente['import-file'] = eingabe;
    seite.ctx.importDataGlobal();
    await seite.lesen;
    await ruhe();
    await seite.timer.laufen();
    return eingabe;
}

async function erstelleKampagne(seite, name, opt = {}) {
    const eingabe = { value: name, disabled: false };
    seite.elemente['new-campaign-name'] = eingabe;
    if (opt.doppelklick) {
        const a = seite.ctx.createCampaign();
        const b = seite.ctx.createCampaign();
        await Promise.all([a, b]);
    } else {
        await seite.ctx.createCampaign();
    }
    await ruhe();
    return eingabe;
}

const neueSchluessel = speicher =>
    Array.from(speicher.ls.keys()).filter(k => /^dnd-campaign-/.test(k) && !k.startsWith(ALT_KEY));
const neueIdbSchluessel = speicher =>
    speicher.fake.schluessel('campaigns').filter(k => /^dnd-campaign-/.test(k) && k !== ALT_KEY);
const indexVon = speicher => JSON.parse(speicher.ls.get(INDEX_KEY));
const istNeuerKampagnenSchluessel = k => /^dnd-campaign-/.test(k) && !k.startsWith(ALT_KEY);

const NEU_PAYLOAD = { _campaignName: 'Neu', npcs: [{ id: 1, name: 'Neuer NPC' }] };

// ============================================================
// Import als neue Kampagne
// ============================================================

describe('R07 — Import als neue Kampagne: Daten vor Index, Rueckbau bei jedem Fehler', () => {
    test('T1: Datenwrite scheitert in localStorage UND IndexedDB — Index byte-identisch, Hinweis, kein Neuladen, keine Daten', async () => {
        const seite = await sitzungAlt();
        const indexVorher = seite.speicher.ls.get(INDEX_KEY);
        seite.speicher.politik.lsWirft = k => istNeuerKampagnenSchluessel(k);
        seite.speicher.politik.requestFehler = stores => stores.includes('campaigns');

        await importiere(seite, NEU_PAYLOAD, [true]);

        expect(seite.speicher.ls.get(INDEX_KEY)).toBe(indexVorher);
        expect(seite.alerts).toHaveLength(1);
        expect(seite.alerts[0]).toMatch(/Fehler/);
        expect(seite.ctx.location.reload).not.toHaveBeenCalled();
        expect(neueSchluessel(seite.speicher)).toEqual([]);
        expect(neueIdbSchluessel(seite.speicher)).toEqual([]);
    });

    test('T10: nach T1 oeffnet der naechste Start die bisherige Kampagne mit ihren Daten', async () => {
        const seite = await sitzungAlt();
        seite.speicher.politik.lsWirft = k => istNeuerKampagnenSchluessel(k);
        seite.speicher.politik.requestFehler = stores => stores.includes('campaigns');
        await importiere(seite, NEU_PAYLOAD, [true]);

        seite.speicher.politik.lsWirft = null;
        seite.speicher.politik.requestFehler = null;
        const neustart = await boote(erzeugeSeite(seite.speicher));
        expect(neustart.ctx.STORAGE_KEY_OVERRIDE).toBe(ALT_KEY);
        expect(neustart.ctx.D.npcs[0].name).toBe('Alter NPC');
    });

    test('T2: nur der Indexwrite scheitert — Index unveraendert, keine verwaisten Daten, keine Erfolgsmeldung, kein Neuladen', async () => {
        const seite = await sitzungAlt();
        const indexVorher = seite.speicher.ls.get(INDEX_KEY);
        seite.speicher.politik.lsWirft = k => k === INDEX_KEY;

        await importiere(seite, NEU_PAYLOAD, [true]);

        expect(seite.speicher.ls.get(INDEX_KEY)).toBe(indexVorher);
        expect(neueSchluessel(seite.speicher)).toEqual([]);
        expect(neueIdbSchluessel(seite.speicher)).toEqual([]);
        expect(seite.toasts.some(t => /importiert/.test(t.text))).toBe(false);
        expect(seite.ctx.location.reload).not.toHaveBeenCalled();
        expect(seite.alerts).toHaveLength(1);
        expect(seite.alerts[0]).toMatch(/Fehler/);
    });

    // Korrekturrunde zum Code-Review 2026-09-21 (F5, U6 minor:6): Pin fuer den
    // IndexedDB-Zweig des Rueckbaus. T2 deckt nur den localStorage-Zweig ab; ohne
    // diesen Fall bleibt ein Waisen-Datensatz in IndexedDB unbemerkt.
    test('T2b (Pin): Daten liegen nach dem Rueckfall in IndexedDB, dann scheitert der Indexwrite — der IndexedDB-Datensatz wird zurueckgenommen', async () => {
        const seite = await sitzungAlt();
        const indexVorher = seite.speicher.ls.get(INDEX_KEY);
        seite.speicher.politik.lsWirft = k => k === INDEX_KEY || istNeuerKampagnenSchluessel(k);

        await importiere(seite, NEU_PAYLOAD, [true]);

        // Nicht-Vakuitaet: der localStorage-Write des neuen Schluessels ist wirklich
        // gescheitert, die Daten liefen also ueber den IndexedDB-Rueckfall.
        expect(
            seite.speicher.log.some(l => /^ls.quota:dnd-campaign-/.test(l) && !l.includes(ALT_KEY))
        ).toBe(true);
        expect(neueIdbSchluessel(seite.speicher)).toEqual([]);
        expect(neueSchluessel(seite.speicher)).toEqual([]);
        expect(seite.speicher.ls.get(INDEX_KEY)).toBe(indexVorher);
        expect(seite.alerts).toHaveLength(1);
        expect(seite.alerts[0]).toMatch(/Fehler/);
        expect(seite.ctx.location.reload).not.toHaveBeenCalled();
    });

    test('T3: grosser Import (localStorage-Quota > 200 000 Zeichen) — IndexedDB-Rueckfall, aktiv, und der naechste Start laedt ihn', async () => {
        const seite = await sitzungAlt();
        seite.speicher.politik.lsWirft = (k, v) => v.length > 200000;

        await importiere(
            seite,
            {
                _campaignName: 'Gross',
                npcs: [{ id: 1, name: 'Riese' }],
                quickNotes: 'q'.repeat(200010)
            },
            [true]
        );

        expect(seite.alerts).toEqual([]);
        expect(seite.ctx.location.reload).toHaveBeenCalledTimes(1);
        const index = indexVon(seite.speicher);
        const eintrag = index.campaigns.find(c => c.key === index.active);
        expect(index.active).not.toBe(ALT_KEY);
        expect(eintrag.name).toBe('Gross');
        expect(neueIdbSchluessel(seite.speicher)).toEqual([index.active]);
        expect(seite.speicher.ls.has(index.active)).toBe(false);
        expect(seite.speicher.ls.has(index.active + '_ts')).toBe(false);

        const neustart = await boote(erzeugeSeite(seite.speicher));
        expect(neustart.ctx.STORAGE_KEY_OVERRIDE).toBe(index.active);
        expect(neustart.ctx.D.quickNotes.length).toBe(200010);
        expect(neustart.ctx.D.npcs[0].name).toBe('Riese');
    });

    test('T3b: Import ueber 5 MB — wie save() nur in IndexedDB, keine localStorage-Kopie', async () => {
        const seite = await sitzungAlt();
        await importiere(
            seite,
            { _campaignName: 'Riesig', npcs: [], quickNotes: 'x'.repeat(Math.ceil(5.1 * MB)) },
            [true]
        );
        expect(seite.alerts).toEqual([]);
        expect(seite.ctx.location.reload).toHaveBeenCalledTimes(1);
        const index = indexVon(seite.speicher);
        expect(index.active).not.toBe(ALT_KEY);
        expect(neueIdbSchluessel(seite.speicher)).toEqual([index.active]);
        expect(seite.speicher.ls.has(index.active)).toBe(false);
        expect(seite.speicher.ls.has(index.active + '_ts')).toBe(false);
    });

    test('T3c: IndexedDB-Request gelingt, Commit bricht ab — gilt als Fehlschlag (Index unveraendert, Hinweis)', async () => {
        const seite = await sitzungAlt();
        const indexVorher = seite.speicher.ls.get(INDEX_KEY);
        seite.speicher.politik.lsWirft = k => istNeuerKampagnenSchluessel(k);
        seite.speicher.politik.commitAbbruch = stores => stores.includes('campaigns');

        await importiere(seite, NEU_PAYLOAD, [true]);

        expect(seite.speicher.ls.get(INDEX_KEY)).toBe(indexVorher);
        expect(seite.alerts).toHaveLength(1);
        expect(seite.alerts[0]).toMatch(/Fehler/);
        expect(seite.ctx.location.reload).not.toHaveBeenCalled();
        expect(neueSchluessel(seite.speicher)).toEqual([]);
        expect(neueIdbSchluessel(seite.speicher)).toEqual([]);
    });

    test('T4 (Schema-Drift-Waechter): Erfolg — Daten VOR Index geschrieben, Datensatz enthaelt alle initializeData()-Schluessel und die importierten NPCs', async () => {
        const seite = await sitzungAlt();
        await importiere(seite, NEU_PAYLOAD, [true]);

        expect(seite.alerts).toEqual([]);
        expect(seite.ctx.location.reload).toHaveBeenCalledTimes(1);
        const index = indexVon(seite.speicher);
        expect(index.active).not.toBe(ALT_KEY);
        const posDaten = seite.speicher.log.indexOf('ls.set:' + index.active);
        const posIndex = seite.speicher.log.indexOf('ls.set:' + INDEX_KEY);
        expect(posDaten).toBeGreaterThanOrEqual(0);
        expect(posIndex).toBeGreaterThan(posDaten);
        const datensatz = JSON.parse(seite.speicher.ls.get(index.active));
        for (const key of Object.keys(seite.ctx.initializeData())) {
            expect(Object.keys(datensatz)).toContain(key);
        }
        expect(datensatz.npcs.map(n => n.name)).toEqual(['Neuer NPC']);
        expect(datensatz.items).toBeUndefined();
        expect(seite.speicher.ls.has(index.active + '_ts')).toBe(true);
    });

    test('T11: unlesbarer Rohindex — Import wird verweigert, der Rohindex bleibt byte-identisch', async () => {
        const seite = await sitzungAlt({ indexRoh: '{kaputt' });
        await importiere(seite, NEU_PAYLOAD, [true]);
        expect(seite.speicher.ls.get(INDEX_KEY)).toBe('{kaputt');
        expect(seite.alerts).toHaveLength(1);
        expect(seite.alerts[0]).toMatch(/Fehler/);
        expect(seite.ctx.location.reload).not.toHaveBeenCalled();
        expect(neueSchluessel(seite.speicher)).toEqual([]);
    });

    test('T12: Wiederholung nach zurueckgenommenem Fehlschlag — genau ein Indexeintrag, genau ein Datenschluessel', async () => {
        const seite = await sitzungAlt();
        let indexWuerfe = 0;
        seite.speicher.politik.lsWirft = k => k === INDEX_KEY && indexWuerfe++ === 0;

        await importiere(seite, NEU_PAYLOAD, [true]);
        // echte Pause: zwei Versuche in derselben Millisekunde teilten sich sonst den Schluessel
        await new Promise(resolve => setTimeout(resolve, 5));
        await importiere(seite, NEU_PAYLOAD, [true]);

        const index = indexVon(seite.speicher);
        const neu = index.campaigns.filter(c => c.key !== ALT_KEY);
        expect(neu).toHaveLength(1);
        const daten = neueSchluessel(seite.speicher).filter(
            k => !k.endsWith('_ts') && !k.endsWith('_rev')
        );
        expect(daten).toEqual([neu[0].key]);
    });

    // Korrekturrunde zum Code-Review 2026-09-21 (F5, U6 minor:7): Pin fuer das frische
    // Lesen des Index NACH dem asynchronen Datenwrite (campaign-manager.js:130). Ohne
    // es verliert der Eintrag eines anderen Tabs seinen Platz im Index und die dort
    // angelegte Kampagne wird unerreichbar.
    test('T15 (Pin): der Index wird nach dem asynchronen Datenwrite erneut gelesen — der Eintrag eines anderen Tabs bleibt erhalten', async () => {
        const seite = await sitzungAlt();
        seite.speicher.politik.lsWirft = k => istNeuerKampagnenSchluessel(k);
        let gefeuert = false;
        // Waehrend der IndexedDB-Write laeuft, haengt ein anderer Tab seine Kampagne
        // an den Rohindex an (der Hook laeuft im Request-Task, also nach dem Lesen
        // VOR dem await und vor dem Indexwrite danach).
        seite.speicher.politik.requestFehler = stores => {
            if (!gefeuert && stores.includes('campaigns')) {
                gefeuert = true;
                const idx = JSON.parse(seite.speicher.ls.get(INDEX_KEY));
                idx.campaigns.push({ key: 'dnd-campaign-222', name: 'Fremd' });
                seite.speicher.ls.set(INDEX_KEY, JSON.stringify(idx));
            }
            return false;
        };

        await importiere(seite, NEU_PAYLOAD, [true]);

        expect(gefeuert).toBe(true); // Nicht-Vakuitaet: der Fremdschreiber lief wirklich
        expect(indexVon(seite.speicher).campaigns.map(c => c.name)).toEqual([
            'Alt',
            'Fremd',
            'Neu'
        ]);
    });
});

// ============================================================
// createCampaign / switchCampaign / saveCampaignIndex
// ============================================================

describe('R07 — createCampaign(), switchCampaign(), saveCampaignIndex()', () => {
    test('T5: createCampaign — Datenwrite scheitert (localStorage und IndexedDB): Index unveraendert, kein Waisenkind, Fehlerhinweis', async () => {
        const seite = await sitzungAlt();
        const indexVorher = seite.speicher.ls.get(INDEX_KEY);
        seite.speicher.politik.lsWirft = k => istNeuerKampagnenSchluessel(k);
        seite.speicher.politik.requestFehler = stores => stores.includes('campaigns');

        await erstelleKampagne(seite, 'Leer');

        expect(seite.speicher.ls.get(INDEX_KEY)).toBe(indexVorher);
        expect(neueSchluessel(seite.speicher)).toEqual([]);
        expect(neueIdbSchluessel(seite.speicher)).toEqual([]);
        expect(seite.toasts.map(t => t.text)).toContain('❌ Fehler beim Erstellen der Kampagne');
        expect(seite.toasts.some(t => /erstellt/.test(t.text))).toBe(false);
    });

    test('T6: createCampaign — Indexwrite scheitert: Index unveraendert, Daten zurueckgenommen, Fehlerhinweis', async () => {
        const seite = await sitzungAlt();
        const indexVorher = seite.speicher.ls.get(INDEX_KEY);
        seite.speicher.politik.lsWirft = k => k === INDEX_KEY;

        await erstelleKampagne(seite, 'Leer');

        expect(seite.speicher.ls.get(INDEX_KEY)).toBe(indexVorher);
        expect(neueSchluessel(seite.speicher)).toEqual([]);
        expect(seite.toasts.map(t => t.text)).toContain('❌ Fehler beim Erstellen der Kampagne');
        expect(seite.toasts.some(t => /erstellt/.test(t.text))).toBe(false);
    });

    // Korrekturrunde zum Code-Review 2026-09-21 (F5, U6 minor:6): Geschwister von T2b
    // fuer createCampaign — derselbe IndexedDB-Zweig des Rueckbaus.
    test('T6b (Pin): createCampaign — Daten liegen nach dem Rueckfall in IndexedDB, dann scheitert der Indexwrite: der IndexedDB-Datensatz wird zurueckgenommen', async () => {
        const seite = await sitzungAlt();
        const indexVorher = seite.speicher.ls.get(INDEX_KEY);
        seite.speicher.politik.lsWirft = k => k === INDEX_KEY || istNeuerKampagnenSchluessel(k);

        await erstelleKampagne(seite, 'Leer');

        expect(
            seite.speicher.log.some(l => /^ls.quota:dnd-campaign-/.test(l) && !l.includes(ALT_KEY))
        ).toBe(true);
        expect(neueIdbSchluessel(seite.speicher)).toEqual([]);
        expect(neueSchluessel(seite.speicher)).toEqual([]);
        expect(seite.speicher.ls.get(INDEX_KEY)).toBe(indexVorher);
        expect(seite.toasts.map(t => t.text)).toContain('❌ Fehler beim Erstellen der Kampagne');
        expect(seite.toasts.some(t => /erstellt/.test(t.text))).toBe(false);
    });

    // Korrekturrunde zum Code-Review 2026-09-21 (F5, U6 minor:7): Pin fuer den
    // kollisionsfreien Schluessel (newCampaignKey, campaign-manager.js:78). Ohne die
    // Suffix-Schleife ueberschreibt die Anlage fremde Daten unter demselben
    // Millisekunden-Schluessel — und ihr Rueckbau loescht sie.
    test('T16 (Pin): ein bereits belegter Millisekunden-Schluessel wird nie beschrieben — der Rueckbau trifft nur den eigenen', async () => {
        const seite = await sitzungAlt();
        const FEST = 1790000000000;
        const FREMD = 'dnd-campaign-' + FEST;
        vm.runInContext('Date.now = function () { return ' + FEST + '; };', seite.ctx);
        seite.speicher.ls.set(FREMD, 'FREMDE-DATEN');
        seite.speicher.politik.lsWirft = k => k === INDEX_KEY;

        await erstelleKampagne(seite, 'Leer');

        expect(seite.speicher.ls.get(FREMD)).toBe('FREMDE-DATEN');
        expect(seite.speicher.log).toContain('ls.set:' + FREMD + '-1');
        expect(seite.speicher.log).not.toContain('ls.set:' + FREMD);
        expect(seite.speicher.log).not.toContain('ls.remove:' + FREMD);
        expect(seite.toasts.map(t => t.text)).toContain('❌ Fehler beim Erstellen der Kampagne');
    });

    test('T7: createCampaign — Erfolg: Schluessel = initializeData(), Daten vor Index, active unveraendert', async () => {
        const seite = await sitzungAlt();
        const eingabe = await erstelleKampagne(seite, 'Leer');

        const index = indexVon(seite.speicher);
        expect(index.active).toBe(ALT_KEY);
        const neu = index.campaigns.filter(c => c.key !== ALT_KEY);
        expect(neu.map(c => c.name)).toEqual(['Leer']);
        const key = neu[0].key;
        const datensatz = JSON.parse(seite.speicher.ls.get(key));
        expect(Object.keys(datensatz).sort()).toEqual(
            Object.keys(seite.ctx.initializeData()).sort()
        );
        const posDaten = seite.speicher.log.indexOf('ls.set:' + key);
        const posIndex = seite.speicher.log.indexOf('ls.set:' + INDEX_KEY);
        expect(posDaten).toBeGreaterThanOrEqual(0);
        expect(posIndex).toBeGreaterThan(posDaten);
        expect(seite.toasts.map(t => t.text)).toContain('Kampagne "Leer" erstellt');
        expect(eingabe.value).toBe('');
    });

    test('T7b: Doppelklick waehrend eines langsamen (IndexedDB-)Writes legt genau EINE Kampagne an', async () => {
        const seite = await sitzungAlt();
        seite.speicher.politik.lsWirft = k => istNeuerKampagnenSchluessel(k);

        await erstelleKampagne(seite, 'Leer', { doppelklick: true });

        const index = indexVon(seite.speicher);
        const neu = index.campaigns.filter(c => c.key !== ALT_KEY);
        expect(neu).toHaveLength(1);
        expect(neueIdbSchluessel(seite.speicher)).toEqual([neu[0].key]);
    });

    test('T8 (Schutz): wirft der Indexschluessel, liefert saveCampaignIndex {success: false}', async () => {
        const seite = await sitzungAlt();
        seite.speicher.politik.lsWirft = k => k === INDEX_KEY;
        const r = seite.ctx.saveCampaignIndex({ campaigns: [], active: STANDARD_KEY });
        expect(r && r.success).toBe(false);
    });

    test('T9: switchCampaign — gescheiterter Indexwrite: Fehlerhinweis, KEIN Neuladen', async () => {
        const seite = await sitzungAlt();
        seite.speicher.politik.lsWirft = k => k === INDEX_KEY;
        await seite.ctx.switchCampaign(STANDARD_KEY);
        expect(seite.toasts.some(t => /fehlgeschlagen/i.test(t.text))).toBe(true);
        expect(seite.ctx.location.reload).not.toHaveBeenCalled();
    });

    test('T11: createCampaign mit unlesbarem Rohindex — verweigert, Rohindex byte-identisch', async () => {
        const seite = await sitzungAlt({ indexRoh: '{kaputt' });
        await erstelleKampagne(seite, 'Leer');
        expect(seite.speicher.ls.get(INDEX_KEY)).toBe('{kaputt');
        expect(neueSchluessel(seite.speicher)).toEqual([]);
        expect(seite.toasts.map(t => t.text)).toContain('❌ Fehler beim Erstellen der Kampagne');
    });
});

// ============================================================
// Quelltext-Waechter
// ============================================================

describe('R07 — keine handkopierten Default-Zustaende mehr', () => {
    test('T13: weder import-export.js noch campaign-manager.js enthalten ein Inline-Default-Literal', () => {
        const muster = /initiative:\s*\{\s*combatants:\s*\[\]/g;
        const treffer = rel => (quelle(rel).match(muster) || []).length;
        expect(treffer('systems/spellslots/import-export.js')).toBe(0);
        expect(treffer('systems/campaign-manager/campaign-manager.js')).toBe(0);
    });
});

// ============================================================
// Umzugs-Import (importFullExport) und _ts
// ============================================================

describe('R07 — importFullExport() schreibt den _ts-Begleiter', () => {
    test('T14: Umzugs-Import ueber einer reinen IndexedDB-Kampagne — nach dem Neustart gewinnen die importierten Daten', async () => {
        const speicher = erzeugeSpeicher();
        const bau = erzeugeSeite(speicher);
        const altIdb = standAlt(bau.ctx);
        altIdb.npcs = [{ id: 1, name: 'Alte IndexedDB-Kopie' }];
        // Reine IndexedDB-Kampagne (>5-MB-Modus): kein localStorage-Eintrag, kein _ts
        speicher.fake.tab('campaigns').set(ALT_KEY, {
            id: ALT_KEY,
            data: JSON.stringify(altIdb),
            timestamp: Date.now() - 60000
        });
        speicher.ls.set(
            INDEX_KEY,
            JSON.stringify({ campaigns: [{ key: ALT_KEY, name: 'Alt' }], active: ALT_KEY })
        );

        const importiert = standAlt(bau.ctx);
        importiert.npcs = [{ id: 1, name: 'Importiert' }];
        bau.ctx.importFullExport({
            _exportType: 'full-v1',
            campaigns: { [ALT_KEY]: { meta: { key: ALT_KEY, name: 'Alt' }, data: importiert } },
            campaignIndex: { campaigns: [{ key: ALT_KEY, name: 'Alt' }], active: ALT_KEY }
        });
        expect(speicher.ls.has(ALT_KEY + '_ts')).toBe(true);

        const neustart = await boote(erzeugeSeite(speicher));
        expect(neustart.ctx.STORAGE_KEY_OVERRIDE).toBe(ALT_KEY);
        expect(neustart.ctx.D.npcs[0].name).toBe('Importiert');
    });
});

// ============================================================
// Umzugs-Import: gescheiterte Schreibvorgaenge melden (Korrekturrunde F5)
// ============================================================

/**
 * Werkbank von T14: reine IndexedDB-Kampagne "Alt" mit einer AELTEREN Kopie, Index mit Alt
 * aktiv, KEIN localStorage-Eintrag und KEIN _ts. Liefert Speicher, Bau-Seite und die
 * Umzugs-Nutzlast, deren NPC 'Importiert' heisst.
 */
function umzugsWerkbank() {
    const speicher = erzeugeSpeicher();
    const bau = erzeugeSeite(speicher);
    const altIdb = standAlt(bau.ctx);
    altIdb.npcs = [{ id: 1, name: 'Alte IndexedDB-Kopie' }];
    speicher.fake.tab('campaigns').set(ALT_KEY, {
        id: ALT_KEY,
        data: JSON.stringify(altIdb),
        timestamp: Date.now() - 60000
    });
    speicher.ls.set(
        INDEX_KEY,
        JSON.stringify({ campaigns: [{ key: ALT_KEY, name: 'Alt' }], active: ALT_KEY })
    );
    const importiert = standAlt(bau.ctx);
    importiert.npcs = [{ id: 1, name: 'Importiert' }];
    const nutzlast = {
        _exportType: 'full-v1',
        campaigns: { [ALT_KEY]: { meta: { key: ALT_KEY, name: 'Alt' }, data: importiert } },
        campaignIndex: { campaigns: [{ key: ALT_KEY, name: 'Alt' }], active: ALT_KEY }
    };
    return { speicher, bau, nutzlast };
}

describe('R07-Nachtrag (F5) — importFullExport() meldet gescheiterte Schreibvorgaenge', () => {
    test('T14b: der _ts-Write scheitert und es gibt keinen Stempel — der Umzugs-Import meldet Fehlschlag statt Erfolg', () => {
        const { speicher, bau, nutzlast } = umzugsWerkbank();
        speicher.politik.lsWirft = k => k === ALT_KEY + '_ts';

        expect(() => bau.ctx.importFullExport(nutzlast)).toThrow(/Speichern fehlgeschlagen/);

        // Nicht-Vakuitaet: die Kampagnendaten selbst sind geschrieben, es fehlt NUR der
        // Stempel — genau der Zustand, in dem load() die Kopie fuer einen veralteten
        // Schatten haelt und die aeltere IndexedDB-Kopie nimmt.
        expect(speicher.ls.has(ALT_KEY)).toBe(true);
        expect(speicher.ls.has(ALT_KEY + '_ts')).toBe(false);
    });

    test('T14c: der _ts-Write scheitert, aber ein alter Stempel liegt vor — kein Fehlschlag, und der Import gewinnt beim Neustart', async () => {
        const { speicher, bau, nutzlast } = umzugsWerkbank();
        // Ein vorhandener (auch alter) Stempel genuegt: load() prueft nur, DASS er da ist
        speicher.ls.set(ALT_KEY + '_ts', String(Date.now() - 120000));
        speicher.politik.lsWirft = k => k === ALT_KEY + '_ts';

        const ergebnis = bau.ctx.importFullExport(nutzlast);
        expect(ergebnis.campaignCount).toBe(1);

        speicher.politik.lsWirft = null;
        const neustart = await boote(erzeugeSeite(speicher));
        expect(neustart.ctx.STORAGE_KEY_OVERRIDE).toBe(ALT_KEY);
        expect(neustart.ctx.D.npcs[0].name).toBe('Importiert');
    });

    test('T14d: der Indexwrite scheitert — der Umzugs-Import meldet Fehlschlag statt Erfolg', () => {
        const { speicher, bau, nutzlast } = umzugsWerkbank();
        speicher.politik.lsWirft = k => k === INDEX_KEY;

        expect(() => bau.ctx.importFullExport(nutzlast)).toThrow(/Kampagnenindex/);

        // Nicht-Vakuitaet: der Rohindex ist unveraendert, die importierten Kampagnen
        // waeren also ueber ihn nicht erreichbar.
        expect(JSON.parse(speicher.ls.get(INDEX_KEY)).campaigns.map(c => c.name)).toEqual(['Alt']);
    });
});
