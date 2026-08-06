# Phase 3: Bestiary — Pattern Map

**Erstellt:** 2026-06-13
**Dateien analysiert:** 11 neue/geänderte Dateien
**Analoge gefunden:** 11 / 11

---

## Datei-Klassifikation

| Neue/Geänderte Datei | Rolle | Datenfluss | Nächster Analog | Match-Qualität |
|----------------------|-------|-----------|----------------|----------------|
| `core/srd-monsters.js` | data-store | batch (lazy-init) | `core/srd-spells.js` | exakt |
| `features/bestiary/bestiary-render.js` | component | request-response | `features/npcs/npc-render.js` | exakt |
| `features/bestiary/bestiary-crud.js` | service | CRUD | `features/encounters/encounters-crud.js` | role-match |
| `features/bestiary/bestiary-editor.js` | component | CRUD | `features/encounters/encounters-crud.js` | role-match |
| `features/bestiary/bestiary-actions.js` | service | event-driven | `features/encounter-calculator.js` → `addCalculatorToInitiative()` | role-match |
| `assets/styles/bestiary.css` | config | — | `assets/styles/npcs.css` | exakt |
| `assets/templates/view-bestiary.html` | config | — | NPC-Sektion in `assets/templates/view-content.html` | exakt |
| `systems/tab-registry.js` (Änderung) | config | — | `systems/tab-registry.js` selbst | exakt |
| `systems/spellslots/version-migration.js` (Änderung) | migration | transform | `systems/spellslots/version-migration.js` selbst | exakt |
| `core/data.js` (Änderung) | model | — | `core/data.js` selbst | exakt |
| `features/encounters/monster-templates.js` (Änderung) | data-store | — | `core/srd-spells.js` | role-match |

---

## Pattern-Zuweisungen

---

### `core/srd-monsters.js` (data-store, lazy-init)

**Analog:** `core/srd-spells.js`

**Imports-Pattern** (Zeilen 1–12 des Analogs):
```javascript
// [SECTION:SRD_SPELLS]
// SRD-Zauber-Datenbank
// SRD SPELLS DATABASE - LAZY LOADED
// Die Daten werden erst beim ersten Zugriff initialisiert
let _srdSpellsCache = null;
function getSRDSpells() {
    if (_srdSpellsCache) return _srdSpellsCache;
    _srdSpellsCache = [ /* ... Datenobjekte ... */ ];
    return _srdSpellsCache;
}
// kein window.export nötig; wird per globalem Scope aufgerufen
```

**Kern-Muster — exakt kopieren** (`core/srd-spells.js`, Zeilen 1–15):
```javascript
// [SECTION:SRD_MONSTERS]
// SRD 5.1 DE Monster-Datenbank — CC-BY-4.0
// Quelle: Wizards of the Coast / openrpg.de/srd/5e/de/
// Attribution: "Dungeons & Dragons, SRD 5.1 DE" — CC BY 4.0
// Originalquelle: media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1_DE.pdf

let _srdMonstersCache = null;

function getSRDMonsters() {
    if (_srdMonstersCache) return _srdMonstersCache;
    _srdMonstersCache = [
        // ~150 Einträge — Goblin bis Drache
        {
            _id: 'goblin',           // Stabiler String-Key (Favoriten + statblockRef)
            name: 'Goblin',
            size: 'Klein',
            creatureType: 'Humanoid',
            alignment: 'Neutral Böse',
            cr: '1/4',               // String — niemals als Zahl speichern
            xp: 50,
            ac: 15, acInfo: 'Lederrüstung, Schild',
            hp: 7, hpFormula: '2d6',
            speed: { walk: '9 m', fly: '', swim: '', climb: '', burrow: '' },
            str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8,
            savingThrows: {},            // z.B. { dex: '+4', wis: '+1' }
            skills: { heimlichkeit: '+6' },
            damageResistances: [],
            damageImmunities: [],
            conditionImmunities: [],
            senses: ['Dunkelsicht 18 m', 'Passive Wahrnehmung 9'],
            languages: ['Gemein', 'Goblinisch'],
            traits: [
                { name: 'Flinker Rückzug', desc: 'Der Goblin kann Rückzug oder Verstecken als Bonusaktion ausführen.' }
            ],
            actions: [
                { name: 'Krummsäbel', desc: 'Nahkampfwaffenangriff: +4, Reichweite 1,5 m. Treffer: 5 (1d6+2) Hiebschaden.' },
                { name: 'Kurzbogen', desc: 'Fernkampfwaffenangriff: +4, Reichweite 24/96 m. Treffer: 5 (1d6+2) Stichschaden.' }
            ],
            reactions: [],
            legendaryActions: [],
            legendaryActionsPerRound: 0
        }
    ];
    return _srdMonstersCache;
}

window.getSRDMonsters = getSRDMonsters;
```

