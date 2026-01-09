declare const APP_CONFIG: any;
declare const D: any;
declare const SESSION_AUTO_SAVE_INTERVAL: number;
declare let sessionTimerInterval: number | null;
declare let sessionTimerSeconds: number;
declare let sessionTimerRunning: boolean;
declare function formatSessionTime(totalSeconds: number): string;
declare function updateSessionTimerDisplay(): void;
declare function toggleSessionTimer(): void;
declare function resetSessionTimer(): void;
declare function initSessionTimer(): void;
//# sourceMappingURL=session-timer.d.ts.map