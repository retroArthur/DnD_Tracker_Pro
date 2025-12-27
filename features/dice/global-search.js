// [SECTION:GLOBAL_SEARCH]
// Extrahiert aus dice.js
// Globale Suche mit Fuzzy-Match
// Zeilen: 249

// GLOBAL SEARCH (mit Fuzzy-Match)
// ============================================================

// Fuzzy-Match Algorithmus
function fuzzyMatch(text, query) {
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
function fuzzySearchFields(item, query, fields) {
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

function performGlobalSearch() {
    const query = $('global-search').value.trim();
    const results = $('global-search-results');
    
    if (!query || query.length < 2) {
        results.classList.remove('visible');
        return;
    }
    
    const matches = [];
    
    // Search Characters (fuzzy)
    D.characters.forEach(c => {
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
    D.npcs.forEach(n => {
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
    D.locations.forEach(l => {
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
    D.quests.forEach(q => {
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
    D.spells.forEach(s => {
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
    (D.encounters || []).forEach(e => {
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
    
    if (matches.length === 0) {
        results.innerHTML = '<div class="search-result-item" style="color: var(--text-dim);">Keine Ergebnisse für "' + esc(query) + '"</div>';
    } else {
        results.innerHTML = matches.slice(0, 12).map(m => `
            <div class="search-result-item" data-action="navigate-result" data-type="${m.type}" data-id="${m.id}" data-loc="${m.locId || 'null'}">
                <span class="search-result-type ${m.type}">${getTypeIcon(m.type)}</span>
                <span class="search-result-name">${highlightMatch(m.name, query)}</span>
                ${m.detail ? `<div class="search-result-detail">${esc(m.detail)}</div>` : ''}
            </div>
        `).join('');
    }
    
    results.classList.add('visible');
}

function getTypeIcon(type) {
    const icons = {
        'character': '👤',
        'npc': '🎭',
        'location': '🏠',
        'quest': '📜',
        'spell': '✨',
        'encounter': '👹'
    };
    return icons[type] || '📋';
}

function highlightMatch(text, query) {
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

function navigateToResult(type, id, locId) {
    $('global-search').value = '';
    $('global-search-results').classList.remove('visible');
    
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
document.addEventListener('click', function(e) {
    if (!e.target.closest('.global-search-container')) {
        $('global-search-results').classList.remove('visible');
    }
});

// ============================================================