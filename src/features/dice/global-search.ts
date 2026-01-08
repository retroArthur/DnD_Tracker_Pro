// [SECTION:GLOBAL_SEARCH]
// Extrahiert aus dice.js
// Globale Suche mit Fuzzy-Match
// Zeilen: 256

import { $, esc } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { debounce } from '@utils/utilities';
import { EntityLookup } from '@render/helpers';

// ============================================================
// TYPES
// ============================================================

interface FuzzyMatchResult {
    match: boolean;
    score: number;
}

interface SearchMatch {
    type: string;
    name: string;
    detail: string;
    id: number;
    locId?: number | string;
    score: number;
}

// ============================================================
// GLOBAL SEARCH (mit Fuzzy-Match)
// ============================================================

const D = (window as any).D;
const LINK_ICONS = (window as any).LINK_ICONS;
const switchView = (window as any).switchView;
const toggleLocation = (window as any).toggleLocation;
const editChar = (window as any).editChar;
const editNPC = (window as any).editNPC;
const editQuest = (window as any).editQuest;
const editSpell = (window as any).editSpell;

// Fuzzy-Match Algorithmus
function fuzzyMatch(text: string, query: string): FuzzyMatchResult {
    if (!text || !query) return { match: false, score: 0 };

    text = text.toLowerCase();
    query = query.toLowerCase();

    // Exakte Übereinstimmung hat höchste Priorität
    if (text.includes(query)) {
        return { match: true, score: 100 - text.indexOf(query) };
    }

    // Fuzzy-Match: Alle Zeichen müssen in Reihenfolge vorkommen
    let textIndex = 0;
    let queryIndex = 0;
    let score = 0;
    let consecutiveBonus = 0;

    while (textIndex < text.length && queryIndex < query.length) {
        if (text[textIndex] === query[queryIndex]) {
            score += 10 + consecutiveBonus;
            consecutiveBonus += 5; // Bonus für aufeinanderfolgende Treffer
            queryIndex++;
        } else {
            consecutiveBonus = 0;
        }
        textIndex++;
    }

    // Alle Query-Zeichen gefunden?
    if (queryIndex === query.length) {
        // Bonus wenn am Wortanfang
        if (text.startsWith(query[0])) score += 15;
        return { match: true, score: score };
    }

    return { match: false, score: 0 };
}

// Multi-Field Fuzzy-Search
function fuzzySearchFields(item: any, query: string, fields: string[]): number {
    let bestScore = 0;

    for (const field of fields) {
        const value = item[field];
        if (value) {
            const result = fuzzyMatch(String(value), query);
            if (result.match && result.score > bestScore) {
                bestScore = result.score;
            }
        }
    }

    return bestScore;
}

// Debounced Version der globalen Suche (150ms Verzögerung)
const debouncedGlobalSearch = debounce(performGlobalSearch, 150);

