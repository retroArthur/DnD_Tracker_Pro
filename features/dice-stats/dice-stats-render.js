// [SECTION:DICE_STATS_RENDER]
// Render-Funktionen fuer Wuerfel-Statistiken-Tab (Phase 7 — UX-02)
// Histogramm (SVG), Crit/Fumble-Quote, Session-Filter, Character-Breakdown.

// ============================================================
// MODULE-LEVEL FILTER STATE
// ============================================================

// 'session' = nur aktuelle Session; 'total' = alle Wuerfe
var _statsScope = 'session';

// ============================================================
// PURE AGGREGATION HELPERS (unit-testable, no DOM dependency)
// ============================================================

/**
 * computeD20Counts — baut Array(20) mit Trefferhaeufigkeiten fuer Faces 1–20.
 * Beruecksichtigt nur Records, deren notation auf d20 hinweist.
 * RESEARCH § "Computing d20 Histogram Counts"
 *
 * @param {Array} records  - IDB diceStats records
 * @returns {number[]}     - Array der Laenge 20; Index i = Anzahl Face (i+1)
 */
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

/**
 * expectedPerFace — erwartete Haeufigkeit pro Face bei Gleichverteilung.
 * @param {number} total - Gesamtanzahl d20-Wuerfe
 * @returns {number}
 */
function expectedPerFace(total) {
    return total / 20;
}

/**
 * critFumbleRates — berechnet Crit(20)- und Fumble(1)-Rate.
 * Gibt { critPct, fumblePct, total } zurueck.
 * Bei total=0 werden 0 (nicht NaN) zurueckgegeben (T-07-STATS-EMPTY).
 *
 * @param {number[]} counts - Array(20) aus computeD20Counts
 * @returns {{ critPct: number, fumblePct: number, total: number }}
 */
function critFumbleRates(counts) {
    if (!Array.isArray(counts) || counts.length < 20) {
        return { critPct: 0, fumblePct: 0, total: 0 };
    }
    var total = counts.reduce(function(a, b) { return a + b; }, 0);
    if (total === 0) {
        return { critPct: 0, fumblePct: 0, total: 0 };
    }
    var critPct = (counts[19] / total) * 100;
    var fumblePct = (counts[0] / total) * 100;
    return { critPct: critPct, fumblePct: fumblePct, total: total };
}

/**
 * filterBySession — gibt nur Records der angegebenen Session zurueck (pure function).
 * @param {Array} records
 * @param {string} sessionId
 * @returns {Array}
 */
function filterBySession(records, sessionId) {
    if (!Array.isArray(records)) return [];
    return records.filter(function(r) { return r.sessionId === sessionId; });
}

/**
 * parseCharFromNotation — parst Character-Namen aus dem Notation-Prefix "Name: ".
 * Gibt gematchten Character-Namen oder 'Allgemein' zurueck.
 *
 * Bekannte Formate (dice-core.js rollAttrCheck/rollCharSave/rollSkillCheck/rollCharInitiative):
 *   "Thorin: STR"    "Thorin: STR Save"   "Thorin: Heimlichkeit"  "Thorin Init"
 *
 * @param {string} notation
 * @param {Array}  characters - D.characters array
 * @returns {string}
 */
function parseCharFromNotation(notation, characters) {
    if (!notation || typeof notation !== 'string') return 'Allgemein';
    var chars = Array.isArray(characters) ? characters : [];

    // Pattern 1: "Name: …" prefix (rollAttrCheck, rollCharSave, rollSkillCheck)
    var colonIdx = notation.indexOf(': ');
    if (colonIdx > 0) {
        var prefix = notation.substring(0, colonIdx);
        for (var i = 0; i < chars.length; i++) {
            if (chars[i].name && chars[i].name === prefix) {
                return chars[i].name;
            }
        }
    }

    // Pattern 2: "Name Init" suffix (rollCharInitiative)
    if (notation.endsWith(' Init')) {
        var namePart = notation.slice(0, -5); // remove " Init"
        for (var j = 0; j < chars.length; j++) {
            if (chars[j].name && chars[j].name === namePart) {
                return chars[j].name;
            }
        }
    }

    return 'Allgemein';
}

/**
 * attributeRolls — gruppiert Records nach Character-Namen.
 * Nicht zuordenbare Records landen im 'Allgemein'-Bucket.
 *
 * @param {Array} records
 * @param {Array} characters - D.characters array
 * @returns {Map<string, Array>}
 */
