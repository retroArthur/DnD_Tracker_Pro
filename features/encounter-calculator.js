// [SECTION:ENCOUNTER_CALCULATOR]
// ============================================================
// ENCOUNTER CR CALCULATOR - D&D 5e (2014 Rules)
// ============================================================

// XP Thresholds by Character Level (DMG p.82)
const XP_THRESHOLDS = {
    1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
    2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
    3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
    4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
    5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
    6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
    7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
    8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
    9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
    10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
    11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
    12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
    13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
    14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
    15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
    16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
    17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
    18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
    19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
    20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 }
};

// CR to XP conversion (DMG p.275)
const CR_TO_XP = {
    "0": 10,
    "1/8": 25,
    "1/4": 50,
    "1/2": 100,
    "1": 200,
    "2": 450,
    "3": 700,
    "4": 1100,
    "5": 1800,
    "6": 2300,
    "7": 2900,
    "8": 3900,
    "9": 5000,
    "10": 5900,
    "11": 7200,
    "12": 8400,
    "13": 10000,
    "14": 11500,
    "15": 13000,
    "16": 15000,
    "17": 18000,
    "18": 20000,
    "19": 22000,
    "20": 25000,
    "21": 33000,
    "22": 41000,
    "23": 50000,
    "24": 62000,
    "25": 75000,
    "26": 90000,
    "27": 105000,
    "28": 120000,
    "29": 135000,
    "30": 155000
};

// Encounter Multipliers (DMG p.82)
const ENCOUNTER_MULTIPLIERS = [
    { min: 1, max: 1, multiplier: 1.0, label: "1 monster" },
    { min: 2, max: 2, multiplier: 1.5, label: "2 monsters" },
    { min: 3, max: 6, multiplier: 2.0, label: "3-6 monsters" },
    { min: 7, max: 10, multiplier: 2.5, label: "7-10 monsters" },
    { min: 11, max: 14, multiplier: 3.0, label: "11-14 monsters" },
    { min: 15, max: 999, multiplier: 4.0, label: "15+ monsters" }
];

// Terrain Modifiers (homebrew, inspired by community rules)
const TERRAIN_MODIFIERS = [
    { id: 'normal', label: 'Normal', multiplier: 1.0, icon: '🏠', desc: 'Keine besonderen Bedingungen' },
    { id: 'difficult', label: 'Schwieriges Gelände', multiplier: 1.25, icon: '🌲', desc: 'Difficult Terrain, leichte Hindernisse' },
    { id: 'hazardous', label: 'Gefährlich', multiplier: 1.5, icon: '⚠️', desc: 'Fallen, Umweltschaden, schlechte Sicht' },
    { id: 'extreme', label: 'Extrem', multiplier: 2.0, icon: '💀', desc: 'Lava, Abgründe, Unterwasser' }
];

// Calculator State
let calculatorParty = []; // { level: number, count: number }
let calculatorMonsters = []; // { cr: string, count: number, name?: string }
let calculatorTerrain = 'normal'; // Terrain modifier ID
let calculatorLairActions = false; // Has lair actions (+1 effective CR)
let calculatorTargetDifficulty = 1; // 0=easy, 1=medium, 2=hard, 3=deadly

// XP-Budget-Slider Handling
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard', 'deadly'];
const DIFFICULTY_LABELS = ['Easy', 'Medium', 'Hard', 'Deadly'];

function onBudgetSliderChange(value) {
    calculatorTargetDifficulty = parseInt(value) || 1;
    updateBudgetDisplay();
}

function updateBudgetDisplay() {
    const thresholds = calculatePartyThresholds();
    const targetLevel = DIFFICULTY_LEVELS[calculatorTargetDifficulty] || 'medium';
    const targetXP = thresholds[targetLevel] || 0;
    const currentXP = calculateMonsterXP().finalXP;

    const targetEl = $('calc-budget-target-xp');
    const currentEl = $('calc-budget-current-xp');
    const labelEl = $('calc-budget-label');

    if (targetEl) targetEl.textContent = targetXP.toLocaleString();
    if (currentEl) currentEl.textContent = currentXP.toLocaleString();
    if (labelEl) labelEl.textContent = DIFFICULTY_LABELS[calculatorTargetDifficulty];
}

function applyBudgetTarget() {
    if (calculatorMonsters.length === 0) {
        showToast('Füge zuerst Monster hinzu');
        return;
    }

    const targetLevel = DIFFICULTY_LEVELS[calculatorTargetDifficulty] || 'medium';
    calculateOptimalMonsterCount(targetLevel);
    updateBudgetDisplay();
}

// ============================================================
// MONSTER FAVORITES (Presets)
// ============================================================

function saveMonsterFavorite() {
    if (calculatorMonsters.length === 0) {
        showToast('Füge zuerst Monster hinzu');
        return;
    }

    const name = prompt('Name für die Vorlage:');
    if (!name || !name.trim()) return;

    if (!D.monsterFavorites) D.monsterFavorites = [];

    D.monsterFavorites.push({
        id: Date.now(),
        name: name.trim(),
        monsters: JSON.parse(JSON.stringify(calculatorMonsters))
    });

    saveImmediate();
    showToast(`Vorlage "${name}" gespeichert`);
    renderCalculator();
}

function loadMonsterFavorite(id) {
    const fav = (D.monsterFavorites || []).find(f => f.id === id);
    if (!fav) return;

    calculatorMonsters = JSON.parse(JSON.stringify(fav.monsters));
    renderCalculator();
    recalculateEncounter();
    showToast(`Vorlage "${fav.name}" geladen`);
    closeFavoritesDropdown();
}

