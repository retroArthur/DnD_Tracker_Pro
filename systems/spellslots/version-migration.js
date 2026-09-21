// [SECTION:VERSION_MIGRATION]
// Extrahiert aus spellslots.js
// Versionierung & Migration
// Zeilen: 86
// VERSIONIERUNG & MIGRATION
// ============================================================
// Alias für Rückwärtskompatibilität
const CURRENT_VERSION = window.APP_CONFIG.VERSION;
const MIGRATIONS = {
    '2.3.0': data => {
        // Migration von 2.2 auf 2.3: Zustaende (conditions) als Objekte {type, name[, addedAt]} —
        // das Format, das systems/conditions.js schreibt und renderConditionsBar liest.
        // Code-Review 2026-09-21 (R01-Skeptiker): diese Migration hat frueher die AKTUELLEN
        // Objekte zu Zeichenketten reduziert (eigene Zustandsnamen verloren, Chips nicht mehr
        // darstellbar) — und sie laeuft auf jedem versionslosen Stand (jede Erstsitzung).
        // Jetzt nicht zerstoerend: Objekte mit String-`type` bleiben unveraendert,
        // Alt-Zeichenketten werden zu Objekten repariert, alles andere wird verworfen.
        if (!Array.isArray(data.characters)) return data;
        const conditionInfo = window.CONDITIONS;
        data.characters.forEach(c => {
            if (!c || !Array.isArray(c.conditions)) return;
            c.conditions = c.conditions
                .map(cond => {
                    if (
                        cond !== null &&
                        typeof cond === 'object' &&
                        !Array.isArray(cond) &&
                        typeof cond.type === 'string'
                    ) {
                        return cond;
                    }
                    if (typeof cond === 'string') {
                        const known =
                            conditionInfo &&
                            Object.prototype.hasOwnProperty.call(conditionInfo, cond)
                                ? conditionInfo[cond]
                                : null;
                        return { type: cond, name: (known && known.name) || cond };
                    }
                    return null;
                })
                .filter(cond => cond !== null);
        });
        return data;
    },
    '2.4.0': data => {
        // Migration auf 2.4
        // Zauberslots initialisieren
        const getSpellSlotsForClass = window.getSpellSlotsForClass;
        data.characters?.forEach(c => {
            if (!c.spellSlotsMax) {
                c.spellSlotsMax = getSpellSlotsForClass(c.characterClass, c.level || 1);
            }
            if (!c.spellSlotsUsed) {
                c.spellSlotsUsed = [0, 0, 0, 0, 0, 0, 0, 0, 0];
            }
        });
        // Kalender initialisieren
        if (!data.calendar) {
            data.calendar = {
                day: 1,
                month: 4, // Mirtul
                year: 1492,
                events: []
            };
        }
        // Quest timestamps
        data.quests?.forEach(q => {
            if (!q.createdAt) {
                q.createdAt = Date.now();
            }
        });
        return data;
    },
    '2.6.1': data => {
        // STAB-02 / D-09: Smart-Strip — leere mindmap-Seeds still entfernen
        if (data.mindmap) {
            const hasRealContent =
                (data.mindmap.nodes && data.mindmap.nodes.length > 0) ||
                (data.mindmap.connections && data.mindmap.connections.length > 0);
            if (!hasRealContent) {
                delete data.mindmap; // leerer Seed -> still entfernen
            }
            // Echte Inhalte bleiben hier unangetastet — der Import-Pfad (import-export.js)
            // loest VOR migrateData() den Hinweis-Dialog + Export aus (D-09/D-10).
        }
        return data;
    },
    '3.0.0': data => {
        // Phase 3: Bestiary — eigene Kreaturen und Favoriten initialisieren
        if (!data.bestiary)          data.bestiary          = [];
        if (!data.bestiaryFavorites) data.bestiaryFavorites = [];
        return data;
    },
    '4.0.0': data => {
        // Phase 5: Welt & Story
        // Session-Prep-Container anlegen
        if (!data.sessionPreps) data.sessionPreps = [];
        // Fraktionen-Container anlegen
        if (!data.factions) data.factions = [];
        // Kalender-Monat: 0-basiert -> 1-basiert (Hammer = 1)
        // T-05-01: Nur konvertieren wenn calendar existiert UND month < 1
        // (data.calendar.month || 0) + 1 verhindert NaN/undefined; idempotent
        if (data.calendar && data.calendar.month < 1) {
            data.calendar.month = (data.calendar.month || 0) + 1;
        }
        return data;
    },
    '5.0.0': data => {
        // Phase 6: Spieler-Verwaltung
        // Neue Charakter-Felder: xp, skillProficiencies, skillExpertise, attacks[]
        // T-06-01: Optional chaining schuetzt gegen fehlendes/kein-Array characters
        data.characters?.forEach(ch => {
            // xp: Number, Default 0 — NICHT überschreiben wenn bereits vorhanden
            if (ch.xp === undefined) ch.xp = 0;
            // skillProficiencies: {} keyed by SKILL_INFO keys
            if (!ch.skillProficiencies) ch.skillProficiencies = {};
            // skillExpertise: {} keyed by SKILL_INFO keys (Expertise = doppelter Übungsbonus)
            if (!ch.skillExpertise) ch.skillExpertise = {};
            // attacks: [] von {name, attackBonus, damage, damageType?}
            if (!ch.attacks) ch.attacks = [];
        });
        // Aufstiegsart-Einstellung: 'xp' (Standard) oder 'milestone'
        if (!data.settings) data.settings = {};
        if (data.settings.levelingMode === undefined) {
            data.settings.levelingMode = 'xp';
        }
        return data;
    }
};
function migrateData(data) {
    // Nur ein nicht-leerer String ist ein Stempel; ein numerisches/kaputtes _version gilt als fehlend
    const dataVersion =
        typeof data._version === 'string' && data._version ? data._version : '2.2.0';
    let currentData = data;
    // Numerisch sortieren — lexikalisch stuende '10.0.0' vor '2.3.0'
    const versions = Object.keys(MIGRATIONS).sort(compareVersions);
    const ErrorHandler = window.ErrorHandler;
    for (const version of versions) {
        if (compareVersions(dataVersion, version) < 0) {
            if (window.APP_CONFIG?.DEBUG_MODE && typeof window.debugLogAdd === 'function') {
                // Migrationsfortschritt ist Normalverhalten, kein Fehler — nur ins in-App-Debug-Log
                window.debugLogAdd(`[MIGRATION] Migriere von ${dataVersion} auf ${version}`);
            }
            try {
                currentData = MIGRATIONS[version](currentData);
                currentData._version = version;
            } catch (e) {
                ErrorHandler.log('migrateData', e, `Migration failed for version ${version}`);
            }
        }
    }
    currentData._version = CURRENT_VERSION;
    return currentData;
}
function compareVersions(v1, v2) {
    // String(v || '0'): ein numerischer (2.6) oder fehlender Stempel darf nicht werfen
    // ('v1.split is not a function')
    const parts1 = String(v1 || '0')
        .split('.')
        .map(Number);
    const parts2 = String(v2 || '0')
        .split('.')
        .map(Number);
    for (let i = 0; i < 3; i++) {
        if ((parts1[i] || 0) < (parts2[i] || 0)) return -1;
        if ((parts1[i] || 0) > (parts2[i] || 0)) return 1;
    }
    return 0;
}
/**
 * Normalisiert Alt-Versionsstempel nach derselben Regel wie load() (quick-roll.js):
 * '2.11' (faelschlich "neuer als 2.6.x") wird '2.0.0'; ein Nicht-String-_version wird
 * entfernt und gilt damit als fehlend.
 * @param data - Kampagnenobjekt (wird in place geaendert)
 * @returns data
 */
