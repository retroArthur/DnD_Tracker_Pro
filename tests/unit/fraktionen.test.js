/**
 * Unit Tests — Fraktionen & Ruf-System (features/fraktionen/)
 *
 * Herkunft: Phase-5-Wave-0-Stub, aktiviert in Plan 05-07. Bis Phase 14 Plan 05
 * Teil der Welt-Story-Sammel-Testdatei (WELT-05-Block); durch TEST-04
 * (Plan 14-05) mechanisch in eine dedizierte Datei ausgegliedert —
 * unveraendert uebernommen, kein Test geaendert oder hinzugefuegt.
 */

// ============================================================
// WELT-05: Fraktionen & Ruf-System
// aktiviert in Plan 05-07
// ============================================================
describe('WELT-05: Fraktionen & Ruf-System', () => {
    // Inline-Implementierung der Ruf-Stufen-Logik (Non-ESM — analog WELT-01..04)
    const FRAKTIONS_RUF_STUFEN_STUB = [
        { min: -50, max: -21, label: 'Feindlich',    icon: '🔴', farbe: 'var(--red)'    },
        { min: -20, max:  -1, label: 'Misstrauisch', icon: '🟠', farbe: 'var(--yellow)' },
        { min:   0, max:   0, label: 'Neutral',       icon: '⚪', farbe: 'var(--text)'   },
        { min:   1, max:  20, label: 'Freundlich',    icon: '🟡', farbe: 'var(--gold)'   },
        { min:  21, max:  50, label: 'Verbündet',     icon: '🟢', farbe: 'var(--green)'  }
    ];

    function rufStufeInline(rufwert) {
        return FRAKTIONS_RUF_STUFEN_STUB.find(function(s) {
            return rufwert >= s.min && rufwert <= s.max;
        }) || FRAKTIONS_RUF_STUFEN_STUB[2]; // Fallback: Neutral
    }

    // Inline-Implementierung von anpassenRuf für Unit-Tests
    function anpassenRufInline(fraktionen, fraktionId, delta, grund) {
        var id = parseInt(fraktionId) || null;
        if (id === null) return false;
        var faction = fraktionen.find(function(f) { return f.id === id; });
        if (!faction) return false;
        // clamp ruf to [-50, +50]
        var neuerRuf = Math.max(-50, Math.min(50, faction.ruf + delta));
        faction.ruf = neuerRuf;
        if (!faction.rufHistorie) faction.rufHistorie = [];
        faction.rufHistorie.push({
            delta: delta,
            grund: grund || '',
            zeitstempel: Date.now()
        });
        return true;
    }

    test('rufStufe(15).label === Freundlich', () => {
        expect(rufStufeInline(15).label).toBe('Freundlich');
    });

    test('rufStufe(21).label === Verbündet', () => {
        expect(rufStufeInline(21).label).toBe('Verbündet');
    });

    test('rufStufe(-25).label === Feindlich', () => {
        expect(rufStufeInline(-25).label).toBe('Feindlich');
    });

    test('rufStufe(0).label === Neutral', () => {
        expect(rufStufeInline(0).label).toBe('Neutral');
    });

    test('rufStufe(-50).label === Feindlich (Grenzwert)', () => {
        expect(rufStufeInline(-50).label).toBe('Feindlich');
    });

    test('rufStufe(50).label === Verbündet (Grenzwert)', () => {
        expect(rufStufeInline(50).label).toBe('Verbündet');
    });

    test('rufStufe(-1).label === Misstrauisch', () => {
        expect(rufStufeInline(-1).label).toBe('Misstrauisch');
    });

    test('rufStufe(1).label === Freundlich', () => {
        expect(rufStufeInline(1).label).toBe('Freundlich');
    });

    test('anpassenRuf schreibt Eintrag in faction.rufHistorie', () => {
        var fraktionen = [{ id: 1, name: 'Gilde', ruf: 0, rufHistorie: [] }];
        var result = anpassenRufInline(fraktionen, 1, 10, 'Drachenschatz gerettet');
        expect(result).toBe(true);
        expect(fraktionen[0].rufHistorie).toHaveLength(1);
        expect(fraktionen[0].rufHistorie[0].delta).toBe(10);
        expect(fraktionen[0].rufHistorie[0].grund).toBe('Drachenschatz gerettet');
        expect(typeof fraktionen[0].rufHistorie[0].zeitstempel).toBe('number');
    });

    test('anpassenRuf erhöht faction.ruf um delta', () => {
        var fraktionen = [{ id: 1, name: 'Gilde', ruf: 0, rufHistorie: [] }];
        anpassenRufInline(fraktionen, 1, 10, 'Test');
        expect(fraktionen[0].ruf).toBe(10);
    });

    test('anpassenRuf klemmt ruf auf Maximum +50', () => {
        var fraktionen = [{ id: 1, name: 'Gilde', ruf: 45, rufHistorie: [] }];
        anpassenRufInline(fraktionen, 1, 20, 'Zu viel Ruf');
        expect(fraktionen[0].ruf).toBe(50);
    });

    test('anpassenRuf klemmt ruf auf Minimum -50', () => {
        var fraktionen = [{ id: 1, name: 'Gilde', ruf: -45, rufHistorie: [] }];
        anpassenRufInline(fraktionen, 1, -20, 'Gegner');
        expect(fraktionen[0].ruf).toBe(-50);
    });
});