function deleteMonsterFavorite(id) {
    if (!D.monsterFavorites) return;

    const idx = D.monsterFavorites.findIndex(f => f.id === id);
    if (idx === -1) return;

    const name = D.monsterFavorites[idx].name;
    D.monsterFavorites.splice(idx, 1);
    saveImmediate();
    showToast(`Vorlage "${name}" gelöscht`);
    renderCalculator();
}

function toggleFavoritesDropdown() {
    const dropdown = $('calc-favorites-dropdown');
    if (!dropdown) return;

    const isVisible = dropdown.classList.contains('show');
    if (isVisible) {
        closeFavoritesDropdown();
    } else {
        renderFavoritesDropdown();
        dropdown.classList.add('show');
    }
}

function closeFavoritesDropdown() {
    const dropdown = $('calc-favorites-dropdown');
    if (dropdown) dropdown.classList.remove('show');
}

function renderFavoritesDropdown() {
    const dropdown = $('calc-favorites-dropdown');
    if (!dropdown) return;

    const favs = D.monsterFavorites || [];

    if (favs.length === 0) {
        dropdown.innerHTML = `
            <div class="calc-fav-empty">Keine Vorlagen</div>
            <div class="calc-fav-divider"></div>
            <button class="calc-fav-item save" data-action="calc-save-favorite">
                <span>➕</span><span>Aktuelle speichern...</span>
            </button>
        `;
    } else {
        dropdown.innerHTML = `
            ${favs.map(f => `
                <div class="calc-fav-item" data-action="calc-load-favorite" data-value="${f.id}">
                    <span>⭐</span>
                    <span class="calc-fav-name">${esc(f.name)}</span>
                    <span class="calc-fav-count">(${f.monsters.reduce((s, m) => s + m.count, 0)})</span>
                    <button class="calc-fav-delete" data-action="calc-delete-favorite" data-value="${f.id}" title="Löschen">×</button>
                </div>
            `).join('')}
            <div class="calc-fav-divider"></div>
            <button class="calc-fav-item save" data-action="calc-save-favorite">
                <span>➕</span><span>Aktuelle speichern...</span>
            </button>
        `;
    }
}

// ============================================================
// PARTY MANAGEMENT
// ============================================================

function addPartyLevel() {
    const level = parseInt($('calc-party-level').value) || 1;
    const count = parseInt($('calc-party-count').value) || 1;
    
    if (level < 1 || level > 20) {
        showToast('Level muss zwischen 1 und 20 sein');
        return;
    }
    
    if (count < 1) {
        showToast('Anzahl muss mindestens 1 sein');
        return;
    }
    
    // Check if level already exists
    const existing = calculatorParty.find(p => p.level === level);
    if (existing) {
        existing.count += count;
    } else {
        calculatorParty.push({ level, count });
    }
    
    // Sort by level
    calculatorParty.sort((a, b) => a.level - b.level);
    
    renderCalculator();
    recalculateEncounter();
}

function removePartyLevel(index) {
    calculatorParty.splice(index, 1);
    renderCalculator();
    recalculateEncounter();
}

function loadPartyFromCharacters() {
    if (!D.characters || D.characters.length === 0) {
        showToast('Keine Characters vorhanden');
        return;
    }
    
    calculatorParty = [];
    
    // Group characters by level
    const levelCounts = {};
    D.characters.forEach(char => {
        const level = char.level || 1;
        levelCounts[level] = (levelCounts[level] || 0) + 1;
    });
    
    // Convert to array
    Object.keys(levelCounts).forEach(level => {
        calculatorParty.push({
            level: parseInt(level),
            count: levelCounts[level]
        });
    });
    
    calculatorParty.sort((a, b) => a.level - b.level);
    
    renderCalculator();
    recalculateEncounter();
    showToast(`${D.characters.length} Characters geladen`);
}

function clearParty() {
    calculatorParty = [];
    renderCalculator();
    recalculateEncounter();
}

// ============================================================
// MONSTER MANAGEMENT
// ============================================================

function addMonster() {
    const crInput = $('calc-monster-cr').value.trim();
    const count = parseInt($('calc-monster-count').value) || 1;
    const name = $('calc-monster-name').value.trim();
    
    if (!crInput) {
        showToast('Bitte CR eingeben');
        return;
    }
    
    // Validate CR
    if (!CR_TO_XP[crInput]) {
        showToast('Ungültige CR. Erlaubt: 0, 1/8, 1/4, 1/2, 1-30');
        return;
    }
    
    if (count < 1) {
        showToast('Anzahl muss mindestens 1 sein');
        return;
    }
    
    calculatorMonsters.push({
        cr: crInput,
        count: count,
        name: name || `CR ${crInput} Monster`
    });
    
    // Clear inputs and preview
    $('calc-monster-cr').value = '';
    $('calc-monster-count').value = '1';
    $('calc-monster-name').value = '';
    clearMonsterPreview();

    renderCalculator();
    recalculateEncounter();
}

function removeMonster(index) {
    calculatorMonsters.splice(index, 1);
    renderCalculator();
    recalculateEncounter();
}

function clearMonsters() {
    calculatorMonsters = [];
    renderCalculator();
    recalculateEncounter();
    clearMonsterPreview();
}

// Live-Vorschau für Monster-Eingabe
let monsterPreviewTimer = null;