function normalizeLegacyVersionStamp(data) {
    if (data._version === '2.11') {
        data._version = '2.0.0';
    } else if (data._version !== undefined && typeof data._version !== 'string') {
        delete data._version;
    }
    return data;
}
// ============================================================
// KAMPAGNEN-NORMALISIERER (Code-Review 2026-09-21, R01/R03/R07)
// Ein reiner Weg von Rohdaten (Datei-Text, Backup-Objekt) zu einem vollstaendigen
// Kampagnenobjekt: klonen -> Typen pruefen -> migrieren -> Standardwerte -> IDs/Zaehler.
// Restore (U4), Import (U6) und neue Kampagnen (U3) setzen darauf auf.
// ============================================================
/** Container-Regeln fuer normalizeCampaignData() (Pruefung VOR der Migration). */
const CAMPAIGN_SHAPE = Object.freeze({
    // vorhanden und nicht null -> muss ein Array sein, sonst Ablehnung
    arrays: Object.freeze([
        'characters',
        'npcs',
        'locations',
        'quests',
        'encounters',
        'loot',
        'spells',
        'wiki',
        'sessionNotes',
        'storyArcs',
        'bestiary',
        'sessionPreps',
        'factions',
        'shops',
        'links',
        'filters',
        'tags',
        'quickRefCustom',
        'randomTables'
    ]),
    // vorhanden und nicht null -> muss ein String sein, sonst Ablehnung
    texts: Object.freeze(['quickNotes', 'dmScreenNotes']),
    // Objekt-Container mit Pflicht-Unterliste (null = abwesend, sonst einfaches Objekt)
    containers: Object.freeze({ calendar: 'events', soundboard: 'scenes' }),
    // reparabel: falscher Typ -> Schluessel verwerfen (mit Reparaturhinweis)
    optionalObjects: Object.freeze(['settings', '_nextId', 'dmScreenProfiles']),
    optionalArrays: Object.freeze([
        'bestiaryFavorites',
        'monsterFavorites',
        'wikiRecentlyViewed',
        'sessionHistory',
        'diceHistory'
    ]),
    optionalNumbers: Object.freeze(['partyGold', 'lastSessionDuration']),
    // Export-Metadaten, die nie in D landen (Typ-/Verschiebe-Exporte gatet U6)
    exportMeta: Object.freeze([
        '_campaignName',
        '_exportDate',
        '_dataType',
        '_exportType',
        '_appVersion'
    ])
});
/**
 * Prueft die Container-Typen eines geklonten Kampagnenobjekts (in place).
 * Unreparierbare Typfehler liefern eine Fehlermeldung; reparable Felder werden
 * verworfen bzw. auf den Standard zurueckgesetzt und in repairs vermerkt.
 * @param src - Geklontes Kampagnenobjekt (wird geaendert)
 * @param repairs - Liste fuer Reparaturhinweise
 * @returns Fehlermeldung oder null
 */
