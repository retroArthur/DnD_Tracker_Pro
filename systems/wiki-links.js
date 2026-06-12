// [SECTION:WIKI_LINKS]
// Extrahiert aus dice.js
// Wiki-Link-Syntax
// Zeilen: 51
// ============================================================
// WIKI LINKS - [[Type:Name]] Syntax
// ============================================================
function processWikiLinks(text) {
    if (!text) return text;
    // Pattern: [[NPC:Name]], [[Ort:Name]], [[Quest:Name]], [[Zauber:Name]]
    const pattern = /\[\[([^:\]]+):([^\]]+)\]\]/g;
    return text.replace(pattern, (match, type, name) => {
        const typeLower = type.toLowerCase();
        let found = null;
        let targetType = '';
        switch (typeLower) {
            case 'npc':
                found = EntityLookup.findByName('npcs', name);
                targetType = 'npc';
                break;
            case 'ort':
            case 'location':
                found = EntityLookup.findByName('locations', name);
                targetType = 'location';
                break;
            case 'quest':
                found = EntityLookup.findByName('quests', name, 'title');
                targetType = 'quest';
                break;
            case 'zauber':
            case 'spell':
                found = EntityLookup.findByName('spells', name);
                targetType = 'spell';
                break;
            case 'char':
            case 'charakter':
                found = EntityLookup.findByName('characters', name);
                targetType = 'character';
                break;
        }
        if (found) {
            return `<span class="wiki-link" data-action="navigate-result" data-type="${targetType}" data-id="${found.id}" data-loc="${found.locationId || 'null'}">${esc(name)}</span>`;
        }
        return `<span style="color: var(--red);" title="Nicht gefunden">${esc(name)}</span>`;
    });
}
// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================
