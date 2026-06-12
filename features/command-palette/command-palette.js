// [SECTION:COMMAND_PALETTE]
// Command Palette: Strg+Shift+K Overlay mit Fuzzy-Aktionssuche
// Implementierung: Phase 2, Welle 2 (Plan 02-05)
// Analog: systems/search/global-search.js (debounced input, data-action-Rendering, click-outside)

// Debounced Command-Suche (analog zu debouncedGlobalSearch)
var debouncedCommandSearch = debounce(performCommandSearch, 80);

// Interne Zustandsvariablen
var _cpFocusedIndex = -1;
var _cpCurrentResults = [];

// Overlay erzeugen oder zurueckgeben
function _getCPOverlay() {
    var overlay = document.getElementById('cp-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'cp-overlay';
        overlay.className = 'cp-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Command Palette');
        overlay.innerHTML =
            '<div class="cp-box">' +
                '<div class="cp-input-row">' +
                    '<span class="cp-search-icon" aria-hidden="true">&#128269;</span>' +
                    '<input class="cp-input" type="text" placeholder="Aktion suchen..." autocomplete="off" spellcheck="false" />' +
                    '<span class="cp-hint" aria-hidden="true">Esc</span>' +
                '</div>' +
                '<div class="cp-results" id="cp-results-list" role="listbox"></div>' +
            '</div>';
        document.body.appendChild(overlay);

        // Input-Listener (debounced)
        var input = overlay.querySelector('.cp-input');
        if (input) {
            input.addEventListener('input', function() {
                debouncedCommandSearch();
            });
            // Tastatur-Navigation im Input
            input.addEventListener('keydown', function(e) {
                _handleCPKeydown(e);
            });
        }

        // Click-outside schliesst (analog global-search)
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                _closeCP();
            }
        });
    }
    return overlay;
}

// Command Palette oeffnen oder schliessen (Toggle)
function toggleCommandPalette() {
    var overlay = _getCPOverlay();
    if (overlay.classList.contains('cp-visible')) {
        _closeCP();
    } else {
        _openCP();
    }
}

// Oeffnen: Overlay sichtbar machen, Fokus auf Input, Top-8-Aktionen zeigen
function _openCP() {
    var overlay = _getCPOverlay();
    overlay.classList.add('cp-visible');
    var input = overlay.querySelector('.cp-input');
    if (input) {
        input.value = '';
        // Fokus nach kurzem Delay damit Overlay-Transition fertig ist
        setTimeout(function() {
            input.focus();
        }, 50);
    }
    _cpFocusedIndex = -1;
    // Top-8 Default-Aktionen anzeigen
    _renderCPResults(window.searchActions ? window.searchActions('') : []);
}

// Schliessen
function _closeCP() {
    var overlay = document.getElementById('cp-overlay');
    if (overlay) {
        overlay.classList.remove('cp-visible');
        _cpFocusedIndex = -1;
        _cpCurrentResults = [];
    }
}

// Suche ausfuehren (via debounce aufgerufen)
function performCommandSearch() {
    var overlay = document.getElementById('cp-overlay');
    if (!overlay || !overlay.classList.contains('cp-visible')) return;
    var input = overlay.querySelector('.cp-input');
    if (!input) return;
    var query = input.value.trim();
    _cpFocusedIndex = -1;
    var results = window.searchActions ? window.searchActions(query) : [];
    _renderCPResults(results);
}

// Ergebnisliste rendern
function _renderCPResults(results) {
    _cpCurrentResults = results || [];
    var list = document.getElementById('cp-results-list');
    if (!list) return;

    if (_cpCurrentResults.length === 0) {
        list.innerHTML =
            '<div class="cp-empty">' +
                'Keine Aktion gefunden — Tipp anpassen oder Esc zum Schließen.' +
            '</div>';
        return;
    }

    list.innerHTML = _cpCurrentResults.map(function(action, idx) {
        return (
            '<div class="cp-result" role="option"' +
            ' data-action="execute-command"' +
            ' data-command-id="' + esc(action.id) + '"' +
            ' data-cp-idx="' + idx + '">' +
                '<span class="cp-result-icon" aria-hidden="true">' + _getActionIcon(action.id) + '</span>' +
                '<span class="cp-result-label">' + esc(action.label) + '</span>' +
            '</div>'
        );
    }).join('');
}

// Tastatur-Navigation (Pfeiltasten, Enter, Esc)
function _handleCPKeydown(e) {
    var results = document.querySelectorAll('#cp-results-list .cp-result');
    var count = results.length;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        _cpFocusedIndex = (_cpFocusedIndex + 1) % Math.max(count, 1);
        _updateCPFocus(results);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        _cpFocusedIndex = (_cpFocusedIndex - 1 + count) % Math.max(count, 1);
        _updateCPFocus(results);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (_cpFocusedIndex >= 0 && _cpFocusedIndex < _cpCurrentResults.length) {
            _executeAction(_cpCurrentResults[_cpFocusedIndex]);
            _closeCP();
        }
    } else if (e.key === 'Escape') {
        e.preventDefault();
        _closeCP();
    }
}

// Fokus-Markierung aktualisieren
function _updateCPFocus(results) {
    Array.from(results).forEach(function(el, idx) {
        if (idx === _cpFocusedIndex) {
            el.classList.add('focused');
            // Sichtbar halten (scroll into view)
            if (typeof el.scrollIntoView === 'function') {
                el.scrollIntoView({ block: 'nearest' });
            }
        } else {
            el.classList.remove('focused');
        }
    });
}

// Aktion ausfuehren
function _executeAction(action) {
    if (action && typeof action.action === 'function') {
        try {
            action.action();
        } catch (err) {
            if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
                if (typeof ErrorHandler !== 'undefined' && ErrorHandler.log) {
                    ErrorHandler.log('CommandPalette', err, 'Aktion "' + action.id + '" fehlgeschlagen');
                }
            }
        }
    }
}

// Einfache Aktions-Icons basierend auf ID
function _getActionIcon(id) {
    if (!id) return '📋';
    if (id.indexOf('new-') === 0) return '➕';
    if (id.indexOf('roll') === 0) return '🎲';
    if (id.indexOf('nav-') === 0) return '➡️';
    if (id === 'undo') return '↩️';
    if (id === 'redo') return '↪️';
    if (id === 'open-settings') return '⚙️';
    if (id === 'backup-setup') return '💾';
    if (id === 'open-about') return 'ℹ️';
    return '⚡';
}

// Initialisierung: Input-Listener vorbereiten (analog initGlobalSearchListener)
function initCommandPalette() {
    // Overlay wird lazy bei erstem toggleCommandPalette() erzeugt.
    // Hier nur sicherstellen dass data-action execute-command registriert wird.
    if (typeof EventDelegation !== 'undefined') {
        EventDelegation.registerAction('execute-command', function(ctx) {
            var commandId = ctx.dataset ? ctx.dataset.commandId : ctx.getAttribute('data-command-id');
            if (!commandId) return;
            var registry = window.ACTION_REGISTRY || [];
            var action = null;
            for (var i = 0; i < registry.length; i++) {
                if (registry[i].id === commandId) {
                    action = registry[i];
                    break;
                }
            }
            if (action) {
                _executeAction(action);
                _closeCP();
            }
        });
    }
}

// Globale Exports
window.initCommandPalette = initCommandPalette;
window.toggleCommandPalette = toggleCommandPalette;
window.performCommandSearch = performCommandSearch;
