/**
 * Mehr-Tab-Werkbank (Code-Review 2026-09-21, Einheit U7 — R02).
 *
 * Bildet mehrere Browser-Tabs EINES Ursprungs nach: jeder Tab ist ein eigener vm-Kontext
 * (window === globalThis wie im gebuendelten Classic-Script) mit den ECHTEN Quelldateien
 * in loader.js-Reihenfolge. Alle Tabs teilen:
 *  - localStorage (Map) — jeder Schreibzugriff eines Tabs feuert in den ANDEREN Tabs ein
 *    'storage'-Ereignis (key/oldValue/newValue), optional mit Zeichen-Quota; jeder Versuch
 *    landet im Schreibprotokoll (Tab, Operation, Schluessel, Phase)
 *  - einen BroadcastChannel-Bus
 *  - das spec-nahe IndexedDB-Double aus ./fake-idb.js (Erfolg erst mit 'complete')
 *  - eine VIRTUELLE Uhr: setTimeout/setInterval laufen nur, wenn der Test die Uhr
 *    vorstellt (uhr.laufen(ms)); uhr.blockieren(ms) laesst Zeit verstreichen, ohne Timer
 *    auszufuehren (ein blockierender Dialog — der Timer ist danach ueberfaellig). Timer
 *    eines entladenen Dokuments laufen nie mehr (Browser-Semantik).
 *
 * Entladen (tab.entladen): 'beforeunload' mit einem Ereignisobjekt, das preventDefault()
 * protokolliert; fordert der Tab die Rueckfrage an und waehlt der Nutzer "Bleiben"
 * ({ bleiben: true }), bleibt der Tab offen. Sonst folgen 'pagehide' und
 * 'visibilitychange' (hidden), danach ist das Dokument weg.
 *
 * Buendeltreue: build.py entfernt beim Buendeln Zeilen der Form
 * `const X = window.X;`, wenn X anderswo echt deklariert ist oder die Zeile schon einmal
 * vorkam (deduplicate_window_assignments, Pass 1+2). Die Werkbank wendet GENAU diese Regel
 * auf die geladenen Module an (Option buendelTreu, Standard true) — sonst liefe der
 * funktionslokale `const STORAGE_KEY = window.STORAGE_KEY;` im vm-Kontext auf den Schluessel
 * "undefined" (Loader-Modus) und ein Test scheiterte an der Schluesselaufloesung statt am
 * Verhalten. window.STORAGE_KEY wird bewusst NICHT gesetzt. Mit buendelTreu: false laufen
 * die Quellen roh (Loader-Modus).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { setImmediate: naechsterTask } = require('timers');
const { extractModulesFromLoader } = require('../../../tools/generate-eslint-globals.js');
const { erzeugeFakeIDB } = require('./fake-idb.js');

const WURZEL = path.join(__dirname, '../../..');
const LOADER_MODULE = extractModulesFromLoader(
    fs.readFileSync(path.join(WURZEL, 'loader.js'), 'utf8')
);
const STANDARD_KEY = 'dnd-tracker-v4';
const INDEX_KEY = 'dnd-tracker-campaigns';

// Was core/init.js vor den Features braucht, plus systems/avatars.js (initOfflineMode)
const BASIS_MODULE = Object.freeze([
    'core/config.js',
    'core/data.js',
    'utils/basic.js',
    'utils/idb-tx.js',
    'systems/undo.js',
    'systems/spellslots/persistence.js',
    'systems/spellslots/quick-roll.js',
    'systems/avatars.js'
]);

const quellCache = new Map();
function quelle(rel) {
    if (!quellCache.has(rel)) {
        quellCache.set(
            rel,
            fs.readFileSync(path.join(WURZEL, rel), 'utf8').split('\r\n').join('\n')
        );
    }
    return quellCache.get(rel);
}

function quotaFehler() {
    const e = new Error('The quota has been exceeded.');
    e.name = 'QuotaExceededError';
    return e;
}

// ============================================================
// Buendeltreue: build.py deduplicate_window_assignments() nachgebildet
// ============================================================

const FENSTER_ZUWEISUNG = /^(var|const|let)\s+(\w+)\s*=\s*window\.(\2)\s*;?\s*(\/\/.*)?$/;
const DEKLARATION = /^(var|const|let)\s+(\w+)\s*=/;

function buendelDedup(texte) {
    const echte = new Set();
    for (const text of texte) {
        for (const zeile of text.split('\n')) {
            const s = zeile.trim();
            if (s.startsWith('//') || FENSTER_ZUWEISUNG.test(s)) continue;
            const m = s.match(DEKLARATION);
            if (m) echte.add(m[2]);
        }
    }
    const gesehen = new Set();
    return texte.map(text =>
        text
            .split('\n')
            .map(zeile => {
                const s = zeile.trim();
                if (!s || s.startsWith('//')) return zeile;
                const m = s.match(FENSTER_ZUWEISUNG);
                if (!m) return zeile;
                if (gesehen.has(m[2]) || echte.has(m[2])) return '// [DEDUP] ' + m[2];
                gesehen.add(m[2]);
                return zeile;
            })
            .join('\n')
    );
}

// ============================================================
// Virtuelle Uhr
// ============================================================

function erzeugeUhr() {
    const timer = new Map();
    const fehler = [];
    let jetzt = 0;
    let naechsteId = 1;
    let folge = 0;

    function planen(tab, fn, ms, args, wiederholen) {
        const id = naechsteId++;
        const verzug = Math.max(0, Number(ms) || 0);
        timer.set(id, {
            id,
            tab,
            fn,
            args: args || [],
            faellig: jetzt + verzug,
            intervall: wiederholen ? Math.max(1, verzug) : 0,
            folge: folge++
        });
        return id;
    }

    // Echte Makrotasks abarbeiten: das IndexedDB-Double schreitet per setImmediate voran
    async function ruhe(runden = 60) {
        for (let i = 0; i < runden; i++) await new Promise(r => naechsterTask(r));
    }

    function naechsterFaelliger(ziel) {
        let bester = null;
        for (const t of timer.values()) {
            if (t.faellig > ziel) continue;
            if (
                !bester ||
                t.faellig < bester.faellig ||
                (t.faellig === bester.faellig && t.folge < bester.folge)
            ) {
                bester = t;
            }
        }
        return bester;
    }

    function ausfuehren(t) {
        try {
            const r = t.fn(...t.args);
            if (r && typeof r.then === 'function') r.then(null, e => fehler.push(e));
        } catch (e) {
            fehler.push(e);
        }
    }

    /** Uhr um ms vorstellen; faellige Timer laufen in Faelligkeitsreihenfolge. */
    async function laufen(ms = 0) {
        const ziel = jetzt + Math.max(0, ms);
        for (;;) {
            await ruhe();
            const t = naechsterFaelliger(ziel);
            if (!t) break;
            jetzt = Math.max(jetzt, t.faellig);
            if (t.tab.geschlossen) {
                timer.delete(t.id);
                continue;
            }
            if (t.intervall) {
                t.faellig += t.intervall;
                t.folge = folge++;
            } else {
                timer.delete(t.id);
            }
            ausfuehren(t);
        }
        jetzt = ziel;
        await ruhe();
    }

    return {
        planen,
        loeschen: id => timer.delete(id),
        laufen,
        ruhe,
        /** Zeit verstreichen lassen, OHNE Timer auszufuehren (blockierter Hauptthread). */
        blockieren: ms => {
            jetzt += Math.max(0, ms);
        },
        fehler,
        get jetzt() {
            return jetzt;
        }
    };
}