function attributeRolls(records, characters) {
    var result = new Map();
    if (!Array.isArray(records)) return result;
    records.forEach(function(r) {
        var name = parseCharFromNotation(r.notation, characters);
        if (!result.has(name)) {
            result.set(name, []);
        }
        result.get(name).push(r);
    });
    return result;
}

/**
 * renderD20Histogram — erzeugt SVG-String mit 20 <rect>-Balken + Expected-Overlay-Linie.
 * Face 1 = Fumble (var(--red)), Face 20 = Crit (var(--green)), Rest var(--blue).
 * Expected-Overlay: gestrichelte Linie bei expected height (var(--gold)), nur wenn total>0.
 * KEIN User-HTML im SVG — nur numerische Face-Labels (T-07-NOTATION-XSS sicher).
 *
 * @param {number[]} counts - Array(20) aus computeD20Counts
 * @returns {string}        - SVG-String
 */
function renderD20Histogram(counts) {
    if (!Array.isArray(counts) || counts.length < 20) {
        counts = new Array(20).fill(0);
    }
    var total = counts.reduce(function(a, b) { return a + b; }, 0);
    var maxCount = Math.max.apply(null, counts.concat([1]));

    var W = 440;
    var H = 180;
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
        // Face label — purely numeric, no user data
        bars += '<text x="' + (x + barW / 2).toFixed(1) + '" y="' + (H - PAD.bottom + 12) + '"'
            + ' text-anchor="middle" font-size="8" fill="var(--text-dim)">' + face + '</text>';
    }

    // Expected-Overlay-Linie (gestrichelt, var(--gold)), nur bei total>0
    var overlayLine = '';
    if (total > 0) {
        var expectedY = H - PAD.bottom - (expected / maxCount) * innerH;
        overlayLine = '<line x1="' + PAD.left + '" y1="' + expectedY.toFixed(1) + '"'
            + ' x2="' + (W - PAD.right) + '" y2="' + expectedY.toFixed(1) + '"'
            + ' stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="4,2"'
            + ' class="ds-expected-line"/>';
    }

    // Y-Achsen-Beschriftung (0 und max)
    var yAxis = '';
    yAxis += '<text x="' + (PAD.left - 4) + '" y="' + (H - PAD.bottom) + '"'
        + ' text-anchor="end" font-size="7" fill="var(--text-dim)">0</text>';
    if (total > 0) {
        yAxis += '<text x="' + (PAD.left - 4) + '" y="' + (PAD.top + 4) + '"'
            + ' text-anchor="end" font-size="7" fill="var(--text-dim)">' + maxCount + '</text>';
    }

    return '<svg width="100%" viewBox="0 0 ' + W + ' ' + H + '"'
        + ' xmlns="http://www.w3.org/2000/svg"'
        + ' role="img" aria-label="d20-Wuerfelverteilung" class="ds-histogram-svg">'
        + bars + overlayLine + yAxis
        + '</svg>';
}

// ============================================================
// MAIN RENDER FUNCTION
// ============================================================

/**
 * renderDiceStats — rendert Histogramm, Crit/Fumble-Quote, Session-Filter,
 * Per-Character-Breakdown in #dicestats-container.
 * Defensiver Container-Guard (TAB_RENDER_REGISTRY pattern).
 */
function renderDiceStats() {
    var c = $('dicestats-container');
    if (!c) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderDiceStats] Container #dicestats-container nicht gefunden — nicht auf Statistiken-Tab?');
        }
        return;
    }

    // Lade-State sofort anzeigen (async query folgt)
    c.innerHTML = '<p class="ds-loading" style="color:var(--text-dim);text-align:center;padding:2rem;">Lade Statistiken…</p>';

    // Async IDB-Abfrage
    var queryFn = (_statsScope === 'session' && typeof window.getStatsForSession === 'function')
        ? window.getStatsForSession(window._currentSessionId || 'default')
        : (typeof window.getAllStats === 'function'
            ? window.getAllStats()
            : Promise.resolve([]));

    Promise.resolve(queryFn).then(function(records) {
        _renderDiceStatsContent(c, records || []);
    }).catch(function() {
        _renderDiceStatsContent(c, []);
    });
}

/**
 * _renderDiceStatsContent — baut das vollstaendige HTML nach IDB-Abfrage.
 * @param {HTMLElement} container
 * @param {Array} records
 */