function updateMonsterPreview() {
    const previewDiv = $('calc-monster-preview');
    if (!previewDiv) return;

    const crInput = $('calc-monster-cr')?.value.trim();
    const count = parseInt($('calc-monster-count')?.value) || 1;

    // Keine Vorschau wenn kein CR oder ungültige CR
    if (!crInput || !CR_TO_XP[crInput]) {
        previewDiv.innerHTML = '';
        return;
    }

    // Keine Vorschau ohne Party
    const thresholds = calculatePartyThresholds();
    if (thresholds.totalPCs === 0) {
        previewDiv.innerHTML = '<span class="calc-preview-icon">📊</span><span class="calc-preview-same">Füge zuerst Party hinzu</span>';
        return;
    }

    // Berechne hinzugefügte XP
    const addedXP = CR_TO_XP[crInput] * count;
    const currentXP = calculateMonsterXP().finalXP;
    const currentDiff = getDifficulty(currentXP, thresholds);

    // Simuliere das Hinzufügen
    const tempMonsters = [...calculatorMonsters, { cr: crInput, count }];
    const newMonsterCount = tempMonsters.reduce((sum, m) => sum + m.count, 0);
    const newBaseXP = tempMonsters.reduce((sum, m) => sum + CR_TO_XP[m.cr] * m.count, 0);

    // Berechne neuen Multiplikator
    let newMult = 1.0;
    for (const mult of ENCOUNTER_MULTIPLIERS) {
        if (newMonsterCount >= mult.min && newMonsterCount <= mult.max) {
            newMult = mult.multiplier;
            break;
        }
    }

    // Party-Größen-Anpassung
    if (thresholds.totalPCs < 3 && newMonsterCount > 1) {
        const idx = ENCOUNTER_MULTIPLIERS.findIndex(m => m.multiplier === newMult);
        if (idx < ENCOUNTER_MULTIPLIERS.length - 1) {
            newMult = ENCOUNTER_MULTIPLIERS[idx + 1].multiplier;
        }
    } else if (thresholds.totalPCs > 5) {
        if (newMonsterCount === 1) {
            newMult = 0.5;
        } else {
            const idx = ENCOUNTER_MULTIPLIERS.findIndex(m => m.multiplier === newMult);
            if (idx > 0) {
                newMult = ENCOUNTER_MULTIPLIERS[idx - 1].multiplier;
            }
        }
    }

    const newAdjustedXP = Math.round(newBaseXP * newMult);
    const newDiff = getDifficulty(newAdjustedXP, thresholds);

    // Render Vorschau
    const diffChanged = currentDiff.level !== newDiff.level;
    const diffHtml = diffChanged
        ? `<span class="calc-preview-arrow">→</span><span class="calc-preview-change">${currentDiff.label} → ${newDiff.label}</span>`
        : `<span class="calc-preview-same">${newDiff.label}</span>`;

    previewDiv.innerHTML = `
        <span class="calc-preview-icon">📊</span>
        <span class="calc-preview-xp">+${addedXP.toLocaleString()} XP</span>
        ${diffHtml}
    `;
}

function clearMonsterPreview() {
    const previewDiv = $('calc-monster-preview');
    if (previewDiv) previewDiv.innerHTML = '';
}

// Debounced Preview-Update
function scheduleMonsterPreview() {
    if (monsterPreviewTimer) clearTimeout(monsterPreviewTimer);
    monsterPreviewTimer = setTimeout(updateMonsterPreview, 100);
}

// ============================================================
// CALCULATION
// ============================================================

function calculatePartyThresholds() {
    if (calculatorParty.length === 0) {
        return { easy: 0, medium: 0, hard: 0, deadly: 0, totalPCs: 0 };
    }
    
    let easy = 0, medium = 0, hard = 0, deadly = 0, totalPCs = 0;
    
    calculatorParty.forEach(({ level, count }) => {
        const thresholds = XP_THRESHOLDS[level];
        easy += thresholds.easy * count;
        medium += thresholds.medium * count;
        hard += thresholds.hard * count;
        deadly += thresholds.deadly * count;
        totalPCs += count;
    });
    
    return { easy, medium, hard, deadly, totalPCs };
}

function calculateMonsterXP() {
    if (calculatorMonsters.length === 0) {
        return { baseXP: 0, adjustedXP: 0, finalXP: 0, multiplier: 1.0, totalMonsters: 0, terrainMod: 1.0, hasLair: false };
    }

    // Calculate base XP
    let baseXP = 0;
    let totalMonsters = 0;

    calculatorMonsters.forEach(({ cr, count }) => {
        baseXP += CR_TO_XP[cr] * count;
        totalMonsters += count;
    });

    // Get multiplier based on number of monsters
    const partySize = calculatorParty.reduce((sum, p) => sum + p.count, 0);
    let multiplier = 1.0;

    for (const mult of ENCOUNTER_MULTIPLIERS) {
        if (totalMonsters >= mult.min && totalMonsters <= mult.max) {
            multiplier = mult.multiplier;
            break;
        }
    }

    // Adjust multiplier for party size
    if (partySize < 3 && totalMonsters > 1) {
        // Small party: use next higher multiplier
        const currentIndex = ENCOUNTER_MULTIPLIERS.findIndex(m => m.multiplier === multiplier);
        if (currentIndex < ENCOUNTER_MULTIPLIERS.length - 1) {
            multiplier = ENCOUNTER_MULTIPLIERS[currentIndex + 1].multiplier;
        }
    } else if (partySize > 5) {
        // Large party: use next lower multiplier
        const currentIndex = ENCOUNTER_MULTIPLIERS.findIndex(m => m.multiplier === multiplier);
        if (currentIndex > 0) {
            multiplier = ENCOUNTER_MULTIPLIERS[currentIndex - 1].multiplier;
        }

        // Special case: single monster against large party
        if (totalMonsters === 1) {
            multiplier = 0.5;
        }
    }

    const adjustedXP = Math.round(baseXP * multiplier);

    // Apply terrain modifier
    const terrain = TERRAIN_MODIFIERS.find(t => t.id === calculatorTerrain) || TERRAIN_MODIFIERS[0];
    const terrainMod = terrain.multiplier;

    // Apply lair actions (+25% XP, equivalent to ~1 CR increase)
    const lairMod = calculatorLairActions ? 1.25 : 1.0;

    // Final adjusted XP including all modifiers
    const finalXP = Math.round(adjustedXP * terrainMod * lairMod);

    return { baseXP, adjustedXP, finalXP, multiplier, totalMonsters, terrainMod, lairMod, hasLair: calculatorLairActions };
}

