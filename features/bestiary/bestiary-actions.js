// [SECTION:BESTIARY_ACTIONS]
// ============================================================
// BESTIARY ACTIONS — Uebernahme zu Initiative/Encounter, Favoriten
// Analog: features/encounter-calculator.js -> addCalculatorToInitiative()
// Implementiert: Plan 05 (D-09, D-11, D-14, D-15, D-16, D-17)
// ============================================================

// ============================================================
// LOOKUP — Monster aus SRD oder D.bestiary[] laden
// ============================================================
function getBestiaryMonster(id, source) {
    if (source === 'custom') {
        return (window.D && window.D.bestiary ? window.D.bestiary : [])
            .find(function(c) { return c.id === parseEntityId(id); }) || null;
    }
    // SRD: _id ist ein String-Key wie 'goblin'
    return getSRDMonsters().find(function(m) { return m._id === id; }) || null;
}

// ============================================================
// FAVORITES — Toggle und Pruefung
// Analog: features/dice/dice-favorites.js
// Stabiler Schluessel: SRD -> String(_id), Eigene -> 'custom:id'
// ============================================================
function isBestiaryFavorite(monster) {
    var D = window.D;
    if (!D || !D.bestiaryFavorites) return false;
    var key = monster.source === 'custom'
        ? 'custom:' + monster.id
        : String(monster._id);
    return D.bestiaryFavorites.indexOf(key) !== -1;
}

function toggleBestiaryFavorite(id, source) {
    var D = window.D;
    if (!D) return;
    if (!D.bestiaryFavorites) D.bestiaryFavorites = [];
    // Stabiler Schluessel
    var key = source === 'custom' ? 'custom:' + id : String(id);
    var idx = D.bestiaryFavorites.indexOf(key);
    saveUndoState('Bestiary-Favorit geaendert');
    if (idx !== -1) {
        D.bestiaryFavorites.splice(idx, 1);
    } else {
        D.bestiaryFavorites.push(key);
    }
    if (typeof window.saveImmediate === 'function') {
        window.saveImmediate();
    } else if (typeof window.save === 'function') {
        window.save();
    }
    if (typeof window.renderBestiaryList === 'function') {
        window.renderBestiaryList();
    }
}

// ============================================================
// ZUR INITIATIVE — Mengen-Dialog, Auto-Init, HP-Variation (D-14/D-15/D-16/D-17)
// Math exakt wie addCalculatorToInitiative() (encounter-calculator.js Zeilen 888-910)
// DoS-Schutz: Menge auf max. 100 begrenzt (T-03-10)
// ============================================================
var BESTIARY_MAX_QUANTITY = 100;