function checkCampaignShape(src, repairs) {
    const has = key => Object.prototype.hasOwnProperty.call(src, key);
    const typeError = key => `Ungültiger Datentyp für "${key}"`;
    const dropNull = key => {
        delete src[key];
        repairs.push(`${key}: war null, Standardwert verwendet`);
    };
    for (const key of CAMPAIGN_SHAPE.arrays) {
        if (!has(key)) continue;
        if (src[key] === null) dropNull(key);
        else if (!Array.isArray(src[key])) return typeError(key);
    }
    for (const key of CAMPAIGN_SHAPE.texts) {
        if (!has(key)) continue;
        if (src[key] === null) dropNull(key);
        else if (typeof src[key] !== 'string') return typeError(key);
    }
    for (const [key, listKey] of Object.entries(CAMPAIGN_SHAPE.containers)) {
        if (!has(key)) continue;
        if (src[key] === null) {
            dropNull(key);
            continue;
        }
        if (!isPlainDataObject(src[key])) return typeError(key);
        const list = src[key][listKey];
        if (list !== undefined && list !== null && !Array.isArray(list)) {
            return typeError(`${key}.${listKey}`);
        }
    }
    if (has('initiative')) {
        if (!isPlainDataObject(src.initiative)) {
            // HEAD-Restore tolerierte null/Array: reparieren statt ablehnen
            delete src.initiative;
            repairs.push('initiative: kein Objekt, Standard-Initiative verwendet');
        } else {
            const list = src.initiative.combatants;
            if (list !== undefined && list !== null && !Array.isArray(list)) {
                return typeError('initiative.combatants');
            }
        }
    }
    const drop = (key, expected) => {
        delete src[key];
        repairs.push(`${key}: kein ${expected}, verworfen`);
    };
    for (const key of CAMPAIGN_SHAPE.optionalObjects) {
        if (has(key) && !isPlainDataObject(src[key])) drop(key, 'Objekt');
    }
    for (const key of CAMPAIGN_SHAPE.optionalArrays) {
        if (has(key) && !Array.isArray(src[key])) drop(key, 'Array');
    }
    for (const key of CAMPAIGN_SHAPE.optionalNumbers) {
        if (has(key) && !Number.isFinite(src[key])) drop(key, 'endliche Zahl');
    }
    if (has('dmScreenActiveProfile')) {
        const v = src.dmScreenActiveProfile;
        if (v !== null && typeof v !== 'string') drop('dmScreenActiveProfile', 'String');
    }
    return null;
}
/**
 * Stellt die Pflicht-Unterlisten der Objekt-Container sicher (nach dem Default-Merge).
 * @param out - Zusammengefuehrtes Kampagnenobjekt (wird geaendert)
 * @param repairs - Liste fuer Reparaturhinweise
 */