// ============================================================
// Ursprung (geteilter Speicher aller Tabs)
// ============================================================

/**
 * @param {Object} [opt]
 * @param {number} [opt.lsQuotaZeichen] - Quota in Zeichen (Schluessel + Wert), Standard unbegrenzt
 */
function erzeugeUrsprung(opt = {}) {
    const ls = new Map();
    const tabs = new Set();
    const log = [];
    const kanaele = [];
    const idbLog = [];
    const idb = erzeugeFakeIDB({ log: idbLog });
    const uhr = erzeugeUhr();
    const quota = { zeichen: opt.lsQuotaZeichen === undefined ? Infinity : opt.lsQuotaZeichen };

    function belegt() {
        let n = 0;
        for (const [k, v] of ls) n += k.length + v.length;
        return n;
    }

    function storageEreignis(vonTab, key, oldValue, newValue) {
        for (const t of tabs) {
            if (t === vonTab || t.geschlossen) continue;
            uhr.planen(t, () => t.feuere('window', 'storage', { key, oldValue, newValue }), 0);
        }
    }

    function localStorageFuer(tab) {
        return {
            getItem: k => {
                const s = String(k);
                return ls.has(s) ? ls.get(s) : null;
            },
            setItem: (k, v) => {
                const s = String(k);
                const wert = String(v);
                const alt = ls.has(s) ? ls.get(s) : null;
                const danach =
                    belegt() - (alt === null ? 0 : s.length + alt.length) + s.length + wert.length;
                if (danach > quota.zeichen) {
                    log.push({
                        tab: tab.name,
                        op: 'setItem-quota',
                        key: s,
                        laenge: wert.length,
                        phase: tab.phase
                    });
                    throw quotaFehler();
                }
                ls.set(s, wert);
                log.push({
                    tab: tab.name,
                    op: 'setItem',
                    key: s,
                    laenge: wert.length,
                    phase: tab.phase
                });
                if (alt !== wert) storageEreignis(tab, s, alt, wert);
            },
            removeItem: k => {
                const s = String(k);
                if (!ls.has(s)) return;
                const alt = ls.get(s);
                ls.delete(s);
                log.push({ tab: tab.name, op: 'removeItem', key: s, phase: tab.phase });
                storageEreignis(tab, s, alt, null);
            },
            clear: () => {
                ls.clear();
                log.push({ tab: tab.name, op: 'clear', key: null, phase: tab.phase });
                storageEreignis(tab, null, null, null);
            },
            key: i => {
                const keys = Array.from(ls.keys());
                return i < keys.length ? keys[i] : null;
            },
            get length() {
                return ls.size;
            }
        };
    }

    function kanalKlasseFuer(tab) {
        return class FakeBroadcastChannel {
            constructor(name) {
                this.name = String(name);
                this.onmessage = null;
                this.tab = tab;
                this.zu = false;
                kanaele.push(this);
            }
            postMessage(data) {
                const kopie = JSON.parse(JSON.stringify(data));
                for (const k of kanaele) {
                    if (k === this || k.name !== this.name || k.zu || k.tab.geschlossen) continue;
                    uhr.planen(
                        k.tab,
                        () => {
                            if (typeof k.onmessage === 'function') k.onmessage({ data: kopie });
                        },
                        0
                    );
                }
            }
            close() {
                this.zu = true;
            }
        };
    }

    const ursprung = {
        ls,
        tabs,
        log,
        idb,
        idbLog,
        uhr,
        quota,
        localStorageFuer,
        kanalKlasseFuer,
        /** Kampagne direkt in localStorage legen (mit _ts wie nach einem normalen Save). */
        saeen(key, daten, { ts = '1000' } = {}) {
            ls.set(key, typeof daten === 'string' ? daten : JSON.stringify(daten));
            if (ts !== null) ls.set(key + '_ts', ts);
        },
        /** Kampagne nur in IndexedDB legen (IndexedDB-Modus > 5 MB). */
        saeenIdb(key, daten) {
            idb.setze('campaigns', {
                id: key,
                data: typeof daten === 'string' ? daten : JSON.stringify(daten),
                timestamp: 1
            });
        },
        idbDatensatz: key => idb.datensatz('campaigns', key),
        /**
         * Fremder Schreiber ohne Ereignis, ohne _rev, ohne Broadcast (aeltere App-Version,
         * direkte Manipulation) — nur der Inhalt aendert sich.
         */
        fremdSchreiben(key, wert) {
            ls.set(key, typeof wert === 'string' ? wert : JSON.stringify(wert));
            log.push({ tab: 'fremd', op: 'setItem', key, phase: 'fremd' });
        },
        /** Protokollierte Schreibvorgaenge (setItem, setItem-quota, removeItem, clear). */
        schreibvorgaenge({ tab, phase, praefix } = {}) {
            return log.filter(
                e =>
                    (tab === undefined || e.tab === tab) &&
                    (phase === undefined ||
                        (Array.isArray(phase) ? phase.includes(e.phase) : e.phase === phase)) &&
                    (praefix === undefined ||
                        (typeof e.key === 'string' && e.key.startsWith(praefix)))
            );
        }
    };
    return ursprung;
}

