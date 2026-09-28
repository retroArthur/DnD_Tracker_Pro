/**
 * Auto-Backup nach gemeinsamer Inhaltsdefinition — R10 + R05 (Schreibseite)
 * (Code-Review 2026-09-21, Einheit U5)
 *
 * R10: createAutoBackup() in systems/backups.js brach ab, sobald characters, npcs und quests
 * leer waren — eine dritte, private Kopie der Regel "was zaehlt als Inhalt". 20 der 23
 * Inhaltskategorien der gemeinsamen, SEC-06-geprueften Definition hasCampaignContent()
 * (systems/migration/migration-wizard.js) bekamen nie ein Backup: eine reine Wiki-Kampagne war
 * ungeschuetzt, und "Alle Daten loeschen" meldete "Sicherheitskopie erstellt", ohne eine zu
 * schreiben, entfernte nur den localStorage-Schluessel (load() holte die Kampagne aus IndexedDB
 * zurueck) und startete den Backup-Write erst nach dem Entfernen und dem geplanten Reload.
 * Leerlauf-Ticks schrieben identische Kopien; weil die Sitzungsuhr D.lastSessionDuration im
 * selben 5-Minuten-Takt aendert, rotierte die Sicherheitskopie vor einem ueberschreibenden
 * Import nach 25 Minuten heraus.
 * R05 (Schreibseite): die localStorage-Rueckfallliste deckelte ALLE Kampagnen gemeinsam auf
 * MAX_BACKUPS (eine Kampagne verdraengte die Backups einer anderen), und der Quota-Zweig
 * loeschte per remove(BACKUP_KEY) die Backups aller Kampagnen.
 * D2 = A: das Loeschen einer Kampagne entfernt auch ihre Auto-Backups.
 *
 * Werkbank: EIN vm-Kontext = window mit den ECHTEN Quelldateien in Loader-Reihenfolge;
 * spec-nahes IndexedDB-Double (jeder Request im eigenen Task, Schreibvorgaenge erst beim
 * Commit, Abbruch-Schalter feuert NUR 'abort', index.getAll(undefined) liefert ALLES);
 * localStorage auf einer Map mit Quota-Schalter und Schreibprotokoll; Blob aus der
 * Testumgebung; gefaelschter setTimeout (der Reload nach "Alle Daten loeschen" laeuft nie
 * echt, er wird nur protokolliert).
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
    'systems/spellslots/persistence.js',
    'systems/spellslots/import-export.js',
    'systems/backups.js',
    'systems/campaign-manager/campaign-manager.js',
    'systems/migration/migration-wizard.js'
];

const STANDARD_KEY = 'dnd-tracker-v4';
const KEY_A = 'dnd-campaign-1000';
const KEY_B = 'dnd-campaign-2000';
const KEY_WAISE = 'dnd-campaign-9999'; // steht in keinem Kampagnenindex
const BACKUP_KEY = 'dnd-tracker-backups';
const INDEX_KEY = 'dnd-tracker-campaigns';
const MB = 1024 * 1024;

const quelle = rel => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
const klon = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const warte = ms => new Promise(resolve => setTimeout(resolve, ms));

async function ruhe(n = 40) {
    for (let i = 0; i < n; i++) await new Promise(resolve => naechsterTask(resolve));
}

async function warteBis(bedingung, maxMs = 2000) {
    const start = Date.now();
    while (!bedingung()) {
        if (Date.now() - start > maxMs) return false;
        await warte(5);
    }
    return true;
}

/** Ein ewig offenes Promise wird zur klaren Assertion statt zum Jest-Timeout. */
function mitFrist(promise, ms = 1000) {
    return Promise.race([
        Promise.resolve(promise).then(
            wert => ({ zustand: 'erfuellt', wert }),
            fehler => ({ zustand: 'abgelehnt', fehler })
        ),
        new Promise(resolve => setTimeout(() => resolve({ zustand: 'haengt' }), ms))
    ]);
}

function quotaFehler() {
    const e = new Error('The quota has been exceeded.');
    e.name = 'QuotaExceededError';
    return e;
}

/** Quota-Schalter: nur der ERSTE Schreibversuch auf schluessel scheitert. */
function quotaEinmal(schluessel) {
    let n = 0;
    return k => k === schluessel && n++ === 0;
}

// ============================================================
// Spec-nahes IndexedDB-Double
// ============================================================

/**
 * - Jeder Request feuert success in einem EIGENEN Task; waehrend des Callbacks ist die
 *   Transaktion aktiv (Folge-Requests erlaubt), sonst nicht.
 * - Schreibvorgaenge (put/delete) werden vorgemerkt und erst beim Commit uebernommen.
 * - Commit im Task nach dem letzten Request; readwrite-Commits erscheinen im Log als
 *   'idb.commit:<stores>'.
 * - abbruch(storeNames) === true: der Commit scheitert und feuert AUSSCHLIESSLICH 'abort'
 *   (wie ein QuotaExceededError beim Commit) — kein 'error', kein 'complete'.
 * - index('campaign').getAll(undefined) liefert ALLE Datensaetze (echte Index-Semantik).
 */
function erzeugeFakeIdb({ log, abbruch }) {
    const tabellen = new Map();
    const zaehler = { tx: 0, getAll: [] };
    function tab(name) {
        if (!tabellen.has(name)) tabellen.set(name, new Map());
        return tabellen.get(name);
    }
    function transaction(storeNames, mode) {
        const namen = [].concat(storeNames);
        zaehler.tx++;
        const tx = { mode, error: null, oncomplete: null, onabort: null, onerror: null };
        const vorgemerkt = [];
        let offen = 0;
        let beendet = false;
        let aktiv = true;
        let geplant = false;

        function sicht(name) {
            const m = new Map(tab(name));
            for (const s of vorgemerkt) {
                if (s.store !== name) continue;
                if (s.op === 'put') m.set(s.key, s.value);
                else m.delete(s.key);
            }
            return m;
        }
        function planeCommit() {
            if (geplant || beendet || offen > 0) return;
            geplant = true;
            naechsterTask(() => {
                geplant = false;
                if (beendet || offen > 0) return;
                beendet = true;
                if (mode === 'readwrite' && abbruch && abbruch(namen)) {
                    tx.error = quotaFehler();
                    log.push('idb.abort:' + namen.join(','));
                    if (typeof tx.onabort === 'function') tx.onabort({ target: tx, type: 'abort' });
                    return;
                }
                for (const s of vorgemerkt) {
                    if (s.op === 'put') tab(s.store).set(s.key, s.value);
                    else tab(s.store).delete(s.key);
                    log.push(`idb.${s.op}:${s.store}:${s.key}`);
                }
                if (mode === 'readwrite') log.push('idb.commit:' + namen.join(','));
                if (typeof tx.oncomplete === 'function') {
                    tx.oncomplete({ target: tx, type: 'complete' });
                }
            });
        }
        function anfrage(ausfuehren) {
            if (beendet || !aktiv) {
                const e = new Error('Transaktion nicht aktiv');
                e.name = 'TransactionInactiveError';
                throw e;
            }
            const req = { result: undefined, error: null, onsuccess: null, onerror: null };
            offen++;
            naechsterTask(() => {
                req.result = ausfuehren();
                aktiv = true;
                try {
                    if (typeof req.onsuccess === 'function') req.onsuccess({ target: req });
                } finally {
                    aktiv = false;
                    offen--;
                    planeCommit();
                }
            });
            return req;
        }
        naechsterTask(() => {
            aktiv = false;
            planeCommit();
        });
        tx.abort = () => {
            if (beendet) return;
            beendet = true;
            vorgemerkt.length = 0;
            naechsterTask(() => {
                if (typeof tx.onabort === 'function') tx.onabort({ target: tx, type: 'abort' });
            });
        };
        tx.objectStore = name => ({
            put(wert) {
                const v = klon(wert);
                return anfrage(() => {
                    vorgemerkt.push({ store: name, op: 'put', key: v.id, value: v });
                    return v.id;
                });
            },
            delete(key) {
                return anfrage(() => {
                    vorgemerkt.push({ store: name, op: 'delete', key });
                    return undefined;
                });
            },
            get(key) {
                return anfrage(() => klon(sicht(name).get(key)));
            },
            getAll() {
                return anfrage(() => Array.from(sicht(name).values()).map(klon));
            },
            index(indexName) {
                const feld = indexName === 'campaign' ? 'campaignKey' : indexName;
                return {
                    getAll(q) {
                        zaehler.getAll.push(q);
                        return anfrage(() =>
                            Array.from(sicht(name).values())
                                .filter(x => q === undefined || x[feld] === q)
                                .map(klon)
                        );
                    }
                };
            }
        });
        return tx;
    }
    return {
        db: { transaction, objectStoreNames: { contains: () => true }, close() {} },
        tab,
        zaehler,
        zeilen: name => Array.from(tab(name).values()).map(klon),
        setze: (name, wert) => tab(name).set(wert.id, klon(wert)),
        leeren: () => tabellen.clear()
    };
}

// ============================================================
// localStorage-Double (Map, Quota-Schalter, Schreibprotokoll)
// ============================================================

function erzeugeLocalStorage(start, log, quota) {
    const m = new Map(Object.entries(start));
    const api = {
        getItem: k => (m.has(k) ? m.get(k) : null),
        setItem: (k, v) => {
            const s = String(v);
            if (quota.pruefe && quota.pruefe(k, s)) {
                log.push('ls.quota:' + k);
                throw quotaFehler();
            }
            m.set(k, s);
            log.push('ls.set:' + k);
        },
        removeItem: k => {
            m.delete(k);
            log.push('ls.remove:' + k);
        },
        clear: () => m.clear(),
        key: i => {
            const keys = Array.from(m.keys());
            return i < keys.length ? keys[i] : null;
        },
        get length() {
            return m.size;
        }
    };
    return { store: m, api };
}

// ============================================================
// Werkbank
// ============================================================

