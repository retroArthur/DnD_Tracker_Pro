/**
 * Unit Tests — Wuerfel-Statistiken (Phase 7 — UX-02)
 *
 * Wave-0 Stubs: Alle Tests als todo/skip markiert.
 * Feature-Plan 07-04 aktiviert diese Tests (ersetzt todo/skip durch echte Assertions).
 *
 * Abgedeckte Anforderungen:
 *   UX-02c — Histogramm hat 20 Balken (faces 1–20)
 *   UX-02d — Expected-Overlay bei korrekter Hoehe (5 % pro Face)
 *   UX-02e — Crit(20)-Rate = aktueller %-Anteil der 20er
 *   UX-02f — Fumble(1)-Rate = aktueller %-Anteil der 1er
 *   UX-02g — "Diese Session"-Filter zeigt nur aktuelle Session
 *   UX-02h — Per-Character-Breakdown: charId-zugeordnete Wuerfe getrennt
 */

describe('Wuerfel-Statistiken — computeD20Counts / renderD20Histogram', function () {
    test.todo('histogram 20 bars');
    // UX-02c: renderD20Histogram(counts) erzeugt SVG mit genau 20 <rect>-Elementen.
    // Wird aktiviert wenn renderD20Histogram + computeD20Counts in 07-04 implementiert.

    test.todo('expected overlay');
    // UX-02d: Bei 100 gleichverteilten Wuerfen liegt expectedY bei 5 % * maxHeight.
    // Wird aktiviert wenn renderD20Histogram die Overlay-Linie rendert.
});

describe('Wuerfel-Statistiken — Crit/Fumble-Rate', function () {
    test.todo('crit rate');
    // UX-02e: computeCritRate(records) = (Anzahl 20er / gesamt-d20-Wuerfe) * 100.

    test.todo('fumble rate');
    // UX-02f: computeFumbleRate(records) = (Anzahl 1er / gesamt-d20-Wuerfe) * 100.
});

describe('Wuerfel-Statistiken — Session-Filter', function () {
    test.todo('session filter');
    // UX-02g: getStatsForSession(sessionId) liefert nur Records mit passendem sessionId.
    // Mock: 3 Records mit session='A', 2 mit session='B' — Filter 'A' gibt 3 zurueck.
});

describe('Wuerfel-Statistiken — Character-Breakdown', function () {
    test.todo('character breakdown');
    // UX-02h: groupByChar(records) gruppiert nach charId.
    // null-charId landet in "Allgemein"-Bucket.
});

describe('Soundboard — Dateigroessen-Guard', function () {
    test.todo('size warning');
    // UX-01f: checkAudioFileSize(file) gibt { warn: true } zurueck wenn file.size > 20 MB.
    // Pure-JS-Logik, kein Audio-Playback.
});
