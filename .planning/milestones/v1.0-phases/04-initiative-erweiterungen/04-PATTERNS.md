# Phase 4: Initiative-Erweiterungen — Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 7 (2 new modules, 3 modified modules, 1 new CSS section, 1 new unit test file)
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `features/initiative-statblock.js` (NEW) | feature/service | request-response | `features/initiative.js` `showConcentrationModal()` (dynamic panel, lazy DOM, overlay dismiss) | role-match |
| `features/initiative-mob.js` (NEW) | feature/service | CRUD + event-driven | `features/bestiary/bestiary-actions.js` `addBestiaryToInitiative()` | exact (same data flow: combatant creation + mutation) |
| `features/initiative.js` (MODIFIED) | feature/controller | CRUD + event-driven | self | self |
| `features/bestiary/bestiary-actions.js` (MODIFIED) | feature/service | CRUD | self | self |
| `ui/actions/combat-actions.js` (MODIFIED) | action-handler | request-response | self (`CombatActions` object) | self |
| `assets/styles/initiative.css` (MODIFIED) | style | — | `.death-save-dot` block (initiative.css:298–329) | exact |
| `tests/unit/initiative-mob.test.js` (NEW) | test | — | `tests/unit/srd-monsters.test.js` | role-match |

---

## Pattern Assignments

### `features/initiative-statblock.js` (NEW — feature, request-response)

**Analog:** `features/initiative.js` — `showConcentrationModal()` (lines 622–689) for the dynamic-panel pattern; `renderBestiaryDetail()` (`features/bestiary/bestiary-render.js` lines 218–437) for the statblock HTML structure.

**Critical constraint (from RESEARCH.md Falle 1):** `renderBestiaryDetail(id, source)` writes directly into `#bestiary-detail-panel` (line 219: `var panel = window.$('bestiary-detail-panel'); if (!panel) return;`). That DOM element does not exist in the Initiative tab. Calling it from Initiative will silently return without error. Solution: extract `renderStatblockHTML(monster, source)` that returns a pure HTML string using the same sections 1–20 from `renderBestiaryDetail` lines 349–423.

**Imports pattern — module-level `var` for window globals** (analog: `features/initiative-extras.js` lines 8–9):
```javascript
// [SECTION:INITIATIVE_STATBLOCK]
// Drawer-Panel fuer Statblock-Anzeige in der Initiative-Ansicht (INIT-01)
// Analog: showConcentrationModal() in features/initiative.js:622
// Kein direkter Aufruf von renderBestiaryDetail() — tab-spezifisch!
// var D = window.D; // [REMOVED pattern — const in global scope]
```

**Dynamic panel creation pattern** (copy from `features/initiative.js` lines 666–679):
```javascript
function showInitStatblockPanel(cbId) {
    var cb = getCombatant(cbId);
    if (!cb) return;

    var panel = $('init-statblock-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'init-statblock-panel';
        panel.className = 'modal-overlay init-statblock-drawer';
        // Overlay-click closes drawer (analog: concentration-modal line 674)
        panel.onclick = function(e) {
            if (e.target === panel) closeInitStatblockPanel();
        };
        document.body.appendChild(panel);
    }
    // ... populate content ...
    panel.classList.add('show');
}

function closeInitStatblockPanel() {
    var panel = $('init-statblock-panel');
    if (panel) panel.classList.remove('show');
}
```

**Core HTML-string renderer — structure to copy from `renderBestiaryDetail` lines 349–423:**
```javascript
function renderStatblockHTML(monster, source) {
    // Local helpers (copy from renderBestiaryDetail lines 246–287):
    function attrMod(score) { var m = Math.floor((score-10)/2); return (m>=0?'+':'')+m; }
    function renderTraitList(items) { /* copy lines 258–281 */ }
    function renderInlineList(arr) { /* copy lines 283–287 */ }

    // CRITICAL: renderClickableDice AFTER sanitizeHTML (Falle 3 in RESEARCH.md)
    // Order from renderBestiaryDetail line 264: sanitizeHTML(items) then renderClickableDice(...)

    // Build and RETURN statblockHtml string (lines 349–423 of renderBestiaryDetail)
    // Do NOT write to panel.innerHTML here — caller does that
    var statblockHtml = '<div class="bestiary-statblock read-aloud parchment">' +
        // sections 1–20 (copy verbatim from renderBestiaryDetail:349–423)
        '</div>';
    return statblockHtml;
}
```

