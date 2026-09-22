/**
 * Code-Review 2026-09-21, Einheit U3 — R04: IndexedDB-Schreibzugriffe erst nach dem
 * Transaktions-Commit bestaetigen.
 *
 * Ein erfolgreicher Request (put/delete/clear) heisst nur "in die Transaktion eingereiht".
 * Dauerhaft ist die Aenderung erst mit dem 'complete'-Event der Transaktion. Scheitert der
 * Commit (Quota, E/A-Fehler), feuert AUSSCHLIESSLICH 'abort' — kein 'error', weil kein Request
 * mehr offen ist. Wer bei request.onsuccess aufloest, meldet einen Erfolg, den es nie gab; wer
 * nur oncomplete/onerror hoert, wartet ewig.
 *
 * Abgedeckt:
 *   C1        Vertrag von utils/idb-tx.js (idbTransactionDone / idbWriteTx)
 *   P1…P8b,   echte systems/spellslots/persistence.js gegen ein spec-nahes IDB-Double,
 *   A1, E1    Neustart jeweils ueber die echte load() aus systems/spellslots/quick-roll.js
 *   Geschwister systems/backups.js, features/soundboard/soundboard-idb.js,
 *             systems/file-backup/file-backup-permissions.js, features/dice-stats/dice-stats-idb.js
 *   Loeschen  systems/campaign-manager/campaign-manager.js deleteCampaign()
 *             (systems/avatars.js bewusst NICHT geladen — dessen beforeunload-Rueckschreiben
 *             ist Thema von U7)
 *   G1        Quelltext-Waechter ueber alle loader.js-MODULES
 *
 * Werkbank-Regel: Module werden so geladen, wie loader.js sie laedt — gefiltert auf die
 * benoetigten Pfade, in Loader-Reihenfolge. Steht utils/idb-tx.js (noch) nicht in MODULES,
 * laufen die uebrigen Module ohne ihn; der RED-Lauf scheitert so am Verhalten, nicht am Setup.
 * Haengende Promises werden ueber mitFrist() zu Assertion-Fehlern statt Jest-Timeouts.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { extractModulesFromLoader } = require('../../tools/generate-eslint-globals.js');

const WURZEL = path.join(__dirname, '../..');
const LOADER_MODULE = extractModulesFromLoader(
    fs.readFileSync(path.join(WURZEL, 'loader.js'), 'utf8')
);
const IDB_TX_PFAD = 'utils/idb-tx.js';
const SCHLUESSEL = 'dnd-tracker-v4';
const INDEX_SCHLUESSEL = 'dnd-tracker-campaigns';
const BACKUP_SCHLUESSEL = 'dnd-tracker-backups';

// ============================================================
// Hilfen
// ============================================================

function quotaFehler() {
    const e = new Error('The quota has been exceeded.');
    e.name = 'QuotaExceededError';
    return e;
}

function warte(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Begrenztes Warten: liefert {zustand:'erfuellt'|'abgelehnt'|'haengt', wert|fehler}.
 * Ein ewig offenes Promise wird so zur klaren Assertion statt zum Jest-Timeout.
 */
function mitFrist(promise, ms = 300) {
    return Promise.race([
        Promise.resolve(promise).then(
            wert => ({ zustand: 'erfuellt', wert }),
            fehler => ({ zustand: 'abgelehnt', fehler })
        ),
        new Promise(resolve => setTimeout(() => resolve({ zustand: 'haengt' }), ms))
    ]);
}

async function warteBis(bedingung, maxMs = 3000) {
    const start = Date.now();
    while (!bedingung()) {
        if (Date.now() - start > maxMs) return false;
        await warte(20);
    }
    return true;
}

// Commit-Policies fuer das IDB-Double (nur readwrite-Commits werden gezaehlt)
const alleCommitsScheitern = () => quotaFehler();
const ersteCommitsScheitern =
    n =>
    ({ nr }) =>
        nr <= n ? quotaFehler() : null;
const commitNummernScheitern =
    nummern =>
    ({ nr }) =>
        nummern.includes(nr) ? quotaFehler() : null;

// ============================================================
// Spec-nahes IndexedDB-Double — seit U7 in tests/unit/helpers/fake-idb.js (gemeinsam
// mit der Mehr-Tab-Werkbank von R02)
// ============================================================

const { erzeugeFakeIDB } = require('./helpers/fake-idb.js');

// ============================================================
// Werkbank: Module wie loader.js laden
// ============================================================

function ladeModule(context, gewuenscht) {
    gewuenscht
        .filter(rel => rel !== IDB_TX_PFAD)
        .forEach(rel => {
            if (!LOADER_MODULE.includes(rel)) {
                throw new Error(`Werkbank: ${rel} steht nicht in loader.js MODULES`);
            }
        });
    for (const rel of LOADER_MODULE) {
        if (!gewuenscht.includes(rel)) continue;
        vm.runInContext(fs.readFileSync(path.join(WURZEL, rel), 'utf8'), context, {
            filename: rel
        });
    }
}

// Echte StorageAPI und utf8ByteLength aus utils/basic.js (Muster: stability.test.js
// _erzeugePersistenzKontext). var-Alias, weil const im vm-Skript keine Kontext-Eigenschaft wird.
function ladeStorageApi(context) {
    const basic = fs.readFileSync(path.join(WURZEL, 'utils/basic.js'), 'utf8');
    const start = basic.indexOf('const StorageAPI = {');
    const ende = basic.indexOf('\n};', start);
    if (start < 0 || ende < 0) throw new Error('StorageAPI nicht in utils/basic.js gefunden');
    vm.runInContext(basic.slice(start, ende + 3) + '\nvar __StorageAPI = StorageAPI;\n', context);
    const u = basic.indexOf('function utf8ByteLength(');
    const ue = basic.indexOf('\n}', u);
    if (u < 0 || ue < 0) throw new Error('utf8ByteLength nicht in utils/basic.js gefunden');
    vm.runInContext(basic.slice(u, ue + 2), context);
}

function erzeugeLocalStorage(lsStore, log, setItemWirft) {
    return {
        getItem: k => (k in lsStore ? lsStore[k] : null),
        setItem: (k, v) => {
            if (setItemWirft && setItemWirft(k, v)) throw quotaFehler();
            lsStore[k] = String(v);
        },
        removeItem: k => {
            log.push('ls.remove:' + k);
            delete lsStore[k];
        }
    };
}

function kleineKampagne(tag) {
    return { characters: [{ id: 1, name: tag }] };
}

// > 5 MB als JSON — landet im IndexedDB-only-Zweig
function grosseKampagne(tag) {
    return { characters: [{ id: 1, name: tag, notes: 'A'.repeat(Math.ceil(5.5 * 1024 * 1024)) }] };
}

