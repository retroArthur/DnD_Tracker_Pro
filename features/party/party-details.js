// [SECTION:PARTY_DETAILS]
// ============================================================
// PARTY DETAILS - @modal @character @stats
// ============================================================
/**
 * Shows character details modal
 */
function showCharacterDetails(id) {
    const CATS = window.CATS;
    const COMBAT_CONSTANTS = window.COMBAT_CONSTANTS;
    const ch = EntityLookup.character(id);
    if (!ch) return;
    const cur = ch.currency || {};
    const coins =
        [
            cur.pm && `${cur.pm}P`,
            cur.gm && `${cur.gm}G`,
            cur.em && `${cur.em}E`,
            cur.sm && `${cur.sm}S`,
            cur.km && `${cur.km}K`
        ]
            .filter(Boolean)
            .join(' ') || '—';
    const spells = (ch.spells || []).map(sid => EntityLookup.spell(sid)).filter(Boolean);
    // Support both old format (array of IDs) and new format (array of {id, quantity})
    const itemsRaw = ch.items || [];
    const items = itemsRaw
        .map(item => {
            const itemId = typeof item === 'number' ? item : item.id;
            const qty = typeof item === 'number' ? 1 : item.quantity;
            const lootItem = EntityLookup.lootItem(itemId);
            return lootItem ? { ...lootItem, assignedQty: qty } : null;
        })
        .filter(Boolean);
    const languages = Array.isArray(ch.languages) ? ch.languages.join(', ') : ch.languages || '—';
    // Attribute mit Modifiern
    const attrs = ch.attributes || {};
    const attrMod = val => {
        const m = Math.floor((val - 10) / 2);
        return m >= 0 ? `+${m}` : `${m}`;
    };
    // Saving throw proficiencies
    const saves = ch.saveProficiencies || {};
    const profSaves = ['str', 'dex', 'con', 'int', 'wis', 'cha']
        .filter(s => saves[s])
        .map(s => s.toUpperCase());
    // Skills (D-03/D-04, CHAR-03) — computed modifiers via calcSkillModifier from Wave 1
    const skillProf = ch.skillProficiencies || {};
    const skillExp = ch.skillExpertise || {};
    // SKILL_INFO is in the global lexical scope (core/constants.js:217)
    // Group skills by attribute for display
    const SKILL_BY_ATTR = { str: [], dex: [], con: [], int: [], wis: [], cha: [] };
    Object.keys(SKILL_INFO).forEach(key => {
        const info = SKILL_INFO[key];
        if (SKILL_BY_ATTR[info.attr]) {
            SKILL_BY_ATTR[info.attr].push(key);
        }
    });
    // Class display
    const classDisplay = ch.subclass
        ? `${esc(ch.characterClass || '—')} (${esc(ch.subclass)})`
        : esc(ch.characterClass || '—');
    // HP Prozent für Farbcodierung
    const hpPct = ch.hpMax > 0 ? (ch.hpCurrent / ch.hpMax) * 100 : 100;
    const hpColor =
        hpPct <= COMBAT_CONSTANTS.HP_CRITICAL_THRESHOLD
            ? 'var(--red)'
            : hpPct <= COMBAT_CONSTANTS.HP_BLOODIED_THRESHOLD
              ? 'var(--yellow)'
              : 'var(--green)';
    const content = `
        <div class="char-modal-header">
            <div class="char-modal-avatar">
                ${ch.avatar ? `<img src="${esc(ch.avatar)}" alt="${esc(ch.name)}">` : `<span class="char-modal-avatar-placeholder">${(ch.name || '?')[0].toUpperCase()}</span>`}
            </div>
            <div class="char-modal-title">
                <h2>${ch.inspiration ? '⭐ ' : ''}${esc(ch.name)}</h2>
                <div class="char-modal-subtitle">${classDisplay} • Lv.${ch.level || 1}</div>
                <div class="char-modal-meta">${esc(ch.race || '')} ${ch.background ? '• ' + esc(ch.background) : ''}</div>
            </div>
            <button class="btn btn-sm char-modal-close" data-action="hide-modal" data-value="char-detail-modal">✕</button>
        </div>

        <div class="char-modal-body">
            <!-- Vital Stats Row -->
            <div class="char-vital-row">
                <div class="char-vital-box hp">
                    <div class="char-vital-icon">❤️</div>
                    <div class="char-vital-value" style="color: ${hpColor};">${ch.hpCurrent || 0}/${ch.hpMax || 0}</div>
                    <div class="char-vital-label">HP</div>
                </div>
                <div class="char-vital-box">
                    <div class="char-vital-icon">🛡️</div>
                    <div class="char-vital-value">${ch.armorClass || '—'}</div>
                    <div class="char-vital-label">RK</div>
                </div>
                <div class="char-vital-box">
                    <div class="char-vital-icon">⚡</div>
                    <div class="char-vital-value">${ch.initiative !== undefined ? (ch.initiative >= 0 ? '+' : '') + ch.initiative : '—'}</div>
                    <div class="char-vital-label">Init</div>
                </div>
                <div class="char-vital-box">
                    <div class="char-vital-icon">👟</div>
                    <div class="char-vital-value">${ch.speed || '—'}</div>
                    <div class="char-vital-label">Speed</div>
                </div>
                <div class="char-vital-box">
                    <div class="char-vital-icon">👁️</div>
                    <div class="char-vital-value">${ch.passivePerception || '—'}</div>
                    <div class="char-vital-label">Wahr.</div>
                </div>
            </div>

            <!-- Attribute Grid — clickable for raw attribute checks (D-04) -->
            <div class="char-attr-grid">
                ${['str', 'dex', 'con', 'int', 'wis', 'cha']
                    .map(
                        attr => `
                    <div class="char-attr-box clickable ${saves[attr] ? 'proficient' : ''}"
                         data-action="roll-char-attr-stop"
                         data-id="${ch.id}"
                         data-attr="${attr}"
                         title="${attr.toUpperCase()} Attribut-Check würfeln (${attrMod(attrs[attr] || 10)})">
                        <div class="char-attr-name">${attr.toUpperCase()}</div>
                        <div class="char-attr-value">${attrs[attr] || 10}</div>
                        <div class="char-attr-mod">${attrMod(attrs[attr] || 10)}</div>
                        <div class="char-adv-btns">
                            <button class="char-adv-btn adv" data-action="roll-char-attr-stop" data-id="${ch.id}" data-attr="${attr}" data-adv="adv" title="Vorteil">V</button>
                            <button class="char-adv-btn dis" data-action="roll-char-attr-stop" data-id="${ch.id}" data-attr="${attr}" data-adv="dis" title="Nachteil">N</button>
                        </div>
                    </div>
                `
                    )
                    .join('')}
            </div>

            <!-- Skills Section (CHAR-03, D-03/D-04) -->
            <div class="char-skills-section">
                <div class="char-skills-section-title">🎯 Fertigkeiten</div>
                <div class="char-skills-by-attr">
                    ${['str', 'dex', 'int', 'wis', 'cha']
                        .filter(attr => SKILL_BY_ATTR[attr] && SKILL_BY_ATTR[attr].length)
                        .map(attr => `
                        <div class="char-skill-attr-group">
                            <div class="char-skill-attr-head">${attr.toUpperCase()}</div>
                            ${SKILL_BY_ATTR[attr].map(key => {
                                const info = SKILL_INFO[key];
                                const isExp = skillExp[key];
                                const isProf = skillProf[key];
                                const skillMod = calcSkillModifier(ch, key);
                                const modStr = formatModifier(skillMod);
                                const cssClass = isExp ? 'expertise' : (isProf ? 'proficient' : '');
                                return `<div class="char-skill-item ${cssClass} char-roll-btn"
                                    data-action="roll-char-skill-stop"
                                    data-id="${ch.id}"
                                    data-skill="${key}"
                                    title="${esc(info.name)} würfeln (${modStr})">
                                    <span class="char-skill-item-dot"></span>
                                    <span class="char-skill-item-name">${esc(info.name)}</span>
                                    <span class="char-skill-item-mod">${modStr}</span>
                                    <span class="char-adv-btns">
                                        <button class="char-adv-btn adv" data-action="roll-char-skill-stop" data-id="${ch.id}" data-skill="${key}" data-adv="adv" title="Vorteil">V</button>
                                        <button class="char-adv-btn dis" data-action="roll-char-skill-stop" data-id="${ch.id}" data-skill="${key}" data-adv="dis" title="Nachteil">N</button>
                                    </span>
                                </div>`;
                            }).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Saving Throws — clickable (D-04) -->
            <div class="char-saves-section">
                <div class="char-saves-section-title">🛡️ Rettungswürfe</div>
                <div class="char-saves-row">
                    ${['str', 'dex', 'con', 'int', 'wis', 'cha'].map(attr => {
                        const attrVal = attrs[attr] || 10;
                        const attrModVal = Math.floor((attrVal - 10) / 2);
                        const profBonus = ch.proficiencyBonus || getProficiencyBonus(ch.level || 1);
                        const saveMod = attrModVal + (saves[attr] ? profBonus : 0);
                        const saveModStr = formatModifier(saveMod);
                        const isProf = saves[attr];
                        return `<div class="char-save-box ${isProf ? 'proficient' : ''} char-roll-btn"
                            data-action="roll-char-save-stop"
                            data-id="${ch.id}"
                            data-attr="${attr}"
                            title="${attr.toUpperCase()} Rettungswurf (${saveModStr})">
                            <span class="char-save-box-name">${attr.toUpperCase()}</span>
                            <span class="char-save-box-mod">${saveModStr}</span>
                            <span class="char-adv-btns">
                                <button class="char-adv-btn adv" data-action="roll-char-save-stop" data-id="${ch.id}" data-attr="${attr}" data-adv="adv" title="Vorteil">V</button>
                                <button class="char-adv-btn dis" data-action="roll-char-save-stop" data-id="${ch.id}" data-attr="${attr}" data-adv="dis" title="Nachteil">N</button>
                            </span>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- Attacks Section (CHAR-03, D-05) -->
            ${(ch.attacks && ch.attacks.length) ? `
            <div class="char-attacks-section">
                <div class="char-attacks-section-title">⚔️ Angriffe</div>
                <div class="char-attacks-list">
                    ${ch.attacks.map((atk, atkIdx) => {
                        // XSS safety: escape name + type FIRST (T-06-07)
                        const safeName = esc(atk.name || '');
                        const safeType = atk.damageType ? esc(atk.damageType) : '';
                        // Attack bonus: synthesize hit formula (validated formula, no user content)
                        const bonus = parseInt(atk.attackBonus) || 0;
                        const hitFormula = bonus >= 0 ? `1d20+${bonus}` : `1d20${bonus}`;
                        // damage: already validated at save time (whitelist ^\d+[dD]\d+([+-]\d+)?$)
                        const damageFormula = atk.damage || '';
                        // Use dedicated roll-char-attack-stop handler so rolls land in diceHistory (A2)
                        // data-value kept for E2E assertion ([data-value="1d20+5"])
                        const hitSpan = `<span class="bestiary-dice" data-action="roll-char-attack-stop" data-id="${ch.id}" data-value="${esc(hitFormula)}" data-formula="${esc(hitFormula)}" data-label="${safeName} Treffer" title="Trefferwurf (${esc(hitFormula)})">${esc(hitFormula)}</span>`;
                        const dmgSpan = damageFormula ? `<span class="bestiary-dice" data-action="roll-char-attack-stop" data-id="${ch.id}" data-value="${esc(damageFormula)}" data-formula="${esc(damageFormula)}" data-label="${safeName} Schaden" title="Schadenswurf (${esc(damageFormula)})">${esc(damageFormula)}</span>` : '';
                        return `<div class="char-attack-entry">
                            <span class="char-attack-name">${safeName}</span>
                            ${safeType ? `<span class="char-attack-type-badge">${safeType}</span>` : ''}
                            <span class="char-attack-roll">
                                <span class="char-attack-roll-label">Treffer:</span>
                                ${hitSpan}
                            </span>
                            ${dmgSpan ? `<span class="char-attack-roll">
                                <span class="char-attack-roll-label">Schaden:</span>
                                ${dmgSpan}
                            </span>` : ''}
                        </div>`;
                    }).join('')}
                </div>
            </div>` : ''}

            <!-- XP / Levelaufstieg-Sektion (CHAR-01 / D-07 / D-08 / D-11) -->
            ${(function() {
                var D = window.D;
                var levelingMode = (D && D.settings && D.settings.levelingMode) || 'xp';
                var currentLevel = ch.level || 1;
                var currentXP = ch.xp || 0;
                if (levelingMode === 'milestone') {
                    // Milestone-Modus: XP-Felder versteckt, "+1 Level"-Button sichtbar (D-07)
                    // Note: intentionally NOT using .char-xp-section so E2E can assert it's absent
                    return '<div class="char-xp-milestone-section">' +
                        '<div class="char-xp-section-title">🎯 Aufstieg (Meilenstein)</div>' +
                        '<div class="char-xp-milestone-info">Meilenstein-Modus: Levelaufstieg durch DM-Entscheidung</div>' +
                        '<button class="btn btn-warning char-milestone-btn" ' +
                            'data-action="milestone-level-up" data-id="' + ch.id + '" ' +
                            'title="+1 Level vergeben">' +
                            '⬆️ +1 Level' +
                        '</button>' +
                    '</div>';
                } else {
                    // XP-Modus: XP-Stand + Schwelle + ggf. Levelaufstieg-Hinweis (D-08 / D-11)
                    var nextLevel = currentLevel + 1;
                    var nextThreshold = nextLevel <= 20 ? (XP_LEVEL_THRESHOLDS[nextLevel - 1] || 0) : null;
                    var isMaxLevel = currentLevel >= 20;
                    var levelUpReady = !isMaxLevel && canLevelUp(ch);
                    var xpBar = '';
                    if (!isMaxLevel && nextThreshold) {
                        var prevThreshold = XP_LEVEL_THRESHOLDS[currentLevel - 1] || 0;
                        var xpIntoLevel = Math.max(0, currentXP - prevThreshold);
                        var xpNeeded = nextThreshold - prevThreshold;
                        var pct = xpNeeded > 0 ? Math.min(100, Math.round(xpIntoLevel / xpNeeded * 100)) : 100;
                        xpBar = '<div class="char-xp-bar-wrap"><div class="char-xp-bar" style="width:' + pct + '%"></div></div>';
                    }
                    var levelUpHint = levelUpReady
                        ? '<div class="char-level-up-badge level-up-hint">⬆️ Kann aufsteigen!' +
                          '<button class="btn btn-sm btn-success char-confirm-level-btn" ' +
                              'data-action="confirm-level-up" data-id="' + ch.id + '">' +
                              'Stufe bestätigen' +
                          '</button></div>'
                        : '';
                    return '<div class="char-xp-section">' +
                        '<div class="char-xp-section-title">⭐ XP / Aufstieg</div>' +
                        '<div class="char-xp-row">' +
                            '<span class="char-xp-label">XP:</span>' +
                            '<span class="char-xp-value">' + currentXP.toLocaleString('de-DE') + '</span>' +
                            (nextThreshold !== null && !isMaxLevel
                                ? '<span class="char-xp-threshold">/ ' + nextThreshold.toLocaleString('de-DE') + ' (Lv.' + nextLevel + ')</span>'
                                : '<span class="char-xp-threshold">Max Level</span>') +
                        '</div>' +
                        xpBar +
                        levelUpHint +
                    '</div>';
                }
            })()}

            <!-- Two Column Info -->
            <div class="char-info-grid">
                <div class="char-info-section">
                    <div class="char-info-row">
                        <span class="char-info-label">👤 Spieler</span>
                        <span class="char-info-value">${esc(ch.playerName || '—')}</span>
                    </div>
                    <div class="char-info-row">
                        <span class="char-info-label">🎯 Übung</span>
                        <span class="char-info-value">+${ch.proficiencyBonus || 2}</span>
                    </div>
                    <div class="char-info-row">
                        <span class="char-info-label">🎲 Trefferwürfel</span>
                        <span class="char-info-value">${esc(ch.hitDice || '—')}</span>
                    </div>
                    ${
                        profSaves.length
                            ? `<div class="char-info-row">
                        <span class="char-info-label">🛡️ Save-Prof.</span>
                        <span class="char-info-value">${profSaves.join(', ')}</span>
                    </div>`
                            : ''
                    }
                </div>
                <div class="char-info-section">
                    <div class="char-info-row">
                        <span class="char-info-label">💰 Münzen</span>
                        <span class="char-info-value gold">${coins}</span>
                    </div>
                    <div class="char-info-row">
                        <span class="char-info-label">🗣️ Sprachen</span>
                        <span class="char-info-value wrap">${esc(languages)}</span>
                    </div>
                    ${
                        ch.resistances?.length
                            ? `<div class="char-info-row">
                        <span class="char-info-label">🛡️ Resist.</span>
                        <span class="char-info-value wrap">${ch.resistances.join(', ')}</span>
                    </div>`
                            : ''
                    }
                    ${
                        ch.immunities?.length
                            ? `<div class="char-info-row">
                        <span class="char-info-label">⭐ Immun.</span>
                        <span class="char-info-value wrap">${ch.immunities.join(', ')}</span>
                    </div>`
                            : ''
                    }
                </div>
            </div>

            <!-- Spells & Items -->
            <div class="char-inventory-row">
                <div class="char-inventory-box">
                    <div class="char-inventory-header" data-action="toggle-parent-expanded">
                        <span>✨ Zauber (${spells.length})</span>
                        <span class="char-expand-icon">▼</span>
                    </div>
                    <div class="char-inventory-content">
                        ${spells.length ? spells.map(s => `<span class="char-tag spell clickable" data-action="navigate-entity-stop" data-type="spells" data-id="${s.id}" title="Klicken für Details">${esc(s.name)}</span>`).join('') : '<span class="char-empty">Keine Zauber</span>'}
                    </div>
                </div>
                <div class="char-inventory-box">
                    <div class="char-inventory-header" data-action="toggle-parent-expanded">
                        <span>📦 Items (${items.length})</span>
                        <span class="char-expand-icon">▼</span>
                    </div>
                    <div class="char-inventory-content">
                        ${items.length ? items.map(i => `<span class="char-tag item clickable" data-action="navigate-entity-stop" data-type="loot" data-id="${i.id}" title="Klicken für Details">${CATS[i.category]?.split(' ')[0] || '📦'} ${esc(i.name)}${i.assignedQty > 1 ? ` ×${i.assignedQty}` : ''}</span>`).join('') : '<span class="char-empty">Keine Items</span>'}
                    </div>
                </div>
            </div>

            ${
                ch.notes
                    ? `
            <div class="char-notes-section">
                <div class="char-notes-label">📝 Notizen</div>
                <div class="char-notes-content">${sanitizeHTML(ch.notes)}</div>
            </div>`
                    : ''
            }
        </div>

        <div class="char-modal-actions">
            <button class="btn" data-action="edit-char-from-modal" data-id="${ch.id}">✏️ Bearbeiten</button>
            <button class="btn" data-action="show-assign-spells-from-modal" data-id="${ch.id}">✨ Zauber</button>
            <button class="btn" data-action="show-assign-items-from-modal" data-id="${ch.id}">📦 Items</button>
        </div>
    `;
    const contentEl = $('char-detail-content');
    if (contentEl) {
        contentEl.innerHTML = content;
    }
    showModal('char-detail-modal');
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.showCharacterDetails = showCharacterDetails;