**Basic-info fallback for combatants without `statblockRef` (D-03):**
```javascript
function renderBasicCombatantInfo(cb) {
    // Uses esc() for all D-values (CLAUDE.md XSS rule)
    return '<div class="init-statblock-basic">' +
        '<div class="init-statblock-name">' + esc(cb.name) + '</div>' +
        '<p>HP: ' + esc(String(cb.currentHp||0)) + '/' + esc(String(cb.maxHp||0)) + '</p>' +
        '<p>RK: ' + esc(String(cb.ac||10)) + '</p>' +
        // effects via renderCombatantEffects(cb) — already XSS-safe
        '</div>';
}
```

**`statblockRef.id` lookup — never use `parseEntityId()`** (RESEARCH.md Falle 2):
```javascript
// CORRECT: statblockRef.id is a String like 'goblin' — pass directly to getBestiaryMonster
// getBestiaryMonster(id, source) in bestiary-actions.js:11–18 handles string _id correctly
var monster = getBestiaryMonster(cb.statblockRef.id, cb.statblockRef.source);

// WRONG — parseEntityId('goblin') returns null:
// var monster = getBestiaryMonster(parseEntityId(cb.statblockRef.id), ...);
```

**Window exports** (copy pattern from `features/initiative.js` lines 1370–1379):
```javascript
window.showInitStatblockPanel  = showInitStatblockPanel;
window.closeInitStatblockPanel = closeInitStatblockPanel;
// renderStatblockHTML: only export if needed by other modules
```

**Build/loader registration** (insert AFTER `'features/bestiary/bestiary-actions.js'` in both files):
- `loader.js` line ~81: after `'features/bestiary/bestiary-actions.js'`
- `build.py` same location (keep both in sync — CLAUDE.md Architecture constraint)

---

### `features/initiative.js` — `renderInit()` extension (MODIFIED)

**Analog:** self — the existing `renderInit()` template at lines 104–203, specifically the Death Saves and Concentration inline render calls at lines 178–180.

**Where to insert the 📖-button (D-02):** Inside `.init-right` div (line 192), after existing HP buttons and effect/remove buttons:
```javascript
// Copy exact button size from existing init buttons (24px × 24px, btn-icon style from UI-SPEC)
`<button class="btn-icon init-statblock-btn"
    data-action="show-init-statblock"
    data-id="${cb.id}"
    title="${cb.statblockRef ? 'Statblock anzeigen' : 'Basisinfos anzeigen'}">📖</button>`
```

**Where to insert LA/LR pip blocks (D-08/D-09) — analog to death saves at line 178:**
```javascript
// Insert after the effects row inside .init-info, before closing </div>
// Analog: renderDeathSaves pattern (lines 494–545)
`${cb.legendaryActions && cb.legendaryActions.max > 0 ? renderLegendaryActionPips(cb) : ''}
 ${cb.legendaryResistance && cb.legendaryResistance.max > 0 ? renderLegendaryResistancePips(cb) : ''}`
```

**Mob integration guards — copy pattern from existing type-checks (lines 178–180):**
```javascript
// BEFORE (lines 178–180):
${dead && cb.type === 'player' ? renderDeathSaves(cb) : ''}
${!dead ? renderConcentration(cb) : ''}
${cb.concentration?.pendingCheck ? renderConcentrationCheck(cb, cb.concentration.pendingCheck) : ''}

// AFTER — add cb.mob guard to concentration (RESEARCH.md Falle 5):
${dead && cb.type === 'player' ? renderDeathSaves(cb) : ''}
${!dead && !cb.mob ? renderConcentration(cb) : ''}
${!cb.mob && cb.concentration?.pendingCheck ? renderConcentrationCheck(cb, cb.concentration.pendingCheck) : ''}
```

**Mob row: renderInit() branching** — analog to the existing lair-action branch (lines 147–161):
```javascript
// After the lair-type early-return block (line 161), add mob branch:
if (cb.mob) {
    return renderMobRow(cb, i, init);  // delegate to initiative-mob.js
}
// ...then existing single-combatant template
```

