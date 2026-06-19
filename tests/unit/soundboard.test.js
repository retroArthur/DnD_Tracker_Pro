/**
 * Unit Tests — Soundboard (Phase 7 — UX-01)
 *
 * Wave-0 Stub: Test als todo markiert.
 * Feature-Plan 07-02 aktiviert diesen Test (ersetzt todo durch echte Assertion).
 *
 * Abgedeckte Anforderungen:
 *   UX-01f — Per-File-Groessen-Warnung bei > 20 MB (D-01a)
 */

describe('Soundboard — Dateigroessen-Guard', function () {
    test.todo('size warning');
    // UX-01f: checkAudioFileSize(file) gibt { warn: true } zurueck wenn file.size > 20 * 1024 * 1024.
    // Implementierung erfolgt in 07-02 (soundboard-idb.js oder soundboard-crud.js).
    // Pure-JS-Logik — kein Audio-Playback, kein DOM notwendig.
    //
    // Beispiel-Assertion (nach Aktivierung):
    // const file = { name: 'bigtrack.mp3', size: 21 * 1024 * 1024, type: 'audio/mpeg' };
    // expect(checkAudioFileSize(file).warn).toBe(true);
    // const small = { name: 'short.mp3', size: 5 * 1024 * 1024, type: 'audio/mpeg' };
    // expect(checkAudioFileSize(small).warn).toBe(false);
});