function tagVon(datensatz) {
    if (!datensatz) return null;
    return JSON.parse(datensatz.data).characters[0].name;
}

/**
 * Persistenz-Werkbank: echte persistence.js (+ idb-tx.js, sobald im Loader) und echte
 * load() aus quick-roll.js. Spione protokollieren in dasselbe Log wie das IDB-Double.
 */
function erzeugePersistenz(opt = {}) {
    const log = [];
    const fake = erzeugeFakeIDB({ log, commitFehler: opt.commitFehler });
    (opt.idbBestand || []).forEach(d => fake.setze('campaigns', d));
    const lsStore = Object.assign({}, opt.lsStart || {});
    const indikator = [];
    const toasts = [];
    const context = {
        STORAGE_KEY: SCHLUESSEL,
        D: opt.D || kleineKampagne('Start'),
        APP_CONFIG: { DEBUG_MODE: false, VERSION: '9.9.9', STORAGE_KEY: SCHLUESSEL },
        updateSaveIndicator: jest.fn(s => {
            indikator.push(s);
            log.push('indicator:' + s);
        }),
        broadcastSave: jest.fn(() => log.push('broadcast')),
        ErrorHandler: { log: jest.fn(), showError: jest.fn() },
        idb: fake.db,
        indexedDB: {},
        localStorage: erzeugeLocalStorage(lsStore, log, opt.setItemWirft),
        showToast: jest.fn(m => toasts.push(String(m))),
        confirm: jest.fn(() => true),
        validateDataIntegrity: () => ({ valid: true, repairs: [] }),
        migrateData: p => p,
        compareVersions: () => 0,
        log: () => {},
        console,
        Blob,
        setTimeout,
        clearTimeout
    };
    context.initIndexedDB = jest.fn(async () => {
        context.idb = fake.db;
        return fake.db;
    });
    vm.createContext(context);
    context.window = context;
    context.self = context;
    ladeStorageApi(context);
    ladeModule(context, [
        IDB_TX_PFAD,
        'systems/spellslots/persistence.js',
        'systems/spellslots/quick-roll.js'
    ]);
    // quick-roll.js deklariert die echte exportAllDataAsFile() — nach dem Laden ersetzen
    const exportSpy = jest.fn(() => log.push('export'));
    context.exportAllDataAsFile = exportSpy;
    const hook = jest.fn(() => log.push('hook'));
    context._postSaveHooks = [hook];
    return { context, fake, lsStore, log, indikator, toasts, hook, exportSpy };
}

// Neustart nachstellen: kaltes window.idb, leeres D, echte load()
async function neustart(w) {
    w.context.idb = null;
    w.context.D = {};
    await w.context.load();
    return w.context.D;
}

function namenIn(D) {
    return (D.characters || []).map(c => c.name);
}

function letzter(liste) {
    return liste[liste.length - 1];
}