**Quick Actions guard** (line 199):
```javascript
// BEFORE:
if (typeof window.renderQuickActionsBar === 'function') {
    window.renderQuickActionsBar();
}
// AFTER — mob combatants have no meaningful quick actions:
const activeCb = init.combatants[init.currentTurn];
if (typeof window.renderQuickActionsBar === 'function' && activeCb && !activeCb.mob) {
    window.renderQuickActionsBar();
}
```

**`nextTurn()` LA-reset insertion (D-10) — lines 383–387:**
```javascript
// CURRENT nextTurn() (lines 383–387):
init.currentTurn++;
if (init.currentTurn >= init.combatants.length) {
    init.currentTurn = 0;
    init.round++;
}

// MODIFIED — insert LA reset inside the if-block:
init.currentTurn++;
if (init.currentTurn >= init.combatants.length) {
    init.currentTurn = 0;
    init.round++;
    // D-10: LA-Reset bei Rundenübergang (jede Runde)
    // D-07: LR KEIN Auto-Reset — LR sind /Tag, nur LA!
    init.combatants.forEach(function(c) {
        if (c.legendaryActions && c.legendaryActions.max > 0) {
            c.legendaryActions.remaining = c.legendaryActions.max;
        }
    });
}
```

**`renderLegendaryActionPips()` function — copy structure from `renderDeathSaves()` lines 494–545:**
```javascript
function renderLegendaryActionPips(cb) {
    var la = cb.legendaryActions;
    if (!la || la.max <= 0) return '';
    // Dot structure: copy from renderDeathSaves() lines 511–523
    // data-action suffix: -stop (event bubbling prevention — matches toggle-death-save-stop)
    return '<div class="la-pips" title="Setzt sich bei Initiative 20 zurück">' +
        '<span class="la-label">⭐ LA</span>' +
        '<div class="la-dots">' +
        [0,1,2].slice(0, la.max).map(function(i) {
            return '<span class="la-dot ' + (i < la.remaining ? 'active' : '') + '"' +
                ' data-action="init-use-la-stop"' +
                ' data-id="' + cb.id + '"' +
                ' data-index="' + i + '"' +
                ' title="Legendäre Aktion ' + (i+1) + (i < la.remaining ? ' verwenden' : ' (verbraucht)') + '">' +
                '</span>';
        }).join('') +
        '</div></div>';
}

function renderLegendaryResistancePips(cb) {
    var lr = cb.legendaryResistance;
    if (!lr || lr.max <= 0) return '';
    return '<div class="lr-pips" title="Pro Tag — kein automatischer Reset">' +
        '<span class="lr-label">🛡 LW</span>' +
        '<div class="lr-dots">' +
        [0,1,2].slice(0, lr.max).map(function(i) {
            return '<span class="lr-dot ' + (i < lr.remaining ? 'active' : '') + '"' +
                ' data-action="init-use-lr-stop"' +
                ' data-id="' + cb.id + '"' +
                ' data-index="' + i + '"' +
                ' title="Legendären Widerstand ' + (i+1) + (i < lr.remaining ? ' einsetzen' : ' (verbraucht)') + '">' +
                '</span>';
        }).join('') +
        '</div>' +
        '<button class="lr-reset-btn btn-icon"' +
            ' data-action="init-reset-lr-stop"' +
            ' data-id="' + cb.id + '"' +
            ' title="Legendären Widerstand zurücksetzen (Lange Rast)">↺</button>' +
        '</div>';
}
```

**Pip toggle handler pattern — copy from `toggleDeathSave()` lines 547–577:**
```javascript
function useLA(cbId, index) {
    var cb = getCombatant(cbId);
    if (!cb || !cb.legendaryActions) return;
    var la = cb.legendaryActions;
    // Toggle-Logik exakt wie toggleDeathSave() lines 557–562:
    if (index < la.remaining) {
        la.remaining = index;      // Klick auf aktiven Dot: zurücksetzen bis hier
    } else {
        la.remaining = index + 1;  // Klick auf inaktiven Dot: auffüllen bis hier
    }
    renderInit();
    window.save();
}
// useLR(cbId, index) — identisch, nutzt cb.legendaryResistance.remaining
// resetLR(cbId) — setzt cb.legendaryResistance.remaining = cb.legendaryResistance.max
```