**Kritische Regel:** NIEMALS `D.anything = getSRDMonsters()` — SRD-Daten leben ausschließlich im Closure-Cache, nie in `D`. Analog ist `srd-spells.js`, das nie in `D.spells` landet.

**Build/Loader-Eintrag** (nach `features/encounters/monster-templates.js`):
- `build.py` MODULES: `'core/srd-monsters.js',` direkt nach `'core/srd-spells.js',` (Zeile 131)
- `loader.js` MODULES: identische Position

---

### `features/bestiary/bestiary-render.js` (component, request-response)

**Analog:** `features/npcs/npc-render.js`

**Modul-Kopf-Pattern** (`npc-render.js`, Zeilen 1–7):
```javascript
// [SECTION:BESTIARY_RENDER]
// ============================================================
// BESTIARY RENDER - @list @detail @filter @badges @favorites
// ============================================================
let selectedBestiaryId = null;       // null = kein Monster ausgewählt
let selectedBestiarySource = null;   // 'srd' | 'custom'
```

**Render-Funktion mit Cache + applyFilters** (`npc-render.js`, Zeilen 51–143):
```javascript
function renderBestiaryList() {
    const container = $('bestiary-list');
    if (!container) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            console.warn('[renderBestiaryList] Container #bestiary-list fehlt');
        }
        return;
    }

    EntityLookup.enableCache();

    // SRD + Eigene zusammenführen (D-08)
    const srdMonsters = getSRDMonsters().map(m => ({ ...m, source: 'srd' }));
    const customMonsters = (window.D.bestiary || []).map(m => ({ ...m, source: 'custom' }));
    const allMonsters = [...srdMonsters, ...customMonsters];

    // Single-pass Filter (applyFilters aus utils/filter-engine.js)
    const onlyCustom = $('bestiary-filter-custom')?.checked;
    const onlyFavs  = $('bestiary-filter-favs')?.checked;
    const filtered = applyFilters(allMonsters, {
        searchText: $('bestiary-search')?.value || '',
        searchFields: ['name', 'creatureType'],
        filters: {
            cr:          $('bestiary-filter-cr')?.value  || '',
            creatureType: $('bestiary-filter-type')?.value || ''
        },
        customFilter: item => {
            if (onlyCustom && item.source !== 'custom') return false;
            if (onlyFavs && !isBestiaryFavorite(item)) return false;
            return true;
        }
    });

    // CR-Sort (Bruchwerte korrekt)
    filtered.sort((a, b) => crToSortValue(a.cr) - crToSortValue(b.cr));

    // Leerzustand
    if (!filtered.length) {
        container.innerHTML = '<div class="bestiary-empty-results">Keine Monster gefunden</div>';
        EntityLookup.clearCache();
        return;
    }

    // VirtualScroll (ui/virtual-scroll.js) — ab 50 Items automatisch aktiv
    VirtualScroll.create(container, filtered, renderBestiaryListItem, 52);

    EntityLookup.clearCache();
}
```

**Listen-Item-Render** (`npc-render.js` → `renderNPCItem()`, Zeilen 144–170 als Vorbild):
```javascript
function renderBestiaryListItem(monster) {
    const mId    = monster.source === 'custom' ? monster.id : monster._id;
    const isFav  = isBestiaryFavorite(monster);
    const isSelected = (mId == selectedBestiaryId && monster.source === selectedBestiarySource);
    return `
        <div class="bestiary-list-item ${isSelected ? 'selected' : ''} ${monster.source}"
             data-action="bestiary-select"
             data-id="${esc(String(mId))}"
             data-source="${monster.source}">
            <span class="bestiary-badge ${monster.source}">${monster.source === 'srd' ? 'SRD' : 'Eigen'}</span>
            <span class="bestiary-name">${esc(monster.name)}</span>
            <span class="bestiary-cr">HG ${esc(monster.cr)}</span>
            <span class="bestiary-type">${esc(monster.creatureType)}</span>
            <button class="bestiary-fav ${isFav ? 'active' : ''}"
                    data-action="bestiary-toggle-fav"
                    data-id="${esc(String(mId))}"
                    data-source="${monster.source}"
                    aria-label="Favorit">
                ${isFav ? '★' : '☆'}<span class="sr-only">Favorit</span>
            </button>
        </div>
    `;
}
```

