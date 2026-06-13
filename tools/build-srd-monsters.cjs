#!/usr/bin/env node
/**
 * tools/build-srd-monsters.cjs
 *
 * One-off build-time script to fetch ~150 German SRD 5.1 monster statblocks
 * from openrpg.de/srd/5e/de/api/ and embed them in core/srd-monsters.js.
 *
 * Run: node tools/build-srd-monsters.cjs
 *
 * Data source: openrpg.de/srd/5e/de/api/ (CC-BY-4.0)
 * Attribution: SRD 5.1 DE, © 2023 Wizards of the Coast LLC
 */

'use strict';

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://openrpg.de/srd/5e/de/api/monster';
const OUT_FILE = path.join(__dirname, '..', 'core', 'srd-monsters.js');

// The 12 required seed IDs (from monster-templates.js + plan requirements)
const REQUIRED_SEEDS = [
    'goblin', 'skelett', 'zombie', 'ork', 'wolf', 'bandit',
    'wache', 'kobold', 'riesenratte', 'kultist', 'oger', 'troll'
];

// Curated selection of ~150 monsters balanced across CR ranges
// Includes all 12 required seeds + common table foes + boss monsters
const SELECTED_IDS = [
    // CR 0
    'ratte', 'katze', 'wiesel', 'frosch', 'spinne', 'krabbe', 'eidechse',
    'fledermaus', 'dachs', 'rabe', 'schakal', 'adler', 'ziege', 'pony',
    // CR 1/8
    'kobold', 'riesenratte', 'bandit', 'wache', 'kultist', 'akolyth',
    'riesenfeuerkaefer', 'riesenwiesel', 'riesenfledermaus', 'quipper',
    // CR 1/4
    'goblin', 'skelett', 'wolf', 'riesenratte', 'riesenspinne',
    'riesenfrosch', 'pseudodrache', 'seiler', 'stammeskrieger', 'blutmuecke',
    'riesengiftschlange', 'riesenwolfsspinne', 'panther',
    // CR 1/2
    'zombie', 'ork', 'hobgoblin', 'gnoll', 'giftschlange',
    'schreckenswolf', 'worg', 'riesenziege', 'riesenoktopus', 'magmin',
    'schlaeger', 'duergar', 'drow-elf',
    // CR 1
    'gemeiner', 'ghul', 'harpy', 'harpyie', 'klingenteufel', 'drachenschildkroete',
    'quasit', 'dretch', 'satyr', 'dryade', 'braunbaer', 'riesenspinne',
    'riesenkroete', 'riesenkrabbe', 'imp',
    // CR 2
    'oger', 'grick', 'ankheg', 'berserker', 'atterkopp', 'mimik',
    'schwarzer-blob', 'riesenkrokodil', 'seeoger', 'grottenschrat',
    'bartteufel', 'irrlicht', 'gruene-vettel', 'nachtvettel', 'riesenadler',
    'eulenbaer', 'loewe', 'saebelzahntiger',
    // CR 3
    'manticore', 'mantikor', 'gargyl', 'verde', 'basilisk', 'teufelchen',
    'gruftschrecken', 'dunkelelf', 'duergar', 'kreischer', 'todesalb',
    'todeshund', 'wyvern', 'riesenspinne', 'riesenhai',
    // CR 4
    'otyugh', 'assassine', 'gladiator', 'veteran', 'geisternaga',
    'chuul', 'minotaurus', 'lamia', 'succubus', 'sukkubus-inkubus',
    // CR 5
    'troll', 'hezrou', 'salamander', 'treppe', 'schatten', 'hydra',
    'purpurwurm', 'medusa', 'remorhaz', 'gallertwuerfel', 'phasenspinne',
    // CR 6
    'chimera', 'chimaere', 'dretch', 'oni', 'waechternaga', 'rakshasa',
    // CR 7
    'schildwaechter', 'glabrezu',
    // CR 8
    'hezrou', 'assassine', 'hydra',
    // CR 9
    'golem', 'fleischgolem', 'lehmgolem',
    // CR 10
    'steingol', 'steingolem', 'deva',
    // CR 11
    'marilith', 'balor', 'eisteufel',
    // CR 13
    'nalfeshnee', 'vrock', 'couatl', 'lich',
    // CR 14
    'hornteufel',
    // CR 17
    'kraken', 'huegelriese',
    // CR 20
    'tarraske',
    // Bosses / Dragons
    'junger-roter-drache', 'ausgewachsener-roter-drache', 'uralter-roter-drache',
    'junger-gruener-drache', 'ausgewachsener-schwarzer-drache',
    'ausgewachsener-golddrache', 'feuerriese', 'eisbaer', 'eisteufel',
    'mumienfuerst', 'vampir', 'lich', 'kraken', 'planetar', 'solar',
    // Giants
    'feuerriese', 'eisriese', 'steinriese', 'huegelriese', 'sturmriese', 'frostriese', 'wolkenriese',
    // Additional commons
    'priester', 'ritter', 'magier', 'spaeher', 'adeliger', 'doppelgaenger',
    'spion', 'erzmagier', 'druide', 'gladiator', 'veteran',
];

