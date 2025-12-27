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

// Calculator State
let calculatorParty = []; // { level: number, count: number }
let calculatorMonsters = []; // { cr: string, count: number, name?: string }

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
    
    // Clear inputs
    $('calc-monster-cr').value = '';
    $('calc-monster-count').value = '1';
    $('calc-monster-name').value = '';
    
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
        return { baseXP: 0, adjustedXP: 0, multiplier: 1.0, totalMonsters: 0 };
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
    
    return { baseXP, adjustedXP, multiplier, totalMonsters };
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

function recalculateEncounter() {
    const thresholds = calculatePartyThresholds();
    const monsters = calculateMonsterXP();
    const difficulty = getDifficulty(monsters.adjustedXP, thresholds);
    
    // Update UI
    const resultsDiv = $('calc-results');
    if (!resultsDiv) return;
    
    if (calculatorParty.length === 0) {
        resultsDiv.innerHTML = '<div class="calc-empty">Bitte füge zuerst Party-Mitglieder hinzu</div>';
        return;
    }
    
    if (calculatorMonsters.length === 0) {
        resultsDiv.innerHTML = '<div class="calc-empty">Bitte füge Monster hinzu</div>';
        return;
    }
    
    resultsDiv.innerHTML = `
        <div class="calc-results-section">
            <h3>Party Thresholds</h3>
            <div class="calc-thresholds">
                <div class="calc-threshold">
                    <span class="calc-threshold-label">🟢 Easy:</span>
                    <span class="calc-threshold-value">${thresholds.easy.toLocaleString()} XP</span>
                </div>
                <div class="calc-threshold">
                    <span class="calc-threshold-label">🟡 Medium:</span>
                    <span class="calc-threshold-value">${thresholds.medium.toLocaleString()} XP</span>
                </div>
                <div class="calc-threshold">
                    <span class="calc-threshold-label">🟠 Hard:</span>
                    <span class="calc-threshold-value">${thresholds.hard.toLocaleString()} XP</span>
                </div>
                <div class="calc-threshold">
                    <span class="calc-threshold-label">🔴 Deadly:</span>
                    <span class="calc-threshold-value">${thresholds.deadly.toLocaleString()} XP</span>
                </div>
            </div>
        </div>
        
        <div class="calc-results-section">
            <h3>Encounter XP</h3>
            <div class="calc-xp-breakdown">
                <div class="calc-xp-row">
                    <span class="calc-xp-label">Base XP:</span>
                    <span class="calc-xp-value">${monsters.baseXP.toLocaleString()} XP</span>
                </div>
                <div class="calc-xp-row">
                    <span class="calc-xp-label">Multiplier:</span>
                    <span class="calc-xp-value">×${monsters.multiplier} (${monsters.totalMonsters} monster${monsters.totalMonsters !== 1 ? 's' : ''})</span>
                </div>
                <div class="calc-xp-row calc-xp-total">
                    <span class="calc-xp-label">Adjusted XP:</span>
                    <span class="calc-xp-value">${monsters.adjustedXP.toLocaleString()} XP</span>
                </div>
            </div>
        </div>
        
        <div class="calc-results-section">
            <h3>Difficulty</h3>
            <div class="calc-difficulty" style="--difficulty-color: ${difficulty.color}">
                <div class="calc-difficulty-label">${difficulty.label}</div>
                <div class="calc-difficulty-bar">
                    <div class="calc-difficulty-fill" style="width: ${Math.min(difficulty.percentage, 200)}%; background: ${difficulty.color}"></div>
                </div>
                <div class="calc-difficulty-info">
                    ${difficulty.percentage > 100 ? `${Math.round(difficulty.percentage - 100)}% über Deadly` : ''}
                </div>
            </div>
        </div>
        
        <div class="calc-results-section">
            <h3>XP pro Spieler</h3>
            <div class="calc-xp-per-player">
                <span class="calc-xp-value">${Math.round(monsters.baseXP / thresholds.totalPCs)} XP</span>
                <span class="calc-xp-note">(Tatsächliche XP-Belohnung, ohne Multiplier)</span>
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
    
    const thresholds = calculatePartyThresholds();
    const current = calculateMonsterXP();
    const currentDifficulty = getDifficulty(current.adjustedXP, thresholds);
    
    let targetXP;
    
    if (direction === 'easier') {
        if (currentDifficulty.level === 'deadly') targetXP = thresholds.hard;
        else if (currentDifficulty.level === 'hard') targetXP = thresholds.medium;
        else if (currentDifficulty.level === 'medium') targetXP = thresholds.easy;
        else {
            showToast('Encounter ist bereits sehr einfach');
            return;
        }
    } else {
        if (currentDifficulty.level === 'trivial' || currentDifficulty.level === 'easy') targetXP = thresholds.medium;
        else if (currentDifficulty.level === 'medium') targetXP = thresholds.hard;
        else if (currentDifficulty.level === 'hard') targetXP = thresholds.deadly;
        else {
            targetXP = thresholds.deadly * 1.5;
        }
    }
    
    // Simple approach: adjust first monster count
    if (calculatorMonsters.length > 0) {
        const ratio = targetXP / current.adjustedXP;
        calculatorMonsters[0].count = Math.max(1, Math.round(calculatorMonsters[0].count * ratio));
        
        renderCalculator();
        recalculateEncounter();
        showToast(`Encounter angepasst (${direction === 'easier' ? 'einfacher' : 'schwieriger'})`);
    }
}

function saveAsEncounter() {
    if (calculatorMonsters.length === 0) {
        showToast('Keine Monster zum Speichern');
        return;
    }
    
    const monsters = calculateMonsterXP();
    const thresholds = calculatePartyThresholds();
    const difficulty = getDifficulty(monsters.adjustedXP, thresholds);
    
    // Create encounter name
    const name = `Encounter (${difficulty.label}) - ${monsters.adjustedXP} XP`;
    
    // Create monsters array for encounter
    const encounterMonsters = calculatorMonsters.map(m => ({
        name: m.name,
        cr: m.cr,
        hp: 0, // Default
        initiative: 0,
        count: m.count
    }));
    
    // Add to encounters
    const newEnc = {
        id: Date.now(),
        name: name,
        monsters: encounterMonsters,
        description: `Automatisch erstellt via CR Calculator
        
Party: ${thresholds.totalPCs} PCs
Base XP: ${monsters.baseXP}
Adjusted XP: ${monsters.adjustedXP}
Difficulty: ${difficulty.label}`
    };
    
    D.encounters = D.encounters || [];
    D.encounters.push(newEnc);
    
    save();
    showToast('Als Encounter gespeichert');
    
    // Ask if user wants to switch to encounters view
    if (confirm('Zu Encounters wechseln?')) {
        switchView('encounters');
    }
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
        partyList.innerHTML = '<div class="calc-empty">Keine Party-Mitglieder hinzugefügt</div>';
    } else {
        partyList.innerHTML = calculatorParty.map((p, i) => `
            <div class="calc-list-item">
                <span class="calc-list-info">Level ${p.level}: ${p.count} Character${p.count !== 1 ? 's' : ''}</span>
                <button class="btn btn-sm btn-danger" data-action="calc-remove-party-level" data-value="${i}">✕</button>
            </div>
        `).join('');
    }
    
    // Render Monsters
    if (calculatorMonsters.length === 0) {
        monsterList.innerHTML = '<div class="calc-empty">Keine Monster hinzugefügt</div>';
    } else {
        monsterList.innerHTML = calculatorMonsters.map((m, i) => `
            <div class="calc-list-item">
                <span class="calc-list-info">${m.count}× ${esc(m.name)} (CR ${m.cr}, ${CR_TO_XP[m.cr]} XP)</span>
                <button class="btn btn-sm btn-danger" data-action="calc-remove-monster" data-value="${i}">✕</button>
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
        console.error('Calculator Modal nicht gefunden');
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
        <div class="calc-modal-body">
            <!-- Input Panels (2 Spalten) -->
            <div class="calc-input-panels">
                <!-- Party Panel -->
                <div class="calc-panel-compact">
                    <div class="calc-panel-header-compact">
                        <h4>🎲 Party</h4>
                        <div class="calc-panel-actions-compact">
                            <button class="btn btn-xs" data-action="calc-load-party" title="Aus Party laden">📥</button>
                            <button class="btn btn-xs btn-danger" data-action="calc-clear-party" title="Löschen">🗑️</button>
                        </div>
                    </div>
                    
                    <div class="calc-input-compact">
                        <input type="number" id="calc-party-level" min="1" max="20" value="1" placeholder="Level" class="calc-input-xs" style="width: 80px;">
                        <input type="number" id="calc-party-count" min="1" value="4" placeholder="Anzahl" class="calc-input-xs" style="width: 80px;">
                        <button class="btn btn-xs btn-primary" data-action="calc-add-party-level">➕</button>
                    </div>
                    
                    <div id="calc-party-list" class="calc-list-compact"></div>
                </div>
                
                <!-- Monster Panel -->
                <div class="calc-panel-compact">
                    <div class="calc-panel-header-compact">
                        <h4>👹 Monster</h4>
                        <div class="calc-panel-actions-compact">
                            <button class="btn btn-xs" data-action="calc-show-encounter-import" title="Aus Encounter laden">📥</button>
                            <button class="btn btn-xs btn-danger" data-action="calc-clear-monsters" title="Löschen">🗑️</button>
                        </div>
                    </div>
                    
                    <div class="calc-input-compact">
                        <input type="text" id="calc-monster-cr" placeholder="CR" class="calc-input-xs" list="cr-datalist" style="width: 70px;">
                        <datalist id="cr-datalist">
                            ${['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'].map(cr => `<option value="${cr}">`).join('')}
                        </datalist>
                        <input type="number" id="calc-monster-count" min="1" value="1" placeholder="Anz" class="calc-input-xs" style="width: 60px;">
                        <input type="text" id="calc-monster-name" placeholder="Name" class="calc-input-xs" style="flex: 1;">
                        <button class="btn btn-xs btn-primary" data-action="calc-add-monster">➕</button>
                    </div>
                    
                    <div id="calc-monster-list" class="calc-list-compact"></div>
                </div>
            </div>
            
            <!-- Results (Sticky, volle Breite) -->
            <div class="calc-results-wrapper">
                <div class="calc-results-compact">
                    <div id="calc-results"></div>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="calc-actions-compact">
                <button class="btn btn-secondary" data-action="calc-adjust-difficulty" data-value="easier">⬇️ Einfacher</button>
                <button class="btn btn-secondary" data-action="calc-adjust-difficulty" data-value="harder">⬆️ Schwieriger</button>
                <button class="btn btn-success" data-action="calc-save-encounter">💾 Als Encounter speichern</button>
            </div>
        </div>
    `;
    
    renderCalculator();
}

// Encounter Import Dialog
function showEncounterImport() {
    if (!D.encounters || D.encounters.length === 0) {
        showToast('Keine Encounters vorhanden');
        return;
    }
    
    const html = `
        <div class="encounter-import-list">
            <h4 style="margin: 0 0 15px 0; color: var(--gold);">Kreatur auswählen</h4>
            ${D.encounters.map(enc => {
                // Encounter ist eine einzelne Kreatur
                const cr = enc.cr || enc.CR || '0';
                const xp = CR_TO_XP[cr] || 0;
                const type = enc.creatureType || enc.type || '';
                
                return `
                    <div class="encounter-import-item" data-action="calc-import-encounter" data-value="${enc.id}">
                        <div class="encounter-import-name">${esc(enc.name)}</div>
                        <div class="encounter-import-info">${type} • CR ${cr} • ${xp} XP</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    const modalContent = $('calculator-modal-content');
    
    modalContent.innerHTML = `
        <div class="calc-modal-body">
            ${html}
            <div style="margin-top: 20px; text-align: center;">
                <button class="btn btn-secondary" data-action="calc-back-to-calculator">↩️ Zurück</button>
            </div>
        </div>
    `;
}

function importEncounterMonsters(encId) {
    const encounter = D.encounters.find(e => e.id === encId || e.id === parseInt(encId));
    
    if (!encounter) {
        showToast('Kreatur nicht gefunden (ID: ' + encId + ')');
        console.error('Kreatur nicht gefunden:', encId);
        return;
    }
    
    // Encounter IST die Kreatur selbst
    const cr = encounter.cr || encounter.CR || null;
    
    if (!cr) {
        showToast('Kreatur hat kein CR');
        console.warn('Kreatur ohne CR:', encounter);
        return;
    }
    
    // Füge Kreatur zur Monster-Liste hinzu (nicht ersetzen!)
    calculatorMonsters.push({
        cr: cr,
        count: 1,  // Standardmäßig 1
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