**Detail-Panel-Render** (analog `showNPCDetail()` in `npc-render.js`):
- Leerzustand: `🐉`-Icon + Text "Wähle ein Monster aus der Liste" — exakt wie `.npc-detail-empty`-Muster
- Statblock-Block: `<div class="bestiary-statblock read-aloud parchment">` — WIEDERVERWENDET `.read-aloud.parchment` CSS aus `assets/styles/party.css`, Zeilen 394–399
- Trait/Aktions-Texte: `sanitizeHTML()` (nicht `esc()`), da bewusstes `<b>`-Markup enthalten

**Clickable-Dice-Pattern** (D-09):
```javascript
function renderClickableDice(text) {
    // Schadensformeln z.B. "1d6+2"
    text = text.replace(/(\d+d\d+(?:[+-]\d+)?)/g,
        '<span class="bestiary-dice" data-action="bestiary-roll-dice" data-value="$1" title="Würfeln">$1</span>');
    // Trefferwurf-Boni z.B. "+4" (nur wenn isoliert, nicht Teil von Formel)
    text = text.replace(/(?<!\d)(\+\d+)(?!\d*d)/g,
        '<span class="bestiary-dice" data-action="bestiary-roll-dice" data-value="1d20$1" title="Würfeln">$1</span>');
    return text;
}
// Action-Handler ruft rollQrefDice(e.dataset.value) auf
// rollQrefDice ist in systems/spellslots/quick-reference.js, Zeile 157 definiert
```

**window-Exports** (analog `npc-render.js`):
```javascript
window.renderBestiaryList = renderBestiaryList;
window.renderBestiaryDetail = renderBestiaryDetail;
window.isBestiaryFavorite = isBestiaryFavorite;
window.crToSortValue = crToSortValue;
```

---

### `features/bestiary/bestiary-crud.js` (service, CRUD)

**Analog:** `features/encounters/encounters-crud.js` + `utils/crud-helpers.js`

**CRUD-Pattern** (`crud-helpers.js`, Zeilen 11–62):
```javascript
// [SECTION:BESTIARY_CRUD]
// ============================================================
// BESTIARY CRUD — Eigene Kreaturen (D.bestiary[])
// ============================================================

function saveBestiary() {
    const D = window.D;
    const idInput = $('bst-edit-id');
    const id = idInput?.value || '';

    const name = $('bst-name')?.value.trim() || '';
    if (!name) {
        showToast('⚠️ Name erforderlich — bitte einen Namen eingeben', 'error');
        return;
    }

    // Saves sammeln (analog encounters-crud.js Zeilen 37–44)
    const savingThrows = {};
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const checkbox = $(`bst-save-${attr}`);
        const valueInput = $(`bst-save-val-${attr}`);
        if (checkbox && checkbox.checked) {
            savingThrows[attr] = valueInput?.value?.trim() || true;
        }
    });

    const creature = {
        name,
        source: 'custom',
        size: $('bst-size')?.value || 'Mittelgroß',
        creatureType: $('bst-type')?.value || 'Humanoid',
        alignment: $('bst-alignment')?.value.trim() || '',
        cr: $('bst-cr')?.value || '1',
        xp: parseInt($('bst-xp')?.value) || 0,
        ac: parseInt($('bst-ac')?.value) || 10,
        acInfo: $('bst-ac-info')?.value.trim() || '',
        hp: parseInt($('bst-hp')?.value) || 1,
        hpFormula: $('bst-hp-formula')?.value.trim() || '',
        speed: {
            walk: $('bst-speed-walk')?.value.trim() || '',
            fly:  $('bst-speed-fly')?.value.trim()  || '',
            swim: $('bst-speed-swim')?.value.trim() || '',
            climb: $('bst-speed-climb')?.value.trim() || '',
            burrow: $('bst-speed-burrow')?.value.trim() || ''
        },
        str: parseInt($('bst-str')?.value) || 10,
        dex: parseInt($('bst-dex')?.value) || 10,
        con: parseInt($('bst-con')?.value) || 10,
        int: parseInt($('bst-int')?.value) || 10,
        wis: parseInt($('bst-wis')?.value) || 10,
        cha: parseInt($('bst-cha')?.value) || 10,
        savingThrows,
        skills: {},            // aus bst-skills-Formular lesen
        damageResistances: [], // aus Chips
        damageImmunities: [],
        conditionImmunities: [],
        senses: [],
        languages: [],
        traits: sanitizeHTML($('bst-traits')?.innerHTML || ''),
        actions: sanitizeHTML($('bst-actions')?.innerHTML || ''),
        reactions: sanitizeHTML($('bst-reactions')?.innerHTML || ''),
        legendaryActions: sanitizeHTML($('bst-legendary')?.innerHTML || ''),
        legendaryActionsPerRound: parseInt($('bst-legendary-count')?.value) || 0,
        avatar: ''
    };

    // CRUD-Muster: saveUndoState() VOR Mutation (CLAUDE.md)
    saveUndoState(id ? 'Kreatur bearbeitet' : 'Kreatur angelegt');

    if (id) {
        const idx = D.bestiary.findIndex(x => x.id === parseEntityId(id));
        if (idx > -1) D.bestiary[idx] = { ...D.bestiary[idx], ...creature };
    } else {
        creature.id = nextId('bestiary');
        D.bestiary.push(creature);
    }

    hideModal('bestiary-editor-modal');
    afterCrudOperation(renderBestiaryList, '✅ Kreatur gespeichert');
}

function deleteBestiaryEntry(id) {
    // deleteWithConfirm aus crud-helpers.js, Zeilen 11–62
    deleteWithConfirm({
        entityType: 'bestiary',
        id,
        onSuccess: () => afterCrudOperation(renderBestiaryList, '🗑️ Kreatur gelöscht')
    });
}
```

