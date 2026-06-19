/**
 * Unit Tests — Wuerfel-Statistiken (Phase 7 — UX-02)
 *
 * Aktiviert in 07-04 (ersetzt test.todo durch echte Assertions).
 *
 * Abgedeckte Anforderungen:
 *   UX-02c — Histogramm hat 20 Balken (faces 1–20)
 *   UX-02d — Expected-Overlay bei korrekter Hoehe (5 % pro Face)
 *   UX-02e — Crit(20)-Rate = aktueller %-Anteil der 20er
 *   UX-02f — Fumble(1)-Rate = aktueller %-Anteil der 1er
 *   UX-02g — "Diese Session"-Filter zeigt nur aktuelle Session
 *   UX-02h — Per-Character-Breakdown: unbekannte Wuerfe unter "Allgemein"
 */

// ---- Inline-Implementierungen der Pure Helpers ----
// (kein DOM, kein window -- identisch zu dice-stats-render.js)

function computeD20Counts(records) {
    var counts = new Array(20).fill(0);
    if (!Array.isArray(records)) return counts;
    records.forEach(function(r) {
        if (!r.rolls || !Array.isArray(r.rolls)) return;
        var notation = (r.notation || '').toString();
        var isD20 = notation.includes('d20') || notation.includes('D20')
            || notation === 'Vorteil' || notation === 'Nachteil';
        if (!isD20) return;
        r.rolls.forEach(function(face) {
            if (typeof face === 'number' && face >= 1 && face <= 20) {
                counts[face - 1]++;
            }
        });
    });
    return counts;
}

function expectedPerFace(total) {
    return total / 20;
}

function critFumbleRates(counts) {
    if (!Array.isArray(counts) || counts.length < 20) {
        return { critPct: 0, fumblePct: 0, total: 0 };
    }
    var total = counts.reduce(function(a, b) { return a + b; }, 0);
    if (total === 0) return { critPct: 0, fumblePct: 0, total: 0 };
    return {
        critPct: (counts[19] / total) * 100,
        fumblePct: (counts[0] / total) * 100,
        total: total
    };
}

function filterBySession(records, sessionId) {
    if (!Array.isArray(records)) return [];
    return records.filter(function(r) { return r.sessionId === sessionId; });
}

function parseCharFromNotation(notation, characters) {
    if (!notation || typeof notation !== 'string') return 'Allgemein';
    var chars = Array.isArray(characters) ? characters : [];
    var colonIdx = notation.indexOf(': ');
    if (colonIdx > 0) {
        var prefix = notation.substring(0, colonIdx);
        for (var i = 0; i < chars.length; i++) {
            if (chars[i].name && chars[i].name === prefix) return chars[i].name;
        }
    }
    if (notation.endsWith(' Init')) {
        var namePart = notation.slice(0, -5);
        for (var j = 0; j < chars.length; j++) {
            if (chars[j].name && chars[j].name === namePart) return chars[j].name;
        }
    }
    return 'Allgemein';
}

function attributeRolls(records, characters) {
    var result = new Map();
    if (!Array.isArray(records)) return result;
    records.forEach(function(r) {
        var name = parseCharFromNotation(r.notation, characters);
        if (!result.has(name)) result.set(name, []);
        result.get(name).push(r);
    });
    return result;
}

function renderD20Histogram(counts) {
    if (!Array.isArray(counts) || counts.length < 20) counts = new Array(20).fill(0);
    var total = counts.reduce(function(a, b) { return a + b; }, 0);
    var maxCount = Math.max.apply(null, counts.concat([1]));
    var W = 440, H = 180;
    var PAD = { top: 10, bottom: 30, left: 30, right: 10 };
    var innerW = W - PAD.left - PAD.right;
    var innerH = H - PAD.top - PAD.bottom;
    var barW = innerW / 20;
    var expected = total > 0 ? total / 20 : 0;
    var bars = '';
    for (var i = 0; i < 20; i++) {
        var face = i + 1;
        var barH = total > 0 ? (counts[i] / maxCount) * innerH : 0;
        var x = PAD.left + i * barW;
        var y = H - PAD.bottom - barH;
        var fill = face === 1 ? 'var(--red)' : face === 20 ? 'var(--green)' : 'var(--blue)';
        bars += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '"'
            + ' width="' + (barW - 1).toFixed(1) + '" height="' + barH.toFixed(1) + '"'
            + ' fill="' + fill + '" opacity="0.8"/>';
        bars += '<text x="' + (x + barW / 2).toFixed(1) + '" y="' + (H - PAD.bottom + 12) + '"'
            + ' text-anchor="middle" font-size="8" fill="var(--text-dim)">' + face + '</text>';
    }
    var overlayLine = '';
    if (total > 0) {
        var expectedY = H - PAD.bottom - (expected / maxCount) * innerH;
        overlayLine = '<line x1="' + PAD.left + '" y1="' + expectedY.toFixed(1) + '"'
            + ' x2="' + (W - PAD.right) + '" y2="' + expectedY.toFixed(1) + '"'
            + ' stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="4,2"'
            + ' class="ds-expected-line"/>';
    }
    return '<svg width="100%" viewBox="0 0 ' + W + ' ' + H + '"'
        + ' xmlns="http://www.w3.org/2000/svg" role="img" aria-label="d20-Wuerfelverteilung">'
        + bars + overlayLine + '</svg>';
}

// ---- Helper: Build mock records ----
function makeRecord(notation, rolls, sessionId) {
    return { notation: notation, result: rolls[0], rolls: rolls, sessionId: sessionId || 'S1', timestamp: Date.now() };
}