/**
 * @param {Object} opt
 * @param {string} [opt.aktiv=KEY_B] - Kampagne dieses Tabs (STORAGE_KEY_OVERRIDE)
 * @param {boolean} [opt.idbAus] - window.idb null und initIndexedDB() lehnt ab
 * @param {function(string[]): boolean} [opt.abbruch] - readwrite-Commit dieser Stores scheitert
 * @param {function(string, string): boolean} [opt.quota] - setItem wirft QuotaExceededError
 * @param {Object<string,string>} [opt.ls] - localStorage-Startbestand (roh)
 * @param {Array<[string, Object]>} [opt.idbZeilen] - IndexedDB-Startbestand
 * @param {boolean[]} [opt.antworten] - Antworten fuer confirm() der Reihe nach (sonst true)
 */
function erzeugeWerkbank(opt = {}) {
    const aktiv = opt.aktiv === undefined ? KEY_B : opt.aktiv;
    const log = [];
    const toasts = [];
    const confirms = [];
    const alerts = [];
    const timer = [];
    const antworten = (opt.antworten || []).slice();
    const quota = { pruefe: opt.quota || null };
    const start = Object.assign(
        {
            [INDEX_KEY]: JSON.stringify({
                campaigns: [
                    { key: KEY_A, name: 'Nordmark', created: '2026-09-01T00:00:00.000Z' },
                    { key: KEY_B, name: 'Suedland', created: '2026-09-02T00:00:00.000Z' }
                ],
                active: aktiv
            })
        },
        opt.ls || {}
    );
    const ls = erzeugeLocalStorage(start, log, quota);
    const fake = erzeugeFakeIdb({ log, abbruch: opt.abbruch });
    (opt.idbZeilen || []).forEach(([store, zeile]) => fake.setze(store, zeile));

    const ctx = {
        console,
        Blob,
        // Gefaelschter Timer: nichts laeuft echt (Reload, entprelltes save()), alles wird notiert
        setTimeout: (fn, ms) => {
            timer.push({ fn, ms });
            log.push('timer:' + ms);
            return timer.length;
        },
        clearTimeout: () => {},
        setInterval: () => 0,
        clearInterval: () => {},
        structuredClone: typeof structuredClone === 'function' ? structuredClone : klon
    };
    ctx.window = ctx;
    ctx.self = ctx;
    ctx.document = document;
    ctx.localStorage = ls.api;
    ctx.indexedDB = {};
    ctx.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
    ctx.debugLogAdd = jest.fn();
    ctx.log = () => {};
    vm.createContext(ctx);
    for (const rel of MODULE) vm.runInContext(quelle(rel), ctx, { filename: rel });

    ctx.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
    if (aktiv !== STANDARD_KEY) ctx.STORAGE_KEY_OVERRIDE = aktiv;
    ctx.idb = opt.idbAus ? null : fake.db;
    ctx.initIndexedDB = jest.fn(async () => {
        if (opt.idbAus) throw new Error('IndexedDB nicht verfuegbar (Test)');
        ctx.idb = fake.db;
        return fake.db;
    });
    ctx.showToast = jest.fn((m, typ) => {
        toasts.push({ text: String(m), typ });
        log.push('toast:' + m);
    });
    ctx.confirm = jest.fn(m => {
        confirms.push(String(m));
        log.push('confirm');
        return antworten.length ? antworten.shift() : true;
    });
    ctx.alert = jest.fn(m => {
        alerts.push(String(m));
        log.push('alert');
    });
    ctx.location = {
        pathname: '/dnd-tracker.html',
        href: 'file:///dnd-tracker.html',
        reload: jest.fn(() => log.push('reload'))
    };
    ctx.saveUndoState = jest.fn();
    ctx.stopAllTracks = jest.fn();
    ctx.renderAll = jest.fn();
    ctx.hideModal = jest.fn();
    ctx.updateSaveIndicator = jest.fn();
    ctx.broadcastSave = jest.fn();
    ctx.updateIOCounts = jest.fn();

    const w = { ctx, fake, ls: ls.store, log, toasts, confirms, alerts, timer };
    setzeD(w, opt.D || startzustand(w));
    return w;
}

/**
 * Realistischer Erststart-Zustand: das ECHTE initializeData() plus das, was der Start
 * zusaetzlich anlegt (Standard-Zufallstabellen, DM-Screen-Layout, voller Zaehlersatz).
 * Nichts davon ist Nutzerinhalt im Sinne von hasCampaignContent().
 */
function startzustand(w) {
    const d = w.ctx.initializeData();
    d.randomTables = [
        {
            id: 1,
            name: 'Zufällige Begegnung - Wald',
            icon: '🌲',
            entries: [{ weight: 1, text: 'Wolf' }]
        },
        {
            id: 2,
            name: 'Tavernen-Gerüchte',
            icon: '🍺',
            entries: [{ weight: 1, text: 'Ein Drache' }]
        },
        { id: 3, name: 'Wetter', icon: '🌦️', entries: [{ weight: 1, text: 'Regen' }] }
    ];
    d.dmScreenLayout = { widgets: [{ id: 'party-stats', type: 'party', visible: true }] };
    d._nextId = Object.fromEntries(Object.keys(w.ctx.ID_COUNTER_PATHS).map(k => [k, 1]));
    return d;
}

function setzeD(w, d) {
    w.ctx.replaceCampaignData(w.ctx.D, d);
}

function mitHeld(w, name = 'Thorin') {
    const d = startzustand(w);
    d.characters = [{ id: 1, name }];
    setzeD(w, d);
}

const backupZeilen = w => w.fake.zeilen('backups');
const lsListe = w => (w.ls.has(BACKUP_KEY) ? JSON.parse(w.ls.get(BACKUP_KEY)) : []);
const texte = w => w.toasts.map(t => t.text);
const kennung = b => `${b.campaignKey}@${b.timestamp}`;

/** localStorage-Backup (Form aus createAutoBackup). */
function eintrag(key, timestamp, data, kind) {
    const b = { timestamp, campaignKey: key, data };
    if (kind) b.kind = kind;
    return b;
}
/** IndexedDB-Backup (Form aus saveBackupToIndexedDB). */
function zeile(key, timestamp, data, kind) {
    return Object.assign(eintrag(key, timestamp, data, kind), { id: `${key}-${timestamp}` });
}

afterEach(() => {
    document.body.innerHTML = '';
});

// ============================================================
// R10 — gemeinsame Inhaltsdefinition
// ============================================================

describe('R10 — createAutoBackup() nutzt die gemeinsame Inhaltsdefinition hasCampaignContent()', () => {
    test.each([
        ['wiki', { id: 1, title: 'Götterpantheon', content: '<p>Monatelange Arbeit</p>' }],
        ['locations', { id: 1, name: 'Phandalin' }],
        ['sessionNotes', { id: 1, title: 'Sitzung 1', content: 'Die Gruppe ...' }],
        ['sessionPreps', { id: 1, titel: 'Sitzung 2', szenen: [{ titel: 'Überfall' }] }]
    ])(
        'T1: Kampagne nur mit "%s" bekommt genau ein IndexedDB-Backup unter dem aktiven Schluessel',
        async (key, inhalt) => {
            const w = erzeugeWerkbank();
            const d = startzustand(w);
            d[key] = [inhalt];
            setzeD(w, d);
            const r = await mitFrist(w.ctx.createAutoBackup());
            expect(r.zustand).toBe('erfuellt');
            const zeilen = backupZeilen(w);
            expect(zeilen).toHaveLength(1);
            expect(zeilen[0].campaignKey).toBe(KEY_B);
            expect(JSON.parse(zeilen[0].data)[key]).toEqual([inhalt]);
            expect(r.wert).toBe('written');
        }
    );

    test('T2: Invariante — hasCampaignContent(d) impliziert ein geschriebenes Backup, fuer JEDEN Eintrag der echten Listen', async () => {
        const w = erzeugeWerkbank();
        const arrays = Array.from(w.ctx.CAMPAIGN_CONTENT_ARRAYS);
        const textfelder = Array.from(w.ctx.CAMPAIGN_CONTENT_TEXT_FIELDS);
        const pfade = Array.from(w.ctx.CAMPAIGN_CONTENT_PATHS, p => Array.from(p));
        const faelle = [];
        arrays.forEach(k =>
            faelle.push([
                `array ${k}`,
                d => {
                    d[k] = [{ id: 1, name: 'Inhalt' }];
                }
            ])
        );
        textfelder.forEach(k =>
            faelle.push([
                `text ${k}`,
                d => {
                    d[k] = 'Notiz';
                }
            ])
        );
        pfade.forEach(p =>
            faelle.push([
                `pfad ${p.join('.')}`,
                d => {
                    let c = d;
                    for (let i = 0; i < p.length - 1; i++) {
                        if (!c[p[i]] || typeof c[p[i]] !== 'object') c[p[i]] = {};
                        c = c[p[i]];
                    }
                    c[p[p.length - 1]] = [{ id: 1, name: 'Inhalt' }];
                }
            ])
        );
        const verstoesse = [];
        let ausgewertet = 0;
        for (const [label, fuelle] of faelle) {
            w.fake.leeren();
            const d = startzustand(w);
            fuelle(d);
            setzeD(w, d);
            if (!w.ctx.hasCampaignContent(w.ctx.D)) continue;
            ausgewertet++;
            await mitFrist(w.ctx.createAutoBackup());
            if (backupZeilen(w).length !== 1) verstoesse.push(label);
        }
        expect(verstoesse).toEqual([]);
        // Nicht-vakuos: jeder Listeneintrag wurde als Inhalt erkannt und ausgewertet
        expect(ausgewertet).toBe(faelle.length);
        expect(faelle.length).toBe(arrays.length + textfelder.length + pfade.length);
        expect(faelle.length).toBeGreaterThanOrEqual(23);
    });

    test('T3 (Kontrolle): unveraenderte leere Kampagne (Startzustand, Probewurf, Tabwechsel) schreibt nichts', async () => {
        const w = erzeugeWerkbank();
        const d = startzustand(w);
        d.diceHistory = [{ formula: '1d20', total: 12 }];
        d.settings.lastView = 'wiki';
        setzeD(w, d);
        await mitFrist(w.ctx.createAutoBackup());
        await ruhe();
        expect(backupZeilen(w)).toHaveLength(0);
        expect(w.ls.has(BACKUP_KEY)).toBe(false);
        expect(w.log.filter(e => e.startsWith('idb.commit'))).toEqual([]);
    });

    test('T4: localStorage-Rueckfall (initIndexedDB lehnt ab) — Wiki-Kampagne landet mit aktivem Schluessel in der Liste', async () => {
        const w = erzeugeWerkbank({ idbAus: true });
        const d = startzustand(w);
        d.wiki = [{ id: 1, title: 'Lore' }];
        setzeD(w, d);
        const r = await mitFrist(w.ctx.createAutoBackup());
        const liste = lsListe(w);
        expect(liste).toHaveLength(1);
        expect(liste[0].campaignKey).toBe(KEY_B);
        expect(JSON.parse(liste[0].data).wiki[0].title).toBe('Lore');
        expect(r.wert).toBe('written');
    });
});

