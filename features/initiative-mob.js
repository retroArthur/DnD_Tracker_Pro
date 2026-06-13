// [SECTION:INITIATIVE_MOB]
// ============================================================
// MOB-MODUS fuer Initiative (INIT-03)
// Analog: bestiary-actions.js addBestiaryToInitiative() (Kombattant-Erstellung)
// Analog: initiative.js modHp() (HP-Mutation-Muster)
// ============================================================

// Modul-Ebene: var (kein const/let) fuer window-Globals — Build-Dedup-Regel (CLAUDE.md)
// Kein `const X = window.X` innerhalb von Funktionen!

// ============================================================
// PARSELEGENDARYRESISTANCECOUNT — LR-Parsing (D-05/D-06)
// ============================================================

/**
 * Ermittelt die Anzahl der Legendaeren Widerstaende aus dem Monster-Objekt.
 * Unterstuetzt:
 *   - Deutsch: "Legendaere Resistenz (3-mal taeglich)" (SRD-Bestand)
 *   - Englisch: "(3/Day)" (Fallback fuer custom Kreaturen)
 *   - HTML-String: typeof monster.traits === 'string' (Custom-Kreaturen-Fallback)
 * Gibt 0 zurueck wenn kein LR-Trait gefunden (D-06: kein Pip-Anzeige).
 */
function parseLegendaryResistanceCount(monster) {
    if (!monster || !monster.traits) return 0;
    var items = Array.isArray(monster.traits) ? monster.traits : [];
    for (var i = 0; i < items.length; i++) {
        var name = items[i].name || '';
        // Deutsch: "Legendaere Resistenz (3-mal taeglich)" — verifiziert srd-monsters.js:6958, 7083
        var matchDE = name.match(/(\d+)-mal\s+t[äa]glich/i);
        // Englisch: "(3/Day)" — Fallback fuer custom Kreaturen
        var matchEN = name.match(/\((\d+)\/Day\)/i);
        if (matchDE) return parseInt(matchDE[1], 10);
        if (matchEN) return parseInt(matchEN[1], 10);
    }
    // Custom creature: traits als HTML-String (analog renderTraitList() in bestiary-render.js:261)
    if (typeof monster.traits === 'string') {
        var m = monster.traits.match(/[Ll]egend[äa]re?\s+[Rr]esistenz.*?(\d+)-mal/);
        if (m) return parseInt(m[1], 10);
    }
    return 0;
}

// ============================================================
// GETMOBALIVE — "X von N am Leben" Berechnung (D-12)
// ============================================================

/**
 * Berechnet die Anzahl der lebenden Kreaturen im Mob.
 * Pool-HP wird auf Einzel-HP aufgeteilt (Ceiling-Division).
 * Gibt 1 zurueck wenn kein cb.mob vorhanden (kein Mob-Modus).
 */
function getMobAlive(cb) {
    if (!cb.mob) return 1;
    return Math.max(0, Math.ceil(cb.mob.poolHp / cb.mob.individualMaxHp));
}

// ============================================================
// CALCMOBHITS — DMG-Mob-Regel O(1) Berechnung (D-13b) [ASSUMED]
// Formel: Treffer = floor(N * (21 - needed) / 20)
// Anchor-Case (INIT-03): 10 Goblins (+4) vs AC 15 → needed=11, fraction=0.5, Treffer=5
// ============================================================

/**
 * Berechnet die Trefferanzahl nach DMG-Mob-Regel (Seite 250).
 * O(1) Berechnung ohne Loop (DoS-sicher — CLAUDE.md Pattern).
 *
 * @param {number} count - Anzahl lebender Angreifer
 * @param {number} attackBonus - Angriffsbonus
 * @param {number} targetAC - Ruestungsklasse des Ziels
 * @returns {number} Anzahl der Treffer
 */
function calcMobHits(count, attackBonus, targetAC) {
    var needed = Math.max(2, targetAC - attackBonus);
    // Clamp: bei needed >= 20 trifft nur Nat-20 (5%)
    if (needed >= 20) return Math.max(1, Math.floor(count * 0.05));
    // Anteil der d20-Ergebnisse die >= needed sind: (21 - needed) / 20
    var fraction = (21 - needed) / 20;
    return Math.max(0, Math.floor(count * fraction));
}

// ============================================================
// CREATEMOBCOMBATANT — Mob-Kombattant erstellen (D-11/D-12)
// Analog: bestiary-actions.js addBestiaryToInitiative() Zeilen 88-119
// ============================================================

/**
 * Erstellt einen Mob-Kombattanten (eine Initiative-Zeile fuer N Kreaturen).
 * Pool-HP = Summe der Einzel-HP mit ±10% Variation (analog bestiary-actions.js:93-95).
 * Runtime-only: keine Migration noetig (STATE.md Architecture Note).
 */
