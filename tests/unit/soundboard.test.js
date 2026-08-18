/**
 * Unit Tests — Soundboard (Phase 7 — UX-01)
 *
 * Wave-2 (07-02): Test aktiviert — checkAudioFileSize Grenzen verifiziert.
 *
 * Abgedeckte Anforderungen:
 *   UX-01f — Per-File-Groessen-Warnung bei > 20 MB (D-01a)
 *   T-07-AUDIO-DOS — Hard block bei > 100 MB (kein IDB-Write)
 */

// checkAudioFileSize ist eine reine Hilfsfunktion ohne IDB/DOM-Abhaengigkeit.
// Wir laden sie direkt aus dem Quell-Modul um Jest-jsdom-Kompatibilitaet sicherzustellen.
const fs = require('fs');
const path = require('path');

// Modul-Code ausfuehren um checkAudioFileSize + Konstanten im globalen Scope zu haben
const moduleSrc = fs.readFileSync(
    path.resolve(__dirname, '../../features/soundboard/soundboard-idb.js'),
    'utf8'
);

// window.initIndexedDB simulieren (wird in saveSoundBlob benoetigt, nicht in checkAudioFileSize)
global.window = global.window || {};
global.window.initIndexedDB = function() { return Promise.resolve(); };
global.window.idb = null;
global.showToast = function() {};

// Modul-Code evaluieren — setzt checkAudioFileSize, MAX_AUDIO_BYTES etc. auf window
eval(moduleSrc); // eslint-disable-line no-eval

const checkFn = global.window.checkAudioFileSize || global.checkAudioFileSize;
const MAX_BYTES = global.window.MAX_AUDIO_BYTES;
const MAX_BYTES_HARD = 100 * 1024 * 1024;

describe('Soundboard — Dateigroessen-Guard', function () {
    describe('size warning', function () {
        test('Datei unter Warn-Schwelle gibt { ok: true, warn: false, block: false }', function () {
            const result = checkFn(5 * 1024 * 1024); // 5 MB
            expect(result.ok).toBe(true);
            expect(result.warn).toBe(false);
            expect(result.block).toBe(false);
        });

        test('Datei genau an Warn-Schwelle (20 MB) gibt { ok: true }', function () {
            const result = checkFn(MAX_BYTES); // exakt 20 MB
            expect(result.ok).toBe(true);
            expect(result.warn).toBe(false);
            expect(result.block).toBe(false);
        });

        test('Datei ueber Warn-Schwelle gibt { warn: true, block: false }', function () {
            const result = checkFn(21 * 1024 * 1024); // 21 MB
            expect(result.ok).toBe(false);
            expect(result.warn).toBe(true);
            expect(result.block).toBe(false);
            expect(result.message).toBeTruthy();
        });

        test('Datei ueber Hard-Block-Schwelle (100 MB) gibt { block: true }', function () {
            const result = checkFn(101 * 1024 * 1024); // 101 MB
            expect(result.ok).toBe(false);
            expect(result.warn).toBe(false);
            expect(result.block).toBe(true);
            expect(result.message).toBeTruthy();
        });

        test('Datei exakt an Hard-Block-Schwelle (100 MB) gibt { ok: false, warn: true, block: false }', function () {
            // 100 MB ist noch warn, nicht block (> 100 MB triggert block)
            const result = checkFn(MAX_BYTES_HARD);
            expect(result.block).toBe(false);
            expect(result.warn).toBe(true);
        });
    });
});

/**
 * UX-01b Regression — Doppel-Import-Schutz.
 *
 * Bug (UAT Phase 7): Eine einzelne Datei-Auswahl erzeugte ZWEI IDB-Records.
 * Ursache: <input type="file"> feuert bei einer Auswahl BEIDE Events 'input' UND 'change';
 * EventDelegation dispatcht die data-action auf beiden → importAudioFile lief zweimal.
 * Fix: Handler 'soundboard-file-change' reagiert nur auf das 'change'-Event.
 *
 * Dieser Test laedt das ECHTE SystemActions-Objekt via Mock-EventDelegation und prueft,
 * dass eine Auswahl (input + change) genau EINEN Import ausloest.
 */
