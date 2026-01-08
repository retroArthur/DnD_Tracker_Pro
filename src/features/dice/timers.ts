// [SECTION:TIMERS]
// Extrahiert aus dice.js
// Timer-Funktionen - Redesigned
// Zeilen: 364

import { $, esc } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { hideModal } from '@systems/spellslots/navigation';

// ============================================================
// TYPES
// ============================================================

interface Timer {
    id: number;
    name: string;
    totalSeconds: number;
    remainingSeconds: number;
    running: boolean;
}

interface TimerPreset {
    name: string;
    emoji: string;
    hours: number;
    minutes: number;
    seconds: number;
}

interface RoundTimer {
    rounds: number;
    currentRound: number;
    secondsInRound: number;
}

// ============================================================
// TIMERS
// ============================================================

const APP_CONFIG = (window as any).APP_CONFIG;
const StorageAPI = (window as any).StorageAPI;

let timers: Timer[] = [];
let timerInterval: number | null = null;
let roundTimer: RoundTimer | null = null;
let roundTimerInterval: number | null = null;
let focusedTimerId: number | null = null;
const TIMER_PRESETS_KEY: string = APP_CONFIG.TIMER_PRESETS_KEY;

function getTimerPresets(): TimerPreset[] {
    return StorageAPI.getJSON(TIMER_PRESETS_KEY, []);
}

function saveTimerPresets(presets: TimerPreset[]): void {
    StorageAPI.setJSON(TIMER_PRESETS_KEY, presets);
}

export function renderTimerPresets(): void {
    const presets = getTimerPresets();
    const container = $('timer-presets');
    if (!container) return;

    if (!presets.length) {
        container.innerHTML = '<span style="color: var(--text-dim); font-size: 0.75em;">Keine Vorlagen</span>';
        return;
    }

    container.innerHTML = presets.map(p => {
        const totalSec = (p.hours || 0) * 3600 + (p.minutes || 0) * 60 + (p.seconds || 0);
        return `<button class="timer-preset-btn" data-action="add-preset-timer" data-value="${esc(p.name)}" data-duration="${totalSec}">
            <span>${p.emoji || '⏱️'}</span>
            <span>${esc(p.name)}</span>
        </button>`;
    }).join('');
}

function formatPresetTime(h: number, m: number, s: number): string {
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);
    return parts.length ? parts.join(' ') : '0m';
}

export function renderPresetList(): void {
    const presets = getTimerPresets();
    const container = $('preset-list');
    if (!container) return;

    if (!presets.length) {
        container.innerHTML = '<div style="color: var(--text-dim); font-size: 0.85em;">Noch keine Vorlagen erstellt</div>';
        return;
    }

    container.innerHTML = presets.map((p, i) => {
        const timeStr = formatPresetTime(p.hours, p.minutes, p.seconds);
        return `<div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg-dark); border-radius: 6px; margin-bottom: 6px;">
            <span style="flex: 1; display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 1.2em;">${p.emoji || '⏱️'}</span>
                <span style="font-weight: 500;">${esc(p.name)}</span>
                <span style="color: var(--text-dim); font-size: 0.85em;">(${timeStr})</span>
            </span>
            <button class="btn btn-sm" data-action="edit-timer-preset" data-id="${i}" title="Bearbeiten">✏️</button>
            <button class="btn btn-sm btn-danger" data-action="delete-timer-preset" data-id="${i}" title="Löschen">🗑️</button>
        </div>`;
    }).join('');
}

export function setPresetEmoji(emoji: string): void {
    const input = $('preset-emoji') as HTMLInputElement | null;
    if (input) input.value = emoji;
}

export function saveTimerPreset(): void {
    const editIndexInput = $('edit-preset-index') as HTMLInputElement | null;
    const nameInput = $('preset-name') as HTMLInputElement | null;
    const emojiInput = $('preset-emoji') as HTMLInputElement | null;
    const hoursInput = $('preset-hours') as HTMLInputElement | null;
    const minutesInput = $('preset-minutes') as HTMLInputElement | null;
    const secondsInput = $('preset-seconds') as HTMLInputElement | null;

    if (!editIndexInput || !nameInput || !emojiInput || !hoursInput || !minutesInput || !secondsInput) return;

    const editIndex = editIndexInput.value;
    const name = nameInput.value.trim();
    const emoji = emojiInput.value.trim();
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;

    if (!name) { showToast('⚠️ Name erforderlich', 'error'); return; }
    if (hours === 0 && minutes === 0 && seconds === 0) { showToast('⚠️ Zeit muss größer als 0 sein', 'error'); return; }

    const presets = getTimerPresets();
    const presetData: TimerPreset = { name, emoji, hours, minutes, seconds };

    if (editIndex !== '') {
        presets[parseInt(editIndex)] = presetData;
        showToast('Vorlage aktualisiert');
    } else {
        presets.push(presetData);
        showToast('Vorlage hinzugefügt');
    }

    saveTimerPresets(presets);
    clearPresetForm();
    renderPresetList();
    renderTimerPresets();
}