**window-Exports:**
```javascript
window.saveBestiary = saveBestiary;
window.deleteBestiaryEntry = deleteBestiaryEntry;
```

---

### `features/bestiary/bestiary-editor.js` (component, CRUD)

**Analog:** `features/encounters/encounters-crud.js` → `editEnc()` (Zeilen 109–160)

**Kern-Muster — Editor öffnen/befüllen:**
```javascript
// [SECTION:BESTIARY_EDITOR]
// Eigene Feld-IDs: bst-* (NICHT enc-* — verhindert DOM-ID-Kollisionen)

function openBestiaryEditor(id) {
    const idInput = $('bst-edit-id');
    const titleEl = $('bestiary-editor-title');

    if (id) {
        // Bearbeitungsmodus
        const creature = (window.D.bestiary || []).find(c => c.id === parseEntityId(id));
        if (!creature) return;
        if (idInput) idInput.value = String(id);
        if (titleEl) titleEl.textContent = 'Kreatur bearbeiten';

        // Felder befüllen — analog editEnc() in encounters-crud.js
        $('bst-name').value = creature.name || '';
        $('bst-cr').value   = creature.cr   || '1';
        $('bst-ac').value   = creature.ac   || 10;
        $('bst-hp').value   = creature.hp   || 1;
        // ... alle bst-*-Felder analog zu enc-* in editEnc()

        // Rich-Text-Felder (analog encounters-crud.js Zeile 81–84)
        if ($('bst-traits'))  $('bst-traits').innerHTML  = creature.traits  || '';
        if ($('bst-actions')) $('bst-actions').innerHTML = creature.actions || '';
        if ($('bst-reactions')) $('bst-reactions').innerHTML = creature.reactions || '';
        if ($('bst-legendary')) $('bst-legendary').innerHTML = creature.legendaryActions || '';
    } else {
        // Anlegenmodus — alle Felder leeren
        if (idInput) idInput.value = '';
        if (titleEl) titleEl.textContent = 'Neue Kreatur';
        // ... alle Felder zurücksetzen
    }

    showModal('bestiary-editor-modal');
}
```

**Feld-ID-Konvention:** Präfix `bst-` für alle Formular-IDs (verhindert Kollision mit `enc-*` im Encounter-Tab, der gleichzeitig im DOM existieren kann).

**window-Exports:**
```javascript
window.openBestiaryEditor = openBestiaryEditor;
```

---

### `features/bestiary/bestiary-actions.js` (service, event-driven)

**Analog:** `features/encounter-calculator.js` → `addCalculatorToInitiative()` (Zeilen 853–933)