describe('Soundboard — Doppel-Import-Schutz (UX-01b)', function () {
    function loadFileChangeHandler() {
        const src = fs.readFileSync(
            path.resolve(__dirname, '../../ui/actions/system-actions.js'),
            'utf8'
        );
        const collected = {};
        // system-actions.js ruft am Dateiende EventDelegation.registerAction(name, handler)
        // fuer jeden Eintrag. Handler-Bodies werden bei der Definition NICHT ausgefuehrt.
        global.EventDelegation = {
            registerAction: function(name, handler) { collected[name] = handler; }
        };
        eval(src); // eslint-disable-line no-eval
        return collected['soundboard-file-change'];
    }

    test('eine Auswahl (input + change) loest genau EINEN Import aus', function () {
        const handler = loadFileChangeHandler();
        expect(typeof handler).toBe('function');

        const importSpy = jest.fn();
        global.window.importAudioFile = importSpy;
        const target = { value: 'C:\\fakepath\\ambient.mp3' };

        // Reihenfolge wie im Browser: erst 'input', dann 'change'
        handler({ target: target, event: { type: 'input' } });
        handler({ target: target, event: { type: 'change' } });

        expect(importSpy).toHaveBeenCalledTimes(1);
        expect(importSpy).toHaveBeenCalledWith(target);
        // nach erfolgreichem Import wird der Input zurueckgesetzt (gleiche Datei spaeter erneut importierbar)
        expect(target.value).toBe('');
    });

    test('reines input-Event (ohne change) loest KEINEN Import aus', function () {
        const handler = loadFileChangeHandler();
        const importSpy = jest.fn();
        global.window.importAudioFile = importSpy;

        handler({ target: { value: 'x' }, event: { type: 'input' } });

        expect(importSpy).not.toHaveBeenCalled();
    });
});

/**
 * Grabstein-Loeschung — softDeleteSoundBlob/restoreSoundBlob/listSoundBlobs (SAFE-03, Plan 12-06)
 *
 * Testet die bereits am Dateianfang via eval() geladenen Funktionen aus soundboard-idb.js
 * gegen einen In-Memory-IDB-Mock. Vorlage: setupMockIDB() in
 * tests/unit/stability.test.js:447-481 — hier um getAll()/delete() und eine
 * tx.oncomplete-Sequenzierung erweitert, da softDeleteSoundBlob()/restoreSoundBlob() einen
 * get() gefolgt von einem put() INNERHALB derselben Transaktion brauchen (die Vorlage
 * kennt nur put()/get() unabhaengig voneinander).
 *
 * WICHTIG zur Testreihenfolge: _sbSessionCleanupDone (soundboard-idb.js) ist ein
 * Modul-Flag, das beim ALLERERSTEN listSoundBlobs()-Aufruf dieser Datei kippt und danach
 * dauerhaft true bleibt (die Modulquelle wurde nur EINMAL fuer die ganze Testdatei
 * evaluiert, siehe Dateianfang). Der Sitzungs-Aufraeum-Test steht deshalb bewusst ZUERST
 * in diesem describe-Block — er ist der erste Aufruf von listSoundBlobs() in der gesamten
 * Datei und damit der einzige, der das Aufraeumen ueberhaupt beobachten kann.
 */