function getDifficulty(adjustedXP, thresholds) {
    if (adjustedXP === 0 || thresholds.medium === 0) {
        return { level: 'none', label: 'N/A', color: '#95a5a6', percentage: 0 };
    }
    
    if (adjustedXP < thresholds.easy) {
        return { level: 'trivial', label: 'Trivial', color: '#3498db', percentage: (adjustedXP / thresholds.easy) * 100 };
    }
    if (adjustedXP < thresholds.medium) {
        return { level: 'easy', label: 'Easy', color: '#2ecc71', percentage: 25 + ((adjustedXP - thresholds.easy) / (thresholds.medium - thresholds.easy)) * 25 };
    }
    if (adjustedXP < thresholds.hard) {
        return { level: 'medium', label: 'Medium', color: '#f39c12', percentage: 50 + ((adjustedXP - thresholds.medium) / (thresholds.hard - thresholds.medium)) * 25 };
    }
    if (adjustedXP < thresholds.deadly) {
        return { level: 'hard', label: 'Hard', color: '#e67e22', percentage: 75 + ((adjustedXP - thresholds.hard) / (thresholds.deadly - thresholds.hard)) * 25 };
    }
    
    const overDeadly = ((adjustedXP - thresholds.deadly) / thresholds.deadly) * 100;
    return { level: 'deadly', label: 'Deadly', color: '#e74c3c', percentage: 100 + Math.min(overDeadly, 100) };
}

// Erklärt den Multiplikator basierend auf Monster-Anzahl und Party-Größe
function getMultiplierExplanation(totalMonsters, partySize, multiplier) {
    // Finde Basis-Bracket
    const baseBracket = ENCOUNTER_MULTIPLIERS.find(m =>
        totalMonsters >= m.min && totalMonsters <= m.max
    );

    let lines = [];
    if (baseBracket) {
        lines.push(`${baseBracket.label} = ×${baseBracket.multiplier}`);
    }

    // Party-Größen-Anpassung
    if (partySize < 3 && totalMonsters > 1) {
        lines.push(`Kleine Party (<3): +1 Stufe`);
    } else if (partySize > 5) {
        if (totalMonsters === 1) {
            lines.push(`Große Party (>5), 1 Monster: ×0.5`);
        } else {
            lines.push(`Große Party (>5): -1 Stufe`);
        }
    }

    if (lines.length > 1) {
        lines.push(`→ Final: ×${multiplier}`);
    }

    return lines.join('\n');
}

function recalculateEncounter() {
    const thresholds = calculatePartyThresholds();
    const monsters = calculateMonsterXP();
    // Use finalXP (includes terrain & lair) for difficulty calculation
    const difficulty = getDifficulty(monsters.finalXP, thresholds);

    const resultsDiv = $('calc-results');
    if (!resultsDiv) return;

    // Empty states
    if (calculatorParty.length === 0 && calculatorMonsters.length === 0) {
        resultsDiv.innerHTML = '<div class="calc-results-empty">Füge Party-Mitglieder und Monster hinzu</div>';
        return;
    }

    if (calculatorParty.length === 0) {
        resultsDiv.innerHTML = '<div class="calc-results-empty">Füge zuerst Party-Mitglieder hinzu</div>';
        return;
    }

    if (calculatorMonsters.length === 0) {
        resultsDiv.innerHTML = '<div class="calc-results-empty">Füge Monster hinzu um die Schwierigkeit zu berechnen</div>';
        return;
    }

    // Calculate marker position (0-100%) - use finalXP
    const maxXP = thresholds.deadly * 1.5;
    const markerPos = Math.min((monsters.finalXP / maxXP) * 100, 100);

    // XP per player
    const xpPerPlayer = Math.round(monsters.baseXP / thresholds.totalPCs);

    // Build modifier info string
    const terrain = TERRAIN_MODIFIERS.find(t => t.id === calculatorTerrain) || TERRAIN_MODIFIERS[0];
    let modifierInfo = '';
    if (monsters.terrainMod !== 1.0 || monsters.hasLair) {
        const parts = [];
        if (monsters.terrainMod !== 1.0) parts.push(`${terrain.icon} ×${monsters.terrainMod}`);
        if (monsters.hasLair) parts.push(`🏰 Lair ×${monsters.lairMod}`);
        modifierInfo = ` • ${parts.join(' ')}`;
    }

    resultsDiv.innerHTML = `
        <!-- Main Difficulty Display -->
        <div class="calc-difficulty-main">
            <div class="calc-diff-badge ${difficulty.level}">${difficulty.label}</div>
            <div class="calc-diff-info">
                <div class="calc-diff-xp">${monsters.finalXP.toLocaleString()} <span>Final XP</span></div>
                <div class="calc-diff-details">
                    ${monsters.baseXP.toLocaleString()} Base × ${monsters.multiplier} (${monsters.totalMonsters} Monster)${modifierInfo}
                    ${difficulty.percentage > 100 ? ` • ${Math.round(difficulty.percentage - 100)}% über Deadly` : ''}
                </div>
            </div>
        </div>

        <!-- Threshold Bar -->
        <div class="calc-threshold-bar">
            <div class="calc-threshold-labels">
                <div class="calc-threshold-label easy">Easy<br>${thresholds.easy.toLocaleString()}</div>
                <div class="calc-threshold-label medium">Medium<br>${thresholds.medium.toLocaleString()}</div>
                <div class="calc-threshold-label hard">Hard<br>${thresholds.hard.toLocaleString()}</div>
                <div class="calc-threshold-label deadly">Deadly<br>${thresholds.deadly.toLocaleString()}</div>
            </div>
            <div class="calc-threshold-track">
                <div class="calc-threshold-seg easy"></div>
                <div class="calc-threshold-seg medium"></div>
                <div class="calc-threshold-seg hard"></div>
                <div class="calc-threshold-seg deadly"></div>
                <div class="calc-threshold-marker" style="left: ${markerPos}%"></div>
            </div>
        </div>

        <!-- Stats Grid -->
        <div class="calc-stats">
            <div class="calc-stat">
                <div class="calc-stat-value">${thresholds.totalPCs}</div>
                <div class="calc-stat-label">Spieler</div>
            </div>
            <div class="calc-stat">
                <div class="calc-stat-value">${monsters.totalMonsters}</div>
                <div class="calc-stat-label">Monster</div>
            </div>
            <div class="calc-stat">
                <div class="calc-stat-value">${xpPerPlayer.toLocaleString()}</div>
                <div class="calc-stat-label">XP/Spieler</div>
            </div>
            <div class="calc-stat">
                <div class="calc-stat-value">
                    ×${monsters.multiplier}
                    <span class="calc-stat-info" title="${getMultiplierExplanation(monsters.totalMonsters, thresholds.totalPCs, monsters.multiplier)}">ⓘ</span>
                </div>
                <div class="calc-stat-label">Multiplier</div>
            </div>
        </div>
    `;
}