function addBestiaryToInitiative(id, source) {
    var monster = getBestiaryMonster(id, source);
    if (!monster) {
        showToast('Monster nicht gefunden', 'error');
        return;
    }

    // Mengen-Dialog (D-14) — cancel (null) bricht ab
    var countStr = window.prompt('Wie viele "' + monster.name + '" zur Initiative hinzuf\xfcgen?', '1');
    if (countStr === null) return; // Abbruch

    // DoS-Schutz: clamp auf [1, 100] (T-03-10)
    var parsed = parseInt(countStr, 10);
    var count = isNaN(parsed) ? 1 : Math.max(1, Math.min(parsed, BESTIARY_MAX_QUANTITY));

    // Mob-Toggle (INIT-03, D-11): bei count > 1 fragen ob Mob-Modus
    var isMob = false;
    if (count > 1) {
        isMob = confirm(
            'Als Mob f\xfchren? (1 Zeile mit Pool-HP)\n\n' +
            'JA = Mob-Modus (Pool-HP, Sammel-Angriff)\n' +
            'NEIN = ' + count + ' Einzelzeilen'
        );
    }

    var D = window.D;
    if (!D) return;
    if (!D.initiative) D.initiative = { combatants: [], currentTurn: 0, round: 1 };
    if (!D.initiative.combatants) D.initiative.combatants = [];

    // DEX-Modifier (analog encounter-calculator.js Zeile 887)
    var dexMod = Math.floor(((monster.dex || 10) - 10) / 2);

    // LA/LR-Felder: runtime-only, keine Migration (INIT-02)
    var laCount = monster.legendaryActionsPerRound || 0;
    var lrCount = typeof window.parseLegendaryResistanceCount === 'function'
        ? window.parseLegendaryResistanceCount(monster)
        : 0;

    saveUndoState('Monster zur Initiative hinzugef\xfcgt');

    if (isMob) {
        // Mob-Modus: eine Zeile fuer alle N Kreaturen (D-11)
        var mobCb = typeof window.createMobCombatant === 'function'
            ? window.createMobCombatant(monster, count, source)
            : null;
        if (!mobCb) {
            showToast('Mob-Funktion nicht verfuegbar', 'error');
            return;
        }
        // LA/LR-Felder auf den Mob-Kombattanten uebertragen (analog Einzelzeile)
        if (laCount > 0) {
            mobCb.legendaryActions = { max: laCount, remaining: laCount };
        }
        if (lrCount > 0) {
            mobCb.legendaryResistance = { max: lrCount, remaining: lrCount };
        }
        D.initiative.combatants.push(mobCb);
    } else {
        // Einzelzeilen-Modus (unveraendert — alle N Kreaturen als separate Zeilen)
        for (var i = 0; i < count; i++) {
            // Auto-Initiative-Wurf (D-15): 1d20 + DEX-Modifier
            var initRoll = Math.floor(Math.random() * 20) + 1 + dexMod;

            // HP-Variation +-10% (D-15) — exakt wie encounter-calculator.js Zeilen 892-893
            var hpVariation = Math.round((monster.hp || 1) * (0.9 + Math.random() * 0.2));
            var hp = Math.max(1, hpVariation);

            // Nummerierung (D-16): "Goblin 1", "Goblin 2" (Leerzeichen, kein '#')
            var name = count > 1 ? monster.name + ' ' + (i + 1) : monster.name;

            // statblockRef (D-17): Runtime-Feld, nicht migriert
            var statblockRef = {
                source: source || 'srd',
                id: source === 'custom' ? monster.id : monster._id
            };

            var combatant = {
                id: nextId('combatants'),
                name: name,
                initiative: initRoll,
                initBonus: dexMod,
                maxHp: hp,
                currentHp: hp,
                ac: monster.ac || 10,
                type: 'monster',
                cr: monster.cr || '0',
                xp: monster.xp || (window.CR_TO_XP && window.CR_TO_XP[monster.cr]) || 0,
                effects: [],
                statblockRef: statblockRef
            };

            // LA-Felder (INIT-02, D-09): nur wenn legendaryActionsPerRound > 0
            if (laCount > 0) {
                combatant.legendaryActions = { max: laCount, remaining: laCount };
            }
            // LR-Felder (INIT-02, D-06): nur wenn LR-Trait erkannt
            if (lrCount > 0) {
                combatant.legendaryResistance = { max: lrCount, remaining: lrCount };
            }

            D.initiative.combatants.push(combatant);
        }
    }

    // Nach Initiative-Wert sortieren (absteigend) — analog encounter-calculator.js Zeile 929
    D.initiative.combatants.sort(function(a, b) { return b.initiative - a.initiative; });

    if (typeof window.save === 'function') window.save();
    if (typeof window.switchView === 'function') window.switchView('initiative');
    if (typeof window.renderInit === 'function') window.renderInit();
    showToast(count + '\xd7 ' + monster.name + ' zur Initiative hinzugef\xfcgt');
}