---

### `features/initiative-mob.js` (NEW — feature/service, CRUD + event-driven)

**Analog:** `features/bestiary/bestiary-actions.js` `addBestiaryToInitiative()` (lines 64–128) for the combatant-creation pattern; `features/initiative.js` `modHp()` (lines 318–345) for pool-HP mutation.

**Module header pattern** (copy from `features/bestiary/bestiary-actions.js` lines 1–6):
```javascript
// [SECTION:INITIATIVE_MOB]
// ============================================================
// MOB-MODUS fuer Initiative (INIT-03)
// Analog: bestiary-actions.js addBestiaryToInitiative() (Kombattant-Erstellung)
// Analog: initiative.js modHp() (HP-Mutation-Muster)
// ============================================================
```

**`parseLegendaryResistanceCount()` — LR-Parsing (D-05):**
```javascript
function parseLegendaryResistanceCount(monster) {
    if (!monster || !monster.traits) return 0;
    var items = Array.isArray(monster.traits) ? monster.traits : [];
    for (var i = 0; i < items.length; i++) {
        var name = items[i].name || '';
        // Deutsch: "Legendäre Resistenz (3-mal täglich)" — verified in srd-monsters.js:6958, 7083
        var matchDE = name.match(/(\d+)-mal\s+t[äa]glich/i);
        // Englisch: "(3/Day)" — Fallback fuer custom creatures
        var matchEN = name.match(/\((\d+)\/Day\)/i);
        if (matchDE) return parseInt(matchDE[1], 10);
        if (matchEN) return parseInt(matchEN[1], 10);
    }
    // Custom creature: traits als HTML-String (analog renderTraitList() in bestiary-render.js:261)
    if (typeof monster.traits === 'string') {
        var m = monster.traits.match(/[Ll]egend[äa]re?\s+[Rr]esistenz.*?(\d+)-mal/);
        if (m) return parseInt(m[1], 10);
    }
    return 0;
}
```

**Mob combatant creation — copy structure from `addBestiaryToInitiative()` lines 88–119:**
```javascript
function createMobCombatant(monster, count, source) {
    // HP-Variation: copy from bestiary-actions.js lines 93–95
    var totalHp = 0;
    var individualMaxHp = Math.round(monster.hp || 1);
    for (var k = 0; k < count; k++) {
        totalHp += Math.max(1, Math.round((monster.hp || 1) * (0.9 + Math.random() * 0.2)));
    }
    // DEX-Modifier: copy from bestiary-actions.js line 85
    var dexMod = Math.floor(((monster.dex || 10) - 10) / 2);
    // statblockRef: copy from bestiary-actions.js lines 100–104
    var statblockRef = {
        source: source || 'srd',
        id: source === 'custom' ? monster.id : monster._id
    };
    // Mob-Felder: runtime-only, keine Migration (STATE.md Architecture constraint)
    return {
        id: nextId('combatants'),
        name: monster.name + '-Schwarm',  // UI-SPEC copy contract
        initiative: Math.floor(Math.random() * 20) + 1 + dexMod,
        initBonus: dexMod,
        maxHp: totalHp,     // Grid-Anzeige; Pool-HP
        currentHp: totalHp, // Pool-HP fuer HP-Buttons
        ac: monster.ac || 10,
        type: 'monster',
        cr: monster.cr || '0',
        xp: monster.xp || (window.CR_TO_XP && window.CR_TO_XP[monster.cr]) || 0,
        effects: [],
        statblockRef: statblockRef,
        mob: {
            count: count,
            poolHp: totalHp,
            maxPoolHp: totalHp,
            individualMaxHp: individualMaxHp,
            attackMode: 'nfach'   // 'nfach' | 'dmg-regel'
        }
    };
}
```

**`getMobAlive()` — "X von N am Leben" Berechnung:**
```javascript
function getMobAlive(cb) {
    if (!cb.mob) return 1;
    return Math.max(0, Math.ceil(cb.mob.poolHp / cb.mob.individualMaxHp));
}
```