// ============================================================
// QUICK ACTIONS
// ============================================================

function quickAdjustDifficulty(direction) {
    if (calculatorMonsters.length === 0) {
        showToast('Keine Monster vorhanden');
        return;
    }

    const current = calculateMonsterXP();

    if (direction === 'easier') {
        // Inkrementell: -1 Monster vom ersten Typ
        if (calculatorMonsters[0].count <= 1) {
            if (calculatorMonsters.length === 1) {
                showToast('Mindestens 1 Monster erforderlich');
                return;
            }
            // Entferne den ersten Monster-Typ komplett
            calculatorMonsters.shift();
        } else {
            calculatorMonsters[0].count--;
        }
    } else {
        // Inkrementell: +1 Monster vom ersten Typ
        calculatorMonsters[0].count++;
    }

    renderCalculator();
    recalculateEncounter();
}

// Berechnet die optimale Monster-Anzahl für ein Ziel-Schwierigkeitslevel
function calculateOptimalMonsterCount(targetDifficultyLevel) {
    if (calculatorMonsters.length === 0) {
        showToast('Keine Monster vorhanden');
        return;
    }

    const thresholds = calculatePartyThresholds();
    if (thresholds.medium === 0) {
        showToast('Keine Party vorhanden');
        return;
    }

    // Ziel-XP basierend auf Schwierigkeitslevel
    let targetXP;
    switch (targetDifficultyLevel) {
        case 'easy': targetXP = thresholds.easy; break;
        case 'medium': targetXP = thresholds.medium; break;
        case 'hard': targetXP = thresholds.hard; break;
        case 'deadly': targetXP = thresholds.deadly; break;
        default:
            showToast('Ungültiger Schwierigkeitsgrad: ' + targetDifficultyLevel);
            return;
    }

    // XP pro einzelnes Monster (vom ersten Typ)
    const cr = calculatorMonsters[0].cr;
    const monsterXP = CR_TO_XP[cr];
    if (!monsterXP) {
        showToast('Ungültige CR: ' + cr);
        return;
    }

    // Iterativ die beste Anzahl finden (berücksichtigt Multiplier-Sprünge)
    let bestCount = 1;
    let bestDiff = Infinity;

    for (let count = 1; count <= 50; count++) {
        // Berechne angepasste XP für diese Anzahl
        const baseXP = monsterXP * count;
        let multiplier = 1.0;

        for (const mult of ENCOUNTER_MULTIPLIERS) {
            if (count >= mult.min && count <= mult.max) {
                multiplier = mult.multiplier;
                break;
            }
        }

        const adjustedXP = baseXP * multiplier;
        const diff = Math.abs(adjustedXP - targetXP);

        if (diff < bestDiff) {
            bestDiff = diff;
            bestCount = count;
        }

        // Stoppe wenn wir deutlich über dem Ziel sind
        if (adjustedXP > targetXP * 1.5) break;
    }

    calculatorMonsters[0].count = bestCount;
    renderCalculator();
    recalculateEncounter();
    showToast(`Angepasst für ${targetDifficultyLevel.charAt(0).toUpperCase() + targetDifficultyLevel.slice(1)}`);
}

// Zeigt ein Dropdown zur präzisen Schwierigkeitswahl
function showDifficultySelector() {
    if (calculatorMonsters.length === 0) {
        showToast('Füge zuerst Monster hinzu');
        return;
    }

    const thresholds = calculatePartyThresholds();
    if (thresholds.medium === 0) {
        showToast('Füge zuerst Party-Mitglieder hinzu');
        return;
    }

    // Zeige Auswahl-Modal
    const levels = ['easy', 'medium', 'hard', 'deadly'];
    const labels = ['Easy', 'Medium', 'Hard', 'Deadly'];

    const choice = prompt(
        'Wähle Schwierigkeitsgrad:\n' +
        `1 = Easy (${thresholds.easy} XP)\n` +
        `2 = Medium (${thresholds.medium} XP)\n` +
        `3 = Hard (${thresholds.hard} XP)\n` +
        `4 = Deadly (${thresholds.deadly} XP)`,
        '2'
    );

    // User clicked Cancel
    if (choice === null) return;

    const idx = parseInt(choice) - 1;
    if (idx >= 0 && idx < levels.length) {
        calculateOptimalMonsterCount(levels[idx]);
    } else {
        showToast('Bitte 1-4 eingeben');
    }
}

