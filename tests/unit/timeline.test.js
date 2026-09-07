/**
 * Unit Tests — Kampagnen-Timeline (features/timeline/)
 *
 * Herkunft: Phase-5-Wave-0-Stub, aktiviert in Plan 05-05. Bis Phase 14 Plan 05
 * Teil der Welt-Story-Sammel-Testdatei (WELT-03-Block); durch TEST-04
 * (Plan 14-05) mechanisch in eine dedizierte Datei ausgegliedert —
 * unveraendert uebernommen, kein Test geaendert oder hinzugefuegt.
 */

// ============================================================
// WELT-03: Kampagnen-Timeline
// ============================================================
describe('WELT-03: Kampagnen-Timeline', () => {
    // Inline-Implementierung der Sortierfunktion (Non-ESM — analog WELT-01/02)
    function sortiereTimelineEventsInline(events) {
        if (!Array.isArray(events)) return [];
        return events.slice().sort(function(a, b) {
            var da = (a && a.datum) ? a.datum : {};
            var db = (b && b.datum) ? b.datum : {};
            var jahrA = da.jahr || 0;
            var jahrB = db.jahr || 0;
            if (jahrA !== jahrB) return jahrA - jahrB;
            var monatA = da.monat || 0;
            var monatB = db.monat || 0;
            if (monatA !== monatB) return monatA - monatB;
            var tagA = da.tag || 0;
            var tagB = db.tag || 0;
            return tagA - tagB;
        });
    }

    // Inline-Implementierung von advanceCalendarDate für Tests
    function advanceCalendarDateInline(cal, tage) {
        var MAX = 3600;
        var anzahl = parseInt(tage, 10) || 0;
        if (anzahl < 0) anzahl = 0;
        if (anzahl > MAX) anzahl = MAX;
        var tag = Math.max(1, Math.min(30, parseInt(cal.day, 10) || 1));
        var monat = Math.max(1, Math.min(12, parseInt(cal.month, 10) || 1));
        var jahr = parseInt(cal.year, 10) || 1492;
        tag += anzahl;
        while (tag > 30) {
            tag -= 30;
            monat++;
            if (monat > 12) {
                monat = 1;
                jahr++;
            }
        }
        return { day: tag, month: monat, year: jahr };
    }

    test('Timeline-Ereignisse werden chronologisch sortiert', () => {
        var events = [
            { datum: { tag: 15, monat: 3, jahr: 1492 }, titel: 'C' },
            { datum: { tag: 1,  monat: 1, jahr: 1492 }, titel: 'A' },
            { datum: { tag: 5,  monat: 2, jahr: 1492 }, titel: 'B' }
        ];
        var sorted = sortiereTimelineEventsInline(events);
        expect(sorted[0].titel).toBe('A');
        expect(sorted[1].titel).toBe('B');
        expect(sorted[2].titel).toBe('C');
    });

    test('Timeline-Sortierung: nach Jahr, dann Monat, dann Tag', () => {
        var events = [
            { datum: { tag: 1, monat: 1, jahr: 1493 }, titel: 'Später' },
            { datum: { tag: 30, monat: 12, jahr: 1492 }, titel: 'Früher' }
        ];
        var sorted = sortiereTimelineEventsInline(events);
        expect(sorted[0].titel).toBe('Früher');
        expect(sorted[1].titel).toBe('Später');
    });

    test('advanceCalendarDate rückt Datum korrekt vor (einfach)', () => {
        var cal = { day: 1, month: 1, year: 1492 };
        var result = advanceCalendarDateInline(cal, 3);
        expect(result.day).toBe(4);
        expect(result.month).toBe(1);
        expect(result.year).toBe(1492);
    });

    test('advanceCalendarDate: Monatsgrenze (30-Tage-Monate)', () => {
        var cal = { day: 29, month: 1, year: 1492 };
        var result = advanceCalendarDateInline(cal, 3);
        expect(result.day).toBe(2);
        expect(result.month).toBe(2);
        expect(result.year).toBe(1492);
    });

    test('advanceCalendarDate: Jahresgrenze (12 Monate)', () => {
        var cal = { day: 29, month: 12, year: 1492 };
        var result = advanceCalendarDateInline(cal, 3);
        expect(result.day).toBe(2);
        expect(result.month).toBe(1);
        expect(result.year).toBe(1493);
    });

    test('advanceCalendarDate: negativer Wert wird auf 0 geklemmt', () => {
        var cal = { day: 5, month: 3, year: 1492 };
        var result = advanceCalendarDateInline(cal, -10);
        expect(result.day).toBe(5);
        expect(result.month).toBe(3);
        expect(result.year).toBe(1492);
    });

    test('advanceCalendarDate: DoS-Cap (>3600 wird auf MAX geklemmt)', () => {
        var cal = { day: 1, month: 1, year: 1492 };
        var result = advanceCalendarDateInline(cal, 99999);
        // MAX = 3600 Tage = 120 Monate = 10 Jahre
        // 1 + 3600 Tage = 3601. 3601 / 30 = 120 Monate Rest 1 Tag. 120 Monate / 12 = 10 Jahre
        expect(result.year).toBe(1502);
        expect(result.day).toBe(1);
        expect(result.month).toBe(1);
    });
});