// ============================================================
// R10 — Aenderungsrevision und geschuetzte Sicherheitskopie
// ============================================================

describe('R10 — keine Duplikate, Sicherheitskopie rotiert nicht heraus', () => {
    test('T5: zwei Aufrufe ohne Aenderung -> EINE Zeile; nach einer Aenderung -> zweite Zeile', async () => {
        const w = erzeugeWerkbank();
        mitHeld(w);
        await mitFrist(w.ctx.createAutoBackup());
        await warte(3);
        const zweiter = await mitFrist(w.ctx.createAutoBackup());
        expect(backupZeilen(w)).toHaveLength(1);
        expect(zweiter.wert).toBe('unchanged');
        await warte(3);
        w.ctx.D.wiki.push({ id: 2, title: 'Neu' });
        const dritter = await mitFrist(w.ctx.createAutoBackup());
        expect(backupZeilen(w)).toHaveLength(2);
        expect(dritter.wert).toBe('written');
    });

    test('T6: verglichen wird nur mit der NEUESTEN Zeile — ein Stand gleich einer aelteren Zeile wird neu geschrieben', async () => {
        const w = erzeugeWerkbank();
        mitHeld(w, 'Stand A');
        const standA = JSON.stringify(w.ctx.D);
        w.fake.setze('backups', zeile(KEY_B, 1000, standA));
        w.fake.setze('backups', zeile(KEY_B, 2000, '{"characters":[{"id":1,"name":"Stand B"}]}'));
        const r = await mitFrist(w.ctx.createAutoBackup());
        expect(backupZeilen(w)).toHaveLength(3);
        expect(r.wert).toBe('written');
    });

    test('T6b: localStorage-Rueckfall — auch hier zaehlt nur der NEUESTE eigene Eintrag', async () => {
        const w = erzeugeWerkbank({ idbAus: true });
        mitHeld(w, 'Stand A');
        const standA = JSON.stringify(w.ctx.D);
        w.ls.set(
            BACKUP_KEY,
            JSON.stringify([
                eintrag(KEY_B, 2000, '{"characters":[{"id":1,"name":"Stand B"}]}'),
                eintrag(KEY_B, 1000, standA)
            ])
        );
        const r = await mitFrist(w.ctx.createAutoBackup());
        expect(r.wert).toBe('written');
        const eigene = lsListe(w).filter(b => b.campaignKey === KEY_B);
        expect(eigene).toHaveLength(2);
        expect(eigene[0].data).toBe(standA);
        expect(eigene[0].timestamp).toBeGreaterThan(2000);
    });

    test('T7: Sicherheitskopie + 6 Ticks mit wechselnder Sitzungsdauer -> die Sicherheitskopie bleibt erhalten', async () => {
        const w = erzeugeWerkbank();
        mitHeld(w);
        const sicherung = JSON.stringify(w.ctx.D);
        await mitFrist(w.ctx.createAutoBackup({ reason: 'safety' }));
        for (let i = 1; i <= 6; i++) {
            await warte(3);
            w.ctx.D.lastSessionDuration = i * 300; // Sitzungsuhr, selber Takt wie BACKUP_INTERVAL
            await mitFrist(w.ctx.createAutoBackup());
        }
        const zeilen = backupZeilen(w);
        const geschuetzt = zeilen.find(z => z.data === sicherung);
        expect(geschuetzt).toBeDefined();
        expect(geschuetzt.kind).toBe('safety');
        expect(zeilen.length).toBeLessThanOrEqual(5); // MAX_BACKUPS
    });

    test('T7b: localStorage-Rueckfall — hoechstens 2 Eintraege je Kampagne, die Sicherheitskopie wird einem aelteren Auto-Eintrag vorgezogen', async () => {
        const w = erzeugeWerkbank({ idbAus: true });
        mitHeld(w);
        const sicherung = JSON.stringify(w.ctx.D);
        await mitFrist(w.ctx.createAutoBackup({ reason: 'safety' }));
        for (let i = 1; i <= 3; i++) {
            await warte(3);
            w.ctx.D.lastSessionDuration = i * 300;
            await mitFrist(w.ctx.createAutoBackup());
        }
        const eigene = lsListe(w).filter(b => b.campaignKey === KEY_B);
        expect(eigene).toHaveLength(2);
        const geschuetzt = eigene.find(b => b.data === sicherung);
        expect(geschuetzt).toBeDefined();
        expect(geschuetzt.kind).toBe('safety');
        expect(JSON.parse(eigene.find(b => b !== geschuetzt).data).lastSessionDuration).toBe(900);
    });

    // Waechter (U5 minor:5): der haeufigste echte Weg — der letzte periodische Tick gleicht D
    // schon, dann folgt ein ueberschreibender Import. Der 'unchanged'-Zweig muss die bestehende
    // Zeile auf kind 'safety' HOCHSTUFEN, sonst rotiert der Vor-Import-Stand heraus.
    test('T7c: "unchanged" stuft die bestehende IndexedDB-Zeile auf "safety" hoch — sie bleibt 6 Ticks erhalten', async () => {
        const w = erzeugeWerkbank();
        mitHeld(w);
        const stand = JSON.stringify(w.ctx.D);
        expect((await mitFrist(w.ctx.createAutoBackup())).wert).toBe('written');
        await warte(3);
        expect((await mitFrist(w.ctx.createAutoBackup({ reason: 'safety' }))).wert).toBe(
            'unchanged'
        );
        for (let i = 1; i <= 6; i++) {
            await warte(3);
            w.ctx.D.lastSessionDuration = i * 300;
            await mitFrist(w.ctx.createAutoBackup());
        }
        const zeile6 = backupZeilen(w).find(z => z.data === stand);
        expect(zeile6).toBeDefined();
        expect(zeile6.kind).toBe('safety');
    });

    test('T7d: dasselbe im localStorage-Rueckfall — "unchanged" stuft den bestehenden Eintrag hoch', async () => {
        const w = erzeugeWerkbank({ idbAus: true });
        mitHeld(w);
        const stand = JSON.stringify(w.ctx.D);
        expect((await mitFrist(w.ctx.createAutoBackup())).wert).toBe('written');
        await warte(3);
        expect((await mitFrist(w.ctx.createAutoBackup({ reason: 'safety' }))).wert).toBe(
            'unchanged'
        );
        for (let i = 1; i <= 3; i++) {
            await warte(3);
            w.ctx.D.lastSessionDuration = i * 300;
            await mitFrist(w.ctx.createAutoBackup());
        }
        const eintragS = lsListe(w).find(b => b.data === stand);
        expect(eintragS).toBeDefined();
        expect(eintragS.kind).toBe('safety');
    });

    // Waechter (U5 minor:7): geschuetzt ist die NEUESTE Sicherheitskopie, nicht die aelteste.
    // Der zuletzt gesicherte Stand vor einer destruktiven Aktion ist der, den der Nutzer sucht.
    test('T7e: zwei Sicherheitskopien + 6 Ticks -> die NEUERE bleibt erhalten', async () => {
        const w = erzeugeWerkbank();
        mitHeld(w);
        const s1 = JSON.stringify(w.ctx.D);
        expect((await mitFrist(w.ctx.createAutoBackup({ reason: 'safety' }))).wert).toBe('written');
        await warte(3);
        w.ctx.D.characters.push({ id: 2, name: 'Zweiter' });
        const s2 = JSON.stringify(w.ctx.D);
        expect((await mitFrist(w.ctx.createAutoBackup({ reason: 'safety' }))).wert).toBe('written');
        for (let i = 1; i <= 6; i++) {
            await warte(3);
            w.ctx.D.lastSessionDuration = i * 300;
            await mitFrist(w.ctx.createAutoBackup());
        }
        const zeilen = backupZeilen(w);
        const neuere = zeilen.find(z => z.data === s2);
        expect(neuere).toBeDefined();
        expect(neuere.kind).toBe('safety');
        expect(zeilen.length).toBeLessThanOrEqual(5); // MAX_BACKUPS
        // Nicht-vakuos: die aeltere Sicherheitskopie IST herausrotiert
        expect(zeilen.some(z => z.data === s1)).toBe(false);
    });

    // U5 minor:1 / R10 P1: nach EINEM abgebrochenen IndexedDB-Commit schieben die
    // localStorage-Eintraege die geschuetzte Sicherheitskopie dauerhaft aus getBackups() —
    // die Zeile existiert noch, restoreBackup() meldet aber '❌ Backup nicht gefunden'.
    test('T19: geschuetzte Sicherheitskopie bleibt nach einem voruebergehenden IndexedDB-Ausfall gelistet und wiederherstellbar', async () => {
        const schalter = { idbKaputt: false };
        const w = erzeugeWerkbank({
            abbruch: namen => schalter.idbKaputt && namen.includes('backups')
        });
        mitHeld(w);
        const sicherung = JSON.stringify(w.ctx.D);
        expect((await mitFrist(w.ctx.createAutoBackup({ reason: 'safety' }))).wert).toBe('written');
        let tick = 0;
        const naechsterTick = async () => {
            tick++;
            await warte(3);
            w.ctx.D.lastSessionDuration = tick * 300;
            return (await mitFrist(w.ctx.createAutoBackup())).wert;
        };
        schalter.idbKaputt = true;
        await naechsterTick();
        await naechsterTick();
        schalter.idbKaputt = false;
        for (let i = 0; i < 4; i++) await naechsterTick();

        const zeile21 = backupZeilen(w).find(z => z.data === sicherung);
        expect(zeile21).toBeDefined(); // die Zeile ist nicht verloren, nur unsichtbar
        const liste = await w.ctx.getBackups();
        expect(liste.some(b => b.data === sicherung)).toBe(true);
        expect(liste.length).toBeLessThanOrEqual(5); // MAX_BACKUPS
        expect(liste.map(b => b.timestamp)).toEqual(
            liste.map(b => b.timestamp).sort((a, b) => b - a)
        );

        w.toasts.length = 0;
        await mitFrist(w.ctx.restoreBackup(String(zeile21.timestamp)), 3000);
        expect(texte(w)).not.toContain('❌ Backup nicht gefunden');
    }, 20000);

    test('T19b: ein abgebrochener Tick und 14 gesunde Ticks spaeter ist sie weiterhin gelistet', async () => {
        const schalter = { idbKaputt: false };
        const w = erzeugeWerkbank({
            abbruch: namen => schalter.idbKaputt && namen.includes('backups')
        });
        mitHeld(w);
        const sicherung = JSON.stringify(w.ctx.D);
        await mitFrist(w.ctx.createAutoBackup({ reason: 'safety' }));
        let tick = 0;
        const naechsterTick = async () => {
            tick++;
            await warte(3);
            w.ctx.D.lastSessionDuration = tick * 300;
            return (await mitFrist(w.ctx.createAutoBackup())).wert;
        };
        schalter.idbKaputt = true;
        await naechsterTick();
        schalter.idbKaputt = false;
        for (let i = 0; i < 14; i++) await naechsterTick();

        const liste = await w.ctx.getBackups();
        expect(liste.some(b => b.data === sicherung)).toBe(true);
        expect(liste.length).toBeLessThanOrEqual(5);
    }, 30000);

    test('T8 (Kontrolle, U3): Commit-Abbruch (nur abort) -> createAutoBackup kommt binnen 300 ms zurueck und schreibt den localStorage-Rueckfall', async () => {
        const w = erzeugeWerkbank({ abbruch: namen => namen.includes('backups') });
        mitHeld(w);
        const r = await mitFrist(w.ctx.createAutoBackup(), 300);
        expect(r.zustand).toBe('erfuellt');
        expect(backupZeilen(w)).toHaveLength(0);
        const liste = lsListe(w);
        expect(liste).toHaveLength(1);
        expect(liste[0].campaignKey).toBe(KEY_B);
    });

    test('T9 (Waechter): die Daten werden SYNCHRON beim Aufruf erfasst — eine Aenderung direkt danach landet nicht im Backup', async () => {
        const w = erzeugeWerkbank();
        mitHeld(w, 'Vorher');
        const p = w.ctx.createAutoBackup({ reason: 'safety' });
        w.ctx.D.characters[0].name = 'Nachher';
        w.ctx.D.wiki.push({ id: 9, title: 'Importiert' });
        await mitFrist(p);
        const zeilen = backupZeilen(w);
        expect(zeilen).toHaveLength(1);
        const daten = JSON.parse(zeilen[0].data);
        expect(daten.characters[0].name).toBe('Vorher');
        expect(daten.wiki).toEqual([]);
    });
});

