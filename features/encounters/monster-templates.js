// [SECTION:MONSTER_TEMPLATES]
// Extrahiert aus dice.js
// Monster-Vorlagen — ab Phase 3 Alias auf getSRDMonsters() (core/srd-monsters.js)
// Die 12 urspruenglichen Eintraege sind Teil des SRD-Seeds in core/srd-monsters.js.
// ============================================================
// MONSTER TEMPLATES - ALIAS TO SRD STORE (Phase 3)
// ============================================================
let _monsterTemplatesCache = null;
function getMonsterTemplates() {
    if (_monsterTemplatesCache) return _monsterTemplatesCache;
    // Alias: Daten kommen aus core/srd-monsters.js (getSRDMonsters)
    // Aufbau einer { _id: monster }-Map fuer Rueckwaertskompatibilitaet
    _monsterTemplatesCache = getSRDMonsters().reduce(function(acc, m) {
        if (m._id) acc[m._id] = m;
        return acc;
    }, {});
    return _monsterTemplatesCache;
}
// Legacy-Kompatibilität
var MONSTER_TEMPLATES = new Proxy(
    {},
    {
        get(target, prop) {
            return getMonsterTemplates()[prop];
        }
    }
);
function loadMonsterTemplate(key) {
    const templates = getMonsterTemplates();
    const t = templates[key];
    if (!t) return;
    $('enc-name').value = t.name;
    $('enc-creature-type').value = t.creatureType;
    $('enc-cr').value = t.cr;
    $('enc-ac').value = String(t.ac);
    $('enc-init').value = String(t.init);
    $('enc-hp').value = String(t.hp);
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
    $('enc-perception').value = String(parseInt(String(t.perception)) || 0);
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
    Array.from(langSelect.options).forEach(o => (o.selected = false));
    (t.languages || []).forEach(lang => {
        const opt = Array.from(langSelect.options).find(o => o.value === lang);
        if (opt) opt.selected = true;
    });
    const form = $('enc-form');
    form.classList.add('open');
    const icon = $('enc-form-icon');
    icon.textContent = '▲';
    showToast(`${t.name} geladen`);
}
// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================