export function performGlobalSearch(): void {
    const input = $('global-search') as HTMLInputElement | null;
    const results = $('global-search-results');

    if (!input || !results) return;

    const query = input.value.trim();

    if (!query || query.length < 2) {
        results.classList.remove('visible');
        return;
    }

    const matches: SearchMatch[] = [];

    // Search Characters (fuzzy)
    D.characters.forEach((c: any) => {
        const score = fuzzySearchFields(c, query, ['name', 'playerName', 'characterClass', 'race', 'background']);
        if (score > 0) {
            matches.push({
                type: 'character',
                name: c.name,
                detail: c.characterClass ? `${c.characterClass} Lv.${c.level}` : '',
                id: c.id,
                score: score
            });
        }
    });

    // Search NPCs (fuzzy)
    D.npcs.forEach((n: any) => {
        const score = fuzzySearchFields(n, query, ['name', 'role', 'description', 'chapter']);
        if (score > 0) {
            matches.push({
                type: 'npc',
                name: n.name,
                detail: n.role || '',
                id: n.id,
                locId: n.locationId,
                score: score
            });
        }
    });

    // Search Locations (fuzzy)
    D.locations.forEach((l: any) => {
        const score = fuzzySearchFields(l, query, ['name', 'description', 'type']);
        if (score > 0) {
            matches.push({
                type: 'location',
                name: l.name,
                detail: l.type || '',
                id: l.id,
                score: score
            });
        }
    });

    // Search Quests (fuzzy)
    D.quests.forEach((q: any) => {
        const score = fuzzySearchFields(q, query, ['title', 'description', 'giver', 'location']);
        if (score > 0) {
            matches.push({
                type: 'quest',
                name: q.title,
                detail: q.completed ? '✓ Abgeschlossen' : 'Aktiv',
                id: q.id,
                score: score
            });
        }
    });

    // Search Spells (fuzzy)
    D.spells.forEach((s: any) => {
        const score = fuzzySearchFields(s, query, ['name', 'school', 'description']);
        if (score > 0) {
            matches.push({
                type: 'spell',
                name: s.name,
                detail: s.level === 0 ? 'Zaubertrick' : `Grad ${s.level}`,
                id: s.id,
                score: score
            });
        }
    });

    // Search Encounters (fuzzy)
    (D.encounters || []).forEach((e: any) => {
        const score = fuzzySearchFields(e, query, ['name', 'type', 'notes']);
        if (score > 0) {
            matches.push({
                type: 'encounter',
                name: e.name,
                detail: e.type || '',
                id: e.id,
                score: score
            });
        }
    });

    // Sortiere nach Score (beste Treffer zuerst)
    matches.sort((a, b) => b.score - a.score);

    // Erlaubte Typen für Whitelist-Validierung (XSS-Schutz)
    const allowedTypes = ['character', 'npc', 'location', 'quest', 'spell', 'encounter', 'loot', 'wiki'];

    if (matches.length === 0) {
        results.innerHTML = '<div class="search-result-item" style="color: var(--text-dim);">Keine Ergebnisse für "' + esc(query) + '"</div>';
    } else {
        results.innerHTML = matches.slice(0, 12).map(m => {
            // Sanitize type via Whitelist
            const safeType = allowedTypes.includes(m.type) ? m.type : 'unknown';
            const safeId = typeof m.id === 'number' ? m.id : parseInt(String(m.id)) || 0;
            const safeLocId = m.locId && typeof m.locId === 'number' ? m.locId : 'null';

            return `
                <div class="search-result-item" data-action="navigate-result" data-type="${safeType}" data-id="${safeId}" data-loc="${safeLocId}">
                    <span class="search-result-type ${safeType}">${getTypeIcon(safeType)}</span>
                    <span class="search-result-name">${highlightMatch(m.name, query)}</span>
                    ${m.detail ? `<div class="search-result-detail">${esc(m.detail)}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    results.classList.add('visible');
}

function getTypeIcon(type: string): string {
    // LINK_ICONS aus core/constants.js (unterstützt Singular und Plural)
    return LINK_ICONS[type] || LINK_ICONS[type + 's'] || '📋';
}

function highlightMatch(text: string, query: string): string {
    if (!text || !query) return esc(text);

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // Für exakte Substring-Matches
    const index = lowerText.indexOf(lowerQuery);
    if (index >= 0) {
        return esc(text.substring(0, index)) +
               '<mark>' + esc(text.substring(index, index + query.length)) + '</mark>' +
               esc(text.substring(index + query.length));
    }

    return esc(text);
}

export function navigateToResult(type: string, id: number | string, locId?: number | string): void {
    const input = $('global-search') as HTMLInputElement | null;
    const results = $('global-search-results');

    if (input) input.value = '';
    if (results) results.classList.remove('visible');

    switch(type) {
        case 'character':
            switchView('party');
            setTimeout(() => editChar(id), 100);
            break;
        case 'npc':
            switchView('locations');
            if (locId) {
                setTimeout(() => {
                    const loc = EntityLookup.location(locId);
                    if (loc) toggleLocation(locId);
                    editNPC(id);
                }, 100);
            } else {
                switchView('npcs');
            }
            break;
        case 'location':
            switchView('locations');
            setTimeout(() => toggleLocation(id), 100);
            break;
        case 'quest':
            switchView('quests');
            setTimeout(() => editQuest(id), 100);
            break;
        case 'spell':
            switchView('spells');
            setTimeout(() => editSpell(id), 100);
            break;
    }
}

// Close search on click outside
document.addEventListener('click', function(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.closest('.global-search-container')) {
        const results = $('global-search-results');
        if (results) results.classList.remove('visible');
    }
});

// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================

(window as any).debouncedGlobalSearch = debouncedGlobalSearch;
(window as any).performGlobalSearch = performGlobalSearch;
(window as any).navigateToResult = navigateToResult;
