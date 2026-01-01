// ============================================================
// APP_CONFIG - Zentrale Anwendungskonfiguration
// ============================================================
const APP_CONFIG = Object.freeze({
    // Version
    VERSION: '2.6.0',
    
    // Debug & Performance
    DEBUG_MODE: false,
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
