// [SECTION:SESSION_PREP_RENDER]
// Session-Prep-Assistent — Render-Modul (WELT-01)
// Plan 05-03: Vollständige Implementierung
// ============================================================
// Verwendete Globals:
//   esc, sanitizeHTML, parseEntityLinks, sammleOffeneFaeden
//   $, safeRender (optional)
// CSS-Präfix: wp- (Welt-Prep)

var D = window.D;

// ============================================================
// HILFSFUNKTIONEN
// ============================================================

/**
 * Rendert den Inhalt einer Szene-Beschreibung sicher:
 * sanitizeHTML ZUERST, dann parseEntityLinks (sanitize-then-parse, T-05-10).
 * @param {string} text - Roher Rich-Text-Inhalt
 * @returns {string} Sicherer HTML-String mit geparsten Entity-Links
 */
function renderSzenenBeschreibung(text) {
    if (!text) return '';
    var sanitized = sanitizeHTML(text);
    if (typeof parseEntityLinks === 'function') {
        return parseEntityLinks(sanitized);
    }
    return sanitized;
}

/**
 * Formatiert ein Datum aus ISO-String oder Freitext für die Anzeige.
 * @param {string} datum
 * @returns {string}
 */
function formatPrepDatum(datum) {
    if (!datum) return '';
    return esc(datum);
}

// ============================================================
// LISTE RENDERN
// ============================================================

/**
 * Rendert die Session-Prep-Liste im View-Container #view-sessionprep.
 * Defensiver Container-Check; wird vom Tab-Registry aufgerufen.
 */
function renderSessionPrepList() {
    var container = $('sessionprep-content');
    if (!container) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderSessionPrepList] Container #sessionprep-content fehlt — nicht auf sessionprep-Tab');
        }
        return;
    }

    var daten = window.D;
    var preps = (daten && daten.sessionPreps) ? daten.sessionPreps : [];

    // Zähler aktualisieren
    var countEl = $('sessionprep-count');
    if (countEl) countEl.textContent = String(preps.length);

    if (preps.length === 0) {
        container.innerHTML = [
            '<div class="wp-empty-state">',
            '  <p>Noch keine Session-Vorbereitung angelegt.</p>',
            '  <p>Klicke auf <strong>+ Neue Session-Prep</strong>, um zu beginnen.</p>',
            '</div>'
        ].join('\n');
        return;
    }

    // Liste der Session-Preps rendern (neueste zuerst)
    var sorted = preps.slice().sort(function(a, b) { return (b.erstellt || 0) - (a.erstellt || 0); });

    var html = '<div class="wp-list" id="session-prep-list">';
    sorted.forEach(function(prep) {
        var sessionLabel = prep.sessionNr ? 'Session ' + esc(String(prep.sessionNr)) : '';
        var datumLabel = prep.datum ? formatPrepDatum(prep.datum) : '';
        var inGameLabel = prep.inGameDatum ? esc(prep.inGameDatum) : '';
        var faedenAnz = (prep.offeneFaeden || []).length;
        var szenenAnz = (prep.szenen || []).length;

        html += [
            '<div class="wp-card" id="session-prep-card-' + prep.id + '">',
            '  <div class="wp-card-header">',
            '    <div class="wp-card-title">',
            '      ' + (sessionLabel ? ('<span class="wp-session-nr">' + sessionLabel + '</span> ') : ''),
            '      ' + (datumLabel ? ('<span class="wp-datum">' + datumLabel + '</span>') : ''),
            '    </div>',
            '    <div class="wp-card-actions">',
            '      <button class="btn btn-sm" data-action="edit-session-prep" data-id="' + prep.id + '">✏️ Bearbeiten</button>',
            '      <button class="btn btn-sm btn-danger" data-action="delete-session-prep" data-id="' + prep.id + '">🗑️ Löschen</button>',
            '    </div>',
            '  </div>',
            '  <div class="wp-card-meta">',
            '    ' + (inGameLabel ? '<span class="wp-ingame-datum">📅 ' + inGameLabel + '</span>' : ''),
            '    <span class="wp-meta-tag">' + szenenAnz + ' Szene(n)</span>',
            '    <span class="wp-meta-tag">' + faedenAnz + ' Faden/Fäden</span>',
            '  </div>',
            '  <div class="wp-card-preview">',
            '    ' + (prep.strongStart ? '<div class="wp-strong-start-preview">' + sanitizeHTML(prep.strongStart).substring(0, 120) + '…</div>' : ''),
            '  </div>',
            '</div>'
        ].join('\n');
    });
    html += '</div>';

    container.innerHTML = html;
}

