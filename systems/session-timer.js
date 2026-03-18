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
    return [hours, minutes, seconds]
        .map(v => v.toString().padStart(2, '0'))
        .join(':');
}
function updateSessionTimerDisplay() {
    const timeStr = formatSessionTime(sessionTimerSeconds);
    // Desktop Display
    const display = $('session-timer-display');
    if (display)
        display.textContent = timeStr;
    // Mobile Display
    const mobileDisplay = $('mobile-timer-display');
    if (mobileDisplay)
        mobileDisplay.textContent = timeStr;
}
function toggleSessionTimer() {
    const timer = $('session-timer');
    const mobileTimer = document.querySelector('.mobile-timer');
    const toggleBtn = $('session-timer-toggle');
    if (sessionTimerRunning) {
        // Pause
        if (sessionTimerInterval)
            clearInterval(sessionTimerInterval);
        sessionTimerRunning = false;
        timer?.classList.remove('running');
        timer?.classList.add('paused');
        mobileTimer?.classList.remove('running');
        mobileTimer?.classList.add('paused');
        if (toggleBtn)
            toggleBtn.textContent = '▶️';
        showToast('⏸️ Timer pausiert');
    }
    else {
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
        if (toggleBtn)
            toggleBtn.textContent = '⏸️';
        showToast('▶️ Timer gestartet');
        sessionTimerInterval = window.setInterval(() => {
            sessionTimerSeconds++;
            updateSessionTimerDisplay();
            // Auto-save Session-Zeit
            if (sessionTimerSeconds % SESSION_AUTO_SAVE_INTERVAL === 0) {
                D.lastSessionDuration = sessionTimerSeconds;
                save();
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
