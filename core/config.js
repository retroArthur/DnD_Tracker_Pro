// [SECTION:CONFIG]
// ============================================================
// APP_CONFIG - @config @settings @version
// TypeScript Migration: Converted from core/config.js
// ============================================================
const APP_CONFIG = Object.freeze({
    // Version
    VERSION: '2.6.1',
    // Debug & Performance
    DEBUG_MODE: true, // Set false for production; enables validation warnings
    DEBUG_VALIDATE_ON_SAVE: true, // Validate data integrity before every save
    DEBUG_VALIDATE_ON_RENDER: false, // Validate before render (expensive, only for debugging)
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
    SESSION_AUTO_SAVE_INTERVAL: 300, // 5 Minuten in Sekunden
    // Limits
    UNDO_LIMIT: 30,
    // Byte-Budget ueber den GESAMTEN Undo-Stack, zusaetzlich zu UNDO_LIMIT (PERF-01/D-09b).
    // 64 MB liegt bewusst ueber dem Alltag: eine Kampagne unterhalb der localStorage-Schwelle
    // von 5 MB belegt bei 30 Snapshots real 15-60 MB — der Deckel faengt nur den Ausreisser.
    UNDO_BYTE_BUDGET_MB: 64,
    // Untergrenze: die Undo-Tiefe darf bei einer sehr grossen Kampagne nie unter diese Anzahl
    // Eintraege fallen, sonst verliert der Spielleiter die Ruecknahme still (PERF-01/D-09b).
    UNDO_MIN_ENTRIES: 5,
    // Harter Deckel auf die Datensatzzahl im "diceStats"-IndexedDB-Store (PERF-02/D-11).
    // Beim Ueberschreiten werden die AELTESTEN Datensaetze verdraengt (kleinste autoIncrement-
    // Keys zuerst) — NIEMALS zeit- oder sitzungsbasiert, das wuerde unbemerkt genau die
    // Langzeitauswertung zerstoeren, fuer die der Store existiert ("meine Wuerfel hassen mich
    // seit drei Jahren"). Vom Nutzer entschieden (Task-1-Checkpoint, 13-07-PLAN.md): 50.000
    // Datensaetze ≈ 10 MB bei ~200 Byte/Datensatz — bleibt innerhalb des in Phase 12 bewerteten
    // ~15-MB-Rahmens (12-CONTEXT.md, offene Frage 3) und entspricht bei 300 Wuerfen/Sitzung und
    // 50 Sitzungen/Jahr gut drei Jahren durchgehend woechentlichen Spiels — greift fuer einen
    // realen Spielleiter praktisch nie. Verdraengte Wuerfe sind unwiederbringlich (IndexedDB
    // liegt ausserhalb von window.D und damit ausserhalb des Undo-Stacks), deshalb die
    // grosszuegige Wahl statt einer knappen.
    DICE_STATS_MAX_RECORDS: 50000,
    MAX_BACKUPS: 5,
    MAX_BACKUP_SIZE_MB: 2,
    // Timing (in Millisekunden)
    BACKUP_INTERVAL: 5 * 60 * 1000, // 5 Minuten
    AUTOSAVE_DELAY: 1500,
    TOAST_DURATION: 2000,
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
    // Animation Timing
    ANIMATION_QUICK: 100, // Schnelle Animationen (Focus, kleine Übergänge)
    ANIMATION_NORMAL: 200, // Standard-Animationen (Skalierung, Fade)
    ANIMATION_SLOW: 300, // Langsame Animationen (Dice-Roll, Collapse)
    ANIMATION_FEEDBACK: 400, // Feedback-Animationen (Button-Roll)
    MODAL_TRANSITION: 300, // Modal öffnen/schließen
    CONFETTI_DURATION: 1500, // Confetti-Animation bei Nat 20
    HIGHLIGHT_DURATION: 2000, // Highlight-Effekte (z.B. Box-Shadow)
    // Performance
    VIRTUAL_SCROLL_THRESHOLD: 50,
    LAZY_LOAD_THRESHOLD: '200px',
    // D&D Spezifisch
    MAX_LEVEL: 20,
    ATTRIBUTE_MIN: 1,
    ATTRIBUTE_MAX: 30
});

// Export to global scope
window.APP_CONFIG = APP_CONFIG;