function saveAsEncounter() {
    if (calculatorMonsters.length === 0) {
        showToast('Keine Monster zum Speichern');
        return;
    }

    const monsters = calculateMonsterXP();
    const thresholds = calculatePartyThresholds();
    // Use finalXP which includes terrain and lair modifiers
    const difficulty = getDifficulty(monsters.finalXP, thresholds);

    // Create encounter name with final XP
    const name = `Encounter (${difficulty.label}) - ${monsters.finalXP} XP`;
    
    // Create monsters array for encounter
    const encounterMonsters = calculatorMonsters.map(m => ({
        name: m.name,
        cr: m.cr,
        hp: 0, // Default
        initiative: 0,
        count: m.count
    }));
    
    // Build terrain/lair info for description
    const terrain = TERRAIN_MODIFIERS.find(t => t.id === calculatorTerrain) || TERRAIN_MODIFIERS[0];
    const envInfo = [];
    if (monsters.terrainMod !== 1.0) envInfo.push(`Terrain: ${terrain.label} (×${monsters.terrainMod})`);
    if (monsters.hasLair) envInfo.push(`Lair Actions (×${monsters.lairMod})`);

    // Add to encounters
    const newEnc = {
        id: Date.now(),
        name: name,
        monsters: encounterMonsters,
        description: `Automatisch erstellt via CR Calculator

Party: ${thresholds.totalPCs} PCs
Base XP: ${monsters.baseXP}
Adjusted XP: ${monsters.adjustedXP}${envInfo.length ? '\n' + envInfo.join(', ') : ''}
Final XP: ${monsters.finalXP}
Difficulty: ${difficulty.label}`
    };
    
    D.encounters = D.encounters || [];
    D.encounters.push(newEnc);

    save();
    showToast('Als Encounter gespeichert');

    // Ask if user wants to switch to encounters view
    if (confirm('Zu Encounters wechseln?')) {
        hideCalculatorModal();
        switchView('encounter');
        if (typeof renderEncounters === 'function') renderEncounters();
    }
}

// ============================================================
// ADD TO INITIATIVE
// ============================================================

function addCalculatorToInitiative() {
    if (calculatorMonsters.length === 0) {
        showToast('Keine Monster vorhanden');
        return;
    }

    // Initialize initiative if not exists
    if (!D.initiative) {
        D.initiative = { combatants: [], currentTurn: 0, round: 1 };
    }

    // Get terrain and lair info
    const terrain = TERRAIN_MODIFIERS.find(t => t.id === calculatorTerrain) || TERRAIN_MODIFIERS[0];
    const monsters = calculateMonsterXP();
    const thresholds = calculatePartyThresholds();
    const difficulty = getDifficulty(monsters.finalXP, thresholds);

    // Store battlefield conditions
    D.initiative.battlefield = {
        terrain: calculatorTerrain,
        terrainLabel: terrain.label,
        terrainIcon: terrain.icon,
        terrainMod: terrain.multiplier,
        hasLair: calculatorLairActions,
        finalXP: monsters.finalXP,
        difficulty: difficulty.label
    };

    // Add each monster to initiative
    let addedCount = 0;
    calculatorMonsters.forEach(monster => {
        // Get monster template for HP if available
        const template = (typeof D !== 'undefined' && D.encounters)
            ? D.encounters.find(e => e.cr === monster.cr || e.CR === monster.cr)
            : null;

        const baseHP = template?.hp || template?.HP || getDefaultHPForCR(monster.cr);
        const initBonus = template?.initBonus || template?.dex || 0;

        for (let i = 0; i < monster.count; i++) {
            // Roll initiative (1d20 + bonus)
            const initRoll = Math.floor(Math.random() * 20) + 1 + initBonus;

            // Slight HP variation (+/- 10%)
            const hpVariation = Math.round(baseHP * (0.9 + Math.random() * 0.2));
            const hp = Math.max(1, hpVariation);

            D.initiative.combatants.push({
                id: nextId('combatants'),
                name: monster.count > 1 ? `${monster.name} #${i + 1}` : monster.name,
                initiative: initRoll,
                initBonus: initBonus,
                maxHp: hp,
                currentHp: hp,
                ac: template?.ac || template?.AC || 10,
                type: 'monster',
                cr: monster.cr,
                xp: CR_TO_XP[monster.cr] || 0,
                effects: []
            });
            addedCount++;
        }
    });

    // Add lair action entry if enabled
    if (calculatorLairActions) {
        // Check if lair action entry already exists
        const existingLair = D.initiative.combatants.find(c => c.type === 'lair');
        if (!existingLair) {
            D.initiative.combatants.push({
                id: nextId('combatants'),
                name: '🏰 Lair Action',
                initiative: 20,
                initBonus: 0,
                maxHp: 0,
                currentHp: 0,
                ac: 0,
                type: 'lair',
                effects: []
            });
        }
    }

    // Sort by initiative
    D.initiative.combatants.sort((a, b) => b.initiative - a.initiative);

    save();
    hideCalculatorModal();
    switchView('initiative');
    if (typeof renderInit === 'function') renderInit();
    showToast(`${addedCount} Monster zur Initiative hinzugefügt`);
}

// Default HP by CR (rough estimates)
function getDefaultHPForCR(cr) {
    const hpByCR = {
        '0': 4, '1/8': 7, '1/4': 13, '1/2': 22,
        '1': 30, '2': 45, '3': 60, '4': 75, '5': 90,
        '6': 105, '7': 120, '8': 135, '9': 150, '10': 165,
        '11': 180, '12': 195, '13': 210, '14': 225, '15': 240,
        '16': 255, '17': 270, '18': 285, '19': 300, '20': 330
    };
    return hpByCR[cr] || 10;
}