// ============================================================
// Tab
// ============================================================

function fakeElement(id) {
    const klassen = new Set();
    return {
        id,
        value: '',
        textContent: '',
        innerHTML: '',
        disabled: false,
        style: {},
        dataset: {},
        classList: {
            add: (...c) => c.forEach(x => klassen.add(x)),
            remove: (...c) => c.forEach(x => klassen.delete(x)),
            toggle: (c, an) => {
                const soll = an === undefined ? !klassen.has(c) : !!an;
                if (soll) klassen.add(c);
                else klassen.delete(c);
                return soll;
            },
            contains: c => klassen.has(c)
        },
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener() {},
        removeEventListener() {},
        appendChild() {},
        append() {},
        remove() {},
        setAttribute() {},
        getAttribute: () => null,
        focus() {},
        click() {},
        _klassen: klassen
    };
}

/**
 * Oeffnet einen Tab (Module geladen, noch NICHT gebootet — dafuer tab.starten()).
 * @param {Object} ursprung - aus erzeugeUrsprung()
 * @param {string} name - Tab-Name im Schreibprotokoll
 * @param {Object} [opt]
 * @param {string[]} [opt.module] - zusaetzliche loader.js-Module (werden in Loader-Reihenfolge geladen)
 * @param {string} [opt.aktiv] - Kampagnenschluessel dieses Tabs (STORAGE_KEY_OVERRIDE)
 * @param {boolean[]} [opt.antworten] - Antworten fuer confirm() der Reihe nach (sonst true)
 * @param {boolean} [opt.buendelTreu=true] - build.py-Dedup auf die Quellen anwenden
 * @param {Object} [opt.stubs] - zusaetzliche Globals VOR dem Laden
 */