// Deduplicate
const FETCH_IDS = [...new Set([...REQUIRED_SEEDS, ...SELECTED_IDS])];

async function fetchWithTimeout(url, ms = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        const res = await fetch(url, { signal: controller.signal });
        return res;
    } finally {
        clearTimeout(timer);
    }
}

function stripId(apiId) {
    // "monster-goblin" -> "goblin"
    return apiId.replace(/^monster-/, '');
}

function parseAttribute(attributes, cls) {
    const attr = attributes.find(a => a.class === cls);
    return attr ? parseInt(attr.value, 10) : 10;
}

function parseSpeed(speeds) {
    if (!speeds) return { walk: '', fly: '', swim: '', climb: '', burrow: '' };
    return {
        walk: speeds.walk || '',
        fly: speeds.fly || '',
        swim: speeds.swim || '',
        climb: speeds.climb || '',
        burrow: speeds.burrow || ''
    };
}

function parseSavingThrows(savingThrowsArr) {
    if (!savingThrowsArr || !Array.isArray(savingThrowsArr)) return {};
    // Format: ["Ges +6", "Kon +13", "Wei +7", "Cha +11"]
    const map = {
        'Str': 'str', 'Stä': 'str', 'Ges': 'dex', 'Kon': 'con',
        'Int': 'int', 'Wei': 'wis', 'Cha': 'cha'
    };
    const result = {};
    savingThrowsArr.forEach(s => {
        const parts = s.trim().split(/\s+/);
        if (parts.length >= 2) {
            const abbr = parts[0];
            const val = parts[1];
            const key = map[abbr];
            if (key) result[key] = val;
        }
    });
    return result;
}

function parseSkills(skillsArr) {
    if (!skillsArr || !Array.isArray(skillsArr)) return {};
    // Format: ["Heimlichkeit +6", "Wahrnehmung +13"]
    const result = {};
    skillsArr.forEach(s => {
        const match = s.match(/^(.+?)\s+([+-]\d+)$/);
        if (match) {
            const skillName = match[1].toLowerCase().trim()
                .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
                .replace(/\s+/g, '_');
            result[skillName] = match[2];
        }
    });
    return result;
}

function parseXP(xpStr) {
    if (!xpStr) return 0;
    // "18.000" -> 18000
    return parseInt(String(xpStr).replace(/\./g, '').replace(/,/g, ''), 10) || 0;
}

function parseLegendaryActions(legendaryArr) {
    if (!legendaryArr || !Array.isArray(legendaryArr)) return [];
    return legendaryArr.map(la => {
        // Extract cost from name e.g. "Flügelangriff (kostet 2 Aktionen)"
        const costMatch = la.name.match(/kostet\s+(\d+)\s+Aktionen?/i);
        const cost = costMatch ? parseInt(costMatch[1], 10) : 1;
        return {
            name: la.name,
            desc: la.value || la.desc || '',
            cost
        };
    });
}

function mapMonster(data, overrideId) {
    const rawId = data.id ? stripId(data.id) : overrideId;
    const attributes = data.attributes || [];

    const legendaryActionsRaw = parseLegendaryActions(data['legendary-actions']);
    const legendaryActionsPerRound = legendaryActionsRaw.length > 0 ? 3 : 0;

    return {
        _id: rawId,
        name: data.name || '',
        size: data.size || '',
        creatureType: data.type || '',
        alignment: data.alignment || '',
        cr: String(data.challenge || '0'),
        xp: parseXP(data.xp),
        ac: data['armor-class'] ? parseInt(data['armor-class'].value, 10) || 0 : 0,
        acInfo: data['armor-class'] ? (data['armor-class'].info || '') : '',
        hp: data['hit-points'] ? parseInt(data['hit-points'].value, 10) || 0 : 0,
        hpFormula: data['hit-points'] ? (data['hit-points'].formula || '') : '',
        speed: parseSpeed(data.speeds),
        str: parseAttribute(attributes, 'str'),
        dex: parseAttribute(attributes, 'dex'),
        con: parseAttribute(attributes, 'con'),
        int: parseAttribute(attributes, 'int'),
        wis: parseAttribute(attributes, 'wis'),
        cha: parseAttribute(attributes, 'cha'),
        savingThrows: parseSavingThrows(data['saving-throws']),
        skills: parseSkills(data.skills),
        damageResistances: Array.isArray(data['damage-resistances']) ? data['damage-resistances'] : [],
        damageImmunities: Array.isArray(data['damage-immunitys']) ? data['damage-immunitys'] : [],
        conditionImmunities: Array.isArray(data['condition-immunitys']) ? data['condition-immunitys'] : [],
        senses: Array.isArray(data.senses) ? data.senses : [],
        languages: Array.isArray(data.languages) ? data.languages : [],
        traits: Array.isArray(data.traits) ? data.traits.map(t => ({ name: t.name || '', desc: t.value || t.desc || '' })) : [],
        actions: Array.isArray(data.actions) ? data.actions.map(a => ({ name: a.name || '', desc: a.value || a.desc || '' })) : [],
        reactions: Array.isArray(data.reactions) ? data.reactions.map(r => ({ name: r.name || '', desc: r.value || r.desc || '' })) : [],
        legendaryActions: legendaryActionsRaw,
        legendaryActionsPerRound
    };
}