// ============================================================
// RENDERING
// ============================================================

function renderCalculator() {
    const partyList = $('calc-party-list');
    const monsterList = $('calc-monster-list');

    if (!partyList || !monsterList) return;

    // Render Party
    if (calculatorParty.length === 0) {
        partyList.innerHTML = '<div class="calc-list-empty">Keine Charaktere</div>';
    } else {
        partyList.innerHTML = calculatorParty.map((p, i) => `
            <div class="calc-list-item">
                <span class="calc-list-text">${p.count}× Level ${p.level}</span>
                <span class="calc-list-xp">${(XP_THRESHOLDS[p.level]?.medium || 0) * p.count} XP (med)</span>
                <button class="calc-list-remove" data-action="calc-remove-party-level" data-value="${i}">✕</button>
            </div>
        `).join('');
    }

    // Render Monsters
    if (calculatorMonsters.length === 0) {
        monsterList.innerHTML = '<div class="calc-list-empty">Keine Monster</div>';
    } else {
        monsterList.innerHTML = calculatorMonsters.map((m, i) => `
            <div class="calc-list-item">
                <span class="calc-list-text">${m.count}× ${esc(m.name)}</span>
                <span class="calc-list-xp">CR ${m.cr} (${CR_TO_XP[m.cr]} XP)</span>
                <button class="calc-list-remove" data-action="calc-remove-monster" data-value="${i}">✕</button>
            </div>
        `).join('');
    }
}

// ============================================================
// MODAL VERSION
// ============================================================

function showCalculatorModal() {
    const modal = $('calculator-modal');
    if (!modal) {
        if (APP_CONFIG.DEBUG_MODE) {
            ErrorHandler.log('showCalculatorModal', new Error('Modal not found'), 'calculator-modal element missing');
        }
        return;
    }
    
    modal.classList.add('show');
    renderCalculatorModal();
    recalculateEncounter();
}

function hideCalculatorModal() {
    const modal = $('calculator-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ESC-Taste schließt Modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = $('calculator-modal');
        if (modal && modal.classList.contains('show')) {
            hideCalculatorModal();
        }
    }
});

// Klick außerhalb schließt Modal
document.addEventListener('click', function(e) {
    const modal = $('calculator-modal');
    if (modal && modal.classList.contains('show')) {
        if (e.target === modal) {
            hideCalculatorModal();
        }
    }
});

