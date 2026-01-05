// [SECTION:MONSTER_TEMPLATES]
// Extrahiert aus dice.js
// Monster-Vorlagen
// Zeilen: 54

// MONSTER TEMPLATES - LAZY LOADED
// ============================================================
let _monsterTemplatesCache = null;

function getMonsterTemplates() {
    if (_monsterTemplatesCache) return _monsterTemplatesCache;
    
    _monsterTemplatesCache = {
    goblin: { name: 'Goblin', creatureType: 'Humanoid', cr: '1/4', ac: 15, init: 2, hp: 7, speed: { walk: '9m' }, perception: 9, str: '8/-1', dex: '14/+2', con: '10/+0', int: '10/+0', wis: '8/-1', cha: '8/-1', languages: ['Gemein', 'Goblin'], traits: '<b>Flinker Rückzug:</b> Kann Rückzug oder Verstecken als Bonusaktion.', equipment: 'Krummsäbel, Kurzbogen', actions: '<b>Krummsäbel:</b> +4, 1d6+2 Hieb. <b>Kurzbogen:</b> +4, 1d6+2 Stich.' },
    skeleton: { name: 'Skelett', creatureType: 'Untot', cr: '1/4', ac: 13, init: 2, hp: 13, speed: { walk: '9m' }, perception: 9, str: '10/+0', dex: '14/+2', con: '15/+2', int: '6/-2', wis: '8/-1', cha: '5/-3', languages: [], traits: '<b>Schwachstellen:</b> Wuchtwaffen. <b>Immunitäten:</b> Gift, Erschöpfung.', equipment: 'Kurzschwert, Kurzbogen, verrottete Rüstung', actions: '<b>Kurzschwert:</b> +4, 1d6+2 Stich. <b>Kurzbogen:</b> +4, 1d6+2 Stich.' },
    zombie: { name: 'Zombie', creatureType: 'Untot', cr: '1/4', ac: 8, init: -2, hp: 22, speed: { walk: '6m' }, perception: 8, str: '13/+1', dex: '6/-2', con: '16/+3', int: '3/-4', wis: '6/-2', cha: '5/-3', languages: [], traits: '<b>Untote Zähigkeit:</b> Bei Schaden auf 0 HP: KON-Wurf (SG 5 + Schaden), bei Erfolg 1 HP. Nicht bei Strahlung/Kritisch.', equipment: '', actions: '<b>Schlag:</b> +3, 1d6+1 Wucht.' },
    orc: { name: 'Ork', creatureType: 'Humanoid', cr: '1/2', ac: 13, init: 1, hp: 15, speed: { walk: '9m' }, perception: 10, str: '16/+3', dex: '12/+1', con: '16/+3', int: '7/-2', wis: '11/+0', cha: '10/+0', languages: ['Gemein', 'Orkisch'], traits: '<b>Aggressiv:</b> Bonusaktion: bis zu Geschwindigkeit auf feindliche Kreatur zubewegen.', equipment: 'Großaxt, Wurfspeer', actions: '<b>Großaxt:</b> +5, 1d12+3 Hieb. <b>Wurfspeer:</b> +5, 1d6+3 Stich.' },
    wolf: { name: 'Wolf', creatureType: 'Bestie', cr: '1/4', ac: 13, init: 2, hp: 11, speed: { walk: '12m' }, perception: 13, str: '12/+1', dex: '15/+2', con: '12/+1', int: '3/-4', wis: '12/+1', cha: '6/-2', languages: [], traits: '<b>Scharfe Sinne:</b> Vorteil auf WEI(Wahrnehmung) mit Gehör/Geruch. <b>Rudeltaktik:</b> Vorteil wenn Verbündeter neben Ziel.', equipment: '', actions: '<b>Biss:</b> +4, 2d4+2 Stich. Bei Treffer: STÄ-Wurf SG 11 oder liegend.' },
    bandit: { name: 'Bandit', creatureType: 'Humanoid', cr: '1/8', ac: 12, init: 1, hp: 11, speed: { walk: '9m' }, perception: 10, str: '11/+0', dex: '12/+1', con: '12/+1', int: '10/+0', wis: '10/+0', cha: '10/+0', languages: ['Gemein'], traits: '', equipment: 'Lederrüstung, Krummsäbel, Leichte Armbrust', actions: '<b>Krummsäbel:</b> +3, 1d6+1 Hieb. <b>Leichte Armbrust:</b> +3, 1d8+1 Stich.' },
    guard: { name: 'Wache', creatureType: 'Humanoid', cr: '1/8', ac: 16, init: 1, hp: 11, speed: { walk: '9m' }, perception: 12, str: '13/+1', dex: '12/+1', con: '12/+1', int: '10/+0', wis: '11/+0', cha: '10/+0', languages: ['Gemein'], traits: '', equipment: 'Kettenhemd, Schild, Speer', actions: '<b>Speer:</b> +3, 1d6+1 Stich (1d8+1 zweihändig).' },
    kobold: { name: 'Kobold', creatureType: 'Humanoid', cr: '1/8', ac: 12, init: 2, hp: 5, speed: { walk: '9m' }, perception: 8, str: '7/-2', dex: '15/+2', con: '9/-1', int: '8/-1', wis: '7/-2', cha: '8/-1', languages: ['Gemein', 'Drakonisch'], traits: '<b>Sonnenlichtempfindlichkeit:</b> Nachteil bei hellem Licht. <b>Rudeltaktik:</b> Vorteil wenn Verbündeter neben Ziel.', equipment: 'Dolch, Schleuder', actions: '<b>Dolch:</b> +4, 1d4+2 Stich. <b>Schleuder:</b> +4, 1d4+2 Wucht.' },
    giant_rat: { name: 'Riesenratte', creatureType: 'Bestie', cr: '1/8', ac: 12, init: 2, hp: 7, speed: { walk: '9m' }, perception: 10, str: '7/-2', dex: '15/+2', con: '11/+0', int: '2/-4', wis: '10/+0', cha: '4/-3', languages: [], traits: '<b>Scharfe Sinne:</b> Vorteil auf WEI(Wahrnehmung) mit Geruch. <b>Rudeltaktik:</b> Vorteil wenn Verbündeter neben Ziel.', equipment: '', actions: '<b>Biss:</b> +4, 1d4+2 Stich.' },
    cultist: { name: 'Kultist', creatureType: 'Humanoid', cr: '1/8', ac: 12, init: 1, hp: 9, speed: { walk: '9m' }, perception: 10, str: '11/+0', dex: '12/+1', con: '10/+0', int: '10/+0', wis: '11/+0', cha: '10/+0', languages: ['Gemein'], traits: '<b>Dunkle Hingabe:</b> Vorteil auf Rettungswürfe gegen Bezauberung/Verängstigung.', equipment: 'Lederrüstung, Krummsäbel', actions: '<b>Krummsäbel:</b> +3, 1d6+1 Hieb.' },
    ogre: { name: 'Oger', creatureType: 'Riese', cr: '2', ac: 11, init: -1, hp: 59, speed: { walk: '12m' }, perception: 8, str: '19/+4', dex: '8/-1', con: '16/+3', int: '5/-3', wis: '7/-2', cha: '7/-2', languages: ['Gemein', 'Riese'], traits: '', equipment: 'Große Keule, Wurfspeer', actions: '<b>Große Keule:</b> +6, 2d8+4 Wucht. <b>Wurfspeer:</b> +6, 2d6+4 Stich.' },
    troll: { name: 'Troll', creatureType: 'Riese', cr: '5', ac: 15, init: 1, hp: 84, speed: { walk: '9m' }, perception: 12, str: '18/+4', dex: '13/+1', con: '20/+5', int: '7/-2', wis: '9/-1', cha: '7/-2', languages: ['Riese'], traits: '<b>Regeneration:</b> 10 HP zu Beginn jedes Zuges, außer nach Feuer/Säure-Schaden. <b>Scharfe Sinne:</b> Vorteil auf Wahrnehmung mit Geruch.', equipment: '', actions: '<b>Mehrfachangriff:</b> 1x Biss + 2x Klaue. <b>Biss:</b> +7, 1d6+4 Stich. <b>Klaue:</b> +7, 2d6+4 Hieb.' }
    };
    
    log('[Lazy] MONSTER_TEMPLATES geladen');
    return _monsterTemplatesCache;
}

