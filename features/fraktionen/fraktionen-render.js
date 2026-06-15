// [SECTION:FRAKTIONEN_RENDER]
// Fraktionen & Ruf-System — Render-Modul (WELT-05)
// Implementierung: Plan 05-07
// ============================================================
// Verwendete Globals: window.D, esc, sanitizeHTML, EntityLookup,
//   parseEntityId, showFraktionModal, anpassenRuf, setzeRuf,
//   deleteFraktion

/**
 * Ruf-Stufen-Definition (−50 bis +50).
 * 5 Stufen: Feindlich / Misstrauisch / Neutral / Freundlich / Verbündet
 * @type {Array<{min: number, max: number, label: string, icon: string, farbe: string}>}
 */
const FRAKTIONS_RUF_STUFEN = [
    { min: -50, max: -21, label: 'Feindlich',    icon: '🔴', farbe: 'var(--red)'    },
    { min: -20, max:  -1, label: 'Misstrauisch', icon: '🟠', farbe: 'var(--yellow)' },
    { min:   0, max:   0, label: 'Neutral',       icon: '⚪', farbe: 'var(--text)'   },
    { min:   1, max:  20, label: 'Freundlich',    icon: '🟡', farbe: 'var(--gold)'   },
    { min:  21, max:  50, label: 'Verbündet',     icon: '🟢', farbe: 'var(--green)'  }
];

/**
 * Gibt die Ruf-Stufe für einen Rufwert zurück.
 * @param {number} rufwert
 * @returns {{min, max, label, icon, farbe}}
 */
function rufStufe(rufwert) {
    return FRAKTIONS_RUF_STUFEN.find(function(s) {
        return rufwert >= s.min && rufwert <= s.max;
    }) || FRAKTIONS_RUF_STUFEN[2]; // Fallback: Neutral
}

/**
 * Rendert einen Ruf-Stufen-Badge als HTML-String.
 * @param {number} rufwert
 * @returns {string}
 */
function _renderRufBadge(rufwert) {
    var stufe = rufStufe(rufwert);
    return '<span class="fr-ruf-badge" style="color:' + stufe.farbe + '">' +
        stufe.icon + ' ' + esc(stufe.label) + ' (' + rufwert + ')</span>';
}

/**
 * Rendert die Fraktions-Übersichtsliste und ggf. das Detail-Panel.
 * Container: #view-fraktionen (befüllt durch renderFraktionen).
 */
function renderFraktionen() {
    var container = $('view-fraktionen');
    if (!container) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderFraktionen] Container #view-fraktionen fehlt — nicht auf fraktionen-Tab');
        }
        return;
    }

    var daten = window.D;
    var fraktionen = (daten && daten.factions) ? daten.factions : [];

    // Update counter
    var counter = document.getElementById('fraktionen-count');
    if (counter) counter.textContent = fraktionen.length;

    // Layout: zwei-Spalten auf Desktop, Stapel auf Mobil
    var contentArea = document.getElementById('fraktionen-content');
    if (!contentArea) {
        // Kein separater Content-Bereich — die gesamte section neu aufbauen
        // Die section-toolbar bleibt; wir fügen content-div hinzu wenn noch nicht da
        var existingContent = container.querySelector('.fr-view-content');
        if (!existingContent) {
            var newDiv = document.createElement('div');
            newDiv.className = 'fr-view-content';
            newDiv.id = 'fraktionen-content';
            container.appendChild(newDiv);
        }
        contentArea = container.querySelector('.fr-view-content') || container.querySelector('#fraktionen-content');
    }
    if (!contentArea) return;

    // Determine selected faction
    var selectedId = null;
    var selectedEl = contentArea.querySelector('.fr-faction-card.fr-selected');
    if (selectedEl) {
        selectedId = parseEntityId(selectedEl.getAttribute('data-id'));
    }
    // If there's a detail panel open, keep the same faction selected
    var detailPanel = contentArea.querySelector('#fr-detail-panel');
    if (detailPanel) {
        selectedId = parseEntityId(detailPanel.getAttribute('data-faction-id'));
    }

    if (fraktionen.length === 0) {
        contentArea.innerHTML = '<div class="fr-empty-state"><p>Noch keine Fraktionen angelegt. Klicke auf „+ Neue Fraktion".</p></div>';
        return;
    }

    // Build layout
    var listHTML = '<div class="fr-layout">';
    listHTML += '<div class="fr-list" id="fr-list">';
    fraktionen.forEach(function(f) {
        var stufe = rufStufe(f.ruf || 0);
        var isSelected = (selectedId !== null && f.id === selectedId);
        var mitgliederCount = (window.D.npcs || []).filter(function(n) {
            return parseEntityId(n.factionId) === f.id;
        }).length;
        listHTML += '<div class="fr-faction-card' + (isSelected ? ' fr-selected' : '') + '" data-id="' + f.id + '" data-action="select-fraktion" data-value="' + f.id + '">';
        listHTML += '<div class="fr-card-symbol">' + esc(f.symbol || '⚔️') + '</div>';
        listHTML += '<div class="fr-card-body">';
        listHTML += '<div class="fr-card-name">' + esc(f.name) + '</div>';
        listHTML += '<div class="fr-card-ruf">';
        listHTML += '<span class="fr-ruf-badge" style="color:' + stufe.farbe + '">' + stufe.icon + ' ' + esc(stufe.label) + '</span>';
        listHTML += '<span class="fr-ruf-value">Ruf: ' + (f.ruf || 0) + '</span>';
        listHTML += '</div>';
        if (mitgliederCount > 0) {
            listHTML += '<div class="fr-card-meta">👥 ' + mitgliederCount + ' Mitglied' + (mitgliederCount !== 1 ? 'er' : '') + '</div>';
        }
        listHTML += '</div>';
        listHTML += '<div class="fr-card-actions">';
        listHTML += '<button class="btn btn-sm" data-action="edit-fraktion" data-value="' + f.id + '" title="Bearbeiten">✏️</button>';
        listHTML += '<button class="btn btn-sm btn-danger" data-action="delete-fraktion" data-value="' + f.id + '" title="Löschen">🗑️</button>';
        listHTML += '</div>';
        listHTML += '</div>';
    });
    listHTML += '</div>'; // fr-list

    // Detail panel: show if something selected
    listHTML += '<div id="fr-detail-panel" class="fr-detail-panel"';
    if (selectedId !== null) {
        listHTML += ' data-faction-id="' + selectedId + '">';
        listHTML += _renderFraktionDetail(selectedId);
    } else {
        listHTML += '>';
        listHTML += '<div class="fr-detail-placeholder"><p>Fraktion aus der Liste wählen um Details zu sehen.</p></div>';
    }
    listHTML += '</div>';
    listHTML += '</div>'; // fr-layout

    contentArea.innerHTML = listHTML;
}