**DMG-Mob-Regel (D-13b) — O(1) Berechnung, kein Loop:**
```javascript
function calcMobHits(count, attackBonus, targetAC) {
    var needed = Math.max(2, targetAC - attackBonus);
    if (needed >= 20) return Math.max(1, Math.floor(count * 0.05));
    var fraction = (21 - needed) / 20;
    return Math.max(0, Math.floor(count * fraction));
}
// Beispiel (aus RESEARCH.md): 10 Goblins (+4) vs AC 15
// needed=11; fraction=0.5; Treffer=5
```

**`applyMobDamage()` — Pool-HP-Mutation analog `modHp()` lines 318–345:**
```javascript
function applyMobDamage(cbId, damage) {
    var cb = getCombatant(cbId);
    if (!cb || !cb.mob) return;
    // Schaden auf Pool (analog modHp() lines 323–331)
    var remaining = Math.abs(damage);
    if (cb.tempHp && cb.tempHp > 0) {
        var absorbed = Math.min(cb.tempHp, remaining);
        cb.tempHp -= absorbed;
        remaining -= absorbed;
    }
    cb.mob.poolHp = Math.max(0, cb.mob.poolHp - remaining);
    cb.currentHp = cb.mob.poolHp;  // HP-Display synchron halten
    renderInit();
    window.save();
}
```

**`dissolveMob()` — saveUndoState() vor destruktiver Operation (CLAUDE.md Pattern):**
```javascript
function dissolveMob(cbId) {
    if (!confirm('Mob-Zeile entfernen? Diese Aktion ist mit Strg+Z rückgängig zu machen.')) return;
    saveUndoState('Mob aufgehoben');  // IMMER vor Mutation (CLAUDE.md)
    var D = window.D;
    D.initiative.combatants = D.initiative.combatants.filter(function(c) { return c.id !== cbId; });
    if (D.initiative.currentTurn >= D.initiative.combatants.length) {
        D.initiative.currentTurn = 0;
    }
    renderInit();
    window.save();
    showToast('Mob aufgehoben');
}
```

**`renderMobRow()` — template returning HTML string (analog lair-row template in `renderInit()` lines 148–161):**
```javascript
function renderMobRow(cb, i, init) {
    var active = i === init.currentTurn;
    var alive = getMobAlive(cb);
    var aliveRatio = cb.mob.count > 0 ? alive / cb.mob.count : 0;
    var aliveClass = cb.mob.poolHp <= 0 ? 'defeated' :
                     aliveRatio > 0.5  ? 'healthy' :
                     aliveRatio > 0.25 ? 'bloodied' : 'critical';
    var hpClass = aliveClass === 'defeated' ? 'critical' : aliveClass;
    var isAttackDmgRegel = cb.mob.attackMode === 'dmg-regel';
    // UI-SPEC HTML contract (04-UI-SPEC.md Component Visual Contracts — INIT-03)
    return '<div class="init-entry init-row monster mob-entry ' + (active ? 'active' : '') + '"' +
            ' draggable="true" data-id="' + cb.id + '">' +
        // columns: drag, initiative, AC, info, right
        '<span class="drag-handle" title="Ziehen zum Umsortieren">⠿</span>' +
        '<div class="init-value" data-action="edit-init-value" data-id="' + cb.id + '">' + esc(String(cb.initiative)) + '</div>' +
        '<div class="init-ac"><span class="init-ac-icon">🛡️</span>' + esc(String(cb.ac)) + '</div>' +
        '<div class="init-info init-info--mob">' +
            '<div class="init-name">' + esc(cb.name) + '</div>' +
            '<div class="init-type">Mob · ' + cb.mob.count + ' Kreaturen · Pool-HP</div>' +
            '<div class="init-mob-alive ' + aliveClass + '">' +
                (cb.mob.poolHp <= 0 ?
                    '<span class="init-mob-defeated-badge">Besiegt</span>' :
                    esc(String(alive)) + ' von ' + esc(String(cb.mob.count)) + ' am Leben') +
            '</div>' +
            // Mob attack controls (UI-SPEC HTML structure)
            // ... (see 04-UI-SPEC.md for full HTML)
        '</div>' +
        '<div class="init-right">...</div>' +
    '</div>';
}
```