export function editTimerPreset(index: number): void {
    const presets = getTimerPresets();
    const p = presets[index];
    if (!p) return;

    ($('edit-preset-index') as HTMLInputElement).value = String(index);
    ($('preset-name') as HTMLInputElement).value = p.name || '';
    ($('preset-emoji') as HTMLInputElement).value = p.emoji || '';
    ($('preset-hours') as HTMLInputElement).value = String(p.hours || 0);
    ($('preset-minutes') as HTMLInputElement).value = String(p.minutes || 0);
    ($('preset-seconds') as HTMLInputElement).value = String(p.seconds || 0);

    const saveBtn = $('preset-save-btn');
    const cancelBtn = $('preset-cancel-btn');
    if (saveBtn) saveBtn.textContent = 'Vorlage speichern';
    if (cancelBtn) (cancelBtn as HTMLElement).style.display = 'inline-block';
}

export function cancelPresetEdit(): void {
    clearPresetForm();
}

function clearPresetForm(): void {
    ($('edit-preset-index') as HTMLInputElement).value = '';
    ($('preset-name') as HTMLInputElement).value = '';
    ($('preset-emoji') as HTMLInputElement).value = '';
    ($('preset-hours') as HTMLInputElement).value = '0';
    ($('preset-minutes') as HTMLInputElement).value = '10';
    ($('preset-seconds') as HTMLInputElement).value = '0';

    const saveBtn = $('preset-save-btn');
    const cancelBtn = $('preset-cancel-btn');
    if (saveBtn) saveBtn.textContent = 'Vorlage hinzufügen';
    if (cancelBtn) (cancelBtn as HTMLElement).style.display = 'none';
}

export function deleteTimerPreset(index: number): void {
    const presets = getTimerPresets();
    presets.splice(index, 1);
    saveTimerPresets(presets);
    renderPresetList();
    renderTimerPresets();
}

export function addPresetTimer(name: string, totalSeconds: number): void {
    addTimerWithSeconds(name, totalSeconds);
}