// ============================================================
// R10 — Rueckgabestatus
// ============================================================

describe('R10 — createAutoBackup() liefert einen Status', () => {
    test('T10a: "written", dann "unchanged"', async () => {
        const w = erzeugeWerkbank();
        mitHeld(w);
        expect((await mitFrist(w.ctx.createAutoBackup())).wert).toBe('written');
        await warte(3);
        expect((await mitFrist(w.ctx.createAutoBackup())).wert).toBe('unchanged');
    });

    test('T10b: "skipped-empty" fuer die unveraenderte leere Kampagne aus T3', async () => {
        const w = erzeugeWerkbank();
        const d = startzustand(w);
        d.diceHistory = [{ formula: '1d20', total: 12 }];
        d.settings.lastView = 'wiki';
        setzeD(w, d);
        expect((await mitFrist(w.ctx.createAutoBackup())).wert).toBe('skipped-empty');
    });

    test('T10c: "failed", wenn IndexedDB fehlt und jeder localStorage-Versuch an der Quota scheitert', async () => {
        const w = erzeugeWerkbank({ idbAus: true, quota: k => k === BACKUP_KEY });
        mitHeld(w);
        expect((await mitFrist(w.ctx.createAutoBackup())).wert).toBe('failed');
    });

    test('T10d: "failed" ohne gueltigen Kampagnenschluessel', async () => {
        const w = erzeugeWerkbank();
        w.ctx.getActiveCampaignKey = () => null;
        mitHeld(w);
        expect((await mitFrist(w.ctx.createAutoBackup())).wert).toBe('failed');
    });
});

// ============================================================
// R05 (Schreibseite) — kampagnengerechte localStorage-Rueckfallliste
// ============================================================

