// [SECTION:REISE_RENDER]
// Reise- & Wetter-Simulator — Render-Modul (WELT-04)
// Implementiert: Plan 05-06
// ============================================================
// Globals: window.D, esc, REISE_TEMPO, REISE_GELÄNDE, WETTER_TABELLEN

/**
 * Rendert die Reise-Simulator-Ansicht mit Konfigurationsformular.
 * Befüllt #reise-content innerhalb von #view-reise.
 */
function renderReise() {
    var section = document.getElementById('view-reise');
    if (!section) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderReise] #view-reise fehlt — nicht auf reise-Tab');
        }
        return;
    }
    // Ziel: #reise-content (im HTML-Skelett definiert)
    var container = document.getElementById('reise-content') || section;

    var d = window.D;
    var cal = d && d.calendar;
    var monat = cal ? (parseInt(cal.month, 10) || 1) : 1;
    var jahreszeit = typeof window.jahreszeitAusDatum === 'function'
        ? window.jahreszeitAusDatum(monat)
        : 'fruehling';

    // Gelände-Optionen aus REISE_GELÄNDE
    var gelaendeArr = window.REISE_GELÄNDE || [
        { id: 'normal',    label: 'Normal' },
        { id: 'schwierig', label: 'Schwieriges Gelaende' },
        { id: 'gebirge',   label: 'Gebirge' },
        { id: 'sumpf',     label: 'Sumpf' },
        { id: 'meer',      label: 'Schiff/Meer' }
    ];
    var gelaendeOptions = gelaendeArr.map(function(g) {
        return '<option value="' + esc(g.id) + '">' + esc(g.label) + '</option>';
    }).join('');

    // Tempo-Optionen aus REISE_TEMPO
    var tempoMap = window.REISE_TEMPO || {
        langsam: { label: 'Langsam', meilenProTag: 18 },
        normal:  { label: 'Normal',  meilenProTag: 24 },
        schnell: { label: 'Schnell', meilenProTag: 30 }
    };
    var tempoKeys = ['langsam', 'normal', 'schnell'];
    var tempoOptions = tempoKeys.map(function(key) {
        var t = tempoMap[key] || {};
        return '<option value="' + esc(key) + '"' + (key === 'normal' ? ' selected' : '') + '>'
            + esc(t.label || key) + ' (' + (t.meilenProTag || '?') + ' Meilen/Tag)</option>';
    }).join('');

    // Klima-Optionen aus WETTER_TABELLEN
    var wetterTabellen = window.WETTER_TABELLEN || {};
    var klimaKeys = Object.keys(wetterTabellen);
    if (klimaKeys.length === 0) klimaKeys = ['gemäßigt'];
    var klimaOptions = klimaKeys.map(function(k) {
        return '<option value="' + esc(k) + '">' + esc(k) + '</option>';
    }).join('');

    // Begegnungs-Würfel-Optionen
    var diceOptions = [4, 6, 8, 10, 12, 20].map(function(v) {
        return '<option value="' + v + '"' + (v === 20 ? ' selected' : '') + '>W' + v + '</option>';
    }).join('');

    var html = '';

    // Konfigurationsformular
    html += '<div class="rs-config-panel">';
    html += '<h3 class="rs-config-title">&#x1F9ED; Reise konfigurieren</h3>';

    // Zeile 1: Tempo, Gelände, Tage
    html += '<div class="rs-config-row">';
    html += '<div class="rs-config-field">';
    html += '<label class="rs-label" for="rs-tempo">Reisetempo</label>';
    html += '<select id="rs-tempo" class="form-select">' + tempoOptions + '</select>';
    html += '</div>';
    html += '<div class="rs-config-field">';
    html += '<label class="rs-label" for="rs-gelaende">Gelände</label>';
    html += '<select id="rs-gelaende" class="form-select">' + gelaendeOptions + '</select>';
    html += '</div>';
    html += '<div class="rs-config-field rs-config-field-sm">';
    html += '<label class="rs-label" for="rs-tage">Reisetage</label>';
    html += '<input type="number" id="rs-tage" class="form-input" value="1" min="1" max="365" step="1" />';
    html += '</div>';
    html += '</div>';

    // Zeile 2: Klima, Begegnungswürfel, Schwellenwert
    html += '<div class="rs-config-row">';
    html += '<div class="rs-config-field">';
    html += '<label class="rs-label" for="rs-klima">Klima (Wetter)</label>';
    html += '<select id="rs-klima" class="form-select">' + klimaOptions + '</select>';
    html += '</div>';
    html += '<div class="rs-config-field rs-config-field-sm">';
    html += '<label class="rs-label" for="rs-dice-type">Begegnungswürfel</label>';
    html += '<select id="rs-dice-type" class="form-select">' + diceOptions + '</select>';
    html += '</div>';
    html += '<div class="rs-config-field rs-config-field-sm">';
    html += '<label class="rs-label" for="rs-threshold">Begegnung bei Wurf ≤</label>';
    html += '<input type="number" id="rs-threshold" class="form-input" value="1" min="0" max="20" step="1" />';
    html += '</div>';
    html += '</div>';

    // Info-Zeile: aktuelle Jahreszeit
    html += '<div class="rs-config-info">';
    html += '&#x1F4C5; Aktuelle Jahreszeit: <strong>' + esc(jahreszeit) + '</strong>';
    html += ' (Monat ' + monat + ', aus Harptos-Kalender)';
    html += '</div>';

    // Aktion
    html += '<div class="rs-config-actions">';
    html += '<button class="btn btn-primary" data-action="start-reise">&#x1F3B2; Reise simulieren</button>';
    html += '</div>';
    html += '</div>'; // rs-config-panel

    // Ergebnisbereich (wird von startReise() befüllt)
    html += '<div id="rs-ergebnis"></div>';

    container.innerHTML = html;
}

window.renderReise = renderReise;