export function quickTimer(seconds: number): void {
    const name = seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds/60)}m` : `${Math.floor(seconds/3600)}h`;
    addTimerWithSeconds(name, seconds);
}

function addTimerWithSeconds(name: string, totalSeconds: number): void {
    const timer: Timer = {
        id: Date.now(),
        name,
        totalSeconds: totalSeconds,
        remainingSeconds: totalSeconds,
        running: true
    };
    timers.push(timer);
    focusedTimerId = timer.id;
    startTimerInterval();
    renderTimers();
    updateHeroTimer();
}

export function createTimer(): void {
    const nameInput = $('timer-name') as HTMLInputElement | null;
    const hoursInput = $('timer-hours') as HTMLInputElement | null;
    const minutesInput = $('timer-minutes') as HTMLInputElement | null;
    const secondsInput = $('timer-seconds') as HTMLInputElement | null;

    if (!nameInput || !hoursInput || !minutesInput || !secondsInput) return;

    const name = nameInput.value.trim() || 'Timer';
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds <= 0) { showToast('⚠️ Timer muss größer als 0 sein', 'error'); return; }

    addTimerWithSeconds(name, totalSeconds);
    hideModal('timer-modal');
    nameInput.value = '';
    hoursInput.value = '0';
    minutesInput.value = '10';
    secondsInput.value = '0';
}

function startTimerInterval(): void {
    if (timerInterval) return;
    timerInterval = window.setInterval(() => {
        let anyRunning = false;
        timers.forEach(t => {
            if (t.running && t.remainingSeconds > 0) {
                t.remainingSeconds--;
                anyRunning = true;
                if (t.remainingSeconds === 0) {
                    showToast(`⏰ ${t.name} abgelaufen!`);
                    // Play sound if available
                    try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp2SfW1paXqKlZqTgXJkaGyBjJSQgXJkaG2BjZaTgXFkZ22BjpeTf3BjZm2BjpeTfm9iZWyAjpeTfW5hZGuAjpeUfG1gY2qAjpiUe2xfYml/jpiVeWtdYWh+jZmWd2pcYGd9jZqXdWhaX2Z8jJqYc2dZXmV7jJuZcWZYXWR6i5uacGRXXGN5i5ybbl9UWWF3ipydbV5TV2B2iZ2fbFxSVl91iJ6ga1pRVV5zh56halxSVl5yhp+iaFpQVF1xhZ+jZldPU1xvhaCkZFZOUlpug6GmYlNMUFlsf6GoYFFLTldqfaKqXk5KTVZoeaOsW0xJTFVmdKSuWUpISlNjcaSwVkdGSVFhbaWyU0RDRU9eaaazUEFCQ01aZaezTj9AQUpXYqWzSz49PkhTXaS0SD07O0ZQWaO1RTk5OUNMVaC3Qjc2NUBJTJ23Pzc1Mz1GSJq4PDQyMTtDRJa5OS8vLjdAPJO6Ni0sKzU8N4+7My4rKjQ5No69MSssKTM3MYu+LissKDI1LoS/KyoqJzAzK4DBKSknJC4xKXvCJycmIywvJnbDJicmISouInDFJSYlICksH2vGIyQjHycrHGfIIiMiHCUnGGHJICEgGSIlFVzLHyEfFyAiFVfNHB8cFR0gEVLOGR0aFBobDk3PFxoXEhYYC0fQFBkVERQUCEPRERcSEBIRADzTDhQQDg8PAzbUCxMNDA0MAzHVCA8LCgsKASvWBQ4JCAYHAB/XAw0HBwUEABbYAQoGBQQDAA/Y/wcFAwMCAArZ/AQCAQEBAP/Z+gIAAAEAAP/a+AAAAAAAAP/a+AAAAAAAAP/a+QAAAAAAAAAAAAAAAAAAAAAAAAAAAA==').play(); } catch(e) {}
                }
            }
        });
        if (!anyRunning) {
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = null;
        }
        renderTimers();
        updateHeroTimer();
    }, 1000);
}

export function focusTimer(id: number): void {
    focusedTimerId = id;
    renderTimers();
    updateHeroTimer();
}

export function toggleTimer(id: number): void {
    const t = timers.find(x => x.id === id);
    if (t) {
        t.running = !t.running;
        if (t.running) startTimerInterval();
        renderTimers();
        updateHeroTimer();
    }
}

export function heroTimerToggle(): void {
    if (focusedTimerId) {
        toggleTimer(focusedTimerId);
    }
}

export function heroTimerReset(): void {
    if (focusedTimerId) {
        resetTimer(focusedTimerId);
    }
}

export function resetTimer(id: number): void {
    const t = timers.find(x => x.id === id);
    if (t) {
        t.remainingSeconds = t.totalSeconds;
        t.running = false;
        renderTimers();
        updateHeroTimer();
    }
}

export function deleteTimer(id: number): void {
    timers = timers.filter(t => t.id !== id);
    if (focusedTimerId === id) {
        focusedTimerId = timers.length > 0 ? timers[0].id : null;
    }
    renderTimers();
    updateHeroTimer();
}

export function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function updateHeroTimer(): void {
    const hero = $('timer-hero');
    const timeEl = $('timer-hero-time');
    const nameEl = $('timer-hero-name');
    const ringEl = $('timer-ring-progress') as HTMLElement | null;

    if (!hero || !timeEl) return;

    const t = timers.find(x => x.id === focusedTimerId);

    if (!t) {
        hero.className = 'timer-hero';
        timeEl.textContent = '0:00';
        if (nameEl) nameEl.textContent = 'Kein Timer';
        if (ringEl) ringEl.style.strokeDashoffset = '283';
        return;
    }

    const status = t.remainingSeconds === 0 ? 'expired' : t.running ? 'active' : 'paused';
    hero.className = 'timer-hero ' + status;
    timeEl.textContent = formatTime(t.remainingSeconds);
    if (nameEl) nameEl.textContent = t.name;

    // Update ring progress (283 is circumference)
    if (ringEl && t.totalSeconds > 0) {
        const progress = t.remainingSeconds / t.totalSeconds;
        ringEl.style.strokeDashoffset = String(283 * (1 - progress));
    }
}

export function renderTimers(): void {
    const c = $('timer-list');
    if (!c) return;

    if (!timers.length) {
        c.innerHTML = '<div class="timer-empty">Klicke + oder eine Vorlage</div>';
        return;
    }

    c.innerHTML = timers.map(t => {
        const status = t.remainingSeconds === 0 ? 'expired' : t.running ? 'running' : 'paused';
        const focused = t.id === focusedTimerId ? 'focused' : '';
        return `<div class="timer-card ${status} ${focused}" data-action="focus-timer" data-id="${t.id}">
            <div class="timer-card-actions">
                <button class="timer-card-btn" data-action="toggle-timer" data-id="${t.id}">${t.running ? '⏸' : '▶'}</button>
                <button class="timer-card-btn" data-action="reset-timer" data-id="${t.id}">↺</button>
                <button class="timer-card-btn delete" data-action="delete-timer" data-id="${t.id}">✕</button>
            </div>
            <div class="timer-card-time">${formatTime(t.remainingSeconds)}</div>
            <div class="timer-card-name">${esc(t.name)}</div>
        </div>`;
    }).join('');
}

export function startRoundTimer(): void {
    const roundsInput = $('round-timer-rounds') as HTMLInputElement | null;
    if (!roundsInput) return;

    const rounds = parseInt(roundsInput.value) || 10;
    roundTimer = { rounds, currentRound: 1, secondsInRound: 6 };

    const startBtn = $('round-timer-start-btn');
    const stopBtn = $('round-timer-stop-btn');
    if (startBtn) (startBtn as HTMLElement).style.display = 'none';
    if (stopBtn) (stopBtn as HTMLElement).style.display = 'inline-block';

    const display = $('round-timer-display');
    if (display) display.innerHTML = `<span style="color: var(--green);">▶</span> Runde 1/${rounds} — 6s`;

    roundTimerInterval = window.setInterval(() => {
        if (!roundTimer) {
            if (roundTimerInterval) clearInterval(roundTimerInterval);
            roundTimerInterval = null;
            return;
        }

        roundTimer.secondsInRound--;
        if (roundTimer.secondsInRound <= 0) {
            roundTimer.currentRound++;
            roundTimer.secondsInRound = 6;
        }

        if (roundTimer.currentRound > roundTimer.rounds) {
            const display = $('round-timer-display');
            if (display) display.innerHTML = `<span style="color:var(--green);">✓ ${rounds} Runden abgeschlossen!</span>`;
            stopRoundTimer();
            showToast(`⚔️ ${rounds} Kampfrunden beendet!`);
            return;
        }

        const display = $('round-timer-display');
        if (display) display.innerHTML = `<span style="color: var(--green);">▶</span> Runde ${roundTimer.currentRound}/${roundTimer.rounds} — ${roundTimer.secondsInRound}s`;
    }, 1000);
}

export function stopRoundTimer(): void {
    if (roundTimerInterval) {
        clearInterval(roundTimerInterval);
        roundTimerInterval = null;
    }
    roundTimer = null;

    const startBtn = $('round-timer-start-btn');
    const stopBtn = $('round-timer-stop-btn');
    if (startBtn) (startBtn as HTMLElement).style.display = 'inline-block';
    if (stopBtn) (stopBtn as HTMLElement).style.display = 'none';

    const display = $('round-timer-display');
    if (display && display.innerHTML.indexOf('abgeschlossen') === -1) {
        display.innerHTML = '<span style="color:var(--yellow);">⏹ Gestoppt</span>';
    }
}

// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================

(window as any).timers = timers;
(window as any).renderTimerPresets = renderTimerPresets;
(window as any).renderPresetList = renderPresetList;
(window as any).setPresetEmoji = setPresetEmoji;
(window as any).saveTimerPreset = saveTimerPreset;
(window as any).editTimerPreset = editTimerPreset;
(window as any).cancelPresetEdit = cancelPresetEdit;
(window as any).deleteTimerPreset = deleteTimerPreset;
(window as any).addPresetTimer = addPresetTimer;
(window as any).quickTimer = quickTimer;
(window as any).createTimer = createTimer;
(window as any).focusTimer = focusTimer;
(window as any).toggleTimer = toggleTimer;
(window as any).heroTimerToggle = heroTimerToggle;
(window as any).heroTimerReset = heroTimerReset;
(window as any).resetTimer = resetTimer;
(window as any).deleteTimer = deleteTimer;
(window as any).formatTime = formatTime;
(window as any).renderTimers = renderTimers;
(window as any).startRoundTimer = startRoundTimer;
(window as any).stopRoundTimer = stopRoundTimer;
