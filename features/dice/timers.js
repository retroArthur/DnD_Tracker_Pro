// [SECTION:TIMERS]
// Extrahiert aus dice.js
// Timer-Funktionen - Redesigned
// Zeilen: 364
// ============================================================
// TIMERS
// ============================================================
var APP_CONFIG = window.APP_CONFIG;
var StorageAPI = window.StorageAPI;
let timers = [];
let timerInterval = null;
let roundTimer = null;
let roundTimerInterval = null;
let focusedTimerId = null;
const TIMER_PRESETS_KEY = APP_CONFIG.TIMER_PRESETS_KEY;
function getTimerPresets() {
    return StorageAPI.getJSON(TIMER_PRESETS_KEY, []);
}
function saveTimerPresets(presets) {
    StorageAPI.setJSON(TIMER_PRESETS_KEY, presets);
}
function renderTimerPresets() {
    const presets = getTimerPresets();
    const container = $('timer-presets');
    if (!container)
        return;
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
function formatPresetTime(h, m, s) {
    const parts = [];
    if (h > 0)
        parts.push(`${h}h`);
    if (m > 0)
        parts.push(`${m}m`);
    if (s > 0)
        parts.push(`${s}s`);
    return parts.length ? parts.join(' ') : '0m';
}
function renderPresetList() {
    const presets = getTimerPresets();
    const container = $('preset-list');
    if (!container)
        return;
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
function setPresetEmoji(emoji) {
    const input = $('preset-emoji');
    if (input)
        input.value = emoji;
}
function saveTimerPreset() {
    const editIndexInput = $('edit-preset-index');
    const nameInput = $('preset-name');
    const emojiInput = $('preset-emoji');
    const hoursInput = $('preset-hours');
    const minutesInput = $('preset-minutes');
    const secondsInput = $('preset-seconds');
    if (!editIndexInput || !nameInput || !emojiInput || !hoursInput || !minutesInput || !secondsInput)
        return;
    const editIndex = editIndexInput.value;
    const name = nameInput.value.trim();
    const emoji = emojiInput.value.trim();
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    if (hours === 0 && minutes === 0 && seconds === 0) {
        showToast('⚠️ Zeit muss größer als 0 sein', 'error');
        return;
    }
    const presets = getTimerPresets();
    const presetData = { name, emoji, hours, minutes, seconds };
    if (editIndex !== '') {
        presets[parseInt(editIndex)] = presetData;
        showToast('Vorlage aktualisiert');
    }
    else {
        presets.push(presetData);
        showToast('Vorlage hinzugefügt');
    }
    saveTimerPresets(presets);
    clearPresetForm();
    renderPresetList();
    renderTimerPresets();
}
function editTimerPreset(index) {
    const presets = getTimerPresets();
    const p = presets[index];
    if (!p)
        return;
    $('edit-preset-index').value = String(index);
    $('preset-name').value = p.name || '';
    $('preset-emoji').value = p.emoji || '';
    $('preset-hours').value = String(p.hours || 0);
    $('preset-minutes').value = String(p.minutes || 0);
    $('preset-seconds').value = String(p.seconds || 0);
    const saveBtn = $('preset-save-btn');
    const cancelBtn = $('preset-cancel-btn');
    if (saveBtn)
        saveBtn.textContent = 'Vorlage speichern';
    if (cancelBtn)
        cancelBtn.style.display = 'inline-block';
}
function cancelPresetEdit() {
    clearPresetForm();
}
function clearPresetForm() {
    $('edit-preset-index').value = '';
    $('preset-name').value = '';
    $('preset-emoji').value = '';
    $('preset-hours').value = '0';
    $('preset-minutes').value = '10';
    $('preset-seconds').value = '0';
    const saveBtn = $('preset-save-btn');
    const cancelBtn = $('preset-cancel-btn');
    if (saveBtn)
        saveBtn.textContent = 'Vorlage hinzufügen';
    if (cancelBtn)
        cancelBtn.style.display = 'none';
}
function deleteTimerPreset(index) {
    const presets = getTimerPresets();
    presets.splice(index, 1);
    saveTimerPresets(presets);
    renderPresetList();
    renderTimerPresets();
}
function addPresetTimer(name, totalSeconds) {
    addTimerWithSeconds(name, totalSeconds);
}
function quickTimer(seconds) {
    const name = seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds / 60)}m` : `${Math.floor(seconds / 3600)}h`;
    addTimerWithSeconds(name, seconds);
}
function addTimerWithSeconds(name, totalSeconds) {
    const timer = {
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
function createTimer() {
    const nameInput = $('timer-name');
    const hoursInput = $('timer-hours');
    const minutesInput = $('timer-minutes');
    const secondsInput = $('timer-seconds');
    if (!nameInput || !hoursInput || !minutesInput || !secondsInput)
        return;
    const name = nameInput.value.trim() || 'Timer';
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 0) {
        showToast('⚠️ Timer muss größer als 0 sein', 'error');
        return;
    }
    addTimerWithSeconds(name, totalSeconds);
    hideModal('timer-modal');
    nameInput.value = '';
    hoursInput.value = '0';
    minutesInput.value = '10';
    secondsInput.value = '0';
}
function startTimerInterval() {
    if (timerInterval)
        return;
    timerInterval = window.setInterval(() => {
        let anyRunning = false;
        timers.forEach(t => {
            if (t.running && t.remainingSeconds > 0) {
                t.remainingSeconds--;
                anyRunning = true;
                if (t.remainingSeconds === 0) {
                    showToast(`⏰ ${t.name} abgelaufen!`);
                    // Play sound if available
                    try {
                        new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp2SfW1paXqKlZqTgXJkaGyBjJSQgXJkaG2BjZaTgXFkZ22BjpeTf3BjZm2BjpeTfm9iZWyAjpeTfW5hZGuAjpeUfG1gY2qAjpiUe2xfYml/jpiVeWtdYWh+jZmWd2pcYGd9jZqXdWhaX2Z8jJqYc2dZXmV7jJuZcWZYXWR6i5uacGRXXGN5i5ybbl9UWWF3ipydbV5TV2B2iZ2fbFxSVl91iJ6ga1pRVV5zh56halxSVl5yhp+iaFpQVF1xhZ+jZldPU1xvhaCkZFZOUlpug6GmYlNMUFlsf6GoYFFLTldqfaKqXk5KTVZoeaOsW0xJTFVmdKSuWUpISlNjcaSwVkdGSVFhbaWyU0RDRU9eaaazUEFCQ01aZaezTj9AQUpXYqWzSz49PkhTXaS0SD07O0ZQWaO1RTk5OUNMVaC3Qjc2NUBJTJ23Pzc1Mz1GSJq4PDQyMTtDRJa5OS8vLjdAPJO6Ni0sKzU8N4+7My4rKjQ5No69MSssKTM3MYu+LissKDI1LoS/KyoqJzAzK4DBKSknJC4xKXvCJycmIywvJnbDJicmISouInDFJSYlICksH2vGIyQjHycrHGfIIiMiHCUnGGHJICEgGSIlFVzLHyEfFyAiFVfNHB8cFR0gEVLOGR0aFBobDk3PFxoXEhYYC0fQFBkVERQUCEPRERcSEBIRADzTDhQQDg8PAzbUCxMNDA0MAzHVCA8LCgsKASvWBQ4JCAYHAB/XAw0HBwUEABbYAQoGBQQDAA/Y/wcFAwMCAArZ/AQCAQEBAP/Z+gIAAAEAAP/a+AAAAAAAAP/a+AAAAAAAAP/a+QAAAAAAAAAAAAAAAAAAAAAAAAAAAA==').play();
                    }
                    catch (e) { }
                }
            }
        });
        if (!anyRunning) {
            if (timerInterval)
                clearInterval(timerInterval);
            timerInterval = null;
        }
        renderTimers();
        updateHeroTimer();
    }, 1000);
}
function focusTimer(id) {
    focusedTimerId = id;
    renderTimers();
    updateHeroTimer();
}
function toggleTimer(id) {
    const t = timers.find(x => x.id === id);
    if (t) {
        t.running = !t.running;
        if (t.running)
            startTimerInterval();
        renderTimers();
        updateHeroTimer();
    }
}
function heroTimerToggle() {
    if (focusedTimerId) {
        toggleTimer(focusedTimerId);
    }
}
function heroTimerReset() {
    if (focusedTimerId) {
        resetTimer(focusedTimerId);
    }
}
function resetTimer(id) {
    const t = timers.find(x => x.id === id);
    if (t) {
        t.remainingSeconds = t.totalSeconds;
        t.running = false;
        renderTimers();
        updateHeroTimer();
    }
}
function deleteTimer(id) {
    timers = timers.filter(t => t.id !== id);
    if (focusedTimerId === id) {
        focusedTimerId = timers.length > 0 ? timers[0].id : null;
    }
    renderTimers();
    updateHeroTimer();
}
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}
function updateHeroTimer() {
    const hero = $('timer-hero');
    const timeEl = $('timer-hero-time');
    const nameEl = $('timer-hero-name');
    const ringEl = $('timer-ring-progress');
    if (!hero || !timeEl)
        return;
    const t = timers.find(x => x.id === focusedTimerId);
    if (!t) {
        hero.className = 'timer-hero';
        timeEl.textContent = '0:00';
        if (nameEl)
            nameEl.textContent = 'Kein Timer';
        if (ringEl)
            ringEl.style.strokeDashoffset = '283';
        return;
    }
    const status = t.remainingSeconds === 0 ? 'expired' : t.running ? 'active' : 'paused';
    hero.className = 'timer-hero ' + status;
    timeEl.textContent = formatTime(t.remainingSeconds);
    if (nameEl)
        nameEl.textContent = t.name;
    // Update ring progress (283 is circumference)
    if (ringEl && t.totalSeconds > 0) {
        const progress = t.remainingSeconds / t.totalSeconds;
        ringEl.style.strokeDashoffset = String(283 * (1 - progress));
    }
}
function renderTimers() {
    const c = $('timer-list');
    if (!c)
        return;
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
function startRoundTimer() {
    const roundsInput = $('round-timer-rounds');
    if (!roundsInput)
        return;
    const rounds = parseInt(roundsInput.value) || 10;
    roundTimer = { rounds, currentRound: 1, secondsInRound: 6 };
    const startBtn = $('round-timer-start-btn');
    const stopBtn = $('round-timer-stop-btn');
    if (startBtn)
        startBtn.style.display = 'none';
    if (stopBtn)
        stopBtn.style.display = 'inline-block';
    const display = $('round-timer-display');
    if (display)
        display.innerHTML = `<span style="color: var(--green);">▶</span> Runde 1/${rounds} — 6s`;
    roundTimerInterval = window.setInterval(() => {
        if (!roundTimer) {
            if (roundTimerInterval)
                clearInterval(roundTimerInterval);
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
            if (display)
                display.innerHTML = `<span style="color:var(--green);">✓ ${rounds} Runden abgeschlossen!</span>`;
            stopRoundTimer();
            showToast(`⚔️ ${rounds} Kampfrunden beendet!`);
            return;
        }
        const display = $('round-timer-display');
        if (display)
            display.innerHTML = `<span style="color: var(--green);">▶</span> Runde ${roundTimer.currentRound}/${roundTimer.rounds} — ${roundTimer.secondsInRound}s`;
    }, 1000);
}
function stopRoundTimer() {
    if (roundTimerInterval) {
        clearInterval(roundTimerInterval);
        roundTimerInterval = null;
    }
    roundTimer = null;
    const startBtn = $('round-timer-start-btn');
    const stopBtn = $('round-timer-stop-btn');
    if (startBtn)
        startBtn.style.display = 'inline-block';
    if (stopBtn)
        stopBtn.style.display = 'none';
    const display = $('round-timer-display');
    if (display && display.innerHTML.indexOf('abgeschlossen') === -1) {
        display.innerHTML = '<span style="color:var(--yellow);">⏹ Gestoppt</span>';
    }
}
// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================
window.timers = timers;
window.renderTimerPresets = renderTimerPresets;
window.renderPresetList = renderPresetList;
window.setPresetEmoji = setPresetEmoji;
window.saveTimerPreset = saveTimerPreset;
window.editTimerPreset = editTimerPreset;
window.cancelPresetEdit = cancelPresetEdit;
window.deleteTimerPreset = deleteTimerPreset;
window.addPresetTimer = addPresetTimer;
window.quickTimer = quickTimer;
window.createTimer = createTimer;
window.focusTimer = focusTimer;
window.toggleTimer = toggleTimer;
window.heroTimerToggle = heroTimerToggle;
window.heroTimerReset = heroTimerReset;
window.resetTimer = resetTimer;
window.deleteTimer = deleteTimer;
window.formatTime = formatTime;
window.renderTimers = renderTimers;
window.startRoundTimer = startRoundTimer;
window.stopRoundTimer = stopRoundTimer;
//# sourceMappingURL=timers.js.map