**„Zur Initiative"-Pattern** (kopiert aus `addCalculatorToInitiative()`, Zeilen 888–910):
```javascript
// [SECTION:BESTIARY_ACTIONS]
// ============================================================
// BESTIARY ACTIONS — Übernahme zu Initiative/Encounter, Favoriten
// ============================================================

function getBestiaryMonster(id, source) {
    if (source === 'custom') {
        return (window.D.bestiary || []).find(c => c.id === parseEntityId(id)) || null;
    }
    // SRD: _id ist String-Key
    return getSRDMonsters().find(m => m._id === id) || null;
}

function addBestiaryToInitiative(id, source) {
    const monster = getBestiaryMonster(id, source);
    if (!monster) return;

    // Mengen-Dialog (D-14)
    const countStr = prompt(`Wie viele "${monster.name}" zur Initiative hinzufügen?`, '1');
    if (countStr === null) return;  // Abbruch
    const count = Math.max(1, parseInt(countStr) || 1);

    const D = window.D;
    if (!D.initiative) D.initiative = { combatants: [], currentTurn: 0, round: 1 };

    // DEX-Modifier berechnen (analog addCalculatorToInitiative Zeile 887)
    const dexMod = Math.floor((monster.dex - 10) / 2);

    for (let i = 0; i < count; i++) {
        // Auto-Init-Wurf (D-15) — exakt wie addCalculatorToInitiative Zeile 890
        const initRoll = Math.floor(Math.random() * 20) + 1 + dexMod;

        // HP-Variation ±10% (D-15) — exakt wie addCalculatorToInitiative Zeilen 892–893
        const hpVariation = Math.round(monster.hp * (0.9 + Math.random() * 0.2));
        const hp = Math.max(1, hpVariation);

        // Nummerierung (D-16) — analog addCalculatorToInitiative Zeile 896
        const name = count > 1 ? `${monster.name} ${i + 1}` : monster.name;

        D.initiative.combatants.push({
            id: nextId('combatants'),
            name,
            initiative: initRoll,
            initBonus: dexMod,
            maxHp: hp,
            currentHp: hp,
            ac: monster.ac,
            type: 'monster',
            cr: monster.cr,
            xp: monster.xp || CR_TO_XP[monster.cr] || 0,
            effects: [],
            // statblockRef (D-17) — Runtime-Feld, keine Migration nötig
            statblockRef: {
                source: monster.source || source || 'srd',
                id: source === 'custom' ? monster.id : monster._id
            }
        });
    }

    // Sort wie addCalculatorToInitiative Zeile 929
    D.initiative.combatants.sort((a, b) => b.initiative - a.initiative);
    window.save();
    window.switchView('initiative');
    if (typeof window.renderInit === 'function') window.renderInit();
    showToast(`${count}× ${monster.name} zur Initiative hinzugefügt`);
}
```

**Favoriten-Toggle-Pattern** (analog `features/dice/dice-favorites.js`, Zeilen 55–60):
```javascript
function toggleBestiaryFavorite(id, source) {
    const D = window.D;
    if (!D.bestiaryFavorites) D.bestiaryFavorites = [];
    // Stabiler Schlüssel: SRD-Key oder 'custom:123'
    const key = source === 'custom' ? `custom:${id}` : String(id);
    const idx = D.bestiaryFavorites.indexOf(key);
    saveUndoState('Bestiary-Favorit geändert');
    if (idx > -1) {
        D.bestiaryFavorites.splice(idx, 1);
    } else {
        D.bestiaryFavorites.push(key);
    }
    window.saveImmediate();
    renderBestiaryList();
}

function isBestiaryFavorite(monster) {
    const D = window.D;
    const key = monster.source === 'custom'
        ? `custom:${monster.id}`
        : String(monster._id);
    return (D.bestiaryFavorites || []).includes(key);
}
```

**window-Exports:**
```javascript
window.addBestiaryToInitiative = addBestiaryToInitiative;
window.addBestiaryToEncounter  = addBestiaryToEncounter;
window.toggleBestiaryFavorite  = toggleBestiaryFavorite;
window.isBestiaryFavorite      = isBestiaryFavorite;
window.getBestiaryMonster      = getBestiaryMonster;
```

---

### `assets/styles/bestiary.css` (CSS)

**Analog:** `assets/styles/npcs.css`

**CSS-Datei-Kopf-Pattern** (kopiert aus npcs.css Zeile 1):
```css
/* ========================================
   BESTIARY — LIST + DETAIL + STATBLOCK + EDITOR
   ======================================== */
```

**Layout-Pattern** — exakt von `npcs.css`, Zeilen 180–200:
```css
/* Hauptlayout: 1fr Liste + 825px Detail (wie .npc-layout) */
.bestiary-layout {
    display: grid;
    grid-template-columns: 1fr 825px;
    gap: 0;
    flex: 1;
    overflow: hidden;
}

.bestiary-master {
    overflow-y: auto;
    padding: 16px;
    background: var(--bg-dark);
}
```

**Listen-Item-Pattern** — exakt von `npcs.css`, Zeilen 202–222:
```css
.bestiary-list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--bg-card);
    border-radius: 10px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s;
}
.bestiary-list-item:hover   { background: var(--bg-elevated); }
.bestiary-list-item.selected { border-color: var(--gold); background: var(--bg-elevated); }
```

**Detail-Panel-Pattern** — exakt von `npcs.css`, Zeilen 297–326:
```css
.bestiary-detail {
    background: var(--bg-card);
    border-left: 1px solid var(--border);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: calc(100vh - 120px);
    align-self: start;
}
.bestiary-detail-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-dim); }
.bestiary-detail-empty-icon { font-size: 3em; margin-bottom: 12px; opacity: 0.3; }
.bestiary-detail-empty-text { font-size: 0.9em; }
```