// Reihenfolge im gemeinsamen Log ohne '#<txId>'-Suffix
function ereignisse(log, muster) {
    return log.filter(e => muster.test(e)).map(e => e.replace(/#\d+(\([a-z]+\))?$/, ''));
}

const V1 = JSON.stringify({ characters: [{ id: 1, name: 'V1-Anker' }] });

// ============================================================
// C1 — Vertrag von utils/idb-tx.js
// ============================================================

describe('C1 — Vertrag von idbTransactionDone()/idbWriteTx() (utils/idb-tx.js)', () => {
    function ladeHelfer(fake) {
        // RED vor dem Fix: ENOENT — der Helfer existiert noch nicht
        const src = fs.readFileSync(path.join(WURZEL, IDB_TX_PFAD), 'utf8');
        const context = { console, setTimeout, idb: fake.db };
        context.initIndexedDB = async () => {
            context.idb = fake.db;
            return fake.db;
        };
        vm.createContext(context);
        context.window = context;
        vm.runInContext(src, context, { filename: IDB_TX_PFAD });
        return context;
    }

    test('bleibt nach request.success offen und loest erst nach complete auf', async () => {
        const fake = erzeugeFakeIDB();
        const ctx = ladeHelfer(fake);
        const tx = fake.db.transaction(['campaigns'], 'readwrite');
        const fertig = ctx.idbTransactionDone(tx).then(() => fake.log.push('RESOLVED'));
        tx.objectStore('campaigns').put({ id: 'k', data: 'x' });
        await mitFrist(fertig);
        expect(ereignisse(fake.log, /^(req\.|tx\.complete|tx\.abort|RESOLVED)/)).toEqual([
            'req.success',
            'tx.complete',
            'RESOLVED'
        ]);
    });

    test('lehnt mit QuotaExceededError ab, wenn nach dem Request nur abort feuert', async () => {
        const fake = erzeugeFakeIDB({ commitFehler: alleCommitsScheitern });
        const ctx = ladeHelfer(fake);
        const tx = fake.db.transaction(['campaigns'], 'readwrite');
        const fertig = ctx.idbTransactionDone(tx);
        tx.objectStore('campaigns').put({ id: 'k', data: 'x' });
        const r = await mitFrist(fertig);
        expect(r.zustand).toBe('abgelehnt');
        expect(r.fehler.name).toBe('QuotaExceededError');
        expect(fake.datensatz('campaigns', 'k')).toBeUndefined();
    });

    test('lehnt ab, wenn ein Request-Fehler zur Transaktion hochblubbert', async () => {
        const fake = erzeugeFakeIDB({
            requestFehler: op => {
                if (op !== 'put') return null;
                const e = new Error('Schluessel doppelt');
                e.name = 'ConstraintError';
                return e;
            }
        });
        const ctx = ladeHelfer(fake);
        const tx = fake.db.transaction(['campaigns'], 'readwrite');
        const fertig = ctx.idbTransactionDone(tx);
        tx.objectStore('campaigns').put({ id: 'k', data: 'x' });
        const r = await mitFrist(fertig);
        expect(r.zustand).toBe('abgelehnt');
        expect(r.fehler.name).toBe('ConstraintError');
    });

    test('lehnt mit name "AbortError" ab, wenn tx.error null ist (Skript-Abbruch)', async () => {
        const fake = erzeugeFakeIDB();
        const ctx = ladeHelfer(fake);
        const tx = fake.db.transaction(['campaigns'], 'readwrite');
        const fertig = ctx.idbTransactionDone(tx);
        tx.objectStore('campaigns').put({ id: 'k', data: 'x' });
        tx.abort();
        const r = await mitFrist(fertig);
        expect(r.zustand).toBe('abgelehnt');
        expect(r.fehler.name).toBe('AbortError');
    });

    test('idbWriteTx(): liefert den Rueckgabewert erst nach complete und reicht durability durch', async () => {
        const fake = erzeugeFakeIDB();
        const ctx = ladeHelfer(fake);
        const p = ctx
            .idbWriteTx(
                ['campaigns'],
                tx => {
                    tx.objectStore('campaigns').put({ id: 'k', data: 'x' });
                    return 'ergebnis';
                },
                { durability: 'strict' }
            )
            .then(wert => {
                fake.log.push('RESOLVED');
                return wert;
            });
        const r = await mitFrist(p);
        expect(r).toEqual({ zustand: 'erfuellt', wert: 'ergebnis' });
        expect(ereignisse(fake.log, /^(req\.|tx\.complete|tx\.abort|RESOLVED)/)).toEqual([
            'req.success',
            'tx.complete',
            'RESOLVED'
        ]);
        expect(fake.txOptionen[0]).toMatchObject({
            mode: 'readwrite',
            options: { durability: 'strict' }
        });
        expect(fake.datensatz('campaigns', 'k')).toMatchObject({ data: 'x' });
    });

    test('idbWriteTx(): synchron werfende Arbeit bricht die Transaktion ab und lehnt ab', async () => {
        const fake = erzeugeFakeIDB();
        const ctx = ladeHelfer(fake);
        const p = ctx.idbWriteTx(['campaigns'], tx => {
            tx.objectStore('campaigns').put({ id: 'k', data: 'x' });
            throw new Error('Arbeit kaputt');
        });
        const r = await mitFrist(p);
        expect(r.zustand).toBe('abgelehnt');
        expect(r.fehler.message).toBe('Arbeit kaputt');
        expect(fake.datensatz('campaigns', 'k')).toBeUndefined();
        expect(ereignisse(fake.log, /^tx\.(complete|abort)/)).toEqual(['tx.abort']);
    });

    test('idbWriteTx(): initialisiert eine kalte Datenbank und lehnt ohne IndexedDB ab', async () => {
        const fake = erzeugeFakeIDB();
        const ctx = ladeHelfer(fake);
        ctx.idb = null;
        const ok = await mitFrist(
            ctx.idbWriteTx(['campaigns'], tx => {
                tx.objectStore('campaigns').put({ id: 'k', data: 'x' });
            })
        );
        expect(ok.zustand).toBe('erfuellt');
        expect(fake.datensatz('campaigns', 'k')).toBeDefined();

        ctx.idb = null;
        ctx.initIndexedDB = async () => undefined; // idb bleibt null
        const r = await mitFrist(ctx.idbWriteTx(['campaigns'], () => undefined));
        expect(r.zustand).toBe('abgelehnt');
    });
});

// ============================================================
// P — echte persistence.js
// ============================================================

describe('P — persistence.js bestaetigt IndexedDB-Saves erst nach dem Commit (R04)', () => {
    test('P1: saveToIndexedDBFallback() lehnt mit QuotaExceededError ab, wenn der Commit nach put()-Erfolg abbricht', async () => {
        const w = erzeugePersistenz({ commitFehler: alleCommitsScheitern });
        const r = await mitFrist(w.context.saveToIndexedDBFallback(SCHLUESSEL, 'v2'));
        expect(r.zustand).toBe('abgelehnt');
        expect(r.fehler && r.fehler.name).toBe('QuotaExceededError');
        expect(w.fake.datensatz('campaigns', SCHLUESSEL)).toBeUndefined();
    });

    test('P1b: saveToIndexedDBFallback() loest erst nach tx complete auf', async () => {
        const w = erzeugePersistenz();
        const p = w.context
            .saveToIndexedDBFallback(SCHLUESSEL, 'v2')
            .then(() => w.log.push('RESOLVED'));
        await mitFrist(p);
        expect(ereignisse(w.log, /^(req\.|tx\.complete|tx\.abort|RESOLVED)/)).toEqual([
            'req.success',
            'tx.complete',
            'RESOLVED'
        ]);
    });

    test('P3: saveImmediate() >5 MB, jeder Commit bricht ab — letzter gueltiger Stand bleibt, UI meldet Fehler', async () => {
        const w = erzeugePersistenz({
            D: grosseKampagne('V2'),
            lsStart: { [SCHLUESSEL]: V1, [SCHLUESSEL + '_ts']: '111' },
            commitFehler: alleCommitsScheitern
        });
        const r = await mitFrist(w.context.saveImmediate(), 5000);
        expect(r.zustand).toBe('erfuellt');
        expect(w.lsStore[SCHLUESSEL]).toBe(V1);
        expect(w.lsStore[SCHLUESSEL + '_ts']).toBe('111');
        expect(w.indikator).not.toContain('saved');
        expect(letzter(w.indikator)).toBe('error');
        expect(w.toasts.some(t => t.includes('Daten sicher gespeichert'))).toBe(false);
        expect(w.toasts.some(t => t.includes('Speichern fehlgeschlagen'))).toBe(true);
        expect(w.exportSpy).toHaveBeenCalledTimes(1);
        expect(w.context.broadcastSave).not.toHaveBeenCalled();
        expect(w.hook).not.toHaveBeenCalled();
        expect(r.wert).toMatchObject({ success: false });
        expect(w.fake.datensatz('campaigns', SCHLUESSEL)).toBeUndefined();

        const D = await neustart(w);
        expect(namenIn(D)).toEqual(['V1-Anker']);
    });

    test('P4: debounced save() >5 MB, jeder Commit bricht ab — dieselbe Garantie wie saveImmediate()', async () => {
        const w = erzeugePersistenz({
            D: grosseKampagne('V2'),
            lsStart: { [SCHLUESSEL]: V1, [SCHLUESSEL + '_ts']: '111' },
            commitFehler: alleCommitsScheitern
        });
        w.context.save();
        await warte(450);
        await warteBis(() => w.indikator.length >= 2, 3000);
        expect(w.lsStore[SCHLUESSEL]).toBe(V1);
        expect(w.lsStore[SCHLUESSEL + '_ts']).toBe('111');
        expect(w.indikator).not.toContain('saved');
        expect(letzter(w.indikator)).toBe('error');
        expect(w.toasts.some(t => t.includes('Daten sicher gespeichert'))).toBe(false);
        expect(w.exportSpy).toHaveBeenCalledTimes(1);
        expect(w.context.broadcastSave).not.toHaveBeenCalled();
        expect(w.hook).not.toHaveBeenCalled();

        const D = await neustart(w);
        expect(namenIn(D)).toEqual(['V1-Anker']);
    }, 10000);

    test('P5: v1 liegt bereits in IndexedDB, >5-MB-Commit bricht ab — IDB behaelt v1, Anzeige endet auf error', async () => {
        const w = erzeugePersistenz({
            D: grosseKampagne('V2'),
            idbBestand: [{ id: SCHLUESSEL, data: V1, timestamp: 1 }],
            commitFehler: alleCommitsScheitern
        });
        const r = await mitFrist(w.context.saveImmediate(), 5000);
        expect(r.zustand).toBe('erfuellt');
        expect(w.fake.datensatz('campaigns', SCHLUESSEL).data).toBe(V1);
        expect(w.indikator).not.toContain('saved');
        expect(letzter(w.indikator)).toBe('error');
        expect(w.toasts.some(t => t.includes('sicher gespeichert'))).toBe(false);

        const D = await neustart(w);
        expect(namenIn(D)).toEqual(['V1-Anker']);
    });

    test('P6: localStorage voll (<5 MB) UND IDB-Fallback-Commit bricht ab — _ts bleibt, kein stiller Verlust', async () => {
        const w = erzeugePersistenz({
            D: kleineKampagne('V2'),
            lsStart: { [SCHLUESSEL]: V1, [SCHLUESSEL + '_ts']: '111' },
            setItemWirft: () => true,
            commitFehler: alleCommitsScheitern
        });
        const r = await mitFrist(w.context.saveImmediate(), 3000);
        expect(r.zustand).toBe('erfuellt');
        expect(w.lsStore[SCHLUESSEL + '_ts']).toBe('111');
        expect(w.lsStore[SCHLUESSEL]).toBe(V1);
        expect(w.indikator).not.toContain('saved');
        expect(letzter(w.indikator)).toBe('error');
        expect(w.toasts.some(t => t.includes('In IndexedDB gespeichert'))).toBe(false);
        expect(w.exportSpy).toHaveBeenCalledTimes(1);
        expect(r.wert).toMatchObject({ success: false });

        const D = await neustart(w);
        expect(namenIn(D)).toEqual(['V1-Anker']);
    });

    test('P7 (Kontrolle): >5 MB mit erfolgreichem Commit raeumt LS-Schatten und _ts, IDB haelt v2', async () => {
        const w = erzeugePersistenz({
            D: grosseKampagne('V2'),
            lsStart: { [SCHLUESSEL]: V1, [SCHLUESSEL + '_ts']: '111' }
        });
        await mitFrist(w.context.saveImmediate(), 5000);
        // Reine Zustandskontrolle (gruen vor und nach dem Fix): auf den Commit warten, die
        // Reihenfolge "erst Commit, dann Meldung" prueft P7-Reihenfolge.
        await warteBis(() => w.fake.datensatz('campaigns', SCHLUESSEL) !== undefined, 2000);
        expect(w.lsStore[SCHLUESSEL]).toBeUndefined();
        expect(w.lsStore[SCHLUESSEL + '_ts']).toBeUndefined();
        expect(tagVon(w.fake.datensatz('campaigns', SCHLUESSEL))).toBe('V2');
        expect(letzter(w.indikator)).toBe('saved');

        const D = await neustart(w);
        expect(namenIn(D)).toEqual(['V2']);
    });

    test('P7-Reihenfolge: Ergebnisvertrag, broadcastSave und Post-Save-Hook erst NACH tx complete', async () => {
        const w = erzeugePersistenz({ D: grosseKampagne('V2') });
        const r = await mitFrist(w.context.saveImmediate(), 5000);
        expect(r.wert).toEqual({ success: true, backend: 'indexedDB' });
        const folge = ereignisse(w.log, /^(tx\.complete|tx\.abort|broadcast|hook|indicator:saved)/);
        expect(folge).toEqual(['tx.complete', 'indicator:saved', 'broadcast', 'hook']);
    });

    test('P7b: erster Commit bricht ab, Retry gelingt — weder LS-Schatten noch _ts bleiben, IDB haelt v2', async () => {
        const w = erzeugePersistenz({
            D: grosseKampagne('V2'),
            lsStart: { [SCHLUESSEL]: V1, [SCHLUESSEL + '_ts']: '111' },
            commitFehler: ersteCommitsScheitern(1)
        });
        const r = await mitFrist(w.context.saveImmediate(), 5000);
        expect(r.zustand).toBe('erfuellt');
        expect(w.lsStore[SCHLUESSEL]).toBeUndefined();
        expect(w.lsStore[SCHLUESSEL + '_ts']).toBeUndefined();
        expect(tagVon(w.fake.datensatz('campaigns', SCHLUESSEL))).toBe('V2');
        expect(letzter(w.indikator)).toBe('saved');
        // Ursache richtig benennen: kein "localStorage voll" nach einem IDB-Retry
        expect(w.toasts.some(t => t.includes('zweiter Versuch'))).toBe(true);
        expect(w.toasts.some(t => t.includes('localStorage voll'))).toBe(false);
        expect(r.wert).toEqual({ success: true, backend: 'indexedDB' });

        const D = await neustart(w);
        expect(namenIn(D)).toEqual(['V2']);
    });

    test('P8: ein spaet bestaetigter >5-MB-Save A loescht den neueren LS-Stand B nicht', async () => {
        const w = erzeugePersistenz({ D: grosseKampagne('A') });
        const pA = w.context.saveImmediate();
        w.context.D = kleineKampagne('B-klein');
        const B = JSON.stringify(w.context.D);
        await w.context.saveImmediate();
        await mitFrist(pA, 5000);
        expect(w.lsStore[SCHLUESSEL]).toBe(B);
        expect(w.lsStore[SCHLUESSEL + '_ts']).toBeDefined();

        const D = await neustart(w);
        expect(namenIn(D)).toEqual(['B-klein']);
    });

    test('P8b: scheitert der neuere Save B vollstaendig, raeumt A den alten LS-Schatten samt _ts', async () => {
        const schalter = { lsKaputt: false };
        const w = erzeugePersistenz({
            D: grosseKampagne('A'),
            lsStart: { [SCHLUESSEL]: V1, [SCHLUESSEL + '_ts']: '111' },
            setItemWirft: () => schalter.lsKaputt,
            commitFehler: commitNummernScheitern([2])
        });
        const pA = w.context.saveImmediate();
        schalter.lsKaputt = true;
        w.context.D = kleineKampagne('B-klein');
        const rB = await mitFrist(w.context.saveImmediate(), 5000);
        const rA = await mitFrist(pA, 5000);
        expect(rA.zustand).toBe('erfuellt');
        expect(rB.zustand).toBe('erfuellt');
        expect(w.lsStore[SCHLUESSEL]).toBeUndefined();
        expect(w.lsStore[SCHLUESSEL + '_ts']).toBeUndefined();
        expect(tagVon(w.fake.datensatz('campaigns', SCHLUESSEL))).toBe('A');

        const D = await neustart(w);
        expect(namenIn(D)).toEqual(['A']);
    });

    test('A1: ein ueberholter Retry darf den neueren IDB-Stand nicht ueberschreiben', async () => {
        const w = erzeugePersistenz({
            D: grosseKampagne('A'),
            commitFehler: ersteCommitsScheitern(1)
        });
        const pA = w.context.saveImmediate();
        w.context.D = grosseKampagne('B');
        const pB = w.context.saveImmediate();
        const [rA, rB] = await Promise.all([mitFrist(pA, 5000), mitFrist(pB, 5000)]);
        expect(rA.zustand).toBe('erfuellt');
        expect(rB.zustand).toBe('erfuellt');
        await warte(20);
        expect(tagVon(w.fake.datensatz('campaigns', SCHLUESSEL))).toBe('B');
        expect(letzter(w.indikator)).toBe('saved');
    });

    test('A1b: der ueberholte Save meldet superseded und fasst Anzeige, Toasts und Export nicht an', async () => {
        const w = erzeugePersistenz({
            D: grosseKampagne('A'),
            commitFehler: ersteCommitsScheitern(1)
        });
        const pA = w.context.saveImmediate();
        w.context.D = grosseKampagne('B');
        const pB = w.context.saveImmediate();
        const [rA, rB] = await Promise.all([mitFrist(pA, 5000), mitFrist(pB, 5000)]);
        expect(rA.wert).toEqual({ success: false, superseded: true, error: 'superseded' });
        expect(rB.wert).toEqual({ success: true, backend: 'indexedDB' });
        expect(w.indikator).toEqual(['saving', 'saving', 'saved']);
        expect(w.exportSpy).not.toHaveBeenCalled();
        expect(w.toasts.some(t => t.includes('fehlgeschlagen'))).toBe(false);
    });

    test('E1: Notfall-Export einmal pro Fehlerserie, Fehleranzeige bei jedem Fehlschlag', async () => {
        const schalter = { idbKaputt: true };
        const w = erzeugePersistenz({
            D: kleineKampagne('E1'),
            setItemWirft: () => true,
            commitFehler: () => (schalter.idbKaputt ? quotaFehler() : null)
        });
        for (let i = 0; i < 3; i++) {
            w.context.D.characters[0].name = 'E1-' + i;
            await mitFrist(w.context.saveImmediate(), 3000);
        }
        expect(w.exportSpy).toHaveBeenCalledTimes(1);
        expect(w.indikator.filter(s => s === 'error')).toHaveLength(3);
        expect(w.toasts.filter(t => t.includes('Speichern fehlgeschlagen'))).toHaveLength(3);

        schalter.idbKaputt = false;
        const ok = await mitFrist(w.context.saveImmediate(), 3000);
        expect(ok.wert).toEqual({ success: true, backend: 'indexedDB' });
        expect(letzter(w.indikator)).toBe('saved');

        schalter.idbKaputt = true;
        await mitFrist(w.context.saveImmediate(), 3000);
        expect(w.exportSpy).toHaveBeenCalledTimes(2);
    });

    test('Ergebnisvertrag: localStorage-Save liefert {success:true, backend:"localStorage"}', async () => {
        const w = erzeugePersistenz({ D: kleineKampagne('LS') });
        const r = await mitFrist(w.context.saveImmediate());
        expect(r.wert).toEqual({ success: true, backend: 'localStorage' });
    });

    test('Optionale IDB-Kopie (2-5 MB) zahlt kein strict-fsync, der >5-MB-Zweig schon', async () => {
        const mittel = {
            characters: [{ id: 1, name: 'Mittel', notes: 'A'.repeat(3 * 1024 * 1024) }]
        };
        const w = erzeugePersistenz({ D: mittel });
        await mitFrist(w.context.saveImmediate());
        await warteBis(() => w.fake.datensatz('campaigns', SCHLUESSEL) !== undefined, 2000);
        const kopie = w.fake.txOptionen.filter(t => t.mode === 'readwrite');
        expect(kopie).toHaveLength(1);
        expect(kopie[0].options && kopie[0].options.durability).toBeUndefined();

        const g = erzeugePersistenz({ D: grosseKampagne('G') });
        await mitFrist(g.context.saveImmediate(), 5000);
        const gross = g.fake.txOptionen.filter(t => t.mode === 'readwrite');
        expect(gross[0].options).toEqual({ durability: 'strict' });
    });
});

// ============================================================
// Geschwister-Helfer: haengen nicht mehr, melden Commit-Fehler
// ============================================================

function erzeugeGeschwister(module, opt = {}) {
    const log = [];
    const fake = erzeugeFakeIDB({ log, commitFehler: opt.commitFehler });
    (opt.bestand || []).forEach(([store, wert]) => fake.setze(store, wert));
    const context = {
        APP_CONFIG: Object.assign(
            { DEBUG_MODE: false, BACKUP_KEY: BACKUP_SCHLUESSEL, STORAGE_KEY: SCHLUESSEL },
            opt.appConfig || {}
        ),
        STORAGE_KEY: SCHLUESSEL,
        D: opt.D || kleineKampagne('Held'),
        idb: fake.db,
        indexedDB: {},
        ErrorHandler: { log: jest.fn() },
        StorageAPI: opt.StorageAPI,
        showToast: jest.fn(),
        console,
        Blob,
        setTimeout,
        clearTimeout,
        setInterval: jest.fn(() => 1),
        clearInterval: jest.fn()
    };
    context.initIndexedDB = jest.fn(async () => {
        context.idb = fake.db;
        return fake.db;
    });
    vm.createContext(context);
    context.window = context;
    context.self = context;
    ladeModule(context, [IDB_TX_PFAD, ...module]);
    return { context, fake, log };
}

describe('Geschwister — systems/backups.js', () => {
    // U5 (R05/R10): createAutoBackup() schreibt nur unter dem Schluessel aus
    // getActiveCampaignKey() (core/data.js, hier nicht geladen -> Stub) und die
    // localStorage-Liste ueber StorageAPI.setQuiet() (ohne Quota-Toast).
    function storageStub() {
        return {
            getJSON: jest.fn((k, d) => d),
            setJSON: jest.fn(() => ({ success: true })),
            setQuiet: jest.fn(() => ({ success: true })),
            get: jest.fn(() => null),
            set: jest.fn(() => ({ success: true })),
            remove: jest.fn()
        };
    }
    function erzeugeBackupGeschwister(opt) {
        const g = erzeugeGeschwister(['systems/backups.js'], opt);
        g.context.getActiveCampaignKey = () => SCHLUESSEL;
        return g;
    }

    test('saveBackupToIndexedDB() lehnt bei Commit-Abbruch ab', async () => {
        const g = erzeugeGeschwister(['systems/backups.js'], {
            StorageAPI: storageStub(),
            commitFehler: alleCommitsScheitern
        });
        const r = await mitFrist(
            g.context.saveBackupToIndexedDB({ timestamp: 1, campaignKey: SCHLUESSEL, data: '{}' })
        );
        expect(r.zustand).toBe('abgelehnt');
    });

    test('createAutoBackup() erreicht bei Commit-Abbruch den localStorage-Rueckfall', async () => {
        const api = storageStub();
        const g = erzeugeBackupGeschwister({
            StorageAPI: api,
            commitFehler: alleCommitsScheitern
        });
        const r = await mitFrist(g.context.createAutoBackup());
        expect(r.zustand).toBe('erfuellt');
        expect(r.wert).toBe('written');
        expect(api.setQuiet).toHaveBeenCalledWith(BACKUP_SCHLUESSEL, expect.any(String));
    });

    test('Kontrolle: erfolgreicher Commit legt das Backup in IndexedDB ab, ohne LS-Rueckfall', async () => {
        const api = storageStub();
        const g = erzeugeBackupGeschwister({ StorageAPI: api });
        const r = await mitFrist(g.context.createAutoBackup());
        expect(r.zustand).toBe('erfuellt');
        expect(r.wert).toBe('written');
        expect(g.fake.anzahl('backups')).toBe(1);
        expect(api.setJSON).not.toHaveBeenCalled();
        expect(api.setQuiet).not.toHaveBeenCalled();
    });
});

describe('Geschwister — features/soundboard/soundboard-idb.js', () => {
    const DATEI = { name: 'a.mp3', size: 1000, type: 'audio/mpeg' };
    function eintrag(id, extra) {
        return Object.assign(
            { id, name: id + '.mp3', size: 1, type: 'audio/mpeg', blob: { b: id }, savedAt: 1 },
            extra || {}
        );
    }

    test('saveSoundBlob() lehnt bei Commit-Abbruch ab', async () => {
        const g = erzeugeGeschwister(['features/soundboard/soundboard-idb.js'], {
            commitFehler: alleCommitsScheitern
        });
        const r = await mitFrist(g.context.saveSoundBlob('s1', DATEI));
        expect(r.zustand).toBe('abgelehnt');
        expect(g.fake.datensatz('audioBlobs', 's1')).toBeUndefined();
    });

    test('deleteSoundBlob() lehnt bei Commit-Abbruch ab, der Eintrag bleibt', async () => {
        const g = erzeugeGeschwister(['features/soundboard/soundboard-idb.js'], {
            bestand: [['audioBlobs', eintrag('s1')]],
            commitFehler: alleCommitsScheitern
        });
        const r = await mitFrist(g.context.deleteSoundBlob('s1'));
        expect(r.zustand).toBe('abgelehnt');
        expect(g.fake.datensatz('audioBlobs', 's1')).toBeDefined();
    });

    test('softDeleteSoundBlob() lehnt bei Commit-Abbruch ab, kein Grabstein', async () => {
        const g = erzeugeGeschwister(['features/soundboard/soundboard-idb.js'], {
            bestand: [['audioBlobs', eintrag('s1')]],
            commitFehler: alleCommitsScheitern
        });
        const r = await mitFrist(g.context.softDeleteSoundBlob('s1'));
        expect(r.zustand).toBe('abgelehnt');
        expect(g.fake.datensatz('audioBlobs', 's1').deletedAt).toBeUndefined();
    });

    test('restoreSoundBlob() lehnt bei Commit-Abbruch ab, der Grabstein bleibt', async () => {
        const g = erzeugeGeschwister(['features/soundboard/soundboard-idb.js'], {
            bestand: [['audioBlobs', eintrag('s1', { deletedAt: Date.now() })]],
            commitFehler: alleCommitsScheitern
        });
        const r = await mitFrist(g.context.restoreSoundBlob('s1'));
        expect(r.zustand).toBe('abgelehnt');
        expect(g.fake.datensatz('audioBlobs', 's1').deletedAt).toBeDefined();
    });

    test('restoreSoundBlob(): true fuer unversehrten Eintrag ohne Neuschreiben, false fuer unbekannte id', async () => {
        const g = erzeugeGeschwister(['features/soundboard/soundboard-idb.js'], {
            bestand: [['audioBlobs', eintrag('s1')]]
        });
        const ok = await mitFrist(g.context.restoreSoundBlob('s1'));
        expect(ok).toEqual({ zustand: 'erfuellt', wert: true });
        // Grosse Blobs nicht ohne Not neu schreiben
        expect(g.fake.anfragen.filter(a => a.op === 'put')).toEqual([]);
        const unbekannt = await mitFrist(g.context.restoreSoundBlob('gibt-es-nicht'));
        expect(unbekannt).toEqual({ zustand: 'erfuellt', wert: false });
    });

    test('listSoundBlobs() loest auf, auch wenn die Grabstein-Aufraeum-Transaktion abbricht', async () => {
        const g = erzeugeGeschwister(['features/soundboard/soundboard-idb.js'], {
            bestand: [
                ['audioBlobs', eintrag('alt', { deletedAt: 1 })],
                ['audioBlobs', eintrag('aktiv')]
            ],
            commitFehler: alleCommitsScheitern
        });
        const r = await mitFrist(g.context.listSoundBlobs());
        expect(r.zustand).toBe('erfuellt');
        expect(r.wert.map(e => e.id)).toEqual(['aktiv']);
    });
});

describe('Geschwister — systems/file-backup/file-backup-permissions.js', () => {
    test('saveHandleToIDB() lehnt bei Commit-Abbruch ab', async () => {
        const g = erzeugeGeschwister(['systems/file-backup/file-backup-permissions.js'], {
            commitFehler: alleCommitsScheitern
        });
        const r = await mitFrist(g.context.saveHandleToIDB({ kind: 'directory', name: 'Backups' }));
        expect(r.zustand).toBe('abgelehnt');
    });

    test('Kontrolle: saveHandleToIDB() loest nach dem Commit auf, loadHandleFromIDB() findet den Handle', async () => {
        const g = erzeugeGeschwister(['systems/file-backup/file-backup-permissions.js']);
        const r = await mitFrist(g.context.saveHandleToIDB({ kind: 'directory', name: 'Backups' }));
        expect(r.zustand).toBe('erfuellt');
        const handle = await mitFrist(g.context.loadHandleFromIDB());
        expect(handle.wert).toEqual({ kind: 'directory', name: 'Backups' });
    });
});

describe('Geschwister — features/dice-stats/dice-stats-idb.js', () => {
    test('clearAllStats() liefert false bei Commit-Abbruch, der Datensatz bleibt', async () => {
        const g = erzeugeGeschwister(['features/dice-stats/dice-stats-idb.js'], {
            bestand: [['diceStats', { id: 1, notation: '1d20', result: 12 }]],
            commitFehler: alleCommitsScheitern
        });
        const r = await mitFrist(g.context.clearAllStats());
        expect(r).toEqual({ zustand: 'erfuellt', wert: false });
        expect(g.fake.datensatz('diceStats', 1)).toBeDefined();
    });

    test('Kontrolle: clearAllStats() liefert true erst nach erfolgreichem Commit', async () => {
        const g = erzeugeGeschwister(['features/dice-stats/dice-stats-idb.js'], {
            bestand: [['diceStats', { id: 1, notation: '1d20', result: 12 }]]
        });
        const r = await mitFrist(g.context.clearAllStats());
        expect(r).toEqual({ zustand: 'erfuellt', wert: true });
        expect(g.fake.anzahl('diceStats')).toBe(0);
    });
});

// ============================================================
// Kampagnen-Loeschung (campaign-manager.js)
// ============================================================

function erzeugeKampagnen(opt = {}) {
    const log = [];
    const fake = erzeugeFakeIDB({ log, commitFehler: opt.commitFehler });
    (opt.idbBestand || []).forEach(d => fake.setze('campaigns', d));
    const lsStore = Object.assign({}, opt.lsStart || {});
    if (opt.index) lsStore[INDEX_SCHLUESSEL] = JSON.stringify(opt.index);
    const alerts = [];
    let navigiertZu = null;
    const location = {
        pathname: '/dnd-tracker.html',
        get href() {
            return navigiertZu || 'file:///dnd-tracker.html';
        },
        set href(wert) {
            navigiertZu = wert;
            log.push('NAVIGATE');
        },
        reload: jest.fn(() => log.push('RELOAD'))
    };
    const context = {
        APP_CONFIG: {
            DEBUG_MODE: false,
            VERSION: '9.9.9',
            STORAGE_KEY: SCHLUESSEL,
            CAMPAIGN_INDEX_KEY: INDEX_SCHLUESSEL
        },
        STORAGE_KEY: SCHLUESSEL,
        idb: fake.db,
        indexedDB: {},
        localStorage: erzeugeLocalStorage(lsStore, log, opt.setItemWirft),
        location,
        confirm: jest.fn(() => true),
        alert: jest.fn(m => {
            alerts.push(String(m));
            log.push('ALERT');
        }),
        log: () => {},
        ErrorHandler: { log: jest.fn(), showError: jest.fn() },
        showToast: jest.fn(),
        stopAllTracks: jest.fn(),
        updateSaveIndicator: jest.fn(),
        broadcastSave: jest.fn(),
        console,
        Blob,
        setTimeout,
        clearTimeout
    };
    context.initIndexedDB = jest.fn(async () => {
        context.idb = fake.db;
        return fake.db;
    });
    vm.createContext(context);
    context.window = context;
    context.self = context;
    ladeStorageApi(context);
    ladeModule(context, [
        'core/data.js',
        IDB_TX_PFAD,
        'systems/spellslots/persistence.js',
        'systems/campaign-manager/campaign-manager.js'
    ]);
    if (opt.override) context.STORAGE_KEY_OVERRIDE = opt.override;
    context.D = { characters: [{ id: 1, name: 'Aktueller Stand' }] };
    return {
        context,
        fake,
        lsStore,
        log,
        alerts,
        navigiert: () => navigiertZu,
        index: () => JSON.parse(lsStore[INDEX_SCHLUESSEL] || 'null')
    };
}

describe('Kampagnen-Loeschung — deleteCampaign() erst nach bestaetigtem IDB-Delete (R04/R07)', () => {
    const K111 = 'dnd-campaign-111';
    const K222 = 'dnd-campaign-222';
    const DATEN_111 = JSON.stringify(kleineKampagne('Nordmark-Held'));
    const DATEN_222 = JSON.stringify(kleineKampagne('Suedland-Held'));
    function zweiKampagnen(active) {
        return {
            campaigns: [
                { key: K111, name: 'Nordmark', created: '2026-01-01' },
                { key: K222, name: 'Suedland', created: '2026-01-02' }
            ],
            active
        };
    }

    test('Standard-Kampagne, IDB-Delete bricht ab: nichts geloescht, keine Navigation, Fehlermeldung', async () => {
        const k = erzeugeKampagnen({
            lsStart: { [SCHLUESSEL]: V1, [SCHLUESSEL + '_ts']: '111' },
            idbBestand: [{ id: SCHLUESSEL, data: V1, timestamp: 1 }],
            commitFehler: alleCommitsScheitern
        });
        const r = await mitFrist(k.context.deleteCampaign(), 3000);
        expect(r.zustand).toBe('erfuellt');
        expect(k.lsStore[SCHLUESSEL]).toBe(V1);
        expect(k.lsStore[SCHLUESSEL + '_ts']).toBe('111');
        expect(k.fake.datensatz('campaigns', SCHLUESSEL)).toBeDefined();
        expect(k.navigiert()).toBeNull();
        expect(letzter(k.alerts)).toContain('Fehler beim Löschen');
        expect(k.alerts.some(a => a.includes('wurde gelöscht'))).toBe(false);
        expect(k.context.D.characters[0].name).toBe('Aktueller Stand');
    });

    test('Benannte Kampagne, IDB-Delete bricht ab: aus dem Index entfernt, Waisen-Warnung, Navigation', async () => {
        const k = erzeugeKampagnen({
            override: K111,
            index: zweiKampagnen(K111),
            lsStart: { [K111]: DATEN_111, [K111 + '_ts']: '5', [K222]: DATEN_222 },
            idbBestand: [{ id: K111, data: DATEN_111, timestamp: 1 }],
            commitFehler: alleCommitsScheitern
        });
        const r = await mitFrist(k.context.deleteCampaign(), 3000);
        expect(r.zustand).toBe('erfuellt');
        expect(k.index().campaigns.map(c => c.key)).toEqual([K222]);
        expect(k.index().active).toBe(SCHLUESSEL);
        expect(
            k.alerts.some(a =>
                a.includes('"Nordmark" wurde aus der Liste entfernt, aber die gespeicherten Daten')
            )
        ).toBe(true);
        expect(k.alerts.some(a => a.includes('✅'))).toBe(false);
        expect(k.navigiert()).not.toBeNull();
    });

    test('Erfolg: Alert und Navigation erst nach tx complete, alle Kopien und _ts weg, D zurueckgesetzt', async () => {
        const k = erzeugeKampagnen({
            lsStart: { [SCHLUESSEL]: V1, [SCHLUESSEL + '_ts']: '111' },
            idbBestand: [{ id: SCHLUESSEL, data: V1, timestamp: 1 }]
        });
        const r = await mitFrist(k.context.deleteCampaign(), 3000);
        expect(r.zustand).toBe('erfuellt');
        const folge = ereignisse(k.log, /^(tx\.complete|tx\.abort|ALERT|NAVIGATE)/);
        expect(folge).toEqual(['tx.complete', 'ALERT', 'NAVIGATE']);
        expect(k.lsStore[SCHLUESSEL]).toBeUndefined();
        expect(k.lsStore[SCHLUESSEL + '_ts']).toBeUndefined();
        expect(k.fake.datensatz('campaigns', SCHLUESSEL)).toBeUndefined();
        expect(letzter(k.alerts)).toContain('"Standard-Kampagne" wurde gelöscht');
        expect(k.context.D.characters).toEqual([]);
        // vollstaendiges Grundgeruest aus initializeData(), nicht die alte 19-Schluessel-Kopie
        expect(k.context.D.soundboard).toEqual({ scenes: [] });
        expect(k.context.D.bestiary).toEqual([]);
    });

    test('Divergenz: geloescht wird die Kampagne DIESES Tabs (111), nicht index.active (222)', async () => {
        const k = erzeugeKampagnen({
            override: K111,
            index: zweiKampagnen(K222),
            lsStart: { [K111]: DATEN_111, [K111 + '_ts']: '5', [K222]: DATEN_222 },
            idbBestand: [
                { id: K111, data: DATEN_111, timestamp: 1 },
                { id: K222, data: DATEN_222, timestamp: 1 }
            ]
        });
        const r = await mitFrist(k.context.deleteCampaign(), 3000);
        expect(r.zustand).toBe('erfuellt');
        expect(k.context.confirm.mock.calls[0][0]).toContain('"Nordmark"');
        expect(k.lsStore[K111]).toBeUndefined();
        expect(k.lsStore[K111 + '_ts']).toBeUndefined();
        expect(k.fake.datensatz('campaigns', K111)).toBeUndefined();
        expect(k.lsStore[K222]).toBe(DATEN_222);
        expect(k.fake.datensatz('campaigns', K222)).toBeDefined();
        expect(k.index().campaigns.map(c => c.key)).toEqual([K222]);
        expect(k.index().active).toBe(K222);
    });

    test('Scheitert das Schreiben des Kampagnenindex, wird nichts geloescht', async () => {
        const k = erzeugeKampagnen({
            override: K111,
            index: zweiKampagnen(K111),
            lsStart: { [K111]: DATEN_111, [K111 + '_ts']: '5' },
            idbBestand: [{ id: K111, data: DATEN_111, timestamp: 1 }],
            setItemWirft: key => key === INDEX_SCHLUESSEL
        });
        const r = await mitFrist(k.context.deleteCampaign(), 3000);
        expect(r.zustand).toBe('erfuellt');
        expect(k.lsStore[K111]).toBe(DATEN_111);
        expect(k.lsStore[K111 + '_ts']).toBe('5');
        expect(k.fake.datensatz('campaigns', K111)).toBeDefined();
        expect(k.index().campaigns.map(c => c.key)).toEqual([K111, K222]);
        expect(k.navigiert()).toBeNull();
        expect(letzter(k.alerts)).toContain('Kampagnenindex konnte nicht gespeichert werden');
    });
});

// ============================================================
// G1 — Quelltext-Waechter
// ============================================================

describe('G1 — schreibende IDB-Transaktionen laufen nur ueber idbWriteTx() (utils/idb-tx.js)', () => {
    // Einzige begruendete Ausnahme: statsIdbPut() schreibt Wuerfelstatistik fire-and-forget
    // (unkritisch, darf einen Wurf am Spieltisch nie aufhalten; Verlust eines Eintrags ist
    // hinnehmbar). Jede weitere rohe readwrite-Transaktion muss durch idbWriteTx().
    const ROHE_SCHREIBTX_ERLAUBT = { 'features/dice-stats/dice-stats-idb.js': 1 };
    // Store-Argument: Array-Literal, String (beide Anfuehrungszeichen) oder Bezeichner;
    // Modus 'readwrite' in beiden Anfuehrungszeichen.
    const ROHE_SCHREIBTX =
        /\.transaction\(\s*(?:\[[^\]]*\]|'[^']*'|"[^"]*"|[A-Za-z_$][\w$.]*)\s*,\s*(['"])readwrite\1/g;
    const TX_HANDLER_ZUWEISUNG = /\.on(?:complete|abort)\s*=(?!=)/g;

    function zaehle(src, muster) {
        return (src.match(muster) || []).length;
    }

    test('Selbsttest: das Muster erkennt alle Schreibweisen und laesst readonly aus', () => {
        expect(zaehle("db.transaction(['a'], 'readwrite')", ROHE_SCHREIBTX)).toBe(1);
        expect(zaehle('db.transaction(["a", "b"], "readwrite")', ROHE_SCHREIBTX)).toBe(1);
        expect(zaehle("db.transaction('a', 'readwrite')", ROHE_SCHREIBTX)).toBe(1);
        expect(zaehle('db.transaction("a", "readwrite")', ROHE_SCHREIBTX)).toBe(1);
        expect(zaehle("db.transaction(stores, 'readwrite')", ROHE_SCHREIBTX)).toBe(1);
        expect(zaehle("db.transaction(['a'], 'readonly')", ROHE_SCHREIBTX)).toBe(0);
        expect(zaehle('tx.oncomplete = () => {}', TX_HANDLER_ZUWEISUNG)).toBe(1);
        expect(zaehle('delTx.onabort=f', TX_HANDLER_ZUWEISUNG)).toBe(1);
        expect(zaehle('if (tx.oncomplete === null) {}', TX_HANDLER_ZUWEISUNG)).toBe(0);
    });

    test('kein Modul ausser utils/idb-tx.js oeffnet rohe readwrite-Transaktionen oder setzt oncomplete/onabort', () => {
        const verstoesse = [];
        let gelesen = 0;
        let erlaubteTreffer = 0;
        for (const rel of LOADER_MODULE) {
            if (rel === IDB_TX_PFAD) continue;
            const src = fs.readFileSync(path.join(WURZEL, rel), 'utf8');
            gelesen++;
            const roh = zaehle(src, ROHE_SCHREIBTX);
            const erlaubt = ROHE_SCHREIBTX_ERLAUBT[rel] || 0;
            if (rel in ROHE_SCHREIBTX_ERLAUBT) erlaubteTreffer += roh;
            if (roh > erlaubt) {
                verstoesse.push(
                    `${rel}: ${roh} rohe readwrite-Transaktion(en), erlaubt ${erlaubt}`
                );
            }
            const handler = zaehle(src, TX_HANDLER_ZUWEISUNG);
            if (handler > 0) verstoesse.push(`${rel}: ${handler}x .oncomplete/.onabort-Zuweisung`);
        }
        expect(verstoesse).toEqual([]);
        // Nicht-Vakuitaet: der Lauf hat den Modulbestand gelesen, die Ausnahme existiert wirklich
        expect(gelesen).toBeGreaterThan(100);
        expect(erlaubteTreffer).toBe(1);
    });
});
