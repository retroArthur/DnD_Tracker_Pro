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
    
    // Performance
    VIRTUAL_SCROLL_THRESHOLD: 50,
    LAZY_LOAD_THRESHOLD: '200px',
    
    // D&D Spezifisch
    MAX_LEVEL: 20,
    ATTRIBUTE_MIN: 1,
    ATTRIBUTE_MAX: 30,
});