**Statblock-Parchment** — WIEDERVERWENDET `.read-aloud.parchment` aus `assets/styles/party.css`, Zeilen 394–399:
```css
/* Kein neues CSS nötig — im Template: class="bestiary-statblock read-aloud parchment" */
/* Eigene Bestiary-Überschriften (klassisches 5e-Rot): */
.bestiary-statblock-section-heading {
    font-size: 16px; font-weight: 700;
    color: var(--red);              /* var(--red) = #ef4444 */
    font-family: Georgia, 'Times New Roman', serif;
    border-bottom: 1px solid var(--red);
    margin: 12px 0 6px 0;
}
```

**Badges (SRD / Eigen):**
```css
.bestiary-badge { font-size: 0.65em; padding: 4px 8px; border-radius: 4px; font-weight: 700; }
.bestiary-badge.srd    { background: var(--bg-elevated); color: var(--text-dim); }
.bestiary-badge.custom { background: var(--gold-dim);    color: var(--bg-dark); }
```

**Favoriten-Stern:**
```css
.bestiary-fav        { color: var(--text-dim); font-size: 1.1em; cursor: pointer; padding: 4px; background: none; border: none; }
.bestiary-fav.active { color: var(--gold); }
```

**Clickable Dice (D-09):**
```css
.bestiary-dice { color: var(--cyan); cursor: pointer; text-decoration: underline dotted; }
.bestiary-dice:hover { color: var(--gold); }
```

**@import-Eintrag in `assets/styles.css`** — nach `@import url('styles/tools.css');`:
```css
@import url('styles/bestiary.css');
```

---

### `assets/templates/view-bestiary.html` (HTML-Template)

**Analog:** NPC-Sektion in `assets/templates/view-content.html`, Zeilen 1–46

**Exaktes Struktur-Pattern** (kopieren und mit `bestiary-` prefixen):
```html
<!-- BESTIARY VIEW - Master-Detail Layout -->
<section id="view-bestiary" class="view bestiary-view">
    <div class="section-toolbar">
        <!-- Gruppe 1: Identität -->
        <div class="section-toolbar-identity">
            <span class="section-toolbar-title">🐉 Bestiar</span>
            <span class="section-toolbar-count" id="bestiary-count">0</span>
        </div>
        <!-- Gruppe 2: Suche -->
        <div class="section-toolbar-search">
            <div class="search-wrapper">
                <input type="text" id="bestiary-search" class="toolbar-search"
                       placeholder="🔍 Monster suchen..."
                       data-action="search-input" data-render="renderBestiaryList">
                <button class="search-clear-btn" data-action="clear-search"
                        data-value="bestiary-search" title="Suche leeren">✕</button>
            </div>
        </div>
        <!-- Gruppe 3: Filter -->
        <div class="section-toolbar-filters">
            <label>HG</label>
            <select id="bestiary-filter-cr" data-action="search-input" data-render="renderBestiaryList">
                <option value="">Alle</option>
                <!-- Optionen via JS befüllen -->
            </select>
            <label>Typ</label>
            <select id="bestiary-filter-type" data-action="search-input" data-render="renderBestiaryList">
                <option value="">Alle</option>
            </select>
            <label class="bestiary-filter-chip">
                <input type="checkbox" id="bestiary-filter-custom"
                       data-action="search-input" data-render="renderBestiaryList">
                Nur Eigene
            </label>
            <label class="bestiary-filter-chip">
                <input type="checkbox" id="bestiary-filter-favs"
                       data-action="search-input" data-render="renderBestiaryList">
                Favoriten
            </label>
        </div>
        <!-- Gruppe 4: Primäre Aktion -->
        <div class="section-toolbar-actions">
            <button class="btn btn-success" data-action="call" data-value="openBestiaryEditor">+ Neue Kreatur</button>
        </div>
    </div>

    <!-- Master-Detail Layout -->
    <div class="bestiary-layout">
        <!-- Liste (Master) -->
        <div class="bestiary-master">
            <div class="bestiary-list" id="bestiary-list"></div>
        </div>
        <!-- Detail-Sidebar -->
        <div class="bestiary-detail" id="bestiary-detail-panel">
            <div class="bestiary-detail-empty">
                <div class="bestiary-detail-empty-icon">🐉</div>
                <div class="bestiary-detail-empty-text">Wähle ein Monster aus der Liste</div>
            </div>
        </div>
    </div>
</section>
```

**Tab-Button in `assets/templates/header.html`** — nach dem letzten `<button class="nav-tab"` vor dem Debug-Knopf:
```html
<button class="nav-tab" data-view="bestiary" draggable="true" role="tab" aria-selected="false">🐉 Bestiar</button>
```

---

### `systems/tab-registry.js` (Änderung)

