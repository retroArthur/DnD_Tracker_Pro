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