describe('Soundboard — Grabstein-Loeschung (SAFE-03, Plan 12-06)', function () {
    function createMockIDB(seedRecords) {
        const mockStore = {};
        (seedRecords || []).forEach(function (r) {
            mockStore[r.id] = Object.assign({}, r);
        });

        function transaction() {
            const txObj = { oncomplete: null, onerror: null };
            let pendingOps = 0;
            let bodyDone = false;
            function checkComplete() {
                if (bodyDone && pendingOps === 0 && txObj.oncomplete) {
                    txObj.oncomplete();
                }
            }
            txObj.objectStore = function () {
                return {
                    get(key) {
                        pendingOps++;
                        const req = { onsuccess: null, onerror: null, result: mockStore[key] || null };
                        Promise.resolve().then(function () {
                            if (req.onsuccess) req.onsuccess();
                            pendingOps--;
                            checkComplete();
                        });
                        return req;
                    },
                    getAll() {
                        pendingOps++;
                        const records = Object.keys(mockStore).map(function (k) { return mockStore[k]; });
                        const req = { onsuccess: null, onerror: null, result: records };
                        Promise.resolve().then(function () {
                            if (req.onsuccess) req.onsuccess();
                            pendingOps--;
                            checkComplete();
                        });
                        return req;
                    },
                    put(record) {
                        mockStore[record.id] = Object.assign({}, record);
                        return { onsuccess: null, onerror: null };
                    },
                    delete(key) {
                        delete mockStore[key];
                        return { onsuccess: null, onerror: null };
                    }
                };
            };
            // Simuliert, dass alle synchron im Aufrufer angehaengten Requests bereits
            // registriert sind, bevor die Transaktion "abschliessen" kann.
            Promise.resolve().then(function () {
                bodyDone = true;
                checkComplete();
            });
            return txObj;
        }

        return { idbInstance: { transaction: transaction }, mockStore: mockStore };
    }

    function installMockIDB(seedRecords) {
        const mock = createMockIDB(seedRecords);
        global.window.idb = mock.idbInstance;
        global.window.initIndexedDB = function () {
            global.window.idb = mock.idbInstance;
            return Promise.resolve();
        };
        return mock;
    }

    test('Sitzungs-Aufraeumen: Grabstein vor Sitzungsstart wird beim ersten listSoundBlobs() endgueltig entfernt, Grabstein der laufenden Sitzung bleibt', async function () {
        // _sbSessionStart wurde beim eval() der Modulquelle am Dateianfang gesetzt
        // (simuliert App-Boot). deletedAt: 1 (1.1.1970) liegt garantiert davor.
        installMockIDB([
            { id: 'stale', name: 'old.mp3', size: 1, type: 'audio/mp3', blob: { fake: 1 }, savedAt: 1, deletedAt: 1 },
            { id: 'fresh', name: 'new.mp3', size: 1, type: 'audio/mp3', blob: { fake: 2 }, savedAt: 1, deletedAt: Date.now() },
            { id: 'active', name: 'live.mp3', size: 1, type: 'audio/mp3', blob: { fake: 3 }, savedAt: 1 }
        ]);

        const list = await global.window.listSoundBlobs();
        expect(list.map(function (r) { return r.id; })).toEqual(['active']);

        // stale wurde hart geloescht — auch getSoundBlob() liefert nichts mehr
        expect(await global.window.getSoundBlob('stale')).toBeNull();
        // fresh ist ein Grabstein der laufenden Sitzung — bleibt liegen und ladbar
        expect(await global.window.getSoundBlob('fresh')).toEqual({ fake: 2 });
    });

    test('softDeleteSoundBlob(): Eintrag verschwindet aus listSoundBlobs(), bleibt aber via getSoundBlob() ladbar', async function () {
        installMockIDB([
            { id: 'a1', name: 'ambient.mp3', size: 100, type: 'audio/mp3', blob: { fake: true }, savedAt: Date.now() }
        ]);

        await global.window.softDeleteSoundBlob('a1');

        const list = await global.window.listSoundBlobs();
        expect(list.find(function (r) { return r.id === 'a1'; })).toBeUndefined();

        const blob = await global.window.getSoundBlob('a1');
        expect(blob).toEqual({ fake: true });
    });

    test('restoreSoundBlob(): Eintrag erscheint wieder in listSoundBlobs(), Name/Typ/Groesse unveraendert', async function () {
        installMockIDB([
            {
                id: 'a2', name: 'battle.mp3', size: 555, type: 'audio/mp3',
                blob: { fake: true }, savedAt: 12345, deletedAt: Date.now()
            }
        ]);

        const ok = await global.window.restoreSoundBlob('a2');
        expect(ok).toBe(true);

        const list = await global.window.listSoundBlobs();
        const restored = list.find(function (r) { return r.id === 'a2'; });
        expect(restored).toBeDefined();
        expect(restored.name).toBe('battle.mp3');
        expect(restored.size).toBe(555);
        expect(restored.type).toBe('audio/mp3');
    });

    test('restoreSoundBlob() auf eine unbekannte id liefert false und wirft nicht', async function () {
        installMockIDB([]);
        await expect(global.window.restoreSoundBlob('does-not-exist')).resolves.toBe(false);
    });

    test('deleteSoundBlob() loescht weiterhin sofort und endgueltig (unveraendert)', async function () {
        installMockIDB([
            { id: 'a3', name: 'x.mp3', size: 1, type: 'audio/mp3', blob: {}, savedAt: 1 }
        ]);
        await global.window.deleteSoundBlob('a3');
        expect(await global.window.getSoundBlob('a3')).toBeNull();
    });
});

/**
 * removeAudioFile() + Undo-Hook — Reihenfolge, Wiederherstellung, Redo, fremdes Aktionslabel
 * (SAFE-03, Plan 12-06, T-12-19).
 *
 * Laedt soundboard-crud.js frisch (eval-Muster wie loadFileChangeHandler() oben) in eine
 * lokale Funktions-Closure — jeder loadCrudModule()-Aufruf bekommt sein eigenes
 * Modul-Journal (_audioDeleteJournal) und seinen eigenen registrierten Undo-Hook, damit
 * Tests sich nicht gegenseitig beeinflussen. window.saveUndoState, window.softDeleteSoundBlob,
 * window.restoreSoundBlob, window.save, window.renderAudioLibrary und window.registerUndoHook
 * werden VOR dem eval() als Spies gestellt.
 */