**`rollMobAttack()` — showToast() for result (UI-SPEC: result in event-log, not inline):**
```javascript
function rollMobAttack(cbId) {
    var cb = getCombatant(cbId);
    if (!cb || !cb.mob) return;
    var alive = getMobAlive(cb);
    if (alive <= 0) { showToast('Mob besiegt', 'warning'); return; }
    // N-fach Modus: rollQrefDice via bestehenden Roller (RESEARCH.md Don't Hand-Roll)
    if (cb.mob.attackMode === 'nfach') {
        // Nutzt window.rollQrefDice() oder window.rollDiceFormula() aus dice-core.js
        // Gibt Ergebnis per showToast aus (UI-SPEC attack result display)
    }
    // DMG-Regel Modus: calcMobHits() + automatisch summierter Schaden (D-14)
}
```

**Window exports** (copy pattern from `features/bestiary/bestiary-actions.js` lines 239–244):
```javascript
window.createMobCombatant          = createMobCombatant;
window.renderMobRow                = renderMobRow;
window.getMobAlive                 = getMobAlive;
window.calcMobHits                 = calcMobHits;
window.applyMobDamage              = applyMobDamage;
window.rollMobAttack               = rollMobAttack;
window.dissolveMob                 = dissolveMob;
window.parseLegendaryResistanceCount = parseLegendaryResistanceCount;
```

**Build/loader registration** — insert AFTER `'features/initiative-extras.js'` in both `loader.js` (line ~113) and `build.py`:
```
'features/initiative-statblock.js',  // after bestiary-actions.js (~line 81)
'features/initiative-mob.js',         // after initiative-extras.js (~line 113)
```

---

### `features/bestiary/bestiary-actions.js` — `addBestiaryToInitiative()` extension (MODIFIED)

**Analog:** self (lines 64–128). Extend the existing function body after the `count` clamping on line 77 and before the for-loop at line 89.

**Mob-toggle insertion point (D-11) — after line 77, before line 87 `saveUndoState(...)`:**
```javascript
// Nach: var count = isNaN(parsed) ? 1 : Math.max(1, Math.min(parsed, BESTIARY_MAX_QUANTITY));
// Einfügen:
var isMob = false;
if (count > 1) {
    // confirm() ist konsistent mit bestehenden confirm()-Aufrufen im Projekt (RESEARCH.md Annahme A3)
    isMob = confirm(
        'Als Mob führen? (1 Zeile mit Pool-HP)\n\n' +
        'JA = Mob-Modus (Pool-HP, Sammel-Angriff)\n' +
        'NEIN = ' + count + ' Einzelzeilen'
    );
}

// Nach saveUndoState(), statt der bestehenden for-Schleife (lines 89–119):
if (isMob) {
    // LA/LR-Felder initialisieren beim Mob-Anlegen (RESEARCH.md Code-Beispiel)
    var laCount = (monster.legendaryActionsPerRound || 0);
    var lrCount = parseLegendaryResistanceCount(monster);  // aus initiative-mob.js
    var mobCb = createMobCombatant(monster, count, source); // aus initiative-mob.js
    if (laCount > 0) mobCb.legendaryActions = { max: laCount, remaining: laCount };
    if (lrCount > 0) mobCb.legendaryResistance = { max: lrCount, remaining: lrCount };
    D.initiative.combatants.push(mobCb);
} else {
    // Bestehende N-Zeilen-Schleife (lines 89–119) — UNVERÄNDERT
    for (var i = 0; i < count; i++) {
        // ... existing code ...
        // LA/LR-Felder auch für Einzelkombattanten initialisieren:
        var singleLa = (monster.legendaryActionsPerRound || 0);
        var singleLr = parseLegendaryResistanceCount(monster);
        var cbObj = { /* ...existing fields... */ };
        if (singleLa > 0) cbObj.legendaryActions = { max: singleLa, remaining: singleLa };
        if (singleLr > 0) cbObj.legendaryResistance = { max: singleLr, remaining: singleLr };
        D.initiative.combatants.push(cbObj);
    }
}
```

---

### `ui/actions/combat-actions.js` — `CombatActions` extension (MODIFIED)

**Analog:** self — the `CombatActions` object (lines 6–146) and the `-stop` suffix pattern (lines 10–58).