/**
 * Rendert das Detail-Panel für eine Fraktion als HTML-String.
 * @param {number} fraktionId
 * @returns {string}
 */
function _renderFraktionDetail(fraktionId) {
    var daten = window.D;
    var numId = parseEntityId(fraktionId);
    var faction = (daten.factions || []).find(function(f) { return f.id === numId; });
    if (!faction) return '<p>Fraktion nicht gefunden.</p>';

    var stufe = rufStufe(faction.ruf || 0);
    var html = '';

    // Header
    html += '<div class="fr-detail-header">';
    html += '<span class="fr-detail-symbol">' + esc(faction.symbol || '⚔️') + '</span>';
    html += '<div class="fr-detail-title-block">';
    html += '<h3 class="fr-detail-name">' + esc(faction.name) + '</h3>';
    html += '<div class="fr-ruf-statusbar" style="background:' + stufe.farbe + '22; border-left: 3px solid ' + stufe.farbe + '">';
    html += stufe.icon + ' ' + esc(stufe.label) + ' &nbsp;|&nbsp; Ruf: <strong>' + (faction.ruf || 0) + '</strong> / 50';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // Agenda / Ziele
    if (faction.agenda) {
        html += '<div class="fr-detail-section">';
        html += '<div class="fr-section-title">Ziele &amp; Agenda</div>';
        html += '<div class="fr-section-body">' + sanitizeHTML(faction.agenda) + '</div>';
        html += '</div>';
    }

    // Beschreibung
    if (faction.beschreibung) {
        html += '<div class="fr-detail-section">';
        html += '<div class="fr-section-title">Beschreibung</div>';
        html += '<div class="fr-section-body">' + sanitizeHTML(faction.beschreibung) + '</div>';
        html += '</div>';
    }

    // Ruf-Anpassung
    html += '<div class="fr-detail-section">';
    html += '<div class="fr-section-title">Ruf anpassen</div>';
    html += '<div class="fr-ruf-controls">';
    html += '<input type="text" id="fr-ruf-grund-' + faction.id + '" class="fr-ruf-grund-input" placeholder="Grund / Notiz (optional)">';
    html += '</div>';
    html += '<div class="fr-ruf-buttons">';
    html += '<button class="btn btn-sm fr-ruf-btn-minus" data-action="ruf-minus" data-value="' + faction.id + '" title="−10">−10</button>';
    html += '<button class="btn btn-sm fr-ruf-btn-minus" data-action="ruf-minus5" data-value="' + faction.id + '" title="−5">−5</button>';
    html += '<button class="btn btn-sm fr-ruf-btn-plus" data-action="ruf-plus5" data-value="' + faction.id + '" title="+5">+5</button>';
    html += '<button class="btn btn-sm fr-ruf-btn-plus" data-action="ruf-plus" data-value="' + faction.id + '" title="+10">+10</button>';
    html += '</div>';
    html += '<div class="fr-ruf-set-row">';
    html += '<input type="number" id="fr-ruf-set-' + faction.id + '" class="fr-ruf-set-input" placeholder="Direkt setzen (−50…+50)" min="-50" max="50">';
    html += '<button class="btn btn-sm" data-action="ruf-set" data-value="' + faction.id + '">Setzen</button>';
    html += '</div>';
    html += '</div>';

    // Ruf-Historie
    var historie = faction.rufHistorie || [];
    html += '<div class="fr-detail-section">';
    html += '<div class="fr-section-title">Ruf-Historie (' + historie.length + ' Einträge)</div>';
    if (historie.length === 0) {
        html += '<div class="fr-historie-empty">Noch keine Änderungen.</div>';
    } else {
        html += '<div class="fr-historie-list">';
        // Neueste zuerst
        var sortedHistorie = historie.slice().reverse();
        sortedHistorie.forEach(function(eintrag) {
            var delta = eintrag.delta || 0;
            var deltaStr = delta >= 0 ? ('+' + delta) : String(delta);
            var deltaClass = delta >= 0 ? 'fr-hist-plus' : 'fr-hist-minus';
            var ts = eintrag.zeitstempel ? new Date(eintrag.zeitstempel).toLocaleString('de-DE') : '—';
            html += '<div class="fr-historie-eintrag">';
            html += '<span class="fr-hist-delta ' + deltaClass + '">' + esc(deltaStr) + '</span>';
            html += '<span class="fr-hist-grund">' + esc(eintrag.grund || '—') + '</span>';
            html += '<span class="fr-hist-ts">' + ts + '</span>';
            html += '</div>';
        });
        html += '</div>';
    }
    html += '</div>';

    // Mitglieder (NPCs mit factionId === faction.id)
    var mitglieder = (daten.npcs || []).filter(function(n) {
        return parseEntityId(n.factionId) === numId;
    });
    html += '<div class="fr-detail-section">';
    html += '<div class="fr-section-title">Mitglieder (' + mitglieder.length + ')</div>';
    if (mitglieder.length === 0) {
        html += '<div class="fr-mitglieder-empty">Keine NPCs dieser Fraktion zugewiesen. (NPC bearbeiten → Fraktion setzen)</div>';
    } else {
        html += '<div class="fr-mitglieder-list">';
        mitglieder.forEach(function(npc) {
            html += '<div class="fr-mitglied-item">';
            html += '<span class="fr-mitglied-icon">🎭</span>';
            html += '<span class="fr-mitglied-name">' + esc(npc.name || 'Unbekannt') + '</span>';
            if (npc.role) html += '<span class="fr-mitglied-rolle">' + esc(npc.role) + '</span>';
            html += '</div>';
        });
        html += '</div>';
    }
    html += '</div>';

    // Sitz / Einflussgebiet
    if (faction.sitzOrtId) {
        var ort = null;
        if (typeof EntityLookup !== 'undefined' && EntityLookup.location) {
            ort = EntityLookup.location(parseEntityId(faction.sitzOrtId));
        } else {
            ort = (daten.locations || []).find(function(l) {
                return l.id === parseEntityId(faction.sitzOrtId);
            });
        }
        if (ort) {
            html += '<div class="fr-detail-section">';
            html += '<div class="fr-section-title">Sitz / Einflussgebiet</div>';
            html += '<div class="fr-sitz-name">📍 ' + esc(ort.name || 'Unbekannt') + '</div>';
            html += '</div>';
        }
    }

    // Rivalen & Verbündete (Freitext)
    if (faction.rivalen || faction.verbuendete) {
        html += '<div class="fr-detail-section">';
        if (faction.rivalen) {
            html += '<div class="fr-section-title">Rivalen</div>';
            html += '<div class="fr-freitext">' + esc(faction.rivalen) + '</div>';
        }
        if (faction.verbuendete) {
            html += '<div class="fr-section-title">Verbündete</div>';
            html += '<div class="fr-freitext">' + esc(faction.verbuendete) + '</div>';
        }
        html += '</div>';
    }

    return html;
}

/**
 * Wählt eine Fraktion in der Liste aus und zeigt ihr Detail.
 * Wird von data-action="select-fraktion" aufgerufen.
 * @param {number|string} id
 */
function selectFraktion(id) {
    var numId = parseEntityId(id);
    var contentArea = document.getElementById('fraktionen-content');
    if (!contentArea) return;

    // Update selection state on cards
    var cards = contentArea.querySelectorAll('.fr-faction-card');
    cards.forEach(function(card) {
        card.classList.remove('fr-selected');
        if (parseEntityId(card.getAttribute('data-id')) === numId) {
            card.classList.add('fr-selected');
        }
    });

    // Update detail panel
    var detailPanel = document.getElementById('fr-detail-panel');
    if (detailPanel) {
        detailPanel.setAttribute('data-faction-id', String(numId));
        detailPanel.innerHTML = _renderFraktionDetail(numId);
    }
}

window.FRAKTIONS_RUF_STUFEN = FRAKTIONS_RUF_STUFEN;
window.rufStufe = rufStufe;
window.renderFraktionen = renderFraktionen;
window.selectFraktion = selectFraktion;
window._renderFraktionDetail = _renderFraktionDetail;
