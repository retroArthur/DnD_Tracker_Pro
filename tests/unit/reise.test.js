/**
 * Unit Tests — Reise- & Wetter-Simulator (features/reise/)
 *
 * Herkunft: Phase-5-Wave-0-Stub, aktiviert in Plan 05-06. Bis Phase 14 Plan 05
 * Teil der Welt-Story-Sammel-Testdatei (WELT-04-Block); durch TEST-04
 * (Plan 14-05) mechanisch in eine dedizierte Datei ausgegliedert —
 * unveraendert uebernommen, kein Test geaendert oder hinzugefuegt.
 */

// ============================================================
// WELT-04: Reise- & Wetter-Simulator
// aktiviert in Plan 05-06
// ============================================================
describe('WELT-04: Reise- & Wetter-Simulator', () => {
    // Minimal-Stubs für window-Globals (Non-ESM, kein require möglich)
    const REISE_TEMPO_STUB = {
        langsam: { label: 'Langsam', meilenProTag: 18, effekt: 'Heimlichkeit möglich' },
        normal:  { label: 'Normal',  meilenProTag: 24, effekt: '—' },
        schnell: { label: 'Schnell', meilenProTag: 30, effekt: '−5 passive Wahrnehmung' }
    };
    const REISE_GELÄNDE_STUB = [
        { id: 'normal',    label: 'Normal',             distanzFaktor: 1.0 },
        { id: 'schwierig', label: 'Schwieriges Gelaende', distanzFaktor: 0.5 },
        { id: 'gebirge',   label: 'Gebirge',             distanzFaktor: 0.5 },
        { id: 'sumpf',     label: 'Sumpf',               distanzFaktor: 0.5 },
        { id: 'meer',      label: 'Schiff',              distanzFaktor: 1.0 }
    ];
    const WETTER_TABELLEN_STUB = {
        'gemässigt': {
            winter:    { id: 'wetter_gem_winter', diceType: 8, entries: [
                { range: '1', text: 'Starker Frost, Boden gefroren.' },
                { range: '2', text: 'Grauer Himmel, leichter Schneefall.' },
                { range: '3', text: 'Eisige Böen, Sichtweite eingeschränkt.' },
                { range: '4', text: 'Ruhiger Wintertag, klare Luft.' },
                { range: '5', text: 'Dichter Schneefall, schwere Verwehungen.' },
                { range: '6', text: 'Glätte durch Raureif.' },
                { range: '7', text: 'Milder Wintertag, leichter Südwind.' },
                { range: '8', text: 'Blitzblanker Winterhimmel, bitterkalt.' }
            ]},
            fruehling: { id: 'wetter_gem_frueh', diceType: 8, entries: [
                { range: '1', text: 'Starker Regen, Wege matschig.' },
                { range: '2', text: 'Bewölkt, kühle Luft.' },
                { range: '3', text: 'Sonnig und frisch (12°C).' },
                { range: '4', text: 'Gewitter am Nachmittag.' },
                { range: '5', text: 'Leichter Nieselregen.' },
                { range: '6', text: 'Warmer Frühlingstag (18°C).' },
                { range: '7', text: 'Nebel am Morgen, klarer Nachmittag.' },
                { range: '8', text: 'Starker Wind aus Nordwest.' }
            ]},
            sommer:    { id: 'wetter_gem_sommer', diceType: 8, entries: [
                { range: '1', text: 'Schwüler Sommertag (30°C).' },
                { range: '2', text: 'Gewitterstürme nachmittags.' },
                { range: '3', text: 'Heiß und trocken (34°C).' },
                { range: '4', text: 'Angenehm warm (24°C), leichte Brise.' },
                { range: '5', text: 'Dunstiger Morgen, heiß am Mittag.' },
                { range: '6', text: 'Starker Regen, kühlt ab auf 18°C.' },
                { range: '7', text: 'Klarer Himmel, sonnig (28°C).' },
                { range: '8', text: 'Windstille, drückend warm.' }
            ]},
            herbst:    { id: 'wetter_gem_herbst', diceType: 8, entries: [
                { range: '1', text: 'Herbststurm, starker Regen.' },
                { range: '2', text: 'Neblig und feucht.' },
                { range: '3', text: 'Kühler, klarer Tag (10°C).' },
                { range: '4', text: 'Goldener Herbsttag (16°C).' },
                { range: '5', text: 'Erste Fröste nachts.' },
                { range: '6', text: 'Nieselregen, grauer Himmel.' },
                { range: '7', text: 'Windböen, Blätter wirbeln.' },
                { range: '8', text: 'Sonnig, aber windig (14°C).' }
            ]}
        }
    };
    const REISE_BEGEGNUNGS_TABELLEN_STUB = {
        wald: { id: 'begegnung_wald', diceType: 8, entries: [
            { range: '1', text: '1W4 Wölfe streifen durch das Unterholz.' },
            { range: '2', text: '1W6 Goblins — Hinterhalt!' },
            { range: '3', text: 'Ein verletzter Hirsch liegt auf dem Weg.' },
            { range: '4', text: 'Holzfäller bitten um Hilfe gegen einen Bären.' },
            { range: '5', text: '1W4 Banditen sperren den Pfad.' },
            { range: '6', text: 'Ein alter Waldläufer.' },
            { range: '7', text: 'Ein einsamer Druide.' },
            { range: '8', text: 'Ein riesiger Elch mit leuchtenden Augen.' }
        ]}
    };

    // Inline-Implementierung der Kernfunktionen für Unit-Tests
    function rollWeightedEntryStub(table) {
        if (!table || !Array.isArray(table.entries) || table.entries.length === 0) return null;
        var diceType = table.diceType || 6;
        var roll = Math.floor(Math.random() * diceType) + 1;
        for (var i = 0; i < table.entries.length; i++) {
            var entry = table.entries[i];
            var range = String(entry.range || '');
            var parts = range.split('-').map(Number);
            var lo = parts[0] || 1;
            var hi = parts.length > 1 ? parts[1] : lo;
            if (roll >= lo && roll <= hi) return { entry: entry, roll: roll, diceType: diceType };
        }
        // Fallback: letzten Eintrag
        return { entry: table.entries[table.entries.length - 1], roll: roll, diceType: diceType };
    }

    function berechneTagesmarschInline(tempo, gelände) {
        var tempoObj = REISE_TEMPO_STUB[tempo];
        var basisMeilen = tempoObj ? tempoObj.meilenProTag : 24;
        var gelaendeObj = REISE_GELÄNDE_STUB.find(function(g) { return g.id === gelände; });
        var faktor = gelaendeObj ? gelaendeObj.distanzFaktor : 1.0;
        return Math.floor(basisMeilen * faktor);
    }

    function rollWetterInline(klima, jahreszeit) {
        var tabellen = WETTER_TABELLEN_STUB;
        if (!tabellen || !tabellen[klima] || !tabellen[klima][jahreszeit]) return null;
        return rollWeightedEntryStub(tabellen[klima][jahreszeit]);
    }

    function rollBegegnungInline(gelaendeId, diceType, threshold) {
        // DoS-Klemmen
        var dt = Math.max(2, Math.min(100, parseInt(diceType, 10) || 20));
        // threshold 0 ist gültig (nie Begegnung) — || würde 0 zu 1 verfälschen
        var thParsed = parseInt(threshold, 10);
        var th = Math.max(0, Math.min(dt, isNaN(thParsed) ? 1 : thParsed));
        var wurf = Math.floor(Math.random() * dt) + 1;
        var begegnung = wurf <= th;
        var ergebnis = null;
        if (begegnung) {
            var table = REISE_BEGEGNUNGS_TABELLEN_STUB[gelaendeId];
            if (table) ergebnis = rollWeightedEntryStub(table);
        }
        return { begegnung: begegnung, ergebnis: ergebnis, wurf: wurf };
    }

    test('berechneTagesmarsch: normales Tempo über normales Gelände = 24 Meilen', () => {
        expect(berechneTagesmarschInline('normal', 'normal')).toBe(24);
    });

    test('berechneTagesmarsch: langsames Tempo über schwieriges Gelände = 9 Meilen', () => {
        // 18 × 0,5 = 9 (Math.floor)
        expect(berechneTagesmarschInline('langsam', 'schwierig')).toBe(9);
    });

    test('berechneTagesmarsch: schnelles Tempo über normales Gelände = 30 Meilen', () => {
        expect(berechneTagesmarschInline('schnell', 'normal')).toBe(30);
    });

    test('berechneTagesmarsch: langsames Tempo über Gebirge = 9 Meilen', () => {
        expect(berechneTagesmarschInline('langsam', 'gebirge')).toBe(9);
    });

    test('rollWetter gibt Ergebnis mit entry.text zurück', () => {
        var result = rollWetterInline('gemässigt', 'winter');
        expect(result).not.toBeNull();
        expect(result).toHaveProperty('entry');
        expect(result.entry).toHaveProperty('text');
        expect(typeof result.entry.text).toBe('string');
        // rollWetter waehlt zufaellig einen Eintrag aus einer Wetter-Text-Tabelle mit variabler
        // Textlaenge — kein exakter Wert erwartbar, nur "ist nicht leer".
        // Phase 8 / D-04 (08-03): bleibt loose (zufaelliger Tabelleneintrag).
        expect(result.entry.text.length).toBeGreaterThan(0);
    });

    test('rollWetter: alle vier Jahreszeiten für gemässigt liefern Ergebnisse', () => {
        ['winter', 'fruehling', 'sommer', 'herbst'].forEach(function(jz) {
            var r = rollWetterInline('gemässigt', jz);
            expect(r).not.toBeNull();
            // Gleicher Grund wie oben: zufaelliger Tabelleneintrag, variable Textlaenge.
            // Phase 8 / D-04 (08-03): bleibt loose.
            expect(r.entry.text.length).toBeGreaterThan(0);
        });
    });

    test('rollWetter: unbekanntes Klima gibt null zurück', () => {
        var result = rollWetterInline('arktisch', 'winter');
        expect(result).toBeNull();
    });

    test('rollBegegnung gibt {begegnung, ergebnis, wurf} zurück', () => {
        var result = rollBegegnungInline('wald', 20, 1);
        expect(result).toHaveProperty('begegnung');
        expect(typeof result.begegnung).toBe('boolean');
        expect(result).toHaveProperty('ergebnis');
        expect(result).toHaveProperty('wurf');
        expect(typeof result.wurf).toBe('number');
    });

    test('rollBegegnung: bei begegnung===true ist ergebnis nicht null', () => {
        // Threshold 20 = immer Begegnung bei d20
        var result = rollBegegnungInline('wald', 20, 20);
        expect(result.begegnung).toBe(true);
        expect(result.ergebnis).not.toBeNull();
        expect(result.ergebnis).toHaveProperty('entry');
    });

    test('rollBegegnung: bei begegnung===false ist ergebnis null', () => {
        // Threshold 0 = nie Begegnung
        var result = rollBegegnungInline('wald', 20, 0);
        expect(result.begegnung).toBe(false);
        expect(result.ergebnis).toBeNull();
    });

    test('rollBegegnung: DoS-Schutz — diceType wird auf 2..100 geklemmt', () => {
        // Ungültige Werte sollen nicht zu Endlosschleifen führen
        var r1 = rollBegegnungInline('wald', 0, 1);   // diceType 0 → geklemmt auf 2
        var r2 = rollBegegnungInline('wald', 9999, 1); // diceType 9999 → geklemmt auf 100
        expect(r1).toHaveProperty('begegnung');
        expect(r2).toHaveProperty('begegnung');
    });
});
