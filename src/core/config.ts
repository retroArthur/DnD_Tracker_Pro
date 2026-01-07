// [SECTION:CONFIG]
// ============================================================
// APP_CONFIG - @config @settings @version
// TypeScript Migration: Converted from core/config.js
// ============================================================

export interface AppConfig {
    // Version
    VERSION: string;

    // Debug & Performance
    DEBUG_MODE: boolean;
    DEBUG_VALIDATE_ON_SAVE: boolean;
    DEBUG_VALIDATE_ON_RENDER: boolean;
    PERF_MODE: boolean;
    
    // Storage Keys
    STORAGE_KEY: string;
    BACKUP_KEY: string;
    CAMPAIGN_INDEX_KEY: string;
    THEME_KEY: string;
    LAYOUT_KEY: string;
    DICE_FAV_KEY: string;
    TIMER_PRESETS_KEY: string;
    IDB_NAME: string;
    BROADCAST_CHANNEL: string;
    SW_CACHE_NAME: string;

    // Session Timer
    SESSION_AUTO_SAVE_INTERVAL: number;
    
    // Limits
    UNDO_LIMIT: number;
    MAX_BACKUPS: number;
    MAX_BACKUP_SIZE_MB: number;
    
    // Timing (in Millisekunden)
    BACKUP_INTERVAL: number;
    AUTOSAVE_DELAY: number;
    TOAST_DURATION: number;
    DEBOUNCE_DELAY: number;
    THROTTLE_DELAY: number;

    // Animation Timing
    ANIMATION_QUICK: number;
    ANIMATION_NORMAL: number;
    ANIMATION_SLOW: number;
    ANIMATION_FEEDBACK: number;
    MODAL_TRANSITION: number;
    CONFETTI_DURATION: number;
    HIGHLIGHT_DURATION: number;
    
    // Performance
    VIRTUAL_SCROLL_THRESHOLD: number;
    LAZY_LOAD_THRESHOLD: string;
    
    // D&D Spezifisch
    MAX_LEVEL: number;
    ATTRIBUTE_MIN: number;
    ATTRIBUTE_MAX: number;
}

export const APP_CONFIG: Readonly<AppConfig> = Object.freeze({
    // Version
    VERSION: '2.6.0',

    // Debug & Performance
    DEBUG_MODE: true,  // Set false for production; enables validation warnings
    DEBUG_VALIDATE_ON_SAVE: true,  // Validate data integrity before every save
    DEBUG_VALIDATE_ON_RENDER: false,  // Validate before render (expensive, only for debugging)
    PERF_MODE: true,
    
    // Storage Keys
    STORAGE_KEY: 'dnd-tracker-v4',
    BACKUP_KEY: 'dnd-tracker-backups',
    CAMPAIGN_INDEX_KEY: 'dnd-tracker-campaigns',
    THEME_KEY: 'dnd-tracker-theme',
    LAYOUT_KEY: 'dnd-tracker-layout',
    DICE_FAV_KEY: 'dnd-dice-favorites',
    TIMER_PRESETS_KEY: 'dnd-timer-presets',
    IDB_NAME: 'dnd-tracker-db',
    BROADCAST_CHANNEL: 'dnd-tracker-sync',
    SW_CACHE_NAME: 'dnd-tracker-v2',

    // Session Timer
    SESSION_AUTO_SAVE_INTERVAL: 300,  // 5 Minuten in Sekunden
    
    // Limits
    UNDO_LIMIT: 30,
    MAX_BACKUPS: 5,
    MAX_BACKUP_SIZE_MB: 2,
    
    // Timing (in Millisekunden)
    BACKUP_INTERVAL: 5 * 60 * 1000,  // 5 Minuten
    AUTOSAVE_DELAY: 1500,
    TOAST_DURATION: 2000,
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,

    // Animation Timing
    ANIMATION_QUICK: 100,        // Schnelle Animationen (Focus, kleine Übergänge)
    ANIMATION_NORMAL: 200,       // Standard-Animationen (Skalierung, Fade)
    ANIMATION_SLOW: 300,         // Langsame Animationen (Dice-Roll, Collapse)
    ANIMATION_FEEDBACK: 400,     // Feedback-Animationen (Button-Roll)
    MODAL_TRANSITION: 300,       // Modal öffnen/schließen
    CONFETTI_DURATION: 1500,     // Confetti-Animation bei Nat 20
    HIGHLIGHT_DURATION: 2000,    // Highlight-Effekte (z.B. Box-Shadow)
    
    // Performance
    VIRTUAL_SCROLL_THRESHOLD: 50,
    LAZY_LOAD_THRESHOLD: '200px',
    
    // D&D Spezifisch
    MAX_LEVEL: 20,
    ATTRIBUTE_MIN: 1,
    ATTRIBUTE_MAX: 30,
});