describe('R05 (Schreibseite) — localStorage-Rueckfallliste je Kampagne, kein Loeschen fremder Backups', () => {
    test('T11: B aktiv, 5 A-Backups im localStorage, IndexedDB aus -> alle 5 A-Eintraege bleiben, 1 B-Eintrag kommt dazu', async () => {
        const aBackups = [5, 4, 3, 2, 1].map(i =>
            eintrag(KEY_A, 1000 + i, `{"characters":[{"id":1,"name":"A${i}"}]}`)
        );
        const w = erzeugeWerkbank({ idbAus: true, ls: { [BACKUP_KEY]: JSON.stringify(aBackups) } });
        mitHeld(w, 'B-Held');
        const r = await mitFrist(w.ctx.createAutoBackup());
        const liste = lsListe(w);
        expect(
            liste
                .filter(b => b.campaignKey === KEY_A)
                .map(b => b.timestamp)
                .sort((x, y) => x - y)
        ).toEqual([1001, 1002, 1003, 1004, 1005]);
        expect(liste.filter(b => b.campaignKey === KEY_B)).toHaveLength(1);
        expect(r.wert).toBe('written');
    });

    test('T12a: Quota beim ersten Versuch, verwaister Eintrag vorhanden -> nur die Waise weicht, A@5 bleibt', async () => {
        const w = erzeugeWerkbank({
            idbAus: true,
            ls: {
                [BACKUP_KEY]: JSON.stringify([
                    eintrag(KEY_A, 5, '{"characters":[{"id":1,"name":"A"}]}'),
                    eintrag(KEY_WAISE, 3, '{"characters":[{"id":1,"name":"W"}]}')
                ])
            },
            quota: quotaEinmal(BACKUP_KEY)
        });
        mitHeld(w, 'B-Held');
        const r = await mitFrist(w.ctx.createAutoBackup());
        const kennungen = lsListe(w).map(kennung);
        expect(kennungen).toContain(`${KEY_A}@5`);
        expect(kennungen).not.toContain(`${KEY_WAISE}@3`);
        expect(lsListe(w).filter(b => b.campaignKey === KEY_B)).toHaveLength(1);
        expect(w.log).not.toContain('ls.remove:' + BACKUP_KEY);
        expect(r.wert).toBe('written');
    });

    test('T12b: ohne Waise weicht zuerst der aeltere Eintrag der AKTIVEN Kampagne, A@5 bleibt', async () => {
        const w = erzeugeWerkbank({
            idbAus: true,
            ls: {
                [BACKUP_KEY]: JSON.stringify([
                    eintrag(KEY_A, 5, '{"characters":[{"id":1,"name":"A"}]}'),
                    eintrag(KEY_B, 4, '{"characters":[{"id":1,"name":"B-alt"}]}')
                ])
            },
            quota: quotaEinmal(BACKUP_KEY)
        });
        mitHeld(w, 'B-neu');
        const r = await mitFrist(w.ctx.createAutoBackup());
        const kennungen = lsListe(w).map(kennung);
        expect(kennungen).toContain(`${KEY_A}@5`);
        expect(kennungen).not.toContain(`${KEY_B}@4`);
        const eigene = lsListe(w).filter(b => b.campaignKey === KEY_B);
        expect(eigene).toHaveLength(1);
        expect(JSON.parse(eigene[0].data).characters[0].name).toBe('B-neu');
        expect(r.wert).toBe('written');
    });

    // Nutzerentscheidung 2026-09-27 (D-A), frueher Reihenfolge 4: das LETZTE verbleibende
    // Backup einer FREMDEN Kampagne weicht nie — auch nicht als letztes Mittel. Steht sonst
    // nichts im Weg, scheitert das neue Backup ehrlich ('failed') und meldet keinen Erfolg;
    // die Live-Daten der aktiven Kampagne sind ohnehin gespeichert, es geht nichts verloren.
    test('T12c: nur A@5 im Weg -> es ist As letztes Backup und bleibt, das neue scheitert ehrlich', async () => {
        const vorher = JSON.stringify([eintrag(KEY_A, 5, '{"characters":[{"id":1,"name":"A"}]}')]);
        const w = erzeugeWerkbank({
            idbAus: true,
            ls: { [BACKUP_KEY]: vorher },
            quota: quotaEinmal(BACKUP_KEY)
        });
        mitHeld(w, 'B-Held');
        const r = await mitFrist(w.ctx.createAutoBackup());
        expect(r.wert).toBe('failed');
        expect(lsListe(w).map(kennung)).toEqual([`${KEY_A}@5`]);
        expect(w.ls.get(BACKUP_KEY)).toBe(vorher);
        expect(w.log).not.toContain('ls.remove:' + BACKUP_KEY);
        expect(texte(w)).toEqual([]);
    });

    // D-A Regel 3+4: ein aelterer fremder Eintrag darf weichen, solange dieser Kampagne
    // danach mindestens einer bleibt — der letzte nie, auch wenn das Budget danach weiter
    // ueberschritten ist. Frueher raeumte Reihenfolge 4 hier auch A@2500 weg.
    test('T12d: Budget bleibt nach der ersten Verdraengung ueberschritten -> As letzter Eintrag bleibt trotzdem', async () => {
        const gross = n => 'x'.repeat(Math.round(n));
        const w = erzeugeWerkbank({
            idbAus: true,
            ls: {
                [BACKUP_KEY]: JSON.stringify([
                    eintrag(KEY_A, 2500, `{"a2":"${gross(2.5 * MB)}"}`),
                    eintrag(KEY_A, 100, `{"a1":"${gross(0.1 * MB)}"}`)
                ])
            }
        });
        const d = startzustand(w);
        d.characters = [{ id: 1, name: 'B', notes: gross(1.9 * MB) }];
        setzeD(w, d);

        const r = await mitFrist(w.ctx.createAutoBackup(), 5000);

        const kennungen = lsListe(w).map(kennung);
        expect(r.wert).toBe('written');
        expect(kennungen).toContain(`${KEY_A}@2500`);
        expect(kennungen).not.toContain(`${KEY_A}@100`);
        expect(lsListe(w)[0].campaignKey).toBe(KEY_B);
    });

    // D-A Regel 2 vor Regel 3: der eigene aeltere Eintrag weicht VOR einem fremden. Frueher
    // stand der fremde nicht-neueste Eintrag davor (Reihenfolge 2 vor 3).
    test('T12e: eigener aelterer Eintrag UND fremdes Paar -> der eigene weicht, A behaelt beide', async () => {
        const w = erzeugeWerkbank({
            idbAus: true,
            ls: {
                [BACKUP_KEY]: JSON.stringify([
                    eintrag(KEY_A, 5, '{"characters":[{"id":1,"name":"A-neu"}]}'),
                    eintrag(KEY_A, 4, '{"characters":[{"id":1,"name":"A-alt"}]}'),
                    eintrag(KEY_B, 3, '{"characters":[{"id":1,"name":"B-alt"}]}')
                ])
            },
            quota: quotaEinmal(BACKUP_KEY)
        });
        mitHeld(w, 'B-neu');
        const r = await mitFrist(w.ctx.createAutoBackup());
        const kennungen = lsListe(w).map(kennung);
        expect(r.wert).toBe('written');
        expect(kennungen).toContain(`${KEY_A}@5`);
        expect(kennungen).toContain(`${KEY_A}@4`);
        expect(kennungen).not.toContain(`${KEY_B}@3`);
        const eigene = lsListe(w).filter(b => b.campaignKey === KEY_B);
        expect(eigene).toHaveLength(1);
        expect(JSON.parse(eigene[0].data).characters[0].name).toBe('B-neu');
    });

    // D-A Regel 2, Klammerzusatz: die eigene geschuetzte Sicherungskopie (kind 'safety', der
    // Stand vor einer destruktiven Aktion) weicht nie. Frueher raeumte Reihenfolge 3 sie weg.
    test('T12f: nur die eigene Sicherungskopie im Weg -> sie bleibt, das neue Backup scheitert ehrlich', async () => {
        const vorher = JSON.stringify([
            eintrag(KEY_B, 4, '{"characters":[{"id":1,"name":"B-vor-dem-Import"}]}', 'safety')
        ]);
        const w = erzeugeWerkbank({
            idbAus: true,
            ls: { [BACKUP_KEY]: vorher },
            quota: quotaEinmal(BACKUP_KEY)
        });
        mitHeld(w, 'B-neu');
        const r = await mitFrist(w.ctx.createAutoBackup());
        expect(r.wert).toBe('failed');
        expect(w.ls.get(BACKUP_KEY)).toBe(vorher);
        const liste = lsListe(w);
        expect(liste).toHaveLength(1);
        expect(liste[0].kind).toBe('safety');
    });

    // D-A Regel 1, zweite Haelfte: ein Eintrag OHNE campaignKey ist verwaist, auch wenn der
    // Kampagnenindex unlesbar ist (dann gilt sonst kein Eintrag als verwaist) — sonst muesste
    // hier der einzige Eintrag einer echten Kampagne weichen oder alles scheitern.
    test('T12g: unlesbarer Index, Eintrag ohne campaignKey -> die Waise weicht, As einziger Eintrag bleibt', async () => {
        const w = erzeugeWerkbank({
            idbAus: true,
            ls: {
                [BACKUP_KEY]: JSON.stringify([
                    eintrag(KEY_A, 5, '{"characters":[{"id":1,"name":"A"}]}'),
                    eintrag('', 3, '{"characters":[{"id":1,"name":"Ohne Schlüssel"}]}')
                ])
            },
            quota: quotaEinmal(BACKUP_KEY)
        });
        w.ctx.getCampaignIndex = () => {
            throw new Error('Kampagnenindex unlesbar (Test)');
        };
        mitHeld(w, 'B-Held');
        const r = await mitFrist(w.ctx.createAutoBackup());
        const kennungen = lsListe(w).map(kennung);
        expect(r.wert).toBe('written');
        expect(kennungen).toContain(`${KEY_A}@5`);
        expect(kennungen).not.toContain('@3');
        expect(lsListe(w).filter(b => b.campaignKey === KEY_B)).toHaveLength(1);
    });

    test('T13: jeder Schreibversuch scheitert -> "failed", die gespeicherte Liste bleibt byte-identisch, kein Toast-Spam', async () => {
        const roh = JSON.stringify([
            eintrag(KEY_A, 5, '{"characters":[{"id":1,"name":"A"}]}'),
            eintrag(KEY_WAISE, 3, '{"characters":[{"id":1,"name":"W"}]}')
        ]);
        const w = erzeugeWerkbank({
            idbAus: true,
            ls: { [BACKUP_KEY]: roh },
            quota: k => k === BACKUP_KEY
        });
        mitHeld(w, 'B-Held');
        const r = await mitFrist(w.ctx.createAutoBackup());
        expect(w.ls.get(BACKUP_KEY)).toBe(roh);
        expect(w.log).not.toContain('ls.remove:' + BACKUP_KEY);
        expect(texte(w).some(t => t.includes('Speicher voll'))).toBe(false);
        expect(r.wert).toBe('failed');
    });

    test('T14: Budget ueberschritten -> zuerst weicht die Waise (obwohl sie der NEUESTE fremde Eintrag ist)', async () => {
        const gross = n => 'x'.repeat(Math.round(n));
        const w = erzeugeWerkbank({
            idbAus: true,
            ls: {
                [BACKUP_KEY]: JSON.stringify([
                    eintrag(KEY_WAISE, 3000, `{"w":"${gross(1.3 * MB)}"}`),
                    eintrag(KEY_A, 2000, `{"a2":"${gross(1.3 * MB)}"}`),
                    eintrag(KEY_A, 1000, `{"a1":"${gross(1.3 * MB)}"}`)
                ])
            }
        });
        const d = startzustand(w);
        d.characters = [{ id: 1, name: 'B', notes: gross(0.5 * MB) }];
        setzeD(w, d);
        const r = await mitFrist(w.ctx.createAutoBackup(), 5000);
        const kennungen = lsListe(w).map(kennung);
        expect(kennungen).not.toContain(`${KEY_WAISE}@3000`);
        expect(kennungen).toContain(`${KEY_A}@2000`);
        expect(kennungen).toContain(`${KEY_A}@1000`);
        expect(lsListe(w)[0].campaignKey).toBe(KEY_B);
        expect(r.wert).toBe('written');
    });

    test('T14b: danach weichen fremde NICHT-neueste Eintraege, das neue Backup weicht nie', async () => {
        const gross = n => 'x'.repeat(Math.round(n));
        const w = erzeugeWerkbank({
            idbAus: true,
            ls: {
                [BACKUP_KEY]: JSON.stringify([
                    eintrag(KEY_WAISE, 3000, `{"w":"${gross(0.3 * MB)}"}`),
                    eintrag(KEY_A, 2000, `{"a2":"${gross(1.5 * MB)}"}`),
                    eintrag(KEY_A, 1000, `{"a1":"${gross(1.5 * MB)}"}`)
                ])
            }
        });
        const d = startzustand(w);
        d.characters = [{ id: 1, name: 'B', notes: gross(1.9 * MB) }];
        setzeD(w, d);
        const r = await mitFrist(w.ctx.createAutoBackup(), 5000);
        const kennungen = lsListe(w).map(kennung);
        expect(kennungen).not.toContain(`${KEY_WAISE}@3000`);
        expect(kennungen).not.toContain(`${KEY_A}@1000`);
        expect(kennungen).toContain(`${KEY_A}@2000`);
        expect(lsListe(w)[0].campaignKey).toBe(KEY_B);
        expect(w.ls.get(BACKUP_KEY).length).toBeLessThanOrEqual(2 * 2 * MB);
        expect(r.wert).toBe('written');
    });

    // Waechter (U5 minor:7): Stufe 2 (nicht-neueste fremde Eintraege) kommt VOR Stufe 4
    // (neueste fremde Eintraege). Sonst weicht der EINZIGE Eintrag einer Kampagne, obwohl
    // eine andere einen redundanten aelteren hat.
    test('T14c: Budget ueberschritten -> der nicht-neueste Eintrag von C weicht, der einzige von A bleibt', async () => {
        const gross = n => 'x'.repeat(Math.round(n));
        const KEY_C = 'dnd-campaign-3000';
        const w = erzeugeWerkbank({
            idbAus: true,
            ls: {
                [INDEX_KEY]: JSON.stringify({
                    campaigns: [
                        { key: KEY_A, name: 'Nordmark' },
                        { key: KEY_B, name: 'Suedland' },
                        { key: KEY_C, name: 'Cormyr' }
                    ],
                    active: KEY_B
                }),
                [BACKUP_KEY]: JSON.stringify([
                    eintrag(KEY_C, 3000, `{"c3":"${gross(1.3 * MB)}"}`),
                    eintrag(KEY_C, 2000, `{"c2":"${gross(1.3 * MB)}"}`),
                    eintrag(KEY_A, 1000, `{"a1":"${gross(1.3 * MB)}"}`)
                ])
            }
        });
        const d = startzustand(w);
        d.characters = [{ id: 1, name: 'B', notes: gross(0.5 * MB) }];
        setzeD(w, d);

        const r = await mitFrist(w.ctx.createAutoBackup(), 5000);

        const kennungen = lsListe(w).map(kennung);
        expect(r.wert).toBe('written');
        expect(kennungen).toContain(`${KEY_A}@1000`);
        expect(kennungen).not.toContain(`${KEY_C}@2000`);
        expect(kennungen).toContain(`${KEY_C}@3000`);
        expect(lsListe(w)[0].campaignKey).toBe(KEY_B);
    });

    test('T15: kein gueltiger Kampagnenschluessel -> kein IDB-Zugriff, kein localStorage-Write, kein Aufraeumen', async () => {
        const vorher = JSON.stringify([eintrag(KEY_A, 5, '{"a":1}')]);
        const w = erzeugeWerkbank({
            ls: { [BACKUP_KEY]: vorher },
            idbZeilen: [['backups', zeile(KEY_A, 5, '{"a":1}')]]
        });
        w.ctx.getActiveCampaignKey = () => null;
        mitHeld(w);
        const r = await mitFrist(w.ctx.createAutoBackup());
        await ruhe();
        expect(w.fake.zaehler.tx).toBe(0);
        expect(w.ctx.initIndexedDB).not.toHaveBeenCalled();
        expect(w.log.filter(e => e.startsWith('ls.set:') || e.startsWith('ls.remove:'))).toEqual(
            []
        );
        expect(w.ls.get(BACKUP_KEY)).toBe(vorher);
        expect(backupZeilen(w)).toHaveLength(1);
        expect(r.wert).toBe('failed');
    });
});

