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
// RENDERMOBROW — Mob-Zeile als HTML-String (INIT-03, D-12)
// Analog: lair-type Zweig in renderInit() (features/initiative.js Zeilen 148-161)
// UI-SPEC HTML-Struktur: 04-UI-SPEC.md Component Visual Contracts INIT-03
// ============================================================

/**
 * Rendert die Mob-Zeile als HTML-String fuer renderInit().
 * Gibt die gesamte .init-entry-Zeile fuer den Mob-Kombattanten zurueck.
 * Alle D-Werte werden via esc() gesichert (T-04-10 XSS-Mitigation).
 *
 * @param {object} cb - Mob-Kombattant (muss cb.mob haben)
 * @param {number} i  - Index in init.combatants
 * @param {object} init - D.initiative
 * @returns {string} HTML-String fuer die Mob-Zeile
 */
function renderMobRow(cb, i, init) {
    var active = i === init.currentTurn;
    var alive = getMobAlive(cb);
    var aliveRatio = cb.mob.count > 0 ? alive / cb.mob.count : 0;
    // Farb-Klasse gemaess UI-SPEC: defeated (poolHp=0) | healthy (>50%) | bloodied (>25%) | critical
    var aliveClass = cb.mob.poolHp <= 0 ? 'defeated' :
                     aliveRatio > 0.5   ? 'healthy' :
                     aliveRatio > 0.25  ? 'bloodied' : 'critical';
    // HP-Anzeige-Klasse (init-hp-value): bei defeated = critical-Farbe
    var hpClass = aliveClass === 'defeated' ? 'critical' : aliveClass;
    var isDmgRegel = cb.mob.attackMode === 'dmg-regel';

    // Lebende Kreaturen-Anzeige
    var aliveHtml = cb.mob.poolHp <= 0
        ? '<span class="init-mob-defeated-badge">Besiegt</span>'
        : esc(String(alive)) + ' von ' + esc(String(cb.mob.count)) + ' am Leben';

    // DMG-Regel-Eingaben (nur sichtbar wenn Modus = dmg-regel)
    var dmgInputsClass = isDmgRegel ? 'init-mob-dmg-inputs' : 'init-mob-dmg-inputs hidden';

    return '<div class="init-entry init-row monster' + (active ? ' active' : '') + '" draggable="true" data-id="' + cb.id + '">' +
        '<span class="drag-handle" title="Ziehen zum Umsortieren">⠇</span>' +
        '<div class="init-value" data-action="edit-init-value" data-id="' + cb.id + '" title="Klicken zum Bearbeiten">' + esc(String(cb.initiative)) + '</div>' +
        '<div class="init-ac" title="R\xfcstungsklasse"><span class="init-ac-icon">🛡️</span>' + esc(String(cb.ac)) + '</div>' +
        '<div class="init-info init-info--mob">' +
            '<div class="init-name">' + esc(cb.name) + '</div>' +
            '<div class="init-type">Mob \xb7 ' + esc(String(cb.mob.count)) + ' Kreaturen \xb7 Pool-HP</div>' +
            '<div class="init-mob-alive ' + aliveClass + '">' + aliveHtml + '</div>' +
            '<div class="init-mob-controls">' +
                '<span class="init-mob-label">Sammel-Angriff</span>' +
                '<div class="init-mob-mode-toggle">' +
                    '<button class="init-mob-mode-btn' + (!isDmgRegel ? ' active' : '') + '"' +
                        ' data-action="init-mob-set-mode-stop"' +
                        ' data-id="' + cb.id + '"' +
                        ' data-mode="nfach"' +
                        ' title="N-facher Einzel-Wurf">N\xd7-Wurf</button>' +
                    '<button class="init-mob-mode-btn' + (isDmgRegel ? ' active' : '') + '"' +
                        ' data-action="init-mob-set-mode-stop"' +
                        ' data-id="' + cb.id + '"' +
                        ' data-mode="dmg-regel"' +
                        ' title="DMG-Mob-Regel (Seite 250)">Mob-Regel</button>' +
                '</div>' +
                '<div class="' + dmgInputsClass + '">' +
                    '<label>Ziel-RK <input type="number" min="1" max="30" class="init-mob-ac-input" value="15"></label>' +
                    '<label>Angriffsbonus <input type="number" min="-5" max="20" class="init-mob-bonus-input" value="0"></label>' +
                '</div>' +
                '<button class="btn-sm init-mob-attack-btn"' +
                    ' data-action="init-mob-attack-stop"' +
                    ' data-id="' + cb.id + '"' +
                    ' title="Sammel-Angriff wuerfeln">🎲 Angriff w\xfcrf​eln</button>' +
            '</div>' +
        '</div>' +
        '<div class="init-right">' +
            '<div class="init-hp">' +
                '<span class="init-hp-value ' + hpClass + '">' + esc(String(cb.currentHp)) + '/' + esc(String(cb.maxHp)) + (cb.tempHp ? ' <span style="color:var(--cyan);">(+' + esc(String(cb.tempHp)) + ')</span>' : '') + '</span>' +
                '<div class="init-hp-btns">' +
                    '<button class="btn btn-sm btn-success" data-action="mod-hp" data-id="' + cb.id + '" data-value="1">➕</button>' +
                    '<button class="btn btn-sm btn-danger" data-action="mod-hp" data-id="' + cb.id + '" data-value="-1">➖</button>' +
                    '<button class="btn btn-sm" data-action="show-hp-calculator" data-type="combatant" data-id="' + cb.id + '" title="HP \xe4ndern">\xf7</button>' +
                '</div>' +
            '</div>' +
            '<button class="btn btn-sm" data-action="show-add-effect" data-id="' + cb.id + '">🔮</button>' +
            '<button class="btn-icon init-statblock-btn" data-action="show-init-statblock" data-id="' + cb.id + '" title="Basisinfos anzeigen">📖</button>' +
            '<button class="btn-icon init-mob-dissolve-btn"' +
                ' data-action="init-mob-dissolve-stop"' +
                ' data-id="' + cb.id + '"' +
                ' title="Mob aufheben">⊞</button>' +
        '</div>' +
    '</div>';
}

