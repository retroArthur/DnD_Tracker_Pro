// [SECTION:COMBAT_LOG_RENDER]
// Kampfprotokoll — das Panel (U5)
//
// BAUMUSTER IST `.qref-panel`, NICHT DIE STATBLOCK-SCHUBLADE. Die Schublade ist
// modal und legt eine Blende ueber die Seite; das Kampfprotokoll muss offen
// stehen BLEIBEN, waehrend der Spielleiter weiter wuerfelt und Schaden verteilt
// — es ist ein Fenster auf das Geschehen, kein Dialog, der es anhaelt. Der
// Nachweis dafuer steht als Zusicherung in tests/e2e/features/kampfprotokoll.spec.js
// ("das offene Panel blockiert die Seite nicht"): sie prueft, dass ein Punkt
// links der Panelkante kein `.modal-overlay` trifft.
//
// WARUM DAS PANEL EINEN EIGENEN EINSTIEG BRAUCHT: der Dauermodus des alten
// Ereignis-Logs (Taste L) war ueber genau EINEN Mausweg zu finden —
// System ▾ → Debug → drei Klicks tief in einem violetten Dialog. Deshalb hat
// der Spielleiter ihn nie gefunden. Das Panel haengt jetzt an einem Knopf in
// der Kopfzeile, neben Rueckgaengig und Tastenkuerzel, und nennt sein Kuerzel
// am eigenen Kopf (Muster `.qref-kbd-hint`).

// Der gerade gewaehlte Filter. Laufzeitzustand des Fensters, gehoert
// ausdruecklich NICHT in `D` — genauso wenig wie der Puffer selbst.
let kpLogFilter = 'alles';
let kpLogRenderTimer = null;

/**
 * Formatiert einen Zeitstempel als hh:mm:ss.
 * @param {number} zeit
 * @returns {string}
 */
function kpLogZeitText(zeit) {
    if (!zeit) return '--:--:--';
    try {
        return new Date(zeit).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch {
        return '--:--:--';
    }
}

/**
 * Zeichnet die Liste im Panel neu.
 */
function renderCombatLog() {
    const liste = $('kampflog-liste');
    if (!liste) {
        // Kein console.*: MAINT-06 haelt den ganzen Baum davon frei
        // (tests/unit/console-hygiene.test.js prueft loader.js MODULES Zeile fuer
        // Zeile). Der Weg ist ErrorHandler.log hinter DEBUG_MODE.
        if (window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler) {
            window.ErrorHandler.log(
                'renderCombatLog',
                new Error('#kampflog-liste fehlt'),
                'Panel-Markup nicht geladen?'
            );
        }
        return;
    }

    const eintraege =
        typeof window.getCombatLog === 'function' ? window.getCombatLog(kpLogFilter) : [];

    // Reiter-Zustand mitziehen, damit der Filter auch nach einem Neuzeichnen stimmt
    document.querySelectorAll('#kampflog-panel .kplog-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.value === kpLogFilter);
    });

    const zaehler = $('kampflog-anzahl');
    if (zaehler) zaehler.textContent = String(eintraege.length);

    if (!eintraege.length) {
        liste.innerHTML =
            '<div class="kplog-leer">Noch nichts protokolliert.<br>' +
            'Jede Meldung der App landet hier — auch die, die schon verblasst ist.</div>';
        return;
    }

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    // esc() auf JEDEN Meldungstext: die Texte enthalten Namen von Charakteren,
    // NSCs und Monstern, also Nutzereingaben (CLAUDE.md, XSS in Widgets).
    liste.innerHTML = eintraege
        .map(
            e =>
                `<div class="kplog-entry ${esc(e.typ)}" data-kategorie="${esc(e.kategorie)}">` +
                `<span class="kplog-icon">${esc(icons[e.typ] || icons.info)}</span>` +
                `<div class="kplog-body">` +
                `<div class="kplog-text">${esc(e.text)}</div>` +
                `<div class="kplog-meta"><span class="kplog-zeit">${esc(kpLogZeitText(e.zeit))}</span>` +
                (e.kategorie === 'kampf' ? '<span class="kplog-marke">Kampf</span>' : '') +
                `</div></div></div>`
        )
        .join('');
}

/**
 * Zeichnet nur neu, wenn das Panel offen ist — entprellt (150 ms, Muster
 * UI_TIMING.DM_SCREEN_SYNC_DELAY / Live-Sync-Muster aus CLAUDE.md). Ein
 * Mob-Sammelangriff loest mehrere Meldungen in derselben Ereignisschleife aus;
 * ohne Entprellung waeren das ebenso viele vollstaendige Neuzeichnungen.
 */
function renderCombatLogIfOpen() {
    const panel = $('kampflog-panel');
    if (!panel || !panel.classList.contains('active')) return;
    if (kpLogRenderTimer) clearTimeout(kpLogRenderTimer);
    kpLogRenderTimer = setTimeout(() => {
        kpLogRenderTimer = null;
        renderCombatLog();
    }, window.UI_CONSTANTS?.UI_TIMING?.DM_SCREEN_SYNC_DELAY || 150);
}

/**
 * Oeffnet oder schliesst das Panel. Beim Oeffnen wird sofort gezeichnet — der
 * Spielleiter will das Protokoll SEHEN, nicht auf eine Entprellung warten.
 */
function toggleCombatLog() {
    const panel = $('kampflog-panel');
    if (!panel) return;
    panel.classList.toggle('active');
    const knopf = $('kampflog-toggle');
    if (knopf) knopf.setAttribute('aria-expanded', String(panel.classList.contains('active')));
    if (panel.classList.contains('active')) renderCombatLog();
}

/**
 * Setzt den Filter und zeichnet neu.
 * @param {string} kategorie - 'alles' oder 'kampf'
 */
function setCombatLogFilter(kategorie) {
    kpLogFilter = kategorie === 'kampf' ? 'kampf' : 'alles';
    renderCombatLog();
}

/**
 * Leert das Protokoll — mit Rueckfrage, weil verdraengte Eintraege
 * unwiederbringlich sind (das Protokoll liegt ausserhalb von `D` und damit
 * ausserhalb des Undo-Stacks; dieselbe Lage wie bei der Wuerfelstatistik).
 */
function clearCombatLogMitRueckfrage() {
    const anzahl = typeof window.getCombatLog === 'function' ? window.getCombatLog().length : 0;
    if (anzahl === 0) return;
    if (
        !confirm(
            `${anzahl} Protokolleintraege loeschen? Das laesst sich nicht rueckgaengig machen.`
        )
    )
        return;
    if (typeof window.clearCombatLog === 'function') window.clearCombatLog();
    renderCombatLog();
}

window.renderCombatLog = renderCombatLog;
window.renderCombatLogIfOpen = renderCombatLogIfOpen;
window.toggleCombatLog = toggleCombatLog;
window.setCombatLogFilter = setCombatLogFilter;
window.clearCombatLogMitRueckfrage = clearCombatLogMitRueckfrage;