// Legacy-Kompatibilität
const MONSTER_TEMPLATES = new Proxy({}, {
    get(target, prop) {
        return getMonsterTemplates()[prop];
    }
});

function loadMonsterTemplate(key) {
    const templates = getMonsterTemplates();
    const t = templates[key];
    if (!t) return;
    
    $('enc-name').value = t.name;
    $('enc-creature-type').value = t.creatureType;
    $('enc-cr').value = t.cr;
    $('enc-ac').value = t.ac;
    $('enc-init').value = t.init;
    $('enc-hp').value = t.hp;

    // Load speed (support both old string format and new object format)
    if (typeof t.speed === 'object' && t.speed !== null) {
        $('enc-speed-walk').value = t.speed.walk || '';
        $('enc-speed-climb').value = t.speed.climb || '';
        $('enc-speed-swim').value = t.speed.swim || '';
        $('enc-speed-fly').value = t.speed.fly || '';
        $('enc-speed-burrow').value = t.speed.burrow || '';
    } else {
        // Old format: single string -> put in walk
        $('enc-speed-walk').value = t.speed || '';
        $('enc-speed-climb').value = '';
        $('enc-speed-swim').value = '';
        $('enc-speed-fly').value = '';
        $('enc-speed-burrow').value = '';
    }

    $('enc-perception').value = parseInt(t.perception) || 0;
    $('enc-str').value = t.str;
    $('enc-dex').value = t.dex;
    $('enc-con').value = t.con;
    $('enc-int').value = t.int;
    $('enc-wis').value = t.wis;
    $('enc-cha').value = t.cha;
    $('enc-traits').innerHTML = sanitizeHTML(t.traits) || '';
    $('enc-equipment').innerHTML = sanitizeHTML(t.equipment) || '';
    $('enc-actions').innerHTML = sanitizeHTML(t.actions) || '';
    
    // Set languages
    const langSelect = $('enc-languages');
    Array.from(langSelect.options).forEach(o => o.selected = false);
    (t.languages || []).forEach(lang => {
        const opt = Array.from(langSelect.options).find(o => o.value === lang);
        if (opt) opt.selected = true;
    });
    
    $('enc-form').classList.add('open');
    $('enc-form-icon').textContent = '▲';
    showToast(`${t.name} geladen`);
}

// ============================================================
// ============================================================