function createMobCombatant(monster, count, source) {
    // HP-Variation: kopiert von bestiary-actions.js Zeilen 93-95
    var totalHp = 0;
    var individualMaxHp = Math.round(monster.hp || 1);
    for (var k = 0; k < count; k++) {
        totalHp += Math.max(1, Math.round((monster.hp || 1) * (0.9 + Math.random() * 0.2)));
    }
    // DEX-Modifier: kopiert von bestiary-actions.js Zeile 85
    var dexMod = Math.floor(((monster.dex || 10) - 10) / 2);
    // statblockRef: kopiert von bestiary-actions.js Zeilen 100-104
    var statblockRef = {
        source: source || 'srd',
        id: source === 'custom' ? monster.id : monster._id
    };
    // ID-Generator: window.nextId() im Browser; Fallback Date.now() fuer Jest-VM
    var newId = window.nextId ? window.nextId('combatants') : Date.now();
    // Mob-Felder: runtime-only, keine Migration (STATE.md Architektur-Constraint)
    return {
        id: newId,
        name: monster.name + '-Schwarm',  // UI-SPEC Copy-Contract (04-UI-SPEC.md)
        initiative: Math.floor(Math.random() * 20) + 1 + dexMod,
        initBonus: dexMod,
        maxHp: totalHp,     // Grid-Anzeige + Pool-HP-Referenz
        currentHp: totalHp, // Pool-HP fuer HP-Buttons
        ac: monster.ac || 10,
        type: 'monster',
        cr: monster.cr || '0',
        xp: monster.xp || (window.CR_TO_XP && window.CR_TO_XP[monster.cr]) || 0,
        effects: [],
        statblockRef: statblockRef,
        mob: {
            count: count,
            poolHp: totalHp,
            maxPoolHp: totalHp,
            individualMaxHp: individualMaxHp,
            attackMode: 'nfach'   // 'nfach' | 'dmg-regel'
        }
    };
}

// ============================================================
// RENDERMOBROW — Mob-Zeile als HTML-String (Wave 3 fuellt Implementierung)
// ============================================================

/**
 * Rendert die Mob-Zeile als HTML-String fuer renderInit().
 * Wave 3 fuellt die vollstaendige Implementierung gemaess 04-UI-SPEC.md.
 */
function renderMobRow(cb, i, init) {
    // Wave 3 fills implementation
    return '';
}

// ============================================================
// APPLYMOBDAMAGE — Pool-HP-Mutation (Wave 3 fuellt Implementierung)
// Analog: initiative.js modHp() Zeilen 318-345
// ============================================================

/**
 * Zieht Schaden vom Pool-HP ab und synchronisiert currentHp.
 * Wave 3 fuellt die vollstaendige Implementierung.
 */
function applyMobDamage(cbId, damage) {
    // Wave 3 fills implementation
    if (!cbId || !damage) return;
}

// ============================================================
// ROLLMOBATTACK — Sammel-Angriff (Wave 3 fuellt Implementierung)
// ============================================================

/**
 * Fuehrt einen Mob-Sammel-Angriff durch (N-fach oder DMG-Mob-Regel).
 * Wave 3 fuellt die vollstaendige Implementierung.
 */
function rollMobAttack(cbId) {
    // Wave 3 fills implementation
    if (!cbId) return;
}

// ============================================================
// SETMOBATTACKMODE — Angriffsmodus-Umschaltung (Wave 3 fuellt Implementierung)
// ============================================================

/**
 * Schaltet den Mob-Angriffsmodus um ('nfach' | 'dmg-regel').
 * Wave 3 fuellt die vollstaendige Implementierung.
 */
function setMobAttackMode(cbId, mode) {
    // Wave 3 fills implementation
    if (!cbId || !mode) return;
}

// ============================================================
// DISSOLVEMOB — Mob entfernen (Wave 3 fuellt Implementierung)
// ============================================================

/**
 * Entfernt eine Mob-Zeile aus der Initiative mit Undo-Unterstuetzung.
 * saveUndoState() VOR destruktiver Mutation (CLAUDE.md Pattern).
 * Wave 3 fuellt die vollstaendige Implementierung.
 */
function dissolveMob(cbId) {
    // Wave 3 fills implementation
    if (!cbId) return;
}

// ============================================================
// WINDOW-EXPORTS (analog bestiary-actions.js Zeilen 239-244)
// ============================================================

window.parseLegendaryResistanceCount = parseLegendaryResistanceCount;
window.getMobAlive                   = getMobAlive;
window.calcMobHits                   = calcMobHits;
window.createMobCombatant            = createMobCombatant;
window.renderMobRow                  = renderMobRow;
window.applyMobDamage                = applyMobDamage;
window.rollMobAttack                 = rollMobAttack;
window.setMobAttackMode              = setMobAttackMode;
window.dissolveMob                   = dissolveMob;