**Registration pattern** (copy from lines 10–13, the `toggle-death-save-stop` entry):
```javascript
// Pattern: action name, ctx.event.stopPropagation(), then handler call
// -stop suffix REQUIRED for all pip/mob actions to prevent row-level click propagation
const CombatActions = {
    // ... existing entries ...

    // INIT-01: Statblock-Drawer
    'show-init-statblock': ctx => showInitStatblockPanel(ctx.id),
    'close-init-statblock': () => closeInitStatblockPanel(),

    // INIT-02: Legendäre Aktionen Pips
    'init-use-la-stop': ctx => {
        ctx.event.stopPropagation();
        useLA(ctx.id, parseInt(ctx.target.dataset.index));
    },

    // INIT-02: Legendäre Resistenz Pips
    'init-use-lr-stop': ctx => {
        ctx.event.stopPropagation();
        useLR(ctx.id, parseInt(ctx.target.dataset.index));
    },
    'init-reset-lr-stop': ctx => {
        ctx.event.stopPropagation();
        resetLR(ctx.id);
    },

    // INIT-03: Mob-Modus
    'init-mob-set-mode-stop': ctx => {
        ctx.event.stopPropagation();
        setMobAttackMode(ctx.id, ctx.target.dataset.mode);
    },
    'init-mob-attack-stop': ctx => {
        ctx.event.stopPropagation();
        rollMobAttack(ctx.id);
    },
    'init-mob-dissolve-stop': ctx => {
        ctx.event.stopPropagation();
        dissolveMob(ctx.id);
    },
};
```

**Why `-stop` suffix:** Prevents event bubbling from pip/button clicks to parent row-level handlers. Established pattern: `toggle-death-save-stop` (line 10), `show-concentration-modal-stop` (line 14), `bestiary-select-stop` in bestiary-actions.

---

### `assets/styles/initiative.css` (MODIFIED — new CSS sections appended)

**Analog:** `.death-save-dot` block (lines 298–329), `.init-slot-box` (lines 241–257), `.init-entry` grid (lines 111–120).

**Concrete source measurements to copy from (initiative.css):**
- Dot size: 16px × 16px (line 299–300: `width: 16px; height: 16px`)
- Dot border-radius: 50% (line 301)
- Hover transform: `scale(1.15)` (line 309)
- Transition: `all 0.15s` (line 305)
- Label font-size: `0.75em` (line 276)
- Label font-weight: `600` (line 277)
- Dot gap: `gap: 4px` (line 294–295)
- Row gap from label to dots: `gap: 8px` (analog `.death-saves` line 267)
- `.modal-overlay` base: `display: none; position: fixed; top/left/right/bottom: 0; background: rgba(0,0,0,0.6); z-index: 1100;` — from `dashboard.css:551–566`
- `.modal-overlay.show`: `display: flex; opacity: 1;` — from `dashboard.css:568–571`

**New sections to append to `initiative.css` (UI-SPEC CSS File Assignment):**
1. `/* Statblock-Drawer (INIT-01) */` — `.init-statblock-drawer`, `.init-statblock-content`, `.init-statblock-basic`
2. `/* Legendäre Aktionen Pips (INIT-02 LA) */` — `.la-pips`, `.la-label`, `.la-dots`, `.la-dot`, `.la-dot.active`, `.la-dot:hover`
3. `/* Legendäre Widerstands-Pips (INIT-02 LR) */` — `.lr-pips`, `.lr-label`, `.lr-dots`, `.lr-dot`, `.lr-dot.active`, `.lr-reset-btn`
4. `/* Mob-Zeile (INIT-03) */` — `.init-info--mob`, `.init-mob-alive` variants, `.init-mob-controls`, `.init-mob-mode-btn`, `.init-mob-dmg-inputs`, `.init-mob-attack-btn`, `.init-mob-dissolve-btn`, `.init-mob-defeated-badge`

Full CSS specs are in `04-UI-SPEC.md` Component Visual Contracts.

---

### `tests/unit/initiative-mob.test.js` (NEW — unit test)

**Analog:** `tests/unit/srd-monsters.test.js` for data-layer function testing structure.

**Functions to test** (from RESEARCH.md Validierungs-Architektur):
- `parseLegendaryResistanceCount(monster)` — "3-mal täglich" recognition
- `getMobAlive(cb)` — pool / individualMaxHp ceiling division
- `calcMobHits(count, attackBonus, targetAC)` — DMG formula: 10 Goblins (+4) vs AC 15 = 5 hits
- Pool-HP creation: count × HP-Variation sum

