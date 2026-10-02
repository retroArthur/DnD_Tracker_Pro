// [SECTION:SESSION_TIMER]
// Was: features/dice/session-timer.js, Now: systems/session-timer.js
// Session-Timer für Kampagnen-Tracking
// Zeilen: 110
// ============================================================
// SESSION TIMER
// ============================================================
// var D = window.D;  // [REMOVED: conflicts with function declaration]
var SESSION_AUTO_SAVE_INTERVAL = APP_CONFIG.SESSION_AUTO_SAVE_INTERVAL;
let sessionTimerInterval = null;
let sessionTimerSeconds = 0;
let sessionTimerRunning = false;
function formatSessionTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map(v => v.toString().padStart(2, '0')).join(':');
}
/**
 * Schreibt die Sitzungszeit in die Mobil-Kopfzeile und haelt die SEKUNDEN
 * dabei in einem eigenen Element (C1).
 *
 * WARUM GETRENNT. Die Mobil-Kopfzeile fuehrt sieben Bedienelemente in einer
 * nicht umbrechenden, fest sitzenden Leiste. Bei 320px Fensterbreite stehen
 * 304px Inhaltsbreite zur Verfuegung, die sechs Symbolknoepfe nehmen 219.6px,
 * und fuer den Zaehler bleiben mit 8px Zwischenraum 52.4px. "00:00:00" ist in
 * `var(--font-mono)` bei 14px 61.6px breit (Consolas, Windows) bzw. 67.2px
 * (Courier New als Nachstellung von DejaVu Sans Mono, Linux) — plus Rahmen und
 * Innenabstand 87.6 bzw. 93.2px. Die Leiste war damit auf JEDER Telefonbreite
 * ueberbucht; unter der Linux-Metrik schob der 5.6px breitere Zaehler die Mitte
 * des rechten Knopfes von x=319 auf x=325 aus einem 320px-Fenster, und
 * `elementFromPoint` antwortete dort mit `nichts` (CI-Lauf 36966941474,
 * 8 Faelle = 2 Fenster x 4 Themes).
 * Ohne die Sekunden sind es fuenf Zeichen statt acht. Fuer einen SITZUNGS-
 * zaehler ist das kein Verlust: am Tisch liest der Spielleiter "wie lange
 * spielen wir schon", und das steht in Stunden und Minuten. Die vollstaendige
 * Zeit bleibt in der Desktop-Kopfzeile (#session-timer-display) unveraendert
 * stehen, und ausgeblendet wird erst unterhalb von 600px (core.css).
 *
 * WARUM ZWEI KNOTEN UND NICHT innerHTML. Die Anzeige laeuft im Sekundentakt.
 * `textContent` am Elternteil wuerde das Sekunden-Element beim ersten Tick
 * loeschen; `innerHTML` waere eine Zeichenkettenmontage im Sekundentakt an
 * einer Stelle, die keine braucht. Die beiden Knoten werden einmal angelegt
 * und danach nur noch beschrieben.
 *
 * @param {HTMLElement} ziel #mobile-timer-display
 * @param {string} zeit Vollform "HH:MM:SS" aus formatSessionTime()
 */
function schreibeMobilZeit(ziel, zeit) {
    const schnitt = zeit.lastIndexOf(':');
    const kopf = schnitt < 0 ? zeit : zeit.slice(0, schnitt);
    const sekunden = schnitt < 0 ? '' : zeit.slice(schnitt);
    let sekKnoten = ziel.querySelector('.mobile-timer-seconds');
    if (!sekKnoten) {
        // Erststart oder fremd ueberschriebener Teilbaum: neu aufbauen.
        ziel.textContent = '';
        ziel.appendChild(document.createTextNode(kopf));
        sekKnoten = document.createElement('span');
        sekKnoten.className = 'mobile-timer-seconds';
        ziel.appendChild(sekKnoten);
    } else if (ziel.firstChild && ziel.firstChild.nodeType === Node.TEXT_NODE) {
        ziel.firstChild.nodeValue = kopf;
    }
    sekKnoten.textContent = sekunden;
}
function updateSessionTimerDisplay() {
    const timeStr = formatSessionTime(sessionTimerSeconds);
    // Desktop Display
    const display = $('session-timer-display');
    if (display) display.textContent = timeStr;
    // Mobile Display
    const mobileDisplay = $('mobile-timer-display');
    if (mobileDisplay) schreibeMobilZeit(mobileDisplay, timeStr);
}
function toggleSessionTimer() {
    const timer = $('session-timer');
    const mobileTimer = document.querySelector('.mobile-timer');
    const toggleBtn = $('session-timer-toggle');
    if (sessionTimerRunning) {
        // Pause
        if (sessionTimerInterval) clearInterval(sessionTimerInterval);
        sessionTimerRunning = false;
        timer?.classList.remove('running');
        timer?.classList.add('paused');
        mobileTimer?.classList.remove('running');
        mobileTimer?.classList.add('paused');
        if (toggleBtn) toggleBtn.textContent = '▶️';
        showToast('⏸️ Timer pausiert');
    } else {
        // Start - cleanup vorheriger Interval falls vorhanden
        if (sessionTimerInterval) {
            clearInterval(sessionTimerInterval);
            sessionTimerInterval = null;
        }
        sessionTimerRunning = true;
        timer?.classList.remove('paused');
        timer?.classList.add('running');
        mobileTimer?.classList.remove('paused');
        mobileTimer?.classList.add('running');
        if (toggleBtn) toggleBtn.textContent = '⏸️';
        showToast('▶️ Timer gestartet');
        sessionTimerInterval = window.setInterval(() => {
            sessionTimerSeconds++;
            updateSessionTimerDisplay();
            // Auto-save Session-Zeit — automatisch, also nie aus einem veralteten Tab (R02)
            if (sessionTimerSeconds % SESSION_AUTO_SAVE_INTERVAL === 0) {
                D.lastSessionDuration = sessionTimerSeconds;
                window.saveAutomatic();
            }
        }, 1000);
    }
}
function resetSessionTimer() {
    if (sessionTimerRunning) {
        toggleSessionTimer(); // Erst pausieren
    }
    // Speichere vorherige Session-Zeit
    if (sessionTimerSeconds > 60) {
        D.sessionHistory = D.sessionHistory || [];
        D.sessionHistory.push({
            date: new Date().toISOString(),
            duration: sessionTimerSeconds
        });
        // Nur letzte 20 Sessions behalten
        if (D.sessionHistory.length > 20) {
            D.sessionHistory = D.sessionHistory.slice(-20);
        }
        save();
    }
    sessionTimerSeconds = 0;
    updateSessionTimerDisplay();
    const timer = $('session-timer');
    timer?.classList.remove('running', 'paused');
    showToast('⏱️ Timer zurückgesetzt');
}
function initSessionTimer() {
    // Timer immer bei 00:00:00 starten
    sessionTimerSeconds = 0;
    updateSessionTimerDisplay();
}
// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================
window.initSessionTimer = initSessionTimer;
window.toggleSessionTimer = toggleSessionTimer;
window.resetSessionTimer = resetSessionTimer;