// ============================================================
// R10 — "Alle Daten löschen" (clearStorage)
// ============================================================

describe('R10 — clearStorage(): Sicherheitskopie zuerst bestaetigt, dann beide Kopien entfernen', () => {
    const GESPEICHERT = '{"wiki":[{"id":1,"title":"Götterpantheon"}]}';
    function wikiKampagne(opt = {}) {
        const w = erzeugeWerkbank(
            Object.assign(
                {
                    ls: { [KEY_B]: GESPEICHERT },
                    idbZeilen: [['campaigns', { id: KEY_B, data: GESPEICHERT, timestamp: 1 }]]
                },
                opt
            )
        );
        const d = startzustand(w);
        d.wiki = [{ id: 1, title: 'Götterpantheon' }];
        setzeD(w, d);
        return w;
    }

    test('T16a: das Backup ist committet, BEVOR Kampagnendaten entfernt werden; auch die IndexedDB-Kopie verschwindet', async () => {
        const w = wikiKampagne();
        const r = await mitFrist(w.ctx.clearStorage(), 3000);
        expect(r.zustand).toBe('erfuellt');
        await ruhe();
        const backupCommit = w.log.indexOf('idb.commit:backups');
        expect(backupCommit).toBeGreaterThan(-1);
        expect(w.log.indexOf('idb.commit:campaigns')).toBeGreaterThan(backupCommit);
        expect(w.log.indexOf('ls.remove:' + KEY_B)).toBeGreaterThan(backupCommit);
        expect(w.fake.tab('campaigns').has(KEY_B)).toBe(false);
        expect(w.ls.has(KEY_B)).toBe(false);
        const zeilen = backupZeilen(w);
        expect(zeilen).toHaveLength(1);
        expect(JSON.parse(zeilen[0].data).wiki[0].title).toBe('Götterpantheon');
        expect(zeilen[0].kind).toBe('safety');
        expect(texte(w)).toContain('💾 Sicherheitskopie erstellt');
        expect(texte(w)).toContain('✅ Alle Daten gelöscht');
        // Reload geplant (gefaelschter Timer), aber noch nicht ausgefuehrt
        const reload = w.timer.find(t => t.ms === 1000);
        expect(reload).toBeDefined();
        expect(w.ctx.location.reload).not.toHaveBeenCalled();
        reload.fn();
        expect(w.ctx.location.reload).toHaveBeenCalledTimes(1);
    });

    test('T16b: scheitert die Sicherheitskopie, fragt clearStorage nach — "Abbrechen" entfernt nichts', async () => {
        const w = wikiKampagne({
            abbruch: namen => namen.includes('backups'),
            quota: k => k === BACKUP_KEY,
            antworten: [true, true, false]
        });
        const r = await mitFrist(w.ctx.clearStorage(), 3000);
        expect(r.zustand).toBe('erfuellt');
        await ruhe();
        expect(w.confirms).toHaveLength(3);
        expect(w.confirms[2]).toContain('Sicherheitskopie konnte nicht erstellt werden');
        expect(w.ls.get(KEY_B)).toBe(GESPEICHERT);
        expect(w.fake.tab('campaigns').has(KEY_B)).toBe(true);
        expect(w.log.some(e => e.startsWith('ls.remove:'))).toBe(false);
        expect(texte(w)).not.toContain('💾 Sicherheitskopie erstellt');
        expect(texte(w)).not.toContain('✅ Alle Daten gelöscht');
        expect(w.timer.some(t => t.ms === 1000)).toBe(false);
    });

    test('T16c: nach "Trotzdem löschen" wird gelöscht — ohne Erfolgsmeldung für die Sicherheitskopie', async () => {
        const w = wikiKampagne({
            abbruch: namen => namen.includes('backups'),
            quota: k => k === BACKUP_KEY,
            antworten: [true, true, true]
        });
        await mitFrist(w.ctx.clearStorage(), 3000);
        await ruhe();
        expect(w.confirms).toHaveLength(3);
        expect(w.fake.tab('campaigns').has(KEY_B)).toBe(false);
        expect(w.ls.has(KEY_B)).toBe(false);
        expect(texte(w)).not.toContain('💾 Sicherheitskopie erstellt');
        expect(texte(w)).toContain('✅ Alle Daten gelöscht');
    });

    test('T16d: scheitert das Entfernen der IndexedDB-Kopie, bleibt localStorage stehen und es gibt keinen Reload', async () => {
        const w = wikiKampagne({ abbruch: namen => namen.includes('campaigns') });
        await mitFrist(w.ctx.clearStorage(), 3000);
        await ruhe();
        expect(w.ls.get(KEY_B)).toBe(GESPEICHERT);
        expect(w.fake.tab('campaigns').has(KEY_B)).toBe(true);
        expect(texte(w)).toContain('❌ Fehler beim Löschen');
        expect(texte(w)).not.toContain('✅ Alle Daten gelöscht');
        expect(w.timer.some(t => t.ms === 1000)).toBe(false);
    });
});

// ============================================================
// D2 = A — Kampagne loeschen entfernt ihre Auto-Backups
// ============================================================