**Analog:** Existierende Einträge in `systems/tab-registry.js`, Zeilen 7–92

**Neuer Eintrag** — nach `dmscreen`-Eintrag (Zeile 92), vor der schließenden `};`:
```javascript
bestiary: {
    renders: ['renderBestiaryList'],
    init: null,
    cleanup: 'cleanupBestiaryEditor'   // Schließt offenen Editor beim Tab-Verlassen
}
```

**Regel:** Niemals direkt in `switchView()` eintragen — ausschließlich über `TAB_RENDER_REGISTRY` (CLAUDE.md-Architektur, `systems/tab-registry.js` Zeilen 94–137).

---

### `systems/spellslots/version-migration.js` (Änderung)

**Analog:** Bestehendes `MIGRATIONS`-Objekt, Zeilen 9–66

**Neuer Migrations-Eintrag** nach `'2.6.1'`-Eintrag (Zeile 65), vor der schließenden `}`-Klammer des `MIGRATIONS`-Objekts:
```javascript
'3.0.0': data => {
    // Phase 3: Bestiary — eigene Kreaturen und Favoriten initialisieren
    if (!data.bestiary)          data.bestiary          = [];
    if (!data.bestiaryFavorites) data.bestiaryFavorites = [];
    return data;
}
```

**Regel:** Exakt dasselbe Muster wie `'2.6.1'`-Migration (Zeilen 52–65) — prüfe ob Feld fehlt, setze Default, gib `data` zurück.

---

### `core/data.js` (Änderung)

**Analog:** Bestehendes `initializeData()` in `core/data.js`, Zeilen 2–38

**Ergänzung** in `initializeData()` nach `_nextId: {}` (Zeile 37), vor der schließenden `}`:
```javascript
// Phase 3: Bestiary
bestiary: [],            // Eigene Kreaturen (CRUD + Undo + Export)
bestiaryFavorites: []    // Nur ID-Keys (SRD: String-Key, Eigene: 'custom:123')
```

**Regel:** SRD-Daten gehören NICHT hier rein — nur `D.bestiary` (eigene Kreaturen) und `D.bestiaryFavorites` (ID-Liste).

---

### `features/encounters/monster-templates.js` (Änderung)

**Analog:** `core/srd-spells.js` — Alias-Muster

**Empfohlene Änderung** (CONTEXT.md Discretion — `monster-templates.js` auf Bestiary umlenken):
```javascript
// Nach Einführung von srd-monsters.js:
// getMonsterTemplates() als Alias auf getSRDMonsters() setzen
// damit kein toter Code entsteht (CLAUDE.md: kein toter Code zurücklassen)
function getMonsterTemplates() {
    if (_monsterTemplatesCache) return _monsterTemplatesCache;
    // Alias: Daten kommen jetzt aus srd-monsters.js
    _monsterTemplatesCache = getSRDMonsters().reduce((acc, m) => {
        if (m._id) acc[m._id] = m;
        return acc;
    }, {});
    return _monsterTemplatesCache;
}
// loadMonsterTemplate()-Aufruf im Encounter-Tab:
// data-action umlenken auf openBestiaryForEncounter(key)
```

---

## Geteilte Muster (Shared Patterns)

### XSS-Schutz: sanitizeHTML() vs. esc()

**Quelle:** `features/encounters/encounters-crud.js`, Zeile 81 + CLAUDE.md
**Anwenden auf:** Alle Render-Funktionen in `bestiary-render.js`, `bestiary-editor.js`

```javascript
// Statblock-Texte (Traits, Aktionen) — enthalten bewusstes <b>-Markup
container.innerHTML = `<div>${sanitizeHTML(monster.traits)}</div>`;   // RICHTIG

// Nutzerdefinierte Textnamen (Name, Typ, CR) — kein HTML erlaubt
container.innerHTML = `<span>${esc(monster.name)}</span>`;            // RICHTIG

// NIEMALS:
container.innerHTML = `<div>${monster.traits}</div>`;                 // XSS-Risiko
```

### saveUndoState() vor jeder Mutation

**Quelle:** CLAUDE.md Patterns + `utils/crud-helpers.js`, Zeile 42
**Anwenden auf:** `saveBestiary()`, `deleteBestiaryEntry()`, `toggleBestiaryFavorite()`, `addBestiaryToEncounter()`

```javascript
saveUndoState('Kreatur angelegt');
D.bestiary.push(creature);
save();
```

### parseEntityId() für alle ID-Vergleiche

**Quelle:** `utils/crud-helpers.js`, Zeile 14; CLAUDE.md
**Anwenden auf:** Alle `findIndex`/`find`-Operationen in `bestiary-crud.js`