function oeffneTab(ursprung, name, opt = {}) {
    const hoerer = { window: {}, document: {} };
    const elemente = {};
    const tab = {
        name,
        geschlossen: false,
        phase: 'laufend',
        toasts: [],
        alerts: [],
        confirms: [],
        fehlerLog: [],
        entladungen: [],
        antworten: (opt.antworten || []).slice(),
        dateiGelesen: null
    };
    tab.feuere = (ziel, typ, ev) => {
        if (tab.geschlossen) return;
        for (const fn of (hoerer[ziel][typ] || []).slice()) fn(ev);
    };

    const ctx = {
        console,
        Blob,
        URL,
        TextEncoder: require('util').TextEncoder,
        structuredClone:
            typeof structuredClone === 'function'
                ? structuredClone
                : v => JSON.parse(JSON.stringify(v)),
        navigator: { onLine: true, maxTouchPoints: 0 },
        setTimeout: (fn, ms, ...args) => ursprung.uhr.planen(tab, fn, ms, args, false),
        clearTimeout: id => ursprung.uhr.loeschen(id),
        setInterval: (fn, ms, ...args) => ursprung.uhr.planen(tab, fn, ms, args, true),
        clearInterval: id => ursprung.uhr.loeschen(id),
        localStorage: ursprung.localStorageFuer(tab),
        sessionStorage: (() => {
            const m = new Map();
            return {
                getItem: k => (m.has(k) ? m.get(k) : null),
                setItem: (k, v) => m.set(k, String(v)),
                removeItem: k => m.delete(k)
            };
        })(),
        BroadcastChannel: ursprung.kanalKlasseFuer(tab),
        indexedDB: {}
    };
    ctx.window = ctx;
    ctx.self = ctx;
    ctx.addEventListener = (typ, fn) => (hoerer.window[typ] = hoerer.window[typ] || []).push(fn);
    ctx.removeEventListener = (typ, fn) => {
        hoerer.window[typ] = (hoerer.window[typ] || []).filter(f => f !== fn);
    };
    ctx.document = {
        visibilityState: 'visible',
        addEventListener: (typ, fn) => (hoerer.document[typ] = hoerer.document[typ] || []).push(fn),
        removeEventListener: (typ, fn) => {
            hoerer.document[typ] = (hoerer.document[typ] || []).filter(f => f !== fn);
        },
        getElementById: id => elemente[id] || (elemente[id] = fakeElement(id)),
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: tag => fakeElement(tag),
        body: fakeElement('body'),
        head: fakeElement('head')
    };
    ctx.location = {
        pathname: '/dnd-tracker.html',
        protocol: 'file:',
        reload: () => tab.entladen('reload'),
        get href() {
            return 'file:///dnd-tracker.html';
        },
        set href(ziel) {
            tab.entladen('navigation ' + ziel);
        }
    };
    // Dateileser: onload laeuft im naechsten Mikrotask; tab.dateiGelesen ist sein Promise
    ctx.FileReader = function FakeFileReader() {
        const leser = this;
        leser.readAsText = datei => {
            tab.dateiGelesen = Promise.resolve().then(() =>
                leser.onload({ target: { result: datei.inhalt } })
            );
        };
    };
    // Globale, die kein geladenes Modul definiert (render/helpers.js, utilities.js, ...)
    ctx.showToast = (m, typ) => tab.toasts.push({ text: String(m), typ });
    ctx.ErrorHandler = {
        log: (...a) => tab.fehlerLog.push(a),
        showError: m => tab.fehlerLog.push(['showError', m])
    };
    ctx.log = () => {};
    ctx.debugLogAdd = () => {};
    ctx.compareVersions = () => 0;
    ctx.migrateData = d => d;
    ctx.validateDataIntegrity = () => ({ valid: true, repairs: [] });
    // render/helpers.js bzw. die Render-Module (nicht geladen)
    ctx.safeJSONParse = (text, ersatz = null) => {
        try {
            return JSON.parse(text);
        } catch {
            return ersatz;
        }
    };
    ctx.renderAll = () => {};
    ctx.validateAndRepairNextId = () => ({ valid: true, repairs: [] }); // utils/utilities.js
    ctx.confirm = m => {
        tab.confirms.push(String(m));
        return tab.antworten.length ? tab.antworten.shift() : true;
    };
    ctx.alert = m => tab.alerts.push(String(m));
    Object.assign(ctx, opt.stubs || {});
    vm.createContext(ctx);

    const gewuenscht = new Set(BASIS_MODULE.concat(opt.module || []));
    for (const rel of gewuenscht) {
        if (!LOADER_MODULE.includes(rel))
            throw new Error(`Werkbank: ${rel} steht nicht in loader.js MODULES`);
    }
    const reihe = LOADER_MODULE.filter(rel => gewuenscht.has(rel));
    const roh = reihe.map(quelle);
    const texte = opt.buendelTreu === false ? roh : buendelDedup(roh);
    reihe.forEach((rel, i) => vm.runInContext(texte[i], ctx, { filename: rel }));

    ctx.idb = ursprung.idb.db;
    ctx.initIndexedDB = async () => {
        ctx.idb = ursprung.idb.db;
        return ctx.idb;
    };
    if (opt.aktiv && opt.aktiv !== STANDARD_KEY) ctx.STORAGE_KEY_OVERRIDE = opt.aktiv;
    ursprung.tabs.add(tab);
    tab.ctx = ctx;

    /** Boot in core/init.js-Reihenfolge (die Teile, die Persistenz und Konflikte betreffen). */
    tab.starten = async () => {
        await ctx.load();
        if (typeof ctx.initUnloadPersistence === 'function') ctx.initUnloadPersistence();
        ctx.initOfflineMode();
        ctx.initConflictDetection();
        if (typeof ctx.refreshPersistSnapshot === 'function') ctx.refreshPersistSnapshot();
        await ursprung.uhr.laufen(0);
        return tab;
    };

    /**
     * Browser-Entladen: beforeunload; bei angeforderter Rueckfrage und { bleiben: true }
     * bleibt der Tab offen. Sonst pagehide + visibilitychange(hidden), dann ist er weg.
     */
    tab.entladen = (grund = 'schliessen', { bleiben = false } = {}) => {
        if (tab.geschlossen) return null;
        tab.phase = 'beforeunload';
        const ev = {
            type: 'beforeunload',
            grund,
            defaultPrevented: false,
            returnValue: undefined,
            preventDefault() {
                this.defaultPrevented = true;
            }
        };
        tab.feuere('window', 'beforeunload', ev);
        tab.entladungen.push(ev);
        if (ev.defaultPrevented && bleiben) {
            tab.phase = 'laufend';
            return ev;
        }
        tab.phase = 'pagehide';
        tab.feuere('window', 'pagehide', { persisted: false });
        ctx.document.visibilityState = 'hidden';
        tab.feuere('document', 'visibilitychange', {});
        tab.geschlossen = true;
        tab.phase = 'geschlossen';
        ursprung.tabs.delete(tab);
        return ev;
    };

    /** Tab in den Hintergrund (Tabwechsel, Minimieren). */
    tab.verstecken = () => {
        ctx.document.visibilityState = 'hidden';
        tab.feuere('document', 'visibilitychange', {});
    };

    tab.bannerSichtbar = () =>
        !!elemente['conflict-banner'] && elemente['conflict-banner']._klassen.has('show');
    tab.element = id => ctx.document.getElementById(id);
    return tab;
}

module.exports = {
    erzeugeUrsprung,
    oeffneTab,
    buendelDedup,
    quelle,
    STANDARD_KEY,
    INDEX_KEY,
    BASIS_MODULE,
    WURZEL
};
