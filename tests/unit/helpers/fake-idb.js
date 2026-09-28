/**
 * Spec-nahes IndexedDB-Double (gemeinsam genutzt).
 *
 * Herkunft: tests/unit/idb-transaction-commit.test.js (Code-Review 2026-09-21, Einheit U3 —
 * R04). In Einheit U7 (R02) hierher verschoben, damit die Mehr-Tab-Werkbank
 * (tests/unit/helpers/multi-tab-harness.js) dasselbe Double nutzt, statt eine zweite
 * Nachbildung mit Alt-Semantik (Erfolg bei request.onsuccess) einzufuehren.
 *
 * Einzige Erweiterung gegenueber U3: jeder Eintrag in `anfragen` traegt zusaetzlich den
 * geklonten Wert (`wert`) — so laesst sich pruefen, dass ein put() mit bestimmten Daten
 * ABGESETZT wurde, ohne dessen Commit abzuwarten.
 *
 * Erweiterung U8 (R06): Policy `halten(op, store, wert)` kann einen LESE-Request (get, getAll,
 * count) zurueckhalten. Sie liefert ein Promise (oder null). Ein gehaltener Request feuert
 * erst, wenn das Promise aufloest; loest es mit einem Error auf, scheitert der Request mit
 * genau diesem Fehler. Ohne halten-Policy ist das Verhalten unveraendert.
 *
 * Korrekturrunde F1 (Code-Review 2026-09-21) — TRANSAKTIONSREIHENFOLGE nach IndexedDB 3.0
 * (§transaction scheduling), statt nur einer Kette ueber die readwrite-Transaktionen:
 *   - eine readwrite-Transaktion wartet auf ALLE frueher erstellten, noch nicht beendeten
 *     Transaktionen mit ueberlappendem Bereich;
 *   - eine readonly-Transaktion wartet auf frueher erstellte, noch nicht beendete
 *     readwrite-Transaktionen; readonly untereinander laufen nebenlaeufig.
 * Dieses Double behandelt JEDES Paar als ueberlappend (der Store-Bereich wird ignoriert) —
 * strenger als die Spezifikation, aber nie falsch-freigebend. "Beendet" heisst hier:
 * 'complete' oder 'abort' ist gefeuert; jede Transaktion gibt ihre Nachfolger frei, auch
 * eine abgebrochene.
 *
 * Damit braucht ein gehaltener Lese-Request KEINEN Schnappschuss bei der Erstellung mehr:
 * ein spaeter erstellter Schreibvorgang wartet ohnehin hinter dem gehaltenen Lesen und liest
 * es denselben Stand wie in einem echten IndexedDB. Vorher schrieb dieser Write waehrend des
 * Haltens fest und verdeckte damit das R06-Rennen (eigener Save im Ladefenster). Die
 * halten()-Schnittstelle selbst ist unveraendert.
 *
 * Festgehalten in tests/unit/fake-idb-scheduling.test.js (S1-S6).
 */

'use strict';

const { setImmediate: naechsterTask } = require('timers');

function klon(wert) {
    return wert === undefined ? undefined : JSON.parse(JSON.stringify(wert));
}

function mitEreignissen(obj) {
    obj._hoerer = {};
    obj.addEventListener = (typ, fn) => {
        (obj._hoerer[typ] = obj._hoerer[typ] || []).push(fn);
    };
    obj._feuere = (typ, ev) => {
        (obj._hoerer[typ] || []).slice().forEach(fn => fn.call(obj, ev));
        const handler = obj['on' + typ];
        if (typeof handler === 'function') handler.call(obj, ev);
    };
    return obj;
}

/**
 * - Jeder Request feuert success/error in einem EIGENEN Task (setImmediate), der Reihe nach.
 * - Schreiboperationen werden vorgemerkt und erst beim Commit uebernommen.
 * - Auto-Commit im Task nach dem letzten Request-Callback ohne offene Requests.
 * - Commit-Fehler (Policy commitFehler) feuert NUR 'abort' mit gesetztem tx.error.
 * - requestFehler(op, store, wert) laesst einen Request scheitern; das Event blubbert zur
 *   Transaktion ('error'), danach bricht sie ab ('abort'), wie in der Spezifikation.
 * - tx.abort() durch Skript: 'abort' mit tx.error === null.
 * - readwrite-Transaktionen laufen seriell in Erstellungsreihenfolge; readonly wartet auf
 *   frueher erstellte, noch offene readwrite-Transaktionen (siehe Kopfkommentar, F1).
 */