function ensureCampaignContainerLists(out, repairs) {
    const defaults = window.initializeData();
    for (const [key, listKey] of [
        ['initiative', 'combatants'],
        ['calendar', 'events'],
        ['soundboard', 'scenes']
    ]) {
        if (!isPlainDataObject(out[key])) {
            out[key] = defaults[key];
            repairs.push(`${key}: kein Objekt, Standardwert verwendet`);
        }
        if (!Array.isArray(out[key][listKey])) {
            out[key][listKey] = [];
            repairs.push(`${key}.${listKey}: fehlte, leere Liste angelegt`);
        }
    }
}
/**
 * Normalisiert Rohdaten zu einem vollstaendigen Kampagnenobjekt.
 * Rein: liest/schreibt weder window.D noch Speicher und veraendert raw nicht.
 * @param raw - JSON-Text oder Objekt (Datei-Import, Backup, Kampagnen-Speicherstand)
 * @returns { ok: true, data, repairs: string[], renumbered: Array<{type, from, to}> }
 *          oder { ok: false, error: string }
 */
function normalizeCampaignData(raw) {
    try {
        // 1. Klonen; der Reviver entfernt "__proto__"/"constructor"/"prototype" in jeder Tiefe
        //    (ein eigener "__proto__"-Datenschluessel traefe sonst den Prototyp-Setter)
        const forbidden = window.CAMPAIGN_FORBIDDEN_KEYS;
        const reviver = (key, value) => (forbidden.includes(key) ? undefined : value);
        let src;
        try {
            src =
                typeof raw === 'string'
                    ? JSON.parse(raw, reviver)
                    : JSON.parse(JSON.stringify(raw), reviver);
        } catch {
            return { ok: false, error: 'Datei ist kein gültiges JSON' };
        }
        if (!isPlainDataObject(src)) return { ok: false, error: 'Ungültiges Kampagnenformat' };
        const repairs = [];
        // 2. Export-Metadaten entfernen
        for (const key of CAMPAIGN_SHAPE.exportMeta) delete src[key];
        // 3. Container-Typen pruefen (vor der Migration)
        const shapeError = checkCampaignShape(src, repairs);
        if (shapeError) return { ok: false, error: shapeError };
        // 4. Zaehler aus der Datei merken
        const fileCounters = isPlainDataObject(src._nextId) ? src._nextId : undefined;
        // 5. Migration mit derselben Bedingung wie load(): ein aktuell gestempelter Stand
        //    wird nicht erneut migriert. Bekannte Folgearbeit: APP_CONFIG.VERSION (2.6.1)
        //    liegt unter den MIGRATIONS-Schluesseln 3.0.0-5.0.0.
        normalizeLegacyVersionStamp(src);
        if (!src._version || compareVersions(src._version, CURRENT_VERSION) < 0) {
            src = migrateData(src);
        }
        // 6. Standardwerte: einstufiger Merge fuer Objekte, sonst gewinnt die Datei. Kein
        //    Schluessel, den weder initializeData() noch die Datei kennt (randomTables, shops,
        //    dmScreenLayout bleiben abwesend — random-tables.js seedet nur bei !D.randomTables)
        const out = window.initializeData();
        for (const key of Object.keys(src)) {
            out[key] =
                isPlainDataObject(out[key]) && isPlainDataObject(src[key])
                    ? Object.assign({}, out[key], src[key])
                    : src[key];
        }
        // 7. Pflicht-Unterlisten
        ensureCampaignContainerLists(out, repairs);
        // 8. IDs eindeutig und gueltig machen
        const renumbered = window.normalizeEntityIds(out);
        const renumberedPerType = {};
        for (const change of renumbered) {
            renumberedPerType[change.type] = (renumberedPerType[change.type] || 0) + 1;
        }
        for (const [type, count] of Object.entries(renumberedPerType)) {
            repairs.push(`${type}: ${count} ID(s) neu vergeben`);
        }
        // 9. Zaehler aus den tatsaechlichen Datensaetzen neu bestimmen
        window.recomputeNextIds(out, fileCounters);
        // 10. Stempel
        out._version = CURRENT_VERSION;
        if (window.APP_CONFIG?.DEBUG_MODE && typeof window.debugLogAdd === 'function') {
            window.debugLogAdd(
                `[normalizeCampaignData] ${repairs.length} Reparatur(en), ` +
                    `${renumbered.length} ID(s) neu vergeben${repairs.length ? `: ${repairs.join('; ')}` : ''}`
            );
        }
        return { ok: true, data: out, repairs, renumbered };
    } catch (e) {
        return { ok: false, error: (e && e.message) || 'Unbekannter Fehler' };
    }
}
// Export MIGRATIONS so tests can access individual migration functions via vm context
window.MIGRATIONS = MIGRATIONS;
window.normalizeCampaignData = normalizeCampaignData;
window.normalizeLegacyVersionStamp = normalizeLegacyVersionStamp;
// ============================================================