function renderCalculatorModal() {
    const modalContent = $('calculator-modal-content');
    if (!modalContent) return;

    modalContent.innerHTML = `
        <div class="calc-header">
            <h3>⚔️ Encounter Balance Calculator</h3>
            <button class="calc-close" data-action="close-calculator-modal">✕</button>
        </div>
        <div class="calc-body">
            <!-- Input Grid -->
            <div class="calc-grid">
                <!-- Party Card -->
                <div class="calc-card">
                    <div class="calc-card-header">
                        <div class="calc-card-title">🎲 Party</div>
                        <div class="calc-card-actions">
                            <button class="calc-card-btn" data-action="calc-load-party" title="Charaktere laden">📥</button>
                            <button class="calc-card-btn danger" data-action="calc-clear-party" title="Leeren">🗑️</button>
                        </div>
                    </div>
                    <div class="calc-input-row">
                        <input type="number" id="calc-party-level" class="calc-input" min="1" max="20" value="1" placeholder="Lv" style="width: 60px;">
                        <input type="number" id="calc-party-count" class="calc-input" min="1" value="4" placeholder="Anz" style="width: 60px;">
                        <button class="calc-add-btn" data-action="calc-add-party-level">+ Hinzufügen</button>
                    </div>
                    <div id="calc-party-list" class="calc-list"></div>
                </div>

                <!-- Monster Card -->
                <div class="calc-card">
                    <div class="calc-card-header">
                        <div class="calc-card-title">👹 Monster</div>
                        <div class="calc-card-actions">
                            <button class="calc-card-btn" data-action="calc-show-encounter-import" title="Aus Encounters">📥</button>
                            <div class="calc-favorites-wrap">
                                <button class="calc-card-btn" data-action="calc-toggle-favorites" title="Vorlagen">⭐</button>
                                <div id="calc-favorites-dropdown" class="calc-favorites-dropdown"></div>
                            </div>
                            <button class="calc-card-btn danger" data-action="calc-clear-monsters" title="Leeren">🗑️</button>
                        </div>
                    </div>
                    <div class="calc-input-row">
                        <input type="text" id="calc-monster-cr" class="calc-input" placeholder="CR" list="cr-datalist" style="width: 55px;" oninput="scheduleMonsterPreview()">
                        <datalist id="cr-datalist">
                            ${['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'].map(cr => `<option value="${cr}">`).join('')}
                        </datalist>
                        <input type="number" id="calc-monster-count" class="calc-input" min="1" value="1" placeholder="#" style="width: 50px;" oninput="scheduleMonsterPreview()">
                        <input type="text" id="calc-monster-name" class="calc-input" placeholder="Name (opt.)" style="flex: 1; min-width: 60px;">
                        <button class="calc-add-btn" data-action="calc-add-monster">+</button>
                    </div>
                    <div id="calc-monster-preview" class="calc-monster-preview"></div>
                    <div id="calc-monster-list" class="calc-list"></div>
                </div>
            </div>

            <!-- XP Budget Slider -->
            <div class="calc-budget-section">
                <div class="calc-budget-header">
                    <span class="calc-budget-title">🎯 Ziel-Schwierigkeit</span>
                    <span id="calc-budget-label" class="calc-budget-current-level">${DIFFICULTY_LABELS[calculatorTargetDifficulty]}</span>
                </div>
                <div class="calc-budget-slider-wrap">
                    <input type="range" id="calc-budget-slider"
                           min="0" max="3" step="1" value="${calculatorTargetDifficulty}"
                           oninput="onBudgetSliderChange(this.value)">
                    <div class="calc-budget-labels">
                        <span>Easy</span>
                        <span>Medium</span>
                        <span>Hard</span>
                        <span>Deadly</span>
                    </div>
                </div>
                <div class="calc-budget-info">
                    <span>Ziel: <strong id="calc-budget-target-xp">0</strong> XP</span>
                    <button class="calc-budget-apply" data-action="calc-apply-budget">Anpassen</button>
                    <span>Aktuell: <strong id="calc-budget-current-xp">0</strong> XP</span>
                </div>
            </div>

            <!-- Environment Modifiers -->
            <div class="calc-env-section">
                <div class="calc-env-row">
                    <div class="calc-env-group">
                        <label class="calc-env-label">🗺️ Terrain</label>
                        <div class="calc-terrain-btns">
                            ${TERRAIN_MODIFIERS.map(t => `
                                <button class="calc-terrain-btn ${calculatorTerrain === t.id ? 'active' : ''}"
                                        data-action="calc-set-terrain" data-value="${t.id}"
                                        title="${t.desc}">
                                    ${t.icon} ${t.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="calc-env-group">
                        <label class="calc-env-label">🏰 Lair Actions</label>
                        <label class="calc-lair-toggle">
                            <input type="checkbox" id="calc-lair-actions" ${calculatorLairActions ? 'checked' : ''}
                                   data-action="calc-toggle-lair">
                            <span class="calc-lair-slider"></span>
                            <span class="calc-lair-text">${calculatorLairActions ? 'Aktiv (+25%)' : 'Inaktiv'}</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Results -->
            <div id="calc-results" class="calc-results"></div>

            <!-- Actions -->
            <div class="calc-actions">
                <button class="calc-action-btn secondary" data-action="calc-adjust-difficulty" data-value="easier">➖ Einfacher</button>
                <button class="calc-action-btn secondary" data-action="calc-show-difficulty-selector">🎯 Ziel wählen</button>
                <button class="calc-action-btn secondary" data-action="calc-adjust-difficulty" data-value="harder">➕ Schwieriger</button>
                <button class="calc-action-btn initiative" data-action="calc-add-to-initiative">⚔️ Zur Initiative</button>
                <button class="calc-action-btn primary" data-action="calc-save-encounter">💾 Speichern</button>
            </div>
        </div>
    `;

    renderCalculator();
    updateBudgetDisplay();
}

// Terrain and Lair action handlers
function setCalculatorTerrain(terrainId) {
    calculatorTerrain = terrainId;
    renderCalculatorModal();
    recalculateEncounter();
}

function toggleCalculatorLair() {
    calculatorLairActions = !calculatorLairActions;
    renderCalculatorModal();
    recalculateEncounter();
}

// Encounter Import Dialog
function showEncounterImport() {
    if (!D.encounters || D.encounters.length === 0) {
        showToast('Keine Encounters vorhanden');
        return;
    }

    const modalContent = $('calculator-modal-content');

    modalContent.innerHTML = `
        <div class="calc-header">
            <h3>Kreatur auswaehlen</h3>
            <button class="calc-close" data-action="calc-back-to-calculator">x</button>
        </div>
        <div class="calc-body">
            <div class="calc-import-grid">
                ${D.encounters.map(enc => {
                    const cr = enc.cr || enc.CR || '0';
                    const xp = CR_TO_XP[cr] || 0;
                    const type = enc.creatureType || enc.type || '';

                    return `
                        <div class="calc-import-card">
                            <div class="calc-import-info">
                                <div class="calc-import-name">${esc(enc.name)}</div>
                                <div class="calc-import-meta">${type ? type + ' - ' : ''}CR ${cr} - ${xp} XP</div>
                            </div>
                            <div class="calc-import-actions">
                                <input type="number" class="calc-import-count" id="import-count-${enc.id}" min="1" value="1" title="Anzahl">
                                <button class="calc-import-btn" data-action="calc-import-encounter" data-value="${enc.id}">+</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="calc-import-footer">
                <button class="calc-action-btn secondary" data-action="calc-back-to-calculator">Zurueck</button>
            </div>
        </div>
    `;
}

function importEncounterMonsters(encId) {
    const encounter = D.encounters.find(e => e.id === encId || e.id === parseInt(encId));
    
    if (!encounter) {
        showToast('Kreatur nicht gefunden (ID: ' + encId + ')');
        ErrorHandler.log('importEncounterMonsters', new Error('Encounter not found'), `ID: ${encId}`);
        return;
    }

    // Encounter IST die Kreatur selbst
    const cr = encounter.cr || encounter.CR || null;

    if (!cr) {
        showToast('Kreatur hat kein CR');
        if (APP_CONFIG.DEBUG_MODE) {
            ErrorHandler.log('importEncounterMonsters', new Error('Missing CR'), `Encounter: ${encounter.name || encId}`);
        }
        return;
    }
    
    // Füge Kreatur zur Monster-Liste hinzu (nicht ersetzen!)
    calculatorMonsters.push({
        cr: cr,
        count: (() => {
        const countInput = $('import-count-' + encId);
        return countInput ? parseInt(countInput.value) || 1 : 1;
    })(),
        name: encounter.name || `CR ${cr} Kreatur`
    });
    
    renderCalculatorModal();
    recalculateEncounter();
    showToast(`"${encounter.name}" (CR ${cr}) hinzugefügt`);
}

function renderEncounterCalculator() {
    // Legacy function - now just shows modal
    showCalculatorModal();
}