function erzeugeFakeIDB(opt = {}) {
    const log = opt.log || [];
    const bestand = {};
    const txOptionen = [];
    const anfragen = [];
    const policy = {
        commitFehler: opt.commitFehler || (() => null),
        requestFehler: opt.requestFehler || (() => null),
        halten: opt.halten || (() => null)
    };
    const LESE_OPS = new Set(['get', 'getAll', 'count']);
    // Alle je erzeugten Transaktionen in Erstellungsreihenfolge (Planung, siehe Kopfkommentar):
    // { id, mode, erledigt, fertig }. `fertig` loest auf, sobald 'complete' oder 'abort' gefeuert ist.
    const alleTx = [];
    let txZaehler = 0;
    let rwCommitZaehler = 0;
    let autoInc = 1000;

    function tabelle(name) {
        if (!bestand[name]) bestand[name] = new Map();
        return bestand[name];
    }

    function transaction(storeNames, mode, options) {
        const id = ++txZaehler;
        txOptionen.push({ id, mode, options: klon(options) });
        log.push(`tx.create#${id}(${mode})`);
        const tx = mitEreignissen({
            mode,
            error: null,
            oncomplete: null,
            onabort: null,
            onerror: null,
            _id: id
        });
        const vorgemerkt = [];
        const offen = [];
        let aktiv = true;
        let beendet = false;
        let gestartet = false;
        let geplant = false;
        let freigeben = () => {};
        naechsterTask(() => {
            aktiv = false;
        });

        function sicht(name) {
            const m = new Map(tabelle(name));
            vorgemerkt.forEach(s => {
                if (s.store !== name) return;
                if (s.op === 'put') m.set(s.key, s.value);
                else if (s.op === 'delete') m.delete(s.key);
                else if (s.op === 'clear') m.clear();
            });
            return m;
        }

        function planeSchritt() {
            if (geplant || beendet || !gestartet) return;
            geplant = true;
            naechsterTask(schritt);
        }

        function schritt() {
            geplant = false;
            if (beendet) return;
            if (offen.length === 0) {
                commit();
                return;
            }
            // Gehaltener Lese-Request (U8): erst weiter, wenn der Test ihn freigibt
            const kopf = offen[0];
            if (kopf.halt) {
                const halt = kopf.halt;
                kopf.halt = null;
                geplant = true;
                Promise.resolve(halt).then(ergebnis => {
                    if (ergebnis instanceof Error) kopf.haltFehler = ergebnis;
                    geplant = false;
                    planeSchritt();
                });
                return;
            }
            const { req, ausfuehren, op, storeName, wert, haltFehler } = offen.shift();
            let fehler = haltFehler || policy.requestFehler(op, storeName, wert);
            let ergebnis;
            if (!fehler) {
                try {
                    ergebnis = ausfuehren();
                } catch (e) {
                    fehler = e;
                }
            }
            req.readyState = 'done';
            aktiv = true;
            if (fehler) {
                req.error = fehler;
                const ev = {
                    target: req,
                    type: 'error',
                    _verhindert: false,
                    preventDefault() {
                        this._verhindert = true;
                    }
                };
                log.push(`req.error#${id}`);
                req._feuere('error', ev);
                tx._feuere('error', ev);
                aktiv = false;
                if (!ev._verhindert) {
                    abbrechen(fehler);
                    return;
                }
            } else {
                req.result = ergebnis;
                log.push(`req.success#${id}`);
                try {
                    req._feuere('success', { target: req, type: 'success' });
                } catch (e) {
                    aktiv = false;
                    const ae = new Error('Handler warf');
                    ae.name = 'AbortError';
                    abbrechen(ae);
                    return;
                }
                aktiv = false;
            }
            planeSchritt();
        }

        function commit() {
            if (mode === 'readwrite') {
                const nr = ++rwCommitZaehler;
                const fehler = policy.commitFehler({ nr, tx, vorgemerkt });
                if (fehler) {
                    abbrechen(fehler);
                    return;
                }
            }
            vorgemerkt.forEach(s => {
                const m = tabelle(s.store);
                if (s.op === 'put') m.set(s.key, s.value);
                else if (s.op === 'delete') m.delete(s.key);
                else if (s.op === 'clear') m.clear();
            });
            beendet = true;
            log.push(`tx.complete#${id}`);
            tx._feuere('complete', { target: tx, type: 'complete' });
            freigeben();
        }

        function abbrechen(fehler) {
            if (beendet) return;
            beendet = true;
            vorgemerkt.length = 0;
            offen.length = 0;
            tx.error = fehler || null;
            naechsterTask(() => {
                log.push(`tx.abort#${id}`);
                tx._feuere('abort', { target: tx, type: 'abort' });
                freigeben();
            });
        }

        function neuerRequest(ausfuehren, op, storeName, wert) {
            if (beendet || !aktiv) {
                const e = new Error('Transaktion nicht aktiv');
                e.name = 'TransactionInactiveError';
                throw e;
            }
            const req = mitEreignissen({
                onsuccess: null,
                onerror: null,
                result: undefined,
                error: null,
                transaction: tx,
                readyState: 'pending'
            });
            anfragen.push({ tx: id, op, store: storeName, wert });
            const halt = LESE_OPS.has(op) ? policy.halten(op, storeName, wert) : null;
            // Kein Schnappschuss bei der Erstellung: spaeter erstellte Schreibvorgaenge warten
            // hinter dieser Transaktion, also liest sie ohnehin den Stand von vorher (F1).
            offen.push({ req, ausfuehren, op, storeName, wert, halt: halt || null });
            planeSchritt();
            return req;
        }

        tx.abort = () => {
            if (beendet) {
                const e = new Error('Transaktion bereits beendet');
                e.name = 'InvalidStateError';
                throw e;
            }
            abbrechen(null);
        };

        tx.objectStore = name => {
            const store = {
                name,
                put(wert) {
                    const v = klon(wert);
                    if (v.id === undefined) v.id = autoInc++;
                    return neuerRequest(
                        () => {
                            vorgemerkt.push({ store: name, op: 'put', key: v.id, value: v });
                            return v.id;
                        },
                        'put',
                        name,
                        v
                    );
                },
                add(wert) {
                    return store.put(wert);
                },
                get(key) {
                    return neuerRequest(() => klon(sicht(name).get(key)), 'get', name, key);
                },
                getAll() {
                    return neuerRequest(
                        () => Array.from(sicht(name).values()).map(klon),
                        'getAll',
                        name
                    );
                },
                delete(key) {
                    return neuerRequest(
                        () => {
                            vorgemerkt.push({ store: name, op: 'delete', key });
                            return undefined;
                        },
                        'delete',
                        name,
                        key
                    );
                },
                clear() {
                    return neuerRequest(
                        () => {
                            vorgemerkt.push({ store: name, op: 'clear' });
                            return undefined;
                        },
                        'clear',
                        name
                    );
                },
                count() {
                    return neuerRequest(() => sicht(name).size, 'count', name);
                },
                index(indexName) {
                    const feld = indexName === 'campaign' ? 'campaignKey' : indexName;
                    return {
                        getAll(q) {
                            return neuerRequest(
                                () =>
                                    Array.from(sicht(name).values())
                                        .filter(x => q === undefined || x[feld] === q)
                                        .map(klon),
                                'getAll',
                                name
                            );
                        }
                    };
                }
            };
            return store;
        };

        const starten = () => {
            gestartet = true;
            planeSchritt();
        };
        // Planung nach IndexedDB 3.0 (F1): readwrite wartet auf alle frueher erstellten,
        // noch offenen Transaktionen, readonly nur auf die frueher erstellten readwrite.
        const blocker = alleTx.filter(
            t => !t.erledigt && (mode === 'readwrite' || t.mode === 'readwrite')
        );
        const eintrag = { id, mode, erledigt: false };
        eintrag.fertig = new Promise(resolve => {
            freigeben = () => {
                eintrag.erledigt = true;
                log.push(`tx.finished#${id}`);
                resolve();
            };
        });
        alleTx.push(eintrag);
        if (blocker.length) log.push(`tx.wait#${id}(on ${blocker.map(b => b.id).join(',')})`);
        Promise.all(blocker.map(b => b.fertig)).then(() => naechsterTask(starten));
        return tx;
    }

    return {
        db: { transaction, objectStoreNames: { contains: () => true }, close() {} },
        log,
        txOptionen,
        anfragen,
        policy,
        datensatz: (store, key) => klon(tabelle(store).get(key)),
        // Alle committeten Zeilen eines Stores (Einfuegereihenfolge) — fuer Assertions ueber
        // Datensaetze, deren Schluessel der Test nicht kennt (z. B. Backups mit Date.now()-ID)
        zeilen: store => Array.from(tabelle(store).values(), klon),
        setze: (store, wert) => tabelle(store).set(wert.id, klon(wert)),
        anzahl: store => tabelle(store).size
    };
}

module.exports = { erzeugeFakeIDB };