---

## Shared Patterns

### Undo Before Destructive Operations
**Source:** `features/initiative.js` — every destructive function; `CLAUDE.md` §"Key Patterns"
**Apply to:** `dissolveMob()` in `initiative-mob.js`; any future "remove from initiative" actions
```javascript
saveUndoState('Mob aufgehoben');  // IMMER VOR Mutation
D.initiative.combatants = D.initiative.combatants.filter(...);
window.save();
```

### XSS — Two-tier sanitization
**Source:** `features/bestiary/bestiary-render.js` `renderTraitList()` lines 258–281
**Apply to:** All statblock text in `renderStatblockHTML()`; all combatant names in mob row
```javascript
// Statblock trait text (contains <b> markup):
var cleanDesc = sanitizeHTML(item.desc || '');     // Step 1: sanitize
var safeDesc  = renderClickableDice(cleanDesc);    // Step 2: dice spans (AFTER sanitize!)

// D-values and names:
esc(cb.name)           // All combatant/monster names
esc(String(cb.ac))     // Numeric fields cast to String first
```

### Event Delegation — `-stop` suffix pattern
**Source:** `ui/actions/combat-actions.js` lines 10–58; `features/initiative.js` death-save HTML
**Apply to:** All new `data-action` values for pip clicks and mob controls
```javascript
// HTML: data-action="init-use-la-stop"
// Handler:
'init-use-la-stop': ctx => {
    ctx.event.stopPropagation();  // Prevents row-click propagation
    useLA(ctx.id, parseInt(ctx.target.dataset.index));
},
```

### `save()` after non-destructive mutations (Pip clicks, Pool HP)
**Source:** `features/initiative.js` `toggleDeathSave()` lines 574–576; `modHp()` lines 344–345
**Apply to:** `useLA()`, `useLR()`, `resetLR()`, `applyMobDamage()`, `setMobAttackMode()`
```javascript
renderInit();
window.save();   // NOT saveImmediate() — pip state persists but is not urgent
```

### Dynamic modal/panel creation pattern
**Source:** `features/initiative.js` `showConcentrationModal()` lines 666–680
**Apply to:** `showInitStatblockPanel()` in `initiative-statblock.js`
```javascript
var panel = $('panel-id');
if (!panel) {
    panel = document.createElement('div');
    panel.id = 'panel-id';
    panel.className = 'modal-overlay custom-class';
    panel.onclick = function(e) { if (e.target === panel) closePanel(); };
    document.body.appendChild(panel);
}
panel.classList.add('show');
// Close: panel.classList.remove('show');
```

### `parseEntityId()` — NOT for `statblockRef.id`
**Source:** `features/bestiary/bestiary-actions.js` `getBestiaryMonster()` lines 11–17
**Apply to:** All combatant-ID lookups (use `parseEntityId()`); SRD monster lookups (use raw string)
```javascript
// Combatant IDs (numeric): parseEntityId(cbId)
var cb = D.initiative.combatants.find(c => c.id === parseEntityId(cbId));

// SRD monster IDs (strings): pass directly
var monster = getBestiaryMonster(cb.statblockRef.id, cb.statblockRef.source);
// getBestiaryMonster uses String(id) comparison (line 17: m._id === id)
```

### No `const X = window.X` inside functions (Build dedup rule)
**Source:** `CLAUDE.md` §"Build System & Deduplication Pattern"; `features/initiative-extras.js` lines 8–9 (comment shows removed pattern)
**Apply to:** All new module files
```javascript
// BAD (breaks in concatenated build if const X declared globally):
function foo() { const save = window.save; save(); }

// GOOD:
function foo() { window.save(); }
// OR at module top-level:
var save = window.save;  // var is deduplicated by build.py Pass 2
```

---

## No Analog Found

All new files have analogs in the codebase. No greenfield patterns required.

---

## Metadata

**Analog search scope:** `features/`, `ui/actions/`, `systems/`, `assets/styles/`, `core/`
**Files scanned:** 12 source files read directly + CSS grep
**Pattern extraction date:** 2026-06-14
**Phase:** 04-initiative-erweiterungen
