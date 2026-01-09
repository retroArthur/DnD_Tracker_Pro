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
declare const APP_CONFIG: any;
declare const StorageAPI: any;
declare let timers: Timer[];
declare let timerInterval: number | null;
declare let roundTimer: RoundTimer | null;
declare let roundTimerInterval: number | null;
declare let focusedTimerId: number | null;
declare const TIMER_PRESETS_KEY: string;
declare function getTimerPresets(): TimerPreset[];
declare function saveTimerPresets(presets: TimerPreset[]): void;
declare function renderTimerPresets(): void;
declare function formatPresetTime(h: number, m: number, s: number): string;
declare function renderPresetList(): void;
declare function setPresetEmoji(emoji: string): void;
declare function saveTimerPreset(): void;
declare function editTimerPreset(index: number): void;
declare function cancelPresetEdit(): void;
declare function clearPresetForm(): void;
declare function deleteTimerPreset(index: number): void;
declare function quickTimer(seconds: number): void;
declare function addTimerWithSeconds(name: string, totalSeconds: number): void;
declare function createTimer(): void;
declare function startTimerInterval(): void;
declare function focusTimer(id: number): void;
declare function toggleTimer(id: number): void;
declare function heroTimerToggle(): void;
declare function heroTimerReset(): void;
declare function resetTimer(id: number): void;
declare function deleteTimer(id: number): void;
declare function formatTime(seconds: number): string;
declare function updateHeroTimer(): void;
declare function renderTimers(): void;
declare function startRoundTimer(): void;
declare function stopRoundTimer(): void;
//# sourceMappingURL=timers.d.ts.map