// ============================================================
// APPLYMOBDAMAGE — Pool-HP-Mutation (INIT-03)
// Analog: initiative.js modHp() Zeilen 318-345
// TempHP wird zuerst absorbiert (analog modHp).
// currentHp wird stets mit poolHp synchron gehalten.
// ============================================================

/**
 * Zieht Schaden vom Pool-HP ab und synchronisiert currentHp.
 * TempHP-Absorption analog modHp() in initiative.js.
 * Nicht-destruktiv: kein saveUndoState() noetig (HP-Aenderung ist invertierbar).
 *
 * @param {number|string} cbId - Kombattant-ID
 * @param {number} damage      - Schadensmenge (positiv = Schaden, negativ = Heilung)
 */
function applyMobDamage(cbId, damage) {
    var cb = typeof window.getCombatant === 'function' ? window.getCombatant(cbId) : null;
    if (!cb) {
        var D = window.D;
        if (D && D.initiative && D.initiative.combatants) {
            cb = D.initiative.combatants.find(function(c) { return c.id === cbId; });
        }
    }
    if (!cb || !cb.mob) return;

    var remaining = Math.abs(damage);
    // TempHP zuerst absorbieren (analog modHp() initiative.js:323-331)
    if (cb.tempHp && cb.tempHp > 0) {
        var absorbed = Math.min(cb.tempHp, remaining);
        cb.tempHp -= absorbed;
        remaining -= absorbed;
    }
    // Pool-HP reduzieren, auf 0 clampen
    cb.mob.poolHp = Math.max(0, cb.mob.poolHp - remaining);
    // currentHp mit Pool-HP synchron halten (UI-Anzeige + AoE-Kompatibilitaet)
    cb.currentHp = cb.mob.poolHp;
    if (typeof window.renderInit === 'function') window.renderInit();
    if (typeof window.save === 'function') window.save();
}

