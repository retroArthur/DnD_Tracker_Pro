const STORAGE_KEY = window.APP_CONFIG.STORAGE_KEY;
function initializeData() {
    return {
        locations: [],
        npcs: [],
        quests: [],
        characters: [],
        sessionNotes: [],
        storyArcs: [],
        quickNotes: '',
        initiative: {
            combatants: [],
            currentTurn: 0,
            round: 1
        },
        loot: [],
        encounters: [],
        spells: [],
        links: [],
        wiki: [],
        filters: [],
        calendar: {
            day: 1,
            month: 0,
            year: 1492,
            events: []
        },
        tags: [],
        settings: {
            theme: 'dark',
            lastView: 'dashboard',
            enableMarkdownShortcuts: true,
            enableMarkdownImportExport: true,
            markdownOnboardingSeen: false,
            // Phase 6: Spieler-Verwaltung
            // 'xp' = XP-basierter Aufstieg | 'milestone' = manueller Level-Bump
            levelingMode: 'xp'
        },
        _nextId: {},
        // ============================================================
        // CHARAKTER-SCHEMA — Feldübersicht (alle Felder in saveCharacter/editChar)
        // ============================================================
        // Jedes character-Objekt in D.characters[] enthält (Phase 6 Ergänzungen):
        //   xp: Number (Standard 0) — kumulativer XP-Stand; Migration 5.0.0 backfills
        //   skillProficiencies: {} — Schlüssel = SKILL_INFO-Keys, Wert = true/false
        //   skillExpertise: {} — Schlüssel = SKILL_INFO-Keys, Wert = true (doppelter Übungsbonus)
        //   attacks: [] — Array von { name: string, attackBonus: number|string, damage: string, damageType?: string }
        // Bearbeitung und Lesen: party-crud.js (saveCharacter/editChar), Anzeige: party-details.js
        // Phase 3: Bestiary
        bestiary: [],            // Eigene Kreaturen (CRUD + Undo + Export)
        bestiaryFavorites: [],   // Nur ID-Keys (SRD: String-Key, Eigene: 'custom:123')
        // Phase 5: Welt & Story
        sessionPreps: [],        // WELT-01 Session-Prep-Assistent
        factions: [],            // WELT-05 Fraktionen & Ruf
        // Phase 7: Soundboard — Szenen-Konfiguration (Blobs NICHT in D — nur IDB)
        soundboard: {
            scenes: []           // [{ id, name, slot, tracks:[{ blobId, volume }] }]
        }
    };
}

// Initialize global D object
window.D = initializeData();

// Export functions
window.initializeData = initializeData;

// ============================================================
// KAMPAGNEN-GRUNDLAGE (Code-Review 2026-09-21, R01/R03/R07)
// Gemeinsame Bausteine fuer Restore, Import und Kampagnenwechsel. initializeData()
// oben bleibt bewusst unveraendert (Monat 0 und fehlendes _version: E2E-Seeds und
// die Erstsitzung haengen daran).
// ============================================================
/**
 * Schluessel, die aus fremden Daten (Dateien, Backups) nie als Eigenschaft uebernommen
 * werden: ein "__proto__"-Datenschluessel wuerde per Zuweisung den Prototyp setzen.
 */
const CAMPAIGN_FORBIDDEN_KEYS = Object.freeze(['__proto__', 'constructor', 'prototype']);
/**
 * Einziger Resolver fuer "welche Kampagne zeigt dieser Tab?".
 * Liest die globale STORAGE_KEY-Konstante dieser Datei (= APP_CONFIG.STORAGE_KEY), NICHT
 * window.STORAGE_KEY: die funktionslokalen `const STORAGE_KEY = window.STORAGE_KEY`-
 * Schatten anderer Module sind im Loader-Modus undefined — U7 stellt sie auf diese
 * Funktion um.
 * @returns Aktiver Kampagnen-Speicherschluessel oder null
 */
function getActiveCampaignKey() {
    const k = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
    return typeof k === 'string' && k !== '' ? k : null;
}
/**
 * Ersetzt den Inhalt von target vollstaendig durch next — das eine Idiom, um D in place
 * zu ersetzen (D ist const; Object.assign(D, x) wuerde fehlende Alt-Schluessel behalten).
 * Restore (U4), Import (U6) und Kampagnen-Loeschung (U3) benutzen es.
 * Erst werden alle eigenen Schluessel von target geloescht, dann jeder eigene aufzaehlbare
 * Schluessel von next per einfacher Zuweisung uebernommen (ausser CAMPAIGN_FORBIDDEN_KEYS).
 * @param target - Zu ersetzendes Objekt (in der Regel window.D)
 * @param next - Neuer Inhalt (z. B. normalizeCampaignData(...).data)
 * @returns target
 */
function replaceCampaignData(target, next) {
    for (const key of Object.keys(target)) {
        delete target[key];
    }
    for (const key of Object.keys(next)) {
        if (CAMPAIGN_FORBIDDEN_KEYS.includes(key)) continue;
        target[key] = next[key];
    }
    return target;
}
window.CAMPAIGN_FORBIDDEN_KEYS = CAMPAIGN_FORBIDDEN_KEYS;
window.getActiveCampaignKey = getActiveCampaignKey;
window.replaceCampaignData = replaceCampaignData;