// ============================================================
// MODAL: Session-Prep-Formular mit 5 Lazy-DM-Abschnitten
// ============================================================

/**
 * Öffnet das Session-Prep-Modal zum Anlegen oder Bearbeiten.
 * @param {Object|null} prep - Bestehender Eintrag (Edit) oder null (Neu)
 */
function showSessionPrepModal(prep) {
    // Vorhandene Fäden-Vorschläge sammeln
    var vorschlaege = [];
    if (typeof sammleOffeneFaeden === 'function') {
        vorschlaege = sammleOffeneFaeden();
    }

    var isEdit = prep && prep.id;

    // Szenen-HTML generieren
    var szenenHtml = '';
    var szenen = (prep && prep.szenen) ? prep.szenen : [{ id: 1, titel: '', beschreibung: '', ort: '' }];
    szenen.forEach(function(szene, idx) {
        szenenHtml += renderSzeneFormular(szene, idx);
    });

    // Offene-Fäden-HTML: Auto-Vorschläge als Badges + Manuelleingabe
    var faedenHtml = '';
    // Vorhandene Fäden (beim Bearbeiten) oder Vorschläge (beim Anlegen)
    var faedenQuellen = (prep && prep.offeneFaeden && prep.offeneFaeden.length > 0)
        ? prep.offeneFaeden
        : vorschlaege;

    faedenQuellen.forEach(function(faden) {
        faedenHtml += [
            '<div class="wp-faden-item">',
            '  <input type="hidden" class="wp-faden-quelle-id" value="' + (faden.quelleId || '') + '">',
            '  <input type="hidden" class="wp-faden-quelle-typ" value="' + esc(faden.quelleTyp || 'manual') + '">',
            '  <input type="text" class="wp-faden-text form-control" value="' + esc(faden.text || '') + '" placeholder="Offener Faden…">',
            '  <button type="button" class="btn btn-sm wp-faden-remove-btn" data-action="remove-faden" title="Entfernen">×</button>',
            '</div>'
        ].join('\n');
    });

    var modalHtml = [
        '<div id="session-prep-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="prep-modal-title">',
        '  <div class="modal-content modal-large">',
        '    <div class="modal-header">',
        '      <h2 id="prep-modal-title">' + (isEdit ? 'Session-Prep bearbeiten' : 'Neue Session-Prep') + '</h2>',
        '      <button class="modal-close" data-action="close-modal" data-value="session-prep-modal" aria-label="Schließen">×</button>',
        '    </div>',
        '    <div class="modal-body">',
        '      <input type="hidden" id="prep-edit-id" value="' + (isEdit ? esc(String(prep.id)) : '') + '">',
        '',
        '      <!-- Meta-Felder -->',
        '      <div class="wp-form-row">',
        '        <div class="wp-form-col">',
        '          <label for="prep-session-nr" class="form-label">Session-Nr.</label>',
        '          <input type="number" id="prep-session-nr" class="form-control" min="1"',
        '                 value="' + (prep && prep.sessionNr ? esc(String(prep.sessionNr)) : '') + '" placeholder="z.B. 12">',
        '        </div>',
        '        <div class="wp-form-col">',
        '          <label for="prep-datum" class="form-label">Real-Datum</label>',
        '          <input type="date" id="prep-datum" class="form-control"',
        '                 value="' + (prep && prep.datum ? esc(prep.datum) : '') + '">',
        '        </div>',
        '        <div class="wp-form-col">',
        '          <label for="prep-ingame-datum" class="form-label">In-Game-Datum</label>',
        '          <input type="text" id="prep-ingame-datum" class="form-control"',
        '                 value="' + (prep && prep.inGameDatum ? esc(prep.inGameDatum) : '') + '"',
        '                 placeholder="z.B. 15 Hammer 1492 DR">',
        '        </div>',
        '      </div>',
        '',
        '      <!-- ABSCHNITT 1: Strong Start -->',
        '      <div class="wp-section">',
        '        <div class="wp-section-header">',
        '          <span class="wp-section-icon">⚡</span>',
        '          <h3 class="wp-section-title">Strong Start</h3>',
        '          <span class="wp-section-hint">Einstieg in medias res — was passiert in der ersten Minute?</span>',
        '        </div>',
        '        <div id="prep-strong-start" class="wp-rich-editor" contenteditable="true" data-placeholder="Beschreibe den packenden Einstieg der Session…">',
        '          ' + (prep && prep.strongStart ? sanitizeHTML(prep.strongStart) : ''),
        '        </div>',
        '      </div>',
        '',
        '      <!-- ABSCHNITT 2: Geplante Szenen -->',
        '      <div class="wp-section">',
        '        <div class="wp-section-header">',
        '          <span class="wp-section-icon">🎭</span>',
        '          <h3 class="wp-section-title">Geplante Szenen</h3>',
        '          <span class="wp-section-hint">Szenenkarten mit Entity-Links zu NPCs/Orten/Encountern</span>',
        '          <button type="button" class="btn btn-sm" data-action="add-szene-card" id="prep-szenen">+ Szene hinzufügen</button>',
        '        </div>',
        '        <div id="prep-szenen-container" class="wp-szenen-container">',
        '          ' + szenenHtml,
        '        </div>',
        '      </div>',
        '',
        '      <!-- ABSCHNITT 3: Geheime Hinweise -->',
        '      <div class="wp-section">',
        '        <div class="wp-section-header">',
        '          <span class="wp-section-icon">🔍</span>',
        '          <h3 class="wp-section-title">Geheime Hinweise</h3>',
        '          <span class="wp-section-hint">Was sollen die Spieler herausfinden?</span>',
        '        </div>',
        '        <div id="prep-hinweise" class="wp-rich-editor" contenteditable="true" data-placeholder="Hinweise, die die Spieler aufdecken können…">',
        '          ' + (prep && prep.geheimeHinweise ? sanitizeHTML(prep.geheimeHinweise) : ''),
        '        </div>',
        '      </div>',
        '',
        '      <!-- ABSCHNITT 4: Wichtige NPCs -->',
        '      <div class="wp-section">',
        '        <div class="wp-section-header">',
        '          <span class="wp-section-icon">👥</span>',
        '          <h3 class="wp-section-title">Wichtige NPCs</h3>',
        '          <span class="wp-section-hint">Schlüssel-NPCs dieser Session (Entity-Links möglich)</span>',
        '        </div>',
        '        <div id="prep-npcs" class="wp-rich-editor" contenteditable="true" data-placeholder="z.B. [[npcs:1:Elara]] — führt die Gruppe zur Höhle…">',
        '          ' + (prep && prep.wichtigeNpcs ? sanitizeHTML(prep.wichtigeNpcs) : ''),
        '        </div>',
        '      </div>',
        '',
        '      <!-- ABSCHNITT 5: Mögliche Belohnungen -->',
        '      <div class="wp-section">',
        '        <div class="wp-section-header">',
        '          <span class="wp-section-icon">💰</span>',
        '          <h3 class="wp-section-title">Mögliche Belohnungen</h3>',
        '          <span class="wp-section-hint">XP, Gold, Gegenstände, Informationen</span>',
        '        </div>',
        '        <textarea id="prep-belohnungen" class="form-control wp-textarea" rows="3"',
        '                  placeholder="z.B. 500 XP, Schwert +1 im Versteck des Kultes…">' +
        (prep && prep.belohnungen ? esc(prep.belohnungen) : '') + '</textarea>',
        '      </div>',
        '',
        '      <!-- OFFENE FÄDEN (Auto-Vorschläge + Manuell) -->',
        '      <div class="wp-section">',
        '        <div class="wp-section-header">',
        '          <span class="wp-section-icon">🧵</span>',
        '          <h3 class="wp-section-title">Offene Fäden</h3>',
        '          <span class="wp-section-hint">Auto-vorgeschlagen aus offenen Quests &amp; Story-Arcs</span>',
        '        </div>',
        '        <div id="prep-faeden-container" class="wp-faeden-container">',
        '          ' + faedenHtml,
        '        </div>',
        '        <div class="wp-faeden-add-row">',
        '          <input type="text" id="prep-faeden-manuell" class="form-control" placeholder="Weiteren Faden manuell eingeben…">',
        '          <button type="button" class="btn btn-sm" data-action="add-faden-manual">+ Hinzufügen</button>',
        '        </div>',
        '      </div>',
        '',
        '    </div><!-- /modal-body -->',
        '    <div class="modal-footer">',
        '      <button type="button" class="btn btn-secondary" data-action="close-modal" data-value="session-prep-modal">Abbrechen</button>',
        '      <button type="button" class="btn btn-primary" data-action="save-session-prep">💾 Speichern</button>',
        '    </div>',
        '  </div>',
        '</div>'
    ].join('\n');

    // Modal in DOM einfügen (oder bestehenden ersetzen)
    var existing = document.getElementById('session-prep-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    if (typeof showModal === 'function') showModal('session-prep-modal');
}

/**
 * Rendert das Formular einer einzelnen Szenen-Karte.
 * @param {Object} szene - { id, titel, beschreibung, ort }
 * @param {number} idx - Index in der Szenen-Liste
 * @returns {string} HTML
 */
function renderSzeneFormular(szene, idx) {
    var szeneIdx = idx || 0;
    var editorId = 'szene-beschreibung-' + szeneIdx;
    return [
        '<div class="wp-szene-item" data-szene-idx="' + szeneIdx + '">',
        '  <div class="wp-szene-header">',
        '    <span class="wp-szene-nr">Szene ' + (szeneIdx + 1) + '</span>',
        '    <button type="button" class="btn btn-sm btn-danger wp-szene-remove"',
        '            data-action="remove-szene" data-value="' + szeneIdx + '" title="Szene entfernen">×</button>',
        '  </div>',
        '  <div class="wp-szene-fields">',
        '    <div class="wp-form-row">',
        '      <div class="wp-form-col wp-form-col-grow">',
        '        <label class="form-label">Titel</label>',
        '        <input type="text" class="form-control wp-szene-titel" value="' + esc(szene.titel || '') + '" placeholder="Szenentitel…">',
        '      </div>',
        '      <div class="wp-form-col">',
        '        <label class="form-label">Ort</label>',
        '        <input type="text" class="form-control wp-szene-ort" value="' + esc(szene.ort || '') + '" placeholder="Ort/Location…">',
        '      </div>',
        '    </div>',
        '    <div class="wp-szene-beschr-wrap">',
        '      <label class="form-label">Beschreibung <span class="wp-hint">(Entity-Links [[typ:id:name]] möglich)</span></label>',
        '      <div class="wp-form-toolbar">',
        '        <button type="button" class="btn btn-sm" data-action="insert-entity-link" data-value="' + editorId + '">🔗 Entity-Link</button>',
        '      </div>',
        '      <div id="' + editorId + '" class="wp-rich-editor wp-szene-beschreibung" contenteditable="true"',
        '           data-placeholder="Beschreibung der Szene (Vorlese-Text, Hinweise für den DM)…">',
        '        ' + (szene.beschreibung ? sanitizeHTML(szene.beschreibung) : ''),
        '      </div>',
        '    </div>',
        '  </div>',
        '</div>'
    ].join('\n');
}

// ============================================================
// DETAIL-ANSICHT (Lesemodus) — für spätere Erweiterung
// ============================================================

/**
 * Rendert eine Session-Prep in der Detailansicht (Read-Only).
 * Szenen-Beschreibungen: sanitizeHTML → parseEntityLinks.
 * @param {Object} prep - Session-Prep-Eintrag
 * @returns {string} HTML-String
 */
function renderSessionPrepDetail(prep) {
    if (!prep) return '';

    var szenenHtml = '';
    (prep.szenen || []).forEach(function(szene, idx) {
        szenenHtml += [
            '<div class="wp-szene-detail">',
            '  <div class="wp-szene-detail-header">',
            '    <strong>' + esc(szene.titel || 'Szene ' + (idx + 1)) + '</strong>',
            '    ' + (szene.ort ? '<span class="wp-szene-ort-badge">📍 ' + esc(szene.ort) + '</span>' : ''),
            '  </div>',
            '  <div class="wp-szene-detail-beschreibung">',
            '    ' + renderSzenenBeschreibung(szene.beschreibung),
            '  </div>',
            '</div>'
        ].join('\n');
    });

    var faedenHtml = '';
    (prep.offeneFaeden || []).forEach(function(faden) {
        // Threat T-05-11: quelleId kann auf gelöschte Entität zeigen → als display-only behandeln
        var typBadge = faden.quelleTyp === 'quest' ? '📋' : faden.quelleTyp === 'storyArc' ? '📖' : '✏️';
        faedenHtml += '<div class="wp-faden-badge">' + typBadge + ' ' + esc(faden.text) + '</div>';
    });

    return [
        '<div class="wp-detail">',
        '  <div class="wp-detail-header">',
        '    <h3>' + (prep.sessionNr ? 'Session ' + esc(String(prep.sessionNr)) : 'Session-Prep') + '</h3>',
        '    ' + (prep.datum ? '<span class="wp-datum">' + formatPrepDatum(prep.datum) + '</span>' : ''),
        '    ' + (prep.inGameDatum ? '<span class="wp-ingame-datum">📅 ' + esc(prep.inGameDatum) + '</span>' : ''),
        '  </div>',
        '',
        '  <div class="wp-section-block">',
        '    <h4>⚡ Strong Start</h4>',
        '    <div class="wp-rich-content">' + (prep.strongStart ? sanitizeHTML(prep.strongStart) : '<em>Nicht ausgefüllt</em>') + '</div>',
        '  </div>',
        '',
        '  <div class="wp-section-block">',
        '    <h4>🎭 Geplante Szenen</h4>',
        '    ' + (szenenHtml || '<em>Keine Szenen geplant</em>'),
        '  </div>',
        '',
        '  <div class="wp-section-block">',
        '    <h4>🔍 Geheime Hinweise</h4>',
        '    <div class="wp-rich-content">' + (prep.geheimeHinweise ? sanitizeHTML(prep.geheimeHinweise) : '<em>Nicht ausgefüllt</em>') + '</div>',
        '  </div>',
        '',
        '  <div class="wp-section-block">',
        '    <h4>👥 Wichtige NPCs</h4>',
        '    <div class="wp-rich-content">' + (prep.wichtigeNpcs ? renderSzenenBeschreibung(prep.wichtigeNpcs) : '<em>Nicht ausgefüllt</em>') + '</div>',
        '  </div>',
        '',
        '  <div class="wp-section-block">',
        '    <h4>💰 Mögliche Belohnungen</h4>',
        '    <div class="wp-rich-content">' + (prep.belohnungen ? esc(prep.belohnungen) : '<em>Nicht ausgefüllt</em>') + '</div>',
        '  </div>',
        '',
        '  <div class="wp-section-block">',
        '    <h4>🧵 Offene Fäden (' + (prep.offeneFaeden || []).length + ')</h4>',
        '    <div class="wp-faeden-list">' + (faedenHtml || '<em>Keine offenen Fäden</em>') + '</div>',
        '  </div>',
        '</div>'
    ].join('\n');
}

// ============================================================
// EXPORTS
// ============================================================
window.renderSessionPrepList = renderSessionPrepList;
window.showSessionPrepModal = showSessionPrepModal;
window.renderSessionPrepDetail = renderSessionPrepDetail;
window.renderSzeneFormular = renderSzeneFormular;
window.renderSzenenBeschreibung = renderSzenenBeschreibung;