```javascript
const idx = D.bestiary.findIndex(x => x.id === parseEntityId(id));  // RICHTIG
// NICHT: x.id === id  (String vs. Number-Mismatch)
```

### CR-Vergleich via crToSortValue()

**Quelle:** `features/encounter-calculator.js` → `CR_TO_XP` (Zeilen 32–60)
**Anwenden auf:** `renderBestiaryList()` Sortierung, Filter-Dropdown-Befüllung

```javascript
// CR_TO_XP-Schlüsselreihenfolge als Sortiergrundlage nutzen
const CR_SORT_ORDER = { '0': 0, '1/8': 0.125, '1/4': 0.25, '1/2': 0.5,
    '1': 1, '2': 2, /* ... */ '30': 30 };
function crToSortValue(cr) {
    return CR_SORT_ORDER[String(cr)] ?? parseFloat(cr) ?? 0;
}
```

### Build/Loader-Sync: Neue Module in BEIDEN Dateien

**Quelle:** `build.py` Zeilen 40–155 + `loader.js` Zeilen 10–133
**Anwenden auf:** Alle 5 neuen JS-Dateien

| Neue Datei | Position in build.py | Position in loader.js |
|-----------|----------------------|----------------------|
| `core/srd-monsters.js` | nach `core/srd-spells.js` (Zeile 131) | nach `core/srd-spells.js` (Zeile 104) |
| `features/bestiary/bestiary-render.js` | nach `features/encounters/encounters-crud.js` (Zeile 105) | identisch |
| `features/bestiary/bestiary-crud.js` | nach `bestiary-render.js` | identisch |
| `features/bestiary/bestiary-editor.js` | nach `bestiary-crud.js` | identisch |
| `features/bestiary/bestiary-actions.js` | nach `bestiary-editor.js` | identisch |

Kommentar-Block in build.py (Muster von Zeile 85: `# NPC-Module`):
```python
# Bestiary-Module (Phase 3)
'features/bestiary/bestiary-render.js',
'features/bestiary/bestiary-crud.js',
'features/bestiary/bestiary-editor.js',
'features/bestiary/bestiary-actions.js',
```

### Modul-Kopf-Konvention

**Quelle:** `features/encounters/encounters-crud.js`, Zeile 1–3; `core/srd-spells.js`, Zeile 1–4
**Anwenden auf:** Alle neuen JS-Dateien

```javascript
// [SECTION:MODUL_NAME]
// ============================================================
// BESCHREIBUNG — @schlüsselwörter
// ============================================================
```

### Defensive Render-Funktion (Container-Check)

**Quelle:** `features/npcs/npc-render.js`, Zeile 53–55
**Anwenden auf:** Alle `render*()`-Funktionen in `bestiary-render.js`

```javascript
function renderBestiaryList() {
    const container = $('bestiary-list');
    if (!container) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            console.warn('[renderBestiaryList] Container #bestiary-list fehlt — vermutlich nicht auf Bestiary-Tab');
        }
        return;
    }
    // ... Rest der Funktion
}
```

### Kein `const X = window.X` innerhalb von Funktionen

**Quelle:** CLAUDE.md → „Duplicate Declaration Debugging Pattern"
**Anwenden auf:** Alle neuen Module

```javascript
// FALSCH — SyntaxError im Build:
function myFunction() {
    const save = window.save;
    save();
}

// RICHTIG — direkter window-Zugriff oder var auf Modul-Top-Level:
var save = window.save;                 // Top-Level: erlaubt
function myFunction() {
    if (typeof window.save === 'function') window.save();  // In-Function: erlaubt
}
```

---

## Kein Analog gefunden

Alle Dateien dieser Phase haben Analoge im Codebase. Keine Einträge in dieser Sektion.

---

## Metadaten

**Analog-Suchbereich:** `core/`, `features/`, `systems/`, `utils/`, `ui/`, `assets/`
**Gelesene Dateien:** 18 Quelldateien + 3 Planungsdokumente
**Muster-Extraktion:** 2026-06-13

**Wichtigste Leitlinie für den Planer:**
- Das NPC-Tab (`features/npcs/npc-render.js` + `assets/styles/npcs.css` + NPC-Sektion in `view-content.html`) ist der exakte Blaupausen-Clone für das Bestiary-Layout.
- `core/srd-spells.js` ist der exakte Clone für `core/srd-monsters.js` — Lazy-Cache, globaler Scope, nie in `D`.
- `addCalculatorToInitiative()` liefert die exakten Zeilen für Auto-Init-Wurf, HP-Variation ±10% und Nummerierung — kein Neubau nötig.
- `.read-aloud.parchment` aus `party.css` wird im Statblock-Panel wiederverwendet — kein neues Parchment-CSS.