describe('Soundboard — removeAudioFile() Undo/Redo (SAFE-03, Plan 12-06)', function () {
    function loadCrudModule() {
        const src = fs.readFileSync(
            path.resolve(__dirname, '../../features/soundboard/soundboard-crud.js'),
            'utf8'
        );
        const registerUndoHookSpy = jest.fn();
        global.window.registerUndoHook = registerUndoHookSpy;
        global.window.saveUndoState = jest.fn();
        global.window.softDeleteSoundBlob = jest.fn(function () { return Promise.resolve(); });
        global.window.restoreSoundBlob = jest.fn(function () { return Promise.resolve(true); });
        global.window.deleteSoundBlob = jest.fn();
        global.window.save = jest.fn();
        global.window.renderAudioLibrary = jest.fn();
        global.window.getActiveSceneId = undefined;
        global.window.stopAllTracks = jest.fn();
        global.window.D = { soundboard: { scenes: [] } };
        global.showToast = jest.fn();

        eval(src); // eslint-disable-line no-eval

        // removeAudioFile() registriert seinen Undo-Hook einmalig beim Modul-Load.
        expect(registerUndoHookSpy).toHaveBeenCalledTimes(1);
        const hook = registerUndoHookSpy.mock.calls[0][0];
        return { hook: hook, removeAudioFile: global.window.removeAudioFile };
    }

    test('removeAudioFile(): saveUndoState laeuft VOR softDeleteSoundBlob und vor der Szenen-Mutation (save())', async function () {
        const { removeAudioFile } = loadCrudModule();
        global.window.D.soundboard.scenes = [{ id: 's1', tracks: [{ blobId: 'audio_1' }] }];

        const order = [];
        global.window.saveUndoState.mockImplementation(function () { order.push('saveUndoState'); });
        global.window.softDeleteSoundBlob.mockImplementation(function () {
            order.push('softDeleteSoundBlob');
            return Promise.resolve();
        });
        global.window.save.mockImplementation(function () { order.push('save'); });

        await removeAudioFile('audio_1');

        expect(order).toEqual(['saveUndoState', 'softDeleteSoundBlob', 'save']);
    });

    test('removeAudioFile(): verwendet softDeleteSoundBlob, nicht deleteSoundBlob', async function () {
        const { removeAudioFile } = loadCrudModule();

        await removeAudioFile('audio_2');

        expect(global.window.softDeleteSoundBlob).toHaveBeenCalledWith('audio_2');
        expect(global.window.deleteSoundBlob).not.toHaveBeenCalled();
    });

    test('Undo-Hook stellt bei { action: "Audio entfernt", direction: "undo" } genau die zuletzt entfernte Datei wieder her', async function () {
        const { hook, removeAudioFile } = loadCrudModule();
        await removeAudioFile('audio_a');
        await removeAudioFile('audio_b');

        global.window.restoreSoundBlob.mockClear();
        await hook({ action: 'Audio entfernt', direction: 'undo' });

        expect(global.window.restoreSoundBlob).toHaveBeenCalledTimes(1);
        expect(global.window.restoreSoundBlob).toHaveBeenCalledWith('audio_b');
        expect(global.window.renderAudioLibrary).toHaveBeenCalled();
    });

    test('Zwei aufeinanderfolgende Entfernungen werden in umgekehrter Reihenfolge wiederhergestellt', async function () {
        const { hook, removeAudioFile } = loadCrudModule();
        await removeAudioFile('audio_a');
        await removeAudioFile('audio_b');

        await hook({ action: 'Audio entfernt', direction: 'undo' });
        await hook({ action: 'Audio entfernt', direction: 'undo' });

        const calls = global.window.restoreSoundBlob.mock.calls.map(function (c) { return c[0]; });
        expect(calls).toEqual(['audio_b', 'audio_a']);
    });

    test('Redo versieht dieselbe Datei wieder mit einem Grabstein (softDeleteSoundBlob)', async function () {
        const { hook, removeAudioFile } = loadCrudModule();
        await removeAudioFile('audio_c');
        await hook({ action: 'Audio entfernt', direction: 'undo' });

        global.window.softDeleteSoundBlob.mockClear();
        await hook({ action: 'Audio entfernt', direction: 'redo' });

        expect(global.window.softDeleteSoundBlob).toHaveBeenCalledWith('audio_c');
    });

    test('Ein Hook-Aufruf mit einem anderen Aktionslabel laesst die Datenbank unberuehrt', async function () {
        const { hook, removeAudioFile } = loadCrudModule();
        await removeAudioFile('audio_d');

        global.window.restoreSoundBlob.mockClear();
        global.window.softDeleteSoundBlob.mockClear();
        global.window.renderAudioLibrary.mockClear();

        await hook({ action: 'Charakter geloescht', direction: 'undo' });

        expect(global.window.restoreSoundBlob).not.toHaveBeenCalled();
        expect(global.window.softDeleteSoundBlob).not.toHaveBeenCalled();
        expect(global.window.renderAudioLibrary).not.toHaveBeenCalled();
    });
});