describe('D2 = A — deleteCampaign() entfernt auch die Auto-Backups DIESER Kampagne', () => {
    function zweiKampagnenMitBackups(opt = {}) {
        return erzeugeWerkbank(
            Object.assign(
                {
                    aktiv: KEY_A,
                    ls: {
                        [KEY_A]: '{"characters":[]}',
                        [KEY_B]: '{"characters":[]}',
                        [BACKUP_KEY]: JSON.stringify([
                            eintrag(KEY_A, 13, '{"a":2}'),
                            eintrag(KEY_B, 12, '{"b":1}'),
                            eintrag(KEY_A, 11, '{"a":1}')
                        ])
                    },
                    idbZeilen: [
                        ['campaigns', { id: KEY_A, data: '{}', timestamp: 1 }],
                        ['campaigns', { id: KEY_B, data: '{}', timestamp: 1 }],
                        ['backups', zeile(KEY_A, 21, '{"a":3}')],
                        ['backups', zeile(KEY_A, 22, '{"a":4}')],
                        ['backups', zeile(KEY_B, 23, '{"b":2}')]
                    ]
                },
                opt
            )
        );
    }

    test('T17a: nur die Backups der geloeschten Kampagne verschwinden (IndexedDB und localStorage)', async () => {
        const w = zweiKampagnenMitBackups();
        const r = await mitFrist(w.ctx.deleteCampaign(), 3000);
        expect(r.zustand).toBe('erfuellt');
        await ruhe();
        expect(w.confirms[0]).toContain('- Automatische Backups dieser Kampagne');
        expect(backupZeilen(w).map(z => z.id)).toEqual([`${KEY_B}-23`]);
        expect(lsListe(w).map(kennung)).toEqual([`${KEY_B}@12`]);
        expect(w.fake.tab('campaigns').has(KEY_A)).toBe(false);
        expect(w.fake.tab('campaigns').has(KEY_B)).toBe(true);
    });

    test('T17b: scheitert das Entfernen der Kampagnendaten (Standard-Kampagne), bleiben ihre Backups unangetastet', async () => {
        const w = erzeugeWerkbank({
            aktiv: STANDARD_KEY,
            ls: {
                [STANDARD_KEY]: '{"characters":[]}',
                [BACKUP_KEY]: JSON.stringify([eintrag(STANDARD_KEY, 11, '{"s":1}')])
            },
            idbZeilen: [
                ['campaigns', { id: STANDARD_KEY, data: '{}', timestamp: 1 }],
                ['backups', zeile(STANDARD_KEY, 21, '{"s":2}')]
            ],
            abbruch: namen => namen.includes('campaigns')
        });
        const r = await mitFrist(w.ctx.deleteCampaign(), 3000);
        expect(r.zustand).toBe('erfuellt');
        await ruhe();
        expect(backupZeilen(w).map(z => z.id)).toEqual([`${STANDARD_KEY}-21`]);
        expect(lsListe(w).map(kennung)).toEqual([`${STANDARD_KEY}@11`]);
        expect(w.alerts.some(a => a.includes('Fehler beim Löschen'))).toBe(true);
    });

    // U5 minor:2 / R10 P2b: ein Auto-Backup-Tick, der WAEHREND der Aufraeum-Transaktion von
    // deleteCampaign() startet, schrieb die geloeschte Kampagne erneut — seine Transaktion
    // entsteht nach der Aufraeum-Transaktion und laeuft deshalb auch echt danach. Fuer den
    // Standard-Schluessel taucht die Zeile in der neuen, leeren Kampagne wieder auf; der
    // Bestaetigungstext verspricht das Gegenteil (D2 = A).
    test('T17c: ein Tick waehrend des Aufraeumens schreibt kein Backup der geloeschten Kampagne', async () => {
        const w = erzeugeWerkbank({
            aktiv: KEY_A,
            ls: { [KEY_A]: '{"characters":[{"id":1,"name":"A"}]}' },
            idbZeilen: [
                ['campaigns', { id: KEY_A, data: '{}', timestamp: 1 }],
                ['backups', zeile(KEY_A, 21, '{"a":3}')]
            ]
        });
        mitHeld(w, 'A-Held');
        // Im Task nach dem ersten index.getAll(KEY_A) des Aufraeumens einen Tick starten
        let tick = null;
        const originalPush = w.fake.zaehler.getAll.push.bind(w.fake.zaehler.getAll);
        w.fake.zaehler.getAll.push = q => {
            const r = originalPush(q);
            if (q === KEY_A && !tick) {
                tick = new Promise(res => naechsterTask(() => res(w.ctx.createAutoBackup())));
            }
            return r;
        };

        const geloescht = await mitFrist(w.ctx.deleteCampaign(), 7000);
        expect(geloescht.zustand).toBe('erfuellt');
        expect(tick).not.toBeNull();
        await mitFrist(tick, 3000);
        await ruhe();

        expect(backupZeilen(w).filter(z => z.campaignKey === KEY_A)).toHaveLength(0);
    }, 20000);

    // RA-F4 (Korrekturrunde F4, Restloch): die Sperrpruefung lag NUR vor dem IndexedDB-
    // Versuch. Der localStorage-Rueckfall steht dahinter, also HINTER einem await. Scheitert
    // der IDB-Commit eines Ticks erst, nachdem deleteCampaign() gesperrt, entfernt und
    // purgeCampaignBackups() aufgeraeumt hat, schrieb derselbe Tick die Zeile der geloeschten
    // Kampagne per localStorage neu — und meldete dafuer 'written'. Invariante: solange die
    // Schreibpfade gesperrt sind, entsteht KEINE Backup-Zeile dieser Kampagne, in keiner Quelle.
    test('T17d: der localStorage-Rueckfall eines Ticks schreibt nach dem Aufraeumen nichts mehr', async () => {
        const w = erzeugeWerkbank({
            aktiv: KEY_A,
            ls: {
                [KEY_A]: '{"characters":[{"id":1,"name":"A"}]}',
                [BACKUP_KEY]: JSON.stringify([eintrag(KEY_A, 21, '{"alt":1}')])
            },
            idbZeilen: [
                ['campaigns', { id: KEY_A, data: '{}', timestamp: 1 }],
                ['backups', zeile(KEY_A, 21, '{"alt":1}')]
            ]
        });
        mitHeld(w, 'A-Held');
        // Den IndexedDB-Versuch des Ticks abfangen und erst nach dem Loeschen ablehnen
        const echtesIdbWriteTx = w.ctx.idbWriteTx;
        let ablehnen = null;
        w.ctx.idbWriteTx = (stores, fn, opt) => {
            if (!ablehnen && [].concat(stores).includes('backups')) {
                return new Promise((_, rej) => {
                    ablehnen = () => rej(new Error('IDB-Commit abgebrochen (Test)'));
                });
            }
            return echtesIdbWriteTx(stores, fn, opt);
        };
        // 1) Tick startet VOR der Sperre und passiert deren Pruefung
        const tick = w.ctx.createAutoBackup();
        await ruhe(3);
        expect(ablehnen).not.toBeNull();
        // 2) Loeschen laeuft vollstaendig durch (Sperre, Entfernen, Backups aufraeumen)
        const geloescht = await mitFrist(w.ctx.deleteCampaign(), 7000);
        expect(geloescht.zustand).toBe('erfuellt');
        expect(lsListe(w).filter(b => b.campaignKey === KEY_A)).toHaveLength(0);
        // 3) Erst JETZT scheitert der IDB-Versuch des Ticks -> localStorage-Rueckfall
        ablehnen();
        const r = await mitFrist(tick, 3000);
        await ruhe();

        expect(r.wert).toBe('failed');
        expect(lsListe(w).filter(b => b.campaignKey === KEY_A)).toHaveLength(0);
        expect(backupZeilen(w).filter(z => z.campaignKey === KEY_A)).toHaveLength(0);
    }, 20000);

    // Dieselbe Luecke im IndexedDB-Zweig: idbWriteTx() wartet auf initIndexedDB(), solange
    // window.idb noch nicht offen ist (utils/idb-tx.js). In genau diesem await kann
    // deleteCampaign() sperren, entfernen und aufraeumen — die Transaktion des Ticks entsteht
    // danach. Deshalb wird die Sperre auch noch im Transaktions-Callback geprueft, also in
    // demselben synchronen Durchlauf, in dem die Requests eingereiht wuerden.
    test('T17e: ein Tick, dessen IndexedDB erst nach dem Aufraeumen geoeffnet wird, reiht nichts ein', async () => {
        const w = erzeugeWerkbank({
            aktiv: KEY_A,
            ls: { [KEY_A]: '{"characters":[{"id":1,"name":"A"}]}' },
            idbZeilen: [
                ['campaigns', { id: KEY_A, data: '{}', timestamp: 1 }],
                ['backups', zeile(KEY_A, 21, '{"alt":1}')]
            ]
        });
        mitHeld(w, 'A-Held');
        // Die erste Oeffnung haengt (ausstehendes Versions-Upgrade eines anderen Tabs);
        // jede weitere — die von deleteCampaign() — gelingt sofort.
        w.ctx.idb = null;
        const echtesInit = w.ctx.initIndexedDB;
        let oeffnen = null;
        w.ctx.initIndexedDB = () => {
            if (oeffnen) return echtesInit();
            return new Promise(resolve => {
                oeffnen = () => {
                    w.ctx.idb = w.fake.db;
                    resolve(w.fake.db);
                };
            });
        };
        const tick = w.ctx.createAutoBackup();
        await ruhe(3);
        expect(oeffnen).not.toBeNull();

        const geloescht = await mitFrist(w.ctx.deleteCampaign(), 7000);
        expect(geloescht.zustand).toBe('erfuellt');
        // Erst jetzt ist die Verbindung des Ticks da -> seine Transaktion entsteht NACH dem Purge
        oeffnen();
        const r = await mitFrist(tick, 3000);
        await ruhe();

        expect(r.wert).toBe('failed');
        expect(backupZeilen(w).filter(z => z.campaignKey === KEY_A)).toHaveLength(0);
        expect(lsListe(w).filter(b => b.campaignKey === KEY_A)).toHaveLength(0);
    }, 20000);
});

// ============================================================
// R10 — ehrliche Meldung der Sicherheitskopie
// ============================================================

describe('R10 — reportSafetyBackup(): die Meldung folgt dem echten Ergebnis', () => {
    test('T18a: je Status die passende Rueckmeldung — "failed" warnt und meldet nie "erstellt"', async () => {
        const w = erzeugeWerkbank();
        expect(typeof w.ctx.reportSafetyBackup).toBe('function');
        const faelle = [
            ['written', '💾 Sicherheitskopie erstellt'],
            ['unchanged', '💾 Sicherheitskopie vorhanden'],
            ['failed', '⚠️ Sicherheitskopie fehlgeschlagen'],
            ['skipped-empty', null]
        ];
        for (const [status, erwartet] of faelle) {
            w.toasts.length = 0;
            const r = await mitFrist(w.ctx.reportSafetyBackup(Promise.resolve(status)));
            expect(r.wert).toBe(status);
            expect(texte(w)).toEqual(erwartet ? [erwartet] : []);
        }
        w.toasts.length = 0;
        const abgelehnt = await mitFrist(
            w.ctx.reportSafetyBackup(Promise.reject(new Error('kaputt')))
        );
        expect(abgelehnt.zustand).toBe('erfuellt');
        expect(abgelehnt.wert).toBe('failed');
        expect(texte(w)).toEqual(['⚠️ Sicherheitskopie fehlgeschlagen']);
        expect(w.toasts[0].typ).toBe('warning');
    });

    function importModal(items, typ) {
        const modal = document.createElement('div');
        modal.id = 'import-modal';
        modal.dataset.importItems = JSON.stringify(items);
        modal.dataset.dataType = typ;
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'import-mode';
        radio.value = 'replace';
        radio.checked = true;
        document.body.append(modal, radio);
    }

    test('T18b: executeImport (Ersetzen) mit gescheiterter Sicherheitskopie zeigt die Warnung statt "erstellt"', async () => {
        const w = erzeugeWerkbank({
            abbruch: namen => namen.includes('backups'),
            quota: k => k === BACKUP_KEY
        });
        const d = startzustand(w);
        d.wiki = [{ id: 1, title: 'Alt' }];
        setzeD(w, d);
        importModal([{ id: 7, title: 'Neu' }], 'wiki');
        w.ctx.executeImport('wiki');
        await warteBis(() => texte(w).some(t => t.includes('Sicherheitskopie fehlgeschlagen')));
        expect(texte(w)).toContain('⚠️ Sicherheitskopie fehlgeschlagen');
        expect(texte(w)).not.toContain('💾 Sicherheitskopie erstellt');
        expect(w.ctx.D.wiki.map(e => e.title)).toEqual(['Neu']);
    });

    test('T18c: executeImport (Ersetzen) sichert den Stand VOR dem Ersetzen und meldet erst nach dem Commit', async () => {
        const w = erzeugeWerkbank();
        const d = startzustand(w);
        d.wiki = [{ id: 1, title: 'Alt' }];
        setzeD(w, d);
        importModal([{ id: 7, title: 'Neu' }], 'wiki');
        w.ctx.executeImport('wiki');
        expect(texte(w)).not.toContain('💾 Sicherheitskopie erstellt');
        await warteBis(() => texte(w).includes('💾 Sicherheitskopie erstellt'));
        const zeilen = backupZeilen(w);
        expect(zeilen).toHaveLength(1);
        expect(JSON.parse(zeilen[0].data).wiki.map(e => e.title)).toEqual(['Alt']);
        expect(zeilen[0].kind).toBe('safety');
        expect(w.log.indexOf('idb.commit:backups')).toBeLessThan(
            w.log.indexOf('toast:💾 Sicherheitskopie erstellt')
        );
    });
});

