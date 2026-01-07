// [SECTION:SESSION_TIMER]
// Extrahiert aus dice.js
// Session-Timer
// Zeilen: 110

import { $ } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';

// ============================================================
// SESSION TIMER
// ============================================================

const APP_CONFIG = (window as any).APP_CONFIG;
const D = (window as any).D;

const SESSION_AUTO_SAVE_INTERVAL: number = APP_CONFIG.SESSION_AUTO_SAVE_INTERVAL;
let sessionTimerInterval: number | null = null;
let sessionTimerSeconds: number = 0;
let sessionTimerRunning: boolean = false;

function formatSessionTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
        .map(v => v.toString().padStart(2, '0'))
        .join(':');
}

function updateSessionTimerDisplay(): void {
    const timeStr = formatSessionTime(sessionTimerSeconds);

    // Desktop Display
    const display = $('session-timer-display');
    if (display) display.textContent = timeStr;

    // Mobile Display
    const mobileDisplay = $('mobile-timer-display');
    if (mobileDisplay) mobileDisplay.textContent = timeStr;
}

export function toggleSessionTimer(): void {
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

            // Auto-save Session-Zeit
            if (sessionTimerSeconds % SESSION_AUTO_SAVE_INTERVAL === 0) {
                D.lastSessionDuration = sessionTimerSeconds;
                save();
            }
        }, 1000);
    }
}

export function resetSessionTimer(): void {
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

export function initSessionTimer(): void {
    // Timer immer bei 00:00:00 starten
    sessionTimerSeconds = 0;
    updateSessionTimerDisplay();
}

// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================

(window as any).toggleSessionTimer = toggleSessionTimer;
(window as any).resetSessionTimer = resetSessionTimer;
(window as any).initSessionTimer = initSessionTimer;
