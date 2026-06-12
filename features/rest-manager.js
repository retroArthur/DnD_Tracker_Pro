// [SECTION:REST_MANAGER]
// ============================================================
// REST MANAGER - Short & Long Rest Management
// ============================================================
/**
 * D&D 5e Rest System
 * - Short Rest: Spend Hit Dice, regain features (depends on class)
 * - Long Rest: Full HP, half Hit Dice, all spell slots, class features
 */
// Rest Modal anzeigen
function showRestModal() {
    const D = window.D;
    const characters = D.characters || [];
    if (!characters.length) {
        showToast('Keine Charaktere vorhanden', 'error');
        return;
    }
    const content = `
        <div class="rest-modal-content">
            <div class="rest-modal-header">
                <h3>🛏️ Rasten</h3>
                <button class="btn btn-sm" data-action="hide-modal" data-value="rest-modal">✕</button>
            </div>

            <div class="rest-type-selector">
                <button class="rest-type-btn active" data-type="short" data-action="select-rest-type" data-value="short">
                    <span class="rest-type-icon">⏰</span>
                    <span class="rest-type-label">Kurze Rast</span>
                    <span class="rest-type-desc">1 Stunde</span>
                </button>
                <button class="rest-type-btn" data-type="long" data-action="select-rest-type" data-value="long">
                    <span class="rest-type-icon">🌙</span>
                    <span class="rest-type-label">Lange Rast</span>
                    <span class="rest-type-desc">8 Stunden</span>
                </button>
            </div>

            <div class="rest-details" id="rest-details">
                ${renderRestDetails('short')}
            </div>

            <div class="rest-characters" id="rest-characters">
                ${renderRestCharacters(characters, 'short')}
            </div>

            <div class="rest-modal-footer">
                <button class="btn" data-action="hide-modal" data-value="rest-modal">Abbrechen</button>
                <button class="btn btn-primary" data-action="apply-rest">✓ Rast durchführen</button>
            </div>
        </div>
    `;
    // Modal erstellen oder wiederverwenden
    let modal = $('rest-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'rest-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal" style="max-width: 600px;">${content}</div>`;
        modal.onclick = e => {
            if (e.target === modal) hideModal('rest-modal');
        };
        document.body.appendChild(modal);
    } else {
        const modalContent = modal.querySelector('.modal');
        if (modalContent) modalContent.innerHTML = content;
    }
    showModal('rest-modal');
}
function selectRestType(type) {
    const D = window.D;
    // Button-States aktualisieren
    document.querySelectorAll('.rest-type-btn').forEach(btn => {
        const button = btn;
        button.classList.toggle('active', button.dataset.type === type);
    });
    // Details aktualisieren
    const detailsEl = $('rest-details');
    if (detailsEl) {
        detailsEl.innerHTML = renderRestDetails(type);
    }
    // Charakter-Liste aktualisieren
    const charsEl = $('rest-characters');
    if (charsEl) {
        charsEl.innerHTML = renderRestCharacters(D.characters || [], type);
    }
}
function renderRestDetails(type) {
    if (type === 'short') {
        return `
            <div class="rest-info">
                <h4>⏰ Kurze Rast (1 Stunde)</h4>
                <ul>
                    <li>Trefferwürfel ausgeben um HP zu heilen</li>
                    <li>Einige Klassenfähigkeiten regenerieren</li>
                    <li>Hexenmeister: Zauberplätze zurück</li>
                </ul>
            </div>
        `;
    } else {
        return `
            <div class="rest-info">
                <h4>🌙 Lange Rast (8 Stunden)</h4>
                <ul>
                    <li>Volle HP wiederhergestellt</li>
                    <li>Halbe Trefferwürfel regeneriert (mind. 1)</li>
                    <li>Alle Zauberplätze zurück</li>
                    <li>Alle Klassenfähigkeiten regenerieren</li>
                    <li>1 Erschöpfungsstufe entfernt</li>
                </ul>
            </div>
        `;
    }
}
function renderRestCharacters(characters, type) {
    const COMBAT_CONSTANTS = window.COMBAT_CONSTANTS;
    if (!characters.length) {
        return '<div class="rest-no-chars">Keine Charaktere</div>';
    }
    return characters
        .map(char => {
            const maxHitDice = char.level || 1;
            const currentHitDice = char.hitDice ?? maxHitDice;
            const currentHp = char.hpCurrent ?? char.hp ?? 0;
            const maxHp = char.hpMax ?? char.hp ?? 1;
            const hpPct = Math.round((currentHp / maxHp) * 100);
            const hpClass =
                hpPct <= COMBAT_CONSTANTS.HP_CRITICAL_THRESHOLD
                    ? 'critical'
                    : hpPct <= COMBAT_CONSTANTS.HP_BLOODIED_THRESHOLD
                      ? 'bloodied'
                      : 'healthy';
            const hitDieType = getHitDieType(char.class);
            return `
            <div class="rest-character" data-id="${char.id}">
                <span class="rest-char-name">${esc(char.name)}</span>
                <span class="rest-hp-bar ${hpClass}" style="--hp-pct: ${hpPct}%"></span>
                <span class="rest-hp-text">${currentHp}/${maxHp}</span>
                ${
                    type === 'short'
                        ? `
                    <span class="rest-hd-controls">
                        <button class="rest-hd-btn" data-action="adjust-rest-hit-dice" data-id="${char.id}" data-value="-1">−</button>
                        <input type="number" id="rest-hd-${char.id}" value="0" min="0" max="${currentHitDice}" class="rest-hd-input">
                        <button class="rest-hd-btn" data-action="adjust-rest-hit-dice" data-id="${char.id}" data-value="1">+</button>
                    </span>
                    <span class="rest-hd-label">d${hitDieType} <span class="rest-hd-available">${currentHitDice}/${maxHitDice}</span></span>
                `
                        : `
                    <span class="rest-heal-preview">+${maxHp - currentHp} HP</span>
                    <span class="rest-hd-restore">+${Math.max(1, Math.floor(maxHitDice / 2))} HD</span>
                `
                }
            </div>
        `;
        })
        .join('');
}
function getHitDieType(className) {
    const hitDice = {
        Barbar: 12,
        Kämpfer: 10,
        Paladin: 10,
        Waldläufer: 10,
        Barde: 8,
        Druide: 8,
        Kleriker: 8,
        Mönch: 8,
        Schurke: 8,
        Hexenmeister: 8,
        Magier: 6,
        Zauberer: 6,
        Artificer: 8,
        Blutjäger: 10
    };
    return hitDice[className] || 8;
}
function adjustRestHitDice(charId, delta) {
    const id = typeof charId === 'string' ? parseInt(charId) : charId;
    const input = $(`rest-hd-${id}`);
    if (!input) return;
    const char = EntityLookup.character(id);
    if (!char) return;
    // Defensive parsing - handle NaN and undefined
    const maxHD = parseInt(char.level) || 1;
    const availableHD =
        typeof char.hitDice === 'number' && !isNaN(char.hitDice) ? char.hitDice : maxHD;
    const current = parseInt(input.value) || 0;
    const newValue = Math.max(0, Math.min(availableHD, current + delta));
    // Only set if valid number
    if (!isNaN(newValue)) {
        input.value = String(newValue);
    }
}
function applyRest() {
    const D = window.D;
    const renderParty = window.renderParty;
    const renderInit = window.renderInit;
    const isLongRest = document.querySelector('.rest-type-btn[data-type="long"].active') !== null;
    pushUndo(`${isLongRest ? 'Lange' : 'Kurze'} Rast`);
    let totalHealed = 0;
    let hitDiceSpent = 0;
    D.characters.forEach(char => {
        const maxHp = char.hpMax ?? char.hp ?? 1;
        const maxHitDice = char.level || 1;
        const hitDieType = getHitDieType(char.class);
        const conMod = char.attributes?.con ? Math.floor((char.attributes.con - 10) / 2) : 0;
        if (isLongRest) {
            // Lange Rast: Volle HP, halbe Trefferwürfel zurück
            const hpBefore = char.hpCurrent ?? char.hp ?? 0;
            char.hpCurrent = maxHp;
            totalHealed += maxHp - hpBefore;
            // Trefferwürfel regenerieren (halbe, mind. 1)
            const currentHD = char.hitDice ?? maxHitDice;
            const hdToRestore = Math.max(1, Math.floor(maxHitDice / 2));
            char.hitDice = Math.min(maxHitDice, currentHD + hdToRestore);
            // Zauberplätze zurücksetzen
            if (char.spellSlots) {
                for (let lvl = 1; lvl <= 9; lvl++) {
                    if (char.spellSlots[lvl]) {
                        char.spellSlots[lvl].current = char.spellSlots[lvl].max;
                    }
                }
            }
            // Erschöpfung reduzieren
            if (char.exhaustion && char.exhaustion > 0) {
                char.exhaustion = Math.max(0, char.exhaustion - 1);
            }
        } else {
            // Kurze Rast: Trefferwürfel ausgeben
            const hdInput = $(`rest-hd-${char.id}`);
            const hdToSpend = parseInt(hdInput?.value || '0') || 0;
            if (hdToSpend > 0) {
                const currentHD = char.hitDice ?? maxHitDice;
                const actualSpend = Math.min(hdToSpend, currentHD);
                // Würfeln und heilen
                let healing = 0;
                for (let i = 0; i < actualSpend; i++) {
                    healing += Math.floor(Math.random() * hitDieType) + 1 + conMod;
                }
                healing = Math.max(0, healing);
                const hpBefore = char.hpCurrent ?? char.hp ?? 0;
                char.hpCurrent = Math.min(maxHp, hpBefore + healing);
                totalHealed += char.hpCurrent - hpBefore;
                // Trefferwürfel verbrauchen
                char.hitDice = currentHD - actualSpend;
                hitDiceSpent += actualSpend;
            }
            // Hexenmeister: Zauberplätze bei kurzer Rast
            if (char.class === 'Hexenmeister' && char.spellSlots) {
                for (let lvl = 1; lvl <= 5; lvl++) {
                    if (char.spellSlots[lvl]) {
                        char.spellSlots[lvl].current = char.spellSlots[lvl].max;
                    }
                }
            }
        }
    });
    hideModal('rest-modal');
    save();
    renderParty();
    renderInit();
    // Feedback
    if (isLongRest) {
        showToast(`🌙 Lange Rast: ${totalHealed} HP geheilt`, 'success');
    } else {
        showToast(
            `⏰ Kurze Rast: ${totalHealed} HP geheilt (${hitDiceSpent} Trefferwürfel)`,
            'success'
        );
    }
}
// Quick Rest für einzelnen Charakter
function quickShortRest(charId) {
    const char = EntityLookup.character(charId);
    if (!char) return;
    const maxHp = char.hpMax ?? char.hp ?? 1;
    const currentHp = char.hpCurrent ?? char.hp ?? 0;
    if (currentHp >= maxHp) {
        showToast(`${char.name} ist bereits bei voller HP`, 'info');
        return;
    }
    const currentHD = char.hitDice ?? char.level ?? 1;
    if (currentHD <= 0) {
        showToast(`${char.name} hat keine Trefferwürfel mehr`, 'warning');
        return;
    }
    const hitDieType = getHitDieType(char.class);
    const conMod = char.attributes?.con ? Math.floor((char.attributes.con - 10) / 2) : 0;
    // Einen Trefferwürfel ausgeben
    const healing = Math.floor(Math.random() * hitDieType) + 1 + conMod;
    const actualHeal = Math.min(healing, maxHp - currentHp);
    pushUndo(`${char.name} kurze Rast`);
    char.hpCurrent = currentHp + actualHeal;
    char.hitDice = currentHD - 1;
    const renderParty = window.renderParty;
    save();
    renderParty();
    showToast(`${char.name}: +${actualHeal} HP (d${hitDieType}+${conMod})`, 'success');
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.showRestModal = showRestModal;
window.quickShortRest = quickShortRest;