// ============================================================
// Nutzerentscheidung D-B (2026-09-27) — IndexedDB gemeldet, aber nicht oeffenbar
// ============================================================
// Vorher scheiterte beides fail-closed mit "Es wurde nichts geloescht" bzw. "Fehler beim
// Loeschen": in einer Umgebung, in der window.indexedDB existiert, die Datenbank sich aber
// nicht oeffnen laesst (aeltere Firefox-Privatfenster, manche file://-Aufbauten), liess sich
// die Kampagne gar nicht loeschen. Die Datengarantie bleibt — eine moeglicherweise
// vorhandene IndexedDB-Kopie wird nie stillschweigend aufgegeben —, aber der Nutzer
// entscheidet jetzt selbst ueber die native confirm()-Rueckfrage.
// Abgrenzung: ein ABGEBROCHENER Commit auf einer GEOEFFNETEN Datenbank bleibt fail-closed
// (T16d, T17b) — dort ist belegt, dass eine Kopie existiert und erreichbar waere.

describe('D-B — nicht oeffenbare IndexedDB: der Nutzer entscheidet (clearStorage, deleteCampaign)', () => {
    const WIKI = '{"wiki":[{"id":1,"title":"Götterpantheon"}]}';

    function nichtOeffenbar(opt = {}) {
        const w = erzeugeWerkbank(
            Object.assign(
                {
                    idbAus: true,
                    ls: { [KEY_B]: WIKI, [KEY_B + '_ts']: '1000', [KEY_B + '_rev']: 'r1' },
                    idbZeilen: [['campaigns', { id: KEY_B, data: WIKI, timestamp: 1 }]]
                },
                opt
            )
        );
        const d = startzustand(w);
        d.wiki = [{ id: 1, title: 'Götterpantheon' }];
        setzeD(w, d);
        return w;
    }

    test('T20: clearStorage fragt nach und erklaert die Lage; "Abbrechen" entfernt nichts', async () => {
        const w = nichtOeffenbar({ antworten: [true, true, false] });
        const r = await mitFrist(w.ctx.clearStorage(), 3000);
        expect(r.zustand).toBe('erfuellt');
        await ruhe();
        expect(w.confirms).toHaveLength(3);
        expect(w.confirms[2]).toContain('IndexedDB');
        expect(w.confirms[2]).toContain('exportieren');
        expect(w.ls.get(KEY_B)).toBe(WIKI);
        expect(w.ls.has(KEY_B + '_ts')).toBe(true);
        expect(texte(w)).not.toContain('✅ Alle Daten gelöscht');
        expect(texte(w).some(t => t.includes('nichts gelöscht'))).toBe(true);
        expect(w.timer.some(t => t.ms === 1000)).toBe(false);
        // Der Tab darf danach wieder schreiben
        expect(w.ctx.areCampaignWritesRetired()).toBe(false);
    });

    test('T21: nach der Bestaetigung werden die lokalen Daten geloescht und die Meldung sagt genau das', async () => {
        const w = nichtOeffenbar({ antworten: [true, true, true] });
        const r = await mitFrist(w.ctx.clearStorage(), 3000);
        expect(r.zustand).toBe('erfuellt');
        await ruhe();
        expect(w.confirms).toHaveLength(3);
        expect(w.ls.has(KEY_B)).toBe(false);
        expect(w.ls.has(KEY_B + '_ts')).toBe(false);
        expect(w.ls.has(KEY_B + '_rev')).toBe(false);
        // Die IndexedDB-Kopie bleibt — genau darauf weist die Meldung hin
        expect(w.fake.tab('campaigns').has(KEY_B)).toBe(true);
        expect(texte(w)).not.toContain('✅ Alle Daten gelöscht');
        const hinweis = texte(w).find(t => t.includes('IndexedDB'));
        expect(hinweis).toBeDefined();
        expect(hinweis).toContain('lokal');
        expect(w.timer.some(t => t.ms === 1000)).toBe(true);
    });

    test('T22: deleteCampaign (Standard-Kampagne) fragt nach; "Abbrechen" laesst alles stehen', async () => {
        const w = erzeugeWerkbank({
            aktiv: STANDARD_KEY,
            idbAus: true,
            ls: { [STANDARD_KEY]: WIKI, [STANDARD_KEY + '_ts']: '1000' },
            idbZeilen: [['campaigns', { id: STANDARD_KEY, data: WIKI, timestamp: 1 }]],
            antworten: [true, false]
        });
        const r = await mitFrist(w.ctx.deleteCampaign(), 3000);
        expect(r.zustand).toBe('erfuellt');
        await ruhe();
        expect(w.confirms).toHaveLength(2);
        expect(w.confirms[1]).toContain('IndexedDB');
        expect(w.ls.get(STANDARD_KEY)).toBe(WIKI);
        expect(w.alerts.some(a => a.includes('Es wurde nichts gelöscht'))).toBe(true);
        expect(w.ctx.areCampaignWritesRetired()).toBe(false);
    });

    test('T23: deleteCampaign (Standard-Kampagne) nach der Bestaetigung — lokale Daten weg, Meldung ehrlich', async () => {
        const w = erzeugeWerkbank({
            aktiv: STANDARD_KEY,
            idbAus: true,
            ls: { [STANDARD_KEY]: WIKI, [STANDARD_KEY + '_ts']: '1000' },
            idbZeilen: [['campaigns', { id: STANDARD_KEY, data: WIKI, timestamp: 1 }]],
            antworten: [true, true]
        });
        const r = await mitFrist(w.ctx.deleteCampaign(), 3000);
        expect(r.zustand).toBe('erfuellt');
        await ruhe();
        expect(w.confirms).toHaveLength(2);
        expect(w.ls.has(STANDARD_KEY)).toBe(false);
        expect(w.ls.has(STANDARD_KEY + '_ts')).toBe(false);
        expect(w.fake.tab('campaigns').has(STANDARD_KEY)).toBe(true);
        const meldung = w.alerts.find(a => a.includes('IndexedDB'));
        expect(meldung).toBeDefined();
        expect(meldung).toContain('lokal');
        expect(w.alerts.some(a => a.includes('Es wurde nichts gelöscht'))).toBe(false);
    });

    // Dieselbe Verzweigung fuer eine BENANNTE Kampagne (Korrekturrunde F9): dort entfernt
    // Schritt 1 von deleteCampaign() den Indexeintrag, BEVOR die Rueckfrage gestellt wird.
    // Die Rueckfrage sagt woertlich "ABBRECHEN (empfohlen): Es wird nichts geloescht. Erst
    // exportieren, dann spaeter erneut versuchen." — also darf ein Abbruch die Kampagne auch
    // nicht aus der Liste verlieren: sonst ist sie ueber die Oberflaeche nicht mehr
    // erreichbar (es gibt keine Waisen-Wiederherstellung) und genau der empfohlene Weg ist
    // versperrt.
    test('T24: deleteCampaign (benannte Kampagne) — "Abbrechen" laesst den Indexeintrag stehen, die Kampagne bleibt erreichbar', async () => {
        const w = nichtOeffenbar({ antworten: [true, false] });
        const r = await mitFrist(w.ctx.deleteCampaign(), 3000);
        expect(r.zustand).toBe('erfuellt');
        await ruhe();
        expect(w.confirms).toHaveLength(2);
        expect(w.confirms[1]).toContain('IndexedDB');
        // Die Zusage der Rueckfrage: es wird nichts geloescht — auch nicht der Indexeintrag
        const index = JSON.parse(w.ls.get(INDEX_KEY));
        expect(index.campaigns.map(c => c.key)).toEqual([KEY_A, KEY_B]);
        expect(index.active).toBe(KEY_B);
        expect(w.ls.get(KEY_B)).toBe(WIKI);
        expect(w.ls.has(KEY_B + '_ts')).toBe(true);
        expect(w.fake.tab('campaigns').has(KEY_B)).toBe(true);
        expect(w.alerts.some(a => a.includes('Es wurde nichts gelöscht'))).toBe(true);
        expect(w.alerts.some(a => a.includes('aus der Liste entfernt'))).toBe(false);
        // Kein Verlassen der Seite, und der Tab darf wieder schreiben
        expect(w.ctx.location.href).toBe('file:///dnd-tracker.html');
        expect(w.ctx.areCampaignWritesRetired()).toBe(false);
    });

    test('T25: deleteCampaign (benannte Kampagne) nach der Bestaetigung — lokale Daten weg, Kampagne aus der Liste, Meldung ehrlich', async () => {
        const w = nichtOeffenbar({ antworten: [true, true] });
        const r = await mitFrist(w.ctx.deleteCampaign(), 3000);
        expect(r.zustand).toBe('erfuellt');
        await ruhe();
        expect(w.confirms).toHaveLength(2);
        expect(w.ls.has(KEY_B)).toBe(false);
        expect(w.ls.has(KEY_B + '_ts')).toBe(false);
        expect(w.ls.has(KEY_B + '_rev')).toBe(false);
        // Die IndexedDB-Kopie bleibt — genau darauf weist die Meldung hin
        expect(w.fake.tab('campaigns').has(KEY_B)).toBe(true);
        const index = JSON.parse(w.ls.get(INDEX_KEY));
        expect(index.campaigns.map(c => c.key)).toEqual([KEY_A]);
        expect(index.active).toBe(STANDARD_KEY);
        const meldung = w.alerts.find(a => a.includes('IndexedDB'));
        expect(meldung).toBeDefined();
        expect(meldung).toContain('lokal');
        expect(w.ctx.location.href).toContain('?cleared=');
    });
});