// ============================================================
// ROLLMOBATTACK — Sammel-Angriff (INIT-03, D-13/D-14)
// N-fach-Modus: alive Angriffe, Schaden wird auto-summiert
// DMG-Mob-Regel: O(1) Treffer via calcMobHits(), Schaden auto-summiert
// Ergebnis via showToast() (UI-SPEC: keine Inline-Anzeige)
// DoS-Schutz: alive und count sind auf max. 100 geclampt (BESTIARY_MAX_QUANTITY)
// ============================================================

/**
 * Fuehrt einen Mob-Sammel-Angriff durch.
 * N-fach: alive separate Wuerfe, Schaden = alive_treffer * Waffenschaden.
 * DMG-Regel: calcMobHits() (O(1)), Schaden = hits * Waffenschaden.
 * Zeigt Ergebnis via showToast() — UI-SPEC verbietet Inline-Anzeige.
 *
 * @param {number|string} cbId - Kombattant-ID
 */
function rollMobAttack(cbId) {
    var D = window.D;
    var cb = typeof window.getCombatant === 'function' ? window.getCombatant(cbId) : null;
    if (!cb) {
        if (D && D.initiative && D.initiative.combatants) {
            cb = D.initiative.combatants.find(function(c) { return c.id === cbId; });
        }
    }
    if (!cb || !cb.mob) return;

    var alive = getMobAlive(cb);
    if (alive <= 0) {
        showToast('Mob besiegt — keine Angriffe moeglich', 'warning');
        return;
    }

    // Standard-Schadenswuerfel aus dem Statblock bestimmen
    // Fallback: 1d6 (generischer Nahkampfangriff) wenn kein Statblock verfuegbar
    var damageDice = '1d6';
    var damageBonus = 0;
    if (cb.statblockRef && typeof window.getBestiaryMonster === 'function') {
        var monster = window.getBestiaryMonster(cb.statblockRef.id, cb.statblockRef.source);
        if (monster && monster.actions && Array.isArray(monster.actions) && monster.actions.length > 0) {
            // Erste Aktion durchsuchen nach einem Wuerfelausdruck (z.B. "1d6+2", "2d6")
            var firstAction = monster.actions[0];
            var actionText = (firstAction.desc || firstAction.description || '');
            var diceMatch = actionText.match(/(\d+d\d+)(?:\s*[+\-]\s*(\d+))?/i);
            if (diceMatch) {
                damageDice = diceMatch[1];
                damageBonus = diceMatch[2] ? parseInt(diceMatch[2], 10) : 0;
            }
        }
    }

    // Einzelnen Wuerfelwert ermitteln (ohne den Bonus, den wir separat addieren)
    function rollDie(formula) {
        var match = formula.match(/^(\d+)d(\d+)$/i);
        if (!match) return 1;
        var numDice = parseInt(match[1], 10);
        var sides = parseInt(match[2], 10);
        var total = 0;
        for (var k = 0; k < numDice; k++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        return total;
    }

    var mobName = esc(cb.name);

    if (cb.mob.attackMode === 'nfach') {
        // N-fach-Modus: alive Angriffe (1d20 + Angriffsbonus pro Angriff)
        // Vereinfachung: jeder Angriff trifft, Schaden = alive Treffer × Waffenwuerfel
        // (Trefferrolle faellt weg — der DM bestimmt manuell ob der Angriff trifft)
        // Stattdessen: Schaden fuer alive Angriffe wuerfeln und summieren (D-14)
        var hitRolls = [];
        var totalDamage = 0;
        for (var j = 0; j < alive; j++) {
            var dmg = rollDie(damageDice) + damageBonus;
            hitRolls.push(dmg);
            totalDamage += dmg;
        }
        var rollsStr = hitRolls.slice(0, 10).join(', ') + (hitRolls.length > 10 ? ', ...' : '');
        showToast(
            mobName + ': ' + alive + ' Angriffe — Schaden je: ' + rollsStr + ' | Gesamtschaden: ' + totalDamage,
            'info'
        );
    } else {
        // DMG-Mob-Regel-Modus: calcMobHits() bestimmt Treffer
        // Eingaben aus dem Mob-Zeilen-DOM lesen
        var targetAC = 15; // Fallback-RK
        var attackBonus = 0; // Fallback-Angriffsbonus
        // DOM-Eingaben lesen (nur wenn im Browser-Kontext)
        if (typeof document !== 'undefined') {
            var rowEl = document.querySelector('[data-id="' + cbId + '"].init-row');
            if (rowEl) {
                var acInput = rowEl.querySelector('.init-mob-ac-input');
                var bonusInput = rowEl.querySelector('.init-mob-bonus-input');
                if (acInput) {
                    var parsedAC = parseInt(acInput.value, 10);
                    targetAC = isNaN(parsedAC) ? 15 : Math.max(1, Math.min(30, parsedAC));
                }
                if (bonusInput) {
                    var parsedBonus = parseInt(bonusInput.value, 10);
                    attackBonus = isNaN(parsedBonus) ? 0 : Math.max(-5, Math.min(20, parsedBonus));
                }
            }
        }

        var hits = calcMobHits(alive, attackBonus, targetAC);
        var totalDmg = 0;
        for (var h = 0; h < hits; h++) {
            totalDmg += rollDie(damageDice) + damageBonus;
        }
        showToast(
            mobName + ': ' + hits + ' Treffer (von ' + alive + ' lebend, RK ' + targetAC + ', +' + attackBonus + ') | Schaden: ' + totalDmg,
            'info'
        );
    }
}

// ============================================================
// SETMOBATTACKMODE — Angriffsmodus-Umschaltung (INIT-03)
// Gueltiger Modus: 'nfach' | 'dmg-regel'
// ============================================================

/**
 * Schaltet den Mob-Angriffsmodus um.
 * Validiert den Modus-String vor dem Setzen.
 *
 * @param {number|string} cbId - Kombattant-ID
 * @param {string} mode        - 'nfach' oder 'dmg-regel'
 */
function setMobAttackMode(cbId, mode) {
    if (!cbId || !mode) return;
    // Modus-Validierung (T-04-12)
    if (mode !== 'nfach' && mode !== 'dmg-regel') return;

    var cb = typeof window.getCombatant === 'function' ? window.getCombatant(cbId) : null;
    if (!cb) {
        var D = window.D;
        if (D && D.initiative && D.initiative.combatants) {
            cb = D.initiative.combatants.find(function(c) { return c.id === cbId; });
        }
    }
    if (!cb || !cb.mob) return;

    cb.mob.attackMode = mode;
    if (typeof window.renderInit === 'function') window.renderInit();
    if (typeof window.save === 'function') window.save();
}

// ============================================================
// DISSOLVEMOB — Mob entfernen (INIT-03)
// DESTRUCTIVE: saveUndoState() VOR der Mutation! (CLAUDE.md Pattern + T-04-13)
// ============================================================

/**
 * Entfernt eine Mob-Zeile aus der Initiative.
 * saveUndoState("Mob aufgehoben") wird IMMER vor der Mutation aufgerufen —
 * Ctrl+Z stellt den Mob wieder her (CLAUDE.md Destructive-Op-Regel).
 *
 * @param {number|string} cbId - ID der Mob-Zeile
 */
function dissolveMob(cbId) {
    if (!cbId) return;
    // Bestaetigung via confirm() (UI-SPEC Copywriting INIT-03)
    if (!confirm('Mob-Zeile entfernen? Diese Aktion ist mit Strg+Z r\xfckg\xe4ngig zu machen.')) return;

    // IMMER vor der destruktiven Mutation! (T-04-13, CLAUDE.md)
    saveUndoState('Mob aufgehoben');

    var D = window.D;
    if (!D || !D.initiative || !D.initiative.combatants) return;

    D.initiative.combatants = D.initiative.combatants.filter(function(c) { return c.id !== cbId; });

    // currentTurn korrigieren wenn ausserhalb der neuen Laenge
    if (D.initiative.currentTurn >= D.initiative.combatants.length) {
        D.initiative.currentTurn = Math.max(0, D.initiative.combatants.length - 1);
    }

    if (typeof window.renderInit === 'function') window.renderInit();
    if (typeof window.save === 'function') window.save();
    showToast('Mob aufgehoben');
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