// ============================================================
// TESTS
// ============================================================

describe('Wuerfel-Statistiken — computeD20Counts / renderD20Histogram', function () {

    test('histogram 20 bars', function () {
        // UX-02c: renderD20Histogram(counts) erzeugt SVG mit genau 20 <rect>-Elementen.
        var counts = new Array(20).fill(5);
        var svg = renderD20Histogram(counts);
        var matches = svg.match(/<rect/g);
        expect(matches).not.toBeNull();
        expect(matches.length).toBe(20);
    });

    test('expected overlay', function () {
        // UX-02d: Bei 20 Wuerfen (1 pro Face) liegt expected = 1.0 (= total/20).
        // Die Overlay-Linie muss im SVG vorhanden sein.
        var counts = new Array(20).fill(1); // 20 Wuerfe, je 1 pro Face
        var svg = renderD20Histogram(counts);
        // Overlay-Linie vorhanden
        expect(svg).toContain('<line');
        expect(svg).toContain('class="ds-expected-line"');
        // expectedPerFace(20) = 1.0
        expect(expectedPerFace(20)).toBeCloseTo(1.0, 5);
        // Bei 100 gleichverteilten Wuerfen (5 pro Face): expected = 5
        expect(expectedPerFace(100)).toBeCloseTo(5.0, 5);
        // Kein Overlay bei total=0
        var emptySvg = renderD20Histogram(new Array(20).fill(0));
        expect(emptySvg).not.toContain('<line');
    });
});

describe('Wuerfel-Statistiken — Crit/Fumble-Rate', function () {

    test('crit rate', function () {
        // UX-02e: critPct = (Anzahl 20er / gesamt) * 100
        var counts = new Array(20).fill(0);
        counts[19] = 10; // 10 Crits
        counts[0] = 5;   // 5 Fumbles
        // total = 15
        var rates = critFumbleRates(counts);
        expect(rates.total).toBe(15);
        expect(rates.critPct).toBeCloseTo((10 / 15) * 100, 5);
        // Kein NaN
        expect(Number.isNaN(rates.critPct)).toBe(false);
        // Bei total=0: 0 (nicht NaN)
        var zero = critFumbleRates(new Array(20).fill(0));
        expect(zero.critPct).toBe(0);
        expect(Number.isNaN(zero.critPct)).toBe(false);
    });

    test('fumble rate', function () {
        // UX-02f: fumblePct = (Anzahl 1er / gesamt) * 100
        var counts = new Array(20).fill(0);
        counts[0] = 3; // 3 Fumbles
        counts[19] = 7; // 7 Crits
        // total = 10
        var rates = critFumbleRates(counts);
        expect(rates.fumblePct).toBeCloseTo(30, 5);
        expect(Number.isNaN(rates.fumblePct)).toBe(false);
        // Bei total=0: 0 (nicht NaN)
        var zero = critFumbleRates(new Array(20).fill(0));
        expect(zero.fumblePct).toBe(0);
        expect(Number.isNaN(zero.fumblePct)).toBe(false);
    });
});

describe('Wuerfel-Statistiken — Session-Filter', function () {

    test('session filter', function () {
        // UX-02g: filterBySession(records, sessionId) liefert nur Records mit passendem sessionId.
        var recs = [
            makeRecord('1d20', [15], 'A'),
            makeRecord('1d20', [3], 'A'),
            makeRecord('1d20', [18], 'A'),
            makeRecord('1d20', [7], 'B'),
            makeRecord('1d20', [12], 'B'),
        ];
        var filtered = filterBySession(recs, 'A');
        expect(filtered.length).toBe(3);
        filtered.forEach(function(r) { expect(r.sessionId).toBe('A'); });

        var filteredB = filterBySession(recs, 'B');
        expect(filteredB.length).toBe(2);

        // Leeres Array bei unbekannter Session
        expect(filterBySession(recs, 'X').length).toBe(0);
    });
});

describe('Wuerfel-Statistiken — Character-Breakdown', function () {

    test('character breakdown', function () {
        // UX-02h: attributeRolls gruppiert nach Character-Namen.
        //         null-prefix oder unbekannter Name → "Allgemein"-Bucket.
        var chars = [
            { id: 1, name: 'Thorin' },
            { id: 2, name: 'Gandalf' }
        ];
        var recs = [
            makeRecord('Thorin: STR', [12], 'S1'),
            makeRecord('Thorin: STR Save', [8], 'S1'),
            makeRecord('Gandalf: WIS', [17], 'S1'),
            makeRecord('1d20', [5], 'S1'),    // kein Prefix => Allgemein
            makeRecord('Vorteil', [14, 19], 'S1'), // kein Character-Prefix => Allgemein
        ];
        var buckets = attributeRolls(recs, chars);
        expect(buckets.has('Thorin')).toBe(true);
        expect(buckets.get('Thorin').length).toBe(2);
        expect(buckets.has('Gandalf')).toBe(true);
        expect(buckets.get('Gandalf').length).toBe(1);
        expect(buckets.has('Allgemein')).toBe(true);
        expect(buckets.get('Allgemein').length).toBe(2);

        // Unbekannter Name → Allgemein
        var recs2 = [makeRecord('Bilbo: DEX', [10], 'S1')]; // Bilbo nicht in chars
        var b2 = attributeRolls(recs2, chars);
        expect(b2.has('Allgemein')).toBe(true);
        expect(b2.has('Bilbo')).toBe(false);
    });
});