function _renderDiceStatsContent(container, records) {
    var counts = computeD20Counts(records);
    var rates = critFumbleRates(counts);
    var chars = (window.D && Array.isArray(window.D.characters)) ? window.D.characters : [];

    // Segmented Toggle
    var sessionActive = _statsScope === 'session' ? ' ds-toggle-btn--active' : '';
    var totalActive = _statsScope === 'total' ? ' ds-toggle-btn--active' : '';

    var toggleHtml = '<div class="ds-toggle-bar">'
        + '<button class="ds-toggle-btn' + sessionActive + '"'
        + ' data-action="set-stats-scope" data-value="session">Diese Session</button>'
        + '<button class="ds-toggle-btn' + totalActive + '"'
        + ' data-action="set-stats-scope" data-value="total">Gesamt</button>'
        + '</div>';

    // Histogram
    var histSvg = renderD20Histogram(counts);
    var noRollsNote = records.length === 0
        ? '<p class="ds-no-data">Noch keine Wuerfelwuerfe in dieser Session. Wuerfel ein paar d20!</p>'
        : '';

    // Expected note
    var expectedNote = '';
    if (rates.total > 0) {
        expectedNote = '<p class="ds-expected-note"><span class="ds-legend-gold">&#9135;</span>'
            + ' Erwartungswert: ' + expectedPerFace(rates.total).toFixed(1) + 'x pro Face (5&nbsp;%)</p>';
    }

    // Crit / Fumble
    var ratesHtml = '<div class="ds-rates-row">'
        + '<span class="ds-rate-chip ds-crit">&#9733; Crit (20): '
        + rates.critPct.toFixed(1) + '&nbsp;%</span>'
        + '<span class="ds-rate-chip ds-fumble">&#128128; Fumble (1): '
        + rates.fumblePct.toFixed(1) + '&nbsp;%</span>'
        + '<span class="ds-rate-total">Gesamt d20-Wuerfe: ' + rates.total + '</span>'
        + '</div>';

    // Per-Character Breakdown
    var breakdownHtml = '';
    var breakdown = attributeRolls(records, chars);
    if (breakdown.size > 0) {
        breakdownHtml = '<div class="ds-breakdown">'
            + '<h4 class="ds-breakdown-title">Aufschluesslung nach Charakter</h4>'
            + '<table class="ds-breakdown-table">'
            + '<thead><tr><th>Charakter</th><th>d20-Wuerfe</th><th>Crit</th><th>Fumble</th></tr></thead>'
            + '<tbody>';
        breakdown.forEach(function(recs, name) {
            var bCounts = computeD20Counts(recs);
            var bRates = critFumbleRates(bCounts);
            // esc() auf Character-Namen (T-07-NOTATION-XSS)
            var safeName = typeof esc === 'function' ? esc(name) : name;
            breakdownHtml += '<tr>'
                + '<td>' + safeName + '</td>'
                + '<td>' + bRates.total + '</td>'
                + '<td>' + bRates.critPct.toFixed(1) + '&nbsp;%</td>'
                + '<td>' + bRates.fumblePct.toFixed(1) + '&nbsp;%</td>'
                + '</tr>';
        });
        breakdownHtml += '</tbody></table></div>';
    }

    container.innerHTML = '<div class="ds-root">'
        + toggleHtml
        + '<div class="ds-histogram-wrap">' + histSvg + noRollsNote + expectedNote + '</div>'
        + ratesHtml
        + breakdownHtml
        + '</div>';
}

/**
 * _setStatsScope — setzt den Filter-Zustand und loest Re-Render aus.
 * Wird von system-actions.js 'set-stats-scope' aufgerufen.
 * @param {string} scope - 'session' | 'total'
 */
function _setStatsScope(scope) {
    if (scope === 'session' || scope === 'total') {
        _statsScope = scope;
        renderDiceStats();
    }
}

// ============================================================
// EXPORTS
// ============================================================

// Pure helpers — exported so unit tests can access them directly
window.computeD20Counts = computeD20Counts;
window.expectedPerFace = expectedPerFace;
window.critFumbleRates = critFumbleRates;
window.filterBySession = filterBySession;
window.parseCharFromNotation = parseCharFromNotation;
window.attributeRolls = attributeRolls;
window.renderD20Histogram = renderD20Histogram;

// Scope setter (called by system-actions 'set-stats-scope')
window._setStatsScope = _setStatsScope;

// Main render
window.renderDiceStats = renderDiceStats;