// ============================================================
// ZU ENCOUNTER — D.encounters-Eintrag anlegen (BEST-03, RESEARCH Muster 6)
// Feld-Mapping: Statblock -> Encounter-Schema (encounters-crud.js)
// saveUndoState() VOR Push (Undo-faehig, T-03-11)
// ============================================================
function addBestiaryToEncounter(id, source) {
    var monster = getBestiaryMonster(id, source);
    if (!monster) {
        showToast('Monster nicht gefunden', 'error');
        return;
    }

    var D = window.D;
    if (!D) return;
    if (!D.encounters) D.encounters = [];

    saveUndoState('Monster zu Encounter hinzugef\xfcgt');

    // DEX-Modifier fuer Initiative-Bonus im Encounter-Schema
    var dexMod = Math.floor(((monster.dex || 10) - 10) / 2);

    // Saving-Throws: von { str: '+2' } zu Encounter-Schema
    var savingThrows = {};
    if (monster.savingThrows && typeof monster.savingThrows === 'object') {
        savingThrows = monster.savingThrows;
    }

    // Skills: von { heimlichkeit: '+6' } zu HTML-String (wie Encounter-Schema erwartet)
    var skillsHtml = '';
    if (monster.skills && typeof monster.skills === 'object') {
        var skillParts = Object.keys(monster.skills).map(function(k) {
            return esc(k.charAt(0).toUpperCase() + k.slice(1)) + ' ' + esc(String(monster.skills[k]));
        });
        if (skillParts.length) {
            skillsHtml = '<p>' + skillParts.join(', ') + '</p>';
        }
    }

    // Traits / Actions als HTML-String aufbereiten
    // SRD: Array von {name, desc}; Custom: bereits HTML-String
    function traitArrayToHtml(items) {
        if (!items) return '';
        if (typeof items === 'string') return items;
        if (!items.length) return '';
        return items.map(function(item) {
            return '<p><strong>' + esc(item.name || '') + '.</strong> ' + esc(item.desc || '') + '</p>';
        }).join('');
    }

    // Speed als einzelner String
    var speedStr = '';
    if (monster.speed && typeof monster.speed === 'object') {
        var parts = [];
        if (monster.speed.walk) parts.push(monster.speed.walk);
        if (monster.speed.fly) parts.push('Fliegen ' + monster.speed.fly);
        if (monster.speed.swim) parts.push('Schwimmen ' + monster.speed.swim);
        if (monster.speed.climb) parts.push('Klettern ' + monster.speed.climb);
        if (monster.speed.burrow) parts.push('Graben ' + monster.speed.burrow);
        speedStr = parts.join(', ');
    } else if (typeof monster.speed === 'string') {
        speedStr = monster.speed;
    }

    // Perception aus Senses (z.B. "Passive Wahrnehmung 9" -> 9)
    var perception = 0;
    if (monster.senses && Array.isArray(monster.senses)) {
        monster.senses.forEach(function(s) {
            var match = /Passive Wahrnehmung\s+(\d+)/i.exec(s);
            if (match) perception = parseInt(match[1], 10);
        });
    }

    var encounterEntry = {
        id: nextId('encounters'),
        name: monster.name,
        creatureType: monster.creatureType || '',
        cr: monster.cr || '0',
        ac: monster.ac || 10,
        init: dexMod,
        hp: monster.hp || 1,
        speed: speedStr ? { walk: speedStr } : { walk: '' },
        perception: perception,
        languages: Array.isArray(monster.languages) ? monster.languages : [],
        str: monster.str || 10,
        dex: monster.dex || 10,
        con: monster.con || 10,
        int: monster.int || 10,
        wis: monster.wis || 10,
        cha: monster.cha || 10,
        savingThrows: savingThrows,
        resistances: Array.isArray(monster.damageResistances) ? monster.damageResistances : [],
        immunities: Array.isArray(monster.damageImmunities) ? monster.damageImmunities : [],
        conditionImmunities: Array.isArray(monster.conditionImmunities) ? monster.conditionImmunities : [],
        traits: traitArrayToHtml(monster.traits),
        equipment: '',
        actions: traitArrayToHtml(monster.actions),
        skills: skillsHtml
    };

    D.encounters.push(encounterEntry);

    if (typeof window.save === 'function') window.save();
    if (typeof window.renderEncounters === 'function') window.renderEncounters();
    showToast(esc(monster.name) + ' zu Encounter hinzugef\xfcgt');
}

// ============================================================
// WINDOW EXPORTS
// ============================================================
window.getBestiaryMonster      = getBestiaryMonster;
window.isBestiaryFavorite      = isBestiaryFavorite;
window.toggleBestiaryFavorite  = toggleBestiaryFavorite;
window.addBestiaryToInitiative = addBestiaryToInitiative;
window.addBestiaryToEncounter  = addBestiaryToEncounter;
