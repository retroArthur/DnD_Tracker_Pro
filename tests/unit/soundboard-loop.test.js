/**
 * Unit Tests — Soundboard Loop & Fortschritt (Erweiterung Phase 7, Design 2026-06-20)
 *
 * Abgedeckt (reine Logik + Daten, kein echtes Audio):
 *   - ccFade(duration)  — Crossfade-Kappung auf Dauer*0.5, 0-Schutz
 *   - cProg(elapsed, duration) — 0..1 Clamp, 0-Schutz
 *   - setTrackLoop(sceneId, blobId, loop) — Umschalten + explizit setzen
 *   - addTrackToScene — Default loop:true
 */

const fs = require('fs');
const path = require('path');

// Globale Stubs fuer die Modul-Bodies (nur bei Funktionsaufruf benoetigt)
global.window = global.window || {};
global.window.save = function() {};
global.showToast = function() {};

// Echte Module laden (Window-Exports). AudioContext/requestAnimationFrame werden
// nur in Funktionskoerpern referenziert, nicht bei der Definition -> eval ist sicher.
eval(fs.readFileSync(path.resolve(__dirname, '../../features/soundboard/soundboard-player.js'), 'utf8')); // eslint-disable-line no-eval
eval(fs.readFileSync(path.resolve(__dirname, '../../features/soundboard/soundboard-crud.js'), 'utf8')); // eslint-disable-line no-eval

// Lokale Aliasse mit eigenem Namen — die eval-geladenen Function-Declarations
// lecken in den Test-Scope; gleichnamige const-Deklaration wuerde kollidieren.
const ccFade = global.window.computeCrossfade;
const cProg = global.window.computeProgress;

describe('computeCrossfade', function() {
    test('0 oder negative Dauer -> 0', function() {
        expect(ccFade(0)).toBe(0);
        expect(ccFade(-5)).toBe(0);
        expect(ccFade(undefined)).toBe(0);
    });
    test('lange Clips -> auf 1.5s gekappt', function() {
        expect(ccFade(10)).toBe(1.5);
        expect(ccFade(100)).toBe(1.5);
    });
    test('kurze Clips -> Dauer * 0.5', function() {
        expect(ccFade(2)).toBe(1.0);
        expect(ccFade(1)).toBe(0.5);
        expect(ccFade(3)).toBe(1.5); // genau an der Grenze
    });
});

describe('computeProgress', function() {
    test('0 Dauer -> 0 (kein NaN/Division)', function() {
        expect(cProg(5, 0)).toBe(0);
        expect(cProg(5, undefined)).toBe(0);
    });
    test('lineare Position', function() {
        expect(cProg(0, 10)).toBe(0);
        expect(cProg(5, 10)).toBeCloseTo(0.5, 5);
        expect(cProg(10, 10)).toBe(1);
    });
    test('Clamp auf [0,1]', function() {
        expect(cProg(15, 10)).toBe(1);
        expect(cProg(-3, 10)).toBe(0);
    });
});

describe('setTrackLoop / addTrackToScene Default', function() {
    beforeEach(function() {
        global.window.D = { soundboard: { scenes: [] } };
    });

    test('addTrackToScene setzt loop:true als Default', function() {
        const scene = global.window.createScene('Test', 0);
        global.window.addTrackToScene(scene.id, 'audio_1', 0.5);
        const track = global.window.D.soundboard.scenes[0].tracks[0];
        expect(track.loop).toBe(true);
        expect(track.blobId).toBe('audio_1');
    });

    test('setTrackLoop ohne Argument schaltet um (an -> aus -> an)', function() {
        const scene = global.window.createScene('Test', 0);
        global.window.addTrackToScene(scene.id, 'audio_1', 0.5);
        expect(global.window.setTrackLoop(scene.id, 'audio_1')).toBe(false);
        expect(global.window.setTrackLoop(scene.id, 'audio_1')).toBe(true);
    });

    test('setTrackLoop setzt explizit', function() {
        const scene = global.window.createScene('Test', 0);
        global.window.addTrackToScene(scene.id, 'audio_1', 0.5);
        expect(global.window.setTrackLoop(scene.id, 'audio_1', false)).toBe(false);
        expect(global.window.setTrackLoop(scene.id, 'audio_1', true)).toBe(true);
    });

    test('setTrackLoop auf fehlender Szene/Track wirft nicht und gibt undefined', function() {
        expect(global.window.setTrackLoop('fehlt', 'fehlt')).toBeUndefined();
    });
});

/**
 * UAT-07-Regression — Szenen-Mutation stoppt laufendes Audio.
 * Bug: Szene löschen entfernte sie aus D, stoppte aber das Web-Audio nicht → Loop lief weiter.
 * Fix: deleteScene/removeTrackFromScene rufen stopAllTracksIfScene(sceneId).
 */
describe('Szenen-Mutation stoppt laufendes Audio (UAT 07)', function() {
    beforeEach(function() {
        global.window.D = { soundboard: { scenes: [] } };
    });

    test('deleteScene ruft stopAllTracksIfScene mit der Szenen-ID + entfernt die Szene', function() {
        const scene = global.window.createScene('Test', 0);
        const spy = jest.fn();
        global.window.stopAllTracksIfScene = spy;
        global.window.deleteScene(scene.id);
        expect(spy).toHaveBeenCalledWith(scene.id);
        expect(global.window.D.soundboard.scenes.length).toBe(0);
    });

    test('removeTrackFromScene ruft stopAllTracksIfScene mit der Szenen-ID', function() {
        const scene = global.window.createScene('Test', 0);
        global.window.addTrackToScene(scene.id, 'audio_1', 0.5);
        const spy = jest.fn();
        global.window.stopAllTracksIfScene = spy;
        global.window.removeTrackFromScene(scene.id, 'audio_1');
        expect(spy).toHaveBeenCalledWith(scene.id);
    });

    test('stopAllTracksIfScene stoppt NICHT, wenn keine/andere Szene spielt (kein aktives _activeScene)', function() {
        // Frisch geladen ist keine Szene aktiv → getActiveSceneId() null, kein stopAllTracks-Effekt/Fehler
        expect(global.window.getActiveSceneId()).toBeNull();
        expect(function() { global.window.stopAllTracksIfScene('scene_x'); }).not.toThrow();
    });

    test('setTrackVolume reicht die Lautstärke live an setLiveTrackVolume durch', function() {
        const scene = global.window.createScene('Test', 0);
        global.window.addTrackToScene(scene.id, 'audio_1', 0.5);
        const spy = jest.fn();
        global.window.setLiveTrackVolume = spy;
        global.window.setTrackVolume(scene.id, 'audio_1', 0.3);
        expect(spy).toHaveBeenCalledWith(scene.id, 'audio_1', 0.3);
        // und persistiert
        expect(global.window.D.soundboard.scenes[0].tracks[0].volume).toBeCloseTo(0.3, 5);
    });
});