async function fetchMonster(id) {
    const url = `${BASE_URL}/${id}/json`;
    try {
        const res = await fetchWithTimeout(url, 12000);
        if (!res.ok) {
            console.error(`  SKIP ${id}: HTTP ${res.status}`);
            return null;
        }
        const data = await res.json();
        if (!data.name) {
            console.error(`  SKIP ${id}: no name in response`);
            return null;
        }
        return mapMonster(data, id);
    } catch (e) {
        console.error(`  SKIP ${id}: ${e.message}`);
        return null;
    }
}

async function main() {
    console.log(`Fetching ${FETCH_IDS.length} monster IDs from openrpg.de...`);

    // First verify all required seeds are in the list
    for (const seed of REQUIRED_SEEDS) {
        if (!FETCH_IDS.includes(seed)) {
            console.warn(`WARNING: required seed "${seed}" not in fetch list`);
        }
    }

    const monsters = [];
    const seen = new Set();
    let successCount = 0;
    let failCount = 0;

    // Fetch sequentially with small delay to be polite to the server
    for (const id of FETCH_IDS) {
        if (seen.has(id)) continue;
        seen.add(id);

        process.stdout.write(`  Fetching ${id}... `);
        const monster = await fetchMonster(id);
        if (monster) {
            monsters.push(monster);
            successCount++;
            console.log(`OK (${monster.name}, CR ${monster.cr})`);
        } else {
            failCount++;
        }

        // Small delay between requests
        await new Promise(r => setTimeout(r, 150));
    }

    console.log(`\nFetch complete: ${successCount} success, ${failCount} failed`);

    // Check required seeds
    const foundIds = new Set(monsters.map(m => m._id));
    const missingSeeds = REQUIRED_SEEDS.filter(s => !foundIds.has(s));
    if (missingSeeds.length > 0) {
        console.warn(`WARNING: Missing required seeds: ${missingSeeds.join(', ')}`);
    } else {
        console.log('All 12 required seeds present: ' + REQUIRED_SEEDS.join(', '));
    }

    // Check for legendary actions
    const withLegendary = monsters.filter(m => m.legendaryActions.length > 0);
    console.log(`Monsters with legendary actions: ${withLegendary.length}`);
    withLegendary.forEach(m => console.log(`  - ${m.name} (${m.legendaryActions.length} actions, ${m.legendaryActionsPerRound}/round)`));

    // Sort by CR then name
    const CR_ORDER = { '0': 0, '1/8': 0.125, '1/4': 0.25, '1/2': 0.5 };
    monsters.sort((a, b) => {
        const crA = CR_ORDER[a.cr] !== undefined ? CR_ORDER[a.cr] : (parseFloat(a.cr) || 0);
        const crB = CR_ORDER[b.cr] !== undefined ? CR_ORDER[b.cr] : (parseFloat(b.cr) || 0);
        if (crA !== crB) return crA - crB;
        return a.name.localeCompare(b.name, 'de');
    });

    // Generate JS file
    const header = `// [SECTION:SRD_MONSTERS]
// ============================================================
// SRD 5.1 DE Monster-Datenbank — CC-BY-4.0
// Quelle: Wizards of the Coast / openrpg.de/srd/5e/de/
// Attribution: "Dungeons & Dragons, SRD 5.1 DE" — CC BY 4.0
// Originalquelle: media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1_DE.pdf
// Repository: codeberg.org/nesges/SRD-5.1-DE
// Generiert: ${new Date().toISOString().slice(0, 10)} via tools/build-srd-monsters.cjs
// Monster: ${monsters.length} | Lizenz: Creative Commons Attribution 4.0 International
// Die Daten werden erst beim ersten Zugriff initialisiert (lazy-cache).
// NIEMALS D.* = getSRDMonsters() — SRD-Daten leben ausschliesslich im
// Closure-Cache, nie in D (Architektur-Constraint, Phase 3).
// ============================================================

let _srdMonstersCache = null;

function getSRDMonsters() {
    if (_srdMonstersCache) return _srdMonstersCache;
    _srdMonstersCache = `;

    const footer = `;
    return _srdMonstersCache;
}

window.getSRDMonsters = getSRDMonsters;
`;

    const jsonData = JSON.stringify(monsters, null, 4);
    const output = header + jsonData + footer;

    fs.writeFileSync(OUT_FILE, output, 'utf8');
    console.log(`\nWritten to ${OUT_FILE}`);
    console.log(`File size: ${Math.round(output.length / 1024)} KB unminified`);
    console.log(`Monster count: ${monsters.length}`);

    if (monsters.length < 100) {
        console.error('ERROR: Less than 100 monsters fetched! Check network and retry.');
        process.exit(1);
    }

    console.log('\nDone! Run: npx jest tests/unit/srd-monsters.test.js to verify.');
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
